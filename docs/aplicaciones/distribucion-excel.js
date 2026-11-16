/* Copia XLSX: añade observaciones en AR sin reescribir los demás archivos ZIP. */
(function(){
 'use strict';
 const dec=new TextDecoder('utf-8',{fatal:true}), enc=new TextEncoder();
 const fail=m=>{throw new Error(m);};
 const u16=(v,p)=>v.getUint16(p,true),u32=(v,p)=>v.getUint32(p,true);
 const put16=(a,p,n)=>new DataView(a.buffer,a.byteOffset,a.byteLength).setUint16(p,n,true);
 const put32=(a,p,n)=>new DataView(a.buffer,a.byteOffset,a.byteLength).setUint32(p,n>>>0,true);
 const concat=parts=>{const n=parts.reduce((s,p)=>s+p.length,0),out=new Uint8Array(n);let i=0;for(const p of parts){out.set(p,i);i+=p.length;}return out;};
 const crcTable=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
 const crc32=bytes=>{let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
 const xmlText=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
 const decodeXml=s=>String(s).replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi,(_,v)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[v]??String.fromCodePoint(v[1]?.toLowerCase()==='x'?parseInt(v.slice(2),16):parseInt(v.slice(1),10))));
 function attr(tag,name){const x=tag.match(new RegExp('(?:^|\\s)'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*=\\s*(["\'])(.*?)\\1'));return x?decodeXml(x[2]):null;}
 function zip(input){
  const a=input instanceof Uint8Array?new Uint8Array(input):new Uint8Array(input),v=new DataView(a.buffer,a.byteOffset,a.byteLength);let end=-1;
  for(let i=a.length-22;i>=Math.max(0,a.length-65557);i--)if(u32(v,i)===0x06054b50&&i+22+u16(v,i+20)===a.length){end=i;break;}
  if(end<0)fail('No se encontró un archivo XLSX válido.');
  const count=u16(v,end+10),off=u32(v,end+16),size=u32(v,end+12);
  if(u16(v,end+4)||u16(v,end+6)||u16(v,end+8)!==count||count===65535||off===0xffffffff||size===0xffffffff||off+size!==end)fail('El formato ZIP del archivo no es compatible.');
  let pos=off;const entries=[];
  for(let i=0;i<count;i++){
   if(pos+46>end||u32(v,pos)!==0x02014b50)fail('Directorio ZIP inválido.');
   const len=46+u16(v,pos+28)+u16(v,pos+30)+u16(v,pos+32);if(pos+len>end)fail('Directorio ZIP incompleto.');
   const header=a.slice(pos,pos+len),h=new DataView(header.buffer),name=dec.decode(header.subarray(46,46+u16(h,28))),flags=u16(h,8),method=u16(h,10),compressed=u32(h,20),plain=u32(h,24),local=u32(h,42);
   if((flags&1)||local===0xffffffff||compressed===0xffffffff||plain===0xffffffff||u16(h,34)!==0)fail('Archivo cifrado, dividido o ZIP64 no compatible.');
   entries.push({name,header,flags,method,compressed,plain,local,crc:u32(h,16)});pos+=len;
  }
  if(pos!==end||new Set(entries.map(e=>e.name)).size!==entries.length)fail('Directorio ZIP ambiguo.');
  const physical=[...entries].sort((x,y)=>x.local-y.local);
  physical.forEach((e,i)=>{e.end=physical[i+1]?.local??off;if(e.local+30>e.end||u32(v,e.local)!==0x04034b50)fail('Entrada ZIP inválida.');e.payload=e.local+30+u16(v,e.local+26)+u16(v,e.local+28);if(e.payload+e.compressed>e.end)fail('Entrada ZIP incompleta.');});
  return {a,entries,physical,off,end};
 }
 async function leer(z,name){
  const e=z.entries.find(x=>x.name===name);if(!e)fail('No se encontró '+name+' en el libro.');
  if(e.plain>80*1024*1024)fail('La hoja es demasiado grande para editarla con seguridad.');
  const compressed=z.a.subarray(e.payload,e.payload+e.compressed);let bytes;
  if(e.method===0)bytes=compressed.slice();
  else if(e.method===8){
   if(typeof DecompressionStream==='undefined')fail('Este navegador no permite leer el XLSX original.');
   try{
    const reader=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader(),parts=[];let total=0;
    for(;;){const r=await reader.read();if(r.done)break;total+=r.value.length;if(total>e.plain||total>80*1024*1024){await reader.cancel();fail('La hoja descomprimida supera su tamaño declarado.');}parts.push(r.value);}
    bytes=concat(parts);
   }catch(_){fail('No se pudo descomprimir el XLSX en este navegador.');}
  }else fail('La compresión del XLSX no es compatible.');
  if(bytes.length!==e.plain||crc32(bytes)!==e.crc)fail('Una parte del XLSX está incompleta o dañada.');
  return dec.decode(bytes);
 }
 function nombreHoja(workbook,rels,nombre){
  if(/<!DOCTYPE/i.test(workbook+rels))fail('El XML del libro no es compatible.');
  const hojas=[...workbook.matchAll(/<(?:\w+:)?sheet\s+[^>]*\/?\s*>/g)].filter(m=>attr(m[0],'name')===nombre);
  if(hojas.length!==1)fail('No se encontró de forma inequívoca la hoja indicada.');
  const id=attr(hojas[0][0],'r:id');if(!id)fail('La hoja no tiene una relación válida.');
  const relaciones=[...rels.matchAll(/<(?:\w+:)?Relationship\s+[^>]*\/?\s*>/g)].filter(m=>attr(m[0],'Id')===id);
  if(relaciones.length!==1||attr(relaciones[0][0],'TargetMode')==='External')fail('Relación de hoja inválida.');
  let target=attr(relaciones[0][0],'Target');if(!target||/[?#\\]/.test(target))fail('Ruta de hoja inválida.');
  target=target.startsWith('/')?target.slice(1):'xl/'+target;
  const parts=[];for(const p of target.split('/')){if(p==='..'){if(!parts.length)fail('Ruta de hoja inválida.');parts.pop();}else if(p&&p!=='.')parts.push(p);}
  target=parts.join('/');if(!target.startsWith('xl/'))fail('Ruta de hoja inválida.');return target;
 }
 function columna(s){let n=0;for(const c of s.toUpperCase())n=n*26+c.charCodeAt(0)-64;return n;}
 function editarHoja(xml,observaciones){
  if(/<!DOCTYPE|<(?:\w+:)(?:row|c)\b/i.test(xml))fail('El formato XML de la hoja no es compatible.');
  const filas=new Map();
  for(const o of observaciones||[]){
   const fila=Number(o.fila),seccion=String(o.seccion??'').trim(),texto=String(o.texto??'').trim();
   if(!Number.isInteger(fila)||fila<1||fila>1048576||!seccion||!texto)fail('Cada observación requiere fila, código de sección y texto.');
   if(/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(seccion+texto))fail('La observación contiene caracteres no válidos para Excel.');
   if(!filas.has(fila))filas.set(fila,[]);filas.get(fila).push(seccion+': '+texto);
  }
  if(!filas.size)fail('No hay observaciones para exportar.');
  for(const m of xml.matchAll(/<mergeCell\b[^>]*\/?\s*>/g)){const ref=attr(m[0],'ref'),p=ref?.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i);if(p&&columna(p[1])<=44&&columna(p[3])>=44&&[...filas.keys()].some(n=>n>=Number(p[2])&&n<=Number(p[4])))fail('La columna AR forma parte de una celda combinada.');}
  const encontradas=new Set();
  xml=xml.replace(/<row\b[^>]*>([\s\S]*?)<\/row\s*>/g,(row,body)=>{
   const apertura=row.slice(0,row.indexOf('>')+1),n=Number(attr(apertura,'r'));if(!filas.has(n))return row;if(encontradas.has(n))fail('La fila aparece más de una vez.');encontradas.add(n);
   const mensaje=filas.get(n).join('\n');if(mensaje.length>32767)fail('La observación de la fila '+n+' supera el límite de Excel.');
   const contenido='<is><t xml:space="preserve">'+xmlText(mensaje)+'</t></is>', cells=[...body.matchAll(/<c\b[^>]*(?:\/>|>[\s\S]*?<\/c\s*>)/g)];let actual=null,antes=null;
   for(const c of cells){const r=attr(c[0].slice(0,c[0].indexOf('>')+1),'r'),p=r?.match(/^([A-Z]+)(\d+)$/i);if(!p||Number(p[2])!==n)fail('Referencia de celda inválida.');const col=columna(p[1]);if(col===44){if(actual)fail('Hay celdas AR duplicadas.');actual=c;}if(col>44&&antes===null)antes=c.index;}
   let nuevo;
   if(actual){
    if(/<(?:f|v|is)\b/i.test(actual[0]))fail('AR'+n+' ya contiene información; no se sobrescribió.');
    let tag=actual[0].slice(0,actual[0].indexOf('>')+1).replace(/\s+t\s*=\s*(["']).*?\1/,'').replace(/\s*\/?>$/,' t="inlineStr">');
    nuevo=body.slice(0,actual.index)+tag+contenido+'</c>'+body.slice(actual.index+actual[0].length);
   }else{const cell='<c r="AR'+n+'" t="inlineStr">'+contenido+'</c>',pos=antes===null?body.length:antes;nuevo=body.slice(0,pos)+cell+body.slice(pos);}
   return apertura+nuevo+row.slice(row.lastIndexOf('</row'));
  });
  for(const n of filas.keys())if(!encontradas.has(n))fail('La fila '+n+' no existe en el archivo original.');
  xml=xml.replace(/<dimension\b[^>]*\/?\s*>/,tag=>{const ref=attr(tag,'ref'),p=ref?.match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/i);if(!p)fail('El rango de la hoja no es compatible.');const endCol=p[3]||p[1],endRow=Math.max(Number(p[4]||p[2]),...filas.keys());if(columna(endCol)>=44&&endRow===Number(p[4]||p[2]))return tag;const value=p[1]+p[2]+':'+(columna(endCol)>=44?endCol:'AR')+endRow;return tag.replace(/(\bref\s*=\s*)(["']).*?\2/,(_,a,q)=>a+q+value+q);});
  return xml;
 }
 function empaquetar(z,target,plain){
  const parts=[],offsets=new Map();let offset=0;
  const prefix=z.a.slice(0,z.physical[0]?.local??z.off);parts.push(prefix);offset+=prefix.length;
  for(const e of z.physical){offsets.set(e.name,offset);let bytes;
   if(e.name!==target)bytes=z.a.slice(e.local,e.end);
   else{
    const header=z.a.slice(e.local,e.payload),lh=new DataView(header.buffer),flags=u16(lh,6)&~8;put16(header,6,flags);put16(header,8,0);put32(header,14,crc32(plain));put32(header,18,plain.length);put32(header,22,plain.length);
    let tail=e.payload+e.compressed;if(e.flags&8){const v=new DataView(z.a.buffer,z.a.byteOffset,z.a.byteLength);tail+=u32(v,tail)===0x08074b50?16:12;if(tail>e.end)fail('Descriptor ZIP incompleto.');}
    bytes=concat([header,plain,z.a.slice(tail,e.end)]);
   }
   parts.push(bytes);offset+=bytes.length;
  }
  const cdOffset=offset;
  for(const e of z.entries){const h=e.header.slice();put32(h,42,offsets.get(e.name));if(e.name===target){put16(h,8,e.flags&~8);put16(h,10,0);put32(h,16,crc32(plain));put32(h,20,plain.length);put32(h,24,plain.length);}parts.push(h);offset+=h.length;}
  const end=z.a.slice(z.end);put32(end,12,offset-cdOffset);put32(end,16,cdOffset);parts.push(end);return concat(parts);
 }
 async function exportar({archivo,hoja,observaciones}={}){
  if(!archivo||!hoja)fail('Selecciona el archivo original y su hoja.');
  const entrada=archivo instanceof Uint8Array?archivo:new Uint8Array(await archivo.arrayBuffer()),z=zip(entrada);
  const workbook=await leer(z,'xl/workbook.xml'),rels=await leer(z,'xl/_rels/workbook.xml.rels'),target=nombreHoja(workbook,rels,String(hoja));
  const xml=await leer(z,target),nuevo=enc.encode(editarHoja(xml,observaciones));
  return new Blob([empaquetar(z,target,nuevo)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
 }
 const textoXml=s=>[...String(s).replace(/<rPh\b[\s\S]*?<\/rPh\s*>/g,'').matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t\s*>/g)].map(m=>decodeXml(m[1])).join('');
 async function leerFilas({archivo,hoja}={}){
  if(!archivo)fail('Selecciona un archivo XLSX.');
  const entrada=archivo instanceof Uint8Array?archivo:new Uint8Array(await archivo.arrayBuffer()),z=zip(entrada);
  const workbook=await leer(z,'xl/workbook.xml'),rels=await leer(z,'xl/_rels/workbook.xml.rels');
  const nombres=[...workbook.matchAll(/<(?:\w+:)?sheet\s+[^>]*\/?\s*>/g)].map(m=>attr(m[0],'name')).filter(Boolean);
  const seleccion=hoja||nombres[0];if(!seleccion)fail('El libro no tiene hojas.');
  const target=nombreHoja(workbook,rels,String(seleccion)),xml=await leer(z,target);
  if(/<!DOCTYPE|<(?:\w+:)(?:row|c)\b/i.test(xml))fail('El formato XML de la hoja no es compatible.');
  let compartidas=[];
  if(z.entries.some(e=>e.name==='xl/sharedStrings.xml')){
   const shared=await leer(z,'xl/sharedStrings.xml');
   if(/<!DOCTYPE/i.test(shared))fail('Las cadenas del libro no son compatibles.');
   compartidas=[...shared.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si\s*>/g)].map(m=>textoXml(m[1]));
  }
  const filas=[];
  for(const m of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row\s*>/g)){
   const n=Number(attr(m[0].slice(0,m[0].indexOf('>')+1),'r'));if(!Number.isInteger(n)||n<1||n>100000)fail('La hoja contiene demasiadas filas o una referencia inválida.');
   if(filas[n-1])fail('La hoja contiene filas duplicadas.');const row=[];filas[n-1]=row;
   for(const cell of m[1].matchAll(/<c\b[^>]*(?:\/>|>[\s\S]*?<\/c\s*>)/g)){
    const tag=cell[0].slice(0,cell[0].indexOf('>')+1),ref=attr(tag,'r')?.match(/^([A-Z]+)(\d+)$/i);if(!ref||Number(ref[2])!==n)fail('Referencia de celda inválida.');
    const col=columna(ref[1]);if(col>1000)fail('La hoja contiene demasiadas columnas.');
    const tipo=attr(tag,'t'),v=cell[0].match(/<v(?:\s[^>]*)?>([\s\S]*?)<\/v\s*>/),formula=cell[0].match(/<f(?:\s[^>]*)?>([\s\S]*?)<\/f\s*>/);
    let valor=null;
    if(tipo==='inlineStr')valor=textoXml(cell[0]);
    else if(v){const raw=decodeXml(v[1]);if(tipo==='s'){const i=Number(raw);if(!Number.isInteger(i)||i<0||i>=compartidas.length)fail('Índice de cadena inválido.');valor=compartidas[i];}else if(tipo==='b')valor=raw==='1';else if(tipo==='str'||tipo==='e'||tipo==='d')valor=raw;else valor=raw.trim()!==''&&Number.isFinite(Number(raw))?Number(raw):raw;}
    else if(formula)valor='='+decodeXml(formula[1]);
    row[col-1]=valor;
   }
  }
  return {hoja:seleccion,hojas:nombres,filas};
 }
 function crearZip(archivos){
  const partes=[],centrales=[];let offset=0;
  for(const [ruta,texto] of archivos){
   const nombre=enc.encode(ruta),contenido=enc.encode(texto),suma=crc32(contenido),local=new Uint8Array(30),central=new Uint8Array(46);
   put32(local,0,0x04034b50);put16(local,4,20);put16(local,6,0x800);put32(local,14,suma);put32(local,18,contenido.length);put32(local,22,contenido.length);put16(local,26,nombre.length);
   put32(central,0,0x02014b50);put16(central,4,20);put16(central,6,20);put16(central,8,0x800);put32(central,16,suma);put32(central,20,contenido.length);put32(central,24,contenido.length);put16(central,28,nombre.length);put32(central,42,offset);
   partes.push(local,nombre,contenido);centrales.push(central,nombre);offset+=local.length+nombre.length+contenido.length;
  }
  const cd=concat(centrales),end=new Uint8Array(22);put32(end,0,0x06054b50);put16(end,8,archivos.length);put16(end,10,archivos.length);put32(end,12,cd.length);put32(end,16,offset);return concat([...partes,cd,end]);
 }
 function letraColumna(n){let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;}
 function crearPlantilla(){
  const headers=['Área','TFL','Plan Código','Programa de Estudio','Semestre','Código de Asignatura','Asignatura','Área Formación','Tipo Asignatura','Estrategias Didacticas','Estrategias Metodologicas','HH Totales','HH Presencial','HH Online','HH Sincronicas','HH Asincronicas','HH Aula','HH Laboratorio','HH Taller','HH Terreno','HH Campo Clinico','Ubicación','HH x Semana','Max HH Diarias',...Array.from({length:19},(_,i)=>'HH S'+(i+1)),'Observación'];
  const celdas=headers.map((h,i)=>'<c r="'+letraColumna(i+1)+'1" t="inlineStr"><is><t>'+xmlText(h)+'</t></is></c>').join('');
  const instrucciones=['Plantilla de distribución semanal de espacios','Completa una fila por asignatura y ubicación. Mantén el plan completo y el semestre.','S1–S18 indican las horas recomendadas por semana para esa ubicación. Las celdas vacías se interpretan como 0.','HH S19 (columna AQ) es el total de la ubicación, no una semana adicional. En AQ2 puedes escribir =SUMA(Y2:AP2) y copiar la fórmula hacia abajo.','Una asignatura puede tener varias filas si usa diferentes ubicaciones. Esta plantilla no asigna ni reserva salas.','La columna AR se reserva para observaciones por sección al exportar los hallazgos.'];
  const filasAyuda=instrucciones.map((s,i)=>'<row r="'+(i+1)+'"><c r="A'+(i+1)+'" t="inlineStr"><is><t>'+xmlText(s)+'</t></is></c></row>').join('');
  const sheet1='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:AR1"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData><row r="1">'+celdas+'</row></sheetData></worksheet>';
  const sheet2='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:A'+instrucciones.length+'"/><cols><col min="1" max="1" width="110" customWidth="1"/></cols><sheetData>'+filasAyuda+'</sheetData></worksheet>';
  const archivos=[
   ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'],
   ['_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
   ['xl/workbook.xml','<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Distribución" sheetId="1" r:id="rId1"/><sheet name="Instrucciones" sheetId="2" r:id="rId2"/></sheets><calcPr calcMode="auto"/></workbook>'],
   ['xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/></Relationships>'],
   ['xl/worksheets/sheet1.xml',sheet1],['xl/worksheets/sheet2.xml',sheet2]
  ];
  return new Blob([crearZip(archivos)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
 }
 window.PlanhorDistribucionExcel=Object.freeze({exportar,leerFilas,crearPlantilla});
})();
