const test = require('node:test');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');

const { crearDatosMasivos } = require('./fixtures/datos-masivos');
const { cargarSyncPrueba } = require('./helpers/cargar-sync');

function medir(funcion) {
    const inicio = performance.now();
    const resultado = funcion();
    return { resultado, ms: performance.now() - inicio };
}

test('el escenario masivo genera cientos de secciones y miles de bloques', () => {
    const medicion = medir(() => crearDatosMasivos());
    const data = medicion.resultado;

    assert.equal(data.carreras.length, 10);
    assert.equal(data.niveles.length, 50);
    assert.equal(data.secciones.length, 500);
    assert.equal(data.asignaturas.length, 300);
    assert.equal(data.asignaturaSeccion.length, 3000);
    assert.equal(data.planificaciones.length, 12000);
    assert.equal(new Set(data.planificaciones.map(plan => plan.id)).size, 12000);
    assert.ok(medicion.ms < 3000, `Generación masiva demasiado lenta: ${medicion.ms.toFixed(1)} ms`);
});

test('el estado masivo se serializa y reconstruye sin pérdida', () => {
    const data = crearDatosMasivos();
    const serializacion = medir(() => JSON.stringify(data));
    const lectura = medir(() => JSON.parse(serializacion.resultado));

    assert.ok(serializacion.resultado.length > 1_000_000);
    assert.equal(lectura.resultado.planificaciones.length, data.planificaciones.length);
    assert.equal(lectura.resultado.gestorSecciones.filas.length, data.gestorSecciones.filas.length);
    assert.ok(serializacion.ms < 3000, `Serialización demasiado lenta: ${serializacion.ms.toFixed(1)} ms`);
    assert.ok(lectura.ms < 3000, `Reconstrucción demasiado lenta: ${lectura.ms.toFixed(1)} ms`);
});

test('Firebase fragmenta el escenario masivo respetando integridad', async () => {
    const data = crearDatosMasivos();
    const json = JSON.stringify(data);
    const sync = cargarSyncPrueba();
    const inicio = performance.now();
    const payload = await sync.crearPayloadFirestore(json, { _version: 1, _revisionId: 'rev-masiva' });
    const duracion = performance.now() - inicio;
    const partes = sync.dividirPayload(json);

    assert.equal(payload._schema, 'planificador-json-chunks-v1');
    assert.equal(payload._chunkCount, partes.length);
    assert.equal(payload._payloadLength, json.length);
    assert.ok(partes.every(parte => parte.length <= 700000));
    assert.ok(duracion < 3000, `Fragmentación demasiado lenta: ${duracion.toFixed(1)} ms`);
});
