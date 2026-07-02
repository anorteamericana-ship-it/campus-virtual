// F98.4-Z6-AX · Panel Maestro + movimientos CONAPE del mes
/* global React, Icon, MasterFmtNumber, MasterFmtMoney, MasterSparkline, MasterBarLineChart, MasterDonut, MasterFunnel, MasterHorizontalRanking, MasterHeatmap, MasterRadar, MasterMultiLineChart */

const MASTER_PANEL_BUILD = 'F98.4-Z6-AX';
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
async function masterAction(fn,payload={}) {
  const url=window.APPS_SCRIPT_URL;
  const res=await fetch(`${url}?fn=${encodeURIComponent(fn)}`,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({fn,token:masterToken(),...payload})});
  const raw=await res.text();let data=null;
  try{data=raw?JSON.parse(raw):null;}catch(_){throw new Error(`Apps Script respondió texto/HTML en ${fn}.`);}
  if(!res.ok||!data?.ok)throw new Error(data?.mensaje||data?.error||`No se pudo ejecutar ${fn}.`);
  return data;
}
function masterWhatsAppPhone(v){const d=String(v||'').replace(/\D/g,'');if(!d)return'';return d.length===8?`506${d}`:d;}
function masterConapeTypeLabel(v){return({PRIMER_DESEMBOLSO:'Primer desembolso',NUEVO_DESEMBOLSO:'Nuevo desembolso',DESEMBOLSO_MES_ACTUAL:'Desembolso del mes',DESEMBOLSO_REPORTADO:'Desembolso reportado',APROBADO_SIN_DESEMBOLSO:'Aprobado sin desembolso',DESEMBOLSO_REMOVIDO:'Desembolso retirado'}[String(v||'').toUpperCase()]||String(v||'').replaceAll('_',' '));}
function MasterConapeMovementsTable({data,onRefresh}){
  const m=data?.conape?.movements||{},rows=m.rows||[],summary=m.summary||{};
  const [busy,setBusy]=React.useState(false),[msg,setMsg]=React.useState('');
  const refresh=async()=>{setBusy(true);setMsg('');try{const r=await masterAction('actualizarPanelConapeAhora');setMsg(r.mensaje||'CONAPE actualizado.');await onRefresh?.();}catch(e){setMsg(e.message||String(e));}finally{setBusy(false);}};
  const monthName=MASTER_MONTHS[Math.max(0,Number(m.month||1)-1)]||'Mes actual';
  return <section className="master-card master-conape-month-card"><header><div><span>Seguimiento inmediato</span><h3>Movimientos CONAPE · {monthName} {m.year||new Date().getFullYear()}</h3><p>Consulta en vivo y memoria mensual de desembolsos · última lectura {m.lastSync||'sin sincronizar'}</p></div><div className="master-conape-month-actions"><span className={`master-live-chip ${(m.monitor||[]).some(x=>x.handler==='sincronizarCONAPE')?'on':'off'}`}>{(m.monitor||[]).some(x=>x.handler==='sincronizarCONAPE')?'Monitoreo horario':'Monitoreo manual'}</span><button type="button" onClick={refresh} disabled={busy}>{busy?'Consultando…':'↻ Actualizar CONAPE ahora'}</button></div></header>
    <div className="master-conape-month-kpis"><div><b>{summary.total||0}</b><span>movimientos del mes</span></div><div><b>{summary.linked||0}</b><span>vinculados al Campus</span></div><div><b>{summary.unlinked||0}</b><span>por vincular</span></div><div><b>{summary.newDisbursement||0}</b><span>desembolsos reportados</span></div></div>
    {msg&&<div className="master-conape-month-msg">{msg}</div>}
    <div className="master-conape-month-table-wrap"><table className="master-conape-month-table"><thead><tr><th>Estudiante</th><th>Movimiento</th><th>Desembolso</th><th>Periodo</th><th>Campus</th><th>Detectado</th><th>Contacto</th></tr></thead><tbody>{rows.map((r,i)=>{const phone=masterWhatsAppPhone(r.phone),text=`Hola ${String(r.name||'').split(' ')[0]}, CONAPE actualizó el desembolso ${r.disbursement||''} correspondiente a ${monthName} ${r.year||''}. Te recordamos mantener tu pago puntual con la Academia Norteamericana. Muchas gracias.`;return <tr key={r.id||`${r.cedula}-${i}`} className={!r.linked?'has-alert':''}><td><strong>{r.name||'Sin nombre'}</strong><small>{r.cedula}{r.code?` · ${r.code}`:''}</small></td><td><span className="master-conape-movement-badge">{masterConapeTypeLabel(r.type)}</span></td><td><b>#{r.disbursement||'—'}</b><small>{r.eventDate||'—'}</small></td><td>{String(r.month||'').padStart(2,'0')}/{r.year||'—'}</td><td>{r.linked?<span className="master-link-status linked">Vinculado</span>:<span className="master-link-status unlinked">Sin vínculo</span>}<small>{r.group||'Sin grupo'}</small></td><td>{r.detectedAt||'—'}</td><td>{phone?<a className="master-wa-action" href={`https://wa.me/${phone}?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">WA Recordar pago</a>:<span className="master-no-phone">Sin teléfono</span>}</td></tr>;})}</tbody></table>{!rows.length&&<MasterEmpty text="CONAPE todavía no reporta movimientos con fecha del mes actual. Use Actualizar CONAPE ahora para consultar en vivo."/>}</div>
  </section>;
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
  return <div className="master-data-status"><span><i/>Datos reales</span><span>Fuentes: APOLLO + CAMPUS_OPERATIVO</span>{coverage?.prospectsStart&&<span>Embudo comercial desde {coverage.prospectsStart}</span>}{coverage?.academicRows&&<span>{MasterFmtNumber(coverage.academicRows)} eventos académicos analizados</span>}{coverage?.studentRows!=null&&<span>{MasterFmtNumber(coverage.studentRows)} estudiantes activos evaluados</span>}{coverage?.paymentRows!=null&&<span>{MasterFmtNumber(coverage.paymentRows)} movimientos de pago revisados</span>}{coverage?.conapeProspects!=null&&<span>{MasterFmtNumber(coverage.conapeProspects)} prospectos CONAPE analizados</span>}{coverage?.conapeSync!=null&&<span>{MasterFmtNumber(coverage.conapeSync)} registros CONAPE sincronizados</span>}{coverage?.teacherRoster!=null&&<span>{MasterFmtNumber(coverage.teacherRoster)} docentes activos detectados</span>}{coverage?.examResults!=null&&<span>{MasterFmtNumber(coverage.examResults)} resultados de evaluación consolidados</span>}{coverage?.institutionalAlerts!=null&&<span>{MasterFmtNumber(coverage.institutionalAlerts)} alertas institucionales vigentes</span>}{coverage?.trendYears!=null&&<span>{MasterFmtNumber(coverage.trendYears)} años consolidados en Tendencias</span>}</div>;
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

function masterStudentFiltered(data, filters={}) {
  const q=String(filters.search||'').trim().toLowerCase();
  return (data.students?.active||[]).filter(s=>(!filters.level||s.level===filters.level)&&(!filters.teacher||s.teacher===filters.teacher)&&(!filters.group||s.group===filters.group)&&(!filters.risk||s.riskLevel===filters.risk)&&(!q||`${s.name} ${s.code} ${s.group}`.toLowerCase().includes(q)));
}
function masterStudentCohort(data, year) {
  return data.students?.cohorts?.[String(year)]||{enrolled:Array(12).fill(0),retained:Array(12).fill(0),active:Array(12).fill(0),completed:Array(12).fill(0),withdrawn:Array(12).fill(0),failed:Array(12).fill(0),other:Array(12).fill(0)};
}
function masterStudentSummary(students=[]) {
  let high=0,medium=0,low=0,att=0,attN=0,grade=0,gradeN=0,mora=0,noAttendance=0;
  students.forEach(s=>{if(s.riskLevel==='high')high++;else if(s.riskLevel==='medium')medium++;else low++;if(s.attendancePct==null)noAttendance++;else{att+=Number(s.attendancePct||0);attN++;}if(s.gradeAvg!=null){grade+=Number(s.gradeAvg||0);gradeN++;}if(s.mora)mora++;});
  return {active:students.length,high,medium,low,attendanceAvg:attN?Math.round(att/attN):null,gradeAvg:gradeN?Math.round((grade/gradeN)*10)/10:null,withAttendance:attN,withGrades:gradeN,mora,noAttendance};
}
function masterStudentGroupRanking(students=[]) {
  const map={};students.forEach(s=>{const k=`${s.group}|${s.level}`;if(!map[k])map[k]={name:`${s.group} · ${s.level}`,value:0,sum:0,count:0,high:0};const x=map[k];if(s.attendancePct!=null){x.sum+=Number(s.attendancePct);x.count++;}if(s.riskLevel==='high')x.high++;});
  return Object.values(map).map(x=>({...x,value:x.count?Math.round(x.sum/x.count):0})).sort((a,b)=>b.value-a.value||a.high-b.high||a.name.localeCompare(b.name,'es'));
}
function masterStudentRiskFactors(students=[]) {
  const out={attendanceCritical:0,attendanceAttention:0,gradeLow:0,mora:0,recentAbsences:0,noAttendance:0};
  students.forEach(s=>{if(s.attendancePct==null)out.noAttendance++;else if(s.attendancePct<70)out.attendanceCritical++;else if(s.attendancePct<85)out.attendanceAttention++;if(s.gradeAvg!=null&&s.gradeAvg<70)out.gradeLow++;if(s.mora)out.mora++;if(Number(s.recentAbsences||0)>=2)out.recentAbsences++;});
  const labels={attendanceCritical:'Asistencia <70%',attendanceAttention:'Asistencia 70–84%',gradeLow:'Promedio <70',mora:'Morosidad vigente',recentAbsences:'2+ ausencias recientes',noAttendance:'Sin asistencia registrada'};
  return Object.keys(out).map(k=>({name:labels[k],value:out[k]})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value);
}
function MasterRiskBadge({level='low',score=0}) {
  const label=level==='high'?'Alto':level==='medium'?'Medio':'Bajo';return <span className={`master-risk-badge master-risk-${level}`}>{label}<small>{score}</small></span>;
}
function MasterStudentTable({rows=[]}) {
  return <div className="master-student-table-wrap"><table className="master-student-table"><thead><tr><th>Estudiante</th><th>Grupo</th><th>Docente</th><th>Asistencia</th><th>Promedio eval.</th><th>Ausencias recientes</th><th>Mora</th><th>Avance</th><th>Riesgo</th><th>Motivos</th></tr></thead><tbody>{rows.map(s=><tr key={`${s.group}|${s.level}|${s.code}`} className={s.riskLevel==='high'?'has-risk':''}><td><strong>{s.name}</strong><small>{s.code} · {s.convenio||'Sin convenio'}</small></td><td><strong className="master-student-group">{s.group}</strong><span className={`master-level-badge master-level-${s.level}`}>{s.level}</span></td><td>{s.teacher||'Sin docente'}</td><td><MasterMiniMetric value={s.attendancePct} detail={s.attendancePct==null?'Sin registros':`${s.attendancePresent}/${s.attendanceTotal}`}/></td><td><MasterMiniMetric value={s.gradeAvg} detail={s.gradeAvg==null?'Sin evaluaciones':`${s.evaluations} evaluación${s.evaluations===1?'':'es'}`}/></td><td><strong className={Number(s.recentAbsences||0)>=2?'master-danger-text':''}>{MasterFmtNumber(s.recentAbsences||0)}</strong><small>últimos 3 registros</small></td><td>{s.mora?<span className="master-mora yes">Sí</span>:<span className="master-mora no">No</span>}</td><td><MasterMiniMetric value={s.progressPct} detail={`Lección ${s.lastClosedLesson||0}/32`}/></td><td><MasterRiskBadge level={s.riskLevel} score={s.riskScore}/></td><td><div className="master-risk-reasons">{(s.riskReasons||[]).slice(0,3).map((r,i)=><span key={i}>{r}</span>)}{!(s.riskReasons||[]).length&&<em>Sin alertas</em>}</div></td></tr>)}</tbody></table>{!rows.length&&<MasterEmpty text="No hay estudiantes que coincidan con los filtros."/>}</div>;
}
function MasterEstudiantes({data,year,filters}) {
  const students=masterStudentFiltered(data,filters),sum=masterStudentSummary(students),cohort=masterStudentCohort(data,year),enrolled=masterYearTotal(cohort.enrolled),retained=masterYearTotal(cohort.retained),retention=enrolled?Math.round((retained/enrolled)*100):null;
  const riskItems=[{label:'Riesgo alto',value:sum.high,color:'#c8302a'},{label:'Riesgo medio',value:sum.medium,color:'#c49a40'},{label:'Riesgo bajo',value:sum.low,color:'#2f8a5b'}];
  const factors=masterStudentRiskFactors(students),groups=masterStudentGroupRanking(students),alerts=students.filter(s=>s.riskLevel!=='low').slice(0,12);
  const heatRows=[{name:'Activos',values:cohort.active},{name:'Completaron',values:cohort.completed},{name:'Retiro / interrupción',values:cohort.withdrawn},{name:'Reprobación',values:cohort.failed},{name:'Otros estados',values:cohort.other}];
  return <>
    <div className="master-kpi-grid">
      <MasterKpi label="Estudiantes activos" value={MasterFmtNumber(sum.active)} sub="en grupos y niveles actualmente en curso" tone="#16294f" icon="profile" values={groups.map(x=>x.value)}/>
      <MasterKpi label="Riesgo alto" value={MasterFmtNumber(sum.high)} sub="requieren intervención prioritaria" tone="#c8302a" icon="bell" values={[sum.low,sum.medium,sum.high]}/>
      <MasterKpi label="Riesgo medio" value={MasterFmtNumber(sum.medium)} sub="requieren seguimiento preventivo" tone="#c49a40" icon="check" values={[sum.low,sum.medium,sum.high]}/>
      <MasterKpi label="Asistencia promedio" value={sum.attendanceAvg==null?'Sin registros':`${sum.attendanceAvg}%`} sub={`${sum.withAttendance} estudiantes con asistencia`} tone="#315f96" icon="calendar" values={students.map(s=>s.attendancePct||0)}/>
      <MasterKpi label="Promedio evaluaciones" value={sum.gradeAvg==null?'Sin notas':`${sum.gradeAvg}%`} sub={`${sum.withGrades} estudiantes evaluados`} tone="#7956a8" icon="check" values={students.map(s=>s.gradeAvg||0)}/>
      <MasterKpi label="Con morosidad" value={MasterFmtNumber(sum.mora)} sub="último periodo registrado en 7-morosidad" tone="#bf403b" icon="payments" values={[sum.active-sum.mora,sum.mora]}/>
      <MasterKpi label={`Retención cohorte ${year}`} value={retention==null?'Sin cohorte':`${retention}%`} sub={`${retained} activos o completados de ${enrolled}`} tone="#2f8a5b" icon="graduation" values={cohort.retained}/>
      <MasterKpi label="Sin asistencia" value={MasterFmtNumber(sum.noAttendance)} sub="sin registros suficientes para calcular" tone="#7b8494" icon="profile" values={[sum.withAttendance,sum.noAttendance]}/>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card master-chart-card"><header><div><span>Retención observable</span><h3>Ingreso vs. continuidad por cohorte mensual</h3><p>{year} · continuidad = actualmente activo o programa completado</p></div></header><MasterBarLineChart primary={cohort.enrolled} compare={cohort.retained} labels={MASTER_MONTHS} primaryLabel="Ingresaron" compareLabel="Continúan / completaron" /></section>
      <section className="master-card"><header><div><span>Semáforo estudiantil</span><h3>Distribución del riesgo</h3><p>Filtros actuales aplicados</p></div></header><MasterDonut items={riskItems} centerValue={MasterFmtNumber(sum.active)} centerLabel="ACTIVOS"/></section>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card"><header><div><span>Causas de riesgo</span><h3>Factores que requieren seguimiento</h3><p>Un estudiante puede aparecer en varios factores</p></div></header>{factors.length?<MasterHorizontalRanking items={factors} valueLabel="estudiantes"/>:<MasterEmpty text="No se detectaron factores de riesgo con los filtros actuales."/>}</section>
      <section className="master-card"><header><div><span>Grupos</span><h3>Asistencia promedio por grupo</h3><p>Ordenado por mejor asistencia registrada</p></div></header>{groups.length?<MasterHorizontalRanking items={groups.slice(0,10)} valueLabel="" formatValue={v=>`${MasterFmtNumber(v)}%`}/>:<MasterEmpty text="No hay grupos para este filtro."/>}</section>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card"><header><div><span>Cohortes</span><h3>Resultado actual por mes de ingreso</h3><p>No representa permanencia mes a mes; muestra el estado observable hoy</p></div></header><MasterHeatmap rows={heatRows} labels={MASTER_MONTHS} rowLabel="Estado"/></section>
      <section className="master-card"><header><div><span>Intervención prioritaria</span><h3>Estudiantes para seguimiento</h3><p>Riesgo alto y medio</p></div></header><div className="master-alert-list">{alerts.map((s,i)=><div key={i} className={`master-alert ${s.riskLevel==='high'?'master-alert-high':'master-alert-med'}`}><i/><div><strong>{s.name} · {s.riskLevel==='high'?'alto':'medio'}</strong><span>{s.code} · {s.group} · {(s.riskReasons||[]).slice(0,2).join(' · ')}</span></div></div>)}{!alerts.length&&<MasterEmpty text="No hay estudiantes en riesgo alto o medio."/>}</div></section>
    </div>
    <section className="master-card master-student-detail-card"><header><div><span>Radiografía individual</span><h3>Estudiantes activos y nivel de riesgo</h3><p>Asistencia, evaluaciones, mora, avance y ausencias recientes</p></div><strong className="master-table-count">{students.length} estudiante{students.length===1?'':'s'}</strong></header><MasterStudentTable rows={students}/></section>
    <section className="master-card master-student-method"><header><div><span>Metodología</span><h3>Cómo se calcula el riesgo</h3></div></header><div className="master-notes"><p><strong>Riesgo alto:</strong> puntaje de 50 o más por combinación de asistencia inferior al mínimo, promedio menor a 70, mora y ausencias recientes.</p><p><strong>Riesgo medio:</strong> puntaje entre 25 y 49; requiere seguimiento preventivo.</p><p><strong>Retención observable:</strong> estudiantes de la cohorte que hoy están activos o ya completaron Intermedio II. No sustituye una cohorte longitudinal histórica.</p><p><strong>Notas:</strong> promedio de la última versión activa de cada evaluación registrada; los recálculos administrativos no se cuentan como una evaluación adicional.</p></div></section>
  </>;
}


function masterMoneyFull(value){return new Intl.NumberFormat('es-CR',{style:'currency',currency:'CRC',maximumFractionDigits:0}).format(Number(value||0));}
function masterCollectionFiltered(data, filters={}) {
  const q=String(filters.search||'').trim().toLowerCase();
  return (data.collections?.rows||[]).filter(r=>(!filters.level||r.level===filters.level)&&(!filters.convenio||r.convenio===filters.convenio)&&(!filters.group||r.group===filters.group)&&(!filters.status||(filters.status==='mora'?r.mora:filters.status==='pending'?Number(r.pendingTotal||0)>0:filters.status==='clear'?Number(r.pendingTotal||0)<=0:filters.status==='certificate'?Number(r.certificatesBlocked||0)>0:true))&&(!q||[r.code,r.name,r.group,r.convenio].join(' ').toLowerCase().includes(q)));
}
function masterCollectionMonthly(rows, year, field='total') {
  const out=Array(12).fill(0);
  rows.forEach(r=>{const b=r.appliedByYear?.[String(year)]||{};const arr=b[field]||[];arr.forEach((v,i)=>out[i]+=Number(v||0));});
  return out;
}
function masterCollectionSummary(rows) {
  const out={students:rows.length,debtors:0,moraStudents:0,portfolio:0,moraPortfolio:0,certificatesBlocked:0,certStudents:0,paidTotal:0,aging:{current:0,d0_30:0,d31_60:0,d61_90:0,d90_plus:0,no_payment:0}};
  rows.forEach(r=>{const pending=Number(r.pendingTotal||0);out.portfolio+=pending;out.paidTotal+=Number(r.appliedTotal||0);if(pending>0)out.debtors++;if(r.mora){out.moraStudents++;out.moraPortfolio+=pending;}if(Number(r.certificatesBlocked||0)>0){out.certStudents++;out.certificatesBlocked+=Number(r.certificatesBlocked||0);}const k=r.agingBucket||'current';if(Object.prototype.hasOwnProperty.call(out.aging,k))out.aging[k]++;});
  out.moraRate=out.students?Math.round((out.moraStudents/out.students)*100):0;return out;
}
function masterCollectionGroupRanking(rows) {
  const map={};rows.forEach(r=>{const k=`${r.group}|${r.level}`;if(!map[k])map[k]={name:`${r.group} · ${r.level}`,value:0,students:0,mora:0};map[k].value+=Number(r.pendingTotal||0);map[k].students++;if(r.mora)map[k].mora++;});return Object.values(map).filter(x=>x.value>0).sort((a,b)=>b.value-a.value||b.mora-a.mora||a.name.localeCompare(b.name,'es'));
}
function masterCollectionConvenioRanking(rows) {
  const map={};rows.forEach(r=>{const k=r.convenio||'Sin convenio';if(!map[k])map[k]={name:k,value:0,students:0};map[k].value+=Number(r.pendingTotal||0);map[k].students++;});return Object.values(map).filter(x=>x.value>0).sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name,'es'));
}
function MasterFinancialStatus({row}) {
  if(row.mora)return <span className="master-fin-status bad">Mora</span>;
  if(Number(row.pendingTotal||0)>0)return <span className="master-fin-status warn">Pendiente</span>;
  return <span className="master-fin-status good">Al día</span>;
}
function MasterCollectionsTable({rows=[]}) {
  return <div className="master-collection-table-wrap"><table className="master-collection-table"><thead><tr><th>Estudiante</th><th>Grupo</th><th>Convenio</th><th>Estado</th><th>Matrícula pend.</th><th>Cuotas pend.</th><th>Certificados pend.</th><th>Cartera activa</th><th>Último pago</th><th>Desde último pago</th><th>Aplicado histórico</th></tr></thead><tbody>{rows.map(r=><tr key={`${r.group}|${r.level}|${r.code}`} className={r.mora?'has-mora':Number(r.pendingTotal||0)>0?'has-pending':''}><td><strong>{r.name}</strong><small>{r.code}</small></td><td><strong className="master-student-group">{r.group}</strong><span className={`master-level-badge master-level-${r.level}`}>{r.level}</span></td><td>{r.convenio||'Sin convenio'}</td><td><MasterFinancialStatus row={r}/>{Number(r.certificatesBlocked||0)>0&&<small>{r.certificatesBlocked} certificado{r.certificatesBlocked===1?'':'s'} bloqueado{r.certificatesBlocked===1?'':'s'}</small>}</td><td>{masterMoneyFull(r.pendingMatricula)}</td><td>{masterMoneyFull(r.pendingCuotas)}</td><td>{masterMoneyFull(r.pendingCertificado)}</td><td><strong className={r.mora?'master-danger-text':''}>{masterMoneyFull(r.pendingTotal)}</strong></td><td>{r.lastPayment||'Sin pago aplicado'}<small>{r.lastPaymentAmount?masterMoneyFull(r.lastPaymentAmount):'—'}</small></td><td>{r.daysSinceLastPayment==null?'Sin fecha':`${r.daysSinceLastPayment} días`}<small>{({current:'Al día',d0_30:'0–30 días',d31_60:'31–60 días',d61_90:'61–90 días',d90_plus:'+90 días',no_payment:'Sin pagos'}[r.agingBucket]||'—')}</small></td><td>{masterMoneyFull(r.appliedTotal)}<small>{r.paymentCount||0} aplicación{r.paymentCount===1?'':'es'}</small></td></tr>)}</tbody></table>{!rows.length&&<MasterEmpty text="No hay estudiantes que coincidan con los filtros financieros."/>}</div>;
}
function MasterCobranza({data,year,compareYear,filters,onRefresh}) {
  const rows=masterCollectionFiltered(data,filters),sum=masterCollectionSummary(rows);
  const current=masterCollectionMonthly(rows,year,'total'),compare=masterCollectionMonthly(rows,compareYear,'total'),yearCollected=masterYearTotal(current),monthIndex=new Date().getMonth(),monthCollected=Number(current[monthIndex]||0);
  const levelItems=['B1','B2','I1','I2'].map(k=>({label:{B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'}[k],value:rows.filter(r=>r.level===k).reduce((a,r)=>a+Number(r.pendingTotal||0),0),color:MASTER_LEVEL_COLORS[k]}));
  const agingItems=[{label:'Al día',value:sum.aging.current,color:'#2f8a5b'},{label:'0–30 días',value:sum.aging.d0_30,color:'#7da0c7'},{label:'31–60 días',value:sum.aging.d31_60,color:'#c49a40'},{label:'61–90 días',value:sum.aging.d61_90,color:'#d8783c'},{label:'+90 días',value:sum.aging.d90_plus,color:'#c8302a'},{label:'Sin pagos',value:sum.aging.no_payment,color:'#7b8494'}];
  const convenios=masterCollectionConvenioRanking(rows),groups=masterCollectionGroupRanking(rows),global=data.collections?.summary||{};
  const alerts=rows.filter(r=>r.mora||Number(r.daysSinceLastPayment||0)>90||Number(r.certificatesBlocked||0)>0).sort((a,b)=>(b.mora-a.mora)||Number(b.pendingTotal||0)-Number(a.pendingTotal||0)).slice(0,14);
  return <>
    <div className="master-kpi-grid">
      <MasterKpi label={`Cobrado ${year}`} value={MasterFmtMoney(yearCollected)} sub="pagos aplicados de estudiantes activos filtrados" tone="#16294f" icon="payments" values={current}/>
      <MasterKpi label="Cobrado este mes" value={MasterFmtMoney(monthCollected)} sub={`${MASTER_MONTHS[monthIndex]} del año seleccionado`} trend={masterPercent(monthCollected,Number(compare[monthIndex]||0))} tone="#2f8a5b" icon="chart" values={current}/>
      <MasterKpi label="Cartera activa" value={MasterFmtMoney(sum.portfolio)} sub={`${sum.debtors} estudiantes con rubros pendientes`} tone="#c49a40" icon="payments" values={levelItems.map(x=>x.value)}/>
      <MasterKpi label="Monto identificado en mora" value={MasterFmtMoney(sum.moraPortfolio)} sub={`${sum.moraStudents} estudiantes · ${sum.moraRate}% del filtro`} tone="#c8302a" icon="bell" values={[sum.portfolio-sum.moraPortfolio,sum.moraPortfolio]}/>
      <MasterKpi label="Reportes por aplicar" value={MasterFmtNumber(global.pendingReportsCount)} sub={`${MasterFmtMoney(global.pendingReportsAmount)}${global.pendingReportsAnomalyCount?` · ${global.pendingReportsAnomalyCount} atípico(s) excluido(s)`:''}`} tone="#7956a8" icon="check" values={[global.pendingReportsCount||0]}/>
      <MasterKpi label="Saldo bancario por aplicar" value={MasterFmtMoney(global.bankPendingAmount)} sub={`${global.bankPendingCount||0} comprobantes con saldo`} tone="#315f96" icon="payments" values={[global.bankPendingAmount||0]}/>
      <MasterKpi label="Certificados bloqueados" value={MasterFmtNumber(sum.certificatesBlocked)} sub={`${sum.certStudents} estudiantes con certificado pendiente`} tone="#bf403b" icon="graduation" values={[sum.certificatesBlocked]}/>
      <MasterKpi label="Aplicado histórico" value={MasterFmtMoney(sum.paidTotal)} sub="pagos asociados a los estudiantes filtrados" tone="#287f83" icon="chart" values={current}/>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card master-chart-card"><header><div><span>Cobranza aplicada</span><h3>Pagos mensuales comparados</h3><p>{year} frente a {compareYear} · filtros financieros activos</p></div></header><MasterBarLineChart primary={current} compare={compare} labels={MASTER_MONTHS} primaryLabel={`${year}`} compareLabel={`${compareYear}`} formatValue={MasterFmtMoney}/></section>
      <section className="master-card"><header><div><span>Cartera</span><h3>Pendiente por nivel</h3><p>Matrícula, cuotas y certificados del nivel actual</p></div></header><MasterDonut items={levelItems} centerValue={MasterFmtMoney(sum.portfolio)} centerLabel="CARTERA"/></section>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card"><header><div><span>Convenios</span><h3>Cartera por convenio</h3><p>Saldo identificado de estudiantes activos</p></div></header>{convenios.length?<MasterHorizontalRanking items={convenios.slice(0,10)} valueLabel="" formatValue={MasterFmtMoney}/>:<MasterEmpty text="No hay cartera pendiente para este filtro."/>}</section>
      <section className="master-card"><header><div><span>Recencia de pago</span><h3>Tiempo desde el último pago aplicado</h3><p>No equivale a antigüedad legal de la deuda</p></div></header><MasterDonut items={agingItems} centerValue={MasterFmtNumber(rows.length)} centerLabel="ESTUDIANTES"/></section>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card"><header><div><span>Grupos</span><h3>Mayor cartera activa</h3><p>Ranking por grupo y nivel</p></div></header>{groups.length?<MasterHorizontalRanking items={groups.slice(0,10)} valueLabel="" formatValue={MasterFmtMoney}/>:<MasterEmpty text="No hay saldos pendientes por grupo."/>}</section>
      <section className="master-card"><header><div><span>Control financiero</span><h3>Alertas accionables</h3><p>Mora, falta de pago y certificados pendientes</p></div></header><div className="master-alert-list">{alerts.map((r,i)=><div key={`${r.code}-${i}`} className={`master-alert ${r.mora?'master-alert-high':'master-alert-med'}`}><i/><div><strong>{r.name} · {MasterFmtMoney(r.pendingTotal)}</strong><span>{r.code} · {r.group} · {r.mora?'mora vigente':Number(r.certificatesBlocked||0)>0?'certificado pendiente':'+90 días desde último pago'}</span></div></div>)}{!alerts.length&&<MasterEmpty text="No se detectaron alertas financieras con estos filtros."/>}</div></section>
    </div>
    <MasterConapeMovementsTable data={data} onRefresh={onRefresh}/>
    <section className="master-card master-collection-method"><header><div><span>Metodología</span><h3>Cómo se interpreta esta cartera</h3></div></header><div className="master-notes"><p><strong>Cartera activa:</strong> matrícula, cuotas y certificado pendientes del nivel actual, calculados con las reglas oficiales de pagos.</p><p><strong>Mora:</strong> utiliza el último estado disponible en 7-morosidad; no se deduce únicamente por tener un saldo futuro pendiente.</p><p><strong>Cobrado:</strong> solo cuenta recibos aplicados; excluye filas de venta con recibo 0 y contratos CUOTA_0. Reportes superiores a ₡5 millones se marcan como atípicos y no inflan el KPI pendiente.</p><p><strong>Tiempo desde último pago:</strong> sirve para priorizar seguimiento, pero no sustituye una antigüedad contable por fecha de vencimiento.</p></div></section>
  </>;
}


function masterConapeProspects(data,year,filters={}) {
  const q=String(filters.search||'').trim().toLowerCase();
  return (data.conape?.prospects||[]).filter(x=>(!year||!x.leadYear||String(x.leadYear)===String(year))&&(!filters.advisor||x.advisor===filters.advisor)&&(!filters.stage||x.stageKey===filters.stage)&&(!filters.priority||x.priority===filters.priority)&&(!filters.group||x.group===filters.group)&&(!q||[x.name,x.cedula,x.code,x.group,x.advisor,x.wsNovelty].join(' ').toLowerCase().includes(q)));
}
function masterConapeSync(data,year,filters={}) {
  const q=String(filters.search||'').trim().toLowerCase();
  return (data.conape?.sync||[]).filter(x=>(!year||String(x.periodYear||'')===String(year))&&(!filters.linkStatus||(filters.linkStatus==='linked'?x.linked:!x.linked))&&(!filters.group||x.group===filters.group)&&(!q||[x.name,x.cedula,x.code,x.group,x.novelty].join(' ').toLowerCase().includes(q)));
}
function masterConapeFunnel(rows) {
  const rank={lead:0,solicitud:1,documentos:2,aprobado:3,desembolso:4,activo:5};
  const valid=rows.filter(x=>x.stageKey!=='cancelado');
  const countAtLeast=n=>valid.filter(x=>(rank[x.stageKey]??0)>=n).length;
  return [
    {label:'Lead',value:countAtLeast(0),color:'#7b8494'},
    {label:'Solicitud',value:countAtLeast(1),color:'#315f96'},
    {label:'Documentos',value:countAtLeast(2),color:'#c49a40'},
    {label:'Aprobado',value:countAtLeast(3),color:'#7956a8'},
    {label:'Desembolso',value:countAtLeast(4),color:'#d8783c'},
    {label:'Activo',value:countAtLeast(5),color:'#2f8a5b'},
  ];
}
function masterConapeAdvisorRanking(rows) {
  const map={};rows.forEach(x=>{const k=x.advisor||'Sin asesor';if(!map[k])map[k]={name:k,value:0,alta:0};map[k].value++;if(x.priority==='ALTA')map[k].alta++;});
  return Object.values(map).sort((a,b)=>b.alta-a.alta||b.value-a.value||a.name.localeCompare(b.name,'es'));
}
function masterConapeStageAverages(rows) {
  const map={};rows.filter(x=>x.stageKey!=='cancelado').forEach(x=>{const k=x.stageLabel||x.stageKey;if(!map[k])map[k]={name:k,sum:0,count:0,value:0};map[k].sum+=Number(x.daysStage||0);map[k].count++;});
  return Object.values(map).map(x=>({...x,value:x.count?Math.round(x.sum/x.count):0})).sort((a,b)=>b.value-a.value);
}
function MasterConapePriority({value}) {
  const p=String(value||'BAJA').toUpperCase();return <span className={`master-conape-priority master-conape-priority-${p.toLowerCase()}`}>{p}</span>;
}
function MasterConapeStage({value,label}) {
  const k=String(value||'lead').toLowerCase();return <span className={`master-conape-stage master-conape-stage-${k}`}>{label||k}</span>;
}
function MasterConapeTable({rows=[]}) {
  return <div className="master-conape-table-wrap"><table className="master-conape-table"><thead><tr><th>Prospecto</th><th>Asesor</th><th>Grupo</th><th>Etapa</th><th>Prioridad</th><th>Días en etapa</th><th>Estado WS</th><th>Vínculo Campus</th><th>Acción sugerida</th></tr></thead><tbody>{rows.map((r,i)=><tr key={`${r.cedula}-${i}`} className={r.priority==='ALTA'?'has-alert':''}><td><strong>{r.name||'Sin nombre'}</strong><small>{r.cedula||'Sin cédula'}{r.code?` · ${r.code}`:''}</small></td><td>{r.advisor||'Sin asesor'}</td><td><strong className="master-student-group">{r.group||'Sin grupo'}</strong></td><td><MasterConapeStage value={r.stageKey} label={r.stageLabel}/><small>{r.stageDate||r.leadDate||'Sin fecha'}</small></td><td><MasterConapePriority value={r.priority}/></td><td><strong className={Number(r.daysStage||0)>=30?'master-danger-text':''}>{MasterFmtNumber(r.daysStage||0)} días</strong></td><td>{r.wsNovelty||'Sin novedad'}<small>{r.lastSync?`Consulta ${r.lastSync}`:'—'}</small></td><td><span className={`master-link-status ${r.linked?'linked':'unlinked'}`}>{r.linked?'Vinculado':'Sin vínculo'}</span></td><td><span className="master-conape-action">{r.action||'Dar seguimiento'}</span></td></tr>)}</tbody></table>{!rows.length&&<MasterEmpty text="No hay prospectos CONAPE que coincidan con los filtros."/>}</div>;
}
function MasterConapeSyncTable({rows=[]}) {
  return <div className="master-conape-table-wrap"><table className="master-conape-table master-conape-sync-table"><thead><tr><th>Persona sincronizada</th><th>Último desembolso</th><th>Periodo</th><th>Código</th><th>Grupo</th><th>Estado Campus</th><th>Novedad</th></tr></thead><tbody>{rows.map((r,i)=><tr key={`${r.cedula}-${i}`} className={!r.linked?'has-alert':''}><td><strong>{r.name||'Sin nombre'}</strong><small>{r.cedula}</small></td><td><strong>{r.numDisbursement||'—'}</strong><small>{r.date||'Sin fecha'}</small></td><td>{r.periodMonth&&r.periodYear?`${String(r.periodMonth).padStart(2,'0')}/${r.periodYear}`:'—'}</td><td>{r.code||'—'}</td><td>{r.group||'—'}</td><td><span className={`master-link-status ${r.linked?'linked':'unlinked'}`}>{r.linked?'Vinculado':'Sin vínculo'}</span></td><td>{r.novelty||'—'}<small>{r.lastSync?`Sync ${r.lastSync}`:''}</small></td></tr>)}</tbody></table>{!rows.length&&<MasterEmpty text="No hay registros sincronizados para este filtro."/>}</div>;
}
function MasterConape({data,year,compareYear,filters}) {
  const prospects=masterConapeProspects(data,year,filters),sync=masterConapeSync(data,year,filters),funnel=masterConapeFunnel(prospects),advisors=masterConapeAdvisorRanking(prospects),stages=masterConapeStageAverages(prospects),active=data.conape?.activeStudents||[];
  const activeFiltered=active.filter(x=>(!filters.group||x.group===filters.group)&&(!String(filters.search||'').trim()||[x.name,x.code,x.group].join(' ').toLowerCase().includes(String(filters.search||'').trim().toLowerCase()))),pending=prospects.filter(x=>!['activo','cancelado'].includes(x.stageKey)),approved=prospects.filter(x=>x.stageKey==='aprobado'),disbNoEnrollment=prospects.filter(x=>x.stageKey==='desembolso'&&!x.linked),high=prospects.filter(x=>x.priority==='ALTA'&&!['activo','cancelado'].includes(x.stageKey)),activeMora=activeFiltered.filter(x=>x.mora),linked=sync.filter(x=>x.linked).length,unlinked=sync.length-linked;
  const current=(data.conape?.monthlyByYear?.[year]||Array(12).fill(0)).map(Number),compare=(data.conape?.monthlyByYear?.[compareYear]||Array(12).fill(0)).map(Number),linkItems=[{label:'Vinculados',value:linked,color:'#2f8a5b'},{label:'Sin vínculo',value:unlinked,color:'#c8302a'}];
  const alerts=[...high.slice(0,8).map(x=>({level:'high',title:`${x.name} · ${x.stageLabel}`,detail:`${x.advisor} · ${x.daysStage} días en etapa`})),...sync.filter(x=>!x.linked).slice(0,6).map(x=>({level:'med',title:`${x.name} · desembolso sin vínculo`,detail:`${x.date||'Sin fecha'} · ${x.cedula}`})),...activeMora.slice(0,6).map(x=>({level:'high',title:`${x.name} · activo CONAPE con mora`,detail:`${x.code} · ${x.group} · ${x.level}`}))];
  return <>
    <div className="master-kpi-grid">
      <MasterKpi label="Prospectos CONAPE" value={MasterFmtNumber(prospects.filter(x=>x.stageKey!=='cancelado').length)} sub={`cohorte de ingreso ${year}`} tone="#7956a8" icon="profile" values={funnel.map(x=>x.value)}/>
      <MasterKpi label="Pendientes en proceso" value={MasterFmtNumber(pending.length)} sub="sin activar ni cancelar" tone="#315f96" icon="check" values={funnel.map(x=>x.value)}/>
      <MasterKpi label="Aprobados sin desembolso" value={MasterFmtNumber(approved.length)} sub="requieren seguimiento a firma/desembolso" tone="#c49a40" icon="bell" values={[approved.length]}/>
      <MasterKpi label="Desembolso sin matrícula" value={MasterFmtNumber(disbNoEnrollment.length)} sub="prioridad comercial alta" tone="#c8302a" icon="payments" values={[disbNoEnrollment.length]}/>
      <MasterKpi label="Estudiantes activos CONAPE" value={MasterFmtNumber(activeFiltered.length)} sub="ESTATUS CA en grupos activos" tone="#2f8a5b" icon="graduation" values={activeFiltered.map(x=>x.riskScore||0)}/>
      <MasterKpi label="Activos con mora" value={MasterFmtNumber(activeMora.length)} sub="último estado disponible en 7-morosidad" tone="#bf403b" icon="bell" values={[activeFiltered.length-activeMora.length,activeMora.length]}/>
      <MasterKpi label="Registros CONAPE_SYNC" value={MasterFmtNumber(sync.length)} sub={`último desembolso registrado en ${year}`} tone="#287f83" icon="chart" values={current}/>
      <MasterKpi label="Sin vínculo en Campus" value={MasterFmtNumber(unlinked)} sub={`última sincronización ${data.conape?.summary?.latestSync||'sin fecha'}`} tone="#d8783c" icon="roster" values={[linked,unlinked]}/>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card"><header><div><span>Embudo CONAPE</span><h3>Etapa actual de los prospectos</h3><p>Cohorte de ingreso y filtros seleccionados</p></div></header>{prospects.length?<MasterFunnel items={funnel}/>:<MasterEmpty text="No hay prospectos CONAPE para este año."/>}</section>
      <section className="master-card"><header><div><span>Vinculación</span><h3>CONAPE_SYNC frente al Campus</h3><p>Último registro de desembolso por persona</p></div></header><MasterDonut items={linkItems} centerValue={MasterFmtNumber(sync.length)} centerLabel="REGISTROS"/></section>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card master-chart-card"><header><div><span>Desembolsos sincronizados</span><h3>Último desembolso registrado por mes</h3><p>{year} comparado con {compareYear} · no representa monto cobrado</p></div></header><MasterBarLineChart primary={current} compare={compare} labels={MASTER_MONTHS} primaryLabel={`${year}`} compareLabel={`${compareYear}`}/></section>
      <section className="master-card"><header><div><span>Equipo comercial</span><h3>Casos CONAPE por asesor</h3><p>Ordenado por prioridad alta y volumen</p></div></header>{advisors.length?<MasterHorizontalRanking items={advisors.slice(0,10)}/>:<MasterEmpty text="No hay casos atribuidos a asesores para este filtro."/>}</section>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card"><header><div><span>Tiempo por etapa</span><h3>Promedio de días observados</h3><p>Calculado desde la fecha más reciente de cada etapa</p></div></header>{stages.length?<MasterHorizontalRanking items={stages} valueLabel="días"/>:<MasterEmpty text="No hay fechas suficientes para calcular tiempos."/>}</section>
      <section className="master-card"><header><div><span>Centro CONAPE</span><h3>Alertas accionables</h3><p>Casos trabados, desembolsos sin vínculo y mora</p></div></header><div className="master-alert-list">{alerts.map((a,i)=><div key={i} className={`master-alert master-alert-${a.level}`}><i/><div><strong>{a.title}</strong><span>{a.detail}</span></div></div>)}{!alerts.length&&<MasterEmpty text="No se detectaron alertas CONAPE con estos filtros."/>}</div></section>
    </div>
    <section className="master-card master-conape-detail-card"><header><div><span>Seguimiento comercial</span><h3>Prospectos CONAPE</h3><p>Etapa, prioridad, tiempo observado, sincronización y acción sugerida</p></div><strong className="master-table-count">{prospects.length} caso{prospects.length===1?'':'s'}</strong></header><MasterConapeTable rows={prospects}/></section>
    <section className="master-card master-conape-detail-card"><header><div><span>Sincronización institucional</span><h3>Registros de desembolso</h3><p>Último desembolso registrado por persona y estado de vinculación al Campus</p></div><strong className="master-table-count">{sync.length} registro{sync.length===1?'':'s'}</strong></header><MasterConapeSyncTable rows={sync}/></section>
    <section className="master-card master-conape-method"><header><div><span>Metodología</span><h3>Cómo se interpretan los datos CONAPE</h3></div></header><div className="master-notes"><p><strong>Prospecto CONAPE:</strong> registro comercial identificado por financiamiento, etapa, equipo, TOEIC o sostenimiento CONAPE.</p><p><strong>Desembolso sincronizado:</strong> último desembolso reportado en CONAPE_SYNC; no equivale automáticamente a dinero recibido por la Academia.</p><p><strong>Vinculado:</strong> la cédula tiene código de estudiante en CONAPE_SYNC, PROSPECTOS o DATOS. “Sin vínculo” requiere revisión antes de matricular o aplicar pagos.</p><p><strong>Activo con mora:</strong> estudiante CONAPE con ESTATUS CA y último estado financiero marcado SI en 7-morosidad.</p></div></section>
  </>;
}



function masterTeacherNorm(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');}
function masterTeacherDateValue(value){const s=String(value||'').trim();let m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);if(m)return new Date(Number(m[3]),Number(m[2])-1,Number(m[1])).getTime();m=s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);if(m)return new Date(Number(m[1]),Number(m[2])-1,Number(m[3])).getTime();const d=new Date(s);return Number.isNaN(d.getTime())?Number.MAX_SAFE_INTEGER:d.getTime();}
function masterTeacherGroups(data,filters={}){
  const wanted=masterTeacherNorm(filters.teacher);
  return (data.academic?.groups||[]).filter(g=>{
    const teacher=masterTeacherNorm(g.teacher);
    if(!teacher||teacher==='SIN_DOCENTE'||teacher==='POR_DEFINIR')return false;
    return (!wanted||teacher===wanted)&&(!filters.level||g.level===filters.level)&&(!filters.search||`${g.teacher||''} ${g.code||''}`.toLowerCase().includes(String(filters.search).toLowerCase()));
  });
}
function masterTeacherRows(data,year,filters={}){
  const roster=data.teachers?.roster||[],groups=masterTeacherGroups(data,{teacher:filters.teacher,level:filters.level,search:filters.search}),map={};
  const wanted=masterTeacherNorm(filters.teacher);
  roster.forEach(r=>{const key=masterTeacherNorm(r.name);if(!key)return;if(wanted&&key!==wanted)return;if(filters.level&&Number(r.assignedGroups||0)===0)return;if(filters.search&&!`${r.name||''} ${(r.groupCodes||[]).join(' ')}`.toLowerCase().includes(String(filters.search).toLowerCase()))return;map[key]={name:r.name,source:r.source||'DOCENTES',active:r.active!==false,groups:0,students:0,levels:new Set(),groupCodes:[],due:0,closed:0,pastDue:0,attendancePresent:0,attendanceTotal:0,progressCompleted:0,progressExpected:0,icanDue:0,icanClosed:0,pendingReview:0,activeExams:0,monthlyClosed:Array(12).fill(0),nextLesson:'',nextLessonNum:0};});
  groups.forEach(g=>{const key=masterTeacherNorm(g.teacher);if(!map[key])map[key]={name:g.teacher||'Sin docente',source:'GRUPOS',active:true,groups:0,students:0,levels:new Set(),groupCodes:[],due:0,closed:0,pastDue:0,attendancePresent:0,attendanceTotal:0,progressCompleted:0,progressExpected:0,icanDue:0,icanClosed:0,pendingReview:0,activeExams:0,monthlyClosed:Array(12).fill(0),nextLesson:'',nextLessonNum:0};const x=map[key],b=masterAcademicYearBlock(g,year),att=g.attendanceByYear?.[String(year)]||{},pc=g.progressByYear?.[String(year)]||{};x.groups++;x.students+=Number(g.students||0);x.levels.add(g.level);x.groupCodes.push(g.code);x.due+=masterYearTotal(b.courseDue);x.closed+=Math.min(masterYearTotal(b.courseDue),masterYearTotal(b.courseClosed));x.pastDue+=masterYearTotal(b.coursePastDue);x.attendancePresent+=Number(att.coursePresent||0);x.attendanceTotal+=Number(att.courseTotal||0);x.progressCompleted+=Number(pc.completed||0);x.progressExpected+=Number(pc.expected||0);x.icanDue+=masterYearTotal(b.icanDue);x.icanClosed+=Math.min(masterYearTotal(b.icanDue),masterYearTotal(b.icanClosed));x.pendingReview+=Number(g.exams?.pendingReview||0);x.activeExams+=Number(g.exams?.active||0);(b.courseClosed||[]).forEach((v,i)=>x.monthlyClosed[i]+=Number(v||0));if(g.nextLesson&&(!x.nextLesson||masterTeacherDateValue(g.nextLesson)<masterTeacherDateValue(x.nextLesson))){x.nextLesson=g.nextLesson;x.nextLessonNum=g.nextLessonNum||0;}});
  let rows=Object.values(map).map(x=>{const closurePct=x.due?Math.round((x.closed/x.due)*100):null,attendancePct=x.attendanceTotal?Math.round((x.attendancePresent/x.attendanceTotal)*100):null,progressPct=x.progressExpected?Math.min(100,Math.round((x.progressCompleted/x.progressExpected)*100)):null,icanPct=x.icanDue?Math.round((x.icanClosed/x.icanDue)*100):null;let status='ok';const reasons=[];if(!x.groups){status='unassigned';reasons.push('Sin grupos activos asignados');}if(x.pastDue>0){status='alert';reasons.push(`${x.pastDue} clase${x.pastDue===1?'':'s'} vencida${x.pastDue===1?'':'s'} sin cerrar`);}if(attendancePct!=null&&attendancePct<85){status='alert';reasons.push(`Asistencia promedio ${attendancePct}%`);}if(progressPct!=null&&progressPct<100){if(status==='ok')status='attention';reasons.push(`Progress Check ${progressPct}%`);}if(x.pendingReview>0){status='alert';reasons.push(`${x.pendingReview} examen${x.pendingReview===1?'':'es'} por revisar`);}return {...x,levels:[...x.levels].sort(),closurePct,attendancePct,progressPct,icanPct,status,reasons};});
  if(filters.status)rows=rows.filter(x=>filters.status==='alert'?x.status==='alert':filters.status==='attention'?x.status==='attention':filters.status==='ok'?x.status==='ok':filters.status==='unassigned'?x.status==='unassigned':true);
  return rows.sort((a,b)=>{const w={alert:4,attention:3,unassigned:2,ok:1};return (w[b.status]||0)-(w[a.status]||0)||b.pastDue-a.pastDue||b.groups-a.groups||a.name.localeCompare(b.name,'es');});
}
function MasterTeacherStatus({row}){const label={alert:'Alerta',attention:'Seguimiento',unassigned:'Sin grupo',ok:'Estable'}[row.status]||'Estable';return <span className={`master-teacher-status ${row.status}`}>{label}</span>;}
function MasterTeacherTable({rows=[]}){
  return <div className="master-teacher-table-wrap"><table className="master-teacher-table"><thead><tr><th>Docente</th><th>Estado</th><th>Grupos</th><th>Niveles</th><th>Estudiantes</th><th>Cierre</th><th>Asistencia</th><th>Progress Check</th><th>I CAN</th><th>Exámenes</th><th>Próxima clase</th><th>Motivos</th></tr></thead><tbody>{rows.map(r=><tr key={masterTeacherNorm(r.name)} className={r.status==='alert'?'has-alert':r.status==='unassigned'?'is-unassigned':''}><td><strong>{r.name}</strong><small>{r.source==='DOCENTES'?'Padrón docente':'Detectado en grupos'}</small></td><td><MasterTeacherStatus row={r}/></td><td><strong>{r.groups}</strong><small>{r.groupCodes.slice(0,3).join(' · ')||'Sin asignación'}{r.groupCodes.length>3?` +${r.groupCodes.length-3}`:''}</small></td><td><div className="master-teacher-levels">{r.levels.map(l=><span key={l} className={`master-level-badge master-level-${l}`}>{l}</span>)}{!r.levels.length&&<em>—</em>}</div></td><td>{MasterFmtNumber(r.students)}</td><td><MasterMiniMetric value={r.closurePct} detail={`${r.closed}/${r.due}`} danger={r.pastDue>0}/></td><td><MasterMiniMetric value={r.attendancePct} detail={r.attendancePct==null?'Sin registros':`${r.attendancePresent}/${r.attendanceTotal}`}/></td><td><MasterMiniMetric value={r.progressPct} detail={r.progressPct==null?'Sin vencidos':`${r.progressCompleted}/${r.progressExpected}`}/></td><td><MasterMiniMetric value={r.icanPct} detail={r.icanPct==null?'Sin vencidos':`${r.icanClosed}/${r.icanDue}`}/></td><td><strong className={r.pendingReview?'master-danger-text':''}>{r.pendingReview}</strong><small>{r.activeExams} activos</small></td><td><strong className="master-next-lesson">{r.nextLesson||'Sin próxima fecha'}</strong><small>{r.nextLessonNum?`Lección ${r.nextLessonNum}`:'—'}</small></td><td><div className="master-teacher-reasons">{r.reasons.slice(0,3).map((x,i)=><span key={i}>{x}</span>)}{!r.reasons.length&&<em>Operación estable</em>}</div></td></tr>)}</tbody></table>{!rows.length&&<MasterEmpty text="No hay docentes que coincidan con los filtros."/>}</div>;
}
function MasterDocentes({data,year,filters}){
  const rows=masterTeacherRows(data,year,filters),assigned=rows.filter(x=>x.groups>0),groups=masterTeacherGroups(data,filters),active=rows.length,groupsCount=groups.length,students=assigned.reduce((s,x)=>s+x.students,0),due=assigned.reduce((s,x)=>s+x.due,0),closed=assigned.reduce((s,x)=>s+x.closed,0),pastDue=assigned.reduce((s,x)=>s+x.pastDue,0),attP=assigned.reduce((s,x)=>s+x.attendancePresent,0),attT=assigned.reduce((s,x)=>s+x.attendanceTotal,0),closurePct=due?Math.round((closed/due)*100):null,attendancePct=attT?Math.round((attP/attT)*100):null,alerts=rows.filter(x=>x.status==='alert'),unassigned=rows.filter(x=>x.status==='unassigned'),avgGroups=assigned.length?Math.round((groupsCount/assigned.length)*10)/10:0;
  const levelItems=['B1','B2','I1','I2'].map(k=>({label:{B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'}[k],value:groups.filter(g=>g.level===k).length,color:MASTER_LEVEL_COLORS[k]}));
  const load=assigned.map(x=>({name:x.name,value:x.groups})).sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name,'es'));
  const studentRank=assigned.map(x=>({name:x.name,value:x.students})).sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name,'es'));
  const closureRank=assigned.filter(x=>x.closurePct!=null).map(x=>({name:x.name,value:x.closurePct})).sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name,'es'));
  const heat=assigned.slice().sort((a,b)=>b.groups-a.groups).slice(0,12).map(x=>({name:x.name,values:x.monthlyClosed}));
  const groupRows=masterAcademicGroupRows(groups,year);
  return <>
    <div className="master-kpi-grid">
      <MasterKpi label="Docentes activos" value={MasterFmtNumber(active)} sub="padrón DOCENTES y asignaciones reales" tone="#16294f" icon="graduation" values={rows.map(x=>x.groups)}/>
      <MasterKpi label="Docentes con grupos" value={MasterFmtNumber(assigned.length)} sub={`${unassigned.length} sin grupo activo`} tone="#287f83" icon="roster" values={assigned.map(x=>x.groups)}/>
      <MasterKpi label="Grupos activos" value={MasterFmtNumber(groupsCount)} sub={`${avgGroups} grupos por docente asignado`} tone="#c49a40" icon="calendar" values={levelItems.map(x=>x.value)}/>
      <MasterKpi label="Estudiantes asignados" value={MasterFmtNumber(students)} sub="ESTATUS CA en grupos filtrados" tone="#2f8a5b" icon="profile" values={assigned.map(x=>x.students)}/>
      <MasterKpi label="Cumplimiento de cierre" value={closurePct==null?'Sin vencidas':`${closurePct}%`} sub={`${pastDue} clases vencidas sin cerrar`} tone={pastDue?'#c8302a':'#315f96'} icon="check" values={masterSumArrays(assigned.map(x=>x.monthlyClosed))}/>
      <MasterKpi label="Asistencia promedio" value={attendancePct==null?'Sin registros':`${attendancePct}%`} sub={`${MasterFmtNumber(attP)} presentes de ${MasterFmtNumber(attT)}`} tone="#b8893b" icon="profile" values={assigned.map(x=>x.attendancePct||0)}/>
      <MasterKpi label="Docentes con alertas" value={MasterFmtNumber(alerts.length)} sub="cierres, asistencia o exámenes" tone={alerts.length?'#c8302a':'#2f8a5b'} icon="bell" values={alerts.map(x=>x.pastDue+x.pendingReview)}/>
      <MasterKpi label="Exámenes por revisar" value={MasterFmtNumber(assigned.reduce((s,x)=>s+x.pendingReview,0))} sub="intentos enviados pendientes" tone="#7956a8" icon="check" values={assigned.map(x=>x.pendingReview)}/>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card"><header><div><span>Carga docente</span><h3>Grupos activos por docente</h3><p>Asignaciones reales en GRUPOS</p></div></header>{load.length?<MasterHorizontalRanking items={load} valueLabel="grupos"/>:<MasterEmpty text="No hay asignaciones para este filtro."/>}</section>
      <section className="master-card"><header><div><span>Distribución académica</span><h3>Grupos por nivel</h3><p>Solo grupos actualmente en curso</p></div></header><MasterDonut items={levelItems} centerValue={MasterFmtNumber(groupsCount)} centerLabel="GRUPOS"/></section>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card"><header><div><span>Capacidad</span><h3>Estudiantes por docente</h3><p>Carga actual de estudiantes activos</p></div></header>{studentRank.length?<MasterHorizontalRanking items={studentRank.slice(0,12)} valueLabel="estudiantes"/>:<MasterEmpty text="No hay estudiantes asignados."/>}</section>
      <section className="master-card"><header><div><span>Disciplina operativa</span><h3>Cumplimiento de cierres</h3><p>Clases cerradas sobre clases vencidas</p></div></header>{closureRank.length?<MasterHorizontalRanking items={closureRank.slice(0,12)} valueLabel="" formatValue={v=>`${MasterFmtNumber(v)}%`}/>:<MasterEmpty text="No hay clases vencidas para comparar."/>}</section>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card"><header><div><span>Actividad mensual</span><h3>Clases cerradas por docente</h3><p>Heatmap del año seleccionado</p></div></header>{heat.length?<MasterHeatmap rows={heat} labels={MASTER_MONTHS} rowLabel="Docente"/>:<MasterEmpty text="No hay cierres registrados."/>}</section>
      <section className="master-card"><header><div><span>Centro docente</span><h3>Alertas accionables</h3><p>Prioriza cierres, asistencia, revisión y asignaciones</p></div></header><div className="master-alert-list">{alerts.slice(0,14).map((r,i)=><div key={i} className="master-alert master-alert-high"><i/><div><strong>{r.name}</strong><span>{r.reasons.slice(0,2).join(' · ')}</span></div></div>)}{unassigned.slice(0,8).map((r,i)=><div key={`u${i}`} className="master-alert master-alert-med"><i/><div><strong>{r.name}</strong><span>Docente activo sin grupo en curso</span></div></div>)}{!alerts.length&&!unassigned.length&&<MasterEmpty text="No se detectaron alertas docentes con estos filtros."/>}</div></section>
    </div>
    <section className="master-card master-teacher-detail-card"><header><div><span>Radiografía docente</span><h3>Docentes y carga operativa</h3><p>Grupos, estudiantes, cierres, asistencia, Progress Check, I CAN y exámenes</p></div><strong className="master-table-count">{rows.length} docente{rows.length===1?'':'s'}</strong></header><MasterTeacherTable rows={rows}/></section>
    <section className="master-card master-academic-detail-card"><header><div><span>Detalle de grupos</span><h3>Grupos bajo la selección actual</h3><p>Vista académica del año seleccionado</p></div><strong className="master-table-count">{groupRows.length} grupo{groupRows.length===1?'':'s'}</strong></header><MasterAcademicTable rows={groupRows}/></section>
    <section className="master-card master-teacher-method"><header><div><span>Metodología</span><h3>Cómo se interpretan los indicadores docentes</h3></div></header><div className="master-notes"><p><strong>Docente activo:</strong> registro ACTIVO en DOCENTES o docente asignado a un grupo marcado En curso.</p><p><strong>Carga docente:</strong> cantidad de grupos y estudiantes CA actualmente bajo su responsabilidad.</p><p><strong>Cumplimiento:</strong> clases cerradas sobre clases cuya fecha ya venció dentro del año seleccionado.</p><p><strong>Alerta docente:</strong> cierre vencido, asistencia promedio inferior al 85%, Progress Check incompleto o examen enviado pendiente de revisión.</p></div></section>
  </>;
}


function masterExamFiltered(data,year,filters={}) {
  const rows=(data?.exams?.groupRows||[]).map(g=>({...g,yearStats:(g.byYear||{})[String(year)]||{}}));
  const q=String(filters.search||'').trim().toLowerCase();
  return rows.filter(g=>(!filters.level||g.level===filters.level)&&(!filters.teacher||g.teacher===filters.teacher)&&(!filters.group||g.code===filters.group)&&(!q||`${g.code} ${g.teacher} ${g.level}`.toLowerCase().includes(q)));
}
function masterExamResults(data,year,filters={}) {
  const q=String(filters.search||'').trim().toLowerCase();
  return (data?.exams?.results||[]).filter(r=>String(r.year)===String(year)&&(!filters.level||r.level===filters.level)&&(!filters.teacher||r.teacher===filters.teacher)&&(!filters.group||r.group===filters.group)&&(!filters.category||r.category===filters.category)&&(!filters.status||(filters.status==='pending'?r.status==='pending':filters.status==='graded'?r.status==='graded':filters.status==='passed'?r.status==='graded'&&r.passed:filters.status==='failed'?r.status==='graded'&&!r.passed:true))&&(!q||`${r.name} ${r.code} ${r.group} ${r.evalLabel} ${r.teacher}`.toLowerCase().includes(q))).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(a.name||'').localeCompare(String(b.name||''),'es'));
}
function masterExamAggregate(groups,results,year) {
  const sum={expected:0,expectedKnown:0,applied:0,graded:0,pending:0,scoreSum:0,scoreCount:0,passed:0,failed:0,activeActivations:0,groupsWithGap:0,monthlyApplied:Array(12).fill(0),monthlyGraded:Array(12).fill(0),category:{oral:{applied:0,graded:0,scoreSum:0,scoreCount:0,passed:0},written:{applied:0,graded:0,scoreSum:0,scoreCount:0,passed:0},social:{applied:0,graded:0,scoreSum:0,scoreCount:0,passed:0},ican:{applied:0,graded:0,scoreSum:0,scoreCount:0,passed:0},other:{applied:0,graded:0,scoreSum:0,scoreCount:0,passed:0}}};
  groups.forEach(g=>{const y=g.yearStats||{};if(y.expected!=null){sum.expected+=Number(y.expected||0);sum.expectedKnown++;}sum.activeActivations+=Number(y.activeActivations||0);if(y.expected!=null&&Number(y.applied||0)<Number(y.expected||0))sum.groupsWithGap++;});
  results.forEach(r=>{sum.applied++;const m=Math.max(0,Math.min(11,Number(r.month||0)));sum.monthlyApplied[m]++;const c=sum.category[r.category]||sum.category.other;c.applied++;if(r.status==='pending'){sum.pending++;return;}if(r.status==='graded'){sum.graded++;sum.monthlyGraded[m]++;c.graded++;if(r.score!=null&&Number.isFinite(Number(r.score))){const sc=Number(r.score);sum.scoreSum+=sc;sum.scoreCount++;c.scoreSum+=sc;c.scoreCount++;if(sc>=70){sum.passed++;c.passed++;}else sum.failed++;}}});
  sum.avg=sum.scoreCount?Math.round((sum.scoreSum/sum.scoreCount)*10)/10:null;sum.passRate=sum.scoreCount?Math.round((sum.passed/sum.scoreCount)*100):null;sum.reviewRate=sum.applied?Math.round((sum.graded/sum.applied)*100):null;sum.completionRate=sum.expected?Math.min(100,Math.round((sum.applied/sum.expected)*100)):null;return sum;
}
function masterExamLevelRanking(results) {
  return ['B1','B2','I1','I2'].map(level=>{const x=results.filter(r=>r.level===level&&r.status==='graded'&&r.score!=null);return{name:({B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'}[level]||level),value:x.length?Math.round((x.reduce((a,r)=>a+Number(r.score||0),0)/x.length)*10)/10:0,count:x.length};}).filter(x=>x.count>0).sort((a,b)=>b.value-a.value);
}
function MasterExamStatus({row}) {
  if(row.status==='pending')return <span className="master-exam-status master-exam-status-pending">Pendiente de revisión</span>;
  if(row.passed)return <span className="master-exam-status master-exam-status-passed">Aprobada</span>;
  return <span className="master-exam-status master-exam-status-failed">No aprobada</span>;
}
function MasterExamGroupTable({rows=[]}) {
  return <div className="master-exam-table-wrap"><table className="master-exam-table"><thead><tr><th>Grupo</th><th>Docente</th><th>Estudiantes</th><th>Evaluaciones vencidas</th><th>Aplicaciones esperadas</th><th>Aplicadas</th><th>Calificadas</th><th>Pendientes</th><th>Cumplimiento</th><th>Promedio</th><th>Aprobación</th><th>Activaciones</th></tr></thead><tbody>{rows.map(g=>{const y=g.yearStats||{},avg=y.scoreCount?Math.round((Number(y.scoreSum||0)/Number(y.scoreCount))*10)/10:null,pass=y.scoreCount?Math.round((Number(y.passed||0)/Number(y.scoreCount))*100):null,completion=y.expected?Math.min(100,Math.round((Number(y.applied||0)/Number(y.expected))*100)):null;return <tr key={`${g.code}|${g.level}`} className={Number(y.pending||0)>0||completion!=null&&completion<100?'has-alert':''}><td><strong>{g.code}</strong><span className={`master-level-badge master-level-${g.level}`}>{g.level}</span></td><td>{g.teacher||'Sin docente'}</td><td>{MasterFmtNumber(g.students||g.observedStudents||0)}<small>{g.active?'activos':'observados'}</small></td><td>{MasterFmtNumber(y.dueEvaluations||0)}</td><td>{y.expected==null?'Sin base':MasterFmtNumber(y.expected)}</td><td>{MasterFmtNumber(y.applied||0)}</td><td>{MasterFmtNumber(y.graded||0)}</td><td><strong className={Number(y.pending||0)>0?'master-danger-text':''}>{MasterFmtNumber(y.pending||0)}</strong></td><td><MasterMiniMetric value={completion} detail={completion==null?'No calculable':`${y.applied||0}/${y.expected||0}`}/></td><td>{avg==null?'Sin notas':`${avg}`}</td><td>{pass==null?'Sin notas':`${pass}%`}</td><td>{MasterFmtNumber(y.activations||0)}<small>{y.activeActivations||0} activas</small></td></tr>})}</tbody></table>{!rows.length&&<MasterEmpty text="No hay grupos con actividad de evaluación para estos filtros."/>}</div>;
}
function MasterExamResultsTable({rows=[]}) {
  return <div className="master-exam-results-wrap"><table className="master-exam-results"><thead><tr><th>Estudiante</th><th>Grupo</th><th>Evaluación</th><th>Tipo</th><th>Estado</th><th>Nota</th><th>Fecha</th><th>Fuente</th></tr></thead><tbody>{rows.slice(0,120).map((r,i)=><tr key={`${r.group}|${r.code}|${r.evalKey}|${i}`} className={r.status==='pending'?'is-pending':r.status==='graded'&&!r.passed?'is-failed':''}><td><strong>{r.name||'Sin nombre'}</strong><small>{r.code||'Sin código'}</small></td><td><strong className="master-student-group">{r.group}</strong><span className={`master-level-badge master-level-${r.level}`}>{r.level}</span></td><td>{r.evalLabel}</td><td>{({oral:'Oral',written:'Escrita',social:'Social Skill',ican:'I CAN',other:'Otra'}[r.category]||r.category)}</td><td><MasterExamStatus row={r}/></td><td><strong>{r.score==null?'—':r.score}</strong></td><td>{r.date||'Sin fecha'}</td><td>{r.source||'—'}<small>{r.teacher||'Sin docente'}</small></td></tr>)}</tbody></table>{!rows.length&&<MasterEmpty text="No hay resultados que coincidan con los filtros."/>}</div>;
}
function MasterExamenes({data,year,compareYear,filters}) {
  const groups=masterExamFiltered(data,year,filters),results=masterExamResults(data,year,filters),compareResults=masterExamResults(data,compareYear,{...filters,status:''}),sum=masterExamAggregate(groups,results,year),compareSum=masterExamAggregate(masterExamFiltered(data,compareYear,filters),compareResults,compareYear);
  const categoryItems=[['oral','Orales','#315f96'],['written','Escritas','#c49a40'],['social','Social Skill','#7956a8'],['ican','I CAN','#8a4aa0'],['other','Otras','#7b8494']].map(([k,label,color])=>({label,value:sum.category[k].applied,color})).filter(x=>x.value>0);
  const radarItems=[['oral','Oral','#315f96'],['written','Escrita','#c49a40'],['social','Social Skill','#7956a8'],['ican','I CAN','#8a4aa0']].map(([k,label,color])=>{const c=sum.category[k];return{label,value:c.scoreCount?Math.round((c.scoreSum/c.scoreCount)*10)/10:0,max:100,color};});
  const levelRank=masterExamLevelRanking(results),heat=groups.map(g=>({name:`${g.code} · ${g.level}`,values:(g.yearStats?.monthlyApplied||Array(12).fill(0))})).filter(x=>x.values.some(Number)).slice(0,15);
  const alerts=[];groups.forEach(g=>{const y=g.yearStats||{},completion=y.expected?Math.min(100,Math.round((Number(y.applied||0)/Number(y.expected))*100)):null;if(Number(y.pending||0)>0)alerts.push({level:'high',title:`${g.code} · ${y.pending} por revisar`,detail:`${g.level} · ${g.teacher}`});if(completion!=null&&completion<100)alerts.push({level:'med',title:`${g.code} · cumplimiento ${completion}%`,detail:`${y.applied||0} de ${y.expected||0} aplicaciones esperadas`});});results.filter(r=>r.status==='graded'&&!r.passed).slice(0,8).forEach(r=>alerts.push({level:'med',title:`${r.name} · nota ${r.score}`,detail:`${r.evalLabel} · ${r.group}`}));
  return <>
    <div className="master-kpi-grid">
      <MasterKpi label="Aplicaciones esperadas" value={sum.expectedKnown?MasterFmtNumber(sum.expected):'Sin base'} sub={`${groups.length} grupos en la selección`} tone="#16294f" icon="calendar" values={groups.map(g=>g.yearStats?.expected||0)}/>
      <MasterKpi label="Evaluaciones aplicadas" value={MasterFmtNumber(sum.applied)} sub={`${sum.completionRate==null?'cumplimiento no calculable':sum.completionRate+'% de cobertura'}`} trend={masterPercent(sum.applied,compareSum.applied)} tone="#315f96" icon="check" values={sum.monthlyApplied}/>
      <MasterKpi label="Calificadas" value={MasterFmtNumber(sum.graded)} sub={`${sum.reviewRate==null?'sin aplicaciones':sum.reviewRate+'% revisado'}`} trend={masterPercent(sum.graded,compareSum.graded)} tone="#2f8a5b" icon="graduation" values={sum.monthlyGraded}/>
      <MasterKpi label="Pendientes de revisión" value={MasterFmtNumber(sum.pending)} sub="envíos recibidos sin nota definitiva" tone={sum.pending?'#c8302a':'#2f8a5b'} icon="bell" values={groups.map(g=>g.yearStats?.pending||0)}/>
      <MasterKpi label="Promedio evaluaciones" value={sum.avg==null?'Sin notas':sum.avg} sub={`${MasterFmtNumber(sum.scoreCount)} resultados válidos${compareSum.avg!=null?` · ${compareYear}: ${compareSum.avg}`:''}`} tone="#c49a40" icon="chart" values={radarItems.map(x=>x.value)}/>
      <MasterKpi label="Aprobación" value={sum.passRate==null?'Sin notas':`${sum.passRate}%`} sub={`${sum.passed} aprobadas · ${sum.failed} no aprobadas`} tone="#287f83" icon="check" values={[sum.passed,sum.failed]}/>
      <MasterKpi label="Activaciones vigentes" value={MasterFmtNumber(sum.activeActivations)} sub="exámenes abiertos o programados" tone="#7956a8" icon="calendar" values={groups.map(g=>g.yearStats?.activeActivations||0)}/>
      <MasterKpi label="Grupos con brecha" value={MasterFmtNumber(sum.groupsWithGap)} sub="aplicaciones menores a las esperadas" tone={sum.groupsWithGap?'#bf403b':'#2f8a5b'} icon="roster" values={groups.map(g=>g.yearStats?.expected>g.yearStats?.applied?1:0)}/>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card master-chart-card"><header><div><span>Actividad mensual</span><h3>Aplicadas frente a calificadas</h3><p>{year} · filtros de evaluación activos</p></div></header><MasterBarLineChart primary={sum.monthlyApplied} compare={sum.monthlyGraded} labels={MASTER_MONTHS} primaryLabel="Aplicadas" compareLabel="Calificadas"/></section>
      <section className="master-card"><header><div><span>Composición</span><h3>Evaluaciones por tipo</h3><p>Registros efectivamente aplicados</p></div></header>{categoryItems.length?<MasterDonut items={categoryItems} centerValue={MasterFmtNumber(sum.applied)} centerLabel="APLICADAS"/>:<MasterEmpty text="No hay aplicaciones en el periodo."/>}</section>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card"><header><div><span>Rendimiento</span><h3>Promedio por componente</h3><p>Solo notas definitivas disponibles</p></div></header><MasterRadar items={radarItems}/></section>
      <section className="master-card"><header><div><span>Niveles</span><h3>Promedio académico por nivel</h3><p>Escala de 0 a 100</p></div></header>{levelRank.length?<MasterHorizontalRanking items={levelRank} valueLabel="puntos" formatValue={v=>Number(v).toFixed(1)}/>:<MasterEmpty text="No hay notas válidas por nivel."/>}</section>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card"><header><div><span>Distribución temporal</span><h3>Aplicaciones por grupo y mes</h3><p>Heatmap del año seleccionado</p></div></header>{heat.length?<MasterHeatmap rows={heat} labels={MASTER_MONTHS} rowLabel="Grupo"/>:<MasterEmpty text="No hay actividad mensual para mostrar."/>}</section>
      <section className="master-card"><header><div><span>Centro de evaluación</span><h3>Alertas accionables</h3><p>Revisión, cobertura y resultados bajos</p></div></header><div className="master-alert-list">{alerts.slice(0,16).map((a,i)=><div key={i} className={`master-alert master-alert-${a.level==='high'?'high':'med'}`}><i/><div><strong>{a.title}</strong><span>{a.detail}</span></div></div>)}{!alerts.length&&<MasterEmpty text="No se detectaron alertas de evaluación con estos filtros."/>}</div></section>
    </div>
    <section className="master-card master-exam-group-card"><header><div><span>Cumplimiento por grupo</span><h3>Programación, aplicación y revisión</h3><p>Las aplicaciones esperadas usan estudiantes activos y evaluaciones cuyo hito ya venció</p></div><strong className="master-table-count">{groups.length} grupo{groups.length===1?'':'s'}</strong></header><MasterExamGroupTable rows={groups}/></section>
    <section className="master-card master-exam-results-card"><header><div><span>Resultados individuales</span><h3>Evaluaciones aplicadas</h3><p>Última versión válida por estudiante, grupo y tipo</p></div><strong className="master-table-count">{results.length} resultado{results.length===1?'':'s'}</strong></header><MasterExamResultsTable rows={results}/></section>
    <section className="master-card master-exam-method"><header><div><span>Metodología</span><h3>Cómo se interpreta el rendimiento</h3></div></header><div className="master-notes"><p><strong>Aplicada:</strong> evaluación oral cerrada o intento escrito enviado. Un intento todavía abierto no se cuenta.</p><p><strong>Calificada:</strong> existe una nota final en revisión, intento o notas oficiales. Un envío pendiente no se considera reprobado.</p><p><strong>Aprobación:</strong> porcentaje de resultados definitivos con nota igual o superior a 70.</p><p><strong>Cumplimiento:</strong> aplicaciones observadas sobre estudiantes activos multiplicados por los hitos de evaluación ya vencidos: lecciones 9, 17, 18, 25, 31 y 32.</p></div></section>
  </>;
}



const MASTER_ALERT_AREA_COLORS={academica:'#315f96',estudiantes:'#2f8a5b',cobranza:'#bf403b',conape:'#7956a8',docentes:'#287f83',examenes:'#b8893b',ventas:'#c49a40'};
function masterAlertFiltered(data,year,filters={}){
  const q=String(filters.search||'').trim().toLowerCase();
  return (data?.institutionalAlerts?.items||[]).filter(a=>(!year||String(a.year)===String(year))&&(!filters.level||a.level===filters.level)&&(!filters.area||a.area===filters.area)&&(!filters.age||(filters.age==='0-7'?Number(a.ageDays||0)<=7:filters.age==='8-30'?Number(a.ageDays||0)>=8&&Number(a.ageDays||0)<=30:filters.age==='31-60'?Number(a.ageDays||0)>=31&&Number(a.ageDays||0)<=60:Number(a.ageDays||0)>=61))&&(!q||[a.title,a.detail,a.entity,a.owner,a.areaLabel].join(' ').toLowerCase().includes(q)));
}
function MasterAlertLevel({level}){const meta={critical:['Crítica','critical'],medium:['Media','medium'],info:['Informativa','info']}[level]||['Informativa','info'];return <span className={`master-institutional-level ${meta[1]}`}>{meta[0]}</span>}
function MasterAlertTable({rows,setSection}){
  return <div className="master-institutional-table-wrap"><table className="master-institutional-table"><thead><tr><th>Prioridad</th><th>Área</th><th>Alerta</th><th>Entidad</th><th>Antigüedad</th><th>Responsable</th><th>Acción</th></tr></thead><tbody>{rows.map(a=><tr key={a.id} className={`is-${a.level}`}><td><MasterAlertLevel level={a.level}/></td><td><span className="master-institutional-area" style={{'--alert-area':MASTER_ALERT_AREA_COLORS[a.area]||'#687386'}}><i/>{a.areaLabel}</span></td><td><strong>{a.title}</strong><small>{a.detail}</small></td><td><strong>{a.entity||'—'}</strong><small>{a.entityType||'hecho observable'}{a.date?` · ${a.date}`:''}</small></td><td><strong>{MasterFmtNumber(a.ageDays||0)} días</strong><small>{Number(a.ageDays||0)<=7?'reciente':Number(a.ageDays||0)<=30?'8–30 días':Number(a.ageDays||0)<=60?'31–60 días':'+61 días'}</small></td><td>{a.owner||'Super Admin'}</td><td><button type="button" onClick={()=>setSection(a.route||a.area)}>{a.action||'Abrir módulo'} →</button></td></tr>)}</tbody></table>{!rows.length&&<MasterEmpty text="No hay alertas que coincidan con los filtros seleccionados."/>}</div>;
}
function MasterAlertas({data,year,filters,setSection}){
  const rows=masterAlertFiltered(data,year,filters),summary={total:rows.length,critical:0,medium:0,info:0};rows.forEach(a=>summary[a.level]++);
  const areas={};rows.forEach(a=>{if(!areas[a.area])areas[a.area]={label:a.areaLabel,value:0,color:MASTER_ALERT_AREA_COLORS[a.area]||'#687386',critical:0,medium:0,info:0};areas[a.area].value++;areas[a.area][a.level]++;});
  const areaItems=Object.values(areas).sort((a,b)=>b.value-a.value),severity=[{label:'Críticas',value:summary.critical,color:'#c8302a'},{label:'Medias',value:summary.medium,color:'#c49a40'},{label:'Informativas',value:summary.info,color:'#315f96'}];
  const ranking=areaItems.map(x=>({label:x.label,value:x.value,color:x.color}));
  const heat=areaItems.map(x=>({label:x.label,values:[x.critical,x.medium,x.info]}));
  const monthly={critical:Array(12).fill(0),medium:Array(12).fill(0),info:Array(12).fill(0)};rows.forEach(a=>{const m=Number(a.month);if(m>=0&&m<12)monthly[a.level][m]++;});
  const aged=rows.filter(a=>Number(a.ageDays||0)>=31).length;
  return <>
    <div className="master-kpi-grid">
      <MasterKpi label="Alertas abiertas" value={MasterFmtNumber(summary.total)} sub="hechos vigentes bajo los filtros" tone="#16294f" icon="bell" values={monthly.critical.map((v,i)=>v+monthly.medium[i]+monthly.info[i])}/>
      <MasterKpi label="Críticas" value={MasterFmtNumber(summary.critical)} sub="requieren atención prioritaria" tone="#c8302a" icon="bell" values={monthly.critical}/>
      <MasterKpi label="Prioridad media" value={MasterFmtNumber(summary.medium)} sub="requieren seguimiento" tone="#c49a40" icon="check" values={monthly.medium}/>
      <MasterKpi label="Informativas" value={MasterFmtNumber(summary.info)} sub="próximas acciones y vigilancia" tone="#315f96" icon="chart" values={monthly.info}/>
      <MasterKpi label="Con más de 30 días" value={MasterFmtNumber(aged)} sub="antigüedad observable" tone="#7956a8" icon="calendar" values={monthly.medium}/>
      <MasterKpi label="Áreas afectadas" value={MasterFmtNumber(areaItems.length)} sub="módulos con pendientes vigentes" tone="#287f83" icon="roster" values={areaItems.map(x=>x.value)}/>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card"><header><div><span>Prioridad institucional</span><h3>Distribución por severidad</h3><p>Críticas, medias e informativas</p></div></header><MasterDonut items={severity} centerValue={MasterFmtNumber(summary.total)} centerLabel="ALERTAS"/></section>
      <section className="master-card"><header><div><span>Concentración</span><h3>Alertas por área</h3><p>Ordenadas de mayor a menor volumen</p></div></header>{ranking.length?<MasterHorizontalRanking items={ranking}/>:<MasterEmpty text="No hay áreas con alertas bajo este filtro."/>}</section>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card master-chart-card"><header><div><span>Evolución observable</span><h3>Alertas por mes de origen</h3><p>Críticas frente a prioridad media durante {year}</p></div></header><MasterBarLineChart primary={monthly.critical} compare={monthly.medium} labels={MASTER_MONTHS} primaryLabel="Críticas" compareLabel="Medias"/></section>
      <section className="master-card"><header><div><span>Matriz institucional</span><h3>Área × prioridad</h3><p>Crítica · Media · Informativa</p></div></header>{heat.length?<MasterHeatmap rows={heat} labels={['Crítica','Media','Info']} rowLabel="Área"/>:<MasterEmpty text="No hay alertas para construir la matriz."/>}</section>
    </div>
    <section className="master-card master-institutional-detail-card"><header><div><span>Bandeja institucional</span><h3>Alertas y pendientes accionables</h3><p>Cada registro abre el módulo responsable sin modificar datos</p></div><strong className="master-table-count">{rows.length} alerta{rows.length===1?'':'s'}</strong></header><MasterAlertTable rows={rows} setSection={setSection}/></section>
    <section className="master-card master-institutional-method"><header><div><span>Metodología</span><h3>Cómo se genera esta bandeja</h3></div></header><div className="master-notes"><p><strong>Crítica:</strong> clases vencidas sin cerrar, morosidad, certificados bloqueados, casos CONAPE prioritarios, grupos sin docente, revisiones vencidas o brechas de evaluación.</p><p><strong>Media:</strong> riesgo estudiantil moderado, Progress Check o I CAN incompleto, cartera sin movimiento, pagos por aplicar, casos CONAPE en seguimiento y resultados inferiores a 70.</p><p><strong>Informativa:</strong> grupos próximos a finalizar y procesos que deben vigilarse sin constituir incumplimiento crítico.</p><p><strong>Estado:</strong> la bandeja refleja hechos vigentes en las fuentes. No crea tareas ficticias ni marca resoluciones manuales que todavía no tienen bitácora propia.</p></div></section>
  </>;
}


function masterTrendAnnual(data){return (data?.trends?.annual||[]).slice().sort((a,b)=>Number(a.year)-Number(b.year));}
function masterTrendYearRow(data,year){return masterTrendAnnual(data).find(x=>String(x.year)===String(year))||{};}
function masterTrendDelta(current,previous,key){const c=Number(current?.[key]||0),p=Number(previous?.[key]||0);return masterPercent(c,p);}
function MasterTrendTable({rows=[]}){
  return <div className="master-trend-table-wrap"><table className="master-trend-table"><thead><tr><th>Año</th><th>Matrículas</th><th>Cobros aplicados</th><th>Cohorte retenida</th><th>Retención</th><th>Grupos con actividad</th><th>Docentes observados</th><th>Clases cerradas</th><th>Cierre</th><th>Evaluaciones</th><th>Promedio</th><th>Aprobación</th><th>Desembolsos CONAPE</th></tr></thead><tbody>{rows.map(r=><tr key={r.year}><td><strong>{r.year}</strong></td><td>{MasterFmtNumber(r.enrollments)}</td><td>{MasterFmtMoney(r.income)}</td><td>{MasterFmtNumber(r.retained)}</td><td>{r.retentionPct==null?'Sin base':`${r.retentionPct}%`}</td><td>{MasterFmtNumber(r.groups)}</td><td>{MasterFmtNumber(r.teachers)}</td><td>{MasterFmtNumber(r.classesClosed)}</td><td>{r.closurePct==null?'Sin base':`${r.closurePct}%`}</td><td>{MasterFmtNumber(r.examsApplied)}</td><td>{r.examAverage==null?'Sin nota':r.examAverage}</td><td>{r.passPct==null?'Sin base':`${r.passPct}%`}</td><td>{MasterFmtNumber(r.conapeDisbursements)}</td></tr>)}</tbody></table>{!rows.length&&<MasterEmpty text="No hay años suficientes para construir tendencias históricas."/>}</div>;
}
function MasterTendencias({data,year,compareYear}){
  const t=data.trends||{},rows=masterTrendAnnual(data),labels=rows.map(r=>String(r.year)),current=masterTrendYearRow(data,year),compare=masterTrendYearRow(data,compareYear),monthly=t.monthly||{};
  const enrollSeries=rows.map(r=>Number(r.enrollments||0)),retainedSeries=rows.map(r=>Number(r.retained||0)),groupSeries=rows.map(r=>Number(r.groups||0));
  const incomeSeries=rows.map(r=>Number(r.income||0));
  const retentionSeries=rows.map(r=>Number(r.retentionPct||0)),closureSeries=rows.map(r=>Number(r.closurePct||0)),passSeries=rows.map(r=>Number(r.passPct||0));
  const enrollmentHeat=rows.map(r=>({name:String(r.year),values:(monthly.enrollments?.[String(r.year)]||Array(12).fill(0)).map(Number)}));
  const currentEnroll=monthly.enrollments?.[String(year)]||Array(12).fill(0),compareEnroll=monthly.enrollments?.[String(compareYear)]||Array(12).fill(0);
  const currentIncome=monthly.income?.[String(year)]||Array(12).fill(0),compareIncome=monthly.income?.[String(compareYear)]||Array(12).fill(0);
  const limitations=t.limitations||[];
  return <>
    <div className="master-kpi-grid">
      <MasterKpi label={`Matrículas ${year}`} value={MasterFmtNumber(current.enrollments)} sub={`comparado con ${compareYear}`} trend={masterTrendDelta(current,compare,'enrollments')} tone="#16294f" icon="graduation" values={currentEnroll}/>
      <MasterKpi label={`Cobros aplicados ${year}`} value={MasterFmtMoney(current.income)} sub="recibos válidos registrados" trend={masterTrendDelta(current,compare,'income')} tone="#bf403b" icon="payments" values={currentIncome}/>
      <MasterKpi label="Retención observable" value={current.retentionPct==null?'Sin base':`${current.retentionPct}%`} sub={`cohorte de ingreso ${year}`} trend={current.retentionPct!=null&&compare.retentionPct!=null?Math.round(current.retentionPct-compare.retentionPct):null} tone="#2f8a5b" icon="profile" values={retentionSeries}/>
      <MasterKpi label="Grupos con actividad" value={MasterFmtNumber(current.groups)} sub="con calendario registrado en el año" trend={masterTrendDelta(current,compare,'groups')} tone="#c49a40" icon="roster" values={groupSeries}/>
      <MasterKpi label="Cumplimiento de cierre" value={current.closurePct==null?'Sin base':`${current.closurePct}%`} sub="clases cerradas sobre programadas" trend={current.closurePct!=null&&compare.closurePct!=null?Math.round(current.closurePct-compare.closurePct):null} tone="#315f96" icon="calendar" values={closureSeries}/>
      <MasterKpi label="Promedio académico" value={current.examAverage==null?'Sin notas':current.examAverage} sub="evaluaciones calificadas" trend={current.examAverage!=null&&compare.examAverage!=null?Math.round(current.examAverage-compare.examAverage):null} tone="#7956a8" icon="check" values={rows.map(r=>Number(r.examAverage||0))}/>
      <MasterKpi label="Aprobación" value={current.passPct==null?'Sin base':`${current.passPct}%`} sub="solo resultados definitivos" trend={current.passPct!=null&&compare.passPct!=null?Math.round(current.passPct-compare.passPct):null} tone="#287f83" icon="chart" values={passSeries}/>
      <MasterKpi label="Desembolsos CONAPE" value={MasterFmtNumber(current.conapeDisbursements)} sub="último desembolso sincronizado por persona" trend={masterTrendDelta(current,compare,'conapeDisbursements')} tone="#7956a8" icon="graduation" values={rows.map(r=>Number(r.conapeDisbursements||0))}/>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card master-chart-card"><header><div><span>Volumen institucional</span><h3>Evolución multianual</h3><p>Matrículas, cohortes retenidas y grupos con actividad</p></div></header><MasterMultiLineChart labels={labels} series={[{label:'Matrículas',values:enrollSeries,color:'#16294f'},{label:'Retenidos',values:retainedSeries,color:'#2f8a5b'},{label:'Grupos',values:groupSeries,color:'#c49a40'}]}/></section>
      <section className="master-card master-chart-card"><header><div><span>Salud institucional</span><h3>Indicadores porcentuales</h3><p>Retención, cierre académico y aprobación</p></div></header><MasterMultiLineChart labels={labels} series={[{label:'Retención',values:retentionSeries,color:'#2f8a5b'},{label:'Cierre',values:closureSeries,color:'#315f96'},{label:'Aprobación',values:passSeries,color:'#7956a8'}]} valueSuffix="%"/></section>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card master-chart-card"><header><div><span>Comparativo mensual</span><h3>Matrículas {year} vs. {compareYear}</h3><p>Fecha real de matrícula registrada en DATOS</p></div></header><MasterBarLineChart primary={currentEnroll} compare={compareEnroll} labels={MASTER_MONTHS} primaryLabel={String(year)} compareLabel={String(compareYear)}/></section>
      <section className="master-card master-chart-card"><header><div><span>Comparativo financiero</span><h3>Cobros aplicados {year} vs. {compareYear}</h3><p>Excluye CUOTA_0, recibos 0 y contratos de venta</p></div></header><MasterBarLineChart primary={currentIncome} compare={compareIncome} labels={MASTER_MONTHS} primaryLabel={String(year)} compareLabel={String(compareYear)} formatValue={MasterFmtMoney}/></section>
    </div>
    <div className="master-grid master-grid-main">
      <section className="master-card"><header><div><span>Estacionalidad</span><h3>Mapa de matrículas por año y mes</h3><p>Intensidad relativa dentro de toda la serie disponible</p></div></header>{enrollmentHeat.length?<MasterHeatmap rows={enrollmentHeat} labels={MASTER_MONTHS} rowLabel="Año"/>:<MasterEmpty text="No hay matrículas históricas suficientes."/>}</section>
      <section className="master-card master-chart-card"><header><div><span>Cobros anuales</span><h3>Evolución del ingreso aplicado</h3><p>Serie anual completa disponible</p></div></header><MasterMultiLineChart labels={labels} series={[{label:'Cobros aplicados',values:incomeSeries,color:'#bf403b'}]} formatValue={MasterFmtMoney}/></section>
    </div>
    <section className="master-card master-trend-detail-card"><header><div><span>Serie consolidada</span><h3>Comparativo institucional por año</h3><p>Todos los indicadores se originan en registros reales disponibles</p></div><strong className="master-table-count">{rows.length} año{rows.length===1?'':'s'}</strong></header><MasterTrendTable rows={rows}/></section>
    <section className="master-card master-trend-method"><header><div><span>Alcance y límites</span><h3>Cómo interpretar la serie histórica</h3></div></header><div className="master-notes"><p><strong>Matrículas:</strong> fecha de matrícula del registro único en DATOS.</p><p><strong>Cobros:</strong> pagos aplicados con recibo válido; no se cuentan contratos CUOTA_0 ni recibos 0.</p><p><strong>Retención:</strong> estado observable actual de cada cohorte de ingreso, no una fotografía histórica reconstruida.</p><p><strong>Grupos y cierres:</strong> calendario académico completo, incluyendo grupos que ya no están en curso.</p><p><strong>Rendimiento:</strong> solo notas definitivas; pendientes de revisión no se consideran reprobados.</p><p><strong>Cartera:</strong> {MasterFmtMoney(t.currentSnapshot?.activePortfolio||0)} corresponde al corte actual y no se grafica como serie histórica.</p>{limitations.map((x,i)=><p key={i}><strong>Limitación:</strong> {x}</p>)}</div></section>
  </>;
}

function MasterPendingSection({ section }) {
  const meta={
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
  const [studentLevel,setStudentLevel]=React.useState('');
  const [studentTeacher,setStudentTeacher]=React.useState('');
  const [studentGroup,setStudentGroup]=React.useState('');
  const [studentRisk,setStudentRisk]=React.useState('');
  const [studentSearch,setStudentSearch]=React.useState('');
  const [collectionLevel,setCollectionLevel]=React.useState('');
  const [collectionConvenio,setCollectionConvenio]=React.useState('');
  const [collectionGroup,setCollectionGroup]=React.useState('');
  const [collectionStatus,setCollectionStatus]=React.useState('');
  const [collectionSearch,setCollectionSearch]=React.useState('');
  const [conapeAdvisor,setConapeAdvisor]=React.useState('');
  const [conapeStage,setConapeStage]=React.useState('');
  const [conapePriority,setConapePriority]=React.useState('');
  const [conapeLinkStatus,setConapeLinkStatus]=React.useState('');
  const [conapeGroup,setConapeGroup]=React.useState('');
  const [conapeSearch,setConapeSearch]=React.useState('');
  const [teacherName,setTeacherName]=React.useState('');
  const [teacherLevel,setTeacherLevel]=React.useState('');
  const [teacherStatus,setTeacherStatus]=React.useState('');
  const [teacherSearch,setTeacherSearch]=React.useState('');
  const [examLevel,setExamLevel]=React.useState('');
  const [examTeacher,setExamTeacher]=React.useState('');
  const [examGroup,setExamGroup]=React.useState('');
  const [examCategory,setExamCategory]=React.useState('');
  const [examStatus,setExamStatus]=React.useState('');
  const [examSearch,setExamSearch]=React.useState('');
  const [alertLevel,setAlertLevel]=React.useState('');
  const [alertArea,setAlertArea]=React.useState('');
  const [alertAge,setAlertAge]=React.useState('');
  const [alertSearch,setAlertSearch]=React.useState('');
  React.useEffect(()=>{if(!data)return;const ys=(data.filters?.years||[]).map(String);const def=String(data.filters?.defaultYear||ys[ys.length-1]||new Date().getFullYear());setYear(y=>y||def);setCompareYear(y=>y||String(ys.includes(String(Number(def)-1))?Number(def)-1:(ys.filter(x=>x!==def).slice(-1)[0]||def)));},[data]);
  React.useEffect(()=>{setAcademicGroup('');},[academicLevel,academicTeacher]);
  React.useEffect(()=>{setStudentGroup('');},[studentLevel,studentTeacher]);
  React.useEffect(()=>{setCollectionGroup('');},[collectionLevel,collectionConvenio]);
  React.useEffect(()=>{setExamGroup('');},[examLevel,examTeacher]);
  if(loading&&!data)return <div className="master-loading"><span/><h2>Construyendo Panel Maestro…</h2><p>Agregando datos reales de APOLLO y CAMPUS_OPERATIVO.</p></div>;
  if(error)return <div className="master-loading master-error"><h2>No se pudo cargar el Panel Maestro</h2><p>{error}</p><button onClick={refetch}>Reintentar</button></div>;
  const years=(data?.filters?.years||[]).map(String),advisorOptions=data?.filters?.advisors||[],connected=['resumen','ventas','academica','estudiantes','cobranza','conape','docentes','examenes','alertas','tendencias'];
  const academicOptions=data?.academic?.filters||{levels:[],teachers:[],groups:[]};
  const availableGroups=(academicOptions.groups||[]).filter(g=>(!academicLevel||g.level===academicLevel)&&(!academicTeacher||g.teacher===academicTeacher));
  const academicFilters={level:academicLevel,teacher:academicTeacher,group:academicGroup};
  const studentOptions=data?.students?.filters||{levels:[],teachers:[],groups:[]};
  const availableStudentGroups=(studentOptions.groups||[]).filter(g=>(!studentLevel||g.level===studentLevel)&&(!studentTeacher||g.teacher===studentTeacher));
  const studentFilters={level:studentLevel,teacher:studentTeacher,group:studentGroup,risk:studentRisk,search:studentSearch};
  const collectionOptions=data?.collections?.filters||{levels:[],convenios:[],groups:[]};
  const availableCollectionGroups=Array.from(new Map((collectionOptions.groups||[]).filter(g=>(!collectionLevel||g.level===collectionLevel)&&(!collectionConvenio||g.convenio===collectionConvenio)).map(g=>[`${g.code}|${g.level}`,g])).values());
  const collectionFilters={level:collectionLevel,convenio:collectionConvenio,group:collectionGroup,status:collectionStatus,search:collectionSearch};
  const conapeOptions=data?.conape?.filters||{advisors:[],stages:[],priorities:[],linkStatuses:[],groups:[]};
  const conapeFilters={advisor:conapeAdvisor,stage:conapeStage,priority:conapePriority,linkStatus:conapeLinkStatus,group:conapeGroup,search:conapeSearch};
  const teacherOptions=data?.teachers?.filters||{teachers:[],levels:['B1','B2','I1','I2']};
  const teacherFilters={teacher:teacherName,level:teacherLevel,status:teacherStatus,search:teacherSearch};
  const examOptions=data?.exams?.filters||{levels:['B1','B2','I1','I2'],teachers:[],groups:[],categories:[]};
  const availableExamGroups=(examOptions.groups||[]).filter(g=>(!examLevel||g.level===examLevel)&&(!examTeacher||g.teacher===examTeacher));
  const examFilters={level:examLevel,teacher:examTeacher,group:examGroup,category:examCategory,status:examStatus,search:examSearch};
  const alertOptions=data?.institutionalAlerts?.filters||{levels:['critical','medium','info'],areas:[],ageBuckets:['0-7','8-30','31-60','61+']};
  const alertFilters={level:alertLevel,area:alertArea,age:alertAge,search:alertSearch};
  const exportCurrent=()=>{
    if(section==='estudiantes'){
      const rows=masterStudentFiltered(data,studentFilters);
      masterCsvDownload(`panel_maestro_estudiantes_${year}.csv`,[['Código','Nombre','Grupo','Nivel','Docente','Asistencia %','Promedio evaluaciones','Ausencias recientes','Mora','Avance %','Riesgo','Puntaje','Motivos'],...rows.map(s=>[s.code,s.name,s.group,s.level,s.teacher,s.attendancePct??'',s.gradeAvg??'',s.recentAbsences||0,s.mora?'SI':'NO',s.progressPct,s.riskLevel,s.riskScore,(s.riskReasons||[]).join(' | ')])]);
      return;
    }
    if(section==='academica'){
      const rows=masterAcademicGroupRows(masterAcademicFiltered(data,academicFilters),year);
      masterCsvDownload(`panel_maestro_academico_${year}.csv`,[['Grupo','Nivel','Docente','Estudiantes','Clases vencidas','Clases cerradas','Clases pendientes','Cierre %','Asistencia %','Progress Check %','I CAN %','Exámenes por revisar','Próxima lección'],...rows.map(g=>[g.code,g.level,g.teacher,g.students,g._due,g._closed,g._pastDue,g._closurePct??'',g._attendancePct??'',g._progressPct??'',g._icanPct??'',g.exams?.pendingReview||0,g.nextLesson||''])]);
      return;
    }
    if(section==='cobranza'){
      const rows=masterCollectionFiltered(data,collectionFilters);
      masterCsvDownload(`panel_maestro_cobranza_${year}.csv`,[['Código','Nombre','Grupo','Nivel','Convenio','Mora','Matrícula pendiente','Cuotas pendientes','Certificado pendiente','Cartera activa','Último pago','Días desde último pago','Aplicado histórico','Certificados bloqueados'],...rows.map(r=>[r.code,r.name,r.group,r.level,r.convenio,r.mora?'SI':'NO',r.pendingMatricula,r.pendingCuotas,r.pendingCertificado,r.pendingTotal,r.lastPayment||'',r.daysSinceLastPayment??'',r.appliedTotal,r.certificatesBlocked||0])]);
      return;
    }
    if(section==='docentes'){
      const rows=masterTeacherRows(data,year,teacherFilters);
      masterCsvDownload(`panel_maestro_docentes_${year}.csv`,[['Docente','Estado','Grupos','Niveles','Estudiantes','Clases vencidas','Clases cerradas','Pendientes','Cierre %','Asistencia %','Progress Check %','I CAN %','Exámenes por revisar','Próxima clase','Motivos'],...rows.map(r=>[r.name,r.status,r.groups,r.levels.join(' / '),r.students,r.due,r.closed,r.pastDue,r.closurePct??'',r.attendancePct??'',r.progressPct??'',r.icanPct??'',r.pendingReview,r.nextLesson||'',r.reasons.join(' | ')])]);
      return;
    }
    if(section==='conape'){
      const rows=masterConapeProspects(data,year,conapeFilters);
      masterCsvDownload(`panel_maestro_conape_${year}.csv`,[['Cédula','Nombre','Asesor','Grupo','Etapa','Prioridad','Días en etapa','Estado WS','Código','Vinculado','Acción sugerida'],...rows.map(r=>[r.cedula,r.name,r.advisor,r.group,r.stageLabel,r.priority,r.daysStage,r.wsNovelty||'',r.code||'',r.linked?'SI':'NO',r.action||''])]);
      return;
    }
    if(section==='examenes'){
      const rows=masterExamResults(data,year,examFilters);
      masterCsvDownload(`panel_maestro_examenes_${year}.csv`,[['Código','Nombre','Grupo','Nivel','Docente','Evaluación','Categoría','Estado','Nota','Fecha','Fuente'],...rows.map(r=>[r.code,r.name,r.group,r.level,r.teacher,r.evalLabel,r.category,r.status,r.score??'',r.date||'',r.source||''])]);
      return;
    }
    if(section==='alertas'){
      const rows=masterAlertFiltered(data,year,alertFilters);
      masterCsvDownload(`panel_maestro_alertas_${year}.csv`,[['ID','Prioridad','Área','Título','Detalle','Entidad','Tipo','Antigüedad días','Responsable','Fecha observable','Acción'],...rows.map(a=>[a.id,a.level,a.areaLabel,a.title,a.detail,a.entity,a.entityType,a.ageDays,a.owner,a.date||'',a.action])]);
      return;
    }
    if(section==='tendencias'){
      const rows=masterTrendAnnual(data);
      masterCsvDownload(`panel_maestro_tendencias_historicas.csv`,[['Año','Matrículas','Cobros aplicados','Cohorte inscrita','Retenidos','Retención %','Grupos con actividad','Docentes observados','Clases programadas','Clases cerradas','Cierre %','Evaluaciones aplicadas','Evaluaciones calificadas','Promedio','Aprobación %','Desembolsos CONAPE'],...rows.map(r=>[r.year,r.enrollments,r.income,r.cohortEnrolled,r.retained,r.retentionPct??'',r.groups,r.teachers,r.classesScheduled,r.classesClosed,r.closurePct??'',r.examsApplied,r.examsGraded,r.examAverage??'',r.passPct??'',r.conapeDisbursements])]);
      return;
    }
    const p=masterBlockMonthly(data.sales?.enrollmentsByYear?.[year],advisors),c=masterBlockMonthly(data.sales?.enrollmentsByYear?.[compareYear],advisors),inc=data.sales?.incomeByYear?.[year]||[];
    masterCsvDownload(`panel_maestro_${section}_${year}.csv`,[['Mes',`Matrículas ${year}`,`Matrículas ${compareYear}`,`Cobros ${year}`],...MASTER_MONTHS.map((m,i)=>[m,p[i]||0,c[i]||0,inc[i]||0])]);
  };
  const selectedMeta=MASTER_SECTIONS.find(x=>x.id===section)||MASTER_SECTIONS[0];
  return <div className="master-admin" data-build={MASTER_PANEL_BUILD}>
    <header className="master-header"><div><div className="master-title-line"><h1>Panel Maestro Super Admin</h1><span>Datos reales · AX</span></div><p>Control institucional y analítica integral · actualizado {data.generatedAt||'—'}</p></div><div className="master-actions"><button onClick={refetch} disabled={loading}><span aria-hidden="true">↻</span>{loading?'Sincronizando…':'Sincronizar'}</button><button onClick={exportCurrent}><Icon name="download" size={15}/>Exportar CSV</button></div></header>
    <MasterDataStatus coverage={data.coverage}/>
    <div className="master-filterbar">
      <label><span>{section==='estudiantes'?'Año de cohorte':'Año'}</span><select value={year} onChange={e=>setYear(e.target.value)}>{years.map(y=><option key={y}>{y}</option>)}</select></label>
      {section!=='academica'&&section!=='estudiantes'&&section!=='docentes'&&section!=='alertas'&&<label><span>Comparar con</span><select value={compareYear} onChange={e=>setCompareYear(e.target.value)}>{years.map(y=><option key={y}>{y}</option>)}</select></label>}
      {(section==='resumen'||section==='ventas')&&<MasterAdvisorFilter advisors={advisorOptions} selected={advisors} onChange={setAdvisors}/>} 
      {section==='academica'&&<>
        <MasterAcademicFilter label="Nivel" value={academicLevel} onChange={setAcademicLevel} options={(academicOptions.levels||[]).map(x=>({value:x,label:({B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'}[x]||x)}))} placeholder="Todos los niveles"/>
        <MasterAcademicFilter label="Docente" value={academicTeacher} onChange={setAcademicTeacher} options={academicOptions.teachers||[]} placeholder="Todos los docentes"/>
        <MasterAcademicFilter label="Grupo" value={academicGroup} onChange={setAcademicGroup} options={availableGroups.map(g=>({value:g.code,label:`${g.code} · ${g.level}`}))} placeholder="Todos los grupos"/>
      </>}
      {section==='estudiantes'&&<>
        <MasterAcademicFilter label="Nivel actual" value={studentLevel} onChange={setStudentLevel} options={(studentOptions.levels||[]).map(x=>({value:x,label:({B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'}[x]||x)}))} placeholder="Todos los niveles"/>
        <MasterAcademicFilter label="Docente" value={studentTeacher} onChange={setStudentTeacher} options={studentOptions.teachers||[]} placeholder="Todos los docentes"/>
        <MasterAcademicFilter label="Grupo" value={studentGroup} onChange={setStudentGroup} options={availableStudentGroups.map(g=>({value:g.code,label:`${g.code} · ${g.level}`}))} placeholder="Todos los grupos"/>
        <MasterAcademicFilter label="Riesgo" value={studentRisk} onChange={setStudentRisk} options={[{value:'high',label:'Alto'},{value:'medium',label:'Medio'},{value:'low',label:'Bajo'}]} placeholder="Todos los riesgos"/>
        <label className="master-student-search"><span>Buscar</span><input value={studentSearch} onChange={e=>setStudentSearch(e.target.value)} placeholder="Nombre, código o grupo"/></label>
      </>}
      {section==='cobranza'&&<>
        <MasterAcademicFilter label="Nivel actual" value={collectionLevel} onChange={setCollectionLevel} options={(collectionOptions.levels||[]).map(x=>({value:x,label:({B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'}[x]||x)}))} placeholder="Todos los niveles"/>
        <MasterAcademicFilter label="Convenio" value={collectionConvenio} onChange={setCollectionConvenio} options={collectionOptions.convenios||[]} placeholder="Todos los convenios"/>
        <MasterAcademicFilter label="Grupo" value={collectionGroup} onChange={setCollectionGroup} options={availableCollectionGroups.map(g=>({value:g.code,label:`${g.code} · ${g.level}`}))} placeholder="Todos los grupos"/>
        <MasterAcademicFilter label="Estado financiero" value={collectionStatus} onChange={setCollectionStatus} options={[{value:'mora',label:'Con mora'},{value:'pending',label:'Con saldo pendiente'},{value:'clear',label:'Al día'},{value:'certificate',label:'Certificado bloqueado'}]} placeholder="Todos los estados"/>
        <label className="master-student-search"><span>Buscar</span><input value={collectionSearch} onChange={e=>setCollectionSearch(e.target.value)} placeholder="Nombre, código o grupo"/></label>
      </>}
      {section==='conape'&&<>
        <MasterAcademicFilter label="Asesor" value={conapeAdvisor} onChange={setConapeAdvisor} options={conapeOptions.advisors||[]} placeholder="Todos los asesores"/>
        <MasterAcademicFilter label="Etapa" value={conapeStage} onChange={setConapeStage} options={(conapeOptions.stages||[]).map(x=>({value:x,label:({lead:'Lead',solicitud:'Solicitud',documentos:'Documentos',aprobado:'Aprobado',desembolso:'Desembolso',activo:'Activo',cancelado:'Cancelado'}[x]||x)}))} placeholder="Todas las etapas"/>
        <MasterAcademicFilter label="Prioridad" value={conapePriority} onChange={setConapePriority} options={(conapeOptions.priorities||[]).map(x=>({value:x,label:x}))} placeholder="Todas las prioridades"/>
        <MasterAcademicFilter label="Vinculación" value={conapeLinkStatus} onChange={setConapeLinkStatus} options={[{value:'linked',label:'Vinculado'},{value:'unlinked',label:'Sin vínculo'}]} placeholder="Todos los estados"/>
        <MasterAcademicFilter label="Grupo" value={conapeGroup} onChange={setConapeGroup} options={conapeOptions.groups||[]} placeholder="Todos los grupos"/>
        <label className="master-student-search"><span>Buscar</span><input value={conapeSearch} onChange={e=>setConapeSearch(e.target.value)} placeholder="Nombre, cédula, código o grupo"/></label>
      </>}
      {section==='docentes'&&<>
        <MasterAcademicFilter label="Docente" value={teacherName} onChange={setTeacherName} options={teacherOptions.teachers||[]} placeholder="Todos los docentes"/>
        <MasterAcademicFilter label="Nivel" value={teacherLevel} onChange={setTeacherLevel} options={(teacherOptions.levels||[]).map(x=>({value:x,label:({B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'}[x]||x)}))} placeholder="Todos los niveles"/>
        <MasterAcademicFilter label="Estado" value={teacherStatus} onChange={setTeacherStatus} options={[{value:'alert',label:'Con alerta'},{value:'attention',label:'Seguimiento'},{value:'ok',label:'Estable'},{value:'unassigned',label:'Sin grupo'}]} placeholder="Todos los estados"/>
        <label className="master-student-search"><span>Buscar</span><input value={teacherSearch} onChange={e=>setTeacherSearch(e.target.value)} placeholder="Docente o grupo"/></label>
      </>}
      {section==='examenes'&&<>
        <MasterAcademicFilter label="Nivel" value={examLevel} onChange={setExamLevel} options={(examOptions.levels||[]).map(x=>({value:x,label:({B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'}[x]||x)}))} placeholder="Todos los niveles"/>
        <MasterAcademicFilter label="Docente" value={examTeacher} onChange={setExamTeacher} options={examOptions.teachers||[]} placeholder="Todos los docentes"/>
        <MasterAcademicFilter label="Grupo" value={examGroup} onChange={setExamGroup} options={availableExamGroups.map(g=>({value:g.code,label:`${g.code} · ${g.level}`}))} placeholder="Todos los grupos"/>
        <MasterAcademicFilter label="Tipo" value={examCategory} onChange={setExamCategory} options={[{value:'oral',label:'Oral'},{value:'written',label:'Escrita'},{value:'social',label:'Social Skill'},{value:'ican',label:'I CAN'},{value:'other',label:'Otra'}]} placeholder="Todos los tipos"/>
        <MasterAcademicFilter label="Estado" value={examStatus} onChange={setExamStatus} options={[{value:'pending',label:'Pendiente de revisión'},{value:'graded',label:'Calificada'},{value:'passed',label:'Aprobada'},{value:'failed',label:'No aprobada'}]} placeholder="Todos los estados"/>
        <label className="master-student-search"><span>Buscar</span><input value={examSearch} onChange={e=>setExamSearch(e.target.value)} placeholder="Estudiante, grupo o evaluación"/></label>
      </>}
      {section==='alertas'&&<>
        <MasterAcademicFilter label="Prioridad" value={alertLevel} onChange={setAlertLevel} options={[{value:'critical',label:'Crítica'},{value:'medium',label:'Media'},{value:'info',label:'Informativa'}]} placeholder="Todas las prioridades"/>
        <MasterAcademicFilter label="Área" value={alertArea} onChange={setAlertArea} options={alertOptions.areas||[]} placeholder="Todas las áreas"/>
        <MasterAcademicFilter label="Antigüedad" value={alertAge} onChange={setAlertAge} options={[{value:'0-7',label:'0–7 días'},{value:'8-30',label:'8–30 días'},{value:'31-60',label:'31–60 días'},{value:'61+',label:'+61 días'}]} placeholder="Todas las edades"/>
        <label className="master-student-search"><span>Buscar</span><input value={alertSearch} onChange={e=>setAlertSearch(e.target.value)} placeholder="Alerta, entidad, responsable o área"/></label>
      </>}
      <div className="master-filter-chip"><i style={{background:selectedMeta.color}}/>{selectedMeta.label}</div>
      {((section==='academica'&&(academicLevel||academicTeacher||academicGroup))||(section==='estudiantes'&&(studentLevel||studentTeacher||studentGroup||studentRisk||studentSearch))||(section==='cobranza'&&(collectionLevel||collectionConvenio||collectionGroup||collectionStatus||collectionSearch))||(section==='conape'&&(conapeAdvisor||conapeStage||conapePriority||conapeLinkStatus||conapeGroup||conapeSearch))||(section==='docentes'&&(teacherName||teacherLevel||teacherStatus||teacherSearch))||(section==='examenes'&&(examLevel||examTeacher||examGroup||examCategory||examStatus||examSearch))||(section==='alertas'&&(alertLevel||alertArea||alertAge||alertSearch))||((section==='resumen'||section==='ventas')&&advisors.length>0))&&<button className="master-clear-filter" onClick={()=>{setAdvisors([]);setAcademicLevel('');setAcademicTeacher('');setAcademicGroup('');setStudentLevel('');setStudentTeacher('');setStudentGroup('');setStudentRisk('');setStudentSearch('');setCollectionLevel('');setCollectionConvenio('');setCollectionGroup('');setCollectionStatus('');setCollectionSearch('');setConapeAdvisor('');setConapeStage('');setConapePriority('');setConapeLinkStatus('');setConapeGroup('');setConapeSearch('');setTeacherName('');setTeacherLevel('');setTeacherStatus('');setTeacherSearch('');setExamLevel('');setExamTeacher('');setExamGroup('');setExamCategory('');setExamStatus('');setExamSearch('');setAlertLevel('');setAlertArea('');setAlertAge('');setAlertSearch('');}}>Limpiar filtros ×</button>}
    </div>
    <nav className="master-section-nav" aria-label="Secciones del Panel Maestro">{MASTER_SECTIONS.map(item=><button key={item.id} className={section===item.id?'active':''} style={{'--section-color':item.color}} onClick={()=>setSection(item.id)}><i/><Icon name={item.icon} size={16}/><span>{item.label}</span>{!connected.includes(item.id)&&<small>próxima conexión</small>}</button>)}</nav>
    <main className="master-content"><div className="master-section-heading"><div><span>{selectedMeta.label}</span><h2>{section==='resumen'?'Visión ejecutiva de la academia':section==='ventas'?'Analítica comercial y matrículas':section==='academica'?'Control operativo académico en tiempo real':section==='estudiantes'?'Retención, asistencia y riesgo estudiantil':section==='cobranza'?'Cobros aplicados, cartera activa y morosidad':section==='conape'?'Financiamiento, desembolsos y vinculación institucional':section==='docentes'?'Carga, cumplimiento y salud operativa docente':section==='examenes'?'Aplicación, revisión y rendimiento académico':section==='alertas'?'Centro transversal de alertas y pendientes institucionales':section==='tendencias'?'Evolución multianual de la Academia':selectedMeta.label}</h2></div>{!connected.includes(section)&&<em className="master-integration-chip">Depende de integración</em>}</div>{section==='resumen'?<MasterResumen data={data} year={year} compareYear={compareYear} advisors={advisors} setSection={setSection}/>:section==='ventas'?<MasterVentas data={data} year={year} compareYear={compareYear} advisors={advisors}/>:section==='academica'?<MasterAcademica data={data} year={year} filters={academicFilters}/>:section==='estudiantes'?<MasterEstudiantes data={data} year={year} filters={studentFilters}/>:section==='cobranza'?<MasterCobranza data={data} year={year} compareYear={compareYear} filters={collectionFilters} onRefresh={refetch}/>:section==='conape'?<MasterConape data={data} year={year} compareYear={compareYear} filters={conapeFilters}/>:section==='docentes'?<MasterDocentes data={data} year={year} filters={teacherFilters}/>:section==='examenes'?<MasterExamenes data={data} year={year} compareYear={compareYear} filters={examFilters}/>:section==='alertas'?<MasterAlertas data={data} year={year} filters={alertFilters} setSection={setSection}/>:section==='tendencias'?<MasterTendencias data={data} year={year} compareYear={compareYear}/>:<MasterPendingSection section={section}/>}</main>
  </div>;
}

window.__ADMIN_MASTER_BUILD__ = MASTER_PANEL_BUILD;
Object.assign(window,{AdminMasterDashboard});
