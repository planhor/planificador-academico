/* Ajuste fino sobre el estado y los servicios de Planificación. Sin copia de datos. */
(function(){
 window.PlanhorAplicaciones=window.PlanhorAplicaciones||{};
 window.PlanhorAplicaciones['optimizador-manual']={create(ctx){
  const root=document.getElementById('panelOptimizadorManual'),h=ctx.escapeHTML,a=ctx.escapeAttr;
  let mode='salas',filter='',specialty='',query='',selected=null,expected=null,busy=false,season=null,menu=null;
  root.innerHTML=`<div class="om-toolbar"><strong>Optimizador manual</strong><div role="group" aria-label="Vista del optimizador">${[['salas','Salas'],['docentes','Docentes'],['asignaturas','Asignaturas']].map(([v,n])=>`<button class="btn" data-om-view="${v}" aria-pressed="${v==='salas'}">${n}</button>`).join('')}</div></div><div id="panelOrganizarSalas" class="tab-panel active"></div><div class="om-temporal" hidden><aside class="om-controls"><label id="om-label" for="om-filter">Docente</label><select id="om-filter" class="form-select"></select><p>Selecciona un bloque y arrástralo a un horario disponible, o selecciona el destino con un clic.</p><div id="om-selection" role="status" aria-live="polite"></div></aside><div class="om-grid-wrap"><div class="om-grid" role="group" aria-label="Horario de ajuste manual"></div></div></div>`;
  // Sustituir el control inicial por filtros y ayudas propias de cada vista.
  const controls=root.querySelector('.om-controls');
  const toolbar=root.querySelector('.om-toolbar');
  const viewTooltip=document.createElement('div');viewTooltip.id='om-view-tooltip';viewTooltip.className='om-view-tooltip';viewTooltip.setAttribute('role','tooltip');viewTooltip.hidden=true;document.body.append(viewTooltip);
  function hideViewTooltip(){viewTooltip.hidden=true;toolbar.querySelectorAll('[aria-describedby="om-view-tooltip"]').forEach(button=>button.removeAttribute('aria-describedby'));}
  function showViewTooltip(button){
   viewTooltip.textContent=button.dataset.tooltip;viewTooltip.hidden=false;button.setAttribute('aria-describedby',viewTooltip.id);
   const rect=button.getBoundingClientRect(),tip=viewTooltip.getBoundingClientRect();
   const left=Math.max(8,Math.min(rect.left+(rect.width-tip.width)/2,window.innerWidth-tip.width-8));
   const top=rect.bottom+4+tip.height<window.innerHeight-8?rect.bottom+4:Math.max(8,rect.top-tip.height-4);
   viewTooltip.style.left=left+'px';viewTooltip.style.top=top+'px';
  }
  toolbar.querySelectorAll('[data-om-view]').forEach(button=>{
   const name=button.textContent.trim();
   const icon=document.querySelector(`#navegacionAplicaciones [data-tab="${button.dataset.omView}"] .navigation-icon .planhor-icon`);
   button.dataset.tooltip=name;button.setAttribute('aria-label',name);
   if(icon)button.replaceChildren(icon.cloneNode(true));
  });
  toolbar.addEventListener('pointerover',event=>{const button=event.target.closest('[data-tooltip]');if(button)showViewTooltip(button);});
  toolbar.addEventListener('pointerout',event=>{const button=event.target.closest('[data-tooltip]');if(button&&!button.contains(event.relatedTarget))hideViewTooltip();});
  toolbar.addEventListener('focusin',event=>{const button=event.target.closest('[data-tooltip]');if(button)showViewTooltip(button);});
  toolbar.addEventListener('focusout',hideViewTooltip);
  toolbar.addEventListener('pointerdown',hideViewTooltip);
  controls.insertAdjacentHTML('afterbegin','<div id="om-specialty-field"><label for="om-specialty">Especialidad</label><select id="om-specialty" class="form-select"></select></div><div id="om-search-field" hidden><label for="om-search">Buscar asignatura</label><input id="om-search" type="search" class="form-input" placeholder="Buscar por nombre o código"></div>');
  const selectionField=document.createElement('div');selectionField.className='om-field';
  controls.querySelector('#om-label').before(selectionField);
  selectionField.append(controls.querySelector('#om-label'),controls.querySelector('#om-filter'));
  controls.querySelectorAll('#om-specialty-field,#om-search-field').forEach(field=>field.classList.add('om-field'));
  const gridWrap=root.querySelector('.om-grid-wrap'),schedule=document.createElement('div');schedule.className='om-schedule';gridWrap.before(schedule);schedule.append(gridWrap);
  schedule.insertAdjacentHTML('beforeend','<div class="om-legend" aria-label="Leyenda de la grilla"><span><i class="om-key om-key-class"></i>Clase</span><span><i class="om-key om-key-available"></i>Destino disponible</span><span><i class="om-key om-key-blocked"></i>Destino no permitido</span><span><i class="om-key om-key-selected"></i>Bloque seleccionado</span><small>Esc cancela</small></div>');
  const salas=window.PlanhorAplicaciones['organizar-salas'].create({...ctx,mostrarDetalle:(...args)=>{if(!menu)ctx.mostrarDetalle?.(...args);}});
  const $=s=>root.querySelector(s),data=()=>ctx.getData();
  const eq=(x,y)=>String(x)===String(y);
  const plan=()=>data().planificaciones.find(p=>eq(p.id,selected));
  const asignatura=p=>data().asignaturas.find(x=>eq(x.id,p.asignaturaId));
  const docente=p=>data().docentes.find(x=>eq(x.id,p.docenteId));
  const seccion=p=>data().secciones.find(x=>eq(x.id,p.seccionId));
  const docName=d=>[d?.nombre,d?.apellido].filter(Boolean).join(' ')||'Sin docente';
  const normal=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function closeMenu(){menu?.remove();menu=null;ctx.ocultarDetalle?.();}
  function clear(){selected=null;expected=null;closeMenu();}
  function choose(id){selected=id;const p=plan();expected=p?{temporadaId:data().sel?.temporadaId,plan:JSON.stringify(p)}:null;render();}
  function render(){
   hideViewTooltip();
   if(!eq(season,data().sel?.temporadaId)){season=data().sel?.temporadaId;filter='';specialty='';query='';clear();}
   if(selected&&!plan())clear();
   root.querySelectorAll('[data-om-view]').forEach(b=>b.setAttribute('aria-pressed',String(mode===b.dataset.omView)));
   const roomPanel=$('#panelOrganizarSalas');roomPanel.hidden=mode!=='salas';roomPanel.classList.toggle('active',mode==='salas');
   const temporal=$('.om-temporal');temporal.hidden=mode==='salas';temporal.classList.toggle('active',mode!=='salas');temporal.dataset.view=mode;
   if(mode==='salas'){roomPanel.querySelector('.room-catalog').prepend(toolbar);salas.render();roomPanel.querySelector('h2').textContent='Salas';return;}
   controls.prepend(toolbar);
   $('#om-specialty-field').hidden=mode!=='docentes';$('#om-search-field').hidden=mode!=='asignaturas';
   $('#om-search').value=query;
   const specialties=[...new Set(data().docentes.map(d=>d.especialidad||'Sin especialidad'))].sort((x,y)=>x.localeCompare(y,'es'));
   $('#om-specialty').innerHTML='<option value="">Todas las especialidades</option>'+specialties.map(s=>`<option value="${a(s)}" ${s===specialty?'selected':''}>${h(s)}</option>`).join('');
   $('#om-label').textContent=mode==='docentes'?'Docente':'Asignatura';
   const groups=new Map();data().asignaturas.forEach(x=>{const c=String(x.codigo||'');if(c){if(!groups.has(c))groups.set(c,new Set());if(x.nombre)groups.get(c).add(x.nombre);}});
   const options=mode==='docentes'?data().docentes.filter(d=>!specialty||(d.especialidad||'Sin especialidad')===specialty).map(d=>({id:String(d.id),name:docName(d)})):[...groups].map(([c,names])=>({id:c,name:[c,[...names].join(' / ')].filter(Boolean).join(' · ')})).filter(x=>normal(x.name).includes(normal(query)));
   options.sort((x,y)=>x.name.localeCompare(y.name,'es',{numeric:true}));
   if(!options.some(x=>x.id===filter))filter=options[0]?.id||'';
   $('#om-filter').innerHTML=options.map(x=>`<option value="${a(x.id)}" ${x.id===filter?'selected':''}>${h(x.name)}</option>`).join('')||'<option>No hay datos disponibles</option>';
   const visible=filter?data().planificaciones.filter(p=>mode==='docentes'?eq(p.docenteId,filter):String(asignatura(p)?.codigo||'')===filter):[];
   const source=plan();
   $('#om-selection').textContent=source?`${asignatura(source)?.codigo||'Actividad'} · ${seccion(source)?.nombre||'Sin sección'} · ${docName(docente(source))}. Verde: destino permitido; rojo: no permitido. Esc cancela.`:'Selecciona un bloque para consultar sus destinos.';
   let html='<div class="om-heading">Horario</div>'+ctx.DIAS.map(d=>`<div class="om-heading">${h(d)}</div>`).join('');
   for(const b of ctx.BLOQUES){
    html+=`<div class="om-time"><strong>B${b.n}</strong><small>${h(b.inicio)}–${h(b.fin)}</small></div>`;
    ctx.DIAS.forEach((d,day)=>{
     const result=source?ctx.validarMovimiento(source.id,day,b.n,expected):null;
     const sectionBusy=source&&data().planificaciones.some(p=>!eq(p.id,source.id)&&eq(p.seccionId,source.seccionId)&&Number(p.dia)===day&&Number(p.bloque)===b.n);
     const items=visible.filter(p=>Number(p.dia)===day&&Number(p.bloque)===b.n);
     html+=`<div class="om-slot ${result?(result.ok?'om-available':'om-blocked'):''}" data-om-day="${day}" data-om-block="${b.n}" title="${a(result?(result.ok?(result.advertencia||'Destino disponible'):result.msg):'')}">${sectionBusy?'<small class="om-section-busy">Sección ocupada</small>':''}${items.map(p=>`<button class="om-lesson" style="--om-subject-color:${a(ctx.colorAsignaturaPlanhor?.(asignatura(p))||'#dce4ec')}" draggable="${!p.fijo&&!p.esCargaExterna}" data-om-plan="${a(p.id)}" aria-pressed="${eq(p.id,selected)}"><strong>${h(asignatura(p)?.codigo||p.nombreExterno||'Actividad')}</strong><span>${h(docName(docente(p)))}</span><span>${h(seccion(p)?.nombre||'Sin sección')}</span>${p.fijo?'<span>Fijo</span>':''}</button>`).join('')}</div>`;
    });
   }
   $('.om-grid').style.setProperty('--om-days',ctx.DIAS.length);$('.om-grid').style.setProperty('--om-rows',ctx.BLOQUES.length);$('.om-grid').innerHTML=html;adjustHeight();
  }
  function adjustHeight(){const panel=$('.om-temporal');if(mode!=='salas'&&root.classList.contains('active'))root.style.setProperty('--om-height',Math.max(360,window.innerHeight-panel.getBoundingClientRect().top)+'px');}
  window.addEventListener('resize',adjustHeight);
  function paintTargets(){const source=plan();if(!source)return;root.querySelectorAll('[data-om-day]').forEach(cell=>{const r=ctx.validarMovimiento(source.id,Number(cell.dataset.omDay),Number(cell.dataset.omBlock),expected);cell.classList.toggle('om-available',r.ok);cell.classList.toggle('om-blocked',!r.ok);cell.title=r.ok?(r.advertencia||'Destino disponible'):r.msg;});}
  async function move(day,block){
   const p=plan();if(!p||busy)return;
   const check=ctx.validarMovimiento(p.id,day,block,expected);
   if(!check.ok){ctx.toast(check.msg,'warning');return;}
   busy=true;
   try{const result=await ctx.aplicarMovimiento(p.id,day,block,expected);if(result.ok)clear();ctx.toast(result.msg,result.ok?'success':'warning');}
   catch(e){console.error('Optimizador manual',e);ctx.toast('Revisa el estado de guardado antes de continuar.','error');}
   finally{busy=false;render();}
  }
  root.addEventListener('change',e=>{
   if(e.target.id==='om-filter'){filter=e.target.value;clear();render();}
   if(e.target.id==='om-specialty'){specialty=e.target.value;filter='';clear();render();}
  });
  root.addEventListener('input',e=>{if(e.target.id==='om-search'){query=e.target.value;filter='';clear();render();}});
  root.addEventListener('click',e=>{
   const view=e.target.closest('[data-om-view]');if(view){
    const previous=mode;mode=view.dataset.omView;filter='';clear();render();
    if(previous!==mode&&mode!=='salas'&&(document.documentElement.dataset.planhorMotion==='full'||!window.matchMedia('(prefers-reduced-motion: reduce)').matches)){
     const panel=$('.om-temporal');panel.getAnimations().forEach(animation=>animation.cancel());
     const full=document.documentElement.dataset.planhorMotion==='full';
     const easing=full?(getComputedStyle(document.documentElement).getPropertyValue('--motion-ease').trim()||'ease-out'):'ease-out';
     const frames=full?[{opacity:.45,transform:'scale(.99)'},{opacity:1,transform:'scale(1)'}]:[{opacity:.82},{opacity:1}];
     panel.animate(frames,{duration:180,easing,fill:'both'});
    }
    return;
   }
   const lesson=e.target.closest('[data-om-plan]');if(lesson){choose(lesson.dataset.omPlan);return;}
   const slot=e.target.closest('[data-om-day]');if(slot&&selected)void move(Number(slot.dataset.omDay),Number(slot.dataset.omBlock));
  });
  let groupGesture=false;
  root.addEventListener('pointerdown',e=>{if(e.target.closest('[data-om-plan]'))groupGesture=e.ctrlKey||e.metaKey;});
  root.addEventListener('dragstart',e=>{const b=e.target.closest('[data-om-plan]');if(!b)return;selected=b.dataset.omPlan;const p=plan();expected={temporadaId:data().sel?.temporadaId,plan:JSON.stringify(p)};if(groupGesture||e.ctrlKey||e.metaKey)expected.grupo=JSON.stringify(ctx.grupoContinuo(p.id));groupGesture=false;e.dataTransfer.setData('text/plain',String(p.id));e.dataTransfer.effectAllowed='move';ctx.ocultarDetalle?.();paintTargets();});
  root.addEventListener('dragover',e=>{if(selected&&e.target.closest('[data-om-day]')){e.preventDefault();e.dataTransfer.dropEffect='move';}});
  root.addEventListener('drop',e=>{const slot=e.target.closest('[data-om-day]');if(!slot||!selected)return;e.preventDefault();void move(Number(slot.dataset.omDay),Number(slot.dataset.omBlock));});
  root.addEventListener('contextmenu',e=>{
   const b=e.target.closest('[data-om-plan],[data-os-plan]');if(!b)return;e.preventDefault();closeMenu();
   const id=b.dataset.omPlan||b.dataset.osPlan;
   menu=document.createElement('div');menu.className='action-popup om-context-menu';menu.setAttribute('role','group');menu.setAttribute('aria-label','Abrir bloque');
   menu.innerHTML='<button type="button" data-om-open="planificacion">Abrir en Planificador</button><button type="button" data-om-open="secciones">Abrir en Secciones</button>';
   document.body.append(menu);const bounds=menu.getBoundingClientRect();menu.style.position='fixed';menu.style.left=Math.max(4,Math.min(e.clientX,window.innerWidth-bounds.width-4))+'px';menu.style.top=Math.max(4,Math.min(e.clientY,window.innerHeight-bounds.height-4))+'px';
   menu.addEventListener('click',event=>{const action=event.target.closest('[data-om-open]');if(!action)return;const destination=action.dataset.omOpen;closeMenu();ctx.abrirDestino(id,destination);});
  });
  root.addEventListener('pointermove',e=>{if(menu)return;const b=e.target.closest('[data-om-plan]');if(b)ctx.mostrarDetalle?.(b.dataset.omPlan,e);else if(mode!=='salas')ctx.ocultarDetalle?.();});
  document.addEventListener('pointerdown',e=>{if(menu&&!menu.contains(e.target))closeMenu();},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&root.classList.contains('active')){clear();render();}});
  document.addEventListener('pointerdown',e=>{if(selected&&root.classList.contains('active')&&!root.contains(e.target)&&!menu?.contains(e.target)){clear();render();}},true);
  return {render};
 }};
})();
