(function(){
    function createSync(ctx){
        let lastSave = '';
        let versionRemotaConocida = 0;
        let cambioLocal = false;
        let conflictoRemoto = false;
        let colaGuardado = Promise.resolve();

        const getData = ctx.getData;

        function guardarPendienteLocal(json) {
            try {
                localStorage.setItem('planificador_v5_8_pendiente', json);
                localStorage.setItem('planificador_v5_8_pendiente_ts', new Date().toISOString());
            } catch(e) {}
        }
        function snapshotTemporadaActual(data) {
            const id = data.sel?.temporadaId || data.configuracion?.temporadaActualId || data.temporadas?.[0]?.id;
            if (!id) return;
            data.temporadaData = data.temporadaData || {};
            data.temporadaData[id] = {
                carreras:data.carreras || [],
                niveles:data.niveles || [],
                secciones:data.secciones || [],
                asignaturas:data.asignaturas || [],
                docentes:data.docentes || [],
                salas:data.salas || [],
                asignaturaCarreraNivel:data.asignaturaCarreraNivel || [],
                asignaturaSeccion:data.asignaturaSeccion || [],
                planificaciones:data.planificaciones || [],
                gruposDictacion:data.gruposDictacion || [],
                gestorSecciones:data.gestorSecciones || {cargas:[],ids:[],ultimaCargaId:null}
            };
        }
        function aplicarTemporadaActivaLocal(data) {
            const preferida = ctx.getTemporadaPreferida?.();
            const id = preferida || data.sel?.temporadaId || data.configuracion?.temporadaActualId || data.temporadas?.[0]?.id;
            if (!id) return;
            data.sel = data.sel || {};
            data.configuracion = data.configuracion || {};
            data.sel.temporadaId = id;
            data.configuracion.temporadaActualId = id;
            const temp = data.temporadaData?.[id];
            if (!temp) return;
            data.carreras = temp.carreras || [];
            data.niveles = temp.niveles || [];
            data.secciones = temp.secciones || [];
            data.asignaturas = temp.asignaturas || [];
            data.docentes = temp.docentes || [];
            data.salas = temp.salas || [];
            data.asignaturaCarreraNivel = temp.asignaturaCarreraNivel || [];
            data.asignaturaSeccion = temp.asignaturaSeccion || [];
            data.planificaciones = temp.planificaciones || [];
            data.gruposDictacion = temp.gruposDictacion || [];
            data.gestorSecciones = temp.gestorSecciones || {cargas:[],ids:[],ultimaCargaId:null};
        }
        function crearSnapshotCompartido(data) {
            snapshotTemporadaActual(data);
            const snapshot = JSON.parse(JSON.stringify(data));
            snapshot.sel = snapshot.sel || {};
            snapshot.configuracion = snapshot.configuracion || {};
            snapshot.sel.temporadaId = null;
            delete snapshot.configuracion.temporadaActualId;
            return snapshot;
        }
        function crearPayloadFirestore(json, data) {
            return {
                _schema: 'planificador-json-v1',
                _payloadJson: json,
                _version: Number(data._version) || Date.now(),
                _versionBase: Number(data._versionBase) || 0,
                _savedBy: data._savedBy || window._usuarioActual || 'usuario',
                _savedAt: new Date().toISOString()
            };
        }
        function leerPayloadFirestore(remoto) {
            if (remoto && remoto._schema === 'planificador-json-v1' && typeof remoto._payloadJson === 'string') {
                try {
                    const dataRemota = JSON.parse(remoto._payloadJson);
                    dataRemota._version = Number(remoto._version) || Number(dataRemota._version) || 0;
                    dataRemota._versionBase = Number(remoto._versionBase) || Number(dataRemota._versionBase) || 0;
                    dataRemota._savedBy = remoto._savedBy || dataRemota._savedBy || 'usuario';
                    return dataRemota;
                } catch(e) {
                    console.warn('No se pudo leer el paquete remoto de Firestore:', e);
                    return remoto;
                }
            }
            return remoto;
        }
        function describirErrorFirebase(e) {
            const codigo = e?.code || e?.name || e?.message || 'error-desconocido';
            const mensaje = e?.message ? String(e.message).replace(/^FirebaseError:\s*/,'') : '';
            if (codigo === 'permission-denied') return 'Firestore rechazó el guardado: revisa las reglas.';
            if (codigo === 'failed-precondition') return 'Firestore no está listo o requiere crear índice/base de datos.';
            if (codigo === 'unavailable') return 'Firestore no respondió. Revisa conexión o disponibilidad.';
            if (codigo === 'not-found') return 'No se encontró la base/documento de Firestore.';
            if (codigo === 'unauthenticated') return 'La sesión no está autenticada para guardar.';
            return `Firestore: ${codigo}${mensaje ? ' · ' + mensaje : ''}`;
        }
        function aplicarRemoto(remoto, jsonRemoto) {
            remoto = leerPayloadFirestore(remoto);
            const data = getData();
            Object.assign(data, remoto);
            data.configuracion = Object.assign({}, JSON.parse(JSON.stringify(ctx.CONFIG_DEFAULT)), data.configuracion);
            data.auditoria = data.auditoria || [];
            data.temporadas = data.temporadas || [];
            data.temporadaData = data.temporadaData || {};
            aplicarTemporadaActivaLocal(data);
            lastSave = JSON.stringify(crearSnapshotCompartido(data));
            versionRemotaConocida = Number(data._version) || 0;
            conflictoRemoto = false;
        }
        async function recargarDesdeFirestore(silencioso=false) {
            try {
                ctx.setSyncStatus?.('waiting');
                const { db, doc, getDoc } = window._fb;
                const ref = doc(db, 'planificador', 'datos');
                const snap = await getDoc(ref);
                if (!snap.exists()) { ctx.setSyncStatus?.('online'); return false; }
                aplicarRemoto(snap.data());
                try { localStorage.removeItem('planificador_v5_8_pendiente'); localStorage.removeItem('planificador_v5_8_pendiente_ts'); } catch(e) {}
                ctx.reconstruirIndices(); ctx.refrescarTodo();
                ctx.setSyncStatus?.('online');
                ctx.setCambiosPendientes?.(false);
                if(!silencioso) ctx.toast('Datos sincronizados con la nube','success');
                return true;
            } catch(e) {
                ctx.setSyncStatus?.('warning');
                console.warn('Error al sincronizar desde la nube:', e);
                if(!silencioso) ctx.toast(describirErrorFirebase(e),'error');
                return false;
            }
        }
        function guardar(opciones={}) {
            colaGuardado = colaGuardado.then(()=>guardarAhora(opciones), ()=>guardarAhora(opciones));
            return colaGuardado;
        }
        async function guardarAhora(opciones={}) {
            const data = getData();
            ctx.reconstruirIndices();
            const versionBase = versionRemotaConocida || Number(data._version) || 0;
            data._versionBase = versionBase;
            data._version = Date.now();
            data._savedBy = window._usuarioActual || 'usuario';
            const snapshot = crearSnapshotCompartido(data);
            const json = JSON.stringify(snapshot);
            if (json === lastSave) return;
            ctx.setCambiosPendientes?.(true);
            ctx.setSyncStatus?.('saving');
            ctx.setSaveStatus?.('saving','Guardando...',false);
            if (conflictoRemoto && !opciones.forzar) {
                guardarPendienteLocal(json);
                ctx.setSyncStatus?.('warning');
                ctx.setSaveStatus?.('error','Pendiente local',false);
                ctx.toast('Hay un conflicto pendiente. Sincroniza desde el menú antes de seguir.', 'error');
                return false;
            }
            try {
                const { db, doc, setDoc, getDoc, runTransaction } = window._fb;
                const ref = doc(db, 'planificador', 'datos');
                const payload = crearPayloadFirestore(json, data);
                if (runTransaction) {
                    await runTransaction(db, async (transaction) => {
                        const snap = await transaction.get(ref);
                        if (snap.exists()) {
                            const remoto = leerPayloadFirestore(snap.data());
                            const versionRemota = Number(remoto._version) || 0;
                            if (!opciones.forzar && versionRemota > versionBase) {
                                const err = new Error('conflicto-remoto');
                                err.remoto = remoto;
                                throw err;
                            }
                        }
                        transaction.set(ref, payload);
                    });
                } else {
                    const snap = await getDoc(ref);
                    if (snap.exists()) {
                        const remoto = leerPayloadFirestore(snap.data());
                        const versionRemota = Number(remoto._version) || 0;
                        if (!opciones.forzar && versionRemota > versionBase) {
                            const err = new Error('conflicto-remoto');
                            err.remoto = remoto;
                            throw err;
                        }
                    }
                    await setDoc(ref, payload);
                }
                cambioLocal = true;
                lastSave = json;
                versionRemotaConocida = Number(data._version) || Date.now();
                conflictoRemoto = false;
                try { localStorage.setItem('planificador_v5_8', json); localStorage.removeItem('planificador_v5_8_pendiente'); localStorage.removeItem('planificador_v5_8_pendiente_ts'); } catch(e) {}
                ctx.setCambiosPendientes?.(false);
                ctx.setSyncStatus?.('online');
                ctx.setSaveStatus?.('success','✓ Guardado');
                return true;
            } catch(e) {
                if (e?.message === 'conflicto-remoto') {
                    conflictoRemoto = true;
                    guardarPendienteLocal(json);
                    ctx.setSyncStatus?.('warning');
                    ctx.setSaveStatus?.('error','Pendiente local',false);
                    const quien = e.remoto?._savedBy || 'otro usuario';
                    ctx.toast(`${quien} guardó cambios antes que tú. Sincroniza antes de seguir.`, 'error');
                    return false;
                }
                console.error('Error al guardar en la nube:', e);
                try { localStorage.setItem('planificador_v5_8', json); } catch(e2) {}
                ctx.setSyncStatus?.('warning');
                ctx.setSaveStatus?.('error','Guardado local',false);
                ctx.toast(`${describirErrorFirebase(e)} Tus cambios quedaron guardados localmente.`, 'error');
                return false;
            }
        }
        async function cargar() {
            const data = getData();
            try {
                ctx.setSyncStatus?.('saving');
                const { db, doc, getDoc, onSnapshot } = window._fb;
                const ref = doc(db, 'planificador', 'datos');
                const snap = await getDoc(ref);
                if (snap.exists()) aplicarRemoto(snap.data());
                ctx.setSyncStatus?.('online');
                ctx.setCambiosPendientes?.(false);
                onSnapshot(ref, (snapLive) => {
                    if (!snapLive.exists()) return;
                    const remoto = leerPayloadFirestore(snapLive.data());
                    const jsonRemoto = JSON.stringify(remoto);
                    if (cambioLocal && jsonRemoto === lastSave) { cambioLocal = false; versionRemotaConocida = Number(remoto._version)||versionRemotaConocida; ctx.setSyncStatus?.('online'); return; }
                    if (cambioLocal) cambioLocal = false;
                    if (jsonRemoto === lastSave) return;
                    if (conflictoRemoto) {
                        versionRemotaConocida = Math.max(versionRemotaConocida, Number(remoto._version)||0);
                        ctx.setSyncStatus?.('warning');
                        ctx.toast('Hay cambios en la nube y cambios locales pendientes. Sincroniza desde el menú antes de continuar.', 'error');
                        return;
                    }
                    if (!remoto._version || remoto._version > (getData()._version || 0)) {
                        aplicarRemoto(remoto, jsonRemoto);
                        ctx.reconstruirIndices(); ctx.refrescarTodo();
                        ctx.setSyncStatus?.('online');
                        ctx.setCambiosPendientes?.(false);
                        const quien = remoto._savedBy || 'El otro usuario';
                        ctx.toast(`🔄 ${quien} actualizó los datos`, 'info');
                    }
                });
            } catch(e) {
                ctx.setSyncStatus?.('waiting');
                console.warn('Sincronización no disponible, cargando desde localStorage:', e);
                try {
                    const d = JSON.parse(localStorage.getItem('planificador_v5_8'));
                    if (d) {
                        Object.assign(data, d);
                        data.configuracion = Object.assign({}, JSON.parse(JSON.stringify(ctx.CONFIG_DEFAULT)), data.configuracion);
                        data.auditoria = data.auditoria || [];
                        data.temporadas = data.temporadas || [];
                        data.temporadaData = data.temporadaData || {};
                    }
                } catch(e2) {}
            }
            if (!data.temporadas || !data.temporadas.length) {
                const anio = new Date().getFullYear();
                const mes = new Date().getMonth();
                const tempDefault = mes >= 2 && mes < 5 ? 'Otoño' : mes >= 5 && mes < 8 ? 'Invierno' : mes >= 8 && mes < 11 ? 'Primavera' : 'Verano';
                data.temporadas = [{id:ctx.genId(), temporada:tempDefault, anio}];
            }
            data.sel.temporadaId = data.sel.temporadaId || data.configuracion.temporadaActualId || data.temporadas[0]?.id;
            data.configuracion.temporadaActualId = data.sel.temporadaId;
            const tempId = data.sel.temporadaId;
            if (!data.temporadaData || !Object.keys(data.temporadaData).length) {
                snapshotTemporadaActual(data);
            } else if (!data.temporadaData[tempId]) {
                snapshotTemporadaActual(data);
            }
            aplicarTemporadaActivaLocal(data);
            if(!data.salas.find(s=>s.id===ctx.SALA_VIRTUAL_ID)) data.salas.push({id:ctx.SALA_VIRTUAL_ID,nombre:'Sala Virtual',capacidad:9999,esVirtual:true,fija:true});
            if(!data.salas.find(s=>s.id===ctx.SALA_TRO2_ID)) data.salas.push({id:ctx.SALA_TRO2_ID,nombre:'TRO2 (Terreno)',capacidad:9999,esVirtual:false,fija:true,ilimitada:true});
            ctx.normalizarDatos(); ctx.reconstruirIndices();
        }

        return {
            guardar,
            cargar,
            recargarDesdeFirestore,
            hayConflictoRemoto: () => conflictoRemoto
        };
    }

    window.PlanificadorSync = { create: createSync };
})();
