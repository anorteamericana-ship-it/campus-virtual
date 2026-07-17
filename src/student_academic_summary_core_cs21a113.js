// F98.4-Z6-CS21A113 · Núcleo de normalización del Resumen Académico.
(function(){
  'use strict';
  const LEVELS=['B1','B2','I1','I2'];
  const NAMES={B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'};
  const BOOKS={B1:'Interchange Intro',B2:'Interchange 1',I1:'Interchange 2',I2:'Interchange 3'};
  const COLORS={B1:'#D7A321',B2:'#D53B32',I1:'#2B77B7',I2:'#3D9250'};
  const PC=[4,8,13,16,21,24,28,30];
  const DEFS=[['ORAL_1','1.er Examen Oral',9,'oral'],['ORAL_2','2.º Examen Oral',17,'oral'],['ESCRITO_1','1.er Examen Escrito',18,'written'],['ORAL_3','3.er Examen Oral',25,'oral'],['ORAL_4','4.º Examen Oral',31,'oral'],['ESCRITO_2','2.º Examen Escrito',32,'written'],['SOCIAL','Participación / Social Skill',0,'social'],['ICAN','Club I CAN · Participación',0,'ican']];
  const up=v=>String(v??'').trim().toUpperCase();
  const num=(v,d=null)=>v===''||v==null?d:(Number.isFinite(Number(v))?Number(v):d);
  const arr=(v,keys=[])=>{if(Array.isArray(v))return v;const k=keys.find(x=>Array.isArray(v?.[x]));return k?v[k]:[];};
  const date=v=>{const s=String(v||'').slice(0,10);if(!s)return'—';const d=new Date(s+'T12:00:00');return isNaN(d)?s:d.toLocaleDateString('es-CR',{day:'2-digit',month:'short',year:'numeric'});};
  const name=v=>String(v||'Estudiante').trim().toLowerCase().replace(/(^|\s)\S/g,x=>x.toUpperCase());
  const group=r=>String(r?.cod_grupo||r?.COD_GRUPO||r?.grupo||r?.GRUPO||'').trim();
  const lesson=r=>Number(r?.leccion_num||r?.LECCION_NUM||r?.leccion||r?.LECCION||0)||0;
  function level(row){const n=up(row?.nivel||row?.NIVEL||row?.unidad);if(LEVELS.includes(n))return n;const t=up(row?.titulo||row?.tipo);if(/BASICO II|BÁSICO II|\bB2\b/.test(t))return'B2';if(/BASICO I|BÁSICO I|\bB1\b/.test(t))return'B1';if(/INTERMEDIO II|\bI2\b/.test(t))return'I2';if(/INTERMEDIO I|\bI1\b/.test(t))return'I1';return'';}
  function presence(r){const s=up(r?.estado||r?.ESTADO||r?.presente||r?.PRESENTE);if(r?.presente===true||['P','PRESENTE','TRUE','SI','SÍ'].includes(s))return'p';if(r?.presente===false||['A','AUSENTE','FALSE','NO'].includes(s))return'a';return'x';}
  function type(r){const d=up(r?.tipo_oficial||r?.tipo_eval||r?.tipo).replace(/[\s-]+/g,'_');if(DEFS.some(x=>x[0]===d))return d;const t=up(r?.titulo||r?.tipo);if(t.includes('ORAL_1')||t.includes('1.ER EXAMEN ORAL'))return'ORAL_1';if(t.includes('ORAL_2')||t.includes('2.º EXAMEN ORAL')||t.includes('2.O EXAMEN ORAL'))return'ORAL_2';if(t.includes('ORAL_3')||t.includes('3.ER EXAMEN ORAL'))return'ORAL_3';if(t.includes('ORAL_4')||t.includes('4.º EXAMEN ORAL')||t.includes('4.O EXAMEN ORAL'))return'ORAL_4';if(t.includes('ESCRITO_1')||t.includes('1.ER EXAMEN ESCRITO'))return'ESCRITO_1';if(t.includes('ESCRITO_2')||t.includes('2.º EXAMEN ESCRITO')||t.includes('2.O EXAMEN ESCRITO'))return'ESCRITO_2';if(t.includes('SOCIAL')||t.includes('PARTICIP'))return'SOCIAL';if(t.includes('I CAN'))return'ICAN';return d;}
  function registered(r){if(!r)return false;if(r.registrada===true)return true;const v=r.nota??r.NOTA??r.puntos??r.PUNTOS;return r.faltante!==true&&v!==''&&v!=null&&Number.isFinite(Number(v));}
  function status(niveles,n){const v=niveles?.[n];return up(typeof v==='object'?(v?.estatus||v?.ESTATUS):v)||'PE';}
  function final(niveles,n){const v=niveles?.[n];return typeof v==='object'?num(v?.nota??v?.NOTA,null):null;}
  function levelGroup(niveles,n){const v=niveles?.[n];return typeof v==='object'?group(v):'';}
  function defaultLevel(niveles,notes,portal){const e=up(notes?.nivel_activo||portal?.nivel_activo);return LEVELS.includes(e)?e:(LEVELS.find(n=>status(niveles,n)==='CA')||[...LEVELS].reverse().find(n=>['APR','CNV'].includes(status(niveles,n)))||'B1');}
  function latest(rows,keyFn){const m=new Map();(rows||[]).forEach((r,i)=>{const k=keyFn(r);if(!k)return;const t=Date.parse(r?.timestamp||r?.fecha||'')||i,p=m.get(k);if(!p||t>=p.t)m.set(k,{r,t});});return[...m.values()].map(x=>x.r);}
  window.A113Core={LEVELS,NAMES,BOOKS,COLORS,PC,DEFS,up,num,arr,date,name,group,lesson,level,presence,type,registered,status,final,levelGroup,defaultLevel,latest};
})();
