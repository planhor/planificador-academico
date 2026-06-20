(function(){
    function createEntidades(ctx){
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

        function renderCarreras(){
            const data = getData();
            const cont=document.getElementById('listaCarreras');
            const filtroArea=document.getElementById('seccionesFiltroArea');
            const areaActual=filtroArea?.value||'';
            const resumenAlumnos=resumenAlumnosSecciones();
            if(filtroArea){
                filtroArea.innerHTML='<option value="">Todas</option>'+areasCarrera().map(a=>ctx.optionHTML(a,a,areaActual===a)).join('');
                filtroArea.value=areaActual&&areasCarrera().includes(areaActual)?areaActual:'';
            }
            const renderPanelAlertas=()=>{
                const items=[
                    ...data.carreras.filter(x=>Array.isArray(x.alertasImportacion)&&x.alertasImportacion.length).map(x=>({tipo:'Carrera',id:x.id,nombre:`${x.codigo} - ${x.nombre}`,detalle:x.alertasImportacion.join(' · '),btn:'btn-editar-carrera'})),
                    ...data.niveles.filter(x=>Array.isArray(x.alertasImportacion)&&x.alertasImportacion.length).map(x=>({tipo:'Nivel',id:x.id,carreraId:x.carreraId,nombre:x.nombre,detalle:x.alertasImportacion.join(' · '),btn:'btn-editar-nivel'})),
                    ...data.secciones.filter(x=>Array.isArray(x.alertasImportacion)&&x.alertasImportacion.length).map(x=>({tipo:'Sección',id:x.id,nivelId:x.nivelId,nombre:x.nombre,detalle:x.alertasImportacion.join(' · '),btn:'btn-editar-seccion'}))
                ];
                if(!items.length) return '';
                return `<div class="import-alert-panel">
                    <div class="import-alert-header"><div><strong>Alertas de importación</strong><span>${items.length} elemento(s) requieren revisión</span></div></div>
                    <div class="import-alert-list">
                        ${items.map(item=>`<div class="import-alert-item">
                            <div><strong>${ctx.escapeHTML(item.tipo)}: ${ctx.escapeHTML(item.nombre)}</strong><span>${ctx.escapeHTML(item.detalle)}</span></div>
                            <button class="btn btn-xs ${ctx.escapeAttr(item.btn)}" data-id="${ctx.escapeAttr(item.id)}" ${item.carreraId?`data-carrera="${ctx.escapeAttr(item.carreraId)}"`:''} ${item.nivelId?`data-nivel="${ctx.escapeAttr(item.nivelId)}"`:''}>Revisar</button>
                        </div>`).join('')}
                    </div>
                </div>`;
            };
            const carrerasFiltradas=data.carreras
                .filter(c=>!filtroArea?.value||areaCarrera(c)===filtroArea.value)
                .sort((a,b)=>areaCarrera(a).localeCompare(areaCarrera(b),undefined,{sensitivity:'base'})||String(a.nombre||'').localeCompare(String(b.nombre||''),undefined,{numeric:true,sensitivity:'base'}));
            const renderCarrera=c=>{
                const niveles=data.niveles.filter(n=>n.carreraId===c.id).sort(ordenarNivelesDesc);
                const seccionesCarrera=niveles.flatMap(n=>data.secciones.filter(s=>s.nivelId===n.id));
                const resumenCarrera=textoResumenAlumnos(seccionesCarrera,resumenAlumnos);
                const alerta=c.alertasImportacion?.length?` <small class="import-warning-chip">${c.alertasImportacion.length} alerta(s)</small>`:'';
                return `<div style="margin-bottom:8px;">
                    <div class="career-header" data-tipo="carrera" data-id="${ctx.escapeAttr(c.id)}"><span class="arrow">▶</span> <strong>${ctx.escapeHTML(c.codigo)} - ${ctx.escapeHTML(c.nombre)}</strong> <span class="student-total">${ctx.escapeHTML(resumenCarrera)}</span>${c.especialidad&&c.especialidad!==areaCarrera(c)?` <small style="font-size:0.7rem;color:var(--text-secondary)">Especialidad: ${ctx.escapeHTML(c.especialidad)}</small>`:''}${alerta}
                        <button class="btn btn-xs btn-editar-carrera" data-id="${ctx.escapeAttr(c.id)}">✎</button> <button class="btn btn-xs btn-eliminar" data-tipo="carrera" data-id="${ctx.escapeAttr(c.id)}">🗑️</button>
                    </div>
                    <div class="nested" id="niveles_${ctx.escapeAttr(c.id)}">
                        <button class="btn btn-xs btn-nuevo-nivel" data-carrera="${ctx.escapeAttr(c.id)}">+ Nivel</button>
                        ${niveles.map(n=>{
                            const secciones=data.secciones.filter(s=>s.nivelId===n.id).sort(ordenarSecciones);
                            const resumenNivel=textoResumenAlumnos(secciones,resumenAlumnos);
                            const alertaNivel=n.alertasImportacion?.length?` <small class="import-warning-chip">${n.alertasImportacion.length} alerta(s)</small>`:'';
                            const grupos=['diurna','vespertina'].map(jornada=>({
                                jornada,
                                nombre:etiquetaJornada(jornada),
                                items:secciones.filter(s=>jornadaSeccion(s)===jornada)
                            }));
                            const renderChip=s=>{
                                const r=resumenAlumnos.get(s.id)||{};
                                const asignaturasSobrecupo=contarSobrecuposResumen(r);
                                return `<span class="item-chip section-chip ${asignaturasSobrecupo?'section-overcapacity':''}">${ctx.escapeHTML(s.nombre)} ${badgeAlumnos(r)}${asignaturasSobrecupo?` <small class="import-warning-chip">${asignaturasSobrecupo} asig. con sobrecupo</small>`:''}${s.tipoSeccion&&s.tipoSeccion!=='regular'?` <small>${ctx.escapeHTML(s.tipoSeccion)}</small>`:''}${s.alertasImportacion?.length?` <small class="import-warning-chip">${s.alertasImportacion.length} alerta(s)</small>`:''} <button class="btn btn-xs btn-dictacion-seccion" data-id="${ctx.escapeAttr(s.id)}" title="Asignaturas de la sección">Asignaturas</button> <button class="btn btn-xs btn-editar-seccion" data-nivel="${ctx.escapeAttr(n.id)}" data-id="${ctx.escapeAttr(s.id)}">✎</button> <button class="btn btn-xs btn-eliminar" data-tipo="seccion" data-id="${ctx.escapeAttr(s.id)}">🗑️</button></span>`;
                            };
                            return `<div style="margin-left:20px;">
                                <div class="career-header" data-tipo="nivel" data-id="${ctx.escapeAttr(n.id)}"><span class="arrow">▶</span> <em>${ctx.escapeHTML(n.nombre)}</em> <span class="student-total">${ctx.escapeHTML(resumenNivel)}</span>${alertaNivel}
                                    <button class="btn btn-xs btn-editar-nivel" data-carrera="${ctx.escapeAttr(c.id)}" data-id="${ctx.escapeAttr(n.id)}">✎</button> <button class="btn btn-xs btn-eliminar" data-tipo="nivel" data-id="${ctx.escapeAttr(n.id)}">🗑️</button>
                                </div>
                                <div class="nested" id="secciones_${ctx.escapeAttr(n.id)}">
                                    ${grupos.map(g=>`<div class="jornada-group">
                                        <div class="jornada-header"><span>${ctx.escapeHTML(g.nombre)} <small>${ctx.escapeHTML(textoResumenAlumnos(g.items,resumenAlumnos))}</small></span><button class="btn btn-xs btn-nueva-seccion" data-nivel="${ctx.escapeAttr(n.id)}" data-jornada="${ctx.escapeAttr(g.jornada)}">+ Sección</button></div>
                                        <div class="jornada-sections">${g.items.length?g.items.map(renderChip).join(''):`<span class="jornada-empty">Sin secciones ${ctx.escapeHTML(g.nombre.toLowerCase())}</span>`}</div>
                                    </div>`).join('')}
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
            };
            const gruposArea=new Map();
            carrerasFiltradas.forEach(c=>{
                const area=areaCarrera(c);
                if(!gruposArea.has(area)) gruposArea.set(area,[]);
                gruposArea.get(area).push(c);
            });
            const seccionesFiltradas=carrerasFiltradas.flatMap(c=>data.niveles.filter(n=>n.carreraId===c.id).flatMap(n=>data.secciones.filter(s=>s.nivelId===n.id)));
            const resumenGeneral=textoResumenAlumnos(seccionesFiltradas,resumenAlumnos);
            const resumenGeneralHtml=`<div class="student-summary-strip"><strong>Total planificación</strong><span>${ctx.escapeHTML(resumenGeneral)}</span><small>El total principal considera alumnos propios no electivos. Otros planes y electivos quedan separados como referencia.</small></div>`;
            const contenido=[...gruposArea.entries()].map(([area,items])=>`
                <section class="area-section-group">
                    <div class="area-section-header"><strong>${ctx.escapeHTML(area)}</strong><span>${items.length} carrera(s) · ${ctx.escapeHTML(textoResumenAlumnos(items.flatMap(c=>data.niveles.filter(n=>n.carreraId===c.id).flatMap(n=>data.secciones.filter(s=>s.nivelId===n.id))),resumenAlumnos))}</span></div>
                    <div class="area-section-content">${items.map(renderCarrera).join('')}</div>
                </section>
            `).join('');
            cont.innerHTML=renderPanelAlertas()+resumenGeneralHtml+(contenido||'<p class="auto-plan-empty">No hay carreras para el área seleccionada.</p>');
            acordeonAbierto.forEach(id=>{
                const nested=document.getElementById(id);
                if(!nested) return;
                nested.classList.add('open');
                nested.style.maxHeight='none';
                nested.previousElementSibling?.classList.add('open');
            });
        }

        function nombreSeccion(seccionId){
            const data=getData();
            return data.secciones.find(s=>s.id===seccionId)?.nombre||'Sección no encontrada';
        }

        function nombreAsignatura(asignaturaId){
            const data=getData();
            const a=data.asignaturas.find(x=>x.id===asignaturaId);
            return a?[a.codigo,a.nombre].filter(Boolean).join(' - '):'Asignatura no encontrada';
        }

        function asignaturasDeNivel(nivelId){
            const data=getData();
            const nivel=data.niveles.find(n=>n.id===nivelId);
            const carreraId=nivel?.carreraId;
            if(!nivel||!carreraId) return [];
            const ids=data.asignaturaCarreraNivel
                .filter(r=>r.carreraId===carreraId&&r.nivelId===nivelId)
                .map(r=>r.asignaturaId);
            return [...new Set(ids)]
                .map(id=>data.asignaturas.find(a=>a.id===id))
                .filter(Boolean)
                .sort((a,b)=>String(a.codigo||'').localeCompare(String(b.codigo||'')));
        }
        function asignaturaAplicaSeccion(asignaturaId,seccionId){
            const data=getData();
            const especificas=(data.asignaturaSeccion||[]).filter(r=>r.seccionId===seccionId);
            if(!especificas.length) return true;
            return especificas.some(r=>r.asignaturaId===asignaturaId);
        }
        function agregarAsignaturaSeccion(asignaturaId,seccionId,origen='manual'){
            const data=getData();
            if(!Array.isArray(data.asignaturaSeccion)) data.asignaturaSeccion=[];
            if(!data.asignaturaSeccion.some(r=>r.asignaturaId===asignaturaId&&r.seccionId===seccionId)){
                data.asignaturaSeccion.push({asignaturaId,seccionId,origen});
            }
        }
        function quitarAsignaturaSeccion(asignaturaId,seccionId){
            const data=getData();
            const seccion=data.secciones.find(s=>s.id===seccionId);
            const especificas=(data.asignaturaSeccion||[]).filter(r=>r.seccionId===seccionId);
            if(seccion && !especificas.length){
                asignaturasDeNivel(seccion.nivelId)
                    .filter(a=>a.id!==asignaturaId)
                    .forEach(a=>agregarAsignaturaSeccion(a.id,seccionId,'manual'));
            }
            data.asignaturaSeccion=(data.asignaturaSeccion||[]).filter(r=>!(r.asignaturaId===asignaturaId&&r.seccionId===seccionId));
            (ctx.getGruposDictacion?.()||[]).slice().forEach(g=>{
                const coincide=g.asignaturaId===asignaturaId || g.asignaturasEquivalentesIds?.includes(asignaturaId);
                if(!coincide) return;
                if(g.seccionMadreId===seccionId) ctx.eliminarGrupoDictacion?.(g.id);
                else if(g.seccionesVinculadasIds?.includes(seccionId)) ctx.desvincularSeccionDeGrupo?.(g.id,seccionId);
            });
        }

        function gruposCompatiblesParaVincular(asignaturaId,seccionId){
            const grupos=ctx.getGruposDictacion?.()||[];
            return grupos.filter(g=>
                g.seccionMadreId!==seccionId &&
                !g.seccionesVinculadasIds?.includes(seccionId) &&
                (g.asignaturaId===asignaturaId || g.asignaturasEquivalentesIds?.includes(asignaturaId))
            );
        }

        function grupoCoincideAsignatura(grupo, asignaturaId){
            const data=getData();
            const asignatura=data.asignaturas.find(a=>a.id===asignaturaId);
            const principal=data.asignaturas.find(a=>a.id===grupo?.asignaturaId);
            return grupo?.asignaturaId===asignaturaId ||
                grupo?.asignaturasEquivalentesIds?.includes(asignaturaId) ||
                (!!asignatura?.codigo && !!principal?.codigo && limpiarClave(asignatura.codigo)===limpiarClave(principal.codigo));
        }

        function gruposDeAsignaturaSeccion(asignaturaId,seccionId){
            return (ctx.getGruposDictacion?.()||[]).filter(g=>
                grupoCoincideAsignatura(g,asignaturaId) &&
                (g.seccionMadreId===seccionId || g.seccionesVinculadasIds?.includes(seccionId))
            );
        }

        function crearGrupoPropioPorDesvinculacion({seccionId,asignaturaId,gruposOrigen,grupoOrigenPreferente=null}){
            const data=getData();
            agregarAsignaturaSeccion(asignaturaId,seccionId,'manual');
            const ahora=new Date().toISOString();
            const rel=relacionAsignaturaSeccion(asignaturaId,seccionId,true);
            const grupoExistente=(ctx.getGruposDictacion?.()||[]).find(g=>g.seccionMadreId===seccionId && grupoCoincideAsignatura(g,asignaturaId));
            const unicoOrigen=grupoOrigenPreferente || (gruposOrigen.length===1 ? gruposOrigen[0] : null);
            const aporteEstimadoVinculo=(grupo)=>{
                const vinculos=Math.max(1,(grupo?.seccionesVinculadasIds||[]).length);
                const total=Number(grupo?.alumnosVinculados)||Number(grupo?.alumnosVinculadosGestor)||0;
                if(vinculos<=1) return total;
                return Math.max(0,Math.round(total/vinculos));
            };
            const alumnosPropios=unicoOrigen ? aporteEstimadoVinculo(unicoOrigen) : 0;
            const eventosDesvinculacion=gruposOrigen.map(g=>({
                idGestor:g.idGestorSeccion||'',
                grupoOrigenId:g.id||'',
                seccionMadreId:g.seccionMadreId||'',
                seccionHijaId:seccionId,
                asignaturaId,
                fecha:ahora,
                usuario:window._usuarioActual||'usuario',
                accion:'desvinculada'
            }));
            gruposOrigen.forEach((g,idx)=>{
                g.fusionHistorial=Array.isArray(g.fusionHistorial)?g.fusionHistorial:[];
                g.fusionHistorial.push(eventosDesvinculacion[idx]);
                g.fusionHistorial=g.fusionHistorial.slice(-20);
                g.actualizadoEn=ahora;
            });
            gruposOrigen.forEach(g=>{
                const antes=(g.seccionesVinculadasIds||[]).length;
                const aporte=aporteEstimadoVinculo(g);
                ctx.desvincularSeccionDeGrupo?.(g.id,seccionId);
                if(antes>=1 && !g.alumnosManualActivo){
                    const actual=Number(g.alumnosVinculados)||0;
                    g.alumnosVinculados=antes===1 ? 0 : Math.max(0,actual-aporte);
                    g.alumnosTotales=(Number(g.alumnosBase)||0)+(Number(g.alumnosVinculados)||0);
                    g.actualizadoEn=ahora;
                }
            });
            const marca=unicoOrigen?.marcaGestor||'';
            const idGestor=unicoOrigen?.idGestorSeccion||'';
            const grupo=grupoExistente||ctx.crearGrupoDictacion?.({
                asignaturaId,
                seccionMadreId:seccionId,
                origen:'manual',
                estado:'activo',
                alumnosBase:alumnosPropios,
                alumnosVinculados:0,
                alumnosTotales:alumnosPropios,
                alumnosBaseGestor:alumnosPropios,
                alumnosVinculadosGestor:0,
                alumnosTotalesGestor:alumnosPropios,
                marcaGestor:marca,
                idGestorSeccion:idGestor,
                observacion:'Fusión desvinculada manualmente'
            });
            if(!grupo) return ctx.toast('No se pudo crear el grupo propio','error');
            grupo.seccionesVinculadasIds=(grupo.seccionesVinculadasIds||[]).filter(id=>id!==seccionId);
            grupo.fusionDesvinculada=true;
            grupo.fusionOrigenGrupoIds=[...new Set([...(grupo.fusionOrigenGrupoIds||[]),...gruposOrigen.map(g=>g.id)].filter(Boolean))];
            grupo.fusionDesvinculadaEn=grupo.fusionDesvinculadaEn||ahora;
            grupo.observacion=grupo.observacion||'Fusión desvinculada manualmente';
            grupo.fusionHistorial=Array.isArray(grupo.fusionHistorial)?grupo.fusionHistorial:[];
            if(rel){
                rel.origen='manual';
                rel.fusionDesvinculada=true;
                rel.fusionDesvinculadaEn=rel.fusionDesvinculadaEn||ahora;
                rel.fusionOrigenGrupoIds=[...new Set([...(rel.fusionOrigenGrupoIds||[]),...gruposOrigen.map(g=>g.id)].filter(Boolean))];
                rel.fusionHistorial=Array.isArray(rel.fusionHistorial)?rel.fusionHistorial:[];
            }
            eventosDesvinculacion.forEach(item=>{
                grupo.fusionHistorial.push(item);
                if(rel) rel.fusionHistorial.push(item);
            });
            grupo.fusionHistorial=grupo.fusionHistorial.slice(-20);
            if(rel){
                rel.fusionHistorial=rel.fusionHistorial.slice(-20);
                const ultimo=rel.fusionHistorial[rel.fusionHistorial.length-1]||null;
                rel.idGestorDesvinculado=ultimo?.idGestor||idGestor||rel.idGestor||'';
                rel.seccionMadreDesvinculadaId=ultimo?.seccionMadreId||'';
            }
            if(!Number(grupo.alumnosBase)&&alumnosPropios){
                grupo.alumnosBase=alumnosPropios;
                grupo.alumnosTotales=alumnosPropios;
            }
            return grupo;
        }

        async function desvincularFusionAsignatura(seccionId,asignaturaId,opciones={}){
            const data=getData();
            const seccion=data.secciones.find(s=>s.id===seccionId);
            const asignatura=data.asignaturas.find(a=>a.id===asignaturaId);
            if(!seccion||!asignatura) return ctx.toast('No se encontró la asignatura o sección','error');
            const gruposOrigen=gruposDeAsignaturaSeccion(asignaturaId,seccionId)
                .filter(g=>g.seccionesVinculadasIds?.includes(seccionId));
            if(!gruposOrigen.length) return ctx.toast('Esta asignatura no tiene una fusión heredada activa','info');
            if(!opciones.omitirConfirmacion){
                const madre=gruposOrigen[0]?.seccionMadreId ? nombreSeccion(gruposOrigen[0].seccionMadreId) : 'sección madre';
                const ok=await confirmarCambioCritico({
                    titulo:'Desvincular fusión',
                    mensaje:'La asignatura dejará de depender de la sección madre.',
                    queHara:`${nombreAsignatura(asignaturaId)} se planificará aparte en ${seccion.nombre}.`,
                    afectara:`Relación con ${madre} y alumnos vinculados de esta asignatura.`,
                    noTocara:'No copiará ni eliminará bloques ya planificados.',
                    confirmarTexto:'Desvincular'
                });
                if(!ok) return;
            }
            ctx.crearPuntoRecuperacion?.('antes_desvincular_fusion_hija');
            ctx.pushUndo?.({tipo:'desvincular_fusion',resumen:`Desvincular fusión · ${asignatura.codigo||asignatura.nombre}`,afecta:seccion.nombre,critica:true});
            const grupo=crearGrupoPropioPorDesvinculacion({seccionId,asignaturaId,gruposOrigen,grupoOrigenPreferente:opciones.grupoOrigen||null});
            if(!grupo) return;
            ctx.guardar();
            ctx.reconstruirIndices();
            abrirGestionDictacionSeccion(seccionId,{highlightAsignaturaId:asignaturaId});
            ctx.toast('Fusión desvinculada. La asignatura se planificará aparte.','success');
        }

        function resumenAlumnosGrupoDictacion(grupo){
            if(!grupo) return {total:0, base:0, vinculados:0, sobrecupo:false};
            const base=Number(grupo.alumnosBase)||0;
            const vinculados=Number(grupo.alumnosVinculados)||0;
            const total=Number(grupo.alumnosTotales)||base+vinculados;
            return {
                total,
                base,
                vinculados,
                sobrecupo:total>UMBRAL_SOBRECUPO_ASIGNATURA || base>UMBRAL_SOBRECUPO_ASIGNATURA
            };
        }

        function renderAlumnosDictacion(asignatura,seccion){
            const data=getData();
            const estado=ctx.getEstadoDictacionAsignatura?.(asignatura.id,seccion.id)||{estado:'sin-grupo'};
            if(!asignaturaAplicaSeccion(asignatura.id,seccion.id)&&estado.estado!=='vinculada') return '';
            const grupo=estado.grupo;
            const rel=(data.asignaturaSeccion||[]).find(r=>r.asignaturaId===asignatura.id&&r.seccionId===seccion.id);
            const idGestor=grupo?.idGestorSeccion||rel?.idGestor||'';
            const marca=String(rel?.marcaGestor||grupo?.marcaGestor||'').toUpperCase();
            const editarBtn=` <button class="btn btn-xs btn-editar-alumnos-dictacion" data-asig="${ctx.escapeAttr(asignatura.id)}">Editar</button>`;
            if(!grupo){
                const texto=[marca?`Marca: ${marca}`:'','Sin datos de alumnos', idGestor?`ID: ${idGestor}`:''].filter(Boolean).join(' · ');
                return `<span class="dictation-meta muted" ${idGestor?`title="ID Gestor: ${ctx.escapeAttr(idGestor)}"`:''}>${ctx.escapeHTML(texto)}${editarBtn}</span>`;
            }
            const resumen=resumenAlumnosGrupoDictacion(grupo);
            const partes=[];
            if(marca) partes.push(`Marca: ${marca}`);
            if(resumen.total) partes.push(`${resumen.total} alumno(s)`);
            if(resumen.base && resumen.vinculados) partes.push(`${resumen.base} propios + ${resumen.vinculados} vinculados`);
            else if(resumen.vinculados && estado.estado==='vinculada') partes.push(`${resumen.vinculados} vinculados`);
            if(grupo.alumnosManualActivo) partes.push('manual');
            if(idGestor) partes.push(`ID: ${idGestor}`);
            if(resumen.sobrecupo) partes.push('Sobrecupo');
            return `<span class="dictation-meta ${resumen.sobrecupo?'warning':''}" ${idGestor?`title="ID Gestor: ${ctx.escapeAttr(idGestor)}"`:''}>${ctx.escapeHTML(partes.join(' · ')||'Sin datos de alumnos')}${editarBtn}</span>`;
        }

        function renderHistorialFusionDictacion(asignatura,seccion){
            const estado=ctx.getEstadoDictacionAsignatura?.(asignatura.id,seccion.id)||{estado:'sin-grupo'};
            const grupo=estado.grupo;
            const rel=relacionAsignaturaSeccion(asignatura.id,seccion.id,false);
            const historialGrupo=Array.isArray(grupo?.fusionHistorial)?grupo.fusionHistorial:[];
            const historialRel=Array.isArray(rel?.fusionHistorial)?rel.fusionHistorial:[];
            const historial=[...historialGrupo,...historialRel]
                .filter(h=>!h.asignaturaId || h.asignaturaId===asignatura.id)
                .filter((h,i,arr)=>arr.findIndex(x=>
                    String(x.idGestor||'')===String(h.idGestor||'') &&
                    String(x.seccionMadreId||'')===String(h.seccionMadreId||'') &&
                    String(x.seccionHijaId||'')===String(h.seccionHijaId||'') &&
                    String(x.fecha||'')===String(h.fecha||'')
                )===i);
            if(!grupo?.fusionDesvinculada && !rel?.fusionDesvinculada && !historial.length) return '';
            const ultimo=historial.length
                ? historial[historial.length-1]
                : null;
            const esMadre=!!(grupo && grupo.seccionMadreId===seccion.id);
            const esHija=!!(ultimo?.seccionHijaId===seccion.id || rel?.fusionDesvinculada);
            const etiqueta=esMadre&&ultimo?.seccionHijaId
                ? `Fusión desvinculada con ${nombreSeccion(ultimo.seccionHijaId)}`
                : esHija
                    ? `Fusión desvinculada desde ${nombreSeccion(ultimo?.seccionMadreId||rel?.seccionMadreDesvinculadaId)}`
                    : 'Fusión desvinculada';
            const partes=[
                etiqueta,
                ultimo?.idGestor?`ID original: ${ultimo.idGestor}`:(rel?.idGestorDesvinculado||grupo?.idGestorSeccion?`ID: ${rel?.idGestorDesvinculado||grupo?.idGestorSeccion}`:''),
                esMadre?'':((ultimo?.seccionMadreId||rel?.seccionMadreDesvinculadaId)?`Madre anterior: ${nombreSeccion(ultimo?.seccionMadreId||rel?.seccionMadreDesvinculadaId)}`:''),
                (ultimo?.fecha||rel?.fusionDesvinculadaEn)?`Fecha: ${new Date(ultimo?.fecha||rel?.fusionDesvinculadaEn).toLocaleString()}`:''
            ].filter(Boolean);
            return `<span class="dictation-meta fusion-history">${ctx.escapeHTML(partes.join(' · '))}</span>`;
        }

        function relacionAsignaturaSeccion(asignaturaId,seccionId,crear=false){
            const data=getData();
            if(!Array.isArray(data.asignaturaSeccion)) data.asignaturaSeccion=[];
            let rel=data.asignaturaSeccion.find(r=>r.asignaturaId===asignaturaId&&r.seccionId===seccionId);
            if(!rel&&crear){
                const seccion=data.secciones.find(s=>s.id===seccionId);
                const yaEspecifica=data.asignaturaSeccion.some(r=>r.seccionId===seccionId);
                if(seccion&&!yaEspecifica){
                    asignaturasDeNivel(seccion.nivelId).forEach(a=>{
                        if(!data.asignaturaSeccion.some(r=>r.asignaturaId===a.id&&r.seccionId===seccionId)){
                            data.asignaturaSeccion.push({asignaturaId:a.id,seccionId,origen:'manual'});
                        }
                    });
                }
                rel={asignaturaId,seccionId,origen:'manual'};
                if(!data.asignaturaSeccion.some(r=>r.asignaturaId===asignaturaId&&r.seccionId===seccionId)) data.asignaturaSeccion.push(rel);
                else rel=data.asignaturaSeccion.find(r=>r.asignaturaId===asignaturaId&&r.seccionId===seccionId);
            }
            return rel||null;
        }

        function componentesSubseccion(rel){
            return Array.isArray(rel?.componentesSubseccion)?rel.componentesSubseccion:[];
        }

        function renderSubseccionesAsignatura(asignatura,seccion){
            const rel=relacionAsignaturaSeccion(asignatura.id,seccion.id,false);
            if(!rel?.usaSubsecciones) return '';
            const comps=componentesSubseccion(rel);
            const comunes=comps.filter(c=>c.tipo==='comun');
            const grupos=comps.filter(c=>c.tipo!=='comun');
            const horasCurriculares=(Number(rel.horasComunes)||0)+(Number(rel.horasPorSubseccion)||0);
            const horasOperativas=(Number(rel.horasComunes)||0)+grupos.reduce((acc,c)=>acc+(Number(c.horas)||Number(rel.horasPorSubseccion)||0),0);
            const resumen=[
                comunes.length?`${Number(rel.horasComunes)||0}h común`:'',
                grupos.length?`${grupos.length} grupo(s) · ${Number(rel.horasPorSubseccion)||0}h c/u`:'',
                horasCurriculares?`curricular ${horasCurriculares}h`:'',
                horasOperativas?`operativa ${horasOperativas}h`:''
            ].filter(Boolean).join(' · ');
            return `<span class="dictation-meta subsection-meta">Subsecciones: ${ctx.escapeHTML(resumen||'configuradas')}</span>`;
        }

        function renderEstadoDictacion(asignatura,seccion){
            const estado=ctx.getEstadoDictacionAsignatura?.(asignatura.id,seccion.id)||{estado:'sin-grupo'};
            const grupo=estado.grupo;
            const relBase=relacionAsignaturaSeccion(asignatura.id,seccion.id,false);
            if(estado.estado==='vinculada'){
                return `<span class="dictation-status linked">Heredada desde otra sección</span>
                    <small>${ctx.escapeHTML(nombreSeccion(grupo.seccionMadreId))}</small>`;
            }
            if(!asignaturaAplicaSeccion(asignatura.id,seccion.id)){
                return `<span class="dictation-status empty">No aplica</span>
                    <small>No forma parte de esta sección dentro del modelo de planificación.</small>`;
            }
            if(estado.estado==='dictada-aqui'){
                const vinculadas=(grupo.seccionesVinculadasIds||[]).map(nombreSeccion);
                const desvinculada=!!grupo.fusionDesvinculada || !!relBase?.fusionDesvinculada;
                return `<span class="dictation-status own">Se dicta aquí</span>
                    ${desvinculada?`<span class="dictation-status detached">Fusión desvinculada</span>`:''}
                    ${vinculadas.length?`<small>Compartida con: ${ctx.escapeHTML(vinculadas.join(', '))}</small>`:'<small>Sin secciones vinculadas.</small>'}`;
            }
            if(relBase?.fusionDesvinculada){
                return `<span class="dictation-status own">Se dicta aquí</span>
                    <span class="dictation-status detached">Fusión desvinculada</span>
                    <small>Planificada aparte de la sección madre original.</small>`;
            }
            return `<span class="dictation-status own">Se dicta aquí</span>
                <small>Propia de esta sección. Sin secciones vinculadas.</small>`;
        }

        function renderAccionesDictacion(asignatura,seccion){
            const estado=ctx.getEstadoDictacionAsignatura?.(asignatura.id,seccion.id)||{estado:'sin-grupo'};
            const grupo=estado.grupo;
            const configBtn=`<button class="btn btn-xs btn-config-subsecciones" data-asig="${ctx.escapeAttr(asignatura.id)}">Subsecciones</button>`;
            if(estado.estado==='vinculada'){
                return `<button class="btn btn-xs btn-ir-madre-dictacion" data-seccion="${ctx.escapeAttr(grupo.seccionMadreId)}">Ir a madre</button>
                    <button class="btn btn-xs btn-desvincular-fusion" data-asig="${ctx.escapeAttr(asignatura.id)}">Desvincular Fusión</button>
                    <button class="btn btn-xs btn-no-aplica" data-asig="${ctx.escapeAttr(asignatura.id)}">No aplica</button>`;
            }
            if(!asignaturaAplicaSeccion(asignatura.id,seccion.id)){
                const compatibles=gruposCompatiblesParaVincular(asignatura.id,seccion.id);
                return `<button class="btn btn-xs btn-dictar-aqui" data-asig="${ctx.escapeAttr(asignatura.id)}">Se dicta aquí</button>
                    <button class="btn btn-xs btn-vincular-dictacion" data-asig="${ctx.escapeAttr(asignatura.id)}" ${compatibles.length?'':'disabled title="Primero debe existir una sección madre que dicte esta asignatura"'}>Heredar</button>`;
            }
            if(estado.estado==='dictada-aqui'){
                const gestionarBtn=(grupo.seccionesVinculadasIds||[]).length
                    ? `<button class="btn btn-xs btn-gestionar-compartidas" data-asig="${ctx.escapeAttr(asignatura.id)}" data-grupo="${ctx.escapeAttr(grupo.id)}">Gestionar compartidas</button>`
                    : '';
                return `${configBtn}
                    ${gestionarBtn}
                    <button class="btn btn-xs btn-compartir-dictacion" data-asig="${ctx.escapeAttr(asignatura.id)}" data-grupo="${ctx.escapeAttr(grupo.id)}">Compartir</button>
                    <button class="btn btn-xs btn-no-aplica" data-asig="${ctx.escapeAttr(asignatura.id)}">No aplica</button>`;
            }
            const compatibles=gruposCompatiblesParaVincular(asignatura.id,seccion.id);
            return `${configBtn}
                <button class="btn btn-xs btn-dictar-aqui" data-asig="${ctx.escapeAttr(asignatura.id)}">Se dicta aquí</button>
                <button class="btn btn-xs btn-vincular-dictacion" data-asig="${ctx.escapeAttr(asignatura.id)}" ${compatibles.length?'':'disabled title="Primero debe existir una sección madre que dicte esta asignatura"'}>Heredar</button>
                <button class="btn btn-xs btn-no-aplica" data-asig="${ctx.escapeAttr(asignatura.id)}">No aplica</button>`;
        }

        function abrirConfigSubseccionesAsignatura(seccionId,asignaturaId){
            const data=getData();
            const seccion=data.secciones.find(s=>s.id===seccionId);
            const asignatura=data.asignaturas.find(a=>a.id===asignaturaId);
            if(!seccion||!asignatura) return ctx.toast('No se encontró la asignatura o sección','error');
            const rel=relacionAsignaturaSeccion(asignaturaId,seccionId,true);
            const totalHoras=Number(asignatura.horasPresenciales)||Number(asignatura.horasTotales)||0;
            const comps=componentesSubseccion(rel);
            const grupos=comps.filter(c=>c.tipo!=='comun');
            const horasComunes=Number(rel.horasComunes)||0;
            const horasPorSubseccion=Number(rel.horasPorSubseccion)||0;
            const alumnosTotal=Number(ctx.getEstadoDictacionAsignatura?.(asignaturaId,seccionId)?.grupo?.alumnosTotales)||Number(ctx.getEstadoDictacionAsignatura?.(asignaturaId,seccionId)?.grupo?.alumnosBase)||0;
            const gruposTexto=grupos.length?grupos.map(g=>`${g.nombre||g.id}|${Number(g.alumnos)||0}|${Number(g.horas)||horasPorSubseccion}`).join('\n'):`Grupo A|${alumnosTotal?Math.ceil(alumnosTotal/2):0}|${horasPorSubseccion||Math.max(0,totalHoras-horasComunes)}\nGrupo B|${alumnosTotal?Math.floor(alumnosTotal/2):0}|${horasPorSubseccion||Math.max(0,totalHoras-horasComunes)}`;
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal modal-wide">
                <div class="modal-header">
                    <h3>Subsecciones de asignatura</h3>
                    <p>${ctx.escapeHTML(nombreAsignatura(asignaturaId))} · ${ctx.escapeHTML(seccion.nombre)}</p>
                </div>
                <div class="form-group">
                    <label style="display:flex;gap:8px;align-items:center;font-weight:700;"><input type="checkbox" id="subUsa" ${rel.usaSubsecciones?'checked':''}> Usar subsecciones solo para esta asignatura</label>
                    <small style="color:var(--text-secondary);font-size:0.74rem;">Activa esto cuando la asignatura tiene horas comunes para toda la sección y horas prácticas/laboratorio divididas por grupo.</small>
                </div>
                <div class="form-grid">
                    <div class="form-group"><label class="form-label">Horas comunes sección madre</label><input class="form-input" id="subHorasComunes" type="number" min="0" step="18" value="${horasComunes}"></div>
                    <div class="form-group"><label class="form-label">Horas por cada subsección</label><input class="form-input" id="subHorasGrupo" type="number" min="0" step="18" value="${horasPorSubseccion}"></div>
                    <div class="form-group"><label class="form-label">Horas oficiales referencia</label><input class="form-input" id="subHorasOficiales" type="number" min="0" step="18" value="${totalHoras}" disabled></div>
                </div>
                <div class="form-group">
                    <label class="form-label">Grupos</label>
                    <textarea class="form-input" id="subGrupos" rows="5" placeholder="Grupo A|20|36">${ctx.escapeHTML(gruposTexto)}</textarea>
                    <small style="color:var(--text-secondary);font-size:0.74rem;">Una línea por grupo: Nombre|Alumnos|Horas. Ejemplo: Grupo A|20|36. Las horas de los grupos suman carga operativa, no duplican el total curricular del estudiante.</small>
                </div>
                <div class="subsection-preview" id="subPreview"></div>
                <div class="modal-actions">
                    <button class="btn" id="btnCancelarSubsecciones">Cancelar</button>
                    <button class="btn btn-danger" id="btnQuitarSubsecciones">Desactivar</button>
                    <button class="btn btn-primary" id="btnGuardarSubsecciones">Guardar</button>
                </div>
            </div></div>`;
            const leer=()=>{
                const usa=document.getElementById('subUsa')?.checked;
                const hComun=Math.max(0,Number(document.getElementById('subHorasComunes')?.value)||0);
                const hGrupo=Math.max(0,Number(document.getElementById('subHorasGrupo')?.value)||0);
                const lista=String(document.getElementById('subGrupos')?.value||'').split(/\n+/).map((linea,idx)=>{
                    const partes=linea.split('|').map(x=>x.trim());
                    const nombre=partes[0]||`Grupo ${idx+1}`;
                    const alumnos=Math.max(0,Number(partes[1])||0);
                    const horas=Math.max(0,Number(partes[2])||hGrupo);
                    return {id:ctx.genId(),nombre,alumnos,horas,tipo:'subseccion'};
                }).filter(g=>g.nombre);
                return {usa,hComun,hGrupo,lista};
            };
            const refrescarPreview=()=>{
                const v=leer();
                const curricular=v.hComun+v.hGrupo;
                const operativa=v.hComun+v.lista.reduce((a,g)=>a+(Number(g.horas)||v.hGrupo),0);
                const alumnos=v.lista.reduce((a,g)=>a+(Number(g.alumnos)||0),0);
                const okHoras=!totalHoras||curricular===totalHoras;
                const el=document.getElementById('subPreview');
                if(el) el.innerHTML=`
                    <div><span>Horas estudiante</span><strong>${curricular} h${totalHoras?` / ${totalHoras} h`:''}</strong></div>
                    <div><span>Carga operativa</span><strong>${operativa} h</strong></div>
                    <div><span>Alumnos cubiertos</span><strong>${alumnos}${alumnosTotal?` / ${alumnosTotal}`:''}</strong></div>
                    <div class="${okHoras?'':'warning'}"><span>Estado</span><strong>${okHoras?'Cuadra':'Revisar horas'}</strong></div>`;
            };
            ['subUsa','subHorasComunes','subHorasGrupo','subGrupos'].forEach(id=>document.getElementById(id)?.addEventListener('input',refrescarPreview));
            refrescarPreview();
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget)abrirGestionDictacionSeccion(seccionId);};
            document.getElementById('btnCancelarSubsecciones').onclick=()=>abrirGestionDictacionSeccion(seccionId);
            document.getElementById('btnQuitarSubsecciones').onclick=()=>{
                rel.usaSubsecciones=false;
                rel.horasComunes=0;
                rel.horasPorSubseccion=0;
                rel.componentesSubseccion=[];
                ctx.guardar(); ctx.reconstruirIndices(); abrirGestionDictacionSeccion(seccionId); ctx.toast('Subsecciones desactivadas','info');
            };
            document.getElementById('btnGuardarSubsecciones').onclick=()=>{
                const v=leer();
                rel.usaSubsecciones=!!v.usa;
                rel.horasComunes=v.usa?v.hComun:0;
                rel.horasPorSubseccion=v.usa?v.hGrupo:0;
                rel.componentesSubseccion=v.usa?[
                    {id:'comun',nombre:'Sección completa',tipo:'comun',alumnos:alumnosTotal,horas:v.hComun},
                    ...v.lista.map((g,idx)=>({id:`grupo-${idx+1}`,nombre:g.nombre,tipo:'subseccion',alumnos:g.alumnos,horas:g.horas||v.hGrupo}))
                ]:[];
                ctx.guardar(); ctx.reconstruirIndices(); abrirGestionDictacionSeccion(seccionId); ctx.toast('Subsecciones guardadas','success');
            };
        }

        function asegurarGrupoParaAlumnos(asignaturaId,seccionId){
            let estado=ctx.getEstadoDictacionAsignatura?.(asignaturaId,seccionId)||{estado:'sin-grupo',grupo:null};
            if(estado.grupo) return estado.grupo;
            agregarAsignaturaSeccion(asignaturaId,seccionId,'manual');
            const grupo=ctx.crearGrupoDictacion?.({
                asignaturaId,
                seccionMadreId:seccionId,
                alumnosBase:0,
                alumnosVinculados:0,
                alumnosTotales:0,
                origen:'manual',
                estado:'activo'
            });
            return grupo||null;
        }

        function abrirEditarAlumnosDictacion(seccionId,asignaturaId){
            const data=getData();
            const seccion=data.secciones.find(s=>s.id===seccionId);
            const asignatura=data.asignaturas.find(a=>a.id===asignaturaId);
            if(!seccion||!asignatura) return ctx.toast('No se encontró la asignatura o sección','error');
            const grupo=asegurarGrupoParaAlumnos(asignaturaId,seccionId);
            if(!grupo) return ctx.toast('No se pudo preparar el grupo de alumnos','error');
            const base=Number(grupo.alumnosBase)||0;
            const vinculados=Number(grupo.alumnosVinculados)||0;
            const gestorBase=Number(grupo.alumnosBaseGestor)||base;
            const gestorVinculados=Number(grupo.alumnosVinculadosGestor)||vinculados;
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <div class="modal-header">
                    <h3>Editar alumnos</h3>
                    <p>${ctx.escapeHTML(nombreAsignatura(asignaturaId))} · ${ctx.escapeHTML(seccion.nombre)}</p>
                </div>
                <div class="form-grid">
                    <div class="form-group"><label class="form-label">Alumnos propios</label><input class="form-input" id="editAlumnosBase" type="number" min="0" value="${base}"></div>
                    <div class="form-group"><label class="form-label">Alumnos otros planes</label><input class="form-input" id="editAlumnosVinculados" type="number" min="0" value="${vinculados}"></div>
                </div>
                <div class="form-group"><label class="form-label">Observación</label><textarea class="form-input" id="editAlumnosObs" rows="3">${ctx.escapeHTML(grupo.observacionAlumnos||'')}</textarea></div>
                <p class="modal-help">Gestor: ${gestorBase} propios + ${gestorVinculados} otros planes. El cambio manual impacta totales, capacidad de sala y reportes.</p>
                <div class="modal-actions">
                    <button class="btn" id="btnCancelarAlumnos">Cancelar</button>
                    <button class="btn" id="btnRestaurarAlumnosGestor">Restaurar Gestor</button>
                    <button class="btn btn-primary" id="btnGuardarAlumnosManual">Guardar</button>
                </div>
            </div></div>`;
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget)abrirGestionDictacionSeccion(seccionId);};
            document.getElementById('btnCancelarAlumnos').onclick=()=>abrirGestionDictacionSeccion(seccionId);
            document.getElementById('btnGuardarAlumnosManual').onclick=()=>{
                const propios=Math.max(0,Number(document.getElementById('editAlumnosBase').value)||0);
                const otros=Math.max(0,Number(document.getElementById('editAlumnosVinculados').value)||0);
                if(!grupo.alumnosBaseGestor&&!grupo.alumnosVinculadosGestor&&!grupo.alumnosTotalesGestor){
                    grupo.alumnosBaseGestor=base;
                    grupo.alumnosVinculadosGestor=vinculados;
                    grupo.alumnosTotalesGestor=base+vinculados;
                }
                grupo.alumnosBase=propios;
                grupo.alumnosVinculados=otros;
                grupo.alumnosTotales=propios+otros;
                grupo.alumnosManualActivo=true;
                grupo.observacionAlumnos=String(document.getElementById('editAlumnosObs').value||'').trim().slice(0,300);
                grupo.actualizadoEn=new Date().toISOString();
                ctx.guardar(); ctx.reconstruirIndices(); abrirGestionDictacionSeccion(seccionId); ctx.toast('Alumnos actualizados','success');
            };
            document.getElementById('btnRestaurarAlumnosGestor').onclick=()=>{
                const propios=Number(grupo.alumnosBaseGestor)||0;
                const otros=Number(grupo.alumnosVinculadosGestor)||0;
                grupo.alumnosBase=propios;
                grupo.alumnosVinculados=otros;
                grupo.alumnosTotales=propios+otros;
                grupo.alumnosManualActivo=false;
                grupo.observacionAlumnos='';
                grupo.actualizadoEn=new Date().toISOString();
                ctx.guardar(); ctx.reconstruirIndices(); abrirGestionDictacionSeccion(seccionId); ctx.toast('Datos del Gestor restaurados','success');
            };
        }

        function contextoDestinoElectiva(seccion){
            const data=getData();
            const nivel=data.niveles.find(n=>n.id===seccion?.nivelId);
            const carrera=nivel?data.carreras.find(c=>c.id===nivel.carreraId):null;
            return {nivel,carrera,texto:[carrera?areaCarrera(carrera):'',carrera?.nombre,nivel?.nombre,etiquetaJornada(jornadaSeccion(seccion)),seccion?.nombre].filter(Boolean).join(' · ')};
        }

        function vinculosElectivosSeccion(seccionId){
            const data=getData();
            return (data.vinculosElectivos||[])
                .filter(v=>v.seccionDestinoId===seccionId)
                .sort((a,b)=>nombreAsignatura(a.asignaturaId).localeCompare(nombreAsignatura(b.asignaturaId),'es',{numeric:true})||nombreSeccion(a.seccionOrigenId).localeCompare(nombreSeccion(b.seccionOrigenId),'es',{numeric:true}));
        }

        function renderElectivasVinculadasSeccion(seccionId){
            const data=getData();
            const vinculos=vinculosElectivosSeccion(seccionId);
            if(!vinculos.length) return '<div class="elective-section-empty">Sin electivas vinculadas.</div>';
            return `<div class="dictation-list elective-dictation-list">${vinculos.map(v=>{
                const asignatura=data.asignaturas.find(a=>a.id===v.asignaturaId);
                return `<div class="dictation-row" data-vinculo-electivo="${ctx.escapeAttr(v.id)}">
                    <div>
                        <strong>${ctx.escapeHTML(nombreAsignatura(v.asignaturaId))}</strong>
                        <span class="dictation-status elective">Electiva vinculada</span>
                        <small>Sección de origen: ${ctx.escapeHTML(nombreSeccion(v.seccionOrigenId))}</small>
                    </div>
                    <div class="dictation-actions">
                        <button class="btn btn-xs btn-ir-origen-electiva" data-seccion="${ctx.escapeAttr(v.seccionOrigenId)}">Ir a origen</button>
                        <button class="btn btn-xs btn-quitar-vinculo-electivo" data-vinculo="${ctx.escapeAttr(v.id)}">Quitar vínculo</button>
                    </div>
                </div>`;}).join('')}</div>`;
        }

        function abrirGestionDictacionSeccion(seccionId, opciones={}){
            const data=getData();
            const seccion=data.secciones.find(s=>s.id===seccionId);
            if(!seccion) return ctx.toast('Sección no encontrada','error');
            const nivel=data.niveles.find(n=>n.id===seccion.nivelId);
            const carrera=data.carreras.find(c=>c.id===nivel?.carreraId);
            const asignaturas=asignaturasDeNivel(seccion.nivelId);
            const especificas=(data.asignaturaSeccion||[]).filter(r=>r.seccionId===seccion.id).length;
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal modal-wide">
                <div class="modal-header">
                    <h3>Asignaturas de la sección</h3>
                    <p>${ctx.escapeHTML(seccion.nombre)}${carrera?` · ${ctx.escapeHTML(carrera.codigo)} - ${ctx.escapeHTML(carrera.nombre)}`:''}${nivel?` · ${ctx.escapeHTML(nivel.nombre)}`:''}${especificas?` · modelo específico por sección`:''}</p>
                </div>
                ${!asignaturas.length?`<div class="auto-plan-empty">Este nivel aún no tiene asignaturas asociadas.</div>`:`
                <div class="dictation-list">
                    ${asignaturas.map(a=>`
                        <div class="dictation-row ${opciones.highlightAsignaturaId===a.id?'dictation-row-focus':''}" data-asig="${ctx.escapeAttr(a.id)}">
                            <div>
                                <strong>${ctx.escapeHTML(nombreAsignatura(a.id))}</strong>
                                ${renderEstadoDictacion(a,seccion)}
                                ${renderAlumnosDictacion(a,seccion)}
                                ${renderHistorialFusionDictacion(a,seccion)}
                                ${renderSubseccionesAsignatura(a,seccion)}
                            </div>
                            <div class="dictation-actions">${renderAccionesDictacion(a,seccion)}</div>
                        </div>
                    `).join('')}
                </div>`}
                <div class="elective-section-panel">
                    <div class="elective-section-head">
                        <div><strong>Electivas vinculadas</strong><small>Protegen el horario de esta sección sin crear una fusión.</small></div>
                        <button class="btn btn-xs btn-primary" id="btnVincularElectivaSeccion">+ Vincular electiva</button>
                    </div>
                    ${renderElectivasVinculadasSeccion(seccion.id)}
                </div>
                <div class="modal-actions">
                    <button class="btn" id="btnCerrarDictacion">Cerrar</button>
                </div>
            </div></div>`;
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget)ctx.cerrarModal();};
            document.getElementById('btnCerrarDictacion').onclick=()=>ctx.cerrarModal();
            const modal=document.getElementById('modalContainer');
            if(opciones.highlightAsignaturaId){
                const objetivo=[...modal.querySelectorAll('.dictation-row')].find(row=>row.dataset.asig===opciones.highlightAsignaturaId);
                if(objetivo){
                    setTimeout(()=>objetivo.scrollIntoView({behavior:'smooth',block:'center'}),80);
                    setTimeout(()=>objetivo.classList.remove('dictation-row-focus'),3600);
                }
            }
            modal.querySelectorAll('.btn-dictar-aqui').forEach(btn=>btn.onclick=async()=>{
                const asigId=btn.dataset.asig;
                const ok=await confirmarCambioCritico({
                    titulo:'Marcar como dictada aquí',
                    mensaje:'La sección pasará a dictar esta asignatura directamente.',
                    queHara:`${nombreAsignatura(asigId)} quedará como propia de ${seccion.nombre}.`,
                    afectara:'Estado de dictación y vínculos activos de esta asignatura.',
                    noTocara:'No cambiará bloques ya planificados ni catálogos.',
                    confirmarTexto:'Dictar aquí',
                    peligro:false
                });
                if(!ok) return;
                ctx.crearPuntoRecuperacion?.('antes_dictar_aqui');
                ctx.pushUndo?.({tipo:'dictar_aqui',resumen:`Se dicta aquí · ${nombreAsignatura(asigId)}`,afecta:seccion.nombre,critica:true});
                agregarAsignaturaSeccion(btn.dataset.asig,seccion.id,'manual');
                (ctx.getGruposDictacion?.()||[]).slice().forEach(g=>{
                    const coincide=g.asignaturaId===btn.dataset.asig || g.asignaturasEquivalentesIds?.includes(btn.dataset.asig);
                    if(coincide&&g.seccionesVinculadasIds?.includes(seccion.id)) ctx.desvincularSeccionDeGrupo?.(g.id,seccion.id);
                });
                const grupo=ctx.crearGrupoDictacion?.({asignaturaId:btn.dataset.asig,seccionMadreId:seccion.id,origen:'manual'});
                if(!grupo) return ctx.toast('No se pudo crear el grupo de dictación','error');
                ctx.guardar(); abrirGestionDictacionSeccion(seccion.id); ctx.toast('Asignatura marcada como dictada aquí','success');
            });
            modal.querySelectorAll('.btn-desvincular-fusion').forEach(btn=>btn.onclick=()=>desvincularFusionAsignatura(seccion.id,btn.dataset.asig));
            modal.querySelectorAll('.btn-vincular-dictacion').forEach(btn=>btn.onclick=()=>abrirVincularDictacion(seccion.id,btn.dataset.asig));
            modal.querySelectorAll('.btn-compartir-dictacion').forEach(btn=>btn.onclick=()=>abrirCompartirDictacion(seccion.id,btn.dataset.grupo,btn.dataset.asig));
            modal.querySelectorAll('.btn-gestionar-compartidas').forEach(btn=>btn.onclick=()=>abrirGestionCompartidas(seccion.id,btn.dataset.grupo,btn.dataset.asig));
            modal.querySelectorAll('.btn-editar-alumnos-dictacion').forEach(btn=>btn.onclick=()=>abrirEditarAlumnosDictacion(seccion.id,btn.dataset.asig));
            modal.querySelectorAll('.btn-config-subsecciones').forEach(btn=>btn.onclick=()=>abrirConfigSubseccionesAsignatura(seccion.id,btn.dataset.asig));
            modal.querySelectorAll('.btn-no-aplica').forEach(btn=>btn.onclick=async()=>{
                const asigId=btn.dataset.asig;
                const ok=await confirmarCambioCritico({
                    titulo:'Marcar No aplica',
                    mensaje:'La asignatura dejará de formar parte del modelo de esta sección.',
                    queHara:`${nombreAsignatura(asigId)} quedará como No aplica en ${seccion.nombre}.`,
                    afectara:'Relación asignatura-sección y vínculo de dictación si existía.',
                    noTocara:'No eliminará bloques ya planificados automáticamente.',
                    confirmarTexto:'Marcar No aplica'
                });
                if(!ok) return;
                ctx.crearPuntoRecuperacion?.('antes_no_aplica');
                ctx.pushUndo?.({tipo:'no_aplica',resumen:`No aplica · ${nombreAsignatura(asigId)}`,afecta:seccion.nombre,critica:true});
                quitarAsignaturaSeccion(btn.dataset.asig,seccion.id);
                ctx.guardar(); ctx.reconstruirIndices(); abrirGestionDictacionSeccion(seccion.id); ctx.toast('Asignatura marcada como No aplica','info');
            });
            modal.querySelectorAll('.btn-ir-madre-dictacion').forEach(btn=>btn.onclick=()=>{
                const madre=data.secciones.find(s=>s.id===btn.dataset.seccion);
                if(madre) abrirGestionDictacionSeccion(madre.id);
            });
            document.getElementById('btnVincularElectivaSeccion').onclick=()=>abrirVincularElectivaSeccion(seccion.id);
            modal.querySelectorAll('.btn-ir-origen-electiva').forEach(btn=>btn.onclick=()=>abrirGestionDictacionSeccion(btn.dataset.seccion));
            modal.querySelectorAll('.btn-quitar-vinculo-electivo').forEach(btn=>btn.onclick=()=>quitarVinculoElectivo(btn.dataset.vinculo,seccion.id));
        }

        function ofertasElectivas(){
            const data=getData();
            const ofertas=[];
            data.asignaturas.filter(a=>a.area==='electiva').forEach(asignatura=>{
                const origenes=new Set(data.planificaciones.filter(p=>p.asignaturaId===asignatura.id).map(p=>p.seccionId));
                (data.asignaturaSeccion||[]).filter(r=>r.asignaturaId===asignatura.id).forEach(r=>origenes.add(r.seccionId));
                (data.asignaturaCarreraNivel||[]).filter(r=>r.asignaturaId===asignatura.id).forEach(r=>data.secciones.filter(s=>s.nivelId===r.nivelId).forEach(s=>origenes.add(s.id)));
                [...origenes].filter(id=>data.secciones.some(s=>s.id===id)).forEach(seccionOrigenId=>ofertas.push({asignaturaId:asignatura.id,seccionOrigenId,texto:`${nombreAsignatura(asignatura.id)} · Sección origen: ${nombreSeccion(seccionOrigenId)}`}));
            });
            return ofertas.sort((a,b)=>a.texto.localeCompare(b.texto,'es',{numeric:true}));
        }

        function abrirVincularElectivaSeccion(seccionDestinoId){
            const data=getData();
            const existentes=new Set((data.vinculosElectivos||[]).filter(v=>v.seccionDestinoId===seccionDestinoId).map(v=>`${v.asignaturaId}|${v.seccionOrigenId}`));
            const ofertas=ofertasElectivas().filter(o=>o.seccionOrigenId!==seccionDestinoId&&!existentes.has(`${o.asignaturaId}|${o.seccionOrigenId}`));
            if(!ofertas.length) return ctx.toast('No hay ofertas electivas pendientes de vincular','info');
            document.getElementById('modalContainer').innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal">
                    <div class="modal-header"><h3>Vincular electiva</h3><p>Destino: ${ctx.escapeHTML(nombreSeccion(seccionDestinoId))}</p></div>
                    <div class="form-group"><label class="form-label">Electiva y sección de origen</label><select class="form-select" id="ofertaElectivaVincular">${ofertas.map((o,i)=>ctx.optionHTML(String(i),o.texto)).join('')}</select></div>
                    <p class="criteria-note">Puedes repetir esta acción para agregar electivas de la misma o de otras secciones.</p>
                    <div class="modal-actions"><button class="btn" id="btnVolverVinculoElectivo">Volver</button><button class="btn btn-primary" id="btnConfirmarVinculoElectivo">Vincular</button></div>
                </div></div>`;
            document.getElementById('modalOverlay').onclick=e=>{if(e.target===e.currentTarget)abrirGestionDictacionSeccion(seccionDestinoId);};
            document.getElementById('btnVolverVinculoElectivo').onclick=()=>abrirGestionDictacionSeccion(seccionDestinoId);
            document.getElementById('btnConfirmarVinculoElectivo').onclick=async()=>{
                const oferta=ofertas[Number(document.getElementById('ofertaElectivaVincular').value)];
                if(!oferta) return;
                const ok=await confirmarCambioCritico({titulo:'Vincular electiva',mensaje:'La sección considerará esta oferta electiva en su horario.',queHara:`${nombreAsignatura(oferta.asignaturaId)} desde ${nombreSeccion(oferta.seccionOrigenId)} se vinculará con ${nombreSeccion(seccionDestinoId)}.`,afectara:'Visualización y validación de topes.',noTocara:'No creará fusiones ni duplicará bloques.',confirmarTexto:'Vincular',peligro:false});
                if(!ok) return;
                ctx.pushUndo?.({tipo:'vincular_electiva',resumen:`Vincular electiva · ${nombreAsignatura(oferta.asignaturaId)}`,afecta:nombreSeccion(seccionDestinoId),critica:false});
                (data.vinculosElectivos||(data.vinculosElectivos=[])).push({id:ctx.genId(),asignaturaId:oferta.asignaturaId,seccionOrigenId:oferta.seccionOrigenId,seccionDestinoId,origen:'manual'});
                ctx.guardar(); abrirGestionDictacionSeccion(seccionDestinoId); ctx.toast('Electiva vinculada','success');
            };
        }

        async function quitarVinculoElectivo(vinculoId,seccionRetornoId){
            const data=getData();
            const vinculo=(data.vinculosElectivos||[]).find(v=>v.id===vinculoId);
            if(!vinculo) return;
            const ok=await confirmarCambioCritico({titulo:'Quitar vínculo electivo',mensaje:'La sección dejará de considerar esta oferta electiva.',queHara:`Se quitará ${nombreAsignatura(vinculo.asignaturaId)} desde ${nombreSeccion(vinculo.seccionOrigenId)}.`,afectara:'Solo esta relación electiva.',noTocara:'No eliminará asignaturas ni bloques.',confirmarTexto:'Quitar vínculo'});
            if(!ok) return;
            ctx.pushUndo?.({tipo:'quitar_vinculo_electivo',resumen:`Quitar electiva · ${nombreAsignatura(vinculo.asignaturaId)}`,afecta:nombreSeccion(seccionRetornoId),critica:false});
            data.vinculosElectivos=data.vinculosElectivos.filter(v=>v.id!==vinculoId);
            ctx.guardar(); abrirGestionDictacionSeccion(seccionRetornoId); ctx.toast('Vínculo electivo eliminado','success');
        }

        async function desvincularFusionDesdeMadre(seccionMadreId,grupoId,seccionHijaId,asignaturaId){
            const grupo=(ctx.getGruposDictacion?.()||[]).find(g=>g.id===grupoId);
            if(!grupo) return ctx.toast('Grupo madre no encontrado','error');
            if(!grupo.seccionesVinculadasIds?.includes(seccionHijaId)) return ctx.toast('La sección ya no está vinculada a este grupo','info');
            const ok=await confirmarCambioCritico({
                titulo:'Desvincular fusión',
                mensaje:'La sección vinculada dejará de heredar desde esta madre.',
                queHara:`${nombreSeccion(seccionHijaId)} planificará ${nombreAsignatura(asignaturaId)} aparte.`,
                afectara:`Vínculo con ${nombreSeccion(seccionMadreId)} e historial del ID Gestor.`,
                noTocara:'No eliminará bloques existentes ni la asignatura del catálogo.',
                confirmarTexto:'Desvincular'
            });
            if(!ok) return;
            ctx.crearPuntoRecuperacion?.('antes_desvincular_fusion_madre');
            ctx.pushUndo?.({tipo:'desvincular_fusion',resumen:`Desvincular fusión · ${nombreAsignatura(asignaturaId)}`,afecta:`${nombreSeccion(seccionMadreId)} / ${nombreSeccion(seccionHijaId)}`,critica:true});
            const creado=crearGrupoPropioPorDesvinculacion({
                seccionId:seccionHijaId,
                asignaturaId,
                gruposOrigen:[grupo],
                grupoOrigenPreferente:grupo
            });
            if(!creado) return;
            ctx.guardar();
            ctx.reconstruirIndices();
            abrirGestionCompartidas(seccionMadreId,grupoId,asignaturaId);
            ctx.toast('Fusión desvinculada desde la sección madre','success');
        }

        function abrirGestionCompartidas(seccionMadreId,grupoId,asignaturaId){
            const data=getData();
            const grupo=(ctx.getGruposDictacion?.()||[]).find(g=>g.id===grupoId);
            if(!grupo) return ctx.toast('Grupo no encontrado','error');
            const vinculadas=(grupo.seccionesVinculadasIds||[])
                .map(id=>data.secciones.find(s=>s.id===id))
                .filter(Boolean)
                .sort((a,b)=>a.nombre.localeCompare(b.nombre,undefined,{numeric:true,sensitivity:'base'}));
            const historial=(grupo.fusionHistorial||[]).slice(-6).reverse();
            const filas=vinculadas.map(s=>`
                <tr>
                    <td><strong>${ctx.escapeHTML(s.nombre)}</strong></td>
                    <td>${ctx.escapeHTML(nombreAsignatura(asignaturaId))}</td>
                    <td>${grupo.idGestorSeccion?ctx.escapeHTML(grupo.idGestorSeccion):'<span class="muted">Sin ID</span>'}</td>
                    <td>
                        <button class="btn btn-xs btn-ir-hija-compartida" data-seccion="${ctx.escapeAttr(s.id)}">Ir a sección</button>
                        <button class="btn btn-xs btn-danger btn-desvincular-desde-madre" data-seccion="${ctx.escapeAttr(s.id)}">Desvincular Fusión</button>
                    </td>
                </tr>`).join('');
            const filasHistorial=historial.map(h=>`
                <tr>
                    <td>${ctx.escapeHTML(h.idGestor||grupo.idGestorSeccion||'Sin ID')}</td>
                    <td>${ctx.escapeHTML(nombreSeccion(h.seccionMadreId)||'Sin madre')}</td>
                    <td>${ctx.escapeHTML(nombreSeccion(h.seccionHijaId)||'Sin hija')}</td>
                    <td>${ctx.escapeHTML(h.fecha?new Date(h.fecha).toLocaleString():'')}</td>
                </tr>`).join('');
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal modal-wide">
                <div class="modal-header">
                    <h3>Gestionar compartidas</h3>
                    <p>${ctx.escapeHTML(nombreAsignatura(asignaturaId))} · madre: ${ctx.escapeHTML(nombreSeccion(seccionMadreId))}${grupo.idGestorSeccion?` · ID: ${ctx.escapeHTML(grupo.idGestorSeccion)}`:''}</p>
                </div>
                ${vinculadas.length?`
                    <div class="dashboard-detail-table">
                        <table class="report-table compact-table">
                            <thead><tr><th>Sección vinculada</th><th>Asignatura</th><th>ID Gestor</th><th>Acción</th></tr></thead>
                            <tbody>${filas}</tbody>
                        </table>
                    </div>`:`
                    <div class="auto-plan-empty">Esta asignatura no tiene secciones vinculadas activas.</div>`}
                <div class="fusion-history-panel">
                    <strong>Historial breve</strong>
                    ${historial.length?`
                    <table class="report-table compact-table">
                        <thead><tr><th>ID</th><th>Madre anterior</th><th>Sección desvinculada</th><th>Fecha</th></tr></thead>
                        <tbody>${filasHistorial}</tbody>
                    </table>`:`<p>No hay desvinculaciones registradas para este grupo.</p>`}
                </div>
                <div class="modal-actions">
                    <button class="btn" id="btnVolverGestionCompartidas">Volver</button>
                </div>
            </div></div>`;
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget)abrirGestionDictacionSeccion(seccionMadreId);};
            document.getElementById('btnVolverGestionCompartidas').onclick=()=>abrirGestionDictacionSeccion(seccionMadreId);
            const modal=document.getElementById('modalContainer');
            modal.querySelectorAll('.btn-ir-hija-compartida').forEach(btn=>btn.onclick=()=>abrirGestionDictacionSeccion(btn.dataset.seccion,{highlightAsignaturaId:asignaturaId}));
            modal.querySelectorAll('.btn-desvincular-desde-madre').forEach(btn=>btn.onclick=()=>desvincularFusionDesdeMadre(seccionMadreId,grupoId,btn.dataset.seccion,asignaturaId));
        }

        function abrirVincularDictacion(seccionId,asignaturaId){
            const grupos=gruposCompatiblesParaVincular(asignaturaId,seccionId);
            if(!grupos.length) return ctx.toast('No hay grupos madre disponibles para esta asignatura','info');
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3>Vincular asignatura</h3>
                <p style="font-size:0.82rem;color:var(--text-secondary);margin-top:0;">${ctx.escapeHTML(nombreAsignatura(asignaturaId))} en ${ctx.escapeHTML(nombreSeccion(seccionId))}</p>
                <div class="form-group">
                    <label class="form-label">Se dictará desde</label>
                    <select class="form-select" id="grupoDictacionDestino">
                        ${grupos.map(g=>ctx.optionHTML(g.id,`${nombreSeccion(g.seccionMadreId)} · ${nombreAsignatura(g.asignaturaId)}`)).join('')}
                    </select>
                </div>
                <div class="form-group"><label class="form-label">Alumnos que se suman (opcional)</label><input class="form-input" id="alumnosVinculo" type="number" min="0" value="0"></div>
                <div class="modal-actions"><button class="btn" id="btnVolverDictacion">Volver</button><button class="btn btn-primary" id="btnConfirmarVinculo">Confirmar vínculo</button></div>
            </div></div>`;
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget)abrirGestionDictacionSeccion(seccionId);};
            document.getElementById('btnVolverDictacion').onclick=()=>abrirGestionDictacionSeccion(seccionId);
            document.getElementById('btnConfirmarVinculo').onclick=async()=>{
                const grupoId=document.getElementById('grupoDictacionDestino').value;
                const alumnos=Number(document.getElementById('alumnosVinculo').value)||0;
                const grupo=grupos.find(g=>g.id===grupoId);
                const ok=await confirmarCambioCritico({
                    titulo:'Heredar asignatura',
                    mensaje:'La sección consumirá la planificación de una sección madre.',
                    queHara:`${nombreSeccion(seccionId)} heredará ${nombreAsignatura(asignaturaId)} desde ${nombreSeccion(grupo?.seccionMadreId)}.`,
                    afectara:'Grupo de dictación, alumnos vinculados y visualización del horario.',
                    noTocara:'No moverá bloques ya planificados en la sección madre.',
                    confirmarTexto:'Confirmar herencia',
                    peligro:false
                });
                if(!ok) return;
                ctx.crearPuntoRecuperacion?.('antes_heredar_asignatura');
                ctx.pushUndo?.({tipo:'heredar_asignatura',resumen:`Heredar · ${nombreAsignatura(asignaturaId)}`,afecta:nombreSeccion(seccionId),critica:true});
                agregarAsignaturaSeccion(asignaturaId,seccionId,'manual');
                if(!ctx.vincularSeccionAGrupo?.(grupoId,seccionId,{alumnos})) return ctx.toast('No se pudo crear el vínculo','error');
                ctx.guardar(); abrirGestionDictacionSeccion(seccionId); ctx.toast('Asignatura vinculada','success');
            };
        }

        function abrirCompartirDictacion(seccionMadreId,grupoId,asignaturaId){
            const data=getData();
            const grupo=(ctx.getGruposDictacion?.()||[]).find(g=>g.id===grupoId);
            if(!grupo) return ctx.toast('Grupo no encontrado','error');
            const candidatas=data.secciones
                .filter(s=>s.id!==seccionMadreId&&!grupo.seccionesVinculadasIds.includes(s.id))
                .filter(s=>asignaturasDeNivel(s.nivelId).some(a=>a.id===asignaturaId || grupo.asignaturasEquivalentesIds?.includes(a.id)))
                .sort((a,b)=>a.nombre.localeCompare(b.nombre));
            if(!candidatas.length) return ctx.toast('No hay secciones compatibles para compartir esta asignatura','info');
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3>Compartir asignatura</h3>
                <p style="font-size:0.82rem;color:var(--text-secondary);margin-top:0;">${ctx.escapeHTML(nombreAsignatura(asignaturaId))} dictada en ${ctx.escapeHTML(nombreSeccion(seccionMadreId))}</p>
                <div class="form-group">
                    <label class="form-label">Sección vinculada</label>
                    <select class="form-select" id="seccionCompartirDictacion">
                        ${candidatas.map(s=>ctx.optionHTML(s.id,s.nombre)).join('')}
                    </select>
                </div>
                <div class="form-group"><label class="form-label">Alumnos que se suman (opcional)</label><input class="form-input" id="alumnosCompartir" type="number" min="0" value="0"></div>
                <div class="modal-actions"><button class="btn" id="btnVolverDictacion">Volver</button><button class="btn btn-primary" id="btnConfirmarCompartir">Compartir</button></div>
            </div></div>`;
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget)abrirGestionDictacionSeccion(seccionMadreId);};
            document.getElementById('btnVolverDictacion').onclick=()=>abrirGestionDictacionSeccion(seccionMadreId);
            document.getElementById('btnConfirmarCompartir').onclick=async()=>{
                const seccionId=document.getElementById('seccionCompartirDictacion').value;
                const alumnos=Number(document.getElementById('alumnosCompartir').value)||0;
                const ok=await confirmarCambioCritico({
                    titulo:'Compartir asignatura',
                    mensaje:'Otra sección heredará la planificación de esta asignatura.',
                    queHara:`${nombreSeccion(seccionId)} quedará vinculada a ${nombreAsignatura(asignaturaId)} dictada en ${nombreSeccion(seccionMadreId)}.`,
                    afectara:'Grupo de dictación, alumnos vinculados y reportes de fusión.',
                    noTocara:'No duplicará bloques ni cambiará catálogos.',
                    confirmarTexto:'Compartir',
                    peligro:false
                });
                if(!ok) return;
                ctx.crearPuntoRecuperacion?.('antes_compartir_asignatura');
                ctx.pushUndo?.({tipo:'compartir_asignatura',resumen:`Compartir · ${nombreAsignatura(asignaturaId)}`,afecta:`${nombreSeccion(seccionMadreId)} / ${nombreSeccion(seccionId)}`,critica:true});
                agregarAsignaturaSeccion(asignaturaId,seccionId,'manual');
                if(!ctx.vincularSeccionAGrupo?.(grupoId,seccionId,{alumnos})) return ctx.toast('No se pudo compartir la asignatura','error');
                ctx.guardar(); abrirGestionDictacionSeccion(seccionMadreId); ctx.toast('Sección vinculada al grupo','success');
            };
        }

        function abrirModalCarrera(id=null){
            const data = getData();
            const c=id?data.carreras.find(c=>c.id===id):null;
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3>${c?'Editar':'Nueva'} Carrera</h3>
                <div class="form-group">
                    <label class="form-label">Área</label>
                    <input class="form-input" id="areaCarrera" list="areasCarreraList" value="${ctx.escapeAttr(c?areaCarrera(c):'')}" placeholder="Selecciona o escribe un área">
                    <datalist id="areasCarreraList">${areasCarrera().map(a=>`<option value="${ctx.escapeAttr(a)}"></option>`).join('')}</datalist>
                    <small style="color:var(--text-secondary);font-size:0.72rem;">Agrupa carreras en Secciones y Planificación. Si escribes una nueva, quedará disponible para futuros ingresos.</small>
                </div>
                <div class="form-group"><label class="form-label">Código</label><input class="form-input" id="codCarr" value="${ctx.escapeAttr(c?.codigo||'')}"></div>
                <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="nomCarr" value="${ctx.escapeAttr(c?.nombre||'')}"></div>
                <div class="form-group"><label class="form-label">Especialidad</label><select class="form-select" id="especialidadCarrera"><option value="">-- Sin especialidad --</option>${(data.configuracion.especialidades||[]).map(e=>ctx.optionHTML(e,e,c?.especialidad===e)).join('')}</select></div>
                <div class="form-group"><label class="form-label">Tipo</label><select class="form-select" id="tipoCarrera"><option value="Técnico" ${c?.tipo==='Técnico'||!c?.tipo?'selected':''}>Técnico</option><option value="Ingeniería" ${c?.tipo==='Ingeniería'?'selected':''}>Ingeniería</option></select></div>
                <button class="btn btn-primary" id="btnGuardarCarrera">Guardar</button>
            </div></div>`;
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)ctx.cerrarModal();});
            document.getElementById('btnGuardarCarrera').addEventListener('click',()=>guardarCarrera(id));
        }

        function guardarCarrera(id){
            const data = getData();
            const area=document.getElementById('areaCarrera').value.trim(), cod=document.getElementById('codCarr').value.trim(), nom=document.getElementById('nomCarr').value.trim(), esp=document.getElementById('especialidadCarrera').value, tipo=document.getElementById('tipoCarrera').value;
            if(!area) return ctx.toast('El área de carrera es obligatoria','error');
            if(!cod) return ctx.toast('El código de carrera es obligatorio','error');
            if(!nom) return ctx.toast('El nombre de carrera es obligatorio','error');
            const duplicado = data.carreras.find(c=>c.codigo.toLowerCase()===cod.toLowerCase() && c.id!==id);
            if(duplicado) return ctx.toast(`Ya existe una carrera con el código "${cod}"`, 'error');
            if(!Array.isArray(data.configuracion.especialidades)) data.configuracion.especialidades=[];
            if(!data.configuracion.especialidades.some(e=>limpiarClave(e)===limpiarClave(area))) data.configuracion.especialidades.push(area);
            if(id){const c=data.carreras.find(c=>c.id===id);c.codigo=cod;c.nombre=nom;c.area=area;c.especialidad=esp;c.tipo=tipo;} else data.carreras.push({id:ctx.genId(),codigo:cod,nombre:nom,area,especialidad:esp,tipo:tipo});
            ctx.guardar(); ctx.cerrarModal(); ctx.refrescarTodo(); ctx.toast('Carrera guardada','success');
        }

        function abrirModalNivel(carreraId,nivelId=null){
            const data = getData();
            const n=nivelId?data.niveles.find(n=>n.id===nivelId):null;
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3>${n?'Editar':'Nuevo'} Nivel</h3>
                <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="nomNivel" value="${ctx.escapeAttr(n?.nombre||'')}"></div>
                <label class="check-line"><input type="checkbox" id="nivelTieneOnline" ${n?.tieneOnline?'checked':''}> Presenta asignaturas Online</label>
                <button class="btn btn-primary" id="btnGuardarNivel">Guardar</button>
            </div></div>`;
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)ctx.cerrarModal();});
            document.getElementById('btnGuardarNivel').addEventListener('click',()=>guardarNivel(carreraId,nivelId));
        }

        function guardarNivel(carreraId,nivelId){
            const data = getData();
            const nom=document.getElementById('nomNivel').value.trim();
            const tieneOnline=document.getElementById('nivelTieneOnline')?.checked||false;
            if(!nom) return ctx.toast('El nombre del nivel es obligatorio','error');
            const duplicado=data.niveles.find(n=>n.carreraId===carreraId&&n.nombre.toLowerCase()===nom.toLowerCase()&&n.id!==nivelId);
            if(duplicado) return ctx.toast(`Ya existe un nivel "${nom}" en esta carrera`,'error');
            if(nivelId){const n=data.niveles.find(n=>n.id===nivelId);n.nombre=nom;n.tieneOnline=tieneOnline;} else data.niveles.push({id:ctx.genId(),carreraId,nombre:nom,tieneOnline});
            ctx.guardar(); ctx.cerrarModal(); ctx.refrescarTodo(); ctx.toast('Nivel guardado','success');
        }

        function abrirModalSeccion(nivelId,seccionId=null,jornadaSugerida=''){
            const data = getData();
            const s=seccionId?data.secciones.find(s=>s.id===seccionId):null;
            const jornadaActual=s?jornadaSeccion(s):(jornadaSugerida||'diurna');
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3>${s?'Editar':'Nueva'} Sección</h3>
                <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="nomSeccion" value="${ctx.escapeAttr(s?.nombre||'')}" placeholder="Ej: D-IEL-N1-P2-C1"></div>
                <div class="form-group"><label class="form-label">Jornada</label><select class="form-select" id="jornadaSeccion">
                    <option value="diurna" ${jornadaActual==='diurna'?'selected':''}>Día</option>
                    <option value="vespertina" ${jornadaActual==='vespertina'?'selected':''}>Noche</option>
                </select></div>
                <div class="form-group"><label class="form-label">Tipo de sección</label><select class="form-select" id="tipoSeccion">
                    <option value="regular" ${!s?.tipoSeccion||s?.tipoSeccion==='regular'?'selected':''}>Regular</option>
                    <option value="fusionada" ${s?.tipoSeccion==='fusionada'?'selected':''}>Fusionada</option>
                    <option value="equivalente" ${s?.tipoSeccion==='equivalente'?'selected':''}>Equivalente</option>
                    <option value="fusionada-equivalente" ${s?.tipoSeccion==='fusionada-equivalente'?'selected':''}>Fusionada + equivalente</option>
                </select></div>
                <button class="btn btn-primary" id="btnGuardarSeccion">Guardar</button>
            </div></div>`;
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)ctx.cerrarModal();});
            document.getElementById('btnGuardarSeccion').addEventListener('click',()=>guardarSeccion(nivelId,seccionId));
        }

        function guardarSeccion(nivelId,seccionId){
            const data = getData();
            const nom=document.getElementById('nomSeccion').value.trim();
            const tipo=document.getElementById('tipoSeccion')?.value||'regular';
            const jornada=document.getElementById('jornadaSeccion')?.value||jornadaSeccion({nombre:nom});
            if(!nom) return ctx.toast('El nombre de sección es obligatorio','error');
            const duplicado=data.secciones.find(s=>s.nivelId===nivelId&&s.nombre.toLowerCase()===nom.toLowerCase()&&s.id!==seccionId);
            if(duplicado) return ctx.toast(`Ya existe una sección "${nom}" en este nivel`,'error');
            if(seccionId){const s=data.secciones.find(s=>s.id===seccionId);s.nombre=nom;s.tipoSeccion=tipo;s.jornada=jornada;} else data.secciones.push({id:ctx.genId(),nivelId,nombre:nom,tipoSeccion:tipo,jornada});
            ctx.guardar(); ctx.cerrarModal(); ctx.refrescarTodo(); ctx.toast('Sección guardada','success');
        }

        function filasAyudaSecciones(){
            return [
                ['Campo','Qué escribir','Ejemplo','Notas'],
                ['Código carrera','Código único de carrera/plan','IEL-IEL-2','Si ya existe, se actualiza. Evita resumir planes distintos.'],
                ['Nombre carrera','Nombre completo de la carrera','Ingeniería Eléctrica','Se muestra en la pestaña Secciones.'],
                ['Área / especialidad','Área existente en Configuración','Electricidad','Usa una de las áreas listadas en la hoja Áreas. Si no existe, quedará alerta.'],
                ['Tipo carrera','Técnico o Ingeniería','Ingeniería','Solo clasifica visualmente la carrera.'],
                ['Nivel','Semestre o nivel','N1','La app lo asocia a la carrera de la misma fila.'],
                ['Tiene Online','Sí o No','No','Indica si ese nivel posee asignaturas Online. Ayuda a ubicar horas virtuales.'],
                ['Jornada','Día o Noche','Día','Día equivale a diurna; Noche equivale a vespertina.'],
                ['Sección','Código de sección','D-IEL-N1-P2-C1','Opcional. Si está vacío, solo crea carrera y nivel.'],
                ['Tipo sección','regular, fusionada, equivalente o fusionada-equivalente','regular','Permite marcar secciones que heredan o comparten asignaturas.']
            ];
        }

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

        async function crearPlantillaImportacionSecciones(){
            const data=getData();
            const filas=[
                ['Código carrera','Nombre carrera','Área / especialidad','Tipo carrera','Nivel','Tiene Online','Jornada','Sección','Tipo sección'],
                ['IEL-IEL-2','Ingeniería Eléctrica','Electricidad','Ingeniería','N1','No','Día','D-IEL-N1-P2-C1','regular']
            ];
            const areas=[['Área / especialidad'],...(data.configuracion.especialidades||[]).map(e=>[e])];
            const tipos=[
                ['Campo','Valores permitidos'],
                ['Tipo carrera','Técnico, Ingeniería'],
                ['Tiene Online','Sí, No'],
                ['Jornada','Día, Noche'],
                ['Tipo sección','regular, fusionada, equivalente, fusionada-equivalente']
            ];
            if((window.XLSX?.utils?.book_new&&window.XLSX?.writeFile) || (ctx.asegurarXLSX && await ctx.asegurarXLSX() && window.XLSX?.utils?.book_new&&window.XLSX?.writeFile)){
                const wb=window.XLSX.utils.book_new();
                const add=(nombre,matriz,cols=[])=>{
                    const ws=window.XLSX.utils.aoa_to_sheet(matriz);
                    if(cols.length) ws['!cols']=cols.map(w=>({wch:w}));
                    window.XLSX.utils.book_append_sheet(wb,ws,nombre);
                };
                add('Secciones',filas,[18,38,24,16,10,14,12,28,24]);
                add('Areas',areas,[30]);
                add('Criterios',tipos,[22,70]);
                add('Ayuda',filasAyudaSecciones(),[24,42,32,68]);
                window.XLSX.writeFile(wb,'Plantilla_Importacion_Secciones.xlsx',{bookSST:true});
                ctx.toast('Plantilla de secciones descargada','success');
                return;
            }
        }

        function crearPlantillaAlumnosRealesNivel(){
            const data=getData();
            const filas=[['Sede','Institución','Área','Programa Estudio','Código Programa','Plan','Jornada','N1','N2','N3','N4','N5','N6','N7','N8','Observación']];
            const combinaciones=new Map();
            data.carreras.forEach(c=>{
                const niveles=data.niveles.filter(n=>n.carreraId===c.id);
                const jornadas=new Set();
                niveles.forEach(n=>{
                    data.secciones.filter(s=>s.nivelId===n.id).forEach(s=>jornadas.add(jornadaSeccion(s)==='vespertina'?'V':'D'));
                });
                if(!jornadas.size) jornadas.add('D');
                jornadas.forEach(jornada=>{
                    const plan=c.plan||c.codigo||'';
                    const codigoPrograma=c.codigoBase||String(c.codigo||'').split('-')[0]||'';
                    const key=[areaCarrera(c),codigoPrograma,plan,c.nombre,jornada].join('|');
                    if(!combinaciones.has(key)) combinaciones.set(key,{
                        area:areaCarrera(c),
                        codigoPrograma,
                        plan,
                        nombre:c.nombre||'',
                        jornada
                    });
                });
            });
            [...combinaciones.values()]
                .sort((a,b)=>a.area.localeCompare(b.area,undefined,{sensitivity:'base'})||a.nombre.localeCompare(b.nombre,undefined,{sensitivity:'base'})||String(a.plan).localeCompare(String(b.plan),undefined,{numeric:true,sensitivity:'base'})||a.jornada.localeCompare(b.jornada))
                .forEach(x=>filas.push(['','',x.area,x.nombre,x.codigoPrograma,x.plan,x.jornada,'','','','','','','','','']));
            if(filas.length===1) filas.push(['','','','','','','D','','','','','','','','','']);
            const ayuda=[
                ['Campo','Descripción'],
                ['Objetivo','Registrar alumnos reales por carrera/plan/jornada/nivel para comparar contra la proyección del Gestor.'],
                ['N1 a N8','Ingresa números enteros. Si la carrera tiene menos niveles, deja los niveles restantes en blanco o 0.'],
                ['Jornada','D = diurna, V = vespertina.'],
                ['Código Programa','Código corto del programa cuando exista, por ejemplo IEL o FTEI.'],
                ['Plan','Código completo del plan/carrera cargado en la app, por ejemplo IEL-IEL-2. No modificar encabezados.'],
                ['Importante','Este archivo no reemplaza alumnos por asignatura del Gestor; sirve como referencia por nivel para alertas y comparación.']
            ];
            exportarWorkbookCatalogo('Plantilla_Alumnos_Reales_Nivel_O2026.xlsx',[
                {nombre:'Alumnos_Nivel',matriz:filas,cols:[26,14,34,40,16,18,10,8,8,8,8,8,8,8,8,34]},
                {nombre:'Ayuda',matriz:ayuda,cols:[24,96]}
            ]);
        }

        function exportarArchivoSecciones(){
            const data=getData();
            const filas=[['Código carrera','Nombre carrera','Área / especialidad','Tipo carrera','Nivel','Tiene Online','Jornada','Sección','Tipo sección']];
            data.carreras.forEach(c=>{
                const niveles=data.niveles.filter(n=>n.carreraId===c.id).sort(ordenarNivelesDesc);
                if(!niveles.length) filas.push([c.codigo,c.nombre,areaCarrera(c),c.tipo||'', '', '', '', '', '']);
                niveles.forEach(n=>{
                    const secciones=data.secciones.filter(s=>s.nivelId===n.id).sort(ordenarSecciones);
                    if(!secciones.length) filas.push([c.codigo,c.nombre,areaCarrera(c),c.tipo||'',n.nombre,n.tieneOnline?'Sí':'No','','','']);
                    secciones.forEach(s=>filas.push([c.codigo,c.nombre,areaCarrera(c),c.tipo||'',n.nombre,n.tieneOnline?'Sí':'No',etiquetaJornada(jornadaSeccion(s)),s.nombre,s.tipoSeccion||'regular']));
                });
            });
            exportarWorkbookCatalogo('Secciones_exportadas.xlsx',[
                {nombre:'Secciones',matriz:filas,cols:[18,38,24,16,10,14,12,28,24]},
                {nombre:'Areas',matriz:[['Área / especialidad'],...(data.configuracion.especialidades||[]).map(e=>[e])],cols:[30]},
                {nombre:'Criterios',matriz:[['Campo','Valores permitidos'],['Tipo carrera','Técnico, Ingeniería'],['Tiene Online','Sí, No'],['Jornada','Día, Noche'],['Tipo sección','regular, fusionada, equivalente, fusionada-equivalente']],cols:[22,70]},
                {nombre:'Ayuda',matriz:filasAyudaSecciones(),cols:[24,42,32,68]}
            ]);
        }

        function abrirImportacionSecciones(){
            const input=document.getElementById('inputImportarSecciones');
            if(!input) return;
            input.value='';
            input.click();
        }

        async function leerArchivoSecciones(file){
            if(!file) return;
            if(!window.XLSX?.read || !window.XLSX?.utils?.sheet_to_json){
                if(!ctx.asegurarXLSX || !(await ctx.asegurarXLSX()) || !window.XLSX?.read || !window.XLSX?.utils?.sheet_to_json) return;
            }
            const reader=new FileReader();
            reader.onload=(ev)=>{
                try{
                    const wb=window.XLSX.read(ev.target.result,{type:'array'});
                    const sheet=wb.SheetNames.find(n=>limpiarClave(n).includes('seccion'))||wb.SheetNames[0];
                    const rows=window.XLSX.utils.sheet_to_json(wb.Sheets[sheet],{header:1,defval:''});
                    importarSeccionesDesdeFilas(rows);
                }catch(err){
                    console.error(err);
                    ctx.toast('No se pudo leer el archivo de secciones','error');
                }
            };
            reader.readAsArrayBuffer(file);
        }

        function normalizarSiNo(valor){
            const key=limpiarClave(valor);
            return ['si','sí','s','true','1','online'].includes(key);
        }

        function normalizarJornadaImportacion(valor,seccion=''){
            const key=limpiarClave(valor||seccion);
            const nom=String(seccion||'').trim().toUpperCase();
            if(key.includes('noche')||key.includes('vesp')||key.includes('vespert')||nom.startsWith('V-')) return 'vespertina';
            return 'diurna';
        }

        function normalizarTipoSeccionImportacion(valor,seccion=''){
            const key=limpiarClave(valor);
            if(['fusionada-equivalente','fusionada equivalente','fusion equivalente','equivalente fusionada'].includes(key)) return 'fusionada-equivalente';
            if(key.includes('fusion')) return 'fusionada';
            if(key.includes('equiv')||/\(E\)$/i.test(String(seccion||''))) return 'equivalente';
            if(/\(F\)$/i.test(String(seccion||''))) return 'fusionada';
            return 'regular';
        }

        function resolverEspecialidadExistente(valor){
            const txt=capitalizarPalabras(valor);
            if(!txt) return {valor:'',alerta:''};
            const existente=(getData().configuracion.especialidades||[]).find(e=>limpiarClave(e)===limpiarClave(txt));
            return existente?{valor:existente,alerta:''}:{valor:capitalizarPalabras(txt),alerta:''};
        }

        function importarSeccionesDesdeFilas(rows){
            const data=getData();
            if(!Array.isArray(rows)||rows.length<2) return ctx.toast('El archivo no contiene secciones para importar','error');
            const header=(rows[0]||[]).map(h=>limpiarClave(h));
            const mapa={};
            header.forEach((h,i)=>{
                if(['codigo carrera','código carrera','codigo','código'].includes(h)) mapa.codigo=i;
                if(['nombre carrera','carrera','programa'].includes(h)) mapa.nombre=i;
                if(['area / especialidad','área / especialidad','area','área','especialidad'].includes(h)) mapa.especialidad=i;
                if(['tipo carrera','tipo'].includes(h)) mapa.tipoCarrera=i;
                if(['nivel','semestre'].includes(h)) mapa.nivel=i;
                if(['tiene online','online'].includes(h)) mapa.tieneOnline=i;
                if(['jornada'].includes(h)) mapa.jornada=i;
                if(['seccion','sección'].includes(h)) mapa.seccion=i;
                if(['tipo seccion','tipo sección'].includes(h)) mapa.tipoSeccion=i;
            });
            if(mapa.codigo===undefined||mapa.nombre===undefined||mapa.nivel===undefined) return ctx.toast('La plantilla debe incluir Código carrera, Nombre carrera y Nivel','error');
            const carrerasPorCodigo=new Map(data.carreras.map(c=>[limpiarClave(c.codigo),c]));
            const nivelesPorClave=new Map(data.niveles.map(n=>[`${n.carreraId}|${limpiarClave(n.nombre)}`,n]));
            const seccionesPorClave=new Map(data.secciones.map(s=>[`${s.nivelId}|${limpiarClave(s.nombre)}`,s]));
            const resumen={carreras:0,niveles:0,secciones:0,actualizadas:0,omitidas:0,alertas:[]};
            ctx.pushUndo?.();
            rows.slice(1).forEach((row,idx)=>{
                const fila=idx+2;
                const codigo=normalizarTextoImportacion(row[mapa.codigo]).toUpperCase();
                const nombre=capitalizarPalabras(row[mapa.nombre]);
                const nivelNombre=normalizarTextoImportacion(row[mapa.nivel]).toUpperCase().replace(/^(\d+)$/,'N$1');
                if(!codigo&&!nombre&&!nivelNombre) return;
                if(!codigo||!nombre||!nivelNombre){
                    resumen.omitidas++;
                    resumen.alertas.push({fila,item:codigo||nombre||'(sin datos)',detalle:'Fila incompleta',tipo:''});
                    return;
                }
                const esp=resolverEspecialidadExistente(row[mapa.especialidad]);
                const tipoCarrera=capitalizarPalabras(row[mapa.tipoCarrera]||'Técnico');
                let carrera=carrerasPorCodigo.get(limpiarClave(codigo));
                const alertasCarrera=esp.alerta?[`Fila ${fila}: ${esp.alerta}`]:[];
                if(carrera){
                    carrera.codigo=codigo; carrera.nombre=nombre; carrera.tipo=tipoCarrera; carrera.area=esp.valor||carrera.area||carrera.especialidad||'Sin área'; carrera.especialidad=esp.valor||carrera.especialidad||''; carrera.alertasImportacion=alertasCarrera; resumen.actualizadas++;
                }else{
                    carrera={id:ctx.genId(),codigo,nombre,area:esp.valor||'Sin área',especialidad:esp.valor,tipo:tipoCarrera,alertasImportacion:alertasCarrera};
                    data.carreras.push(carrera); carrerasPorCodigo.set(limpiarClave(codigo),carrera); resumen.carreras++;
                }
                if(esp.valor&&!data.configuracion.especialidades.some(e=>limpiarClave(e)===limpiarClave(esp.valor))) data.configuracion.especialidades.push(esp.valor);
                if(alertasCarrera.length) resumen.alertas.push({fila,item:codigo,detalle:alertasCarrera.join(' · '),tipo:'carrera',id:carrera.id});
                const nivelKey=`${carrera.id}|${limpiarClave(nivelNombre)}`;
                let nivel=nivelesPorClave.get(nivelKey);
                const tieneOnline=normalizarSiNo(row[mapa.tieneOnline]);
                if(nivel){ nivel.nombre=nivelNombre; if(tieneOnline) nivel.tieneOnline=true; resumen.actualizadas++; }
                else{
                    nivel={id:ctx.genId(),carreraId:carrera.id,nombre:nivelNombre,tieneOnline,alertasImportacion:[]};
                    data.niveles.push(nivel); nivelesPorClave.set(nivelKey,nivel); resumen.niveles++;
                }
                const seccionNombre=normalizarTextoImportacion(row[mapa.seccion]);
                if(!seccionNombre) return;
                const seccionKey=`${nivel.id}|${limpiarClave(seccionNombre)}`;
                let seccion=seccionesPorClave.get(seccionKey);
                const jornada=normalizarJornadaImportacion(row[mapa.jornada],seccionNombre);
                const tipoSeccion=normalizarTipoSeccionImportacion(row[mapa.tipoSeccion],seccionNombre);
                if(seccion){ seccion.nombre=seccionNombre; seccion.jornada=jornada; seccion.tipoSeccion=tipoSeccion; seccion.alertasImportacion=[]; resumen.actualizadas++; }
                else{
                    seccion={id:ctx.genId(),nivelId:nivel.id,nombre:seccionNombre,jornada,tipoSeccion,alertasImportacion:[]};
                    data.secciones.push(seccion); seccionesPorClave.set(seccionKey,seccion); resumen.secciones++;
                }
            });
            ctx.guardar(); ctx.refrescarTodo(); mostrarResultadoImportacionSecciones(resumen);
        }

        function mostrarResultadoImportacionSecciones(resumen){
            const filas=resumen.alertas.map(a=>`<tr><td>${ctx.escapeHTML(a.fila)}</td><td>${ctx.escapeHTML(a.item)}</td><td>${ctx.escapeHTML(a.detalle)}</td><td>${a.id&&a.tipo==='carrera'?`<button class="btn btn-xs btn-revisar-carrera-importada" data-id="${ctx.escapeAttr(a.id)}">Revisar</button>`:''}</td></tr>`).join('');
            document.getElementById('modalContainer').innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal dashboard-detail-modal">
                    <div class="modal-header"><h3>Importación de secciones</h3><p>Se importaron carreras, niveles y secciones válidas. Revisa las alertas si algún área no coincide.</p></div>
                    <div class="dashboard-detail-summary">
                        <div><span>Carreras</span><strong>${resumen.carreras}</strong></div>
                        <div><span>Niveles</span><strong>${resumen.niveles}</strong></div>
                        <div><span>Secciones</span><strong>${resumen.secciones}</strong></div>
                        <div><span>Alertas</span><strong>${resumen.alertas.length}</strong></div>
                    </div>
                    ${resumen.alertas.length?`<div class="dashboard-detail-table"><table class="report-table"><thead><tr><th>Fila</th><th>Elemento</th><th>Detalle</th><th>Acción</th></tr></thead><tbody>${filas}</tbody></table></div>`:`<p class="dashboard-detail-empty">No se encontraron alertas.</p>`}
                    <div class="modal-actions"><button class="btn" id="cerrarImportacionSecciones">Cerrar</button></div>
                </div></div>`;
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)ctx.cerrarModal();});
            document.getElementById('cerrarImportacionSecciones').addEventListener('click',ctx.cerrarModal);
            document.querySelectorAll('.btn-revisar-carrera-importada').forEach(btn=>btn.addEventListener('click',()=>abrirModalCarrera(btn.dataset.id)));
            ctx.toast(resumen.alertas.length?'Secciones importadas con alertas':'Secciones importadas correctamente',resumen.alertas.length?'warning':'success');
        }

        function abrirModalAsignatura(id=null){
            const data = getData();
            const a=id?data.asignaturas.find(a=>a.id===id):null;
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3>${a?'Editar':'Nueva'} Asignatura</h3>
                <div class="form-group"><label class="form-label">Código</label><input class="form-input" id="codAsig" value="${ctx.escapeAttr(a?.codigo||'')}"></div>
                <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="nomAsig" value="${ctx.escapeAttr(a?.nombre||'')}"></div>
                <div class="form-group"><label class="form-label">Horas totales</label><input class="form-input" type="number" id="hrsTot" value="${a?.horasTotales||72}" step="18"></div>
                <div class="form-group"><label class="form-label">Horas virtuales</label><input class="form-input" type="number" id="hrsVir" value="${a?.horasVirtuales||0}" step="18"></div>
                <div class="config-section subject-criteria-section">
                    <h4>Criterios de planificación</h4>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Área / dependencia</label>${selectCriterioAsignatura('asigArea','area',criterioAsignatura(a,'area','especialidad'))}</div>
                        <div class="form-group"><label class="form-label">Modalidad pedagógica</label>${selectCriterioAsignatura('asigModalidad','modalidad',criterioAsignatura(a,'modalidad','lectiva'))}</div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Condición académica</label>${selectCriterioAsignatura('asigCondicion','condicion',criterioAsignatura(a,'condicion','normal'))}</div>
                        <div class="form-group"><label class="form-label">Distribución preferida</label>${selectCriterioAsignatura('asigDistribucion','distribucion',criterioAsignatura(a,'distribucion','compacta'))}</div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Control horario</label>${selectCriterioAsignatura('asigControlHorario','controlHorario',criterioAsignatura(a,'controlHorario','propio'))}</div>
                        <div class="form-group"><label class="form-label">Preferencia horaria</label>${selectCriterioAsignatura('asigPreferenciaHoraria','preferenciaHoraria',criterioAsignatura(a,'preferenciaHoraria','flexible'))}</div>
                    </div>
                    <p class="criteria-note">Las horas virtuales se tratarán como autoaprendizaje: cuentan para la carga docente y no requieren sala física.</p>
                </div>
                <div class="form-group"><label class="form-label">Salas preferidas</label><div id="chipsSalasAsig" style="margin-bottom:6px;"></div><div class="search-box input-with-clear"><input class="form-input" id="buscarSalaAsig" placeholder="🔍 Buscar sala..." autocomplete="off"><button class="clear-btn" id="clearBuscarSalaAsig">✕</button><ul class="search-results" id="resultadosSalasAsig"></ul></div></div>
                <div class="form-group">
                    <label class="form-label">Softwares requeridos</label>
                    <textarea class="form-input" id="softwaresAsig" rows="2" placeholder="Ej: AutoCAD 2024, MATLAB, Proteus">${ctx.escapeHTML((a?.softwares||[]).join(', '))}</textarea>
                    <p class="criteria-note">Separa cada software con coma. Se usará en reportes por sala/laboratorio; no afecta la planificación.</p>
                </div>
                <div class="form-group"><label class="form-label">Carreras/Niveles donde se dicta</label>
                    <div id="chipsCarrerasNivel" style="margin-bottom:8px;"></div>
                    <div class="search-box input-with-clear"><input class="form-input" id="buscarCarreraNivel" placeholder="🔍 Buscar carrera o nivel..." autocomplete="off"><button class="clear-btn" id="clearBuscarCarreraNivel">✕</button><ul class="search-results" id="resultadosCarreraNivel"></ul></div>
                    <p class="criteria-note">Para electivas, conserva aquí su origen ELEC. Los destinos se administran desde Secciones → Asignaturas.</p>
                </div>
                <button class="btn btn-primary" id="btnGuardarAsignatura">Guardar</button>
            </div></div>`;
            asignaturaTemp={id:a?.id||null, codigo:a?.codigo||'', nombre:a?.nombre||'', horasTotales:a?.horasTotales||72, horasVirtuales:a?.horasVirtuales||0, salas:(a?.salasPreferidas||[]).slice(), relaciones:a?data.asignaturaCarreraNivel.filter(r=>r.asignaturaId===a.id).map(r=>({carreraId:r.carreraId,nivelId:r.nivelId})) : []};
            actualizarChipsCarrerasNivel();
            actualizarChipsSalasAsig();
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)ctx.cerrarModal();});
            document.getElementById('buscarCarreraNivel').addEventListener('input',filtrarCarrerasNivel);
            document.getElementById('buscarCarreraNivel').addEventListener('focus',()=>{if(!document.getElementById('buscarCarreraNivel').value)mostrarOpcionesCarrerasNivel();});
            document.getElementById('clearBuscarCarreraNivel').addEventListener('click',limpiarBusquedaAsignatura);
            document.getElementById('buscarSalaAsig').addEventListener('input',filtrarSalasAsig);
            document.getElementById('buscarSalaAsig').addEventListener('focus',function(){if(!this.value)mostrarOpcionesSalasAsig();});
            document.getElementById('clearBuscarSalaAsig').addEventListener('click',limpiarBusquedaSalaAsig);
            document.getElementById('btnGuardarAsignatura').addEventListener('click',()=>guardarAsignatura(id));
        }

        function actualizarChipsCarrerasNivel(){
            const data = getData();
            const container=document.getElementById('chipsCarrerasNivel'); if(!container) return;
            container.innerHTML=asignaturaTemp.relaciones.map(rel=>{
                const c=data.carreras.find(c=>c.id===rel.carreraId), n=data.niveles.find(n=>n.id===rel.nivelId);
                return `<span class="item-chip">${ctx.escapeHTML(c?.nombre||'?')} - ${ctx.escapeHTML(n?.nombre||'?')} <button class="btn btn-xs btn-eliminar-chip" data-carrera="${ctx.escapeAttr(rel.carreraId)}" data-nivel="${ctx.escapeAttr(rel.nivelId)}">x</button></span>`;
            }).join('');
            container.querySelectorAll('.btn-eliminar-chip').forEach(btn=>btn.addEventListener('click',function(){
                asignaturaTemp.relaciones=asignaturaTemp.relaciones.filter(r=>!(r.carreraId===this.dataset.carrera&&r.nivelId===this.dataset.nivel));
                actualizarChipsCarrerasNivel();
            }));
        }

        function getOpcionesCarrerasNivel(){
            const data = getData();
            const opciones=[];
            data.carreras.forEach(c=>{data.niveles.filter(n=>n.carreraId===c.id).forEach(n=>opciones.push({carreraId:c.id,nivelId:n.id,texto:`${c.nombre} - ${n.nombre}`}));});
            return opciones;
        }

        function elegirCarreraNivel(opcion, input, resultados){
            if(!asignaturaTemp.relaciones.some(r=>r.carreraId===opcion.carreraId&&r.nivelId===opcion.nivelId)){
                asignaturaTemp.relaciones.push({carreraId:opcion.carreraId,nivelId:opcion.nivelId});
                actualizarChipsCarrerasNivel();
            }
            input.value='';
            resultados.classList.remove('show');
            document.getElementById('clearBuscarCarreraNivel').classList.remove('visible');
        }

        function mostrarOpcionesCarrerasNivel(){
            const input=document.getElementById('buscarCarreraNivel'), resultados=document.getElementById('resultadosCarreraNivel');
            resultados.innerHTML='';
            getOpcionesCarrerasNivel().slice(0,10).forEach(o=>{
                const li=document.createElement('li'); li.textContent=o.texto;
                li.addEventListener('click',()=>elegirCarreraNivel(o,input,resultados));
                resultados.appendChild(li);
            });
            resultados.classList.add('show');
        }

        function filtrarCarrerasNivel(){
            const input=document.getElementById('buscarCarreraNivel'), filter=input.value.toLowerCase(), resultados=document.getElementById('resultadosCarreraNivel');
            resultados.innerHTML=''; document.getElementById('clearBuscarCarreraNivel').classList.toggle('visible',input.value.length>0);
            if(!filter){mostrarOpcionesCarrerasNivel(); return;}
            const filtradas=getOpcionesCarrerasNivel().filter(o=>o.texto.toLowerCase().includes(filter));
            if(filtradas.length===0){resultados.classList.remove('show'); return;}
            filtradas.slice(0,10).forEach(o=>{
                const li=document.createElement('li'); li.textContent=o.texto;
                li.addEventListener('click',()=>elegirCarreraNivel(o,input,resultados));
                resultados.appendChild(li);
            });
            resultados.classList.add('show');
        }

        function limpiarBusquedaAsignatura(){
            document.getElementById('buscarCarreraNivel').value='';
            document.getElementById('resultadosCarreraNivel').classList.remove('show');
            document.getElementById('clearBuscarCarreraNivel').classList.remove('visible');
        }

        function actualizarChipsSalasAsig(){
            const data = getData();
            const cont=document.getElementById('chipsSalasAsig'); if(!cont) return;
            cont.innerHTML=asignaturaTemp.salas.map(sid=>{const sala=data.salas.find(x=>x.id===sid); return sala?`<span class="item-chip">${ctx.escapeHTML(sala.nombre)} <button class="btn btn-xs btn-eliminar-chip-sala" data-id="${ctx.escapeAttr(sid)}">x</button></span>`:'';}).join('');
            cont.querySelectorAll('.btn-eliminar-chip-sala').forEach(btn=>btn.addEventListener('click',function(){
                asignaturaTemp.salas=asignaturaTemp.salas.filter(id=>id!==this.dataset.id); actualizarChipsSalasAsig();
            }));
        }

        function elegirSalaAsignatura(sala, input, resultados){
            if(!asignaturaTemp.salas.includes(sala.id)){
                asignaturaTemp.salas.push(sala.id);
                actualizarChipsSalasAsig();
            }
            input.value='';
            resultados.classList.remove('show');
            document.getElementById('clearBuscarSalaAsig').classList.remove('visible');
        }

        function getOpcionesSalasAsignatura(filtro=''){
            const data = getData();
            const filtroLimpio=filtro.toLowerCase();
            return data.salas.filter(s=>!s.esVirtual&&s.id!==ctx.SALA_TRO2_ID&&!asignaturaTemp.salas.includes(s.id)&&(!filtroLimpio||s.nombre.toLowerCase().includes(filtroLimpio)));
        }

        function renderOpcionesSalasAsignatura(opciones, input, resultados){
            resultados.innerHTML=opciones.slice(0,10).map(s=>`<li>${ctx.escapeHTML(s.nombre)}</li>`).join('');
            Array.from(resultados.children).forEach((li,i)=>{
                li.onclick=()=>elegirSalaAsignatura(opciones[i],input,resultados);
            });
            resultados.classList.add('show');
        }

        function mostrarOpcionesSalasAsig(){
            const input=document.getElementById('buscarSalaAsig'), resultados=document.getElementById('resultadosSalasAsig');
            if(!input||!resultados) return;
            renderOpcionesSalasAsignatura(getOpcionesSalasAsignatura(),input,resultados);
        }

        function filtrarSalasAsig(){
            const input=document.getElementById('buscarSalaAsig'), resultados=document.getElementById('resultadosSalasAsig');
            if(!input||!resultados) return;
            const filter=input.value.toLowerCase();
            document.getElementById('clearBuscarSalaAsig').classList.toggle('visible',input.value.length>0);
            if(!filter){mostrarOpcionesSalasAsig();return;}
            const opciones=getOpcionesSalasAsignatura(filter);
            if(!opciones.length){resultados.classList.remove('show');return;}
            renderOpcionesSalasAsignatura(opciones,input,resultados);
        }

        function limpiarBusquedaSalaAsig(){
            document.getElementById('buscarSalaAsig').value='';
            document.getElementById('resultadosSalasAsig').classList.remove('show');
            document.getElementById('clearBuscarSalaAsig').classList.remove('visible');
        }

        function filasAyudaAsignaturas(){
            return [
                ['Campo','Qué escribir','Ejemplo','Notas'],
                ['Código','Código único de la asignatura','EEA401','Se guarda en mayúscula. Si ya existe, se actualiza.'],
                ['Nombre','Nombre completo de la asignatura','Redes Eléctricas I','Se normaliza con primera letra mayúscula.'],
                ['Horas totales','Horas semestrales totales','72','Debe ser múltiplo de 18.'],
                ['Horas virtuales','Horas de autoaprendizaje','18','Puede ser 0. Debe ser múltiplo de 18.'],
                ['Área','especialidad, transversal o electiva','especialidad','Las electivas pueden quedar sin carrera/nivel y asociarse después.'],
                ['Modalidad','lectiva, practica, semipresencial u online-teams','practica','Online y virtual no son lo mismo.'],
                ['Condición','normal, alta-reprobacion, requiere-ayudantia o alta-reprobacion-ayudantia','normal','Permite marcar asignaturas críticas.'],
                ['Distribución','compacta, balanceada, dividida o flexible','compacta','Para 54/72h normalmente conviene compacta.'],
                ['Control horario','propio o coordinacion-externa','propio','Transversales suelen usar coordinacion-externa.'],
                ['Preferencia horaria','flexible, evitar-temprano o proteger-repitentes','flexible','Apoya la autoplanificación.'],
                ['Salas preferidas','Número o nombre de salas separados por coma','315, LAB ELEC 1','La hoja Salas muestra Número, Nombre, Capacidad y Tipo de espacio.'],
                ['Softwares','Programas requeridos separados por coma','AutoCAD 2024, MATLAB, Proteus','Sirve para reportar instalaciones por laboratorio. No afecta la planificación.'],
                ['Carrera','Nombre o código de la carrera','IEL-IEL-2','Puedes escribir el código o el nombre. Si son varias, sepáralas con coma.'],
                ['Nivel','Nivel asociado a la carrera','N1','Si hay varias carreras y todas usan el mismo nivel, escribe un solo nivel.']
            ];
        }

        async function crearPlantillaImportacionAsignaturas(){
            const data=getData();
            const headers=['Código','Nombre','Horas totales','Horas virtuales','Área','Modalidad','Condición','Distribución','Control horario','Preferencia horaria','Salas preferidas','Softwares','Carrera','Nivel'];
            const filas=[
                headers,
                ['EEA401','Redes Eléctricas I',72,0,'especialidad','practica','normal','compacta','propio','flexible','315','AutoCAD 2024, MATLAB','IEL-IEL-2','N1']
            ];
            const carrerasNiveles=[['Carrera','Código carrera','Nivel','Cómo usarlo']];
            data.carreras.forEach(c=>{
                data.niveles.filter(n=>n.carreraId===c.id).sort(ordenarNivelesDesc).forEach(n=>{
                    carrerasNiveles.push([c.nombre,c.codigo,n.nombre,`En Asignaturas puedes escribir Carrera: ${c.codigo} y Nivel: ${n.nombre}`]);
                });
            });
            const salas=[['Número','Nombre','Capacidad','Tipo de espacio'],...data.salas.map(s=>{
                const ref=separarNumeroNombreSala(s.nombre);
                return [ref.numero,ref.nombre,s.capacidad||'',s.tipoSala||'Sala de Clases'];
            })];
            const criterios=[
                ['Tipo','Valores permitidos'],
                ['Área',CRITERIOS_ASIGNATURA.area.join(', ')],
                ['Modalidad',CRITERIOS_ASIGNATURA.modalidad.join(', ')],
                ['Condición',CRITERIOS_ASIGNATURA.condicion.join(', ')],
                ['Distribución',CRITERIOS_ASIGNATURA.distribucion.join(', ')],
                ['Control horario',CRITERIOS_ASIGNATURA.controlHorario.join(', ')],
                ['Preferencia horaria',CRITERIOS_ASIGNATURA.preferenciaHoraria.join(', ')]
            ];
            if((window.XLSX?.utils?.book_new&&window.XLSX?.writeFile) || (ctx.asegurarXLSX && await ctx.asegurarXLSX() && window.XLSX?.utils?.book_new&&window.XLSX?.writeFile)){
                const wb=window.XLSX.utils.book_new();
                const add=(nombre,matriz,cols=[])=>{
                    const ws=window.XLSX.utils.aoa_to_sheet(matriz);
                    if(cols.length) ws['!cols']=cols.map(w=>({wch:w}));
                    window.XLSX.utils.book_append_sheet(wb,ws,nombre);
                };
                add('Asignaturas',filas,[14,36,14,14,16,18,28,18,20,22,28,34,24,12]);
                add('Carreras_Niveles',carrerasNiveles,[38,18,12,72]);
                add('Salas',salas,[14,30,12,32]);
                add('Criterios',criterios,[22,80]);
                add('Ayuda',filasAyudaAsignaturas(),[22,42,36,58]);
                window.XLSX.writeFile(wb,'Plantilla_Importacion_Asignaturas.xlsx',{bookSST:true});
                ctx.toast('Plantilla de asignaturas descargada','success');
                return;
            }
        }

        function exportarArchivoAsignaturas(){
            const data=getData();
            const headers=['Código','Nombre','Horas totales','Horas virtuales','Área','Modalidad','Condición','Distribución','Control horario','Preferencia horaria','Salas preferidas','Softwares','Carrera','Nivel'];
            const filas=[headers];
            data.asignaturas.forEach(a=>{
                const salas=(a.salasPreferidas||[]).map(id=>data.salas.find(s=>s.id===id)?.nombre).filter(Boolean).join(', ');
                const softwares=(a.softwares||[]).join(', ');
                const relaciones=(data.asignaturaCarreraNivel||[]).filter(r=>r.asignaturaId===a.id);
                if(!relaciones.length){
                    filas.push([a.codigo,a.nombre,a.horasTotales||0,a.horasVirtuales||0,a.area||'especialidad',a.modalidad||'lectiva',a.condicion||'normal',a.distribucion||'compacta',a.controlHorario||'propio',a.preferenciaHoraria||'flexible',salas,softwares,'','']);
                    return;
                }
                relaciones.forEach(rel=>{
                    const carrera=data.carreras.find(c=>c.id===rel.carreraId);
                    const nivel=data.niveles.find(n=>n.id===rel.nivelId);
                    filas.push([a.codigo,a.nombre,a.horasTotales||0,a.horasVirtuales||0,a.area||'especialidad',a.modalidad||'lectiva',a.condicion||'normal',a.distribucion||'compacta',a.controlHorario||'propio',a.preferenciaHoraria||'flexible',salas,softwares,carrera?.codigo||'',nivel?.nombre||'']);
                });
            });
            const carrerasNiveles=[['Carrera','Código carrera','Nivel','Cómo usarlo']];
            data.carreras.forEach(c=>data.niveles.filter(n=>n.carreraId===c.id).sort(ordenarNivelesDesc).forEach(n=>carrerasNiveles.push([c.nombre,c.codigo,n.nombre,`En Asignaturas puedes escribir Carrera: ${c.codigo} y Nivel: ${n.nombre}`])));
            const salas=[['Número','Nombre','Capacidad','Tipo de espacio'],...data.salas.map(s=>{const ref=separarNumeroNombreSala(s.nombre); return [ref.numero,ref.nombre,s.capacidad||'',s.tipoSala||'Sala de Clases'];})];
            exportarWorkbookCatalogo('Asignaturas_exportadas.xlsx',[
                {nombre:'Asignaturas',matriz:filas,cols:[14,36,14,14,16,18,28,18,20,22,28,34,24,12]},
                {nombre:'Carreras_Niveles',matriz:carrerasNiveles,cols:[38,18,12,72]},
                {nombre:'Salas',matriz:salas,cols:[14,30,12,32]},
                {nombre:'Criterios',matriz:[['Tipo','Valores permitidos'],['Área',CRITERIOS_ASIGNATURA.area.join(', ')],['Modalidad',CRITERIOS_ASIGNATURA.modalidad.join(', ')],['Condición',CRITERIOS_ASIGNATURA.condicion.join(', ')],['Distribución',CRITERIOS_ASIGNATURA.distribucion.join(', ')],['Control horario',CRITERIOS_ASIGNATURA.controlHorario.join(', ')],['Preferencia horaria',CRITERIOS_ASIGNATURA.preferenciaHoraria.join(', ')]],cols:[22,80]},
                {nombre:'Ayuda',matriz:filasAyudaAsignaturas(),cols:[22,42,36,58]}
            ]);
        }

        function abrirImportacionAsignaturas(){
            const input=document.getElementById('inputImportarAsignaturas');
            if(!input) return;
            input.value='';
            input.click();
        }

        async function leerArchivoAsignaturas(file){
            if(!file) return;
            if(!window.XLSX?.read || !window.XLSX?.utils?.sheet_to_json){
                if(!ctx.asegurarXLSX || !(await ctx.asegurarXLSX()) || !window.XLSX?.read || !window.XLSX?.utils?.sheet_to_json) return;
            }
            const reader=new FileReader();
            reader.onload=(ev)=>{
                try{
                    const wb=window.XLSX.read(ev.target.result,{type:'array'});
                    const sheet=wb.SheetNames.find(n=>limpiarClave(n).includes('asignatura'))||wb.SheetNames[0];
                    const rows=window.XLSX.utils.sheet_to_json(wb.Sheets[sheet],{header:1,defval:''});
                    importarAsignaturasDesdeFilas(rows);
                }catch(err){
                    console.error(err);
                    ctx.toast('No se pudo leer el archivo de asignaturas','error');
                }
            };
            reader.readAsArrayBuffer(file);
        }

        function valorFilaPorMapa(row,mapa,nombres){
            for(const nombre of nombres){
                const idx=mapa[nombre];
                if(idx!==undefined) return row[idx];
            }
            return '';
        }

        function normalizarCriterioAsignatura(valor,campo,defecto){
            const key=limpiarClave(valor);
            if(!key) return defecto;
            const labels=LABEL_CRITERIOS_ASIGNATURA[campo]||{};
            const directo=CRITERIOS_ASIGNATURA[campo].find(v=>limpiarClave(v)===key);
            if(directo) return directo;
            return CRITERIOS_ASIGNATURA[campo].find(v=>limpiarClave(labels[v])===key)||defecto;
        }

        function normalizarNombreAsignatura(valor){
            return capitalizarPalabras(valor);
        }

        function parseListaTexto(valor){
            return normalizarTextoImportacion(valor).split(/[,;\n\r]+/).map(x=>x.trim()).filter(Boolean);
        }

        function normalizarListaSoftwares(valor){
            const vistos=new Set();
            return parseListaTexto(valor)
                .map(x=>x.replace(/\s+/g,' ').trim())
                .filter(Boolean)
                .filter(x=>{
                    const key=limpiarClave(x);
                    if(vistos.has(key)) return false;
                    vistos.add(key);
                    return true;
                });
        }

        function resolverRelacionCarreraNivelSeparada(carreraValor,nivelValor){
            const data=getData();
            const carreraTxt=limpiarClave(carreraValor);
            const nivelTxt=limpiarClave(nivelValor);
            if(!carreraTxt||!nivelTxt) return null;
            const carrera=data.carreras.find(c=>limpiarClave(c.nombre)===carreraTxt||limpiarClave(c.codigo)===carreraTxt||limpiarClave(`${c.nombre} (${c.codigo})`)===carreraTxt);
            if(!carrera) return null;
            const nivel=data.niveles.find(n=>n.carreraId===carrera.id&&(limpiarClave(n.nombre)===nivelTxt||limpiarClave(String(n.nombre).replace(/^n/i,''))===nivelTxt.replace(/^n/,'')));
            return nivel?{carreraId:carrera.id,nivelId:nivel.id}:null;
        }

        function resolverRelacionesDesdeColumnas(carrerasValor,nivelesValor){
            const carreras=parseListaTexto(carrerasValor);
            const niveles=parseListaTexto(nivelesValor);
            const relaciones=[], noEncontradas=[];
            if(!carreras.length&&!niveles.length) return {relaciones,noEncontradas};
            carreras.forEach((carrera,i)=>{
                const nivel=niveles[i]||niveles[0]||'';
                const rel=resolverRelacionCarreraNivelSeparada(carrera,nivel);
                if(rel) relaciones.push(rel);
                else noEncontradas.push([carrera,nivel].filter(Boolean).join(' | ')||carrera||nivel);
            });
            return {relaciones,noEncontradas};
        }

        function separarNumeroNombreSala(valor){
            const txt=normalizarTextoImportacion(valor);
            const partes=txt.split(/\s*-\s*/).filter(Boolean);
            if(partes.length>=2 && /^\d+[A-Z]?$/i.test(partes[0])) return {numero:partes[0].toUpperCase(),nombre:partes.slice(1).join(' - ')};
            if(/^\d+[A-Z]?$/i.test(txt)) return {numero:txt.toUpperCase(),nombre:''};
            return {numero:'',nombre:txt};
        }

        function clavesBusquedaSala(sala){
            const ref=separarNumeroNombreSala(sala.nombre);
            return [sala.nombre,ref.numero,ref.nombre,[ref.numero,ref.nombre].filter(Boolean).join('-')]
                .map(x=>limpiarClave(x))
                .filter(Boolean);
        }

        function importarAsignaturasDesdeFilas(rows){
            const data=getData();
            if(!Array.isArray(rows)||rows.length<2) return ctx.toast('El archivo no contiene asignaturas para importar','error');
            const header=(rows[0]||[]).map(h=>limpiarClave(h));
            const mapa={};
            header.forEach((h,i)=>{
                if(['codigo','código'].includes(h)) mapa.codigo=i;
                if(h==='nombre'||h==='asignatura') mapa.nombre=i;
                if(['horas totales','horas'].includes(h)) mapa.horasTotales=i;
                if(['horas virtuales','virtuales'].includes(h)) mapa.horasVirtuales=i;
                if(['area','área','dependencia'].includes(h)) mapa.area=i;
                if(['modalidad','modalidad pedagogica','modalidad pedagógica'].includes(h)) mapa.modalidad=i;
                if(['condicion','condición'].includes(h)) mapa.condicion=i;
                if(['distribucion','distribución'].includes(h)) mapa.distribucion=i;
                if(['control horario'].includes(h)) mapa.controlHorario=i;
                if(['preferencia horaria'].includes(h)) mapa.preferenciaHoraria=i;
                if(['salas preferidas','salas'].includes(h)) mapa.salas=i;
                if(['softwares','software','programas'].includes(h)) mapa.softwares=i;
                if(['carrera','codigo carrera','código carrera','programa'].includes(h)) mapa.carrera=i;
                if(['nivel','semestre'].includes(h)) mapa.nivel=i;
            });
            if(mapa.codigo===undefined||mapa.nombre===undefined) return ctx.toast('La plantilla debe incluir Código y Nombre','error');
            const asignaturaPorCodigo=new Map(data.asignaturas.map(a=>[String(a.codigo||'').toUpperCase(),a]));
            const salaPorNombre=new Map();
            data.salas.forEach(s=>clavesBusquedaSala(s).forEach(k=>salaPorNombre.set(k,s)));
            const cols=ctx.getColores();
            const resumen={creadas:0,actualizadas:0,relaciones:0,salas:0,omitidas:0,alertas:[]};
            ctx.pushUndo?.();
            rows.slice(1).forEach((row,idx)=>{
                const fila=idx+2;
                const codigo=normalizarTextoImportacion(valorFilaPorMapa(row,mapa,['codigo'])).toUpperCase();
                const nombre=normalizarNombreAsignatura(valorFilaPorMapa(row,mapa,['nombre']));
                if(!codigo&&!nombre) return;
                if(!codigo||!nombre){ resumen.omitidas++; resumen.alertas.push({fila,codigo:codigo||'(sin código)',detalle:'Fila incompleta'}); return; }
                const ht=parseInt(valorFilaPorMapa(row,mapa,['horasTotales']))||0;
                const hv=parseInt(valorFilaPorMapa(row,mapa,['horasVirtuales']))||0;
                if(!ht||ht<=0||ht%18!==0||hv<0||hv%18!==0||hv>ht){
                    resumen.omitidas++;
                    resumen.alertas.push({fila,codigo,detalle:'Horas inválidas'});
                    return;
                }
                const area=normalizarCriterioAsignatura(valorFilaPorMapa(row,mapa,['area']),'area','especialidad');
                const modalidad=normalizarCriterioAsignatura(valorFilaPorMapa(row,mapa,['modalidad']),'modalidad','lectiva');
                const condicion=normalizarCriterioAsignatura(valorFilaPorMapa(row,mapa,['condicion']),'condicion','normal');
                const distribucion=normalizarCriterioAsignatura(valorFilaPorMapa(row,mapa,['distribucion']),'distribucion',area==='transversal'?'balanceada':'compacta');
                const controlHorario=normalizarCriterioAsignatura(valorFilaPorMapa(row,mapa,['controlHorario']),'controlHorario',area==='transversal'?'coordinacion-externa':'propio');
                const preferenciaHoraria=normalizarCriterioAsignatura(valorFilaPorMapa(row,mapa,['preferenciaHoraria']),'preferenciaHoraria','flexible');
                const softwares=normalizarListaSoftwares(valorFilaPorMapa(row,mapa,['softwares']));
                const salas=[], salasNoEncontradas=[];
                parseListaTexto(valorFilaPorMapa(row,mapa,['salas'])).forEach(txt=>{
                    const sala=salaPorNombre.get(limpiarClave(txt));
                    if(sala) salas.push(sala.id);
                    else salasNoEncontradas.push(txt);
                });
                const relaciones=[], relacionesNoEncontradas=[];
                const desdeColumnas=resolverRelacionesDesdeColumnas(valorFilaPorMapa(row,mapa,['carrera']),valorFilaPorMapa(row,mapa,['nivel']));
                relaciones.push(...desdeColumnas.relaciones);
                relacionesNoEncontradas.push(...desdeColumnas.noEncontradas);
                let asig=asignaturaPorCodigo.get(codigo);
                const base={codigo,nombre,horasTotales:ht,horasVirtuales:hv,horasPresenciales:ht-hv,bloquesPresenciales:(ht-hv)/18,bloquesVirtuales:hv/18,salasPreferidas:[...new Set(salas)],softwares,area,modalidad,condicion,distribucion,controlHorario,preferenciaHoraria,alertasImportacion:[...salasNoEncontradas.map(s=>`Fila ${fila}: sala no encontrada: ${s}`),...relacionesNoEncontradas.map(r=>`Fila ${fila}: carrera/nivel no encontrado: ${r}`)]};
                if(asig){
                    Object.assign(asig,base);
                    resumen.actualizadas++;
                }else{
                    asig={id:ctx.genId(),color:ctx.colorAsignaturaPlanhor?.({codigo,nombre})||cols[Math.floor(Math.random()*cols.length)],...base};
                    data.asignaturas.push(asig);
                    asignaturaPorCodigo.set(codigo,asig);
                    resumen.creadas++;
                }
                data.asignaturaCarreraNivel=data.asignaturaCarreraNivel.filter(r=>r.asignaturaId!==asig.id);
                relaciones.forEach(rel=>{
                    if(!data.asignaturaCarreraNivel.some(r=>r.asignaturaId===asig.id&&r.carreraId===rel.carreraId&&r.nivelId===rel.nivelId)){
                        data.asignaturaCarreraNivel.push({asignaturaId:asig.id,carreraId:rel.carreraId,nivelId:rel.nivelId});
                        resumen.relaciones++;
                    }
                });
                resumen.salas+=salas.length;
                if(base.alertasImportacion.length) resumen.alertas.push({fila,codigo,detalle:base.alertasImportacion.join(' · '),asignaturaId:asig.id});
            });
            ctx.guardar();
            ctx.refrescarTodo();
            mostrarResultadoImportacionAsignaturas(resumen);
        }

        function mostrarResultadoImportacionAsignaturas(resumen){
            const filas=resumen.alertas.map(a=>`
                <tr>
                    <td>${ctx.escapeHTML(a.fila)}</td>
                    <td>${ctx.escapeHTML(a.codigo)}</td>
                    <td>${ctx.escapeHTML(a.detalle)}</td>
                    <td>${a.asignaturaId?`<button class="btn btn-xs btn-revisar-asignatura-importada" data-id="${ctx.escapeAttr(a.asignaturaId)}">Revisar</button>`:''}</td>
                </tr>`).join('');
            document.getElementById('modalContainer').innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal dashboard-detail-modal">
                    <div class="modal-header"><h3>Importación de asignaturas</h3><p>Se importó lo válido. Revisa las alertas para corregir escritura o asociaciones.</p></div>
                    <div class="dashboard-detail-summary">
                        <div><span>Creadas</span><strong>${resumen.creadas}</strong></div>
                        <div><span>Actualizadas</span><strong>${resumen.actualizadas}</strong></div>
                        <div><span>Relaciones</span><strong>${resumen.relaciones}</strong></div>
                        <div><span>Alertas</span><strong>${resumen.alertas.length}</strong></div>
                    </div>
                    ${resumen.alertas.length?`<div class="dashboard-detail-table"><table class="report-table"><thead><tr><th>Fila</th><th>Código</th><th>Detalle</th><th>Acción</th></tr></thead><tbody>${filas}</tbody></table></div>`:`<p class="dashboard-detail-empty">No se encontraron alertas.</p>`}
                    <div class="modal-actions"><button class="btn" id="cerrarImportacionAsignaturas">Cerrar</button></div>
                </div></div>`;
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)ctx.cerrarModal();});
            document.getElementById('cerrarImportacionAsignaturas').addEventListener('click',ctx.cerrarModal);
            document.querySelectorAll('.btn-revisar-asignatura-importada').forEach(btn=>btn.addEventListener('click',()=>abrirModalAsignatura(btn.dataset.id)));
            ctx.toast(resumen.alertas.length?'Asignaturas importadas con alertas':'Asignaturas importadas correctamente',resumen.alertas.length?'warning':'success');
        }

        function guardarAsignatura(id){
            const data = getData();
            const cod=document.getElementById('codAsig').value.trim(), nom=document.getElementById('nomAsig').value.trim();
            const ht=parseInt(document.getElementById('hrsTot').value), hv=parseInt(document.getElementById('hrsVir').value);
            if(!cod) return ctx.toast('El código de asignatura es obligatorio','error');
            if(!nom) return ctx.toast('El nombre de asignatura es obligatorio','error');
            if(!ht||ht<=0) return ctx.toast('Las horas totales deben ser un número positivo','error');
            if(isNaN(hv)||hv<0) return ctx.toast('Las horas virtuales no pueden ser negativas','error');
            if(ht%18!==0) return ctx.toast(`Las horas totales (${ht}) deben ser múltiplo de 18`,'error');
            if(hv%18!==0) return ctx.toast(`Las horas virtuales (${hv}) deben ser múltiplo de 18`,'error');
            if(hv>ht) return ctx.toast('Las horas virtuales no pueden superar las horas totales','error');
            const duplicado=data.asignaturas.find(a=>a.codigo.toLowerCase()===cod.toLowerCase()&&a.id!==id);
            if(duplicado) return ctx.toast(`Ya existe una asignatura con el código "${cod}"`,'error');
            const cols=ctx.getColores();
            const existente=id?data.asignaturas.find(a=>a.id===id):null;
            const asig={...(existente||{}),id:id||ctx.genId(),codigo:cod,nombre:nom,horasTotales:ht,horasVirtuales:hv,horasPresenciales:ht-hv,bloquesPresenciales:(ht-hv)/18,bloquesVirtuales:hv/18,salasPreferidas:asignaturaTemp.salas.slice(),color:ctx.colorAsignaturaPlanhor?.({codigo:cod,nombre:nom,id})||existente?.color||cols[Math.floor(Math.random()*cols.length)],
                softwares:normalizarListaSoftwares(document.getElementById('softwaresAsig')?.value||''),
                area:document.getElementById('asigArea').value,
                modalidad:document.getElementById('asigModalidad').value,
                condicion:document.getElementById('asigCondicion').value,
                distribucion:document.getElementById('asigDistribucion').value,
                controlHorario:document.getElementById('asigControlHorario').value,
                preferenciaHoraria:document.getElementById('asigPreferenciaHoraria').value
            };
            delete asig.grupoElectivo;
            delete asig.destinosElectivaIds;
            if(id){const idx=data.asignaturas.findIndex(a=>a.id===id); if(idx>=0) data.asignaturas[idx]=asig;} else data.asignaturas.push(asig);
            if(asig.area!=='electiva'){
                data.vinculosElectivos=(data.vinculosElectivos||[]).filter(v=>v.asignaturaId!==asig.id);
            }
            data.asignaturaCarreraNivel=data.asignaturaCarreraNivel.filter(r=>r.asignaturaId!==asig.id);
            asignaturaTemp.relaciones.forEach(rel=>data.asignaturaCarreraNivel.push({asignaturaId:asig.id,carreraId:rel.carreraId,nivelId:rel.nivelId}));
            ctx.guardar(); ctx.cerrarModal(); ctx.refrescarTodo(); ctx.toast('Asignatura guardada','success');
        }

        function valorOrdenNivel(nombre){
            const m=String(nombre||'').match(/\d+/);
            return m?parseInt(m[0],10):999;
        }

        function renderChipAsignatura(a, metaExtra=''){
            const partes=[];
            if(a.horasPresenciales>0) partes.push(`${a.horasPresenciales}hP`);
            if(a.horasVirtuales>0) partes.push(`${a.horasVirtuales}hV`);
            const etiquetas=[LABEL_CRITERIOS_ASIGNATURA.area[criterioAsignatura(a,'area','especialidad')],LABEL_CRITERIOS_ASIGNATURA.modalidad[criterioAsignatura(a,'modalidad','lectiva')]].filter(Boolean).join(' · ');
            const alerta=a.alertasImportacion?.length?` · ${a.alertasImportacion.length} alerta(s)`:'';
            const soft=(a.softwares||[]).length?` · ${(a.softwares||[]).length} software(s)`:'';
            const vinculos=a.area==='electiva'?(getData().vinculosElectivos||[]).filter(v=>v.asignaturaId===a.id):[];
            const destinos=vinculos.length?` · ${vinculos.length} vínculo(s) electivo(s)`:'';
            return `<span class="item-chip subject-chip" style="background:${ctx.colorAsignaturaPlanhor?.(a)||ctx.colorSeguro(a.color,'var(--planhor-subject-neutral)')}">
                <span class="subject-chip-main">${ctx.escapeHTML(a.codigo)} - ${ctx.escapeHTML(a.nombre)} (${Number(a.horasTotales)||0}h: ${ctx.escapeHTML(partes.join(' + '))})</span>
                <small class="subject-criteria-chip">${ctx.escapeHTML(etiquetas)}${metaExtra?` · ${ctx.escapeHTML(metaExtra)}`:''}${ctx.escapeHTML(destinos)}${ctx.escapeHTML(soft)}${ctx.escapeHTML(alerta)}</small>
                <button class="btn btn-xs btn-editar-asignatura" data-id="${ctx.escapeAttr(a.id)}">✎</button>
                <button class="btn btn-xs btn-eliminar-asignatura" data-id="${ctx.escapeAttr(a.id)}">🗑️</button>
            </span>`;
        }

        function renderPanelAlertasAsignaturas(){
            const data=getData();
            const items=data.asignaturas.filter(a=>Array.isArray(a.alertasImportacion)&&a.alertasImportacion.length);
            if(!items.length) return '';
            return `<div class="import-alert-panel">
                <div class="import-alert-header"><div><strong>Alertas de importación</strong><span>${items.length} asignatura(s) requieren revisión</span></div></div>
                <div class="import-alert-list">
                    ${items.map(a=>`
                        <div class="import-alert-item">
                            <div>
                                <strong>${ctx.escapeHTML(a.codigo)} - ${ctx.escapeHTML(a.nombre)}</strong>
                                <span>${ctx.escapeHTML(a.alertasImportacion.join(' · '))}</span>
                            </div>
                            <button class="btn btn-xs btn-editar-asignatura" data-id="${ctx.escapeAttr(a.id)}">Revisar</button>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

        function renderAsignaturas(){
            const data = getData();
            const cont=document.getElementById('listaAsignaturas');
            if(!cont) return;
            if(!data.asignaturas.length){
                cont.innerHTML='<p class="jornada-empty">Aún no hay asignaturas registradas.</p>';
                return;
            }
            const carreraPorId=new Map(data.carreras.map(c=>[c.id,c]));
            const nivelPorId=new Map(data.niveles.map(n=>[n.id,n]));
            const grupos=new Map();
            const asegurarGrupo=(key,nombre)=>{
                if(!grupos.has(key)) grupos.set(key,{carrera:{nombre},niveles:new Map(),total:0});
                return grupos.get(key);
            };
            const agregarAsignaturaGrupo=(grupo,nivelKey,nivel,a,metaExtra='')=>{
                if(!grupo.niveles.has(nivelKey)) grupo.niveles.set(nivelKey,{nivel,asignaturas:new Map()});
                grupo.niveles.get(nivelKey).asignaturas.set(a.id,{a,metaExtra});
                grupo.total++;
            };
            const asignaturasConRelacion=new Set();
            (data.asignaturaCarreraNivel||[]).forEach(rel=>{
                const a=data.asignaturas.find(x=>x.id===rel.asignaturaId);
                const c=carreraPorId.get(rel.carreraId);
                const n=nivelPorId.get(rel.nivelId);
                if(!a||!c||!n) return;
                asignaturasConRelacion.add(a.id);
                if(criterioAsignatura(a,'area','especialidad')==='electiva'){
                    const grupo=asegurarGrupo('__electivas__','Electivas');
                    agregarAsignaturaGrupo(grupo,n.id,n,a,c.nombre);
                    return;
                }
                const carreraKey=c.id;
                if(!grupos.has(carreraKey)) grupos.set(carreraKey,{carrera:c,niveles:new Map(),total:0});
                const grupo=grupos.get(carreraKey);
                const nivelKey=n.id;
                agregarAsignaturaGrupo(grupo,nivelKey,n,a);
            });
            data.asignaturas.filter(a=>!asignaturasConRelacion.has(a.id)).forEach(a=>{
                if(criterioAsignatura(a,'area','especialidad')==='electiva'){
                    const grupo=asegurarGrupo('__electivas__','Electivas');
                    agregarAsignaturaGrupo(grupo,'__electiva_pendiente__',{nombre:'Pendientes de asociar'},a,'Sin destino');
                    return;
                }
                const grupo=asegurarGrupo('__sin_relacion__','Sin especialidad o nivel asociado');
                agregarAsignaturaGrupo(grupo,'__sin_nivel__',{nombre:'Sin nivel'},a);
            });
            const gruposOrdenados=Array.from(grupos.values()).sort((a,b)=>{
                if(a.carrera.nombre==='Electivas') return -1;
                if(b.carrera.nombre==='Electivas') return 1;
                if(a.carrera.nombre==='Sin especialidad o nivel asociado') return 1;
                if(b.carrera.nombre==='Sin especialidad o nivel asociado') return -1;
                return String(a.carrera.nombre||'').localeCompare(String(b.carrera.nombre||''),'es',{numeric:true});
            });
            const contenido=gruposOrdenados.map(grupo=>{
                const niveles=Array.from(grupo.niveles.values()).sort((a,b)=>valorOrdenNivel(a.nivel.nombre)-valorOrdenNivel(b.nivel.nombre)||String(a.nivel.nombre||'').localeCompare(String(b.nivel.nombre||''),'es',{numeric:true}));
                const totalUnico=new Set(niveles.flatMap(n=>Array.from(n.asignaturas.keys()))).size;
                return `<div class="subject-specialty-group">
                    <div class="subject-specialty-title">
                        <span>${ctx.escapeHTML(grupo.carrera.nombre||'Sin especialidad')}</span>
                        <span>${totalUnico} asignatura(s)</span>
                    </div>
                    <div class="subject-level-list">
                        ${niveles.map(nivel=>{
                            const asignaturas=Array.from(nivel.asignaturas.values()).sort((a,b)=>String(a.a.codigo||'').localeCompare(String(b.a.codigo||''),'es',{numeric:true})||String(a.a.nombre||'').localeCompare(String(b.a.nombre||''),'es',{numeric:true}));
                            return `<div class="subject-level-group">
                                <div class="subject-level-title"><span>${ctx.escapeHTML(nivel.nivel.nombre||'Sin nivel')}</span><span>${asignaturas.length}</span></div>
                                <div class="subject-chip-list">${asignaturas.map(item=>renderChipAsignatura(item.a,item.metaExtra)).join('')}</div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
            }).join('');
            cont.innerHTML=renderPanelAlertasAsignaturas()+contenido;
        }

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

        function abrirModalDocente(id=null){
            const data = getData();
            if(id===ctx.DOCENTE_NN_ID) return ctx.toast('Docente NN es una entidad fija del sistema','info');
            const d=id?data.docentes.find(d=>d.id===id):null;
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal" style="max-width:800px;">
                <h3>${d?'Editar':'Nuevo'} Docente</h3>
                <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="nomDoc" value="${ctx.escapeAttr(d?.nombre||'')}"></div>
                <div class="form-group"><label class="form-label">Apellido</label><input class="form-input" id="apeDoc" value="${ctx.escapeAttr(d?.apellido||'')}"></div>
                <div class="form-group"><label class="form-label">Tipo de contrato</label><select class="form-select" id="tipoContrato"><option value="indefinido" ${d?.tipoContrato==='indefinido'?'selected':''}>Indefinido</option><option value="fijo" ${d?.tipoContrato==='fijo'?'selected':''}>Fijo</option></select></div>
                <div class="form-group"><label class="form-label">Especialidad</label><select class="form-select" id="especialidadDocente"><option value="">-- Sin especialidad --</option>${(data.configuracion.especialidades||[]).map(e=>ctx.optionHTML(e,e,d?.especialidad===e)).join('')}</select></div>
                <div class="form-group"><label class="form-label">Horas homólogo anterior</label><input class="form-input" type="number" id="horasHomologo" value="${d?.horasHomologo||''}" step="18"></div>
                <div class="form-group"><label class="form-label">Asignaturas que dicta</label>
                    <div id="asigsDocente" style="margin-bottom:8px;"></div>
                    <div class="search-box input-with-clear"><input class="form-input" id="buscarAsig" placeholder="🔍 Buscar asignatura..." autocomplete="off"><button class="clear-btn" id="clearBuscarAsig">✕</button><ul class="search-results" id="resultadosAsig"></ul></div>
                    ${d?.asignaturasNoReconocidas?.length?`<p class="import-warning-note">Códigos no reconocidos en la última importación: ${ctx.escapeHTML(d.asignaturasNoReconocidas.join(', '))}</p>`:''}
                </div>
                <div class="form-group"><label class="form-label">Disponibilidad</label>
                    <div class="mini-grid" id="miniGrid"></div>
                    <div style="margin-top:8px;"><button class="btn btn-xs" id="btnSelTodo">Seleccionar todo</button> <button class="btn btn-xs" id="btnLimpiar">Limpiar</button></div>
                </div>
                <div class="form-group"><label><input type="checkbox" id="autorizadoExceder" ${d?.autorizadoExceder?'checked':''}> Autorizado para exceder 850 horas</label></div>
                <button class="btn btn-primary" id="btnGuardarDocente">Guardar</button>
            </div></div>`;
            docenteTemp={id:d?.id||null, nombre:d?.nombre||'', apellido:d?.apellido||'', tipoContrato:d?.tipoContrato||'indefinido', horasHomologo:d?.horasHomologo||0, asignaturas:d?.asignaturasQueDicta?[...d.asignaturasQueDicta]:[], prioridadAsignaturas:Object.assign({}, d?.prioridadAsignaturas||{}), disponibilidad:d?.disponibilidad?d.disponibilidad.map(f=>[...f]):ctx.DIAS.map(()=>Array(18).fill(false)), autorizadoExceder:d?.autorizadoExceder||false};
            renderMiniGrid();
            actualizarChipsAsignaturas();
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)ctx.cerrarModal();});
            document.getElementById('buscarAsig').addEventListener('input',filtrarAsignaturasDocente);
            document.getElementById('buscarAsig').addEventListener('focus',()=>{if(!document.getElementById('buscarAsig').value)mostrarOpcionesAsignaturasDocente();});
            document.getElementById('clearBuscarAsig').addEventListener('click',limpiarBusquedaDocente);
            document.getElementById('btnSelTodo').addEventListener('click',seleccionarTodoDisponibilidad);
            document.getElementById('btnLimpiar').addEventListener('click',limpiarDisponibilidad);
            document.getElementById('btnGuardarDocente').addEventListener('click',()=>guardarDocente(id));
        }

        function actualizarChipsAsignaturas(){
            const data = getData();
            const container=document.getElementById('asigsDocente'); if(!container) return;
            container.innerHTML=docenteTemp.asignaturas.map(aid=>{
                const a=data.asignaturas.find(x=>x.id===aid);
                const prioridad=docenteTemp.prioridadAsignaturas?.[aid]||'apto';
                return a?`<span class="item-chip docente-asignatura-chip">
                    <span>${ctx.escapeHTML(a.codigo)}</span>
                    <select class="form-select prioridad-docente-asig" data-id="${ctx.escapeAttr(aid)}" title="Nivel para auto-planificación">
                        <option value="preferente" ${prioridad==='preferente'?'selected':''}>Preferente</option>
                        <option value="apto" ${prioridad==='apto'?'selected':''}>Apto</option>
                        <option value="apoyo" ${prioridad==='apoyo'?'selected':''}>Apoyo</option>
                    </select>
                    <button class="btn btn-xs btn-eliminar-chip-docente" data-id="${ctx.escapeAttr(aid)}">x</button>
                </span>`:'';
            }).join('');
            container.querySelectorAll('.prioridad-docente-asig').forEach(sel=>sel.addEventListener('change',function(){
                docenteTemp.prioridadAsignaturas=docenteTemp.prioridadAsignaturas||{};
                docenteTemp.prioridadAsignaturas[this.dataset.id]=this.value;
            }));
            container.querySelectorAll('.btn-eliminar-chip-docente').forEach(btn=>btn.addEventListener('click',function(){
                docenteTemp.asignaturas=docenteTemp.asignaturas.filter(id=>id!==this.dataset.id);
                if(docenteTemp.prioridadAsignaturas) delete docenteTemp.prioridadAsignaturas[this.dataset.id];
                actualizarChipsAsignaturas();
            }));
        }

        function mostrarOpcionesAsignaturasDocente(){
            const data = getData();
            const resultados=document.getElementById('resultadosAsig'); resultados.innerHTML='';
            data.asignaturas.slice(0,10).forEach(a=>{
                const li=document.createElement('li'); li.textContent=`${a.codigo} - ${a.nombre}`;
                li.addEventListener('click',()=>{
                    if(!docenteTemp.asignaturas.includes(a.id)){docenteTemp.asignaturas.push(a.id); docenteTemp.prioridadAsignaturas[a.id]='apto'; actualizarChipsAsignaturas();}
                    document.getElementById('buscarAsig').value=''; resultados.classList.remove('show'); document.getElementById('clearBuscarAsig').classList.remove('visible');
                });
                resultados.appendChild(li);
            });
            resultados.classList.add('show');
        }

        function filtrarAsignaturasDocente(){
            const data = getData();
            const input=document.getElementById('buscarAsig'), filter=input.value.toLowerCase(), resultados=document.getElementById('resultadosAsig');
            resultados.innerHTML=''; document.getElementById('clearBuscarAsig').classList.toggle('visible',input.value.length>0);
            if(!filter){mostrarOpcionesAsignaturasDocente();return;}
            const filtradas=data.asignaturas.filter(a=>a.codigo.toLowerCase().includes(filter)||a.nombre.toLowerCase().includes(filter));
            if(filtradas.length===0){resultados.classList.remove('show');return;}
            filtradas.slice(0,10).forEach(a=>{
                const li=document.createElement('li'); li.textContent=`${a.codigo} - ${a.nombre}`;
                li.addEventListener('click',()=>{
                    if(!docenteTemp.asignaturas.includes(a.id)){docenteTemp.asignaturas.push(a.id); docenteTemp.prioridadAsignaturas[a.id]='apto'; actualizarChipsAsignaturas();}
                    input.value=''; resultados.classList.remove('show'); document.getElementById('clearBuscarAsig').classList.remove('visible');
                });
                resultados.appendChild(li);
            });
            resultados.classList.add('show');
        }

        function limpiarBusquedaDocente(){
            document.getElementById('buscarAsig').value='';
            document.getElementById('resultadosAsig').classList.remove('show');
            document.getElementById('clearBuscarAsig').classList.remove('visible');
        }

        function renderMiniGrid(){
            const grid=document.getElementById('miniGrid'); if(!grid) return;
            grid.innerHTML=''; const header=document.createElement('div'); header.className='mini-cell'; header.textContent='Bloque'; grid.appendChild(header);
            ctx.DIAS.forEach(d=>{const h=document.createElement('div'); h.className='mini-cell'; h.textContent=d; grid.appendChild(h);});
            ctx.BLOQUES.forEach((b,bi)=>{
                const time=document.createElement('div'); time.className='mini-cell'; time.textContent=`B${b.n}`; grid.appendChild(time);
                ctx.DIAS.forEach((d,di)=>{
                    const cell=document.createElement('div'); cell.className='mini-cell'; cell.dataset.dia=di; cell.dataset.bloque=bi;
                    if(docenteTemp.disponibilidad[di][bi]) cell.classList.add('disponible');
                    grid.appendChild(cell);
                });
            });
            let isDown=false, startEstado=false;
            grid.addEventListener('mousedown',(e)=>{
                const cell=e.target.closest('.mini-cell'); if(!cell||cell.cellIndex===0) return; e.preventDefault();
                isDown=true; const dia=parseInt(cell.dataset.dia),bloque=parseInt(cell.dataset.bloque);
                startEstado=!docenteTemp.disponibilidad[dia][bloque];
                docenteTemp.disponibilidad[dia][bloque]=startEstado; cell.classList.toggle('disponible',startEstado);
            });
            grid.addEventListener('mousemove',(e)=>{
                if(!isDown) return;
                const cell=e.target.closest('.mini-cell'); if(!cell||cell.cellIndex===0) return;
                const dia=parseInt(cell.dataset.dia),bloque=parseInt(cell.dataset.bloque);
                docenteTemp.disponibilidad[dia][bloque]=startEstado; cell.classList.toggle('disponible',startEstado);
            });
            grid.addEventListener('mouseup',()=>{isDown=false;});
            grid.addEventListener('mouseleave',()=>{isDown=false;});
            grid.addEventListener('click',(e)=>{
                if(e.shiftKey && lastMiniCell){
                    const cell=e.target.closest('.mini-cell'); if(!cell||cell.cellIndex===0) return;
                    const col1=parseInt(cell.dataset.dia),row1=parseInt(cell.dataset.bloque);
                    const col2=lastMiniCell.col,row2=lastMiniCell.row;
                    const minCol=Math.min(col1,col2),maxCol=Math.max(col1,col2),minRow=Math.min(row1,row2),maxRow=Math.max(row1,row2);
                    const estado=!docenteTemp.disponibilidad[col1][row1];
                    for(let c=minCol;c<=maxCol;c++) for(let r=minRow;r<=maxRow;r++) docenteTemp.disponibilidad[c][r]=estado;
                    renderMiniGrid();
                }
                const cell=e.target.closest('.mini-cell');
                if(cell&&cell.cellIndex>0) lastMiniCell={col:parseInt(cell.dataset.dia),row:parseInt(cell.dataset.bloque)};
            });
        }

        function seleccionarTodoDisponibilidad(){docenteTemp.disponibilidad=ctx.DIAS.map(()=>Array(18).fill(true)); renderMiniGrid();}
        function limpiarDisponibilidad(){docenteTemp.disponibilidad=ctx.DIAS.map(()=>Array(18).fill(false)); renderMiniGrid();}

        function normalizarTextoImportacion(valor){
            return String(valor??'').trim();
        }

        function capitalizarPalabras(valor){
            const minusculas=new Set(['de','del','la','las','los','y','e']);
            return normalizarTextoImportacion(valor)
                .toLowerCase()
                .replace(/\s+/g,' ')
                .split(' ')
                .filter(Boolean)
                .map((palabra,i)=>{
                    if(i>0 && minusculas.has(palabra)) return palabra;
                    return palabra.split('-').map(p=>p?p.charAt(0).toUpperCase()+p.slice(1):p).join('-');
                })
                .join(' ');
        }

        function normalizarEspecialidadImportacion(valor){
            const texto=capitalizarPalabras(valor);
            if(!texto) return '';
            const data=getData();
            const existente=(data.configuracion.especialidades||[]).find(e=>String(e||'').toLowerCase()===texto.toLowerCase());
            return existente||texto;
        }

        function normalizarTipoContratoImportacion(valor){
            const texto=normalizarTextoImportacion(valor).toLowerCase();
            if(!texto) return 'indefinido';
            if(['indefinido','indefinida','planta'].includes(texto)) return 'indefinido';
            if(['fijo','fija','plazo fijo','contrato fijo'].includes(texto)) return 'fijo';
            return texto;
        }

        function claveDocente(nombre,apellido){
            return `${normalizarTextoImportacion(nombre).toLowerCase()}|${normalizarTextoImportacion(apellido).toLowerCase()}`;
        }

        function codigosAsignaturasTexto(valor){
            return normalizarTextoImportacion(valor)
                .split(/[,;|\n\r]+/)
                .map(x=>x.trim().toUpperCase())
                .filter(Boolean);
        }

        async function crearPlantillaImportacionDocentes(){
            const data=getData();
            const headers=['Nombre','Apellido','Especialidad','Tipo contrato','Horas homólogo','Asignaturas que dicta'];
            const filas=[
                headers,
                ['Docente','Referencia','Electricidad','indefinido',720,'EEA401, EEA402, ELAR31']
            ];
            if((window.XLSX?.utils?.book_new&&window.XLSX?.writeFile) || (ctx.asegurarXLSX && await ctx.asegurarXLSX() && window.XLSX?.utils?.book_new&&window.XLSX?.writeFile)){
                const wb=window.XLSX.utils.book_new();
                const add=(nombre,matriz,cols=[])=>{
                    const ws=window.XLSX.utils.aoa_to_sheet(matriz);
                    if(cols.length) ws['!cols']=cols.map(w=>({wch:w}));
                    window.XLSX.utils.book_append_sheet(wb,ws,nombre);
                };
                add('Docentes',filas,[18,18,24,16,16,44]);
                add('Ayuda',[
                    ['Campo','Qué escribir','Ejemplo','Notas'],
                    ['Nombre','Nombre del docente','docente','La app lo corrige a Docente.'],
                    ['Apellido','Apellido del docente','referencia','La app lo corrige a Referencia.'],
                    ['Especialidad','Una de las especialidades configuradas','Electricidad','Si coincide en minúsculas/mayúsculas, usa la versión de la app.'],
                    ['Tipo contrato','indefinido o fijo','indefinido','También acepta planta, fija o plazo fijo.'],
                    ['Horas homólogo','Horas semestrales referenciales','720','Debe ser número.'],
                    ['Asignaturas que dicta','Códigos separados por coma','EEA401, EEA402','Deben existir previamente en la app.']
                ],[22,42,34,58]);
                add('Especialidades',[['Especialidad'],...(data.configuracion.especialidades||[]).map(e=>[e])],[28]);
                add('Asignaturas',[['Código','Asignatura'],...data.asignaturas.map(a=>[a.codigo,a.nombre])],[18,44]);
                add('Contratos',[['Valor permitido'],['indefinido'],['fijo']],[18]);
                window.XLSX.writeFile(wb,'Plantilla_Importacion_Docentes.xlsx',{bookSST:true});
                ctx.toast('Plantilla de docentes descargada','success');
                return;
            }
            const tabla=`<table>${filas.map(f=>`<tr>${f.map(c=>`<td>${ctx.escapeHTML(c)}</td>`).join('')}</tr>`).join('')}</table>`;
            const blob=new Blob([`<html><head><meta charset="UTF-8"></head><body>${tabla}</body></html>`],{type:'application/vnd.ms-excel;charset=utf-8;'});
            const a=document.createElement('a');
            a.href=URL.createObjectURL(blob);
            a.download='Plantilla_Importacion_Docentes.xls';
            a.click();
            URL.revokeObjectURL(a.href);
            ctx.toast('Plantilla de docentes descargada','success');
        }

        function exportarArchivoDocentes(){
            const data=getData();
            const filas=[['Nombre','Apellido','Especialidad','Tipo contrato','Horas homólogo','Asignaturas que dicta']];
            data.docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID).forEach(d=>{
                const codigos=(d.asignaturasQueDicta||[]).map(id=>data.asignaturas.find(a=>a.id===id)?.codigo).filter(Boolean).join(', ');
                filas.push([d.nombre,d.apellido,d.especialidad||'',d.tipoContrato||'indefinido',d.horasHomologo||0,codigos]);
            });
            exportarWorkbookCatalogo('Docentes_exportados.xlsx',[
                {nombre:'Docentes',matriz:filas,cols:[18,18,24,16,16,44]},
                {nombre:'Ayuda',matriz:[
                    ['Campo','Qué escribir','Ejemplo','Notas'],
                    ['Nombre','Nombre del docente','docente','La app lo corrige a Docente.'],
                    ['Apellido','Apellido del docente','referencia','La app lo corrige a Referencia.'],
                    ['Especialidad','Una de las especialidades configuradas','Electricidad','Si coincide en minúsculas/mayúsculas, usa la versión de la app.'],
                    ['Tipo contrato','indefinido o fijo','indefinido','También acepta planta, fija o plazo fijo.'],
                    ['Horas homólogo','Horas semestrales referenciales','720','Debe ser número.'],
                    ['Asignaturas que dicta','Códigos separados por coma','EEA401, EEA402','Deben existir previamente en la app.']
                ],cols:[22,42,34,58]},
                {nombre:'Especialidades',matriz:[['Especialidad'],...(data.configuracion.especialidades||[]).map(e=>[e])],cols:[28]},
                {nombre:'Asignaturas',matriz:[['Código','Asignatura'],...data.asignaturas.map(a=>[a.codigo,a.nombre])],cols:[18,44]},
                {nombre:'Contratos',matriz:[['Valor permitido'],['indefinido'],['fijo']],cols:[18]}
            ]);
        }

        function valorFilaDocente(row, mapa, nombres){
            for(const nombre of nombres){
                const idx=mapa[nombre];
                if(idx!==undefined) return row[idx];
            }
            return '';
        }

        function abrirImportacionDocentes(){
            const input=document.getElementById('inputImportarDocentes');
            if(!input) return;
            input.value='';
            input.click();
        }

        async function leerArchivoDocentes(file){
            if(!file) return;
            if(!window.XLSX?.read || !window.XLSX?.utils?.sheet_to_json){
                if(!ctx.asegurarXLSX || !(await ctx.asegurarXLSX()) || !window.XLSX?.read || !window.XLSX?.utils?.sheet_to_json) return;
            }
            const reader=new FileReader();
            reader.onload=(ev)=>{
                try{
                    const wb=window.XLSX.read(ev.target.result,{type:'array'});
                    const sheet=wb.SheetNames[0];
                    const rows=window.XLSX.utils.sheet_to_json(wb.Sheets[sheet],{header:1,defval:''});
                    importarDocentesDesdeFilas(rows);
                }catch(err){
                    console.error(err);
                    ctx.toast('No se pudo leer el archivo de docentes','error');
                }
            };
            reader.readAsArrayBuffer(file);
        }

        function importarDocentesDesdeFilas(rows){
            const data=getData();
            if(!Array.isArray(rows)||rows.length<2) return ctx.toast('El archivo no contiene docentes para importar','error');
            const header=(rows[0]||[]).map(h=>normalizarTextoImportacion(h).toLowerCase());
            const mapa={};
            header.forEach((h,i)=>{
                if(['nombre','nombres'].includes(h)) mapa.nombre=i;
                if(['apellido','apellidos'].includes(h)) mapa.apellido=i;
                if(h==='especialidad') mapa.especialidad=i;
                if(['tipo contrato','tipo de contrato','contrato'].includes(h)) mapa.tipoContrato=i;
                if(['horas homólogo','horas homologó','horas homologo','horas'].includes(h)) mapa.horasHomologo=i;
                if(['asignaturas que dicta','asignaturas','codigos asignaturas','códigos asignaturas'].includes(h)) mapa.asignaturas=i;
            });
            if(mapa.nombre===undefined||mapa.apellido===undefined) return ctx.toast('La plantilla debe incluir Nombre y Apellido','error');
            const asignaturaPorCodigo=new Map(data.asignaturas.map(a=>[String(a.codigo||'').toUpperCase(),a]));
            const docentesPorClave=new Map(data.docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID).map(d=>[claveDocente(d.nombre,d.apellido),d]));
            const resumen={creados:0,actualizados:0,asociaciones:0,omitidos:0,alertas:[]};
            ctx.pushUndo?.();
            rows.slice(1).forEach((row,idx)=>{
                const nombre=capitalizarPalabras(valorFilaDocente(row,mapa,['nombre']));
                const apellido=capitalizarPalabras(valorFilaDocente(row,mapa,['apellido']));
                if(!nombre&&!apellido) return;
                if(!nombre||!apellido){
                    resumen.omitidos++;
                    resumen.alertas.push({fila:idx+2,nombre:nombre||'(sin nombre)',apellido:apellido||'(sin apellido)',codigos:['Fila incompleta'],docenteId:null});
                    return;
                }
                const especialidad=normalizarEspecialidadImportacion(valorFilaDocente(row,mapa,['especialidad']));
                const tipoContrato=normalizarTipoContratoImportacion(valorFilaDocente(row,mapa,['tipoContrato']));
                const horasHomologo=parseInt(valorFilaDocente(row,mapa,['horasHomologo']))||0;
                const codigos=codigosAsignaturasTexto(valorFilaDocente(row,mapa,['asignaturas']));
                const asignaturasIds=[];
                const prioridadAsignaturas={};
                const noReconocidas=[];
                codigos.forEach(codigo=>{
                    const a=asignaturaPorCodigo.get(codigo);
                    if(a){
                        asignaturasIds.push(a.id);
                        prioridadAsignaturas[a.id]='apto';
                    }else{
                        noReconocidas.push(codigo);
                    }
                });
                const key=claveDocente(nombre,apellido);
                let docente=docentesPorClave.get(key);
                const asignaturasUnicas=[...new Set(asignaturasIds)];
                if(docente){
                    docente.nombre=nombre;
                    docente.apellido=apellido;
                    docente.especialidad=especialidad;
                    docente.tipoContrato=tipoContrato;
                    docente.horasHomologo=horasHomologo;
                    docente.asignaturasQueDicta=[...new Set([...(docente.asignaturasQueDicta||[]),...asignaturasUnicas])];
                    docente.prioridadAsignaturas=Object.assign({}, docente.prioridadAsignaturas||{});
                    asignaturasUnicas.forEach(id=>{ if(!docente.prioridadAsignaturas[id]) docente.prioridadAsignaturas[id]='apto'; });
                    docente.asignaturasNoReconocidas=noReconocidas;
                    docente.alertasImportacion=noReconocidas.map(c=>`Fila ${idx+2}: asignatura no encontrada: ${c}`);
                    resumen.actualizados++;
                }else{
                    docente={
                        id:ctx.genId(),
                        nombre,
                        apellido,
                        tipoContrato,
                        especialidad,
                        horasHomologo,
                        asignaturasQueDicta:asignaturasUnicas,
                        prioridadAsignaturas,
                        disponibilidad:ctx.DIAS.map(()=>Array(18).fill(false)),
                        autorizadoExceder:false,
                        asignaturasNoReconocidas:noReconocidas,
                        alertasImportacion:noReconocidas.map(c=>`Fila ${idx+2}: asignatura no encontrada: ${c}`)
                    };
                    data.docentes.push(docente);
                    docentesPorClave.set(key,docente);
                    resumen.creados++;
                }
                resumen.asociaciones+=asignaturasUnicas.length;
                if(noReconocidas.length) resumen.alertas.push({fila:idx+2,nombre,apellido,codigos:noReconocidas,docenteId:docente.id});
            });
            ctx.guardar();
            ctx.refrescarTodo();
            mostrarResultadoImportacionDocentes(resumen);
        }

        function mostrarResultadoImportacionDocentes(resumen){
            const filas=resumen.alertas.map(a=>`
                <tr>
                    <td>${ctx.escapeHTML(a.fila)}</td>
                    <td>${ctx.escapeHTML(`${a.nombre} ${a.apellido}`)}</td>
                    <td>${ctx.escapeHTML(a.codigos.join(', '))}</td>
                    <td>${a.docenteId?`<button class="btn btn-xs btn-revisar-docente-importado" data-id="${ctx.escapeAttr(a.docenteId)}">Revisar</button>`:''}</td>
                </tr>`).join('');
            document.getElementById('modalContainer').innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal dashboard-detail-modal">
                    <div class="modal-header">
                        <h3>Importación de docentes</h3>
                        <p>Se importó lo válido. Revisa solo los códigos de asignatura que no fueron reconocidos.</p>
                    </div>
                    <div class="dashboard-detail-summary">
                        <div><span>Creados</span><strong>${resumen.creados}</strong></div>
                        <div><span>Actualizados</span><strong>${resumen.actualizados}</strong></div>
                        <div><span>Asignaturas asociadas</span><strong>${resumen.asociaciones}</strong></div>
                        <div><span>Alertas</span><strong>${resumen.alertas.length}</strong></div>
                    </div>
                    ${resumen.alertas.length?`
                    <div class="dashboard-detail-table">
                        <table class="report-table">
                            <thead><tr><th>Fila</th><th>Docente</th><th>Códigos no encontrados</th><th>Acción</th></tr></thead>
                            <tbody>${filas}</tbody>
                        </table>
                    </div>`:`<p class="dashboard-detail-empty">No se encontraron errores de códigos.</p>`}
                    <div class="modal-actions"><button class="btn" id="cerrarImportacionDocentes">Cerrar</button></div>
                </div></div>`;
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)ctx.cerrarModal();});
            document.getElementById('cerrarImportacionDocentes').addEventListener('click',ctx.cerrarModal);
            document.querySelectorAll('.btn-revisar-docente-importado').forEach(btn=>btn.addEventListener('click',()=>abrirModalDocente(btn.dataset.id)));
            ctx.toast(resumen.alertas.length?'Docentes importados con alertas':'Docentes importados correctamente',resumen.alertas.length?'warning':'success');
        }

        function guardarDocente(id){
            const data = getData();
            if(id===ctx.DOCENTE_NN_ID) return ctx.toast('Docente NN no se edita manualmente','info');
            const nom=document.getElementById('nomDoc').value.trim(), ape=document.getElementById('apeDoc').value.trim();
            if(!nom) return ctx.toast('El nombre del docente es obligatorio','error');
            if(!ape) return ctx.toast('El apellido del docente es obligatorio','error');
            const tipoContrato=document.getElementById('tipoContrato').value;
            const especialidad=document.getElementById('especialidadDocente').value;
            const horasHomologo=parseInt(document.getElementById('horasHomologo').value)||0;
            if(horasHomologo<0) return ctx.toast('Las horas homólogo no pueden ser negativas','error');
            if(horasHomologo%18!==0) return ctx.toast(`Las horas homólogo (${horasHomologo}) deben ser múltiplo de 18`,'error');
            const autorizadoExceder=document.getElementById('autorizadoExceder').checked;
            const prioridadAsignaturas={};
            docenteTemp.asignaturas.forEach(aid=>prioridadAsignaturas[aid]=docenteTemp.prioridadAsignaturas?.[aid]||'apto');
            const docente={id:id||ctx.genId(),nombre:nom,apellido:ape,tipoContrato,especialidad,horasHomologo,asignaturasQueDicta:[...docenteTemp.asignaturas],prioridadAsignaturas,disponibilidad:docenteTemp.disponibilidad.map(f=>[...f]),autorizadoExceder,asignaturasNoReconocidas:[],alertasImportacion:[]};
            if(id){const idx=data.docentes.findIndex(d=>d.id===id); if(idx>=0) data.docentes[idx]=docente;} else data.docentes.push(docente);
            ctx.guardar(); ctx.cerrarModal(); ctx.refrescarTodo(); ctx.toast('Docente guardado','success');
        }

        function renderPanelAlertasDocentes(){
            const data=getData();
            const items=data.docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID&&((Array.isArray(d.alertasImportacion)&&d.alertasImportacion.length)||(Array.isArray(d.asignaturasNoReconocidas)&&d.asignaturasNoReconocidas.length)));
            if(!items.length) return '';
            return `<div class="import-alert-panel">
                <div class="import-alert-header"><div><strong>Alertas de importación</strong><span>${items.length} docente(s) requieren revisión</span></div></div>
                <div class="import-alert-list">
                    ${items.map(d=>{
                        const detalle=(d.alertasImportacion?.length?d.alertasImportacion:d.asignaturasNoReconocidas.map(c=>`Asignatura no encontrada: ${c}`)).join(' · ');
                        return `<div class="import-alert-item">
                            <div>
                                <strong>${ctx.escapeHTML(`${d.nombre} ${d.apellido}`)}</strong>
                                <span>${ctx.escapeHTML(detalle)}</span>
                            </div>
                            <button class="btn btn-xs btn-editar-docente" data-id="${ctx.escapeAttr(d.id)}">Revisar</button>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }

        function renderDocentes(){
            const data = getData();
            const contadorDocente = ctx.getContadorDocente();
            const filtro=document.getElementById('docentesFiltroEspecialidad')?.value||'';
            const filtroEl=document.getElementById('docentesFiltroEspecialidad');
            if(filtroEl){
                const actual=filtroEl.value;
                const especialidades=[...new Set(data.docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID).map(d=>d.especialidad||'Sin especialidad'))].sort((a,b)=>a.localeCompare(b));
                filtroEl.innerHTML='<option value="">Todas las especialidades</option>'+especialidades.map(e=>ctx.optionHTML(e,e,actual===e)).join('');
                if(actual && especialidades.includes(actual)) filtroEl.value=actual;
            }
            const docentes=data.docentes
                .filter(d=>!filtro || (d.especialidad||'Sin especialidad')===filtro)
                .sort((a,b)=>String(a.especialidad||'Sin especialidad').localeCompare(String(b.especialidad||'Sin especialidad'))||String(a.apellido||'').localeCompare(String(b.apellido||'')));
            const chipDocente=(d)=>{
                const usados=contadorDocente[d.id]||0;
                if(d.id===ctx.DOCENTE_NN_ID) return `<span class="item-chip docente-nn-chip">${ctx.escapeHTML(d.nombre)} ${ctx.escapeHTML(d.apellido)} <small>[Pendiente]</small> (${usados} bloque(s))</span>`;
                const espColor=d.especialidad?ctx.getEspColor()[d.especialidad]||'':'';
                const alerta=d.asignaturasNoReconocidas?.length?` <small class="import-warning-chip">${d.asignaturasNoReconocidas.length} código(s) por revisar</small>`:'';
                return `<span class="item-chip" ${espColor?`style="background:${ctx.colorSeguro(espColor,'#fff')}"`:''}>${ctx.escapeHTML(d.nombre)} ${ctx.escapeHTML(d.apellido)}${d.especialidad?` <small style="font-size:0.65rem;color:var(--text-secondary)">[${ctx.escapeHTML(d.especialidad)}]</small>`:''}${alerta} (${usados}/${data.configuracion.bloquesSemestralesMax} · ${usados*18}h) <button class="btn btn-xs btn-editar-docente" data-id="${ctx.escapeAttr(d.id)}">✎</button> <button class="btn btn-xs btn-eliminar-docente" data-id="${ctx.escapeAttr(d.id)}">🗑️</button></span>`;
            };
            const grupos=new Map();
            docentes.forEach(d=>{
                const key=d.id===ctx.DOCENTE_NN_ID?'Pendientes':(d.especialidad||'Sin especialidad');
                if(!grupos.has(key)) grupos.set(key,[]);
                grupos.get(key).push(d);
            });
            const contenido=grupos.size?Array.from(grupos.entries()).map(([esp,items])=>`
                <div class="docentes-specialty-group">
                    <div class="docentes-specialty-title"><span>${ctx.escapeHTML(esp)}</span><span>${items.length} docente(s)</span></div>
                    <div class="docentes-specialty-list">${items.map(chipDocente).join('')}</div>
                </div>
            `).join(''):'<p class="auto-plan-empty">No hay docentes para esta especialidad.</p>';
            document.getElementById('listaDocentes').innerHTML=renderPanelAlertasDocentes()+contenido;
        }

        function eliminarDocente(id){
            const data = getData();
            if(id===ctx.DOCENTE_NN_ID) return ctx.toast('Docente NN no se puede eliminar','info');
            if(confirm('¿Eliminar docente?')){ data.docentes=data.docentes.filter(d=>d.id!==id); ctx.guardar(); ctx.refrescarTodo(); }
        }

        function abrirModalSala(id=null){
            const data = getData();
            const s=id?data.salas.find(s=>s.id===id):null;
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3>${s?'Editar':'Nueva'} Sala</h3>
                <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="nomSala" value="${ctx.escapeAttr(s?.nombre||'')}"></div>
                <div class="form-group"><label class="form-label">Capacidad</label><input class="form-input" type="number" id="capSala" value="${s?.capacidad||30}" min="1"></div>
                <div class="form-group"><label class="form-label">Tipo de espacio</label><select class="form-select" id="tipoSala">
                    ${['Sala de Clases','Laboratorio de Computación','Laboratorio de Especialidad','Taller de Especialidad'].map(t=>ctx.optionHTML(t,t,(s?.tipoSala||'Sala de Clases')===t)).join('')}
                </select></div>
                ${s?.alertasImportacion?.length?`<p class="import-warning-note">Alertas de importación: ${ctx.escapeHTML(s.alertasImportacion.join(' · '))}</p>`:''}
                <button class="btn btn-primary" id="btnGuardarSala">Guardar</button>
            </div></div>`;
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)ctx.cerrarModal();});
            document.getElementById('btnGuardarSala').addEventListener('click',()=>guardarSala(id));
        }

        function guardarSala(id){
            const data = getData();
            const nom=document.getElementById('nomSala').value.trim(), cap=parseInt(document.getElementById('capSala').value);
            const tipoSala=document.getElementById('tipoSala')?.value||'Sala de Clases';
            if(!nom) return ctx.toast('El nombre de la sala es obligatorio','error');
            if(!cap||cap<=0) return ctx.toast('La capacidad debe ser mayor a cero','error');
            const duplicado=data.salas.find(s=>s.nombre.toLowerCase()===nom.toLowerCase()&&s.id!==id&&s.id!==ctx.SALA_VIRTUAL_ID&&s.id!==ctx.SALA_TRO2_ID);
            if(duplicado) return ctx.toast(`Ya existe una sala con el nombre "${nom}"`,'error');
            const sala={...(id?data.salas.find(s=>s.id===id)||{}:{}),id:id||ctx.genId(),nombre:nom,capacidad:cap,tipoSala,alertasImportacion:[]};
            if(id){const idx=data.salas.findIndex(s=>s.id===id); if(idx>=0) data.salas[idx]=sala;} else data.salas.push(sala);
            ctx.guardar(); ctx.cerrarModal(); ctx.refrescarTodo(); ctx.toast('Sala guardada','success');
        }

        async function crearPlantillaImportacionSalas(){
            const filas=[
                ['Número','Nombre','Capacidad','Tipo de espacio','Observaciones'],
                ['315','COMPUTACIÓN',30,'Laboratorio de Computación','Equivale a referencias del Gestor como 315-COMPUTACIÓN'],
                ['','LAB ELEC 1',21,'Laboratorio de Especialidad','Sala de especialidad eléctrica'],
                ['','TALLER ELEC',20,'Taller de Especialidad',''],
                ['301','SALA',35,'Sala de Clases','']
            ];
            if((window.XLSX?.utils?.book_new&&window.XLSX?.writeFile) || (ctx.asegurarXLSX && await ctx.asegurarXLSX() && window.XLSX?.utils?.book_new&&window.XLSX?.writeFile)){
                const wb=window.XLSX.utils.book_new();
                const add=(nombre,matriz,cols=[])=>{
                    const ws=window.XLSX.utils.aoa_to_sheet(matriz);
                    if(cols.length) ws['!cols']=cols.map(w=>({wch:w}));
                    window.XLSX.utils.book_append_sheet(wb,ws,nombre);
                };
                add('Salas',filas,[14,30,12,30,48]);
                add('Ayuda',[
                    ['Campo','Qué escribir','Ejemplo','Notas'],
                    ['Número','Número o código corto del espacio','315','Opcional. Si existe junto a Nombre, la app forma 315-COMPUTACIÓN.'],
                    ['Nombre','Nombre del espacio','COMPUTACIÓN','Si ya existe, se actualiza.'],
                    ['Capacidad','Número máximo de estudiantes','21','Debe ser mayor a 0.'],
                    ['Tipo de espacio','Tipo real de espacio','Laboratorio de Computación','Valores sugeridos: Sala de Clases, Laboratorio de Computación, Laboratorio de Especialidad, Taller de Especialidad.'],
                    ['Observaciones','Texto libre','Sala con equipos especiales','Opcional.']
                ],[22,42,30,58]);
                add('Tipos sugeridos',[['Tipo'],['Sala de Clases'],['Laboratorio de Computación'],['Laboratorio de Especialidad'],['Taller de Especialidad']],[32]);
                window.XLSX.writeFile(wb,'Plantilla_Importacion_Salas.xlsx',{bookSST:true});
                ctx.toast('Plantilla de salas descargada','success');
                return;
            }
        }

        function exportarArchivoSalas(){
            const data=getData();
            const filas=[['Número','Nombre','Capacidad','Tipo de espacio','Observaciones']];
            data.salas.filter(s=>s.id!==ctx.SALA_VIRTUAL_ID&&s.id!==ctx.SALA_TRO2_ID).forEach(s=>{
                const ref=separarNumeroNombreSala(s.nombre);
                filas.push([ref.numero,ref.nombre||s.nombre,s.capacidad||'',s.tipoSala||'Sala de Clases',s.observaciones||'']);
            });
            exportarWorkbookCatalogo('Salas_exportadas.xlsx',[
                {nombre:'Salas',matriz:filas,cols:[14,30,12,30,48]},
                {nombre:'Ayuda',matriz:[
                    ['Campo','Qué escribir','Ejemplo','Notas'],
                    ['Número','Número o código corto del espacio','315','Opcional. Si existe junto a Nombre, la app forma 315-COMPUTACIÓN.'],
                    ['Nombre','Nombre del espacio','COMPUTACIÓN','Si ya existe, se actualiza.'],
                    ['Capacidad','Número máximo de estudiantes','21','Debe ser mayor a 0.'],
                    ['Tipo de espacio','Tipo real de espacio','Laboratorio de Computación','Valores sugeridos: Sala de Clases, Laboratorio de Computación, Laboratorio de Especialidad, Taller de Especialidad.'],
                    ['Observaciones','Texto libre','Sala con equipos especiales','Opcional.']
                ],cols:[22,42,30,58]},
                {nombre:'Tipos sugeridos',matriz:[['Tipo'],['Sala de Clases'],['Laboratorio de Computación'],['Laboratorio de Especialidad'],['Taller de Especialidad']],cols:[32]}
            ]);
        }

        function abrirImportacionSalas(){
            const input=document.getElementById('inputImportarSalas');
            if(!input) return;
            input.value='';
            input.click();
        }

        async function leerArchivoSalas(file){
            if(!file) return;
            if(!window.XLSX?.read || !window.XLSX?.utils?.sheet_to_json){
                if(!ctx.asegurarXLSX || !(await ctx.asegurarXLSX()) || !window.XLSX?.read || !window.XLSX?.utils?.sheet_to_json) return;
            }
            const reader=new FileReader();
            reader.onload=(ev)=>{
                try{
                    const wb=window.XLSX.read(ev.target.result,{type:'array'});
                    const sheet=wb.SheetNames.find(n=>limpiarClave(n).includes('sala'))||wb.SheetNames[0];
                    const rows=window.XLSX.utils.sheet_to_json(wb.Sheets[sheet],{header:1,defval:''});
                    importarSalasDesdeFilas(rows);
                }catch(err){
                    console.error(err);
                    ctx.toast('No se pudo leer el archivo de salas','error');
                }
            };
            reader.readAsArrayBuffer(file);
        }

        function normalizarNombreSala(valor){
            return normalizarTextoImportacion(valor).replace(/\s+/g,' ').toUpperCase();
        }

        function normalizarTipoEspacioSala(valor){
            const key=limpiarClave(valor);
            if(key.includes('comput')) return 'Laboratorio de Computación';
            if(key.includes('taller')) return 'Taller de Especialidad';
            if(key.includes('especial')) return 'Laboratorio de Especialidad';
            if(key.includes('lab')) return 'Laboratorio de Especialidad';
            return 'Sala de Clases';
        }

        function importarSalasDesdeFilas(rows){
            const data=getData();
            if(!Array.isArray(rows)||rows.length<2) return ctx.toast('El archivo no contiene salas para importar','error');
            const header=(rows[0]||[]).map(h=>limpiarClave(h));
            const mapa={};
            header.forEach((h,i)=>{
                if(['numero','número','codigo','código'].includes(h)) mapa.numero=i;
                if(h==='nombre'||h==='sala') mapa.nombre=i;
                if(h==='capacidad'||h==='cupo') mapa.capacidad=i;
                if(h==='tipo'||h==='tipo de espacio') mapa.tipo=i;
                if(['observaciones','observacion','observación'].includes(h)) mapa.observaciones=i;
            });
            if(mapa.nombre===undefined||mapa.capacidad===undefined) return ctx.toast('La plantilla debe incluir Nombre y Capacidad','error');
            const salasPorNombre=new Map(data.salas.map(s=>[limpiarClave(s.nombre),s]));
            const resumen={creadas:0,actualizadas:0,omitidas:0,alertas:[]};
            ctx.pushUndo?.();
            rows.slice(1).forEach((row,idx)=>{
                const fila=idx+2;
                const numero=normalizarTextoImportacion(row[mapa.numero]||'').toUpperCase();
                const nombreBase=normalizarNombreSala(row[mapa.nombre]);
                const nombre=numero&&nombreBase?`${numero}-${nombreBase}`:(numero||nombreBase);
                const capacidad=parseInt(row[mapa.capacidad])||0;
                const tipo=normalizarTipoEspacioSala(row[mapa.tipo]||'');
                const observaciones=normalizarTextoImportacion(row[mapa.observaciones]||'');
                if(!nombre&&!capacidad) return;
                if(!nombre||capacidad<=0){
                    resumen.omitidas++;
                    resumen.alertas.push({fila,nombre:nombre||'(sin nombre)',detalle:'Nombre o capacidad inválida',salaId:null});
                    return;
                }
                let sala=salasPorNombre.get(limpiarClave(nombre));
                const alertas=[];
                if(capacidad>80) alertas.push(`Fila ${fila}: capacidad alta, revisar si corresponde (${capacidad})`);
                if(sala){
                    if(sala.id===ctx.SALA_VIRTUAL_ID||sala.id===ctx.SALA_TRO2_ID){
                        resumen.omitidas++;
                        resumen.alertas.push({fila,nombre,detalle:'No se puede modificar una sala fija del sistema',salaId:null});
                        return;
                    }
                    sala.nombre=nombre;
                    sala.capacidad=capacidad;
                    sala.tipoSala=tipo;
                    sala.observaciones=observaciones;
                    sala.alertasImportacion=alertas;
                    resumen.actualizadas++;
                }else{
                    sala={id:ctx.genId(),nombre,capacidad,tipoSala:tipo,observaciones,alertasImportacion:alertas};
                    data.salas.push(sala);
                    salasPorNombre.set(limpiarClave(nombre),sala);
                    resumen.creadas++;
                }
                if(alertas.length) resumen.alertas.push({fila,nombre,detalle:alertas.join(' · '),salaId:sala.id});
            });
            ctx.guardar();
            ctx.refrescarTodo();
            mostrarResultadoImportacionSalas(resumen);
        }

        function mostrarResultadoImportacionSalas(resumen){
            const filas=resumen.alertas.map(a=>`
                <tr>
                    <td>${ctx.escapeHTML(a.fila)}</td>
                    <td>${ctx.escapeHTML(a.nombre)}</td>
                    <td>${ctx.escapeHTML(a.detalle)}</td>
                    <td>${a.salaId?`<button class="btn btn-xs btn-revisar-sala-importada" data-id="${ctx.escapeAttr(a.salaId)}">Revisar</button>`:''}</td>
                </tr>`).join('');
            document.getElementById('modalContainer').innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal dashboard-detail-modal">
                    <div class="modal-header"><h3>Importación de salas</h3><p>Se importó lo válido. Revisa las alertas si hay datos atípicos.</p></div>
                    <div class="dashboard-detail-summary">
                        <div><span>Creadas</span><strong>${resumen.creadas}</strong></div>
                        <div><span>Actualizadas</span><strong>${resumen.actualizadas}</strong></div>
                        <div><span>Omitidas</span><strong>${resumen.omitidas}</strong></div>
                        <div><span>Alertas</span><strong>${resumen.alertas.length}</strong></div>
                    </div>
                    ${resumen.alertas.length?`<div class="dashboard-detail-table"><table class="report-table"><thead><tr><th>Fila</th><th>Sala</th><th>Detalle</th><th>Acción</th></tr></thead><tbody>${filas}</tbody></table></div>`:`<p class="dashboard-detail-empty">No se encontraron alertas.</p>`}
                    <div class="modal-actions"><button class="btn" id="cerrarImportacionSalas">Cerrar</button></div>
                </div></div>`;
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)ctx.cerrarModal();});
            document.getElementById('cerrarImportacionSalas').addEventListener('click',ctx.cerrarModal);
            document.querySelectorAll('.btn-revisar-sala-importada').forEach(btn=>btn.addEventListener('click',()=>abrirModalSala(btn.dataset.id)));
            ctx.toast(resumen.alertas.length?'Salas importadas con alertas':'Salas importadas correctamente',resumen.alertas.length?'warning':'success');
        }

        function eliminarSala(id){
            const data = getData();
            if(id===ctx.SALA_VIRTUAL_ID||id===ctx.SALA_TRO2_ID) return ctx.toast('Esta sala no se puede eliminar','error');
            if(confirm('¿Eliminar sala?')){ data.salas=data.salas.filter(s=>s.id!==id); ctx.guardar(); ctx.refrescarTodo(); }
        }

        function renderPanelAlertasSalas(){
            const data=getData();
            const items=data.salas.filter(s=>Array.isArray(s.alertasImportacion)&&s.alertasImportacion.length);
            if(!items.length) return '';
            return `<div class="import-alert-panel">
                <div class="import-alert-header"><div><strong>Alertas de importación</strong><span>${items.length} sala(s) requieren revisión</span></div></div>
                <div class="import-alert-list">
                    ${items.map(s=>`
                        <div class="import-alert-item">
                            <div>
                                <strong>${ctx.escapeHTML(s.nombre)}</strong>
                                <span>${ctx.escapeHTML(s.alertasImportacion.join(' · '))}</span>
                            </div>
                            <button class="btn btn-xs btn-editar-sala" data-id="${ctx.escapeAttr(s.id)}">Revisar</button>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

        function renderSalas(){
            const data = getData();
            const tiposOrden=['Sala de Clases','Laboratorio de Computación','Laboratorio de Especialidad','Taller de Especialidad','Otros'];
            const tipoSalaVista=s=>{
                if(s.id===ctx.SALA_VIRTUAL_ID) return 'Virtual / Sistema';
                if(s.id===ctx.SALA_TRO2_ID) return 'Terreno / Sistema';
                return s.tipoSala||'Sala de Clases';
            };
            const grupos=new Map();
            data.salas.forEach(s=>{
                const tipo=tipoSalaVista(s);
                if(!grupos.has(tipo)) grupos.set(tipo,[]);
                grupos.get(tipo).push(s);
            });
            const ordenarSala=(a,b)=>String(a.nombre||'').localeCompare(String(b.nombre||''),undefined,{numeric:true,sensitivity:'base'});
            const renderChip=s=>{
                const esFija=s.id===ctx.SALA_VIRTUAL_ID||s.id===ctx.SALA_TRO2_ID;
                const alerta=s.alertasImportacion?.length?` <small class="import-warning-chip">${s.alertasImportacion.length} alerta(s)</small>`:'';
                return `<span class="item-chip" style="${s.id===ctx.SALA_VIRTUAL_ID?'background:color-mix(in srgb, var(--planhor-purple) 13%, var(--surface));':''}${s.id===ctx.SALA_TRO2_ID?'background:color-mix(in srgb, var(--planhor-teal) 13%, var(--surface));':''}">
                    ${ctx.escapeHTML(s.nombre)}${alerta} (Cap:${Number(s.capacidad)||0})
                    <button class="btn btn-xs btn-editar-sala" data-id="${ctx.escapeAttr(s.id)}">✎</button>
                    ${!esFija?`<button class="btn btn-xs btn-eliminar-sala" data-id="${ctx.escapeAttr(s.id)}">🗑️</button>`:''}
                </span>`;
            };
            const orden=[...tiposOrden,...[...grupos.keys()].filter(t=>!tiposOrden.includes(t)).sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'}))];
            const contenido=orden.filter(tipo=>grupos.has(tipo)).map(tipo=>{
                const salas=grupos.get(tipo).sort(ordenarSala);
                const capacidad=salas.reduce((acc,s)=>acc+(Number(s.capacidad)||0),0);
                return `<section class="rooms-type-group">
                    <div class="rooms-type-title">
                        <strong>${ctx.escapeHTML(tipo)}</strong>
                        <span>${salas.length} espacio(s) · cap. total ${capacidad}</span>
                    </div>
                    <div class="rooms-type-list">${salas.map(renderChip).join('')}</div>
                </section>`;
            }).join('') || '<p class="auto-plan-empty">No hay salas registradas.</p>';
            document.getElementById('listaSalas').innerHTML=renderPanelAlertasSalas()+contenido;
        }

        function init(){
            const listaCarreras=document.getElementById('listaCarreras');
            if(listaCarreras) listaCarreras.addEventListener('click',(e)=>{
                const careerHeader=e.target.closest('.career-header');
                if(careerHeader && !e.target.closest('.btn')){
                    const tipo=careerHeader.dataset.tipo, id=careerHeader.dataset.id;
                    const nested=document.getElementById(`${tipo==='carrera'?'niveles':'secciones'}_${id}`);
                    if(nested){
                        const abrir=!nested.classList.contains('open');
                        const reducirMovimiento=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
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
