const test = require('node:test');
const assert = require('node:assert/strict');

const { crearDatosBase } = require('./fixtures/datos-base');
const { crearPlanificacionPrueba } = require('./helpers/crear-planificacion');

test('una sección no admite dos clases en el mismo bloque', () => {
    const data = crearDatosBase();
    data.planificaciones.push({
        id: 'p1', seccionId: 'sec-1', asignaturaId: 'asi-otra', docenteId: 'doc-otro', salaId: 'sala-otra', dia: 0, bloque: 2
    });
    const { api } = crearPlanificacionPrueba(data);

    assert.equal(api.checkDisponibilidad('doc-1', 0, 2, 'sec-1').ok, false);
});

test('un docente no admite dos clases simultáneas', () => {
    const data = crearDatosBase();
    data.planificaciones.push({
        id: 'p1', seccionId: 'sec-otra', asignaturaId: 'asi-otra', docenteId: 'doc-1', salaId: 'sala-otra', dia: 1, bloque: 3
    });
    const { api } = crearPlanificacionPrueba(data);

    assert.equal(api.checkDisponibilidad('doc-1', 1, 3, 'sec-1').ok, false);
});

test('una sala presencial no admite dos clases simultáneas', () => {
    const data = crearDatosBase();
    data.planificaciones.push({
        id: 'p1', seccionId: 'sec-otra', asignaturaId: 'asi-otra', docenteId: 'doc-otro', salaId: 'sala-1', dia: 2, bloque: 4
    });
    const { api } = crearPlanificacionPrueba(data);

    assert.equal(api.checkDisponibilidad('doc-1', 2, 4, 'sec-1').ok, false);
});

test('un bloque virtual no queda bloqueado por una sala física ocupada', () => {
    const data = crearDatosBase();
    data.sel.tipo = 'virtual';
    data.planificaciones.push({
        id: 'p1', seccionId: 'sec-otra', asignaturaId: 'asi-otra', docenteId: 'doc-otro', salaId: 'sala-1', dia: 2, bloque: 4
    });
    const { api } = crearPlanificacionPrueba(data);

    assert.equal(api.checkDisponibilidad('doc-1', 2, 4, 'sec-1').ok, true);
});

test('el máximo semestral bloquea salvo autorización explícita', () => {
    const data = crearDatosBase();
    data.configuracion.bloquesSemestralesMax = 2;
    data.planificaciones.push(
        { id: 'p1', seccionId: 'sec-a', asignaturaId: 'asi-a', docenteId: 'doc-1', salaId: 'sala-a', dia: 0, bloque: 1 },
        { id: 'p2', seccionId: 'sec-b', asignaturaId: 'asi-b', docenteId: 'doc-1', salaId: 'sala-b', dia: 2, bloque: 2 }
    );
    const { api } = crearPlanificacionPrueba(data);

    assert.equal(api.checkDisponibilidad('doc-1', 4, 4, 'sec-1').ok, false);
    data.docentes[0].autorizadoExceder = true;
    assert.equal(api.checkDisponibilidad('doc-1', 4, 4, 'sec-1').ok, true);
});

test('se respeta el descanso configurado entre jornadas', () => {
    const data = crearDatosBase();
    data.planificaciones.push({
        id: 'p1', seccionId: 'sec-otra', asignaturaId: 'asi-otra', docenteId: 'doc-1', salaId: 'sala-otra', dia: 0, bloque: 18
    });
    const { api } = crearPlanificacionPrueba(data);

    data.configuracion.horasDescanso = 12;
    assert.equal(api.checkDisponibilidad('doc-1', 1, 1, 'sec-1').ok, false);
    data.configuracion.horasDescanso = 8;
    assert.equal(api.checkDisponibilidad('doc-1', 1, 1, 'sec-1').ok, true);
});

test('Docente NN omite disponibilidad, pero no los topes de sección', () => {
    const data = crearDatosBase();
    data.docentes.push({
        id: 'docente-nn', nombre: 'Docente NN', disponibilidad: Array.from({ length: 6 }, () => Array(18).fill(false))
    });
    const { api } = crearPlanificacionPrueba(data);

    assert.equal(api.checkDisponibilidad('docente-nn', 0, 1, 'sec-1').ok, true);
    data.planificaciones.push({
        id: 'p1', seccionId: 'sec-1', asignaturaId: 'asi-otra', docenteId: 'doc-otro', salaId: 'sala-otra', dia: 0, bloque: 1
    });
    assert.equal(api.checkDisponibilidad('docente-nn', 0, 1, 'sec-1').ok, false);
});

test('una sala con capacidad insuficiente exige confirmación', () => {
    const preparar = () => {
        const data = crearDatosBase();
        data.gruposDictacion.push({
            id: 'grupo-1',
            asignaturaId: 'asi-1',
            seccionMadreId: 'sec-1',
            seccionesVinculadasIds: [],
            alumnosBase: 40,
            alumnosVinculados: 0,
            alumnosTotales: 40
        });
        data.salas[0].capacidad = 35;
        return data;
    };

    const rechazada = preparar();
    let mensaje = '';
    const pruebaRechazo = crearPlanificacionPrueba(rechazada, { confirm: texto => { mensaje = texto; return false; } });
    assert.equal(pruebaRechazo.api.asignarBloque(0, 1, { omitirGuardar: true }), false);
    assert.equal(rechazada.planificaciones.length, 0);
    assert.match(mensaje, /40/);
    assert.match(mensaje, /35/);

    const aceptada = preparar();
    const pruebaAceptacion = crearPlanificacionPrueba(aceptada, { confirm: () => true });
    assert.equal(pruebaAceptacion.api.asignarBloque(0, 1, { omitirGuardar: true }), true);
    assert.equal(aceptada.planificaciones.length, 1);
});
