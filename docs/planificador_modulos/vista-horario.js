(function(){
    function createVistaHorario(ctx){
        let entidadSeleccionada = null;
        let entidadSeleccionada2 = null;
        let vistaGeneralPagina = 1;
        const VISTA_GENERAL_PAGE_SIZE = 20;
        const getData = ctx.getData;
        const EXPORT_WIDTH = 1510;
        const mismoId=(a,b)=>String(a??'')===String(b??'');
        function reportarErrorExportacion(error, accion){
            if(ctx.mostrarErrorTecnico){
                ctx.mostrarErrorTecnico({
                    titulo:'No se pudo exportar Vista Horarios',
                    mensaje:'La exportación falló, pero la app principal sigue funcionando. Copia este detalle para revisar la causa exacta.',
                    modulo:'Vista Horarios',
                    accion,
                    error
                });
                return;
            }
            console.error(`[Vista Horarios] ${accion}:`, error);
            ctx.toast?.(`Error al exportar: ${error?.message||String(error||'sin detalle')}`,'error');
        }

        function planesVisiblesSeccion(seccionId){
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
            const vistos=new Set();
            return [...propios,...heredados].filter(p=>{
                const key=[p.dia,p.bloque,p.asignaturaId,p.seccionId,p.componenteId||''].join('|');
                if(vistos.has(key)) return false;
                vistos.add(key);
                return true;
            });
        }

        function componentesSubseccion(asignaturaId,seccionId,data){
            const rel=(data.asignaturaSeccion||[]).find(r=>mismoId(r.asignaturaId,asignaturaId)&&mismoId(r.seccionId,seccionId));
            return rel?.usaSubsecciones&&Array.isArray(rel.componentesSubseccion)?rel.componentesSubseccion:[];
        }

        function nombreComponente(plan,data){
            const comp=componentesSubseccion(plan?.asignaturaId,plan?.seccionId,data).find(c=>String(c.id)===String(plan?.componenteId||''));
            return comp ? `${comp.nombre||comp.id}${Number(comp.alumnos)?` · ${Number(comp.alumnos)} al.`:''}` : '';
        }

        function areaCarrera(carrera={}){
            carrera = carrera || {};
            return String(carrera.area||carrera.especialidad||'Sin área').trim()||'Sin área';
        }

        function jornadaSeccion(seccion={}){
            seccion = seccion || {};
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

        function contextoSeccion(seccionId,data=getData()){
            const sec=data.secciones.find(s=>s.id===seccionId);
            const nivel=sec?data.niveles.find(n=>n.id===sec.nivelId):null;
            const carrera=nivel?data.carreras.find(c=>c.id===nivel.carreraId):null;
            return {sec,nivel,carrera};
        }

        function ordenarNiveles(a,b){
            return numeroNivel(a.nombre)-numeroNivel(b.nombre) || String(a.nombre||'').localeCompare(String(b.nombre||''),undefined,{numeric:true,sensitivity:'base'});
        }

        function ordenarSecciones(a,b){
            return String(a.nombre||'').localeCompare(String(b.nombre||''),undefined,{numeric:true,sensitivity:'base'});
        }

        function grillasPorHojaVistaGeneral(){
            return columnasVistaGeneral();
        }

        function columnasVistaGeneral(){
            const valor=parseInt(getData()?.configuracion?.vistaGeneralColumnas);
            return Math.max(1,Math.min(4,valor||2));
        }

        function camposVistaGeneral(){
            const base={asignatura:true,docente:false,sala:false,hora:false};
            return Object.assign(base,getData()?.configuracion?.vistaGeneralCampos||{});
        }

        function partirEnGrupos(lista,tamano){
            const grupos=[];
            const paso=Math.max(1,parseInt(tamano)||1);
            for(let i=0;i<(lista||[]).length;i+=paso) grupos.push(lista.slice(i,i+paso));
            return grupos;
        }

        function colorExportable(valor,fallback='#ffffff'){
            const txt=String(valor||'').trim();
            if(!txt) return fallback;
            if(txt==='transparent'||txt==='rgba(0, 0, 0, 0)'||txt==='rgba(0,0,0,0)') return 'transparent';
            if(/^(#|rgb|hsl)/i.test(txt)) return txt;
            const m=txt.match(/^color\([^\s]+\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+%?))?\)$/i);
            if(m){
                const to255=v=>Math.max(0,Math.min(255,Math.round(Number(v)*255)));
                const a=m[4]?.includes('%') ? Math.max(0,Math.min(1,parseFloat(m[4])/100)) : Math.max(0,Math.min(1,Number(m[4]??1)));
                return a<1 ? `rgba(${to255(m[1])}, ${to255(m[2])}, ${to255(m[3])}, ${a})` : `rgb(${to255(m[1])}, ${to255(m[2])}, ${to255(m[3])})`;
            }
            return fallback;
        }

        function sanitizarNodoExportacion(origen, destino){
            if(!origen || !destino || origen.nodeType!==1 || destino.nodeType!==1) return;
            const cs=getComputedStyle(origen);
            destino.style.color=colorExportable(cs.color,'#102840');
            destino.style.backgroundColor=colorExportable(cs.backgroundColor,'#ffffff');
            if(String(cs.backgroundImage||'').includes('color(') || String(cs.backgroundImage||'').includes('color-mix(')){
                destino.style.backgroundImage='none';
            }
            ['Top','Right','Bottom','Left'].forEach(lado=>{
                destino.style[`border${lado}Color`]=colorExportable(cs[`border${lado}Color`],'#d9e4ec');
            });
            destino.style.outlineColor=colorExportable(cs.outlineColor,'#0b7f86');
            if(String(cs.boxShadow||'').includes('color(') || String(cs.boxShadow||'').includes('color-mix(')){
                destino.style.boxShadow='none';
            }
            const hijosOrigen=Array.from(origen.children||[]);
            const hijosDestino=Array.from(destino.children||[]);
            hijosDestino.forEach((hijo,i)=>sanitizarNodoExportacion(hijosOrigen[i],hijo));
        }

        async function capturarGridFijo(elemento){
            const wrapper=document.createElement('div');
            const clon=elemento.cloneNode(true);
            wrapper.style.position='absolute';
            wrapper.style.left='-20000px';
            wrapper.style.top='0';
            wrapper.style.width=EXPORT_WIDTH+'px';
            wrapper.style.background='#ffffff';
            wrapper.style.padding='0';
            wrapper.style.zIndex='-1';
            clon.style.width=EXPORT_WIDTH+'px';
            clon.style.minWidth=EXPORT_WIDTH+'px';
            wrapper.appendChild(clon);
            document.body.appendChild(wrapper);
            await new Promise(resolve=>requestAnimationFrame(resolve));
            if(typeof ctx.sanitizarNodoExportacion==='function') ctx.sanitizarNodoExportacion(clon,clon);
            else sanitizarNodoExportacion(clon,clon);
            const captureWidth=Math.ceil(Math.max(EXPORT_WIDTH,wrapper.scrollWidth,clon.scrollWidth,clon.getBoundingClientRect().width));
            wrapper.style.width=captureWidth+'px';
            clon.style.width=captureWidth+'px';
            clon.style.minWidth=captureWidth+'px';
            try{
                return await html2canvas(wrapper,{
                    scale:2,
                    useCORS:true,
                    backgroundColor:'#ffffff',
                    width:captureWidth,
                    height:wrapper.scrollHeight,
                    windowWidth:captureWidth,
                    scrollX:0,
                    scrollY:0
                });
            }finally{
                wrapper.remove();
            }
        }

        function getVistaActual(){
            const data = getData();
            const tipo=document.getElementById('vistaTipo').value, entId=entidadSeleccionada;
            if(tipo==='general'){
                const secciones=seccionesVistaGeneral();
                return {data,tipo,secciones,nombre:'Vista_General'};
            }
            if(!entId) return null;
            const filtroAdicional=document.getElementById('vistaFiltroAdicional')?.value||'', entId2=entidadSeleccionada2;
            let planes, nombre='Vista';
            if(tipo==='seccion'){
                planes=planesVisiblesSeccion(entId);
                const s=data.secciones.find(x=>x.id===entId);
                if(s) nombre=s.nombre;
            }else if(tipo==='docente'){
                planes=data.planificaciones.filter(p=>p.docenteId===entId);
                const d=data.docentes.find(x=>x.id===entId);
                if(d) nombre=d.id===ctx.DOCENTE_NN_ID?'Pendiente_Docente_NN':d.apellido+'_'+d.nombre;
            }else{
                planes=data.planificaciones.filter(p=>p.salaId===entId);
                const s=data.salas.find(x=>x.id===entId);
                if(s) nombre=s.nombre;
            }
            if(filtroAdicional && entId2){
                if(filtroAdicional==='seccion') planes=planes.filter(p=>p.seccionId===entId2);
                else if(filtroAdicional==='docente') planes=planes.filter(p=>p.docenteId===entId2);
                else if(filtroAdicional==='sala') planes=planes.filter(p=>p.salaId===entId2);
            }
            return { data, tipo, planes, nombre };
        }

        async function confirmarExportacionVistaGeneral(vista, formato){
            if(vista?.tipo!=='general') return true;
            const total=vista.secciones?.length||0;
            const limites={excel:80,jpg:40,pdf:40};
            const limite=limites[formato]||40;
            if(!total) return true;
            if(total<=limite) return true;
            const etiqueta={excel:'Excel',jpg:'JPG',pdf:'PDF'}[formato]||formato;
            if(typeof ctx.confirmarAccionCritica==='function'){
                return await ctx.confirmarAccionCritica({
                    titulo:'Exportar Vista general',
                    mensaje:`Se exportarán ${total} secciones en formato ${etiqueta}.`,
                    queHara:'Generará un archivo con las secciones filtradas de Vista general.',
                    afectara:'Solo la descarga del archivo; no modifica datos.',
                    noTocara:'Planificación, temporadas, Firebase ni configuración.',
                    seguridad:'Para archivos más livianos, acota área, carrera, nivel o sección antes de exportar.',
                    confirmarTexto:'Exportar',
                    cancelarTexto:'Cancelar',
                    peligro:false
                });
            }
            return confirm(`Vas a exportar Vista general en ${etiqueta} con ${total} secciones filtradas.\n\nEsto puede tardar y generar un archivo grande. Para una exportación más liviana, ajusta los filtros antes de continuar.\n\n¿Deseas continuar?`);
        }

        function llenarCeldaPlanificada(cell, plan, tipo, data){
            cell.classList.add('planned');
            cell.dataset.planSeccion=plan.seccionId||'';
            cell.dataset.planAsignatura=plan.asignaturaId||'';
            cell.dataset.planDocente=plan.docenteId||'';
            cell.dataset.planSala=plan.salaId||'';
            cell.dataset.planTipo=plan.tipoPresencial===false?'virtual':'presencial';
            cell.dataset.planComponente=plan.componenteId||'';
            cell.dataset.planDia=String(plan.dia);
            cell.dataset.planBloque=String(plan.bloque);
            const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
            cell.style.backgroundColor=ctx.colorAsignaturaPlanhor?.(asig)||asig?.color||'var(--planhor-subject-neutral)';
            cell.innerHTML='';
            const linea1=document.createElement('span');
            linea1.textContent=ctx.formatearTextoBloqueAsignatura
                ? ctx.formatearTextoBloqueAsignatura(asig,{formato:data.configuracion?.formatoTextoBloqueVistaHorario||'codigo',maxNombre:30})
                : (asig?.codigo||'');
            const compTexto=nombreComponente(plan,data);
            const compEl=document.createElement('small');
            compEl.className='plan-component-label';
            compEl.textContent=compTexto;
            const linea2=document.createElement('small');
            const linea3=document.createElement('small');
            if(tipo==='seccion'){
                const doc=data.docentes.find(d=>d.id===plan.docenteId);
                linea2.textContent=data.salas.find(s=>s.id===plan.salaId)?.nombre||'';
                linea3.textContent=plan.vinculado
                    ? `Madre: ${data.secciones.find(s=>s.id===plan.seccionOrigenId)?.nombre||data.secciones.find(s=>s.id===plan.seccionId)?.nombre||'?'}`
                    : (doc?(doc.id===ctx.DOCENTE_NN_ID?'Docente NN':doc.nombre.charAt(0)+'. '+doc.apellido):'?');
            }else if(tipo==='docente'){
                const sec=data.secciones.find(s=>s.id===plan.seccionId);
                linea2.textContent=data.salas.find(s=>s.id===plan.salaId)?.nombre||'';
                linea3.textContent=sec?.nombre||'?';
            }else{
                const doc=data.docentes.find(d=>d.id===plan.docenteId);
                const sec=data.secciones.find(s=>s.id===plan.seccionId);
                linea2.textContent=doc?(doc.id===ctx.DOCENTE_NN_ID?'Docente NN':doc.nombre.charAt(0)+'. '+doc.apellido):'?';
                linea3.textContent=sec?.nombre||'?';
            }
            if(compTexto) cell.append(linea1,compEl,linea2,linea3);
            else cell.append(linea1,linea2,linea3);
        }

        function cerrarMenuVista(){
            document.querySelectorAll('.vista-context-popup').forEach(p=>p.remove());
        }

        function abrirMenuVista(cell,e){
            const data=getData();
            const plan=data.planificaciones.find(p=>
                p.seccionId===cell.dataset.planSeccion &&
                p.asignaturaId===cell.dataset.planAsignatura &&
                p.docenteId===cell.dataset.planDocente &&
                p.salaId===cell.dataset.planSala &&
                String(p.dia)===cell.dataset.planDia &&
                String(p.bloque)===cell.dataset.planBloque &&
                String(p.componenteId||'')===String(cell.dataset.planComponente||'')
            );
            if(!plan) return;
            cerrarMenuVista();
            const popup=document.createElement('div');
            popup.className='action-popup vista-context-popup';
            popup.innerHTML=`
                <button id="vistaCtxIrPlan">Ir a planificación</button>
                <button id="vistaCtxSeleccionar">Seleccionar bloque</button>
                <button id="vistaCtxDetalle">Ver detalle</button>
            `;
            document.body.appendChild(popup);
            const scrollX=window.scrollX||document.documentElement.scrollLeft||0;
            const scrollY=window.scrollY||document.documentElement.scrollTop||0;
            const x=Number(e.pageX)||Number(e.clientX||0)+scrollX;
            const y=Number(e.pageY)||Number(e.clientY||0)+scrollY;
            const margen=8;
            const ancho=popup.offsetWidth||220;
            const alto=popup.offsetHeight||140;
            let left=x+margen, top=y+margen;
            if(left+ancho>scrollX+window.innerWidth-margen) left=x-ancho-margen;
            if(top+alto>scrollY+window.innerHeight-margen) top=scrollY+window.innerHeight-alto-margen;
            popup.style.left=`${Math.max(scrollX+margen,Math.round(left))}px`;
            popup.style.top=`${Math.max(scrollY+margen,Math.round(top))}px`;
            const abrir=(mensaje)=>{
                cerrarMenuVista();
                ctx.irASeccion?.(plan.seccionId,{
                    asignaturaId:plan.asignaturaId,
                    docenteId:plan.docenteId,
                    salaId:plan.salaId,
                    componenteId:plan.componenteId||null,
                    tipo:plan.tipoPresencial===false?'virtual':'presencial',
                    dia:plan.dia,
                    bloque:plan.bloque,
                    mensaje
                });
            };
            popup.querySelector('#vistaCtxIrPlan').onclick=()=>abrir('Bloque abierto desde Vista Horarios');
            popup.querySelector('#vistaCtxSeleccionar').onclick=()=>abrir('Bloque seleccionado desde Vista Horarios');
            popup.querySelector('#vistaCtxDetalle').onclick=()=>{
                const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
                const sec=data.secciones.find(s=>s.id===plan.seccionId);
                const doc=data.docentes.find(d=>d.id===plan.docenteId);
                const sala=data.salas.find(s=>s.id===plan.salaId);
                alert([
                    `${asig?.codigo||''} ${asig?.nombre||''}`.trim(),
                    `Sección: ${sec?.nombre||'Sin sección'}`,
                    `Docente: ${doc?(doc.id===ctx.DOCENTE_NN_ID?'Docente NN':`${doc.nombre||''} ${doc.apellido||''}`.trim()):'Sin docente'}`,
                    `Sala: ${sala?.nombre||'Sin sala'}`,
                    `Bloque: ${(ctx.DIAS||[])[plan.dia]||'?'} B${plan.bloque}`
                ].join('\n'));
                cerrarMenuVista();
            };
        }

        function crearGridExportacion(vista){
            const exportBox=document.createElement('div');
            exportBox.className='schedule-export-box';
            const titulo=document.createElement('div');
            titulo.className='schedule-export-title';
            titulo.textContent=vista.nombre.replaceAll('_',' ')+' · '+ctx.getTemporadaLabel();
            const grid=document.createElement('div');
            grid.className='schedule-grid schedule-grid-export';
            const h=document.createElement('div');
            h.className='grid-header';
            h.textContent='Horario';
            grid.appendChild(h);
            ctx.DIAS.forEach(d=>{
                const hd=document.createElement('div');
                hd.className='grid-header';
                hd.textContent=d;
                grid.appendChild(hd);
            });
            ctx.BLOQUES.forEach(b=>{
                const time=document.createElement('div');
                time.className='grid-time';
                time.innerHTML=`B${b.n}<br>${b.inicio}-${b.fin}`;
                grid.appendChild(time);
                ctx.DIAS.forEach((d,di)=>{
                    const cell=document.createElement('div');
                    cell.className='grid-cell';
                    const plan=vista.planes.find(p=>p.dia===di&&p.bloque===b.n);
                    if(plan) llenarCeldaPlanificada(cell,plan,vista.tipo,vista.data);
                    grid.appendChild(cell);
                });
            });
            exportBox.append(titulo,grid);
            return exportBox;
        }

        function crearExportacionVistaGeneral(vista,seccionesPersonalizadas=null,etiquetaGrupo=''){
            const exportBox=document.createElement('div');
            exportBox.className='schedule-export-box vista-general-export-box';
            const columnas=columnasVistaGeneral();
            const titulo=document.createElement('div');
            titulo.className='schedule-export-title';
            const seccionesBase=seccionesPersonalizadas||vista.secciones||[];
            titulo.textContent=`Vista general · ${ctx.getTemporadaLabel()}${etiquetaGrupo?` · ${etiquetaGrupo}`:''} · ${seccionesBase.length} sección(es)`;
            const grid=document.createElement('div');
            grid.className='vista-general-grid vista-general-grid-export';
            grid.style.setProperty('--vista-general-export-columns',String(columnas));
            grid.dataset.columns=String(columnas);
            const maxExport=120;
            const secciones=seccionesBase.slice(0,maxExport);
            grid.innerHTML=`
                <div class="vista-general-summary">
                    <strong>${seccionesBase.length} sección(es)</strong>
                    <span>${seccionesBase.length>maxExport?`Exportación limitada a ${maxExport} secciones. Ajusta filtros para exportar un subconjunto más preciso.`:'Exportación de la vista filtrada.'}</span>
                </div>
                ${secciones.length?secciones.map(s=>renderMiniHorarioGeneral(s.id)).join(''):'<div class="empty-state">Sin secciones para exportar.</div>'}
            `;
            exportBox.append(titulo,grid);
            return exportBox;
        }

        function getOpcionesVista(tipo) {
            const data = getData();
            if(tipo==='general') return [];
            if(tipo==='seccion') return data.secciones.map(s=>({id:s.id,nombre:s.nombre}));
            if(tipo==='docente') {
                const esp=document.getElementById('vistaEspecialidadDocente')?.value||'';
                return data.docentes
                    .filter(d=>d.id!==ctx.DOCENTE_NN_ID)
                    .filter(d=>!esp || (d.especialidad||'Sin especialidad')===esp)
                    .map(d=>({id:d.id,nombre:`${d.nombre} ${d.apellido}${d.especialidad?` [${d.especialidad}]`:''}`}));
            }
            return data.salas.filter(s=>s.id!==ctx.SALA_VIRTUAL_ID&&s.id!==ctx.SALA_TRO2_ID).map(s=>({id:s.id,nombre:s.nombre}));
        }

        function llenarSelect(select, opciones, valorActual, etiquetaTodos){
            if(!select) return '';
            const valido=valorActual&&opciones.some(o=>String(o.id)===String(valorActual))?valorActual:'';
            select.innerHTML=`<option value="">${ctx.escapeHTML(etiquetaTodos)}</option>`+opciones.map(o=>ctx.optionHTML(o.id,o.nombre,String(o.id)===String(valido))).join('');
            select.value=valido;
            return valido;
        }

        function actualizarFiltrosVistaGeneral(){
            const data=getData();
            const areaSel=document.getElementById('vistaGeneralArea');
            const carreraSel=document.getElementById('vistaGeneralCarrera');
            const nivelSel=document.getElementById('vistaGeneralNivel');
            const jornadaSel=document.getElementById('vistaGeneralJornada');
            const seccionSel=document.getElementById('vistaGeneralSeccion');
            if(!areaSel||!carreraSel||!nivelSel||!jornadaSel||!seccionSel) return;
            const areas=[...new Set(data.carreras.map(areaCarrera))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'}));
            const area=llenarSelect(areaSel,areas.map(a=>({id:a,nombre:a})),areaSel.value,'Todas');
            const carreras=data.carreras
                .filter(c=>!area||areaCarrera(c)===area)
                .sort((a,b)=>String(a.nombre||'').localeCompare(String(b.nombre||''),undefined,{numeric:true,sensitivity:'base'}));
            const carreraId=llenarSelect(carreraSel,carreras.map(c=>({id:c.id,nombre:`${c.nombre||''} (${c.codigo||''})`})),carreraSel.value,'Todas');
            const niveles=data.niveles
                .filter(n=>!carreraId||n.carreraId===carreraId)
                .filter(n=>{
                    if(carreraId) return true;
                    const c=data.carreras.find(x=>x.id===n.carreraId);
                    return !area||areaCarrera(c)===area;
                })
                .sort(ordenarNiveles);
            const nivelId=llenarSelect(nivelSel,niveles.map(n=>({id:n.id,nombre:n.nombre})),nivelSel.value,'Todos');
            const seccionesBase=data.secciones.filter(s=>{
                const nivel=data.niveles.find(n=>n.id===s.nivelId);
                const carrera=nivel?data.carreras.find(c=>c.id===nivel.carreraId):null;
                if(area&&areaCarrera(carrera)!==area) return false;
                if(carreraId&&nivel?.carreraId!==carreraId) return false;
                if(nivelId&&s.nivelId!==nivelId) return false;
                return true;
            });
            const jornadas=[...new Set(seccionesBase.map(jornadaSeccion))].sort((a,b)=>a==='diurna'?-1:b==='diurna'?1:0);
            const jornada=llenarSelect(jornadaSel,jornadas.map(j=>({id:j,nombre:etiquetaJornada(j)})),jornadaSel.value,'Todas');
            const secciones=seccionesBase.filter(s=>!jornada||jornadaSeccion(s)===jornada).sort(ordenarSecciones);
            llenarSelect(seccionSel,secciones.map(s=>({id:s.id,nombre:s.nombre})),seccionSel.value,'Todas');
        }

        function seccionesVistaGeneral(){
            const data=getData();
            const area=document.getElementById('vistaGeneralArea')?.value||'';
            const carreraId=document.getElementById('vistaGeneralCarrera')?.value||'';
            const nivelId=document.getElementById('vistaGeneralNivel')?.value||'';
            const jornada=document.getElementById('vistaGeneralJornada')?.value||'';
            const seccionId=document.getElementById('vistaGeneralSeccion')?.value||'';
            return data.secciones.filter(s=>{
                if(seccionId&&s.id!==seccionId) return false;
                const nivel=data.niveles.find(n=>n.id===s.nivelId);
                const carrera=nivel?data.carreras.find(c=>c.id===nivel.carreraId):null;
                if(area&&areaCarrera(carrera)!==area) return false;
                if(carreraId&&nivel?.carreraId!==carreraId) return false;
                if(nivelId&&s.nivelId!==nivelId) return false;
                if(jornada&&jornadaSeccion(s)!==jornada) return false;
                return true;
            }).sort((a,b)=>{
                const ca=contextoSeccion(a.id,data), cb=contextoSeccion(b.id,data);
                return String(areaCarrera(ca.carrera)).localeCompare(areaCarrera(cb.carrera),undefined,{numeric:true,sensitivity:'base'})
                    || String(ca.carrera?.nombre||'').localeCompare(String(cb.carrera?.nombre||''),undefined,{numeric:true,sensitivity:'base'})
                    || numeroNivel(ca.nivel?.nombre)-numeroNivel(cb.nivel?.nombre)
                    || jornadaSeccion(a).localeCompare(jornadaSeccion(b))
                    || ordenarSecciones(a,b);
            });
        }

        function renderMiniGrillaSeccion(seccionId, opciones={}){
            const data=getData();
            const campos=opciones.campos||camposVistaGeneral();
            const planes=planesVisiblesSeccion(seccionId);
            let heredados=0;
            const filas=ctx.BLOQUES.map(b=>{
                const celdas=ctx.DIAS.map((d,di)=>{
                    const plan=planes.find(p=>p.dia===di&&p.bloque===b.n);
                    if(!plan) return '<div class="vista-general-cell"></div>';
                    if(plan.vinculado) heredados++;
                    const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
                    const doc=data.docentes.find(x=>x.id===plan.docenteId);
                    const sala=data.salas.find(x=>x.id===plan.salaId);
                    const color=ctx.colorAsignaturaPlanhor?.(asig)||asig?.color||'var(--planhor-subject-neutral)';
                    const partes=[
                        campos.asignatura ? (ctx.formatearTextoBloqueAsignatura
                            ? ctx.formatearTextoBloqueAsignatura(asig,{formato:data.configuracion?.formatoTextoBloqueVistaHorario||'codigo',maxNombre:18})
                            : (asig?.codigo||'?')) : '',
                        campos.docente && doc ? (doc.id===ctx.DOCENTE_NN_ID?'Docente NN':`${(doc.nombre||'').charAt(0)}. ${doc.apellido||''}`.trim()) : '',
                        campos.sala && sala ? (sala.nombre||'') : ''
                    ].filter(Boolean);
                    const title=[
                        `${d} B${b.n}`,
                        [asig?.codigo,asig?.nombre].filter(Boolean).join(' - '),
                        doc ? `Docente: ${doc.id===ctx.DOCENTE_NN_ID?'Docente NN':`${doc.nombre||''} ${doc.apellido||''}`.trim()}` : '',
                        sala ? `Sala: ${sala.nombre||''}` : '',
                        plan.vinculado?`Heredada desde ${data.secciones.find(s=>s.id===plan.seccionOrigenId)?.nombre||plan.seccionId}`:''
                    ].filter(Boolean).join(' · ');
                    return `<div class="vista-general-cell filled ${plan.vinculado?'linked':''}" style="background:${ctx.escapeAttr(color)}" title="${ctx.escapeAttr(title)}">${partes.length?partes.map(p=>`<span>${ctx.escapeHTML(p)}</span>`).join(''):'<span>&nbsp;</span>'}</div>`;
                }).join('');
                return `<div class="vista-general-time">${campos.hora?`B${b.n}<small>${ctx.escapeHTML(b.inicio)}-${ctx.escapeHTML(b.fin)}</small>`:`B${b.n}`}</div>${celdas}`;
            }).join('');
            return {
                html:`<div class="vista-general-mini">
                    <div class="vista-general-corner">B</div>
                    ${ctx.DIAS.map(d=>`<div class="vista-general-day">${ctx.escapeHTML(d.slice(0,3))}</div>`).join('')}
                    ${filas}
                </div>`,
                total:planes.length,
                heredados
            };
        }

        function renderMiniHorarioGeneral(seccionId){
            const data=getData();
            const {sec,nivel,carrera}=contextoSeccion(seccionId,data);
            const mini=renderMiniGrillaSeccion(seccionId);
            const subtitulo=[areaCarrera(carrera),carrera?.nombre,nivel?.nombre,etiquetaJornada(jornadaSeccion(sec))].filter(Boolean).join(' · ');
            return `<article class="vista-general-card">
                <div class="vista-general-card-head">
                    <div><strong>${ctx.escapeHTML(sec?.nombre||'Sección')}</strong><span>${ctx.escapeHTML(subtitulo)}</span></div>
                    <div class="vista-general-card-actions">
                        <small>${mini.total} bloque(s)${mini.heredados?` · ${mini.heredados} heredado(s)`:''}</small>
                        <button class="btn btn-xs vista-general-go" type="button" data-seccion="${ctx.escapeAttr(seccionId)}">Ir a planificación</button>
                    </div>
                </div>
                ${mini.html}
            </article>`;
        }

        function construirVistaGeneral(){
            const panel=document.getElementById('vistaGeneralPanel');
            const grid=document.getElementById('vistaGrid');
            if(!panel) return;
            try{
                if(grid){
                    grid.className='schedule-grid';
                    grid.innerHTML='';
                }
                const secciones=seccionesVistaGeneral();
                const totalPaginas=Math.max(1,Math.ceil(secciones.length/VISTA_GENERAL_PAGE_SIZE));
                vistaGeneralPagina=Math.min(Math.max(1,vistaGeneralPagina),totalPaginas);
                const inicio=(vistaGeneralPagina-1)*VISTA_GENERAL_PAGE_SIZE;
                const visibles=secciones.slice(inicio,inicio+VISTA_GENERAL_PAGE_SIZE);
                const resumenes=secciones.map(s=>{
                    const planes=planesVisiblesSeccion(s.id);
                    return {
                        seccion:s,
                        planes,
                        heredados:planes.filter(p=>p.vinculado).length,
                        asignaturas:new Set(planes.map(p=>p.asignaturaId).filter(Boolean)).size
                    };
                });
                const totalBloques=resumenes.reduce((acc,r)=>acc+r.planes.length,0);
                const totalHeredados=resumenes.reduce((acc,r)=>acc+r.heredados,0);
                const seccionesConPlan=resumenes.filter(r=>r.planes.length).length;
                const totalAsignaturas=resumenes.reduce((acc,r)=>acc+r.asignaturas,0);
                const rango=secciones.length ? `${inicio+1}-${inicio+visibles.length}` : '0';
                const columnas=columnasVistaGeneral();
                const campos=camposVistaGeneral();
                panel.innerHTML=`
                    <div class="vista-general-summary">
                        <strong>${secciones.length} sección(es) · ${totalBloques} bloque(s)</strong>
                        <span>Fase 3: mini-grillas paginadas. Mostrando ${rango} de ${secciones.length}.</span>
                        <label class="vista-general-columns-control">Columnas
                            <select class="form-select" id="vistaGeneralColumnas">
                                ${[1,2,3,4].map(n=>ctx.optionHTML(String(n),`${n}`,columnas===n)).join('')}
                            </select>
                        </label>
                    </div>
                    <div class="vista-general-display-options">
                        <strong>Contenido por celda</strong>
                        <label><input type="checkbox" data-vista-campo="asignatura" ${campos.asignatura?'checked':''}> Asignatura</label>
                        <label><input type="checkbox" data-vista-campo="docente" ${campos.docente?'checked':''}> Docente</label>
                        <label><input type="checkbox" data-vista-campo="sala" ${campos.sala?'checked':''}> Sala</label>
                        <label><input type="checkbox" data-vista-campo="hora" ${campos.hora?'checked':''}> Hora en primera columna</label>
                    </div>
                    <div class="vista-general-passive-note">
                        <strong>Vista general aislada</strong>
                        <span>Renderiza hasta ${VISTA_GENERAL_PAGE_SIZE} mini-grillas por página, sin modificar selección de planificación ni habilitar exportación masiva.</span>
                    </div>
                    <div class="vista-general-count-grid">
                        <div><strong>${secciones.length}</strong><span>Secciones filtradas</span></div>
                        <div><strong>${seccionesConPlan}</strong><span>Con planificación visible</span></div>
                        <div><strong>${totalBloques}</strong><span>Bloques visibles</span></div>
                        <div><strong>${totalAsignaturas}</strong><span>Asignaturas distintas por sección</span></div>
                        <div><strong>${totalHeredados}</strong><span>Bloques heredados visibles</span></div>
                    </div>
                    ${secciones.length?`
                        <div class="vista-general-pager">
                            <button class="btn btn-xs" id="vistaGeneralPrev" type="button" ${vistaGeneralPagina<=1?'disabled':''}>Anterior</button>
                            <span>Página ${vistaGeneralPagina} de ${totalPaginas}</span>
                            <button class="btn btn-xs" id="vistaGeneralNext" type="button" ${vistaGeneralPagina>=totalPaginas?'disabled':''}>Siguiente</button>
                        </div>
                        <div class="vista-general-grid vista-general-mini-grid-active" style="--vista-general-columns:${columnas};">
                            ${visibles.map(s=>renderMiniHorarioGeneral(s.id)).join('')}
                        </div>
                    `:'<div class="empty-state">No hay secciones para los filtros seleccionados.</div>'}
                `;
                const prev=document.getElementById('vistaGeneralPrev');
                const next=document.getElementById('vistaGeneralNext');
                if(prev) prev.onclick=()=>{vistaGeneralPagina=Math.max(1,vistaGeneralPagina-1); construirVistaGeneral();};
                if(next) next.onclick=()=>{vistaGeneralPagina=Math.min(totalPaginas,vistaGeneralPagina+1); construirVistaGeneral();};
                const selColumnas=document.getElementById('vistaGeneralColumnas');
                if(selColumnas) selColumnas.onchange=()=>{
                    const data=getData();
                    data.configuracion=data.configuracion||{};
                    data.configuracion.vistaGeneralColumnas=Math.max(1,Math.min(4,parseInt(selColumnas.value)||2));
                    construirVistaGeneral();
                    ctx.toast?.('Vista general actualizada','info');
                };
                panel.querySelectorAll('[data-vista-campo]').forEach(input=>{
                    input.onchange=()=>{
                        const data=getData();
                        data.configuracion=data.configuracion||{};
                        data.configuracion.vistaGeneralCampos=Object.assign({asignatura:true,docente:false,sala:false,hora:false},data.configuracion.vistaGeneralCampos||{});
                        data.configuracion.vistaGeneralCampos[input.dataset.vistaCampo]=!!input.checked;
                        if(!Object.values(data.configuracion.vistaGeneralCampos).some(Boolean)) data.configuracion.vistaGeneralCampos.asignatura=true;
                        construirVistaGeneral();
                    };
                });
                panel.querySelectorAll('.vista-general-go').forEach(btn=>{
                    btn.onclick=(e)=>{
                        e.preventDefault();
                        e.stopPropagation();
                        const seccionId=btn.dataset.seccion;
                        if(!seccionId) return;
                        if(typeof ctx.irASeccion==='function'){
                            ctx.irASeccion(seccionId,{mensaje:'Sección abierta desde Vista general'});
                        }else{
                            ctx.toast?.('No se pudo abrir la sección desde Vista general','error');
                        }
                    };
                });
            }catch(e){
                console.error('Error al renderizar Vista general:',e);
                panel.innerHTML=`<div class="tab-error-panel"><strong>No se pudo renderizar Vista general</strong><span>La vista tradicional sigue disponible. Ajusta filtros o recarga la pestaña.</span><small>${ctx.escapeHTML(e?.message||String(e))}</small></div>`;
            }
        }

        function actualizarFiltroEspecialidadDocenteVista(){
            const data=getData();
            const grupo=document.getElementById('vistaGrupoEspecialidadDocente');
            const sel=document.getElementById('vistaEspecialidadDocente');
            if(!grupo||!sel) return;
            const esDocente=document.getElementById('vistaTipo')?.value==='docente';
            grupo.style.display=esDocente?'block':'none';
            const actual=sel.value;
            const especialidades=[...new Set(data.docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID).map(d=>d.especialidad||'Sin especialidad'))].sort((a,b)=>a.localeCompare(b));
            sel.innerHTML='<option value="">Todas</option>'+especialidades.map(e=>ctx.optionHTML(e,e,actual===e)).join('');
            if(actual&&especialidades.includes(actual)) sel.value=actual;
        }

        function mostrarOpcionesVista(inputId, resultadosId, targetKey, tipo, clearId){
            const input=document.getElementById(inputId), resultados=document.getElementById(resultadosId);
            if(!input||!resultados) return;
            const tipoActivo=document.getElementById('vistaTipo')?.value||'seccion';
            if(tipoActivo==='general'){
                resultados.innerHTML='';
                resultados.classList.remove('show');
                return;
            }
            const opciones=getOpcionesVista(tipo||document.getElementById('vistaFiltroAdicional')?.value||tipoActivo);
            resultados.innerHTML='';
            opciones.slice(0,10).forEach(o=>{
                const li=document.createElement('li'); li.textContent=o.nombre;
                li.onclick=()=>{
                    if(targetKey==='principal') entidadSeleccionada=o.id;
                    else entidadSeleccionada2=o.id;
                    input.value=o.nombre; resultados.classList.remove('show');
                    if(clearId) document.getElementById(clearId)?.classList.add('visible');
                    construirVistaGrid();
                };
                resultados.appendChild(li);
            });
            resultados.classList.add('show');
        }

        function filtrarVistaEntidad(inputId, resultadosId, targetKey, tipo, clearId){
            const input=document.getElementById(inputId), resultados=document.getElementById(resultadosId);
            if(!input||!resultados) return;
            const tipoActivo=document.getElementById('vistaTipo')?.value||'seccion';
            if(tipoActivo==='general'){
                resultados.innerHTML='';
                resultados.classList.remove('show');
                document.getElementById(clearId)?.classList.remove('visible');
                return;
            }
            const filter=input.value.toLowerCase();
            const opciones=getOpcionesVista(tipo||document.getElementById('vistaFiltroAdicional')?.value||tipoActivo);
            resultados.innerHTML=''; document.getElementById(clearId)?.classList.toggle('visible',input.value.length>0);
            if(!filter){mostrarOpcionesVista(inputId, resultadosId, targetKey, tipo, clearId); return;}
            const filtradas=opciones.filter(o=>o.nombre.toLowerCase().includes(filter));
            if(filtradas.length===0){resultados.classList.remove('show');return;}
            filtradas.slice(0,10).forEach(o=>{
                const li=document.createElement('li'); li.textContent=o.nombre;
                li.onclick=()=>{
                    if(targetKey==='principal') entidadSeleccionada=o.id;
                    else entidadSeleccionada2=o.id;
                    input.value=o.nombre; resultados.classList.remove('show');
                    document.getElementById(clearId)?.classList.add('visible'); construirVistaGrid();
                };
                resultados.appendChild(li);
            });
            resultados.classList.add('show');
        }

        function construirVistaGrid(){
            const data = getData();
            const tipo=document.getElementById('vistaTipo')?.value||'seccion', entId=entidadSeleccionada, grid=document.getElementById('vistaGrid');
            const filtroAdicional=document.getElementById('vistaFiltroAdicional')?.value||'', entId2=entidadSeleccionada2;
            if(!grid) return;
            grid.innerHTML='';
            if(tipo==='general'){
                construirVistaGeneral();
                return;
            }
            grid.className='schedule-grid';
            if(!entId) return;
            let planes;
            if(tipo==='seccion') planes=planesVisiblesSeccion(entId);
            else if(tipo==='docente') planes=data.planificaciones.filter(p=>p.docenteId===entId);
            else planes=data.planificaciones.filter(p=>p.salaId===entId);
            if(filtroAdicional && entId2){
                if(filtroAdicional==='seccion') planes=planes.filter(p=>p.seccionId===entId2);
                else if(filtroAdicional==='docente') planes=planes.filter(p=>p.docenteId===entId2);
                else if(filtroAdicional==='sala') planes=planes.filter(p=>p.salaId===entId2);
            }
            grid.appendChild(ctx.createHeader());
            ctx.BLOQUES.forEach(b=>{
                grid.appendChild(ctx.createTimeCell(b));
                ctx.DIAS.forEach((d,di)=>{
                    const cell=document.createElement('div'); cell.className='grid-cell';
                    const plan=planes.find(p=>p.dia===di&&p.bloque===b.n);
                    if(plan){
                        llenarCeldaPlanificada(cell,plan,tipo,data);
                    }
                    grid.appendChild(cell);
                });
            });
        }

        function actualizarVista(){
            sincronizarModoVista();
            const tipo=document.getElementById('vistaTipo')?.value||'seccion';
            document.getElementById('vistaBusqueda')&&(document.getElementById('vistaBusqueda').value=''); entidadSeleccionada=null;
            document.getElementById('vistaResultados')?.classList.remove('show'); document.getElementById('clearVistaBusqueda')?.classList.remove('visible');
            document.getElementById('vistaBusqueda2')&&(document.getElementById('vistaBusqueda2').value=''); entidadSeleccionada2=null;
            document.getElementById('vistaResultados2')?.classList.remove('show'); document.getElementById('clearVistaBusqueda2')?.classList.remove('visible');
            const grupoFiltro2=document.getElementById('grupoFiltro2');
            if(grupoFiltro2) grupoFiltro2.style.display='none';
            construirVistaGrid();
        }

        function sincronizarModoVista(){
            const esGeneral=document.getElementById('vistaTipo')?.value==='general';
            actualizarFiltroEspecialidadDocenteVista();
            if(esGeneral) actualizarFiltrosVistaGeneral();
            const filtros=document.getElementById('vistaGeneralFiltros');
            const panelGeneral=document.getElementById('vistaGeneralPanel');
            const contenedorGrid=document.getElementById('vistaScheduleContainer');
            const busqueda=document.getElementById('vistaGrupoBusquedaPrincipal');
            const filtro2=document.getElementById('grupoFiltro2');
            if(filtros) filtros.style.display=esGeneral?'grid':'none';
            if(panelGeneral) panelGeneral.style.display=esGeneral?'block':'none';
            if(contenedorGrid) contenedorGrid.style.display=esGeneral?'none':'block';
            if(busqueda) busqueda.style.display=esGeneral?'none':'block';
            if(filtro2 && esGeneral) filtro2.style.display='none';
            if(esGeneral){
                entidadSeleccionada=null;
                entidadSeleccionada2=null;
                document.getElementById('vistaBusqueda')&&(document.getElementById('vistaBusqueda').value='');
                document.getElementById('vistaBusqueda2')&&(document.getElementById('vistaBusqueda2').value='');
                document.getElementById('vistaResultados')?.classList.remove('show');
                document.getElementById('vistaResultados2')?.classList.remove('show');
                document.getElementById('clearVistaBusqueda')?.classList.remove('visible');
                document.getElementById('clearVistaBusqueda2')?.classList.remove('visible');
            }
            const btn=document.getElementById('btnExportarVista');
            if(btn){
                btn.disabled=false;
                btn.title=esGeneral?'Exporta la Vista general filtrada bajo demanda.':'';
            }
        }

        async function exportarVistaExcel(){
            try{
                const data = getData();
                const tipo=document.getElementById('vistaTipo').value, entId=entidadSeleccionada;
                if(tipo==='general') return exportarVistaGeneralExcel();
                if(!entId) return ctx.toast('Seleccione una entidad','error');
                let planes, nombre;
                if(tipo==='seccion'){ planes=planesVisiblesSeccion(entId); const s=data.secciones.find(x=>x.id===entId); nombre=s?s.nombre:'Seccion'; }
                else if(tipo==='docente'){ planes=ctx.getPlanificaciones().filter(p=>p.docenteId===entId); const d=data.docentes.find(x=>x.id===entId); nombre=d?(d.id===ctx.DOCENTE_NN_ID?'Pendiente_Docente_NN':d.apellido+'_'+d.nombre):'Docente'; }
                else{ planes=ctx.getPlanificaciones().filter(p=>p.salaId===entId); const s=data.salas.find(x=>x.id===entId); nombre=s?s.nombre:'Sala'; }
                const tl=ctx.getTemporadaLabel();
                const usarCompatible=data.configuracion.exportacionExcel==='html';
                if(usarCompatible || !window.XLSX || !window.XLSX.utils || !window.XLSX.writeFile){
                    if(!usarCompatible){
                        const cargado=ctx.asegurarXLSX ? await ctx.asegurarXLSX() : false;
                        if(cargado && window.XLSX?.utils && window.XLSX.writeFile){
                            const wb=XLSX.utils.book_new(), ws=ctx.formatearHojaHorario(XLSX.utils.aoa_to_sheet(ctx.generarMatriz(planes,tipo)));
                            XLSX.utils.book_append_sheet(wb,ws,'Horario'); XLSX.writeFile(wb,`${nombre}_${tl}.xlsx`,{bookSST:true,cellStyles:true}); ctx.toast('Vista exportada a Excel','success');
                            return;
                        }
                        const decision=await ctx.resolverFallbackExcel();
                        if(decision!=='html') return;
                    }
                    ctx.descargarTablaExcel(`${nombre}_${tl}.xls`, [{nombre:'Horario', matriz:ctx.generarMatriz(planes,tipo)}]);
                    ctx.toast('Vista exportada a Excel','success');
                    return;
                }
                const wb=XLSX.utils.book_new(), ws=ctx.formatearHojaHorario(XLSX.utils.aoa_to_sheet(ctx.generarMatriz(planes,tipo)));
                XLSX.utils.book_append_sheet(wb,ws,'Horario'); XLSX.writeFile(wb,`${nombre}_${tl}.xlsx`,{bookSST:true,cellStyles:true}); ctx.toast('Vista exportada a Excel','success');
            }catch(error){
                reportarErrorExportacion(error,'Exportar vista a Excel');
            }
        }

        async function exportarVistaGeneralExcel(){
            try{
                const vista=getVistaActual();
                if(!vista?.secciones?.length) return ctx.toast('No hay secciones para exportar','error');
                if(!(await confirmarExportacionVistaGeneral(vista,'excel'))) return;
                const data=getData();
                const tl=ctx.getTemporadaLabel();
                const usarCompatible=data.configuracion.exportacionExcel==='html';
                const porHoja=grillasPorHojaVistaGeneral();
                const grupos=partirEnGrupos(vista.secciones,porHoja);
                const hojas=grupos.map((grupo,gi)=>{
                    if(porHoja===1){
                        const sec=grupo[0]||{};
                        return {nombre:sec.nombre||`Seccion ${gi+1}`, matriz:ctx.generarMatriz(planesVisiblesSeccion(sec.id),'seccion')};
                    }
                    const matriz=[];
                    grupo.forEach((sec,si)=>{
                        if(si>0) matriz.push([''],['']);
                        matriz.push([sec.nombre||`Seccion ${gi*porHoja+si+1}`]);
                        matriz.push(...ctx.generarMatriz(planesVisiblesSeccion(sec.id),'seccion'));
                    });
                    return {nombre:`Grupo ${gi+1}`, matriz};
                });
                if(usarCompatible || !window.XLSX || !window.XLSX.utils || !window.XLSX.writeFile){
                    if(!usarCompatible){
                        const cargado=ctx.asegurarXLSX ? await ctx.asegurarXLSX() : false;
                        if(cargado && window.XLSX?.utils && window.XLSX.writeFile){
                            return exportarVistaGeneralExcelXlsx(hojas,tl);
                        }
                        const decision=await ctx.resolverFallbackExcel();
                        if(decision!=='html') return;
                    }
                    ctx.descargarTablaExcel(`Vista_General_${tl}.xls`,hojas);
                    ctx.toast('Vista general exportada a Excel','success');
                    return;
                }
                exportarVistaGeneralExcelXlsx(hojas,tl);
            }catch(error){
                reportarErrorExportacion(error,'Exportar Vista general a Excel');
            }
        }

        function exportarVistaGeneralExcelXlsx(hojas,tl){
            const wb=XLSX.utils.book_new();
            const usados=new Set();
            const nombreHoja=(nombre,respaldo)=>{
                let base=String(nombre||respaldo||'Hoja').replace(/[\\/?*:[\]]/g,'-').substring(0,31)||'Hoja';
                let final=base, i=2;
                while(usados.has(final.toLowerCase())){
                    const sufijo=` ${i++}`;
                    final=base.substring(0,31-sufijo.length)+sufijo;
                }
                usados.add(final.toLowerCase());
                return final;
            };
            hojas.forEach((h,i)=>{
                const ws=ctx.formatearHojaHorario(XLSX.utils.aoa_to_sheet(h.matriz.length?h.matriz:[['Sin datos']]));
                XLSX.utils.book_append_sheet(wb,ws,nombreHoja(h.nombre,`Seccion ${i+1}`));
            });
            if(!wb.SheetNames.length) XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['Sin datos']]),'Sin datos');
            XLSX.writeFile(wb,`Vista_General_${tl}.xlsx`,{bookSST:true,cellStyles:true});
            ctx.toast('Vista general exportada a Excel','success');
        }

        async function exportarVistaJPG(){
            try{
                const vista=getVistaActual();
                if(!vista) return ctx.toast('Seleccione una entidad','error');
                if(!(await confirmarExportacionVistaGeneral(vista,'jpg'))) return;
                if(ctx.asegurarHtml2Canvas && !(await ctx.asegurarHtml2Canvas())) return;
                const tl=ctx.getTemporadaLabel();
                window.scrollTo(0,0);
                if(vista.tipo==='general'){
                    const grupos=partirEnGrupos(vista.secciones,grillasPorHojaVistaGeneral());
                    for(const [i,grupo] of grupos.entries()){
                        const grid=crearExportacionVistaGeneral(vista,grupo,`Parte ${i+1} de ${grupos.length}`);
                        const canvas=await capturarGridFijo(grid);
                        const link=document.createElement('a');
                        link.download=`${vista.nombre}_${tl}_parte_${i+1}.jpg`;
                        link.href=canvas.toDataURL('image/jpeg',0.95);
                        link.click();
                        await new Promise(resolve=>setTimeout(resolve,120));
                    }
                    ctx.toast(grupos.length>1?`Vista exportada en ${grupos.length} imágenes`:'Vista exportada como imagen','success');
                    return;
                }
                const grid=crearGridExportacion(vista);
                const canvas=await capturarGridFijo(grid);
                const link=document.createElement('a'); link.download=vista.nombre+'_'+tl+'.jpg'; link.href=canvas.toDataURL('image/jpeg',0.95); link.click(); ctx.toast('Vista exportada como imagen','success');
            }catch(error){
                reportarErrorExportacion(error,'Exportar vista a JPG');
            }
        }

        async function exportarVistaPDF(){
            try{
                const vista=getVistaActual();
                if(!vista) return ctx.toast('Seleccione una entidad','error');
                if(!(await confirmarExportacionVistaGeneral(vista,'pdf'))) return;
                if(ctx.asegurarHtml2Canvas && !(await ctx.asegurarHtml2Canvas())) return;
                if(ctx.asegurarJsPDF && !(await ctx.asegurarJsPDF())) return;
                const tl=ctx.getTemporadaLabel();
                window.scrollTo(0,0);
                if(vista.tipo==='general'){
                    const {jsPDF}=window.jspdf; const doc=new jsPDF('landscape','mm','a4');
                    const pageW=doc.internal.pageSize.getWidth();
                    const pageH=doc.internal.pageSize.getHeight();
                    const grupos=partirEnGrupos(vista.secciones,grillasPorHojaVistaGeneral());
                    for(const [i,grupo] of grupos.entries()){
                        if(i>0) doc.addPage('a4','landscape');
                        const grid=crearExportacionVistaGeneral(vista,grupo,`Página ${i+1} de ${grupos.length}`);
                        const canvas=await capturarGridFijo(grid);
                        const imgData=canvas.toDataURL('image/jpeg',0.95);
                        const ratio=Math.min(pageW/canvas.width,pageH/canvas.height);
                        const imgW=canvas.width*ratio;
                        const imgH=canvas.height*ratio;
                        const x=(pageW-imgW)/2;
                        const y=(pageH-imgH)/2;
                        doc.addImage(imgData,'JPEG',x,y,imgW,imgH);
                    }
                    doc.save(vista.nombre+'_'+tl+'.pdf'); ctx.toast('PDF exportado','success');
                    return;
                }
                const grid=crearGridExportacion(vista);
                const canvas=await capturarGridFijo(grid);
                const imgData=canvas.toDataURL('image/jpeg',0.95);
                const {jsPDF}=window.jspdf; const doc=new jsPDF('landscape','mm','a4');
                const imgW=297, imgH=canvas.height*imgW/canvas.width;
                doc.addImage(imgData,'JPEG',0,0,imgW,Math.min(imgH,210));
                doc.save(vista.nombre+'_'+tl+'.pdf'); ctx.toast('PDF exportado','success');
            }catch(error){
                reportarErrorExportacion(error,'Exportar vista a PDF');
            }
        }

        async function exportarPdf(){
            try{
                const vista=getVistaActual();
                if(!vista) return ctx.toast('Seleccione una entidad en Vista Horarios','error');
                if(ctx.asegurarHtml2Canvas && !(await ctx.asegurarHtml2Canvas())) return;
                if(ctx.asegurarJsPDF && !(await ctx.asegurarJsPDF())) return;
                const grid=crearGridExportacion(vista); const tl=ctx.getTemporadaLabel();
                window.scrollTo(0,0);
                const canvas=await capturarGridFijo(grid);
                const imgData=canvas.toDataURL('image/jpeg',0.95);
                const {jsPDF}=window.jspdf; const doc=new jsPDF('landscape','mm','a4');
                const imgW=297, imgH=canvas.height*imgW/canvas.width;
                doc.addImage(imgData,'JPEG',0,0,imgW,Math.min(imgH,200));
                doc.save('Planificacion_'+tl+'.pdf'); ctx.toast('PDF exportado','success');
            }catch(error){
                reportarErrorExportacion(error,'Exportar PDF general desde Vista Horarios');
            }
        }

        function init(){
            ['vistaBusqueda','vistaBusqueda2'].forEach(id=>{
                const isSecond=id==='vistaBusqueda2';
                const resultadosId=isSecond?'vistaResultados2':'vistaResultados';
                const targetKey=isSecond?'secundaria':'principal';
                const clearId=isSecond?'clearVistaBusqueda2':'clearVistaBusqueda';
                const input=document.getElementById(id);
                const clear=document.getElementById(clearId);
                if(!input||!clear) return;
                input.addEventListener('focus',function(){
                    if(!this.value) mostrarOpcionesVista(id,resultadosId,targetKey,null,clearId);
                });
                input.addEventListener('input',function(){
                    filtrarVistaEntidad(id,resultadosId,targetKey,null,clearId);
                });
                clear.addEventListener('click',()=>{
                    const inputActual=document.getElementById(id);
                    if(inputActual) inputActual.value='';
                    if(isSecond) entidadSeleccionada2=null;
                    else entidadSeleccionada=null;
                    document.getElementById(resultadosId)?.classList.remove('show');
                    document.getElementById(clearId)?.classList.remove('visible'); construirVistaGrid();
                });
            });

            document.getElementById('vistaTipo')?.addEventListener('change',()=>{
                sincronizarModoVista();
                document.getElementById('vistaBusqueda')&&(document.getElementById('vistaBusqueda').value=''); entidadSeleccionada=null;
                document.getElementById('vistaResultados')?.classList.remove('show'); document.getElementById('clearVistaBusqueda')?.classList.remove('visible');
                if(document.getElementById('vistaFiltroAdicional')) document.getElementById('vistaFiltroAdicional').value='';
                const grupoFiltro2=document.getElementById('grupoFiltro2');
                if(grupoFiltro2) grupoFiltro2.style.display='none';
                document.getElementById('vistaBusqueda2')&&(document.getElementById('vistaBusqueda2').value=''); entidadSeleccionada2=null;
                construirVistaGrid();
            });
            document.getElementById('vistaEspecialidadDocente')?.addEventListener('change',()=>{
                document.getElementById('vistaBusqueda')&&(document.getElementById('vistaBusqueda').value='');
                entidadSeleccionada=null;
                document.getElementById('vistaResultados')?.classList.remove('show');
                document.getElementById('clearVistaBusqueda')?.classList.remove('visible');
                construirVistaGrid();
            });
            ['vistaGeneralArea','vistaGeneralCarrera','vistaGeneralNivel','vistaGeneralJornada','vistaGeneralSeccion'].forEach(id=>{
                document.getElementById(id)?.addEventListener('change',()=>{
                    vistaGeneralPagina=1;
                    actualizarFiltrosVistaGeneral();
                    construirVistaGrid();
                });
            });
            document.getElementById('vistaFiltroAdicional')?.addEventListener('change',function(){
                const show=this.value!=='';
                const grupoFiltro2=document.getElementById('grupoFiltro2');
                if(grupoFiltro2) grupoFiltro2.style.display=show?'block':'none';
                if(!show){ document.getElementById('vistaBusqueda2')&&(document.getElementById('vistaBusqueda2').value=''); entidadSeleccionada2=null; }
                construirVistaGrid();
            });
            function ajustarDropdownVista(){
                const menu=document.getElementById('vistaExportDropdown');
                const boton=document.getElementById('btnExportarVista');
                if(!menu||!boton||!menu.classList.contains('show')) return;
                menu.style.left='';
                menu.style.right='';
                menu.style.maxHeight='';
                menu.style.overflowY='';
                const rect=menu.getBoundingClientRect();
                const btnRect=boton.getBoundingClientRect();
                const margen=12;
                if(rect.right>window.innerWidth-margen){
                    const delta=rect.right-(window.innerWidth-margen);
                    menu.style.right=`${delta}px`;
                }
                if(rect.left<margen){
                    menu.style.left=`${margen-btnRect.left}px`;
                    menu.style.right='auto';
                }
                const rect2=menu.getBoundingClientRect();
                if(rect2.bottom>window.innerHeight-margen){
                    menu.style.maxHeight=`${Math.max(140,window.innerHeight-rect2.top-margen)}px`;
                    menu.style.overflowY='auto';
                }
            }
            document.getElementById('btnExportarVista')?.addEventListener('click',(e)=>{
                e.stopPropagation();
                const menu=document.getElementById('vistaExportDropdown');
                if(!menu) return;
                document.querySelectorAll('.dropdown-menu').forEach(m=>{ if(m!==menu) m.classList.remove('show'); });
                menu.classList.toggle('show');
                if(menu.classList.contains('show')) requestAnimationFrame(ajustarDropdownVista);
            });
            document.getElementById('vistaExportDropdown')?.addEventListener('click',(e)=>{
                const format=e.target.dataset.format;
                if(format==='excel') exportarVistaExcel();
                else if(format==='jpg') exportarVistaJPG();
                else if(format==='pdf') exportarVistaPDF();
                document.getElementById('vistaExportDropdown')?.classList.remove('show');
            });
            document.addEventListener('click',(e)=>{if(!e.target.closest('#btnExportarVista')) document.getElementById('vistaExportDropdown')?.classList.remove('show');});
            document.getElementById('vistaGrid')?.addEventListener('contextmenu',(e)=>{
                const cell=e.target.closest?.('.grid-cell.planned');
                if(!cell) return;
                e.preventDefault();
                abrirMenuVista(cell,e);
            });
            document.addEventListener('pointerdown',(e)=>{
                if(e.target.closest?.('.vista-context-popup')) return;
                cerrarMenuVista();
            },true);
            sincronizarModoVista();
        }

        return { actualizarVista, construirVistaGrid, exportarVistaExcel, exportarVistaJPG, exportarVistaPDF, exportarPdf, init };
    }

    window.PlanificadorVistaHorario = { create: createVistaHorario };
})();
