/* global React, PageHeader */
// F98.4-Z6-CS21A114 · Importador BCR con previsualización contra TODA BDBANCARIO.
const BANK114_URL = window.APPS_SCRIPT_URL;

function bank114SafeUserError(raw, fallback, context = '') {
  const msg = String(raw == null ? '' : raw).replace(/\s+/g,' ').trim();
  if (msg) console.warn('[ImportadorBCR] Detalle técnico oculto al operador.', { context, error:msg });
  if (/sesión administrativa no está disponible/i.test(msg)) return 'Tu sesión administrativa no está disponible. Ingresá nuevamente.';
  if (/no se encontraron movimientos válidos/i.test(msg)) return 'No se encontraron movimientos válidos en el archivo BCR.';
  if (/la base cambió durante la revisión/i.test(msg)) return 'Los datos cambiaron durante la revisión. Se recalcularon los estados; revisá los conflictos.';
  return fallback;
}

async function bank114Post(fn, payload = {}, timeoutMs = 60000) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  if (!token) throw new Error('Tu sesión administrativa no está disponible. Ingresá nuevamente.');
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(`${BANK114_URL}?fn=${encodeURIComponent(fn)}`, {
      method: 'POST', headers: { 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn, token, ...payload }), cache:'no-store',
      signal: controller ? controller.signal : undefined,
    });
    const text = String(await res.text() || '').trim();
    if (!text || /^<!doctype\s+html|^<html/i.test(text)) throw new Error('Apps Script no devolvió una respuesta válida.');
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data?.mensaje || data?.error || `HTTP ${res.status}`);
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error(`El backend tardó demasiado en responder (${fn}).`);
    throw error;
  } finally { if (timer) clearTimeout(timer); }
}

function bank114Parse(htmlContent) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const movimientos = [];
  let header = false;
  const money = s => {
    if (!s || s === '-' || !String(s).trim()) return 0;
    const raw = String(s).trim();
    const normalized = raw.includes(',') ? raw.replace(/\./g,'').replace(',','.') : raw.replace(/[^0-9.-]/g,'');
    return Math.round((Number(normalized) || 0) * 100) / 100;
  };
  doc.querySelectorAll('tr').forEach(row => {
    const c = Array.from(row.querySelectorAll('td,th')).map(x => x.textContent.trim());
    if (c.length < 8) return;
    if (c[0] === 'Fecha Contable' || c[3] === 'Número Documento') { header = true; return; }
    if (!header || !/^\d{2}\/\d{2}\/\d{4}$/.test(c[0]) || !c[3]) return;
    const debito = money(c[6]), credito = money(c[7]);
    movimientos.push({ fechaContable:c[0], fechaRegistro:c[1], hora:c[2], doc:String(c[3]).trim(), descripcion:c[4], oficina:c[5], debito:debito>0?debito:null, credito:credito>0?credito:null });
  });
  return movimientos;
}

const bank114CRC = n => n != null ? '₡' + Number(n).toLocaleString('es-CR') : '—';
const bank114Key = m => `${m.indice}|${m.doc}`;
const bank114New = m => m.estado === 'NUEVO';
const bank114Existing = m => ['YA_EXISTE','DUPLICADO_ARCHIVO'].includes(m.estado);
const bank114Conflict = m => ['CONFLICTO','CONFLICTO_ARCHIVO'].includes(m.estado);

function Bank114Stepper({ paso }) {
  return <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:24}}>{['Subir archivo','Revisar movimientos','Confirmar importación'].map((label,i)=><div key={label} style={{padding:'10px 12px',borderRadius:12,border:'1px solid var(--line)',background:paso===i+1?'var(--an-navy)':'var(--surface)',color:paso===i+1?'#fff':'var(--ink-3)',fontSize:11,fontWeight:800,textAlign:'center'}}>{i+1}. {label}</div>)}</div>;
}

