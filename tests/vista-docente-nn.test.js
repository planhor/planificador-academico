const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync('docs/planificador_modulos/vista-horario.js','utf8');
const codigo=src.slice(src.indexOf("        const prefijoNN="),src.indexOf('        function getVistaActual(){'));
function fixture(){
 const data={carreras:[{id:'c1',area:'Energía'},{id:'c2',area:'Robótica'}],secciones:[{id:'s1',nombre:'S1'},{id:'s2',nombre:'S2'}],asignaturas:[{id:'a',area:'especialidad',codigo:'A',nombre:'Uno'},{id:'b',area:'especialidad',codigo:'B',nombre:'Dos'},{id:'c',area:'transversal',codigo:'C',nombre:'Tres'}],salas:[{id:'r',nombre:'101'}],gruposDictacion:[{seccionMadreId:'s1',asignaturaId:'a',seccionesVinculadasIds:['s2']}],planificaciones:[{id:'p1',docenteId:'nn',seccionId:'s1',asignaturaId:'a',dia:0,bloque:1,salaId:'r'},{id:'p2',docenteId:'nn',seccionId:'s1',asignaturaId:'b',dia:0,bloque:1,salaId:'r'},{id:'p3',docenteId:'nn',seccionId:'s2',asignaturaId:'c',dia:0,bloque:1,salaId:'r'},{id:'p4',docenteId:'doc',seccionId:'s1',asignaturaId:'a',dia:0,bloque:1}]};
 const ctx={DOCENTE_NN_ID:'nn',DIAS:['Lunes'],BLOQUES:[{n:1,inicio:'08:00',fin:'08:45'}]};
 ctx.formatearHojaHorario=ws=>ws; const XLSX={utils:{aoa_to_sheet:matriz=>({matriz})}}; const sandbox={ctx,XLSX,areaCarrera:c=>c?.area||'Sin área',mismoId:(a,b)=>String(a??'')===String(b??''),contextoSeccion:id=>({carrera:data.carreras.find(x=>x.id===(id==='s1'?'c1':'c2'))})};
 sandbox.document={createElement:()=>({lastElementChild:{textContent:''}})};
 sandbox.llenarCeldaPlanificada=item=>{item.lastElementChild.textContent='original';};
 vm.runInNewContext(src.slice(src.indexOf('        function componentesSubseccion('),src.indexOf('        function areaCarrera('))+codigo+';this.api={opcionesNN,planesDocenteVista,matrizNN,detalleNN,hojaHorarioVista,llenarCeldaVista,vistaNNTransversal,prefijoNN}',sandbox);
 return {api:sandbox.api,data};
}
test('NN por área incluye vinculadas sin duplicar y sin afectar docentes reales',()=>{const {api,data}=fixture();let before=JSON.stringify(data);assert.deepEqual(Array.from(api.planesDocenteVista(data,api.prefijoNN+'Energía'),p=>p.id),['p1','p2']);assert.deepEqual(Array.from(api.planesDocenteVista(data,api.prefijoNN+'Robótica'),p=>p.id),['p1']);assert.deepEqual(Array.from(api.planesDocenteVista(data,'doc'),p=>p.id),['p4']);assert.equal(JSON.stringify(data),before)});
test('separa transversales y matriz de Excel conserva coincidencias y sección',()=>{const {api,data}=fixture();const trans=api.planesDocenteVista(data,api.vistaNNTransversal);assert.deepEqual(Array.from(trans,p=>p.id),['p3']);const planes=api.planesDocenteVista(data,api.prefijoNN+'Energía');const contenido=api.matrizNN(planes,data)[1][1];assert.match(contenido,/A - Uno · S1, S2 · 101/);assert.match(contenido,/B - Dos · S1 · 101/);assert.match(contenido,/\n/);});

test('NN por área incluye electivas de origen sin incluirlas en transversales',()=>{const {api,data}=fixture();data.asignaturas.push({id:'e',area:'electiva',codigo:'ELEC',nombre:'Electiva'});data.planificaciones.push({id:'pe',docenteId:'nn',seccionId:'s1',asignaturaId:'e',dia:0,bloque:1,salaId:'r'});const before=JSON.stringify(data);assert.deepEqual(Array.from(api.planesDocenteVista(data,api.prefijoNN+'Energía'),p=>p.id),['p1','p2','pe']);assert.deepEqual(Array.from(api.planesDocenteVista(data,api.prefijoNN+'Robótica'),p=>p.id),['p1']);assert.deepEqual(Array.from(api.planesDocenteVista(data,api.vistaNNTransversal),p=>p.id),['p3']);assert.equal(JSON.stringify(data),before)});
test('Excel NN identifica subsección en horario y detalle',()=>{const {api,data}=fixture();data.asignaturaSeccion=[{asignaturaId:'a',seccionId:'s1',usaSubsecciones:true,componentesSubseccion:[{id:'g1',nombre:'Grupo 1',alumnos:20}]}];data.planificaciones[0].componenteId='g1';const planes=api.planesDocenteVista(data,api.prefijoNN+'Energía');const hoja=api.hojaHorarioVista(planes,'docente',api.prefijoNN+'Energía',data);assert.match(hoja.matriz[1][1],/Grupo 1/);assert.match(api.detalleNN(planes,data)[1][2],/Grupo 1/);assert.doesNotMatch(api.detalleNN(planes,data)[2][2],/Grupo 1/)});
test('hoja NN incluye detalle y aumenta altura con coincidencias',()=>{const {api,data}=fixture();const id=api.prefijoNN+'Energía';const planes=api.planesDocenteVista(data,id);const hoja=api.hojaHorarioVista(planes,'docente',id,data);assert.ok(hoja['!rows'][1].hpt>38);const detalle=api.detalleNN(planes,data);assert.equal(detalle.length,3);assert.match(detalle[1][2],/S1, S2/);});


