function disponibilidadCompleta() {
    return Array.from({ length: 6 }, () => Array(18).fill(true));
}

function crearDatosMasivos(opciones = {}) {
    const cfg = Object.assign({
        areas: 4,
        carreras: 10,
        nivelesPorCarrera: 5,
        seccionesPorNivel: 10,
        asignaturasPorNivel: 6,
        bloquesPorAsignatura: 4,
        docentes: 160,
        salas: 100
    }, opciones);
    const data = {
        temporadas: [{ id: 'temp-masiva', temporada: 'Otono', anio: 2026 }],
        carreras: [],
        niveles: [],
        secciones: [],
        asignaturas: [],
        docentes: [],
        salas: [],
        asignaturaCarreraNivel: [],
        asignaturaSeccion: [],
        planificaciones: [],
        gruposDictacion: [],
        vinculosElectivos: [],
        gestorSecciones: { cargas: [], ids: [], filas: [], enlacesManuales: [] },
        auditoria: [],
        configuracion: {
            bloquesDiariosMax: 13,
            bloquesSemestralesMax: 850,
            horasDescanso: 12,
            sabadoHastaBloque: 18
        },
        sel: { temporadaId: 'temp-masiva', tipo: 'presencial' }
    };

    for (let i = 0; i < cfg.docentes; i++) {
        data.docentes.push({
            id: `doc-${i + 1}`,
            nombre: `Docente ${i + 1}`,
            especialidad: `Area ${(i % cfg.areas) + 1}`,
            disponibilidad: disponibilidadCompleta(),
            asignaturasQueDicta: []
        });
    }
    for (let i = 0; i < cfg.salas; i++) {
        data.salas.push({
            id: `sala-${i + 1}`,
            nombre: `Sala ${String(i + 1).padStart(3, '0')}`,
            capacidad: 20 + (i % 4) * 5,
            tipoSala: i % 3 === 0 ? 'Laboratorio de Especialidad' : 'Sala de Clases'
        });
    }

    let indiceSeccion = 0;
    let indiceAsignatura = 0;
    let indicePlan = 0;
    for (let c = 0; c < cfg.carreras; c++) {
        const carreraId = `car-${c + 1}`;
        const plan = `CAR${c + 1}-CAR${c + 1}-${(c % 2) + 1}`;
        data.carreras.push({ id: carreraId, codigo: plan, nombre: `Carrera ${c + 1}`, area: `Area ${(c % cfg.areas) + 1}` });

        for (let n = 0; n < cfg.nivelesPorCarrera; n++) {
            const nivelId = `niv-${c + 1}-${n + 1}`;
            data.niveles.push({ id: nivelId, carreraId, nombre: `N${n + 1}`, tieneOnline: false });
            const seccionesNivel = [];

            for (let s = 0; s < cfg.seccionesPorNivel; s++) {
                indiceSeccion++;
                const seccionId = `sec-${indiceSeccion}`;
                const jornada = s % 2 === 0 ? 'diurna' : 'vespertina';
                const prefijo = jornada === 'diurna' ? 'D' : 'V';
                const seccion = {
                    id: seccionId,
                    nivelId,
                    nombre: `${prefijo}-CAR${c + 1}-N${n + 1}-P${(c % 2) + 1}-C${s + 1}`,
                    jornada
                };
                data.secciones.push(seccion);
                seccionesNivel.push(seccion);
            }

            for (let a = 0; a < cfg.asignaturasPorNivel; a++) {
                indiceAsignatura++;
                const asignaturaId = `asi-${indiceAsignatura}`;
                const codigo = `A${String(indiceAsignatura).padStart(4, '0')}`;
                data.asignaturas.push({
                    id: asignaturaId,
                    codigo,
                    nombre: `Asignatura ${indiceAsignatura}`,
                    horasTotales: cfg.bloquesPorAsignatura * 18,
                    horasPresenciales: cfg.bloquesPorAsignatura * 18,
                    horasVirtuales: 0,
                    bloquesPresenciales: cfg.bloquesPorAsignatura,
                    bloquesVirtuales: 0,
                    modalidad: a % 3 === 0 ? 'practica' : 'lectiva',
                    area: 'especialidad'
                });
                data.asignaturaCarreraNivel.push({ asignaturaId, carreraId, nivelId });

                seccionesNivel.forEach((seccion, seccionPosicion) => {
                    data.asignaturaSeccion.push({ asignaturaId, seccionId: seccion.id });
                    for (let b = 0; b < cfg.bloquesPorAsignatura; b++) {
                        indicePlan++;
                        const posicion = a * cfg.bloquesPorAsignatura + b;
                        data.planificaciones.push({
                            id: `plan-${indicePlan}`,
                            seccionId: seccion.id,
                            asignaturaId,
                            docenteId: `doc-${((indiceAsignatura + seccionPosicion) % cfg.docentes) + 1}`,
                            salaId: `sala-${((indiceSeccion + a) % cfg.salas) + 1}`,
                            dia: posicion % 5,
                            bloque: Math.floor(posicion / 5) + 1,
                            tipoPresencial: true
                        });
                    }
                    data.gestorSecciones.filas.push({
                        idSeccion: `ID-${indiceAsignatura}-${seccionPosicion + 1}`,
                        programaCarrera: `${plan} - Carrera ${c + 1}`,
                        programaPlan: plan,
                        jornada: seccion.jornada,
                        nivel: `N${n + 1}`,
                        codigoAsignatura: codigo,
                        asignatura: `Asignatura ${indiceAsignatura}`,
                        seccion: seccion.nombre,
                        tipo: 'Planificada',
                        horas: cfg.bloquesPorAsignatura * 18,
                        horasPresenciales: cfg.bloquesPorAsignatura * 18,
                        horasVirtuales: 0,
                        alumnos: 20 + (seccionPosicion % 4) * 5,
                        alumnosOtrosPlanes: 0,
                        alumnosTotales: 20 + (seccionPosicion % 4) * 5
                    });
                });
            }
        }
    }

    data.docentes.forEach((docente, indice) => {
        docente.asignaturasQueDicta = data.asignaturas
            .filter((_, posicion) => posicion % cfg.docentes === indice % cfg.docentes)
            .slice(0, 12)
            .map(asignatura => asignatura.id);
    });
    return data;
}

module.exports = { crearDatosMasivos };
