const test=require('node:test');
const assert=require('node:assert/strict');
const {crearDatosBase}=require('./fixtures/datos-base');
const {crearPlanificacionPrueba}=require('./helpers/crear-planificacion');
function escenario(opciones={}){
 const data=crearDatosBase();data.sel.temporadaId='temp-1';
 data.salas.push({id:'destino',nombre:'Sala 203',capacidad:40,tipoSala:'Sala de Clases'});
 const base={seccionId:'sec-1',asignaturaId:'asi-1',docenteId:'doc-1',salaId:'sala-1',dia:0,tipoPresencial:true};
 data.planificaciones=[{...base,id:'p1',bloque:1},{...base,id:'p2',bloque:2},{...base,id:'otro-dia',dia:1,bloque:1},{...base,id:'otro-comp',componenteId:'comp-2',bloque:3}];
 const env=crearPlanificacionPrueba(data,opciones),calls={undo:0,guardar:0,indices:0};
 env.ctx.pushUndo=meta=>{calls.undo++;calls.meta=meta;};env.ctx.guardar=async()=>{calls.guardar++;return opciones.guardado!==false;};env.ctx.reconstruirIndices=()=>calls.indices++;
 return {...env,data,calls};
}
test('organizador mueve salaId y preserva bloques, docente, sección, componentes y selección',async()=>{
 const {api,data,calls}=escenario();const before=structuredClone(data.planificaciones),sel=structuredClone(data.sel);
 const r=await api.aplicarOrganizarSalas('p1','destino');assert.equal(r.ok,true);assert.equal(r.cantidad,2);
 for(const p of data.planificaciones){const original=before.find(x=>x.id===p.id);assert.deepEqual(p,{...original,salaId:['p1','p2'].includes(p.id)?'destino':original.salaId});}
 assert.deepEqual(data.sel,sel);assert.equal(calls.undo,1);assert.equal(calls.guardar,1);assert.equal(calls.indices,1);assert.equal(calls.meta.tipo,'organizar_salas');
});
test('un tope de sala en cualquier bloque rechaza todo el grupo sin historial ni guardado',async()=>{
 const {api,data,calls}=escenario();data.planificaciones.push({id:'ocupado',salaId:'destino',dia:0,bloque:2,esCargaExterna:true});
 const before=JSON.stringify(data.planificaciones);const r=await api.aplicarOrganizarSalas('p1','destino');assert.equal(r.ok,false);assert.match(r.msg,/ocupada/);
 assert.equal(JSON.stringify(data.planificaciones),before);assert.equal(calls.undo,0);assert.equal(calls.guardar,0);
});
test('un bloque fijo del mismo grupo impide mover también los libres',async()=>{
 const {api,data,calls}=escenario();data.planificaciones[1].fijo=true;
 assert.equal((await api.aplicarOrganizarSalas('p1','destino')).ok,false);assert.equal(data.planificaciones[0].salaId,'sala-1');assert.equal(calls.undo,0);
});
test('protege heredadas, virtuales y cargas externas',async()=>{
 const {api,data,calls}=escenario();data.gruposDictacion.push({id:'g',asignaturaId:'asi-1',seccionMadreId:'madre',seccionesVinculadasIds:['sec-1']});
 assert.match(api.validarOrganizarSalas('p1','destino').msg,/madre/);data.gruposDictacion=[];
 assert.equal(api.validarOrganizarSalas('p1','sala-virtual').ok,false);data.planificaciones[0].esCargaExterna=true;
 assert.equal(api.grupoOrganizarSalas('p1').length,0);assert.equal((await api.aplicarOrganizarSalas('p1','destino')).ok,false);assert.equal(calls.guardar,0);
});
test('capacidad mantiene la confirmación actual y cancelar no escribe',async()=>{
 const {api,data,calls}=escenario({confirm:()=>false});data.salas.find(s=>s.id==='destino').capacidad=20;
 data.gruposDictacion.push({id:'g',asignaturaId:'asi-1',seccionMadreId:'sec-1',seccionesVinculadasIds:[],alumnosTotales:50});
 const check=api.validarOrganizarSalas('p1','destino');assert.equal(check.ok,true);assert.match(check.advertencia,/50/);
 assert.equal((await api.aplicarOrganizarSalas('p1','destino')).ok,false);assert.equal(calls.undo,0);assert.equal(calls.guardar,0);
});
test('temporada y snapshot protegen contra un arrastre obsoleto',async()=>{
 const {api,data,calls}=escenario();assert.equal((await api.aplicarOrganizarSalas('p1','destino',{temporadaId:'otra'})).ok,false);
 const bloques=structuredClone(api.grupoOrganizarSalas('p1'));data.planificaciones[1].bloque=4;
 assert.equal((await api.aplicarOrganizarSalas('p1','destino',{temporadaId:'temp-1',bloques})).ok,false);assert.equal(calls.guardar,0);
});
test('el fallo de sincronización informa cambio local sin duplicar el historial',async()=>{
 const {api,data,calls}=escenario({guardado:false});const r=await api.aplicarOrganizarSalas('p1','destino');
 assert.equal(r.ok,true);assert.equal(r.guardado,false);assert.match(r.msg,/localmente/);assert.equal(data.planificaciones[0].salaId,'destino');assert.equal(calls.undo,1);
});
test('consultar destinos no modifica datos ni historial',()=>{
 const {api,data,calls}=escenario();const before=JSON.stringify(data);assert.equal(api.validarOrganizarSalas('p1','destino').ok,true);
 assert.equal(JSON.stringify(data),before);assert.equal(calls.undo,0);assert.equal(calls.guardar,0);
});

test('el traslado se refleja una vez antes de completar el guardado remoto',async()=>{
 const {api,data,ctx,calls}=escenario();
 let terminar;const remoto=new Promise(resolve=>{terminar=resolve;});
 let renders=0;let guardando=false;
 ctx.refrescarTodo=()=>{renders++;assert.equal(data.planificaciones[0].salaId,'destino');assert.equal(calls.indices,1);};
 ctx.guardar=()=>{guardando=true;return remoto;};
 const pendiente=api.aplicarOrganizarSalas('p1','destino');
 assert.equal(guardando,true);assert.equal(renders,1);assert.equal(calls.undo,1);
 terminar(false);const resultado=await pendiente;
 assert.equal(resultado.ok,true);assert.equal(resultado.guardado,false);assert.equal(renders,1);
 assert.match(resultado.msg,/sincronización pendiente/);
});