test('electiva vinculada aparece una vez con destino en vista y Excel y en ambas áreas',()=>{
 const {api,data}=fixture();
 data.asignaturas.push({id:'e',area:'electiva',codigo:'ELEC',nombre:'Electiva'});
 data.planificaciones.push({id:'pe',docenteId:'nn',seccionId:'s1',asignaturaId:'e',dia:0,bloque:1,salaId:'r'});
 data.vinculosElectivos=[{id:'v1',asignaturaId:'e',seccionOrigenId:'s1',seccionDestinoId:'s2',origen:'manual'}, {id:'v2',asignaturaId:'e',seccionOrigenId:'s1',seccionDestinoId:'s2',origen:'migracion'}, {id:'v3',asignaturaId:'b',seccionOrigenId:'s2',seccionDestinoId:'s1',origen:'manual'}];
 const before=JSON.stringify(data);
 const origen=api.planesDocenteVista(data,api.prefijoNN+'Energía');
 const destino=api.planesDocenteVista(data,api.prefijoNN+'Robótica');
 assert.equal(origen.filter(p=>p.id==='pe').length,1);
 assert.match(api.detalleNN(origen.filter(p=>p.id==='pe'),data)[1][2],/^ELEC - Electiva · S1, S2 · 101$/);
 assert.equal(destino.filter(p=>p.id==='pe').length,1);
 const electiva=destino.filter(p=>p.id==='pe');
 const cell={classList:{add(){}},appendChild(item){this.items.push(item)},items:[]};
 api.llenarCeldaVista(cell,electiva,'docente',data,true);
 assert.equal(cell.items.length,1);
 assert.equal(cell.items[0].lastElementChild.textContent,'S1, S2');
 assert.match(cell.items[0].title,/ELEC - Electiva · S1, S2 · 101/);
 assert.match(api.hojaHorarioVista(electiva,'docente',api.prefijoNN+'Robótica',data).matriz[1][1],/^ELEC - Electiva · S1, S2 · 101$/);
 assert.match(api.detalleNN(electiva,data)[1][2],/^ELEC - Electiva · S1, S2 · 101$/);
 assert.match(api.detalleNN(origen.filter(p=>p.id==='p2'),data)[1][2],/^B - Dos · S1 · 101$/);
 assert.equal(JSON.stringify(data),before);
 data.gruposDictacion.push({seccionMadreId:'s1',asignaturaId:'e',seccionesVinculadasIds:['s2']});
 const conGrupo=JSON.stringify(data);
 assert.match(api.detalleNN(electiva,data)[1][2],/^ELEC - Electiva · S1, S2 · 101$/);
 assert.equal(api.planesDocenteVista(data,api.prefijoNN+'Robótica').filter(p=>p.id==='pe').length,1);
 assert.equal(JSON.stringify(data),conGrupo);
});


test('selección NN masiva recorre vínculos de forma acotada y refleja cambios',()=>{
 const {api,data}=fixture(); let lecturas=0;
 data.gruposDictacion=[];
 data.asignaturas=[{id:7,area:'electiva',codigo:'E',nombre:'Electiva'}];
 data.planificaciones=Array.from({length:3000},(_,i)=>({id:'p'+i,docenteId:'nn',seccionId:'s1',asignaturaId:'7',dia:0,bloque:1}));
 data.vinculosElectivos=Array.from({length:10000},(_,i)=>({get seccionOrigenId(){lecturas++;return i<2?'s1':'otra'},asignaturaId:i<2?7:'otra',seccionDestinoId:'s2'}));
 const inicio=performance.now();
 const seleccion=api.planesDocenteVista(data,api.prefijoNN+'Robótica');
 const duracion=performance.now()-inicio;
 assert.equal(seleccion.length,3000);
 assert.match(api.detalleNN([seleccion[0]],data)[1][2],/S1, S2/);
 console.log(`NN masiva: ${lecturas} lecturas de origen, ${duracion.toFixed(1)} ms`);
 assert.ok(lecturas<=20000,`recorridos repetidos: ${lecturas} lecturas`);
 data.vinculosElectivos=[];
 assert.equal(api.planesDocenteVista(data,api.prefijoNN+'Robótica').length,0);
});
