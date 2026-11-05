'use strict';
(() => {
 const headerActions=document.querySelector('.app-header .header-actions');
 const container=document.getElementById('modalContainer');
 const passwordSource=document.querySelector('#menuDropdown [data-action="cambiarPassword"]');
 const logout=document.getElementById('btnCerrarSesion');
 if(!headerActions||!container||!passwordSource||!logout)return;
 passwordSource.hidden=true;passwordSource.classList.add('account-action-source');
 document.querySelector('#menuDropdown hr')?.remove();
 const control=document.createElement('details');control.className='account-control dropdown';
 const trigger=document.createElement('summary');trigger.className='account-avatar';trigger.setAttribute('aria-label','Mi cuenta');
 const menu=document.createElement('div');menu.className='account-menu';
 const identity=document.createElement('div');identity.className='account-identity';
 const fullName=document.createElement('strong');const emailLabel=document.createElement('span');
 identity.append(fullName,emailLabel);menu.append(identity);control.append(trigger,menu);headerActions.append(control);
 let account={nombre:'Usuario',email:''};
 const close=()=>{control.open=false;};
 const update=event=>{
  account={nombre:String(event.detail?.nombre||'Usuario'),email:String(event.detail?.email||'')};
  const base=account.nombre.includes('@')?account.nombre.split('@')[0].replace(/[._-]+/g,' '):account.nombre;
  const words=base.trim().split(/\s+/).filter(Boolean);
  trigger.textContent=((words[0]?.[0]||'U')+(words.length>1?words.at(-1)[0]:'')).toLocaleUpperCase('es');
  trigger.title=account.nombre;trigger.setAttribute('aria-label','Mi cuenta: '+account.nombre);
  fullName.textContent=account.nombre;emailLabel.textContent=account.email;emailLabel.title=account.email;
 };
 document.addEventListener('planhor:cuenta:actualizada',update);
 document.addEventListener('planhor:cuenta:guardada',event=>{
  if(window._pruebaAislada&&event.detail?.ok){try{localStorage.setItem('planhor:demo:perfil:prueba@example.invalid',account.nombre);}catch(error){/* El guardado normal sigue a cargo de Sync. */}}
 });
 const request=()=>document.dispatchEvent(new CustomEvent('planhor:cuenta:leer'));
 control.addEventListener('toggle',()=>{trigger.setAttribute('aria-expanded',String(control.open));if(control.open){request();document.querySelectorAll('.dropdown-menu.show').forEach(m=>m.classList.remove('show'));}});
 document.addEventListener('click',event=>{if(!control.contains(event.target))close();});
 control.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close();trigger.focus();}});
 const addAction=(label,handler)=>{const b=document.createElement('button');b.type='button';b.className='account-menu-action';b.textContent=label;b.addEventListener('click',()=>{close();handler();});menu.append(b);return b;};
 const showDialog=(title)=>{
  container.innerHTML='<div class="modal-overlay" id="modalOverlay"><div class="modal account-profile-modal"><div class="modal-header"><h3></h3></div><div class="account-profile-body"></div><div class="modal-actions"></div></div></div>';
  const overlay=container.firstElementChild;overlay.querySelector('h3').textContent=title;
  const dismiss=()=>{if(container.contains(overlay))overlay.remove();trigger.focus();};
  overlay.addEventListener('click',event=>{if(event.target===overlay)dismiss();});
  overlay.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();dismiss();}});
  return {body:overlay.querySelector('.account-profile-body'),actions:overlay.querySelector('.modal-actions'),dismiss};
 };
 const actionButton=(label,handler,primary=false)=>{const b=document.createElement('button');b.type='button';b.className='btn'+(primary?' btn-primary':'');b.textContent=label;b.addEventListener('click',handler);return b;};
 addAction('👤 Mi perfil',()=>{
  const dialog=showDialog('Mi perfil');
  const emailGroup=document.createElement('div');emailGroup.className='form-group';
  const emailName=document.createElement('label');emailName.className='form-label';emailName.textContent='Correo de la cuenta';emailName.htmlFor='accountProfileEmail';
  const email=document.createElement('input');email.id='accountProfileEmail';email.className='form-input';email.type='email';email.value=account.email;email.readOnly=true;
  emailGroup.append(emailName,email);
  const nameGroup=document.createElement('div');nameGroup.className='form-group';
  const nameLabel=document.createElement('label');nameLabel.className='form-label';nameLabel.textContent='Nombre visible';nameLabel.htmlFor='accountProfileName';
  const name=document.createElement('input');name.id='accountProfileName';name.className='form-input';name.autocomplete='name';name.maxLength=80;name.value=account.nombre.includes('@')?'':account.nombre;
  nameGroup.append(nameLabel,name);
  const status=document.createElement('p');status.className='account-profile-status';status.setAttribute('role','status');
  dialog.body.append(emailGroup,nameGroup,status);
  const save=actionButton('Guardar perfil',()=>{
   if(!name.value.trim()){status.textContent='Escribe un nombre visible.';name.focus();return;}
   save.disabled=true;status.textContent='Guardando perfil…';
   const saved=event=>{document.removeEventListener('planhor:cuenta:guardada',saved);if(event.detail?.ok)dialog.dismiss();else{save.disabled=false;status.textContent=event.detail?.mensaje||'No se pudo guardar.';}};
   document.addEventListener('planhor:cuenta:guardada',saved);
   document.dispatchEvent(new CustomEvent('planhor:cuenta:guardar',{detail:{nombre:name.value}}));
  },true);
  dialog.actions.append(actionButton('Cancelar',dialog.dismiss),save);name.focus();
 });
 addAction('🔐 Cambiar contraseña',()=>passwordSource.click());
 const demoSessionNotice=()=>{const dialog=showDialog('Sesión de prueba');const text=document.createElement('p');text.textContent='Esta copia utiliza una cuenta ficticia. El cambio de cuenta y el cierre de sesión se completarán con el acceso real al integrar esta interfaz.';dialog.body.append(text);dialog.actions.append(actionButton('Entendido',dialog.dismiss,true));};
 addAction('⇄ Cambiar de cuenta',()=>{if(window._pruebaAislada)demoSessionNotice();else logout.click();});
 logout.classList.add('account-menu-action','account-signout');menu.append(logout);
 logout.addEventListener('click',event=>{close();if(window._pruebaAislada){event.preventDefault();event.stopImmediatePropagation();demoSessionNotice();}},true);
 // El destino original de identidad se conserva para el observador de Firebase.
 const oldIdentity=document.getElementById('headerUsuarioTexto');
 if(oldIdentity)new MutationObserver(request).observe(oldIdentity,{childList:true,characterData:true,subtree:true});
 request();trigger.setAttribute('aria-expanded','false');
})();
