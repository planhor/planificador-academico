const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function setup(salas){
 const events={},windowEvents={},frames=new Map();let id=0,position=0,captured=false;
 const classes=()=>{const set=new Set();return{add:x=>set.add(x),remove:x=>set.delete(x),contains:x=>set.has(x),toggle:(x,on)=>{if(on)set.add(x);else set.delete(x);}};};
 const node=()=>({style:{setProperty(){}},classList:classes(),dataset:{},setAttribute(){},remove(){}});
 const data={sel:{temporadaId:'t'},salas:salas||Array.from({length:6},(_,i)=>({id:'r'+i,nombre:'Sala '+i,capacidad:35})),asignaturas:[{id:'a',codigo:'A',nombre:'Prueba'}],secciones:[],planificaciones:[{id:'p',salaId:'r0',asignaturaId:'a',dia:0,bloque:1,tipoPresencial:true}]};
 const board={get scrollLeft(){return position;},set scrollLeft(v){position=Math.max(0,Math.min(840,v));},clientHeight:390,getBoundingClientRect:()=>({left:0,right:600,top:0,bottom:400})};
 const catalog={classList:classes(),scrollHeight:1200,clientHeight:300,scrollTop:0,scrollTo({top}){this.scrollTop=Math.max(0,Math.min(900,top));}};
 const previous=node(),next=node();
 const grid=node(),message=node(),fields={'#os-catalog-first':node(),'#os-catalog-last':node(),'#os-catalog-page':node(),'#os-catalog-pages':node(),'#os-catalog-range':node(),'#os-catalog-scroll':catalog,'#os-catalog-prev':previous,'#os-catalog-next':next,'#os-grid':grid,'#os-times':node(),'#os-message':message,'#os-days':node(),'#os-count':node(),'#os-rooms':node()};
 const button={...node(),dataset:{osPlan:'p'},getBoundingClientRect:()=>({left:90-position,top:80,width:236,height:24}),setPointerCapture(){captured=true;},hasPointerCapture:()=>captured,releasePointerCapture(){captured=false;},closest:()=>button};
 const headings=data.salas.map((s,i)=>({dataset:{osHeading:s.id},getBoundingClientRect:()=>({left:i*240-position,right:(i+1)*240-position})}));
 const root={...node(),contains:target=>target===button,getBoundingClientRect:()=>({top:0}),addEventListener:(name,fn)=>(events[name]??=[]).push(fn),querySelector:s=>s==='.board'?board:s==='.schedule-body'?node():s==='.time'?{getBoundingClientRect:()=>({width:88})}:fields[s],querySelectorAll:s=>s==='[data-os-heading]'?headings:s.includes('lesson')||s==='[data-os-plan]'?[button]:[],innerHTML:''};root.classList.add('active');
 const window={innerHeight:400,addEventListener:(name,fn)=>windowEvents[name]=fn};
 const document={getElementById:()=>root,createElement:node,body:{append(){}},addEventListener:(name,fn)=>(events[name]??=[]).push(fn)};
 const context=vm.createContext({window,document,console,requestAnimationFrame:fn=>{frames.set(++id,fn);return id;},cancelAnimationFrame:i=>frames.delete(i)});
 vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../docs/aplicaciones/organizar-salas.js'),'utf8'),context);
 const applied=[],details=[];let hidden=0;
 const ctx={mostrarDetalle:id=>details.push(id),ocultarDetalle:()=>hidden++,getData:()=>data,DIAS:['Lunes'],BLOQUES:[{n:1,inicio:'08:00',fin:'08:45'}],SALA_VIRTUAL_ID:'virtual',escapeHTML:v=>String(v??''),escapeAttr:v=>String(v??''),grupo:()=>[data.planificaciones[0]],validar:()=>({ok:true}),aplicar:async(id,room)=>{applied.push(room);return{ok:false,msg:'Solo prueba'};}};
 const api=window.PlanhorAplicaciones['organizar-salas'].create(ctx);api.render();
 const emit=(name,extra={})=>{const e={target:button,button:0,isPrimary:true,pointerId:1,clientX:210,clientY:80,preventDefault(){},...extra};for(const fn of events[name]||[])fn(e);};
 let time=0;const tick=n=>{for(let k=0;k<n;k++){time+=16;const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(time));}};
 return {emit,tick,board,frames,applied,details,get hidden(){return hidden;},data,windowEvents,message,catalog,previous,next,fields,get captured(){return captured;}};
}
test('arrastre al borde desplaza continuamente y suelta en una sala antes oculta',async()=>{
 const s=setup();s.emit('pointerdown');s.emit('pointermove',{clientX:596});
 s.tick(110);assert.ok(s.board.scrollLeft>800);assert.match(s.message.textContent,/Sala 5/);
 s.emit('pointerup',{clientX:596});await Promise.resolve();assert.deepEqual(s.applied,['r5']);assert.equal(s.frames.size,0);assert.equal(s.captured,false);
});
test('el borde izquierdo retrocede y Escape detiene el desplazamiento sin trasladar',()=>{
 const s=setup();s.emit('pointerdown');s.emit('pointermove',{clientX:596});s.tick(110);const right=s.board.scrollLeft;
 s.emit('pointermove',{clientX:5});s.tick(110);assert.ok(s.board.scrollLeft<right);assert.equal(s.board.scrollLeft,0);
 s.emit('keydown',{key:'Escape'});assert.equal(s.frames.size,0);assert.equal(s.captured,false);assert.deepEqual(s.applied,[]);assert.equal(s.data.planificaciones[0].salaId,'r0');
});
test('perder el foco cancela también el bucle de arrastre',()=>{
 const s=setup();s.emit('pointerdown');s.emit('pointermove',{clientX:596});s.tick(10);s.windowEvents.blur();const stopped=s.board.scrollLeft;s.tick(30);
 assert.equal(s.board.scrollLeft,stopped);assert.equal(s.frames.size,0);assert.deepEqual(s.applied,[]);
});

