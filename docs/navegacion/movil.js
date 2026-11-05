/* Navegación móvil: conserva las acciones originales, sin duplicar lógica de módulos. */
window.addEventListener('load',()=>{
 const sidebar=document.querySelector('.application-sidebar');
 const nav=document.getElementById('navegacionAplicaciones');
 if(!sidebar||!nav)return;
 const more=document.createElement('button');more.type='button';more.className='mobile-more';
 more.setAttribute('aria-label','Más aplicaciones');more.setAttribute('aria-expanded','false');
 more.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg><span>Más</span>';
 const panel=document.createElement('div');panel.className='mobile-apps-panel';panel.hidden=true;panel.setAttribute('aria-label','Todas las aplicaciones');
 const close=()=>{panel.hidden=true;more.setAttribute('aria-expanded','false');};
 nav.querySelectorAll('[data-tab]').forEach(original=>{
  const short={dashboard:'Inicio',organizarSalas:'Salas',planificacion:'Planificar',vistaHorarios:'Horarios'}[original.dataset.tab];
  if(short)original.querySelector('.navigation-label')?.setAttribute('data-mobile-label',short);
  const option=document.createElement('button');option.type='button';option.className='mobile-app-option';option.innerHTML=original.innerHTML;
  option.addEventListener('click',()=>{original.click();close();});panel.append(option);
 });
 const settings=document.createElement('button');settings.type='button';settings.className='mobile-app-option';settings.textContent='Configuración';
 settings.addEventListener('click',()=>{close();requestAnimationFrame(()=>document.getElementById('btnMenu').click());});panel.append(settings);
 sidebar.append(more);document.body.append(panel);
 more.addEventListener('click',()=>{const open=panel.hidden;panel.hidden=!open;more.setAttribute('aria-expanded',String(open));});
 document.addEventListener('pointerdown',e=>{if(!panel.contains(e.target)&&!more.contains(e.target))close();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
 window.addEventListener('resize',close);
});
