/* global React, PageHeader, AdminEstudianteResumenIndividual */
// F98.4-Z6-AN · Consulta individual operativa
// - Sustituye el antiguo Buscador general vacío.
// - Busca en el backend con debounce y respuesta compacta.
// - El expediente completo se carga únicamente al seleccionar una persona.

const SCRIPT_URL_B = window.APPS_SCRIPT_URL;
const CI_CACHE_AN = new Map();

function ciNormAN(v) {
  return String(v == null ? '' : v)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim().toLowerCase();
}

async function ciFetchJsonAN(fn, payload = {}, timeoutMs = 20000) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const body = JSON.stringify({ fn, token, ...payload });
  const urls = [
    `${SCRIPT_URL_B}?fn=${encodeURIComponent(fn)}`,
    SCRIPT_URL_B,
  ];
  let lastError = null;

  for (let attempt = 0; attempt < urls.length; attempt += 1) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
      const res = await fetch(urls[attempt], {
        method: 'POST',
        headers: { 'Content-Type':'text/plain;charset=utf-8' },
        body,
        cache: 'no-store',
        redirect: 'follow',
        signal: controller ? controller.signal : undefined,
      });
      const raw = await res.text();
      const text = String(raw || '').trim();
      if (!text) throw new Error(`El backend no devolvió contenido en ${fn}.`);
      if (/^<!doctype\s+html|^<html/i.test(text)) {
        throw new Error('El backend devolvió una página HTML en lugar de datos. Revisá que la versión vigente de Apps Script esté publicada con acceso para los usuarios del Campus.');
      }
      let data;
      try { data = JSON.parse(text); }
      catch (_) { throw new Error(`Respuesta no válida del backend en ${fn}.`); }
      if (!res.ok) throw new Error(data?.mensaje || data?.error || `HTTP ${res.status}`);
      return data;
    } catch (error) {
      lastError = error?.name === 'AbortError'
        ? new Error(`La consulta tardó más de ${Math.round(timeoutMs / 1000)} segundos.`)
        : error;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  throw lastError || new Error('No se pudo conectar con el backend.');
}

