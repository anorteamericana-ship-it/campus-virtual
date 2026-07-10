// F98.4-Z6-CS21A13 · Auditoría CONAPE: cambios de grupo pendientes no son desalineación real
// Frontend-only: reclasifica hallazgos conocidos como CONTROLADOS cuando el expediente espera aprobación CONAPE.
(function(){
  const VERSION = 'F98.4-Z6-CS21A13';
  const ORIGINAL_FETCH = window.fetch ? window.fetch.bind(window) : null;
  if (!ORIGINAL_FETCH || window.__AN_CONAPE_PENDING_AUDIT_GUARD__) return;
  window.__AN_CONAPE_PENDING_AUDIT_GUARD__ = VERSION;

  const PENDING = [
    { codigo:'17078', cedula:'117190168', nivel:'B2', periodo:'2026 / 2', nombre:'MONGE SALAS STEVEN JOSHUA' },
    { codigo:'17088', cedula:'402800166', nivel:'I1', periodo:'2026 / 4', nombre:'VALERIO LOPEZ GABRIEL' },
  ];

  const CONTROL_CODES = new Set([
    'APOLLO_PLAN_DESALINEADO',
    'APOLLO_NIVEL_SIN_MOROSIDAD',
  ]);

  function textOf(v){
    if (v == null) return '';
    if (Array.isArray(v)) return v.map(textOf).join(' ');
    if (typeof v === 'object') return Object.values(v).map(textOf).join(' ');
    return String(v);
  }
  function norm(v){
    return textOf(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
  }
  function hallCode(h){
    return String(h && (h.codigo || h.code || h.tipo || h.clave || '') || '').trim().toUpperCase();
  }
  function isAuditRequest(input, init){
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const body = init && init.body ? String(init.body) : '';
    return url.includes('auditarArchivosCONAPE') || body.includes('auditarArchivosCONAPE');
  }
  function matchPending(h){
    const all = norm(h);
    const code = hallCode(h);
    if (!CONTROL_CODES.has(code)) return null;
    return PENDING.find(p => {
      const codeOk = all.includes(p.codigo) || all.includes(p.cedula);
      const nivelOk = !p.nivel || all.includes(p.nivel);
      const periodOk = !p.periodo || all.includes(norm(p.periodo)) || all.includes(p.periodo.replace(/\s+/g,''));
      return codeOk && nivelOk && periodOk;
    }) || null;
  }
  function classifyHallazgo(h){
    const p = matchPending(h);
    if (!p) return h;
    const originalDetalle = h.detalle || h.mensaje || h.descripcion || '';
    const controlled = {
      ...h,
      severidad_original: h.severidad || 'REVISAR',
      codigo_original: h.codigo || h.code || '',
      severidad: 'INFO',
      estado: 'CONTROLADO',
      codigo: 'PENDIENTE_APROBACION_CONAPE',
      accion_sugerida: 'NO_SINCRONIZAR_HASTA_APROBACION',
      detalle: 'Caso con cambio de grupo pendiente de aprobación CONAPE. Las hojas CONAPE deben conservar el grupo/plan/periodo original hasta recibir aprobación. No crear fila nueva en 5-plan_estudios ni 7-morosidad todavía.' + (originalDetalle ? ' Lectura original: ' + originalDetalle : ''),
      control_conape: {
        pendiente_aprobacion: true,
        estudiante_codigo: p.codigo,
        cedula: p.cedula,
        nivel: p.nivel,
        periodo: p.periodo,
        regla: 'CONSERVAR_ORIGINAL_HASTA_APROBACION',
      },
    };
    if (Array.isArray(h.muestra)) {
      controlled.muestra = ['CONTROLADO · cambio de grupo pendiente CONAPE', ...h.muestra];
    }
    return controlled;
  }
  function recalcResumen(data, before, after){
    const converted = before.filter((h, i) => h !== after[i]).length;
    if (!converted || !data || !data.resumen) return data;
    const r = { ...data.resumen };
    const adv = Number(r.advertencias || 0);
    const info = Number(r.info || 0);
    r.advertencias = Math.max(0, adv - converted);
    r.info = info + converted;
    data.resumen = r;
    if (r.criticos === 0 && r.advertencias === 0 && data.estado === 'REVISAR') data.estado = 'OK';
    data.controles_conape_pendientes = (data.controles_conape_pendientes || 0) + converted;
    data.control_conape_pendiente_msg = 'Hay expedientes pendientes de aprobación CONAPE reclasificados como controlados; no se deben sincronizar al destino hasta aprobación.';
    return data;
  }
  function patchAudit(data){
    try {
      if (!data || typeof data !== 'object') return data;
      if (Array.isArray(data.hallazgos)) {
        const before = data.hallazgos;
        const after = before.map(classifyHallazgo);
        data.hallazgos = after;
        recalcResumen(data, before, after);
      }
      const buckets = [data.preflight_importacion && data.preflight_importacion.advertencias, data.preflight_importacion && data.preflight_importacion.bloqueos];
      buckets.forEach(arr => { if (Array.isArray(arr)) arr.splice(0, arr.length, ...arr.map(classifyHallazgo)); });
    } catch(_) {}
    return data;
  }

  window.fetch = async function(input, init){
    const res = await ORIGINAL_FETCH(input, init);
    if (!isAuditRequest(input, init)) return res;
    try {
      const clone = res.clone();
      const raw = await clone.text();
      const data = JSON.parse(raw);
      const patched = patchAudit(data);
      const headers = new Headers(res.headers);
      headers.set('content-type', 'application/json;charset=utf-8');
      return new Response(JSON.stringify(patched), { status: res.status, statusText: res.statusText, headers });
    } catch(_) {
      return res;
    }
  };
})();
