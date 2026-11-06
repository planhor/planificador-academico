// El script principal se ejecuta cuando Firebase autoriza al usuario
window._iniciarApp = function() {
if (window._appRuntimeInicializada) return;
window._appRuntimeInicializada = true;
(() => {
    // Adaptador de compatibilidad: las aplicaciones comparten el estado existente.
    const applicationInstances=Object.create(null);
    const applicationServices={
get PLANHOR_COLORES(){return PLANHOR_COLORES;},
get activarTab(){return activarTab;},
get actualizarReporte(){return actualizarReporte;},
get analizarFilaProyeccionGestor(){return analizarFilaProyeccionGestor;},
get analizarGestorSecciones(){return analizarGestorSecciones;},
get aplicarPropuestaGestor(){return aplicarPropuestaGestor;},
get areaAsignaturaGestor(){return areaAsignaturaGestor;},
get asegurarXLSX(){return asegurarXLSX;},
get asignaturaPorCodigoGestor(){return asignaturaPorCodigoGestor;},
get auditoria(){return auditoria;},
get cerrarModal(){return cerrarModal;},
get claseRiesgoProyeccion(){return claseRiesgoProyeccion;},
get codigoCarreraGestor(){return codigoCarreraGestor;},
get colorAsignaturaPlanhor(){return colorAsignaturaPlanhor;},
get confirmarAccionCritica(){return confirmarAccionCritica;},
get construirMemoriaIdsGestor(){return construirMemoriaIdsGestor;},
get crearGrupoDictacion(){return crearGrupoDictacion;},
get crearPuntoRecuperacion(){return crearPuntoRecuperacion;},
get cupoPedagogicoGestor(){return cupoPedagogicoGestor;},
get data(){return data;},set data(value){data=value;},
get datosInformeGestor(){return datosInformeGestor;},
get descargarTablaExcel(){return descargarTablaExcel;},
get descripcionEnlaceManualGestor(){return descripcionEnlaceManualGestor;},
get descripcionMemoriaAplicadaGestor(){return descripcionMemoriaAplicadaGestor;},
get descriptorCarreraRegistroGestor(){return descriptorCarreraRegistroGestor;},
get detectarColumnasGestor(){return detectarColumnasGestor;},
get enlacesManualGestorPorId(){return enlacesManualGestorPorId;},
get esSeccionFusionLiteral(){return esSeccionFusionLiteral;},
get esSeccionRealGestor(){return esSeccionRealGestor;},
get escapeAttr(){return escapeAttr;},
get escapeHTML(){return escapeHTML;},
get especialidadGestor(){return especialidadGestor;},
get estadoVisualGestor(){return estadoVisualGestor;},
get etiquetaEstadoGestor(){return etiquetaEstadoGestor;},
get familiaProgramaGestor(){return familiaProgramaGestor;},
get filasInformeRelacionesGestor(){return filasInformeRelacionesGestor;},
get filtrarRegistrosGestor(){return filtrarRegistrosGestor;},
get filtroCompletoGestor(){return filtroCompletoGestor;},
get formatearHojaInformeGestor(){return formatearHojaInformeGestor;},
get fusionDesvinculadaGestor(){return fusionDesvinculadaGestor;},
get genId(){return genId;},
get getColores(){return getColores;},
get getEnlaceManualGestor(){return getEnlaceManualGestor;},
get getGrupoDictacionAsignaturaSeccion(){return getGrupoDictacionAsignaturaSeccion;},
get getTemporadaLabel(){return getTemporadaLabel;},
get guardar(){return guardar;},
get guardarMemoriaGestor(){return guardarMemoriaGestor;},
get guardarRespaldoAntesDeImportar(){return guardarRespaldoAntesDeImportar;},
get jornadaGestor(){return jornadaGestor;},
get keyEnlaceManualGestor(){return keyEnlaceManualGestor;},
get leerFilaGestor(){return leerFilaGestor;},
get limpiarTexto(){return limpiarTexto;},
get marcaSeccionGestor(){return marcaSeccionGestor;},
get matrizInformeGestor(){return matrizInformeGestor;},
get modalidadAsignaturaGestor(){return modalidadAsignaturaGestor;},
get mostrarPreviewGestorSecciones(){return mostrarPreviewGestorSecciones;},
get mostrarResultadoAplicacionGestor(){return mostrarResultadoAplicacionGestor;},
get nivelGestor(){return nivelGestor;},
get nombreCarreraConPlanGestor(){return nombreCarreraConPlanGestor;},
get nombreCarreraGestor(){return nombreCarreraGestor;},
get nombreHojaGestor(){return nombreHojaGestor;},
get normalizarDatos(){return normalizarDatos;},
get normalizarEncabezadoGestor(){return normalizarEncabezadoGestor;},
get normalizarGestorSeccionesData(){return normalizarGestorSeccionesData;},
get normalizarPropuestaGestor(){return normalizarPropuestaGestor;},
get numeroGestor(){return numeroGestor;},
get obtenerProyeccionGestor(){return obtenerProyeccionGestor;},
get opcionesFiltroGestor(){return opcionesFiltroGestor;},
get parsearSalaReferenciaGestor(){return parsearSalaReferenciaGestor;},
get planCarreraGestor(){return planCarreraGestor;},
get prepararRegistrosAplicacionGestor(){return prepararRegistrosAplicacionGestor;},
get pushUndo(){return pushUndo;},
get reconstruirIndices(){return reconstruirIndices;},
get refrescarTodo(){return refrescarTodo;},
get renderBuscadorIdGestor(){return renderBuscadorIdGestor;},
get renderDashboard(){return renderDashboard;},
get renderGestorSecciones(){return renderGestorSecciones;},
get renderPendientesGestor(){return renderPendientesGestor;},
get renderProyeccionGestor(){return renderProyeccionGestor;},
get renderRelacionesGestor(){return renderRelacionesGestor;},
get renderTablaGestorSecciones(){return renderTablaGestorSecciones;},
get resolverDestinoSeccionesGestor(){return resolverDestinoSeccionesGestor;},
get salaPorReferenciaGestor(){return salaPorReferenciaGestor;},
get seccionBaseSinMarcaGestor(){return seccionBaseSinMarcaGestor;},
get seccionPorNombreGestor(){return seccionPorNombreGestor;},
get sincronizarEspecialidadesDesdeGestor(){return sincronizarEspecialidadesDesdeGestor;},
get tabActivaEs(){return tabActivaEs;},
get textoGestor(){return textoGestor;},
get tieneMarcaFusionGestor(){return tieneMarcaFusionGestor;},
get tipoEspacioDesdeTexto(){return tipoEspacioDesdeTexto;},
get tipoFilaGestor(){return tipoFilaGestor;},
get toast(){return toast;},
get validarPropuestaGestor(){return validarPropuestaGestor;},
get vincularSeccionAGrupo(){return vincularSeccionAGrupo;},
    };
    function applicationModule(name){
        return applicationInstances[name]||(applicationInstances[name]=window.PlanhorAplicaciones[name].create(applicationServices));
    }

    const { genId, escapeHTML, escapeAttr, optionHTML, limpiarTexto, colorSeguro, limpiarImportado } = window.PlanificadorUtils || {};
    const DIAS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const BLOQUES = [
        {n:1,inicio:'08:00',fin:'08:45',hIni:480,hFin:525},{n:2,inicio:'08:45',fin:'09:30',hIni:525,hFin:570},
        {n:3,inicio:'09:40',fin:'10:25',hIni:580,hFin:625},{n:4,inicio:'10:25',fin:'11:10',hIni:625,hFin:670},
        {n:5,inicio:'11:20',fin:'12:05',hIni:680,hFin:725},{n:6,inicio:'12:05',fin:'12:50',hIni:725,hFin:770},
        {n:7,inicio:'13:15',fin:'14:00',hIni:795,hFin:840},{n:8,inicio:'14:00',fin:'14:45',hIni:840,hFin:885},
        {n:9,inicio:'14:55',fin:'15:40',hIni:895,hFin:940},{n:10,inicio:'15:40',fin:'16:25',hIni:940,hFin:985},
        {n:11,inicio:'16:35',fin:'17:20',hIni:995,hFin:1040},{n:12,inicio:'17:20',fin:'18:05',hIni:1040,hFin:1085},
        {n:13,inicio:'18:30',fin:'19:10',hIni:1110,hFin:1150},{n:14,inicio:'19:10',fin:'19:50',hIni:1150,hFin:1190},
        {n:15,inicio:'19:50',fin:'20:30',hIni:1190,hFin:1230},{n:16,inicio:'20:30',fin:'21:10',hIni:1230,hFin:1270},
        {n:17,inicio:'21:10',fin:'21:50',hIni:1270,hFin:1310},{n:18,inicio:'21:50',fin:'22:30',hIni:1310,hFin:1350}
    ];
    const SALA_VIRTUAL_ID = '__virtual__';
    const SALA_TRO2_ID = '__tro2__';
    const DOCENTE_NN_ID = '__docente_nn__';
    function getBloque(n) { return BLOQUES.find(b => b.n === n); }
    const MAX_UNDO = 50;
    let undoStack = [], redoStack = [];
    const CAMPOS_UNDO = ['carreras','niveles','secciones','asignaturas','docentes','salas','asignaturaCarreraNivel','asignaturaSeccion','planificaciones','gruposDictacion','vinculosElectivos','gestorSecciones','ultimoAutoGeneral','ultimaAutoEjecucion','autoEjecuciones','sel'];
    const TAB_LABELS = {dashboard:'Dashboard',secciones:'Secciones',asignaturas:'Asignaturas',docentes:'Docentes',salas:'Salas',organizarSalas:'Optimizador manual',planificacion:'Planificación',vistaHorarios:'Vista Horarios',reportes:'Reportes',gestorSecciones:'Gestor Secciones',historial:'Historial',fichaDocente:'Ficha Docente'};
    function tabActualId(){ return document.querySelector('.tab-btn.active')?.dataset?.tab || 'sistema'; }
    function tabLabel(tab){ return TAB_LABELS[tab] || tab || 'Sistema'; }
    function snapshotUndo(){
        const snap={};
        CAMPOS_UNDO.forEach(k=>{ snap[k]=JSON.parse(JSON.stringify(data?.[k] ?? (Array.isArray(data?.[k])?[]:null))); });
        return snap;
    }
    function restaurarSnapshotUndo(snap){
        if(!snap) return;
        CAMPOS_UNDO.forEach(k=>{
            if(Object.prototype.hasOwnProperty.call(snap,k)) data[k]=JSON.parse(JSON.stringify(snap[k]));
        });
    }
    function describirAccionUndo(meta={}){
        return limpiarTexto(meta.resumen||meta.tipo||'Última acción',120) || 'Última acción';
    }
    function actualizarBotonesUndoRedo(){
        const undo=document.getElementById('btnUndoGlobal');
        const redo=document.getElementById('btnRedoGlobal');
        if(undo){
            undo.disabled=!undoStack.length;
            const next=undoStack[undoStack.length-1];
            undo.title=next?`Deshacer: ${tabLabel(next.tab)} · ${describirAccionUndo(next)}`:'No hay acciones para deshacer';
        }
        if(redo){
            redo.disabled=!redoStack.length;
            const next=redoStack[redoStack.length-1];
            redo.title=next?`Rehacer: ${tabLabel(next.tab)} · ${describirAccionUndo(next)}`:'No hay acciones para rehacer';
        }
    }
    async function confirmarUndoContextual(accion,item){
        if(!item) return false;
        const tabActual=tabActualId();
        const otraPestana=item.tab && item.tab!==tabActual;
        const critica=!!item.critica;
        if(!otraPestana && !critica) return true;
        const partes=[
            otraPestana?`La acción pertenece a ${tabLabel(item.tab)}.`:'',
            critica?'Es una acción marcada como crítica.':''
        ].filter(Boolean);
        return confirmarAccionCritica({
            titulo:`${accion==='rehacer'?'Rehacer':'Deshacer'} acción`,
            mensaje:partes.join(' '),
            detalles:[
                `Qué hará: ${accion==='rehacer'?'reaplicará':'revertirá'} "${describirAccionUndo(item)}".`,
                `Afectará: ${item.afecta||tabLabel(item.tab)}.`,
                `No tocará: datos fuera del alcance guardado de esta acción.`
            ],
            confirmarTexto:accion==='rehacer'?'Rehacer':'Deshacer',
            peligro:critica
        });
    }
    function pushUndo(meta={}) {
      if(!data) return;
      const item=Object.assign({
        id:genId(),
        ts:new Date().toISOString(),
        tab:tabActualId(),
        tipo:'acción',
        resumen:'',
        afecta:'',
        critica:false,
        before:snapshotUndo()
      }, meta||{});
      undoStack.push(item);
      if (undoStack.length > MAX_UNDO) undoStack.shift();
      redoStack = [];
      actualizarBotonesUndoRedo();
    }
    async function deshacer() {
      if (!undoStack.length) return toast('No hay acciones para deshacer','info');
      const item=undoStack[undoStack.length-1];
      if(!await confirmarUndoContextual('deshacer',item)) return;
      undoStack.pop();
      redoStack.push(Object.assign({}, item, {after:snapshotUndo()}));
      restaurarSnapshotUndo(item.before);
      reconstruirIndices(); refrescarTodo();
      const guardado = await guardar();
      actualizarBotonesUndoRedo();
      toast(guardado===false?'Deshecho local pendiente de sincronizar':'Deshecho', guardado===false?'warning':'info');
    }
    async function rehacer() {
      if (!redoStack.length) return toast('No hay acciones para rehacer','info');
      const item=redoStack[redoStack.length-1];
      if(!await confirmarUndoContextual('rehacer',item)) return;
      redoStack.pop();
      undoStack.push(Object.assign({}, item, {before:snapshotUndo()}));
      restaurarSnapshotUndo(item.after);
      reconstruirIndices(); refrescarTodo();
      const guardado = await guardar();
      actualizarBotonesUndoRedo();
      toast(guardado===false?'Rehecho local pendiente de sincronizar':'Rehecho', guardado===false?'warning':'info');
    }
    function limpiarHistorialCambios(){
        undoStack=[];
        redoStack=[];
        actualizarBotonesUndoRedo();
    }
    // Parsea código de sección con formato: TIPO-CARRERA-NIVEL-PLAN-CURSO
    // Ej: D-ING-N1-2023-A => { tipo:'D', carrera:'ING', nivel:'N1', plan:'2023', curso:'A' }
    function parsearCodigoSeccion(codigo) {
        if (!codigo || typeof codigo !== 'string') return null;
        const partes = codigo.split('-');
        if (partes.length < 3) return null;
        return {
            tipo: partes[0] || '',         // D=diurno, V=vespertino
            carrera: partes[1] || '',
            nivel: partes[2] || '',         // N1, N2...
            plan: partes[3] || '',
            curso: partes[4] || ''
        };
    }
    const TEMPORADAS = ['Otoño','Invierno','Primavera','Verano'];
    const FUENTES_APP = {
        prototipo:{nombre:'Planhor (prototipo)', valor:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'},
        sistema:{nombre:'Sistema', valor:'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'},
        segoe:{nombre:'Segoe UI', valor:'"Segoe UI", system-ui, -apple-system, sans-serif'},
        inter:{nombre:'Inter', valor:'Inter, "Segoe UI", system-ui, -apple-system, sans-serif'},
        roboto:{nombre:'Roboto', valor:'Roboto, Arial, system-ui, sans-serif'},
        aptos:{nombre:'Aptos', valor:'Aptos, Calibri, "Segoe UI", system-ui, sans-serif'},
        georgia:{nombre:'Georgia', valor:'Georgia, "Times New Roman", serif'},
        mono:{nombre:'Mono técnica', valor:'"SFMono-Regular", Consolas, "Liberation Mono", monospace'}
    };
    const PLANHOR_COLORES = ['#d7eef0','#cbe7ef','#dfdcf6','#d8e7c8','#f3e1c7','#dce4ec','#c8d9ea','#e7d8d8','#c7f0ea','#e7e3f6','#d0e8f2','#f0e6c8'];
    const PLANHOR_ESP_COLOR = {Electricidad:'#edf4f7',Automatización:'#e7eef6',Electrónicos:'#e8e4f5',Transversales:'#e4edf0'};
    function hashTextoColor(txt){
        return String(txt||'').split('').reduce((acc,ch)=>((acc*31)+ch.charCodeAt(0))>>>0,7);
    }
    function colorPlanhorPorClave(clave){
        return PLANHOR_COLORES[hashTextoColor(clave)%PLANHOR_COLORES.length]||PLANHOR_COLORES[0];
    }
    function colorAsignaturaPlanhor(asig){
        if(!asig) return '#dce4ec';
        return colorPlanhorPorClave(asig.codigo||asig.nombre||asig.id);
    }
    const PALETAS = {
        Otoño:{
            css:{bg:'#f8f6f4',surface:'#ffffff','surface-alt':'#f0ece8',border:'#ded6ce','border-light':'#ece6e1',text:'#102840','text-secondary':'#5d5b57',accent:'#7050d8','accent-light':'#b46a3c',danger:'#9b3f52',warning:'#a26f2a',success:'#168675','modal-overlay':'rgba(16,40,64,0.42)'},
            colores:PLANHOR_COLORES,
            espColor:PLANHOR_ESP_COLOR
        },
        Invierno:{
            css:{bg:'#f3f7fb',surface:'#fcfeff','surface-alt':'#e8f0f6',border:'#d2dde7','border-light':'#e4ebf2',text:'#102840','text-secondary':'#516375',accent:'#1058a0','accent-light':'#38a6d9',danger:'#934154',warning:'#a0772a',success:'#147d72','modal-overlay':'rgba(16,40,64,0.44)'},
            colores:PLANHOR_COLORES,
            espColor:PLANHOR_ESP_COLOR
        },
        Primavera:{
            css:{bg:'#f3faf8',surface:'#ffffff','surface-alt':'#e8f5f2',border:'#cfe4df','border-light':'#e4f0ed',text:'#102840','text-secondary':'#506767',accent:'#18a8a0','accent-light':'#7ac943',danger:'#b23a48',warning:'#d9822b',success:'#12846f','modal-overlay':'rgba(16,40,64,0.40)'},
            colores:PLANHOR_COLORES,
            espColor:PLANHOR_ESP_COLOR
        },
        Verano:{
            css:{bg:'#fbf8f4',surface:'#ffffff','surface-alt':'#f3eee7',border:'#e3d8ca','border-light':'#efe7dd',text:'#102840','text-secondary':'#5f625f',accent:'#e86f2a','accent-light':'#f2a23a',danger:'#b23a48',warning:'#d9822b',success:'#168675','modal-overlay':'rgba(16,40,64,0.40)'},
            colores:PLANHOR_COLORES,
            espColor:PLANHOR_ESP_COLOR
        }
    };
    const TEMA_EXTRAS = {
        'planhor-subject-neutral':'#dce4ec','planhor-subject-border':'#8fa9bc','planhor-available-bg':'#e1ebe4','planhor-available-border':'#5f806d','planhor-unavailable-bg':'#edf2f5','planhor-unavailable-text':'#8a98a4',
        'planhor-teacher-busy-bg':'#dff3ea','planhor-teacher-busy-border':'#6bb38a','planhor-teacher-busy-text':'#25583d','planhor-room-busy-bg':'#fdebd8','planhor-room-busy-border':'#d89645','planhor-room-busy-text':'#744912'
    };
    const TEMAS_VISUALES = {
        planhor:{nombre:'Planhor',descripcion:'Identidad principal tecnológica e institucional.',temporadas:PALETAS,extras:TEMA_EXTRAS,colores:PLANHOR_COLORES,espColor:PLANHOR_ESP_COLOR},
        institucional:{nombre:'Institucional',descripcion:'Azules sobrios, alto contraste y lectura formal.',temporadas:{
            Otoño:{css:{bg:'#f7f8fa',surface:'#ffffff','surface-alt':'#eef2f5',border:'#d8e0e6','border-light':'#e8edf2',text:'#102840','text-secondary':'#536270',accent:'#265f8f','accent-light':'#6f95b5',danger:'#a6404b',warning:'#a8742a',success:'#1c7f68','modal-overlay':'rgba(16,40,64,0.42)'},colores:PLANHOR_COLORES,espColor:PLANHOR_ESP_COLOR},
            Invierno:{css:{bg:'#f2f6fa',surface:'#ffffff','surface-alt':'#e7eef5',border:'#cfdae5','border-light':'#e2e9f0',text:'#102840','text-secondary':'#506070',accent:'#174f82','accent-light':'#3f8fbd',danger:'#9d4150',warning:'#96702a',success:'#187966','modal-overlay':'rgba(16,40,64,0.44)'},colores:PLANHOR_COLORES,espColor:PLANHOR_ESP_COLOR},
            Primavera:{css:{bg:'#f5f9f8',surface:'#ffffff','surface-alt':'#e9f2f1',border:'#d2e1df','border-light':'#e4efed',text:'#102840','text-secondary':'#506767',accent:'#147f86','accent-light':'#42a7a0',danger:'#a6404b',warning:'#b57b2b',success:'#167d67','modal-overlay':'rgba(16,40,64,0.40)'},colores:PLANHOR_COLORES,espColor:PLANHOR_ESP_COLOR},
            Verano:{css:{bg:'#f8f8f7',surface:'#ffffff','surface-alt':'#eef1f2',border:'#d8e0e2','border-light':'#e7ecee',text:'#102840','text-secondary':'#5c6468',accent:'#1f6f8f','accent-light':'#4aa0b0',danger:'#a6404b',warning:'#ad762c',success:'#17806d','modal-overlay':'rgba(16,40,64,0.40)'},colores:PLANHOR_COLORES,espColor:PLANHOR_ESP_COLOR}
        },extras:TEMA_EXTRAS,colores:PLANHOR_COLORES,espColor:PLANHOR_ESP_COLOR},
        sobrio:{nombre:'Sobrio',descripcion:'Grises azulados y acentos contenidos.',temporadas:{
            Otoño:{css:{bg:'#f6f6f5',surface:'#ffffff','surface-alt':'#eeefef',border:'#d7dcde','border-light':'#e7eaeb',text:'#152638','text-secondary':'#5a636b',accent:'#405f75','accent-light':'#7a909d',danger:'#994650',warning:'#8f7435',success:'#3d7a6b','modal-overlay':'rgba(16,38,56,0.42)'},colores:PLANHOR_COLORES,espColor:PLANHOR_ESP_COLOR},
            Invierno:{css:{bg:'#f3f5f7',surface:'#ffffff','surface-alt':'#e9eef2',border:'#d2dce3','border-light':'#e4eaf0',text:'#152638','text-secondary':'#53616d',accent:'#365e82','accent-light':'#6e91aa',danger:'#934654',warning:'#927435',success:'#397b68','modal-overlay':'rgba(16,38,56,0.44)'},colores:PLANHOR_COLORES,espColor:PLANHOR_ESP_COLOR},
            Primavera:{css:{bg:'#f5f8f7',surface:'#ffffff','surface-alt':'#e9f0ee',border:'#d2dfdb','border-light':'#e3eeeb',text:'#152638','text-secondary':'#566763',accent:'#3f7f78','accent-light':'#7aa79d',danger:'#994650',warning:'#977635',success:'#347b67','modal-overlay':'rgba(16,38,56,0.40)'},colores:PLANHOR_COLORES,espColor:PLANHOR_ESP_COLOR},
            Verano:{css:{bg:'#f7f6f4',surface:'#ffffff','surface-alt':'#efebe5',border:'#ddd6cc','border-light':'#ece6de',text:'#152638','text-secondary':'#625f59',accent:'#6d6c7d','accent-light':'#a0876a',danger:'#994650',warning:'#987133',success:'#3d7a6b','modal-overlay':'rgba(16,38,56,0.40)'},colores:PLANHOR_COLORES,espColor:PLANHOR_ESP_COLOR}
        },extras:TEMA_EXTRAS,colores:PLANHOR_COLORES,espColor:PLANHOR_ESP_COLOR}
    };
    function clonarTemaVisualBase(id='planhor'){
        const base=TEMAS_VISUALES[id]||TEMAS_VISUALES.planhor;
        return JSON.parse(JSON.stringify({
            nombre:'Usuario',
            basadoEn:id,
            temporadas:base.temporadas,
            extras:base.extras||TEMA_EXTRAS,
            colores:base.colores||PLANHOR_COLORES,
            espColor:base.espColor||PLANHOR_ESP_COLOR
        }));
    }
    function getColores() { return getPaletaActiva().colores; }
    function getEspColor() { return getPaletaActiva().espColor; }
    function getPaletaActiva() {
        const temaId=data.configuracion?.temaVisualActivo||'planhor';
        const id=data.sel.temporadaId||data.configuracion.temporadaActualId||data.temporadas[0]?.id;
        const t=data.temporadas.find(tmp=>tmp.id===id);
        const nombreTemp=t?.temporada||'Otoño';
        if(temaId==='usuario'&&data.configuracion?.temaUsuario?.temporadas){
            const usuario=data.configuracion.temaUsuario;
            const paleta=usuario.temporadas[nombreTemp]||usuario.temporadas.Otoño||PALETAS[nombreTemp]||PALETAS.Otoño;
            return Object.assign({},paleta,{colores:Array.isArray(usuario.colores)&&usuario.colores.length?usuario.colores:PLANHOR_COLORES,espColor:usuario.espColor||PLANHOR_ESP_COLOR,extras:usuario.extras||TEMA_EXTRAS});
        }
        const tema=TEMAS_VISUALES[temaId]||TEMAS_VISUALES.planhor;
        const paleta=tema.temporadas[nombreTemp]||tema.temporadas.Otoño||PALETAS[nombreTemp]||PALETAS.Otoño;
        return Object.assign({},paleta,{colores:tema.colores||paleta.colores||PLANHOR_COLORES,espColor:tema.espColor||paleta.espColor||PLANHOR_ESP_COLOR,extras:tema.extras||TEMA_EXTRAS});
    }
    function aplicarPaleta() {
        const paleta=getPaletaActiva();
        if(!paleta) return;
        const c=paleta.css;
        Object.keys(c).forEach(k=>document.documentElement.style.setProperty('--'+k,c[k]));
        Object.keys(paleta.extras||{}).forEach(k=>document.documentElement.style.setProperty('--'+k,paleta.extras[k]));
        const theme=document.querySelector('meta[name="theme-color"]');
        if(theme&&c.accent) theme.setAttribute('content',c.accent);
    }
    function aplicarFuente() {
        const id=data.configuracion?.fuenteApp || CONFIG_DEFAULT.fuenteApp;
        const fuente=FUENTES_APP[id] || FUENTES_APP[CONFIG_DEFAULT.fuenteApp] || FUENTES_APP.sistema;
        document.documentElement.style.setProperty('--font', fuente.valor);
    }
    function formatearTextoBloqueAsignatura(asig,{formato='codigo_nombre_resumido',maxNombre=30}={}){
        const codigo=String(asig?.codigo||'').trim();
        const nombre=String(asig?.nombre||'').replace(/\s+/g,' ').trim();
        const truncar=(texto,max=maxNombre)=>{
            const limpio=String(texto||'').replace(/\s+/g,' ').trim();
            if(limpio.length<=max) return limpio;
            return limpio.slice(0,Math.max(1,max-3)).trimEnd()+'...';
        };
        if(formato==='codigo') return codigo||'?';
        if(!nombre) return codigo||'?';
        if(formato==='nombre') return truncar(nombre,maxNombre);
        if(formato==='codigo_nombre') return codigo?`${codigo} - ${truncar(nombre,maxNombre)}`:truncar(nombre,maxNombre);
        const abreviarPalabra=(palabra,indice)=>{
            const limpia=String(palabra||'').trim();
            if(!limpia) return '';
            const lower=limpia.toLowerCase();
            const mapa={
                programable:'Prog.', programables:'Prog.',
                instrumentacion:'Inst.', instrumentación:'Inst.',
                electromecanica:'Electromec.', electromecánica:'Electromec.',
                industrial:'Ind.', industriales:'Ind.',
                administracion:'Admin.', administración:'Admin.',
                electricidad:'Elect.', electrica:'Eléc.', eléctrica:'Eléc.', electricas:'Eléc.', eléctricas:'Eléc.',
                electronica:'Electrónica', electrónica:'Electrónica',
                conversion:'Conv.', conversión:'Conv.',
                seguridad:'Seg.', mantenimiento:'Mant.', automatizados:'Autom.', complejos:'Compl.', computador:'Comp.'
            };
            if(mapa[lower]) return mapa[lower];
            if(indice>0 && limpia.length>9) return limpia.slice(0,5)+'.';
            return limpia;
        };
        const palabras=nombre.split(' ').filter(Boolean);
        let salida=[];
        for(let i=0;i<palabras.length;i++){
            salida.push(abreviarPalabra(palabras[i],salida.length));
            const relevantes=salida.filter(x=>!['de','del','la','las','el','los','en','a','para','y','e'].includes(String(x).toLowerCase())).length;
            if(salida.join(' ').length>=maxNombre && relevantes>=2) break;
        }
        if(!salida.length) salida=palabras.slice(0,2).map((p,i)=>abreviarPalabra(p,i));
        let corto=salida.join(' ').trim();
        if(corto.length>maxNombre){
            const partes=corto.split(' ');
            while(partes.length>2 && partes.join(' ').length>maxNombre) partes.pop();
            corto=partes.join(' ');
            if(corto.length>maxNombre) corto=corto.slice(0,Math.max(8,maxNombre-1)).trim()+'.';
        }
        return codigo?`${codigo} - ${corto}`:corto;
    }
    const CONFIG_DEFAULT = {
        bloquesDiariosMax:13, bloquesSemestralesMax:47, horasDescanso:12, sabadoHastaBloque:16,
        horasPorBloque:18, confirmarEliminacion:true, sensibilidadArrastre:5,
        umbralCargaDocente:80, porcentajesHomologo:[{desde:0,hasta:200,porcentaje:50},{desde:201,hasta:500,porcentaje:30},{desde:501,hasta:9999,porcentaje:20}],
        exportacionExcel:'xlsx', vistaGeneralColumnas:2, formatoTextoBloque:'codigo_nombre_resumido', formatoTextoBloqueVistaHorario:'codigo', formatoTextoBloqueFichaDocente:'codigo',
        vistaGeneralCampos:{asignatura:true,docente:false,sala:false,seccion:false,hora:false},
        fuenteApp:'prototipo', temaVisualActivo:'planhor', temaUsuario:null,
        especialidades:[],
        autoPlanificacion:{
            usarPrioridadDocente:true,
            balancearDias:true,
            permitirSabadoPresencial:false,
            estrategiaPredeterminada:'balanceada',
            permitirDocenteNN:true,
            incluirTransversales:true,
            incluirVirtuales:true,
            priorizarVirtualSabado:true,
            evitarTempranoN1:true,
            cuidarCriticas:true,
            cuidarAyudantias:true
        },
        motorSolver:'heuristico',
        solverPesos:{
            topesDuros:'obligatorio',
            bloquesFaltantes:'obligatorio',
            disponibilidadDocente:'obligatorio',
            topesSala:'obligatorio',
            topesSeccion:'obligatorio',
            ventanasEstudiantes:'alta',
            ventanasDocentes:'media',
            compactacionAsignatura:'alta',
            compactacionLarga:'alta',
            distribucionSemanal:'media',
            distribuirAsignaturas:'media',
            salasCorrectas:'media',
            docentePreferente:'alta',
            excesoDiarioDocente:'alta',
            respetoJornada:'obligatorio',
            descansoDocente:'obligatorio',
            virtuales:'media',
            virtualesSabado:'alta',
            onlineTeams:'obligatorio',
            sabadoPresencial:'alta',
            evitarTemprano:'media',
            primerSemestre:'media',
            criticas:'alta',
            ayudantias:'media',
            recreo:'baja',
            docenteNN:'alta',
            tro2:'media',
            transversalesHeredadas:'media',
            continuidadJornada:'media',
            vespertinoBase:'media',
            memoriaManual:'baja'
        },
        memoriaPlanificacion:{
            activa:true,
            usarEnAuto:false,
            fuerza:'baja',
            senales:[],
            maxSenales:500
        },
        perfilesUsuarios:{},
        dashboard:{totalBloques:true,totalAsignaturas:true,totalDocentes:true,presencialVirtual:true,incompletas:true,docenteNN:true,tro2:true,criticas:true,transversales:true,criteriosAsignatura:true,docentesEsp:true,conflictos:true,seccionesATiempo:true,calidadHorario:true,validacionPrevia:true}
    };

    let data = {
        carreras:[], niveles:[], secciones:[], asignaturas:[], docentes:[], salas:[],
        asignaturaCarreraNivel:[], asignaturaSeccion:[], planificaciones:[], cargasExternasDocente:[], gruposDictacion:[], vinculosElectivos:[], configuracion:JSON.parse(JSON.stringify(CONFIG_DEFAULT)),
        gestorSecciones:{cargas:[],ids:[],ultimaCargaId:null},
        modoPlan:false, temporadas:[], auditoria:[], ultimoAutoGeneral:null, ultimaAutoEjecucion:null, autoEjecuciones:[], temporadaData:{}, sel:{temporadaId:null,area:null,carreraId:null,nivelId:null,seccionId:null,asignaturaId:null,docenteId:null,salaId:null,tipo:'presencial'}
    };
    let indicePlan = {}, contadorDocente = {}, contadorDocenteDia = {}, ocupacionSala = {};

    const App = {
        _popupAbierto:null, _popupCell:null
    };
    let hayGuardadoPendiente = false;
    let saveStatusTimer = null;
    const PREF_TEMPORADA_ACTIVA = 'planificador_preferencia_temporada_activa';

    function usuarioActualKey() {
        return window._fb?.auth?.currentUser?.email || window._usuarioActual || '';
    }

    function temporadaExiste(id) {
        return !!id && (data.temporadas||[]).some(t=>t.id===id);
    }
    const ORDEN_TEMPORADAS = { 'Otoño':0, 'Invierno':1, 'Primavera':2, 'Verano':3 };
    function ordenarTemporadas(){
        if(!Array.isArray(data.temporadas)) data.temporadas=[];
        data.temporadas.sort((a,b)=>
            (Number(b.anio)||0)-(Number(a.anio)||0) ||
            (ORDEN_TEMPORADAS[a.temporada]??99)-(ORDEN_TEMPORADAS[b.temporada]??99) ||
            String(a.id||'').localeCompare(String(b.id||''))
        );
    }
    function datosTemporadaVacios(){
        return { carreras:[], niveles:[], secciones:[], asignaturas:[], docentes:[], salas:[], asignaturaCarreraNivel:[], asignaturaSeccion:[], planificaciones:[], cargasExternasDocente:[], gruposDictacion:[], vinculosElectivos:[], gestorSecciones:{cargas:[],ids:[],filas:[],enlacesManuales:[],ultimaCargaId:null,tablaLimite:250} };
    }

    function guardarTemporadaPreferida(id) {
        if(!id) return;
        try { localStorage.setItem(PREF_TEMPORADA_ACTIVA, id); } catch(e) {}
        const usuario=usuarioActualKey();
        if(usuario){
            data.configuracion=data.configuracion||{};
            data.configuracion.perfilesUsuarios=data.configuracion.perfilesUsuarios||{};
            data.configuracion.perfilesUsuarios[usuario]=Object.assign({},data.configuracion.perfilesUsuarios[usuario]||{},{
                ultimaTemporadaId:id
            });
        }
    }

    function leerTemporadaPreferida() {
        let local='';
        try { local = localStorage.getItem(PREF_TEMPORADA_ACTIVA) || ''; } catch(e) {}
        if(temporadaExiste(local)) return local;
        const usuario=usuarioActualKey();
        const perfilId=usuario ? data.configuracion?.perfilesUsuarios?.[usuario]?.ultimaTemporadaId : '';
        if(temporadaExiste(perfilId)) return perfilId;
        return '';
    }

    function setSyncStatus(estado, texto) {
        const el = document.getElementById('syncStatus');
        const label = document.getElementById('syncStatusText');
        if(!el || !label) return;
        el.className = `sync-status sync-status-${estado}`;
        label.textContent = texto;
        el.title = texto;
    }

    function setSaveStatus(estado, texto, ocultar=true) {
        const el = document.getElementById('saveStatus');
        if(!el) return;
        if(saveStatusTimer) clearTimeout(saveStatusTimer);
        el.className = `save-status ${estado} visible`;
        el.textContent = texto;
        if(ocultar) {
            saveStatusTimer = setTimeout(()=>{ el.classList.remove('visible'); }, 2000);
        }
    }

    function setLastRemoteSave(fecha,autor='usuario') {
        const el=document.getElementById('syncLastRemote');
        if(!el||!fecha) return;
        const valor=new Date(fecha);
        if(Number.isNaN(valor.getTime())) return;
        el.textContent=`Nube: ${valor.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}`;
        el.title=`Último guardado remoto: ${valor.toLocaleString()} · ${autor}`;
    }

    function setCambiosPendientes(pendiente) {
        hayGuardadoPendiente = !!pendiente;
    }

    function actualizarEstadoConexion(estado='online', textoPersonalizado='') {
        if(textoPersonalizado) {
            setSyncStatus(estado, textoPersonalizado);
            return;
        }
        if(!navigator.onLine) {
            setSyncStatus('offline','Sin conexión');
            return;
        }
        if(estado === 'waiting') setSyncStatus('waiting','Conectando');
        else if(estado === 'saving') setSyncStatus('saving','Guardando');
        else if(estado === 'warning') setSyncStatus('warning','Sin sincronizar');
        else setSyncStatus('online','Conectado');
    }

    window.addEventListener('online',()=>actualizarEstadoConexion('waiting','Reconectando'));
    window.addEventListener('offline',()=>actualizarEstadoConexion('offline'));
    window.addEventListener('beforeunload',(e)=>{
        if(!hayGuardadoPendiente) return;
        e.preventDefault();
        e.returnValue = '';
    });

    const Sync = window.PlanificadorSync.create({
        getData: () => data,
        CONFIG_DEFAULT,
        genId,
        SALA_VIRTUAL_ID,
        SALA_TRO2_ID,
        DOCENTE_NN_ID,
        normalizarDatos,
        reconstruirIndices,
        refrescarTodo,
        getTemporadaPreferida: leerTemporadaPreferida,
        setCambiosPendientes,
        setSyncStatus: actualizarEstadoConexion,
        setSaveStatus,
        setLastRemoteSave,
        confirmarRestauracion:()=>confirmarAccionCritica({
            titulo:'Sincronizar restauración',
            mensaje:'Hay una restauración local pendiente de tu confirmación.',
            queHara:'Comparará esta copia con Firebase antes de publicarla.',
            afectara:'La nube solo si la comparación resulta segura o resuelves sus conflictos.',
            noTocara:'La copia local restaurada.',
            confirmarTexto:'Comparar y sincronizar',
            cancelarTexto:'Más tarde',
            peligro:false
        }),
        toast
    });
    function guardar(opciones={}) { return Sync.guardar(opciones); }
    function cargar() { return Sync.cargar(); }
    function recargarDesdeFirestore(silencioso=false) { return Sync.recargarDesdeFirestore(silencioso); }
    function listarSnapshotsRecuperacion() { return Sync.listarSnapshotsRecuperacion?.() || []; }
    function obtenerSnapshotRecuperacion(id) { return Sync.obtenerSnapshotRecuperacion?.(id) || null; }
    function crearPuntoRecuperacion(motivo='punto_recuperacion') { return Sync.crearSnapshotActual?.(motivo) || false; }
    function guardarRestauracionLocal(motivo='restauracion_local') { return Sync.guardarRestauracionLocal?.(motivo) || Promise.resolve(false); }
    function hayConflictoRemoto() { return Sync.hayConflictoRemoto(); }

    const LIBRERIAS_EXTERNAS = {
        xlsx:{url:'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js', listo:()=>!!window.XLSX?.utils?.book_new},
        html2canvas:{url:'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', listo:()=>typeof window.html2canvas==='function'},
        jspdf:{url:'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', listo:()=>!!window.jspdf?.jsPDF}
    };
    const promesasLibrerias = {};
    function cargarLibreriaExterna(nombre){
        const cfg=LIBRERIAS_EXTERNAS[nombre];
        if(!cfg) return Promise.reject(new Error('libreria-no-definida'));
        if(cfg.listo()) return Promise.resolve(true);
        if(promesasLibrerias[nombre]) return promesasLibrerias[nombre];
        promesasLibrerias[nombre]=new Promise((resolve,reject)=>{
            const script=document.createElement('script');
            script.src=cfg.url;
            script.async=true;
            script.onload=()=>cfg.listo()?resolve(true):reject(new Error(`No se pudo inicializar ${nombre}`));
            script.onerror=()=>reject(new Error(`No se pudo cargar ${nombre}`));
            document.head.appendChild(script);
        }).catch(err=>{
            delete promesasLibrerias[nombre];
            throw err;
        });
        return promesasLibrerias[nombre];
    }
    async function asegurarLibreria(nombre, etiqueta){
        try{
            setSaveStatus('saving',`Cargando ${etiqueta}...`,false);
            await cargarLibreriaExterna(nombre);
            setSaveStatus('success','✓ Listo');
            return true;
        }catch(e){
            console.warn(`No se pudo cargar ${nombre}:`,e);
            setSaveStatus('error','Librería no disponible',false);
            toast(`No se pudo cargar ${etiqueta}. Revisa la conexión e intenta nuevamente.`,'error');
            return false;
        }
    }
    const asegurarXLSX = () => asegurarLibreria('xlsx','Excel');
    const asegurarHtml2Canvas = () => asegurarLibreria('html2canvas','exportación de imagen');
    const asegurarJsPDF = () => asegurarLibreria('jspdf','PDF');

    const Exportaciones = window.PlanificadorExportaciones.create({
        getData: () => data,
        DIAS,
        BLOQUES,
        SALA_VIRTUAL_ID,
        SALA_TRO2_ID,
        DOCENTE_NN_ID,
        getPlanificaciones,
        getTemporadaLabel,
        getModoExcel: () => data.configuracion.exportacionExcel || 'xlsx',
        resolverFallbackExcel,
        asegurarXLSX,
        confirmarAccionCritica,
        toast
    });
    const generarMatriz = Exportaciones.generarMatriz;
    const formatearHojaHorario = Exportaciones.formatearHojaHorario;
    const exportarCursos = Exportaciones.exportarCursos;
    const exportarDocentes = Exportaciones.exportarDocentes;
    const exportarSalas = Exportaciones.exportarSalas;
    const descargarExcelCompleto = Exportaciones.descargarExcelCompleto;
    const exportarDatos = Exportaciones.exportarDatos;

    const VistaHorario = window.PlanificadorVistaHorario.create({
        getData: () => data,
        DIAS,
        BLOQUES,
        SALA_VIRTUAL_ID,
        DOCENTE_NN_ID,
        getPlanificaciones,
        getTemporadaLabel,
        createHeader,
        createTimeCell,
        generarMatriz,
        formatearHojaHorario,
        resolverFallbackExcel,
        descargarTablaExcel,
        colorAsignaturaPlanhor,
        formatearTextoBloqueAsignatura,
        asegurarXLSX,
        asegurarHtml2Canvas,
        asegurarJsPDF,
        irASeccion,
        confirmarAccionCritica,
        mostrarErrorTecnico,
        sanitizarNodoExportacion,
        optionHTML,
        escapeHTML,
        escapeAttr,
        toast
    });
    const actualizarVista = VistaHorario.actualizarVista;
    const construirVistaGrid = VistaHorario.construirVistaGrid;
    const exportarVistaExcel = VistaHorario.exportarVistaExcel;
    const exportarVistaJPG = VistaHorario.exportarVistaJPG;
    const exportarVistaPDF = VistaHorario.exportarVistaPDF;
    const exportarPdf = VistaHorario.exportarPdf;

    const Reportes = window.PlanificadorReportes.create({
        getData: () => data,
        DIAS,
        SALA_VIRTUAL_ID,
        SALA_TRO2_ID,
        DOCENTE_NN_ID,
        getPlanificaciones,
        getContadorDocente: () => contadorDocente,
        getTemporadaLabel,
        resolverFallbackExcel,
        descargarTablaExcel,
        asegurarXLSX,
        irASeccion,
        activarTab,
        abrirModalSeccion: (...args) => abrirModalSeccion(...args),
        abrirModalAsignatura: (...args) => abrirModalAsignatura(...args),
        abrirModalDocente: (...args) => abrirModalDocente(...args),
        abrirModalSala: (...args) => abrirModalSala(...args),
        deshacerUltimaAuto,
        abrirReversionAutos,
        confirmarAccionCritica,
        crearPuntoRecuperacion,
        guardar,
        reconstruirIndices,
        refrescarTodo,
        auditoria,
        cerrarModal,
        optionHTML,
        escapeHTML,
        escapeAttr,
        toast
    });
    const actualizarReporte = Reportes.actualizarReporte;
    const renderDashboard = Reportes.renderDashboard;
    const detectarConflictos = Reportes.detectarConflictos;
    const renderHistorial = Reportes.renderHistorial;
    const calcularValidacionPrevia = Reportes.calcularValidacionPrevia;

    const FichaDocente = window.PlanificadorFichaDocente.create({
        getData: () => data,
        DIAS,
        BLOQUES,
        SALA_VIRTUAL_ID,
        SALA_TRO2_ID,
        DOCENTE_NN_ID,
        getPlanificaciones,
        getTemporadaLabel,
        genId,
        guardar,
        reconstruirIndices,
        optionHTML,
        escapeHTML,
        escapeAttr,
        colorSeguro,
        colorAsignaturaPlanhor,
        formatearTextoBloqueAsignatura,
        asegurarHtml2Canvas,
        asegurarJsPDF,
        mostrarErrorTecnico,
        sanitizarNodoExportacion,
        activarTab,
        irASeccion,
        abrirCargaExternaPlanificada,
        actualizarReporte,
        cerrarModal,
        toast
    });
    const actualizarFichaDocentes = FichaDocente.actualizarFichaDocentes;
    const renderFichaDocente = FichaDocente.renderFichaDocente;

    function deshacerUltimaAuto(){
        return Planificacion?.deshacerUltimaAuto?.();
    }
    function abrirReversionAutos(){
        return Planificacion?.abrirReversionAutos?.();
    }

    const Entidades = window.PlanificadorEntidades.create({
        getData: () => data,
        SALA_VIRTUAL_ID,
        SALA_TRO2_ID,
        DOCENTE_NN_ID,
        DIAS,
        BLOQUES,
        genId,
        optionHTML,
        escapeHTML,
        escapeAttr,
        colorSeguro,
        getColores,
        colorAsignaturaPlanhor,
        getContadorDocente: () => contadorDocente,
        getEspColor,
        getGruposDictacion,
        getGruposDictacionSeccion,
        getGrupoDictacionAsignaturaSeccion,
        getEstadoDictacionAsignatura,
        crearGrupoDictacion,
        vincularSeccionAGrupo,
        desvincularSeccionDeGrupo,
        eliminarGrupoDictacion,
        pushUndo,
        crearPuntoRecuperacion,
        confirmarAccionCritica,
        guardar,
        reconstruirIndices,
        refrescarTodo,
        cerrarModal,
        cerrarFlotante,
        asegurarXLSX,
        toast
    });
    const eliminarEntidad = Entidades.eliminarEntidad;
    const renderCarreras = Entidades.renderCarreras;
    const abrirModalCarrera = Entidades.abrirModalCarrera;
    const guardarCarrera = Entidades.guardarCarrera;
    const abrirModalNivel = Entidades.abrirModalNivel;
    const guardarNivel = Entidades.guardarNivel;
    const abrirModalSeccion = Entidades.abrirModalSeccion;
    const guardarSeccion = Entidades.guardarSeccion;
    const abrirModalAsignatura = Entidades.abrirModalAsignatura;
    const guardarAsignatura = Entidades.guardarAsignatura;
    const eliminarAsignatura = Entidades.eliminarAsignatura;
    const renderAsignaturas = Entidades.renderAsignaturas;
    const abrirModalDocente = Entidades.abrirModalDocente;
    const guardarDocente = Entidades.guardarDocente;
    const eliminarDocente = Entidades.eliminarDocente;
    const renderDocentes = Entidades.renderDocentes;
    const abrirModalSala = Entidades.abrirModalSala;
    const guardarSala = Entidades.guardarSala;
    const eliminarSala = Entidades.eliminarSala;
    const renderSalas = Entidades.renderSalas;
    const abrirGestionDictacionSeccion = Entidades.abrirGestionDictacionSeccion;

    const Planificacion = window.PlanificadorPlanificacion.create({
        getData: () => data,
        DIAS,
        BLOQUES,
        SALA_VIRTUAL_ID,
        SALA_TRO2_ID,
        DOCENTE_NN_ID,
        popupState: App,
        getIndicePlan: () => indicePlan,
        getOcupacionSala: () => ocupacionSala,
        getPlanificacionesFiltradas,
        getGruposDictacion,
        getGruposDictacionSeccion,
        getGrupoDictacionAsignaturaSeccion,
        getEstadoDictacionAsignatura,
        getSeccionesConsumidorasGrupo,
        getBloque,
        parsearCodigoSeccion,
        createHeader,
        createTimeCell,
        getContadorDocente: () => contadorDocente,
        genId,
        pushUndo,
        crearPuntoRecuperacion,
        auditoria,
        guardar,
        reconstruirIndices,
        refrescarTodo,
        cerrarModal,
        cerrarFlotante,
        irASeccion,
        irAGestorId,
        irASeccionesDesdeGestor,
        activarTab,
        calcularValidacionPrevia,
        confirmarAccionCritica,
        renderDashboard:()=>{ if(tabActivaEs('dashboard')) renderDashboard(); },
        detectarConflictos:()=>{ if(tabActivaEs('dashboard')) detectarConflictos(); },
        actualizarReporte,
        actualizarVista,
        renderHistorial,
        optionHTML,
        escapeHTML,
        escapeAttr,
        colorAsignaturaPlanhor,
        formatearTextoBloqueAsignatura,
        toast
    });
    const construirGrilla = Planificacion.construirGrilla;
    const actualizarCelda = Planificacion.actualizarCelda;
    const checkDisponibilidad = Planificacion.checkDisponibilidad;
    const asignarBloque = Planificacion.asignarBloque;
    const eliminarBloque = Planificacion.eliminarBloque;
    const mostrarPopupAccion = Planificacion.mostrarPopupAccion;
    const cerrarPopupAccion = Planificacion.cerrarPopupAccion;
    const cancelarMovimiento = Planificacion.cancelarMovimiento;
    const hayMovimiento = Planificacion.hayMovimiento;
    const actualizarSelectoresPlan = Planificacion.actualizarSelectoresPlan;
    const actualizarProgresoPlan = Planificacion.actualizarProgresoPlan;
    const validarSeleccionManual = Planificacion.validarSeleccionManual;

    let organizadorSalas=null;
    function renderOrganizadorSalas(){
        if(!organizadorSalas) organizadorSalas=window.PlanhorAplicaciones['optimizador-manual'].create({
            getData:()=>data, DIAS, BLOQUES, SALA_VIRTUAL_ID, escapeHTML, escapeAttr, colorAsignaturaPlanhor,
            grupoContinuo:Planificacion.grupoContinuoManual,
            validarMovimiento:Planificacion.validarMovimientoManual,
            aplicarMovimiento:Planificacion.aplicarMovimientoManual,
            abrirDestino:(planId,destino)=>{
                const p=data.planificaciones.find(p=>String(p.id)===String(planId));
                if(!p)return toast('El bloque ya no está disponible.','info');
                if(destino==='secciones')return irASeccionesDesdeGestor({seccionId:p.seccionId,asignaturaId:p.asignaturaId});
                if(p.esCargaExterna)return abrirCargaExternaPlanificada(p);
                irASeccion(p.seccionId,{asignaturaId:p.asignaturaId,docenteId:p.docenteId,salaId:p.salaId,componenteId:p.componenteId,tipo:p.tipoPresencial===false?'virtual':'presencial',dia:p.dia,bloque:p.bloque});
            },
            grupo:Planificacion.grupoOrganizarSalas,
            validar:Planificacion.validarOrganizarSalas,
            aplicar:Planificacion.aplicarOrganizarSalas,
            mostrarDetalle:Planificacion.mostrarTooltipOrganizarSalas,
            ocultarDetalle:Planificacion.ocultarTooltipPlan,
            toast
        });
        organizadorSalas.render();
    }

    const Configuracion = window.PlanificadorConfiguracion.create({
        getData: () => data,
        TEMPORADAS,
        FUENTES_APP,
        CONFIG_DEFAULT,
        TEMAS_VISUALES,
        clonarTemaVisualBase,
        genId,
        optionHTML,
        escapeHTML,
        switchTemporada,
        cargarTemporadaSinPersistirActual,
        ordenarTemporadas,
        aplicarPaleta,
        aplicarFuente,
        confirmarAccionCritica,
        guardar,
        reconstruirIndices,
        refrescarTodo,
        cerrarModal,
        cerrarFlotante,
        renderDashboard:()=>{ if(tabActivaEs('dashboard')) renderDashboard(); },
        detectarConflictos:()=>{ if(tabActivaEs('dashboard')) detectarConflictos(); },
        escapeAttr,
        toast
    });
    const abrirConfiguracion = Configuracion.abrirConfiguracion;
    const actualizarSelectorTemporada = Configuracion.actualizarSelectorTemporada;
    const actualizarIndicadorPaleta = Configuracion.actualizarIndicadorPaleta;

    function switchTemporada(id) {
        if (!id || id === data.sel.temporadaId) return;
        limpiarHistorialCambios();
        const tempData = data.temporadaData;
        tempData[data.sel.temporadaId] = { carreras:data.carreras, niveles:data.niveles, secciones:data.secciones, asignaturas:data.asignaturas, docentes:data.docentes, salas:data.salas, asignaturaCarreraNivel:data.asignaturaCarreraNivel, asignaturaSeccion:data.asignaturaSeccion||[], planificaciones:data.planificaciones, cargasExternasDocente:data.cargasExternasDocente||[], gruposDictacion:data.gruposDictacion, vinculosElectivos:data.vinculosElectivos||[], gestorSecciones:data.gestorSecciones };
        cargarTemporadaSinPersistirActual(id);
    }
    function cargarTemporadaSinPersistirActual(id) {
        if(!id) return;
        const tempData = data.temporadaData || (data.temporadaData={});
        const nueva = tempData[id] || datosTemporadaVacios();
        if (!tempData[id]) tempData[id] = nueva;
        data.carreras = nueva.carreras; data.niveles = nueva.niveles; data.secciones = nueva.secciones;
        data.asignaturas = nueva.asignaturas; data.docentes = nueva.docentes; data.salas = nueva.salas;
        data.asignaturaCarreraNivel = nueva.asignaturaCarreraNivel; data.asignaturaSeccion = nueva.asignaturaSeccion || []; data.planificaciones = nueva.planificaciones; data.cargasExternasDocente = nueva.cargasExternasDocente || []; data.gruposDictacion = nueva.gruposDictacion || []; data.vinculosElectivos=nueva.vinculosElectivos||[]; data.gruposElectivos=nueva.gruposElectivos||[]; data.gestorSecciones = nueva.gestorSecciones || {cargas:[],ids:[],ultimaCargaId:null};
        data.sel.temporadaId = id;
        data.configuracion.temporadaActualId = id;
        guardarTemporadaPreferida(id);
        if(!data.salas.find(s=>s.id===SALA_VIRTUAL_ID)) data.salas.push({id:SALA_VIRTUAL_ID,nombre:'Sala Virtual',capacidad:9999,tipoSala:'Virtual',esVirtual:true,fija:true});
        if(!data.salas.find(s=>s.id===SALA_TRO2_ID)) data.salas.push({id:SALA_TRO2_ID,nombre:'TRO2 (Terreno)',capacidad:9999,tipoSala:'Terreno',esVirtual:false,fija:true,ilimitada:true});
        asegurarDocenteNN();
        data.sel.area=null; data.sel.carreraId=null; data.sel.nivelId=null; data.sel.seccionId=null; data.sel.asignaturaId=null; data.sel.docenteId=null; data.sel.salaId=null;
        data.modoPlan=false; normalizarDatos();
    }
    function getTemporadaLabel() {
        const id = data.sel.temporadaId || data.configuracion.temporadaActualId || data.temporadas[0]?.id;
        const t = data.temporadas.find(tmp => tmp.id === id);
        if (!t) return '';
        const abr = {Otoño:'O', Invierno:'I', Primavera:'P', Verano:'V'};
        return `${abr[t.temporada]||t.temporada[0]}${t.anio}`;
    }

    function pedirTemporadaInicialSiHaceFalta(){
        const temporadas=data.temporadas||[];
        if(temporadas.length<=1) return Promise.resolve(false);
        if(leerTemporadaPreferida()) return Promise.resolve(false);
        const modal=document.getElementById('modalContainer');
        if(!modal) return Promise.resolve(false);
        return new Promise(resolve=>{
            const actual=data.sel.temporadaId||data.configuracion.temporadaActualId||temporadas[0]?.id;
            modal.innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal">
                    <div class="modal-header">
                        <h3>Seleccionar temporada de trabajo</h3>
                        <p>Elige el periodo antes de comenzar. La app lo recordará para este usuario y evitará abrir una temporada distinta por defecto.</p>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Temporada activa</label>
                        <select class="form-select" id="inicioTemporadaSelect">
                            ${temporadas.map(t=>optionHTML(t.id,`${t.temporada} ${t.anio}`,t.id===actual)).join('')}
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" id="btnConfirmarTemporadaInicial">Usar esta temporada</button>
                    </div>
                </div></div>`;
            document.getElementById('btnConfirmarTemporadaInicial').onclick=()=>{
                const id=document.getElementById('inicioTemporadaSelect')?.value||actual;
                if(id&&id!==data.sel.temporadaId) switchTemporada(id);
                else guardarTemporadaPreferida(id);
                guardar({forzar:true});
                modal.innerHTML='';
                resolve(true);
            };
        });
    }

    function auditoria(accion, detalle={}) {
        if(!Array.isArray(data.auditoria)) data.auditoria=[];
        const usuario = window._fb?.auth?.currentUser?.email || window._usuarioActual || 'Sin usuario';
        const usuarioNombre = data.configuracion?.perfilesUsuarios?.[usuario]?.nombre || usuario;
        const motivo = detalle&&typeof detalle==='object' ? String(detalle.motivo||detalle.razon||'').trim().slice(0,300) : '';
        data.auditoria.push({
            id:genId(),
            ts:new Date().toISOString(),
            usuario,
            usuarioNombre,
            temporadaId:data.sel?.temporadaId||data.configuracion?.temporadaActualId||'',
            revisionId:'',
            motivo,
            accion,
            detalle
        });
        if (data.auditoria.length === 900) {
            toast('El historial llegó a 900 acciones. Conviene exportarlo pronto desde la pestaña Historial.', 'warning');
        }
        if (data.auditoria.length > 1000) {
            const eliminadas=data.auditoria.length-1000;
            data.configuracion.historialRecortes=(Number(data.configuracion.historialRecortes)||0)+eliminadas;
            data.auditoria.splice(0, eliminadas);
            toast('El historial llegó al límite. Se conservaron las 1000 acciones más recientes; exporta el historial para respaldo.', 'warning');
        }
    }
    function getPlanificaciones() { return data.planificaciones; }
    function getPlanificacionesFiltradas(ignorarIds=[]) {
        const ids = new Set(ignorarIds);
        return getPlanificaciones().filter(p=>!ids.has(p.id));
    }
    function normalizarGrupoDictacion(grupo={}) {
        const seccionesVinculadas=Array.isArray(grupo.seccionesVinculadasIds)
            ? grupo.seccionesVinculadasIds
            : Array.isArray(grupo.seccionesVinculadas)
                ? grupo.seccionesVinculadas
                : [];
        const asignaturasEquivalentes=Array.isArray(grupo.asignaturasEquivalentesIds)
            ? grupo.asignaturasEquivalentesIds
            : Array.isArray(grupo.asignaturasEquivalentes)
                ? grupo.asignaturasEquivalentes
                : [];
        const limpio={
            id:limpiarTexto(grupo.id)||genId(),
            asignaturaId:limpiarTexto(grupo.asignaturaId),
            seccionMadreId:limpiarTexto(grupo.seccionMadreId),
            seccionesVinculadasIds:[...new Set(seccionesVinculadas.map(id=>limpiarTexto(id)).filter(Boolean))],
            asignaturasEquivalentesIds:[...new Set(asignaturasEquivalentes.map(id=>limpiarTexto(id)).filter(Boolean))],
            idGestorSeccion:limpiarTexto(grupo.idGestorSeccion,80),
            marcaGestor:limpiarTexto(grupo.marcaGestor,8).toUpperCase(),
            alumnosBase:Number(grupo.alumnosBase)||0,
            alumnosVinculados:Number(grupo.alumnosVinculados)||0,
            alumnosTotales:Number(grupo.alumnosTotales)||0,
            alumnosBaseGestor:Number(grupo.alumnosBaseGestor)||0,
            alumnosVinculadosGestor:Number(grupo.alumnosVinculadosGestor)||0,
            alumnosTotalesGestor:Number(grupo.alumnosTotalesGestor)||0,
            alumnosManualActivo:!!grupo.alumnosManualActivo,
            observacionAlumnos:limpiarTexto(grupo.observacionAlumnos,300),
            origen:['manual','gestor'].includes(grupo.origen)?grupo.origen:'manual',
            estado:['activo','pendiente','revisar'].includes(grupo.estado)?grupo.estado:'activo',
            fusionDesvinculada:!!grupo.fusionDesvinculada,
            fusionOrigenGrupoIds:Array.isArray(grupo.fusionOrigenGrupoIds)?grupo.fusionOrigenGrupoIds.map(id=>limpiarTexto(id)).filter(Boolean):[],
            fusionDesvinculadaEn:limpiarTexto(grupo.fusionDesvinculadaEn,80),
            fusionHistorial:Array.isArray(grupo.fusionHistorial)?grupo.fusionHistorial.map(h=>({
                idGestor:limpiarTexto(h.idGestor,80),
                grupoOrigenId:limpiarTexto(h.grupoOrigenId),
                seccionMadreId:limpiarTexto(h.seccionMadreId),
                seccionHijaId:limpiarTexto(h.seccionHijaId),
                asignaturaId:limpiarTexto(h.asignaturaId),
                fecha:limpiarTexto(h.fecha,80),
                usuario:limpiarTexto(h.usuario,120),
                accion:limpiarTexto(h.accion,80)||'desvinculada'
            })).filter(h=>h.seccionMadreId||h.idGestor||h.grupoOrigenId).slice(-20):[],
            observacion:limpiarTexto(grupo.observacion,300),
            creadoEn:limpiarTexto(grupo.creadoEn,80),
            actualizadoEn:limpiarTexto(grupo.actualizadoEn,80)
        };
        limpio.seccionesVinculadasIds=limpio.seccionesVinculadasIds.filter(id=>id!==limpio.seccionMadreId);
        if(!limpio.alumnosTotales) limpio.alumnosTotales=limpio.alumnosBase+limpio.alumnosVinculados;
        return limpio;
    }
    function getGruposDictacion(){ return Array.isArray(data.gruposDictacion)?data.gruposDictacion:[]; }
    function getGrupoDictacion(id){ return getGruposDictacion().find(g=>g.id===id)||null; }
    function grupoCoincideAsignatura(grupo,asignaturaId){
        if(!grupo||!asignaturaId) return false;
        return grupo.asignaturaId===asignaturaId || (grupo.asignaturasEquivalentesIds||[]).includes(asignaturaId);
    }
    function relacionFusionDesvinculada(asignaturaId,seccionId){
        return (data.asignaturaSeccion||[]).find(r=>r.asignaturaId===asignaturaId&&r.seccionId===seccionId&&r.fusionDesvinculada)||null;
    }
    function getGruposDictacionSeccion(seccionId){
        return getGruposDictacion().filter(g=>g.seccionMadreId===seccionId || g.seccionesVinculadasIds.includes(seccionId));
    }
    function getGrupoDictacionAsignaturaSeccion(asignaturaId,seccionId){
        const compatibles=getGruposDictacion().filter(g=>{
            const asignaturaCoincide=g.asignaturaId===asignaturaId || g.asignaturasEquivalentesIds.includes(asignaturaId);
            const seccionCoincide=g.seccionMadreId===seccionId || g.seccionesVinculadasIds.includes(seccionId);
            return asignaturaCoincide && seccionCoincide;
        });
        if(relacionFusionDesvinculada(asignaturaId,seccionId)){
            return compatibles.find(g=>g.seccionMadreId===seccionId)||null;
        }
        return compatibles.find(g=>g.seccionesVinculadasIds.includes(seccionId))||compatibles.find(g=>g.seccionMadreId===seccionId)||compatibles[0]||null;
    }
    function getEstadoDictacionAsignatura(asignaturaId,seccionId){
        const grupo=getGrupoDictacionAsignaturaSeccion(asignaturaId,seccionId);
        if(!grupo) return {estado:'sin-grupo', grupo:null, etiqueta:'Sin grupo'};
        if(grupo.seccionMadreId===seccionId) return {estado:'dictada-aqui', grupo, etiqueta:'Dictada aquí'};
        return {estado:'vinculada', grupo, etiqueta:'Vinculada desde'};
    }
    function getSeccionesConsumidorasGrupo(grupoOrId){
        const grupo=typeof grupoOrId==='string'?getGrupoDictacion(grupoOrId):grupoOrId;
        if(!grupo) return [];
        return [grupo.seccionMadreId, ...(grupo.seccionesVinculadasIds||[])].filter(Boolean);
    }
    function crearGrupoDictacion(datosGrupo={}){
        const ahora=new Date().toISOString();
        const grupo=normalizarGrupoDictacion(Object.assign({creadoEn:ahora, actualizadoEn:ahora}, datosGrupo));
        if(!grupo.asignaturaId || !grupo.seccionMadreId) return null;
        if(!Array.isArray(data.gruposDictacion)) data.gruposDictacion=[];
        if(!Array.isArray(data.vinculosElectivos)) data.vinculosElectivos=[];
        if(!Array.isArray(data.gruposElectivos)) data.gruposElectivos=[];
        data.gruposDictacion.push(grupo);
        auditoria('grupo_dictacion_creado',{grupoId:grupo.id, asignaturaId:grupo.asignaturaId, seccionMadreId:grupo.seccionMadreId, seccionesVinculadasIds:grupo.seccionesVinculadasIds});
        return grupo;
    }
    function vincularSeccionAGrupo(grupoId,seccionId, opciones={}){
        const grupo=getGrupoDictacion(grupoId);
        const id=limpiarTexto(seccionId);
        if(!grupo || !id || id===grupo.seccionMadreId) return false;
        if(!grupo.seccionesVinculadasIds.includes(id)) grupo.seccionesVinculadasIds.push(id);
        if(opciones.alumnos!==undefined && grupo.origen!=='gestor'){
            grupo.alumnosVinculados=Math.max(0,(Number(grupo.alumnosVinculados)||0)+(Number(opciones.alumnos)||0));
            grupo.alumnosTotales=(Number(grupo.alumnosBase)||0)+(Number(grupo.alumnosVinculados)||0);
        }
        grupo.actualizadoEn=new Date().toISOString();
        auditoria('grupo_dictacion_vinculo_agregado',{grupoId:grupo.id, seccionId:id});
        return true;
    }
    function desvincularSeccionDeGrupo(grupoId,seccionId){
        const grupo=getGrupoDictacion(grupoId);
        const id=limpiarTexto(seccionId);
        if(!grupo || !id) return false;
        const antes=grupo.seccionesVinculadasIds.length;
        grupo.seccionesVinculadasIds=grupo.seccionesVinculadasIds.filter(x=>x!==id);
        if(antes===grupo.seccionesVinculadasIds.length) return false;
        grupo.actualizadoEn=new Date().toISOString();
        auditoria('grupo_dictacion_vinculo_quitado',{grupoId:grupo.id, seccionId:id});
        return true;
    }
    function eliminarGrupoDictacion(grupoId){
        const id=limpiarTexto(grupoId);
        const antes=getGruposDictacion().length;
        data.gruposDictacion=getGruposDictacion().filter(g=>g.id!==id);
        if(antes===data.gruposDictacion.length) return false;
        auditoria('grupo_dictacion_eliminado',{grupoId:id});
        return true;
    }
    function crearDocenteNN(){
        return {
            id:DOCENTE_NN_ID,
            nombre:'Docente',
            apellido:'NN',
            tipoContrato:'nn',
            especialidad:'',
            horasHomologo:0,
            asignaturasQueDicta:[],
            prioridadAsignaturas:{},
            disponibilidad:DIAS.map(()=>Array(18).fill(true)),
            autorizadoExceder:true,
            fijo:true,
            sistema:true
        };
    }
    function asegurarDocenteNN(){
        if(!Array.isArray(data.docentes)) data.docentes=[];
        const idx=data.docentes.findIndex(d=>d.id===DOCENTE_NN_ID);
        const base=crearDocenteNN();
        if(idx>=0) data.docentes[idx]=Object.assign({}, data.docentes[idx], base);
        else data.docentes.push(base);
    }
    function sincronizarAsignaturaSeccionDesdeGestor(){
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        if(!data.gestorSecciones?.filas?.length) return;
        const carga=data.gestorSecciones.cargas.find(c=>c.id===data.gestorSecciones.ultimaCargaId)||data.gestorSecciones.cargas[0]||null;
        const filas=carga
            ? data.gestorSecciones.filas.filter(f=>f.cargaId===carga.id)
            : data.gestorSecciones.filas;
        if(!filas.length) return;
        const asignaturaPorCodigo=new Map(data.asignaturas.map(a=>[String(a.codigo||'').toUpperCase(),a.id]));
        const seccionPorNombre=new Map(data.secciones.map(s=>[normalizarEncabezadoGestor(s.nombre),s.id]));
        const existentes=new Set((data.asignaturaSeccion||[]).map(r=>`${r.asignaturaId}|${r.seccionId}`));
        filas.forEach(f=>{
            if(!esSeccionRealGestor(f.seccion)) return;
            const asignaturaId=asignaturaPorCodigo.get(String(f.codigoAsignatura||'').toUpperCase());
            const seccionBase=seccionBaseSinMarcaGestor(f.seccion);
            const seccionId=seccionPorNombre.get(normalizarEncabezadoGestor(seccionBase));
            if(!asignaturaId||!seccionId) return;
            const key=`${asignaturaId}|${seccionId}`;
            if(existentes.has(key)) return;
            data.asignaturaSeccion.push({asignaturaId,seccionId,origen:'gestor',idGestor:f.idSeccion||'',marcaGestor:marcaSeccionGestor(f.seccion)});
            existentes.add(key);
        });
    }
    function reconciliarFusionesDesvinculadas(){
        if(!Array.isArray(data.asignaturaSeccion)||!Array.isArray(data.gruposDictacion)) return;
        const ahora=new Date().toISOString();
        data.asignaturaSeccion
            .filter(r=>r.fusionDesvinculada&&r.asignaturaId&&r.seccionId)
            .forEach(rel=>{
                data.gruposDictacion.forEach(g=>{
                    if(!grupoCoincideAsignatura(g,rel.asignaturaId)) return;
                    if(g.seccionMadreId===rel.seccionId) return;
                    const antes=(g.seccionesVinculadasIds||[]).length;
                    if(!antes||!g.seccionesVinculadasIds.includes(rel.seccionId)) return;
                    g.seccionesVinculadasIds=g.seccionesVinculadasIds.filter(id=>id!==rel.seccionId);
                    if(!g.alumnosManualActivo){
                        const vinculadosActuales=Number(g.alumnosVinculados)||0;
                        const aporte=antes<=1?vinculadosActuales:Math.round(vinculadosActuales/antes);
                        g.alumnosVinculados=Math.max(0,vinculadosActuales-aporte);
                        if(!g.seccionesVinculadasIds.length) g.alumnosVinculados=0;
                        g.alumnosTotales=(Number(g.alumnosBase)||0)+(Number(g.alumnosVinculados)||0);
                    }
                    g.actualizadoEn=ahora;
                });
                const propio=data.gruposDictacion.find(g=>g.seccionMadreId===rel.seccionId&&grupoCoincideAsignatura(g,rel.asignaturaId));
                if(propio){
                    propio.fusionDesvinculada=true;
                    propio.fusionDesvinculadaEn=propio.fusionDesvinculadaEn||rel.fusionDesvinculadaEn||ahora;
                    propio.idGestorSeccion=propio.idGestorSeccion||rel.idGestorDesvinculado||rel.idGestor||'';
                    propio.seccionesVinculadasIds=(propio.seccionesVinculadasIds||[]).filter(id=>id!==rel.seccionId);
                }
            });
    }
    function recalcularAlumnosGruposDesdeGestor(){
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        if(!Array.isArray(data.gruposDictacion)||!data.gestorSecciones?.filas?.length) return;
        const carga=data.gestorSecciones.cargas.find(c=>c.id===data.gestorSecciones.ultimaCargaId)||data.gestorSecciones.cargas[0]||null;
        const filas=carga
            ? data.gestorSecciones.filas.filter(f=>f.cargaId===carga.id)
            : data.gestorSecciones.filas;
        if(!filas.length) return;
        const seccionPorId=new Map(data.secciones.map(s=>[s.id,s]));
        const asignaturaPorId=new Map(data.asignaturas.map(a=>[a.id,a]));
        data.gruposDictacion.forEach(grupo=>{
            if(grupo.fusionDesvinculada || relacionFusionDesvinculada(grupo.asignaturaId,grupo.seccionMadreId)) return;
            if(!grupo.idGestorSeccion) return;
            const asig=asignaturaPorId.get(grupo.asignaturaId);
            const madre=seccionPorId.get(grupo.seccionMadreId);
            const codigo=String(asig?.codigo||'').toUpperCase();
            const idGestor=String(grupo.idGestorSeccion||'');
            const filasId=filas.filter(f=>
                String(f.idSeccion||'')===idGestor &&
                (!codigo || String(f.codigoAsignatura||'').toUpperCase()===codigo)
            );
            if(!filasId.length) return;
            const filaMadre=filasId.find(f=>
                tipoFilaGestor(f)==='planificada' &&
                esSeccionRealGestor(f.seccion) &&
                (!madre || normalizarEncabezadoGestor(seccionBaseSinMarcaGestor(f.seccion))===normalizarEncabezadoGestor(madre.nombre))
            ) || filasId.find(f=>tipoFilaGestor(f)==='planificada'&&esSeccionRealGestor(f.seccion));
            if(!filaMadre) return;
            const fusionadas=filasId.filter(f=>tipoFilaGestor(f)==='fusionada');
            const alumnosBase=Number(filaMadre.alumnos)||0;
            const vinculadasActivas=(grupo.seccionesVinculadasIds||[]).filter(id=>{
                const rel=relacionFusionDesvinculada(grupo.asignaturaId,id);
                return !rel;
            });
            const totalFusionGestor=fusionadas.reduce((acc,f)=>acc+(Number(f.alumnos)||0),0);
            let alumnosVinculados=totalFusionGestor;
            if(!vinculadasActivas.length) alumnosVinculados=0;
            else if(fusionadas.length && vinculadasActivas.length<fusionadas.length){
                alumnosVinculados=Math.round(totalFusionGestor*(vinculadasActivas.length/fusionadas.length));
            }
            grupo.marcaGestor=marcaSeccionGestor(filaMadre.seccion)||grupo.marcaGestor||'';
            grupo.alumnosBaseGestor=alumnosBase;
            grupo.alumnosVinculadosGestor=alumnosVinculados;
            grupo.alumnosTotalesGestor=alumnosBase+alumnosVinculados;
            if(!grupo.alumnosManualActivo){
                grupo.alumnosBase=alumnosBase;
                grupo.alumnosVinculados=alumnosVinculados;
                grupo.alumnosTotales=alumnosBase+alumnosVinculados;
            }
        });
    }
    function normalizarSeccionesMarcadasGestor(){
        if(!Array.isArray(data.secciones)) return;
        const basePorNivel=new Map();
        data.secciones.forEach(s=>{
            if(tieneMarcaFusionGestor(s.nombre)) return;
            basePorNivel.set(`${s.nivelId}|${normalizarEncabezadoGestor(s.nombre)}`,s);
        });
        const reemplazos=new Map();
        data.secciones.forEach(s=>{
            if(!tieneMarcaFusionGestor(s.nombre)) return;
            const baseNombre=seccionBaseSinMarcaGestor(s.nombre);
            const key=`${s.nivelId}|${normalizarEncabezadoGestor(baseNombre)}`;
            const base=basePorNivel.get(key);
            if(base&&base.id!==s.id){
                reemplazos.set(s.id,base.id);
            }else{
                s.nombre=baseNombre;
                s.tipoSeccion='regular';
                basePorNivel.set(key,s);
            }
        });
        if(!reemplazos.size) return;
        data.planificaciones.forEach(p=>{ if(reemplazos.has(p.seccionId)) p.seccionId=reemplazos.get(p.seccionId); });
        data.asignaturaSeccion.forEach(r=>{ if(reemplazos.has(r.seccionId)) r.seccionId=reemplazos.get(r.seccionId); });
        data.gruposDictacion.forEach(g=>{
            if(reemplazos.has(g.seccionMadreId)) g.seccionMadreId=reemplazos.get(g.seccionMadreId);
            g.seccionesVinculadasIds=[...new Set((g.seccionesVinculadasIds||[]).map(id=>reemplazos.get(id)||id).filter(id=>id&&id!==g.seccionMadreId))];
        });
        data.secciones=data.secciones.filter(s=>!reemplazos.has(s.id));
    }
    function normalizarDatos() {
        data.configuracion = Object.assign(JSON.parse(JSON.stringify(CONFIG_DEFAULT)), data.configuracion || {});
        ordenarTemporadas();
        data.configuracion.dashboard = Object.assign({}, CONFIG_DEFAULT.dashboard, data.configuracion.dashboard || {});
        if(!data.configuracion.perfilesUsuarios || typeof data.configuracion.perfilesUsuarios!=='object' || Array.isArray(data.configuracion.perfilesUsuarios)) data.configuracion.perfilesUsuarios={};
        data.configuracion.memoriaPlanificacion = Object.assign({}, CONFIG_DEFAULT.memoriaPlanificacion, data.configuracion.memoriaPlanificacion || {});
        if(!['baja','media','alta'].includes(data.configuracion.memoriaPlanificacion.fuerza)) data.configuracion.memoriaPlanificacion.fuerza='baja';
        if(!Array.isArray(data.configuracion.memoriaPlanificacion.senales)) data.configuracion.memoriaPlanificacion.senales=[];
        data.configuracion.memoriaPlanificacion.senales=data.configuracion.memoriaPlanificacion.senales.slice(-(Number(data.configuracion.memoriaPlanificacion.maxSenales)||500));
        if(data.ultimoAutoGeneral && (!Array.isArray(data.ultimoAutoGeneral.detalle) || typeof data.ultimoAutoGeneral.total!=='number')) data.ultimoAutoGeneral=null;
        if(!Array.isArray(data.autoEjecuciones)) data.autoEjecuciones=[];
        if(data.ultimaAutoEjecucion?.ids?.length && !data.autoEjecuciones.some(e=>e.id===data.ultimaAutoEjecucion.id)) data.autoEjecuciones.unshift(data.ultimaAutoEjecucion);
        if(data.ultimaAutoEjecucion && (!Array.isArray(data.ultimaAutoEjecucion.ids) || !data.ultimaAutoEjecucion.ids.length)) data.ultimaAutoEjecucion=null;
        data.configuracion.autoPlanificacion = Object.assign({}, CONFIG_DEFAULT.autoPlanificacion, data.configuracion.autoPlanificacion || {});
        if(!['balanceada','compacta','docente'].includes(data.configuracion.autoPlanificacion.estrategiaPredeterminada)) data.configuracion.autoPlanificacion.estrategiaPredeterminada='balanceada';
        data.configuracion.motorSolver=['heuristico','matematico','hibrido'].includes(data.configuracion.motorSolver)?data.configuracion.motorSolver:CONFIG_DEFAULT.motorSolver;
        data.configuracion.solverPesos = Object.assign({}, CONFIG_DEFAULT.solverPesos, data.configuracion.solverPesos || {});
        const normalizarNivelSolver=(valor, fallback='media')=>{
            const mapaLegacy={'desactivado':'ignorar','bajo':'baja','medio':'media','alto':'alta','muy-alto':'obligatorio'};
            const v=mapaLegacy[valor]||valor;
            return ['ignorar','baja','media','alta','obligatorio'].includes(v)?v:fallback;
        };
        Object.keys(CONFIG_DEFAULT.solverPesos).forEach(k=>{
            data.configuracion.solverPesos[k]=normalizarNivelSolver(data.configuracion.solverPesos[k],CONFIG_DEFAULT.solverPesos[k]);
        });
        if(!['xlsx','html'].includes(data.configuracion.exportacionExcel)) data.configuracion.exportacionExcel='xlsx';
        if(!['codigo','nombre','codigo_nombre','codigo_nombre_resumido'].includes(data.configuracion.formatoTextoBloque)) data.configuracion.formatoTextoBloque=CONFIG_DEFAULT.formatoTextoBloque;
        if(!['codigo','nombre','codigo_nombre','codigo_nombre_resumido'].includes(data.configuracion.formatoTextoBloqueVistaHorario)) data.configuracion.formatoTextoBloqueVistaHorario=CONFIG_DEFAULT.formatoTextoBloqueVistaHorario;
        if(!['codigo','nombre','codigo_nombre','codigo_nombre_resumido'].includes(data.configuracion.formatoTextoBloqueFichaDocente)) data.configuracion.formatoTextoBloqueFichaDocente=CONFIG_DEFAULT.formatoTextoBloqueFichaDocente;
        data.configuracion.vistaGeneralColumnas=Math.max(1,Math.min(4,parseInt(data.configuracion.vistaGeneralColumnas)||2));
        data.configuracion.vistaGeneralCampos=Object.assign({},CONFIG_DEFAULT.vistaGeneralCampos,data.configuracion.vistaGeneralCampos||{});
        if(!['planhor','institucional','sobrio','usuario'].includes(data.configuracion.temaVisualActivo)) data.configuracion.temaVisualActivo='planhor';
        if(data.configuracion.temaVisualActivo==='usuario'&&(!data.configuracion.temaUsuario||typeof data.configuracion.temaUsuario!=='object'||Array.isArray(data.configuracion.temaUsuario))){
            data.configuracion.temaUsuario=clonarTemaVisualBase('planhor');
        }
        if(data.configuracion.temaUsuario&&typeof data.configuracion.temaUsuario==='object'&&!Array.isArray(data.configuracion.temaUsuario)){
            const baseUsuario=clonarTemaVisualBase(data.configuracion.temaUsuario.basadoEn||'planhor');
            data.configuracion.temaUsuario=Object.assign(baseUsuario,data.configuracion.temaUsuario||{});
            data.configuracion.temaUsuario.temporadas=Object.assign({},baseUsuario.temporadas,data.configuracion.temaUsuario.temporadas||{});
            data.configuracion.temaUsuario.extras=Object.assign({},baseUsuario.extras,data.configuracion.temaUsuario.extras||{});
            if(data.configuracion.temaUsuario.extras['planhor-available-bg']==='#d8f1ee') data.configuracion.temaUsuario.extras['planhor-available-bg']='#e1ebe4';
            if(data.configuracion.temaUsuario.extras['planhor-available-border']==='#18a8a0') data.configuracion.temaUsuario.extras['planhor-available-border']='#5f806d';
            if(!Array.isArray(data.configuracion.temaUsuario.colores)||!data.configuracion.temaUsuario.colores.length) data.configuracion.temaUsuario.colores=baseUsuario.colores;
        }
        if(!Array.isArray(data.gruposDictacion)) data.gruposDictacion=[];
        if(!Array.isArray(data.asignaturaSeccion)) data.asignaturaSeccion=[];
        data.sel=Object.assign({temporadaId:null,area:null,carreraId:null,nivelId:null,seccionId:null,asignaturaId:null,docenteId:null,salaId:null,tipo:'presencial'},data.sel||{});
        delete data.sel.cargaExterna;
        const defaultsArea=new Set(['electricidad','automatización','automatizacion','electrónicos','electronicos','transversales']);
        const areasEnUso=new Set(data.carreras.map(c=>limpiarTexto(c.area||c.especialidad).toLowerCase()).filter(Boolean));
        data.configuracion.especialidades=(data.configuracion.especialidades||[]).filter(e=>!defaultsArea.has(limpiarTexto(e).toLowerCase())||areasEnUso.has(limpiarTexto(e).toLowerCase()));
        data.carreras.forEach(c=>{
            if(!c.area) c.area=c.especialidad||'Sin área';
            if(c.area&&!data.configuracion.especialidades.some(e=>limpiarTexto(e).toLowerCase()===limpiarTexto(c.area).toLowerCase())) data.configuracion.especialidades.push(c.area);
        });
        data.salas.forEach(s=>{
            if(!s.tipoSala) s.tipoSala=s.esVirtual?'Virtual':(s.id===SALA_TRO2_ID?'Terreno':'Sala de Clases');
            if(!Array.isArray(s.alertasImportacion)) s.alertasImportacion=[];
        });
        data.secciones.forEach(s=>{
            if(!['regular','fusionada','equivalente','fusionada-equivalente'].includes(s.tipoSeccion)){
                s.tipoSeccion=tieneMarcaFusionGestor(s.nombre)?'fusionada':'regular';
            }
            if(!['diurna','vespertina'].includes(s.jornada)){
                s.jornada=jornadaGestor('',s.nombre);
            }
        });
        normalizarSeccionesMarcadasGestor();
        data.asignaturas.forEach(a=>{
            a.horasTotales=Number(a.horasTotales)||0;
            a.horasVirtuales=Number(a.horasVirtuales)||0;
            a.horasPresenciales=Number(a.horasPresenciales)||Math.max(0,a.horasTotales-a.horasVirtuales);
            const bloquesPresencialesCalc=a.horasPresenciales>0?Math.max(1,Math.round(a.horasPresenciales/18)):0;
            const bloquesVirtualesCalc=a.horasVirtuales>0?Math.max(1,Math.round(a.horasVirtuales/18)):0;
            a.bloquesPresenciales=Number(a.bloquesPresenciales)>0?Math.round(Number(a.bloquesPresenciales)):bloquesPresencialesCalc;
            a.bloquesVirtuales=Number(a.bloquesVirtuales)>0?Math.round(Number(a.bloquesVirtuales)):bloquesVirtualesCalc;
            if(!['especialidad','transversal','electiva'].includes(a.area)) a.area='especialidad';
            if(!['lectiva','practica','semipresencial','online-teams'].includes(a.modalidad)) a.modalidad='lectiva';
            if(!['normal','alta-reprobacion','requiere-ayudantia','alta-reprobacion-ayudantia'].includes(a.condicion)) a.condicion='normal';
            if(!['compacta','balanceada','dividida','flexible'].includes(a.distribucion)) a.distribucion=a.area==='transversal'?'balanceada':'compacta';
            if(!['propio','coordinacion-externa'].includes(a.controlHorario)) a.controlHorario=a.area==='transversal'?'coordinacion-externa':'propio';
            if(!['flexible','evitar-temprano','proteger-repitentes'].includes(a.preferenciaHoraria)) a.preferenciaHoraria='flexible';
            a.grupoElectivo=a.area==='electiva'?limpiarTexto(a.grupoElectivo,120):'';
            a.destinosElectivaIds=a.area==='electiva'&&Array.isArray(a.destinosElectivaIds)
                ? [...new Set(a.destinosElectivaIds.map(id=>limpiarTexto(id)).filter(Boolean))]
                : [];
            a.alertasImportacion=Array.isArray(a.alertasImportacion)?a.alertasImportacion.map(x=>limpiarTexto(x,160)).filter(Boolean):[];
        });
        recalcularAreasAsignaturasDesdeGestor();
        data.niveles.forEach(n=>{ n.tieneOnline=!!n.tieneOnline; });
        data.planificaciones.forEach(p=>{
            p.fijo=!!p.fijo;
            if(p.explicacionAuto) {
                const exp=p.explicacionAuto;
                p.explicacionAuto={
                    origen:typeof exp.origen==='string'?exp.origen:'Auto',
                    estrategia:typeof exp.estrategia==='string'?exp.estrategia:'',
                    puntaje:Number(exp.puntaje)||0,
                    razones:Array.isArray(exp.razones)?exp.razones.map(r=>String(r).slice(0,160)).filter(Boolean).slice(0,5):[],
                    generadoEn:typeof exp.generadoEn==='string'?exp.generadoEn:''
                };
            }
        });
        const asignaturasValidas=new Set(data.asignaturas.map(a=>a.id));
        const seccionesValidas=new Set(data.secciones.map(s=>s.id));
        const origenElectivaLegacy=(asignaturaId)=>{
            const plan=data.planificaciones.find(p=>p.asignaturaId===asignaturaId&&seccionesValidas.has(p.seccionId));
            if(plan) return plan.seccionId;
            const relSeccion=(data.asignaturaSeccion||[]).find(r=>r.asignaturaId===asignaturaId&&seccionesValidas.has(r.seccionId));
            if(relSeccion) return relSeccion.seccionId;
            const relNivel=(data.asignaturaCarreraNivel||[]).find(r=>r.asignaturaId===asignaturaId);
            return relNivel?data.secciones.find(s=>s.nivelId===relNivel.nivelId)?.id||'':'';
        };
        const agregarVinculoMigrado=(asignaturaId,seccionOrigenId,seccionDestinoId)=>{
            if(!asignaturasValidas.has(asignaturaId)||!seccionesValidas.has(seccionOrigenId)||!seccionesValidas.has(seccionDestinoId)||seccionOrigenId===seccionDestinoId) return;
            if(!data.vinculosElectivos.some(v=>v.asignaturaId===asignaturaId&&v.seccionOrigenId===seccionOrigenId&&v.seccionDestinoId===seccionDestinoId)){
                data.vinculosElectivos.push({id:genId(),asignaturaId,seccionOrigenId,seccionDestinoId,origen:'migracion'});
            }
        };
        (data.gruposElectivos||[]).forEach(g=>(g.asignaturaIds||[]).forEach(asignaturaId=>{
            const seccionOrigenId=origenElectivaLegacy(asignaturaId);
            (g.seccionIds||[]).forEach(seccionDestinoId=>agregarVinculoMigrado(asignaturaId,seccionOrigenId,seccionDestinoId));
        }));
        data.asignaturas.filter(a=>a.area==='electiva'&&Array.isArray(a.destinosElectivaIds)).forEach(a=>{
            const seccionOrigenId=origenElectivaLegacy(a.id);
            a.destinosElectivaIds.forEach(seccionDestinoId=>agregarVinculoMigrado(a.id,seccionOrigenId,seccionDestinoId));
        });
        data.vinculosElectivos=data.vinculosElectivos.map(v=>({
            id:limpiarTexto(v.id)||genId(),
            asignaturaId:limpiarTexto(v.asignaturaId),
            seccionOrigenId:limpiarTexto(v.seccionOrigenId),
            seccionDestinoId:limpiarTexto(v.seccionDestinoId),
            origen:limpiarTexto(v.origen,40)||'manual'
        })).filter(v=>asignaturasValidas.has(v.asignaturaId)&&data.asignaturas.find(a=>a.id===v.asignaturaId)?.area==='electiva'&&seccionesValidas.has(v.seccionOrigenId)&&seccionesValidas.has(v.seccionDestinoId)&&v.seccionOrigenId!==v.seccionDestinoId)
          .filter((v,i,arr)=>arr.findIndex(x=>x.asignaturaId===v.asignaturaId&&x.seccionOrigenId===v.seccionOrigenId&&x.seccionDestinoId===v.seccionDestinoId)===i);
        delete data.gruposElectivos;
        data.asignaturas.forEach(a=>{ delete a.grupoElectivo; delete a.destinosElectivaIds; });
        data.asignaturaSeccion=data.asignaturaSeccion
            .map(r=>({
                asignaturaId:limpiarTexto(r.asignaturaId),
                seccionId:limpiarTexto(r.seccionId),
                origen:limpiarTexto(r.origen,40)||'manual',
                idGestor:limpiarTexto(r.idGestor,80),
                marcaGestor:limpiarTexto(r.marcaGestor,8).toUpperCase(),
                fusionDesvinculada:!!r.fusionDesvinculada,
                fusionDesvinculadaEn:limpiarTexto(r.fusionDesvinculadaEn,80),
                idGestorDesvinculado:limpiarTexto(r.idGestorDesvinculado,80),
                seccionMadreDesvinculadaId:limpiarTexto(r.seccionMadreDesvinculadaId),
                fusionOrigenGrupoIds:Array.isArray(r.fusionOrigenGrupoIds)?r.fusionOrigenGrupoIds.map(id=>limpiarTexto(id)).filter(Boolean):[],
                fusionHistorial:Array.isArray(r.fusionHistorial)?r.fusionHistorial.map(h=>({
                    idGestor:limpiarTexto(h.idGestor,80),
                    grupoOrigenId:limpiarTexto(h.grupoOrigenId),
                    seccionMadreId:limpiarTexto(h.seccionMadreId),
                    seccionHijaId:limpiarTexto(h.seccionHijaId),
                    asignaturaId:limpiarTexto(h.asignaturaId),
                    fecha:limpiarTexto(h.fecha,80),
                    usuario:limpiarTexto(h.usuario,120),
                    accion:limpiarTexto(h.accion,80)||'desvinculada'
                })).filter(h=>h.seccionMadreId||h.idGestor||h.grupoOrigenId).slice(-20):[]
            }))
            .filter(r=>asignaturasValidas.has(r.asignaturaId)&&seccionesValidas.has(r.seccionId))
            .filter((r,i,arr)=>arr.findIndex(x=>x.asignaturaId===r.asignaturaId&&x.seccionId===r.seccionId)===i);
        sincronizarAsignaturaSeccionDesdeGestor();
        data.gruposDictacion=data.gruposDictacion
            .map(normalizarGrupoDictacion)
            .filter(g=>asignaturasValidas.has(g.asignaturaId) && seccionesValidas.has(g.seccionMadreId))
            .map(g=>{
                g.seccionesVinculadasIds=g.seccionesVinculadasIds.filter(id=>seccionesValidas.has(id));
                g.asignaturasEquivalentesIds=g.asignaturasEquivalentesIds.filter(id=>asignaturasValidas.has(id) && id!==g.asignaturaId);
                return g;
            });
        reconciliarFusionesDesvinculadas();
        recalcularAlumnosGruposDesdeGestor();
        asegurarDocenteNN();
        data.docentes.forEach(d=>{
            if(d.id===DOCENTE_NN_ID){
                Object.assign(d, crearDocenteNN());
                return;
            }
            if(!d.disponibilidad || d.disponibilidad.length===0) d.disponibilidad=DIAS.map(()=>Array(18).fill(false));
        });
    }
    function reconstruirIndices() {
        indicePlan={}; contadorDocente={}; contadorDocenteDia={}; ocupacionSala={};
        const planes=getPlanificaciones();
        planes.forEach(p=>{
            indicePlan[`${p.seccionId}_${p.dia}_${p.bloque}`]=p;
            contadorDocente[p.docenteId]=(contadorDocente[p.docenteId]||0)+1;
            const k=`${p.docenteId}_${p.dia}`; contadorDocenteDia[k]=(contadorDocenteDia[k]||0)+1;
            if(p.salaId && p.salaId!==SALA_VIRTUAL_ID && p.salaId!==SALA_TRO2_ID) ocupacionSala[`${p.salaId}_${p.dia}_${p.bloque}`]=true;
        });
    }
    function toast(msg,tipo='info'){
        const c=document.getElementById('toastContainer');
        if(!c) return;
        const t=document.createElement('div');
        t.className=`toast ${tipo}`;
        const texto=document.createElement('span');
        texto.className='toast-text';
        texto.textContent=msg;
        const cerrar=document.createElement('button');
        cerrar.className='toast-close';
        cerrar.type='button';
        cerrar.setAttribute('aria-label','Cerrar aviso');
        cerrar.textContent='×';
        const quitar=()=>{
            if(t.dataset.closing) return;
            t.dataset.closing='1';
            t.style.opacity='0';
            t.style.transform='translateX(24px)';
            setTimeout(()=>t.remove(),240);
        };
        cerrar.addEventListener('click',quitar);
        t.append(texto,cerrar);
        c.appendChild(t);
        setTimeout(quitar, tipo==='error' ? 5200 : 2600);
    }

    function mostrarErrorTecnico(opciones={}){
        const cfg=Object.assign({
            titulo:'No se pudo completar la acción',
            mensaje:'Se detectó un error técnico. La app principal sigue funcionando.',
            modulo:'Aplicación',
            accion:'Acción no especificada',
            error:null
        },opciones||{});
        const error=cfg.error||{};
        const detalle=[
            `Módulo: ${cfg.modulo}`,
            `Acción: ${cfg.accion}`,
            `Mensaje: ${error?.message||String(error||'Error no identificado')}`,
            error?.name ? `Tipo: ${error.name}` : '',
            error?.stack ? `Stack:\n${String(error.stack).split('\n').slice(0,8).join('\n')}` : ''
        ].filter(Boolean).join('\n\n');
        console.error(`[${cfg.modulo}] ${cfg.accion}:`, error);
        document.getElementById('technicalErrorOverlay')?.remove();
        const overlay=document.createElement('div');
        overlay.id='technicalErrorOverlay';
        overlay.className='modal-overlay technical-error-overlay';
        overlay.innerHTML=`
            <div class="modal technical-error-modal">
                <div class="modal-header">
                    <h3>${escapeHTML(cfg.titulo)}</h3>
                    <p>${escapeHTML(cfg.mensaje)}</p>
                </div>
                <div class="technical-error-summary">
                    <div><strong>Módulo</strong><span>${escapeHTML(cfg.modulo)}</span></div>
                    <div><strong>Acción</strong><span>${escapeHTML(cfg.accion)}</span></div>
                    <div><strong>Error</strong><span>${escapeHTML(error?.message||String(error||'Error no identificado'))}</span></div>
                </div>
                <textarea class="technical-error-detail" readonly>${escapeHTML(detalle)}</textarea>
                <div class="modal-actions">
                    <button class="btn" id="technicalCopy" type="button">Copiar detalle</button>
                    <button class="btn btn-primary" id="technicalClose" type="button">Cerrar</button>
                </div>
            </div>`;
        const cerrar=()=>cerrarFlotante(overlay);
        overlay.addEventListener('click',e=>{ if(e.target===overlay) cerrar(); });
        overlay.querySelector('#technicalClose')?.addEventListener('click',cerrar);
        overlay.querySelector('#technicalCopy')?.addEventListener('click',async()=>{
            try{
                await navigator.clipboard?.writeText(detalle);
                toast('Detalle técnico copiado','success');
            }catch(e){
                toast('No se pudo copiar automáticamente','warning');
            }
        });
        document.body.appendChild(overlay);
        overlay.querySelector('#technicalClose')?.focus();
    }

    function colorExportableHtml2Canvas(valor,fallback='#ffffff'){
        const txt=String(valor||'').trim();
        if(!txt) return fallback;
        if(txt==='transparent'||txt==='rgba(0, 0, 0, 0)'||txt==='rgba(0,0,0,0)') return 'transparent';
        if(/^(#|rgb|hsl)/i.test(txt)) return txt;
        const m=txt.match(/^color\([^\s]+\s+([0-9.]+%?)\s+([0-9.]+%?)\s+([0-9.]+%?)(?:\s*\/\s*([0-9.]+%?))?\)$/i);
        if(m){
            const canal=v=>{
                const s=String(v||'0');
                const n=parseFloat(s);
                return Math.max(0,Math.min(255,Math.round(s.includes('%') ? n*2.55 : n*255)));
            };
            const a=m[4]?.includes('%') ? Math.max(0,Math.min(1,parseFloat(m[4])/100)) : Math.max(0,Math.min(1,Number(m[4]??1)));
            return a<1 ? `rgba(${canal(m[1])}, ${canal(m[2])}, ${canal(m[3])}, ${a})` : `rgb(${canal(m[1])}, ${canal(m[2])}, ${canal(m[3])})`;
        }
        return fallback;
    }

    function primerColorExportable(valor,fallback='#ffffff'){
        const txt=String(valor||'');
        const color=txt.match(/color\([^)]+\)/i)?.[0] || txt.match(/rgba?\([^)]+\)/i)?.[0] || txt.match(/#[0-9a-f]{3,8}/i)?.[0] || '';
        return colorExportableHtml2Canvas(color,fallback);
    }

    function sanitizarNodoExportacion(origen,destino){
        if(!origen || !destino || origen.nodeType!==1 || destino.nodeType!==1) return;
        const vista=origen.ownerDocument?.defaultView||window;
        const cs=vista.getComputedStyle(origen);
        const fijar=(propiedad,valor)=>destino.style.setProperty(propiedad,valor,'important');
        const bgImage=String(cs.backgroundImage||'');
        const bgColor=colorExportableHtml2Canvas(cs.backgroundColor,'transparent');
        fijar('color',colorExportableHtml2Canvas(cs.color,'#102840'));
        fijar('background-color',bgColor==='transparent'&&bgImage!=='none' ? primerColorExportable(bgImage,'#ffffff') : bgColor);
        if(bgImage.includes('color(') || bgImage.includes('color-mix(')) fijar('background-image','none');
        ['Top','Right','Bottom','Left'].forEach(lado=>{
            fijar(`border-${lado.toLowerCase()}-color`,colorExportableHtml2Canvas(cs[`border${lado}Color`],'#d9e4ec'));
        });
        fijar('outline-color',colorExportableHtml2Canvas(cs.outlineColor,'#0b7f86'));
        fijar('text-decoration-color',colorExportableHtml2Canvas(cs.textDecorationColor,'#102840'));
        fijar('caret-color',colorExportableHtml2Canvas(cs.caretColor,'#102840'));
        fijar('column-rule-color',colorExportableHtml2Canvas(cs.columnRuleColor,'#d9e4ec'));
        if(String(cs.boxShadow||'').includes('color(') || String(cs.boxShadow||'').includes('color-mix(')) fijar('box-shadow','none');
        if(String(cs.textShadow||'').includes('color(') || String(cs.textShadow||'').includes('color-mix(')) fijar('text-shadow','none');
        if(String(cs.filter||'').includes('color(') || String(cs.filter||'').includes('color-mix(')) fijar('filter','none');
        const hijosOrigen=Array.from(origen.children||[]);
        const hijosDestino=Array.from(destino.children||[]);
        hijosDestino.forEach((hijo,i)=>sanitizarNodoExportacion(hijosOrigen[i],hijo));
    }

    function confirmarAccionCritica(opciones={}){
        const cfg=Object.assign({
            titulo:'Confirmar acción crítica',
            mensaje:'Esta acción puede modificar información importante.',
            queHara:'',
            afectara:'',
            noTocara:'',
            seguridad:'',
            detalles:[],
            confirmarTexto:'Confirmar',
            cancelarTexto:'Cancelar',
            peligro:true
        },opciones||{});
        return new Promise(resolve=>{
            document.getElementById('criticalConfirmOverlay')?.remove();
            const overlay=document.createElement('div');
            overlay.id='criticalConfirmOverlay';
            overlay.className='modal-overlay critical-confirm-overlay';
            const detalles=Array.isArray(cfg.detalles)?cfg.detalles.filter(Boolean):[];
            const filas=[
                ['Qué hará',cfg.queHara],
                ['Afectará',cfg.afectara],
                ['No tocará',cfg.noTocara],
                ['Seguridad',cfg.seguridad]
            ].filter(([,valor])=>String(valor||'').trim());
            overlay.innerHTML=`
                <div class="modal critical-confirm-modal">
                    <div class="critical-confirm-icon ${cfg.peligro?'danger':'warning'}">!</div>
                    <div class="modal-header">
                        <h3>${escapeHTML(cfg.titulo)}</h3>
                        <p>${escapeHTML(cfg.mensaje)}</p>
                    </div>
                    ${filas.length?`<div class="critical-confirm-summary">${filas.map(([label,valor])=>`
                        <div class="critical-confirm-row">
                            <strong>${escapeHTML(label)}</strong>
                            <span>${escapeHTML(valor)}</span>
                        </div>
                    `).join('')}</div>`:''}
                    ${detalles.length?`<div class="critical-confirm-box">${detalles.map(d=>`<div>${escapeHTML(d)}</div>`).join('')}</div>`:''}
                    <div class="modal-actions split-actions">
                        <div></div>
                        <div class="action-right">
                            <button class="btn" id="criticalCancel" type="button">${escapeHTML(cfg.cancelarTexto)}</button>
                            <button class="btn ${cfg.peligro?'btn-danger':'btn-primary'}" id="criticalConfirm" type="button">${escapeHTML(cfg.confirmarTexto)}</button>
                        </div>
                    </div>
                </div>`;
            let resuelto=false;
            const cerrar=(valor)=>{
                if(resuelto) return;
                resuelto=true;
                cerrarFlotante(overlay).finally(()=>resolve(!!valor));
            };
            overlay.addEventListener('click',e=>{ if(e.target===overlay) cerrar(false); });
            overlay.querySelector('#criticalCancel')?.addEventListener('click',()=>cerrar(false));
            overlay.querySelector('#criticalConfirm')?.addEventListener('click',()=>cerrar(true));
            document.body.appendChild(overlay);
            overlay.querySelector('#criticalCancel')?.focus();
        });
    }

    const PANEL_POR_TAB = {
        dashboard:'panelDashboard',
        secciones:'panelSecciones',
        asignaturas:'panelAsignaturas',
        docentes:'panelDocentes',
        salas:'panelSalas',
        organizarSalas:'panelOptimizadorManual',
        planificacion:'panelPlanificacion',
        vistaHorarios:'panelVistaHorarios',
        reportes:'panelReportes',
        gestorSecciones:'panelGestorSecciones',
        historial:'panelHistorial',
        fichaDocente:'panelFichaDocente'
    };
    function limpiarErrorPanel(tab){
        const panel=document.getElementById(PANEL_POR_TAB[tab]);
        panel?.querySelector('.tab-error-panel')?.remove();
    }
    function mostrarErrorPanel(tab,error){
        const panel=document.getElementById(PANEL_POR_TAB[tab]);
        if(!panel) return;
        panel.querySelector('.tab-error-panel')?.remove();
        const box=document.createElement('div');
        box.className='tab-error-panel';
        box.innerHTML=`
            <strong>No se pudo cargar ${escapeHTML(tabLabel(tab)||'esta vista')}</strong>
            <span>La app principal sigue funcionando. Recarga la pestaña o revisa esta vista antes de continuar usándola.</span>
            <small>${escapeHTML(error?.message||String(error||'Error no identificado'))}</small>
        `;
        panel.prepend(box);
    }
    function ejecutarRenderTab(tab,fn){
        try{
            limpiarErrorPanel(tab);
            fn();
        }catch(e){
            console.error(`Error al renderizar ${tab}:`, e);
            mostrarErrorPanel(tab,e);
            toast(`No se pudo cargar ${tabLabel(tab)||'la vista'}. El resto de la app sigue operativo.`,'warning');
        }
    }
    function renderTabActual(){
        publicarCuentaActual();
        const tab=document.querySelector('.tab-btn.active')?.dataset?.tab || 'secciones';
        if(tab==='dashboard') ejecutarRenderTab(tab,()=>{ renderDashboard(); detectarConflictos(); });
        else if(tab==='secciones') ejecutarRenderTab(tab,renderCarreras);
        else if(tab==='asignaturas') ejecutarRenderTab(tab,renderAsignaturas);
        else if(tab==='docentes') ejecutarRenderTab(tab,renderDocentes);
        else if(tab==='salas') ejecutarRenderTab(tab,renderSalas);
        else if(tab==='organizarSalas') ejecutarRenderTab(tab,renderOrganizadorSalas);
        else if(tab==='planificacion') ejecutarRenderTab(tab,()=>{ construirGrilla(); actualizarSelectoresPlan(); actualizarModoPlanificacionUI(); actualizarProgresoPlan(); });
        else if(tab==='vistaHorarios') ejecutarRenderTab(tab,actualizarVista);
        else if(tab==='reportes') ejecutarRenderTab(tab,actualizarReporte);
        else if(tab==='gestorSecciones') ejecutarRenderTab(tab,renderGestorSecciones);
        else if(tab==='historial') ejecutarRenderTab(tab,renderHistorial);
        else if(tab==='fichaDocente') ejecutarRenderTab(tab,()=>{ actualizarFichaDocentes(); renderFichaDocente(); });
    }
    function refrescarInicial(){
        try{ actualizarSelectorTemporada(); }catch(e){ console.error('Error al actualizar temporadas:',e); toast('No se pudo actualizar el selector de temporadas','warning'); }
        try{ aplicarPaleta(); }catch(e){ console.error('Error al aplicar paleta:',e); }
        try{ aplicarFuente(); }catch(e){ console.error('Error al aplicar fuente:',e); }
        try{ actualizarIndicadorPaleta(); }catch(e){ console.error('Error al actualizar indicador de temporada:',e); }
        try{ actualizarEstadoRespaldoLocal(); }catch(e){ console.error('Error al actualizar respaldo local:',e); }
        try{ actualizarBotonesUndoRedo(); }catch(e){ console.error('Error al actualizar deshacer/rehacer:',e); }
        renderTabActual();
    }
    function tabActivaEs(tab){
        return document.querySelector('.tab-btn.active')?.dataset?.tab===tab;
    }
    function refrescarTodo(){
        try{ actualizarSelectorTemporada(); }catch(e){ console.error('Error al actualizar temporadas:',e); }
        try{ actualizarIndicadorPaleta(); }catch(e){ console.error('Error al actualizar indicador de temporada:',e); }
        try{ actualizarEstadoRespaldoLocal(); }catch(e){ console.error('Error al actualizar respaldo local:',e); }
        try{ actualizarBotonesUndoRedo(); }catch(e){ console.error('Error al actualizar deshacer/rehacer:',e); }
        renderTabActual();
    }

    // Contrato de presentación: expone solo la identidad de la sesión actual.
    function publicarCuentaActual(){
        const user=window._fb?.auth?.currentUser;
        const email=user?.email||window._usuarioActual||'';
        const nombre=data.configuracion?.perfilesUsuarios?.[email]?.nombre||user?.displayName||email||'Usuario';
        document.dispatchEvent(new CustomEvent('planhor:cuenta:actualizada',{detail:{email,nombre}}));
    }
    document.addEventListener('planhor:cuenta:leer',publicarCuentaActual);
    document.addEventListener('planhor:cuenta:guardar',async(event)=>{
        const email=window._fb?.auth?.currentUser?.email||window._usuarioActual||'';
        const nombre=String(event.detail?.nombre||'').trim().slice(0,80);
        if(!email||!nombre){
            document.dispatchEvent(new CustomEvent('planhor:cuenta:guardada',{detail:{ok:false,mensaje:'Escribe un nombre visible para la cuenta conectada.'}}));
            return;
        }
        data.configuracion=data.configuracion||{};
        data.configuracion.perfilesUsuarios=data.configuracion.perfilesUsuarios||{};
        const perfilAnterior=data.configuracion.perfilesUsuarios[email];
        const perfilNuevo={...perfilAnterior,nombre};
        data.configuracion.perfilesUsuarios[email]=perfilNuevo;
        try{
            const guardado=await guardar();
            if(guardado===false)throw new Error('perfil-no-guardado');
            publicarCuentaActual();
            document.dispatchEvent(new CustomEvent('planhor:cuenta:guardada',{detail:{ok:true}}));
        }catch(error){
            if(data.configuracion.perfilesUsuarios[email]===perfilNuevo){
                if(perfilAnterior)data.configuracion.perfilesUsuarios[email]=perfilAnterior;
                else delete data.configuracion.perfilesUsuarios[email];
            }
            document.dispatchEvent(new CustomEvent('planhor:cuenta:guardada',{detail:{ok:false,mensaje:'No se pudo guardar el perfil. Intenta nuevamente.'}}));
        }
    });

    function createHeader(){
        const frag=document.createDocumentFragment();
        const h=document.createElement('div'); h.className='grid-header'; h.textContent='Horario'; frag.appendChild(h);
        DIAS.forEach(d=>{ const hd=document.createElement('div'); hd.className='grid-header'; hd.textContent=d; frag.appendChild(hd); });
        return frag;
    }
    function createTimeCell(b){
        const t=document.createElement('div'); t.className='grid-time'; t.innerHTML=`B${b.n}<br>${b.inicio}-${b.fin}`; return t;
    }

    function actualizarModoPlanificacionUI(){
        const activo=!!data.modoPlan;
        const panel=document.querySelector('#panelPlanificacion .selection-panel');
        const btnModo=document.getElementById('btnModoPlanificar');
        const grupoNormal=document.getElementById('planModeIdle');
        const grupoHerramientas=document.getElementById('planModeTools');
        panel?.classList.toggle('plan-mode-active',activo);
        btnModo?.setAttribute('aria-pressed',activo?'true':'false');
        grupoNormal?.setAttribute('aria-hidden',activo?'true':'false');
        grupoHerramientas?.setAttribute('aria-hidden',activo?'false':'true');
        if(grupoNormal&&'inert' in grupoNormal) grupoNormal.inert=activo;
        if(grupoHerramientas&&'inert' in grupoHerramientas) grupoHerramientas.inert=!activo;
        document.getElementById('scheduleContainer').classList.toggle('modo-activo',activo);
        if(!activo){
            const progreso=document.getElementById('planProgreso');
            if(progreso){
                progreso.style.display='none';
                progreso.textContent='';
            }
        }
    }

    function limpiarControlesTrabajoPlanificacion(){
        if(!data?.sel) return;
        data.sel.asignaturaId=null;
        data.sel.componenteId=null;
        data.sel.docenteId=null;
        data.sel.salaId=null;
        data.sel.tipo='presencial';
    }

    document.getElementById('btnModoPlanificar').onclick=()=>{
        if(!data.sel.seccionId) return toast('Seleccione una sección para entrar al modo planificación','error');
        data.modoPlan=true;
        actualizarModoPlanificacionUI();
        actualizarSelectoresPlan();
        construirGrilla();
        actualizarProgresoPlan();
    };
    document.getElementById('btnCancelarModo').onclick=()=>{
        if(hayMovimiento()){ cancelarMovimiento(); return; }
        data.modoPlan=false;
        limpiarControlesTrabajoPlanificacion();
        actualizarModoPlanificacionUI();
        actualizarSelectoresPlan();
        construirGrilla();
    };

    function descargarTablaExcel(nombreArchivo, hojas){
        const hojasValidas = hojas.length ? hojas : [{nombre:'Sin datos', matriz:[['Sin datos para exportar']]}];
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
            <style>
                body{font-family:Arial,sans-serif;color:#222;}
                h2{font-size:16px;margin:22px 0 8px;padding:7px 10px;background:#eef5f9;border:1pt solid #6f8794;color:#1f3540;}
                table.horario{border-collapse:collapse;table-layout:fixed;width:1510px;margin-bottom:8px;}
                table.horario col.col-horario{width:130px;mso-width-source:userset;}
                table.horario col.col-dia{width:230px;mso-width-source:userset;}
                table.horario th{background:#d9eaf7;font-weight:700;text-align:center;border:1pt solid #6f8794;padding:7px 6px;height:28px;mso-border-alt:solid #6f8794 .75pt;mso-width-source:userset;}
                table.horario td{border:1pt solid #7f8c8d;padding:6px;vertical-align:middle;height:38px;mso-number-format:"\\@";white-space:normal;word-wrap:break-word;mso-border-alt:solid #7f8c8d .75pt;mso-width-source:userset;}
                table.horario td:first-child{background:#f2f6f8;font-weight:700;text-align:center;}
                table.horario tr:nth-child(even) td:not(:first-child){background:#fbfdff;}
                table.separador{border-collapse:collapse;width:1510px;margin:0 0 22px;}
                table.separador td{height:22px;border:none;background:#ffffff;color:#ffffff;}
            </style>
        </head><body>${
            hojasValidas.map(hoja=>`
                <h2>${escapeHTML(hoja.nombre)}</h2>
                <table class="horario">
                    <colgroup>
                        <col class="col-horario" width="130" style="width:130px;mso-width-source:userset;">
                        ${Array(Math.max(0, ((hoja.matriz || [])[0] || []).length - 1)).fill('<col class="col-dia" width="230" style="width:230px;mso-width-source:userset;">').join('')}
                    </colgroup>
                    ${(hoja.matriz || [['Sin datos para exportar']]).map((fila,i)=>`<tr>${fila.map((celda,ci)=>{
                        const ancho=ci===0?130:230;
                        const estilo=`width:${ancho}px;mso-width-source:userset;`;
                        return i===0?`<th width="${ancho}" style="${estilo}">${escapeHTML(celda)}</th>`:`<td width="${ancho}" style="${estilo}">${escapeHTML(celda)}</td>`;
                    }).join('')}</tr>`).join('')}
                </table>
                <table class="separador"><tr><td>&nbsp;</td></tr><tr><td>&nbsp;</td></tr></table>
            `).join('')
        }</body></html>`;
        const a=document.createElement('a');
        a.href=URL.createObjectURL(new Blob([html],{type:'application/vnd.ms-excel;charset=utf-8'}));
        a.download=nombreArchivo.replace(/\.xlsx$/i,'.xls');
        a.click();
    }

    function resolverFallbackExcel(){
        return new Promise(resolve=>{
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3>Exportar Excel</h3>
                <p style="font-size:0.85rem;color:var(--text-secondary);margin:0 0 12px;">La exportación avanzada no está disponible en este momento. Elige cómo continuar.</p>
                <div class="form-group">
                    <label class="form-label">Formato</label>
                    <select class="form-select" id="fallbackExcelModo">
                        <option value="html">Compatible con Excel (.xls)</option>
                        <option value="cancelar">Cancelar exportación</option>
                    </select>
                </div>
                <label style="display:flex;gap:6px;align-items:center;font-size:0.82rem;margin-bottom:12px;">
                    <input type="checkbox" id="fallbackExcelGuardar"> Recordar esta opción
                </label>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button class="btn btn-sm" id="fallbackExcelCancelar">Cancelar</button>
                    <button class="btn btn-primary btn-sm" id="fallbackExcelContinuar">Continuar</button>
                </div>
            </div></div>`;
            const cerrar=(valor)=>{
                cerrarModal();
                resolve(valor);
            };
            document.getElementById('fallbackExcelCancelar').onclick=()=>cerrar('cancelar');
            document.getElementById('modalOverlay').onclick=(e)=>{ if(e.target===e.currentTarget) cerrar('cancelar'); };
            document.getElementById('fallbackExcelContinuar').onclick=()=>{
                const modo=document.getElementById('fallbackExcelModo').value;
                if(document.getElementById('fallbackExcelGuardar').checked && modo==='html'){
                    data.configuracion.exportacionExcel='html';
                    guardar();
                }
                cerrar(modo);
            };
        });
    }

    function cerrarFlotante(elemento,duracion=190){
        if(!elemento) return Promise.resolve();
        if(elemento._planhorClosing) return elemento._planhorClosing;
        const reducir=(document.documentElement.dataset.planhorMotion!=='full' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
        if(reducir){ elemento.remove(); return Promise.resolve(); }
        elemento.classList.add('closing');
        elemento.setAttribute('aria-hidden','true');
        if('inert' in elemento) elemento.inert=true;
        elemento._planhorClosing=new Promise(resolve=>{
            window.setTimeout(()=>{
                if(elemento.isConnected) elemento.remove();
                resolve();
            },Math.max(0,Number(duracion)||0));
        });
        return elemento._planhorClosing;
    }

    function cerrarModal(){
        const contenedor=document.getElementById('modalContainer');
        const overlay=contenedor?.querySelector('.modal-overlay');
        if(!overlay){ if(contenedor) contenedor.innerHTML=''; return Promise.resolve(); }
        return cerrarFlotante(overlay,190);
    }

    let modalPointerState = {inicioDentro:false,inicioOverlay:false,x:0,y:0,movido:false};
    function reiniciarModalPointerState(){
        modalPointerState={inicioDentro:false,inicioOverlay:false,x:0,y:0,movido:false};
    }
    function seleccionTextoActiva(){
        try{
            const sel=window.getSelection?.();
            return !!sel && !sel.isCollapsed && String(sel.toString()||'').trim().length>0;
        }catch(e){ return false; }
    }
    function debeBloquearCierreOverlay(e){
        const overlay=e.target.closest?.('.modal-overlay');
        if(!overlay || e.target!==overlay) return false;
        return modalPointerState.inicioDentro || modalPointerState.movido || seleccionTextoActiva();
    }
    document.addEventListener('pointerdown',(e)=>{
        const overlay=e.target.closest?.('.modal-overlay');
        if(!overlay) return reiniciarModalPointerState();
        modalPointerState={
            inicioDentro:!!e.target.closest?.('.modal'),
            inicioOverlay:e.target===overlay,
            x:Number(e.clientX)||0,
            y:Number(e.clientY)||0,
            movido:false
        };
    },true);
    document.addEventListener('pointermove',(e)=>{
        if(!modalPointerState.inicioDentro && !modalPointerState.inicioOverlay) return;
        const dx=Math.abs((Number(e.clientX)||0)-modalPointerState.x);
        const dy=Math.abs((Number(e.clientY)||0)-modalPointerState.y);
        if(dx>5||dy>5) modalPointerState.movido=true;
    },true);
    document.addEventListener('click',(e)=>{
        if(debeBloquearCierreOverlay(e)){
            e.preventDefault();
            e.stopImmediatePropagation();
            setTimeout(reiniciarModalPointerState,0);
            return;
        }
        reiniciarModalPointerState();
    },true);

    function validarDatosImportados(d) {
        if (!d || typeof d !== 'object' || Array.isArray(d)) return false;
        // Verificar que las colecciones principales existen y son arrays
        const arraysClave = ['carreras','niveles','secciones','asignaturas','docentes','salas','asignaturaCarreraNivel','planificaciones'];
        for (const campo of arraysClave) {
            if (!Array.isArray(d[campo])) return false;
            if (d[campo].length > 5000) return false;
        }
        if(d.asignaturaSeccion!==undefined && (!Array.isArray(d.asignaturaSeccion) || d.asignaturaSeccion.length>10000)) return false;
        if(d.gruposDictacion!==undefined && (!Array.isArray(d.gruposDictacion) || d.gruposDictacion.length>5000)) return false;
        if(d.gruposElectivos!==undefined && (!Array.isArray(d.gruposElectivos) || d.gruposElectivos.length>5000)) return false;
        if(d.vinculosElectivos!==undefined && (!Array.isArray(d.vinculosElectivos) || d.vinculosElectivos.length>10000)) return false;
        if(d.cargasExternasDocente!==undefined && (!Array.isArray(d.cargasExternasDocente) || d.cargasExternasDocente.length>5000)) return false;
        // Verificar que configuracion es un objeto (no null ni array)
        if (!d.configuracion || typeof d.configuracion !== 'object' || Array.isArray(d.configuracion)) return false;
        return true;
    }
    function prepararDatosImportados(raw) {
        const limpio=limpiarImportado(raw);
        if (!validarDatosImportados(limpio)) return null;
        limpio.configuracion = Object.assign({}, JSON.parse(JSON.stringify(CONFIG_DEFAULT)), limpio.configuracion);
        limpio.modoPlan=false;
        limpio.temporadas = Array.isArray(limpio.temporadas) ? limpio.temporadas.map(t=>({
            id:limpiarTexto(t.id)||genId(),
            temporada: TEMPORADAS.includes(t.temporada) ? t.temporada : 'Otoño',
            anio:Number(t.anio)||new Date().getFullYear()
        })) : [];
        limpio.auditoria = Array.isArray(limpio.auditoria) ? limpio.auditoria.slice(-500) : [];
        limpio.temporadaData = (limpio.temporadaData && typeof limpio.temporadaData === 'object' && !Array.isArray(limpio.temporadaData)) ? limpio.temporadaData : {};
        limpio.sel = Object.assign({temporadaId:null,area:null,carreraId:null,nivelId:null,seccionId:null,asignaturaId:null,docenteId:null,salaId:null,tipo:'presencial'}, limpio.sel || {});
        limpio.carreras = limpio.carreras.map(c=>{
            const especialidad=limpiarTexto(c.especialidad);
            return {id:limpiarTexto(c.id)||genId(), codigo:limpiarTexto(c.codigo,50), nombre:limpiarTexto(c.nombre), area:limpiarTexto(c.area)||especialidad||'Sin área', especialidad, tipo:limpiarTexto(c.tipo,40), alertasImportacion:Array.isArray(c.alertasImportacion)?c.alertasImportacion.map(x=>limpiarTexto(x,160)).filter(Boolean):[]};
        }).filter(c=>c.codigo&&c.nombre);
        limpio.niveles = limpio.niveles.map(n=>({id:limpiarTexto(n.id)||genId(), carreraId:limpiarTexto(n.carreraId), nombre:limpiarTexto(n.nombre), tieneOnline:!!n.tieneOnline, alertasImportacion:Array.isArray(n.alertasImportacion)?n.alertasImportacion.map(x=>limpiarTexto(x,160)).filter(Boolean):[]})).filter(n=>n.carreraId&&n.nombre);
        limpio.secciones = limpio.secciones.map(s=>({
            id:limpiarTexto(s.id)||genId(),
            nivelId:limpiarTexto(s.nivelId),
            nombre:limpiarTexto(s.nombre),
            tipoSeccion:['regular','fusionada','equivalente','fusionada-equivalente'].includes(s.tipoSeccion)?s.tipoSeccion:'regular',
            alertasImportacion:Array.isArray(s.alertasImportacion)?s.alertasImportacion.map(x=>limpiarTexto(x,160)).filter(Boolean):[]
        })).filter(s=>s.nivelId&&s.nombre);
        limpio.asignaturas = limpio.asignaturas.map(a=>({
            ...a,
            id:limpiarTexto(a.id)||genId(), codigo:limpiarTexto(a.codigo,80), nombre:limpiarTexto(a.nombre),
            color:colorAsignaturaPlanhor(a), horasTotales:Number(a.horasTotales)||0,
            horasVirtuales:Number(a.horasVirtuales)||0, horasPresenciales:Number(a.horasPresenciales)||0,
            area:['especialidad','transversal','electiva'].includes(a.area)?a.area:'especialidad',
            modalidad:['lectiva','practica','semipresencial','online-teams'].includes(a.modalidad)?a.modalidad:'lectiva',
            condicion:['normal','alta-reprobacion','requiere-ayudantia','alta-reprobacion-ayudantia'].includes(a.condicion)?a.condicion:'normal',
            distribucion:['compacta','balanceada','dividida','flexible'].includes(a.distribucion)?a.distribucion:((['especialidad','transversal','electiva'].includes(a.area)?a.area:'especialidad')==='transversal'?'balanceada':'compacta'),
            controlHorario:['propio','coordinacion-externa'].includes(a.controlHorario)?a.controlHorario:((['especialidad','transversal','electiva'].includes(a.area)?a.area:'especialidad')==='transversal'?'coordinacion-externa':'propio'),
            preferenciaHoraria:['flexible','evitar-temprano','proteger-repitentes'].includes(a.preferenciaHoraria)?a.preferenciaHoraria:'flexible',
            softwares:Array.isArray(a.softwares)?a.softwares.map(x=>limpiarTexto(x,80)).filter(Boolean):[],
            grupoElectivo:limpiarTexto(a.grupoElectivo,120),
            destinosElectivaIds:Array.isArray(a.destinosElectivaIds)?a.destinosElectivaIds.map(x=>limpiarTexto(x)).filter(Boolean):[]
        })).filter(a=>a.codigo&&a.nombre);
        limpio.gruposElectivos=Array.isArray(limpio.gruposElectivos)?limpio.gruposElectivos.map(g=>({
            id:limpiarTexto(g.id)||genId(),
            nombre:limpiarTexto(g.nombre,120)||'Grupo electivo',
            asignaturaIds:Array.isArray(g.asignaturaIds)?g.asignaturaIds.map(x=>limpiarTexto(x)).filter(Boolean):[],
            seccionIds:Array.isArray(g.seccionIds)?g.seccionIds.map(x=>limpiarTexto(x)).filter(Boolean):[],
            origen:limpiarTexto(g.origen,40)||'manual'
        })):[];
        limpio.vinculosElectivos=Array.isArray(limpio.vinculosElectivos)?limpio.vinculosElectivos.map(v=>({
            id:limpiarTexto(v.id)||genId(),
            asignaturaId:limpiarTexto(v.asignaturaId),
            seccionOrigenId:limpiarTexto(v.seccionOrigenId),
            seccionDestinoId:limpiarTexto(v.seccionDestinoId),
            origen:limpiarTexto(v.origen,40)||'manual'
        })):[];
        limpio.cargasExternasDocente=Array.isArray(limpio.cargasExternasDocente)?limpio.cargasExternasDocente.map(c=>({
            id:limpiarTexto(c.id)||genId(),
            docenteId:limpiarTexto(c.docenteId),
            codigo:(limpiarTexto(c.codigo,40)||'EXT').toUpperCase(),
            nombre:limpiarTexto(c.nombre,120)||'Carga externa',
            origen:limpiarTexto(c.origen,100),
            estado:['gestion','acordada','confirmada'].includes(c.estado)?c.estado:'gestion',
            observacion:limpiarTexto(c.observacion,300),
            horasPresenciales:Number(c.horasPresenciales)||((Number(c.bloquesPresenciales)||0)*18),
            horasVirtuales:Number(c.horasVirtuales)||((Number(c.bloquesVirtuales)||0)*18),
            bloquesPresenciales:Number(c.bloquesPresenciales)||0,
            bloquesVirtuales:Number(c.bloquesVirtuales)||0,
            bloques:Array.isArray(c.bloques)?c.bloques.map(b=>({
                dia:Number(b.dia),
                bloque:Number(b.bloque),
                tipoPresencial:b.tipoPresencial!==false,
                salaId:b.tipoPresencial===false?SALA_VIRTUAL_ID:(limpiarTexto(b.salaId)||SALA_TRO2_ID)
            })).filter(b=>Number.isInteger(b.dia)&&b.dia>=0&&b.dia<DIAS.length&&Number.isInteger(b.bloque)&&b.bloque>=1&&b.bloque<=BLOQUES.length):[],
            creadoEn:limpiarTexto(c.creadoEn,80),
            actualizadoEn:limpiarTexto(c.actualizadoEn,80)
        })).filter(c=>c.docenteId&&c.codigo&&c.nombre):[];
        limpio.docentes = limpio.docentes.map(d=>({
            ...d,
            id:limpiarTexto(d.id)||genId(), nombre:limpiarTexto(d.nombre), apellido:limpiarTexto(d.apellido),
            tipoContrato:limpiarTexto(d.tipoContrato,80), especialidad:limpiarTexto(d.especialidad),
            horasHomologo:Number(d.horasHomologo)||0, autorizadoExceder:!!d.autorizadoExceder,
            asignaturasQueDicta:Array.isArray(d.asignaturasQueDicta)?d.asignaturasQueDicta.map(x=>limpiarTexto(x)).filter(Boolean):[],
            asignaturasNoReconocidas:Array.isArray(d.asignaturasNoReconocidas)?d.asignaturasNoReconocidas.map(x=>limpiarTexto(x,80).toUpperCase()).filter(Boolean):[],
            alertasImportacion:Array.isArray(d.alertasImportacion)?d.alertasImportacion.map(x=>limpiarTexto(x,160)).filter(Boolean):[],
            prioridadAsignaturas:(d.prioridadAsignaturas&&typeof d.prioridadAsignaturas==='object'&&!Array.isArray(d.prioridadAsignaturas))?Object.fromEntries(Object.entries(d.prioridadAsignaturas).map(([k,v])=>[limpiarTexto(k), ['preferente','apto','apoyo'].includes(v)?v:'apto']).filter(([k])=>k)): {},
            disponibilidad:Array.isArray(d.disponibilidad)?d.disponibilidad:[]
        })).filter(d=>(d.id===DOCENTE_NN_ID)||(d.nombre&&d.apellido));
        limpio.salas = limpio.salas.map(s=>({
            ...s,
            id:limpiarTexto(s.id)||genId(), nombre:limpiarTexto(s.nombre), capacidad:Number(s.capacidad)||1,
            tipoSala:limpiarTexto(s.tipoSala,80),
            observaciones:limpiarTexto(s.observaciones,200),
            alertasImportacion:Array.isArray(s.alertasImportacion)?s.alertasImportacion.map(x=>limpiarTexto(x,160)).filter(Boolean):[],
            esVirtual:!!s.esVirtual, fija:!!s.fija, ilimitada:!!s.ilimitada
        })).filter(s=>s.nombre);
        limpio.asignaturaCarreraNivel = limpio.asignaturaCarreraNivel.map(r=>({asignaturaId:limpiarTexto(r.asignaturaId), carreraId:limpiarTexto(r.carreraId), nivelId:limpiarTexto(r.nivelId)})).filter(r=>r.asignaturaId&&r.carreraId&&r.nivelId);
        limpio.asignaturaSeccion = Array.isArray(limpio.asignaturaSeccion) ? limpio.asignaturaSeccion.map(r=>({
            asignaturaId:limpiarTexto(r.asignaturaId),
            seccionId:limpiarTexto(r.seccionId),
            origen:limpiarTexto(r.origen,40)||'manual',
            idGestor:limpiarTexto(r.idGestor,80),
            marcaGestor:limpiarTexto(r.marcaGestor,20),
            fusionDesvinculada:!!r.fusionDesvinculada,
            fusionDesvinculadaEn:limpiarTexto(r.fusionDesvinculadaEn,80),
            idGestorDesvinculado:limpiarTexto(r.idGestorDesvinculado,80),
            seccionMadreDesvinculadaId:limpiarTexto(r.seccionMadreDesvinculadaId),
            fusionOrigenGrupoIds:Array.isArray(r.fusionOrigenGrupoIds)?r.fusionOrigenGrupoIds.map(id=>limpiarTexto(id)).filter(Boolean):[],
            fusionHistorial:Array.isArray(r.fusionHistorial)?r.fusionHistorial.map(h=>({
                idGestor:limpiarTexto(h.idGestor,80),
                grupoOrigenId:limpiarTexto(h.grupoOrigenId),
                seccionMadreId:limpiarTexto(h.seccionMadreId),
                seccionHijaId:limpiarTexto(h.seccionHijaId),
                asignaturaId:limpiarTexto(h.asignaturaId),
                fecha:limpiarTexto(h.fecha,80),
                usuario:limpiarTexto(h.usuario,120),
                accion:limpiarTexto(h.accion,80)||'desvinculada'
            })).filter(h=>h.seccionMadreId||h.idGestor||h.grupoOrigenId).slice(-20):[],
            usaSubsecciones:!!r.usaSubsecciones,
            horasComunes:Number(r.horasComunes)||0,
            horasPorSubseccion:Number(r.horasPorSubseccion)||0,
            componentesSubseccion:Array.isArray(r.componentesSubseccion)?r.componentesSubseccion.map(c=>({
                id:limpiarTexto(c.id,60)||genId(),
                nombre:limpiarTexto(c.nombre,80),
                tipo:limpiarTexto(c.tipo,30)||'subseccion',
                alumnos:Number(c.alumnos)||0,
                horas:Number(c.horas)||0
            })).filter(c=>c.id&&c.nombre).slice(0,12):[]
        })).filter(r=>r.asignaturaId&&r.seccionId) : [];
        limpio.planificaciones = limpio.planificaciones.map(p=>({
            id:limpiarTexto(p.id)||genId(), seccionId:limpiarTexto(p.seccionId), asignaturaId:limpiarTexto(p.asignaturaId),
            docenteId:limpiarTexto(p.docenteId), salaId:limpiarTexto(p.salaId), dia:Number(p.dia), bloque:Number(p.bloque),
            tipoPresencial:p.tipoPresencial!==false,
            componenteId:limpiarTexto(p.componenteId,60),
            nota:limpiarTexto(p.nota,500),
            fijo:!!p.fijo,
            revisionMarcada:!!p.revisionMarcada,
            esCargaExterna:!!p.esCargaExterna,
            codigoExterno:(limpiarTexto(p.codigoExterno,24)||'EXT').toUpperCase(),
            nombreExterno:limpiarTexto(p.nombreExterno,80)||'Carga externa',
            origenCargaExterna:limpiarTexto(p.origenCargaExterna,80),
            estadoCargaExterna:['gestion','acordada'].includes(p.estadoCargaExterna)?p.estadoCargaExterna:'',
            estadoGestionExterna:['gestion','acordada'].includes(p.estadoGestionExterna)?p.estadoGestionExterna:'',
            seguimientoActualizadoEn:limpiarTexto(p.seguimientoActualizadoEn,80),
            explicacionAuto:(p.explicacionAuto&&typeof p.explicacionAuto==='object'&&!Array.isArray(p.explicacionAuto))?{
                origen:limpiarTexto(p.explicacionAuto.origen,60),
                estrategia:limpiarTexto(p.explicacionAuto.estrategia,60),
                puntaje:Number(p.explicacionAuto.puntaje)||0,
                razones:Array.isArray(p.explicacionAuto.razones)?p.explicacionAuto.razones.map(r=>limpiarTexto(r,160)).filter(Boolean).slice(0,5):[],
                generadoEn:limpiarTexto(p.explicacionAuto.generadoEn,80)
            }:null
        })).filter(p=>p.seccionId&&p.asignaturaId&&p.docenteId&&p.salaId&&Number.isInteger(p.dia)&&p.dia>=0&&p.dia<DIAS.length&&Number.isInteger(p.bloque)&&p.bloque>=1&&p.bloque<=BLOQUES.length);
        limpio.gruposDictacion = Array.isArray(limpio.gruposDictacion) ? limpio.gruposDictacion.map(normalizarGrupoDictacion) : [];
        limpio.gestorSecciones = normalizarGestorSeccionesData(limpio.gestorSecciones);
        return limpio;
    }
    function aplicarDatosImportados(imported){
        const base={
            carreras:[], niveles:[], secciones:[], asignaturas:[], docentes:[], salas:[],
            asignaturaCarreraNivel:[], asignaturaSeccion:[], planificaciones:[], cargasExternasDocente:[], gruposDictacion:[], vinculosElectivos:[], configuracion:JSON.parse(JSON.stringify(CONFIG_DEFAULT)),
            gestorSecciones:{cargas:[],ids:[],ultimaCargaId:null},
            modoPlan:false, temporadas:[], auditoria:[], temporadaData:{},
            sel:{temporadaId:null,area:null,carreraId:null,nivelId:null,seccionId:null,asignaturaId:null,docenteId:null,salaId:null,tipo:'presencial'}
        };
        Object.keys(data).forEach(k=>delete data[k]);
        Object.assign(data, base, imported);
        limpiarHistorialCambios();
    }
    function asegurarEstructuraImportada(){
        if(!data.temporadas || !data.temporadas.length){
            const anio=new Date().getFullYear();
            const mes=new Date().getMonth();
            const tempDefault=mes>=2&&mes<5?'Otoño':mes>=5&&mes<8?'Invierno':mes>=8&&mes<11?'Primavera':'Verano';
            data.temporadas=[{id:genId(), temporada:tempDefault, anio}];
        }
        data.sel=data.sel||{};
        data.sel.temporadaId=data.sel.temporadaId||data.configuracion.temporadaActualId||data.temporadas[0]?.id;
        data.configuracion.temporadaActualId=data.sel.temporadaId;
        data.temporadaData=data.temporadaData||{};
        if(!data.temporadaData[data.sel.temporadaId]){
            data.temporadaData[data.sel.temporadaId]={
                carreras:data.carreras, niveles:data.niveles, secciones:data.secciones, asignaturas:data.asignaturas,
                docentes:data.docentes, salas:data.salas, asignaturaCarreraNivel:data.asignaturaCarreraNivel, asignaturaSeccion:data.asignaturaSeccion||[],
                planificaciones:data.planificaciones, cargasExternasDocente:data.cargasExternasDocente||[], gruposDictacion:data.gruposDictacion || [], vinculosElectivos:data.vinculosElectivos||[], gestorSecciones:data.gestorSecciones || {cargas:[],ids:[],ultimaCargaId:null}
            };
        }
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        if(!data.salas.find(s=>s.id===SALA_VIRTUAL_ID)) data.salas.push({id:SALA_VIRTUAL_ID,nombre:'Sala Virtual',capacidad:9999,tipoSala:'Virtual',esVirtual:true,fija:true});
        if(!data.salas.find(s=>s.id===SALA_TRO2_ID)) data.salas.push({id:SALA_TRO2_ID,nombre:'TRO2 (Terreno)',capacidad:9999,tipoSala:'Terreno',esVirtual:false,fija:true,ilimitada:true});
        asegurarDocenteNN();
    }
    function resumenImportacion(d){
        return [
            ['Carreras', d.carreras.length],
            ['Niveles', d.niveles.length],
            ['Secciones', d.secciones.length],
            ['Asignaturas', d.asignaturas.length],
            ['Docentes', d.docentes.length],
            ['Salas', d.salas.length],
            ['Bloques planificados', d.planificaciones.length],
            ['Grupos de dictación', d.gruposDictacion?.length || 0],
            ['Temporadas', d.temporadas?.length || 0]
        ];
    }
    function guardarRespaldoAntesDeImportar(){
        try {
            localStorage.setItem('planificador_backup_antes_importar', JSON.stringify(data));
            localStorage.setItem('planificador_backup_antes_importar_ts', new Date().toISOString());
        } catch(e) {}
        actualizarEstadoRespaldoLocal();
    }
    function actualizarEstadoRespaldoLocal(){
        const btn=document.getElementById('btnRestaurarRespaldoLocal');
        const estado=document.getElementById('estadoRespaldoLocal');
        if(!btn||!estado) return;
        const respaldo=obtenerRespaldoLocal();
        const snapshots=listarSnapshotsRecuperacion();
        const disponible=!!respaldo || snapshots.length>0;
        btn.disabled=!disponible;
        if(snapshots.length){
            const fecha=snapshots[0].fecha ? new Date(snapshots[0].fecha).toLocaleString() : 'fecha no disponible';
            estado.textContent=`${snapshots.length} recuperación(es) · última: ${fecha}`;
        }else{
            estado.textContent=disponible ? `Disponible: ${respaldo.fecha ? new Date(respaldo.fecha).toLocaleString() : 'fecha no disponible'}` : 'Sin recuperación disponible';
        }
    }
    function obtenerRespaldoLocal(){
        try {
            const raw=localStorage.getItem('planificador_backup_antes_importar');
            if(!raw) return null;
            const datos=prepararDatosImportados(JSON.parse(raw));
            if(!datos) return null;
            return {
                datos,
                fecha:localStorage.getItem('planificador_backup_antes_importar_ts') || ''
            };
        } catch(e) {
            return null;
        }
    }
    function resumenPuntoRecuperacion(datos){
        const campos=['carreras','niveles','secciones','asignaturas','docentes','salas','planificaciones','gruposDictacion'];
        const temporadasDatos=datos?.temporadaData&&typeof datos.temporadaData==='object' ? Object.values(datos.temporadaData).filter(Boolean) : [];
        const resumen={};
        campos.forEach(campo=>{
            resumen[campo]=temporadasDatos.length
                ? temporadasDatos.reduce((total,temp)=>total+(Array.isArray(temp?.[campo])?temp[campo].length:0),0)
                : (Array.isArray(datos?.[campo])?datos[campo].length:0);
        });
        resumen.temporadas=Array.isArray(datos?.temporadas)?datos.temporadas.length:0;
        return resumen;
    }
    function formatoTamanoRecuperacion(bytes){
        const total=Number(bytes)||0;
        if(!total) return 'Tamaño no disponible';
        if(total<1024) return `${total} B`;
        if(total<1024*1024) return `${(total/1024).toFixed(1)} KB`;
        return `${(total/(1024*1024)).toFixed(1)} MB`;
    }
    function descargarPuntoRecuperacion(datos,fecha=''){
        const blob=new Blob([JSON.stringify(datos,null,2)],{type:'application/json;charset=utf-8'});
        const url=URL.createObjectURL(blob);
        const enlace=document.createElement('a');
        enlace.href=url;
        enlace.download=`Planhor_Recuperacion_${String(fecha||new Date().toISOString()).slice(0,19).replace(/[:T]/g,'-')}.json`;
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        setTimeout(()=>URL.revokeObjectURL(url),500);
    }
    function restaurarRespaldoLocal(){
        const respaldo=obtenerRespaldoLocal();
        const snapshots=listarSnapshotsRecuperacion();
        if(!respaldo && !snapshots.length) {
            toast('No hay respaldo local disponible','info');
            return;
        }
        const opciones=[];
        snapshots.forEach(s=>{
            const r=s.resumen||{};
            opciones.push({
                id:s.id,
                tipo:'snapshot',
                titulo:s.motivo==='antes_de_aplicar_firebase'?'Antes de aplicar Firebase':'Recuperación automática',
                fecha:s.fecha||'',
                autor:s.savedBy||'usuario',
                tamanoBytes:Number(s.tamanoBytes)||0,
                integridad:s.integridad||'historico',
                resumen:`${Number(r.planificaciones)||0} bloques · ${Number(r.secciones)||0} secciones · ${Number(r.asignaturas)||0} asignaturas`
            });
        });
        if(respaldo){
            opciones.push({
                id:'backup_importacion',
                tipo:'importacion',
                titulo:'Antes de importar respaldo',
                fecha:respaldo.fecha||'',
                autor:'Respaldo local',
                tamanoBytes:0,
                integridad:'historico',
                resumen:resumenImportacion(respaldo.datos).map(([k,v])=>`${k}: ${v}`).join(' · ')
            });
        }
        const indiceInicial=opciones.findIndex(op=>op.integridad!=='invalido');
        const filas=opciones.map((op,i)=>`
            <label class="recovery-option ${i===indiceInicial?'selected':''} ${op.integridad==='invalido'?'disabled':''}">
                <div class="recovery-option-main">
                    <input type="radio" name="recoveryOption" value="${escapeAttr(op.tipo+'|'+op.id)}" ${i===indiceInicial?'checked':''} ${op.integridad==='invalido'?'disabled':''}>
                    <div>
                        <strong>${escapeHTML(op.titulo)}</strong>
                        <div class="recovery-option-meta">${escapeHTML(op.fecha?new Date(op.fecha).toLocaleString():'Fecha no disponible')} · ${escapeHTML(op.autor)}</div>
                        <div class="recovery-option-summary">${escapeHTML(op.resumen||'Sin resumen')} · ${op.integridad==='valido'?'Integridad verificada':op.integridad==='invalido'?'Copia dañada':'Copia histórica sin checksum'}</div>
                    </div>
                </div>
            </label>`).join('');
        document.getElementById('modalContainer').innerHTML=`
        <div class="modal-overlay" id="modalOverlay"><div class="modal modal-wide recovery-manager-modal">
            <div class="modal-header">
                <h3>Puntos de recuperación</h3>
                <p>Compara y descarga antes de restaurar. Firebase no se modificará automáticamente.</p>
            </div>
            <div class="recovery-manager-grid">
                <div class="recovery-list">${filas}</div>
                <div class="recovery-preview" id="recoveryPreview"></div>
            </div>
            <div class="modal-actions split-actions">
                <button class="btn btn-sm" id="btnDescargarRecuperacion">Descargar respaldo</button>
                <div class="action-right">
                    <button class="btn btn-sm" id="btnCancelarRestauracion">Cancelar</button>
                    <button class="btn btn-primary btn-sm" id="btnConfirmarRestauracion">Restaurar localmente</button>
                </div>
            </div>
        </div></div>`;
        const opcionSeleccionada=()=>{
            const valor=document.querySelector('input[name="recoveryOption"]:checked')?.value||'';
            const [tipo,id]=valor.split('|');
            return opciones.find(op=>op.tipo===tipo&&op.id===id)||null;
        };
        const datosSeleccionados=()=>{
            const op=opcionSeleccionada();
            if(!op) return null;
            const origen=op.tipo==='snapshot'?obtenerSnapshotRecuperacion(op.id):respaldo;
            return origen?.datos||null;
        };
        const actualizarComparacion=()=>{
            document.querySelectorAll('.recovery-option').forEach(label=>label.classList.toggle('selected',!!label.querySelector('input:checked')));
            const op=opcionSeleccionada();
            const elegido=datosSeleccionados();
            const preview=document.getElementById('recoveryPreview');
            if(!preview||!op||!elegido){ if(preview) preview.textContent='No se pudo leer este punto.'; return; }
            const actual=resumenPuntoRecuperacion(data);
            const anterior=resumenPuntoRecuperacion(elegido);
            const etiquetas={planificaciones:'Bloques',secciones:'Secciones',asignaturas:'Asignaturas',docentes:'Docentes',salas:'Salas',gruposDictacion:'Grupos de dictación',temporadas:'Temporadas'};
            const filasComparacion=Object.entries(etiquetas).map(([campo,label])=>{
                const diferencia=(Number(anterior[campo])||0)-(Number(actual[campo])||0);
                return `<tr><td>${escapeHTML(label)}</td><td>${Number(actual[campo])||0}</td><td>${Number(anterior[campo])||0}</td><td class="${diferencia<0?'negative':diferencia>0?'positive':''}">${diferencia>0?'+':''}${diferencia}</td></tr>`;
            }).join('');
            preview.innerHTML=`
                <h4>Comparación</h4>
                <div class="recovery-preview-meta">${escapeHTML(op.fecha?new Date(op.fecha).toLocaleString():'Fecha no disponible')} · ${escapeHTML(formatoTamanoRecuperacion(op.tamanoBytes))}</div>
                <table><thead><tr><th>Contenido</th><th>Actual</th><th>Recuperación</th><th>Diferencia</th></tr></thead><tbody>${filasComparacion}</tbody></table>
                <p>La restauración reemplazará primero los datos de este navegador. La nube quedará intacta hasta una confirmación posterior.</p>`;
        };
        const cerrar=()=>cerrarModal();
        document.getElementById('btnCancelarRestauracion').onclick=cerrar;
        document.getElementById('modalOverlay').onclick=(e)=>{ if(e.target===e.currentTarget) cerrar(); };
        document.querySelectorAll('input[name="recoveryOption"]').forEach(input=>input.addEventListener('change',actualizarComparacion));
        document.getElementById('btnDescargarRecuperacion').onclick=()=>{
            const op=opcionSeleccionada();
            const elegido=datosSeleccionados();
            if(!op||!elegido) return toast('No se pudo leer el punto de recuperación','error');
            descargarPuntoRecuperacion(elegido,op.fecha);
            toast('Respaldo descargado','success');
        };
        document.getElementById('btnConfirmarRestauracion').onclick=async()=>{
            const op=opcionSeleccionada();
            const elegido=datosSeleccionados();
            const datos=elegido ? prepararDatosImportados(elegido) : null;
            if(!datos) return toast('No se pudo leer el punto de recuperación','error');
            const ok=await confirmarAccionCritica({
                titulo:'Restaurar datos locales',
                mensaje:'El punto seleccionado reemplazará el estado actual de este navegador.',
                queHara:`Restaurará la copia de ${op?.fecha?new Date(op.fecha).toLocaleString():'fecha no disponible'}.`,
                afectara:'Datos académicos, planificación y temporadas locales.',
                noTocara:'Firebase hasta que lo confirmes por separado.',
                seguridad:'Se creará un punto del estado actual antes de restaurar.',
                confirmarTexto:'Restaurar localmente',
                peligro:true
            });
            if(!ok) return;
            const respaldoPrevio=await crearPuntoRecuperacion('antes_de_restaurar');
            if(!respaldoPrevio) return toast('No se pudo proteger el estado actual. Descarga un respaldo antes de restaurar.','error');
            aplicarDatosImportados(datos);
            asegurarEstructuraImportada();
            normalizarDatos();
            reconstruirIndices();
            const guardadoLocal=await guardarRestauracionLocal('restaurar_punto_recuperacion');
            actualizarSelectorTemporada();
            aplicarPaleta();
            aplicarFuente();
            actualizarIndicadorPaleta();
            refrescarTodo();
            await cerrarModal();
            if(!guardadoLocal) return toast('La restauración está solo en memoria. Descarga un respaldo antes de cerrar esta página. No se sincronizará automáticamente.','error');
            toast('Punto restaurado localmente. Firebase no fue modificado.','success');
            actualizarEstadoRespaldoLocal();
            const sincronizar=await confirmarAccionCritica({
                titulo:'Sincronizar restauración',
                mensaje:'La restauración ya está segura en este navegador.',
                queHara:'Comparará esta copia con Firebase antes de publicarla.',
                afectara:'La nube solo si la comparación resulta segura o resuelves sus conflictos.',
                noTocara:'La copia local recién restaurada.',
                confirmarTexto:'Comparar y sincronizar',
                cancelarTexto:'Más tarde',
                peligro:false
            });
            if(sincronizar) await recargarDesdeFirestore({confirmarRestauracion:true});
        };
        actualizarComparacion();
    }
    function confirmarImportacion(imported, nombreArchivo){
        return new Promise(resolve=>{
            const filas=resumenImportacion(imported).map(([k,v])=>`<tr><td style="padding:5px 8px;border:1px solid var(--border);">${escapeHTML(k)}</td><td style="padding:5px 8px;border:1px solid var(--border);text-align:right;font-weight:600;">${v}</td></tr>`).join('');
            document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <h3>Importar respaldo</h3>
                <p style="font-size:0.85rem;color:var(--text-secondary);margin:0 0 10px;">Archivo: <strong>${escapeHTML(nombreArchivo)}</strong></p>
                <table style="width:100%;border-collapse:collapse;font-size:0.82rem;margin-bottom:12px;">${filas}</table>
                <p style="font-size:0.8rem;color:var(--text-secondary);margin:0 0 12px;">Se guardará un respaldo local del estado actual antes de reemplazar los datos.</p>
                <div style="display:flex;gap:8px;justify-content:flex-end;">
                    <button class="btn btn-sm" id="btnCancelarImportacion">Cancelar</button>
                    <button class="btn btn-primary btn-sm" id="btnConfirmarImportacion">Importar</button>
                </div>
            </div></div>`;
            const cerrar=(ok)=>{
                cerrarModal();
                resolve(ok);
            };
            document.getElementById('btnCancelarImportacion').onclick=()=>cerrar(false);
            document.getElementById('modalOverlay').onclick=(e)=>{ if(e.target===e.currentTarget) cerrar(false); };
            document.getElementById('btnConfirmarImportacion').onclick=()=>cerrar(true);
        });
    }
    function importarDatos(){
        const input=document.createElement('input');
        input.type='file';
        input.accept='.json,application/json';
        input.value='';
        input.style.display='none';
        input.onchange=e=>{
            const file=e.target.files[0];
            if(!file){ input.remove(); return; }
            const reader=new FileReader();
            reader.onload=async ev=>{
                try {
                    const imported = prepararDatosImportados(JSON.parse(ev.target.result));
                    if (!imported) { toast('El respaldo no tiene el formato esperado','error'); return; }
                    const confirmado = await confirmarImportacion(imported, file.name);
                    if(!confirmado) { toast('Importación cancelada','info'); return; }
                    guardarRespaldoAntesDeImportar();
                    crearPuntoRecuperacion('antes_importar_respaldo_json');
                    aplicarDatosImportados(imported);
                    asegurarEstructuraImportada();
                    normalizarDatos(); reconstruirIndices(); guardar({forzar:true}); actualizarSelectorTemporada(); aplicarPaleta(); aplicarFuente(); actualizarIndicadorPaleta(); refrescarTodo();
                    toast('Respaldo importado correctamente','success');
                } catch(err) {
                    toast('No se pudo importar el respaldo','error');
                } finally {
                    input.value='';
                    input.remove();
                }
            };
            reader.onerror=()=>{
                toast('No se pudo leer el archivo JSON','error');
                input.value='';
                input.remove();
            };
            reader.readAsText(file);
        };
        input.oncancel=()=>input.remove();
        document.body.appendChild(input);
        input.click();
    }

    function normalizarEncabezadoGestor(...args){ return applicationModule('gestor-secciones').normalizarEncabezadoGestor(...args); }
    function textoGestor(...args){ return applicationModule('gestor-secciones').textoGestor(...args); }
    function numeroGestor(...args){ return applicationModule('gestor-secciones').numeroGestor(...args); }
    function codigoCarreraGestor(...args){ return applicationModule('gestor-secciones').codigoCarreraGestor(...args); }
    function nombreCarreraGestor(...args){ return applicationModule('gestor-secciones').nombreCarreraGestor(...args); }
    function planCarreraGestor(...args){ return applicationModule('gestor-secciones').planCarreraGestor(...args); }
    function nombreCarreraConPlanGestor(...args){ return applicationModule('gestor-secciones').nombreCarreraConPlanGestor(...args); }
    function nivelGestor(...args){ return applicationModule('gestor-secciones').nivelGestor(...args); }
    function jornadaGestor(...args){ return applicationModule('gestor-secciones').jornadaGestor(...args); }
    function modalidadAsignaturaGestor(...args){ return applicationModule('gestor-secciones').modalidadAsignaturaGestor(...args); }
    function areaAsignaturaGestor(...args){ return applicationModule('gestor-secciones').areaAsignaturaGestor(...args); }
    function especialidadGestor(...args){ return applicationModule('gestor-secciones').especialidadGestor(...args); }
    function sincronizarEspecialidadesDesdeGestor(...args){ return applicationModule('gestor-secciones').sincronizarEspecialidadesDesdeGestor(...args); }
    function tipoEspacioDesdeTexto(...args){ return applicationModule('gestor-secciones').tipoEspacioDesdeTexto(...args); }
    function parsearSalaReferenciaGestor(...args){ return applicationModule('gestor-secciones').parsearSalaReferenciaGestor(...args); }
    function familiaProgramaGestor(...args){ return applicationModule('gestor-secciones').familiaProgramaGestor(...args); }
    function recalcularAreasAsignaturasDesdeGestor(...args){ return applicationModule('gestor-secciones').recalcularAreasAsignaturasDesdeGestor(...args); }
    function esSeccionFusionLiteral(...args){ return applicationModule('gestor-secciones').esSeccionFusionLiteral(...args); }
    function esSeccionRealGestor(...args){ return applicationModule('gestor-secciones').esSeccionRealGestor(...args); }
    function seccionBaseSinMarcaGestor(...args){ return applicationModule('gestor-secciones').seccionBaseSinMarcaGestor(...args); }
    function marcaSeccionGestor(...args){ return applicationModule('gestor-secciones').marcaSeccionGestor(...args); }
    function tieneMarcaFusionGestor(...args){ return applicationModule('gestor-secciones').tieneMarcaFusionGestor(...args); }
    function tipoFilaGestor(...args){ return applicationModule('gestor-secciones').tipoFilaGestor(...args); }
    function normalizarGestorSeccionesData(...args){ return applicationModule('gestor-secciones').normalizarGestorSeccionesData(...args); }
    function detectarColumnasGestor(...args){ return applicationModule('gestor-secciones').detectarColumnasGestor(...args); }
    function leerFilaGestor(...args){ return applicationModule('gestor-secciones').leerFilaGestor(...args); }
    function descriptorCarreraRegistroGestor(...args){ return applicationModule('gestor-secciones').descriptorCarreraRegistroGestor(...args); }
    function opcionesFiltroGestor(...args){ return applicationModule('gestor-secciones').opcionesFiltroGestor(...args); }
    function filtrarRegistrosGestor(...args){ return applicationModule('gestor-secciones').filtrarRegistrosGestor(...args); }
    function prepararRegistrosAplicacionGestor(...args){ return applicationModule('gestor-secciones').prepararRegistrosAplicacionGestor(...args); }
    function filtroCompletoGestor(...args){ return applicationModule('gestor-secciones').filtroCompletoGestor(...args); }
    function analizarGestorSecciones(...args){ return applicationModule('gestor-secciones').analizarGestorSecciones(...args); }
    function normalizarPropuestaGestor(...args){ return applicationModule('gestor-secciones').normalizarPropuestaGestor(...args); }
    function validarPropuestaGestor(...args){ return applicationModule('gestor-secciones').validarPropuestaGestor(...args); }
    function construirMemoriaIdsGestor(...args){ return applicationModule('gestor-secciones').construirMemoriaIdsGestor(...args); }
    function guardarMemoriaGestor(...args){ return applicationModule('gestor-secciones').guardarMemoriaGestor(...args); }
    function renderTablaGestorSecciones(...args){ return applicationModule('gestor-secciones').renderTablaGestorSecciones(...args); }
    function seccionPorNombreGestor(...args){ return applicationModule('gestor-secciones').seccionPorNombreGestor(...args); }
    function asignaturaPorCodigoGestor(...args){ return applicationModule('gestor-secciones').asignaturaPorCodigoGestor(...args); }
    function keyEnlaceManualGestor(...args){ return applicationModule('gestor-secciones').keyEnlaceManualGestor(...args); }
    function enlacesManualGestorPorId(...args){ return applicationModule('gestor-secciones').enlacesManualGestorPorId(...args); }
    function getEnlaceManualGestor(...args){ return applicationModule('gestor-secciones').getEnlaceManualGestor(...args); }
    function estadoVisualGestor(...args){ return applicationModule('gestor-secciones').estadoVisualGestor(...args); }
    function descripcionEnlaceManualGestor(...args){ return applicationModule('gestor-secciones').descripcionEnlaceManualGestor(...args); }
    function descripcionMemoriaAplicadaGestor(...args){ return applicationModule('gestor-secciones').descripcionMemoriaAplicadaGestor(...args); }
    function datosInformeGestor(...args){ return applicationModule('gestor-secciones').datosInformeGestor(...args); }
    function filasInformeRelacionesGestor(...args){ return applicationModule('gestor-secciones').filasInformeRelacionesGestor(...args); }
    function matrizInformeGestor(...args){ return applicationModule('gestor-secciones').matrizInformeGestor(...args); }
    function formatearHojaInformeGestor(...args){ return applicationModule('gestor-secciones').formatearHojaInformeGestor(...args); }
    function nombreHojaGestor(...args){ return applicationModule('gestor-secciones').nombreHojaGestor(...args); }
    function exportarInformeGestor(...args){ return applicationModule('gestor-secciones').exportarInformeGestor(...args); }
    function renderBuscadorIdGestor(...args){ return applicationModule('gestor-secciones').renderBuscadorIdGestor(...args); }
    function etiquetaEstadoGestor(...args){ return applicationModule('gestor-secciones').etiquetaEstadoGestor(...args); }
    function renderRelacionesGestor(...args){ return applicationModule('gestor-secciones').renderRelacionesGestor(...args); }
    function renderPendientesGestor(...args){ return applicationModule('gestor-secciones').renderPendientesGestor(...args); }
    function salaPorReferenciaGestor(...args){ return applicationModule('gestor-secciones').salaPorReferenciaGestor(...args); }
    function cupoPedagogicoGestor(...args){ return applicationModule('gestor-secciones').cupoPedagogicoGestor(...args); }
    function analizarFilaProyeccionGestor(...args){ return applicationModule('gestor-secciones').analizarFilaProyeccionGestor(...args); }
    function obtenerProyeccionGestor(...args){ return applicationModule('gestor-secciones').obtenerProyeccionGestor(...args); }
    function claseRiesgoProyeccion(...args){ return applicationModule('gestor-secciones').claseRiesgoProyeccion(...args); }
    function renderProyeccionGestor(...args){ return applicationModule('gestor-secciones').renderProyeccionGestor(...args); }
    function abrirRelacionManualGestor(...args){ return applicationModule('gestor-secciones').abrirRelacionManualGestor(...args); }
    function renderGestorSecciones(...args){ return applicationModule('gestor-secciones').renderGestorSecciones(...args); }
    function aplicarPropuestaGestor(...args){ return applicationModule('gestor-secciones').aplicarPropuestaGestor(...args); }
    function mostrarResultadoAplicacionGestor(...args){ return applicationModule('gestor-secciones').mostrarResultadoAplicacionGestor(...args); }
    function mostrarPreviewGestorSecciones(...args){ return applicationModule('gestor-secciones').mostrarPreviewGestorSecciones(...args); }
    function previsualizarGestorSecciones(...args){ return applicationModule('gestor-secciones').previsualizarGestorSecciones(...args); }
    function aplicarUltimoGestorDesdePestana(...args){ return applicationModule('gestor-secciones').aplicarUltimoGestorDesdePestana(...args); }
    function gestorSeccionesVacio(){
        return {cargas:[],ids:[],filas:[],enlacesManuales:[],ultimaCargaId:null,tablaLimite:20,tablaPagina:1,tablaTamano:20};
    }
    function temporadaDataVacia(){
        return {carreras:[],niveles:[],secciones:[],asignaturas:[],docentes:[],salas:[],asignaturaCarreraNivel:[],asignaturaSeccion:[],planificaciones:[],cargasExternasDocente:[],gruposDictacion:[],vinculosElectivos:[],gestorSecciones:gestorSeccionesVacio()};
    }
    function limpiarTodo(){
        return limpiarTodoApp();
    }
    function abrirMenuLimpiar(){
        document.getElementById('modalContainer').innerHTML=`
        <div class="modal-overlay" id="modalOverlay"><div class="modal">
            <div class="modal-header">
                <h3>Limpiar</h3>
                <p>Escoge qué nivel de información quieres eliminar.</p>
            </div>
            <div class="cleanup-options">
                <button class="cleanup-option" id="btnLimpiarPlanificacionModal" type="button">
                    <strong>Limpiar planificación</strong>
                    <span>Elimina solo bloques planificados y resultados automáticos.</span>
                </button>
                <button class="cleanup-option danger-soft" id="btnLimpiarTemporadaModal" type="button">
                    <strong>Limpiar temporada</strong>
                    <span>Vacía la temporada actual, manteniendo la temporada creada.</span>
                </button>
                <button class="cleanup-option danger" id="btnLimpiarTodoModal" type="button">
                    <strong>Limpiar todo</strong>
                    <span>Reinicia todas las temporadas y datos académicos.</span>
                </button>
            </div>
            <div class="modal-actions">
                <button class="btn" id="btnCancelarLimpiarModal" type="button">Cancelar</button>
            </div>
        </div></div>`;
        const cerrar=()=>cerrarModal();
        document.getElementById('btnCancelarLimpiarModal').onclick=cerrar;
        document.getElementById('modalOverlay').onclick=(e)=>{ if(e.target===e.currentTarget) cerrar(); };
        document.getElementById('btnLimpiarPlanificacionModal').onclick=()=>{ cerrar(); limpiarPlanificacion(); };
        document.getElementById('btnLimpiarTemporadaModal').onclick=()=>{ cerrar(); limpiarTemporada(); };
        document.getElementById('btnLimpiarTodoModal').onclick=()=>{ cerrar(); limpiarTodoApp(); };
    }
    async function limpiarPlanificacion(){
        const total=data.planificaciones.length;
        const ok=await confirmarAccionCritica({
            titulo:'Limpiar planificación',
            mensaje:'Se eliminarán solo los bloques planificados y resultados automáticos asociados.',
            queHara:`Eliminará ${total} bloque(s) planificado(s).`,
            afectara:'Planificación, resultados automáticos y reportes derivados.',
            noTocara:'No eliminará secciones, asignaturas, docentes ni salas.',
            seguridad:'Creará punto de recuperación antes de limpiar.',
            confirmarTexto:'Limpiar planificación',
            peligro:true
        });
        if(!ok) return;
        crearPuntoRecuperacion('antes_limpiar_planificacion');
        pushUndo();
        data.planificaciones=[];
        data.ultimoAutoGeneral=null;
        data.ultimaAutoEjecucion=null;
        data.autoEjecuciones=[];
        limpiarHistorialCambios();
        data.modoPlan=false;
        reconstruirIndices();
        guardar({forzar:true});
        refrescarTodo();
        auditoria('limpiar_planificacion',{bloquesEliminados:total});
        toast('Planificación eliminada','info');
    }
    async function limpiarTemporada(){
        const activa=data.temporadas?.find(t=>t.id===(data.sel?.temporadaId||data.configuracion?.temporadaActualId))||data.temporadas?.[0]||null;
        if(!activa) return toast('No hay temporada activa para limpiar','error');
        const ok=await confirmarAccionCritica({
            titulo:'Limpiar temporada',
            mensaje:`Se vaciará ${activa.temporada} ${activa.anio}, pero la temporada seguirá existiendo.`,
            queHara:'Eliminará carreras, niveles, secciones, asignaturas, docentes, salas, Gestor y planificación de esta temporada.',
            afectara:`Solo ${activa.temporada} ${activa.anio}.`,
            noTocara:'No eliminará otras temporadas ni configuraciones globales.',
            seguridad:'Creará punto de recuperación antes de limpiar.',
            confirmarTexto:'Limpiar temporada',
            peligro:true
        });
        if(!ok) return;
        crearPuntoRecuperacion('antes_limpiar_temporada');
        const tempVacia=temporadaDataVacia();
        data.temporadaData=data.temporadaData||{};
        data.temporadaData[activa.id]=tempVacia;
        Object.assign(data,tempVacia);
        data.sel={temporadaId:activa.id,area:null,carreraId:null,nivelId:null,seccionId:null,asignaturaId:null,docenteId:null,salaId:null,tipo:'presencial'};
        data.configuracion.temporadaActualId=activa.id;
        data.ultimoAutoGeneral=null;
        data.ultimaAutoEjecucion=null;
        data.autoEjecuciones=[];
        data.modoPlan=false;
        limpiarHistorialCambios();
        asegurarEstructuraImportada();
        normalizarDatos();
        reconstruirIndices();
        aplicarPaleta();
        aplicarFuente();
        actualizarIndicadorPaleta();
        guardar({forzar:true});
        refrescarTodo();
        auditoria('limpiar_temporada',{temporadaId:activa.id,temporada:`${activa.temporada} ${activa.anio}`});
        toast('Temporada limpiada','info');
    }
    async function limpiarTodoApp(){
        const ok=await confirmarAccionCritica({
            titulo:'Limpiar todo',
            mensaje:'Se eliminarán todas las temporadas y datos académicos, manteniendo las configuraciones.',
            queHara:`Reemplazará ${data.temporadas?.length||0} temporada(s) por una temporada nueva vacía.`,
            afectara:'Temporadas, catálogos académicos, Gestor, planificación e historial operativo.',
            noTocara:'No eliminará usuarios ni datos de Firebase Authentication.',
            seguridad:'Mantendrá configuraciones y creará punto de recuperación antes de limpiar.',
            confirmarTexto:'Limpiar todo',
            peligro:true
        });
        if(!ok) return;
        crearPuntoRecuperacion('antes_limpiar_todo');
        const configuracionPreservada=JSON.parse(JSON.stringify(data.configuracion||CONFIG_DEFAULT));
        const anio=new Date().getFullYear();
        const mes=new Date().getMonth();
        const tempDefault=mes>=2&&mes<5?'Otoño':mes>=5&&mes<8?'Invierno':mes>=8&&mes<11?'Primavera':'Verano';
        const temporada={id:genId(), temporada:tempDefault, anio};
        const tempVacia=temporadaDataVacia();
        configuracionPreservada.temporadaActualId=temporada.id;
        data={
            ...temporadaDataVacia(),
            configuracion:configuracionPreservada,
            modoPlan:false,
            temporadas:[temporada],
            auditoria:[],
            ultimoAutoGeneral:null,
            ultimaAutoEjecucion:null,
            autoEjecuciones:[],
            temporadaData:{[temporada.id]:tempVacia},
            sel:{temporadaId:temporada.id,area:null,carreraId:null,nivelId:null,seccionId:null,asignaturaId:null,docenteId:null,salaId:null,tipo:'presencial'}
        };
        Object.assign(data,tempVacia);
        limpiarHistorialCambios();
        try {
            localStorage.removeItem('planificador_v5_8_pendiente');
            localStorage.removeItem('planificador_v5_8_pendiente_ts');
        } catch(e) {}
        asegurarEstructuraImportada();
        normalizarDatos();
        reconstruirIndices();
        aplicarFuente();
        actualizarSelectorTemporada();
        aplicarPaleta();
        actualizarIndicadorPaleta();
        guardar({forzar:true});
        refrescarTodo();
        toast('Datos eliminados','info');
    }
    function abrirCambioPassword(){
        const email = window._fb?.auth?.currentUser?.email || window._usuarioActual || '';
        document.getElementById('modalContainer').innerHTML=`
        <div class="modal-overlay" id="modalOverlay"><div class="modal">
            <h3>Cambiar contraseña</h3>
            <p style="font-size:0.82rem;color:var(--text-secondary);margin:0 0 12px;">Cuenta: <strong>${escapeHTML(email)}</strong></p>
            <div class="form-group"><label class="form-label">Contraseña actual</label><input class="form-input" id="passActual" type="password" autocomplete="current-password"></div>
            <div class="form-group"><label class="form-label">Nueva contraseña</label><input class="form-input" id="passNueva" type="password" autocomplete="new-password"></div>
            <div class="form-group"><label class="form-label">Confirmar nueva contraseña</label><input class="form-input" id="passConfirmar" type="password" autocomplete="new-password"></div>
            <div id="passCambioMsg" style="min-height:18px;font-size:0.82rem;color:var(--danger);margin-bottom:12px;"></div>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button class="btn btn-sm" id="btnCancelarPass">Cancelar</button>
                <button class="btn btn-primary btn-sm" id="btnGuardarPass">Guardar</button>
            </div>
        </div></div>`;
        const cerrar=()=>cerrarModal();
        const msg=document.getElementById('passCambioMsg');
        const guardarCambio=async()=>{
            const actual=document.getElementById('passActual').value;
            const nueva=document.getElementById('passNueva').value;
            const confirmar=document.getElementById('passConfirmar').value;
            if(!actual||!nueva||!confirmar){ msg.textContent='Completa todos los campos'; return; }
            if(nueva.length<8){ msg.textContent='La nueva contraseña debe tener al menos 8 caracteres'; return; }
            if(nueva!==confirmar){ msg.textContent='La confirmación no coincide'; return; }
            const user=window._fb?.auth?.currentUser;
            if(!user?.email){ msg.textContent='No se pudo identificar la sesión actual'; return; }
            const btn=document.getElementById('btnGuardarPass');
            btn.disabled=true; btn.textContent='Guardando...'; msg.textContent='';
            try{
                const cred=window._fb.EmailAuthProvider.credential(user.email, actual);
                await window._fb.reauthenticateWithCredential(user, cred);
                await window._fb.updatePassword(user, nueva);
                toast('Contraseña actualizada','success');
                cerrarModal();
            } catch(e){
                const code=e?.code||'';
                if(code==='auth/wrong-password'||code==='auth/invalid-credential') msg.textContent='La contraseña actual no es correcta';
                else if(code==='auth/weak-password') msg.textContent='La nueva contraseña es demasiado débil';
                else if(code==='auth/requires-recent-login') msg.textContent='Por seguridad, cierra sesión, vuelve a ingresar e intenta nuevamente';
                else msg.textContent='No se pudo cambiar la contraseña. Intenta nuevamente.';
                btn.disabled=false; btn.textContent='Guardar';
            }
        };
        document.getElementById('btnCancelarPass').onclick=cerrar;
        document.getElementById('btnGuardarPass').onclick=guardarCambio;
        document.getElementById('modalOverlay').onclick=(e)=>{ if(e.target===e.currentTarget) cerrar(); };
        ['passActual','passNueva','passConfirmar'].forEach(id=>document.getElementById(id).addEventListener('keydown',e=>{ if(e.key==='Enter') guardarCambio(); }));
        document.getElementById('passActual').focus();
    }
    function ajustarDropdownViewport(menu, boton){
        if(!menu||!boton||!menu.classList.contains('show')) return;
        menu.style.left='';
        menu.style.right='';
        menu.style.top='';
        menu.style.maxHeight='';
        menu.style.overflowY='';
        const rect=menu.getBoundingClientRect();
        const btnRect=boton.getBoundingClientRect();
        const margen=12;
        if(rect.right>window.innerWidth-margen){
            const delta=rect.right-(window.innerWidth-margen);
            menu.style.right=`${delta}px`;
        }
        if(rect.left<margen){
            menu.style.left=`${margen-btnRect.left}px`;
            menu.style.right='auto';
        }
        const rect2=menu.getBoundingClientRect();
        if(rect2.bottom>window.innerHeight-margen){
            menu.style.maxHeight=`${Math.max(160,window.innerHeight-rect2.top-margen)}px`;
            menu.style.overflowY='auto';
        }
    }
    function alternarDropdown(menuId, boton){
        const menu=document.getElementById(menuId);
        if(!menu) return;
        const seAbre=!menu.classList.contains('show');
        document.querySelectorAll('.dropdown-menu').forEach(m=>{ if(m!==menu) m.classList.remove('show'); });
        menu.classList.toggle('show',seAbre);
        if(seAbre) requestAnimationFrame(()=>ajustarDropdownViewport(menu,boton));
    }
    document.getElementById('btnExportar').addEventListener('click',(e)=>alternarDropdown('exportDropdown',e.currentTarget));
    document.getElementById('btnMenu').addEventListener('click',(e)=>{ actualizarEstadoRespaldoLocal(); alternarDropdown('menuDropdown',e.currentTarget); });
    document.getElementById('btnUndoGlobal')?.addEventListener('click',deshacer);
    document.getElementById('btnRedoGlobal')?.addEventListener('click',rehacer);
    document.getElementById('btnGestorCargar')?.addEventListener('click',previsualizarGestorSecciones);
    document.getElementById('btnGestorAplicar')?.addEventListener('click',aplicarUltimoGestorDesdePestana);
    document.getElementById('btnGestorExportarInforme')?.addEventListener('click',exportarInformeGestor);
    document.getElementById('gestorTablaBusqueda')?.addEventListener('input',()=>{
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        data.gestorSecciones.tablaPagina=1;
        renderTablaGestorSecciones();
    });
    document.getElementById('clearGestorTablaBusqueda')?.addEventListener('click',()=>{
        const input=document.getElementById('gestorTablaBusqueda');
        if(input) input.value='';
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        data.gestorSecciones.tablaPagina=1;
        renderTablaGestorSecciones();
    });
    document.getElementById('gestorTablaTamano')?.addEventListener('change',(e)=>{
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        data.gestorSecciones.tablaTamano=Number(e.target.value)||20;
        data.gestorSecciones.tablaPagina=1;
        renderTablaGestorSecciones();
    });
    document.getElementById('btnGestorPaginaAnterior')?.addEventListener('click',()=>{
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        data.gestorSecciones.tablaPagina=Math.max(1,(Number(data.gestorSecciones.tablaPagina)||1)-1);
        renderTablaGestorSecciones();
    });
    document.getElementById('btnGestorPaginaSiguiente')?.addEventListener('click',()=>{
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        data.gestorSecciones.tablaPagina=(Number(data.gestorSecciones.tablaPagina)||1)+1;
        renderTablaGestorSecciones();
    });
    document.getElementById('gestorIdBusqueda')?.addEventListener('input',renderBuscadorIdGestor);
    document.getElementById('clearGestorIdBusqueda')?.addEventListener('click',()=>{
        const input=document.getElementById('gestorIdBusqueda');
        if(input) input.value='';
        renderBuscadorIdGestor();
    });
    document.getElementById('gestorRelacionEstado')?.addEventListener('change',renderRelacionesGestor);
    document.getElementById('gestorRelacionBusqueda')?.addEventListener('input',renderRelacionesGestor);
    document.getElementById('clearGestorRelacionBusqueda')?.addEventListener('click',()=>{
        const input=document.getElementById('gestorRelacionBusqueda');
        if(input) input.value='';
        renderRelacionesGestor();
    });
    document.getElementById('gestorProyeccionRiesgo')?.addEventListener('change',renderProyeccionGestor);
    document.getElementById('gestorProyeccionAccion')?.addEventListener('change',renderProyeccionGestor);
    document.getElementById('gestorProyeccionBusqueda')?.addEventListener('input',renderProyeccionGestor);
    document.getElementById('clearGestorProyeccionBusqueda')?.addEventListener('click',()=>{
        const input=document.getElementById('gestorProyeccionBusqueda');
        if(input) input.value='';
        renderProyeccionGestor();
    });
    document.getElementById('gestorProyeccion')?.addEventListener('click',(e)=>{
        const btn=e.target.closest('.gestor-ir-secciones');
        if(!btn) return;
        irASeccionesDesdeGestor({
            seccionId:btn.dataset.seccion||'',
            asignaturaId:btn.dataset.asignatura||'',
            idGestor:btn.dataset.idGestor||'',
            codigo:btn.dataset.codigo||'',
            area:btn.dataset.area||'',
            plan:btn.dataset.plan||'',
            nivel:btn.dataset.nivel||'',
            nombre:btn.dataset.nombre||''
        });
    });
    document.getElementById('gestorIdResultado')?.addEventListener('click',(e)=>{
        const relacionar=e.target.closest('.gestor-relacionar-id');
        if(relacionar) return abrirRelacionManualGestor(relacionar.dataset.id,relacionar.dataset.carga);
        const btn=e.target.closest('.gestor-ir-planificacion');
        if(!btn) return;
        irASeccion(btn.dataset.seccion,{asignaturaId:btn.dataset.asignatura||null,mensaje:`ID ${btn.dataset.id||''} abierta en planificación`});
    });
    document.getElementById('gestorRelaciones')?.addEventListener('click',(e)=>{
        const relacionar=e.target.closest('.gestor-relacionar-id');
        if(relacionar) return abrirRelacionManualGestor(relacionar.dataset.id,relacionar.dataset.carga);
        const btn=e.target.closest('.gestor-ir-planificacion');
        if(!btn) return;
        irASeccion(btn.dataset.seccion,{asignaturaId:btn.dataset.asignatura||null,mensaje:`ID ${btn.dataset.id||''} abierta en planificación`});
    });
    document.getElementById('gestorPendientes')?.addEventListener('click',(e)=>{
        const relacionar=e.target.closest('.gestor-relacionar-id');
        if(relacionar) return abrirRelacionManualGestor(relacionar.dataset.id,relacionar.dataset.carga);
        const buscar=e.target.closest('.gestor-buscar-id');
        const verFilas=e.target.closest('.gestor-ver-filas');
        if(buscar){
            const input=document.getElementById('gestorIdBusqueda');
            if(input){
                input.value=buscar.dataset.id||'';
                renderBuscadorIdGestor();
                input.scrollIntoView({behavior:'smooth',block:'center'});
                input.focus();
            }
            return;
        }
        if(verFilas){
            const input=document.getElementById('gestorTablaBusqueda');
            if(input){
                input.value=verFilas.dataset.id||'';
                data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
                data.gestorSecciones.tablaTamano=[20,50,100].includes(Number(data.gestorSecciones.tablaTamano))?Number(data.gestorSecciones.tablaTamano):20;
                data.gestorSecciones.tablaLimite=data.gestorSecciones.tablaTamano;
                data.gestorSecciones.tablaPagina=1;
                renderTablaGestorSecciones();
                input.scrollIntoView({behavior:'smooth',block:'center'});
                input.focus();
            }
        }
    });
    // Cerrar sesión Firebase
    document.getElementById('btnCerrarSesion').addEventListener('click', async ()=>{
        if (confirm('¿Cerrar sesión?')) {
            try { await window._fb.signOut(window._fb.auth); } catch(e) {}
            window._usuarioActual = null;
        }
    });
    async function ejecutarAccionMenu(action) {
        switch (action) {
            case 'exportarCursos': exportarCursos(); break;
            case 'exportarDocentes': exportarDocentes(); break;
            case 'exportarSalas': exportarSalas(); break;
            case 'exportarDatos': exportarDatos(); break;
            case 'importarDatos': importarDatos(); break;
            case 'restaurarRespaldoLocal': restaurarRespaldoLocal(); break;
            case 'descargarExcelCompleto': descargarExcelCompleto(); break;
            case 'exportarPdf': exportarPdf(); break;
            case 'sincronizarFirestore':
                recargarDesdeFirestore();
                break;
            case 'cambiarPassword': abrirCambioPassword(); break;
            case 'abrirConfiguracion': abrirConfiguracion(); break;
            case 'abrirMenuLimpiar': abrirMenuLimpiar(); break;
            case 'limpiarPlanificacion': await limpiarPlanificacion(); break;
            case 'limpiarTemporada': await limpiarTemporada(); break;
            case 'limpiarTodo': await limpiarTodoApp(); break;
        }
    }
    document.querySelectorAll('.dropdown-menu').forEach(menu=>menu.addEventListener('click',(e)=>{
        const item=e.target.closest?.('[data-action]');
        const action=item&&menu.contains(item)?item.dataset.action:'';
        if(action) ejecutarAccionMenu(action);
        menu.classList.remove('show');
    }));
    document.addEventListener('click',(e)=>{if(!e.target.closest('.dropdown')) document.querySelectorAll('.dropdown-menu').forEach(m=>m.classList.remove('show'));});
    document.addEventListener('click',(e)=>{if(!e.target.closest('.search-box')) document.querySelectorAll('.search-results').forEach(r=>{ r.classList.remove('show'); r.querySelectorAll('li').forEach(li=>li.classList.remove('kb-focus')); });});

    function activarTab(tab){
        const btn=document.querySelector(`.tab-btn[data-tab="${tab}"]`);
        if(!btn) return false;
        if(data.modoPlan){
            data.modoPlan=false;
            limpiarControlesTrabajoPlanificacion();
            actualizarModoPlanificacionUI();
            actualizarSelectoresPlan();
        }
        document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
        document.getElementById(PANEL_POR_TAB[tab]).classList.add('active');
        renderTabActual();
        return true;
    }
    function irASeccion(seccionId, opciones={}){
        const sec=data.secciones.find(s=>s.id===seccionId);
        if(!sec) return toast('No se encontró la sección','error');
        const nivel=data.niveles.find(n=>n.id===sec.nivelId);
        if(!nivel) return toast('No se encontró el nivel de la sección','error');
        const carrera=data.carreras.find(c=>c.id===nivel.carreraId);
        if(!carrera) return toast('No se encontró la carrera de la sección','error');
        if(activarTab('planificacion')===false) return;
        data.sel.area=carrera.area||carrera.especialidad||null;
        data.sel.carreraId=carrera.id;
        data.sel.nivelId=nivel.id;
        data.sel.jornada=sec.jornada||jornadaGestor('',sec.nombre);
        data.sel.seccionId=sec.id;
        data.sel.asignaturaId=opciones.asignaturaId||null;
        data.sel.docenteId=opciones.docenteId||null;
        data.sel.salaId=opciones.salaId||null;
        data.sel.componenteId=opciones.componenteId||null;
        data.sel.tipo=opciones.tipo||data.sel.tipo||'presencial';
        actualizarSelectoresPlan();
        construirGrilla();
        actualizarProgresoPlan();
        if(Number.isInteger(Number(opciones.dia))&&Number.isInteger(Number(opciones.bloque))){
            setTimeout(()=>{
                const celda=document.querySelector(`#scheduleGrid .grid-cell[data-dia="${Number(opciones.dia)}"][data-bloque="${Number(opciones.bloque)}"]`);
                celda?.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});
                celda?.classList.add('compare-jump-focus');
                setTimeout(()=>celda?.classList.remove('compare-jump-focus'),2600);
            },120);
        }
        document.getElementById('scheduleContainer')?.scrollIntoView({behavior:'smooth',block:'start'});
        toast(opciones.mensaje||`Revisando sección ${sec.nombre}`,'info');
    }
    function abrirCargaExternaPlanificada(plan={}){
        const sec=data.secciones.find(s=>s.id===plan.seccionId);
        if(!sec) return toast('No se encontró la sección de la carga externa','error');
        const nivel=data.niveles.find(n=>n.id===sec.nivelId);
        const carrera=nivel?data.carreras.find(c=>c.id===nivel.carreraId):null;
        if(!nivel||!carrera) return toast('No se encontró el contexto de la carga externa','error');
        if(activarTab('planificacion')===false) return;
        data.sel.area=carrera.area||carrera.especialidad||null;
        data.sel.carreraId=carrera.id;
        data.sel.nivelId=nivel.id;
        data.sel.jornada=sec.jornada||jornadaGestor('',sec.nombre);
        data.sel.seccionId=sec.id;
        data.sel.asignaturaId=null;
        data.sel.componenteId=null;
        data.sel.docenteId=plan.docenteId||null;
        data.sel.salaId=plan.salaId||null;
        data.sel.tipo=plan.tipoPresencial===false?'virtual':'presencial';
        data.sel.cargaExterna={
            activa:true,
            id:plan.asignaturaId,
            codigo:plan.codigoExterno||'EXT',
            nombre:plan.nombreExterno||'Carga externa',
            origen:plan.origenCargaExterna||'',
            estado:plan.estadoCargaExterna||plan.estadoGestionExterna||'gestion'
        };
        data.modoPlan=true;
        actualizarModoPlanificacionUI();
        actualizarSelectoresPlan();
        construirGrilla();
        actualizarProgresoPlan();
        setTimeout(()=>{
            const celda=document.querySelector(`#scheduleGrid .grid-cell[data-dia="${Number(plan.dia)}"][data-bloque="${Number(plan.bloque)}"]`);
            celda?.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});
            celda?.classList.add('compare-jump-focus');
            setTimeout(()=>celda?.classList.remove('compare-jump-focus'),2600);
        },120);
        toast('Carga externa lista para editar en planificación','info');
    }
    function irAGestorId(idGestor){
        const id=String(idGestor||'').trim();
        if(!id) return toast('Este bloque no tiene ID del Gestor registrada','info');
        if(activarTab('gestorSecciones')===false) return;
        const input=document.getElementById('gestorIdBusqueda');
        if(input){
            input.value=id;
            renderBuscadorIdGestor();
            input.scrollIntoView({behavior:'smooth',block:'center'});
            input.focus();
        }
        toast(`Buscando ID ${id}`,'info');
    }
    function resolverDestinoSeccionesGestor({seccionId='',asignaturaId='',idGestor='',codigo='',nombre='' }={}){
        let sec=data.secciones.find(s=>s.id===seccionId)||seccionPorNombreGestor(nombre);
        let asig=data.asignaturas.find(a=>a.id===asignaturaId)||asignaturaPorCodigoGestor(codigo);
        if(!sec && asig && idGestor){
            const grupo=(getGruposDictacion()||[]).find(g=>{
                const mismoId=String(g.idGestorSeccion||'')===String(idGestor||'');
                const mismaAsignatura=g.asignaturaId===asig.id || (g.asignaturasEquivalentesIds||[]).includes(asig.id);
                return mismoId&&mismaAsignatura;
            });
            if(grupo){
                sec=data.secciones.find(s=>s.id===grupo.seccionMadreId)
                    || data.secciones.find(s=>(grupo.seccionesVinculadasIds||[]).includes(s.id))
                    || null;
            }
        }
        return {sec,asig};
    }
    function grupoCoincideAsignaturaGestor(grupo,asig){
        if(!grupo||!asig) return false;
        const principal=data.asignaturas.find(a=>a.id===grupo.asignaturaId);
        return grupo.asignaturaId===asig.id ||
            (grupo.asignaturasEquivalentesIds||[]).includes(asig.id) ||
            (!!principal?.codigo && !!asig.codigo && normalizarEncabezadoGestor(principal.codigo)===normalizarEncabezadoGestor(asig.codigo));
    }
    function fusionDesvinculadaGestor(sec,asig){
        if(!sec||!asig) return false;
        const rel=(data.asignaturaSeccion||[]).find(r=>r.seccionId===sec.id&&r.asignaturaId===asig.id);
        if(rel?.fusionDesvinculada) return true;
        return getGruposDictacion().some(g=>
            g.fusionDesvinculada &&
            g.seccionMadreId===sec.id &&
            grupoCoincideAsignaturaGestor(g,asig)
        );
    }
    function irASeccionesDesdeGestor({seccionId='',asignaturaId='',idGestor='',codigo='',area='',plan='',nivel='',nombre='' }={}){
        const destino=resolverDestinoSeccionesGestor({seccionId,asignaturaId,idGestor,codigo,nombre});
        const sec=destino.sec;
        const asig=destino.asig;
        const nivelObj=sec?data.niveles.find(n=>n.id===sec.nivelId):null;
        const carrera= nivelObj?data.carreras.find(c=>c.id===nivelObj.carreraId):null;
        if(activarTab('secciones')===false) return;
        const filtro=document.getElementById('seccionesFiltroArea');
        const areaObjetivo=carrera?.area||carrera?.especialidad||area||'';
        if(filtro && areaObjetivo){
            const existe=[...filtro.options].some(o=>o.value===areaObjetivo);
            if(existe) filtro.value=areaObjetivo;
        }
        renderCarreras();
        if(carrera){
            const nivelesCarrera=document.getElementById(`niveles_${carrera.id}`);
            nivelesCarrera?.classList.add('open');
            if(nivelesCarrera) nivelesCarrera.style.maxHeight='none';
            document.querySelector(`#listaCarreras .career-header[data-tipo="carrera"][data-id="${String(carrera.id).replace(/["\\]/g,'\\$&')}"]`)?.classList.add('open');
        }
        if(nivelObj){
            const seccionesNivel=document.getElementById(`secciones_${nivelObj.id}`);
            seccionesNivel?.classList.add('open');
            if(seccionesNivel) seccionesNivel.style.maxHeight='none';
            document.querySelector(`#listaCarreras .career-header[data-tipo="nivel"][data-id="${String(nivelObj.id).replace(/["\\]/g,'\\$&')}"]`)?.classList.add('open');
        }
        const botonSeccion=sec
            ? [...document.querySelectorAll('#listaCarreras .btn-dictacion-seccion')].find(b=>b.dataset.id===sec.id)
            : null;
        const objetivo=botonSeccion
            ? botonSeccion.closest('.section-chip')
            : document.getElementById('listaCarreras');
        if(objetivo){
            objetivo.scrollIntoView({behavior:'smooth',block:'center'});
            objetivo.classList?.add('section-chip-focus');
            setTimeout(()=>objetivo.classList?.remove('section-chip-focus'),3600);
        }
        if(sec && asig && typeof abrirGestionDictacionSeccion==='function'){
            setTimeout(()=>abrirGestionDictacionSeccion(sec.id,{highlightAsignaturaId:asig.id}),450);
        }
        const detalle=sec?.nombre||nombre||plan||nivel||'Secciones';
        toast(sec?`Sección ${detalle} localizada para revisión`:`Abriendo Secciones para revisar ${detalle}`,'info');
    }
    document.querySelectorAll('.tab-btn').forEach(btn=>btn.addEventListener('click',()=>activarTab(btn.dataset.tab)));
    // ─── Navegación por teclado ────────────────────────────────────────────────
    // Helpers para mover foco dentro de listas y popups
    function kbNavList(items, currentIndex, direction) {
        if (!items.length) return -1;
        let next = currentIndex + direction;
        if (next < 0) next = items.length - 1;
        if (next >= items.length) next = 0;
        return next;
    }
    function kbSetFocus(items, idx) {
        items.forEach(el => el.classList.remove('kb-focus'));
        if (idx >= 0 && idx < items.length) {
            items[idx].classList.add('kb-focus');
            items[idx].scrollIntoView({ block:'nearest' });
        }
    }
    // Obtiene el índice actualmente enfocado en una colección de elementos
    function kbCurrentIndex(items) {
        return Array.from(items).findIndex(el => el.classList.contains('kb-focus'));
    }

    // Navegación dentro de un popup de acción abierto
    function kbPopupNav(direction) {
        if (!App._popupAbierto) return false;
        const btns = Array.from(App._popupAbierto.querySelectorAll('button'));
        const idx = kbNavList(btns, kbCurrentIndex(btns), direction);
        kbSetFocus(btns, idx);
        return true;
    }
    function kbPopupEnter() {
        if (!App._popupAbierto) return false;
        const focused = App._popupAbierto.querySelector('button.kb-focus');
        if (focused) { focused.click(); return true; }
        // Si no hay ninguno enfocado aún, activar el primero
        const first = App._popupAbierto.querySelector('button');
        if (first) { first.click(); return true; }
        return false;
    }

    // Navegación dentro de una lista .search-results visible
    function kbSearchNav(listEl, direction) {
        if (!listEl || !listEl.classList.contains('show')) return false;
        const items = Array.from(listEl.querySelectorAll('li'));
        const idx = kbNavList(items, kbCurrentIndex(items), direction);
        kbSetFocus(items, idx);
        return true;
    }
    function kbSearchEnter(inputEl, listEl) {
        if (!listEl || !listEl.classList.contains('show')) return false;
        const focused = listEl.querySelector('li.kb-focus');
        if (focused) { focused.click(); inputEl?.blur(); return true; }
        // Sin foco explícito: activar el primero visible
        const first = listEl.querySelector('li');
        if (first) { first.click(); inputEl?.blur(); return true; }
        return false;
    }

    // Detecta qué search-results está activo según el input con foco
    function getActiveSearchPair() {
        const active = document.activeElement;
        if (!active) return null;
        const box = active.closest('.search-box');
        if (!box) return null;
        const list = box.querySelector('.search-results');
        return list ? { input: active, list } : null;
    }

    // Detecta si hay un modal abierto y encuentra su botón principal (Guardar/Aceptar/Confirmar)
    function getModalPrimaryBtn() {
        const overlay = document.getElementById('modalOverlay');
        if (!overlay) return null;
        // Buscar por clase primaria primero, luego por ID conocidos
        return overlay.querySelector('.btn-primary') ||
               overlay.querySelector('button[id*="Guardar"]') ||
               overlay.querySelector('button[id*="guardar"]') ||
               overlay.querySelector('button[id*="Aplicar"]') ||
               overlay.querySelector('button[id*="Cambiar"]') ||
               overlay.querySelector('button[id*="Aceptar"]') ||
               overlay.querySelector('button[id*="Confirmar"]');
    }

    document.addEventListener('keydown',(e)=>{
        const inTextArea = e.target.tagName === 'TEXTAREA';
        const inInput = e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT';
        const editable = inTextArea || inInput || e.target.isContentEditable;
        const keyLower = String(e.key||'').toLowerCase();
        const searchPair = getActiveSearchPair();

        // ── Undo / Redo ──────────────────────────────────────────────────────
        if(!editable && (e.ctrlKey||e.metaKey) && keyLower==='z' && !e.shiftKey){ e.preventDefault(); deshacer(); return; }
        if(!editable && (e.ctrlKey||e.metaKey) && ((keyLower==='z' && e.shiftKey) || keyLower==='y')){ e.preventDefault(); rehacer(); return; }

        // ── Escape: cerrar capas de afuera hacia adentro ─────────────────────
        if (e.key === 'Escape') {
            const modalOverlay = document.getElementById('modalOverlay');
            if (hayMovimiento() && !modalOverlay) { cancelarMovimiento(); e.preventDefault(); return; }
            // 1. Popup de acción de celda
            if (App._popupAbierto) { cerrarPopupAccion(); e.preventDefault(); return; }
            // 2. Listas de búsqueda abiertas
            const openList = document.querySelector('.search-results.show');
            if (openList) { openList.classList.remove('show'); openList.querySelectorAll('li').forEach(li=>li.classList.remove('kb-focus')); e.preventDefault(); return; }
            // 3. Dropdowns de menú abiertos
            const openDropdown = document.querySelector('.dropdown-menu.show');
            if (openDropdown) { openDropdown.classList.remove('show'); e.preventDefault(); return; }
            // 4. Modal abierto
            if (modalOverlay) { cerrarModal(); e.preventDefault(); return; }
            return;
        }

        // ── Flechas: navegación en popup y listas de búsqueda ────────────────
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            const dir = e.key === 'ArrowDown' ? 1 : -1;
            // Popup de acción
            if (App._popupAbierto) { e.preventDefault(); kbPopupNav(dir); return; }
            // Lista de búsqueda activa
            if (searchPair) { e.preventDefault(); kbSearchNav(searchPair.list, dir); return; }
        }

        // ── Enter: confirmar selección o acción principal ────────────────────
        if (e.key === 'Enter' && !inTextArea) {
            // 1. Popup de acción abierto
            if (App._popupAbierto) { e.preventDefault(); kbPopupEnter(); return; }
            // 2. Lista de búsqueda activa con foco (tiene prioridad sobre el modal)
            if (searchPair && searchPair.list.classList.contains('show')) {
                e.preventDefault(); kbSearchEnter(searchPair.input, searchPair.list); return;
            }
            // 3. Modal abierto: Enter confirma siempre, incluso desde un input de texto
            //    Excepción: si el foco está en un <select> con lista desplegable nativa, no interferir
            const modalBtn = getModalPrimaryBtn();
            if (modalBtn && e.target.tagName !== 'SELECT') {
                e.preventDefault(); modalBtn.click(); return;
            }
        }
    });
    window._kbInitPopup = function() {
        if (!App._popupAbierto) return;
        const btns = Array.from(App._popupAbierto.querySelectorAll('button'));
        if (btns.length) kbSetFocus(btns, 0);
    };

    Object.assign(window, {
        abrirModalNivel,
        guardarNivel,
        abrirModalSeccion,
        guardarSeccion,
        abrirModalAsignatura,
        guardarAsignatura,
        eliminarAsignatura,
        abrirModalDocente,
        guardarDocente,
        eliminarDocente,
        abrirModalSala,
        guardarSala,
        eliminarSala,
        exportarCursos,
        exportarDocentes,
        exportarSalas,
        descargarExcelCompleto,
        exportarDatos,
        importarDatos,
        previsualizarGestorSecciones,
        limpiarTodo,
        limpiarPlanificacion,
        limpiarTemporada,
        abrirConfiguracion,
        eliminarEntidad,
        getGruposDictacion,
        getGruposDictacionSeccion,
        getGrupoDictacionAsignaturaSeccion,
        getEstadoDictacionAsignatura,
        getSeccionesConsumidorasGrupo,
        crearGrupoDictacion,
        vincularSeccionAGrupo,
        desvincularSeccionDeGrupo,
        eliminarGrupoDictacion,
        exportarPdf,
        abrirCambioPassword,
        activarTab,
        irASeccion,
        deshacerUltimaAuto,
        abrirReversionAutos
    });

    function inicializarModuloSeguro(nombre,initFn){
        try{
            initFn();
            return true;
        }catch(e){
            console.error(`${nombre} no pudo inicializarse:`, e);
            toast(`${nombre} quedó desactivado temporalmente. El resto de la app sigue operativo.`,'warning');
            return false;
        }
    }

    function inicializarAnimacionesResultados(){
        if((document.documentElement.dataset.planhorMotion!=='full' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches)) return;
        const ids=[
            'listaCarreras','listaAsignaturas','listaDocentes','listaSalas',
            'vistaGrid','vistaGeneralPanel','reporteContenido','dashboardContenido','dashboardConflictos',
            'gestorResumen','gestorIdsResumen','gestorIdResultado','gestorPendientes','gestorRelaciones',
            'gestorProyeccion','gestorTablaCompleta','historialContenido','fichaContenido'
        ];
        ids.forEach(id=>{
            const contenedor=document.getElementById(id);
            if(!contenedor||contenedor.dataset.resultMotion==='1') return;
            contenedor.dataset.resultMotion='1';
            let frame=0;
            let limpieza=0;
            const observer=new MutationObserver(cambios=>{
                if(!cambios.some(c=>c.type==='childList'||c.type==='characterData')) return;
                window.cancelAnimationFrame(frame);
                frame=window.requestAnimationFrame(()=>{
                    if(!contenedor.isConnected||contenedor.offsetParent===null) return;
                    window.clearTimeout(limpieza);
                    contenedor.classList.remove('result-content-refresh');
                    void contenedor.offsetWidth;
                    contenedor.classList.add('result-content-refresh');
                    limpieza=window.setTimeout(()=>contenedor.classList.remove('result-content-refresh'),260);
                });
            });
            observer.observe(contenedor,{childList:true,subtree:true,characterData:true});
        });
    }

    window._planhorStartupSync?.set('Preparando datos de la app...');
    cargar().then(()=>pedirTemporadaInicialSiHaceFalta()).then(()=>{
        window._planhorStartupSync?.set('Cargando módulos...');
        inicializarModuloSeguro('Reportes',()=>Reportes.init());
        inicializarModuloSeguro('Ficha Docente',()=>FichaDocente.init());
        inicializarModuloSeguro('Entidades',()=>Entidades.init());
        inicializarModuloSeguro('Vista Horarios',()=>VistaHorario.init());
        inicializarModuloSeguro('Planificación',()=>Planificacion.init());
        inicializarModuloSeguro('Configuración',()=>Configuracion.init());
        inicializarAnimacionesResultados();
        refrescarInicial();
        window._planhorStartupSync?.hide();
        // Sin autoguardado por intervalo — cada acción llama a guardar() directamente
        // Esto evita que un usuario pise los cambios del otro en entorno multiusuario
    }).catch(error=>{
        console.error('No se pudo iniciar Planhor:', error);
        window._planhorStartupSync?.hide();
        mostrarErrorTecnico?.({
            titulo:'No se pudo iniciar Planhor',
            mensaje:'La app no terminó el arranque seguro. Recarga la página antes de editar datos.',
            modulo:'Arranque',
            accion:'Sincronizar e iniciar',
            error
        });
    });
})();
}; // fin window._iniciarApp

if (window._appDebeIniciar && !window._appIniciada) {
    window._appDebeIniciar = false;
    window._appIniciada = true;
    window._iniciarApp();
}