function CIResultCardAN({ estudiante, onSelect }) {
  const iniciales = String(estudiante?.nombre || estudiante?.display || '?')
    .split(/\s+/).filter(Boolean).slice(0,2).map(x => x.charAt(0)).join('').toUpperCase();
  return (
    <button type="button" onClick={() => onSelect(estudiante)} style={{
      width:'100%', border:'1px solid var(--line,#e2ddd6)', borderRadius:12,
      background:'white', padding:'12px 14px', cursor:'pointer', textAlign:'left',
      display:'grid', gridTemplateColumns:'42px minmax(0,1fr) auto', gap:12,
      alignItems:'center', fontFamily:'inherit', boxShadow:'0 3px 10px rgba(20,33,61,.03)',
    }}>
      <span style={{
        width:42,height:42,borderRadius:'50%',display:'inline-flex',alignItems:'center',justifyContent:'center',
        background:'var(--an-navy,#14213D)',color:'white',fontSize:13,fontWeight:900,
      }}>{iniciales}</span>
      <span style={{ minWidth:0 }}>
        <span style={{ display:'block',fontSize:13.5,fontWeight:900,color:'var(--an-navy,#14213D)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
          {estudiante?.nombre || estudiante?.display || 'Sin nombre'}
        </span>
        <span style={{ display:'block',marginTop:3,fontSize:10.5,color:'var(--ink-3,#81776f)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>
          Estudiante {estudiante?.codigo || estudiante?.rec_m || '—'} · Cédula {estudiante?.cedula || '—'} · {estudiante?.grupo || 'Sin grupo'}
        </span>
      </span>
      <span style={{ display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end' }}>
        {estudiante?.convenio && <span style={{ padding:'4px 8px',borderRadius:999,background:'#EEF4FF',border:'1px solid #C9D9F1',color:'#244A7C',fontSize:9.5,fontWeight:900 }}>{estudiante.convenio}</span>}
        <span style={{ color:'var(--ink-3,#81776f)',fontSize:18 }}>›</span>
      </span>
    </button>
  );
}

function BuscadorEstudiantes({ onNavigate }) {
  const [query,setQuery] = React.useState('');
  const [resultados,setResultados] = React.useState([]);
  const [loading,setLoading] = React.useState(false);
  const [error,setError] = React.useState('');
  const [seleccionado,setSeleccionado] = React.useState(null);
  const seqRef = React.useRef(0);

  React.useEffect(() => {
    if (seleccionado) return undefined;
    const q = ciNormAN(query);
    if (q.length < 2) {
      setResultados([]); setLoading(false); setError('');
      return undefined;
    }
    const seq = ++seqRef.current;
    const timer = setTimeout(() => {
      const cached = CI_CACHE_AN.get(q);
      if (cached && Date.now() - cached.at < 120000) {
        setResultados(cached.items); setLoading(false); setError('');
        return;
      }
      setLoading(true); setError('');
      ciFetchJsonAN('buscarEstudiantesRapido', { query:q, limit:20 })
        .then(data => {
          if (seq !== seqRef.current) return;
          if (!data?.ok) throw new Error(data?.mensaje || data?.error || 'No se pudo completar la búsqueda.');
          const items = Array.isArray(data.estudiantes) ? data.estudiantes : [];
          CI_CACHE_AN.set(q,{ at:Date.now(), items });
          setResultados(items);
        })
        .catch(e => { if (seq === seqRef.current) { setResultados([]); setError(e?.message || String(e)); } })
        .finally(() => { if (seq === seqRef.current) setLoading(false); });
    }, 320);
    return () => clearTimeout(timer);
  }, [query,seleccionado]);

  const limpiar = React.useCallback(() => {
    seqRef.current += 1;
    setSeleccionado(null); setQuery(''); setResultados([]); setLoading(false); setError('');
  },[]);

  if (seleccionado) {
    return (
      <section data-screen-label="Consulta individual" style={{ padding:24 }}>
        <div style={{ display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',marginBottom:12,flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:10,fontWeight:900,letterSpacing:'.16em',textTransform:'uppercase',color:'var(--ink-3,#81776f)' }}>Consulta individual</div>
            <div style={{ fontFamily:'var(--f-serif,serif)',fontSize:28,fontWeight:600,color:'var(--an-navy,#14213D)' }}>{seleccionado.nombre || seleccionado.display}</div>
          </div>
          <button type="button" onClick={limpiar} style={{ padding:'9px 13px',borderRadius:9,border:'1px solid var(--line,#ddd)',background:'white',fontWeight:900,cursor:'pointer' }}>Nueva consulta</button>
        </div>
        <AdminEstudianteResumenIndividual estudianteBase={seleccionado} onClose={limpiar} onNavigate={onNavigate} />
      </section>
    );
  }

  const qNorm = ciNormAN(query);
  return (
    <section data-screen-label="Consulta individual" style={{ padding:24 }}>
      <PageHeader
        kicker="Expediente individual"
        title={<>Consulta <em>individual</em></>}
        sub="Buscá por nombre, código, cédula, correo, teléfono o grupo. El expediente completo se abre únicamente al seleccionar a la persona."
      />

      <div style={{
        marginTop:16,background:'white',border:'1px solid var(--line,#e2ddd6)',borderRadius:15,
        boxShadow:'0 12px 30px rgba(20,33,61,.07)',padding:16,
      }}>
        <div style={{ display:'grid',gridTemplateColumns:'minmax(260px,1fr) auto',gap:10,alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',fontSize:15,color:'var(--ink-3,#81776f)' }}>⌕</span>
            <input
              value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder="Escribí al menos 2 caracteres…"
              autoFocus
              style={{ width:'100%',padding:'12px 12px 12px 40px',borderRadius:10,border:'1px solid var(--line,#ddd)',background:'#fff',fontSize:14,outline:'none',fontFamily:'inherit' }}
            />
          </div>
          {query && <button type="button" onClick={()=>setQuery('')} style={{ padding:'11px 14px',borderRadius:10,border:'1px solid var(--line,#ddd)',background:'white',fontWeight:900,cursor:'pointer' }}>Limpiar</button>}
        </div>

        <div style={{ marginTop:7,fontSize:10.5,color:'var(--ink-3,#81776f)' }}>
          La búsqueda no carga todo el padrón ni el calendario; devuelve como máximo 20 coincidencias.
        </div>

        <div style={{ marginTop:14 }}>
          {qNorm.length < 2 ? (
            <div style={{ padding:'44px 18px',textAlign:'center',color:'var(--ink-3,#81776f)' }}>
              <div style={{ fontSize:34,marginBottom:8 }}>⌕</div>
              <div style={{ fontSize:16,fontWeight:900,color:'var(--an-navy,#14213D)' }}>Buscá un estudiante</div>
              <div style={{ marginTop:4,fontSize:12 }}>Podés usar nombre, cédula, código, teléfono, correo o grupo.</div>
            </div>
          ) : loading ? (
            <div style={{ padding:'32px 18px',textAlign:'center',color:'var(--ink-3,#81776f)' }}>Consultando el padrón…</div>
          ) : error ? (
            <div style={{ padding:'14px 16px',borderRadius:10,background:'#FFEBEE',border:'1px solid #F4B7B7',color:'#B42318',fontSize:12,fontWeight:800,lineHeight:1.45 }}>
              {error}
            </div>
          ) : resultados.length ? (
            <div style={{ display:'grid',gap:8 }}>
              <div style={{ fontSize:10.5,fontWeight:800,color:'var(--ink-3,#81776f)' }}>{resultados.length} coincidencia{resultados.length===1?'':'s'}</div>
              {resultados.map((est,i)=><CIResultCardAN key={`${est.codigo||est.rec_m||'x'}-${i}`} estudiante={est} onSelect={setSeleccionado} />)}
            </div>
          ) : (
            <div style={{ padding:'32px 18px',textAlign:'center',color:'var(--ink-3,#81776f)' }}>
              No encontré estudiantes con ese dato.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

Object.assign(window,{ BuscadorEstudiantes });
