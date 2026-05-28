(function(){
    function createVistaHorario(ctx){
        let entidadSeleccionada = null;
        let entidadSeleccionada2 = null;
        const getData = ctx.getData;
        const EXPORT_WIDTH = 1510;
        function planesVisiblesSeccion(seccionId){
            const data=getData();
            const propios=data.planificaciones.filter(p=>p.seccionId===seccionId);
            const heredados=(Array.isArray(data.gruposDictacion)?data.gruposDictacion:[])
                .filter(g=>g.seccionMadreId!==seccionId&&g.seccionesVinculadasIds?.includes(seccionId))
                .flatMap(g=>{
                    const ids=[g.asignaturaId,...(g.asignaturasEquivalentesIds||[])].filter(Boolean);
                    return data.planificaciones
                        .filter(p=>p.seccionId===g.seccionMadreId&&ids.includes(p.asignaturaId))
                        .map(p=>Object.assign({},p,{vinculado:true,seccionVistaId:seccionId,seccionOrigenId:g.seccionMadreId}));
                });
            const vistos=new Set();
            return [...propios,...heredados].filter(p=>{
                const key=[p.dia,p.bloque,p.asignaturaId,p.seccionId].join('|');
                if(vistos.has(key)) return false;
                vistos.add(key);
                return true;
            });
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
            try{
                return await html2canvas(wrapper,{
                    scale:2,
                    useCORS:true,
                    backgroundColor:'#ffffff',
                    width:EXPORT_WIDTH,
                    height:wrapper.scrollHeight,
                    windowWidth:EXPORT_WIDTH,
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

        function llenarCeldaPlanificada(cell, plan, tipo, data){
            cell.classList.add('planned');
            const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
            cell.style.backgroundColor=asig?.color||'#e9ecef';
            cell.innerHTML='';
            const linea1=document.createElement('span');
            linea1.textContent=asig?.codigo||'';
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
            cell.append(linea1,linea2,linea3);
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

        function getOpcionesVista(tipo) {
            const data = getData();
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
            const opciones=getOpcionesVista(tipo||document.getElementById('vistaFiltroAdicional')?.value||document.getElementById('vistaTipo').value);
            resultados.innerHTML='';
            opciones.slice(0,10).forEach(o=>{
                const li=document.createElement('li'); li.textContent=o.nombre;
                li.onclick=()=>{
                    if(targetKey==='principal') entidadSeleccionada=o.id;
                    else entidadSeleccionada2=o.id;
                    input.value=o.nombre; resultados.classList.remove('show');
                    if(clearId) document.getElementById(clearId).classList.add('visible');
                    construirVistaGrid();
                };
                resultados.appendChild(li);
            });
            resultados.classList.add('show');
        }

        function filtrarVistaEntidad(inputId, resultadosId, targetKey, tipo, clearId){
            const input=document.getElementById(inputId), resultados=document.getElementById(resultadosId), filter=input.value.toLowerCase();
            const opciones=getOpcionesVista(tipo||document.getElementById('vistaFiltroAdicional')?.value||document.getElementById('vistaTipo').value);
            resultados.innerHTML=''; document.getElementById(clearId).classList.toggle('visible',input.value.length>0);
            if(!filter){mostrarOpcionesVista(inputId, resultadosId, targetKey, tipo, clearId); return;}
            const filtradas=opciones.filter(o=>o.nombre.toLowerCase().includes(filter));
            if(filtradas.length===0){resultados.classList.remove('show');return;}
            filtradas.slice(0,10).forEach(o=>{
                const li=document.createElement('li'); li.textContent=o.nombre;
                li.onclick=()=>{
                    if(targetKey==='principal') entidadSeleccionada=o.id;
                    else entidadSeleccionada2=o.id;
                    input.value=o.nombre; resultados.classList.remove('show');
                    document.getElementById(clearId).classList.add('visible'); construirVistaGrid();
                };
                resultados.appendChild(li);
            });
            resultados.classList.add('show');
        }

        function construirVistaGrid(){
            const data = getData();
            const tipo=document.getElementById('vistaTipo').value, entId=entidadSeleccionada, grid=document.getElementById('vistaGrid');
            const filtroAdicional=document.getElementById('vistaFiltroAdicional')?.value||'', entId2=entidadSeleccionada2;
            grid.innerHTML=''; if(!entId) return;
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
            actualizarFiltroEspecialidadDocenteVista();
            document.getElementById('vistaBusqueda').value=''; entidadSeleccionada=null;
            document.getElementById('vistaResultados').classList.remove('show'); document.getElementById('clearVistaBusqueda').classList.remove('visible');
            document.getElementById('vistaBusqueda2').value=''; entidadSeleccionada2=null;
            document.getElementById('vistaResultados2').classList.remove('show'); document.getElementById('clearVistaBusqueda2').classList.remove('visible');
            document.getElementById('grupoFiltro2').style.display='none';
            construirVistaGrid();
        }

        async function exportarVistaExcel(){
            const data = getData();
            const tipo=document.getElementById('vistaTipo').value, entId=entidadSeleccionada;
            if(!entId) return ctx.toast('Seleccione una entidad','error');
            let planes, nombre;
            if(tipo==='seccion'){ planes=planesVisiblesSeccion(entId); const s=data.secciones.find(x=>x.id===entId); nombre=s?s.nombre:'Seccion'; }
            else if(tipo==='docente'){ planes=ctx.getPlanificaciones().filter(p=>p.docenteId===entId); const d=data.docentes.find(x=>x.id===entId); nombre=d?(d.id===ctx.DOCENTE_NN_ID?'Pendiente_Docente_NN':d.apellido+'_'+d.nombre):'Docente'; }
            else{ planes=ctx.getPlanificaciones().filter(p=>p.salaId===entId); const s=data.salas.find(x=>x.id===entId); nombre=s?s.nombre:'Sala'; }
            const tl=ctx.getTemporadaLabel();
            const usarCompatible=data.configuracion.exportacionExcel==='html';
            if(usarCompatible || !window.XLSX || !window.XLSX.utils || !window.XLSX.writeFile){
                if(!usarCompatible){
                    const decision=await ctx.resolverFallbackExcel();
                    if(decision!=='html') return;
                }
                ctx.descargarTablaExcel(`${nombre}_${tl}.xls`, [{nombre:'Horario', matriz:ctx.generarMatriz(planes,tipo)}]);
                ctx.toast('Vista exportada a Excel','success');
                return;
            }
            const wb=XLSX.utils.book_new(), ws=ctx.formatearHojaHorario(XLSX.utils.aoa_to_sheet(ctx.generarMatriz(planes,tipo)));
            XLSX.utils.book_append_sheet(wb,ws,'Horario'); XLSX.writeFile(wb,`${nombre}_${tl}.xlsx`,{bookSST:true,cellStyles:true}); ctx.toast('Vista exportada a Excel','success');
        }

        function exportarVistaJPG(){
            const vista=getVistaActual();
            if(!vista) return ctx.toast('Seleccione una entidad','error');
            const grid=crearGridExportacion(vista);
            const tl=ctx.getTemporadaLabel();
            window.scrollTo(0,0);
            capturarGridFijo(grid).then(canvas=>{
                const link=document.createElement('a'); link.download=vista.nombre+'_'+tl+'.jpg'; link.href=canvas.toDataURL('image/jpeg',0.95); link.click(); ctx.toast('Vista exportada como imagen','success');
            }).catch(()=>ctx.toast('Error al exportar imagen','error'));
        }

        function exportarVistaPDF(){
            const vista=getVistaActual();
            if(!vista) return ctx.toast('Seleccione una entidad','error');
            const tl=ctx.getTemporadaLabel(); const grid=crearGridExportacion(vista);
            window.scrollTo(0,0);
            capturarGridFijo(grid).then(canvas=>{
                const imgData=canvas.toDataURL('image/jpeg',0.95);
                const {jsPDF}=window.jspdf; const doc=new jsPDF('landscape','mm','a4');
                const imgW=297, imgH=canvas.height*imgW/canvas.width;
                doc.addImage(imgData,'JPEG',0,0,imgW,Math.min(imgH,200));
                doc.save(vista.nombre+'_'+tl+'.pdf'); ctx.toast('PDF exportado','success');
            }).catch(()=>ctx.toast('Error al exportar PDF','error'));
        }

        function exportarPdf(){
            const vista=getVistaActual();
            if(!vista) return ctx.toast('Seleccione una entidad en Vista Horarios','error');
            const grid=crearGridExportacion(vista); const tl=ctx.getTemporadaLabel();
            window.scrollTo(0,0);
            capturarGridFijo(grid).then(canvas=>{
                const imgData=canvas.toDataURL('image/jpeg',0.95);
                const {jsPDF}=window.jspdf; const doc=new jsPDF('landscape','mm','a4');
                const imgW=297, imgH=canvas.height*imgW/canvas.width;
                doc.addImage(imgData,'JPEG',0,0,imgW,Math.min(imgH,200));
                doc.save('Planificacion_'+tl+'.pdf'); ctx.toast('PDF exportado','success');
            }).catch(()=>ctx.toast('Error al exportar PDF','error'));
        }

        function init(){
            ['vistaBusqueda','vistaBusqueda2'].forEach(id=>{
                const isSecond=id==='vistaBusqueda2';
                const resultadosId=isSecond?'vistaResultados2':'vistaResultados';
                const targetKey=isSecond?'secundaria':'principal';
                const clearId=isSecond?'clearVistaBusqueda2':'clearVistaBusqueda';
                document.getElementById(id).addEventListener('focus',function(){
                    if(!this.value) mostrarOpcionesVista(id,resultadosId,targetKey,null,clearId);
                });
                document.getElementById(id).addEventListener('input',function(){
                    filtrarVistaEntidad(id,resultadosId,targetKey,null,clearId);
                });
                document.getElementById(clearId).addEventListener('click',()=>{
                    document.getElementById(id).value='';
                    if(isSecond) entidadSeleccionada2=null;
                    else entidadSeleccionada=null;
                    document.getElementById(resultadosId).classList.remove('show');
                    document.getElementById(clearId).classList.remove('visible'); construirVistaGrid();
                });
            });

            document.getElementById('vistaTipo').addEventListener('change',()=>{
                actualizarFiltroEspecialidadDocenteVista();
                document.getElementById('vistaBusqueda').value=''; entidadSeleccionada=null;
                document.getElementById('vistaResultados').classList.remove('show'); document.getElementById('clearVistaBusqueda').classList.remove('visible'); construirVistaGrid();
                if(document.getElementById('vistaFiltroAdicional')) document.getElementById('vistaFiltroAdicional').value='';
                document.getElementById('grupoFiltro2').style.display='none';
                document.getElementById('vistaBusqueda2').value=''; entidadSeleccionada2=null;
            });
            document.getElementById('vistaEspecialidadDocente')?.addEventListener('change',()=>{
                document.getElementById('vistaBusqueda').value='';
                entidadSeleccionada=null;
                document.getElementById('vistaResultados').classList.remove('show');
                document.getElementById('clearVistaBusqueda').classList.remove('visible');
                construirVistaGrid();
            });
            document.getElementById('vistaFiltroAdicional')?.addEventListener('change',function(){
                const show=this.value!=='';
                document.getElementById('grupoFiltro2').style.display=show?'block':'none';
                if(!show){ document.getElementById('vistaBusqueda2').value=''; entidadSeleccionada2=null; }
                construirVistaGrid();
            });
            document.getElementById('btnExportarVista').addEventListener('click',(e)=>{e.stopPropagation(); document.getElementById('vistaExportDropdown').classList.toggle('show');});
            document.getElementById('vistaExportDropdown').addEventListener('click',(e)=>{
                const format=e.target.dataset.format;
                if(format==='excel') exportarVistaExcel();
                else if(format==='jpg') exportarVistaJPG();
                else if(format==='pdf') exportarVistaPDF();
                document.getElementById('vistaExportDropdown').classList.remove('show');
            });
            document.addEventListener('click',(e)=>{if(!e.target.closest('#btnExportarVista')) document.getElementById('vistaExportDropdown').classList.remove('show');});
        }

        return { actualizarVista, construirVistaGrid, exportarVistaExcel, exportarVistaJPG, exportarVistaPDF, exportarPdf, init };
    }

    window.PlanificadorVistaHorario = { create: createVistaHorario };
})();
