// Aplicación secciones. Estado y servicios compartidos inyectados, sin copias de datos.
(function(){
    window.PlanhorAplicaciones=window.PlanhorAplicaciones||{};
    window.PlanhorAplicaciones["secciones"]={create(shared){
function renderCarreras(){
            const data = shared.getData();
            const cont=document.getElementById('listaCarreras');
            const filtroArea=document.getElementById('seccionesFiltroArea');
            const areaActual=filtroArea?.value||'';
            const resumenAlumnos=shared.resumenAlumnosSecciones();
            if(filtroArea){
                filtroArea.innerHTML='<option value="">Todas</option>'+shared.areasCarrera().map(a=>shared.ctx.optionHTML(a,a,areaActual===a)).join('');
                filtroArea.value=areaActual&&shared.areasCarrera().includes(areaActual)?areaActual:'';
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
                            <div><strong>${shared.ctx.escapeHTML(item.tipo)}: ${shared.ctx.escapeHTML(item.nombre)}</strong><span>${shared.ctx.escapeHTML(item.detalle)}</span></div>
                            <button class="btn btn-xs ${shared.ctx.escapeAttr(item.btn)}" data-id="${shared.ctx.escapeAttr(item.id)}" ${item.carreraId?`data-carrera="${shared.ctx.escapeAttr(item.carreraId)}"`:''} ${item.nivelId?`data-nivel="${shared.ctx.escapeAttr(item.nivelId)}"`:''}>Revisar</button>
                        </div>`).join('')}
                    </div>
                </div>`;
            };
            const carrerasFiltradas=data.carreras
                .filter(c=>!filtroArea?.value||shared.areaCarrera(c)===filtroArea.value)
                .sort((a,b)=>shared.areaCarrera(a).localeCompare(shared.areaCarrera(b),undefined,{sensitivity:'base'})||String(a.nombre||'').localeCompare(String(b.nombre||''),undefined,{numeric:true,sensitivity:'base'}));
            const renderCarrera=c=>{
                const niveles=data.niveles.filter(n=>n.carreraId===c.id).sort(shared.ordenarNivelesDesc);
                const seccionesCarrera=niveles.flatMap(n=>data.secciones.filter(s=>s.nivelId===n.id));
                const resumenCarrera=shared.textoResumenAlumnos(seccionesCarrera,resumenAlumnos);
                const alerta=c.alertasImportacion?.length?` <small class="import-warning-chip">${c.alertasImportacion.length} alerta(s)</small>`:'';
                return `<div style="margin-bottom:8px;">
                    <div class="career-header" data-tipo="carrera" data-id="${shared.ctx.escapeAttr(c.id)}"><span class="arrow">▶</span> <strong>${shared.ctx.escapeHTML(c.codigo)} - ${shared.ctx.escapeHTML(c.nombre)}</strong> <span class="student-total">${shared.ctx.escapeHTML(resumenCarrera)}</span>${c.especialidad&&c.especialidad!==shared.areaCarrera(c)?` <small style="font-size:0.7rem;color:var(--text-secondary)">Especialidad: ${shared.ctx.escapeHTML(c.especialidad)}</small>`:''}${alerta}
                        <button class="btn btn-xs btn-editar-carrera" data-id="${shared.ctx.escapeAttr(c.id)}">✎</button> <button class="btn btn-xs btn-eliminar" data-tipo="carrera" data-id="${shared.ctx.escapeAttr(c.id)}">🗑️</button>
                    </div>
                    <div class="nested" id="niveles_${shared.ctx.escapeAttr(c.id)}">
                        <button class="btn btn-xs btn-nuevo-nivel" data-carrera="${shared.ctx.escapeAttr(c.id)}">+ Nivel</button>
                        ${niveles.map(n=>{
                            const secciones=data.secciones.filter(s=>s.nivelId===n.id).sort(shared.ordenarSecciones);
                            const resumenNivel=shared.textoResumenAlumnos(secciones,resumenAlumnos);
                            const alertaNivel=n.alertasImportacion?.length?` <small class="import-warning-chip">${n.alertasImportacion.length} alerta(s)</small>`:'';
                            const grupos=['diurna','vespertina'].map(jornada=>({
                                jornada,
                                nombre:shared.etiquetaJornada(jornada),
                                items:secciones.filter(s=>shared.jornadaSeccion(s)===jornada)
                            }));
                            const renderChip=s=>{
                                const r=resumenAlumnos.get(s.id)||{};
                                const asignaturasSobrecupo=shared.contarSobrecuposResumen(r);
                                return `<span class="item-chip section-chip ${asignaturasSobrecupo?'section-overcapacity':''}">${shared.ctx.escapeHTML(s.nombre)} ${shared.badgeAlumnos(r)}${asignaturasSobrecupo?` <small class="import-warning-chip">${asignaturasSobrecupo} asig. con sobrecupo</small>`:''}${s.tipoSeccion&&s.tipoSeccion!=='regular'?` <small>${shared.ctx.escapeHTML(s.tipoSeccion)}</small>`:''}${s.alertasImportacion?.length?` <small class="import-warning-chip">${s.alertasImportacion.length} alerta(s)</small>`:''} <button class="btn btn-xs btn-dictacion-seccion" data-id="${shared.ctx.escapeAttr(s.id)}" title="Asignaturas de la sección">Asignaturas</button> <button class="btn btn-xs btn-editar-seccion" data-nivel="${shared.ctx.escapeAttr(n.id)}" data-id="${shared.ctx.escapeAttr(s.id)}">✎</button> <button class="btn btn-xs btn-eliminar" data-tipo="seccion" data-id="${shared.ctx.escapeAttr(s.id)}">🗑️</button></span>`;
                            };
                            return `<div style="margin-left:20px;">
                                <div class="career-header" data-tipo="nivel" data-id="${shared.ctx.escapeAttr(n.id)}"><span class="arrow">▶</span> <em>${shared.ctx.escapeHTML(n.nombre)}</em> <span class="student-total">${shared.ctx.escapeHTML(resumenNivel)}</span>${alertaNivel}
                                    <button class="btn btn-xs btn-editar-nivel" data-carrera="${shared.ctx.escapeAttr(c.id)}" data-id="${shared.ctx.escapeAttr(n.id)}">✎</button> <button class="btn btn-xs btn-eliminar" data-tipo="nivel" data-id="${shared.ctx.escapeAttr(n.id)}">🗑️</button>
                                </div>
                                <div class="nested" id="secciones_${shared.ctx.escapeAttr(n.id)}">
                                    ${grupos.map(g=>`<div class="jornada-group">
                                        <div class="jornada-header"><span>${shared.ctx.escapeHTML(g.nombre)} <small>${shared.ctx.escapeHTML(shared.textoResumenAlumnos(g.items,resumenAlumnos))}</small></span><button class="btn btn-xs btn-nueva-seccion" data-nivel="${shared.ctx.escapeAttr(n.id)}" data-jornada="${shared.ctx.escapeAttr(g.jornada)}">+ Sección</button></div>
                                        <div class="jornada-sections">${g.items.length?g.items.map(renderChip).join(''):`<span class="jornada-empty">Sin secciones ${shared.ctx.escapeHTML(g.nombre.toLowerCase())}</span>`}</div>
                                    </div>`).join('')}
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
            };
            const gruposArea=new Map();
            carrerasFiltradas.forEach(c=>{
                const area=shared.areaCarrera(c);
                if(!gruposArea.has(area)) gruposArea.set(area,[]);
                gruposArea.get(area).push(c);
            });
            const seccionesFiltradas=carrerasFiltradas.flatMap(c=>data.niveles.filter(n=>n.carreraId===c.id).flatMap(n=>data.secciones.filter(s=>s.nivelId===n.id)));
            const resumenGeneral=shared.textoResumenAlumnos(seccionesFiltradas,resumenAlumnos);
            const resumenGeneralHtml=`<div class="student-summary-strip"><strong>Total planificación</strong><span>${shared.ctx.escapeHTML(resumenGeneral)}</span><small>El total principal considera alumnos propios no electivos. Otros planes y electivos quedan separados como referencia.</small></div>`;
            const contenido=[...gruposArea.entries()].map(([area,items])=>`
                <section class="area-section-group">
                    <div class="area-section-header"><strong>${shared.ctx.escapeHTML(area)}</strong><span>${items.length} carrera(s) · ${shared.ctx.escapeHTML(shared.textoResumenAlumnos(items.flatMap(c=>data.niveles.filter(n=>n.carreraId===c.id).flatMap(n=>data.secciones.filter(s=>s.nivelId===n.id))),resumenAlumnos))}</span></div>
                    <div class="area-section-content">${items.map(renderCarrera).join('')}</div>
                </section>
            `).join('');
            cont.innerHTML=renderPanelAlertas()+resumenGeneralHtml+(contenido||'<p class="auto-plan-empty">No hay carreras para el área seleccionada.</p>');
            shared.acordeonAbierto.forEach(id=>{
                const nested=document.getElementById(id);
                if(!nested) return;
                nested.classList.add('open');
                nested.style.maxHeight='none';
                nested.previousElementSibling?.classList.add('open');
            });
        }

function nombreSeccion(seccionId){
            const data=shared.getData();
            return data.secciones.find(s=>s.id===seccionId)?.nombre||'Sección no encontrada';
        }

function nombreAsignatura(asignaturaId){
            const data=shared.getData();
            const a=data.asignaturas.find(x=>x.id===asignaturaId);
            return a?[a.codigo,a.nombre].filter(Boolean).join(' - '):'Asignatura no encontrada';
        }

function asignaturasDeNivel(nivelId){
            const data=shared.getData();
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
            const data=shared.getData();
            const especificas=(data.asignaturaSeccion||[]).filter(r=>r.seccionId===seccionId);
            if(!especificas.length) return true;
            return especificas.some(r=>r.asignaturaId===asignaturaId);
        }

function agregarAsignaturaSeccion(asignaturaId,seccionId,origen='manual'){
            const data=shared.getData();
            if(!Array.isArray(data.asignaturaSeccion)) data.asignaturaSeccion=[];
            if(!data.asignaturaSeccion.some(r=>r.asignaturaId===asignaturaId&&r.seccionId===seccionId)){
                data.asignaturaSeccion.push({asignaturaId,seccionId,origen});
            }
        }

function quitarAsignaturaSeccion(asignaturaId,seccionId){
            const data=shared.getData();
            const seccion=data.secciones.find(s=>s.id===seccionId);
            const especificas=(data.asignaturaSeccion||[]).filter(r=>r.seccionId===seccionId);
            if(seccion && !especificas.length){
                shared.asignaturasDeNivel(seccion.nivelId)
                    .filter(a=>a.id!==asignaturaId)
                    .forEach(a=>shared.agregarAsignaturaSeccion(a.id,seccionId,'manual'));
            }
            data.asignaturaSeccion=(data.asignaturaSeccion||[]).filter(r=>!(r.asignaturaId===asignaturaId&&r.seccionId===seccionId));
            (shared.ctx.getGruposDictacion?.()||[]).slice().forEach(g=>{
                const coincide=g.asignaturaId===asignaturaId || g.asignaturasEquivalentesIds?.includes(asignaturaId);
                if(!coincide) return;
                if(g.seccionMadreId===seccionId) shared.ctx.eliminarGrupoDictacion?.(g.id);
                else if(g.seccionesVinculadasIds?.includes(seccionId)) shared.ctx.desvincularSeccionDeGrupo?.(g.id,seccionId);
            });
        }

function gruposCompatiblesParaVincular(asignaturaId,seccionId){
            const grupos=shared.ctx.getGruposDictacion?.()||[];
            return grupos.filter(g=>
                g.seccionMadreId!==seccionId &&
                !g.seccionesVinculadasIds?.includes(seccionId) &&
                (g.asignaturaId===asignaturaId || g.asignaturasEquivalentesIds?.includes(asignaturaId))
            );
        }

function grupoCoincideAsignatura(grupo, asignaturaId){
            const data=shared.getData();
            const asignatura=data.asignaturas.find(a=>a.id===asignaturaId);
            const principal=data.asignaturas.find(a=>a.id===grupo?.asignaturaId);
            return grupo?.asignaturaId===asignaturaId ||
                grupo?.asignaturasEquivalentesIds?.includes(asignaturaId) ||
                (!!asignatura?.codigo && !!principal?.codigo && shared.limpiarClave(asignatura.codigo)===shared.limpiarClave(principal.codigo));
        }

function gruposDeAsignaturaSeccion(asignaturaId,seccionId){
            return (shared.ctx.getGruposDictacion?.()||[]).filter(g=>
                shared.grupoCoincideAsignatura(g,asignaturaId) &&
                (g.seccionMadreId===seccionId || g.seccionesVinculadasIds?.includes(seccionId))
            );
        }

function crearGrupoPropioPorDesvinculacion({seccionId,asignaturaId,gruposOrigen,grupoOrigenPreferente=null}){
            const data=shared.getData();
            shared.agregarAsignaturaSeccion(asignaturaId,seccionId,'manual');
            const ahora=new Date().toISOString();
            const rel=shared.relacionAsignaturaSeccion(asignaturaId,seccionId,true);
            const grupoExistente=(shared.ctx.getGruposDictacion?.()||[]).find(g=>g.seccionMadreId===seccionId && shared.grupoCoincideAsignatura(g,asignaturaId));
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
                shared.ctx.desvincularSeccionDeGrupo?.(g.id,seccionId);
                if(antes>=1 && !g.alumnosManualActivo){
                    const actual=Number(g.alumnosVinculados)||0;
                    g.alumnosVinculados=antes===1 ? 0 : Math.max(0,actual-aporte);
                    g.alumnosTotales=(Number(g.alumnosBase)||0)+(Number(g.alumnosVinculados)||0);
                    g.actualizadoEn=ahora;
                }
            });
            const marca=unicoOrigen?.marcaGestor||'';
            const idGestor=unicoOrigen?.idGestorSeccion||'';
            const grupo=grupoExistente||shared.ctx.crearGrupoDictacion?.({
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
            if(!grupo) return shared.ctx.toast('No se pudo crear el grupo propio','error');
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
            const data=shared.getData();
            const seccion=data.secciones.find(s=>s.id===seccionId);
            const asignatura=data.asignaturas.find(a=>a.id===asignaturaId);
            if(!seccion||!asignatura) return shared.ctx.toast('No se encontró la asignatura o sección','error');
            const gruposOrigen=shared.gruposDeAsignaturaSeccion(asignaturaId,seccionId)
                .filter(g=>g.seccionesVinculadasIds?.includes(seccionId));
            if(!gruposOrigen.length) return shared.ctx.toast('Esta asignatura no tiene una fusión heredada activa','info');
            if(!opciones.omitirConfirmacion){
                const madre=gruposOrigen[0]?.seccionMadreId ? shared.nombreSeccion(gruposOrigen[0].seccionMadreId) : 'sección madre';
                const ok=await shared.confirmarCambioCritico({
                    titulo:'Desvincular fusión',
                    mensaje:'La asignatura dejará de depender de la sección madre.',
                    queHara:`${shared.nombreAsignatura(asignaturaId)} se planificará aparte en ${seccion.nombre}.`,
                    afectara:`Relación con ${madre} y alumnos vinculados de esta asignatura.`,
                    noTocara:'No copiará ni eliminará bloques ya planificados.',
                    confirmarTexto:'Desvincular'
                });
                if(!ok) return;
            }
            shared.ctx.crearPuntoRecuperacion?.('antes_desvincular_fusion_hija');
            shared.ctx.pushUndo?.({tipo:'desvincular_fusion',resumen:`Desvincular fusión · ${asignatura.codigo||asignatura.nombre}`,afecta:seccion.nombre,critica:true});
            const grupo=shared.crearGrupoPropioPorDesvinculacion({seccionId,asignaturaId,gruposOrigen,grupoOrigenPreferente:opciones.grupoOrigen||null});
            if(!grupo) return;
            shared.ctx.guardar();
            shared.ctx.reconstruirIndices();
            shared.abrirGestionDictacionSeccion(seccionId,{highlightAsignaturaId:asignaturaId});
            shared.ctx.toast('Fusión desvinculada. La asignatura se planificará aparte.','success');
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
                sobrecupo:total>shared.UMBRAL_SOBRECUPO_ASIGNATURA || base>shared.UMBRAL_SOBRECUPO_ASIGNATURA
            };
        }

function renderAlumnosDictacion(asignatura,seccion){
            const data=shared.getData();
            const estado=shared.ctx.getEstadoDictacionAsignatura?.(asignatura.id,seccion.id)||{estado:'sin-grupo'};
            if(!shared.asignaturaAplicaSeccion(asignatura.id,seccion.id)&&estado.estado!=='vinculada') return '';
            const grupo=estado.grupo;
            const rel=(data.asignaturaSeccion||[]).find(r=>r.asignaturaId===asignatura.id&&r.seccionId===seccion.id);
            const idGestor=grupo?.idGestorSeccion||rel?.idGestor||'';
            const marca=String(rel?.marcaGestor||grupo?.marcaGestor||'').toUpperCase();
            const editarBtn=` <button class="btn btn-xs btn-editar-alumnos-dictacion" data-asig="${shared.ctx.escapeAttr(asignatura.id)}">Editar</button>`;
            if(!grupo){
                const texto=[marca?`Marca: ${marca}`:'','Sin datos de alumnos', idGestor?`ID: ${idGestor}`:''].filter(Boolean).join(' · ');
                return `<span class="dictation-meta muted" ${idGestor?`title="ID Gestor: ${shared.ctx.escapeAttr(idGestor)}"`:''}>${shared.ctx.escapeHTML(texto)}${editarBtn}</span>`;
            }
            const resumen=shared.resumenAlumnosGrupoDictacion(grupo);
            const partes=[];
            if(marca) partes.push(`Marca: ${marca}`);
            if(resumen.total) partes.push(`${resumen.total} alumno(s)`);
            if(resumen.base && resumen.vinculados) partes.push(`${resumen.base} propios + ${resumen.vinculados} vinculados`);
            else if(resumen.vinculados && estado.estado==='vinculada') partes.push(`${resumen.vinculados} vinculados`);
            if(grupo.alumnosManualActivo) partes.push('manual');
            if(idGestor) partes.push(`ID: ${idGestor}`);
            if(resumen.sobrecupo) partes.push('Sobrecupo');
            return `<span class="dictation-meta ${resumen.sobrecupo?'warning':''}" ${idGestor?`title="ID Gestor: ${shared.ctx.escapeAttr(idGestor)}"`:''}>${shared.ctx.escapeHTML(partes.join(' · ')||'Sin datos de alumnos')}${editarBtn}</span>`;
        }

function renderHistorialFusionDictacion(asignatura,seccion){
            const estado=shared.ctx.getEstadoDictacionAsignatura?.(asignatura.id,seccion.id)||{estado:'sin-grupo'};
            const grupo=estado.grupo;
            const rel=shared.relacionAsignaturaSeccion(asignatura.id,seccion.id,false);
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
                ? `Fusión desvinculada con ${shared.nombreSeccion(ultimo.seccionHijaId)}`
                : esHija
                    ? `Fusión desvinculada desde ${shared.nombreSeccion(ultimo?.seccionMadreId||rel?.seccionMadreDesvinculadaId)}`
                    : 'Fusión desvinculada';
            const partes=[
                etiqueta,
                ultimo?.idGestor?`ID original: ${ultimo.idGestor}`:(rel?.idGestorDesvinculado||grupo?.idGestorSeccion?`ID: ${rel?.idGestorDesvinculado||grupo?.idGestorSeccion}`:''),
                esMadre?'':((ultimo?.seccionMadreId||rel?.seccionMadreDesvinculadaId)?`Madre anterior: ${shared.nombreSeccion(ultimo?.seccionMadreId||rel?.seccionMadreDesvinculadaId)}`:''),
                (ultimo?.fecha||rel?.fusionDesvinculadaEn)?`Fecha: ${new Date(ultimo?.fecha||rel?.fusionDesvinculadaEn).toLocaleString()}`:''
            ].filter(Boolean);
            return `<span class="dictation-meta fusion-history">${shared.ctx.escapeHTML(partes.join(' · '))}</span>`;
        }

function relacionAsignaturaSeccion(asignaturaId,seccionId,crear=false){
            const data=shared.getData();
            if(!Array.isArray(data.asignaturaSeccion)) data.asignaturaSeccion=[];
            let rel=data.asignaturaSeccion.find(r=>r.asignaturaId===asignaturaId&&r.seccionId===seccionId);
            if(!rel&&crear){
                const seccion=data.secciones.find(s=>s.id===seccionId);
                const yaEspecifica=data.asignaturaSeccion.some(r=>r.seccionId===seccionId);
                if(seccion&&!yaEspecifica){
                    shared.asignaturasDeNivel(seccion.nivelId).forEach(a=>{
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
            const rel=shared.relacionAsignaturaSeccion(asignatura.id,seccion.id,false);
            if(!rel?.usaSubsecciones) return '';
            const comps=shared.componentesSubseccion(rel);
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
            return `<span class="dictation-meta subsection-meta">Subsecciones: ${shared.ctx.escapeHTML(resumen||'configuradas')}</span>`;
        }

function renderEstadoDictacion(asignatura,seccion){
            const estado=shared.ctx.getEstadoDictacionAsignatura?.(asignatura.id,seccion.id)||{estado:'sin-grupo'};
            const grupo=estado.grupo;
            const relBase=shared.relacionAsignaturaSeccion(asignatura.id,seccion.id,false);
            if(estado.estado==='vinculada'){
                return `<span class="dictation-status linked">Heredada desde otra sección</span>
                    <small>${shared.ctx.escapeHTML(shared.nombreSeccion(grupo.seccionMadreId))}</small>`;
            }
            if(!shared.asignaturaAplicaSeccion(asignatura.id,seccion.id)){
                return `<span class="dictation-status empty">No aplica</span>
                    <small>No forma parte de esta sección dentro del modelo de planificación.</small>`;
            }
            if(estado.estado==='dictada-aqui'){
                const vinculadas=(grupo.seccionesVinculadasIds||[]).map(shared.nombreSeccion);
                const desvinculada=!!grupo.fusionDesvinculada || !!relBase?.fusionDesvinculada;
                return `<span class="dictation-status own">Se dicta aquí</span>
                    ${desvinculada?`<span class="dictation-status detached">Fusión desvinculada</span>`:''}
                    ${vinculadas.length?`<small>Compartida con: ${shared.ctx.escapeHTML(vinculadas.join(', '))}</small>`:'<small>Sin secciones vinculadas.</small>'}`;
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
            const estado=shared.ctx.getEstadoDictacionAsignatura?.(asignatura.id,seccion.id)||{estado:'sin-grupo'};
            const grupo=estado.grupo;
            const configBtn=`<button class="btn btn-xs btn-config-subsecciones" data-asig="${shared.ctx.escapeAttr(asignatura.id)}">Subsecciones</button>`;
            if(estado.estado==='vinculada'){
                return `<button class="btn btn-xs btn-ir-madre-dictacion" data-seccion="${shared.ctx.escapeAttr(grupo.seccionMadreId)}">Ir a madre</button>
                    <button class="btn btn-xs btn-desvincular-fusion" data-asig="${shared.ctx.escapeAttr(asignatura.id)}">Desvincular Fusión</button>
                    <button class="btn btn-xs btn-no-aplica" data-asig="${shared.ctx.escapeAttr(asignatura.id)}">No aplica</button>`;
            }
            if(!shared.asignaturaAplicaSeccion(asignatura.id,seccion.id)){
                const compatibles=shared.gruposCompatiblesParaVincular(asignatura.id,seccion.id);
                return `<button class="btn btn-xs btn-dictar-aqui" data-asig="${shared.ctx.escapeAttr(asignatura.id)}">Se dicta aquí</button>
                    <button class="btn btn-xs btn-vincular-dictacion" data-asig="${shared.ctx.escapeAttr(asignatura.id)}" ${compatibles.length?'':'disabled title="Primero debe existir una sección madre que dicte esta asignatura"'}>Heredar</button>`;
            }
            if(estado.estado==='dictada-aqui'){
                const gestionarBtn=(grupo.seccionesVinculadasIds||[]).length
                    ? `<button class="btn btn-xs btn-gestionar-compartidas" data-asig="${shared.ctx.escapeAttr(asignatura.id)}" data-grupo="${shared.ctx.escapeAttr(grupo.id)}">Gestionar compartidas</button>`
                    : '';
                return `${configBtn}
                    ${gestionarBtn}
                    <button class="btn btn-xs btn-compartir-dictacion" data-asig="${shared.ctx.escapeAttr(asignatura.id)}" data-grupo="${shared.ctx.escapeAttr(grupo.id)}">Compartir</button>
                    <button class="btn btn-xs btn-no-aplica" data-asig="${shared.ctx.escapeAttr(asignatura.id)}">No aplica</button>`;
            }
            const compatibles=shared.gruposCompatiblesParaVincular(asignatura.id,seccion.id);
            return `${configBtn}
                <button class="btn btn-xs btn-dictar-aqui" data-asig="${shared.ctx.escapeAttr(asignatura.id)}">Se dicta aquí</button>
                <button class="btn btn-xs btn-vincular-dictacion" data-asig="${shared.ctx.escapeAttr(asignatura.id)}" ${compatibles.length?'':'disabled title="Primero debe existir una sección madre que dicte esta asignatura"'}>Heredar</button>
                <button class="btn btn-xs btn-no-aplica" data-asig="${shared.ctx.escapeAttr(asignatura.id)}">No aplica</button>`;
        }

function abrirConfigSubseccionesAsignatura(seccionId,asignaturaId){
            const data=shared.getData();
            const seccion=data.secciones.find(s=>s.id===seccionId);
            const asignatura=data.asignaturas.find(a=>a.id===asignaturaId);
            if(!seccion||!asignatura) return shared.ctx.toast('No se encontró la asignatura o sección','error');
            const rel=shared.relacionAsignaturaSeccion(asignaturaId,seccionId,true);
            const totalHoras=Number(asignatura.horasPresenciales)||Number(asignatura.horasTotales)||0;
            const comps=shared.componentesSubseccion(rel);
            const grupos=comps.filter(c=>c.tipo!=='comun');
            const horasComunes=Number(rel.horasComunes)||0;
            const horasPorSubseccion=Number(rel.horasPorSubseccion)||0;
            const alumnosTotal=Number(shared.ctx.getEstadoDictacionAsignatura?.(asignaturaId,seccionId)?.grupo?.alumnosTotales)||Number(shared.ctx.getEstadoDictacionAsignatura?.(asignaturaId,seccionId)?.grupo?.alumnosBase)||0;
            const gruposTexto=grupos.length?grupos.map(g=>`${g.nombre||g.id}|${Number(g.alumnos)||0}|${Number(g.horas)||horasPorSubseccion}`).join('\n'):`Grupo A|${alumnosTotal?Math.ceil(alumnosTotal/2):0}|${horasPorSubseccion||Math.max(0,totalHoras-horasComunes)}\nGrupo B|${alumnosTotal?Math.floor(alumnosTotal/2):0}|${horasPorSubseccion||Math.max(0,totalHoras-horasComunes)}`;
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal modal-wide">
                <div class="modal-header">
                    <h3>Subsecciones de asignatura</h3>
                    <p>${shared.ctx.escapeHTML(shared.nombreAsignatura(asignaturaId))} · ${shared.ctx.escapeHTML(seccion.nombre)}</p>
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
                    <textarea class="form-input" id="subGrupos" rows="5" placeholder="Grupo A|20|36">${shared.ctx.escapeHTML(gruposTexto)}</textarea>
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
                    return {id:shared.ctx.genId(),nombre,alumnos,horas,tipo:'subseccion'};
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
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget)shared.abrirGestionDictacionSeccion(seccionId);};
            document.getElementById('btnCancelarSubsecciones').onclick=()=>shared.abrirGestionDictacionSeccion(seccionId);
            document.getElementById('btnQuitarSubsecciones').onclick=()=>{
                rel.usaSubsecciones=false;
                rel.horasComunes=0;
                rel.horasPorSubseccion=0;
                rel.componentesSubseccion=[];
                shared.ctx.guardar(); shared.ctx.reconstruirIndices(); shared.abrirGestionDictacionSeccion(seccionId); shared.ctx.toast('Subsecciones desactivadas','info');
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
                shared.ctx.guardar(); shared.ctx.reconstruirIndices(); shared.abrirGestionDictacionSeccion(seccionId); shared.ctx.toast('Subsecciones guardadas','success');
            };
        }

function asegurarGrupoParaAlumnos(asignaturaId,seccionId){
            let estado=shared.ctx.getEstadoDictacionAsignatura?.(asignaturaId,seccionId)||{estado:'sin-grupo',grupo:null};
            if(estado.grupo) return estado.grupo;
            shared.agregarAsignaturaSeccion(asignaturaId,seccionId,'manual');
            const grupo=shared.ctx.crearGrupoDictacion?.({
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
            const data=shared.getData();
            const seccion=data.secciones.find(s=>s.id===seccionId);
            const asignatura=data.asignaturas.find(a=>a.id===asignaturaId);
            if(!seccion||!asignatura) return shared.ctx.toast('No se encontró la asignatura o sección','error');
            const grupo=shared.asegurarGrupoParaAlumnos(asignaturaId,seccionId);
            if(!grupo) return shared.ctx.toast('No se pudo preparar el grupo de alumnos','error');
            const base=Number(grupo.alumnosBase)||0;
            const vinculados=Number(grupo.alumnosVinculados)||0;
            const gestorBase=Number(grupo.alumnosBaseGestor)||base;
            const gestorVinculados=Number(grupo.alumnosVinculadosGestor)||vinculados;
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <div class="modal-header">
                    <h3>Editar alumnos</h3>
                    <p>${shared.ctx.escapeHTML(shared.nombreAsignatura(asignaturaId))} · ${shared.ctx.escapeHTML(seccion.nombre)}</p>
                </div>
                <div class="form-grid">
                    <div class="form-group"><label class="form-label">Alumnos propios</label><input class="form-input" id="editAlumnosBase" type="number" min="0" value="${base}"></div>
                    <div class="form-group"><label class="form-label">Alumnos otros planes</label><input class="form-input" id="editAlumnosVinculados" type="number" min="0" value="${vinculados}"></div>
                </div>
                <div class="form-group"><label class="form-label">Observación</label><textarea class="form-input" id="editAlumnosObs" rows="3">${shared.ctx.escapeHTML(grupo.observacionAlumnos||'')}</textarea></div>
                <p class="modal-help">Gestor: ${gestorBase} propios + ${gestorVinculados} otros planes. El cambio manual impacta totales, capacidad de sala y reportes.</p>
                <div class="modal-actions">
                    <button class="btn" id="btnCancelarAlumnos">Cancelar</button>
                    <button class="btn" id="btnRestaurarAlumnosGestor">Restaurar Gestor</button>
                    <button class="btn btn-primary" id="btnGuardarAlumnosManual">Guardar</button>
                </div>
            </div></div>`;
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget)shared.abrirGestionDictacionSeccion(seccionId);};
            document.getElementById('btnCancelarAlumnos').onclick=()=>shared.abrirGestionDictacionSeccion(seccionId);
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
                shared.ctx.guardar(); shared.ctx.reconstruirIndices(); shared.abrirGestionDictacionSeccion(seccionId); shared.ctx.toast('Alumnos actualizados','success');
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
                shared.ctx.guardar(); shared.ctx.reconstruirIndices(); shared.abrirGestionDictacionSeccion(seccionId); shared.ctx.toast('Datos del Gestor restaurados','success');
            };
        }

function contextoDestinoElectiva(seccion){
            const data=shared.getData();
            const nivel=data.niveles.find(n=>n.id===seccion?.nivelId);
            const carrera=nivel?data.carreras.find(c=>c.id===nivel.carreraId):null;
            return {nivel,carrera,texto:[carrera?shared.areaCarrera(carrera):'',carrera?.nombre,nivel?.nombre,shared.etiquetaJornada(shared.jornadaSeccion(seccion)),seccion?.nombre].filter(Boolean).join(' · ')};
        }

function vinculosElectivosSeccion(seccionId){
            const data=shared.getData();
            return (data.vinculosElectivos||[])
                .filter(v=>v.seccionDestinoId===seccionId)
                .sort((a,b)=>shared.nombreAsignatura(a.asignaturaId).localeCompare(shared.nombreAsignatura(b.asignaturaId),'es',{numeric:true})||shared.nombreSeccion(a.seccionOrigenId).localeCompare(shared.nombreSeccion(b.seccionOrigenId),'es',{numeric:true}));
        }

function renderElectivasVinculadasSeccion(seccionId){
            const data=shared.getData();
            const vinculos=shared.vinculosElectivosSeccion(seccionId);
            if(!vinculos.length) return '<div class="elective-section-empty">Sin electivas vinculadas.</div>';
            return `<div class="dictation-list elective-dictation-list">${vinculos.map(v=>{
                const asignatura=data.asignaturas.find(a=>a.id===v.asignaturaId);
                return `<div class="dictation-row" data-vinculo-electivo="${shared.ctx.escapeAttr(v.id)}">
                    <div>
                        <strong>${shared.ctx.escapeHTML(shared.nombreAsignatura(v.asignaturaId))}</strong>
                        <span class="dictation-status elective">Electiva vinculada</span>
                        <small>Sección de origen: ${shared.ctx.escapeHTML(shared.nombreSeccion(v.seccionOrigenId))}</small>
                    </div>
                    <div class="dictation-actions">
                        <button class="btn btn-xs btn-ir-origen-electiva" data-seccion="${shared.ctx.escapeAttr(v.seccionOrigenId)}">Ir a origen</button>
                        <button class="btn btn-xs btn-quitar-vinculo-electivo" data-vinculo="${shared.ctx.escapeAttr(v.id)}">Quitar vínculo</button>
                    </div>
                </div>`;}).join('')}</div>`;
        }

function abrirGestionDictacionSeccion(seccionId, opciones={}){
            const data=shared.getData();
            const seccion=data.secciones.find(s=>s.id===seccionId);
            if(!seccion) return shared.ctx.toast('Sección no encontrada','error');
            const nivel=data.niveles.find(n=>n.id===seccion.nivelId);
            const carrera=data.carreras.find(c=>c.id===nivel?.carreraId);
            const asignaturas=shared.asignaturasDeNivel(seccion.nivelId);
            const especificas=(data.asignaturaSeccion||[]).filter(r=>r.seccionId===seccion.id).length;
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal modal-wide">
                <div class="modal-header">
                    <h3>Asignaturas de la sección</h3>
                    <p>${shared.ctx.escapeHTML(seccion.nombre)}${carrera?` · ${shared.ctx.escapeHTML(carrera.codigo)} - ${shared.ctx.escapeHTML(carrera.nombre)}`:''}${nivel?` · ${shared.ctx.escapeHTML(nivel.nombre)}`:''}${especificas?` · modelo específico por sección`:''}</p>
                </div>
                ${!asignaturas.length?`<div class="auto-plan-empty">Este nivel aún no tiene asignaturas asociadas.</div>`:`
                <div class="dictation-list">
                    ${asignaturas.map(a=>`
                        <div class="dictation-row ${opciones.highlightAsignaturaId===a.id?'dictation-row-focus':''}" data-asig="${shared.ctx.escapeAttr(a.id)}">
                            <div>
                                <strong>${shared.ctx.escapeHTML(shared.nombreAsignatura(a.id))}</strong>
                                ${shared.renderEstadoDictacion(a,seccion)}
                                ${shared.renderAlumnosDictacion(a,seccion)}
                                ${shared.renderHistorialFusionDictacion(a,seccion)}
                                ${shared.renderSubseccionesAsignatura(a,seccion)}
                            </div>
                            <div class="dictation-actions">${shared.renderAccionesDictacion(a,seccion)}</div>
                        </div>
                    `).join('')}
                </div>`}
                <div class="elective-section-panel">
                    <div class="elective-section-head">
                        <div><strong>Electivas vinculadas</strong><small>Protegen el horario de esta sección sin crear una fusión.</small></div>
                        <button class="btn btn-xs btn-primary" id="btnVincularElectivaSeccion">+ Vincular electiva</button>
                    </div>
                    ${shared.renderElectivasVinculadasSeccion(seccion.id)}
                </div>
                <div class="modal-actions">
                    <button class="btn" id="btnCerrarDictacion">Cerrar</button>
                </div>
            </div></div>`;
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget)shared.ctx.cerrarModal();};
            document.getElementById('btnCerrarDictacion').onclick=()=>shared.ctx.cerrarModal();
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
                const ok=await shared.confirmarCambioCritico({
                    titulo:'Marcar como dictada aquí',
                    mensaje:'La sección pasará a dictar esta asignatura directamente.',
                    queHara:`${shared.nombreAsignatura(asigId)} quedará como propia de ${seccion.nombre}.`,
                    afectara:'Estado de dictación y vínculos activos de esta asignatura.',
                    noTocara:'No cambiará bloques ya planificados ni catálogos.',
                    confirmarTexto:'Dictar aquí',
                    peligro:false
                });
                if(!ok) return;
                shared.ctx.crearPuntoRecuperacion?.('antes_dictar_aqui');
                shared.ctx.pushUndo?.({tipo:'dictar_aqui',resumen:`Se dicta aquí · ${shared.nombreAsignatura(asigId)}`,afecta:seccion.nombre,critica:true});
                shared.agregarAsignaturaSeccion(btn.dataset.asig,seccion.id,'manual');
                (shared.ctx.getGruposDictacion?.()||[]).slice().forEach(g=>{
                    const coincide=g.asignaturaId===btn.dataset.asig || g.asignaturasEquivalentesIds?.includes(btn.dataset.asig);
                    if(coincide&&g.seccionesVinculadasIds?.includes(seccion.id)) shared.ctx.desvincularSeccionDeGrupo?.(g.id,seccion.id);
                });
                const grupo=shared.ctx.crearGrupoDictacion?.({asignaturaId:btn.dataset.asig,seccionMadreId:seccion.id,origen:'manual'});
                if(!grupo) return shared.ctx.toast('No se pudo crear el grupo de dictación','error');
                shared.ctx.guardar(); shared.abrirGestionDictacionSeccion(seccion.id); shared.ctx.toast('Asignatura marcada como dictada aquí','success');
            });
            modal.querySelectorAll('.btn-desvincular-fusion').forEach(btn=>btn.onclick=()=>shared.desvincularFusionAsignatura(seccion.id,btn.dataset.asig));
            modal.querySelectorAll('.btn-vincular-dictacion').forEach(btn=>btn.onclick=()=>shared.abrirVincularDictacion(seccion.id,btn.dataset.asig));
            modal.querySelectorAll('.btn-compartir-dictacion').forEach(btn=>btn.onclick=()=>shared.abrirCompartirDictacion(seccion.id,btn.dataset.grupo,btn.dataset.asig));
            modal.querySelectorAll('.btn-gestionar-compartidas').forEach(btn=>btn.onclick=()=>shared.abrirGestionCompartidas(seccion.id,btn.dataset.grupo,btn.dataset.asig));
            modal.querySelectorAll('.btn-editar-alumnos-dictacion').forEach(btn=>btn.onclick=()=>shared.abrirEditarAlumnosDictacion(seccion.id,btn.dataset.asig));
            modal.querySelectorAll('.btn-config-subsecciones').forEach(btn=>btn.onclick=()=>shared.abrirConfigSubseccionesAsignatura(seccion.id,btn.dataset.asig));
            modal.querySelectorAll('.btn-no-aplica').forEach(btn=>btn.onclick=async()=>{
                const asigId=btn.dataset.asig;
                const ok=await shared.confirmarCambioCritico({
                    titulo:'Marcar No aplica',
                    mensaje:'La asignatura dejará de formar parte del modelo de esta sección.',
                    queHara:`${shared.nombreAsignatura(asigId)} quedará como No aplica en ${seccion.nombre}.`,
                    afectara:'Relación asignatura-sección y vínculo de dictación si existía.',
                    noTocara:'No eliminará bloques ya planificados automáticamente.',
                    confirmarTexto:'Marcar No aplica'
                });
                if(!ok) return;
                shared.ctx.crearPuntoRecuperacion?.('antes_no_aplica');
                shared.ctx.pushUndo?.({tipo:'no_aplica',resumen:`No aplica · ${shared.nombreAsignatura(asigId)}`,afecta:seccion.nombre,critica:true});
                shared.quitarAsignaturaSeccion(btn.dataset.asig,seccion.id);
                shared.ctx.guardar(); shared.ctx.reconstruirIndices(); shared.abrirGestionDictacionSeccion(seccion.id); shared.ctx.toast('Asignatura marcada como No aplica','info');
            });
            modal.querySelectorAll('.btn-ir-madre-dictacion').forEach(btn=>btn.onclick=()=>{
                const madre=data.secciones.find(s=>s.id===btn.dataset.seccion);
                if(madre) shared.abrirGestionDictacionSeccion(madre.id);
            });
            document.getElementById('btnVincularElectivaSeccion').onclick=()=>shared.abrirVincularElectivaSeccion(seccion.id);
            modal.querySelectorAll('.btn-ir-origen-electiva').forEach(btn=>btn.onclick=()=>shared.abrirGestionDictacionSeccion(btn.dataset.seccion));
            modal.querySelectorAll('.btn-quitar-vinculo-electivo').forEach(btn=>btn.onclick=()=>shared.quitarVinculoElectivo(btn.dataset.vinculo,seccion.id));
        }

function ofertasElectivas(){
            const data=shared.getData();
            const ofertas=[];
            const agregarOferta=(asignatura,seccionOrigenId,origenes)=>{
                if(!seccionOrigenId || !data.secciones.some(s=>s.id===seccionOrigenId) || origenes.has(seccionOrigenId)) return;
                origenes.add(seccionOrigenId);
                ofertas.push({
                    asignaturaId:asignatura.id,
                    seccionOrigenId,
                    texto:`${shared.nombreAsignatura(asignatura.id)} · Sección origen: ${shared.nombreSeccion(seccionOrigenId)}`
                });
            };
            data.asignaturas.filter(a=>a.area==='electiva').forEach(asignatura=>{
                const origenes=new Set();
                (shared.ctx.getGruposDictacion?.()||[])
                    .filter(g=>shared.grupoCoincideAsignatura(g,asignatura.id))
                    .forEach(g=>agregarOferta(asignatura,g.seccionMadreId,origenes));
                (data.asignaturaSeccion||[])
                    .filter(r=>r.asignaturaId===asignatura.id)
                    .forEach(r=>agregarOferta(asignatura,r.seccionId,origenes));
                data.planificaciones
                    .filter(p=>p.asignaturaId===asignatura.id)
                    .forEach(p=>agregarOferta(asignatura,p.seccionId,origenes));
            });
            return ofertas.sort((a,b)=>a.texto.localeCompare(b.texto,'es',{numeric:true}));
        }

function abrirVincularElectivaSeccion(seccionDestinoId){
            const data=shared.getData();
            const existentes=new Set((data.vinculosElectivos||[]).filter(v=>v.seccionDestinoId===seccionDestinoId).map(v=>`${v.asignaturaId}|${v.seccionOrigenId}`));
            const ofertas=shared.ofertasElectivas().filter(o=>o.seccionOrigenId!==seccionDestinoId&&!existentes.has(`${o.asignaturaId}|${o.seccionOrigenId}`));
            if(!ofertas.length) return shared.ctx.toast('No hay ofertas electivas pendientes de vincular','info');
            document.getElementById('modalContainer').innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal">
                    <div class="modal-header"><h3>Vincular electiva</h3><p>Destino: ${shared.ctx.escapeHTML(shared.nombreSeccion(seccionDestinoId))}</p></div>
                    <div class="form-group"><label class="form-label">Electiva y sección de origen</label><select class="form-select" id="ofertaElectivaVincular">${ofertas.map((o,i)=>shared.ctx.optionHTML(String(i),o.texto)).join('')}</select></div>
                    <p class="criteria-note">Puedes repetir esta acción para agregar electivas de la misma o de otras secciones.</p>
                    <div class="modal-actions"><button class="btn" id="btnVolverVinculoElectivo">Volver</button><button class="btn btn-primary" id="btnConfirmarVinculoElectivo">Vincular</button></div>
                </div></div>`;
            document.getElementById('modalOverlay').onclick=e=>{if(e.target===e.currentTarget)shared.abrirGestionDictacionSeccion(seccionDestinoId);};
            document.getElementById('btnVolverVinculoElectivo').onclick=()=>shared.abrirGestionDictacionSeccion(seccionDestinoId);
            document.getElementById('btnConfirmarVinculoElectivo').onclick=async()=>{
                const oferta=ofertas[Number(document.getElementById('ofertaElectivaVincular').value)];
                if(!oferta) return;
                const ok=await shared.confirmarCambioCritico({titulo:'Vincular electiva',mensaje:'La sección considerará esta oferta electiva en su horario.',queHara:`${shared.nombreAsignatura(oferta.asignaturaId)} desde ${shared.nombreSeccion(oferta.seccionOrigenId)} se vinculará con ${shared.nombreSeccion(seccionDestinoId)}.`,afectara:'Visualización y validación de topes.',noTocara:'No creará fusiones ni duplicará bloques.',confirmarTexto:'Vincular',peligro:false});
                if(!ok) return;
                shared.ctx.pushUndo?.({tipo:'vincular_electiva',resumen:`Vincular electiva · ${shared.nombreAsignatura(oferta.asignaturaId)}`,afecta:shared.nombreSeccion(seccionDestinoId),critica:false});
                (data.vinculosElectivos||(data.vinculosElectivos=[])).push({id:shared.ctx.genId(),asignaturaId:oferta.asignaturaId,seccionOrigenId:oferta.seccionOrigenId,seccionDestinoId,origen:'manual'});
                shared.ctx.guardar(); shared.abrirGestionDictacionSeccion(seccionDestinoId); shared.ctx.toast('Electiva vinculada','success');
            };
        }

async function quitarVinculoElectivo(vinculoId,seccionRetornoId){
            const data=shared.getData();
            const vinculo=(data.vinculosElectivos||[]).find(v=>v.id===vinculoId);
            if(!vinculo) return;
            const ok=await shared.confirmarCambioCritico({titulo:'Quitar vínculo electivo',mensaje:'La sección dejará de considerar esta oferta electiva.',queHara:`Se quitará ${shared.nombreAsignatura(vinculo.asignaturaId)} desde ${shared.nombreSeccion(vinculo.seccionOrigenId)}.`,afectara:'Solo esta relación electiva.',noTocara:'No eliminará asignaturas ni bloques.',confirmarTexto:'Quitar vínculo'});
            if(!ok) return;
            shared.ctx.pushUndo?.({tipo:'quitar_vinculo_electivo',resumen:`Quitar electiva · ${shared.nombreAsignatura(vinculo.asignaturaId)}`,afecta:shared.nombreSeccion(seccionRetornoId),critica:false});
            data.vinculosElectivos=data.vinculosElectivos.filter(v=>v.id!==vinculoId);
            shared.ctx.guardar(); shared.abrirGestionDictacionSeccion(seccionRetornoId); shared.ctx.toast('Vínculo electivo eliminado','success');
        }

async function desvincularFusionDesdeMadre(seccionMadreId,grupoId,seccionHijaId,asignaturaId){
            const grupo=(shared.ctx.getGruposDictacion?.()||[]).find(g=>g.id===grupoId);
            if(!grupo) return shared.ctx.toast('Grupo madre no encontrado','error');
            if(!grupo.seccionesVinculadasIds?.includes(seccionHijaId)) return shared.ctx.toast('La sección ya no está vinculada a este grupo','info');
            const ok=await shared.confirmarCambioCritico({
                titulo:'Desvincular fusión',
                mensaje:'La sección vinculada dejará de heredar desde esta madre.',
                queHara:`${shared.nombreSeccion(seccionHijaId)} planificará ${shared.nombreAsignatura(asignaturaId)} aparte.`,
                afectara:`Vínculo con ${shared.nombreSeccion(seccionMadreId)} e historial del ID Gestor.`,
                noTocara:'No eliminará bloques existentes ni la asignatura del catálogo.',
                confirmarTexto:'Desvincular'
            });
            if(!ok) return;
            shared.ctx.crearPuntoRecuperacion?.('antes_desvincular_fusion_madre');
            shared.ctx.pushUndo?.({tipo:'desvincular_fusion',resumen:`Desvincular fusión · ${shared.nombreAsignatura(asignaturaId)}`,afecta:`${shared.nombreSeccion(seccionMadreId)} / ${shared.nombreSeccion(seccionHijaId)}`,critica:true});
            const creado=shared.crearGrupoPropioPorDesvinculacion({
                seccionId:seccionHijaId,
                asignaturaId,
                gruposOrigen:[grupo],
                grupoOrigenPreferente:grupo
            });
            if(!creado) return;
            shared.ctx.guardar();
            shared.ctx.reconstruirIndices();
            shared.abrirGestionCompartidas(seccionMadreId,grupoId,asignaturaId);
            shared.ctx.toast('Fusión desvinculada desde la sección madre','success');
        }

function abrirGestionCompartidas(seccionMadreId,grupoId,asignaturaId){
            const data=shared.getData();
            const grupo=(shared.ctx.getGruposDictacion?.()||[]).find(g=>g.id===grupoId);
            if(!grupo) return shared.ctx.toast('Grupo no encontrado','error');
            const vinculadas=(grupo.seccionesVinculadasIds||[])
                .map(id=>data.secciones.find(s=>s.id===id))
                .filter(Boolean)
                .sort((a,b)=>a.nombre.localeCompare(b.nombre,undefined,{numeric:true,sensitivity:'base'}));
            const historial=(grupo.fusionHistorial||[]).slice(-6).reverse();
            const filas=vinculadas.map(s=>`
                <tr>
                    <td><strong>${shared.ctx.escapeHTML(s.nombre)}</strong></td>
                    <td>${shared.ctx.escapeHTML(shared.nombreAsignatura(asignaturaId))}</td>
                    <td>${grupo.idGestorSeccion?shared.ctx.escapeHTML(grupo.idGestorSeccion):'<span class="muted">Sin ID</span>'}</td>
                    <td>
                        <button class="btn btn-xs btn-ir-hija-compartida" data-seccion="${shared.ctx.escapeAttr(s.id)}">Ir a sección</button>
                        <button class="btn btn-xs btn-danger btn-desvincular-desde-madre" data-seccion="${shared.ctx.escapeAttr(s.id)}">Desvincular Fusión</button>
                    </td>
                </tr>`).join('');
            const filasHistorial=historial.map(h=>`
                <tr>
                    <td>${shared.ctx.escapeHTML(h.idGestor||grupo.idGestorSeccion||'Sin ID')}</td>
                    <td>${shared.ctx.escapeHTML(shared.nombreSeccion(h.seccionMadreId)||'Sin madre')}</td>
                    <td>${shared.ctx.escapeHTML(shared.nombreSeccion(h.seccionHijaId)||'Sin hija')}</td>
                    <td>${shared.ctx.escapeHTML(h.fecha?new Date(h.fecha).toLocaleString():'')}</td>
                </tr>`).join('');
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal modal-wide">
                <div class="modal-header">
                    <h3>Gestionar compartidas</h3>
                    <p>${shared.ctx.escapeHTML(shared.nombreAsignatura(asignaturaId))} · madre: ${shared.ctx.escapeHTML(shared.nombreSeccion(seccionMadreId))}${grupo.idGestorSeccion?` · ID: ${shared.ctx.escapeHTML(grupo.idGestorSeccion)}`:''}</p>
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
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget)shared.abrirGestionDictacionSeccion(seccionMadreId);};
            document.getElementById('btnVolverGestionCompartidas').onclick=()=>shared.abrirGestionDictacionSeccion(seccionMadreId);
            const modal=document.getElementById('modalContainer');
            modal.querySelectorAll('.btn-ir-hija-compartida').forEach(btn=>btn.onclick=()=>shared.abrirGestionDictacionSeccion(btn.dataset.seccion,{highlightAsignaturaId:asignaturaId}));
            modal.querySelectorAll('.btn-desvincular-desde-madre').forEach(btn=>btn.onclick=()=>shared.desvincularFusionDesdeMadre(seccionMadreId,grupoId,btn.dataset.seccion,asignaturaId));
        }

function abrirVincularDictacion(seccionId,asignaturaId){
            const grupos=shared.gruposCompatiblesParaVincular(asignaturaId,seccionId);
            if(!grupos.length) return shared.ctx.toast('No hay grupos madre disponibles para esta asignatura','info');
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3>Vincular asignatura</h3>
                <p style="font-size:0.82rem;color:var(--text-secondary);margin-top:0;">${shared.ctx.escapeHTML(shared.nombreAsignatura(asignaturaId))} en ${shared.ctx.escapeHTML(shared.nombreSeccion(seccionId))}</p>
                <div class="form-group">
                    <label class="form-label">Se dictará desde</label>
                    <select class="form-select" id="grupoDictacionDestino">
                        ${grupos.map(g=>shared.ctx.optionHTML(g.id,`${shared.nombreSeccion(g.seccionMadreId)} · ${shared.nombreAsignatura(g.asignaturaId)}`)).join('')}
                    </select>
                </div>
                <div class="form-group"><label class="form-label">Alumnos que se suman (opcional)</label><input class="form-input" id="alumnosVinculo" type="number" min="0" value="0"></div>
                <div class="modal-actions"><button class="btn" id="btnVolverDictacion">Volver</button><button class="btn btn-primary" id="btnConfirmarVinculo">Confirmar vínculo</button></div>
            </div></div>`;
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget)shared.abrirGestionDictacionSeccion(seccionId);};
            document.getElementById('btnVolverDictacion').onclick=()=>shared.abrirGestionDictacionSeccion(seccionId);
            document.getElementById('btnConfirmarVinculo').onclick=async()=>{
                const grupoId=document.getElementById('grupoDictacionDestino').value;
                const alumnos=Number(document.getElementById('alumnosVinculo').value)||0;
                const grupo=grupos.find(g=>g.id===grupoId);
                const ok=await shared.confirmarCambioCritico({
                    titulo:'Heredar asignatura',
                    mensaje:'La sección consumirá la planificación de una sección madre.',
                    queHara:`${shared.nombreSeccion(seccionId)} heredará ${shared.nombreAsignatura(asignaturaId)} desde ${shared.nombreSeccion(grupo?.seccionMadreId)}.`,
                    afectara:'Grupo de dictación, alumnos vinculados y visualización del horario.',
                    noTocara:'No moverá bloques ya planificados en la sección madre.',
                    confirmarTexto:'Confirmar herencia',
                    peligro:false
                });
                if(!ok) return;
                shared.ctx.crearPuntoRecuperacion?.('antes_heredar_asignatura');
                shared.ctx.pushUndo?.({tipo:'heredar_asignatura',resumen:`Heredar · ${shared.nombreAsignatura(asignaturaId)}`,afecta:shared.nombreSeccion(seccionId),critica:true});
                shared.agregarAsignaturaSeccion(asignaturaId,seccionId,'manual');
                if(!shared.ctx.vincularSeccionAGrupo?.(grupoId,seccionId,{alumnos})) return shared.ctx.toast('No se pudo crear el vínculo','error');
                shared.ctx.guardar(); shared.abrirGestionDictacionSeccion(seccionId); shared.ctx.toast('Asignatura vinculada','success');
            };
        }

function abrirCompartirDictacion(seccionMadreId,grupoId,asignaturaId){
            const data=shared.getData();
            const grupo=(shared.ctx.getGruposDictacion?.()||[]).find(g=>g.id===grupoId);
            if(!grupo) return shared.ctx.toast('Grupo no encontrado','error');
            const candidatas=data.secciones
                .filter(s=>s.id!==seccionMadreId&&!grupo.seccionesVinculadasIds.includes(s.id))
                .filter(s=>shared.asignaturasDeNivel(s.nivelId).some(a=>a.id===asignaturaId || grupo.asignaturasEquivalentesIds?.includes(a.id)))
                .sort((a,b)=>a.nombre.localeCompare(b.nombre));
            if(!candidatas.length) return shared.ctx.toast('No hay secciones compatibles para compartir esta asignatura','info');
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3>Compartir asignatura</h3>
                <p style="font-size:0.82rem;color:var(--text-secondary);margin-top:0;">${shared.ctx.escapeHTML(shared.nombreAsignatura(asignaturaId))} dictada en ${shared.ctx.escapeHTML(shared.nombreSeccion(seccionMadreId))}</p>
                <div class="form-group">
                    <label class="form-label">Sección vinculada</label>
                    <select class="form-select" id="seccionCompartirDictacion">
                        ${candidatas.map(s=>shared.ctx.optionHTML(s.id,s.nombre)).join('')}
                    </select>
                </div>
                <div class="form-group"><label class="form-label">Alumnos que se suman (opcional)</label><input class="form-input" id="alumnosCompartir" type="number" min="0" value="0"></div>
                <div class="modal-actions"><button class="btn" id="btnVolverDictacion">Volver</button><button class="btn btn-primary" id="btnConfirmarCompartir">Compartir</button></div>
            </div></div>`;
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget)shared.abrirGestionDictacionSeccion(seccionMadreId);};
            document.getElementById('btnVolverDictacion').onclick=()=>shared.abrirGestionDictacionSeccion(seccionMadreId);
            document.getElementById('btnConfirmarCompartir').onclick=async()=>{
                const seccionId=document.getElementById('seccionCompartirDictacion').value;
                const alumnos=Number(document.getElementById('alumnosCompartir').value)||0;
                const ok=await shared.confirmarCambioCritico({
                    titulo:'Compartir asignatura',
                    mensaje:'Otra sección heredará la planificación de esta asignatura.',
                    queHara:`${shared.nombreSeccion(seccionId)} quedará vinculada a ${shared.nombreAsignatura(asignaturaId)} dictada en ${shared.nombreSeccion(seccionMadreId)}.`,
                    afectara:'Grupo de dictación, alumnos vinculados y reportes de fusión.',
                    noTocara:'No duplicará bloques ni cambiará catálogos.',
                    confirmarTexto:'Compartir',
                    peligro:false
                });
                if(!ok) return;
                shared.ctx.crearPuntoRecuperacion?.('antes_compartir_asignatura');
                shared.ctx.pushUndo?.({tipo:'compartir_asignatura',resumen:`Compartir · ${shared.nombreAsignatura(asignaturaId)}`,afecta:`${shared.nombreSeccion(seccionMadreId)} / ${shared.nombreSeccion(seccionId)}`,critica:true});
                shared.agregarAsignaturaSeccion(asignaturaId,seccionId,'manual');
                if(!shared.ctx.vincularSeccionAGrupo?.(grupoId,seccionId,{alumnos})) return shared.ctx.toast('No se pudo compartir la asignatura','error');
                shared.ctx.guardar(); shared.abrirGestionDictacionSeccion(seccionMadreId); shared.ctx.toast('Sección vinculada al grupo','success');
            };
        }

function abrirModalCarrera(id=null){
            const data = shared.getData();
            const c=id?data.carreras.find(c=>c.id===id):null;
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3>${c?'Editar':'Nueva'} Carrera</h3>
                <div class="form-group">
                    <label class="form-label">Área</label>
                    <input class="form-input" id="areaCarrera" list="areasCarreraList" value="${shared.ctx.escapeAttr(c?shared.areaCarrera(c):'')}" placeholder="Selecciona o escribe un área">
                    <datalist id="areasCarreraList">${shared.areasCarrera().map(a=>`<option value="${shared.ctx.escapeAttr(a)}"></option>`).join('')}</datalist>
                    <small style="color:var(--text-secondary);font-size:0.72rem;">Agrupa carreras en Secciones y Planificación. Si escribes una nueva, quedará disponible para futuros ingresos.</small>
                </div>
                <div class="form-group"><label class="form-label">Código</label><input class="form-input" id="codCarr" value="${shared.ctx.escapeAttr(c?.codigo||'')}"></div>
                <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="nomCarr" value="${shared.ctx.escapeAttr(c?.nombre||'')}"></div>
                <div class="form-group"><label class="form-label">Especialidad</label><select class="form-select" id="especialidadCarrera"><option value="">-- Sin especialidad --</option>${(data.configuracion.especialidades||[]).map(e=>shared.ctx.optionHTML(e,e,c?.especialidad===e)).join('')}</select></div>
                <div class="form-group"><label class="form-label">Tipo</label><select class="form-select" id="tipoCarrera"><option value="Técnico" ${c?.tipo==='Técnico'||!c?.tipo?'selected':''}>Técnico</option><option value="Ingeniería" ${c?.tipo==='Ingeniería'?'selected':''}>Ingeniería</option></select></div>
                <button class="btn btn-primary" id="btnGuardarCarrera">Guardar</button>
            </div></div>`;
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)shared.ctx.cerrarModal();});
            document.getElementById('btnGuardarCarrera').addEventListener('click',()=>shared.guardarCarrera(id));
        }

