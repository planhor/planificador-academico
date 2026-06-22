const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const { cargarModulo } = require('./cargar-modulo');

function cargarGestorPrueba() {
    const ruta = path.resolve(__dirname, '../../docs/planificador_modulos/app.js');
    const marcador = '    const App = {';
    const inyeccion = `
    if(window.__modoPruebaGestor){
        window.__gestorPruebas={
            detectarColumnasGestor,
            leerFilaGestor,
            analizarGestorSecciones,
            normalizarPropuestaGestor,
            prepararRegistrosAplicacionGestor,
            construirMemoriaIdsGestor
        };
        return;
    }
`;
    const original = fs.readFileSync(ruta, 'utf8');
    if (!original.includes(marcador)) throw new Error('No se encontró el punto seguro de instrumentación del Gestor');

    const window = {
        __modoPruebaGestor: true,
        _appDebeIniciar: false,
        PlanificadorUtils: cargarModulo('utils.js', 'PlanificadorUtils')
    };
    const contexto = vm.createContext({
        window,
        console,
        crypto: globalThis.crypto,
        setTimeout,
        clearTimeout
    });
    vm.runInContext(original.replace(marcador, `${inyeccion}${marcador}`), contexto, { filename: ruta });
    window._iniciarApp();
    if (!window.__gestorPruebas) throw new Error('No se pudieron exponer las funciones del Gestor');
    return window.__gestorPruebas;
}

module.exports = { cargarGestorPrueba };
