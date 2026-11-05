const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function setup(){
 let clean=0;
 const data={gestorSecciones:{cargas:[{id:'c',archivo:'prueba.xlsx',fecha:'2026-01-01'}],ultimaCargaId:'c',filas:Array.from({length:264},(_,i)=>({cargaId:'c',idSeccion:String(i),codigoAsignatura:'A'+i})),ids:Array.from({length:154},(_,i)=>({idSeccion:String(i),cargaId:'c',estado:'resuelta'})),enlacesManuales:[]}};
 const nodes=new Map();const document={getElementById:id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:''});return nodes.get(id);}};
 const shared={data,limpiarTexto:(v,max=1000)=>{clean++;return String(v??'').trim().slice(0,max);},genId:()=> 'g',escapeHTML:v=>String(v??''),escapeAttr:v=>String(v??''),textoGestor:v=>String(v??'').trim()};
 const window={PlanhorAplicaciones:{}};vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../docs/aplicaciones/gestor-secciones.js'),'utf8'),{window,document,console});
 const api=window.PlanhorAplicaciones['gestor-secciones'].create(shared);Object.assign(shared,api);
 for(const key of ['renderBuscadorIdGestor','renderPendientesGestor','renderRelacionesGestor','renderProyeccionGestor','renderTablaGestorSecciones'])shared[key]=()=>{data.gestorSecciones=api.normalizarGestorSeccionesData(data.gestorSecciones);};
 return {api,shared,data,nodes,get clean(){return clean;},reset(){clean=0;}};
}
test('un render normaliza una sola vez, conserva datos y recalcula enlaces al siguiente render',()=>{
 const s=setup();s.data.gestorSecciones=s.api.normalizarGestorSeccionesData(s.data.gestorSecciones);const expected=JSON.stringify(s.data),one=s.clean;
 s.reset();s.api.renderGestorSecciones();assert.equal(s.clean,one);assert.equal(JSON.stringify(s.data),expected);
 assert.match(s.nodes.get('gestorResumen').innerHTML,/IDs resueltas<\/span><strong[^>]*>154<\/strong>/);
 s.data.gestorSecciones.enlacesManuales.push({idSeccion:'0',cargaId:'c',tipo:'externa',seccionNombre:'Externa'});
 s.api.renderGestorSecciones();assert.match(s.nodes.get('gestorResumen').innerHTML,/Memoria manual<\/span><strong[^>]*>1<\/strong>/);
 assert.equal(s.api.getEnlaceManualGestor('0','c').seccionNombre,'Externa');
});
test('la reutilización termina incluso si falla una vista secundaria',()=>{
 const s=setup();s.shared.renderPendientesGestor=()=>{throw new Error('vista fallida');};assert.throws(()=>s.api.renderGestorSecciones(),/vista fallida/);
 s.data.gestorSecciones.filas.push({cargaId:'c',idSeccion:'  nueva  '});s.reset();
 const result=s.api.normalizarGestorSeccionesData(s.data.gestorSecciones);assert.ok(s.clean>0);assert.notEqual(result,s.data.gestorSecciones);assert.equal(result.filas.at(-1).idSeccion,'nueva');
});
