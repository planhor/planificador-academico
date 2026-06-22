const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const test = require('node:test');
const assert = require('node:assert/strict');
const { crearDatosBase } = require('./fixtures/datos-base');
const { crearPlanificacionPrueba } = require('./helpers/crear-planificacion');

const VENDOR = path.resolve(__dirname, '../docs/planificador_modulos/vendor/glpk');

test('GLPK local carga su WASM y resuelve un MILP binario mínimo', async () => {
    const modulo = await import(pathToFileURL(path.join(VENDOR, 'glpk.js')).href);
    const wasm = fs.readFileSync(path.join(VENDOR, 'glpk.wasm'));
    const glpk = await modulo.default(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
    const resultado = glpk.solve({
        name: 'smoke',
        objective: { direction: glpk.GLP_MAX, name: 'objetivo', vars: [{ name: 'x', coef: 1 }] },
        subjectTo: [{ name: 'limite', vars: [{ name: 'x', coef: 1 }], bnds: { type: glpk.GLP_UP, lb: 0, ub: 1 } }],
        binaries: ['x']
    }, { msglev: glpk.GLP_MSG_OFF, presol: true });

    assert.equal(resultado.result.status, glpk.GLP_OPT);
    assert.equal(resultado.result.vars.x, 1);
});

test('la distribución GLPK local conserva licencia y no depende de CDN', () => {
    assert.ok(fs.existsSync(path.join(VENDOR, 'LICENSE')));
    const worker = fs.readFileSync(path.resolve(__dirname, '../docs/planificador_modulos/solver-worker.js'), 'utf8');
    assert.match(worker, /\.\/vendor\/glpk\/glpk\.js/);
    assert.match(worker, /\.\/vendor\/glpk\/glpk\.wasm/);
    assert.doesNotMatch(worker, /cdn|unpkg|jsdelivr/i);
});

test('el modelo matemático selecciona movimientos y devuelve una planificación validada', async () => {
    const data = crearDatosBase();
    data.planificaciones = [1, 4, 7, 10].map((bloque, indice) => ({
        id: `p${indice + 1}`, seccionId: 'sec-1', asignaturaId: 'asi-1', docenteId: 'doc-1',
        salaId: 'sala-1', dia: 0, bloque, tipoPresencial: true, fijo: false
    }));
    const { api } = crearPlanificacionPrueba(data);
    const preparacion = api.prepararOptimizacionMatematica({
        alcance: 'seccion', profundidad: 'rapido', maxMovimientos: 2, objetivo: 'estudiantes'
    });
    assert.ok(preparacion.candidatos.length > 0);

    const modulo = await import(pathToFileURL(path.join(VENDOR, 'glpk.js')).href);
    const wasm = fs.readFileSync(path.join(VENDOR, 'glpk.wasm'));
    const glpk = await modulo.default(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
    const subjectTo = [{
        name: 'max_movimientos',
        vars: preparacion.candidatos.map(c => ({ name: c.id, coef: 1 })),
        bnds: { type: glpk.GLP_UP, lb: 0, ub: preparacion.maxMovimientos }
    }];
    preparacion.incompatibles.forEach((par, indice) => subjectTo.push({
        name: `incompatible_${indice}`,
        vars: par.map(name => ({ name, coef: 1 })),
        bnds: { type: glpk.GLP_UP, lb: 0, ub: 1 }
    }));
    const solucion = glpk.solve({
        name: 'planhor_test',
        objective: { direction: glpk.GLP_MAX, name: 'mejora', vars: preparacion.candidatos.map(c => ({ name: c.id, coef: c.peso })) },
        subjectTo,
        binaries: preparacion.candidatos.map(c => c.id)
    }, { msglev: glpk.GLP_MSG_OFF, presol: true });
    const elegidos = Object.entries(solucion.result.vars).filter(([, valor]) => valor > 0.5).map(([id]) => id);
    const resultado = api.construirResultadoOptimizacionMatematica(preparacion, elegidos);

    assert.equal(resultado.motor, 'matematico');
    assert.ok(resultado.movimientos.length <= 2);
    assert.ok(resultado.scoreFinal.score >= resultado.scoreInicial.score);
    assert.equal(resultado.planificaciones.length, data.planificaciones.length);
});

test('el Worker conserva las tres rutas y fallback heurístico para el modo híbrido', () => {
    const worker = fs.readFileSync(path.resolve(__dirname, '../docs/planificador_modulos/solver-worker.js'), 'utf8');
    assert.match(worker, /motor==='matematico'/);
    assert.match(worker, /motor==='hibrido'/);
    assert.match(worker, /resolverHibrido/);
    assert.match(worker, /fallback-heuristico/);
    assert.match(worker, /basePlanificaciones:heuristico\.planificaciones/);
});
