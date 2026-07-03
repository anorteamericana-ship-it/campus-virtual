// F98.4-Z6-BI · DATOS maestro; correo exclusivo de DATOS; llaves históricas estables
/* global React, PageHeader */
const SCRIPT_URL_DIAG=window.APPS_SCRIPT_URL;

async function postDiagnosticoInterno(fn,payload={}){
  const token=window.getSessionToken?window.getSessionToken():'';
  const body=JSON.stringify({fn,token,...payload});
  const urls=[`${SCRIPT_URL_DIAG}?fn=${encodeURIComponent(fn)}`,SCRIPT_URL_DIAG];
  let lastError=null;

  for(let attempt=0;attempt<urls.length;attempt+=1){
    try{
      const res=await fetch(urls[attempt],{
        method:'POST',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body,
        cache:'no-store',
        redirect:'follow',
      });
      const raw=await res.text();
      const text=String(raw||'').trim();
      if(!text)throw new Error(`Apps Script no devolvió contenido en ${fn} (HTTP ${res.status}).`);
      if(/^<!doctype\s+html|^<html/i.test(text)){
        throw new Error(`Apps Script respondió HTML/texto en ${fn} (HTTP ${res.status}). Revisá la versión publicada de Apps Script.`);
      }
      let data=null;
      try{data=JSON.parse(text);}
      catch(_){throw new Error(`Apps Script devolvió una respuesta no válida en ${fn} (HTTP ${res.status}).`);}
      if(!res.ok||!data?.ok)throw new Error(data?.mensaje||data?.error||`Error en ${fn} (HTTP ${res.status}).`);
      return data;
    }catch(e){
      lastError=e;
    }
  }
  throw lastError||new Error(`No se pudo conectar con Apps Script en ${fn}.`);
}

