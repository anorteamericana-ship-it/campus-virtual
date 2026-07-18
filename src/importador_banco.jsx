/* global React, PageHeader */
// F98.4-Z6-CS21A123 · Importador BCR contra TODA BDBANCARIO, sin falsos nuevos.

const BANK123_URL = window.APPS_SCRIPT_URL;

async function bank123Post(fn, payload = {}, timeoutMs = 90000) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  if (!token) throw new Error('Tu sesión administrativa no está disponible. Ingresá nuevamente.');
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const response = await fetch(`${BANK123_URL}?fn=${encodeURIComponent(fn)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn, token, ...payload }),
      cache: 'no-store',
      redirect: 'follow',
      signal: controller ? controller.signal : undefined,
    });
    const raw = String(await response.text() || '').trim();
    if (!raw || /^<!doctype\s+html|^<html/i.test(raw)) throw new Error('Apps Script no devolvió una respuesta válida.');
    let data;
    try { data = JSON.parse(raw); }
    catch (_) { throw new Error(`Respuesta inválida del backend en ${fn}.`); }
    if (!response.ok) throw new Error(data?.mensaje || data?.error || `HTTP ${response.status}`);
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error(`El backend tardó demasiado en responder (${fn}).`);
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function bank123Doc(value) {
  return String(value == null ? '' : value).trim().replace(/\.0+$/, '');
}

function bank123Money(value) {
  if (value == null || value === '' || value === '-') return 0;
  const raw = String(value).trim().replace(/[₡\s]/g, '');
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/[^0-9.-]/g, '');
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0;
}

function bank123Parse(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(htmlContent || ''), 'text/html');
  const movements = [];
  let headerFound = false;
  doc.querySelectorAll('tr').forEach((row) => {
    const cells = Array.from(row.querySelectorAll('td,th')).map((cell) => cell.textContent.trim());
    if (cells.length < 8) return;
    if (cells[0] === 'Fecha Contable' || /Número Documento/i.test(cells[3])) { headerFound = true; return; }
    if (!headerFound || !/^\d{2}\/\d{2}\/\d{4}$/.test(cells[0])) return;
    const documentNumber = bank123Doc(cells[3]);
    if (!documentNumber) return;
    const debit = bank123Money(cells[6]);
    const credit = bank123Money(cells[7]);
    movements.push({ fechaContable:cells[0], fechaRegistro:cells[1], hora:cells[2], doc:documentNumber, descripcion:cells[4], oficina:cells[5], debito:debit>0?debit:null, credito:credit>0?credit:null });
  });
  return movements;
}

const bank123Key = (movement) => `${movement.indice}|${movement.doc}`;
const bank123IsNew = (movement) => movement.estado === 'NUEVO';
const bank123IsExisting = (movement) => ['YA_EXISTE', 'DUPLICADO_ARCHIVO'].includes(movement.estado);
const bank123IsConflict = (movement) => ['CONFLICTO', 'CONFLICTO_ARCHIVO'].includes(movement.estado);
const bank123CRC = (value) => value != null ? `₡${Number(value).toLocaleString('es-CR')}` : '—';

function Bank123Stepper({ step }) {
  return <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:10,marginBottom:24}}>{['Subir archivo','Revisar movimientos','Confirmar importación'].map((label,index)=>{const number=index+1,active=step===number,done=step>number;return <div key={label} style={{minWidth:0,textAlign:'center'}}><div style={{width:38,height:38,margin:'0 auto 6px',display:'grid',placeItems:'center',borderRadius:'50%',background:done?'var(--ok)':active?'var(--an-navy)':'var(--bg-deep)',color:done||active?'#fff':'var(--ink-3)',fontWeight:900,boxShadow:active?'0 0 0 4px color-mix(in srgb,var(--an-navy) 18%,transparent)':'none'}}>{done?'✓':number}</div><div style={{fontSize:11,fontWeight:active?900:600,color:active?'var(--an-navy)':done?'var(--ok)':'var(--ink-3)',whiteSpace:'normal'}}>{label}</div></div>})}</div>;
}

function Bank123Badge({ movement }) {
  const states={NUEVO:['NUEVO','#2E7D32','#EAF5EC'],YA_EXISTE:['YA EXISTE','#667085','#EEF0F2'],DUPLICADO_ARCHIVO:['REPETIDO EN ARCHIVO','#795548','#F4ECE8'],CONFLICTO:['REVISAR','#B54708','#FFF2E5'],CONFLICTO_ARCHIVO:['CONFLICTO EN ARCHIVO','#B42318','#FEECEB'],DEBITO:['DÉBITO','#C00000','#FDECEC'],INVALIDO:['INVÁLIDO','#C00000','#FDECEC']};
  const [label,color,background]=states[movement.estado]||['SIN ANALIZAR','#667085','#EEF0F2'];
  return <span style={{display:'inline-flex',padding:'4px 8px',borderRadius:999,background,color,fontSize:9.5,fontWeight:900,whiteSpace:'nowrap'}}>{label}</span>;
}

function ImportadorBancario() {
  const [step,setStep]=React.useState(1);
  const [file,setFile]=React.useState(null);
  const [movements,setMovements]=React.useState([]);
  const [selected,setSelected]=React.useState(new Set());
  const [loading,setLoading]=React.useState(false);
  const [error,setError]=React.useState('');
  const [result,setResult]=React.useState(null);
  const [dragging,setDragging]=React.useState(false);

  const newMovements=movements.filter(bank123IsNew);
  const existingMovements=movements.filter(bank123IsExisting);
  const conflicts=movements.filter(bank123IsConflict);
  const debits=movements.filter((movement)=>movement.estado==='DEBITO');
  const selectedNewCount=newMovements.filter((movement)=>selected.has(bank123Key(movement))).length;

  const preview=async(rawMovements)=>{
    setLoading(true);setError('');setSelected(new Set());
    try{
      const data=await bank123Post('previsualizarExtractoBanco',{filas:rawMovements});
      if(!data?.ok||!Array.isArray(data.movimientos))throw new Error(data?.mensaje||data?.error||'No se pudo validar el extracto contra BDBANCARIO.');
      const byIndex=new Map(data.movimientos.map((item)=>[Number(item.indice),item]));
      const merged=rawMovements.map((movement,index)=>({...movement,indice:index,...(byIndex.get(index)||{estado:'INVALIDO',diferencias:['sin_respuesta']})}));
      setMovements(merged);
      setSelected(new Set(merged.filter(bank123IsNew).map(bank123Key)));
      setStep(2);
    }catch(caught){
      const message=String(caught?.message||caught||'');
      const missing=/endpoint_no_encontrado|no encontrado|previsualizarExtractoBanco/i.test(message);
      setMovements([]);setSelected(new Set());setStep(1);
      setError(missing?'Falta publicar en Apps Script el backend bancario CS21A123. Por seguridad no se clasificó ningún depósito como nuevo.':message);
    }finally{setLoading(false);}
  };

  const processFile=(incomingFile)=>{
    if(!incomingFile)return;
    setFile(incomingFile);setError('');setResult(null);
    const reader=new FileReader();
    reader.onload=(event)=>{try{const parsed=bank123Parse(event.target.result);if(!parsed.length)throw new Error('No se encontraron movimientos válidos en el archivo BCR.');preview(parsed);}catch(caught){setMovements([]);setSelected(new Set());setStep(1);setError(`Error al leer el archivo: ${caught.message}`);}};
    reader.onerror=()=>setError('No fue posible leer el archivo.');
    reader.readAsText(incomingFile,'utf-8');
  };

  const toggle=(movement)=>{if(!bank123IsNew(movement))return;setSelected((previous)=>{const next=new Set(previous),key=bank123Key(movement);next.has(key)?next.delete(key):next.add(key);return next;});};
  const selectAll=()=>setSelected(new Set(newMovements.map(bank123Key)));
  const clearAll=()=>setSelected(new Set());

  const confirm=async()=>{
    const rows=movements.filter((movement)=>bank123IsNew(movement)&&selected.has(bank123Key(movement))).map((movement)=>({fechaContable:movement.fechaContable,fechaRegistro:movement.fechaRegistro,hora:movement.hora,doc:movement.doc,descripcion:movement.descripcion,oficina:movement.oficina,debito:movement.debito||0,credito:movement.credito||0}));
    if(!rows.length)return;
    setLoading(true);setError('');
    try{
      const data=await bank123Post('importarExtracto',{filas:rows});
      if(!data?.ok){if(data?.error==='conflictos_bancarios'){await preview(movements.map(({indice,estado,diferencias,existente,...movement})=>movement));throw new Error('BDBANCARIO cambió durante la revisión. Se recalcularon los estados; revisá los conflictos.');}throw new Error(data?.mensaje||data?.error||'No fue posible importar el extracto.');}
      const addedDocs=new Set((data.agregados_docs||[]).map(bank123Doc));
      setResult({...data,filas:movements.filter((movement)=>addedDocs.has(bank123Doc(movement.doc)))});
      setStep(3);
    }catch(caught){setError(String(caught?.message||caught));}finally{setLoading(false);}
  };

  const reset=()=>{setStep(1);setFile(null);setMovements([]);setSelected(new Set());setResult(null);setError('');};

  return <div>
    <PageHeader kicker="Conciliación bancaria" title={<>Importar <em>extracto BCR</em></>} sub="Compara cada documento contra toda BDBANCARIO antes de permitir la importación" />
    <Bank123Stepper step={step}/>
    {error&&<div style={{padding:'12px 16px',marginBottom:16,border:'1px solid #C00000',borderRadius:12,background:'#FDECEC',color:'#A40000',fontSize:13}}>⚠️ {error}</div>}

    {step===1&&<div><div onDragOver={(event)=>{event.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={(event)=>{event.preventDefault();setDragging(false);processFile(event.dataTransfer.files[0])}} onClick={()=>!loading&&document.getElementById('file-input-banco-123').click()} style={{padding:'52px 28px',border:`2px dashed ${dragging?'var(--an-navy)':'var(--line-2)'}`,borderRadius:20,textAlign:'center',background:dragging?'#F2F6FB':'var(--surface)',cursor:loading?'wait':'pointer'}}><div style={{fontSize:48}}>📄</div><div style={{fontFamily:'var(--f-serif)',fontSize:25,color:'var(--an-navy-ink)',marginTop:8}}>{loading?'Comparando contra toda BDBANCARIO…':file?.name||'Seleccioná el extracto del BCR'}</div><div style={{fontSize:12,color:'var(--ink-3)',marginTop:6}}>XLS/HTML exportado desde Banca en Línea</div><input id="file-input-banco-123" type="file" accept=".xls,.xlsx,.html,.htm" hidden disabled={loading} onChange={(event)=>processFile(event.target.files[0])}/></div><div style={{marginTop:12,padding:'10px 12px',borderRadius:10,background:'#F5F8FC',color:'var(--ink-3)',fontSize:11.5}}>Un documento existente se detecta aunque su saldo bancario sea ₡0 o ya esté aplicado completamente.</div></div>}

    {step===2&&<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:10,marginBottom:16}}>{[['Movimientos',movements.length],['Nuevos créditos',newMovements.length],['Ya existen',existingMovements.length],['Revisar',conflicts.length],['Débitos',debits.length]].map(([label,count])=><div key={label} style={{padding:'12px 14px',border:'1px solid var(--line)',borderRadius:13,background:'var(--surface)'}}><div style={{fontSize:9.5,fontWeight:900,letterSpacing:'.1em',color:'var(--ink-3)',textTransform:'uppercase'}}>{label}</div><div style={{fontFamily:'var(--f-serif)',fontSize:27,color:label==='Nuevos créditos'?'#2E7D32':label==='Revisar'&&count?'#B54708':'var(--an-navy)',marginTop:2}}>{count}</div></div>)}</div>
      {conflicts.length>0&&<div style={{padding:'12px 14px',marginBottom:12,border:'1px solid #E6A75C',borderRadius:12,background:'#FFF7ED',color:'#8A4B08',fontSize:12}}><strong>{conflicts.length} documento{conflicts.length===1?'':'s'} requiere{conflicts.length===1?'':'n'} revisión.</strong> El número ya existe, pero el monto bancario es diferente. Nunca se importa automáticamente.</div>}
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12,flexWrap:'wrap'}}><button className="btn btn-primary" onClick={selectAll}>Seleccionar todos los nuevos ({newMovements.length})</button><button className="btn btn-ghost" onClick={clearAll}>Deseleccionar todos</button><span style={{marginLeft:'auto',fontSize:12,color:'var(--ink-3)'}}>{selectedNewCount} seleccionados</span></div>
      <div className="card" style={{padding:0,overflow:'auto',marginBottom:16}}><table className="table-soft" style={{fontSize:11.5,minWidth:900}}><thead><tr><th></th><th>Fecha</th><th>N° documento</th><th>Descripción</th><th style={{textAlign:'right'}}>Crédito</th><th style={{textAlign:'right'}}>Débito</th><th>Estado</th></tr></thead><tbody>{movements.map((movement)=>{const checked=selected.has(bank123Key(movement));return <tr key={bank123Key(movement)} style={{background:bank123IsNew(movement)&&checked?'#F3FAF5':bank123IsConflict(movement)?'#FFF9F0':bank123IsExisting(movement)?'var(--surface-2)':'var(--surface)',opacity:movement.estado==='DEBITO'?0.68:1}}><td>{bank123IsNew(movement)?<input type="checkbox" checked={checked} onChange={()=>toggle(movement)}/>:<span>—</span>}</td><td style={{fontFamily:'var(--f-mono)'}}>{movement.fechaContable}</td><td style={{fontFamily:'var(--f-mono)'}}>{movement.doc}</td><td><div style={{maxWidth:340,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{movement.descripcion}</div>{bank123IsConflict(movement)&&<div style={{fontSize:9.5,color:'#B54708',marginTop:3}}>Diferencias: {(movement.diferencias||[]).join(', ')||'monto bancario'}</div>}</td><td style={{textAlign:'right',fontFamily:'var(--f-mono)',color:'#2E7D32',fontWeight:800}}>{movement.credito?bank123CRC(movement.credito):''}</td><td style={{textAlign:'right',fontFamily:'var(--f-mono)',color:'#C00000'}}>{movement.debito?bank123CRC(movement.debito):''}</td><td><Bank123Badge movement={movement}/></td></tr>})}</tbody></table></div>
      <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><button className="btn btn-ghost" onClick={reset}>← Cambiar archivo</button><button className="btn btn-primary" disabled={loading||selectedNewCount===0||conflicts.length>0} onClick={confirm}>{loading?'Revalidando…':`Importar ${selectedNewCount} registro${selectedNewCount===1?'':'s'}`}</button></div>
    </div>}

    {step===3&&<div className="card" style={{padding:24}}><div style={{fontSize:42,marginBottom:8}}>✅</div><h2 style={{margin:'0 0 6px',color:'var(--an-navy-ink)'}}>Importación confirmada</h2><p style={{margin:'0 0 16px',color:'var(--ink-3)'}}>Se agregaron {result?.agregados||0} documentos nuevos. Los existentes no se escribieron nuevamente.</p>{!!result?.filas?.length&&<div style={{maxHeight:320,overflow:'auto',border:'1px solid var(--line)',borderRadius:12}}><table className="table-soft" style={{fontSize:11.5}}><thead><tr><th>Fecha</th><th>Documento</th><th>Descripción</th><th style={{textAlign:'right'}}>Crédito</th></tr></thead><tbody>{result.filas.map((movement)=><tr key={bank123Key(movement)}><td>{movement.fechaContable}</td><td style={{fontFamily:'var(--f-mono)'}}>{movement.doc}</td><td>{movement.descripcion}</td><td style={{textAlign:'right',fontFamily:'var(--f-mono)',color:'#2E7D32'}}>{bank123CRC(movement.credito)}</td></tr>)}</tbody></table></div>}<button className="btn btn-primary" style={{marginTop:16}} onClick={reset}>Importar otro extracto</button></div>}
  </div>;
}

window.ImportadorBancario=ImportadorBancario;
window.CS21A123_IMPORTADOR_BCR='F98.4-Z6-CS21A123';
