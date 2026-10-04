/* global React, window */
/* ============================================================================
   CONAPE Prospectacion V1
   - Lectura para ventas/admin/superadmin.
   - Importacion CSV solo visible para admin/superadmin.
   - Preview obligatorio antes de aplicar.
   - No automatiza Reclutar ni escribe en el portal externo de CONAPE.
   ============================================================================ */
const { useMemo: cpUseMemo, useRef: cpUseRef, useState: cpUseState } = React;

async function cpv1Post(fn, payload = {}) {
  const base = window.SCRIPT_URL_V || window.APPS_SCRIPT_URL || '';
  if (!base) throw new Error('conape_endpoint_missing');
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const res = await fetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token, ...payload }),
  });
  const raw = await res.text();
  const txt = String(raw || '').trim();
  if (txt.charAt(0) === '<') throw new Error('conape_html_response');
  const data = txt ? JSON.parse(txt) : { ok:false, error:'respuesta_vacia' };
  return data;
}

function cpv1BytesToBase64(buffer) {
  const bytes = new Uint8Array(buffer || new ArrayBuffer(0));
  const chunk = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return btoa(binary);
}

async function cpv1FilePayload(file) {
  if (!file) throw new Error('csv_requerido');
  if (!/\.csv$/i.test(file.name || '')) throw new Error('Seleccione un archivo CSV.');
  if (file.size > 2 * 1024 * 1024) throw new Error('El CSV supera el limite de 2 MB.');
  const buffer = await file.arrayBuffer();
  return {
    file_name: file.name,
    mime_type: file.type || 'text/csv',
    csv_base64: cpv1BytesToBase64(buffer),
  };
}

async function getConapeProspectacionVentas(asesor) {
  return cpv1Post('getConapeProspectacionVentas', { asesor: asesor || '' });
}

async function previsualizarConapeProspectacionCsv(file) {
  return cpv1Post('previsualizarConapeProspectacionCsv', await cpv1FilePayload(file));
}

async function importarConapeProspectacionCsv(file) {
  return cpv1Post('importarConapeProspectacionCsv', await cpv1FilePayload(file));
}

const CPV1_COLORS = Object.freeze({
  verde:    { bg:'#EAF7EE', border:'#A7DDB7', text:'#176B36', dot:'#22A35A' },
  amarillo: { bg:'#FFF8E5', border:'#F0D17A', text:'#855C00', dot:'#D89A00' },
  rojo:     { bg:'#FDEDED', border:'#F1B4B4', text:'#9C2626', dot:'#D64545' },
});

function cpv1EventValue(event) {
  const before = String(event?.valor_antes || '').trim();
  const after = String(event?.valor_despues || '').trim();
  if (!before && after) return after;
  if (before && !after) return `${before} → sin dato`;
  if (before && after && before !== after) return `${before} → ${after}`;
  return after || before || '';
}

function Cpv1Kpi({ label, value, color, help }) {
  const c = CPV1_COLORS[color] || CPV1_COLORS.verde;
  return (
    <div style={{
      minWidth:132, flex:'1 1 132px', padding:'12px 14px', borderRadius:12,
      background:c.bg, border:`1px solid ${c.border}`,
    }}>
      <div style={{fontSize:11,fontWeight:800,letterSpacing:'.04em',textTransform:'uppercase',color:c.text}}>{label}</div>
      <div style={{fontSize:25,fontWeight:800,lineHeight:1.15,color:c.text,marginTop:3}}>{Number(value || 0)}</div>
      {help ? <div style={{fontSize:11,color:c.text,opacity:.82,marginTop:3}}>{help}</div> : null}
    </div>
  );
}

