const { cargarModulo } = require('./cargar-modulo');

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function escapar(valor) {
    return String(valor ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function crearReportesPrueba(data) {
    const contadorDocente = {};
    data.planificaciones.forEach(plan => {
        contadorDocente[plan.docenteId] = (contadorDocente[plan.docenteId] || 0) + 1;
    });
    const factory = cargarModulo('reportes.js', 'PlanificadorReportes');
    return factory.create({
        getData: () => data,
        getPlanificaciones: () => data.planificaciones,
        getContadorDocente: () => contadorDocente,
        DIAS,
        DOCENTE_NN_ID: 'docente-nn',
        SALA_VIRTUAL_ID: 'sala-virtual',
        SALA_TRO2_ID: 'sala-tro2',
        escapeHTML: escapar,
        escapeAttr: escapar,
        optionHTML: (valor, texto) => `<option value="${escapar(valor)}">${escapar(texto)}</option>`,
        toast: () => {}
    });
}

module.exports = { crearReportesPrueba };
