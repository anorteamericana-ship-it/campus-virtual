// CS21A77 · Asistencia docente · pantalla
(function(){
const A=window.ANAtt77;
function TeacherAttendanceInnerCS21A77(){const v=A.useAttendance77(),d=v.d;if(d.loading)return <div className="card" style={{maxWidth:700,margin:'60px auto',padding:30,textAlign:'center'}}>Preparando centro de seguimiento…</div>;if(d.error)return <div className="card" style={{maxWidth:700,margin:'60px auto',padding:30,textAlign:'center',color:A.C.red}}>{d.error}<br/><button className="btn btn-primary" onClick={d.recargarPanel}>Reintentar</button></div>;return <div data-screen-label="Docente · Seguimiento académico · CS21A77"><style>{`.a77k{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.a77charts{display:grid;grid-template-columns:.8fr 1.2fr;gap:14px}.a77main{display:grid;grid-template-columns:320px 1fr;gap:14px;align-items:start}@media(max-width:1100px){.a77k{grid-template-columns:repeat(2,1fr)}.a77charts,.a77main{grid-template-columns:1fr}}@media(max-width:650px){.a77k{grid-template-columns:1fr}}`}</style><A.AttendanceTop77 v={v}/><A.AttendanceDetail77 v={v}/></div>}
A.TeacherAttendanceInnerCS21A77=TeacherAttendanceInnerCS21A77;
})();
