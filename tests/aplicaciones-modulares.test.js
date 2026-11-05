const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {cargarModulo}=require('./helpers/cargar-modulo');
const docs=path.resolve(__dirname,'../docs');
test('cada aplicación extraída carga antes de su adaptador y existe una sola definición',()=>{
 const index=fs.readFileSync(path.join(docs,'index.html'),'utf8');
 const mapa=JSON.parse(fs.readFileSync(path.join(docs,'aplicaciones/mapa.json'),'utf8'));
 for(const app of mapa){
  assert.ok(index.indexOf(`src="${app.file}?`)<index.indexOf(`src="planificador_modulos/${app.owner}?`));
  const body=fs.readFileSync(path.join(docs,app.file),'utf8');
  for(const name of app.functions)assert.ok(body.includes(`function ${name}(`),name);
 }
});
test('el módulo de Salas conserva estado compartido, validación y aislamiento entre instancias',()=>{
 const dataA={salas:[],planificaciones:[{id:'original'}]},dataB={salas:[]};
 const fields={nomSala:{value:'Sala nueva'},capSala:{value:'35'},tipoSala:{value:'Sala de Clases'}};
 const factory=cargarModulo('entidades.js','PlanificadorEntidades',{document:{getElementById:id=>fields[id]}});
 let savesA=0,savesB=0;
 const context=(data,save)=>({getData:()=>data,genId:()=> 'nueva',guardar:save,cerrarModal(){},refrescarTodo(){},toast(){}});
 const a=factory.create(context(dataA,()=>savesA++)),b=factory.create(context(dataB,()=>savesB++));
 a.guardarSala(null);
 assert.equal(dataA.salas.length,1);assert.equal(dataB.salas.length,0);
 assert.deepEqual(dataA.planificaciones,[{id:'original'}]);assert.equal(savesA,1);
 a.guardarSala(null);assert.equal(dataA.salas.length,1);assert.equal(savesA,1);
 fields.capSala.value='0';b.guardarSala(null);assert.equal(savesB,0);
 fields.capSala.value='35';b.guardarSala(null);assert.equal(savesB,1);assert.equal(dataB.salas.length,1);
});
