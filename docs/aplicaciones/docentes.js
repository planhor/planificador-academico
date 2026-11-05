// Aplicación docentes. Estado y servicios compartidos inyectados, sin copias de datos.
(function(){
    window.PlanhorAplicaciones=window.PlanhorAplicaciones||{};
    window.PlanhorAplicaciones["docentes"]={create(shared){
function abrirModalDocente(id=null){
            const data = shared.getData();
            if(id===shared.ctx.DOCENTE_NN_ID) return shared.ctx.toast('Docente NN es una entidad fija del sistema','info');
            const d=id?data.docentes.find(d=>d.id===id):null;
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal" style="max-width:800px;">
                <h3>${d?'Editar':'Nuevo'} Docente</h3>
                <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="nomDoc" value="${shared.ctx.escapeAttr(d?.nombre||'')}"></div>
                <div class="form-group"><label class="form-label">Apellido</label><input class="form-input" id="apeDoc" value="${shared.ctx.escapeAttr(d?.apellido||'')}"></div>
                <div class="form-group"><label class="form-label">Tipo de contrato</label><select class="form-select" id="tipoContrato"><option value="indefinido" ${d?.tipoContrato==='indefinido'?'selected':''}>Indefinido</option><option value="fijo" ${d?.tipoContrato==='fijo'?'selected':''}>Fijo</option></select></div>
                <div class="form-group"><label class="form-label">Especialidad</label><select class="form-select" id="especialidadDocente"><option value="">-- Sin especialidad --</option>${(data.configuracion.especialidades||[]).map(e=>shared.ctx.optionHTML(e,e,d?.especialidad===e)).join('')}</select></div>
                <div class="form-group"><label class="form-label">Horas homólogo anterior</label><input class="form-input" type="number" id="horasHomologo" value="${d?.horasHomologo||''}" step="18"></div>
                <div class="form-group"><label class="form-label">Asignaturas que dicta</label>
                    <div id="asigsDocente" style="margin-bottom:8px;"></div>
                    <div class="search-box input-with-clear"><input class="form-input" id="buscarAsig" placeholder="🔍 Buscar asignatura..." autocomplete="off"><button class="clear-btn" id="clearBuscarAsig">✕</button><ul class="search-results" id="resultadosAsig"></ul></div>
                    ${d?.asignaturasNoReconocidas?.length?`<p class="import-warning-note">Códigos no reconocidos en la última importación: ${shared.ctx.escapeHTML(d.asignaturasNoReconocidas.join(', '))}</p>`:''}
                </div>
                <div class="form-group"><label class="form-label">Disponibilidad</label>
                    <div class="mini-grid" id="miniGrid"></div>
                    <div style="margin-top:8px;"><button class="btn btn-xs" id="btnSelTodo">Seleccionar todo</button> <button class="btn btn-xs" id="btnLimpiar">Limpiar</button></div>
                </div>
                <div class="form-group"><label><input type="checkbox" id="autorizadoExceder" ${d?.autorizadoExceder?'checked':''}> Autorizado para exceder 850 horas</label></div>
                <button class="btn btn-primary" id="btnGuardarDocente">Guardar</button>
            </div></div>`;
            shared.docenteTemp={id:d?.id||null, nombre:d?.nombre||'', apellido:d?.apellido||'', tipoContrato:d?.tipoContrato||'indefinido', horasHomologo:d?.horasHomologo||0, asignaturas:d?.asignaturasQueDicta?[...d.asignaturasQueDicta]:[], prioridadAsignaturas:Object.assign({}, d?.prioridadAsignaturas||{}), disponibilidad:d?.disponibilidad?d.disponibilidad.map(f=>[...f]):shared.ctx.DIAS.map(()=>Array(18).fill(false)), autorizadoExceder:d?.autorizadoExceder||false};
            shared.renderMiniGrid();
            shared.actualizarChipsAsignaturas();
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)shared.ctx.cerrarModal();});
            document.getElementById('buscarAsig').addEventListener('input',shared.filtrarAsignaturasDocente);
            document.getElementById('buscarAsig').addEventListener('focus',()=>{if(!document.getElementById('buscarAsig').value)shared.mostrarOpcionesAsignaturasDocente();});
            document.getElementById('clearBuscarAsig').addEventListener('click',shared.limpiarBusquedaDocente);
            document.getElementById('btnSelTodo').addEventListener('click',shared.seleccionarTodoDisponibilidad);
            document.getElementById('btnLimpiar').addEventListener('click',shared.limpiarDisponibilidad);
            document.getElementById('btnGuardarDocente').addEventListener('click',()=>shared.guardarDocente(id));
        }

function actualizarChipsAsignaturas(){
            const data = shared.getData();
            const container=document.getElementById('asigsDocente'); if(!container) return;
            container.innerHTML=shared.docenteTemp.asignaturas.map(aid=>{
                const a=data.asignaturas.find(x=>x.id===aid);
                const prioridad=shared.docenteTemp.prioridadAsignaturas?.[aid]||'apto';
                return a?`<span class="item-chip docente-asignatura-chip">
                    <span>${shared.ctx.escapeHTML(a.codigo)}</span>
                    <select class="form-select prioridad-docente-asig" data-id="${shared.ctx.escapeAttr(aid)}" title="Nivel para auto-planificación">
                        <option value="preferente" ${prioridad==='preferente'?'selected':''}>Preferente</option>
                        <option value="apto" ${prioridad==='apto'?'selected':''}>Apto</option>
                        <option value="apoyo" ${prioridad==='apoyo'?'selected':''}>Apoyo</option>
                    </select>
                    <button class="btn btn-xs btn-eliminar-chip-docente" data-id="${shared.ctx.escapeAttr(aid)}">x</button>
                </span>`:'';
            }).join('');
            container.querySelectorAll('.prioridad-docente-asig').forEach(sel=>sel.addEventListener('change',function(){
                shared.docenteTemp.prioridadAsignaturas=shared.docenteTemp.prioridadAsignaturas||{};
                shared.docenteTemp.prioridadAsignaturas[this.dataset.id]=this.value;
            }));
            container.querySelectorAll('.btn-eliminar-chip-docente').forEach(btn=>btn.addEventListener('click',function(){
                shared.docenteTemp.asignaturas=shared.docenteTemp.asignaturas.filter(id=>id!==this.dataset.id);
                if(shared.docenteTemp.prioridadAsignaturas) delete shared.docenteTemp.prioridadAsignaturas[this.dataset.id];
                shared.actualizarChipsAsignaturas();
            }));
        }

function mostrarOpcionesAsignaturasDocente(){
            const data = shared.getData();
            const resultados=document.getElementById('resultadosAsig'); resultados.innerHTML='';
            data.asignaturas.slice(0,10).forEach(a=>{
                const li=document.createElement('li'); li.textContent=`${a.codigo} - ${a.nombre}`;
                li.addEventListener('click',()=>{
                    if(!shared.docenteTemp.asignaturas.includes(a.id)){shared.docenteTemp.asignaturas.push(a.id); shared.docenteTemp.prioridadAsignaturas[a.id]='apto'; shared.actualizarChipsAsignaturas();}
                    document.getElementById('buscarAsig').value=''; resultados.classList.remove('show'); document.getElementById('clearBuscarAsig').classList.remove('visible');
                });
                resultados.appendChild(li);
            });
            resultados.classList.add('show');
        }

function filtrarAsignaturasDocente(){
            const data = shared.getData();
            const input=document.getElementById('buscarAsig'), filter=input.value.toLowerCase(), resultados=document.getElementById('resultadosAsig');
            resultados.innerHTML=''; document.getElementById('clearBuscarAsig').classList.toggle('visible',input.value.length>0);
            if(!filter){shared.mostrarOpcionesAsignaturasDocente();return;}
            const filtradas=data.asignaturas.filter(a=>a.codigo.toLowerCase().includes(filter)||a.nombre.toLowerCase().includes(filter));
            if(filtradas.length===0){resultados.classList.remove('show');return;}
            filtradas.slice(0,10).forEach(a=>{
                const li=document.createElement('li'); li.textContent=`${a.codigo} - ${a.nombre}`;
                li.addEventListener('click',()=>{
                    if(!shared.docenteTemp.asignaturas.includes(a.id)){shared.docenteTemp.asignaturas.push(a.id); shared.docenteTemp.prioridadAsignaturas[a.id]='apto'; shared.actualizarChipsAsignaturas();}
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
            shared.ctx.DIAS.forEach(d=>{const h=document.createElement('div'); h.className='mini-cell'; h.textContent=d; grid.appendChild(h);});
            shared.ctx.BLOQUES.forEach((b,bi)=>{
                const time=document.createElement('div'); time.className='mini-cell'; time.textContent=`B${b.n}`; grid.appendChild(time);
                shared.ctx.DIAS.forEach((d,di)=>{
                    const cell=document.createElement('div'); cell.className='mini-cell'; cell.dataset.dia=di; cell.dataset.bloque=bi;
                    if(shared.docenteTemp.disponibilidad[di][bi]) cell.classList.add('disponible');
                    grid.appendChild(cell);
                });
            });
            let isDown=false, startEstado=false;
            grid.addEventListener('mousedown',(e)=>{
                const cell=e.target.closest('.mini-cell'); if(!cell||cell.cellIndex===0) return; e.preventDefault();
                isDown=true; const dia=parseInt(cell.dataset.dia),bloque=parseInt(cell.dataset.bloque);
                startEstado=!shared.docenteTemp.disponibilidad[dia][bloque];
                shared.docenteTemp.disponibilidad[dia][bloque]=startEstado; cell.classList.toggle('disponible',startEstado);
            });
            grid.addEventListener('mousemove',(e)=>{
                if(!isDown) return;
                const cell=e.target.closest('.mini-cell'); if(!cell||cell.cellIndex===0) return;
                const dia=parseInt(cell.dataset.dia),bloque=parseInt(cell.dataset.bloque);
                shared.docenteTemp.disponibilidad[dia][bloque]=startEstado; cell.classList.toggle('disponible',startEstado);
            });
            grid.addEventListener('mouseup',()=>{isDown=false;});
            grid.addEventListener('mouseleave',()=>{isDown=false;});
            grid.addEventListener('click',(e)=>{
                if(e.shiftKey && shared.lastMiniCell){
                    const cell=e.target.closest('.mini-cell'); if(!cell||cell.cellIndex===0) return;
                    const col1=parseInt(cell.dataset.dia),row1=parseInt(cell.dataset.bloque);
                    const col2=shared.lastMiniCell.col,row2=shared.lastMiniCell.row;
                    const minCol=Math.min(col1,col2),maxCol=Math.max(col1,col2),minRow=Math.min(row1,row2),maxRow=Math.max(row1,row2);
                    const estado=!shared.docenteTemp.disponibilidad[col1][row1];
                    for(let c=minCol;c<=maxCol;c++) for(let r=minRow;r<=maxRow;r++) shared.docenteTemp.disponibilidad[c][r]=estado;
                    shared.renderMiniGrid();
                }
                const cell=e.target.closest('.mini-cell');
                if(cell&&cell.cellIndex>0) shared.lastMiniCell={col:parseInt(cell.dataset.dia),row:parseInt(cell.dataset.bloque)};
            });
        }

function seleccionarTodoDisponibilidad(){shared.docenteTemp.disponibilidad=shared.ctx.DIAS.map(()=>Array(18).fill(true)); shared.renderMiniGrid();}

function limpiarDisponibilidad(){shared.docenteTemp.disponibilidad=shared.ctx.DIAS.map(()=>Array(18).fill(false)); shared.renderMiniGrid();}

function normalizarTextoImportacion(valor){
            return String(valor??'').trim();
        }

function capitalizarPalabras(valor){
            const minusculas=new Set(['de','del','la','las','los','y','e']);
            return shared.normalizarTextoImportacion(valor)
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
            const texto=shared.capitalizarPalabras(valor);
            if(!texto) return '';
            const data=shared.getData();
            const existente=(data.configuracion.especialidades||[]).find(e=>String(e||'').toLowerCase()===texto.toLowerCase());
            return existente||texto;
        }

function normalizarTipoContratoImportacion(valor){
            const texto=shared.normalizarTextoImportacion(valor).toLowerCase();
            if(!texto) return 'indefinido';
            if(['indefinido','indefinida','planta'].includes(texto)) return 'indefinido';
            if(['fijo','fija','plazo fijo','contrato fijo'].includes(texto)) return 'fijo';
            return texto;
        }

function claveDocente(nombre,apellido){
            return `${shared.normalizarTextoImportacion(nombre).toLowerCase()}|${shared.normalizarTextoImportacion(apellido).toLowerCase()}`;
        }

function codigosAsignaturasTexto(valor){
            return shared.normalizarTextoImportacion(valor)
                .split(/[,;|\n\r]+/)
                .map(x=>x.trim().toUpperCase())
                .filter(Boolean);
        }

async function crearPlantillaImportacionDocentes(){
            const data=shared.getData();
            const headers=['Nombre','Apellido','Especialidad','Tipo contrato','Horas homólogo','Asignaturas que dicta'];
            const filas=[
                headers,
                ['Docente','Referencia','Electricidad','indefinido',720,'EEA401, EEA402, ELAR31']
            ];
            if((window.XLSX?.utils?.book_new&&window.XLSX?.writeFile) || (shared.ctx.asegurarXLSX && await shared.ctx.asegurarXLSX() && window.XLSX?.utils?.book_new&&window.XLSX?.writeFile)){
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
                shared.ctx.toast('Plantilla de docentes descargada','success');
                return;
            }
            const tabla=`<table>${filas.map(f=>`<tr>${f.map(c=>`<td>${shared.ctx.escapeHTML(c)}</td>`).join('')}</tr>`).join('')}</table>`;
            const blob=new Blob([`<html><head><meta charset="UTF-8"></head><body>${tabla}</body></html>`],{type:'application/vnd.ms-excel;charset=utf-8;'});
            const a=document.createElement('a');
            a.href=URL.createObjectURL(blob);
            a.download='Plantilla_Importacion_Docentes.xls';
            a.click();
            URL.revokeObjectURL(a.href);
            shared.ctx.toast('Plantilla de docentes descargada','success');
        }

function exportarArchivoDocentes(){
            const data=shared.getData();
            const filas=[['Nombre','Apellido','Especialidad','Tipo contrato','Horas homólogo','Asignaturas que dicta']];
            data.docentes.filter(d=>d.id!==shared.ctx.DOCENTE_NN_ID).forEach(d=>{
                const codigos=(d.asignaturasQueDicta||[]).map(id=>data.asignaturas.find(a=>a.id===id)?.codigo).filter(Boolean).join(', ');
                filas.push([d.nombre,d.apellido,d.especialidad||'',d.tipoContrato||'indefinido',d.horasHomologo||0,codigos]);
            });
            shared.exportarWorkbookCatalogo('Docentes_exportados.xlsx',[
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
                if(!shared.ctx.asegurarXLSX || !(await shared.ctx.asegurarXLSX()) || !window.XLSX?.read || !window.XLSX?.utils?.sheet_to_json) return;
            }
            const reader=new FileReader();
            reader.onload=(ev)=>{
                try{
                    const wb=window.XLSX.read(ev.target.result,{type:'array'});
                    const sheet=wb.SheetNames[0];
                    const rows=window.XLSX.utils.sheet_to_json(wb.Sheets[sheet],{header:1,defval:''});
                    shared.importarDocentesDesdeFilas(rows);
                }catch(err){
                    console.error(err);
                    shared.ctx.toast('No se pudo leer el archivo de docentes','error');
                }
            };
            reader.readAsArrayBuffer(file);
        }

function importarDocentesDesdeFilas(rows){
            const data=shared.getData();
            if(!Array.isArray(rows)||rows.length<2) return shared.ctx.toast('El archivo no contiene docentes para importar','error');
            const header=(rows[0]||[]).map(h=>shared.normalizarTextoImportacion(h).toLowerCase());
            const mapa={};
            header.forEach((h,i)=>{
                if(['nombre','nombres'].includes(h)) mapa.nombre=i;
                if(['apellido','apellidos'].includes(h)) mapa.apellido=i;
                if(h==='especialidad') mapa.especialidad=i;
                if(['tipo contrato','tipo de contrato','contrato'].includes(h)) mapa.tipoContrato=i;
                if(['horas homólogo','horas homologó','horas homologo','horas'].includes(h)) mapa.horasHomologo=i;
                if(['asignaturas que dicta','asignaturas','codigos asignaturas','códigos asignaturas'].includes(h)) mapa.asignaturas=i;
            });
            if(mapa.nombre===undefined||mapa.apellido===undefined) return shared.ctx.toast('La plantilla debe incluir Nombre y Apellido','error');
            const asignaturaPorCodigo=new Map(data.asignaturas.map(a=>[String(a.codigo||'').toUpperCase(),a]));
            const docentesPorClave=new Map(data.docentes.filter(d=>d.id!==shared.ctx.DOCENTE_NN_ID).map(d=>[shared.claveDocente(d.nombre,d.apellido),d]));
            const resumen={creados:0,actualizados:0,asociaciones:0,omitidos:0,alertas:[]};
            shared.ctx.pushUndo?.();
            rows.slice(1).forEach((row,idx)=>{
                const nombre=shared.capitalizarPalabras(shared.valorFilaDocente(row,mapa,['nombre']));
                const apellido=shared.capitalizarPalabras(shared.valorFilaDocente(row,mapa,['apellido']));
                if(!nombre&&!apellido) return;
                if(!nombre||!apellido){
                    resumen.omitidos++;
                    resumen.alertas.push({fila:idx+2,nombre:nombre||'(sin nombre)',apellido:apellido||'(sin apellido)',codigos:['Fila incompleta'],docenteId:null});
                    return;
                }
                const especialidad=shared.normalizarEspecialidadImportacion(shared.valorFilaDocente(row,mapa,['especialidad']));
                const tipoContrato=shared.normalizarTipoContratoImportacion(shared.valorFilaDocente(row,mapa,['tipoContrato']));
                const horasHomologo=parseInt(shared.valorFilaDocente(row,mapa,['horasHomologo']))||0;
                const codigos=shared.codigosAsignaturasTexto(shared.valorFilaDocente(row,mapa,['asignaturas']));
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
                const key=shared.claveDocente(nombre,apellido);
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
                        id:shared.ctx.genId(),
                        nombre,
                        apellido,
                        tipoContrato,
                        especialidad,
                        horasHomologo,
                        asignaturasQueDicta:asignaturasUnicas,
                        prioridadAsignaturas,
                        disponibilidad:shared.ctx.DIAS.map(()=>Array(18).fill(false)),
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
            shared.ctx.guardar();
            shared.ctx.refrescarTodo();
            shared.mostrarResultadoImportacionDocentes(resumen);
        }

function mostrarResultadoImportacionDocentes(resumen){
            const filas=resumen.alertas.map(a=>`
                <tr>
                    <td>${shared.ctx.escapeHTML(a.fila)}</td>
                    <td>${shared.ctx.escapeHTML(`${a.nombre} ${a.apellido}`)}</td>
                    <td>${shared.ctx.escapeHTML(a.codigos.join(', '))}</td>
                    <td>${a.docenteId?`<button class="btn btn-xs btn-revisar-docente-importado" data-id="${shared.ctx.escapeAttr(a.docenteId)}">Revisar</button>`:''}</td>
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
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)shared.ctx.cerrarModal();});
            document.getElementById('cerrarImportacionDocentes').addEventListener('click',shared.ctx.cerrarModal);
            document.querySelectorAll('.btn-revisar-docente-importado').forEach(btn=>btn.addEventListener('click',()=>shared.abrirModalDocente(btn.dataset.id)));
            shared.ctx.toast(resumen.alertas.length?'Docentes importados con alertas':'Docentes importados correctamente',resumen.alertas.length?'warning':'success');
        }

function guardarDocente(id){
            const data = shared.getData();
            if(id===shared.ctx.DOCENTE_NN_ID) return shared.ctx.toast('Docente NN no se edita manualmente','info');
            const nom=document.getElementById('nomDoc').value.trim(), ape=document.getElementById('apeDoc').value.trim();
            if(!nom) return shared.ctx.toast('El nombre del docente es obligatorio','error');
            if(!ape) return shared.ctx.toast('El apellido del docente es obligatorio','error');
            const tipoContrato=document.getElementById('tipoContrato').value;
            const especialidad=document.getElementById('especialidadDocente').value;
            const horasHomologo=parseInt(document.getElementById('horasHomologo').value)||0;
            if(horasHomologo<0) return shared.ctx.toast('Las horas homólogo no pueden ser negativas','error');
            if(horasHomologo%18!==0) return shared.ctx.toast(`Las horas homólogo (${horasHomologo}) deben ser múltiplo de 18`,'error');
            const autorizadoExceder=document.getElementById('autorizadoExceder').checked;
            const prioridadAsignaturas={};
            shared.docenteTemp.asignaturas.forEach(aid=>prioridadAsignaturas[aid]=shared.docenteTemp.prioridadAsignaturas?.[aid]||'apto');
            const docente={id:id||shared.ctx.genId(),nombre:nom,apellido:ape,tipoContrato,especialidad,horasHomologo,asignaturasQueDicta:[...shared.docenteTemp.asignaturas],prioridadAsignaturas,disponibilidad:shared.docenteTemp.disponibilidad.map(f=>[...f]),autorizadoExceder,asignaturasNoReconocidas:[],alertasImportacion:[]};
            if(id){const idx=data.docentes.findIndex(d=>d.id===id); if(idx>=0) data.docentes[idx]=docente;} else data.docentes.push(docente);
            shared.ctx.guardar(); shared.ctx.cerrarModal(); shared.ctx.refrescarTodo(); shared.ctx.toast('Docente guardado','success');
        }

function renderPanelAlertasDocentes(){
            const data=shared.getData();
            const items=data.docentes.filter(d=>d.id!==shared.ctx.DOCENTE_NN_ID&&((Array.isArray(d.alertasImportacion)&&d.alertasImportacion.length)||(Array.isArray(d.asignaturasNoReconocidas)&&d.asignaturasNoReconocidas.length)));
            if(!items.length) return '';
            return `<div class="import-alert-panel">
                <div class="import-alert-header"><div><strong>Alertas de importación</strong><span>${items.length} docente(s) requieren revisión</span></div></div>
                <div class="import-alert-list">
                    ${items.map(d=>{
                        const detalle=(d.alertasImportacion?.length?d.alertasImportacion:d.asignaturasNoReconocidas.map(c=>`Asignatura no encontrada: ${c}`)).join(' · ');
                        return `<div class="import-alert-item">
                            <div>
                                <strong>${shared.ctx.escapeHTML(`${d.nombre} ${d.apellido}`)}</strong>
                                <span>${shared.ctx.escapeHTML(detalle)}</span>
                            </div>
                            <button class="btn btn-xs btn-editar-docente" data-id="${shared.ctx.escapeAttr(d.id)}">Revisar</button>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }

function renderDocentes(){
            const data = shared.getData();
            const contadorDocente = shared.ctx.getContadorDocente();
            const filtro=document.getElementById('docentesFiltroEspecialidad')?.value||'';
            const filtroEl=document.getElementById('docentesFiltroEspecialidad');
            if(filtroEl){
                const actual=filtroEl.value;
                const especialidades=[...new Set(data.docentes.filter(d=>d.id!==shared.ctx.DOCENTE_NN_ID).map(d=>d.especialidad||'Sin especialidad'))].sort((a,b)=>a.localeCompare(b));
                filtroEl.innerHTML='<option value="">Todas las especialidades</option>'+especialidades.map(e=>shared.ctx.optionHTML(e,e,actual===e)).join('');
                if(actual && especialidades.includes(actual)) filtroEl.value=actual;
            }
            const docentes=data.docentes
                .filter(d=>!filtro || (d.especialidad||'Sin especialidad')===filtro)
                .sort((a,b)=>String(a.especialidad||'Sin especialidad').localeCompare(String(b.especialidad||'Sin especialidad'))||String(a.apellido||'').localeCompare(String(b.apellido||'')));
            const chipDocente=(d)=>{
                const usados=contadorDocente[d.id]||0;
                if(d.id===shared.ctx.DOCENTE_NN_ID) return `<span class="item-chip docente-nn-chip">${shared.ctx.escapeHTML(d.nombre)} ${shared.ctx.escapeHTML(d.apellido)} <small>[Pendiente]</small> (${usados} bloque(s))</span>`;
                const espColor=d.especialidad?shared.ctx.getEspColor()[d.especialidad]||'':'';
                const alerta=d.asignaturasNoReconocidas?.length?` <small class="import-warning-chip">${d.asignaturasNoReconocidas.length} código(s) por revisar</small>`:'';
                return `<span class="item-chip" ${espColor?`style="background:${shared.ctx.colorSeguro(espColor,'#fff')}"`:''}>${shared.ctx.escapeHTML(d.nombre)} ${shared.ctx.escapeHTML(d.apellido)}${d.especialidad?` <small style="font-size:0.65rem;color:var(--text-secondary)">[${shared.ctx.escapeHTML(d.especialidad)}]</small>`:''}${alerta} (${usados}/${data.configuracion.bloquesSemestralesMax} · ${usados*18}h) <button class="btn btn-xs btn-editar-docente" data-id="${shared.ctx.escapeAttr(d.id)}">✎</button> <button class="btn btn-xs btn-eliminar-docente" data-id="${shared.ctx.escapeAttr(d.id)}">🗑️</button></span>`;
            };
            const grupos=new Map();
            docentes.forEach(d=>{
                const key=d.id===shared.ctx.DOCENTE_NN_ID?'Pendientes':(d.especialidad||'Sin especialidad');
                if(!grupos.has(key)) grupos.set(key,[]);
                grupos.get(key).push(d);
            });
            const contenido=grupos.size?Array.from(grupos.entries()).map(([esp,items])=>`
                <div class="docentes-specialty-group">
                    <div class="docentes-specialty-title"><span>${shared.ctx.escapeHTML(esp)}</span><span>${items.length} docente(s)</span></div>
                    <div class="docentes-specialty-list">${items.map(chipDocente).join('')}</div>
                </div>
            `).join(''):'<p class="auto-plan-empty">No hay docentes para esta especialidad.</p>';
            document.getElementById('listaDocentes').innerHTML=shared.renderPanelAlertasDocentes()+contenido;
        }

function eliminarDocente(id){
            const data = shared.getData();
            if(id===shared.ctx.DOCENTE_NN_ID) return shared.ctx.toast('Docente NN no se puede eliminar','info');
            if(confirm('¿Eliminar docente?')){ data.docentes=data.docentes.filter(d=>d.id!==id); shared.ctx.guardar(); shared.ctx.refrescarTodo(); }
        }
        return {abrirModalDocente, actualizarChipsAsignaturas, mostrarOpcionesAsignaturasDocente, filtrarAsignaturasDocente, limpiarBusquedaDocente, renderMiniGrid, seleccionarTodoDisponibilidad, limpiarDisponibilidad, normalizarTextoImportacion, capitalizarPalabras, normalizarEspecialidadImportacion, normalizarTipoContratoImportacion, claveDocente, codigosAsignaturasTexto, crearPlantillaImportacionDocentes, exportarArchivoDocentes, valorFilaDocente, abrirImportacionDocentes, leerArchivoDocentes, importarDocentesDesdeFilas, mostrarResultadoImportacionDocentes, guardarDocente, renderPanelAlertasDocentes, renderDocentes, eliminarDocente};
    }};
})();
