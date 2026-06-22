(function(){
    function createReportes(ctx){
        const getData = ctx.getData;
        const LABEL_CRITERIOS = {
            area:{especialidad:'Especialidad',transversal:'Transversal',electiva:'Electiva'},
            modalidad:{lectiva:'Lectiva',practica:'Práctica',semipresencial:'Semipresencial','online-teams':'Online TEAMS'},
            condicion:{normal:'Normal','alta-reprobacion':'Alta reprobación','requiere-ayudantia':'Requiere ayudantía','alta-reprobacion-ayudantia':'Alta reprobación + ayudantía'}
        };
        const criterio=(a,campo,defecto)=>LABEL_CRITERIOS[campo][a?.[campo]]||LABEL_CRITERIOS[campo][defecto]||defecto;
        const diaCorto = ['Lu','Ma','Mi','Ju','Vi','Sa'];
        const bloquesTexto=(planes)=>planes
            .slice()
            .sort((a,b)=>a.dia-b.dia||a.bloque-b.bloque)
            .filter((item,idx,arr)=>idx===0||item.dia!==arr[idx-1].dia||item.bloque!==arr[idx-1].bloque)
            .map(item=>`${diaCorto[item.dia]||'?'}-${item.bloque}`)
            .join(', ');
        const reqTotal=(a)=>(Number(a?.bloquesPresenciales)||0)+(Number(a?.bloquesVirtuales)||0);
        const estadoPlanificacion=(planificados,requeridos)=>!requeridos?'Sin requerimiento':planificados>=requeridos?'Completa':planificados>0?'Parcial':'Sin planificar';
        const estadoParcial=(afectados,total,nombre)=>!afectados?'':afectados>=total?`Todo con ${nombre}`:`Parcial: ${afectados}/${total} con ${nombre}`;
        const docentesTexto=(planes,data)=>[...new Set(planes.map(p=>{
            const d=data.docentes.find(doc=>doc.id===p.docenteId);
            return d ? (d.id===ctx.DOCENTE_NN_ID?'Docente NN':`${d.nombre||''} ${d.apellido||''}`.trim()) : '';
        }).filter(Boolean))].join(', ');
        const textoCelda=(cell)=>cell&&typeof cell==='object' ? (cell.text??cell.value??'') : cell;
        const htmlCelda=(cell)=>cell&&typeof cell==='object'&&cell.html ? cell.html : ctx.escapeHTML(textoCelda(cell));
        const detalleCelda=(cell)=>cell&&typeof cell==='object'&&cell.detalle ? cell.detalle : null;
        const accionSeccion=(secId, asignaturaId, etiqueta='Revisar')=>{
            if(!secId) return '';
            return {
                text:etiqueta,
                html:`<button type="button" class="btn btn-xs report-action-btn" data-seccion="${ctx.escapeHTML(secId)}" data-asignatura="${ctx.escapeHTML(asignaturaId||'')}">${ctx.escapeHTML(etiqueta)}</button>`
            };
        };
        const accionEntidad=(tipo,id,etiqueta='Revisar')=>{
            if(!tipo || !id) return '';
            return {
                text:etiqueta,
                html:`<button type="button" class="btn btn-xs report-entity-btn" data-entity-type="${ctx.escapeAttr(tipo)}" data-entity-id="${ctx.escapeAttr(id)}">${ctx.escapeHTML(etiqueta)}</button>`
            };
        };
        const accionReparacion=(accion,payload={},etiqueta='Reparar')=>({
            text:etiqueta,
            html:`<button type="button" class="btn btn-xs btn-warning report-repair-btn" data-repair-action="${ctx.escapeAttr(accion)}" data-repair-payload="${ctx.escapeAttr(JSON.stringify(payload))}">${ctx.escapeHTML(etiqueta)}</button>`
        });
        const limpiarDatosExportacion=(datos)=>datos.map(row=>row.map(textoCelda));
        const nombreAsignatura=(data,id)=>{
            const a=data.asignaturas.find(x=>x.id===id);
            return [a?.codigo,a?.nombre].filter(Boolean).join(' - ');
        };
        const nombreSeccion=(data,id)=>data.secciones.find(s=>s.id===id)?.nombre||'';
        const BLOQUE_HORAS_SEMESTRALES=18;
        const MARGEN_OPERATIVO_DOCENTE=0.15;
        const MAX_DIARIO_DOCENTE_DEFENDIBLE=13;
        const formatoNumero=(n,dec=1)=>Number.isFinite(Number(n))?Number(n).toLocaleString('es-CL',{maximumFractionDigits:dec,minimumFractionDigits:Number(n)%1?dec:0}):'0';
        const formatoPct=(valor,total)=>total?`${formatoNumero(valor/total*100,1)}%`:'0%';
        const bloquesDesdeHoras=(horas)=>{
            const h=Number(horas)||0;
            return h>0?Math.max(1,Math.round(h/BLOQUE_HORAS_SEMESTRALES)):0;
        };
        const lecturaBloques=(bloques,base=null)=>{
            const b=Number(bloques)||0;
            const horas=b*BLOQUE_HORAS_SEMESTRALES;
            const pct=base!==null?` · ${formatoPct(b,Number(base)||0)}`:'';
            return `${formatoNumero(b,1)} bloque(s) (${formatoNumero(horas,0)} h semestrales${pct})`;
        };
        const lecturaHoras=(horas,baseHoras=null)=>{
            const h=Number(horas)||0;
            const bloques=h/BLOQUE_HORAS_SEMESTRALES;
            const pct=baseHoras!==null?` · ${formatoPct(h,Number(baseHoras)||0)}`:'';
            return `${formatoNumero(h,0)} h semestrales (${formatoNumero(bloques,1)} bloque(s)${pct})`;
        };
        const contarDisponibilidadDocente=(doc)=>{
            const disp=Array.isArray(doc?.disponibilidad)?doc.disponibilidad:[];
            const porDia=ctx.DIAS.map((_,dia)=>(Array.isArray(disp[dia])?disp[dia]:[]).filter(Boolean).length);
            const total=porDia.reduce((a,b)=>a+b,0);
            const sabado=porDia[5]||0;
            const sinSabado=total-sabado;
            const diurno=porDia.reduce((acc,cant,dia)=>{
                const fila=Array.isArray(disp[dia])?disp[dia]:[];
                return acc+fila.slice(0,12).filter(Boolean).length;
            },0);
            const vespertino=porDia.reduce((acc,cant,dia)=>{
                const fila=Array.isArray(disp[dia])?disp[dia]:[];
                return acc+fila.slice(12).filter(Boolean).length;
            },0);
            const utilizablePorDia=porDia.map(cant=>Math.min(Number(cant)||0,MAX_DIARIO_DOCENTE_DEFENDIBLE));
            const utilizableTotal=utilizablePorDia.reduce((a,b)=>a+b,0);
            const utilizableSinSabado=utilizableTotal-Math.min(sabado,MAX_DIARIO_DOCENTE_DEFENDIBLE);
            return {porDia,total,sabado,sinSabado,diurno,vespertino,utilizableTotal,utilizableSinSabado};
        };
        const clasificarCargaDefendible=(capacidadHoras,homologoHoras,cargaHoras,sabadoPct)=>{
            if(!homologoHoras) return 'Sin homólogo: usar como referencia de capacidad, no como comparación histórica.';
            const ratio=capacidadHoras/homologoHoras;
            const cargaRatio=cargaHoras/homologoHoras;
            const notas=[];
            if(ratio>=1.1) notas.push('Disponibilidad suficiente para igualar o superar el homólogo.');
            else if(ratio>=0.9) notas.push('Disponibilidad compatible con una carga cercana al homólogo.');
            else if(ratio>=0.7) notas.push('Reducción parcialmente justificable por disponibilidad utilizable.');
            else notas.push('Reducción claramente justificable por disponibilidad utilizable.');
            if(cargaRatio>ratio+0.1) notas.push('La carga actual supera la capacidad defendible; requiere revisión.');
            else if(cargaRatio<ratio-0.2) notas.push('Existe margen disponible no utilizado según esta estimación.');
            if(sabadoPct>=25) notas.push('Alta concentración en sábado; no debe leerse como disponibilidad presencial plena.');
            return notas.join(' ');
        };
        const calcularCargaDefendibleDocente=(doc,data)=>{
            const disp=contarDisponibilidadDocente(doc);
            const bloquesPlanificados=(ctx.getPlanificaciones?.()||data.planificaciones||[]).filter(p=>p.docenteId===doc.id).length;
            const horasActuales=bloquesPlanificados*BLOQUE_HORAS_SEMESTRALES;
            const homologoHoras=Number(doc.horasHomologo)||0;
            const homologoBloques=homologoHoras/BLOQUE_HORAS_SEMESTRALES;
            const capacidadBloques=Math.max(0,disp.utilizableSinSabado*(1-MARGEN_OPERATIVO_DOCENTE));
            const capacidadHoras=capacidadBloques*BLOQUE_HORAS_SEMESTRALES;
            const sabadoPct=disp.total?disp.sabado/disp.total*100:0;
            const diferenciaHoras=horasActuales-homologoHoras;
            return {
                doc,
                disp,
                bloquesPlanificados,
                horasActuales,
                homologoHoras,
                homologoBloques,
                capacidadBloques,
                capacidadHoras,
                diferenciaHoras,
                ratioCapacidad:homologoHoras?capacidadHoras/homologoHoras*100:0,
                ratioActual:homologoHoras?horasActuales/homologoHoras*100:0,
                sabadoPct,
                estado:clasificarCargaDefendible(capacidadHoras,homologoHoras,horasActuales,sabadoPct)
            };
        };
        const asignaturasDeSeccion=(data,sec)=>{
            const nivel=data.niveles.find(n=>n.id===sec?.nivelId);
            const especificas=(data.asignaturaSeccion||[]).filter(r=>r.seccionId===sec?.id).map(r=>r.asignaturaId);
            if(especificas.length) return [...new Set(especificas)];
            return data.asignaturaCarreraNivel
                .filter(r=>r.carreraId===nivel?.carreraId&&r.nivelId===sec?.nivelId)
                .map(r=>r.asignaturaId);
        };
        const seccionesDeAsignatura=(data,rel)=>data.secciones
            .filter(sec=>sec.nivelId===rel.nivelId && asignaturasDeSeccion(data,sec).includes(rel.asignaturaId));
        const asignaturaAplicaSeccion=(data,asignaturaId,seccionId)=>{
            const sec=data.secciones.find(s=>s.id===seccionId);
            return !!(sec && asignaturasDeSeccion(data,sec).includes(asignaturaId));
        };
        const relacionAsignaturaSeccion=(data,asignaturaId,seccionId)=>(data.asignaturaSeccion||[]).find(r=>r.asignaturaId===asignaturaId&&r.seccionId===seccionId)||null;
        const componentesSubseccion=(data,asignaturaId,seccionId)=>{
            const rel=relacionAsignaturaSeccion(data,asignaturaId,seccionId);
            return rel?.usaSubsecciones&&Array.isArray(rel.componentesSubseccion)?rel.componentesSubseccion:[];
        };
        const nombreComponentePlan=(data,plan)=>{
            const comp=componentesSubseccion(data,plan?.asignaturaId,plan?.seccionId).find(c=>String(c.id)===String(plan?.componenteId||''));
            return comp?.nombre||'';
        };
        const normalizarTexto=(valor)=>String(valor||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
        const filasGestorUltimaCarga=(data)=>{
            const gestor=data.gestorSecciones||{};
            const cargas=Array.isArray(gestor.cargas)?gestor.cargas:[];
            const ultima=cargas.find(c=>c.id===gestor.ultimaCargaId)||cargas[0]||null;
            return ultima?(Array.isArray(gestor.filas)?gestor.filas:[]).filter(f=>f.cargaId===ultima.id):[];
        };
        const idsGestorUltimaCarga=(data)=>{
            const gestor=data.gestorSecciones||{};
            const cargas=Array.isArray(gestor.cargas)?gestor.cargas:[];
            const ultima=cargas.find(c=>c.id===gestor.ultimaCargaId)||cargas[0]||null;
            return ultima?(Array.isArray(gestor.ids)?gestor.ids:[]).filter(x=>x.cargaId===ultima.id):[];
        };
        const esFilaFusionGestor=(f)=>normalizarTexto(f.seccion)==='fusion'||normalizarTexto(f.seccion)==='fusionada'||normalizarTexto(f.tipo).includes('fusion');
        const detectarConflictosBase=()=>{
            const data=getData();
            const p=ctx.getPlanificaciones();
            const mapa=new Map();
            const agregar=(key,item)=>{
                if(!mapa.has(key)) mapa.set(key,item);
            };
            p.forEach(plan=>{
                if(plan.docenteId!==ctx.DOCENTE_NN_ID){
                    const mismos=p.filter(x=>x.docenteId===plan.docenteId&&x.dia===plan.dia&&x.bloque===plan.bloque);
                    if(mismos.length>1){
                        const docente=data.docentes.find(d=>d.id===plan.docenteId);
                        const key=`docente|${plan.docenteId}|${plan.dia}|${plan.bloque}`;
                        agregar(key,{
                            tipo:'Docente',
                            recurso:`${docente?.nombre||''} ${docente?.apellido||''}`.trim()||'Docente',
                            dia:plan.dia,
                            bloque:plan.bloque,
                            planes:mismos
                        });
                    }
                }
                if(plan.salaId!==ctx.SALA_VIRTUAL_ID&&plan.salaId!==ctx.SALA_TRO2_ID){
                    const mismos=p.filter(x=>x.salaId===plan.salaId&&x.dia===plan.dia&&x.bloque===plan.bloque);
                    if(mismos.length>1){
                        const sala=data.salas.find(s=>s.id===plan.salaId);
                        const key=`sala|${plan.salaId}|${plan.dia}|${plan.bloque}`;
                        agregar(key,{
                            tipo:'Sala',
                            recurso:sala?.nombre||'Sala',
                            dia:plan.dia,
                            bloque:plan.bloque,
                            planes:mismos
                        });
                    }
                }
            });
            return Array.from(mapa.values()).sort((a,b)=>a.dia-b.dia||a.bloque-b.bloque||a.tipo.localeCompare(b.tipo)||a.recurso.localeCompare(b.recurso));
        };
        const etiquetaReporte={
            tro2:'Asignaturas en TRO2',
            docenteNN:'Asignaturas con Docente NN',
            criticas:'Asignaturas críticas',
            transversales:'Transversales / externas',
            conflictos:'Conflictos de docente / sala',
            softwareSala:'Software por sala / laboratorio',
            softwareAsignatura:'Software por asignatura',
            validacionPrevia:'Validación previa',
            gruposDictacion:'Grupos de dictación / fusiones',
            horasNegociacion:'Horas negociables por asignatura',
            incompletas:'Asignaturas incompletas',
            cargaDocente:'Carga docente',
            cargaDefendible:'Carga defendible docente',
            excedidos:'Docentes excedidos',
            comparativaHomologo:'Comparativa homólogo'
        };
        etiquetaReporte.integridadDatos='Integridad de datos';
        const ordenSeveridad={critico:0,advertencia:1,info:2};
        const etiquetaSeveridad={critico:'Crítico',advertencia:'Advertencia',info:'Revisión'};
        const tonoSeveridad={critico:'danger',advertencia:'warning',info:'info'};
        const cacheReportes = new Map();
        const cacheCalculos = new Map();
        let reportePagina = 1;
        let reporteTamano = 20;
        let historialPagina = 1;
        let historialTamano = 20;
        function firmaDatosReporte(){
            const data=getData();
            return [
                Number(data._version)||0,
                data.sel?.temporadaId||'',
                data.carreras?.length||0,
                data.niveles?.length||0,
                data.secciones?.length||0,
                data.asignaturas?.length||0,
                data.docentes?.length||0,
                data.salas?.length||0,
                data.asignaturaCarreraNivel?.length||0,
                data.asignaturaSeccion?.length||0,
                data.planificaciones?.length||0,
                data.gruposDictacion?.length||0,
                data.gestorSecciones?.ids?.length||0,
                data.gestorSecciones?.filas?.length||0
            ].join('|');
        }
        function desdeCache(nombre, productor){
            const firma=firmaDatosReporte();
            const hit=cacheCalculos.get(nombre);
            if(hit&&hit.firma===firma) return hit.valor;
            const valor=productor();
            cacheCalculos.set(nombre,{firma,valor});
            if(cacheCalculos.size>12){
                const primero=cacheCalculos.keys().next().value;
                cacheCalculos.delete(primero);
            }
            return valor;
        }

        function calcularValidacionPreviaBase(){
            const data=getData();
            const issues=[];
            const add=(severidad,categoria,elemento,detalle,opciones={})=>{
                issues.push(Object.assign({
                    severidad,
                    categoria,
                    elemento:elemento||'',
                    detalle:detalle||'',
                    seccionId:null,
                    asignaturaId:null,
                    accionTipo:null,
                    accionId:null
                },opciones));
            };
            const docentesReales=data.docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID);
            const disponibilidadDocente=(d)=>Array.isArray(d.disponibilidad)&&d.disponibilidad.some(f=>Array.isArray(f)&&f.some(Boolean));
            data.secciones.forEach(sec=>{
                const nivel=data.niveles.find(n=>n.id===sec.nivelId);
                if(!nivel){
                    add('critico','Estructura académica',sec.nombre,'La sección no tiene un nivel válido.',{seccionId:sec.id,accionTipo:'seccion',accionId:sec.id});
                    return;
                }
                const relaciones=asignaturasDeSeccion(data,sec);
                if(!relaciones.length) add('critico','Estructura académica',sec.nombre,'La sección no tiene asignaturas asociadas.',{seccionId:sec.id,accionTipo:'seccion',accionId:sec.id});
            });
            data.planificaciones.forEach(plan=>{
                const sec=data.secciones.find(s=>s.id===plan.seccionId);
                const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
                const doc=data.docentes.find(d=>d.id===plan.docenteId);
                const sala=data.salas.find(s=>s.id===plan.salaId);
                const elemento=[sec?.nombre||'Sin sección', asig?.codigo||asig?.nombre||'Sin asignatura'].join(' · ');
                if(!sec){
                    add('critico','Planificación fuera de modelo',elemento,'Existe un bloque planificado en una sección que ya no existe.');
                    return;
                }
                if(!asig){
                    add('critico','Planificación fuera de modelo',elemento,'Existe un bloque planificado con una asignatura que ya no existe.',{seccionId:sec.id,accionTipo:'seccion',accionId:sec.id});
                    return;
                }
                if(!asignaturaAplicaSeccion(data,asig.id,sec.id)){
                    add('critico','Planificación fuera de modelo',elemento,'La asignatura tiene bloques en esta sección, pero no aplica dentro del modelo sección/asignatura.',{seccionId:sec.id,asignaturaId:asig.id,accionTipo:'seccion',accionId:sec.id});
                }
                if(!doc) add('critico','Planificación fuera de modelo',elemento,'El bloque usa un docente que ya no existe.',{seccionId:sec.id,asignaturaId:asig.id,accionTipo:'seccion',accionId:sec.id});
                if(plan.salaId!==ctx.SALA_VIRTUAL_ID && plan.salaId!==ctx.SALA_TRO2_ID && !sala) add('critico','Planificación fuera de modelo',elemento,'El bloque usa una sala que ya no existe.',{seccionId:sec.id,asignaturaId:asig.id,accionTipo:'seccion',accionId:sec.id});
            });

            data.asignaturaCarreraNivel.forEach(rel=>{
                const asig=data.asignaturas.find(a=>a.id===rel.asignaturaId);
                const carrera=data.carreras.find(c=>c.id===rel.carreraId);
                const nivel=data.niveles.find(n=>n.id===rel.nivelId);
                const secciones=seccionesDeAsignatura(data,rel);
                const contexto=[carrera?.codigo||carrera?.nombre,nivel?.nombre].filter(Boolean).join(' · ');
                if(!asig){
                    add('critico','Asignatura vinculada',contexto,'Existe una relación carrera/nivel con una asignatura que ya no existe.');
                    return;
                }
                if(!carrera || !nivel) add('critico','Estructura académica',asig.codigo||asig.nombre,'La asignatura tiene una relación con carrera o nivel inexistente.',{asignaturaId:asig.id,accionTipo:'asignatura',accionId:asig.id});
                if(!secciones.length) add('advertencia','Estructura académica',`${asig.codigo||''} ${asig.nombre||''}`.trim(),'El nivel tiene asignaturas, pero no tiene secciones creadas.',{asignaturaId:asig.id,accionTipo:'asignatura',accionId:asig.id});
                const reqP=Number(asig.bloquesPresenciales)||0;
                const reqV=Number(asig.bloquesVirtuales)||0;
                if(reqP+reqV<=0) add('critico','Horas de asignatura',`${asig.codigo||''} ${asig.nombre||''}`.trim(),'No tiene bloques presenciales ni virtuales definidos.',{asignaturaId:asig.id,accionTipo:'asignatura',accionId:asig.id});
                if(reqP>0 && !(asig.salasPreferidas||[]).length) add('advertencia','Sala',`${asig.codigo||''} ${asig.nombre||''}`.trim(),'Tiene horas presenciales, pero no tiene salas preferidas. La planificación tenderá a usar TRO2 o requerirá ajuste manual.',{asignaturaId:asig.id,accionTipo:'asignatura',accionId:asig.id});
                (asig.salasPreferidas||[]).forEach(salaId=>{
                    if(!data.salas.some(s=>s.id===salaId)) add('critico','Sala',`${asig.codigo||''} ${asig.nombre||''}`.trim(),'Tiene una sala preferida que ya no existe.',{asignaturaId:asig.id,accionTipo:'asignatura',accionId:asig.id});
                });
                const docentes=docentesReales.filter(d=>d.asignaturasQueDicta?.includes(asig.id));
                const esExterna=asig.area==='transversal'||asig.controlHorario==='coordinacion-externa';
                if(!docentes.length){
                    add(esExterna?'advertencia':'critico','Docente',`${asig.codigo||''} ${asig.nombre||''}`.trim(),esExterna?'No tiene docente asignado en la app. Puede ser esperable si se coordina externamente.':'No hay docentes aptos/preferentes/apoyo para esta asignatura.',{asignaturaId:asig.id,accionTipo:'asignatura',accionId:asig.id});
                }else if(!docentes.some(disponibilidadDocente)){
                    add('critico','Disponibilidad docente',`${asig.codigo||''} ${asig.nombre||''}`.trim(),'Los docentes asociados no tienen disponibilidad marcada.',{asignaturaId:asig.id,accionTipo:'docente',accionId:docentes[0]?.id});
                }else if(!docentes.some(d=>(d.prioridadAsignaturas?.[asig.id]||'apto')==='preferente')){
                    add('info','Criterio docente',`${asig.codigo||''} ${asig.nombre||''}`.trim(),'Tiene docentes aptos/apoyo, pero ningún docente preferente.',{asignaturaId:asig.id,accionTipo:'docente',accionId:docentes[0]?.id});
                }
                if(asig.modalidad==='online-teams' && reqP>0) add('info','Modalidad',`${asig.codigo||''} ${asig.nombre||''}`.trim(),'Está marcada como Online TEAMS y también tiene bloques presenciales. Conviene confirmar si corresponde.',{asignaturaId:asig.id,accionTipo:'asignatura',accionId:asig.id});
                if(reqV>0 && asig.modalidad==='online-teams') add('info','Virtuales',`${asig.codigo||''} ${asig.nombre||''}`.trim(),'Online TEAMS usa sábado en la mañana; recuerda que no es lo mismo que bloque virtual de autoaprendizaje.',{asignaturaId:asig.id,accionTipo:'asignatura',accionId:asig.id});
                secciones.forEach(sec=>{
                    const planes=data.planificaciones.filter(p=>p.seccionId===sec.id&&p.asignaturaId===asig.id);
                    const planP=planes.filter(p=>p.tipoPresencial!==false).length;
                    const planV=planes.filter(p=>p.tipoPresencial===false).length;
                    if(planes.length && (planP<reqP || planV<reqV)){
                        add('advertencia','Planificación parcial',`${sec.nombre} · ${asig.codigo||asig.nombre}`,`Planificada parcialmente: ${planP}/${reqP} presencial y ${planV}/${reqV} virtual.`,{seccionId:sec.id,asignaturaId:asig.id,accionTipo:'seccion',accionId:sec.id});
                    }
                    if(planes.some(p=>p.docenteId===ctx.DOCENTE_NN_ID)){
                        add('advertencia','Docente NN',`${sec.nombre} · ${asig.codigo||asig.nombre}`,'Tiene bloques con Docente NN. Sirve para bosquejar, pero debe resolverse antes del cierre.',{seccionId:sec.id,asignaturaId:asig.id,accionTipo:'seccion',accionId:sec.id});
                    }
                    if(planes.some(p=>p.salaId===ctx.SALA_TRO2_ID)){
                        add('info','Sala TRO2',`${sec.nombre} · ${asig.codigo||asig.nombre}`,'Tiene bloques en TRO2. Úsalo como señal de revisión de sala.',{seccionId:sec.id,asignaturaId:asig.id,accionTipo:'seccion',accionId:sec.id});
                    }
                });
            });

            data.docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID).forEach(d=>{
                const nombre=`${d.nombre||''} ${d.apellido||''}`.trim()||'Docente';
                if((d.asignaturasQueDicta||[]).length && !disponibilidadDocente(d)) add('critico','Disponibilidad docente',nombre,'Dicta asignaturas, pero no tiene disponibilidad marcada.',{accionTipo:'docente',accionId:d.id});
                (d.asignaturasQueDicta||[]).forEach(asigId=>{
                    if(!data.asignaturas.some(a=>a.id===asigId)) add('critico','Docente',nombre,'Tiene una asignatura asociada que ya no existe.',{accionTipo:'docente',accionId:d.id});
                });
            });

            (Array.isArray(data.gruposDictacion)?data.gruposDictacion:[]).forEach(grupo=>{
                const asig=data.asignaturas.find(a=>a.id===grupo.asignaturaId);
                const madre=data.secciones.find(s=>s.id===grupo.seccionMadreId);
                const vinculadas=(grupo.seccionesVinculadasIds||[]).map(id=>data.secciones.find(s=>s.id===id)).filter(Boolean);
                const elemento=[asig?.codigo||asig?.nombre||'Asignatura', madre?.nombre||'Sin madre'].filter(Boolean).join(' · ');
                const asignaturasGrupo=[grupo.asignaturaId,...(grupo.asignaturasEquivalentesIds||[])].filter(Boolean);
                if(!asig) add('critico','Grupo de dictación',elemento,'El grupo apunta a una asignatura inexistente.',{accionTipo:'asignatura',accionId:grupo.asignaturaId});
                if(!madre) add('critico','Grupo de dictación',elemento,'El grupo no tiene una sección madre válida.');
                if(!(grupo.seccionesVinculadasIds||[]).length) add('info','Grupo de dictación',elemento,'La asignatura está marcada como dictada aquí, pero aún no se comparte con otra sección.',{seccionId:grupo.seccionMadreId,asignaturaId:grupo.asignaturaId,accionTipo:'seccion',accionId:grupo.seccionMadreId});
                (grupo.seccionesVinculadasIds||[]).forEach(secId=>{
                    if(secId===grupo.seccionMadreId) add('critico','Grupo de dictación',elemento,'Una sección vinculada no puede ser también la sección madre.',{seccionId:grupo.seccionMadreId,asignaturaId:grupo.asignaturaId});
                    if(!data.secciones.some(s=>s.id===secId)) add('critico','Grupo de dictación',elemento,'El grupo tiene una sección vinculada que ya no existe.',{seccionId:grupo.seccionMadreId,asignaturaId:grupo.asignaturaId});
                });
                if(!madre || !asig) return;
                const planesMadre=data.planificaciones.filter(p=>p.seccionId===grupo.seccionMadreId&&asignaturasGrupo.includes(p.asignaturaId));
                if(!planesMadre.length){
                    add('advertencia','Grupo de dictación',elemento,'La sección madre dicta esta asignatura, pero aún no tiene bloques planificados.',{seccionId:grupo.seccionMadreId,asignaturaId:grupo.asignaturaId,accionTipo:'seccion',accionId:grupo.seccionMadreId});
                }
                vinculadas.forEach(sec=>{
                    const planesPropios=data.planificaciones.filter(p=>p.seccionId===sec.id&&asignaturasGrupo.includes(p.asignaturaId));
                    if(planesPropios.length){
                        add('critico','Grupo de dictación',`${sec.nombre} · ${asig.codigo||asig.nombre}`,'La sección está vinculada a una sección madre, pero también tiene bloques propios para la misma asignatura/equivalente.',{seccionId:sec.id,asignaturaId:grupo.asignaturaId,accionTipo:'seccion',accionId:sec.id});
                    }
                    const conflictos=planesMadre.filter(pm=>data.planificaciones.some(p=>p.seccionId===sec.id&&p.dia===pm.dia&&p.bloque===pm.bloque&&!asignaturasGrupo.includes(p.asignaturaId)));
                    if(conflictos.length){
                        add('critico','Grupo de dictación',`${sec.nombre} · ${asig.codigo||asig.nombre}`,`La sección vinculada tiene ${conflictos.length} choque(s) con los bloques heredados desde ${madre.nombre}.`,{seccionId:sec.id,asignaturaId:grupo.asignaturaId,accionTipo:'seccion',accionId:sec.id});
                    }
                });
                if(Number(grupo.alumnosTotales)>0){
                    const salasInsuficientes=planesMadre
                        .filter(p=>p.tipoPresencial!==false&&p.salaId&&p.salaId!==ctx.SALA_VIRTUAL_ID&&p.salaId!==ctx.SALA_TRO2_ID)
                        .map(p=>{
                            const sala=data.salas.find(s=>s.id===p.salaId);
                            return {plan:p,sala,capacidad:Number(sala?.capacidad)||0};
                        })
                        .filter(x=>x.sala && !x.sala.ilimitada && x.capacidad>0 && x.capacidad<Number(grupo.alumnosTotales));
                    if(salasInsuficientes.length){
                        const detalle=[...new Map(salasInsuficientes.map(x=>[
                            x.sala.id,
                            `${x.sala.nombre}: ${grupo.alumnosTotales} alumnos / ${x.capacidad} cupos`
                        ])).values()].join(' · ');
                        add('advertencia','Capacidad de sala',elemento,`Se supera la cantidad de alumnos permitidos para este espacio. ${detalle}.`,{seccionId:grupo.seccionMadreId,asignaturaId:grupo.asignaturaId,accionTipo:'seccion',accionId:grupo.seccionMadreId});
                    }
                }
            });

            return issues.sort((a,b)=>(ordenSeveridad[a.severidad]??9)-(ordenSeveridad[b.severidad]??9)||a.categoria.localeCompare(b.categoria)||a.elemento.localeCompare(b.elemento));
        }
        function calcularValidacionPrevia(){
            return desdeCache('validacionPreviaBase',calcularValidacionPreviaBase);
        }

        function calcularIntegridadDatosBase(){
            const data=getData();
            const issues=[];
            const seen=new Set();
            const add=(severidad,categoria,elemento,detalle,opciones={})=>{
                const key=[severidad,categoria,elemento,detalle,opciones.seccionId||'',opciones.asignaturaId||'',opciones.accionTipo||'',opciones.accionId||''].join('|');
                if(seen.has(key)) return;
                seen.add(key);
                issues.push(Object.assign({
                    severidad,
                    categoria,
                    elemento:elemento||'',
                    detalle:detalle||'',
                    seccionId:null,
                    asignaturaId:null,
                    accionTipo:null,
                    accionId:null
                },opciones));
            };
            const idsDuplicados=(lista,nombre)=>{
                const usados=new Map();
                (Array.isArray(lista)?lista:[]).forEach(item=>{
                    const id=String(item?.id||'');
                    if(!id) return add('critico',nombre,'Sin ID','Existe un registro sin identificador interno.');
                    usados.set(id,(usados.get(id)||0)+1);
                });
                usados.forEach((cant,id)=>{ if(cant>1) add('critico',nombre,id,`ID duplicado ${cant} veces. Esto puede mezclar datos al guardar o renderizar.`); });
            };
            idsDuplicados(data.carreras,'Carreras');
            idsDuplicados(data.niveles,'Niveles');
            idsDuplicados(data.secciones,'Secciones');
            idsDuplicados(data.asignaturas,'Asignaturas');
            idsDuplicados(data.docentes,'Docentes');
            idsDuplicados(data.salas,'Salas');
            idsDuplicados(data.gruposDictacion,'Grupos de dictación');

            const carreraIds=new Set(data.carreras.map(x=>x.id));
            const nivelIds=new Set(data.niveles.map(x=>x.id));
            const seccionIds=new Set(data.secciones.map(x=>x.id));
            const asignaturaIds=new Set(data.asignaturas.map(x=>x.id));
            const docenteIds=new Set(data.docentes.map(x=>x.id));
            const salaIds=new Set(data.salas.map(x=>x.id));

            data.niveles.forEach(n=>{
                if(!carreraIds.has(n.carreraId)) add('critico','Estructura académica',n.nombre||n.id,'Nivel apunta a una carrera inexistente.',{accionTipo:'nivel',accionId:n.id});
            });
            data.secciones.forEach(s=>{
                if(!nivelIds.has(s.nivelId)) add('critico','Estructura académica',s.nombre||s.id,'Sección apunta a un nivel inexistente.',{seccionId:s.id,accionTipo:'seccion',accionId:s.id});
            });
            (data.asignaturaCarreraNivel||[]).forEach(rel=>{
                const asig=data.asignaturas.find(a=>a.id===rel.asignaturaId);
                const contexto=[asig?.codigo||rel.asignaturaId, rel.carreraId, rel.nivelId].filter(Boolean).join(' · ');
                if(!asignaturaIds.has(rel.asignaturaId)) add('critico','Relación carrera/nivel',contexto,'Relación apunta a una asignatura inexistente.');
                if(!carreraIds.has(rel.carreraId)) add('critico','Relación carrera/nivel',contexto,'Relación apunta a una carrera inexistente.',{asignaturaId:rel.asignaturaId,accionTipo:'asignatura',accionId:rel.asignaturaId});
                if(!nivelIds.has(rel.nivelId)) add('critico','Relación carrera/nivel',contexto,'Relación apunta a un nivel inexistente.',{asignaturaId:rel.asignaturaId,accionTipo:'asignatura',accionId:rel.asignaturaId});
            });
            (data.asignaturaSeccion||[]).forEach(rel=>{
                const asig=data.asignaturas.find(a=>a.id===rel.asignaturaId);
                const sec=data.secciones.find(s=>s.id===rel.seccionId);
                const contexto=[asig?.codigo||rel.asignaturaId, sec?.nombre||rel.seccionId].filter(Boolean).join(' · ');
                if(!asignaturaIds.has(rel.asignaturaId)) add('critico','Relación asignatura/sección',contexto,'Relación apunta a una asignatura inexistente.',{seccionId:rel.seccionId});
                if(!seccionIds.has(rel.seccionId)) add('critico','Relación asignatura/sección',contexto,'Relación apunta a una sección inexistente.',{asignaturaId:rel.asignaturaId,accionTipo:'asignatura',accionId:rel.asignaturaId});
                if(rel.fusionDesvinculada && !rel.fusionDesvinculadaEn) add('advertencia','Fusión desvinculada',contexto,'Está marcada como desvinculada, pero no conserva fecha de desvinculación.',{seccionId:rel.seccionId,asignaturaId:rel.asignaturaId,accionTipo:'seccion',accionId:rel.seccionId});
            });

            const celdaSeccion=new Map();
            const celdaDocente=new Map();
            const celdaSala=new Map();
            (ctx.getPlanificaciones?.()||data.planificaciones||[]).forEach(p=>{
                const sec=data.secciones.find(s=>s.id===p.seccionId);
                const asig=data.asignaturas.find(a=>a.id===p.asignaturaId);
                const elem=[sec?.nombre||p.seccionId||'Sin sección', asig?.codigo||p.asignaturaId||'Sin asignatura', `${diaCorto[p.dia]||'?'}-${p.bloque}`].join(' · ');
                if(!seccionIds.has(p.seccionId)) add('critico','Planificación',elem,'Bloque apunta a una sección inexistente.',{reparacion:{accion:'eliminar-planificacion',ids:[p.id]}});
                if(!asignaturaIds.has(p.asignaturaId)) add('critico','Planificación',elem,'Bloque apunta a una asignatura inexistente.',{seccionId:p.seccionId,reparacion:{accion:'eliminar-planificacion',ids:[p.id]}});
                if(p.docenteId && !docenteIds.has(p.docenteId)) add('critico','Planificación',elem,'Bloque apunta a un docente inexistente.',{seccionId:p.seccionId,asignaturaId:p.asignaturaId,reparacion:{accion:'eliminar-planificacion',ids:[p.id]}});
                if(p.salaId && p.salaId!==ctx.SALA_VIRTUAL_ID && p.salaId!==ctx.SALA_TRO2_ID && !salaIds.has(p.salaId)) add('critico','Planificación',elem,'Bloque apunta a una sala inexistente.',{seccionId:p.seccionId,asignaturaId:p.asignaturaId,reparacion:{accion:'eliminar-planificacion',ids:[p.id]}});
                if(sec && asig && !asignaturaAplicaSeccion(data,asig.id,sec.id)) add('critico','Planificación',elem,'La asignatura está planificada en una sección donde no aplica.',{seccionId:sec.id,asignaturaId:asig.id,accionTipo:'seccion',accionId:sec.id});
                const keys=[
                    [celdaSeccion,`sec|${p.seccionId}|${p.dia}|${p.bloque}`,'Bloque duplicado en sección'],
                    [celdaDocente,p.docenteId&&p.docenteId!==ctx.DOCENTE_NN_ID?`doc|${p.docenteId}|${p.dia}|${p.bloque}`:'','Choque de docente'],
                    [celdaSala,p.salaId&&p.salaId!==ctx.SALA_VIRTUAL_ID&&p.salaId!==ctx.SALA_TRO2_ID?`sala|${p.salaId}|${p.dia}|${p.bloque}`:'','Choque de sala']
                ];
                keys.forEach(([map,key,cat])=>{
                    if(!key) return;
                    if(!map.has(key)) map.set(key,[]);
                    map.get(key).push(p);
                    if(map.get(key).length===2) add('critico',cat,elem,`${cat}: dos o más registros ocupan el mismo día/bloque.`,{seccionId:p.seccionId,asignaturaId:p.asignaturaId,accionTipo:'seccion',accionId:p.seccionId});
                });
            });

            const gruposPorClave=new Map();
            (Array.isArray(data.gruposDictacion)?data.gruposDictacion:[]).forEach(grupo=>{
                const asig=data.asignaturas.find(a=>a.id===grupo.asignaturaId);
                const madre=data.secciones.find(s=>s.id===grupo.seccionMadreId);
                const elemento=[asig?.codigo||grupo.asignaturaId||'Sin asignatura', madre?.nombre||grupo.seccionMadreId||'Sin madre'].join(' · ');
                if(!asignaturaIds.has(grupo.asignaturaId)) add('critico','Grupo de dictación',elemento,'Grupo apunta a una asignatura inexistente.');
                if(!seccionIds.has(grupo.seccionMadreId)) add('critico','Grupo de dictación',elemento,'Grupo apunta a una sección madre inexistente.');
                const clave=`${grupo.asignaturaId}|${grupo.seccionMadreId}`;
                if(!gruposPorClave.has(clave)) gruposPorClave.set(clave,[]);
                gruposPorClave.get(clave).push(grupo);
                if(gruposPorClave.get(clave).length===2) add('advertencia','Grupo de dictación',elemento,'Hay más de un grupo para la misma asignatura y sección madre.',{seccionId:grupo.seccionMadreId,asignaturaId:grupo.asignaturaId,accionTipo:'seccion',accionId:grupo.seccionMadreId});
                (grupo.seccionesVinculadasIds||[]).forEach(secId=>{
                    const rel=relacionAsignaturaSeccion(data,grupo.asignaturaId,secId);
                    if(!seccionIds.has(secId)) add('critico','Grupo de dictación',elemento,'Incluye una sección vinculada inexistente.',{seccionId:grupo.seccionMadreId,asignaturaId:grupo.asignaturaId,reparacion:{accion:'limpiar-vinculo-grupo',grupoId:grupo.id,seccionId:secId}});
                    if(secId===grupo.seccionMadreId) add('critico','Grupo de dictación',elemento,'La sección madre también aparece como vinculada.',{seccionId:grupo.seccionMadreId,asignaturaId:grupo.asignaturaId,reparacion:{accion:'limpiar-vinculo-grupo',grupoId:grupo.id,seccionId:secId}});
                    if(rel?.fusionDesvinculada) add('critico','Fusión desvinculada',`${nombreSeccion(data,secId)||secId} · ${asig?.codigo||''}`,'La sección está marcada como desvinculada, pero todavía figura como vinculada en el grupo madre.',{seccionId:secId,asignaturaId:grupo.asignaturaId,accionTipo:'seccion',accionId:secId,reparacion:{accion:'limpiar-vinculo-grupo',grupoId:grupo.id,seccionId:secId}});
                });
                if(grupo.fusionDesvinculada && (grupo.seccionesVinculadasIds||[]).length) add('advertencia','Fusión desvinculada',elemento,'Un grupo propio desvinculado conserva secciones vinculadas. Conviene revisar.',{seccionId:grupo.seccionMadreId,asignaturaId:grupo.asignaturaId,accionTipo:'seccion',accionId:grupo.seccionMadreId,reparacion:{accion:'limpiar-vinculos-grupo-desvinculado',grupoId:grupo.id}});
                const total=(Number(grupo.alumnosBase)||0)+(Number(grupo.alumnosVinculados)||0);
                if(Number(grupo.alumnosTotales)&&Math.abs(Number(grupo.alumnosTotales)-total)>1) add('advertencia','Alumnos grupo dictación',elemento,`El total de alumnos (${grupo.alumnosTotales}) no calza con propios + vinculados (${total}).`,{seccionId:grupo.seccionMadreId,asignaturaId:grupo.asignaturaId,accionTipo:'seccion',accionId:grupo.seccionMadreId,reparacion:{accion:'recalcular-total-grupo',grupoId:grupo.id}});
            });

            const gestor=data.gestorSecciones||{};
            const cargas=Array.isArray(gestor.cargas)?gestor.cargas:[];
            const ultima=cargas.find(c=>c.id===gestor.ultimaCargaId)||cargas[0]||null;
            if(ultima){
                const ids=Array.isArray(gestor.ids)?gestor.ids.filter(x=>x.cargaId===ultima.id):[];
                const pendientes=ids.filter(x=>x.estado==='pendiente_externa');
                if(pendientes.length) add('info','Gestor Secciones','IDs pendientes externos',`${pendientes.length} ID(s) con madre en carrera no cargada o pendiente de relación.`);
            }

            return issues.sort((a,b)=>(ordenSeveridad[a.severidad]??9)-(ordenSeveridad[b.severidad]??9)||a.categoria.localeCompare(b.categoria)||a.elemento.localeCompare(b.elemento));
        }
        function calcularIntegridadDatos(){
            return desdeCache('integridadDatosBase',calcularIntegridadDatosBase);
        }

        function calcularPreparacionSecciones(){
            const data=getData();
            const docentesReales=data.docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID);
            const disponibilidadDocente=(d)=>Array.isArray(d.disponibilidad)&&d.disponibilidad.some(f=>Array.isArray(f)&&f.some(Boolean));
            const issuesBase=calcularValidacionPrevia();
            const directosPorSeccion=issuesBase.reduce((acc,x)=>{
                if(!x.seccionId) return acc;
                if(!acc[x.seccionId]) acc[x.seccionId]=[];
                acc[x.seccionId].push(x);
                return acc;
            },{});
            return data.secciones.map(sec=>{
                const nivel=data.niveles.find(n=>n.id===sec.nivelId);
                const carrera=data.carreras.find(c=>c.id===nivel?.carreraId);
                const relaciones=asignaturasDeSeccion(data,sec).map(asignaturaId=>({asignaturaId}));
                const issues=[...(directosPorSeccion[sec.id]||[])];
                if(!nivel) issues.push({severidad:'critico',categoria:'Estructura',detalle:'Sin nivel válido'});
                if(nivel && !carrera) issues.push({severidad:'critico',categoria:'Estructura',detalle:'Sin carrera válida'});
                if(!relaciones.length) issues.push({severidad:'critico',categoria:'Estructura',detalle:'Sin asignaturas asociadas'});
                relaciones.forEach(rel=>{
                    const asig=data.asignaturas.find(a=>a.id===rel.asignaturaId);
                    if(!asig){
                        issues.push({severidad:'critico',categoria:'Asignatura',detalle:'Asignatura inexistente'});
                        return;
                    }
                    const reqP=Number(asig.bloquesPresenciales)||0;
                    const reqV=Number(asig.bloquesVirtuales)||0;
                    const docentes=docentesReales.filter(d=>d.asignaturasQueDicta?.includes(asig.id));
                    const esExterna=asig.area==='transversal'||asig.controlHorario==='coordinacion-externa';
                    if(reqP+reqV<=0) issues.push({severidad:'critico',categoria:'Horas',detalle:`${asig.codigo||asig.nombre}: sin bloques`});
                    if(reqP>0 && !(asig.salasPreferidas||[]).length) issues.push({severidad:'advertencia',categoria:'Sala',detalle:`${asig.codigo||asig.nombre}: sin sala preferida`});
                    if(!docentes.length) issues.push({severidad:esExterna?'advertencia':'critico',categoria:'Docente',detalle:`${asig.codigo||asig.nombre}: sin docente asociado`});
                    else if(!docentes.some(disponibilidadDocente)) issues.push({severidad:'critico',categoria:'Disponibilidad',detalle:`${asig.codigo||asig.nombre}: docentes sin disponibilidad`});
                    else if(!docentes.some(d=>(d.prioridadAsignaturas?.[asig.id]||'apto')==='preferente')) issues.push({severidad:'info',categoria:'Criterio docente',detalle:`${asig.codigo||asig.nombre}: sin preferente`});
                });
                const unicos=new Map();
                issues.forEach(x=>{
                    const key=[x.severidad,x.categoria,x.detalle||x.elemento||''].join('|');
                    if(!unicos.has(key)) unicos.set(key,x);
                });
                const lista=Array.from(unicos.values());
                const criticos=lista.filter(x=>x.severidad==='critico').length;
                const advertencias=lista.filter(x=>x.severidad==='advertencia').length;
                const info=lista.filter(x=>x.severidad==='info').length;
                const puntaje=Math.max(0,100-(criticos*35)-(advertencias*15)-(info*5));
                return {
                    id:sec.id,
                    nombre:sec.nombre,
                    nivelId:nivel?.id||'',
                    nivel:nivel?.nombre||'Sin nivel',
                    carreraId:carrera?.id||'sin-carrera',
                    carrera:carrera?.nombre||carrera?.codigo||'Sin carrera',
                    carreraCodigo:carrera?.codigo||'',
                    asignaturas:relaciones.length,
                    criticos,
                    advertencias,
                    info,
                    total:criticos+advertencias+info,
                    puntaje,
                    estado:criticos?'No listo':(advertencias?'Revisar':'Listo')
                };
            }).sort((a,b)=>a.puntaje-b.puntaje||a.carrera.localeCompare(b.carrera)||a.nivel.localeCompare(b.nivel)||a.nombre.localeCompare(b.nombre));
        }

        function agruparPreparacionPorCarrera(items){
            const grupos=new Map();
            items.forEach(item=>{
                if(!grupos.has(item.carreraId)) grupos.set(item.carreraId,{
                    id:item.carreraId,
                    nombre:item.carrera,
                    codigo:item.carreraCodigo,
                    secciones:[],
                    criticos:0,
                    advertencias:0,
                    info:0
                });
                const g=grupos.get(item.carreraId);
                g.secciones.push(item);
                g.criticos+=item.criticos;
                g.advertencias+=item.advertencias;
                g.info+=item.info;
            });
            return Array.from(grupos.values()).map(g=>Object.assign(g,{
                puntaje:g.secciones.length?Math.round(g.secciones.reduce((acc,s)=>acc+s.puntaje,0)/g.secciones.length):0,
                listas:g.secciones.filter(s=>s.estado==='Listo').length,
                revisar:g.secciones.filter(s=>s.estado==='Revisar').length,
                noListas:g.secciones.filter(s=>s.estado==='No listo').length
            })).sort((a,b)=>a.puntaje-b.puntaje||a.nombre.localeCompare(b.nombre));
        }
        const abrirReporteDesdeDashboard=(tipo)=>{
            const sel=document.getElementById('reporteTipo');
            if(!sel || !tipo) return;
            if(ctx.activarTab && ctx.activarTab('reportes')===false) return;
            sel.value=tipo;
            reportePagina=1;
            actualizarReporte();
            document.getElementById('reporteContenido')?.scrollIntoView({behavior:'smooth',block:'start'});
        };
        const abrirEntidadDesdeReporte=(tipo,id)=>{
            if(!tipo || !id) return;
            const data=getData();
            if(tipo==='asignatura'){
                if(ctx.activarTab && ctx.activarTab('asignaturas')===false) return;
                ctx.abrirModalAsignatura?.(id);
                return;
            }
            if(tipo==='docente'){
                if(ctx.activarTab && ctx.activarTab('docentes')===false) return;
                ctx.abrirModalDocente?.(id);
                return;
            }
            if(tipo==='sala'){
                if(ctx.activarTab && ctx.activarTab('salas')===false) return;
                ctx.abrirModalSala?.(id);
                return;
            }
            if(tipo==='seccion'){
                const sec=data.secciones.find(s=>s.id===id);
                if(sec){
                    if(ctx.activarTab && ctx.activarTab('secciones')===false) return;
                    ctx.abrirModalSeccion?.(sec.nivelId,sec.id);
                }
            }
        };
        const abrirDetalleCargaDefendible=(docenteId)=>{
            const data=getData();
            const doc=data.docentes.find(d=>d.id===docenteId);
            if(!doc) return;
            const x=calcularCargaDefendibleDocente(doc,data);
            const modal=document.getElementById('modalContainer');
            if(!modal) return;
            const metricas=[
                ['Homólogo anterior',lecturaHoras(x.homologoHoras,x.homologoHoras||null)],
                ['Carga planificada',lecturaBloques(x.bloquesPlanificados,x.homologoBloques||null)],
                ['Capacidad defendible',lecturaBloques(x.capacidadBloques,x.homologoBloques||null)],
                ['Diferencia',x.homologoHoras?lecturaHoras(x.diferenciaHoras,x.homologoHoras):'Sin homólogo']
            ];
            const disponibilidad=[
                ['Declarada',lecturaBloques(x.disp.total,x.disp.total||null)],
                ['Sin sábado',lecturaBloques(x.disp.sinSabado,x.disp.total||null)],
                ['Sábado',lecturaBloques(x.disp.sabado,x.disp.total||null)],
                ['Día',lecturaBloques(x.disp.diurno,x.disp.total||null)],
                ['Noche',lecturaBloques(x.disp.vespertino,x.disp.total||null)],
                ['Utilizable',lecturaBloques(x.disp.utilizableSinSabado,x.disp.total||null)]
            ];
            modal.innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal dashboard-detail-modal">
                    <div class="modal-header">
                        <h3>Carga defendible docente</h3>
                        <p>${ctx.escapeHTML(`${doc.nombre||''} ${doc.apellido||''}`.trim())} · ${ctx.escapeHTML(doc.especialidad||'Sin especialidad')}</p>
                    </div>
                    <div class="dashboard-detail-summary">
                        ${metricas.map(([k,v])=>`<div><span>${ctx.escapeHTML(k)}</span><strong>${ctx.escapeHTML(v)}</strong></div>`).join('')}
                    </div>
                    <div class="predictive-proposal" style="margin-top:12px;">
                        <div class="predictive-scenarios-head">
                            <strong>Disponibilidad técnica</strong>
                            <span>Conversión institucional: 1 bloque semanal = 18 horas semestrales.</span>
                        </div>
                        <div class="dashboard-detail-summary">
                            ${disponibilidad.map(([k,v])=>`<div><span>${ctx.escapeHTML(k)}</span><strong>${ctx.escapeHTML(v)}</strong></div>`).join('')}
                        </div>
                    </div>
                    <div class="dashboard-validation-item ${x.ratioCapacidad>=90?'info':x.ratioCapacidad>=70?'warning':'danger'}" style="margin-top:12px;">
                        <span>Lectura</span>
                        <strong>${ctx.escapeHTML(x.homologoHoras?`${formatoNumero(x.ratioCapacidad,1)}% de capacidad vs homólogo`:'Sin homólogo')}</strong>
                        <em>${ctx.escapeHTML(x.estado)}</em>
                    </div>
                    <div class="auto-plan-empty" style="margin-top:10px;">Margen operativo aplicado: ${formatoNumero(MARGEN_OPERATIVO_DOCENTE*100,0)}%. El sábado se informa separado y no se usa como base principal de capacidad defendible.</div>
                    <div class="modal-actions">
                        <button class="btn" id="btnCerrarDetalleCargaDef">Cerrar</button>
                        <button class="btn btn-primary report-entity-btn" data-entity-type="docente" data-entity-id="${ctx.escapeAttr(doc.id)}">Editar docente</button>
                    </div>
                </div></div>`;
            const cerrar=()=>{modal.innerHTML='';};
            document.getElementById('btnCerrarDetalleCargaDef').onclick=cerrar;
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget) cerrar();};
            modal.querySelector('.report-entity-btn')?.addEventListener('click',()=>{
                cerrar();
                abrirEntidadDesdeReporte('docente',doc.id);
            });
        };
        const abrirDetalleDashboard=(tipo)=>{
            const modal=document.getElementById('modalContainer');
            if(!modal) return abrirReporteDesdeDashboard(tipo);
            const {datos,columnas}=obtenerDatosReporte(tipo);
            const muestra=datos.slice(0,6);
            const idxEstado=columnas.findIndex(c=>String(c).toLowerCase().includes('estado'));
            const idxAccion=columnas.findIndex(c=>String(c).toLowerCase()==='acción');
            const estados=idxEstado>=0 ? datos.reduce((acc,row)=>{
                const key=String(textoCelda(row[idxEstado])||'Sin estado');
                acc[key]=(acc[key]||0)+1;
                return acc;
            },{}) : {};
            const columnasPreview=idxAccion>=0 ? columnas : columnas.slice(0,Math.min(6,columnas.length));
            const indicesPreview=idxAccion>=0 ? columnas.map((_,i)=>i) : columnasPreview.map((_,i)=>i);
            const tabla=muestra.length ? `
                <div class="dashboard-detail-table">
                    <table class="report-table">
                        <thead><tr>${columnasPreview.map(c=>`<th>${ctx.escapeHTML(c)}</th>`).join('')}</tr></thead>
                        <tbody>${muestra.map(row=>`<tr>${indicesPreview.map(i=>`<td>${htmlCelda(row[i])}</td>`).join('')}</tr>`).join('')}</tbody>
                    </table>
                </div>
            ` : '<p class="dashboard-detail-empty">No hay registros para revisar.</p>';
            modal.innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal dashboard-detail-modal">
                    <div class="modal-header">
                        <h3>${ctx.escapeHTML(etiquetaReporte[tipo]||'Detalle')}</h3>
                        <p>${datos.length ? `${datos.length} registro(s) encontrados. Se muestran los primeros ${muestra.length}.` : 'No hay elementos pendientes en este grupo.'}</p>
                    </div>
                    <div class="dashboard-detail-summary">
                        <div><span>Total</span><strong>${datos.length}</strong></div>
                        ${Object.entries(estados).slice(0,4).map(([k,v])=>`<div><span>${ctx.escapeHTML(k)}</span><strong>${v}</strong></div>`).join('')}
                    </div>
                    ${tabla}
                    <div class="modal-actions">
                        <button class="btn" id="btnCerrarDetalleDashboard">Cerrar</button>
                        <button class="btn btn-primary" data-open-report="${ctx.escapeHTML(tipo)}">Ver reporte completo</button>
                    </div>
                </div></div>`;
            const cerrar=()=>{ modal.innerHTML=''; };
            document.getElementById('btnCerrarDetalleDashboard').onclick=cerrar;
            document.getElementById('modalOverlay').onclick=(e)=>{ if(e.target===e.currentTarget) cerrar(); };
        };
        const abrirUltimoAutoGeneral=()=>{
            const data=getData();
            const resumen=data.ultimoAutoGeneral;
            const modal=document.getElementById('modalContainer');
            if(!modal || !resumen) return ctx.toast('No hay un Auto-general reciente para mostrar','info');
            const fecha=resumen.ts ? new Date(resumen.ts).toLocaleString() : '';
            const filas=(resumen.detalle||[]).slice(0,20).map(item=>`
                <tr>
                    <td>${ctx.escapeHTML(item.seccion||'')}</td>
                    <td>${ctx.escapeHTML(item.carreraNivel||'')}</td>
                    <td style="text-align:right;">${item.bloques||0}</td>
                    <td style="text-align:right;">${item.pendientes||0}</td>
                    <td style="text-align:right;">${item.omitidas||0}</td>
                    <td>${item.alertas?.length?item.alertas.map(a=>`<span class="auto-plan-alert ${a.clase||'info'}">${ctx.escapeHTML(a.texto||'')}</span>`).join(' '):'<span class="auto-plan-empty">Sin alertas</span>'}</td>
                    <td>${item.seccionId?`<button class="btn btn-xs auto-general-review" data-seccion="${ctx.escapeAttr(item.seccionId)}" type="button">Revisar</button>`:''}</td>
                </tr>
            `).join('');
            modal.innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal auto-general-modal">
                    <div class="modal-header">
                        <h3>Último Auto-general</h3>
                        <p>${fecha ? `Ejecutado el ${ctx.escapeHTML(fecha)}.` : 'Resumen de la última ejecución guardada.'}</p>
                    </div>
                    <div class="export-preview-grid">
                        <div><span>Bloques asignados</span><strong>${resumen.total||0}</strong></div>
                        <div><span>Secciones modificadas</span><strong>${resumen.seccionesConCambio||0}</strong></div>
                        <div><span>Pendientes detectados</span><strong>${resumen.pendientes||0}</strong></div>
                        <div><span>Omitidas por filtros</span><strong>${resumen.omitidas||0}</strong></div>
                    </div>
                    ${(resumen.detalle||[]).length?`
                        <table class="report-table auto-general-result-table">
                            <thead><tr><th>Sección</th><th>Carrera / nivel</th><th>Bloques</th><th>Pendientes</th><th>Omitidas</th><th>Alertas</th><th>Acción</th></tr></thead>
                            <tbody>${filas}</tbody>
                        </table>
                    `:'<p class="auto-plan-empty">No hay detalle guardado.</p>'}
                    ${(resumen.detalle||[]).length>20?`<p class="auto-plan-empty">Se muestran las primeras 20 secciones modificadas.</p>`:''}
                    <div class="modal-actions">
                        ${data.ultimaAutoEjecucion?.tipo==='auto_general'?'<button class="btn btn-danger" id="btnDeshacerAutoGeneral">Deshacer Auto-general</button>':''}
                        <button class="btn" id="btnCerrarUltimoAutoGeneral">Cerrar</button>
                    </div>
                </div></div>`;
            const cerrar=()=>{modal.innerHTML='';};
            document.getElementById('btnCerrarUltimoAutoGeneral').onclick=cerrar;
            document.getElementById('btnDeshacerAutoGeneral')?.addEventListener('click',()=>{
                cerrar();
                ctx.deshacerUltimaAuto?.();
            });
            document.getElementById('modalOverlay').onclick=(e)=>{ if(e.target===e.currentTarget) cerrar(); };
            modal.querySelectorAll('.auto-general-review').forEach(btn=>btn.onclick=()=>{
                const seccionId=btn.dataset.seccion;
                cerrar();
                if(ctx.irASeccion) ctx.irASeccion(seccionId,{mensaje:'Sección abierta desde último Auto-general'});
            });
        };

        function calcularDatosReporte(tipo) {
            const data = getData();
            const contadorDocente = ctx.getContadorDocente();
            let datos = [], columnas = [];
            if (tipo === 'tro2') {
                const grupos = new Map();
                data.planificaciones
                    .filter(p=>p.salaId===ctx.SALA_TRO2_ID)
                    .forEach(p=>{
                        const asig=data.asignaturas.find(a=>a.id===p.asignaturaId);
                        const sec=data.secciones.find(s=>s.id===p.seccionId);
                        const key=[asig?.codigo||'', asig?.nombre||'', sec?.nombre||''].join('|');
                        if(!grupos.has(key)) grupos.set(key,{
                            asignaturaId:p.asignaturaId,
                            seccionId:p.seccionId,
                            codigo:asig?.codigo||'',
                            asignatura:asig?.nombre||'',
                            seccion:sec?.nombre||'',
                            bloques:[]
                        });
                        grupos.get(key).bloques.push({
                            dia:Number(p.dia),
                            bloque:Number(p.bloque)
                        });
                    });
                datos = Array.from(grupos.values())
                    .sort((a,b)=>a.codigo.localeCompare(b.codigo)||a.seccion.localeCompare(b.seccion))
                    .map(g=>{
                        const asig=data.asignaturas.find(a=>a.codigo===g.codigo&&a.nombre===g.asignatura);
                        const req=reqTotal(asig);
                        return [
                            g.seccion,
                            g.codigo,
                            g.asignatura,
                            criterio(asig,'area','especialidad'),
                            criterio(asig,'modalidad','lectiva'),
                            `${g.bloques.length}/${req}`,
                            estadoParcial(g.bloques.length,req,'TRO2')||'Revisar',
                            bloquesTexto(g.bloques),
                            accionSeccion(g.seccionId,g.asignaturaId)
                        ];
                    });
                columnas = ['Sección','Código','Asignatura','Área','Modalidad','TRO2/Req','Estado','Bloques TRO2','Acción'];
            } else if (tipo === 'docenteNN') {
                const grupos = new Map();
                data.planificaciones
                    .filter(p=>p.docenteId===ctx.DOCENTE_NN_ID)
                    .forEach(p=>{
                        const asig=data.asignaturas.find(a=>a.id===p.asignaturaId);
                        const sec=data.secciones.find(s=>s.id===p.seccionId);
                        const key=[p.asignaturaId,p.seccionId,p.tipoPresencial===false?'V':'P'].join('|');
                        if(!grupos.has(key)) grupos.set(key,{
                            asig,
                            sec,
                            tipo:p.tipoPresencial===false?'Virtual':'Presencial',
                            bloquesNN:[],
                            totalAsignaturaSeccion:data.planificaciones.filter(x=>x.asignaturaId===p.asignaturaId&&x.seccionId===p.seccionId).length
                        });
                        grupos.get(key).bloquesNN.push(p);
                    });
                datos = Array.from(grupos.values())
                    .sort((a,b)=>(a.asig?.codigo||'').localeCompare(b.asig?.codigo||'')||(a.sec?.nombre||'').localeCompare(b.sec?.nombre||''))
                    .map(g=>[
                        g.sec?.nombre||'',
                        g.asig?.codigo||'',
                        g.asig?.nombre||'',
                        criterio(g.asig,'area','especialidad'),
                        criterio(g.asig,'modalidad','lectiva'),
                        g.tipo,
                        `${g.bloquesNN.length}/${g.totalAsignaturaSeccion}`,
                        estadoParcial(g.bloquesNN.length,g.totalAsignaturaSeccion,'Docente NN')||'Revisar',
                        bloquesTexto(g.bloquesNN),
                        accionSeccion(g.sec?.id,g.asig?.id)
                    ]);
                columnas = ['Sección','Código','Asignatura','Área','Modalidad','Tipo','NN/Planificados','Estado','Bloques NN','Acción'];
            } else if (tipo === 'observacionesPlanificacion') {
                const grupos = new Map();
                data.planificaciones
                    .filter(p=>String(p.nota||'').trim())
                    .forEach(p=>{
                        const asig=data.asignaturas.find(a=>a.id===p.asignaturaId);
                        const sec=data.secciones.find(s=>s.id===p.seccionId);
                        const nivel=sec?data.niveles.find(n=>n.id===sec.nivelId):null;
                        const carrera=nivel?data.carreras.find(c=>c.id===nivel.carreraId):null;
                        const key=[p.seccionId,p.asignaturaId,p.componenteId||'',String(p.nota||'').trim()].join('|');
                        if(!grupos.has(key)) grupos.set(key,{p,asig,sec,nivel,carrera,bloques:[]});
                        grupos.get(key).bloques.push(p);
                    });
                datos=Array.from(grupos.values())
                    .sort((a,b)=>(a.carrera?.nombre||'').localeCompare(b.carrera?.nombre||'',undefined,{numeric:true,sensitivity:'base'})
                        || (a.nivel?.nombre||'').localeCompare(b.nivel?.nombre||'',undefined,{numeric:true,sensitivity:'base'})
                        || (a.sec?.nombre||'').localeCompare(b.sec?.nombre||'',undefined,{numeric:true,sensitivity:'base'})
                        || (a.asig?.codigo||'').localeCompare(b.asig?.codigo||'',undefined,{numeric:true,sensitivity:'base'}))
                    .map(g=>[
                        g.carrera?.codigo||g.carrera?.nombre||'',
                        g.nivel?.nombre||'',
                        g.sec?.nombre||'',
                        g.asig?.codigo||'',
                        g.asig?.nombre||'',
                        criterio(g.asig,'area','especialidad'),
                        criterio(g.asig,'modalidad','lectiva'),
                        bloquesTexto(g.bloques),
                        String(g.p.nota||'').trim(),
                        accionSeccion(g.sec?.id,g.asig?.id)
                    ]);
                columnas = ['Carrera','Nivel','Sección','Código','Asignatura','Área','Modalidad','Bloques','Observación','Acción'];
            } else if (tipo === 'criticas') {
                const criticas=data.asignaturas.filter(a=>['alta-reprobacion','requiere-ayudantia','alta-reprobacion-ayudantia'].includes(a.condicion));
                const filas=[];
                criticas.forEach(a=>{
                    const relaciones=data.asignaturaCarreraNivel.filter(r=>r.asignaturaId===a.id);
                    relaciones.forEach(rel=>{
                        const carrera=data.carreras.find(c=>c.id===rel.carreraId);
                        const nivel=data.niveles.find(n=>n.id===rel.nivelId);
                        const secciones=seccionesDeAsignatura(data,rel);
                        secciones.forEach(sec=>{
                            const planes=data.planificaciones.filter(p=>p.asignaturaId===a.id&&p.seccionId===sec.id);
                            filas.push({
                                a,
                                carrera,
                                nivel,
                                sec,
                                planes,
                                nn:planes.filter(p=>p.docenteId===ctx.DOCENTE_NN_ID).length,
                                tro2:planes.filter(p=>p.salaId===ctx.SALA_TRO2_ID).length
                            });
                        });
                    });
                    if(!relaciones.length){
                        const planes=data.planificaciones.filter(p=>p.asignaturaId===a.id);
                        filas.push({a,carrera:null,nivel:null,sec:null,planes,nn:planes.filter(p=>p.docenteId===ctx.DOCENTE_NN_ID).length,tro2:planes.filter(p=>p.salaId===ctx.SALA_TRO2_ID).length});
                    }
                });
                datos=filas
                    .sort((x,y)=>(x.a.codigo||'').localeCompare(y.a.codigo||'')||(x.sec?.nombre||'').localeCompare(y.sec?.nombre||''))
                    .map(f=>{
                        const req=(Number(f.a.bloquesPresenciales)||0)+(Number(f.a.bloquesVirtuales)||0);
                        const notas=[];
                        if(['requiere-ayudantia','alta-reprobacion-ayudantia'].includes(f.a.condicion)) notas.push('Revisar ayudantía');
                        if(f.nn) notas.push(`${f.nn} bloque(s) con NN`);
                        if(f.tro2) notas.push(`${f.tro2} bloque(s) en TRO2`);
                        return [
                            f.carrera?.codigo||f.carrera?.nombre||'',
                            f.nivel?.nombre||'',
                            f.sec?.nombre||'Sin sección',
                            f.a.codigo||'',
                            f.a.nombre||'',
                            criterio(f.a,'area','especialidad'),
                            criterio(f.a,'modalidad','lectiva'),
                            criterio(f.a,'condicion','normal'),
                            `${f.planes.length}/${req}`,
                            estadoPlanificacion(f.planes.length,req),
                            bloquesTexto(f.planes),
                            notas.join(' · ')||'Revisar topes',
                            accionSeccion(f.sec?.id,f.a.id)
                        ];
                    });
                columnas = ['Carrera','Nivel','Sección','Código','Asignatura','Área','Modalidad','Condición','Planificados/Req','Estado','Bloques','Observación','Acción'];
            } else if (tipo === 'transversales') {
                const asignaturas=data.asignaturas.filter(a=>a.area==='transversal'||a.controlHorario==='coordinacion-externa');
                const filas=[];
                asignaturas.forEach(a=>{
                    const relaciones=data.asignaturaCarreraNivel.filter(r=>r.asignaturaId===a.id);
                    relaciones.forEach(rel=>{
                        const carrera=data.carreras.find(c=>c.id===rel.carreraId);
                        const nivel=data.niveles.find(n=>n.id===rel.nivelId);
                        const secciones=seccionesDeAsignatura(data,rel);
                        secciones.forEach(sec=>{
                            const planes=data.planificaciones.filter(p=>p.asignaturaId===a.id&&p.seccionId===sec.id);
                            filas.push({a,carrera,nivel,sec,planes});
                        });
                    });
                    if(!relaciones.length){
                        const planes=data.planificaciones.filter(p=>p.asignaturaId===a.id);
                        filas.push({a,carrera:null,nivel:null,sec:null,planes});
                    }
                });
                datos=filas
                    .sort((x,y)=>(x.a.codigo||'').localeCompare(y.a.codigo||'')||(x.sec?.nombre||'').localeCompare(y.sec?.nombre||''))
                    .map(f=>{
                        const req=(Number(f.a.bloquesPresenciales)||0)+(Number(f.a.bloquesVirtuales)||0);
                        const docentes=docentesTexto(f.planes,data);
                        const notas=[];
                        if(f.a.controlHorario==='coordinacion-externa') notas.push('Coordinar externamente');
                        if(f.planes.some(p=>p.docenteId===ctx.DOCENTE_NN_ID)) notas.push('Tiene Docente NN');
                        if(f.planes.length<req) notas.push('Incompleta');
                        return [
                            f.carrera?.codigo||f.carrera?.nombre||'',
                            f.nivel?.nombre||'',
                            f.sec?.nombre||'Sin sección',
                            f.a.codigo||'',
                            f.a.nombre||'',
                            criterio(f.a,'modalidad','lectiva'),
                            `${f.planes.length}/${req}`,
                            estadoPlanificacion(f.planes.length,req),
                            bloquesTexto(f.planes),
                            docentes,
                            notas.join(' · ')||'Revisar coordinación',
                            accionSeccion(f.sec?.id,f.a.id)
                        ];
                    });
                columnas = ['Carrera','Nivel','Sección','Código','Asignatura','Modalidad','Planificados/Req','Estado','Bloques','Docentes','Observación','Acción'];
            } else if (tipo === 'conflictos') {
                const conflictos=detectarConflictosBase();
                datos=conflictos.map(c=>{
                    const primero=c.planes[0]||{};
                    return [
                        c.tipo,
                        c.recurso,
                        ctx.DIAS[c.dia]||'',
                        `B${c.bloque}`,
                        [...new Set(c.planes.map(p=>nombreSeccion(data,p.seccionId)).filter(Boolean))].join(', '),
                        [...new Set(c.planes.map(p=>nombreAsignatura(data,p.asignaturaId)).filter(Boolean))].join(' | '),
                        accionSeccion(primero.seccionId,primero.asignaturaId)
                    ];
                });
                columnas=['Tipo','Recurso','Día','Bloque','Secciones afectadas','Asignaturas','Acción'];
            } else if (tipo === 'softwareSala') {
                const grupos=new Map();
                data.planificaciones
                    .filter(p=>p.salaId!==ctx.SALA_VIRTUAL_ID&&p.salaId!==ctx.SALA_TRO2_ID)
                    .forEach(p=>{
                        const asig=data.asignaturas.find(a=>a.id===p.asignaturaId);
                        const softwares=Array.isArray(asig?.softwares)?asig.softwares.filter(Boolean):[];
                        if(!softwares.length) return;
                        const sala=data.salas.find(s=>s.id===p.salaId);
                        const key=p.salaId;
                        if(!grupos.has(key)) grupos.set(key,{
                            sala,
                            softwares:new Set(),
                            asignaturas:new Map(),
                            secciones:new Set(),
                            bloques:[]
                        });
                        const g=grupos.get(key);
                        softwares.forEach(s=>g.softwares.add(s));
                        g.asignaturas.set(asig.id,[asig.codigo,asig.nombre].filter(Boolean).join(' - '));
                        const sec=data.secciones.find(s=>s.id===p.seccionId);
                        if(sec) g.secciones.add(sec.nombre);
                        g.bloques.push(p);
                    });
                datos=Array.from(grupos.values())
                    .sort((a,b)=>(a.sala?.tipoSala||'').localeCompare(b.sala?.tipoSala||'',undefined,{sensitivity:'base'})||(a.sala?.nombre||'').localeCompare(b.sala?.nombre||'',undefined,{numeric:true,sensitivity:'base'}))
                    .map(g=>[
                        g.sala?.nombre||'Sin sala',
                        g.sala?.tipoSala||'Sala de Clases',
                        g.sala?.capacidad||'',
                        Array.from(g.softwares).sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'})).join(', '),
                        Array.from(g.asignaturas.values()).sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'})).join(' | '),
                        Array.from(g.secciones).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'})).join(', '),
                        bloquesTexto(g.bloques),
                        accionEntidad('sala',g.sala?.id,'Revisar sala')
                    ]);
                columnas=['Sala','Tipo de espacio','Capacidad','Softwares requeridos','Asignaturas','Secciones','Bloques','Acción'];
            } else if (tipo === 'softwareAsignatura') {
                datos=data.asignaturas
                    .filter(a=>Array.isArray(a.softwares)&&a.softwares.length)
                    .map(a=>{
                        const planes=data.planificaciones.filter(p=>p.asignaturaId===a.id);
                        const salas=[...new Set(planes.filter(p=>p.salaId!==ctx.SALA_VIRTUAL_ID&&p.salaId!==ctx.SALA_TRO2_ID).map(p=>data.salas.find(s=>s.id===p.salaId)?.nombre||'').filter(Boolean))]
                            .sort((x,y)=>x.localeCompare(y,undefined,{numeric:true,sensitivity:'base'}));
                        const tipos=[...new Set(planes.map(p=>data.salas.find(s=>s.id===p.salaId)?.tipoSala||'').filter(Boolean))]
                            .sort((x,y)=>x.localeCompare(y,undefined,{sensitivity:'base'}));
                        const relaciones=(data.asignaturaCarreraNivel||[]).filter(r=>r.asignaturaId===a.id);
                        const carreras=[...new Set(relaciones.map(r=>{
                            const c=data.carreras.find(x=>x.id===r.carreraId);
                            return c?.codigo||c?.nombre||'';
                        }).filter(Boolean))].sort((x,y)=>x.localeCompare(y,undefined,{numeric:true,sensitivity:'base'}));
                        const niveles=[...new Set(relaciones.map(r=>data.niveles.find(x=>x.id===r.nivelId)?.nombre||'').filter(Boolean))]
                            .sort((x,y)=>x.localeCompare(y,undefined,{numeric:true,sensitivity:'base'}));
                        return [
                            a.codigo||'',
                            a.nombre||'',
                            criterio(a,'area','especialidad'),
                            criterio(a,'modalidad','lectiva'),
                            (a.softwares||[]).join(', '),
                            salas.join(', ')||'Sin sala planificada',
                            tipos.join(', ')||'Sin tipo de espacio',
                            carreras.join(', ')||'Sin carrera',
                            niveles.join(', ')||'Sin nivel',
                            bloquesTexto(planes),
                            accionEntidad('asignatura',a.id,'Editar')
                        ];
                    })
                    .sort((a,b)=>String(a[0]).localeCompare(String(b[0]),undefined,{numeric:true,sensitivity:'base'}));
                columnas=['Código','Asignatura','Área','Modalidad','Softwares requeridos','Salas donde se dicta','Tipos de espacio','Carreras','Niveles','Bloques','Acción'];
            } else if (tipo === 'validacionPrevia') {
                datos=calcularValidacionPrevia().map(x=>[
                    etiquetaSeveridad[x.severidad]||x.severidad,
                    x.categoria,
                    x.elemento,
                    x.detalle,
                    x.seccionId?accionSeccion(x.seccionId,x.asignaturaId):(x.accionTipo?accionEntidad(x.accionTipo,x.accionId):'')
                ]);
                columnas=['Severidad','Categoría','Elemento','Detalle','Acción'];
            } else if (tipo === 'integridadDatos') {
                datos=calcularIntegridadDatos().map(x=>[
                    etiquetaSeveridad[x.severidad]||x.severidad,
                    x.categoria,
                    x.elemento,
                    x.detalle,
                    [
                        x.reparacion?accionReparacion(x.reparacion.accion,x.reparacion,'Reparar'):'',
                        x.seccionId?accionSeccion(x.seccionId,x.asignaturaId):(x.accionTipo?accionEntidad(x.accionTipo,x.accionId):'')
                    ].filter(Boolean).map(a=>a.html? a : {text:a,html:ctx.escapeHTML(a)}).reduce((acc,a,idx)=>({
                        text:[acc.text,a.text].filter(Boolean).join(' '),
                        html:[acc.html,a.html].filter(Boolean).join(' ')
                    }),{text:'',html:''})
                ]);
                columnas=['Severidad','Categoría','Elemento','Detalle','Acción'];
            } else if (tipo === 'gruposDictacion') {
                const grupos=Array.isArray(data.gruposDictacion)?data.gruposDictacion:[];
                const issues=calcularValidacionPrevia().filter(x=>x.categoria==='Grupo de dictación'||x.categoria==='Capacidad de sala');
                datos=grupos.map(grupo=>{
                    const asig=data.asignaturas.find(a=>a.id===grupo.asignaturaId);
                    const madre=data.secciones.find(s=>s.id===grupo.seccionMadreId);
                    const idsAsignaturas=[grupo.asignaturaId,...(grupo.asignaturasEquivalentesIds||[])].filter(Boolean);
                    const planes=data.planificaciones.filter(p=>p.seccionId===grupo.seccionMadreId&&idsAsignaturas.includes(p.asignaturaId));
                    const vinculadas=(grupo.seccionesVinculadasIds||[]).map(id=>data.secciones.find(s=>s.id===id)).filter(Boolean);
                    const req=reqTotal(asig);
                    const planP=planes.filter(p=>p.tipoPresencial!==false).length;
                    const planV=planes.filter(p=>p.tipoPresencial===false).length;
                    const reqDetalle=`${planP}/${Number(asig?.bloquesPresenciales)||0} P · ${planV}/${Number(asig?.bloquesVirtuales)||0} V`;
                    const salas=[...new Set(planes.map(p=>data.salas.find(s=>s.id===p.salaId)?.nombre||'').filter(Boolean))].join(', ');
                    const alertas=issues.filter(x=>
                        x.seccionId===grupo.seccionMadreId ||
                        x.asignaturaId===grupo.asignaturaId ||
                        (grupo.seccionesVinculadasIds||[]).includes(x.seccionId)
                    );
                    const estado=!madre||!asig?'Crítico':alertas.some(x=>x.severidad==='critico')?'Crítico':alertas.some(x=>x.severidad==='advertencia')?'Revisar':planes.length>=req?'Completo':'Pendiente';
                    const alertasTexto=alertas.length
                        ? [...new Set(alertas.map(x=>`${etiquetaSeveridad[x.severidad]||x.severidad}: ${x.detalle}`))].slice(0,3).join(' | ')
                        : (vinculadas.length?'Sin alertas':'Sin secciones vinculadas');
                    return [
                        estado,
                        nombreAsignatura(data,grupo.asignaturaId),
                        madre?.nombre||'Sin sección madre',
                        vinculadas.map(s=>s.nombre).join(', ')||'Sin vinculadas',
                        vinculadas.length,
                        Number(grupo.alumnosTotales)||'',
                        reqDetalle,
                        bloquesTexto(planes),
                        docentesTexto(planes,data)||'Sin docente planificado',
                        salas||'Sin sala planificada',
                        alertasTexto,
                        accionSeccion(grupo.seccionMadreId,grupo.asignaturaId,'Ir a madre')
                    ];
                }).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))||String(a[2]).localeCompare(String(b[2]))||String(a[1]).localeCompare(String(b[1])));
                if(!datos.length){
                    const filasGestor=filasGestorUltimaCarga(data);
                    const filasPorId=new Map();
                    filasGestor.forEach(f=>{
                        const id=String(f.idSeccion||'').trim();
                        if(!id) return;
                        if(!filasPorId.has(id)) filasPorId.set(id,[]);
                        filasPorId.get(id).push(f);
                    });
                    datos=idsGestorUltimaCarga(data)
                        .filter(x=>Number(x.filasFusionadas)||x.estado==='pendiente_externa'||(x.seccionesReales||[]).length)
                        .map(x=>{
                            const filas=filasPorId.get(String(x.idSeccion||''))||[];
                            const fusionadas=filas.filter(esFilaFusionGestor);
                            const reales=(x.seccionesReales||[]).filter(Boolean);
                            const madre=x.madreDetectada||reales[0]||'Pendiente externa';
                            const heredadas=reales.filter(s=>s!==madre);
                            const secMadre=data.secciones.find(s=>s.nombre===madre);
                            const asig=data.asignaturas.find(a=>String(a.codigo||'').toUpperCase()===String(x.asignaturaCodigo||'').toUpperCase());
                            const alumnos=Math.max(0,...filas.map(f=>Number(f.alumnosTotales)||Number(f.alumnos)||0));
                            const estado=x.estado==='resuelta'?'Resuelta':x.estado==='pendiente_externa'?'Pendiente externa':x.estado==='sin_id'?'Sin ID':'Revisar';
                            const alerta=fusionadas.length
                                ? `${fusionadas.length} fila(s) Fusionada detectadas por ID${x.motivo?`: ${x.motivo}`:''}`
                                : (x.motivo||'ID leída desde el Gestor');
                            return [
                                estado,
                                [x.asignaturaCodigo,x.asignaturaNombre].filter(Boolean).join(' - '),
                                madre,
                                heredadas.join(', ')||'Sin heredadas internas visibles',
                                Number(x.filasFusionadas)||fusionadas.length||0,
                                alumnos||'',
                                'Desde Gestor',
                                '',
                                '',
                                '',
                                alerta,
                                secMadre?accionSeccion(secMadre.id,asig?.id,'Ir a madre'):''
                            ];
                        }).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))||String(a[2]).localeCompare(String(b[2]))||String(a[1]).localeCompare(String(b[1])));
                }
                columnas=['Estado','Asignatura','Sección madre','Secciones heredadas','N° heredadas','Alumnos totales','Plan/Req','Bloques','Docentes','Salas','Alertas','Acción'];
            } else if (tipo === 'horasNegociacion') {
                const filas=[];
                const grupos=Array.isArray(data.gruposDictacion)?data.gruposDictacion:[];
                const clavesCubiertas=new Set();
                const nombreDocente=(docenteId)=>{
                    const d=data.docentes.find(x=>x.id===docenteId);
                    if(!d) return 'Sin docente';
                    return d.id===ctx.DOCENTE_NN_ID?'Docente NN':`${d.nombre||''} ${d.apellido||''}`.trim();
                };
                const contextoSeccion=(secId)=>{
                    const sec=data.secciones.find(s=>s.id===secId);
                    const nivel=data.niveles.find(n=>n.id===sec?.nivelId);
                    const carrera=data.carreras.find(c=>c.id===nivel?.carreraId);
                    return {sec,nivel,carrera};
                };
                const agregarFila=(origen,{asig,sec,grupo=null,idsAsignaturas=[]})=>{
                    if(!asig||!sec) return;
                    const {nivel,carrera}=contextoSeccion(sec.id);
                    const ids=idsAsignaturas.length?idsAsignaturas:[asig.id];
                    ids.forEach(id=>clavesCubiertas.add(`${sec.id}|${id}`));
                    const planes=data.planificaciones.filter(p=>p.seccionId===sec.id&&ids.includes(p.asignaturaId));
                    const porDocente=new Map();
                    planes.forEach(p=>{
                        const key=p.docenteId||'sin-docente';
                        if(!porDocente.has(key)) porDocente.set(key,[]);
                        porDocente.get(key).push(p);
                    });
                    if(!porDocente.size) porDocente.set('sin-planificar',[]);
                    const vinculadas=(grupo?.seccionesVinculadasIds||[]).map(id=>data.secciones.find(s=>s.id===id)?.nombre).filter(Boolean);
                    const alumnos=grupo?Number(grupo.alumnosTotales)||Number(grupo.alumnosBase)||0:'';
                    const req=reqTotal(asig);
                    porDocente.forEach((planesDocente,docenteId)=>{
                        const docente=data.docentes.find(x=>x.id===docenteId);
                        const bloques=planesDocente.length;
                        filas.push({
                            cargaKey:`${sec.id}|${asig.id}`,
                            docente:nombreDocente(docenteId),
                            especialidad:docente?.especialidad||'Sin especialidad',
                            carrera:carrera?.codigo||carrera?.nombre||'Sin carrera',
                            nivel:nivel?.nombre||'',
                            seccion:sec,
                            asig,
                            origen,
                            alumnos,
                            vinculadas,
                            bloques,
                            horas:bloques*18,
                            req,
                            reqHoras:req*18,
                            detalle:req?`${bloques}/${req} bloque(s)`:bloques?`${bloques} bloque(s)`:'Sin bloques',
                            bloquesTexto:bloquesTexto(planesDocente),
                            salas:[...new Set(planesDocente.map(p=>data.salas.find(s=>s.id===p.salaId)?.nombre).filter(Boolean))].join(', ')||'Sin sala planificada'
                        });
                    });
                };
                grupos.forEach(grupo=>{
                    const asig=data.asignaturas.find(a=>a.id===grupo.asignaturaId);
                    const sec=data.secciones.find(s=>s.id===grupo.seccionMadreId);
                    const ids=[grupo.asignaturaId,...(grupo.asignaturasEquivalentesIds||[])].filter(Boolean);
                    agregarFila((grupo.seccionesVinculadasIds||[]).length?'Madre con heredadas':'Se dicta aquí',{asig,sec,grupo,idsAsignaturas:ids});
                });
                data.planificaciones.forEach(p=>{
                    const key=`${p.seccionId}|${p.asignaturaId}`;
                    if(clavesCubiertas.has(key)) return;
                    const asig=data.asignaturas.find(a=>a.id===p.asignaturaId);
                    const sec=data.secciones.find(s=>s.id===p.seccionId);
                    agregarFila('Planificación propia',{asig,sec,idsAsignaturas:[p.asignaturaId]});
                });
                const filasOrdenadas=filas
                    .sort((a,b)=>String(a.especialidad).localeCompare(String(b.especialidad),undefined,{sensitivity:'base'})
                        ||String(a.docente).localeCompare(String(b.docente),undefined,{sensitivity:'base'})
                        ||String(a.carrera).localeCompare(String(b.carrera),undefined,{numeric:true,sensitivity:'base'})
                        ||String(a.nivel).localeCompare(String(b.nivel),undefined,{numeric:true,sensitivity:'base'})
                        ||String(a.asig.codigo||'').localeCompare(String(b.asig.codigo||''),undefined,{numeric:true,sensitivity:'base'}));
                datos=filasOrdenadas.map(f=>[
                        f.especialidad,
                        f.docente,
                        f.carrera,
                        f.nivel,
                        f.seccion.nombre,
                        f.asig.codigo||'',
                        f.asig.nombre||'',
                        f.origen,
                        f.alumnos,
                        f.vinculadas.join(', ')||'Sin heredadas',
                        f.detalle,
                        f.horas,
                        f.reqHoras,
                        f.bloquesTexto||'Sin bloques',
                        f.salas,
                        accionSeccion(f.seccion.id,f.asig.id,'Revisar')
                    ]);
                columnas=['Especialidad','Docente','Carrera','Nivel','Sección madre/propia','Código','Asignatura','Origen','Alumnos grupo','Heredadas ref.','Bloques planificados/req','Horas planificadas','Horas requeridas','Bloques','Salas','Acción'];
            } else if (tipo === 'subseccionesAsignatura') {
                const filas=[];
                (data.asignaturaSeccion||[]).filter(r=>r.usaSubsecciones&&Array.isArray(r.componentesSubseccion)&&r.componentesSubseccion.length).forEach(rel=>{
                    const sec=data.secciones.find(s=>s.id===rel.seccionId);
                    const nivel=data.niveles.find(n=>n.id===sec?.nivelId);
                    const carrera=data.carreras.find(c=>c.id===nivel?.carreraId);
                    const asig=data.asignaturas.find(a=>a.id===rel.asignaturaId);
                    if(!sec||!asig) return;
                    const comps=rel.componentesSubseccion||[];
                    const grupos=comps.filter(c=>c.tipo!=='comun');
                    const horasComunes=Number(rel.horasComunes)||Number(comps.find(c=>c.tipo==='comun')?.horas)||0;
                    const horasGrupo=Number(rel.horasPorSubseccion)||Math.max(0,...grupos.map(g=>Number(g.horas)||0));
                    const horasCurriculares=horasComunes+horasGrupo;
                    const horasOperativas=horasComunes+grupos.reduce((acc,g)=>acc+(Number(g.horas)||horasGrupo),0);
                    const horasRef=Number(asig.horasPresenciales)||Number(asig.horasTotales)||0;
                    const alumnos=grupos.reduce((acc,g)=>acc+(Number(g.alumnos)||0),0);
                    const planes=data.planificaciones.filter(p=>p.seccionId===rel.seccionId&&p.asignaturaId===rel.asignaturaId&&p.tipoPresencial!==false);
                    const estadoHoras=!horasRef||horasCurriculares===horasRef?'Horas cuadran':'Revisar horas';
                    const compEstado=comps.map(c=>{
                        const req=bloquesDesdeHoras(Number(c.horas)||0);
                        const hechos=planes.filter(p=>String(p.componenteId||'')===String(c.id)).length;
                        return `${c.nombre||c.id}: ${hechos}/${req}`;
                    }).join(' · ');
                    const estadoCobertura=comps.every(c=>planes.filter(p=>String(p.componenteId||'')===String(c.id)).length>=bloquesDesdeHoras(Number(c.horas)||0))?'Completa':'Pendiente';
                    filas.push({
                        carrera:carrera?.codigo||carrera?.nombre||'',
                        nivel:nivel?.nombre||'',
                        seccion:sec,
                        asig,
                        grupos,
                        alumnos,
                        horasRef,
                        horasCurriculares,
                        horasOperativas,
                        estadoHoras,
                        estadoCobertura,
                        compEstado,
                        bloques:bloquesTexto(planes),
                        docentes:docentesTexto(planes,data)||'Sin docente planificado',
                        salas:[...new Set(planes.map(p=>data.salas.find(s=>s.id===p.salaId)?.nombre).filter(Boolean))].join(', ')||'Sin sala planificada'
                    });
                });
                datos=filas.sort((a,b)=>String(a.carrera).localeCompare(String(b.carrera))||String(a.nivel).localeCompare(String(b.nivel),undefined,{numeric:true})||a.seccion.nombre.localeCompare(b.seccion.nombre)||(a.asig.codigo||'').localeCompare(b.asig.codigo||'')).map(f=>[
                    f.carrera,
                    f.nivel,
                    f.seccion.nombre,
                    f.asig.codigo,
                    f.asig.nombre,
                    f.grupos.length,
                    f.alumnos,
                    f.horasRef||'',
                    f.horasCurriculares,
                    f.horasOperativas,
                    f.estadoHoras,
                    f.estadoCobertura,
                    f.compEstado,
                    f.bloques,
                    f.docentes,
                    f.salas,
                    accionSeccion(f.seccion.id,f.asig.id)
                ]);
                columnas=['Carrera','Nivel','Sección','Código','Asignatura','Grupos','Alumnos grupos','Horas referencia','Horas estudiante','Carga operativa','Horas','Cobertura','Componentes','Bloques','Docentes','Salas','Acción'];
            } else if (tipo === 'calidadHorario') {
                const calidad=calcularCalidadHorario();
                const etiquetas={
                    ventanasSeccion:'Ventanas sección',
                    ventanasDocente:'Ventanas docente',
                    diasCargados:'Días cargados',
                    extremos:'Bloques extremos',
                    virtuales:'Virtuales a revisar',
                    nn:'Docente NN',
                    tro2:'TRO2'
                };
                const gruposCalidad={
                    ventanasSeccion:calidad.ventanasSeccion,
                    ventanasDocente:calidad.ventanasDocente,
                    diasCargados:calidad.diasCargados,
                    extremos:agruparCalidadPorAsignatura(calidad.extremos),
                    virtuales:agruparCalidadPorAsignatura(calidad.virtuales),
                    nn:agruparCalidadPorAsignatura(calidad.nn),
                    tro2:agruparCalidadPorAsignatura(calidad.tro2)
                };
                datos=Object.entries(gruposCalidad).flatMap(([key,items])=>items.map(x=>{
                    const dia=ctx.DIAS[x.dia]||'';
                    const bloques=Array.isArray(x.bloques)?x.bloques.map(b=>`B${b}`).join(', '):`B${x.bloque}`;
                    const elemento=x.seccion||x.docente||x.nombre||'';
                    const asignatura=x.asignatura||'';
                    const valor=x.valor!==undefined?x.valor:(Array.isArray(x.bloques)?x.bloques.length:1);
                    return [
                        etiquetas[key]||key,
                        elemento,
                        asignatura,
                        dia,
                        bloques,
                        valor,
                        key==='tro2'||key==='nn'||key==='virtuales'||key==='extremos'?'Revisar ubicación':'Revisar distribución',
                        accionSeccion(x.seccionId,x.asignaturaId)
                    ];
                }));
                columnas=['Indicador','Elemento','Asignatura','Día','Bloques','Valor','Observación','Acción'];
            } else if (tipo === 'incompletas') {
                const filas=[];
                data.secciones.forEach(sec=>{
                    const nivel=data.niveles.find(n=>n.id===sec.nivelId);
                    const carrera=data.carreras.find(c=>c.id===nivel?.carreraId);
                    asignaturasDeSeccion(data,sec).forEach(asigId=>{
                        const a=data.asignaturas.find(x=>x.id===asigId);
                        if(!a) return;
                        const planes=data.planificaciones.filter(p=>p.asignaturaId===a.id&&p.seccionId===sec.id);
                        const planP=planes.filter(p=>p.tipoPresencial!==false).length;
                        const planV=planes.filter(p=>p.tipoPresencial===false).length;
                        const reqP=Number(a.bloquesPresenciales)||0;
                        const reqV=Number(a.bloquesVirtuales)||0;
                        if(planP<reqP || planV<reqV){
                            filas.push({a,sec,nivel,carrera,planes,planP,planV,reqP,reqV});
                        }
                    });
                });
                datos = filas
                    .sort((x,y)=>(x.carrera?.codigo||'').localeCompare(y.carrera?.codigo||'')||(x.nivel?.nombre||'').localeCompare(y.nivel?.nombre||'')||x.sec.nombre.localeCompare(y.sec.nombre)||(x.a.codigo||'').localeCompare(y.a.codigo||''))
                    .map(f=>[
                        f.carrera?.codigo||f.carrera?.nombre||'',
                        f.nivel?.nombre||'',
                        f.sec.nombre,
                        f.a.codigo,
                        f.a.nombre,
                        criterio(f.a,'area','especialidad'),
                        criterio(f.a,'modalidad','lectiva'),
                        criterio(f.a,'condicion','normal'),
                        f.reqP,
                        f.reqV,
                        f.planP,
                        f.planV,
                        estadoPlanificacion(f.planP+f.planV,f.reqP+f.reqV),
                        bloquesTexto(f.planes),
                        accionSeccion(f.sec.id,f.a.id)
                    ]);
                columnas = ['Carrera','Nivel','Sección','Código','Nombre','Área','Modalidad','Condición','Req P','Req V','Plan P','Plan V','Estado','Bloques','Acción'];
            } else if (tipo === 'cargaDocente') {
                datos = data.docentes
                    .slice()
                    .sort((a,b)=>String(a.especialidad||'Sin especialidad').localeCompare(String(b.especialidad||'Sin especialidad'))||String(a.apellido||'').localeCompare(String(b.apellido||'')))
                    .map(d=>[d.especialidad||'Sin especialidad', d.nombre, d.apellido, contadorDocente[d.id]||0, (contadorDocente[d.id]||0)*18, d.id===ctx.DOCENTE_NN_ID?'Pendiente':(d.autorizadoExceder?'Sí':'No')]);
                columnas = ['Especialidad','Nombre','Apellido','Bloques','Horas','Autorizado'];
            } else if (tipo === 'cargaDefendible') {
                datos = data.docentes
                    .filter(d=>d.id!==ctx.DOCENTE_NN_ID)
                    .map(d=>calcularCargaDefendibleDocente(d,data))
                    .sort((a,b)=>String(a.doc.especialidad||'Sin especialidad').localeCompare(String(b.doc.especialidad||'Sin especialidad'))||String(a.doc.apellido||'').localeCompare(String(b.doc.apellido||'')))
                    .map(x=>{
                        const detalle=[
                            x.doc.especialidad||'Sin especialidad',
                            x.doc.nombre||'',
                            x.doc.apellido||'',
                            x.doc.tipoContrato||'',
                            lecturaHoras(x.homologoHoras,x.homologoHoras||null),
                            lecturaBloques(x.bloquesPlanificados,x.homologoBloques||null),
                            lecturaBloques(x.disp.total,x.disp.total||null),
                            lecturaBloques(x.disp.sinSabado,x.disp.total||null),
                            lecturaBloques(x.disp.sabado,x.disp.total||null),
                            lecturaBloques(x.disp.diurno,x.disp.total||null),
                            lecturaBloques(x.disp.vespertino,x.disp.total||null),
                            lecturaBloques(x.disp.utilizableSinSabado,x.disp.total||null),
                            lecturaBloques(x.capacidadBloques,x.homologoBloques||null),
                            `${formatoNumero(MARGEN_OPERATIVO_DOCENTE*100,0)}%`,
                            x.homologoHoras?`${formatoNumero(x.ratioCapacidad,1)}%`:'Sin homólogo',
                            x.homologoHoras?`${formatoNumero(x.ratioActual,1)}%`:'Sin homólogo',
                            x.homologoHoras?lecturaHoras(x.diferenciaHoras,x.homologoHoras):'Sin homólogo',
                            x.estado
                        ];
                        const estadoCorto=x.estado.split('.').filter(Boolean).slice(0,1).join('.')||x.estado;
                        return [
                            x.doc.especialidad||'Sin especialidad',
                            `${x.doc.nombre||''} ${x.doc.apellido||''}`.trim(),
                            lecturaHoras(x.homologoHoras,x.homologoHoras||null),
                            lecturaBloques(x.bloquesPlanificados,x.homologoBloques||null),
                            lecturaBloques(x.capacidadBloques,x.homologoBloques||null),
                            x.homologoHoras?lecturaHoras(x.diferenciaHoras,x.homologoHoras):'Sin homólogo',
                            estadoCorto,
                            {
                                text:'Detalle',
                                detalle,
                                html:`<button type="button" class="btn btn-xs report-detail-btn" data-detail-report="cargaDefendible" data-docente="${ctx.escapeAttr(x.doc.id)}">Detalle</button> ${accionEntidad('docente',x.doc.id,'Editar').html||''}`
                            }
                        ];
                    });
                columnas = ['Especialidad','Docente','Homólogo anterior','Carga actual','Capacidad defendible','Diferencia','Estado','Acción'];
            } else if (tipo === 'excedidos') {
                datos = data.docentes.filter(d=>d.autorizadoExceder&&(contadorDocente[d.id]||0)>data.configuracion.bloquesSemestralesMax).map(d=>[d.especialidad||'Sin especialidad', d.nombre, d.apellido, contadorDocente[d.id]||0, (contadorDocente[d.id]||0)*18]);
                columnas = ['Especialidad','Nombre','Apellido','Bloques','Horas'];
            } else if (tipo === 'comparativaHomologo') {
                datos = data.docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID&&d.horasHomologo!==undefined).map(d=>{
                    const actual = (contadorDocente[d.id]||0)*18, diff = actual-(d.horasHomologo||0), porcentaje = d.horasHomologo ? (diff/d.horasHomologo*100).toFixed(1) : 'N/A';
                    return [d.especialidad||'Sin especialidad', d.nombre, d.apellido, d.tipoContrato||'', d.horasHomologo||0, actual, diff, porcentaje];
                });
                columnas = ['Especialidad','Nombre','Apellido','Contrato','Homólogo','Actual','Diferencia','% Variación'];
            }
            return { datos, columnas };
        }
        function obtenerDatosReporte(tipo) {
            const firma=firmaDatosReporte();
            const hit=cacheReportes.get(tipo);
            if(hit&&hit.firma===firma) return hit.valor;
            const valor=calcularDatosReporte(tipo);
            cacheReportes.set(tipo,{firma,valor});
            if(cacheReportes.size>18){
                const primero=cacheReportes.keys().next().value;
                cacheReportes.delete(primero);
            }
            return valor;
        }

        function generarTablaReporte(datos,columnas){
            if(!datos.length) return '<p>No hay datos.</p>';
            let html='<table class="report-table"><thead><tr>'+columnas.map(c=>`<th>${ctx.escapeHTML(c)}</th>`).join('')+'</tr></thead><tbody>';
            datos.forEach(row=>{ html+='<tr>'+row.map(cell=>`<td>${htmlCelda(cell)}</td>`).join('')+'</tr>'; });
            html+='</tbody></table>';
            return html;
        }

        function filtrarDatosReporte(datos){
            const input=document.getElementById('reporteBusqueda');
            const q=(input?.value||'').trim().toLowerCase();
            if(!q) return datos;
            return datos.filter(row=>row.some(cell=>String(textoCelda(cell)??'').toLowerCase().includes(q)));
        }

        function filaTotalHorasNegociacion(datos){
            if(!Array.isArray(datos)||!datos.length) return null;
            const horasPlanificadas=datos.reduce((acc,row)=>acc+(Number(textoCelda(row[11]))||0),0);
            const requeridasUnicas=new Map();
            datos.forEach(row=>{
                const key=[textoCelda(row[4]),textoCelda(row[5])].join('|');
                if(!requeridasUnicas.has(key)) requeridasUnicas.set(key,Number(textoCelda(row[12]))||0);
            });
            const horasRequeridas=[...requeridasUnicas.values()].reduce((acc,h)=>acc+h,0);
            return [
                {text:'TOTAL',html:'<strong>TOTAL</strong>'},
                '',
                '',
                '',
                '',
                '',
                {text:'Totales filtrados',html:'<strong>Totales filtrados</strong>'},
                'Sin duplicar heredadas',
                '',
                'Heredadas solo referencia',
                '',
                {text:String(horasPlanificadas),html:`<strong>${horasPlanificadas}</strong>`},
                {text:String(horasRequeridas),html:`<strong>${horasRequeridas}</strong>`},
                '',
                '',
                ''
            ];
        }

        function anchoColumna(valor){
            const largo=String(valor??'').length;
            return Math.max(10, Math.min(42, largo+2));
        }

        function formatearHojaReporte(ws, columnas, datos){
            if(!ws || !window.XLSX?.utils) return ws;
            const datosLimpios=limpiarDatosExportacion(datos);
            const filas=[columnas,...datosLimpios];
            ws['!cols']=columnas.map((_,ci)=>({
                wch:Math.max(...filas.map(f=>anchoColumna(f[ci])))
            }));
            ws['!rows']=[{hpt:24}, ...datosLimpios.map(()=>({hpt:22}))];
            ws['!autofilter']={ref:ws['!ref']};
            ws['!freeze']={xSplit:0,ySplit:1};
            const rango=window.XLSX.utils.decode_range(ws['!ref']||'A1:A1');
            for(let r=rango.s.r; r<=rango.e.r; r++){
                for(let c=rango.s.c; c<=rango.e.c; c++){
                    const addr=window.XLSX.utils.encode_cell({r,c});
                    if(!ws[addr]) continue;
                    ws[addr].s={
                        alignment:{vertical:'center', horizontal:r===0?'center':'left', wrapText:true},
                        font:{bold:r===0, name:'Arial', sz:r===0?11:10},
                        fill:r===0?{patternType:'solid',fgColor:{rgb:'D9EAF7'}}:undefined,
                        border:{
                            top:{style:'thin',color:{rgb:'7F8C8D'}},
                            bottom:{style:'thin',color:{rgb:'7F8C8D'}},
                            left:{style:'thin',color:{rgb:'7F8C8D'}},
                            right:{style:'thin',color:{rgb:'7F8C8D'}}
                        }
                    };
                }
            }
            return ws;
        }

        function filasSoftwarePorSalaDetalladas(datos){
            const rows=[];
            limpiarDatosExportacion(datos).forEach(row=>{
                const [sala,tipo,capacidad,softwares,asignaturas,secciones,bloques]=row;
                String(softwares||'').split(',').map(x=>x.trim()).filter(Boolean).forEach(software=>{
                    rows.push([sala,tipo,capacidad,software,asignaturas,secciones,bloques,'']);
                });
            });
            return rows.sort((a,b)=>String(a[0]).localeCompare(String(b[0]),undefined,{numeric:true,sensitivity:'base'})||String(a[3]).localeCompare(String(b[3]),undefined,{sensitivity:'base'}));
        }

        function filasSoftwarePorAsignaturaDetalladas(datos){
            const rows=[];
            limpiarDatosExportacion(datos).forEach(row=>{
                const [codigo,asignatura,area,modalidad,softwares,salas,tipos,carreras,niveles,bloques]=row;
                String(softwares||'').split(',').map(x=>x.trim()).filter(Boolean).forEach(software=>{
                    rows.push([software,codigo,asignatura,area,modalidad,salas,tipos,carreras,niveles,bloques,'']);
                });
            });
            return rows.sort((a,b)=>String(a[0]).localeCompare(String(b[0]),undefined,{sensitivity:'base'})||String(a[1]).localeCompare(String(b[1]),undefined,{numeric:true,sensitivity:'base'}));
        }

        function hojaSinColumnaAccion(columnas,datos){
            const idx=columnas.findIndex(c=>String(c).toLowerCase()==='acción');
            const datosLimpios=limpiarDatosExportacion(datos);
            if(idx<0) return {columnas,datos:datosLimpios};
            return {
                columnas:columnas.filter((_,i)=>i!==idx),
                datos:datosLimpios.map(row=>row.filter((_,i)=>i!==idx))
            };
        }

        function hojasExportacionReporte(tipo,columnas,datos){
            if(tipo==='cargaDefendible'){
                const resumen=hojaSinColumnaAccion(columnas,datos);
                const columnasDetalle=['Especialidad','Nombre','Apellido','Contrato','Homólogo anterior','Carga planificada','Disp. declarada','Disp. sin sábado','Disp. sábado','Disp. día','Disp. noche','Disp. utilizable','Capacidad defendible','Margen','Capacidad vs homólogo','Carga vs homólogo','Diferencia','Lectura'];
                const detalle=datos.map(row=>detalleCelda(row[row.length-1])).filter(Boolean);
                return [
                    {nombre:'Resumen ejecutivo', columnas:resumen.columnas, datos:resumen.datos},
                    {nombre:'Detalle tecnico', columnas:columnasDetalle, datos:detalle},
                    {nombre:'Criterios de calculo', columnas:['Criterio','Valor','Descripción'], datos:[
                        ['Equivalencia institucional','1 bloque semanal = 18 horas semestrales','La app representa una semana ideal del semestre, no horas reloj semanales.'],
                        ['Disponibilidad declarada','Bloques marcados por el docente','Incluye lunes a sábado.'],
                        ['Disponibilidad sin sábado','Total menos sábado','Se usa como base principal porque sábado suele corresponder a virtuales, ajustes, recuperaciones o casos especiales.'],
                        ['Disponibilidad utilizable',`Máximo ${MAX_DIARIO_DOCENTE_DEFENDIBLE} bloques por día, sin sábado`,'Evita leer jornadas completas como totalmente ocupables cuando exceden el máximo diario docente.'],
                        ['Margen operativo',`${formatoNumero(MARGEN_OPERATIVO_DOCENTE*100,0)}%`,'Reserva para restricciones, descansos, ventanas, topes de sala y movimiento real de planificación.'],
                        ['Capacidad defendible','Disponibilidad utilizable × (1 - margen)','Referencia técnica para defender o revisar carga docente.'],
                        ['Homólogo anterior','Horas semestrales informadas en ficha docente','Se compara contra capacidad defendible y carga planificada actual.'],
                        ['Sábado','Se informa separado y con porcentaje','No se elimina: se transparenta para conversación con docente o dirección académica.']
                    ]}
                ];
            }
            if(tipo==='softwareSala'){
                const resumen=hojaSinColumnaAccion(columnas,datos);
                return [
                    {nombre:'Resumen por sala', columnas:resumen.columnas, datos:resumen.datos},
                    {nombre:'Solicitud instalación', columnas:['Sala','Tipo de espacio','Capacidad','Software','Asignaturas','Secciones','Bloques','Observaciones'], datos:filasSoftwarePorSalaDetalladas(datos)}
                ];
            }
            if(tipo==='softwareAsignatura'){
                const resumen=hojaSinColumnaAccion(columnas,datos);
                return [
                    {nombre:'Resumen por asignatura', columnas:resumen.columnas, datos:resumen.datos},
                    {nombre:'Detalle por software', columnas:['Software','Código','Asignatura','Área','Modalidad','Salas','Tipos de espacio','Carreras','Niveles','Bloques','Observaciones'], datos:filasSoftwarePorAsignaturaDetalladas(datos)}
                ];
            }
            return [{nombre:'Reporte', columnas, datos:limpiarDatosExportacion(datos)}];
        }

        function confirmarExportacionReporte({nombreArchivo, formato, total, cantidad, columnas, datos}){
            return new Promise(resolve=>{
                const q=(document.getElementById('reporteBusqueda')?.value||'').trim();
                const muestra=datos.slice(0,3);
                const tabla=muestra.length ? `
                    <table class="report-table" style="margin-top:10px;">
                        <thead><tr>${columnas.map(c=>`<th>${ctx.escapeHTML(c)}</th>`).join('')}</tr></thead>
                        <tbody>${muestra.map(row=>`<tr>${row.map(cell=>`<td>${ctx.escapeHTML(textoCelda(cell))}</td>`).join('')}</tr>`).join('')}</tbody>
                    </table>
                ` : '';
                document.getElementById('modalContainer').innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal">
                    <div class="modal-header">
                        <h3>Exportar reporte</h3>
                        <p>Revisa el archivo antes de descargarlo.</p>
                    </div>
                    <div class="export-preview-grid">
                        <div><span>Archivo</span><strong>${ctx.escapeHTML(nombreArchivo)}</strong></div>
                        <div><span>Formato</span><strong>${ctx.escapeHTML(formato)}</strong></div>
                        <div><span>Registros</span><strong>${cantidad}${q ? ` de ${total}` : ''}</strong></div>
                        <div><span>Filtro</span><strong>${q ? ctx.escapeHTML(q) : 'Sin filtro'}</strong></div>
                    </div>
                    ${tabla}
                    <div class="modal-actions">
                        <button class="btn" id="btnCancelarExportacionReporte">Cancelar</button>
                        <button class="btn btn-primary" id="btnConfirmarExportacionReporte">Exportar</button>
                    </div>
                </div></div>`;
                const cerrar=(ok)=>{
                    ctx.cerrarModal();
                    resolve(ok);
                };
                document.getElementById('btnCancelarExportacionReporte').onclick=()=>cerrar(false);
                document.getElementById('btnConfirmarExportacionReporte').onclick=()=>cerrar(true);
                document.getElementById('modalOverlay').onclick=(e)=>{ if(e.target===e.currentTarget) cerrar(false); };
            });
        }

        function actualizarReporte(){
            const tipo=document.getElementById('reporteTipo')?.value;
            if(!tipo) return;
            const container=document.getElementById('reporteContenido');
            if(!container) return;
            const resumen=document.getElementById('reporteResumen');
            const selTamano=document.getElementById('reporteTamanoPagina');
            const btnAnterior=document.getElementById('btnReporteAnterior');
            const btnSiguiente=document.getElementById('btnReporteSiguiente');
            reporteTamano=[20,50,100].includes(Number(reporteTamano))?Number(reporteTamano):20;
            if(selTamano) selTamano.value=String(reporteTamano);
            const { datos, columnas } = obtenerDatosReporte(tipo);
            const filtrados=filtrarDatosReporte(datos);
            const totalPaginas=Math.max(1,Math.ceil(filtrados.length/reporteTamano));
            reportePagina=Math.max(1,Math.min(totalPaginas,Number(reportePagina)||1));
            const inicio=(reportePagina-1)*reporteTamano;
            const visibles=filtrados.slice(inicio,inicio+reporteTamano);
            const totalFiltrado=tipo==='horasNegociacion'?filaTotalHorasNegociacion(filtrados):null;
            const visiblesConTotal=totalFiltrado?[...visibles,totalFiltrado]:visibles;
            if(resumen){
                const q=(document.getElementById('reporteBusqueda')?.value||'').trim();
                resumen.textContent = datos.length
                    ? `${filtrados.length ? `${inicio+1}-${inicio+visibles.length} de ` : ''}${filtrados.length}${q ? ` filtrados de ${datos.length}` : ' registros'}${filtrados.length ? ` · página ${reportePagina}/${totalPaginas}` : ''}`
                    : '';
            }
            if(btnAnterior) btnAnterior.disabled=reportePagina<=1||!filtrados.length;
            if(btnSiguiente) btnSiguiente.disabled=reportePagina>=totalPaginas||!filtrados.length;
            container.innerHTML = visiblesConTotal.length ? generarTablaReporte(visiblesConTotal, columnas) : '<p>No hay datos para este reporte.</p>';
        }

        async function exportarReporte(){
            const tipo=document.getElementById('reporteTipo')?.value;
            if(!tipo) return;
            const { datos, columnas } = obtenerDatosReporte(tipo);
            const datosExportar=filtrarDatosReporte(datos);
            if(tipo==='horasNegociacion'){
                const total=filaTotalHorasNegociacion(datosExportar);
                if(total) datosExportar.push(total);
            }
            if (!datosExportar.length) return ctx.toast('No hay datos para exportar','info');
            const etiquetas={tro2:'TRO2',docenteNN:'DocenteNN',observacionesPlanificacion:'ObservacionesPlanificacion',criticas:'Criticas',transversales:'Transversales',softwareSala:'SoftwarePorSala',softwareAsignatura:'SoftwarePorAsignatura',validacionPrevia:'ValidacionPrevia',integridadDatos:'IntegridadDatos',gruposDictacion:'GruposDictacion',subseccionesAsignatura:'SubseccionesAsignatura',horasNegociacion:'HorasNegociacionAsignatura',calidadHorario:'CalidadHorario',incompletas:'Incompletas',cargaDocente:'CargaDocente',cargaDefendible:'CargaDefendibleDocente',excedidos:'Excedidos',comparativaHomologo:'ComparativaHomologo',conflictos:'Conflictos'};
            const nombre=(etiquetas[tipo]||'Reporte')+'_'+ctx.getTemporadaLabel();
            const data = getData();
            const usarCompatible=data.configuracion.exportacionExcel==='html';
            let modo='xlsx';
            if(usarCompatible || !window.XLSX || !window.XLSX.utils || !window.XLSX.writeFile){
                if(!usarCompatible){
                    const cargado=ctx.asegurarXLSX ? await ctx.asegurarXLSX() : false;
                    if(!(cargado && window.XLSX?.utils && window.XLSX.writeFile)){
                        const decision=await ctx.resolverFallbackExcel();
                        if(decision!=='html') return;
                        modo='html';
                    }
                }else{
                    modo='html';
                }
            }
            const extension=modo==='html'?'.xls':'.xlsx';
            const confirmado=await confirmarExportacionReporte({
                nombreArchivo:nombre+extension,
                formato:modo==='html'?'Compatible Excel (.xls)':'Excel avanzado (.xlsx)',
                total:datos.length,
                cantidad:datosExportar.length,
                columnas,
                datos:datosExportar
            });
            if(!confirmado) return;
            const hojas=hojasExportacionReporte(tipo,columnas,datosExportar);
            if(modo==='html'){
                ctx.descargarTablaExcel(nombre+'.xls', hojas.map(h=>({nombre:h.nombre, matriz:[h.columnas,...h.datos]})));
                ctx.toast('Reporte exportado','success');
                return;
            }
            const wb=XLSX.utils.book_new();
            hojas.forEach(h=>{
                const ws=formatearHojaReporte(XLSX.utils.aoa_to_sheet([h.columnas,...h.datos]), h.columnas, h.datos);
                XLSX.utils.book_append_sheet(wb,ws,h.nombre);
            });
            XLSX.writeFile(wb,nombre+'.xlsx',{bookSST:true,cellStyles:true});
            ctx.toast('Reporte exportado','success');
        }

        async function ejecutarReparacionIntegridad(payload){
            const data=getData();
            const accion=payload?.accion||payload?.action||'';
            const confirmar=ctx.confirmarAccionCritica || ((opts)=>Promise.resolve(confirm(opts?.mensaje||'¿Continuar?')));
            let titulo='Reparar integridad de datos';
            let detalles=[];
            let ejecutar=null;
            if(accion==='eliminar-planificacion'){
                const ids=[...new Set((payload.ids||[]).filter(Boolean))];
                if(!ids.length) return ctx.toast('No hay bloques para reparar','info');
                const encontrados=data.planificaciones.filter(p=>ids.includes(p.id));
                titulo='Eliminar bloque huérfano';
                detalles=[
                    `${encontrados.length} bloque(s) serán eliminados porque apuntan a datos inexistentes.`,
                    'No se eliminarán secciones, asignaturas, docentes ni salas.'
                ];
                ejecutar=()=>{ data.planificaciones=data.planificaciones.filter(p=>!ids.includes(p.id)); return encontrados.length; };
            }else if(accion==='limpiar-vinculo-grupo'){
                const grupo=(data.gruposDictacion||[]).find(g=>g.id===payload.grupoId);
                if(!grupo) return ctx.toast('El grupo ya no existe','info');
                const seccionId=payload.seccionId;
                titulo='Limpiar vínculo inválido';
                detalles=[
                    'Se quitará una sección vinculada inválida u obsoleta del grupo de dictación.',
                    'Si corresponde a una fusión desvinculada, se conservará la marca histórica en la sección hija.'
                ];
                ejecutar=()=>{
                    const antes=(grupo.seccionesVinculadasIds||[]).length;
                    grupo.seccionesVinculadasIds=(grupo.seccionesVinculadasIds||[]).filter(id=>id!==seccionId);
                    if(!grupo.alumnosManualActivo&&!grupo.seccionesVinculadasIds.length){
                        grupo.alumnosVinculados=0;
                        grupo.alumnosTotales=Number(grupo.alumnosBase)||0;
                    }
                    grupo.actualizadoEn=new Date().toISOString();
                    return antes-grupo.seccionesVinculadasIds.length;
                };
            }else if(accion==='limpiar-vinculos-grupo-desvinculado'){
                const grupo=(data.gruposDictacion||[]).find(g=>g.id===payload.grupoId);
                if(!grupo) return ctx.toast('El grupo ya no existe','info');
                titulo='Limpiar compartidas de grupo desvinculado';
                detalles=[
                    `${(grupo.seccionesVinculadasIds||[]).length} vínculo(s) serán retirados.`,
                    'El grupo seguirá marcado como fusión desvinculada.'
                ];
                ejecutar=()=>{
                    const n=(grupo.seccionesVinculadasIds||[]).length;
                    grupo.seccionesVinculadasIds=[];
                    if(!grupo.alumnosManualActivo){
                        grupo.alumnosVinculados=0;
                        grupo.alumnosTotales=Number(grupo.alumnosBase)||0;
                    }
                    grupo.actualizadoEn=new Date().toISOString();
                    return n;
                };
            }else if(accion==='recalcular-total-grupo'){
                const grupo=(data.gruposDictacion||[]).find(g=>g.id===payload.grupoId);
                if(!grupo) return ctx.toast('El grupo ya no existe','info');
                const total=(Number(grupo.alumnosBase)||0)+(Number(grupo.alumnosVinculados)||0);
                titulo='Recalcular total de alumnos';
                detalles=[
                    `Total actual: ${Number(grupo.alumnosTotales)||0}.`,
                    `Nuevo total: ${total} = propios + vinculados.`
                ];
                ejecutar=()=>{ grupo.alumnosTotales=total; grupo.actualizadoEn=new Date().toISOString(); return 1; };
            }else{
                return ctx.toast('Esta alerta requiere revisión manual','info');
            }
            const ok=await confirmar({
                titulo,
                mensaje:'Esta reparación modificará datos técnicos del modelo.',
                detalles:[...detalles,'Se creará un punto de recuperación antes de aplicar el cambio.'],
                confirmarTexto:'Reparar',
                peligro:true
            });
            if(!ok) return;
            ctx.crearPuntoRecuperacion?.(`antes_reparacion_${accion}`);
            const afectados=ejecutar();
            ctx.reconstruirIndices?.();
            ctx.auditoria?.('reparacion_integridad',{accion,afectados,payload});
            await ctx.guardar?.({forzar:true, motivo:`reparacion_${accion}`});
            actualizarReporte();
            ctx.refrescarTodo?.();
            ctx.toast(`Reparación aplicada (${afectados||0} cambio(s))`,'success');
        }

        function obtenerProgresoSecciones(){
            const data = getData();
            const p=ctx.getPlanificaciones();
            const planesVisibles=(sec,asigId)=>{
                const propios=p.filter(pl=>pl.seccionId===sec.id&&pl.asignaturaId===asigId);
                const vinculados=(Array.isArray(data.gruposDictacion)?data.gruposDictacion:[])
                    .filter(g=>g.seccionMadreId!==sec.id&&g.seccionesVinculadasIds?.includes(sec.id)&&(g.asignaturaId===asigId||g.asignaturasEquivalentesIds?.includes(asigId)))
                    .flatMap(g=>p.filter(pl=>pl.seccionId===g.seccionMadreId&&(pl.asignaturaId===g.asignaturaId||g.asignaturasEquivalentesIds?.includes(pl.asignaturaId))));
                return [...propios,...vinculados];
            };
            return data.secciones.map(sec=>{
                const nivel=data.niveles.find(n=>n.id===sec.nivelId);
                const carreraId=nivel?.carreraId;
                const asignaturaIds=asignaturasDeSeccion(data,sec);
                let requeridos=0, planificados=0;
                asignaturaIds.forEach(asigId=>{
                    const asig=data.asignaturas.find(a=>a.id===asigId);
                    if(!asig) return;
                    const req=(Number(asig.bloquesPresenciales)||0)+(Number(asig.bloquesVirtuales)||0);
                    const hechos=planesVisibles(sec,asigId).length;
                    requeridos+=req;
                    planificados+=Math.min(hechos,req);
                });
                const porcentaje=requeridos?Math.round(planificados/requeridos*100):0;
                return {
                    id:sec.id,
                    nombre:sec.nombre,
                    carreraId,
                    carrera:data.carreras.find(c=>c.id===carreraId)?.codigo||'',
                    nivel:nivel?.nombre||'',
                    nivelId:nivel?.id||'',
                    requeridos,
                    planificados,
                    porcentaje:Math.min(100,porcentaje)
                };
            }).filter(x=>x.requeridos>0);
        }

        function colorProgreso(pct){
            if(pct>=100) return 'var(--success)';
            if(pct>=70) return 'var(--warning)';
            return 'var(--danger)';
        }

        function agruparProgresoPorCarrera(items){
            const data=getData();
            const grupos=new Map();
            items.forEach(item=>{
                const carrera=data.carreras.find(c=>c.id===item.carreraId);
                const key=item.carreraId||'sin-carrera';
                if(!grupos.has(key)) grupos.set(key,{
                    id:key,
                    nombre:carrera?.nombre||item.carrera||'Sin carrera',
                    codigo:carrera?.codigo||item.carrera||'',
                    secciones:[],
                    requeridos:0,
                    planificados:0
                });
                const g=grupos.get(key);
                g.secciones.push(item);
                g.requeridos+=item.requeridos;
                g.planificados+=item.planificados;
            });
            return Array.from(grupos.values()).map(g=>Object.assign(g,{
                porcentaje:g.requeridos?Math.round(g.planificados/g.requeridos*100):0,
                completas:g.secciones.filter(s=>s.porcentaje>=100).length
            })).sort((a,b)=>a.porcentaje-b.porcentaje||a.nombre.localeCompare(b.nombre));
        }

        function abrirDetalleProgresoCarrera(carreraId){
            const data=getData();
            const modal=document.getElementById('modalContainer');
            if(!modal) return;
            const items=obtenerProgresoSecciones().filter(i=>i.carreraId===carreraId);
            if(!items.length) return ctx.toast('No hay secciones con requerimientos en esta carrera','info');
            const carrera=data.carreras.find(c=>c.id===carreraId);
            const renderContenido=(q='')=>{
                const filtro=q.trim().toLowerCase();
                const porNivel=new Map();
                items
                    .filter(item=>!filtro || [item.nombre,item.nivel,item.carrera].join(' ').toLowerCase().includes(filtro))
                    .forEach(item=>{
                        const key=item.nivelId||item.nivel||'sin-nivel';
                        if(!porNivel.has(key)) porNivel.set(key,{nombre:item.nivel||'Sin nivel',items:[],requeridos:0,planificados:0});
                        const g=porNivel.get(key);
                        g.items.push(item);
                        g.requeridos+=item.requeridos;
                        g.planificados+=item.planificados;
                    });
                const niveles=Array.from(porNivel.values()).sort((a,b)=>a.nombre.localeCompare(b.nombre));
                if(!niveles.length) return '<p class="auto-plan-empty">No hay secciones que coincidan con la búsqueda.</p>';
                return niveles.map(nivel=>{
                    const pct=nivel.requeridos?Math.round(nivel.planificados/nivel.requeridos*100):0;
                    const completas=nivel.items.filter(i=>i.porcentaje>=100).length;
                    return `<div class="dashboard-level-group">
                        <div class="dashboard-level-header">
                            <div>
                                <strong>${ctx.escapeHTML(nivel.nombre)}</strong>
                                <span>${completas}/${nivel.items.length} secciones completas · ${nivel.planificados}/${nivel.requeridos} bloques</span>
                            </div>
                            <div class="dashboard-progress-value">${pct}%</div>
                        </div>
                        <div class="dashboard-progress-track"><div class="dashboard-progress-fill" style="width:${Math.min(100,pct)}%;background:${colorProgreso(pct)};"></div></div>
                        <div class="dashboard-section-grid">
                            ${nivel.items.sort((a,b)=>a.porcentaje-b.porcentaje||a.nombre.localeCompare(b.nombre)).map(sec=>`
                                <button class="dashboard-section-card" data-seccion="${ctx.escapeAttr(sec.id)}" type="button">
                                    <span>${ctx.escapeHTML(sec.nombre)}</span>
                                    <strong>${sec.porcentaje}%</strong>
                                    <small>${sec.planificados}/${sec.requeridos}</small>
                                </button>
                            `).join('')}
                        </div>
                    </div>`;
                }).join('');
            };
            const totalReq=items.reduce((acc,i)=>acc+i.requeridos,0);
            const totalPlan=items.reduce((acc,i)=>acc+i.planificados,0);
            const promedio=totalReq?Math.round(totalPlan/totalReq*100):0;
            modal.innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal auto-general-modal">
                    <div class="modal-header">
                        <h3>${ctx.escapeHTML(carrera?.nombre||carrera?.codigo||'Carrera')}</h3>
                        <p>${items.filter(i=>i.porcentaje>=100).length}/${items.length} secciones completas · avance general ${promedio}%</p>
                    </div>
                    <div class="search-box input-with-clear">
                        <input class="form-input" id="buscarProgresoCarrera" placeholder="Buscar sección o nivel..." autocomplete="off">
                    </div>
                    <div id="detalleProgresoCarrera" class="dashboard-career-detail">${renderContenido()}</div>
                    <div class="modal-actions">
                        <button class="btn" id="btnCerrarProgresoCarrera">Cerrar</button>
                    </div>
                </div></div>`;
            const cerrar=()=>{modal.innerHTML='';};
            document.getElementById('btnCerrarProgresoCarrera').onclick=cerrar;
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget) cerrar();};
            document.getElementById('buscarProgresoCarrera').oninput=(e)=>{
                document.getElementById('detalleProgresoCarrera').innerHTML=renderContenido(e.target.value);
            };
            modal.querySelector('#detalleProgresoCarrera').onclick=(e)=>{
                const btn=e.target.closest('[data-seccion]');
                if(!btn || !ctx.irASeccion) return;
                cerrar();
                ctx.irASeccion(btn.dataset.seccion,{mensaje:'Sección abierta desde avance por carrera'});
            };
        }

        function renderBloqueProgresoSecciones(){
            const data = getData();
            const cfg=data.configuracion.dashboard||{};
            if(cfg.seccionesATiempo===false) return '';
            const items=obtenerProgresoSecciones();
            if(!items.length) return '';
            const completas=items.filter(i=>i.porcentaje>=100).length;
            const promedio=Math.round(items.reduce((acc,i)=>acc+i.porcentaje,0)/items.length);
            const carreras=agruparProgresoPorCarrera(items);
            return `
                <div class="dashboard-progress-panel">
                    <div class="dashboard-progress-title">Avance de planificación por carrera</div>
                    <div class="dashboard-progress-subtitle">${completas}/${items.length} secciones completas · promedio ${promedio}% · selecciona una carrera para ver niveles y secciones</div>
                    <div class="dashboard-progress-list">
                        ${carreras.map(item=>`
                            <div class="dashboard-progress-row dashboard-career-link" data-carrera="${ctx.escapeAttr(item.id)}" role="button" tabindex="0" title="Ver niveles y secciones">
                                <div class="dashboard-progress-meta">
                                    <strong>${ctx.escapeHTML(item.codigo||item.nombre)}</strong>
                                    <span>${ctx.escapeHTML(item.nombre)} · ${item.completas}/${item.secciones.length} secciones completas</span>
                                </div>
                                <div class="dashboard-progress-track" aria-label="Avance ${item.porcentaje}%">
                                    <div class="dashboard-progress-fill" style="width:${item.porcentaje}%;background:${colorProgreso(item.porcentaje)};"></div>
                                </div>
                                <div class="dashboard-progress-value">${item.porcentaje}%</div>
                                <div class="dashboard-progress-count">${item.planificados}/${item.requeridos}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
        }

        function bloquesPorDia(planes){
            const mapa=new Map();
            planes.forEach(p=>{
                const key=Number(p.dia);
                if(!mapa.has(key)) mapa.set(key,[]);
                mapa.get(key).push(Number(p.bloque));
            });
            return mapa;
        }

        function contarVentanas(bloques){
            const unicos=[...new Set(bloques)].sort((a,b)=>a-b);
            if(unicos.length<2) return 0;
            let ventanas=0;
            for(let i=1;i<unicos.length;i++) ventanas+=Math.max(0,unicos[i]-unicos[i-1]-1);
            return ventanas;
        }

        function calcularCalidadHorario(){
            const data=getData();
            const planes=ctx.getPlanificaciones();
            const resultado={ventanasSeccion:[],ventanasDocente:[],diasCargados:[],extremos:[],virtuales:[],nn:[],tro2:[]};
            data.secciones.forEach(sec=>{
                const secPlanes=planes.filter(p=>p.seccionId===sec.id);
                bloquesPorDia(secPlanes).forEach((bloques,dia)=>{
                    const ordenados=bloques.sort((a,b)=>a-b);
                    const ventanas=contarVentanas(ordenados);
                    if(ventanas>0) resultado.ventanasSeccion.push({seccionId:sec.id,seccion:sec.nombre,dia,bloques:ordenados,valor:ventanas});
                    if(ordenados.length>=9) resultado.diasCargados.push({tipo:'Sección',seccionId:sec.id,nombre:sec.nombre,dia,bloques:ordenados.length});
                });
            });
            data.docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID).forEach(doc=>{
                const docPlanes=planes.filter(p=>p.docenteId===doc.id);
                bloquesPorDia(docPlanes).forEach((bloques,dia)=>{
                    const ordenados=bloques.sort((a,b)=>a-b);
                    const ventanas=contarVentanas(ordenados);
                    const primero=docPlanes.find(p=>Number(p.dia)===dia);
                    if(ventanas>0) resultado.ventanasDocente.push({docente:`${doc.nombre||''} ${doc.apellido||''}`.trim(),seccionId:primero?.seccionId,dia,bloques:ordenados,valor:ventanas});
                    if(ordenados.length>=9) resultado.diasCargados.push({tipo:'Docente',seccionId:primero?.seccionId,nombre:`${doc.nombre||''} ${doc.apellido||''}`.trim(),dia,bloques:ordenados.length});
                });
            });
            planes.forEach(p=>{
                const asig=data.asignaturas.find(a=>a.id===p.asignaturaId);
                const sec=data.secciones.find(s=>s.id===p.seccionId);
                const base={seccionId:p.seccionId,asignaturaId:p.asignaturaId,seccion:sec?.nombre||'',asignatura:asig?.codigo||asig?.nombre||'',dia:Number(p.dia),bloque:Number(p.bloque)};
                if(Number(p.bloque)<=2 || Number(p.bloque)>=16) resultado.extremos.push(base);
                if(p.tipoPresencial===false && p.dia!==5 && Number(p.bloque)>2 && Number(p.bloque)<16) resultado.virtuales.push(base);
                if(p.docenteId===ctx.DOCENTE_NN_ID) resultado.nn.push(base);
                if(p.salaId===ctx.SALA_TRO2_ID) resultado.tro2.push(base);
            });
            return resultado;
        }

        function calidadItems(calidad){
            return [
                {id:'ventanasSeccion',titulo:'Ventanas sección',valor:calidad.ventanasSeccion.length,tono:'warning'},
                {id:'ventanasDocente',titulo:'Ventanas docente',valor:calidad.ventanasDocente.length,tono:'warning'},
                {id:'diasCargados',titulo:'Días cargados',valor:calidad.diasCargados.length,tono:'danger'},
                {id:'extremos',titulo:'Bloques extremos',valor:calidad.extremos.length,tono:'info'},
                {id:'virtuales',titulo:'Virtuales a revisar',valor:calidad.virtuales.length,tono:'warning'},
                {id:'nn',titulo:'Docente NN',valor:calidad.nn.length,tono:'warning'},
                {id:'tro2',titulo:'TRO2',valor:calidad.tro2.length,tono:'info'}
            ];
        }

        function agruparCalidadPorAsignatura(datos){
            const grupos=new Map();
            datos.forEach(x=>{
                const key=[x.seccionId||'',x.asignaturaId||'',x.dia??'',x.docente||'',x.nombre||''].join('|');
                if(!grupos.has(key)) grupos.set(key,Object.assign({},x,{bloques:[],valor:0}));
                const g=grupos.get(key);
                if(x.bloque!==undefined) g.bloques.push(Number(x.bloque));
                if(Array.isArray(x.bloques)) g.bloques.push(...x.bloques.map(Number));
                g.valor+=Number(x.valor||0);
            });
            return Array.from(grupos.values()).map(g=>Object.assign(g,{
                bloques:[...new Set(g.bloques)].sort((a,b)=>a-b),
                valor:g.valor||undefined
            }));
        }

        function abrirDetalleCalidad(tipo){
            const calidad=calcularCalidadHorario();
            const item=calidadItems(calidad).find(x=>x.id===tipo);
            const datos=['extremos','virtuales','nn','tro2'].includes(tipo)
                ? agruparCalidadPorAsignatura(calidad[tipo]||[])
                : (calidad[tipo]||[]);
            const modal=document.getElementById('modalContainer');
            if(!modal || !item) return;
            const renderFila=(x)=>{
                const dia=ctx.DIAS[x.dia]||'';
                const bloques=Array.isArray(x.bloques)?x.bloques.map(b=>`B${b}`).join(', '):`B${x.bloque}`;
                const nombre=x.seccion||x.docente||x.nombre||'';
                const obs=x.asignatura?`${x.asignatura} · ${dia} ${bloques}`:`${dia} ${bloques}`;
                return `<tr>
                    <td>${ctx.escapeHTML(nombre)}</td>
                    <td>${ctx.escapeHTML(obs)}</td>
                    <td>${x.valor!==undefined?ctx.escapeHTML(x.valor):''}</td>
                    <td>${x.seccionId?`<button class="btn btn-xs report-action-btn" data-seccion="${ctx.escapeAttr(x.seccionId)}" data-asignatura="${ctx.escapeAttr(x.asignaturaId||'')}" type="button">Revisar</button>`:''}</td>
                </tr>`;
            };
            modal.innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal auto-general-modal">
                    <div class="modal-header">
                        <h3>${ctx.escapeHTML(item.titulo)}</h3>
                        <p>${datos.length} grupo(s) detectado(s). Úsalo como señal de revisión, no como error automático.</p>
                    </div>
                    ${datos.length?`<table class="report-table"><thead><tr><th>Elemento</th><th>Detalle</th><th>Valor</th><th>Acción</th></tr></thead><tbody>${datos.slice(0,80).map(renderFila).join('')}</tbody></table>`:'<p class="auto-plan-empty">No hay elementos para revisar en este indicador.</p>'}
                    ${datos.length>80?'<p class="auto-plan-empty">Se muestran los primeros 80 elementos.</p>':''}
                    <div class="modal-actions"><button class="btn" id="btnCerrarCalidad">Cerrar</button></div>
                </div></div>`;
            const cerrar=()=>{modal.innerHTML='';};
            document.getElementById('btnCerrarCalidad').onclick=cerrar;
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget) cerrar();};
        }

        function renderCalidadHorario(){
            const data=getData();
            const cfg=data.configuracion.dashboard||{};
            if(cfg.calidadHorario===false) return '';
            const calidad=calcularCalidadHorario();
            const items=calidadItems(calidad);
            const total=items.reduce((acc,i)=>acc+i.valor,0);
            return `<div class="dashboard-quality-panel">
                <div class="dashboard-progress-title">Calidad de horario</div>
                <div class="dashboard-progress-subtitle">${total} señal(es) de revisión detectadas · presiona un indicador para ver detalle</div>
                <div class="dashboard-quality-grid">
                    ${items.map(i=>`<button class="dashboard-quality-card ${i.tono}" data-calidad="${ctx.escapeAttr(i.id)}" type="button">
                        <strong>${i.valor}</strong>
                        <span>${ctx.escapeHTML(i.titulo)}</span>
                    </button>`).join('')}
                </div>
            </div>`;
        }

        function calcularScoreGlobalHorario(){
            const data=getData();
            const planes=ctx.getPlanificaciones();
            const calidad=calcularCalidadHorario();
            const progreso=obtenerProgresoSecciones();
            const requeridos=progreso.reduce((acc,x)=>acc+x.requeridos,0);
            const planificados=progreso.reduce((acc,x)=>acc+x.planificados,0);
            const cobertura=requeridos?Math.round(planificados/requeridos*100):0;
            const conflictos=detectarConflictosBase().length;
            const nivelesPeso={'desactivado':0,bajo:0.55,medio:1,alto:1.45,'muy-alto':2};
            const solverPesos=data.configuracion?.solverPesos||{};
            const pesoSolver=(criterio,base)=>base*(nivelesPeso[solverPesos[criterio]||'medio']??1);
            const etiquetaPeso=(criterio)=>{
                const labels={'desactivado':'desactivado',bajo:'bajo',medio:'medio',alto:'alto','muy-alto':'muy alto'};
                return labels[solverPesos[criterio]||'medio']||'medio';
            };
            const seccionPorId=new Map(data.secciones.map(s=>[s.id,s]));
            const docenteDia=new Map();
            let fueraJornada=0;
            planes.forEach(p=>{
                const sec=seccionPorId.get(p.seccionId);
                const bloque=Number(p.bloque)||0;
                if(sec?.jornada==='diurna' && bloque>12) fueraJornada++;
                if(sec?.jornada==='vespertina' && bloque>0 && bloque<13) fueraJornada++;
                if(p.docenteId && p.docenteId!==ctx.DOCENTE_NN_ID){
                    const key=`${p.docenteId}|${p.dia}`;
                    docenteDia.set(key,(docenteDia.get(key)||0)+1);
                }
            });
            const excesoDiarioDocente=[...docenteDia.values()].filter(total=>total>13).length;
            const herenciasPendientes=(data.gruposDictacion||[]).filter(g=>g.estado&&g.estado!=='resuelto').length;
            const metricas=[
                {id:'cobertura',criterio:'bloquesFaltantes',titulo:'Cobertura',valor:100-cobertura,impacto:Math.max(0,100-cobertura),peso:pesoSolver('bloquesFaltantes',1.2),detalle:`${planificados}/${requeridos} bloques requeridos`},
                {id:'ventanasSeccion',criterio:'ventanasEstudiantes',titulo:'Ventanas de sección',valor:calidad.ventanasSeccion.length,impacto:calidad.ventanasSeccion.length*4,peso:pesoSolver('ventanasEstudiantes',1.1),detalle:'Afectan continuidad del estudiante'},
                {id:'ventanasDocente',criterio:'ventanasDocentes',titulo:'Ventanas docentes',valor:calidad.ventanasDocente.length,impacto:calidad.ventanasDocente.length*3,peso:pesoSolver('ventanasDocentes',1),detalle:'Afectan calidad del horario docente'},
                {id:'conflictos',criterio:'topesDuros',titulo:'Conflictos',valor:conflictos,impacto:conflictos*14,peso:pesoSolver('topesDuros',1.4),detalle:'Topes de docente o sala'},
                {id:'diasCargados',criterio:'distribucionSemanal',titulo:'Días cargados',valor:calidad.diasCargados.length,impacto:calidad.diasCargados.length*5,peso:pesoSolver('distribucionSemanal',0.9),detalle:'Días con demasiados bloques'},
                {id:'fueraJornada',criterio:'respetoJornada',titulo:'Fuera de jornada',valor:fueraJornada,impacto:fueraJornada*8,peso:pesoSolver('respetoJornada',1.2),detalle:'Bloques fuera de la jornada de la sección'},
                {id:'excesoDocente',criterio:'excesoDiarioDocente',titulo:'Exceso docente',valor:excesoDiarioDocente,impacto:excesoDiarioDocente*7,peso:pesoSolver('excesoDiarioDocente',1.1),detalle:'Días docentes sobre 13 bloques'},
                {id:'nn',criterio:'bloquesFaltantes',titulo:'Docente NN',valor:calidad.nn.length,impacto:calidad.nn.length*2.5,peso:pesoSolver('bloquesFaltantes',0.8),detalle:'Bloques sin docente real'},
                {id:'tro2',criterio:'salasCorrectas',titulo:'TRO2',valor:calidad.tro2.length,impacto:calidad.tro2.length*2,peso:pesoSolver('salasCorrectas',0.7),detalle:'Bloques sin sala definitiva'},
                {id:'virtuales',criterio:'virtuales',titulo:'Virtuales a revisar',valor:calidad.virtuales.length,impacto:calidad.virtuales.length*2,peso:pesoSolver('virtuales',0.6),detalle:'Virtuales fuera del patrón preferido'},
                {id:'herencias',criterio:'transversalesHeredadas',titulo:'Herencias pendientes',valor:herenciasPendientes,impacto:herenciasPendientes*4,peso:pesoSolver('transversalesHeredadas',0.8),detalle:'Relaciones compartidas sin resolver'}
            ];
            const perdida=Math.round(metricas.reduce((acc,m)=>acc+(m.impacto*m.peso),0));
            const score=Math.max(0,Math.min(100,100-perdida));
            const principales=metricas
                .filter(m=>m.peso>0&&(m.valor>0||m.id==='cobertura'))
                .sort((a,b)=>(b.impacto*b.peso)-(a.impacto*a.peso))
                .slice(0,4)
                .map(m=>Object.assign({},m,{detalle:`${m.detalle} · peso ${etiquetaPeso(m.criterio)}`}));
            return {score,cobertura,planes:planes.length,requeridos,planificados,perdida,metricas,principales};
        }

        function renderScoreGlobalHorario(){
            const data=getData();
            const cfg=data.configuracion.dashboard||{};
            if(cfg.calidadHorario===false) return '';
            const score=calcularScoreGlobalHorario();
            const tono=score.score>=85?'success':score.score>=65?'warning':'danger';
            const color=score.score>=85?'var(--success)':score.score>=65?'var(--warning)':'var(--danger)';
            return `<div class="global-score-panel ${tono}">
                <div class="global-score-main">
                    <div>
                        <div class="dashboard-progress-title">Score global del horario</div>
                        <div class="dashboard-progress-subtitle">Brújula inicial del optimizador · usa los pesos configurables de criterios del solver</div>
                    </div>
                    <div class="global-score-value" style="color:${color};">${score.score}%</div>
                </div>
                <div class="global-score-track"><div style="width:${score.score}%;background:${color};"></div></div>
                <div class="global-score-grid">
                    <div><strong>${score.cobertura}%</strong><span>Cobertura</span></div>
                    <div><strong>${score.planificados}/${score.requeridos}</strong><span>Bloques</span></div>
                    <div><strong>${score.perdida}</strong><span>Pérdida</span></div>
                    <div><strong>${score.planes}</strong><span>Planificados</span></div>
                </div>
                <div class="global-score-losses">
                    ${score.principales.map(m=>`<button class="global-score-loss" data-score-loss="${ctx.escapeAttr(m.id)}" type="button">
                        <strong>${ctx.escapeHTML(m.titulo)}</strong>
                        <span>${ctx.escapeHTML(String(m.valor))} · ${ctx.escapeHTML(m.detalle)}</span>
                    </button>`).join('')}
                </div>
            </div>`;
        }

        function renderValidacionPrevia(){
            const data=getData();
            const cfg=data.configuracion.dashboard||{};
            if(cfg.validacionPrevia===false) return '';
            const issues=calcularValidacionPrevia();
            const counts=issues.reduce((acc,x)=>{
                acc[x.severidad]=(acc[x.severidad]||0)+1;
                return acc;
            },{critico:0,advertencia:0,info:0});
            const estado=counts.critico?'No listo':(counts.advertencia?'Revisar':'Listo');
            const tono=counts.critico?'danger':(counts.advertencia?'warning':'success');
            const destacados=issues.slice(0,4);
            return `<div class="dashboard-validation-panel ${tono}">
                <div class="dashboard-validation-header">
                    <div>
                        <div class="dashboard-progress-title">Validación previa</div>
                        <div class="dashboard-progress-subtitle">${issues.length ? `${issues.length} señal(es) antes de autoplanificar` : 'Datos listos para planificar con seguridad'}</div>
                    </div>
                    <button class="btn btn-sm" data-report="validacionPrevia" type="button">Ver detalle</button>
                </div>
                <div class="dashboard-validation-grid">
                    <div><strong>${counts.critico||0}</strong><span>Críticas</span></div>
                    <div><strong>${counts.advertencia||0}</strong><span>Advertencias</span></div>
                    <div><strong>${counts.info||0}</strong><span>Revisión</span></div>
                    <div><strong>${ctx.escapeHTML(estado)}</strong><span>Estado</span></div>
                </div>
                ${destacados.length?`<div class="dashboard-validation-list">
                    ${destacados.map(x=>`<div class="dashboard-validation-item ${tonoSeveridad[x.severidad]||'info'}">
                        <span>${ctx.escapeHTML(etiquetaSeveridad[x.severidad]||x.severidad)}</span>
                        <strong>${ctx.escapeHTML(x.categoria)}</strong>
                        <em>${ctx.escapeHTML(x.elemento)}</em>
                    </div>`).join('')}
                </div>`:''}
            </div>`;
        }

        function abrirDetallePreparacionCarrera(carreraId){
            const modal=document.getElementById('modalContainer');
            if(!modal) return;
            const items=calcularPreparacionSecciones().filter(x=>x.carreraId===carreraId);
            if(!items.length) return ctx.toast('No hay secciones para esta carrera','info');
            const carrera=items[0];
            const porNivel=new Map();
            items.forEach(item=>{
                const key=item.nivelId||item.nivel||'sin-nivel';
                if(!porNivel.has(key)) porNivel.set(key,{nombre:item.nivel,items:[]});
                porNivel.get(key).items.push(item);
            });
            const renderSeccion=(s)=>`
                <button class="dashboard-section-card preparation-section-card ${s.estado==='No listo'?'danger':s.estado==='Revisar'?'warning':'success'}" data-seccion="${ctx.escapeAttr(s.id)}" type="button">
                    <span>${ctx.escapeHTML(s.nombre)}</span>
                    <strong>${s.puntaje}%</strong>
                    <small>${ctx.escapeHTML(s.estado)} · C${s.criticos} A${s.advertencias} R${s.info}</small>
                </button>`;
            const niveles=Array.from(porNivel.values()).sort((a,b)=>a.nombre.localeCompare(b.nombre));
            modal.innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal auto-general-modal">
                    <div class="modal-header">
                        <h3>${ctx.escapeHTML(carrera.carrera)}</h3>
                        <p>Preparación previa por nivel y sección. Abre una sección para corregir o completar datos antes de autoplanificar.</p>
                    </div>
                    <div class="dashboard-career-detail">
                        ${niveles.map(nivel=>{
                            const promedio=Math.round(nivel.items.reduce((acc,s)=>acc+s.puntaje,0)/Math.max(1,nivel.items.length));
                            return `<div class="dashboard-level-group">
                                <div class="dashboard-level-header">
                                    <div>
                                        <strong>${ctx.escapeHTML(nivel.nombre)}</strong>
                                        <span>${nivel.items.filter(s=>s.estado==='Listo').length}/${nivel.items.length} listas · promedio ${promedio}%</span>
                                    </div>
                                    <div class="dashboard-progress-value">${promedio}%</div>
                                </div>
                                <div class="dashboard-section-grid">${nivel.items.map(renderSeccion).join('')}</div>
                            </div>`;
                        }).join('')}
                    </div>
                    <div class="modal-actions"><button class="btn" id="btnCerrarPreparacion">Cerrar</button></div>
                </div></div>`;
            const cerrar=()=>{modal.innerHTML='';};
            document.getElementById('btnCerrarPreparacion').onclick=cerrar;
            document.getElementById('modalOverlay').onclick=(e)=>{if(e.target===e.currentTarget) cerrar();};
        }

        function renderPreparacionPorCarrera(){
            const data=getData();
            const cfg=data.configuracion.dashboard||{};
            if(cfg.validacionPrevia===false) return '';
            const items=calcularPreparacionSecciones();
            if(!items.length) return '';
            const carreras=agruparPreparacionPorCarrera(items);
            const listas=items.filter(s=>s.estado==='Listo').length;
            return `<div class="dashboard-preparation-panel">
                <div class="dashboard-progress-title">Preparación por carrera</div>
                <div class="dashboard-progress-subtitle">${listas}/${items.length} secciones listas · presiona una carrera para ver niveles y secciones</div>
                <div class="dashboard-progress-list">
                    ${carreras.map(c=>`
                        <div class="dashboard-progress-row dashboard-preparation-link" data-preparacion-carrera="${ctx.escapeAttr(c.id)}" role="button" tabindex="0" title="Ver preparación por sección">
                            <div class="dashboard-progress-meta">
                                <strong>${ctx.escapeHTML(c.codigo||c.nombre)}</strong>
                                <span>${ctx.escapeHTML(c.nombre)} · ${c.listas} listas · ${c.revisar} revisar · ${c.noListas} no listas</span>
                            </div>
                            <div class="dashboard-progress-track" aria-label="Preparación ${c.puntaje}%">
                                <div class="dashboard-progress-fill" style="width:${Math.min(100,c.puntaje)}%;background:${colorProgreso(c.puntaje)};"></div>
                            </div>
                            <div class="dashboard-progress-value">${c.puntaje}%</div>
                            <div class="dashboard-progress-count">C${c.criticos} A${c.advertencias}</div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }

        function renderResumenCriteriosAsignatura(){
            const data=getData();
            const cfg=data.configuracion.dashboard||{};
            if(cfg.criteriosAsignatura===false || !data.asignaturas.length) return '';
            const contar=(campo,labels,defecto)=>Object.entries(data.asignaturas.reduce((acc,a)=>{
                const key=labels[a?.[campo]]?a[campo]:defecto;
                acc[key]=(acc[key]||0)+1;
                return acc;
            },{})).map(([k,v])=>({label:labels[k]||k,total:v})).sort((a,b)=>b.total-a.total||a.label.localeCompare(b.label));
            const grupos=[
                {titulo:'Área', items:contar('area',LABEL_CRITERIOS.area,'especialidad')},
                {titulo:'Modalidad', items:contar('modalidad',LABEL_CRITERIOS.modalidad,'lectiva')},
                {titulo:'Condición', items:contar('condicion',LABEL_CRITERIOS.condicion,'normal')}
            ];
            return `<div class="dashboard-criteria-panel">
                <div class="dashboard-progress-title">Resumen por criterios de asignatura</div>
                <div class="dashboard-progress-subtitle">${data.asignaturas.length} asignaturas clasificadas</div>
                <div class="dashboard-criteria-grid">
                    ${grupos.map(g=>`<div>
                        <strong>${ctx.escapeHTML(g.titulo)}</strong>
                        <div>${g.items.map(item=>`<span class="item-chip dashboard-criteria-chip">${ctx.escapeHTML(item.label)}: ${item.total}</span>`).join('')}</div>
                    </div>`).join('')}
                </div>
            </div>`;
        }

        function renderDashboard(){
            const data = getData();
            const cont=document.getElementById('dashboardContenido');
            if(!cont) return;
            const firmaDashboard=firmaDatosReporte();
            if(cont.dataset.dashboardFirma===firmaDashboard && cont.innerHTML.trim()) return;
            const cfg=data.configuracion.dashboard||{};
            const p=ctx.getPlanificaciones();
            const cards=[];
            if(data.ultimoAutoGeneral){
                const fecha=data.ultimoAutoGeneral.ts ? new Date(data.ultimoAutoGeneral.ts).toLocaleDateString() : '';
                cards.push({t:`🧭 Último Auto-general${fecha?` · ${fecha}`:''}`,v:data.ultimoAutoGeneral.seccionesConCambio||0,c:'var(--accent)',autoGeneral:true});
            }
            const autosActivos=(data.autoEjecuciones||[]).filter(e=>e.ids?.some(id=>data.planificaciones.some(p=>p.id===id))).length;
            if(autosActivos){
                cards.push({t:'↩ Revertir autos',v:autosActivos,c:'var(--danger)',undoAuto:true});
            }
            if(cfg.totalAsignaturas!==false) cards.push({t:'📦 Asignaturas',v:data.asignaturas.length});
            if(cfg.totalDocentes!==false) cards.push({t:'👨‍🏫 Docentes',v:data.docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID).length,report:'cargaDocente'});
            if(cfg.totalBloques!==false) cards.push({t:'📋 Bloques planificados',v:p.length});
            if(cfg.presencialVirtual!==false){
                const pres=p.filter(x=>x.tipoPresencial!==false).length;
                const vir=p.filter(x=>x.tipoPresencial===false).length;
                cards.push({t:'🏛️ Presenciales',v:`${pres} (${pres*18}h)`});
                cards.push({t:'💻 Virtuales',v:`${vir} (${vir*18}h)`});
            }
            if(cfg.incompletas!==false){
                const inc=data.asignaturas.filter(a=>{const pp=p.filter(pl=>pl.asignaturaId===a.id); return pp.filter(x=>x.tipoPresencial!==false).length<a.bloquesPresenciales||pp.filter(x=>x.tipoPresencial===false).length<a.bloquesVirtuales;}).length;
                if(inc>0) cards.push({t:'⚠️ Incompletas',v:inc,c:'var(--danger)',report:'incompletas'});
            }
            const integridad=calcularIntegridadDatos();
            const integridadCritica=integridad.filter(x=>x.severidad==='critico').length;
            const integridadAdvertencia=integridad.filter(x=>x.severidad==='advertencia').length;
            if(integridadCritica||integridadAdvertencia){
                cards.push({
                    t:'🛡️ Integridad de datos',
                    v:integridadCritica?`${integridadCritica} críticos`:`${integridadAdvertencia} revisión`,
                    c:integridadCritica?'var(--danger)':'var(--warning)',
                    report:'integridadDatos'
                });
            }
            if(cfg.docenteNN!==false){
                const gruposNN=new Set(p.filter(x=>x.docenteId===ctx.DOCENTE_NN_ID).map(x=>`${x.asignaturaId}_${x.seccionId}`));
                if(gruposNN.size) cards.push({t:'👤 Asignaturas con Docente NN',v:gruposNN.size,c:'var(--warning)',report:'docenteNN'});
            }
            if(cfg.tro2!==false){
                const gruposTro2=new Set(p.filter(x=>x.salaId===ctx.SALA_TRO2_ID).map(x=>`${x.asignaturaId}_${x.seccionId}`));
                if(gruposTro2.size) cards.push({t:'📍 Asignaturas en TRO2',v:gruposTro2.size,c:'var(--warning)',report:'tro2'});
            }
            if(cfg.criticas!==false){
                const criticas=data.asignaturas.filter(a=>['alta-reprobacion','requiere-ayudantia','alta-reprobacion-ayudantia'].includes(a.condicion)).length;
                if(criticas) cards.push({t:'🎯 Asignaturas críticas',v:criticas,c:'var(--warning)',report:'criticas'});
            }
            if(cfg.transversales!==false){
                const transversales=data.asignaturas.filter(a=>a.area==='transversal'||a.controlHorario==='coordinacion-externa').length;
                if(transversales) cards.push({t:'🤝 Transversales / externas',v:transversales,c:'var(--accent)',report:'transversales'});
            }
            const gestor=data.gestorSecciones||{};
            const cargasGestor=Array.isArray(gestor.cargas)?gestor.cargas:[];
            const ultimaGestor=cargasGestor.find(c=>c.id===gestor.ultimaCargaId)||cargasGestor[0]||null;
            const idsGestor=Array.isArray(gestor.ids)?(ultimaGestor?gestor.ids.filter(x=>x.cargaId===ultimaGestor.id):gestor.ids):[];
            const enlacesGestor=new Set((Array.isArray(gestor.enlacesManuales)?gestor.enlacesManuales:[]).map(x=>String(x.idSeccion||'')));
            const idsPendientesGestor=idsGestor.filter(x=>x.estado==='pendiente_externa'&&!enlacesGestor.has(String(x.idSeccion||''))).length;
            if(idsPendientesGestor){
                cards.push({t:'🧩 IDs Gestor pendientes',v:idsPendientesGestor,c:'var(--warning)',gestorPendientes:true});
            }
            const gruposDictacion=Array.isArray(data.gruposDictacion)?data.gruposDictacion:[];
            if(gruposDictacion.length){
                const heredadas=gruposDictacion.reduce((acc,g)=>acc+(g.seccionesVinculadasIds||[]).length,0);
                const alertasFusion=calcularValidacionPrevia().filter(x=>x.categoria==='Grupo de dictación'||x.categoria==='Capacidad de sala').length;
                cards.push({t:'🔗 Grupos de dictación',v:gruposDictacion.length,c:alertasFusion?'var(--warning)':'var(--accent)',report:'gruposDictacion'});
                if(heredadas) cards.push({t:'↪ Asignaturas heredadas',v:heredadas,c:'var(--accent)',report:'gruposDictacion'});
                if(alertasFusion) cards.push({t:'⚠️ Alertas de fusiones',v:alertasFusion,c:'var(--danger)',report:'gruposDictacion'});
            }
            const subsecciones=(data.asignaturaSeccion||[]).filter(r=>r.usaSubsecciones&&Array.isArray(r.componentesSubseccion)&&r.componentesSubseccion.length).length;
            if(subsecciones) cards.push({t:'🧪 Subsecciones de asignatura',v:subsecciones,c:'var(--accent)',report:'subseccionesAsignatura'});
            if(cfg.seccionesATiempo!==false){
                const progreso=obtenerProgresoSecciones();
                if(progreso.length){
                    const completas=progreso.filter(i=>i.porcentaje>=100).length;
                    cards.push({t:'✅ Secciones completas',v:`${completas}/${progreso.length}`,c:completas===progreso.length?'var(--success)':'var(--warning)'});
                }
            }
            cont.innerHTML=cards.map(c=>`<div class="dashboard-card ${(c.report||c.autoGeneral||c.undoAuto||c.gestorPendientes)?'dashboard-card-action':''}" ${c.report?`data-report="${ctx.escapeHTML(c.report)}" role="button" tabindex="0" title="Abrir reporte"`:''}${c.autoGeneral?'data-auto-general="ultimo" role="button" tabindex="0" title="Abrir último Auto-general"':''}${c.undoAuto?'data-undo-auto="ultimo" role="button" tabindex="0" title="Revertir autos"':''}${c.gestorPendientes?'data-gestor-pendientes="true" role="button" tabindex="0" title="Revisar IDs pendientes del Gestor"':''}><div style="font-size:1.5rem;font-weight:700;color:${c.c||'var(--accent)'}">${ctx.escapeHTML(c.v)}</div><div style="font-size:0.78rem;color:var(--text-secondary);margin-top:4px;">${ctx.escapeHTML(c.t)}</div></div>`).join('');
            cont.innerHTML+=renderScoreGlobalHorario();
            cont.innerHTML+=renderValidacionPrevia();
            cont.innerHTML+=renderPreparacionPorCarrera();
            cont.innerHTML+=renderResumenCriteriosAsignatura();
            cont.innerHTML+=renderBloqueProgresoSecciones();
            cont.innerHTML+=renderCalidadHorario();
            if(cfg.docentesEsp!==false){
                const espGroups={};
                data.docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID).forEach(d=>{if(d.especialidad) espGroups[d.especialidad]=(espGroups[d.especialidad]||0)+1;});
                if(Object.keys(espGroups).length){
                    let espHtml='<div style="grid-column:1/-1;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-top:4px;"><div style="font-size:0.85rem;font-weight:600;margin-bottom:8px;">👥 Docentes por especialidad</div><div style="display:flex;gap:6px;flex-wrap:wrap;">';
                    Object.entries(espGroups).forEach(([k,v])=>espHtml+=`<span class="item-chip">${ctx.escapeHTML(k)}: ${v}</span>`);
                    cont.innerHTML+=espHtml+'</div></div>';
                }
            }
            cont.dataset.dashboardFirma=firmaDashboard;
        }

        function detectarConflictos(){
            const data = getData();
            const cont=document.getElementById('dashboardConflictos');
            if(!cont) return;
            const firmaConflictos=firmaDatosReporte();
            if(cont.dataset.conflictosFirma===firmaConflictos && cont.innerHTML.trim()) return;
            if(data.configuracion.dashboard&&data.configuracion.dashboard.conflictos===false){ cont.style.display='none'; return; }
            cont.style.display='block';
            const conflictos=detectarConflictosBase();
            if(!conflictos.length){ cont.innerHTML='<p style="color:var(--success);font-size:0.85rem;">✅ Sin conflictos.</p>'; cont.dataset.conflictosFirma=firmaConflictos; return; }
            cont.innerHTML=`
                <div class="dashboard-conflict-list">
                    ${conflictos.slice(0,8).map(c=>{
                        const primero=c.planes[0]||{};
                        const secciones=[...new Set(c.planes.map(p=>nombreSeccion(data,p.seccionId)).filter(Boolean))].join(', ');
                        const detalle=`${c.tipo}: ${c.recurso} · ${ctx.DIAS[c.dia]} B${c.bloque}`;
                        return `<div class="dashboard-conflict-item">
                            <div>
                                <strong>${ctx.escapeHTML(detalle)}</strong>
                                <span>${ctx.escapeHTML(secciones||'Sin sección')}</span>
                            </div>
                            ${accionSeccion(primero.seccionId,primero.asignaturaId,'Revisar').html}
                        </div>`;
                    }).join('')}
                </div>
                ${conflictos.length>8?`<button class="btn btn-xs dashboard-conflict-report" data-report="conflictos" type="button">Ver ${conflictos.length} conflictos</button>`:''}
            `;
            cont.dataset.conflictosFirma=firmaConflictos;
        }

        function renderHistorial(){
            const data=getData();
            const cont=document.getElementById('historialContenido');
            if(!cont) return;
            const eventosBase=(data.auditoria||[]).slice().reverse();
            if(!eventosBase.length){
                cont.innerHTML='<p style="color:var(--text-secondary);font-size:0.85rem;">Aún no hay acciones registradas.</p>';
                return;
            }
            const accionActual=document.getElementById('historialFiltroAccion')?.value||'';
            const usuarioActual=document.getElementById('historialFiltroUsuario')?.value||'';
            const busqueda=(document.getElementById('historialBusqueda')?.value||'').trim().toLowerCase();
            const acciones=[...new Set(eventosBase.map(ev=>ev.accion).filter(Boolean))].sort();
            const usuarios=[...new Set(eventosBase.map(ev=>ev.usuario).filter(Boolean))].sort();
            const usuarioLabel=(evOrEmail)=>{
                const email=typeof evOrEmail==='string'?evOrEmail:evOrEmail?.usuario;
                const nombre=typeof evOrEmail==='object'?(evOrEmail.usuarioNombre||data.configuracion?.perfilesUsuarios?.[email]?.nombre):data.configuracion?.perfilesUsuarios?.[email]?.nombre;
                return nombre&&nombre!==email?`${nombre} (${email})`:(email||'');
            };
            const temporadaEvento=(ev)=>{
                const temporada=data.temporadas?.find(t=>String(t.id)===String(ev?.temporadaId));
                return temporada?`${temporada.temporada} ${temporada.anio}`:(ev?.temporadaId||'Sin temporada');
            };
            const diaBloque=(plan)=>{
                if(!plan||plan.dia===undefined) return '';
                const ab={Lunes:'Lu',Martes:'Ma','Miércoles':'Mi',Jueves:'Ju',Viernes:'Vi','Sábado':'Sa'};
                const dia=ctx.DIAS[plan.dia]||'';
                return `${ab[dia]||dia.slice(0,2)}-${plan.bloque}`;
            };
            const nombrePlan=(plan)=>{
                if(!plan) return '';
                const sec=data.secciones.find(s=>s.id===plan.seccionId);
                const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
                const doc=data.docentes.find(d=>d.id===plan.docenteId);
                const sala=data.salas.find(s=>s.id===plan.salaId);
                return [
                    sec?.nombre,
                    asig?.codigo||asig?.nombre,
                    doc?(doc.id===ctx.DOCENTE_NN_ID?'Docente NN':`${doc.nombre||''} ${doc.apellido||''}`.trim()):'',
                    sala?.nombre,
                    plan.dia!==undefined?`${ctx.DIAS[plan.dia]||''} B${plan.bloque}`:''
                ].filter(Boolean).join(' · ');
            };
            const contextoPlan=(plan)=>{
                const sec=data.secciones.find(s=>s.id===plan?.seccionId);
                const asig=data.asignaturas.find(a=>a.id===plan?.asignaturaId);
                const doc=data.docentes.find(d=>d.id===plan?.docenteId);
                const sala=data.salas.find(s=>s.id===plan?.salaId);
                return {
                    seccion:sec?.nombre||plan?.seccionId||'',
                    asignatura:[asig?.codigo,asig?.nombre].filter(Boolean).join(' · ')||plan?.asignaturaId||'',
                    docente:doc?(doc.id===ctx.DOCENTE_NN_ID?'Docente NN':`${doc.nombre||''} ${doc.apellido||''}`.trim()):(plan?.docenteId||''),
                    sala:sala?.nombre||plan?.salaId||''
                };
            };
            const eventoAgrupable=(ev)=>['bloque_creado','bloque_eliminado','bloque_movido'].includes(ev.accion);
            const planBaseEvento=(ev)=>{
                const d=ev.detalle||{};
                return d.plan||d.antes||d.despues||null;
            };
            const claveGrupoEvento=(ev)=>{
                const p=planBaseEvento(ev);
                if(!eventoAgrupable(ev)||!p) return ev.id||`${ev.ts}_${ev.accion}`;
                const operacion=ev.operacionId||ev.revisionId||String(ev.ts||'').slice(0,19)||ev.id;
                return [operacion,ev.accion,ev.usuario,p.seccionId,p.asignaturaId].join('|');
            };
            const agruparEventos=(eventos)=>{
                const grupos=[];
                const mapa=new Map();
                eventos.forEach(ev=>{
                    const clave=claveGrupoEvento(ev);
                    if(!eventoAgrupable(ev)){
                        grupos.push({eventos:[ev],primero:ev});
                        return;
                    }
                    if(!mapa.has(clave)){
                        const grupo={eventos:[],primero:ev};
                        mapa.set(clave,grupo);
                        grupos.push(grupo);
                    }
                    mapa.get(clave).eventos.push(ev);
                });
                return grupos;
            };
            const detalleEvento=(ev)=>{
                const d=ev.detalle||{};
                if(ev.accion==='bloque_creado') return nombrePlan(d.plan);
                if(ev.accion==='bloque_eliminado') return nombrePlan(d.plan);
                if(ev.accion==='bloque_movido') return `${nombrePlan(d.antes)} → ${nombrePlan(d.despues)}`;
                if(ev.accion==='bloques_eliminados_asignatura') return `${d.cantidad||0} bloque(s) eliminados · ${nombrePlan((d.bloques||[])[0])}`;
                if(ev.accion==='gestor_secciones_importado'){
                    const r=d.resumen||{};
                    return [
                        d.archivo?`Archivo: ${d.archivo}`:'',
                        `filas: ${d.filas||0}`,
                        `carreras: ${r.carreras||0}`,
                        `niveles: ${r.niveles||0}`,
                        `secciones: ${r.secciones||0}`,
                        `asignaturas: ${r.asignaturas||0}`,
                        `grupos: ${r.grupos||0}`,
                        `vínculos: ${r.vinculos||0}`,
                        `omitidos: ${r.omitidos||0}`
                    ].filter(Boolean).join(' · ');
                }
                if(d&&typeof d==='object') return Object.entries(d).map(([k,v])=>`${k}: ${Array.isArray(v)?v.length+' item(s)':v}`).join(' · ');
                return d||'';
            };
            const eventos=eventosBase.filter(ev=>{
                const detalle=detalleEvento(ev);
                if(accionActual&&ev.accion!==accionActual) return false;
                if(usuarioActual&&ev.usuario!==usuarioActual) return false;
                if(busqueda&&!`${ev.accion||''} ${ev.usuario||''} ${ev.motivo||''} ${detalle}`.toLowerCase().includes(busqueda)) return false;
                return true;
            });
            const gruposTodos=agruparEventos(eventos);
            historialTamano=[20,50,100].includes(Number(historialTamano))?Number(historialTamano):20;
            const totalPaginas=Math.max(1,Math.ceil(gruposTodos.length/historialTamano));
            historialPagina=Math.max(1,Math.min(totalPaginas,Number(historialPagina)||1));
            const inicio=(historialPagina-1)*historialTamano;
            const grupos=gruposTodos.slice(inicio,inicio+historialTamano);
            const detalleGrupo=(grupo)=>{
                const ev=grupo.primero;
                const motivo=[...new Set(grupo.eventos.map(e=>String(e.motivo||'').trim()).filter(Boolean))].join(' · ');
                const anexarMotivo=texto=>motivo?`${texto} · Motivo: ${motivo}`:texto;
                if(!eventoAgrupable(ev)||grupo.eventos.length===1) return anexarMotivo(detalleEvento(ev));
                const p=planBaseEvento(ev);
                const ctxPlan=contextoPlan(p);
                if(ev.accion==='bloque_movido'){
                    const movs=grupo.eventos.map(e=>`${diaBloque(e.detalle?.antes)} → ${diaBloque(e.detalle?.despues)}`).filter(Boolean).join(', ');
                    return anexarMotivo(`${ctxPlan.seccion} · ${ctxPlan.asignatura} · ${ctxPlan.docente} · ${movs}`);
                }
                const bloques=grupo.eventos.map(e=>diaBloque(e.detalle?.plan)).filter(Boolean).join(', ');
                return anexarMotivo(`${ctxPlan.seccion} · ${ctxPlan.asignatura} · ${ctxPlan.docente} · ${ctxPlan.sala} · ${bloques}`);
            };
            const accionGrupo=(grupo)=>{
                const ev=grupo.primero;
                const n=grupo.eventos.length;
                if(n<=1) return ev.accion||'';
                if(ev.accion==='bloque_creado') return `bloques_creados (${n})`;
                if(ev.accion==='bloque_eliminado') return `bloques_eliminados (${n})`;
                if(ev.accion==='bloque_movido') return `bloques_movidos (${n})`;
                return `${ev.accion} (${n})`;
            };
            const exportarHistorialFiltrado=()=>{
                const filas=[['Fecha','Usuario','Temporada','Versión','Acción','Motivo','Detalle']];
                gruposTodos.forEach(grupo=>{
                    const ev=grupo.primero;
                    filas.push([
                        ev.ts?new Date(ev.ts).toLocaleString():'',
                        usuarioLabel(ev),
                        temporadaEvento(ev),
                        ev.revisionId||'',
                        accionGrupo(grupo),
                        [...new Set(grupo.eventos.map(e=>e.motivo).filter(Boolean))].join(' · '),
                        detalleGrupo(grupo)
                    ]);
                });
                const csv=filas.map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
                const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});
                const a=document.createElement('a');
                a.href=URL.createObjectURL(blob);
                a.download=`Historial_${ctx.getTemporadaLabel?.()||'Planificador'}_${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
                URL.revokeObjectURL(a.href);
                ctx.toast?.('Historial exportado','success');
            };
            const alertaHistorial=eventosBase.length>=900?`
                <div class="dashboard-validation-item ${eventosBase.length>=1000?'danger':'warning'}" style="margin-bottom:10px;">
                    <span>${eventosBase.length>=1000?'Límite alcanzado':'Cerca del límite'}</span>
                    <strong>Historial de acciones</strong>
                    <em>${eventosBase.length>=1000?'Se conservarán solo las acciones más recientes. Exporta el historial para respaldo institucional.':`Hay ${eventosBase.length}/1000 acciones registradas. Conviene exportar antes de que se complete.`}</em>
                </div>
            `:'';
            const controles=`
                <div class="history-toolbar">
                    <div class="form-group"><label class="form-label">Acción</label><select class="form-select" id="historialFiltroAccion"><option value="">Todas</option>${acciones.map(a=>ctx.optionHTML(a,a,a===accionActual)).join('')}</select></div>
                    <div class="form-group"><label class="form-label">Usuario</label><select class="form-select" id="historialFiltroUsuario"><option value="">Todos</option>${usuarios.map(u=>ctx.optionHTML(u,usuarioLabel(u),u===usuarioActual)).join('')}</select></div>
                    <div class="form-group history-search"><label class="form-label">Buscar</label><input class="form-input" id="historialBusqueda" value="${ctx.escapeAttr(busqueda)}" placeholder="Sección, asignatura, docente..."></div>
                    <div class="form-group"><label class="form-label">Ver</label><select class="form-select" id="historialTamanoPagina">
                        <option value="20" ${historialTamano===20?'selected':''}>20</option>
                        <option value="50" ${historialTamano===50?'selected':''}>50</option>
                        <option value="100" ${historialTamano===100?'selected':''}>100</option>
                    </select></div>
                    <div class="form-group history-actions">
                        <button class="btn btn-sm" id="btnHistorialAnterior" ${historialPagina<=1?'disabled':''}>Anterior</button>
                        <button class="btn btn-sm" id="btnHistorialSiguiente" ${historialPagina>=totalPaginas?'disabled':''}>Siguiente</button>
                        <button class="btn btn-sm" id="btnExportarHistorial">Exportar historial</button>
                    </div>
                </div>`;
            if(!eventos.length){
                cont.innerHTML=alertaHistorial+controles+'<p style="color:var(--text-secondary);font-size:0.85rem;">No hay acciones que coincidan con los filtros.</p>';
                enlazarHistorial();
                return;
            }
            cont.innerHTML=`
                ${alertaHistorial}
                ${controles}
                <div class="report-summary">${inicio+1}-${inicio+grupos.length} de ${gruposTodos.length} grupo(s) · ${eventos.length} evento(s) filtrado(s) de ${eventosBase.length} · página ${historialPagina}/${totalPaginas}</div>
                <table class="report-table historial-table">
                    <thead><tr><th>Fecha</th><th>Usuario</th><th>Temporada / versión</th><th>Acción</th><th>Detalle</th></tr></thead>
                    <tbody>${grupos.map(grupo=>{
                        const ev=grupo.primero;
                        const detalle=detalleGrupo(grupo);
                        return `<tr>
                            <td>${ctx.escapeHTML(ev.ts?new Date(ev.ts).toLocaleString():'')}</td>
                            <td>${ctx.escapeHTML(usuarioLabel(ev))}</td>
                            <td title="${ctx.escapeAttr(ev.revisionId||'Sin versión histórica')}">${ctx.escapeHTML(`${temporadaEvento(ev)} · ${ev.revisionId?String(ev.revisionId).slice(0,12):'Anterior'}`)}</td>
                            <td>${ctx.escapeHTML(accionGrupo(grupo))}</td>
                            <td>${ctx.escapeHTML(detalle)}</td>
                        </tr>`;
                    }).join('')}</tbody>
                </table>`;
            enlazarHistorial();

            function enlazarHistorial(){
                ['historialFiltroAccion','historialFiltroUsuario','historialBusqueda'].forEach(id=>{
                    const el=document.getElementById(id);
                if(!el) return;
                el.onchange=()=>{ historialPagina=1; renderHistorial(); };
                    if(id==='historialBusqueda') el.onkeydown=(e)=>{ if(e.key==='Enter'){ historialPagina=1; renderHistorial(); } };
                });
                document.getElementById('historialTamanoPagina')?.addEventListener('change',(e)=>{
                    historialTamano=Number(e.target.value)||20;
                    historialPagina=1;
                    renderHistorial();
                });
                document.getElementById('btnHistorialAnterior')?.addEventListener('click',()=>{
                    historialPagina=Math.max(1,historialPagina-1);
                    renderHistorial();
                });
                document.getElementById('btnHistorialSiguiente')?.addEventListener('click',()=>{
                    historialPagina+=1;
                    renderHistorial();
                });
                document.getElementById('btnExportarHistorial')?.addEventListener('click',exportarHistorialFiltrado);
            }
        }

        function init(){
            document.getElementById('reporteTipo')?.addEventListener('change',()=>{
                reportePagina=1;
                actualizarReporte();
            });
            document.getElementById('btnExportarReporte')?.addEventListener('click',exportarReporte);
            document.getElementById('reporteTamanoPagina')?.addEventListener('change',(e)=>{
                reporteTamano=Number(e.target.value)||20;
                reportePagina=1;
                actualizarReporte();
            });
            document.getElementById('btnReporteAnterior')?.addEventListener('click',()=>{
                reportePagina=Math.max(1,reportePagina-1);
                actualizarReporte();
            });
            document.getElementById('btnReporteSiguiente')?.addEventListener('click',()=>{
                reportePagina+=1;
                actualizarReporte();
            });
            document.getElementById('reporteContenido')?.addEventListener('click',(e)=>{
                const repair=e.target.closest('.report-repair-btn');
                if(repair){
                    try{
                        const payload=JSON.parse(repair.dataset.repairPayload||'{}');
                        ejecutarReparacionIntegridad(payload);
                    }catch(err){
                        ctx.toast('No se pudo leer la reparación','error');
                    }
                    return;
                }
                const detail=e.target.closest('.report-detail-btn');
                if(detail?.dataset.detailReport==='cargaDefendible'){
                    abrirDetalleCargaDefendible(detail.dataset.docente);
                    return;
                }
                const btn=e.target.closest('.report-action-btn');
                if(btn && ctx.irASeccion){
                    ctx.irASeccion(btn.dataset.seccion,{
                        asignaturaId:btn.dataset.asignatura||null,
                        mensaje:'Sección abierta desde el reporte'
                    });
                    return;
                }
                const entity=e.target.closest('.report-entity-btn');
                if(entity) abrirEntidadDesdeReporte(entity.dataset.entityType,entity.dataset.entityId);
            });
            document.getElementById('dashboardContenido')?.addEventListener('click',(e)=>{
                const undo=e.target.closest('[data-undo-auto="ultimo"]');
                if(undo) return ctx.abrirReversionAutos?.();
                const ultimoAuto=e.target.closest('[data-auto-general="ultimo"]');
                if(ultimoAuto) return abrirUltimoAutoGeneral();
                const gestorPendientes=e.target.closest('[data-gestor-pendientes]');
                if(gestorPendientes){
                    ctx.activarTab?.('gestorSecciones');
                    setTimeout(()=>{
                        const estado=document.getElementById('gestorRelacionEstado');
                        const busqueda=document.getElementById('gestorRelacionBusqueda');
                        if(estado) estado.value='pendiente_externa';
                        if(busqueda) busqueda.value='';
                        estado?.dispatchEvent(new Event('change'));
                        document.getElementById('gestorPendientes')?.scrollIntoView({behavior:'smooth',block:'start'});
                    },0);
                    return;
                }
                const card=e.target.closest('[data-report]');
                if(card) return abrirDetalleDashboard(card.dataset.report);
                const carrera=e.target.closest('[data-carrera]');
                if(carrera) return abrirDetalleProgresoCarrera(carrera.dataset.carrera);
                const prepCarrera=e.target.closest('[data-preparacion-carrera]');
                if(prepCarrera) return abrirDetallePreparacionCarrera(prepCarrera.dataset.preparacionCarrera);
                const loss=e.target.closest('[data-score-loss]');
                if(loss){
                    const tipo=loss.dataset.scoreLoss;
                    if(tipo==='conflictos') return abrirDetalleDashboard('conflictos');
                    if(tipo==='cobertura') return abrirDetalleDashboard('incompletas');
                    return abrirDetalleCalidad(tipo);
                }
                const calidad=e.target.closest('[data-calidad]');
                if(calidad) return abrirDetalleCalidad(calidad.dataset.calidad);
                const row=e.target.closest('[data-seccion]');
                if(row && ctx.irASeccion) ctx.irASeccion(row.dataset.seccion,{mensaje:'Sección abierta desde el dashboard'});
            });
            document.getElementById('modalContainer')?.addEventListener('click',(e)=>{
                const revisar=e.target.closest('.report-action-btn');
                if(revisar && ctx.irASeccion){
                    ctx.cerrarModal();
                    ctx.irASeccion(revisar.dataset.seccion,{
                        asignaturaId:revisar.dataset.asignatura||null,
                        mensaje:'Sección abierta desde el dashboard'
                    });
                    return;
                }
                const entity=e.target.closest('.report-entity-btn');
                if(entity){
                    ctx.cerrarModal();
                    abrirEntidadDesdeReporte(entity.dataset.entityType,entity.dataset.entityId);
                    return;
                }
                const abrir=e.target.closest('[data-open-report]');
                if(abrir){
                    ctx.cerrarModal();
                    abrirReporteDesdeDashboard(abrir.dataset.openReport);
                }
            });
            document.getElementById('dashboardContenido')?.addEventListener('keydown',(e)=>{
                if(e.key!=='Enter' && e.key!==' ') return;
                const target=e.target.closest('[data-report],[data-seccion],[data-carrera],[data-preparacion-carrera],[data-score-loss],[data-calidad],[data-auto-general],[data-undo-auto],[data-gestor-pendientes]');
                if(!target) return;
                e.preventDefault();
                target.click();
            });
            document.getElementById('dashboardConflictos')?.addEventListener('click',(e)=>{
                const revisar=e.target.closest('.report-action-btn');
                if(revisar && ctx.irASeccion){
                    ctx.irASeccion(revisar.dataset.seccion,{
                        asignaturaId:revisar.dataset.asignatura||null,
                        mensaje:'Sección abierta desde conflictos'
                    });
                    return;
                }
                const reporte=e.target.closest('[data-report="conflictos"]');
                if(reporte) abrirReporteDesdeDashboard('conflictos');
            });
            const input=document.getElementById('reporteBusqueda');
            const clear=document.getElementById('clearReporteBusqueda');
            input?.addEventListener('input',()=>{
                clear?.classList.toggle('visible',input.value.length>0);
                reportePagina=1;
                actualizarReporte();
            });
            clear?.addEventListener('click',()=>{
                input.value='';
                clear.classList.remove('visible');
                reportePagina=1;
                actualizarReporte();
                input.focus();
            });
        }

        return { obtenerDatosReporte, actualizarReporte, renderDashboard, detectarConflictos, renderHistorial, calcularValidacionPrevia, init };
    }

    window.PlanificadorReportes = { create: createReportes };
})();
