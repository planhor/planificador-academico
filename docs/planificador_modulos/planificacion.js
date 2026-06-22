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
        const comparadorSlots = [];
        let comparadorActivo = false;
        let comparadorCapacidad = 2;
        let comparadorAnimacionTimer = null;
        let ultimaSeccionRenderizada;
        let animacionCambioSeccionTimer = null;

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
            actualizarProgresoPlan();
            ctx.actualizarReporte?.();
            ctx.actualizarVista?.();
            ctx.renderDashboard?.();
            ctx.detectarConflictos?.();
            ctx.renderHistorial?.();
            if(comparadorActivo) renderComparadorPlanificacion();
        }

        function mismoId(a,b){
            return String(a??'')===String(b??'');
        }

        function idTexto(valor){
            return String(valor??'');
        }

        function nombreSeccion(seccionId){
            const data=getData();
            return data.secciones.find(s=>mismoId(s.id,seccionId))?.nombre||'Sección no encontrada';
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

        function areaCarrera(carrera={}){
            carrera=carrera||{};
            return String(carrera.area||carrera.especialidad||'Sin área').trim()||'Sin área';
        }

        function contextoSeccionPorId(seccionId){
            const data=getData();
            const sec=data.secciones.find(s=>mismoId(s.id,seccionId));
            const nivel=sec?data.niveles.find(n=>mismoId(n.id,sec.nivelId)):null;
            const carrera=nivel?data.carreras.find(c=>mismoId(c.id,nivel.carreraId)):null;
            return {sec,nivel,carrera};
        }

        function idSeccionReal(seccionId){
            const data=getData();
            const sec=data.secciones.find(s=>mismoId(s.id,seccionId));
            return sec?idTexto(sec.id):'';
        }

        function areasCarrera(){
            const data=getData();
            return [...new Set(data.carreras.map(areaCarrera).map(a=>String(a||'').trim()).filter(Boolean))]
                .sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'}));
        }

        function gruposVinculadosDeSeccion(seccionId){
            const grupos=ctx.getGruposDictacion?.()||[];
            return grupos.filter(g=>!mismoId(g.seccionMadreId,seccionId) && g.seccionesVinculadasIds?.some(id=>mismoId(id,seccionId)));
        }

        function planVinculadoEn(seccionId,dia,bloque,planes=null){
            const data=getData();
            const fuente=planes||data.planificaciones;
            const diaNum=Number(dia), bloqueNum=Number(bloque);
            for(const grupo of gruposVinculadosDeSeccion(seccionId)){
                const asignaturas=[grupo.asignaturaId, ...(grupo.asignaturasEquivalentesIds||[])].filter(Boolean);
                const plan=fuente.find(p=>
                    mismoId(p.seccionId,grupo.seccionMadreId) &&
                    asignaturas.some(id=>mismoId(id,p.asignaturaId)) &&
                    Number(p.dia)===diaNum &&
                    Number(p.bloque)===bloqueNum
                );
                if(plan) return {plan, grupo, vinculado:true, seccionVistaId:seccionId};
            }
            return null;
        }

        function planesElectivosObjetivoEn(seccionId,dia,bloque,planes=null){
            const data=getData();
            const fuente=planes||data.planificaciones;
            const vinculos=(data.vinculosElectivos||[]).filter(v=>mismoId(v.seccionDestinoId,seccionId));
            return fuente.filter(p=>
                !mismoId(p.seccionId,seccionId) && vinculos.some(v=>mismoId(v.asignaturaId,p.asignaturaId)&&mismoId(v.seccionOrigenId,p.seccionId)) &&
                Number(p.dia)===Number(dia) && (bloque===null||bloque===undefined||Number(p.bloque)===Number(bloque))
            ).map(plan=>({plan,vinculos:vinculos.filter(v=>mismoId(v.asignaturaId,plan.asignaturaId)&&mismoId(v.seccionOrigenId,plan.seccionId))}));
        }

        function planElectivoObjetivoEn(seccionId,dia,bloque,planes=null){
            const coincidencias=planesElectivosObjetivoEn(seccionId,dia,bloque,planes);
            if(!coincidencias.length) return null;
            return {
                plan:coincidencias[0].plan,
                vinculado:true,
                electivaObjetivo:true,
                alternativas:coincidencias.length,
                seccionVistaId:seccionId,
                seccionOrigenId:coincidencias[0].plan.seccionId,
                grupoElectivo:''
            };
        }

        function planVisibleEnFuente(seccionId,dia,bloque,planes=null){
            const data=getData();
            const fuente=planes||data.planificaciones;
            const propio=planes
                ? fuente.find(p=>mismoId(p.seccionId,seccionId)&&Number(p.dia)===Number(dia)&&Number(p.bloque)===Number(bloque))
                : ctx.getIndicePlan()[`${seccionId}_${dia}_${bloque}`];
            if(propio) return {plan:propio, vinculado:false, grupo:null, seccionVistaId:seccionId};
            return planVinculadoEn(seccionId,dia,bloque,fuente)||planElectivoObjetivoEn(seccionId,dia,bloque,fuente);
        }

        function planVisibleEn(seccionId,dia,bloque){
            return planVisibleEnFuente(seccionId,dia,bloque);
        }

        function seccionOcupadaVisible(seccionId,dia,bloque,opciones={}){
            const ignorar=new Set(opciones.ignorarIds||[]);
            const visible=planVisibleEnFuente(seccionId,dia,bloque,opciones.planes||null);
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

        function seccionesImpactadasDictacion(asigId,seccionId){
            const data=getData();
            const asig=data.asignaturas.find(a=>mismoId(a.id,asigId));
            if(asig?.area==='electiva'){
                const destinos=(data.vinculosElectivos||[]).filter(v=>mismoId(v.asignaturaId,asigId)&&mismoId(v.seccionOrigenId,seccionId)).map(v=>v.seccionDestinoId);
                return [...new Set([seccionId,...destinos].filter(Boolean))];
            }
            const estado=estadoDictacionAsignatura(asigId,seccionId);
            if(estado.estado==='dictada-aqui'&&estado.grupo){
                return [...new Set([seccionId,...(estado.grupo.seccionesVinculadasIds||[])].filter(Boolean))];
            }
            return [seccionId].filter(Boolean);
        }

        function ocupacionSeccionesImpactadas(asigId,seccionId,dia,bloque,opciones={}){
            const data=getData();
            const ignorar=new Set(opciones.ignorarIds||[]);
            const planes=opciones.planes||null;
            const asigActual=data.asignaturas.find(a=>mismoId(a.id,asigId));
            for(const secId of seccionesImpactadasDictacion(asigId,seccionId)){
                const visible=planVisibleEnFuente(secId,dia,bloque,planes);
                if(!visible?.plan || ignorar.has(visible.plan.id)) continue;
                const asigOcupante=data.asignaturas.find(a=>mismoId(a.id,visible.plan.asignaturaId));
                const vinculoActual=(data.vinculosElectivos||[]).some(v=>mismoId(v.asignaturaId,asigActual?.id)&&mismoId(v.seccionOrigenId,seccionId)&&mismoId(v.seccionDestinoId,secId));
                const vinculoOcupante=(data.vinculosElectivos||[]).some(v=>mismoId(v.asignaturaId,asigOcupante?.id)&&mismoId(v.seccionOrigenId,visible.plan.seccionId)&&mismoId(v.seccionDestinoId,secId));
                if(asigActual?.area==='electiva'&&asigOcupante?.area==='electiva'&&vinculoActual&&vinculoOcupante) continue;
                return {ocupada:true,seccionId:secId,plan:visible.plan,vinculado:!!visible.vinculado};
            }
            return {ocupada:false};
        }

        function relacionAsignaturaSeccion(asigId,seccionId){
            const data=getData();
            return (data.asignaturaSeccion||[]).find(r=>r.asignaturaId===asigId&&r.seccionId===seccionId)||null;
        }

        function componentesAsignaturaSeccion(asigId,seccionId){
            const rel=relacionAsignaturaSeccion(asigId,seccionId);
            return rel?.usaSubsecciones && Array.isArray(rel.componentesSubseccion) ? rel.componentesSubseccion : [];
        }

        function componenteSeleccionado(){
            const data=getData();
            const comps=componentesAsignaturaSeccion(data.sel.asignaturaId,data.sel.seccionId);
            if(!comps.length) return null;
            const actual=data.sel.componenteId&&comps.find(c=>c.id===data.sel.componenteId);
            return actual||comps[0]||null;
        }

        function nombreComponentePlan(plan){
            const comp=componentesAsignaturaSeccion(plan.asignaturaId,plan.seccionId).find(c=>c.id===plan.componenteId);
            return comp?.nombre||'';
        }

        function horasComponentePlanificacion(asigId,seccionId,componenteId,tipo){
            if(tipo==='virtual') return bloquesRequeridosAsignatura(getData().asignaturas.find(a=>a.id===asigId),'virtual');
            const comps=componentesAsignaturaSeccion(asigId,seccionId);
            if(!comps.length) return bloquesRequeridosAsignatura(getData().asignaturas.find(a=>a.id===asigId),'presencial');
            const comp=comps.find(c=>c.id===componenteId)||comps[0];
            return bloquesDesdeHoras(Number(comp?.horas)||0);
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
            const vinculosElectivos=(data.vinculosElectivos||[]).filter(v=>mismoId(v.asignaturaId,asig.id)&&mismoId(v.seccionOrigenId,data.sel.seccionId));
            if(asig.area==='electiva'&&vinculosElectivos.length){
                const destinos=[...new Set(vinculosElectivos.map(v=>v.seccionDestinoId))].map(nombreSeccion).filter(Boolean);
                mensajes.push(`<strong>Electiva vinculada a ${destinos.length} sección(es)</strong>`);
                mensajes.push(`Protege el horario de: ${ctx.escapeHTML(destinos.join(', '))}.`);
            }else if(estado.estado==='vinculada'){
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
                const carrera=data.carreras.find(c=>c.id===data.sel.carreraId);
                data.sel.area=carrera?areaCarrera(carrera):data.sel.area;
                actualizarSelectoresPlan();
                construirGrilla();
                actualizarProgresoPlan();
                ctx.toast('Sección madre abierta','info');
            });
        }

        function planesVisiblesAsignaturaSeccion(asigId,seccionId,planes=null){
            const data=getData();
            const fuente=planes||data.planificaciones;
            const propios=fuente.filter(p=>mismoId(p.seccionId,seccionId)&&mismoId(p.asignaturaId,asigId));
            const grupos=(ctx.getGruposDictacion?.()||[]).filter(g=>
                !mismoId(g.seccionMadreId,seccionId) &&
                g.seccionesVinculadasIds?.some(id=>mismoId(id,seccionId)) &&
                (mismoId(g.asignaturaId,asigId) || g.asignaturasEquivalentesIds?.some(id=>mismoId(id,asigId)))
            );
            const heredados=grupos.flatMap(g=>{
                const ids=[g.asignaturaId,...(g.asignaturasEquivalentesIds||[])].filter(Boolean);
                return fuente.filter(p=>mismoId(p.seccionId,g.seccionMadreId)&&ids.some(id=>mismoId(id,p.asignaturaId)));
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
            const electivas=planesElectivosObjetivoEn(seccionId,dia,null,fuente).map(x=>x.plan);
            return [...propios,...heredados,...electivas];
        }

        function planesVisiblesComparador(seccionId){
            const data=getData();
            const propios=data.planificaciones.filter(p=>mismoId(p.seccionId,seccionId));
            const heredados=(Array.isArray(data.gruposDictacion)?data.gruposDictacion:[])
                .filter(g=>!mismoId(g.seccionMadreId,seccionId)&&g.seccionesVinculadasIds?.some(id=>mismoId(id,seccionId)))
                .flatMap(g=>{
                    const ids=[g.asignaturaId,...(g.asignaturasEquivalentesIds||[])].filter(Boolean);
                    return data.planificaciones
                        .filter(p=>mismoId(p.seccionId,g.seccionMadreId)&&ids.some(id=>mismoId(id,p.asignaturaId)))
                        .map(p=>Object.assign({},p,{vinculado:true,seccionVistaId:seccionId,seccionOrigenId:g.seccionMadreId}));
                });
            const electivas=data.planificaciones.filter(p=>{
                return !mismoId(p.seccionId,seccionId)&&(data.vinculosElectivos||[]).some(v=>mismoId(v.seccionDestinoId,seccionId)&&mismoId(v.asignaturaId,p.asignaturaId)&&mismoId(v.seccionOrigenId,p.seccionId));
            }).map(p=>Object.assign({},p,{vinculado:true,electivaObjetivo:true,seccionVistaId:seccionId,seccionOrigenId:p.seccionId}));
            const vistos=new Set();
            return [...propios,...heredados,...electivas].filter(p=>{
                const key=[p.dia,p.bloque,p.asignaturaId,p.seccionId,p.componenteId||''].join('|');
                if(vistos.has(key)) return false;
                vistos.add(key);
                return true;
            });
        }

        function actualizarEstadoVacioPlanificador(seccionId,totalVisible=0){
            const data=getData();
            const estado=document.getElementById('planEmptyState');
            const contenedor=document.getElementById('scheduleContainer');
            if(!estado||!contenedor) return;
            const mostrar=!data.modoPlan&&(!seccionId||totalVisible===0);
            estado.classList.toggle('visible',mostrar);
            contenedor.classList.toggle('has-empty-state',mostrar);
            if(!mostrar) return;
            const sinSeccion=!seccionId;
            document.getElementById('planEmptyTitle').textContent=sinSeccion?'Selecciona una sección':'Aún no hay planificación';
            document.getElementById('planEmptyText').textContent=sinSeccion
                ? 'Usa los filtros superiores para visualizar o comenzar una planificación.'
                : 'La sección está lista. Activa el modo planificación para comenzar a asignar bloques.';
            const btn=document.getElementById('btnPlanEmptyAction');
            btn.textContent=sinSeccion?'Elegir sección':'Comenzar a planificar';
            btn.dataset.action=sinSeccion?'seleccionar':'planificar';
        }

        function construirGrilla() {
            const data = getData();
            const grid=document.getElementById('scheduleGrid'); grid.innerHTML='';
            grid.appendChild(ctx.createHeader());
            const secId=data.sel.seccionId;
            const seccionActual=idTexto(secId);
            const cambioSeccion=ultimaSeccionRenderizada!==undefined&&seccionActual!==ultimaSeccionRenderizada;
            ultimaSeccionRenderizada=seccionActual;
            let totalVisible=0;
            ctx.BLOQUES.forEach(b=>{
                grid.appendChild(ctx.createTimeCell(b));
                ctx.DIAS.forEach((d,di)=>{
                    const cell=document.createElement('div'); cell.className='grid-cell'; cell.dataset.dia=di; cell.dataset.bloque=b.n;
                    const visible=secId?planVisibleEn(secId,di,b.n):null;
                    if(visible?.plan){
                        totalVisible++;
                        aplicarEstadoCelda(cell,visible.plan,visible);
                        aplicarOcupacionDocenteCelda(cell,di,b.n,visible.plan);
                        aplicarOcupacionSalaCelda(cell,di,b.n,visible.plan);
                    }
                    else if(data.modoPlan && secId && data.sel.docenteId) actualizarDisponibilidadCelda(cell,di,b.n);
                    grid.appendChild(cell);
                });
            });
            actualizarEstadoVacioPlanificador(secId,totalVisible);
            pintarSeleccionBloques();
            if(cambioSeccion&&!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches){
                const superficies=['planProgreso','planMensajes','planComparador','scheduleContainer','planGridLegend']
                    .map(id=>document.getElementById(id)).filter(Boolean);
                window.clearTimeout(animacionCambioSeccionTimer);
                superficies.forEach(el=>el.classList.remove('plan-section-surface-change'));
                void document.getElementById('scheduleContainer')?.offsetWidth;
                superficies.forEach(el=>el.classList.add('plan-section-surface-change'));
                animacionCambioSeccionTimer=window.setTimeout(()=>{
                    superficies.forEach(el=>el.classList.remove('plan-section-surface-change'));
                },260);
            }
            if(comparadorActivo) renderComparadorPlanificacion();
        }

        function agregarSeccionComparador(seccionId=null){
            const data=getData();
            comparadorActivo=true;
            const id=idTexto(seccionId||data.sel?.seccionId);
            if(!id){ renderComparadorPlanificacion(); return ctx.toast('Selecciona una sección en cualquier espacio comparativo','info'); }
            if(!data.secciones.some(s=>mismoId(s.id,id))) return ctx.toast('La sección seleccionada no existe','error');
            if(comparadorSlots.some(slot=>mismoId(slot?.seccionId,id))) return ctx.toast('Esa sección ya está en la vista comparativa','info');
            const libre=Array.from({length:comparadorCapacidad},(_,i)=>i).find(i=>!comparadorSlots[i]?.seccionId);
            if(libre===undefined) return ctx.toast(`La vista comparativa actual permite ${comparadorCapacidad} secciones`,'info');
            comparadorSlots[libre]=filtrosDesdeSeccion(id);
            renderComparadorPlanificacion();
        }

        function quitarSlotComparador(index){
            if(!Number.isFinite(index)||index<0) return;
            comparadorSlots[index]=crearSlotComparador();
            renderComparadorPlanificacion();
        }

        function limpiarComparadorPlanificacion(){
            comparadorSlots.splice(0,comparadorSlots.length);
            renderComparadorPlanificacion();
        }

        function columnasComparador(){
            if(comparadorCapacidad===1) return 1;
            if(comparadorCapacidad===2) return 2;
            if(comparadorCapacidad===4) return 2;
            return 3;
        }

        function actualizarBotonComparador(){
            const btn=document.getElementById('btnCompararSeccion');
            if(!btn) return;
            btn.classList.toggle('active',comparadorActivo);
            btn.textContent=comparadorActivo?'Cerrar comparación':'▦ Comparar sección';
            btn.setAttribute('aria-pressed',comparadorActivo?'true':'false');
        }

        function alternarComparadorPlanificacion(){
            if(comparadorActivo){
                comparadorActivo=false;
                comparadorSlots.splice(0,comparadorSlots.length);
                renderComparadorPlanificacion();
                return;
            }
            comparadorActivo=true;
            comparadorSlots.splice(0,comparadorSlots.length);
            renderComparadorPlanificacion();
        }

        function crearSlotComparador(){
            return {area:'',carreraId:'',nivelId:'',jornada:'',seccionId:''};
        }

        function filtrosDesdeSeccion(seccionId){
            const {sec,nivel,carrera}=contextoSeccionPorId(seccionId);
            return {
                area:areaCarrera(carrera),
                carreraId:carrera?idTexto(carrera.id):'',
                nivelId:nivel?idTexto(nivel.id):'',
                jornada:sec?jornadaSeccion(sec):'',
                seccionId:sec?idTexto(sec.id):''
            };
        }

        function filtrosComparador(index){
            return Object.assign(crearSlotComparador(),comparadorSlots[index]||{});
        }

        function actualizarFiltroComparador(index,campo,valor){
            if(!Number.isFinite(index)||index<0) return;
            const f=filtrosComparador(index);
            f[campo]=valor||'';
            if(campo==='area'){f.carreraId='';f.nivelId='';f.jornada='';f.seccionId='';}
            if(campo==='carreraId'){f.nivelId='';f.jornada='';f.seccionId='';}
            if(campo==='nivelId'){f.jornada='';f.seccionId='';}
            if(campo==='jornada') f.seccionId='';
            if(campo==='seccionId'&&valor){
                const real=filtrosDesdeSeccion(valor);
                comparadorSlots[index]=real.seccionId?real:Object.assign({},f,{seccionId:idTexto(valor)});
            }else{
                comparadorSlots[index]=f;
            }
            renderComparadorPlanificacion();
        }

        function enfocarCeldaPlanificacion(dia,bloque){
            if(!Number.isFinite(Number(dia))||!Number.isFinite(Number(bloque))) return;
            requestAnimationFrame(()=>{
                const cell=document.querySelector(`#scheduleGrid .grid-cell[data-dia="${Number(dia)}"][data-bloque="${Number(bloque)}"]`);
                if(!cell) return;
                cell.classList.add('compare-jump-focus');
                cell.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});
                setTimeout(()=>cell.classList.remove('compare-jump-focus'),2600);
            });
        }

        function abrirSeccionComparador(seccionId, opciones={}){
            const data=getData();
            const index=Number(opciones.index);
            const slot=Number.isFinite(index)?filtrosComparador(index):crearSlotComparador();
            let targetId=idSeccionReal(slot.seccionId||seccionId);
            let planObjetivo=null;
            if(!targetId) return ctx.toast('No se pudo abrir la sección seleccionada','error');
            if(opciones.dia!==undefined&&opciones.bloque!==undefined){
                const visible=planesVisiblesComparador(targetId).find(p=>Number(p.dia)===Number(opciones.dia)&&Number(p.bloque)===Number(opciones.bloque));
                if(visible){
                    planObjetivo=visible;
                    if(visible.vinculado) targetId=visible.seccionOrigenId||visible.seccionId;
                }
            }
            const {sec,nivel,carrera}=contextoSeccionPorId(targetId);
            if(!sec||!nivel||!carrera) return ctx.toast('No se pudo abrir la sección seleccionada','error');
            ctx.activarTab?.('planificacion');
            cerrarPopupAccion();
            data.sel.area=areaCarrera(carrera);
            data.sel.carreraId=carrera.id;
            data.sel.nivelId=nivel.id;
            data.sel.jornada=jornadaSeccion(sec);
            data.sel.seccionId=sec.id;
            if(planObjetivo&&mismoId(planObjetivo.seccionId,sec.id)){
                data.sel.asignaturaId=planObjetivo.asignaturaId||null;
                data.sel.componenteId=planObjetivo.componenteId||null;
                data.sel.docenteId=planObjetivo.docenteId||null;
                data.sel.salaId=planObjetivo.salaId||null;
                data.sel.tipo=planObjetivo.tipoPresencial===false?'virtual':'presencial';
            }else{
                data.sel.asignaturaId=null;
                data.sel.componenteId=null;
                data.sel.docenteId=null;
                data.sel.salaId=null;
                data.sel.tipo='presencial';
            }
            actualizarSelectoresPlan();
            construirGrilla();
            actualizarProgresoPlan();
            document.getElementById('scheduleContainer')?.scrollIntoView({behavior:'smooth',block:'start'});
            enfocarCeldaPlanificacion(opciones.dia,opciones.bloque);
            ctx.toast(planObjetivo?'Bloque abierto en la grilla principal':'Sección abierta en la grilla principal','info');
        }

        function renderComparadorPlanificacion(){
            const panel=document.getElementById('planComparador');
            if(!panel) return;
            actualizarBotonComparador();
            const reducirMovimiento=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
            if(!comparadorActivo){
                window.clearTimeout(comparadorAnimacionTimer);
                panel.classList.remove('opening');
                if(panel.style.display==='none') return;
                if(reducirMovimiento){ panel.style.display='none'; panel.style.maxHeight=''; panel.classList.remove('closing'); return; }
                panel.style.maxHeight=`${panel.scrollHeight}px`;
                void panel.offsetHeight;
                panel.classList.add('closing');
                panel.style.maxHeight='0px';
                comparadorAnimacionTimer=window.setTimeout(()=>{
                    if(comparadorActivo) return;
                    panel.style.display='none';
                    panel.style.maxHeight='';
                    panel.classList.remove('closing');
                },270);
                return;
            }
            window.clearTimeout(comparadorAnimacionTimer);
            const estabaOculto=panel.style.display==='none'||!panel.innerHTML.trim();
            panel.classList.remove('closing');
            panel.style.display='block';
            if(estabaOculto&&!reducirMovimiento){
                panel.classList.add('opening');
                panel.style.maxHeight='0px';
            }
            const slots=Array.from({length:comparadorCapacidad},(_,i)=>filtrosComparador(i));
            const seleccionadas=slots.filter(slot=>slot.seccionId).length;
            panel.innerHTML=`
                <div class="plan-compare-head">
                    <div>
                        <strong>Vista comparativa</strong>
                        <span data-compare-summary>${seleccionadas} de ${comparadorCapacidad} secciones</span>
                    </div>
                    <div class="plan-compare-toolbar">
                        <label>Grillas
                            <select class="form-select" data-compare-capacity>
                                ${[1,2,4,6].map(n=>ctx.optionHTML(String(n),String(n),comparadorCapacidad===n)).join('')}
                            </select>
                        </label>
                        <button class="btn btn-xs" type="button" data-compare-clear>Limpiar vista</button>
                    </div>
                </div>
                <div class="plan-compare-grid" style="--compare-columns:${columnasComparador()};">
                    ${slots.map((slot,i)=>slot.seccionId?renderTarjetaComparador(slot,i):renderSlotComparadorVacio(i)).join('')}
                </div>
            `;
            if(estabaOculto&&!reducirMovimiento){
                panel.classList.remove('opening');
                panel.style.maxHeight='none';
                const altura=panel.scrollHeight;
                panel.classList.add('opening');
                panel.style.maxHeight='0px';
                void panel.offsetHeight;
                window.requestAnimationFrame(()=>{
                    if(!comparadorActivo) return;
                    panel.classList.remove('opening');
                    panel.style.maxHeight=`${altura}px`;
                });
                comparadorAnimacionTimer=window.setTimeout(()=>{
                    if(!comparadorActivo) return;
                    panel.style.maxHeight='none';
                    panel.classList.remove('opening');
                },260);
            }else{
                panel.style.maxHeight='none';
            }
            panel.querySelector('[data-compare-capacity]')?.addEventListener('change',e=>{
                const solicitada=parseInt(e.target.value)||2;
                comparadorCapacidad=[1,2,4,6].includes(solicitada)?solicitada:2;
                comparadorSlots.splice(0,comparadorSlots.length);
                renderComparadorPlanificacion();
            });
            sincronizarValoresSelectoresComparador(panel);
            if(!panel.dataset.compareDelegated){
                panel.dataset.compareDelegated='1';
                panel.addEventListener('click',e=>{
                    const clear=e.target.closest('[data-compare-clear]');
                    if(clear) return limpiarComparadorPlanificacion();
                    const open=e.target.closest('[data-compare-open]');
                    if(open) return abrirSeccionComparador(open.dataset.compareOpen,{index:open.dataset.compareIndex});
                    const remove=e.target.closest('[data-compare-remove]');
                    if(remove) return quitarSlotComparador(Number(remove.dataset.compareIndex));
                });
                panel.addEventListener('change',e=>{
                    const sel=e.target.closest('[data-compare-filter]');
                    if(!sel) return;
                    actualizarFiltroComparador(Number(sel.dataset.compareIndex),sel.dataset.compareFilter,sel.value);
                });
            }
        }

        function sincronizarValoresSelectoresComparador(panel){
            panel.querySelectorAll('[data-compare-filter]').forEach(sel=>{
                const index=Number(sel.dataset.compareIndex);
                const campo=sel.dataset.compareFilter;
                const f=filtrosComparador(index);
                const valor=String(f[campo]??'');
                if([...sel.options].some(o=>String(o.value)===valor)) sel.value=valor;
            });
        }

        function opcionesSlotComparador(index){
            const data=getData(), f=filtrosComparador(index);
            const areas=areasCarrera();
            const carreras=data.carreras.filter(c=>!f.area||areaCarrera(c)===f.area).sort((a,b)=>String(a.nombre||'').localeCompare(String(b.nombre||''),undefined,{numeric:true,sensitivity:'base'}));
            const carreraIdsPermitidos=new Set(carreras.map(c=>String(c.id??'')));
            const niveles=data.niveles.filter(n=>{
                if(f.carreraId) return mismoId(n.carreraId,f.carreraId);
                if(f.area) return carreraIdsPermitidos.has(String(n.carreraId??''));
                return true;
            }).sort(ordenarNivelesDesc);
            const nivelIds=new Set(niveles.map(n=>String(n.id??'')));
            const seccionesBase=data.secciones.filter(s=>{
                if(f.nivelId) return mismoId(s.nivelId,f.nivelId);
                if(f.carreraId||f.area) return nivelIds.has(String(s.nivelId??''));
                return true;
            });
            const jornadas=[...new Set(seccionesBase.map(jornadaSeccion))].sort((a,b)=>a==='diurna'?-1:b==='diurna'?1:0);
            const secciones=seccionesBase.filter(s=>!f.jornada||jornadaSeccion(s)===f.jornada).sort(ordenarSeccionesNombre);
            return {f,areas,carreras,niveles,jornadas,secciones};
        }

        function renderSelectoresSlotComparador(index){
            const {f,areas,carreras,niveles,jornadas,secciones}=opcionesSlotComparador(index);
            const attrs=campo=>`data-compare-filter="${campo}" data-compare-index="${index}"`;
            return `<div class="plan-compare-selectors">
                <select class="form-select" ${attrs('area')}><option value="">Área</option>${areas.map(a=>ctx.optionHTML(a,a,f.area===a)).join('')}</select>
                <select class="form-select" ${attrs('carreraId')}><option value="">Carrera</option>${carreras.map(c=>ctx.optionHTML(c.id,c.nombre||c.codigo||'Carrera',mismoId(f.carreraId,c.id))).join('')}</select>
                <select class="form-select" ${attrs('nivelId')}><option value="">Nivel</option>${niveles.map(n=>ctx.optionHTML(n.id,n.nombre,mismoId(f.nivelId,n.id))).join('')}</select>
                <select class="form-select" ${attrs('jornada')}><option value="">Jornada</option>${jornadas.map(j=>ctx.optionHTML(j,etiquetaJornada(j),f.jornada===j)).join('')}</select>
                <select class="form-select" ${attrs('seccionId')}><option value="">Sección</option>${secciones.map(s=>ctx.optionHTML(s.id,s.nombre,mismoId(f.seccionId,s.id))).join('')}</select>
            </div>`;
        }

        function renderSlotComparadorVacio(index){
            return `<article class="plan-compare-card plan-compare-card-empty" data-compare-index="${index}">
                <div class="plan-compare-card-head"><div><strong>Espacio ${index+1}</strong><span>Selecciona una sección para comparar</span></div></div>
                ${renderSelectoresSlotComparador(index)}
            </article>`;
        }

        function renderMiniGrillaComparador(seccionId){
            const data=getData();
            const planesComparador=Array.isArray(data.planificaciones)?data.planificaciones:[];
            let total=0, heredados=0;
            const filas=ctx.BLOQUES.map(b=>{
                const celdas=ctx.DIAS.map((dia,di)=>{
                    const visible=planVisibleEnFuente(seccionId,di,b.n,planesComparador);
                    if(!visible?.plan) return '<div class="vista-general-cell"></div>';
                    total++;
                    if(visible.vinculado) heredados++;
                    const plan=visible.plan;
                    const asig=data.asignaturas.find(a=>mismoId(a.id,plan.asignaturaId));
                    const doc=data.docentes.find(d=>mismoId(d.id,plan.docenteId));
                    const sala=data.salas.find(s=>mismoId(s.id,plan.salaId));
                    const color=ctx.colorAsignaturaPlanhor?.(asig)||asig?.color||'var(--planhor-subject-neutral)';
                    const docenteCorto=doc
                        ? (mismoId(doc.id,ctx.DOCENTE_NN_ID)?'Docente NN':`${String(doc.nombre||'').charAt(0)}. ${doc.apellido||''}`.trim())
                        : 'Sin docente';
                    const detalle=[
                        `${dia} B${b.n}`,
                        [asig?.codigo,asig?.nombre].filter(Boolean).join(' - '),
                        `Docente: ${docenteNombre(doc)}`,
                        `Sala: ${sala?.nombre||'Sin sala'}`,
                        visible.vinculado?`Heredada desde ${nombreSeccion(plan.seccionId)}`:''
                    ].filter(Boolean).join(' · ');
                    return `<div class="vista-general-cell filled ${visible.vinculado?'linked':''}" style="background:${ctx.escapeAttr(color)}" title="${ctx.escapeAttr(detalle)}">
                        <span>${ctx.escapeHTML(asig?.codigo||'?')}</span>
                        <span>${ctx.escapeHTML(docenteCorto)}</span>
                        <span>${ctx.escapeHTML(sala?.nombre||'Sin sala')}</span>
                    </div>`;
                }).join('');
                return `<div class="vista-general-time">B${b.n}</div>${celdas}`;
            }).join('');
            return {
                total,
                heredados,
                html:`<div class="vista-general-mini">
                    <div class="vista-general-corner">B</div>
                    ${ctx.DIAS.map(d=>`<div class="vista-general-day">${ctx.escapeHTML(d.slice(0,3))}</div>`).join('')}
                    ${filas}
                </div>`
            };
        }

        function renderTarjetaComparador(slot,index){
            const seccionId=slot.seccionId;
            const {sec,nivel,carrera}=contextoSeccionPorId(seccionId);
            const seccionCanonica=sec?idTexto(sec.id):idTexto(seccionId);
            const titulo=sec?.nombre||nombreSeccion(seccionId);
            const subtitulo=[carrera?.nombre,nivel?.nombre,sec?etiquetaJornada(jornadaSeccion(sec)):null].filter(Boolean).join(' · ');
            const mini=renderMiniGrillaComparador(seccionCanonica);
            return `<article class="plan-compare-card" data-section="${ctx.escapeAttr(seccionCanonica)}" data-compare-index="${index}">
                <div class="plan-compare-card-head">
                    <div><strong>${ctx.escapeHTML(titulo)}</strong><span>${ctx.escapeHTML(subtitulo)}</span></div>
                    <div class="plan-compare-actions">
                        <button class="btn btn-xs" type="button" data-compare-open="${ctx.escapeAttr(seccionCanonica)}" data-compare-index="${index}">Editar</button>
                        <button class="btn btn-xs" type="button" data-compare-remove data-compare-index="${index}">Quitar</button>
                    </div>
                </div>
                <div class="plan-compare-meta">${mini.total} bloque(s)${mini.heredados?` · ${mini.heredados} heredado(s)`:''}</div>
                ${renderSelectoresSlotComparador(index)}
                <div class="plan-compare-body">${mini.html}</div>
            </article>`;
        }

        function aplicarEstadoCelda(cell,plan,meta={}){
            const data = getData();
            cell.classList.add('planned');
            if(meta.vinculado) cell.classList.add('linked-plan');
            if(plan.fijo) cell.classList.add('fixed-plan');
            const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
            const sala=data.salas.find(s=>s.id===plan.salaId);
            const doc=data.docentes.find(d=>d.id===plan.docenteId);
            cell.style.backgroundColor=ctx.colorAsignaturaPlanhor?.(asig)||asig?.color||'var(--planhor-subject-neutral)';
            cell.innerHTML='';
            const codigo=document.createElement('span');
            codigo.textContent=(meta.electivaObjetivo?'◇ ':meta.vinculado?'🔗 ':plan.fijo?'🔒 ':'')+(asig?.codigo||'?');
            const salaEl=document.createElement('small');
            salaEl.textContent=sala?.nombre||'?';
            const docenteEl=document.createElement('small');
            docenteEl.textContent=doc?(doc.id===ctx.DOCENTE_NN_ID?'Docente NN':doc.nombre.charAt(0)+'. '+doc.apellido):'?';
            cell.append(codigo);
            const compNombre=nombreComponentePlan(plan);
            if(compNombre){
                const comp=componentesAsignaturaSeccion(plan.asignaturaId,plan.seccionId).find(c=>c.id===plan.componenteId);
                const compEl=document.createElement('small');
                compEl.className='plan-component-label';
                compEl.textContent=`${compNombre}${Number(comp?.alumnos)?` · ${Number(comp.alumnos)} al.`:''}`;
                cell.appendChild(compEl);
            }
            cell.append(salaEl,docenteEl);
            if(meta.electivaObjetivo){
                const origen=document.createElement('small');
                origen.className='linked-plan-source';
                origen.textContent=meta.alternativas>1?`Ventana electiva · ${meta.alternativas} opciones`:'Electiva vinculada';
                cell.appendChild(origen);
            }else if(meta.vinculado){
                const origen=document.createElement('small');
                origen.className='linked-plan-source';
                origen.textContent='Madre: '+nombreSeccion(plan.seccionId);
                cell.appendChild(origen);
            }
            const explicacion=textoExplicacionAuto(plan.explicacionAuto);
            const aria=[
                [asig?.codigo,asig?.nombre].filter(Boolean).join(' - '),
                sala?.nombre?`Sala ${sala.nombre}`:'',
                doc?(doc.id===ctx.DOCENTE_NN_ID?'Docente NN':`${doc.nombre||''} ${doc.apellido||''}`.trim()):'',
                meta.electivaObjetivo?`Electiva vinculada desde ${nombreSeccion(plan.seccionId)}`:meta.vinculado?`Heredada desde ${nombreSeccion(plan.seccionId)}`:'',
                compNombre?`Componente ${compNombre}`:'',
                explicacion
            ].filter(Boolean).join('. ');
            if(aria) cell.setAttribute('aria-label',aria);
        }

        function docenteNombre(doc){
            if(!doc) return 'Sin docente';
            if(doc.id===ctx.DOCENTE_NN_ID) return 'Docente NN';
            return `${doc.nombre||''} ${doc.apellido||''}`.trim()||'Sin docente';
        }

        function asegurarTooltipPlan(){
            let tooltip=document.getElementById('planBlockTooltip');
            if(!tooltip){
                tooltip=document.createElement('div');
                tooltip.id='planBlockTooltip';
                tooltip.className='plan-block-tooltip';
                document.body.appendChild(tooltip);
            }
            return tooltip;
        }

        function ocultarTooltipPlan(){
            const tooltip=document.getElementById('planBlockTooltip');
            if(tooltip) tooltip.classList.remove('visible');
        }

        function posicionarTooltipPlan(tooltip,e){
            const margen=10;
            const ancho=tooltip.offsetWidth||280;
            const alto=tooltip.offsetHeight||120;
            let left=Number(e?.clientX||0)+14;
            let top=Number(e?.clientY||0)+14;
            if(left+ancho>window.innerWidth-margen) left=Number(e?.clientX||0)-ancho-14;
            if(top+alto>window.innerHeight-margen) top=Number(e?.clientY||0)-alto-14;
            left=Math.max(margen,Math.min(left,window.innerWidth-ancho-margen));
            top=Math.max(margen,Math.min(top,window.innerHeight-alto-margen));
            tooltip.style.left=`${Math.round(left)}px`;
            tooltip.style.top=`${Math.round(top)}px`;
        }

        function mostrarTooltipPlan(cell,e){
            const data=getData();
            if(arrastre.activo || ctx.popupState?._popupAbierto) return ocultarTooltipPlan();
            const secId=data.sel?.seccionId;
            if(!secId || !cell?.classList?.contains('grid-cell')) return ocultarTooltipPlan();
            const dia=Number(cell.dataset.dia);
            const bloque=Number(cell.dataset.bloque);
            const visible=planVisibleEn(secId,dia,bloque);
            const plan=visible?.plan;
            if(!plan) return ocultarTooltipPlan();
            const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
            const sala=data.salas.find(s=>s.id===plan.salaId);
            const doc=data.docentes.find(d=>d.id===plan.docenteId);
            const compNombre=nombreComponentePlan(plan);
            const bloqueInfo=ctx.getBloque(plan.bloque);
            const titulo=[asig?.codigo,asig?.nombre].filter(Boolean).join(' - ')||'Asignatura';
            const subtitulo=[
                `${ctx.DIAS[plan.dia]} B${plan.bloque}${bloqueInfo?` · ${bloqueInfo.inicio}-${bloqueInfo.fin}`:''}`,
                plan.tipoPresencial===false?'Virtual':'Presencial',
                visible.electivaObjetivo?'Ventana electiva':visible.vinculado?'Heredada':'Se dicta aquí'
            ].filter(Boolean).join(' · ');
            const filas=[
                ['Sección', visible.electivaObjetivo?`${nombreSeccion(secId)} · origen ${nombreSeccion(plan.seccionId)}`:visible.vinculado?`${nombreSeccion(secId)} · madre ${nombreSeccion(plan.seccionId)}`:nombreSeccion(plan.seccionId)],
                ['Docente', docenteNombre(doc)],
                ['Sala', sala?.nombre||'Sin sala'],
                compNombre?['Componente', compNombre]:null
            ].filter(Boolean);
            const explicacion=textoExplicacionAuto(plan.explicacionAuto);
            const nota=String(plan.nota||'').trim();
            const tooltip=asegurarTooltipPlan();
            tooltip.innerHTML=`
                <div class="plan-block-tooltip-title">${ctx.escapeHTML(titulo)}</div>
                <div class="plan-block-tooltip-sub">${ctx.escapeHTML(subtitulo)}</div>
                <div class="plan-block-tooltip-grid">
                    ${filas.map(([k,v])=>`<span>${ctx.escapeHTML(k)}</span><strong>${ctx.escapeHTML(v)}</strong>`).join('')}
                </div>
                ${nota?`<div class="plan-block-tooltip-note"><strong>Observación</strong><br>${ctx.escapeHTML(nota)}</div>`:''}
                ${explicacion?`<div class="plan-block-tooltip-note">${ctx.escapeHTML(explicacion)}</div>`:''}
            `;
            tooltip.classList.add('visible');
            posicionarTooltipPlan(tooltip,e);
        }

        function planesDocenteEn(docId,dia,bloque,opciones={}){
            const data=getData();
            if(!docId||docId===ctx.DOCENTE_NN_ID) return [];
            const ignorar=new Set(opciones.ignorarIds||[]);
            return data.planificaciones.filter(p=>p.docenteId===docId&&p.dia===dia&&p.bloque===bloque&&!ignorar.has(p.id));
        }

        function textoPlanesDocente(planes){
            const data=getData();
            return planes.map(p=>{
                const asig=data.asignaturas.find(a=>a.id===p.asignaturaId);
                const sec=data.secciones.find(s=>s.id===p.seccionId);
                return [asig?.codigo||'Asig.',sec?.nombre||''].filter(Boolean).join(' ');
            }).filter(Boolean).join(' · ');
        }

        function planesSalaEn(salaId,dia,bloque,opciones={}){
            const data=getData();
            if(!salaId||salaId===ctx.SALA_VIRTUAL_ID||salaId===ctx.SALA_TRO2_ID) return [];
            const sala=data.salas.find(s=>s.id===salaId);
            if(!sala||sala.esVirtual||sala.ilimitada) return [];
            const ignorar=new Set(opciones.ignorarIds||[]);
            return data.planificaciones.filter(p=>p.salaId===salaId&&p.dia===dia&&p.bloque===bloque&&!ignorar.has(p.id));
        }

        function textoPlanesSala(planes){
            const data=getData();
            return planes.map(p=>{
                const asig=data.asignaturas.find(a=>a.id===p.asignaturaId);
                const sec=data.secciones.find(s=>s.id===p.seccionId);
                return [asig?.codigo||'Asig.',sec?.nombre||''].filter(Boolean).join(' ');
            }).filter(Boolean).join(' · ');
        }

        function aplicarOcupacionDocenteCelda(cell,dia,bloque,planVisible=null,docenteIdOverride=null){
            const data=getData();
            const docId=docenteIdOverride||data.sel?.docenteId;
            if(!docId||docId===ctx.DOCENTE_NN_ID) return false;
            const ocupados=planesDocenteEn(docId,dia,bloque,{ignorarIds:planVisible?.id?[planVisible.id]:[]});
            if(!ocupados.length) return false;
            const texto=textoPlanesDocente(ocupados);
            cell.classList.add(planVisible?'teacher-busy-overlay':'teacher-busy');
            const marca=document.createElement('small');
            marca.className='teacher-busy-label';
            marca.textContent=texto||'Docente ocupado';
            marca.title=`Docente ocupado: ${texto||'bloque planificado'}`;
            if(planVisible) cell.appendChild(marca);
            else {
                cell.innerHTML='';
                const t=document.createElement('span');
                t.className='teacher-busy-title';
                t.textContent='Docente ocupado';
                cell.append(t,marca);
            }
            return true;
        }

        function aplicarOcupacionSalaCelda(cell,dia,bloque,planVisible=null,salaIdOverride=null){
            const data=getData();
            const salaId=salaIdOverride||data.sel?.salaId;
            if(!salaId||salaId===ctx.SALA_VIRTUAL_ID||salaId===ctx.SALA_TRO2_ID) return false;
            const ocupados=planesSalaEn(salaId,dia,bloque,{ignorarIds:planVisible?.id?[planVisible.id]:[]});
            if(!ocupados.length) return false;
            const texto=textoPlanesSala(ocupados);
            cell.classList.add(planVisible?'room-busy-overlay':'room-busy');
            const marca=document.createElement('small');
            marca.className='room-busy-label';
            marca.textContent=texto||'Sala ocupada';
            marca.title=`Sala ocupada: ${texto||'bloque planificado'}`;
            if(planVisible) {
                cell.appendChild(marca);
            } else {
                if(!cell.classList.contains('teacher-busy')){
                    cell.innerHTML='';
                    const t=document.createElement('span');
                    t.className='room-busy-title';
                    t.textContent='Sala ocupada';
                    cell.appendChild(t);
                }
                cell.appendChild(marca);
            }
            return true;
        }

        function limpiarMarcasDisponibilidadGrilla(){
            document.querySelectorAll('#scheduleGrid .grid-cell').forEach(cell=>{
                cell.classList.remove('available','unavailable-docente','teacher-busy','teacher-busy-overlay','room-busy','room-busy-overlay');
                cell.querySelectorAll('.teacher-busy-label,.teacher-busy-title,.room-busy-label,.room-busy-title').forEach(el=>el.remove());
                if(!cell.classList.contains('planned')&&!cell.classList.contains('linked-plan')){
                    cell.innerHTML='';
                    cell.title='';
                    cell.removeAttribute('aria-label');
                }
            });
        }

        function actualizarDisponibilidadCelda(cell,dia,bloque){
            const data = getData();
            const docenteOcupado=aplicarOcupacionDocenteCelda(cell,dia,bloque);
            const salaOcupada=aplicarOcupacionSalaCelda(cell,dia,bloque);
            if(docenteOcupado||salaOcupada) return;
            const disp=checkDisponibilidad(data.sel.docenteId,dia,bloque,data.sel.seccionId);
            if(!disp.ok) cell.classList.add('unavailable-docente');
            else if(disp.sug) cell.classList.add('available');
        }

        function numeroSeguro(valor){
            if(typeof valor==='number') return Number.isFinite(valor)?valor:0;
            const limpio=String(valor??'').replace(',','.').replace(/[^\d.-]/g,'');
            const n=Number(limpio);
            return Number.isFinite(n)?n:0;
        }

        function bloquesDesdeHoras(horas){
            const h=numeroSeguro(horas);
            return h>0?Math.max(1,Math.round(h/18)):0;
        }

        function bloquesRequeridosAsignatura(asig,tipo){
            if(!asig) return 0;
            const hv=numeroSeguro(asig.horasVirtuales);
            const hpDeclaradas=numeroSeguro(asig.horasPresenciales);
            const ht=numeroSeguro(asig.horasTotales);
            const hp=hpDeclaradas>0?hpDeclaradas:Math.max(0,ht-hv);
            const fallback=tipo==='virtual'?bloquesDesdeHoras(hv):bloquesDesdeHoras(hp);
            const declarado=numeroSeguro(tipo==='virtual'?asig.bloquesVirtuales:asig.bloquesPresenciales);
            if(declarado>0) return Math.round(declarado);
            return fallback;
        }

        function validarSeleccionManual(opciones={}){
            const data=getData();
            const s=data.sel||{};
            const avisar=(msg,tipo='error')=>{
                if(!opciones.silencioso) ctx.toast(msg,tipo);
                return false;
            };
            if(opciones.requiereModo && !data.modoPlan) return avisar('Active Modo Planificación para modificar bloques','info');
            if(!s.seccionId||!s.asignaturaId||!s.docenteId) return avisar('Seleccione sección, asignatura y docente','error');
            if(esAsignaturaVinculada(s.asignaturaId,s.seccionId)){
                return avisar(`Esta asignatura está vinculada desde ${nombreMadreAsignatura(s.asignaturaId,s.seccionId)}. Planifícala en la sección madre.`,'info');
            }
            const comps=componentesAsignaturaSeccion(s.asignaturaId,s.seccionId);
            if(comps.length && (s.tipo||'presencial')==='presencial' && !componenteSeleccionado()){
                return avisar('Seleccione el componente de la asignatura','error');
            }
            if((s.tipo||'presencial')==='presencial' && !s.salaId){
                return avisar('Seleccione una sala para planificar bloques presenciales','error');
            }
            return true;
        }

        function actualizarCelda(dia,bloque){
            const data = getData();
            const indicePlan = ctx.getIndicePlan();
            const grid=document.getElementById('scheduleGrid');
            const cell=grid.querySelector(`.grid-cell[data-dia="${dia}"][data-bloque="${bloque}"]`);
            if(!cell) return;
            cell.classList.remove('planned','linked-plan','fixed-plan','available','unavailable-docente','teacher-busy','teacher-busy-overlay','room-busy','room-busy-overlay'); cell.style.backgroundColor=''; cell.innerHTML=''; cell.title=''; cell.removeAttribute('aria-label');
            const secId=data.sel.seccionId;
            const visible=secId?planVisibleEn(secId,dia,bloque):null;
            if(visible?.plan){
                aplicarEstadoCelda(cell,visible.plan,visible);
                aplicarOcupacionDocenteCelda(cell,dia,bloque,visible.plan);
                aplicarOcupacionSalaCelda(cell,dia,bloque,visible.plan);
            }
            else if(data.modoPlan && secId && data.sel.docenteId) actualizarDisponibilidadCelda(cell,dia,bloque);
            actualizarEstadoVacioPlanificador(secId,grid.querySelectorAll('.grid-cell.planned').length);
            pintarSeleccionBloques();
        }

        function checkDisponibilidad(docId,dia,bloque,secId,opciones={}){
            const data = getData();
            const planes=ctx.getPlanificacionesFiltradas(opciones.ignorarIds||[]);
            const asigId=opciones.asignaturaId||data.sel?.asignaturaId||'';
            const ocupacionSec=asigId
                ? ocupacionSeccionesImpactadas(asigId,secId,dia,bloque,Object.assign({},opciones,{planes}))
                : {ocupada:secId&&seccionOcupadaVisible(secId,dia,bloque,Object.assign({},opciones,{planes})),seccionId:secId};
            const doc=data.docentes.find(d=>d.id===docId); if(!doc) return {ok:false};
            if(dia===5 && bloque>data.configuracion.sabadoHastaBloque) return {ok:false};
            if(docId===ctx.DOCENTE_NN_ID){
                if(ocupacionSec.ocupada) return {ok:false,msg:`Tope en ${nombreSeccion(ocupacionSec.seccionId)}`};
                return {ok:true,sug:true,nn:true};
            }
            if(!doc.disponibilidad?.[dia]?.[bloque-1]) return {ok:false};
            if(ocupacionSec.ocupada) return {ok:false,msg:`Tope en ${nombreSeccion(ocupacionSec.seccionId)}`};
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

        let arrastre={activo:false,inicioDia:null,inicioBloque:null,estado:false,celdas:[],origenPlan:null,ghost:null,grupoMovimiento:null,esSeleccion:false,appendSeleccion:false};
        const seleccionBloques = new Set();
        let modoMovimiento=null;
        const confirmacionesCapacidadSala = new Set();

        function planesSeleccionados(){
            const data=getData();
            return data.planificaciones.filter(p=>seleccionBloques.has(p.id));
        }

        function limpiarSeleccionBloques(){
            seleccionBloques.clear();
            pintarSeleccionBloques();
        }

        function pintarSeleccionBloques(){
            const grid=document.getElementById('scheduleGrid');
            if(!grid) return;
            grid.querySelectorAll('.grid-cell.block-selected').forEach(c=>c.classList.remove('block-selected'));
            const data=getData();
            const secId=data.sel?.seccionId;
            if(!secId||!seleccionBloques.size) return;
            grid.querySelectorAll('.grid-cell').forEach(cell=>{
                const dia=Number(cell.dataset.dia);
                const bloque=Number(cell.dataset.bloque);
                if(!Number.isFinite(dia)||!Number.isFinite(bloque)) return;
                const visible=planVisibleEn(secId,dia,bloque);
                if(visible?.plan&&!visible.vinculado&&seleccionBloques.has(visible.plan.id)) cell.classList.add('block-selected');
            });
        }

        function seleccionarPlanesDesdeCeldas(celdas, append=false){
            const data=getData();
            const secId=data.sel?.seccionId;
            if(!secId) return 0;
            if(!append) seleccionBloques.clear();
            const prev=seleccionBloques.size;
            celdas.forEach(c=>{
                const visible=planVisibleEn(secId,Number(c.dia),Number(c.bloque));
                if(visible?.plan&&!visible.vinculado&&!visible.plan.fijo) seleccionBloques.add(visible.plan.id);
            });
            pintarSeleccionBloques();
            return Math.max(0,seleccionBloques.size-prev);
        }

        function toggleSeleccionPlan(plan){
            if(!plan||plan.fijo) return;
            if(seleccionBloques.has(plan.id)) seleccionBloques.delete(plan.id);
            else seleccionBloques.add(plan.id);
            pintarSeleccionBloques();
        }

        async function confirmarCambioSeleccion({titulo,mensaje,queHara,afectara,noTocara,confirmarTexto='Aplicar',peligro=true}){
            if(ctx.confirmarAccionCritica){
                return await ctx.confirmarAccionCritica({
                    titulo,
                    mensaje,
                    queHara,
                    afectara,
                    noTocara,
                    seguridad:'Se creará un punto de recuperación antes de aplicar.',
                    confirmarTexto,
                    peligro
                });
            }
            return confirm([mensaje,queHara,afectara,noTocara].filter(Boolean).join('\n'));
        }

        function nombreAsignaturaBreve(asigId){
            const data=getData();
            const asig=data.asignaturas.find(a=>a.id===asigId);
            return asig?[asig.codigo,asig.nombre].filter(Boolean).join(' - '):'Asignatura';
        }

        function alumnosGrupoAsignatura(asigId,seccionId,componenteId=''){
            const comp=componentesAsignaturaSeccion(asigId,seccionId).find(c=>String(c.id)===String(componenteId||''));
            if(comp) return {total:Number(comp.alumnos)||0, base:Number(comp.alumnos)||0, vinculados:0, tieneDatos:(Number(comp.alumnos)||0)>0};
            const estado=estadoDictacionAsignatura(asigId,seccionId);
            const grupo=estado.grupo;
            if(!grupo) return {total:0, base:0, vinculados:0, tieneDatos:false};
            const base=Number(grupo.alumnosBase)||0;
            const vinculados=Number(grupo.alumnosVinculados)||0;
            const total=Number(grupo.alumnosTotales)||base+vinculados;
            return {total, base, vinculados, tieneDatos:total>0};
        }

        function capacidadSalaReal(salaId){
            const data=getData();
            const sala=data.salas.find(s=>s.id===salaId);
            if(!sala || sala.id===ctx.SALA_VIRTUAL_ID || sala.id===ctx.SALA_TRO2_ID || sala.esVirtual || sala.ilimitada) return {sala, aplica:false, capacidad:0};
            return {sala, aplica:true, capacidad:Number(sala.capacidad)||0};
        }

        function evaluarCapacidadSala(asigId,seccionId,salaId,componenteId=''){
            const alumnos=alumnosGrupoAsignatura(asigId,seccionId,componenteId);
            const sala=capacidadSalaReal(salaId);
            const aplica=!!(sala.aplica && sala.capacidad>0 && alumnos.tieneDatos);
            return {
                aplica,
                excede:aplica && alumnos.total>sala.capacidad,
                alumnos:alumnos.total,
                capacidad:sala.capacidad,
                sala:sala.sala
            };
        }

        function confirmarCapacidadSala(asigId,seccionId,salaId,componenteId=null){
            const evalCap=evaluarCapacidadSala(asigId,seccionId,salaId,componenteId!==null?componenteId:(componenteSeleccionado()?.id||''));
            if(!evalCap.excede) return true;
            const key=[asigId,seccionId,salaId,evalCap.alumnos,evalCap.capacidad].join('|');
            if(confirmacionesCapacidadSala.has(key)) return true;
            const msg=[
                'Se supera la cantidad de alumnos permitidos para este espacio.',
                '',
                `Asignatura: ${nombreAsignaturaBreve(asigId)}`,
                `Alumnos de la asignatura: ${evalCap.alumnos}`,
                `Capacidad del espacio: ${evalCap.capacidad}`,
                '',
                '¿Desea asignar el espacio?'
            ].join('\n');
            if(!confirm(msg)) return false;
            confirmacionesCapacidadSala.add(key);
            return true;
        }

        function etiquetaSalaConCapacidad(sala){
            if(!sala) return '';
            if(sala.id===ctx.SALA_TRO2_ID || sala.id===ctx.SALA_VIRTUAL_ID || sala.esVirtual || sala.ilimitada) return sala.nombre;
            const cap=Number(sala.capacidad)||0;
            const tipo=String(sala.tipoSala||sala.tipoEspacio||'').trim();
            const partes=[sala.nombre];
            if(tipo) partes.push(tipo);
            if(cap) partes.push(`cap. ${cap}`);
            return partes.filter(Boolean).join(' · ');
        }

        function notaCapacidadPlan(plan){
            if(!plan || plan.tipoPresencial===false) return '';
            const evalCap=evaluarCapacidadSala(plan.asignaturaId,plan.seccionId,plan.salaId,plan.componenteId||'');
            if(!evalCap.aplica) return '';
            const texto=`${evalCap.alumnos} alumnos / ${evalCap.capacidad} cupos${evalCap.excede?' · supera cupo':''}`;
            return `<div class="action-popup-note"><strong>${evalCap.excede?'Capacidad insuficiente':'Capacidad'}</strong><span>${ctx.escapeHTML(texto)}</span></div>`;
        }

        function asignarBloque(dia,bloque,opciones={}){
            const data = getData();
            const s=data.sel;
            if(!validarSeleccionManual({requiereModo:true})) return false;
            const disp=checkDisponibilidad(s.docenteId,dia,bloque,s.seccionId); if(!disp.ok) return false;
            const asig=data.asignaturas.find(a=>a.id===s.asignaturaId);
            if(asig){
                const tipo=s.tipo==='virtual'?'virtual':'presencial';
                const comp=componenteSeleccionado();
                const componenteId=tipo==='presencial'?comp?.id||'': '';
                const planesTipo=planesVisiblesAsignaturaSeccion(asig.id,s.seccionId).filter(p=>
                    ((tipo==='presencial'&&p.tipoPresencial!==false)||(tipo==='virtual'&&p.tipoPresencial===false)) &&
                    (!componentesAsignaturaSeccion(asig.id,s.seccionId).length || tipo==='virtual' || String(p.componenteId||'')===String(componenteId||''))
                );
                const maxPermitido=horasComponentePlanificacion(asig.id,s.seccionId,componenteId,tipo);
                if(maxPermitido<=0){
                    ctx.toast(tipo==='virtual'?'Esta asignatura no tiene bloques virtuales pendientes':'Este componente no tiene bloques pendientes','info');
                    return false;
                }
                if(planesTipo.length>=maxPermitido){
                    ctx.toast(tipo==='virtual'?'Ya se completaron los bloques virtuales de esta asignatura':'Ya se completaron los bloques de este componente','info');
                    return false;
                }
            }
            const salaPlan=s.tipo==='virtual'?ctx.SALA_VIRTUAL_ID:s.salaId;
            if(!opciones.omitirCapacidad && s.tipo==='presencial' && !confirmarCapacidadSala(s.asignaturaId,s.seccionId,salaPlan)) return false;
            if(!opciones.omitirUndo) ctx.pushUndo();
            const compPlan=s.tipo==='presencial'?componenteSeleccionado():null;
            const plan={id:ctx.genId(),seccionId:s.seccionId,asignaturaId:s.asignaturaId,docenteId:s.docenteId,salaId:salaPlan,dia,bloque,tipoPresencial:s.tipo==='presencial',componenteId:compPlan?.id||''};
            data.planificaciones.push(plan);
            ctx.auditoria?.('bloque_creado',{plan});
            if(!opciones.omitirGuardar){
                ctx.guardar(); ctx.reconstruirIndices(); actualizarCelda(dia,bloque); refrescarDespuesCambioPlanificacion();
            }
            return true;
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

        function editarNotaPlanificacion(plan){
            const data=getData();
            const modal=document.getElementById('modalContainer');
            if(!modal) return;
            const porComponente=!!plan.componenteId;
            const relacionados=data.planificaciones.filter(p=>
                p.seccionId===plan.seccionId &&
                p.asignaturaId===plan.asignaturaId &&
                String(p.componenteId||'')===String(plan.componenteId||'')
            );
            const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
            const sec=data.secciones.find(s=>s.id===plan.seccionId);
            const actual=relacionados.find(p=>String(p.nota||'').trim())?.nota||plan.nota||'';
            modal.innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal">
                    <h3>Observación de planificación</h3>
                    <p style="color:var(--text-secondary);font-size:0.82rem;margin-top:-4px;">
                        ${ctx.escapeHTML([asig?.codigo,asig?.nombre].filter(Boolean).join(' - ')||'Asignatura')} · ${ctx.escapeHTML(sec?.nombre||'Sección')}
                    </p>
                    <div class="form-group">
                        <label class="form-label">Observación</label>
                        <textarea class="form-input" id="planNotaTexto" rows="5" maxlength="500" placeholder="Ej: Coordinar con laboratorio, revisar software, pendiente confirmar docente...">${ctx.escapeHTML(actual)}</textarea>
                    </div>
                    <p style="color:var(--text-secondary);font-size:0.74rem;">
                        Se aplicará a ${relacionados.length} bloque(s) de esta ${porComponente?'subsección/componente':'asignatura'}.
                    </p>
                    <div class="modal-actions">
                        <button class="btn btn-danger" id="btnPlanNotaBorrar">Borrar nota</button>
                        <button class="btn" id="btnPlanNotaCancelar">Cancelar</button>
                        <button class="btn btn-primary" id="btnPlanNotaGuardar">Guardar</button>
                    </div>
                </div></div>`;
            const cerrar=()=>{ modal.innerHTML=''; };
            document.getElementById('btnPlanNotaCancelar').onclick=cerrar;
            document.getElementById('modalOverlay').onclick=(e)=>{ if(e.target===e.currentTarget) cerrar(); };
            const guardar=(valor)=>{
                ctx.pushUndo?.({tipo:'nota_planificacion',resumen:'Editar observación de planificación',afecta:`${relacionados.length} bloque(s)`,critica:false});
                relacionados.forEach(p=>{
                    if(valor) p.nota=valor;
                    else delete p.nota;
                });
                ctx.auditoria?.('nota_planificacion_actualizada',{seccionId:plan.seccionId,asignaturaId:plan.asignaturaId,componenteId:plan.componenteId||'',cantidad:relacionados.length,nota:valor});
                ctx.guardar();
                ctx.reconstruirIndices();
                construirGrilla();
                refrescarDespuesCambioPlanificacion();
                cerrar();
                ctx.toast(valor?'Observación guardada':'Observación eliminada','success');
            };
            document.getElementById('btnPlanNotaGuardar').onclick=()=>guardar((document.getElementById('planNotaTexto')?.value||'').trim().slice(0,500));
            document.getElementById('btnPlanNotaBorrar').onclick=()=>guardar('');
        }

        function posicionarPopupEnPuntero(popup, cell, evento=null){
            const rect=cell.getBoundingClientRect();
            const eventoDentroCelda=Number.isFinite(evento?.clientX)&&Number.isFinite(evento?.clientY)&&
                evento.clientX>=rect.left&&evento.clientX<=rect.right&&evento.clientY>=rect.top&&evento.clientY<=rect.bottom;
            const x=eventoDentroCelda?evento.clientX:rect.right;
            const y=eventoDentroCelda?evento.clientY:rect.top;
            const margen=8;
            const ancho=popup.offsetWidth||240;
            const alto=popup.offsetHeight||220;
            let left=rect.right+margen;
            if(left+ancho>window.innerWidth-margen) left=rect.left-ancho-margen;
            if(left<margen) left=Math.min(Math.max(margen,x-margen),window.innerWidth-ancho-margen);
            let top=y-margen;
            if(top+alto>window.innerHeight-margen) top=window.innerHeight-alto-margen;
            if(top<margen) top=margen;
            popup.style.left=`${Math.round(left)}px`;
            popup.style.top=`${Math.round(top)}px`;
        }

        function mostrarPopupAccion(cell, plan, evento=null){
            const data = getData();
            const popupState = ctx.popupState;
            const secVistaId=data.sel.seccionId;
            const meta=secVistaId?planVisibleEn(secVistaId,Number(cell.dataset.dia),Number(cell.dataset.bloque)):null;
            if(meta?.vinculado) return mostrarPopupVinculado(cell,meta,evento);
            if(data.modoPlan && seleccionBloques.size && plan && seleccionBloques.has(plan.id)) return mostrarPopupSeleccion(cell,evento);
            if (popupState._popupAbierto && popupState._popupCell === cell) { cerrarPopupAccion(); return; }
            cerrarPopupAccion();
            const popup = document.createElement('div'); popup.className = 'action-popup';
            popup.innerHTML = `
                ${plan.explicacionAuto?`<div class="action-popup-note"><strong>Explicación</strong><span>${ctx.escapeHTML(textoExplicacionAuto(plan.explicacionAuto))}</span></div>`:''}
                ${notaCapacidadPlan(plan)}
                ${data.modoPlan?`
                    <button id="popupToggleFijo">${plan.fijo?'🔓 Desbloquear bloque':'🔒 Fijar bloque'}</button>
                    <button id="popupMoverAsignatura">🔄 Mover asignatura</button>
                    <button id="popupCambiarDocente">Cambiar docente</button>
                    <button id="popupCambiarSala">Cambiar sala</button>
                    <button id="popupEditarNota">${plan.nota?'Editar observación':'Agregar observación'}</button>
                    <button id="popupEliminarBloque">Eliminar este bloque</button>
                    <button id="popupEliminarTodos">Eliminar todos</button>
                `:`
                    <div class="action-popup-note"><strong>Solo consulta</strong><span>Activa Modo Planificación para mover, cambiar docente, cambiar sala, fijar o eliminar este bloque.</span></div>
                    <button id="popupPrepararBloque">Seleccionar este bloque</button>
                `}`;
            document.body.appendChild(popup);
            posicionarPopupEnPuntero(popup,cell,evento);
            popupState._popupAbierto = popup; popupState._popupCell = cell;
            requestAnimationFrame(()=>{ if(window._kbInitPopup) window._kbInitPopup(); });
            if(data.modoPlan){
                popup.querySelector('#popupToggleFijo').onclick = () => { alternarBloqueFijo(plan); cerrarPopupAccion(); };
                popup.querySelector('#popupMoverAsignatura').onclick = () => { iniciarModoMovimiento(plan); cerrarPopupAccion(); };
                popup.querySelector('#popupCambiarDocente').onclick = () => { cambiarDocenteAsignatura(plan); cerrarPopupAccion(); };
                popup.querySelector('#popupCambiarSala').onclick = () => { cambiarSalaAsignatura(plan); cerrarPopupAccion(); };
                popup.querySelector('#popupEditarNota').onclick = () => { editarNotaPlanificacion(plan); cerrarPopupAccion(); };
                popup.querySelector('#popupEliminarBloque').onclick = () => { if(confirm('¿Eliminar este bloque?')) eliminarBloque(plan); cerrarPopupAccion(); actualizarSelectoresPlan(); };
                popup.querySelector('#popupEliminarTodos').onclick = () => { const porComponente=!!plan.componenteId; if(confirm(porComponente?'¿Eliminar todos los bloques no fijos de este componente?':'¿Eliminar todos los bloques no fijos de esta asignatura?')){ ctx.pushUndo(); const coincide=p => !p.fijo && p.asignaturaId === plan.asignaturaId && p.seccionId === plan.seccionId && (!porComponente || String(p.componenteId||'')===String(plan.componenteId||'')); const eliminados=data.planificaciones.filter(coincide); data.planificaciones = data.planificaciones.filter(p => !coincide(p)); ctx.auditoria?.('bloques_eliminados_asignatura',{cantidad:eliminados.length,seccionId:plan.seccionId,asignaturaId:plan.asignaturaId,componenteId:plan.componenteId||'',bloques:eliminados,respetaFijos:true}); ctx.guardar(); ctx.reconstruirIndices(); construirGrilla(); actualizarSelectoresPlan(); refrescarDespuesCambioPlanificacion(); } cerrarPopupAccion(); };
            } else {
                popup.querySelector('#popupPrepararBloque').onclick=()=>{
                    data.sel.seccionId=plan.seccionId;
                    const sec=data.secciones.find(s=>s.id===plan.seccionId);
                    if(sec){
                        data.sel.nivelId=sec.nivelId;
                        const nivel=data.niveles.find(n=>n.id===sec.nivelId);
                        data.sel.carreraId=nivel?.carreraId||data.sel.carreraId;
                        const carrera=data.carreras.find(c=>c.id===data.sel.carreraId);
                        data.sel.area=carrera?areaCarrera(carrera):data.sel.area;
                        data.sel.jornada=jornadaSeccion(sec);
                    }
                    data.sel.asignaturaId=plan.asignaturaId;
                    data.sel.docenteId=plan.docenteId;
                    data.sel.componenteId=plan.componenteId||null;
                    data.sel.tipo=plan.tipoPresencial===false?'virtual':'presencial';
                    data.sel.salaId=plan.tipoPresencial===false?ctx.SALA_VIRTUAL_ID:plan.salaId;
                    actualizarSelectoresPlan();
                    construirGrilla();
                    actualizarProgresoPlan();
                    cerrarPopupAccion();
                    ctx.toast('Bloque seleccionado. Activa Modo Planificación para modificarlo.','info');
                };
            }
        }

        function resumenSeleccionBloques(){
            const data=getData();
            const planes=planesSeleccionados();
            const asigs=[...new Set(planes.map(p=>p.asignaturaId))].map(id=>data.asignaturas.find(a=>a.id===id)).filter(Boolean);
            const secciones=[...new Set(planes.map(p=>p.seccionId))].map(nombreSeccion);
            return {
                planes,
                total:planes.length,
                asignaturas:asigs,
                secciones,
                mixta:asigs.length>1||secciones.length>1
            };
        }

        function mostrarPopupSeleccion(cell,evento=null){
            const data=getData();
            const resumen=resumenSeleccionBloques();
            if(!resumen.total) return;
            const popupState=ctx.popupState;
            if (popupState._popupAbierto && popupState._popupCell === cell) { cerrarPopupAccion(); return; }
            cerrarPopupAccion();
            const detalleAsigs=resumen.asignaturas.map(a=>a.codigo||a.nombre).slice(0,4).join(' · ');
            const popup=document.createElement('div');
            popup.className='action-popup selection-action-popup';
            popup.innerHTML=`
                <div class="action-popup-note">
                    <strong>${resumen.total} bloque(s) seleccionados</strong>
                    <span>${ctx.escapeHTML(detalleAsigs||'Selección de bloques')}${resumen.asignaturas.length>4?'...':''}</span>
                </div>
                <button id="popupEliminarSeleccion">Eliminar selección</button>
                <button id="popupCambiarDocenteSeleccion">Cambiar docente selección</button>
                <button id="popupCambiarSalaSeleccion">Cambiar sala selección</button>
                <button id="popupLimpiarSeleccion">Limpiar selección</button>`;
            document.body.appendChild(popup);
            posicionarPopupEnPuntero(popup,cell,evento);
            popupState._popupAbierto=popup;
            popupState._popupCell=cell;
            popup.querySelector('#popupEliminarSeleccion').onclick=async()=>{ cerrarPopupAccion(); await eliminarSeleccionBloques(); };
            popup.querySelector('#popupCambiarDocenteSeleccion').onclick=()=>{ cerrarPopupAccion(); cambiarDocenteSeleccion(); };
            popup.querySelector('#popupCambiarSalaSeleccion').onclick=()=>{ cerrarPopupAccion(); cambiarSalaSeleccion(); };
            popup.querySelector('#popupLimpiarSeleccion').onclick=()=>{ cerrarPopupAccion(); limpiarSeleccionBloques(); };
        }

        async function eliminarSeleccionBloques(){
            const data=getData();
            const resumen=resumenSeleccionBloques();
            const planes=resumen.planes.filter(p=>!p.fijo);
            if(!planes.length) return ctx.toast('No hay bloques eliminables en la selección','info');
            const ok=await confirmarCambioSeleccion({
                titulo:'Eliminar selección',
                mensaje:'Se eliminarán los bloques seleccionados.',
                queHara:`Eliminará ${planes.length} bloque(s) no fijo(s).`,
                afectara:resumen.mixta?'Más de una asignatura o sección seleccionada.':'Asignatura y sección seleccionadas.',
                noTocara:'No eliminará asignaturas, docentes, salas ni bloques fijos.',
                confirmarTexto:'Eliminar selección',
                peligro:true
            });
            if(!ok) return;
            ctx.pushUndo?.({tipo:'eliminar_seleccion',resumen:'Eliminar selección de bloques',afecta:`${planes.length} bloque(s)`,critica:true});
            const ids=new Set(planes.map(p=>p.id));
            data.planificaciones=data.planificaciones.filter(p=>!ids.has(p.id));
            seleccionBloques.clear();
            ctx.auditoria?.('bloques_eliminados_seleccion',{cantidad:planes.length,bloques:planes});
            ctx.guardar(); ctx.reconstruirIndices(); construirGrilla(); actualizarSelectoresPlan(); refrescarDespuesCambioPlanificacion();
            ctx.toast(`${planes.length} bloque(s) eliminado(s)`,'info');
        }

        function cambiarDocenteSeleccion(){
            const data=getData();
            const resumen=resumenSeleccionBloques();
            const planes=resumen.planes.filter(p=>!p.fijo);
            if(!planes.length) return ctx.toast('No hay bloques modificables en la selección','info');
            const asignaturasIds=[...new Set(planes.map(p=>p.asignaturaId))];
            const docentes=data.docentes.filter(d=>d.id===ctx.DOCENTE_NN_ID||asignaturasIds.every(id=>d.asignaturasQueDicta?.includes(id)));
            if(!docentes.length) return ctx.toast('No hay docentes compatibles con toda la selección','error');
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <div class="modal-header">
                    <h3>Cambiar docente selección</h3>
                    <p>${planes.length} bloque(s) seleccionado(s)${resumen.mixta?' · selección mixta':''}</p>
                </div>
                <div class="form-group"><label class="form-label">Nuevo docente</label><select class="form-select" id="nuevoDocenteSeleccion">${docentes.map(d=>ctx.optionHTML(d.id,d.id===ctx.DOCENTE_NN_ID?'Docente NN (pendiente)':`${d.nombre||''} ${d.apellido||''}`.trim())).join('')}</select></div>
                <div class="modal-actions"><button class="btn" id="btnCancelarDocenteSel">Cancelar</button><button class="btn btn-primary" id="btnAplicarDocenteSel">Aplicar</button></div>
            </div></div>`;
            document.getElementById('btnCancelarDocenteSel').onclick=()=>ctx.cerrarModal();
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget)ctx.cerrarModal();};
            document.getElementById('btnAplicarDocenteSel').onclick=async()=>{
                const nuevoDocenteId=document.getElementById('nuevoDocenteSeleccion').value;
                const idsCambiar=planes.map(p=>p.id);
                const restantes=ctx.getPlanificacionesFiltradas(idsCambiar);
                for(const p of planes){
                    const disp=checkDisponibilidadDocente(nuevoDocenteId,p.dia,p.bloque,{ignorarIds:idsCambiar});
                    if(!disp.ok) return ctx.toast(`Error: ${disp.msg}`,'error');
                }
                const ok=await confirmarCambioSeleccion({
                    titulo:'Cambiar docente selección',
                    mensaje:'Se cambiará el docente solo en los bloques seleccionados.',
                    queHara:`Asignará el docente a ${planes.length} bloque(s).`,
                    afectara:resumen.mixta?'Más de una asignatura o sección seleccionada.':'Bloques seleccionados de la asignatura actual.',
                    noTocara:'No cambiará otros bloques de la asignatura.',
                    confirmarTexto:'Cambiar docente',
                    peligro:resumen.mixta
                });
                if(!ok) return;
                ctx.pushUndo?.({tipo:'cambiar_docente_seleccion',resumen:'Cambiar docente selección',afecta:`${planes.length} bloque(s)`,critica:resumen.mixta});
                planes.forEach(p=>{
                    if(p.explicacionAuto||p.docenteId===ctx.DOCENTE_NN_ID||nuevoDocenteId!==p.docenteId){
                        registrarMemoriaPlanificacion('docente_corregido',Object.assign(contextoMemoriaDesdePlan(p),{
                            docenteAnteriorId:p.docenteId,
                            docenteNuevoId:nuevoDocenteId,
                            desdeDocenteNN:p.docenteId===ctx.DOCENTE_NN_ID
                        }));
                    }
                    p.docenteId=nuevoDocenteId;
                });
                ctx.guardar(); ctx.reconstruirIndices(); construirGrilla(); actualizarSelectoresPlan(); refrescarDespuesCambioPlanificacion(); ctx.cerrarModal();
                ctx.toast('Docente actualizado en la selección','success');
            };
        }

        function cambiarSalaSeleccion(){
            const data=getData();
            const resumen=resumenSeleccionBloques();
            const planes=resumen.planes.filter(p=>!p.fijo&&p.tipoPresencial!==false);
            if(!planes.length) return ctx.toast('La selección no contiene bloques presenciales modificables','info');
            const salas=data.salas.filter(s=>!s.esVirtual);
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <div class="modal-header">
                    <h3>Cambiar sala selección</h3>
                    <p>${planes.length} bloque(s) presencial(es) seleccionado(s)${resumen.mixta?' · selección mixta':''}</p>
                </div>
                <div class="form-group"><label class="form-label">Nueva sala</label><select class="form-select" id="nuevaSalaSeleccion">${salas.map(s=>ctx.optionHTML(s.id,etiquetaSalaConCapacidad(s))).join('')}</select></div>
                <div class="modal-actions"><button class="btn" id="btnCancelarSalaSel">Cancelar</button><button class="btn btn-primary" id="btnAplicarSalaSel">Aplicar</button></div>
            </div></div>`;
            document.getElementById('btnCancelarSalaSel').onclick=()=>ctx.cerrarModal();
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget)ctx.cerrarModal();};
            document.getElementById('btnAplicarSalaSel').onclick=async()=>{
                const nuevaSalaId=document.getElementById('nuevaSalaSeleccion').value;
                const ids=new Set(planes.map(p=>p.id));
                for(const p of planes){
                    const ocupada=data.planificaciones.some(x=>!ids.has(x.id)&&x.salaId===nuevaSalaId&&x.dia===p.dia&&x.bloque===p.bloque);
                    if(ocupada) return ctx.toast(`Error: la sala está ocupada en ${ctx.DIAS[p.dia]} B${p.bloque}`,'error');
                }
                for(const p of planes){
                    if(!confirmarCapacidadSala(p.asignaturaId,p.seccionId,nuevaSalaId,p.componenteId||'')) return;
                }
                const ok=await confirmarCambioSeleccion({
                    titulo:'Cambiar sala selección',
                    mensaje:'Se cambiará la sala solo en los bloques seleccionados.',
                    queHara:`Asignará la nueva sala a ${planes.length} bloque(s) presencial(es).`,
                    afectara:resumen.mixta?'Más de una asignatura o sección seleccionada.':'Bloques presenciales seleccionados.',
                    noTocara:'No cambiará bloques virtuales ni otros bloques de la asignatura.',
                    confirmarTexto:'Cambiar sala',
                    peligro:resumen.mixta
                });
                if(!ok) return;
                ctx.pushUndo?.({tipo:'cambiar_sala_seleccion',resumen:'Cambiar sala selección',afecta:`${planes.length} bloque(s)`,critica:resumen.mixta});
                planes.forEach(p=>{
                    registrarMemoriaPlanificacion('sala_corregida',Object.assign(contextoMemoriaDesdePlan(p),{
                        salaAnteriorId:p.salaId,
                        salaNuevaId:nuevaSalaId,
                        desdeTRO2:p.salaId===ctx.SALA_TRO2_ID
                    }));
                    p.salaId=nuevaSalaId;
                });
                ctx.guardar(); ctx.reconstruirIndices(); construirGrilla(); actualizarSelectoresPlan(); refrescarDespuesCambioPlanificacion(); ctx.cerrarModal();
                ctx.toast('Sala actualizada en la selección','success');
            };
        }

        function mostrarPopupVinculado(cell,meta,evento=null){
            const data=getData();
            const popupState=ctx.popupState;
            if (popupState._popupAbierto && popupState._popupCell === cell) { cerrarPopupAccion(); return; }
            cerrarPopupAccion();
            const plan=meta.plan;
            const grupo=meta.grupo;
            const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
            const esElectiva=!!meta.electivaObjetivo;
            const vinculadas=(grupo?.seccionesVinculadasIds||[]).map(nombreSeccion).join(', ')||'Sin secciones vinculadas';
            const popup=document.createElement('div');
            popup.className='action-popup';
            popup.innerHTML=`
                <div class="action-popup-note">
                    <strong>${esElectiva?'Ventana electiva':'Bloque vinculado'}</strong>
                    <span>${ctx.escapeHTML(asig?.codigo||'Asignatura')} se planifica desde ${ctx.escapeHTML(nombreSeccion(plan.seccionId))}. Para modificarlo debes abrir esa sección.</span>
                </div>
                <button id="popupIrMadre">Ir a sección de origen</button>
                <button id="popupVerVinculadas">${esElectiva?'Ver destinos':'Ver secciones vinculadas'}</button>`;
            document.body.appendChild(popup);
            posicionarPopupEnPuntero(popup,cell,evento);
            popupState._popupAbierto=popup; popupState._popupCell=cell;
            requestAnimationFrame(()=>{ if(window._kbInitPopup) window._kbInitPopup(); });
            popup.querySelector('#popupIrMadre').onclick=()=>{
                data.sel.seccionId=plan.seccionId;
                const madre=data.secciones.find(s=>s.id===plan.seccionId);
                if(madre){
                    data.sel.nivelId=madre.nivelId;
                    const nivel=data.niveles.find(n=>n.id===madre.nivelId);
                    data.sel.carreraId=nivel?.carreraId||data.sel.carreraId;
                    const carrera=data.carreras.find(c=>c.id===data.sel.carreraId);
                    data.sel.area=carrera?areaCarrera(carrera):data.sel.area;
                }
                actualizarSelectoresPlan();
                construirGrilla();
                actualizarProgresoPlan();
                cerrarPopupAccion();
                ctx.toast('Sección madre abierta','info');
            };
            popup.querySelector('#popupVerVinculadas').onclick=()=>{
                const destinos=esElectiva?[...new Set((data.vinculosElectivos||[]).filter(v=>v.asignaturaId===asig?.id&&v.seccionOrigenId===plan.seccionId).map(v=>v.seccionDestinoId))].map(nombreSeccion).join(', ')||'Sin destinos':vinculadas;
                alert(`${esElectiva?'Sección de origen':'Sección madre'}: ${nombreSeccion(plan.seccionId)}\n${esElectiva?'Destinos':'Vinculadas'}: ${destinos}`);
                cerrarPopupAccion();
            };
        }

        function cerrarPopupAccion() {
            const popupState = ctx.popupState;
            if(popupState._popupAbierto) {
                const popup=popupState._popupAbierto;
                popupState._popupAbierto = null;
                popupState._popupCell = null;
                ctx.cerrarFlotante(popup,120);
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
                ctx.actualizarModoPlanificacionUI?.();
                document.getElementById('planProgreso').style.display='block';
                document.getElementById('planProgreso').textContent='🔄 Moviendo '+(asig.codigo||'')+' → '+(data.docentes.find(d=>d.id===modoMovimiento.nuevoDocenteId)?.nombre||'')+' — Arrastra un bloque. Usa Command/Ctrl para mover el tramo completo.';
                construirGrillaMovimiento();
            };
            document.getElementById('btnMovCancelar').onclick=()=>{ modoMovimiento=null; ctx.cerrarModal(); };
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget){modoMovimiento=null;ctx.cerrarModal();}};
        }

        function cancelarMovimiento(){
            const data = getData();
            modoMovimiento=null;
            data.modoPlan=true;
            ctx.actualizarModoPlanificacionUI?.();
            actualizarProgresoPlan();
            construirGrilla();
        }

        function hayMovimiento(){
            return !!modoMovimiento;
        }

        function construirGrillaMovimiento(){
            const data = getData();
            const indicePlan = ctx.getIndicePlan();
            const grid=document.getElementById('scheduleGrid'); grid.innerHTML='';
            actualizarEstadoVacioPlanificador(data.sel.seccionId,1);
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
                        aplicarEstadoCelda(cell,planExistente,visibleExistente);
                        aplicarOcupacionDocenteCelda(cell,di,b.n,planExistente,docId);
                        aplicarOcupacionSalaCelda(cell,di,b.n,planExistente,mm.salaId);
                    } else if(!planExistente){
                        const disp=checkDisponibilidad(docId,di,b.n,secId,{ignorarIds:[mm.plan.id],asignaturaId:mm.plan.asignaturaId});
                        const docenteOcupado=aplicarOcupacionDocenteCelda(cell,di,b.n,null,docId);
                        const salaOcupada=aplicarOcupacionSalaCelda(cell,di,b.n,null,mm.salaId);
                        if(docenteOcupado||salaOcupada){
                            cell.title=[docenteOcupado?'Docente ocupado':'',salaOcupada?'Sala ocupada':''].filter(Boolean).join(' · ');
                        } else if(disp.ok){
                            cell.classList.add('available');
                            cell.innerHTML='<small>↳ destino</small>';
                        } else {
                            cell.classList.add('unavailable-docente');
                            cell.title=disp.msg||'No disponible';
                        }
                    } else {
                        aplicarEstadoCelda(cell,planExistente,visibleExistente);
                        cell.classList.add('unavailable-docente');
                        cell.title='Horario ocupado por otra planificación';
                    }
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
            const porComponente=!!plan.componenteId;
            const coincidePlan=p=>p.asignaturaId===plan.asignaturaId && p.seccionId===plan.seccionId && (!porComponente || String(p.componenteId||'')===String(plan.componenteId||''));
            const docentesDisponibles=data.docentes.filter(d=>d.id===ctx.DOCENTE_NN_ID||d.asignaturasQueDicta?.includes(plan.asignaturaId));
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3>Cambiar docente ${porComponente?'del componente':'para toda la asignatura'}</h3><select class="form-select" id="nuevoDocenteTodos"></select>
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
                const planesFijos = data.planificaciones.filter(p=>p.fijo && coincidePlan(p));
                if(planesFijos.length) return ctx.toast(porComponente?'Hay bloques fijos en este componente. Desbloquéalos antes de cambiar docente.':'Hay bloques fijos en esta asignatura. Desbloquéalos antes de cambiar docente.','info');
                const planesCambiar = data.planificaciones.filter(coincidePlan);
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
                ctx.guardar(); ctx.reconstruirIndices(); construirGrilla(); actualizarSelectoresPlan(); refrescarDespuesCambioPlanificacion(); ctx.cerrarModal(); ctx.toast(porComponente?'Docente cambiado en el componente':'Docente cambiado en toda la asignatura','success');
            };
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget)ctx.cerrarModal();};
        }

        function cambiarSalaAsignatura(plan){
            const data = getData();
            if(plan.fijo) return ctx.toast('Este bloque está fijo. Desbloquéalo antes de cambiar sala.','info');
            const porComponente=!!plan.componenteId;
            const planesAsig = data.planificaciones.filter(p=>p.asignaturaId===plan.asignaturaId && p.seccionId===plan.seccionId && p.tipoPresencial!==false && (!porComponente || String(p.componenteId||'')===String(plan.componenteId||'')));
            if(planesAsig.some(p=>p.fijo)) return ctx.toast(porComponente?'Hay bloques fijos en este componente. Desbloquéalos antes de cambiar sala.':'Hay bloques fijos en esta asignatura. Desbloquéalos antes de cambiar sala.','info');
            const salasUnicas = [...new Set(planesAsig.map(p=>p.salaId))];
            let html = `<div class="modal-overlay" id="modalOverlay"><div class="modal"><h3>Cambiar salas presenciales ${porComponente?'del componente':''}</h3>`;
            if(salasUnicas.length===0) html+='<p>No hay bloques presenciales para esta asignatura.</p>';
            else {
                html+='<table width="100%"><tr><th>Sala actual</th><th>Nueva sala</th></tr>';
                salasUnicas.forEach(salaId=>{
                    const salaActual = data.salas.find(s=>s.id===salaId);
                    const salasDisponibles = data.salas.filter(s=>!s.esVirtual);
                    html+=`<tr><td>${ctx.escapeHTML(etiquetaSalaConCapacidad(salaActual)||salaId)}</td><td><select class="form-select nuevoSala" data-sala="${ctx.escapeAttr(salaId)}"><option value="">No cambiar</option>${salasDisponibles.map(s=>ctx.optionHTML(s.id,etiquetaSalaConCapacidad(s))).join('')}</select></td></tr>`;
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
                const salasPorConfirmar=[...new Set(planesAsig.map(p=>cambios[p.salaId]).filter(Boolean))];
                for(const salaId of salasPorConfirmar){
                    if(!confirmarCapacidadSala(plan.asignaturaId,plan.seccionId,salaId,plan.componenteId||'')) return;
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
            const area=document.getElementById('planArea'); const carr=document.getElementById('planCarrera'); const niv=document.getElementById('planNivel'); const jor=document.getElementById('planJornada'); const sec=document.getElementById('planSeccion');
            const asig=document.getElementById('planAsignatura'); const compSel=document.getElementById('planComponente'); const compGroup=document.getElementById('planComponenteGroup'); const doc=document.getElementById('planDocente'); const sala=document.getElementById('planSala');
            const tipoSel=document.getElementById('planTipo');
            if(!['presencial','virtual'].includes(data.sel.tipo)) data.sel.tipo='presencial';
            if(tipoSel) tipoSel.value=data.sel.tipo;
            const areas=areasCarrera();
            if(data.sel.area&&!areas.includes(data.sel.area)) data.sel.area=null;
            area.innerHTML='<option value="">Todas las áreas</option>'+areas.map(a=>ctx.optionHTML(a,a,data.sel.area===a)).join('');
            area.value=data.sel.area||'';
            const carrerasFiltradas=data.carreras.filter(c=>!data.sel.area||areaCarrera(c)===data.sel.area).sort((a,b)=>String(a.nombre||'').localeCompare(String(b.nombre||''),undefined,{numeric:true,sensitivity:'base'}));
            if(data.sel.carreraId&&!carrerasFiltradas.some(c=>mismoId(c.id,data.sel.carreraId))) data.sel.carreraId=null;
            carr.innerHTML='<option value="">-- Carrera --</option>'+carrerasFiltradas.map(c=>ctx.optionHTML(c.id, `${c.nombre||''} [${areaCarrera(c)}]${c.especialidad&&c.especialidad!==areaCarrera(c)?` · ${c.especialidad}`:''}`)).join(''); carr.value=data.sel.carreraId||'';
            niv.innerHTML='<option value="">-- Nivel --</option>'+(data.sel.carreraId?data.niveles.filter(n=>mismoId(n.carreraId,data.sel.carreraId)).sort(ordenarNivelesDesc).map(n=>ctx.optionHTML(n.id,n.nombre)).join(''):''); niv.value=data.sel.nivelId||''; niv.disabled=!data.sel.carreraId;
            const seccionesNivel=data.sel.nivelId?data.secciones.filter(s=>mismoId(s.nivelId,data.sel.nivelId)):[];
            const jornadas=[...new Set(seccionesNivel.map(jornadaSeccion))].sort((a,b)=>a==='diurna'?-1:b==='diurna'?1:0);
            if(data.sel.jornada&&!jornadas.includes(data.sel.jornada)) data.sel.jornada=null;
            if(!data.sel.jornada&&jornadas.length===1) data.sel.jornada=jornadas[0];
            jor.innerHTML='<option value="">-- Jornada --</option>'+jornadas.map(j=>ctx.optionHTML(j,etiquetaJornada(j))).join('');
            jor.value=data.sel.jornada||''; jor.disabled=!data.sel.nivelId||!jornadas.length;
            const seccionesFiltradas=seccionesNivel.filter(s=>!data.sel.jornada||jornadaSeccion(s)===data.sel.jornada).sort(ordenarSeccionesNombre);
            if(data.sel.seccionId&&!seccionesFiltradas.some(s=>mismoId(s.id,data.sel.seccionId))) data.sel.seccionId=null;
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
            const componentes=data.sel.seccionId&&data.sel.asignaturaId&&data.sel.tipo!=='virtual'?componentesAsignaturaSeccion(data.sel.asignaturaId,data.sel.seccionId):[];
            if(compGroup&&compSel){
                if(componentes.length){
                    if(data.sel.componenteId&&!componentes.some(c=>c.id===data.sel.componenteId)) data.sel.componenteId=componentes[0].id;
                    if(!data.sel.componenteId) data.sel.componenteId=componentes[0].id;
                    compSel.innerHTML=componentes.map(c=>{
                        const horas=Number(c.horas)||0;
                        const alumnos=Number(c.alumnos)||0;
                        const etiqueta=`${c.nombre||c.id}${c.tipo==='comun'?' · sección completa':' · subsección'}${alumnos?` · ${alumnos} alumnos`:''}${horas?` · ${horas}h`:''}`;
                        return ctx.optionHTML(c.id,etiqueta);
                    }).join('');
                    compSel.value=data.sel.componenteId||componentes[0].id;
                    compSel.disabled=false;
                    compGroup.style.display='';
                }else{
                    data.sel.componenteId=null;
                    compSel.innerHTML='';
                    compSel.disabled=true;
                    compGroup.style.display='none';
                }
            }
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
            if(data.sel.tipo==='virtual'){
                data.sel.salaId=ctx.SALA_VIRTUAL_ID;
                const virtual=data.salas.find(s=>s.id===ctx.SALA_VIRTUAL_ID);
                sala.innerHTML=ctx.optionHTML(ctx.SALA_VIRTUAL_ID,virtual?.nombre||'Virtual');
                sala.value=ctx.SALA_VIRTUAL_ID;
                sala.disabled=true;
            } else {
                if(data.sel.salaId===ctx.SALA_VIRTUAL_ID) data.sel.salaId=null;
                const salasPresenciales=data.salas.filter(s=>s.id!==ctx.SALA_VIRTUAL_ID);
                sala.innerHTML='<option value="">-- Sala --</option>'+salasPresenciales.map(s=>ctx.optionHTML(s.id,etiquetaSalaConCapacidad(s))).join('');
                sala.value=data.sel.salaId||'';
                sala.disabled=!data.sel.docenteId;
            }
        }

        function actualizarProgresoPlan(){
            const data = getData();
            const el=document.getElementById('planProgreso');
            if(!data.sel.seccionId||!data.sel.asignaturaId||!data.sel.docenteId){
                if(!data.sel.seccionId||!data.sel.asignaturaId){ el.style.display='none'; return; }
            }
            const asig=data.asignaturas.find(a=>a.id===data.sel.asignaturaId);
            if(!asig){ el.style.display='none'; return; }
            const visibles=planesVisiblesAsignaturaSeccion(asig.id,data.sel.seccionId);
            const planesP=visibles.filter(p=>p.tipoPresencial!==false);
            const planesV=visibles.filter(p=>p.tipoPresencial===false);
            const reqP=bloquesRequeridosAsignatura(asig,'presencial'), reqV=bloquesRequeridosAsignatura(asig,'virtual');
            const componentes=componentesAsignaturaSeccion(asig.id,data.sel.seccionId);
            const compActual=componentes.length?componenteSeleccionado():null;
            const planesComp=compActual?planesP.filter(p=>String(p.componenteId||'')===String(compActual.id)):planesP;
            const reqComp=compActual?bloquesDesdeHoras(Number(compActual.horas)||0):reqP;
            const pctP=reqComp?Math.round(planesComp.length/reqComp*100):0, pctV=reqV?Math.round(planesV.length/reqV*100):0;
            const totalReq=(componentes.length?componentes.reduce((acc,c)=>acc+bloquesDesdeHoras(Number(c.horas)||0),0):reqP)+reqV;
            const totalPlan=planesP.length+planesV.length;
            const colorP=pctP>=100?'var(--success)':pctP>0?'var(--warning)':'var(--text-secondary)';
            const colorV=pctV>=100?'var(--success)':pctV>0?'var(--warning)':'var(--text-secondary)';
            const resumen=resumenDictacionAsignatura(asig.id,data.sel.seccionId);
            const nota=resumen?` · ${ctx.escapeHTML(resumen)}`:'';
            const alumnos=alumnosGrupoAsignatura(asig.id,data.sel.seccionId,compActual?.id||'');
            const alumnosTexto=alumnos.tieneDatos
                ? ` · <span style="color:var(--text-secondary);font-weight:600;">Alumnos: ${alumnos.total}${alumnos.base&&alumnos.vinculados?` (${alumnos.base} propios + ${alumnos.vinculados} vinculados)`:''}</span>`
                : ' · <span style="color:var(--text-secondary);font-weight:600;">Alumnos: s/d</span>';
            const evalCap=data.sel.tipo==='presencial'&&data.sel.salaId?evaluarCapacidadSala(asig.id,data.sel.seccionId,data.sel.salaId,compActual?.id||''):null;
            const capacidad=evalCap?.aplica
                ? ` · <span style="color:${evalCap.excede?'var(--warning)':'var(--text-secondary)'};font-weight:600;">Alumnos/sala: ${evalCap.alumnos}/${evalCap.capacidad}${evalCap.excede?' · supera cupo':''}</span>`
                : '';
            const etiquetaPresencial=compActual?`Componente ${ctx.escapeHTML(compActual.nombre||compActual.id)}`:'Presencial';
            el.innerHTML=`${etiquetaPresencial}: <span style="color:${colorP};font-weight:600;">${planesComp.length}/${reqComp}</span> · Virtual: <span style="color:${colorV};font-weight:600;">${planesV.length}/${reqV}</span> · Total operativo: ${totalPlan}/${totalReq}${nota}${alumnosTexto}${capacidad}`;
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
            function nombreSalaAuto(salaId){
                return data.salas.find(s=>s.id===salaId)?.nombre||'Sala';
            }
            function resolverSalaAuto(dia,bloque){
                if(!esPresencial) return {sala:ctx.SALA_VIRTUAL_ID,razones:[]};
                if(salaReal){
                    if(salaReal===ctx.SALA_TRO2_ID||salaReal===ctx.SALA_VIRTUAL_ID) return {sala:salaReal,razones:[]};
                    if(!salaOk(salaReal,dia,bloque)) return {sala:null,bloquea:true,motivos:[`Sala ocupada: ${nombreSalaAuto(salaReal)}`]};
                    const cap=evaluarCapacidadSala(asigId,secId,salaReal);
                    if(cap.excede) return {sala:null,bloquea:true,motivos:[`Sala sin cupo suficiente: ${nombreSalaAuto(salaReal)} (${cap.alumnos}/${cap.capacidad})`]};
                    return {sala:salaReal,razones:[]};
                }
                const referenciaGestor=String(asig.salaReferencia||'').trim();
                const candidatas=salasPref.filter(id=>data.salas.some(s=>s.id===id));
                if(!candidatas.length){
                    return {
                        sala:ctx.SALA_TRO2_ID,
                        razones:referenciaGestor?[`Sala Gestor no encontrada: ${referenciaGestor}`]:[]
                    };
                }
                const rechazos=[];
                for(const salaPref of candidatas){
                    const nombre=nombreSalaAuto(salaPref);
                    if(!salaOk(salaPref,dia,bloque)){
                        rechazos.push(`Sala sugerida ocupada: ${nombre}`);
                        continue;
                    }
                    const cap=evaluarCapacidadSala(asigId,secId,salaPref);
                    if(cap.excede){
                        rechazos.push(`Sala Gestor rechazada por capacidad: ${nombre} (${cap.alumnos}/${cap.capacidad})`);
                        continue;
                    }
                    return {sala:salaPref,razones:[referenciaGestor?'usa sala sugerida por Gestor':'usa sala preferida']};
                }
                return {sala:ctx.SALA_TRO2_ID,razones:rechazos.slice(0,2)};
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
                const ocupacionImpactada=ocupacionSeccionesImpactadas(asigId,secId,dia,bloque);
                if(ocupacionImpactada.ocupada) return {permitido:false,motivos:[`Tope en ${nombreSeccion(ocupacionImpactada.seccionId)}`]};
                if(planesVisiblesAsignaturaSeccion(asigId,secId).some(p=>p.dia===dia&&p.bloque===bloque)) return {permitido:false,motivos:['Asignatura ya planificada']};
                const disp=checkDisponibilidad(docId,dia,bloque,secId,{asignaturaId:asigId});
                if(!disp.ok) return {permitido:false,motivos:[disp.msg||'Docente no disponible']};
                const seleccionSala=resolverSalaAuto(dia,bloque);
                if(seleccionSala.bloquea) return {permitido:false,motivos:seleccionSala.motivos||['Sala no disponible']};
                const salaFinal=seleccionSala.sala||ctx.SALA_TRO2_ID;
                if(seleccionSala.razones?.length) blandas.push(...seleccionSala.razones);
                const asignadosComoPlanes=asignados.map((p,idx)=>({
                    id:`auto_tmp_${asigId}_${secId}_${idx}`,
                    seccionId:secId,
                    asignaturaId:asigId,
                    docenteId:docId,
                    salaId:p.sala||salaReal||ctx.SALA_TRO2_ID,
                    dia:p.dia,
                    bloque:p.bloque,
                    tipoPresencial:esPresencial
                }));
                const planCandidato={
                    id:`auto_eval_${asigId}_${secId}_${docId}_${dia}_${bloque}_${asignados.length}`,
                    seccionId:secId,
                    asignaturaId:asigId,
                    docenteId:docId,
                    salaId:salaFinal,
                    dia,
                    bloque,
                    tipoPresencial:esPresencial
                };
                const planesEvaluacion=[...data.planificaciones,...asignadosComoPlanes,planCandidato];
                const evaluacionCentral=evaluarRestriccionesPlan(planCandidato,dia,bloque,planesEvaluacion);
                if(!evaluacionCentral.valido){
                    return {
                        permitido:false,
                        motivos:evaluacionCentral.duras.map(r=>r.label||r.detalle||r.clave).filter(Boolean).slice(0,3)
                    };
                }
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
                puntaje+=puntajeSala(salaFinal);
                puntaje-=Math.round((evaluacionCentral.costoBlando||0)*3);
                if(evaluacionCentral.blandas?.length){
                    blandas.push(...evaluacionCentral.blandas
                        .sort((a,b)=>(b.costo||0)-(a.costo||0))
                        .map(r=>r.label||r.clave)
                        .filter(Boolean)
                        .slice(0,3));
                }
                const memoriaAuto=puntajeMemoriaAuto({asigId,secId,docId,salaId:salaFinal,dia,bloque});
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
                return {permitido:true,motivos,blandas:[...new Set(blandas)].slice(0,6),puntaje,sala:salaFinal,bloque,evaluacion:evaluacionCentral};
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
                    if(ocupacionSeccionesImpactadas(asigId,secId,dia,b).ocupada){motivos.seccion++; continue;}
                    const disp=checkDisponibilidad(docId,dia,b,secId,{asignaturaId:asigId});
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
            ctx.crearPuntoRecuperacion?.('antes_auto_asignatura');
            ctx.pushUndo({tipo:'auto_asignatura',resumen:'Auto-asignatura',afecta:'Asignatura actual',critica:false});
            const cant=autoAsignarBloques(s.asignaturaId,s.seccionId,s.docenteId,s.salaId||'',s.tipo==='presencial',0,{omitirUndo:true,registrarIds:ids,registrarExplicaciones:explicaciones,origen:'auto_asignatura'});
            if(!cant) return ctx.toast('No se pudo asignar ningún bloque','error');
            registrarAutoEjecucion('auto_asignatura',ids,{seccionId:s.seccionId,asignaturaId:s.asignaturaId,bloques:cant,explicaciones});
            ctx.guardar(); construirGrilla(); actualizarSelectoresPlan(); actualizarProgresoPlan();
            refrescarDespuesCambioPlanificacion();
            ctx.toast(`✅ ${cant} bloque(s) asignado(s)`,'success');
        }

        function keyAjusteAutoGeneral(secId, asigId, tipo=''){
            return [secId||'',asigId||'',tipo||''].join('|');
        }

        function normalizarAjustesRapidosAutoGeneral(opciones={}){
            const raw=opciones.ajustesRapidos||{};
            return {
                docentes:Object.assign({},raw.docentes||{}),
                salas:Object.assign({},raw.salas||{}),
                omitidas:[...new Set(raw.omitidas||[])],
                seccionesExcluidas:[...new Set(raw.seccionesExcluidas||[])]
            };
        }

        function guardarAjustesRapidosAutoGeneral(opciones, ajustes){
            opciones.ajustesRapidos={
                docentes:Object.assign({},ajustes.docentes||{}),
                salas:Object.assign({},ajustes.salas||{}),
                omitidas:[...new Set(ajustes.omitidas||[])],
                seccionesExcluidas:[...new Set(ajustes.seccionesExcluidas||[])]
            };
            return opciones;
        }

        function ajusteRapidoAsignatura(ajustes, secId, asigId, tipo){
            const kTipo=keyAjusteAutoGeneral(secId,asigId,tipo);
            const kBase=keyAjusteAutoGeneral(secId,asigId,'');
            const omitidas=new Set(ajustes.omitidas||[]);
            return {
                omitida:omitidas.has(kTipo)||omitidas.has(kBase),
                docenteId:ajustes.docentes?.[kTipo]||ajustes.docentes?.[kBase]||'',
                salaId:ajustes.salas?.[kTipo]||ajustes.salas?.[kBase]||''
            };
        }

        function contextoMemoriaAutoGeneralPorKey(key){
            const data=getData();
            const [seccionId='',asignaturaId='',tipoBloque='']=String(key||'').split('|');
            const sec=data.secciones.find(s=>s.id===seccionId);
            const nivel=sec?data.niveles.find(n=>n.id===sec.nivelId):null;
            return {
                seccionId:seccionId||null,
                nivelId:nivel?.id||null,
                carreraId:nivel?.carreraId||null,
                asignaturaId:asignaturaId||null,
                tipoBloque:tipoBloque||null
            };
        }

        function registrarMemoriaAutoGeneralAplicada(opciones, detalleAsignaturas=[]){
            const cfg=getData().configuracion.memoriaPlanificacion||{};
            if(cfg.activa===false) return 0;
            const ajustes=normalizarAjustesRapidosAutoGeneral(opciones);
            let registradas=0;
            Object.entries(ajustes.docentes||{}).forEach(([key,docenteNuevoId])=>{
                if(!docenteNuevoId) return;
                registrarMemoriaPlanificacion('docente_corregido',Object.assign(contextoMemoriaAutoGeneralPorKey(key),{
                    docenteNuevoId,
                    origen:'diagnostico_predictivo',
                    autoTipo:'auto_general'
                }));
                registradas++;
            });
            Object.entries(ajustes.salas||{}).forEach(([key,salaNuevaId])=>{
                if(!salaNuevaId) return;
                registrarMemoriaPlanificacion('sala_corregida',Object.assign(contextoMemoriaAutoGeneralPorKey(key),{
                    salaNuevaId,
                    desdeTRO2:true,
                    origen:'diagnostico_predictivo',
                    autoTipo:'auto_general'
                }));
                registradas++;
            });
            (ajustes.omitidas||[]).forEach(key=>{
                registrarMemoriaPlanificacion('auto_general_omitida',Object.assign(contextoMemoriaAutoGeneralPorKey(key),{
                    origen:'diagnostico_predictivo',
                    estrategia:opciones.estrategia||'balanceada'
                }));
                registradas++;
            });
            if(opciones.estrategia){
                registrarMemoriaPlanificacion('auto_general_estrategia_aceptada',{
                    estrategia:opciones.estrategia,
                    bloques:(detalleAsignaturas||[]).reduce((acc,x)=>acc+(Number(x.cant)||0),0),
                    asignaturas:(detalleAsignaturas||[]).length,
                    origen:'diagnostico_predictivo'
                });
                registradas++;
            }
            return registradas;
        }

        function calcularPlanAutoSeccion(estrategia='balanceada', ajustesRapidos=null){
            const data = getData();
            const s=data.sel;
            const ajustes=ajustesRapidos||normalizarAjustesRapidosAutoGeneral({});
            const idsAsig=asignaturasDeSeccion(s.seccionId);
            const acciones=[];
            const pendientes=[];
            const cfgAuto=data.configuracion.autoPlanificacion||{};
            const seccionId=s.seccionId;
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
                    const ajuste=ajusteRapidoAsignatura(ajustes,seccionId,asigId,'presencial');
                    if(ajuste.omitida) return;
                    const requerido=asig.bloquesPresenciales-pres;
                    const docenteForzado=ajuste.docenteId?data.docentes.find(d=>d.id===ajuste.docenteId):null;
                    const salaForzada=ajuste.salaId||'';
                    const elegido=docenteForzado
                        ? {doc:docenteForzado, ...estimarCapacidadAutoAsignacion(asigId,s.seccionId,docenteForzado.id,salaForzada,true,idx%5,estrategia),forzado:true}
                        : elegirDocenteAuto(asigId,s.seccionId,docentesAuto,salaForzada,true,idx%5,estrategia);
                    if(elegido?.cant) acciones.push({asig, docentes:docentesAuto, docente:elegido.doc, salaId:salaForzada, esPresencial:true, offsetDia:idx%5, cant:elegido.cant, requerido, ajusteRapido:!!(docenteForzado||salaForzada)});
                    else pendientes.push({asig, motivo:'Sin cupo presencial'});
                }
                if(cfgAuto.incluirVirtuales!==false&&vir<asig.bloquesVirtuales){
                    const ajuste=ajusteRapidoAsignatura(ajustes,seccionId,asigId,'virtual');
                    if(ajuste.omitida) return;
                    const requerido=asig.bloquesVirtuales-vir;
                    const docenteForzado=ajuste.docenteId?data.docentes.find(d=>d.id===ajuste.docenteId):null;
                    const elegido=docenteForzado
                        ? {doc:docenteForzado, ...estimarCapacidadAutoAsignacion(asigId,s.seccionId,docenteForzado.id,ctx.SALA_VIRTUAL_ID,false,idx%5,estrategia),forzado:true}
                        : elegirDocenteAuto(asigId,s.seccionId,docentesAuto,ctx.SALA_VIRTUAL_ID,false,idx%5,estrategia);
                    if(elegido?.cant) acciones.push({asig, docentes:docentesAuto, docente:elegido.doc, salaId:ctx.SALA_VIRTUAL_ID, esPresencial:false, offsetDia:idx%5, cant:elegido.cant, requerido, ajusteRapido:!!docenteForzado});
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
                                ${salas.map(s=>ctx.optionHTML(s.id,etiquetaSalaConCapacidad(s),s.id===a.salaId)).join('')}
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
                    ctx.cerrarModal();
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
            ctx.crearPuntoRecuperacion?.('antes_auto_seccion');
            ctx.pushUndo({tipo:'auto_seccion',resumen:'Auto-sección',afecta:'Sección actual',critica:false});
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

        function contextoSeccionDesdeObjeto(sec){
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

        function calcularPlanAutoSeccionPara(secId, estrategia='balanceada', opciones={}){
            const data=getData();
            const original={...data.sel};
            const sec=data.secciones.find(s=>s.id===secId);
            const ctxSec=contextoSeccionDesdeObjeto(sec);
            if(!ctxSec.sec||!ctxSec.nivel||!ctxSec.carrera) return null;
            data.sel.area=areaCarrera(ctxSec.carrera);
            data.sel.carreraId=ctxSec.carrera.id;
            data.sel.nivelId=ctxSec.nivel.id;
            data.sel.seccionId=ctxSec.sec.id;
            data.sel.asignaturaId=null;
            data.sel.docenteId=null;
            const plan=calcularPlanAutoSeccion(estrategia,normalizarAjustesRapidosAutoGeneral(opciones));
            plan.estrategia=estrategia;
            plan.diagnostico=diagnosticarAntesAutoSeccion();
            Object.assign(data.sel,original);
            return Object.assign(plan,ctxSec);
        }

        function aplicarFiltrosAutoGeneral(plan, opciones){
            const accionesOriginales=plan.acciones||[];
            const ajustes=normalizarAjustesRapidosAutoGeneral(opciones);
            const omitidasRapidas=new Set(ajustes.omitidas||[]);
            const acciones=accionesOriginales.filter(a=>{
                const tipo=a.esPresencial?'presencial':'virtual';
                if(omitidasRapidas.has(keyAjusteAutoGeneral(plan.sec?.id,a.asig.id,tipo))||omitidasRapidas.has(keyAjusteAutoGeneral(plan.sec?.id,a.asig.id,''))) return false;
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
            const {nivel,carrera}=contextoSeccionDesdeObjeto(sec);
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
            const excluidas=new Set(normalizarAjustesRapidosAutoGeneral(opciones).seccionesExcluidas||[]);
            let secciones=data.secciones.slice();
            if(Array.isArray(opciones.seccionIds)){
                const seleccionadas=new Set(opciones.seccionIds);
                secciones=secciones.filter(s=>seleccionadas.has(s.id));
            }else if(opciones.alcance==='carrera' && data.sel.carreraId){
                const niveles=new Set(data.niveles.filter(n=>n.carreraId===data.sel.carreraId).map(n=>n.id));
                secciones=secciones.filter(s=>niveles.has(s.nivelId));
            }else if(opciones.alcance==='nivel' && data.sel.nivelId){
                secciones=secciones.filter(s=>s.nivelId===data.sel.nivelId);
            }
            if(excluidas.size) secciones=secciones.filter(s=>!excluidas.has(s.id));
            if(opciones.soloPendientes!==false) secciones=secciones.filter(seccionPendiente);
            return ordenarSeccionesAutoGeneral(secciones,opciones.vespertinoPrimero!==false);
        }

        function idsSeccionesPorAlcanceAutoGeneral(opciones={}){
            const data=getData();
            let secciones=data.secciones.slice();
            if(opciones.alcance==='carrera' && data.sel.carreraId){
                const niveles=new Set(data.niveles.filter(n=>n.carreraId===data.sel.carreraId).map(n=>n.id));
                secciones=secciones.filter(s=>niveles.has(s.nivelId));
            }else if(opciones.alcance==='nivel' && data.sel.nivelId){
                secciones=secciones.filter(s=>s.nivelId===data.sel.nivelId);
            }
            return secciones.map(s=>s.id);
        }

        function estructuraAlcanceAutoGeneral(){
            const data=getData();
            const mapa=new Map();
            data.carreras
                .slice()
                .sort((a,b)=>areaCarrera(a).localeCompare(areaCarrera(b),undefined,{sensitivity:'base'})||String(a.nombre||'').localeCompare(String(b.nombre||''),undefined,{numeric:true,sensitivity:'base'}))
                .forEach(carrera=>{
                    const area=areaCarrera(carrera);
                    if(!mapa.has(area)) mapa.set(area,{area,carreras:[]});
                    const niveles=data.niveles
                        .filter(n=>n.carreraId===carrera.id)
                        .sort(ordenarNivelesDesc)
                        .map(nivel=>{
                            const secciones=data.secciones
                                .filter(s=>s.nivelId===nivel.id)
                                .sort(ordenarSeccionesNombre);
                            return {nivel,secciones};
                        })
                        .filter(n=>n.secciones.length);
                    if(niveles.length) mapa.get(area).carreras.push({carrera,niveles});
                });
            return [...mapa.values()].filter(a=>a.carreras.length);
        }

        function renderAlcanceDetalladoAutoGeneral(opciones,resumen){
            const seleccion=new Set(Array.isArray(opciones.seccionIds)?opciones.seccionIds:idsSeccionesPorAlcanceAutoGeneral(opciones));
            const allIds=getData().secciones.map(s=>s.id);
            const idsAttr=ids=>ctx.escapeAttr(ids.join(','));
            const checked=ids=>ids.length&&ids.every(id=>seleccion.has(id))?'checked':'';
            const parcial=ids=>ids.some(id=>seleccion.has(id))&&!ids.every(id=>seleccion.has(id))?'data-parcial="1"':'';
            const lista=estructuraAlcanceAutoGeneral();
            const totalSeleccion=seleccion.size;
            const expandidos=new Set(Array.isArray(opciones.expandScope)?opciones.expandScope:[]);
            const pendientesSeleccion=allIds.filter(id=>seleccion.has(id)).reduce((acc,id)=>{
                const sec=getData().secciones.find(s=>s.id===id);
                return acc+(sec&&seccionPendiente(sec)?1:0);
            },0);
            const renderCheck=(label,ids,extra='',meta='')=>`<label class="auto-general-scope-row ${extra}" ${parcial(ids)}>
                <input type="checkbox" class="auto-general-scope-check" data-ids="${idsAttr(ids)}" ${checked(ids)}>
                <span>${ctx.escapeHTML(label)}</span>
                <small>${ctx.escapeHTML(meta||`${ids.length} sección(es)`)}</small>
            </label>`;
            return `<div class="auto-general-scope-panel">
                <div class="auto-general-scope-head">
                    <div><strong>Alcance detallado</strong><span>Marca lo que quieres planificar. Abre cada grupo solo si necesitas revisar el detalle.</span></div>
                    <div><b>${totalSeleccion}</b><small>seleccionadas · ${pendientesSeleccion} pendientes · ${resumen.planes.length} con filtros</small></div>
                </div>
                <div class="auto-general-scope-actions">
                    <button class="btn btn-xs" type="button" data-auto-scope-action="all">Todo</button>
                    <button class="btn btn-xs" type="button" data-auto-scope-action="none">Limpiar</button>
                </div>
                <div class="auto-general-scope-tree">
                    ${lista.map(area=>{
                        const areaIds=area.carreras.flatMap(c=>c.niveles.flatMap(n=>n.secciones.map(s=>s.id)));
                        const areaPendientes=areaIds.reduce((acc,id)=>{
                            const sec=getData().secciones.find(s=>s.id===id);
                            return acc+(sec&&seccionPendiente(sec)?1:0);
                        },0);
                        const areaKey=`area:${area.area}`;
                        return `<details open data-scope-key="${ctx.escapeAttr(areaKey)}">
                            <summary>${renderCheck(area.area,areaIds,'area',`${area.carreras.length} carrera(s) · ${areaIds.length} secciones · ${areaPendientes} pendientes`)}</summary>
                            ${area.carreras.map(c=>{
                                const carreraIds=c.niveles.flatMap(n=>n.secciones.map(s=>s.id));
                                const carreraPendientes=carreraIds.reduce((acc,id)=>{
                                    const sec=getData().secciones.find(s=>s.id===id);
                                    return acc+(sec&&seccionPendiente(sec)?1:0);
                                },0);
                                const carreraKey=`career:${c.carrera.id}`;
                                return `<details class="auto-general-scope-branch" data-scope-key="${ctx.escapeAttr(carreraKey)}" ${expandidos.has(carreraKey)?'open':''}>
                                    <summary>${renderCheck(`${c.carrera.codigo||''} ${c.carrera.nombre||''}`.trim(),carreraIds,'career',`${c.niveles.length} nivel(es) · ${carreraIds.length} secciones · ${carreraPendientes} pendientes`)}</summary>
                                    ${c.niveles.map(n=>{
                                        const nivelIds=n.secciones.map(s=>s.id);
                                        const nivelPendientes=n.secciones.filter(seccionPendiente).length;
                                        const jornadas=['diurna','vespertina'].map(j=>({
                                            jornada:j,
                                            nombre:etiquetaJornada(j),
                                            secciones:n.secciones.filter(s=>jornadaSeccion(s)===j)
                                        })).filter(g=>g.secciones.length);
                                        const nivelKey=`level:${n.nivel.id}`;
                                        return `<details class="auto-general-scope-branch" data-scope-key="${ctx.escapeAttr(nivelKey)}" ${expandidos.has(nivelKey)?'open':''}>
                                            <summary>${renderCheck(n.nivel.nombre,nivelIds,'level',`${nivelIds.length} secciones · ${nivelPendientes} pendientes`)}</summary>
                                            ${jornadas.map(g=>`<div class="auto-general-scope-day">
                                                ${renderCheck(g.nombre,g.secciones.map(s=>s.id),'day',`${g.secciones.length} secciones`)}
                                                <div class="auto-general-scope-sections">
                                                    ${g.secciones.map(s=>renderCheck(s.nombre,[s.id],'section')).join('')}
                                                </div>
                                            </div>`).join('')}
                                        </details>`;
                                    }).join('')}
                                </details>`;
                            }).join('')}
                        </details>`;
                    }).join('') || '<p class="auto-plan-empty">No hay secciones para seleccionar.</p>'}
                </div>
                <input type="hidden" id="autoGeneralSeccionesSeleccionadas" value="${ctx.escapeAttr([...seleccion].join(','))}">
                <input type="hidden" id="autoGeneralTodasSecciones" value="${ctx.escapeAttr(allIds.join(','))}">
            </div>`;
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
            const niveles={ignorar:0,baja:0.55,media:1,alta:1.45,obligatorio:2.2,desactivado:0,bajo:0.55,medio:1,alto:1.45,'muy-alto':2.2};
            const mapaLegacy={'desactivado':'ignorar','bajo':'baja','medio':'media','alto':'alta','muy-alto':'obligatorio'};
            const nivel=mapaLegacy[data.configuracion?.solverPesos?.[criterio]]||data.configuracion?.solverPesos?.[criterio]||'media';
            return niveles[nivel]??1;
        }

        function criterioDesdeRestriccionSolver(clave){
            const mapa={
                bloque_invalido:'topesDuros',
                dia_invalido:'topesDuros',
                sabado_limite:'respetoJornada',
                jornada:'respetoJornada',
                tope_seccion:'topesSeccion',
                docente_inexistente:'disponibilidadDocente',
                disponibilidad_docente:'disponibilidadDocente',
                tope_docente:'topesDuros',
                maximo_diario_docente:'excesoDiarioDocente',
                descanso_docente:'descansoDocente',
                tope_sala:'topesSala',
                docente_nn:'docenteNN',
                sala_provisional:'tro2',
                virtual_preferente:'virtuales',
                virtual_sabado:'virtualesSabado',
                sabado_presencial:'sabadoPresencial',
                bloque_temprano:'evitarTemprano',
                primer_semestre:'primerSemestre',
                asignatura_critica:'criticas',
                ayudantia:'ayudantias',
                recreo:'recreo',
                ventana_estudiante:'ventanasEstudiantes',
                compactacion_asignatura:'compactacionAsignatura',
                compactacion_larga:'compactacionLarga',
                ventana_docente:'ventanasDocentes',
                dia_cargado:'distribucionSemanal',
                mezcla_asignaturas:'distribuirAsignaturas',
                sala_preferida:'salasCorrectas',
                docente_preferente:'docentePreferente',
                memoria_manual:'memoriaManual'
            };
            return mapa[clave]||'topesDuros';
        }

        function costoRestriccionesSolver(restricciones){
            return (restricciones||[]).reduce((acc,r)=>{
                const base=Number(r.costo)||1;
                return acc+(base*multiplicadorPesoSolver(criterioDesdeRestriccionSolver(r.clave)));
            },0);
        }

        function calcularFuncionObjetivoSolver(m){
            const costoDuro=Math.round(
                ((m.conflictos||0)*220*multiplicadorPesoSolver('topesDuros'))+
                ((m.fueraJornada||0)*180*multiplicadorPesoSolver('respetoJornada'))+
                ((m.disponibilidadDocente||0)*220*multiplicadorPesoSolver('disponibilidadDocente'))+
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
                ((m.nn||0)*2.5*0.8*multiplicadorPesoSolver('docenteNN'))+
                ((m.tro2||0)*2*0.7*multiplicadorPesoSolver('tro2'))+
                ((m.virtuales||0)*2*0.6*multiplicadorPesoSolver('virtuales'))
            );
            const costoTotal=costoDuro+costoBlando;
            const score=Math.max(0,Math.min(100,100-Math.round(costoTotal/10)));
            return {costoDuro,costoBlando,costoTotal,score};
        }

        function crearIndicesScoreSolver(planificaciones){
            const data=getData();
            const agregar=(mapa,clave,plan)=>{
                if(!mapa.has(clave)) mapa.set(clave,[]);
                mapa.get(clave).push(plan);
            };
            const porSeccionAsig=new Map();
            const porSeccionDia=new Map();
            const porDocenteDia=new Map();
            planificaciones.forEach(plan=>{
                agregar(porSeccionAsig,`${plan.seccionId}|${plan.asignaturaId}`,plan);
                agregar(porSeccionDia,`${plan.seccionId}|${plan.dia}`,plan);
                if(plan.docenteId) agregar(porDocenteDia,`${plan.docenteId}|${plan.dia}`,plan);
            });

            const especificas=new Map();
            (data.asignaturaSeccion||[]).forEach(rel=>{
                if(!especificas.has(rel.seccionId)) especificas.set(rel.seccionId,[]);
                especificas.get(rel.seccionId).push(rel.asignaturaId);
            });
            const porNivelCarrera=new Map();
            (data.asignaturaCarreraNivel||[]).forEach(rel=>{
                const key=`${rel.carreraId}|${rel.nivelId}`;
                if(!porNivelCarrera.has(key)) porNivelCarrera.set(key,[]);
                porNivelCarrera.get(key).push(rel.asignaturaId);
            });
            const niveles=new Map(data.niveles.map(n=>[String(n.id),n]));
            const asignaturasPorSeccion=new Map();
            data.secciones.forEach(sec=>{
                const directas=especificas.get(sec.id)||[];
                const nivel=niveles.get(String(sec.nivelId));
                const ids=directas.length?directas:(porNivelCarrera.get(`${nivel?.carreraId}|${sec.nivelId}`)||[]);
                asignaturasPorSeccion.set(sec.id,[...new Set(ids)]);
            });
            return {porSeccionAsig,porSeccionDia,porDocenteDia,asignaturasPorSeccion};
        }

        function planesVisiblesAsignaturaScore(asigId,seccionId,indices){
            const propios=indices.porSeccionAsig.get(`${seccionId}|${asigId}`)||[];
            const heredados=gruposVinculadosDeSeccion(seccionId).flatMap(grupo=>{
                const ids=[grupo.asignaturaId,...(grupo.asignaturasEquivalentesIds||[])].filter(Boolean);
                if(!ids.some(id=>mismoId(id,asigId))) return [];
                return ids.flatMap(id=>indices.porSeccionAsig.get(`${grupo.seccionMadreId}|${id}`)||[]);
            });
            return [...propios,...heredados];
        }

        function planesVisiblesSeccionDiaScore(seccionId,dia,indices){
            const data=getData();
            const propios=indices.porSeccionDia.get(`${seccionId}|${dia}`)||[];
            const heredados=gruposVinculadosDeSeccion(seccionId).flatMap(grupo=>{
                const ids=new Set([grupo.asignaturaId,...(grupo.asignaturasEquivalentesIds||[])].filter(Boolean).map(String));
                return (indices.porSeccionDia.get(`${grupo.seccionMadreId}|${dia}`)||[]).filter(plan=>ids.has(String(plan.asignaturaId)));
            });
            const electivas=(data.vinculosElectivos||[])
                .filter(v=>mismoId(v.seccionDestinoId,seccionId))
                .flatMap(v=>(indices.porSeccionAsig.get(`${v.seccionOrigenId}|${v.asignaturaId}`)||[]).filter(plan=>Number(plan.dia)===Number(dia)));
            return [...propios,...heredados,...electivas];
        }

        function scoreGlobalPlanificaciones(planificaciones){
            const data=getData();
            const indices=crearIndicesScoreSolver(planificaciones);
            let requeridos=0, planificados=0;
            data.secciones.forEach(sec=>{
                const asigIds=indices.asignaturasPorSeccion.get(sec.id)||[];
                asigIds.forEach(asigId=>{
                    const asig=data.asignaturas.find(a=>a.id===asigId);
                    if(!asig) return;
                    const req=(Number(asig.bloquesPresenciales)||0)+(Number(asig.bloquesVirtuales)||0);
                    const hechos=planesVisiblesAsignaturaScore(asigId,sec.id,indices).length;
                    requeridos+=req;
                    planificados+=Math.min(hechos,req);
                });
            });
            const cobertura=requeridos?Math.round(planificados/requeridos*100):0;
            let ventanasSeccion=0, ventanasDocente=0, diasCargados=0, ventanasAsignatura=0, fragmentacionAsignatura=0, fueraJornada=0;
            data.secciones.forEach(sec=>{
                for(let dia=0;dia<ctx.DIAS.length;dia++){
                    const bloques=planesVisiblesSeccionDiaScore(sec.id,dia,indices).map(p=>p.bloque);
                    ventanasSeccion+=contarVentanasGlobal(bloques);
                    if(bloques.length>=9) diasCargados++;
                }
                (indices.asignaturasPorSeccion.get(sec.id)||[]).forEach(asigId=>{
                    const asig=data.asignaturas.find(a=>a.id===asigId);
                    if(!asig || asig.distribucion==='dividida') return;
                    const planesAsig=planesVisiblesAsignaturaScore(asigId,sec.id,indices).filter(p=>p.tipoPresencial!==false);
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
                    const bloques=(indices.porDocenteDia.get(`${doc.id}|${dia}`)||[]).map(p=>p.bloque);
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
            const detalle=[];
            const etiquetaBloqueSim=(p)=>`${(ctx.DIAS[p.dia]||'Día').slice(0,2)} B${p.bloque}`;
            const nombreDocenteSim=(doc)=>doc?.id===ctx.DOCENTE_NN_ID?'Docente NN':`${doc?.nombre||''} ${doc?.apellido||''}`.trim()||'Docente';
            try{
                data.planificaciones=simuladas;
                const secciones=obtenerSeccionesAutoGeneral(opciones);
                for(const sec of secciones){
                    const planBase=calcularPlanAutoSeccionPara(sec.id,opciones.estrategia||'balanceada',opciones);
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
                            const sala=data.salas.find(s=>s.id===(nuevos[0]?.salaId||a.salaId));
                            const razones=[...new Set(nuevos.flatMap(p=>p.explicacionAuto?.razones||[]).filter(Boolean))].slice(0,4);
                            const alertas=[];
                            if(a.docente?.id===ctx.DOCENTE_NN_ID) alertas.push({texto:'Docente NN',clase:'warning'});
                            if(nuevos.some(p=>p.salaId===ctx.SALA_TRO2_ID)) alertas.push({texto:'TRO2',clase:'warning'});
                            if(a.cant<a.requerido) alertas.push({texto:'Parcial',clase:'warning'});
                            if(a.asig?.area==='transversal'||a.asig?.controlHorario==='coordinacion-externa') alertas.push({texto:'Coordinar',clase:'info'});
                            if(a.ajusteRapido) alertas.push({texto:'Ajuste rápido',clase:'info'});
                            detalle.push({
                                seccionId:sec.id,
                                asignaturaId:a.asig.id,
                                seccion:sec.nombre||'',
                                carreraNivel:[plan.carrera?.codigo||plan.carrera?.nombre,plan.nivel?.nombre].filter(Boolean).join(' · '),
                                codigo:a.asig.codigo||'',
                                asignatura:a.asig.nombre||'',
                                docente:nombreDocenteSim(a.docente),
                                sala:!a.esPresencial?'Virtual':sala?.nombre||'Automática/TRO2',
                                tipo:a.esPresencial?'Presencial':'Virtual',
                                bloques:nuevos.map(etiquetaBloqueSim),
                                cant:nuevos.length,
                                requerido:a.requerido,
                                razones,
                                alertas
                            });
                        }
                    });
                    if(subtotal>0){
                        total+=subtotal;
                        seccionesConCambio++;
                    }
                }
                return {planificaciones:simuladas,total,seccionesConCambio,pendientes,omitidas,detalle,score:scoreGlobalPlanificaciones(simuladas)};
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
            const nivel=sec?data.niveles.find(n=>n.id===sec.nivelId):null;
            const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
            const esPrimerNivel=numeroNivel(nivel?.nombre)<=1 || /(\b|-)N?1(\b|-)/i.test(sec?.nombre||'');
            const esCritica=asig?.condicion==='alta-reprobacion'||asig?.condicion==='alta-reprobacion-ayudantia';
            const requiereAyudantia=asig?.condicion==='requiere-ayudantia'||asig?.condicion==='alta-reprobacion-ayudantia';
            if(!bloqueInfo) duras.push(crearRestriccionSolver('dura','bloque_invalido','Bloque inexistente','El bloque no existe en la grilla.'));
            if(dia<0||dia>=ctx.DIAS.length) duras.push(crearRestriccionSolver('dura','dia_invalido','Día inexistente','El día no existe en la grilla.'));
            if(dia===5 && bloque>data.configuracion.sabadoHastaBloque) duras.push(crearRestriccionSolver('dura','sabado_limite','Límite de sábado',`No se puede usar sábado después de B${data.configuracion.sabadoHastaBloque}.`));
            if(sec?.jornada==='diurna' && plan.tipoPresencial!==false && bloque>12) duras.push(crearRestriccionSolver('dura','jornada','Respeto de jornada','Una sección diurna no debe planificarse en bloques vespertinos.'));
            if(sec?.jornada==='vespertina' && plan.tipoPresencial!==false && bloque<13) duras.push(crearRestriccionSolver('dura','jornada','Respeto de jornada','Una sección vespertina no debe planificarse en bloques diurnos.'));
            const ocupacionImpactada=ocupacionSeccionesImpactadas(plan.asignaturaId,plan.seccionId,dia,bloque,{planes:resto});
            if(ocupacionImpactada.ocupada){
                duras.push(crearRestriccionSolver('dura','tope_seccion','Tope de sección',`La sección ${nombreSeccion(ocupacionImpactada.seccionId)} ya tiene un bloque en ese horario.`));
            }
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
                if(plan.tipoPresencial!==false){
                    const cap=evaluarCapacidadSala(plan.asignaturaId,plan.seccionId,plan.salaId,plan.componenteId||'');
                    if(cap.excede) duras.push(crearRestriccionSolver('dura','capacidad_sala','Capacidad de sala',`La asignatura tiene ${cap.alumnos} alumno(s) y la sala permite ${cap.capacidad}.`));
                }
            }
            if(plan.salaId===ctx.SALA_TRO2_ID) blandas.push(crearRestriccionSolver('blanda','sala_provisional','Sala TRO2','El bloque queda con sala provisional.',2));
            if(plan.tipoPresencial===false && !(dia===5 && bloque>=9)) blandas.push(crearRestriccionSolver('blanda','virtual_preferente','Virtual fuera de preferencia','El bloque virtual queda fuera del patrón preferente.',1.5));
            if(plan.tipoPresencial!==false && dia===5) blandas.push(crearRestriccionSolver('blanda','sabado_presencial','Sábado presencial','El bloque presencial usa sábado; debe ser una decisión intencional.',2));
            if(plan.tipoPresencial!==false && sec?.jornada!=='vespertina' && bloque<=2) blandas.push(crearRestriccionSolver('blanda','bloque_temprano','Inicio temprano','El bloque queda en B1-B2.',1.8));
            if(plan.tipoPresencial!==false && esPrimerNivel && sec?.jornada!=='vespertina' && bloque<=2) blandas.push(crearRestriccionSolver('blanda','primer_semestre','Primer semestre temprano','Para N1 se recomienda evitar B1-B2 cuando sea posible.',2.5));
            if(plan.tipoPresencial!==false && bloque===7) blandas.push(crearRestriccionSolver('blanda','recreo','Bloque de transición','B7 no está prohibido, pero se revisa como punto de descanso.',1));
            if(plan.tipoPresencial!==false && esCritica && (bloque<=2 || bloque>=16)) blandas.push(crearRestriccionSolver('blanda','asignatura_critica','Asignatura crítica','La asignatura crítica queda en un extremo horario.',2.5));
            if(plan.tipoPresencial!==false && requiereAyudantia && bloque>=16) blandas.push(crearRestriccionSolver('blanda','ayudantia','Margen ayudantía','La asignatura con ayudantía queda muy tarde para agregar apoyo.',2));
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
                costoBlando:costoRestriccionesSolver(blandas)
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
            const durasUnicas=duras.filter(r=>{const k=`${r.clave}|${r.detalle}`; if(clavesDuras.has(k)) return false; clavesDuras.add(k); return true;});
            const blandasUnicas=blandas.filter(r=>{const k=`${r.clave}|${r.detalle}`; if(clavesBlandas.has(k)) return false; clavesBlandas.add(k); return true;});
            return {
                valido:!duras.length,
                duras:durasUnicas,
                blandas:blandasUnicas,
                costoBlando:costoRestriccionesSolver(blandasUnicas)
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

        function aplicarCambiosCandidatos(basePlanes,candidatos){
            const cambios=new Map();
            candidatos.forEach(candidato=>(candidato.cambios||[]).forEach(plan=>cambios.set(String(plan.id),plan)));
            return basePlanes.map(plan=>cambios.has(String(plan.id))?Object.assign({},plan,cambios.get(String(plan.id))):Object.assign({},plan));
        }

        function candidatosMatematicosCompatibles(basePlanes,candidatos){
            const ids=new Set();
            for(const candidato of candidatos){
                for(const id of candidato.planIds||[]){
                    if(ids.has(String(id))) return false;
                    ids.add(String(id));
                }
            }
            const propuesta=aplicarCambiosCandidatos(basePlanes,candidatos);
            for(const plan of propuesta){
                if(!ids.has(String(plan.id))) continue;
                if(!evaluarRestriccionesPlan(plan,plan.dia,plan.bloque,propuesta).valido) return false;
            }
            return true;
        }

        function prepararOptimizacionMatematica(opciones={}){
            const data=getData();
            const basePlanes=Array.isArray(opciones.basePlanificaciones)?opciones.basePlanificaciones:data.planificaciones;
            const scoreInicial=scoreGlobalPlanificaciones(basePlanes);
            const objetivoEfectivo=resolverObjetivoOptimizacion(scoreInicial,opciones.objetivo||'auto');
            const params=parametrosSolverOptimizacion(opciones.profundidad||'equilibrado');
            const secciones=new Set(seccionesAlcanceOptimizacion(opciones));
            const estado={planes:basePlanes.map(p=>Object.assign({},p)),score:scoreInicial,movimientos:[],movidos:new Set()};
            const basePorId=new Map(basePlanes.map(plan=>[String(plan.id),plan]));
            const limite=opciones.profundidad==='profundo'?90:opciones.profundidad==='rapido'?35:60;
            const candidatos=generarMovimientosOptimizacion(estado,secciones,Object.assign({},opciones,{objetivo:objetivoEfectivo}),params)
                .slice(0,limite)
                .map((movimiento,indice)=>{
                    const cambios=movimiento.propuesta.filter(plan=>{
                        const antes=basePorId.get(String(plan.id));
                        return antes&&(Number(antes.dia)!==Number(plan.dia)||Number(antes.bloque)!==Number(plan.bloque));
                    }).map(plan=>Object.assign({},plan));
                    return {
                        id:`m${indice+1}`,
                        peso:Math.max(0.001,Number(movimiento.peso)||0.001),
                        planIds:cambios.map(plan=>plan.id),
                        cambios,
                        movimiento:movimiento.movimiento
                    };
                }).filter(candidato=>candidato.cambios.length);
            const incompatibles=[];
            for(let i=0;i<candidatos.length;i++){
                for(let j=i+1;j<candidatos.length;j++){
                    if(!candidatosMatematicosCompatibles(basePlanes,[candidatos[i],candidatos[j]])) incompatibles.push([candidatos[i].id,candidatos[j].id]);
                }
            }
            return {
                basePlanes:basePlanes.map(p=>Object.assign({},p)),
                scoreInicial,
                objetivo:opciones.objetivo||'auto',
                objetivoEfectivo,
                profundidad:opciones.profundidad||'equilibrado',
                maxMovimientos:Math.max(1,Math.min(30,Number(opciones.maxMovimientos)||8)),
                candidatos,
                incompatibles
            };
        }

        function construirResultadoOptimizacionMatematica(preparacion,seleccionados=[]){
            const elegidos=new Set((seleccionados||[]).map(String));
            const ordenados=(preparacion.candidatos||[]).filter(c=>elegidos.has(String(c.id))).sort((a,b)=>b.peso-a.peso);
            const aceptados=[];
            let scoreAceptado=preparacion.scoreInicial;
            for(const candidato of ordenados){
                if(aceptados.length>=preparacion.maxMovimientos) break;
                const tentativa=[...aceptados,candidato];
                if(!candidatosMatematicosCompatibles(preparacion.basePlanes,tentativa)) continue;
                const scoreTentativo=scoreGlobalPlanificaciones(aplicarCambiosCandidatos(preparacion.basePlanes,tentativa));
                if(scoreTentativo.score<scoreAceptado.score||scoreTentativo.perdida>scoreAceptado.perdida) continue;
                aceptados.push(candidato);
                scoreAceptado=scoreTentativo;
            }
            const planificaciones=aplicarCambiosCandidatos(preparacion.basePlanes,aceptados);
            const scoreFinal=scoreGlobalPlanificaciones(planificaciones);
            return {
                scoreInicial:preparacion.scoreInicial,
                scoreFinal,
                deltaScore:scoreFinal.score-preparacion.scoreInicial.score,
                perdidaReducida:preparacion.scoreInicial.perdida-scoreFinal.perdida,
                movimientos:aceptados.map(c=>c.movimiento),
                planificaciones,
                profundidad:preparacion.profundidad,
                objetivo:preparacion.objetivo,
                objetivoEfectivo:preparacion.objetivoEfectivo,
                diagnosticoInicial:diagnosticoOptimizacionScore(preparacion.scoreInicial).label,
                diagnosticoFinal:diagnosticoOptimizacionScore(scoreFinal).label,
                rutasEvaluadas:(preparacion.candidatos||[]).length,
                motor:'matematico',
                candidatosMatematicos:(preparacion.candidatos||[]).length,
                seleccionMatematica:ordenados.length,
                seleccionValidada:aceptados.length,
                busquedaLocal:null
            };
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

        function etiquetaMotorSolver(motor){
            return {heuristico:'Heurístico',matematico:'Matemático (GLPK)',hibrido:'Híbrido'}[motor]||'Heurístico';
        }

        function renderPreviewOptimizacion(sim){
            const motor=sim.motor||'heuristico';
            const tiempo=Number(sim.glpk?.tiempoMs||sim.hibrido?.tiempoMs)||0;
            const estado=sim.glpk?.estado||sim.hibrido?.estado||'completado';
            if(!sim.movimientos.length) return `<div class="auto-plan-preview">
                <div><span>Motor</span><strong>${ctx.escapeHTML(etiquetaMotorSolver(motor))}</strong></div>
                <div><span>Estado</span><strong>${ctx.escapeHTML(estado)}</strong></div>
                ${tiempo?`<div><span>Tiempo</span><strong>${tiempo} ms</strong></div>`:''}
            </div><div class="auto-plan-empty">No se encontraron movimientos que mejoren el score respetando los bloques fijos.</div>`;
            const resumenTipos=resumenTiposMovimientosOptimizacion(sim.movimientos);
            const explicacion=explicacionEscenarioOptimizacion(sim);
            return `<div class="auto-plan-preview">
                <div><span>Score global</span><strong>${sim.scoreInicial.score}% → ${sim.scoreFinal.score}%</strong></div>
                <div><span>Mejora</span><strong>${sim.deltaScore>=0?`+${sim.deltaScore}`:sim.deltaScore}</strong></div>
                <div><span>Costo total</span><strong>${sim.scoreInicial.costoTotal||sim.scoreInicial.perdida||0} → ${sim.scoreFinal.costoTotal||sim.scoreFinal.perdida||0}</strong></div>
                <div><span>Costo duro</span><strong>${sim.scoreInicial.costoDuro||0} → ${sim.scoreFinal.costoDuro||0}</strong></div>
                <div><span>Costo blando</span><strong>${sim.scoreInicial.costoBlando||0} → ${sim.scoreFinal.costoBlando||0}</strong></div>
                <div><span>Movimientos</span><strong>${sim.movimientos.length}</strong></div>
                <div><span>Motor</span><strong>${ctx.escapeHTML(etiquetaMotorSolver(motor))}</strong></div>
                <div><span>Estado</span><strong>${ctx.escapeHTML(estado)}</strong></div>
                ${tiempo?`<div><span>Tiempo</span><strong>${tiempo} ms</strong></div>`:''}
                ${sim.glpk?.variables!==undefined?`<div><span>Modelo GLPK</span><strong>${Number(sim.glpk.variables)||0} var. · ${Number(sim.glpk.restricciones)||0} rest.</strong></div>`:''}
                ${sim.hibrido?`<div><span>Etapas híbridas</span><strong>${Number(sim.hibrido.heuristico)||0} heur. · ${Number(sim.hibrido.matematico)||0} mat.</strong></div>`:''}
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
                            <span>${ctx.escapeHTML(etiquetaMotorSolver(sim.motor))} · Score ${sim.scoreInicial.score}% → ${sim.scoreFinal.score}% · ${viable?`${sim.movimientos.length} mov.`:'sin cambios'}</span>
                            <span>${sim.perdidaReducida>0?`Reduce pérdida ${sim.perdidaReducida}`:'Sin mejora detectada'}</span>
                        </button>`;
                    }).join('')}
                </div>
                <div id="optScenarioDetail">${renderPreviewOptimizacion(seleccionado?.sim||escenarios[0]?.sim||{movimientos:[]})}</div>
            </div>`;
        }

        let workerOptimizacionActivo=null;

        function cancelarWorkerOptimizacion(){
            if(!workerOptimizacionActivo) return;
            const activo=workerOptimizacionActivo;
            workerOptimizacionActivo=null;
            activo.cancelar();
        }

        function snapshotSolverWorker(data){
            const campos=['carreras','niveles','secciones','asignaturas','docentes','salas','asignaturaCarreraNivel','asignaturaSeccion','planificaciones','gruposDictacion','vinculosElectivos','configuracion','sel'];
            return Object.fromEntries(campos.map(campo=>[campo,JSON.parse(JSON.stringify(data[campo]??(campo==='configuracion'||campo==='sel'?{}:[])))]));
        }

        function ejecutarSolverEnWorker(opciones,objetivos=[]){
            if(typeof Worker==='undefined') return Promise.reject(new Error('solver-worker-no-disponible'));
            cancelarWorkerOptimizacion();
            const worker=new Worker('planificador_modulos/solver-worker.js?v=20260622-glpk5');
            const id=`solver-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            return new Promise((resolve,reject)=>{
                const limpiar=()=>{
                    clearTimeout(timer);
                    worker.terminate();
                    if(workerOptimizacionActivo?.worker===worker) workerOptimizacionActivo=null;
                };
                const timer=setTimeout(()=>{
                    limpiar();
                    reject(new Error('solver-worker-timeout'));
                },180000);
                const cancelar=()=>{
                    limpiar();
                    const error=new Error('solver-worker-cancelado');
                    error.code='solver-worker-cancelado';
                    reject(error);
                };
                workerOptimizacionActivo={worker,reject,cancelar};
                worker.onmessage=evento=>{
                    if(evento.data?.id!==id) return;
                    limpiar();
                    if(evento.data.ok) resolve(evento.data.resultados||[]);
                    else reject(new Error(evento.data.error||'solver-worker-error'));
                };
                worker.onerror=evento=>{
                    limpiar();
                    reject(new Error(evento.message||'solver-worker-error'));
                };
                worker.postMessage({id,data:snapshotSolverWorker(getData()),opciones,objetivos});
            });
        }

        async function calcularOptimizacionAsincrona(opciones){
            const metas=opciones.compararEscenarios?escenariosBaseOptimizacion():[{id:opciones.objetivo||'auto',titulo:'Propuesta',detalle:''}];
            try{
                const resultados=await ejecutarSolverEnWorker(opciones,metas.map(meta=>meta.id));
                const porObjetivo=new Map(resultados.map(item=>[item.objetivo,item.sim]));
                return metas.map(meta=>({meta,sim:porObjetivo.get(meta.id)})).filter(item=>item.sim);
            }catch(error){
                if(error?.code==='solver-worker-cancelado') throw error;
                console.warn('Worker de optimización no disponible; se usa el motor local.',error);
                const fallback=opciones.compararEscenarios
                    ? generarEscenariosOptimizacion(opciones)
                    : [{meta:metas[0],sim:simularOptimizacionIterativa(opciones)}];
                fallback.forEach(item=>{
                    item.sim.motor='heuristico';
                    item.sim.fallbackMotor={solicitado:opciones.motorSolver||'heuristico',motivo:String(error?.message||error)};
                });
                return fallback;
            }
        }

        function firmaPlanificacionesSolver(planes){
            let hash=2166136261;
            (planes||[]).forEach(plan=>{
                const texto=[plan.id,plan.seccionId,plan.asignaturaId,plan.docenteId,plan.salaId,plan.dia,plan.bloque,plan.fijo?1:0].join('|');
                for(let i=0;i<texto.length;i++){
                    hash^=texto.charCodeAt(i);
                    hash=Math.imul(hash,16777619);
                }
            });
            return `${(planes||[]).length}:${(hash>>>0).toString(16)}`;
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
            let secuenciaCalculo=0;
            let ultimaFirmaBase='';
            const leerOpciones=()=>({
                alcance:document.getElementById('optAlcance')?.value||opcionesIniciales.alcance,
                maxMovimientos:Number(document.getElementById('optMaxMovimientos')?.value)||8,
                pasadas:Number(document.getElementById('optPasadas')?.value)||2,
                profundidad:document.getElementById('optProfundidad')?.value||'equilibrado',
                objetivo:document.getElementById('optObjetivo')?.value||'auto',
                incluirVirtuales:document.getElementById('optIncluirVirtuales')?.checked!==false,
                compararEscenarios:document.getElementById('optCompararEscenarios')?.checked!==false,
                usarEtapas:document.getElementById('optUsarEtapas')?.checked!==false,
                motorSolver:['heuristico','matematico','hibrido'].includes(document.getElementById('optMotorSolver')?.value)?document.getElementById('optMotorSolver').value:'heuristico'
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
            const calcular=async(secuenciaSolicitada=null)=>{
                const secuencia=secuenciaSolicitada??++secuenciaCalculo;
                const opciones={
                    ...leerOpciones()
                };
                const firmaBase=firmaPlanificacionesSolver(getData().planificaciones);
                let escenarios;
                try{
                    escenarios=await calcularOptimizacionAsincrona(opciones);
                }catch(error){
                    if(error?.code==='solver-worker-cancelado') return null;
                    throw error;
                }
                if(secuencia!==secuenciaCalculo) return null;
                if(firmaBase!==firmaPlanificacionesSolver(getData().planificaciones)){
                    ctx.toast('La planificación cambió durante el cálculo. Se actualizará la propuesta.','info');
                    programarCalculo();
                    return null;
                }
                let sim;
                ultimosEscenarios=opciones.compararEscenarios?escenarios:[];
                if(opciones.compararEscenarios){
                    const mejor=mejorEscenarioOptimizacion(ultimosEscenarios);
                    escenarioSeleccionado=escenarioSeleccionado&&ultimosEscenarios.some(e=>e.meta.id===escenarioSeleccionado)?escenarioSeleccionado:mejor?.meta.id;
                    sim=(ultimosEscenarios.find(e=>e.meta.id===escenarioSeleccionado)||mejor)?.sim;
                }else{
                    sim=escenarios[0]?.sim;
                    escenarioSeleccionado=null;
                }
                if(!sim) return null;
                ultimaSim=sim;
                ultimasOpciones=opciones;
                ultimaFirmaBase=firmaBase;
                const cont=document.getElementById('optPreview');
                if(cont) cont.innerHTML=opciones.compararEscenarios?renderEscenariosOptimizacion(ultimosEscenarios,escenarioSeleccionado):renderPreviewOptimizacion(sim);
                if(opciones.compararEscenarios) enlazarEscenarios();
                const btn=document.getElementById('btnOptAplicar');
                if(btn) btn.disabled=!sim.movimientos.length;
                return {opciones,sim};
            };
            const programarCalculo=()=>{
                clearTimeout(timerCalculo);
                cancelarWorkerOptimizacion();
                const secuencia=++secuenciaCalculo;
                mostrarCalculando();
                timerCalculo=setTimeout(()=>calcular(secuencia).catch(error=>{
                    const cont=document.getElementById('optPreview');
                    if(cont) cont.innerHTML='<div class="auto-plan-empty">No se pudo calcular la propuesta. Revisa los criterios e intenta nuevamente.</div>';
                    ctx.toast(`No se pudo optimizar: ${error?.message||'error desconocido'}`,'error');
                }),40);
            };
            modal.innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal modal-wide">
                    <div class="modal-header">
                        <h3>Optimizar horario</h3>
                        <p>Busca mejoras moviendo solo bloques no fijos. Los candados se respetan siempre.</p>
                    </div>
                    <div class="auto-general-form">
                        <div class="form-group">
                            <label class="form-label">Motor</label>
                            <select class="form-select" id="optMotorSolver">
                                ${ctx.optionHTML('heuristico','Heurístico',getData().configuracion?.motorSolver==='heuristico'||!getData().configuracion?.motorSolver)}
                                ${ctx.optionHTML('matematico','Matemático (GLPK)',getData().configuracion?.motorSolver==='matematico')}
                                ${ctx.optionHTML('hibrido','Híbrido',getData().configuracion?.motorSolver==='hibrido')}
                            </select>
                        </div>
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
            ['optMotorSolver','optAlcance','optMaxMovimientos','optPasadas','optProfundidad','optObjetivo','optIncluirVirtuales','optCompararEscenarios','optUsarEtapas'].forEach(id=>document.getElementById(id).onchange=programarCalculo);
            programarCalculo();
            document.getElementById('btnOptCancelar').onclick=()=>{ cancelarWorkerOptimizacion(); ctx.cerrarModal(); };
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget){ cancelarWorkerOptimizacion(); ctx.cerrarModal(); }};
            document.getElementById('btnOptAplicar').onclick=async()=>{
                const opcionesActuales=leerOpciones();
                const debeRecalcular=!ultimaSim||ultimaFirmaBase!==firmaPlanificacionesSolver(data.planificaciones)||JSON.stringify(opcionesActuales)!==JSON.stringify(ultimasOpciones);
                const resultado=debeRecalcular?await calcular():{opciones:ultimasOpciones,sim:ultimaSim};
                if(!resultado) return;
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
                    motor:sim.motor||opciones.motorSolver||'heuristico',
                    glpk:sim.glpk||null,
                    hibrido:sim.hibrido||null,
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
                .map(sec=>calcularPlanAutoSeccionPara(sec.id,estrategia,opciones))
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

        function analizarDiagnosticoPredictivoAutoGeneral(opciones){
            const data=getData();
            const resumen=calcularResumenAutoGeneral(opciones);
            const riesgos=[];
            const recomendaciones=[];
            const agregar=(nivel,titulo,detalle,meta={})=>{
                riesgos.push(Object.assign({nivel,titulo,detalle},meta));
            };
            const keyRiesgo=(r)=>[r.nivel,r.titulo,r.detalle,r.seccionId||'',r.asignaturaId||'',r.docenteId||'',r.salaId||''].join('|');
            const docentesPorAsignatura=new Map();
            data.docentes.forEach(d=>{
                (d.asignaturasQueDicta||[]).forEach(asigId=>{
                    if(!docentesPorAsignatura.has(asigId)) docentesPorAsignatura.set(asigId,[]);
                    docentesPorAsignatura.get(asigId).push(d);
                });
            });
            if(!resumen.planes.length){
                agregar('alto','Sin secciones en alcance','El alcance seleccionado no contiene secciones pendientes para auto-planificar.');
            }
            if(resumen.requerido>0 && resumen.totalBloques===0){
                agregar('alto','Sin bloques viables','La simulación no encontró bloques asignables con los filtros actuales.');
            }
            if(resumen.pendientes>0){
                agregar('alto','Asignaturas pendientes',`${resumen.pendientes} asignatura(s) quedarían sin resolver antes de aplicar.`,{tipo:'pendientes'});
                recomendaciones.push('Revisar primero asignaturas sin docente, sin cupo o filtradas por transversales/virtuales.');
            }
            if(resumen.parciales>0){
                agregar('medio','Asignaciones parciales',`${resumen.parciales} asignatura(s) podrían quedar con menos bloques que los requeridos.`,{tipo:'parciales'});
                recomendaciones.push('Ejecutar por sección o ajustar disponibilidad/salas antes de Auto-general si hay muchas asignaciones parciales.');
            }
            if(resumen.nn>0){
                agregar('medio','Uso probable de Docente NN',`${resumen.nn} fila(s) usarían Docente NN como apoyo temporal.`,{tipo:'docente_nn'});
                recomendaciones.push('Cargar o asociar docentes antes de cerrar la planificación definitiva.');
            }
            if(resumen.transversales>0){
                agregar('medio','Coordinación externa',`${resumen.transversales} fila(s) corresponden a transversales o coordinación externa.`,{tipo:'transversales'});
            }
            const pendientesPorMotivo=new Map();
            resumen.planes.forEach(plan=>{
                const seccionId=plan.sec?.id;
                const etiquetaSeccion=[plan.sec?.nombre, plan.carrera?.codigo||plan.carrera?.nombre, plan.nivel?.nombre].filter(Boolean).join(' · ');
                const accionesConBloques=plan.acciones.filter(a=>(Number(a.cant)||0)>0);
                const requeridas=plan.acciones.filter(a=>(Number(a.requerido)||0)>0);
                const totalPlanSeccion=accionesConBloques.reduce((acc,a)=>acc+(Number(a.cant)||0),0);
                if(requeridas.length && !totalPlanSeccion && plan.pendientes.length){
                    agregar('alto','Sección sin propuesta',`${etiquetaSeccion}: no se proyectan bloques pese a tener requerimientos pendientes.`,{seccionId});
                }
                plan.pendientes.forEach(p=>{
                    const motivo=p.motivo||'Pendiente';
                    pendientesPorMotivo.set(motivo,(pendientesPorMotivo.get(motivo)||0)+1);
                    agregar(motivo==='Sin docente'?'alto':'medio',motivo,`${etiquetaSeccion}: ${p.asig?.codigo||''} ${p.asig?.nombre||''}`.trim(),{seccionId,asignaturaId:p.asig?.id||''});
                });
                accionesConBloques.forEach(a=>{
                    const requerido=Number(a.requerido)||0;
                    const cant=Number(a.cant)||0;
                    const asigLabel=[a.asig?.codigo,a.asig?.nombre].filter(Boolean).join(' - ');
                    if(requerido && cant<requerido){
                        agregar('medio','Cobertura parcial',`${etiquetaSeccion}: ${asigLabel} proyecta ${cant}/${requerido} bloque(s).`,{seccionId,asignaturaId:a.asig?.id||'',tipo:a.esPresencial?'presencial':'virtual',docenteId:a.docente?.id||'',salaId:a.salaId||''});
                    }
                    if(a.docente?.id===ctx.DOCENTE_NN_ID){
                        agregar('medio','Docente por definir',`${etiquetaSeccion}: ${asigLabel} se proyecta con Docente NN.`,{seccionId,asignaturaId:a.asig?.id||'',tipo:a.esPresencial?'presencial':'virtual',docenteId:a.docente?.id||'',salaId:a.salaId||''});
                    }
                    if(a.salaId===ctx.SALA_TRO2_ID && a.esPresencial){
                        agregar('medio','Sala provisional',`${etiquetaSeccion}: ${asigLabel} se proyecta con TRO2/Terreno.`,{seccionId,asignaturaId:a.asig?.id||'',tipo:'presencial',docenteId:a.docente?.id||'',salaId:a.salaId||''});
                    }
                    if((a.asig?.area==='transversal'||a.asig?.controlHorario==='coordinacion-externa')){
                        agregar('bajo','Requiere coordinación',`${etiquetaSeccion}: ${asigLabel} puede requerir negociación externa.`,{seccionId,asignaturaId:a.asig?.id||'',tipo:a.esPresencial?'presencial':'virtual',docenteId:a.docente?.id||'',salaId:a.salaId||''});
                    }
                    if(a.asig?.condicion==='alta-reprobacion'||a.asig?.condicion==='alta-reprobacion-ayudantia'){
                        agregar('bajo','Asignatura crítica',`${etiquetaSeccion}: ${asigLabel} requiere revisar horario final.`,{seccionId,asignaturaId:a.asig?.id||'',tipo:a.esPresencial?'presencial':'virtual',docenteId:a.docente?.id||'',salaId:a.salaId||''});
                    }
                });
                asignaturasDeSeccion(seccionId).forEach(asigId=>{
                    const asig=data.asignaturas.find(a=>a.id===asigId);
                    if(!asig) return;
                    const docentes=(docentesPorAsignatura.get(asigId)||[]).filter(d=>d.id!==ctx.DOCENTE_NN_ID);
                    if(!docentes.length){
                        agregar('alto','Sin docente asociado',`${etiquetaSeccion}: ${asig.codigo||''} ${asig.nombre||''}`.trim(),{seccionId,asignaturaId:asigId});
                    }
                    if((Number(asig.bloquesPresenciales)||0)>0 && !(asig.salasPreferidas||[]).length){
                        agregar('bajo','Sin sala sugerida',`${etiquetaSeccion}: ${asig.codigo||''} puede terminar usando TRO2 si no hay sala definida.`,{seccionId,asignaturaId:asigId,tipo:'presencial'});
                    }
                });
                for(let dia=0;dia<ctx.DIAS.length;dia++){
                    const carga=planesVisiblesSeccionDia(seccionId,dia).length;
                    if(carga>=9) agregar('medio','Día ya cargado',`${etiquetaSeccion}: ${ctx.DIAS[dia]} tiene ${carga} bloque(s) antes de auto-planificar.`,{seccionId});
                }
            });
            if(pendientesPorMotivo.size){
                [...pendientesPorMotivo.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).forEach(([motivo,cantidad])=>{
                    recomendaciones.push(`${cantidad} pendiente(s) por "${motivo}".`);
                });
            }
            if(resumen.scoreEstimado<resumen.scoreActual){
                recomendaciones.push('La simulación baja el score global; conviene revisar estrategia o alcance antes de aplicar.');
            }else if(resumen.deltaScore>0){
                recomendaciones.push(`La simulación mejora el score global en ${resumen.deltaScore} punto(s).`);
            }
            if(!recomendaciones.length) recomendaciones.push('El alcance se ve viable. Revisa igualmente Docente NN, TRO2 y pendientes después de aplicar.');
            const vistos=new Set();
            const riesgosUnicos=riesgos
                .filter(r=>{const k=keyRiesgo(r); if(vistos.has(k)) return false; vistos.add(k); return true;})
                .sort((a,b)=>({alto:0,medio:1,bajo:2}[a.nivel]-{alto:0,medio:1,bajo:2}[b.nivel])||String(a.titulo).localeCompare(String(b.titulo)));
            return {
                resumen,
                riesgos:riesgosUnicos,
                recomendaciones:[...new Set(recomendaciones)].slice(0,8),
                conteo:{
                    alto:riesgosUnicos.filter(r=>r.nivel==='alto').length,
                    medio:riesgosUnicos.filter(r=>r.nivel==='medio').length,
                    bajo:riesgosUnicos.filter(r=>r.nivel==='bajo').length
                }
            };
        }

        function confirmarDiagnosticoPredictivoAutoGeneral(opciones){
            return new Promise(resolve=>{
                const modal=document.getElementById('modalContainer');
                let opcionesActuales=guardarAjustesRapidosAutoGeneral(Object.assign({},opciones),normalizarAjustesRapidosAutoGeneral(opciones));
                const etiquetaDocente=(d)=>d.id===ctx.DOCENTE_NN_ID?'Docente NN':`${d.nombre||''} ${d.apellido||''}`.trim()||'Docente';
                const docentesParaAsignatura=(asigId,seleccionado='')=>{
                    const data=getData();
                    let docentes=data.docentes.filter(d=>d.id===ctx.DOCENTE_NN_ID||d.asignaturasQueDicta?.includes(asigId));
                    if(!docentes.some(d=>d.id!==ctx.DOCENTE_NN_ID)){
                        docentes=data.docentes.slice();
                    }
                    if(seleccionado&&!docentes.some(d=>d.id===seleccionado)){
                        const actual=data.docentes.find(d=>d.id===seleccionado);
                        if(actual) docentes.push(actual);
                    }
                    return docentes.sort((a,b)=>(a.id===ctx.DOCENTE_NN_ID?1:0)-(b.id===ctx.DOCENTE_NN_ID?1:0)||etiquetaDocente(a).localeCompare(etiquetaDocente(b)));
                };
                const salasParaAsignatura=(asigId,seleccionada='')=>{
                    const data=getData();
                    const asig=data.asignaturas.find(a=>a.id===asigId);
                    const preferidas=(asig?.salasPreferidas||[]).map(id=>data.salas.find(s=>s.id===id)).filter(Boolean);
                    const base=preferidas.length?preferidas:data.salas.filter(s=>!s.esVirtual&&s.id!==ctx.SALA_VIRTUAL_ID);
                    if(seleccionada&&!base.some(s=>s.id===seleccionada)){
                        const actual=data.salas.find(s=>s.id===seleccionada);
                        if(actual) base.push(actual);
                    }
                    return base.filter(s=>s.id!==ctx.SALA_VIRTUAL_ID).sort((a,b)=>(a.nombre||'').localeCompare(b.nombre||'',undefined,{numeric:true,sensitivity:'base'}));
                };
                const estrategias=[
                    {id:'balanceada',nombre:'Balanceada',detalle:'Equilibra cobertura, ventanas y carga.'},
                    {id:'compacta',nombre:'Compacta',detalle:'Favorece bloques continuos por asignatura.'},
                    {id:'docente',nombre:'Docente preferente',detalle:'Prioriza continuidad y carga docente.'}
                ];
                const puntajeEscenarioPredictivo=(resumen)=>(
                    (resumen.deltaScore*1800)+
                    (resumen.calidad*1000)+
                    (resumen.totalBloques*24)-
                    (resumen.pendientes*85)-
                    (resumen.parciales*50)-
                    (resumen.nn*38)-
                    (resumen.omitidas*20)-
                    (resumen.transversales*8)
                );
                const escenariosPredictivos=()=>estrategias.map(e=>{
                    const opcionesEscenario=Object.assign({},opcionesActuales,{estrategia:e.id});
                    const resumen=calcularResumenAutoGeneral(opcionesEscenario);
                    return Object.assign({},e,{resumen,puntaje:puntajeEscenarioPredictivo(resumen)});
                }).sort((a,b)=>b.puntaje-a.puntaje);
                const recomendacionEscenario=(escenarios)=>{
                    const recomendado=escenarios[0];
                    if(!recomendado) return 'Sin escenarios evaluables para el alcance actual.';
                    const razones=[];
                    const maxCalidad=Math.max(...escenarios.map(e=>e.resumen.calidad));
                    const maxBloques=Math.max(...escenarios.map(e=>e.resumen.totalBloques));
                    const minPendientes=Math.min(...escenarios.map(e=>e.resumen.pendientes));
                    const minParciales=Math.min(...escenarios.map(e=>e.resumen.parciales));
                    const minNN=Math.min(...escenarios.map(e=>e.resumen.nn));
                    const maxDelta=Math.max(...escenarios.map(e=>e.resumen.deltaScore));
                    if(recomendado.resumen.deltaScore===maxDelta&&maxDelta>0) razones.push(`mejora el score en ${maxDelta} punto(s)`);
                    if(recomendado.resumen.calidad===maxCalidad) razones.push('entrega mayor factibilidad');
                    if(recomendado.resumen.totalBloques===maxBloques) razones.push('proyecta más bloques');
                    if(recomendado.resumen.pendientes===minPendientes) razones.push('deja menos pendientes');
                    if(recomendado.resumen.parciales===minParciales) razones.push('reduce parciales');
                    if(recomendado.resumen.nn===minNN) razones.push('usa menos Docente NN');
                    if(!razones.length) razones.push('logra el mejor equilibrio con los pesos actuales');
                    return `Escenario recomendado: ${recomendado.nombre}, porque ${razones.slice(0,3).join(', ')}.`;
                };
                const renderEscenariosPredictivos=(escenarios)=>{
                    const recomendadoId=escenarios[0]?.id;
                    const actual=opcionesActuales.estrategia||'balanceada';
                    return `<div class="predictive-scenarios">
                        <div class="predictive-scenarios-head">
                            <strong>Escenarios antes de aplicar</strong>
                            <span>${ctx.escapeHTML(recomendacionEscenario(escenarios))}</span>
                        </div>
                        <div class="predictive-scenario-grid">
                            ${escenarios.map(e=>{
                                const r=e.resumen;
                                const activo=e.id===actual;
                                const recomendado=e.id===recomendadoId;
                                const color=r.calidad>=80?'var(--success)':r.calidad>=55?'var(--warning)':'var(--danger)';
                                return `<button class="predictive-scenario ${activo?'active':''}" data-predictive-strategy="${ctx.escapeAttr(e.id)}" type="button">
                                    <strong>${ctx.escapeHTML(e.nombre)}${recomendado?' · Recomendada':''}</strong>
                                    <span>${ctx.escapeHTML(e.detalle)}</span>
                                    <span>${r.totalBloques}/${r.requerido} bloques · calidad ${r.calidad}%</span>
                                    <span>${r.pendientes} pendientes · ${r.parciales} parciales · NN ${r.nn}</span>
                                    <i><b style="width:${Math.max(0,Math.min(100,r.calidad))}%;background:${color};"></b></i>
                                    <small>Score ${r.scoreActual}% → ${r.scoreEstimado}%</small>
                                </button>`;
                            }).join('')}
                        </div>
                    </div>`;
                };
                const renderPropuestaPredictiva=(diagnostico)=>{
                    const detalle=diagnostico.resumen.simulacion?.detalle||[];
                    if(!detalle.length) return `<div class="predictive-proposal">
                        <div class="predictive-scenarios-head">
                            <strong>Propuesta explicada</strong>
                            <span>No hay bloques proyectados para explicar con el alcance actual.</span>
                        </div>
                    </div>`;
                    const filas=detalle.slice(0,16).map(item=>`
                        <tr>
                            <td>
                                <strong>${ctx.escapeHTML(item.seccion)}</strong>
                                <small>${ctx.escapeHTML(item.carreraNivel||'')}</small>
                            </td>
                            <td>
                                <strong>${ctx.escapeHTML([item.codigo,item.asignatura].filter(Boolean).join(' - '))}</strong>
                                <small>${ctx.escapeHTML(item.tipo)} · ${ctx.escapeHTML(item.docente)} · ${ctx.escapeHTML(item.sala)}</small>
                            </td>
                            <td>
                                <span class="predictive-blocks">${item.bloques.map(b=>`<b>${ctx.escapeHTML(b)}</b>`).join('')}</span>
                                <small>${item.cant}/${item.requerido} bloque(s)</small>
                            </td>
                            <td>
                                ${item.razones.length?item.razones.map(r=>`<span>${ctx.escapeHTML(r)}</span>`).join(''):'<span>Asignación viable según restricciones actuales</span>'}
                            </td>
                            <td>
                                ${item.alertas.length?item.alertas.map(a=>`<em class="auto-plan-alert ${a.clase}">${ctx.escapeHTML(a.texto)}</em>`).join(' '):'<small>Sin alertas</small>'}
                            </td>
                        </tr>`).join('');
                    return `<div class="predictive-proposal">
                        <div class="predictive-scenarios-head">
                            <strong>Propuesta explicada</strong>
                            <span>Vista previa de por qué el motor ubicaría estos bloques antes de aplicar la planificación.</span>
                        </div>
                        <div class="dashboard-detail-table predictive-proposal-table">
                            <table class="report-table">
                                <thead><tr><th>Sección</th><th>Asignatura</th><th>Bloques</th><th>Razones</th><th>Alertas</th></tr></thead>
                                <tbody>${filas}</tbody>
                            </table>
                        </div>
                        ${detalle.length>16?`<p class="auto-plan-empty">Se muestran 16 de ${detalle.length} filas proyectadas. El resumen completo quedará disponible después de aplicar.</p>`:''}
                    </div>`;
                };
                const renderCorreccion=(r,ajustes)=>{
                    if(!r.seccionId) return '';
                    const key=keyAjusteAutoGeneral(r.seccionId,r.asignaturaId||'',r.tipo||'');
                    const keyBase=keyAjusteAutoGeneral(r.seccionId,r.asignaturaId||'','');
                    const tieneAsignatura=!!r.asignaturaId;
                    const docenteSel=ajustes.docentes[key]||ajustes.docentes[keyBase]||r.docenteId||'';
                    const salaSel=ajustes.salas[key]||ajustes.salas[keyBase]||r.salaId||'';
                    const omitida=new Set(ajustes.omitidas||[]).has(key)||new Set(ajustes.omitidas||[]).has(keyBase);
                    const excluida=new Set(ajustes.seccionesExcluidas||[]).has(r.seccionId);
                    return `<div class="predictive-quick-actions">
                        ${tieneAsignatura?`<select class="form-select predictive-doc-select" data-key="${ctx.escapeAttr(key)}" data-base-key="${ctx.escapeAttr(keyBase)}">
                            <option value="">Docente automático</option>
                            ${docentesParaAsignatura(r.asignaturaId,docenteSel).map(d=>ctx.optionHTML(d.id,etiquetaDocente(d),d.id===docenteSel)).join('')}
                        </select>`:''}
                        ${tieneAsignatura&&r.tipo!=='virtual'?`<select class="form-select predictive-room-select" data-key="${ctx.escapeAttr(key)}" data-base-key="${ctx.escapeAttr(keyBase)}">
                            <option value="">Sala automática</option>
                            ${salasParaAsignatura(r.asignaturaId,salaSel).map(s=>ctx.optionHTML(s.id,etiquetaSalaConCapacidad(s),s.id===salaSel)).join('')}
                        </select>`:''}
                        ${tieneAsignatura?`<button class="btn btn-xs predictive-toggle-omit ${omitida?'active':''}" data-key="${ctx.escapeAttr(keyBase)}" type="button">${omitida?'Incluir':'Omitir'}</button>`:''}
                        <button class="btn btn-xs predictive-toggle-section ${excluida?'active':''}" data-seccion="${ctx.escapeAttr(r.seccionId)}" type="button">${excluida?'Incluir sección':'Excluir sección'}</button>
                        <button class="btn btn-xs predictive-clear" data-key="${ctx.escapeAttr(keyBase)}" data-seccion="${ctx.escapeAttr(r.seccionId)}" type="button">Limpiar</button>
                        <button class="btn btn-xs predictive-review" data-seccion="${ctx.escapeAttr(r.seccionId)}" data-asignatura="${ctx.escapeAttr(r.asignaturaId||'')}" type="button">Ir</button>
                    </div>`;
                };
                const render=()=>{
                    const ajustes=normalizarAjustesRapidosAutoGeneral(opcionesActuales);
                    const escenarios=escenariosPredictivos();
                    const diagnostico=analizarDiagnosticoPredictivoAutoGeneral(opcionesActuales);
                    const riesgos=diagnostico.riesgos;
                    const filas=riesgos.slice(0,18).map(r=>`
                        <tr>
                            <td><span class="predictive-risk ${ctx.escapeAttr(r.nivel)}">${ctx.escapeHTML(r.nivel)}</span></td>
                            <td><strong>${ctx.escapeHTML(r.titulo)}</strong><small>${ctx.escapeHTML(r.detalle)}</small></td>
                            <td>${renderCorreccion(r,ajustes)||'<span class="auto-plan-empty">Sin acción directa</span>'}</td>
                        </tr>`).join('');
                    const calidad=diagnostico.resumen.calidad;
                    const ajustesCount=(Object.keys(ajustes.docentes||{}).length)+(Object.keys(ajustes.salas||{}).length)+(ajustes.omitidas||[]).length+(ajustes.seccionesExcluidas||[]).length;
                    modal.innerHTML=`
                    <div class="modal-overlay" id="modalOverlay"><div class="modal auto-general-modal predictive-modal">
                        <div class="modal-header">
                            <h3>Diagnóstico predictivo</h3>
                            <p>Corrige rápidamente docente, sala, omisiones o secciones antes de aplicar Auto-general. Estos ajustes son solo para esta ejecución.</p>
                        </div>
                        <div class="predictive-score-panel ${diagnostico.conteo.alto?'danger':diagnostico.conteo.medio?'warning':'ok'}">
                            <div><span>Factibilidad estimada</span><strong>${calidad}%</strong></div>
                            <div><span>Bloques proyectados</span><strong>${diagnostico.resumen.totalBloques}/${diagnostico.resumen.requerido}</strong></div>
                            <div><span>Score global</span><strong>${diagnostico.resumen.scoreActual}% → ${diagnostico.resumen.scoreEstimado}%</strong></div>
                            <div><span>Ajustes rápidos</span><strong>${ajustesCount}</strong></div>
                        </div>
                        <div class="predictive-summary-grid">
                            <div><span>Secciones</span><strong>${diagnostico.resumen.planes.length}</strong></div>
                            <div><span>Afectadas</span><strong>${diagnostico.resumen.seccionesAfectadas}</strong></div>
                            <div><span>Pendientes</span><strong>${diagnostico.resumen.pendientes}</strong></div>
                            <div><span>Parciales</span><strong>${diagnostico.resumen.parciales}</strong></div>
                            <div><span>Docente NN</span><strong>${diagnostico.resumen.nn}</strong></div>
                            <div><span>Virtuales</span><strong>${diagnostico.resumen.virtuales}</strong></div>
                        </div>
                        <div class="predictive-recommendations">
                            <strong>Recomendaciones</strong>
                            ${diagnostico.recomendaciones.map(r=>`<span>${ctx.escapeHTML(r)}</span>`).join('')}
                        </div>
                        ${renderEscenariosPredictivos(escenarios)}
                        ${renderPropuestaPredictiva(diagnostico)}
                        <div class="dashboard-detail-table predictive-table">
                            <table class="report-table">
                                <thead><tr><th>Nivel</th><th>Detalle</th><th>Corrección rápida</th></tr></thead>
                                <tbody>${filas||'<tr><td colspan="3">No se detectaron riesgos relevantes para este alcance.</td></tr>'}</tbody>
                            </table>
                        </div>
                        ${riesgos.length>18?`<p class="auto-plan-empty">Se muestran 18 de ${riesgos.length} riesgos detectados. Revisa Dashboard/Reportes después de aplicar.</p>`:''}
                        <div class="modal-actions">
                            <button class="btn" id="btnCancelarDiagnosticoAuto">Cancelar</button>
                            <button class="btn" id="btnVolverOpcionesAuto">Volver a opciones</button>
                            <button class="btn btn-primary" id="btnContinuarDiagnosticoAuto" ${diagnostico.resumen.totalBloques?'':'disabled'}>Continuar con Auto-general</button>
                        </div>
                    </div></div>`;
                    enlazar();
                };
                const actualizar=(mutar)=>{
                    const ajustes=normalizarAjustesRapidosAutoGeneral(opcionesActuales);
                    mutar(ajustes);
                    guardarAjustesRapidosAutoGeneral(opcionesActuales,ajustes);
                    render();
                };
                const cerrar=(valor)=>{ modal.innerHTML=''; resolve(valor); };
                const enlazar=()=>{
                    document.getElementById('btnCancelarDiagnosticoAuto').onclick=()=>cerrar(false);
                    document.getElementById('btnVolverOpcionesAuto').onclick=()=>cerrar('volver');
                    document.getElementById('btnContinuarDiagnosticoAuto').onclick=()=>cerrar(opcionesActuales);
                    document.getElementById('modalOverlay').onclick=e=>{ if(e.target===e.currentTarget) cerrar(false); };
                    modal.querySelectorAll('.predictive-doc-select').forEach(sel=>sel.onchange=()=>actualizar(aj=>{
                        if(sel.value) aj.docentes[sel.dataset.key]=sel.value;
                        else { delete aj.docentes[sel.dataset.key]; delete aj.docentes[sel.dataset.baseKey]; }
                    }));
                    modal.querySelectorAll('.predictive-room-select').forEach(sel=>sel.onchange=()=>actualizar(aj=>{
                        if(sel.value) aj.salas[sel.dataset.key]=sel.value;
                        else { delete aj.salas[sel.dataset.key]; delete aj.salas[sel.dataset.baseKey]; }
                    }));
                    modal.querySelectorAll('.predictive-toggle-omit').forEach(btn=>btn.onclick=()=>actualizar(aj=>{
                        const set=new Set(aj.omitidas||[]);
                        if(set.has(btn.dataset.key)) set.delete(btn.dataset.key);
                        else set.add(btn.dataset.key);
                        aj.omitidas=[...set];
                    }));
                    modal.querySelectorAll('.predictive-toggle-section').forEach(btn=>btn.onclick=()=>actualizar(aj=>{
                        const set=new Set(aj.seccionesExcluidas||[]);
                        if(set.has(btn.dataset.seccion)) set.delete(btn.dataset.seccion);
                        else set.add(btn.dataset.seccion);
                        aj.seccionesExcluidas=[...set];
                    }));
                    modal.querySelectorAll('.predictive-clear').forEach(btn=>btn.onclick=()=>actualizar(aj=>{
                        Object.keys(aj.docentes||{}).forEach(k=>{ if(k.startsWith(btn.dataset.key)||k===btn.dataset.key) delete aj.docentes[k]; });
                        Object.keys(aj.salas||{}).forEach(k=>{ if(k.startsWith(btn.dataset.key)||k===btn.dataset.key) delete aj.salas[k]; });
                        aj.omitidas=(aj.omitidas||[]).filter(k=>k!==btn.dataset.key&&!k.startsWith(btn.dataset.key));
                        aj.seccionesExcluidas=(aj.seccionesExcluidas||[]).filter(id=>id!==btn.dataset.seccion);
                    }));
                    modal.querySelectorAll('.predictive-review').forEach(btn=>btn.onclick=()=>{
                        const seccionId=btn.dataset.seccion;
                        const asignaturaId=btn.dataset.asignatura||null;
                        cerrar(false);
                        ctx.irASeccion?.(seccionId,{asignaturaId,mensaje:'Sección abierta desde diagnóstico predictivo'});
                    });
                    modal.querySelectorAll('[data-predictive-strategy]').forEach(btn=>btn.onclick=()=>{
                        opcionesActuales.estrategia=btn.dataset.predictiveStrategy||'balanceada';
                        render();
                    });
                };
                render();
            });
        }

        function confirmarAutoGeneral(opcionesIniciales){
            return new Promise(resolve=>{
                let opciones=Object.assign({},opcionesIniciales);
                if(!Array.isArray(opciones.seccionIds)) opciones.seccionIds=idsSeccionesPorAlcanceAutoGeneral(opciones);
                let resumen=calcularResumenAutoGeneral(opciones);
                let autoGeneralScrollTop=0;
                let autoGeneralModalScrollTop=0;
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
                                <label class="form-label">Preselección rápida</label>
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
                        ${renderAlcanceDetalladoAutoGeneral(opciones,resumen)}
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
                        seccionIds:(document.getElementById('autoGeneralSeccionesSeleccionadas')?.value||'').split(',').map(x=>x.trim()).filter(Boolean),
                        expandScope:opciones.expandScope||[],
                        ...leerPanelCriteriosAuto('autoGeneralCriterio')
                    });
                    const recordarScrollAutoGeneral=()=>{
                        autoGeneralModalScrollTop=document.querySelector('.auto-general-modal')?.scrollTop||0;
                        autoGeneralScrollTop=document.querySelector('.auto-general-scope-tree')?.scrollTop||0;
                    };
                    const recalcular=()=>{ recordarScrollAutoGeneral(); opciones=leerOpciones(); guardarCriteriosAuto(opciones); resumen=calcularResumenAutoGeneral(opciones); render(); };
                    document.getElementById('autoGeneralAlcance').onchange=()=>{
                        recordarScrollAutoGeneral();
                        opciones=leerOpciones();
                        opciones.seccionIds=idsSeccionesPorAlcanceAutoGeneral(opciones);
                        guardarCriteriosAuto(opciones);
                        resumen=calcularResumenAutoGeneral(opciones);
                        render();
                    };
                    ['autoGeneralEstrategia','autoGeneralSoloPendientes','autoGeneralVespertino'].forEach(id=>document.getElementById(id).onchange=recalcular);
                    document.querySelectorAll('[id^="autoGeneralCriterio"]').forEach(ctrl=>ctrl.onchange=recalcular);
                    document.querySelectorAll('.auto-general-scope-check').forEach(ctrl=>ctrl.onchange=()=>{
                        recordarScrollAutoGeneral();
                        const actuales=new Set((opciones.seccionIds||[]).filter(Boolean));
                        const expandidos=new Set(opciones.expandScope||[]);
                        const ids=(ctrl.dataset.ids||'').split(',').filter(Boolean);
                        ids.forEach(id=>ctrl.checked?actuales.add(id):actuales.delete(id));
                        let nodo=ctrl.closest('details');
                        while(nodo){
                            if(nodo.dataset.scopeKey) expandidos.add(nodo.dataset.scopeKey);
                            nodo=nodo.parentElement?.closest?.('details');
                        }
                        opciones=leerOpciones();
                        opciones.seccionIds=[...actuales];
                        opciones.expandScope=[...expandidos];
                        guardarCriteriosAuto(opciones);
                        resumen=calcularResumenAutoGeneral(opciones);
                        render();
                    });
                    document.querySelectorAll('[data-auto-scope-action]').forEach(btn=>btn.onclick=()=>{
                        recordarScrollAutoGeneral();
                        const action=btn.dataset.autoScopeAction;
                        opciones=leerOpciones();
                        if(action==='all') opciones.seccionIds=(document.getElementById('autoGeneralTodasSecciones')?.value||'').split(',').filter(Boolean);
                        else if(action==='none') opciones.seccionIds=[];
                        guardarCriteriosAuto(opciones);
                        resumen=calcularResumenAutoGeneral(opciones);
                        render();
                    });
                    document.querySelectorAll('[data-estrategia-general]').forEach(btn=>btn.onclick=()=>{
                        recordarScrollAutoGeneral();
                        opciones.estrategia=btn.dataset.estrategiaGeneral;
                        guardarCriteriosAuto(opciones);
                        resumen=calcularResumenAutoGeneral(opciones);
                        render();
                    });
                    document.getElementById('btnCancelarAutoGeneral').onclick=()=>{ctx.cerrarModal();resolve(null);};
                    document.getElementById('btnDetalleAutoGeneral').onclick=abrirDetalleGeneral;
                    document.getElementById('btnAplicarAutoGeneral').onclick=()=>{ctx.cerrarModal();resolve(opciones);};
                    document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget){ctx.cerrarModal();resolve(null);}};
                    const autoGeneralModal=document.querySelector('.auto-general-modal');
                    if(autoGeneralModal) autoGeneralModal.scrollTop=autoGeneralModalScrollTop;
                    const scopeTree=document.querySelector('.auto-general-scope-tree');
                    if(scopeTree) scopeTree.scrollTop=autoGeneralScrollTop;
                };
                render();
            });
        }

        function mostrarResumenAutoGeneral(resultado){
            const modal=document.getElementById('modalContainer');
            if(!modal) return;
            const bloquesKey=(arr)=>(arr||[]).slice().sort().join('|');
            const propuestaMap=new Map((resultado.propuestaPrevia||[]).map(item=>[
                [item.seccionId,item.asignaturaId,item.tipo].join('|'),
                item
            ]));
            const detalleAsignaturas=resultado.detalleAsignaturas||[];
            const filasAsignaturas=detalleAsignaturas.slice(0,24).map(item=>{
                const previo=propuestaMap.get([item.seccionId,item.asignaturaId,item.tipo].join('|'));
                const coincide=previo&&bloquesKey(previo.bloques)===bloquesKey(item.bloques);
                const estado=previo?(coincide?{txt:'Coincide',cls:'success'}:{txt:'Ajustado',cls:'warning'}):{txt:'Nuevo',cls:'info'};
                return `<tr>
                    <td><strong>${ctx.escapeHTML(item.seccion||'')}</strong><small>${ctx.escapeHTML(item.carreraNivel||'')}</small></td>
                    <td><strong>${ctx.escapeHTML([item.codigo,item.asignatura].filter(Boolean).join(' - '))}</strong><small>${ctx.escapeHTML(item.tipo)} · ${ctx.escapeHTML(item.docente)} · ${ctx.escapeHTML(item.sala)}</small></td>
                    <td><span class="predictive-blocks">${item.bloques.map(b=>`<b>${ctx.escapeHTML(b)}</b>`).join('')}</span><small>${item.cant}/${item.requerido} bloque(s)</small></td>
                    <td>${item.razones.length?item.razones.map(r=>`<span>${ctx.escapeHTML(r)}</span>`).join(''):'<span>Aplicado según restricciones actuales</span>'}</td>
                    <td><em class="auto-plan-alert ${estado.cls}">${estado.txt}</em> ${item.alertas.length?item.alertas.map(a=>`<em class="auto-plan-alert ${a.clase}">${ctx.escapeHTML(a.texto)}</em>`).join(' '):''}</td>
                </tr>`;
            }).join('');
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
                        <div><span>Score</span><strong>${resultado.scoreAntes}% → ${resultado.scoreDespues}%</strong></div>
                        <div><span>Ajustes rápidos</span><strong>${resultado.ajustesRapidos||0}</strong></div>
                        <div><span>Memoria</span><strong>${resultado.senalesMemoria||0} señal(es)</strong></div>
                    </div>
                    ${detalleAsignaturas.length?`
                        <div class="predictive-proposal auto-general-applied-detail">
                            <div class="predictive-scenarios-head">
                                <strong>Trazabilidad aplicada</strong>
                                <span>Comparación entre la propuesta previa y los bloques que finalmente quedaron creados.</span>
                            </div>
                            <div class="dashboard-detail-table predictive-proposal-table">
                                <table class="report-table">
                                    <thead><tr><th>Sección</th><th>Asignatura</th><th>Bloques aplicados</th><th>Razones</th><th>Estado</th></tr></thead>
                                    <tbody>${filasAsignaturas}</tbody>
                                </table>
                            </div>
                            ${detalleAsignaturas.length>24?`<p class="auto-plan-empty">Se muestran 24 de ${detalleAsignaturas.length} asignaturas aplicadas.</p>`:''}
                        </div>
                    `:''}
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
            let opciones=await confirmarAutoGeneral({
                alcance:data.sel.nivelId?'nivel':data.sel.carreraId?'carrera':'todas',
                estrategia:estrategiaInicial,
                seccionIds:Array.isArray(cfgAuto.seccionIds)?cfgAuto.seccionIds:undefined,
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
            while(opciones){
                const decisionDiagnostico=await confirmarDiagnosticoPredictivoAutoGeneral(opciones);
                if(decisionDiagnostico&&typeof decisionDiagnostico==='object'){
                    opciones=decisionDiagnostico;
                    break;
                }
                if(decisionDiagnostico===true) break;
                if(decisionDiagnostico==='volver'){
                    opciones=await confirmarAutoGeneral(opciones);
                    if(!opciones) return;
                    continue;
                }
                return;
            }
            if(!await confirmarValidacionAntesAuto('auto_general',opciones)) return;
            guardarCriteriosAuto(opciones);
            const simulacionPrevia=simularAutoGeneral(opciones);
            const secciones=obtenerSeccionesAutoGeneral(opciones);
            if(!secciones.length) return ctx.toast('No hay secciones para auto-planificar','info');
            const original={...data.sel};
            let total=0, seccionesConCambio=0, omitidas=0, pendientes=0;
            const detalle=[];
            const detalleAsignaturas=[];
            const ids=[];
            const explicaciones=[];
            const etiquetaBloqueAplicado=(p)=>`${(ctx.DIAS[p.dia]||'Día').slice(0,2)} B${p.bloque}`;
            const nombreDocenteAplicado=(doc)=>doc?.id===ctx.DOCENTE_NN_ID?'Docente NN':`${doc?.nombre||''} ${doc?.apellido||''}`.trim()||'Docente';
            ctx.crearPuntoRecuperacion?.('antes_auto_general');
            ctx.pushUndo({tipo:'auto_general',resumen:'Auto-general',afecta:`${secciones.length} sección(es)`,critica:true});
            for(const sec of secciones){
                const planBase=calcularPlanAutoSeccionPara(sec.id,opciones.estrategia,opciones);
                if(!planBase) continue;
                const plan=aplicarFiltrosAutoGeneral(planBase,opciones);
                omitidas+=plan.omitidas||0;
                pendientes+=plan.pendientes.length;
                const {nivel,carrera}=contextoSeccionDesdeObjeto(sec);
                data.sel.area=areaCarrera(carrera);
                data.sel.carreraId=carrera.id;
                data.sel.nivelId=nivel.id;
                data.sel.seccionId=sec.id;
                let subtotal=0;
                plan.acciones.forEach(a=>{
                    if(a.cant<=0) return;
                    const idsAccion=[];
                    const explicacionesAccion=[];
                    const asignados=autoAsignarBloques(a.asig.id,sec.id,a.docente.id,a.salaId,a.esPresencial,a.offsetDia,{estrategia:opciones.estrategia,omitirUndo:true,registrarIds:idsAccion,registrarExplicaciones:explicacionesAccion,origen:'auto_general'});
                    if(!asignados) return;
                    subtotal+=asignados;
                    ids.push(...idsAccion);
                    explicaciones.push(...explicacionesAccion);
                    const planesAccion=data.planificaciones.filter(p=>idsAccion.includes(p.id));
                    const sala=data.salas.find(s=>s.id===(planesAccion[0]?.salaId||a.salaId));
                    const razones=[...new Set(explicacionesAccion.flatMap(x=>x.explicacion?.razones||[]).filter(Boolean))].slice(0,4);
                    const alertas=[];
                    if(a.docente?.id===ctx.DOCENTE_NN_ID) alertas.push({texto:'Docente NN',clase:'warning'});
                    if(planesAccion.some(p=>p.salaId===ctx.SALA_TRO2_ID)) alertas.push({texto:'TRO2',clase:'warning'});
                    if(asignados<a.requerido) alertas.push({texto:'Parcial',clase:'warning'});
                    if(a.asig?.area==='transversal'||a.asig?.controlHorario==='coordinacion-externa') alertas.push({texto:'Coordinar',clase:'info'});
                    if(a.ajusteRapido) alertas.push({texto:'Ajuste rápido',clase:'info'});
                    detalleAsignaturas.push({
                        seccionId:sec.id,
                        asignaturaId:a.asig.id,
                        seccion:sec.nombre||'',
                        carreraNivel:[carrera?.codigo||carrera?.nombre,nivel?.nombre].filter(Boolean).join(' · '),
                        codigo:a.asig.codigo||'',
                        asignatura:a.asig.nombre||'',
                        docente:nombreDocenteAplicado(a.docente),
                        sala:!a.esPresencial?'Virtual':sala?.nombre||'Automática/TRO2',
                        tipo:a.esPresencial?'Presencial':'Virtual',
                        bloques:planesAccion.map(etiquetaBloqueAplicado),
                        cant:asignados,
                        requerido:a.requerido,
                        razones,
                        alertas
                    });
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
            const ajustes=normalizarAjustesRapidosAutoGeneral(opciones);
            const ajustesRapidos=(Object.keys(ajustes.docentes||{}).length)+(Object.keys(ajustes.salas||{}).length)+(ajustes.omitidas||[]).length+(ajustes.seccionesExcluidas||[]).length;
            const senalesMemoria=registrarMemoriaAutoGeneralAplicada(opciones,detalleAsignaturas);
            const resultadoAutoGeneral={ts:new Date().toISOString(),total,seccionesConCambio,pendientes,omitidas,estrategia:opciones.estrategia,alcance:opciones.alcance,detalle,detalleAsignaturas,propuestaPrevia:(simulacionPrevia.detalle||[]).slice(0,120),ejecucionId:ejecucionAuto?.id||null,scoreAntes,scoreDespues,deltaScore:scoreDespues-scoreAntes,ajustesRapidos,senalesMemoria};
            data.ultimoAutoGeneral=resultadoAutoGeneral;
            ctx.auditoria?.('auto_general',{bloquesAsignados:total,secciones:seccionesConCambio,estrategia:opciones.estrategia,pendientes,omitidas,scoreAntes,scoreDespues,deltaScore:scoreDespues-scoreAntes,ajustesRapidos,senalesMemoria,detalleAsignaturas:detalleAsignaturas.slice(0,40),explicaciones:explicaciones.slice(0,30)});
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
            scheduleGrid?.addEventListener('selectstart',(e)=>e.preventDefault());
            document.getElementById('btnPlanEmptyAction')?.addEventListener('click',()=>{
                const data=getData();
                const accion=document.getElementById('btnPlanEmptyAction')?.dataset.action;
                if(accion==='planificar') return document.getElementById('btnModoPlanificar')?.click();
                const pendiente=[['area','planArea'],['carreraId','planCarrera'],['nivelId','planNivel'],['jornada','planJornada'],['seccionId','planSeccion']].find(([campo])=>!data.sel?.[campo]);
                document.getElementById(pendiente?.[1]||'planSeccion')?.focus();
            });
            const soportePointer=!!window.PointerEvent;
            const coordenadasEvento=(e)=>{
                const src=e?.touches?.[0]||e?.changedTouches?.[0]||e;
                return {x:Number(src?.clientX),y:Number(src?.clientY)};
            };
            const limpiarCeldasArrastre=()=>{
                arrastre.celdas.forEach(c=>{ if(c.cell) c.cell.style.outline=''; });
            };
            const moverFantasmaArrastre=(e)=>{
                if(!arrastre.ghost) return;
                const {x,y}=coordenadasEvento(e);
                if(!Number.isFinite(x)||!Number.isFinite(y)) return;
                arrastre.ghost.style.left=`${x}px`;
                arrastre.ghost.style.top=`${y}px`;
            };
            const quitarFantasmaArrastre=()=>{
                if(arrastre.ghost){
                    arrastre.ghost.remove();
                    arrastre.ghost=null;
                }
            };
            const grupoContiguoMovimiento=(plan)=>{
                const data=getData();
                const delDia=data.planificaciones
                    .filter(p=>p.seccionId===plan.seccionId&&p.asignaturaId===plan.asignaturaId&&p.dia===plan.dia&&p.tipoPresencial===plan.tipoPresencial&&p.docenteId===plan.docenteId&&p.salaId===plan.salaId&&!p.fijo)
                    .sort((a,b)=>a.bloque-b.bloque);
                const porBloque=new Map(delDia.map(p=>[Number(p.bloque),p]));
                const grupo=[];
                for(let b=Number(plan.bloque);porBloque.has(b);b--) grupo.unshift(porBloque.get(b));
                for(let b=Number(plan.bloque)+1;porBloque.has(b);b++) grupo.push(porBloque.get(b));
                return grupo;
            };
            const crearFantasmaArrastre=(plan,e,cell,totalBloques=1)=>{
                quitarFantasmaArrastre();
                const data=getData();
                const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
                const docente=data.docentes.find(d=>d.id===plan.docenteId);
                const sala=data.salas.find(s=>s.id===plan.salaId);
                const rect=cell?.getBoundingClientRect?.();
                const ghost=document.createElement('div');
                ghost.className=`drag-plan-ghost ${totalBloques>1?'drag-plan-ghost-stack':''}`;
                if(rect){
                    const ancho=Math.max(96,rect.width);
                    const alto=Math.max(54,rect.height);
                    ghost.style.width=`${ancho}px`;
                    ghost.style.setProperty('--ghost-cell-height',`${alto}px`);
                    ghost.style.height=totalBloques>1?'auto':`${alto}px`;
                }
                const celdaHTML=`
                    <span>${ctx.escapeHTML(asig?.codigo||'Asignatura')}</span>
                    <small>${ctx.escapeHTML(sala?.nombre||'Sin sala')}</small>
                    <small>${ctx.escapeHTML(docente?.nombre||'Sin docente')}</small>`;
                ghost.innerHTML=totalBloques>1
                    ? Array.from({length:totalBloques},()=>`<div class="drag-plan-ghost-cell">${celdaHTML}</div>`).join('')
                    : celdaHTML;
                document.body.appendChild(ghost);
                arrastre.ghost=ghost;
                moverFantasmaArrastre(e);
            };
            const validarDestinoGrupoMovimiento=(grupo,destino)=>{
                const data=getData();
                if(!grupo.length||!destino) return {ok:false,msg:'Destino no disponible'};
                const idsIgnorar=grupo.map(p=>p.id);
                const idsIgnorarSet=new Set(idsIgnorar);
                const bloqueInicio=Math.min(...grupo.map(p=>Number(p.bloque)));
                const docId=modoMovimiento?.nuevoDocenteId||grupo[0].docenteId;
                const salaId=grupo[0].salaId;
                const targets=grupo.map(p=>({plan:p,dia:destino.dia,bloque:Number(destino.bloque)+(Number(p.bloque)-bloqueInicio)}));
                for(const t of targets){
                    if(!ctx.getBloque(t.bloque)) return {ok:false,msg:'El tramo sale fuera de los bloques disponibles'};
                    const ocupacion=ocupacionSeccionesImpactadas(t.plan.asignaturaId,t.plan.seccionId,t.dia,t.bloque,{ignorarIds:idsIgnorar});
                    if(ocupacion.ocupada) return {ok:false,msg:`La sección ${nombreSeccion(ocupacion.seccionId)} ya tiene un bloque en ese horario`};
                    const disp=checkDisponibilidadDocente(docId,t.dia,t.bloque,{ignorarIds:idsIgnorar});
                    if(!disp.ok) return {ok:false,msg:disp.msg||'Docente no disponible'};
                    if(salaId!==ctx.SALA_VIRTUAL_ID&&salaId!==ctx.SALA_TRO2_ID){
                        const salaOcupada=data.planificaciones.some(p=>!idsIgnorarSet.has(p.id)&&p.salaId===salaId&&p.dia===t.dia&&p.bloque===t.bloque);
                        if(salaOcupada) return {ok:false,msg:'La sala ya está ocupada en parte del tramo'};
                    }
                }
                return {ok:true,targets,docId};
            };
            const moverGrupoPlanificacion=(grupo,destino)=>{
                const data=getData();
                const validacion=validarDestinoGrupoMovimiento(grupo,destino);
                if(!validacion.ok){ ctx.toast('No se puede mover: '+validacion.msg,'error'); return; }
                const sinCambio=validacion.targets.every(t=>t.plan.dia===t.dia&&t.plan.bloque===t.bloque&&t.plan.docenteId===validacion.docId);
                if(sinCambio) return;
                const ids=new Set(grupo.map(p=>p.id));
                ctx.pushUndo();
                data.planificaciones=data.planificaciones.filter(p=>!ids.has(p.id));
                const nuevos=validacion.targets.map(t=>({...t.plan,id:ctx.genId(),dia:t.dia,bloque:t.bloque,docenteId:validacion.docId}));
                data.planificaciones.push(...nuevos);
                grupo.forEach((p,i)=>{
                    if(p.explicacionAuto) registrarMemoriaPlanificacion('bloque_auto_movido', Object.assign(contextoMemoriaDesdePlan(p),{
                        desde:{dia:p.dia,bloque:p.bloque},
                        hacia:{dia:nuevos[i].dia,bloque:nuevos[i].bloque},
                        docenteNuevoId:validacion.docId
                    }));
                });
                ctx.auditoria?.('bloques_movidos',{cantidad:grupo.length,antes:grupo,despues:nuevos});
                ctx.guardar(); ctx.reconstruirIndices(); construirGrillaMovimiento(); refrescarDespuesCambioPlanificacion();
                ctx.toast(`${grupo.length} bloque(s) movido(s)`,'success');
            };
            const cancelarArrastreFueraGrilla=()=>{
                if(!arrastre.activo) return;
                limpiarCeldasArrastre();
                quitarFantasmaArrastre();
                arrastre.activo=false;
                arrastre.esMovimiento=false;
                arrastre.origenPlan=null;
                arrastre.grupoMovimiento=null;
                arrastre.esSeleccion=false;
                arrastre.appendSeleccion=false;
                arrastre.celdas=[];
            };
            const celdaGrilla=(dia,bloque)=>scheduleGrid.querySelector(`.grid-cell[data-dia="${dia}"][data-bloque="${bloque}"]`);
            const celdaDesdeCoordenadas=(x,y)=>{
                if(!Number.isFinite(x)||!Number.isFinite(y)) return null;
                const celdas=[...scheduleGrid.querySelectorAll('.grid-cell')];
                const exacta=celdas.find(cell=>{
                    const r=cell.getBoundingClientRect();
                    return x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom;
                });
                if(exacta) return exacta;
                let mejor=null, mejorDist=Infinity;
                celdas.forEach(cell=>{
                    const r=cell.getBoundingClientRect();
                    const dx=x<r.left?r.left-x:x>r.right?x-r.right:0;
                    const dy=y<r.top?r.top-y:y>r.bottom?y-r.bottom:0;
                    const dist=Math.hypot(dx,dy);
                    if(dist<mejorDist){mejor=cell;mejorDist=dist;}
                });
                return mejorDist<=90?mejor:null;
            };
            const celdasRectanguloArrastre=(diaFinal,bloqueFinal)=>{
                const diaMin=Math.min(arrastre.inicioDia,diaFinal);
                const diaMax=Math.max(arrastre.inicioDia,diaFinal);
                const bloqueMin=Math.min(arrastre.inicioBloque,bloqueFinal);
                const bloqueMax=Math.max(arrastre.inicioBloque,bloqueFinal);
                const celdas=[];
                for(let dia=diaMin;dia<=diaMax;dia++){
                    for(let bloque=bloqueMin;bloque<=bloqueMax;bloque++){
                        const cell=celdaGrilla(dia,bloque);
                        if(cell) celdas.push({dia,bloque,cell});
                    }
                }
                return celdas;
            };
            const pintarCeldasArrastre=(celdas,outline)=>{
                limpiarCeldasArrastre();
                arrastre.celdas=celdas;
                arrastre.celdas.forEach(c=>{ if(c.cell) c.cell.style.outline=outline; });
            };
            const celdaDesdeEvento=(e,opciones={})=>{
                const preferirPuntero=opciones.preferirPuntero!==false;
                const {x,y}=coordenadasEvento(e);
                if(preferirPuntero && Number.isFinite(x) && Number.isFinite(y)){
                    const celda=celdaDesdeCoordenadas(x,y);
                    if(celda?.dataset?.dia!==undefined) return celda;
                    const bajoPuntero=document.elementFromPoint(x,y);
                    const celdaDom=bajoPuntero?.closest?.('.grid-cell')||null;
                    if(celdaDom?.dataset?.dia!==undefined) return celdaDom;
                }
                const directa=e.target?.closest?.('.grid-cell');
                if(directa?.dataset?.dia!==undefined) return directa;
                return null;
            };
            const asignarCeldasArrastre=(celdas)=>{
                const data=getData();
                const s=data.sel;
                if(!celdas.length) return 0;
                if(!validarSeleccionManual({requiereModo:true})) return 0;
                const salaPlan=s.tipo==='virtual'?ctx.SALA_VIRTUAL_ID:s.salaId;
                if(s.tipo==='presencial' && !confirmarCapacidadSala(s.asignaturaId,s.seccionId,salaPlan)) return 0;
                ctx.pushUndo();
                let cont=0;
                celdas.forEach(c=>{
                    if(asignarBloque(c.dia,c.bloque,{omitirUndo:true,omitirGuardar:true,omitirCapacidad:true})) cont++;
                });
                if(cont>0){
                    ctx.reconstruirIndices();
                    construirGrilla();
                    refrescarDespuesCambioPlanificacion();
                    ctx.guardar();
                }
                return cont;
            };
            const eliminarCeldasArrastre=(celdas)=>{
                const data=getData();
                const planes=[];
                celdas.forEach(c=>{
                    const visible=data.sel.seccionId?planVisibleEn(data.sel.seccionId,c.dia,c.bloque):null;
                    const plan=visible?.vinculado?null:visible?.plan||null;
                    if(plan&&!plan.fijo&&!planes.some(p=>p.id===plan.id)) planes.push(plan);
                });
                if(!planes.length) return 0;
                ctx.pushUndo();
                const ids=new Set(planes.map(p=>p.id));
                data.planificaciones=data.planificaciones.filter(p=>!ids.has(p.id));
                ctx.auditoria?.('bloques_eliminados_arrastre',{cantidad:planes.length,bloques:planes});
                ctx.reconstruirIndices();
                construirGrilla();
                refrescarDespuesCambioPlanificacion();
                ctx.guardar();
                return planes.length;
            };
            const finalizarArrastre=(e)=>{
                const data = getData();
                const indicePlan = ctx.getIndicePlan();
                if(arrastre.esMovimiento){
                    arrastre.activo=false; arrastre.esMovimiento=false;
                    quitarFantasmaArrastre();
                    const origen=arrastre.origenPlan; arrastre.origenPlan=null;
                    const grupo=Array.isArray(arrastre.grupoMovimiento)&&arrastre.grupoMovimiento.length?arrastre.grupoMovimiento:[origen].filter(Boolean);
                    arrastre.grupoMovimiento=null;
                    const celdas=[...arrastre.celdas]; arrastre.celdas=[]; celdas.forEach(c=>{ if(c.cell) c.cell.style.outline=''; });
                    if(origen?.fijo){ ctx.toast('Este bloque está fijo. Desbloquéalo antes de moverlo.','info'); return; }
                    const celdaFinal=celdaDesdeEvento(e);
                    if(celdaFinal?.dataset?.dia!==undefined && !celdas.some(c=>c.dia===Number(celdaFinal.dataset.dia)&&c.bloque===Number(celdaFinal.dataset.bloque))){
                        celdas.push({dia:Number(celdaFinal.dataset.dia),bloque:Number(celdaFinal.dataset.bloque),cell:celdaFinal});
                    }
                    const destino=celdas[celdas.length-1];
                    if(destino&&origen&&(destino.dia!==origen.dia||destino.bloque!==origen.bloque)){
                        if(grupo.length>1){
                            moverGrupoPlanificacion(grupo,destino);
                            return;
                        }
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
                if(arrastre.esSeleccion){
                    const celdaFinal=celdaDesdeEvento(e);
                    let celdas=[...arrastre.celdas];
                    if(celdaFinal?.dataset?.dia!==undefined){
                        celdas=celdasRectanguloArrastre(Number(celdaFinal.dataset.dia),Number(celdaFinal.dataset.bloque));
                    }
                    arrastre.activo=false;
                    arrastre.esSeleccion=false;
                    const append=arrastre.appendSeleccion;
                    arrastre.appendSeleccion=false;
                    arrastre.celdas=[];
                    celdas.forEach(c=>{ if(c.cell) c.cell.style.outline=''; });
                    const totalAntes=seleccionBloques.size;
                    seleccionarPlanesDesdeCeldas(celdas,append);
                    const total=seleccionBloques.size;
                    if(total!==totalAntes || total>0) ctx.toast(`${total} bloque(s) seleccionado(s). Usa clic derecho para acciones.`,'info');
                    return;
                }
                const celdaFinal=celdaDesdeEvento(e);
                let celdas=[...arrastre.celdas];
                if(data.modoPlan&&!arrastre.origenPlan&&celdaFinal?.dataset?.dia!==undefined){
                    celdas=celdasRectanguloArrastre(Number(celdaFinal.dataset.dia),Number(celdaFinal.dataset.bloque));
                }else if(celdaFinal?.dataset?.dia!==undefined && !celdas.some(c=>c.dia===Number(celdaFinal.dataset.dia)&&c.bloque===Number(celdaFinal.dataset.bloque))){
                    celdas.push({dia:Number(celdaFinal.dataset.dia),bloque:Number(celdaFinal.dataset.bloque),cell:celdaFinal});
                }
                arrastre.activo=false; arrastre.celdas=[];
                celdas.forEach(c=>{ if(c.cell) c.cell.style.outline=''; });
                const ultima=celdas[celdas.length-1]||celdas[0];
                const dist=Math.abs((ultima?.dia??arrastre.inicioDia)-arrastre.inicioDia)+Math.abs((ultima?.bloque??arrastre.inicioBloque)-arrastre.inicioBloque);
                if(dist<=data.configuracion.sensibilidadArrastre && celdas.length===1){
                    const cell=celdas[0].cell;
                    const visible=data.sel.seccionId?planVisibleEn(data.sel.seccionId,Number(cell.dataset.dia),Number(cell.dataset.bloque)):null;
                    const plan=visible?.plan||null;
                    if(plan) mostrarPopupAccion(cell,plan,e);
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
                        const ocupacion=ocupacionSeccionesImpactadas(arrastre.origenPlan.asignaturaId,arrastre.origenPlan.seccionId,destino.dia,destino.bloque,{ignorarIds:[arrastre.origenPlan.id]});
                        if(ocupacion.ocupada){
                            ctx.toast(`No se puede mover: la sección ${nombreSeccion(ocupacion.seccionId)} ya tiene un bloque en ese horario`,'error');
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
                    const diasSeleccionados=new Set(celdas.map(c=>c.dia));
                    if(diasSeleccionados.size>1&&!confirm(`Vas a ${estado?'asignar':'eliminar'} ${celdas.length} bloque(s) en ${diasSeleccionados.size} días. ¿Confirmar?`)){
                        arrastre.origenPlan=null;
                        return;
                    }
                    if(estado){
                        cont=asignarCeldasArrastre(celdas);
                        if(cont>0) ctx.toast(`${cont} bloque(s) asignado(s)`,'success');
                    } else {
                        cont=eliminarCeldasArrastre(celdas);
                        if(cont>0) ctx.toast(`${cont} bloque(s) eliminado(s)`,'info');
                    }
                    actualizarSelectoresPlan();
                }
                arrastre.origenPlan=null;
            };
            scheduleGrid.addEventListener('pointerdown',(e)=>{
                const data = getData();
                const indicePlan = ctx.getIndicePlan();
                if(e.button!==0) return;
                if(modoMovimiento){
                    const cell=celdaDesdeEvento(e); if(!cell||cell.dataset.dia===undefined) return;
                    const visible=planVisibleEn(modoMovimiento.seccionId,Number(cell.dataset.dia),Number(cell.dataset.bloque));
                    const plan=visible?.plan;
                    if(visible?.vinculado) return;
                    if(!plan || plan.asignaturaId!==modoMovimiento.plan.asignaturaId) return;
                    if(plan.fijo){ ctx.toast('Este bloque está fijo. Desbloquéalo antes de moverlo.','info'); return; }
                    const grupo=(e.metaKey||e.ctrlKey)?grupoContiguoMovimiento(plan):[plan];
                    arrastre.activo=true; arrastre.inicioDia=parseInt(cell.dataset.dia); arrastre.inicioBloque=parseInt(cell.dataset.bloque);
                    arrastre.origenPlan=plan; arrastre.grupoMovimiento=grupo; arrastre.celdas=[{dia:parseInt(cell.dataset.dia),bloque:parseInt(cell.dataset.bloque),cell}]; arrastre.esMovimiento=true;
                    crearFantasmaArrastre(plan,e,cell,grupo.length);
                    scheduleGrid.setPointerCapture?.(e.pointerId);
                    e.preventDefault(); return;
                }
                const cell=celdaDesdeEvento(e,{preferirPuntero:false}); if(!cell||cell.dataset.dia===undefined) return;
                const dia=parseInt(cell.dataset.dia),bloque=parseInt(cell.dataset.bloque);
                const secId=data.sel.seccionId; const visible=secId?planVisibleEn(secId,dia,bloque):null; const plan=visible?.plan||null;
                if(!data.modoPlan && !plan) return;
                if(data.modoPlan && plan && !visible?.vinculado){
                    if(e.metaKey||e.ctrlKey){
                        toggleSeleccionPlan(plan);
                        ctx.toast(`${seleccionBloques.size} bloque(s) seleccionado(s).`,'info');
                        e.preventDefault();
                        return;
                    }
                    if(!seleccionBloques.has(plan.id)) seleccionBloques.clear();
                    arrastre.activo=true;
                    arrastre.inicioDia=dia;
                    arrastre.inicioBloque=bloque;
                    arrastre.estado=false;
                    arrastre.esSeleccion=true;
                    arrastre.appendSeleccion=seleccionBloques.has(plan.id);
                    arrastre.celdas=[{dia,bloque,cell}];
                    pintarCeldasArrastre([{dia,bloque,cell}],'2px solid var(--accent)');
                    scheduleGrid.setPointerCapture?.(e.pointerId);
                    e.preventDefault();
                    return;
                }
                if(data.modoPlan && !plan && seleccionBloques.size && !(e.metaKey||e.ctrlKey)) limpiarSeleccionBloques();
                arrastre.activo=true; arrastre.inicioDia=dia; arrastre.inicioBloque=bloque; arrastre.estado=!plan;
                arrastre.celdas=[{dia,bloque,cell}];
                scheduleGrid.setPointerCapture?.(e.pointerId);
                e.preventDefault();
            });
            scheduleGrid.addEventListener('pointermove',(e)=>{
                const data = getData();
                if(!arrastre.activo) return;
                ocultarTooltipPlan();
                moverFantasmaArrastre(e);
                const cell=celdaDesdeEvento(e); if(!cell||cell.dataset.dia===undefined) return;
                const dia=parseInt(cell.dataset.dia),bloque=parseInt(cell.dataset.bloque);
                if(arrastre.esSeleccion){
                    pintarCeldasArrastre(celdasRectanguloArrastre(dia,bloque),'2px solid var(--accent)');
                    return;
                }
                if(data.modoPlan&&!arrastre.esMovimiento&&!arrastre.origenPlan){
                    pintarCeldasArrastre(celdasRectanguloArrastre(dia,bloque),arrastre.estado?'2px solid var(--accent)':'2px solid var(--danger)');
                    return;
                }
                if(!arrastre.celdas.some(c=>c.dia===dia&&c.bloque===bloque)) arrastre.celdas.push({dia,bloque,cell});
                if(!arrastre.esMovimiento&&!arrastre.origenPlan) cell.style.outline=arrastre.estado?'2px solid var(--accent)':'2px solid var(--danger)';
            });
            scheduleGrid.addEventListener('pointerup',(e)=>{
                if(scheduleGrid.hasPointerCapture?.(e.pointerId)) scheduleGrid.releasePointerCapture(e.pointerId);
                finalizarArrastre(e);
            });
            scheduleGrid.addEventListener('pointermove',(e)=>{
                if(arrastre.activo) return ocultarTooltipPlan();
                const cell=e.target?.closest?.('.grid-cell');
                if(!cell||cell.dataset.dia===undefined) return ocultarTooltipPlan();
                mostrarTooltipPlan(cell,e);
            });
            scheduleGrid.addEventListener('pointerleave',ocultarTooltipPlan);
            scheduleGrid.addEventListener('pointerdown',ocultarTooltipPlan);
            scheduleGrid.addEventListener('pointercancel',(e)=>{
                if(scheduleGrid.hasPointerCapture?.(e.pointerId)) scheduleGrid.releasePointerCapture(e.pointerId);
                cancelarArrastreFueraGrilla();
            });
            document.addEventListener('pointermove',(e)=>{
                if(!arrastre.activo) return;
                if(e.pointerType==='mouse' && e.buttons===0) return finalizarArrastre(e);
                moverFantasmaArrastre(e);
                const data=getData();
                const cell=celdaDesdeEvento(e);
                if(!cell||cell.dataset.dia===undefined) return;
                const dia=parseInt(cell.dataset.dia),bloque=parseInt(cell.dataset.bloque);
                if(arrastre.esSeleccion){
                    pintarCeldasArrastre(celdasRectanguloArrastre(dia,bloque),'2px solid var(--accent)');
                    return;
                }
                if(data.modoPlan&&!arrastre.esMovimiento&&!arrastre.origenPlan){
                    pintarCeldasArrastre(celdasRectanguloArrastre(dia,bloque),arrastre.estado?'2px solid var(--accent)':'2px solid var(--danger)');
                }else if(!arrastre.celdas.some(c=>c.dia===dia&&c.bloque===bloque)){
                    arrastre.celdas.push({dia,bloque,cell});
                }
            },true);
            document.addEventListener('pointerup',(e)=>{
                if(!arrastre.activo) return;
                finalizarArrastre(e);
            },true);
            scheduleGrid.addEventListener('contextmenu',(e)=>{
                const data=getData();
                ocultarTooltipPlan();
                const cell=celdaDesdeEvento(e);
                if(!cell||cell.dataset.dia===undefined) return;
                const visible=data.sel.seccionId?planVisibleEn(data.sel.seccionId,Number(cell.dataset.dia),Number(cell.dataset.bloque)):null;
                const plan=visible?.plan||null;
                if(!plan) return;
                e.preventDefault();
                limpiarCeldasArrastre();
                arrastre.activo=false;
                arrastre.esMovimiento=false;
                arrastre.origenPlan=null;
                arrastre.grupoMovimiento=null;
                arrastre.esSeleccion=false;
                arrastre.appendSeleccion=false;
                arrastre.celdas=[];
                quitarFantasmaArrastre();
                mostrarPopupAccion(cell,plan,e);
            });
            window.addEventListener('blur',cancelarArrastreFueraGrilla);
            document.addEventListener('pointerdown',(e)=>{
                const popup=ctx.popupState?._popupAbierto;
                if(!popup) return;
                if(e.target.closest?.('.action-popup')) return;
                cerrarPopupAccion();
            },true);
            document.addEventListener('pointerdown',(e)=>{
                if(!seleccionBloques.size) return;
                if(e.target.closest?.('#scheduleGrid')) return;
                if(e.target.closest?.('.action-popup,.modal,.modal-overlay')) return;
                limpiarSeleccionBloques();
            },true);
            document.addEventListener('keydown',(e)=>{
                if(e.key==='Escape') {
                    ocultarTooltipPlan();
                    cerrarPopupAccion();
                    cancelarArrastreFueraGrilla();
                }
            });

            ['planArea','planCarrera','planNivel','planJornada','planSeccion','planAsignatura','planComponente','planDocente','planSala','planTipo'].forEach(id=>document.getElementById(id)?.addEventListener('change',function(){
                const data = getData();
                const map={planArea:'area',planCarrera:'carreraId',planNivel:'nivelId',planJornada:'jornada',planSeccion:'seccionId',planAsignatura:'asignaturaId',planComponente:'componenteId',planDocente:'docenteId',planSala:'salaId',planTipo:'tipo'};
                if(['planArea','planCarrera','planNivel','planJornada','planSeccion'].includes(id)) limpiarSeleccionBloques();
                if(modoMovimiento){
                    modoMovimiento=null;
                    ctx.toast('Movimiento cancelado por cambio de selección','info');
                }
                if(map[id]) data.sel[map[id]]=this.value||null;
                if(id==='planTipo'){
                    if(data.sel.tipo==='virtual') data.sel.salaId=ctx.SALA_VIRTUAL_ID;
                    else if(data.sel.salaId===ctx.SALA_VIRTUAL_ID) data.sel.salaId=null;
                }
                if(['planArea','planCarrera','planNivel','planJornada','planSeccion','planAsignatura','planDocente'].includes(id)){
                    if(id==='planArea'){data.sel.carreraId=null;data.sel.nivelId=null;data.sel.jornada=null;data.sel.seccionId=null;data.sel.asignaturaId=null;data.sel.docenteId=null;}
                    if(id==='planCarrera'){data.sel.nivelId=null;data.sel.jornada=null;data.sel.seccionId=null;data.sel.asignaturaId=null;data.sel.docenteId=null;}
                    if(id==='planNivel'){data.sel.jornada=null;data.sel.seccionId=null;data.sel.asignaturaId=null;data.sel.docenteId=null;}
                    if(id==='planJornada'){data.sel.seccionId=null;data.sel.asignaturaId=null;data.sel.docenteId=null;}
                    if(id==='planSeccion'){data.sel.asignaturaId=null;data.sel.componenteId=null;data.sel.docenteId=null;}
                    if(id==='planAsignatura'){data.sel.componenteId=null;data.sel.docenteId=null;}
                    if(id==='planDocente'&&data.sel.tipo!=='virtual'){data.sel.salaId=null;}
                }
                if(['planArea','planCarrera','planNivel','planJornada','planSeccion','planAsignatura','planComponente','planDocente','planSala','planTipo'].includes(id)){
                    if(!['planSala','planComponente'].includes(id)) actualizarSelectoresPlan();
                    actualizarProgresoPlan();
                    if(data.modoPlan||id==='planJornada'||id==='planSeccion'||id==='planTipo') construirGrilla();
                    else limpiarMarcasDisponibilidadGrilla();
                    ctx.actualizarModoPlanificacionUI?.();
                }
            }));
            document.getElementById('btnAutoAsignatura').onclick=autoAsignarAsignaturaActual;
            document.getElementById('btnAutoSeccion').onclick=autoAsignarSeccionActual;
            document.getElementById('btnAutoGeneral').onclick=autoAsignarGeneral;
            document.getElementById('btnOptimizarHorario').onclick=abrirOptimizacionHorario;
            document.getElementById('btnRevertirAutoRapido').onclick=deshacerUltimaAuto;
            document.getElementById('btnCompararSeccion').onclick=alternarComparadorPlanificacion;
            actualizarBotonComparador();
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
            validarSeleccionManual,
            scoreGlobalPlanificaciones,
            simularOptimizacionHorario,
            simularOptimizacionIterativa,
            prepararOptimizacionMatematica,
            construirResultadoOptimizacionMatematica,
            init
        };
    }

    window.PlanificadorPlanificacion = { create: createPlanificacion };
})();