function Bank114Badge({ movimiento }) {
  const map = {
    NUEVO:['NUEVO','#2E7D32','#EAF5EC'], YA_EXISTE:['YA EXISTE','#667085','#EEF0F2'],
    DUPLICADO_ARCHIVO:['REPETIDO EN ARCHIVO','#795548','#F4ECE8'], CONFLICTO:['REVISAR','#B54708','#FFF2E5'],
    CONFLICTO_ARCHIVO:['CONFLICTO EN ARCHIVO','#B42318','#FEECEB'], DEBITO:['DÉBITO','#C00000','#FDECEC'],
    INVALIDO:['INVÁLIDO','#C00000','#FDECEC']
  };
  const [label,color,bg] = map[movimiento.estado] || ['SIN ANALIZAR','#667085','#EEF0F2'];
  return <span style={{display:'inline-flex',padding:'4px 8px',borderRadius:999,background:bg,color,fontSize:9.5,fontWeight:800,whiteSpace:'nowrap'}}>{label}</span>;
}

function ImportadorBancarioCS21A114() {
  const [paso,setPaso] = React.useState(1);
  const [archivo,setArchivo] = React.useState(null);
  const [movimientos,setMovimientos] = React.useState([]);
  const [seleccionados,setSeleccionados] = React.useState(new Set());
  const [cargando,setCargando] = React.useState(false);
  const [error,setError] = React.useState('');
  const [resultado,setResultado] = React.useState(null);
  const [drag,setDrag] = React.useState(false);

  const nuevos = movimientos.filter(bank114New);
  const existentes = movimientos.filter(bank114Existing);
  const conflictos = movimientos.filter(bank114Conflict);
  const debitos = movimientos.filter(m => m.estado === 'DEBITO');

  const analizar = async (movs) => {
    setCargando(true); setError('');
    try {
      const data = await bank114Post('previsualizarExtractoBanco', { filas:movs });
      if (!data?.ok || !Array.isArray(data.movimientos)) throw new Error(data?.mensaje || data?.error || 'No se pudo validar el extracto.');
      const merged = movs.map((m,i) => ({ ...m, indice:i, ...(data.movimientos.find(x => Number(x.indice) === i) || { estado:'INVALIDO' }) }));
      setMovimientos(merged);
      setSeleccionados(new Set(merged.filter(bank114New).map(bank114Key)));
      setPaso(2);
    } catch (e) {
      setError(bank114SafeUserError(e?.message||e, 'No pudimos validar el extracto bancario. Intentá nuevamente.', 'previsualizar_extracto'));
    } finally { setCargando(false); }
  };

  const procesar = file => {
    if (!file) return;
    setArchivo(file); setError(''); setResultado(null);
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const movs = bank114Parse(e.target.result);
        if (!movs.length) throw new Error('No se encontraron movimientos válidos en el archivo BCR.');
        analizar(movs);
      } catch (err) { setError(bank114SafeUserError(err?.message||err, 'No pudimos leer el archivo seleccionado. Revisá que sea un extracto BCR válido.', 'leer_archivo')); }
    };
    reader.onerror = () => setError('No fue posible leer el archivo.');
    reader.readAsText(file,'utf-8');
  };

  const toggle = m => setSeleccionados(prev => { const next = new Set(prev), key = bank114Key(m); next.has(key)?next.delete(key):next.add(key); return next; });
  const selectAll = () => setSeleccionados(new Set(nuevos.map(bank114Key)));
  const clearAll = () => setSeleccionados(new Set());

  const confirmar = async () => {
    const filas = movimientos.filter(m => bank114New(m) && seleccionados.has(bank114Key(m))).map(m => ({ fechaContable:m.fechaContable,fechaRegistro:m.fechaRegistro,hora:m.hora,doc:m.doc,descripcion:m.descripcion,oficina:m.oficina,debito:m.debito||0,credito:m.credito||0 }));
    if (!filas.length) return;
    setCargando(true); setError('');
    try {
      const data = await bank114Post('importarExtracto',{ filas });
      if (!data?.ok) {
        if (data?.error === 'conflictos_bancarios') { await analizar(movimientos.map(({indice,estado,diferencias,existente,...m}) => m)); throw new Error('La base cambió durante la revisión. Se recalcularon los estados; revisá los conflictos.'); }
        throw new Error(data?.mensaje || data?.error || 'No fue posible importar el extracto.');
      }
      const docs = new Set(data.agregados_docs || []);
      setResultado({ ...data, filas:movimientos.filter(m => docs.has(m.doc)) });
      setPaso(3);
    } catch (e) { setError(bank114SafeUserError(e?.message||e, 'No pudimos completar la importación. Revisá los movimientos e intentá nuevamente.', 'importar_extracto')); }
    finally { setCargando(false); }
  };

  const reiniciar = () => { setPaso(1);setArchivo(null);setMovimientos([]);setSeleccionados(new Set());setResultado(null);setError(''); };

  return <div>
    <PageHeader kicker="Conciliación bancaria" title={<>Importar <em>extracto BCR</em></>} sub="Compara cada documento contra toda BDBANCARIO antes de permitir la importación" />
    <Bank114Stepper paso={paso}/>
    {error&&<div style={{padding:'12px 16px',marginBottom:16,border:'1px solid #C00000',borderRadius:12,background:'#FDECEC',color:'#A40000',fontSize:13}}>⚠️ {error}</div>}

    {paso===1&&<div><div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);procesar(e.dataTransfer.files[0])}} onClick={()=>document.getElementById('file-input-banco-114').click()} style={{padding:'52px 28px',border:`2px dashed ${drag?'var(--an-navy)':'var(--line-2)'}`,borderRadius:20,textAlign:'center',background:drag?'#F2F6FB':'var(--surface)',cursor:'pointer'}}><div style={{fontSize:48}}>📄</div><div style={{fontFamily:'var(--f-serif)',fontSize:25,color:'var(--an-navy-ink)',marginTop:8}}>{cargando?'Validando contra BDBANCARIO…':archivo?.name||'Seleccioná el extracto del BCR'}</div><div style={{fontSize:12,color:'var(--ink-3)',marginTop:6}}>XLS/HTML exportado desde Banca en Línea</div><input id="file-input-banco-114" type="file" accept=".xls,.xlsx,.html,.htm" hidden onChange={e=>procesar(e.target.files[0])}/></div></div>}

    {paso===2&&<div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:10,marginBottom:16}}>{[['Movimientos',movimientos.length],['Nuevos',nuevos.length],['Ya existen',existentes.length],['Revisar',conflictos.length],['Débitos',debitos.length]].map(([l,n])=><div key={l} style={{padding:'12px 14px',border:'1px solid var(--line)',borderRadius:13,background:'var(--surface)'}}><div style={{fontSize:9.5,fontWeight:800,letterSpacing:'.1em',color:'var(--ink-3)',textTransform:'uppercase'}}>{l}</div><div style={{fontFamily:'var(--f-serif)',fontSize:27,color:l==='Nuevos'?'#2E7D32':l==='Revisar'&&n?'#B54708':'var(--an-navy)',marginTop:2}}>{n}</div></div>)}</div>
      {conflictos.length>0&&<div style={{padding:'12px 14px',marginBottom:12,border:'1px solid #E6A75C',borderRadius:12,background:'#FFF7ED',color:'#8A4B08',fontSize:12}}><strong>{conflictos.length} documento{conflictos.length!==1?'s':''} requiere{conflictos.length===1?'':'n'} revisión.</strong> Ya existe el número, pero cambia fecha, monto o descripción. No se puede importar automáticamente.</div>}
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12,flexWrap:'wrap'}}><button className="btn btn-primary" onClick={selectAll}>Seleccionar nuevos ({nuevos.length})</button><button className="btn btn-ghost" onClick={clearAll}>Deseleccionar</button><span style={{marginLeft:'auto',fontSize:12,color:'var(--ink-3)'}}>{seleccionados.size} seleccionados</span></div>
      <div className="card" style={{padding:0,overflow:'auto',marginBottom:16}}><table className="table-soft" style={{fontSize:11.5,minWidth:860}}><thead><tr><th></th><th>Fecha</th><th>Documento</th><th>Descripción</th><th style={{textAlign:'right'}}>Crédito</th><th style={{textAlign:'right'}}>Débito</th><th>Estado</th></tr></thead><tbody>{movimientos.map(m=>{const selected=seleccionados.has(bank114Key(m));return <tr key={bank114Key(m)} style={{background:bank114New(m)&&selected?'#F3FAF5':bank114Conflict(m)?'#FFF9F0':bank114Existing(m)?'var(--surface-2)':'var(--surface)',opacity:m.estado==='DEBITO'?0.68:1}}><td>{bank114New(m)?<input type="checkbox" checked={selected} onChange={()=>toggle(m)}/>:<span>—</span>}</td><td style={{fontFamily:'var(--f-mono)'}}>{m.fechaContable}</td><td style={{fontFamily:'var(--f-mono)'}}>{m.doc}</td><td><div style={{maxWidth:310,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.descripcion}</div>{bank114Conflict(m)&&<div style={{fontSize:9.5,color:'#B54708',marginTop:3}}>Diferencias: {(m.diferencias||[]).join(', ')||'datos bancarios'}</div>}</td><td style={{textAlign:'right',fontFamily:'var(--f-mono)',color:'#2E7D32',fontWeight:700}}>{m.credito?bank114CRC(m.credito):''}</td><td style={{textAlign:'right',fontFamily:'var(--f-mono)',color:'#C00000'}}>{m.debito?bank114CRC(m.debito):''}</td><td><Bank114Badge movimiento={m}/></td></tr>})}</tbody></table></div>
      <div style={{display:'flex',justifyContent:'space-between',gap:10}}><button className="btn btn-ghost" onClick={reiniciar}>← Cambiar archivo</button><button className="btn btn-primary" disabled={!seleccionados.size||cargando||conflictos.some(m=>seleccionados.has(bank114Key(m)))} onClick={confirmar} style={{background:'var(--an-granate)',borderColor:'var(--an-granate)',opacity:seleccionados.size?1:.45}}>{cargando?'Verificando nuevamente…':`Importar ${seleccionados.size} registro${seleccionados.size===1?'':'s'} →`}</button></div>
    </div>}

    {paso===3&&resultado&&<div><div style={{padding:'32px 26px',borderRadius:20,background:'linear-gradient(135deg,var(--an-navy),#1A3E75)',color:'#fff',textAlign:'center',marginBottom:16}}><div style={{fontSize:50}}>✅</div><div style={{fontFamily:'var(--f-serif)',fontSize:29,marginTop:6}}>Importación verificada</div><div style={{fontSize:14,opacity:.86,marginTop:5}}>{resultado.agregados} movimiento{resultado.agregados===1?'':'s'} agregado{resultado.agregados===1?'':'s'} realmente</div>{resultado.duplicados>0&&<div style={{fontSize:11,opacity:.7,marginTop:4}}>{resultado.duplicados} duplicado{resultado.duplicados===1?'':'s'} omitido{resultado.duplicados===1?'':'s'} por el servidor</div>}</div><div className="card" style={{padding:16,marginBottom:16}}>{resultado.filas.length?resultado.filas.map(m=><div key={bank114Key(m)} style={{display:'grid',gridTemplateColumns:'110px 130px 1fr auto',gap:12,padding:'10px 0',borderBottom:'1px solid var(--line)',fontSize:11}}><span>{m.fechaContable}</span><span style={{fontFamily:'var(--f-mono)'}}>{m.doc}</span><span>{m.descripcion}</span><strong style={{color:'#2E7D32'}}>{bank114CRC(m.credito)}</strong></div>):<div>No se agregaron movimientos nuevos.</div>}</div><button className="btn btn-primary" style={{width:'100%'}} onClick={reiniciar}>Importar otro extracto</button></div>}
  </div>;
}

function bank114Install() {
  if (typeof window.ImportadorBancarioCS21A114 !== 'function') return;
  window.ImportadorBancario = window.ImportadorBancarioCS21A114;
  window.CS21A114_IMPORTADOR_BANCO = 'F98.4-Z6-CS21A114';
}
window.ImportadorBancarioCS21A114 = ImportadorBancarioCS21A114;
window.addEventListener('an:lazy-module-loaded',e=>{if(String(e?.detail?.src||'').includes('importador_banco.jsx')) bank114Install();});
if (typeof window.ImportadorBancario === 'function') bank114Install();
