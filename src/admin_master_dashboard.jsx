// F98.4-Z6-X · Panel Maestro Super Admin — Resumen, Ventas y Operación Académica reales
/* global React, Icon, MasterFmtNumber, MasterFmtMoney, MasterSparkline, MasterBarLineChart, MasterDonut, MasterFunnel, MasterHorizontalRanking, MasterHeatmap */

const MASTER_MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const MASTER_LEVEL_COLORS = { B1:'#e4a924', B2:'#df3a32', I1:'#2d78b7', I2:'#3c9a62' };
const MASTER_SECTIONS = [
  {id:'resumen',label:'Resumen institucional',icon:'home',color:'#16294f'},
  {id:'ventas',label:'Ventas y matrícula',icon:'chart',color:'#c49a40'},
  {id:'academica',label:'Operación académica',icon:'calendar',color:'#315f96'},
  {id:'estudiantes',label:'Estudiantes y retención',icon:'profile',color:'#2f8a5b'},
  {id:'cobranza',label:'Cobranza y cartera',icon:'payments',color:'#bf403b'},
  {id:'conape',label:'CONAPE',icon:'graduation',color:'#7956a8'},
  {id:'docentes',label:'Docentes y grupos',icon:'roster',color:'#287f83'},
  {id:'examenes',label:'Exámenes y rendimiento',icon:'check',color:'#b8893b'},
  {id:'alertas',label:'Alertas y pendientes',icon:'bell',color:'#c8302a'},
  {id:'tendencias',label:'Tendencias históricas',icon:'chart',color:'#315f96'},
];

function masterToken() { return window.getSessionToken ? window.getSessionToken() : ''; }
async function masterPost(payload={}) {
  const url = window.APPS_SCRIPT_URL;
  const res = await fetch(`${url}?fn=getSuperAdminMasterDashboard`, {
    method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({fn:'getSuperAdminMasterDashboard',token:masterToken(),...payload}),
  });
  return await res.json();
}
function masterSumArrays(arrays) {
  const out=Array(12).fill(0); (arrays||[]).forEach(a=>(a||[]).forEach((v,i)=>out[i]+=Number(v||0))); return out;
}
function masterBlockMonthly(block, advisors) {
  if (!block) return Array(12).fill(0);
  if (!advisors || !advisors.length) return (block.total||Array(12).fill(0)).map(Number);
  return masterSumArrays(advisors.map(a=>block.advisors?.[a]||[]));
}
function masterProspectAggregate(block, advisors) {
  const empty={leads:Array(12).fill(0),active:Array(12).fill(0),funnel:{lead:0,solicitud:0,documentos:0,aprobado:0,desembolso:0,pago:0,activo:0}};
  if (!block) return empty;
  const selected=(!advisors||!advisors.length)?Object.keys(block.advisors||{}):advisors;
  selected.forEach(a=>{const x=block.advisors?.[a];if(!x)return;x.leads?.forEach((v,i)=>empty.leads[i]+=Number(v||0));x.active?.forEach((v,i)=>empty.active[i]+=Number(v||0));Object.keys(empty.funnel).forEach(k=>empty.funnel[k]+=Number(x.funnel?.[k]||0));});
  return empty;
}
function masterYearTotal(a){return (a||[]).reduce((s,v)=>s+Number(v||0),0);}
function masterPercent(current, previous){if(!previous)return current?100:null;return Math.round(((current-previous)/previous)*100);}
function masterCsvDownload(name, rows) {
  const csv=rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
}

function useMasterData() {
  const [state,setState]=React.useState({loading:true,error:'',data:null});
  const load=React.useCallback((refresh=false)=>{setState(s=>({...s,loading:true,error:''}));masterPost({refresh}).then(d=>{if(!d?.ok)throw new Error(d?.mensaje||d?.error||'No se pudo cargar');setState({loading:false,error:'',data:d});}).catch(e=>setState({loading:false,error:e.message||String(e),data:null}));},[]);
  React.useEffect(()=>load(false),[load]);
  return {...state,refetch:()=>load(true)};
}

function MasterKpi({ label, value, sub, trend, tone='#16294f', icon='chart', values=[] }) {
  return <article className="master-kpi" style={{'--master-tone':tone}}>
    <div className="master-kpi-top"><span>{label}</span><i><Icon name={icon} size={17}/></i></div>
    <div className="master-kpi-value">{value}</div>
    <div className="master-kpi-bottom"><div><strong className={trend==null?'master-trend-flat':trend>=0?'master-trend-up':'master-trend-down'}>{trend==null?'Datos reales':`${trend>=0?'+':''}${trend}%`}</strong><span>{sub}</span></div><MasterSparkline values={values} tone={tone}/></div>
  </article>;
}

