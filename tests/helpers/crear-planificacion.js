const { cargarModulo } = require('./cargar-modulo');

const HORARIOS = Array.from({ length: 18 }, (_, indice) => ({
    n: indice + 1,
    hIni: 8 * 60 + indice * 50,
    hFin: 8 * 60 + indice * 50 + 45
}));
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function mismoId(a, b) {
    return String(a ?? '') === String(b ?? '');
}

function crearPlanificacionPrueba(data, opciones = {}) {
    const avisos = [];
    const estadoDictacion = (asignaturaId, seccionId) => {
        const grupo = (data.gruposDictacion || []).find(item =>
            mismoId(item.asignaturaId, asignaturaId) &&
            (mismoId(item.seccionMadreId, seccionId) ||
                (item.seccionesVinculadasIds || []).some(id => mismoId(id, seccionId)))
        );
        if (!grupo) return { estado: 'sin-grupo', grupo: null };
        return mismoId(grupo.seccionMadreId, seccionId)
            ? { estado: 'dictada-aqui', grupo }
            : { estado: 'vinculada', grupo };
    };
    const planesFiltrados = ignorarIds => {
        const ignorar = new Set((ignorarIds || []).map(String));
        return data.planificaciones.filter(plan => !ignorar.has(String(plan.id)));
    };
    const indicePlan = () => Object.fromEntries(data.planificaciones.map(plan => [
        `${plan.seccionId}_${plan.dia}_${plan.bloque}`,
        plan
    ]));
    const ocupacionSala = () => Object.fromEntries(data.planificaciones
        .filter(plan => plan.salaId)
        .map(plan => [`${plan.salaId}_${plan.dia}_${plan.bloque}`, plan]));

    const ctx = {
        getData: () => data,
        toast: (mensaje, tipo) => avisos.push({ mensaje, tipo }),
        getEstadoDictacionAsignatura: estadoDictacion,
        getGruposDictacion: () => data.gruposDictacion || [],
        getPlanificacionesFiltradas: planesFiltrados,
        getIndicePlan: indicePlan,
        getOcupacionSala: ocupacionSala,
        getBloque: bloque => HORARIOS[Number(bloque) - 1] || null,
        DIAS,
        BLOQUES: HORARIOS,
        parsearCodigoSeccion: nombre => ({ tipo: String(nombre || '').startsWith('V-') ? 'V' : 'D' }),
        escapeHTML: valor => String(valor ?? ''),
        genId: (() => {
            let secuencia = 0;
            return () => `test-${++secuencia}`;
        })(),
        pushUndo: () => {},
        auditoria: () => {},
        guardar: () => {},
        reconstruirIndices: () => {},
        DOCENTE_NN_ID: 'docente-nn',
        SALA_VIRTUAL_ID: 'sala-virtual',
        SALA_TRO2_ID: 'sala-tro2'
    };

    const factory = opciones.factory || cargarModulo('planificacion.js', 'PlanificadorPlanificacion', {
        confirm: opciones.confirm || (() => true)
    });
    return { api: factory.create(ctx), avisos, ctx };
}

module.exports = { crearPlanificacionPrueba };
