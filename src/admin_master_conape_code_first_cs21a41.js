// F98.4-Z6-CS21A41 · Código primero y seleccionable en Seguimiento inmediato.
(function(){
'use strict';
const BUILD='F98.4-Z6-CS21A41';

function enhance(){
  document.querySelectorAll('.master-conape-month-table tbody tr').forEach(function(row){
    const cell=row.cells&&row.cells[0];
    if(!cell||cell.querySelector('.master-conape-student-code-wrap'))return;
    const name=cell.children[0];
    const meta=cell.children[1];
    const identity=meta&&meta.querySelector('small');
    if(!name||!meta||!identity)return;
    const raw=String(identity.textContent||'').trim();
    const split=raw.lastIndexOf('·');
    if(split<0)return;
    const cedula=raw.slice(0,split).trim();
    const code=raw.slice(split+1).trim();
    if(!code)return;

    const wrap=document.createElement('label');
    wrap.className='master-conape-student-code-wrap';
    wrap.title='Código '+code+' · clic para seleccionar';

    const label=document.createElement('span');
    label.className='master-conape-student-code-label';
    label.textContent='CÓDIGO';

    const input=document.createElement('input');
    input.className='master-conape-student-code-input';
    input.type='text';
    input.value=code;
    input.readOnly=true;
    input.setAttribute('aria-label','Código del estudiante '+code);
    input.addEventListener('focus',function(){this.select();});
    input.addEventListener('click',function(){this.select();});

    const action=document.createElement('span');
    action.className='master-conape-student-code-action';
    action.textContent='CLIC + CTRL C';

    wrap.appendChild(label);
    wrap.appendChild(input);
    wrap.appendChild(action);
    cell.insertBefore(wrap,name);
    cell.classList.add('master-conape-student-cell');
    name.classList.add('master-conape-student-name');
    meta.classList.add('master-conape-student-meta');
    identity.classList.add('master-conape-student-id');
    identity.textContent=cedula||'Sin cédula';
  });
  window.__AN_MASTER_CONAPE_CODE_FIRST_BUILD__=BUILD;
}

const root=document.getElementById('root')||document.body;
new MutationObserver(enhance).observe(root,{childList:true,subtree:true});
window.addEventListener('an:lazy-module-loaded',function(){window.setTimeout(enhance,0);});
window.setTimeout(enhance,0);
})();
