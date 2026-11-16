const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {cargarModulo}=require('./helpers/cargar-modulo');
const {cargarSyncPrueba}=require('./helpers/cargar-sync');

function gestor() {
 const window = {};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../docs/aplicaciones/gestor-secciones.js'),'utf8'),{window});
 const utils=cargarModulo('utils.js','PlanificadorUtils');
 return window.PlanhorAplicaciones['gestor-secciones'].create(utils);
}
function muestra(){return {version:1,archivo:'ejemplo.xlsx',hoja:'Final',huellaArchivo:'a'.repeat(64),filas:[{id:'f1',fila:2,plan:'PLAN-1',semestre:'2',codigo:'A01',asignatura:'Ejemplo',area:'A',ubicacion:'Taller',semanas:[4,null,...Array(16).fill(0)],horasSemanales:4,maxDiarias:4,totalDeclarado:4,salaIds:['s1','s2']}],observaciones:[{id:'o1',filaId:'f1',seccionId:'sec-1',texto:'Sala alternativa por disponibilidad'}]};}
test('normalizar el gestor preserva recomendaciones, relaciones y observaciones',()=>{
 const distribucion=muestra();
 const actual={cargas:[],ids:[],filas:[],enlacesManuales:[],distribucionEspacios:distribucion};
 const normalizado=gestor().normalizarGestorSeccionesData(actual);
 assert.equal(JSON.stringify(normalizado.distribucionEspacios),JSON.stringify(distribucion));
 assert.equal(gestor().normalizarGestorSeccionesData({cargas:[],ids:[]}).distribucionEspacios,undefined);
});
test('la copia por temporada sobrevive la limpieza de restauración dentro de los límites',()=>{
 const {limpiarImportado}=cargarModulo('utils.js','PlanificadorUtils');
 const distribucion=muestra();
 const respaldo={temporadaData:{t1:{gestorSecciones:{distribucionEspacios:distribucion}}}};
 const limpio=limpiarImportado(JSON.parse(JSON.stringify(respaldo)));
 assert.equal(JSON.stringify(limpio.temporadaData.t1.gestorSecciones.distribucionEspacios),JSON.stringify(distribucion));
});
test('sync fusiona filas y observaciones independientes e identifica conflictos en la misma fila',()=>{
 const sync=cargarSyncPrueba();
 const wrap=d=>({temporadaData:{t1:{gestorSecciones:{distribucionEspacios:d}}}});
 const base=muestra(),local=structuredClone(base),remoto=structuredClone(base);
 local.filas.push({...structuredClone(base.filas[0]),id:'f2',fila:3});
 remoto.observaciones.push({id:'o2',filaId:'f1',seccionId:'sec-2',texto:'Otra sala'});
 const fusion=sync.fusionarTresVias(wrap(base),wrap(local),wrap(remoto));
 assert.equal(fusion.conflictos.length,0);
 const salida=fusion.fusion.temporadaData.t1.gestorSecciones.distribucionEspacios;
 assert.equal(salida.filas.length,2);assert.equal(salida.observaciones.length,2);
 const otro=structuredClone(base);otro.filas[0].salaIds=['s3'];
 const uno=structuredClone(base);uno.filas[0].salaIds=['s4'];
 assert.ok(sync.fusionarTresVias(wrap(base),wrap(uno),wrap(otro)).conflictos.length>0);
});
