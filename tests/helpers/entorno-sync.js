const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function crearEntornoSync(opciones = {}) {
    const ruta = path.resolve(__dirname, '../../docs/planificador_modulos/sync.js');
    const original = fs.readFileSync(ruta, 'utf8');
    const marcador = '        return {\n            guardar,';
    if (!original.includes(marcador)) throw new Error('Marcador de instrumentación Sync ausente');
    const fuente = original.replace(marcador, `        return {
            __pruebas: { inicializarAlmacenLocal, guardarBaseComun, guardarEstadoLocal,
                leerPendienteLocal, instalarSnapshot, crearSnapshotCompartido },
            guardar,`);
    const storage = opciones.storage || new Map();
    const registrosIDB = opciones.registrosIDB || new Map();
    const eventos = {};
    const eventosDocumento = {};
    const temporizadores = new Map();
    let siguienteTimer = 1;
    const escrituras = [];
    const estados = [];
    const avisos = [];
    const base = opciones.base || {
        docentes: [{ id: 'd1', nombre: 'Base sintética' }], salas: [],
        sel: {}, configuracion: {}, temporadas: [], temporadaData: {},
        _version: 1, _revisionId: 'revision-base'
    };
    const data = structuredClone(opciones.data || base);
    let remoto = structuredClone(opciones.remoto || base);
    let confirmaciones = 0;
    let snapshotCallback;
    const fallarStorage = clave => !!opciones.fallarStorage || clave === opciones.fallarStorageKey;
    const localStorage = {
        getItem: clave => { if (fallarStorage(clave)) throw new Error('storage-denied'); return storage.get(clave) ?? null; },
        setItem: (clave, valor) => { if (fallarStorage(clave)) throw new Error('quota-exceeded'); storage.set(clave, String(valor)); },
        removeItem: clave => { if (fallarStorage(clave)) throw new Error('storage-denied'); storage.delete(clave); }
    };
    const dbLocal = {
        objectStoreNames: { contains: () => true },
        transaction: (_nombre, modo) => {
            const tx = {};
            tx.objectStore = () => ({
                get: clave => {
                    const req = {};
                    queueMicrotask(() => { req.result = structuredClone(registrosIDB.get(clave)); req.onsuccess?.(); });
                    return req;
                },
                put: (valor, clave) => queueMicrotask(async () => {
                    await opciones.antesEscrituraIDB?.(clave, valor);
                    if (opciones.abortarIDB || opciones.abortarClavesIDB?.includes(clave)) { tx.error = new Error('indexeddb-abortado'); tx.onabort?.(); }
                    else { registrosIDB.set(clave, structuredClone(valor)); tx.oncomplete?.(); }
                }),
                delete: clave => queueMicrotask(() => { registrosIDB.delete(clave); tx.oncomplete?.(); })
            });
            return tx;
        }
    };
    const indexedDB = opciones.usarIDB ? { open: () => {
        const req = {};
        queueMicrotask(() => { req.result = dbLocal; req.onsuccess?.(); });
        return req;
    } } : undefined;
    const window = {
        _usuarioActual: 'sintetico@example.invalid',
        addEventListener: (nombre, callback) => { eventos[nombre] = callback; }
    };
    const snap = () => ({ exists: () => true, data: () => structuredClone(remoto), metadata: { hasPendingWrites: false } });
    window._fb = {
        db: {}, doc: (_db, ...partes) => partes.join('/'),
        runTransaction: async (_db, callback) => {
            if (opciones.fallarRed) throw Object.assign(new Error('sin-red'), { code: 'unavailable' });
            return callback({ get: async () => {
                const lectura = snap();
                await opciones.antesLecturaRemota?.();
                return lectura;
            }, set: (ref, valor) => {
                escrituras.push({ ref, valor: structuredClone(valor) });
                if (ref === 'planificador/datos') remoto = structuredClone(valor);
            } });
        },
        onSnapshot: (_ref, _opciones, callback) => { snapshotCallback = callback; return () => {}; }
    };
    const contexto = vm.createContext({
        window, localStorage, indexedDB, navigator: { onLine: true },
        document: { visibilityState: 'visible', addEventListener: (nombre, callback) => { eventosDocumento[nombre] = callback; } },
        console: { warn: () => {}, log: () => {}, error: () => {} },
        TextEncoder, Uint8Array, crypto: require('node:crypto').webcrypto,
        setTimeout: callback => { const id = siguienteTimer++; temporizadores.set(id, callback); return id; },
        clearTimeout: id => temporizadores.delete(id), queueMicrotask
    });
    vm.runInContext(fuente, contexto, { filename: ruta });
    const sync = window.PlanificadorSync.create({
        getData: () => data, CONFIG_DEFAULT: {}, genId: () => 'temporada-sintetica',
        SALA_VIRTUAL_ID: 'sala-virtual', SALA_TRO2_ID: 'sala-tro2',
        reconstruirIndices: () => {}, normalizarDatos: () => {}, refrescarTodo: () => {},
        setCambiosPendientes: () => {}, setSaveStatus: (...args) => estados.push(args),
        toast: (...args) => avisos.push(args),
        confirmarRestauracion: async () => { confirmaciones++; return !!opciones.confirmar; }
    });
    async function drenar() { for (let i = 0; i < 30; i++) await Promise.resolve(); }
    return {
        sync, data, base, storage, registrosIDB, escrituras, estados, avisos, opciones,
        get confirmaciones() { return confirmaciones; },
        drenar,
        async iniciar() { await sync.__pruebas.inicializarAlmacenLocal(); },
        async prepararRestauracion() {
            await sync.__pruebas.guardarBaseComun(JSON.stringify(base));
            data.docentes[0].nombre = 'Restaurado sintético';
            return sync.guardarRestauracionLocal();
        },
        async evento(nombre) { (eventos[nombre] || eventosDocumento[nombre])?.(); await drenar(); },
        async ejecutarTimer() {
            const primer = temporizadores.entries().next().value;
            if (primer) { temporizadores.delete(primer[0]); await primer[1](); }
            await drenar();
        },
        async emitirSnapshot() {
            sync.__pruebas.instalarSnapshot('planificador/datos', window._fb.onSnapshot);
            snapshotCallback(snap()); await drenar();
        }
    };
}

module.exports = { crearEntornoSync };
