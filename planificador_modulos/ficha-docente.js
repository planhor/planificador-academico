(function(){
    function createFichaDocente(ctx){
        const getData = ctx.getData;
        const BLOQUE_HORAS_SEMESTRALES = 18;
        const MARGEN_OPERATIVO_DOCENTE = 0.15;
        const MAX_DIARIO_DOCENTE_DEFENDIBLE = 13;

        function formatoNumero(n, dec=1){
            const num=Number(n)||0;
            return num.toLocaleString('es-CL',{maximumFractionDigits:dec,minimumFractionDigits:num%1?dec:0});
        }

        function lecturaBloques(bloques, base=null){
            const b=Number(bloques)||0;
            const horas=b*BLOQUE_HORAS_SEMESTRALES;
            const pct=base ? ` · ${formatoNumero(b/base*100,1)}%` : '';
            return `${formatoNumero(b,1)} bloque(s) (${formatoNumero(horas,0)} h${pct})`;
        }

        function lecturaHoras(horas, baseHoras=null){
            const h=Number(horas)||0;
            const bloques=h/BLOQUE_HORAS_SEMESTRALES;
            const pct=baseHoras ? ` · ${formatoNumero(h/baseHoras*100,1)}%` : '';
            return `${formatoNumero(h,0)} h (${formatoNumero(bloques,1)} bloque(s)${pct})`;
        }

        function bloquesDesdeHorasExternas(horas){
            const h=Number(horas)||0;
            return h>0?Math.max(1,Math.round(h/BLOQUE_HORAS_SEMESTRALES)):0;
        }

        function horasPresencialesCarga(carga){
            if(Number(carga?.horasPresenciales)>0) return Number(carga.horasPresenciales);
            return (Number(carga?.bloquesPresenciales)||0)*BLOQUE_HORAS_SEMESTRALES;
        }

        function horasVirtualesCarga(carga){
            if(Number(carga?.horasVirtuales)>0) return Number(carga.horasVirtuales);
            return (Number(carga?.bloquesVirtuales)||0)*BLOQUE_HORAS_SEMESTRALES;
        }

        function lecturaDiferenciaHomologo(resumen){
            if(!resumen?.homologoHoras) return 'Sin homólogo';
            const diffHoras=(Number(resumen.horasActuales)||0)-Number(resumen.homologoHoras);
            const diffBloques=diffHoras/BLOQUE_HORAS_SEMESTRALES;
            const pct=diffHoras/resumen.homologoHoras*100;
            const signo=diffHoras>0?'+':'';
            return `${signo}${formatoNumero(pct,1)}% (${signo}${formatoNumero(diffHoras,0)} h · ${signo}${formatoNumero(diffBloques,1)} bloque(s))`;
        }

        function lecturaSabadoResumen(disp){
            const total=Number(disp?.total)||0;
            const sabado=Number(disp?.sabado)||0;
            const sinSabado=Number(disp?.sinSabado)||0;
            const pctSabado=total?sabado/total*100:0;
            return `${formatoNumero(sinSabado,1)} sin sábado / ${formatoNumero(sabado,1)} sábado (${formatoNumero(pctSabado,1)}%)`;
        }

        function contarDisponibilidadDocente(doc){
            const disp=Array.isArray(doc?.disponibilidad)?doc.disponibilidad:[];
            const porDia=ctx.DIAS.map((_,dia)=>(Array.isArray(disp[dia])?disp[dia]:[]).filter(Boolean).length);
            const total=porDia.reduce((a,b)=>a+b,0);
            const sabado=porDia[5]||0;
            const sinSabado=total-sabado;
            const diurno=porDia.reduce((acc,_,dia)=>{
                const fila=Array.isArray(disp[dia])?disp[dia]:[];
                return acc+fila.slice(0,12).filter(Boolean).length;
            },0);
            const vespertino=porDia.reduce((acc,_,dia)=>{
                const fila=Array.isArray(disp[dia])?disp[dia]:[];
                return acc+fila.slice(12).filter(Boolean).length;
            },0);
            const utilizablePorDia=porDia.map(cant=>Math.min(Number(cant)||0,MAX_DIARIO_DOCENTE_DEFENDIBLE));
            const utilizableTotal=utilizablePorDia.reduce((a,b)=>a+b,0);
            const utilizableSinSabado=utilizableTotal-Math.min(sabado,MAX_DIARIO_DOCENTE_DEFENDIBLE);
            return {porDia,total,sabado,sinSabado,diurno,vespertino,utilizableTotal,utilizableSinSabado};
        }

        function estadoCargaDefendible(capacidadHoras, homologoHoras, cargaHoras){
            if(!homologoHoras) return 'Sin homólogo';
            const ratio=capacidadHoras/homologoHoras;
            const cargaRatio=cargaHoras/homologoHoras;
            if(cargaRatio>ratio+0.1) return 'Revisar carga';
            if(ratio>=0.9) return 'Compatible';
            if(ratio>=0.7) return 'Reducción parcial';
            return 'Reducción justificada';
        }

        function calcularResumenDefendible(doc, data){
            const disp=contarDisponibilidadDocente(doc);
            const bloquesExternos=cargasExternasDocente(data,doc.id).reduce((acc,c)=>acc+bloquesTotalesCargaExterna(c),0);
            const bloquesPlanificados=(ctx.getPlanificaciones?.()||data.planificaciones||[]).filter(p=>p.docenteId===doc.id).length+bloquesExternos;
            const horasActuales=bloquesPlanificados*BLOQUE_HORAS_SEMESTRALES;
            const homologoHoras=Number(doc.horasHomologo)||0;
            const homologoBloques=homologoHoras/BLOQUE_HORAS_SEMESTRALES;
            const capacidadBloques=Math.max(0,disp.utilizableSinSabado*(1-MARGEN_OPERATIVO_DOCENTE));
            const capacidadHoras=capacidadBloques*BLOQUE_HORAS_SEMESTRALES;
            return {
                disp,
                bloquesPlanificados,
                horasActuales,
                homologoHoras,
                homologoBloques,
                capacidadBloques,
                capacidadHoras,
                estado:estadoCargaDefendible(capacidadHoras,homologoHoras,horasActuales)
            };
        }

        function abrirCargaDefendibleEnReportes(doc){
            if(ctx.activarTab && ctx.activarTab('reportes')===false) return;
            const tipo=document.getElementById('reporteTipo');
            const busqueda=document.getElementById('reporteBusqueda');
            if(tipo) tipo.value='cargaDefendible';
            if(busqueda) busqueda.value=[doc.nombre,doc.apellido].filter(Boolean).join(' ');
            if(ctx.actualizarReporte) ctx.actualizarReporte();
        }

        function cargasExternasDocente(data,docId){
            return (Array.isArray(data.cargasExternasDocente)?data.cargasExternasDocente:[]).filter(c=>c.docenteId===docId);
        }

        function bloquesTotalesCargaExterna(carga){
            const requeridos=bloquesDesdeHorasExternas(horasPresencialesCarga(carga))+bloquesDesdeHorasExternas(horasVirtualesCarga(carga));
            const marcados=Array.isArray(carga.bloques)?carga.bloques.length:0;
            return requeridos||marcados;
        }

        function planesFichaCargasExternas(cargas){
            return cargas.flatMap(carga=>(Array.isArray(carga.bloques)?carga.bloques:[]).map(b=>({
                id:`carga_docente_${carga.id}_${b.dia}_${b.bloque}`,
                docenteId:carga.docenteId,
                seccionId:'',
                asignaturaId:`__carga_docente_${carga.id}`,
                salaId:b.tipoPresencial===false?ctx.SALA_VIRTUAL_ID:b.salaId,
                dia:Number(b.dia),
                bloque:Number(b.bloque),
                tipoPresencial:b.tipoPresencial!==false,
                esCargaDocentePura:true,
                codigoExterno:carga.codigo,
                nombreExterno:carga.nombre,
                origenCargaExterna:carga.origen,
                estadoCargaExterna:carga.estado,
                observacionExterna:carga.observacion,
                cargaDocenteId:carga.id
            })));
        }

        function resumenPlanOcupado(plan,data){
            if(plan?.esCargaDocentePura || esPlanExternoFicha(plan,data)){
                return {
                    codigo:plan.codigoExterno||'EXT',
                    detalle:plan.esCargaDocentePura?'Carga externa docente':(plan.origenCargaExterna||'Carga externa'),
                    titulo:[plan.codigoExterno||'EXT',plan.nombreExterno||'Carga externa'].filter(Boolean).join(' - ')
                };
            }
            const asig=data.asignaturas.find(a=>a.id===plan?.asignaturaId);
            const sec=data.secciones.find(s=>s.id===plan?.seccionId);
            return {
                codigo:asig?.codigo||'?',
                detalle:sec?.nombre||'Sin sección',
                titulo:[asig?.codigo,asig?.nombre,sec?.nombre].filter(Boolean).join(' · ')
            };
        }

        function esPlanExternoFicha(plan,data=getData()){
            if(!plan) return false;
            if(plan.esCargaExterna||plan.esCargaDocentePura) return true;
            const asignaturaId=String(plan.asignaturaId||'');
            if(asignaturaId.startsWith('__externa_')||asignaturaId.startsWith('__carga_externa_')) return true;
            const asig=(data.asignaturas||[]).find(a=>a.id===plan.asignaturaId);
            const codigoExterno=String(plan.codigoExterno||'').trim();
            const nombreExterno=String(plan.nombreExterno||'').trim();
            const origenExterno=String(plan.origenCargaExterna||plan.estadoCargaExterna||plan.estadoGestionExterna||'').trim();
            const marcaExt=/^\s*EXT\s*[·-]/i;
            if(marcaExt.test(codigoExterno)||marcaExt.test(nombreExterno)||marcaExt.test(asig?.codigo||'')||marcaExt.test(asig?.nombre||'')) return true;
            const tieneDatoExternoReal=(codigoExterno&&codigoExterno!=='EXT')||(nombreExterno&&nombreExterno!=='Carga externa')||!!origenExterno;
            return tieneDatoExternoReal || (!asig && !!(codigoExterno||nombreExterno));
        }

        function validarSlotCargaExternaDocente({doc,dia,bloque,planesOcupados,seleccionados=[]}){
            const data=getData();
            const maxSabado=Number(data.configuracion?.sabadoHastaBloque)||18;
            const maxDiario=Number(data.configuracion?.bloquesDiariosMax)||13;
            const maxSemestral=Number(data.configuracion?.bloquesSemestralesMax)||Infinity;
            const descansoHoras=Number(data.configuracion?.horasDescanso)||0;
            if(dia===5 && bloque>maxSabado) return {ok:false,msg:`Sábado permitido solo hasta B${maxSabado}`};
            if(doc.id!==ctx.DOCENTE_NN_ID){
                if(!doc.disponibilidad?.[dia]?.[bloque-1]) return {ok:false,msg:'El docente no está disponible en ese bloque'};
                if(planesOcupados.some(p=>Number(p.dia)===dia&&Number(p.bloque)===bloque)) return {ok:false,msg:'El docente ya tiene clase en ese bloque'};
                if(!doc.autorizadoExceder && planesOcupados.length+seleccionados.length>=maxSemestral) return {ok:false,msg:'El docente alcanza el máximo semestral'};
                const cargaDia=planesOcupados.filter(p=>Number(p.dia)===dia).length+seleccionados.filter(p=>Number(p.dia)===dia).length;
                if(cargaDia>=maxDiario) return {ok:false,msg:`El docente ya alcanza el máximo diario (${maxDiario} bloques)`};
                if(descansoHoras>0){
                    const bloqueInfo=ctx.getBloque?.(bloque);
                    const planesComparar=[...planesOcupados,...seleccionados];
                    if(bloqueInfo&&dia>0){
                        let maxFin=0;
                        planesComparar.filter(p=>Number(p.dia)===dia-1).forEach(p=>{ const bf=ctx.getBloque?.(p.bloque); if(bf&&bf.hFin>maxFin) maxFin=bf.hFin; });
                        if(maxFin && (24*60-maxFin+bloqueInfo.hIni)<descansoHoras*60) return {ok:false,msg:'No respeta descanso entre días'};
                    }
                    if(bloqueInfo&&dia<((ctx.DIAS||[]).length-1)){
                        let minIni=Infinity;
                        planesComparar.filter(p=>Number(p.dia)===dia+1).forEach(p=>{ const bf=ctx.getBloque?.(p.bloque); if(bf&&bf.hIni<minIni) minIni=bf.hIni; });
                        if(Number.isFinite(minIni) && (24*60-bloqueInfo.hFin+minIni)<descansoHoras*60) return {ok:false,msg:'No respeta descanso entre días'};
                    }
                }
            }
            return {ok:true};
        }

        function abrirModalCargaExternaDocente(cargaId=null){
            const data=getData();
            const docId=document.getElementById('fichaDocente')?.value;
            const doc=data.docentes.find(d=>d.id===docId);
            if(!doc) return ctx.toast('Seleccione un docente para agregar carga externa','info');
            const cargaEditando=(data.cargasExternasDocente||[]).find(c=>c.id===cargaId)||null;
            const salas=(data.salas||[]).filter(s=>!s.esVirtual && s.id!==ctx.SALA_VIRTUAL_ID);
            const etiquetaSalaExterna=s=>{
                if(s.id===ctx.SALA_TRO2_ID) return `${s.nombre} · provisional`;
                const partes=[s.nombre];
                if(s.tipoSala) partes.push(s.tipoSala);
                if(s.capacidad&&!s.ilimitada) partes.push(`cap. ${s.capacidad}`);
                return partes.filter(Boolean).join(' · ');
            };
            const salaOptions=salas.map(s=>ctx.optionHTML(s.id,etiquetaSalaExterna(s),s.id===ctx.SALA_TRO2_ID)).join('');
            const horasPresInicial=horasPresencialesCarga(cargaEditando||{});
            const horasVirtInicial=horasVirtualesCarga(cargaEditando||{});
            const bloquesEditando=Array.isArray(cargaEditando?.bloques)?cargaEditando.bloques:[];
            const keyBloque=(dia,bloque)=>`${Number(dia)}_${Number(bloque)}`;
            const seleccionInicial=new Map(bloquesEditando.map(b=>[keyBloque(b.dia,b.bloque),b]));
            const cargasParaOcupacion=cargasExternasDocente(data,doc.id).filter(c=>c.id!==cargaEditando?.id);
            const planesOcupados=[...(ctx.getPlanificaciones?.()||[]).filter(p=>p.docenteId===doc.id),...planesFichaCargasExternas(cargasParaOcupacion)];
            const cargasExternasOtras=(Array.isArray(data.cargasExternasDocente)?data.cargasExternasDocente:[]).filter(c=>c.id!==cargaEditando?.id);
            const planesSalaOcupada=[...(ctx.getPlanificaciones?.()||[]),...planesFichaCargasExternas(cargasExternasOtras)];
            const disponibilidad=Array.isArray(doc.disponibilidad)?doc.disponibilidad:[];
            const docenteNN=doc.id===ctx.DOCENTE_NN_ID;
            const filas=(ctx.BLOQUES||[]).map(b=>`
                <tr>
                    <th class="external-load-time-col">B${b.n}</th>
                    ${(ctx.DIAS||[]).map((dia,di)=>{
                        const ocupado=planesOcupados.find(p=>Number(p.dia)===di&&Number(p.bloque)===b.n);
                        const seleccionado=seleccionInicial.get(keyBloque(di,b.n));
                        const validacion=validarSlotCargaExternaDocente({doc,dia:di,bloque:b.n,planesOcupados});
                        const disp=validacion.ok || docenteNN;
                        const info=ocupado?resumenPlanOcupado(ocupado,data):null;
                        const tipoSel=seleccionado?(seleccionado.tipoPresencial===false?'virtual':'presencial'):'';
                        const clases=['external-load-slot',ocupado?'occupied':'',!ocupado&&!disp?'unavailable':'',seleccionado?'selected external-load-external':'',tipoSel==='virtual'?'selected-virtual':'',tipoSel==='presencial'?'selected-presencial':''].filter(Boolean).join(' ');
                        const titulo=ocupado?`${dia} B${b.n} · Ocupado: ${info.titulo}`:`${dia} B${b.n}${disp?' · Disponible':` · ${validacion.msg||'No disponible'}`}${tipoSel?` · ${tipoSel==='virtual'?'Virtual':'Presencial'}`:''}`;
                        return `<td><button type="button" class="${clases}" data-dia="${di}" data-bloque="${b.n}" data-disponible="${disp?'1':'0'}" title="${ctx.escapeAttr(titulo)}" ${ocupado?'disabled':''}>${ocupado?`<span>${ctx.escapeHTML(info.codigo)}</span><small>${ctx.escapeHTML(info.detalle)}</small>`:''}</button></td>`;
                    }).join('')}
                </tr>
            `).join('');
            const salaInicial=bloquesEditando.find(b=>b.tipoPresencial!==false&&b.salaId)?.salaId||ctx.SALA_TRO2_ID;
            document.getElementById('modalContainer').innerHTML=`
                <div class="modal-overlay" id="modalOverlay"><div class="modal modal-wide">
                    <div class="modal-header">
                        <h3>${cargaEditando?'Editar carga externa docente':'Carga externa docente'}</h3>
                        <p>Registra horas negociadas que suman al docente sin crear asignaturas ni secciones oficiales.</p>
                    </div>
                    <div class="form-grid">
                        <div class="form-group"><label class="form-label">Docente</label><input class="form-input" value="${ctx.escapeAttr(`${doc.nombre||''} ${doc.apellido||''}`.trim())}" disabled></div>
                        <div class="form-group"><label class="form-label">Código</label><input class="form-input" id="cargaExtCodigo" maxlength="40" placeholder="EXT" value="${ctx.escapeAttr(cargaEditando?.codigo||'')}"></div>
                        <div class="form-group"><label class="form-label">Nombre</label><input class="form-input" id="cargaExtNombre" maxlength="120" placeholder="Asignatura o actividad externa" value="${ctx.escapeAttr(cargaEditando?.nombre||'')}"></div>
                        <div class="form-group"><label class="form-label">Origen</label><input class="form-input" id="cargaExtOrigen" maxlength="100" placeholder="Coordinación / área" value="${ctx.escapeAttr(cargaEditando?.origen||'')}"></div>
                        <div class="form-group"><label class="form-label">Estado</label><select class="form-select" id="cargaExtEstado"><option value="gestion">En gestión</option><option value="acordada">Acordada</option><option value="confirmada">Confirmada</option></select></div>
                        <div class="form-group"><label class="form-label">Horas presenciales</label><input class="form-input" id="cargaExtPres" type="number" min="0" step="18" value="${horasPresInicial||0}"></div>
                        <div class="form-group"><label class="form-label">Horas virtuales</label><input class="form-input" id="cargaExtVirt" type="number" min="0" step="18" value="${horasVirtInicial||0}"></div>
                        <div class="form-group"><label class="form-label">Marcar como</label><select class="form-select" id="cargaExtTipoBloque"><option value="presencial">Presencial</option><option value="virtual">Virtual</option></select></div>
                        <div class="form-group"><label class="form-label">Sala para bloques presenciales</label><select class="form-select" id="cargaExtSala"><option value="">-- Sala --</option>${salaOptions}</select></div>
                    </div>
                    <div class="form-group"><label class="form-label">Observación</label><textarea class="form-input" id="cargaExtObs" maxlength="300" rows="2" placeholder="Acuerdo, coordinación o antecedente relevante">${ctx.escapeHTML(cargaEditando?.observacion||'')}</textarea></div>
                    <div class="external-load-grid-wrap">
                        <div class="external-load-grid-head">
                            <strong>Horario opcional</strong>
                            <span id="cargaExtResumenSeleccion">Seleccionados: 0</span>
                        </div>
                        <table class="external-load-grid">
                            <colgroup><col class="external-load-time-col">${(ctx.DIAS||[]).map(()=>'<col>').join('')}</colgroup>
                            <thead><tr><th class="external-load-time-col"></th>${(ctx.DIAS||[]).map(d=>`<th>${ctx.escapeHTML(d.slice(0,3))}</th>`).join('')}</tr></thead>
                            <tbody>${filas}</tbody>
                        </table>
                        <div class="external-load-legend">
                            <span><i class="available"></i>Disponible</span>
                            <span><i class="unavailable"></i>No disponible</span>
                            <span><i class="occupied"></i>Docente ocupado</span>
                            <span><i class="selected-presencial"></i>Selección presencial</span>
                            <span><i class="selected-virtual"></i>Selección virtual</span>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <div style="margin-right:auto;">${cargaEditando?'<button class="btn btn-danger" id="btnEliminarCargaExtDocente">Eliminar carga</button>':''}</div>
                        <button class="btn" id="btnCancelarCargaExtDocente">Cancelar</button>
                        <button class="btn btn-primary" id="btnGuardarCargaExtDocente">${cargaEditando?'Guardar cambios':'Guardar carga externa'}</button>
                    </div>
                </div></div>`;
            const tipo=document.getElementById('cargaExtTipoBloque');
            const sala=document.getElementById('cargaExtSala');
            const resumen=document.getElementById('cargaExtResumenSeleccion');
            const inputHorasPres=document.getElementById('cargaExtPres');
            const inputHorasVirt=document.getElementById('cargaExtVirt');
            document.getElementById('cargaExtEstado').value=cargaEditando?.estado||'gestion';
            if(salaInicial) sala.value=salaInicial;
            const requeridos=()=>({
                presencial:bloquesDesdeHorasExternas(Number(inputHorasPres?.value)||0),
                virtual:bloquesDesdeHorasExternas(Number(inputHorasVirt?.value)||0)
            });
            const conteoSeleccion=()=>{
                const seleccion=[...document.querySelectorAll('.external-load-slot.selected')];
                return {
                    seleccion,
                    presencial:seleccion.filter(b=>(b.dataset.tipoCarga||'presencial')!=='virtual').length,
                    virtual:seleccion.filter(b=>b.dataset.tipoCarga==='virtual').length
                };
            };
            const actualizarSeleccionVisual=()=>{
                const req=requeridos();
                const conteo=conteoSeleccion();
                document.querySelectorAll('.external-load-slot').forEach(btn=>{
                    const tipoCelda=btn.dataset.tipoCarga||'';
                    btn.classList.toggle('selected-virtual',btn.classList.contains('selected')&&tipoCelda==='virtual');
                    btn.classList.toggle('selected-presencial',btn.classList.contains('selected')&&tipoCelda!=='virtual');
                    btn.classList.toggle('external-load-external',btn.classList.contains('selected'));
                    if(btn.classList.contains('selected')){
                        const dia=(ctx.DIAS||[])[Number(btn.dataset.dia)]||'';
                        btn.title=`${dia} B${btn.dataset.bloque} · ${tipoCelda==='virtual'?'Virtual':'Presencial'}`;
                    }
                });
                if(resumen) resumen.textContent=`Presencial: ${conteo.presencial}/${req.presencial} · Virtual: ${conteo.virtual}/${req.virtual} · Total: ${conteo.seleccion.length}/${req.presencial+req.virtual}`;
            };
            const syncSala=()=>{ sala.disabled=tipo.value==='virtual'; actualizarSeleccionVisual(); };
            document.querySelectorAll('.external-load-slot.selected').forEach(btn=>{
                const inicial=seleccionInicial.get(keyBloque(btn.dataset.dia,btn.dataset.bloque));
                btn.dataset.tipoCarga=inicial?.tipoPresencial===false?'virtual':'presencial';
            });
            tipo.onchange=syncSala; syncSala();
            const abrirMenuSlotCargaExterna=(btn,e)=>{
                if(!btn?.classList?.contains('selected')) return;
                e.preventDefault();
                cerrarMenuFicha();
                const popup=document.createElement('div');
                popup.className='action-popup ficha-context-popup';
                const tipoActual=btn.dataset.tipoCarga==='virtual'?'Virtual':'Presencial';
                popup.innerHTML=`
                    <button id="cargaExtCtxQuitar">Quitar bloque</button>
                    <button id="cargaExtCtxPresencial">Marcar presencial</button>
                    <button id="cargaExtCtxVirtual">Marcar virtual</button>
                    <button id="cargaExtCtxDetalle">Ver detalle</button>
                `;
                posicionarPopupFicha(popup,e);
                popup.querySelector('#cargaExtCtxQuitar').onclick=()=>{
                    btn.classList.remove('selected','selected-presencial','selected-virtual','external-load-external');
                    delete btn.dataset.tipoCarga;
                    cerrarMenuFicha();
                    actualizarSeleccionVisual();
                };
                popup.querySelector('#cargaExtCtxPresencial').onclick=()=>{
                    btn.dataset.tipoCarga='presencial';
                    cerrarMenuFicha();
                    actualizarSeleccionVisual();
                };
                popup.querySelector('#cargaExtCtxVirtual').onclick=()=>{
                    btn.dataset.tipoCarga='virtual';
                    cerrarMenuFicha();
                    actualizarSeleccionVisual();
                };
                popup.querySelector('#cargaExtCtxDetalle').onclick=()=>{
                    const dia=(ctx.DIAS||[])[Number(btn.dataset.dia)]||'?';
                    alert([`Carga externa docente`,`${dia} B${btn.dataset.bloque}`,`Tipo: ${tipoActual}`].join('\n'));
                    cerrarMenuFicha();
                };
            };
            document.querySelectorAll('.external-load-slot').forEach(btn=>{
                btn.addEventListener('contextmenu',e=>abrirMenuSlotCargaExterna(btn,e));
                btn.onclick=()=>{
                    if(btn.disabled) return;
                    if(btn.dataset.disponible!=='1') return ctx.toast(btn.title.split(' · ').pop()||'Bloque no disponible','info');
                    const tipoActual=tipo.value==='virtual'?'virtual':'presencial';
                    const estabaSeleccionado=btn.classList.contains('selected');
                    const mismoTipo=(btn.dataset.tipoCarga||'presencial')===tipoActual;
                    if(estabaSeleccionado&&mismoTipo){
                        btn.classList.remove('selected');
                        delete btn.dataset.tipoCarga;
                    }else{
                        const req=requeridos();
                        const conteo=conteoSeleccion();
                        const cuentaActual=tipoActual==='virtual'?conteo.virtual:conteo.presencial;
                        const maxActual=tipoActual==='virtual'?req.virtual:req.presencial;
                        if(maxActual<=0) return ctx.toast(tipoActual==='virtual'?'No hay horas virtuales requeridas':'No hay horas presenciales requeridas','info');
                        if((!estabaSeleccionado||!mismoTipo) && cuentaActual>=maxActual){
                            return ctx.toast(tipoActual==='virtual'?'Ya se completaron los bloques virtuales':'Ya se completaron los bloques presenciales','info');
                        }
                        const salaActual=sala.value||ctx.SALA_TRO2_ID;
                        if(tipoActual==='presencial'){
                            if(salaActual!==ctx.SALA_VIRTUAL_ID && salaActual!==ctx.SALA_TRO2_ID && planesSalaOcupada.some(p=>p.salaId===salaActual&&Number(p.dia)===Number(btn.dataset.dia)&&Number(p.bloque)===Number(btn.dataset.bloque))){
                                return ctx.toast('La sala ya está ocupada en ese bloque','info');
                            }
                        }
                        const dia=Number(btn.dataset.dia);
                        const seleccionados=[...document.querySelectorAll('.external-load-slot.selected')].filter(b=>b!==btn).map(b=>({dia:Number(b.dataset.dia),bloque:Number(b.dataset.bloque)}));
                        const slot=validarSlotCargaExternaDocente({doc,dia,bloque:Number(btn.dataset.bloque),planesOcupados,seleccionados});
                        if(!slot.ok) return ctx.toast(slot.msg||'Bloque no disponible', 'info');
                        btn.classList.add('selected');
                        btn.dataset.tipoCarga=tipoActual;
                    }
                    actualizarSeleccionVisual();
                };
            });
            inputHorasPres?.addEventListener('input',actualizarSeleccionVisual);
            inputHorasVirt?.addEventListener('input',actualizarSeleccionVisual);
            document.getElementById('btnCancelarCargaExtDocente').onclick=()=>ctx.cerrarModal?.();
            document.getElementById('btnEliminarCargaExtDocente')?.addEventListener('click',()=>{
                ctx.cerrarModal?.();
                eliminarCargaExternaDocente(cargaEditando.id,cargaEditando.docenteId);
            });
            document.getElementById('modalOverlay').onclick=e=>{ if(e.target===e.currentTarget) ctx.cerrarModal?.(); };
            document.getElementById('btnGuardarCargaExtDocente').onclick=()=>{
                const codigo=(document.getElementById('cargaExtCodigo').value||'EXT').trim().toUpperCase();
                const nombre=(document.getElementById('cargaExtNombre').value||'Carga externa').trim();
                const salaId=sala.value||ctx.SALA_TRO2_ID;
                const tipoActivo=tipo.value==='virtual'?'virtual':'presencial';
                const horasPres=Math.max(0,Number(inputHorasPres?.value)||0);
                const horasVirt=Math.max(0,Number(inputHorasVirt?.value)||0);
                const reqPres=bloquesDesdeHorasExternas(horasPres);
                const reqVirt=bloquesDesdeHorasExternas(horasVirt);
                const seleccion=[...document.querySelectorAll('.external-load-slot.selected')].map(b=>{
                    const tipoMarcado=b.dataset.tipoCarga||tipoActivo;
                    return {
                        dia:Number(b.dataset.dia),
                        bloque:Number(b.dataset.bloque),
                        tipoPresencial:tipoMarcado!=='virtual',
                        salaId:tipoMarcado==='virtual'?ctx.SALA_VIRTUAL_ID:salaId
                    };
                });
                const marcadosPres=seleccion.filter(b=>b.tipoPresencial!==false).length;
                const marcadosVirt=seleccion.filter(b=>b.tipoPresencial===false).length;
                if(marcadosPres>reqPres) return ctx.toast('La selección supera los bloques presenciales requeridos','error');
                if(marcadosVirt>reqVirt) return ctx.toast('La selección supera los bloques virtuales requeridos','error');
                if(seleccion.some(b=>b.tipoPresencial!==false && salaId!==ctx.SALA_VIRTUAL_ID && salaId!==ctx.SALA_TRO2_ID && planesSalaOcupada.some(p=>p.salaId===salaId&&Number(p.dia)===b.dia&&Number(p.bloque)===b.bloque))){
                    return ctx.toast('La sala seleccionada tiene bloques ocupados en la selección','error');
                }
                const item={
                    id:cargaEditando?.id||(ctx.genId?ctx.genId():`carga_${Date.now()}`),
                    docenteId:doc.id,
                    codigo,
                    nombre,
                    origen:(document.getElementById('cargaExtOrigen').value||'').trim(),
                    estado:document.getElementById('cargaExtEstado').value||'gestion',
                    observacion:(document.getElementById('cargaExtObs').value||'').trim(),
                    horasPresenciales:horasPres,
                    horasVirtuales:horasVirt,
                    bloquesPresenciales:reqPres,
                    bloquesVirtuales:reqVirt,
                    bloques:seleccion,
                    creadoEn:cargaEditando?.creadoEn||new Date().toISOString(),
                    actualizadoEn:new Date().toISOString()
                };
                if(!bloquesTotalesCargaExterna(item)) return ctx.toast('Ingrese bloques sin horario o marque bloques en la grilla','error');
                data.cargasExternasDocente=data.cargasExternasDocente||[];
                if(cargaEditando){
                    const idx=data.cargasExternasDocente.findIndex(c=>c.id===cargaEditando.id);
                    if(idx>=0) data.cargasExternasDocente[idx]=item;
                }else{
                    data.cargasExternasDocente.push(item);
                }
                ctx.guardar?.();
                ctx.reconstruirIndices?.();
                ctx.cerrarModal?.();
                renderFichaDocente(doc.id);
                ctx.toast(cargaEditando?'Carga externa docente actualizada':'Carga externa docente guardada','success');
            };
        }

        function actualizarFichaDocentes(){
            const data = getData();
            const sel=document.getElementById('fichaDocente');
            if(!sel) return;
            const seleccionado = sel.value;
            const espSelect=document.getElementById('fichaEspFiltro');
            if(espSelect){
                const espSeleccionada=espSelect.value;
                const especialidades=[...new Set(data.docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID).map(d=>d.especialidad).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
                espSelect.innerHTML='<option value="">-- Especialidad --</option><option value="__todas__">Todas</option>'+especialidades.map(e=>ctx.optionHTML(e,e)).join('');
                if(espSeleccionada && (espSeleccionada==='__todas__'||especialidades.includes(espSeleccionada))) espSelect.value=espSeleccionada;
            }
            const espFiltro=document.getElementById('fichaEspFiltro')?.value||'';
            let docs=data.docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID);
            if(espFiltro&&espFiltro!=='__todas__') docs=docs.filter(d=>d.especialidad===espFiltro);
            docs.sort((a,b)=>a.apellido?.localeCompare(b.apellido));
            sel.disabled=!espFiltro;
            sel.innerHTML=espFiltro?'<option value="">-- Seleccionar docente --</option>'+docs.map(d=>ctx.optionHTML(d.id, `${d.apellido}, ${d.nombre}${d.especialidad?` [${d.especialidad}]`:''}`)).join(''):'<option value="">Selecciona una especialidad primero</option>';
            if(seleccionado && docs.some(d=>d.id===seleccionado)) sel.value=seleccionado;
        }

        function renderFichaDocente(docIdForzado=null){
            const data = getData();
            const docId=typeof docIdForzado==='string'&&docIdForzado?docIdForzado:document.getElementById('fichaDocente')?.value;
            const cont=document.getElementById('fichaContenido');
            if(!cont) return;
            if(!docId){ cont.style.display='none'; cont.innerHTML=''; return; }
            const doc=data.docentes.find(d=>d.id===docId);
            if(!doc) return;
            const cargasExternas=cargasExternasDocente(data,docId);
            const p=[...ctx.getPlanificaciones().filter(pl=>pl.docenteId===docId),...planesFichaCargasExternas(cargasExternas)];
            const diasDisponibles=doc.disponibilidad||ctx.DIAS.map(()=>Array(18).fill(false));
            const cargaDefendible=calcularResumenDefendible(doc,data);
            let html='<div style="display:flex;gap:16px;flex-wrap:wrap;">';
            html+='<div style="flex:2;min-width:650px;"><div style="font-size:1.1rem;font-weight:600;margin-bottom:8px;">'+ctx.escapeHTML(doc.nombre)+' '+ctx.escapeHTML(doc.apellido)+(doc.especialidad?' <small style="font-size:0.8rem;color:var(--text-secondary)">['+ctx.escapeHTML(doc.especialidad)+']</small>':'')+'</div>';
            html+='<div class="teacher-defensible-panel">';
            html+='<div class="teacher-defensible-header"><div><strong>Carga defendible</strong><span>Resumen ejecutivo para comparar disponibilidad, homólogo y carga actual.</span></div><div style="display:flex;gap:8px;flex-wrap:wrap;"><button type="button" class="btn btn-sm" id="btnFichaCargaExterna">+ Carga externa</button><button type="button" class="btn btn-sm" id="btnFichaCargaDefendible">Ver detalle</button></div></div>';
            html+='<div class="teacher-defensible-metrics">';
            html+='<div><span>Homólogo anterior</span><strong>'+ctx.escapeHTML(lecturaHoras(cargaDefendible.homologoHoras,cargaDefendible.homologoHoras||null))+'</strong></div>';
            html+='<div><span>Carga actual</span><strong>'+ctx.escapeHTML(lecturaBloques(cargaDefendible.bloquesPlanificados,cargaDefendible.homologoBloques||null))+'</strong></div>';
            html+='<div><span>Capacidad defendible</span><strong>'+ctx.escapeHTML(lecturaBloques(cargaDefendible.capacidadBloques,cargaDefendible.homologoBloques||null))+'</strong></div>';
            html+='<div class="teacher-defensible-state"><span>Estado</span><strong>'+ctx.escapeHTML(cargaDefendible.estado)+'</strong></div>';
            html+='</div>';
            html+='<div class="teacher-defensible-detail">';
            html+='<span>Disponibilidad sábado <strong>'+ctx.escapeHTML(lecturaSabadoResumen(cargaDefendible.disp))+'</strong></span>';
            html+='<span>Diferencia vs homólogo <strong>'+ctx.escapeHTML(lecturaDiferenciaHomologo(cargaDefendible))+'</strong></span>';
            html+='<span>Día <strong>'+ctx.escapeHTML(lecturaBloques(cargaDefendible.disp.diurno,cargaDefendible.disp.total||null))+'</strong></span>';
            html+='<span>Noche <strong>'+ctx.escapeHTML(lecturaBloques(cargaDefendible.disp.vespertino,cargaDefendible.disp.total||null))+'</strong></span>';
            html+='</div></div>';
            html+='<div style="overflow-x:auto;border:1px solid var(--border);border-radius:var(--radius);">';
            html+='<table style="border-collapse:collapse;font-size:0.65rem;width:100%;table-layout:fixed;">';
            html+='<colgroup><col style="width:38px;"><col style="width:62px;">';
            for(let i=0;i<6;i++) html+='<col style="width:105px;">';
            html+='</colgroup>';
            html+='<tr style="background:var(--surface-alt);"><th style="padding:4px 2px;border:1px solid var(--border);text-align:center;font-size:0.6rem;height:22px;">Bloque</th><th style="padding:4px 2px;border:1px solid var(--border);text-align:center;font-size:0.6rem;">Horario</th>';
            ctx.DIAS.forEach(d=>html+='<th style="padding:4px 2px;border:1px solid var(--border);text-align:center;font-size:0.6rem;height:22px;">'+ctx.escapeHTML(d.substring(0,3))+'</th>');
            html+='</tr>';
            ctx.BLOQUES.forEach(b=>{
                html+='<tr><td style="padding:2px;border:1px solid var(--border);text-align:center;font-weight:600;font-size:0.6rem;background:var(--surface-alt);height:48px;">B'+b.n+'</td><td style="padding:2px;border:1px solid var(--border);text-align:center;font-size:0.55rem;background:var(--surface-alt);">'+b.inicio+'-'+b.fin+'</td>';
                ctx.DIAS.forEach((d,di)=>{
                    const plan=p.find(pl=>pl.dia===di&&pl.bloque===b.n);
                    const disponible=diasDisponibles[di]?.[b.n-1];
                    if(plan){
                        const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
                        const sec=data.secciones.find(s=>s.id===plan.seccionId);
                        const sala=data.salas.find(s=>s.id===plan.salaId);
                        const esPlanExterno=esPlanExternoFicha(plan,data);
                        const textoAsig=plan.esCargaDocentePura
                            ? `EXT · ${plan.codigoExterno||'EXT'}`
                            : esPlanExterno
                            ? `EXT · ${plan.codigoExterno||'EXT'}`
                            : ctx.formatearTextoBloqueAsignatura
                            ? ctx.formatearTextoBloqueAsignatura(asig,{formato:data.configuracion?.formatoTextoBloqueFichaDocente||'codigo',maxNombre:24})
                            : (asig?.codigo||'?');
                        const bg=esPlanExterno?'#e6f3f1':(ctx.colorAsignaturaPlanhor?.(asig)||ctx.colorSeguro(asig?.color,'var(--planhor-subject-neutral)'));
                        html+='<td class="ficha-plan-cell" data-plan-id="'+ctx.escapeAttr(plan.id||'')+'" data-carga-docente="'+ctx.escapeAttr(plan.esCargaDocentePura?plan.asignaturaId:'')+'" data-carga-externa="'+ctx.escapeAttr(esPlanExterno&&!plan.esCargaDocentePura?plan.asignaturaId:'')+'" data-seccion="'+ctx.escapeAttr(plan.seccionId||'')+'" data-asignatura="'+ctx.escapeAttr(plan.asignaturaId||'')+'" data-docente="'+ctx.escapeAttr(plan.docenteId||'')+'" data-sala="'+ctx.escapeAttr(plan.salaId||'')+'" data-tipo="'+(plan.tipoPresencial===false?'virtual':'presencial')+'" data-componente="'+ctx.escapeAttr(plan.componenteId||'')+'" data-dia="'+plan.dia+'" data-bloque="'+plan.bloque+'" style="padding:2px 1px;border:1px solid var(--border);text-align:center;vertical-align:middle;word-wrap:break-word;background:'+bg+';font-size:0.6rem;line-height:1.3;">'+ctx.escapeHTML(textoAsig)+'<br><span style="font-size:0.55rem;">'+ctx.escapeHTML(sala?sala.nombre:(plan.tipoPresencial===false?'Virtual':''))+'</span><br><span style="font-size:0.55rem;">'+ctx.escapeHTML(sec?sec.nombre:(plan.esCargaDocentePura?'Carga docente externa':''))+'</span></td>';
                    } else if(!disponible){
                        html+='<td style="padding:2px;border:1px solid var(--border);text-align:center;background:var(--planhor-unavailable-bg);color:var(--planhor-unavailable-text);font-size:0.6rem;height:48px;">x</td>';
                    } else {
                        html+='<td style="padding:2px;border:1px solid var(--border);text-align:center;height:48px;"></td>';
                    }
                });
                html+='</tr>';
            });
            html+='</table></div></div>';
            html+='<div style="flex:1;min-width:280px;"><div style="font-size:1rem;font-weight:600;margin-bottom:8px;">📋 Resumen carga académica</div>';
            html+='<table style="border-collapse:collapse;font-size:0.78rem;width:100%;">';
            html+='<tr style="background:var(--surface-alt);"><th style="padding:6px 8px;border:1px solid var(--border);text-align:left;">Asignatura</th><th style="padding:6px 4px;border:1px solid var(--border);text-align:center;width:42px;">Cant.</th><th style="padding:6px 8px;border:1px solid var(--border);text-align:center;width:64px;">Horas</th></tr>';
            const agrupado={};
            p.forEach(pl=>{
                const esExterna=esPlanExternoFicha(pl,data);
                if(pl.esCargaDocentePura) return;
                const asig=data.asignaturas.find(a=>a.id===pl.asignaturaId);
                if(!asig && !esExterna) return;
                const key=pl.esCargaDocentePura?`externa-docente:${pl.cargaDocenteId}`:(esExterna?`externa:${pl.asignaturaId}`:asig.id);
                const codigo=esExterna?(pl.codigoExterno||'EXT'):asig.codigo;
                const nombre=esExterna?(pl.nombreExterno||'Carga externa'):asig.nombre;
                if(!agrupado[key]) agrupado[key]={
                    codigo,
                    nombre,
                    horas:0,
                    secciones:new Set(),
                    externa:esExterna,
                    cargaDocenteId:pl.cargaDocenteId||'',
                    planExternoId:esExterna&&!pl.esCargaDocentePura?(pl.id||''):'',
                    asignaturaExternaId:esExterna&&!pl.esCargaDocentePura?(pl.asignaturaId||''):'',
                    docenteId:pl.docenteId||''
                };
                agrupado[key].horas+=18;
                if(pl.seccionId) agrupado[key].secciones.add(pl.seccionId);
            });
            cargasExternas.forEach(c=>{
                const manual=bloquesTotalesCargaExterna(c);
                if(!manual) return;
                const key=`externa-docente:${c.id}`;
                if(!agrupado[key]) agrupado[key]={codigo:c.codigo||'EXT',nombre:c.nombre||'Carga externa',horas:0,secciones:new Set(),externa:true,cargaDocenteId:c.id};
                agrupado[key].horas+=manual*18;
            });
            let totalHoras=0;
            let totalCantidad=0;
            Object.values(agrupado).forEach(a=>{
                const cantidad=a.secciones.size || 1;
                const attrs=a.cargaDocenteId
                    ? ` class="ficha-summary-carga-ext" data-carga-id="${ctx.escapeAttr(a.cargaDocenteId)}" title="Clic derecho para editar o eliminar"`
                    : (a.externa&&a.asignaturaExternaId
                        ? ` class="ficha-summary-plan-ext" data-plan-id="${ctx.escapeAttr(a.planExternoId)}" data-asignatura-id="${ctx.escapeAttr(a.asignaturaExternaId)}" data-docente-id="${ctx.escapeAttr(a.docenteId)}" title="Clic derecho para editar o eliminar"`
                        : '');
                html+='<tr'+attrs+'><td style="padding:4px 8px;border:1px solid var(--border);">'+(a.externa?'<strong>EXT · </strong>':'')+ctx.escapeHTML(a.codigo)+' - '+ctx.escapeHTML(a.nombre)+'</td><td style="padding:4px 4px;border:1px solid var(--border);text-align:center;">'+cantidad+'</td><td style="padding:4px 8px;border:1px solid var(--border);text-align:center;">'+a.horas+'</td></tr>';
                totalHoras+=a.horas;
                totalCantidad+=cantidad;
            });
            html+='<tr style="font-weight:700;background:var(--surface-alt);"><td style="padding:6px 8px;border:1px solid var(--border);">TOTAL</td><td style="padding:6px 4px;border:1px solid var(--border);text-align:center;">'+totalCantidad+'</td><td style="padding:6px 8px;border:1px solid var(--border);text-align:center;">'+totalHoras+'</td></tr>';
            const hom=doc.horasHomologo;
            if(hom) html+='<tr><td colspan="2" style="padding:4px 8px;border:1px solid var(--border);font-size:0.7rem;color:var(--text-secondary);">Homólogo anterior</td><td style="padding:4px 8px;border:1px solid var(--border);text-align:center;font-size:0.7rem;color:var(--text-secondary);">'+hom+'</td></tr>';
            html+='</table></div></div>';
            cont.innerHTML=html;
            cont.style.display='block';
            document.getElementById('btnFichaCargaDefendible')?.addEventListener('click',()=>abrirCargaDefendibleEnReportes(doc));
            document.getElementById('btnFichaCargaExterna')?.addEventListener('click',abrirModalCargaExternaDocente);
        }

        const EXPORT_WIDTH = 1510;

        function reforzarGrillasExportacion(raiz){
            if(!raiz) return;
            raiz.querySelectorAll('table').forEach(tabla=>{
                tabla.style.setProperty('border-collapse','collapse','important');
                tabla.style.setProperty('border','1px solid #aebec9','important');
            });
            raiz.querySelectorAll('th,td').forEach(celda=>{
                celda.style.setProperty('border','1px solid #aebec9','important');
            });
        }

        async function capturarFichaFija(elemento){
            const wrapper=document.createElement('div');
            const clon=elemento.cloneNode(true);
            const exportId='planhorFichaExportRoot';
            wrapper.id=exportId;
            wrapper.style.position='absolute';
            wrapper.style.left='-20000px';
            wrapper.style.top='0';
            wrapper.style.width=EXPORT_WIDTH+'px';
            wrapper.style.background='#ffffff';
            wrapper.style.padding='0';
            wrapper.style.zIndex='-1';
            clon.style.width=EXPORT_WIDTH+'px';
            clon.style.minWidth=EXPORT_WIDTH+'px';
            wrapper.appendChild(clon);
            document.body.appendChild(wrapper);
            await new Promise(resolve=>requestAnimationFrame(resolve));
            ctx.sanitizarNodoExportacion?.(wrapper,wrapper);
            reforzarGrillasExportacion(wrapper);
            try{
                return await html2canvas(wrapper,{
                    scale:2,
                    useCORS:true,
                    backgroundColor:'#ffffff',
                    width:EXPORT_WIDTH,
                    height:wrapper.scrollHeight,
                    windowWidth:EXPORT_WIDTH,
                    scrollX:0,
                    scrollY:0,
                    onclone:documentoClonado=>{
                        const raiz=documentoClonado.getElementById(exportId);
                        if(raiz){
                            ctx.sanitizarNodoExportacion?.(raiz,raiz);
                            reforzarGrillasExportacion(raiz);
                        }
                    }
                });
            }finally{
                wrapper.remove();
            }
        }

        async function exportarFichaPDF(){
            const data = getData();
            const docId=document.getElementById('fichaDocente')?.value;
            if(!docId) return;
            const doc=data.docentes.find(d=>d.id===docId);
            if(!doc) return;
            if(ctx.asegurarHtml2Canvas && !(await ctx.asegurarHtml2Canvas())) return;
            if(ctx.asegurarJsPDF && !(await ctx.asegurarJsPDF())) return;
            const grid=document.getElementById('fichaContenido');
            window.scrollTo(0,0);
            try{
                const canvas=await capturarFichaFija(grid);
                const imgData=canvas.toDataURL('image/jpeg',0.95);
                const {jsPDF}=window.jspdf;
                const pdf=new jsPDF('landscape','mm','a4');
                const iw=297, ih=canvas.height*iw/canvas.width;
                pdf.addImage(imgData,'JPEG',0,0,iw,Math.min(ih,200));
                pdf.save('Ficha_'+doc.apellido+'_'+doc.nombre+'_'+ctx.getTemporadaLabel()+'.pdf');
                ctx.toast('PDF exportado','success');
            }catch(error){
                if(ctx.mostrarErrorTecnico) ctx.mostrarErrorTecnico({titulo:'No se pudo exportar Ficha Docente',mensaje:'La exportación falló, pero la app principal sigue funcionando.',modulo:'Ficha Docente',accion:'Exportar ficha a PDF',error});
                else ctx.toast('Error al exportar PDF','error');
            }
        }

        async function exportarFichaJPG(){
            const data = getData();
            const docId=document.getElementById('fichaDocente')?.value;
            if(!docId) return;
            const doc=data.docentes.find(d=>d.id===docId);
            if(!doc) return;
            if(ctx.asegurarHtml2Canvas && !(await ctx.asegurarHtml2Canvas())) return;
            const grid=document.getElementById('fichaContenido');
            window.scrollTo(0,0);
            try{
                const canvas=await capturarFichaFija(grid);
                const link=document.createElement('a');
                link.download='Ficha_'+doc.apellido+'_'+doc.nombre+'_'+ctx.getTemporadaLabel()+'.jpg';
                link.href=canvas.toDataURL('image/jpeg',0.95);
                link.click();
                ctx.toast('JPG exportado','success');
            }catch(error){
                if(ctx.mostrarErrorTecnico) ctx.mostrarErrorTecnico({titulo:'No se pudo exportar Ficha Docente',mensaje:'La exportación falló, pero la app principal sigue funcionando.',modulo:'Ficha Docente',accion:'Exportar ficha a JPG',error});
                else ctx.toast('Error al exportar JPG','error');
            }
        }

        function docentesFichaExportables(){
            const data=getData();
            const espFiltro=document.getElementById('fichaEspFiltro')?.value||'';
            let docs=data.docentes.filter(d=>d.id!==ctx.DOCENTE_NN_ID);
            if(espFiltro&&espFiltro!=='__todas__') docs=docs.filter(d=>d.especialidad===espFiltro);
            return docs.sort((a,b)=>(a.apellido||'').localeCompare(b.apellido||'') || (a.nombre||'').localeCompare(b.nombre||''));
        }

        async function exportarTodasFichasPDF(){
            const docs=docentesFichaExportables();
            if(!docs.length) return ctx.toast('No hay docentes para exportar','warning');
            const etiquetaFiltro=document.getElementById('fichaEspFiltro')?.value;
            const alcance=etiquetaFiltro&&etiquetaFiltro!=='__todas__'?`la especialidad ${etiquetaFiltro}`:'todos los docentes';
            if(!confirm(`Se generará un PDF con ${docs.length} ficha(s) de ${alcance}. ¿Continuar?`)) return;
            if(ctx.asegurarHtml2Canvas && !(await ctx.asegurarHtml2Canvas())) return;
            if(ctx.asegurarJsPDF && !(await ctx.asegurarJsPDF())) return;
            const select=document.getElementById('fichaDocente');
            const docOriginal=select?.value||'';
            const cont=document.getElementById('fichaContenido');
            if(!cont) return;
            window.scrollTo(0,0);
            try{
                const {jsPDF}=window.jspdf;
                const pdf=new jsPDF('landscape','mm','a4');
                const pageW=297, pageH=210;
                for(let i=0;i<docs.length;i++){
                    const doc=docs[i];
                    if(select) select.value=doc.id;
                    renderFichaDocente(doc.id);
                    await new Promise(resolve=>requestAnimationFrame(resolve));
                    const canvas=await capturarFichaFija(cont);
                    const imgData=canvas.toDataURL('image/jpeg',0.95);
                    const imgH=Math.min(canvas.height*pageW/canvas.width,pageH);
                    if(i>0) pdf.addPage('a4','landscape');
                    pdf.addImage(imgData,'JPEG',0,0,pageW,imgH);
                    ctx.toast(`Exportando ficha ${i+1}/${docs.length}`,'info');
                }
                if(select) select.value=docOriginal;
                if(docOriginal) renderFichaDocente(docOriginal);
                else { cont.style.display='none'; cont.innerHTML=''; }
                pdf.save('Fichas_Docentes_'+ctx.getTemporadaLabel()+'.pdf');
                ctx.toast('Fichas docentes exportadas','success');
            }catch(error){
                if(select) select.value=docOriginal;
                if(docOriginal) renderFichaDocente(docOriginal);
                if(ctx.mostrarErrorTecnico) ctx.mostrarErrorTecnico({titulo:'No se pudo exportar fichas docentes',mensaje:'La exportación masiva falló, pero la app principal sigue funcionando.',modulo:'Ficha Docente',accion:'Exportar todas las fichas a PDF',error});
                else ctx.toast('Error al exportar fichas','error');
            }
        }

        function cerrarMenuFicha(){
            document.querySelectorAll('.ficha-context-popup').forEach(p=>p.remove());
        }

        function posicionarPopupFicha(popup,e){
            document.body.appendChild(popup);
            const scrollX=window.scrollX||document.documentElement.scrollLeft||0;
            const scrollY=window.scrollY||document.documentElement.scrollTop||0;
            const x=Number(e.pageX)||Number(e.clientX||0)+scrollX;
            const y=Number(e.pageY)||Number(e.clientY||0)+scrollY;
            const margen=8;
            const ancho=popup.offsetWidth||220;
            const alto=popup.offsetHeight||140;
            let left=x+margen, top=y+margen;
            if(left+ancho>scrollX+window.innerWidth-margen) left=x-ancho-margen;
            if(top+alto>scrollY+window.innerHeight-margen) top=scrollY+window.innerHeight-alto-margen;
            popup.style.left=`${Math.max(scrollX+margen,Math.round(left))}px`;
            popup.style.top=`${Math.max(scrollY+margen,Math.round(top))}px`;
        }

        function eliminarCargaExternaDocente(cargaId,docId){
            const data=getData();
            if(!confirm('¿Eliminar esta carga externa docente?')) return;
            data.cargasExternasDocente=(data.cargasExternasDocente||[]).filter(c=>c.id!==cargaId);
            ctx.guardar?.();
            ctx.reconstruirIndices?.();
            renderFichaDocente(docId);
            ctx.toast('Carga externa eliminada','success');
        }

        function eliminarCargaExternaPlanificada(plan){
            const data=getData();
            if(!plan?.asignaturaId) return;
            const relacionados=(data.planificaciones||[]).filter(p=>esPlanExternoFicha(p,data)&&p.asignaturaId===plan.asignaturaId);
            const total=relacionados.length||1;
            if(!confirm(`¿Eliminar esta carga externa planificada? Se eliminarán ${total} bloque(s).`)) return;
            data.planificaciones=(data.planificaciones||[]).filter(p=>!(esPlanExternoFicha(p,data)&&p.asignaturaId===plan.asignaturaId));
            ctx.guardar?.();
            ctx.reconstruirIndices?.();
            renderFichaDocente(plan.docenteId);
            ctx.toast('Carga externa planificada eliminada','success');
        }

        function abrirMenuResumenCargaExterna(row,e){
            const data=getData();
            const cargaId=row.dataset.cargaId;
            const carga=(data.cargasExternasDocente||[]).find(c=>c.id===cargaId);
            if(!carga) return;
            cerrarMenuFicha();
            const popup=document.createElement('div');
            popup.className='action-popup ficha-context-popup';
            popup.innerHTML=`
                <button id="fichaResumenEditar">Editar carga externa</button>
                <button id="fichaResumenEliminar">Eliminar carga externa</button>
                <button id="fichaResumenDetalle">Ver detalle</button>
            `;
            posicionarPopupFicha(popup,e);
            popup.querySelector('#fichaResumenEditar').onclick=()=>{
                cerrarMenuFicha();
                abrirModalCargaExternaDocente(carga.id);
            };
            popup.querySelector('#fichaResumenEliminar').onclick=()=>{
                cerrarMenuFicha();
                eliminarCargaExternaDocente(carga.id,carga.docenteId);
            };
            popup.querySelector('#fichaResumenDetalle').onclick=()=>{
                alert([
                    `${carga.codigo||'EXT'} ${carga.nombre||'Carga externa'}`.trim(),
                    `Origen: ${carga.origen||'Sin origen'}`,
                    `Estado: ${carga.estado||'gestion'}`,
                    `Horas presenciales: ${Number(carga.horasPresenciales)||0}`,
                    `Horas virtuales: ${Number(carga.horasVirtuales)||0}`,
                    carga.observacion?`Observación: ${carga.observacion}`:''
                ].filter(Boolean).join('\n'));
                cerrarMenuFicha();
            };
        }

        function abrirMenuResumenCargaPlanificada(row,e){
            const data=getData();
            const planId=row.dataset.planId||'';
            const asignaturaId=row.dataset.asignaturaId||'';
            const docenteId=row.dataset.docenteId||'';
            const planes=(data.planificaciones||[]).filter(p=>esPlanExternoFicha(p,data)&&p.asignaturaId===asignaturaId&&(!docenteId||p.docenteId===docenteId));
            const plan=planes.find(p=>p.id===planId)||planes[0];
            if(!plan) return;
            cerrarMenuFicha();
            const popup=document.createElement('div');
            popup.className='action-popup ficha-context-popup';
            popup.innerHTML=`
                <button id="fichaResumenPlanEditar">Editar en planificación</button>
                <button id="fichaResumenPlanEliminar">Eliminar carga externa</button>
                <button id="fichaResumenPlanDetalle">Ver detalle</button>
            `;
            posicionarPopupFicha(popup,e);
            popup.querySelector('#fichaResumenPlanEditar').onclick=()=>{
                cerrarMenuFicha();
                if(ctx.abrirCargaExternaPlanificada) ctx.abrirCargaExternaPlanificada(plan);
                else ctx.irASeccion?.(plan.seccionId,{docenteId:plan.docenteId,salaId:plan.salaId,tipo:plan.tipoPresencial===false?'virtual':'presencial',dia:plan.dia,bloque:plan.bloque,mensaje:'Carga externa abierta en planificación'});
            };
            popup.querySelector('#fichaResumenPlanEliminar').onclick=()=>{
                cerrarMenuFicha();
                eliminarCargaExternaPlanificada(plan);
            };
            popup.querySelector('#fichaResumenPlanDetalle').onclick=()=>{
                alert([
                    `${plan.codigoExterno||'EXT'} ${plan.nombreExterno||'Carga externa'}`.trim(),
                    `Origen: ${plan.origenCargaExterna||'Sin origen'}`,
                    `Estado: ${plan.estadoCargaExterna||plan.estadoGestionExterna||'gestion'}`,
                    `Bloques: ${planes.length}`
                ].join('\n'));
                cerrarMenuFicha();
            };
        }

        function abrirMenuFicha(cell,e){
            const data=getData();
            cerrarMenuFicha();
            const esCargaDocente=!!cell.dataset.cargaDocente;
            const esCargaExternaPlanificada=!!cell.dataset.cargaExterna;
            const cargaDocenteId=String(cell.dataset.cargaDocente||'').replace(/^__carga_docente_/,'');
            const cargaDocente=(data.cargasExternasDocente||[]).find(c=>c.id===cargaDocenteId)||null;
            const planReal=(data.planificaciones||[]).find(p=>p.id===cell.dataset.planId)||null;
            const popup=document.createElement('div');
            popup.className='action-popup ficha-context-popup';
            popup.innerHTML=esCargaDocente?`
                <button id="fichaCtxEditarCargaDocente">Editar carga externa</button>
                <button id="fichaCtxEliminarCargaDocente">Eliminar carga externa</button>
                <button id="fichaCtxDetalle">Ver detalle</button>
            `:esCargaExternaPlanificada?`
                <button id="fichaCtxEditarExterna">Editar en planificación</button>
                <button id="fichaCtxEliminarExterna">Eliminar carga externa</button>
                <button id="fichaCtxDetalle">Ver detalle</button>
            `:`
                <button id="fichaCtxIrPlan">Ir a planificación</button>
                <button id="fichaCtxSeleccionar">Seleccionar bloque</button>
                <button id="fichaCtxDetalle">Ver detalle</button>
            `;
            posicionarPopupFicha(popup,e);
            const plan={
                seccionId:cell.dataset.seccion,
                asignaturaId:cell.dataset.asignatura,
                docenteId:cell.dataset.docente,
                salaId:cell.dataset.sala,
                componenteId:cell.dataset.componente||null,
                tipo:cell.dataset.tipo||'presencial',
                dia:Number(cell.dataset.dia),
                bloque:Number(cell.dataset.bloque)
            };
            popup.querySelector('#fichaCtxEditarExterna')?.addEventListener('click',()=>{
                cerrarMenuFicha();
                if(planReal&&ctx.abrirCargaExternaPlanificada) ctx.abrirCargaExternaPlanificada(planReal);
                else ctx.irASeccion?.(plan.seccionId,{docenteId:plan.docenteId,salaId:plan.salaId,tipo:plan.tipo,dia:plan.dia,bloque:plan.bloque,mensaje:'Carga externa abierta en planificación'});
            });
            popup.querySelector('#fichaCtxEliminarExterna')?.addEventListener('click',()=>{
                cerrarMenuFicha();
                eliminarCargaExternaPlanificada(planReal||plan);
            });
            popup.querySelector('#fichaCtxEditarCargaDocente')?.addEventListener('click',()=>{
                cerrarMenuFicha();
                if(cargaDocente) abrirModalCargaExternaDocente(cargaDocente.id);
                else ctx.toast?.('No se encontró la carga externa docente','error');
            });
            popup.querySelector('#fichaCtxEliminarCargaDocente')?.addEventListener('click',()=>{
                cerrarMenuFicha();
                if(cargaDocente) eliminarCargaExternaDocente(cargaDocente.id,cargaDocente.docenteId);
                else ctx.toast?.('No se encontró la carga externa docente','error');
            });
            const abrir=(mensaje)=>{
                cerrarMenuFicha();
                ctx.irASeccion?.(plan.seccionId,{
                    asignaturaId:plan.asignaturaId,
                    docenteId:plan.docenteId,
                    salaId:plan.salaId,
                    componenteId:plan.componenteId,
                    tipo:plan.tipo,
                    dia:plan.dia,
                    bloque:plan.bloque,
                    mensaje
                });
            };
            popup.querySelector('#fichaCtxIrPlan')?.addEventListener('click',()=>abrir('Bloque abierto desde Ficha Docente'));
            popup.querySelector('#fichaCtxSeleccionar')?.addEventListener('click',()=>abrir('Bloque seleccionado desde Ficha Docente'));
            popup.querySelector('#fichaCtxDetalle').onclick=()=>{
                if(esCargaDocente){
                    alert([
                        `${cargaDocente?.codigo||'EXT'} ${cargaDocente?.nombre||'Carga externa'}`.trim(),
                        `Origen: ${cargaDocente?.origen||'Sin origen'}`,
                        `Estado: ${cargaDocente?.estado||'gestion'}`,
                        `Bloque: ${(ctx.DIAS||[])[plan.dia]||'?'} B${plan.bloque}`,
                        cargaDocente?.observacion?`Observación: ${cargaDocente.observacion}`:''
                    ].filter(Boolean).join('\n'));
                    cerrarMenuFicha();
                    return;
                }
                const asig=data.asignaturas.find(a=>a.id===plan.asignaturaId);
                const sec=data.secciones.find(s=>s.id===plan.seccionId);
                const sala=data.salas.find(s=>s.id===plan.salaId);
                alert([
                    `${asig?.codigo||''} ${asig?.nombre||''}`.trim(),
                    `Sección: ${sec?.nombre||'Sin sección'}`,
                    `Sala: ${sala?.nombre||'Sin sala'}`,
                    `Bloque: ${(ctx.DIAS||[])[plan.dia]||'?'} B${plan.bloque}`
                ].join('\n'));
                cerrarMenuFicha();
            };
        }

        function init(){
            document.getElementById('fichaDocente')?.addEventListener('change',()=>renderFichaDocente());
            document.getElementById('fichaDocente')?.addEventListener('focus',actualizarFichaDocentes);
            document.getElementById('fichaDocente')?.addEventListener('click',actualizarFichaDocentes);
            document.getElementById('fichaEspFiltro')?.addEventListener('change',()=>{
                actualizarFichaDocentes();
                renderFichaDocente();
            });
            document.getElementById('btnLimpiarFichaDocente')?.addEventListener('click',()=>{
                const esp=document.getElementById('fichaEspFiltro');
                const doc=document.getElementById('fichaDocente');
                const cont=document.getElementById('fichaContenido');
                if(esp) esp.value='';
                actualizarFichaDocentes();
                if(doc) doc.value='';
                if(cont){ cont.style.display='none'; cont.innerHTML=''; }
            });
            document.getElementById('btnCargaExternaDocente')?.addEventListener('click',abrirModalCargaExternaDocente);
            document.getElementById('btnExportarFichaPDF')?.addEventListener('click',exportarFichaPDF);
            document.getElementById('btnExportarFichaJPG')?.addEventListener('click',exportarFichaJPG);
            document.getElementById('btnExportarTodasFichasPDF')?.addEventListener('click',exportarTodasFichasPDF);
            document.getElementById('fichaContenido')?.addEventListener('contextmenu',(e)=>{
                const row=e.target.closest?.('.ficha-summary-carga-ext');
                if(row){
                    e.preventDefault();
                    abrirMenuResumenCargaExterna(row,e);
                    return;
                }
                const rowPlanExt=e.target.closest?.('.ficha-summary-plan-ext');
                if(rowPlanExt){
                    e.preventDefault();
                    abrirMenuResumenCargaPlanificada(rowPlanExt,e);
                    return;
                }
                const cell=e.target.closest?.('.ficha-plan-cell');
                if(!cell) return;
                e.preventDefault();
                abrirMenuFicha(cell,e);
            });
            document.addEventListener('pointerdown',(e)=>{
                if(e.target.closest?.('.ficha-context-popup')) return;
                cerrarMenuFicha();
            },true);
        }

        return { actualizarFichaDocentes, renderFichaDocente, init };
    }

    window.PlanificadorFichaDocente = { create: createFichaDocente };
})();
