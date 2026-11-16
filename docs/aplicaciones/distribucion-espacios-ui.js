/* Vista previa independiente. No guarda ni modifica planificación. */
(function(){
 'use strict';
 const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const normal=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const valor=n=>n===null||n===undefined?'—':String(n);
 const totalAlertas=r=>(r.alertas||[]).length+(r.asignaturas||[]).reduce((n,a)=>n+(a.alertas||[]).length,0);
 const textoAlerta=a=>{
  const fila=a.fila?`Fila ${a.fila}: `:'';
  if(a.tipo==='horas_no_cuadran')return `Horas totales: ${valor(a.esperadas)}; distribuidas: ${valor(a.distribuidas)}; diferencia: ${valor(a.diferencia)}.`;
  if(a.tipo==='subtotal_no_coincide')return `${fila}total por espacio declarado ${valor(a.declarado)} y calculado ${valor(a.calculado)}.`;
  return fila+(a.detalle||'Revisa este dato.');
 };
 function create({container,asegurarXLSX,getData,guardar,pushUndo,irPlanificador,irOptimizador}={}){
  if(!container)throw new Error('Falta el contenedor de distribución de espacios.');
  let resultado=null,archivo='',filtro='',plan='',semana=1,seleccion=null,pagina=1,preview=false,temporadaActual='',hojaActual='',huellaActual='';
  container.innerHTML=`<section class="gestor-card distribucion-espacios" aria-label="Distribución semanal de espacios">
   <div class="distribucion-encabezado"><div><strong>Distribución semanal de espacios</strong><p>Consulta recomendaciones y revisa su relación con salas y secciones.</p></div><div><button type="button" class="btn" data-dist-accion="plantilla">Crear archivo de importación</button><button type="button" class="btn" data-dist-accion="archivo">Importar archivo</button><button type="button" class="btn" data-dist-accion="copiar">Copiar desde temporada</button><button type="button" class="btn" data-dist-accion="exportar-archivo">Exportar archivo</button><button type="button" class="btn" data-dist-accion="exportar">Exportar observaciones</button><button type="button" class="btn" data-dist-accion="ejemplo">Ver ejemplo ficticio</button></div><input type="file" data-dist-archivo accept=".xlsx,.xls,.csv" hidden><input type="file" data-dist-original accept=".xlsx" hidden></div>
   <div data-dist-cuerpo><p class="distribucion-vacio">Selecciona un archivo para revisarlo. La vista previa no guarda cambios.</p></div>
   <div data-dist-estado role="status" aria-live="polite"></div>
  </section>`;
  const q=s=>container.querySelector(s),cuerpo=()=>q('[data-dist-cuerpo]'),estado=()=>q('[data-dist-estado]');
  if(!window._pruebaAislada)q('[data-dist-accion="ejemplo"]')?.remove();
  const mostrarEstado=(mensaje,error=false)=>{const el=estado();el.textContent=mensaje;el.classList.toggle('distribucion-error',error);};
  const data=()=>getData?.()||{};
  const almacen=()=>window.PlanhorDistribucionEspacios.obtenerDistribucion(data());
  function cargarGuardados(){
   const saved=almacen();temporadaActual=String(data().sel?.temporadaId||'');preview=false;seleccion=null;pagina=1;
   if(!saved?.filas?.length){resultado=null;archivo='';return;}
   const grupos=new Map();for(const f of saved.filas){const k=JSON.stringify([f.plan,f.semestre,f.codigo]);if(!grupos.has(k))grupos.set(k,{plan:f.plan,semestre:f.semestre,codigo:f.codigo,asignatura:f.asignatura,area:f.area,espacios:[],alertas:[]});grupos.get(k).espacios.push({...f,totalCalculado:f.semanas?.every(Number.isFinite)?f.semanas.reduce((a,b)=>a+b,0):null});}
   resultado={ok:true,filasLeidas:saved.filas.length,asignaturas:[...grupos.values()],alertas:[]};archivo=saved.archivo||'Distribución guardada';hojaActual=saved.hoja||'';huellaActual=saved.huellaArchivo||'';
  }
  async function persistir(mensaje){try{const ok=await guardar?.();mostrarEstado(ok===false?'No se pudo confirmar el guardado; revisa el estado de sincronización.':mensaje,ok===false);return ok!==false;}catch(e){mostrarEstado('No se pudo confirmar el guardado. Revisa el estado de sincronización.',true);return false;}}
  const nombres={sin_relacion:'Espacio sin sala relacionada',sin_planificacion:'Sin planificación',sala_pendiente:'Sala pendiente',sala_distinta:'Sala distinta a la recomendada',revision_parcial:'Revisión parcial',coincide:'Salas compatibles',sin_datos:'Requiere identificar sección',sin_recomendacion:'Sin recomendación en S1'};
  const claveGrupo=a=>[a.plan,a.semestre,a.codigo].map(normal).join('|');
  function detalle(a){
   const avisos=a.alertas||[];
   const filaEspacio=e=>`<tr><th scope="row">${html(e.ubicacion)}</th><td>${html(valor(e.horasSemanales))}</td><td>${html(valor(e.maxDiarias))}</td>${e.semanas.map((v,i)=>`<td${i+1===semana?' class="distribucion-semana-actual"':''}>${html(valor(v))}</td>`).join('')}<td>${html(valor(e.totalCalculado))}</td></tr>`;
   const relacion=preview?'':`<h4>Relacionar espacios con salas</h4><p>La relación es informativa y no asigna ni reserva salas.</p>${a.espacios.map(e=>`<details><summary>${html(e.ubicacion)} · ${(e.salaIds||[]).length} sala(s) relacionada(s)</summary><div class="distribucion-salas">${(data().salas||[]).filter(s=>!s.esVirtual&&!['__virtual__','__tro2__'].includes(String(s.id))).map(s=>`<div><label><input type="checkbox" data-dist-vinculo="${html(e.id)}" value="${html(s.id)}" ${(e.salaIds||[]).map(String).includes(String(s.id))?'checked':''}> ${html(s.nombre)}${s.nombreDescriptivo?' · '+html(s.nombreDescriptivo):''}</label> ${(e.salaIds||[]).map(String).includes(String(s.id))&&s.nombreDescriptivo?`<button type="button" class="btn" data-dist-renombrar="${html(e.id)}" data-sala="${html(s.id)}">Cambiar nombre descriptivo</button>`:''}</div>`).join('')||'No hay salas disponibles.'}</div></details>`).join('')}`;
   const seguimiento=preview?[]:(window.PlanhorDistribucionEspacios.obtenerSeguimiento(data()).filter(x=>claveGrupo(x)===claveGrupo(a)));
   const secciones=seguimiento.length?`<h4>Seguimiento por sección · referencia S1</h4><p>El estado compara las salas asignadas con las relacionadas; no verifica cantidades de horas ni la ejecución real de semanas posteriores.</p>${seguimiento.map(s=>`<div class="distribucion-seccion"><strong>${html(s.seccionNombre||'Sección no identificada')}</strong> · ${html(nombres[s.estado]||s.estado)}${s.motivo?` · ${html(s.motivo)}`:''}<br><small>Recomendado: ${html((s.espaciosRecomendados||[]).join(', ')||'—')} · Salas asignadas: ${html((s.salasAsignadas||[]).join(', ')||'—')}</small>${s.seccionId?`<div><button type="button" class="btn" data-dist-plan-seccion="${html(s.seccionId)}" data-asignatura="${html(s.asignaturaId)}">Abrir Planificador</button> <button type="button" class="btn" data-dist-accion="optimizador">Abrir Optimizador</button></div>${a.espacios.map(e=>{const o=(s.observaciones||[]).find(x=>String(x.filaId)===String(e.id));return `<label>Observación · ${html(e.ubicacion)}<textarea class="form-input" maxlength="500" data-dist-nota-fila="${html(e.id)}" data-dist-nota-seccion="${html(s.seccionId)}" placeholder="Explica aquí si no fue posible seguir la recomendación">${html(o?.texto||'')}</textarea></label>`;}).join('')}`:''}</div>`).join('')}`:'';
   return `<section class="distribucion-detalle"><div class="distribucion-detalle-cabecera"><div><strong>${html(a.codigo)} · ${html(a.asignatura||'Sin nombre')}</strong><small>${html(a.plan)} · semestre ${html(a.semestre)}</small></div><button type="button" class="btn" data-dist-accion="cerrar">Cerrar detalle</button></div>
    <p>Recomendación de espacios por semana. La planificación y sus horas se consultan en el Planificador.</p>
    ${avisos.length?`<div class="distribucion-alerta"><strong>${avisos.length} observación(es)</strong><ul>${avisos.map(a=>`<li>${html(textoAlerta(a))}</li>`).join('')}</ul></div>`:''}
    <div class="distribucion-tabla-wrap"><table><thead><tr><th>Espacio</th><th>HH/sem.</th><th>Máx. diarias</th>${Array.from({length:18},(_,i)=>`<th${i+1===semana?' class="distribucion-semana-actual"':''}>S${i+1}</th>`).join('')}<th>Total HH por espacio</th></tr></thead><tbody>${a.espacios.map(filaEspacio).join('')}</tbody></table></div>
    <small>0: no utiliza ese espacio, incluso cuando la celda de la semana está vacía. —: dato inválido. El total por espacio corresponde a S19 en el archivo original.</small>${relacion}${secciones}</section>`;
  }
  function render(){
   const el=cuerpo();
   if(String(data().sel?.temporadaId||'')!==temporadaActual)cargarGuardados();
   if(!resultado){el.innerHTML='<p class="distribucion-vacio">Importa un archivo para revisar las recomendaciones de esta temporada.</p>';return;}
   if(!resultado.ok){el.innerHTML=`<p class="distribucion-alerta">${html(resultado.alertas?.[0]?.detalle||'No fue posible interpretar el archivo.')}</p>`;return;}
   const planes=[...new Set(resultado.asignaturas.map(a=>a.plan))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
   const filtradas=resultado.asignaturas.map((a,i)=>({a,i})).filter(({a})=>(!plan||a.plan===plan)&&normal([a.plan,a.semestre,a.codigo,a.asignatura].join(' ')).includes(normal(filtro)));
   const paginas=Math.max(1,Math.ceil(filtradas.length/20));pagina=Math.min(pagina,paginas);
   const lista=filtradas.slice((pagina-1)*20,pagina*20).map(({a,i})=>{
    const espacios=a.espacios.filter(e=>Number(e.semanas[semana-1])>0);
    const faltantes=a.espacios.some(e=>e.semanas[semana-1]===null);
    const resumen=espacios.length?espacios.map(e=>`${e.ubicacion} (${valor(e.semanas[semana-1])} HH)`).join(' · ')+(faltantes?' · Hay datos faltantes':''):(faltantes?'Sin datos completos':'Sin horas en esta semana');
    return `<button type="button" class="distribucion-fila" data-dist-indice="${i}"><span><strong>${html(a.codigo)} · ${html(a.asignatura||'Sin nombre')}</strong><small>${html(a.plan)} · semestre ${html(a.semestre)}</small></span><span>${html(resumen)}</span><span>${a.alertas.length?`${a.alertas.length} observación(es)`:'Ver semanas'}</span></button>`;
   }).join('');
   const item=seleccion===null?null:resultado.asignaturas[seleccion];
   el.innerHTML=`<p class="distribucion-resumen"><strong>${html(archivo)}</strong> · ${resultado.filasLeidas} filas · ${resultado.asignaturas.length} asignaturas por plan y semestre · ${totalAlertas(resultado)} observaciones del archivo</p><p class="distribucion-nota">${preview?'Vista previa sin guardar.':'Recomendaciones de la temporada activa.'} S1 es la referencia para la semana ideal.</p>${preview?'<button type="button" class="btn btn-primary" data-dist-accion="guardar-importacion">Guardar recomendaciones</button> <button type="button" class="btn" data-dist-accion="cancelar-importacion">Cancelar</button>':''}
    ${resultado.alertas?.length?`<details class="distribucion-alerta"><summary>${resultado.alertas.length} observación(es) generales</summary><ul>${resultado.alertas.map(a=>`<li>${html(textoAlerta(a))}</li>`).join('')}</ul></details>`:''}
    <div class="distribucion-filtros"><label>Plan<select class="form-select" data-dist-plan><option value="">Todos los planes</option>${planes.map(p=>`<option value="${html(p)}"${p===plan?' selected':''}>${html(p)}</option>`).join('')}</select></label><label>Semana<select class="form-select" data-dist-semana>${Array.from({length:18},(_,i)=>`<option value="${i+1}"${i+1===semana?' selected':''}>S${i+1}${i===0?' · referencia':''}</option>`).join('')}</select></label><label>Buscar asignatura<input type="search" class="form-input" data-dist-busqueda value="${html(filtro)}" placeholder="Código, nombre o plan"></label></div>
    <p class="distribucion-conteo">${filtradas.length} asignatura(s) · Página ${pagina} de ${paginas}</p><div class="distribucion-lista">${lista||'<p>No hay coincidencias.</p>'}</div><div class="distribucion-paginacion"><button type="button" class="btn" data-dist-accion="anterior" ${pagina===1?'disabled':''}>Anterior</button><button type="button" class="btn" data-dist-accion="siguiente" ${pagina===paginas?'disabled':''}>Siguiente</button></div>${item?detalle(item):''}`;
  }
  function cargarFilas(filas,nombre='Archivo'){
   const parser=window.PlanhorDistribucionEspacios;
   if(!parser?.analizar)throw new Error('El analizador de distribución no está disponible.');
   resultado=parser.analizar(filas);archivo=String(nombre||'Archivo');filtro='';plan='';semana=1;seleccion=null;pagina=1;preview=true;hojaActual='';huellaActual='';render();
   mostrarEstado(resultado.ok?'Vista previa cargada. Aún no se ha guardado información.':'Revisa el formato del archivo.',!resultado.ok);
   return resultado;
  }
  async function importar(file){
   if(!file)return;
   const temporadaInicio=String(data().sel?.temporadaId||'');
   try{
    mostrarEstado('Leyendo archivo...');
    const bytes=await file.arrayBuffer();
    let elegido=null,fallo=null;
    if(window.PlanhorDistribucionExcel?.leerFilas&&/\.xlsx$/i.test(file.name)){
     const resultadoLibro=await window.PlanhorDistribucionExcel.leerFilas({archivo:file});
     for(const hoja of resultadoLibro.hojas){const datos=hoja===resultadoLibro.hoja?resultadoLibro:await window.PlanhorDistribucionExcel.leerFilas({archivo:file,hoja});const analisis=window.PlanhorDistribucionEspacios.analizar(datos.filas);if(analisis.ok){elegido={analisis,hoja};break;}fallo=analisis;}
    }else{
     if(!window.XLSX?.read&&(!asegurarXLSX||!(await asegurarXLSX())))throw new Error('No se pudo cargar la herramienta para leer Excel.');
     const libro=window.XLSX.read(bytes,{type:'array'});for(const hoja of libro.SheetNames){const filas=window.XLSX.utils.sheet_to_json(libro.Sheets[hoja],{header:1,defval:null,raw:true});const analisis=window.PlanhorDistribucionEspacios.analizar(filas);if(analisis.ok){elegido={analisis,hoja};break;}fallo=analisis;}
    }
    const huella=window.crypto?.subtle?Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join(''):'';
    if(String(data().sel?.temporadaId||'')!==temporadaInicio)throw new Error('La temporada cambió durante la lectura; vuelve a seleccionar el archivo.');
    if(!huella)throw new Error('Este navegador no permite verificar el archivo. No se guardó la importación.');
    resultado=elegido?.analisis||fallo||{ok:false,alertas:[{detalle:'El archivo no contiene hojas.'}]};archivo=file.name;hojaActual=elegido?.hoja||'';huellaActual=huella;filtro='';plan='';semana=1;seleccion=null;pagina=1;preview=true;render();
    mostrarEstado(resultado.ok?`Vista previa de «${elegido.hoja}». Aún no se ha guardado información.`:'No se encontró una hoja con el formato esperado.',!resultado.ok);
   }catch(err){console.error('Distribución de espacios',err);mostrarEstado(err?.message||'No se pudo leer el archivo.',true);}
  }
  const alClick=async e=>{
   const action=e.target.closest('[data-dist-accion]');
   if(action?.dataset.distAccion==='ejemplo'){
    const header=['Plan Código','Semestre','Código de Asignatura','Asignatura','HH Totales','Ubicación','HH x Semana','Max HH Diarias',...Array.from({length:19},(_,i)=>`HH S${i+1}`)];
    const primero=Array.from({length:18},(_,i)=>i<9?4:0),segundo=primero.map(v=>v?0:4);
    cargarFilas([header,['TST-TST-1','1','TST101','Asignatura de prueba',72,'Laboratorio A',4,4,...primero,36],['TST-TST-1','1','TST101','Asignatura de prueba',72,'Laboratorio B',4,4,...segundo,36]],'Ejemplo ficticio');return;
   }
   if(action?.dataset.distAccion==='archivo'){const input=q('[data-dist-archivo]');input.value='';input.click();return;}
   if(action?.dataset.distAccion==='exportar-archivo'){
    const filas=almacen()?.filas;if(!filas?.length){mostrarEstado('Primero guarda una distribución.',true);return;}
    if(filas.some(f=>f.horasTotales===null||f.horasTotales===undefined)){mostrarEstado('Faltan las horas totales del archivo original. Reimpórtalo para poder exportar una plantilla completa.',true);return;}
    try{const blob=window.PlanhorDistribucionExcel.crearPlantilla(filas),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Distribucion_Espacios.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);mostrarEstado('Archivo de recomendaciones descargado.');}catch(err){mostrarEstado(err?.message||'No se pudo exportar el archivo.',true);}return;
   }
   if(action?.dataset.distAccion==='plantilla'){
    if(window.PlanhorDistribucionExcel?.crearPlantilla){try{const blob=await window.PlanhorDistribucionExcel.crearPlantilla(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Plantilla_Distribucion_Espacios.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);mostrarEstado('Plantilla descargada.');}catch(err){mostrarEstado(err?.message||'No se pudo generar la plantilla.',true);}return;}
    if(!window.XLSX?.utils?.book_new&&(!asegurarXLSX||!(await asegurarXLSX()))){mostrarEstado('No se pudo cargar Excel para crear la plantilla.',true);return;}
    const headers=['Área','Plan Código','Semestre','Código de Asignatura','Asignatura','HH Totales','Ubicación','HH x Semana','Max HH Diarias',...Array.from({length:19},(_,i)=>`HH S${i+1}`)];
    const libro=window.XLSX.utils.book_new();window.XLSX.utils.book_append_sheet(libro,window.XLSX.utils.aoa_to_sheet([headers]),'Distribución');window.XLSX.writeFile(libro,'Plantilla_Distribucion_Espacios.xlsx');return;
   }
   if(action?.dataset.distAccion==='exportar'){if(!almacen()?.filas?.length){mostrarEstado('Primero guarda una distribución.',true);return;}const input=q('[data-dist-original]');input.value='';input.click();return;}
   if(action?.dataset.distAccion==='copiar'){
    const opciones=(data().temporadas||[]).filter(t=>String(t.id)!==String(data().sel?.temporadaId)&&window.PlanhorDistribucionEspacios.obtenerDistribucion(data(),t.id)?.filas?.length);
    if(!opciones.length){mostrarEstado('No hay otras temporadas con recomendaciones guardadas.',true);return;}
    const elegir=prompt('Escribe el número de la temporada que quieres copiar:\n'+opciones.map((t,i)=>`${i+1}. ${t.temporada} ${t.anio}`).join('\n'));if(elegir===null)return;
    const origen=opciones[Number(elegir)-1];if(!origen){mostrarEstado('Selecciona una temporada válida.',true);return;}
    if(almacen()?.filas?.length){mostrarEstado('Ya existe una distribución en esta temporada; no se reemplazó.',true);return;}
    const temporadaOrigen=data().temporadaData[origen.id],copia=JSON.parse(JSON.stringify(window.PlanhorDistribucionEspacios.obtenerDistribucion(data(),origen.id)));copia.observaciones=[];
    for(const f of copia.filas)f.salaIds=(f.salaIds||[]).filter(id=>{const antes=(temporadaOrigen?.salas||[]).find(s=>String(s.id)===String(id)),ahora=(data().salas||[]).find(s=>String(s.id)===String(id));return antes&&ahora&&String(antes.nombre||'')===String(ahora.nombre||'');});
    pushUndo?.({tipo:'distribución',resumen:'Copiar recomendaciones de espacios'});
    window.PlanhorDistribucionEspacios.establecerDistribucion(data(),copia);await persistir('Recomendaciones copiadas; revisa las salas relacionadas.');cargarGuardados();render();return;
   }
   if(action?.dataset.distAccion==='cancelar-importacion'){cargarGuardados();render();return;}
   if(action?.dataset.distAccion==='guardar-importacion'){
    if(!resultado?.ok)return;
    if(resultado.asignaturas.some(a=>a.alertas.some(x=>['semana_invalida','recomendacion_invalida','horas_totales_invalidas','horas_totales_inconsistentes'].includes(x.tipo)))){mostrarEstado('Hay valores inválidos o inconsistentes en el archivo. Corrígelos antes de guardar.',true);return;}
    if(!huellaActual&&archivo!=='Ejemplo ficticio'){mostrarEstado('No se puede verificar el archivo. Vuelve a importarlo.',true);return;}
    const filas=resultado.asignaturas.flatMap(a=>a.espacios.map(x=>({id:`${huellaActual||'ejemplo'}:${x.fila}`,fila:x.fila,plan:a.plan,semestre:a.semestre,codigo:a.codigo,asignatura:a.asignatura,area:a.area,horasTotales:a.horasTotales,ubicacion:x.ubicacion,semanas:x.semanas,horasSemanales:x.horasSemanales,maxDiarias:x.maxDiarias,totalDeclarado:x.totalDeclarado,salaIds:[]})));
    if(filas.length>5000||filas.some(f=>[f.plan,f.semestre,f.codigo,f.asignatura,f.area,f.ubicacion].some(v=>String(v||'').length>500))){mostrarEstado('El archivo supera los límites de conservación segura (5.000 filas o 500 caracteres por campo).',true);return;}
    if(resultado.alertas?.some(a=>a.tipo==='fila_incompleta')){mostrarEstado('Hay filas incompletas. Corrige el archivo antes de guardar para evitar omitir información.',true);return;}
    const previo=almacen();
    let notas=previo?.observaciones||[];
    if(previo?.filas?.length){
     const clave=f=>JSON.stringify([f.plan,f.semestre,f.codigo,f.ubicacion].map(normal));
     const anteriores=new Map(),nuevas=new Map();for(const f of previo.filas){const k=clave(f);if(anteriores.has(k)){mostrarEstado('Hay ubicaciones repetidas que requieren revisión antes de actualizar.',true);return;}anteriores.set(k,f);}for(const f of filas){const k=clave(f);if(nuevas.has(k)){mostrarEstado('El archivo contiene ubicaciones repetidas que requieren revisión antes de actualizar.',true);return;}nuevas.set(k,f);}
     if([...anteriores.keys()].some(k=>!nuevas.has(k))){mostrarEstado('El archivo omite espacios guardados. No se actualizó para no perder relaciones ni observaciones.',true);return;}
     if(!confirm('¿Actualizar las recomendaciones existentes y agregar las nuevas? Se conservarán sus relaciones y observaciones.'))return;
     const ids=new Map();for(const f of filas){const antes=anteriores.get(clave(f));if(antes){f.salaIds=[...(antes.salaIds||[])];ids.set(String(antes.id),f.id);}}
     notas=notas.map(o=>({...o,id:`${ids.get(String(o.filaId))||o.filaId}:${o.seccionId}`,filaId:ids.get(String(o.filaId))||o.filaId}));
    }
    if(!data().gestorSecciones){mostrarEstado('No se pudo acceder a la temporada actual. Recarga la aplicación.',true);return;}
    pushUndo?.({tipo:'distribución',resumen:'Actualizar recomendaciones de espacios'});
    window.PlanhorDistribucionEspacios.establecerDistribucion(data(),{version:1,archivo,hoja:hojaActual,huellaArchivo:huellaActual,filas,observaciones:notas});
    await persistir('Recomendaciones guardadas.');cargarGuardados();render();return;
   }
   if(action?.dataset.distAccion==='optimizador'){irOptimizador?.();return;}
   const cambiarNombre=e.target.closest('[data-dist-renombrar]');if(cambiarNombre){const f=almacen()?.filas?.find(x=>String(x.id)===cambiarNombre.dataset.distRenombrar),s=(data().salas||[]).find(x=>String(x.id)===cambiarNombre.dataset.sala);if(f&&s&&String(f.ubicacion).length>250){mostrarEstado('El nombre propuesto supera 250 caracteres; edítalo en Salas.',true);return;}if(f&&s&&confirm(`¿Reemplazar el nombre descriptivo de ${s.nombre}?\nActual: ${s.nombreDescriptivo}\nNuevo: ${f.ubicacion}\nEl identificador y otros datos no cambian.`)){pushUndo?.({tipo:'sala',resumen:'Cambiar nombre descriptivo'});s.nombreDescriptivo=String(f.ubicacion);await persistir('Nombre descriptivo actualizado.');const idx=seleccion;cargarGuardados();seleccion=idx;render();}return;}
   const ir=e.target.closest('[data-dist-plan-seccion]');if(ir){irPlanificador?.(ir.dataset.distPlanSeccion,{asignaturaId:ir.dataset.asignatura});return;}
   if(action?.dataset.distAccion==='anterior'){pagina=Math.max(1,pagina-1);seleccion=null;render();return;}
   if(action?.dataset.distAccion==='siguiente'){pagina++;seleccion=null;render();return;}
   if(action?.dataset.distAccion==='cerrar'){seleccion=null;render();return;}
   const item=e.target.closest('[data-dist-indice]');if(item){seleccion=Number(item.dataset.distIndice);render();q('.distribucion-detalle')?.scrollIntoView({block:'nearest'});}
  };
  const alChange=async e=>{
   if(e.target.matches('[data-dist-archivo]')){void importar(e.target.files?.[0]);return;}
   if(e.target.matches('[data-dist-original]')){
    const file=e.target.files?.[0],store=almacen(),temporadaInicio=String(data().sel?.temporadaId||'');if(!file||!store)return;
    try{if(!window.PlanhorDistribucionExcel?.exportar)throw new Error('La exportación de observaciones no está disponible.');if(!store.huellaArchivo||!crypto?.subtle)throw new Error('No se puede verificar el archivo original de esta distribución.');
     const bytes=await file.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');if(hash!==store.huellaArchivo)throw new Error('El archivo seleccionado no coincide con el original importado.');
     if(String(data().sel?.temporadaId||'')!==temporadaInicio||almacen()!==store)throw new Error('La temporada cambió durante la exportación. Vuelve a intentarlo.');
     const notas=store.observaciones.map(o=>({fila:store.filas.find(f=>String(f.id)===String(o.filaId))?.fila,seccion:(data().secciones||[]).find(s=>String(s.id)===String(o.seccionId))?.nombre,texto:o.texto}));if(notas.some(o=>!o.fila||!o.seccion))throw new Error('Hay observaciones con sección o fila no identificada; revísalas antes de exportar.');
     const blob=await window.PlanhorDistribucionExcel.exportar({archivo:file,hoja:store.hoja,observaciones:notas});if(String(data().sel?.temporadaId||'')!==temporadaInicio||almacen()!==store)throw new Error('La temporada cambió durante la exportación. Vuelve a intentarlo.');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=file.name.replace(/\.xlsx$/i,'')+'_observaciones.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);mostrarEstado('Archivo con observaciones descargado.');
    }catch(err){mostrarEstado(err?.message||'No se pudo exportar el archivo.',true);}return;
   }
   if(e.target.matches('[data-dist-plan]')){plan=e.target.value;seleccion=null;pagina=1;render();return;}
   if(e.target.matches('[data-dist-semana]')){semana=Number(e.target.value)||1;render();}
   if(e.target.matches('[data-dist-vinculo]')){
    const f=almacen()?.filas?.find(x=>String(x.id)===e.target.dataset.distVinculo),s=(data().salas||[]).find(x=>String(x.id)===e.target.value);if(!f||!s)return;
    pushUndo?.({tipo:'distribución',resumen:'Relacionar espacio con sala'});
    const ids=new Set((f.salaIds||[]).map(String));if(e.target.checked)ids.add(String(s.id));else ids.delete(String(s.id));f.salaIds=[...ids];
    if(e.target.checked&&!s.nombreDescriptivo&&String(f.ubicacion).length<=250&&confirm(`¿Añadir «${f.ubicacion}» como nombre descriptivo de ${s.nombre}? No cambia su identificador ni sus demás datos.`))s.nombreDescriptivo=String(f.ubicacion);
    await persistir('Relación actualizada.');const idx=seleccion;cargarGuardados();seleccion=idx;render();return;
   }
   if(e.target.matches('[data-dist-nota-fila]')){
    const store=almacen(),filaId=e.target.dataset.distNotaFila,seccionId=e.target.dataset.distNotaSeccion,nota=e.target.value.replace(/[\u0000-\u001f\u007f]+/g,' ').trim();if(!store)return;
    const id=`${filaId}:${seccionId}`,index=store.observaciones.findIndex(o=>o.id===id);
    if(nota&&index<0&&store.observaciones.length>=5000){mostrarEstado('Se alcanzó el límite de 5.000 observaciones.',true);return;}
    if((index>=0&&store.observaciones[index].texto===nota)||(index<0&&!nota))return;
    pushUndo?.({tipo:'distribución',resumen:'Editar observación de espacio'});
    if(nota){const valor={id,filaId,seccionId,texto:nota};if(index<0)store.observaciones.push(valor);else store.observaciones[index]=valor;}else if(index>=0)store.observaciones.splice(index,1);
    await persistir('Observación guardada.');return;
   }
  };
  const alInput=e=>{if(!e.target.matches('[data-dist-busqueda]'))return;filtro=e.target.value;pagina=1;const pos=e.target.selectionStart;render();const nuevo=q('[data-dist-busqueda]');nuevo?.focus();nuevo?.setSelectionRange(pos,pos);};
  container.addEventListener('click',alClick);container.addEventListener('change',alChange);container.addEventListener('input',alInput);
  cargarGuardados();render();
  return {cargarFilas, getResultado:()=>resultado, refrescar(){if(!preview||String(data().sel?.temporadaId||'')!==temporadaActual)cargarGuardados();render();}, abrirDetalle({plan:p,semestre:s,codigo:c}){cargarGuardados();filtro='';plan='';seleccion=resultado?.asignaturas?.findIndex(a=>normal(a.plan)===normal(p)&&normal(a.semestre)===normal(s)&&normal(a.codigo)===normal(c))??-1;if(seleccion<0)seleccion=null;render();q('.distribucion-detalle')?.scrollIntoView({block:'start'});}, destroy(){container.removeEventListener('click',alClick);container.removeEventListener('change',alChange);container.removeEventListener('input',alInput);container.innerHTML='';}};
 }
 window.PlanhorDistribucionEspaciosUI=Object.freeze({create});
})();
