// CS21A77 · Asistencia docente · helpers
(function(){
'use strict';
const A=window.ANAtt77=window.ANAtt77||{};
const C={navy:'#002F6C',ink:'#001E47',wine:'#7A1E2C',purple:'#6A3D91',green:'#16834A',red:'#B3261E',amber:'#A45D00',line:'var(--line,#E5E0D8)'};
const txt=v=>String(v==null?'':v).trim();
const up=v=>txt(v).toUpperCase();
const norm=v=>txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim();
const code=g=>typeof g==='string'?txt(g):txt(g&&(g.code||g.cod_grupo||g.codigo_grupo||g.grupo||g.id));
const level=n=>({B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'})[up(n)]||txt(n)||'Nivel';
const rail=l=>txt(l&&(l.riel||l.RIEL)).toLowerCase()==='ican'||up(l&&l.tipo)==='ICAN'?'ican':'curso';
const key=l=>{try{if(typeof window.tvLessonKeyF97==='function')return window.tvLessonKeyF97(l);}catch(_){}return rail(l)+':'+Number(l&&l.leccion||0);};
const label=(l,short)=>{const n=Number(l&&l.leccion||0);if(rail(l)==='ican')return(short?'I CAN ':'Club I CAN · ')+String(n).padStart(2,'0');const e={9:'Oral 1',17:'Oral 2',18:'Escrito 1',25:'Oral 3',31:'Oral 4',32:'Escrito 2'};return e[n]||(short?'Lec ':'Lección ')+String(n).padStart(2,'0');};
const date=v=>{const s=txt(v).slice(0,10),d=new Date(s+'T12:00:00');return !s?'Sin fecha':Number.isNaN(d.getTime())?s:d.toLocaleDateString('es-CR',{day:'2-digit',month:'short',year:'numeric'});};
const rows=ls=>(ls||[]).filter(l=>up(l&&l.tipo)!=='FERIADO').slice().sort((a,b)=>txt(a.fecha).localeCompare(txt(b.fecha))||rail(a).localeCompare(rail(b))||Number(a.leccion)-Number(b.leccion));
function bucket(src,l,c){if(!src)return null;const n=String(Number(l&&l.leccion||0)),r=rail(l),ks=[key(l),n,r+':'+n,r+'_'+n];for(const k of ks){const b=src[k];if(b&&Object.prototype.hasOwnProperty.call(b,c))return b[c];}return null;}
function present(v){if(v==null)return null;if(typeof v==='boolean')return v;if(typeof v==='number')return v>0;if(typeof v==='object')return present(v.presente??v.PRESENTE??v.estado??v.ESTADO??v.asistencia);const s=up(v);if(['P','PRESENTE','SI','SÍ','TRUE','1'].includes(s))return true;if(['A','AUSENTE','NO','FALSE','0'].includes(s))return false;return null;}
function comment(src,l,c){const v=bucket(src,l,c);return typeof v==='string'?txt(v):txt(v&&(v.comentario||v.COMENTARIO||v.detalle||v.texto));}
const pct=a=>Number.isFinite(Number(a&&(a.pct??a.porcentaje)))?Math.round(Number(a.pct??a.porcentaje)):null;
const grade=n=>Number.isFinite(Number(n&&(n.nota_total??n.total??n.nota)))?Number(n.nota_total??n.total??n.nota):null;
const tone=v=>v==null?'#98A2B3':v<70?C.red:v<80?C.amber:C.green;
function signal(p,g){if((p!=null&&p<70)||(g!=null&&g<70))return{label:'Seguimiento prioritario',c:C.red,b:'#FDECEA'};if((p!=null&&p<80)||(g!=null&&g<80))return{label:'Revisar evolución',c:C.amber,b:'#FFF4D6'};return{label:'Evolución estable',c:C.green,b:'#EAF8EF'};}
Object.assign(A,{C,txt,up,norm,code,level,rail,key,label,date,rows,bucket,present,comment,pct,grade,tone,signal});
})();
