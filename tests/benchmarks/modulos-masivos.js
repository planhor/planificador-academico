const { performance } = require('node:perf_hooks');

const { crearDatosMasivos } = require('../fixtures/datos-masivos');
const { crearReportesPrueba } = require('../helpers/crear-reportes');
const { crearPlanificacionPrueba } = require('../helpers/crear-planificacion');
const { cargarSolverFactory } = require('../helpers/cargar-solver');

function medir(nombre, funcion) {
    const inicio = performance.now();
    const resultado = funcion();
    return { nombre, ms: performance.now() - inicio, resultado };
}

function ejecutar() {
    const datosReportes = crearDatosMasivos({ carreras: 5, nivelesPorCarrera: 5, seccionesPorNivel: 5 });
    datosReportes._version = 1;
    const reportes = crearReportesPrueba(datosReportes);
    const mediciones = [
        medir('Reporte carga docente (3.000)', () => reportes.obtenerDatosReporte('cargaDocente')),
        medir('Reporte incompletas (3.000)', () => reportes.obtenerDatosReporte('incompletas')),
        medir('Integridad datos (3.000)', () => reportes.obtenerDatosReporte('integridadDatos')),
        medir('Conflictos (3.000)', () => reportes.obtenerDatosReporte('conflictos'))
    ];

    const datosScore = crearDatosMasivos();
    const factoryScore = cargarSolverFactory();
    const solverScore = crearPlanificacionPrueba(datosScore, { factory: factoryScore }).api.__pruebas;
    mediciones.push(medir('Score solver (12.000)', () => solverScore.scoreGlobalPlanificaciones(datosScore.planificaciones)));

    const datosSolver = crearDatosMasivos({ carreras: 1, nivelesPorCarrera: 1, seccionesPorNivel: 10, docentes: 40, salas: 30 });
    datosSolver.sel.carreraId = datosSolver.carreras[0].id;
    datosSolver.sel.nivelId = datosSolver.niveles[0].id;
    datosSolver.sel.seccionId = datosSolver.secciones[0].id;
    const factoryBusqueda = cargarSolverFactory();
    const solverBusqueda = crearPlanificacionPrueba(datosSolver, { factory: factoryBusqueda }).api.__pruebas;
    mediciones.push(medir('Solver rápido (240)', () => solverBusqueda.simularOptimizacionHorario({
        alcance: 'seccion', profundidad: 'rapido', maxMovimientos: 1, objetivo: 'auto'
    })));

    console.table(mediciones.map(item => ({ operación: item.nombre, ms: item.ms.toFixed(2) })));
}

ejecutar();
