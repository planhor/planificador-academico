'use strict';
// Presentación únicamente: no modifica datos, planificación ni tamaño mínimo de la app.
(() => {
 const button=document.getElementById('btnPantallaCompleta');
 if(!button)return;
 const notice=document.createElement('aside');notice.className='mobile-orientation-notice';notice.hidden=true;
 const message=document.createElement('span');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
 const close=document.createElement('button');close.type='button';close.className='btn btn-xs';close.setAttribute('aria-label','Cerrar recomendación de orientación');close.textContent='×';
 notice.append(message,close);document.body.append(notice);
 let dismissed=false,lockOwned=false,changing=false,attempt=0,lockUnavailable=false;
 const mobile=()=>((navigator.maxTouchPoints||0)>0||window.matchMedia('(any-pointer: coarse)').matches)&&Math.min(screen.width,screen.height)<=900;
 // El viewport de Planhor es fijo: consultar pantalla física CSS, no el ancho del documento.
 const portrait=()=>screen.orientation?.type?screen.orientation.type.startsWith('portrait'):screen.height>screen.width;
 const updateNotice=()=>{
  notice.hidden=dismissed||!mobile()||!portrait();
  if(!notice.hidden)message.textContent=lockUnavailable
   ?'No se pudo bloquear la orientación. Gira el dispositivo a horizontal para aprovechar las grillas.'
   :'Para trabajar mejor con las grillas, gira el dispositivo a horizontal.';
 };
 close.addEventListener('click',()=>{dismissed=true;updateNotice();});
 const release=()=>{if(lockOwned){try{screen.orientation?.unlock?.();}catch{}lockOwned=false;}};
 const update=()=>{
  const active=!!document.fullscreenElement;
  const label=active?'Salir de pantalla completa':'Ampliar a pantalla completa';
  button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',label);button.title=label;
  if(!active){attempt++;release();lockUnavailable=false;}
  updateNotice();
 };
 const lockLandscape=async()=>{
  if(!mobile())return;
  const current=++attempt;
  try{
   if(!screen.orientation?.lock)throw new Error('Sin bloqueo de orientación');
   await screen.orientation.lock('landscape');
   if(current!==attempt||!document.fullscreenElement){screen.orientation.unlock?.();return;}
   lockOwned=true;lockUnavailable=false;
  }catch{if(current===attempt&&document.fullscreenElement)lockUnavailable=true;}
  updateNotice();
 };
 button.addEventListener('click',async()=>{
  if(button.disabled||changing)return;
  changing=true;
  try{
   if(document.fullscreenElement)await document.exitFullscreen();
   else{
    await document.documentElement.requestFullscreen();
    // La orientación es opcional y puede quedar pendiente. No bloquear Salir.
    void lockLandscape();
   }
  }catch{
   button.title='El navegador no permitió activar pantalla completa';
   document.getElementById('fullscreenStatus').textContent=button.title;
   updateNotice();
  }finally{changing=false;}
 });
 document.addEventListener('fullscreenchange',update);
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});
 });
 screen.orientation?.addEventListener?.('change',updateNotice);
 window.addEventListener('resize',updateNotice);
 window.addEventListener('orientationchange',updateNotice);
 update();
 if(!document.documentElement.requestFullscreen||!document.fullscreenEnabled){button.disabled=true;button.title='Pantalla completa no disponible en este navegador';}
})();
