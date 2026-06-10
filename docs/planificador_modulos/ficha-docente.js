(function(){
    function createFichaDocente(ctx){
        const getData = ctx.getData;
        const BLOQUE_HORAS_SEMESTRALES = 18;
        const MARGEN_OPERATIVO_DOCENTE = 0.15;
        const MAX_DIARIO_DOCENTE_DEFENDIBLE = 13;

        function formatoNumero(n, dec=1){
            const num=Number(n)||0;
            return num.toLocaleString('es-CL',{maximumFractionDigits:dec,minimumFractionDigits:num%1?dec:0});
        }

        function lecturaBloques(bloques, base=null){
            const b=Number(bloques)||0;
            const horas=b*BLOQUE_HORAS_SEMESTRALES;
            const pct=base ? ` · ${formatoNumero(b/base*100,1)}%` : '';
            return `${formatoNumero(b,1)} bloque(s) (${formatoNumero(horas,0)} h${pct})`;
        }

        function lecturaHoras(horas, baseHoras=null){
            const h=Number(horas)||0;
            const bloques=h/BLOQUE_HORAS_SEMESTRALES;
            const pct=baseHoras ? ` · ${formatoNumero(h/baseHoras*100,1)}%` : '';
            return `${formatoNumero(h,0)} h (${formatoNumero(bloques,1)} bloque(s)${pct})`;
        }

        function contarDisponibilidadDocente(doc){
            const disp=Array.isArray(doc?.disponibilidad)?doc.disponibilidad:[];
            const porDia=ctx.DIAS.map((_,dia)=>(Array.isArray(disp[dia])?disp[dia]:[]).filter(Boolean).length);
            const total=porDia.reduce((a,b)=>a+b,0);
            const sabado=porDia[5]||0;
            const sinSabado=total-sabado;
            const diurno=porDia.reduce((acc,_,dia)=>{
                const fila=Array.isArray(disp[dia])?disp[dia]:[];
                return acc+fila.slice(0,12).filter(Boolean).length;
            },0);
            const vespertino=porDia.reduce((acc,_,dia)=>{
                const fila=Array.isArray(disp[dia])?disp[dia]:[];
                return acc+fila.slice(12).filter(Boolean).length;
            },0);
            const utilizablePorDia=porDia.map(cant=>Math.min(Number(cant)||0,MAX_DIARIO_DOCENTE_DEFENDIBLE));
            const utilizableTotal=utilizablePorDia.reduce((a,b)=>a+b,0);
            const utilizableSinSabado=utilizableTotal-Math.min(sabado,MAX_DIARIO_DOCENTE_DEFENDIBLE);
            return {porDia,total,sabado,sinSabado,diurno,vespertino,utilizableTotal,utilizableSinSabado};
        }

        function estadoCargaDefendible(capacidadHoras, homologoHoras, cargaHoras){
            if(!homologoHoras) return 'Sin homólogo';
            const ratio=capacidadHoras/homologoHoras;
            const cargaRatio=cargaHoras/homologoHoras;
            if(cargaRatio>ratio+0.1) return 'Revisar carga';
            if(ratio>=0.9) return 'Compatible';
            if(ratio>=0.7) return 'Reducción parcial';
            return 'Reducción justificada';
        }

        function calcularResumenDefendible(doc, data){
            const disp=contarDisponibilidadDocente(doc);
            const bloquesPlanificados=(ctx.getPlanificaciones?.()||data.planificaciones||[]).filter(p=>p.docenteId===doc.id).length;
            const horasActuales=bloquesPlanificados*BLOQUE_HORAS_SEMESTRALES;
            const homologoHoras=Number(doc.horasHomologo)||0;
            const homologoBloques=homologoHoras/BLOQUE_HORAS_SEMESTRALES;
            const capacidadBloques=Math.max(0,disp.utilizableSinSabado*(1-MARGEN_OPERATIVO_DOCENTE));
            const capacidadHoras=capacidadBloques*BLOQUE_HORAS_SEMESTRALES;
            return {
                disp,
                bloquesPlanificados,
                horasActuales,
                homologoHoras,
                homologoBloques,
                capacidadBloques,
                capacidadHoras,
                estado:estadoCargaDefendible(capacidadHoras,homologoHoras,horasActuales)
            };
        }

        function abrirCargaDefendibleEnReportes(doc){
            if(ctx.activarTab && ctx.activarTab('reportes')===false) return;
            const tipo=document.getElementById('reporteTipo');
            const busqueda=document.getElementById('reporteBusqueda');
            if(tipo) tipo.value='cargaDefendible';
            if(busqueda) busqueda.value=[doc.nombre,doc.apellido].filter(Boolean).join(' ');
            if(ctx.actualizarReporte) ctx.actualizarReporte();
        }

        function actualizarFichaDocentes(){
            const data = getData();
            const sel=document.getElementById('fichaDocente');
            if(!sel) return;
            const seleccionado = sel.value;
            const espSelect=document.getElementById('fichaEspFiltro');
            if(espSelect){
                const espSeleccionada=espSelect.value;
                const especialidades=[...new Set(data.docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID).map(d=>d.especialidad).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
                espSelect.innerHTML='<option value="">-- Especialidad --</option><option value="__todas__">Todas</option>'+especialidades.map(e=>ctx.optionHTML(e,e)).join('');
                if(espSeleccionada && (espSeleccionada==='__todas__'||especialidades.includes(espSeleccionada))) espSelect.value=espSeleccionada;
            }
            const espFiltro=document.getElementById('fichaEspFiltro')?.value||'';
            let docs=data.docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID);
            if(espFiltro&&espFiltro!=='__todas__') docs=docs.filter(d=>d.especialidad===espFiltro);
            docs.sort((a,b)=>a.apellido?.localeCompare(b.apellido));
            sel.disabled=!espFiltro;
            sel.innerHTML=espFiltro?'<option value="">-- Seleccionar docente --</option>'+docs.map(d=>ctx.optionHTML(d.id, `${d.apellido}, ${d.nombre}${d.especialidad?` [${d.especialidad}]`:''}`)).join(''):'<option value="">Selecciona una especialidad primero</option>';
            if(seleccionado && docs.some(d=>d.id===seleccionado)) sel.value=seleccionado;
        }

        function renderFichaDocente(){
            const data = getData();
            const docId=document.getElementById('fichaDocente')?.value;
            const cont=document.getElementById('fichaContenido');
            if(!cont) return;
            if(!docId){ cont.style.display='none'; cont.innerHTML=''; return; }
            const doc=data.docentes.find(d=>d.id===docId);
            if(!doc) return;
            const p=ctx.getPlanificaciones().filter(pl=>pl.docenteId===docId);
            const diasDisponibles=doc.disponibilidad||ctx.DIAS.map(()=>Array(18).fill(false));
            const cargaDefendible=calcularResumenDefendible(doc,data);
            let html='<div style="display:flex;gap:16px;flex-wrap:wrap;">';
            html+='<div style="flex:2;min-width:650px;"><div style="font-size:1.1rem;font-weight:600;margin-bottom:8px;">'+ctx.escapeHTML(doc.nombre)+' '+ctx.escapeHTML(doc.apellido)+(doc.especialidad?' <small style="font-size:0.8rem;color:var(--text-secondary)">['+ctx.escapeHTML(doc.especialidad)+']</small>':'')+'</div>';
            html+='<div class="teacher-defensible-panel">';
            html+='<div class="teacher-defensible-header"><div><strong>Carga defendible</strong><span>Resumen ejecutivo para comparar disponibilidad, homólogo y carga actual.</span></div><button type="button" class="btn btn-sm" id="btnFichaCargaDefendible">Ver detalle</button></div>';
            html+='<div class="teacher-defensible-metrics">';
            html+='<div><span>Homólogo anterior</span><strong>'+ctx.escapeHTML(lecturaHoras(cargaDefendible.homologoHoras,cargaDefendible.homologoHoras||null))+'</strong></div>';
            html+='<div><span>Carga actual</span><strong>'+ctx.escapeHTML(lecturaBloques(cargaDefendible.bloquesPlanificados,cargaDefendible.homologoBloques||null))+'</strong></div>';
            html+='<div><span>Capacidad defendible</span><strong>'+ctx.escapeHTML(lecturaBloques(cargaDefendible.capacidadBloques,cargaDefendible.homologoBloques||null))+'</strong></div>';
            html+='<div class="teacher-defensible-state"><span>Estado</span><strong>'+ctx.escapeHTML(cargaDefendible.estado)+'</strong></div>';
            html+='</div>';
            html+='<div class="teacher-defensible-detail">';
            html+='<span>Sin sábado <strong>'+ctx.escapeHTML(lecturaBloques(cargaDefendible.disp.sinSabado,cargaDefendible.disp.total||null))+'</strong></span>';
            html+='<span>Sábado <strong>'+ctx.escapeHTML(lecturaBloques(cargaDefendible.disp.sabado,cargaDefendible.disp.total||null))+'</strong></span>';
            html+='<span>Día <strong>'+ctx.escapeHTML(lecturaBloques(cargaDefendible.disp.diurno,cargaDefendible.disp.total||null))+'</strong></span>';
            html+='<span>Noche <strong>'+ctx.escapeHTML(lecturaBloques(cargaDefendible.disp.vespertino,cargaDefendible.disp.total||null))+'</strong></span>';
            html+='</div></div>';
            html+='<div style="overflow-x:auto;border:1px solid var(--border);border-radius:var(--radius);">';
            html+='<table style="border-collapse:collapse;font-size:0.65rem;width:100%;table-layout:fixed;">';
            html+='<colgroup><col style="width:38px;"><col style="width:62px;">';
            for(let i=0;i<6;i++) html+='<col style="width:105px;">';
            html+='</colgroup>';
            html+='<tr style="background:var(--surface-alt);"><th style="padding:4px 2px;border:1px solid var(--border);text-align:center;font-size:0.6rem;height:22px;">Bloque</th><th style="padding:4px 2px;border:1px solid var(--border);text-align:center;font-size:0.6rem;">Horario</th>';
            ctx.DIAS.forEach(d=>html+='<th style="padding:4px 2px;border:1px solid var(--border);text-align:center;font-size:0.6rem;height:22px;">'+ctx.escapeHTML(d.substring(0,3))+'</th>');
            html+='</tr>';
            ctx.BLOQUES.forEach(b=>{
                html+='<tr><td style="padding:2px;border:1px solid var(--border);text-align:center;font-weight:600;font-size:0.6rem;background:var(--surface-alt);height:48px;">B'+b.n+'</td><td style="padding:2px;border:1px solid var(--border);text-align:center;font-size:0.55rem;background:var(--surface-alt);">'+b.inicio+'-'+b.fin+'</td>';
                ctx.DIAS.forEach((d,di)=>{
                    const plan=p.find(pl=>pl.dia===di&&pl.bloque===b.n);
                    const disponible=diasDisponibles[di]?.[b.n-1];
                    if(plan){
                        const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
                        const sec=data.secciones.find(s=>s.id===plan.seccionId);
                        const sala=data.salas.find(s=>s.id===plan.salaId);
                        html+='<td style="padding:2px 1px;border:1px solid var(--border);text-align:center;vertical-align:middle;word-wrap:break-word;background:'+(ctx.colorAsignaturaPlanhor?.(asig)||ctx.colorSeguro(asig?.color,'var(--planhor-subject-neutral)'))+';font-size:0.6rem;line-height:1.3;">'+ctx.escapeHTML(asig?.codigo||'?')+'<br><span style="font-size:0.55rem;">'+ctx.escapeHTML(sala?sala.nombre:'')+'</span><br><span style="font-size:0.55rem;">'+ctx.escapeHTML(sec?sec.nombre:'')+'</span></td>';
                    } else if(!disponible){
                        html+='<td style="padding:2px;border:1px solid var(--border);text-align:center;background:var(--planhor-unavailable-bg);color:var(--planhor-unavailable-text);font-size:0.6rem;height:48px;">x</td>';
                    } else {
                        html+='<td style="padding:2px;border:1px solid var(--border);text-align:center;height:48px;"></td>';
                    }
                });
                html+='</tr>';
            });
            html+='</table></div></div>';
            html+='<div style="flex:1;min-width:280px;"><div style="font-size:1rem;font-weight:600;margin-bottom:8px;">📋 Resumen carga académica</div>';
            html+='<table style="border-collapse:collapse;font-size:0.78rem;width:100%;">';
            html+='<tr style="background:var(--surface-alt);"><th style="padding:6px 8px;border:1px solid var(--border);text-align:left;">Asignatura</th><th style="padding:6px 8px;border:1px solid var(--border);text-align:center;">Horas</th></tr>';
            const agrupado={};
            p.forEach(pl=>{
                const asig=data.asignaturas.find(a=>a.id===pl.asignaturaId);
                if(!asig) return;
                if(!agrupado[asig.id]) agrupado[asig.id]={codigo:asig.codigo,nombre:asig.nombre,horas:0,tipo:pl.tipoPresencial};
                agrupado[asig.id].horas+=18;
            });
            let totalHoras=0;
            Object.values(agrupado).forEach(a=>{
                html+='<tr><td style="padding:4px 8px;border:1px solid var(--border);">'+ctx.escapeHTML(a.codigo)+' - '+ctx.escapeHTML(a.nombre)+'</td><td style="padding:4px 8px;border:1px solid var(--border);text-align:center;">'+a.horas+'</td></tr>';
                totalHoras+=a.horas;
            });
            html+='<tr style="font-weight:700;background:var(--surface-alt);"><td style="padding:6px 8px;border:1px solid var(--border);">TOTAL</td><td style="padding:6px 8px;border:1px solid var(--border);text-align:center;">'+totalHoras+'</td></tr>';
            const hom=doc.horasHomologo;
            if(hom) html+='<tr><td style="padding:4px 8px;border:1px solid var(--border);font-size:0.7rem;color:var(--text-secondary);">Homólogo anterior</td><td style="padding:4px 8px;border:1px solid var(--border);text-align:center;font-size:0.7rem;color:var(--text-secondary);">'+hom+'</td></tr>';
            html+='</table></div></div>';
            cont.innerHTML=html;
            cont.style.display='block';
            document.getElementById('btnFichaCargaDefendible')?.addEventListener('click',()=>abrirCargaDefendibleEnReportes(doc));
        }

        const EXPORT_WIDTH = 1510;

        async function capturarFichaFija(elemento){
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

        async function exportarFichaPDF(){
            const data = getData();
            const docId=document.getElementById('fichaDocente')?.value;
            if(!docId) return;
            const doc=data.docentes.find(d=>d.id===docId);
            if(!doc) return;
            if(ctx.asegurarHtml2Canvas && !(await ctx.asegurarHtml2Canvas())) return;
            if(ctx.asegurarJsPDF && !(await ctx.asegurarJsPDF())) return;
            const grid=document.getElementById('fichaContenido');
            window.scrollTo(0,0);
            capturarFichaFija(grid).then(canvas=>{
                const imgData=canvas.toDataURL('image/jpeg',0.95);
                const {jsPDF}=window.jspdf;
                const pdf=new jsPDF('landscape','mm','a4');
                const iw=297, ih=canvas.height*iw/canvas.width;
                pdf.addImage(imgData,'JPEG',0,0,iw,Math.min(ih,200));
                pdf.save('Ficha_'+doc.apellido+'_'+doc.nombre+'_'+ctx.getTemporadaLabel()+'.pdf');
                ctx.toast('PDF exportado','success');
            }).catch(()=>ctx.toast('Error al exportar PDF','error'));
        }

        async function exportarFichaJPG(){
            const data = getData();
            const docId=document.getElementById('fichaDocente')?.value;
            if(!docId) return;
            const doc=data.docentes.find(d=>d.id===docId);
            if(!doc) return;
            if(ctx.asegurarHtml2Canvas && !(await ctx.asegurarHtml2Canvas())) return;
            const grid=document.getElementById('fichaContenido');
            window.scrollTo(0,0);
            capturarFichaFija(grid).then(canvas=>{
                const link=document.createElement('a');
                link.download='Ficha_'+doc.apellido+'_'+doc.nombre+'_'+ctx.getTemporadaLabel()+'.jpg';
                link.href=canvas.toDataURL('image/jpeg',0.95);
                link.click();
                ctx.toast('JPG exportado','success');
            }).catch(()=>ctx.toast('Error al exportar JPG','error'));
        }

        function init(){
            document.getElementById('fichaDocente')?.addEventListener('change',renderFichaDocente);
            document.getElementById('fichaDocente')?.addEventListener('focus',actualizarFichaDocentes);
            document.getElementById('fichaDocente')?.addEventListener('click',actualizarFichaDocentes);
            document.getElementById('fichaEspFiltro')?.addEventListener('change',()=>{
                actualizarFichaDocentes();
                document.getElementById('fichaDocente').value='';
                renderFichaDocente();
            });
            document.getElementById('btnExportarFichaPDF')?.addEventListener('click',exportarFichaPDF);
            document.getElementById('btnExportarFichaJPG')?.addEventListener('click',exportarFichaJPG);
        }

        return { actualizarFichaDocentes, renderFichaDocente, init };
    }

    window.PlanificadorFichaDocente = { create: createFichaDocente };
})();
