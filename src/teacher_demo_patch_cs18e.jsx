// F98.4-Z6-CS18E · Teacher agenda switcher multi-slot I CAN
// Corrige la banda superior semanal de Mis Grupos / Cronograma / Club I CAN.
// No escribe datos. Solo respeta horarios multi-slot enviados por backend.
/* global React */
(function(){
  const R = window.React;
  if (!R) return;

  const WEEK = [
    { key:1, label:'LUNES' }, { key:2, label:'MARTES' }, { key:3, label:'MIÉRCOLES' },
    { key:4, label:'JUEVES' }, { key:5, label:'VIERNES' }, { key:6, label:'SÁBADO' },
    { key:0, label:'DOMINGO' },
  ];
  const DAY_LABEL = {0:'Domingo',1:'Lunes',2:'Martes',3:'Miércoles',4:'Jueves',5:'Viernes',6:'Sábado'};
  const SHORT_DAY_LABEL = {0:'Dom',1:'Lun',2:'Mar',3:'Mié',4:'Jue',5:'Vie',6:'Sáb'};
  const LEVEL_COLOR = {
    B1:{ dark:'#B77900', light:'#FFF7D6' },
    B2:{ dark:'#A32424', light:'#FDE8E8' },
    I1:{ dark:'#074C8E', light:'#E8F2FF' },
    I2:{ dark:'#16834A', light:'#EAF8EF' },
  };

  function clean(v){ return String(v == null ? '' : v).trim(); }
  function upper(v){
    let s = clean(v);
    try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch(_) {}
    return s.toUpperCase().replace(/\s+/g,' ');
  }
  function codeOf(g){
    if (!g) return '';
    if (typeof g === 'string') return clean(g);
    return clean(g.code || g.cod_grupo || g.codigo_grupo || g.grupo || g.codigo || g.id || '');
  }
  function cicloOf(g){
    const c = codeOf(g);
    const parts = c.split('-');
    return parts.length >= 2 ? parts[parts.length - 1] : c;
  }
  function nivelId(g){
    const c = codeOf(g);
    return upper(g && (g.nivelId || g.nivel || g.nivel_id || (c.split('-')[0] || 'B1'))) || 'B1';
  }
  function nivelColor(n){ return LEVEL_COLOR[upper(n)] || { dark:'var(--an-navy)', light:'#E8F2FF' }; }
  function scheduleFromCode(c){
    const s = upper(c).replace(/\s+/g,'');
    const m = s.match(/-(LM|KJ|LJ|L4|SA|SAB|L|K|M|J|V|D)(\d{2})-/) || s.match(/-(LM|KJ|LJ|L4|SA|SAB|L|K|M|J|V|D)(\d{2})/);
    if (!m) return {};
    const horas = { '69':['18:00','21:00'], '94':['09:00','16:00'], '96':['09:00','12:00'] }[m[2]] || [];
    return { dias:m[1] === 'SAB' ? 'SA' : m[1], hora_i:horas[0] || '', hora_f:horas[1] || '' };
  }
  function minutes(v){
    const str = clean(v);
    if (!str) return null;
    const m = str.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (!m) return null;
    let h = Number(m[1]);
    const min = Number(m[2] || 0);
    const ap = clean(m[3]).toLowerCase();
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    return h * 60 + min;
  }
  function hourLabelFromParts(hi, hf){
    const fmt = (x) => {
      const str = clean(x);
      const m = str.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
      if (!m) return str;
      let h = Number(m[1]);
      const min = (m[2] && m[2] !== '00') ? ':' + m[2] : '';
      let ap = clean(m[3]).toLowerCase();
      if (!ap) ap = h >= 12 ? 'pm' : 'am';
      if (!clean(m[3]) && h > 12) h -= 12;
      if (!clean(m[3]) && h === 0) h = 12;
      return `${h}${min}${ap}`;
    };
    return [fmt(hi), fmt(hf)].filter(Boolean).join(' a ');
  }
  function first(...vals){ return vals.find(v => clean(v)); }
  function dayIndexes(raw){
    const original = clean(raw);
    if (!original) return [];
    const normalized = upper(original).replace(/[.;|]+/g, ',').replace(/\s+Y\s+/g, ',');
    const exact = {
      LM:[1,3], KJ:[2,4], LJ:[1,4], L4:[1,2,3,4],
      SA:[6], SAB:[6], S:[6],
      L:[1], K:[2], M:[3], X:[3], MI:[3], MIE:[3], MIERCOLES:[3],
      J:[4], V:[5], D:[0], DOM:[0], DOMINGO:[0]
    };
    if (exact[normalized]) return exact[normalized];
    const out = [];
    const add = (n) => { if (out.indexOf(n) < 0) out.push(n); };
    normalized.split(/[,/+-]+/).map(x => x.trim()).filter(Boolean).forEach(tok => {
      if (exact[tok]) exact[tok].forEach(add);
      else if (/LUN/.test(tok)) add(1);
      else if (/MAR/.test(tok)) add(2);
      else if (/MIER|MIE|MI[ÉE]/.test(tok)) add(3);
      else if (/JUE/.test(tok)) add(4);
      else if (/VIE/.test(tok)) add(5);
      else if (/SAB|S[ÁA]B/.test(tok)) add(6);
      else if (/DOM/.test(tok)) add(0);
    });
    if (!out.length) {
      if (/LUN/.test(normalized)) add(1);
      if (/MAR/.test(normalized)) add(2);
      if (/MIER|MIE|MI[ÉE]/.test(normalized)) add(3);
      if (/JUE/.test(normalized)) add(4);
      if (/VIE/.test(normalized)) add(5);
      if (/SAB|S[ÁA]B/.test(normalized)) add(6);
      if (/DOM/.test(normalized)) add(0);
    }
    return out;
  }
  function dayIndexFromIso(iso){
    const raw = clean(iso).slice(0,10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    const d = new Date(raw + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d.getDay();
  }
  function normalizeSlot(s, fallbackDays, fallbackHi, fallbackHf){
    const raw = s || {};
    let idx = raw.dia_index ?? raw.day_index ?? raw.dia ?? raw.day;
    if (typeof idx === 'string' && /^\d+$/.test(idx)) idx = Number(idx);
    else if (typeof idx === 'string') idx = null;
    if (typeof idx !== 'number' || !Number.isFinite(idx) || idx < 0 || idx > 6) {
      const ds = dayIndexes(first(raw.dias, raw.dia_code, raw.day_code, raw.dias_label, raw.dia_label, raw.label, fallbackDays));
      idx = ds.length ? ds[0] : null;
    }
    if (typeof idx !== 'number' || !Number.isFinite(idx) || idx < 0 || idx > 6) return null;
    const hi = first(raw.hora_i, raw.hora_inicio, raw.start, raw.inicio, fallbackHi);
    const hf = first(raw.hora_f, raw.hora_fin, raw.end, raw.fin, fallbackHf);
    const label = first(raw.hora, raw.horario, hourLabelFromParts(hi, hf));
    return {
      day:Number(idx),
      dayLabel:first(raw.dias_label, raw.dia_label, raw.label, DAY_LABEL[idx]),
      shortDay:SHORT_DAY_LABEL[idx] || DAY_LABEL[idx],
      hora_i:hi,
      hora_f:hf,
      hourLabel:label,
      start:minutes(hi || label) ?? 9999,
    };
  }
  function slotsFor(g, riel){
    const isIcan = riel === 'ican';
    if (isIcan) {
      const slotArrays = [g && g.ican_slots, g && g.ican_horarios, g && g.horarios_ican, g && g.icanSlots].filter(Array.isArray);
      const rawSlots = slotArrays.length ? slotArrays[0] : [];
      if (rawSlots.length) {
        const seen = new Set();
        return rawSlots.map(sl => normalizeSlot(sl, g.dias_ican || g.diasIcan || g.dias_ican_code, g.hora_i_ican || g.hora_inicio_ican, g.hora_f_ican || g.hora_fin_ican))
          .filter(Boolean)
          .filter(sl => { const k = `${sl.day}-${sl.hora_i}-${sl.hora_f}`; if (seen.has(k)) return false; seen.add(k); return true; });
      }
      const days = dayIndexes(first(g && g.dias_ican, g && g.diasIcan, g && g.dias_ican_code, g && g.diasIcanCode));
      return days.map(d => normalizeSlot({ dia_index:d, dia_label:DAY_LABEL[d] }, '', g && (g.hora_i_ican || g.hora_inicio_ican), g && (g.hora_f_ican || g.hora_fin_ican))).filter(Boolean);
    }
    const sched = scheduleFromCode(codeOf(g));
    const days = dayIndexes(first(g && (g.dias || g.diasCode || g.dias_code), sched.dias));
    return days.map(d => normalizeSlot({ dia_index:d, dia_label:DAY_LABEL[d] }, '', g && (g.hora_i || g.hora_inicio) || sched.hora_i, g && (g.hora_f || g.hora_fin) || sched.hora_f)).filter(Boolean);
  }
  function groupDaysLabel(g){
    const days = slotsFor(g, 'curso').map(s => s.day);
    const key = days.join(',');
    const labels = {'1,3':'Lunes y miércoles','2,4':'Martes y jueves','1,4':'Lunes y jueves','1,2,3,4':'Lunes a jueves','6':'Sábado','5':'Viernes'};
    return labels[key] || days.map(d => DAY_LABEL[d]).join(' y ') || 'Horario';
  }
  function nextFor(g, riel){
    const candidates = riel === 'ican'
      ? [g && g.proxima_ican, g && g.next_ican, g && g.siguiente_ican]
      : [g && g.proxima_leccion, g && g.next_lesson, g && g.siguiente_leccion];
    if (g && g.proxima && String(g.proxima.riel || g.proxima.tipo || '').toLowerCase().indexOf(riel) >= 0) candidates.push(g.proxima);
    return candidates.find(x => x && typeof x === 'object') || null;
  }
  function isNextSlot(g, riel, slot){
    const nx = nextFor(g, riel);
    if (!nx) return false;
    let d = nx.dia_index ?? nx.day_index;
    if (d == null) d = dayIndexFromIso(nx.fecha || nx.date || nx.FECHA);
    if (d != null && Number(d) !== Number(slot.day)) return false;
    const nh = minutes(nx.hora_inicio || nx.hora_i || nx.HORA_INICIO || nx.hora || '');
    if (nh != null && slot.start !== 9999 && Math.abs(nh - slot.start) > 90) return false;
    return true;
  }
  function canOperate(g, riel){
    const nx = nextFor(g, riel);
    if (!nx) return false;
    return nx.puede_activar !== false || nx.puede_pasar_lista !== false || nx.puede_cerrar === true || nx.es_proxima === true || nx.proxima === true;
  }
  function activeRielOf(activeSession){
    const raw = clean(activeSession && (activeSession.RIEL || activeSession.riel || activeSession.tipo || 'curso')).toLowerCase();
    return raw.indexOf('ican') >= 0 ? 'ican' : 'curso';
  }

  function MisGruposSwitcherCS18E({ grupos, activo, onSelect, activeSession }) {
    const lista = Array.isArray(grupos) ? grupos : [];
    return (
      <div className="card" style={{ marginBottom:18, padding:0, background:'#FBF7EF', width:'100%', maxWidth:'100%', minWidth:0, overflow:'hidden' }}>
        <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
          <div style={{ minWidth:980, display:'grid', gridTemplateColumns:'repeat(7, minmax(128px, 1fr))', borderTop:'1px solid var(--line)', borderLeft:'1px solid var(--line)' }}>
            {WEEK.map(day => {
              const dayItems = [];
              lista.forEach(g => {
                if (g && g.puede_curso !== false) {
                  slotsFor(g, 'curso').filter(sl => sl.day === day.key).forEach(sl => dayItems.push({ g, riel:'curso', slot:sl, start:sl.start }));
                }
                const hasIcan = g && (g.puede_ican === true || g.puede_ican == null || slotsFor(g, 'ican').length > 0);
                if (hasIcan) {
                  slotsFor(g, 'ican').filter(sl => sl.day === day.key).forEach(sl => dayItems.push({ g, riel:'ican', slot:sl, start:sl.start }));
                }
              });
              dayItems.sort((a,b) => a.start - b.start || String(a.riel).localeCompare(String(b.riel)) || codeOf(a.g).localeCompare(codeOf(b.g)));
              return (
                <div key={day.key} style={{ minHeight:158, borderRight:'1px solid var(--line)', borderBottom:'1px solid var(--line)', background:'#FFF' }}>
                  <div style={{ padding:'11px 8px', textAlign:'center', fontSize:11, fontWeight:900, letterSpacing:'.08em', color:'var(--ink-2)', borderBottom:'1px solid var(--line)', background:'#F7F3EC' }}>{day.label}</div>
                  <div style={{ display:'grid', gap:7, padding:7 }}>
                    {dayItems.map(({g,riel,slot}, idx) => {
                      const cod = codeOf(g);
                      const active = String(cod) === String(activo);
                      const n = nivelId(g);
                      const pal = nivelColor(n);
                      const isIcan = riel === 'ican';
                      const aRiel = activeRielOf(activeSession);
                      const sessionHere = upper(activeSession && (activeSession.ESTADO || activeSession.estado)) === 'ABIERTA' && String(activeSession && (activeSession.COD_GRUPO || activeSession.cod_grupo || activeSession.grupo || '')) === String(cod) && aRiel === riel;
                      const dark = isIcan ? '#57217F' : pal.dark;
                      const light = isIcan ? '#EADCF5' : pal.light;
                      const nextHere = isNextSlot(g, riel, slot);
                      const daysLabel = isIcan ? 'Club I CAN' : groupDaysLabel(g);
                      const hourLabel = slot.hourLabel || 'Horario pendiente';
                      const title = isIcan ? `Club I CAN · ${slot.dayLabel} de ${hourLabel} - ${cicloOf(g)}` : `${groupDaysLabel(g)} de ${hourLabel} - ${cicloOf(g)}`;
                      const badge = sessionHere ? 'SESIÓN ACTIVA' : nextHere ? 'PRÓXIMA' : active ? 'SELECCIONADO' : '';
                      const badgeBg = sessionHere ? '#C62828' : nextHere ? '#16834A' : (isIcan ? dark : 'var(--an-navy)');
                      const actionLine = nextHere && canOperate(g, riel) ? (isIcan ? 'Activar / pasar lista' : 'Activar clase') : '';
                      return <button key={`${day.key}-${cod}-${riel}-${slot.hora_i || idx}-${slot.hora_f || ''}`} type="button" onClick={() => onSelect && onSelect(cod)} title={title} style={{
                        border:`1.5px solid ${sessionHere ? '#C62828' : nextHere ? '#16834A' : active ? dark : 'var(--line)'}`,
                        borderLeft:`4px solid ${sessionHere ? '#C62828' : nextHere ? '#16834A' : dark}`,
                        background:sessionHere ? '#FDECEA' : nextHere ? '#EAF8EF' : active ? light : '#FFF',
                        borderRadius:10, padding:'8px 9px', textAlign:'left', cursor:active ? 'default' : 'pointer', fontFamily:'inherit',
                        boxShadow:nextHere ? '0 0 0 3px rgba(22,131,74,.13), 0 8px 18px rgba(22,131,74,.10)' : active ? (isIcan ? '0 0 0 3px rgba(87,33,127,.18), 0 8px 18px rgba(87,33,127,.12)' : '0 0 0 2px rgba(7,59,122,.10)') : (isIcan ? '0 4px 12px rgba(87,33,127,.12)' : '0 2px 8px rgba(8,30,60,.05)'),
                        position:'relative', minHeight:nextHere ? 78 : 68,
                      }}>
                        <div style={{ fontSize:10.5, fontWeight:900, color:isIcan ? dark : 'var(--ink)', lineHeight:1.15 }}>{daysLabel}</div>
                        <div style={{ fontSize:15, fontWeight:900, color:isIcan ? dark : 'var(--an-navy)', lineHeight:1.1, marginTop:3 }}>{hourLabel}</div>
                        {actionLine && <div style={{ marginTop:3, fontSize:8.6, fontWeight:900, color:'#145C38', letterSpacing:'.01em' }}>{actionLine}</div>}
                        <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4 }}>
                          <span style={{ fontSize:9.5, fontWeight:900, fontFamily:'var(--f-mono)', color:'var(--ink-2)' }}>{cicloOf(g)}</span>
                          <span style={{ fontSize:8, fontWeight:900, color:dark, background:light, borderRadius:999, padding:'1px 5px' }}>{isIcan ? 'I CAN' : n}</span>
                          {badge && <span style={{ marginLeft:'auto', fontSize:7.5, fontWeight:900, color:'#FFF', background:badgeBg, borderRadius:999, padding:'2px 5px' }}>{badge}</span>}
                        </div>
                      </button>;
                    })}
                    {!dayItems.length && <div style={{ height:58 }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function tvIcanSlotsF82CS18E(g){ return slotsFor(g, 'ican'); }
  function tvIcanDayIndexesF82CS18E(g){ return slotsFor(g, 'ican').map(s => s.day); }
  function tvIcanStartMinutesF82CS18E(g){ const ss = slotsFor(g, 'ican'); return ss.length ? ss[0].start : 9999; }
  function tvIcanHoraLabelF82CS18E(g){
    const ss = slotsFor(g, 'ican');
    if (!ss.length) return '';
    return ss.map(s => `${s.shortDay} ${s.hourLabel}`).join(' / ');
  }

  window.MisGruposSwitcher = MisGruposSwitcherCS18E;
  window.tvIcanSlotsF82CS18E = tvIcanSlotsF82CS18E;
  window.tvIcanDayIndexesF82 = tvIcanDayIndexesF82CS18E;
  window.tvIcanStartMinutesF82 = tvIcanStartMinutesF82CS18E;
  window.tvIcanHoraLabelF82 = tvIcanHoraLabelF82CS18E;
  try { MisGruposSwitcher = MisGruposSwitcherCS18E; } catch(_) {}
  try { tvIcanDayIndexesF82 = tvIcanDayIndexesF82CS18E; } catch(_) {}
  try { tvIcanStartMinutesF82 = tvIcanStartMinutesF82CS18E; } catch(_) {}
  try { tvIcanHoraLabelF82 = tvIcanHoraLabelF82CS18E; } catch(_) {}
})();
