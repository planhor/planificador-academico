'use strict';
// Iconos del primer prototipo y extensiones con el mismo trazo. Sin dependencias ni red.
(() => {
 const paths={
  dashboard:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  planificacion:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-12 0v10m6-10v10"/>',
  secciones:'<path d="M3 7h7l2-3h9v16H3zM7 12h10m-10 4h7"/>',
  asignaturas:'<path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1v15"/>',
  docentes:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3M8 21v-4m8 4v-4"/>',
  salas:'<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2m4 0h2M8 11h2m4 0h2m-6 10v-6h4v6"/>',
  organizarSalas:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18m-12 0v11m6-11v11m-8-7 2 2-2 2m10-4-2 2 2 2"/>',
  reportes:'<path d="M4 3v18h17M8 16v-4m5 4V8m5 8V5"/>',
  vistaHorarios:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18m-12 0v11m6-11v11"/>',
  gestorSecciones:'<path d="M12 3v12m-4-4 4 4 4-4M4 15v6h16v-6"/>',
  historial:'<path d="M3 10a9 9 0 1 1 1 8M3 4v6h6m3-4v6l4 2"/>',
  configuracion:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="var(--surface)"/><circle cx="15" cy="17" r="3" fill="var(--surface)"/>',
  fichaDocente:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M5 17v-1a4 4 0 0 1 8 0v1m3-9h2m-2 4h2m-2 4h2"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/>',
  file:'<path d="M14 3H5v18h14V8zm0 0v5h5M8 12h8m-8 4h6"/>',
  import:'<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',
  export:'<path d="M12 16V3m-4 4 4-4 4 4M4 16v5h16v-5"/>',
  save:'<path d="M4 3h13l3 3v15H4zM8 3v6h8V3M8 21v-7h8v7"/>',
  refresh:'<path d="M20 7a9 9 0 0 0-15-2L2 8m0-6v6h6m-4 9a9 9 0 0 0 15 2l3-3m0 6v-6h-6"/>',
  lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  logout:'<path d="M9 3H4v18h5m5-15 6 6-6 6m-6-6h12"/>',
  spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
  plus:'<path d="M12 4v16M4 12h16"/>',
  undo:'<path d="m9 5-6 6 6 6M3 11h11a6 6 0 0 1 6 6v3"/>',
  redo:'<path d="m15 5 6 6-6 6m6-6H10a6 6 0 0 0-6 6v3"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  edit:'<path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14z"/>',
  trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  warning:'<path d="m12 3 10 18H2zM12 9v5m0 3v1"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  laptop:'<rect x="5" y="3" width="14" height="13" rx="1"/><path d="M2 20h20l-3-4H5z"/>',
  link:'<path d="m10 13 4-4m-6 6-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2 3 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0"/>',
  broom:'<path d="m15 3-5 8m0 0 7 4-3 6H3l3-8zM7 15l-2 6m6-4-1 4"/>',
  chevronLeft:'<path d="m15 5-7 7 7 7"/>',chevronRight:'<path d="m9 5 7 7-7 7"/>',
  leaf:'<path d="M20 3C8 2 2 9 5 16s14 6 15-13zM4 21 16 9"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  snow:'<path d="M12 2v20M3 7l18 10M3 17 21 7M8 4l4 3 4-3M8 20l4-3 4 3"/>'
 };
 Object.assign(paths,{
  unlock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0m-4 8v2"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5z"/>',
  shield:'<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6z"/>',
  pin:'<path d="M19 9c0 6-7 12-7 12S5 15 5 9a7 7 0 0 1 14 0z"/><circle cx="12" cy="9" r="2"/>',
  users:'<circle cx="9" cy="7" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3m0-17a3 3 0 0 1 0 6m3 4a6 6 0 0 1 3 5v2"/>',
  flask:'<path d="M9 3h6m-5 0v7l-6 9a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2l-6-9V3M7 15h10"/>',
  copy:'<rect x="8" y="8" width="13" height="13" rx="1"/><path d="M16 8V3H3v13h5"/>',
  image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="2"/><path d="m3 17 5-5 4 4 4-7 5 8"/>',
  swap:'<path d="m17 3 4 4-4 4M3 7h18M7 13l-4 4 4 4m14-4H3"/>',
  play:'<path d="m7 4 13 8-13 8z"/>'
 });
 const icon=name=>{const span=document.createElement('span');span.className='planhor-icon';span.dataset.icon=name;span.setAttribute('aria-hidden','true');span.innerHTML='<svg viewBox="0 0 24 24" focusable="false">'+(paths[name]||paths.info)+'</svg>';return span;};
 const mapping=new Map([
  ['👨‍🏫','docentes'],['📊','reportes'],['📋','secciones'],['📚','asignaturas'],['🏫','salas'],['🎯','planificacion'],['👁️','vistaHorarios'],['🧩','gestorSecciones'],['🕘','historial'],['👤','docentes'],['⚙️','configuracion'],['⚙','configuracion'],['📅','calendar'],['🔍','search'],['⌕','search'],['📄','file'],['📥','import'],['📤','export'],['💾','save'],['🔄','refresh'],['🔐','lock'],['🚪','logout'],['🤖','spark'],['✨','spark'],['⚡','spark'],['➕','plus'],['↩️','undo'],['↩','undo'],['↶','undo'],['↷','redo'],['✖','close'],['✕','close'],['×','close'],['✎','edit'],['🗑️','trash'],['🗑','trash'],['⚠️','warning'],['⚠','warning'],['✅','check'],['❌','close'],['ℹ️','info'],['📦','asignaturas'],['🏛️','salas'],['💻','laptop'],['🔗','link'],['🧹','broom'],['🧠','spark'],['🛠️','configuracion'],['📈','reportes'],['🍂','leaf'],['🌿','leaf'],['❄️','snow'],['☀️','sun'],['«','chevronLeft'],['»','chevronRight']
 ]);
 for(const [glyph,name] of [['🔒','lock'],['🔓','unlock'],['🧭','compass'],['🛡️','shield'],['📍','pin'],['🔎','search'],['🤝','users'],['🧪','flask'],['👥','users'],['↪','copy'],['🖼️','image'],['↔','swap'],['▶','play']])mapping.set(glyph,name);
 const names={edit:'Editar',trash:'Eliminar',close:'Cerrar',plus:'Agregar',undo:'Revertir',redo:'Rehacer',search:'Buscar',calendar:'Temporadas',configuracion:'Configuración'};
 const pattern=new RegExp([...mapping.keys()].sort((a,b)=>b.length-a.length).join('|'),'gu');
 const excluded='script,style,textarea,option,svg,code,pre,.planhor-icon,.schedule-grid,.mini-grid,.vista-general-grid,.account-avatar';
 const decorateText=text=>{
  const parent=text.parentElement;if(!parent||parent.closest(excluded))return;
  const value=text.nodeValue;pattern.lastIndex=0;if(!pattern.test(value))return;
  pattern.lastIndex=0;const fragment=document.createDocumentFragment();let previous=0;
  for(const match of value.matchAll(pattern)){
   fragment.append(document.createTextNode(value.slice(previous,match.index)));
   const name=mapping.get(match[0]);fragment.append(icon(name));previous=match.index+match[0].length;
   const button=parent.closest('button');
   if(button&&!button.getAttribute('aria-label')&&button.textContent.trim()===match[0])button.setAttribute('aria-label',button.classList.contains('clear-btn')?'Limpiar búsqueda':button.title||names[name]||name);
  }
  fragment.append(document.createTextNode(value.slice(previous)));text.replaceWith(fragment);
 };
 const normalizeSearchField=input=>{
  if(!input.matches('input')||input.dataset.planhorSearch==='1')return;
  if(input.type!=='search'&&!/buscar|filtrar|🔍|🔎/i.test(input.placeholder))return;
  input.dataset.planhorSearch='1';
  input.placeholder=input.placeholder.replace(/[🔍🔎⌕]/gu,'').trim();
  let field=input.parentElement;
  if(!field.matches('.search-box,.application-search-field')){
   field=document.createElement('div');input.before(field);field.append(input);
  }
  field.classList.add('planhor-search-field');
  let symbol=field.querySelector(':scope > .planhor-search-symbol,:scope > .planhor-icon');
  if(!symbol){symbol=icon('search');input.before(symbol);}
  symbol.classList.add('planhor-search-symbol');
 };
 const decorate=root=>{
  if(root.nodeType===Node.TEXT_NODE){decorateText(root);return;}
  if(root.nodeType!==Node.ELEMENT_NODE||root.closest(excluded))return;
  if(root.matches('input'))normalizeSearchField(root);
  root.querySelectorAll('input').forEach(normalizeSearchField);
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const texts=[];while(walker.nextNode())texts.push(walker.currentNode);texts.forEach(decorateText);
 };
 // Mismos símbolos exactos del primer prototipo para los once accesos.
 document.querySelectorAll('#navegacionAplicaciones .tab-btn').forEach(button=>{const box=button.querySelector('.navigation-icon');if(box)box.replaceChildren(icon(button.dataset.tab));});
 const search=document.getElementById('buscarAplicacion');
 if(search){const field=document.createElement('div');field.className='application-search-field';search.before(field);field.append(icon('search'),search);search.placeholder='Buscar aplicación';}
 decorate(document.body);
 new MutationObserver(records=>{
  const roots=new Set();for(const record of records){if(record.type==='characterData')roots.add(record.target);else for(const node of record.addedNodes)roots.add(node);}
  roots.forEach(decorate);
 }).observe(document.body,{subtree:true,childList:true,characterData:true});
})();
