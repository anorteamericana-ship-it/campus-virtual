// F98.4-Z6-CS21A26 · Panel Maestro CONAPE con Detalle editable en DATOS.
(function(){
const MONTHS=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function date(v){
  if(v instanceof Date)return v;
  let s=String(v||'').replace(/\s*\([^)]*\)\s*$/,'').trim();
  let m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);
  if(m)return new Date(+m[3],+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0));
  m=s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/);
  if(m)return new Date(+m[1],+m[2]-1,+m[3],+(m[4]||0),+(m[5]||0));
  const d=new Date(s);
  return isNaN(d)?null:d;
}
function fmt(v,time){
  const d=date(v);
  if(!d)return String(v||'—');
  const f=d.toLocaleDateString('es-CR',{day:'2-digit',month:'short',year:'numeric'}).replace(/\./g,'');
  return time?f+' · '+d.toLocaleTimeString('es-CR',{hour:'numeric',minute:'2-digit',hour12:true}):f;
}
function phone(v){
  const d=String(v||'').replace(/\D/g,'');
  return d.length===8?'506'+d:d;
}
function period(r){
  return r.periodLabel||((r.month?MONTHS[+r.month-1]:'—')+' '+(r.year||'—'));
}
function type(r){
  if(r.advance)return'Desembolso adelantado';
  return ({
    PRIMER_DESEMBOLSO:'Primer desembolso',
    NUEVO_DESEMBOLSO:'Nuevo desembolso',
    DESEMBOLSO_MES_ACTUAL:'Desembolso del mes',
    DESEMBOLSO_REPORTADO:'Desembolso reportado',
    APROBADO_SIN_DESEMBOLSO:'Aprobado sin desembolso',
    DESEMBOLSO_REMOVIDO:'Desembolso retirado'
  }[r.type]||String(r.type||'').replaceAll('_',' '));
}
async function postDetalle(fn,payload={}){
  const url=window.APPS_SCRIPT_URL;
  const res=await fetch(`${url}?fn=${encodeURIComponent(fn)}`,{
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({
      fn,
      token:window.getSessionToken?window.getSessionToken():'',
      ...payload
    }),
    cache:'no-store'
  });
  const raw=await res.text();
  let data=null;
  try{data=raw?JSON.parse(raw):null;}catch(_){throw new Error('Apps Script devolvió una respuesta inválida.');}
  if(!res.ok||!data?.ok)throw new Error(data?.mensaje||data?.error||`No se pudo ejecutar ${fn}.`);
  return data;
}
function detalleVisible(v){
  const text=String(v||'').trim();
  if(!text)return 'Sin nota registrada.';
  return text.length>110?text.slice(0,107)+'…':text;
}
function DetailButton({row,value,onEdit}){
  const linked=!!String(row?.code||'').trim();
  const label=linked?`Detalle: ${detalleVisible(value)}`:'Detalle: Sin vínculo con DATOS.';
  return <button
    type="button"
    onClick={()=>linked&&onEdit(row,value)}
    disabled={!linked}
    title={linked?(String(value||'').trim()||'Agregar detalle del estudiante'):'Este movimiento todavía no está vinculado a un estudiante de DATOS.'}
    style={{
      width:'100%',
      marginTop:6,
      padding:'7px 9px',
      borderRadius:8,
      border:'1px solid #DED5C7',
      background:linked?'#F5F0E7':'#F0EEE9',
      color:linked?'#4D3B2B':'#8B867F',
      fontSize:10.5,
      lineHeight:1.4,
      whiteSpace:'normal',
      textAlign:'left',
      cursor:linked?'pointer':'not-allowed',
      fontFamily:'inherit'
    }}>
    <b>{label}</b>{linked&&<span style={{float:'right',marginLeft:8}}>✎</span>}
  </button>;
}
function DetailModal({editor,setEditor,onSave}){
  if(!editor)return null;
  const row=editor.row||{};
  return <div
    role="dialog"
    aria-modal="true"
    aria-label="Editar detalle del estudiante"
    onMouseDown={e=>{if(e.target===e.currentTarget&&!editor.saving)setEditor(null);}}
    style={{
      position:'fixed',inset:0,zIndex:99999,background:'rgba(0,22,52,.48)',
      display:'flex',alignItems:'center',justifyContent:'center',padding:20
    }}>
    <div style={{
      width:'min(640px,100%)',background:'#fff',borderRadius:18,
      boxShadow:'0 24px 70px rgba(0,0,0,.24)',overflow:'hidden',
      border:'1px solid #D9D2C7'
    }}>
      <div style={{padding:'18px 22px',background:'#F8F4ED',borderBottom:'1px solid #E4DDD2'}}>
        <div style={{fontSize:11,fontWeight:900,letterSpacing:'.11em',textTransform:'uppercase',color:'#7A1E2C'}}>Seguimiento CONAPE</div>
        <div style={{fontSize:21,fontWeight:700,color:'#001E47',marginTop:3}}>Detalle del estudiante</div>
        <div style={{fontSize:12,color:'#6F665C',marginTop:4}}>{row.name||'Sin nombre'} · {row.code||'Sin código'}</div>
      </div>
      <div style={{padding:'20px 22px'}}>
        {editor.loading?(
          <div style={{padding:'30px 0',textAlign:'center',color:'#6F665C'}}>Cargando detalle actual…</div>
        ):<>
          <textarea
            autoFocus
            value={editor.value}
            maxLength={3000}
            onChange={e=>setEditor(x=>({...x,value:e.target.value,error:''}))}
            placeholder="Escriba aquí la nota de seguimiento del estudiante…"
            style={{
              width:'100%',minHeight:170,resize:'vertical',boxSizing:'border-box',
              border:'2px solid #D9D2C7',borderRadius:12,padding:'13px 14px',
              fontFamily:'inherit',fontSize:13.5,lineHeight:1.55,color:'#172033',outline:'none'
            }}
          />
          <div style={{display:'flex',justifyContent:'space-between',gap:12,marginTop:7,fontSize:11,color:'#7C746A'}}>
            <span>Se guarda en DATOS · COMENTARIO_ADMIN</span>
            <span>{String(editor.value||'').length}/3000</span>
          </div>
          {editor.error&&<div style={{marginTop:12,padding:'10px 12px',borderRadius:9,background:'#FFF0F0',border:'1px solid #E5A4A4',color:'#A31E1E',fontSize:12}}>⚠ {editor.error}</div>}
        </>}
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,padding:'14px 22px 18px'}}>
        <button type="button" onClick={()=>setEditor(null)} disabled={editor.saving} style={{padding:'9px 15px',borderRadius:9,border:'1px solid #D7D0C5',background:'#fff',fontWeight:700,cursor:'pointer'}}>Cancelar</button>
        <button type="button" onClick={onSave} disabled={editor.loading||editor.saving} style={{padding:'9px 16px',borderRadius:9,border:'1px solid #002F6C',background:'#002F6C',color:'#fff',fontWeight:800,cursor:editor.saving?'wait':'pointer',opacity:(editor.loading||editor.saving)?0.65:1}}>{editor.saving?'Guardando…':'Guardar detalle'}</button>
      </div>
    </div>
  </div>;
}
function MasterConapeMovementsTableCS21A26({data,onRefresh}){
  const m=data?.conape?.movements||{};
  const rows=m.rows||[];
  const s=m.summary||{};
  const [busy,setBusy]=React.useState(false);
  const [msg,setMsg]=React.useState('');
  const [details,setDetails]=React.useState({});
  const [editor,setEditor]=React.useState(null);

  React.useEffect(()=>{
    const next={};
    rows.forEach(r=>{
      const code=String(r?.code||'').trim();
      if(code)next[code]=String(r?.detail||'');
    });
    setDetails(next);
  },[rows]);

  async function refresh(){
    setBusy(true);setMsg('');
    try{
      const r=await window.masterAction('actualizarPanelConapeAhora');
      setMsg(r.mensaje||'CONAPE actualizado.');
      await onRefresh?.();
    }catch(e){setMsg(e.message||String(e));}
    finally{setBusy(false);}
  }
  async function openDetail(row,current){
    const code=String(row?.code||'').trim();
    if(!code)return;
    setEditor({row,value:String(current||''),loading:true,saving:false,error:''});
    try{
      const data=await postDetalle('getComentarioAdminEstudiante',{codigo:code});
      setEditor(x=>x?{...x,value:String(data.comentario_admin||''),loading:false,error:''}:x);
    }catch(e){
      setEditor(x=>x?{...x,loading:false,error:e.message||String(e)}:x);
    }
  }
  async function saveDetail(){
    if(!editor||editor.loading||editor.saving)return;
    const code=String(editor.row?.code||'').trim();
    if(!code)return;
    setEditor(x=>({...x,saving:true,error:''}));
    try{
      const data=await postDetalle('guardarComentarioAdminEstudiante',{
        codigo:code,
        comentario:String(editor.value||'').trim()
      });
      const saved=String(data.comentario_admin||'');
      setDetails(prev=>({...prev,[code]:saved}));
      setMsg(saved?`Detalle de ${editor.row?.name||code} guardado.`:`Detalle de ${editor.row?.name||code} eliminado.`);
      setEditor(null);
    }catch(e){
      setEditor(x=>x?{...x,saving:false,error:e.message||String(e)}:x);
    }
  }

  return <section className="master-card master-conape-month-card">
    <header>
      <div>
        <span>Seguimiento inmediato</span>
        <h3>Movimientos CONAPE · Todos los periodos</h3>
        <p>Todos los movimientos nuevos, desembolsos adelantados y detalle de seguimiento · última lectura {fmt(m.lastSync,true)}</p>
      </div>
      <div className="master-conape-month-actions">
        <span className={`master-live-chip ${(m.monitor||[]).some(x=>x.handler==='sincronizarCONAPE')?'on':'off'}`}>Monitoreo CONAPE</span>
        <button onClick={refresh} disabled={busy}>{busy?'Consultando…':'↻ Actualizar CONAPE ahora'}</button>
      </div>
    </header>
    <div className="master-conape-month-kpis" style={{gridTemplateColumns:'repeat(5,minmax(130px,1fr))'}}>
      <div><b>{s.total||0}</b><span>movimientos nuevos</span></div>
      <div><b>{s.advanced||0}</b><span>adelantados</span></div>
      <div><b>{s.linked||0}</b><span>vinculados</span></div>
      <div><b>{s.unlinked||0}</b><span>por vincular</span></div>
      <div><b>{s.newDisbursement||0}</b><span>desembolsos</span></div>
    </div>
    {msg&&<div className="master-conape-month-msg">{msg}</div>}
    <div className="master-conape-month-table-wrap">
      <table className="master-conape-month-table" style={{tableLayout:'fixed',minWidth:1180}}>
        <thead><tr><th style={{width:'25%'}}>Estudiante</th><th>Movimiento</th><th>Desembolso</th><th>Periodo</th><th>Campus</th><th>Detectado</th><th>Contacto</th></tr></thead>
        <tbody>{rows.map((r,i)=>{
          const p=period(r);
          const wa=phone(r.phone);
          const code=String(r?.code||'').trim();
          const detail=code&&Object.prototype.hasOwnProperty.call(details,code)?details[code]:String(r.detail||'');
          const txt=`Hola ${String(r.name||'').split(' ')[0]}, CONAPE reportó el desembolso #${r.disbursement||''} del periodo ${p}. Te contactamos desde Academia Norteamericana para dar seguimiento.`;
          return <tr key={r.id||i} className={!r.linked||r.advance?'has-alert':''}>
            <td style={{whiteSpace:'normal',verticalAlign:'top'}}>
              <strong>{r.name||'Sin nombre'}</strong>
              <small>{r.cedula}{r.code?` · ${r.code}`:''}</small>
              <DetailButton row={r} value={detail} onEdit={openDetail}/>
            </td>
            <td style={{verticalAlign:'top'}}><span className="master-conape-movement-badge" style={r.advance?{background:'#FFF3CD',color:'#8A5A00'}:null}>{type(r)}</span>{r.advance&&<small style={{color:'#8A5A00',fontWeight:800}}>Periodo posterior</small>}</td>
            <td style={{verticalAlign:'top'}}><b>#{r.disbursement||'—'}</b><small>{fmt(r.eventDate,false)}</small></td>
            <td style={{verticalAlign:'top',fontWeight:800}}>{p}</td>
            <td style={{verticalAlign:'top'}}>{r.linked?<span className="master-link-status linked">Vinculado</span>:<span className="master-link-status unlinked">Sin vínculo</span>}<small>{r.group||'Sin grupo'}</small></td>
            <td style={{verticalAlign:'top'}}>{fmt(r.detectedAt,true)}</td>
            <td style={{verticalAlign:'top'}}>{wa?<a className="master-wa-action" href={`https://wa.me/${wa}?text=${encodeURIComponent(txt)}`} target="_blank" rel="noreferrer">WA Dar seguimiento</a>:<span className="master-no-phone">Sin teléfono</span>}</td>
          </tr>;
        })}</tbody>
      </table>
      {!rows.length&&<div style={{padding:24,textAlign:'center'}}>Sin movimientos nuevos.</div>}
    </div>
    <DetailModal editor={editor} setEditor={setEditor} onSave={saveDetail}/>
  </section>;
}
function apply(){
  if(typeof window.MasterConapeMovementsTable!=='function')return;
  window.MasterConapeMovementsTable=MasterConapeMovementsTableCS21A26;
}
window.addEventListener('an:lazy-module-loaded',e=>{
  if(String(e?.detail?.src||'').includes('admin_master_dashboard.jsx'))apply();
});
setTimeout(apply,0);
})();