(function(){
    function createSync(ctx){
        let lastSave = '';
        let versionRemotaConocida = 0;
        let cambioLocal = false;
        let conflictoRemoto = false;
        let modoLocalInicio = false;
        let colaGuardado = Promise.resolve();
        let avisoPendienteMostrado = false;

        const getData = ctx.getData;

        function guardarPendienteLocal(json) {
            try {
                localStorage.setItem('planificador_v5_8_pendiente', json);
                localStorage.setItem('planificador_v5_8_pendiente_ts', new Date().toISOString());
            } catch(e) {}
            cambioLocal = true;
        }
        function leerPendienteLocal() {
            try {
                const json = localStorage.getItem('planificador_v5_8_pendiente');
                if (!json) return null;
                return {
                    json,
                    fecha: localStorage.getItem('planificador_v5_8_pendiente_ts') || ''
                };
            } catch(e) {
                return null;
            }
        }
        function limpiarPendienteLocal() {
            try {
                localStorage.removeItem('planificador_v5_8_pendiente');
                localStorage.removeItem('planificador_v5_8_pendiente_ts');
            } catch(e) {}
            avisoPendienteMostrado = false;
        }
        function escapeHTML(txt) {
            const mapa = {
                '&':'&amp;',
                '<':'&lt;',
                '>':'&gt;',
                '"':'&quot;',
                "'":'&#039;'
            };
            return String(txt ?? '').replace(/[&<>"']/g, m => mapa[m] || m);
        }
        function descargarPendienteLocal(pendiente) {
            if (!pendiente?.json) return;
            const blob = new Blob([pendiente.json], {type:'application/json;charset=utf-8'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Respaldo_Cambios_Locales_Pendientes_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(()=>URL.revokeObjectURL(url), 500);
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
                _payloadJson: String(json || ''),
                _version: Number(data._version) || Date.now(),
                _versionBase: Number(data._versionBase) || 0,
                _savedBy: String(data._savedBy || window._usuarioActual || 'usuario'),
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
        function resumenContenido(data) {
            const tempData = data?.temporadaData && typeof data.temporadaData === 'object' ? data.temporadaData : {};
            const temporadas = Object.values(tempData);
            const suma = (campo) => temporadas.reduce((acc,t)=>acc+(Array.isArray(t?.[campo])?t[campo].length:0),0);
            return {
                planificaciones:(Array.isArray(data?.planificaciones)?data.planificaciones.length:0)+suma('planificaciones'),
                carreras:(Array.isArray(data?.carreras)?data.carreras.length:0)+suma('carreras'),
                secciones:(Array.isArray(data?.secciones)?data.secciones.length:0)+suma('secciones'),
                asignaturas:(Array.isArray(data?.asignaturas)?data.asignaturas.length:0)+suma('asignaturas'),
                docentes:(Array.isArray(data?.docentes)?data.docentes.length:0)+suma('docentes'),
                salas:(Array.isArray(data?.salas)?data.salas.length:0)+suma('salas')
            };
        }
        function esSobrescrituraRegresiva(local, remoto) {
            const l = resumenContenido(local);
            const r = resumenContenido(remoto);
            if (r.planificaciones > 0 && l.planificaciones < r.planificaciones) return true;
            const totalLocal = l.carreras + l.secciones + l.asignaturas + l.docentes + l.salas;
            const totalRemoto = r.carreras + r.secciones + r.asignaturas + r.docentes + r.salas;
            return totalRemoto > 0 && totalLocal === 0;
        }
        function validarSobrescrituraSegura({local, remoto, versionRemota, versionBase, opciones}) {
            if (opciones.sobrescribirRemoto === true) return;
            if (versionRemota > versionBase && esSobrescrituraRegresiva(local, remoto)) {
                const err = new Error('sobrescritura-regresiva');
                err.remoto = remoto;
                throw err;
            }
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
        function cargarLocal(data) {
            try {
                const d = JSON.parse(localStorage.getItem('planificador_v5_8'));
                if (d) {
                    Object.assign(data, d);
                    data.configuracion = Object.assign({}, JSON.parse(JSON.stringify(ctx.CONFIG_DEFAULT)), data.configuracion);
                    data.auditoria = data.auditoria || [];
                    data.temporadas = data.temporadas || [];
                    data.temporadaData = data.temporadaData || {};
                    return true;
                }
            } catch(e) {}
            return false;
        }
        function hayDatosLocales() {
            try { return !!localStorage.getItem('planificador_v5_8'); } catch(e) { return false; }
        }
        function pedirModoLocal(error, hayLocal) {
            return new Promise(resolve => {
                const container = document.getElementById('modalContainer');
                if (!container) {
                    resolve(hayLocal && confirm('No se pudo conectar con Firebase. ¿Usar los datos locales de este navegador?'));
                    return;
                }
                const descripcion = describirErrorFirebase(error);
                container.innerHTML = `
                <div class="modal-overlay" id="modalOverlay"><div class="modal">
                    <h3>Sincronizando con la nube</h3>
                    <p style="font-size:0.9rem;color:var(--text-secondary);margin:0 0 12px;">
                        No se pudo conectar con Firebase. Para evitar sobrescribir datos de la nube, la app no cargará datos locales sin tu autorización.
                    </p>
                    <div class="alert-info" style="margin-bottom:12px;">${descripcion}</div>
                    <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
                        <button class="btn btn-sm" id="syncRetryFirebase">Reintentar</button>
                        <button class="btn btn-primary btn-sm" id="syncUseLocal">${hayLocal ? 'Usar modo local' : 'Iniciar vacío local'}</button>
                    </div>
                </div></div>`;
                const cerrar = (valor) => {
                    container.innerHTML = '';
                    resolve(valor);
                };
                document.getElementById('syncRetryFirebase').onclick = () => cerrar('retry');
                document.getElementById('syncUseLocal').onclick = () => cerrar('local');
            });
        }
        function pedirResolucionPendiente(pendiente, remoto) {
            return new Promise(resolve => {
                const container = document.getElementById('modalContainer');
                const fecha = pendiente?.fecha ? new Date(pendiente.fecha).toLocaleString() : 'fecha no disponible';
                const quien = remoto?._savedBy || 'otro usuario';
                const version = remoto?._version ? new Date(Number(remoto._version)).toLocaleString() : 'sin fecha remota';
                if (!container) {
                    const subir = confirm(`Hay cambios locales pendientes (${fecha}).\n\nAceptar: subir tus cambios locales a Firebase.\nCancelar: no sincronizar ahora.`);
                    resolve(subir ? 'upload' : 'cancel');
                    return;
                }
                container.innerHTML = `
                <div class="modal-overlay" id="modalOverlay"><div class="modal modal-wide">
                    <div class="modal-header">
                        <h3>Resolver sincronización pendiente</h3>
                        <p>No voy a reemplazar tu trabajo local con la nube sin una decisión explícita.</p>
                    </div>
                    <div class="alert-info" style="margin-bottom:12px;">
                        Tienes cambios locales guardados en este navegador desde <strong>${escapeHTML(fecha)}</strong>.
                        La nube tiene una versión guardada por <strong>${escapeHTML(quien)}</strong> (${escapeHTML(version)}).
                    </div>
                    <p style="font-size:0.84rem;color:var(--text-secondary);line-height:1.45;margin-top:0;">
                        Para proteger tu avance, elige si quieres subir estos cambios locales, descartar el avance local y cargar Firebase, o descargar un respaldo antes de decidir.
                    </p>
                    <div class="modal-actions" style="justify-content:space-between;gap:8px;flex-wrap:wrap;">
                        <button class="btn" id="syncExportPending">Exportar respaldo local</button>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
                            <button class="btn" id="syncCancelPending">Cancelar</button>
                            <button class="btn btn-danger" id="syncDiscardLocal">Descartar local y cargar nube</button>
                            <button class="btn btn-primary" id="syncUploadLocal">Subir cambios locales</button>
                        </div>
                    </div>
                </div></div>`;
                const cerrar = (valor) => {
                    container.innerHTML = '';
                    resolve(valor);
                };
                document.getElementById('syncExportPending').onclick = () => {
                    descargarPendienteLocal(pendiente);
                    ctx.toast?.('Respaldo local descargado', 'success');
                };
                document.getElementById('syncCancelPending').onclick = () => cerrar('cancel');
                document.getElementById('syncDiscardLocal').onclick = () => {
                    if (confirm('Esto descartará los cambios locales pendientes y cargará la versión de Firebase. ¿Continuar?')) cerrar('discard');
                };
                document.getElementById('syncUploadLocal').onclick = () => cerrar('upload');
            });
        }
        function instalarSnapshot(ref, onSnapshot) {
            onSnapshot(ref, (snapLive) => {
                if (!snapLive.exists()) return;
                const remoto = leerPayloadFirestore(snapLive.data());
                const jsonRemoto = JSON.stringify(remoto);
                if (cambioLocal && jsonRemoto === lastSave) { cambioLocal = false; versionRemotaConocida = Number(remoto._version)||versionRemotaConocida; ctx.setSyncStatus?.('online'); return; }
                if (cambioLocal) cambioLocal = false;
                if (jsonRemoto === lastSave) return;
                const pendiente = leerPendienteLocal();
                if (pendiente?.json && pendiente.json !== jsonRemoto) {
                    conflictoRemoto = true;
                    versionRemotaConocida = Math.max(versionRemotaConocida, Number(remoto._version)||0);
                    ctx.setCambiosPendientes?.(true);
                    ctx.setSyncStatus?.('warning','Pendiente local');
                    ctx.setSaveStatus?.('error','Pendiente local',false);
                    if (!avisoPendienteMostrado) {
                        avisoPendienteMostrado = true;
                        ctx.toast('Hay cambios locales pendientes. No se aplicó la nube para proteger tu avance.', 'error');
                    }
                    return;
                }
                if (conflictoRemoto) {
                    versionRemotaConocida = Math.max(versionRemotaConocida, Number(remoto._version)||0);
                    ctx.setSyncStatus?.('warning');
                    ctx.toast('Hay cambios en la nube y cambios locales pendientes. Sincroniza desde el menú antes de continuar.', 'error');
                    return;
                }
                if (!remoto._version || remoto._version > (getData()._version || 0)) {
                    aplicarRemoto(remoto, jsonRemoto);
                    ctx.normalizarDatos?.();
                    ctx.reconstruirIndices(); ctx.refrescarTodo();
                    ctx.setSyncStatus?.('online');
                    ctx.setCambiosPendientes?.(false);
                    const quien = remoto._savedBy || 'El otro usuario';
                    ctx.toast(`🔄 ${quien} actualizó los datos`, 'info');
                }
            });
        }
        async function recargarDesdeFirestore(silencioso=false) {
            const opciones = typeof silencioso === 'object' ? silencioso : { silencioso: !!silencioso };
            try {
                ctx.setSyncStatus?.('waiting');
                const { db, doc, getDoc } = window._fb;
                const ref = doc(db, 'planificador', 'datos');
                const snap = await getDoc(ref);
                if (!snap.exists()) { ctx.setSyncStatus?.('online'); return false; }
                const remoto = leerPayloadFirestore(snap.data());
                const jsonRemoto = JSON.stringify(remoto);
                const pendiente = leerPendienteLocal();
                if (pendiente?.json && pendiente.json !== jsonRemoto && !opciones.descartarLocal) {
                    ctx.setSyncStatus?.('warning','Pendiente local');
                    ctx.setSaveStatus?.('error','Pendiente local',false);
                    const decision = await pedirResolucionPendiente(pendiente, remoto);
                    if (decision === 'cancel') {
                        ctx.setCambiosPendientes?.(true);
                        return false;
                    }
                    if (decision === 'upload') {
                        modoLocalInicio = false;
                        conflictoRemoto = false;
                        const ok = await guardar({forzar:true, sobrescribirRemoto:true});
                        if (ok) ctx.toast('Cambios locales subidos a Firebase','success');
                        return ok;
                    }
                    if (decision !== 'discard') return false;
                }
                aplicarRemoto(remoto, jsonRemoto);
                modoLocalInicio = false;
                conflictoRemoto = false;
                cambioLocal = false;
                limpiarPendienteLocal();
                ctx.reconstruirIndices(); ctx.refrescarTodo();
                ctx.setSyncStatus?.('online');
                ctx.setCambiosPendientes?.(false);
                if(!opciones.silencioso) ctx.toast('Datos sincronizados con la nube','success');
                return true;
            } catch(e) {
                ctx.setSyncStatus?.('warning');
                console.warn('Error al sincronizar desde la nube:', e);
                if(!opciones.silencioso) ctx.toast(describirErrorFirebase(e),'error');
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
            if (modoLocalInicio && !opciones.forzar) {
                try { localStorage.setItem('planificador_v5_8', json); } catch(e) {}
                guardarPendienteLocal(json);
                ctx.setCambiosPendientes?.(true);
                ctx.setSyncStatus?.('warning','Modo local');
                ctx.setSaveStatus?.('error','Guardado local',false);
                return false;
            }
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
                            validarSobrescrituraSegura({local:snapshot, remoto, versionRemota, versionBase, opciones});
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
                        validarSobrescrituraSegura({local:snapshot, remoto, versionRemota, versionBase, opciones});
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
                try { localStorage.setItem('planificador_v5_8', json); } catch(e) {}
                limpiarPendienteLocal();
                ctx.setCambiosPendientes?.(false);
                ctx.setSyncStatus?.('online');
                ctx.setSaveStatus?.('success','✓ Guardado');
                return true;
            } catch(e) {
                if (e?.message === 'sobrescritura-regresiva') {
                    conflictoRemoto = true;
                    guardarPendienteLocal(json);
                    ctx.setSyncStatus?.('warning');
                    ctx.setSaveStatus?.('error','Sincroniza primero',false);
                    const quien = e.remoto?._savedBy || 'otro usuario';
                    ctx.toast(`${quien} tiene una versión más nueva con más planificación. Sincroniza antes de guardar para no borrar avances.`, 'error');
                    return false;
                }
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
                guardarPendienteLocal(json);
                ctx.setCambiosPendientes?.(true);
                ctx.setSyncStatus?.('warning');
                ctx.setSaveStatus?.('error','Guardado local',false);
                ctx.toast(`${describirErrorFirebase(e)} Tus cambios quedaron guardados localmente.`, 'error');
                return false;
            }
        }
        async function reintentarPendienteLocal() {
            const pendiente = leerPendienteLocal();
            if (!pendiente?.json) return false;
            if (conflictoRemoto) {
                ctx.setSyncStatus?.('warning','Pendiente local');
                return false;
            }
            try {
                const actual = JSON.stringify(crearSnapshotCompartido(getData()));
                if (actual !== pendiente.json) {
                    ctx.setSyncStatus?.('warning','Pendiente local');
                    ctx.setCambiosPendientes?.(true);
                    return false;
                }
                ctx.setSyncStatus?.('saving','Reconectando');
                const ok = await guardar({reintentoPendiente:true});
                if (ok) ctx.toast('Cambios locales sincronizados con Firebase','success');
                return ok;
            } catch(e) {
                ctx.setSyncStatus?.('warning','Pendiente local');
                return false;
            }
        }
        if (typeof window !== 'undefined' && !window._planificadorSyncRetryInstalado) {
            window._planificadorSyncRetryInstalado = true;
            window.addEventListener('online', () => {
                setTimeout(() => reintentarPendienteLocal(), 800);
            });
        }
        async function cargar() {
            const data = getData();
            let conectadoNube = false;
            while (!conectadoNube) {
                ctx.setSyncStatus?.('waiting','Sincronizando');
                ctx.setSaveStatus?.('saving','Sincronizando con la nube...',false);
                const { db, doc, getDoc, onSnapshot } = window._fb;
                const ref = doc(db, 'planificador', 'datos');
                try {
                    const snap = await getDoc(ref);
                    if (snap.exists()) {
                        aplicarRemoto(snap.data());
                        ctx.normalizarDatos?.();
                        ctx.reconstruirIndices?.();
                    }
                    ctx.setSyncStatus?.('online');
                    ctx.setCambiosPendientes?.(false);
                    ctx.setSaveStatus?.('success','✓ Sincronizado');
                    modoLocalInicio = false;
                    instalarSnapshot(ref, onSnapshot);
                    conectadoNube = true;
                } catch(e) {
                    ctx.setSyncStatus?.('warning','Sin sincronizar');
                    ctx.setSaveStatus?.('error','Sin sincronizar',false);
                    console.warn('Sincronización inicial no disponible:', e);
                    const decision = await pedirModoLocal(e, hayDatosLocales());
                    if (decision === 'retry') continue;
                    if (decision === 'local') {
                        cargarLocal(data);
                        modoLocalInicio = true;
                        ctx.setSyncStatus?.('warning','Modo local');
                        ctx.setSaveStatus?.('error','Modo local',false);
                        ctx.toast('Modo local activado. Los datos de este navegador no reemplazarán la nube hasta que guardes o sincronices intencionalmente.', 'info');
                    }
                    break;
                }
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
            const pendiente = leerPendienteLocal();
            if (!modoLocalInicio && pendiente?.json && pendiente.json !== lastSave) {
                ctx.setCambiosPendientes?.(true);
                ctx.setSyncStatus?.('warning','Pendiente local');
                ctx.setSaveStatus?.('error','Pendiente local',false);
                setTimeout(() => recargarDesdeFirestore({silencioso:true}), 350);
            }
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
