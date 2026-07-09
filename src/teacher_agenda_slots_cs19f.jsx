// F98.4-Z6-CS19F · Agenda docente estable post-presentación por slots reales + modo Club I CAN aislado
// Usa agenda_slots reales cuando el backend los entrega; mantiene fallback seguro.
// Cada docente ve sus grupos reales; Keylor solo usa su máscara cuando el backend demo está activo.
// Mantiene la regla visual: mañana arriba, noche abajo, colores por tipo/nivel. En Club I CAN muestra solo sesiones I CAN.
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
    B1:{ dark:'#B77900', light:'#FFF7D6', border:'#D79A15' },
    B2:{ dark:'#A32424', light:'#FDE8E8', border:'#C94949' },
    I1:{ dark:'#074C8E', light:'#E8F2FF', border:'#0B5FAE' },
    I2:{ dark:'#16834A', light:'#EAF8EF', border:'#29985F' },
  };
  const ICAN_COLOR = { dark:'#5B2182', light:'#F7EEFF', border:'#8A4FB4', badge:'#6B2A8D' };
  const STATUS_COLOR = { next:'#16834A', active:'#C62828', selected:'#003B78' };

  function injectAgendaSlotsStyleCS19F(){
    if (typeof document === 'undefined' || document.getElementById('an-cs19f-teacher-agenda-style')) return;
    const style = document.createElement('style');
    style.id = 'an-cs19f-teacher-agenda-style';
    style.textContent = `
      .cs19f-agenda-card{
        appearance:none; -webkit-appearance:none;
        transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease, background .14s ease;
        outline:none; user-select:none; -webkit-user-select:none;
      }
      .cs19f-agenda-card:hover{ transform: translateY(-1px); }
      .cs19f-agenda-card:active{ transform: translateY(0); }
      .cs19f-agenda-card:focus-visible{ outline:3px solid rgba(0,59,120,.24); outline-offset:2px; }
      .cs19f-agenda-card *{ pointer-events:none; }
      .cs19f-agenda-row{ min-height:78px; display:grid; align-content:start; gap:7px; }
      .cs19f-agenda-row-empty{ min-height:78px; border:1px dashed rgba(15,23,42,.07); border-radius:12px; background:rgba(15,23,42,.015); }
      @media (prefers-reduced-motion: reduce){ .cs19f-agenda-card{ transition:none; } .cs19f-agenda-card:hover{ transform:none; } }
      @media (max-width: 860px){ .cs19f-agenda-card{ min-width:118px; } }
    `;
    document.head.appendChild(style);
  }
  injectAgendaSlotsStyleCS19F();


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
  function nivelColor(n){ return LEVEL_COLOR[upper(n)] || { dark:'var(--an-navy)', light:'#E8F2FF', border:'var(--an-navy)' }; }
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
  function slotsFromAgendaArrays(g, riel){
    const arrays = [g && g.agenda_slots, g && g.agendaSlots, g && g.agenda_items, g && g.horarios_semana, g && g.agenda_semanal].filter(Array.isArray);
    if (!arrays.length) return [];
    const raw = arrays[0].filter(x => {
      const rr = clean(x && (x.riel || x.tipo || x.TIPO)).toLowerCase();
      if (riel === 'ican') return rr.indexOf('ican') >= 0;
      return rr === 'curso' || rr === 'leccion' || rr === 'clase' || rr === '' || rr.indexOf('eval') < 0 && rr.indexOf('progress') < 0 && rr.indexOf('ican') < 0;
    });
    const seen = new Set();
    return raw.map(x => normalizeSlot(x, x && (x.dias || x.dia_code || x.day_code || x.dia_label), x && (x.hora_i || x.hora_inicio || x.start), x && (x.hora_f || x.hora_fin || x.end)))
      .filter(Boolean)
      .filter(sl => { const k = `${sl.day}-${sl.hora_i}-${sl.hora_f}-${sl.hourLabel}`; if (seen.has(k)) return false; seen.add(k); return true; });
  }
  function slotsFor(g, riel){
    const agendaSlots = slotsFromAgendaArrays(g, riel);
    if (agendaSlots.length) return agendaSlots;
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

  function rowOfSlot(slot){
    const s = Number(slot && slot.start);
    if (!Number.isFinite(s) || s === 9999) return 'top';
    // Regla visual pedida: horarios de noche 6pm-9pm abajo.
    // Súper intensivo 9am-4pm y Club I CAN de mañana se mantienen arriba.
    return s >= (12 * 60) ? 'bottom' : 'top';
  }
  function nextRank(item){
    const now = new Date();
    const today = now.getDay();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    let dd = Number(item.slot.day) - today;
    if (dd < 0 || (dd === 0 && Number(item.slot.start || 9999) < nowMin)) dd += 7;
    return dd * 1440 + Number(item.slot.start || 9999);
  }
  function currentAgendaMode(){
    let hash = '';
    try { hash = String(window.location && window.location.hash || '').toLowerCase(); } catch(_) {}
    if (/club|ican/.test(hash)) return 'ican';
    if (/mis|grupo|cronograma|docente|teacher|asistencia|calificar/.test(hash)) return 'all';
    if (window.__AN_TEACHER_AGENDA_VIEW_MODE === 'ican') return 'ican';
    return 'all';
  }
  function setAgendaMode(mode){
    window.__AN_TEACHER_AGENDA_VIEW_MODE = mode === 'ican' ? 'ican' : 'all';
    try { document.body.setAttribute('data-teacher-agenda-mode', window.__AN_TEACHER_AGENDA_VIEW_MODE); } catch(_) {}
  }
  function buildWeeklyItems(lista, mode){
    mode = mode || currentAgendaMode();
    const byDay = new Map(WEEK.map(d => [d.key, []]));
    lista.forEach(g => {
      if (mode !== 'ican' && g && g.puede_curso !== false) {
        slotsFor(g, 'curso').forEach(sl => {
          if (byDay.has(sl.day)) byDay.get(sl.day).push({ g, riel:'curso', slot:sl, start:sl.start });
        });
      }
      const hasIcan = g && (mode !== 'curso') && (g.puede_ican === true || g.puede_ican == null || slotsFor(g, 'ican').length > 0);
      if (hasIcan) {
        slotsFor(g, 'ican').forEach(sl => {
          if (byDay.has(sl.day)) byDay.get(sl.day).push({ g, riel:'ican', slot:sl, start:sl.start });
        });
      }
    });
    byDay.forEach(items => items.sort((a,b) => a.start - b.start || String(a.riel).localeCompare(String(b.riel)) || codeOf(a.g).localeCompare(codeOf(b.g))));
    return byDay;
  }
  function computeAutoNextKeys(byDay){
    const all = [];
    byDay.forEach(items => items.forEach(it => all.push(it)));
    const best = {};
    all.forEach(it => {
      const key = `${it.riel}:${codeOf(it.g)}`;
      const rank = nextRank(it);
      if (!best[key] || rank < best[key].rank) best[key] = { item:it, rank };
    });
    const out = new Set();
    Object.values(best).forEach(v => {
      const it = v.item;
      out.add(`${it.riel}:${codeOf(it.g)}:${it.slot.day}:${it.slot.hora_i || it.slot.hourLabel}:${it.slot.hora_f || ''}`);
    });
    return out;
  }
  function itemKey(it){ return `${it.riel}:${codeOf(it.g)}:${it.slot.day}:${it.slot.hora_i || it.slot.hourLabel}:${it.slot.hora_f || ''}`; }

  function MisGruposSwitcherCS19F({ grupos, activo, onSelect, activeSession }) {
    const lista = Array.isArray(grupos) ? grupos : [];
    const mode = currentAgendaMode();
    const byDay = buildWeeklyItems(lista, mode);
    const autoNextKeys = computeAutoNextKeys(byDay);
    const Card = ({ it, idx }) => {
      const { g, riel, slot } = it;
      const cod = codeOf(g);
      const active = String(cod) === String(activo);
      const n = nivelId(g);
      const pal = nivelColor(n);
      const isIcan = riel === 'ican';
      const aRiel = activeRielOf(activeSession);
      const sessionHere = upper(activeSession && (activeSession.ESTADO || activeSession.estado)) === 'ABIERTA' && String(activeSession && (activeSession.COD_GRUPO || activeSession.cod_grupo || activeSession.grupo || '')) === String(cod) && aRiel === riel;
      const dark = isIcan ? '#57217F' : pal.dark;
      const light = isIcan ? '#EADCF5' : pal.light;
      const explicitNext = isNextSlot(g, riel, slot);
      const nextHere = explicitNext || autoNextKeys.has(itemKey(it));
      const daysLabel = isIcan ? 'Club I CAN' : groupDaysLabel(g);
      const hourLabel = slot.hourLabel || 'Horario pendiente';
      const title = isIcan ? `Club I CAN · ${slot.dayLabel} de ${hourLabel} - ${cicloOf(g)}` : `${groupDaysLabel(g)} de ${hourLabel} - ${cicloOf(g)}`;
      const palette = isIcan ? ICAN_COLOR : { dark:pal.dark, light:pal.light, border:pal.border || pal.dark, badge:pal.dark };
      const badge = sessionHere ? 'ACTIVA' : nextHere ? 'PRÓXIMA' : active ? 'SELECCIONADO' : '';
      const badgeBg = sessionHere ? STATUS_COLOR.active : nextHere ? STATUS_COLOR.next : (isIcan ? ICAN_COLOR.badge : STATUS_COLOR.selected);
      const actionLine = nextHere && canOperate(g, riel) ? (isIcan ? 'Activar / pasar lista' : 'Activar clase') : '';
      const bg = sessionHere ? '#FFF1F1' : (active || nextHere ? palette.light : (isIcan ? '#FFFBFF' : '#FFFFFF'));
      const borderColor = sessionHere ? STATUS_COLOR.active : (active || nextHere ? palette.border : 'rgba(15,23,42,.12)');
      const shadow = sessionHere
        ? '0 0 0 2px rgba(198,40,40,.12), 0 8px 18px rgba(198,40,40,.08)'
        : nextHere
          ? (isIcan ? '0 0 0 2px rgba(91,33,130,.10), 0 8px 18px rgba(91,33,130,.10)' : '0 0 0 2px rgba(7,76,142,.08), 0 8px 18px rgba(7,76,142,.08)')
          : active
            ? (isIcan ? '0 0 0 2px rgba(91,33,130,.14), 0 8px 18px rgba(91,33,130,.08)' : '0 0 0 2px rgba(0,59,120,.11), 0 8px 18px rgba(0,59,120,.07)')
            : '0 2px 8px rgba(8,30,60,.045)';
      return <button className="cs19f-agenda-card" key={`${cod}-${riel}-${slot.day}-${slot.hora_i || idx}-${slot.hora_f || ''}`} type="button" onClick={() => onSelect && onSelect(cod)} title={title} style={{
        border:`1.5px solid ${borderColor}`,
        borderLeft:`5px solid ${sessionHere ? STATUS_COLOR.active : palette.border}`,
        background:bg, borderRadius:12, padding:'8px 10px', textAlign:'left', cursor:'pointer', fontFamily:'inherit',
        boxShadow:shadow, position:'relative', height:76, minHeight:76, width:'100%', overflow:'hidden',
        display:'flex', flexDirection:'column', justifyContent:'space-between', color:'inherit'
      }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:10.2, fontWeight:900, color:isIcan ? ICAN_COLOR.dark : 'var(--ink)', lineHeight:1.15, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{daysLabel}</div>
          <div style={{ fontSize:15.5, fontWeight:900, color:isIcan ? ICAN_COLOR.dark : 'var(--an-navy)', lineHeight:1.05, marginTop:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{hourLabel}</div>
          {actionLine && <div style={{ marginTop:3, fontSize:8.3, fontWeight:900, color:STATUS_COLOR.next, letterSpacing:'.005em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{actionLine}</div>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4, minWidth:0 }}>
          <span style={{ fontSize:9.2, fontWeight:900, fontFamily:'var(--f-mono)', color:'var(--ink-2)', flex:'0 0 auto' }}>{cicloOf(g)}</span>
          <span style={{ fontSize:7.8, fontWeight:900, color:palette.dark, background:palette.light, border:`1px solid ${isIcan ? 'rgba(91,33,130,.14)' : 'rgba(7,76,142,.10)'}`, borderRadius:999, padding:'1px 5px', flex:'0 0 auto' }}>{isIcan ? 'I CAN' : n}</span>
          {badge && <span style={{ marginLeft:'auto', fontSize:7.2, fontWeight:900, color:'#FFF', background:badgeBg, borderRadius:999, padding:'2px 5px', maxWidth:76, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{badge}</span>}
        </div>
      </button>;
    };
    return (
      <div className="card" style={{ marginBottom:18, padding:0, background:'#FBF7EF', width:'100%', maxWidth:'100%', minWidth:0, overflow:'hidden' }}>
        {mode === 'ican' && <div style={{padding:'9px 12px',fontSize:10.5,fontWeight:900,letterSpacing:'.08em',textTransform:'uppercase',color:'#57217F',background:'#F7EEFF',borderBottom:'1px solid rgba(91,33,130,.16)'}}>Agenda semanal · Club I CAN</div>}
        <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
          <div style={{ minWidth:980, display:'grid', gridTemplateColumns:'repeat(7, minmax(128px, 1fr))', borderTop:'1px solid var(--line)', borderLeft:'1px solid var(--line)' }}>
            {WEEK.map(day => {
              const dayItems = byDay.get(day.key) || [];
              const topItems = dayItems.filter(it => rowOfSlot(it.slot) === 'top');
              const bottomItems = dayItems.filter(it => rowOfSlot(it.slot) === 'bottom');
              return (
                <div key={day.key} style={{ minHeight:194, borderRight:'1px solid var(--line)', borderBottom:'1px solid var(--line)', background:'#FFF' }}>
                  <div style={{ padding:'11px 8px', textAlign:'center', fontSize:11, fontWeight:900, letterSpacing:'.08em', color:'var(--ink-2)', borderBottom:'1px solid var(--line)', background:'#F7F3EC' }}>{day.label}</div>
                  <div style={{ display:'grid', gridTemplateRows:'minmax(78px, auto) minmax(78px, auto)', gap:8, padding:8 }}>
                    <div className="cs19f-agenda-row">
                      {topItems.length ? topItems.map((it, idx) => <Card key={`top-${itemKey(it)}-${idx}`} it={it} idx={idx}/>) : <div className="cs19f-agenda-row-empty" aria-hidden="true" />}
                    </div>
                    <div className="cs19f-agenda-row">
                      {bottomItems.length ? bottomItems.map((it, idx) => <Card key={`bottom-${itemKey(it)}-${idx}`} it={it} idx={idx}/>) : <div className="cs19f-agenda-row-empty" aria-hidden="true" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function tvIcanSlotsF82CS19F(g){ return slotsFor(g, 'ican'); }
  function tvIcanDayIndexesF82CS19F(g){ return slotsFor(g, 'ican').map(s => s.day); }
  function tvIcanStartMinutesF82CS19F(g){ const ss = slotsFor(g, 'ican'); return ss.length ? ss[0].start : 9999; }
  function tvIcanHoraLabelF82CS19F(g){
    const ss = slotsFor(g, 'ican');
    if (!ss.length) return '';
    return ss.map(s => `${s.shortDay} ${s.hourLabel}`).join(' / ');
  }


  function installViewModeWrappersCS19F(){
    if (window.__AN_TEACHER_AGENDA_VIEW_MODE_WRAPPED_CS19F) return;
    window.__AN_TEACHER_AGENDA_VIEW_MODE_WRAPPED_CS19F = true;
    const OriginalCronograma = window.CronogramaDocenteSeguroF82;
    const OriginalGrupos = window.GruposView;
    if (typeof OriginalGrupos === 'function') {
      window.GruposView = function GruposViewCS19F(props){
        setAgendaMode('all');
        return R.createElement(OriginalGrupos, props || {});
      };
      try { GruposView = window.GruposView; } catch(_) {}
    }
    if (typeof OriginalCronograma === 'function') {
      window.CronogramaDocenteSeguroF82 = function CronogramaDocenteSeguroCS19F(props){
        setAgendaMode(props && props.onlyIcan ? 'ican' : 'all');
        return R.createElement(OriginalCronograma, props || {});
      };
      try { CronogramaDocenteSeguroF82 = window.CronogramaDocenteSeguroF82; } catch(_) {}
    }
    window.ClubICANDocenteView = function ClubICANDocenteViewCS19F(props){
      setAgendaMode('ican');
      const C = window.CronogramaDocenteSeguroF82 || OriginalCronograma;
      return typeof C === 'function' ? R.createElement(C, Object.assign({}, props || {}, { onlyIcan:true })) : null;
    };
    try { ClubICANDocenteView = window.ClubICANDocenteView; } catch(_) {}
  }

  window.__AN_TEACHER_AGENDA_SLOTS_VERSION = 'F98.4-Z6-CS19F';
  window.anTeacherAgendaSlotsDebugCS19F = function(grupos){
    const lista = Array.isArray(grupos) ? grupos : [];
    const byDay = buildWeeklyItems(lista, currentAgendaMode());
    const out = {};
    byDay.forEach((items, day) => {
      out[DAY_LABEL[day] || day] = items.map(it => ({
        grupo: codeOf(it.g), nivel: nivelId(it.g), riel: it.riel,
        dia: it.slot.day, horario: it.slot.hourLabel, row: rowOfSlot(it.slot), start: it.slot.start
      }));
    });
    return { version:'F98.4-Z6-CS19F', mode:currentAgendaMode(), dias:out };
  };
  window.anTeacherAgendaSlotsDebug = window.anTeacherAgendaSlotsDebugCS19F;

  try { window.addEventListener('hashchange', () => { if (!/ican|club/.test(String(location.hash || '').toLowerCase())) setAgendaMode('all'); }); } catch(_) {}
  installViewModeWrappersCS19F();
  window.MisGruposSwitcher = MisGruposSwitcherCS19F;
  window.tvIcanSlotsF82CS19F = tvIcanSlotsF82CS19F;
  window.tvIcanDayIndexesF82 = tvIcanDayIndexesF82CS19F;
  window.tvIcanStartMinutesF82 = tvIcanStartMinutesF82CS19F;
  window.tvIcanHoraLabelF82 = tvIcanHoraLabelF82CS19F;
  try { MisGruposSwitcher = MisGruposSwitcherCS19F; } catch(_) {}
  try { tvIcanDayIndexesF82 = tvIcanDayIndexesF82CS19F; } catch(_) {}
  try { tvIcanStartMinutesF82 = tvIcanStartMinutesF82CS19F; } catch(_) {}
  try { tvIcanHoraLabelF82 = tvIcanHoraLabelF82CS19F; } catch(_) {}
})();
