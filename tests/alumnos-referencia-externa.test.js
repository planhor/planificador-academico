const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const window={PlanhorAplicaciones:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../docs/aplicaciones/secciones.js'),'utf8'),{window,console});
function fixture(){
 const asig={id:'a',codigo:'ATGP01'},sec={id:'s',nivelId:'n',jornada:'diurna'};
 const row=(more)=>({cargaId:'carga',idSeccion:'67088455',codigoAsignatura:'ATGP01',...more});
 const data={asignaturaSeccion:[{asignaturaId:'a',seccionId:'s',idGestor:'67088455',origen:'gestor-heredada-externa'}],niveles:[{id:'n',nombre:'N7',carreraId:'c'}],carreras:[{id:'c',codigo:'IEL-IEL-2'}],gestorSecciones:{ultimaCargaId:'carga',cargas:[{id:'carga',archivo:'Gestor.xlsx'}],ids:[{cargaId:'carga',idSeccion:'67088455',asignaturaCodigo:'ATGP01',estado:'pendiente_externa',madreDetectada:'D-AGA-N5-P1-C4(F)'}],filas:[row({tipo:'Planificada',seccion:'D-AGA-N5-P1-C4(F)',alumnos:14,alumnosTotales:44}),row({tipo:'Fusionada',programaPlan:'IEL-IEL-2',nivel:'7',jornada:'DIURNA',alumnos:11})]}};
 const shared={getData:()=>data,jornadaSeccion:s=>s.jornada,asignaturaAplicaSeccion:()=>true,relacionAsignaturaSeccion:()=>data.asignaturaSeccion[0],ctx:{getEstadoDictacionAsignatura:()=>({estado:'sin-grupo',grupo:null}),escapeHTML:s=>String(s),escapeAttr:s=>String(s)}};
 const api=window.PlanhorAplicaciones.secciones.create(shared);shared.resumenAlumnosGrupoDictacion=api.resumenAlumnosGrupoDictacion;return {data,asig,sec,api,shared};
}
test('muestra referencia externa y no modifica datos',()=>{const {data,asig,sec,api}=fixture(),antes=JSON.stringify(data),ref=api.referenciaMadreExterna(asig,sec);assert.equal(ref.total,44);assert.equal(ref.aporte,11);assert.match(api.renderAlumnosDictacion(asig,sec),/44 alumnos en la dictación/);assert.match(api.renderEstadoDictacion(asig,sec),/Madre externa pendiente/);assert.equal(JSON.stringify(data),antes);});
test('no inventa cifras ante madres o aportes ambiguos',()=>{const {data,asig,sec,api}=fixture();data.gestorSecciones.filas.push({...data.gestorSecciones.filas[1]});assert.equal(api.referenciaMadreExterna(asig,sec).aporte,null);data.gestorSecciones.filas.push({...data.gestorSecciones.filas[0]});assert.equal(api.referenciaMadreExterna(asig,sec).total,null);});
test('exige carga, ID, código y referencia externa vigentes, respeta desvinculación',()=>{const {data,asig,sec,api}=fixture();data.asignaturaSeccion[0].fusionDesvinculada=true;assert.equal(api.referenciaMadreExterna(asig,sec),null);data.asignaturaSeccion[0].fusionDesvinculada=false;data.gestorSecciones.ids[0].asignaturaCodigo='OTRA';assert.equal(api.referenciaMadreExterna(asig,sec),null);data.gestorSecciones.ids[0].asignaturaCodigo='ATGP01';data.gestorSecciones.ultimaCargaId='otra';assert.equal(api.referenciaMadreExterna(asig,sec),null);});
test('un grupo local manual mantiene prioridad',()=>{const {asig,sec,api,shared}=fixture();shared.ctx.getEstadoDictacionAsignatura=()=>({estado:'dictada-aqui',grupo:{idGestorSeccion:'67088455',alumnosTotales:9,alumnosManualActivo:true}});const html=api.renderAlumnosDictacion(asig,sec);assert.match(html,/9 alumno/);assert.doesNotMatch(html,/44 alumnos/);});
