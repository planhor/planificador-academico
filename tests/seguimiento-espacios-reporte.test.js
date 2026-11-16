const test=require('node:test');
const assert=require('node:assert/strict');
const {cargarModulo}=require('./helpers/cargar-modulo');
const {crearDatosMasivos}=require('./fixtures/datos-masivos');
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

test('el reporte muestra recomendación y observación, sin ocultar cambios detrás de la caché',()=>{
 const data=crearDatosMasivos({carreras:1,nivelesPorCarrera:1,seccionesPorNivel:1});
 let estado='sala_distinta';
 const ventana={PlanhorDistribucionEspacios:{obtenerSeguimiento:()=>[{plan:'PLAN-1',semestre:'2',codigo:'A1',asignatura:'Asignatura',seccionId:'s1',seccionNombre:'D-1',asignaturaId:'a1',estado,espaciosRecomendados:['Laboratorio'],salasAsignadas:['101'],observaciones:'Sin disponibilidad'}]}};
 const factory=cargarModulo('reportes.js','PlanificadorReportes',{window:ventana});
 const api=factory.create({getData:()=>data,getPlanificaciones:()=>data.planificaciones,getContadorDocente:()=>({}),escapeHTML:escape,escapeAttr:escape});
 const primero=api.obtenerDatosReporte('seguimientoEspacios');
 assert.equal(primero.datos.length,1);
 assert.equal(primero.datos[0][5],'Laboratorio');
 assert.equal(primero.datos[0][6],'101');
 assert.equal(primero.datos[0][7],'Sala distinta');
 assert.equal(primero.datos[0][10],'Sin disponibilidad');
 assert.match(primero.datos[0][11].html,/data-seccion="s1"/);
 estado='coincide';
 assert.equal(api.obtenerDatosReporte('seguimientoEspacios').datos[0][7],'Salas coincidentes');
});