function MasterAdvisorFilter({ advisors=[], selected=[], onChange }) {
  const label=!selected.length?'Todos los asesores':selected.length===1?selected[0]:`${selected.length} asesores`;
  const toggle=name=>onChange(selected.includes(name)?selected.filter(x=>x!==name):[...selected,name]);
  return <details className="master-advisor-filter"><summary><Icon name="profile" size={15}/><span>{label}</span><b>⌄</b></summary><div className="master-advisor-menu"><button type="button" onClick={()=>onChange([])} className={!selected.length?'active':''}>Todos</button>{advisors.map(a=><label key={a.name}><input type="checkbox" checked={selected.includes(a.name)} onChange={()=>toggle(a.name)}/><span>{a.name}</span>{a.active&&<small>activo</small>}</label>)}</div></details>;
}

function MasterDataStatus({ coverage }) {
  return <div className="master-data-status"><span><i/>Datos reales</span><span>Fuentes: APOLLO + CAMPUS_OPERATIVO</span>{coverage?.prospectsStart&&<span>Embudo comercial desde {coverage.prospectsStart}</span>}{coverage?.academicRows&&<span>{MasterFmtNumber(coverage.academicRows)} eventos académicos analizados</span>}</div>;
}

function MasterResumen({ data, year, compareYear, advisors, setSection }) {
  const s=data.summary||{}, sales=data.sales||{};
  const current=masterBlockMonthly(sales.enrollmentsByYear?.[year],advisors);
  const compare=masterBlockMonthly(sales.enrollmentsByYear?.[compareYear],advisors);
  const income=(sales.incomeByYear?.[year]||Array(12).fill(0)).map(Number);
  const nowMonth=new Date().getMonth();
  const monthMat=Number(current[nowMonth]||0), prevMonth=nowMonth?Number(current[nowMonth-1]||0):Number(compare[11]||0);
  const monthIncome=Number(income[nowMonth]||0), prevIncome=nowMonth?Number(income[nowMonth-1]||0):Number((sales.incomeByYear?.[compareYear]||[])[11]||0);
  const groups=s.groupsByLevel||{};
  const levelItems=['B1','B2','I1','I2'].map(k=>({label:{B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'}[k],value:Number(groups[k]||0),color:MASTER_LEVEL_COLORS[k]}));
  const ranking=masterAdvisorRanking(data,year,advisors).slice(0,6);
  return <>
    <div className="master-kpi-grid">
      <MasterKpi label="Estudiantes activos" value={MasterFmtNumber(s.activeStudents)} sub="en grupos y niveles en curso" tone="#16294f" icon="profile" values={current}/>
      <MasterKpi label="Grupos activos" value={MasterFmtNumber(s.activeGroups)} sub="operación académica actual" tone="#c49a40" icon="roster" values={Object.values(groups)}/>
      <MasterKpi label="Docentes activos" value={MasterFmtNumber(s.activeTeachers)} sub="asignados a grupos en curso" tone="#2f8a5b" icon="graduation" values={Object.values(groups)}/>
      <MasterKpi label="Matrículas del mes" value={MasterFmtNumber(monthMat)} sub="según fecha de matrícula" trend={masterPercent(monthMat,prevMonth)} tone="#315f96" icon="graduation" values={current}/>
      <MasterKpi label="Cobros del mes" value={MasterFmtMoney(monthIncome)} sub="pagos efectivamente registrados" trend={masterPercent(monthIncome,prevIncome)} tone="#bf403b" icon="payments" values={income}/>
      <MasterKpi label="Inscritos históricos" value={MasterFmtNumber(s.historicalStudents)} sub="códigos únicos en DATOS" tone="#7956a8" icon="profile" values={current}/>
      <MasterKpi label="Conversión comercial" value={s.conversionCurrent==null?'Sin cobertura':`${s.conversionCurrent}%`} sub={s.conversionCurrent==null?'PROSPECTOS sin base suficiente': 'activaciones sobre leads del mes'} tone="#287f83" icon="chart" values={(data.prospects?.byYear?.[year]?.total||[])} />
      <MasterKpi label="Casos CONAPE" value={MasterFmtNumber(s.conapeActive)} sub="prospectos no cancelados" tone="#7956a8" icon="graduation" values={(data.prospects?.byYear?.[year]?.total||[])} />
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card master-chart-card"><header><div><span>Comercial</span><h3>Matrículas mensuales</h3><p>{year} comparado con {compareYear}</p></div><button onClick={()=>setSection('ventas')}>Abrir Ventas →</button></header><MasterBarLineChart primary={current} compare={compare} labels={MASTER_MONTHS} primaryLabel={`${year}`} compareLabel={`${compareYear}`} /></section>
      <section className="master-card"><header><div><span>Académico</span><h3>Grupos por nivel</h3><p>Solo grupos actualmente en curso</p></div><button onClick={()=>setSection('academica')}>Abrir operación →</button></header><MasterDonut items={levelItems} centerValue={MasterFmtNumber(s.activeGroups)} centerLabel="GRUPOS" /></section>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card"><header><div><span>Equipo comercial</span><h3>Ranking de matrículas</h3><p>Año seleccionado</p></div></header>{ranking.length?<MasterHorizontalRanking items={ranking}/>:<MasterEmpty text="No hay matrículas atribuidas a asesores para este periodo."/>}</section>
      <section className="master-card"><header><div><span>Centro de control</span><h3>Alertas institucionales</h3><p>Generadas con información actual</p></div><button onClick={()=>setSection('alertas')}>Ver todo →</button></header><div className="master-alert-list">{(data.alerts||[]).slice(0,7).map((a,i)=><div key={i} className={`master-alert master-alert-${a.level||'low'}`}><i/><div><strong>{a.title}</strong><span>{a.detail}</span></div></div>)}{!(data.alerts||[]).length&&<MasterEmpty text="No hay alertas institucionales calculadas."/>}</div></section>
    </div>
  </>;
}

function masterAdvisorRanking(data,year,filter=[]) {
  const block=data.sales?.enrollmentsByYear?.[year];if(!block)return[];
  const names=filter.length?filter:Object.keys(block.advisors||{});
  return names.map(name=>({name,value:masterYearTotal(block.advisors?.[name]||[]),values:block.advisors?.[name]||[]})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name,'es'));
}

function MasterVentas({ data, year, compareYear, advisors }) {
  const sales=data.sales||{}, current=masterBlockMonthly(sales.enrollmentsByYear?.[year],advisors), compare=masterBlockMonthly(sales.enrollmentsByYear?.[compareYear],advisors);
  const income=(sales.incomeByYear?.[year]||Array(12).fill(0)).map(Number);
  const prospect=masterProspectAggregate(data.prospects?.byYear?.[year],advisors);
  const leads=masterYearTotal(prospect.leads), activated=masterYearTotal(prospect.active), mats=masterYearTotal(current), incomeTotal=masterYearTotal(income);
  const conversion=leads?Math.round((activated/leads)*100):null;
  const funnel=[
    ['Leads',prospect.funnel.lead,'#16294f'],['Solicitud',prospect.funnel.solicitud,'#315f96'],['Documentos',prospect.funnel.documentos,'#287f83'],['Aprobado',prospect.funnel.aprobado,'#c49a40'],['Desembolso',prospect.funnel.desembolso,'#7956a8'],['Pago academia',prospect.funnel.pago,'#bf403b'],['Activo',prospect.funnel.activo,'#2f8a5b']
  ].map(([label,value,color])=>({label,value,color}));
  const ranking=masterAdvisorRanking(data,year,advisors);
  const heatRows=(advisors.length?ranking:masterAdvisorRanking(data,year,[])).slice(0,10).map(x=>({name:x.name,values:x.values}));
  const levelBlock=sales.levelsByYear?.[year]||{};
  return <>
    <div className="master-kpi-grid master-kpi-grid-five">
      <MasterKpi label="Matrículas del año" value={MasterFmtNumber(mats)} sub="registros en DATOS" tone="#16294f" icon="graduation" values={current}/>
      <MasterKpi label="Leads registrados" value={MasterFmtNumber(leads)} sub="cobertura disponible en PROSPECTOS" tone="#315f96" icon="profile" values={prospect.leads}/>
      <MasterKpi label="Prospectos activados" value={MasterFmtNumber(activated)} sub="F_ACTIVO o código activado" tone="#2f8a5b" icon="check" values={prospect.active}/>
      <MasterKpi label="Conversión del embudo" value={conversion==null?'Sin cobertura':`${conversion}%`} sub="activados sobre leads registrados" tone="#c49a40" icon="chart" values={prospect.active}/>
      <MasterKpi label="Cobros del año" value={MasterFmtMoney(incomeTotal)} sub="PAGOS + PAGOS_CAMPUS sin duplicados" tone="#bf403b" icon="payments" values={income}/>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card master-chart-card"><header><div><span>Comparativo histórico</span><h3>Ventas mensuales por matrículas</h3><p>Filtro de asesores aplicado al conteo de matrículas</p></div></header><MasterBarLineChart primary={current} compare={compare} labels={MASTER_MONTHS} primaryLabel={`${year}`} compareLabel={`${compareYear}`} /></section>
      <section className="master-card"><header><div><span>Embudo</span><h3>Proceso comercial</h3><p>{data.coverage?.prospectsStart?`Cobertura desde ${data.coverage.prospectsStart}`:'Sin datos de PROSPECTOS'}</p></div><em className="master-integration-chip">Cobertura parcial histórica</em></header>{leads?<MasterFunnel items={funnel}/>:<MasterEmpty text="No existen prospectos registrados para este filtro y año."/>}</section>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card"><header><div><span>Desempeño</span><h3>Heatmap asesor × mes</h3><p>Matrículas históricas atribuidas en DATOS</p></div></header>{heatRows.length?<MasterHeatmap rows={heatRows} labels={MASTER_MONTHS}/>:<MasterEmpty text="No hay asesores con matrículas en este periodo."/>}</section>
      <section className="master-card"><header><div><span>Ranking</span><h3>Asesores del periodo</h3><p>Ordenados por matrículas</p></div></header>{ranking.length?<MasterHorizontalRanking items={ranking}/>:<MasterEmpty text="Sin matrículas atribuidas."/>}</section>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card"><header><div><span>Niveles</span><h3>Matrículas por nivel de ingreso</h3><p>Derivado del código de grupo registrado</p></div></header><MasterDonut items={['B1','B2','I1','I2'].map(k=>({label:{B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'}[k],value:Number(levelBlock[k]||0),color:MASTER_LEVEL_COLORS[k]}))} centerValue={MasterFmtNumber(Object.values(levelBlock).reduce((s,v)=>s+Number(v||0),0))} centerLabel="MATRÍCULAS"/></section>
      <section className="master-card"><header><div><span>Calidad de datos</span><h3>Lectura correcta del comparativo</h3></div></header><div className="master-notes"><p><strong>Matrículas históricas:</strong> se reconstruyen con DATOS.FECHA_MATRICULA y DATOS.VENDEDOR.</p><p><strong>Embudo:</strong> solo cubre el periodo desde que PROSPECTOS comenzó a guardar etapas y fechas.</p><p><strong>Cobros:</strong> son pagos registrados, no el valor contractual de una venta.</p><p><strong>Filtro de asesor:</strong> modifica matrículas, ranking, heatmap y embudo; no atribuye cobros bancarios al vendedor.</p></div></section>
    </div>
  </>;
}


function masterAcademicGroupKey(g){return `${g.code||''}|${g.level||''}`;}
function masterAcademicFiltered(data, filters={}) {
  return (data.academic?.groups||[]).filter(g=>(!filters.level||g.level===filters.level)&&(!filters.teacher||g.teacher===filters.teacher)&&(!filters.group||g.code===filters.group));
}
function masterAcademicYearBlock(g, year) {
  return g.byYear?.[String(year)]||{
    courseScheduled:Array(12).fill(0),courseDue:Array(12).fill(0),courseClosed:Array(12).fill(0),coursePastDue:Array(12).fill(0),
    icanScheduled:Array(12).fill(0),icanDue:Array(12).fill(0),icanClosed:Array(12).fill(0),icanPastDue:Array(12).fill(0),
    examActivations:Array(12).fill(0),examSubmitted:Array(12).fill(0),examReviewed:Array(12).fill(0)
  };
}
function masterAcademicMonthly(groups, year, field){return masterSumArrays(groups.map(g=>masterAcademicYearBlock(g,year)[field]||[]));}
function masterAcademicAttendance(groups, year, riel='course') {
  let present=0,total=0;
  groups.forEach(g=>{const b=g.attendanceByYear?.[String(year)]||{};present+=Number(b[`${riel}Present`]||0);total+=Number(b[`${riel}Total`]||0);});
  return {present,total,pct:total?Math.round((present/total)*100):null};
}
function masterAcademicProgress(groups, year) {
  let expected=0,completed=0,dueCheckpoints=0,completedCheckpoints=0;
  groups.forEach(g=>{const p=g.progressByYear?.[String(year)]||{};expected+=Number(p.expected||0);completed+=Number(p.completed||0);dueCheckpoints+=Number(p.dueCheckpoints||0);completedCheckpoints+=Number(p.completedCheckpoints||0);});
  return {expected,completed,dueCheckpoints,completedCheckpoints,pct:expected?Math.min(100,Math.round((completed/expected)*100)):null};
}
function masterAcademicTotals(groups, year) {
  const scheduled=masterAcademicMonthly(groups,year,'courseScheduled'),due=masterAcademicMonthly(groups,year,'courseDue'),closed=masterAcademicMonthly(groups,year,'courseClosed'),pastDue=masterAcademicMonthly(groups,year,'coursePastDue');
  const icanScheduled=masterAcademicMonthly(groups,year,'icanScheduled'),icanDue=masterAcademicMonthly(groups,year,'icanDue'),icanClosed=masterAcademicMonthly(groups,year,'icanClosed'),icanPastDue=masterAcademicMonthly(groups,year,'icanPastDue');
  const examsSubmitted=masterAcademicMonthly(groups,year,'examSubmitted'),examsReviewed=masterAcademicMonthly(groups,year,'examReviewed');
  const dueTotal=masterYearTotal(due),closedDue=Math.min(dueTotal,masterYearTotal(closed)),icanDueTotal=masterYearTotal(icanDue),icanClosedDue=Math.min(icanDueTotal,masterYearTotal(icanClosed));
  return {scheduled,due,closed,pastDue,icanScheduled,icanDue,icanClosed,icanPastDue,examsSubmitted,examsReviewed,
    groups:groups.length,teachers:new Set(groups.map(g=>g.teacher).filter(Boolean)).size,students:groups.reduce((a,g)=>a+Number(g.students||0),0),
    scheduledTotal:masterYearTotal(scheduled),dueTotal,closedTotal:masterYearTotal(closed),pastDueTotal:masterYearTotal(pastDue),closurePct:dueTotal?Math.round((closedDue/dueTotal)*100):null,
    icanDueTotal,icanClosedTotal:masterYearTotal(icanClosed),icanPastDueTotal:masterYearTotal(icanPastDue),icanPct:icanDueTotal?Math.round((icanClosedDue/icanDueTotal)*100):null,
    pendingReview:groups.reduce((a,g)=>a+Number(g.exams?.pendingReview||0),0),activeExams:groups.reduce((a,g)=>a+Number(g.exams?.active||0),0)};
}
function masterAcademicTeacherRanking(groups, year) {
  const map={};
  groups.forEach(g=>{const name=g.teacher||'Sin docente';if(!map[name])map[name]={name,value:0,due:0,closed:0,groups:0};const b=masterAcademicYearBlock(g,year);map[name].groups++;map[name].due+=masterYearTotal(b.courseDue);map[name].closed+=Math.min(masterYearTotal(b.courseDue),masterYearTotal(b.courseClosed));});
  return Object.values(map).map(x=>({...x,value:x.due?Math.round((x.closed/x.due)*100):0})).sort((a,b)=>b.value-a.value||b.groups-a.groups||a.name.localeCompare(b.name,'es'));
}
function masterAcademicGroupRows(groups, year) {
  return groups.map(g=>{const b=masterAcademicYearBlock(g,year),due=masterYearTotal(b.courseDue),closed=Math.min(due,masterYearTotal(b.courseClosed)),pastDue=masterYearTotal(b.coursePastDue),att=masterAcademicAttendance([g],year),pc=masterAcademicProgress([g],year),icanDue=masterYearTotal(b.icanDue),icanClosed=Math.min(icanDue,masterYearTotal(b.icanClosed));return {...g,_due:due,_closed:closed,_pastDue:pastDue,_closurePct:due?Math.round((closed/due)*100):null,_attendancePct:att.pct,_attendancePresent:att.present,_attendanceTotal:att.total,_progressPct:pc.pct,_progressCompleted:pc.completed,_progressExpected:pc.expected,_icanDue:icanDue,_icanClosed:icanClosed,_icanPct:icanDue?Math.round((icanClosed/icanDue)*100):null};}).sort((a,b)=>b._pastDue-a._pastDue||(a._attendancePct??101)-(b._attendancePct??101)||a.code.localeCompare(b.code));
}
function masterAcademicAlerts(groups, year) {
  const out=[];
  masterAcademicGroupRows(groups,year).forEach(g=>{
    if(g._pastDue>0)out.push({level:'high',title:`${g.code} · ${g._pastDue} clase${g._pastDue===1?'':'s'} vencida${g._pastDue===1?'':'s'}`,detail:`${g.level} · ${g.teacher||'Sin docente'}`});
    if(g._attendancePct!=null&&g._attendancePct<85)out.push({level:'med',title:`${g.code} · asistencia ${g._attendancePct}%`,detail:'Promedio por debajo del 85%'});
    if(g._progressPct!=null&&g._progressPct<100)out.push({level:'med',title:`${g.code} · Progress Check ${g._progressPct}%`,detail:'Registros obligatorios pendientes'});
    if(Number(g.exams?.pendingReview||0)>0)out.push({level:'med',title:`${g.code} · ${g.exams.pendingReview} examen${g.exams.pendingReview===1?'':'es'} por revisar`,detail:`${g.level} · revisión docente pendiente`});
  });
  return out.slice(0,16);
}
function MasterAcademicFilter({label,value,onChange,options,placeholder='Todos'}) {
  return <label className="master-academic-filter"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}><option value="">{placeholder}</option>{options.map(x=><option key={typeof x==='string'?x:x.value} value={typeof x==='string'?x:x.value}>{typeof x==='string'?x:x.label}</option>)}</select></label>;
}
function MasterAcademicTable({rows=[]}) {
  return <div className="master-academic-table-wrap"><table className="master-academic-table"><thead><tr><th>Grupo</th><th>Nivel</th><th>Docente</th><th>Est.</th><th>Cierre</th><th>Asistencia</th><th>Progress Check</th><th>I CAN</th><th>Próxima lección</th></tr></thead><tbody>{rows.map(g=><tr key={masterAcademicGroupKey(g)} className={g._pastDue>0?'has-alert':''}><td><strong>{g.code}</strong><small>{g.program||'—'}</small></td><td><span className={`master-level-badge master-level-${g.level}`}>{g.level}</span></td><td>{g.teacher||'Sin docente'}</td><td>{MasterFmtNumber(g.students)}</td><td><MasterMiniMetric value={g._closurePct} detail={`${g._closed}/${g._due}`} danger={g._pastDue>0}/></td><td><MasterMiniMetric value={g._attendancePct} detail={g._attendancePct==null?'Sin registros':`${g._attendancePresent}/${g._attendanceTotal}`}/></td><td><MasterMiniMetric value={g._progressPct} detail={g._progressPct==null?'Sin vencidos':`${g._progressCompleted}/${g._progressExpected}`}/></td><td><MasterMiniMetric value={g._icanPct} detail={g._icanPct==null?'No aplica / sin vencidos':`${g._icanClosed}/${g._icanDue}`}/></td><td><strong className="master-next-lesson">{g.nextLesson||'Sin próxima fecha'}</strong><small>{g.nextLessonNum?`Lección ${g.nextLessonNum}`:'—'}</small></td></tr>)}</tbody></table>{!rows.length&&<MasterEmpty text="No hay grupos que coincidan con los filtros académicos."/>}</div>;
}
function MasterMiniMetric({value,detail,danger=false}) {
  const n=value==null?null:Number(value);const cls=n==null?'empty':danger||n<70?'bad':n<85?'warn':'good';return <div className={`master-mini-metric ${cls}`}><strong>{n==null?'—':`${n}%`}</strong><span>{detail}</span></div>;
}
function MasterAcademica({data,year,filters}) {
  const groups=masterAcademicFiltered(data,filters),tot=masterAcademicTotals(groups,year),att=masterAcademicAttendance(groups,year),pc=masterAcademicProgress(groups,year);
  const levelItems=['B1','B2','I1','I2'].map(k=>({label:{B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'}[k],value:groups.filter(g=>g.level===k).length,color:MASTER_LEVEL_COLORS[k]}));
  const teachers=masterAcademicTeacherRanking(groups,year);
  const heatRows=masterAcademicGroupRows(groups,year).slice(0,12).map(g=>({name:`${g.code} · ${g.level}`,values:masterAcademicYearBlock(g,year).courseClosed||[]}));
  const rows=masterAcademicGroupRows(groups,year),alerts=masterAcademicAlerts(groups,year);
  return <>
    <div className="master-kpi-grid">
      <MasterKpi label="Grupos activos" value={MasterFmtNumber(tot.groups)} sub="según GRUPOS · En curso" tone="#16294f" icon="roster" values={levelItems.map(x=>x.value)}/>
      <MasterKpi label="Estudiantes activos" value={MasterFmtNumber(tot.students)} sub="ESTATUS CA del nivel actual" tone="#2f8a5b" icon="profile" values={groups.map(g=>g.students)}/>
      <MasterKpi label="Clases programadas" value={MasterFmtNumber(tot.scheduledTotal)} sub={`lecciones de curso en ${year}`} tone="#315f96" icon="calendar" values={tot.scheduled}/>
      <MasterKpi label="Cumplimiento de cierre" value={tot.closurePct==null?'Sin vencidas':`${tot.closurePct}%`} sub={`${tot.pastDueTotal} clases vencidas sin cerrar`} tone={tot.pastDueTotal?'#c8302a':'#287f83'} icon="check" values={tot.closed}/>
      <MasterKpi label="Asistencia promedio" value={att.pct==null?'Sin registros':`${att.pct}%`} sub={`${MasterFmtNumber(att.present)} presentes de ${MasterFmtNumber(att.total)} registros`} tone="#c49a40" icon="profile" values={groups.map(g=>g.attendance?.course?.pct||0)}/>
      <MasterKpi label="Progress Check" value={pc.pct==null?'Sin vencidos':`${pc.pct}%`} sub={`${MasterFmtNumber(pc.completed)} de ${MasterFmtNumber(pc.expected)} registros obligatorios`} tone="#b8893b" icon="check" values={groups.map(g=>g.progress?.pct||0)}/>
      <MasterKpi label="Cumplimiento I CAN" value={tot.icanPct==null?'Sin vencidos':`${tot.icanPct}%`} sub={`${tot.icanPastDueTotal} sesiones vencidas sin cerrar`} tone="#7956a8" icon="graduation" values={tot.icanClosed}/>
      <MasterKpi label="Exámenes por revisar" value={MasterFmtNumber(tot.pendingReview)} sub={`${MasterFmtNumber(tot.activeExams)} activaciones abiertas`} tone={tot.pendingReview?'#bf403b':'#2f8a5b'} icon="check" values={tot.examsSubmitted}/>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card master-chart-card"><header><div><span>Calendario académico</span><h3>Programadas vs. cerradas por mes</h3><p>Solo lecciones del curso · filtros activos aplicados</p></div></header><MasterBarLineChart primary={tot.scheduled} compare={tot.closed} labels={MASTER_MONTHS} primaryLabel="Programadas" compareLabel="Cerradas" /></section>
      <section className="master-card"><header><div><span>Distribución</span><h3>Grupos activos por nivel</h3><p>Estado actual de la operación</p></div></header><MasterDonut items={levelItems} centerValue={MasterFmtNumber(tot.groups)} centerLabel="GRUPOS"/></section>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card"><header><div><span>Desempeño docente</span><h3>Cumplimiento de cierres</h3><p>Clases cerradas sobre clases vencidas</p></div></header>{teachers.length?<MasterHorizontalRanking items={teachers.slice(0,10)} valueLabel="" formatValue={v=>`${MasterFmtNumber(v)}%`}/>:<MasterEmpty text="No hay docentes para este filtro."/>}</section>
      <section className="master-card"><header><div><span>Control académico</span><h3>Alertas accionables</h3><p>Clases, asistencia, Progress Check y exámenes</p></div></header><div className="master-alert-list">{alerts.map((a,i)=><div key={i} className={`master-alert master-alert-${a.level}`}><i/><div><strong>{a.title}</strong><span>{a.detail}</span></div></div>)}{!alerts.length&&<MasterEmpty text="No se detectaron alertas con los filtros actuales."/>}</div></section>
    </div>
    <div className="master-grid master-grid-wide">
      <section className="master-card"><header><div><span>Ritmo de ejecución</span><h3>Heatmap de clases cerradas</h3><p>Grupo × mes del año seleccionado</p></div></header>{heatRows.length?<MasterHeatmap rows={heatRows} labels={MASTER_MONTHS} rowLabel="Grupo"/>:<MasterEmpty text="No hay cierres registrados para este filtro."/>}</section>
    </div>
    <section className="master-card master-academic-detail-card"><header><div><span>Radiografía operativa</span><h3>Estado de cada grupo activo</h3><p>Datos consolidados de calendario, asistencia, Progress Check, I CAN y exámenes</p></div><strong className="master-table-count">{rows.length} grupo{rows.length===1?'':'s'}</strong></header><MasterAcademicTable rows={rows}/></section>
  </>;
}

function MasterPendingSection({ section }) {
  const meta={
    estudiantes:['Estudiantes y retención',['DATOS','ESTATUS','ASISTENCIA','NOTAS_OFICIALES_LOG','SEGUIMIENTO_ESTUDIANTES']],
    cobranza:['Cobranza y cartera',['PAGOS','PAGOS_CAMPUS','BDBANCARIO','MORA_CACHE']],
    conape:['CONAPE',['PROSPECTOS','CONAPE_SYNC','CONAPE_EVENTOS']],
    docentes:['Docentes y grupos',['GRUPOS','DOCENTES','CALENDARIO_LECCIONES','ASISTENCIA']],
    examenes:['Exámenes y rendimiento',['EXAM_ACTIVATIONS','EXAM_ATTEMPTS','EXAM_REVIEW','ORAL_EVALUACIONES']],
    alertas:['Alertas y pendientes',['CALENDARIO_LECCIONES','SOLICITUDES','MORA_CACHE','EXAM_ACTIVATIONS']],
    tendencias:['Tendencias históricas',['DATOS','PAGOS','ESTATUS','GRUPOS','PROSPECTOS']],
  }[section]||['Módulo',['Integración pendiente']];
  return <section className="master-pending"><div className="master-pending-icon"><Icon name="chart" size={28}/></div><span>Conexión progresiva</span><h2>{meta[0]}</h2><p>La navegación ya forma parte del Panel Maestro. Esta sección no muestra datos demostrativos mientras se construyen sus agregados reales.</p><div className="master-source-list">{meta[1].map(x=><b key={x}>{x}</b>)}</div><em className="master-integration-chip">Depende de integración</em></section>;
}
function MasterEmpty({text}){return <div className="master-empty"><Icon name="chart" size={24}/><span>{text}</span></div>}

function AdminMasterDashboard() {
  const {data,loading,error,refetch}=useMasterData();
  const [section,setSection]=React.useState('resumen');
  const [year,setYear]=React.useState('');
  const [compareYear,setCompareYear]=React.useState('');
  const [advisors,setAdvisors]=React.useState([]);
  const [academicLevel,setAcademicLevel]=React.useState('');
  const [academicTeacher,setAcademicTeacher]=React.useState('');
  const [academicGroup,setAcademicGroup]=React.useState('');
  React.useEffect(()=>{if(!data)return;const ys=(data.filters?.years||[]).map(String);const def=String(data.filters?.defaultYear||ys[ys.length-1]||new Date().getFullYear());setYear(y=>y||def);setCompareYear(y=>y||String(ys.includes(String(Number(def)-1))?Number(def)-1:(ys.filter(x=>x!==def).slice(-1)[0]||def)));},[data]);
  React.useEffect(()=>{setAcademicGroup('');},[academicLevel,academicTeacher]);
  if(loading&&!data)return <div className="master-loading"><span/><h2>Construyendo Panel Maestro…</h2><p>Agregando datos reales de APOLLO y CAMPUS_OPERATIVO.</p></div>;
  if(error)return <div className="master-loading master-error"><h2>No se pudo cargar el Panel Maestro</h2><p>{error}</p><button onClick={refetch}>Reintentar</button></div>;
  const years=(data?.filters?.years||[]).map(String),advisorOptions=data?.filters?.advisors||[],connected=['resumen','ventas','academica'];
  const academicOptions=data?.academic?.filters||{levels:[],teachers:[],groups:[]};
  const availableGroups=(academicOptions.groups||[]).filter(g=>(!academicLevel||g.level===academicLevel)&&(!academicTeacher||g.teacher===academicTeacher));
  const academicFilters={level:academicLevel,teacher:academicTeacher,group:academicGroup};
  const exportCurrent=()=>{
    if(section==='academica'){
      const rows=masterAcademicGroupRows(masterAcademicFiltered(data,academicFilters),year);
      masterCsvDownload(`panel_maestro_academico_${year}.csv`,[['Grupo','Nivel','Docente','Estudiantes','Clases vencidas','Clases cerradas','Clases pendientes','Cierre %','Asistencia %','Progress Check %','I CAN %','Exámenes por revisar','Próxima lección'],...rows.map(g=>[g.code,g.level,g.teacher,g.students,g._due,g._closed,g._pastDue,g._closurePct??'',g._attendancePct??'',g._progressPct??'',g._icanPct??'',g.exams?.pendingReview||0,g.nextLesson||''])]);
      return;
    }
    const p=masterBlockMonthly(data.sales?.enrollmentsByYear?.[year],advisors),c=masterBlockMonthly(data.sales?.enrollmentsByYear?.[compareYear],advisors),inc=data.sales?.incomeByYear?.[year]||[];
    masterCsvDownload(`panel_maestro_${section}_${year}.csv`,[['Mes',`Matrículas ${year}`,`Matrículas ${compareYear}`,`Cobros ${year}`],...MASTER_MONTHS.map((m,i)=>[m,p[i]||0,c[i]||0,inc[i]||0])]);
  };
  const selectedMeta=MASTER_SECTIONS.find(x=>x.id===section)||MASTER_SECTIONS[0];
  return <div className="master-admin">
    <header className="master-header"><div><div className="master-title-line"><h1>Panel Maestro Super Admin</h1><span>Datos reales</span></div><p>Control institucional y analítica integral · actualizado {data.generatedAt||'—'}</p></div><div className="master-actions"><button onClick={refetch} disabled={loading}><span aria-hidden="true">↻</span>{loading?'Sincronizando…':'Sincronizar'}</button><button onClick={exportCurrent}><Icon name="download" size={15}/>Exportar CSV</button></div></header>
    <MasterDataStatus coverage={data.coverage}/>
    <div className="master-filterbar">
      <label><span>Año</span><select value={year} onChange={e=>setYear(e.target.value)}>{years.map(y=><option key={y}>{y}</option>)}</select></label>
      {section!=='academica'&&<label><span>Comparar con</span><select value={compareYear} onChange={e=>setCompareYear(e.target.value)}>{years.map(y=><option key={y}>{y}</option>)}</select></label>}
      {(section==='resumen'||section==='ventas')&&<MasterAdvisorFilter advisors={advisorOptions} selected={advisors} onChange={setAdvisors}/>} 
      {section==='academica'&&<>
        <MasterAcademicFilter label="Nivel" value={academicLevel} onChange={setAcademicLevel} options={(academicOptions.levels||[]).map(x=>({value:x,label:({B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'}[x]||x)}))} placeholder="Todos los niveles"/>
        <MasterAcademicFilter label="Docente" value={academicTeacher} onChange={setAcademicTeacher} options={academicOptions.teachers||[]} placeholder="Todos los docentes"/>
        <MasterAcademicFilter label="Grupo" value={academicGroup} onChange={setAcademicGroup} options={availableGroups.map(g=>({value:g.code,label:`${g.code} · ${g.level}`}))} placeholder="Todos los grupos"/>
      </>}
      <div className="master-filter-chip"><i style={{background:selectedMeta.color}}/>{selectedMeta.label}</div>
      {((section==='academica'&&(academicLevel||academicTeacher||academicGroup))||(section!=='academica'&&advisors.length>0))&&<button className="master-clear-filter" onClick={()=>{setAdvisors([]);setAcademicLevel('');setAcademicTeacher('');setAcademicGroup('');}}>Limpiar filtros ×</button>}
    </div>
    <nav className="master-section-nav" aria-label="Secciones del Panel Maestro">{MASTER_SECTIONS.map(item=><button key={item.id} className={section===item.id?'active':''} style={{'--section-color':item.color}} onClick={()=>setSection(item.id)}><i/><Icon name={item.icon} size={16}/><span>{item.label}</span>{!connected.includes(item.id)&&<small>próxima conexión</small>}</button>)}</nav>
    <main className="master-content"><div className="master-section-heading"><div><span>{selectedMeta.label}</span><h2>{section==='resumen'?'Visión ejecutiva de la academia':section==='ventas'?'Analítica comercial y matrículas':section==='academica'?'Control operativo académico en tiempo real':selectedMeta.label}</h2></div>{!connected.includes(section)&&<em className="master-integration-chip">Depende de integración</em>}</div>{section==='resumen'?<MasterResumen data={data} year={year} compareYear={compareYear} advisors={advisors} setSection={setSection}/>:section==='ventas'?<MasterVentas data={data} year={year} compareYear={compareYear} advisors={advisors}/>:section==='academica'?<MasterAcademica data={data} year={year} filters={academicFilters}/>:<MasterPendingSection section={section}/>}</main>
  </div>;
}

Object.assign(window,{AdminMasterDashboard});
