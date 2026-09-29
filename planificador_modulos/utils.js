(function(){
    function genId(){
        if(typeof crypto!=='undefined'&&crypto.randomUUID) return crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{
            const r=Math.random()*16|0; return(c==='x'?r:(r&0x3|0x8)).toString(16);
        });
    }
    function escapeHTML(valor){
        return String(valor??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }
    function escapeAttr(valor){ return escapeHTML(valor).replace(/`/g,'&#96;'); }
    function optionHTML(valor, texto, selected=false, disabled=false){
        return `<option value="${escapeAttr(valor)}"${selected?' selected':''}${disabled?' disabled':''}>${escapeHTML(texto)}</option>`;
    }
    function limpiarTexto(valor, max=250){
        return String(valor??'').replace(/[\u0000-\u001F\u007F]/g,'').trim().slice(0,max);
    }
    function colorSeguro(valor, fallback=''){
        const color=String(valor||'').trim();
        return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color) ? color : fallback;
    }
    function limpiarImportado(valor, profundidad=0){
        if(profundidad>8) return null;
        if(valor===null || typeof valor==='number' || typeof valor==='boolean') return valor;
        if(typeof valor==='string') return limpiarTexto(valor, 500);
        if(Array.isArray(valor)) return valor.slice(0, 5000).map(v=>limpiarImportado(v, profundidad+1));
        if(typeof valor==='object'){
            const limpio={};
            Object.keys(valor).forEach(k=>{
                if(['__proto__','prototype','constructor'].includes(k)) return;
                limpio[limpiarTexto(k,80)] = limpiarImportado(valor[k], profundidad+1);
            });
            return limpio;
        }
        return null;
    }

    window.PlanificadorUtils = {
        genId,
        escapeHTML,
        escapeAttr,
        optionHTML,
        limpiarTexto,
        colorSeguro,
        limpiarImportado
    };
})();
