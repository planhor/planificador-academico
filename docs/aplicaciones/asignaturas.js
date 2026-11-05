// Aplicación asignaturas. Estado y servicios compartidos inyectados, sin copias de datos.
(function(){
    window.PlanhorAplicaciones=window.PlanhorAplicaciones||{};
    window.PlanhorAplicaciones["asignaturas"]={create(shared){
function abrirModalAsignatura(id=null){
            const data = shared.getData();
            const a=id?data.asignaturas.find(a=>a.id===id):null;
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3>${a?'Editar':'Nueva'} Asignatura</h3>
                <div class="form-group"><label class="form-label">Código</label><input class="form-input" id="codAsig" value="${shared.ctx.escapeAttr(a?.codigo||'')}"></div>
                <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="nomAsig" value="${shared.ctx.escapeAttr(a?.nombre||'')}"></div>
                <div class="form-group"><label class="form-label">Horas totales</label><input class="form-input" type="number" id="hrsTot" value="${a?.horasTotales||72}" step="18"></div>
                <div class="form-group"><label class="form-label">Horas virtuales</label><input class="form-input" type="number" id="hrsVir" value="${a?.horasVirtuales||0}" step="18"></div>
                <div class="config-section subject-criteria-section">
                    <h4>Criterios de planificación</h4>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Área / dependencia</label>${shared.selectCriterioAsignatura('asigArea','area',shared.criterioAsignatura(a,'area','especialidad'))}</div>
                        <div class="form-group"><label class="form-label">Modalidad pedagógica</label>${shared.selectCriterioAsignatura('asigModalidad','modalidad',shared.criterioAsignatura(a,'modalidad','lectiva'))}</div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Condición académica</label>${shared.selectCriterioAsignatura('asigCondicion','condicion',shared.criterioAsignatura(a,'condicion','normal'))}</div>
                        <div class="form-group"><label class="form-label">Distribución preferida</label>${shared.selectCriterioAsignatura('asigDistribucion','distribucion',shared.criterioAsignatura(a,'distribucion','compacta'))}</div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label class="form-label">Control horario</label>${shared.selectCriterioAsignatura('asigControlHorario','controlHorario',shared.criterioAsignatura(a,'controlHorario','propio'))}</div>
                        <div class="form-group"><label class="form-label">Preferencia horaria</label>${shared.selectCriterioAsignatura('asigPreferenciaHoraria','preferenciaHoraria',shared.criterioAsignatura(a,'preferenciaHoraria','flexible'))}</div>
                    </div>
                    <p class="criteria-note">Las horas virtuales se tratarán como autoaprendizaje: cuentan para la carga docente y no requieren sala física.</p>
                </div>
                <div class="form-group"><label class="form-label">Salas preferidas</label><div id="chipsSalasAsig" style="margin-bottom:6px;"></div><div class="search-box input-with-clear"><input class="form-input" id="buscarSalaAsig" placeholder="🔍 Buscar sala..." autocomplete="off"><button class="clear-btn" id="clearBuscarSalaAsig">✕</button><ul class="search-results" id="resultadosSalasAsig"></ul></div></div>
                <div class="form-group">
                    <label class="form-label">Softwares requeridos</label>
                    <textarea class="form-input" id="softwaresAsig" rows="2" placeholder="Ej: AutoCAD 2024, MATLAB, Proteus">${shared.ctx.escapeHTML((a?.softwares||[]).join(', '))}</textarea>
                    <p class="criteria-note">Separa cada software con coma. Se usará en reportes por sala/laboratorio; no afecta la planificación.</p>
                </div>
                <div class="form-group"><label class="form-label">Carreras/Niveles donde se dicta</label>
                    <div id="chipsCarrerasNivel" style="margin-bottom:8px;"></div>
                    <div class="search-box input-with-clear"><input class="form-input" id="buscarCarreraNivel" placeholder="🔍 Buscar carrera o nivel..." autocomplete="off"><button class="clear-btn" id="clearBuscarCarreraNivel">✕</button><ul class="search-results" id="resultadosCarreraNivel"></ul></div>
                    <p class="criteria-note">Para electivas, conserva aquí su origen ELEC. Los destinos se administran desde Secciones → Asignaturas.</p>
                </div>
                <button class="btn btn-primary" id="btnGuardarAsignatura">Guardar</button>
            </div></div>`;
            shared.asignaturaTemp={id:a?.id||null, codigo:a?.codigo||'', nombre:a?.nombre||'', horasTotales:a?.horasTotales||72, horasVirtuales:a?.horasVirtuales||0, salas:(a?.salasPreferidas||[]).slice(), relaciones:a?data.asignaturaCarreraNivel.filter(r=>r.asignaturaId===a.id).map(r=>({carreraId:r.carreraId,nivelId:r.nivelId})) : []};
            shared.actualizarChipsCarrerasNivel();
            shared.actualizarChipsSalasAsig();
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)shared.ctx.cerrarModal();});
            document.getElementById('buscarCarreraNivel').addEventListener('input',shared.filtrarCarrerasNivel);
            document.getElementById('buscarCarreraNivel').addEventListener('focus',()=>{if(!document.getElementById('buscarCarreraNivel').value)shared.mostrarOpcionesCarrerasNivel();});
            document.getElementById('clearBuscarCarreraNivel').addEventListener('click',shared.limpiarBusquedaAsignatura);
            document.getElementById('buscarSalaAsig').addEventListener('input',shared.filtrarSalasAsig);
            document.getElementById('buscarSalaAsig').addEventListener('focus',function(){if(!this.value)shared.mostrarOpcionesSalasAsig();});
            document.getElementById('clearBuscarSalaAsig').addEventListener('click',shared.limpiarBusquedaSalaAsig);
            document.getElementById('btnGuardarAsignatura').addEventListener('click',()=>shared.guardarAsignatura(id));
        }

function actualizarChipsCarrerasNivel(){
            const data = shared.getData();
            const container=document.getElementById('chipsCarrerasNivel'); if(!container) return;
            container.innerHTML=shared.asignaturaTemp.relaciones.map(rel=>{
                const c=data.carreras.find(c=>c.id===rel.carreraId), n=data.niveles.find(n=>n.id===rel.nivelId);
                return `<span class="item-chip">${shared.ctx.escapeHTML(c?.nombre||'?')} - ${shared.ctx.escapeHTML(n?.nombre||'?')} <button class="btn btn-xs btn-eliminar-chip" data-carrera="${shared.ctx.escapeAttr(rel.carreraId)}" data-nivel="${shared.ctx.escapeAttr(rel.nivelId)}">x</button></span>`;
            }).join('');
            container.querySelectorAll('.btn-eliminar-chip').forEach(btn=>btn.addEventListener('click',function(){
                shared.asignaturaTemp.relaciones=shared.asignaturaTemp.relaciones.filter(r=>!(r.carreraId===this.dataset.carrera&&r.nivelId===this.dataset.nivel));
                shared.actualizarChipsCarrerasNivel();
            }));
        }

function getOpcionesCarrerasNivel(){
            const data = shared.getData();
            const opciones=[];
            data.carreras.forEach(c=>{data.niveles.filter(n=>n.carreraId===c.id).forEach(n=>opciones.push({carreraId:c.id,nivelId:n.id,texto:`${c.nombre} - ${n.nombre}`}));});
            return opciones;
        }

function elegirCarreraNivel(opcion, input, resultados){
            if(!shared.asignaturaTemp.relaciones.some(r=>r.carreraId===opcion.carreraId&&r.nivelId===opcion.nivelId)){
                shared.asignaturaTemp.relaciones.push({carreraId:opcion.carreraId,nivelId:opcion.nivelId});
                shared.actualizarChipsCarrerasNivel();
            }
            input.value='';
            resultados.classList.remove('show');
            document.getElementById('clearBuscarCarreraNivel').classList.remove('visible');
        }

function mostrarOpcionesCarrerasNivel(){
            const input=document.getElementById('buscarCarreraNivel'), resultados=document.getElementById('resultadosCarreraNivel');
            resultados.innerHTML='';
            shared.getOpcionesCarrerasNivel().slice(0,10).forEach(o=>{
                const li=document.createElement('li'); li.textContent=o.texto;
                li.addEventListener('click',()=>shared.elegirCarreraNivel(o,input,resultados));
                resultados.appendChild(li);
            });
            resultados.classList.add('show');
        }

function filtrarCarrerasNivel(){
            const input=document.getElementById('buscarCarreraNivel'), filter=input.value.toLowerCase(), resultados=document.getElementById('resultadosCarreraNivel');
            resultados.innerHTML=''; document.getElementById('clearBuscarCarreraNivel').classList.toggle('visible',input.value.length>0);
            if(!filter){shared.mostrarOpcionesCarrerasNivel(); return;}
            const filtradas=shared.getOpcionesCarrerasNivel().filter(o=>o.texto.toLowerCase().includes(filter));
            if(filtradas.length===0){resultados.classList.remove('show'); return;}
            filtradas.slice(0,10).forEach(o=>{
                const li=document.createElement('li'); li.textContent=o.texto;
                li.addEventListener('click',()=>shared.elegirCarreraNivel(o,input,resultados));
                resultados.appendChild(li);
            });
            resultados.classList.add('show');
        }

function limpiarBusquedaAsignatura(){
            document.getElementById('buscarCarreraNivel').value='';
            document.getElementById('resultadosCarreraNivel').classList.remove('show');
            document.getElementById('clearBuscarCarreraNivel').classList.remove('visible');
        }

function actualizarChipsSalasAsig(){
            const data = shared.getData();
            const cont=document.getElementById('chipsSalasAsig'); if(!cont) return;
            cont.innerHTML=shared.asignaturaTemp.salas.map(sid=>{const sala=data.salas.find(x=>x.id===sid); return sala?`<span class="item-chip">${shared.ctx.escapeHTML(sala.nombre)} <button class="btn btn-xs btn-eliminar-chip-sala" data-id="${shared.ctx.escapeAttr(sid)}">x</button></span>`:'';}).join('');
            cont.querySelectorAll('.btn-eliminar-chip-sala').forEach(btn=>btn.addEventListener('click',function(){
                shared.asignaturaTemp.salas=shared.asignaturaTemp.salas.filter(id=>id!==this.dataset.id); shared.actualizarChipsSalasAsig();
            }));
        }

function elegirSalaAsignatura(sala, input, resultados){
            if(!shared.asignaturaTemp.salas.includes(sala.id)){
                shared.asignaturaTemp.salas.push(sala.id);
                shared.actualizarChipsSalasAsig();
            }
            input.value='';
            resultados.classList.remove('show');
            document.getElementById('clearBuscarSalaAsig').classList.remove('visible');
        }

function getOpcionesSalasAsignatura(filtro=''){
            const data = shared.getData();
            const filtroLimpio=filtro.toLowerCase();
            return data.salas.filter(s=>!s.esVirtual&&s.id!==shared.ctx.SALA_TRO2_ID&&!shared.asignaturaTemp.salas.includes(s.id)&&(!filtroLimpio||s.nombre.toLowerCase().includes(filtroLimpio)));
        }

function renderOpcionesSalasAsignatura(opciones, input, resultados){
            resultados.innerHTML=opciones.slice(0,10).map(s=>`<li>${shared.ctx.escapeHTML(s.nombre)}</li>`).join('');
            Array.from(resultados.children).forEach((li,i)=>{
                li.onclick=()=>shared.elegirSalaAsignatura(opciones[i],input,resultados);
            });
            resultados.classList.add('show');
        }

function mostrarOpcionesSalasAsig(){
            const input=document.getElementById('buscarSalaAsig'), resultados=document.getElementById('resultadosSalasAsig');
            if(!input||!resultados) return;
            shared.renderOpcionesSalasAsignatura(shared.getOpcionesSalasAsignatura(),input,resultados);
        }

function filtrarSalasAsig(){
            const input=document.getElementById('buscarSalaAsig'), resultados=document.getElementById('resultadosSalasAsig');
            if(!input||!resultados) return;
            const filter=input.value.toLowerCase();
            document.getElementById('clearBuscarSalaAsig').classList.toggle('visible',input.value.length>0);
            if(!filter){shared.mostrarOpcionesSalasAsig();return;}
            const opciones=shared.getOpcionesSalasAsignatura(filter);
            if(!opciones.length){resultados.classList.remove('show');return;}
            shared.renderOpcionesSalasAsignatura(opciones,input,resultados);
        }

function limpiarBusquedaSalaAsig(){
            document.getElementById('buscarSalaAsig').value='';
            document.getElementById('resultadosSalasAsig').classList.remove('show');
            document.getElementById('clearBuscarSalaAsig').classList.remove('visible');
        }

function filasAyudaAsignaturas(){
            return [
                ['Campo','Qué escribir','Ejemplo','Notas'],
                ['Código','Código único de la asignatura','EEA401','Se guarda en mayúscula. Si ya existe, se actualiza.'],
                ['Nombre','Nombre completo de la asignatura','Redes Eléctricas I','Se normaliza con primera letra mayúscula.'],
                ['Horas totales','Horas semestrales totales','72','Debe ser múltiplo de 18.'],
                ['Horas virtuales','Horas de autoaprendizaje','18','Puede ser 0. Debe ser múltiplo de 18.'],
                ['Área','especialidad, transversal o electiva','especialidad','Las electivas pueden quedar sin carrera/nivel y asociarse después.'],
                ['Modalidad','lectiva, practica, semipresencial u online-teams','practica','Online y virtual no son lo mismo.'],
                ['Condición','normal, alta-reprobacion, requiere-ayudantia o alta-reprobacion-ayudantia','normal','Permite marcar asignaturas críticas.'],
                ['Distribución','compacta, balanceada, dividida o flexible','compacta','Para 54/72h normalmente conviene compacta.'],
                ['Control horario','propio o coordinacion-externa','propio','Transversales suelen usar coordinacion-externa.'],
                ['Preferencia horaria','flexible, evitar-temprano o proteger-repitentes','flexible','Apoya la autoplanificación.'],
                ['Salas preferidas','Número o nombre de salas separados por coma','315, LAB ELEC 1','La hoja Salas muestra Número, Nombre, Capacidad y Tipo de espacio.'],
                ['Softwares','Programas requeridos separados por coma','AutoCAD 2024, MATLAB, Proteus','Sirve para reportar instalaciones por laboratorio. No afecta la planificación.'],
                ['Carrera','Nombre o código de la carrera','IEL-IEL-2','Puedes escribir el código o el nombre. Si son varias, sepáralas con coma.'],
                ['Nivel','Nivel asociado a la carrera','N1','Si hay varias carreras y todas usan el mismo nivel, escribe un solo nivel.']
            ];
        }

async function crearPlantillaImportacionAsignaturas(){
            const data=shared.getData();
            const headers=['Código','Nombre','Horas totales','Horas virtuales','Área','Modalidad','Condición','Distribución','Control horario','Preferencia horaria','Salas preferidas','Softwares','Carrera','Nivel'];
            const filas=[
                headers,
                ['EEA401','Redes Eléctricas I',72,0,'especialidad','practica','normal','compacta','propio','flexible','315','AutoCAD 2024, MATLAB','IEL-IEL-2','N1']
            ];
            const carrerasNiveles=[['Carrera','Código carrera','Nivel','Cómo usarlo']];
            data.carreras.forEach(c=>{
                data.niveles.filter(n=>n.carreraId===c.id).sort(shared.ordenarNivelesDesc).forEach(n=>{
                    carrerasNiveles.push([c.nombre,c.codigo,n.nombre,`En Asignaturas puedes escribir Carrera: ${c.codigo} y Nivel: ${n.nombre}`]);
                });
            });
            const salas=[['Número','Nombre','Capacidad','Tipo de espacio'],...data.salas.map(s=>{
                const ref=shared.separarNumeroNombreSala(s.nombre);
                return [ref.numero,ref.nombre,s.capacidad||'',s.tipoSala||'Sala de Clases'];
            })];
            const criterios=[
                ['Tipo','Valores permitidos'],
                ['Área',shared.CRITERIOS_ASIGNATURA.area.join(', ')],
                ['Modalidad',shared.CRITERIOS_ASIGNATURA.modalidad.join(', ')],
                ['Condición',shared.CRITERIOS_ASIGNATURA.condicion.join(', ')],
                ['Distribución',shared.CRITERIOS_ASIGNATURA.distribucion.join(', ')],
                ['Control horario',shared.CRITERIOS_ASIGNATURA.controlHorario.join(', ')],
                ['Preferencia horaria',shared.CRITERIOS_ASIGNATURA.preferenciaHoraria.join(', ')]
            ];
            if((window.XLSX?.utils?.book_new&&window.XLSX?.writeFile) || (shared.ctx.asegurarXLSX && await shared.ctx.asegurarXLSX() && window.XLSX?.utils?.book_new&&window.XLSX?.writeFile)){
                const wb=window.XLSX.utils.book_new();
                const add=(nombre,matriz,cols=[])=>{
                    const ws=window.XLSX.utils.aoa_to_sheet(matriz);
                    if(cols.length) ws['!cols']=cols.map(w=>({wch:w}));
                    window.XLSX.utils.book_append_sheet(wb,ws,nombre);
                };
                add('Asignaturas',filas,[14,36,14,14,16,18,28,18,20,22,28,34,24,12]);
                add('Carreras_Niveles',carrerasNiveles,[38,18,12,72]);
                add('Salas',salas,[14,30,12,32]);
                add('Criterios',criterios,[22,80]);
                add('Ayuda',shared.filasAyudaAsignaturas(),[22,42,36,58]);
                window.XLSX.writeFile(wb,'Plantilla_Importacion_Asignaturas.xlsx',{bookSST:true});
                shared.ctx.toast('Plantilla de asignaturas descargada','success');
                return;
            }
        }

function exportarArchivoAsignaturas(){
            const data=shared.getData();
            const headers=['Código','Nombre','Horas totales','Horas virtuales','Área','Modalidad','Condición','Distribución','Control horario','Preferencia horaria','Salas preferidas','Softwares','Carrera','Nivel'];
            const filas=[headers];
            data.asignaturas.forEach(a=>{
                const salas=(a.salasPreferidas||[]).map(id=>data.salas.find(s=>s.id===id)?.nombre).filter(Boolean).join(', ');
                const softwares=(a.softwares||[]).join(', ');
                const relaciones=(data.asignaturaCarreraNivel||[]).filter(r=>r.asignaturaId===a.id);
                if(!relaciones.length){
                    filas.push([a.codigo,a.nombre,a.horasTotales||0,a.horasVirtuales||0,a.area||'especialidad',a.modalidad||'lectiva',a.condicion||'normal',a.distribucion||'compacta',a.controlHorario||'propio',a.preferenciaHoraria||'flexible',salas,softwares,'','']);
                    return;
                }
                relaciones.forEach(rel=>{
                    const carrera=data.carreras.find(c=>c.id===rel.carreraId);
                    const nivel=data.niveles.find(n=>n.id===rel.nivelId);
                    filas.push([a.codigo,a.nombre,a.horasTotales||0,a.horasVirtuales||0,a.area||'especialidad',a.modalidad||'lectiva',a.condicion||'normal',a.distribucion||'compacta',a.controlHorario||'propio',a.preferenciaHoraria||'flexible',salas,softwares,carrera?.codigo||'',nivel?.nombre||'']);
                });
            });
            const carrerasNiveles=[['Carrera','Código carrera','Nivel','Cómo usarlo']];
            data.carreras.forEach(c=>data.niveles.filter(n=>n.carreraId===c.id).sort(shared.ordenarNivelesDesc).forEach(n=>carrerasNiveles.push([c.nombre,c.codigo,n.nombre,`En Asignaturas puedes escribir Carrera: ${c.codigo} y Nivel: ${n.nombre}`])));
            const salas=[['Número','Nombre','Capacidad','Tipo de espacio'],...data.salas.map(s=>{const ref=shared.separarNumeroNombreSala(s.nombre); return [ref.numero,ref.nombre,s.capacidad||'',s.tipoSala||'Sala de Clases'];})];
            shared.exportarWorkbookCatalogo('Asignaturas_exportadas.xlsx',[
                {nombre:'Asignaturas',matriz:filas,cols:[14,36,14,14,16,18,28,18,20,22,28,34,24,12]},
                {nombre:'Carreras_Niveles',matriz:carrerasNiveles,cols:[38,18,12,72]},
                {nombre:'Salas',matriz:salas,cols:[14,30,12,32]},
                {nombre:'Criterios',matriz:[['Tipo','Valores permitidos'],['Área',shared.CRITERIOS_ASIGNATURA.area.join(', ')],['Modalidad',shared.CRITERIOS_ASIGNATURA.modalidad.join(', ')],['Condición',shared.CRITERIOS_ASIGNATURA.condicion.join(', ')],['Distribución',shared.CRITERIOS_ASIGNATURA.distribucion.join(', ')],['Control horario',shared.CRITERIOS_ASIGNATURA.controlHorario.join(', ')],['Preferencia horaria',shared.CRITERIOS_ASIGNATURA.preferenciaHoraria.join(', ')]],cols:[22,80]},
                {nombre:'Ayuda',matriz:shared.filasAyudaAsignaturas(),cols:[22,42,36,58]}
            ]);
        }

function abrirImportacionAsignaturas(){
            const input=document.getElementById('inputImportarAsignaturas');
            if(!input) return;
            input.value='';
            input.click();
        }

async function leerArchivoAsignaturas(file){
            if(!file) return;
            if(!window.XLSX?.read || !window.XLSX?.utils?.sheet_to_json){
                if(!shared.ctx.asegurarXLSX || !(await shared.ctx.asegurarXLSX()) || !window.XLSX?.read || !window.XLSX?.utils?.sheet_to_json) return;
            }
            const reader=new FileReader();
            reader.onload=(ev)=>{
                try{
                    const wb=window.XLSX.read(ev.target.result,{type:'array'});
                    const sheet=wb.SheetNames.find(n=>shared.limpiarClave(n).includes('asignatura'))||wb.SheetNames[0];
                    const rows=window.XLSX.utils.sheet_to_json(wb.Sheets[sheet],{header:1,defval:''});
                    shared.importarAsignaturasDesdeFilas(rows);
                }catch(err){
                    console.error(err);
                    shared.ctx.toast('No se pudo leer el archivo de asignaturas','error');
                }
            };
            reader.readAsArrayBuffer(file);
        }

function valorFilaPorMapa(row,mapa,nombres){
            for(const nombre of nombres){
                const idx=mapa[nombre];
                if(idx!==undefined) return row[idx];
            }
            return '';
        }

function normalizarCriterioAsignatura(valor,campo,defecto){
            const key=shared.limpiarClave(valor);
            if(!key) return defecto;
            const labels=shared.LABEL_CRITERIOS_ASIGNATURA[campo]||{};
            const directo=shared.CRITERIOS_ASIGNATURA[campo].find(v=>shared.limpiarClave(v)===key);
            if(directo) return directo;
            return shared.CRITERIOS_ASIGNATURA[campo].find(v=>shared.limpiarClave(labels[v])===key)||defecto;
        }

function normalizarNombreAsignatura(valor){
            return shared.capitalizarPalabras(valor);
        }

function parseListaTexto(valor){
            return shared.normalizarTextoImportacion(valor).split(/[,;\n\r]+/).map(x=>x.trim()).filter(Boolean);
        }

function normalizarListaSoftwares(valor){
            const vistos=new Set();
            return shared.parseListaTexto(valor)
                .map(x=>x.replace(/\s+/g,' ').trim())
                .filter(Boolean)
                .filter(x=>{
                    const key=shared.limpiarClave(x);
                    if(vistos.has(key)) return false;
                    vistos.add(key);
                    return true;
                });
        }

function resolverRelacionCarreraNivelSeparada(carreraValor,nivelValor){
            const data=shared.getData();
            const carreraTxt=shared.limpiarClave(carreraValor);
            const nivelTxt=shared.limpiarClave(nivelValor);
            if(!carreraTxt||!nivelTxt) return null;
            const carrera=data.carreras.find(c=>shared.limpiarClave(c.nombre)===carreraTxt||shared.limpiarClave(c.codigo)===carreraTxt||shared.limpiarClave(`${c.nombre} (${c.codigo})`)===carreraTxt);
            if(!carrera) return null;
            const nivel=data.niveles.find(n=>n.carreraId===carrera.id&&(shared.limpiarClave(n.nombre)===nivelTxt||shared.limpiarClave(String(n.nombre).replace(/^n/i,''))===nivelTxt.replace(/^n/,'')));
            return nivel?{carreraId:carrera.id,nivelId:nivel.id}:null;
        }

function resolverRelacionesDesdeColumnas(carrerasValor,nivelesValor){
            const carreras=shared.parseListaTexto(carrerasValor);
            const niveles=shared.parseListaTexto(nivelesValor);
            const relaciones=[], noEncontradas=[];
            if(!carreras.length&&!niveles.length) return {relaciones,noEncontradas};
            carreras.forEach((carrera,i)=>{
                const nivel=niveles[i]||niveles[0]||'';
                const rel=shared.resolverRelacionCarreraNivelSeparada(carrera,nivel);
                if(rel) relaciones.push(rel);
                else noEncontradas.push([carrera,nivel].filter(Boolean).join(' | ')||carrera||nivel);
            });
            return {relaciones,noEncontradas};
        }

function separarNumeroNombreSala(valor){
            const txt=shared.normalizarTextoImportacion(valor);
            const partes=txt.split(/\s*-\s*/).filter(Boolean);
            if(partes.length>=2 && /^\d+[A-Z]?$/i.test(partes[0])) return {numero:partes[0].toUpperCase(),nombre:partes.slice(1).join(' - ')};
            if(/^\d+[A-Z]?$/i.test(txt)) return {numero:txt.toUpperCase(),nombre:''};
            return {numero:'',nombre:txt};
        }

function clavesBusquedaSala(sala){
            const ref=shared.separarNumeroNombreSala(sala.nombre);
            return [sala.nombre,ref.numero,ref.nombre,[ref.numero,ref.nombre].filter(Boolean).join('-')]
                .map(x=>shared.limpiarClave(x))
                .filter(Boolean);
        }

function importarAsignaturasDesdeFilas(rows){
            const data=shared.getData();
            if(!Array.isArray(rows)||rows.length<2) return shared.ctx.toast('El archivo no contiene asignaturas para importar','error');
            const header=(rows[0]||[]).map(h=>shared.limpiarClave(h));
            const mapa={};
            header.forEach((h,i)=>{
                if(['codigo','código'].includes(h)) mapa.codigo=i;
                if(h==='nombre'||h==='asignatura') mapa.nombre=i;
                if(['horas totales','horas'].includes(h)) mapa.horasTotales=i;
                if(['horas virtuales','virtuales'].includes(h)) mapa.horasVirtuales=i;
                if(['area','área','dependencia'].includes(h)) mapa.area=i;
                if(['modalidad','modalidad pedagogica','modalidad pedagógica'].includes(h)) mapa.modalidad=i;
                if(['condicion','condición'].includes(h)) mapa.condicion=i;
                if(['distribucion','distribución'].includes(h)) mapa.distribucion=i;
                if(['control horario'].includes(h)) mapa.controlHorario=i;
                if(['preferencia horaria'].includes(h)) mapa.preferenciaHoraria=i;
                if(['salas preferidas','salas'].includes(h)) mapa.salas=i;
                if(['softwares','software','programas'].includes(h)) mapa.softwares=i;
                if(['carrera','codigo carrera','código carrera','programa'].includes(h)) mapa.carrera=i;
                if(['nivel','semestre'].includes(h)) mapa.nivel=i;
            });
            if(mapa.codigo===undefined||mapa.nombre===undefined) return shared.ctx.toast('La plantilla debe incluir Código y Nombre','error');
            const asignaturaPorCodigo=new Map(data.asignaturas.map(a=>[String(a.codigo||'').toUpperCase(),a]));
            const salaPorNombre=new Map();
            data.salas.forEach(s=>shared.clavesBusquedaSala(s).forEach(k=>salaPorNombre.set(k,s)));
            const cols=shared.ctx.getColores();
            const resumen={creadas:0,actualizadas:0,relaciones:0,salas:0,omitidas:0,alertas:[]};
            shared.ctx.pushUndo?.();
            rows.slice(1).forEach((row,idx)=>{
                const fila=idx+2;
                const codigo=shared.normalizarTextoImportacion(shared.valorFilaPorMapa(row,mapa,['codigo'])).toUpperCase();
                const nombre=shared.normalizarNombreAsignatura(shared.valorFilaPorMapa(row,mapa,['nombre']));
                if(!codigo&&!nombre) return;
                if(!codigo||!nombre){ resumen.omitidas++; resumen.alertas.push({fila,codigo:codigo||'(sin código)',detalle:'Fila incompleta'}); return; }
                const ht=parseInt(shared.valorFilaPorMapa(row,mapa,['horasTotales']))||0;
                const hv=parseInt(shared.valorFilaPorMapa(row,mapa,['horasVirtuales']))||0;
                if(!ht||ht<=0||ht%18!==0||hv<0||hv%18!==0||hv>ht){
                    resumen.omitidas++;
                    resumen.alertas.push({fila,codigo,detalle:'Horas inválidas'});
                    return;
                }
                const area=shared.normalizarCriterioAsignatura(shared.valorFilaPorMapa(row,mapa,['area']),'area','especialidad');
                const modalidad=shared.normalizarCriterioAsignatura(shared.valorFilaPorMapa(row,mapa,['modalidad']),'modalidad','lectiva');
                const condicion=shared.normalizarCriterioAsignatura(shared.valorFilaPorMapa(row,mapa,['condicion']),'condicion','normal');
                const distribucion=shared.normalizarCriterioAsignatura(shared.valorFilaPorMapa(row,mapa,['distribucion']),'distribucion',area==='transversal'?'balanceada':'compacta');
                const controlHorario=shared.normalizarCriterioAsignatura(shared.valorFilaPorMapa(row,mapa,['controlHorario']),'controlHorario',area==='transversal'?'coordinacion-externa':'propio');
                const preferenciaHoraria=shared.normalizarCriterioAsignatura(shared.valorFilaPorMapa(row,mapa,['preferenciaHoraria']),'preferenciaHoraria','flexible');
                const softwares=shared.normalizarListaSoftwares(shared.valorFilaPorMapa(row,mapa,['softwares']));
                const salas=[], salasNoEncontradas=[];
                shared.parseListaTexto(shared.valorFilaPorMapa(row,mapa,['salas'])).forEach(txt=>{
                    const sala=salaPorNombre.get(shared.limpiarClave(txt));
                    if(sala) salas.push(sala.id);
                    else salasNoEncontradas.push(txt);
                });
                const relaciones=[], relacionesNoEncontradas=[];
                const desdeColumnas=shared.resolverRelacionesDesdeColumnas(shared.valorFilaPorMapa(row,mapa,['carrera']),shared.valorFilaPorMapa(row,mapa,['nivel']));
                relaciones.push(...desdeColumnas.relaciones);
                relacionesNoEncontradas.push(...desdeColumnas.noEncontradas);
                let asig=asignaturaPorCodigo.get(codigo);
                const base={codigo,nombre,horasTotales:ht,horasVirtuales:hv,horasPresenciales:ht-hv,bloquesPresenciales:(ht-hv)/18,bloquesVirtuales:hv/18,salasPreferidas:[...new Set(salas)],softwares,area,modalidad,condicion,distribucion,controlHorario,preferenciaHoraria,alertasImportacion:[...salasNoEncontradas.map(s=>`Fila ${fila}: sala no encontrada: ${s}`),...relacionesNoEncontradas.map(r=>`Fila ${fila}: carrera/nivel no encontrado: ${r}`)]};
                if(asig){
                    Object.assign(asig,base);
                    resumen.actualizadas++;
                }else{
                    asig={id:shared.ctx.genId(),color:shared.ctx.colorAsignaturaPlanhor?.({codigo,nombre})||cols[Math.floor(Math.random()*cols.length)],...base};
                    data.asignaturas.push(asig);
                    asignaturaPorCodigo.set(codigo,asig);
                    resumen.creadas++;
                }
                data.asignaturaCarreraNivel=data.asignaturaCarreraNivel.filter(r=>r.asignaturaId!==asig.id);
                relaciones.forEach(rel=>{
                    if(!data.asignaturaCarreraNivel.some(r=>r.asignaturaId===asig.id&&r.carreraId===rel.carreraId&&r.nivelId===rel.nivelId)){
                        data.asignaturaCarreraNivel.push({asignaturaId:asig.id,carreraId:rel.carreraId,nivelId:rel.nivelId});
                        resumen.relaciones++;
                    }
                });
                resumen.salas+=salas.length;
                if(base.alertasImportacion.length) resumen.alertas.push({fila,codigo,detalle:base.alertasImportacion.join(' · '),asignaturaId:asig.id});
            });
            shared.ctx.guardar();
            shared.ctx.refrescarTodo();
            shared.mostrarResultadoImportacionAsignaturas(resumen);
        }

function mostrarResultadoImportacionAsignaturas(resumen){
            const filas=resumen.alertas.map(a=>`
                <tr>
                    <td>${shared.ctx.escapeHTML(a.fila)}</td>
                    <td>${shared.ctx.escapeHTML(a.codigo)}</td>
                    <td>${shared.ctx.escapeHTML(a.detalle)}</td>
                    <td>${a.asignaturaId?`<button class="btn btn-xs btn-revisar-asignatura-importada" data-id="${shared.ctx.escapeAttr(a.asignaturaId)}">Revisar</button>`:''}</td>
                </tr>`).join('');
            document.getElementById('modalContainer').innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal dashboard-detail-modal">
                    <div class="modal-header"><h3>Importación de asignaturas</h3><p>Se importó lo válido. Revisa las alertas para corregir escritura o asociaciones.</p></div>
                    <div class="dashboard-detail-summary">
                        <div><span>Creadas</span><strong>${resumen.creadas}</strong></div>
                        <div><span>Actualizadas</span><strong>${resumen.actualizadas}</strong></div>
                        <div><span>Relaciones</span><strong>${resumen.relaciones}</strong></div>
                        <div><span>Alertas</span><strong>${resumen.alertas.length}</strong></div>
                    </div>
                    ${resumen.alertas.length?`<div class="dashboard-detail-table"><table class="report-table"><thead><tr><th>Fila</th><th>Código</th><th>Detalle</th><th>Acción</th></tr></thead><tbody>${filas}</tbody></table></div>`:`<p class="dashboard-detail-empty">No se encontraron alertas.</p>`}
                    <div class="modal-actions"><button class="btn" id="cerrarImportacionAsignaturas">Cerrar</button></div>
                </div></div>`;
            document.getElementById('modalOverlay').addEventListener('click',function(e){if(e.target===this)shared.ctx.cerrarModal();});
            document.getElementById('cerrarImportacionAsignaturas').addEventListener('click',shared.ctx.cerrarModal);
            document.querySelectorAll('.btn-revisar-asignatura-importada').forEach(btn=>btn.addEventListener('click',()=>shared.abrirModalAsignatura(btn.dataset.id)));
            shared.ctx.toast(resumen.alertas.length?'Asignaturas importadas con alertas':'Asignaturas importadas correctamente',resumen.alertas.length?'warning':'success');
        }

function guardarAsignatura(id){
            const data = shared.getData();
            const cod=document.getElementById('codAsig').value.trim(), nom=document.getElementById('nomAsig').value.trim();
            const ht=parseInt(document.getElementById('hrsTot').value), hv=parseInt(document.getElementById('hrsVir').value);
            if(!cod) return shared.ctx.toast('El código de asignatura es obligatorio','error');
            if(!nom) return shared.ctx.toast('El nombre de asignatura es obligatorio','error');
            if(!ht||ht<=0) return shared.ctx.toast('Las horas totales deben ser un número positivo','error');
            if(isNaN(hv)||hv<0) return shared.ctx.toast('Las horas virtuales no pueden ser negativas','error');
            if(ht%18!==0) return shared.ctx.toast(`Las horas totales (${ht}) deben ser múltiplo de 18`,'error');
            if(hv%18!==0) return shared.ctx.toast(`Las horas virtuales (${hv}) deben ser múltiplo de 18`,'error');
            if(hv>ht) return shared.ctx.toast('Las horas virtuales no pueden superar las horas totales','error');
            const duplicado=data.asignaturas.find(a=>a.codigo.toLowerCase()===cod.toLowerCase()&&a.id!==id);
            if(duplicado) return shared.ctx.toast(`Ya existe una asignatura con el código "${cod}"`,'error');
            const cols=shared.ctx.getColores();
            const existente=id?data.asignaturas.find(a=>a.id===id):null;
            const asig={...(existente||{}),id:id||shared.ctx.genId(),codigo:cod,nombre:nom,horasTotales:ht,horasVirtuales:hv,horasPresenciales:ht-hv,bloquesPresenciales:(ht-hv)/18,bloquesVirtuales:hv/18,salasPreferidas:shared.asignaturaTemp.salas.slice(),color:shared.ctx.colorAsignaturaPlanhor?.({codigo:cod,nombre:nom,id})||existente?.color||cols[Math.floor(Math.random()*cols.length)],
                softwares:shared.normalizarListaSoftwares(document.getElementById('softwaresAsig')?.value||''),
                area:document.getElementById('asigArea').value,
                modalidad:document.getElementById('asigModalidad').value,
                condicion:document.getElementById('asigCondicion').value,
                distribucion:document.getElementById('asigDistribucion').value,
                controlHorario:document.getElementById('asigControlHorario').value,
                preferenciaHoraria:document.getElementById('asigPreferenciaHoraria').value
            };
            delete asig.grupoElectivo;
            delete asig.destinosElectivaIds;
            if(id){const idx=data.asignaturas.findIndex(a=>a.id===id); if(idx>=0) data.asignaturas[idx]=asig;} else data.asignaturas.push(asig);
            if(asig.area!=='electiva'){
                data.vinculosElectivos=(data.vinculosElectivos||[]).filter(v=>v.asignaturaId!==asig.id);
            }
            data.asignaturaCarreraNivel=data.asignaturaCarreraNivel.filter(r=>r.asignaturaId!==asig.id);
            shared.asignaturaTemp.relaciones.forEach(rel=>data.asignaturaCarreraNivel.push({asignaturaId:asig.id,carreraId:rel.carreraId,nivelId:rel.nivelId}));
            shared.ctx.guardar(); shared.ctx.cerrarModal(); shared.ctx.refrescarTodo(); shared.ctx.toast('Asignatura guardada','success');
        }

function valorOrdenNivel(nombre){
            const m=String(nombre||'').match(/\d+/);
            return m?parseInt(m[0],10):999;
        }

function renderChipAsignatura(a, metaExtra=''){
            const partes=[];
            if(a.horasPresenciales>0) partes.push(`${a.horasPresenciales}hP`);
            if(a.horasVirtuales>0) partes.push(`${a.horasVirtuales}hV`);
            const etiquetas=[shared.LABEL_CRITERIOS_ASIGNATURA.area[shared.criterioAsignatura(a,'area','especialidad')],shared.LABEL_CRITERIOS_ASIGNATURA.modalidad[shared.criterioAsignatura(a,'modalidad','lectiva')]].filter(Boolean).join(' · ');
            const alerta=a.alertasImportacion?.length?` · ${a.alertasImportacion.length} alerta(s)`:'';
            const soft=(a.softwares||[]).length?` · ${(a.softwares||[]).length} software(s)`:'';
            const vinculos=a.area==='electiva'?(shared.getData().vinculosElectivos||[]).filter(v=>v.asignaturaId===a.id):[];
            const destinos=vinculos.length?` · ${vinculos.length} vínculo(s) electivo(s)`:'';
            return `<span class="item-chip subject-chip" style="background:${shared.ctx.colorAsignaturaPlanhor?.(a)||shared.ctx.colorSeguro(a.color,'var(--planhor-subject-neutral)')}">
                <span class="subject-chip-main">${shared.ctx.escapeHTML(a.codigo)} - ${shared.ctx.escapeHTML(a.nombre)} (${Number(a.horasTotales)||0}h: ${shared.ctx.escapeHTML(partes.join(' + '))})</span>
                <small class="subject-criteria-chip">${shared.ctx.escapeHTML(etiquetas)}${metaExtra?` · ${shared.ctx.escapeHTML(metaExtra)}`:''}${shared.ctx.escapeHTML(destinos)}${shared.ctx.escapeHTML(soft)}${shared.ctx.escapeHTML(alerta)}</small>
                <button class="btn btn-xs btn-editar-asignatura" data-id="${shared.ctx.escapeAttr(a.id)}">✎</button>
                <button class="btn btn-xs btn-eliminar-asignatura" data-id="${shared.ctx.escapeAttr(a.id)}">🗑️</button>
            </span>`;
        }

function renderPanelAlertasAsignaturas(){
            const data=shared.getData();
            const items=data.asignaturas.filter(a=>Array.isArray(a.alertasImportacion)&&a.alertasImportacion.length);
            if(!items.length) return '';
            return `<div class="import-alert-panel">
                <div class="import-alert-header"><div><strong>Alertas de importación</strong><span>${items.length} asignatura(s) requieren revisión</span></div></div>
                <div class="import-alert-list">
                    ${items.map(a=>`
                        <div class="import-alert-item">
                            <div>
                                <strong>${shared.ctx.escapeHTML(a.codigo)} - ${shared.ctx.escapeHTML(a.nombre)}</strong>
                                <span>${shared.ctx.escapeHTML(a.alertasImportacion.join(' · '))}</span>
                            </div>
                            <button class="btn btn-xs btn-editar-asignatura" data-id="${shared.ctx.escapeAttr(a.id)}">Revisar</button>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

function renderAsignaturas(){
            const data = shared.getData();
            const cont=document.getElementById('listaAsignaturas');
            if(!cont) return;
            if(!data.asignaturas.length){
                cont.innerHTML='<p class="jornada-empty">Aún no hay asignaturas registradas.</p>';
                return;
            }
            const carreraPorId=new Map(data.carreras.map(c=>[c.id,c]));
            const nivelPorId=new Map(data.niveles.map(n=>[n.id,n]));
            const grupos=new Map();
            const asegurarGrupo=(key,nombre)=>{
                if(!grupos.has(key)) grupos.set(key,{carrera:{nombre},niveles:new Map(),total:0});
                return grupos.get(key);
            };
            const agregarAsignaturaGrupo=(grupo,nivelKey,nivel,a,metaExtra='')=>{
                if(!grupo.niveles.has(nivelKey)) grupo.niveles.set(nivelKey,{nivel,asignaturas:new Map()});
                grupo.niveles.get(nivelKey).asignaturas.set(a.id,{a,metaExtra});
                grupo.total++;
            };
            const asignaturasConRelacion=new Set();
            (data.asignaturaCarreraNivel||[]).forEach(rel=>{
                const a=data.asignaturas.find(x=>x.id===rel.asignaturaId);
                const c=carreraPorId.get(rel.carreraId);
                const n=nivelPorId.get(rel.nivelId);
                if(!a||!c||!n) return;
                asignaturasConRelacion.add(a.id);
                if(shared.criterioAsignatura(a,'area','especialidad')==='electiva'){
                    const grupo=asegurarGrupo('__electivas__','Electivas');
                    agregarAsignaturaGrupo(grupo,n.id,n,a,c.nombre);
                    return;
                }
                const carreraKey=c.id;
                if(!grupos.has(carreraKey)) grupos.set(carreraKey,{carrera:c,niveles:new Map(),total:0});
                const grupo=grupos.get(carreraKey);
                const nivelKey=n.id;
                agregarAsignaturaGrupo(grupo,nivelKey,n,a);
            });
            data.asignaturas.filter(a=>!asignaturasConRelacion.has(a.id)).forEach(a=>{
                if(shared.criterioAsignatura(a,'area','especialidad')==='electiva'){
                    const grupo=asegurarGrupo('__electivas__','Electivas');
                    agregarAsignaturaGrupo(grupo,'__electiva_pendiente__',{nombre:'Pendientes de asociar'},a,'Sin destino');
                    return;
                }
                const grupo=asegurarGrupo('__sin_relacion__','Sin especialidad o nivel asociado');
                agregarAsignaturaGrupo(grupo,'__sin_nivel__',{nombre:'Sin nivel'},a);
            });
            const gruposOrdenados=Array.from(grupos.values()).sort((a,b)=>{
                if(a.carrera.nombre==='Electivas') return -1;
                if(b.carrera.nombre==='Electivas') return 1;
                if(a.carrera.nombre==='Sin especialidad o nivel asociado') return 1;
                if(b.carrera.nombre==='Sin especialidad o nivel asociado') return -1;
                return String(a.carrera.nombre||'').localeCompare(String(b.carrera.nombre||''),'es',{numeric:true});
            });
            const contenido=gruposOrdenados.map(grupo=>{
                const niveles=Array.from(grupo.niveles.values()).sort((a,b)=>shared.valorOrdenNivel(a.nivel.nombre)-shared.valorOrdenNivel(b.nivel.nombre)||String(a.nivel.nombre||'').localeCompare(String(b.nivel.nombre||''),'es',{numeric:true}));
                const totalUnico=new Set(niveles.flatMap(n=>Array.from(n.asignaturas.keys()))).size;
                return `<div class="subject-specialty-group">
                    <div class="subject-specialty-title">
                        <span>${shared.ctx.escapeHTML(grupo.carrera.nombre||'Sin especialidad')}</span>
                        <span>${totalUnico} asignatura(s)</span>
                    </div>
                    <div class="subject-level-list">
                        ${niveles.map(nivel=>{
                            const asignaturas=Array.from(nivel.asignaturas.values()).sort((a,b)=>String(a.a.codigo||'').localeCompare(String(b.a.codigo||''),'es',{numeric:true})||String(a.a.nombre||'').localeCompare(String(b.a.nombre||''),'es',{numeric:true}));
                            return `<div class="subject-level-group">
                                <div class="subject-level-title"><span>${shared.ctx.escapeHTML(nivel.nivel.nombre||'Sin nivel')}</span><span>${asignaturas.length}</span></div>
                                <div class="subject-chip-list">${asignaturas.map(item=>shared.renderChipAsignatura(item.a,item.metaExtra)).join('')}</div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
            }).join('');
            cont.innerHTML=shared.renderPanelAlertasAsignaturas()+contenido;
        }
        return {abrirModalAsignatura, actualizarChipsCarrerasNivel, getOpcionesCarrerasNivel, elegirCarreraNivel, mostrarOpcionesCarrerasNivel, filtrarCarrerasNivel, limpiarBusquedaAsignatura, actualizarChipsSalasAsig, elegirSalaAsignatura, getOpcionesSalasAsignatura, renderOpcionesSalasAsignatura, mostrarOpcionesSalasAsig, filtrarSalasAsig, limpiarBusquedaSalaAsig, filasAyudaAsignaturas, crearPlantillaImportacionAsignaturas, exportarArchivoAsignaturas, abrirImportacionAsignaturas, leerArchivoAsignaturas, valorFilaPorMapa, normalizarCriterioAsignatura, normalizarNombreAsignatura, parseListaTexto, normalizarListaSoftwares, resolverRelacionCarreraNivelSeparada, resolverRelacionesDesdeColumnas, separarNumeroNombreSala, clavesBusquedaSala, importarAsignaturasDesdeFilas, mostrarResultadoImportacionAsignaturas, guardarAsignatura, valorOrdenNivel, renderChipAsignatura, renderPanelAlertasAsignaturas, renderAsignaturas};
    }};
})();
