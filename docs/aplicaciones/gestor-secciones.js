// Aplicación gestor-secciones. Estado y servicios compartidos inyectados, sin copias de datos.
(function(){
    window.PlanhorAplicaciones=window.PlanhorAplicaciones||{};
    window.PlanhorAplicaciones["gestor-secciones"]={create(shared){
let contextoRenderGestor=null;
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
        const txt=shared.textoGestor(programa);
        const m=txt.match(/^\s*([A-Za-z0-9]+)\s*-/);
        return (m?.[1]||txt.split(/\s+/)[0]||'').toUpperCase();
    }

function nombreCarreraGestor(programa){
        const txt=shared.textoGestor(programa);
        const partes=txt.split(/\s+-\s+/);
        return (partes.length>1?partes.slice(1).join(' - '):txt).trim();
    }

function planCarreraGestor(programaPlan,codigoBase=''){
        const txt=shared.textoGestor(programaPlan).toUpperCase();
        return txt || shared.textoGestor(codigoBase).toUpperCase();
    }

function nombreCarreraConPlanGestor(nombre,plan){
        const base=shared.textoGestor(nombre)||shared.textoGestor(plan)||'Sin carrera';
        const p=shared.textoGestor(plan);
        return p && !shared.normalizarEncabezadoGestor(base).includes(shared.normalizarEncabezadoGestor(p)) ? `${base} (${p})` : base;
    }

function nivelGestor(valor){
        const txt=shared.textoGestor(valor);
        const m=txt.match(/\d+/);
        return m?`N${m[0]}`:(txt||'Sin nivel');
    }

function jornadaGestor(valor,nombre=''){
        const key=shared.normalizarEncabezadoGestor(valor||nombre);
        const nom=String(nombre||'').trim().toUpperCase();
        if(key.includes('vesp')||key.includes('noche')||key.includes('noct')||nom.startsWith('V-')) return 'vespertina';
        return 'diurna';
    }

function modalidadAsignaturaGestor(valor){
        const key=shared.normalizarEncabezadoGestor(valor);
        if(key.includes('online')) return 'online-teams';
        if(key.includes('semi')) return 'semipresencial';
        if(key.includes('pract')) return 'practica';
        return 'lectiva';
    }

function areaAsignaturaGestor(valor){
        const row=valor&&typeof valor==='object'?valor:null;
        const key=shared.normalizarEncabezadoGestor(row?row.area:valor);
        const seccion=shared.normalizarEncabezadoGestor(row?.seccion||'');
        const programaCarrera=shared.normalizarEncabezadoGestor(row?.programaCarrera||'');
        const programaPlan=shared.normalizarEncabezadoGestor(row?.programaPlan||'');
        const esProgramaElec=/^elec(\b|-)/.test(programaCarrera)||/^elec(\b|-)/.test(programaPlan);
        if(seccion==='elec'||seccion.startsWith('elec ')||seccion.startsWith('elec-')||esProgramaElec) return 'electiva';
        if(key.includes('transversal')) return 'transversal';
        return 'especialidad';
    }

function especialidadGestor(valor){
        const txt=shared.textoGestor(valor);
        if(!txt) return '';
        return txt.toLowerCase().replace(/\s+/g,' ').trim().split(' ').map((p,i)=>['de','del','la','las','los','y','e'].includes(p)&&i>0?p:p.charAt(0).toUpperCase()+p.slice(1)).join(' ');
    }

function sincronizarEspecialidadesDesdeGestor(filas){
        const actuales=new Map((shared.data.configuracion.especialidades||[]).map(e=>[shared.normalizarEncabezadoGestor(e),e]));
        (filas||[]).forEach(r=>{
            const esp=shared.especialidadGestor(r.area);
            if(!esp) return;
            const key=shared.normalizarEncabezadoGestor(esp);
            if(!key || ['transversal','electiva','especialidad'].includes(key)) return;
            if(!actuales.has(key)){
                shared.data.configuracion.especialidades.push(esp);
                actuales.set(key,esp);
            }
        });
    }

function tipoEspacioDesdeTexto(valor){
        const key=shared.normalizarEncabezadoGestor(valor);
        if(key.includes('comput')) return 'Laboratorio de Computación';
        if(key.includes('taller')) return 'Taller de Especialidad';
        if(key.includes('lab')||key.includes('laboratorio')) return 'Laboratorio de Especialidad';
        return 'Sala de Clases';
    }

function parsearSalaReferenciaGestor(valor){
        const txt=shared.textoGestor(valor);
        if(!txt) return null;
        const partes=txt.split(/\s*-\s*/).filter(Boolean);
        const nombre=(partes[0]||txt).trim().toUpperCase();
        const tipo=partes.length>1?shared.tipoEspacioDesdeTexto(partes.slice(1).join(' - ')):shared.tipoEspacioDesdeTexto(txt);
        return {nombre,tipo,referencia:txt};
    }

function familiaProgramaGestor(programaCarrera,programaPlan=''){
        const txt=shared.normalizarEncabezadoGestor([programaCarrera,programaPlan].filter(Boolean).join(' '));
        if(txt.includes('electric')) return 'electricidad';
        if(txt.includes('automat')||txt.includes('robot')) return 'automatizacion';
        if(txt.includes('electron')) return 'electronica';
        if(txt.includes('administr')||txt.includes('finanz')) return 'administracion';
        const codigo=shared.codigoCarreraGestor(programaCarrera)||String(programaPlan||'').split('-')[0]||'';
        return codigo.toUpperCase()||'sin-familia';
    }

function recalcularAreasAsignaturasDesdeGestor(){
        const gestor=shared.normalizarGestorSeccionesData(shared.data.gestorSecciones);
        const filas=Array.isArray(gestor.filas)?gestor.filas:[];
        if(!filas.length||!Array.isArray(shared.data.asignaturas)||!shared.data.asignaturas.length) return;
        const stats=new Map();
        filas.forEach(r=>{
            const codigo=shared.textoGestor(r.codigoAsignatura).toUpperCase();
            if(!codigo) return;
            if(!stats.has(codigo)) stats.set(codigo,{familias:new Set(),electiva:false,transversalExplicita:false});
            const item=stats.get(codigo);
            item.familias.add(shared.familiaProgramaGestor(r.programaCarrera,r.programaPlan));
            const area=shared.areaAsignaturaGestor(r);
            if(area==='electiva') item.electiva=true;
            if(shared.normalizarEncabezadoGestor(r.area).includes('transversal')) item.transversalExplicita=true;
        });
        shared.data.asignaturas.forEach(a=>{
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
        const key=shared.normalizarEncabezadoGestor(valor);
        return key==='fusion'||key==='fusionada'||key==='fusionado';
    }

function esSeccionRealGestor(valor){
        return !!shared.textoGestor(valor) && !shared.esSeccionFusionLiteral(valor);
    }

function seccionBaseSinMarcaGestor(valor){
        return shared.textoGestor(valor).replace(/\s*\((E-F|F-E|E|F)\)\s*$/i,'').trim();
    }

function marcaSeccionGestor(valor){
        const m=shared.textoGestor(valor).match(/\((E-F|F-E|E|F)\)\s*$/i);
        if(!m) return '';
        return m[1].toUpperCase()==='F-E'?'E-F':m[1].toUpperCase();
    }

function tieneMarcaFusionGestor(valor){
        return /\((E-F|F-E|E|F)\)\s*$/i.test(shared.textoGestor(valor));
    }

function tipoFilaGestor(row){
        const tipo=shared.normalizarEncabezadoGestor(row.tipo);
        if(tipo.includes('fusion') || shared.esSeccionFusionLiteral(row.seccion)) return 'fusionada';
        if(tipo.includes('planificada')) return 'planificada';
        return 'por-revisar';
    }

function normalizarGestorSeccionesData(valor){
        if(contextoRenderGestor?.salida&&contextoRenderGestor.salida===valor)return valor;
        const base={cargas:[],ids:[],filas:[],enlacesManuales:[],ultimaCargaId:null,tablaLimite:20,tablaPagina:1,tablaTamano:20,filtroAplicacion:null};
        if(!valor||typeof valor!=='object'||Array.isArray(valor)){if(contextoRenderGestor)contextoRenderGestor.salida=base;return base;}
        const cargas=Array.isArray(valor.cargas)?valor.cargas.slice(-20).map(c=>({
            id:shared.limpiarTexto(c.id)||shared.genId(),
            archivo:shared.limpiarTexto(c.archivo),
            fecha:shared.limpiarTexto(c.fecha,80),
            resumen:c.resumen&&typeof c.resumen==='object'&&!Array.isArray(c.resumen)?c.resumen:{}
        })):[];
        const filas=Array.isArray(valor.filas)?valor.filas.slice(-15000).map(f=>({
            cargaId:shared.limpiarTexto(f.cargaId),
            idSeccion:shared.limpiarTexto(f.idSeccion,120),
            programaCarrera:shared.limpiarTexto(f.programaCarrera),
            programaPlan:shared.limpiarTexto(f.programaPlan,120),
            jornada:shared.limpiarTexto(f.jornada,80),
            nivel:shared.limpiarTexto(f.nivel,80),
            codigoAsignatura:shared.limpiarTexto(f.codigoAsignatura,80),
            asignatura:shared.limpiarTexto(f.asignatura),
            seccion:shared.limpiarTexto(f.seccion,120),
            tipo:shared.limpiarTexto(f.tipo,120),
            salaReferencia:shared.limpiarTexto(f.salaReferencia,120),
            horas:Number(f.horas)||0,
            horasPresenciales:Number(f.horasPresenciales)||0,
            horasVirtuales:Number(f.horasVirtuales)||0,
            alumnos:Number(f.alumnos)||0,
            alumnosOtrosPlanes:Number(f.alumnosOtrosPlanes)||0,
            alumnosTotales:Number(f.alumnosTotales)||0,
            modalidadAsignatura:shared.limpiarTexto(f.modalidadAsignatura,120),
            modalidadSeccion:shared.limpiarTexto(f.modalidadSeccion,120),
            tipoAsignatura:shared.limpiarTexto(f.tipoAsignatura,120),
            area:shared.limpiarTexto(f.area,120)
        })).filter(f=>f.idSeccion||f.codigoAsignatura||f.seccion):[];
        const ids=Array.isArray(valor.ids)?valor.ids.slice(-10000).map(x=>({
            idSeccion:shared.limpiarTexto(x.idSeccion,120),
            cargaId:shared.limpiarTexto(x.cargaId),
            archivo:shared.limpiarTexto(x.archivo),
            carrera:shared.limpiarTexto(x.carrera),
            plan:shared.limpiarTexto(x.plan,80),
            jornada:shared.limpiarTexto(x.jornada,80),
            nivel:shared.limpiarTexto(x.nivel,80),
            asignaturaCodigo:shared.limpiarTexto(x.asignaturaCodigo,80),
            asignaturaNombre:shared.limpiarTexto(x.asignaturaNombre),
            seccionesReales:Array.isArray(x.seccionesReales)?x.seccionesReales.map(s=>shared.limpiarTexto(s,120)).filter(Boolean):[],
            filasFusionadas:Number(x.filasFusionadas)||0,
            filas:Number(x.filas)||0,
            estado:['resuelta','pendiente_externa','sin_id','requiere_revision'].includes(x.estado)?x.estado:'requiere_revision',
            madreDetectada:shared.limpiarTexto(x.madreDetectada,120),
            motivo:shared.limpiarTexto(x.motivo)
        })).filter(x=>x.idSeccion||x.asignaturaCodigo||x.asignaturaNombre):[];
        const enlacesManuales=Array.isArray(valor.enlacesManuales)?valor.enlacesManuales.slice(-3000).map(x=>({
            idSeccion:shared.limpiarTexto(x.idSeccion,120),
            cargaId:shared.limpiarTexto(x.cargaId),
            origenCargaId:shared.limpiarTexto(x.origenCargaId),
            tipo:['interna','externa'].includes(x.tipo)?x.tipo:'externa',
            seccionId:shared.limpiarTexto(x.seccionId,120),
            seccionNombre:shared.limpiarTexto(x.seccionNombre,160),
            nota:shared.limpiarTexto(x.nota,500),
            ts:shared.limpiarTexto(x.ts,80)
        })).filter(x=>x.idSeccion):[];
        const filtroAplicacion=valor.filtroAplicacion&&typeof valor.filtroAplicacion==='object'&&!Array.isArray(valor.filtroAplicacion)?{
            cargaId:shared.limpiarTexto(valor.filtroAplicacion.cargaId),
            carreras:Array.isArray(valor.filtroAplicacion.carreras)?valor.filtroAplicacion.carreras.map(x=>shared.limpiarTexto(x,140)).filter(Boolean).slice(0,500):[],
            ts:shared.limpiarTexto(valor.filtroAplicacion.ts,80)
        }:null;
        const tablaTamanoPermitido=[20,50,100];
        const tablaTamano=tablaTamanoPermitido.includes(Number(valor.tablaTamano))?Number(valor.tablaTamano):(tablaTamanoPermitido.includes(Number(valor.tablaLimite))?Number(valor.tablaLimite):20);
        const tablaPagina=Math.max(1,Number(valor.tablaPagina)||1);
        const normalizado={cargas,ids,filas,enlacesManuales,ultimaCargaId:shared.limpiarTexto(valor.ultimaCargaId)||cargas[0]?.id||null,tablaLimite:tablaTamano,tablaPagina,tablaTamano,filtroAplicacion};
        if(contextoRenderGestor)contextoRenderGestor.salida=normalizado;
        return normalizado;
    }

function detectarColumnasGestor(headers){
        const vistos={};
        const cols={};
        headers.forEach((h,idx)=>{
            const key=shared.normalizarEncabezadoGestor(h);
            if(!key) return;
            vistos[key]=(vistos[key]||0)+1;
            const occ=vistos[key];
            const set=(nombre)=>{ if(cols[nombre]===undefined) cols[nombre]=idx; };
            if(key==='programa'&&occ===1) set('programaCarrera');
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
        const get=(k)=>cols[k]===undefined?'':shared.textoGestor(row[cols[k]]);
        const num=(k)=>cols[k]===undefined?0:shared.numeroGestor(row[cols[k]]);
        return {
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
        const codigoCarrera=shared.codigoCarreraGestor(r.programaCarrera);
        const nombreCarrera=shared.nombreCarreraGestor(r.programaCarrera)||codigoCarrera||'Sin carrera';
        const plan=shared.planCarreraGestor(r.programaPlan,codigoCarrera);
        const carreraKey=plan||codigoCarrera||nombreCarrera;
        const codigoCarreraPlan=plan||codigoCarrera;
        const nombreCarreraPlan=shared.nombreCarreraConPlanGestor(nombreCarrera,plan);
        const area=shared.especialidadGestor(r.area)||'Sin area';
        return {area,carreraKey,codigo:codigoCarreraPlan,nombre:nombreCarreraPlan,plan,codigoBase:codigoCarrera};
    }

function opcionesFiltroGestor(registros){
        const areas=new Map();
        (registros||[]).forEach(r=>{
            const d=shared.descriptorCarreraRegistroGestor(r);
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
        return (registros||[]).filter(r=>carreras.has(String(shared.descriptorCarreraRegistroGestor(r).carreraKey||'').toUpperCase()));
    }

function prepararRegistrosAplicacionGestor(registros,filtro){
        const carreras=new Set((filtro?.carreras||[]).map(x=>String(x||'').toUpperCase()));
        const seleccionados=(registros||[]).filter(r=>carreras.has(String(shared.descriptorCarreraRegistroGestor(r).carreraKey||'').toUpperCase()));
        const idsSeleccionados=new Set(seleccionados.map(r=>shared.textoGestor(r.idSeccion)).filter(Boolean));
        const memoria=(registros||[]).filter(r=>{
            const carreraKey=String(shared.descriptorCarreraRegistroGestor(r).carreraKey||'').toUpperCase();
            const id=shared.textoGestor(r.idSeccion);
            return carreras.has(carreraKey)||(id&&idsSeleccionados.has(id));
        });
        return {seleccionados,memoria,externos:memoria.length-seleccionados.length};
    }

function filtroCompletoGestor(registros){
        return {carreras:shared.opcionesFiltroGestor(registros).flatMap(a=>a.carreras.map(c=>c.carreraKey))};
    }

function analizarGestorSecciones(aoa){
        const filas=(aoa||[]).filter(r=>Array.isArray(r)&&r.some(c=>shared.textoGestor(c)));
        if(!filas.length) throw new Error('Archivo vacío');
        let headerIndex=0, bestScore=-1, bestCols={};
        const clavesFuertes=['programaCarrera','programaPlan','jornada','nivel','codigoAsignatura','asignatura','idSeccion','seccion','horas','horasPresenciales','horasVirtuales','tipo','modalidadAsignatura'];
        const clavesMinimas=['programaCarrera','codigoAsignatura','asignatura','idSeccion','seccion'];
        filas.slice(0,120).forEach((row,idx)=>{
            const colsFila=shared.detectarColumnasGestor(row.map(shared.textoGestor));
            const fuertes=clavesFuertes.filter(k=>colsFila[k]!==undefined).length;
            const minimas=clavesMinimas.filter(k=>colsFila[k]!==undefined).length;
            const celdasTexto=row.map(shared.normalizarEncabezadoGestor);
            const aliasBonus=['cod asignatura','codigo asignatura','codigo de la asignatura','id seccion','horas presenciales','horas virtuales','modalidad asignatura'].filter(k=>celdasTexto.includes(k)).length;
            const score=fuertes*10+minimas*4+aliasBonus;
            if(score>bestScore){
                bestScore=score;
                headerIndex=idx;
                bestCols=colsFila;
            }
        });
        const headers=filas[headerIndex].map(shared.textoGestor);
        const cols=Object.keys(bestCols).length?bestCols:shared.detectarColumnasGestor(headers);
        const requeridas=['programaCarrera','jornada','nivel','codigoAsignatura','asignatura','idSeccion','seccion','horas','horasPresenciales','horasVirtuales','tipo','modalidadAsignatura'];
        const faltantes=requeridas.filter(k=>cols[k]===undefined);
        const registros=filas.slice(headerIndex+1).map(r=>shared.leerFilaGestor(r,cols)).filter(r=>r.codigoAsignatura||r.asignatura||r.seccion);
        const unicos=(campo)=>new Set(registros.map(r=>r[campo]).filter(Boolean)).size;
        const tipoNorm=(r)=>shared.normalizarEncabezadoGestor(r.tipo);
        const modalidadNorm=(r)=>shared.normalizarEncabezadoGestor(r.modalidadAsignatura);
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
        const propuesta=shared.normalizarPropuestaGestor(registros);
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
        const carreraExistentePorCodigo=new Map(shared.data.carreras.map(c=>[String(c.codigo||'').toUpperCase(),c.id]));
        const existentes={
            carreras:new Set(shared.data.carreras.map(c=>String(c.codigo||'').toUpperCase())),
            niveles:new Set(shared.data.niveles.map(n=>`${n.carreraId}|${shared.normalizarEncabezadoGestor(n.nombre)}`)),
            secciones:new Set(shared.data.secciones.map(s=>shared.normalizarEncabezadoGestor(s.nombre))),
            asignaturas:new Set(shared.data.asignaturas.map(a=>String(a.codigo||'').toUpperCase()))
        };
        registros.forEach(r=>{
            const codigoCarrera=shared.codigoCarreraGestor(r.programaCarrera);
            const nombreCarrera=shared.nombreCarreraGestor(r.programaCarrera)||codigoCarrera||'Sin carrera';
            const plan=shared.planCarreraGestor(r.programaPlan,codigoCarrera);
            const carreraKey=plan||codigoCarrera||nombreCarrera;
            const codigoCarreraPlan=plan||codigoCarrera;
            const nombreCarreraPlan=shared.nombreCarreraConPlanGestor(nombreCarrera,plan);
            const areaCarreraPlan=shared.especialidadGestor(r.area);
            if(carreraKey&&!carreras.has(carreraKey)){
                carreras.set(carreraKey,{codigo:codigoCarreraPlan,nombre:nombreCarreraPlan,plan,codigoBase:codigoCarrera,area:areaCarreraPlan,existe:existentes.carreras.has(codigoCarreraPlan)});
            }
            const nivelNombre=shared.nivelGestor(r.nivel);
            const nivelKey=`${carreraKey}|${nivelNombre}`;
            const carreraExistenteId=carreraExistentePorCodigo.get(codigoCarreraPlan)||'';
            const nivelExiste=!!(carreraExistenteId&&existentes.niveles.has(`${carreraExistenteId}|${shared.normalizarEncabezadoGestor(nivelNombre)}`));
            if(carreraKey&&!niveles.has(nivelKey)){
                niveles.set(nivelKey,{carreraKey,nombre:nivelNombre,tieneOnline:false,existe:nivelExiste});
            }
            const nivel=niveles.get(nivelKey);
            if(nivel && shared.modalidadAsignaturaGestor(r.modalidadAsignatura)==='online-teams') nivel.tieneOnline=true;
            const seccionOriginal=shared.textoGestor(r.seccion);
            const seccionNombre=shared.esSeccionRealGestor(seccionOriginal)?shared.seccionBaseSinMarcaGestor(seccionOriginal):seccionOriginal;
            const marcaSeccion=shared.marcaSeccionGestor(seccionOriginal);
            if(seccionNombre&&!secciones.has(seccionNombre)){
                if(shared.esSeccionRealGestor(seccionNombre)){
                    secciones.set(seccionNombre,{
                    nombre:seccionNombre,
                    idGestor:r.idSeccion,
                    carreraKey,
                    nivelKey,
                    jornada:r.jornada,
                    alumnos:Number(r.alumnos)||0,
                    alumnosOtrosPlanes:Number(r.alumnosOtrosPlanes)||0,
                    alumnosTotalesGestor:Number(r.alumnosTotales)||0,
                    tipoDetectado:shared.tipoFilaGestor(r),
                    existe:existentes.secciones.has(shared.normalizarEncabezadoGestor(seccionNombre))
                });
                }
            }
            const codigoAsig=shared.textoGestor(r.codigoAsignatura).toUpperCase();
            if(codigoAsig){
                if(!familiasPorAsignatura.has(codigoAsig)) familiasPorAsignatura.set(codigoAsig,new Set());
                familiasPorAsignatura.get(codigoAsig).add(shared.familiaProgramaGestor(r.programaCarrera,r.programaPlan));
            }
            if(codigoAsig&&!asignaturas.has(codigoAsig)){
                const salaInfo=shared.parsearSalaReferenciaGestor(r.salaReferencia);
                asignaturas.set(codigoAsig,{
                    codigo:codigoAsig,
                    nombre:shared.textoGestor(r.asignatura)||codigoAsig,
                    horasTotales:Number(r.horas)||((Number(r.horasPresenciales)||0)+(Number(r.horasVirtuales)||0)),
                    horasPresenciales:Number(r.horasPresenciales)||0,
                    horasVirtuales:Number(r.horasVirtuales)||0,
                    bloquesPresenciales:Math.round((Number(r.horasPresenciales)||0)/18),
                    bloquesVirtuales:Math.round((Number(r.horasVirtuales)||0)/18),
                    modalidad:shared.modalidadAsignaturaGestor(r.modalidadAsignatura||r.tipoAsignatura),
                    area:shared.areaAsignaturaGestor(r),
                    salaReferencia:r.salaReferencia,
                    salaPreferidaNombre:salaInfo?.nombre||'',
                    tipoEspacioSugerido:salaInfo?.tipo||'',
                    especialidadGestor:shared.especialidadGestor(r.area),
                    existe:existentes.asignaturas.has(codigoAsig)
                });
            }
            if(codigoAsig&&nivelKey) relaciones.set(`${codigoAsig}|${carreraKey}|${nivelKey}`,{codigoAsignatura:codigoAsig,carreraKey,nivelKey});
            if(codigoAsig&&seccionNombre&&shared.esSeccionRealGestor(seccionNombre)){
                seccionAsignaturas.set(`${codigoAsig}|${seccionNombre}`,{
                    codigoAsignatura:codigoAsig,
                    seccion:seccionNombre,
                    tipo:shared.tipoFilaGestor(r),
                    idGestor:r.idSeccion,
                    marcaGestor:marcaSeccion
                });
            }else if(codigoAsig&&seccionOriginal&&shared.esSeccionFusionLiteral(seccionOriginal)){
                fusionLiteralRows.push({
                    codigoAsignatura:codigoAsig,
                    carreraKey,
                    nivelKey,
                    jornada:r.jornada,
                    idGestor:r.idSeccion,
                    tipo:shared.tipoFilaGestor(r),
                    alumnos:Number(r.alumnos)||0,
                    alumnosOtrosPlanes:Number(r.alumnosOtrosPlanes)||0,
                    alumnosTotalesGestor:Number(r.alumnosTotales)||0
                });
            }
            const idGrupo=r.idSeccion||`${codigoAsig}|${nivelKey}`;
            if(codigoAsig&&idGrupo){
                if(!gruposCandidatos.has(idGrupo)) gruposCandidatos.set(idGrupo,{idGestorSeccion:idGrupo,codigoAsignatura:codigoAsig,planificada:null,fusionadas:[],alumnosTotalesGestor:0,tipos:new Set()});
                const g=gruposCandidatos.get(idGrupo);
                g.alumnosTotalesGestor=Math.max(g.alumnosTotalesGestor,Number(r.alumnosTotales)||0);
                g.tipos.add(shared.tipoFilaGestor(r));
                const item={
                    seccion:seccionNombre,
                    carreraKey,
                    nivelKey,
                    tipo:shared.tipoFilaGestor(r),
                    alumnos:Number(r.alumnos)||0,
                    alumnosOtrosPlanes:Number(r.alumnosOtrosPlanes)||0,
                    alumnosTotalesGestor:Number(r.alumnosTotales)||0,
                    marcaGestor:marcaSeccion
                };
                if(item.tipo==='planificada'&&shared.esSeccionRealGestor(item.seccion)&&!g.planificada) g.planificada=item;
                else if(item.tipo==='fusionada'&&shared.esSeccionRealGestor(item.seccion)) g.fusionadas.push(item);
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
            const ax=shared.seccionBaseSinMarcaGestor(a.nombre||a.seccion||'');
            const bx=shared.seccionBaseSinMarcaGestor(b.nombre||b.seccion||'');
            const an=Number((ax.match(/C(\d+)/i)||[])[1]);
            const bn=Number((bx.match(/C(\d+)/i)||[])[1]);
            if(Number.isFinite(an)&&Number.isFinite(bn)&&an!==bn) return an-bn;
            return ax.localeCompare(bx,undefined,{numeric:true,sensitivity:'base'});
        };
        const contextoFusion=(item)=>[
            String(item.carreraKey||'').toUpperCase(),
            shared.normalizarEncabezadoGestor(item.nivelKey),
            shared.normalizarEncabezadoGestor(item.jornada)
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
            asignadasPorCodigo.get(codigo).add(shared.normalizarEncabezadoGestor(rel.seccion));
        });
        fusionLiteralRows.forEach(row=>{
            const codigo=String(row.codigoAsignatura||'').toUpperCase();
            const ocupadas=asignadasPorCodigo.get(codigo)||new Set();
            const candidatos=candidatosPorContexto.get(contextoFusion(row))||[];
            const grupo=row.idGestor?gruposCandidatos.get(row.idGestor):null;
            const madre=grupo?.planificada?.seccion||'';
            if(!madre){
                const destino=candidatos.find(s=>!ocupadas.has(shared.normalizarEncabezadoGestor(s.nombre)))||candidatos[0]||null;
                if(!destino) return;
                seccionAsignaturas.set(`${codigo}|${destino.nombre}`,{
                    codigoAsignatura:codigo,
                    seccion:destino.nombre,
                    tipo:'externa',
                    idGestor:row.idGestor,
                    origen:'gestor-heredada-externa'
                });
                ocupadas.add(shared.normalizarEncabezadoGestor(destino.nombre));
                asignadasPorCodigo.set(codigo,ocupadas);
                return;
            }
            const destino=candidatos.find(s=>
                shared.normalizarEncabezadoGestor(s.nombre)!==shared.normalizarEncabezadoGestor(madre) &&
                !ocupadas.has(shared.normalizarEncabezadoGestor(s.nombre))
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
                alumnos:Number(row.alumnos)||0,
                alumnosOtrosPlanes:Number(row.alumnosOtrosPlanes)||0,
                alumnosTotalesGestor:Number(row.alumnosTotalesGestor)||0,
                inferida:true
            });
            ocupadas.add(shared.normalizarEncabezadoGestor(destino.nombre));
            asignadasPorCodigo.set(codigo,ocupadas);
        });
        const idsConMadreDetectada=new Set();
        gruposCandidatos.forEach((g,id)=>{ if(g.planificada) idsConMadreDetectada.add(id); });
        const grupos=Array.from(gruposCandidatos.values()).map(g=>{
            if(permitirMadreInferida&&!g.planificada&&g.fusionadas.length) g.planificada=g.fusionadas[0];
            return Object.assign(g,{tipos:Array.from(g.tipos),fusionadas:[...new Map(g.fusionadas.map(f=>[f.seccion,f])).values()]});
        }).filter(g=>g.planificada);
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
        const carreraPorCodigo=new Map(shared.data.carreras.map(c=>[String(c.codigo||'').toUpperCase(),c]));
        const asignaturaPorCodigo=new Map(shared.data.asignaturas.map(a=>[String(a.codigo||'').toUpperCase(),a]));
        const seccionPorNombre=new Map(shared.data.secciones.map(s=>[shared.normalizarEncabezadoGestor(s.nombre),s]));
        const nivelPorId=new Map(shared.data.niveles.map(n=>[n.id,n]));
        const carreraPorId=new Map(shared.data.carreras.map(c=>[c.id,c]));
        const conteo={
            crearCarreras:0, revisarCarreras:0,
            crearNiveles:0, revisarNiveles:0,
            crearSecciones:0, revisarSecciones:0,
            crearAsignaturas:0, revisarAsignaturas:0,
            crearRelaciones:0, crearRelacionesSeccion:0, crearGrupos:0,
            criticos:0, advertencias:0, info:0
        };
        const codigosPropuestos=new Set((propuesta.asignaturas||[]).map(a=>String(a.codigo||'').toUpperCase()));
        const seccionesPropuestas=new Set((propuesta.secciones||[]).map(s=>shared.normalizarEncabezadoGestor(s.nombre)));
        propuesta.carreras.forEach(c=>{
            const actual=carreraPorCodigo.get(String(c.codigo||'').toUpperCase());
            if(!actual) conteo.crearCarreras++;
            else if(shared.normalizarEncabezadoGestor(actual.nombre)!==shared.normalizarEncabezadoGestor(c.nombre)){
                conteo.revisarCarreras++;
                add('info','Carrera existente con nombre diferente',`${c.codigo}: app "${actual.nombre||''}" / gestor "${c.nombre||''}".`);
            }
        });
        propuesta.niveles.forEach(n=>{
            if(!n.existe) conteo.crearNiveles++;
        });
        propuesta.secciones.forEach(s=>{
            const actual=seccionPorNombre.get(shared.normalizarEncabezadoGestor(s.nombre));
            if(!actual){ conteo.crearSecciones++; return; }
            const nivelActual=nivelPorId.get(actual.nivelId);
            const carreraActual=carreraPorId.get(nivelActual?.carreraId);
            const carreraOk=String(carreraActual?.codigo||'').toUpperCase()===String(s.carreraKey||'').toUpperCase();
            const nivelOk=shared.normalizarEncabezadoGestor(nivelActual?.nombre)===shared.normalizarEncabezadoGestor((s.nivelKey||'').split('|')[1]);
            if(!carreraOk || !nivelOk){
                conteo.revisarSecciones++;
                add('advertencia','Sección existente en otra ubicación',`${s.nombre}: en la app está en ${carreraActual?.codigo||'sin carrera'} · ${nivelActual?.nombre||'sin nivel'}, pero el gestor la propone en ${s.carreraKey} · ${(s.nivelKey||'').split('|')[1]||''}.`);
            }
        });
        const propuestasPorNombre=new Set(propuesta.secciones.map(s=>shared.normalizarEncabezadoGestor(s.nombre)));
        propuesta.secciones.filter(s=>shared.tieneMarcaFusionGestor(s.nombre)).forEach(s=>{
            const base=shared.seccionBaseSinMarcaGestor(s.nombre);
            if(!base) return;
            const baseActual=seccionPorNombre.get(shared.normalizarEncabezadoGestor(base));
            if(baseActual && !propuestasPorNombre.has(shared.normalizarEncabezadoGestor(base))){
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
            if(shared.normalizarEncabezadoGestor(actual.nombre)!==shared.normalizarEncabezadoGestor(a.nombre)) diffs.push(`nombre app "${actual.nombre||''}" / gestor "${a.nombre||''}"`);
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
            const nivel=carrera?shared.data.niveles.find(n=>n.carreraId===carrera.id&&shared.normalizarEncabezadoGestor(n.nombre)===shared.normalizarEncabezadoGestor(nivelNombre)):null;
            const existe=asig&&carrera&&nivel&&shared.data.asignaturaCarreraNivel.some(r=>r.asignaturaId===asig.id&&r.carreraId===carrera.id&&r.nivelId===nivel.id);
            if(!existe) conteo.crearRelaciones++;
        });
        (propuesta.seccionAsignaturas||[]).forEach(rel=>{
            const codigo=String(rel.codigoAsignatura||'').toUpperCase();
            const seccionKey=shared.normalizarEncabezadoGestor(rel.seccion);
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
            const existe=asig&&sec&&(shared.data.asignaturaSeccion||[]).some(r=>r.asignaturaId===asig.id&&r.seccionId===sec.id);
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
        const cargaId=shared.genId();
        const grupos=new Map();
        const carrerasSeleccionadas=new Set((opciones.carrerasSeleccionadas||[]).map(x=>String(x||'').toUpperCase()));
        const usaFiltroCarreras=carrerasSeleccionadas.size>0;
        (analisis.registros||[]).forEach(r=>{
            const id=shared.textoGestor(r.idSeccion)||`SIN_ID|${shared.textoGestor(r.codigoAsignatura)}|${shared.textoGestor(r.seccion)}|${shared.textoGestor(r.nivel)}`;
            if(!grupos.has(id)){
                grupos.set(id,{
                    idSeccion:shared.textoGestor(r.idSeccion),
                    cargaId,
                    archivo:nombreArchivo,
                    carrera:r.programaCarrera,
                    plan:shared.planCarreraGestor(r.programaPlan,shared.codigoCarreraGestor(r.programaCarrera)),
                    jornada:r.jornada,
                    nivel:shared.nivelGestor(r.nivel),
                    asignaturaCodigo:shared.textoGestor(r.codigoAsignatura).toUpperCase(),
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
            const carreraKey=String(shared.descriptorCarreraRegistroGestor(r).carreraKey||'').toUpperCase();
            const seleccionada=!usaFiltroCarreras||carrerasSeleccionadas.has(carreraKey);
            g.filas++;
            if(shared.esSeccionFusionLiteral(r.seccion)||shared.tipoFilaGestor(r)==='fusionada') g.filasFusionadas++;
            if(shared.esSeccionRealGestor(r.seccion)&&!g.seccionesReales.includes(r.seccion)) g.seccionesReales.push(r.seccion);
            if(shared.esSeccionRealGestor(r.seccion)&&seleccionada&&!g.seccionesRealesSeleccionadas.includes(r.seccion)) g.seccionesRealesSeleccionadas.push(r.seccion);
            if(shared.esSeccionRealGestor(r.seccion)&&!seleccionada&&!g.seccionesRealesExternas.includes(r.seccion)) g.seccionesRealesExternas.push(r.seccion);
            if(shared.esSeccionRealGestor(r.seccion)&&shared.tipoFilaGestor(r)==='planificada'&&seleccionada&&!g.madresSeleccionadas.includes(r.seccion)) g.madresSeleccionadas.push(r.seccion);
            if(shared.esSeccionRealGestor(r.seccion)&&shared.tipoFilaGestor(r)==='planificada'&&!seleccionada&&!g.madresExternas.includes(r.seccion)) g.madresExternas.push(r.seccion);
            const planRelacionado=shared.planCarreraGestor(r.programaPlan,shared.codigoCarreraGestor(r.programaCarrera));
            const nivelRelacionado=shared.nivelGestor(r.nivel);
            const contextoRelacionado=[planRelacionado,nivelRelacionado?`(${nivelRelacionado})`:'' ].filter(Boolean).join('');
            if(contextoRelacionado&&!g.contextosRelacionados.includes(contextoRelacionado)) g.contextosRelacionados.push(contextoRelacionado);
        });
        const ids=Array.from(grupos.values()).map(g=>{
            const madres=new Set([...g.madresExternas,...g.madresSeleccionadas]);
            const contextosMadre=new Set((analisis.registros||[])
                .filter(r=>shared.textoGestor(r.idSeccion)===shared.textoGestor(g.idSeccion)&&madres.has(r.seccion))
                .map(r=>[shared.planCarreraGestor(r.programaPlan,shared.codigoCarreraGestor(r.programaCarrera)),shared.nivelGestor(r.nivel)?`(${shared.nivelGestor(r.nivel)})`:'' ].filter(Boolean).join(''))
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
        const memoria=shared.construirMemoriaIdsGestor(analisis,nombreArchivo,opciones);
        shared.data.gestorSecciones=shared.normalizarGestorSeccionesData(shared.data.gestorSecciones);
        shared.data.gestorSecciones.cargas.unshift(memoria.carga);
        const previas=(shared.data.gestorSecciones.ids||[]).filter(x=>x.cargaId!==memoria.carga.id);
        const filasPrevias=(shared.data.gestorSecciones.filas||[]).filter(x=>x.cargaId!==memoria.carga.id);
        shared.data.gestorSecciones.ids=[...memoria.ids,...previas].slice(0,10000);
        shared.data.gestorSecciones.filas=[...memoria.filas,...filasPrevias].slice(0,15000);
        shared.data.gestorSecciones.ultimaCargaId=memoria.carga.id;
        shared.data.gestorSecciones.filtroAplicacion=opciones.carrerasSeleccionadas?.length?{carreras:opciones.carrerasSeleccionadas.slice()}:shared.filtroCompletoGestor(analisis.registros||[]);
        shared.data.gestorSecciones.filtroAplicacion.cargaId=memoria.carga.id;
        shared.data.gestorSecciones.filtroAplicacion.ts=new Date().toISOString();
        shared.sincronizarEspecialidadesDesdeGestor(memoria.filas);
        return memoria;
    }

function renderTablaGestorSecciones(){
        const cont=document.getElementById('gestorTablaCompleta');
        const resumen=document.getElementById('gestorTablaResumen');
        const btnAnterior=document.getElementById('btnGestorPaginaAnterior');
        const btnSiguiente=document.getElementById('btnGestorPaginaSiguiente');
        const selTamano=document.getElementById('gestorTablaTamano');
        if(!cont) return;
        shared.data.gestorSecciones=shared.normalizarGestorSeccionesData(shared.data.gestorSecciones);
        if(selTamano) selTamano.value=String(shared.data.gestorSecciones.tablaTamano||20);
        const cargas=shared.data.gestorSecciones.cargas||[];
        const ultima=cargas.find(c=>c.id===shared.data.gestorSecciones.ultimaCargaId)||cargas[0]||null;
        const filas=ultima?(shared.data.gestorSecciones.filas||[]).filter(f=>f.cargaId===ultima.id):(shared.data.gestorSecciones.filas||[]);
        const q=(document.getElementById('gestorTablaBusqueda')?.value||'').trim().toLowerCase();
        const filtradas=q?filas.filter(f=>[
            f.idSeccion,f.programaCarrera,f.programaPlan,f.jornada,f.nivel,f.codigoAsignatura,f.asignatura,f.seccion,f.tipo,f.salaReferencia,f.modalidadAsignatura,f.modalidadSeccion
        ].join(' ').toLowerCase().includes(q)):filas;
        const tamano=[20,50,100].includes(Number(shared.data.gestorSecciones.tablaTamano))?Number(shared.data.gestorSecciones.tablaTamano):20;
        const totalPaginas=Math.max(1,Math.ceil(filtradas.length/tamano));
        const pagina=Math.max(1,Math.min(totalPaginas,Number(shared.data.gestorSecciones.tablaPagina)||1));
        shared.data.gestorSecciones.tablaPagina=pagina;
        shared.data.gestorSecciones.tablaTamano=tamano;
        const inicio=(pagina-1)*tamano;
        const visibles=filtradas.slice(inicio,inicio+tamano);
        if(resumen) resumen.textContent=filas.length?`${inicio+1}-${inicio+visibles.length} de ${filtradas.length}${q?` filtradas de ${filas.length}`:''} · página ${pagina}/${totalPaginas}`:'';
        if(btnAnterior) btnAnterior.disabled=pagina<=1||!filtradas.length;
        if(btnSiguiente) btnSiguiente.disabled=pagina>=totalPaginas||!filtradas.length;
        if(!filas.length){
            cont.innerHTML='<p class="auto-plan-empty">Aún no hay filas cargadas del Gestor.</p>';
            return;
        }
        if(!visibles.length){
            cont.innerHTML='<p class="auto-plan-empty">No hay filas para mostrar con el filtro actual.</p>';
            return;
        }
        cont.innerHTML=`
            <div class="gestor-full-table"><table>
                <thead><tr>
                    <th>ID</th><th>Programa</th><th>Plan</th><th>Jornada</th><th>Nivel</th><th>Sección</th>
                    <th>Código</th><th>Asignatura</th><th>Tipo</th><th>Alumnos</th><th>Otros</th><th>Total</th>
                    <th>Horas</th><th>Pres.</th><th>Virt.</th><th>Sala ref.</th><th>Modalidad Asig.</th><th>Modalidad Sec.</th>
                </tr></thead>
                <tbody>${visibles.map(f=>`<tr>
                    <td>${shared.escapeHTML(f.idSeccion||'')}</td>
                    <td>${shared.escapeHTML(f.programaCarrera||'')}</td>
                    <td>${shared.escapeHTML(f.programaPlan||'')}</td>
                    <td>${shared.escapeHTML(f.jornada||'')}</td>
                    <td>${shared.escapeHTML(f.nivel||'')}</td>
                    <td>${shared.escapeHTML(f.seccion||'')}</td>
                    <td>${shared.escapeHTML(f.codigoAsignatura||'')}</td>
                    <td title="${shared.escapeAttr(f.asignatura||'')}">${shared.escapeHTML(f.asignatura||'')}</td>
                    <td>${shared.escapeHTML(f.tipo||'')}</td>
                    <td>${f.alumnos||''}</td>
                    <td>${f.alumnosOtrosPlanes||''}</td>
                    <td>${f.alumnosTotales||''}</td>
                    <td>${f.horas||''}</td>
                    <td>${f.horasPresenciales||''}</td>
                    <td>${f.horasVirtuales||''}</td>
                    <td>${shared.escapeHTML(f.salaReferencia||'')}</td>
                    <td>${shared.escapeHTML(f.modalidadAsignatura||'')}</td>
                    <td>${shared.escapeHTML(f.modalidadSeccion||'')}</td>
                </tr>`).join('')}</tbody>
            </table></div>
        `;
    }

function seccionPorNombreGestor(nombre){
        const key=shared.normalizarEncabezadoGestor(nombre);
        return shared.data.secciones.find(s=>shared.normalizarEncabezadoGestor(s.nombre)===key)||null;
    }

function asignaturaPorCodigoGestor(codigo){
        const key=shared.textoGestor(codigo).toUpperCase();
        return shared.data.asignaturas.find(a=>String(a.codigo||'').toUpperCase()===key)||null;
    }

function keyEnlaceManualGestor(idSeccion,cargaId){
        return `${shared.textoGestor(cargaId)}::${shared.textoGestor(idSeccion)}`;
    }

function enlacesManualGestorPorId(idSeccion){
        const id=shared.textoGestor(idSeccion);
        return (shared.data.gestorSecciones.enlacesManuales||[])
            .filter(x=>shared.textoGestor(x.idSeccion)===id)
            .sort((a,b)=>String(b.ts||'').localeCompare(String(a.ts||'')));
    }

function getEnlaceManualGestor(idSeccion,cargaId){
        shared.data.gestorSecciones=shared.normalizarGestorSeccionesData(shared.data.gestorSecciones);
        const key=shared.keyEnlaceManualGestor(idSeccion,cargaId);
        const exacto=(shared.data.gestorSecciones.enlacesManuales||[]).find(x=>shared.keyEnlaceManualGestor(x.idSeccion,x.cargaId)===key);
        if(exacto) return exacto;
        const global=(shared.data.gestorSecciones.enlacesManuales||[]).find(x=>shared.textoGestor(x.idSeccion)===shared.textoGestor(idSeccion)&&(!x.cargaId||x.cargaId==='*'));
        if(global) return global;
        return shared.enlacesManualGestorPorId(idSeccion)[0]||null;
    }

function estadoVisualGestor(item){
        if(shared.getEnlaceManualGestor(item.idSeccion,item.cargaId)) return 'relacionada_manual';
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
        const detalle=shared.descripcionEnlaceManualGestor(enlace);
        if(enlace.origenCargaId&&cargaActual&&enlace.origenCargaId!==cargaActual) return `${detalle} · memoria reutilizada`;
        if(enlace.cargaId==='*') return `${detalle} · memoria reutilizable`;
        return detalle;
    }

function datosInformeGestor(){
        shared.data.gestorSecciones=shared.normalizarGestorSeccionesData(shared.data.gestorSecciones);
        const cargas=shared.data.gestorSecciones.cargas||[];
        const ultima=cargas.find(c=>c.id===shared.data.gestorSecciones.ultimaCargaId)||cargas[0]||null;
        const ids=ultima?(shared.data.gestorSecciones.ids||[]).filter(x=>x.cargaId===ultima.id):(shared.data.gestorSecciones.ids||[]);
        const filas=ultima?(shared.data.gestorSecciones.filas||[]).filter(x=>x.cargaId===ultima.id):(shared.data.gestorSecciones.filas||[]);
        return {ultima,ids,filas};
    }

function filasInformeRelacionesGestor(ids){
        return ids.map(x=>{
            const enlace=shared.getEnlaceManualGestor(x.idSeccion,x.cargaId);
            const estado=shared.estadoVisualGestor(x);
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
                shared.descripcionMemoriaAplicadaGestor(enlace,x.cargaId)||x.motivo||''
            ];
        });
    }

function matrizInformeGestor(ids){
        return [[
            'ID Sección','Estado','Código','Asignatura','Madre detectada','Secciones reales',
            'Filas','Filas fusionadas','Carrera','Plan','Nivel','Jornada',
            'Tipo relación manual','Referencia manual','Nota manual','Motivo / detalle'
        ],...shared.filasInformeRelacionesGestor(ids)];
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
        const {ultima,ids,filas}=shared.datosInformeGestor();
        if(!ids.length) return shared.toast('No hay memoria del Gestor para exportar','error');
        const resueltas=ids.filter(x=>shared.estadoVisualGestor(x)==='resuelta');
        const manuales=ids.filter(x=>shared.estadoVisualGestor(x)==='relacionada_manual');
        const pendientes=ids.filter(x=>shared.estadoVisualGestor(x)==='pendiente_externa');
        const sinId=ids.filter(x=>shared.estadoVisualGestor(x)==='sin_id');
        const memoriasReutilizadas=ids.filter(x=>{
            const enlace=shared.getEnlaceManualGestor(x.idSeccion,x.cargaId);
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
            {nombre:'Todas las relaciones',matriz:shared.matrizInformeGestor(ids)},
            {nombre:'Resueltas',matriz:shared.matrizInformeGestor(resueltas)},
            {nombre:'Manuales',matriz:shared.matrizInformeGestor(manuales)},
            {nombre:'Pendientes externas',matriz:shared.matrizInformeGestor(pendientes)},
            {nombre:'Sin ID',matriz:shared.matrizInformeGestor(sinId)}
        ];
        const nombreBase=`Informe_Gestor_${shared.getTemporadaLabel()}_${new Date().toISOString().slice(0,10)}`;
        if((window.XLSX?.utils?.book_new&&window.XLSX?.writeFile) || (await shared.asegurarXLSX() && window.XLSX?.utils?.book_new&&window.XLSX?.writeFile)){
            const wb=window.XLSX.utils.book_new();
            hojas.forEach(h=>{
                const ws=shared.formatearHojaInformeGestor(window.XLSX.utils.aoa_to_sheet(h.matriz.length?h.matriz:[['Sin datos']]));
                window.XLSX.utils.book_append_sheet(wb,ws,shared.nombreHojaGestor(h.nombre));
            });
            window.XLSX.writeFile(wb,`${nombreBase}.xlsx`,{bookSST:true,cellStyles:true});
        }else{
            shared.descargarTablaExcel(`${nombreBase}.xls`,hojas);
        }
        shared.auditoria('gestor_informe_exportado',{archivo:ultima?.archivo||'',ids:ids.length,pendientes:pendientes.length,manuales:manuales.length});
        shared.toast('Informe del Gestor exportado','success');
    }

function renderBuscadorIdGestor(){
        const cont=document.getElementById('gestorIdResultado');
        if(!cont) return;
        shared.data.gestorSecciones=shared.normalizarGestorSeccionesData(shared.data.gestorSecciones);
        const q=(document.getElementById('gestorIdBusqueda')?.value||'').trim().toLowerCase();
        if(!q){
            cont.innerHTML='<p class="auto-plan-empty">Escribe una ID para ver su relación, estado y acceso rápido a planificación.</p>';
            return;
        }
        const cargas=shared.data.gestorSecciones.cargas||[];
        const ultima=cargas.find(c=>c.id===shared.data.gestorSecciones.ultimaCargaId)||cargas[0]||null;
        const ids=shared.data.gestorSecciones.ids||[];
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
            const filas=(shared.data.gestorSecciones.filas||[]).filter(f=>f.cargaId===item.cargaId&&f.idSeccion===item.idSeccion);
            const asig=shared.asignaturaPorCodigoGestor(item.asignaturaCodigo);
            const enlace=shared.getEnlaceManualGestor(item.idSeccion,item.cargaId);
            const secciones=(item.seccionesReales||[]).map(nombre=>({nombre,sec:shared.seccionPorNombreGestor(nombre)}));
            const acciones=[
                secciones.filter(x=>x.sec).map(x=>`<button class="btn btn-xs gestor-ir-planificacion" data-seccion="${shared.escapeAttr(x.sec.id)}" data-asignatura="${shared.escapeAttr(asig?.id||'')}" data-id="${shared.escapeAttr(item.idSeccion||'')}">Ir a ${shared.escapeHTML(x.nombre)}</button>`).join(''),
                `<button class="btn btn-xs gestor-relacionar-id" data-id="${shared.escapeAttr(item.idSeccion||'')}" data-carga="${shared.escapeAttr(item.cargaId||'')}">${enlace?'Editar relación':'Relacionar manualmente'}</button>`
            ].filter(Boolean).join('');
            return `
            <div class="gestor-id-result">
                <h3>ID ${shared.escapeHTML(item.idSeccion||'Sin ID')}</h3>
                <div class="gestor-id-grid">
                    <div><span>Estado</span><strong>${shared.escapeHTML(shared.estadoVisualGestor(item))}</strong></div>
                    <div><span>Archivo</span><strong>${shared.escapeHTML(carga?.archivo||item.archivo||'-')}</strong></div>
                    <div><span>Asignatura</span><strong>${shared.escapeHTML([item.asignaturaCodigo,item.asignaturaNombre].filter(Boolean).join(' - '))}</strong></div>
                    <div><span>Madre detectada</span><strong>${shared.escapeHTML(item.madreDetectada||'No visible')}</strong></div>
                    <div><span>Secciones reales</span><strong>${shared.escapeHTML((item.seccionesReales||[]).join(', ')||'No visibles')}</strong></div>
                    <div><span>Filas</span><strong>${item.filas||0}</strong></div>
                    <div><span>Fusionadas</span><strong>${item.filasFusionadas||0}</strong></div>
                    <div><span>Carrera / plan</span><strong>${shared.escapeHTML([item.carrera,item.plan].filter(Boolean).join(' · '))}</strong></div>
                    <div><span>Nivel / jornada</span><strong>${shared.escapeHTML([item.nivel,item.jornada].filter(Boolean).join(' · '))}</strong></div>
                </div>
                <p class="auto-plan-empty">${shared.escapeHTML(shared.descripcionMemoriaAplicadaGestor(enlace,item.cargaId)||item.motivo||'')}</p>
                <div class="gestor-id-actions">${acciones}</div>
                ${filas.length?`<div class="gestor-mini-table" style="margin-top:10px;"><table><thead><tr><th>Sección</th><th>Tipo</th><th>Asignatura</th><th>Horas</th><th>Alumnos</th></tr></thead><tbody>${filas.slice(0,8).map(f=>`<tr><td>${shared.escapeHTML(f.seccion||'')}</td><td>${shared.escapeHTML(f.tipo||'')}</td><td>${shared.escapeHTML([f.codigoAsignatura,f.asignatura].filter(Boolean).join(' - '))}</td><td>${f.horas||''}</td><td>${f.alumnosTotales||f.alumnos||''}</td></tr>`).join('')}</tbody></table></div>`:''}
            </div>
        `;}).join('')+(matches.length>visibles.length?`<p class="auto-plan-empty">Hay ${matches.length} coincidencias; se muestran las primeras ${visibles.length}. Escribe la ID completa para mayor precisión.</p>`:'');
    }

function etiquetaEstadoGestor(estado){
        const textos={resuelta:'Resuelta',relacionada_manual:'Relacionada manual',pendiente_externa:'Pendiente externa',sin_id:'Sin ID'};
        const cls=estado||'por-revisar';
        return `<span class="gestor-status ${shared.escapeAttr(cls)}">${shared.escapeHTML(textos[estado]||'Por revisar')}</span>`;
    }

function renderRelacionesGestor(){
        const cont=document.getElementById('gestorRelaciones');
        const resumen=document.getElementById('gestorRelacionesResumen');
        if(!cont) return;
        shared.data.gestorSecciones=shared.normalizarGestorSeccionesData(shared.data.gestorSecciones);
        const cargas=shared.data.gestorSecciones.cargas||[];
        const ultima=cargas.find(c=>c.id===shared.data.gestorSecciones.ultimaCargaId)||cargas[0]||null;
        const ids=ultima?(shared.data.gestorSecciones.ids||[]).filter(x=>x.cargaId===ultima.id):(shared.data.gestorSecciones.ids||[]);
        if(!ids.length){
            if(resumen) resumen.textContent='';
            cont.innerHTML='<p class="auto-plan-empty">Aún no hay relaciones por ID. Carga un Gestor para revisar vínculos, fusiones y pendientes.</p>';
            return;
        }
        const conteo={
            resuelta:ids.filter(x=>shared.estadoVisualGestor(x)==='resuelta').length,
            relacionada_manual:ids.filter(x=>shared.estadoVisualGestor(x)==='relacionada_manual').length,
            pendiente_externa:ids.filter(x=>shared.estadoVisualGestor(x)==='pendiente_externa').length,
            sin_id:ids.filter(x=>x.estado==='sin_id').length
        };
        const estado=(document.getElementById('gestorRelacionEstado')?.value||'').trim();
        const q=(document.getElementById('gestorRelacionBusqueda')?.value||'').trim().toLowerCase();
        const filtradas=ids.filter(x=>{
            const estadoVisual=shared.estadoVisualGestor(x);
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
                    const asig=shared.asignaturaPorCodigoGestor(x.asignaturaCodigo);
                    const enlace=shared.getEnlaceManualGestor(x.idSeccion,x.cargaId);
                    const estadoVisual=shared.estadoVisualGestor(x);
                    const secciones=(x.seccionesReales||[]).map(nombre=>({nombre,sec:shared.seccionPorNombreGestor(nombre)}));
                    const acciones=[
                        secciones.filter(s=>s.sec).slice(0,3).map(s=>`<button class="btn btn-xs gestor-ir-planificacion" data-seccion="${shared.escapeAttr(s.sec.id)}" data-asignatura="${shared.escapeAttr(asig?.id||'')}" data-id="${shared.escapeAttr(x.idSeccion||'')}">${shared.escapeHTML(s.nombre)}</button>`).join(' '),
                        `<button class="btn btn-xs gestor-relacionar-id" data-id="${shared.escapeAttr(x.idSeccion||'')}" data-carga="${shared.escapeAttr(x.cargaId||'')}">${enlace?'Editar relación':'Relacionar'}</button>`
                    ].filter(Boolean).join(' ');
                    const relacion=enlace?shared.descripcionMemoriaAplicadaGestor(enlace,x.cargaId):x.estado==='resuelta'
                        ? `Madre: ${x.madreDetectada||'no visible'}${x.filasFusionadas?` · ${x.filasFusionadas} fusionada(s) trazadas`:''}`
                        : (x.motivo||'Revisar relación manualmente');
                    return `<tr>
                        <td>${shared.etiquetaEstadoGestor(estadoVisual)}</td>
                        <td><strong>${shared.escapeHTML(x.idSeccion||'Sin ID')}</strong></td>
                        <td>${shared.escapeHTML([x.asignaturaCodigo,x.asignaturaNombre].filter(Boolean).join(' - '))}</td>
                        <td>${shared.escapeHTML(relacion)}<br><span class="auto-plan-empty">${shared.escapeHTML((x.seccionesReales||[]).join(', ')||'Sin sección real visible')}</span></td>
                        <td>${shared.escapeHTML([x.carrera,x.plan,x.nivel,x.jornada].filter(Boolean).join(' · '))}</td>
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
        shared.data.gestorSecciones=shared.normalizarGestorSeccionesData(shared.data.gestorSecciones);
        const cargas=shared.data.gestorSecciones.cargas||[];
        const ultima=cargas.find(c=>c.id===shared.data.gestorSecciones.ultimaCargaId)||cargas[0]||null;
        const ids=ultima?(shared.data.gestorSecciones.ids||[]).filter(x=>x.cargaId===ultima.id):(shared.data.gestorSecciones.ids||[]);
        const pendientes=ids.filter(x=>shared.estadoVisualGestor(x)==='pendiente_externa');
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
                    <div><strong>${shared.escapeHTML(x.idSeccion||'Sin ID')}</strong><span>${shared.escapeHTML(x.estado==='pendiente_externa'?'Pendiente externa':'Por revisar')}</span></div>
                    <div><strong>${shared.escapeHTML([x.asignaturaCodigo,x.asignaturaNombre].filter(Boolean).join(' - ')||'Sin asignatura')}</strong><span>${shared.escapeHTML(x.motivo||'ID sin sección real visible en el archivo cargado.')}</span></div>
                    <div><strong>${shared.escapeHTML([x.carrera,x.plan].filter(Boolean).join(' · ')||'Sin carrera visible')}</strong><span>${shared.escapeHTML([x.nivel,x.jornada].filter(Boolean).join(' · ')||'Sin contexto visible')}</span></div>
                    <div class="gestor-pending-actions">
                        <button class="btn btn-xs gestor-buscar-id" data-id="${shared.escapeAttr(x.idSeccion||'')}">Buscar ID</button>
                        <button class="btn btn-xs gestor-ver-filas" data-id="${shared.escapeAttr(x.idSeccion||'')}">Ver filas</button>
                        <button class="btn btn-xs gestor-relacionar-id" data-id="${shared.escapeAttr(x.idSeccion||'')}" data-carga="${shared.escapeAttr(x.cargaId||'')}">Relacionar</button>
                    </div>
                </div>`).join('')}
            </div>
            ${pendientes.length>visibles.length?`<p class="auto-plan-empty">Se muestran ${visibles.length} de ${pendientes.length}. Usa Relaciones por ID para filtrar el resto.</p>`:''}
        `;
    }

function salaPorReferenciaGestor(ref){
        const info=shared.parsearSalaReferenciaGestor(ref);
        if(!info?.nombre) return null;
        const key=shared.normalizarEncabezadoGestor(info.nombre);
        return shared.data.salas.find(s=>shared.normalizarEncabezadoGestor(s.nombre)===key) || null;
    }

function cupoPedagogicoGestor(fila,tipoEspacio){
        const asig=shared.asignaturaPorCodigoGestor(fila.codigoAsignatura);
        const declarado=Number(asig?.cupoPedagogicoSugerido||asig?.cupoRecomendado||0);
        if(declarado>0) return {valor:declarado,fuente:'Asignatura'};
        const modalidad=shared.modalidadAsignaturaGestor(fila.modalidadAsignatura||fila.tipoAsignatura);
        const tipo=shared.normalizarEncabezadoGestor(tipoEspacio||fila.salaReferencia||'');
        if(modalidad==='online-teams') return {valor:9999,fuente:'Online'};
        if(tipo.includes('taller')) return {valor:18,fuente:'Taller'};
        if(tipo.includes('especialidad')||tipo.includes('laboratorio')) return {valor:20,fuente:'Laboratorio'};
        if(tipo.includes('comput')) return {valor:24,fuente:'Computación'};
        if(modalidad==='practica') return {valor:24,fuente:'Práctica'};
        if(modalidad==='semipresencial') return {valor:30,fuente:'Semipresencial'};
        return {valor:35,fuente:'Lectiva'};
    }

function analizarFilaProyeccionGestor(fila){
        const salaInfo=shared.parsearSalaReferenciaGestor(fila.salaReferencia);
        const sala=shared.salaPorReferenciaGestor(fila.salaReferencia);
        const cupoSala=sala?.capacidad&&Number(sala.capacidad)>0&&!sala.ilimitada?Number(sala.capacidad):null;
        const cupoPed=shared.cupoPedagogicoGestor(fila,salaInfo?.tipo);
        const cupos=[cupoSala,cupoPed.valor].filter(n=>Number.isFinite(n)&&n>0&&n<9000);
        const cupoFinal=cupos.length?Math.min(...cupos):null;
        const alumnos=Number(fila.alumnos)||0;
        const otros=Number(fila.alumnosOtrosPlanes)||0;
        const total=Number(fila.alumnosTotales)||alumnos+otros;
        const fusionLiteral=shared.esSeccionFusionLiteral(fila.seccion);
        const modalidad=shared.modalidadAsignaturaGestor(fila.modalidadAsignatura||fila.tipoAsignatura);
        const tipoEspacio=salaInfo?.tipo||shared.tipoEspacioDesdeTexto(fila.salaReferencia||'');
        const razones=[];
        let accion='aceptar', riesgo='bajo';
        if(!sala&&fila.salaReferencia&&modalidad!=='online-teams'){
            riesgo='medio'; accion='sala'; razones.push('Sala sugerida no existe en catálogo');
        }
        if(cupoFinal&&total>cupoFinal){
            const exceso=total-cupoFinal;
            const factor=total/cupoFinal;
            riesgo=factor>=1.35?'critico':'alto';
            if(modalidad==='practica'||shared.normalizarEncabezadoGestor(tipoEspacio).includes('lab')||shared.normalizarEncabezadoGestor(tipoEspacio).includes('taller')) accion='subseccion';
            else accion='seccion';
            razones.push(`Sobrecupo ${total}/${cupoFinal} (+${exceso})`);
        }
        if(otros>0 && cupoFinal && total>cupoFinal){
            accion='fusion';
            razones.push(`${otros} alumno(s) de otros planes tensionan el cupo`);
        }
        if(fusionLiteral){
            riesgo=riesgo==='bajo'?'medio':riesgo;
            razones.push('Fila fusionada: revisar sección madre antes de decidir');
        }
        if(modalidad==='online-teams'){
            riesgo='bajo';
            accion='aceptar';
            razones.length=0;
            razones.push('Online TEAMS: no requiere cupo físico');
        }
        const recomendacion={
            aceptar:'Aceptar Gestor / sin alerta mayor',
            sala:'Revisar sala sugerida',
            subseccion:'Evaluar subsección práctica',
            seccion:'Evaluar sección paralela',
            fusion:'Revisar fusión o alumnos externos'
        }[accion]||'Revisar';
        return {
            fila,
            riesgo,
            accion,
            recomendacion,
            razones:razones.length?razones:['Sin alerta mayor'],
            alumnos,otros,total,
            salaNombre:sala?.nombre||salaInfo?.nombre||'Sin sala',
            salaExiste:!!sala,
            cupoSala,
            cupoPedagogico:cupoPed.valor,
            fuentePedagogica:cupoPed.fuente,
            cupoFinal,
            tipoEspacio,
            modalidad,
            horas:Number(fila.horas)||0,
            horasPresenciales:Number(fila.horasPresenciales)||0,
            horasVirtuales:Number(fila.horasVirtuales)||0,
            fusionLiteral
        };
    }

function obtenerProyeccionGestor(){
        shared.data.gestorSecciones=shared.normalizarGestorSeccionesData(shared.data.gestorSecciones);
        const cargas=shared.data.gestorSecciones.cargas||[];
        const ultima=cargas.find(c=>c.id===shared.data.gestorSecciones.ultimaCargaId)||cargas[0]||null;
        const filas=ultima?(shared.data.gestorSecciones.filas||[]).filter(f=>f.cargaId===ultima.id):(shared.data.gestorSecciones.filas||[]);
        const mapa=new Map();
        filas.forEach(f=>{
            const key=[
                f.idSeccion||'sin-id',
                shared.textoGestor(f.codigoAsignatura).toUpperCase(),
                shared.textoGestor(f.seccion)||'sin-seccion',
                shared.textoGestor(f.programaPlan)||'sin-plan',
                shared.textoGestor(f.nivel)||'sin-nivel'
            ].join('|');
            if(!mapa.has(key)) mapa.set(key,shared.analizarFilaProyeccionGestor(f));
        });
        return [...mapa.values()].sort((a,b)=>{
            const peso={critico:4,alto:3,medio:2,bajo:1};
            return (peso[b.riesgo]||0)-(peso[a.riesgo]||0)
                || String(a.fila.programaPlan||'').localeCompare(String(b.fila.programaPlan||''),'es',{numeric:true,sensitivity:'base'})
                || String(a.fila.nivel||'').localeCompare(String(b.fila.nivel||''),'es',{numeric:true,sensitivity:'base'});
        });
    }

function claseRiesgoProyeccion(riesgo){
        return {critico:'danger',alto:'warning',medio:'info',bajo:'ok'}[riesgo]||'info';
    }

function renderProyeccionGestor(){
        const cont=document.getElementById('gestorProyeccion');
        const resumen=document.getElementById('gestorProyeccionResumen');
        if(!cont) return;
        const items=shared.obtenerProyeccionGestor();
        if(!items.length){
            if(resumen) resumen.textContent='';
            cont.innerHTML='<p class="auto-plan-empty">Carga un Gestor para generar una lectura analítica de cupos, riesgos y horas.</p>';
            return;
        }
        const riesgoFiltro=(document.getElementById('gestorProyeccionRiesgo')?.value||'').trim();
        const accionFiltro=(document.getElementById('gestorProyeccionAccion')?.value||'').trim();
        const q=(document.getElementById('gestorProyeccionBusqueda')?.value||'').trim().toLowerCase();
        const filtrados=items.filter(x=>{
            if(riesgoFiltro&&x.riesgo!==riesgoFiltro) return false;
            if(accionFiltro&&x.accion!==accionFiltro) return false;
            if(!q) return true;
            const f=x.fila;
            return [
                f.idSeccion,f.codigoAsignatura,f.asignatura,f.seccion,f.programaCarrera,f.programaPlan,f.nivel,f.jornada,x.recomendacion,x.riesgo,x.salaNombre
            ].join(' ').toLowerCase().includes(q);
        });
        const conteo={critico:0,alto:0,medio:0,bajo:0};
        items.forEach(x=>{ conteo[x.riesgo]=(conteo[x.riesgo]||0)+1; });
        const horasPropias=items
            .filter(x=>!x.fusionLiteral && shared.areaAsignaturaGestor(x.fila)!=='electiva')
            .reduce((acc,x)=>acc+(Number(x.horasPresenciales)||Number(x.horas)||0),0);
        const horasExternas=items
            .filter(x=>x.fusionLiteral)
            .reduce((acc,x)=>acc+(Number(x.horasPresenciales)||Number(x.horas)||0),0);
        if(resumen) resumen.textContent=`${filtrados.length} de ${items.length}`;
        const visibles=filtrados.slice(0,120);
        cont.innerHTML=`
            <div class="gestor-projection-summary">
                <div><span>Crítico</span><strong>${conteo.critico}</strong></div>
                <div><span>Alto</span><strong>${conteo.alto}</strong></div>
                <div><span>Medio</span><strong>${conteo.medio}</strong></div>
                <div><span>Bajo</span><strong>${conteo.bajo}</strong></div>
                <div><span>Horas propias pres.</span><strong>${horasPropias}</strong></div>
                <div><span>Horas externas ref.</span><strong>${horasExternas}</strong></div>
            </div>
            ${visibles.length?`<div class="gestor-projection-list">
                ${visibles.map(x=>{
                    const f=x.fila;
                    const destino=shared.resolverDestinoSeccionesGestor({idGestor:f.idSeccion||'',codigo:f.codigoAsignatura||'',nombre:f.seccion||''});
                    const sec=destino.sec;
                    const asig=destino.asig;
                    const desvinculada=shared.fusionDesvinculadaGestor(sec,asig);
                    const recomendacion=desvinculada?'Planificar aparte':x.recomendacion;
                    const accionSecciones=sec
                        ? `<button class="btn btn-xs gestor-ir-secciones" data-seccion="${shared.escapeAttr(sec.id)}" data-asignatura="${shared.escapeAttr(asig?.id||'')}" data-id-gestor="${shared.escapeAttr(f.idSeccion||'')}" data-codigo="${shared.escapeAttr(f.codigoAsignatura||'')}" data-area="${shared.escapeAttr(f.area||'')}" data-plan="${shared.escapeAttr(f.programaPlan||'')}" data-nivel="${shared.escapeAttr(f.nivel||'')}" data-nombre="${shared.escapeAttr(f.seccion||'')}">Ir a secciones</button>`
                        : `<span class="projection-external-note">Referencia externa</span>`;
                    const notaDesvinculada=desvinculada?`<span class="projection-external-note">Fusión desvinculada</span>`:'';
                    return `<div class="gestor-projection-row ${shared.escapeAttr(x.riesgo)}">
                        <div class="gestor-projection-main">
                            <strong>${shared.escapeHTML([f.codigoAsignatura,f.asignatura].filter(Boolean).join(' - '))}</strong>
                            <span>${shared.escapeHTML([f.seccion||'Sin sección',f.idSeccion?`ID ${f.idSeccion}`:'Sin ID',[f.programaPlan,f.nivel,f.jornada].filter(Boolean).join(' · ')].filter(Boolean).join(' · '))}</span>
                        </div>
                        <div><span>Alumnos</span><strong>${x.alumnos} propios + ${x.otros} externos = ${x.total}</strong></div>
                        <div><span>Cupos</span><strong>Sala ${x.cupoSala||'s/d'} · Ped. ${x.cupoPedagogico>=9000?'N/A':x.cupoPedagogico} · Final ${x.cupoFinal||'s/d'}</strong></div>
                        <div><span>Espacio</span><strong>${shared.escapeHTML(x.salaNombre)} · ${shared.escapeHTML(x.tipoEspacio)}</strong></div>
                        <div><span>Riesgo</span><strong><span class="projection-risk ${shared.claseRiesgoProyeccion(x.riesgo)}">${shared.escapeHTML(x.riesgo)}</span></strong></div>
                        <div><span>Recomendación</span><strong>${shared.escapeHTML(recomendacion)}</strong>${notaDesvinculada}${accionSecciones}</div>
                        <div class="gestor-projection-reason">${shared.escapeHTML(x.razones.join(' · '))}</div>
                    </div>`;
                }).join('')}
            </div>`:'<p class="auto-plan-empty">No hay resultados para el filtro actual.</p>'}
            ${filtrados.length>visibles.length?`<p class="auto-plan-empty">Se muestran ${visibles.length} de ${filtrados.length}. Usa filtros o búsqueda para acotar.</p>`:''}
        `;
    }

function abrirRelacionManualGestor(idSeccion,cargaId){
        shared.data.gestorSecciones=shared.normalizarGestorSeccionesData(shared.data.gestorSecciones);
        const item=(shared.data.gestorSecciones.ids||[]).find(x=>x.idSeccion===idSeccion&&x.cargaId===cargaId);
        if(!item) return shared.toast('No se encontró la ID en la memoria del Gestor','error');
        const actual=shared.getEnlaceManualGestor(idSeccion,cargaId);
        const seccionesOrdenadas=shared.data.secciones.slice().sort((a,b)=>String(a.nombre||'').localeCompare(String(b.nombre||''),'es'));
        const opcionesSeccion=seccionesOrdenadas.map(s=>`<option value="${shared.escapeAttr(s.id)}" ${actual?.seccionId===s.id?'selected':''}>${shared.escapeHTML(s.nombre)}</option>`).join('');
        const tipo=actual?.tipo||'externa';
        document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal">
                <div class="modal-header">
                    <h3>Relacionar ID del Gestor</h3>
                    <p>ID ${shared.escapeHTML(idSeccion)} · ${shared.escapeHTML([item.asignaturaCodigo,item.asignaturaNombre].filter(Boolean).join(' - '))}</p>
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
                    <input class="form-input" id="gestorRelacionManualNombre" placeholder="Ej: D-ADM-N1-P2-C3, Coordinación Matemática, otra área..." value="${shared.escapeAttr(actual?.seccionNombre||'')}">
                </div>
                <div class="form-group">
                    <label class="form-label">Nota</label>
                    <textarea class="form-input" id="gestorRelacionManualNota" rows="3" placeholder="Observación breve para recordar cómo se resolvió esta ID.">${shared.escapeHTML(actual?.nota||'')}</textarea>
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
        const cerrar=()=>shared.cerrarModal();
        const guardarRelacion=()=>{
            const tipoSel=tipoEl.value==='interna'?'interna':'externa';
            const seccionId=document.getElementById('gestorRelacionManualSeccion')?.value||'';
            const seccionInterna=shared.data.secciones.find(s=>s.id===seccionId)||null;
            const seccionNombre=tipoSel==='interna'?(seccionInterna?.nombre||''):(document.getElementById('gestorRelacionManualNombre')?.value||'').trim();
            const nota=(document.getElementById('gestorRelacionManualNota')?.value||'').trim();
            if(tipoSel==='interna'&&!seccionInterna) return shared.toast('Selecciona una sección interna','error');
            if(tipoSel==='externa'&&!seccionNombre) return shared.toast('Escribe una referencia externa','error');
            shared.data.gestorSecciones=shared.normalizarGestorSeccionesData(shared.data.gestorSecciones);
            shared.data.gestorSecciones.enlacesManuales=(shared.data.gestorSecciones.enlacesManuales||[]).filter(x=>shared.textoGestor(x.idSeccion)!==shared.textoGestor(idSeccion));
            shared.data.gestorSecciones.enlacesManuales.unshift({
                idSeccion,cargaId:'*',origenCargaId:cargaId,tipo:tipoSel,
                seccionId:tipoSel==='interna'?seccionId:'',
                seccionNombre,
                nota,
                ts:new Date().toISOString()
            });
            shared.auditoria('gestor_id_relacionada_manual',{idSeccion,cargaId,tipo:tipoSel,seccionId:tipoSel==='interna'?seccionId:null,seccionNombre,memoriaGlobal:true});
            shared.guardar({forzar:true});
            shared.renderGestorSecciones();
            if(shared.tabActivaEs('dashboard')) shared.renderDashboard();
            cerrar();
            shared.toast('Relación manual guardada','success');
        };
        const eliminarRelacion=()=>{
            shared.data.gestorSecciones=shared.normalizarGestorSeccionesData(shared.data.gestorSecciones);
            shared.data.gestorSecciones.enlacesManuales=(shared.data.gestorSecciones.enlacesManuales||[]).filter(x=>shared.textoGestor(x.idSeccion)!==shared.textoGestor(idSeccion));
            shared.auditoria('gestor_id_relacion_manual_eliminada',{idSeccion,cargaId,memoriaGlobal:true});
            shared.guardar({forzar:true});
            shared.renderGestorSecciones();
            if(shared.tabActivaEs('dashboard')) shared.renderDashboard();
            cerrar();
            shared.toast('Relación manual eliminada','info');
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
        const anterior=contextoRenderGestor;
        contextoRenderGestor={salida:null};
        try{return renderContenidoGestorSecciones();}
        finally{contextoRenderGestor=anterior;}
    }

function renderContenidoGestorSecciones(){
        const resumenEl=document.getElementById('gestorResumen');
        const idsEl=document.getElementById('gestorIdsResumen');
        const btnAplicar=document.getElementById('btnGestorAplicar');
        const btnExportar=document.getElementById('btnGestorExportarInforme');
        if(!resumenEl||!idsEl) return;
        shared.data.gestorSecciones=shared.normalizarGestorSeccionesData(shared.data.gestorSecciones);
        const cargas=shared.data.gestorSecciones.cargas||[];
        const ids=shared.data.gestorSecciones.ids||[];
        const ultima=cargas.find(c=>c.id===shared.data.gestorSecciones.ultimaCargaId)||cargas[0]||null;
        const idsUltima=ultima?ids.filter(x=>x.cargaId===ultima.id):ids;
        const pendientes=idsUltima.filter(x=>shared.estadoVisualGestor(x)==='pendiente_externa').length;
        const resueltas=idsUltima.filter(x=>shared.estadoVisualGestor(x)==='resuelta').length;
        const manuales=idsUltima.filter(x=>shared.estadoVisualGestor(x)==='relacionada_manual').length;
        const sinId=idsUltima.filter(x=>shared.estadoVisualGestor(x)==='sin_id').length;
        const filtroActual=shared.data.gestorSecciones.filtroAplicacion?.cargaId===ultima?.id?shared.data.gestorSecciones.filtroAplicacion:null;
        resumenEl.innerHTML=[
            ['Archivo',ultima?.archivo||'Sin carga'],
            ['IDs leídas',idsUltima.length],
            ['IDs resueltas',resueltas],
            ['Memoria manual',manuales],
            ['Pendientes externas',pendientes],
            ['Sin ID',sinId],
            ['Carreras filtradas',filtroActual?.carreras?.length||'Todas'],
            ['Última carga',ultima?.fecha?new Date(ultima.fecha).toLocaleString():'-']
        ].map(([k,v])=>`<div><span>${shared.escapeHTML(k)}</span><strong title="${shared.escapeAttr(String(v))}">${shared.escapeHTML(String(v))}</strong></div>`).join('');
        if(btnAplicar) btnAplicar.disabled=!ultima;
        if(btnExportar) btnExportar.disabled=!ultima||!idsUltima.length;
        const muestra=idsUltima.slice(0,12);
        idsEl.innerHTML=muestra.length?`
            <div class="gestor-mini-table"><table>
                <thead><tr><th>ID</th><th>Estado</th><th>Asignatura</th><th>Carrera / plan</th><th>Nivel / jornada</th><th>Madre detectada</th><th>Secciones reales</th><th>Motivo</th></tr></thead>
                <tbody>${muestra.map(x=>`<tr>
                    <td>${shared.escapeHTML(x.idSeccion||'Sin ID')}</td>
                    <td>${shared.escapeHTML(x.estado)}</td>
                    <td>${shared.escapeHTML([x.asignaturaCodigo,x.asignaturaNombre].filter(Boolean).join(' - '))}</td>
                    <td>${shared.escapeHTML([x.carrera,x.plan].filter(Boolean).join(' · ')||'-')}</td>
                    <td>${shared.escapeHTML([x.nivel,x.jornada].filter(Boolean).join(' · ')||'-')}</td>
                    <td>${shared.escapeHTML(x.madreDetectada||'-')}</td>
                    <td>${shared.escapeHTML((x.seccionesReales||[]).join(', ')||'-')}</td>
                    <td>${shared.escapeHTML(x.motivo||'')}</td>
                </tr>`).join('')}</tbody>
            </table></div>
            ${idsUltima.length>muestra.length?`<p class="auto-plan-empty">Se muestran ${muestra.length} de ${idsUltima.length} ID. Usa la tabla completa para revisar más filas.</p>`:''}
        `:'<p class="auto-plan-empty">Aún no hay IDs cargadas. Usa “Cargar Gestor” para crear la memoria de IDs.</p>';
        shared.renderBuscadorIdGestor();
        shared.renderPendientesGestor();
        shared.renderRelacionesGestor();
        shared.renderProyeccionGestor();
        shared.renderTablaGestorSecciones();
    }

function aplicarPropuestaGestor(propuesta){
        const cols=shared.getColores();
        const resumen={
            carreras:0,niveles:0,secciones:0,asignaturas:0,salas:0,relaciones:0,relacionesSeccion:0,grupos:0,vinculos:0,omitidos:0,
            detalle:{carreras:[],niveles:[],secciones:[],asignaturas:[],salas:[],relaciones:[],relacionesSeccion:[],grupos:[],vinculos:[],omitidos:[]}
        };
        shared.sincronizarEspecialidadesDesdeGestor((shared.data.gestorSecciones?.filas||[]).filter(f=>!shared.data.gestorSecciones?.ultimaCargaId||f.cargaId===shared.data.gestorSecciones.ultimaCargaId));
        const carreraIds=new Map();
        shared.data.carreras.forEach(c=>carreraIds.set(String(c.codigo||'').toUpperCase(),c.id));
        propuesta.carreras.forEach(c=>{
            const key=String(c.codigo||'').toUpperCase();
            let id=carreraIds.get(key);
            if(!id){
                id=shared.genId();
                shared.data.carreras.push({id,codigo:c.codigo,nombre:c.nombre,area:c.area||'',especialidad:c.area||'',tipo:''});
                carreraIds.set(key,id);
                resumen.carreras++;
                resumen.detalle.carreras.push(`${c.codigo} - ${c.nombre}`);
            } else {
                const carrera=shared.data.carreras.find(x=>x.id===id);
                if(carrera&&c.area){
                    carrera.area=c.area;
                    if(!carrera.especialidad) carrera.especialidad=c.area;
                }
            }
        });

        const nivelIds=new Map();
        shared.data.niveles.forEach(n=>nivelIds.set(`${n.carreraId}|${shared.normalizarEncabezadoGestor(n.nombre)}`,n.id));
        propuesta.niveles.forEach(n=>{
            const carreraId=carreraIds.get(String(n.carreraKey||'').toUpperCase());
            if(!carreraId){ resumen.omitidos++; return; }
            const key=`${carreraId}|${shared.normalizarEncabezadoGestor(n.nombre)}`;
            let id=nivelIds.get(key);
            if(!id){
                id=shared.genId();
                shared.data.niveles.push({id,carreraId,nombre:n.nombre,tieneOnline:!!n.tieneOnline});
                nivelIds.set(key,id);
                resumen.niveles++;
                resumen.detalle.niveles.push(`${n.carreraKey} · ${n.nombre}`);
            }else if(n.tieneOnline){
                const nivel=shared.data.niveles.find(x=>x.id===id);
                if(nivel) nivel.tieneOnline=true;
            }
        });

        const seccionIds=new Map();
        shared.data.secciones.forEach(s=>seccionIds.set(shared.normalizarEncabezadoGestor(s.nombre),s.id));
        propuesta.secciones.forEach(s=>{
            const carreraId=carreraIds.get(String(s.carreraKey||'').toUpperCase());
            const nivelNombre=(s.nivelKey||'').split('|')[1]||'';
            const nivelId=carreraId?nivelIds.get(`${carreraId}|${shared.normalizarEncabezadoGestor(nivelNombre)}`):null;
            if(!nivelId){ resumen.omitidos++; resumen.detalle.omitidos.push(`Sección ${s.nombre}: sin nivel destino`); return; }
            const key=shared.normalizarEncabezadoGestor(s.nombre);
            let id=seccionIds.get(key);
            if(!id){
                id=shared.genId();
                shared.data.secciones.push({id,nivelId,nombre:s.nombre,tipoSeccion:shared.tieneMarcaFusionGestor(s.nombre)?'fusionada':'regular',jornada:shared.jornadaGestor(s.jornada,s.nombre)});
                seccionIds.set(key,id);
                resumen.secciones++;
                resumen.detalle.secciones.push(`${s.nombre} · ${s.carreraKey} · ${nivelNombre}`);
            }
        });

        const asignaturaIds=new Map();
        shared.data.asignaturas.forEach(a=>asignaturaIds.set(String(a.codigo||'').toUpperCase(),a.id));
        const salaIds=new Map();
        shared.data.salas.forEach(s=>salaIds.set(shared.normalizarEncabezadoGestor(s.nombre),s.id));
        propuesta.asignaturas.forEach(a=>{
            const nombreSala=String(a.salaPreferidaNombre||'').trim().toUpperCase();
            if(!nombreSala) return;
            const key=shared.normalizarEncabezadoGestor(nombreSala);
            if(salaIds.has(key)) return;
            const id=shared.genId();
            shared.data.salas.push({
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
                id=shared.genId();
                shared.data.asignaturas.push({
                    id,
                    codigo:a.codigo,
                    nombre:a.nombre,
                    horasTotales:Number(a.horasTotales)||0,
                    horasVirtuales:Number(a.horasVirtuales)||0,
                    horasPresenciales:Number(a.horasPresenciales)||Math.max(0,(Number(a.horasTotales)||0)-(Number(a.horasVirtuales)||0)),
                    bloquesPresenciales:Number(a.bloquesPresenciales)||0,
                    bloquesVirtuales:Number(a.bloquesVirtuales)||0,
                    salasPreferidas:a.salaPreferidaNombre&&salaIds.has(shared.normalizarEncabezadoGestor(a.salaPreferidaNombre))?[salaIds.get(shared.normalizarEncabezadoGestor(a.salaPreferidaNombre))]:[],
                    color:shared.colorAsignaturaPlanhor(a)||cols[idx%cols.length]||shared.PLANHOR_COLORES[0],
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
                const actual=shared.data.asignaturas.find(x=>x.id===id);
                const salaId=a.salaPreferidaNombre?salaIds.get(shared.normalizarEncabezadoGestor(a.salaPreferidaNombre)):null;
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
            const nivelId=carreraId?nivelIds.get(`${carreraId}|${shared.normalizarEncabezadoGestor(nivelNombre)}`):null;
            if(!asignaturaId||!carreraId||!nivelId){ resumen.omitidos++; resumen.detalle.omitidos.push(`Relación ${rel.codigoAsignatura} · ${rel.carreraKey} · ${nivelNombre}: incompleta`); return; }
            const existe=shared.data.asignaturaCarreraNivel.some(r=>r.asignaturaId===asignaturaId&&r.carreraId===carreraId&&r.nivelId===nivelId);
            if(!existe){
                shared.data.asignaturaCarreraNivel.push({asignaturaId,carreraId,nivelId});
                resumen.relaciones++;
                resumen.detalle.relaciones.push(`${rel.codigoAsignatura} · ${rel.carreraKey} · ${nivelNombre}`);
            }
        });
        if(!Array.isArray(shared.data.asignaturaSeccion)) shared.data.asignaturaSeccion=[];
        propuesta.seccionAsignaturas?.forEach(rel=>{
            const asignaturaId=asignaturaIds.get(String(rel.codigoAsignatura||'').toUpperCase());
            const seccionId=seccionIds.get(shared.normalizarEncabezadoGestor(rel.seccion));
            if(!asignaturaId||!seccionId){ resumen.omitidos++; resumen.detalle.omitidos.push(`Relación sección ${rel.codigoAsignatura} · ${rel.seccion}: incompleta`); return; }
            const existe=shared.data.asignaturaSeccion.some(r=>r.asignaturaId===asignaturaId&&r.seccionId===seccionId);
            if(!existe){
                shared.data.asignaturaSeccion.push({asignaturaId,seccionId,origen:rel.origen||'gestor',idGestor:rel.idGestor||'',marcaGestor:rel.marcaGestor||''});
                resumen.relacionesSeccion++;
                resumen.detalle.relacionesSeccion.push(`${rel.codigoAsignatura} · ${rel.seccion}${String(rel.origen||'').startsWith('gestor-inferido')?' (inferida desde Fusionada)':''}`);
            }else{
                const actual=shared.data.asignaturaSeccion.find(r=>r.asignaturaId===asignaturaId&&r.seccionId===seccionId);
                if(actual){
                    if(rel.idGestor&&!actual.idGestor) actual.idGestor=rel.idGestor;
                    if(rel.marcaGestor) actual.marcaGestor=rel.marcaGestor;
                    if(rel.origen&&String(rel.origen).includes('externa')) actual.origen=rel.origen;
                }
            }
        });

        propuesta.grupos.forEach(g=>{
            const asignaturaId=asignaturaIds.get(String(g.codigoAsignatura||'').toUpperCase());
            const madreId=seccionIds.get(shared.normalizarEncabezadoGestor(g.planificada?.seccion));
            if(!asignaturaId||!madreId){ resumen.omitidos++; resumen.detalle.omitidos.push(`Grupo ${g.codigoAsignatura}: sin asignatura o sección madre`); return; }
            const alumnosBase=Number(g.planificada?.alumnos)||0;
            const alumnosVinculados=g.fusionadas.reduce((acc,f)=>acc+(Number(f.alumnos)||0),0);
            const alumnosTotalesCalculados=alumnosBase+alumnosVinculados;
            let grupo=(shared.data.gruposDictacion||[]).find(x=>x.idGestorSeccion&&String(x.idGestorSeccion)===String(g.idGestorSeccion))||shared.getGrupoDictacionAsignaturaSeccion(asignaturaId,madreId);
            if(!grupo){
                grupo=shared.crearGrupoDictacion({
                    asignaturaId,
                    seccionMadreId:madreId,
                    seccionesVinculadasIds:[],
                    idGestorSeccion:g.idGestorSeccion,
                    alumnosBase,
                    alumnosVinculados,
                    alumnosTotales:alumnosTotalesCalculados,
                    origen:'gestor',
                    estado:'pendiente'
                });
                if(grupo){
                    resumen.grupos++;
                    resumen.detalle.grupos.push(`${g.codigoAsignatura} · madre ${g.planificada?.seccion||''}`);
                }
            }
            if(!grupo){ resumen.omitidos++; resumen.detalle.omitidos.push(`Grupo ${g.codigoAsignatura}: no se pudo crear`); return; }
            grupo.asignaturaId=asignaturaId;
            grupo.seccionMadreId=madreId;
            grupo.idGestorSeccion=g.idGestorSeccion;
            grupo.marcaGestor=g.planificada?.marcaGestor||grupo.marcaGestor||'';
            grupo.origen='gestor';
            grupo.estado=grupo.estado||'pendiente';
            grupo.alumnosBaseGestor=alumnosBase;
            grupo.alumnosVinculadosGestor=alumnosVinculados;
            grupo.alumnosTotalesGestor=alumnosTotalesCalculados;
            if(!grupo.alumnosManualActivo){
                grupo.alumnosBase=alumnosBase;
                grupo.alumnosVinculados=alumnosVinculados;
                grupo.alumnosTotales=alumnosTotalesCalculados;
            }
            grupo.seccionesVinculadasIds=(grupo.seccionesVinculadasIds||[]).filter(secId=>secId!==madreId);
            grupo.actualizadoEn=new Date().toISOString();
            g.fusionadas.forEach(f=>{
                const secId=seccionIds.get(shared.normalizarEncabezadoGestor(f.seccion));
                if(!secId||secId===madreId){ resumen.omitidos++; resumen.detalle.omitidos.push(`Vínculo ${g.codigoAsignatura} · ${f.seccion}: inválido`); return; }
                const antes=grupo.seccionesVinculadasIds.length;
                shared.vincularSeccionAGrupo(grupo.id,secId,{alumnos:f.alumnos});
                if(grupo.seccionesVinculadasIds.length>antes){
                    resumen.vinculos++;
                    resumen.detalle.vinculos.push(`${g.codigoAsignatura}: ${f.seccion} heredada desde ${g.planificada?.seccion||''}`);
                }
            });
        });
        return resumen;
    }

function mostrarResultadoAplicacionGestor(resumen){
        const cards=Object.entries(resumen).filter(([k])=>k!=='detalle').map(([k,v])=>`<div><span>${shared.escapeHTML(k)}</span><strong>${v}</strong></div>`).join('');
        const detalle=resumen.detalle||{};
        const detalleHtml=Object.entries(detalle)
            .filter(([,items])=>Array.isArray(items)&&items.length)
            .map(([k,items])=>`
                <div class="dashboard-detail-table" style="margin-top:10px;">
                    <div class="form-label">${shared.escapeHTML(k)} (${items.length})</div>
                    <table class="report-table"><tbody>${items.slice(0,8).map(x=>`<tr><td>${shared.escapeHTML(x)}</td></tr>`).join('')}</tbody></table>
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
        const cerrar=()=>shared.cerrarModal();
        document.getElementById('btnCerrarResultadoGestor').onclick=cerrar;
        document.getElementById('modalOverlay').onclick=(e)=>{ if(e.target===e.currentTarget) cerrar(); };
        document.getElementById('btnVerHistorialGestor').onclick=()=>{
            cerrar();
            shared.activarTab('historial');
        };
        document.getElementById('btnVerFusionesGestor').onclick=()=>{
            cerrar();
            if(shared.activarTab('reportes')!==false){
                const sel=document.getElementById('reporteTipo');
                if(sel){ sel.value='gruposDictacion'; shared.actualizarReporte(); }
            }
        };
    }

function mostrarPreviewGestorSecciones(analisis,nombreArchivo){
        const resumen=Object.entries(analisis.resumen).map(([k,v])=>`<div><span>${shared.escapeHTML(k)}</span><strong>${v}</strong></div>`).join('');
        const colsDetectadas=Object.entries(analisis.cols).map(([k,idx])=>`<span class="item-chip">${shared.escapeHTML(k)}: ${shared.escapeHTML(analisis.headers[idx]||'')}</span>`).join('');
        const propuesta=analisis.propuesta||{carreras:[],niveles:[],secciones:[],asignaturas:[],relaciones:[],seccionAsignaturas:[],grupos:[]};
        const revision=shared.validarPropuestaGestor(propuesta);
        const opcionesFiltro=shared.opcionesFiltroGestor(analisis.registros||[]);
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
                            <label><input type="checkbox" class="gestor-filter-area-check" data-area-idx="${idx}" checked> ${shared.escapeHTML(area.area)} <small>${area.carreras.length} carrera(s) · ${area.filas} fila(s)</small></label>
                            <div class="gestor-filter-careers">
                                ${area.carreras.map(c=>`
                                    <label>
                                        <input type="checkbox" class="gestor-filter-career-check" data-area-idx="${idx}" value="${shared.escapeAttr(c.carreraKey)}" checked>
                                        <span>${shared.escapeHTML(c.nombre)} <small>${shared.escapeHTML(c.codigo||c.carreraKey)} · ${c.secciones} sección(es) · ${c.asignaturas} asignatura(s)</small></span>
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
        ].map(([label,val,total])=>`<div><span>${shared.escapeHTML(label)}</span><strong>${val}${total!==val?`/${total}`:''}</strong></div>`).join('');
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
        ].map(([label,val])=>`<div><span>${shared.escapeHTML(label)}</span><strong>${val}</strong></div>`).join('');
        const revisionHtml=revision.issues.length
            ? `<div class="dashboard-validation-list">${revision.issues.slice(0,10).map(i=>`<div class="dashboard-validation-item ${i.sev==='critico'?'danger':i.sev==='advertencia'?'warning':'info'}"><span>${shared.escapeHTML(i.sev==='critico'?'Crítico':i.sev==='advertencia'?'Advertencia':'Revisión')}</span><strong>${shared.escapeHTML(i.titulo)}</strong><em>${shared.escapeHTML(i.detalle)}</em></div>`).join('')}</div>${revision.issues.length>10?`<p class="auto-plan-empty">Se muestran 10 de ${revision.issues.length} señales.</p>`:''}`
            : '<p class="auto-plan-empty">No se detectaron choques relevantes con los datos actuales. La propuesta queda lista para preparar aplicación controlada.</p>';
        const muestrasGrupos=propuesta.grupos.slice(0,8).map(g=>`
            <tr>
                <td>${shared.escapeHTML(g.idGestorSeccion||'')}</td>
                <td>${shared.escapeHTML(g.codigoAsignatura)}</td>
                <td>${shared.escapeHTML([g.planificada?.seccion,g.planificada?.carreraKey,(g.planificada?.nivelKey||'').split('|')[1]].filter(Boolean).join(' · '))}</td>
                <td>${shared.escapeHTML(g.fusionadas.map(f=>[f.seccion,f.carreraKey,(f.nivelKey||'').split('|')[1]].filter(Boolean).join(' · ')).join(' | '))}</td>
                <td>${g.fusionadas.length}</td>
                <td>${(Number(g.planificada?.alumnos)||0)+g.fusionadas.reduce((acc,f)=>acc+(Number(f.alumnos)||0),0)}</td>
            </tr>
        `).join('');
        const muestrasAsignaturas=propuesta.asignaturas.slice(0,8).map(a=>`
            <tr>
                <td>${shared.escapeHTML(a.existe?'Existe':'Nueva')}</td>
                <td>${shared.escapeHTML(a.codigo)}</td>
                <td>${shared.escapeHTML(a.nombre)}</td>
                <td>${shared.escapeHTML(a.modalidad)}</td>
                <td>${a.horasTotales}/${a.horasPresenciales}/${a.horasVirtuales}</td>
            </tr>
        `).join('');
        const muestras=analisis.registros.slice(0,8).map(r=>`
            <tr>
                <td>${shared.escapeHTML(r.programaCarrera)}</td>
                <td>${shared.escapeHTML(r.jornada)}</td>
                <td>${shared.escapeHTML(r.nivel)}</td>
                <td>${shared.escapeHTML(r.seccion)}</td>
                <td>${shared.escapeHTML(r.codigoAsignatura)}</td>
                <td>${shared.escapeHTML(r.asignatura)}</td>
                <td>${shared.escapeHTML(r.tipo)}</td>
                <td>${r.horas}/${r.horasPresenciales}/${r.horasVirtuales}</td>
            </tr>
        `).join('');
        const alertas=analisis.advertencias.length
            ? `<div class="dashboard-validation-list">${analisis.advertencias.map(a=>`<div class="dashboard-validation-item ${analisis.faltantes.length?'danger':'warning'}"><span>Revisión</span><strong>Gestor Secciones</strong><em>${shared.escapeHTML(a)}</em></div>`).join('')}</div>`
            : '<p class="auto-plan-empty">La estructura mínima se detectó correctamente. Esta vista aún no modifica datos.</p>';
        document.getElementById('modalContainer').innerHTML=`
            <div class="modal-overlay" id="modalOverlay"><div class="modal auto-general-modal">
                <div class="modal-header">
                    <h3>Vista previa Gestor Secciones</h3>
                    <p>Archivo: <strong>${shared.escapeHTML(nombreArchivo)}</strong>. Fase 4.4 permite aplicar la propuesta de forma controlada: crea faltantes, sin borrar ni sobreescribir diferencias.</p>
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
                        <thead><tr><th>Programa</th><th>Jornada</th><th>Nivel</th><th>Sección</th><th>Código</th><th>Asignatura</th><th>Tipo</th><th>H/P/V</th></tr></thead>
                        <tbody>${muestras||'<tr><td colspan="8">Sin filas para mostrar</td></tr>'}</tbody>
                    </table>
                </div>
                <div class="modal-actions">
                    <button class="btn" id="btnCerrarPreviewGestor">Cerrar</button>
                    <button class="btn btn-primary" id="btnAplicarPreviewGestor" ${analisis.faltantes.length?'disabled':''}>Aplicar propuesta</button>
                </div>
            </div></div>`;
        const cerrar=()=>shared.cerrarModal();
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
        document.getElementById('btnAplicarPreviewGestor')?.addEventListener('click',async()=>{
            const filtro=leerFiltroPreview();
            const preparado=shared.prepararRegistrosAplicacionGestor(analisis.registros||[],filtro);
            const registrosAplicar=preparado.seleccionados;
            if(!registrosAplicar.length){
                shared.toast('Selecciona al menos una carrera para aplicar el Gestor','error');
                return;
            }
            const propuestaAplicar=shared.normalizarPropuestaGestor(registrosAplicar,{permitirMadreInferida:false});
            const revisionAplicar=shared.validarPropuestaGestor(propuestaAplicar);
            if(revisionAplicar.conteo.criticos||analisis.faltantes.length){
                shared.toast('Corrige las señales críticas antes de aplicar','error');
                return;
            }
            const ok=await shared.confirmarAccionCritica({
                titulo:'Aplicar Gestor Secciones',
                mensaje:'Se crearán elementos faltantes desde el archivo revisado.',
                queHara:`Aplicará ${registrosAplicar.length} de ${analisis.registros.length} fila(s) seleccionadas.`,
                afectara:`Carreras ${revisionAplicar.conteo.crearCarreras}, niveles ${revisionAplicar.conteo.crearNiveles}, secciones ${revisionAplicar.conteo.crearSecciones}, asignaturas ${revisionAplicar.conteo.crearAsignaturas}, relaciones ${revisionAplicar.conteo.crearRelaciones} y grupos ${revisionAplicar.conteo.crearGrupos}.`,
                noTocara:'No borrará datos existentes ni sobreescribirá diferencias manuales.',
                seguridad:`Guardará memoria de trazabilidad e incluirá ${preparado.externos} fila(s) externa(s) para revisar herencias por ID.`,
                confirmarTexto:'Aplicar Gestor',
                peligro:true
            });
            if(!ok) return;
            shared.guardarRespaldoAntesDeImportar();
            shared.crearPuntoRecuperacion('antes_importar_gestor_secciones');
            shared.pushUndo();
            const analisisMemoria=Object.assign({},analisis,{
                registros:preparado.memoria,
                resumen:Object.assign({},analisis.resumen,{filasOriginales:analisis.registros.length,filasMemoria:preparado.memoria.length,filasSeleccionadas:registrosAplicar.length})
            });
            shared.guardarMemoriaGestor(analisisMemoria,nombreArchivo,{carrerasSeleccionadas:filtro.carreras});
            const resultado=shared.aplicarPropuestaGestor(propuestaAplicar);
            shared.auditoria('gestor_secciones_importado',{
                archivo:nombreArchivo,
                resumen:Object.fromEntries(Object.entries(resultado).filter(([k])=>k!=='detalle')),
                detalle:Object.fromEntries(Object.entries(resultado.detalle||{}).map(([k,v])=>[k,(v||[]).slice(0,20)])),
                filas:analisis.registros.length,
                filasAplicadas:registrosAplicar.length,
                filasMemoria:preparado.memoria.length,
                carrerasFiltro:filtro.carreras
            });
            shared.normalizarDatos();
            shared.reconstruirIndices();
            shared.guardar({forzar:true});
            shared.refrescarTodo();
            shared.mostrarResultadoAplicacionGestor(resultado);
            shared.toast('Gestor Secciones aplicado','success');
        });
        document.getElementById('modalOverlay').onclick=(e)=>{ if(e.target===e.currentTarget) cerrar(); };
    }

async function previsualizarGestorSecciones(){
        if(!window.XLSX?.read || !window.XLSX?.utils?.sheet_to_json){
            if(!(await shared.asegurarXLSX()) || !window.XLSX?.read || !window.XLSX?.utils?.sheet_to_json) return;
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
                    const analisis=shared.analizarGestorSecciones(aoa);
                    shared.mostrarPreviewGestorSecciones(analisis,file.name);
                }catch(err){
                    shared.toast('No se pudo leer el Gestor Secciones','error');
                }finally{
                    input.value='';
                    input.remove();
                }
            };
            reader.onerror=()=>{
                shared.toast('No se pudo leer el archivo','error');
                input.value='';
                input.remove();
            };
            reader.readAsArrayBuffer(file);
        };
        input.oncancel=()=>input.remove();
        document.body.appendChild(input);
        input.click();
    }

async function aplicarUltimoGestorDesdePestana(){
        shared.data.gestorSecciones=shared.normalizarGestorSeccionesData(shared.data.gestorSecciones);
        const cargas=shared.data.gestorSecciones.cargas||[];
        const ultima=cargas.find(c=>c.id===shared.data.gestorSecciones.ultimaCargaId)||cargas[0]||null;
        if(!ultima) return shared.toast('Carga un Gestor antes de aplicar una propuesta','info');
        const registros=(shared.data.gestorSecciones.filas||[]).filter(f=>f.cargaId===ultima.id);
        if(!registros.length) return shared.toast('La última carga no tiene filas disponibles para aplicar','error');
        const filtroGuardado=shared.data.gestorSecciones.filtroAplicacion?.cargaId===ultima.id?shared.data.gestorSecciones.filtroAplicacion:null;
        const registrosAplicar=filtroGuardado?.carreras?.length?shared.filtrarRegistrosGestor(registros,filtroGuardado):registros;
        if(!registrosAplicar.length) return shared.toast('El filtro guardado no contiene filas aplicables. Vuelve a cargar el Gestor y selecciona carreras.','error');
        const propuesta=shared.normalizarPropuestaGestor(registrosAplicar,{permitirMadreInferida:false});
        const revision=shared.validarPropuestaGestor(propuesta);
        if(revision.conteo.criticos){
            return shared.toast(`No se puede aplicar: hay ${revision.conteo.criticos} señal(es) crítica(s) en la propuesta`, 'error');
        }
        const ok=await shared.confirmarAccionCritica({
            titulo:'Aplicar última carga',
            mensaje:`Se aplicará la última carga del Gestor: ${ultima.archivo||'sin nombre'}.`,
            queHara:`Aplicará ${registrosAplicar.length} de ${registros.length} fila(s) disponibles.`,
            afectara:`Carreras ${revision.conteo.crearCarreras}, niveles ${revision.conteo.crearNiveles}, secciones ${revision.conteo.crearSecciones}, asignaturas ${revision.conteo.crearAsignaturas}, relaciones ${revision.conteo.crearRelaciones} y grupos ${revision.conteo.crearGrupos}.`,
            noTocara:'No borrará datos existentes ni sobreescribirá diferencias manuales.',
            seguridad:'Creará punto de recuperación antes de aplicar.',
            confirmarTexto:'Aplicar carga',
            peligro:true
        });
        if(!ok) return;
        shared.guardarRespaldoAntesDeImportar();
        shared.crearPuntoRecuperacion('antes_aplicar_gestor_secciones');
        shared.pushUndo();
        const resultado=shared.aplicarPropuestaGestor(propuesta);
        shared.auditoria('gestor_secciones_aplicado_desde_pestana',{
            archivo:ultima.archivo||'',
            resumen:Object.fromEntries(Object.entries(resultado).filter(([k])=>k!=='detalle')),
            filas:registros.length,
            filasAplicadas:registrosAplicar.length,
            carrerasFiltro:filtroGuardado?.carreras||[]
        });
        shared.normalizarDatos();
        shared.reconstruirIndices();
        shared.guardar({forzar:true});
        shared.refrescarTodo();
        shared.mostrarResultadoAplicacionGestor(resultado);
        shared.toast('Gestor Secciones aplicado','success');
    }
        return {normalizarEncabezadoGestor, textoGestor, numeroGestor, codigoCarreraGestor, nombreCarreraGestor, planCarreraGestor, nombreCarreraConPlanGestor, nivelGestor, jornadaGestor, modalidadAsignaturaGestor, areaAsignaturaGestor, especialidadGestor, sincronizarEspecialidadesDesdeGestor, tipoEspacioDesdeTexto, parsearSalaReferenciaGestor, familiaProgramaGestor, recalcularAreasAsignaturasDesdeGestor, esSeccionFusionLiteral, esSeccionRealGestor, seccionBaseSinMarcaGestor, marcaSeccionGestor, tieneMarcaFusionGestor, tipoFilaGestor, normalizarGestorSeccionesData, detectarColumnasGestor, leerFilaGestor, descriptorCarreraRegistroGestor, opcionesFiltroGestor, filtrarRegistrosGestor, prepararRegistrosAplicacionGestor, filtroCompletoGestor, analizarGestorSecciones, normalizarPropuestaGestor, validarPropuestaGestor, construirMemoriaIdsGestor, guardarMemoriaGestor, renderTablaGestorSecciones, seccionPorNombreGestor, asignaturaPorCodigoGestor, keyEnlaceManualGestor, enlacesManualGestorPorId, getEnlaceManualGestor, estadoVisualGestor, descripcionEnlaceManualGestor, descripcionMemoriaAplicadaGestor, datosInformeGestor, filasInformeRelacionesGestor, matrizInformeGestor, formatearHojaInformeGestor, nombreHojaGestor, exportarInformeGestor, renderBuscadorIdGestor, etiquetaEstadoGestor, renderRelacionesGestor, renderPendientesGestor, salaPorReferenciaGestor, cupoPedagogicoGestor, analizarFilaProyeccionGestor, obtenerProyeccionGestor, claseRiesgoProyeccion, renderProyeccionGestor, abrirRelacionManualGestor, renderGestorSecciones, aplicarPropuestaGestor, mostrarResultadoAplicacionGestor, mostrarPreviewGestorSecciones, previsualizarGestorSecciones, aplicarUltimoGestorDesdePestana};
    }};
})();
