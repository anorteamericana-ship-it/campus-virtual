// CS21A77 · Asistencia docente · datos de vista
(function(){
const A=window.ANAtt77,C=A.C;
function useAttendance77(){
 const d=window.useTeacherSession(),[q,setQ]=React.useState(''),[sel,setSel]=React.useState(''),[mode,setMode]=React.useState('total'),[event,setEvent]=React.useState('');
 const lessons=React.useMemo(()=>A.rows(d.lecciones),[d.lecciones]);
 const items=React.useMemo(()=>(d.roster||[]).map(s=>{const at=d.asistenciaGrupo?.[s.code]||{},n=d.notasGrupo?.[s.code]||s.note||{},ev=lessons.map(l=>({k:A.key(l)+'|'+A.txt(l.fecha),l,r:A.rail(l),name:A.label(l),short:A.label(l,true),date:A.txt(l.fecha).slice(0,10),p:A.present(A.bucket(d.asistenciaDetalle,l,s.code)),c:A.comment(d.comentariosDetalle,l,s.code)})),p=A.pct(at),g=A.grade(n);return{s,n,ev,p,g,present:ev.filter(x=>x.p===true).length,absent:ev.filter(x=>x.p===false).length,comments:ev.filter(x=>x.c).length,sig:A.signal(p,g)}}),[d.roster,d.asistenciaGrupo,d.notasGrupo,d.asistenciaDetalle,d.comentariosDetalle,lessons]);
 React.useEffect(()=>{setSel(items[0]?.s.code||'');setEvent('');setQ('');},[d.codGrupo,items.length]);
 const filtered=items.filter(x=>!A.norm(q)||A.norm([x.s.name,x.s.code,x.s.cedula].join(' ')).includes(A.norm(q))),cur=items.find(x=>x.s.code===sel)||items[0],evs=(cur?.ev||[]).filter(x=>mode==='total'||x.r===mode),active=evs.find(x=>x.k===event)||evs.find(x=>x.p===false)||evs[evs.length-1];
 React.useEffect(()=>setEvent(active?.k||''),[sel,mode,evs.length]);
 const vals=items.map(x=>x.p).filter(x=>x!=null),avg=Number.isFinite(Number(d.resumenGrupo?.promedioAsistencia))?Math.round(Number(d.resumenGrupo.promedioAsistencia)):vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0,grades=items.map(x=>x.g).filter(x=>x!=null),gavg=grades.length?Math.round(grades.reduce((a,b)=>a+b,0)/grades.length):0,closed=lessons.filter(l=>A.up(l.estado)==='CERRADA').length;
 return{d,q,setQ,sel,setSel,mode,setMode,event,setEvent,lessons,items,filtered,cur,evs,active,avg,grades,gavg,closed,C};
}
A.useAttendance77=useAttendance77;
})();