function Cpv1EventRow({ event }) {
  const c = CPV1_COLORS[event?.color] || CPV1_COLORS.verde;
  const value = cpv1EventValue(event);
  const days = Number(event?.dias || 0);
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'12px minmax(150px,1.4fr) minmax(120px,1fr) auto',
      gap:10, alignItems:'center', padding:'10px 0', borderTop:'1px solid #E8EDF3',
    }}>
      <span style={{width:10,height:10,borderRadius:'50%',background:c.dot,display:'inline-block'}} />
      <div style={{minWidth:0}}>
        <div style={{fontWeight:750,color:'#18324A',fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {event?.titulo || 'Movimiento CONAPE'}
        </div>
        <div style={{fontSize:11,color:'#64748B',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          {event?.nombre || event?.cedula || ''}
        </div>
      </div>
      <div style={{minWidth:0,fontSize:12,color:'#425466',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}} title={value}>
        {value || 'Cambio registrado'}
      </div>
      <div style={{
        justifySelf:'end',padding:'4px 8px',borderRadius:999,fontSize:11,fontWeight:800,
        color:c.text,background:c.bg,border:`1px solid ${c.border}`,whiteSpace:'nowrap'
      }}>
        {days === 0 ? 'Hoy' : `Hace ${days} d`}
      </div>
    </div>
  );
}

function Cpv1Importador({ onApplied }) {
  const inputRef = cpUseRef(null);
  const [file, setFile] = cpUseState(null);
  const [preview, setPreview] = cpUseState(null);
  const [estado, setEstado] = cpUseState('idle');
  const [mensaje, setMensaje] = cpUseState('');

  const reset = () => {
    setFile(null); setPreview(null); setEstado('idle'); setMensaje('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const seleccionar = async e => {
    const f = e.target.files && e.target.files[0];
    setFile(f || null); setPreview(null); setMensaje('');
    if (!f) return;
    setEstado('preview');
    try {
      const p = await previsualizarConapeProspectacionCsv(f);
      setPreview(p);
      setEstado(p?.ok ? 'ready' : 'error');
      if (!p?.ok) setMensaje(p?.mensaje || p?.error || 'No se pudo validar el CSV.');
    } catch (err) {
      setEstado('error');
      setMensaje(err?.message || 'No se pudo validar el CSV.');
    }
  };

  const aplicar = async () => {
    if (!file || !preview?.ok) return;
    setEstado('applying'); setMensaje('');
    try {
      const r = await importarConapeProspectacionCsv(file);
      if (!r?.ok) throw new Error(r?.mensaje || r?.error || 'No se pudo actualizar CONAPE.');
      setEstado('done');
      setMensaje(r.mensaje || 'CONAPE actualizado.');
      if (typeof onApplied === 'function') onApplied(r);
    } catch (err) {
      setEstado('error');
      setMensaje(err?.message || 'No se pudo actualizar CONAPE.');
    }
  };

  return (
    <div style={{marginTop:12,padding:'12px 14px',border:'1px dashed #AFC2D4',borderRadius:12,background:'#F8FBFE'}}>
      <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{flex:'1 1 260px'}}>
          <div style={{fontWeight:800,fontSize:13,color:'#18324A'}}>Actualizar desde CONAPE</div>
          <div style={{fontSize:11,color:'#64748B',marginTop:2}}>
            En CONAPE: Rows = All → Actions → Download → CSV. Primero se valida; nada se aplica sin confirmacion.
          </div>
        </div>
        <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={seleccionar}
          disabled={estado === 'preview' || estado === 'applying'} style={{maxWidth:270}} />
      </div>

      {preview ? (
        <div style={{marginTop:10,padding:10,borderRadius:10,background:preview.ok?'#FFFFFF':'#FFF4F4',border:`1px solid ${preview.ok?'#D8E3EC':'#EDB6B6'}`}}>
          <div style={{display:'flex',gap:14,flexWrap:'wrap',fontSize:12,color:'#334E68'}}>
            <span><strong>{preview.total || 0}</strong> registros</span>
            <span><strong>{preview.nuevos || 0}</strong> nuevos</span>
            <span><strong>{preview.filas_actualizadas || 0}</strong> filas con cambios</span>
            <span><strong>{preview.eventos_estimados || 0}</strong> alertas nuevas</span>
          </div>
          <div style={{fontSize:11,color:preview.ok?'#52677B':'#9C2626',marginTop:6}}>
            {preview.mensaje || (preview.baseline ? 'Se creara la linea base.' : 'Archivo listo para aplicar.')}
          </div>
          {preview.ok ? (
            <div style={{display:'flex',gap:8,marginTop:9}}>
              <button className="vx-btn vx-btn-navy" onClick={aplicar} disabled={estado === 'applying'}>
                {estado === 'applying' ? 'Aplicando…' : preview.baseline ? 'Crear linea base' : 'Aplicar actualizacion'}
              </button>
              <button className="vx-btn vx-btn-ghost" onClick={reset} disabled={estado === 'applying'}>Cancelar</button>
            </div>
          ) : null}
        </div>
      ) : null}

      {mensaje && estado !== 'ready' ? (
        <div style={{marginTop:8,fontSize:12,fontWeight:650,color:estado === 'done'?'#176B36':'#9C2626'}}>{mensaje}</div>
      ) : null}
    </div>
  );
}

function ConapeProspectacionPanel({ data, esSupervisor, onApplied }) {
  const summary = data?.summary || {};
  const events = Array.isArray(data?.events) ? data.events : [];
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const visible = cpUseMemo(() => events.slice(0, 12), [events]);

  return (
    <div className="vx-sec" style={{marginBottom:20}}>
      <div style={{
        border:'1px solid #D9E3EC',borderRadius:14,background:'#FFFFFF',
        boxShadow:'0 4px 18px rgba(20,55,85,.05)',overflow:'hidden'
      }}>
        <div style={{padding:'15px 16px 13px',borderBottom:'1px solid #E8EDF3',display:'flex',gap:12,alignItems:'flex-start',flexWrap:'wrap'}}>
          <div style={{flex:'1 1 260px'}}>
            <div style={{fontSize:16,fontWeight:850,color:'#17324D'}}>CONAPE · Prospectacion</div>
            <div style={{fontSize:11,color:'#64748B',marginTop:3}}>
              {data?.actualizado_en
                ? `Ultima fotografia: ${data.actualizado_en}`
                : 'Todavia no existe una linea base importada.'}
              {rows.length ? ` · ${rows.length} prospectos de esta vista` : ''}
            </div>
          </div>
          <div style={{fontSize:11,color:'#64748B',textAlign:'right'}}>
            Las alertas no desaparecen al volver a actualizar.
          </div>
        </div>

        <div style={{padding:'14px 16px'}}>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <Cpv1Kpi label="Nuevos" value={summary.nuevos} color="verde" help="0–6 dias" />
            <Cpv1Kpi label="Pendientes" value={summary.pendientes} color="amarillo" help="7–13 dias" />
            <Cpv1Kpi label="Vencidos" value={summary.vencidos} color="rojo" help="14+ dias" />
          </div>

          {visible.length ? (
            <div style={{marginTop:12}}>
              <div style={{fontSize:12,fontWeight:800,color:'#334E68',marginBottom:3}}>Movimientos que requieren seguimiento</div>
              {visible.map(ev => <Cpv1EventRow key={ev.movimiento_id || `${ev.cedula}-${ev.tipo}-${ev.detectado_en}`} event={ev} />)}
              {events.length > visible.length ? (
                <div style={{fontSize:11,color:'#64748B',paddingTop:8}}>Mostrando {visible.length} de {events.length} movimientos.</div>
              ) : null}
            </div>
          ) : (
            <div style={{marginTop:12,padding:'12px 14px',borderRadius:10,background:'#F6F9FC',fontSize:12,color:'#52677B'}}>
              {rows.length ? 'Sin movimientos nuevos desde la linea base.' : 'Importe el primer CSV para crear la linea base de Prospectacion CONAPE.'}
            </div>
          )}

          {esSupervisor ? <Cpv1Importador onApplied={onApplied} /> : null}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  getConapeProspectacionVentas,
  previsualizarConapeProspectacionCsv,
  importarConapeProspectacionCsv,
  ConapeProspectacionPanel,
});
