self.window=self;

importScripts('planificacion.js?v=20260622-solver-hibrido');

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
let glpkPromise=null;

function cargarGLPK(){
    if(glpkPromise) return glpkPromise;
    glpkPromise=(async()=>{
        const modulo=await import('./vendor/glpk/glpk.js?v=5.0.0');
        const respuesta=await fetch(new URL('./vendor/glpk/glpk.wasm',self.location.href));
        if(!respuesta.ok) throw new Error(`glpk-wasm-${respuesta.status}`);
        return modulo.default(await respuesta.arrayBuffer());
    })().catch(error=>{
        glpkPromise=null;
        throw error;
    });
    return glpkPromise;
}

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

async function resolverConGLPK(api,opciones,objetivo){
    const inicio=performance.now();
    const preparacion=api.prepararOptimizacionMatematica(Object.assign({},opciones,{objetivo}));
    if(!preparacion.candidatos.length){
        const vacio=api.construirResultadoOptimizacionMatematica(preparacion,[]);
        vacio.glpk={estado:'sin-candidatos',tiempoMs:Math.round(performance.now()-inicio)};
        return vacio;
    }
    const glpk=await cargarGLPK();
    const vars=preparacion.candidatos.map(c=>({name:c.id,coef:c.peso}));
    const subjectTo=[{
        name:'max_movimientos',
        vars:preparacion.candidatos.map(c=>({name:c.id,coef:1})),
        bnds:{type:glpk.GLP_UP,lb:0,ub:preparacion.maxMovimientos}
    }];
    preparacion.incompatibles.forEach((par,indice)=>subjectTo.push({
        name:`incompatible_${indice+1}`,
        vars:par.map(name=>({name,coef:1})),
        bnds:{type:glpk.GLP_UP,lb:0,ub:1}
    }));
    const modelo={
        name:'planhor_optimizacion',
        objective:{direction:glpk.GLP_MAX,name:'mejora',vars},
        subjectTo,
        binaries:preparacion.candidatos.map(c=>c.id)
    };
    const limite=opciones.profundidad==='profundo'?90:opciones.profundidad==='rapido'?20:45;
    const solucion=glpk.solve(modelo,{msglev:glpk.GLP_MSG_OFF,presol:true,tmlim:limite,mipgap:0.01});
    const estado=solucion?.result?.status;
    if(![glpk.GLP_OPT,glpk.GLP_FEAS].includes(estado)) throw new Error(`glpk-sin-solucion-${estado}`);
    const seleccionados=Object.entries(solucion.result.vars||{}).filter(([,valor])=>Number(valor)>0.5).map(([id])=>id);
    const resultado=api.construirResultadoOptimizacionMatematica(preparacion,seleccionados);
    resultado.glpk={
        estado:estado===glpk.GLP_OPT?'optimo':'factible',
        version:glpk.version||'',
        objetivo:Number(solucion.result.z)||0,
        tiempoMs:Math.round(performance.now()-inicio),
        variables:preparacion.candidatos.length,
        restricciones:subjectTo.length
    };
    return resultado;
}

async function resolverHibrido(api,opciones,objetivo){
    const inicio=performance.now();
    const maxTotal=Math.max(1,Math.min(30,Number(opciones.maxMovimientos)||8));
    const maxHeuristico=Math.max(1,Math.ceil(maxTotal/2));
    const heuristico=api.simularOptimizacionIterativa(Object.assign({},opciones,{objetivo,maxMovimientos:maxHeuristico}));
    heuristico.motor='heuristico';
    const restantes=Math.max(0,maxTotal-heuristico.movimientos.length);
    if(!restantes){
        heuristico.motor='hibrido';
        heuristico.hibrido={heuristico:heuristico.movimientos.length,matematico:0,estado:'limite-completo',tiempoMs:Math.round(performance.now()-inicio)};
        return heuristico;
    }
    try{
        const matematico=await resolverConGLPK(api,Object.assign({},opciones,{
            objetivo,
            maxMovimientos:restantes,
            basePlanificaciones:heuristico.planificaciones
        }),objetivo);
        return Object.assign({},matematico,{
            scoreInicial:heuristico.scoreInicial,
            deltaScore:matematico.scoreFinal.score-heuristico.scoreInicial.score,
            perdidaReducida:heuristico.scoreInicial.perdida-matematico.scoreFinal.perdida,
            movimientos:[...heuristico.movimientos,...matematico.movimientos],
            diagnosticoInicial:heuristico.diagnosticoInicial,
            motor:'hibrido',
            hibrido:{
                heuristico:heuristico.movimientos.length,
                matematico:matematico.movimientos.length,
                estado:'completo',
                tiempoMs:Math.round(performance.now()-inicio)
            }
        });
    }catch(error){
        heuristico.motor='hibrido';
        heuristico.hibrido={heuristico:heuristico.movimientos.length,matematico:0,estado:'fallback-heuristico',error:String(error?.message||error),tiempoMs:Math.round(performance.now()-inicio)};
        return heuristico;
    }
}

self.onmessage=async event=>{
    const {id,data,opciones,objetivos=[],comando}=event.data||{};
    try{
        if(comando==='verificar-glpk'){
            const glpk=await cargarGLPK();
            self.postMessage({id,ok:true,glpk:{version:glpk.version||'',disponible:true}});
            return;
        }
        if(!data||!self.PlanificadorPlanificacion?.create) throw new Error('solver-worker-contexto-invalido');
        const api=self.PlanificadorPlanificacion.create(crearContexto(data));
        const lista=objetivos.length?objetivos:[opciones?.objetivo||'auto'];
        const motor=opciones?.motorSolver||'heuristico';
        const resultados=[];
        for(const objetivo of lista){
            let sim;
            if(motor==='matematico') sim=await resolverConGLPK(api,opciones,objetivo);
            else if(motor==='hibrido') sim=await resolverHibrido(api,opciones,objetivo);
            else {
                sim=api.simularOptimizacionIterativa(Object.assign({},opciones,{objetivo}));
                sim.motor='heuristico';
            }
            resultados.push({objetivo,sim});
        }
        self.postMessage({id,ok:true,resultados});
    }catch(error){
        self.postMessage({id,ok:false,error:String(error?.message||error)});
    }
};