test('páginas reales conservan seleccionadas salas de distintas páginas y acotan el índice',()=>{
 const s=setup(Array.from({length:41},(_,i)=>({id:'r'+i,nombre:'Sala '+(i+1)}))),before=JSON.stringify(s.data);
 const click=direction=>s.emit('click',{target:{closest:selector=>selector==='[data-os-catalog-step]'?{dataset:{osCatalogStep:String(direction)}}:null}});
 const check=id=>s.emit('change',{target:{closest:()=>({checked:true,dataset:{osRoom:id}})}});
 check('r0');assert.equal(s.catalog.classList.contains('full-page'),true);assert.equal(s.previous.disabled,true);assert.match(s.fields['#os-catalog-range'].textContent,/1–20 de 41/);
 click(1);assert.match(s.fields['#os-catalog-range'].textContent,/21–40 de 41/);assert.doesNotMatch(s.fields['#os-rooms'].innerHTML,/data-os-row="r0"/);
 click('last');assert.equal(s.catalog.classList.contains('full-page'),false);check('r40');assert.equal(s.next.disabled,true);assert.match(s.fields['#os-catalog-range'].textContent,/41–41 de 41/);
 click('first');assert.match(s.fields['#os-rooms'].innerHTML,/data-os-room="r0"[^>]*checked/);assert.match(s.fields['#os-grid'].innerHTML,/data-os-heading="r40"/);
 s.emit('change',{target:{id:'os-catalog-page',value:99}});assert.equal(s.fields['#os-catalog-page'].value,3);
 s.data.salas.splice(10);s.emit('change',{target:{id:'os-catalog-page',value:3}});assert.equal(s.fields['#os-catalog-page'].value,1);assert.equal(s.next.disabled,true);
 s.data.salas=[];s.emit('change',{target:{id:'os-catalog-page',value:0}});assert.equal(s.fields['#os-catalog-range'].textContent,'0–0 de 0 salas');assert.equal(s.previous.disabled,true);
 assert.deepEqual(s.applied,[]);assert.equal(JSON.parse(before).planificaciones[0].salaId,s.data.planificaciones[0].salaId);
});

test('catálogo ordena números naturalmente y abrevia sin alterar nombres guardados',()=>{
 const salas=[{id:'r0',nombre:'Sala 110'},{id:'r1',nombre:'Sala 2'},{id:'r2',nombre:'Sala 101'},{id:'r3',nombre:'Laboratorio B'},{id:'r4',nombre:'Aula A'}];
 const before=JSON.stringify(salas),s=setup(salas);
 const names=[...s.fields['#os-rooms'].innerHTML.matchAll(/<tr[^>]*><td>[\s\S]*?<\/td><td>([^<]+)<\/td>/g)].map(m=>m[1]);
 assert.deepEqual(names,['2','101','110','Aula A','Laboratorio B']);
 assert.equal(JSON.stringify(s.data.salas),before);assert.deepEqual(s.applied,[]);
});

test('detalle compartido aparece al apuntar/enfocar y se oculta durante arrastre',()=>{
 const s=setup();s.emit('pointermove');assert.deepEqual(s.details,['p']);
 const before=s.hidden;s.emit('pointerleave');assert.ok(s.hidden>before);
 s.emit('focusin');assert.deepEqual(s.details,['p','p']);
 s.emit('pointerdown');const hidden=s.hidden;s.emit('pointermove',{clientX:596});
 assert.deepEqual(s.details,['p','p']);assert.ok(hidden>before);assert.deepEqual(s.applied,[]);
 s.emit('keydown',{key:'Escape'});
});

test('clic fuera y Escape fuera del bloque cancelan selección y arrastre sin modificar datos',()=>{
 const s=setup(),before=JSON.stringify(s.data);
 s.emit('pointerdown');s.emit('pointermove',{clientX:596});s.tick(5);
 s.emit('pointerdown',{target:{closest:()=>null}});assert.equal(s.frames.size,0);assert.equal(s.captured,false);
 s.emit('pointerdown');s.emit('pointermove',{clientX:596});s.tick(5);
 s.emit('keydown',{key:'Escape',target:{closest:()=>null}});assert.equal(s.frames.size,0);assert.equal(s.captured,false);
 s.emit('pointerup',{clientX:596});assert.deepEqual(s.applied,[]);assert.equal(JSON.stringify(s.data),before);
});
