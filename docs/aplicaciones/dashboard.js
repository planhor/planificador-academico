// Aplicación dashboard. Estado y servicios compartidos inyectados, sin copias de datos.
(function(){
    window.PlanhorAplicaciones=window.PlanhorAplicaciones||{};
    window.PlanhorAplicaciones["dashboard"]={create(shared){
function obtenerProgresoSecciones(){
            const data = shared.getData();
            const p=shared.ctx.getPlanificaciones();
            const planesVisibles=(sec,asigId)=>{
                const propios=p.filter(pl=>pl.seccionId===sec.id&&pl.asignaturaId===asigId);
                const vinculados=(Array.isArray(data.gruposDictacion)?data.gruposDictacion:[])
                    .filter(g=>g.seccionMadreId!==sec.id&&g.seccionesVinculadasIds?.includes(sec.id)&&(g.asignaturaId===asigId||g.asignaturasEquivalentesIds?.includes(asigId)))
                    .flatMap(g=>p.filter(pl=>pl.seccionId===g.seccionMadreId&&(pl.asignaturaId===g.asignaturaId||g.asignaturasEquivalentesIds?.includes(pl.asignaturaId))));
                return [...propios,...vinculados];
            };
            return data.secciones.map(sec=>{
                const nivel=data.niveles.find(n=>n.id===sec.nivelId);
                const carreraId=nivel?.carreraId;
                const asignaturaIds=shared.asignaturasDeSeccion(data,sec);
                let requeridos=0, planificados=0;
                asignaturaIds.forEach(asigId=>{
                    const asig=data.asignaturas.find(a=>a.id===asigId);
                    if(!asig) return;
                    const req=(Number(asig.bloquesPresenciales)||0)+(Number(asig.bloquesVirtuales)||0);
                    const hechos=planesVisibles(sec,asigId).length;
                    requeridos+=req;
                    planificados+=Math.min(hechos,req);
                });
                const porcentaje=requeridos?Math.round(planificados/requeridos*100):0;
                return {
                    id:sec.id,
                    nombre:sec.nombre,
                    carreraId,
                    carrera:data.carreras.find(c=>c.id===carreraId)?.codigo||'',
                    nivel:nivel?.nombre||'',
                    nivelId:nivel?.id||'',
                    requeridos,
                    planificados,
                    porcentaje:Math.min(100,porcentaje)
                };
            }).filter(x=>x.requeridos>0);
        }

function colorProgreso(pct){
            if(pct>=100) return 'var(--success)';
            if(pct>=70) return 'var(--warning)';
            return 'var(--danger)';
        }

function agruparProgresoPorCarrera(items){
            const data=shared.getData();
            const grupos=new Map();
            items.forEach(item=>{
                const carrera=data.carreras.find(c=>c.id===item.carreraId);
                const key=item.carreraId||'sin-carrera';
                if(!grupos.has(key)) grupos.set(key,{
                    id:key,
                    nombre:carrera?.nombre||item.carrera||'Sin carrera',
                    codigo:carrera?.codigo||item.carrera||'',
                    secciones:[],
                    requeridos:0,
                    planificados:0
                });
                const g=grupos.get(key);
                g.secciones.push(item);
                g.requeridos+=item.requeridos;
                g.planificados+=item.planificados;
            });
            return Array.from(grupos.values()).map(g=>Object.assign(g,{
                porcentaje:g.requeridos?Math.round(g.planificados/g.requeridos*100):0,
                completas:g.secciones.filter(s=>s.porcentaje>=100).length
            })).sort((a,b)=>a.porcentaje-b.porcentaje||a.nombre.localeCompare(b.nombre));
        }

function abrirDetalleProgresoCarrera(carreraId){
            const data=shared.getData();
            const modal=document.getElementById('modalContainer');
            if(!modal) return;
            const items=shared.obtenerProgresoSecciones().filter(i=>i.carreraId===carreraId);
            if(!items.length) return shared.ctx.toast('No hay secciones con requerimientos en esta carrera','info');
            const carrera=data.carreras.find(c=>c.id===carreraId);
            const renderContenido=(q='')=>{
                const filtro=q.trim().toLowerCase();
                const porNivel=new Map();
                items
                    .filter(item=>!filtro || [item.nombre,item.nivel,item.carrera].join(' ').toLowerCase().includes(filtro))
                    .forEach(item=>{
                        const key=item.nivelId||item.nivel||'sin-nivel';
                        if(!porNivel.has(key)) porNivel.set(key,{nombre:item.nivel||'Sin nivel',items:[],requeridos:0,planificados:0});
                        const g=porNivel.get(key);
                        g.items.push(item);
                        g.requeridos+=item.requeridos;
                        g.planificados+=item.planificados;
                    });
                const niveles=Array.from(porNivel.values()).sort((a,b)=>a.nombre.localeCompare(b.nombre));
                if(!niveles.length) return '<p class="auto-plan-empty">No hay secciones que coincidan con la búsqueda.</p>';
                return niveles.map(nivel=>{
                    const pct=nivel.requeridos?Math.round(nivel.planificados/nivel.requeridos*100):0;
                    const completas=nivel.items.filter(i=>i.porcentaje>=100).length;
                    return `<div class="dashboard-level-group">
                        <div class="dashboard-level-header">
                            <div>
                                <strong>${shared.ctx.escapeHTML(nivel.nombre)}</strong>
                                <span>${completas}/${nivel.items.length} secciones completas · ${nivel.planificados}/${nivel.requeridos} bloques</span>
                            </div>
                            <div class="dashboard-progress-value">${pct}%</div>
                        </div>
                        <div class="dashboard-progress-track"><div class="dashboard-progress-fill" style="width:${Math.min(100,pct)}%;background:${shared.colorProgreso(pct)};"></div></div>
                        <div class="dashboard-section-grid">
                            ${nivel.items.sort((a,b)=>a.porcentaje-b.porcentaje||a.nombre.localeCompare(b.nombre)).map(sec=>`
                                <button class="dashboard-section-card" data-seccion="${shared.ctx.escapeAttr(sec.id)}" type="button">
                                    <span>${shared.ctx.escapeHTML(sec.nombre)}</span>
                                    <strong>${sec.porcentaje}%</strong>
                                    <small>${sec.planificados}/${sec.requeridos}</small>
                                </button>
                            `).join('')}
                        </div>
                    </div>`;
                }).join('');
            };
            const totalReq=items.reduce((acc,i)=>acc+i.requeridos,0);
            const totalPlan=items.reduce((acc,i)=>acc+i.planificados,0);
            const promedio=totalReq?Math.round(totalPlan/totalReq*100):0;
            modal.innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal auto-general-modal">
                    <div class="modal-header">
                        <h3>${shared.ctx.escapeHTML(carrera?.nombre||carrera?.codigo||'Carrera')}</h3>
                        <p>${items.filter(i=>i.porcentaje>=100).length}/${items.length} secciones completas · avance general ${promedio}%</p>
                    </div>
                    <div class="search-box input-with-clear">
                        <input class="form-input" id="buscarProgresoCarrera" placeholder="Buscar sección o nivel..." autocomplete="off">
                    </div>
                    <div id="detalleProgresoCarrera" class="dashboard-career-detail">${renderContenido()}</div>
                    <div class="modal-actions">
                        <button class="btn" id="btnCerrarProgresoCarrera">Cerrar</button>
                    </div>
                </div></div>`;
            const cerrar=()=>{modal.innerHTML='';};
            document.getElementById('btnCerrarProgresoCarrera').onclick=cerrar;
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget) cerrar();};
            document.getElementById('buscarProgresoCarrera').oninput=(e)=>{
                document.getElementById('detalleProgresoCarrera').innerHTML=renderContenido(e.target.value);
            };
            modal.querySelector('#detalleProgresoCarrera').onclick=(e)=>{
                const btn=e.target.closest('[data-seccion]');
                if(!btn || !shared.ctx.irASeccion) return;
                cerrar();
                shared.ctx.irASeccion(btn.dataset.seccion,{mensaje:'Sección abierta desde avance por carrera'});
            };
        }

function renderBloqueProgresoSecciones(){
            const data = shared.getData();
            const cfg=data.configuracion.dashboard||{};
            if(cfg.seccionesATiempo===false) return '';
            const items=shared.obtenerProgresoSecciones();
            if(!items.length) return '';
            const completas=items.filter(i=>i.porcentaje>=100).length;
            const promedio=Math.round(items.reduce((acc,i)=>acc+i.porcentaje,0)/items.length);
            const carreras=shared.agruparProgresoPorCarrera(items);
            return `
                <div class="dashboard-progress-panel">
                    <div class="dashboard-progress-title">Avance de planificación por carrera</div>
                    <div class="dashboard-progress-subtitle">${completas}/${items.length} secciones completas · promedio ${promedio}% · selecciona una carrera para ver niveles y secciones</div>
                    <div class="dashboard-progress-list">
                        ${carreras.map(item=>`
                            <div class="dashboard-progress-row dashboard-career-link" data-carrera="${shared.ctx.escapeAttr(item.id)}" role="button" tabindex="0" title="Ver niveles y secciones">
                                <div class="dashboard-progress-meta">
                                    <strong>${shared.ctx.escapeHTML(item.codigo||item.nombre)}</strong>
                                    <span>${shared.ctx.escapeHTML(item.nombre)} · ${item.completas}/${item.secciones.length} secciones completas</span>
                                </div>
                                <div class="dashboard-progress-track" aria-label="Avance ${item.porcentaje}%">
                                    <div class="dashboard-progress-fill" style="width:${item.porcentaje}%;background:${shared.colorProgreso(item.porcentaje)};"></div>
                                </div>
                                <div class="dashboard-progress-value">${item.porcentaje}%</div>
                                <div class="dashboard-progress-count">${item.planificados}/${item.requeridos}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        }

function bloquesPorDia(planes){
            const mapa=new Map();
            planes.forEach(p=>{
                const key=Number(p.dia);
                if(!mapa.has(key)) mapa.set(key,[]);
                mapa.get(key).push(Number(p.bloque));
            });
            return mapa;
        }

function contarVentanas(bloques){
            const unicos=[...new Set(bloques)].sort((a,b)=>a-b);
            if(unicos.length<2) return 0;
            let ventanas=0;
            for(let i=1;i<unicos.length;i++) ventanas+=Math.max(0,unicos[i]-unicos[i-1]-1);
            return ventanas;
        }

function calcularCalidadHorario(){
            const data=shared.getData();
            const planes=shared.ctx.getPlanificaciones();
            const resultado={ventanasSeccion:[],ventanasDocente:[],diasCargados:[],extremos:[],virtuales:[],nn:[],tro2:[]};
            data.secciones.forEach(sec=>{
                const secPlanes=planes.filter(p=>p.seccionId===sec.id);
                shared.bloquesPorDia(secPlanes).forEach((bloques,dia)=>{
                    const ordenados=bloques.sort((a,b)=>a-b);
                    const ventanas=shared.contarVentanas(ordenados);
                    if(ventanas>0) resultado.ventanasSeccion.push({seccionId:sec.id,seccion:sec.nombre,dia,bloques:ordenados,valor:ventanas});
                    if(ordenados.length>=9) resultado.diasCargados.push({tipo:'Sección',seccionId:sec.id,nombre:sec.nombre,dia,bloques:ordenados.length});
                });
            });
            data.docentes.filter(d=>d.id!==shared.ctx.DOCENTE_NN_ID).forEach(doc=>{
                const docPlanes=planes.filter(p=>p.docenteId===doc.id);
                shared.bloquesPorDia(docPlanes).forEach((bloques,dia)=>{
                    const ordenados=bloques.sort((a,b)=>a-b);
                    const ventanas=shared.contarVentanas(ordenados);
                    const primero=docPlanes.find(p=>Number(p.dia)===dia);
                    if(ventanas>0) resultado.ventanasDocente.push({docente:`${doc.nombre||''} ${doc.apellido||''}`.trim(),seccionId:primero?.seccionId,dia,bloques:ordenados,valor:ventanas});
                    if(ordenados.length>=9) resultado.diasCargados.push({tipo:'Docente',seccionId:primero?.seccionId,nombre:`${doc.nombre||''} ${doc.apellido||''}`.trim(),dia,bloques:ordenados.length});
                });
            });
            planes.forEach(p=>{
                const asig=data.asignaturas.find(a=>a.id===p.asignaturaId);
                const sec=data.secciones.find(s=>s.id===p.seccionId);
                const base={seccionId:p.seccionId,asignaturaId:p.asignaturaId,seccion:sec?.nombre||'',asignatura:asig?.codigo||asig?.nombre||'',dia:Number(p.dia),bloque:Number(p.bloque)};
                if(Number(p.bloque)<=2 || Number(p.bloque)>=16) resultado.extremos.push(base);
                if(p.tipoPresencial===false && p.dia!==5 && Number(p.bloque)>2 && Number(p.bloque)<16) resultado.virtuales.push(base);
                if(p.docenteId===shared.ctx.DOCENTE_NN_ID) resultado.nn.push(base);
                if(p.salaId===shared.ctx.SALA_TRO2_ID) resultado.tro2.push(base);
            });
            return resultado;
        }

function calidadItems(calidad){
            return [
                {id:'ventanasSeccion',titulo:'Ventanas sección',valor:calidad.ventanasSeccion.length,tono:'warning'},
                {id:'ventanasDocente',titulo:'Ventanas docente',valor:calidad.ventanasDocente.length,tono:'warning'},
                {id:'diasCargados',titulo:'Días cargados',valor:calidad.diasCargados.length,tono:'danger'},
                {id:'extremos',titulo:'Bloques extremos',valor:calidad.extremos.length,tono:'info'},
                {id:'virtuales',titulo:'Virtuales a revisar',valor:calidad.virtuales.length,tono:'warning'},
                {id:'nn',titulo:'Docente NN',valor:calidad.nn.length,tono:'warning'},
                {id:'tro2',titulo:'TRO2',valor:calidad.tro2.length,tono:'info'}
            ];
        }

function agruparCalidadPorAsignatura(datos){
            const grupos=new Map();
            datos.forEach(x=>{
                const key=[x.seccionId||'',x.asignaturaId||'',x.dia??'',x.docente||'',x.nombre||''].join('|');
                if(!grupos.has(key)) grupos.set(key,Object.assign({},x,{bloques:[],valor:0}));
                const g=grupos.get(key);
                if(x.bloque!==undefined) g.bloques.push(Number(x.bloque));
                if(Array.isArray(x.bloques)) g.bloques.push(...x.bloques.map(Number));
                g.valor+=Number(x.valor||0);
            });
            return Array.from(grupos.values()).map(g=>Object.assign(g,{
                bloques:[...new Set(g.bloques)].sort((a,b)=>a-b),
                valor:g.valor||undefined
            }));
        }

function abrirDetalleCalidad(tipo){
            const calidad=shared.calcularCalidadHorario();
            const item=shared.calidadItems(calidad).find(x=>x.id===tipo);
            const datos=['extremos','virtuales','nn','tro2'].includes(tipo)
                ? shared.agruparCalidadPorAsignatura(calidad[tipo]||[])
                : (calidad[tipo]||[]);
            const modal=document.getElementById('modalContainer');
            if(!modal || !item) return;
            const renderFila=(x)=>{
                const dia=shared.ctx.DIAS[x.dia]||'';
                const bloques=Array.isArray(x.bloques)?x.bloques.map(b=>`B${b}`).join(', '):`B${x.bloque}`;
                const nombre=x.seccion||x.docente||x.nombre||'';
                const obs=x.asignatura?`${x.asignatura} · ${dia} ${bloques}`:`${dia} ${bloques}`;
                return `<tr>
                    <td>${shared.ctx.escapeHTML(nombre)}</td>
                    <td>${shared.ctx.escapeHTML(obs)}</td>
                    <td>${x.valor!==undefined?shared.ctx.escapeHTML(x.valor):''}</td>
                    <td>${x.seccionId?`<button class="btn btn-xs report-action-btn" data-seccion="${shared.ctx.escapeAttr(x.seccionId)}" data-asignatura="${shared.ctx.escapeAttr(x.asignaturaId||'')}" type="button">Revisar</button>`:''}</td>
                </tr>`;
            };
            modal.innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal auto-general-modal">
                    <div class="modal-header">
                        <h3>${shared.ctx.escapeHTML(item.titulo)}</h3>
                        <p>${datos.length} grupo(s) detectado(s). Úsalo como señal de revisión, no como error automático.</p>
                    </div>
                    ${datos.length?`<table class="report-table"><thead><tr><th>Elemento</th><th>Detalle</th><th>Valor</th><th>Acción</th></tr></thead><tbody>${datos.slice(0,80).map(renderFila).join('')}</tbody></table>`:'<p class="auto-plan-empty">No hay elementos para revisar en este indicador.</p>'}
                    ${datos.length>80?'<p class="auto-plan-empty">Se muestran los primeros 80 elementos.</p>':''}
                    <div class="modal-actions"><button class="btn" id="btnCerrarCalidad">Cerrar</button></div>
                </div></div>`;
            const cerrar=()=>{modal.innerHTML='';};
            document.getElementById('btnCerrarCalidad').onclick=cerrar;
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget) cerrar();};
        }

function renderCalidadHorario(){
            const data=shared.getData();
            const cfg=data.configuracion.dashboard||{};
            if(cfg.calidadHorario===false) return '';
            const calidad=shared.calcularCalidadHorario();
            const items=shared.calidadItems(calidad);
            const total=items.reduce((acc,i)=>acc+i.valor,0);
            return `<div class="dashboard-quality-panel">
                <div class="dashboard-progress-title">Calidad de horario</div>
                <div class="dashboard-progress-subtitle">${total} señal(es) de revisión detectadas · presiona un indicador para ver detalle</div>
                <div class="dashboard-quality-grid">
                    ${items.map(i=>`<button class="dashboard-quality-card ${i.tono}" data-calidad="${shared.ctx.escapeAttr(i.id)}" type="button">
                        <strong>${i.valor}</strong>
                        <span>${shared.ctx.escapeHTML(i.titulo)}</span>
                    </button>`).join('')}
                </div>
            </div>`;
        }

function calcularScoreGlobalHorario(){
            const data=shared.getData();
            const planes=shared.ctx.getPlanificaciones();
            const calidad=shared.calcularCalidadHorario();
            const progreso=shared.obtenerProgresoSecciones();
            const requeridos=progreso.reduce((acc,x)=>acc+x.requeridos,0);
            const planificados=progreso.reduce((acc,x)=>acc+x.planificados,0);
            const cobertura=requeridos?Math.round(planificados/requeridos*100):0;
            const conflictos=shared.detectarConflictosBase().length;
            const nivelesPeso={'desactivado':0,bajo:0.55,medio:1,alto:1.45,'muy-alto':2};
            const solverPesos=data.configuracion?.solverPesos||{};
            const pesoSolver=(criterio,base)=>base*(nivelesPeso[solverPesos[criterio]||'medio']??1);
            const etiquetaPeso=(criterio)=>{
                const labels={'desactivado':'desactivado',bajo:'bajo',medio:'medio',alto:'alto','muy-alto':'muy alto'};
                return labels[solverPesos[criterio]||'medio']||'medio';
            };
            const seccionPorId=new Map(data.secciones.map(s=>[s.id,s]));
            const docenteDia=new Map();
            let fueraJornada=0;
            planes.forEach(p=>{
                const sec=seccionPorId.get(p.seccionId);
                const bloque=Number(p.bloque)||0;
                if(sec?.jornada==='diurna' && bloque>12) fueraJornada++;
                if(sec?.jornada==='vespertina' && bloque>0 && bloque<13) fueraJornada++;
                if(p.docenteId && p.docenteId!==shared.ctx.DOCENTE_NN_ID){
                    const key=`${p.docenteId}|${p.dia}`;
                    docenteDia.set(key,(docenteDia.get(key)||0)+1);
                }
            });
            const excesoDiarioDocente=[...docenteDia.values()].filter(total=>total>13).length;
            const herenciasPendientes=(data.gruposDictacion||[]).filter(g=>g.estado&&g.estado!=='resuelto').length;
            const metricas=[
                {id:'cobertura',criterio:'bloquesFaltantes',titulo:'Cobertura',valor:100-cobertura,impacto:Math.max(0,100-cobertura),peso:pesoSolver('bloquesFaltantes',1.2),detalle:`${planificados}/${requeridos} bloques requeridos`},
                {id:'ventanasSeccion',criterio:'ventanasEstudiantes',titulo:'Ventanas de sección',valor:calidad.ventanasSeccion.length,impacto:calidad.ventanasSeccion.length*4,peso:pesoSolver('ventanasEstudiantes',1.1),detalle:'Afectan continuidad del estudiante'},
                {id:'ventanasDocente',criterio:'ventanasDocentes',titulo:'Ventanas docentes',valor:calidad.ventanasDocente.length,impacto:calidad.ventanasDocente.length*3,peso:pesoSolver('ventanasDocentes',1),detalle:'Afectan calidad del horario docente'},
                {id:'conflictos',criterio:'topesDuros',titulo:'Conflictos',valor:conflictos,impacto:conflictos*14,peso:pesoSolver('topesDuros',1.4),detalle:'Topes de docente o sala'},
                {id:'diasCargados',criterio:'distribucionSemanal',titulo:'Días cargados',valor:calidad.diasCargados.length,impacto:calidad.diasCargados.length*5,peso:pesoSolver('distribucionSemanal',0.9),detalle:'Días con demasiados bloques'},
                {id:'fueraJornada',criterio:'respetoJornada',titulo:'Fuera de jornada',valor:fueraJornada,impacto:fueraJornada*8,peso:pesoSolver('respetoJornada',1.2),detalle:'Bloques fuera de la jornada de la sección'},
                {id:'excesoDocente',criterio:'excesoDiarioDocente',titulo:'Exceso docente',valor:excesoDiarioDocente,impacto:excesoDiarioDocente*7,peso:pesoSolver('excesoDiarioDocente',1.1),detalle:'Días docentes sobre 13 bloques'},
                {id:'nn',criterio:'bloquesFaltantes',titulo:'Docente NN',valor:calidad.nn.length,impacto:calidad.nn.length*2.5,peso:pesoSolver('bloquesFaltantes',0.8),detalle:'Bloques sin docente real'},
                {id:'tro2',criterio:'salasCorrectas',titulo:'TRO2',valor:calidad.tro2.length,impacto:calidad.tro2.length*2,peso:pesoSolver('salasCorrectas',0.7),detalle:'Bloques sin sala definitiva'},
                {id:'virtuales',criterio:'virtuales',titulo:'Virtuales a revisar',valor:calidad.virtuales.length,impacto:calidad.virtuales.length*2,peso:pesoSolver('virtuales',0.6),detalle:'Virtuales fuera del patrón preferido'},
                {id:'herencias',criterio:'transversalesHeredadas',titulo:'Herencias pendientes',valor:herenciasPendientes,impacto:herenciasPendientes*4,peso:pesoSolver('transversalesHeredadas',0.8),detalle:'Relaciones compartidas sin resolver'}
            ];
            const perdida=Math.round(metricas.reduce((acc,m)=>acc+(m.impacto*m.peso),0));
            const score=Math.max(0,Math.min(100,100-perdida));
            const principales=metricas
                .filter(m=>m.peso>0&&(m.valor>0||m.id==='cobertura'))
                .sort((a,b)=>(b.impacto*b.peso)-(a.impacto*a.peso))
                .slice(0,4)
                .map(m=>Object.assign({},m,{detalle:`${m.detalle} · peso ${etiquetaPeso(m.criterio)}`}));
            return {score,cobertura,planes:planes.length,requeridos,planificados,perdida,metricas,principales};
        }

function renderScoreGlobalHorario(){
            const data=shared.getData();
            const cfg=data.configuracion.dashboard||{};
            if(cfg.calidadHorario===false) return '';
            const score=shared.calcularScoreGlobalHorario();
            const tono=score.score>=85?'success':score.score>=65?'warning':'danger';
            const color=score.score>=85?'var(--success)':score.score>=65?'var(--warning)':'var(--danger)';
            return `<div class="global-score-panel ${tono}">
                <div class="global-score-main">
                    <div>
                        <div class="dashboard-progress-title">Score global del horario</div>
                        <div class="dashboard-progress-subtitle">Brújula inicial del optimizador · usa los pesos configurables de criterios del solver</div>
                    </div>
                    <div class="global-score-value" style="color:${color};">${score.score}%</div>
                </div>
                <div class="global-score-track"><div style="width:${score.score}%;background:${color};"></div></div>
                <div class="global-score-grid">
                    <div><strong>${score.cobertura}%</strong><span>Cobertura</span></div>
                    <div><strong>${score.planificados}/${score.requeridos}</strong><span>Bloques</span></div>
                    <div><strong>${score.perdida}</strong><span>Pérdida</span></div>
                    <div><strong>${score.planes}</strong><span>Planificados</span></div>
                </div>
                <div class="global-score-losses">
                    ${score.principales.map(m=>`<button class="global-score-loss" data-score-loss="${shared.ctx.escapeAttr(m.id)}" type="button">
                        <strong>${shared.ctx.escapeHTML(m.titulo)}</strong>
                        <span>${shared.ctx.escapeHTML(String(m.valor))} · ${shared.ctx.escapeHTML(m.detalle)}</span>
                    </button>`).join('')}
                </div>
            </div>`;
        }

function renderValidacionPrevia(){
            const data=shared.getData();
            const cfg=data.configuracion.dashboard||{};
            if(cfg.validacionPrevia===false) return '';
            const issues=shared.calcularValidacionPrevia();
            const counts=issues.reduce((acc,x)=>{
                acc[x.severidad]=(acc[x.severidad]||0)+1;
                return acc;
            },{critico:0,advertencia:0,info:0});
            const estado=counts.critico?'No listo':(counts.advertencia?'Revisar':'Listo');
            const tono=counts.critico?'danger':(counts.advertencia?'warning':'success');
            const destacados=issues.slice(0,4);
            return `<div class="dashboard-validation-panel ${tono}">
                <div class="dashboard-validation-header">
                    <div>
                        <div class="dashboard-progress-title">Validación previa</div>
                        <div class="dashboard-progress-subtitle">${issues.length ? `${issues.length} señal(es) antes de autoplanificar` : 'Datos listos para planificar con seguridad'}</div>
                    </div>
                    <button class="btn btn-sm" data-report="validacionPrevia" type="button">Ver detalle</button>
                </div>
                <div class="dashboard-validation-grid">
                    <div><strong>${counts.critico||0}</strong><span>Críticas</span></div>
                    <div><strong>${counts.advertencia||0}</strong><span>Advertencias</span></div>
                    <div><strong>${counts.info||0}</strong><span>Revisión</span></div>
                    <div><strong>${shared.ctx.escapeHTML(estado)}</strong><span>Estado</span></div>
                </div>
                ${destacados.length?`<div class="dashboard-validation-list">
                    ${destacados.map(x=>`<div class="dashboard-validation-item ${shared.tonoSeveridad[x.severidad]||'info'}">
                        <span>${shared.ctx.escapeHTML(shared.etiquetaSeveridad[x.severidad]||x.severidad)}</span>
                        <strong>${shared.ctx.escapeHTML(x.categoria)}</strong>
                        <em>${shared.ctx.escapeHTML(x.elemento)}</em>
                    </div>`).join('')}
                </div>`:''}
            </div>`;
        }

function abrirDetallePreparacionCarrera(carreraId){
            const modal=document.getElementById('modalContainer');
            if(!modal) return;
            const items=shared.calcularPreparacionSecciones().filter(x=>x.carreraId===carreraId);
            if(!items.length) return shared.ctx.toast('No hay secciones para esta carrera','info');
            const carrera=items[0];
            const porNivel=new Map();
            items.forEach(item=>{
                const key=item.nivelId||item.nivel||'sin-nivel';
                if(!porNivel.has(key)) porNivel.set(key,{nombre:item.nivel,items:[]});
                porNivel.get(key).items.push(item);
            });
            const renderSeccion=(s)=>`
                <button class="dashboard-section-card preparation-section-card ${s.estado==='No listo'?'danger':s.estado==='Revisar'?'warning':'success'}" data-seccion="${shared.ctx.escapeAttr(s.id)}" type="button">
                    <span>${shared.ctx.escapeHTML(s.nombre)}</span>
                    <strong>${s.puntaje}%</strong>
                    <small>${shared.ctx.escapeHTML(s.estado)} · C${s.criticos} A${s.advertencias} R${s.info}</small>
                </button>`;
            const niveles=Array.from(porNivel.values()).sort((a,b)=>a.nombre.localeCompare(b.nombre));
            modal.innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal auto-general-modal">
                    <div class="modal-header">
                        <h3>${shared.ctx.escapeHTML(carrera.carrera)}</h3>
                        <p>Preparación previa por nivel y sección. Abre una sección para corregir o completar datos antes de autoplanificar.</p>
                    </div>
                    <div class="dashboard-career-detail">
                        ${niveles.map(nivel=>{
                            const promedio=Math.round(nivel.items.reduce((acc,s)=>acc+s.puntaje,0)/Math.max(1,nivel.items.length));
                            return `<div class="dashboard-level-group">
                                <div class="dashboard-level-header">
                                    <div>
                                        <strong>${shared.ctx.escapeHTML(nivel.nombre)}</strong>
                                        <span>${nivel.items.filter(s=>s.estado==='Listo').length}/${nivel.items.length} listas · promedio ${promedio}%</span>
                                    </div>
                                    <div class="dashboard-progress-value">${promedio}%</div>
                                </div>
                                <div class="dashboard-section-grid">${nivel.items.map(renderSeccion).join('')}</div>
                            </div>`;
                        }).join('')}
                    </div>
                    <div class="modal-actions"><button class="btn" id="btnCerrarPreparacion">Cerrar</button></div>
                </div></div>`;
            const cerrar=()=>{modal.innerHTML='';};
            document.getElementById('btnCerrarPreparacion').onclick=cerrar;
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget) cerrar();};
        }

function renderPreparacionPorCarrera(){
            const data=shared.getData();
            const cfg=data.configuracion.dashboard||{};
            if(cfg.validacionPrevia===false) return '';
            const items=shared.calcularPreparacionSecciones();
            if(!items.length) return '';
            const carreras=shared.agruparPreparacionPorCarrera(items);
            const listas=items.filter(s=>s.estado==='Listo').length;
            return `<div class="dashboard-preparation-panel">
                <div class="dashboard-progress-title">Preparación por carrera</div>
                <div class="dashboard-progress-subtitle">${listas}/${items.length} secciones listas · presiona una carrera para ver niveles y secciones</div>
                <div class="dashboard-progress-list">
                    ${carreras.map(c=>`
                        <div class="dashboard-progress-row dashboard-preparation-link" data-preparacion-carrera="${shared.ctx.escapeAttr(c.id)}" role="button" tabindex="0" title="Ver preparación por sección">
                            <div class="dashboard-progress-meta">
                                <strong>${shared.ctx.escapeHTML(c.codigo||c.nombre)}</strong>
                                <span>${shared.ctx.escapeHTML(c.nombre)} · ${c.listas} listas · ${c.revisar} revisar · ${c.noListas} no listas</span>
                            </div>
                            <div class="dashboard-progress-track" aria-label="Preparación ${c.puntaje}%">
                                <div class="dashboard-progress-fill" style="width:${Math.min(100,c.puntaje)}%;background:${shared.colorProgreso(c.puntaje)};"></div>
                            </div>
                            <div class="dashboard-progress-value">${c.puntaje}%</div>
                            <div class="dashboard-progress-count">C${c.criticos} A${c.advertencias}</div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

function renderResumenCriteriosAsignatura(){
            const data=shared.getData();
            const cfg=data.configuracion.dashboard||{};
            if(cfg.criteriosAsignatura===false || !data.asignaturas.length) return '';
            const contar=(campo,labels,defecto)=>Object.entries(data.asignaturas.reduce((acc,a)=>{
                const key=labels[a?.[campo]]?a[campo]:defecto;
                acc[key]=(acc[key]||0)+1;
                return acc;
            },{})).map(([k,v])=>({label:labels[k]||k,total:v})).sort((a,b)=>b.total-a.total||a.label.localeCompare(b.label));
            const grupos=[
                {titulo:'Área', items:contar('area',shared.LABEL_CRITERIOS.area,'especialidad')},
                {titulo:'Modalidad', items:contar('modalidad',shared.LABEL_CRITERIOS.modalidad,'lectiva')},
                {titulo:'Condición', items:contar('condicion',shared.LABEL_CRITERIOS.condicion,'normal')}
            ];
            return `<div class="dashboard-criteria-panel">
                <div class="dashboard-progress-title">Resumen por criterios de asignatura</div>
                <div class="dashboard-progress-subtitle">${data.asignaturas.length} asignaturas clasificadas</div>
                <div class="dashboard-criteria-grid">
                    ${grupos.map(g=>`<div>
                        <strong>${shared.ctx.escapeHTML(g.titulo)}</strong>
                        <div>${g.items.map(item=>`<span class="item-chip dashboard-criteria-chip">${shared.ctx.escapeHTML(item.label)}: ${item.total}</span>`).join('')}</div>
                    </div>`).join('')}
                </div>
            </div>`;
        }

function renderDashboard(){
            const data = shared.getData();
            const cont=document.getElementById('dashboardContenido');
            if(!cont) return;
            const firmaDashboard=shared.firmaDatosReporte();
            if(cont.dataset.dashboardFirma===firmaDashboard && cont.innerHTML.trim()) return;
            const cfg=data.configuracion.dashboard||{};
            const p=shared.ctx.getPlanificaciones();
            const cards=[];
            if(data.ultimoAutoGeneral){
                const fecha=data.ultimoAutoGeneral.ts ? new Date(data.ultimoAutoGeneral.ts).toLocaleDateString() : '';
                cards.push({t:`🧭 Último Auto-general${fecha?` · ${fecha}`:''}`,v:data.ultimoAutoGeneral.seccionesConCambio||0,c:'var(--accent)',autoGeneral:true});
            }
            const autosActivos=(data.autoEjecuciones||[]).filter(e=>e.ids?.some(id=>data.planificaciones.some(p=>p.id===id))).length;
            if(autosActivos){
                cards.push({t:'↩ Revertir autos',v:autosActivos,c:'var(--danger)',undoAuto:true});
            }
            if(cfg.totalAsignaturas!==false) cards.push({t:'📦 Asignaturas',v:data.asignaturas.length});
            if(cfg.totalDocentes!==false) cards.push({t:'👨‍🏫 Docentes',v:data.docentes.filter(d=>d.id!==shared.ctx.DOCENTE_NN_ID).length,report:'cargaDocente'});
            if(cfg.totalBloques!==false) cards.push({t:'📋 Bloques planificados',v:p.length});
            if(cfg.presencialVirtual!==false){
                const pres=p.filter(x=>x.tipoPresencial!==false).length;
                const vir=p.filter(x=>x.tipoPresencial===false).length;
                cards.push({t:'🏛️ Presenciales',v:`${pres} (${pres*18}h)`});
                cards.push({t:'💻 Virtuales',v:`${vir} (${vir*18}h)`});
            }
            if(cfg.incompletas!==false){
                const inc=data.asignaturas.filter(a=>{const pp=p.filter(pl=>pl.asignaturaId===a.id); return pp.filter(x=>x.tipoPresencial!==false).length<a.bloquesPresenciales||pp.filter(x=>x.tipoPresencial===false).length<a.bloquesVirtuales;}).length;
                if(inc>0) cards.push({t:'⚠️ Incompletas',v:inc,c:'var(--danger)',report:'incompletas'});
            }
            const integridad=shared.calcularIntegridadDatos();
            const integridadCritica=integridad.filter(x=>x.severidad==='critico').length;
            const integridadAdvertencia=integridad.filter(x=>x.severidad==='advertencia').length;
            if(integridadCritica||integridadAdvertencia){
                cards.push({
                    t:'🛡️ Integridad de datos',
                    v:integridadCritica?`${integridadCritica} críticos`:`${integridadAdvertencia} revisión`,
                    c:integridadCritica?'var(--danger)':'var(--warning)',
                    report:'integridadDatos'
                });
            }
            if(cfg.docenteNN!==false){
                const gruposNN=new Set(p.filter(x=>x.docenteId===shared.ctx.DOCENTE_NN_ID).map(x=>`${x.asignaturaId}_${x.seccionId}`));
                if(gruposNN.size) cards.push({t:'👤 Asignaturas con Docente NN',v:gruposNN.size,c:'var(--warning)',report:'docenteNN'});
            }
            if(cfg.tro2!==false){
                const gruposTro2=new Set(p.filter(x=>x.salaId===shared.ctx.SALA_TRO2_ID).map(x=>`${x.asignaturaId}_${x.seccionId}`));
                if(gruposTro2.size) cards.push({t:'📍 Asignaturas en TRO2',v:gruposTro2.size,c:'var(--warning)',report:'tro2'});
            }
            const marcadasRevision=new Set(p.filter(x=>x.revisionMarcada).map(x=>`${x.asignaturaId}_${x.seccionId}_${x.componenteId||''}`));
            const externasGestion=new Set(p.filter(x=>x.estadoGestionExterna==='gestion').map(x=>`${x.asignaturaId}_${x.seccionId}_${x.componenteId||''}`));
            const externasAcordadas=new Set(p.filter(x=>x.estadoGestionExterna==='acordada').map(x=>`${x.asignaturaId}_${x.seccionId}_${x.componenteId||''}`));
            if(marcadasRevision.size) cards.push({t:'🔎 Marcadas para revisión',v:marcadasRevision.size,c:'var(--warning)',report:'seguimientoPlanificacion'});
            if(externasGestion.size) cards.push({t:'🤝 Externas en gestión',v:externasGestion.size,c:'var(--warning)',report:'seguimientoPlanificacion'});
            if(externasAcordadas.size) cards.push({t:'✅ Externas acordadas',v:externasAcordadas.size,c:'var(--success)',report:'seguimientoPlanificacion'});
            if(cfg.criticas!==false){
                const criticas=data.asignaturas.filter(a=>['alta-reprobacion','requiere-ayudantia','alta-reprobacion-ayudantia'].includes(a.condicion)).length;
                if(criticas) cards.push({t:'🎯 Asignaturas críticas',v:criticas,c:'var(--warning)',report:'criticas'});
            }
            if(cfg.transversales!==false){
                const transversales=data.asignaturas.filter(a=>a.area==='transversal'||a.controlHorario==='coordinacion-externa').length;
                if(transversales) cards.push({t:'🤝 Transversales / externas',v:transversales,c:'var(--accent)',report:'transversales'});
            }
            const gestor=data.gestorSecciones||{};
            const cargasGestor=Array.isArray(gestor.cargas)?gestor.cargas:[];
            const ultimaGestor=cargasGestor.find(c=>c.id===gestor.ultimaCargaId)||cargasGestor[0]||null;
            const idsGestor=Array.isArray(gestor.ids)?(ultimaGestor?gestor.ids.filter(x=>x.cargaId===ultimaGestor.id):gestor.ids):[];
            const enlacesGestor=new Set((Array.isArray(gestor.enlacesManuales)?gestor.enlacesManuales:[]).map(x=>String(x.idSeccion||'')));
            const idsPendientesGestor=idsGestor.filter(x=>x.estado==='pendiente_externa'&&!enlacesGestor.has(String(x.idSeccion||''))).length;
            if(idsPendientesGestor){
                cards.push({t:'🧩 IDs Gestor pendientes',v:idsPendientesGestor,c:'var(--warning)',gestorPendientes:true});
            }
            const gruposDictacion=Array.isArray(data.gruposDictacion)?data.gruposDictacion:[];
            if(gruposDictacion.length){
                const heredadas=gruposDictacion.reduce((acc,g)=>acc+(g.seccionesVinculadasIds||[]).length,0);
                const alertasFusion=shared.calcularValidacionPrevia().filter(x=>x.categoria==='Grupo de dictación'||x.categoria==='Capacidad de sala').length;
                cards.push({t:'🔗 Grupos de dictación',v:gruposDictacion.length,c:alertasFusion?'var(--warning)':'var(--accent)',report:'gruposDictacion'});
                if(heredadas) cards.push({t:'↪ Asignaturas heredadas',v:heredadas,c:'var(--accent)',report:'gruposDictacion'});
                if(alertasFusion) cards.push({t:'⚠️ Alertas de fusiones',v:alertasFusion,c:'var(--danger)',report:'gruposDictacion'});
            }
            const subsecciones=(data.asignaturaSeccion||[]).filter(r=>r.usaSubsecciones&&Array.isArray(r.componentesSubseccion)&&r.componentesSubseccion.length).length;
            if(subsecciones) cards.push({t:'🧪 Subsecciones de asignatura',v:subsecciones,c:'var(--accent)',report:'subseccionesAsignatura'});
            if(cfg.seccionesATiempo!==false){
                const progreso=shared.obtenerProgresoSecciones();
                if(progreso.length){
                    const completas=progreso.filter(i=>i.porcentaje>=100).length;
                    cards.push({t:'✅ Secciones completas',v:`${completas}/${progreso.length}`,c:completas===progreso.length?'var(--success)':'var(--warning)'});
                }
            }
            cont.innerHTML=cards.map(c=>`<div class="dashboard-card ${(c.report||c.autoGeneral||c.undoAuto||c.gestorPendientes)?'dashboard-card-action':''}" ${c.report?`data-report="${shared.ctx.escapeHTML(c.report)}" role="button" tabindex="0" title="Abrir reporte"`:''}${c.autoGeneral?'data-auto-general="ultimo" role="button" tabindex="0" title="Abrir último Auto-general"':''}${c.undoAuto?'data-undo-auto="ultimo" role="button" tabindex="0" title="Revertir autos"':''}${c.gestorPendientes?'data-gestor-pendientes="true" role="button" tabindex="0" title="Revisar IDs pendientes del Gestor"':''}><div style="font-size:1.5rem;font-weight:700;color:${c.c||'var(--accent)'}">${shared.ctx.escapeHTML(c.v)}</div><div style="font-size:0.78rem;color:var(--text-secondary);margin-top:4px;">${shared.ctx.escapeHTML(c.t)}</div></div>`).join('');
            cont.innerHTML+=shared.renderScoreGlobalHorario();
            cont.innerHTML+=shared.renderValidacionPrevia();
            cont.innerHTML+=shared.renderPreparacionPorCarrera();
            cont.innerHTML+=shared.renderResumenCriteriosAsignatura();
            cont.innerHTML+=shared.renderBloqueProgresoSecciones();
            cont.innerHTML+=shared.renderCalidadHorario();
            if(cfg.docentesEsp!==false){
                const espGroups={};
                data.docentes.filter(d=>d.id!==shared.ctx.DOCENTE_NN_ID).forEach(d=>{if(d.especialidad) espGroups[d.especialidad]=(espGroups[d.especialidad]||0)+1;});
                if(Object.keys(espGroups).length){
                    let espHtml='<div style="grid-column:1/-1;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-top:4px;"><div style="font-size:0.85rem;font-weight:600;margin-bottom:8px;">👥 Docentes por especialidad</div><div style="display:flex;gap:6px;flex-wrap:wrap;">';
                    Object.entries(espGroups).forEach(([k,v])=>espHtml+=`<span class="item-chip">${shared.ctx.escapeHTML(k)}: ${v}</span>`);
                    cont.innerHTML+=espHtml+'</div></div>';
                }
            }
            cont.dataset.dashboardFirma=firmaDashboard;
        }
        return {obtenerProgresoSecciones, colorProgreso, agruparProgresoPorCarrera, abrirDetalleProgresoCarrera, renderBloqueProgresoSecciones, bloquesPorDia, contarVentanas, calcularCalidadHorario, calidadItems, agruparCalidadPorAsignatura, abrirDetalleCalidad, renderCalidadHorario, calcularScoreGlobalHorario, renderScoreGlobalHorario, renderValidacionPrevia, abrirDetallePreparacionCarrera, renderPreparacionPorCarrera, renderResumenCriteriosAsignatura, renderDashboard};
    }};
})();
