// F98.4-Z6-CS21A28 · Panel Maestro CONAPE: acceso directo a Consulta individual.
(function(){
  'use strict';
  const BUILD='F98.4-Z6-CS21A28';
  function codigoFila(tr){
    const small=tr?.querySelector('td:first-child small');
    const text=String(small?.textContent||'');
    const parts=text.split('·').map(x=>x.trim()).filter(Boolean);
    const last=parts[parts.length-1]||'';
    if(/^\d{4,7}$/.test(last))return last;
    const m=text.match(/(?:^|\s)(\d{4,7})(?:\s|$)/g);
    return m?.length?String(m[m.length-1]).trim():'';
  }
  function abrir(codigo){
    if(!codigo)return;
    try{
      sessionStorage.setItem('an_consulta_prefill',JSON.stringify({codigo,origen:'panel_maestro_conape',forceFresh:true}));
      localStorage.setItem('an_active','buscador');
      localStorage.setItem('an_active_admin','buscador');
    }catch(_){ }
    window.location.reload();
  }
  function style(){
    if(document.getElementById('an-conape-consulta-style'))return;
    const s=document.createElement('style');s.id='an-conape-consulta-style';s.textContent=`
      .an-conape-consulta-btn{display:block;width:100%;margin-top:7px;padding:6px 8px;border-radius:8px;border:1px solid #002F6C;background:#fff;color:#002F6C;font:800 10px/1.2 Poppins,sans-serif;cursor:pointer}
      .an-conape-consulta-btn:hover{background:#EEF4FF}.an-conape-consulta-btn:focus-visible{outline:3px solid rgba(0,47,108,.2);outline-offset:2px}
    `;document.head.appendChild(s);
  }
  function apply(){
    style();
    document.querySelectorAll('.master-conape-month-table tbody tr').forEach(tr=>{
      const status=tr.querySelector('.master-link-status.linked');
      if(!status)return;
      const td=status.closest('td');
      if(!td||td.querySelector('.an-conape-consulta-btn'))return;
      const codigo=codigoFila(tr);if(!codigo)return;
      const b=document.createElement('button');b.type='button';b.className='an-conape-consulta-btn';b.textContent='Consulta';b.dataset.codigo=codigo;
      b.addEventListener('click',()=>abrir(codigo));td.appendChild(b);
    });
  }
  let pending=false;function schedule(){if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;apply();});}
  window.addEventListener('an:lazy-module-loaded',schedule);new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  window.__AN_CONAPE_CONSULTA_BUILD__=BUILD;setTimeout(schedule,0);
})();
