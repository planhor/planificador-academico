const { performance } = require('node:perf_hooks');

const { crearDatosMasivos } = require('../fixtures/datos-masivos');
const { cargarSyncPrueba } = require('../helpers/cargar-sync');

function medir(nombre, funcion) {
    const inicio = performance.now();
    const resultado = funcion();
    return { nombre, ms: performance.now() - inicio, resultado };
}

async function ejecutar() {
    const generacion = medir('Generación', () => crearDatosMasivos());
    const serializacion = medir('Serialización', () => JSON.stringify(generacion.resultado));
    const lectura = medir('Reconstrucción', () => JSON.parse(serializacion.resultado));
    const sync = cargarSyncPrueba();
    const inicioPayload = performance.now();
    const payload = await sync.crearPayloadFirestore(serializacion.resultado, { _version: 1, _revisionId: 'benchmark' });
    const payloadMs = performance.now() - inicioPayload;
    const memoria = process.memoryUsage();

    console.table([
        { operación: generacion.nombre, ms: generacion.ms.toFixed(2) },
        { operación: serializacion.nombre, ms: serializacion.ms.toFixed(2) },
        { operación: lectura.nombre, ms: lectura.ms.toFixed(2) },
        { operación: 'Payload Firebase', ms: payloadMs.toFixed(2) }
    ]);
    console.log({
        secciones: generacion.resultado.secciones.length,
        asignaturas: generacion.resultado.asignaturas.length,
        bloques: generacion.resultado.planificaciones.length,
        jsonMB: (serializacion.resultado.length / 1024 / 1024).toFixed(2),
        fragmentos: payload._chunkCount || 1,
        heapMB: (memoria.heapUsed / 1024 / 1024).toFixed(2)
    });
}

ejecutar().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
