// F111 QZ32: consulta de quizzes para docentes sin alterar el Centro protegido.
// Read-only: abrir una vista previa no activa ni entrega evaluaciones a estudiantes.
(function(){
'use strict';
const LEVELS=[['B1','Básico I','#D5A525'],['B2','Básico II','#B42E3C'],['I1','Intermedio I','#2C75B0'],['I2','Intermedio II','#347D50']];
const LESSONS=[[4,'1–2'],[8,'3–4'],[13,'5–6'],[16,'7–8'],[21,'9–10'],[24,'11–12'],[28,'13–14'],[30,'15–16']];
const STYLE='F111-TEACHER-QUIZ-REVIEW';
function make(tag,text,className){
 const e=document.createElement(tag);
 if(text!==null&&text!==undefined)e.textContent=text;
 if(className)e.className=className;
 return e;
}
function preview(){
 const url=new URL('modulos/qz_b1_pc01_digital.html',new URL('./',location.href));
 url.searchParams.set('preview','1');
 url.searchParams.set('rol','docente');
 window.open(url.href,'_blank','noopener,noreferrer');
}
function renderGrid(container,level){
 container.replaceChildren();
 LESSONS.forEach(([lesson,units],i)=>{
  const ready=level==='B1'&&lesson===4;
  const card=make('div',null,'f111-tqr-card'+(ready?' is-ready':''));
  card.append(make('small','PROGRESS CHECK '+String(i+1).padStart(2,'0')));
  card.append(make('strong','Lección '+lesson));
  card.append(make('span','Unidades '+units));
  if(ready){
    const button=make('button','VER QUIZ ↗','f111-tqr-open');
    button.type='button';
    button.setAttribute('data-f111-quiz-preview','B1-L4');
    button.addEventListener('click',preview);
    card.append(button);
  }else{
    card.append(make('em','Pendiente de digitalizar'));
  }
  container.append(card);
 });
}
function build(){
 const box=make('section',null,'f111-tqr');
 box.setAttribute('aria-label','Revisión de material de quizzes');
 box.setAttribute('data-f111-teacher-quizzes','true');
 box.append(make('small','PROGRESS CHECK · MATERIAL DOCENTE'));
 box.append(make('h3','Revisión de material de quizzes'));
 box.append(make('p','Revisá las preguntas antes de iniciar la lección.'));
 const nav=make('div',null,'f111-tqr-levels');
 nav.setAttribute('role','group');
 nav.setAttribute('aria-label','Seleccionar nivel');
 const grid=make('div',null,'f111-tqr-grid');
 let selected='B1';
 const buttons=[];
 LEVELS.forEach(([code,label,color])=>{
  const b=make('button',code+' · '+label,'f111-tqr-level');
  b.type='button';
  b.dataset.level=code;
  b.style.setProperty('--f111-level-color',color);
  b.addEventListener('click',()=>{
   selected=code;
   buttons.forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.level===selected)));
   renderGrid(grid,selected);
  });
  buttons.push(b);nav.append(b);
 });
 box.append(nav,grid,make('p','Vista previa docente · No habilita estudiantes ni registra notas.','f111-tqr-foot'));
 buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.level===selected)));
 renderGrid(grid,selected);
 return box;
}
function attach(){
 const screen=document.querySelector('section[data-screen-label="Docente · Exámenes"]');
 if(!screen||screen.querySelector('[data-f111-teacher-quizzes]'))return;
 const heading=Array.from(screen.children).find(el=>(el.textContent||'').includes('EXÁMENES DEL DOCENTE'));
 if(!heading)return;
 heading.insertAdjacentElement('afterend',build());
}
function installStyle(){
 if(document.getElementById(STYLE))return;
 const s=make('style');s.id=STYLE;
 s.textContent=[
 '.f111-tqr{background:#fff;border:1px solid #D6E0EB;border-radius:14px;padding:16px;margin:2px 0;box-shadow:0 3px 12px rgba(10,55,92,.04)}',
 '.f111-tqr>small{font-size:10px;letter-spacing:.12em;font-weight:900;color:#8C6B1C}',
 '.f111-tqr h3{font-size:19px;color:#113A61;font-weight:900;margin:5px 0}',
 '.f111-tqr p{font-size:12px;color:#556F86;margin:5px 0 12px}',
 '.f111-tqr-levels{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:13px}',
 '.f111-tqr-level{border:1px solid #D2DCE7;border-radius:9px;background:white;padding:8px 11px;color:#193F65;font-weight:800;font-size:11px;cursor:pointer}',
 '.f111-tqr-level[aria-pressed=true]{border:2px solid var(--f111-level-color);background:#F5F9FE}',
 '.f111-tqr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:9px}',
 '.f111-tqr-card{border:1px solid #DAE3ED;background:#F9FBFD;border-radius:10px;padding:11px;display:flex;flex-direction:column;gap:5px}',
 '.f111-tqr-card.is-ready{background:#FFFCED;border-color:#E0C271}',
 '.f111-tqr-card small{font-size:9px;color:#657A91;font-weight:900;letter-spacing:.04em}',
 '.f111-tqr-card strong{font-size:14px;font-weight:900;color:#143C63}',
 '.f111-tqr-card span{font-size:11px;color:#697C91}',
 '.f111-tqr-card em{font-size:10px;font-style:normal;color:#7A8A9A;margin-top:7px}',
 '.f111-tqr-open{padding:9px 10px;border-radius:8px;background:#F2C83D;color:#173959;border:1px solid #D9B12B;font-size:11px;font-weight:900;cursor:pointer;margin-top:4px}',
 '.f111-tqr .f111-tqr-foot{font-size:11px;color:#667D92;margin:12px 0 0}'
 ].join('\n');
 document.head.append(s);
}
function install(){
 const root=document.getElementById('root');
 if(!root)return;
 installStyle();
 let queued=false;
 const observer=new MutationObserver(()=>{
  if(queued)return;
  queued=true;
  queueMicrotask(()=>{queued=false;attach()});
 });
 observer.observe(root,{subtree:true,childList:true});
 attach();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
