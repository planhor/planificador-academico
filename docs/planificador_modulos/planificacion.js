(function(){
    function createPlanificacion(ctx){
        const getData = ctx.getData;
        const LABEL_CRITERIOS_ASIGNATURA = {
            area:{especialidad:'Especialidad',transversal:'Transversal',electiva:'Electiva'},
            modalidad:{lectiva:'Lectiva',practica:'Práctica',semipresencial:'Semipresencial','online-teams':'Online TEAMS'},
            condicion:{normal:'Normal','alta-reprobacion':'Alta reprobación','requiere-ayudantia':'Requiere ayudantía','alta-reprobacion-ayudantia':'Alta reprobación + ayudantía'}
        };
        function resumenCriteriosAsignatura(asig){
            return [
                LABEL_CRITERIOS_ASIGNATURA.area[asig?.area]||'Especialidad',
                LABEL_CRITERIOS_ASIGNATURA.modalidad[asig?.modalidad]||'Lectiva',
                asig?.condicion&&asig.condicion!=='normal' ? LABEL_CRITERIOS_ASIGNATURA.condicion[asig.condicion] : ''
            ].filter(Boolean).join(' · ');
        }
        function alertasCriteriosAsignatura(asig){
            const alertas=[];
            if(asig?.area==='transversal'||asig?.controlHorario==='coordinacion-externa') alertas.push({txt:'Coordinar',cls:'info'});
            if(asig?.condicion==='alta-reprobacion'||asig?.condicion==='alta-reprobacion-ayudantia') alertas.push({txt:'Crítica',cls:'warning'});
            if(asig?.condicion==='requiere-ayudantia'||asig?.condicion==='alta-reprobacion-ayudantia') alertas.push({txt:'Ayudantía',cls:'warning'});
            if(asig?.modalidad==='online-teams') alertas.push({txt:'Online TEAMS',cls:'info'});
            return alertas.map(a=>`<span class="auto-plan-alert ${a.cls}">${ctx.escapeHTML(a.txt)}</span>`).join('');
        }

        function normalizarExplicacionAuto(exp){
            const base=exp&&typeof exp==='object'?exp:{};
            const razones=Array.isArray(base.razones)?base.razones.filter(Boolean).slice(0,5):[];
            return {
                origen:base.origen||'Manual',
                estrategia:base.estrategia||'',
                puntaje:Number(base.puntaje)||0,
                razones,
                generadoEn:base.generadoEn||new Date().toISOString()
            };
        }

        function textoExplicacionAuto(exp){
            const e=normalizarExplicacionAuto(exp);
            if(!e.razones.length) return '';
            const origen=e.origen==='auto_general'?'Auto-general':e.origen==='auto_seccion'?'Auto-sección':e.origen==='auto_asignatura'?'Auto-asignatura':e.origen;
            const estrategia=e.estrategia?` · ${e.estrategia}`:'';
            return `${origen}${estrategia}: ${e.razones.join('; ')}`;
        }

        function criteriosAuto(){
            const data=getData();
            data.configuracion.autoPlanificacion=data.configuracion.autoPlanificacion||{};
            return data.configuracion.autoPlanificacion;
        }

        function renderPanelCriteriosAuto(prefix, opciones={}){
            const cfg=Object.assign({}, criteriosAuto(), opciones);
            return `<div class="auto-criteria-panel">
                <div class="auto-criteria-header">
                    <strong>Criterios de autoplanificación</strong>
                    <span>Activa solo las reglas que quieres usar en esta ejecución.</span>
                </div>
                <div class="auto-criteria-grid">
                    <label><input type="checkbox" id="${prefix}Prioridad" ${cfg.usarPrioridadDocente!==false?'checked':''}> Prioridad docente</label>
                    <label><input type="checkbox" id="${prefix}Balance" ${cfg.balancearDias!==false?'checked':''}> Balancear días</label>
                    <label><input type="checkbox" id="${prefix}SabadoPresencial" ${cfg.permitirSabadoPresencial?'checked':''}> Sábado presencial</label>
                    <label><input type="checkbox" id="${prefix}NN" ${cfg.permitirDocenteNN!==false?'checked':''}> Docente NN</label>
                    <label><input type="checkbox" id="${prefix}Transversales" ${cfg.incluirTransversales!==false?'checked':''}> Transversales/externas</label>
                    <label><input type="checkbox" id="${prefix}Virtuales" ${cfg.incluirVirtuales!==false?'checked':''}> Bloques virtuales</label>
                    <label><input type="checkbox" id="${prefix}VirtualSabado" ${cfg.priorizarVirtualSabado!==false?'checked':''}> Virtuales sábado</label>
                    <label><input type="checkbox" id="${prefix}N1" ${cfg.evitarTempranoN1!==false?'checked':''}> Evitar B1-B2 en N1</label>
                    <label><input type="checkbox" id="${prefix}Criticas" ${cfg.cuidarCriticas!==false?'checked':''}> Cuidar críticas</label>
                    <label><input type="checkbox" id="${prefix}Ayudantias" ${cfg.cuidarAyudantias!==false?'checked':''}> Margen ayudantías</label>
                </div>
            </div>`;
        }

        function leerPanelCriteriosAuto(prefix){
            return {
                usarPrioridadDocente:document.getElementById(`${prefix}Prioridad`)?.checked!==false,
                balancearDias:document.getElementById(`${prefix}Balance`)?.checked!==false,
                permitirSabadoPresencial:!!document.getElementById(`${prefix}SabadoPresencial`)?.checked,
                permitirDocenteNN:document.getElementById(`${prefix}NN`)?.checked!==false,
                incluirTransversales:document.getElementById(`${prefix}Transversales`)?.checked!==false,
                incluirVirtuales:document.getElementById(`${prefix}Virtuales`)?.checked!==false,
                priorizarVirtualSabado:document.getElementById(`${prefix}VirtualSabado`)?.checked!==false,
                evitarTempranoN1:document.getElementById(`${prefix}N1`)?.checked!==false,
                cuidarCriticas:document.getElementById(`${prefix}Criticas`)?.checked!==false,
                cuidarAyudantias:document.getElementById(`${prefix}Ayudantias`)?.checked!==false
            };
        }

        function guardarCriteriosAuto(criterios){
            const data=getData();
            data.configuracion.autoPlanificacion=Object.assign({}, data.configuracion.autoPlanificacion||{}, criterios);
        }

        function registrarMemoriaPlanificacion(tipo, detalle={}){
            const data=getData();
            const cfg=data.configuracion.memoriaPlanificacion||{};
            if(cfg.activa===false) return;
            data.configuracion.memoriaPlanificacion=Object.assign({activa:true,senales:[],maxSenales:500},cfg);
            const memoria=data.configuracion.memoriaPlanificacion;
            if(!Array.isArray(memoria.senales)) memoria.senales=[];
            memoria.senales.push(Object.assign({
                id:ctx.genId(),
                ts:new Date().toISOString(),
                temporadaId:data.sel?.temporadaId||data.configuracion?.temporadaActualId||null,
                tipo
            },detalle));
            const max=Math.max(50,Math.min(2000,Number(memoria.maxSenales)||500));
            memoria.maxSenales=max;
            memoria.senales=memoria.senales.slice(-max);
        }

        function contextoMemoriaDesdePlan(plan){
            const data=getData();
            const sec=data.secciones.find(s=>s.id===plan?.seccionId);
            const nivel=sec?data.niveles.find(n=>n.id===sec.nivelId):null;
            return {
                planId:plan?.id||null,
                seccionId:plan?.seccionId||null,
                nivelId:nivel?.id||null,
                carreraId:nivel?.carreraId||null,
                asignaturaId:plan?.asignaturaId||null,
                docenteId:plan?.docenteId||null,
                salaId:plan?.salaId||null,
                dia:plan?.dia,
                bloque:plan?.bloque,
                origenAuto:plan?.explicacionAuto?.origen||null
            };
        }

        function fuerzaMemoriaAuto(){
            const cfg=getData().configuracion.memoriaPlanificacion||{};
            return {baja:1,media:1.7,alta:2.4}[cfg.fuerza]||1;
        }

        function puntajeMemoriaAuto({asigId,secId,docId,salaId,dia,bloque}){
            const data=getData();
            const memoria=data.configuracion.memoriaPlanificacion||{};
            if(memoria.usarEnAuto!==true) return {puntaje:0,razones:[]};
            const senales=Array.isArray(memoria.senales)?memoria.senales:[];
            if(!senales.length) return {puntaje:0,razones:[]};
            const sec=data.secciones.find(s=>s.id===secId);
            const nivel=sec?data.niveles.find(n=>n.id===sec.nivelId):null;
            let puntos=0;
            const razones=[];
            const add=(valor,razon)=>{
                puntos+=valor;
                if(razon&&!razones.includes(razon)) razones.push(razon);
            };
            senales.forEach(s=>{
                if(s.asignaturaId&&s.asignaturaId!==asigId) return;
                let peso=1;
                if(s.seccionId===secId) peso+=0.8;
                else if(s.nivelId&&nivel&&s.nivelId===nivel.id) peso+=0.35;
                else if(s.carreraId&&nivel&&s.carreraId===nivel.carreraId) peso+=0.2;
                if(s.tipo==='docente_corregido'&&s.docenteNuevoId===docId) add(8*peso,'memoria: docente usado en correcciones previas');
                if(s.tipo==='sala_corregida'&&s.salaNuevaId===salaId) add(7*peso,'memoria: sala usada en correcciones previas');
                if(s.tipo==='sala_corregida'&&s.desdeTRO2&&salaId===ctx.SALA_TRO2_ID) add(-6*peso,'memoria: evita TRO2 si hay alternativa');
                if(s.tipo==='bloque_auto_movido'&&s.hacia){
                    if(s.hacia.dia===dia&&s.hacia.bloque===bloque) add(8*peso,'memoria: horario corregido previamente');
                    else if(s.hacia.dia===dia&&Math.abs(Number(s.hacia.bloque)-Number(bloque))<=1) add(4*peso,'memoria: rango horario cercano a correcciones previas');
                    if(s.desde?.dia===dia&&s.desde?.bloque===bloque) add(-7*peso,'memoria: bloque movido anteriormente');
                }
                if(s.tipo==='bloque_auto_fijado'&&s.dia===dia&&s.bloque===bloque) add(5*peso,'memoria: bloque fijado previamente');
            });
            const factor=fuerzaMemoriaAuto();
            return {
                puntaje:Math.max(-24,Math.min(24,Math.round(puntos*factor))),
                razones:razones.slice(0,2)
            };
        }

        function refrescarDespuesCambioPlanificacion(){
            ctx.actualizarReporte?.();
            ctx.actualizarVista?.();
            ctx.renderDashboard?.();
            ctx.detectarConflictos?.();
            ctx.renderHistorial?.();
        }

        function nombreSeccion(seccionId){
            const data=getData();
            return data.secciones.find(s=>s.id===seccionId)?.nombre||'Sección no encontrada';
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

        function ordenarSeccionesNombre(a,b){
            return String(a.nombre||'').localeCompare(String(b.nombre||''),undefined,{numeric:true,sensitivity:'base'});
        }

        function gruposVinculadosDeSeccion(seccionId){
            const grupos=ctx.getGruposDictacionSeccion?.(seccionId)||[];
            return grupos.filter(g=>g.seccionMadreId!==seccionId && g.seccionesVinculadasIds?.includes(seccionId));
        }

        function planVinculadoEn(seccionId,dia,bloque){
            const data=getData();
            for(const grupo of gruposVinculadosDeSeccion(seccionId)){
                const asignaturas=[grupo.asignaturaId, ...(grupo.asignaturasEquivalentesIds||[])].filter(Boolean);
                const plan=data.planificaciones.find(p=>
                    p.seccionId===grupo.seccionMadreId &&
                    asignaturas.includes(p.asignaturaId) &&
                    p.dia===dia &&
                    p.bloque===bloque
                );
                if(plan) return {plan, grupo, vinculado:true, seccionVistaId:seccionId};
            }
            return null;
        }

        function planVisibleEn(seccionId,dia,bloque){
            const indicePlan=ctx.getIndicePlan();
            const propio=indicePlan[`${seccionId}_${dia}_${bloque}`];
            if(propio) return {plan:propio, vinculado:false, grupo:null, seccionVistaId:seccionId};
            return planVinculadoEn(seccionId,dia,bloque);
        }

        function seccionOcupadaVisible(seccionId,dia,bloque,opciones={}){
            const ignorar=new Set(opciones.ignorarIds||[]);
            const visible=planVisibleEn(seccionId,dia,bloque);
            return !!(visible?.plan && !ignorar.has(visible.plan.id));
        }

        function estadoDictacionAsignatura(asigId,seccionId){
            return ctx.getEstadoDictacionAsignatura?.(asigId,seccionId)||{estado:'sin-grupo'};
        }

        function esAsignaturaVinculada(asigId,seccionId){
            return estadoDictacionAsignatura(asigId,seccionId).estado==='vinculada';
        }

        function nombreMadreAsignatura(asigId,seccionId){
            const estado=estadoDictacionAsignatura(asigId,seccionId);
            return estado.grupo?.seccionMadreId?nombreSeccion(estado.grupo.seccionMadreId):'la sección madre';
        }

        function seccionesCompartidasAsignatura(asigId,seccionId){
            const estado=estadoDictacionAsignatura(asigId,seccionId);
            if(estado.estado!=='dictada-aqui') return [];
            return (estado.grupo?.seccionesVinculadasIds||[]).map(nombreSeccion).filter(Boolean);
        }

        function resumenDictacionAsignatura(asigId,seccionId){
            const estado=estadoDictacionAsignatura(asigId,seccionId);
            if(estado.estado==='vinculada') return `Heredada ${nombreSeccion(estado.grupo?.seccionMadreId)}`;
            if(estado.estado==='dictada-aqui'){
                const vinculadas=seccionesCompartidasAsignatura(asigId,seccionId);
                return vinculadas.length?`Compartida ${vinculadas.join(', ')}`:'Dictada aquí';
            }
            return '';
        }

        function resumenDictacionCorto(asigId,seccionId){
            const estado=estadoDictacionAsignatura(asigId,seccionId);
            if(estado.estado==='vinculada') return `Heredada`;
            if(estado.estado==='dictada-aqui'){
                const total=(estado.grupo?.seccionesVinculadasIds||[]).length;
                return total?`Compartida ${total}`:'Dictada aquí';
            }
            return '';
        }

        function actualizarMensajesPlanificador(){
            const data=getData();
            const el=document.getElementById('planMensajes');
            if(!el) return;
            if(!data.sel.seccionId||!data.sel.asignaturaId){
                el.style.display='none';
                el.innerHTML='';
                return;
            }
            const asig=data.asignaturas.find(a=>a.id===data.sel.asignaturaId);
            if(!asig){
                el.style.display='none';
                el.innerHTML='';
                return;
            }
            const estado=estadoDictacionAsignatura(asig.id,data.sel.seccionId);
            const mensajes=[];
            if(estado.estado==='vinculada'){
                const madreId=estado.grupo?.seccionMadreId||'';
                const madreNombre=nombreSeccion(madreId);
                const asigMadre=data.asignaturas.find(a=>a.id===estado.grupo?.asignaturaId);
                mensajes.push(`<strong>Heredada desde ${ctx.escapeHTML(madreNombre)}</strong>`);
                if(asigMadre&&asigMadre.id!==asig.id) mensajes.push(`Asignatura madre: ${ctx.escapeHTML([asigMadre.codigo,asigMadre.nombre].filter(Boolean).join(' - '))}`);
                mensajes.push(`Esta asignatura se planifica en la sección madre. Los cambios de horario, docente o sala deben hacerse desde esa sección.`);
                mensajes.push(`<button class="btn btn-xs plan-message-action" type="button" data-ir-madre="${ctx.escapeAttr(madreId)}">Ir a sección madre</button>`);
            } else if(estado.estado==='dictada-aqui'){
                const vinculadas=seccionesCompartidasAsignatura(asig.id,data.sel.seccionId);
                if(vinculadas.length){
                    mensajes.push(`<strong>Compartida ${ctx.escapeHTML(vinculadas.join(', '))}</strong>`);
                    mensajes.push(`Los bloques que planifiques aquí también se reflejan en ${vinculadas.length===1?'esa sección':'esas secciones'}.`);
                } else {
                    mensajes.push(`<strong>Dictada aquí</strong>`);
                    mensajes.push('Esta asignatura se planifica directamente en la sección seleccionada.');
                }
            }
            if(!mensajes.length){
                el.style.display='none';
                el.innerHTML='';
                return;
            }
            el.innerHTML=`<div class="plan-message-content">${mensajes.map(m=>m.includes('<button')?m:`<span>${m}</span>`).join('')}</div>`;
            el.style.display='block';
            el.querySelector('[data-ir-madre]')?.addEventListener('click',()=>{
                const madreId=el.querySelector('[data-ir-madre]')?.dataset.irMadre;
                const madre=data.secciones.find(s=>s.id===madreId);
                if(!madre) return ctx.toast('Sección madre no encontrada','error');
                data.sel.seccionId=madre.id;
                data.sel.nivelId=madre.nivelId;
                const nivel=data.niveles.find(n=>n.id===madre.nivelId);
                data.sel.carreraId=nivel?.carreraId||data.sel.carreraId;
                actualizarSelectoresPlan();
                construirGrilla();
                actualizarProgresoPlan();
                ctx.toast('Sección madre abierta','info');
            });
        }

        function planesVisiblesAsignaturaSeccion(asigId,seccionId,planes=null){
            const data=getData();
            const fuente=planes||data.planificaciones;
            const propios=fuente.filter(p=>p.seccionId===seccionId&&p.asignaturaId===asigId);
            const grupos=(ctx.getGruposDictacion?.()||[]).filter(g=>
                g.seccionMadreId!==seccionId &&
                g.seccionesVinculadasIds?.includes(seccionId) &&
                (g.asignaturaId===asigId || g.asignaturasEquivalentesIds?.includes(asigId))
            );
            const heredados=grupos.flatMap(g=>{
                const ids=[g.asignaturaId,...(g.asignaturasEquivalentesIds||[])].filter(Boolean);
                return fuente.filter(p=>p.seccionId===g.seccionMadreId&&ids.includes(p.asignaturaId));
            });
            return [...propios,...heredados];
        }

        function planesVisiblesSeccionDia(seccionId,dia,planes=null){
            const data=getData();
            const fuente=planes||data.planificaciones;
            const propios=fuente.filter(p=>p.seccionId===seccionId&&p.dia===dia);
            const heredados=gruposVinculadosDeSeccion(seccionId).flatMap(g=>{
                const ids=[g.asignaturaId,...(g.asignaturasEquivalentesIds||[])].filter(Boolean);
                return fuente.filter(p=>p.seccionId===g.seccionMadreId&&ids.includes(p.asignaturaId)&&p.dia===dia);
            });
            return [...propios,...heredados];
        }

        function construirGrilla() {
            const data = getData();
            const grid=document.getElementById('scheduleGrid'); grid.innerHTML='';
            grid.appendChild(ctx.createHeader());
            const secId=data.sel.seccionId;
            ctx.BLOQUES.forEach(b=>{
                grid.appendChild(ctx.createTimeCell(b));
                ctx.DIAS.forEach((d,di)=>{
                    const cell=document.createElement('div'); cell.className='grid-cell'; cell.dataset.dia=di; cell.dataset.bloque=b.n;
                    const visible=secId?planVisibleEn(secId,di,b.n):null;
                    if(visible?.plan) aplicarEstadoCelda(cell,visible.plan,visible);
                    else if(data.modoPlan && secId && data.sel.docenteId) actualizarDisponibilidadCelda(cell,di,b.n);
                    grid.appendChild(cell);
                });
            });
        }

        function aplicarEstadoCelda(cell,plan,meta={}){
            const data = getData();
            cell.classList.add('planned');
            if(meta.vinculado) cell.classList.add('linked-plan');
            if(plan.fijo) cell.classList.add('fixed-plan');
            const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
            const sala=data.salas.find(s=>s.id===plan.salaId);
            const doc=data.docentes.find(d=>d.id===plan.docenteId);
            cell.style.backgroundColor=asig?.color||'#e9ecef';
            cell.innerHTML='';
            const codigo=document.createElement('span');
            codigo.textContent=(meta.vinculado?'🔗 ':plan.fijo?'🔒 ':'')+(asig?.codigo||'?');
            const salaEl=document.createElement('small');
            salaEl.textContent=sala?.nombre||'?';
            const docenteEl=document.createElement('small');
            docenteEl.textContent=doc?(doc.id===ctx.DOCENTE_NN_ID?'Docente NN':doc.nombre.charAt(0)+'. '+doc.apellido):'?';
            cell.append(codigo,salaEl,docenteEl);
            if(meta.vinculado){
                const origen=document.createElement('small');
                origen.className='linked-plan-source';
                origen.textContent='Madre: '+nombreSeccion(plan.seccionId);
                cell.appendChild(origen);
            }
            const explicacion=textoExplicacionAuto(plan.explicacionAuto);
            if(meta.vinculado) cell.title=`Bloque vinculado desde ${nombreSeccion(plan.seccionId)}. Se edita desde la sección madre.`;
            else if(explicacion) cell.title=explicacion;
        }

        function actualizarDisponibilidadCelda(cell,dia,bloque){
            const data = getData();
            const disp=checkDisponibilidad(data.sel.docenteId,dia,bloque,data.sel.seccionId);
            if(!disp.ok) cell.classList.add('unavailable-docente');
            else if(disp.sug) cell.classList.add('available');
        }

        function actualizarCelda(dia,bloque){
            const data = getData();
            const indicePlan = ctx.getIndicePlan();
            const grid=document.getElementById('scheduleGrid');
            const cell=grid.querySelector(`.grid-cell[data-dia="${dia}"][data-bloque="${bloque}"]`);
            if(!cell) return;
            cell.classList.remove('planned','linked-plan','fixed-plan','available','unavailable-docente'); cell.style.backgroundColor=''; cell.innerHTML=''; cell.title='';
            const secId=data.sel.seccionId;
            const visible=secId?planVisibleEn(secId,dia,bloque):null;
            if(visible?.plan) aplicarEstadoCelda(cell,visible.plan,visible);
            else if(data.modoPlan && secId && data.sel.docenteId) actualizarDisponibilidadCelda(cell,dia,bloque);
        }

        function checkDisponibilidad(docId,dia,bloque,secId,opciones={}){
            const data = getData();
            const planes=ctx.getPlanificacionesFiltradas(opciones.ignorarIds||[]);
            const doc=data.docentes.find(d=>d.id===docId); if(!doc) return {ok:false};
            if(dia===5 && bloque>data.configuracion.sabadoHastaBloque) return {ok:false};
            if(docId===ctx.DOCENTE_NN_ID){
                if(secId && seccionOcupadaVisible(secId,dia,bloque,opciones)) return {ok:false};
                return {ok:true,sug:true,nn:true};
            }
            if(!doc.disponibilidad?.[dia]?.[bloque-1]) return {ok:false};
            if(secId && seccionOcupadaVisible(secId,dia,bloque,opciones)) return {ok:false};
            if(planes.some(p=>p.docenteId===docId && p.dia===dia && p.bloque===bloque)) return {ok:false};
            if(planes.filter(p=>p.docenteId===docId && p.dia===dia).length >= data.configuracion.bloquesDiariosMax) return {ok:false};
            if(!doc.autorizadoExceder && planes.filter(p=>p.docenteId===docId).length >= data.configuracion.bloquesSemestralesMax) return {ok:false};
            if(dia>0){
                const diaAnt=dia-1;
                const planesAnt=planes.filter(p=>p.docenteId===docId && p.dia===diaAnt);
                if(planesAnt.length){
                    let maxFin=0;
                    planesAnt.forEach(p=>{ const bf=ctx.getBloque(p.bloque); if(bf&&bf.hFin>maxFin) maxFin=bf.hFin; });
                    if(maxFin && (24*60 - maxFin + ctx.getBloque(bloque).hIni) < data.configuracion.horasDescanso*60) return {ok:false};
                }
            }
            if(data.sel.tipo==='presencial' && data.sel.salaId && data.sel.salaId!==ctx.SALA_VIRTUAL_ID && data.sel.salaId!==ctx.SALA_TRO2_ID){
                if(ctx.getOcupacionSala()[`${data.sel.salaId}_${dia}_${bloque}`]) return {ok:false};
            }
            return {ok:true,sug:true};
        }

        let arrastre={activo:false,inicioDia:null,inicioBloque:null,estado:false,celdas:[],origenPlan:null};
        let modoMovimiento=null;

        function asignarBloque(dia,bloque){
            const data = getData();
            const s=data.sel; if(!data.modoPlan||!s.seccionId||!s.asignaturaId||!s.docenteId) return false;
            if(esAsignaturaVinculada(s.asignaturaId,s.seccionId)){
                ctx.toast(`Esta asignatura está vinculada desde ${nombreMadreAsignatura(s.asignaturaId,s.seccionId)}. Planifícala en la sección madre.`,'info');
                return false;
            }
            const disp=checkDisponibilidad(s.docenteId,dia,bloque,s.seccionId); if(!disp.ok) return false;
            const asig=data.asignaturas.find(a=>a.id===s.asignaturaId);
            if(asig){
                const planesTipo=data.planificaciones.filter(p=>p.asignaturaId===asig.id && p.seccionId===s.seccionId && ((s.tipo==='presencial'&&p.tipoPresencial!==false)||(s.tipo==='virtual'&&p.tipoPresencial===false)));
                const maxPermitido=s.tipo==='presencial'?(asig.horasTotales-asig.horasVirtuales)/18:asig.horasVirtuales/18;
                if(planesTipo.length>=maxPermitido) return false;
            }
            ctx.pushUndo();
            const plan={id:ctx.genId(),seccionId:s.seccionId,asignaturaId:s.asignaturaId,docenteId:s.docenteId,salaId:s.tipo==='virtual'?ctx.SALA_VIRTUAL_ID:s.salaId,dia,bloque,tipoPresencial:s.tipo==='presencial'};
            data.planificaciones.push(plan);
            ctx.auditoria?.('bloque_creado',{plan});
            ctx.guardar(); ctx.reconstruirIndices(); actualizarCelda(dia,bloque); refrescarDespuesCambioPlanificacion(); return true;
        }

        function eliminarBloque(plan){
            const data = getData();
            if(!data.modoPlan) {
                ctx.toast('Active Modo Planificación para eliminar bloques','info');
                return false;
            }
            if(plan.fijo){
                ctx.toast('Este bloque está fijo. Desbloquéalo antes de eliminarlo.','info');
                return false;
            }
            ctx.pushUndo(); data.planificaciones=data.planificaciones.filter(p=>p.id!==plan.id);
            ctx.auditoria?.('bloque_eliminado',{plan});
            ctx.guardar(); ctx.reconstruirIndices(); actualizarCelda(plan.dia,plan.bloque); refrescarDespuesCambioPlanificacion();
            return true;
        }

        function alternarBloqueFijo(plan){
            const data=getData();
            const actual=data.planificaciones.find(p=>p.id===plan.id);
            if(!actual) return;
            ctx.pushUndo();
            if(!actual.fijo && actual.explicacionAuto) {
                registrarMemoriaPlanificacion('bloque_auto_fijado', contextoMemoriaDesdePlan(actual));
            }
            actual.fijo=!actual.fijo;
            ctx.auditoria?.(actual.fijo?'bloque_fijado':'bloque_desfijado',{plan:actual});
            ctx.guardar();
            ctx.reconstruirIndices();
            actualizarCelda(actual.dia,actual.bloque);
            refrescarDespuesCambioPlanificacion();
            ctx.toast(actual.fijo?'Bloque fijado':'Bloque desbloqueado','success');
        }

        function mostrarPopupAccion(cell, plan){
            const data = getData();
            const popupState = ctx.popupState;
            const secVistaId=data.sel.seccionId;
            const meta=secVistaId?planVisibleEn(secVistaId,Number(cell.dataset.dia),Number(cell.dataset.bloque)):null;
            if(meta?.vinculado) return mostrarPopupVinculado(cell,meta);
            if (popupState._popupAbierto && popupState._popupCell === cell) { cerrarPopupAccion(); return; }
            cerrarPopupAccion();
            const popup = document.createElement('div'); popup.className = 'action-popup';
            popup.innerHTML = `
                ${plan.explicacionAuto?`<div class="action-popup-note"><strong>Explicación</strong><span>${ctx.escapeHTML(textoExplicacionAuto(plan.explicacionAuto))}</span></div>`:''}
                <button id="popupToggleFijo">${plan.fijo?'🔓 Desbloquear bloque':'🔒 Fijar bloque'}</button>
                <button id="popupMoverAsignatura">🔄 Mover asignatura</button>
                <button id="popupCambiarDocente">Cambiar docente</button>
                <button id="popupCambiarSala">Cambiar sala</button>
                ${data.modoPlan?'<button id="popupEliminarBloque">Eliminar este bloque</button><button id="popupEliminarTodos">Eliminar todos</button>':''}`;
            const rect = cell.getBoundingClientRect();
            const popupHeight = 220;
            const spaceBelow = window.innerHeight - rect.bottom;
            popup.style.left = Math.min(rect.left, window.innerWidth - 250) + 'px';
            popup.style.top = (spaceBelow >= popupHeight ? rect.bottom + 5 : Math.max(5, rect.top - popupHeight)) + 'px';
            document.body.appendChild(popup); popupState._popupAbierto = popup; popupState._popupCell = cell;
            requestAnimationFrame(()=>{ if(window._kbInitPopup) window._kbInitPopup(); });
            popup.querySelector('#popupToggleFijo').onclick = () => { alternarBloqueFijo(plan); cerrarPopupAccion(); };
            popup.querySelector('#popupMoverAsignatura').onclick = () => { iniciarModoMovimiento(plan); cerrarPopupAccion(); };
            popup.querySelector('#popupCambiarDocente').onclick = () => { cambiarDocenteAsignatura(plan); cerrarPopupAccion(); };
            popup.querySelector('#popupCambiarSala').onclick = () => { cambiarSalaAsignatura(plan); cerrarPopupAccion(); };
            if(data.modoPlan){
                popup.querySelector('#popupEliminarBloque').onclick = () => { if(confirm('¿Eliminar este bloque?')) eliminarBloque(plan); cerrarPopupAccion(); actualizarSelectoresPlan(); };
                popup.querySelector('#popupEliminarTodos').onclick = () => { if(confirm('¿Eliminar todos los bloques no fijos de esta asignatura?')){ ctx.pushUndo(); const eliminados=data.planificaciones.filter(p => !p.fijo && p.asignaturaId === plan.asignaturaId && p.seccionId === plan.seccionId); data.planificaciones = data.planificaciones.filter(p => p.fijo || !(p.asignaturaId === plan.asignaturaId && p.seccionId === plan.seccionId)); ctx.auditoria?.('bloques_eliminados_asignatura',{cantidad:eliminados.length,seccionId:plan.seccionId,asignaturaId:plan.asignaturaId,bloques:eliminados,respetaFijos:true}); ctx.guardar(); ctx.reconstruirIndices(); construirGrilla(); actualizarSelectoresPlan(); refrescarDespuesCambioPlanificacion(); } cerrarPopupAccion(); };
            }
        }

        function mostrarPopupVinculado(cell,meta){
            const data=getData();
            const popupState=ctx.popupState;
            if (popupState._popupAbierto && popupState._popupCell === cell) { cerrarPopupAccion(); return; }
            cerrarPopupAccion();
            const plan=meta.plan;
            const grupo=meta.grupo;
            const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
            const vinculadas=(grupo?.seccionesVinculadasIds||[]).map(nombreSeccion).join(', ')||'Sin secciones vinculadas';
            const popup=document.createElement('div');
            popup.className='action-popup';
            popup.innerHTML=`
                <div class="action-popup-note">
                    <strong>Bloque vinculado</strong>
                    <span>${ctx.escapeHTML(asig?.codigo||'Asignatura')} se dicta desde ${ctx.escapeHTML(nombreSeccion(plan.seccionId))}. Para modificarlo debes ir a la sección madre.</span>
                </div>
                <button id="popupIrMadre">Ir a sección madre</button>
                <button id="popupVerVinculadas">Ver secciones vinculadas</button>`;
            const rect=cell.getBoundingClientRect();
            const popupHeight=180;
            const spaceBelow=window.innerHeight-rect.bottom;
            popup.style.left=Math.min(rect.left,window.innerWidth-250)+'px';
            popup.style.top=(spaceBelow>=popupHeight?rect.bottom+5:Math.max(5,rect.top-popupHeight))+'px';
            document.body.appendChild(popup); popupState._popupAbierto=popup; popupState._popupCell=cell;
            requestAnimationFrame(()=>{ if(window._kbInitPopup) window._kbInitPopup(); });
            popup.querySelector('#popupIrMadre').onclick=()=>{
                data.sel.seccionId=plan.seccionId;
                const madre=data.secciones.find(s=>s.id===plan.seccionId);
                if(madre){
                    data.sel.nivelId=madre.nivelId;
                    const nivel=data.niveles.find(n=>n.id===madre.nivelId);
                    data.sel.carreraId=nivel?.carreraId||data.sel.carreraId;
                }
                actualizarSelectoresPlan();
                construirGrilla();
                actualizarProgresoPlan();
                cerrarPopupAccion();
                ctx.toast('Sección madre abierta','info');
            };
            popup.querySelector('#popupVerVinculadas').onclick=()=>{
                alert(`Sección madre: ${nombreSeccion(plan.seccionId)}\nVinculadas: ${vinculadas}`);
                cerrarPopupAccion();
            };
        }

        function cerrarPopupAccion() {
            const popupState = ctx.popupState;
            if(popupState._popupAbierto) {
                popupState._popupAbierto.remove();
                popupState._popupAbierto = null;
                popupState._popupCell = null;
            }
        }

        function iniciarModoMovimiento(plan){
            const data = getData();
            if(plan.fijo) return ctx.toast('Este bloque está fijo. Desbloquéalo antes de moverlo.','info');
            const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
            if(!asig) return;
            const docentes=data.docentes.filter(d=>d.id===ctx.DOCENTE_NN_ID||d.asignaturasQueDicta?.includes(plan.asignaturaId));
            if(!docentes.length) return ctx.toast('No hay otros docentes para esta asignatura','error');
            modoMovimiento={plan, asig, nuevoDocenteId:plan.docenteId, seccionId:plan.seccionId, salaId:plan.salaId};
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3 id="movTitulo"></h3>
                <div class="form-group"><label class="form-label">Nuevo docente</label><select class="form-select" id="movNuevoDocente"></select></div>
                <div class="form-group" style="display:flex;gap:8px;"><button class="btn btn-primary" id="btnMovVerDisponibilidad">👁️ Ver disponibilidad en grilla</button><button class="btn" id="btnMovCancelar">Cancelar</button></div>
            </div></div>`;
            document.getElementById('movTitulo').textContent='🔄 Mover: '+(asig.codigo||'');
            const selMovDocente=document.getElementById('movNuevoDocente');
            docentes.forEach(d=>{
                const opt=document.createElement('option');
                opt.value=d.id;
                opt.selected=d.id===plan.docenteId;
                opt.textContent=(d.nombre||'')+' '+(d.apellido||'');
                selMovDocente.appendChild(opt);
            });
            document.getElementById('btnMovVerDisponibilidad').onclick=()=>{
                modoMovimiento.nuevoDocenteId=document.getElementById('movNuevoDocente').value;
                ctx.cerrarModal(); data.modoPlan=true;
                document.getElementById('btnModoPlanificar').style.display='none';
                document.getElementById('btnAutoAsignatura').style.display='none'; document.getElementById('btnAutoSeccion').style.display='none'; document.getElementById('btnOptimizarHorario').style.display='none';
                document.getElementById('btnCancelarModo').style.display='inline-flex';
                document.getElementById('scheduleContainer').classList.add('modo-activo');
                document.getElementById('planProgreso').style.display='block';
                document.getElementById('planProgreso').textContent='🔄 Moviendo '+(asig.codigo||'')+' → '+(data.docentes.find(d=>d.id===modoMovimiento.nuevoDocenteId)?.nombre||'')+' — Arrastrá los bloques a las celdas verdes';
                construirGrillaMovimiento();
            };
            document.getElementById('btnMovCancelar').onclick=()=>{ modoMovimiento=null; ctx.cerrarModal(); };
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget){modoMovimiento=null;ctx.cerrarModal();}};
        }

        function cancelarMovimiento(){
            const data = getData();
            modoMovimiento=null; data.modoPlan=false;
            document.getElementById('btnModoPlanificar').style.display='inline-flex';
            document.getElementById('btnAutoAsignatura').style.display='none'; document.getElementById('btnAutoSeccion').style.display='none'; document.getElementById('btnOptimizarHorario').style.display='none';
            document.getElementById('btnCancelarModo').style.display='none';
            document.getElementById('scheduleContainer').classList.remove('modo-activo');
            document.getElementById('planProgreso').style.display='none';
            construirGrilla();
        }

        function hayMovimiento(){
            return !!modoMovimiento;
        }

        function construirGrillaMovimiento(){
            const data = getData();
            const indicePlan = ctx.getIndicePlan();
            const grid=document.getElementById('scheduleGrid'); grid.innerHTML='';
            grid.appendChild(ctx.createHeader());
            const mm=modoMovimiento; if(!mm) return;
            const secId=mm.seccionId, docId=mm.nuevoDocenteId;
            ctx.BLOQUES.forEach(b=>{
                grid.appendChild(ctx.createTimeCell(b));
                ctx.DIAS.forEach((d,di)=>{
                    const cell=document.createElement('div'); cell.className='grid-cell'; cell.dataset.dia=di; cell.dataset.bloque=b.n;
                    const visibleExistente=planVisibleEn(secId,di,b.n);
                    const planExistente=visibleExistente?.plan||null;
                    const esDeMiAsig=planExistente && !visibleExistente.vinculado && planExistente.asignaturaId===mm.plan.asignaturaId;
                    if(esDeMiAsig){
                        cell.classList.add('planned');
                        if(planExistente.fijo) cell.classList.add('fixed-plan');
                        cell.style.backgroundColor=mm.asig.color||'#e9ecef';
                        cell.innerHTML='';
                        const codigo=document.createElement('span');
                        codigo.textContent=(planExistente.fijo?'🔒 ':'')+(mm.asig.codigo||'');
                        const ayuda=document.createElement('small');
                        ayuda.textContent=planExistente.fijo?'Fijo':'Arrastrar';
                        cell.append(codigo,ayuda);
                    } else if(!planExistente){
                        const disp=checkDisponibilidad(docId,di,b.n,secId,{ignorarIds:[mm.plan.id]});
                        const ocupacionSala = ctx.getOcupacionSala();
                        if(disp.ok && (mm.salaId===ctx.SALA_VIRTUAL_ID||mm.salaId===ctx.SALA_TRO2_ID||!ocupacionSala[`${mm.salaId}_${di}_${b.n}`])){
                            cell.classList.add('available');
                            cell.innerHTML='<small>↳ destino</small>';
                        } else cell.classList.add('unavailable-docente');
                    } else cell.classList.add('unavailable-docente');
                    grid.appendChild(cell);
                });
            });
        }

        function checkDisponibilidadDocente(docId, dia, bloque, opciones={}) {
            const data = getData();
            const planes=ctx.getPlanificacionesFiltradas(opciones.ignorarIds||[]);
            const doc = data.docentes.find(d=>d.id===docId);
            if (!doc) return {ok:false, msg:'Docente no encontrado'};
            if (docId===ctx.DOCENTE_NN_ID) return {ok:true};
            if (!doc.disponibilidad?.[dia]?.[bloque-1]) return {ok:false, msg:`Docente no disponible en ${ctx.DIAS[dia]} B${bloque}`};
            if (planes.some(p=>p.docenteId===docId && p.dia===dia && p.bloque===bloque)) return {ok:false, msg:`Docente ya tiene clase en ${ctx.DIAS[dia]} B${bloque}`};
            const bloquesDiarios = planes.filter(p=>p.docenteId===docId && p.dia===dia).length;
            if (bloquesDiarios >= data.configuracion.bloquesDiariosMax) return {ok:false, msg:'Límite diario excedido'};
            const totalBloques = planes.filter(p=>p.docenteId===docId).length;
            if (!doc.autorizadoExceder && totalBloques >= data.configuracion.bloquesSemestralesMax) return {ok:false, msg:'Límite semestral excedido'};
            if (dia > 0) {
                const diaAnt = dia-1;
                const planesAnt = planes.filter(p=>p.docenteId===docId && p.dia===diaAnt);
                if (planesAnt.length) {
                    let maxFin = 0;
                    planesAnt.forEach(p=>{ const bf=ctx.getBloque(p.bloque); if(bf&&bf.hFin>maxFin) maxFin=bf.hFin; });
                    if (maxFin && (24*60 - maxFin + ctx.getBloque(bloque).hIni) < data.configuracion.horasDescanso*60) return {ok:false, msg:'No respeta descanso de 12 horas'};
                }
            }
            return {ok:true};
        }

        function cambiarDocenteAsignatura(plan){
            const data = getData();
            if(plan.fijo) return ctx.toast('Este bloque está fijo. Desbloquéalo antes de cambiar docente.','info');
            const docentesDisponibles=data.docentes.filter(d=>d.id===ctx.DOCENTE_NN_ID||d.asignaturasQueDicta?.includes(plan.asignaturaId));
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3>Cambiar docente para toda la asignatura</h3><select class="form-select" id="nuevoDocenteTodos"></select>
                <button class="btn btn-primary" id="btnCambiarDocenteTodos">Cambiar</button>
            </div></div>`;
            const selNuevoDocente=document.getElementById('nuevoDocenteTodos');
            docentesDisponibles.forEach(d=>{
                const opt=document.createElement('option');
                opt.value=d.id;
                opt.textContent=d.id===ctx.DOCENTE_NN_ID?'Docente NN (pendiente)':(d.nombre||'')+' '+(d.apellido||'');
                selNuevoDocente.appendChild(opt);
            });
            document.getElementById('btnCambiarDocenteTodos').onclick=()=>{
                const nuevoDocenteId=document.getElementById('nuevoDocenteTodos').value;
                const planesFijos = data.planificaciones.filter(p=>p.fijo && p.asignaturaId===plan.asignaturaId && p.seccionId===plan.seccionId);
                if(planesFijos.length) return ctx.toast('Hay bloques fijos en esta asignatura. Desbloquéalos antes de cambiar docente.','info');
                const planesCambiar = data.planificaciones.filter(p=>p.asignaturaId===plan.asignaturaId && p.seccionId===plan.seccionId);
                const idsCambiar = planesCambiar.map(p=>p.id);
                const docenteNuevo = data.docentes.find(d=>d.id===nuevoDocenteId);
                const planesRestantes = ctx.getPlanificacionesFiltradas(idsCambiar);
                if (docenteNuevo && !docenteNuevo.autorizadoExceder) {
                    const totalTrasCambio = planesRestantes.filter(p=>p.docenteId===nuevoDocenteId).length + planesCambiar.length;
                    if (totalTrasCambio > data.configuracion.bloquesSemestralesMax) {
                        ctx.toast('Error: límite semestral excedido', 'error');
                        return;
                    }
                }
                if(nuevoDocenteId!==ctx.DOCENTE_NN_ID){
                    for (const dia of [...new Set(planesCambiar.map(p=>p.dia))]) {
                        const totalDia = planesRestantes.filter(p=>p.docenteId===nuevoDocenteId && p.dia===dia).length + planesCambiar.filter(p=>p.dia===dia).length;
                        if (totalDia > data.configuracion.bloquesDiariosMax) {
                            ctx.toast(`Error: límite diario excedido en ${ctx.DIAS[dia]}`, 'error');
                            return;
                        }
                    }
                }
                let errorBloque = null;
                for (const p of planesCambiar) {
                    const disp = checkDisponibilidadDocente(nuevoDocenteId, p.dia, p.bloque,{ignorarIds:idsCambiar});
                    if (!disp.ok) { errorBloque = disp.msg; break; }
                }
                if (errorBloque) { ctx.toast(`Error: ${errorBloque}`, 'error'); return; }
                ctx.pushUndo();
                planesCambiar.forEach(p=>{
                    if(p.explicacionAuto || p.docenteId===ctx.DOCENTE_NN_ID || nuevoDocenteId!==p.docenteId){
                        registrarMemoriaPlanificacion('docente_corregido', Object.assign(contextoMemoriaDesdePlan(p),{
                            docenteAnteriorId:p.docenteId,
                            docenteNuevoId:nuevoDocenteId,
                            desdeDocenteNN:p.docenteId===ctx.DOCENTE_NN_ID
                        }));
                    }
                    p.docenteId=nuevoDocenteId;
                });
                ctx.guardar(); ctx.reconstruirIndices(); construirGrilla(); actualizarSelectoresPlan(); refrescarDespuesCambioPlanificacion(); ctx.cerrarModal(); ctx.toast('Docente cambiado en toda la asignatura','success');
            };
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget)ctx.cerrarModal();};
        }

        function cambiarSalaAsignatura(plan){
            const data = getData();
            if(plan.fijo) return ctx.toast('Este bloque está fijo. Desbloquéalo antes de cambiar sala.','info');
            const planesAsig = data.planificaciones.filter(p=>p.asignaturaId===plan.asignaturaId && p.seccionId===plan.seccionId && p.tipoPresencial!==false);
            if(planesAsig.some(p=>p.fijo)) return ctx.toast('Hay bloques fijos en esta asignatura. Desbloquéalos antes de cambiar sala.','info');
            const salasUnicas = [...new Set(planesAsig.map(p=>p.salaId))];
            let html = '<div class="modal-overlay" id="modalOverlay"><div class="modal"><h3>Cambiar salas presenciales</h3>';
            if(salasUnicas.length===0) html+='<p>No hay bloques presenciales para esta asignatura.</p>';
            else {
                html+='<table width="100%"><tr><th>Sala actual</th><th>Nueva sala</th></tr>';
                salasUnicas.forEach(salaId=>{
                    const salaActual = data.salas.find(s=>s.id===salaId);
                    const salasDisponibles = data.salas.filter(s=>!s.esVirtual);
                    html+=`<tr><td>${ctx.escapeHTML(salaActual?.nombre||salaId)}</td><td><select class="form-select nuevoSala" data-sala="${ctx.escapeAttr(salaId)}"><option value="">No cambiar</option>${salasDisponibles.map(s=>ctx.optionHTML(s.id,s.nombre)).join('')}</select></td></tr>`;
                });
                html+='</table>';
            }
            html+='<button class="btn btn-primary" id="btnAplicarCambioSala">Aplicar cambios</button></div></div>';
            document.getElementById('modalContainer').innerHTML = html;
            document.getElementById('btnAplicarCambioSala')?.addEventListener('click',()=>{
                const cambios = {};
                document.querySelectorAll('.nuevoSala').forEach(sel=>{
                    if(sel.value) cambios[sel.dataset.sala] = sel.value;
                });
                if(Object.keys(cambios).length===0) return ctx.toast('No se seleccionó ningún cambio','error');
                const ocupacionSala = ctx.getOcupacionSala();
                for (const p of planesAsig) {
                    const nuevaSala = cambios[p.salaId] || p.salaId;
                    if (nuevaSala !== p.salaId) {
                        if (nuevaSala !== ctx.SALA_VIRTUAL_ID && nuevaSala !== ctx.SALA_TRO2_ID && ocupacionSala[`${nuevaSala}_${p.dia}_${p.bloque}`]) {
                            return ctx.toast(`Error: la sala ${data.salas.find(s=>s.id===nuevaSala)?.nombre} está ocupada en ${ctx.DIAS[p.dia]} B${p.bloque}`, 'error');
                        }
                    }
                }
                ctx.pushUndo(); planesAsig.forEach(p=>{
                    if(cambios[p.salaId]){
                        registrarMemoriaPlanificacion('sala_corregida', Object.assign(contextoMemoriaDesdePlan(p),{
                            salaAnteriorId:p.salaId,
                            salaNuevaId:cambios[p.salaId],
                            desdeTRO2:p.salaId===ctx.SALA_TRO2_ID
                        }));
                        p.salaId = cambios[p.salaId];
                    }
                });
                ctx.guardar(); ctx.reconstruirIndices(); construirGrilla(); actualizarSelectoresPlan(); refrescarDespuesCambioPlanificacion(); ctx.cerrarModal(); ctx.toast('Salas actualizadas','success');
            });
            document.getElementById('modalOverlay')?.addEventListener('click',(e)=>{if(e.target===e.currentTarget)ctx.cerrarModal();});
        }

        function actualizarSelectoresPlan(){
            const data = getData();
            const contadorDocente = ctx.getContadorDocente();
            const carr=document.getElementById('planCarrera'); const niv=document.getElementById('planNivel'); const jor=document.getElementById('planJornada'); const sec=document.getElementById('planSeccion');
            const asig=document.getElementById('planAsignatura'); const doc=document.getElementById('planDocente'); const sala=document.getElementById('planSala');
            carr.innerHTML='<option value="">-- Carrera --</option>'+data.carreras.map(c=>ctx.optionHTML(c.id, `${c.nombre||''}${c.especialidad?` [${c.especialidad}]`:''}`)).join(''); carr.value=data.sel.carreraId||'';
            niv.innerHTML='<option value="">-- Nivel --</option>'+(data.sel.carreraId?data.niveles.filter(n=>n.carreraId===data.sel.carreraId).sort(ordenarNivelesDesc).map(n=>ctx.optionHTML(n.id,n.nombre)).join(''):''); niv.value=data.sel.nivelId||''; niv.disabled=!data.sel.carreraId;
            const seccionesNivel=data.sel.nivelId?data.secciones.filter(s=>s.nivelId===data.sel.nivelId):[];
            const jornadas=[...new Set(seccionesNivel.map(jornadaSeccion))].sort((a,b)=>a==='diurna'?-1:b==='diurna'?1:0);
            if(data.sel.jornada&&!jornadas.includes(data.sel.jornada)) data.sel.jornada=null;
            if(!data.sel.jornada&&jornadas.length===1) data.sel.jornada=jornadas[0];
            jor.innerHTML='<option value="">-- Jornada --</option>'+jornadas.map(j=>ctx.optionHTML(j,etiquetaJornada(j))).join('');
            jor.value=data.sel.jornada||''; jor.disabled=!data.sel.nivelId||!jornadas.length;
            const seccionesFiltradas=seccionesNivel.filter(s=>!data.sel.jornada||jornadaSeccion(s)===data.sel.jornada).sort(ordenarSeccionesNombre);
            if(data.sel.seccionId&&!seccionesFiltradas.some(s=>s.id===data.sel.seccionId)) data.sel.seccionId=null;
            sec.innerHTML='<option value="">-- Sección --</option>'+(data.sel.jornada?seccionesFiltradas.map(s=>ctx.optionHTML(s.id,s.nombre)).join(''):''); sec.value=data.sel.seccionId||''; sec.disabled=!data.sel.nivelId||!data.sel.jornada;
            const asignaturasSelector=data.sel.seccionId?asignaturasDeSeccion(data.sel.seccionId):(data.sel.carreraId&&data.sel.nivelId?data.asignaturaCarreraNivel.filter(r=>r.carreraId===data.sel.carreraId&&r.nivelId===data.sel.nivelId).map(r=>r.asignaturaId):[]);
            asig.innerHTML='<option value="">-- Asignatura --</option>'+(asignaturasSelector.length?asignaturasSelector.map(asignaturaId=>{
                const r={asignaturaId};
                const a=data.asignaturas.find(x=>x.id===r.asignaturaId); if(!a) return '';
                const partes=[]; if(a.horasPresenciales>0) partes.push(a.horasPresenciales+'hP'); if(a.horasVirtuales>0) partes.push(a.horasVirtuales+'hV');
                const resumen=data.sel.seccionId?resumenDictacionCorto(a.id,data.sel.seccionId):'';
                const vinculo=resumen?` · ${resumen}`:'';
                return ctx.optionHTML(a.id, `${a.codigo} - ${a.nombre} (${partes.join(' + ')})${vinculo}`);
            }).join(''):''); asig.value=data.sel.asignaturaId||''; asig.disabled=!data.sel.seccionId;
            actualizarMensajesPlanificador();
            doc.innerHTML='<option value="">-- Docente --</option>'+(data.sel.asignaturaId?(()=>{
                const carreraEsp=data.sel.carreraId?data.carreras.find(c=>c.id===data.sel.carreraId)?.especialidad:null;
                return data.docentes.filter(d=>d.id===ctx.DOCENTE_NN_ID||d.asignaturasQueDicta?.includes(data.sel.asignaturaId)).map(d=>{
                    if(d.id===ctx.DOCENTE_NN_ID) return ctx.optionHTML(d.id,'Docente NN (pendiente)');
                    const usados=contadorDocente[d.id]||0;
                    const matchEsp=carreraEsp&&d.especialidad===carreraEsp;
                    return ctx.optionHTML(d.id, `${d.nombre} ${d.apellido}${d.especialidad?` [${d.especialidad}]`:''} (${usados}/${data.configuracion.bloquesSemestralesMax} · ${usados*18}h)${matchEsp?' ★':''}`, false, !d.autorizadoExceder&&usados>=data.configuracion.bloquesSemestralesMax);
                }).join('');
            })():''); doc.value=data.sel.docenteId||''; doc.disabled=!data.sel.asignaturaId;
            sala.innerHTML='<option value="">-- Sala --</option>'+data.salas.map(s=>ctx.optionHTML(s.id,s.nombre)).join(''); sala.value=data.sel.salaId||''; sala.disabled=!data.sel.docenteId;
        }

        function actualizarProgresoPlan(){
            const data = getData();
            const el=document.getElementById('planProgreso');
            if(!data.sel.seccionId||!data.sel.asignaturaId||!data.sel.docenteId){
                el.style.display='none'; return;
            }
            const asig=data.asignaturas.find(a=>a.id===data.sel.asignaturaId);
            if(!asig){ el.style.display='none'; return; }
            const visibles=planesVisiblesAsignaturaSeccion(asig.id,data.sel.seccionId);
            const planesP=visibles.filter(p=>p.tipoPresencial!==false);
            const planesV=visibles.filter(p=>p.tipoPresencial===false);
            const reqP=asig.bloquesPresenciales, reqV=asig.bloquesVirtuales;
            const pctP=reqP?Math.round(planesP.length/reqP*100):0, pctV=reqV?Math.round(planesV.length/reqV*100):0;
            const totalReq=reqP+reqV, totalPlan=planesP.length+planesV.length;
            const colorP=pctP>=100?'var(--success)':pctP>0?'var(--warning)':'var(--text-secondary)';
            const colorV=pctV>=100?'var(--success)':pctV>0?'var(--warning)':'var(--text-secondary)';
            const resumen=resumenDictacionAsignatura(asig.id,data.sel.seccionId);
            const nota=resumen?` · ${ctx.escapeHTML(resumen)}`:'';
            el.innerHTML=`Presencial: <span style="color:${colorP};font-weight:600;">${planesP.length}/${reqP}</span> · Virtual: <span style="color:${colorV};font-weight:600;">${planesV.length}/${reqV}</span> · Total: ${totalPlan}/${totalReq}${nota}`;
            el.style.display='block';
            actualizarMensajesPlanificador();
        }

        function autoAsignarBloques(asigId, secId, docId, salaId, esPresencial, offsetDia, opciones={}) {
            const data = getData();
            const asig=data.asignaturas.find(a=>a.id===asigId); if(!asig) return 0;
            if(!opciones.permitirVinculada && esAsignaturaVinculada(asigId,secId)) return 0;
            const cfgAuto=data.configuracion.autoPlanificacion||{};
            const estrategia=opciones.estrategia||'balanceada';
            function pesosAutoAsignatura(){
                if(asig.distribucion==='compacta') return {adj:38,suelto:6,carga:5,recreo:8,largo:1};
                if(asig.distribucion==='dividida') return {adj:12,suelto:26,carga:20,recreo:10,largo:9};
                if(asig.distribucion==='balanceada') return {adj:22,suelto:15,carga:14,recreo:10,largo:4};
                return estrategia==='compacta'
                    ? {adj:34,suelto:8,carga:5,recreo:8,largo:2}
                    : {adj:20,suelto:15,carga:12,recreo:10,largo:4};
            }
            const pesos=pesosAutoAsignatura();
            const sec=data.secciones.find(se=>se.id===secId);
            const nivel=sec?data.niveles.find(n=>n.id===sec.nivelId):null;
            const parsed=sec?ctx.parsearCodigoSeccion(sec.nombre):null;
            const esVespertino=parsed&&parsed.tipo==='V';
            const esPrimerNivel=parsed?.nivel==='N1'||/(\b|-)N?1(\b|-)/i.test(sec?.nombre||'');
            const nivelTieneOnline=!!nivel?.tieneOnline;
            const esCritica=asig.condicion==='alta-reprobacion'||asig.condicion==='alta-reprobacion-ayudantia';
            const requiereAyudantia=asig.condicion==='requiere-ayudantia'||asig.condicion==='alta-reprobacion-ayudantia';
            const req=esPresencial?asig.bloquesPresenciales:asig.bloquesVirtuales;
            const prefiereContinuo=esPresencial && asig.distribucion!=='dividida';
            const maxRangoPreferido=prefiereContinuo ? (pendientes=>pendientes<=4?pendientes:4) : (pendientes=>Math.min(pendientes,2));
            const visibles=planesVisiblesAsignaturaSeccion(asigId,secId);
            const ya=esPresencial?visibles.filter(p=>p.tipoPresencial!==false).length:visibles.filter(p=>p.tipoPresencial===false).length;
            const pendientes=req-ya; if(pendientes<=0) return 0;
            const salasPref=asig.salasPreferidas||[];
            const salaReal = !esPresencial ? ctx.SALA_VIRTUAL_ID : (salaId||(salasPref.length?null:ctx.SALA_TRO2_ID));
            const asignados=[];
            function salaOk(sala,dia,bloque){
                return sala===ctx.SALA_VIRTUAL_ID||sala===ctx.SALA_TRO2_ID||!data.planificaciones.some(p=>p.salaId===sala&&p.dia===dia&&p.bloque===bloque);
            }
            function cargaSeccionDia(dia){
                const existentes=planesVisiblesSeccionDia(secId,dia).length;
                const nuevos=asignados.filter(p=>p.dia===dia).length;
                return existentes+nuevos;
            }
            function asignaturasDistintasSeccionDia(dia){
                return new Set([
                    ...planesVisiblesSeccionDia(secId,dia).map(p=>p.asignaturaId),
                    ...asignados.filter(p=>p.dia===dia).map(p=>p.asignaturaId)
                ].filter(id=>id&&id!==asigId)).size;
            }
            function cargaDocenteDiaLocal(dia){
                if(docId===ctx.DOCENTE_NN_ID) return 0;
                const existentes=data.planificaciones.filter(p=>p.docenteId===docId&&p.dia===dia).length;
                const nuevos=asignados.filter(p=>p.dia===dia).length;
                return existentes+nuevos;
            }
            function bloquesOrdenados(items){
                return [...new Set(items.map(Number).filter(n=>Number.isFinite(n)))].sort((a,b)=>a-b);
            }
            function ventanasEnBloques(bloques){
                const ordenados=bloquesOrdenados(bloques);
                if(ordenados.length<2) return 0;
                let ventanas=0;
                for(let i=1;i<ordenados.length;i++) ventanas+=Math.max(0,ordenados[i]-ordenados[i-1]-1);
                return ventanas;
            }
            function bloquesSeccionDiaCon(dia,bloque){
                return bloquesOrdenados([
                    ...planesVisiblesSeccionDia(secId,dia).map(p=>p.bloque),
                    ...asignados.filter(p=>p.dia===dia).map(p=>p.bloque),
                    bloque
                ]);
            }
            function bloquesDocenteDiaCon(dia,bloque){
                if(docId===ctx.DOCENTE_NN_ID) return [bloque];
                return bloquesOrdenados([
                    ...data.planificaciones.filter(p=>p.docenteId===docId&&p.dia===dia).map(p=>p.bloque),
                    ...asignados.filter(p=>p.dia===dia).map(p=>p.bloque),
                    bloque
                ]);
            }
            function bloquesAsignaturaDiaCon(dia,bloque){
                return bloquesOrdenados([
                    ...planesVisiblesAsignaturaSeccion(asigId,secId).filter(p=>p.dia===dia).map(p=>p.bloque),
                    ...asignados.filter(p=>p.dia===dia).map(p=>p.bloque),
                    bloque
                ]);
            }
            function puntajePorVentanas(dia,bloque){
                const secAntes=ventanasEnBloques([
                    ...planesVisiblesSeccionDia(secId,dia).map(p=>p.bloque),
                    ...asignados.filter(p=>p.dia===dia).map(p=>p.bloque)
                ]);
                const secDespues=ventanasEnBloques(bloquesSeccionDiaCon(dia,bloque));
                const docAntes=docId===ctx.DOCENTE_NN_ID?0:ventanasEnBloques([
                    ...data.planificaciones.filter(p=>p.docenteId===docId&&p.dia===dia).map(p=>p.bloque),
                    ...asignados.filter(p=>p.dia===dia).map(p=>p.bloque)
                ]);
                const docDespues=docId===ctx.DOCENTE_NN_ID?0:ventanasEnBloques(bloquesDocenteDiaCon(dia,bloque));
                return ((secAntes-secDespues)*18)+((docAntes-docDespues)*14)-Math.max(0,secDespues-secAntes)*22-Math.max(0,docDespues-docAntes)*18;
            }
            function puntajeContinuidad(dia,bloque){
                const bloquesAsig=bloquesAsignaturaDiaCon(dia,bloque);
                const tieneVecino=bloquesAsig.includes(bloque-1)||bloquesAsig.includes(bloque+1);
                if(tieneVecino) return asig.distribucion==='dividida' ? 8 : 32;
                const bloquesSec=bloquesSeccionDiaCon(dia,bloque);
                const tocaOtraClase=bloquesSec.includes(bloque-1)||bloquesSec.includes(bloque+1);
                return tocaOtraClase ? 12 : -10;
            }
            function puntajeCargaDocente(dia,bloque){
                if(docId===ctx.DOCENTE_NN_ID) return 0;
                const bloques=bloquesDocenteDiaCon(dia,bloque);
                const carga=bloques.length;
                let score=0;
                if(carga>data.configuracion.bloquesDiariosMax) score-=80+(carga-data.configuracion.bloquesDiariosMax)*20;
                if(carga>=9) score-=18;
                if(carga<=4) score+=8;
                return score;
            }
            function puntajeSala(salaElegida){
                if(!esPresencial) return 0;
                if(salaElegida===ctx.SALA_TRO2_ID) return -18;
                if(salasPref.includes(salaElegida)) return 16;
                return 0;
            }
            function puntajeBordeVirtual(bloque){
                if(esVespertino) return bloque>=16 ? 18 : -Math.abs(18-bloque)*4;
                if(bloque<=2) return 12;
                if(bloque>=16) return 14;
                return -Math.min(Math.abs(bloque-1),Math.abs(18-bloque))*3;
            }
            function razonesCandidato(dia,bloque,item){
                const razones=[];
                const bloquesAsig=bloquesAsignaturaDiaCon(dia,bloque);
                const bloquesSec=bloquesSeccionDiaCon(dia,bloque);
                const bloquesDoc=bloquesDocenteDiaCon(dia,bloque);
                if(bloquesAsig.includes(bloque-1)||bloquesAsig.includes(bloque+1)) razones.push('mantiene continuidad de la asignatura');
                else if(bloquesSec.includes(bloque-1)||bloquesSec.includes(bloque+1)) razones.push('se acopla al horario de la sección');
                if(contarVentanasGlobal(bloquesSec)<=contarVentanasGlobal(bloquesSec.filter(b=>b!==bloque))) razones.push('no aumenta ventanas de la sección');
                if(docId!==ctx.DOCENTE_NN_ID&&contarVentanasGlobal(bloquesDoc)<=contarVentanasGlobal(bloquesDoc.filter(b=>b!==bloque))) razones.push('cuida la continuidad docente');
                if(item?.sala&&salasPref.includes(item.sala)) razones.push('usa sala preferida');
                if(!esPresencial&&dia===5) razones.push('ubica virtual en sábado preferente');
                if(esVespertino&&bloque>=13) razones.push('respeta jornada vespertina');
                if(item?.blandas?.length) razones.push(...item.blandas.slice(0,2));
                return [...new Set(razones)].slice(0,5);
            }
            function evaluarCandidatoAuto(dia,bloque){
                const motivos=[];
                const blandas=[];
                if(esVespertino&&bloque<13) return {permitido:false,motivos:['Sección vespertina']};
                if(seccionOcupadaVisible(secId,dia,bloque)) return {permitido:false,motivos:['Sección ocupada']};
                if(planesVisiblesAsignaturaSeccion(asigId,secId).some(p=>p.dia===dia&&p.bloque===bloque)) return {permitido:false,motivos:['Asignatura ya planificada']};
                const disp=checkDisponibilidad(docId,dia,bloque,secId);
                if(!disp.ok) return {permitido:false,motivos:[disp.msg||'Docente no disponible']};
                let salaElegida=salaReal;
                if(esPresencial&&!salaElegida&&salasPref.length) salaElegida=salasPref.find(s=>salaOk(s,dia,bloque))||null;
                if(esPresencial&&salaElegida&&salaElegida!==ctx.SALA_VIRTUAL_ID&&salaElegida!==ctx.SALA_TRO2_ID&&!salaOk(salaElegida,dia,bloque)) return {permitido:false,motivos:['Sala ocupada']};
                let puntaje=0;
                const cargaDia=cfgAuto.balancearDias===false?0:cargaSeccionDia(dia);
                const diaObjetivo=Number.isFinite(Number(offsetDia))?Number(offsetDia)%5:null;
                const distanciaObjetivo=diaObjetivo===null?0:Math.min(Math.abs(dia-diaObjetivo),5-Math.abs(dia-diaObjetivo));
                if(esPresencial&&diaObjetivo!==null&&dia<5){
                    if(dia===diaObjetivo) puntaje+=estrategia==='compacta'?42:34;
                    else puntaje-=distanciaObjetivo*(estrategia==='compacta'?14:18);
                }
                if(cargaDia>0){
                    puntaje-=cargaDia*pesos.carga;
                    if(cargaDia>=4) puntaje-=Math.pow(cargaDia-3,2)*10;
                    blandas.push('Día cargado');
                }
                if(esPresencial&&cfgAuto.distribuirAsignaturasDias!==false){
                    const distintas=asignaturasDistintasSeccionDia(dia);
                    if(distintas){
                        const castigo=estrategia==='docente'?16:estrategia==='compacta'?22:28;
                        puntaje-=distintas*castigo;
                        blandas.push('Evita mezclar demasiadas asignaturas el mismo día');
                    }
                }
                puntaje+=puntajePorVentanas(dia,bloque);
                puntaje+=puntajeContinuidad(dia,bloque);
                puntaje+=puntajeCargaDocente(dia,bloque);
                puntaje+=puntajeSala(salaElegida||salaReal||ctx.SALA_TRO2_ID);
                const memoriaAuto=puntajeMemoriaAuto({asigId,secId,docId,salaId:salaElegida||salaReal||ctx.SALA_TRO2_ID,dia,bloque});
                puntaje+=memoriaAuto.puntaje;
                if(memoriaAuto.razones.length) blandas.push(...memoriaAuto.razones);
                if(!esPresencial){
                    const cargaDocDia=cargaDocenteDiaLocal(dia);
                    puntaje-=cargaDocDia*18;
                    if(dia===5 && cfgAuto.priorizarVirtualSabado!==false){
                        puntaje+=70;
                        if(asig.modalidad==='online-teams'&&bloque<=8) puntaje+=24;
                        if(asig.modalidad!=='online-teams'&&nivelTieneOnline&&bloque<9) puntaje-=34;
                    } else {
                        puntaje+=puntajeBordeVirtual(bloque);
                    }
                    blandas.push('Virtual autoaprendizaje');
                }
                if(!esVespertino&&bloque<=2&&asig.preferenciaHoraria==='evitar-temprano'){puntaje-=40; blandas.push('Preferencia: evitar temprano');}
                if(cfgAuto.evitarTempranoN1!==false&&!esVespertino&&esPrimerNivel&&bloque<=2){puntaje-=24; blandas.push('N1: evitar B1-B2 si es posible');}
                if(cfgAuto.cuidarCriticas!==false&&esPresencial&&esCritica){
                    if(!esVespertino&&bloque<=2){puntaje-=18; blandas.push('Crítica: evitar inicio temprano');}
                    if(bloque>=16){puntaje-=10; blandas.push('Crítica: evitar extremo tarde');}
                    if(cargaDia>0) puntaje-=cargaDia*6;
                }
                if(cfgAuto.cuidarAyudantias!==false&&esPresencial&&requiereAyudantia&&cargaSeccionDia(dia)>=4){
                    puntaje-=16;
                    blandas.push('Ayudantía: conservar margen del día');
                }
                if(estrategia==='docente') puntaje+=puntajePorVentanas(dia,bloque);
                if(estrategia==='compacta'&&esPresencial) puntaje+=puntajeContinuidad(dia,bloque);
                if(bloque===7){puntaje-=Math.max(2,Math.round(pesos.recreo/3)); blandas.push('Bloque cercano a recreo');}
                return {permitido:true,motivos,blandas,puntaje,sala:salaElegida||salaReal||ctx.SALA_TRO2_ID,bloque};
            }
            function mejorRangoPorDia(dia){
                const disponibles=[];
                for(let b=1;b<=18;b++){
                    const evaluacion=evaluarCandidatoAuto(dia,b);
                    if(evaluacion.permitido) disponibles.push(evaluacion);
                }
                const minRango=prefiereContinuo ? Math.min(pendientes, pendientes<=4?pendientes:3) : Math.min(pendientes,2);
                const maxRango=Math.max(minRango, maxRangoPreferido(pendientes));
                if(disponibles.length<minRango) return null;
                let mejorRango=null, mejorScore=-9999;
                for(let inicio=1;inicio<=18;inicio++) for(let fin=inicio;fin<=18&&fin-inicio+1<=maxRango;fin++){
                    const rango=[]; let valido=true;
                    for(let b=inicio;b<=fin;b++){
                        if(esVespertino&&b<13){valido=false;break;}
                        if(!disponibles.some(d=>d.bloque===b)){valido=false;break;}
                        rango.push(disponibles.find(d=>d.bloque===b));
                    }
                    if(!valido||rango.length<minRango) continue;
                    let adj=0, suelto=0;
                    let puntajeCandidatos=0;
                    rango.forEach(item=>{
                        const b=item.bloque||item;
                        puntajeCandidatos+=item.puntaje||0;
                        if(rango.some(i=>(i.bloque||i)===b-1)||rango.some(i=>(i.bloque||i)===b+1)) adj+=pesos.adj;
                        else suelto+=pesos.suelto;
                    });
                    const penalizacionLargo=asig.distribucion==='dividida'?Math.max(0,rango.length-2)*pesos.largo:rango.length*pesos.largo;
                    const faltantes=Math.max(0,Math.min(pendientes,maxRango)-rango.length);
                    const bonusContinuidad=prefiereContinuo ? rango.length*18 : 0;
                    const castigoCorte=prefiereContinuo ? faltantes*45 : faltantes*12;
                    const score=adj-suelto+puntajeCandidatos+bonusContinuidad-castigoCorte-penalizacionLargo;
                    if(score>mejorScore){mejorScore=score;mejorRango=rango;}
                }
                if(!mejorRango||mejorRango.length<minRango) return null;
                return mejorRango;
            }
            const diasBase=[0,1,2,3,4];
            const inicioDia=Number.isFinite(Number(offsetDia))?Number(offsetDia)%5:0;
            const diasOrden=esPresencial
                ? [...diasBase.slice(inicioDia),...diasBase.slice(0,inicioDia),5]
                : [5,...diasBase.slice().sort((a,b)=>cargaDocenteDiaLocal(a)-cargaDocenteDiaLocal(b)||a-b)];
            let rest=pendientes;
            for(const dia of diasOrden){
                if(rest<=0) break;
                if(!esPresencial||dia!==5||cfgAuto.permitirSabadoPresencial===true){
                    const rango=mejorRangoPorDia(dia);
                    if(rango){
                        const tomar=rango.slice(0,Math.min(rest,rango.length));
                        tomar.forEach(item=>asignados.push({
                            dia,
                            bloque:item.bloque||item,
                            sala:item.sala||salaReal||ctx.SALA_TRO2_ID,
                            puntaje:item.puntaje||0,
                            razones:razonesCandidato(dia,item.bloque||item,item)
                        }));
                        rest-=tomar.length;
                    }
                }
            }
            if(!asignados.length) return 0;
            const origenExp=opciones.origen||'auto_asignatura';
            if(opciones.simularDetalles) return asignados.map(({dia,bloque,sala,puntaje,razones},idx)=>({
                id:`sim_${asigId}_${secId}_${docId}_${dia}_${bloque}_${idx}`,
                seccionId:secId,
                asignaturaId:asigId,
                docenteId:docId,
                salaId:sala||ctx.SALA_TRO2_ID,
                dia,
                bloque,
                tipoPresencial:esPresencial,
                explicacionAuto:normalizarExplicacionAuto({origen:origenExp,estrategia,puntaje,razones})
            }));
            if(opciones.simular) return asignados.length;
            if(!opciones.omitirUndo) ctx.pushUndo();
            asignados.forEach(({dia,bloque,sala,puntaje,razones})=>{
                const id=ctx.genId();
                const planNuevo={id,seccionId:secId,asignaturaId:asigId,docenteId:docId,salaId:sala||ctx.SALA_TRO2_ID,dia,bloque,tipoPresencial:esPresencial,explicacionAuto:normalizarExplicacionAuto({origen:origenExp,estrategia,puntaje,razones})};
                data.planificaciones.push(planNuevo);
                if(Array.isArray(opciones.registrarIds)) opciones.registrarIds.push(id);
                if(Array.isArray(opciones.registrarExplicaciones)) opciones.registrarExplicaciones.push({id,explicacion:planNuevo.explicacionAuto});
            });
            ctx.reconstruirIndices();
            return asignados.length;
        }

        function registrarAutoEjecucion(tipo, ids, meta={}){
            const data=getData();
            const limpios=[...new Set((ids||[]).filter(Boolean))];
            if(!limpios.length) return;
            const ejecucion={
                id:ctx.genId(),
                ts:new Date().toISOString(),
                tipo,
                ids:limpios,
                meta
            };
            data.ultimaAutoEjecucion=ejecucion;
            data.autoEjecuciones=Array.isArray(data.autoEjecuciones)?data.autoEjecuciones:[];
            data.autoEjecuciones.unshift(ejecucion);
            data.autoEjecuciones=data.autoEjecuciones.slice(0,30);
            return ejecucion;
        }

        function deshacerAutoEjecucion(ejecId=null){
            const data=getData();
            const ejec=ejecId
                ? (data.autoEjecuciones||[]).find(e=>e.id===ejecId)
                : data.ultimaAutoEjecucion;
            if(!ejec?.ids?.length) return ctx.toast('No hay una auto-asignación reciente para deshacer','info');
            const ids=new Set(ejec.ids);
            const existentes=data.planificaciones.filter(p=>ids.has(p.id) && !p.fijo);
            const fijosProtegidos=data.planificaciones.filter(p=>ids.has(p.id) && p.fijo).length;
            if(!existentes.length){
                if(fijosProtegidos) return ctx.toast('Esa auto-asignación solo tiene bloques fijos protegidos','info');
                data.autoEjecuciones=(data.autoEjecuciones||[]).filter(e=>e.id!==ejec.id);
                if(data.ultimaAutoEjecucion?.id===ejec.id) data.ultimaAutoEjecucion=data.autoEjecuciones[0]||null;
                ctx.guardar();
                ctx.renderDashboard?.();
                return ctx.toast('Esa auto-asignación ya no tiene bloques activos','info');
            }
            const tipo={auto_asignatura:'Auto-asignatura',auto_seccion:'Auto-sección',auto_general:'Auto-general'}[ejec.tipo]||'Auto-asignación';
            const notaFijos=fijosProtegidos?`\n\n${fijosProtegidos} bloque(s) fijo(s) se mantendrán protegidos.`:'';
            if(!confirm(`Se eliminarán ${existentes.length} bloque(s) no fijo(s) creados por ${tipo}. ¿Continuar?${notaFijos}`)) return;
            ctx.pushUndo();
            data.planificaciones=data.planificaciones.filter(p=>!ids.has(p.id) || p.fijo);
            data.autoEjecuciones=(data.autoEjecuciones||[]).filter(e=>e.id!==ejec.id);
            if(data.ultimaAutoEjecucion?.id===ejec.id) data.ultimaAutoEjecucion=data.autoEjecuciones[0]||null;
            if(ejec.tipo==='auto_general' && data.ultimoAutoGeneral?.ejecucionId===ejec.id) data.ultimoAutoGeneral=null;
            ctx.auditoria?.('deshacer_auto', {tipo:ejec.tipo, bloquesEliminados:existentes.length,bloquesFijosProtegidos:fijosProtegidos});
            ctx.reconstruirIndices();
            ctx.guardar();
            construirGrilla();
            actualizarSelectoresPlan();
            actualizarProgresoPlan();
            ctx.renderDashboard?.();
            ctx.detectarConflictos?.();
            ctx.toast(`${tipo} deshecha: ${existentes.length} bloque(s) eliminado(s)${fijosProtegidos?`, ${fijosProtegidos} fijo(s) protegidos`:''}`,'success');
        }

        function deshacerUltimaAuto(){
            return deshacerAutoEjecucion();
        }

        function abrirReversionAutos(){
            const data=getData();
            const ejecuciones=(data.autoEjecuciones||[]).filter(e=>e.ids?.some(id=>data.planificaciones.some(p=>p.id===id)));
            const modal=document.getElementById('modalContainer');
            if(!modal) return;
            if(!ejecuciones.length) return ctx.toast('No hay auto-asignaciones activas para revertir','info');
            const nombres={auto_asignatura:'Auto-asignatura',auto_seccion:'Auto-sección',auto_general:'Auto-general'};
            const nombreSeccion=(id)=>data.secciones.find(s=>s.id===id)?.nombre||'';
            const nombreAsignatura=(id)=>{
                const a=data.asignaturas.find(x=>x.id===id);
                return [a?.codigo,a?.nombre].filter(Boolean).join(' - ');
            };
            const filas=ejecuciones.map(e=>{
                const activos=e.ids.filter(id=>data.planificaciones.some(p=>p.id===id)).length;
                const meta=e.meta||{};
                const detalle=[
                    meta.seccionId?nombreSeccion(meta.seccionId):'',
                    meta.asignaturaId?nombreAsignatura(meta.asignaturaId):'',
                    meta.secciones?`${meta.secciones} secciones`:'',
                    meta.estrategia?`Estrategia ${meta.estrategia}`:''
                ].filter(Boolean).join(' · ');
                return `<tr>
                    <td>${ctx.escapeHTML(nombres[e.tipo]||'Auto')}</td>
                    <td>${ctx.escapeHTML(e.ts?new Date(e.ts).toLocaleString():'')}</td>
                    <td>${ctx.escapeHTML(detalle||'Sin detalle')}</td>
                    <td style="text-align:right;">${activos}</td>
                    <td><button class="btn btn-xs btn-danger auto-revert-row" data-id="${ctx.escapeAttr(e.id)}" type="button">Revertir</button></td>
                </tr>`;
            }).join('');
            modal.innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal auto-general-modal">
                    <div class="modal-header">
                        <h3>Revertir autos</h3>
                        <p>Escoge exactamente qué ejecución automática quieres deshacer. Solo se eliminarán los bloques creados por esa ejecución.</p>
                    </div>
                    <table class="report-table auto-general-result-table">
                        <thead><tr><th>Tipo</th><th>Fecha</th><th>Detalle</th><th>Bloques activos</th><th>Acción</th></tr></thead>
                        <tbody>${filas}</tbody>
                    </table>
                    <div class="modal-actions">
                        <button class="btn" id="btnCerrarReversionAutos">Cerrar</button>
                    </div>
                </div></div>`;
            const cerrar=()=>{modal.innerHTML='';};
            document.getElementById('btnCerrarReversionAutos').onclick=cerrar;
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget) cerrar();};
            modal.querySelectorAll('.auto-revert-row').forEach(btn=>btn.onclick=()=>{
                const id=btn.dataset.id;
                cerrar();
                deshacerAutoEjecucion(id);
            });
        }

        function estimarCapacidadAutoAsignacion(asigId, secId, docId, salaId, esPresencial, offsetDia, estrategia='balanceada'){
            const data = getData();
            const cant=autoAsignarBloques(asigId,secId,docId,salaId,esPresencial,offsetDia,{simular:true,estrategia,origen:'simulacion'});
            const memoria=data.configuracion.memoriaPlanificacion||{};
            const senales=Array.isArray(memoria.senales)?memoria.senales:[];
            const docSignals=memoria.usarEnAuto===true?senales.filter(s=>s.asignaturaId===asigId&&s.tipo==='docente_corregido'&&s.docenteNuevoId===docId).length:0;
            const salaSignals=memoria.usarEnAuto===true&&salaId?senales.filter(s=>s.asignaturaId===asigId&&s.tipo==='sala_corregida'&&s.salaNuevaId===salaId).length:0;
            const memoriaScore=Math.min(30,(docSignals*10)+(salaSignals*7))*fuerzaMemoriaAuto();
            return {cant, carga:data.planificaciones.filter(p=>p.docenteId===docId).length, memoriaScore};
        }

        function diagnosticarAutoAsignacion(asigId, secId, docId, salaId, esPresencial){
            const data=getData();
            const asig=data.asignaturas.find(a=>a.id===asigId);
            const sec=data.secciones.find(se=>se.id===secId);
            const parsed=sec?ctx.parsearCodigoSeccion(sec.nombre):null;
            const esVespertino=parsed&&parsed.tipo==='V';
            const salasPref=asig?.salasPreferidas||[];
            const salaReal=!esPresencial?ctx.SALA_VIRTUAL_ID:(salaId||(salasPref.length?null:ctx.SALA_TRO2_ID));
            const motivos={docente:0,seccion:0,sala:0,vespertino:0};
            let disponibles=0;
            function salaOk(sala,dia,bloque){
                return sala===ctx.SALA_VIRTUAL_ID||sala===ctx.SALA_TRO2_ID||!data.planificaciones.some(p=>p.salaId===sala&&p.dia===dia&&p.bloque===bloque);
            }
            for(let dia=0;dia<ctx.DIAS.length;dia++){
                if(esPresencial&&dia===5) continue;
                for(let b=1;b<=18;b++){
                    if(esVespertino&&b<13){motivos.vespertino++; continue;}
                    if(seccionOcupadaVisible(secId,dia,b)){motivos.seccion++; continue;}
                    const disp=checkDisponibilidad(docId,dia,b,secId);
                    if(!disp.ok){motivos.docente++; continue;}
                    let salaElegida=salaReal;
                    if(esPresencial&&!salaElegida&&salasPref.length) salaElegida=salasPref.find(s=>salaOk(s,dia,b))||null;
                    if(esPresencial&&salaElegida&&salaElegida!==ctx.SALA_VIRTUAL_ID&&salaElegida!==ctx.SALA_TRO2_ID&&!salaOk(salaElegida,dia,b)){motivos.sala++; continue;}
                    disponibles++;
                }
            }
            if(disponibles>0) return 'Hay bloques disponibles, pero no suficientes consecutivos';
            const dominante=Object.entries(motivos).sort((a,b)=>b[1]-a[1])[0]?.[0];
            return {docente:'Docente sin disponibilidad/cupo', seccion:'Sección ocupada', sala:'Sala ocupada', vespertino:'Sección vespertina'}[dominante] || 'Sin bloques disponibles';
        }

        function elegirDocenteAuto(asigId, secId, docentes, salaId, esPresencial, offsetDia, estrategia='balanceada'){
            const data=getData();
            const cfgAuto=data.configuracion.autoPlanificacion||{};
            const pesoPrioridad={preferente:100, apto:60, apoyo:30};
            const pesoEstrategia=estrategia==='docente' ? 3 : 1;
            const asig=data.asignaturas.find(a=>a.id===asigId);
            const esNegociable=asig?.area==='transversal'||asig?.controlHorario==='coordinacion-externa';
            const docentesReales=docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID);
            const nn=docentes.find(d=>d.id===ctx.DOCENTE_NN_ID)||data.docentes.find(d=>d.id===ctx.DOCENTE_NN_ID);
            const evaluados=docentesReales.map(doc=>{
                const r=estimarCapacidadAutoAsignacion(asigId,secId,doc.id,salaId,esPresencial,offsetDia,estrategia);
                const prioridad=doc.prioridadAsignaturas?.[asigId]||'apto';
                const prioridadValor=pesoPrioridad[prioridad]||60;
                const score=(r.cant*1000)+(cfgAuto.usarPrioridadDocente===false?0:prioridadValor*pesoEstrategia)+(r.memoriaScore||0)-r.carga-(esNegociable?12:0);
                return {doc, cant:r.cant, carga:r.carga, prioridad:prioridadValor, memoriaScore:r.memoriaScore||0, score};
            }).sort((a,b)=>b.score-a.score||(a.doc.apellido||'').localeCompare(b.doc.apellido||''));
            if(evaluados[0]?.cant) return evaluados[0];
            if(nn && cfgAuto.permitirDocenteNN!==false){
                const r=estimarCapacidadAutoAsignacion(asigId,secId,nn.id,salaId,esPresencial,offsetDia,estrategia);
                return {doc:nn,cant:r.cant,carga:0,prioridad:0,score:r.cant*1000,pendienteDocente:true};
            }
            return evaluados[0] || null;
        }

        function asignaturasDeSeccion(secId){
            const data=getData();
            const sec=data.secciones.find(s=>s.id===secId);
            const nivel=sec?data.niveles.find(n=>n.id===sec.nivelId):null;
            if(!sec||!nivel) return [];
            const especificas=(data.asignaturaSeccion||[]).filter(r=>r.seccionId===secId).map(r=>r.asignaturaId);
            if(especificas.length) return [...new Set(especificas)];
            return data.asignaturaCarreraNivel
                .filter(r=>r.nivelId===sec.nivelId&&r.carreraId===nivel.carreraId)
                .map(r=>r.asignaturaId);
        }

        function issuesParaAuto(tipo, opciones={}){
            const data=getData();
            const issues=ctx.calcularValidacionPrevia?.()||[];
            const s=data.sel;
            if(tipo==='auto_asignatura'){
                return issues.filter(x=>x.seccionId===s.seccionId||x.asignaturaId===s.asignaturaId||(x.accionTipo==='docente'&&x.accionId===s.docenteId));
            }
            if(tipo==='auto_seccion'){
                const asigIds=new Set(asignaturasDeSeccion(s.seccionId));
                return issues.filter(x=>x.seccionId===s.seccionId||(x.asignaturaId&&asigIds.has(x.asignaturaId)));
            }
            if(tipo==='auto_general'){
                const secciones=obtenerSeccionesAutoGeneral(opciones);
                const secIds=new Set(secciones.map(sec=>sec.id));
                const asigIds=new Set();
                secciones.forEach(sec=>asignaturasDeSeccion(sec.id).forEach(id=>asigIds.add(id)));
                return issues.filter(x=>(!x.seccionId&&!x.asignaturaId)||secIds.has(x.seccionId)||(x.asignaturaId&&asigIds.has(x.asignaturaId)));
            }
            return issues;
        }

        function abrirReporteValidacion(){
            if(ctx.activarTab&&ctx.activarTab('reportes')===false) return;
            const sel=document.getElementById('reporteTipo');
            if(sel){
                sel.value='validacionPrevia';
                sel.dispatchEvent(new Event('change'));
            }
            document.getElementById('reporteContenido')?.scrollIntoView({behavior:'smooth',block:'start'});
        }

        function confirmarValidacionAntesAuto(tipo, opciones={}){
            const issues=issuesParaAuto(tipo,opciones);
            const criticos=issues.filter(x=>x.severidad==='critico').length;
            const advertencias=issues.filter(x=>x.severidad==='advertencia').length;
            const revision=issues.filter(x=>x.severidad==='info').length;
            if(!criticos&&!advertencias) return Promise.resolve(true);
            const modal=document.getElementById('modalContainer');
            if(!modal) return Promise.resolve(confirm(`Hay ${criticos} crítica(s) y ${advertencias} advertencia(s) antes de auto-planificar. ¿Continuar igualmente?`));
            const titulo={auto_asignatura:'Auto-asignatura',auto_seccion:'Auto-sección',auto_general:'Auto-general'}[tipo]||'Auto-planificación';
            const destacados=issues.slice(0,5);
            return new Promise(resolve=>{
                modal.innerHTML=`
                    <div class="modal-overlay" id="modalOverlay"><div class="modal">
                        <div class="modal-header">
                            <h3>Revisión antes de ${ctx.escapeHTML(titulo)}</h3>
                            <p>El sistema encontró señales que pueden afectar el resultado. Puedes revisarlas ahora o continuar bajo criterio.</p>
                        </div>
                        <div class="auto-validation-summary">
                            <div class="${criticos?'danger':''}"><strong>${criticos}</strong><span>Críticas</span></div>
                            <div class="${advertencias?'warning':''}"><strong>${advertencias}</strong><span>Advertencias</span></div>
                            <div><strong>${revision}</strong><span>Revisión</span></div>
                        </div>
                        <div class="dashboard-validation-list">
                            ${destacados.map(x=>`<div class="dashboard-validation-item ${x.severidad==='critico'?'danger':x.severidad==='advertencia'?'warning':'info'}">
                                <span>${ctx.escapeHTML(x.severidad==='critico'?'Crítico':x.severidad==='advertencia'?'Advertencia':'Revisión')}</span>
                                <strong>${ctx.escapeHTML(x.categoria||'')}</strong>
                                <em>${ctx.escapeHTML(x.elemento||x.detalle||'')}</em>
                            </div>`).join('')}
                        </div>
                        ${issues.length>destacados.length?`<p class="auto-plan-empty">Se muestran ${destacados.length} de ${issues.length} señales. Revisa el reporte completo para verlas todas.</p>`:''}
                        <div class="modal-actions">
                            <button class="btn" id="btnAutoValidacionCancelar">Cancelar</button>
                            <button class="btn" id="btnAutoValidacionRevisar">Revisar validación</button>
                            <button class="btn btn-primary" id="btnAutoValidacionContinuar">Continuar igual</button>
                        </div>
                    </div></div>`;
                const cerrar=(ok)=>{modal.innerHTML='';resolve(ok);};
                document.getElementById('btnAutoValidacionCancelar').onclick=()=>cerrar(false);
                document.getElementById('btnAutoValidacionRevisar').onclick=()=>{
                    modal.innerHTML='';
                    abrirReporteValidacion();
                    resolve(false);
                };
                document.getElementById('btnAutoValidacionContinuar').onclick=()=>cerrar(true);
                document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget) cerrar(false);};
            });
        }

        async function autoAsignarAsignaturaActual(){
            const data = getData();
            const s=data.sel;
            if(!s.seccionId||!s.asignaturaId||!s.docenteId) return ctx.toast('Seleccione sección, asignatura y docente','error');
            if(esAsignaturaVinculada(s.asignaturaId,s.seccionId)){
                return ctx.toast(`Esta asignatura se dicta desde ${nombreMadreAsignatura(s.asignaturaId,s.seccionId)}. Usa la sección madre para autoplanificarla.`,'info');
            }
            if(!await confirmarValidacionAntesAuto('auto_asignatura')) return;
            const ids=[];
            const explicaciones=[];
            const cant=autoAsignarBloques(s.asignaturaId,s.seccionId,s.docenteId,s.salaId||'',s.tipo==='presencial',0,{registrarIds:ids,registrarExplicaciones:explicaciones,origen:'auto_asignatura'});
            if(!cant) return ctx.toast('No se pudo asignar ningún bloque','error');
            registrarAutoEjecucion('auto_asignatura',ids,{seccionId:s.seccionId,asignaturaId:s.asignaturaId,bloques:cant,explicaciones});
            ctx.guardar(); construirGrilla(); actualizarSelectoresPlan(); actualizarProgresoPlan();
            refrescarDespuesCambioPlanificacion();
            ctx.toast(`✅ ${cant} bloque(s) asignado(s)`,'success');
        }

        function calcularPlanAutoSeccion(estrategia='balanceada'){
            const data = getData();
            const s=data.sel;
            const idsAsig=asignaturasDeSeccion(s.seccionId);
            const acciones=[];
            const pendientes=[];
            const cfgAuto=data.configuracion.autoPlanificacion||{};
            const asignaturasOrdenadas=idsAsig
                .map(asigId=>data.asignaturas.find(a=>a.id===asigId))
                .filter(Boolean)
                .filter(asig=>!esAsignaturaVinculada(asig.id,s.seccionId))
                .filter(asig=>!(cfgAuto.incluirTransversales===false && (asig.area==='transversal'||asig.controlHorario==='coordinacion-externa')))
                .sort((a,b)=>((Number(b.bloquesPresenciales)||0)+(Number(b.bloquesVirtuales)||0))-((Number(a.bloquesPresenciales)||0)+(Number(a.bloquesVirtuales)||0))||String(a.codigo||'').localeCompare(String(b.codigo||'')));
            asignaturasOrdenadas.forEach((asig,idx)=>{
                const asigId=asig.id;
                const docenteNN=data.docentes.find(d=>d.id===ctx.DOCENTE_NN_ID);
                const docentes=data.docentes.filter(d=>d.asignaturasQueDicta?.includes(asigId));
                const docentesAuto=docenteNN?[...docentes,docenteNN]:docentes;
                const visibles=planesVisiblesAsignaturaSeccion(asigId,s.seccionId);
                const pres=visibles.filter(p=>p.tipoPresencial!==false).length;
                const vir=visibles.filter(p=>p.tipoPresencial===false).length;
                if(pres<asig.bloquesPresenciales){
                    const requerido=asig.bloquesPresenciales-pres;
                    const elegido=elegirDocenteAuto(asigId,s.seccionId,docentesAuto,'',true,idx%5,estrategia);
                    if(elegido?.cant) acciones.push({asig, docentes:docentesAuto, docente:elegido.doc, salaId:'', esPresencial:true, offsetDia:idx%5, cant:elegido.cant, requerido});
                    else pendientes.push({asig, motivo:'Sin cupo presencial'});
                }
                if(cfgAuto.incluirVirtuales!==false&&vir<asig.bloquesVirtuales){
                    const requerido=asig.bloquesVirtuales-vir;
                    const elegido=elegirDocenteAuto(asigId,s.seccionId,docentesAuto,ctx.SALA_VIRTUAL_ID,false,idx%5,estrategia);
                    if(elegido?.cant) acciones.push({asig, docentes:docentesAuto, docente:elegido.doc, salaId:ctx.SALA_VIRTUAL_ID, esPresencial:false, offsetDia:idx%5, cant:elegido.cant, requerido});
                    else pendientes.push({asig, motivo:'Sin cupo virtual'});
                }
            });
            return {acciones, pendientes};
        }

        function diagnosticarAntesAutoSeccion(){
            const data=getData();
            const s=data.sel;
            const idsAsig=asignaturasDeSeccion(s.seccionId);
            const items=[];
            let sinDocente=0, docentesSinDisponibilidad=0, sinSalaPreferida=0, pendientes=0;
            idsAsig.forEach(asigId=>{
                const asig=data.asignaturas.find(a=>a.id===asigId);
                if(!asig) return;
                if(esAsignaturaVinculada(asigId,s.seccionId)) return;
                const docentes=data.docentes.filter(d=>d.asignaturasQueDicta?.includes(asigId));
                if(!docentes.length) sinDocente++;
                else if(!docentes.some(d=>d.disponibilidad?.some(dia=>dia.some(Boolean)))) docentesSinDisponibilidad++;
                const visibles=planesVisiblesAsignaturaSeccion(asigId,s.seccionId);
                const pres=visibles.filter(p=>p.tipoPresencial!==false).length;
                const vir=visibles.filter(p=>p.tipoPresencial===false).length;
                if(pres<asig.bloquesPresenciales || vir<asig.bloquesVirtuales) pendientes++;
                if((Number(asig.bloquesPresenciales)||0)>0 && !(asig.salasPreferidas||[]).length) sinSalaPreferida++;
            });
            if(sinDocente) items.push({tipo:'warning', texto:`${sinDocente} asignatura(s) sin docente real; se propondrá Docente NN si hay cupo`});
            if(docentesSinDisponibilidad) items.push({tipo:'warning', texto:`${docentesSinDisponibilidad} asignatura(s) con docentes sin disponibilidad marcada`});
            if(sinSalaPreferida) items.push({tipo:'info', texto:`${sinSalaPreferida} asignatura(s) presenciales sin sala preferida; se usará sala automática/TRO2`});
            if(pendientes) items.push({tipo:'info', texto:`${pendientes} asignatura(s) con bloques pendientes`});
            return items;
        }

        function salasAutoParaAsignatura(asig){
            const data=getData();
            const preferidas=(asig.salasPreferidas||[]).map(id=>data.salas.find(s=>s.id===id)).filter(Boolean);
            const base=preferidas.length?preferidas:data.salas.filter(s=>!s.esVirtual);
            return base.filter(s=>s.id!==ctx.SALA_VIRTUAL_ID);
        }

        function confirmarAutoSeccion(plan){
            return new Promise(resolve=>{
                let planActual=plan;
                const estrategiaValida=(id)=>['balanceada','compacta','docente'].includes(id);
                const recordarEstrategia=(id)=>{
                    if(!estrategiaValida(id)) return;
                    const data=getData();
                    data.configuracion.autoPlanificacion=data.configuracion.autoPlanificacion||{};
                    data.configuracion.autoPlanificacion.estrategiaPredeterminada=id;
                    ctx.guardar();
                };
                const estrategias=[
                    {id:'balanceada',nombre:'Balanceada'},
                    {id:'compacta',nombre:'Compacta'},
                    {id:'docente',nombre:'Docente preferente'}
                ];
                const resumenEstrategia=(id)=>{
                    const p=id===planActual.estrategia?planActual:calcularPlanAutoSeccion(id);
                    const total=p.acciones.reduce((acc,a)=>acc+(Number(a.cant)||0),0);
                    const requerido=p.acciones.reduce((acc,a)=>acc+(Number(a.requerido)||0),0)+p.pendientes.length;
                    const parciales=p.acciones.filter(a=>a.cant>0&&a.cant<a.requerido).length;
                    const docentes=new Set(p.acciones.filter(a=>a.cant>0).map(a=>a.docente.id));
                    const nn=p.acciones.filter(a=>a.cant>0&&a.docente.id===ctx.DOCENTE_NN_ID).length;
                    const transversales=p.acciones.filter(a=>a.cant>0&&(a.asig.area==='transversal'||a.asig.controlHorario==='coordinacion-externa')).length;
                    const calidad=Math.max(0,Math.min(100,
                        Math.round((requerido?total/requerido*100:0)-(p.pendientes.length*9)-(parciales*7)-(nn*6)-(transversales*2))
                    ));
                    return {
                        id,
                        total,
                        requerido,
                        calidad,
                        pendientes:p.pendientes.length,
                        parciales,
                        docentes:docentes.size,
                        nn,
                        virtuales:p.acciones.filter(a=>a.cant>0&&!a.esPresencial).length,
                        transversales
                    };
                };
                const estrategiaRecomendada=()=>{
                    return estrategias.map(e=>resumenEstrategia(e.id))
                        .sort((a,b)=>(b.calidad-a.calidad)||(b.total-a.total)||(a.pendientes-b.pendientes)||(a.nn-b.nn)||(a.transversales-b.transversales))[0]?.id || 'balanceada';
                };
                const explicarRecomendacion=()=>{
                    const comparados=estrategias.map(e=>Object.assign({nombre:e.nombre},resumenEstrategia(e.id)));
                    const recomendado=comparados.find(x=>x.id===estrategiaRecomendada())||comparados[0];
                    const maxBloques=Math.max(...comparados.map(x=>x.total));
                    const minPendientes=Math.min(...comparados.map(x=>x.pendientes));
                    const minNN=Math.min(...comparados.map(x=>x.nn));
                    const razones=[];
                    if(recomendado.total===maxBloques) razones.push('logra la mayor cantidad de bloques posibles');
                    if(recomendado.pendientes===minPendientes) razones.push('deja menos pendientes');
                    if(recomendado.nn===minNN) razones.push('usa menos Docente NN');
                    if(recomendado.calidad>=80) razones.push('mantiene una calidad alta');
                    if(!razones.length) razones.push('entrega el mejor equilibrio entre cobertura y riesgos');
                    return `Se recomienda ${recomendado.nombre} porque ${razones.slice(0,3).join(', ')}.`;
                };
                const renderComparador=()=>estrategias.map(e=>{
                    const r=resumenEstrategia(e.id);
                    const activa=(planActual.estrategia||'balanceada')===e.id;
                    const recomendada=estrategiaRecomendada()===e.id;
                    return `<button class="auto-strategy-card ${activa?'active':''}" data-estrategia="${e.id}" type="button">
                        <strong>${e.nombre}${recomendada?' · Recomendada':''}</strong>
                        <span>${r.total}/${r.requerido} bloques · calidad ${r.calidad}%</span>
                        <span>${r.pendientes} pendientes · ${r.parciales} parciales · ${r.docentes} docentes</span>
                        <span class="auto-quality-track"><i style="width:${r.calidad}%;background:${r.calidad>=80?'var(--success)':r.calidad>=55?'var(--warning)':'var(--danger)'};"></i></span>
                        <span>NN ${r.nn} · V ${r.virtuales} · T ${r.transversales}</span>
                    </button>`;
                }).join('');
                const estadoAccion=(a)=>{
                    if(!a.cant) return {texto:'No asignable', clase:'danger'};
                    if(a.cant<a.requerido) return {texto:'Parcial', clase:'warning'};
                    if(a.asig.area==='transversal'||a.asig.controlHorario==='coordinacion-externa') return {texto:'Negociar', clase:'info'};
                    return {texto:'Listo', clase:'success'};
                };
                const renderTotal=()=>planActual.acciones.reduce((acc,a)=>acc+(Number(a.cant)||0),0);
                const renderResumenDocentes=()=>{
                    const grupos=new Map();
                    planActual.acciones.forEach(a=>{
                        if(!a.cant) return;
                        const key=a.docente.id;
                        if(!grupos.has(key)) grupos.set(key,{doc:a.docente,bloques:0});
                        grupos.get(key).bloques+=Number(a.cant)||0;
                    });
                    if(!grupos.size) return '<span class="auto-plan-empty">Sin bloques asignables</span>';
                    return Array.from(grupos.values())
                        .sort((a,b)=>b.bloques-a.bloques||(a.doc.apellido||'').localeCompare(b.doc.apellido||''))
                        .map(g=>`<span class="item-chip auto-plan-doc-chip">${ctx.escapeHTML((g.doc.nombre||'')+' '+(g.doc.apellido||''))}: ${g.bloques}</span>`)
                        .join('');
                };
                const renderDiagnostico=()=>planActual.diagnostico?.length?`<strong>Diagnóstico previo</strong>${planActual.diagnostico.map(d=>`<div class="${d.tipo}">${ctx.escapeHTML(d.texto)}</div>`).join('')}`:'';
                const renderPendientes=()=>planActual.pendientes.slice(0,8).map(p=>`<li>${ctx.escapeHTML(p.asig.codigo||p.asig.nombre||'Asignatura')}: ${ctx.escapeHTML(p.motivo)}</li>`).join('');
                const renderResumenCriterios=()=>{
                    const acciones=planActual.acciones.filter(a=>a.cant>0);
                    const contar=(fn)=>acciones.filter(fn).length;
                    const items=[
                        {label:'Transversales / externas', value:contar(a=>a.asig.area==='transversal'||a.asig.controlHorario==='coordinacion-externa'), cls:'info'},
                        {label:'Críticas', value:contar(a=>a.asig.condicion==='alta-reprobacion'||a.asig.condicion==='alta-reprobacion-ayudantia'), cls:'warning'},
                        {label:'Con ayudantía', value:contar(a=>a.asig.condicion==='requiere-ayudantia'||a.asig.condicion==='alta-reprobacion-ayudantia'), cls:'warning'},
                        {label:'Online TEAMS', value:contar(a=>a.asig.modalidad==='online-teams'), cls:'info'},
                        {label:'Docente NN', value:contar(a=>a.docente.id===ctx.DOCENTE_NN_ID), cls:'warning'},
                        {label:'TRO2', value:contar(a=>a.salaId===ctx.SALA_TRO2_ID), cls:'warning'}
                    ].filter(i=>i.value>0);
                    if(!items.length) return '<span class="auto-plan-empty">Sin alertas académicas especiales en esta propuesta</span>';
                    return items.map(i=>`<span class="auto-plan-summary-chip ${i.cls}">${ctx.escapeHTML(i.label)}: ${i.value}</span>`).join('');
                };
                const observacionesAccion=(a,motivo)=>{
                    const notas=[];
                    if(a.docente.id===ctx.DOCENTE_NN_ID) notas.push('Pendiente docente real');
                    if(a.salaId===ctx.SALA_TRO2_ID) notas.push('Sala TRO2');
                    if(a.asig.area==='transversal'||a.asig.controlHorario==='coordinacion-externa') notas.push('Coordinar con externo');
                    if(a.asig.condicion==='alta-reprobacion'||a.asig.condicion==='alta-reprobacion-ayudantia') notas.push('Cuidar topes');
                    if(a.asig.condicion==='requiere-ayudantia'||a.asig.condicion==='alta-reprobacion-ayudantia') notas.push('Revisar ayudantía');
                    if(!a.esPresencial) notas.push('Virtual autoaprendizaje');
                    if(motivo) notas.push(motivo);
                    return notas.length?notas.join(' · '):'Sin observaciones';
                };
                const renderFilas=()=>planActual.acciones.slice(0,12).map((a,i)=>{
                    const estado=estadoAccion(a);
                    const motivo=a.cant<a.requerido?diagnosticarAutoAsignacion(a.asig.id,getData().sel.seccionId,a.docente.id,a.salaId,a.esPresencial):'';
                    const salas=salasAutoParaAsignatura(a.asig);
                    return `
                    <tr>
                        <td>${ctx.escapeHTML(a.asig.codigo||'')}</td>
                        <td>${ctx.escapeHTML(a.asig.nombre||'')}<small class="auto-plan-criteria">${ctx.escapeHTML(resumenCriteriosAsignatura(a.asig))}</small><div class="auto-plan-alerts">${alertasCriteriosAsignatura(a.asig)}</div></td>
                        <td>
                            <select class="form-select auto-docente-select" data-idx="${i}">
                                ${a.docentes.map(d=>ctx.optionHTML(d.id,d.id===ctx.DOCENTE_NN_ID?'Docente NN (pendiente)':`${d.nombre||''} ${d.apellido||''}`.trim(),d.id===a.docente.id)).join('')}
                            </select>
                        </td>
                        <td>
                            ${a.esPresencial?`<select class="form-select auto-sala-select" data-idx="${i}">
                                <option value="">Automática</option>
                                ${salas.map(s=>ctx.optionHTML(s.id,s.nombre,s.id===a.salaId)).join('')}
                            </select>`:'Sala Virtual'}
                        </td>
                        <td>${a.esPresencial?'Presencial':'Virtual'}</td>
                        <td style="text-align:right;">${a.cant}/${a.requerido}</td>
                        <td><span class="auto-plan-status ${estado.clase}" title="${ctx.escapeAttr(motivo)}">${estado.texto}</span>${motivo?`<small class="auto-plan-reason">${ctx.escapeHTML(motivo)}</small>`:''}</td>
                        <td><small class="auto-plan-reason auto-plan-observation">${ctx.escapeHTML(observacionesAccion(a,motivo))}</small></td>
                    </tr>`;
                }).join('');
                const pendientes=renderPendientes();
                const totalInicial=renderTotal();
                document.getElementById('modalContainer').innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal">
                    <div class="modal-header">
                        <h3>Auto-planificar sección</h3>
                        <p>Revisa el resumen y ajusta docentes antes de aplicar los cambios.</p>
                    </div>
                    <div class="form-group auto-plan-strategy">
                        <label class="form-label">Estrategia</label>
                        <select class="form-select" id="autoPlanEstrategia">
                            <option value="balanceada" ${(planActual.estrategia||'balanceada')==='balanceada'?'selected':''}>Balanceada</option>
                            <option value="compacta" ${planActual.estrategia==='compacta'?'selected':''}>Compacta</option>
                            <option value="docente" ${planActual.estrategia==='docente'?'selected':''}>Docente preferente</option>
                        </select>
                    </div>
                    <div class="auto-strategy-compare" id="autoStrategyCompare">${renderComparador()}</div>
                    <div class="auto-recommendation-note" id="autoRecommendationNote">${ctx.escapeHTML(explicarRecomendacion())}</div>
                    ${renderPanelCriteriosAuto('autoSeccionCriterio')}
                    <div class="export-preview-grid">
                        <div><span>Bloques a asignar</span><strong id="autoPlanTotal">${totalInicial}</strong></div>
                        <div><span>Asignaturas pendientes</span><strong id="autoPlanPendientesTotal">${planActual.pendientes.length}</strong></div>
                    </div>
                    <div class="auto-plan-doc-summary">
                        <strong>Carga sugerida por docente</strong>
                        <div id="autoPlanDocentes">${renderResumenDocentes()}</div>
                    </div>
                    <div class="auto-plan-doc-summary auto-plan-criteria-summary">
                        <strong>Alertas de criterio</strong>
                        <div id="autoPlanCriterios">${renderResumenCriterios()}</div>
                    </div>
                    <div class="auto-plan-diagnostico" id="autoPlanDiagnostico" style="${planActual.diagnostico?.length?'':'display:none;'}">${renderDiagnostico()}</div>
                    ${planActual.acciones.length?`<table class="report-table"><thead><tr><th>Código</th><th>Asignatura</th><th>Docente</th><th>Sala</th><th>Tipo</th><th>Bloques</th><th>Estado</th><th>Observación</th></tr></thead><tbody id="autoPlanPreviewBody">${renderFilas()}</tbody></table>`:'<p>No hay bloques disponibles para asignar.</p>'}
                    <div class="auto-plan-pendientes" id="autoPlanPendientesDetalle" style="${pendientes?'':'display:none;'}"><strong>Pendientes</strong><ul>${pendientes}</ul></div>
                    <div class="modal-actions">
                        <button class="btn" id="btnCancelarAutoSeccion">Cancelar</button>
                        <button class="btn btn-primary" id="btnConfirmarAutoSeccion" ${totalInicial?'':'disabled'}>Aplicar</button>
                    </div>
                </div></div>`;
                const refrescar=()=>{
                    const previewBody=document.getElementById('autoPlanPreviewBody');
                    if(previewBody) previewBody.innerHTML=renderFilas();
                    document.getElementById('autoStrategyCompare').innerHTML=renderComparador();
                    document.getElementById('autoRecommendationNote').textContent=explicarRecomendacion();
                    document.getElementById('autoPlanTotal').textContent=renderTotal();
                    document.getElementById('autoPlanPendientesTotal').textContent=planActual.pendientes.length;
                    document.getElementById('autoPlanDocentes').innerHTML=renderResumenDocentes();
                    document.getElementById('autoPlanCriterios').innerHTML=renderResumenCriterios();
                    const diag=document.getElementById('autoPlanDiagnostico');
                    diag.innerHTML=renderDiagnostico();
                    diag.style.display=planActual.diagnostico?.length?'block':'none';
                    const pendientesHTML=renderPendientes();
                    const pendientesEl=document.getElementById('autoPlanPendientesDetalle');
                    pendientesEl.querySelector('ul').innerHTML=pendientesHTML;
                    pendientesEl.style.display=pendientesHTML?'block':'none';
                    document.getElementById('btnConfirmarAutoSeccion').disabled=renderTotal()<=0;
                    document.getElementById('autoPlanEstrategia').value=planActual.estrategia||'balanceada';
                    enlazarSelects();
                    enlazarEstrategias();
                };
                const enlazarSelects=()=>{
                    document.querySelectorAll('.auto-docente-select').forEach(sel=>sel.onchange=()=>{
                        const idx=parseInt(sel.dataset.idx);
                        const accion=planActual.acciones[idx];
                        const docente=accion.docentes.find(d=>d.id===sel.value);
                        if(!docente) return;
                        accion.docente=docente;
                        const r=estimarCapacidadAutoAsignacion(accion.asig.id,getData().sel.seccionId,docente.id,accion.salaId,accion.esPresencial,accion.offsetDia,planActual.estrategia||'balanceada');
                        accion.cant=r.cant;
                        refrescar();
                    });
                    document.querySelectorAll('.auto-sala-select').forEach(sel=>sel.onchange=()=>{
                        const idx=parseInt(sel.dataset.idx);
                        const accion=planActual.acciones[idx];
                        accion.salaId=sel.value;
                        const r=estimarCapacidadAutoAsignacion(accion.asig.id,getData().sel.seccionId,accion.docente.id,accion.salaId,accion.esPresencial,accion.offsetDia,planActual.estrategia||'balanceada');
                        accion.cant=r.cant;
                        refrescar();
                    });
                };
                enlazarSelects();
                const cambiarEstrategia=(estrategia)=>{
                    if(!estrategiaValida(estrategia)) estrategia='balanceada';
                    const nuevo=calcularPlanAutoSeccion(estrategia);
                    nuevo.estrategia=estrategia;
                    nuevo.diagnostico=diagnosticarAntesAutoSeccion();
                    planActual=nuevo;
                    recordarEstrategia(estrategia);
                    refrescar();
                };
                const enlazarEstrategias=()=>{
                    document.querySelectorAll('.auto-strategy-card').forEach(btn=>btn.onclick=()=>cambiarEstrategia(btn.dataset.estrategia));
                };
                document.getElementById('autoPlanEstrategia').onchange=(e)=>{
                    const estrategia=estrategiaValida(e.target.value)?e.target.value:'balanceada';
                    const nuevo=calcularPlanAutoSeccion(estrategia);
                    nuevo.estrategia=estrategia;
                    nuevo.diagnostico=diagnosticarAntesAutoSeccion();
                    planActual=nuevo;
                    recordarEstrategia(estrategia);
                    refrescar();
                };
                document.querySelectorAll('[id^="autoSeccionCriterio"]').forEach(ctrl=>ctrl.onchange=()=>{
                    const criterios=leerPanelCriteriosAuto('autoSeccionCriterio');
                    guardarCriteriosAuto(criterios);
                    const estrategia=planActual.estrategia||'balanceada';
                    const nuevo=calcularPlanAutoSeccion(estrategia);
                    nuevo.estrategia=estrategia;
                    nuevo.diagnostico=diagnosticarAntesAutoSeccion();
                    planActual=nuevo;
                    refrescar();
                });
                enlazarEstrategias();
                const cerrar=(ok)=>{
                    if(ok){
                        const parciales=planActual.acciones.filter(a=>a.cant>0&&a.cant<a.requerido).length;
                        const noAsignables=planActual.acciones.filter(a=>!a.cant).length;
                        if((parciales||noAsignables)&&!confirm(`Hay ${parciales} fila(s) parciales y ${noAsignables} no asignable(s). ¿Aplicar igualmente?`)) return;
                    }
                    document.getElementById('modalContainer').innerHTML='';
                    resolve(ok?planActual:null);
                };
                document.getElementById('btnCancelarAutoSeccion').onclick=()=>cerrar(false);
                document.getElementById('btnConfirmarAutoSeccion').onclick=()=>cerrar(true);
                document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget) cerrar(false);};
            });
        }

        async function autoAsignarSeccionActual(){
            const data = getData();
            const s=data.sel;
            if(!s.seccionId||!s.carreraId||!s.nivelId) return ctx.toast('Seleccione carrera, nivel y sección','error');
            if(!await confirmarValidacionAntesAuto('auto_seccion')) return;
            const estrategiaInicial=['balanceada','compacta','docente'].includes(data.configuracion.autoPlanificacion?.estrategiaPredeterminada)
                ? data.configuracion.autoPlanificacion.estrategiaPredeterminada
                : 'balanceada';
            const plan=calcularPlanAutoSeccion(estrategiaInicial);
            plan.estrategia=estrategiaInicial;
            plan.diagnostico=diagnosticarAntesAutoSeccion();
            const totalEstimado=plan.acciones.reduce((acc,a)=>acc+a.cant,0);
            if(!totalEstimado) return ctx.toast(plan.pendientes.some(p=>p.motivo==='Sin docente')?'Hay asignaturas sin docente':'No se pudo asignar por disponibilidad o sala','error');
            const planConfirmado=await confirmarAutoSeccion(plan);
            if(!planConfirmado) return;
            let total=0;
            const ids=[];
            const explicaciones=[];
            ctx.pushUndo();
            planConfirmado.acciones.forEach(a=>{
                if(a.cant>0) total+=autoAsignarBloques(a.asig.id,s.seccionId,a.docente.id,a.salaId,a.esPresencial,a.offsetDia,{estrategia:planConfirmado.estrategia||'balanceada',omitirUndo:true,registrarIds:ids,registrarExplicaciones:explicaciones,origen:'auto_seccion'});
            });
            if(!total) return ctx.toast('No se pudo asignar por disponibilidad o sala','error');
            registrarAutoEjecucion('auto_seccion',ids,{seccionId:s.seccionId,bloques:total,estrategia:planConfirmado.estrategia||'balanceada',explicaciones});
            const docentesUsados=[...new Set(planConfirmado.acciones.filter(a=>a.cant>0).map(a=>`${a.docente.nombre||''} ${a.docente.apellido||''}`.trim()).filter(Boolean))];
            ctx.auditoria?.('auto_seccion', {
                seccionId:s.seccionId,
                bloquesAsignados:total,
                filasPendientes:planConfirmado.pendientes.length,
                estrategia:planConfirmado.estrategia||'balanceada',
                docentes:docentesUsados,
                explicaciones:explicaciones.slice(0,20)
            });
            ctx.guardar(); construirGrilla(); actualizarSelectoresPlan(); actualizarProgresoPlan();
            refrescarDespuesCambioPlanificacion();
            ctx.detectarConflictos?.();
            const avisos=[];
            const sinDocente=planConfirmado.pendientes.filter(p=>p.motivo==='Sin docente').length;
            const sinCupo=planConfirmado.pendientes.length-sinDocente;
            if(sinDocente) avisos.push(`${sinDocente} sin docente`);
            if(sinCupo) avisos.push(`${sinCupo} sin cupo`);
            ctx.toast(`✅ ${total} bloque(s) asignado(s)${avisos.length?`. Pendientes: ${avisos.join(', ')}.`:''}`,'success');
        }

        function contextoSeccion(sec){
            const data=getData();
            const nivel=data.niveles.find(n=>n.id===sec?.nivelId);
            const carrera=nivel?data.carreras.find(c=>c.id===nivel.carreraId):null;
            return {sec,nivel,carrera};
        }

        function ordenarSeccionesAutoGeneral(secciones, vespertinoPrimero=true){
            return secciones.slice().sort((a,b)=>{
                const pa=ctx.parsearCodigoSeccion(a.nombre)||{};
                const pb=ctx.parsearCodigoSeccion(b.nombre)||{};
                if(vespertinoPrimero){
                    const va=pa.tipo==='V'?0:1;
                    const vb=pb.tipo==='V'?0:1;
                    if(va!==vb) return va-vb;
                }
                return (a.nombre||'').localeCompare(b.nombre||'');
            });
        }

        function calcularPlanAutoSeccionPara(secId, estrategia='balanceada'){
            const data=getData();
            const original={...data.sel};
            const sec=data.secciones.find(s=>s.id===secId);
            const ctxSec=contextoSeccion(sec);
            if(!ctxSec.sec||!ctxSec.nivel||!ctxSec.carrera) return null;
            data.sel.carreraId=ctxSec.carrera.id;
            data.sel.nivelId=ctxSec.nivel.id;
            data.sel.seccionId=ctxSec.sec.id;
            data.sel.asignaturaId=null;
            data.sel.docenteId=null;
            const plan=calcularPlanAutoSeccion(estrategia);
            plan.estrategia=estrategia;
            plan.diagnostico=diagnosticarAntesAutoSeccion();
            Object.assign(data.sel,original);
            return Object.assign(plan,ctxSec);
        }

        function aplicarFiltrosAutoGeneral(plan, opciones){
            const accionesOriginales=plan.acciones||[];
            const acciones=accionesOriginales.filter(a=>{
                if(opciones.incluirTransversales===false && (a.asig.area==='transversal'||a.asig.controlHorario==='coordinacion-externa')) return false;
                if(opciones.incluirDocenteNN===false && a.docente.id===ctx.DOCENTE_NN_ID) return false;
                if(opciones.incluirVirtuales===false && !a.esPresencial) return false;
                return true;
            });
            const omitidas=accionesOriginales.length-acciones.length;
            return Object.assign({},plan,{acciones,omitidas});
        }

        function seccionPendiente(sec){
            const data=getData();
            const {nivel,carrera}=contextoSeccion(sec);
            if(!nivel||!carrera) return false;
            const ids=asignaturasDeSeccion(sec.id);
            return ids.some(asigId=>{
                const asig=data.asignaturas.find(a=>a.id===asigId);
                if(!asig) return false;
                const visibles=planesVisiblesAsignaturaSeccion(asigId,sec.id);
                const pres=visibles.filter(p=>p.tipoPresencial!==false).length;
                const vir=visibles.filter(p=>p.tipoPresencial===false).length;
                return pres<(Number(asig.bloquesPresenciales)||0)||vir<(Number(asig.bloquesVirtuales)||0);
            });
        }

        function obtenerSeccionesAutoGeneral(opciones){
            const data=getData();
            let secciones=data.secciones.slice();
            if(opciones.alcance==='carrera' && data.sel.carreraId){
                const niveles=new Set(data.niveles.filter(n=>n.carreraId===data.sel.carreraId).map(n=>n.id));
                secciones=secciones.filter(s=>niveles.has(s.nivelId));
            }
            if(opciones.alcance==='nivel' && data.sel.nivelId) secciones=secciones.filter(s=>s.nivelId===data.sel.nivelId);
            if(opciones.soloPendientes!==false) secciones=secciones.filter(seccionPendiente);
            return ordenarSeccionesAutoGeneral(secciones,opciones.vespertinoPrimero!==false);
        }

        function contarVentanasGlobal(bloques){
            const ordenados=[...new Set(bloques.map(Number))].sort((a,b)=>a-b);
            if(ordenados.length<2) return 0;
            let ventanas=0;
            for(let i=1;i<ordenados.length;i++) ventanas+=Math.max(0,ordenados[i]-ordenados[i-1]-1);
            return ventanas;
        }

        function multiplicadorPesoSolver(criterio){
            const data=getData();
            const niveles={'desactivado':0,bajo:0.55,medio:1,alto:1.45,'muy-alto':2};
            const nivel=data.configuracion?.solverPesos?.[criterio]||'medio';
            return niveles[nivel]??1;
        }

        function calcularFuncionObjetivoSolver(m){
            const costoDuro=Math.round(
                ((m.conflictos||0)*220*multiplicadorPesoSolver('topesDuros'))+
                ((m.fueraJornada||0)*180*multiplicadorPesoSolver('respetoJornada'))+
                ((m.disponibilidadDocente||0)*220*multiplicadorPesoSolver('topesDuros'))+
                ((m.sabadoFueraLimite||0)*120*multiplicadorPesoSolver('respetoJornada'))
            );
            const costoBlando=Math.round(
                (Math.max(0,100-(m.cobertura||0))*1.2*multiplicadorPesoSolver('bloquesFaltantes'))+
                ((m.ventanasSeccion||0)*4*1.1*multiplicadorPesoSolver('ventanasEstudiantes'))+
                ((m.ventanasDocente||0)*3*multiplicadorPesoSolver('ventanasDocentes'))+
                ((m.ventanasAsignatura||0)*5.5*multiplicadorPesoSolver('compactacionAsignatura'))+
                ((m.fragmentacionAsignatura||0)*6*multiplicadorPesoSolver('compactacionAsignatura'))+
                ((m.diasCargados||0)*5*0.9*multiplicadorPesoSolver('distribucionSemanal'))+
                ((m.excesoDiarioDocente||0)*7*1.1*multiplicadorPesoSolver('excesoDiarioDocente'))+
                ((m.nn||0)*2.5*0.8*multiplicadorPesoSolver('bloquesFaltantes'))+
                ((m.tro2||0)*2*0.7*multiplicadorPesoSolver('salasCorrectas'))+
                ((m.virtuales||0)*2*0.6*multiplicadorPesoSolver('virtuales'))
            );
            const costoTotal=costoDuro+costoBlando;
            const score=Math.max(0,Math.min(100,100-Math.round(costoTotal/10)));
            return {costoDuro,costoBlando,costoTotal,score};
        }

        function scoreGlobalPlanificaciones(planificaciones){
            const data=getData();
            let requeridos=0, planificados=0;
            data.secciones.forEach(sec=>{
                const asigIds=asignaturasDeSeccion(sec.id);
                asigIds.forEach(asigId=>{
                    const asig=data.asignaturas.find(a=>a.id===asigId);
                    if(!asig) return;
                    const req=(Number(asig.bloquesPresenciales)||0)+(Number(asig.bloquesVirtuales)||0);
                    const hechos=planesVisiblesAsignaturaSeccion(asigId,sec.id,planificaciones).length;
                    requeridos+=req;
                    planificados+=Math.min(hechos,req);
                });
            });
            const cobertura=requeridos?Math.round(planificados/requeridos*100):0;
            let ventanasSeccion=0, ventanasDocente=0, diasCargados=0, ventanasAsignatura=0, fragmentacionAsignatura=0, fueraJornada=0;
            data.secciones.forEach(sec=>{
                for(let dia=0;dia<ctx.DIAS.length;dia++){
                    const bloques=planesVisiblesSeccionDia(sec.id,dia,planificaciones).map(p=>p.bloque);
                    ventanasSeccion+=contarVentanasGlobal(bloques);
                    if(bloques.length>=9) diasCargados++;
                }
                asignaturasDeSeccion(sec.id).forEach(asigId=>{
                    const asig=data.asignaturas.find(a=>a.id===asigId);
                    if(!asig || asig.distribucion==='dividida') return;
                    const planesAsig=planesVisiblesAsignaturaSeccion(asigId,sec.id,planificaciones).filter(p=>p.tipoPresencial!==false);
                    if(planesAsig.length<2) return;
                    const porDia=new Map();
                    planesAsig.forEach(p=>{
                        if(!porDia.has(p.dia)) porDia.set(p.dia,[]);
                        porDia.get(p.dia).push(p.bloque);
                    });
                    porDia.forEach(bloques=>{ ventanasAsignatura+=contarVentanasGlobal(bloques); });
                    const req=Number(asig.bloquesPresenciales)||0;
                    const diasUsados=porDia.size;
                    if(req<=4) fragmentacionAsignatura+=Math.max(0,diasUsados-1)*2;
                    else fragmentacionAsignatura+=Math.max(0,diasUsados-2);
                });
            });
            data.docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID).forEach(doc=>{
                for(let dia=0;dia<ctx.DIAS.length;dia++){
                    const bloques=planificaciones.filter(p=>p.docenteId===doc.id&&p.dia===dia).map(p=>p.bloque);
                    ventanasDocente+=contarVentanasGlobal(bloques);
                    if(bloques.length>=9) diasCargados++;
                }
            });
            const conflictosDoc=new Map(), conflictosSala=new Map();
            planificaciones.forEach(p=>{
                if(p.docenteId!==ctx.DOCENTE_NN_ID){
                    const key=`${p.docenteId}_${p.dia}_${p.bloque}`;
                    conflictosDoc.set(key,(conflictosDoc.get(key)||0)+1);
                }
                if(p.salaId!==ctx.SALA_VIRTUAL_ID&&p.salaId!==ctx.SALA_TRO2_ID){
                    const key=`${p.salaId}_${p.dia}_${p.bloque}`;
                    conflictosSala.set(key,(conflictosSala.get(key)||0)+1);
                }
            });
            const conflictos=[...conflictosDoc.values(),...conflictosSala.values()].filter(n=>n>1).length;
            const nn=planificaciones.filter(p=>p.docenteId===ctx.DOCENTE_NN_ID).length;
            const tro2=planificaciones.filter(p=>p.salaId===ctx.SALA_TRO2_ID).length;
            const virtuales=planificaciones.filter(p=>p.tipoPresencial===false&&p.dia!==5&&Number(p.bloque)>2&&Number(p.bloque)<16).length;
            const docenteDia=new Map();
            let disponibilidadDocente=0, sabadoFueraLimite=0;
            const seccionPorId=new Map(data.secciones.map(s=>[s.id,s]));
            planificaciones.forEach(p=>{
                const sec=seccionPorId.get(p.seccionId);
                const bloque=Number(p.bloque)||0;
                if(sec?.jornada==='diurna'&&bloque>12) fueraJornada++;
                if(sec?.jornada==='vespertina'&&bloque>0&&bloque<13) fueraJornada++;
                if(p.dia===5&&bloque>data.configuracion.sabadoHastaBloque) sabadoFueraLimite++;
                const doc=data.docentes.find(d=>d.id===p.docenteId);
                if(p.docenteId&&p.docenteId!==ctx.DOCENTE_NN_ID&&doc&&!doc.disponibilidad?.[p.dia]?.[bloque-1]) disponibilidadDocente++;
                if(p.docenteId&&p.docenteId!==ctx.DOCENTE_NN_ID){
                    const key=`${p.docenteId}|${p.dia}`;
                    docenteDia.set(key,(docenteDia.get(key)||0)+1);
                }
            });
            const excesoDiarioDocente=[...docenteDia.values()].filter(n=>n>13).length;
            const restriccionesDuras=conflictos+fueraJornada+disponibilidadDocente+sabadoFueraLimite;
            const metricas={cobertura,planificados,requeridos,restriccionesDuras,ventanasSeccion,ventanasDocente,ventanasAsignatura,fragmentacionAsignatura,conflictos,diasCargados,fueraJornada,disponibilidadDocente,sabadoFueraLimite,excesoDiarioDocente,nn,tro2,virtuales};
            const objetivo=calcularFuncionObjetivoSolver(metricas);
            return Object.assign(metricas,{
                score:objetivo.score,
                perdida:objetivo.costoTotal,
                costoDuro:objetivo.costoDuro,
                costoBlando:objetivo.costoBlando,
                costoTotal:objetivo.costoTotal
            });
        }

        function simularAutoGeneral(opciones){
            const data=getData();
            const originalSel={...data.sel};
            const originalPlanes=data.planificaciones;
            const simuladas=originalPlanes.map(p=>Object.assign({},p));
            let total=0, seccionesConCambio=0, pendientes=0, omitidas=0;
            try{
                data.planificaciones=simuladas;
                const secciones=obtenerSeccionesAutoGeneral(opciones);
                for(const sec of secciones){
                    const planBase=calcularPlanAutoSeccionPara(sec.id,opciones.estrategia||'balanceada');
                    if(!planBase) continue;
                    const plan=aplicarFiltrosAutoGeneral(planBase,opciones);
                    omitidas+=plan.omitidas||0;
                    pendientes+=plan.pendientes.length;
                    let subtotal=0;
                    plan.acciones.forEach(a=>{
                        if(a.cant<=0) return;
                        const nuevos=autoAsignarBloques(a.asig.id,sec.id,a.docente.id,a.salaId,a.esPresencial,a.offsetDia,{estrategia:opciones.estrategia||'balanceada',simularDetalles:true,origen:'auto_general'});
                        if(Array.isArray(nuevos)&&nuevos.length){
                            simuladas.push(...nuevos);
                            subtotal+=nuevos.length;
                        }
                    });
                    if(subtotal>0){
                        total+=subtotal;
                        seccionesConCambio++;
                    }
                }
                return {planificaciones:simuladas,total,seccionesConCambio,pendientes,omitidas,score:scoreGlobalPlanificaciones(simuladas)};
            }finally{
                data.planificaciones=originalPlanes;
                Object.assign(data.sel,originalSel);
            }
        }

        function seccionesAlcanceOptimizacion(opciones={}){
            const data=getData();
            if(opciones.alcance==='seccion'&&data.sel.seccionId) return [data.sel.seccionId];
            if(opciones.alcance==='nivel'&&data.sel.nivelId) return data.secciones.filter(s=>s.nivelId===data.sel.nivelId).map(s=>s.id);
            if(opciones.alcance==='carrera'&&data.sel.carreraId){
                const niveles=new Set(data.niveles.filter(n=>n.carreraId===data.sel.carreraId).map(n=>n.id));
                return data.secciones.filter(s=>niveles.has(s.nivelId)).map(s=>s.id);
            }
            return data.secciones.map(s=>s.id);
        }

        function crearRestriccionSolver(tipo,clave,label,detalle='',costo=0){
            return {tipo,clave,label,detalle,costo:Number(costo)||0};
        }

        function evaluarRestriccionesPlan(plan,dia,bloque,planes){
            const data=getData();
            const resto=planes.filter(p=>p.id!==plan.id);
            const duras=[];
            const blandas=[];
            const bloqueInfo=ctx.getBloque(bloque);
            const sec=data.secciones.find(s=>s.id===plan.seccionId);
            if(!bloqueInfo) duras.push(crearRestriccionSolver('dura','bloque_invalido','Bloque inexistente','El bloque no existe en la grilla.'));
            if(dia<0||dia>=ctx.DIAS.length) duras.push(crearRestriccionSolver('dura','dia_invalido','Día inexistente','El día no existe en la grilla.'));
            if(dia===5 && bloque>data.configuracion.sabadoHastaBloque) duras.push(crearRestriccionSolver('dura','sabado_limite','Límite de sábado',`No se puede usar sábado después de B${data.configuracion.sabadoHastaBloque}.`));
            if(sec?.jornada==='diurna' && plan.tipoPresencial!==false && bloque>12) duras.push(crearRestriccionSolver('dura','jornada','Respeto de jornada','Una sección diurna no debe planificarse en bloques vespertinos.'));
            if(sec?.jornada==='vespertina' && plan.tipoPresencial!==false && bloque<13) duras.push(crearRestriccionSolver('dura','jornada','Respeto de jornada','Una sección vespertina no debe planificarse en bloques diurnos.'));
            if(resto.some(p=>p.seccionId===plan.seccionId && p.dia===dia && p.bloque===bloque)) duras.push(crearRestriccionSolver('dura','tope_seccion','Tope de sección','La sección ya tiene un bloque en ese horario.'));
            if(plan.docenteId!==ctx.DOCENTE_NN_ID){
                const doc=data.docentes.find(d=>d.id===plan.docenteId);
                if(!doc) duras.push(crearRestriccionSolver('dura','docente_inexistente','Docente inexistente','El docente asignado no existe.'));
                else if(!doc.disponibilidad?.[dia]?.[bloque-1]) duras.push(crearRestriccionSolver('dura','disponibilidad_docente','Disponibilidad docente','El docente no está disponible en ese bloque.'));
                if(resto.some(p=>p.docenteId===plan.docenteId && p.dia===dia && p.bloque===bloque)) duras.push(crearRestriccionSolver('dura','tope_docente','Tope docente','El docente ya tiene otro bloque en ese horario.'));
                const cargaDiaria=resto.filter(p=>p.docenteId===plan.docenteId && p.dia===dia).length;
                if(cargaDiaria>=data.configuracion.bloquesDiariosMax) duras.push(crearRestriccionSolver('dura','maximo_diario_docente','Máximo diario docente',`El docente supera ${data.configuracion.bloquesDiariosMax} bloques totales diarios, considerando presenciales y virtuales.`));
                if(dia>0){
                    const prev=resto.filter(p=>p.docenteId===plan.docenteId && p.dia===dia-1);
                    let maxFin=0;
                    prev.forEach(p=>{ const bf=ctx.getBloque(p.bloque); if(bf&&bf.hFin>maxFin) maxFin=bf.hFin; });
                    if(bloqueInfo&&maxFin && (24*60-maxFin+bloqueInfo.hIni)<data.configuracion.horasDescanso*60) duras.push(crearRestriccionSolver('dura','descanso_docente','Descanso docente','No cumple las horas mínimas de descanso entre días.'));
                }
                if(dia<ctx.DIAS.length-1){
                    const next=resto.filter(p=>p.docenteId===plan.docenteId && p.dia===dia+1);
                    let minIni=Infinity;
                    next.forEach(p=>{ const bf=ctx.getBloque(p.bloque); if(bf&&bf.hIni<minIni) minIni=bf.hIni; });
                    if(bloqueInfo&&Number.isFinite(minIni) && (24*60-bloqueInfo.hFin+minIni)<data.configuracion.horasDescanso*60) duras.push(crearRestriccionSolver('dura','descanso_docente','Descanso docente','No cumple las horas mínimas de descanso hacia el día siguiente.'));
                }
            }else{
                blandas.push(crearRestriccionSolver('blanda','docente_nn','Docente NN','El bloque queda sin docente definitivo.',2.5));
            }
            if(plan.salaId && plan.salaId!==ctx.SALA_VIRTUAL_ID && plan.salaId!==ctx.SALA_TRO2_ID){
                if(resto.some(p=>p.salaId===plan.salaId && p.dia===dia && p.bloque===bloque)) duras.push(crearRestriccionSolver('dura','tope_sala','Tope de sala','La sala ya está ocupada en ese horario.'));
            }
            if(plan.salaId===ctx.SALA_TRO2_ID) blandas.push(crearRestriccionSolver('blanda','sala_provisional','Sala TRO2','El bloque queda con sala provisional.',2));
            if(plan.tipoPresencial===false && !(dia===5 && bloque>=9)) blandas.push(crearRestriccionSolver('blanda','virtual_preferente','Virtual fuera de preferencia','El bloque virtual queda fuera del patrón preferente.',1.5));
            const simulada=Object.assign({},plan,{dia,bloque});
            const proxy=[...resto,simulada];
            const bloquesSeccion=proxy.filter(p=>p.seccionId===plan.seccionId&&p.dia===dia).map(p=>p.bloque);
            const bloquesAsig=proxy.filter(p=>p.seccionId===plan.seccionId&&p.asignaturaId===plan.asignaturaId&&p.dia===dia&&p.tipoPresencial!==false).map(p=>p.bloque);
            const bloquesDocente=plan.docenteId===ctx.DOCENTE_NN_ID?[]:proxy.filter(p=>p.docenteId===plan.docenteId&&p.dia===dia).map(p=>p.bloque);
            if(contarVentanasGlobal(bloquesSeccion)>0) blandas.push(crearRestriccionSolver('blanda','ventana_estudiante','Ventana estudiante','El movimiento deja o mantiene una ventana en la sección.',4));
            if(bloquesAsig.length>1&&contarVentanasGlobal(bloquesAsig)>0) blandas.push(crearRestriccionSolver('blanda','compactacion_asignatura','Compactación asignatura','La asignatura queda separada dentro del día.',5.5));
            if(bloquesDocente.length>1&&contarVentanasGlobal(bloquesDocente)>0) blandas.push(crearRestriccionSolver('blanda','ventana_docente','Ventana docente','El movimiento deja o mantiene una ventana al docente.',3));
            if(bloquesSeccion.length>=9) blandas.push(crearRestriccionSolver('blanda','dia_cargado','Día cargado','La sección queda con una carga diaria alta.',5));
            return {
                valido:!duras.length,
                duras,
                blandas,
                costoBlando:blandas.reduce((acc,r)=>acc+(Number(r.costo)||0),0)
            };
        }

        function puedeUbicarPlanEn(plan,dia,bloque,planes){
            return evaluarRestriccionesPlan(plan,dia,bloque,planes).valido;
        }

        function resumirRestriccionesBlandas(restricciones){
            const vistas=new Set();
            return (restricciones||[])
                .filter(r=>r.tipo==='blanda'&&!vistas.has(r.clave)&&vistas.add(r.clave))
                .sort((a,b)=>(b.costo||0)-(a.costo||0))
                .slice(0,4);
        }

        function textoRestriccionesBlandas(restricciones){
            return resumirRestriccionesBlandas(restricciones).map(r=>r.label).join(', ');
        }

        function evaluarRestriccionesGrupo(grupo,dia,bloqueInicio,planes){
            const duras=[];
            const blandas=[];
            if(!grupo.length) duras.push(crearRestriccionSolver('dura','grupo_vacio','Grupo vacío','No hay bloques para mover.'));
            if(bloqueInicio<1||bloqueInicio+grupo.length-1>ctx.BLOQUES.length) duras.push(crearRestriccionSolver('dura','rango_bloques','Rango de bloques','El grupo queda fuera de la grilla.'));
            const ids=new Set(grupo.map(p=>p.id));
            const resto=planes.filter(p=>!ids.has(p.id));
            const movidos=grupo.map((p,i)=>Object.assign({},p,{dia,bloque:bloqueInicio+i}));
            const proxy=[...resto,...movidos];
            movidos.forEach(p=>{
                const evalPlan=evaluarRestriccionesPlan(p,p.dia,p.bloque,proxy);
                duras.push(...evalPlan.duras);
                blandas.push(...evalPlan.blandas);
            });
            const clavesDuras=new Set();
            const clavesBlandas=new Set();
            return {
                valido:!duras.length,
                duras:duras.filter(r=>{const k=`${r.clave}|${r.detalle}`; if(clavesDuras.has(k)) return false; clavesDuras.add(k); return true;}),
                blandas:blandas.filter(r=>{const k=`${r.clave}|${r.detalle}`; if(clavesBlandas.has(k)) return false; clavesBlandas.add(k); return true;}),
                costoBlando:blandas.reduce((acc,r)=>acc+(Number(r.costo)||0),0)
            };
        }

        function puedeUbicarGrupoEn(grupo,dia,bloqueInicio,planes){
            return evaluarRestriccionesGrupo(grupo,dia,bloqueInicio,planes).valido;
        }

        function nombreMovimiento(plan,desde,hasta){
            const data=getData();
            const sec=data.secciones.find(s=>s.id===plan.seccionId);
            const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
            const doc=data.docentes.find(d=>d.id===plan.docenteId);
            const docente=doc?(doc.id===ctx.DOCENTE_NN_ID?'Docente NN':`${doc.nombre||''} ${doc.apellido||''}`.trim()):'';
            return {
                planId:plan.id,
                tipo:'simple',
                seccionId:plan.seccionId,
                seccion:sec?.nombre||'',
                asignatura:[asig?.codigo,asig?.nombre].filter(Boolean).join(' · '),
                docente,
                desde:`${ctx.DIAS[desde.dia]} B${desde.bloque}`,
                hasta:`${ctx.DIAS[hasta.dia]} B${hasta.bloque}`
            };
        }

        function nombreMovimientoGrupo(grupo,diaDestino,bloqueInicio){
            const base=grupo[0];
            const data=getData();
            const sec=data.secciones.find(s=>s.id===base.seccionId);
            const asig=data.asignaturas.find(a=>a.id===base.asignaturaId);
            const doc=data.docentes.find(d=>d.id===base.docenteId);
            const docente=doc?(doc.id===ctx.DOCENTE_NN_ID?'Docente NN':`${doc.nombre||''} ${doc.apellido||''}`.trim()):'';
            const asignaturasUnicas=new Set(grupo.map(p=>p.asignaturaId));
            const docentesUnicos=new Set(grupo.map(p=>p.docenteId));
            const desdeBloques=grupo.map(p=>`B${p.bloque}`).join(', ');
            const hastaBloques=grupo.map((_,i)=>`B${bloqueInicio+i}`).join(', ');
            return {
                planId:base.id,
                planIds:grupo.map(p=>p.id),
                compuesto:true,
                tipo:'grupo',
                seccionId:base.seccionId,
                seccion:sec?.nombre||'',
                asignatura:asignaturasUnicas.size>1?`Cadena de ${grupo.length} bloques`:[asig?.codigo,asig?.nombre].filter(Boolean).join(' · '),
                docente:docentesUnicos.size>1?'Varios docentes':docente,
                desde:`${ctx.DIAS[base.dia]} ${desdeBloques}`,
                hasta:`${ctx.DIAS[diaDestino]} ${hastaBloques}`
            };
        }

        function grupoTieneVentanas(grupo){
            const porDia=new Map();
            grupo.forEach(p=>{
                if(!porDia.has(p.dia)) porDia.set(p.dia,[]);
                porDia.get(p.dia).push(p.bloque);
            });
            return [...porDia.values()].some(bloques=>contarVentanasGlobal(bloques)>0);
        }

        function deduplicarGruposOptimizacion(grupos){
            return grupos.filter((grupo,idx,arr)=>{
                const key=groupIds(grupo).sort().join('|');
                return key && arr.findIndex(g=>groupIds(g).sort().join('|')===key)===idx;
            });
        }

        function gruposAsignaturaCompletaOptimizacion(planes,secciones,opciones,params,estado){
            const data=getData();
            const porClave=new Map();
            planes
                .filter(p=>!p.fijo && !estado.movidos.has(p.id) && secciones.has(p.seccionId) && p.tipoPresencial!==false)
                .forEach(p=>{
                    const asig=data.asignaturas.find(a=>a.id===p.asignaturaId);
                    if(!asig || asig.distribucion==='dividida') return;
                    const key=[p.seccionId,p.asignaturaId,p.docenteId,p.salaId].join('|');
                    if(!porClave.has(key)) porClave.set(key,[]);
                    porClave.get(key).push(p);
                });
            const grupos=[];
            porClave.forEach(items=>{
                const ordenados=items.slice().sort((a,b)=>a.dia-b.dia||a.bloque-b.bloque);
                if(ordenados.length<2 || ordenados.length>6) return;
                const dias=new Set(ordenados.map(p=>p.dia));
                const fragmentada=dias.size>1;
                if(fragmentada || grupoTieneVentanas(ordenados)){
                    grupos.push(Object.assign(ordenados,{vecindario:'asignatura_completa'}));
                }
            });
            return grupos
                .sort((a,b)=>b.length-a.length||prioridadOptimizacionPlan(b[0],planes,opciones.objetivo)-prioridadOptimizacionPlan(a[0],planes,opciones.objetivo))
                .slice(0,Math.max(8,Math.floor(params.candidatos/2)));
        }

        function gruposCadenaDiaSeccionOptimizacion(planes,secciones,opciones,params,estado){
            const porClave=new Map();
            planes
                .filter(p=>!p.fijo && !estado.movidos.has(p.id) && secciones.has(p.seccionId) && (opciones.incluirVirtuales!==false || p.tipoPresencial!==false))
                .forEach(p=>{
                    const key=[p.seccionId,p.dia].join('|');
                    if(!porClave.has(key)) porClave.set(key,[]);
                    porClave.get(key).push(p);
                });
            const grupos=[];
            porClave.forEach(items=>{
                const ordenados=items.slice().sort((a,b)=>a.bloque-b.bloque);
                let actual=[];
                ordenados.forEach(p=>{
                    if(!actual.length || p.bloque===actual[actual.length-1].bloque+1) actual.push(p);
                    else {
                        if(actual.length>=2 && actual.length<=5) grupos.push(Object.assign(actual.slice(),{vecindario:'cadena_dia'}));
                        actual=[p];
                    }
                });
                if(actual.length>=2 && actual.length<=5) grupos.push(Object.assign(actual.slice(),{vecindario:'cadena_dia'}));
            });
            return grupos
                .sort((a,b)=>prioridadOptimizacionPlan(b[0],planes,opciones.objetivo)-prioridadOptimizacionPlan(a[0],planes,opciones.objetivo))
                .slice(0,Math.max(8,Math.floor(params.candidatos/3)));
        }

        function gruposRecursoCriticoOptimizacion(planes,secciones,opciones,params,estado){
            const porClave=new Map();
            planes
                .filter(p=>!p.fijo && !estado.movidos.has(p.id) && secciones.has(p.seccionId) && (p.docenteId===ctx.DOCENTE_NN_ID || p.salaId===ctx.SALA_TRO2_ID))
                .forEach(p=>{
                    const key=[p.seccionId,p.asignaturaId,p.docenteId,p.salaId,p.dia].join('|');
                    if(!porClave.has(key)) porClave.set(key,[]);
                    porClave.get(key).push(p);
                });
            const grupos=[];
            porClave.forEach(items=>{
                const ordenados=items.slice().sort((a,b)=>a.bloque-b.bloque);
                if(ordenados.length>=2) grupos.push(Object.assign(ordenados.slice(0,Math.min(4,ordenados.length)),{vecindario:'recurso_critico'}));
            });
            return grupos.slice(0,Math.max(6,Math.floor(params.candidatos/3)));
        }

        function gruposContinuosOptimizacion(planes,secciones,opciones,params,estado){
            const porClave=new Map();
            planes
                .filter(p=>!p.fijo && !estado.movidos.has(p.id) && secciones.has(p.seccionId) && (opciones.incluirVirtuales!==false || p.tipoPresencial!==false))
                .forEach(p=>{
                    const key=[p.seccionId,p.asignaturaId,p.docenteId,p.salaId,p.dia,p.tipoPresencial!==false].join('|');
                    if(!porClave.has(key)) porClave.set(key,[]);
                    porClave.get(key).push(p);
                });
            const grupos=[];
            porClave.forEach(items=>{
                const ordenados=items.slice().sort((a,b)=>a.bloque-b.bloque);
                let actual=[];
                ordenados.forEach(p=>{
                    if(!actual.length || p.bloque===actual[actual.length-1].bloque+1) actual.push(p);
                    else {
                        if(actual.length>=2) grupos.push(actual);
                        actual=[p];
                    }
                });
                if(actual.length>=2) grupos.push(actual);
            });
            return grupos
                .sort((a,b)=>b.length-a.length||prioridadOptimizacionPlan(b[0],planes,opciones.objetivo)-prioridadOptimizacionPlan(a[0],planes,opciones.objetivo))
                .slice(0,Math.max(8,Math.floor(params.candidatos/2)));
        }

        function gruposCompactablesOptimizacion(planes,secciones,opciones,params,estado){
            const data=getData();
            const porClave=new Map();
            planes
                .filter(p=>!p.fijo && !estado.movidos.has(p.id) && secciones.has(p.seccionId) && p.tipoPresencial!==false)
                .forEach(p=>{
                    const asig=data.asignaturas.find(a=>a.id===p.asignaturaId);
                    if(asig?.distribucion==='dividida') return;
                    const key=[p.seccionId,p.asignaturaId,p.docenteId,p.salaId,p.tipoPresencial!==false].join('|');
                    if(!porClave.has(key)) porClave.set(key,[]);
                    porClave.get(key).push(p);
                });
            const grupos=[];
            porClave.forEach(items=>{
                const ordenados=items.slice().sort((a,b)=>a.dia-b.dia||a.bloque-b.bloque);
                if(ordenados.length<2) return;
                const porDia=new Map();
                ordenados.forEach(p=>{
                    if(!porDia.has(p.dia)) porDia.set(p.dia,[]);
                    porDia.get(p.dia).push(p);
                });
                porDia.forEach(diaItems=>{
                    if(diaItems.length<2) return;
                    const bloques=diaItems.map(p=>p.bloque).sort((a,b)=>a-b);
                    const ventanas=contarVentanasGlobal(bloques);
                    if(ventanas>0) grupos.push(diaItems.slice(0,4).sort((a,b)=>a.bloque-b.bloque));
                });
                if(ordenados.length>=3){
                    const dias=new Set(ordenados.map(p=>p.dia));
                    if(dias.size>1) grupos.push(ordenados.slice(0,Math.min(4,ordenados.length)));
                }
            });
            return grupos
                .sort((a,b)=>b.length-a.length||prioridadOptimizacionPlan(b[0],planes,opciones.objetivo)-prioridadOptimizacionPlan(a[0],planes,opciones.objetivo))
                .slice(0,Math.max(10,Math.floor(params.candidatos/2)));
        }

        function gruposAsignaturaFragmentadaOptimizacion(planes,secciones,opciones,params,estado){
            const data=getData();
            const grupos=[];
            const porClave=new Map();
            planes
                .filter(p=>!p.fijo && !estado.movidos.has(p.id) && secciones.has(p.seccionId) && p.tipoPresencial!==false)
                .forEach(p=>{
                    const asig=data.asignaturas.find(a=>a.id===p.asignaturaId);
                    if(!asig || asig.distribucion==='dividida') return;
                    const key=[p.seccionId,p.asignaturaId,p.docenteId,p.salaId].join('|');
                    if(!porClave.has(key)) porClave.set(key,[]);
                    porClave.get(key).push(p);
                });
            porClave.forEach(items=>{
                if(items.length<2) return;
                const porDia=new Map();
                items.forEach(p=>{
                    if(!porDia.has(p.dia)) porDia.set(p.dia,[]);
                    porDia.get(p.dia).push(p);
                });
                const dias=Array.from(porDia.values()).map(arr=>arr.sort((a,b)=>a.bloque-b.bloque));
                const tieneVentanas=dias.some(arr=>contarVentanasGlobal(arr.map(p=>p.bloque))>0);
                const fragmentada=dias.length>1;
                if(!fragmentada&&!tieneVentanas) return;
                grupos.push(items.slice().sort((a,b)=>a.dia-b.dia||a.bloque-b.bloque).slice(0,Math.min(4,items.length)));
            });
            return grupos
                .sort((a,b)=>prioridadOptimizacionPlan(b[0],planes,opciones.objetivo)-prioridadOptimizacionPlan(a[0],planes,opciones.objetivo))
                .slice(0,Math.max(12,Math.floor(params.candidatos/2)));
        }

        function crearMovimientoGrupoOptimizacion(grupo,dia,bloqueInicio,planes,scoreBase){
            const evaluacion=evaluarRestriccionesGrupo(grupo,dia,bloqueInicio,planes);
            if(!evaluacion.valido) return null;
            const destinos=new Map(groupIds(grupo).map((id,i)=>[id,{dia,bloque:bloqueInicio+i}]));
            const propuesta=planes.map(p=>destinos.has(p.id)?Object.assign({},p,destinos.get(p.id)):p);
            const scoreNuevo=scoreGlobalPlanificaciones(propuesta);
            const mejoraPerdida=scoreBase.perdida-scoreNuevo.perdida;
            const mejoraScore=scoreNuevo.score-scoreBase.score;
            if(mejoraPerdida<=0&&mejoraScore<=0) return null;
            return {
                grupo,
                propuesta,
                scoreNuevo,
                peso:(mejoraPerdida*12)+mejoraScore+(grupo.length*2)-(evaluacion.costoBlando*0.25),
                movimiento:Object.assign(nombreMovimientoGrupo(grupo,dia,bloqueInicio),{
                    mejora:mejoraScore,
                    perdidaReducida:mejoraPerdida,
                    vecindario:grupo.vecindario||'grupo_continuo',
                    restriccionesBlandas:resumirRestriccionesBlandas(evaluacion.blandas)
                })
            };
        }

        function groupIds(grupo){
            return grupo.map(p=>p.id);
        }

        function nombreIntercambioGrupo(grupoA,grupoB){
            const movA=nombreMovimientoGrupo(grupoA,grupoB[0].dia,grupoB[0].bloque);
            const movB=nombreMovimientoGrupo(grupoB,grupoA[0].dia,grupoA[0].bloque);
            return {
                planId:grupoA[0].id,
                planIds:[...groupIds(grupoA),...groupIds(grupoB)],
                compuesto:true,
                intercambio:true,
                tipo:'intercambio',
                seccionId:grupoA[0].seccionId,
                seccion:movA.seccion,
                asignatura:`${movA.asignatura} ↔ ${movB.asignatura}`,
                docente:[movA.docente,movB.docente].filter(Boolean).join(' ↔ '),
                desde:`${movA.desde} ↔ ${movB.desde}`,
                hasta:`${movA.hasta} ↔ ${movB.hasta}`
            };
        }

        function puedeIntercambiarGrupos(grupoA,grupoB,planes){
            if(!grupoA.length||!grupoB.length||grupoA.length!==grupoB.length) return false;
            const idsA=new Set(groupIds(grupoA));
            const idsB=new Set(groupIds(grupoB));
            if([...idsA].some(id=>idsB.has(id))) return false;
            const destinoA={dia:grupoB[0].dia,bloque:grupoB[0].bloque};
            const destinoB={dia:grupoA[0].dia,bloque:grupoA[0].bloque};
            const removidos=new Set([...idsA,...idsB]);
            const resto=planes.filter(p=>!removidos.has(p.id));
            const proxyPlanes=[...resto,...grupoB.map(p=>Object.assign({},p,{dia:destinoB.dia,bloque:destinoB.bloque+(p.bloque-grupoB[0].bloque)}))];
            if(!puedeUbicarGrupoEn(grupoA,destinoA.dia,destinoA.bloque,proxyPlanes)) return false;
            const proxyPlanes2=[...resto,...grupoA.map(p=>Object.assign({},p,{dia:destinoA.dia,bloque:destinoA.bloque+(p.bloque-grupoA[0].bloque)}))];
            if(!puedeUbicarGrupoEn(grupoB,destinoB.dia,destinoB.bloque,proxyPlanes2)) return false;
            return true;
        }

        function crearIntercambioGrupoOptimizacion(grupoA,grupoB,planes,scoreBase){
            if(!puedeIntercambiarGrupos(grupoA,grupoB,planes)) return null;
            const idsA=groupIds(grupoA);
            const idsB=groupIds(grupoB);
            const destinos=new Map();
            idsA.forEach((id,i)=>destinos.set(id,{dia:grupoB[0].dia,bloque:grupoB[0].bloque+i}));
            idsB.forEach((id,i)=>destinos.set(id,{dia:grupoA[0].dia,bloque:grupoA[0].bloque+i}));
            const propuesta=planes.map(p=>destinos.has(p.id)?Object.assign({},p,destinos.get(p.id)):p);
            const scoreNuevo=scoreGlobalPlanificaciones(propuesta);
            const mejoraPerdida=scoreBase.perdida-scoreNuevo.perdida;
            const mejoraScore=scoreNuevo.score-scoreBase.score;
            if(mejoraPerdida<=0&&mejoraScore<=0) return null;
            return {
                grupo:[...grupoA,...grupoB],
                propuesta,
                scoreNuevo,
                peso:(mejoraPerdida*13)+mejoraScore+(grupoA.length*3),
                movimiento:Object.assign(nombreIntercambioGrupo(grupoA,grupoB),{
                    mejora:mejoraScore,
                    perdidaReducida:mejoraPerdida
                })
            };
        }

        function pesosOptimizacion(objetivo){
            const base={ventanasSeccion:6,ventanasDocente:4,ventanasAsignatura:8,fragmentacionAsignatura:9,conflictos:18,diasCargados:5,nn:3,tro2:2,virtuales:2};
            if(objetivo==='estudiantes') return Object.assign({},base,{ventanasSeccion:11,ventanasAsignatura:13,fragmentacionAsignatura:14,diasCargados:7,ventanasDocente:3});
            if(objetivo==='docentes') return Object.assign({},base,{ventanasDocente:10,diasCargados:7,ventanasSeccion:4});
            if(objetivo==='conflictos') return Object.assign({},base,{conflictos:30,ventanasSeccion:4,ventanasDocente:3});
            if(objetivo==='recursos') return Object.assign({},base,{nn:8,tro2:7,conflictos:22});
            return base;
        }

        function pesoSeguro(valor){
            return Number(valor)||0;
        }

        function diagnosticoOptimizacionScore(score){
            const pesos=pesosOptimizacion('balanceado');
            const items=[
                {clave:'conflictos',label:'restricciones duras',valor:(score.restriccionesDuras||0)*35},
                {clave:'conflictos',label:'conflictos de docente o sala',valor:score.conflictos*pesoSeguro(pesos.conflictos)},
                {clave:'estudiantes',label:'asignaturas fragmentadas',valor:(score.ventanasAsignatura*pesoSeguro(pesos.ventanasAsignatura))+(score.fragmentacionAsignatura*pesoSeguro(pesos.fragmentacionAsignatura))},
                {clave:'estudiantes',label:'ventanas de estudiantes',valor:score.ventanasSeccion*pesoSeguro(pesos.ventanasSeccion)},
                {clave:'docentes',label:'ventanas de docentes',valor:score.ventanasDocente*pesoSeguro(pesos.ventanasDocente)},
                {clave:'estudiantes',label:'días muy cargados',valor:score.diasCargados*pesoSeguro(pesos.diasCargados)},
                {clave:'recursos',label:'Docente NN',valor:score.nn*pesoSeguro(pesos.nn)},
                {clave:'recursos',label:'TRO2',valor:score.tro2*pesoSeguro(pesos.tro2)}
            ].sort((a,b)=>b.valor-a.valor);
            return items[0]?.valor>0?items[0]:{clave:'balanceado',label:'sin alertas relevantes',valor:0};
        }

        function etiquetaObjetivoOptimizacion(objetivo){
            const etiquetas={auto:'Automático recomendado',balanceado:'Balanceado',estudiantes:'Estudiantes',docentes:'Docentes',conflictos:'Conflictos',recursos:'Docente NN / TRO2'};
            return etiquetas[objetivo]||etiquetas.balanceado;
        }

        function objetivoMemoriaSolver(){
            const data=getData();
            const memoria=data.configuracion?.memoriaPlanificacion||{};
            if(memoria.usarEnAuto!==true) return '';
            const senales=(Array.isArray(memoria.senales)?memoria.senales:[])
                .filter(s=>s.tipo==='solver_optimizacion_aplicada'&&s.objetivoEfectivo&&Number(s.perdidaReducida)>0);
            if(senales.length<2) return '';
            const grupos=new Map();
            senales.slice(-80).forEach(s=>{
                const key=s.objetivoEfectivo;
                if(!grupos.has(key)) grupos.set(key,{objetivo:key,total:0,perdida:0,score:0});
                const g=grupos.get(key);
                g.total++;
                g.perdida+=Number(s.perdidaReducida)||0;
                g.score+=Number(s.deltaScore)||0;
            });
            const orden=[...grupos.values()]
                .filter(g=>g.total>=2)
                .sort((a,b)=>((b.perdida/b.total)+(b.score*4)+b.total)-((a.perdida/a.total)+(a.score*4)+a.total));
            return orden[0]?.objetivo||'';
        }

        function resolverObjetivoOptimizacion(score,objetivo){
            if(objetivo&&objetivo!=='auto') return objetivo;
            const desdeMemoria=objetivoMemoriaSolver();
            if(desdeMemoria) return desdeMemoria;
            const diagnostico=diagnosticoOptimizacionScore(score);
            return diagnostico.clave||'balanceado';
        }

        function etiquetaTipoMovimientoOptimizacion(movimiento){
            if(movimiento.intercambio) return 'Intercambio';
            if(movimiento.vecindario==='asignatura_completa') return 'Asignatura completa';
            if(movimiento.vecindario==='cadena_dia') return 'Cadena de día';
            if(movimiento.vecindario==='recurso_critico') return 'Recurso crítico';
            if(movimiento.compuesto) return 'Grupo continuo';
            return 'Movimiento';
        }

        function razonMovimientoOptimizacion(movimiento,sim){
            const razones=[];
            if(movimiento.perdidaReducida>0) razones.push(`reduce pérdida en ${movimiento.perdidaReducida}`);
            if(movimiento.mejora>0) razones.push(`sube el score en ${movimiento.mejora}`);
            if(sim?.scoreInicial?.fragmentacionAsignatura>sim?.scoreFinal?.fragmentacionAsignatura || sim?.scoreInicial?.ventanasAsignatura>sim?.scoreFinal?.ventanasAsignatura) razones.push('compacta bloques de la asignatura');
            if(movimiento.intercambio) razones.push('aprovecha mejor dos espacios ya ocupados');
            else if(movimiento.vecindario==='asignatura_completa') razones.push('reubica la asignatura como unidad completa');
            else if(movimiento.vecindario==='cadena_dia') razones.push('mueve una cadena del día sin desordenar su secuencia');
            else if(movimiento.vecindario==='recurso_critico') razones.push('reubica bloques con Docente NN o TRO2 para facilitar revisión');
            else if(movimiento.compuesto) razones.push('mantiene bloques de la asignatura juntos');
            else razones.push('reubica un bloque con mejor ajuste');
            const enfoque=sim?.objetivoEfectivo;
            if(enfoque==='estudiantes') razones.push('prioriza continuidad del estudiante');
            if(enfoque==='docentes') razones.push('prioriza continuidad docente');
            if(enfoque==='conflictos') razones.push('prioriza eliminar choques');
            if(enfoque==='recursos') razones.push('prioriza resolver Docente NN o TRO2');
            const blandas=textoRestriccionesBlandas(movimiento.restriccionesBlandas);
            if(blandas) razones.push(`controla restricciones blandas: ${blandas}`);
            return razones.slice(0,3).join(' · ');
        }

        function metricasExplicacionOptimizacion(sim){
            const pares=[
                {clave:'restriccionesDuras',label:'Restricciones duras',tipo:'duro'},
                {clave:'conflictos',label:'Conflictos',tipo:'duro'},
                {clave:'ventanasSeccion',label:'Ventanas estudiantes',tipo:'estudiantes'},
                {clave:'ventanasDocente',label:'Ventanas docentes',tipo:'docentes'},
                {clave:'ventanasAsignatura',label:'Ventanas asignatura',tipo:'compactacion'},
                {clave:'fragmentacionAsignatura',label:'Fragmentación asignatura',tipo:'compactacion'},
                {clave:'diasCargados',label:'Días cargados',tipo:'balance'},
                {clave:'fueraJornada',label:'Fuera de jornada',tipo:'duro'},
                {clave:'excesoDiarioDocente',label:'Exceso diario docente',tipo:'docentes'},
                {clave:'nn',label:'Docente NN',tipo:'recursos'},
                {clave:'tro2',label:'TRO2',tipo:'recursos'},
                {clave:'virtuales',label:'Virtuales a revisar',tipo:'virtuales'}
            ];
            return pares.map(m=>{
                const antes=Number(sim.scoreInicial?.[m.clave])||0;
                const despues=Number(sim.scoreFinal?.[m.clave])||0;
                return Object.assign({},m,{antes,despues,delta:antes-despues});
            });
        }

        function explicacionEscenarioOptimizacion(sim){
            const metricas=metricasExplicacionOptimizacion(sim);
            const mejoras=metricas.filter(m=>m.delta>0).sort((a,b)=>b.delta-a.delta).slice(0,4);
            const pendientes=metricas.filter(m=>m.despues>0).sort((a,b)=>b.despues-a.despues).slice(0,3);
            const enfoque=etiquetaObjetivoOptimizacion(sim.objetivoEfectivo||sim.objetivo);
            const lectura=[];
            if(sim.deltaScore>0) lectura.push(`sube el score ${sim.deltaScore} punto(s)`);
            if(sim.perdidaReducida>0) lectura.push(`reduce la pérdida total en ${sim.perdidaReducida}`);
            if(mejoras.length) lectura.push(`corrige principalmente ${mejoras.map(m=>m.label.toLowerCase()).slice(0,2).join(' y ')}`);
            if(!lectura.length) lectura.push('no detecta una mejora clara bajo las restricciones actuales');
            return {metricas,mejoras,pendientes,enfoque,lectura:lectura.join(', ')};
        }

        function etiquetasMovimientoOptimizacion(movimiento,sim){
            const tags=[];
            if(movimiento.intercambio) tags.push('intercambio equivalente');
            if(movimiento.vecindario==='asignatura_completa') tags.push('asignatura completa');
            if(movimiento.vecindario==='cadena_dia') tags.push('cadena de día');
            if(movimiento.vecindario==='recurso_critico') tags.push('recurso crítico');
            if(movimiento.compuesto) tags.push('bloques agrupados');
            if((movimiento.perdidaReducida||0)>=10) tags.push('alto impacto');
            if((movimiento.mejora||0)>0) tags.push('mejora score');
            const enfoque=sim?.objetivoEfectivo;
            if(enfoque==='estudiantes') tags.push('continuidad estudiante');
            if(enfoque==='docentes') tags.push('continuidad docente');
            if(enfoque==='conflictos') tags.push('reduce topes');
            if(enfoque==='recursos') tags.push('recursos');
            (movimiento.restriccionesBlandas||[]).slice(0,2).forEach(r=>tags.push(r.label));
            if(!tags.length) tags.push('ajuste local');
            return tags.slice(0,4);
        }

        function registrarMemoriaSolverOptimizacion(sim,opciones){
            if(!sim || !sim.movimientos?.length) return;
            const explicacion=explicacionEscenarioOptimizacion(sim);
            registrarMemoriaPlanificacion('solver_optimizacion_aplicada',{
                alcance:opciones.alcance,
                profundidad:opciones.profundidad,
                pasadas:sim.pasadas||opciones.pasadas||1,
                objetivo:sim.objetivo||opciones.objetivo,
                objetivoEfectivo:sim.objetivoEfectivo,
                movimientos:sim.movimientos.length,
                scoreAntes:sim.scoreInicial.score,
                scoreDespues:sim.scoreFinal.score,
                deltaScore:sim.deltaScore,
                perdidaReducida:sim.perdidaReducida,
                rutasEvaluadas:sim.rutasEvaluadas||0,
                busquedaLocal:sim.busquedaLocal||null,
                diagnosticoInicial:sim.diagnosticoInicial,
                diagnosticoFinal:sim.diagnosticoFinal,
                mejoras:explicacion.mejoras.map(m=>({clave:m.clave,label:m.label,antes:m.antes,despues:m.despues,delta:m.delta})),
                pendientes:explicacion.pendientes.map(m=>({clave:m.clave,label:m.label,valor:m.despues})),
                resumenPasadas:Array.isArray(sim.resumenPasadas)?sim.resumenPasadas:[],
                muestraMovimientos:sim.movimientos.slice(0,12).map(m=>({
                    tipo:m.tipo,
                    seccionId:m.seccionId,
                    seccion:m.seccion,
                    asignatura:m.asignatura,
                    desde:m.desde,
                    hasta:m.hasta,
                    vecindario:m.vecindario||'',
                    etapa:m.etapaTitulo||'',
                    perdidaReducida:m.perdidaReducida||0,
                    mejora:m.mejora||0,
                    pasada:m.pasada||1
                })),
                porEtapas:!!sim.porEtapas,
                resumenEtapas:Array.isArray(sim.resumenEtapas)?sim.resumenEtapas:[]
            });
        }

        function resumenTiposMovimientosOptimizacion(movimientos){
            const conteo={simple:0,grupo:0,intercambio:0,asignatura:0,cadena:0,recurso:0};
            movimientos.forEach(m=>{
                if(m.intercambio) conteo.intercambio++;
                else if(m.vecindario==='asignatura_completa') conteo.asignatura++;
                else if(m.vecindario==='cadena_dia') conteo.cadena++;
                else if(m.vecindario==='recurso_critico') conteo.recurso++;
                else if(m.compuesto) conteo.grupo++;
                else conteo.simple++;
            });
            return [
                conteo.simple?`Movimientos: ${conteo.simple}`:'',
                conteo.grupo?`Grupos continuos: ${conteo.grupo}`:'',
                conteo.asignatura?`Asignaturas completas: ${conteo.asignatura}`:'',
                conteo.cadena?`Cadenas de día: ${conteo.cadena}`:'',
                conteo.recurso?`Recursos críticos: ${conteo.recurso}`:'',
                conteo.intercambio?`Intercambios: ${conteo.intercambio}`:''
            ].filter(Boolean);
        }

        function prioridadOptimizacionPlan(plan,planes,objetivo){
            const data=getData();
            const pesos=pesosOptimizacion(objetivo);
            const bloquesSeccion=planes.filter(p=>p.seccionId===plan.seccionId&&p.dia===plan.dia).map(p=>p.bloque);
            const bloquesDocente=plan.docenteId===ctx.DOCENTE_NN_ID?[]:planes.filter(p=>p.docenteId===plan.docenteId&&p.dia===plan.dia).map(p=>p.bloque);
            const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
            const bloquesAsigDia=planes.filter(p=>p.seccionId===plan.seccionId&&p.asignaturaId===plan.asignaturaId&&p.tipoPresencial!==false&&p.dia===plan.dia).map(p=>p.bloque);
            const diasAsig=new Set(planes.filter(p=>p.seccionId===plan.seccionId&&p.asignaturaId===plan.asignaturaId&&p.tipoPresencial!==false).map(p=>p.dia));
            const ventanasSec=contarVentanasGlobal(bloquesSeccion);
            const ventanasDoc=contarVentanasGlobal(bloquesDocente);
            const ventanasAsig=contarVentanasGlobal(bloquesAsigDia);
            const aislado=!bloquesSeccion.includes(plan.bloque-1)&&!bloquesSeccion.includes(plan.bloque+1);
            const aisladoAsignatura=!bloquesAsigDia.includes(plan.bloque-1)&&!bloquesAsigDia.includes(plan.bloque+1);
            const fragmentada=asig?.distribucion!=='dividida'&&diasAsig.size>1;
            const pendienteRecurso=(plan.docenteId===ctx.DOCENTE_NN_ID?pesos.nn:0)+(plan.salaId===ctx.SALA_TRO2_ID?pesos.tro2:0);
            return (ventanasSec*pesos.ventanasSeccion)+(ventanasDoc*pesos.ventanasDocente)+(ventanasAsig*pesos.ventanasAsignatura)+(fragmentada?pesos.fragmentacionAsignatura*2:0)+(aislado?4:0)+(aisladoAsignatura?10:0)+(bloquesSeccion.length>=9?pesos.diasCargados:0)+(bloquesDocente.length>=9?pesos.diasCargados:0)+pendienteRecurso;
        }

        function parametrosSolverOptimizacion(profundidad){
            if(profundidad==='profundo') return {beam:5,candidatos:50,destinos:8,exploracion:5,paciencia:3};
            if(profundidad==='rapido') return {beam:2,candidatos:18,destinos:4,exploracion:1,paciencia:1};
            return {beam:3,candidatos:32,destinos:6,exploracion:3,paciencia:2};
        }

        function valorScoreOptimizacion(score,objetivo){
            const pesos=pesosOptimizacion(objetivo);
            const ajusteObjetivo=(score.ventanasSeccion*pesos.ventanasSeccion)+(score.ventanasDocente*pesos.ventanasDocente)+(score.ventanasAsignatura*pesos.ventanasAsignatura)+(score.fragmentacionAsignatura*pesos.fragmentacionAsignatura)+(score.conflictos*pesos.conflictos)+(score.diasCargados*pesos.diasCargados)+(score.tro2*pesos.tro2)+(score.nn*pesos.nn)+(score.virtuales*pesos.virtuales);
            return -((score.costoTotal||score.perdida||0)+ajusteObjetivo);
        }

        function seleccionarEstadosBusquedaLocal(candidatos,objetivo,params){
            const ordenados=candidatos.slice().sort((a,b)=>valorScoreOptimizacion(b.score,objetivo)-valorScoreOptimizacion(a.score,objetivo));
            const seleccion=ordenados.slice(0,params.beam);
            const vistos=new Set(seleccion.map(e=>e.movimientos.map(m=>m.planId||m.planIds?.join('-')||m.asignatura).join('|')));
            const cola=ordenados.slice(params.beam,Math.min(ordenados.length,params.beam+(params.exploracion*4)));
            for(let i=0;i<cola.length && seleccion.length<params.beam+params.exploracion;i+=Math.max(1,Math.floor(cola.length/Math.max(1,params.exploracion)))){
                const estado=cola[i];
                const firma=estado.movimientos.map(m=>m.planId||m.planIds?.join('-')||m.asignatura).join('|');
                if(vistos.has(firma)) continue;
                vistos.add(firma);
                seleccion.push(estado);
            }
            return seleccion;
        }

        function crearMovimientoOptimizacion(plan,dia,bloque,planes,scoreBase){
            if(plan.dia===dia&&plan.bloque===bloque) return null;
            const evaluacion=evaluarRestriccionesPlan(plan,dia,bloque,planes);
            if(!evaluacion.valido) return null;
            const propuesta=planes.map(p=>p.id===plan.id?Object.assign({},p,{dia,bloque}):p);
            const scoreNuevo=scoreGlobalPlanificaciones(propuesta);
            const mejoraPerdida=scoreBase.perdida-scoreNuevo.perdida;
            const mejoraScore=scoreNuevo.score-scoreBase.score;
            if(mejoraPerdida<=0&&mejoraScore<=0) return null;
            const antes={dia:plan.dia,bloque:plan.bloque};
            const despues={dia,bloque};
            return {
                plan,dia,bloque,propuesta,scoreNuevo,
                peso:(mejoraPerdida*10)+mejoraScore-(evaluacion.costoBlando*0.25),
                movimiento:Object.assign(nombreMovimiento(plan,antes,despues),{
                    mejora:mejoraScore,
                    perdidaReducida:mejoraPerdida,
                    restriccionesBlandas:resumirRestriccionesBlandas(evaluacion.blandas)
                })
            };
        }

        function generarMovimientosOptimizacion(estado,secciones,opciones,params){
            const movibles=estado.planes
                .filter(p=>!p.fijo && !estado.movidos.has(p.id) && secciones.has(p.seccionId) && (opciones.incluirVirtuales!==false || p.tipoPresencial!==false))
                .map(p=>({plan:p,prioridad:prioridadOptimizacionPlan(p,estado.planes,opciones.objetivo)}))
                .sort((a,b)=>b.prioridad-a.prioridad)
                .slice(0,params.candidatos)
                .map(x=>x.plan);
            const movimientos=[];
            for(const plan of movibles){
                const candidatosDestino=[];
                for(let dia=0;dia<ctx.DIAS.length;dia++){
                    for(let bloque=1;bloque<=ctx.BLOQUES.length;bloque++){
                        const mov=crearMovimientoOptimizacion(plan,dia,bloque,estado.planes,estado.score);
                        if(mov) candidatosDestino.push(mov);
                    }
                }
                candidatosDestino
                    .sort((a,b)=>b.peso-a.peso)
                    .slice(0,params.destinos)
                    .forEach(m=>movimientos.push(m));
            }
            const gruposMover=[
                ...gruposAsignaturaCompletaOptimizacion(estado.planes,secciones,opciones,params,estado),
                ...gruposAsignaturaFragmentadaOptimizacion(estado.planes,secciones,opciones,params,estado),
                ...gruposContinuosOptimizacion(estado.planes,secciones,opciones,params,estado),
                ...gruposCompactablesOptimizacion(estado.planes,secciones,opciones,params,estado),
                ...gruposCadenaDiaSeccionOptimizacion(estado.planes,secciones,opciones,params,estado),
                ...gruposRecursoCriticoOptimizacion(estado.planes,secciones,opciones,params,estado)
            ];
            const gruposMoverUnicos=deduplicarGruposOptimizacion(gruposMover);
            gruposMoverUnicos.forEach(grupo=>{
                const candidatosGrupo=[];
                for(let dia=0;dia<ctx.DIAS.length;dia++){
                    for(let bloque=1;bloque<=ctx.BLOQUES.length-grupo.length+1;bloque++){
                        const mov=crearMovimientoGrupoOptimizacion(grupo,dia,bloque,estado.planes,estado.score);
                        if(mov) candidatosGrupo.push(mov);
                    }
                }
                candidatosGrupo
                    .sort((a,b)=>b.peso-a.peso)
                    .slice(0,Math.max(3,Math.floor(params.destinos/2)))
                    .forEach(m=>movimientos.push(m));
            });
            const gruposSwap=deduplicarGruposOptimizacion([
                ...gruposContinuosOptimizacion(estado.planes,secciones,opciones,params,estado),
                ...gruposAsignaturaCompletaOptimizacion(estado.planes,secciones,opciones,params,estado)
            ]);
            for(let i=0;i<gruposSwap.length;i++){
                for(let j=i+1;j<gruposSwap.length;j++){
                    if(gruposSwap[i].length!==gruposSwap[j].length) continue;
                    const mov=crearIntercambioGrupoOptimizacion(gruposSwap[i],gruposSwap[j],estado.planes,estado.score);
                    if(mov) movimientos.push(mov);
                }
            }
            return movimientos.sort((a,b)=>b.peso-a.peso).slice(0,params.candidatos*params.destinos);
        }

        function simularOptimizacionHorario(opciones={}){
            const data=getData();
            const secciones=new Set(seccionesAlcanceOptimizacion(opciones));
            const basePlanes=Array.isArray(opciones.basePlanificaciones)?opciones.basePlanificaciones:data.planificaciones;
            const scoreInicial=scoreGlobalPlanificaciones(basePlanes);
            const diagnosticoInicial=diagnosticoOptimizacionScore(scoreInicial);
            const objetivoEfectivo=resolverObjetivoOptimizacion(scoreInicial,opciones.objetivo||'auto');
            const opcionesSolver=Object.assign({},opciones,{objetivo:objetivoEfectivo});
            const maxMovimientos=Math.max(1,Math.min(30,Number(opciones.maxMovimientos)||8));
            const params=parametrosSolverOptimizacion(opciones.profundidad||'equilibrado');
            const inicial={
                planes:basePlanes.map(p=>Object.assign({},p)),
                score:scoreInicial,
                movimientos:[],
                movidos:new Set()
            };
            let estados=[inicial];
            let mejor=inicial;
            let rutasEvaluadas=0;
            let estancamientos=0;
            for(let paso=0;paso<maxMovimientos;paso++){
                const siguientes=[];
                estados.forEach(estado=>{
                    generarMovimientosOptimizacion(estado,secciones,opcionesSolver,params).forEach(mov=>{
                        const movidos=new Set(estado.movidos);
                        if(mov.grupo) mov.grupo.forEach(p=>movidos.add(p.id));
                        else movidos.add(mov.plan.id);
                        siguientes.push({
                            planes:mov.propuesta,
                            score:mov.scoreNuevo,
                            movimientos:[...estado.movimientos,mov.movimiento],
                            movidos
                        });
                    });
                });
                if(!siguientes.length) break;
                rutasEvaluadas+=siguientes.length;
                estados=seleccionarEstadosBusquedaLocal(siguientes,objetivoEfectivo,params);
                const mejorPaso=estados.slice().sort((a,b)=>valorScoreOptimizacion(b.score,objetivoEfectivo)-valorScoreOptimizacion(a.score,objetivoEfectivo))[0];
                if(valorScoreOptimizacion(mejorPaso.score,objetivoEfectivo)>valorScoreOptimizacion(mejor.score,objetivoEfectivo)){
                    mejor=mejorPaso;
                    estancamientos=0;
                }else{
                    estancamientos++;
                    if(estancamientos>=params.paciencia) break;
                }
            }
            return {
                scoreInicial,
                scoreFinal:mejor.score,
                deltaScore:mejor.score.score-scoreInicial.score,
                perdidaReducida:scoreInicial.perdida-mejor.score.perdida,
                movimientos:mejor.movimientos,
                planificaciones:mejor.planes,
                profundidad:opciones.profundidad||'equilibrado',
                objetivo:opciones.objetivo||'auto',
                objetivoEfectivo,
                diagnosticoInicial:diagnosticoInicial.label,
                diagnosticoFinal:diagnosticoOptimizacionScore(mejor.score).label,
                rutasEvaluadas,
                busquedaLocal:{beam:params.beam,exploracion:params.exploracion,paciencia:params.paciencia}
            };
        }

        function etapasSolverOptimizacion(objetivo='auto'){
            const base=[
                {id:'conflictos',titulo:'Factibilidad',detalle:'Primero reduce topes, jornada, disponibilidad y restricciones duras.'},
                {id:'estudiantes',titulo:'Compactación',detalle:'Luego mejora continuidad de sección y asignaturas.'},
                {id:'docentes',titulo:'Docentes',detalle:'Después reduce ventanas y sobrecarga docente.'},
                {id:'recursos',titulo:'Recursos',detalle:'Finalmente revisa Docente NN y TRO2.'}
            ];
            if(objetivo&&objetivo!=='auto'&&!base.some(e=>e.id===objetivo)){
                base.push({id:objetivo,titulo:etiquetaObjetivoOptimizacion(objetivo),detalle:'Ajuste final según el enfoque seleccionado.'});
            }
            return base;
        }

        function simularOptimizacionPorEtapas(opciones={}){
            const baseInicial=Array.isArray(opciones.basePlanificaciones)?opciones.basePlanificaciones:getData().planificaciones;
            let base=baseInicial.map(p=>Object.assign({},p));
            const scoreInicial=scoreGlobalPlanificaciones(base);
            const etapas=etapasSolverOptimizacion(opciones.objetivo||'auto');
            const movimientos=[];
            const resumenEtapas=[];
            let scoreFinal=scoreInicial;
            let rutasEvaluadas=0;
            let busquedaLocal=null;
            let objetivoEfectivo='conflictos';
            const maxTotal=Math.max(1,Math.min(30,Number(opciones.maxMovimientos)||8));
            const movimientosPorEtapa=Math.max(1,Math.ceil(maxTotal/Math.max(1,etapas.length-1)));
            etapas.forEach((etapa,idx)=>{
                const sim=simularOptimizacionHorario(Object.assign({},opciones,{
                    objetivo:etapa.id,
                    basePlanificaciones:base,
                    maxMovimientos:idx===0?Math.max(2,movimientosPorEtapa):movimientosPorEtapa,
                    usarEtapas:false
                }));
                rutasEvaluadas+=Number(sim.rutasEvaluadas)||0;
                busquedaLocal=sim.busquedaLocal||busquedaLocal;
                objetivoEfectivo=sim.objetivoEfectivo||etapa.id;
                resumenEtapas.push({
                    etapa:idx+1,
                    id:etapa.id,
                    titulo:etapa.titulo,
                    scoreAntes:sim.scoreInicial.score,
                    scoreDespues:sim.scoreFinal.score,
                    costoAntes:sim.scoreInicial.costoTotal||sim.scoreInicial.perdida||0,
                    costoDespues:sim.scoreFinal.costoTotal||sim.scoreFinal.perdida||0,
                    perdidaReducida:sim.perdidaReducida,
                    movimientos:sim.movimientos.length
                });
                if(sim.movimientos.length){
                    sim.movimientos.forEach(m=>movimientos.push(Object.assign({},m,{etapa:idx+1,etapaTitulo:etapa.titulo})));
                    base=sim.planificaciones.map(p=>Object.assign({},p));
                    scoreFinal=sim.scoreFinal;
                }else{
                    scoreFinal=scoreGlobalPlanificaciones(base);
                }
            });
            return {
                scoreInicial,
                scoreFinal,
                deltaScore:scoreFinal.score-scoreInicial.score,
                perdidaReducida:scoreInicial.perdida-scoreFinal.perdida,
                movimientos,
                planificaciones:base,
                profundidad:opciones.profundidad||'equilibrado',
                objetivo:opciones.objetivo||'auto',
                objetivoEfectivo,
                diagnosticoInicial:diagnosticoOptimizacionScore(scoreInicial).label,
                diagnosticoFinal:diagnosticoOptimizacionScore(scoreFinal).label,
                rutasEvaluadas,
                busquedaLocal,
                pasadas:Number(opciones.pasadas)||1,
                porEtapas:true,
                resumenEtapas
            };
        }

        function simularOptimizacionIterativa(opciones={}){
            if(opciones.usarEtapas) return simularOptimizacionPorEtapas(opciones);
            const pasadas=Math.max(1,Math.min(5,Number(opciones.pasadas)||1));
            if(pasadas<=1) return simularOptimizacionHorario(opciones);
            let base=getData().planificaciones.map(p=>Object.assign({},p));
            const scoreInicial=scoreGlobalPlanificaciones(base);
            const resumenPasadas=[];
            const movimientos=[];
            let scoreFinal=scoreInicial;
            let objetivoEfectivo='';
            let diagnosticoInicial=diagnosticoOptimizacionScore(scoreInicial).label;
            let diagnosticoFinal=diagnosticoInicial;
            let rutasEvaluadas=0;
            let busquedaLocal=null;
            for(let pasada=1;pasada<=pasadas;pasada++){
                const sim=simularOptimizacionHorario(Object.assign({},opciones,{basePlanificaciones:base}));
                rutasEvaluadas+=Number(sim.rutasEvaluadas)||0;
                busquedaLocal=sim.busquedaLocal||busquedaLocal;
                objetivoEfectivo=sim.objetivoEfectivo;
                diagnosticoFinal=sim.diagnosticoFinal;
                resumenPasadas.push({
                    pasada,
                    scoreAntes:sim.scoreInicial.score,
                    scoreDespues:sim.scoreFinal.score,
                    perdidaReducida:sim.perdidaReducida,
                    movimientos:sim.movimientos.length
                });
                if(!sim.movimientos.length || sim.perdidaReducida<=0 && sim.deltaScore<=0){
                    scoreFinal=sim.scoreFinal;
                    base=sim.planificaciones;
                    break;
                }
                sim.movimientos.forEach(m=>movimientos.push(Object.assign({},m,{pasada})));
                scoreFinal=sim.scoreFinal;
                base=sim.planificaciones.map(p=>Object.assign({},p));
            }
            return {
                scoreInicial,
                scoreFinal,
                deltaScore:scoreFinal.score-scoreInicial.score,
                perdidaReducida:scoreInicial.perdida-scoreFinal.perdida,
                movimientos,
                planificaciones:base,
                profundidad:opciones.profundidad||'equilibrado',
                objetivo:opciones.objetivo||'auto',
                objetivoEfectivo,
                diagnosticoInicial,
                diagnosticoFinal,
                rutasEvaluadas,
                busquedaLocal,
                pasadas,
                resumenPasadas
            };
        }

        function renderPreviewOptimizacion(sim){
            if(!sim.movimientos.length) return `<div class="auto-plan-empty">No se encontraron movimientos que mejoren el score respetando los bloques fijos.</div>`;
            const resumenTipos=resumenTiposMovimientosOptimizacion(sim.movimientos);
            const explicacion=explicacionEscenarioOptimizacion(sim);
            return `<div class="auto-plan-preview">
                <div><span>Score global</span><strong>${sim.scoreInicial.score}% → ${sim.scoreFinal.score}%</strong></div>
                <div><span>Mejora</span><strong>${sim.deltaScore>=0?`+${sim.deltaScore}`:sim.deltaScore}</strong></div>
                <div><span>Costo total</span><strong>${sim.scoreInicial.costoTotal||sim.scoreInicial.perdida||0} → ${sim.scoreFinal.costoTotal||sim.scoreFinal.perdida||0}</strong></div>
                <div><span>Costo duro</span><strong>${sim.scoreInicial.costoDuro||0} → ${sim.scoreFinal.costoDuro||0}</strong></div>
                <div><span>Costo blando</span><strong>${sim.scoreInicial.costoBlando||0} → ${sim.scoreFinal.costoBlando||0}</strong></div>
                <div><span>Movimientos</span><strong>${sim.movimientos.length}</strong></div>
                <div><span>Restricciones duras</span><strong>${sim.scoreInicial.restriccionesDuras||0} → ${sim.scoreFinal.restriccionesDuras||0}</strong></div>
                <div><span>Fragmentación asignatura</span><strong>${sim.scoreInicial.fragmentacionAsignatura||0} → ${sim.scoreFinal.fragmentacionAsignatura||0}</strong></div>
                <div><span>Ventanas asignatura</span><strong>${sim.scoreInicial.ventanasAsignatura||0} → ${sim.scoreFinal.ventanasAsignatura||0}</strong></div>
                <div><span>Modo solver</span><strong>${ctx.escapeHTML(sim.profundidad||'equilibrado')}</strong></div>
                <div><span>Pasadas</span><strong>${Number(sim.pasadas)||1}</strong></div>
                <div><span>Rutas evaluadas</span><strong>${Number(sim.rutasEvaluadas)||0}</strong></div>
                <div><span>Etapas</span><strong>${sim.porEtapas?'Activas':'No'}</strong></div>
                <div><span>Enfoque</span><strong>${ctx.escapeHTML(etiquetaObjetivoOptimizacion(sim.objetivo))}</strong></div>
                ${sim.objetivo==='auto'?`<div><span>Aplicado</span><strong>${ctx.escapeHTML(etiquetaObjetivoOptimizacion(sim.objetivoEfectivo))}</strong></div>`:''}
                <div><span>Prioridad detectada</span><strong>${ctx.escapeHTML(sim.diagnosticoInicial||'')}</strong></div>
            </div>
            <div class="opt-explain-summary">
                <strong>Lectura de la propuesta</strong>
                <p>El solver minimiza una función objetivo: costo total = costo duro + costo blando. Las restricciones duras tienen una penalización mayor y las blandas se ponderan según la configuración del solver. En este escenario ${ctx.escapeHTML(explicacion.lectura)}.</p>
                ${sim.busquedaLocal?`<p>La búsqueda local conservó ${Number(sim.busquedaLocal.beam)||0} ruta(s) fuertes y ${Number(sim.busquedaLocal.exploracion)||0} ruta(s) exploratorias por paso para evitar quedarse en una mejora local pequeña.</p>`:''}
                ${resumenTipos.length?`<div>${resumenTipos.map(t=>`<span>${ctx.escapeHTML(t)}</span>`).join('')}</div>`:''}
            </div>
            ${Array.isArray(sim.resumenPasadas)&&sim.resumenPasadas.length>1?`<div class="opt-iteration-strip">
                ${sim.resumenPasadas.map(p=>`<div>
                    <strong>Pasada ${p.pasada}</strong>
                    <span>${p.scoreAntes}% → ${p.scoreDespues}%</span>
                    <small>${p.movimientos} mov. · pérdida -${p.perdidaReducida}</small>
                </div>`).join('')}
            </div>`:''}
            ${Array.isArray(sim.resumenEtapas)&&sim.resumenEtapas.length?`<div class="opt-iteration-strip">
                ${sim.resumenEtapas.map(e=>`<div>
                    <strong>${ctx.escapeHTML(e.titulo)}</strong>
                    <span>${e.scoreAntes}% → ${e.scoreDespues}%</span>
                    <small>${e.movimientos} mov. · costo ${e.costoAntes} → ${e.costoDespues}</small>
                </div>`).join('')}
            </div>`:''}
            <div class="opt-explain-impact">
                <div>
                    <strong>Mejoras principales</strong>
                    ${explicacion.mejoras.length?explicacion.mejoras.map(m=>`<span>${ctx.escapeHTML(m.label)}: ${m.antes} → ${m.despues}</span>`).join(''):'<span>Sin mejoras estructurales detectadas</span>'}
                </div>
                <div>
                    <strong>Pendiente después</strong>
                    ${explicacion.pendientes.length?explicacion.pendientes.map(m=>`<span>${ctx.escapeHTML(m.label)}: ${m.despues}</span>`).join(''):'<span>Sin pendientes relevantes en las métricas medidas</span>'}
                </div>
            </div>
            <div class="auto-plan-list">
                ${sim.movimientos.slice(0,8).map((m,i)=>`<div class="auto-plan-row opt-explain-row">
                    <div>
                        <div class="opt-explain-head">
                            <span class="opt-type ${m.intercambio?'swap':m.compuesto?'group':'move'}">${ctx.escapeHTML(etiquetaTipoMovimientoOptimizacion(m))}</span>
                            <strong>${i+1}. ${ctx.escapeHTML(m.seccion)} · ${ctx.escapeHTML(m.asignatura)}</strong>
                        </div>
                        <small>${ctx.escapeHTML(m.docente)} · ${ctx.escapeHTML(m.desde)} → ${ctx.escapeHTML(m.hasta)}</small>
                        <em>${ctx.escapeHTML(razonMovimientoOptimizacion(m,sim))}</em>
                        <div class="opt-reason-tags">${etiquetasMovimientoOptimizacion(m,sim).map(t=>`<span>${ctx.escapeHTML(t)}</span>`).join('')}</div>
                    </div>
                    <span>${m.perdidaReducida>0?`-${m.perdidaReducida}`:m.mejora>0?`+${m.mejora}`:'mejora'}</span>
                </div>`).join('')}
                ${sim.movimientos.length>8?`<div class="auto-plan-empty">Se muestran 8 de ${sim.movimientos.length} movimientos propuestos.</div>`:''}
            </div>`;
        }

        function escenariosBaseOptimizacion(){
            return [
                {id:'auto',titulo:'Recomendado',detalle:'El sistema detecta la prioridad principal.'},
                {id:'balanceado',titulo:'Balanceado',detalle:'Mejora general sin sesgar demasiado.'},
                {id:'estudiantes',titulo:'Estudiantes',detalle:'Prioriza continuidad y menor fragmentación.'},
                {id:'docentes',titulo:'Docentes',detalle:'Prioriza menos ventanas docentes.'},
                {id:'conflictos',titulo:'Conflictos',detalle:'Ataca primero topes y choques.'},
                {id:'recursos',titulo:'Recursos',detalle:'Prioriza Docente NN y TRO2.'}
            ];
        }

        function generarEscenariosOptimizacion(opciones){
            return escenariosBaseOptimizacion().map(meta=>{
                const sim=simularOptimizacionIterativa(Object.assign({},opciones,{objetivo:meta.id}));
                return {meta,sim};
            });
        }

        function mejorEscenarioOptimizacion(escenarios){
            const viables=escenarios.filter(e=>e.sim.movimientos.length);
            if(!viables.length) return escenarios[0]||null;
            return viables
                .slice()
                .sort((a,b)=>
                    (b.sim.scoreFinal.score-a.sim.scoreFinal.score)||
                    (b.sim.perdidaReducida-a.sim.perdidaReducida)||
                    (b.sim.deltaScore-a.sim.deltaScore)
                )[0];
        }

        function renderEscenariosOptimizacion(escenarios,seleccionadoId){
            const seleccionado=escenarios.find(e=>e.meta.id===seleccionadoId)||mejorEscenarioOptimizacion(escenarios);
            return `<div class="opt-scenarios">
                <div class="opt-explain-summary">
                    <strong>Escenarios comparados</strong>
                    <p>Todos respetan bloques fijos, disponibilidad, salas, descanso y los pesos configurados del solver. Elige el escenario que mejor calce con tu criterio antes de aplicar.</p>
                </div>
                <div class="auto-plan-preview opt-scenario-grid">
                    ${escenarios.map(e=>{
                        const sim=e.sim;
                        const activo=e.meta.id===seleccionado?.meta.id;
                        const viable=sim.movimientos.length>0;
                        return `<button class="global-score-loss opt-scenario-card ${activo?'active':''}" data-escenario="${ctx.escapeAttr(e.meta.id)}" type="button">
                            <strong>${ctx.escapeHTML(e.meta.titulo)}</strong>
                            <span>${ctx.escapeHTML(e.meta.detalle)}</span>
                            <span>Score ${sim.scoreInicial.score}% → ${sim.scoreFinal.score}% · ${viable?`${sim.movimientos.length} mov.`:'sin cambios'}</span>
                            <span>${sim.perdidaReducida>0?`Reduce pérdida ${sim.perdidaReducida}`:'Sin mejora detectada'}</span>
                        </button>`;
                    }).join('')}
                </div>
                <div id="optScenarioDetail">${renderPreviewOptimizacion(seleccionado?.sim||escenarios[0]?.sim||{movimientos:[]})}</div>
            </div>`;
        }

        function abrirOptimizacionHorario(){
            const data=getData();
            if(!data.planificaciones.some(p=>!p.fijo)) return ctx.toast('No hay bloques no fijos para optimizar','info');
            const opcionesIniciales={
                alcance:data.sel.seccionId?'seccion':data.sel.nivelId?'nivel':data.sel.carreraId?'carrera':'todas',
                maxMovimientos:8,
                pasadas:2,
                profundidad:'equilibrado',
                objetivo:'auto',
                incluirVirtuales:true
            };
            const modal=document.getElementById('modalContainer');
            let ultimaSim=null;
            let ultimasOpciones=null;
            let ultimosEscenarios=[];
            let escenarioSeleccionado=null;
            let timerCalculo=null;
            const leerOpciones=()=>({
                alcance:document.getElementById('optAlcance')?.value||opcionesIniciales.alcance,
                maxMovimientos:Number(document.getElementById('optMaxMovimientos')?.value)||8,
                pasadas:Number(document.getElementById('optPasadas')?.value)||2,
                profundidad:document.getElementById('optProfundidad')?.value||'equilibrado',
                objetivo:document.getElementById('optObjetivo')?.value||'auto',
                incluirVirtuales:document.getElementById('optIncluirVirtuales')?.checked!==false,
                compararEscenarios:document.getElementById('optCompararEscenarios')?.checked!==false,
                usarEtapas:document.getElementById('optUsarEtapas')?.checked!==false
            });
            const mostrarCalculando=()=>{
                const cont=document.getElementById('optPreview');
                const btn=document.getElementById('btnOptAplicar');
                if(btn) btn.disabled=true;
                if(cont) cont.innerHTML='<div class="auto-plan-empty">Calculando propuesta de optimización...</div>';
            };
            const enlazarEscenarios=()=>{
                document.querySelectorAll('.opt-scenario-card').forEach(btn=>btn.onclick=()=>{
                    escenarioSeleccionado=btn.dataset.escenario;
                    const esc=ultimosEscenarios.find(e=>e.meta.id===escenarioSeleccionado);
                    if(!esc) return;
                    ultimaSim=esc.sim;
                    const cont=document.getElementById('optPreview');
                    if(cont) cont.innerHTML=renderEscenariosOptimizacion(ultimosEscenarios,escenarioSeleccionado);
                    enlazarEscenarios();
                    const aplicar=document.getElementById('btnOptAplicar');
                    if(aplicar) aplicar.disabled=!esc.sim.movimientos.length;
                });
            };
            const calcular=()=>{
                const opciones={
                    ...leerOpciones()
                };
                let sim;
                ultimosEscenarios=[];
                if(opciones.compararEscenarios){
                    ultimosEscenarios=generarEscenariosOptimizacion(opciones);
                    const mejor=mejorEscenarioOptimizacion(ultimosEscenarios);
                    escenarioSeleccionado=escenarioSeleccionado&&ultimosEscenarios.some(e=>e.meta.id===escenarioSeleccionado)?escenarioSeleccionado:mejor?.meta.id;
                    sim=(ultimosEscenarios.find(e=>e.meta.id===escenarioSeleccionado)||mejor)?.sim;
                }else{
                    sim=simularOptimizacionIterativa(opciones);
                    escenarioSeleccionado=null;
                }
                ultimaSim=sim;
                ultimasOpciones=opciones;
                const cont=document.getElementById('optPreview');
                if(cont) cont.innerHTML=opciones.compararEscenarios?renderEscenariosOptimizacion(ultimosEscenarios,escenarioSeleccionado):renderPreviewOptimizacion(sim);
                if(opciones.compararEscenarios) enlazarEscenarios();
                const btn=document.getElementById('btnOptAplicar');
                if(btn) btn.disabled=!sim.movimientos.length;
                return {opciones,sim};
            };
            const programarCalculo=()=>{
                clearTimeout(timerCalculo);
                mostrarCalculando();
                timerCalculo=setTimeout(calcular,40);
            };
            modal.innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal modal-wide">
                    <div class="modal-header">
                        <h3>Optimizar horario</h3>
                        <p>Busca mejoras moviendo solo bloques no fijos. Los candados se respetan siempre.</p>
                    </div>
                    <div class="auto-general-form">
                        <div class="form-group">
                            <label class="form-label">Alcance</label>
                            <select class="form-select" id="optAlcance">
                                <option value="seccion" ${opcionesIniciales.alcance==='seccion'?'selected':''}>Sección actual</option>
                                <option value="nivel" ${opcionesIniciales.alcance==='nivel'?'selected':''}>Nivel actual</option>
                                <option value="carrera" ${opcionesIniciales.alcance==='carrera'?'selected':''}>Carrera actual</option>
                                <option value="todas" ${opcionesIniciales.alcance==='todas'?'selected':''}>Todas las secciones</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Máximo de movimientos</label>
                            <input class="form-input" id="optMaxMovimientos" type="number" min="1" max="30" value="${opcionesIniciales.maxMovimientos}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Pasadas</label>
                            <select class="form-select" id="optPasadas">
                                <option value="1">1 pasada</option>
                                <option value="2" selected>2 pasadas</option>
                                <option value="3">3 pasadas</option>
                                <option value="4">4 pasadas</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Profundidad</label>
                            <select class="form-select" id="optProfundidad">
                                <option value="rapido">Rápido</option>
                                <option value="equilibrado" selected>Equilibrado</option>
                                <option value="profundo">Profundo</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Enfoque</label>
                            <select class="form-select" id="optObjetivo">
                                <option value="auto" selected>Automático recomendado</option>
                                <option value="balanceado">Balanceado</option>
                                <option value="estudiantes">Estudiantes</option>
                                <option value="docentes">Docentes</option>
                                <option value="conflictos">Conflictos</option>
                                <option value="recursos">Docente NN / TRO2</option>
                            </select>
                        </div>
                        <label><input type="checkbox" id="optIncluirVirtuales" checked> Incluir bloques virtuales</label>
                        <label><input type="checkbox" id="optCompararEscenarios" checked> Comparar escenarios</label>
                        <label><input type="checkbox" id="optUsarEtapas" checked> Solver por etapas</label>
                    </div>
                    <div id="optPreview"></div>
                    <div class="modal-actions">
                        <button class="btn" id="btnOptCancelar">Cancelar</button>
                        <button class="btn btn-primary" id="btnOptAplicar">Aplicar optimización</button>
                    </div>
                </div></div>`;
            ['optAlcance','optMaxMovimientos','optPasadas','optProfundidad','optObjetivo','optIncluirVirtuales','optCompararEscenarios','optUsarEtapas'].forEach(id=>document.getElementById(id).onchange=programarCalculo);
            programarCalculo();
            document.getElementById('btnOptCancelar').onclick=()=>ctx.cerrarModal();
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget)ctx.cerrarModal();};
            document.getElementById('btnOptAplicar').onclick=()=>{
                const opcionesActuales=leerOpciones();
                const debeRecalcular=!ultimaSim||JSON.stringify(opcionesActuales)!==JSON.stringify(ultimasOpciones);
                const resultado=debeRecalcular?calcular():{opciones:ultimasOpciones,sim:ultimaSim};
                const {opciones,sim}=resultado;
                if(!sim.movimientos.length) return ctx.toast('No hay mejoras para aplicar con estos criterios','info');
                ctx.pushUndo();
                const destino=new Map(sim.planificaciones.map(p=>[p.id,p]));
                data.planificaciones.forEach(p=>{
                    const nuevo=destino.get(p.id);
                    if(nuevo && !p.fijo){
                        p.dia=nuevo.dia;
                        p.bloque=nuevo.bloque;
                    }
                });
                const explicacionAuditoria=explicacionEscenarioOptimizacion(sim);
                registrarMemoriaSolverOptimizacion(sim,opciones);
                ctx.auditoria?.('optimizacion_horario',{
                    alcance:opciones.alcance,
                    profundidad:opciones.profundidad,
                    pasadas:sim.pasadas||opciones.pasadas||1,
                    compararEscenarios:!!opciones.compararEscenarios,
                    porEtapas:!!sim.porEtapas,
                    objetivo:sim.objetivo||opciones.objetivo,
                    objetivoEfectivo:sim.objetivoEfectivo,
                    movimientos:sim.movimientos.length,
                    scoreAntes:sim.scoreInicial.score,
                    scoreDespues:sim.scoreFinal.score,
                    deltaScore:sim.deltaScore,
                    perdidaReducida:sim.perdidaReducida,
                    rutasEvaluadas:sim.rutasEvaluadas||0,
                    busquedaLocal:sim.busquedaLocal||null,
                    diagnosticoInicial:sim.diagnosticoInicial,
                    diagnosticoFinal:sim.diagnosticoFinal,
                    mejoras:explicacionAuditoria.mejoras.map(m=>({clave:m.clave,label:m.label,antes:m.antes,despues:m.despues,delta:m.delta})),
                    pendientes:explicacionAuditoria.pendientes.map(m=>({clave:m.clave,label:m.label,valor:m.despues})),
                    resumenPasadas:Array.isArray(sim.resumenPasadas)?sim.resumenPasadas:[],
                    resumenEtapas:Array.isArray(sim.resumenEtapas)?sim.resumenEtapas:[],
                    detalle:sim.movimientos
                });
                ctx.guardar();
                ctx.reconstruirIndices();
                construirGrilla();
                actualizarSelectoresPlan();
                actualizarProgresoPlan();
                ctx.renderDashboard?.();
                ctx.detectarConflictos?.();
                ctx.actualizarReporte?.();
                ctx.actualizarVista?.();
                ctx.renderHistorial?.();
                ctx.cerrarModal();
                ctx.toast(`Optimización aplicada: ${sim.movimientos.length} movimiento(s).`,'success');
            };
        }

        function calcularResumenAutoGeneral(opciones){
            const estrategia=opciones.estrategia||'balanceada';
            const planes=obtenerSeccionesAutoGeneral(opciones)
                .map(sec=>calcularPlanAutoSeccionPara(sec.id,estrategia))
                .filter(Boolean)
                .map(plan=>aplicarFiltrosAutoGeneral(plan,opciones));
            const acciones=planes.flatMap(p=>p.acciones.map(a=>Object.assign({plan:p},a)));
            const docentes=new Set(acciones.filter(a=>a.cant>0).map(a=>a.docente.id));
            const totalBloques=acciones.reduce((acc,a)=>acc+(Number(a.cant)||0),0);
            const requerido=acciones.reduce((acc,a)=>acc+(Number(a.requerido)||0),0)+planes.reduce((acc,p)=>acc+p.pendientes.length,0);
            const parciales=acciones.filter(a=>a.cant>0&&a.cant<a.requerido).length;
            const pendientes=planes.reduce((acc,p)=>acc+p.pendientes.length,0);
            const omitidas=planes.reduce((acc,p)=>acc+(p.omitidas||0),0);
            const nn=acciones.filter(a=>a.docente.id===ctx.DOCENTE_NN_ID).length;
            const transversales=acciones.filter(a=>a.asig.area==='transversal'||a.asig.controlHorario==='coordinacion-externa').length;
            const calidad=Math.max(0,Math.min(100,
                Math.round((requerido?totalBloques/requerido*100:0)-(pendientes*5)-(parciales*4)-(nn*3)-(omitidas*2)-(transversales*1))
            ));
            const scoreActual=scoreGlobalPlanificaciones(getData().planificaciones);
            const simulacion=simularAutoGeneral(Object.assign({},opciones,{estrategia}));
            const scoreEstimado=simulacion?.score||scoreActual;
            return {
                planes,
                totalBloques,
                requerido,
                calidad,
                totalAsignaturas:acciones.length,
                seccionesAfectadas:planes.filter(p=>p.acciones.some(a=>(Number(a.cant)||0)>0)).length,
                docentes:docentes.size,
                pendientes,
                parciales,
                omitidas,
                nn,
                virtuales:acciones.filter(a=>!a.esPresencial).length,
                transversales,
                scoreActual:scoreActual.score,
                scoreEstimado:scoreEstimado.score,
                deltaScore:scoreEstimado.score-scoreActual.score,
                simulacion
            };
        }

        function confirmarAutoGeneral(opcionesIniciales){
            return new Promise(resolve=>{
                let opciones=Object.assign({},opcionesIniciales);
                let resumen=calcularResumenAutoGeneral(opciones);
                const estrategias=[
                    {id:'balanceada',nombre:'Balanceada'},
                    {id:'compacta',nombre:'Compacta'},
                    {id:'docente',nombre:'Docente preferente'}
                ];
                const estrategiaOption=(id,label)=>`<option value="${id}" ${opciones.estrategia===id?'selected':''}>${label}</option>`;
                const resumenPorEstrategia=(id)=>calcularResumenAutoGeneral(Object.assign({},opciones,{estrategia:id}));
                const scoreEstrategia=(r)=>(r.deltaScore*1800)+(r.calidad*1000)+(r.totalBloques*20)-(r.pendientes*60)-(r.parciales*35)-(r.nn*35)-(r.omitidas*20)-(r.transversales*8);
                const estrategiaRecomendada=()=>estrategias
                    .map(e=>({id:e.id,resumen:resumenPorEstrategia(e.id)}))
                    .sort((a,b)=>scoreEstrategia(b.resumen)-scoreEstrategia(a.resumen))[0]?.id || 'balanceada';
                const explicarRecomendacionGeneral=()=>{
                    const comparados=estrategias.map(e=>Object.assign({id:e.id,nombre:e.nombre},resumenPorEstrategia(e.id)));
                    const recomendado=comparados.find(x=>x.id===estrategiaRecomendada())||comparados[0];
                    const maxCalidad=Math.max(...comparados.map(x=>x.calidad));
                    const maxBloques=Math.max(...comparados.map(x=>x.totalBloques));
                    const minPendientes=Math.min(...comparados.map(x=>x.pendientes));
                    const minParciales=Math.min(...comparados.map(x=>x.parciales));
                    const minNN=Math.min(...comparados.map(x=>x.nn));
                    const razones=[];
                    const maxDelta=Math.max(...comparados.map(x=>x.deltaScore));
                    if(recomendado.deltaScore===maxDelta&&recomendado.deltaScore>0) razones.push(`mejora el score global en ${recomendado.deltaScore} punto(s)`);
                    if(recomendado.calidad===maxCalidad) razones.push('tiene el mejor índice de calidad');
                    if(recomendado.totalBloques===maxBloques) razones.push('logra más bloques');
                    if(recomendado.pendientes===minPendientes) razones.push('deja menos pendientes');
                    if(recomendado.parciales===minParciales) razones.push('reduce asignaciones parciales');
                    if(recomendado.nn===minNN) razones.push('requiere menos Docente NN');
                    if(!razones.length) razones.push('ofrece el mejor balance global para el alcance seleccionado');
                    return `Se recomienda ${recomendado.nombre} porque ${razones.slice(0,3).join(', ')}.`;
                };
                const renderComparadorGeneral=()=>{
                    const recomendada=estrategiaRecomendada();
                    return `<div class="auto-general-compare">
                        ${estrategias.map(e=>{
                            const r=e.id===opciones.estrategia?resumen:resumenPorEstrategia(e.id);
                            const activa=e.id===opciones.estrategia;
                            return `<button class="auto-general-strategy ${activa?'active':''}" data-estrategia-general="${e.id}" type="button">
                                <span>${ctx.escapeHTML(e.nombre)}${recomendada===e.id?' · Recomendada':''}</span>
                                <strong>${r.calidad}%</strong>
                                <small>${r.totalBloques}/${r.requerido} bloques · score ${r.scoreActual}% → ${r.scoreEstimado}%</small>
                                <span class="auto-quality-track"><i style="width:${r.calidad}%;background:${r.calidad>=80?'var(--success)':r.calidad>=55?'var(--warning)':'var(--danger)'};"></i></span>
                                <div class="auto-general-metrics">
                                    <b>${r.seccionesAfectadas}</b><em>secciones</em>
                                    <b>${r.pendientes}</b><em>pendientes</em>
                                    <b>${r.parciales}</b><em>parciales</em>
                                    <b>${r.nn}</b><em>NN</em>
                                    <b>${r.deltaScore>=0?`+${r.deltaScore}`:r.deltaScore}</b><em>score</em>
                                </div>
                            </button>`;
                        }).join('')}
                    </div>`;
                };
                const abrirDetalleGeneral=()=>{
                    const detalleModal=document.getElementById('modalContainer');
                    const porCarrera=new Map();
                    resumen.planes.forEach(p=>{
                        const key=p.carrera?.id||p.carrera?.codigo||'sin-carrera';
                        if(!porCarrera.has(key)) porCarrera.set(key,{nombre:p.carrera?.nombre||p.carrera?.codigo||'Sin carrera',niveles:new Map()});
                        const carrera=porCarrera.get(key);
                        const nivelKey=p.nivel?.id||p.nivel?.nombre||'sin-nivel';
                        if(!carrera.niveles.has(nivelKey)) carrera.niveles.set(nivelKey,{nombre:p.nivel?.nombre||'Sin nivel',items:[]});
                        carrera.niveles.get(nivelKey).items.push(p);
                    });
                    const renderDetalle=(q='')=>{
                        const filtro=q.trim().toLowerCase();
                        const carreras=Array.from(porCarrera.values()).map(carrera=>{
                            const niveles=Array.from(carrera.niveles.values()).map(nivel=>{
                                const items=nivel.items.filter(p=>!filtro||[p.sec?.nombre,p.carrera?.codigo,p.carrera?.nombre,p.nivel?.nombre].join(' ').toLowerCase().includes(filtro));
                                return Object.assign({},nivel,{items});
                            }).filter(n=>n.items.length);
                            return Object.assign({},carrera,{niveles});
                        }).filter(c=>c.niveles.length);
                        if(!carreras.length) return '<p class="auto-plan-empty">No hay secciones que coincidan con la búsqueda.</p>';
                        return carreras.map(carrera=>`<div class="auto-general-detail-career">
                            <strong>${ctx.escapeHTML(carrera.nombre)}</strong>
                            ${carrera.niveles.map(nivel=>`<div class="auto-general-detail-level">
                                <span>${ctx.escapeHTML(nivel.nombre)}</span>
                                <div class="auto-general-detail-sections">
                                    ${nivel.items.map(p=>{
                                        const bloques=p.acciones.reduce((acc,a)=>acc+(Number(a.cant)||0),0);
                                        const alertas=[];
                                        if(p.acciones.some(a=>a.docente.id===ctx.DOCENTE_NN_ID)) alertas.push('NN');
                                        if(p.pendientes.length) alertas.push(`${p.pendientes.length} pendientes`);
                                        if(p.omitidas) alertas.push(`${p.omitidas} omitidas`);
                                        return `<div class="auto-general-detail-section">
                                            <div><b>${ctx.escapeHTML(p.sec?.nombre||'')}</b><small>${bloques} bloques · ${p.acciones.length} filas${alertas.length?' · '+ctx.escapeHTML(alertas.join(' · ')):''}</small></div>
                                        </div>`;
                                    }).join('')}
                                </div>
                            </div>`).join('')}
                        </div>`).join('');
                    };
                    detalleModal.innerHTML=`
                        <div class="modal-overlay" id="modalOverlay"><div class="modal auto-general-modal">
                            <div class="modal-header">
                                <h3>Detalle Auto-general</h3>
                                <p>${ctx.escapeHTML(estrategias.find(e=>e.id===opciones.estrategia)?.nombre||'Balanceada')} · agrupado por carrera, nivel y sección.</p>
                            </div>
                            <div class="search-box input-with-clear">
                                <input class="form-input" id="buscarDetalleAutoGeneral" placeholder="Buscar sección, carrera o nivel..." autocomplete="off">
                            </div>
                            <div id="detalleAutoGeneralContenido" class="auto-general-detail">${renderDetalle()}</div>
                            <div class="modal-actions">
                                <button class="btn" id="btnVolverAutoGeneral">Volver</button>
                            </div>
                        </div></div>`;
                    document.getElementById('buscarDetalleAutoGeneral').oninput=(e)=>{
                        document.getElementById('detalleAutoGeneralContenido').innerHTML=renderDetalle(e.target.value);
                    };
                    document.getElementById('btnVolverAutoGeneral').onclick=render;
                    document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget) render();};
                };
                const render=()=>{
                    document.getElementById('modalContainer').innerHTML=`
                    <div class="modal-overlay" id="modalOverlay"><div class="modal auto-general-modal">
                        <div class="modal-header">
                            <h3>Auto-planificación general</h3>
                            <p>Prepara varias secciones usando el mismo motor de auto-sección. Se aplicará en orden y recalculando cada sección al momento de asignar.</p>
                        </div>
                        <div class="auto-general-controls">
                            <div class="form-group">
                                <label class="form-label">Alcance</label>
                                <select class="form-select" id="autoGeneralAlcance">
                                    <option value="todas" ${opciones.alcance==='todas'?'selected':''}>Todas las secciones</option>
                                    <option value="carrera" ${opciones.alcance==='carrera'?'selected':''}>Carrera actual</option>
                                    <option value="nivel" ${opciones.alcance==='nivel'?'selected':''}>Nivel actual</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Estrategia</label>
                                <select class="form-select" id="autoGeneralEstrategia">
                                    ${estrategiaOption('balanceada','Balanceada')}
                                    ${estrategiaOption('compacta','Compacta')}
                                    ${estrategiaOption('docente','Docente preferente')}
                                </select>
                            </div>
                        </div>
                        ${renderComparadorGeneral()}
                        <div class="auto-recommendation-note">${ctx.escapeHTML(explicarRecomendacionGeneral())}</div>
                        <div class="auto-general-toggles">
                            <label><input type="checkbox" id="autoGeneralSoloPendientes" ${opciones.soloPendientes!==false?'checked':''}> Solo secciones con pendientes</label>
                            <label><input type="checkbox" id="autoGeneralVespertino" ${opciones.vespertinoPrimero!==false?'checked':''}> Vespertinas primero</label>
                        </div>
                        ${renderPanelCriteriosAuto('autoGeneralCriterio',opciones)}
                        <div class="export-preview-grid">
                            <div><span>Secciones</span><strong>${resumen.planes.length}</strong></div>
                            <div><span>Bloques posibles</span><strong>${resumen.totalBloques}</strong></div>
                            <div><span>Secciones afectadas</span><strong>${resumen.seccionesAfectadas}</strong></div>
                            <div><span>Filas/asignaturas</span><strong>${resumen.totalAsignaturas}</strong></div>
                            <div><span>Docentes</span><strong>${resumen.docentes}</strong></div>
                            <div><span>Pendientes</span><strong>${resumen.pendientes}</strong></div>
                            <div><span>Omitidas por filtros</span><strong>${resumen.omitidas}</strong></div>
                            <div><span>Score estimado</span><strong>${resumen.scoreActual}% → ${resumen.scoreEstimado}%</strong></div>
                        </div>
                        <div class="auto-plan-doc-summary auto-plan-criteria-summary">
                            <strong>Lectura rápida</strong>
                            <span class="auto-plan-summary-chip ${resumen.nn?'warning':'info'}">Docente NN: ${resumen.nn}</span>
                            <span class="auto-plan-summary-chip info">Virtuales: ${resumen.virtuales}</span>
                            <span class="auto-plan-summary-chip info">Transversales: ${resumen.transversales}</span>
                        </div>
                        <div class="auto-general-selected-detail">
                            <strong>Estrategia seleccionada: ${ctx.escapeHTML(estrategias.find(e=>e.id===opciones.estrategia)?.nombre||'Balanceada')}</strong>
                            <span>El detalle completo se abre bajo demanda para mantener esta vista liviana.</span>
                        </div>
                        <div class="modal-actions">
                            <button class="btn" id="btnCancelarAutoGeneral">Cancelar</button>
                            <button class="btn" id="btnDetalleAutoGeneral" ${resumen.planes.length?'':'disabled'}>Ver detalle</button>
                            <button class="btn btn-primary" id="btnAplicarAutoGeneral" ${resumen.totalBloques?'':'disabled'}>Aplicar auto-general</button>
                        </div>
                    </div></div>`;
                    const leerOpciones=()=>({
                        alcance:document.getElementById('autoGeneralAlcance').value,
                        estrategia:document.getElementById('autoGeneralEstrategia').value,
                        soloPendientes:document.getElementById('autoGeneralSoloPendientes').checked,
                        vespertinoPrimero:document.getElementById('autoGeneralVespertino').checked,
                        ...leerPanelCriteriosAuto('autoGeneralCriterio')
                    });
                    const recalcular=()=>{ opciones=leerOpciones(); guardarCriteriosAuto(opciones); resumen=calcularResumenAutoGeneral(opciones); render(); };
                    ['autoGeneralAlcance','autoGeneralEstrategia','autoGeneralSoloPendientes','autoGeneralVespertino'].forEach(id=>document.getElementById(id).onchange=recalcular);
                    document.querySelectorAll('[id^="autoGeneralCriterio"]').forEach(ctrl=>ctrl.onchange=recalcular);
                    document.querySelectorAll('[data-estrategia-general]').forEach(btn=>btn.onclick=()=>{
                        opciones.estrategia=btn.dataset.estrategiaGeneral;
                        guardarCriteriosAuto(opciones);
                        resumen=calcularResumenAutoGeneral(opciones);
                        render();
                    });
                    document.getElementById('btnCancelarAutoGeneral').onclick=()=>{document.getElementById('modalContainer').innerHTML='';resolve(null);};
                    document.getElementById('btnDetalleAutoGeneral').onclick=abrirDetalleGeneral;
                    document.getElementById('btnAplicarAutoGeneral').onclick=()=>{document.getElementById('modalContainer').innerHTML='';resolve(opciones);};
                    document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget){document.getElementById('modalContainer').innerHTML='';resolve(null);}};
                };
                render();
            });
        }

        function mostrarResumenAutoGeneral(resultado){
            const modal=document.getElementById('modalContainer');
            if(!modal) return;
            const filas=resultado.detalle.slice(0,20).map(item=>`
                <tr>
                    <td>${ctx.escapeHTML(item.seccion||'')}</td>
                    <td>${ctx.escapeHTML(item.carreraNivel||'')}</td>
                    <td style="text-align:right;">${item.bloques}</td>
                    <td style="text-align:right;">${item.pendientes}</td>
                    <td style="text-align:right;">${item.omitidas}</td>
                    <td>${item.alertas.length?item.alertas.map(a=>`<span class="auto-plan-alert ${a.clase}">${ctx.escapeHTML(a.texto)}</span>`).join(' '):'<span class="auto-plan-empty">Sin alertas</span>'}</td>
                    <td>${item.bloques>0?`<button class="btn btn-xs auto-general-review" data-seccion="${ctx.escapeAttr(item.seccionId)}" type="button">Revisar</button>`:''}</td>
                </tr>
            `).join('');
            modal.innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal auto-general-modal">
                    <div class="modal-header">
                        <h3>Resultado de Auto-general</h3>
                        <p>Resumen de lo que se aplicó. Puedes revisar directamente las secciones modificadas.</p>
                    </div>
                    <div class="export-preview-grid">
                        <div><span>Bloques asignados</span><strong>${resultado.total}</strong></div>
                        <div><span>Secciones modificadas</span><strong>${resultado.seccionesConCambio}</strong></div>
                        <div><span>Pendientes detectados</span><strong>${resultado.pendientes}</strong></div>
                        <div><span>Omitidas por filtros</span><strong>${resultado.omitidas}</strong></div>
                    </div>
                    ${resultado.detalle.length?`
                        <table class="report-table auto-general-result-table">
                            <thead><tr><th>Sección</th><th>Carrera / nivel</th><th>Bloques</th><th>Pendientes</th><th>Omitidas</th><th>Alertas</th><th>Acción</th></tr></thead>
                            <tbody>${filas}</tbody>
                        </table>
                    `:'<p class="auto-plan-empty">No hubo secciones modificadas.</p>'}
                    ${resultado.detalle.length>20?`<p class="auto-plan-empty">Se muestran las primeras 20 secciones modificadas.</p>`:''}
                    <div class="modal-actions">
                        <button class="btn" id="btnCerrarResumenAutoGeneral">Cerrar</button>
                    </div>
                </div></div>`;
            const cerrar=()=>{modal.innerHTML='';};
            document.getElementById('btnCerrarResumenAutoGeneral').onclick=cerrar;
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget) cerrar();};
            modal.querySelectorAll('.auto-general-review').forEach(btn=>btn.onclick=()=>{
                const seccionId=btn.dataset.seccion;
                cerrar();
                if(ctx.irASeccion) ctx.irASeccion(seccionId,{mensaje:'Sección abierta desde resumen Auto-general'});
            });
        }

        async function autoAsignarGeneral(){
            const data=getData();
            const cfgAuto=data.configuracion.autoPlanificacion||{};
            const estrategiaInicial=['balanceada','compacta','docente'].includes(data.configuracion.autoPlanificacion?.estrategiaPredeterminada)
                ? data.configuracion.autoPlanificacion.estrategiaPredeterminada
                : 'balanceada';
            const opciones=await confirmarAutoGeneral({
                alcance:data.sel.nivelId?'nivel':data.sel.carreraId?'carrera':'todas',
                estrategia:estrategiaInicial,
                soloPendientes:true,
                vespertinoPrimero:true,
                usarPrioridadDocente:cfgAuto.usarPrioridadDocente!==false,
                balancearDias:cfgAuto.balancearDias!==false,
                permitirSabadoPresencial:!!cfgAuto.permitirSabadoPresencial,
                permitirDocenteNN:cfgAuto.permitirDocenteNN!==false,
                incluirTransversales:cfgAuto.incluirTransversales!==false,
                incluirVirtuales:cfgAuto.incluirVirtuales!==false,
                priorizarVirtualSabado:cfgAuto.priorizarVirtualSabado!==false,
                evitarTempranoN1:cfgAuto.evitarTempranoN1!==false,
                cuidarCriticas:cfgAuto.cuidarCriticas!==false,
                cuidarAyudantias:cfgAuto.cuidarAyudantias!==false
            });
            if(!opciones) return;
            if(!await confirmarValidacionAntesAuto('auto_general',opciones)) return;
            guardarCriteriosAuto(opciones);
            const secciones=obtenerSeccionesAutoGeneral(opciones);
            if(!secciones.length) return ctx.toast('No hay secciones para auto-planificar','info');
            const original={...data.sel};
            let total=0, seccionesConCambio=0, omitidas=0, pendientes=0;
            const detalle=[];
            const ids=[];
            const explicaciones=[];
            ctx.pushUndo();
            for(const sec of secciones){
                const planBase=calcularPlanAutoSeccionPara(sec.id,opciones.estrategia);
                if(!planBase) continue;
                const plan=aplicarFiltrosAutoGeneral(planBase,opciones);
                omitidas+=plan.omitidas||0;
                pendientes+=plan.pendientes.length;
                const {nivel,carrera}=contextoSeccion(sec);
                data.sel.carreraId=carrera.id;
                data.sel.nivelId=nivel.id;
                data.sel.seccionId=sec.id;
                let subtotal=0;
                plan.acciones.forEach(a=>{
                    if(a.cant>0) subtotal+=autoAsignarBloques(a.asig.id,sec.id,a.docente.id,a.salaId,a.esPresencial,a.offsetDia,{estrategia:opciones.estrategia,omitirUndo:true,registrarIds:ids,registrarExplicaciones:explicaciones,origen:'auto_general'});
                });
                if(subtotal>0){
                    total+=subtotal;
                    seccionesConCambio++;
                    const alertas=[];
                    if(plan.acciones.some(a=>a.docente.id===ctx.DOCENTE_NN_ID)) alertas.push({texto:'Docente NN',clase:'warning'});
                    if(plan.acciones.some(a=>a.asig.area==='transversal'||a.asig.controlHorario==='coordinacion-externa')) alertas.push({texto:'Transversal/externa',clase:'info'});
                    if(plan.pendientes.length) alertas.push({texto:`${plan.pendientes.length} pendiente(s)`,clase:'warning'});
                    if(plan.omitidas) alertas.push({texto:`${plan.omitidas} omitida(s)`,clase:'info'});
                    detalle.push({
                        seccionId:sec.id,
                        seccion:sec.nombre||'',
                        carreraNivel:[carrera?.codigo||carrera?.nombre,nivel?.nombre].filter(Boolean).join(' · '),
                        bloques:subtotal,
                        pendientes:plan.pendientes.length,
                        omitidas:plan.omitidas||0,
                        alertas
                    });
                }
            }
            Object.assign(data.sel,original);
            ctx.reconstruirIndices();
            if(!total){
                construirGrilla();
                actualizarSelectoresPlan();
                actualizarProgresoPlan();
                return ctx.toast('No se pudo asignar con los filtros actuales','error');
            }
            const ejecucionAuto=registrarAutoEjecucion('auto_general',ids,{bloques:total,secciones:seccionesConCambio,estrategia:opciones.estrategia,explicaciones:explicaciones.slice(0,80)});
            const scoreAntes=scoreGlobalPlanificaciones(data.planificaciones.filter(p=>!ids.includes(p.id))).score;
            const scoreDespues=scoreGlobalPlanificaciones(data.planificaciones).score;
            const resultadoAutoGeneral={ts:new Date().toISOString(),total,seccionesConCambio,pendientes,omitidas,estrategia:opciones.estrategia,alcance:opciones.alcance,detalle,ejecucionId:ejecucionAuto?.id||null,scoreAntes,scoreDespues,deltaScore:scoreDespues-scoreAntes};
            data.ultimoAutoGeneral=resultadoAutoGeneral;
            ctx.auditoria?.('auto_general',{bloquesAsignados:total,secciones:seccionesConCambio,estrategia:opciones.estrategia,pendientes,omitidas,scoreAntes,scoreDespues,deltaScore:scoreDespues-scoreAntes,explicaciones:explicaciones.slice(0,30)});
            ctx.guardar();
            construirGrilla();
            actualizarSelectoresPlan();
            actualizarProgresoPlan();
            ctx.renderDashboard?.();
            ctx.detectarConflictos?.();
            ctx.actualizarReporte?.();
            ctx.actualizarVista?.();
            ctx.renderHistorial?.();
            ctx.toast(`✅ Auto-general asignó ${total} bloque(s) en ${seccionesConCambio} sección(es).`,'success');
            mostrarResumenAutoGeneral(resultadoAutoGeneral);
        }

        function init(){
            const scheduleGrid=document.getElementById('scheduleGrid');
            scheduleGrid.addEventListener('mousedown',(e)=>{
                const data = getData();
                const indicePlan = ctx.getIndicePlan();
                if(modoMovimiento){
                    const cell=e.target.closest('.grid-cell'); if(!cell||cell.cellIndex===0) return;
                    const visible=planVisibleEn(modoMovimiento.seccionId,Number(cell.dataset.dia),Number(cell.dataset.bloque));
                    const plan=visible?.plan;
                    if(visible?.vinculado) return;
                    if(!plan || plan.asignaturaId!==modoMovimiento.plan.asignaturaId) return;
                    if(plan.fijo){ ctx.toast('Este bloque está fijo. Desbloquéalo antes de moverlo.','info'); return; }
                    arrastre.activo=true; arrastre.inicioDia=parseInt(cell.dataset.dia); arrastre.inicioBloque=parseInt(cell.dataset.bloque);
                    arrastre.origenPlan=plan; arrastre.celdas=[{dia:parseInt(cell.dataset.dia),bloque:parseInt(cell.dataset.bloque),cell}]; arrastre.esMovimiento=true;
                    e.preventDefault(); return;
                }
                const cell=e.target.closest('.grid-cell'); if(!cell||cell.cellIndex===0) return; if(e.button!==0) return;
                const dia=parseInt(cell.dataset.dia),bloque=parseInt(cell.dataset.bloque);
                const secId=data.sel.seccionId; const visible=secId?planVisibleEn(secId,dia,bloque):null; const plan=visible?.plan||null;
                arrastre.activo=true; arrastre.inicioDia=dia; arrastre.inicioBloque=bloque; arrastre.estado=!plan;
                arrastre.celdas=[{dia,bloque,cell}]; e.preventDefault();
            });
            scheduleGrid.addEventListener('mousemove',(e)=>{
                if(!arrastre.activo) return;
                const cell=e.target.closest('.grid-cell'); if(!cell||cell.cellIndex===0) return;
                const dia=parseInt(cell.dataset.dia),bloque=parseInt(cell.dataset.bloque);
                if(!arrastre.celdas.some(c=>c.dia===dia&&c.bloque===bloque)) arrastre.celdas.push({dia,bloque,cell});
                if(arrastre.esMovimiento) cell.style.outline='2px solid var(--success)';
                else if(arrastre.origenPlan) cell.style.outline='2px solid var(--success)';
                else cell.style.outline=arrastre.estado?'2px solid var(--accent)':'2px solid var(--danger)';
            });
            scheduleGrid.addEventListener('mouseup',()=>{
                const data = getData();
                const indicePlan = ctx.getIndicePlan();
                if(arrastre.esMovimiento){
                    arrastre.activo=false; arrastre.esMovimiento=false;
                    const origen=arrastre.origenPlan; arrastre.origenPlan=null;
                    const celdas=[...arrastre.celdas]; arrastre.celdas=[]; celdas.forEach(c=>c.cell.style.outline='');
                    if(origen?.fijo){ ctx.toast('Este bloque está fijo. Desbloquéalo antes de moverlo.','info'); return; }
                    const destino=celdas[celdas.length-1];
                    if(destino&&origen&&(destino.dia!==origen.dia||destino.bloque!==origen.bloque)){
                        if(!destino.cell.classList.contains('available')){ ctx.toast('Destino no disponible','error'); return; }
                        const docId=modoMovimiento?.nuevoDocenteId||origen.docenteId;
                        ctx.pushUndo(); data.planificaciones=data.planificaciones.filter(p=>p.id!==origen.id);
                        const nuevo={...origen,id:ctx.genId(),dia:destino.dia,bloque:destino.bloque,docenteId:docId};
                        data.planificaciones.push(nuevo);
                        if(origen.explicacionAuto) registrarMemoriaPlanificacion('bloque_auto_movido', Object.assign(contextoMemoriaDesdePlan(origen),{
                            desde:{dia:origen.dia,bloque:origen.bloque},
                            hacia:{dia:destino.dia,bloque:destino.bloque},
                            docenteNuevoId:docId
                        }));
                        ctx.auditoria?.('bloque_movido',{antes:origen,despues:nuevo});
                        ctx.guardar(); ctx.reconstruirIndices(); construirGrillaMovimiento(); refrescarDespuesCambioPlanificacion();
                    }
                    return;
                }
                if(!arrastre.activo) return;
                arrastre.activo=false; const celdas=[...arrastre.celdas]; arrastre.celdas=[];
                celdas.forEach(c=>c.cell.style.outline='');
                const dist=Math.abs(celdas[0]?.dia-arrastre.inicioDia)+Math.abs(celdas[0]?.bloque-arrastre.inicioBloque);
                if(dist<=data.configuracion.sensibilidadArrastre && celdas.length===1){
                    const cell=celdas[0].cell;
                    const visible=data.sel.seccionId?planVisibleEn(data.sel.seccionId,Number(cell.dataset.dia),Number(cell.dataset.bloque)):null;
                    const plan=visible?.plan||null;
                    if(plan) mostrarPopupAccion(cell,plan);
                    else if(data.modoPlan){
                        if(asignarBloque(parseInt(cell.dataset.dia),parseInt(cell.dataset.bloque))) ctx.toast('Bloque asignado','success');
                        else ctx.toast('No se pudo asignar','error');
                        actualizarSelectoresPlan();
                    }
                    arrastre.origenPlan=null; return;
                }
                if(arrastre.origenPlan){
                    if(arrastre.origenPlan.fijo){
                        ctx.toast('Este bloque está fijo. Desbloquéalo antes de moverlo.','info');
                        arrastre.origenPlan=null;
                        return;
                    }
                    const destino=celdas.find(c=>c.dia!==arrastre.inicioDia||c.bloque!==arrastre.inicioBloque);
                    if(destino) {
                        if(data.sel.seccionId && seccionOcupadaVisible(data.sel.seccionId,destino.dia,destino.bloque,{ignorarIds:[arrastre.origenPlan.id]})){
                            ctx.toast('No se puede mover: la sección ya tiene un bloque en ese horario','error');
                            arrastre.origenPlan=null;
                            return;
                        }
                        const dispCheck=checkDisponibilidadDocente(arrastre.origenPlan.docenteId,destino.dia,destino.bloque,{ignorarIds:[arrastre.origenPlan.id]});
                        if(dispCheck.ok){
                            ctx.pushUndo();
                            const nuevoPlan={...arrastre.origenPlan, id:ctx.genId(), dia:destino.dia, bloque:destino.bloque};
                            data.planificaciones.push(nuevoPlan);
                            data.planificaciones=data.planificaciones.filter(p=>p.id!==arrastre.origenPlan.id);
                            if(arrastre.origenPlan.explicacionAuto) registrarMemoriaPlanificacion('bloque_auto_movido', Object.assign(contextoMemoriaDesdePlan(arrastre.origenPlan),{
                                desde:{dia:arrastre.origenPlan.dia,bloque:arrastre.origenPlan.bloque},
                                hacia:{dia:destino.dia,bloque:destino.bloque}
                            }));
                            ctx.auditoria?.('bloque_movido',{antes:arrastre.origenPlan,despues:nuevoPlan});
                            ctx.guardar(); ctx.reconstruirIndices(); construirGrilla(); actualizarSelectoresPlan(); refrescarDespuesCambioPlanificacion();
                            ctx.toast('Planificación movida','success');
                        } else ctx.toast('No se puede mover: '+dispCheck.msg,'error');
                    }
                    arrastre.origenPlan=null; return;
                }
                if(data.modoPlan){
                    const estado=arrastre.estado; let cont=0;
                    if(estado){
                        celdas.forEach(c=>{ if(asignarBloque(c.dia,c.bloque)) cont++; });
                        if(cont>0) ctx.toast(`${cont} bloque(s) asignado(s)`,'success');
                    } else {
                        celdas.forEach(c=>{
                            const visible=data.sel.seccionId?planVisibleEn(data.sel.seccionId,c.dia,c.bloque):null;
                            const plan=visible?.vinculado?null:visible?.plan||null;
                            if(plan && plan.asignaturaId === data.sel.asignaturaId){ eliminarBloque(plan); cont++; }
                        });
                        if(cont>0) ctx.toast(`${cont} bloque(s) eliminado(s)`,'info');
                    }
                    actualizarSelectoresPlan();
                }
                arrastre.origenPlan=null;
            });
            document.addEventListener('click',(e)=>{if(!e.target.closest('.action-popup')&&!e.target.closest('.grid-cell'))cerrarPopupAccion();});

            ['planCarrera','planNivel','planJornada','planSeccion','planAsignatura','planDocente','planSala','planTipo'].forEach(id=>document.getElementById(id).addEventListener('change',function(){
                const data = getData();
                const map={planCarrera:'carreraId',planNivel:'nivelId',planJornada:'jornada',planSeccion:'seccionId',planAsignatura:'asignaturaId',planDocente:'docenteId',planSala:'salaId',planTipo:'tipo'};
                if(map[id]) data.sel[map[id]]=this.value||null;
                if(['planCarrera','planNivel','planJornada','planSeccion','planAsignatura','planDocente'].includes(id)){
                    if(id==='planCarrera'){data.sel.nivelId=null;data.sel.jornada=null;data.sel.seccionId=null;data.sel.asignaturaId=null;data.sel.docenteId=null;}
                    if(id==='planNivel'){data.sel.jornada=null;data.sel.seccionId=null;data.sel.asignaturaId=null;data.sel.docenteId=null;}
                    if(id==='planJornada'){data.sel.seccionId=null;data.sel.asignaturaId=null;data.sel.docenteId=null;}
                    if(id==='planSeccion'){data.sel.asignaturaId=null;data.sel.docenteId=null;}
                    if(id==='planAsignatura') data.sel.docenteId=null;
                    actualizarSelectoresPlan();
                    if(data.modoPlan||id==='planJornada'||id==='planSeccion') construirGrilla();
                }
            }));
            document.getElementById('btnAutoAsignatura').onclick=autoAsignarAsignaturaActual;
            document.getElementById('btnAutoSeccion').onclick=autoAsignarSeccionActual;
            document.getElementById('btnAutoGeneral').onclick=autoAsignarGeneral;
            document.getElementById('btnOptimizarHorario').onclick=abrirOptimizacionHorario;
            document.getElementById('btnRevertirAutoRapido').onclick=deshacerUltimaAuto;
        }

        return {
            construirGrilla,
            actualizarCelda,
            checkDisponibilidad,
            autoAsignarBloques,
            autoAsignarAsignaturaActual,
            autoAsignarSeccionActual,
            autoAsignarGeneral,
            abrirOptimizacionHorario,
            deshacerUltimaAuto,
            abrirReversionAutos,
            asignarBloque,
            eliminarBloque,
            mostrarPopupAccion,
            cerrarPopupAccion,
            cancelarMovimiento,
            hayMovimiento,
            actualizarSelectoresPlan,
            actualizarProgresoPlan,
            init
        };
    }

    window.PlanificadorPlanificacion = { create: createPlanificacion };
})();