function guardarCarrera(id){
            const data = shared.getData();
            const area=document.getElementById('areaCarrera').value.trim(), cod=document.getElementById('codCarr').value.trim(), nom=document.getElementById('nomCarr').value.trim(), esp=document.getElementById('especialidadCarrera').value, tipo=document.getElementById('tipoCarrera').value;
            if(!area) return shared.ctx.toast('El área de carrera es obligatoria','error');
            if(!cod) return shared.ctx.toast('El código de carrera es obligatorio','error');
            if(!nom) return shared.ctx.toast('El nombre de carrera es obligatorio','error');
            const duplicado = data.carreras.find(c=>c.codigo.toLowerCase()===cod.toLowerCase() && c.id!==id);
            if(duplicado) return shared.ctx.toast(`Ya existe una carrera con el código "${cod}"`, 'error');
            if(!Array.isArray(data.configuracion.especialidades)) data.configuracion.especialidades=[];
            if(!data.configuracion.especialidades.some(e=>shared.limpiarClave(e)===shared.limpiarClave(area))) data.configuracion.especialidades.push(area);
            if(id){const c=data.carreras.find(c=>c.id===id);c.codigo=cod;c.nombre=nom;c.area=area;c.especialidad=esp;c.tipo=tipo;} else data.carreras.push({id:shared.ctx.genId(),codigo:cod,nombre:nom,area,especialidad:esp,tipo:tipo});
            shared.ctx.guardar(); shared.ctx.cerrarModal(); shared.ctx.refrescarTodo(); shared.ctx.toast('Carrera guardada','success');
        }

