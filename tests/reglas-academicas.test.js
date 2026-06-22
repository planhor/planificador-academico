const test = require('node:test');
const assert = require('node:assert/strict');

const { crearDatosBase } = require('./fixtures/datos-base');
const { crearPlanificacionPrueba } = require('./helpers/crear-planificacion');

test('una modificación manual exige Modo Planificación', () => {
    const data = crearDatosBase();
    data.modoPlan = false;
    const { api, avisos } = crearPlanificacionPrueba(data);

    assert.equal(api.validarSeleccionManual({ requiereModo: true }), false);
    assert.match(avisos[0].mensaje, /Modo Planificación/);
});

test('un bloque presencial exige sala y uno virtual no', () => {
    const data = crearDatosBase();
    data.sel.salaId = '';
    const { api } = crearPlanificacionPrueba(data);

    data.sel.tipo = 'presencial';
    assert.equal(api.validarSeleccionManual({ silencioso: true }), false);

    data.sel.tipo = 'virtual';
    assert.equal(api.validarSeleccionManual({ silencioso: true }), true);
});

test('una asignatura heredada se edita únicamente desde la madre', () => {
    const data = crearDatosBase();
    data.secciones.push({ id: 'sec-2', nivelId: 'niv-1', nombre: 'D-TST-N1-P1-C2', jornada: 'diurna' });
    data.gruposDictacion.push({
        id: 'grupo-1',
        asignaturaId: 'asi-1',
        seccionMadreId: 'sec-1',
        seccionesVinculadasIds: ['sec-2']
    });
    data.sel.seccionId = 'sec-2';
    const { api, avisos } = crearPlanificacionPrueba(data);

    assert.equal(api.validarSeleccionManual(), false);
    assert.match(avisos[0].mensaje, /sección madre/i);
});

test('la disponibilidad del docente y el límite de sábado son obligatorios', () => {
    const data = crearDatosBase();
    data.docentes[0].disponibilidad[0][0] = false;
    data.configuracion.sabadoHastaBloque = 8;
    const { api } = crearPlanificacionPrueba(data);

    assert.equal(api.checkDisponibilidad('doc-1', 0, 1, 'sec-1').ok, false);
    assert.equal(api.checkDisponibilidad('doc-1', 5, 9, 'sec-1').ok, false);
    assert.equal(api.checkDisponibilidad('doc-1', 5, 8, 'sec-1').ok, true);
});

test('el máximo diario docente suma bloques presenciales y virtuales', () => {
    const data = crearDatosBase();
    data.configuracion.bloquesDiariosMax = 3;
    data.planificaciones = [
        { id: 'p1', seccionId: 'sec-x1', asignaturaId: 'a1', docenteId: 'doc-1', salaId: 'sala-1', dia: 1, bloque: 1, tipo: 'presencial' },
        { id: 'p2', seccionId: 'sec-x2', asignaturaId: 'a2', docenteId: 'doc-1', salaId: 'sala-virtual', dia: 1, bloque: 2, tipo: 'virtual' },
        { id: 'p3', seccionId: 'sec-x3', asignaturaId: 'a3', docenteId: 'doc-1', salaId: 'sala-1', dia: 1, bloque: 3, tipo: 'presencial' }
    ];
    const { api } = crearPlanificacionPrueba(data);

    assert.equal(api.checkDisponibilidad('doc-1', 1, 4, 'sec-1').ok, false);
});

test('una planificación madre respeta topes existentes en secciones heredadas', () => {
    const data = crearDatosBase();
    data.asignaturas.push({ id: 'asi-2', codigo: 'TST102', nombre: 'Otra asignatura' });
    data.secciones.push({ id: 'sec-2', nivelId: 'niv-1', nombre: 'D-TST-N1-P1-C2', jornada: 'diurna' });
    data.gruposDictacion.push({
        id: 'grupo-1',
        asignaturaId: 'asi-1',
        seccionMadreId: 'sec-1',
        seccionesVinculadasIds: ['sec-2']
    });
    data.planificaciones.push({
        id: 'p1', seccionId: 'sec-2', asignaturaId: 'asi-2', docenteId: 'doc-otro', salaId: 'sala-otra', dia: 2, bloque: 4
    });
    const { api } = crearPlanificacionPrueba(data);
    const resultado = api.checkDisponibilidad('doc-1', 2, 4, 'sec-1');

    assert.equal(resultado.ok, false);
    assert.match(resultado.msg, /C2/);
});

test('electivas vinculadas al mismo destino pueden compartir horario', () => {
    const data = crearDatosBase();
    data.asignaturas = [
        { id: 'elec-1', codigo: 'ELEC101', nombre: 'Electiva A', area: 'electiva' },
        { id: 'elec-2', codigo: 'ELEC102', nombre: 'Electiva B', area: 'electiva' }
    ];
    data.secciones.push(
        { id: 'sec-e1', nivelId: 'niv-1', nombre: 'ELEC-N1-C1', jornada: 'diurna' },
        { id: 'sec-e2', nivelId: 'niv-1', nombre: 'ELEC-N1-C2', jornada: 'diurna' }
    );
    data.vinculosElectivos = [
        { id: 've-1', asignaturaId: 'elec-1', seccionOrigenId: 'sec-e1', seccionDestinoId: 'sec-1' },
        { id: 've-2', asignaturaId: 'elec-2', seccionOrigenId: 'sec-e2', seccionDestinoId: 'sec-1' }
    ];
    data.planificaciones.push({
        id: 'p1', seccionId: 'sec-e2', asignaturaId: 'elec-2', docenteId: 'doc-otro', salaId: 'sala-otra', dia: 3, bloque: 5
    });
    data.sel.asignaturaId = 'elec-1';
    data.sel.seccionId = 'sec-e1';
    const { api } = crearPlanificacionPrueba(data);

    assert.equal(api.checkDisponibilidad('doc-1', 3, 5, 'sec-e1').ok, true);
});
