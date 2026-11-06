// Ajuste exclusivo de presentación. Las medidas viven en el panel, nunca
// en la grilla clonada por los exportadores de ancho fijo.
(() => {
 const ficha=document.getElementById('panelFichaDocente');
 const horarios=document.getElementById('panelVistaHorarios');
 let frame=0;
 function ajustar(){
  frame=0;
  for(const panel of [ficha,horarios]){
   if(!panel?.classList.contains('active'))continue;
   const general=panel===horarios&&document.getElementById('vistaTipo')?.value==='general';
   panel.dataset.screenFit=String(!general);
   if(general)continue;
   const alto=Math.max(240,window.innerHeight-panel.getBoundingClientRect().top-2);
   panel.style.setProperty('--screen-panel-height',alto+'px');
   const rows=panel===ficha?Math.max(0,(panel.querySelector('.teacher-sheet-main table')?.rows.length||1)-1):panel.querySelectorAll('#vistaGrid .grid-time').length;
   panel.style.setProperty('--screen-grid-rows',String(rows||18));
   if(panel===ficha){
    const table=panel.querySelector('.teacher-sheet-main table');
    if(table&&rows){
     const line=Math.min(10,Math.max(5,(table.getBoundingClientRect().height-26)/rows/3));
     panel.style.setProperty('--screen-sheet-line',line+'px');
    }
   }else{
    const grid=panel.querySelector('#vistaGrid');
    if(grid&&rows){
     const lines=Math.max(3,...[...grid.querySelectorAll('.grid-cell.planned')].map(cell=>cell.children.length));
     const line=Math.min(11,Math.max(5,((grid.getBoundingClientRect().height-26)/rows-1)/lines));
     panel.style.setProperty('--screen-vista-line',line+'px');
    }
   }
  }
 }
 function programar(){if(!frame)frame=requestAnimationFrame(ajustar);}
 for(const panel of [ficha,horarios])if(panel)new MutationObserver(programar).observe(panel,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 window.addEventListener('resize',programar);
 document.addEventListener('change',event=>{if(event.target.closest?.('#panelFichaDocente,#panelVistaHorarios'))programar();});
 programar();
})();
