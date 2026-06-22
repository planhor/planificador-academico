const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function cargarSolverFactory() {
    const ruta = path.resolve(__dirname, '../../docs/planificador_modulos/planificacion.js');
    const marcador = '        return {\n            construirGrilla,';
    const inyeccion = `        return {
            __pruebas:{
                scoreGlobalPlanificaciones,
                evaluarRestriccionesPlan,
                simularOptimizacionHorario,
                simularOptimizacionIterativa
            },
            construirGrilla,`;
    const original = fs.readFileSync(ruta, 'utf8');
    if (!original.includes(marcador)) throw new Error('No se encontró el punto seguro de instrumentación del solver');

    const window = {};
    const contexto = vm.createContext({
        window,
        console: { log: console.log, warn: () => {}, error: () => {} },
        crypto: globalThis.crypto,
        setTimeout,
        clearTimeout,
        confirm: () => true
    });
    vm.runInContext(original.replace(marcador, inyeccion), contexto, { filename: ruta });
    return window.PlanificadorPlanificacion;
}

module.exports = { cargarSolverFactory };
