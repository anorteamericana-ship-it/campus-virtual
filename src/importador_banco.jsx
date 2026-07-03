/* global React, PageHeader */

// ─────────────────────────────────────────────────────────────────────────
// IMPORTADOR BANCARIO — BCR extracto XLS/HTML
// F98.4-Z6-BH · importación autenticada, idempotente y sin escrituras parciales
// T-02: Parseo real del HTML del BCR + llamada al Apps Script
// ─────────────────────────────────────────────────────────────────────────

// URL del Apps Script: fuente única en data.jsx → window.APPS_SCRIPT_URL
const SCRIPT_URL = window.APPS_SCRIPT_URL;

// ── FIX-PAGOS-ADMIN-001 ───────────────────────────────────────────────────
// Lecturas sensibles (comprobantes BCR) van por POST text/plain: fn + token +
// datos en el BODY JSON, NUNCA en la URL. Esto elimina el Error CORS de las
// llamadas GET con token en query string y deja de exponer el token.
async function postImportador(payload, timeoutMs = 45000) {
  // El Apps Script enruta por e.parameter.fn. El token viaja exclusivamente
  // dentro del body; nunca se expone en la URL.
  const fn = (payload && payload.fn) || '';
  const token = window.getSessionToken ? window.getSessionToken() : '';
  if (!token) throw new Error('Tu sesión administrativa no está disponible. Cerrá sesión e ingresá nuevamente.');

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(`${SCRIPT_URL}?fn=${encodeURIComponent(fn)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token, ...payload }),
      cache: 'no-store',
      redirect: 'follow',
      signal: controller ? controller.signal : undefined,
    });
    const raw = await res.text();
    const text = String(raw || '').trim();
    if (!text) throw new Error(`El backend no devolvió contenido en ${fn}.`);
    if (/^<!doctype\s+html|^<html/i.test(text)) {
      throw new Error('Apps Script devolvió HTML. Revisá la implementación publicada y la sesión.');
    }
    let data;
    try { data = JSON.parse(text); }
    catch (_) { throw new Error(`Respuesta inválida del backend en ${fn}.`); }
    if (!res.ok) throw new Error(data?.error || data?.mensaje || `HTTP ${res.status}`);
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error(`El backend tardó demasiado en responder (${fn}).`);
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// ── Parseo real del HTML del BCR ──────────────────────────────────────────
function parsearExtractoBCR(htmlContent) {
  // El BCR exporta HTML disfrazado de XLS
  // Formato de fila: Fecha Contable | Fecha Registro | Hora | N°Doc | Descripcion | Oficina | Debitos | Creditos
  // Montos: "334200,00" (coma decimal) o "-" cuando no aplica

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const rows = doc.querySelectorAll('tr');
  const movimientos = [];
  let headerEncontrado = false;

  rows.forEach(row => {
    const celdas = Array.from(row.querySelectorAll('td,th')).map(c => c.textContent.trim());
    if (celdas.length < 8) return;

    // Detectar fila de encabezado
    if (celdas[0] === 'Fecha Contable' || celdas[3] === 'Número Documento') {
      headerEncontrado = true;
      return;
    }
    if (!headerEncontrado) return;

    // Parsear monto: "334200,00" -> 334200 | "-" -> 0
    const parseMonto = (s) => {
      if (!s || s === '-' || s.trim() === '') return 0;
      // Quitar puntos de miles si los hay, reemplazar coma decimal por punto
      const limpio = s.replace(/\./g, '').replace(',', '.');
      return Math.round(parseFloat(limpio) || 0);
    };

    const fechaContable  = celdas[0];
    const fechaRegistro  = celdas[1];
    const hora           = celdas[2];
    const doc_num        = celdas[3];
    const descripcion    = celdas[4];
    const oficina        = celdas[5];
    const debito         = parseMonto(celdas[6]);
    const credito        = parseMonto(celdas[7]);

    // Validar que sea una fila de datos real (fecha en formato DD/MM/YYYY)
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fechaContable)) return;
    if (!doc_num) return;

    movimientos.push({
      fechaContable,
      fechaRegistro,
      hora,
      doc: doc_num,
      descripcion,
      oficina,
      debito:  debito > 0 ? debito : null,
      credito: credito > 0 ? credito : null,
    });
  });

  return movimientos;
}

const fmtCRC = n => n != null ? '₡' + n.toLocaleString('es-CR') : '—';

// ── Stepper ───────────────────────────────────────────────────────────────
function Stepper({ paso }) {
  const pasos = ['Subir archivo', 'Revisar movimientos', 'Confirmar importación'];
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:28 }}>
      {pasos.map((label, i) => {
        const num = i + 1;
        const activo = paso === num;
        const hecho = paso > num;
        return (
          <React.Fragment key={i}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flex: i<2?0:1, minWidth:0 }}>
              <div style={{
                width:36, height:36, borderRadius:'50%',
                background: hecho ? 'var(--ok)' : activo ? 'var(--an-navy)' : 'var(--bg-deep)',
                color: hecho||activo ? 'white' : 'var(--ink-3)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:700, fontSize:14,
                boxShadow: activo ? '0 0 0 4px color-mix(in srgb, var(--an-navy) 18%, transparent)' : 'none',
                transition:'all .2s',
              }}>
                {hecho ? '✓' : num}
              </div>
              <div style={{
                fontSize:11, fontWeight: activo?700:500,
                color: activo?'var(--an-navy)':hecho?'var(--ok)':'var(--ink-3)',
                textAlign:'center', whiteSpace:'nowrap',
              }}>{label}</div>
            </div>
            {i < 2 && (
              <div style={{
                flex:1, height:2, margin:'0 8px', marginBottom:20,
                background: paso > i+1 ? 'var(--ok)' : 'var(--line-2)',
                borderRadius:1,
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────
function ImportadorBancario() {
  const [paso, setPaso]             = React.useState(1);
  const [archivo, setArchivo]       = React.useState(null);
  const [movimientos, setMovimientos] = React.useState([]);
  const [seleccionados, setSeleccionados] = React.useState(new Set());
  const [importado, setImportado]   = React.useState(false);
  const [cargando, setCargando]     = React.useState(false);
  const [error, setError]           = React.useState(null);
  const [resultadoImport, setResultadoImport] = React.useState(null);
  const [docsExistentes, setDocsExistentes]   = React.useState(new Set());
  const dragRef  = React.useRef(null);
  const [dragOver, setDragOver]     = React.useState(false);

  // Cargar docs existentes del Sheet al montar
  React.useEffect(() => {
    // FIX-PAGOS-ADMIN-001: lectura sensible (comprobantes BCR). Antes iba por
    // GET con el token en la URL (mismo bug de CORS que se corrigió en ventas).
    // Ahora POST text/plain con fn y token en el body. El shape NO cambia.
    postImportador({ fn: 'getComprobantes' })
      .then(data => {
        if (data.ok) {
          const docs = new Set(data.comprobantes.map(c => String(c.doc).trim()));
          setDocsExistentes(docs);
        }
      })
      .catch(() => {}); // Si falla, seguimos sin docs existentes
  }, []);

  // Clasificar movimientos
  const movimientosConEstado = movimientos.map(m => ({
    ...m,
    esNuevo:     !docsExistentes.has(m.doc) && m.credito != null,
    esExistente:  docsExistentes.has(m.doc),
    esDebito:     m.debito != null && m.credito == null,
  }));

  const nuevos     = movimientosConEstado.filter(m => m.esNuevo);
  const existentes = movimientosConEstado.filter(m => m.esExistente);
  const debitos    = movimientosConEstado.filter(m => m.esDebito);

  const toggleSel = (doc) => {
    setSeleccionados(s => {
      const n = new Set(s);
      n.has(doc) ? n.delete(doc) : n.add(doc);
      return n;
    });
  };
  const selectAll = () => setSeleccionados(new Set(nuevos.map(m => m.doc)));
  const clearAll  = () => setSeleccionados(new Set());

  // Procesar archivo real
  const procesarArchivo = (file) => {
    setArchivo(file);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const movs = parsearExtractoBCR(content);
        if (movs.length === 0) {
          setError('No se encontraron movimientos en el archivo. Verificá que sea el extracto XLS del BCR.');
          return;
        }
        setMovimientos(movs);
        // Preseleccionar todos los nuevos créditos
        setSeleccionados(new Set(
          movs.filter(m => !docsExistentes.has(m.doc) && m.credito != null).map(m => m.doc)
        ));
        setPaso(2);
      } catch(err) {
        setError('Error al leer el archivo: ' + err.message);
      }
    };
    reader.onerror = () => setError('Error al leer el archivo.');
    reader.readAsText(file, 'utf-8');
  };

  // Confirmar e importar al Sheet
  const confirmar = async () => {
    setCargando(true);
    setError(null);
    try {
      const filasAImportar = movimientosConEstado
        .filter(m => seleccionados.has(m.doc))
        .map(m => ({
          fechaContable:  m.fechaContable,
          fechaRegistro:  m.fechaRegistro,
          hora:           m.hora,
          doc:            m.doc,
          descripcion:    m.descripcion,
          oficina:        m.oficina,
          debito:         m.debito || 0,
          credito:        m.credito || 0,
        }));

      // F98.4-Z6-BH: la importación usa el mismo canal autenticado que la
      // lectura de comprobantes. Antes se enviaba un array crudo sin token y
      // el backend respondía `sesion_requerida` antes de escribir.
      const data = await postImportador({
        fn: 'importarExtracto',
        filas: filasAImportar,
      });

      if (!data.ok) {
        const detalle = data.error === 'sesion_requerida'
          ? 'La sesión administrativa venció o no llegó al backend. Ingresá nuevamente.'
          : (data.error || 'No fue posible importar el extracto.');
        setError('Error del servidor: ' + detalle);
        return;
      }

      // Actualizar docs existentes localmente
      setDocsExistentes(prev => {
        const next = new Set(prev);
        filasAImportar.forEach(f => next.add(f.doc));
        return next;
      });

      setResultadoImport(data);
      setImportado(true);
      setPaso(3);
    } catch(err) {
      setError('Error de conexión: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const reiniciar = () => {
    setArchivo(null);
    setMovimientos([]);
    setSeleccionados(new Set());
    setImportado(false);
    setResultadoImport(null);
    setError(null);
    setPaso(1);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) procesarArchivo(file);
  };

  return (
    <div>
      <PageHeader
        kicker="Conciliación bancaria"
        title={<>Importar <em>extracto BCR</em></>}
        sub="Sube el extracto mensual XLS/HTML del BCR y marca los pagos nuevos para importar"
      />

      <Stepper paso={paso} />

      {/* Error global */}
      {error && (
        <div style={{ padding:'12px 16px', background:'color-mix(in srgb,#C00000 8%,white)', border:'1px solid #C00000', borderRadius:'var(--r-md)', marginBottom:16, fontSize:13, color:'#C00000' }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── PASO 1 ─────────────────────────────────────────────────────── */}
      {paso === 1 && (
        <div>
          <div
            ref={dragRef}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            style={{
              border: `2px dashed ${dragOver ? 'var(--an-navy)' : 'var(--line-2)'}`,
              borderRadius:'var(--r-xl)',
              background: dragOver ? 'color-mix(in srgb, var(--an-navy) 4%, white)' : 'var(--surface)',
              padding:'52px 32px',
              textAlign:'center',
              transition:'all .2s',
              marginBottom:16,
              cursor:'pointer',
            }}
            onClick={() => document.getElementById('file-input-banco').click()}
          >
            <div style={{ fontSize:52, marginBottom:12 }}>📄</div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:24, fontWeight:500, color:'var(--an-navy-ink)', marginBottom:6 }}>
              {archivo ? archivo.name : 'Arrastrá el extracto aquí'}
            </div>
            <div style={{ fontSize:13, color:'var(--ink-3)' }}>
              {archivo
                ? `Listo para procesar · ${(archivo.size/1024).toFixed(1)} KB`
                : 'o hacé clic para seleccionar el archivo XLS del BCR'}
            </div>
            <input id="file-input-banco" type="file" accept=".xls,.xlsx,.html,.htm" style={{ display:'none' }}
              onChange={e => { if (e.target.files[0]) procesarArchivo(e.target.files[0]); }} />
          </div>

          <div style={{ padding:'14px 18px', background:'color-mix(in srgb, var(--an-navy) 5%, white)', border:'1px solid color-mix(in srgb, var(--an-navy) 20%, white)', borderRadius:'var(--r-md)', fontSize:12, color:'var(--an-navy-ink)', lineHeight:1.6 }}>
            <strong>¿Cómo exportar del BCR?</strong> Banca en Línea BCR → Cuentas → Movimientos → Exportar → Formato Excel (XLS). El sistema lee automáticamente el formato estándar del BCR.
          </div>
        </div>
      )}

      {/* ── PASO 2 ─────────────────────────────────────────────────────── */}
      {paso === 2 && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
            {[
              ['Movimientos', movimientos.length, 'var(--ink)', 'var(--surface)'],
              ['Nuevos créditos', nuevos.length, '#2E7D32', 'color-mix(in srgb,#2E7D32 8%,white)'],
              ['Ya existen', existentes.length, 'var(--ink-3)', 'var(--surface-2)'],
              ['Débitos', debitos.length, 'var(--ink-2)', 'var(--surface-2)'],
            ].map(([l,n,color,bg],i) => (
              <div key={i} style={{ padding:'12px 16px', background:bg, border:'1px solid var(--line)', borderRadius:'var(--r-md)' }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--ink-3)' }}>{l}</div>
                <div style={{ fontFamily:'var(--f-serif)', fontSize:28, fontWeight:500, color, letterSpacing:'-0.03em', marginTop:3 }}>{n}</div>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center' }}>
            <button onClick={selectAll} className="btn btn-primary" style={{ fontSize:12, background:'var(--an-navy)', borderColor:'var(--an-navy)' }}>
              ✓ Seleccionar todos los nuevos ({nuevos.length})
            </button>
            <button onClick={clearAll} className="btn btn-ghost" style={{ fontSize:12 }}>
              Deseleccionar todos
            </button>
            <div style={{ marginLeft:'auto', fontSize:12, color:'var(--ink-3)' }}>
              {seleccionados.size} seleccionado{seleccionados.size!==1?'s':''}
            </div>
          </div>

          <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:16 }}>
            <table className="table-soft" style={{ fontSize:12 }}>
              <thead>
                <tr>
                  <th style={{ width:36 }}></th>
                  <th>Fecha</th>
                  <th>N° Documento</th>
                  <th>Descripción</th>
                  <th style={{ textAlign:'right' }}>Crédito</th>
                  <th style={{ textAlign:'right' }}>Débito</th>
                  <th style={{ textAlign:'center' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {movimientosConEstado.map((m, i) => {
                  const isSel = seleccionados.has(m.doc);
                  const rowBg = m.esNuevo && isSel ? 'color-mix(in srgb,#2E7D32 4%,white)' : m.esExistente ? 'var(--surface-2)' : 'var(--surface)';
                  return (
                    <tr key={i} style={{ background:rowBg, opacity: m.esDebito ? 0.65 : 1 }}>
                      <td style={{ textAlign:'center' }}>
                        {m.esNuevo ? (
                          <input type="checkbox" checked={isSel} onChange={() => toggleSel(m.doc)}
                            style={{ width:16, height:16, cursor:'pointer', accentColor:'var(--an-navy)' }} />
                        ) : (
                          <span style={{ fontSize:14, color:'var(--ink-3)' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontFamily:'var(--f-mono)', fontSize:11 }}>{m.fechaContable}</td>
                      <td style={{ fontFamily:'var(--f-mono)', fontSize:11, color:'var(--ink-3)' }}>{m.doc}</td>
                      <td style={{ maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.descripcion}</td>
                      <td style={{ textAlign:'right', fontFamily:'var(--f-mono)', fontWeight:600, color:'#2E7D32' }}>
                        {m.credito != null ? fmtCRC(m.credito) : ''}
                      </td>
                      <td style={{ textAlign:'right', fontFamily:'var(--f-mono)', color:'#C00000' }}>
                        {m.debito != null ? fmtCRC(m.debito) : ''}
                      </td>
                      <td style={{ textAlign:'center' }}>
                        {m.esNuevo && (
                          <span style={{ padding:'3px 9px', borderRadius:999, background:'color-mix(in srgb,#2E7D32 12%,white)', color:'#2E7D32', fontSize:10, fontWeight:700 }}>
                            NUEVO
                          </span>
                        )}
                        {m.esExistente && (
                          <span style={{ padding:'3px 9px', borderRadius:999, background:'var(--bg-deep)', color:'var(--ink-3)', fontSize:10, fontWeight:700 }}>
                            YA EXISTE
                          </span>
                        )}
                        {m.esDebito && (
                          <span style={{ padding:'3px 9px', borderRadius:999, background:'color-mix(in srgb,#C00000 8%,white)', color:'#C00000', fontSize:10, fontWeight:700 }}>
                            DÉBITO
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'space-between' }}>
            <button onClick={() => { setPaso(1); setMovimientos([]); setArchivo(null); }} className="btn btn-ghost">
              ← Cambiar archivo
            </button>
            <button
              onClick={confirmar}
              disabled={seleccionados.size === 0 || cargando}
              className="btn btn-primary"
              style={{ background:'var(--an-granate)', borderColor:'var(--an-granate)', padding:'12px 28px', fontSize:15, opacity: seleccionados.size>0?1:0.4 }}
            >
              {cargando ? 'Importando...' : `Importar ${seleccionados.size} registro${seleccionados.size!==1?'s':''} →`}
            </button>
          </div>
        </div>
      )}

      {/* ── PASO 3 ─────────────────────────────────────────────────────── */}
      {paso === 3 && importado && (
        <div>
          <div style={{
            background:'linear-gradient(135deg, var(--an-navy) 0%, #1A3E75 100%)',
            borderRadius:'var(--r-xl)', padding:'36px 32px', textAlign:'center', color:'white', marginBottom:20,
          }}>
            <div style={{ fontSize:56, marginBottom:12 }}>✅</div>
            <div style={{ fontFamily:'var(--f-serif)', fontSize:28, fontWeight:500, marginBottom:6 }}>
              Importación completada
            </div>
            <div style={{ fontSize:15, opacity:0.85, marginBottom:8 }}>
              {resultadoImport?.agregados ?? seleccionados.size} movimiento{(resultadoImport?.agregados ?? seleccionados.size)!==1?'s':''} agregado{(resultadoImport?.agregados ?? seleccionados.size)!==1?'s':''} a BDBANCARIO
            </div>
            {resultadoImport?.duplicados > 0 && (
              <div style={{ fontSize:12, opacity:0.7 }}>
                {resultadoImport.duplicados} ignorado{resultadoImport.duplicados!==1?'s':''} por duplicado
              </div>
            )}
            <div style={{ fontSize:12, opacity:0.7, marginTop:4 }}>
              CODIGO_EST: vacío · APLICADO: 0 · Listos para conciliación
            </div>
          </div>

          <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:20 }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--line)', fontWeight:700, fontSize:14 }}>
              Movimientos importados
            </div>
            <table className="table-soft" style={{ fontSize:12 }}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>N° Documento</th>
                  <th>Descripción</th>
                  <th style={{ textAlign:'right' }}>Crédito</th>
                </tr>
              </thead>
              <tbody>
                {movimientosConEstado.filter(m => seleccionados.has(m.doc)).map((m,i) => (
                  <tr key={i}>
                    <td style={{ fontFamily:'var(--f-mono)', fontSize:11 }}>{m.fechaContable}</td>
                    <td style={{ fontFamily:'var(--f-mono)', fontSize:11, color:'var(--ink-3)' }}>{m.doc}</td>
                    <td style={{ maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.descripcion}</td>
                    <td style={{ textAlign:'right', fontFamily:'var(--f-mono)', fontWeight:600, color:'#2E7D32' }}>{fmtCRC(m.credito)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background:'var(--surface-2)' }}>
                  <td colSpan={3} style={{ padding:'10px 12px', fontWeight:700 }}>Total importado</td>
                  <td style={{ textAlign:'right', fontFamily:'var(--f-mono)', fontWeight:700, fontSize:15, padding:'10px 12px', color:'var(--an-granate)' }}>
                    {fmtCRC(movimientosConEstado.filter(m=>seleccionados.has(m.doc)).reduce((a,m)=>a+(m.credito||0),0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <button onClick={reiniciar} className="btn btn-primary"
            style={{ width:'100%', padding:14, fontSize:15, background:'var(--an-navy)', borderColor:'var(--an-navy)' }}>
            Importar otro extracto
          </button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ImportadorBancario });
