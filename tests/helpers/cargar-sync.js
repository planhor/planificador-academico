const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function cargarSyncPrueba() {
    const ruta = path.resolve(__dirname, '../../docs/planificador_modulos/sync.js');
    const marcador = '        return {\n            guardar,';
    const inyeccion = `        return {
            __pruebas:{
                checksumRapido,
                validarTextoPayload,
                crearPayloadFirestore,
                dividirPayload,
                leerPayloadFirestore,
                fusionarTresVias,
                validarSobrescrituraSegura,
                asignarRevisionAuditoria,
                verificarIntegridadSnapshot
            },
            guardar,`;
    const original = fs.readFileSync(ruta, 'utf8');
    if (!original.includes(marcador)) throw new Error('No se encontró el punto seguro de instrumentación de Sync');

    const window = {
        _usuarioActual: 'usuario-prueba',
        addEventListener: () => {}
    };
    const contexto = vm.createContext({
        window,
        console: { log: console.log, warn: () => {}, error: () => {} },
        crypto: globalThis.crypto,
        TextEncoder,
        Uint8Array,
        setTimeout,
        clearTimeout,
        queueMicrotask
    });
    vm.runInContext(original.replace(marcador, inyeccion), contexto, { filename: ruta });
    const ctx = {
        getData: () => ({}),
        CONFIG_DEFAULT: {},
        DOCENTE_NN_ID: 'docente-nn',
        SALA_VIRTUAL_ID: 'sala-virtual',
        SALA_TRO2_ID: 'sala-tro2'
    };
    return window.PlanificadorSync.create(ctx).__pruebas;
}

module.exports = { cargarSyncPrueba };
