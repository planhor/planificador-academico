const ENCABEZADO_GESTOR = [
    'Periodo', 'Sede', 'Institución', 'Programa', 'Programa', 'Jornada', 'Nivel',
    'Código de la asignatura', 'Asignatura', 'ID Sección', 'Sección', 'Alumnos',
    'Alumnos Otros Planes', 'Alumnos Totales', 'Tipo', 'Sala Referencia', 'Horas',
    'Horas Presenciales', 'Horas Virtuales', 'Tipo Asignatura', 'Area',
    'Modalidad Asignatura', 'Modalidad Sección'
];

function filaGestor({
    programa = 'IEL - Ingeniería Eléctrica',
    plan = 'IEL-IEL-2',
    jornada = 'DIURNA',
    nivel = '1',
    codigo = 'TST101',
    asignatura = 'Asignatura de prueba',
    id = '66900001',
    seccion = 'D-IEL-N1-P2-C1',
    alumnos = 20,
    otros = 0,
    total = alumnos + otros,
    tipo = 'Planificada',
    sala = '315-COMPUTACIÓN',
    horas = 72,
    presenciales = 54,
    virtuales = 18,
    tipoAsignatura = 'Lectiva',
    area = 'Energía',
    modalidad = 'Presencial'
} = {}) {
    return [
        'OTOÑO 2026', 'Sede', 'IP', programa, plan, jornada, nivel, codigo, asignatura,
        id, seccion, alumnos, otros, total, tipo, sala, horas, presenciales, virtuales,
        tipoAsignatura, area, modalidad, 'Presencial'
    ];
}

function gestorConFilasInformativas(filas = [filaGestor()]) {
    return [
        ['Informe Gestor Secciones'],
        ['Fecha de descarga', '21-06-2026'],
        ['Sede seleccionada', 'Prueba'],
        ['Periodo seleccionado', 'Otoño 2026'],
        ['Datos generales del informe'],
        ENCABEZADO_GESTOR,
        ...filas
    ];
}

module.exports = { ENCABEZADO_GESTOR, filaGestor, gestorConFilasInformativas };