function abrirModalNivel(carreraId,nivelId=null){
            const data = shared.getData();
            const n=nivelId?data.niveles.find(n=>n.id===nivelId):null;
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3>${n?'Editar':'Nuevo'} Nivel</h3>
                <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="nomNivel" value="${shared.ctx.escapeAttr(n?.nombre||'')}"></div>
                <label class="check-line"><input type="checkbox" id="nivelTieneOnline" ${n?.tieneOnline?'checked':''}> Presenta asignaturas Online</label>
                <button class="btn btn-primary" id="btnGuardarNivel">Guardar</button>
            </div></div>`;
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)shared.ctx.cerrarModal();});
            document.getElementById('btnGuardarNivel').addEventListener('click',()=>shared.guardarNivel(carreraId,nivelId));
        }

function guardarNivel(carreraId,nivelId){
            const data = shared.getData();
            const nom=document.getElementById('nomNivel').value.trim();
            const tieneOnline=document.getElementById('nivelTieneOnline')?.checked||false;
            if(!nom) return shared.ctx.toast('El nombre del nivel es obligatorio','error');
            const duplicado=data.niveles.find(n=>n.carreraId===carreraId&&n.nombre.toLowerCase()===nom.toLowerCase()&&n.id!==nivelId);
            if(duplicado) return shared.ctx.toast(`Ya existe un nivel "${nom}" en esta carrera`,'error');
            if(nivelId){const n=data.niveles.find(n=>n.id===nivelId);n.nombre=nom;n.tieneOnline=tieneOnline;} else data.niveles.push({id:shared.ctx.genId(),carreraId,nombre:nom,tieneOnline});
            shared.ctx.guardar(); shared.ctx.cerrarModal(); shared.ctx.refrescarTodo(); shared.ctx.toast('Nivel guardado','success');
        }

function abrirModalSeccion(nivelId,seccionId=null,jornadaSugerida=''){
            const data = shared.getData();
            const s=seccionId?data.secciones.find(s=>s.id===seccionId):null;
            const jornadaActual=s?shared.jornadaSeccion(s):(jornadaSugerida||'diurna');
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3>${s?'Editar':'Nueva'} Sección</h3>
                <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="nomSeccion" value="${shared.ctx.escapeAttr(s?.nombre||'')}" placeholder="Ej: D-IEL-N1-P2-C1"></div>
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
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)shared.ctx.cerrarModal();});
            document.getElementById('btnGuardarSeccion').addEventListener('click',()=>shared.guardarSeccion(nivelId,seccionId));
        }

function guardarSeccion(nivelId,seccionId){
            const data = shared.getData();
            const nom=document.getElementById('nomSeccion').value.trim();
            const tipo=document.getElementById('tipoSeccion')?.value||'regular';
            const jornada=document.getElementById('jornadaSeccion')?.value||shared.jornadaSeccion({nombre:nom});
            if(!nom) return shared.ctx.toast('El nombre de sección es obligatorio','error');
            const duplicado=data.secciones.find(s=>s.nivelId===nivelId&&s.nombre.toLowerCase()===nom.toLowerCase()&&s.id!==seccionId);
            if(duplicado) return shared.ctx.toast(`Ya existe una sección "${nom}" en este nivel`,'error');
            if(seccionId){const s=data.secciones.find(s=>s.id===seccionId);s.nombre=nom;s.tipoSeccion=tipo;s.jornada=jornada;} else data.secciones.push({id:shared.ctx.genId(),nivelId,nombre:nom,tipoSeccion:tipo,jornada});
            shared.ctx.guardar(); shared.ctx.cerrarModal(); shared.ctx.refrescarTodo(); shared.ctx.toast('Sección guardada','success');
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

async function crearPlantillaImportacionSecciones(){
            const data=shared.getData();
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
            if((window.XLSX?.utils?.book_new&&window.XLSX?.writeFile) || (shared.ctx.asegurarXLSX && await shared.ctx.asegurarXLSX() && window.XLSX?.utils?.book_new&&window.XLSX?.writeFile)){
                const wb=window.XLSX.utils.book_new();
                const add=(nombre,matriz,cols=[])=>{
                    const ws=window.XLSX.utils.aoa_to_sheet(matriz);
                    if(cols.length) ws['!cols']=cols.map(w=>({wch:w}));
                    window.XLSX.utils.book_append_sheet(wb,ws,nombre);
                };
                add('Secciones',filas,[18,38,24,16,10,14,12,28,24]);
                add('Areas',areas,[30]);
                add('Criterios',tipos,[22,70]);
                add('Ayuda',shared.filasAyudaSecciones(),[24,42,32,68]);
                window.XLSX.writeFile(wb,'Plantilla_Importacion_Secciones.xlsx',{bookSST:true});
                shared.ctx.toast('Plantilla de secciones descargada','success');
                return;
            }
        }

function crearPlantillaAlumnosRealesNivel(){
            const data=shared.getData();
            const filas=[['Sede','Institución','Área','Programa Estudio','Código Programa','Plan','Jornada','N1','N2','N3','N4','N5','N6','N7','N8','Observación']];
            const combinaciones=new Map();
            data.carreras.forEach(c=>{
                const niveles=data.niveles.filter(n=>n.carreraId===c.id);
                const jornadas=new Set();
                niveles.forEach(n=>{
                    data.secciones.filter(s=>s.nivelId===n.id).forEach(s=>jornadas.add(shared.jornadaSeccion(s)==='vespertina'?'V':'D'));
                });
                if(!jornadas.size) jornadas.add('D');
                jornadas.forEach(jornada=>{
                    const plan=c.plan||c.codigo||'';
                    const codigoPrograma=c.codigoBase||String(c.codigo||'').split('-')[0]||'';
                    const key=[shared.areaCarrera(c),codigoPrograma,plan,c.nombre,jornada].join('|');
                    if(!combinaciones.has(key)) combinaciones.set(key,{
                        area:shared.areaCarrera(c),
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
            shared.exportarWorkbookCatalogo('Plantilla_Alumnos_Reales_Nivel_O2026.xlsx',[
                {nombre:'Alumnos_Nivel',matriz:filas,cols:[26,14,34,40,16,18,10,8,8,8,8,8,8,8,8,34]},
                {nombre:'Ayuda',matriz:ayuda,cols:[24,96]}
            ]);
        }

function exportarArchivoSecciones(){
            const data=shared.getData();
            const filas=[['Código carrera','Nombre carrera','Área / especialidad','Tipo carrera','Nivel','Tiene Online','Jornada','Sección','Tipo sección']];
            data.carreras.forEach(c=>{
                const niveles=data.niveles.filter(n=>n.carreraId===c.id).sort(shared.ordenarNivelesDesc);
                if(!niveles.length) filas.push([c.codigo,c.nombre,shared.areaCarrera(c),c.tipo||'', '', '', '', '', '']);
                niveles.forEach(n=>{
                    const secciones=data.secciones.filter(s=>s.nivelId===n.id).sort(shared.ordenarSecciones);
                    if(!secciones.length) filas.push([c.codigo,c.nombre,shared.areaCarrera(c),c.tipo||'',n.nombre,n.tieneOnline?'Sí':'No','','','']);
                    secciones.forEach(s=>filas.push([c.codigo,c.nombre,shared.areaCarrera(c),c.tipo||'',n.nombre,n.tieneOnline?'Sí':'No',shared.etiquetaJornada(shared.jornadaSeccion(s)),s.nombre,s.tipoSeccion||'regular']));
                });
            });
            shared.exportarWorkbookCatalogo('Secciones_exportadas.xlsx',[
                {nombre:'Secciones',matriz:filas,cols:[18,38,24,16,10,14,12,28,24]},
                {nombre:'Areas',matriz:[['Área / especialidad'],...(data.configuracion.especialidades||[]).map(e=>[e])],cols:[30]},
                {nombre:'Criterios',matriz:[['Campo','Valores permitidos'],['Tipo carrera','Técnico, Ingeniería'],['Tiene Online','Sí, No'],['Jornada','Día, Noche'],['Tipo sección','regular, fusionada, equivalente, fusionada-equivalente']],cols:[22,70]},
                {nombre:'Ayuda',matriz:shared.filasAyudaSecciones(),cols:[24,42,32,68]}
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
                if(!shared.ctx.asegurarXLSX || !(await shared.ctx.asegurarXLSX()) || !window.XLSX?.read || !window.XLSX?.utils?.sheet_to_json) return;
            }
            const reader=new FileReader();
            reader.onload=(ev)=>{
                try{
                    const wb=window.XLSX.read(ev.target.result,{type:'array'});
                    const sheet=wb.SheetNames.find(n=>shared.limpiarClave(n).includes('seccion'))||wb.SheetNames[0];
                    const rows=window.XLSX.utils.sheet_to_json(wb.Sheets[sheet],{header:1,defval:''});
                    shared.importarSeccionesDesdeFilas(rows);
                }catch(err){
                    console.error(err);
                    shared.ctx.toast('No se pudo leer el archivo de secciones','error');
                }
            };
            reader.readAsArrayBuffer(file);
        }

function normalizarSiNo(valor){
            const key=shared.limpiarClave(valor);
            return ['si','sí','s','true','1','online'].includes(key);
        }

function normalizarJornadaImportacion(valor,seccion=''){
            const key=shared.limpiarClave(valor||seccion);
            const nom=String(seccion||'').trim().toUpperCase();
            if(key.includes('noche')||key.includes('vesp')||key.includes('vespert')||nom.startsWith('V-')) return 'vespertina';
            return 'diurna';
        }

function normalizarTipoSeccionImportacion(valor,seccion=''){
            const key=shared.limpiarClave(valor);
            if(['fusionada-equivalente','fusionada equivalente','fusion equivalente','equivalente fusionada'].includes(key)) return 'fusionada-equivalente';
            if(key.includes('fusion')) return 'fusionada';
            if(key.includes('equiv')||/\(E\)$/i.test(String(seccion||''))) return 'equivalente';
            if(/\(F\)$/i.test(String(seccion||''))) return 'fusionada';
            return 'regular';
        }

function resolverEspecialidadExistente(valor){
            const txt=shared.capitalizarPalabras(valor);
            if(!txt) return {valor:'',alerta:''};
            const existente=(shared.getData().configuracion.especialidades||[]).find(e=>shared.limpiarClave(e)===shared.limpiarClave(txt));
            return existente?{valor:existente,alerta:''}:{valor:shared.capitalizarPalabras(txt),alerta:''};
        }

function importarSeccionesDesdeFilas(rows){
            const data=shared.getData();
            if(!Array.isArray(rows)||rows.length<2) return shared.ctx.toast('El archivo no contiene secciones para importar','error');
            const header=(rows[0]||[]).map(h=>shared.limpiarClave(h));
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
            if(mapa.codigo===undefined||mapa.nombre===undefined||mapa.nivel===undefined) return shared.ctx.toast('La plantilla debe incluir Código carrera, Nombre carrera y Nivel','error');
            const carrerasPorCodigo=new Map(data.carreras.map(c=>[shared.limpiarClave(c.codigo),c]));
            const nivelesPorClave=new Map(data.niveles.map(n=>[`${n.carreraId}|${shared.limpiarClave(n.nombre)}`,n]));
            const seccionesPorClave=new Map(data.secciones.map(s=>[`${s.nivelId}|${shared.limpiarClave(s.nombre)}`,s]));
            const resumen={carreras:0,niveles:0,secciones:0,actualizadas:0,omitidas:0,alertas:[]};
            shared.ctx.pushUndo?.();
            rows.slice(1).forEach((row,idx)=>{
                const fila=idx+2;
                const codigo=shared.normalizarTextoImportacion(row[mapa.codigo]).toUpperCase();
                const nombre=shared.capitalizarPalabras(row[mapa.nombre]);
                const nivelNombre=shared.normalizarTextoImportacion(row[mapa.nivel]).toUpperCase().replace(/^(\d+)$/,'N$1');
                if(!codigo&&!nombre&&!nivelNombre) return;
                if(!codigo||!nombre||!nivelNombre){
                    resumen.omitidas++;
                    resumen.alertas.push({fila,item:codigo||nombre||'(sin datos)',detalle:'Fila incompleta',tipo:''});
                    return;
                }
                const esp=shared.resolverEspecialidadExistente(row[mapa.especialidad]);
                const tipoCarrera=shared.capitalizarPalabras(row[mapa.tipoCarrera]||'Técnico');
                let carrera=carrerasPorCodigo.get(shared.limpiarClave(codigo));
                const alertasCarrera=esp.alerta?[`Fila ${fila}: ${esp.alerta}`]:[];
                if(carrera){
                    carrera.codigo=codigo; carrera.nombre=nombre; carrera.tipo=tipoCarrera; carrera.area=esp.valor||carrera.area||carrera.especialidad||'Sin área'; carrera.especialidad=esp.valor||carrera.especialidad||''; carrera.alertasImportacion=alertasCarrera; resumen.actualizadas++;
                }else{
                    carrera={id:shared.ctx.genId(),codigo,nombre,area:esp.valor||'Sin área',especialidad:esp.valor,tipo:tipoCarrera,alertasImportacion:alertasCarrera};
                    data.carreras.push(carrera); carrerasPorCodigo.set(shared.limpiarClave(codigo),carrera); resumen.carreras++;
                }
                if(esp.valor&&!data.configuracion.especialidades.some(e=>shared.limpiarClave(e)===shared.limpiarClave(esp.valor))) data.configuracion.especialidades.push(esp.valor);
                if(alertasCarrera.length) resumen.alertas.push({fila,item:codigo,detalle:alertasCarrera.join(' · '),tipo:'carrera',id:carrera.id});
                const nivelKey=`${carrera.id}|${shared.limpiarClave(nivelNombre)}`;
                let nivel=nivelesPorClave.get(nivelKey);
                const tieneOnline=shared.normalizarSiNo(row[mapa.tieneOnline]);
                if(nivel){ nivel.nombre=nivelNombre; if(tieneOnline) nivel.tieneOnline=true; resumen.actualizadas++; }
                else{
                    nivel={id:shared.ctx.genId(),carreraId:carrera.id,nombre:nivelNombre,tieneOnline,alertasImportacion:[]};
                    data.niveles.push(nivel); nivelesPorClave.set(nivelKey,nivel); resumen.niveles++;
                }
                const seccionNombre=shared.normalizarTextoImportacion(row[mapa.seccion]);
                if(!seccionNombre) return;
                const seccionKey=`${nivel.id}|${shared.limpiarClave(seccionNombre)}`;
                let seccion=seccionesPorClave.get(seccionKey);
                const jornada=shared.normalizarJornadaImportacion(row[mapa.jornada],seccionNombre);
                const tipoSeccion=shared.normalizarTipoSeccionImportacion(row[mapa.tipoSeccion],seccionNombre);
                if(seccion){ seccion.nombre=seccionNombre; seccion.jornada=jornada; seccion.tipoSeccion=tipoSeccion; seccion.alertasImportacion=[]; resumen.actualizadas++; }
                else{
                    seccion={id:shared.ctx.genId(),nivelId:nivel.id,nombre:seccionNombre,jornada,tipoSeccion,alertasImportacion:[]};
                    data.secciones.push(seccion); seccionesPorClave.set(seccionKey,seccion); resumen.secciones++;
                }
            });
            shared.ctx.guardar(); shared.ctx.refrescarTodo(); shared.mostrarResultadoImportacionSecciones(resumen);
        }

function mostrarResultadoImportacionSecciones(resumen){
            const filas=resumen.alertas.map(a=>`<tr><td>${shared.ctx.escapeHTML(a.fila)}</td><td>${shared.ctx.escapeHTML(a.item)}</td><td>${shared.ctx.escapeHTML(a.detalle)}</td><td>${a.id&&a.tipo==='carrera'?`<button class="btn btn-xs btn-revisar-carrera-importada" data-id="${shared.ctx.escapeAttr(a.id)}">Revisar</button>`:''}</td></tr>`).join('');
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
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)shared.ctx.cerrarModal();});
            document.getElementById('cerrarImportacionSecciones').addEventListener('click',shared.ctx.cerrarModal);
            document.querySelectorAll('.btn-revisar-carrera-importada').forEach(btn=>btn.addEventListener('click',()=>shared.abrirModalCarrera(btn.dataset.id)));
            shared.ctx.toast(resumen.alertas.length?'Secciones importadas con alertas':'Secciones importadas correctamente',resumen.alertas.length?'warning':'success');
        }
        return {renderCarreras, nombreSeccion, nombreAsignatura, asignaturasDeNivel, asignaturaAplicaSeccion, agregarAsignaturaSeccion, quitarAsignaturaSeccion, gruposCompatiblesParaVincular, grupoCoincideAsignatura, gruposDeAsignaturaSeccion, crearGrupoPropioPorDesvinculacion, desvincularFusionAsignatura, resumenAlumnosGrupoDictacion, renderAlumnosDictacion, renderHistorialFusionDictacion, relacionAsignaturaSeccion, componentesSubseccion, renderSubseccionesAsignatura, renderEstadoDictacion, renderAccionesDictacion, abrirConfigSubseccionesAsignatura, asegurarGrupoParaAlumnos, abrirEditarAlumnosDictacion, contextoDestinoElectiva, vinculosElectivosSeccion, renderElectivasVinculadasSeccion, abrirGestionDictacionSeccion, ofertasElectivas, abrirVincularElectivaSeccion, quitarVinculoElectivo, desvincularFusionDesdeMadre, abrirGestionCompartidas, abrirVincularDictacion, abrirCompartirDictacion, abrirModalCarrera, guardarCarrera, abrirModalNivel, guardarNivel, abrirModalSeccion, guardarSeccion, filasAyudaSecciones, crearPlantillaImportacionSecciones, crearPlantillaAlumnosRealesNivel, exportarArchivoSecciones, abrirImportacionSecciones, leerArchivoSecciones, normalizarSiNo, normalizarJornadaImportacion, normalizarTipoSeccionImportacion, resolverEspecialidadExistente, importarSeccionesDesdeFilas, mostrarResultadoImportacionSecciones};
    }};
})();
