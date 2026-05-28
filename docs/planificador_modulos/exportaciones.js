(function(){
    function createExportaciones(ctx){
        function planesVisiblesCurso(seccionId){
            const data=ctx.getData();
            const propios=ctx.getPlanificaciones().filter(p=>p.seccionId===seccionId);
            const heredados=(Array.isArray(data.gruposDictacion)?data.gruposDictacion:[])
                .filter(g=>g.seccionMadreId!==seccionId&&g.seccionesVinculadasIds?.includes(seccionId))
                .flatMap(g=>{
                    const ids=[g.asignaturaId,...(g.asignaturasEquivalentesIds||[])].filter(Boolean);
                    return ctx.getPlanificaciones()
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
        function getXLSX(){
            const xlsx = window.XLSX;
            if (!xlsx || !xlsx.utils || !xlsx.writeFile) return null;
            return xlsx;
        }
        async function resolverModoExportacion(){
            if ((ctx.getModoExcel?.() || 'xlsx') === 'html') return 'html';
            if (getXLSX()) return 'xlsx';
            const decision = ctx.resolverFallbackExcel ? await ctx.resolverFallbackExcel() : 'html';
            return decision === 'html' ? 'html' : 'cancelar';
        }
        function escapeHTML(valor){
            return String(valor ?? '').replace(/[&<>"']/g, ch => ({
                '&':'&amp;',
                '<':'&lt;',
                '>':'&gt;',
                '"':'&quot;',
                "'":'&#39;'
            }[ch]));
        }
        function descargarHTMLExcel(nombreArchivo, hojas){
            const hojasValidas = hojas.length ? hojas : [{ nombre:'Sin datos', matriz:[['Sin datos para exportar']] }];
            const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
                <style>
                    body{font-family:Arial,sans-serif;color:#222;}
                    h2{font-size:16px;margin:22px 0 8px;padding:7px 10px;background:#eef5f9;border:1pt solid #6f8794;color:#1f3540;}
                    table.horario{border-collapse:collapse;table-layout:fixed;width:1510px;margin-bottom:8px;}
                    table.horario col.col-horario{width:130px;mso-width-source:userset;}
                    table.horario col.col-dia{width:230px;mso-width-source:userset;}
                    table.horario th{background:#d9eaf7;font-weight:700;text-align:center;border:1pt solid #6f8794;padding:7px 6px;height:28px;mso-border-alt:solid #6f8794 .75pt;mso-width-source:userset;}
                    table.horario td{border:1pt solid #7f8c8d;padding:6px;vertical-align:middle;height:38px;mso-number-format:"\\@";white-space:normal;word-wrap:break-word;mso-border-alt:solid #7f8c8d .75pt;mso-width-source:userset;}
                    table.horario td:first-child{background:#f2f6f8;font-weight:700;text-align:center;}
                    table.horario tr:nth-child(even) td:not(:first-child){background:#fbfdff;}
                    table.separador{border-collapse:collapse;width:1510px;margin:0 0 22px;}
                    table.separador td{height:22px;border:none;background:#ffffff;color:#ffffff;}
                </style>
            </head><body>${
                hojasValidas.map(hoja=>`
                    <h2>${escapeHTML(hoja.nombre)}</h2>
                    <table class="horario">
                        <colgroup>
                            <col class="col-horario" width="130" style="width:130px;mso-width-source:userset;">
                            ${Array(Math.max(0, ((hoja.matriz || [])[0] || []).length - 1)).fill('<col class="col-dia" width="230" style="width:230px;mso-width-source:userset;">').join('')}
                        </colgroup>
                        ${(hoja.matriz || [['Sin datos para exportar']]).map((fila,i)=>`<tr>${fila.map((celda,ci)=>{
                            const ancho=ci===0?130:230;
                            const estilo=`width:${ancho}px;mso-width-source:userset;`;
                            return i===0?`<th width="${ancho}" style="${estilo}">${escapeHTML(celda)}</th>`:`<td width="${ancho}" style="${estilo}">${escapeHTML(celda)}</td>`;
                        }).join('')}</tr>`).join('')}
                    </table>
                    <table class="separador"><tr><td>&nbsp;</td></tr><tr><td>&nbsp;</td></tr></table>
                `).join('')
            }</body></html>`;
            const a=document.createElement('a');
            a.href=URL.createObjectURL(new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'}));
            a.download=nombreArchivo.replace(/\.xlsx$/i,'.xls');
            a.click();
        }
        function nombreHoja(nombre, respaldo){
            return String(nombre || respaldo || 'Hoja')
                .replace(/[\\/?*:[\]]/g,'-')
                .substring(0,31) || 'Hoja';
        }
        function agregarHoja(wb, hoja, nombre){
            const usados = new Set((wb.SheetNames || []).map(n=>n.toLowerCase()));
            let base = nombreHoja(nombre, 'Hoja');
            let final = base;
            let i = 2;
            while (usados.has(final.toLowerCase())) {
                const sufijo = ` ${i++}`;
                final = base.substring(0, 31 - sufijo.length) + sufijo;
            }
            window.XLSX.utils.book_append_sheet(wb, hoja, final);
        }
        function escribirLibro(wb, nombreArchivo){
            window.XLSX.writeFile(wb, nombreArchivo, {bookSST:true, cellStyles:true});
        }
        function asegurarLibroConDatos(wb){
            if (!wb.SheetNames || !wb.SheetNames.length) {
                agregarHoja(wb, window.XLSX.utils.aoa_to_sheet([['Sin datos para exportar']]), 'Sin datos');
            }
        }
        function docenteEtiqueta(doc){
            if(!doc) return '';
            const inicial = (doc.nombre || '').trim().charAt(0);
            const apellido = (doc.apellido || '').trim();
            if(inicial && apellido) return `${inicial}. ${apellido}`;
            return [doc.nombre, doc.apellido].filter(Boolean).join(' ');
        }
        function formatearHojaHorario(ws){
            if(!ws) return ws;
            ws['!cols'] = [{wch:18,wpx:130}, ...ctx.DIAS.map(()=>({wch:32,wpx:230}))];
            ws['!rows'] = [{hpt:24}, ...ctx.BLOQUES.map(()=>({hpt:38}))];
            ws['!views'] = [{showGridLines:true}];
            const rango = window.XLSX?.utils?.decode_range?.(ws['!ref'] || 'A1:A1');
            if(rango){
                for(let r=rango.s.r; r<=rango.e.r; r++){
                    for(let c=rango.s.c; c<=rango.e.c; c++){
                        const addr=window.XLSX.utils.encode_cell({r,c});
                        if(!ws[addr]) continue;
                        ws[addr].s = {
                            alignment:{vertical:'center', horizontal:c===0?'center':'left', wrapText:true},
                            font:{bold:r===0 || c===0, name:'Arial', sz:r===0?11:10},
                            fill:(r===0 || c===0)?{patternType:'solid',fgColor:{rgb:r===0?'D9EAF7':'F2F6F8'}}:undefined,
                            border:{
                                top:{style:'thin',color:{rgb:'7F8C8D'}},
                                bottom:{style:'thin',color:{rgb:'7F8C8D'}},
                                left:{style:'thin',color:{rgb:'7F8C8D'}},
                                right:{style:'thin',color:{rgb:'7F8C8D'}}
                            }
                        };
                    }
                }
            }
            return ws;
        }
        function crearHojaHorario(planes){
            return formatearHojaHorario(window.XLSX.utils.aoa_to_sheet(generarMatriz(planes)));
        }
        function generarMatriz(planes){
            const data = ctx.getData();
            const mat=[['Horario',...ctx.DIAS]];
            ctx.BLOQUES.forEach(b=>{
                const fila=[`B${b.n} ${b.inicio}-${b.fin}`];
                ctx.DIAS.forEach((d,di)=>{
                    const p=planes.find(p=>p.dia===di&&p.bloque===b.n);
                    const asig=data.asignaturas.find(a=>a.id===p?.asignaturaId);
                    const sala=data.salas.find(s=>s.id===p?.salaId);
                    const doc=data.docentes.find(d=>d.id===p?.docenteId);
                    fila.push(p?[asig?.codigo||'', sala?.nombre||'', docenteEtiqueta(doc)].filter(Boolean).join(' | '):'');
                });
                mat.push(fila);
            });
            return mat;
        }
        async function exportarCursos(){
            const modo=await resolverModoExportacion();
            if(modo==='cancelar') return;
            const XLSX = getXLSX();
            const data = ctx.getData();
            if (modo==='html') {
                descargarHTMLExcel('Cursos_'+ctx.getTemporadaLabel()+'.xls', data.secciones.map((sec,i)=>({
                    nombre: sec.nombre || `Curso ${i+1}`,
                    matriz: generarMatriz(planesVisiblesCurso(sec.id))
                })));
                ctx.toast('Cursos exportados','success');
                return;
            }
            const wb=XLSX.utils.book_new();
            data.secciones.forEach((sec,i)=>agregarHoja(wb,crearHojaHorario(planesVisiblesCurso(sec.id)),sec.nombre || `Curso ${i+1}`));
            asegurarLibroConDatos(wb);
            escribirLibro(wb,'Cursos_'+ctx.getTemporadaLabel()+'.xlsx'); ctx.toast('Cursos exportados','success');
        }
        async function exportarDocentes(){
            const modo=await resolverModoExportacion();
            if(modo==='cancelar') return;
            const XLSX = getXLSX();
            const data = ctx.getData();
            const tl=ctx.getTemporadaLabel();
            if (modo==='html') {
                descargarHTMLExcel('Docentes_'+tl+'.xls', data.docentes.filter(d=>ctx.getPlanificaciones().some(p=>p.docenteId===d.id)).map((d,i)=>({
                    nombre: d.id===ctx.DOCENTE_NN_ID ? 'Pendiente_Docente_NN' : `${d.apellido || ''}_${d.nombre || i+1}`,
                    matriz: generarMatriz(ctx.getPlanificaciones().filter(p=>p.docenteId===d.id))
                })));
                ctx.toast('Docentes exportados','success');
                return;
            }
            const wb=XLSX.utils.book_new();
            data.docentes.filter(d=>ctx.getPlanificaciones().some(p=>p.docenteId===d.id)).forEach((d,i)=>agregarHoja(wb,crearHojaHorario(ctx.getPlanificaciones().filter(p=>p.docenteId===d.id)),d.id===ctx.DOCENTE_NN_ID?'Pendiente_Docente_NN':(`${d.apellido}_${d.nombre}` || `Docente ${i+1}`)));
            asegurarLibroConDatos(wb);
            escribirLibro(wb,'Docentes_'+tl+'.xlsx'); ctx.toast('Docentes exportados','success');
        }
        async function exportarSalas(){
            const modo=await resolverModoExportacion();
            if(modo==='cancelar') return;
            const XLSX = getXLSX();
            const data = ctx.getData();
            const tl=ctx.getTemporadaLabel();
            if (modo==='html') {
                descargarHTMLExcel('Salas_'+tl+'.xls', data.salas.map((sala,i)=>({
                    nombre: sala.nombre || `Sala ${i+1}`,
                    matriz: generarMatriz(ctx.getPlanificaciones().filter(p=>p.salaId===sala.id))
                })));
                ctx.toast('Salas exportadas','success');
                return;
            }
            const wb=XLSX.utils.book_new();
            data.salas.forEach((sala,i)=>agregarHoja(wb,crearHojaHorario(ctx.getPlanificaciones().filter(p=>p.salaId===sala.id)),sala.nombre || `Sala ${i+1}`));
            asegurarLibroConDatos(wb);
            escribirLibro(wb,'Salas_'+tl+'.xlsx'); ctx.toast('Salas exportadas','success');
        }
        async function descargarExcelCompleto(){
            const modo=await resolverModoExportacion();
            if(modo==='cancelar') return;
            const XLSX = getXLSX();
            const data = ctx.getData();
            if (modo==='html') {
                const hojas = [
                    ...data.secciones.map((sec,i)=>({nombre:`Curso ${sec.nombre || i+1}`, matriz:generarMatriz(planesVisiblesCurso(sec.id))})),
                    ...data.docentes.filter(d=>ctx.getPlanificaciones().some(p=>p.docenteId===d.id)).map((d,i)=>({nombre:d.id===ctx.DOCENTE_NN_ID?'Pendiente Docente NN':`Docente ${d.apellido || ''}_${d.nombre || i+1}`, matriz:generarMatriz(ctx.getPlanificaciones().filter(p=>p.docenteId===d.id))})),
                    ...data.salas.map((sala,i)=>({nombre:`Sala ${sala.nombre || i+1}`, matriz:generarMatriz(ctx.getPlanificaciones().filter(p=>p.salaId===sala.id))}))
                ];
                descargarHTMLExcel('Planificador_Completo_'+ctx.getTemporadaLabel()+'.xls', hojas);
                ctx.toast('Planificador exportado','success');
                return;
            }
            const wb=XLSX.utils.book_new();
            data.secciones.forEach((sec,i)=>agregarHoja(wb,crearHojaHorario(planesVisiblesCurso(sec.id)),`Curso ${sec.nombre || i+1}`));
            data.docentes
                .filter(d=>ctx.getPlanificaciones().some(p=>p.docenteId===d.id))
                .forEach((d,i)=>agregarHoja(wb,crearHojaHorario(ctx.getPlanificaciones().filter(p=>p.docenteId===d.id)),d.id===ctx.DOCENTE_NN_ID?'Pendiente Docente NN':`Docente ${d.apellido || ''}_${d.nombre || i+1}`));
            data.salas.forEach((sala,i)=>agregarHoja(wb,crearHojaHorario(ctx.getPlanificaciones().filter(p=>p.salaId===sala.id)),`Sala ${sala.nombre || i+1}`));
            asegurarLibroConDatos(wb);
            escribirLibro(wb,'Planificador_Completo_'+ctx.getTemporadaLabel()+'.xlsx');
            ctx.toast('Planificador exportado','success');
        }
        function exportarDatos(){
            const a=document.createElement('a');
            a.href=URL.createObjectURL(new Blob([JSON.stringify(ctx.getData())],{type:'application/json'}));
            a.download='Backup_'+ctx.getTemporadaLabel()+'.json';
            a.click();
            ctx.toast('Datos exportados','success');
        }

        return {
            generarMatriz,
            formatearHojaHorario,
            exportarCursos,
            exportarDocentes,
            exportarSalas,
            descargarExcelCompleto,
            exportarDatos
        };
    }

    window.PlanificadorExportaciones = { create: createExportaciones };
})();
