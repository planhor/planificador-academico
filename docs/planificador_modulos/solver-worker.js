self.window=self;

importScripts('planificacion.js?v=20260621-fase3-indices');

const DIAS=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const BLOQUES=[
    {n:1,hIni:480,hFin:525},{n:2,hIni:525,hFin:570},{n:3,hIni:580,hFin:625},{n:4,hIni:625,hFin:670},
    {n:5,hIni:680,hFin:725},{n:6,hIni:725,hFin:770},{n:7,hIni:795,hFin:840},{n:8,hIni:840,hFin:885},
    {n:9,hIni:895,hFin:940},{n:10,hIni:940,hFin:985},{n:11,hIni:995,hFin:1040},{n:12,hIni:1040,hFin:1085},
    {n:13,hIni:1110,hFin:1150},{n:14,hIni:1150,hFin:1190},{n:15,hIni:1190,hFin:1230},{n:16,hIni:1230,hFin:1270},
    {n:17,hIni:1270,hFin:1310},{n:18,hIni:1310,hFin:1350}
];
const DOCENTE_NN_ID='__docente_nn__';
const SALA_VIRTUAL_ID='__virtual__';
const SALA_TRO2_ID='__tro2__';

function mismoId(a,b){ return String(a??'')===String(b??''); }

function crearContexto(data){
    const grupos=Array.isArray(data.gruposDictacion)?data.gruposDictacion:[];
    const estadoDictacion=(asigId,seccionId)=>{
        const grupo=grupos.find(g=>
            mismoId(g.asignaturaId,asigId)&&
            (mismoId(g.seccionMadreId,seccionId)||(g.seccionesVinculadasIds||[]).some(id=>mismoId(id,seccionId)))
        );
        if(!grupo) return {estado:'sin-grupo',grupo:null};
        return mismoId(grupo.seccionMadreId,seccionId)?{estado:'dictada-aqui',grupo}:{estado:'vinculada',grupo};
    };
    const indicePlan=()=>Object.fromEntries((data.planificaciones||[]).map(plan=>[`${plan.seccionId}_${plan.dia}_${plan.bloque}`,plan]));
    const ocupacionSala=()=>Object.fromEntries((data.planificaciones||[]).filter(p=>p.salaId).map(plan=>[`${plan.salaId}_${plan.dia}_${plan.bloque}`,plan]));
    const contadorDocente=()=>{
        const contador={};
        (data.planificaciones||[]).forEach(plan=>{ contador[plan.docenteId]=(contador[plan.docenteId]||0)+1; });
        return contador;
    };
    return {
        getData:()=>data,
        getGruposDictacion:()=>grupos,
        getEstadoDictacionAsignatura:estadoDictacion,
        getPlanificacionesFiltradas:(ignorarIds=[])=>{
            const ignorar=new Set(ignorarIds.map(String));
            return (data.planificaciones||[]).filter(plan=>!ignorar.has(String(plan.id)));
        },
        getIndicePlan:indicePlan,
        getOcupacionSala:ocupacionSala,
        getContadorDocente:contadorDocente,
        getBloque:n=>BLOQUES.find(b=>b.n===Number(n))||null,
        parsearCodigoSeccion:codigo=>({tipo:String(codigo||'').startsWith('V-')?'V':'D'}),
        DIAS,
        BLOQUES,
        DOCENTE_NN_ID,
        SALA_VIRTUAL_ID,
        SALA_TRO2_ID,
        escapeHTML:valor=>String(valor??''),
        escapeAttr:valor=>String(valor??''),
        optionHTML:()=>'',
        genId:()=>`worker-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        toast:()=>{},
        pushUndo:()=>{},
        auditoria:()=>{},
        guardar:()=>{},
        reconstruirIndices:()=>{}
    };
}

self.onmessage=event=>{
    const {id,data,opciones,objetivos=[]}=event.data||{};
    try{
        if(!data||!self.PlanificadorPlanificacion?.create) throw new Error('solver-worker-contexto-invalido');
        const api=self.PlanificadorPlanificacion.create(crearContexto(data));
        const lista=objetivos.length?objetivos:[opciones?.objetivo||'auto'];
        const resultados=lista.map(objetivo=>({
            objetivo,
            sim:api.simularOptimizacionIterativa(Object.assign({},opciones,{objetivo}))
        }));
        self.postMessage({id,ok:true,resultados});
    }catch(error){
        self.postMessage({id,ok:false,error:String(error?.message||error)});
    }
};
