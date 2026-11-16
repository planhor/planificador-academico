const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const contexto = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../docs/aplicaciones/distribucion-espacios.js'),'utf8'),contexto);
const {analizar,evaluarSeccion,obtenerSeguimiento,espaciosSinRelacion}=contexto.window.PlanhorDistribucionEspacios;
const semanas=(primera)=>[primera,...Array(17).fill(0)];
const espacios=[{ubicacion:'Laboratorio',semanas:semanas(4),salaIds:['1']},{ubicacion:'Taller',semanas:semanas(2),salaIds:['2']}];
const salas=[{id:'1',nombre:'101'},{id:'2',nombre:'102'},{id:'3',nombre:'103'},{id:'4',nombre:'TRO2'}];
test('la semana vacía es cero y la diferencia de HH no se presenta como avance pendiente',()=>{
 const header=['Plan Código','Semestre','Código de Asignatura','HH Totales','Ubicación',...Array.from({length:18},(_,i)=>`HH S${i+1}`)];
 const resultado=analizar([header,['PLAN-1','2','A',72,'Laboratorio',4,...Array(17).fill(null)]]);
 assert.equal(resultado.asignaturas[0].espacios[0].semanas[1],0);
 assert.equal(resultado.asignaturas[0].alertas.some(a=>a.tipo==='horas_no_cuadran'),false);
});
test('distingue espacios sin vínculo, planificación pendiente y sala provisional',()=>{
 assert.equal(evaluarSeccion([{...espacios[0],salaIds:[]}],[],salas).estado,'sin_relacion');
 assert.equal(evaluarSeccion(espacios,[],salas).estado,'sin_planificacion');
 assert.equal(evaluarSeccion(espacios,[{salaId:'4'}],salas).estado,'sala_pendiente');
 assert.equal(evaluarSeccion(espacios,[{salaId:'borrada'}],salas).estado,'sala_pendiente');
});
test('identifica asignaciones compatibles, distintas y cobertura parcial',()=>{
 assert.equal(evaluarSeccion(espacios,[{salaId:'1'},{salaId:'2'}],salas).estado,'coincide');
 assert.equal(evaluarSeccion(espacios,[{salaId:'1'}],salas).estado,'revision_parcial');
 assert.equal(evaluarSeccion(espacios,[{salaId:'1'},{salaId:'3'}],salas).estado,'sala_distinta');
 assert.equal(evaluarSeccion(espacios,[{salaId:'1',tipoPresencial:false}],salas).estado,'sin_planificacion');
});
test('no supone cumplimiento de semanas reales con la semana ideal',()=>{
 assert.equal(evaluarSeccion(espacios,[{salaId:'1'}],salas,2).estado,'sin_datos');
});
test('consulta la sección por plan completo y recupera bloques heredados sin mezclar planes',()=>{
 const filas=[{id:'f1',plan:'PLAN-1',semestre:'1',codigo:'A01',asignatura:'A',ubicacion:'Lab',semanas:semanas(4),salaIds:['1']},{id:'f2',plan:'PLAN-1',semestre:'1',codigo:'A01',asignatura:'A',ubicacion:'Taller',semanas:semanas(0),salaIds:[]}];
 const d={gestorSecciones:{distribucionEspacios:{filas,observaciones:[{id:'o',filaId:'f1',seccionId:'s2',texto:'Cambio justificado'}]}},carreras:[{id:'c1',codigo:'PLAN-1'},{id:'c2',codigo:'PLAN-2'}],niveles:[{id:'n1',nombre:'N1',carreraId:'c1'},{id:'n2',nombre:'N1',carreraId:'c2'}],secciones:[{id:'s1',nombre:'D-1',nivelId:'n1'},{id:'s2',nombre:'V-1',nivelId:'n1'},{id:'s3',nombre:'Otra',nivelId:'n2'}],asignaturas:[{id:'a',codigo:'A01'}],asignaturaCarreraNivel:[{carreraId:'c1',nivelId:'n1',asignaturaId:'a'}],asignaturaSeccion:[],salas,planificaciones:[{seccionId:'s1',asignaturaId:'a',salaId:'1'}],gruposDictacion:[{seccionMadreId:'s1',seccionesVinculadasIds:['s2'],asignaturaId:'a'}]};
 d.sel={temporadaId:'t1'};d.distribucionesEspaciosPorTemporada={t1:d.gestorSecciones.distribucionEspacios};
 const out=obtenerSeguimiento(d);assert.equal(out.length,2);assert.equal(out.find(x=>x.seccionId==='s2').estado,'coincide');assert.equal(out.find(x=>x.seccionId==='s2').observaciones[0].texto,'Cambio justificado');assert.equal(espaciosSinRelacion(d).length,1);
});
test('no atribuye una recomendación cuando el nivel o código es ambiguo',()=>{
 const d={gestorSecciones:{distribucionEspacios:{filas:[{id:'f',plan:'X-1',semestre:'1',codigo:'A',semanas:semanas(1),salaIds:[]}]}},carreras:[{id:'c',codigo:'X-1'}],niveles:[{id:'n1',carreraId:'c',nombre:'N1'},{id:'n2',carreraId:'c',nombre:'1'}],asignaturas:[{id:'a',codigo:'A'}],salas:[]};
 d.sel={temporadaId:'t1'};d.distribucionesEspaciosPorTemporada={t1:d.gestorSecciones.distribucionEspacios};
 assert.equal(obtenerSeguimiento(d)[0].estado,'sin_datos');
});
test('TRO2 y recursos eliminados siempre quedan pendientes',()=>{
 const s=[{id:'__tro2__',nombre:'TRO2 (Terreno)',ilimitada:true}];
 assert.equal(evaluarSeccion([{ubicacion:'Lab',semanas:semanas(4),salaIds:['__tro2__']}],[],s).estado,'sin_relacion');
 assert.equal(evaluarSeccion([{ubicacion:'Lab',semanas:semanas(4),salaIds:['1']}],[{salaId:'__tro2__'}],[...s,{id:'1',nombre:'101'}]).estado,'sala_pendiente');
});
