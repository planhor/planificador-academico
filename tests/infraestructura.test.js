const test = require('node:test');
const assert = require('node:assert/strict');

const { crearDatosBase } = require('./fixtures/datos-base');
const { cargarModulo } = require('./helpers/cargar-modulo');

test('el fixture academico conserva referencias coherentes', () => {
    const data = crearDatosBase();
    const seccion = data.secciones[0];
    const nivel = data.niveles.find(item => item.id === seccion.nivelId);
    const relacion = data.asignaturaSeccion[0];

    assert.ok(nivel);
    assert.equal(nivel.carreraId, data.carreras[0].id);
    assert.equal(relacion.seccionId, seccion.id);
    assert.equal(relacion.asignaturaId, data.asignaturas[0].id);
});

test('cada fixture es independiente', () => {
    const primero = crearDatosBase();
    const segundo = crearDatosBase();

    primero.docentes[0].disponibilidad[0][0] = false;
    primero.planificaciones.push({ id: 'plan-1' });

    assert.equal(segundo.docentes[0].disponibilidad[0][0], true);
    assert.equal(segundo.planificaciones.length, 0);
});

const modulosConFactory = [
    ['sync.js', 'PlanificadorSync'],
    ['exportaciones.js', 'PlanificadorExportaciones'],
    ['vista-horario.js', 'PlanificadorVistaHorario'],
    ['reportes.js', 'PlanificadorReportes'],
    ['ficha-docente.js', 'PlanificadorFichaDocente'],
    ['entidades.js', 'PlanificadorEntidades'],
    ['planificacion.js', 'PlanificadorPlanificacion'],
    ['configuracion.js', 'PlanificadorConfiguracion']
];

for (const [archivo, exportacion] of modulosConFactory) {
    test(`${archivo} expone su factory publica`, () => {
        const modulo = cargarModulo(archivo, exportacion);
        assert.equal(typeof modulo.create, 'function');
    });
}

test('utils.js expone sus helpers compartidos', () => {
    const utils = cargarModulo('utils.js', 'PlanificadorUtils');
    assert.equal(utils.escapeHTML('<Planhor>'), '&lt;Planhor&gt;');
    assert.equal(typeof utils.optionHTML, 'function');
});
