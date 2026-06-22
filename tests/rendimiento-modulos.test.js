const test = require('node:test');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');

const { crearDatosMasivos } = require('./fixtures/datos-masivos');
const { crearReportesPrueba } = require('./helpers/crear-reportes');
const { crearPlanificacionPrueba } = require('./helpers/crear-planificacion');
const { cargarSolverFactory } = require('./helpers/cargar-solver');

function medir(funcion) {
    const inicio = performance.now();
    const resultado = funcion();
    return { resultado, ms: performance.now() - inicio };
}

test('reportes reales procesan 3.000 bloques sin perder estructura', () => {
    const data = crearDatosMasivos({ carreras: 5, nivelesPorCarrera: 5, seccionesPorNivel: 5 });
    data._version = 1;
    const reportes = crearReportesPrueba(data);
    const tipos = ['cargaDocente', 'incompletas', 'integridadDatos', 'conflictos'];
    const medicion = medir(() => tipos.map(tipo => [tipo, reportes.obtenerDatosReporte(tipo)]));

    assert.equal(data.planificaciones.length, 3000);
    medicion.resultado.forEach(([tipo, reporte]) => {
        assert.ok(Array.isArray(reporte.columnas), `${tipo} no entregó columnas`);
        assert.ok(Array.isArray(reporte.datos), `${tipo} no entregó datos`);
    });
    assert.ok(medicion.ms < 5000, `Reportes masivos demasiado lentos: ${medicion.ms.toFixed(1)} ms`);
});

test('la puntuación real del solver evalúa 3.000 bloques en la suite cotidiana', () => {
    const data = crearDatosMasivos({ carreras: 5, nivelesPorCarrera: 5, seccionesPorNivel: 5 });
    const factory = cargarSolverFactory();
    const { api } = crearPlanificacionPrueba(data, { factory });
    const medicion = medir(() => api.__pruebas.scoreGlobalPlanificaciones(data.planificaciones));

    assert.equal(medicion.resultado.planificados, 3000);
    assert.ok(Number.isFinite(medicion.resultado.score));
    assert.ok(Number.isFinite(medicion.resultado.costoTotal));
    assert.ok(medicion.ms < 5000, `Puntuación global demasiado lenta: ${medicion.ms.toFixed(1)} ms`);
});

test('el solver real ejecuta una búsqueda rápida sobre un alcance acotado', () => {
    const data = crearDatosMasivos({ carreras: 1, nivelesPorCarrera: 1, seccionesPorNivel: 2, docentes: 20, salas: 15 });
    data.sel.carreraId = data.carreras[0].id;
    data.sel.nivelId = data.niveles[0].id;
    data.sel.seccionId = data.secciones[0].id;
    const factory = cargarSolverFactory();
    const { api } = crearPlanificacionPrueba(data, { factory });
    const medicion = medir(() => api.__pruebas.simularOptimizacionHorario({
        alcance: 'seccion',
        profundidad: 'rapido',
        maxMovimientos: 1,
        objetivo: 'auto'
    }));

    assert.equal(data.planificaciones.length, 48);
    assert.ok(Array.isArray(medicion.resultado.planificaciones));
    assert.ok(Array.isArray(medicion.resultado.movimientos));
    assert.ok(Number.isFinite(medicion.resultado.rutasEvaluadas));
    assert.ok(medicion.ms < 5000, `Solver acotado demasiado lento: ${medicion.ms.toFixed(1)} ms`);
});

test('los índices del score conservan la cobertura de asignaturas heredadas', () => {
    const data = crearDatosMasivos({ carreras: 1, nivelesPorCarrera: 1, seccionesPorNivel: 2, asignaturasPorNivel: 1, docentes: 4, salas: 4 });
    const madre = data.secciones[0];
    const heredada = data.secciones[1];
    const asignatura = data.asignaturas[0];
    data.planificaciones = data.planificaciones.filter(plan => plan.seccionId === madre.id);
    data.gruposDictacion = [{
        id: 'grupo-heredado',
        asignaturaId: asignatura.id,
        seccionMadreId: madre.id,
        seccionesVinculadasIds: [heredada.id]
    }];
    const factory = cargarSolverFactory();
    const { api } = crearPlanificacionPrueba(data, { factory });
    const score = api.__pruebas.scoreGlobalPlanificaciones(data.planificaciones);

    assert.equal(score.requeridos, 8);
    assert.equal(score.planificados, 8);
    assert.equal(score.cobertura, 100);
});
