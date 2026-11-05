const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../docs/planificador_modulos/app.js'),'utf8');
const contract=source.slice(source.indexOf('    function publicarCuentaActual(){'),source.indexOf('    function createHeader(){'));
function setup(result=true){
 const data={planificaciones:[{id:'bloque',dia:0}],configuracion:{bloquesDiariosMax:13,perfilesUsuarios:{'actual@demo.invalid':{nombre:'Nombre anterior',ultimaTemporadaId:'t1'},'otra@demo.invalid':{nombre:'Otra cuenta'}}}};
 const document=new EventTarget();let writes=0;
 vm.runInNewContext(contract,{data,document,CustomEvent,window:{_fb:{auth:{currentUser:{email:'actual@demo.invalid'}}}},guardar:async()=>{writes++;return result;}});
 const save=detail=>new Promise(resolve=>{document.addEventListener('planhor:cuenta:guardada',e=>resolve(e.detail),{once:true});document.dispatchEvent(new CustomEvent('planhor:cuenta:guardar',{detail}));});
 return {data,document,save,writes:()=>writes};
}
test('publica el nombre del perfil de la sesión conectada',()=>{
 const s=setup();let identity;
 s.document.addEventListener('planhor:cuenta:actualizada',e=>identity=e.detail);
 s.document.dispatchEvent(new CustomEvent('planhor:cuenta:leer'));
 assert.equal(identity.email,'actual@demo.invalid');assert.equal(identity.nombre,'Nombre anterior');
});
test('solo actualiza el nombre de la cuenta conectada, conservando planificación y perfiles ajenos',async()=>{
 const s=setup();const before=structuredClone(s.data);
 const result=await s.save({nombre:'Nombre nuevo',email:'otra@demo.invalid'});
 assert.equal(result.ok,true);assert.equal(s.writes(),1);
 before.configuracion.perfilesUsuarios['actual@demo.invalid'].nombre='Nombre nuevo';
 assert.deepEqual(structuredClone(s.data),before);
});
test('rechaza nombres vacíos sin guardar ni modificar datos',async()=>{
 const s=setup();const before=structuredClone(s.data);
 const result=await s.save({nombre:'   '});
 assert.equal(result.ok,false);assert.equal(s.writes(),0);assert.deepEqual(s.data,before);
});
test('un guardado rechazado restaura el perfil y no anuncia éxito',async()=>{
 const s=setup(false);const before=structuredClone(s.data);
 const result=await s.save({nombre:'Nombre no guardado'});
 assert.equal(result.ok,false);assert.deepEqual(s.data,before);
});
