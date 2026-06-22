const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const MODULOS_DIR = path.resolve(__dirname, '../../docs/planificador_modulos');

function cargarModulo(archivo, exportacion, extras = {}) {
    const ruta = path.join(MODULOS_DIR, archivo);
    const { window: windowExterno, ...globales } = extras;
    const window = windowExterno || {};
    const contexto = vm.createContext({
        window,
        console,
        crypto: globalThis.crypto,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        ...globales
    });

    vm.runInContext(fs.readFileSync(ruta, 'utf8'), contexto, { filename: ruta });

    if (!window[exportacion]) {
        throw new Error(`${archivo} no expuso window.${exportacion}`);
    }
    return window[exportacion];
}

module.exports = { cargarModulo, MODULOS_DIR };
