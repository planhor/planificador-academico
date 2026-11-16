/* Análisis independiente de recomendaciones de espacios. No modifica el estado de Planhor. */
(function(){
 'use strict';
 const texto=v=>String(v??'').trim();
 const clave=v=>texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 function numero(v){
  if(v===null||v===undefined||texto(v)==='')return {valor:null,estado:'vacio'};
  if(typeof v==='boolean')return {valor:null,estado:'invalido'};
  if(typeof v==='string'&&texto(v).startsWith('='))return {valor:null,estado:'formula'};
  const normal=typeof v==='string'?texto(v).replace(',','.'):v;
  const n=Number(normal);
  return Number.isFinite(n)&&n>=0?{valor:n,estado:'valido'}:{valor:null,estado:'invalido'};
 }
 function detectarColumnas(fila){
  const columnas={semanas:Array(18).fill(null)};
  (Array.isArray(fila)?fila:[]).forEach((v,i)=>{
   const k=clave(v),match=k.match(/^(?:hh\s*)?s\s*(\d{1,2})$/);
   if(match){const n=Number(match[1]);if(n>=1&&n<=18&&columnas.semanas[n-1]===null)columnas.semanas[n-1]=i;else if(n===19&&columnas.totalEspacio===undefined)columnas.totalEspacio=i;return;}
   const aliases={area:['area'],plan:['plan codigo','codigo plan','plan de estudios'],semestre:['semestre','nivel'],codigo:['codigo de asignatura','codigo de la asignatura','codigo asignatura'],asignatura:['asignatura','nombre asignatura'],totalHoras:['hh totales','horas totales'],ubicacion:['ubicacion','espacio'],horasSemanales:['hh x semana','hh por semana','horas por semana'],maxDiarias:['max hh diarias','maximo hh diarias','maximo horas diarias']};
   for(const [campo,nombres] of Object.entries(aliases))if(columnas[campo]===undefined&&nombres.includes(k))columnas[campo]=i;
  });
  return columnas;
 }
 function analizar(filas){
  const alertas=[],grupos=new Map();
  if(!Array.isArray(filas))return {ok:false,encabezado:null,columnas:null,asignaturas:[],alertas:[{tipo:'archivo_invalido',detalle:'El archivo no contiene filas.'}]};
  let indice=-1,columnas=null;
  for(let i=0;i<Math.min(filas.length,30);i++){
   const c=detectarColumnas(filas[i]);
   if(['plan','semestre','codigo','totalHoras','ubicacion'].every(k=>c[k]!==undefined)&&c.semanas.every(v=>v!==null)){indice=i;columnas=c;break;}
  }
  if(indice<0)return {ok:false,encabezado:null,columnas:null,asignaturas:[],alertas:[{tipo:'encabezado_invalido',detalle:'Faltan plan, semestre, código, horas totales, ubicación o semanas S1 a S18.'}]};
  const obtener=(row,i)=>i===undefined||i===null?null:row[i];
  for(let i=indice+1;i<filas.length;i++){
   const row=Array.isArray(filas[i])?filas[i]:[];
   if(!row.some(v=>texto(v)!==''))continue;
   const plan=texto(obtener(row,columnas.plan)),semestre=texto(obtener(row,columnas.semestre)),codigo=texto(obtener(row,columnas.codigo)),ubicacion=texto(obtener(row,columnas.ubicacion));
   if(!plan||!semestre||!codigo||!ubicacion){alertas.push({tipo:'fila_incompleta',fila:i+1,detalle:'Falta plan, semestre, código o ubicación.'});continue;}
   const k=JSON.stringify([plan,semestre,codigo].map(v=>v.normalize('NFC').toLocaleUpperCase('es')));
   if(!grupos.has(k))grupos.set(k,{plan,semestre,codigo,asignatura:texto(obtener(row,columnas.asignatura)),area:texto(obtener(row,columnas.area)),horasTotales:null,espacios:[],filas:[],alertas:[]});
   const g=grupos.get(k),total=numero(obtener(row,columnas.totalHoras));g.filas.push(i+1);
   if(total.estado!=='valido')g.alertas.push({tipo:'horas_totales_invalidas',fila:i+1,detalle:'Horas totales vacías o inválidas.'});
   else if(g.horasTotales===null)g.horasTotales=total.valor;
   else if(g.horasTotales!==total.valor)g.alertas.push({tipo:'horas_totales_inconsistentes',fila:i+1,detalle:'Las filas de la asignatura tienen diferentes horas totales.'});
   const semanas=columnas.semanas.map((col,j)=>{
    const resultado=numero(obtener(row,col));
    if(resultado.estado==='invalido'||resultado.estado==='formula')g.alertas.push({tipo:'semana_invalida',fila:i+1,semana:j+1,detalle:'La semana contiene un valor inválido o una fórmula sin resultado.'});
    return resultado.estado==='vacio'?0:resultado.valor;
   });
   const faltantes=semanas.filter(x=>x===null).length;
   const subtotal=faltantes?null:semanas.reduce((a,b)=>a+b,0);
   const declarado=numero(obtener(row,columnas.totalEspacio));
   if(declarado.estado==='invalido')g.alertas.push({tipo:'subtotal_invalido',fila:i+1,detalle:'El total HH por espacio no es válido.'});
   if(declarado.estado==='formula')g.alertas.push({tipo:'subtotal_sin_resultado',fila:i+1,detalle:'La fórmula del total HH no tiene resultado disponible; se muestra el subtotal calculado.'});
   if(subtotal!==null&&declarado.estado==='valido'&&Math.abs(subtotal-declarado.valor)>1e-9)g.alertas.push({tipo:'subtotal_no_coincide',fila:i+1,calculado:subtotal,declarado:declarado.valor});
   const horasSemanales=numero(obtener(row,columnas.horasSemanales));
   const maxDiarias=numero(obtener(row,columnas.maxDiarias));
   if(horasSemanales.estado==='invalido'||maxDiarias.estado==='invalido')g.alertas.push({tipo:'recomendacion_invalida',fila:i+1,detalle:'HH por semana o máximo diario contiene un valor inválido.'});
   const repetida=g.espacios.find(e=>clave(e.ubicacion)===clave(ubicacion));
   if(repetida)g.alertas.push({tipo:'ubicacion_repetida',fila:i+1,primeraFila:repetida.fila,detalle:'La ubicación aparece más de una vez en esta asignatura; revisa si corresponde.'});
   g.espacios.push({fila:i+1,ubicacion,semanas,horasSemanales:horasSemanales.valor,maxDiarias:maxDiarias.valor,totalCalculado:subtotal,totalDeclarado:declarado.valor,salaIds:[]});
  }
  const asignaturas=[...grupos.values()].map(g=>{
   const completa=g.espacios.every(e=>e.totalCalculado!==null);
   g.horasDistribuidas=completa?g.espacios.reduce((sum,e)=>sum+e.totalCalculado,0):null;
   g.diferencia=g.horasTotales!==null&&g.horasDistribuidas!==null?g.horasTotales-g.horasDistribuidas:null;
   if(!completa)g.alertas.push({tipo:'semanas_sin_dato',detalle:'Hay semanas con valores inválidos; el total distribuido no se puede calcular.'});
   return g;
  });
  return {ok:true,encabezado:indice+1,columnas,asignaturas,alertas,filasLeidas:asignaturas.reduce((n,g)=>n+g.filas.length,0)};
 }
 // Compara solo la semana ideal. No atribuye un bloque a una ubicación concreta
 // cuando hay varias recomendaciones activas: los resultados son por sección.
 function evaluarSeccion(espacios,planificaciones,salas,semana=1){
  if(semana!==1)return {estado:'sin_datos',motivo:'La planificación actual representa una semana ideal; solo se compara con S1.'};
  const activos=(espacios||[]).filter(e=>Number(e.semanas?.[semana-1])>0);
  if((espacios||[]).some(e=>e.semanas?.[semana-1]===null||e.semanas?.[semana-1]===undefined))return {estado:'sin_datos',motivo:'Recomendación incompleta'};
  if(!activos.length)return {estado:'sin_recomendacion'};
  const porId=new Map((salas||[]).map(s=>[String(s.id),s]));
  const validas=s=>s&&!s.esVirtual&&!['__tro2__','__virtual__'].includes(String(s.id))&&!/^(tro2|virtual)(?:\s*\(.*\))?$/i.test(texto(s.nombre));
  const relacionados=activos.map(e=>(e.salaIds||[]).map(id=>porId.get(String(id))).filter(validas));
  if(relacionados.some(a=>!a.length))return {estado:'sin_relacion',espaciosSinRelacion:activos.filter((_,i)=>!relacionados[i].length).map(e=>e.ubicacion)};
  const bloques=(planificaciones||[]).filter(p=>p.tipoPresencial!==false);
  if(!bloques.length)return {estado:'sin_planificacion'};
  const recomendadas=new Set(relacionados.flat().map(s=>String(s.id)));
  let pendientes=0,distintos=0,coincidentes=0;
  for(const b of bloques){const s=porId.get(String(b.salaId??''));if(!validas(s))pendientes++;else if(recomendadas.has(String(s.id)))coincidentes++;else distintos++;}
  if(pendientes)return {estado:'sala_pendiente',pendientes,distintos,coincidentes};
  if(distintos)return {estado:'sala_distinta',pendientes,distintos,coincidentes};
  const asignadas=new Set(bloques.map(b=>String(b.salaId??'')));
  const sinSalaAsignada=activos.filter((_,i)=>!relacionados[i].some(s=>asignadas.has(String(s.id)))).map(e=>e.ubicacion);
  return {estado:sinSalaAsignada.length?'revision_parcial':'coincide',pendientes,distintos,coincidentes,espaciosSinSalaAsignada:sinSalaAsignada};
 }
 const identificador=v=>texto(v).normalize('NFC').toLocaleUpperCase('es');
 // La fuente única vive en la raíz, separada de gestorSecciones: las versiones
 // anteriores reconstruyen el Gestor y descartarían campos desconocidos allí.
 function obtenerDistribucion(data,temporadaId){
  const id=String(temporadaId??data?.sel?.temporadaId??'');
  const coleccion=data?.distribucionesEspaciosPorTemporada;
  if(!id||!coleccion||typeof coleccion!=='object'||Array.isArray(coleccion))return null;
  return Object.prototype.hasOwnProperty.call(coleccion,id)?coleccion[id]:null;
 }
 function establecerDistribucion(data,valor,temporadaId){
  const id=String(temporadaId??data?.sel?.temporadaId??'');
  if(!data||typeof data!=='object'||!id||['__proto__','prototype','constructor'].includes(id))throw new Error('No hay una temporada válida para guardar recomendaciones.');
  let coleccion=data.distribucionesEspaciosPorTemporada;
  if(!coleccion||typeof coleccion!=='object'||Array.isArray(coleccion))coleccion=data.distribucionesEspaciosPorTemporada=Object.create(null);
  if(valor===null)delete coleccion[id];else Object.defineProperty(coleccion,id,{value:valor,writable:true,enumerable:true,configurable:true});
 }
 function claveEspacio(v){return texto(v).normalize('NFC').replace(/\s+/g,' ').toLocaleUpperCase('es');}
 function catalogoEspacios(filas){
  const grupos=new Map();
  for(const f of filas||[]){const key=claveEspacio(f.ubicacion);if(!key)continue;if(!grupos.has(key))grupos.set(key,{clave:key,nombre:texto(f.ubicacion),filas:[],salas:[],conflicto:false,variantes:[]});grupos.get(key).filas.push(f);}
  for(const g of grupos.values()){
   const variantes=new Map();
   for(const f of g.filas){const ids=[...new Set((f.salaIds||[]).map(String).filter(Boolean))];if(!ids.length)continue;const firma=JSON.stringify([...ids].sort());if(!variantes.has(firma))variantes.set(firma,ids);}
   g.variantes=[...variantes.values()];g.conflicto=g.variantes.length>1;g.salas=g.conflicto?[]:(g.variantes[0]||[]);
  }
  return [...grupos.values()].sort((a,b)=>a.nombre.localeCompare(b.nombre,'es',{numeric:true,sensitivity:'base'}));
 }
 function establecerSalasEspacio(filas,espacio,ids){
  const key=claveEspacio(espacio),lista=[...new Set((ids||[]).map(String).filter(Boolean))];
  if(!key)throw new Error('Falta el nombre del espacio.');
  let count=0;for(const f of filas||[])if(claveEspacio(f.ubicacion)===key){f.salaIds=[...lista];count++;}
  if(!count)throw new Error('No se encontró el espacio.');
  return count;
 }
 function espaciosSinRelacion(data,filas){
  const disponibles=new Set((data.salas||[]).filter(s=>!s.esVirtual&&!['__tro2__','__virtual__'].includes(String(s.id))).map(s=>String(s.id)));
  const todos=catalogoEspacios(obtenerDistribucion(data)?.filas||[]),filtro=filas?new Set(filas.map(f=>claveEspacio(f.ubicacion))):null;
  return todos.filter(g=>(!filtro||filtro.has(g.clave))&&!g.conflicto&&!g.salas.some(id=>disponibles.has(String(id)))).map(g=>({ubicacion:g.nombre,conflicto:false}));
 }
 const nivelClave=v=>{const t=clave(v),m=t.match(/^(?:n|nivel)?\s*(\d+)$/);return m?String(Number(m[1])):t;};
 function obtenerSeguimiento(data){
  const distribucion=obtenerDistribucion(data),registros=distribucion?.filas||[], observaciones=distribucion?.observaciones||[];
  const catalogo=new Map(catalogoEspacios(registros).map(g=>[g.clave,g]));
  const sinRelacion=new Set(espaciosSinRelacion(data).map(x=>claveEspacio(x.ubicacion)));
  const grupos=new Map();
  for(const f of registros){const k=JSON.stringify([identificador(f.plan),nivelClave(f.semestre),identificador(f.codigo)]);if(!grupos.has(k))grupos.set(k,[]);grupos.get(k).push(f);}
  const resultado=[];
  for(const filas of grupos.values()){
   const primero=filas[0],carreras=(data.carreras||[]).filter(c=>identificador(c.codigo)===identificador(primero.plan));
   const niveles=(data.niveles||[]).filter(n=>carreras.some(c=>String(c.id)===String(n.carreraId))&&nivelClave(n.nombre)===nivelClave(primero.semestre));
   const asignaturas=(data.asignaturas||[]).filter(a=>identificador(a.codigo)===identificador(primero.codigo));
   const base={plan:primero.plan,semestre:primero.semestre,codigo:primero.codigo,asignatura:primero.asignatura,filas,espaciosRecomendados:filas.filter(f=>Number(f.semanas?.[0])>0).map(f=>{
    const g=catalogo.get(claveEspacio(f.ubicacion)),salas=g?.salas||[];
    const nombre=g?.conflicto?`${f.ubicacion} · relaciones por revisar`:salas.length?salas.map((id,i)=>`${f.ubicacion} (${i+1}) · ${(data.salas||[]).find(s=>String(s.id)===id)?.nombre||'Sala no disponible'}`).join(', '):f.ubicacion;
    return `${nombre} (${f.semanas[0]} HH recomendadas)`;
   }),espaciosSinRelacion:[...new Set(filas.filter(f=>sinRelacion.has(claveEspacio(f.ubicacion))).map(f=>f.ubicacion))]};
   if(carreras.length!==1||asignaturas.length!==1||niveles.length!==1){resultado.push({...base,estado:'sin_datos',motivo:'No se pudo identificar de forma única el plan, nivel y asignatura.',seccionId:'',seccionNombre:'',asignaturaId:''});continue;}
   const asignaturaId=asignaturas[0].id;
   const secciones=(data.secciones||[]).filter(s=>niveles.some(n=>String(n.id)===String(s.nivelId))).filter(s=>{
    const especificas=(data.asignaturaSeccion||[]).filter(r=>String(r.seccionId)===String(s.id));
    if(especificas.length)return especificas.some(r=>String(r.asignaturaId)===String(asignaturaId));
    return (data.asignaturaCarreraNivel||[]).some(r=>String(r.nivelId)===String(s.nivelId)&&String(r.carreraId)===String(carreras[0].id)&&String(r.asignaturaId)===String(asignaturaId));
   });
   if(!secciones.length){resultado.push({...base,estado:'sin_datos',motivo:'No se encontró una sección relacionada.',seccionId:'',seccionNombre:'',asignaturaId});continue;}
   for(const sec of secciones){
    const propios=(data.planificaciones||[]).filter(p=>String(p.seccionId)===String(sec.id)&&String(p.asignaturaId)===String(asignaturaId));
    const heredados=(data.gruposDictacion||[]).filter(g=>String(g.seccionMadreId)!==String(sec.id)&&(g.seccionesVinculadasIds||[]).some(id=>String(id)===String(sec.id))&&[g.asignaturaId,...(g.asignaturasEquivalentesIds||[])].some(id=>String(id)===String(asignaturaId))).flatMap(g=>{
     const ids=[g.asignaturaId,...(g.asignaturasEquivalentesIds||[])].map(String);
     return (data.planificaciones||[]).filter(p=>String(p.seccionId)===String(g.seccionMadreId)&&ids.includes(String(p.asignaturaId)));
    });
    const planes=[...propios,...heredados],activos=filas.filter(f=>Number(f.semanas?.[0])>0),conflicto=activos.some(f=>catalogo.get(claveEspacio(f.ubicacion))?.conflicto);
    const efectivas=filas.map(f=>({...f,salaIds:catalogo.get(claveEspacio(f.ubicacion))?.salas||[]}));
    const estado=conflicto?{estado:'sin_datos',motivo:'Hay relaciones diferentes para un mismo espacio; revísalas en Relacionar espacios.'}:evaluarSeccion(efectivas,planes,data.salas||[],1);
    const espaciosRecomendados=base.espaciosRecomendados;
    const salasAsignadas=[...new Set(planes.filter(p=>p.tipoPresencial!==false).map(p=>(data.salas||[]).find(s=>String(s.id)===String(p.salaId))?.nombre||'Sin sala'))];
    resultado.push({...base,...estado,espaciosSinRelacion:base.espaciosSinRelacion,seccionId:sec.id,seccionNombre:sec.nombre||'',asignaturaId,espaciosRecomendados,salasAsignadas,observaciones:observaciones.filter(o=>String(o.seccionId)===String(sec.id)&&filas.some(f=>String(f.id)===String(o.filaId)))});
   }
  }
  return resultado;
 }
 window.PlanhorDistribucionEspacios=Object.freeze({detectarColumnas,analizar,evaluarSeccion,obtenerDistribucion,establecerDistribucion,obtenerSeguimiento,espaciosSinRelacion,claveEspacio,catalogoEspacios,establecerSalasEspacio});
})();