const DS={
  OK:{bg:'#e1f1e8',fg:'#246c48',bd:'#c4e3d1'},
  FUENTE_APTA:{bg:'#e1f1e8',fg:'#246c48',bd:'#c4e3d1'},
  FUENTE_Y_DESTINO_VERIFICADOS:{bg:'#e1f1e8',fg:'#246c48',bd:'#c4e3d1'},
  VERIFICADO:{bg:'#e1f1e8',fg:'#246c48',bd:'#c4e3d1'},
  RESPONDE:{bg:'#e1f1e8',fg:'#246c48',bd:'#c4e3d1'},
  REVISAR:{bg:'#f8eccf',fg:'#8b641b',bd:'#ecd8a6'},
  FUENTE_APTA_DESTINO_NO_CONFIRMADO:{bg:'#f8eccf',fg:'#8b641b',bd:'#ecd8a6'},
  RESPONDE_PARCIAL:{bg:'#f8eccf',fg:'#8b641b',bd:'#ecd8a6'},
  CRITICO:{bg:'#f8deda',fg:'#a52c27',bd:'#efbbb5'},
  BLOQUEAR_CARGA:{bg:'#f8deda',fg:'#a52c27',bd:'#efbbb5'},
  ERROR:{bg:'#f8deda',fg:'#a52c27',bd:'#efbbb5'},
  NO_DISPONIBLE:{bg:'#f8deda',fg:'#a52c27',bd:'#efbbb5'},
  INFO:{bg:'#e1ebf6',fg:'#295483',bd:'#c7d9ec'},
  PROTEGIDO:{bg:'#e1ebf6',fg:'#295483',bd:'#c7d9ec'},
  NO_VERIFICABLE:{bg:'#e1ebf6',fg:'#295483',bd:'#c7d9ec'},
  OMITIDO:{bg:'#edf0f4',fg:'#5f6878',bd:'#dce1e8'},
};
function Badge({value='INFO'}){
  const k=String(value||'INFO').toUpperCase(),s=DS[k]||DS.INFO;
  return <span style={{display:'inline-flex',padding:'5px 9px',borderRadius:999,background:s.bg,color:s.fg,border:`1px solid ${s.bd}`,fontSize:10,fontWeight:900,letterSpacing:'.04em',whiteSpace:'nowrap'}}>{k.replace(/_/g,' ')}</span>;
}
function Card({label,value,sub,tone='INFO'}){
  const s=DS[tone]||DS.INFO;
  return <div style={{border:`1px solid ${s.bd}`,background:`linear-gradient(135deg,${s.bg},#fff)`,borderRadius:15,padding:14,minWidth:0}}>
    <div style={{fontSize:10,fontWeight:900,textTransform:'uppercase',letterSpacing:'.09em',color:s.fg}}>{label}</div>
    <b style={{display:'block',fontSize:25,color:'#16294f',marginTop:7,overflowWrap:'anywhere'}}>{value}</b>
    {sub&&<span style={{display:'block',fontSize:11.5,color:'#6f7889',marginTop:5,lineHeight:1.4,overflowWrap:'anywhere'}}>{sub}</span>}
  </div>;
}
function Section({title,sub,children}){
  return <section style={{background:'#fff',border:'1px solid var(--line,#e5e0d8)',borderRadius:18,padding:18,boxShadow:'0 10px 30px rgba(15,23,42,.04)',marginBottom:14}}>
    <div style={{marginBottom:14}}><h3 style={{margin:0,color:'#16294f',fontSize:19}}>{title}</h3>{sub&&<p style={{margin:'5px 0 0',fontSize:12.5,color:'#7b8494',lineHeight:1.45}}>{sub}</p>}</div>
    {children}
  </section>;
}
function SimpleTable({headers,rows,empty='Sin registros.',minWidth=760}){
  return <div style={{overflow:'auto',border:'1px solid var(--line,#e5e0d8)',borderRadius:12}}>
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth}}>
      <thead><tr style={{background:'#f2eee5'}}>{headers.map(h=><th key={h} style={{textAlign:'left',padding:'10px 9px',fontSize:9,textTransform:'uppercase',letterSpacing:'.06em',color:'#6f7889',whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
      <tbody>{rows.length?rows:<tr><td colSpan={headers.length} style={{padding:18,textAlign:'center',color:'#8b94a4'}}>{empty}</td></tr>}</tbody>
    </table>
  </div>;
}
function Notice({tone='INFO',children}){
  const s=DS[tone]||DS.INFO;
  return <div style={{marginTop:12,padding:'11px 13px',borderRadius:11,background:s.bg,border:`1px solid ${s.bd}`,color:s.fg,fontSize:12,lineHeight:1.5}}>{children}</div>;
}

function DiagnosticoInternoView(){
  const [general,setGeneral]=React.useState(null);
  const [audit,setAudit]=React.useState(null);
  const [busy,setBusy]=React.useState('');
  const [error,setError]=React.useState('');
  const [tab,setTab]=React.useState('conape');
  const [verifyCed,setVerifyCed]=React.useState('');
  const [moraQuery,setMoraQuery]=React.useState('');
  const [moraAudit,setMoraAudit]=React.useState(null);
  const [moraBusy,setMoraBusy]=React.useState('');
  const [moraError,setMoraError]=React.useState('');
  const [moraNote,setMoraNote]=React.useState('');

  const run=async(kind)=>{
    setBusy(kind);setError('');
    try{
      if(kind==='general')setGeneral(await postDiagnosticoInterno('diagnosticoSistemaInterno',{detalle:true}));
      if(kind==='audit')setAudit(await postDiagnosticoInterno('auditarArchivosCONAPE',{api:true,cedula_verificacion:String(verifyCed||'').trim()}));
    }catch(e){setError(e.message||String(e));}
    finally{setBusy('');}
  };


  const runMoraAudit=async(query=moraQuery)=>{
    setMoraBusy('audit');setMoraError('');
    try{
      const q=String(query||'').trim();
      const data=await postDiagnosticoInterno('auditarMorosidadConapeManual',{busqueda:q});
      setMoraAudit(data);
      if(data?.estudiante){setMoraQuery(data.estudiante.codigo||data.estudiante.cedula||q);}
    }catch(e){setMoraError(e.message||String(e));}
    finally{setMoraBusy('');}
  };

  const applyMora=async(item,accion)=>{
    const motivo=String(moraNote||'').trim();
    if(motivo.length<10){setMoraError('Escribí un motivo de al menos 10 caracteres antes de corregir.');return;}
    const label=accion==='DELETE'?'eliminar la fila':accion==='SET_SI'?'establecer MORA SI':'establecer MORA NO';
    if(!window.confirm(`Se va a ${label} para ${item.nivel} · ${item.anio}/${item.periodo}.\n\nSolo se modificará esta llave de 7-morosidad. ¿Continuar?`))return;
    setMoraBusy(`${item.nivel}-${accion}`);setMoraError('');
    try{
      const data=await postDiagnosticoInterno('aplicarCorreccionMorosidadConapeManual',{
        codigo:moraAudit?.estudiante?.codigo,
        cedula:moraAudit?.estudiante?.cedula,
        nivel:item.nivel,
        accion,
        firma_actual:item.firma_actual||'',
        cantidad_actual:(item.filas_morosidad||[]).length,
        motivo,
      });
      setMoraAudit(data);setMoraNote('');
    }catch(e){setMoraError(e.message||String(e));}
    finally{setMoraBusy('');}
  };

  const res=audit?.resumen||{};
  const hall=audit?.hallazgos||[];
  const files=audit?.archivos||[];
  const api=audit?.api||{};
  const local=audit?.verificacion_cedula||api?.comparacion?.local||{};
  const cmp=api?.comparacion||{};
  const pf=audit?.preflight_importacion||{};
  const pc=pf?.conteos||{};
  const pk=pf?.claves||{};
  const rel=pf?.relaciones||{};
  const blockers=pf?.bloqueos||[];
  const pfWarnings=pf?.advertencias||[];
  const pfAvailable=!!pf?.estado;
  const identidad=audit?.integridad_datos_estatus||{};
  const ir=identidad?.resumen||{};
  const ih=identidad?.hallazgos||[];

  return <div className="page-wrap" style={{maxWidth:1460,margin:'0 auto',padding:'18px 18px 42px'}}>
    <PageHeader title="Diagnóstico interno" subtitle="Auditoría manual: DATOS como identidad maestra, ESTATUS íntegro, comprobantes por nivel, siete hojas, claves n8n/MySQL y API destino. Ninguna limpieza se ejecuta automáticamente."/>
    {error&&<Notice tone="CRITICO"><b>{error}</b></Notice>}
    <div style={{display:'flex',gap:8,flexWrap:'wrap',margin:'14px 0'}}>{[['conape','Auditoría CONAPE'],['general','Sistema interno'],['reglas','Reglas de continuidad']].map(([id,label])=><button key={id} type="button" className={tab===id?'btn btn-primary':'btn'} onClick={()=>{setTab(id);setError('');}}>{label}</button>)}</div>

    {tab==='conape'&&<>
      <Section title="Integración CONAPE en producción" sub="Valida las condiciones que históricamente rompieron Insertar Estudiantes e Insertar Plan antes de que una carga externa vuelva a ejecutarse.">
        <div style={{display:'flex',gap:9,flexWrap:'wrap',alignItems:'center'}}>
          <button className="btn btn-primary" type="button" onClick={()=>run('audit')} disabled={!!busy}>{busy==='audit'?'Auditando…':'Auditar integración CONAPE'}</button>
          <Badge value={audit?.estado||'INFO'}/><Badge value="PROTEGIDO"/><span style={{fontSize:11,fontWeight:900,color:'#295483'}}>SOLO LECTURA · MODO MANUAL</span>
        </div>
        <div style={{marginTop:10,fontSize:12,color:'#6f7889'}}>No se crean, eliminan ni administran triggers. Tampoco se modifican IDs, rutas, encabezados, credenciales o filas de las siete hojas.</div>
      </Section>

      <Section title="Integridad maestra DATOS → ESTATUS" sub="DATOS se crea primero y manda. ESTATUS solo es válido cuando el código existe en DATOS. El correo se toma únicamente desde DATOS y ya no se audita en ESTATUS.">
        <div style={{display:'flex',gap:9,flexWrap:'wrap',alignItems:'center',marginBottom:audit?12:0}}>
          <Badge value={identidad?.estado||'INFO'}/>
          <span style={{fontSize:11,fontWeight:900,color:'#295483'}}>SOLO LECTURA · SIN BORRADO AUTOMÁTICO</span>
        </div>
        {audit&&<>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:9,marginBottom:12}}>
            <Card label="Filas DATOS" value={ir.datos_filas??0} sub="Identidades maestras" tone="OK"/>
            <Card label="Filas ESTATUS" value={ir.estatus_filas??0} sub="Historial académico" tone="INFO"/>
            <Card label="ESTATUS sin DATOS" value={ir.estatus_sin_datos??0} sub="Filas huérfanas" tone={(ir.estatus_sin_datos||0)?'CRITICO':'OK'}/>
            <Card label="DATOS sin ESTATUS" value={ir.datos_sin_estatus??0} sub="Identidades sin trayectoria" tone={(ir.datos_sin_estatus||0)?'CRITICO':'OK'}/>
            <Card label="Llaves inválidas" value={ir.llaves_invalidas??0} sub="Vacías o duplicadas" tone={(ir.llaves_invalidas||0)?'CRITICO':'OK'}/>
          </div>
          {identidad?.estado==='OK'&&<Notice tone="OK"><b>Integridad válida.</b> Todos los códigos de ESTATUS existen primero en DATOS y no se detectaron llaves inválidas ni identidades sin trayectoria.</Notice>}
          {identidad?.estado==='CRITICO'&&<Notice tone="CRITICO"><b>ESTATUS no está íntegro.</b> No sincronice ni corrija copiando datos a ciegas. Revise cada fila señalada contra DATOS; DATOS es la fuente maestra.</Notice>}
          <div style={{marginTop:12}}>
            <SimpleTable headers={['Severidad','Código','Cruce','Total','Regla','Muestra']} empty="Sin hallazgos DATOS ↔ ESTATUS." rows={ih.map((x,i)=><tr key={`${x.codigo}-${i}`} style={{borderTop:'1px solid #eee9df'}}><td style={{padding:9}}><Badge value={x.severidad}/></td><td style={{padding:9,fontWeight:900}}>{x.codigo}</td><td style={{padding:9}}>{x.archivo}</td><td style={{padding:9}}>{x.total}</td><td style={{padding:9,maxWidth:450}}>{x.detalle}</td><td style={{padding:9,fontFamily:'monospace',fontSize:10.5,whiteSpace:'pre-wrap',minWidth:320}}>{(x.muestra||[]).slice(0,8).join('\n')||'—'}</td></tr>)}/>
          </div>
        </>}
        {!audit&&<div style={{fontSize:12,color:'#6f7889'}}>Se ejecuta junto con <b>Auditar integración CONAPE</b>. No modifica DATOS, ESTATUS ni las siete hojas externas.</div>}
      </Section>

      <Section title="Auditoría manual de 7-morosidad" sub="Revisa comprobantes por nivel y la fila externa correspondiente. No corrige en masa: cada llave se mantiene, cambia o elimina por decisión explícita del Super Admin.">
        <div style={{display:'flex',gap:9,flexWrap:'wrap',alignItems:'center'}}>
          <input value={moraQuery} onChange={e=>setMoraQuery(e.target.value.replace(/[^0-9]/g,''))} placeholder="Código o cédula" style={{minWidth:230,padding:'10px 12px',border:'1px solid #d8d2c8',borderRadius:10,fontSize:13}}/>
          <button className="btn btn-primary" type="button" onClick={()=>runMoraAudit()} disabled={!!moraBusy}>{moraBusy==='audit'?'Auditando…':String(moraQuery).trim()?'Auditar estudiante':'Listar casos pendientes'}</button>
          {moraAudit&&<Badge value={moraAudit?.estudiante?(moraAudit.resumen?.criticos?'CRITICO':moraAudit.resumen?.revisar?'REVISAR':'OK'):(moraAudit.resumen?.criticos?'CRITICO':moraAudit.resumen?.revisar?'REVISAR':'OK')}/>} 
          <span style={{fontSize:11,fontWeight:900,color:'#295483'}}>CASO POR CASO · SIN LIMPIEZA MASIVA</span>
        </div>
        {moraError&&<Notice tone="CRITICO"><b>{moraError}</b></Notice>}
        {!moraAudit&&<Notice tone="INFO">Un nivel PE o SIN REGISTRO debe aparecer como <b>NO APLICA</b> y no debe tener fila SI/NO en 7-morosidad. La existencia de cero pendiente tampoco prueba que haya un comprobante.</Notice>}
        {moraAudit?.casos&&<div style={{marginTop:14}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:9,marginBottom:12}}><Card label="Casos detectados" value={moraAudit.resumen?.total||0} tone={(moraAudit.resumen?.total||0)?'REVISAR':'OK'}/><Card label="Críticos" value={moraAudit.resumen?.criticos||0} tone={(moraAudit.resumen?.criticos||0)?'CRITICO':'OK'}/><Card label="Revisar" value={moraAudit.resumen?.revisar||0} tone={(moraAudit.resumen?.revisar||0)?'REVISAR':'OK'}/></div>
          <SimpleTable headers={['Severidad','Código','Estudiante','Nivel','Periodo','Fila actual','Acción sugerida','Abrir']} empty="No se detectaron inconsistencias entre historial y 7-morosidad." rows={(moraAudit.casos||[]).map((x,i)=><tr key={`${x.codigo}-${x.estudiante?.cedula}-${x.anio}-${x.periodo}-${i}`} style={{borderTop:'1px solid #eee9df'}}><td style={{padding:9}}><Badge value={x.severidad}/></td><td style={{padding:9,fontWeight:900}}>{x.codigo}</td><td style={{padding:9}}><b>{x.estudiante?.nombre||'—'}</b><div style={{fontSize:10,color:'#7b8494'}}>{x.estudiante?.codigo||'—'} · {x.estudiante?.cedula||'—'}</div></td><td style={{padding:9}}>{x.nivel||'—'}</td><td style={{padding:9}}>{x.anio||'—'} / {x.periodo||'—'}</td><td style={{padding:9}}>{x.estado_morosidad||'—'}</td><td style={{padding:9,maxWidth:330}}><b>{x.accion}</b><div style={{fontSize:10.5,color:'#6f7889'}}>{x.detalle}</div></td><td style={{padding:9}}><button className="btn" type="button" onClick={()=>{const q=x.estudiante?.codigo||x.estudiante?.cedula||'';setMoraQuery(q);runMoraAudit(q);}}>Revisar</button></td></tr>)}/>
        </div>}
        {moraAudit?.estudiante&&<div style={{marginTop:14}}>
          <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',alignItems:'center',marginBottom:10}}><div><b style={{fontSize:16,color:'#16294f'}}>{moraAudit.estudiante.nombre}</b><div style={{fontSize:11,color:'#6f7889'}}>Código {moraAudit.estudiante.codigo} · Cédula {moraAudit.estudiante.cedula}</div></div><div style={{display:'flex',gap:7,flexWrap:'wrap'}}><Badge value={(moraAudit.resumen?.criticos||0)?'CRITICO':(moraAudit.resumen?.revisar||0)?'REVISAR':'OK'}/><button className="btn" type="button" onClick={()=>{setMoraQuery('');setMoraAudit(null);setMoraError('');}}>Cerrar caso</button></div></div>
          <div style={{marginBottom:10}}><input value={moraNote} onChange={e=>setMoraNote(e.target.value)} placeholder="Motivo obligatorio para corregir (mínimo 10 caracteres)" style={{width:'min(760px,100%)',padding:'10px 12px',border:'1px solid #d8d2c8',borderRadius:10,fontSize:12}}/></div>
          <SimpleTable minWidth={1180} headers={['Nivel','ESTATUS','Periodo','Comprobantes reales','7-morosidad actual','Cálculo sugerido','Diagnóstico','Acciones manuales']} rows={(moraAudit.niveles||[]).map(x=>{const ev=x.evidencia||{},rows=x.filas_morosidad||[],busyKey=`${x.nivel}-`;return <tr key={x.nivel} style={{borderTop:'1px solid #eee9df'}}><td style={{padding:9,fontWeight:950}}>{x.nivel}</td><td style={{padding:9}}><Badge value={x.estatus==='PE'||x.estatus==='SIN_REGISTRO'?'NO_VERIFICABLE':x.estatus}/><div style={{fontSize:10,color:'#7b8494',marginTop:3}}>{x.grupo||'Sin grupo'}</div></td><td style={{padding:9}}>{x.anio&&x.periodo?`${x.anio} / ${x.periodo}`:'Sin definir'}</td><td style={{padding:9,minWidth:250}}><div><b>Matrícula:</b> {ev.matricula?.cantidad||0} · {Number(ev.matricula?.total||0).toLocaleString('es-CR')}</div><div><b>Cuotas:</b> {ev.cuotas?.cantidad||0} · {Number(ev.cuotas?.total||0).toLocaleString('es-CR')}</div><div><b>Certificado:</b> {ev.certificado?.cantidad||0} · {Number(ev.certificado?.total||0).toLocaleString('es-CR')}</div>{x.nivel==='I2'&&<div><b>Título final:</b> {ev.titulo?.cantidad||0} · {Number(ev.titulo?.total||0).toLocaleString('es-CR')}</div>}{(ev.comprobantes||[]).slice(0,4).map((c,i)=><div key={i} style={{fontSize:9.5,color:'#6f7889',marginTop:2}}>{c.tipo} · {c.recibo||'sin recibo'} · {c.concepto}</div>)}</td><td style={{padding:9}}>{rows.length?rows.map(r=><div key={r.row}><b>{r.estado}</b> · fila {r.row}</div>):<b>SIN FILA</b>}</td><td style={{padding:9}}><Badge value={x.esperado==='PE'?'NO_VERIFICABLE':x.esperado||'INFO'}/><div style={{fontSize:10,color:'#6f7889',marginTop:3}}>{x.esperado==='PE'?'No debe existir fila':`MORA ${x.esperado}`}</div></td><td style={{padding:9,maxWidth:300}}><Badge value={x.severidad}/><div style={{fontWeight:900,marginTop:4}}>{x.recomendacion}</div><div style={{fontSize:10.5,color:'#6f7889',marginTop:3}}>{x.detalle}</div></td><td style={{padding:9}}><div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{(x.estatus==='PE'||x.estatus==='SIN_REGISTRO'||x.esperado==='PE')&&rows.length===1&&<button className="btn" type="button" disabled={!!moraBusy} onClick={()=>applyMora(x,'DELETE')}>{moraBusy===`${busyKey}DELETE`?'Aplicando…':'Eliminar fila'}</button>}{x.esperado!=='PE'&&x.estatus!=='PE'&&x.estatus!=='SIN_REGISTRO'&&rows.length<=1&&<><button className="btn" type="button" disabled={!!moraBusy} onClick={()=>applyMora(x,'SET_SI')}>MORA SI</button><button className="btn" type="button" disabled={!!moraBusy} onClick={()=>applyMora(x,'SET_NO')}>MORA NO</button></>}{x.recomendacion==='MANTENER'||x.recomendacion==='NO_APLICA'?<span style={{fontSize:10.5,color:'#2E7D32',fontWeight:900}}>Sin cambio</span>:null}</div></td></tr>})}/>
          <Notice tone="REVISAR"><b>Control de seguridad:</b> establecer SI/NO está bloqueado para PE y SIN REGISTRO. Eliminar exige exactamente una fila. Si el dato cambia después de la auditoría, la corrección se rechaza y obliga a recargar el caso.</Notice>
        </div>}
      </Section>

      {audit&&<Section title="Preflight de carga n8n / MySQL" sub="FUENTE APTA significa que Google Sheets no produciría las PRIMARY duplicadas ni las FOREIGN KEY observadas. No significa que el workflow externo esté bien diseñado.">
        <div style={{display:'flex',gap:9,flexWrap:'wrap',alignItems:'center',marginBottom:12}}>
          <Badge value={pfAvailable?(pf.estado_operativo||pf.estado):'NO_VERIFICABLE'}/>
          <span style={{fontSize:12,fontWeight:800,color:'#5f6878'}}>Versión {pf.version||audit.version||'—'}</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10}}>
          <Card label="Estudiantes" value={pc.estudiantes??'—'} sub="PRIMARY externa: cédula" tone={!pfAvailable?'INFO':(pk.estudiantes_pk_duplicadas||0)?'CRITICO':'OK'}/>
          <Card label="Plan" value={pc.plan??'—'} sub={`Esperado: ${pc.plan_esperado??'—'} (estudiantes × 4)`} tone={!pfAvailable?'INFO':pc.plan===pc.plan_esperado?'OK':'CRITICO'}/>
          <Card label="Historial" value={pc.historial??'—'} sub={`Mínimo base: ${pc.historial_minimo??'—'}`} tone={!pfAvailable?'INFO':(pc.historial||0)>=(pc.historial_minimo||0)?'OK':'CRITICO'}/>
          <Card label="PK duplicadas" value={(pk.estudiantes_pk_duplicadas||0)+(pk.plan_pk_duplicadas||0)+(pk.historial_pk_duplicadas||0)+(pk.morosidad_pk_duplicadas||0)} sub="Estudiantes + plan + historial + morosidad" tone={(pk.estudiantes_pk_duplicadas||pk.plan_pk_duplicadas||pk.historial_pk_duplicadas||pk.morosidad_pk_duplicadas)?'CRITICO':'OK'}/>
          <Card label="FK huérfanas" value={(rel.plan_fk_huerfanas||0)+(rel.historial_fk_huerfanas||0)+(rel.morosidad_fk_huerfanas||0)} sub="Filas cuya cédula no existe en 4-estudiantes" tone={(rel.plan_fk_huerfanas||rel.historial_fk_huerfanas||rel.morosidad_fk_huerfanas)?'CRITICO':'OK'}/>
          <Card label="Bloqueos" value={blockers.reduce((a,x)=>a+Number(x.total||0),0)} sub="La carga externa debe detenerse si es mayor que cero" tone={blockers.length?'CRITICO':'OK'}/>
        </div>
        {pfAvailable&&pf.fuente_apta&&!blockers.length&&<Notice tone="OK"><b>Fuente estructuralmente apta.</b> No hay cédulas PRIMARY repetidas, claves de plan duplicadas, referencias sin estudiante ni diferencias entre estudiantes × 4 y el total del plan.</Notice>}
        {pfAvailable&&!!blockers.length&&<Notice tone="CRITICO"><b>No ejecutar la carga externa.</b> Primero deben resolverse los bloqueos listados abajo; no se corrigen automáticamente.</Notice>}
        {pfAvailable&&pf.fuente_apta&&!pf.destino_verificado&&<Notice tone="REVISAR"><b>Destino aún no confirmado.</b> Las hojas están aptas, pero una carga puede seguir fallando si n8n usa limpieza destructiva + INSERT ciego, permite ejecuciones superpuestas o no usa transacción/staging.</Notice>}
        {!pfAvailable&&<Notice tone="CRITICO"><b>Backend sin preflight BB.</b> Publicá primero el Code.gs F98.4-Z6-BB y volvé a ejecutar la auditoría.</Notice>}
        <div style={{marginTop:14}}>
          <SimpleTable headers={['Estado','Código','Tabla / relación','Total','Qué evita','Muestra']} empty="Sin bloqueos estructurales." rows={blockers.map((x,i)=><tr key={`${x.codigo}-${i}`} style={{borderTop:'1px solid #eee9df'}}><td style={{padding:9}}><Badge value="BLOQUEAR_CARGA"/></td><td style={{padding:9,fontWeight:900}}>{x.codigo}</td><td style={{padding:9}}>{x.tabla}</td><td style={{padding:9}}>{x.total}</td><td style={{padding:9,maxWidth:430}}>{x.detalle}</td><td style={{padding:9,fontFamily:'monospace',fontSize:10.5,whiteSpace:'pre-wrap'}}>{(x.muestra||[]).slice(0,4).join('\n')||'—'}</td></tr>)}/>
        </div>
        {!!pfWarnings.length&&<div style={{marginTop:12}}><SimpleTable headers={['Advertencia','Tabla','Total','Detalle','Muestra']} rows={pfWarnings.map((x,i)=><tr key={`${x.codigo}-${i}`} style={{borderTop:'1px solid #eee9df'}}><td style={{padding:9,fontWeight:900}}>{x.codigo}</td><td style={{padding:9}}>{x.tabla}</td><td style={{padding:9}}>{x.total}</td><td style={{padding:9,maxWidth:480}}>{x.detalle}</td><td style={{padding:9,fontFamily:'monospace',fontSize:10.5,whiteSpace:'pre-wrap'}}>{(x.muestra||[]).slice(0,4).join('\n')||'—'}</td></tr>)}/></div>}
        <Notice tone="INFO"><b>Contrato observado en los errores históricos:</b> Estudiantes usa la cédula como PRIMARY; Plan usa cédula + sede + carrera + materia; Plan referencia Estudiantes por cédula. Orden mínimo: Estudiantes → Plan → Historial → Morosidad. El workflow externo debería usar staging o UPSERT y una sola ejecución bloqueada, no borrado parcial seguido de INSERT ciego.</Notice>
      </Section>}

      <Section title="Verificación extremo a extremo" sub="Consulta una cédula concreta en las hojas y luego en los endpoints que publica la base externa.">
        <div style={{display:'flex',gap:9,flexWrap:'wrap',alignItems:'center'}}>
          <input value={verifyCed} onChange={e=>setVerifyCed(e.target.value.replace(/[^0-9]/g,''))} placeholder="Ej. 118000689" style={{minWidth:230,padding:'10px 12px',border:'1px solid #d8d2c8',borderRadius:10,fontSize:13}}/>
          <button className="btn" type="button" onClick={()=>run('audit')} disabled={!!busy||!String(verifyCed).trim()}>{busy==='audit'?'Verificando…':'Verificar cédula en destino'}</button>
          {audit&&<Badge value={api.estado||'INFO'}/>} 
        </div>
        {audit&&local?.cedula&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:9,marginTop:14}}>
          <Card label="Cédula" value={local.cedula} sub={local.nombre||'Sin identidad local'} tone={local.estudiante?'OK':'CRITICO'}/>
          <Card label="Plan local" value={local.plan_filas||0} sub={(local.plan_estados||[]).join(' · ')||'Sin filas'} tone={local.plan_filas===4?'OK':'CRITICO'}/>
          <Card label="Plan activo" value={local.plan_activo?'SÍ':'NO'} sub="Activo cuando existe un nivel CA" tone={local.plan_activo?'OK':'INFO'}/>
          <Card label="Plan en API" value={cmp.plan_api_registros==null?'NO VERIFICADO':cmp.plan_api_registros} sub={cmp.resultado||api.estado||'—'} tone={cmp.resultado==='PLAN_LOCAL_NO_VISIBLE_EN_API'?'CRITICO':cmp.resultado==='VISIBLE_EN_API'?'OK':'INFO'}/>
        </div>}
        {audit&&api.estado==='PROTEGIDO'&&<Notice tone="REVISAR"><b>La API devolvió 401/403.</b> Las hojas sí fueron auditadas, pero el Campus no puede afirmar que la base destino cargó la última versión hasta contar con credenciales dedicadas de solo lectura.</Notice>}
      </Section>

      {audit&&<>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(165px,1fr))',gap:10,marginBottom:14}}>
          <Card label="Estado académico" value={audit.estado} tone={audit.estado}/>
          <Card label="Críticos" value={res.criticos||0} tone={(res.criticos||0)?'CRITICO':'OK'}/>
          <Card label="Advertencias" value={res.advertencias||0} tone={(res.advertencias||0)?'REVISAR':'OK'}/>
          <Card label="Informativos" value={res.info||0} tone="INFO"/>
          <Card label="Archivos válidos" value={`${res.archivos_ok||0}/7`} tone={(res.archivos_ok===7)?'OK':'CRITICO'}/>
          <Card label="API/base externa" value={api.estado||'—'} tone={api.estado||'INFO'}/>
        </div>

        <Section title="Siete tablas originales" sub="Filas corresponde a datos reales. Las filas físicas vacías finales se excluyen de la auditoría y no deben llegar a n8n.">
          <SimpleTable headers={['Estado','Archivo','Filas con datos','Filas físicas','Vacías al final','Encabezado','Última modificación']} rows={files.map(f=><tr key={f.nombre} style={{borderTop:'1px solid #eee9df'}}><td style={{padding:9}}><Badge value={f.error||!f.encabezado_ok?'CRITICO':'OK'}/></td><td style={{padding:9,fontWeight:900,color:'#16294f'}}>{f.nombre}</td><td style={{padding:9}}>{f.filas}</td><td style={{padding:9}}>{f.filas_fisicas??f.filas}</td><td style={{padding:9}}>{f.filas_vacias_finales||0}</td><td style={{padding:9}}>{f.encabezado_ok?'Compatible':'Revisar'}</td><td style={{padding:9,whiteSpace:'nowrap'}}>{f.ultima_modificacion||'—'}</td></tr>)}/>
        </Section>

        <Section title="Hallazgos académicos y de salida" sub="DATOS define la identidad; ESTATUS define la trayectoria académica únicamente para códigos válidos. Las hojas son la salida local y la API representa lo que ve la plataforma externa.">
          <SimpleTable headers={['Severidad','Código','Archivo','Total','Detalle','Muestra']} rows={hall.map((x,i)=><tr key={`${x.codigo}-${i}`} style={{borderTop:'1px solid #eee9df'}}><td style={{padding:9}}><Badge value={x.severidad}/></td><td style={{padding:9,fontWeight:900}}>{x.codigo}</td><td style={{padding:9}}>{x.archivo}</td><td style={{padding:9}}>{x.total}</td><td style={{padding:9,maxWidth:430}}>{x.detalle}</td><td style={{padding:9,fontFamily:'monospace',fontSize:10.5,whiteSpace:'pre-wrap'}}>{(x.muestra||[]).slice(0,4).join('\n')||'—'}</td></tr>)}/>
        </Section>

        <Section title="Aplicación que publica la información" sub="Un health 200 solo confirma que el servidor vive. El plan queda verificado cuando getPlanEstudios responde 200 y devuelve materias para la cédula consultada.">
          <SimpleTable headers={['Control','HTTP','Estado','Registros','Lectura']} rows={(api.checks||[]).map((x,i)=><tr key={i} style={{borderTop:'1px solid #eee9df'}}><td style={{padding:9,fontWeight:900}}>{x.nombre}</td><td style={{padding:9}}>{x.http||'—'}</td><td style={{padding:9}}><Badge value={x.ok?'RESPONDE':x.protegido?'PROTEGIDO':'NO_DISPONIBLE'}/></td><td style={{padding:9}}>{x.registros==null?'—':x.registros}</td><td style={{padding:9,color:'#6f7889',whiteSpace:'pre-wrap'}}>{x.error||x.error_json||(x.muestra||[]).slice(0,2).join('\n')||'Respuesta recibida'}</td></tr>)}/>
        </Section>
      </>}
      {!audit&&<Section title="Auditoría pendiente" sub="Presione Auditar integración CONAPE. El proceso solo lee; no corrige ni ejecuta n8n."/>}
    </>}

    {tab==='general'&&<>
      <Section title="Estado general del Campus" sub="Diagnóstico técnico existente, conservado como lectura."><div style={{display:'flex',gap:9,flexWrap:'wrap'}}><button className="btn btn-primary" type="button" onClick={()=>run('general')} disabled={!!busy}>{busy==='general'?'Revisando…':'Actualizar diagnóstico'}</button><Badge value={general?.estado_general||general?.estado||'INFO'}/></div></Section>
      {general&&<><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginBottom:14}}><Card label="Correctos" value={general?.resumen?.ok??general?.ok_count??0} tone="OK"/><Card label="Revisar" value={general?.resumen?.revisar??general?.warn_count??0} tone="REVISAR"/><Card label="Críticos" value={general?.resumen?.critico??general?.error_count??0} tone="CRITICO"/></div><Section title="Recomendaciones"><div style={{display:'grid',gap:8}}>{(general.recomendaciones||[]).map((r,i)=><div key={i} style={{padding:11,border:'1px solid #e7e1d7',borderRadius:10}}>{r.texto||r.titulo||String(r)}</div>)}{!(general.recomendaciones||[]).length&&<span style={{color:'#7b8494'}}>Sin recomendaciones visibles.</span>}</div></Section></>}
    </>}

    {tab==='reglas'&&<>
      <Section title="Carga externa segura" sub="La auditoría local evita enviar datos inválidos, pero no reemplaza la corrección del workflow n8n."><div style={{display:'grid',gap:8,fontSize:13,lineHeight:1.55}}><div><b>1.</b> No iniciar si el preflight dice BLOQUEAR CARGA.</div><div><b>2.</b> La carga debe impedir ejecuciones superpuestas.</div><div><b>3.</b> Estudiantes debe confirmarse antes de Plan, Historial y Morosidad.</div><div><b>4.</b> Usar staging/UPSERT o transacción; no depender de que una limpieza destructiva siempre termine bien.</div><div><b>5.</b> Si cualquier nodo falla, no dejar la base parcialmente reemplazada.</div></div></Section>
      <Section title="Cambio de horario, repetición y estados" sub="Las reglas académicas no deben producir claves técnicas duplicadas."><div style={{display:'grid',gap:8,fontSize:13,lineHeight:1.55}}><div><b>Cambio de grupo:</b> si continúa el mismo nivel e intento, actualiza la fuente académica; no crea otra materia en el plan.</div><div><b>Plan:</b> siempre mantiene cuatro materias, una por B1, B2, I1 e I2.</div><div><b>Historial:</b> una repetición puede agregar otro intento únicamente si año/periodo/tipo forman parte de la PRIMARY real del destino.</div><div><b>Reprobación:</b> el código válido es REP. RE no se utiliza.</div><div><b>Retiro:</b> RI y RJ son estados distintos y no deben sustituirse por una nota inventada.</div></div></Section>
    </>}
  </div>;
}
Object.assign(window,{DiagnosticoInternoView});
