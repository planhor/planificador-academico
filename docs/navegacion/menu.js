'use strict';
// Conserva los botones y manejadores originales de Planhor. No accede a sus datos.
(() => {
 const navigation=document.getElementById('navegacionAplicaciones');
 const toggle=document.getElementById('btnPlegarNavegacion');
 const announcement=document.querySelector('.navigation-status');
 if(!navigation||!toggle)return;
 const buttons=[...navigation.querySelectorAll('.tab-btn')];
 // Reubicar los controles existentes, conservando sus eventos e identificadores.
 const sidebar=navigation.closest('.application-sidebar');
 // La rueda sobre el lateral pertenece al lateral, también en sus extremos.
 sidebar.addEventListener('wheel',event=>{
  if(event.ctrlKey||!event.deltaY)return;
  const scroller=event.target.closest('.dropdown-menu')||navigation;
  const unit=event.deltaMode===1?20:event.deltaMode===2?scroller.clientHeight:1;
  scroller.scrollTop+=event.deltaY*unit;
  event.preventDefault();
 },{passive:false});
 const header=document.querySelector('.app-header');
 const normalizeFloatingActions=()=>{
  for(const modal of document.querySelectorAll('#modalContainer .modal')){
   const groups=[];
   for(const child of [...modal.children]){
    if(child.matches('.form-group'))groups.push(child);
    else if(groups.length>=4)break;
    else groups.length=0;
   }
   if(groups.length>=4){const fields=document.createElement('div');fields.className='floating-form-grid';groups[0].before(fields);fields.append(...groups);}
   const actions=[...modal.children].filter(child=>child.matches('button.btn'));
   if(!actions.length)continue;
   const row=document.createElement('div');row.className='modal-actions floating-actions';
   row.append(...actions);modal.append(row);
  }
 };
 new MutationObserver(normalizeFloatingActions).observe(document.getElementById('modalContainer'),{childList:true,subtree:true});normalizeFloatingActions();
 // Cierre común, también para diálogos secundarios creados fuera de modalContainer.
 const addFloatingClose=()=>{
  for(const modal of document.querySelectorAll('.modal-overlay .modal')){
   if(modal.querySelector(':scope>.floating-close'))continue;
   const close=document.createElement('button');close.type='button';close.className='floating-close';
   close.setAttribute('aria-label','Cerrar ventana');close.title='Cerrar ventana';
   close.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
   close.addEventListener('click',()=>{
    const cancel=[...modal.querySelectorAll('button')].find(button=>button!==close&&/^(cancelar|cerrar|volver)$/i.test(button.textContent.trim())&&!button.disabled);
    if(cancel){cancel.click();return;}
    // Diálogos informativos sin acción Cancelar: cerrar solo su superficie.
    const overlay=modal.closest('.modal-overlay');
    overlay?.click();
    if(overlay?.isConnected)overlay.remove();
   });
   modal.prepend(close);
  }
 };
 new MutationObserver(addFloatingClose).observe(document.body,{childList:true,subtree:true});addFloatingClose();
 const brand=header.querySelector('.app-logo');
 const brandStatus=document.createElement('div');brandStatus.className='header-brand-status';
 brand.before(brandStatus);brandStatus.append(brand,document.getElementById('syncStatus'),document.getElementById('syncLastRemote'));
 const season=document.createElement('section');season.className='application-season';season.setAttribute('aria-label','Temporada de trabajo');
 const seasonContent=document.createElement('div');seasonContent.className='application-season-content';
 const seasonLabel=document.createElement('label');seasonLabel.htmlFor='selectorTemporada';seasonLabel.textContent='Temporada activa';
 const seasonSelect=document.getElementById('selectorTemporada');
 const manageSeasons=document.getElementById('btnGestionarTemps');manageSeasons.textContent='📅 +';manageSeasons.title='Gestionar temporadas';manageSeasons.setAttribute('aria-label','Gestionar temporadas');
 seasonContent.append(seasonLabel,seasonSelect,manageSeasons);
 header.querySelector('.header-actions').prepend(document.getElementById('indicadorPaleta'));
 const compactSeason=document.createElement('button');compactSeason.type='button';compactSeason.className='application-season-compact';compactSeason.textContent='📅';compactSeason.setAttribute('aria-label','Seleccionar temporada');
 compactSeason.addEventListener('click',()=>{if(sidebarMode==='auto')setSidebarExpanded(true);seasonSelect.focus();});
 const updateSeasonTitle=()=>{compactSeason.title='Temporada: '+(seasonSelect.selectedOptions[0]?.textContent||'Seleccionar');seasonSelect.title=compactSeason.title;};
 seasonSelect.addEventListener('change',updateSeasonTitle);new MutationObserver(updateSeasonTitle).observe(seasonSelect,{childList:true,subtree:true,characterData:true});updateSeasonTitle();
 const updateProfessionalTheme=()=>{
  const root=document.documentElement;
  root.dataset.professionalTheme=String(root.style.getPropertyValue('--accent').trim().toLowerCase()==='#176b87');
  root.dataset.professionalSeason=['Otoño','Invierno','Primavera','Verano'].find(name=>seasonSelect.selectedOptions[0]?.textContent.includes(name))||'Otoño';
 };
 new MutationObserver(updateProfessionalTheme).observe(document.documentElement,{attributes:true,attributeFilter:['style']});
 seasonSelect.addEventListener('change',updateProfessionalTheme);
 new MutationObserver(updateProfessionalTheme).observe(seasonSelect,{childList:true,subtree:true});updateProfessionalTheme();
 season.append(seasonContent,compactSeason);navigation.before(season);
 const settingsButton=document.getElementById('btnMenu');
 const settingsMenu=document.getElementById('menuDropdown');
 const settingsGroup=settingsButton.closest('.dropdown');
 const exportButton=document.getElementById('btnExportar');
 const exportMenu=document.getElementById('exportDropdown');
 const oldExportGroup=exportButton.closest('.dropdown');
 const settingsDock=document.createElement('div');settingsDock.className='application-settings';
 settingsDock.append(settingsGroup);navigation.after(settingsDock);
 settingsButton.classList.add('application-settings-button');settingsButton.replaceChildren();
 const settingsIcon=document.createElement('span');settingsIcon.className='navigation-icon';settingsIcon.textContent='⚙';settingsIcon.setAttribute('aria-hidden','true');
 const settingsLabel=document.createElement('span');settingsLabel.className='navigation-label';settingsLabel.textContent='Configuración';
 settingsButton.append(settingsIcon,settingsLabel);settingsButton.title='Configuración';settingsButton.setAttribute('aria-label','Configuración');settingsButton.setAttribute('aria-controls','menuDropdown');
 // Los dos menús son hermanos: evita ejecutar dos veces sus acciones delegadas.
 settingsGroup.append(exportMenu);settingsMenu.prepend(exportButton);exportButton.classList.add('dropdown-item');
 oldExportGroup.remove();
 const preferences=settingsMenu.querySelector('[data-action="abrirConfiguracion"]');if(preferences)preferences.textContent='⚙ Ajustes de la app';
 const accountStatus=document.createElement('div');accountStatus.className='application-account-status';
 const syncBox=document.getElementById('syncStatus');
 const saveStatus=document.getElementById('saveStatus');
 syncBox.append(saveStatus);
 const updateSyncDescription=()=>{syncBox.title=saveStatus.classList.contains('visible')?saveStatus.textContent:document.getElementById('syncStatusText').textContent;};
 new MutationObserver(updateSyncDescription).observe(syncBox,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});
 updateSyncDescription();
 accountStatus.append(document.getElementById('headerUsuario'));settingsMenu.append(accountStatus);
 const exportBack=document.createElement('button');exportBack.type='button';exportBack.className='dropdown-item application-export-back';exportBack.textContent='← Volver a Configuración';exportBack.addEventListener('click',()=>settingsButton.click());exportMenu.prepend(exportBack);
 const updateExpanded=()=>{settingsButton.setAttribute('aria-expanded',String(settingsMenu.classList.contains('show')));exportButton.setAttribute('aria-expanded',String(exportMenu.classList.contains('show')));};
 exportButton.setAttribute('aria-controls','exportDropdown');updateExpanded();
 new MutationObserver(updateExpanded).observe(settingsMenu,{attributes:true,attributeFilter:['class']});new MutationObserver(updateExpanded).observe(exportMenu,{attributes:true,attributeFilter:['class']});
 for(const button of buttons){
  const text=button.textContent.trim();
  const space=text.indexOf(' ');
  const symbol=space<0?'':text.slice(0,space);
  const label=space<0?text:text.slice(space+1);
  const icon=document.createElement('span');icon.className='navigation-icon';icon.textContent=symbol;icon.setAttribute('aria-hidden','true');
  const caption=document.createElement('span');caption.className='navigation-label';caption.textContent=label;
  button.replaceChildren(icon,caption);
  button.type='button';button.title=label;button.setAttribute('aria-label',label);
 }
 const searchBox=document.createElement('div');searchBox.className='application-search';
 const searchContent=document.createElement('div');searchContent.className='application-search-content';
 const searchLabel=document.createElement('label');searchLabel.htmlFor='buscarAplicacion';searchLabel.textContent='Buscar aplicación';
 const searchInput=document.createElement('input');searchInput.type='search';searchInput.id='buscarAplicacion';searchInput.placeholder='Nombre de aplicación';searchInput.autocomplete='off';searchInput.setAttribute('aria-controls',navigation.id);searchInput.setAttribute('aria-describedby','resultadoBusquedaAplicaciones');
 const searchCount=document.createElement('small');searchCount.id='resultadoBusquedaAplicaciones';
 const compactSearch=document.createElement('button');compactSearch.type='button';compactSearch.className='application-search-compact';compactSearch.textContent='⌕';compactSearch.setAttribute('aria-label','Buscar aplicación');compactSearch.title='Buscar aplicación';
 compactSearch.addEventListener('click',()=>{if(sidebarMode==='auto')setSidebarExpanded(true);searchInput.focus();});
 searchContent.append(searchLabel,searchInput,searchCount);searchBox.append(searchContent,compactSearch);navigation.before(searchBox);
 const emptySearch=document.createElement('p');emptySearch.className='application-search-empty';emptySearch.textContent='No hay aplicaciones que coincidan.';emptySearch.hidden=true;navigation.append(emptySearch);
 const normalizeSearch=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es').trim();
 const filterApplications=()=>{
  const terms=normalizeSearch(searchInput.value).split(/\s+/).filter(Boolean);
  for(const button of buttons)button.hidden=!terms.every(term=>normalizeSearch(button.getAttribute('aria-label')).includes(term));
  const total=buttons.filter(button=>!button.hidden).length;
  searchCount.textContent=total+' '+(total===1?'aplicación':'aplicaciones');emptySearch.hidden=total!==0;
  navigation.scrollTop=0;searchBox.classList.toggle('has-query',terms.length>0);
  compactSearch.title=terms.length?'Buscar aplicación · filtro: '+searchInput.value:'Buscar aplicación';announcement.textContent=total===0?'No hay aplicaciones que coincidan.':searchCount.textContent+' disponibles.';
 };
 searchInput.addEventListener('input',filterApplications);
 searchInput.addEventListener('keydown',event=>{
  if(['Escape','ArrowDown','Enter'].includes(event.key))event.stopPropagation();
  if(event.key==='Escape'){event.preventDefault();searchInput.value='';filterApplications();}
  if(event.key==='ArrowDown'){const first=buttons.find(button=>!button.hidden);if(first){event.preventDefault();first.focus();}}
  if(event.key==='Enter'){event.preventDefault();const matches=buttons.filter(button=>!button.hidden);if(matches.length===1){matches[0].click();document.getElementById('contenidoPrincipal').focus();}}
 });
 filterApplications();
 const reportCard=document.querySelector('#panelReportes>.card');
 const reportFilters=document.createElement('div');reportFilters.className='report-filters';
 const reportCategory=document.getElementById('reporteCategoria').closest('.form-group');
 const reportType=document.getElementById('reporteTipo').closest('.form-group');
 reportCategory.querySelector('label').htmlFor='reporteCategoria';reportType.querySelector('label').htmlFor='reporteTipo';
 reportCard.prepend(reportFilters);
 reportFilters.append(reportCategory,reportType,reportCard.querySelector('.report-toolbar'));
 const teacherSheetToolbar=document.querySelector('#panelFichaDocente>.selection-panel');
 const teacherSheetActions=document.createElement('div');teacherSheetActions.className='teacher-sheet-actions';
 for(const button of [...teacherSheetToolbar.querySelectorAll(':scope>.btn')])teacherSheetActions.append(button);
 teacherSheetToolbar.append(teacherSheetActions);
 const planningPanel=document.getElementById('panelPlanificacion');
 const planningWorkspace=document.createElement('div');planningWorkspace.className='planning-schedule-area';
 planningPanel.querySelector('.selection-panel').after(planningWorkspace);
 for(const id of ['planProgreso','planMensajes','planComparador','scheduleContainer','planGridLegend'])planningWorkspace.append(document.getElementById(id));
 const selectionPanel=planningPanel.querySelector('.selection-panel');
 const modeEntry=document.createElement('div');modeEntry.className='planning-mode-entry';modeEntry.append(document.getElementById('planModeIdle'),document.getElementById('btnCancelarModo'));selectionPanel.prepend(modeEntry);
 const automation=document.createElement('details');automation.className='planning-automation';
 const automationSummary=document.createElement('summary');automationSummary.className='btn';automationSummary.textContent='⚡ Automatizar';
 const automationOptions=document.createElement('div');automationOptions.className='planning-automation-options';
 for(const id of ['btnAutoAsignatura','btnAutoSeccion','btnAutoGeneral','btnOptimizarHorario','btnRevertirAutoRapido'])automationOptions.append(document.getElementById(id));
 automation.append(automationSummary,automationOptions);document.getElementById('planModeTools').prepend(automation);
 automationOptions.addEventListener('click',event=>{if(event.target.closest('button'))automation.open=false;});
 automation.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();automation.open=false;automationSummary.focus();}});
 document.addEventListener('click',event=>{if(!automation.contains(event.target))automation.open=false;});
 const gridToolbar=document.createElement('div');gridToolbar.className='planning-grid-toolbar';
 const planningSummary=document.getElementById('planProgreso');planningSummary.classList.add('planning-panel-summary');selectionPanel.append(planningSummary);
 const summaryCard=document.createElement('section');summaryCard.className='planning-summary-card';summaryCard.setAttribute('aria-label','Resumen de planificación');selectionPanel.append(summaryCard);
 const renderPlanningSummary=()=>{
  const text=planningSummary.style.display==='none'?'':planningSummary.textContent.trim();
  const parts=text.split(' · ').filter(Boolean);
  const metrics=[['Presencial','—'],['Virtual','—'],['Total operativo','—'],['Alumnos','—']];
  const notes=[];
  for(const part of parts){
   const match=part.match(/^([^:]+):\s*(.*)$/);
   const index=match?metrics.findIndex(([label])=>label===match[1]||(label==='Presencial'&&match[1].startsWith('Componente '))):-1;
   if(index>=0){metrics[index]=[match[1],match[2]];}else notes.push(part);
  }
  summaryCard.replaceChildren();
  for(const [label,value] of metrics){const row=document.createElement('div');row.className='planning-summary-row';const name=document.createElement('span');name.textContent=label;const number=document.createElement('strong');number.textContent=value;row.append(name,number);summaryCard.append(row);}
  if(notes.length){const note=document.createElement('p');note.className='planning-summary-note';note.textContent=notes.join(' · ');summaryCard.append(note);}
  summaryCard.title=text?'Resumen de la asignatura seleccionada':'Selecciona una asignatura en modo planificación para ver sus valores';
 };
 new MutationObserver(renderPlanningSummary).observe(planningSummary,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['style']});renderPlanningSummary();
 modeEntry.before(document.getElementById('btnCompararSeccion'));
 planningWorkspace.prepend(gridToolbar);
 const updatePlanningOffset=()=>{const noticeHeight=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--preview-notice-height'))||0;document.documentElement.style.setProperty('--planning-top-offset',Math.ceil(header.getBoundingClientRect().height+noticeHeight)+'px');};
 new ResizeObserver(updatePlanningOffset).observe(header);updatePlanningOffset();
 const footer=document.querySelector('.app-footer');
 const updateFooterHeight=()=>document.documentElement.style.setProperty('--app-footer-height',Math.ceil(footer.getBoundingClientRect().height)+'px');
 new ResizeObserver(updateFooterHeight).observe(footer);updateFooterHeight();
 const scheduleGrid=document.getElementById('scheduleGrid');
 const gridLegend=document.getElementById('planGridLegend');
 const fitPlanningGrid=()=>{
  const rows=scheduleGrid.querySelectorAll('.grid-time').length;
  if(rows) scheduleGrid.style.setProperty('--planning-row-count',rows);
  const toolbarMargin=parseFloat(getComputedStyle(gridToolbar).marginBottom)||0;
  const scheduleStyle=getComputedStyle(document.getElementById('scheduleContainer'));
  const scheduleBorder=parseFloat(scheduleStyle.borderTopWidth)+parseFloat(scheduleStyle.borderBottomWidth);
  planningWorkspace.style.setProperty('--planning-grid-chrome',Math.ceil(gridToolbar.getBoundingClientRect().height+toolbarMargin+gridLegend.getBoundingClientRect().height+scheduleBorder)+'px');
 };
 const planningSizeObserver=new ResizeObserver(fitPlanningGrid);
 planningSizeObserver.observe(gridToolbar);planningSizeObserver.observe(gridLegend);
 new MutationObserver(fitPlanningGrid).observe(scheduleGrid,{childList:true});fitPlanningGrid();
 const updateCurrent=()=>{
  for(const button of buttons){if(button.classList.contains('active'))button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}
  document.getElementById('contenidoPrincipal').classList.toggle('planning-sidebar-layout',buttons.some(button=>button.dataset.tab==='planificacion'&&button.classList.contains('active')));
 };
 updateCurrent();
 new MutationObserver(updateCurrent).observe(navigation,{subtree:true,attributes:true,attributeFilter:['class']});
 let sidebarMode='auto';
 try{sidebarMode=localStorage.getItem('planhor:menu:modo')||'auto';}catch(e){}
 if(!['auto','expanded','collapsed'].includes(sidebarMode))sidebarMode='auto';
 let seasonSelectionActive=false;
 const sidebarHasInteraction=()=>seasonSelectionActive||sidebar.contains(document.activeElement);
 const closeAutomaticSidebar=()=>{if(sidebarMode==='auto'&&!sidebarHasInteraction()&&!sidebar.matches(':hover'))setSidebarExpanded(false);};
 const setSidebarExpanded=expanded=>{
  document.documentElement.classList.toggle('application-menu-collapsed',!expanded);

 };
 const pinMenu=document.createElement('div');pinMenu.id='sidebarPinMenu';pinMenu.className='sidebar-pin-menu';pinMenu.hidden=true;toggle.setAttribute('aria-controls',pinMenu.id);toggle.setAttribute('aria-expanded','false');
 pinMenu.setAttribute('role','group');pinMenu.setAttribute('aria-label','Comportamiento del menú');
 const canvas=document.querySelector('.navigation-canvas');
 let canvasMotion=null;
 const applySidebarMode=()=>{
  const previousBounds=canvas?.getBoundingClientRect();
  setSidebarExpanded(sidebarMode==='expanded'||(sidebarMode==='auto'&&(sidebar.matches(':hover')||sidebarHasInteraction())));
  toggle.setAttribute('aria-label','Fijar menú de aplicaciones');toggle.title='Fijar menú de aplicaciones';
  toggle.setAttribute('aria-pressed',String(sidebarMode!=='auto'));
  // Conservar el rectángulo visible completo: trasladar solamente dejaba
  // un hueco o un recorte a la derecha al aplicar el ancho final de golpe.
  if(canvas){
   canvasMotion?.cancel();
   const bounds=canvas.getBoundingClientRect();
   const delta=previousBounds.left-bounds.left;
   const scale=bounds.width>0?previousBounds.width/bounds.width:1;
   if((delta||scale!==1)&&document.documentElement.dataset.planhorMotion==='full'){
    canvasMotion=canvas.animate([
     {transformOrigin:'top left',transform:`translateX(${delta}px) scaleX(${scale})`},
     {transformOrigin:'top left',transform:'translateX(0) scaleX(1)'}
    ],{duration:180,easing:'cubic-bezier(.25,.1,.25,1)'});
   }
  }
  announcement.textContent=sidebarMode==='auto'?'Menú automático al pasar el puntero.':sidebarMode==='expanded'?'Menú fijado expandido.':'Menú fijado contraído.';
  for(const button of pinMenu.children)button.setAttribute('aria-pressed',String(button.dataset.mode===sidebarMode));
 };
 for(const [mode,label] of [['auto','Automático'],['expanded','Fijar expandido'],['collapsed','Fijar contraído']]){
  const button=document.createElement('button');button.type='button';button.className='btn';button.dataset.mode=mode;button.textContent=label;
  button.addEventListener('click',()=>{sidebarMode=mode;try{localStorage.setItem('planhor:menu:modo',mode);}catch(e){}pinMenu.hidden=true;toggle.setAttribute('aria-expanded','false');applySidebarMode();});pinMenu.append(button);
 }
 sidebar.append(pinMenu);
 toggle.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 3 5 5-4 2-3 5-2 1-4-4 1-2 5-3zM8 16l-5 5"/></svg>';
 toggle.addEventListener('click',()=>{pinMenu.hidden=!pinMenu.hidden;toggle.setAttribute('aria-expanded',String(!pinMenu.hidden));});
 const enterSidebar=event=>{
  if(sidebarMode!=='auto')return;
  const bounds=sidebar.getBoundingClientRect();
  if(event.clientX>=bounds.left&&event.clientX<bounds.right&&event.clientY>=bounds.top&&event.clientY<bounds.bottom)setSidebarExpanded(true);
 };
 sidebar.addEventListener('pointerenter',enterSidebar);
 sidebar.addEventListener('pointermove',event=>{if(document.documentElement.classList.contains('application-menu-collapsed'))enterSidebar(event);});
 // El desplegable nativo puede extenderse fuera del lateral y emitir pointerleave.
 seasonSelect.addEventListener('pointerdown',event=>{
  if(seasonSelectionActive){
   seasonSelectionActive=false;
   event.preventDefault();
   seasonSelect.blur();
   queueMicrotask(closeAutomaticSidebar);
  }else seasonSelectionActive=true;
 });
 seasonSelect.addEventListener('keydown',event=>{
  if(['ArrowDown','ArrowUp','Home','End',' '].includes(event.key))seasonSelectionActive=true;
  if(['Escape','Tab'].includes(event.key)){seasonSelectionActive=false;queueMicrotask(closeAutomaticSidebar);}
 });
 seasonSelect.addEventListener('change',()=>{seasonSelectionActive=false;queueMicrotask(closeAutomaticSidebar);});
 document.addEventListener('pointerdown',event=>{
  if(event.target===seasonSelect)return;
  seasonSelectionActive=false;
  if(sidebarMode==='auto'&&!sidebar.contains(event.target)&&!sidebar.matches(':hover'))setSidebarExpanded(false);
 },true);
 sidebar.addEventListener('pointerleave',()=>{closeAutomaticSidebar();pinMenu.hidden=true;});
 sidebar.addEventListener('focusin',()=>{if(sidebarMode==='auto')setSidebarExpanded(true);});
 sidebar.addEventListener('focusout',event=>{
  if(seasonSelectionActive&&event.relatedTarget===null)return;
  if(event.relatedTarget&&!sidebar.contains(event.relatedTarget))seasonSelectionActive=false;
  queueMicrotask(closeAutomaticSidebar);
 });
 document.addEventListener('click',event=>{if(!pinMenu.contains(event.target)&&!toggle.contains(event.target))pinMenu.hidden=true;});
 sidebar.addEventListener('keydown',event=>{if(event.key==='Escape'&&!pinMenu.hidden){pinMenu.hidden=true;toggle.focus();}});
 applySidebarMode();
 let planningWasActive=false;
 const collapseOnPlanningEntry=()=>{
  const active=selectionPanel.classList.contains('plan-mode-active');
  if(!active)automation.open=false;
  if(active&&!planningWasActive&&sidebarMode==='auto')setSidebarExpanded(false);
  planningWasActive=active;
 };
 new MutationObserver(collapseOnPlanningEntry).observe(selectionPanel,{attributes:true,attributeFilter:['class']});
 collapseOnPlanningEntry();
 navigation.addEventListener('click',event=>{
  const button=event.target.closest('.tab-btn');
  if(button&&navigation.contains(button)){
   announcement.textContent='Módulo '+button.getAttribute('aria-label')+'.';
   // El clic deja foco en el módulo; retirarlo evita retener abierto el lateral.
   // Con teclado se conserva para que la navegación siga siendo accesible.
   if(inputMethod==='pointer'){
    button.blur();
    queueMicrotask(closeAutomaticSidebar);
   }
  }
 });
 // Al completar una elección con puntero, retirar solo el foco transitorio.
 // El teclado conserva su foco para seguir recorriendo opciones y controles.
 let inputMethod='keyboard';
 document.addEventListener('pointerdown',()=>{inputMethod='pointer';},true);
 document.addEventListener('keydown',event=>{if(!['Shift','Control','Alt','Meta'].includes(event.key))inputMethod='keyboard';},true);
 document.addEventListener('change',event=>{
  if(inputMethod==='pointer'&&event.target.matches('select')&&document.activeElement===event.target)event.target.blur();
 });
 document.addEventListener('click',event=>{
  if(inputMethod!=='pointer')return;
  const result=event.target.closest('.search-results li,.search-results [role="option"]');
  if(!result)return;
  const field=result.closest('.search-box')?.querySelector('input');
  if(field)queueMicrotask(()=>{if(document.activeElement===field)field.blur();});
 },true);
})();
