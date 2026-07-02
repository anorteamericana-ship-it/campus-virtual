// F98.4-Z6-BA · Diagnóstico ESTATUS ↔ hojas CONAPE ↔ base externa · modo manual
/* global React, PageHeader */
const SCRIPT_URL_DIAG=window.APPS_SCRIPT_URL;

async function postDiagnosticoInterno(fn,payload={}){
  const token=window.getSessionToken?window.getSessionToken():'';
  const res=await fetch(`${SCRIPT_URL_DIAG}?fn=${encodeURIComponent(fn)}`,{
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({fn,token,...payload}),
  });
  const raw=await res.text();
  let data=null;
  try{data=raw?JSON.parse(raw):null;}
  catch(_){throw new Error(`Apps Script respondió HTML/texto en ${fn} (HTTP ${res.status}).`);}
  if(!res.ok||!data?.ok)throw new Error(data?.mensaje||data?.error||`Error en ${fn}.`);
  return data;
}

const DS={
  OK:{bg:'#e1f1e8',fg:'#246c48',bd:'#c4e3d1'},
  VERIFICADO:{bg:'#e1f1e8',fg:'#246c48',bd:'#c4e3d1'},
  RESPONDE:{bg:'#e1f1e8',fg:'#246c48',bd:'#c4e3d1'},
  REVISAR:{bg:'#f8eccf',fg:'#8b641b',bd:'#ecd8a6'},
  RESPONDE_PARCIAL:{bg:'#f8eccf',fg:'#8b641b',bd:'#ecd8a6'},
  CRITICO:{bg:'#f8deda',fg:'#a52c27',bd:'#efbbb5'},
  ERROR:{bg:'#f8deda',fg:'#a52c27',bd:'#efbbb5'},
  NO_DISPONIBLE:{bg:'#f8deda',fg:'#a52c27',bd:'#efbbb5'},
  INFO:{bg:'#e1ebf6',fg:'#295483',bd:'#c7d9ec'},
  PROTEGIDO:{bg:'#e1ebf6',fg:'#295483',bd:'#c7d9ec'},
  OMITIDO:{bg:'#edf0f4',fg:'#5f6878',bd:'#dce1e8'},
};
function Badge({value='INFO'}){
  const k=String(value||'INFO').toUpperCase(),s=DS[k]||DS.INFO;
  return <span style={{display:'inline-flex',padding:'5px 9px',borderRadius:999,background:s.bg,color:s.fg,border:`1px solid ${s.bd}`,fontSize:10,fontWeight:900,letterSpacing:'.04em',whiteSpace:'nowrap'}}>{k}</span>;
}
function Card({label,value,sub,tone='INFO'}){
  const s=DS[tone]||DS.INFO;
  return <div style={{border:`1px solid ${s.bd}`,background:`linear-gradient(135deg,${s.bg},#fff)`,borderRadius:15,padding:14}}>
    <div style={{fontSize:10,fontWeight:900,textTransform:'uppercase',letterSpacing:'.09em',color:s.fg}}>{label}</div>
    <b style={{display:'block',fontSize:26,color:'#16294f',marginTop:7}}>{value}</b>
    {sub&&<span style={{display:'block',fontSize:11.5,color:'#6f7889',marginTop:5,lineHeight:1.4}}>{sub}</span>}
  </div>;
}
function Section({title,sub,children}){
  return <section style={{background:'#fff',border:'1px solid var(--line,#e5e0d8)',borderRadius:18,padding:18,boxShadow:'0 10px 30px rgba(15,23,42,.04)',marginBottom:14}}>
    <div style={{marginBottom:14}}><h3 style={{margin:0,color:'#16294f',fontSize:19}}>{title}</h3>{sub&&<p style={{margin:'5px 0 0',fontSize:12.5,color:'#7b8494',lineHeight:1.45}}>{sub}</p>}</div>
    {children}
  </section>;
}
function SimpleTable({headers,rows,empty='Sin registros.'}){
  return <div style={{overflow:'auto',border:'1px solid var(--line,#e5e0d8)',borderRadius:12}}>
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:760}}>
      <thead><tr style={{background:'#f2eee5'}}>{headers.map(h=><th key={h} style={{textAlign:'left',padding:'10px 9px',fontSize:9,textTransform:'uppercase',letterSpacing:'.06em',color:'#6f7889',whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
      <tbody>{rows.length?rows:<tr><td colSpan={headers.length} style={{padding:18,textAlign:'center',color:'#8b94a4'}}>{empty}</td></tr>}</tbody>
    </table>
  </div>;
}

function DiagnosticoInternoView(){
  const [general,setGeneral]=React.useState(null);
  const [audit,setAudit]=React.useState(null);
  const [busy,setBusy]=React.useState('');
  const [error,setError]=React.useState('');
  const [tab,setTab]=React.useState('conape');
  const [verifyCed,setVerifyCed]=React.useState('');

  const run=async(kind)=>{
    setBusy(kind);setError('');
    try{
      if(kind==='general')setGeneral(await postDiagnosticoInterno('diagnosticoSistemaInterno',{detalle:true}));
      if(kind==='audit')setAudit(await postDiagnosticoInterno('auditarArchivosCONAPE',{api:true,cedula_verificacion:String(verifyCed||'').trim()}));
    }catch(e){setError(e.message||String(e));}
    finally{setBusy('');}
  };
  React.useEffect(()=>{run('general');},[]);

  const res=audit?.resumen||{};
  const hall=audit?.hallazgos||[];
  const files=audit?.archivos||[];
  const api=audit?.api||{};
  const db=audit?.integridad_bd||{};
  const local=audit?.verificacion_cedula||api?.comparacion?.local||{};
  const cmp=api?.comparacion||{};

  return <div className="page-wrap" style={{maxWidth:1460,margin:'0 auto',padding:'18px 18px 42px'}}>
    <PageHeader title="Diagnóstico interno" subtitle="Auditoría de solo lectura: ESTATUS, siete hojas CONAPE y visibilidad en la base externa, sin recrear ni limpiar archivos."/>
    {error&&<div style={{padding:12,marginBottom:12,borderRadius:11,background:'#f8deda',border:'1px solid #efbbb5',color:'#a52c27',fontWeight:800}}>{error}</div>}
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>{[['conape','Auditoría CONAPE'],['general','Sistema interno'],['reglas','Reglas de continuidad']].map(([id,label])=><button key={id} type="button" className={tab===id?'btn btn-primary':'btn'} onClick={()=>setTab(id)}>{label}</button>)}</div>

    {tab==='conape'&&<>
      <Section title="Integración CONAPE en producción" sub="Lee los siete archivos originales, valida las claves que recibiría la base externa y contrasta estados y notas con ESTATUS.">
        <div style={{display:'flex',gap:9,flexWrap:'wrap',alignItems:'center'}}>
          <button className="btn btn-primary" type="button" onClick={()=>run('audit')} disabled={!!busy}>{busy==='audit'?'Auditando…':'Auditar integración CONAPE'}</button>
          <Badge value={audit?.estado||'INFO'}/><Badge value="PROTEGIDO"/><span style={{fontSize:11,fontWeight:900,color:'#295483'}}>MODO MANUAL</span>
        </div>
        <div style={{marginTop:10,fontSize:12,color:'#6f7889'}}>No se crean, eliminan ni administran triggers. Tampoco se modifican los IDs, rutas, encabezados, credenciales o filas de las siete hojas.</div>
        {audit&&<div style={{marginTop:8,padding:'8px 10px',borderRadius:9,background:'#EEF4FF',border:'1px solid #C9D9F1',fontSize:11,color:'#244A7C'}}><b>Fuente académica:</b> {audit.fuente_academica||'ESTATUS'} · {audit.criterio_nota||'La auditoría compara la salida externa con el registro vigente.'}</div>}
      </Section>

      <Section title="Verificación extremo a extremo" sub="Escriba una cédula para comprobar primero las hojas locales y luego consultar el plan e historial que publica el servicio externo.">
        <div style={{display:'flex',gap:9,flexWrap:'wrap',alignItems:'center'}}>
          <input value={verifyCed} onChange={e=>setVerifyCed(e.target.value.replace(/[^0-9A-Za-z-]/g,''))} placeholder="Ej. 118000689" style={{minWidth:230,padding:'10px 12px',border:'1px solid #d8d2c8',borderRadius:10,fontSize:13}}/>
          <button className="btn" type="button" onClick={()=>run('audit')} disabled={!!busy||!String(verifyCed).trim()}>{busy==='audit'?'Verificando…':'Verificar cédula en destino'}</button>
          {audit&&<Badge value={api.estado||'INFO'}/>} 
        </div>
        {audit&&local?.cedula&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:9,marginTop:14}}>
          <Card label="Cédula" value={local.cedula} sub={local.nombre||'Sin identidad local'} tone={local.estudiante?'OK':'CRITICO'}/>
          <Card label="Plan local" value={local.plan_filas||0} sub={(local.plan_estados||[]).join(' · ')||'Sin filas'} tone={local.plan_filas===4?'OK':'CRITICO'}/>
          <Card label="Plan activo" value={local.plan_activo?'SÍ':'NO'} sub="Se considera activo cuando existe un nivel CA" tone={local.plan_activo?'OK':'INFO'}/>
          <Card label="Plan en API" value={cmp.plan_api_registros==null?'NO VERIFICADO':cmp.plan_api_registros} sub={cmp.resultado||api.estado||'—'} tone={cmp.resultado==='PLAN_LOCAL_NO_VISIBLE_EN_API'?'CRITICO':cmp.resultado==='VISIBLE_EN_API'?'OK':'INFO'}/>
        </div>}
        {audit&&api.estado==='PROTEGIDO'&&<div style={{marginTop:12,padding:'10px 12px',borderRadius:10,background:'#FFF8E1',border:'1px solid #E5C56B',color:'#70510D',fontSize:12,lineHeight:1.5}}><b>La verificación externa sigue bloqueada por 401/403.</b> Esto no significa que las hojas estén mal; significa que el Campus todavía no puede consultar la base destino con credenciales dedicadas de solo lectura. No se reutilizan automáticamente las credenciales del servicio GetEstudiantesFinanciados.</div>}
      </Section>

      {audit&&<>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(165px,1fr))',gap:10,marginBottom:14}}>
          <Card label="Estado" value={audit.estado} tone={audit.estado}/>
          <Card label="Críticos" value={res.criticos||0} tone={(res.criticos||0)?'CRITICO':'OK'}/>
          <Card label="Advertencias" value={res.advertencias||0} tone={(res.advertencias||0)?'REVISAR':'OK'}/>
          <Card label="Informativos" value={res.info||0} tone="INFO"/>
          <Card label="Archivos válidos" value={`${res.archivos_ok||0}/7`} tone={(res.archivos_ok===7)?'OK':'CRITICO'}/>
          <Card label="Claves duplicadas" value={res.claves_duplicadas||0} sub="Plan + historial + morosidad" tone={(res.claves_duplicadas||0)?'CRITICO':'OK'}/>
          <Card label="Base externa" value={api.estado||'—'} tone={api.estado||'INFO'}/>
        </div>

        <Section title="Preflight de base de datos" sub="Estas son las claves locales que se enviarían al destino. Cero duplicados significa que nuestras hojas no contienen el conflicto PRIMARY reportado.">
          <SimpleTable headers={['Tabla','Regla de clave','Duplicadas','Estado']} rows={[
            ['5-plan_estudios','estudiante + sede + carrera + materia',db.plan_pk_duplicadas||0],
            ['6-historial','estudiante + sede + carrera + materia + año + periodo + tipo',db.historial_pk_duplicadas||0],
            ['7-morosidad','estudiante + sede + año + periodo',db.morosidad_pk_duplicadas||0],
          ].map(([name,key,count])=><tr key={name} style={{borderTop:'1px solid #eee9df'}}><td style={{padding:9,fontWeight:900,color:'#16294f'}}>{name}</td><td style={{padding:9,fontFamily:'monospace',fontSize:10.5}}>{key}</td><td style={{padding:9}}>{count}</td><td style={{padding:9}}><Badge value={count?'CRITICO':'OK'}/></td></tr>)}/>
        </Section>

        <Section title="Siete tablas originales" sub="Los IDs, nombres y orden de columnas se mantienen. La auditoría solo lee.">
          <SimpleTable headers={['Estado','Archivo','Filas','Encabezado','Última modificación','Detalle']} rows={files.map(f=><tr key={f.nombre} style={{borderTop:'1px solid #eee9df'}}><td style={{padding:9}}><Badge value={f.error||!f.encabezado_ok?'CRITICO':'OK'}/></td><td style={{padding:9,fontWeight:900,color:'#16294f'}}>{f.nombre}</td><td style={{padding:9}}>{f.filas}</td><td style={{padding:9}}>{f.encabezado_ok?'Compatible':'Revisar'}</td><td style={{padding:9,whiteSpace:'nowrap'}}>{f.ultima_modificacion||'—'}</td><td style={{padding:9,color:'#6f7889'}}>{f.error||'Archivo original conservado'}</td></tr>)}/>
        </Section>

        <Section title="Hallazgos de lectura" sub="ESTATUS es la fuente vigente. Las hojas son la salida local; la API representa la base que consulta CONAPE.">
          <SimpleTable headers={['Severidad','Código','Archivo','Total','Detalle','Muestra']} rows={hall.map((x,i)=><tr key={`${x.codigo}-${i}`} style={{borderTop:'1px solid #eee9df'}}><td style={{padding:9}}><Badge value={x.severidad}/></td><td style={{padding:9,fontWeight:900}}>{x.codigo}</td><td style={{padding:9}}>{x.archivo}</td><td style={{padding:9}}>{x.total}</td><td style={{padding:9,maxWidth:430}}>{x.detalle}</td><td style={{padding:9,fontFamily:'monospace',fontSize:10.5,whiteSpace:'pre-wrap'}}>{(x.muestra||[]).slice(0,4).join('\n')||'—'}</td></tr>)}/>
        </Section>

        <Section title="Aplicación que publica la información" sub="Un health 200 solo confirma que el servidor vive. El plan queda verificado únicamente cuando getPlanEstudios responde 200 para la cédula consultada.">
          <SimpleTable headers={['Control','HTTP','Estado','Registros','Lectura']} rows={(api.checks||[]).map((x,i)=><tr key={i} style={{borderTop:'1px solid #eee9df'}}><td style={{padding:9,fontWeight:900}}>{x.nombre}</td><td style={{padding:9}}>{x.http||'—'}</td><td style={{padding:9}}><Badge value={x.ok?'RESPONDE':x.protegido?'PROTEGIDO':'NO_DISPONIBLE'}/></td><td style={{padding:9}}>{x.registros==null?'—':x.registros}</td><td style={{padding:9,color:'#6f7889',whiteSpace:'pre-wrap'}}>{x.error||x.error_json||(x.muestra||[]).slice(0,2).join('\n')||'Respuesta recibida'}</td></tr>)}/>
        </Section>
      </>}
      {!audit&&<Section title="Auditoría pendiente" sub="Presione Auditar integración CONAPE. El proceso no escribe en las siete hojas."/>}
    </>}

    {tab==='general'&&<>
      <Section title="Estado general del Campus" sub="Diagnóstico técnico existente, conservado como lectura."><div style={{display:'flex',gap:9,flexWrap:'wrap'}}><button className="btn btn-primary" type="button" onClick={()=>run('general')} disabled={!!busy}>{busy==='general'?'Revisando…':'Actualizar diagnóstico'}</button><Badge value={general?.estado_general||general?.estado||'INFO'}/></div></Section>
      {general&&<><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginBottom:14}}><Card label="Correctos" value={general?.resumen?.ok??general?.ok_count??0} tone="OK"/><Card label="Revisar" value={general?.resumen?.revisar??general?.warn_count??0} tone="REVISAR"/><Card label="Críticos" value={general?.resumen?.critico??general?.error_count??0} tone="CRITICO"/></div><Section title="Recomendaciones"><div style={{display:'grid',gap:8}}>{(general.recomendaciones||[]).map((r,i)=><div key={i} style={{padding:11,border:'1px solid #e7e1d7',borderRadius:10}}>{r.texto||r.titulo||String(r)}</div>)}{!(general.recomendaciones||[]).length&&<span style={{color:'#7b8494'}}>Sin recomendaciones visibles.</span>}</div></Section></>}
    </>}

    {tab==='reglas'&&<>
      <Section title="Cambio de horario o grupo por fusión" sub="Cada estudiante se traslada individualmente con el motor oficial. La fusión solo cierra administrativamente el grupo cuando ya no quedan estudiantes por mover."><div style={{display:'grid',gap:8,fontSize:13,lineHeight:1.55}}><div><b>1.</b> El estudiante debe estar CA en el nivel que está cursando.</div><div><b>2.</b> Si continúa el mismo nivel y el mismo intento, no se crea nueva matrícula, deuda, plan ni fila adicional de historial.</div><div><b>3.</b> El grupo anterior conserva su recorrido; el grupo nuevo se vuelve operativo.</div><div><b>4.</b> Al terminar los traslados individuales, el grupo origen se marca como fusionado/inconcluso y deja de contarse como activo, sin borrar historia.</div></div></Section>
      <Section title="Repetición y la quinta casilla" sub="La quinta fila solo pertenece a 6-historial; 5-plan_estudios siempre mantiene cuatro materias."><div style={{display:'grid',gap:8,fontSize:13,lineHeight:1.55}}><div><b>Plan de estudios:</b> cuatro filas, una por B1, B2, I1 e I2. La materia repetida actualiza su resultado vigente.</div><div><b>Historial:</b> conserva el intento anterior y agrega una quinta fila solo cuando la base destino distingue año y periodo dentro de su clave.</div><div><b>Bloqueo:</b> si el servidor externo usa únicamente estudiante+sede+carrera+materia como PRIMARY, una quinta fila chocaría. Ese contrato debe confirmarlo el técnico antes de activar repeticiones.</div><div><b>Estado de reprobación:</b> el código válido es REP. RE no se utiliza.</div></div></Section>
    </>}
  </div>;
}
Object.assign(window,{DiagnosticoInternoView});
