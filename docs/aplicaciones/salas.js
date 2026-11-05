// Aplicación salas. Estado y servicios compartidos inyectados, sin copias de datos.
(function(){
    window.PlanhorAplicaciones=window.PlanhorAplicaciones||{};
    window.PlanhorAplicaciones["salas"]={create(shared){
function abrirModalSala(id=null){
            const data = shared.getData();
            const s=id?data.salas.find(s=>s.id===id):null;
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3>${s?'Editar':'Nueva'} Sala</h3>
                <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="nomSala" value="${shared.ctx.escapeAttr(s?.nombre||'')}"></div>
                <div class="form-group"><label class="form-label">Capacidad</label><input class="form-input" type="number" id="capSala" value="${s?.capacidad||30}" min="1"></div>
                <div class="form-group"><label class="form-label">Tipo de espacio</label><select class="form-select" id="tipoSala">
                    ${['Sala de Clases','Laboratorio de Computación','Laboratorio de Especialidad','Taller de Especialidad'].map(t=>shared.ctx.optionHTML(t,t,(s?.tipoSala||'Sala de Clases')===t)).join('')}
                </select></div>
                ${s?.alertasImportacion?.length?`<p class="import-warning-note">Alertas de importación: ${shared.ctx.escapeHTML(s.alertasImportacion.join(' · '))}</p>`:''}
                <button class="btn btn-primary" id="btnGuardarSala">Guardar</button>
            </div></div>`;
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)shared.ctx.cerrarModal();});
            document.getElementById('btnGuardarSala').addEventListener('click',()=>shared.guardarSala(id));
        }

function guardarSala(id){
            const data = shared.getData();
            const nom=document.getElementById('nomSala').value.trim(), cap=parseInt(document.getElementById('capSala').value);
            const tipoSala=document.getElementById('tipoSala')?.value||'Sala de Clases';
            if(!nom) return shared.ctx.toast('El nombre de la sala es obligatorio','error');
            if(!cap||cap<=0) return shared.ctx.toast('La capacidad debe ser mayor a cero','error');
            const duplicado=data.salas.find(s=>s.nombre.toLowerCase()===nom.toLowerCase()&&s.id!==id&&s.id!==shared.ctx.SALA_VIRTUAL_ID&&s.id!==shared.ctx.SALA_TRO2_ID);
            if(duplicado) return shared.ctx.toast(`Ya existe una sala con el nombre "${nom}"`,'error');
            const sala={...(id?data.salas.find(s=>s.id===id)||{}:{}),id:id||shared.ctx.genId(),nombre:nom,capacidad:cap,tipoSala,alertasImportacion:[]};
            if(id){const idx=data.salas.findIndex(s=>s.id===id); if(idx>=0) data.salas[idx]=sala;} else data.salas.push(sala);
            shared.ctx.guardar(); shared.ctx.cerrarModal(); shared.ctx.refrescarTodo(); shared.ctx.toast('Sala guardada','success');
        }

async function crearPlantillaImportacionSalas(){
            const filas=[
                ['Número','Nombre','Capacidad','Tipo de espacio','Observaciones'],
                ['315','COMPUTACIÓN',30,'Laboratorio de Computación','Equivale a referencias del Gestor como 315-COMPUTACIÓN'],
                ['','LAB ELEC 1',21,'Laboratorio de Especialidad','Sala de especialidad eléctrica'],
                ['','TALLER ELEC',20,'Taller de Especialidad',''],
                ['301','SALA',35,'Sala de Clases','']
            ];
            if((window.XLSX?.utils?.book_new&&window.XLSX?.writeFile) || (shared.ctx.asegurarXLSX && await shared.ctx.asegurarXLSX() && window.XLSX?.utils?.book_new&&window.XLSX?.writeFile)){
                const wb=window.XLSX.utils.book_new();
                const add=(nombre,matriz,cols=[])=>{
                    const ws=window.XLSX.utils.aoa_to_sheet(matriz);
                    if(cols.length) ws['!cols']=cols.map(w=>({wch:w}));
                    window.XLSX.utils.book_append_sheet(wb,ws,nombre);
                };
                add('Salas',filas,[14,30,12,30,48]);
                add('Ayuda',[
                    ['Campo','Qué escribir','Ejemplo','Notas'],
                    ['Número','Número o código corto del espacio','315','Opcional. Si existe junto a Nombre, la app forma 315-COMPUTACIÓN.'],
                    ['Nombre','Nombre del espacio','COMPUTACIÓN','Si ya existe, se actualiza.'],
                    ['Capacidad','Número máximo de estudiantes','21','Debe ser mayor a 0.'],
                    ['Tipo de espacio','Tipo real de espacio','Laboratorio de Computación','Valores sugeridos: Sala de Clases, Laboratorio de Computación, Laboratorio de Especialidad, Taller de Especialidad.'],
                    ['Observaciones','Texto libre','Sala con equipos especiales','Opcional.']
                ],[22,42,30,58]);
                add('Tipos sugeridos',[['Tipo'],['Sala de Clases'],['Laboratorio de Computación'],['Laboratorio de Especialidad'],['Taller de Especialidad']],[32]);
                window.XLSX.writeFile(wb,'Plantilla_Importacion_Salas.xlsx',{bookSST:true});
                shared.ctx.toast('Plantilla de salas descargada','success');
                return;
            }
        }

function exportarArchivoSalas(){
            const data=shared.getData();
            const filas=[['Número','Nombre','Capacidad','Tipo de espacio','Observaciones']];
            data.salas.filter(s=>s.id!==shared.ctx.SALA_VIRTUAL_ID&&s.id!==shared.ctx.SALA_TRO2_ID).forEach(s=>{
                const ref=shared.separarNumeroNombreSala(s.nombre);
                filas.push([ref.numero,ref.nombre||s.nombre,s.capacidad||'',s.tipoSala||'Sala de Clases',s.observaciones||'']);
            });
            shared.exportarWorkbookCatalogo('Salas_exportadas.xlsx',[
                {nombre:'Salas',matriz:filas,cols:[14,30,12,30,48]},
                {nombre:'Ayuda',matriz:[
                    ['Campo','Qué escribir','Ejemplo','Notas'],
                    ['Número','Número o código corto del espacio','315','Opcional. Si existe junto a Nombre, la app forma 315-COMPUTACIÓN.'],
                    ['Nombre','Nombre del espacio','COMPUTACIÓN','Si ya existe, se actualiza.'],
                    ['Capacidad','Número máximo de estudiantes','21','Debe ser mayor a 0.'],
                    ['Tipo de espacio','Tipo real de espacio','Laboratorio de Computación','Valores sugeridos: Sala de Clases, Laboratorio de Computación, Laboratorio de Especialidad, Taller de Especialidad.'],
                    ['Observaciones','Texto libre','Sala con equipos especiales','Opcional.']
                ],cols:[22,42,30,58]},
                {nombre:'Tipos sugeridos',matriz:[['Tipo'],['Sala de Clases'],['Laboratorio de Computación'],['Laboratorio de Especialidad'],['Taller de Especialidad']],cols:[32]}
            ]);
        }

function abrirImportacionSalas(){
            const input=document.getElementById('inputImportarSalas');
            if(!input) return;
            input.value='';
            input.click();
        }

async function leerArchivoSalas(file){
            if(!file) return;
            if(!window.XLSX?.read || !window.XLSX?.utils?.sheet_to_json){
                if(!shared.ctx.asegurarXLSX || !(await shared.ctx.asegurarXLSX()) || !window.XLSX?.read || !window.XLSX?.utils?.sheet_to_json) return;
            }
            const reader=new FileReader();
            reader.onload=(ev)=>{
                try{
                    const wb=window.XLSX.read(ev.target.result,{type:'array'});
                    const sheet=wb.SheetNames.find(n=>shared.limpiarClave(n).includes('sala'))||wb.SheetNames[0];
                    const rows=window.XLSX.utils.sheet_to_json(wb.Sheets[sheet],{header:1,defval:''});
                    shared.importarSalasDesdeFilas(rows);
                }catch(err){
                    console.error(err);
                    shared.ctx.toast('No se pudo leer el archivo de salas','error');
                }
            };
            reader.readAsArrayBuffer(file);
        }

function normalizarNombreSala(valor){
            return shared.normalizarTextoImportacion(valor).replace(/\s+/g,' ').toUpperCase();
        }

function normalizarTipoEspacioSala(valor){
            const key=shared.limpiarClave(valor);
            if(key.includes('comput')) return 'Laboratorio de Computación';
            if(key.includes('taller')) return 'Taller de Especialidad';
            if(key.includes('especial')) return 'Laboratorio de Especialidad';
            if(key.includes('lab')) return 'Laboratorio de Especialidad';
            return 'Sala de Clases';
        }

function importarSalasDesdeFilas(rows){
            const data=shared.getData();
            if(!Array.isArray(rows)||rows.length<2) return shared.ctx.toast('El archivo no contiene salas para importar','error');
            const header=(rows[0]||[]).map(h=>shared.limpiarClave(h));
            const mapa={};
            header.forEach((h,i)=>{
                if(['numero','número','codigo','código'].includes(h)) mapa.numero=i;
                if(h==='nombre'||h==='sala') mapa.nombre=i;
                if(h==='capacidad'||h==='cupo') mapa.capacidad=i;
                if(h==='tipo'||h==='tipo de espacio') mapa.tipo=i;
                if(['observaciones','observacion','observación'].includes(h)) mapa.observaciones=i;
            });
            if(mapa.nombre===undefined||mapa.capacidad===undefined) return shared.ctx.toast('La plantilla debe incluir Nombre y Capacidad','error');
            const salasPorNombre=new Map(data.salas.map(s=>[shared.limpiarClave(s.nombre),s]));
            const resumen={creadas:0,actualizadas:0,omitidas:0,alertas:[]};
            shared.ctx.pushUndo?.();
            rows.slice(1).forEach((row,idx)=>{
                const fila=idx+2;
                const numero=shared.normalizarTextoImportacion(row[mapa.numero]||'').toUpperCase();
                const nombreBase=shared.normalizarNombreSala(row[mapa.nombre]);
                const nombre=numero&&nombreBase?`${numero}-${nombreBase}`:(numero||nombreBase);
                const capacidad=parseInt(row[mapa.capacidad])||0;
                const tipo=shared.normalizarTipoEspacioSala(row[mapa.tipo]||'');
                const observaciones=shared.normalizarTextoImportacion(row[mapa.observaciones]||'');
                if(!nombre&&!capacidad) return;
                if(!nombre||capacidad<=0){
                    resumen.omitidas++;
                    resumen.alertas.push({fila,nombre:nombre||'(sin nombre)',detalle:'Nombre o capacidad inválida',salaId:null});
                    return;
                }
                let sala=salasPorNombre.get(shared.limpiarClave(nombre));
                const alertas=[];
                if(capacidad>80) alertas.push(`Fila ${fila}: capacidad alta, revisar si corresponde (${capacidad})`);
                if(sala){
                    if(sala.id===shared.ctx.SALA_VIRTUAL_ID||sala.id===shared.ctx.SALA_TRO2_ID){
                        resumen.omitidas++;
                        resumen.alertas.push({fila,nombre,detalle:'No se puede modificar una sala fija del sistema',salaId:null});
                        return;
                    }
                    sala.nombre=nombre;
                    sala.capacidad=capacidad;
                    sala.tipoSala=tipo;
                    sala.observaciones=observaciones;
                    sala.alertasImportacion=alertas;
                    resumen.actualizadas++;
                }else{
                    sala={id:shared.ctx.genId(),nombre,capacidad,tipoSala:tipo,observaciones,alertasImportacion:alertas};
                    data.salas.push(sala);
                    salasPorNombre.set(shared.limpiarClave(nombre),sala);
                    resumen.creadas++;
                }
                if(alertas.length) resumen.alertas.push({fila,nombre,detalle:alertas.join(' · '),salaId:sala.id});
            });
            shared.ctx.guardar();
            shared.ctx.refrescarTodo();
            shared.mostrarResultadoImportacionSalas(resumen);
        }

function mostrarResultadoImportacionSalas(resumen){
            const filas=resumen.alertas.map(a=>`
                <tr>
                    <td>${shared.ctx.escapeHTML(a.fila)}</td>
                    <td>${shared.ctx.escapeHTML(a.nombre)}</td>
                    <td>${shared.ctx.escapeHTML(a.detalle)}</td>
                    <td>${a.salaId?`<button class="btn btn-xs btn-revisar-sala-importada" data-id="${shared.ctx.escapeAttr(a.salaId)}">Revisar</button>`:''}</td>
                </tr>`).join('');
            document.getElementById('modalContainer').innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal dashboard-detail-modal">
                    <div class="modal-header"><h3>Importación de salas</h3><p>Se importó lo válido. Revisa las alertas si hay datos atípicos.</p></div>
                    <div class="dashboard-detail-summary">
                        <div><span>Creadas</span><strong>${resumen.creadas}</strong></div>
                        <div><span>Actualizadas</span><strong>${resumen.actualizadas}</strong></div>
                        <div><span>Omitidas</span><strong>${resumen.omitidas}</strong></div>
                        <div><span>Alertas</span><strong>${resumen.alertas.length}</strong></div>
                    </div>
                    ${resumen.alertas.length?`<div class="dashboard-detail-table"><table class="report-table"><thead><tr><th>Fila</th><th>Sala</th><th>Detalle</th><th>Acción</th></tr></thead><tbody>${filas}</tbody></table></div>`:`<p class="dashboard-detail-empty">No se encontraron alertas.</p>`}
                    <div class="modal-actions"><button class="btn" id="cerrarImportacionSalas">Cerrar</button></div>
                </div></div>`;
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)shared.ctx.cerrarModal();});
            document.getElementById('cerrarImportacionSalas').addEventListener('click',shared.ctx.cerrarModal);
            document.querySelectorAll('.btn-revisar-sala-importada').forEach(btn=>btn.addEventListener('click',()=>shared.abrirModalSala(btn.dataset.id)));
            shared.ctx.toast(resumen.alertas.length?'Salas importadas con alertas':'Salas importadas correctamente',resumen.alertas.length?'warning':'success');
        }

function eliminarSala(id){
            const data = shared.getData();
            if(id===shared.ctx.SALA_VIRTUAL_ID||id===shared.ctx.SALA_TRO2_ID) return shared.ctx.toast('Esta sala no se puede eliminar','error');
            if(confirm('¿Eliminar sala?')){ data.salas=data.salas.filter(s=>s.id!==id); shared.ctx.guardar(); shared.ctx.refrescarTodo(); }
        }

function renderPanelAlertasSalas(){
            const data=shared.getData();
            const items=data.salas.filter(s=>Array.isArray(s.alertasImportacion)&&s.alertasImportacion.length);
            if(!items.length) return '';
            return `<div class="import-alert-panel">
                <div class="import-alert-header"><div><strong>Alertas de importación</strong><span>${items.length} sala(s) requieren revisión</span></div></div>
                <div class="import-alert-list">
                    ${items.map(s=>`
                        <div class="import-alert-item">
                            <div>
                                <strong>${shared.ctx.escapeHTML(s.nombre)}</strong>
                                <span>${shared.ctx.escapeHTML(s.alertasImportacion.join(' · '))}</span>
                            </div>
                            <button class="btn btn-xs btn-editar-sala" data-id="${shared.ctx.escapeAttr(s.id)}">Revisar</button>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

function renderSalas(){
            const data = shared.getData();
            const tiposOrden=['Sala de Clases','Laboratorio de Computación','Laboratorio de Especialidad','Taller de Especialidad','Otros'];
            const tipoSalaVista=s=>{
                if(s.id===shared.ctx.SALA_VIRTUAL_ID) return 'Virtual / Sistema';
                if(s.id===shared.ctx.SALA_TRO2_ID) return 'Terreno / Sistema';
                return s.tipoSala||'Sala de Clases';
            };
            const grupos=new Map();
            data.salas.forEach(s=>{
                const tipo=tipoSalaVista(s);
                if(!grupos.has(tipo)) grupos.set(tipo,[]);
                grupos.get(tipo).push(s);
            });
            const ordenarSala=(a,b)=>String(a.nombre||'').localeCompare(String(b.nombre||''),undefined,{numeric:true,sensitivity:'base'});
            const renderChip=s=>{
                const esFija=s.id===shared.ctx.SALA_VIRTUAL_ID||s.id===shared.ctx.SALA_TRO2_ID;
                const alerta=s.alertasImportacion?.length?` <small class="import-warning-chip">${s.alertasImportacion.length} alerta(s)</small>`:'';
                return `<span class="item-chip" style="${s.id===shared.ctx.SALA_VIRTUAL_ID?'background:color-mix(in srgb, var(--planhor-purple) 13%, var(--surface));':''}${s.id===shared.ctx.SALA_TRO2_ID?'background:color-mix(in srgb, var(--planhor-teal) 13%, var(--surface));':''}">
                    ${shared.ctx.escapeHTML(s.nombre)}${alerta} (Cap:${Number(s.capacidad)||0})
                    <button class="btn btn-xs btn-editar-sala" data-id="${shared.ctx.escapeAttr(s.id)}">✎</button>
                    ${!esFija?`<button class="btn btn-xs btn-eliminar-sala" data-id="${shared.ctx.escapeAttr(s.id)}">🗑️</button>`:''}
                </span>`;
            };
            const orden=[...tiposOrden,...[...grupos.keys()].filter(t=>!tiposOrden.includes(t)).sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'}))];
            const contenido=orden.filter(tipo=>grupos.has(tipo)).map(tipo=>{
                const salas=grupos.get(tipo).sort(ordenarSala);
                const capacidad=salas.reduce((acc,s)=>acc+(Number(s.capacidad)||0),0);
                return `<section class="rooms-type-group">
                    <div class="rooms-type-title">
                        <strong>${shared.ctx.escapeHTML(tipo)}</strong>
                        <span>${salas.length} espacio(s) · cap. total ${capacidad}</span>
                    </div>
                    <div class="rooms-type-list">${salas.map(renderChip).join('')}</div>
                </section>`;
            }).join('') || '<p class="auto-plan-empty">No hay salas registradas.</p>';
            document.getElementById('listaSalas').innerHTML=shared.renderPanelAlertasSalas()+contenido;
        }
        return {abrirModalSala, guardarSala, crearPlantillaImportacionSalas, exportarArchivoSalas, abrirImportacionSalas, leerArchivoSalas, normalizarNombreSala, normalizarTipoEspacioSala, importarSalasDesdeFilas, mostrarResultadoImportacionSalas, eliminarSala, renderPanelAlertasSalas, renderSalas};
    }};
})();
