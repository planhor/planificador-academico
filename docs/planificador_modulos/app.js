// El script principal se ejecuta cuando Firebase autoriza al usuario
window._iniciarApp = function() {
if (window._appRuntimeInicializada) return;
window._appRuntimeInicializada = true;
(() => {
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
    function pushUndo() {
      undoStack.push(JSON.parse(JSON.stringify(data.planificaciones)));
      if (undoStack.length > MAX_UNDO) undoStack.shift();
      redoStack = [];
    }
    function deshacer() {
      if (!undoStack.length) return toast('No hay acciones para deshacer','info');
      redoStack.push(JSON.parse(JSON.stringify(data.planificaciones)));
      data.planificaciones = undoStack.pop();
      guardar(); reconstruirIndices(); refrescarTodo(); toast('Deshecho','info');
    }
    function rehacer() {
      if (!redoStack.length) return toast('No hay acciones para rehacer','info');
      undoStack.push(JSON.parse(JSON.stringify(data.planificaciones)));
      data.planificaciones = redoStack.pop();
      guardar(); reconstruirIndices(); refrescarTodo(); toast('Rehecho','info');
    }
    const COLORES = ['#e3f2fd','#e8f5e9','#fffde7','#fce4ec','#f3e5f5','#fff3e0','#e0f2f1','#ede7f6','#fef0e6','#e1f5fe','#f9fbe7'];

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
        sistema:{nombre:'Sistema', valor:'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'},
        segoe:{nombre:'Segoe UI', valor:'"Segoe UI", system-ui, -apple-system, sans-serif'},
        inter:{nombre:'Inter', valor:'Inter, "Segoe UI", system-ui, -apple-system, sans-serif'},
        roboto:{nombre:'Roboto', valor:'Roboto, Arial, system-ui, sans-serif'},
        aptos:{nombre:'Aptos', valor:'Aptos, Calibri, "Segoe UI", system-ui, sans-serif'},
        georgia:{nombre:'Georgia', valor:'Georgia, "Times New Roman", serif'},
        mono:{nombre:'Mono técnica', valor:'"SFMono-Regular", Consolas, "Liberation Mono", monospace'}
    };
    const PALETAS = {
        Otoño:{ css:{bg:'#f7f5f2',surface:'#fffdfb','surface-alt':'#f3eee9',border:'#e2d8d0','border-light':'#f0e9e3',text:'#292521','text-secondary':'#69615a',accent:'#7f4328','accent-light':'#a97358',danger:'#9f3a34',warning:'#9d6f2d',success:'#54765d','modal-overlay':'rgba(32,27,23,0.34)'}, colores:['#eadbd2','#e4d2c7','#dec9bc','#d8c0b1','#d2b7a6','#ccae9b','#eee0d8','#e7d7ce','#e1cec3','#dbc5b8','#d5bcae'], espColor:{Electricidad:'#f3eee9',Automatización:'#eee6df',Electrónicos:'#e8ddd5',Transversales:'#e2d5cc'} },
        Invierno:{ css:{bg:'#f5f7f9',surface:'#fcfdfe','surface-alt':'#eef3f6',border:'#dbe4ea','border-light':'#e9eff3',text:'#24303a','text-secondary':'#65727c',accent:'#385f75','accent-light':'#7394a8',danger:'#9a424e',warning:'#8f7635',success:'#4f7967','modal-overlay':'rgba(18,30,40,0.34)'}, colores:['#dfe9ef','#d8e3ea','#d1dde5','#cad7e0','#c3d1db','#bccbd6','#e4edf2','#dde7ed','#d6e1e8','#cfdae3','#c8d4de'], espColor:{Electricidad:'#eef3f6',Automatización:'#e8eff4',Electrónicos:'#e1e9ef',Transversales:'#dae4eb'} },
        Primavera:{ css:{bg:'#f6f8f5',surface:'#fdfffc','surface-alt':'#edf3ea',border:'#dce7d7','border-light':'#eaf1e7',text:'#263226','text-secondary':'#657263',accent:'#466f4b','accent-light':'#7e9c7f',danger:'#98473d',warning:'#887831',success:'#3f7a50','modal-overlay':'rgba(22,36,22,0.32)'}, colores:['#dfeedd','#d8e8d4','#d1e2cb','#cadcc2','#c3d6ba','#bcd0b1','#e4f1e2','#ddebda','#d6e5d2','#cfdfca','#c8d9c2'], espColor:{Electricidad:'#edf3ea',Automatización:'#e7efe3',Electrónicos:'#e0e9dc',Transversales:'#d9e3d5'} },
        Verano:{ css:{bg:'#faf7ef',surface:'#fffef9','surface-alt':'#f3eddf',border:'#e3d9c5','border-light':'#f0e8d8',text:'#2b2a25','text-secondary':'#6c675b',accent:'#1f5f67','accent-light':'#6c969a',danger:'#9f4a37',warning:'#b78322',success:'#617f4a','modal-overlay':'rgba(24,42,44,0.32)'}, colores:['#efe6d0','#e8dec7','#e2d6be','#dccfb5','#d6c7ac','#d0bfa3','#f1e9d6','#ebe2cd','#e5dac4','#dfd3bb','#d9cbb2'], espColor:{Electricidad:'#f3eddf',Automatización:'#ede5d5',Electrónicos:'#e6ddcb',Transversales:'#dfd4c1'} }
    };
    function getColores() { return getPaletaActiva().colores; }
    function getEspColor() { return getPaletaActiva().espColor; }
    function getPaletaActiva() {
        const id=data.sel.temporadaId||data.configuracion.temporadaActualId||data.temporadas[0]?.id;
        const t=data.temporadas.find(tmp=>tmp.id===id);
        return PALETAS[t?.temporada]||PALETAS.Otoño;
    }
    function aplicarPaleta() {
        const paleta=getPaletaActiva();
        if(!paleta) return;
        const c=paleta.css;
        Object.keys(c).forEach(k=>document.documentElement.style.setProperty('--'+k,c[k]));
    }
    function aplicarFuente() {
        const id=data.configuracion?.fuenteApp || CONFIG_DEFAULT.fuenteApp;
        const fuente=FUENTES_APP[id] || FUENTES_APP[CONFIG_DEFAULT.fuenteApp] || FUENTES_APP.sistema;
        document.documentElement.style.setProperty('--font', fuente.valor);
    }
    const CONFIG_DEFAULT = {
        bloquesDiariosMax:13, bloquesSemestralesMax:47, horasDescanso:12, sabadoHastaBloque:16,
        horasPorBloque:18, autoguardadoIntervalo:30, confirmarEliminacion:true, sensibilidadArrastre:5,
        umbralCargaDocente:80, porcentajesHomologo:[{desde:0,hasta:200,porcentaje:50},{desde:201,hasta:500,porcentaje:30},{desde:501,hasta:9999,porcentaje:20}],
        exportacionExcel:'xlsx', fuenteApp:'segoe',
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
        solverPesos:{
            topesDuros:'muy-alto',
            bloquesFaltantes:'muy-alto',
            ventanasEstudiantes:'alto',
            ventanasDocentes:'medio',
            compactacionAsignatura:'alto',
            distribucionSemanal:'medio',
            salasCorrectas:'medio',
            excesoDiarioDocente:'alto',
            respetoJornada:'muy-alto',
            virtuales:'medio',
            transversalesHeredadas:'medio'
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
        asignaturaCarreraNivel:[], asignaturaSeccion:[], planificaciones:[], gruposDictacion:[], configuracion:JSON.parse(JSON.stringify(CONFIG_DEFAULT)),
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

    function guardarTemporadaPreferida(id) {
        if(!id) return;
        try { localStorage.setItem(PREF_TEMPORADA_ACTIVA, id); } catch(e) {}
    }

    function leerTemporadaPreferida() {
        try { return localStorage.getItem(PREF_TEMPORADA_ACTIVA) || ''; } catch(e) { return ''; }
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

    function setCambiosPendientes(pendiente) {
        hayGuardadoPendiente = !!pendiente;
    }

    function actualizarEstadoConexion(estado='online') {
        if(!navigator.onLine) {
            setSyncStatus('offline','Sin conexión');
            return;
        }
        if(estado === 'waiting') setSyncStatus('waiting','Conectando');
        else if(estado === 'saving') setSyncStatus('saving','Guardando');
        else if(estado === 'warning') setSyncStatus('warning','Sin sincronizar');
        else setSyncStatus('online','Conectado');
    }

    window.addEventListener('online',()=>actualizarEstadoConexion('online'));
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
        toast
    });
    function guardar(opciones={}) { return Sync.guardar(opciones); }
    function cargar() { return Sync.cargar(); }
    function recargarDesdeFirestore(silencioso=false) { return Sync.recargarDesdeFirestore(silencioso); }
    function hayConflictoRemoto() { return Sync.hayConflictoRemoto(); }

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
        DOCENTE_NN_ID,
        getPlanificaciones,
        getTemporadaLabel,
        createHeader,
        createTimeCell,
        generarMatriz,
        formatearHojaHorario,
        resolverFallbackExcel,
        descargarTablaExcel,
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
        irASeccion,
        activarTab,
        abrirModalSeccion: (...args) => abrirModalSeccion(...args),
        abrirModalAsignatura: (...args) => abrirModalAsignatura(...args),
        abrirModalDocente: (...args) => abrirModalDocente(...args),
        abrirModalSala: (...args) => abrirModalSala(...args),
        deshacerUltimaAuto,
        abrirReversionAutos,
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
        DOCENTE_NN_ID,
        getPlanificaciones,
        getTemporadaLabel,
        optionHTML,
        escapeHTML,
        colorSeguro,
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
        guardar,
        reconstruirIndices,
        refrescarTodo,
        cerrarModal,
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
        auditoria,
        guardar,
        reconstruirIndices,
        cerrarModal,
        irASeccion,
        activarTab,
        calcularValidacionPrevia,
        renderDashboard,
        detectarConflictos,
        actualizarReporte,
        actualizarVista,
        renderHistorial,
        optionHTML,
        escapeHTML,
        escapeAttr,
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

    const Configuracion = window.PlanificadorConfiguracion.create({
        getData: () => data,
        TEMPORADAS,
        FUENTES_APP,
        genId,
        optionHTML,
        escapeHTML,
        switchTemporada,
        aplicarPaleta,
        aplicarFuente,
        guardar,
        reconstruirIndices,
        refrescarTodo,
        cerrarModal,
        renderDashboard,
        detectarConflictos,
        escapeAttr,
        toast
    });
    const abrirConfiguracion = Configuracion.abrirConfiguracion;
    const actualizarSelectorTemporada = Configuracion.actualizarSelectorTemporada;
    const actualizarIndicadorPaleta = Configuracion.actualizarIndicadorPaleta;

    function switchTemporada(id) {
        if (!id || id === data.sel.temporadaId) return;
        undoStack=[]; redoStack=[];
        const tempData = data.temporadaData;
        tempData[data.sel.temporadaId] = { carreras:data.carreras, niveles:data.niveles, secciones:data.secciones, asignaturas:data.asignaturas, docentes:data.docentes, salas:data.salas, asignaturaCarreraNivel:data.asignaturaCarreraNivel, asignaturaSeccion:data.asignaturaSeccion||[], planificaciones:data.planificaciones, gruposDictacion:data.gruposDictacion, gestorSecciones:data.gestorSecciones };
        const nueva = tempData[id] || { carreras:[], niveles:[], secciones:[], asignaturas:[], docentes:[], salas:[], asignaturaCarreraNivel:[], asignaturaSeccion:[], planificaciones:[], gruposDictacion:[], gestorSecciones:{cargas:[],ids:[],ultimaCargaId:null} };
        if (!tempData[id]) tempData[id] = nueva;
        data.carreras = nueva.carreras; data.niveles = nueva.niveles; data.secciones = nueva.secciones;
        data.asignaturas = nueva.asignaturas; data.docentes = nueva.docentes; data.salas = nueva.salas;
        data.asignaturaCarreraNivel = nueva.asignaturaCarreraNivel; data.asignaturaSeccion = nueva.asignaturaSeccion || []; data.planificaciones = nueva.planificaciones; data.gruposDictacion = nueva.gruposDictacion || []; data.gestorSecciones = nueva.gestorSecciones || {cargas:[],ids:[],ultimaCargaId:null};
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
    function auditoria(accion, detalle={}) {
        if(!Array.isArray(data.auditoria)) data.auditoria=[];
        const usuario = window._fb?.auth?.currentUser?.email || window._usuarioActual || 'Sin usuario';
        const usuarioNombre = data.configuracion?.perfilesUsuarios?.[usuario]?.nombre || usuario;
        data.auditoria.push({
            id:genId(),
            ts:new Date().toISOString(),
            usuario,
            usuarioNombre,
            accion,
            detalle
        });
        if (data.auditoria.length > 1000) data.auditoria.splice(0, data.auditoria.length-1000);
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
            alumnosBase:Number(grupo.alumnosBase)||0,
            alumnosVinculados:Number(grupo.alumnosVinculados)||0,
            alumnosTotales:Number(grupo.alumnosTotales)||0,
            origen:['manual','gestor'].includes(grupo.origen)?grupo.origen:'manual',
            estado:['activo','pendiente','revisar'].includes(grupo.estado)?grupo.estado:'activo',
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
    function getGruposDictacionSeccion(seccionId){
        return getGruposDictacion().filter(g=>g.seccionMadreId===seccionId || g.seccionesVinculadasIds.includes(seccionId));
    }
    function getGrupoDictacionAsignaturaSeccion(asignaturaId,seccionId){
        return getGruposDictacion().find(g=>{
            const asignaturaCoincide=g.asignaturaId===asignaturaId || g.asignaturasEquivalentesIds.includes(asignaturaId);
            const seccionCoincide=g.seccionMadreId===seccionId || g.seccionesVinculadasIds.includes(seccionId);
            return asignaturaCoincide && seccionCoincide;
        })||null;
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
        data.gruposDictacion.push(grupo);
        auditoria('grupo_dictacion_creado',{grupoId:grupo.id, asignaturaId:grupo.asignaturaId, seccionMadreId:grupo.seccionMadreId, seccionesVinculadasIds:grupo.seccionesVinculadasIds});
        return grupo;
    }
    function vincularSeccionAGrupo(grupoId,seccionId, opciones={}){
        const grupo=getGrupoDictacion(grupoId);
        const id=limpiarTexto(seccionId);
        if(!grupo || !id || id===grupo.seccionMadreId) return false;
        if(!grupo.seccionesVinculadasIds.includes(id)) grupo.seccionesVinculadasIds.push(id);
        if(opciones.alumnos!==undefined){
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
            const seccionId=seccionPorNombre.get(normalizarEncabezadoGestor(f.seccion));
            if(!asignaturaId||!seccionId) return;
            const key=`${asignaturaId}|${seccionId}`;
            if(existentes.has(key)) return;
            data.asignaturaSeccion.push({asignaturaId,seccionId,origen:'gestor'});
            existentes.add(key);
        });
    }
    function normalizarDatos() {
        data.configuracion = Object.assign(JSON.parse(JSON.stringify(CONFIG_DEFAULT)), data.configuracion || {});
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
        data.configuracion.solverPesos = Object.assign({}, CONFIG_DEFAULT.solverPesos, data.configuracion.solverPesos || {});
        Object.keys(CONFIG_DEFAULT.solverPesos).forEach(k=>{
            if(!['desactivado','bajo','medio','alto','muy-alto'].includes(data.configuracion.solverPesos[k])) data.configuracion.solverPesos[k]=CONFIG_DEFAULT.solverPesos[k];
        });
        if(!['xlsx','html'].includes(data.configuracion.exportacionExcel)) data.configuracion.exportacionExcel='xlsx';
        if(!Array.isArray(data.gruposDictacion)) data.gruposDictacion=[];
        if(!Array.isArray(data.asignaturaSeccion)) data.asignaturaSeccion=[];
        data.sel=Object.assign({temporadaId:null,area:null,carreraId:null,nivelId:null,seccionId:null,asignaturaId:null,docenteId:null,salaId:null,tipo:'presencial'},data.sel||{});
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
        data.asignaturaSeccion=data.asignaturaSeccion
            .map(r=>({asignaturaId:limpiarTexto(r.asignaturaId),seccionId:limpiarTexto(r.seccionId),origen:limpiarTexto(r.origen,40)||'manual'}))
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
            setTimeout(()=>t.remove(),220);
        };
        cerrar.addEventListener('click',quitar);
        t.append(texto,cerrar);
        c.appendChild(t);
        setTimeout(quitar, tipo==='error' ? 5200 : 2600);
    }

    function refrescarTodo(){ construirGrilla(); actualizarSelectoresPlan(); actualizarModoPlanificacionUI(); renderCarreras(); renderAsignaturas(); renderDocentes(); renderSalas(); actualizarVista(); actualizarReporte(); actualizarProgresoPlan(); renderDashboard(); detectarConflictos(); renderHistorial(); actualizarFichaDocentes(); renderFichaDocente(); renderGestorSecciones(); }

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
        document.querySelector('#panelPlanificacion .selection-panel')?.classList.toggle('plan-mode-active',activo);
        document.getElementById('btnModoPlanificar').style.display=activo?'none':'inline-flex';
        ['btnAutoAsignatura','btnAutoSeccion','btnAutoGeneral','btnOptimizarHorario','btnRevertirAutoRapido','btnCancelarModo'].forEach(id=>{
            const el=document.getElementById(id);
            if(el) el.style.display=activo?'inline-flex':'none';
        });
        document.getElementById('scheduleContainer').classList.toggle('modo-activo',activo);
        if(!activo) document.getElementById('planProgreso').style.display='none';
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
        actualizarModoPlanificacionUI();
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
                document.getElementById('modalContainer').innerHTML='';
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

    function cerrarModal(){ document.getElementById('modalContainer').innerHTML=''; }

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
            color:colorSeguro(a.color, getColores()[0]), horasTotales:Number(a.horasTotales)||0,
            horasVirtuales:Number(a.horasVirtuales)||0, horasPresenciales:Number(a.horasPresenciales)||0,
            area:['especialidad','transversal','electiva'].includes(a.area)?a.area:'especialidad',
            modalidad:['lectiva','practica','semipresencial','online-teams'].includes(a.modalidad)?a.modalidad:'lectiva',
            condicion:['normal','alta-reprobacion','requiere-ayudantia','alta-reprobacion-ayudantia'].includes(a.condicion)?a.condicion:'normal',
            distribucion:['compacta','balanceada','dividida','flexible'].includes(a.distribucion)?a.distribucion:((['especialidad','transversal','electiva'].includes(a.area)?a.area:'especialidad')==='transversal'?'balanceada':'compacta'),
            controlHorario:['propio','coordinacion-externa'].includes(a.controlHorario)?a.controlHorario:((['especialidad','transversal','electiva'].includes(a.area)?a.area:'especialidad')==='transversal'?'coordinacion-externa':'propio'),
            preferenciaHoraria:['flexible','evitar-temprano','proteger-repitentes'].includes(a.preferenciaHoraria)?a.preferenciaHoraria:'flexible'
        })).filter(a=>a.codigo&&a.nombre);
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
            origen:limpiarTexto(r.origen,40)||'manual'
        })).filter(r=>r.asignaturaId&&r.seccionId) : [];
        limpio.planificaciones = limpio.planificaciones.map(p=>({
            id:limpiarTexto(p.id)||genId(), seccionId:limpiarTexto(p.seccionId), asignaturaId:limpiarTexto(p.asignaturaId),
            docenteId:limpiarTexto(p.docenteId), salaId:limpiarTexto(p.salaId), dia:Number(p.dia), bloque:Number(p.bloque),
            tipoPresencial:p.tipoPresencial!==false,
            fijo:!!p.fijo,
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
            asignaturaCarreraNivel:[], asignaturaSeccion:[], planificaciones:[], gruposDictacion:[], configuracion:JSON.parse(JSON.stringify(CONFIG_DEFAULT)),
            gestorSecciones:{cargas:[],ids:[],ultimaCargaId:null},
            modoPlan:false, temporadas:[], auditoria:[], temporadaData:{},
            sel:{temporadaId:null,area:null,carreraId:null,nivelId:null,seccionId:null,asignaturaId:null,docenteId:null,salaId:null,tipo:'presencial'}
        };
        Object.keys(data).forEach(k=>delete data[k]);
        Object.assign(data, base, imported);
        undoStack=[]; redoStack=[];
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
                planificaciones:data.planificaciones, gruposDictacion:data.gruposDictacion || [], gestorSecciones:data.gestorSecciones || {cargas:[],ids:[],ultimaCargaId:null}
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
        const disponible=!!respaldo;
        btn.disabled=!disponible;
        estado.textContent=disponible ? `Disponible: ${respaldo.fecha ? new Date(respaldo.fecha).toLocaleString() : 'fecha no disponible'}` : 'Sin respaldo disponible';
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
    function restaurarRespaldoLocal(){
        const respaldo=obtenerRespaldoLocal();
        if(!respaldo) {
            toast('No hay respaldo local disponible','info');
            return;
        }
        const filas=resumenImportacion(respaldo.datos).map(([k,v])=>`<tr><td style="padding:5px 8px;border:1px solid var(--border);">${escapeHTML(k)}</td><td style="padding:5px 8px;border:1px solid var(--border);text-align:right;font-weight:600;">${v}</td></tr>`).join('');
        const fecha=respaldo.fecha ? new Date(respaldo.fecha).toLocaleString() : 'Fecha no disponible';
        document.getElementById('modalContainer').innerHTML=`
        <div class="modal-overlay" id="modalOverlay"><div class="modal">
            <h3>Restaurar respaldo local</h3>
            <p style="font-size:0.85rem;color:var(--text-secondary);margin:0 0 10px;">Respaldo creado: <strong>${escapeHTML(fecha)}</strong></p>
            <table style="width:100%;border-collapse:collapse;font-size:0.82rem;margin-bottom:12px;">${filas}</table>
            <p style="font-size:0.8rem;color:var(--text-secondary);margin:0 0 12px;">Esto reemplazará los datos actuales por el último respaldo guardado antes de una importación.</p>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
                <button class="btn btn-sm" id="btnCancelarRestauracion">Cancelar</button>
                <button class="btn btn-primary btn-sm" id="btnConfirmarRestauracion">Restaurar</button>
            </div>
        </div></div>`;
        const cerrar=()=>cerrarModal();
        document.getElementById('btnCancelarRestauracion').onclick=cerrar;
        document.getElementById('modalOverlay').onclick=(e)=>{ if(e.target===e.currentTarget) cerrar(); };
        document.getElementById('btnConfirmarRestauracion').onclick=()=>{
            aplicarDatosImportados(respaldo.datos);
            asegurarEstructuraImportada();
            normalizarDatos();
            reconstruirIndices();
            guardar({forzar:true});
            actualizarSelectorTemporada();
            aplicarPaleta();
            aplicarFuente();
            actualizarIndicadorPaleta();
            refrescarTodo();
            cerrarModal();
            toast('Respaldo local restaurado','success');
            actualizarEstadoRespaldoLocal();
        };
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
                document.getElementById('modalContainer').innerHTML='';
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

    function normalizarEncabezadoGestor(valor){
        return String(valor||'')
            .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g,' ')
            .trim();
    }
    function textoGestor(valor){
        return String(valor??'').trim();
    }
    function numeroGestor(valor){
        if(typeof valor==='number') return valor;
        const n=Number(String(valor??'').replace(',','.').replace(/[^\d.-]/g,''));
        return Number.isFinite(n)?n:0;
    }
    function codigoCarreraGestor(programa){
        const txt=textoGestor(programa);
        const m=txt.match(/^\s*([A-Za-z0-9]+)\s*-/);
        return (m?.[1]||txt.split(/\s+/)[0]||'').toUpperCase();
    }
    function nombreCarreraGestor(programa){
        const txt=textoGestor(programa);
        const partes=txt.split(/\s+-\s+/);
        return (partes.length>1?partes.slice(1).join(' - '):txt).trim();
    }
    function planCarreraGestor(programaPlan,codigoBase=''){
        const txt=textoGestor(programaPlan).toUpperCase();
        return txt || textoGestor(codigoBase).toUpperCase();
    }
    function nombreCarreraConPlanGestor(nombre,plan){
        const base=textoGestor(nombre)||textoGestor(plan)||'Sin carrera';
        const p=textoGestor(plan);
        return p && !normalizarEncabezadoGestor(base).includes(normalizarEncabezadoGestor(p)) ? `${base} (${p})` : base;
    }
    function nivelGestor(valor){
        const txt=textoGestor(valor);
        const m=txt.match(/\d+/);
        return m?`N${m[0]}`:(txt||'Sin nivel');
    }
    function jornadaGestor(valor,nombre=''){
        const key=normalizarEncabezadoGestor(valor||nombre);
        const nom=String(nombre||'').trim().toUpperCase();
        if(key.includes('vesp')||key.includes('noche')||key.includes('noct')||nom.startsWith('V-')) return 'vespertina';
        return 'diurna';
    }
    function modalidadAsignaturaGestor(valor){
        const key=normalizarEncabezadoGestor(valor);
        if(key.includes('online')) return 'online-teams';
        if(key.includes('semi')) return 'semipresencial';
        if(key.includes('pract')) return 'practica';
        return 'lectiva';
    }
    function areaAsignaturaGestor(valor){
        const row=valor&&typeof valor==='object'?valor:null;
        const key=normalizarEncabezadoGestor(row?row.area:valor);
        const seccion=normalizarEncabezadoGestor(row?.seccion||'');
        const programaCarrera=normalizarEncabezadoGestor(row?.programaCarrera||'');
        const programaPlan=normalizarEncabezadoGestor(row?.programaPlan||'');
        const esProgramaElec=/^elec(\b|-)/.test(programaCarrera)||/^elec(\b|-)/.test(programaPlan);
        if(seccion==='elec'||seccion.startsWith('elec ')||seccion.startsWith('elec-')||esProgramaElec) return 'electiva';
        if(key.includes('transversal')) return 'transversal';
        return 'especialidad';
    }
    function especialidadGestor(valor){
        const txt=textoGestor(valor);
        if(!txt) return '';
        return txt.toLowerCase().replace(/\s+/g,' ').trim().split(' ').map((p,i)=>['de','del','la','las','los','y','e'].includes(p)&&i>0?p:p.charAt(0).toUpperCase()+p.slice(1)).join(' ');
    }
    function sincronizarEspecialidadesDesdeGestor(filas){
        const actuales=new Map((data.configuracion.especialidades||[]).map(e=>[normalizarEncabezadoGestor(e),e]));
        (filas||[]).forEach(r=>{
            const esp=especialidadGestor(r.area);
            if(!esp) return;
            const key=normalizarEncabezadoGestor(esp);
            if(!key || ['transversal','electiva','especialidad'].includes(key)) return;
            if(!actuales.has(key)){
                data.configuracion.especialidades.push(esp);
                actuales.set(key,esp);
            }
        });
    }
    function tipoEspacioDesdeTexto(valor){
        const key=normalizarEncabezadoGestor(valor);
        if(key.includes('comput')) return 'Laboratorio de Computación';
        if(key.includes('taller')) return 'Taller de Especialidad';
        if(key.includes('lab')||key.includes('laboratorio')) return 'Laboratorio de Especialidad';
        return 'Sala de Clases';
    }
    function parsearSalaReferenciaGestor(valor){
        const txt=textoGestor(valor);
        if(!txt) return null;
        const partes=txt.split(/\s*-\s*/).filter(Boolean);
        const nombre=(partes[0]||txt).trim().toUpperCase();
        const tipo=partes.length>1?tipoEspacioDesdeTexto(partes.slice(1).join(' - ')):tipoEspacioDesdeTexto(txt);
        return {nombre,tipo,referencia:txt};
    }
    function familiaProgramaGestor(programaCarrera,programaPlan=''){
        const txt=normalizarEncabezadoGestor([programaCarrera,programaPlan].filter(Boolean).join(' '));
        if(txt.includes('electric')) return 'electricidad';
        if(txt.includes('automat')||txt.includes('robot')) return 'automatizacion';
        if(txt.includes('electron')) return 'electronica';
        if(txt.includes('administr')||txt.includes('finanz')) return 'administracion';
        const codigo=codigoCarreraGestor(programaCarrera)||String(programaPlan||'').split('-')[0]||'';
        return codigo.toUpperCase()||'sin-familia';
    }
    function recalcularAreasAsignaturasDesdeGestor(){
        const gestor=normalizarGestorSeccionesData(data.gestorSecciones);
        const filas=Array.isArray(gestor.filas)?gestor.filas:[];
        if(!filas.length||!Array.isArray(data.asignaturas)||!data.asignaturas.length) return;
        const stats=new Map();
        filas.forEach(r=>{
            const codigo=textoGestor(r.codigoAsignatura).toUpperCase();
            if(!codigo) return;
            if(!stats.has(codigo)) stats.set(codigo,{familias:new Set(),electiva:false,transversalExplicita:false});
            const item=stats.get(codigo);
            item.familias.add(familiaProgramaGestor(r.programaCarrera,r.programaPlan));
            const area=areaAsignaturaGestor(r);
            if(area==='electiva') item.electiva=true;
            if(normalizarEncabezadoGestor(r.area).includes('transversal')) item.transversalExplicita=true;
        });
        data.asignaturas.forEach(a=>{
            const stat=stats.get(String(a.codigo||'').toUpperCase());
            if(!stat) return;
            const familias=[...stat.familias].filter(Boolean);
            const area=stat.electiva?'electiva':(stat.transversalExplicita||familias.length>1?'transversal':'especialidad');
            a.area=area;
            if(area==='transversal') a.controlHorario='coordinacion-externa';
            else if(a.controlHorario==='coordinacion-externa') a.controlHorario='propio';
        });
    }
    function esSeccionFusionLiteral(valor){
        const key=normalizarEncabezadoGestor(valor);
        return key==='fusion'||key==='fusionada'||key==='fusionado';
    }
    function esSeccionRealGestor(valor){
        return !!textoGestor(valor) && !esSeccionFusionLiteral(valor);
    }
    function seccionBaseSinMarcaGestor(valor){
        return textoGestor(valor).replace(/\s*\((E-F|F-E|E|F)\)\s*$/i,'').trim();
    }
    function tieneMarcaFusionGestor(valor){
        return /\((E-F|F-E|E|F)\)\s*$/i.test(textoGestor(valor));
    }
    function tipoFilaGestor(row){
        const tipo=normalizarEncabezadoGestor(row.tipo);
        if(tipo.includes('fusion') || esSeccionFusionLiteral(row.seccion)) return 'fusionada';
        if(tipo.includes('planificada')) return 'planificada';
        return 'por-revisar';
    }
    function normalizarGestorSeccionesData(valor){
        const base={cargas:[],ids:[],filas:[],enlacesManuales:[],ultimaCargaId:null,tablaLimite:250,filtroAplicacion:null};
        if(!valor||typeof valor!=='object'||Array.isArray(valor)) return base;
        const cargas=Array.isArray(valor.cargas)?valor.cargas.slice(-20).map(c=>({
            id:limpiarTexto(c.id)||genId(),
            archivo:limpiarTexto(c.archivo),
            fecha:limpiarTexto(c.fecha,80),
            resumen:c.resumen&&typeof c.resumen==='object'&&!Array.isArray(c.resumen)?c.resumen:{}
        })):[];
        const filas=Array.isArray(valor.filas)?valor.filas.slice(-15000).map(f=>({
            cargaId:limpiarTexto(f.cargaId),
            idSeccion:limpiarTexto(f.idSeccion,120),
            periodo:limpiarTexto(f.periodo,80),
            programaCarrera:limpiarTexto(f.programaCarrera),
            programaPlan:limpiarTexto(f.programaPlan,120),
            jornada:limpiarTexto(f.jornada,80),
            nivel:limpiarTexto(f.nivel,80),
            codigoAsignatura:limpiarTexto(f.codigoAsignatura,80),
            asignatura:limpiarTexto(f.asignatura),
            seccion:limpiarTexto(f.seccion,120),
            tipo:limpiarTexto(f.tipo,120),
            salaReferencia:limpiarTexto(f.salaReferencia,120),
            horas:Number(f.horas)||0,
            horasPresenciales:Number(f.horasPresenciales)||0,
            horasVirtuales:Number(f.horasVirtuales)||0,
            alumnos:Number(f.alumnos)||0,
            alumnosOtrosPlanes:Number(f.alumnosOtrosPlanes)||0,
            alumnosTotales:Number(f.alumnosTotales)||0,
            modalidadAsignatura:limpiarTexto(f.modalidadAsignatura,120),
            modalidadSeccion:limpiarTexto(f.modalidadSeccion,120),
            tipoAsignatura:limpiarTexto(f.tipoAsignatura,120),
            area:limpiarTexto(f.area,120)
        })).filter(f=>f.idSeccion||f.codigoAsignatura||f.seccion):[];
        const ids=Array.isArray(valor.ids)?valor.ids.slice(-10000).map(x=>({
            idSeccion:limpiarTexto(x.idSeccion,120),
            cargaId:limpiarTexto(x.cargaId),
            archivo:limpiarTexto(x.archivo),
            periodo:limpiarTexto(x.periodo,80),
            carrera:limpiarTexto(x.carrera),
            plan:limpiarTexto(x.plan,80),
            jornada:limpiarTexto(x.jornada,80),
            nivel:limpiarTexto(x.nivel,80),
            asignaturaCodigo:limpiarTexto(x.asignaturaCodigo,80),
            asignaturaNombre:limpiarTexto(x.asignaturaNombre),
            seccionesReales:Array.isArray(x.seccionesReales)?x.seccionesReales.map(s=>limpiarTexto(s,120)).filter(Boolean):[],
            filasFusionadas:Number(x.filasFusionadas)||0,
            filas:Number(x.filas)||0,
            estado:['resuelta','pendiente_externa','sin_id','requiere_revision'].includes(x.estado)?x.estado:'requiere_revision',
            madreDetectada:limpiarTexto(x.madreDetectada,120),
            motivo:limpiarTexto(x.motivo)
        })).filter(x=>x.idSeccion||x.asignaturaCodigo||x.asignaturaNombre):[];
        const enlacesManuales=Array.isArray(valor.enlacesManuales)?valor.enlacesManuales.slice(-3000).map(x=>({
            idSeccion:limpiarTexto(x.idSeccion,120),
            cargaId:limpiarTexto(x.cargaId),
            origenCargaId:limpiarTexto(x.origenCargaId),
            tipo:['interna','externa'].includes(x.tipo)?x.tipo:'externa',
            seccionId:limpiarTexto(x.seccionId,120),
            seccionNombre:limpiarTexto(x.seccionNombre,160),
            nota:limpiarTexto(x.nota,500),
            ts:limpiarTexto(x.ts,80)
        })).filter(x=>x.idSeccion):[];
        const filtroAplicacion=valor.filtroAplicacion&&typeof valor.filtroAplicacion==='object'&&!Array.isArray(valor.filtroAplicacion)?{
            cargaId:limpiarTexto(valor.filtroAplicacion.cargaId),
            carreras:Array.isArray(valor.filtroAplicacion.carreras)?valor.filtroAplicacion.carreras.map(x=>limpiarTexto(x,140)).filter(Boolean).slice(0,500):[],
            ts:limpiarTexto(valor.filtroAplicacion.ts,80)
        }:null;
        return {cargas,ids,filas,enlacesManuales,ultimaCargaId:limpiarTexto(valor.ultimaCargaId)||cargas[0]?.id||null,tablaLimite:Number(valor.tablaLimite)||250,filtroAplicacion};
    }
    function detectarColumnasGestor(headers){
        const vistos={};
        const cols={};
        headers.forEach((h,idx)=>{
            const key=normalizarEncabezadoGestor(h);
            if(!key) return;
            vistos[key]=(vistos[key]||0)+1;
            const occ=vistos[key];
            const set=(nombre)=>{ if(cols[nombre]===undefined) cols[nombre]=idx; };
            if(key==='periodo') set('periodo');
            else if(key==='sede') set('sede');
            else if(key==='institucion') set('institucion');
            else if(key==='programa'&&occ===1) set('programaCarrera');
            else if((key==='programa'&&occ===2)||key==='plan'||key==='plan de estudios') set('programaPlan');
            else if(key==='jornada') set('jornada');
            else if(key==='nivel') set('nivel');
            else if(key==='codigo de la asignatura'||key==='codigo asignatura'||key==='cod asignatura') set('codigoAsignatura');
            else if(key==='asignatura') set('asignatura');
            else if(key==='id seccion'||key==='id seccion ') set('idSeccion');
            else if(key==='seccion') set('seccion');
            else if(key==='alumnos') set('alumnos');
            else if(key==='alumnos otros planes') set('alumnosOtrosPlanes');
            else if(key==='alumnos totales') set('alumnosTotales');
            else if(key==='tipo') set('tipo');
            else if(key==='sala referencia') set('salaReferencia');
            else if(key==='horas') set('horas');
            else if(key==='horas presenciales') set('horasPresenciales');
            else if(key==='horas virutales'||key==='horas virtuales') set('horasVirtuales');
            else if(key==='tipo asgnatura'||key==='tipo asignatura') set('tipoAsignatura');
            else if(key==='area') set('area');
            else if(key==='modalidad asignatura') set('modalidadAsignatura');
            else if(key==='modalidad seccion') set('modalidadSeccion');
        });
        return cols;
    }
    function leerFilaGestor(row,cols){
        const get=(k)=>cols[k]===undefined?'':textoGestor(row[cols[k]]);
        const num=(k)=>cols[k]===undefined?0:numeroGestor(row[cols[k]]);
        return {
            periodo:get('periodo'),
            sede:get('sede'),
            institucion:get('institucion'),
            programaCarrera:get('programaCarrera'),
            programaPlan:get('programaPlan'),
            jornada:get('jornada'),
            nivel:get('nivel'),
            codigoAsignatura:get('codigoAsignatura'),
            asignatura:get('asignatura'),
            idSeccion:get('idSeccion'),
            seccion:get('seccion'),
            alumnos:num('alumnos'),
            alumnosOtrosPlanes:num('alumnosOtrosPlanes'),
            alumnosTotales:num('alumnosTotales'),
            tipo:get('tipo'),
            salaReferencia:get('salaReferencia'),
            horas:num('horas'),
            horasPresenciales:num('horasPresenciales'),
            horasVirtuales:num('horasVirtuales'),
            tipoAsignatura:get('tipoAsignatura'),
            area:get('area'),
            modalidadAsignatura:get('modalidadAsignatura'),
            modalidadSeccion:get('modalidadSeccion')
        };
    }
    function descriptorCarreraRegistroGestor(r){
        const codigoCarrera=codigoCarreraGestor(r.programaCarrera);
        const nombreCarrera=nombreCarreraGestor(r.programaCarrera)||codigoCarrera||'Sin carrera';
        const plan=planCarreraGestor(r.programaPlan,codigoCarrera);
        const carreraKey=plan||codigoCarrera||nombreCarrera;
        const codigoCarreraPlan=plan||codigoCarrera;
        const nombreCarreraPlan=nombreCarreraConPlanGestor(nombreCarrera,plan);
        const area=especialidadGestor(r.area)||'Sin area';
        return {area,carreraKey,codigo:codigoCarreraPlan,nombre:nombreCarreraPlan,plan,codigoBase:codigoCarrera};
    }
    function opcionesFiltroGestor(registros){
        const areas=new Map();
        (registros||[]).forEach(r=>{
            const d=descriptorCarreraRegistroGestor(r);
            if(!areas.has(d.area)) areas.set(d.area,{area:d.area,filas:0,carreras:new Map()});
            const area=areas.get(d.area);
            area.filas++;
            if(!area.carreras.has(d.carreraKey)){
                area.carreras.set(d.carreraKey,{carreraKey:d.carreraKey,codigo:d.codigo,nombre:d.nombre,plan:d.plan,filas:0,secciones:new Set(),asignaturas:new Set()});
            }
            const carrera=area.carreras.get(d.carreraKey);
            carrera.filas++;
            if(r.seccion) carrera.secciones.add(r.seccion);
            if(r.codigoAsignatura) carrera.asignaturas.add(String(r.codigoAsignatura).toUpperCase());
        });
        return Array.from(areas.values()).map(a=>({
            area:a.area,
            filas:a.filas,
            carreras:Array.from(a.carreras.values())
                .map(c=>Object.assign({},c,{secciones:c.secciones.size,asignaturas:c.asignaturas.size}))
                .sort((x,y)=>String(x.nombre||x.codigo).localeCompare(String(y.nombre||y.codigo),'es',{numeric:true,sensitivity:'base'}))
        })).sort((a,b)=>String(a.area).localeCompare(String(b.area),'es',{numeric:true,sensitivity:'base'}));
    }
    function filtrarRegistrosGestor(registros,filtro){
        const carreras=new Set((filtro?.carreras||[]).map(x=>String(x||'').toUpperCase()));
        if(!carreras.size) return [];
        return (registros||[]).filter(r=>carreras.has(String(descriptorCarreraRegistroGestor(r).carreraKey||'').toUpperCase()));
    }
    function prepararRegistrosAplicacionGestor(registros,filtro){
        const carreras=new Set((filtro?.carreras||[]).map(x=>String(x||'').toUpperCase()));
        const seleccionados=(registros||[]).filter(r=>carreras.has(String(descriptorCarreraRegistroGestor(r).carreraKey||'').toUpperCase()));
        const idsSeleccionados=new Set(seleccionados.map(r=>textoGestor(r.idSeccion)).filter(Boolean));
        const memoria=(registros||[]).filter(r=>{
            const carreraKey=String(descriptorCarreraRegistroGestor(r).carreraKey||'').toUpperCase();
            const id=textoGestor(r.idSeccion);
            return carreras.has(carreraKey)||(id&&idsSeleccionados.has(id));
        });
        return {seleccionados,memoria,externos:memoria.length-seleccionados.length};
    }
    function filtroCompletoGestor(registros){
        return {carreras:opcionesFiltroGestor(registros).flatMap(a=>a.carreras.map(c=>c.carreraKey))};
    }
    function analizarGestorSecciones(aoa){
        const filas=(aoa||[]).filter(r=>Array.isArray(r)&&r.some(c=>textoGestor(c)));
        if(!filas.length) throw new Error('Archivo vacío');
        let headerIndex=0, bestScore=-1;
        const claves=['periodo','sede','programa','jornada','nivel','codigo de la asignatura','asignatura','id seccion','seccion','alumnos','horas','modalidad asignatura'];
        filas.slice(0,40).forEach((row,idx)=>{
            const normalizados=row.map(normalizarEncabezadoGestor);
            const score=claves.filter(k=>normalizados.includes(k)).length;
            if(score>bestScore){ bestScore=score; headerIndex=idx; }
        });
        const headers=filas[headerIndex].map(textoGestor);
        const cols=detectarColumnasGestor(headers);
        const requeridas=['periodo','programaCarrera','jornada','nivel','codigoAsignatura','asignatura','idSeccion','seccion','horas','horasPresenciales','horasVirtuales','tipo','modalidadAsignatura'];
        const faltantes=requeridas.filter(k=>cols[k]===undefined);
        const registros=filas.slice(headerIndex+1).map(r=>leerFilaGestor(r,cols)).filter(r=>r.codigoAsignatura||r.asignatura||r.seccion);
        const unicos=(campo)=>new Set(registros.map(r=>r[campo]).filter(Boolean)).size;
        const tipoNorm=(r)=>normalizarEncabezadoGestor(r.tipo);
        const modalidadNorm=(r)=>normalizarEncabezadoGestor(r.modalidadAsignatura);
        const fusionadas=registros.filter(r=>tipoNorm(r).includes('fusion')||/\((E|F|E-F|F-E)\)/i.test(r.seccion));
        const planificadas=registros.filter(r=>tipoNorm(r).includes('planificada'));
        const online=registros.filter(r=>modalidadNorm(r).includes('online'));
        const semipresencial=registros.filter(r=>modalidadNorm(r).includes('semipresencial'));
        const conVirtuales=registros.filter(r=>r.horasVirtuales>0);
        const seccionesPorId=registros.reduce((acc,r)=>{
            const key=r.idSeccion||r.seccion||'Sin ID';
            if(!acc[key]) acc[key]=new Set();
            if(r.seccion) acc[key].add(r.seccion);
            return acc;
        },{});
        const idsMultiples=Object.entries(seccionesPorId).filter(([,set])=>set.size>1).length;
        const advertencias=[];
        if(faltantes.length) advertencias.push(`Faltan columnas obligatorias: ${faltantes.join(', ')}`);
        if(!registros.length) advertencias.push('No se detectaron filas de asignaturas después del encabezado.');
        if(idsMultiples) advertencias.push(`${idsMultiples} ID de sección aparecen asociados a más de un nombre de sección.`);
        if(fusionadas.length) advertencias.push(`${fusionadas.length} fila(s) parecen fusionadas o equivalentes; se revisarán antes de crear grupos de dictación.`);
        if(conVirtuales.length) advertencias.push(`${conVirtuales.length} fila(s) tienen horas virtuales de autoaprendizaje.`);
        const propuesta=normalizarPropuestaGestor(registros);
        return {
            headerIndex,
            headers,
            cols,
            faltantes,
            registros,
            propuesta,
            resumen:{
                filas:registros.length,
                carreras:unicos('programaCarrera'),
                planes:unicos('programaPlan'),
                secciones:unicos('seccion'),
                idSecciones:unicos('idSeccion'),
                asignaturas:unicos('codigoAsignatura'),
                planificadas:planificadas.length,
                fusionadas:fusionadas.length,
                online:online.length,
                semipresencial:semipresencial.length,
                conVirtuales:conVirtuales.length
            },
            advertencias
        };
    }
    function normalizarPropuestaGestor(registros,opciones={}){
        const permitirMadreInferida=opciones.permitirMadreInferida!==false;
        const carreras=new Map();
        const niveles=new Map();
        const secciones=new Map();
        const asignaturas=new Map();
        const relaciones=new Map();
        const seccionAsignaturas=new Map();
        const gruposCandidatos=new Map();
        const fusionLiteralRows=[];
        const familiasPorAsignatura=new Map();
        const carreraExistentePorCodigo=new Map(data.carreras.map(c=>[String(c.codigo||'').toUpperCase(),c.id]));
        const existentes={
            carreras:new Set(data.carreras.map(c=>String(c.codigo||'').toUpperCase())),
            niveles:new Set(data.niveles.map(n=>`${n.carreraId}|${normalizarEncabezadoGestor(n.nombre)}`)),
            secciones:new Set(data.secciones.map(s=>normalizarEncabezadoGestor(s.nombre))),
            asignaturas:new Set(data.asignaturas.map(a=>String(a.codigo||'').toUpperCase()))
        };
        registros.forEach(r=>{
            const codigoCarrera=codigoCarreraGestor(r.programaCarrera);
            const nombreCarrera=nombreCarreraGestor(r.programaCarrera)||codigoCarrera||'Sin carrera';
            const plan=planCarreraGestor(r.programaPlan,codigoCarrera);
            const carreraKey=plan||codigoCarrera||nombreCarrera;
            const codigoCarreraPlan=plan||codigoCarrera;
            const nombreCarreraPlan=nombreCarreraConPlanGestor(nombreCarrera,plan);
            const areaCarreraPlan=especialidadGestor(r.area);
            if(carreraKey&&!carreras.has(carreraKey)){
                carreras.set(carreraKey,{codigo:codigoCarreraPlan,nombre:nombreCarreraPlan,plan,codigoBase:codigoCarrera,area:areaCarreraPlan,existe:existentes.carreras.has(codigoCarreraPlan)});
            }
            const nivelNombre=nivelGestor(r.nivel);
            const nivelKey=`${carreraKey}|${nivelNombre}`;
            const carreraExistenteId=carreraExistentePorCodigo.get(codigoCarreraPlan)||'';
            const nivelExiste=!!(carreraExistenteId&&existentes.niveles.has(`${carreraExistenteId}|${normalizarEncabezadoGestor(nivelNombre)}`));
            if(carreraKey&&!niveles.has(nivelKey)){
                niveles.set(nivelKey,{carreraKey,nombre:nivelNombre,tieneOnline:false,existe:nivelExiste});
            }
            const nivel=niveles.get(nivelKey);
            if(nivel && modalidadAsignaturaGestor(r.modalidadAsignatura)==='online-teams') nivel.tieneOnline=true;
            const seccionNombre=textoGestor(r.seccion);
            if(seccionNombre&&!secciones.has(seccionNombre)){
                if(esSeccionRealGestor(seccionNombre)){
                    secciones.set(seccionNombre,{
                        nombre:seccionNombre,
                        idGestor:r.idSeccion,
                        carreraKey,
                        nivelKey,
                        jornada:r.jornada,
                        alumnos:Number(r.alumnosTotales)||Number(r.alumnos)||0,
                        tipoDetectado:tipoFilaGestor(r),
                        existe:existentes.secciones.has(normalizarEncabezadoGestor(seccionNombre))
                    });
                }
            }
            const codigoAsig=textoGestor(r.codigoAsignatura).toUpperCase();
            if(codigoAsig){
                if(!familiasPorAsignatura.has(codigoAsig)) familiasPorAsignatura.set(codigoAsig,new Set());
                familiasPorAsignatura.get(codigoAsig).add(familiaProgramaGestor(r.programaCarrera,r.programaPlan));
            }
            if(codigoAsig&&!asignaturas.has(codigoAsig)){
                const salaInfo=parsearSalaReferenciaGestor(r.salaReferencia);
                asignaturas.set(codigoAsig,{
                    codigo:codigoAsig,
                    nombre:textoGestor(r.asignatura)||codigoAsig,
                    horasTotales:Number(r.horas)||((Number(r.horasPresenciales)||0)+(Number(r.horasVirtuales)||0)),
                    horasPresenciales:Number(r.horasPresenciales)||0,
                    horasVirtuales:Number(r.horasVirtuales)||0,
                    bloquesPresenciales:Math.round((Number(r.horasPresenciales)||0)/18),
                    bloquesVirtuales:Math.round((Number(r.horasVirtuales)||0)/18),
                    modalidad:modalidadAsignaturaGestor(r.modalidadAsignatura||r.tipoAsignatura),
                    area:areaAsignaturaGestor(r),
                    salaReferencia:r.salaReferencia,
                    salaPreferidaNombre:salaInfo?.nombre||'',
                    tipoEspacioSugerido:salaInfo?.tipo||'',
                    especialidadGestor:especialidadGestor(r.area),
                    existe:existentes.asignaturas.has(codigoAsig)
                });
            }
            if(codigoAsig&&nivelKey) relaciones.set(`${codigoAsig}|${carreraKey}|${nivelKey}`,{codigoAsignatura:codigoAsig,carreraKey,nivelKey});
            if(codigoAsig&&seccionNombre&&esSeccionRealGestor(seccionNombre)){
                seccionAsignaturas.set(`${codigoAsig}|${seccionNombre}`,{
                    codigoAsignatura:codigoAsig,
                    seccion:seccionNombre,
                    tipo:tipoFilaGestor(r),
                    idGestor:r.idSeccion
                });
            }else if(codigoAsig&&seccionNombre&&esSeccionFusionLiteral(seccionNombre)){
                fusionLiteralRows.push({
                    codigoAsignatura:codigoAsig,
                    carreraKey,
                    nivelKey,
                    jornada:r.jornada,
                    idGestor:r.idSeccion,
                    tipo:tipoFilaGestor(r)
                });
            }
            const idGrupo=r.idSeccion||`${codigoAsig}|${nivelKey}`;
            if(codigoAsig&&idGrupo){
                if(!gruposCandidatos.has(idGrupo)) gruposCandidatos.set(idGrupo,{idGestorSeccion:idGrupo,codigoAsignatura:codigoAsig,planificada:null,fusionadas:[],alumnosTotales:0,tipos:new Set()});
                const g=gruposCandidatos.get(idGrupo);
                g.alumnosTotales=Math.max(g.alumnosTotales,Number(r.alumnosTotales)||0);
                g.tipos.add(tipoFilaGestor(r));
                const item={seccion:seccionNombre,carreraKey,nivelKey,tipo:tipoFilaGestor(r),alumnos:Number(r.alumnosTotales)||Number(r.alumnos)||0};
                if(item.tipo==='planificada'&&esSeccionRealGestor(item.seccion)&&!g.planificada) g.planificada=item;
                else if(item.tipo==='fusionada'&&esSeccionRealGestor(item.seccion)) g.fusionadas.push(item);
            }
        });
        asignaturas.forEach(a=>{
            if(a.area==='electiva') return;
            const familias=[...(familiasPorAsignatura.get(a.codigo)||[])].filter(Boolean);
            if(familias.length>1){
                a.area='transversal';
                a.controlHorarioSugerido='coordinacion-externa';
            }
        });
        const ordenarSeccionesGestor=(a,b)=>{
            const ax=seccionBaseSinMarcaGestor(a.nombre||a.seccion||'');
            const bx=seccionBaseSinMarcaGestor(b.nombre||b.seccion||'');
            const an=Number((ax.match(/C(\d+)/i)||[])[1]);
            const bn=Number((bx.match(/C(\d+)/i)||[])[1]);
            if(Number.isFinite(an)&&Number.isFinite(bn)&&an!==bn) return an-bn;
            return ax.localeCompare(bx,undefined,{numeric:true,sensitivity:'base'});
        };
        const contextoFusion=(item)=>[
            String(item.carreraKey||'').toUpperCase(),
            normalizarEncabezadoGestor(item.nivelKey),
            normalizarEncabezadoGestor(item.jornada)
        ].join('|');
        const candidatosPorContexto=new Map();
        Array.from(secciones.values()).forEach(s=>{
            const key=contextoFusion(s);
            if(!candidatosPorContexto.has(key)) candidatosPorContexto.set(key,[]);
            candidatosPorContexto.get(key).push(s);
        });
        candidatosPorContexto.forEach(lista=>lista.sort(ordenarSeccionesGestor));
        const asignadasPorCodigo=new Map();
        seccionAsignaturas.forEach(rel=>{
            const codigo=String(rel.codigoAsignatura||'').toUpperCase();
            if(!asignadasPorCodigo.has(codigo)) asignadasPorCodigo.set(codigo,new Set());
            asignadasPorCodigo.get(codigo).add(normalizarEncabezadoGestor(rel.seccion));
        });
        fusionLiteralRows.forEach(row=>{
            const codigo=String(row.codigoAsignatura||'').toUpperCase();
            const ocupadas=asignadasPorCodigo.get(codigo)||new Set();
            const candidatos=candidatosPorContexto.get(contextoFusion(row))||[];
            const grupo=row.idGestor?gruposCandidatos.get(row.idGestor):null;
            const madre=grupo?.planificada?.seccion||'';
            if(!madre) return;
            const destino=candidatos.find(s=>
                normalizarEncabezadoGestor(s.nombre)!==normalizarEncabezadoGestor(madre) &&
                !ocupadas.has(normalizarEncabezadoGestor(s.nombre))
            );
            if(!destino) return;
            seccionAsignaturas.set(`${codigo}|${destino.nombre}`,{
                codigoAsignatura:codigo,
                seccion:destino.nombre,
                tipo:'fusionada',
                idGestor:row.idGestor,
                origen:'gestor-inferido-heredada'
            });
            grupo.fusionadas.push({
                seccion:destino.nombre,
                carreraKey:destino.carreraKey,
                nivelKey:destino.nivelKey,
                tipo:'fusionada',
                alumnos:Number(destino.alumnos)||0,
                inferida:true
            });
            ocupadas.add(normalizarEncabezadoGestor(destino.nombre));
            asignadasPorCodigo.set(codigo,ocupadas);
        });
        const idsConMadreDetectada=new Set();
        gruposCandidatos.forEach((g,id)=>{ if(g.planificada) idsConMadreDetectada.add(id); });
        const grupos=Array.from(gruposCandidatos.values()).map(g=>{
            if(permitirMadreInferida&&!g.planificada&&g.fusionadas.length) g.planificada=g.fusionadas[0];
            return Object.assign(g,{tipos:Array.from(g.tipos),fusionadas:[...new Map(g.fusionadas.map(f=>[f.seccion,f])).values()]});
        }).filter(g=>g.planificada&&g.fusionadas.length);
        const seccionAsignaturasNormalizadas=Array.from(seccionAsignaturas.values()).filter(rel=>{
            if(permitirMadreInferida) return true;
            if(rel.tipo!=='fusionada') return true;
            return rel.idGestor&&idsConMadreDetectada.has(rel.idGestor);
        });
        return {
            carreras:Array.from(carreras.values()),
            niveles:Array.from(niveles.values()),
            secciones:Array.from(secciones.values()),
            asignaturas:Array.from(asignaturas.values()),
            relaciones:Array.from(relaciones.values()),
            seccionAsignaturas:seccionAsignaturasNormalizadas,
            grupos
        };
    }
    function validarPropuestaGestor(propuesta){
        const issues=[];
        const add=(sev,titulo,detalle)=>issues.push({sev,titulo,detalle});
        const carreraPorCodigo=new Map(data.carreras.map(c=>[String(c.codigo||'').toUpperCase(),c]));
        const asignaturaPorCodigo=new Map(data.asignaturas.map(a=>[String(a.codigo||'').toUpperCase(),a]));
        const seccionPorNombre=new Map(data.secciones.map(s=>[normalizarEncabezadoGestor(s.nombre),s]));
        const nivelPorId=new Map(data.niveles.map(n=>[n.id,n]));
        const carreraPorId=new Map(data.carreras.map(c=>[c.id,c]));
        const conteo={
            crearCarreras:0, revisarCarreras:0,
            crearNiveles:0, revisarNiveles:0,
            crearSecciones:0, revisarSecciones:0,
            crearAsignaturas:0, revisarAsignaturas:0,
            crearRelaciones:0, crearRelacionesSeccion:0, crearGrupos:0,
            criticos:0, advertencias:0, info:0
        };
        const codigosPropuestos=new Set((propuesta.asignaturas||[]).map(a=>String(a.codigo||'').toUpperCase()));
        const seccionesPropuestas=new Set((propuesta.secciones||[]).map(s=>normalizarEncabezadoGestor(s.nombre)));
        propuesta.carreras.forEach(c=>{
            const actual=carreraPorCodigo.get(String(c.codigo||'').toUpperCase());
            if(!actual) conteo.crearCarreras++;
            else if(normalizarEncabezadoGestor(actual.nombre)!==normalizarEncabezadoGestor(c.nombre)){
                conteo.revisarCarreras++;
                add('info','Carrera existente con nombre diferente',`${c.codigo}: app "${actual.nombre||''}" / gestor "${c.nombre||''}".`);
            }
        });
        propuesta.niveles.forEach(n=>{
            if(!n.existe) conteo.crearNiveles++;
        });
        propuesta.secciones.forEach(s=>{
            const actual=seccionPorNombre.get(normalizarEncabezadoGestor(s.nombre));
            if(!actual){ conteo.crearSecciones++; return; }
            const nivelActual=nivelPorId.get(actual.nivelId);
            const carreraActual=carreraPorId.get(nivelActual?.carreraId);
            const carreraOk=String(carreraActual?.codigo||'').toUpperCase()===String(s.carreraKey||'').toUpperCase();
            const nivelOk=normalizarEncabezadoGestor(nivelActual?.nombre)===normalizarEncabezadoGestor((s.nivelKey||'').split('|')[1]);
            if(!carreraOk || !nivelOk){
                conteo.revisarSecciones++;
                add('advertencia','Sección existente en otra ubicación',`${s.nombre}: en la app está en ${carreraActual?.codigo||'sin carrera'} · ${nivelActual?.nombre||'sin nivel'}, pero el gestor la propone en ${s.carreraKey} · ${(s.nivelKey||'').split('|')[1]||''}.`);
            }
        });
        const propuestasPorNombre=new Set(propuesta.secciones.map(s=>normalizarEncabezadoGestor(s.nombre)));
        propuesta.secciones.filter(s=>tieneMarcaFusionGestor(s.nombre)).forEach(s=>{
            const base=seccionBaseSinMarcaGestor(s.nombre);
            if(!base) return;
            const baseActual=seccionPorNombre.get(normalizarEncabezadoGestor(base));
            if(baseActual && !propuestasPorNombre.has(normalizarEncabezadoGestor(base))){
                const nivelActual=nivelPorId.get(baseActual.nivelId);
                const carreraActual=carreraPorId.get(nivelActual?.carreraId);
                add('advertencia','Sección base existente no viene en Gestor',`${base}: existe en la app, pero el Gestor propone ${s.nombre}. No se usará como reemplazo automático; revísala si aparece en el planificador.`);
                if(carreraActual||nivelActual) conteo.revisarSecciones++;
            }
        });
        propuesta.asignaturas.forEach(a=>{
            const actual=asignaturaPorCodigo.get(String(a.codigo||'').toUpperCase());
            if((Number(a.horasTotales)||0)<=0){
                add('critico','Asignatura sin horas',`${a.codigo}: no tiene horas totales válidas.`);
            }
            if(!actual){ conteo.crearAsignaturas++; return; }
            const diffs=[];
            if(normalizarEncabezadoGestor(actual.nombre)!==normalizarEncabezadoGestor(a.nombre)) diffs.push(`nombre app "${actual.nombre||''}" / gestor "${a.nombre||''}"`);
            if(Number(actual.horasTotales)!==Number(a.horasTotales)) diffs.push(`horas ${actual.horasTotales||0}/${a.horasTotales||0}`);
            if(Number(actual.horasVirtuales)!==Number(a.horasVirtuales)) diffs.push(`virtuales ${actual.horasVirtuales||0}/${a.horasVirtuales||0}`);
            if(diffs.length){
                conteo.revisarAsignaturas++;
                add('advertencia','Asignatura existente con diferencias',`${a.codigo}: ${diffs.join('; ')}.`);
            }
        });
        propuesta.relaciones.forEach(rel=>{
            const asig=asignaturaPorCodigo.get(String(rel.codigoAsignatura||'').toUpperCase());
            const carrera=carreraPorCodigo.get(String(rel.carreraKey||'').toUpperCase());
            const nivelNombre=(rel.nivelKey||'').split('|')[1]||'';
            const nivel=carrera?data.niveles.find(n=>n.carreraId===carrera.id&&normalizarEncabezadoGestor(n.nombre)===normalizarEncabezadoGestor(nivelNombre)):null;
            const existe=asig&&carrera&&nivel&&data.asignaturaCarreraNivel.some(r=>r.asignaturaId===asig.id&&r.carreraId===carrera.id&&r.nivelId===nivel.id);
            if(!existe) conteo.crearRelaciones++;
        });
        (propuesta.seccionAsignaturas||[]).forEach(rel=>{
            const codigo=String(rel.codigoAsignatura||'').toUpperCase();
            const seccionKey=normalizarEncabezadoGestor(rel.seccion);
            const asig=asignaturaPorCodigo.get(codigo);
            const sec=seccionPorNombre.get(seccionKey);
            const asigDisponible=!!asig||codigosPropuestos.has(codigo);
            const secDisponible=!!sec||seccionesPropuestas.has(seccionKey);
            if(!asigDisponible){
                add('critico','Relación sección/asignatura sin asignatura',`${rel.codigoAsignatura} · ${rel.seccion}: la asignatura no existe ni viene propuesta.`);
                return;
            }
            if(!secDisponible){
                add('critico','Relación sección/asignatura sin sección',`${rel.codigoAsignatura} · ${rel.seccion}: la sección no existe ni viene propuesta.`);
                return;
            }
            const existe=asig&&sec&&(data.asignaturaSeccion||[]).some(r=>r.asignaturaId===asig.id&&r.seccionId===sec.id);
            if(!existe) conteo.crearRelacionesSeccion++;
        });
        propuesta.grupos.forEach(g=>{
            conteo.crearGrupos++;
            if(!g.planificada?.seccion){
                add('critico','Grupo sin sección madre tentativa',`${g.codigoAsignatura}: no se pudo detectar dónde se dicta.`);
            }
            if(!g.fusionadas.length){
                add('advertencia','Grupo sin secciones heredadas',`${g.codigoAsignatura}: no hay secciones vinculadas detectadas.`);
            }
            if(g.fusionadas.some(f=>f.seccion===g.planificada?.seccion)){
                add('critico','Grupo circular',`${g.codigoAsignatura}: la sección madre también aparece como heredada.`);
            }
        });
        if(!propuesta.asignaturas.length) add('critico','Sin asignaturas propuestas','No se detectaron asignaturas normalizables desde el gestor.');
        if(!propuesta.secciones.length) add('critico','Sin secciones propuestas','No se detectaron secciones normalizables desde el gestor.');
        conteo.criticos=issues.filter(i=>i.sev==='critico').length;
        conteo.advertencias=issues.filter(i=>i.sev==='advertencia').length;
        conteo.info=issues.filter(i=>i.sev==='info').length;
        return {issues,conteo};
    }
    function construirMemoriaIdsGestor(analisis,nombreArchivo,opciones={}){
        const cargaId=genId();
        const grupos=new Map();
        const carrerasSeleccionadas=new Set((opciones.carrerasSeleccionadas||[]).map(x=>String(x||'').toUpperCase()));
        const usaFiltroCarreras=carrerasSeleccionadas.size>0;
        (analisis.registros||[]).forEach(r=>{
            const id=textoGestor(r.idSeccion)||`SIN_ID|${textoGestor(r.codigoAsignatura)}|${textoGestor(r.seccion)}|${textoGestor(r.nivel)}`;
            if(!grupos.has(id)){
                grupos.set(id,{
                    idSeccion:textoGestor(r.idSeccion),
                    cargaId,
                    archivo:nombreArchivo,
                    periodo:r.periodo,
                    carrera:r.programaCarrera,
                    plan:planCarreraGestor(r.programaPlan,codigoCarreraGestor(r.programaCarrera)),
                    jornada:r.jornada,
                    nivel:nivelGestor(r.nivel),
                    asignaturaCodigo:textoGestor(r.codigoAsignatura).toUpperCase(),
                    asignaturaNombre:r.asignatura,
                    seccionesReales:[],
                    filasFusionadas:0,
                    filas:0,
                    seccionesRealesSeleccionadas:[],
                    seccionesRealesExternas:[],
                    madresSeleccionadas:[],
                    madresExternas:[],
                    contextosRelacionados:[],
                    estado:'requiere_revision',
                    madreDetectada:'',
                    motivo:''
                });
            }
            const g=grupos.get(id);
            const carreraKey=String(descriptorCarreraRegistroGestor(r).carreraKey||'').toUpperCase();
            const seleccionada=!usaFiltroCarreras||carrerasSeleccionadas.has(carreraKey);
            g.filas++;
            if(esSeccionFusionLiteral(r.seccion)||tipoFilaGestor(r)==='fusionada') g.filasFusionadas++;
            if(esSeccionRealGestor(r.seccion)&&!g.seccionesReales.includes(r.seccion)) g.seccionesReales.push(r.seccion);
            if(esSeccionRealGestor(r.seccion)&&seleccionada&&!g.seccionesRealesSeleccionadas.includes(r.seccion)) g.seccionesRealesSeleccionadas.push(r.seccion);
            if(esSeccionRealGestor(r.seccion)&&!seleccionada&&!g.seccionesRealesExternas.includes(r.seccion)) g.seccionesRealesExternas.push(r.seccion);
            if(esSeccionRealGestor(r.seccion)&&tipoFilaGestor(r)==='planificada'&&seleccionada&&!g.madresSeleccionadas.includes(r.seccion)) g.madresSeleccionadas.push(r.seccion);
            if(esSeccionRealGestor(r.seccion)&&tipoFilaGestor(r)==='planificada'&&!seleccionada&&!g.madresExternas.includes(r.seccion)) g.madresExternas.push(r.seccion);
            const planRelacionado=planCarreraGestor(r.programaPlan,codigoCarreraGestor(r.programaCarrera));
            const nivelRelacionado=nivelGestor(r.nivel);
            const contextoRelacionado=[planRelacionado,nivelRelacionado?`(${nivelRelacionado})`:'' ].filter(Boolean).join('');
            if(contextoRelacionado&&!g.contextosRelacionados.includes(contextoRelacionado)) g.contextosRelacionados.push(contextoRelacionado);
        });
        const ids=Array.from(grupos.values()).map(g=>{
            const madres=new Set([...g.madresExternas,...g.madresSeleccionadas]);
            const contextosMadre=new Set((analisis.registros||[])
                .filter(r=>textoGestor(r.idSeccion)===textoGestor(g.idSeccion)&&madres.has(r.seccion))
                .map(r=>[planCarreraGestor(r.programaPlan,codigoCarreraGestor(r.programaCarrera)),nivelGestor(r.nivel)?`(${nivelGestor(r.nivel)})`:'' ].filter(Boolean).join(''))
                .filter(Boolean));
            const relacionadas=g.contextosRelacionados.filter(x=>!contextosMadre.has(x));
            const textoRelacionadas=relacionadas.length?relacionadas.join(', '):'Sin secciones relacionadas visibles';
            if(!g.idSeccion){
                g.estado='sin_id';
                g.motivo='Fila sin ID Sección en el Gestor.';
            }else if(usaFiltroCarreras&&g.madresExternas.length&&!g.madresSeleccionadas.length){
                g.estado='pendiente_externa';
                g.madreDetectada=g.madresExternas[0];
                g.motivo=`ID Madre con carrera no ingresada (${g.madresExternas.join(', ')}). Secciones relacionadas: ${textoRelacionadas}.`;
            }else if(g.madresSeleccionadas.length||g.seccionesRealesSeleccionadas.length||(!usaFiltroCarreras&&g.seccionesReales.length)){
                g.estado='resuelta';
                g.madreDetectada=g.madresSeleccionadas[0]||g.seccionesRealesSeleccionadas[0]||g.seccionesReales[0];
                g.motivo=g.filasFusionadas?`${g.filasFusionadas} fila(s) fusionadas trazadas por ID dentro de las carreras cargadas.`:'ID con sección real visible dentro de las carreras cargadas.';
            }else if(g.seccionesRealesExternas.length){
                g.estado='pendiente_externa';
                g.madreDetectada=g.seccionesRealesExternas[0];
                g.motivo=`ID visible solo en carreras no seleccionadas (${g.seccionesRealesExternas.join(', ')}). Secciones relacionadas: ${textoRelacionadas}.`;
            }else{
                g.estado='pendiente_externa';
                g.motivo='ID sin sección real visible en el archivo cargado.';
            }
            delete g.seccionesRealesSeleccionadas;
            delete g.seccionesRealesExternas;
            delete g.madresSeleccionadas;
            delete g.madresExternas;
            delete g.contextosRelacionados;
            return g;
        });
        return {
            carga:{id:cargaId,archivo:nombreArchivo,fecha:new Date().toISOString(),resumen:analisis.resumen||{}},
            ids,
            filas:(analisis.registros||[]).map(r=>Object.assign({cargaId},r))
        };
    }
    function guardarMemoriaGestor(analisis,nombreArchivo,opciones={}){
        const memoria=construirMemoriaIdsGestor(analisis,nombreArchivo,opciones);
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        data.gestorSecciones.cargas.unshift(memoria.carga);
        const previas=(data.gestorSecciones.ids||[]).filter(x=>x.cargaId!==memoria.carga.id);
        const filasPrevias=(data.gestorSecciones.filas||[]).filter(x=>x.cargaId!==memoria.carga.id);
        data.gestorSecciones.ids=[...memoria.ids,...previas].slice(0,10000);
        data.gestorSecciones.filas=[...memoria.filas,...filasPrevias].slice(0,15000);
        data.gestorSecciones.ultimaCargaId=memoria.carga.id;
        data.gestorSecciones.filtroAplicacion=opciones.carrerasSeleccionadas?.length?{carreras:opciones.carrerasSeleccionadas.slice()}:filtroCompletoGestor(analisis.registros||[]);
        data.gestorSecciones.filtroAplicacion.cargaId=memoria.carga.id;
        data.gestorSecciones.filtroAplicacion.ts=new Date().toISOString();
        sincronizarEspecialidadesDesdeGestor(memoria.filas);
        return memoria;
    }
    function renderTablaGestorSecciones(){
        const cont=document.getElementById('gestorTablaCompleta');
        const resumen=document.getElementById('gestorTablaResumen');
        const btnMas=document.getElementById('btnGestorMostrarMas');
        if(!cont) return;
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        const cargas=data.gestorSecciones.cargas||[];
        const ultima=cargas.find(c=>c.id===data.gestorSecciones.ultimaCargaId)||cargas[0]||null;
        const filas=ultima?(data.gestorSecciones.filas||[]).filter(f=>f.cargaId===ultima.id):(data.gestorSecciones.filas||[]);
        const q=(document.getElementById('gestorTablaBusqueda')?.value||'').trim().toLowerCase();
        const filtradas=q?filas.filter(f=>[
            f.idSeccion,f.programaCarrera,f.programaPlan,f.jornada,f.nivel,f.codigoAsignatura,f.asignatura,f.seccion,f.tipo,f.salaReferencia,f.modalidadAsignatura,f.modalidadSeccion
        ].join(' ').toLowerCase().includes(q)):filas;
        const limite=Math.max(100,Math.min(2000,Number(data.gestorSecciones.tablaLimite)||250));
        const visibles=filtradas.slice(0,limite);
        if(resumen) resumen.textContent=filas.length?`${visibles.length} de ${filtradas.length}${q?` filtradas de ${filas.length}`:''}`:'';
        if(btnMas) btnMas.disabled=visibles.length>=filtradas.length;
        if(!filas.length){
            cont.innerHTML='<p class="auto-plan-empty">Aún no hay filas cargadas del Gestor.</p>';
            return;
        }
        cont.innerHTML=`
            <div class="gestor-full-table"><table>
                <thead><tr>
                    <th>ID</th><th>Periodo</th><th>Programa</th><th>Plan</th><th>Jornada</th><th>Nivel</th><th>Sección</th>
                    <th>Código</th><th>Asignatura</th><th>Tipo</th><th>Alumnos</th><th>Otros</th><th>Total</th>
                    <th>Horas</th><th>Pres.</th><th>Virt.</th><th>Sala ref.</th><th>Modalidad Asig.</th><th>Modalidad Sec.</th>
                </tr></thead>
                <tbody>${visibles.map(f=>`<tr>
                    <td>${escapeHTML(f.idSeccion||'')}</td>
                    <td>${escapeHTML(f.periodo||'')}</td>
                    <td>${escapeHTML(f.programaCarrera||'')}</td>
                    <td>${escapeHTML(f.programaPlan||'')}</td>
                    <td>${escapeHTML(f.jornada||'')}</td>
                    <td>${escapeHTML(f.nivel||'')}</td>
                    <td>${escapeHTML(f.seccion||'')}</td>
                    <td>${escapeHTML(f.codigoAsignatura||'')}</td>
                    <td title="${escapeAttr(f.asignatura||'')}">${escapeHTML(f.asignatura||'')}</td>
                    <td>${escapeHTML(f.tipo||'')}</td>
                    <td>${f.alumnos||''}</td>
                    <td>${f.alumnosOtrosPlanes||''}</td>
                    <td>${f.alumnosTotales||''}</td>
                    <td>${f.horas||''}</td>
                    <td>${f.horasPresenciales||''}</td>
                    <td>${f.horasVirtuales||''}</td>
                    <td>${escapeHTML(f.salaReferencia||'')}</td>
                    <td>${escapeHTML(f.modalidadAsignatura||'')}</td>
                    <td>${escapeHTML(f.modalidadSeccion||'')}</td>
                </tr>`).join('')}</tbody>
            </table></div>
        `;
    }
    function seccionPorNombreGestor(nombre){
        const key=normalizarEncabezadoGestor(nombre);
        return data.secciones.find(s=>normalizarEncabezadoGestor(s.nombre)===key)||null;
    }
    function asignaturaPorCodigoGestor(codigo){
        const key=textoGestor(codigo).toUpperCase();
        return data.asignaturas.find(a=>String(a.codigo||'').toUpperCase()===key)||null;
    }
    function keyEnlaceManualGestor(idSeccion,cargaId){
        return `${textoGestor(cargaId)}::${textoGestor(idSeccion)}`;
    }
    function enlacesManualGestorPorId(idSeccion){
        const id=textoGestor(idSeccion);
        return (data.gestorSecciones.enlacesManuales||[])
            .filter(x=>textoGestor(x.idSeccion)===id)
            .sort((a,b)=>String(b.ts||'').localeCompare(String(a.ts||'')));
    }
    function getEnlaceManualGestor(idSeccion,cargaId){
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        const key=keyEnlaceManualGestor(idSeccion,cargaId);
        const exacto=(data.gestorSecciones.enlacesManuales||[]).find(x=>keyEnlaceManualGestor(x.idSeccion,x.cargaId)===key);
        if(exacto) return exacto;
        const global=(data.gestorSecciones.enlacesManuales||[]).find(x=>textoGestor(x.idSeccion)===textoGestor(idSeccion)&&(!x.cargaId||x.cargaId==='*'));
        if(global) return global;
        return enlacesManualGestorPorId(idSeccion)[0]||null;
    }
    function estadoVisualGestor(item){
        if(getEnlaceManualGestor(item.idSeccion,item.cargaId)) return 'relacionada_manual';
        return item.estado||'requiere_revision';
    }
    function descripcionEnlaceManualGestor(enlace){
        if(!enlace) return '';
        const base=enlace.tipo==='interna'
            ? `Relación manual interna: ${enlace.seccionNombre||'sección de la app'}`
            : `Relación manual externa: ${enlace.seccionNombre||'referencia externa'}`;
        return enlace.nota?`${base} · ${enlace.nota}`:base;
    }
    function descripcionMemoriaAplicadaGestor(enlace,cargaActual){
        if(!enlace) return '';
        const detalle=descripcionEnlaceManualGestor(enlace);
        if(enlace.origenCargaId&&cargaActual&&enlace.origenCargaId!==cargaActual) return `${detalle} · memoria reutilizada`;
        if(enlace.cargaId==='*') return `${detalle} · memoria reutilizable`;
        return detalle;
    }
    function datosInformeGestor(){
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        const cargas=data.gestorSecciones.cargas||[];
        const ultima=cargas.find(c=>c.id===data.gestorSecciones.ultimaCargaId)||cargas[0]||null;
        const ids=ultima?(data.gestorSecciones.ids||[]).filter(x=>x.cargaId===ultima.id):(data.gestorSecciones.ids||[]);
        const filas=ultima?(data.gestorSecciones.filas||[]).filter(x=>x.cargaId===ultima.id):(data.gestorSecciones.filas||[]);
        return {ultima,ids,filas};
    }
    function filasInformeRelacionesGestor(ids){
        return ids.map(x=>{
            const enlace=getEnlaceManualGestor(x.idSeccion,x.cargaId);
            const estado=estadoVisualGestor(x);
            return [
                x.idSeccion||'Sin ID',
                estado,
                x.asignaturaCodigo||'',
                x.asignaturaNombre||'',
                x.madreDetectada||'',
                (x.seccionesReales||[]).join(', '),
                x.filas||0,
                x.filasFusionadas||0,
                x.carrera||'',
                x.plan||'',
                x.nivel||'',
                x.jornada||'',
                enlace?.tipo||'',
                enlace?.seccionNombre||'',
                enlace?.nota||'',
                descripcionMemoriaAplicadaGestor(enlace,x.cargaId)||x.motivo||''
            ];
        });
    }
    function matrizInformeGestor(ids){
        return [[
            'ID Sección','Estado','Código','Asignatura','Madre detectada','Secciones reales',
            'Filas','Filas fusionadas','Carrera','Plan','Nivel','Jornada',
            'Tipo relación manual','Referencia manual','Nota manual','Motivo / detalle'
        ],...filasInformeRelacionesGestor(ids)];
    }
    function formatearHojaInformeGestor(ws){
        if(!ws||!window.XLSX?.utils) return ws;
        ws['!cols']=[
            {wch:18},{wch:20},{wch:12},{wch:34},{wch:22},{wch:34},
            {wch:8},{wch:14},{wch:28},{wch:14},{wch:10},{wch:14},
            {wch:18},{wch:30},{wch:34},{wch:45}
        ];
        ws['!views']=[{showGridLines:true,freezePanes:{ySplit:1}}];
        const rango=window.XLSX.utils.decode_range(ws['!ref']||'A1:A1');
        for(let r=rango.s.r;r<=rango.e.r;r++){
            for(let c=rango.s.c;c<=rango.e.c;c++){
                const addr=window.XLSX.utils.encode_cell({r,c});
                if(!ws[addr]) continue;
                ws[addr].s={
                    alignment:{vertical:'top',wrapText:true},
                    font:{name:'Arial',sz:r===0?10:9,bold:r===0},
                    fill:r===0?{patternType:'solid',fgColor:{rgb:'D9EAF7'}}:undefined,
                    border:{
                        top:{style:'thin',color:{rgb:'B8C2C8'}},
                        bottom:{style:'thin',color:{rgb:'B8C2C8'}},
                        left:{style:'thin',color:{rgb:'B8C2C8'}},
                        right:{style:'thin',color:{rgb:'B8C2C8'}}
                    }
                };
            }
        }
        return ws;
    }
    function nombreHojaGestor(nombre){
        return String(nombre||'Hoja').replace(/[\\/?*:[\]]/g,'-').substring(0,31)||'Hoja';
    }
    async function exportarInformeGestor(){
        const {ultima,ids,filas}=datosInformeGestor();
        if(!ids.length) return toast('No hay memoria del Gestor para exportar','error');
        const resueltas=ids.filter(x=>estadoVisualGestor(x)==='resuelta');
        const manuales=ids.filter(x=>estadoVisualGestor(x)==='relacionada_manual');
        const pendientes=ids.filter(x=>estadoVisualGestor(x)==='pendiente_externa');
        const sinId=ids.filter(x=>estadoVisualGestor(x)==='sin_id');
        const memoriasReutilizadas=ids.filter(x=>{
            const enlace=getEnlaceManualGestor(x.idSeccion,x.cargaId);
            return !!(enlace&&enlace.origenCargaId&&enlace.origenCargaId!==x.cargaId);
        }).length;
        const resumen=[
            ['Informe Gestor Secciones',''],
            ['Archivo',ultima?.archivo||'Sin archivo'],
            ['Fecha carga',ultima?.fecha?new Date(ultima.fecha).toLocaleString():''],
            ['IDs totales',ids.length],
            ['Resueltas',resueltas.length],
            ['Relacionadas manualmente',manuales.length],
            ['Memorias reutilizadas',memoriasReutilizadas],
            ['Pendientes externas',pendientes.length],
            ['Sin ID',sinId.length],
            ['Filas del Gestor',filas.length]
        ];
        const hojas=[
            {nombre:'Resumen',matriz:resumen},
            {nombre:'Todas las relaciones',matriz:matrizInformeGestor(ids)},
            {nombre:'Resueltas',matriz:matrizInformeGestor(resueltas)},
            {nombre:'Manuales',matriz:matrizInformeGestor(manuales)},
            {nombre:'Pendientes externas',matriz:matrizInformeGestor(pendientes)},
            {nombre:'Sin ID',matriz:matrizInformeGestor(sinId)}
        ];
        const nombreBase=`Informe_Gestor_${getTemporadaLabel()}_${new Date().toISOString().slice(0,10)}`;
        if(window.XLSX?.utils?.book_new&&window.XLSX?.writeFile){
            const wb=window.XLSX.utils.book_new();
            hojas.forEach(h=>{
                const ws=formatearHojaInformeGestor(window.XLSX.utils.aoa_to_sheet(h.matriz.length?h.matriz:[['Sin datos']]));
                window.XLSX.utils.book_append_sheet(wb,ws,nombreHojaGestor(h.nombre));
            });
            window.XLSX.writeFile(wb,`${nombreBase}.xlsx`,{bookSST:true,cellStyles:true});
        }else{
            descargarTablaExcel(`${nombreBase}.xls`,hojas);
        }
        auditoria('gestor_informe_exportado',{archivo:ultima?.archivo||'',ids:ids.length,pendientes:pendientes.length,manuales:manuales.length});
        toast('Informe del Gestor exportado','success');
    }
    function renderBuscadorIdGestor(){
        const cont=document.getElementById('gestorIdResultado');
        if(!cont) return;
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        const q=(document.getElementById('gestorIdBusqueda')?.value||'').trim().toLowerCase();
        if(!q){
            cont.innerHTML='<p class="auto-plan-empty">Escribe una ID para ver su relación, estado y acceso rápido a planificación.</p>';
            return;
        }
        const cargas=data.gestorSecciones.cargas||[];
        const ultima=cargas.find(c=>c.id===data.gestorSecciones.ultimaCargaId)||cargas[0]||null;
        const ids=data.gestorSecciones.ids||[];
        const matches=ids
            .filter(x=>String(x.idSeccion||'').toLowerCase().includes(q))
            .sort((a,b)=>{
                if(ultima){
                    if(a.cargaId===ultima.id&&b.cargaId!==ultima.id) return -1;
                    if(a.cargaId!==ultima.id&&b.cargaId===ultima.id) return 1;
                }
                return 0;
            });
        if(!matches.length){
            cont.innerHTML='<p class="auto-plan-empty">No se encontró esa ID en la memoria del Gestor.</p>';
            return;
        }
        const visibles=matches.slice(0,5);
        cont.innerHTML=visibles.map(item=>{
            const carga=cargas.find(c=>c.id===item.cargaId)||null;
            const filas=(data.gestorSecciones.filas||[]).filter(f=>f.cargaId===item.cargaId&&f.idSeccion===item.idSeccion);
            const asig=asignaturaPorCodigoGestor(item.asignaturaCodigo);
            const enlace=getEnlaceManualGestor(item.idSeccion,item.cargaId);
            const secciones=(item.seccionesReales||[]).map(nombre=>({nombre,sec:seccionPorNombreGestor(nombre)}));
            const acciones=[
                secciones.filter(x=>x.sec).map(x=>`<button class="btn btn-xs gestor-ir-planificacion" data-seccion="${escapeAttr(x.sec.id)}" data-asignatura="${escapeAttr(asig?.id||'')}" data-id="${escapeAttr(item.idSeccion||'')}">Ir a ${escapeHTML(x.nombre)}</button>`).join(''),
                `<button class="btn btn-xs gestor-relacionar-id" data-id="${escapeAttr(item.idSeccion||'')}" data-carga="${escapeAttr(item.cargaId||'')}">${enlace?'Editar relación':'Relacionar manualmente'}</button>`
            ].filter(Boolean).join('');
            return `
            <div class="gestor-id-result">
                <h3>ID ${escapeHTML(item.idSeccion||'Sin ID')}</h3>
                <div class="gestor-id-grid">
                    <div><span>Estado</span><strong>${escapeHTML(estadoVisualGestor(item))}</strong></div>
                    <div><span>Archivo</span><strong>${escapeHTML(carga?.archivo||item.archivo||'-')}</strong></div>
                    <div><span>Asignatura</span><strong>${escapeHTML([item.asignaturaCodigo,item.asignaturaNombre].filter(Boolean).join(' - '))}</strong></div>
                    <div><span>Madre detectada</span><strong>${escapeHTML(item.madreDetectada||'No visible')}</strong></div>
                    <div><span>Secciones reales</span><strong>${escapeHTML((item.seccionesReales||[]).join(', ')||'No visibles')}</strong></div>
                    <div><span>Filas</span><strong>${item.filas||0}</strong></div>
                    <div><span>Fusionadas</span><strong>${item.filasFusionadas||0}</strong></div>
                    <div><span>Carrera / plan</span><strong>${escapeHTML([item.carrera,item.plan].filter(Boolean).join(' · '))}</strong></div>
                    <div><span>Nivel / jornada</span><strong>${escapeHTML([item.nivel,item.jornada].filter(Boolean).join(' · '))}</strong></div>
                </div>
                <p class="auto-plan-empty">${escapeHTML(descripcionMemoriaAplicadaGestor(enlace,item.cargaId)||item.motivo||'')}</p>
                <div class="gestor-id-actions">${acciones}</div>
                ${filas.length?`<div class="gestor-mini-table" style="margin-top:10px;"><table><thead><tr><th>Sección</th><th>Tipo</th><th>Asignatura</th><th>Horas</th><th>Alumnos</th></tr></thead><tbody>${filas.slice(0,8).map(f=>`<tr><td>${escapeHTML(f.seccion||'')}</td><td>${escapeHTML(f.tipo||'')}</td><td>${escapeHTML([f.codigoAsignatura,f.asignatura].filter(Boolean).join(' - '))}</td><td>${f.horas||''}</td><td>${f.alumnosTotales||f.alumnos||''}</td></tr>`).join('')}</tbody></table></div>`:''}
            </div>
        `;}).join('')+(matches.length>visibles.length?`<p class="auto-plan-empty">Hay ${matches.length} coincidencias; se muestran las primeras ${visibles.length}. Escribe la ID completa para mayor precisión.</p>`:'');
    }
    function etiquetaEstadoGestor(estado){
        const textos={resuelta:'Resuelta',relacionada_manual:'Relacionada manual',pendiente_externa:'Pendiente externa',sin_id:'Sin ID'};
        const cls=estado||'por-revisar';
        return `<span class="gestor-status ${escapeAttr(cls)}">${escapeHTML(textos[estado]||'Por revisar')}</span>`;
    }
    function renderRelacionesGestor(){
        const cont=document.getElementById('gestorRelaciones');
        const resumen=document.getElementById('gestorRelacionesResumen');
        if(!cont) return;
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        const cargas=data.gestorSecciones.cargas||[];
        const ultima=cargas.find(c=>c.id===data.gestorSecciones.ultimaCargaId)||cargas[0]||null;
        const ids=ultima?(data.gestorSecciones.ids||[]).filter(x=>x.cargaId===ultima.id):(data.gestorSecciones.ids||[]);
        if(!ids.length){
            if(resumen) resumen.textContent='';
            cont.innerHTML='<p class="auto-plan-empty">Aún no hay relaciones por ID. Carga un Gestor para revisar vínculos, fusiones y pendientes.</p>';
            return;
        }
        const conteo={
            resuelta:ids.filter(x=>estadoVisualGestor(x)==='resuelta').length,
            relacionada_manual:ids.filter(x=>estadoVisualGestor(x)==='relacionada_manual').length,
            pendiente_externa:ids.filter(x=>estadoVisualGestor(x)==='pendiente_externa').length,
            sin_id:ids.filter(x=>x.estado==='sin_id').length
        };
        const estado=(document.getElementById('gestorRelacionEstado')?.value||'').trim();
        const q=(document.getElementById('gestorRelacionBusqueda')?.value||'').trim().toLowerCase();
        const filtradas=ids.filter(x=>{
            const estadoVisual=estadoVisualGestor(x);
            if(estado&&estadoVisual!==estado) return false;
            if(!q) return true;
            return [
                x.idSeccion,estadoVisual,x.estado,x.asignaturaCodigo,x.asignaturaNombre,x.madreDetectada,x.carrera,x.plan,x.jornada,x.nivel,
                ...(x.seccionesReales||[])
            ].join(' ').toLowerCase().includes(q);
        });
        if(resumen) resumen.textContent=`${filtradas.length} de ${ids.length}`;
        const visibles=filtradas.slice(0,120);
        cont.innerHTML=`
            <div class="gestor-relation-badges">
                <span class="gestor-relation-badge">Resueltas <strong>${conteo.resuelta}</strong></span>
                <span class="gestor-relation-badge">Relacionadas manual <strong>${conteo.relacionada_manual}</strong></span>
                <span class="gestor-relation-badge">Pendientes externas <strong>${conteo.pendiente_externa}</strong></span>
                <span class="gestor-relation-badge">Sin ID <strong>${conteo.sin_id}</strong></span>
            </div>
            ${visibles.length?`<div class="gestor-rel-table"><table>
                <thead><tr>
                    <th>Estado</th><th>ID</th><th>Asignatura</th><th>Relación detectada</th><th>Contexto</th><th>Acción</th>
                </tr></thead>
                <tbody>${visibles.map(x=>{
                    const asig=asignaturaPorCodigoGestor(x.asignaturaCodigo);
                    const enlace=getEnlaceManualGestor(x.idSeccion,x.cargaId);
                    const estadoVisual=estadoVisualGestor(x);
                    const secciones=(x.seccionesReales||[]).map(nombre=>({nombre,sec:seccionPorNombreGestor(nombre)}));
                    const acciones=[
                        secciones.filter(s=>s.sec).slice(0,3).map(s=>`<button class="btn btn-xs gestor-ir-planificacion" data-seccion="${escapeAttr(s.sec.id)}" data-asignatura="${escapeAttr(asig?.id||'')}" data-id="${escapeAttr(x.idSeccion||'')}">${escapeHTML(s.nombre)}</button>`).join(' '),
                        `<button class="btn btn-xs gestor-relacionar-id" data-id="${escapeAttr(x.idSeccion||'')}" data-carga="${escapeAttr(x.cargaId||'')}">${enlace?'Editar relación':'Relacionar'}</button>`
                    ].filter(Boolean).join(' ');
                    const relacion=enlace?descripcionMemoriaAplicadaGestor(enlace,x.cargaId):x.estado==='resuelta'
                        ? `Madre: ${x.madreDetectada||'no visible'}${x.filasFusionadas?` · ${x.filasFusionadas} fusionada(s) trazadas`:''}`
                        : (x.motivo||'Revisar relación manualmente');
                    return `<tr>
                        <td>${etiquetaEstadoGestor(estadoVisual)}</td>
                        <td><strong>${escapeHTML(x.idSeccion||'Sin ID')}</strong></td>
                        <td>${escapeHTML([x.asignaturaCodigo,x.asignaturaNombre].filter(Boolean).join(' - '))}</td>
                        <td>${escapeHTML(relacion)}<br><span class="auto-plan-empty">${escapeHTML((x.seccionesReales||[]).join(', ')||'Sin sección real visible')}</span></td>
                        <td>${escapeHTML([x.carrera,x.plan,x.nivel,x.jornada].filter(Boolean).join(' · '))}</td>
                        <td><div class="gestor-id-actions">${acciones||'<span class="auto-plan-empty">Sin acceso directo</span>'}</div></td>
                    </tr>`;
                }).join('')}</tbody>
            </table></div>`:'<p class="auto-plan-empty">No hay relaciones que coincidan con el filtro actual.</p>'}
            ${filtradas.length>visibles.length?`<p class="auto-plan-empty">Se muestran ${visibles.length} de ${filtradas.length}. Usa la búsqueda para acotar la revisión.</p>`:''}
        `;
    }
    function renderPendientesGestor(){
        const cont=document.getElementById('gestorPendientes');
        const resumen=document.getElementById('gestorPendientesResumen');
        if(!cont) return;
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        const cargas=data.gestorSecciones.cargas||[];
        const ultima=cargas.find(c=>c.id===data.gestorSecciones.ultimaCargaId)||cargas[0]||null;
        const ids=ultima?(data.gestorSecciones.ids||[]).filter(x=>x.cargaId===ultima.id):(data.gestorSecciones.ids||[]);
        const pendientes=ids.filter(x=>estadoVisualGestor(x)==='pendiente_externa');
        if(resumen) resumen.textContent=pendientes.length?`${pendientes.length} pendiente(s)`: '';
        if(!ids.length){
            cont.innerHTML='<p class="auto-plan-empty">Aún no hay memoria de IDs para revisar pendientes.</p>';
            return;
        }
        if(!pendientes.length){
            cont.innerHTML='<p class="auto-plan-empty">No hay IDs pendientes externas en la última carga.</p>';
            return;
        }
        const visibles=pendientes.slice(0,20);
        cont.innerHTML=`
            <div class="gestor-pending-list">
                ${visibles.map(x=>`<div class="gestor-pending-item">
                    <div><strong>${escapeHTML(x.idSeccion||'Sin ID')}</strong><span>${escapeHTML(x.estado==='pendiente_externa'?'Pendiente externa':'Por revisar')}</span></div>
                    <div><strong>${escapeHTML([x.asignaturaCodigo,x.asignaturaNombre].filter(Boolean).join(' - ')||'Sin asignatura')}</strong><span>${escapeHTML(x.motivo||'ID sin sección real visible en el archivo cargado.')}</span></div>
                    <div><strong>${escapeHTML([x.carrera,x.plan].filter(Boolean).join(' · ')||'Sin carrera visible')}</strong><span>${escapeHTML([x.nivel,x.jornada].filter(Boolean).join(' · ')||'Sin contexto visible')}</span></div>
                    <div class="gestor-pending-actions">
                        <button class="btn btn-xs gestor-buscar-id" data-id="${escapeAttr(x.idSeccion||'')}">Buscar ID</button>
                        <button class="btn btn-xs gestor-ver-filas" data-id="${escapeAttr(x.idSeccion||'')}">Ver filas</button>
                        <button class="btn btn-xs gestor-relacionar-id" data-id="${escapeAttr(x.idSeccion||'')}" data-carga="${escapeAttr(x.cargaId||'')}">Relacionar</button>
                    </div>
                </div>`).join('')}
            </div>
            ${pendientes.length>visibles.length?`<p class="auto-plan-empty">Se muestran ${visibles.length} de ${pendientes.length}. Usa Relaciones por ID para filtrar el resto.</p>`:''}
        `;
    }
    function abrirRelacionManualGestor(idSeccion,cargaId){
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        const item=(data.gestorSecciones.ids||[]).find(x=>x.idSeccion===idSeccion&&x.cargaId===cargaId);
        if(!item) return toast('No se encontró la ID en la memoria del Gestor','error');
        const actual=getEnlaceManualGestor(idSeccion,cargaId);
        const seccionesOrdenadas=data.secciones.slice().sort((a,b)=>String(a.nombre||'').localeCompare(String(b.nombre||''),'es'));
        const opcionesSeccion=seccionesOrdenadas.map(s=>`<option value="${escapeAttr(s.id)}" ${actual?.seccionId===s.id?'selected':''}>${escapeHTML(s.nombre)}</option>`).join('');
        const tipo=actual?.tipo||'externa';
        document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <div class="modal-header">
                    <h3>Relacionar ID del Gestor</h3>
                    <p>ID ${escapeHTML(idSeccion)} · ${escapeHTML([item.asignaturaCodigo,item.asignaturaNombre].filter(Boolean).join(' - '))}</p>
                </div>
                <div class="form-group">
                    <label class="form-label">Tipo de relación</label>
                    <select class="form-select" id="gestorRelacionManualTipo">
                        <option value="externa" ${tipo==='externa'?'selected':''}>Externa / otra área</option>
                        <option value="interna" ${tipo==='interna'?'selected':''}>Sección existente en esta app</option>
                    </select>
                </div>
                <div class="form-group" id="gestorRelacionInternaBox">
                    <label class="form-label">Sección interna</label>
                    <select class="form-select" id="gestorRelacionManualSeccion">
                        <option value="">Seleccionar sección...</option>
                        ${opcionesSeccion}
                    </select>
                </div>
                <div class="form-group" id="gestorRelacionExternaBox">
                    <label class="form-label">Referencia externa</label>
                    <input class="form-input" id="gestorRelacionManualNombre" placeholder="Ej: D-ADM-N1-P2-C3, Coordinación Matemática, otra área..." value="${escapeAttr(actual?.seccionNombre||'')}">
                </div>
                <div class="form-group">
                    <label class="form-label">Nota</label>
                    <textarea class="form-input" id="gestorRelacionManualNota" rows="3" placeholder="Observación breve para recordar cómo se resolvió esta ID.">${escapeHTML(actual?.nota||'')}</textarea>
                </div>
                <div class="modal-actions">
                    ${actual?'<button class="btn btn-sm" id="btnEliminarRelacionGestor">Eliminar relación</button>':''}
                    <button class="btn btn-sm" id="btnCancelarRelacionGestor">Cancelar</button>
                    <button class="btn btn-primary btn-sm" id="btnGuardarRelacionGestor">Guardar relación</button>
                </div>
            </div></div>`;
        const tipoEl=document.getElementById('gestorRelacionManualTipo');
        const internaBox=document.getElementById('gestorRelacionInternaBox');
        const externaBox=document.getElementById('gestorRelacionExternaBox');
        const syncTipo=()=>{
            const interna=tipoEl.value==='interna';
            if(internaBox) internaBox.style.display=interna?'block':'none';
            if(externaBox) externaBox.style.display=interna?'none':'block';
        };
        const cerrar=()=>{ document.getElementById('modalContainer').innerHTML=''; };
        const guardarRelacion=()=>{
            const tipoSel=tipoEl.value==='interna'?'interna':'externa';
            const seccionId=document.getElementById('gestorRelacionManualSeccion')?.value||'';
            const seccionInterna=data.secciones.find(s=>s.id===seccionId)||null;
            const seccionNombre=tipoSel==='interna'?(seccionInterna?.nombre||''):(document.getElementById('gestorRelacionManualNombre')?.value||'').trim();
            const nota=(document.getElementById('gestorRelacionManualNota')?.value||'').trim();
            if(tipoSel==='interna'&&!seccionInterna) return toast('Selecciona una sección interna','error');
            if(tipoSel==='externa'&&!seccionNombre) return toast('Escribe una referencia externa','error');
            data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
            data.gestorSecciones.enlacesManuales=(data.gestorSecciones.enlacesManuales||[]).filter(x=>textoGestor(x.idSeccion)!==textoGestor(idSeccion));
            data.gestorSecciones.enlacesManuales.unshift({
                idSeccion,cargaId:'*',origenCargaId:cargaId,tipo:tipoSel,
                seccionId:tipoSel==='interna'?seccionId:'',
                seccionNombre,
                nota,
                ts:new Date().toISOString()
            });
            auditoria('gestor_id_relacionada_manual',{idSeccion,cargaId,tipo:tipoSel,seccionId:tipoSel==='interna'?seccionId:null,seccionNombre,memoriaGlobal:true});
            guardar({forzar:true});
            renderGestorSecciones();
            renderDashboard();
            cerrar();
            toast('Relación manual guardada','success');
        };
        const eliminarRelacion=()=>{
            data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
            data.gestorSecciones.enlacesManuales=(data.gestorSecciones.enlacesManuales||[]).filter(x=>textoGestor(x.idSeccion)!==textoGestor(idSeccion));
            auditoria('gestor_id_relacion_manual_eliminada',{idSeccion,cargaId,memoriaGlobal:true});
            guardar({forzar:true});
            renderGestorSecciones();
            renderDashboard();
            cerrar();
            toast('Relación manual eliminada','info');
        };
        tipoEl.onchange=syncTipo;
        document.getElementById('btnCancelarRelacionGestor').onclick=cerrar;
        document.getElementById('btnGuardarRelacionGestor').onclick=guardarRelacion;
        document.getElementById('btnEliminarRelacionGestor')?.addEventListener('click',eliminarRelacion);
        document.getElementById('modalOverlay').onclick=(e)=>{ if(e.target===e.currentTarget) cerrar(); };
        syncTipo();
        setTimeout(()=>document.getElementById(tipo==='interna'?'gestorRelacionManualSeccion':'gestorRelacionManualNombre')?.focus(),0);
    }
    function renderGestorSecciones(){
        const resumenEl=document.getElementById('gestorResumen');
        const idsEl=document.getElementById('gestorIdsResumen');
        const btnAplicar=document.getElementById('btnGestorAplicar');
        const btnExportar=document.getElementById('btnGestorExportarInforme');
        if(!resumenEl||!idsEl) return;
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        const cargas=data.gestorSecciones.cargas||[];
        const ids=data.gestorSecciones.ids||[];
        const ultima=cargas.find(c=>c.id===data.gestorSecciones.ultimaCargaId)||cargas[0]||null;
        const idsUltima=ultima?ids.filter(x=>x.cargaId===ultima.id):ids;
        const pendientes=idsUltima.filter(x=>estadoVisualGestor(x)==='pendiente_externa').length;
        const resueltas=idsUltima.filter(x=>estadoVisualGestor(x)==='resuelta').length;
        const manuales=idsUltima.filter(x=>estadoVisualGestor(x)==='relacionada_manual').length;
        const sinId=idsUltima.filter(x=>estadoVisualGestor(x)==='sin_id').length;
        const filtroActual=data.gestorSecciones.filtroAplicacion?.cargaId===ultima?.id?data.gestorSecciones.filtroAplicacion:null;
        resumenEl.innerHTML=[
            ['Archivo',ultima?.archivo||'Sin carga'],
            ['IDs leídas',idsUltima.length],
            ['IDs resueltas',resueltas],
            ['Memoria manual',manuales],
            ['Pendientes externas',pendientes],
            ['Sin ID',sinId],
            ['Carreras filtradas',filtroActual?.carreras?.length||'Todas'],
            ['Última carga',ultima?.fecha?new Date(ultima.fecha).toLocaleString():'-']
        ].map(([k,v])=>`<div><span>${escapeHTML(k)}</span><strong>${escapeHTML(String(v))}</strong></div>`).join('');
        if(btnAplicar) btnAplicar.disabled=!ultima;
        if(btnExportar) btnExportar.disabled=!ultima||!idsUltima.length;
        const muestra=idsUltima.slice(0,12);
        idsEl.innerHTML=muestra.length?`
            <div class="gestor-mini-table"><table>
                <thead><tr><th>ID</th><th>Estado</th><th>Asignatura</th><th>Carrera / plan</th><th>Nivel / jornada</th><th>Madre detectada</th><th>Secciones reales</th><th>Motivo</th></tr></thead>
                <tbody>${muestra.map(x=>`<tr>
                    <td>${escapeHTML(x.idSeccion||'Sin ID')}</td>
                    <td>${escapeHTML(x.estado)}</td>
                    <td>${escapeHTML([x.asignaturaCodigo,x.asignaturaNombre].filter(Boolean).join(' - '))}</td>
                    <td>${escapeHTML([x.carrera,x.plan].filter(Boolean).join(' · ')||'-')}</td>
                    <td>${escapeHTML([x.nivel,x.jornada].filter(Boolean).join(' · ')||'-')}</td>
                    <td>${escapeHTML(x.madreDetectada||'-')}</td>
                    <td>${escapeHTML((x.seccionesReales||[]).join(', ')||'-')}</td>
                    <td>${escapeHTML(x.motivo||'')}</td>
                </tr>`).join('')}</tbody>
            </table></div>
            ${idsUltima.length>muestra.length?`<p class="auto-plan-empty">Se muestran ${muestra.length} de ${idsUltima.length} ID. Usa la tabla completa para revisar más filas.</p>`:''}
        `:'<p class="auto-plan-empty">Aún no hay IDs cargadas. Usa “Cargar Gestor” para crear la memoria de IDs.</p>';
        renderBuscadorIdGestor();
        renderPendientesGestor();
        renderRelacionesGestor();
        renderTablaGestorSecciones();
    }
    function aplicarPropuestaGestor(propuesta){
        const cols=getColores();
        const resumen={
            carreras:0,niveles:0,secciones:0,asignaturas:0,salas:0,relaciones:0,relacionesSeccion:0,grupos:0,vinculos:0,omitidos:0,
            detalle:{carreras:[],niveles:[],secciones:[],asignaturas:[],salas:[],relaciones:[],relacionesSeccion:[],grupos:[],vinculos:[],omitidos:[]}
        };
        sincronizarEspecialidadesDesdeGestor((data.gestorSecciones?.filas||[]).filter(f=>!data.gestorSecciones?.ultimaCargaId||f.cargaId===data.gestorSecciones.ultimaCargaId));
        const carreraIds=new Map();
        data.carreras.forEach(c=>carreraIds.set(String(c.codigo||'').toUpperCase(),c.id));
        propuesta.carreras.forEach(c=>{
            const key=String(c.codigo||'').toUpperCase();
            let id=carreraIds.get(key);
            if(!id){
                id=genId();
                data.carreras.push({id,codigo:c.codigo,nombre:c.nombre,area:c.area||'',especialidad:c.area||'',tipo:''});
                carreraIds.set(key,id);
                resumen.carreras++;
                resumen.detalle.carreras.push(`${c.codigo} - ${c.nombre}`);
            } else {
                const carrera=data.carreras.find(x=>x.id===id);
                if(carrera&&c.area){
                    carrera.area=c.area;
                    if(!carrera.especialidad) carrera.especialidad=c.area;
                }
            }
        });

        const nivelIds=new Map();
        data.niveles.forEach(n=>nivelIds.set(`${n.carreraId}|${normalizarEncabezadoGestor(n.nombre)}`,n.id));
        propuesta.niveles.forEach(n=>{
            const carreraId=carreraIds.get(String(n.carreraKey||'').toUpperCase());
            if(!carreraId){ resumen.omitidos++; return; }
            const key=`${carreraId}|${normalizarEncabezadoGestor(n.nombre)}`;
            let id=nivelIds.get(key);
            if(!id){
                id=genId();
                data.niveles.push({id,carreraId,nombre:n.nombre,tieneOnline:!!n.tieneOnline});
                nivelIds.set(key,id);
                resumen.niveles++;
                resumen.detalle.niveles.push(`${n.carreraKey} · ${n.nombre}`);
            }else if(n.tieneOnline){
                const nivel=data.niveles.find(x=>x.id===id);
                if(nivel) nivel.tieneOnline=true;
            }
        });

        const seccionIds=new Map();
        data.secciones.forEach(s=>seccionIds.set(normalizarEncabezadoGestor(s.nombre),s.id));
        propuesta.secciones.forEach(s=>{
            const carreraId=carreraIds.get(String(s.carreraKey||'').toUpperCase());
            const nivelNombre=(s.nivelKey||'').split('|')[1]||'';
            const nivelId=carreraId?nivelIds.get(`${carreraId}|${normalizarEncabezadoGestor(nivelNombre)}`):null;
            if(!nivelId){ resumen.omitidos++; resumen.detalle.omitidos.push(`Sección ${s.nombre}: sin nivel destino`); return; }
            const key=normalizarEncabezadoGestor(s.nombre);
            let id=seccionIds.get(key);
            if(!id){
                id=genId();
                data.secciones.push({id,nivelId,nombre:s.nombre,tipoSeccion:tieneMarcaFusionGestor(s.nombre)?'fusionada':'regular',jornada:jornadaGestor(s.jornada,s.nombre)});
                seccionIds.set(key,id);
                resumen.secciones++;
                resumen.detalle.secciones.push(`${s.nombre} · ${s.carreraKey} · ${nivelNombre}`);
            }
        });

        const asignaturaIds=new Map();
        data.asignaturas.forEach(a=>asignaturaIds.set(String(a.codigo||'').toUpperCase(),a.id));
        const salaIds=new Map();
        data.salas.forEach(s=>salaIds.set(normalizarEncabezadoGestor(s.nombre),s.id));
        propuesta.asignaturas.forEach(a=>{
            const nombreSala=String(a.salaPreferidaNombre||'').trim().toUpperCase();
            if(!nombreSala) return;
            const key=normalizarEncabezadoGestor(nombreSala);
            if(salaIds.has(key)) return;
            const id=genId();
            data.salas.push({
                id,
                nombre:nombreSala,
                capacidad:Number(a.alumnosTotales)||30,
                tipoSala:a.tipoEspacioSugerido||'Sala de Clases',
                observaciones:a.salaReferencia?`Creada desde Gestor: ${a.salaReferencia}`:'',
                alertasImportacion:[]
            });
            salaIds.set(key,id);
            resumen.salas++;
            resumen.detalle.salas.push(`${nombreSala} · ${a.tipoEspacioSugerido||'Sala de Clases'}`);
        });
        propuesta.asignaturas.forEach((a,idx)=>{
            const key=String(a.codigo||'').toUpperCase();
            let id=asignaturaIds.get(key);
            if(!id){
                if((Number(a.horasTotales)||0)<=0){ resumen.omitidos++; resumen.detalle.omitidos.push(`Asignatura ${a.codigo}: horas inválidas`); return; }
                id=genId();
                data.asignaturas.push({
                    id,
                    codigo:a.codigo,
                    nombre:a.nombre,
                    horasTotales:Number(a.horasTotales)||0,
                    horasVirtuales:Number(a.horasVirtuales)||0,
                    horasPresenciales:Number(a.horasPresenciales)||Math.max(0,(Number(a.horasTotales)||0)-(Number(a.horasVirtuales)||0)),
                    bloquesPresenciales:Number(a.bloquesPresenciales)||0,
                    bloquesVirtuales:Number(a.bloquesVirtuales)||0,
                    salasPreferidas:a.salaPreferidaNombre&&salaIds.has(normalizarEncabezadoGestor(a.salaPreferidaNombre))?[salaIds.get(normalizarEncabezadoGestor(a.salaPreferidaNombre))]:[],
                    color:cols[idx%cols.length]||'#e9ecef',
                    area:a.area||'especialidad',
                    modalidad:a.modalidad||'lectiva',
                    condicion:'normal',
                    distribucion:'balanceada',
                    controlHorario:a.controlHorarioSugerido||(a.area==='transversal'?'coordinacion-externa':'propio'),
                    preferenciaHoraria:'flexible',
                    salaReferencia:a.salaReferencia||'',
                    tipoEspacioSugerido:a.tipoEspacioSugerido||'',
                    especialidadGestor:a.especialidadGestor||''
                });
                asignaturaIds.set(key,id);
                resumen.asignaturas++;
                resumen.detalle.asignaturas.push(`${a.codigo} - ${a.nombre}`);
            }else{
                const actual=data.asignaturas.find(x=>x.id===id);
                const salaId=a.salaPreferidaNombre?salaIds.get(normalizarEncabezadoGestor(a.salaPreferidaNombre)):null;
                if(actual&&salaId&&!actual.salasPreferidas?.includes(salaId)){
                    actual.salasPreferidas=[...(actual.salasPreferidas||[]),salaId];
                    actual.salaReferencia=a.salaReferencia||actual.salaReferencia||'';
                    actual.tipoEspacioSugerido=a.tipoEspacioSugerido||actual.tipoEspacioSugerido||'';
                }
            }
        });

        propuesta.relaciones.forEach(rel=>{
            const asignaturaId=asignaturaIds.get(String(rel.codigoAsignatura||'').toUpperCase());
            const carreraId=carreraIds.get(String(rel.carreraKey||'').toUpperCase());
            const nivelNombre=(rel.nivelKey||'').split('|')[1]||'';
            const nivelId=carreraId?nivelIds.get(`${carreraId}|${normalizarEncabezadoGestor(nivelNombre)}`):null;
            if(!asignaturaId||!carreraId||!nivelId){ resumen.omitidos++; resumen.detalle.omitidos.push(`Relación ${rel.codigoAsignatura} · ${rel.carreraKey} · ${nivelNombre}: incompleta`); return; }
            const existe=data.asignaturaCarreraNivel.some(r=>r.asignaturaId===asignaturaId&&r.carreraId===carreraId&&r.nivelId===nivelId);
            if(!existe){
                data.asignaturaCarreraNivel.push({asignaturaId,carreraId,nivelId});
                resumen.relaciones++;
                resumen.detalle.relaciones.push(`${rel.codigoAsignatura} · ${rel.carreraKey} · ${nivelNombre}`);
            }
        });
        if(!Array.isArray(data.asignaturaSeccion)) data.asignaturaSeccion=[];
        propuesta.seccionAsignaturas?.forEach(rel=>{
            const asignaturaId=asignaturaIds.get(String(rel.codigoAsignatura||'').toUpperCase());
            const seccionId=seccionIds.get(normalizarEncabezadoGestor(rel.seccion));
            if(!asignaturaId||!seccionId){ resumen.omitidos++; resumen.detalle.omitidos.push(`Relación sección ${rel.codigoAsignatura} · ${rel.seccion}: incompleta`); return; }
            const existe=data.asignaturaSeccion.some(r=>r.asignaturaId===asignaturaId&&r.seccionId===seccionId);
            if(!existe){
                data.asignaturaSeccion.push({asignaturaId,seccionId,origen:rel.origen||'gestor'});
                resumen.relacionesSeccion++;
                resumen.detalle.relacionesSeccion.push(`${rel.codigoAsignatura} · ${rel.seccion}${String(rel.origen||'').startsWith('gestor-inferido')?' (inferida desde Fusionada)':''}`);
            }
        });

        propuesta.grupos.forEach(g=>{
            const asignaturaId=asignaturaIds.get(String(g.codigoAsignatura||'').toUpperCase());
            const madreId=seccionIds.get(normalizarEncabezadoGestor(g.planificada?.seccion));
            if(!asignaturaId||!madreId){ resumen.omitidos++; resumen.detalle.omitidos.push(`Grupo ${g.codigoAsignatura}: sin asignatura o sección madre`); return; }
            let grupo=getGrupoDictacionAsignaturaSeccion(asignaturaId,madreId);
            if(!grupo){
                const alumnosBase=Number(g.planificada?.alumnos)||0;
                const alumnosVinculados=g.fusionadas.reduce((acc,f)=>acc+(Number(f.alumnos)||0),0);
                grupo=crearGrupoDictacion({
                    asignaturaId,
                    seccionMadreId:madreId,
                    seccionesVinculadasIds:[],
                    idGestorSeccion:g.idGestorSeccion,
                    alumnosBase,
                    alumnosVinculados,
                    alumnosTotales:Number(g.alumnosTotales)||alumnosBase+alumnosVinculados,
                    origen:'gestor',
                    estado:'pendiente'
                });
                if(grupo){
                    resumen.grupos++;
                    resumen.detalle.grupos.push(`${g.codigoAsignatura} · madre ${g.planificada?.seccion||''}`);
                }
            }
            if(!grupo){ resumen.omitidos++; resumen.detalle.omitidos.push(`Grupo ${g.codigoAsignatura}: no se pudo crear`); return; }
            g.fusionadas.forEach(f=>{
                const secId=seccionIds.get(normalizarEncabezadoGestor(f.seccion));
                if(!secId||secId===madreId){ resumen.omitidos++; resumen.detalle.omitidos.push(`Vínculo ${g.codigoAsignatura} · ${f.seccion}: inválido`); return; }
                const antes=grupo.seccionesVinculadasIds.length;
                vincularSeccionAGrupo(grupo.id,secId,{alumnos:f.alumnos});
                if(grupo.seccionesVinculadasIds.length>antes){
                    resumen.vinculos++;
                    resumen.detalle.vinculos.push(`${g.codigoAsignatura}: ${f.seccion} heredada desde ${g.planificada?.seccion||''}`);
                }
            });
        });
        return resumen;
    }
    function mostrarResultadoAplicacionGestor(resumen){
        const cards=Object.entries(resumen).filter(([k])=>k!=='detalle').map(([k,v])=>`<div><span>${escapeHTML(k)}</span><strong>${v}</strong></div>`).join('');
        const detalle=resumen.detalle||{};
        const detalleHtml=Object.entries(detalle)
            .filter(([,items])=>Array.isArray(items)&&items.length)
            .map(([k,items])=>`
                <div class="dashboard-detail-table" style="margin-top:10px;">
                    <div class="form-label">${escapeHTML(k)} (${items.length})</div>
                    <table class="report-table"><tbody>${items.slice(0,8).map(x=>`<tr><td>${escapeHTML(x)}</td></tr>`).join('')}</tbody></table>
                    ${items.length>8?`<p class="auto-plan-empty">Se muestran 8 de ${items.length} registros.</p>`:''}
                </div>
            `).join('');
        document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <div class="modal-header">
                    <h3>Gestor Secciones aplicado</h3>
                    <p>Se crearon solo elementos faltantes. No se eliminaron datos ni se sobreescribieron diferencias existentes.</p>
                </div>
                <div class="export-preview-grid">${cards}</div>
                ${detalleHtml||'<p class="auto-plan-empty">No hubo elementos nuevos que detallar.</p>'}
                <div class="modal-actions">
                    <button class="btn" id="btnCerrarResultadoGestor">Cerrar</button>
                    <button class="btn" id="btnVerHistorialGestor">Ver historial</button>
                    <button class="btn btn-primary" id="btnVerFusionesGestor">Ver reporte de fusiones</button>
                </div>
            </div></div>`;
        const cerrar=()=>{ document.getElementById('modalContainer').innerHTML=''; };
        document.getElementById('btnCerrarResultadoGestor').onclick=cerrar;
        document.getElementById('modalOverlay').onclick=(e)=>{ if(e.target===e.currentTarget) cerrar(); };
        document.getElementById('btnVerHistorialGestor').onclick=()=>{
            cerrar();
            activarTab('historial');
        };
        document.getElementById('btnVerFusionesGestor').onclick=()=>{
            cerrar();
            if(activarTab('reportes')!==false){
                const sel=document.getElementById('reporteTipo');
                if(sel){ sel.value='gruposDictacion'; actualizarReporte(); }
            }
        };
    }
    function mostrarPreviewGestorSecciones(analisis,nombreArchivo){
        const resumen=Object.entries(analisis.resumen).map(([k,v])=>`<div><span>${escapeHTML(k)}</span><strong>${v}</strong></div>`).join('');
        const colsDetectadas=Object.entries(analisis.cols).map(([k,idx])=>`<span class="item-chip">${escapeHTML(k)}: ${escapeHTML(analisis.headers[idx]||'')}</span>`).join('');
        const propuesta=analisis.propuesta||{carreras:[],niveles:[],secciones:[],asignaturas:[],relaciones:[],seccionAsignaturas:[],grupos:[]};
        const revision=validarPropuestaGestor(propuesta);
        const opcionesFiltro=opcionesFiltroGestor(analisis.registros||[]);
        const filtroHtml=opcionesFiltro.length?`
            <div class="gestor-filter-panel">
                <div class="gestor-filter-header">
                    <div>
                        <strong>Filtrar qué se cargará en la app</strong>
                        <span>La app cargará solo las carreras seleccionadas y conservará las filas externas que expliquen herencias por ID. Así la pestaña queda más ligera y las relaciones de otras áreas quedan como pendientes.</span>
                    </div>
                    <div class="gestor-filter-actions">
                        <button class="btn btn-xs" id="gestorFiltroTodo" type="button">Todas</button>
                        <button class="btn btn-xs" id="gestorFiltroNada" type="button">Ninguna</button>
                    </div>
                </div>
                <div class="gestor-filter-grid">
                    ${opcionesFiltro.map((area,idx)=>`
                        <div class="gestor-filter-area">
                            <label><input type="checkbox" class="gestor-filter-area-check" data-area-idx="${idx}" checked> ${escapeHTML(area.area)} <small>${area.carreras.length} carrera(s) · ${area.filas} fila(s)</small></label>
                            <div class="gestor-filter-careers">
                                ${area.carreras.map(c=>`
                                    <label>
                                        <input type="checkbox" class="gestor-filter-career-check" data-area-idx="${idx}" value="${escapeAttr(c.carreraKey)}" checked>
                                        <span>${escapeHTML(c.nombre)} <small>${escapeHTML(c.codigo||c.carreraKey)} · ${c.secciones} sección(es) · ${c.asignaturas} asignatura(s)</small></span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`:'';
        const cuentaNuevos=(items)=>items.filter(x=>!x.existe).length;
        const resumenPropuesta=[
            ['Carreras nuevas',cuentaNuevos(propuesta.carreras),propuesta.carreras.length],
            ['Niveles propuestos',propuesta.niveles.length,propuesta.niveles.length],
            ['Secciones nuevas',cuentaNuevos(propuesta.secciones),propuesta.secciones.length],
            ['Asignaturas nuevas',cuentaNuevos(propuesta.asignaturas),propuesta.asignaturas.length],
            ['Relaciones carrera/nivel',propuesta.relaciones.length,propuesta.relaciones.length],
            ['Relaciones sección/asignatura',propuesta.seccionAsignaturas?.length||0,propuesta.seccionAsignaturas?.length||0],
            ['Grupos de dictación candidatos',propuesta.grupos.length,propuesta.grupos.length]
        ].map(([label,val,total])=>`<div><span>${escapeHTML(label)}</span><strong>${val}${total!==val?`/${total}`:''}</strong></div>`).join('');
        const resumenRevision=[
            ['Críticos',revision.conteo.criticos],
            ['Advertencias',revision.conteo.advertencias],
            ['Revisión',revision.conteo.info],
            ['Crear carreras',revision.conteo.crearCarreras],
            ['Crear niveles',revision.conteo.crearNiveles],
            ['Crear secciones',revision.conteo.crearSecciones],
            ['Crear asignaturas',revision.conteo.crearAsignaturas],
            ['Crear relaciones',revision.conteo.crearRelaciones],
            ['Crear relaciones sección',revision.conteo.crearRelacionesSeccion],
            ['Crear grupos',revision.conteo.crearGrupos]
        ].map(([label,val])=>`<div><span>${escapeHTML(label)}</span><strong>${val}</strong></div>`).join('');
        const revisionHtml=revision.issues.length
            ? `<div class="dashboard-validation-list">${revision.issues.slice(0,10).map(i=>`<div class="dashboard-validation-item ${i.sev==='critico'?'danger':i.sev==='advertencia'?'warning':'info'}"><span>${escapeHTML(i.sev==='critico'?'Crítico':i.sev==='advertencia'?'Advertencia':'Revisión')}</span><strong>${escapeHTML(i.titulo)}</strong><em>${escapeHTML(i.detalle)}</em></div>`).join('')}</div>${revision.issues.length>10?`<p class="auto-plan-empty">Se muestran 10 de ${revision.issues.length} señales.</p>`:''}`
            : '<p class="auto-plan-empty">No se detectaron choques relevantes con los datos actuales. La propuesta queda lista para preparar aplicación controlada.</p>';
        const muestrasGrupos=propuesta.grupos.slice(0,8).map(g=>`
            <tr>
                <td>${escapeHTML(g.idGestorSeccion||'')}</td>
                <td>${escapeHTML(g.codigoAsignatura)}</td>
                <td>${escapeHTML([g.planificada?.seccion,g.planificada?.carreraKey,(g.planificada?.nivelKey||'').split('|')[1]].filter(Boolean).join(' · '))}</td>
                <td>${escapeHTML(g.fusionadas.map(f=>[f.seccion,f.carreraKey,(f.nivelKey||'').split('|')[1]].filter(Boolean).join(' · ')).join(' | '))}</td>
                <td>${g.fusionadas.length}</td>
                <td>${g.alumnosTotales||''}</td>
            </tr>
        `).join('');
        const muestrasAsignaturas=propuesta.asignaturas.slice(0,8).map(a=>`
            <tr>
                <td>${escapeHTML(a.existe?'Existe':'Nueva')}</td>
                <td>${escapeHTML(a.codigo)}</td>
                <td>${escapeHTML(a.nombre)}</td>
                <td>${escapeHTML(a.modalidad)}</td>
                <td>${a.horasTotales}/${a.horasPresenciales}/${a.horasVirtuales}</td>
            </tr>
        `).join('');
        const muestras=analisis.registros.slice(0,8).map(r=>`
            <tr>
                <td>${escapeHTML(r.periodo)}</td>
                <td>${escapeHTML(r.programaCarrera)}</td>
                <td>${escapeHTML(r.jornada)}</td>
                <td>${escapeHTML(r.nivel)}</td>
                <td>${escapeHTML(r.seccion)}</td>
                <td>${escapeHTML(r.codigoAsignatura)}</td>
                <td>${escapeHTML(r.asignatura)}</td>
                <td>${escapeHTML(r.tipo)}</td>
                <td>${r.horas}/${r.horasPresenciales}/${r.horasVirtuales}</td>
            </tr>
        `).join('');
        const alertas=analisis.advertencias.length
            ? `<div class="dashboard-validation-list">${analisis.advertencias.map(a=>`<div class="dashboard-validation-item ${analisis.faltantes.length?'danger':'warning'}"><span>Revisión</span><strong>Gestor Secciones</strong><em>${escapeHTML(a)}</em></div>`).join('')}</div>`
            : '<p class="auto-plan-empty">La estructura mínima se detectó correctamente. Esta vista aún no modifica datos.</p>';
        document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal auto-general-modal">
                <div class="modal-header">
                    <h3>Vista previa Gestor Secciones</h3>
                    <p>Archivo: <strong>${escapeHTML(nombreArchivo)}</strong>. Fase 4.4 permite aplicar la propuesta de forma controlada: crea faltantes, sin borrar ni sobreescribir diferencias.</p>
                </div>
                <div class="export-preview-grid">${resumen}</div>
                ${alertas}
                <div style="margin:12px 0;">
                    <div class="form-label">Columnas detectadas</div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">${colsDetectadas||'<span class="item-chip">Sin columnas detectadas</span>'}</div>
                </div>
                ${filtroHtml}
                <div style="margin:12px 0;">
                    <div class="form-label">Propuesta normalizada</div>
                    <div class="export-preview-grid">${resumenPropuesta}</div>
                </div>
                <div style="margin:12px 0;">
                    <div class="form-label">Revisión antes de aplicar</div>
                    <div class="export-preview-grid">${resumenRevision}</div>
                    ${revisionHtml}
                </div>
                <div class="dashboard-detail-table" style="margin-bottom:12px;">
                    <div class="form-label">Asignaturas propuestas</div>
                    <table class="report-table">
                        <thead><tr><th>Estado</th><th>Código</th><th>Asignatura</th><th>Modalidad</th><th>H/P/V</th></tr></thead>
                        <tbody>${muestrasAsignaturas||'<tr><td colspan="5">Sin asignaturas para mostrar</td></tr>'}</tbody>
                    </table>
                </div>
                <div class="dashboard-detail-table" style="margin-bottom:12px;">
                    <div class="form-label">Grupos de dictación candidatos</div>
                    <table class="report-table">
                        <thead><tr><th>ID Gestor</th><th>Asignatura</th><th>Sección madre tentativa</th><th>Secciones heredadas tentativas</th><th>N°</th><th>Alumnos</th></tr></thead>
                        <tbody>${muestrasGrupos||'<tr><td colspan="6">Sin grupos candidatos todavía</td></tr>'}</tbody>
                    </table>
                </div>
                <div class="dashboard-detail-table">
                    <div class="form-label">Muestra de filas leídas</div>
                    <table class="report-table">
                        <thead><tr><th>Periodo</th><th>Programa</th><th>Jornada</th><th>Nivel</th><th>Sección</th><th>Código</th><th>Asignatura</th><th>Tipo</th><th>H/P/V</th></tr></thead>
                        <tbody>${muestras||'<tr><td colspan="9">Sin filas para mostrar</td></tr>'}</tbody>
                    </table>
                </div>
                <div class="modal-actions">
                    <button class="btn" id="btnCerrarPreviewGestor">Cerrar</button>
                    <button class="btn btn-primary" id="btnAplicarPreviewGestor" ${analisis.faltantes.length?'disabled':''}>Aplicar propuesta</button>
                </div>
            </div></div>`;
        const cerrar=()=>{ document.getElementById('modalContainer').innerHTML=''; };
        const syncFiltroAreas=()=>{
            document.querySelectorAll('.gestor-filter-area-check').forEach(areaEl=>{
                const idx=areaEl.dataset.areaIdx;
                const hijos=[...document.querySelectorAll(`.gestor-filter-career-check[data-area-idx="${idx}"]`)];
                const checked=hijos.filter(x=>x.checked).length;
                areaEl.checked=checked===hijos.length&&hijos.length>0;
                areaEl.indeterminate=checked>0&&checked<hijos.length;
            });
        };
        const leerFiltroPreview=()=>({
            carreras:[...document.querySelectorAll('.gestor-filter-career-check:checked')].map(x=>x.value).filter(Boolean)
        });
        document.getElementById('gestorFiltroTodo')?.addEventListener('click',()=>{
            document.querySelectorAll('.gestor-filter-career-check,.gestor-filter-area-check').forEach(x=>{ x.checked=true; x.indeterminate=false; });
        });
        document.getElementById('gestorFiltroNada')?.addEventListener('click',()=>{
            document.querySelectorAll('.gestor-filter-career-check,.gestor-filter-area-check').forEach(x=>{ x.checked=false; x.indeterminate=false; });
        });
        document.querySelectorAll('.gestor-filter-area-check').forEach(areaEl=>{
            areaEl.addEventListener('change',()=>{
                const idx=areaEl.dataset.areaIdx;
                document.querySelectorAll(`.gestor-filter-career-check[data-area-idx="${idx}"]`).forEach(x=>{ x.checked=areaEl.checked; });
                syncFiltroAreas();
            });
        });
        document.querySelectorAll('.gestor-filter-career-check').forEach(x=>x.addEventListener('change',syncFiltroAreas));
        syncFiltroAreas();
        document.getElementById('btnCerrarPreviewGestor').onclick=cerrar;
        document.getElementById('btnAplicarPreviewGestor')?.addEventListener('click',()=>{
            const filtro=leerFiltroPreview();
            const preparado=prepararRegistrosAplicacionGestor(analisis.registros||[],filtro);
            const registrosAplicar=preparado.seleccionados;
            if(!registrosAplicar.length){
                toast('Selecciona al menos una carrera para aplicar el Gestor','error');
                return;
            }
            const propuestaAplicar=normalizarPropuestaGestor(registrosAplicar,{permitirMadreInferida:false});
            const revisionAplicar=validarPropuestaGestor(propuestaAplicar);
            if(revisionAplicar.conteo.criticos||analisis.faltantes.length){
                toast('Corrige las señales críticas antes de aplicar','error');
                return;
            }
            const msg=[
                `Se crearán elementos faltantes desde el Gestor Secciones.`,
                `Filas seleccionadas: ${registrosAplicar.length} de ${analisis.registros.length}`,
                `Filas externas conservadas para trazabilidad: ${preparado.externos}`,
                `Carreras: ${revisionAplicar.conteo.crearCarreras}`,
                `Niveles: ${revisionAplicar.conteo.crearNiveles}`,
                `Secciones: ${revisionAplicar.conteo.crearSecciones}`,
                `Asignaturas: ${revisionAplicar.conteo.crearAsignaturas}`,
                `Relaciones: ${revisionAplicar.conteo.crearRelaciones}`,
                `Grupos: ${revisionAplicar.conteo.crearGrupos}`,
                '',
                'La memoria guardará las carreras seleccionadas y las filas externas necesarias para rastrear herencias por ID.',
                'No se borrarán datos existentes ni se sobreescribirán diferencias. ¿Continuar?'
            ].join('\n');
            if(!confirm(msg)) return;
            guardarRespaldoAntesDeImportar();
            pushUndo();
            const analisisMemoria=Object.assign({},analisis,{
                registros:preparado.memoria,
                resumen:Object.assign({},analisis.resumen,{filasOriginales:analisis.registros.length,filasMemoria:preparado.memoria.length,filasSeleccionadas:registrosAplicar.length})
            });
            guardarMemoriaGestor(analisisMemoria,nombreArchivo,{carrerasSeleccionadas:filtro.carreras});
            const resultado=aplicarPropuestaGestor(propuestaAplicar);
            auditoria('gestor_secciones_importado',{
                archivo:nombreArchivo,
                resumen:Object.fromEntries(Object.entries(resultado).filter(([k])=>k!=='detalle')),
                detalle:Object.fromEntries(Object.entries(resultado.detalle||{}).map(([k,v])=>[k,(v||[]).slice(0,20)])),
                filas:analisis.registros.length,
                filasAplicadas:registrosAplicar.length,
                filasMemoria:preparado.memoria.length,
                carrerasFiltro:filtro.carreras
            });
            normalizarDatos();
            reconstruirIndices();
            guardar({forzar:true});
            refrescarTodo();
            mostrarResultadoAplicacionGestor(resultado);
            toast('Gestor Secciones aplicado','success');
        });
        document.getElementById('modalOverlay').onclick=(e)=>{ if(e.target===e.currentTarget) cerrar(); };
    }
    function previsualizarGestorSecciones(){
        if(!window.XLSX?.read || !window.XLSX?.utils?.sheet_to_json){
            toast('No se pudo cargar la librería de Excel. Revisa la conexión e intenta nuevamente.','error');
            return;
        }
        const input=document.createElement('input');
        input.type='file';
        input.accept='.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv';
        input.value='';
        input.style.display='none';
        input.onchange=e=>{
            const file=e.target.files[0];
            if(!file){ input.remove(); return; }
            const reader=new FileReader();
            reader.onload=ev=>{
                try{
                    const wb=window.XLSX.read(ev.target.result,{type:'array'});
                    const sheetName=wb.SheetNames[0];
                    if(!sheetName) throw new Error('Sin hojas');
                    const aoa=window.XLSX.utils.sheet_to_json(wb.Sheets[sheetName],{header:1,defval:''});
                    const analisis=analizarGestorSecciones(aoa);
                    mostrarPreviewGestorSecciones(analisis,file.name);
                }catch(err){
                    toast('No se pudo leer el Gestor Secciones','error');
                }finally{
                    input.value='';
                    input.remove();
                }
            };
            reader.onerror=()=>{
                toast('No se pudo leer el archivo','error');
                input.value='';
                input.remove();
            };
            reader.readAsArrayBuffer(file);
        };
        input.oncancel=()=>input.remove();
        document.body.appendChild(input);
        input.click();
    }
    function aplicarUltimoGestorDesdePestana(){
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        const cargas=data.gestorSecciones.cargas||[];
        const ultima=cargas.find(c=>c.id===data.gestorSecciones.ultimaCargaId)||cargas[0]||null;
        if(!ultima) return toast('Carga un Gestor antes de aplicar una propuesta','info');
        const registros=(data.gestorSecciones.filas||[]).filter(f=>f.cargaId===ultima.id);
        if(!registros.length) return toast('La última carga no tiene filas disponibles para aplicar','error');
        const filtroGuardado=data.gestorSecciones.filtroAplicacion?.cargaId===ultima.id?data.gestorSecciones.filtroAplicacion:null;
        const registrosAplicar=filtroGuardado?.carreras?.length?filtrarRegistrosGestor(registros,filtroGuardado):registros;
        if(!registrosAplicar.length) return toast('El filtro guardado no contiene filas aplicables. Vuelve a cargar el Gestor y selecciona carreras.','error');
        const propuesta=normalizarPropuestaGestor(registrosAplicar,{permitirMadreInferida:false});
        const revision=validarPropuestaGestor(propuesta);
        if(revision.conteo.criticos){
            return toast(`No se puede aplicar: hay ${revision.conteo.criticos} señal(es) crítica(s) en la propuesta`, 'error');
        }
        const msg=[
            `Se aplicará la última carga del Gestor: ${ultima.archivo||'sin nombre'}.`,
            `Filas seleccionadas: ${registrosAplicar.length} de ${registros.length}`,
            `Carreras: ${revision.conteo.crearCarreras}`,
            `Niveles: ${revision.conteo.crearNiveles}`,
            `Secciones: ${revision.conteo.crearSecciones}`,
            `Asignaturas: ${revision.conteo.crearAsignaturas}`,
            `Relaciones: ${revision.conteo.crearRelaciones}`,
            `Grupos: ${revision.conteo.crearGrupos}`,
            '',
            'No se borrarán datos existentes ni se sobreescribirán diferencias. ¿Continuar?'
        ].join('\n');
        if(!confirm(msg)) return;
        guardarRespaldoAntesDeImportar();
        pushUndo();
        const resultado=aplicarPropuestaGestor(propuesta);
        auditoria('gestor_secciones_aplicado_desde_pestana',{
            archivo:ultima.archivo||'',
            resumen:Object.fromEntries(Object.entries(resultado).filter(([k])=>k!=='detalle')),
            filas:registros.length,
            filasAplicadas:registrosAplicar.length,
            carrerasFiltro:filtroGuardado?.carreras||[]
        });
        normalizarDatos();
        reconstruirIndices();
        guardar({forzar:true});
        refrescarTodo();
        mostrarResultadoAplicacionGestor(resultado);
        toast('Gestor Secciones aplicado','success');
    }
    function limpiarTodo(){
        if(confirm('¿Eliminar todos los datos?')){ data={carreras:[],niveles:[],secciones:[],asignaturas:[],docentes:[],salas:[],asignaturaCarreraNivel:[],asignaturaSeccion:[],planificaciones:[],gruposDictacion:[],gestorSecciones:{cargas:[],ids:[],ultimaCargaId:null},configuracion:JSON.parse(JSON.stringify(CONFIG_DEFAULT)),modoPlan:false,sel:{}}; aplicarFuente(); guardar(); cargar(); reconstruirIndices(); refrescarTodo(); toast('Datos eliminados','info'); }
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
    document.getElementById('btnExportar').addEventListener('click',()=>document.getElementById('exportDropdown').classList.toggle('show'));
    document.getElementById('btnMenu').addEventListener('click',()=>{ actualizarEstadoRespaldoLocal(); document.getElementById('menuDropdown').classList.toggle('show'); });
    document.getElementById('btnGestorCargar')?.addEventListener('click',previsualizarGestorSecciones);
    document.getElementById('btnGestorAplicar')?.addEventListener('click',aplicarUltimoGestorDesdePestana);
    document.getElementById('btnGestorExportarInforme')?.addEventListener('click',exportarInformeGestor);
    document.getElementById('gestorTablaBusqueda')?.addEventListener('input',()=>{
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        data.gestorSecciones.tablaLimite=250;
        renderTablaGestorSecciones();
    });
    document.getElementById('clearGestorTablaBusqueda')?.addEventListener('click',()=>{
        const input=document.getElementById('gestorTablaBusqueda');
        if(input) input.value='';
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        data.gestorSecciones.tablaLimite=250;
        renderTablaGestorSecciones();
    });
    document.getElementById('btnGestorMostrarMas')?.addEventListener('click',()=>{
        data.gestorSecciones=normalizarGestorSeccionesData(data.gestorSecciones);
        data.gestorSecciones.tablaLimite=(Number(data.gestorSecciones.tablaLimite)||250)+250;
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
                data.gestorSecciones.tablaLimite=250;
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
    function ejecutarAccionMenu(action) {
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
                if(hayConflictoRemoto() && !confirm('Hay cambios locales pendientes guardados en este navegador. ¿Sincronizar desde la nube y reemplazar la vista actual?')) return;
                recargarDesdeFirestore();
                break;
            case 'cambiarPassword': abrirCambioPassword(); break;
            case 'abrirConfiguracion': abrirConfiguracion(); break;
            case 'limpiarTodo': limpiarTodo(); break;
        }
    }
    document.querySelectorAll('.dropdown-menu').forEach(menu=>menu.addEventListener('click',(e)=>{
        const action=e.target.dataset.action; if(action) ejecutarAccionMenu(action); menu.classList.remove('show');
    }));
    document.addEventListener('click',(e)=>{if(!e.target.closest('.dropdown')) document.querySelectorAll('.dropdown-menu').forEach(m=>m.classList.remove('show'));});
    document.addEventListener('click',(e)=>{if(!e.target.closest('.search-box')) document.querySelectorAll('.search-results').forEach(r=>{ r.classList.remove('show'); r.querySelectorAll('li').forEach(li=>li.classList.remove('kb-focus')); });});

    function activarTab(tab){
        const btn=document.querySelector(`.tab-btn[data-tab="${tab}"]`);
        if(!btn) return false;
        if(data.modoPlan && !confirm('Estás en modo planificación. ¿Salir sin guardar los cambios pendientes?')) return false;
        if(data.modoPlan){ data.modoPlan=false; actualizarModoPlanificacionUI(); }
        if(document.querySelector('.tab-panel.active')?.id==='panelFichaDocente'){
            document.getElementById('fichaDocente').value=''; document.getElementById('fichaContenido').style.display='none';
        }
        document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
        document.getElementById('panel'+tab.charAt(0).toUpperCase()+tab.slice(1)).classList.add('active');
        if(tab==='fichaDocente'){
            actualizarFichaDocentes();
            const sel=document.getElementById('fichaDocente'); if(sel?.value) renderFichaDocente();
        }
        if(tab==='historial') renderHistorial();
        if(tab==='gestorSecciones') renderGestorSecciones();
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
        data.sel.docenteId=null;
        data.sel.salaId=null;
        actualizarSelectoresPlan();
        construirGrilla();
        actualizarProgresoPlan();
        document.getElementById('scheduleContainer')?.scrollIntoView({behavior:'smooth',block:'start'});
        toast(opciones.mensaje||`Revisando sección ${sec.nombre}`,'info');
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
        // ── Undo / Redo ──────────────────────────────────────────────────────
        if((e.ctrlKey||e.metaKey) && e.key==='z' && !e.shiftKey){ e.preventDefault(); deshacer(); return; }
        if((e.ctrlKey||e.metaKey) && (e.key==='z' && e.shiftKey || e.key==='y')){ e.preventDefault(); rehacer(); return; }

        const inTextArea = e.target.tagName === 'TEXTAREA';
        const inInput = e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT';
        const searchPair = getActiveSearchPair();

        // ── Escape: cerrar capas de afuera hacia adentro ─────────────────────
        if (e.key === 'Escape') {
            // 1. Popup de acción de celda
            if (App._popupAbierto) { cerrarPopupAccion(); e.preventDefault(); return; }
            // 2. Listas de búsqueda abiertas
            const openList = document.querySelector('.search-results.show');
            if (openList) { openList.classList.remove('show'); openList.querySelectorAll('li').forEach(li=>li.classList.remove('kb-focus')); e.preventDefault(); return; }
            // 3. Dropdowns de menú abiertos
            const openDropdown = document.querySelector('.dropdown-menu.show');
            if (openDropdown) { openDropdown.classList.remove('show'); e.preventDefault(); return; }
            // 4. Modal abierto
            if (document.getElementById('modalOverlay')) { cerrarModal(); e.preventDefault(); return; }
            // 5. Modo planificación activo
            if (data.modoPlan) { document.getElementById('btnCancelarModo').click(); e.preventDefault(); return; }
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

    cargar().then(()=>{
        Reportes.init();
        FichaDocente.init();
        Entidades.init();
        VistaHorario.init();
        Planificacion.init();
        Configuracion.init();
        actualizarSelectorTemporada(); aplicarPaleta(); aplicarFuente(); actualizarIndicadorPaleta(); actualizarEstadoRespaldoLocal(); refrescarTodo();
        if(document.getElementById('fichaDocente')) actualizarFichaDocentes();
        // Sin autoguardado por intervalo — cada acción llama a guardar() directamente
        // Esto evita que un usuario pise los cambios del otro en entorno multiusuario
    });
})();
}; // fin window._iniciarApp

if (window._appDebeIniciar && !window._appIniciada) {
    window._appDebeIniciar = false;
    window._appIniciada = true;
    window._iniciarApp();
}
