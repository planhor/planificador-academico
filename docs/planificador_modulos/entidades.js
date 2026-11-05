(function(){
    function createEntidades(ctx){
    // Adaptador de compatibilidad: las aplicaciones comparten el estado existente.
    const applicationInstances=Object.create(null);
    const applicationServices={
get CRITERIOS_ASIGNATURA(){return CRITERIOS_ASIGNATURA;},
get LABEL_CRITERIOS_ASIGNATURA(){return LABEL_CRITERIOS_ASIGNATURA;},
get UMBRAL_SOBRECUPO_ASIGNATURA(){return UMBRAL_SOBRECUPO_ASIGNATURA;},
get abrirCompartirDictacion(){return abrirCompartirDictacion;},
get abrirConfigSubseccionesAsignatura(){return abrirConfigSubseccionesAsignatura;},
get abrirEditarAlumnosDictacion(){return abrirEditarAlumnosDictacion;},
get abrirGestionCompartidas(){return abrirGestionCompartidas;},
get abrirGestionDictacionSeccion(){return abrirGestionDictacionSeccion;},
get abrirModalAsignatura(){return abrirModalAsignatura;},
get abrirModalCarrera(){return abrirModalCarrera;},
get abrirModalDocente(){return abrirModalDocente;},
get abrirModalSala(){return abrirModalSala;},
get abrirVincularDictacion(){return abrirVincularDictacion;},
get abrirVincularElectivaSeccion(){return abrirVincularElectivaSeccion;},
get acordeonAbierto(){return acordeonAbierto;},
get actualizarChipsAsignaturas(){return actualizarChipsAsignaturas;},
get actualizarChipsCarrerasNivel(){return actualizarChipsCarrerasNivel;},
get actualizarChipsSalasAsig(){return actualizarChipsSalasAsig;},
get agregarAsignaturaSeccion(){return agregarAsignaturaSeccion;},
get areaCarrera(){return areaCarrera;},
get areasCarrera(){return areasCarrera;},
get asegurarGrupoParaAlumnos(){return asegurarGrupoParaAlumnos;},
get asignaturaAplicaSeccion(){return asignaturaAplicaSeccion;},
get asignaturaTemp(){return asignaturaTemp;},set asignaturaTemp(value){asignaturaTemp=value;},
get asignaturasDeNivel(){return asignaturasDeNivel;},
get badgeAlumnos(){return badgeAlumnos;},
get capitalizarPalabras(){return capitalizarPalabras;},
get claveDocente(){return claveDocente;},
get clavesBusquedaSala(){return clavesBusquedaSala;},
get codigosAsignaturasTexto(){return codigosAsignaturasTexto;},
get componentesSubseccion(){return componentesSubseccion;},
get confirmarCambioCritico(){return confirmarCambioCritico;},
get contarSobrecuposResumen(){return contarSobrecuposResumen;},
get crearGrupoPropioPorDesvinculacion(){return crearGrupoPropioPorDesvinculacion;},
get criterioAsignatura(){return criterioAsignatura;},
get ctx(){return ctx;},
get desvincularFusionAsignatura(){return desvincularFusionAsignatura;},
get desvincularFusionDesdeMadre(){return desvincularFusionDesdeMadre;},
get docenteTemp(){return docenteTemp;},set docenteTemp(value){docenteTemp=value;},
get elegirCarreraNivel(){return elegirCarreraNivel;},
get elegirSalaAsignatura(){return elegirSalaAsignatura;},
get etiquetaJornada(){return etiquetaJornada;},
get exportarWorkbookCatalogo(){return exportarWorkbookCatalogo;},
get filasAyudaAsignaturas(){return filasAyudaAsignaturas;},
get filasAyudaSecciones(){return filasAyudaSecciones;},
get filtrarAsignaturasDocente(){return filtrarAsignaturasDocente;},
get filtrarCarrerasNivel(){return filtrarCarrerasNivel;},
get filtrarSalasAsig(){return filtrarSalasAsig;},
get getData(){return getData;},
get getOpcionesCarrerasNivel(){return getOpcionesCarrerasNivel;},
get getOpcionesSalasAsignatura(){return getOpcionesSalasAsignatura;},
get grupoCoincideAsignatura(){return grupoCoincideAsignatura;},
get gruposCompatiblesParaVincular(){return gruposCompatiblesParaVincular;},
get gruposDeAsignaturaSeccion(){return gruposDeAsignaturaSeccion;},
get guardarAsignatura(){return guardarAsignatura;},
get guardarCarrera(){return guardarCarrera;},
get guardarDocente(){return guardarDocente;},
get guardarNivel(){return guardarNivel;},
get guardarSala(){return guardarSala;},
get guardarSeccion(){return guardarSeccion;},
get importarAsignaturasDesdeFilas(){return importarAsignaturasDesdeFilas;},
get importarDocentesDesdeFilas(){return importarDocentesDesdeFilas;},
get importarSalasDesdeFilas(){return importarSalasDesdeFilas;},
get importarSeccionesDesdeFilas(){return importarSeccionesDesdeFilas;},
get jornadaSeccion(){return jornadaSeccion;},
get lastMiniCell(){return lastMiniCell;},set lastMiniCell(value){lastMiniCell=value;},
get limpiarBusquedaAsignatura(){return limpiarBusquedaAsignatura;},
get limpiarBusquedaDocente(){return limpiarBusquedaDocente;},
get limpiarBusquedaSalaAsig(){return limpiarBusquedaSalaAsig;},
get limpiarClave(){return limpiarClave;},
get limpiarDisponibilidad(){return limpiarDisponibilidad;},
get mostrarOpcionesAsignaturasDocente(){return mostrarOpcionesAsignaturasDocente;},
get mostrarOpcionesCarrerasNivel(){return mostrarOpcionesCarrerasNivel;},
get mostrarOpcionesSalasAsig(){return mostrarOpcionesSalasAsig;},
get mostrarResultadoImportacionAsignaturas(){return mostrarResultadoImportacionAsignaturas;},
get mostrarResultadoImportacionDocentes(){return mostrarResultadoImportacionDocentes;},
get mostrarResultadoImportacionSalas(){return mostrarResultadoImportacionSalas;},
get mostrarResultadoImportacionSecciones(){return mostrarResultadoImportacionSecciones;},
get nombreAsignatura(){return nombreAsignatura;},
get nombreSeccion(){return nombreSeccion;},
get normalizarCriterioAsignatura(){return normalizarCriterioAsignatura;},
get normalizarEspecialidadImportacion(){return normalizarEspecialidadImportacion;},
get normalizarJornadaImportacion(){return normalizarJornadaImportacion;},
get normalizarListaSoftwares(){return normalizarListaSoftwares;},
get normalizarNombreAsignatura(){return normalizarNombreAsignatura;},
get normalizarNombreSala(){return normalizarNombreSala;},
get normalizarSiNo(){return normalizarSiNo;},
get normalizarTextoImportacion(){return normalizarTextoImportacion;},
get normalizarTipoContratoImportacion(){return normalizarTipoContratoImportacion;},
get normalizarTipoEspacioSala(){return normalizarTipoEspacioSala;},
get normalizarTipoSeccionImportacion(){return normalizarTipoSeccionImportacion;},
get ofertasElectivas(){return ofertasElectivas;},
get ordenarNivelesDesc(){return ordenarNivelesDesc;},
get ordenarSecciones(){return ordenarSecciones;},
get parseListaTexto(){return parseListaTexto;},
get quitarAsignaturaSeccion(){return quitarAsignaturaSeccion;},
get quitarVinculoElectivo(){return quitarVinculoElectivo;},
get relacionAsignaturaSeccion(){return relacionAsignaturaSeccion;},
get renderAccionesDictacion(){return renderAccionesDictacion;},
get renderAlumnosDictacion(){return renderAlumnosDictacion;},
get renderChipAsignatura(){return renderChipAsignatura;},
get renderElectivasVinculadasSeccion(){return renderElectivasVinculadasSeccion;},
get renderEstadoDictacion(){return renderEstadoDictacion;},
get renderHistorialFusionDictacion(){return renderHistorialFusionDictacion;},
get renderMiniGrid(){return renderMiniGrid;},
get renderOpcionesSalasAsignatura(){return renderOpcionesSalasAsignatura;},
get renderPanelAlertasAsignaturas(){return renderPanelAlertasAsignaturas;},
get renderPanelAlertasDocentes(){return renderPanelAlertasDocentes;},
get renderPanelAlertasSalas(){return renderPanelAlertasSalas;},
get renderSubseccionesAsignatura(){return renderSubseccionesAsignatura;},
get resolverEspecialidadExistente(){return resolverEspecialidadExistente;},
get resolverRelacionCarreraNivelSeparada(){return resolverRelacionCarreraNivelSeparada;},
get resolverRelacionesDesdeColumnas(){return resolverRelacionesDesdeColumnas;},
get resumenAlumnosGrupoDictacion(){return resumenAlumnosGrupoDictacion;},
get resumenAlumnosSecciones(){return resumenAlumnosSecciones;},
get seleccionarTodoDisponibilidad(){return seleccionarTodoDisponibilidad;},
get selectCriterioAsignatura(){return selectCriterioAsignatura;},
get separarNumeroNombreSala(){return separarNumeroNombreSala;},
get textoResumenAlumnos(){return textoResumenAlumnos;},
get valorFilaDocente(){return valorFilaDocente;},
get valorFilaPorMapa(){return valorFilaPorMapa;},
get valorOrdenNivel(){return valorOrdenNivel;},
get vinculosElectivosSeccion(){return vinculosElectivosSeccion;},
    };
    function applicationModule(name){
        return applicationInstances[name]||(applicationInstances[name]=window.PlanhorAplicaciones[name].create(applicationServices));
    }

        const getData = ctx.getData;
        let asignaturaTemp = null;
        let docenteTemp = null;
        let lastMiniCell = null;
        const acordeonAbierto = new Set();
        const CRITERIOS_ASIGNATURA = {
            area:['especialidad','transversal','electiva'],
            modalidad:['lectiva','practica','semipresencial','online-teams'],
            condicion:['normal','alta-reprobacion','requiere-ayudantia','alta-reprobacion-ayudantia'],
            distribucion:['compacta','balanceada','dividida','flexible'],
            controlHorario:['propio','coordinacion-externa'],
            preferenciaHoraria:['flexible','evitar-temprano','proteger-repitentes']
        };
        const UMBRAL_SOBRECUPO_ASIGNATURA = 35;
        const LABEL_CRITERIOS_ASIGNATURA = {
            area:{especialidad:'Especialidad',transversal:'Transversal',electiva:'Electiva'},
            modalidad:{lectiva:'Lectiva',practica:'Práctica',semipresencial:'Semipresencial','online-teams':'Online TEAMS'},
            condicion:{normal:'Normal','alta-reprobacion':'Alta reprobación','requiere-ayudantia':'Requiere ayudantía','alta-reprobacion-ayudantia':'Alta reprobación + ayudantía'},
            distribucion:{compacta:'Compacta',balanceada:'Balanceada',dividida:'Dividida',flexible:'Flexible'},
            controlHorario:{propio:'Propio','coordinacion-externa':'Coordinación externa'},
            preferenciaHoraria:{flexible:'Flexible','evitar-temprano':'Evitar temprano','proteger-repitentes':'Proteger repitentes'}
        };

        function criterioAsignatura(a={}, campo, defecto){
            return CRITERIOS_ASIGNATURA[campo].includes(a?.[campo]) ? a[campo] : defecto;
        }

        function selectCriterioAsignatura(id, campo, valor){
            return `<select class="form-select" id="${id}">${CRITERIOS_ASIGNATURA[campo].map(v=>ctx.optionHTML(v,LABEL_CRITERIOS_ASIGNATURA[campo][v],valor===v)).join('')}</select>`;
        }

        function limpiarClave(valor){
            return String(valor??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
        }

        function jornadaSeccion(seccion={}){
            if(['diurna','vespertina'].includes(seccion.jornada)) return seccion.jornada;
            const parsed=ctx.parsearCodigoSeccion?.(seccion.nombre||'');
            if(parsed?.tipo==='V') return 'vespertina';
            if(parsed?.tipo==='D') return 'diurna';
            const txt=String(seccion.nombre||'').trim().toLowerCase();
            if(txt.includes('vesp')||txt.includes('noche')||txt.startsWith('v-')) return 'vespertina';
            return 'diurna';
        }

        function etiquetaJornada(valor){
            return valor==='vespertina'?'Noche':'Día';
        }

        function numeroNivel(nombre){
            const m=String(nombre||'').match(/\d+/);
            return m?Number(m[0]):0;
        }

        function ordenarNivelesDesc(a,b){
            return numeroNivel(b.nombre)-numeroNivel(a.nombre) || String(a.nombre||'').localeCompare(String(b.nombre||''),undefined,{numeric:true,sensitivity:'base'});
        }

        function ordenarSecciones(a,b){
            return String(a.nombre||'').localeCompare(String(b.nombre||''),undefined,{numeric:true,sensitivity:'base'});
        }

        async function confirmarCambioCritico(opciones={}){
            const cfg=Object.assign({
                titulo:'Confirmar cambio',
                mensaje:'Este cambio modifica el modelo de dictación de la sección.',
                queHara:'',
                afectara:'',
                noTocara:'',
                seguridad:'Se creará un punto de recuperación antes de aplicar.',
                confirmarTexto:'Aplicar cambio',
                cancelarTexto:'Cancelar',
                peligro:true
            },opciones||{});
            if(ctx.confirmarAccionCritica) return await ctx.confirmarAccionCritica(cfg);
            const texto=[cfg.mensaje,cfg.queHara,cfg.afectara,cfg.noTocara,cfg.seguridad].filter(Boolean).join('\n');
            return confirm(texto);
        }

        function areaCarrera(carrera={}){
            return String(carrera.area||carrera.especialidad||'Sin área').trim()||'Sin área';
        }

        function areasCarrera(){
            const data=getData();
            return [...new Set(data.carreras.map(areaCarrera).map(a=>String(a||'').trim()).filter(Boolean))]
                .sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'}));
        }

        function resumenAlumnosSecciones(){
            const data=getData();
            const asignaturaPorId=new Map(data.asignaturas.map(a=>[a.id,a]));
            const porSeccion=new Map(data.secciones.map(s=>[s.id,{propios:0,otrosPlanes:0,electivos:0,heredadas:0,heredadasAlumnos:0,asignaturasPropias:0,sobrecupoKeys:new Set()}]));
            (ctx.getGruposDictacion?.()||[]).forEach(g=>{
                const asignatura=asignaturaPorId.get(g.asignaturaId);
                const esElectiva=String(asignatura?.area||'').toLowerCase()==='electiva';
                const madre=porSeccion.get(g.seccionMadreId);
                const alumnosBase=Number(g.alumnosBase)||Number(g.alumnosTotales)||0;
                const alumnosVinculados=Number(g.alumnosVinculados)||0;
                const totalGrupo=Number(g.alumnosTotales)||alumnosBase+alumnosVinculados;
                const tieneSobrecupo=totalGrupo>UMBRAL_SOBRECUPO_ASIGNATURA || alumnosBase>UMBRAL_SOBRECUPO_ASIGNATURA;
                const keySobrecupo=g.id||`${g.seccionMadreId}_${g.asignaturaId}`;
                if(madre){
                    if(esElectiva){
                        madre.electivos+=alumnosBase;
                    }else{
                        madre.propios=Math.max(madre.propios,alumnosBase);
                        madre.otrosPlanes=Math.max(madre.otrosPlanes,alumnosVinculados);
                        madre.heredadasAlumnos=Math.max(madre.heredadasAlumnos,alumnosVinculados);
                    }
                    madre.asignaturasPropias++;
                    if(tieneSobrecupo) madre.sobrecupoKeys.add(keySobrecupo);
                }
                (g.seccionesVinculadasIds||[]).forEach(secId=>{
                    const item=porSeccion.get(secId);
                    if(!item) return;
                    item.heredadas++;
                    if(alumnosVinculados) item.heredadasAlumnos=Math.max(item.heredadasAlumnos,alumnosVinculados);
                    if(totalGrupo>UMBRAL_SOBRECUPO_ASIGNATURA) item.sobrecupoKeys.add(keySobrecupo);
                });
            });
            return porSeccion;
        }

        function contarSobrecuposResumen(resumen){
            if(resumen?.sobrecupoKeys instanceof Set) return resumen.sobrecupoKeys.size;
            return Number(resumen?.asignaturasSobrecupo)||0;
        }

        function sumarAlumnosSecciones(secciones, resumen){
            return secciones.reduce((acc,s)=>{
                const r=resumen.get(s.id)||{};
                acc.propios+=Number(r.propios)||0;
                acc.otrosPlanes+=Number(r.otrosPlanes)||0;
                acc.electivos+=Number(r.electivos)||0;
                acc.heredadas+=Number(r.heredadas)||0;
                acc.heredadasAlumnos+=Number(r.heredadasAlumnos)||0;
                if(r.sobrecupoKeys instanceof Set) r.sobrecupoKeys.forEach(k=>acc.sobrecupoKeys.add(k));
                return acc;
            },{propios:0,otrosPlanes:0,electivos:0,heredadas:0,heredadasAlumnos:0,sobrecupoKeys:new Set()});
        }

        function badgeAlumnos(resumen){
            const propios=Number(resumen?.propios)||0;
            const otrosPlanes=Number(resumen?.otrosPlanes)||0;
            const electivos=Number(resumen?.electivos)||0;
            const heredadas=Number(resumen?.heredadas)||0;
            const heredadasAlumnos=Number(resumen?.heredadasAlumnos)||0;
            const sobrecupo=contarSobrecuposResumen(resumen);
            const detalle=[];
            if(heredadas) detalle.push(`Heredadas: ${heredadas}`);
            if(otrosPlanes) detalle.push(`Otros planes: ${otrosPlanes}`);
            else if(heredadasAlumnos) detalle.push(`Grupo compartido: ${heredadasAlumnos}`);
            if(electivos) detalle.push(`Electivos ref.: ${electivos}`);
            if(sobrecupo) detalle.push(`${sobrecupo} asig. con sobrecupo`);
            return `<span class="student-badge ${sobrecupo?'warning':''}" title="${ctx.escapeAttr(detalle.join(' · ')||'Alumnos propios no electivos')}">[${propios || 0}${detalle.length?` · ${ctx.escapeHTML(detalle.join(' · '))}`:''}]</span>`;
        }

        function textoResumenAlumnos(items, resumen){
            const total=sumarAlumnosSecciones(items,resumen);
            const partes=[`${total.propios} alumnos propios`];
            if(total.otrosPlanes) partes.push(`${total.otrosPlanes} otros planes`);
            if(total.electivos) partes.push(`${total.electivos} electivos ref.`);
            if(total.heredadas) partes.push(`${total.heredadas} heredada(s)`);
            if(total.sobrecupoKeys.size) partes.push(`${total.sobrecupoKeys.size} asignatura(s) con sobrecupo`);
            return partes.join(' · ');
        }

        function eliminarEntidad(tipo,id){
            const data = getData();
            if(data.configuracion.confirmarEliminacion && !confirm(`¿Eliminar ${tipo}?`)) return;
            if(tipo==='carrera'){
                data.niveles.filter(n=>n.carreraId===id).forEach(n=>eliminarEntidad('nivel',n.id));
                data.carreras=data.carreras.filter(c=>c.id!==id);
            }
            else if(tipo==='nivel'){
                data.secciones.filter(s=>s.nivelId===id).forEach(s=>eliminarEntidad('seccion',s.id));
                data.niveles=data.niveles.filter(n=>n.id!==id);
            }
            else if(tipo==='seccion'){
                ctx.pushUndo();
                data.planificaciones=data.planificaciones.filter(p=>p.seccionId!==id);
                data.asignaturaSeccion=(data.asignaturaSeccion||[]).filter(r=>r.seccionId!==id);
                (ctx.getGruposDictacion?.()||[]).slice().forEach(g=>{
                    if(g.seccionMadreId===id) ctx.eliminarGrupoDictacion?.(g.id);
                    else if(g.seccionesVinculadasIds?.includes(id)) ctx.desvincularSeccionDeGrupo?.(g.id,id);
                });
                data.vinculosElectivos=(data.vinculosElectivos||[]).filter(v=>v.seccionOrigenId!==id&&v.seccionDestinoId!==id);
                data.secciones=data.secciones.filter(s=>s.id!==id);
            }
            ctx.guardar(); ctx.reconstruirIndices(); ctx.refrescarTodo();
        }

        function renderCarreras(...args){ return applicationModule('secciones').renderCarreras(...args); }

        function nombreSeccion(...args){ return applicationModule('secciones').nombreSeccion(...args); }

        function nombreAsignatura(...args){ return applicationModule('secciones').nombreAsignatura(...args); }

        function asignaturasDeNivel(...args){ return applicationModule('secciones').asignaturasDeNivel(...args); }
        function asignaturaAplicaSeccion(...args){ return applicationModule('secciones').asignaturaAplicaSeccion(...args); }
        function agregarAsignaturaSeccion(...args){ return applicationModule('secciones').agregarAsignaturaSeccion(...args); }
        function quitarAsignaturaSeccion(...args){ return applicationModule('secciones').quitarAsignaturaSeccion(...args); }

        function gruposCompatiblesParaVincular(...args){ return applicationModule('secciones').gruposCompatiblesParaVincular(...args); }

        function grupoCoincideAsignatura(...args){ return applicationModule('secciones').grupoCoincideAsignatura(...args); }

        function gruposDeAsignaturaSeccion(...args){ return applicationModule('secciones').gruposDeAsignaturaSeccion(...args); }

        function crearGrupoPropioPorDesvinculacion(...args){ return applicationModule('secciones').crearGrupoPropioPorDesvinculacion(...args); }

        function desvincularFusionAsignatura(...args){ return applicationModule('secciones').desvincularFusionAsignatura(...args); }

        function resumenAlumnosGrupoDictacion(...args){ return applicationModule('secciones').resumenAlumnosGrupoDictacion(...args); }

        function renderAlumnosDictacion(...args){ return applicationModule('secciones').renderAlumnosDictacion(...args); }

        function renderHistorialFusionDictacion(...args){ return applicationModule('secciones').renderHistorialFusionDictacion(...args); }

        function relacionAsignaturaSeccion(...args){ return applicationModule('secciones').relacionAsignaturaSeccion(...args); }

        function componentesSubseccion(...args){ return applicationModule('secciones').componentesSubseccion(...args); }

        function renderSubseccionesAsignatura(...args){ return applicationModule('secciones').renderSubseccionesAsignatura(...args); }

        function renderEstadoDictacion(...args){ return applicationModule('secciones').renderEstadoDictacion(...args); }

        function renderAccionesDictacion(...args){ return applicationModule('secciones').renderAccionesDictacion(...args); }

        function abrirConfigSubseccionesAsignatura(...args){ return applicationModule('secciones').abrirConfigSubseccionesAsignatura(...args); }

        function asegurarGrupoParaAlumnos(...args){ return applicationModule('secciones').asegurarGrupoParaAlumnos(...args); }

        function abrirEditarAlumnosDictacion(...args){ return applicationModule('secciones').abrirEditarAlumnosDictacion(...args); }

        function contextoDestinoElectiva(...args){ return applicationModule('secciones').contextoDestinoElectiva(...args); }

        function vinculosElectivosSeccion(...args){ return applicationModule('secciones').vinculosElectivosSeccion(...args); }

        function renderElectivasVinculadasSeccion(...args){ return applicationModule('secciones').renderElectivasVinculadasSeccion(...args); }

        function abrirGestionDictacionSeccion(...args){ return applicationModule('secciones').abrirGestionDictacionSeccion(...args); }

        function ofertasElectivas(...args){ return applicationModule('secciones').ofertasElectivas(...args); }

        function abrirVincularElectivaSeccion(...args){ return applicationModule('secciones').abrirVincularElectivaSeccion(...args); }

        function quitarVinculoElectivo(...args){ return applicationModule('secciones').quitarVinculoElectivo(...args); }

        function desvincularFusionDesdeMadre(...args){ return applicationModule('secciones').desvincularFusionDesdeMadre(...args); }

        function abrirGestionCompartidas(...args){ return applicationModule('secciones').abrirGestionCompartidas(...args); }

        function abrirVincularDictacion(...args){ return applicationModule('secciones').abrirVincularDictacion(...args); }

        function abrirCompartirDictacion(...args){ return applicationModule('secciones').abrirCompartirDictacion(...args); }

        function abrirModalCarrera(...args){ return applicationModule('secciones').abrirModalCarrera(...args); }

        function guardarCarrera(...args){ return applicationModule('secciones').guardarCarrera(...args); }

        function abrirModalNivel(...args){ return applicationModule('secciones').abrirModalNivel(...args); }

        function guardarNivel(...args){ return applicationModule('secciones').guardarNivel(...args); }

        function abrirModalSeccion(...args){ return applicationModule('secciones').abrirModalSeccion(...args); }

        function guardarSeccion(...args){ return applicationModule('secciones').guardarSeccion(...args); }

        function filasAyudaSecciones(...args){ return applicationModule('secciones').filasAyudaSecciones(...args); }

        async function exportarWorkbookCatalogo(nombreArchivo, hojas){
            if(!window.XLSX?.utils?.book_new||!window.XLSX?.writeFile){
                if(!ctx.asegurarXLSX || !(await ctx.asegurarXLSX()) || !window.XLSX?.utils?.book_new || !window.XLSX?.writeFile) return;
            }
            const wb=window.XLSX.utils.book_new();
            hojas.forEach(h=>{
                const ws=window.XLSX.utils.aoa_to_sheet(h.matriz);
                if(h.cols?.length) ws['!cols']=h.cols.map(w=>({wch:w}));
                window.XLSX.utils.book_append_sheet(wb,ws,h.nombre);
            });
            window.XLSX.writeFile(wb,nombreArchivo,{bookSST:true});
            ctx.toast('Archivo exportado','success');
        }

        function crearPlantillaImportacionSecciones(...args){ return applicationModule('secciones').crearPlantillaImportacionSecciones(...args); }

        function crearPlantillaAlumnosRealesNivel(...args){ return applicationModule('secciones').crearPlantillaAlumnosRealesNivel(...args); }

        function exportarArchivoSecciones(...args){ return applicationModule('secciones').exportarArchivoSecciones(...args); }

        function abrirImportacionSecciones(...args){ return applicationModule('secciones').abrirImportacionSecciones(...args); }

        function leerArchivoSecciones(...args){ return applicationModule('secciones').leerArchivoSecciones(...args); }

        function normalizarSiNo(...args){ return applicationModule('secciones').normalizarSiNo(...args); }

        function normalizarJornadaImportacion(...args){ return applicationModule('secciones').normalizarJornadaImportacion(...args); }

        function normalizarTipoSeccionImportacion(...args){ return applicationModule('secciones').normalizarTipoSeccionImportacion(...args); }

        function resolverEspecialidadExistente(...args){ return applicationModule('secciones').resolverEspecialidadExistente(...args); }

        function importarSeccionesDesdeFilas(...args){ return applicationModule('secciones').importarSeccionesDesdeFilas(...args); }

        function mostrarResultadoImportacionSecciones(...args){ return applicationModule('secciones').mostrarResultadoImportacionSecciones(...args); }

        function abrirModalAsignatura(...args){ return applicationModule('asignaturas').abrirModalAsignatura(...args); }

        function actualizarChipsCarrerasNivel(...args){ return applicationModule('asignaturas').actualizarChipsCarrerasNivel(...args); }

        function getOpcionesCarrerasNivel(...args){ return applicationModule('asignaturas').getOpcionesCarrerasNivel(...args); }

        function elegirCarreraNivel(...args){ return applicationModule('asignaturas').elegirCarreraNivel(...args); }

        function mostrarOpcionesCarrerasNivel(...args){ return applicationModule('asignaturas').mostrarOpcionesCarrerasNivel(...args); }

        function filtrarCarrerasNivel(...args){ return applicationModule('asignaturas').filtrarCarrerasNivel(...args); }

        function limpiarBusquedaAsignatura(...args){ return applicationModule('asignaturas').limpiarBusquedaAsignatura(...args); }

        function actualizarChipsSalasAsig(...args){ return applicationModule('asignaturas').actualizarChipsSalasAsig(...args); }

        function elegirSalaAsignatura(...args){ return applicationModule('asignaturas').elegirSalaAsignatura(...args); }

        function getOpcionesSalasAsignatura(...args){ return applicationModule('asignaturas').getOpcionesSalasAsignatura(...args); }

        function renderOpcionesSalasAsignatura(...args){ return applicationModule('asignaturas').renderOpcionesSalasAsignatura(...args); }

        function mostrarOpcionesSalasAsig(...args){ return applicationModule('asignaturas').mostrarOpcionesSalasAsig(...args); }

        function filtrarSalasAsig(...args){ return applicationModule('asignaturas').filtrarSalasAsig(...args); }

        function limpiarBusquedaSalaAsig(...args){ return applicationModule('asignaturas').limpiarBusquedaSalaAsig(...args); }

        function filasAyudaAsignaturas(...args){ return applicationModule('asignaturas').filasAyudaAsignaturas(...args); }

        function crearPlantillaImportacionAsignaturas(...args){ return applicationModule('asignaturas').crearPlantillaImportacionAsignaturas(...args); }

        function exportarArchivoAsignaturas(...args){ return applicationModule('asignaturas').exportarArchivoAsignaturas(...args); }

        function abrirImportacionAsignaturas(...args){ return applicationModule('asignaturas').abrirImportacionAsignaturas(...args); }

        function leerArchivoAsignaturas(...args){ return applicationModule('asignaturas').leerArchivoAsignaturas(...args); }

        function valorFilaPorMapa(...args){ return applicationModule('asignaturas').valorFilaPorMapa(...args); }

        function normalizarCriterioAsignatura(...args){ return applicationModule('asignaturas').normalizarCriterioAsignatura(...args); }

        function normalizarNombreAsignatura(...args){ return applicationModule('asignaturas').normalizarNombreAsignatura(...args); }

        function parseListaTexto(...args){ return applicationModule('asignaturas').parseListaTexto(...args); }

        function normalizarListaSoftwares(...args){ return applicationModule('asignaturas').normalizarListaSoftwares(...args); }

        function resolverRelacionCarreraNivelSeparada(...args){ return applicationModule('asignaturas').resolverRelacionCarreraNivelSeparada(...args); }

        function resolverRelacionesDesdeColumnas(...args){ return applicationModule('asignaturas').resolverRelacionesDesdeColumnas(...args); }

        function separarNumeroNombreSala(...args){ return applicationModule('asignaturas').separarNumeroNombreSala(...args); }

        function clavesBusquedaSala(...args){ return applicationModule('asignaturas').clavesBusquedaSala(...args); }

        function importarAsignaturasDesdeFilas(...args){ return applicationModule('asignaturas').importarAsignaturasDesdeFilas(...args); }

        function mostrarResultadoImportacionAsignaturas(...args){ return applicationModule('asignaturas').mostrarResultadoImportacionAsignaturas(...args); }

        function guardarAsignatura(...args){ return applicationModule('asignaturas').guardarAsignatura(...args); }

        function valorOrdenNivel(...args){ return applicationModule('asignaturas').valorOrdenNivel(...args); }

        function renderChipAsignatura(...args){ return applicationModule('asignaturas').renderChipAsignatura(...args); }

        function renderPanelAlertasAsignaturas(...args){ return applicationModule('asignaturas').renderPanelAlertasAsignaturas(...args); }

        function renderAsignaturas(...args){ return applicationModule('asignaturas').renderAsignaturas(...args); }

        function etiquetaTemporada(t){
            return t ? `${t.temporada} ${t.anio}` : 'Temporada';
        }

        function temporadasOrigenDisponibles(){
            const data=getData();
            const actual=data.sel?.temporadaId||data.configuracion?.temporadaActualId;
            return (data.temporadas||[]).filter(t=>t.id!==actual && data.temporadaData?.[t.id]);
        }

        function clonar(valor){
            return JSON.parse(JSON.stringify(valor));
        }

        function snapshotTemporadaActual(){
            const data=getData();
            if(!data.sel?.temporadaId) return;
            data.temporadaData=data.temporadaData||{};
            data.temporadaData[data.sel.temporadaId]={
                carreras:data.carreras,
                niveles:data.niveles,
                secciones:data.secciones,
                asignaturas:data.asignaturas,
                docentes:data.docentes,
                salas:data.salas,
                asignaturaCarreraNivel:data.asignaturaCarreraNivel,
                asignaturaSeccion:data.asignaturaSeccion||[],
                planificaciones:data.planificaciones,
                gruposDictacion:data.gruposDictacion||[],
                vinculosElectivos:data.vinculosElectivos||[],
                gestorSecciones:data.gestorSecciones
            };
        }

        function resumenCatalogoTemporada(tipo, origen){
            const src=getData().temporadaData?.[origen?.id]||{};
            if(tipo==='docentes') return (src.docentes||[]).filter(d=>d.id!==ctx.DOCENTE_NN_ID).length;
            if(tipo==='asignaturas') return (src.asignaturas||[]).length;
            if(tipo==='salas') return (src.salas||[]).filter(s=>s.id!==ctx.SALA_VIRTUAL_ID&&s.id!==ctx.SALA_TRO2_ID).length;
            return 0;
        }

        function abrirCopiarCatalogoDesdeTemporada(tipo){
            const data=getData();
            const origenes=temporadasOrigenDisponibles();
            const label={docentes:'docentes',asignaturas:'asignaturas',salas:'salas'}[tipo]||'datos';
            if(!origenes.length) return ctx.toast('No hay otra temporada disponible para copiar','info');
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <div class="modal-header">
                    <h3>Copiar ${ctx.escapeHTML(label)} desde otra temporada</h3>
                    <p>Trae datos ya cargados sin importar todo el respaldo de la temporada.</p>
                </div>
                <div class="form-group">
                    <label class="form-label">Temporada origen</label>
                    <select class="form-select" id="catalogoTemporadaOrigen">
                        ${origenes.map(t=>ctx.optionHTML(t.id,`${etiquetaTemporada(t)} · ${resumenCatalogoTemporada(tipo,t)} ${label}`)).join('')}
                    </select>
                </div>
                <div class="critical-confirm-box compact">
                    <div>La copia evitará duplicados por código/nombre según corresponda.</div>
                    <div>Se actualizarán coincidencias existentes y se crearán los elementos faltantes.</div>
                    ${tipo==='asignaturas'?'<div>Las relaciones con carrera/nivel/sección se copian solo si esas entidades existen en la temporada actual.</div>':''}
                </div>
                <div class="modal-actions">
                    <button class="btn" id="btnCancelarCopiaCatalogo">Cancelar</button>
                    <button class="btn btn-primary" id="btnConfirmarCopiaCatalogo">Copiar</button>
                </div>
            </div></div>`;
            document.getElementById('modalOverlay').onclick=e=>{if(e.target===e.currentTarget)ctx.cerrarModal();};
            document.getElementById('btnCancelarCopiaCatalogo').onclick=ctx.cerrarModal;
            document.getElementById('btnConfirmarCopiaCatalogo').onclick=async()=>{
                const origenId=document.getElementById('catalogoTemporadaOrigen')?.value;
                const origen=data.temporadas.find(t=>t.id===origenId);
                if(!origen) return ctx.toast('Selecciona una temporada origen','error');
                const cantidad=resumenCatalogoTemporada(tipo,origen);
                const ok=ctx.confirmarAccionCritica
                    ? await ctx.confirmarAccionCritica({
                        titulo:`Copiar ${label}`,
                        mensaje:`Se copiarán datos desde ${etiquetaTemporada(origen)} hacia la temporada actual.`,
                        detalles:[`${cantidad} elemento(s) disponibles en origen.`, 'Las coincidencias existentes se actualizarán, no se duplicarán.', 'Esta acción no copia planificación completa.'],
                        confirmarTexto:`Copiar ${label}`,
                        peligro:false
                    })
                    : confirm(`¿Copiar ${label} desde ${etiquetaTemporada(origen)}?`);
                if(!ok) return;
                const resultado=copiarCatalogoDesdeTemporada(tipo,origenId);
                ctx.cerrarModal();
                ctx.toast(`${resultado.creados} creado(s), ${resultado.actualizados} actualizado(s), ${resultado.omitidos} omitido(s)`,'success');
            };
        }

        function copiarCatalogoDesdeTemporada(tipo,origenId){
            const data=getData();
            const src=data.temporadaData?.[origenId]||{};
            const resultado={creados:0,actualizados:0,omitidos:0};
            snapshotTemporadaActual();
            ctx.pushUndo?.();
            if(tipo==='docentes') copiarDocentesTemporada(src,resultado);
            if(tipo==='asignaturas') copiarAsignaturasTemporada(src,resultado);
            if(tipo==='salas') copiarSalasTemporada(src,resultado);
            ctx.guardar();
            ctx.reconstruirIndices();
            ctx.refrescarTodo();
            return resultado;
        }

        function copiarDocentesTemporada(src,resultado){
            const data=getData();
            const asignaturaTargetPorCodigo=new Map(data.asignaturas.map(a=>[String(a.codigo||'').toUpperCase(),a.id]));
            const asignaturaSourcePorId=new Map((src.asignaturas||[]).map(a=>[a.id,a]));
            const existentes=new Map(data.docentes.map(d=>[claveDocente(d.nombre,d.apellido),d]));
            (src.docentes||[]).filter(d=>d.id!==ctx.DOCENTE_NN_ID).forEach(d=>{
                const copia=clonar(d);
                copia.asignaturasQueDicta=(copia.asignaturasQueDicta||[]).map(id=>{
                    const asig=asignaturaSourcePorId.get(id);
                    return asignaturaTargetPorCodigo.get(String(asig?.codigo||'').toUpperCase())||id;
                }).filter(Boolean);
                const key=claveDocente(copia.nombre,copia.apellido);
                const actual=existentes.get(key);
                if(actual){
                    Object.assign(actual,copia,{id:actual.id});
                    resultado.actualizados++;
                }else{
                    if(data.docentes.some(x=>x.id===copia.id)) copia.id=ctx.genId();
                    data.docentes.push(copia);
                    existentes.set(key,copia);
                    resultado.creados++;
                }
            });
        }

        function copiarAsignaturasTemporada(src,resultado){
            const data=getData();
            const existentesCodigo=new Map(data.asignaturas.map(a=>[String(a.codigo||'').toUpperCase(),a]));
            const idMap=new Map();
            (src.asignaturas||[]).forEach(a=>{
                const copia=clonar(a);
                const key=String(copia.codigo||'').toUpperCase();
                if(!key){ resultado.omitidos++; return; }
                const actual=existentesCodigo.get(key);
                if(actual){
                    idMap.set(a.id,actual.id);
                    Object.assign(actual,copia,{id:actual.id});
                    resultado.actualizados++;
                }else{
                    if(data.asignaturas.some(x=>x.id===copia.id)) copia.id=ctx.genId();
                    idMap.set(a.id,copia.id);
                    data.asignaturas.push(copia);
                    existentesCodigo.set(key,copia);
                    resultado.creados++;
                }
            });
            const carreras=new Set(data.carreras.map(c=>c.id));
            const niveles=new Set(data.niveles.map(n=>n.id));
            const secciones=new Set(data.secciones.map(s=>s.id));
            const relKey=new Set((data.asignaturaCarreraNivel||[]).map(r=>`${r.asignaturaId}|${r.carreraId}|${r.nivelId}`));
            (src.asignaturaCarreraNivel||[]).forEach(r=>{
                const asignaturaId=idMap.get(r.asignaturaId);
                if(!asignaturaId||!carreras.has(r.carreraId)||!niveles.has(r.nivelId)) return;
                const key=`${asignaturaId}|${r.carreraId}|${r.nivelId}`;
                if(relKey.has(key)) return;
                data.asignaturaCarreraNivel.push({asignaturaId,carreraId:r.carreraId,nivelId:r.nivelId});
                relKey.add(key);
            });
            const relSecKey=new Set((data.asignaturaSeccion||[]).map(r=>`${r.asignaturaId}|${r.seccionId}`));
            data.asignaturaSeccion=data.asignaturaSeccion||[];
            (src.asignaturaSeccion||[]).forEach(r=>{
                const asignaturaId=idMap.get(r.asignaturaId);
                if(!asignaturaId||!secciones.has(r.seccionId)) return;
                const key=`${asignaturaId}|${r.seccionId}`;
                if(relSecKey.has(key)) return;
                data.asignaturaSeccion.push(Object.assign({},clonar(r),{asignaturaId}));
                relSecKey.add(key);
            });
        }

        function copiarSalasTemporada(src,resultado){
            const data=getData();
            const existentes=new Map(data.salas.map(s=>[limpiarClave(s.nombre),s]));
            (src.salas||[]).filter(s=>s.id!==ctx.SALA_VIRTUAL_ID&&s.id!==ctx.SALA_TRO2_ID).forEach(s=>{
                const copia=clonar(s);
                const key=limpiarClave(copia.nombre);
                if(!key){ resultado.omitidos++; return; }
                const actual=existentes.get(key);
                if(actual && actual.id!==ctx.SALA_VIRTUAL_ID && actual.id!==ctx.SALA_TRO2_ID){
                    Object.assign(actual,copia,{id:actual.id});
                    resultado.actualizados++;
                }else{
                    if(data.salas.some(x=>x.id===copia.id)) copia.id=ctx.genId();
                    data.salas.push(copia);
                    existentes.set(key,copia);
                    resultado.creados++;
                }
            });
        }

        function eliminarAsignatura(id){
            const data = getData();
            if(confirm('¿Eliminar asignatura?')){
                (ctx.getGruposDictacion?.()||[]).slice().forEach(g=>{
                    if(g.asignaturaId===id) ctx.eliminarGrupoDictacion?.(g.id);
                    else if(g.asignaturasEquivalentesIds?.includes(id)) g.asignaturasEquivalentesIds=g.asignaturasEquivalentesIds.filter(x=>x!==id);
                });
                data.vinculosElectivos=(data.vinculosElectivos||[]).filter(v=>v.asignaturaId!==id);
                data.asignaturas=data.asignaturas.filter(a=>a.id!==id);
                ctx.guardar(); ctx.refrescarTodo();
            }
        }

        function abrirModalDocente(...args){ return applicationModule('docentes').abrirModalDocente(...args); }

        function actualizarChipsAsignaturas(...args){ return applicationModule('docentes').actualizarChipsAsignaturas(...args); }

        function mostrarOpcionesAsignaturasDocente(...args){ return applicationModule('docentes').mostrarOpcionesAsignaturasDocente(...args); }

        function filtrarAsignaturasDocente(...args){ return applicationModule('docentes').filtrarAsignaturasDocente(...args); }

        function limpiarBusquedaDocente(...args){ return applicationModule('docentes').limpiarBusquedaDocente(...args); }

        function renderMiniGrid(...args){ return applicationModule('docentes').renderMiniGrid(...args); }

        function seleccionarTodoDisponibilidad(...args){ return applicationModule('docentes').seleccionarTodoDisponibilidad(...args); }
        function limpiarDisponibilidad(...args){ return applicationModule('docentes').limpiarDisponibilidad(...args); }

        function normalizarTextoImportacion(...args){ return applicationModule('docentes').normalizarTextoImportacion(...args); }

        function capitalizarPalabras(...args){ return applicationModule('docentes').capitalizarPalabras(...args); }

        function normalizarEspecialidadImportacion(...args){ return applicationModule('docentes').normalizarEspecialidadImportacion(...args); }

        function normalizarTipoContratoImportacion(...args){ return applicationModule('docentes').normalizarTipoContratoImportacion(...args); }

        function claveDocente(...args){ return applicationModule('docentes').claveDocente(...args); }

        function codigosAsignaturasTexto(...args){ return applicationModule('docentes').codigosAsignaturasTexto(...args); }

        function crearPlantillaImportacionDocentes(...args){ return applicationModule('docentes').crearPlantillaImportacionDocentes(...args); }

        function exportarArchivoDocentes(...args){ return applicationModule('docentes').exportarArchivoDocentes(...args); }

        function valorFilaDocente(...args){ return applicationModule('docentes').valorFilaDocente(...args); }

        function abrirImportacionDocentes(...args){ return applicationModule('docentes').abrirImportacionDocentes(...args); }

        function leerArchivoDocentes(...args){ return applicationModule('docentes').leerArchivoDocentes(...args); }

        function importarDocentesDesdeFilas(...args){ return applicationModule('docentes').importarDocentesDesdeFilas(...args); }

        function mostrarResultadoImportacionDocentes(...args){ return applicationModule('docentes').mostrarResultadoImportacionDocentes(...args); }

        function guardarDocente(...args){ return applicationModule('docentes').guardarDocente(...args); }

        function renderPanelAlertasDocentes(...args){ return applicationModule('docentes').renderPanelAlertasDocentes(...args); }

        function renderDocentes(...args){ return applicationModule('docentes').renderDocentes(...args); }

        function eliminarDocente(...args){ return applicationModule('docentes').eliminarDocente(...args); }

        function abrirModalSala(...args){ return applicationModule('salas').abrirModalSala(...args); }

        function guardarSala(...args){ return applicationModule('salas').guardarSala(...args); }

        function crearPlantillaImportacionSalas(...args){ return applicationModule('salas').crearPlantillaImportacionSalas(...args); }

        function exportarArchivoSalas(...args){ return applicationModule('salas').exportarArchivoSalas(...args); }

        function abrirImportacionSalas(...args){ return applicationModule('salas').abrirImportacionSalas(...args); }

        function leerArchivoSalas(...args){ return applicationModule('salas').leerArchivoSalas(...args); }

        function normalizarNombreSala(...args){ return applicationModule('salas').normalizarNombreSala(...args); }

        function normalizarTipoEspacioSala(...args){ return applicationModule('salas').normalizarTipoEspacioSala(...args); }

        function importarSalasDesdeFilas(...args){ return applicationModule('salas').importarSalasDesdeFilas(...args); }

        function mostrarResultadoImportacionSalas(...args){ return applicationModule('salas').mostrarResultadoImportacionSalas(...args); }

        function eliminarSala(...args){ return applicationModule('salas').eliminarSala(...args); }

        function renderPanelAlertasSalas(...args){ return applicationModule('salas').renderPanelAlertasSalas(...args); }

        function renderSalas(...args){ return applicationModule('salas').renderSalas(...args); }

        function init(){
            const listaCarreras=document.getElementById('listaCarreras');
            if(listaCarreras) listaCarreras.addEventListener('click',(e)=>{
                const careerHeader=e.target.closest('.career-header');
                if(careerHeader && !e.target.closest('.btn')){
                    const tipo=careerHeader.dataset.tipo, id=careerHeader.dataset.id;
                    const nested=document.getElementById(`${tipo==='carrera'?'niveles':'secciones'}_${id}`);
                    if(nested){
                        const abrir=!nested.classList.contains('open');
                        const reducirMovimiento=(document.documentElement.dataset.planhorMotion!=='full' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
                        window.clearTimeout(nested._planhorAccordionTimer);
                        if(reducirMovimiento){
                            nested.classList.toggle('open',abrir);
                            careerHeader.classList.toggle('open',abrir);
                            nested.style.maxHeight=abrir?'none':'0px';
                            if(abrir) acordeonAbierto.add(nested.id); else acordeonAbierto.delete(nested.id);
                            return;
                        }
                        if(abrir){
                            nested.classList.add('open');
                            careerHeader.classList.add('open');
                            nested.style.maxHeight='0px';
                            void nested.offsetHeight;
                            nested.style.maxHeight=`${nested.scrollHeight}px`;
                            acordeonAbierto.add(nested.id);
                            nested._planhorAccordionTimer=window.setTimeout(()=>{
                                if(nested.classList.contains('open')) nested.style.maxHeight='none';
                            },260);
                        }else{
                            nested.style.maxHeight=`${nested.scrollHeight}px`;
                            void nested.offsetHeight;
                            nested.classList.remove('open');
                            careerHeader.classList.remove('open');
                            nested.style.maxHeight='0px';
                            acordeonAbierto.delete(nested.id);
                        }
                    }
                }
                if(e.target.classList.contains('btn-eliminar')){e.stopPropagation();eliminarEntidad(e.target.dataset.tipo,e.target.dataset.id);}
                if(e.target.classList.contains('btn-editar-carrera')){e.stopPropagation();abrirModalCarrera(e.target.dataset.id);}
                if(e.target.classList.contains('btn-nuevo-nivel')){e.stopPropagation();abrirModalNivel(e.target.dataset.carrera);}
                if(e.target.classList.contains('btn-editar-nivel')){e.stopPropagation();abrirModalNivel(e.target.dataset.carrera,e.target.dataset.id);}
                if(e.target.classList.contains('btn-nueva-seccion')){e.stopPropagation();abrirModalSeccion(e.target.dataset.nivel,null,e.target.dataset.jornada||'');}
                if(e.target.classList.contains('btn-editar-seccion')){e.stopPropagation();abrirModalSeccion(e.target.dataset.nivel,e.target.dataset.id);}
                if(e.target.classList.contains('btn-dictacion-seccion')){e.stopPropagation();abrirGestionDictacionSeccion(e.target.dataset.id);}
            });
            const btnCarrera=document.getElementById('btnNuevaCarrera');
            if(btnCarrera) btnCarrera.addEventListener('click',()=>abrirModalCarrera());
            document.getElementById('seccionesFiltroArea')?.addEventListener('change',renderCarreras);
            document.getElementById('btnCrearPlantillaSecciones')?.addEventListener('click',crearPlantillaImportacionSecciones);
            document.getElementById('btnCrearPlantillaAlumnosNivel')?.addEventListener('click',crearPlantillaAlumnosRealesNivel);
            document.getElementById('btnImportarSecciones')?.addEventListener('click',abrirImportacionSecciones);
            document.getElementById('btnExportarArchivoSecciones')?.addEventListener('click',exportarArchivoSecciones);
            document.getElementById('inputImportarSecciones')?.addEventListener('change',function(){leerArchivoSecciones(this.files?.[0]);});

            const listaAsignaturas=document.getElementById('listaAsignaturas');
            if(listaAsignaturas) listaAsignaturas.addEventListener('click',(e)=>{
                if(e.target.classList.contains('btn-eliminar-asignatura')) eliminarAsignatura(e.target.dataset.id);
                if(e.target.classList.contains('btn-editar-asignatura')) abrirModalAsignatura(e.target.dataset.id);
            });
            const btnAsignatura=document.getElementById('btnNuevaAsignatura');
            if(btnAsignatura) btnAsignatura.addEventListener('click',()=>abrirModalAsignatura());
            document.getElementById('btnCrearPlantillaAsignaturas')?.addEventListener('click',crearPlantillaImportacionAsignaturas);
            document.getElementById('btnImportarAsignaturas')?.addEventListener('click',abrirImportacionAsignaturas);
            document.getElementById('btnCopiarAsignaturasTemporada')?.addEventListener('click',()=>abrirCopiarCatalogoDesdeTemporada('asignaturas'));
            document.getElementById('btnExportarArchivoAsignaturas')?.addEventListener('click',exportarArchivoAsignaturas);
            document.getElementById('inputImportarAsignaturas')?.addEventListener('change',function(){leerArchivoAsignaturas(this.files?.[0]);});

            const listaDocentes=document.getElementById('listaDocentes');
            if(listaDocentes) listaDocentes.addEventListener('click',(e)=>{
                if(e.target.classList.contains('btn-eliminar-docente')) eliminarDocente(e.target.dataset.id);
                if(e.target.classList.contains('btn-editar-docente')) abrirModalDocente(e.target.dataset.id);
            });
            document.getElementById('docentesFiltroEspecialidad')?.addEventListener('change',renderDocentes);
            document.getElementById('btnCrearPlantillaDocentes')?.addEventListener('click',crearPlantillaImportacionDocentes);
            document.getElementById('btnImportarDocentes')?.addEventListener('click',abrirImportacionDocentes);
            document.getElementById('btnCopiarDocentesTemporada')?.addEventListener('click',()=>abrirCopiarCatalogoDesdeTemporada('docentes'));
            document.getElementById('btnExportarArchivoDocentes')?.addEventListener('click',exportarArchivoDocentes);
            document.getElementById('inputImportarDocentes')?.addEventListener('change',function(){leerArchivoDocentes(this.files?.[0]);});
            const btnDocente=document.getElementById('btnNuevoDocente');
            if(btnDocente) btnDocente.addEventListener('click',()=>abrirModalDocente());

            const lista=document.getElementById('listaSalas');
            if(lista) lista.addEventListener('click',(e)=>{
                if(e.target.classList.contains('btn-eliminar-sala')) eliminarSala(e.target.dataset.id);
                if(e.target.classList.contains('btn-editar-sala')) abrirModalSala(e.target.dataset.id);
            });
            const btn=document.getElementById('btnNuevaSala');
            if(btn) btn.addEventListener('click',()=>abrirModalSala());
            document.getElementById('btnCrearPlantillaSalas')?.addEventListener('click',crearPlantillaImportacionSalas);
            document.getElementById('btnImportarSalas')?.addEventListener('click',abrirImportacionSalas);
            document.getElementById('btnCopiarSalasTemporada')?.addEventListener('click',()=>abrirCopiarCatalogoDesdeTemporada('salas'));
            document.getElementById('btnExportarArchivoSalas')?.addEventListener('click',exportarArchivoSalas);
            document.getElementById('inputImportarSalas')?.addEventListener('change',function(){leerArchivoSalas(this.files?.[0]);});
        }

        return {
            eliminarEntidad,
            renderCarreras,
            abrirModalCarrera,
            guardarCarrera,
            abrirModalNivel,
            guardarNivel,
            abrirModalSeccion,
            guardarSeccion,
            abrirModalAsignatura,
            guardarAsignatura,
            eliminarAsignatura,
            renderAsignaturas,
            abrirModalDocente,
            guardarDocente,
            eliminarDocente,
            renderDocentes,
            abrirModalSala,
            guardarSala,
            eliminarSala,
            renderSalas,
            abrirGestionDictacionSeccion,
            init
        };
    }

    window.PlanificadorEntidades = { create: createEntidades };
})();
