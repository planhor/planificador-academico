// Organizar salas: vista de la semana ideal sobre el estado compartido de Planhor.
(function(){
    window.PlanhorAplicaciones=window.PlanhorAplicaciones||{};
    window.PlanhorAplicaciones['organizar-salas']={create(ctx){
        for(const servicio of ['grupo','validar','aplicar']){if(typeof ctx[servicio]!=='function')throw new Error('Recarga la app para cargar el servicio de planificación actualizado.');}
        const root=document.getElementById('panelOrganizarSalas');
        const vistas=new Map();
        let state,drag=null,busy=false,scrollFrame=0,scrollTime=0;
        const h=ctx.escapeHTML,attr=ctx.escapeAttr;
        const $=id=>root.querySelector('#os-'+id);
        const data=()=>ctx.getData();
        const periodo=()=>String(data().sel?.temporadaId||'');
        const nombreSala=s=>String(s.nombre||'Sin nombre').replace(/^sala\s+/i,'').trim();
        const ordenSalas=new Intl.Collator('es',{numeric:true,sensitivity:'base'});
        const rooms=()=>data().salas.filter(s=>!s.esVirtual&&String(s.id)!==String(ctx.SALA_VIRTUAL_ID)).sort((a,b)=>ordenSalas.compare(nombreSala(a),nombreSala(b)));
        const room=id=>data().salas.find(s=>String(s.id)===String(id));
        const plan=id=>data().planificaciones.find(p=>String(p.id)===String(id));
        const grupo=p=>p?ctx.grupo(p.id,state.moveMode||'single'):[];
        const nombre=p=>{
            const a=data().asignaturas.find(a=>String(a.id)===String(p.asignaturaId));
            return a?[a.codigo,a.nombre].filter(Boolean).join(' - '):(p.nombreExterno||p.nombre||'Carga externa');
        };
        function vista(){
            const key=periodo();
            if(!vistas.has(key)) vistas.set(key,{day:0,page:1,visible:new Set(),selected:null,keyboardRoom:null});
            return vistas.get(key);
        }
        function notify(msg,tone='normal'){
            const instruction='Arrastra para cambiar de sala';
            const routine=msg.startsWith('Arrastra horizontalmente')||msg==='Selección cancelada.';
            const short=msg.length<=40?msg:instruction;
            $('message').textContent=routine?instruction:short;
            $('message').dataset.tone=routine?'normal':tone;
            if(!drag&&!routine&&msg.length>40&&tone!=='normal')ctx.toast?.(msg,tone==='blocked'?'warning':tone==='success'?'success':'info');
        }
        function bloques(p){return grupo(p).map(p=>Number(p.bloque));}
        function snapshot(p){
            const campos=['id','salaId','dia','bloque','asignaturaId','seccionId','componenteId','docenteId','fijo'];
            return {temporadaId:data().sel?.temporadaId,modo:state.moveMode||'single',bloques:grupo(p).map(p=>Object.fromEntries(campos.map(k=>[k,p[k]??null])))};
        }
        function paint(targetId=null){
            const source=plan(state.selected),group=grupo(source),ids=new Set(group.map(p=>String(p.id)));
            root.querySelectorAll('[data-os-plan]').forEach(button=>button.setAttribute('aria-pressed',String(ids.has(button.dataset.osPlan))));
            root.querySelectorAll('.slot').forEach(cell=>{
                cell.classList.remove('available','unavailable','drop-target','drop-blocked');
                if(!source||!bloques(source).includes(Number(cell.dataset.block))||String(source.salaId)===cell.dataset.room)return;
                const result=ctx.validar(source.id,cell.dataset.room,snapshot(source));
                cell.classList.add(result.ok?'available':'unavailable');
                if(String(targetId)===cell.dataset.room)cell.classList.add(result.ok?'drop-target':'drop-blocked');
                cell.title=result.ok?(result.advertencia||'Sala disponible'):result.msg;
            });
        }
        const SALAS_POR_PAGINA=20;
        function renderCatalogo(catalog=rooms()){
            const pages=Math.max(1,Math.ceil(catalog.length/SALAS_POR_PAGINA));
            state.page=Math.max(1,Math.min(pages,Math.trunc(Number(state.page))||1));
            const start=(state.page-1)*SALAS_POR_PAGINA;
            const pageRooms=catalog.slice(start,start+SALAS_POR_PAGINA);
            $('catalog-scroll').classList.toggle('full-page',pageRooms.length===SALAS_POR_PAGINA);
            $('rooms').innerHTML=pageRooms.map(s=>`<tr data-os-row="${attr(s.id)}"><td><input type="checkbox" data-os-room="${attr(s.id)}" aria-label="Mostrar ${attr(s.nombre)}" ${state.visible.has(String(s.id))?'checked':''}></td><td>${h(nombreSala(s))}</td><td>${s.ilimitada?'—':h(s.capacidad||'—')}</td><td>${h(s.tipoSala||'—')}</td></tr>`).join('')||'<tr><td colspan="4">No hay salas cargadas.</td></tr>';
            $('catalog-page').value=state.page;
            $('catalog-page').max=pages;
            $('catalog-pages').textContent=pages;
            $('catalog-range').textContent=(catalog.length?start+1:0)+'–'+Math.min(start+SALAS_POR_PAGINA,catalog.length)+' de '+catalog.length+' salas';
            $('catalog-first').disabled=$('catalog-prev').disabled=state.page===1;
            $('catalog-last').disabled=$('catalog-next').disabled=state.page===pages;
        }
        function recorrerSalas(action){
            const pages=Math.max(1,Math.ceil(rooms().length/SALAS_POR_PAGINA));
            state.page=action==='first'?1:action==='last'?pages:state.page+Number(action);
            renderCatalogo();$('catalog-scroll').scrollTop=0;
        }
        function ajustarAltura(){
            if(!root.classList.contains('active'))return;
            const height=Math.max(360,window.innerHeight-root.getBoundingClientRect().top);
            root.style.setProperty('--os-height',height+'px');
            const board=root.querySelector('.board');
            root.style.setProperty('--os-scrollbar',(board.offsetHeight-board.clientHeight)+'px');
        }
        function render(){
            cleanup();state=vista();
            const catalog=rooms();
            const validIds=new Set(catalog.map(s=>String(s.id)));
            state.visible.forEach(id=>{if(!validIds.has(id))state.visible.delete(id);});
            if(!plan(state.selected))state.selected=null;
            $('days').innerHTML=ctx.DIAS.map((d,i)=>`<button class="btn" type="button" data-os-day="${i}" title="${h(d)}" aria-label="${attr(d)}" aria-pressed="${state.day===i}">${['Lu','Ma','Mi','Ju','Vi','Sá'][i]||h(d)}</button>`).join('');
            renderCatalogo(catalog);
            $('count').textContent=state.visible.size+' de '+catalog.length+' visibles';
            const shown=catalog.filter(s=>state.visible.has(String(s.id)));
            const grid=$('grid');
            grid.classList.toggle('is-empty',!shown.length);
            root.querySelector('.schedule-body').classList.toggle('no-rooms',!shown.length);
            $('times').style.setProperty('--os-rows',ctx.BLOQUES.length);
            $('times').innerHTML=shown.length?'<div class="grid-heading">'+h(ctx.DIAS[state.day])+'</div>'+ctx.BLOQUES.map(b=>`<div class="time"><strong>B${b.n}</strong><small>${h(b.inicio)}–${h(b.fin)}</small></div>`).join(''):'';
            grid.style.setProperty('--room-count',shown.length||1);grid.style.setProperty('--os-rows',ctx.BLOQUES.length);
            let html='';
            if(!shown.length)html='<div class="empty"><strong>Elige las salas que quieres comparar</strong><span>Marca sus casillas en el listado de la izquierda.</span></div>';
            else {
                html='';
                shown.forEach((s,i)=>html+=`<div class="grid-heading" data-os-heading="${attr(s.id)}" style="grid-column:${i+1};grid-row:1"><strong title="${attr(s.nombre)} (${s.ilimitada?'Sin límite':attr(s.capacidad||'s/d')})">${h(s.nombre)} (${s.ilimitada?'Sin límite':h(s.capacidad||'s/d')})</strong></div>`);
                const plans=data().planificaciones.filter(p=>p.tipoPresencial!==false&&Number(p.dia)===state.day);
                ctx.BLOQUES.forEach((b,index)=>{

                    shown.forEach((s,i)=>{
                        const items=plans.filter(p=>String(p.salaId)===String(s.id)&&Number(p.bloque)===b.n);
                        html+=`<div class="slot" data-room="${attr(s.id)}" data-block="${b.n}" style="grid-column:${i+1};grid-row:${index+2}">${items.map(p=>{
                            const sec=data().secciones.find(s=>String(s.id)===String(p.seccionId));
                            const title=[nombre(p),sec?.nombre||'',s.nombre,ctx.DIAS[state.day]+' B'+b.n,p.fijo?'Bloque fijo':''].filter(Boolean).join(' · ');
                            return `<button type="button" class="lesson" style="--om-subject-color:${attr(ctx.colorAsignaturaPlanhor?.(data().asignaturas.find(a=>String(a.id)===String(p.asignaturaId)))||'#dce4ec')}" data-os-plan="${attr(p.id)}" aria-label="${attr(title)}" aria-pressed="false">${p.fijo?'🔒 ':''}<span class="lesson-name">${h(data().asignaturas.find(a=>String(a.id)===String(p.asignaturaId))?.nombre||nombre(p))}</span><span class="lesson-section">${h(sec?.nombre||'Sin sección')}</span></button>`;
                        }).join('')}</div>`;
                    });
                });
            }
            grid.innerHTML=html;
            paint();ajustarAltura();
        }
        async function move(p,destination,expected){
            if(busy||String(p.salaId)===String(destination.id))return;
            busy=true;
            try{
                const result=await ctx.aplicar(p.id,destination.id,expected);
                if(String(expected.temporadaId||'')===periodo()){
                    if(!result.ok)render();
                    notify(result.ok?`${result.cantidad} bloque(s) trasladados a ${destination.nombre}. ${result.msg}`:result.msg,result.ok?'success':'blocked');
                }
            }catch(error){
                console.error('Organizar salas:',error);
                render();notify('No se pudo completar el traslado. Revisa el estado de guardado.','blocked');
            }finally{busy=false;}
        }
        function roomAt(x,y){
            const board=root.querySelector('.board'),bounds=board.getBoundingClientRect();
            const timeWidth=0;
            if(x<bounds.left+timeWidth||x>=bounds.right||y<bounds.top||y>=bounds.top+board.clientHeight)return null;
            const heading=[...root.querySelectorAll('[data-os-heading]')].find(e=>{const r=e.getBoundingClientRect();return x>=r.left&&x<r.right;});
            return heading?room(heading.dataset.osHeading):null;
        }
        function updateTarget(){
            if(!drag?.active)return;
            const target=roomAt(drag.lastX,drag.lastY);if(target?.id===drag.target?.id)return;
            drag.target=target;paint(target?.id);
            if(!target){drag.ghost.classList.add('invalid');return notify('Suelta dentro de una sala para trasladar.','blocked');}
            if(String(target.id)===String(drag.source.salaId)){drag.ghost.classList.remove('invalid');return notify('Sala de origen. Arrastra horizontalmente hacia otra sala.');}
            const result=ctx.validar(drag.source.id,target.id,drag.expected);
            drag.ghost.classList.toggle('invalid',!result.ok);
            notify(result.ok?(result.advertencia||`Soltar en ${target.nombre}`):result.msg,result.ok?'success':'blocked');
        }
        function scrollWhileDragging(time){
            scrollFrame=0;if(!drag?.active)return;
            const board=root.querySelector('.board'),rect=board.getBoundingClientRect();
            const left=rect.left;
            const band=48,maxSpeed=620,dt=Math.min(32,scrollTime?time-scrollTime:16);scrollTime=time;
            let speed=0;
            if(drag.lastY>=rect.top&&drag.lastY<rect.top+board.clientHeight&&drag.lastX>=rect.left&&drag.lastX<=rect.right){
                if(drag.lastX>rect.right-band)speed=maxSpeed*Math.min(1,(drag.lastX-(rect.right-band))/band);
                else if(drag.lastX<left+band)speed=-maxSpeed*Math.min(1,(left+band-drag.lastX)/band);
            }
            const previous=board.scrollLeft;
            if(speed)board.scrollLeft+=speed*dt/1000;
            if(board.scrollLeft!==previous)updateTarget();
            scrollFrame=requestAnimationFrame(scrollWhileDragging);
        }
        function revealRoom(id){
            const board=root.querySelector('.board'),heading=[...root.querySelectorAll('[data-os-heading]')].find(e=>e.dataset.osHeading===String(id));
            if(!heading)return;
            const viewport=board.getBoundingClientRect(),r=heading.getBoundingClientRect();
            const left=viewport.left;
            if(r.left<left)board.scrollLeft-=left-r.left;
            else if(r.right>viewport.right)board.scrollLeft+=r.right-viewport.right;
        }
        function cleanup(){
            ctx.ocultarDetalle?.();
            if(scrollFrame)cancelAnimationFrame(scrollFrame);scrollFrame=0;scrollTime=0;
            if(!drag)return;
            drag.ghost?.remove();root.querySelectorAll('.drag-source').forEach(e=>e.classList.remove('drag-source'));
            if(drag.button.hasPointerCapture(drag.id))drag.button.releasePointerCapture(drag.id);
            root.classList.remove('os-dragging');drag=null;
        }
        function deseleccionarBloque(){
            cleanup();state.selected=null;state.keyboardRoom=null;paint();
            root.querySelector('[data-os-plan]:focus')?.blur();
            notify('Arrastra horizontalmente para cambiar de sala.');
        }
        document.addEventListener('pointerdown',event=>{
            if(!state||!root.classList.contains('active'))return;
            const button=event.target.closest?.('[data-os-plan]');
            if(button&&root.contains(button))return;
            deseleccionarBloque();
        },true);
        document.addEventListener('keydown',event=>{
            if(event.key==='Escape'&&state&&root.classList.contains('active'))deseleccionarBloque();
        },true);
        root.innerHTML=`<button type="button" class="os-mobile-toggle" id="os-mobile-toggle" aria-expanded="false">Elegir salas y día ▾</button><div class="workspace"><aside class="room-catalog" aria-label="Selección de salas"><div class="page-heading"><h2>Organizar salas</h2><p class="organizer-status" id="os-message" role="status" aria-live="polite">Arrastra para cambiar de sala</p></div><div class="day-picker"><span class="field-label">Día</span><div class="days" id="os-days" role="group" aria-label="Día del organizador"></div></div><div class="catalog-heading"><strong>Salas</strong><span id="os-count"></span></div><div class="catalog-scroll" id="os-catalog-scroll"><table><thead><tr><th aria-label="Seleccionar"></th><th>Sala</th><th>Cupo</th><th>Tipo</th></tr></thead><tbody id="os-rooms"></tbody></table></div><nav class="catalog-nav" aria-label="Páginas de salas"><div class="catalog-controls"><button type="button" class="btn" id="os-catalog-first" data-os-catalog-step="first" aria-label="Primera página de salas">«</button><button type="button" class="btn" id="os-catalog-prev" data-os-catalog-step="-1" aria-label="Salas anteriores">‹</button><label class="catalog-page"><input id="os-catalog-page" type="number" min="1" step="1" aria-label="Página de salas"> de <span id="os-catalog-pages"></span></label><button type="button" class="btn" id="os-catalog-next" data-os-catalog-step="1" aria-label="Salas siguientes">›</button><button type="button" class="btn" id="os-catalog-last" data-os-catalog-step="last" aria-label="Última página de salas">»</button></div><span id="os-catalog-range" role="status" aria-live="polite"></span></nav></aside><div class="schedule-area"><div class="schedule-body"><div class="time-rail" id="os-times" aria-label="Bloques horarios"></div><section class="board" aria-label="Ocupación de las salas"><div class="room-grid" id="os-grid"></div></section></div><div class="legend"><span><i class="sample occupied"></i>Clase</span><span><i class="sample available"></i>Destino disponible</span><span><i class="sample blocked"></i>Destino no permitido</span><small>← → y Enter · Esc cancela</small></div></div></div>`;
        root.addEventListener('change',event=>{
            if(event.target.id==='os-catalog-page'){state.page=Number(event.target.value);renderCatalogo();$('catalog-scroll').scrollTop=0;return;}
            const check=event.target.closest('[data-os-room]');if(!check)return;
            if(check.checked)state.visible.add(check.dataset.osRoom);else state.visible.delete(check.dataset.osRoom);
            state.selected=null;state.keyboardRoom=null;render();notify('Arrastra horizontalmente para cambiar de sala.');
        });
        root.addEventListener('click',event=>{
            if(event.target.id==='os-mobile-toggle'){const open=root.classList.toggle('os-catalog-open');$('mobile-toggle').setAttribute('aria-expanded',String(open));$('mobile-toggle').textContent=open?'Ver grilla ▴':'Elegir salas y día ▾';return;}
            const navigation=event.target.closest('[data-os-catalog-step]');
            if(navigation){recorrerSalas(navigation.dataset.osCatalogStep);return;}
            const day=event.target.closest('[data-os-day]');
            if(day){state.day=Number(day.dataset.osDay);state.selected=null;state.keyboardRoom=null;render();notify('Arrastra horizontalmente para cambiar de sala.');}
            const row=event.target.closest('[data-os-row]');if(row&&!event.target.closest('input'))row.querySelector('input').click();
        });
        root.addEventListener('pointermove',event=>{
            if(drag)return;
            const button=event.target.closest('[data-os-plan]');
            if(button)ctx.mostrarDetalle?.(button.dataset.osPlan,event);
            else ctx.ocultarDetalle?.();
        });
        root.addEventListener('pointerleave',()=>ctx.ocultarDetalle?.());
        root.addEventListener('focusin',event=>{
            const button=event.target.closest('[data-os-plan]');if(!button||drag)return;
            const rect=button.getBoundingClientRect();
            ctx.mostrarDetalle?.(button.dataset.osPlan,{clientX:rect.left+rect.width/2,clientY:rect.bottom});
        });
        root.addEventListener('focusout',()=>ctx.ocultarDetalle?.());
        root.addEventListener('pointerdown',event=>{
            ctx.ocultarDetalle?.();
            const button=event.target.closest('[data-os-plan]');if(!button||event.button!==0||!event.isPrimary||busy)return;
            const p=plan(button.dataset.osPlan);if(!p)return;
            state.selected=p.id;state.keyboardRoom=null;state.moveMode=(event.ctrlKey||event.metaKey)?'continuo':'single';paint();
            const group=grupo(p);
            if(!group.length||group.some(p=>p.fijo))return notify('Este grupo contiene bloques fijos o se modifica desde Planificación.','blocked');
            drag={button,source:p,id:event.pointerId,x:event.clientX,y:event.clientY,lastX:event.clientX,lastY:event.clientY,rect:button.getBoundingClientRect(),active:false,ghost:null,target:null,expected:snapshot(p)};
            button.setPointerCapture(event.pointerId);
            notify(`${nombre(p)} · ${group.length} bloque(s) del mismo día, sección, componente y sala.`);
        });
        document.addEventListener('pointermove',event=>{
            if(!drag||event.pointerId!==drag.id)return;
            drag.lastX=event.clientX;drag.lastY=event.clientY;
            const dx=event.clientX-drag.x;if(!drag.active&&Math.hypot(dx,event.clientY-drag.y)<5)return;
            if(!drag.active){
                drag.active=true;root.classList.add('os-dragging');root.querySelectorAll('.lesson[aria-pressed="true"]').forEach(e=>e.classList.add('drag-source'));
                drag.ghost=document.createElement('div');drag.ghost.className='os-drag-ghost';drag.ghost.setAttribute('aria-hidden','true');drag.ghost.textContent=nombre(drag.source);
                Object.assign(drag.ghost.style,{left:drag.rect.left+'px',top:drag.rect.top+'px',width:drag.rect.width+'px',height:drag.rect.height+'px'});document.body.append(drag.ghost);
                scrollFrame=requestAnimationFrame(scrollWhileDragging);
            }
            event.preventDefault();drag.ghost.style.transform=`translate3d(${dx}px,0,0)`;
            updateTarget();
        },{passive:false});
        document.addEventListener('pointerup',event=>{
            if(!drag||event.pointerId!==drag.id)return;
            const {source,expected,active}=drag,target=active?roomAt(event.clientX,event.clientY):null;cleanup();
            if(target&&String(target.id)!==String(source.salaId))void move(source,target,expected);
            else if(active)notify('Traslado cancelado.');
            paint();
        });
        document.addEventListener('pointercancel',()=>{if(drag){cleanup();paint();notify('Traslado cancelado.');}});
        root.addEventListener('keydown',event=>{
            if(event.key==='Escape')return;
            const button=event.target.closest('[data-os-plan]');if(!button||busy)return;
            const p=plan(button.dataset.osPlan);if(!p)return;state.selected=p.id;
            if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
                event.preventDefault();const shown=rooms().filter(s=>state.visible.has(String(s.id))),index=shown.findIndex(s=>String(s.id)===String(state.keyboardRoom||p.salaId));
                const target=shown[Math.max(0,Math.min(shown.length-1,index+(event.key==='ArrowRight'?1:-1)))];if(!target)return;
                state.keyboardRoom=target.id;revealRoom(target.id);paint(target.id);const result=ctx.validar(p.id,target.id,snapshot(p));
                notify(result.ok?target.nombre+': pulsa Enter para trasladar.':result.msg,result.ok?'normal':'blocked');
            }else if(event.key==='Enter'&&state.keyboardRoom){event.preventDefault();void move(p,room(state.keyboardRoom),snapshot(p));}
        });
        window.addEventListener('resize',ajustarAltura);
        window.addEventListener('blur',()=>{if(drag){cleanup();paint();notify('Traslado cancelado.');}});
        if(window.ResizeObserver)new ResizeObserver(ajustarAltura).observe(root);
        return {render};
    }};
})();
