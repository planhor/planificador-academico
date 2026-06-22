(function(){
    function createSync(ctx){
        let lastSave = '';
        let versionRemotaConocida = 0;
        let cambioLocal = false;
        let conflictoRemoto = false;
        let modoLocalInicio = false;
        let guardadoEnCurso = false;
        let solicitudGuardadoPendiente = null;
        const revisionesLocalesRecientes = new Set();
        let avisoPendienteMostrado = false;
        let integridadRemotaAvisada = '';
        const FIRESTORE_CHUNK_SIZE = 700000;
        const RECOVERY_KEY = 'planificador_v5_8_recovery_snapshots';
        const RECOVERY_MAX = 7;
        const RECOVERY_MIN_INTERVAL = 2 * 60 * 1000;
        const LOCAL_DB_NAME = 'planhor_local_v1';
        const LOCAL_DB_STORE = 'sync';
        const LOCAL_KEYS = { estado:'estado', base:'base', pendiente:'pendiente', recuperaciones:'recuperaciones' };
        let localDbPromise = null;
        let localDbDisponible = false;
        let almacenLocalInicializado = false;
        const cacheLocal = { estado:null, base:null, pendiente:null, snapshots:[] };
        let estadoFormalSync='reconectando';
        let reintentoNumero=0;
        let reintentoTimer=null;
        let comparacionAutomaticaActiva=false;
        const RETRY_DELAYS=[800,2000,5000,10000,30000];

        const getData = ctx.getData;

        function establecerEstadoSync(estado,detalle=''){
            estadoFormalSync=estado;
            const mapa={
                local_modificado:['warning','Local modificado'],
                pendiente:['warning','Pendiente'],
                reconectando:['saving','Reconectando'],
                comparando:['waiting','Comparando'],
                sincronizado:['online','Sincronizado'],
                conflicto:['warning','Conflicto'],
                modo_local:['warning','Modo local'],
                sin_conexion:['offline','Sin conexión']
            };
            const [visual,texto]=mapa[estado]||['warning',estado];
            ctx.setSyncStatus?.(visual,detalle||texto);
            if(estado==='sincronizado') ctx.setSaveStatus?.('success','✓ Sincronizado');
        }
        function registrarUltimoRemoto(remoto){
            const fecha=remoto?._savedAt||(remoto?._version?new Date(Number(remoto._version)).toISOString():'');
            if(fecha) ctx.setLastRemoteSave?.(fecha,remoto?._savedBy||'usuario');
        }
        function reiniciarReintentos(){
            reintentoNumero=0;
            if(reintentoTimer){ clearTimeout(reintentoTimer); reintentoTimer=null; }
        }
        function registrarRevisionLocal(revisionId){
            const id=String(revisionId||'');
            if(!id) return;
            revisionesLocalesRecientes.add(id);
            while(revisionesLocalesRecientes.size>20){
                revisionesLocalesRecientes.delete(revisionesLocalesRecientes.values().next().value);
            }
        }

        function crearRevisionId() {
            if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
            return `rev_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;
        }
        function checksumRapido(texto) {
            let hash = 2166136261;
            for (let i=0; i<texto.length; i++) {
                hash ^= texto.charCodeAt(i);
                hash = Math.imul(hash, 16777619);
            }
            return `fnv1a32:${(hash>>>0).toString(16).padStart(8,'0')}`;
        }
        async function calcularChecksum(texto, formatoEsperado='') {
            const contenido = String(texto || '');
            if (String(formatoEsperado).startsWith('fnv1a32:')) return checksumRapido(contenido);
            const requiereSha = String(formatoEsperado).startsWith('sha256:');
            try {
                if (!globalThis.crypto?.subtle || typeof TextEncoder === 'undefined') return requiereSha ? '' : checksumRapido(contenido);
                const bytes = new TextEncoder().encode(contenido);
                const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
                return `sha256:${Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')}`;
            } catch(e) {
                return requiereSha ? '' : checksumRapido(contenido);
            }
        }
        function errorIntegridad(detalle) {
            const error = new Error(`payload-integridad:${detalle}`);
            error.code = 'payload-integrity';
            return error;
        }
        async function validarTextoPayload(remoto, texto) {
            const contenido = String(texto || '');
            const tieneLongitud = remoto?._payloadLength !== undefined && remoto?._payloadLength !== null;
            if (tieneLongitud && Number.isFinite(Number(remoto._payloadLength)) && Number(remoto._payloadLength) !== contenido.length) {
                throw errorIntegridad('longitud-invalida');
            }
            if (remoto?._payloadChecksum) {
                const checksum = await calcularChecksum(contenido, remoto._payloadChecksum);
                if (checksum && checksum !== remoto._payloadChecksum) throw errorIntegridad('checksum-invalido');
            }
            return contenido;
        }

        function abrirAlmacenLocal() {
            if (localDbPromise) return localDbPromise;
            localDbPromise = new Promise((resolve,reject)=>{
                if (!globalThis.indexedDB) return reject(new Error('indexeddb-no-disponible'));
                const req = globalThis.indexedDB.open(LOCAL_DB_NAME, 1);
                req.onupgradeneeded = () => {
                    const db = req.result;
                    if (!db.objectStoreNames.contains(LOCAL_DB_STORE)) db.createObjectStore(LOCAL_DB_STORE);
                };
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error || new Error('indexeddb-error'));
                req.onblocked = () => reject(new Error('indexeddb-bloqueado'));
            });
            return localDbPromise;
        }
        async function leerRegistroLocal(clave) {
            const db = await abrirAlmacenLocal();
            return new Promise((resolve,reject)=>{
                const req = db.transaction(LOCAL_DB_STORE,'readonly').objectStore(LOCAL_DB_STORE).get(clave);
                req.onsuccess = () => resolve(req.result ?? null);
                req.onerror = () => reject(req.error || new Error('indexeddb-lectura'));
            });
        }
        async function escribirRegistroLocal(clave, valor) {
            const db = await abrirAlmacenLocal();
            return new Promise((resolve,reject)=>{
                const tx = db.transaction(LOCAL_DB_STORE,'readwrite');
                tx.objectStore(LOCAL_DB_STORE).put(valor, clave);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => reject(tx.error || new Error('indexeddb-escritura'));
                tx.onabort = () => reject(tx.error || new Error('indexeddb-abortado'));
            });
        }
        async function eliminarRegistroLocal(clave) {
            const db = await abrirAlmacenLocal();
            return new Promise((resolve,reject)=>{
                const tx = db.transaction(LOCAL_DB_STORE,'readwrite');
                tx.objectStore(LOCAL_DB_STORE).delete(clave);
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => reject(tx.error || new Error('indexeddb-eliminacion'));
            });
        }
        function leerLocalStorageLegado() {
            try {
                const pendienteJson = localStorage.getItem('planificador_v5_8_pendiente');
                return {
                    estado: localStorage.getItem('planificador_v5_8') ? {json:localStorage.getItem('planificador_v5_8'),fecha:localStorage.getItem('planificador_v5_8_ts')||''} : null,
                    base: localStorage.getItem('planificador_v5_8_base') ? {json:localStorage.getItem('planificador_v5_8_base'),fecha:localStorage.getItem('planificador_v5_8_base_ts')||''} : null,
                    pendiente: pendienteJson ? {json:pendienteJson,fecha:localStorage.getItem('planificador_v5_8_pendiente_ts')||''} : null,
                    snapshots: JSON.parse(localStorage.getItem(RECOVERY_KEY)||'[]')
                };
            } catch(e) {
                return {estado:null,base:null,pendiente:null,snapshots:[]};
            }
        }
        function limpiarLocalStorageMigrado() {
            try {
                localStorage.removeItem('planificador_v5_8');
                localStorage.removeItem('planificador_v5_8_ts');
                localStorage.removeItem('planificador_v5_8_base');
                localStorage.removeItem('planificador_v5_8_base_ts');
                localStorage.removeItem('planificador_v5_8_pendiente');
                localStorage.removeItem('planificador_v5_8_pendiente_ts');
                localStorage.removeItem(RECOVERY_KEY);
            } catch(e) {}
        }
        function registroMasReciente(principal, legado) {
            if (!principal?.json) return legado?.json ? legado : null;
            if (!legado?.json) return principal;
            const fechaPrincipal=Date.parse(principal.fecha||'')||0;
            const fechaLegado=Date.parse(legado.fecha||'')||0;
            return fechaLegado>fechaPrincipal ? legado : principal;
        }
        function combinarSnapshots(principal, legado) {
            const unicos=new Map();
            [...(Array.isArray(principal)?principal:[]),...(Array.isArray(legado)?legado:[])].forEach(s=>{
                if(s?.id&&s?.json&&!unicos.has(s.id)) unicos.set(s.id,s);
            });
            return [...unicos.values()].sort((a,b)=>(Number(b.fechaMs)||0)-(Number(a.fechaMs)||0)).slice(0,RECOVERY_MAX);
        }
        async function inicializarAlmacenLocal() {
            if (almacenLocalInicializado) return;
            const legado = leerLocalStorageLegado();
            try {
                await abrirAlmacenLocal();
                localDbDisponible = true;
                const [estado,base,pendiente,snapshots] = await Promise.all([
                    leerRegistroLocal(LOCAL_KEYS.estado),
                    leerRegistroLocal(LOCAL_KEYS.base),
                    leerRegistroLocal(LOCAL_KEYS.pendiente),
                    leerRegistroLocal(LOCAL_KEYS.recuperaciones)
                ]);
                cacheLocal.estado = registroMasReciente(estado, legado.estado);
                cacheLocal.base = registroMasReciente(base, legado.base);
                cacheLocal.pendiente = registroMasReciente(pendiente, legado.pendiente);
                cacheLocal.snapshots = combinarSnapshots(snapshots, legado.snapshots);
                let migracionCompleta=true;
                try { if (cacheLocal.estado && cacheLocal.estado!==estado) await escribirRegistroLocal(LOCAL_KEYS.estado, cacheLocal.estado); } catch(e) { migracionCompleta=false; }
                try { if (cacheLocal.base && cacheLocal.base!==base) await escribirRegistroLocal(LOCAL_KEYS.base, cacheLocal.base); } catch(e) { migracionCompleta=false; }
                try { if (cacheLocal.pendiente && cacheLocal.pendiente!==pendiente) await escribirRegistroLocal(LOCAL_KEYS.pendiente, cacheLocal.pendiente); } catch(e) { migracionCompleta=false; }
                try { if (cacheLocal.snapshots.length) await escribirRegistroLocal(LOCAL_KEYS.recuperaciones, cacheLocal.snapshots); } catch(e) { migracionCompleta=false; }
                if (migracionCompleta) limpiarLocalStorageMigrado();
            } catch(e) {
                localDbDisponible = false;
                cacheLocal.estado = legado.estado;
                cacheLocal.base = legado.base;
                cacheLocal.pendiente = legado.pendiente;
                cacheLocal.snapshots = Array.isArray(legado.snapshots) ? legado.snapshots : [];
                console.warn('IndexedDB no disponible; se mantiene localStorage:', e);
            }
            almacenLocalInicializado = true;
        }
        async function guardarEstadoLocal(json) {
            const registro={json:String(json||''),fecha:new Date().toISOString()};
            cacheLocal.estado=registro;
            if (localDbDisponible) {
                try { await escribirRegistroLocal(LOCAL_KEYS.estado, registro); return true; } catch(e) { localDbDisponible=false; }
            }
            try { localStorage.setItem('planificador_v5_8', registro.json); localStorage.setItem('planificador_v5_8_ts',registro.fecha); return true; } catch(e) { return false; }
        }
        async function guardarBaseComun(json) {
            const registro={json:String(json||''),fecha:new Date().toISOString()};
            if(!registro.json) return false;
            cacheLocal.base=registro;
            if(localDbDisponible){
                try { await escribirRegistroLocal(LOCAL_KEYS.base,registro); return true; } catch(e) { localDbDisponible=false; }
            }
            try { localStorage.setItem('planificador_v5_8_base',registro.json); localStorage.setItem('planificador_v5_8_base_ts',registro.fecha); return true; }
            catch(e) { return false; }
        }
        function leerBaseComun(){
            if(!cacheLocal.base?.json) return null;
            try { return JSON.parse(cacheLocal.base.json); } catch(e) { return null; }
        }
        async function guardarPendienteLocal(json) {
            const registro={json:String(json||''),fecha:new Date().toISOString()};
            cacheLocal.pendiente=registro;
            if (localDbDisponible) {
                try { await escribirRegistroLocal(LOCAL_KEYS.pendiente, registro); }
                catch(e) { localDbDisponible=false; try { localStorage.setItem('planificador_v5_8_pendiente',registro.json); localStorage.setItem('planificador_v5_8_pendiente_ts',registro.fecha); } catch(e2) {} }
            } else {
                try { localStorage.setItem('planificador_v5_8_pendiente',registro.json); localStorage.setItem('planificador_v5_8_pendiente_ts',registro.fecha); } catch(e) {}
            }
            cambioLocal = true;
        }
        function leerPendienteLocal() {
            return cacheLocal.pendiente?.json ? cacheLocal.pendiente : null;
        }
        async function limpiarPendienteLocal() {
            cacheLocal.pendiente=null;
            if (localDbDisponible) {
                try { await eliminarRegistroLocal(LOCAL_KEYS.pendiente); } catch(e) { localDbDisponible=false; }
            }
            try { localStorage.removeItem('planificador_v5_8_pendiente'); localStorage.removeItem('planificador_v5_8_pendiente_ts'); } catch(e) {}
            avisoPendienteMostrado = false;
        }
        function leerSnapshotsRecuperacion() {
            const lista=cacheLocal.snapshots;
            return Array.isArray(lista) ? lista.filter(s=>s&&s.id&&s.json).slice(0, RECOVERY_MAX) : [];
        }
        function verificarIntegridadSnapshot(snapshot) {
            if(!snapshot?.json) return 'invalido';
            if(!snapshot.checksum) return 'historico';
            return checksumRapido(snapshot.json)===snapshot.checksum ? 'valido' : 'invalido';
        }
        function guardarListaSnapshotsRecuperacion(lista) {
            cacheLocal.snapshots=lista.slice(0, RECOVERY_MAX);
            if (localDbDisponible) {
                escribirRegistroLocal(LOCAL_KEYS.recuperaciones, cacheLocal.snapshots).catch(()=>{
                    try { localStorage.setItem(RECOVERY_KEY, JSON.stringify(cacheLocal.snapshots)); } catch(e) {}
                });
                return true;
            }
            try { localStorage.setItem(RECOVERY_KEY, JSON.stringify(cacheLocal.snapshots)); return true; }
            catch(e) { return false; }
        }
        function guardarSnapshotRecuperacion(motivo, json, baseData=null, opciones={}) {
            const texto = String(json || '');
            if (!texto || texto.length < 20) return false;
            const lista = leerSnapshotsRecuperacion();
            if (lista[0]?.json === texto) return false;
            const ahoraMs = Date.now();
            if (!opciones.forzar && lista[0]?.fechaMs && ahoraMs - Number(lista[0].fechaMs) < RECOVERY_MIN_INTERVAL) return false;
            const resumen = resumenContenido(baseData || getData());
            const total = Object.values(resumen).reduce((acc,n)=>acc+(Number(n)||0),0);
            if (!total && !opciones.permitirVacio) return false;
            const snap = {
                id:`rec_${ahoraMs}_${Math.random().toString(36).slice(2,7)}`,
                fecha:new Date(ahoraMs).toISOString(),
                fechaMs:ahoraMs,
                motivo:String(motivo || 'recuperacion').slice(0,80),
                resumen,
                savedBy:String(window._usuarioActual || baseData?._savedBy || 'usuario'),
                version:Number(baseData?._version) || Number(getData()?._version) || 0,
                tamanoBytes:typeof Blob==='function' ? new Blob([texto]).size : texto.length,
                temporadaId:String(baseData?.sel?.temporadaId || getData()?.sel?.temporadaId || ''),
                checksum:checksumRapido(texto),
                json:texto
            };
            return guardarListaSnapshotsRecuperacion([snap, ...lista.filter(s=>s.json!==texto)].slice(0, RECOVERY_MAX));
        }
        function listarSnapshotsRecuperacion() {
            return leerSnapshotsRecuperacion().map(snapshot=>{
                const {json, ...meta}=snapshot;
                return Object.assign(meta,{integridad:verificarIntegridadSnapshot(snapshot)});
            });
        }
        function obtenerSnapshotRecuperacion(id) {
            const snap = leerSnapshotsRecuperacion().find(s=>s.id===id) || leerSnapshotsRecuperacion()[0] || null;
            if (!snap?.json) return null;
            if(verificarIntegridadSnapshot(snap)==='invalido') return null;
            try {
                return Object.assign({}, snap, { datos: JSON.parse(snap.json) });
            } catch(e) {
                return null;
            }
        }
        function crearSnapshotActual(motivo='punto_recuperacion') {
            try {
                const data = getData();
                const snapshot = crearSnapshotCompartido(data);
                const json = JSON.stringify(snapshot);
                return guardarSnapshotRecuperacion(motivo, json, snapshot, {forzar:true});
            } catch(e) {
                console.warn('No se pudo crear punto de recuperación:', e);
                return false;
            }
        }
        async function guardarRestauracionLocal(motivo='restauracion_local') {
            const data=getData();
            const ahora=Date.now();
            data._versionBase=versionRemotaConocida || Number(data._versionBase) || Number(data._version) || 0;
            data._version=ahora;
            data._revisionId=crearRevisionId();
            data._savedBy=window._usuarioActual || 'usuario';
            data._savedAt=new Date(ahora).toISOString();
            const snapshot=crearSnapshotCompartido(data);
            const json=JSON.stringify(snapshot);
            if(!json || json.length<20) return false;
            await guardarEstadoLocal(json);
            await guardarPendienteLocal(json);
            ctx.setCambiosPendientes?.(true);
            establecerEstadoSync('pendiente','Restauración local pendiente');
            ctx.setSaveStatus?.('error','Restaurado localmente',false);
            return true;
        }
        const AUSENTE=Symbol('ausente');
        const META_SYNC=new Set(['_version','_versionBase','_revisionId','_savedBy','_savedAt']);
        const CAMPOS_TEMPORADA=new Set(['carreras','niveles','secciones','asignaturas','docentes','salas','asignaturaCarreraNivel','asignaturaSeccion','planificaciones','gruposDictacion','vinculosElectivos','gestorSecciones']);
        function contenidoComparable(valor){
            try{
                const copia=typeof valor==='string'?JSON.parse(valor):JSON.parse(JSON.stringify(valor));
                META_SYNC.forEach(campo=>delete copia[campo]);
                return JSON.stringify(copia);
            }catch(e){
                return '';
            }
        }
        function clonarValor(valor){
            if(valor===AUSENTE) return AUSENTE;
            return valor===undefined ? undefined : JSON.parse(JSON.stringify(valor));
        }
        function valorIgual(a,b){
            if(a===AUSENTE||b===AUSENTE) return a===b;
            return JSON.stringify(a)===JSON.stringify(b);
        }
        function esObjetoPlano(valor){
            return !!valor&&typeof valor==='object'&&!Array.isArray(valor);
        }
        function claveEntidad(item,ruta){
            if(!esObjetoPlano(item)) return '';
            if(item.id!==undefined&&item.id!==null) return String(item.id);
            const tipo=String(ruta[ruta.length-1]||'');
            if(tipo==='asignaturaCarreraNivel'&&item.asignaturaId&&item.carreraId&&item.nivelId) return `${item.asignaturaId}|${item.carreraId}|${item.nivelId}`;
            if(tipo==='asignaturaSeccion'&&item.asignaturaId&&item.seccionId) return `${item.asignaturaId}|${item.seccionId}`;
            return '';
        }
        function esListaEntidades(ruta,...listas){
            const items=listas.filter(Array.isArray).flat();
            return items.length>0&&items.every(x=>!!claveEntidad(x,ruta));
        }
        function etiquetaRuta(ruta){
            const clave=String(ruta[ruta.length-1]||'dato');
            const etiquetas={planificaciones:'Planificación',secciones:'Sección',asignaturas:'Asignatura',docentes:'Docente',salas:'Sala',carreras:'Carrera',niveles:'Nivel',gruposDictacion:'Grupo de dictación',configuracion:'Configuración'};
            return etiquetas[clave]||clave.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());
        }
        function agregarConflicto(conflictos,datos){
            const conflicto=Object.assign({id:`conf_${conflictos.length+1}`},datos);
            conflictos.push(conflicto);
            return conflicto;
        }
        function fusionarListaEntidades(base,local,remoto,ruta,conflictos){
            const listas=[base,local,remoto].map(x=>Array.isArray(x)?x:[]);
            const mapas=listas.map(lista=>new Map(lista.map(x=>[claveEntidad(x,ruta),x])));
            const ids=[];
            [listas[2],listas[1],listas[0]].forEach(lista=>lista.forEach(x=>{ const id=claveEntidad(x,ruta); if(!ids.includes(id)) ids.push(id); }));
            const resultado=[];
            ids.forEach(id=>{
                const b=mapas[0].has(id)?mapas[0].get(id):AUSENTE;
                const l=mapas[1].has(id)?mapas[1].get(id):AUSENTE;
                const r=mapas[2].has(id)?mapas[2].get(id):AUSENTE;
                let elegido;
                if(valorIgual(l,r)) elegido=l;
                else if(valorIgual(l,b)) elegido=r;
                else if(valorIgual(r,b)) elegido=l;
                else {
                    elegido=r;
                    const referencia=l!==AUSENTE?l:r;
                    const detalle=referencia?.codigo||referencia?.nombre||id;
                    agregarConflicto(conflictos,{tipo:'entidad',ruta:[...ruta],entidadId:id,etiqueta:`${etiquetaRuta(ruta)} ${detalle}`,local:l,remoto:r});
                }
                if(elegido!==AUSENTE) resultado.push(clonarValor(elegido));
            });
            if(String(ruta[ruta.length-1])==='planificaciones') detectarConflictosBloque(listas[0],listas[1],listas[2],ruta,conflictos);
            return resultado;
        }
        function detectarConflictosBloque(base,local,remoto,ruta,conflictos){
            const baseMap=new Map(base.map(x=>[String(x.id),x]));
            const cambios=(lista)=>lista.filter(x=>!valorIgual(baseMap.has(String(x.id))?baseMap.get(String(x.id)):AUSENTE,x));
            const locales=cambios(local);
            const remotos=cambios(remoto);
            const vistos=new Set();
            locales.forEach(l=>remotos.forEach(r=>{
                if(String(l.id)===String(r.id)) return;
                const mismoTiempo=Number(l.dia)===Number(r.dia)&&Number(l.bloque)===Number(r.bloque);
                if(!mismoTiempo) return;
                const razones=[];
                if(String(l.seccionId||'')===String(r.seccionId||'')) razones.push('misma sección');
                if(l.docenteId&&l.docenteId!==ctx.DOCENTE_NN_ID&&String(l.docenteId)===String(r.docenteId)) razones.push('mismo docente');
                if(l.salaId&&![ctx.SALA_VIRTUAL_ID,ctx.SALA_TRO2_ID].includes(l.salaId)&&String(l.salaId)===String(r.salaId)) razones.push('misma sala');
                if(!razones.length) return;
                const clave=[...ruta,String(l.id),String(r.id)].join('|');
                if(vistos.has(clave)) return;
                vistos.add(clave);
                agregarConflicto(conflictos,{tipo:'bloque',ruta:[...ruta],localId:String(l.id),remotoId:String(r.id),etiqueta:`Bloque D${Number(l.dia)+1}-B${l.bloque}: ${razones.join(', ')}`,local:l,remoto:r});
            }));
        }
        function fusionarNodo(base,local,remoto,ruta,conflictos){
            if(ruta.length===1&&META_SYNC.has(String(ruta[0]))) return clonarValor(remoto);
            if(valorIgual(local,remoto)) return clonarValor(local);
            if(valorIgual(local,base)) return clonarValor(remoto);
            if(valorIgual(remoto,base)) return clonarValor(local);
            if(Array.isArray(local)||Array.isArray(remoto)||Array.isArray(base)){
                if(esListaEntidades(ruta,base,local,remoto)) return fusionarListaEntidades(base,local,remoto,ruta,conflictos);
                if(String(ruta[ruta.length-1])==='auditoria'){
                    const unicos=new Map();
                    [base,remoto,local].filter(Array.isArray).flat().forEach(x=>unicos.set(JSON.stringify(x),clonarValor(x)));
                    return [...unicos.values()];
                }
            } else if(esObjetoPlano(local)||esObjetoPlano(remoto)||esObjetoPlano(base)){
                const objetos=[base,local,remoto].map(x=>esObjetoPlano(x)?x:{});
                const claves=new Set([...Object.keys(objetos[0]),...Object.keys(objetos[1]),...Object.keys(objetos[2])]);
                const salida={};
                claves.forEach(clave=>{
                    const valores=objetos.map(o=>Object.prototype.hasOwnProperty.call(o,clave)?o[clave]:AUSENTE);
                    const fusion=fusionarNodo(valores[0],valores[1],valores[2],[...ruta,clave],conflictos);
                    if(fusion!==AUSENTE) salida[clave]=fusion;
                });
                return salida;
            }
            agregarConflicto(conflictos,{tipo:'valor',ruta:[...ruta],etiqueta:etiquetaRuta(ruta),local,remoto});
            return clonarValor(remoto);
        }
        function fusionarTresVias(base,local,remoto){
            const conflictos=[];
            const fusion=fusionarNodo(base,local,remoto,[],conflictos);
            const usaTemporadas=[base,local,remoto].every(x=>x?.temporadaData&&Object.keys(x.temporadaData).length);
            const visibles=usaTemporadas?conflictos.filter(c=>!(c.ruta.length===1&&CAMPOS_TEMPORADA.has(String(c.ruta[0])))):conflictos;
            return {fusion,conflictos:visibles};
        }
        function obtenerEnRuta(obj,ruta){
            return ruta.reduce((actual,clave)=>actual?.[clave],obj);
        }
        function asignarEnRuta(obj,ruta,valor){
            if(!ruta.length) return valor===AUSENTE?{}:clonarValor(valor);
            let actual=obj;
            ruta.slice(0,-1).forEach(clave=>{
                if(!esObjetoPlano(actual[clave])) actual[clave]={};
                actual=actual[clave];
            });
            const clave=ruta[ruta.length-1];
            if(valor===AUSENTE) delete actual[clave];
            else actual[clave]=clonarValor(valor);
            return obj;
        }
        function aplicarDecisionesFusion(resultado,decisiones){
            let fusion=clonarValor(resultado.fusion);
            resultado.conflictos.forEach(conflicto=>{
                const lado=decisiones[conflicto.id];
                const valor=lado==='local'?conflicto.local:conflicto.remoto;
                if(conflicto.tipo==='valor'){
                    fusion=asignarEnRuta(fusion,conflicto.ruta,valor);
                    return;
                }
                const lista=obtenerEnRuta(fusion,conflicto.ruta);
                if(!Array.isArray(lista)) return;
                if(conflicto.tipo==='entidad'){
                    const idx=lista.findIndex(x=>claveEntidad(x,conflicto.ruta)===conflicto.entidadId);
                    if(idx>=0) lista.splice(idx,1);
                    if(valor!==AUSENTE) lista.push(clonarValor(valor));
                    return;
                }
                const quitar=lado==='local'?conflicto.remotoId:conflicto.localId;
                const idx=lista.findIndex(x=>String(x?.id)===quitar);
                if(idx>=0) lista.splice(idx,1);
                const elegido=lado==='local'?conflicto.local:conflicto.remoto;
                if(elegido!==AUSENTE&&!lista.some(x=>String(x?.id)===String(elegido?.id))) lista.push(clonarValor(elegido));
            });
            return fusion;
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
                vinculosElectivos:data.vinculosElectivos || [],
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
            data.vinculosElectivos = temp.vinculosElectivos || [];
            data.gruposElectivos = temp.gruposElectivos || [];
            data.gestorSecciones = temp.gestorSecciones || {cargas:[],ids:[],ultimaCargaId:null};
        }
        function crearSnapshotCompartido(data) {
            snapshotTemporadaActual(data);
            const snapshot = JSON.parse(JSON.stringify(data));
            snapshot.sel = snapshot.sel || {};
            snapshot.configuracion = snapshot.configuracion || {};
            snapshot.sel.temporadaId = null;
            delete snapshot.configuracion.temporadaActualId;
            return limpiarMetadatosTransporte(snapshot);
        }
        function metadataPayload(data, extra={}) {
            return Object.assign({
                _version: Number(data._version) || Date.now(),
                _versionBase: Number(data._versionBase) || 0,
                _revisionId: String(data._revisionId || crearRevisionId()),
                _savedBy: String(data._savedBy || window._usuarioActual || 'usuario'),
                _savedAt: String(data._savedAt || new Date().toISOString()),
                _contentSummary: resumenContenido(data)
            }, extra);
        }
        function asignarRevisionAuditoria(eventos, revisionId) {
            const revision=String(revisionId||'');
            if(!revision||!Array.isArray(eventos)) return 0;
            let asignados=0;
            eventos.forEach(evento=>{
                if(evento&&typeof evento==='object'&&!evento.revisionId){
                    evento.revisionId=revision;
                    asignados++;
                }
            });
            return asignados;
        }
        function dividirPayload(json) {
            const texto = String(json || '');
            const chunks = [];
            for (let i=0; i<texto.length; i+=FIRESTORE_CHUNK_SIZE) chunks.push(texto.slice(i, i+FIRESTORE_CHUNK_SIZE));
            return chunks;
        }
        function refChunk(doc, db, indice) {
            return doc(db, 'planificador', 'datos', 'payloadChunks', String(indice).padStart(4,'0'));
        }
        async function crearPayloadFirestore(json, data) {
            const texto = String(json || '');
            const integridad = {
                _payloadLength: texto.length,
                _payloadChecksum: await calcularChecksum(texto)
            };
            if (texto.length <= FIRESTORE_CHUNK_SIZE) {
                return metadataPayload(data, {
                    _schema: 'planificador-json-v1',
                    _payloadJson: texto,
                    ...integridad
                });
            }
            const chunks = dividirPayload(texto);
            return metadataPayload(data, {
                _schema: 'planificador-json-chunks-v1',
                _payloadJson: '',
                _chunkCount: chunks.length,
                _chunkSize: FIRESTORE_CHUNK_SIZE,
                ...integridad
            });
        }
        async function escribirPayloadFirestore({db, doc, setDoc, transaction, ref, payload, json}) {
            const chunks = payload?._schema === 'planificador-json-chunks-v1' ? dividirPayload(json) : [];
            if (transaction) {
                transaction.set(ref, payload);
                chunks.forEach((parte, idx) => {
                    transaction.set(refChunk(doc, db, idx), {
                        _schema:'planificador-json-chunk-v1',
                        _chunkIndex:idx,
                        _chunkCount:chunks.length,
                        _version:payload._version,
                        _revisionId:payload._revisionId,
                        _payloadChecksum:payload._payloadChecksum,
                        _payloadPart:parte
                    });
                });
                return;
            }
            for (let idx=0; idx<chunks.length; idx++) {
                await setDoc(refChunk(doc, db, idx), {
                    _schema:'planificador-json-chunk-v1',
                    _chunkIndex:idx,
                    _chunkCount:chunks.length,
                    _version:payload._version,
                    _revisionId:payload._revisionId,
                    _payloadChecksum:payload._payloadChecksum,
                    _payloadPart:chunks[idx]
                });
            }
            await setDoc(ref, payload);
        }
        function limpiarMetadatosTransporte(dataRemota){
            if(!dataRemota||typeof dataRemota!=='object') return dataRemota;
            ['_schema','_payloadJson','_payloadLength','_payloadChecksum','_chunkCount','_chunkSize','_contentSummary'].forEach(k=>delete dataRemota[k]);
            return dataRemota;
        }
        async function leerPayloadFirestore(remoto, helpers={}) {
            if (remoto?._schema === 'planificador-json-v1' && typeof remoto._payloadJson !== 'string') {
                throw errorIntegridad('payload-ausente');
            }
            if (remoto && remoto._schema === 'planificador-json-v1' && typeof remoto._payloadJson === 'string') {
                try {
                    const texto = await validarTextoPayload(remoto, remoto._payloadJson);
                    const dataRemota = limpiarMetadatosTransporte(JSON.parse(texto));
                    dataRemota._version = Number(remoto._version) || Number(dataRemota._version) || 0;
                    dataRemota._versionBase = Number(remoto._versionBase) || Number(dataRemota._versionBase) || 0;
                    dataRemota._revisionId = remoto._revisionId || dataRemota._revisionId || '';
                    dataRemota._savedBy = remoto._savedBy || dataRemota._savedBy || 'usuario';
                    dataRemota._savedAt = remoto._savedAt || dataRemota._savedAt || '';
                    return dataRemota;
                } catch(e) {
                    console.warn('No se pudo leer el paquete remoto de Firestore:', e);
                    if (e?.code === 'payload-integrity') throw e;
                    throw errorIntegridad('json-invalido');
                }
            }
            if (remoto && remoto._schema === 'planificador-json-chunks-v1') {
                const { db, doc, getDoc } = helpers;
                const total = Math.max(0, Number(remoto._chunkCount)||0);
                if (!db || !doc || !getDoc) throw errorIntegridad('lector-fragmentos-no-disponible');
                if (!total) throw errorIntegridad('total-fragmentos-invalido');
                try {
                    const partes = [];
                    const inconsistenciasMetadata=[];
                    for (let idx=0; idx<total; idx++) {
                        const snap = await getDoc(refChunk(doc, db, idx));
                        const fila = snap.exists?.() ? snap.data() : null;
                        if (!fila || typeof fila._payloadPart !== 'string') throw errorIntegridad(`fragmento-ausente-${idx}`);
                        if (Number(fila._chunkIndex) !== idx) throw errorIntegridad(`indice-fragmento-${idx}`);
                        if (fila._chunkCount !== undefined && Number(fila._chunkCount) !== total) throw errorIntegridad(`total-fragmentos-${idx}`);
                        if (remoto._revisionId && fila._revisionId !== remoto._revisionId) inconsistenciasMetadata.push(`revision-fragmento-${idx}`);
                        if (remoto._payloadChecksum && fila._payloadChecksum && fila._payloadChecksum !== remoto._payloadChecksum) inconsistenciasMetadata.push(`checksum-fragmento-${idx}`);
                        partes.push(String(fila?._payloadPart || ''));
                    }
                    const texto = await validarTextoPayload(remoto, partes.join(''));
                    if(inconsistenciasMetadata.length) throw errorIntegridad(inconsistenciasMetadata[0]);
                    const dataRemota = limpiarMetadatosTransporte(JSON.parse(texto));
                    dataRemota._version = Number(remoto._version) || Number(dataRemota._version) || 0;
                    dataRemota._versionBase = Number(remoto._versionBase) || Number(dataRemota._versionBase) || 0;
                    dataRemota._revisionId = remoto._revisionId || dataRemota._revisionId || '';
                    dataRemota._savedBy = remoto._savedBy || dataRemota._savedBy || 'usuario';
                    dataRemota._savedAt = remoto._savedAt || dataRemota._savedAt || '';
                    return dataRemota;
                } catch(e) {
                    console.warn('No se pudo leer el paquete remoto fragmentado de Firestore:', e);
                    if (e?.code === 'payload-integrity') throw e;
                    throw errorIntegridad('json-fragmentado-invalido');
                }
            }
            return remoto;
        }
        async function leerRemotoConsistente(ref){
            const {db,doc,getDoc,runTransaction}=window._fb;
            if(runTransaction){
                return await runTransaction(db,async transaction=>{
                    const snap=await transaction.get(ref);
                    if(!snap.exists()) return null;
                    return await leerPayloadFirestore(snap.data(),{db,doc,getDoc:chunkRef=>transaction.get(chunkRef)});
                });
            }
            const snap=await getDoc(ref);
            if(!snap.exists()) return null;
            return await leerPayloadFirestore(snap.data(),{db,doc,getDoc});
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
            if (codigo === 'payload-integrity') {
                const detalle=String(e?.message||'').replace(/^payload-integridad:/,'')||'motivo no identificado';
                const etiquetas={
                    'longitud-invalida':'la longitud del contenido no coincide',
                    'checksum-invalido':'el checksum del contenido no coincide',
                    'payload-ausente':'falta el contenido principal',
                    'total-fragmentos-invalido':'la cantidad de fragmentos es inválida',
                    'lector-fragmentos-no-disponible':'no se pudo abrir el lector de fragmentos',
                    'json-invalido':'el JSON principal no es válido',
                    'json-fragmentado-invalido':'el JSON reconstruido no es válido'
                };
                const legible=etiquetas[detalle]||detalle.replaceAll('-',' ');
                return `La copia de Firebase no superó la validación de integridad (${legible}). No fue aplicada.`;
            }
            if (codigo === 'permission-denied') return 'Firestore rechazó el guardado: revisa las reglas.';
            if (codigo === 'failed-precondition') return 'Firestore no está listo o requiere crear índice/base de datos.';
            if (codigo === 'unavailable') return 'Firestore no respondió. Revisa conexión o disponibilidad.';
            if (codigo === 'not-found') return 'No se encontró la base/documento de Firestore.';
            if (codigo === 'unauthenticated') return 'La sesión no está autenticada para guardar.';
            return `Firestore: ${codigo}${mensaje ? ' · ' + mensaje : ''}`;
        }
        async function aplicarRemoto(remoto, jsonRemoto) {
            const data = getData();
            const localAntes = JSON.stringify(crearSnapshotCompartido(data));
            const remotoTexto = jsonRemoto || JSON.stringify(remoto);
            if (localAntes !== remotoTexto) {
                guardarSnapshotRecuperacion('antes_de_aplicar_firebase', localAntes, data, {forzar:true});
            }
            Object.assign(data, remoto);
            data.configuracion = Object.assign({}, JSON.parse(JSON.stringify(ctx.CONFIG_DEFAULT)), data.configuracion);
            data.auditoria = data.auditoria || [];
            data.temporadas = data.temporadas || [];
            data.temporadaData = data.temporadaData || {};
            aplicarTemporadaActivaLocal(data);
            lastSave = JSON.stringify(crearSnapshotCompartido(data));
            await guardarEstadoLocal(lastSave);
            await guardarBaseComun(lastSave);
            versionRemotaConocida = Number(data._version) || 0;
            conflictoRemoto = false;
            registrarUltimoRemoto(remoto);
        }
        function cargarLocal(data) {
            try {
                const d = JSON.parse(cacheLocal.estado?.json || 'null');
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
            return !!cacheLocal.estado?.json;
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
        function describirValorConflicto(valor){
            if(valor===AUSENTE) return 'Eliminado';
            if(!valor||typeof valor!=='object') return String(valor??'Vacío').slice(0,180);
            if(valor.dia!==undefined&&valor.bloque!==undefined){
                return [`D${Number(valor.dia)+1}-B${valor.bloque}`,valor.asignaturaId&&`Asig. ${valor.asignaturaId}`,valor.seccionId&&`Sección ${valor.seccionId}`,valor.docenteId&&`Docente ${valor.docenteId}`,valor.salaId&&`Sala ${valor.salaId}`].filter(Boolean).join(' · ');
            }
            return [valor.codigo,valor.nombre,valor.id&&`ID ${valor.id}`].filter(Boolean).join(' · ')||JSON.stringify(valor).slice(0,180);
        }
        function avisarBaseComunAusente(pendiente){
            return new Promise(resolve => {
                const container = document.getElementById('modalContainer');
                if (!container) {
                    alert('No existe una base común verificable. No se sobrescribió ningún dato.');
                    resolve(null);
                    return;
                }
                container.innerHTML = `
                <div class="modal-overlay" id="modalOverlay"><div class="modal modal-wide">
                    <div class="modal-header">
                        <h3>Sin base común verificable</h3>
                        <p>La app bloqueó la sobrescritura completa para proteger ambas versiones.</p>
                    </div>
                    <div class="alert-info" style="margin-bottom:12px;">Esta sesión aún no posee una versión sincronizada que permita comparar cambios locales y remotos de forma segura.</div>
                    <div class="modal-actions" style="justify-content:space-between;gap:8px;flex-wrap:wrap;">
                        <button class="btn" id="syncExportPending">Exportar respaldo local</button>
                        <button class="btn btn-primary" id="syncCancelPending">Cerrar sin modificar</button>
                    </div>
                </div></div>`;
                document.getElementById('syncExportPending').onclick = () => {
                    descargarPendienteLocal(pendiente);
                    ctx.toast?.('Respaldo local descargado', 'success');
                };
                document.getElementById('syncCancelPending').onclick = () => { container.innerHTML=''; resolve(null); };
            });
        }
        function pedirResolucionTresVias(resultado,pendiente,remoto){
            return new Promise(resolve=>{
                const container=document.getElementById('modalContainer');
                if(!container){
                    alert(`Se detectaron ${resultado.conflictos.length} conflictos. No se modificaron los datos porque esta vista requiere resolución manual.`);
                    resolve(null);
                    return;
                }
                const quien=remoto?._savedBy||'otro usuario';
                const filas=resultado.conflictos.map(c=>`
                    <div style="display:grid;grid-template-columns:minmax(170px,0.8fr) minmax(260px,1.7fr) 150px;gap:10px;align-items:center;padding:10px;border:1px solid var(--border-light);border-radius:var(--radius-sm);background:var(--surface-alt);">
                        <strong style="font-size:0.78rem;">${escapeHTML(c.etiqueta)}</strong>
                        <div style="font-size:0.72rem;line-height:1.35;color:var(--text-secondary);">
                            <div><b>Local:</b> ${escapeHTML(describirValorConflicto(c.local))}</div>
                            <div><b>Remoto:</b> ${escapeHTML(describirValorConflicto(c.remoto))}</div>
                        </div>
                        <select class="form-select sync-conflict-choice" data-conflict-id="${escapeHTML(c.id)}" style="font-size:0.76rem;">
                            <option value="">Elegir versión</option>
                            <option value="local">Conservar local</option>
                            <option value="remoto">Conservar remoto</option>
                        </select>
                    </div>`).join('');
                container.innerHTML=`
                    <div class="modal-overlay" id="modalOverlay"><div class="modal modal-wide" style="max-width:980px;">
                        <div class="modal-header"><h3>Resolver conflictos de sincronización</h3><p>Los cambios no relacionados ya fueron combinados. Revisa únicamente las coincidencias reales.</p></div>
                        <div class="alert-info" style="margin-bottom:12px;">${resultado.conflictos.length} conflicto(s) con la versión de <strong>${escapeHTML(quien)}</strong>. No se guardará hasta resolverlos todos.</div>
                        <div style="display:grid;gap:8px;max-height:min(58vh,560px);overflow:auto;padding-right:4px;">${filas}</div>
                        <div class="modal-actions" style="justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:14px;">
                            <button class="btn" id="syncExportPending">Exportar respaldo local</button>
                            <div style="display:flex;gap:8px;"><button class="btn" id="syncCancelPending">Cancelar</button><button class="btn btn-primary" id="syncApplyMerge" disabled>Combinar y guardar</button></div>
                        </div>
                    </div></div>`;
                const selects=[...container.querySelectorAll('.sync-conflict-choice')];
                const aplicar=container.querySelector('#syncApplyMerge');
                const actualizar=()=>{ aplicar.disabled=selects.some(s=>!s.value); };
                selects.forEach(s=>s.addEventListener('change',actualizar));
                container.querySelector('#syncExportPending').onclick=()=>{ descargarPendienteLocal(pendiente); ctx.toast?.('Respaldo local descargado','success'); };
                container.querySelector('#syncCancelPending').onclick=()=>{ container.innerHTML=''; resolve(null); };
                aplicar.onclick=()=>{
                    const decisiones=Object.fromEntries(selects.map(s=>[s.dataset.conflictId,s.value]));
                    container.innerHTML='';
                    resolve(decisiones);
                };
            });
        }
        async function resolverPendienteConRemoto(pendiente,remoto,opciones={}){
            establecerEstadoSync('comparando');
            let local;
            try { local=JSON.parse(pendiente?.json||''); } catch(e) { ctx.toast('El respaldo local pendiente no se pudo leer. No se modificó la nube.','error'); return false; }
            const base=leerBaseComun();
            if(!base){
                await avisarBaseComunAusente(pendiente);
                return false;
            }
            const resultado=fusionarTresVias(base,local,remoto);
            let fusion=resultado.fusion;
            if(resultado.conflictos.length){
                if(opciones.automatico){
                    conflictoRemoto=true;
                    establecerEstadoSync('conflicto',`${resultado.conflictos.length} conflicto(s)`);
                    ctx.setSaveStatus?.('error','Revisión necesaria',false);
                    if(!avisoPendienteMostrado){ avisoPendienteMostrado=true; ctx.toast('Hay conflictos entre cambios locales y remotos. Revísalos desde Sincronizar.','error'); }
                    return false;
                }
                const decisiones=await pedirResolucionTresVias(resultado,pendiente,remoto);
                if(!decisiones){ establecerEstadoSync('conflicto'); return false; }
                fusion=aplicarDecisionesFusion(resultado,decisiones);
            }
            const data=getData();
            guardarSnapshotRecuperacion('antes_fusion_tres_vias',JSON.stringify(crearSnapshotCompartido(data)),data,{forzar:true});
            Object.assign(data,fusion);
            data.configuracion=Object.assign({},JSON.parse(JSON.stringify(ctx.CONFIG_DEFAULT)),data.configuracion);
            data.auditoria=data.auditoria||[];
            data.temporadas=data.temporadas||[];
            data.temporadaData=data.temporadaData||{};
            aplicarTemporadaActivaLocal(data);
            versionRemotaConocida=Number(remoto._version)||versionRemotaConocida;
            conflictoRemoto=false;
            modoLocalInicio=false;
            const fusionTexto=JSON.stringify(crearSnapshotCompartido(data));
            await guardarEstadoLocal(fusionTexto);
            await guardarPendienteLocal(fusionTexto);
            ctx.normalizarDatos?.();
            ctx.reconstruirIndices();
            ctx.refrescarTodo();
            const ok=await guardar({forzar:true,sobrescribirRemoto:true,revisionRemotaEsperada:String(remoto._revisionId||''),versionRemotaEsperada:Number(remoto._version)||0,motivo:'fusion_tres_vias'});
            if(ok) ctx.toast(resultado.conflictos.length?'Conflictos resueltos y cambios combinados':'Cambios locales y remotos combinados automáticamente','success');
            return ok;
        }
        async function resolverPendienteAutomatico(pendiente,remoto){
            if(comparacionAutomaticaActiva) return false;
            comparacionAutomaticaActiva=true;
            try { return await resolverPendienteConRemoto(pendiente,remoto,{automatico:true}); }
            finally { comparacionAutomaticaActiva=false; }
        }
        function instalarSnapshot(ref, onSnapshot) {
            onSnapshot(ref, {includeMetadataChanges:true}, async (snapLive) => {
                if (!snapLive.exists()) return;
                if (snapLive.metadata?.hasPendingWrites) return;
                const cabecera = snapLive.data() || {};
                try {
                    const remoto = await leerRemotoConsistente(ref);
                    if(!remoto) return;
                    const jsonRemoto = JSON.stringify(remoto);
                    integridadRemotaAvisada='';
                    const revisionRemota=String(remoto._revisionId||'');
                    if(revisionRemota&&revisionesLocalesRecientes.has(revisionRemota)){
                        versionRemotaConocida=Math.max(versionRemotaConocida,Number(remoto._version)||0);
                        registrarUltimoRemoto(remoto);
                        if(jsonRemoto===lastSave&&!leerPendienteLocal()?.json){
                            cambioLocal=false;
                            reiniciarReintentos();
                            establecerEstadoSync('sincronizado');
                        }
                        return;
                    }
                    if (cambioLocal && jsonRemoto === lastSave) { cambioLocal = false; versionRemotaConocida = Number(remoto._version)||versionRemotaConocida; registrarUltimoRemoto(remoto); reiniciarReintentos(); establecerEstadoSync('sincronizado'); return; }
                    if (cambioLocal) cambioLocal = false;
                    if (jsonRemoto === lastSave) return;
                    const pendiente = leerPendienteLocal();
                    if (pendiente?.json && pendiente.json !== jsonRemoto) {
                        versionRemotaConocida = Math.max(versionRemotaConocida, Number(remoto._version)||0);
                        ctx.setCambiosPendientes?.(true);
                        establecerEstadoSync('pendiente');
                        ctx.setSaveStatus?.('saving','Comparando cambios...',false);
                        await resolverPendienteAutomatico(pendiente,remoto);
                        return;
                    }
                    if (conflictoRemoto) {
                        versionRemotaConocida = Math.max(versionRemotaConocida, Number(remoto._version)||0);
                        establecerEstadoSync('conflicto');
                        ctx.toast('Hay cambios en la nube y cambios locales pendientes. Sincroniza desde el menú antes de continuar.', 'error');
                        return;
                    }
                    if (!remoto._version || remoto._version > (getData()._version || 0)) {
                        establecerEstadoSync('comparando');
                        await aplicarRemoto(remoto, jsonRemoto);
                        ctx.normalizarDatos?.();
                        ctx.reconstruirIndices(); ctx.refrescarTodo();
                        reiniciarReintentos();
                        establecerEstadoSync('sincronizado');
                        ctx.setCambiosPendientes?.(false);
                        const quien = remoto._savedBy || 'El otro usuario';
                        ctx.toast(`🔄 ${quien} actualizó los datos`, 'info');
                    }
                } catch(e) {
                    conflictoRemoto = true;
                    versionRemotaConocida = Math.max(versionRemotaConocida, Number(cabecera._version)||0);
                    ctx.setCambiosPendientes?.(true);
                    establecerEstadoSync('conflicto','Integridad pendiente');
                    ctx.setSaveStatus?.('error','Nube no aplicada',false);
                    const revision = String(cabecera._revisionId || cabecera._version || 'desconocida');
                    if (integridadRemotaAvisada !== revision) {
                        integridadRemotaAvisada = revision;
                        ctx.toast(`${describirErrorFirebase(e)} Tu avance local permanece protegido.`, 'error');
                    }
                    console.error('Actualización remota rechazada por integridad:', e);
                }
            });
        }
        async function recargarDesdeFirestore(silencioso=false) {
            const opciones = typeof silencioso === 'object' ? silencioso : { silencioso: !!silencioso };
            try {
                establecerEstadoSync('reconectando');
                const { db, doc } = window._fb;
                const ref = doc(db, 'planificador', 'datos');
                const remoto = await leerRemotoConsistente(ref);
                if (!remoto) { establecerEstadoSync('sincronizado'); return false; }
                establecerEstadoSync('comparando');
                const jsonRemoto = JSON.stringify(remoto);
                const pendiente = leerPendienteLocal();
                if (pendiente?.json && pendiente.json !== jsonRemoto) {
                    establecerEstadoSync('pendiente');
                    ctx.setSaveStatus?.('error','Pendiente local',false);
                    ctx.setCambiosPendientes?.(true);
                    return opciones.automatico ? await resolverPendienteAutomatico(pendiente,remoto) : await resolverPendienteConRemoto(pendiente,remoto,opciones);
                }
                await aplicarRemoto(remoto, jsonRemoto);
                modoLocalInicio = false;
                conflictoRemoto = false;
                cambioLocal = false;
                await limpiarPendienteLocal();
                ctx.reconstruirIndices(); ctx.refrescarTodo();
                reiniciarReintentos();
                establecerEstadoSync('sincronizado');
                ctx.setCambiosPendientes?.(false);
                if(!opciones.silencioso) ctx.toast('Datos sincronizados con la nube','success');
                return true;
            } catch(e) {
                establecerEstadoSync(conflictoRemoto?'conflicto':'pendiente');
                console.warn('Error al sincronizar desde la nube:', e);
                if(!opciones.silencioso) ctx.toast(describirErrorFirebase(e),'error');
                if(opciones.automatico&&!conflictoRemoto) programarReintento();
                return false;
            }
        }
        function combinarOpcionesGuardado(base={},nuevas={}){
            const combinado=Object.assign({},base,nuevas);
            ['forzar','sobrescribirRemoto','snapshotForzado'].forEach(campo=>{
                combinado[campo]=base[campo]===true||nuevas[campo]===true;
            });
            return combinado;
        }
        function procesarGuardadoPendiente(){
            if(guardadoEnCurso||!solicitudGuardadoPendiente) return;
            guardadoEnCurso=true;
            const solicitud=solicitudGuardadoPendiente;
            solicitudGuardadoPendiente=null;
            Promise.resolve(guardarAhora(solicitud.opciones))
                .then(resultado=>solicitud.resolvers.forEach(({resolve})=>resolve(resultado)))
                .catch(error=>solicitud.resolvers.forEach(({reject})=>reject(error)))
                .finally(()=>{
                    guardadoEnCurso=false;
                    if(solicitudGuardadoPendiente) queueMicrotask(procesarGuardadoPendiente);
                });
        }
        function guardar(opciones={}) {
            return new Promise((resolve,reject)=>{
                if(solicitudGuardadoPendiente){
                    solicitudGuardadoPendiente.opciones=combinarOpcionesGuardado(solicitudGuardadoPendiente.opciones,opciones);
                    solicitudGuardadoPendiente.resolvers.push({resolve,reject});
                }else{
                    solicitudGuardadoPendiente={opciones:Object.assign({},opciones),resolvers:[{resolve,reject}]};
                }
                queueMicrotask(procesarGuardadoPendiente);
            });
        }
        async function guardarAhora(opciones={}) {
            const data = getData();
            ctx.reconstruirIndices();
            const versionBase = versionRemotaConocida || Number(data._version) || 0;
            let snapshot = crearSnapshotCompartido(data);
            if(!opciones.forzar&&lastSave&&contenidoComparable(snapshot)===contenidoComparable(lastSave)) return true;
            data._versionBase = versionBase;
            data._version = Date.now();
            data._revisionId = crearRevisionId();
            data._savedBy = window._usuarioActual || 'usuario';
            data._savedAt = new Date().toISOString();
            asignarRevisionAuditoria(data.auditoria,data._revisionId);
            snapshot = crearSnapshotCompartido(data);
            snapshot._versionBase=data._versionBase;
            snapshot._version=data._version;
            snapshot._revisionId=data._revisionId;
            snapshot._savedBy=data._savedBy;
            snapshot._savedAt=data._savedAt;
            const json = JSON.stringify(snapshot);
            registrarRevisionLocal(data._revisionId);
            establecerEstadoSync('local_modificado');
            guardarSnapshotRecuperacion(opciones.motivo || 'guardado_seguro', json, snapshot, {forzar:!!opciones.snapshotForzado});
            await guardarEstadoLocal(json);
            await guardarPendienteLocal(json);
            establecerEstadoSync('pendiente');
            if (modoLocalInicio && !opciones.forzar) {
                ctx.setCambiosPendientes?.(true);
                establecerEstadoSync('modo_local');
                ctx.setSaveStatus?.('error','Guardado local',false);
                return false;
            }
            ctx.setCambiosPendientes?.(true);
            establecerEstadoSync('comparando');
            ctx.setSaveStatus?.('saving','Guardando...',false);
            if (conflictoRemoto && !opciones.forzar) {
                establecerEstadoSync('conflicto');
                ctx.setSaveStatus?.('error','Pendiente local',false);
                ctx.toast('Hay un conflicto pendiente. Sincroniza desde el menú antes de seguir.', 'error');
                return false;
            }
            try {
                const { db, doc, setDoc, getDoc, runTransaction } = window._fb;
                const ref = doc(db, 'planificador', 'datos');
                const payload = await crearPayloadFirestore(json, data);
                if (runTransaction) {
                    await runTransaction(db, async (transaction) => {
                        const snap = await transaction.get(ref);
                        if (snap.exists()) {
                            const remoto = await leerPayloadFirestore(snap.data(), {db, doc, getDoc:(chunkRef)=>transaction.get(chunkRef)});
                            const versionRemota = Number(remoto._version) || 0;
                            if(opciones.revisionRemotaEsperada&&String(remoto._revisionId||'')!==String(opciones.revisionRemotaEsperada)){
                                const err=new Error('conflicto-remoto'); err.remoto=remoto; throw err;
                            }
                            if(!opciones.revisionRemotaEsperada&&opciones.versionRemotaEsperada&&versionRemota!==Number(opciones.versionRemotaEsperada)){
                                const err=new Error('conflicto-remoto'); err.remoto=remoto; throw err;
                            }
                            validarSobrescrituraSegura({local:snapshot, remoto, versionRemota, versionBase, opciones});
                            const fusionAutorizada=(opciones.revisionRemotaEsperada&&String(remoto._revisionId||'')===String(opciones.revisionRemotaEsperada))||(!opciones.revisionRemotaEsperada&&opciones.versionRemotaEsperada&&versionRemota===Number(opciones.versionRemotaEsperada));
                            if (!fusionAutorizada && versionRemota > versionBase) {
                                const err = new Error('conflicto-remoto');
                                err.remoto = remoto;
                                throw err;
                            }
                        }
                        await escribirPayloadFirestore({db, doc, transaction, ref, payload, json});
                    });
                } else {
                    const snap = await getDoc(ref);
                    if (snap.exists()) {
                        const remoto = await leerPayloadFirestore(snap.data(), {db, doc, getDoc});
                        const versionRemota = Number(remoto._version) || 0;
                        if(opciones.revisionRemotaEsperada&&String(remoto._revisionId||'')!==String(opciones.revisionRemotaEsperada)){
                            const err=new Error('conflicto-remoto'); err.remoto=remoto; throw err;
                        }
                        if(!opciones.revisionRemotaEsperada&&opciones.versionRemotaEsperada&&versionRemota!==Number(opciones.versionRemotaEsperada)){
                            const err=new Error('conflicto-remoto'); err.remoto=remoto; throw err;
                        }
                        validarSobrescrituraSegura({local:snapshot, remoto, versionRemota, versionBase, opciones});
                        const fusionAutorizada=(opciones.revisionRemotaEsperada&&String(remoto._revisionId||'')===String(opciones.revisionRemotaEsperada))||(!opciones.revisionRemotaEsperada&&opciones.versionRemotaEsperada&&versionRemota===Number(opciones.versionRemotaEsperada));
                        if (!fusionAutorizada && versionRemota > versionBase) {
                            const err = new Error('conflicto-remoto');
                            err.remoto = remoto;
                            throw err;
                        }
                    }
                    await escribirPayloadFirestore({db, doc, setDoc, ref, payload, json});
                }
                cambioLocal = true;
                lastSave = json;
                versionRemotaConocida = Number(data._version) || Date.now();
                conflictoRemoto = false;
                await guardarEstadoLocal(json);
                await guardarBaseComun(json);
                await limpiarPendienteLocal();
                ctx.setCambiosPendientes?.(false);
                registrarUltimoRemoto(data);
                reiniciarReintentos();
                establecerEstadoSync('sincronizado');
                ctx.setSaveStatus?.('success','✓ Guardado');
                return true;
            } catch(e) {
                if (e?.message === 'sobrescritura-regresiva') {
                    conflictoRemoto = true;
                    establecerEstadoSync('conflicto');
                    ctx.setSaveStatus?.('error','Sincroniza primero',false);
                    const quien = e.remoto?._savedBy || 'otro usuario';
                    ctx.toast(`${quien} tiene una versión más nueva con más planificación. Sincroniza antes de guardar para no borrar avances.`, 'error');
                    return false;
                }
                if (e?.message === 'conflicto-remoto') {
                    conflictoRemoto = true;
                    establecerEstadoSync('conflicto');
                    ctx.setSaveStatus?.('error','Pendiente local',false);
                    const quien = e.remoto?._savedBy || 'otro usuario';
                    ctx.toast(`${quien} guardó cambios antes que tú. Sincroniza antes de seguir.`, 'error');
                    return false;
                }
                console.error('Error al guardar en la nube:', e);
                ctx.setCambiosPendientes?.(true);
                establecerEstadoSync(navigator.onLine?'pendiente':'sin_conexion');
                ctx.setSaveStatus?.('error','Guardado local',false);
                ctx.toast(`${describirErrorFirebase(e)} Tus cambios quedaron guardados localmente.`, 'error');
                programarReintento();
                return false;
            }
        }
        function programarReintento(){
            if(reintentoTimer||conflictoRemoto||!leerPendienteLocal()?.json) return;
            if(!navigator.onLine){ establecerEstadoSync('sin_conexion'); return; }
            const indice=Math.min(reintentoNumero,RETRY_DELAYS.length-1);
            const demora=RETRY_DELAYS[indice];
            reintentoNumero++;
            establecerEstadoSync('reconectando',`Reconectando ${Math.min(reintentoNumero,RETRY_DELAYS.length)}/${RETRY_DELAYS.length}`);
            reintentoTimer=setTimeout(async()=>{
                reintentoTimer=null;
                const ok=await reintentarPendienteLocal();
                if(ok) reiniciarReintentos();
                else if(!conflictoRemoto) programarReintento();
            },demora);
        }
        async function reintentarPendienteLocal() {
            const pendiente = leerPendienteLocal();
            if (!pendiente?.json) return false;
            if (conflictoRemoto) {
                establecerEstadoSync('conflicto');
                return false;
            }
            try {
                const actual = JSON.stringify(crearSnapshotCompartido(getData()));
                if (actual !== pendiente.json) {
                    await guardarEstadoLocal(actual);
                    await guardarPendienteLocal(actual);
                    establecerEstadoSync('pendiente');
                    ctx.setCambiosPendientes?.(true);
                }
                establecerEstadoSync('reconectando');
                const ok = await recargarDesdeFirestore({silencioso:true,automatico:true});
                if (ok) ctx.toast('Cambios locales sincronizados con Firebase','success');
                return ok;
            } catch(e) {
                establecerEstadoSync('pendiente');
                return false;
            }
        }
        if (typeof window !== 'undefined' && !window._planificadorSyncRetryInstalado) {
            window._planificadorSyncRetryInstalado = true;
            window.addEventListener('online', () => {
                programarReintento();
            });
            window.addEventListener('offline',()=>{
                if(reintentoTimer){ clearTimeout(reintentoTimer); reintentoTimer=null; }
                establecerEstadoSync('sin_conexion');
            });
        }
        async function cargar() {
            const data = getData();
            await inicializarAlmacenLocal();
            const pendienteInicio=leerPendienteLocal();
            let conectadoNube = false;
            while (!conectadoNube) {
                establecerEstadoSync('reconectando');
                ctx.setSaveStatus?.('saving','Sincronizando con la nube...',false);
                const { db, doc, onSnapshot } = window._fb;
                const ref = doc(db, 'planificador', 'datos');
                try {
                    const remoto=await leerRemotoConsistente(ref);
                    if (remoto) {
                        establecerEstadoSync('comparando');
                        const jsonRemoto=JSON.stringify(remoto);
                        if(pendienteInicio?.json&&pendienteInicio.json!==jsonRemoto){
                            const localPendiente=JSON.parse(pendienteInicio.json);
                            Object.assign(data,localPendiente);
                            data.configuracion=Object.assign({},JSON.parse(JSON.stringify(ctx.CONFIG_DEFAULT)),data.configuracion);
                            data.auditoria=data.auditoria||[];
                            data.temporadas=data.temporadas||[];
                            data.temporadaData=data.temporadaData||{};
                            versionRemotaConocida=Number(remoto._version)||0;
                            conflictoRemoto=false;
                            establecerEstadoSync('pendiente');
                        }else{
                            await aplicarRemoto(remoto,jsonRemoto);
                            if(pendienteInicio?.json===jsonRemoto) await limpiarPendienteLocal();
                        }
                        ctx.normalizarDatos?.();
                        ctx.reconstruirIndices?.();
                    }
                    const hayPendiente=!!leerPendienteLocal()?.json;
                    establecerEstadoSync(hayPendiente?'pendiente':'sincronizado');
                    ctx.setCambiosPendientes?.(hayPendiente);
                    ctx.setSaveStatus?.(hayPendiente?'error':'success',hayPendiente?'Pendiente local':'✓ Sincronizado',!hayPendiente);
                    modoLocalInicio = false;
                    instalarSnapshot(ref, onSnapshot);
                    conectadoNube = true;
                } catch(e) {
                    establecerEstadoSync(navigator.onLine?'pendiente':'sin_conexion');
                    ctx.setSaveStatus?.('error','Sin sincronizar',false);
                    console.warn('Sincronización inicial no disponible:', e);
                    const decision = await pedirModoLocal(e, hayDatosLocales());
                    if (decision === 'retry') continue;
                    if (decision === 'local') {
                        cargarLocal(data);
                        modoLocalInicio = true;
                        establecerEstadoSync('modo_local');
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
                establecerEstadoSync('pendiente');
                ctx.setSaveStatus?.('error','Pendiente local',false);
                programarReintento();
            }
        }

        return {
            guardar,
            cargar,
            recargarDesdeFirestore,
            listarSnapshotsRecuperacion,
            obtenerSnapshotRecuperacion,
            crearSnapshotActual,
            guardarRestauracionLocal,
            hayConflictoRemoto: () => conflictoRemoto
        };
    }

    window.PlanificadorSync = { create: createSync };
})();
