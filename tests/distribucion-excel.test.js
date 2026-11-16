const test=require('node:test'),assert=require('node:assert/strict'),zlib=require('node:zlib'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx={window:{},TextDecoder,TextEncoder,Uint8Array,DataView,Blob,Response,DecompressionStream};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../docs/aplicaciones/distribucion-excel.js'),'utf8'),ctx);
const {leerFilas,exportar,crearPlantilla}=ctx.window.PlanhorDistribucionExcel;
const table=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc(a){let c=0xffffffff;for(const b of a)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function makeZip(files){const locals=[],centrals=[];let offset=0;
 for(const [name,content] of Object.entries(files)){
  const n=Buffer.from(name),plain=Buffer.from(content),packed=zlib.deflateRawSync(plain),l=Buffer.alloc(30),c=Buffer.alloc(46);
  l.writeUInt32LE(0x04034b50,0);l.writeUInt16LE(20,4);l.writeUInt16LE(8,8);l.writeUInt32LE(crc(plain),14);l.writeUInt32LE(packed.length,18);l.writeUInt32LE(plain.length,22);l.writeUInt16LE(n.length,26);
  c.writeUInt32LE(0x02014b50,0);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(8,10);c.writeUInt32LE(crc(plain),16);c.writeUInt32LE(packed.length,20);c.writeUInt32LE(plain.length,24);c.writeUInt16LE(n.length,28);c.writeUInt32LE(offset,42);
  locals.push(l,n,packed);centrals.push(c,n);offset+=l.length+n.length+packed.length;
 }
 const directory=Buffer.concat(centrals),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(Object.keys(files).length,8);end.writeUInt16LE(Object.keys(files).length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...locals,directory,end]);
}
const workbook='<workbook><sheets><sheet name="Final &amp; otra" sheetId="1" r:id="rId1"/></sheets></workbook>';
const rels='<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>';
const sheet='<worksheet><dimension ref="A1:AQ2"/><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>ABC</t></is></c><c r="AQ2"><f>SUM(A2:A2)</f><v>3</v></c></row></sheetData></worksheet>';
const files={'xl/workbook.xml':workbook,'xl/_rels/workbook.xml.rels':rels,'xl/worksheets/sheet1.xml':sheet,'xl/sharedStrings.xml':'<sst><si><t>Plan Código</t></si></sst>','xl/styles.xml':'<styleSheet marker="intacto"/>'};
const original=makeZip(files);
test('lee texto compartido, inline y el valor cacheado de una fórmula',async()=>{
 const r=await leerFilas({archivo:original,hoja:'Final & otra'});assert.equal(r.hoja,'Final & otra');assert.equal(r.filas[0][0],'Plan Código');assert.equal(r.filas[1][0],'ABC');assert.equal(r.filas[1][42],3);
});
test('añade observaciones por sección sin modificar el archivo de entrada ni la fórmula',async()=>{
 const antes=Buffer.from(original),blob=await exportar({archivo:original,hoja:'Final & otra',observaciones:[{fila:2,seccion:'D-1',texto:'Sala & motivo <válido>'},{fila:2,seccion:'V-2',texto:'Sin sala'}]});
 assert.deepEqual(original,antes);const r=await leerFilas({archivo:blob});assert.equal(r.filas[1][43],'D-1: Sala & motivo <válido>\nV-2: Sin sala');assert.equal(r.filas[1][42],3);
});
test('rechaza sobrescritura de AR, filas inexistentes y ausencia de observaciones',async()=>{
 const blob=await exportar({archivo:original,hoja:'Final & otra',observaciones:[{fila:2,seccion:'D',texto:'motivo'}]});
 await assert.rejects(exportar({archivo:blob,hoja:'Final & otra',observaciones:[{fila:2,seccion:'V',texto:'otro'}]}),/ya contiene información/);
 await assert.rejects(exportar({archivo:original,hoja:'Final & otra',observaciones:[{fila:4,seccion:'V',texto:'otro'}]}),/fila 4 no existe/);
 await assert.rejects(exportar({archivo:original,hoja:'Final & otra',observaciones:[]}),/No hay observaciones/);
});
test('rechaza celdas combinadas en AR y no interpreta texto como fórmula',async()=>{
 const data=makeZip({...files,'xl/worksheets/sheet1.xml':sheet.replace('</worksheet>','<mergeCells><mergeCell ref="AQ2:AR2"/></mergeCells></worksheet>')});
 await assert.rejects(exportar({archivo:data,hoja:'Final & otra',observaciones:[{fila:2,seccion:'D',texto:'=2+2'}]}),/celda combinada/);
 const result=await leerFilas({archivo:await exportar({archivo:original,hoja:'Final & otra',observaciones:[{fila:2,seccion:'D',texto:'=2+2'}]})});assert.equal(result.filas[1][43],'D: =2+2');
});
test('la plantilla contiene las 18 semanas y S19, con instrucciones y sin filas ficticias',async()=>{
 const plantilla=crearPlantilla(),r=await leerFilas({archivo:plantilla});
 assert.equal(r.hoja,'Distribución');assert.equal(r.filas.length,1);assert.equal(r.filas[0][24],'HH S1');assert.equal(r.filas[0][41],'HH S18');assert.equal(r.filas[0][42],'HH S19');assert.equal(r.filas[0][43],'Observación');
 const ayuda=await leerFilas({archivo:plantilla,hoja:'Instrucciones'});assert.ok(ayuda.filas.some(f=>String(f[0]).includes('SUMA(Y2:AP2)')));
});
