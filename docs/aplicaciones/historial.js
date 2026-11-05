// Aplicación historial. Estado y servicios compartidos inyectados, sin copias de datos.
(function(){
    window.PlanhorAplicaciones=window.PlanhorAplicaciones||{};
    window.PlanhorAplicaciones["historial"]={create(shared){
function renderHistorial(){
            const data=shared.getData();
            const cont=document.getElementById('historialContenido');
            if(!cont) return;
            const eventosBase=(data.auditoria||[]).slice().reverse();
            if(!eventosBase.length){
                cont.innerHTML='<p style="color:var(--text-secondary);font-size:0.85rem;">Aún no hay acciones registradas.</p>';
                return;
            }
            const accionActual=document.getElementById('historialFiltroAccion')?.value||'';
            const usuarioActual=document.getElementById('historialFiltroUsuario')?.value||'';
            const busqueda=(document.getElementById('historialBusqueda')?.value||'').trim().toLowerCase();
            const acciones=[...new Set(eventosBase.map(ev=>ev.accion).filter(Boolean))].sort();
            const usuarios=[...new Set(eventosBase.map(ev=>ev.usuario).filter(Boolean))].sort();
            const usuarioLabel=(evOrEmail)=>{
                const email=typeof evOrEmail==='string'?evOrEmail:evOrEmail?.usuario;
                const nombre=typeof evOrEmail==='object'?(evOrEmail.usuarioNombre||data.configuracion?.perfilesUsuarios?.[email]?.nombre):data.configuracion?.perfilesUsuarios?.[email]?.nombre;
                return nombre&&nombre!==email?`${nombre} (${email})`:(email||'');
            };
            const temporadaEvento=(ev)=>{
                const temporada=data.temporadas?.find(t=>String(t.id)===String(ev?.temporadaId));
                return temporada?`${temporada.temporada} ${temporada.anio}`:(ev?.temporadaId||'Sin temporada');
            };
            const diaBloque=(plan)=>{
                if(!plan||plan.dia===undefined) return '';
                const ab={Lunes:'Lu',Martes:'Ma','Miércoles':'Mi',Jueves:'Ju',Viernes:'Vi','Sábado':'Sa'};
                const dia=shared.ctx.DIAS[plan.dia]||'';
                return `${ab[dia]||dia.slice(0,2)}-${plan.bloque}`;
            };
            const nombrePlan=(plan)=>{
                if(!plan) return '';
                const sec=data.secciones.find(s=>s.id===plan.seccionId);
                const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
                const doc=data.docentes.find(d=>d.id===plan.docenteId);
                const sala=data.salas.find(s=>s.id===plan.salaId);
                return [
                    sec?.nombre,
                    asig?.codigo||asig?.nombre,
                    doc?(doc.id===shared.ctx.DOCENTE_NN_ID?'Docente NN':`${doc.nombre||''} ${doc.apellido||''}`.trim()):'',
                    sala?.nombre,
                    plan.dia!==undefined?`${shared.ctx.DIAS[plan.dia]||''} B${plan.bloque}`:''
                ].filter(Boolean).join(' · ');
            };
            const contextoPlan=(plan)=>{
                const sec=data.secciones.find(s=>s.id===plan?.seccionId);
                const asig=data.asignaturas.find(a=>a.id===plan?.asignaturaId);
                const doc=data.docentes.find(d=>d.id===plan?.docenteId);
                const sala=data.salas.find(s=>s.id===plan?.salaId);
                return {
                    seccion:sec?.nombre||plan?.seccionId||'',
                    asignatura:[asig?.codigo,asig?.nombre].filter(Boolean).join(' · ')||plan?.asignaturaId||'',
                    docente:doc?(doc.id===shared.ctx.DOCENTE_NN_ID?'Docente NN':`${doc.nombre||''} ${doc.apellido||''}`.trim()):(plan?.docenteId||''),
                    sala:sala?.nombre||plan?.salaId||''
                };
            };
            const eventoAgrupable=(ev)=>['bloque_creado','bloque_eliminado','bloque_movido'].includes(ev.accion);
            const planBaseEvento=(ev)=>{
                const d=ev.detalle||{};
                return d.plan||d.antes||d.despues||null;
            };
            const claveGrupoEvento=(ev)=>{
                const p=planBaseEvento(ev);
                if(!eventoAgrupable(ev)||!p) return ev.id||`${ev.ts}_${ev.accion}`;
                const operacion=ev.operacionId||ev.revisionId||String(ev.ts||'').slice(0,19)||ev.id;
                return [operacion,ev.accion,ev.usuario,p.seccionId,p.asignaturaId].join('|');
            };
            const agruparEventos=(eventos)=>{
                const grupos=[];
                const mapa=new Map();
                eventos.forEach(ev=>{
                    const clave=claveGrupoEvento(ev);
                    if(!eventoAgrupable(ev)){
                        grupos.push({eventos:[ev],primero:ev});
                        return;
                    }
                    if(!mapa.has(clave)){
                        const grupo={eventos:[],primero:ev};
                        mapa.set(clave,grupo);
                        grupos.push(grupo);
                    }
                    mapa.get(clave).eventos.push(ev);
                });
                return grupos;
            };
            const detalleEvento=(ev)=>{
                const d=ev.detalle||{};
                if(ev.accion==='bloque_creado') return nombrePlan(d.plan);
                if(ev.accion==='bloque_eliminado') return nombrePlan(d.plan);
                if(ev.accion==='bloque_movido') return `${nombrePlan(d.antes)} → ${nombrePlan(d.despues)}`;
                if(ev.accion==='bloques_eliminados_asignatura') return `${d.cantidad||0} bloque(s) eliminados · ${nombrePlan((d.bloques||[])[0])}`;
                if(ev.accion==='gestor_secciones_importado'){
                    const r=d.resumen||{};
                    return [
                        d.archivo?`Archivo: ${d.archivo}`:'',
                        `filas: ${d.filas||0}`,
                        `carreras: ${r.carreras||0}`,
                        `niveles: ${r.niveles||0}`,
                        `secciones: ${r.secciones||0}`,
                        `asignaturas: ${r.asignaturas||0}`,
                        `grupos: ${r.grupos||0}`,
                        `vínculos: ${r.vinculos||0}`,
                        `omitidos: ${r.omitidos||0}`
                    ].filter(Boolean).join(' · ');
                }
                if(d&&typeof d==='object') return Object.entries(d).map(([k,v])=>`${k}: ${Array.isArray(v)?v.length+' item(s)':v}`).join(' · ');
                return d||'';
            };
            const eventos=eventosBase.filter(ev=>{
                const detalle=detalleEvento(ev);
                if(accionActual&&ev.accion!==accionActual) return false;
                if(usuarioActual&&ev.usuario!==usuarioActual) return false;
                if(busqueda&&!`${ev.accion||''} ${ev.usuario||''} ${ev.motivo||''} ${detalle}`.toLowerCase().includes(busqueda)) return false;
                return true;
            });
            const gruposTodos=agruparEventos(eventos);
            shared.historialTamano=[20,50,100].includes(Number(shared.historialTamano))?Number(shared.historialTamano):20;
            const totalPaginas=Math.max(1,Math.ceil(gruposTodos.length/shared.historialTamano));
            shared.historialPagina=Math.max(1,Math.min(totalPaginas,Number(shared.historialPagina)||1));
            const inicio=(shared.historialPagina-1)*shared.historialTamano;
            const grupos=gruposTodos.slice(inicio,inicio+shared.historialTamano);
            const detalleGrupo=(grupo)=>{
                const ev=grupo.primero;
                const motivo=[...new Set(grupo.eventos.map(e=>String(e.motivo||'').trim()).filter(Boolean))].join(' · ');
                const anexarMotivo=texto=>motivo?`${texto} · Motivo: ${motivo}`:texto;
                if(!eventoAgrupable(ev)||grupo.eventos.length===1) return anexarMotivo(detalleEvento(ev));
                const p=planBaseEvento(ev);
                const ctxPlan=contextoPlan(p);
                if(ev.accion==='bloque_movido'){
                    const movs=grupo.eventos.map(e=>`${diaBloque(e.detalle?.antes)} → ${diaBloque(e.detalle?.despues)}`).filter(Boolean).join(', ');
                    return anexarMotivo(`${ctxPlan.seccion} · ${ctxPlan.asignatura} · ${ctxPlan.docente} · ${movs}`);
                }
                const bloques=grupo.eventos.map(e=>diaBloque(e.detalle?.plan)).filter(Boolean).join(', ');
                return anexarMotivo(`${ctxPlan.seccion} · ${ctxPlan.asignatura} · ${ctxPlan.docente} · ${ctxPlan.sala} · ${bloques}`);
            };
            const accionGrupo=(grupo)=>{
                const ev=grupo.primero;
                const n=grupo.eventos.length;
                if(n<=1) return ev.accion||'';
                if(ev.accion==='bloque_creado') return `bloques_creados (${n})`;
                if(ev.accion==='bloque_eliminado') return `bloques_eliminados (${n})`;
                if(ev.accion==='bloque_movido') return `bloques_movidos (${n})`;
                return `${ev.accion} (${n})`;
            };
            const exportarHistorialFiltrado=()=>{
                const filas=[['Fecha','Usuario','Temporada','Versión','Acción','Motivo','Detalle']];
                gruposTodos.forEach(grupo=>{
                    const ev=grupo.primero;
                    filas.push([
                        ev.ts?new Date(ev.ts).toLocaleString():'',
                        usuarioLabel(ev),
                        temporadaEvento(ev),
                        ev.revisionId||'',
                        accionGrupo(grupo),
                        [...new Set(grupo.eventos.map(e=>e.motivo).filter(Boolean))].join(' · '),
                        detalleGrupo(grupo)
                    ]);
                });
                const csv=filas.map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
                const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});
                const a=document.createElement('a');
                a.href=URL.createObjectURL(blob);
                a.download=`Historial_${shared.ctx.getTemporadaLabel?.()||'Planificador'}_${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
                URL.revokeObjectURL(a.href);
                shared.ctx.toast?.('Historial exportado','success');
            };
            const alertaHistorial=eventosBase.length>=900?`
                <div class="dashboard-validation-item ${eventosBase.length>=1000?'danger':'warning'}" style="margin-bottom:10px;">
                    <span>${eventosBase.length>=1000?'Límite alcanzado':'Cerca del límite'}</span>
                    <strong>Historial de acciones</strong>
                    <em>${eventosBase.length>=1000?'Se conservarán solo las acciones más recientes. Exporta el historial para respaldo institucional.':`Hay ${eventosBase.length}/1000 acciones registradas. Conviene exportar antes de que se complete.`}</em>
                </div>
            `:'';
            const controles=`
                <div class="history-toolbar">
                    <div class="form-group"><label class="form-label">Acción</label><select class="form-select" id="historialFiltroAccion"><option value="">Todas</option>${acciones.map(a=>shared.ctx.optionHTML(a,a,a===accionActual)).join('')}</select></div>
                    <div class="form-group"><label class="form-label">Usuario</label><select class="form-select" id="historialFiltroUsuario"><option value="">Todos</option>${usuarios.map(u=>shared.ctx.optionHTML(u,usuarioLabel(u),u===usuarioActual)).join('')}</select></div>
                    <div class="form-group history-search"><label class="form-label">Buscar</label><input class="form-input" id="historialBusqueda" value="${shared.ctx.escapeAttr(busqueda)}" placeholder="Sección, asignatura, docente..."></div>
                    <div class="form-group"><label class="form-label">Ver</label><select class="form-select" id="historialTamanoPagina">
                        <option value="20" ${shared.historialTamano===20?'selected':''}>20</option>
                        <option value="50" ${shared.historialTamano===50?'selected':''}>50</option>
                        <option value="100" ${shared.historialTamano===100?'selected':''}>100</option>
                    </select></div>
                    <div class="form-group history-actions">
                        <button class="btn btn-sm" id="btnHistorialAnterior" ${shared.historialPagina<=1?'disabled':''}>Anterior</button>
                        <button class="btn btn-sm" id="btnHistorialSiguiente" ${shared.historialPagina>=totalPaginas?'disabled':''}>Siguiente</button>
                        <button class="btn btn-sm" id="btnExportarHistorial">Exportar historial</button>
                    </div>
                </div>`;
            if(!eventos.length){
                cont.innerHTML=alertaHistorial+controles+'<p style="color:var(--text-secondary);font-size:0.85rem;">No hay acciones que coincidan con los filtros.</p>';
                enlazarHistorial();
                return;
            }
            cont.innerHTML=`
                ${alertaHistorial}
                ${controles}
                <div class="report-summary">${inicio+1}-${inicio+grupos.length} de ${gruposTodos.length} grupo(s) · ${eventos.length} evento(s) filtrado(s) de ${eventosBase.length} · página ${shared.historialPagina}/${totalPaginas}</div>
                <table class="report-table historial-table">
                    <thead><tr><th>Fecha</th><th>Usuario</th><th>Temporada / versión</th><th>Acción</th><th>Detalle</th></tr></thead>
                    <tbody>${grupos.map(grupo=>{
                        const ev=grupo.primero;
                        const detalle=detalleGrupo(grupo);
                        return `<tr>
                            <td>${shared.ctx.escapeHTML(ev.ts?new Date(ev.ts).toLocaleString():'')}</td>
                            <td>${shared.ctx.escapeHTML(usuarioLabel(ev))}</td>
                            <td title="${shared.ctx.escapeAttr(ev.revisionId||'Sin versión histórica')}">${shared.ctx.escapeHTML(`${temporadaEvento(ev)} · ${ev.revisionId?String(ev.revisionId).slice(0,12):'Anterior'}`)}</td>
                            <td>${shared.ctx.escapeHTML(accionGrupo(grupo))}</td>
                            <td>${shared.ctx.escapeHTML(detalle)}</td>
                        </tr>`;
                    }).join('')}</tbody>
                </table>`;
            enlazarHistorial();

            function enlazarHistorial(){
                ['historialFiltroAccion','historialFiltroUsuario','historialBusqueda'].forEach(id=>{
                    const el=document.getElementById(id);
                if(!el) return;
                el.onchange=()=>{ shared.historialPagina=1; shared.renderHistorial(); };
                    if(id==='historialBusqueda') el.onkeydown=(e)=>{ if(e.key==='Enter'){ shared.historialPagina=1; shared.renderHistorial(); } };
                });
                document.getElementById('historialTamanoPagina')?.addEventListener('change',(e)=>{
                    shared.historialTamano=Number(e.target.value)||20;
                    shared.historialPagina=1;
                    shared.renderHistorial();
                });
                document.getElementById('btnHistorialAnterior')?.addEventListener('click',()=>{
                    shared.historialPagina=Math.max(1,shared.historialPagina-1);
                    shared.renderHistorial();
                });
                document.getElementById('btnHistorialSiguiente')?.addEventListener('click',()=>{
                    shared.historialPagina+=1;
                    shared.renderHistorial();
                });
                document.getElementById('btnExportarHistorial')?.addEventListener('click',exportarHistorialFiltrado);
            }
        }
        return {renderHistorial};
    }};
})();
