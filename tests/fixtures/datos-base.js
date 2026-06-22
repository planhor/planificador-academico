function crearDatosBase() {
    return {
        temporadas: [{ id: 'temp-1', nombre: 'Otono 2026', anio: 2026 }],
        carreras: [{ id: 'car-1', codigo: 'TST-TST-1', nombre: 'Carrera de prueba', area: 'Area de prueba' }],
        niveles: [{ id: 'niv-1', carreraId: 'car-1', nombre: 'N1', tieneOnline: false }],
        secciones: [{ id: 'sec-1', nivelId: 'niv-1', nombre: 'D-TST-N1-P1-C1', jornada: 'diurna' }],
        asignaturas: [{
            id: 'asi-1',
            codigo: 'TST101',
            nombre: 'Asignatura de prueba',
            horasTotales: 72,
            horasPresenciales: 72,
            horasVirtuales: 0,
            tipoAsignatura: 'Lectiva',
            modalidad: 'Presencial'
        }],
        docentes: [{
            id: 'doc-1',
            nombre: 'Docente de prueba',
            especialidad: 'Area de prueba',
            asignaturasQueDicta: ['asi-1'],
            disponibilidad: Array.from({ length: 6 }, () => Array(18).fill(true))
        }],
        salas: [{ id: 'sala-1', nombre: 'Sala 101', capacidad: 35, tipoSala: 'Sala de clases' }],
        asignaturaCarreraNivel: [{ asignaturaId: 'asi-1', carreraId: 'car-1', nivelId: 'niv-1' }],
        asignaturaSeccion: [{ asignaturaId: 'asi-1', seccionId: 'sec-1' }],
        planificaciones: [],
        gruposDictacion: [],
        vinculosElectivos: [],
        gestorSecciones: { filas: [], ids: [], enlacesManuales: [] },
        modoPlan: true,
        configuracion: {
            sabadoHastaBloque: 18,
            bloquesDiariosMax: 13,
            bloquesSemestralesMax: 40,
            horasDescanso: 12
        },
        sel: {
            temporadaId: 'temp-1',
            carreraId: 'car-1',
            nivelId: 'niv-1',
            seccionId: 'sec-1',
            asignaturaId: 'asi-1',
            docenteId: 'doc-1',
            salaId: 'sala-1',
            tipo: 'presencial'
        }
    };
}

module.exports = { crearDatosBase };
