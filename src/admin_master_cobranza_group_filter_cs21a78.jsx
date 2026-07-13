// F98.4-Z6-CS21A78 · Panel Maestro Cobranza · filtro local por grupo
/* global React */
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A78';
  const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const NO_GROUP = '__SIN_GRUPO__';

  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  function groupOf(row) {
    return text(row && (row.group || row.grupo || row.COD_GRUPO || row.GRUPO));
  }

  function phoneForWhatsApp(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    return digits.length === 8 ? `506${digits}` : digits;
  }

  function movementLabel(value) {
    const key = String(value || '').toUpperCase();
    return ({
      PRIMER_DESEMBOLSO: 'Primer desembolso',
      NUEVO_DESEMBOLSO: 'Nuevo desembolso',
      DESEMBOLSO_MES_ACTUAL: 'Desembolso del mes',
      DESEMBOLSO_REPORTADO: 'Desembolso reportado',
      APROBADO_SIN_DESEMBOLSO: 'Aprobado sin desembolso',
      DESEMBOLSO_REMOVIDO: 'Desembolso retirado',
    })[key] || String(value || '').replaceAll('_', ' ');
  }

  function token() {
    return typeof window.getSessionToken === 'function' ? window.getSessionToken() : '';
  }

  async function action(fn, payload = {}) {
    const response = await fetch(`${window.APPS_SCRIPT_URL}?fn=${encodeURIComponent(fn)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ fn, token: token(), ...payload }),
    });
    const raw = await response.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : null; }
    catch (_) { throw new Error(`Apps Script respondió texto/HTML en ${fn}.`); }
    if (!response.ok || !data || data.ok !== true) {
      throw new Error((data && (data.mensaje || data.error)) || `No se pudo ejecutar ${fn}.`);
    }
    return data;
  }

  function isReportedDisbursement(row) {
    const type = String(row && row.type || '').toUpperCase();
    if (['PRIMER_DESEMBOLSO','NUEVO_DESEMBOLSO','DESEMBOLSO_MES_ACTUAL','DESEMBOLSO_REPORTADO'].includes(type)) return true;
    return Boolean(row && row.disbursement) && !['APROBADO_SIN_DESEMBOLSO','DESEMBOLSO_REMOVIDO'].includes(type);
  }

  function summaryFor(rows, original, filtered) {
    if (!filtered) return original || {};
    const linked = rows.filter(row => Boolean(row && row.linked)).length;
    return {
      total: rows.length,
      linked,
      unlinked: rows.length - linked,
      newDisbursement: rows.filter(isReportedDisbursement).length,
    };
  }

  function Empty({ group }) {
    return (
      <div className="master-empty" style={{ padding:'34px 22px', textAlign:'center' }}>
        <strong style={{ display:'block', color:'#16294f', marginBottom:6 }}>Sin movimientos para este filtro</strong>
        <span style={{ fontSize:12, color:'var(--ink-3)' }}>
          {group ? `CONAPE no reporta movimientos del mes para ${group === NO_GROUP ? 'registros sin grupo' : group}.` : 'CONAPE todavía no reporta movimientos con fecha del mes actual.'}
        </span>
      </div>
    );
  }

  function MasterConapeMovementsTableCS21A78({ data, onRefresh }) {
    const movements = data?.conape?.movements || {};
    const allRows = Array.isArray(movements.rows) ? movements.rows : [];
    const [selectedGroup, setSelectedGroup] = React.useState('');
    const [busy, setBusy] = React.useState(false);
    const [message, setMessage] = React.useState('');

    const groups = React.useMemo(() => {
      const unique = new Set(allRows.map(groupOf).filter(Boolean));
      return Array.from(unique).sort((a, b) => a.localeCompare(b, 'es', { numeric:true, sensitivity:'base' }));
    }, [allRows]);

    const hasNoGroup = React.useMemo(() => allRows.some(row => !groupOf(row)), [allRows]);

    React.useEffect(() => {
      if (!selectedGroup) return;
      if (selectedGroup === NO_GROUP && hasNoGroup) return;
      if (groups.includes(selectedGroup)) return;
      setSelectedGroup('');
    }, [selectedGroup, groups.join('|'), hasNoGroup]);

    const rows = React.useMemo(() => {
      if (!selectedGroup) return allRows;
      if (selectedGroup === NO_GROUP) return allRows.filter(row => !groupOf(row));
      return allRows.filter(row => groupOf(row) === selectedGroup);
    }, [allRows, selectedGroup]);

    const summary = summaryFor(rows, movements.summary, Boolean(selectedGroup));
    const monthName = MONTHS[Math.max(0, Number(movements.month || 1) - 1)] || 'Mes actual';
    const activeLabel = selectedGroup === NO_GROUP ? 'Sin grupo' : selectedGroup;

    const refresh = async () => {
      setBusy(true);
      setMessage('');
      try {
        const result = await action('actualizarPanelConapeAhora');
        setMessage(result.mensaje || 'CONAPE actualizado.');
        if (typeof onRefresh === 'function') await onRefresh();
      } catch (error) {
        setMessage(error && error.message ? error.message : String(error));
      } finally {
        setBusy(false);
      }
    };

    return (
      <section className="master-card master-conape-month-card" data-cs21a78-group-filter="true">
        <header>
          <div>
            <span>Seguimiento inmediato</span>
            <h3>Movimientos CONAPE · {monthName} {movements.year || new Date().getFullYear()}</h3>
            <p>
              Consulta en vivo y memoria mensual de desembolsos · última lectura {movements.lastSync || 'sin sincronizar'}
              {selectedGroup ? ` · Grupo: ${activeLabel}` : ''}
            </p>
          </div>
          <div className="master-conape-month-actions" style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:8, flexWrap:'wrap' }}>
            <label style={{ display:'grid', gap:3, minWidth:220 }}>
              <span style={{ fontSize:9, fontWeight:900, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--ink-3)' }}>Filtrar por grupo</span>
              <select
                value={selectedGroup}
                onChange={event => setSelectedGroup(event.target.value)}
                aria-label="Filtrar Seguimiento inmediato por grupo"
                style={{ height:36, minWidth:220, border:'1px solid var(--line)', borderRadius:9, padding:'0 34px 0 10px', background:'#fff', color:'var(--ink)', fontFamily:'inherit', fontSize:11, fontWeight:800, cursor:'pointer' }}
              >
                <option value="">Todos los grupos ({allRows.length})</option>
                {groups.map(group => <option key={group} value={group}>{group} ({allRows.filter(row => groupOf(row) === group).length})</option>)}
                {hasNoGroup && <option value={NO_GROUP}>Sin grupo ({allRows.filter(row => !groupOf(row)).length})</option>}
              </select>
            </label>
            <span className={`master-live-chip ${(movements.monitor || []).some(item => item.handler === 'sincronizarCONAPE') ? 'on' : 'off'}`}>
              {(movements.monitor || []).some(item => item.handler === 'sincronizarCONAPE') ? 'Monitoreo horario' : 'Monitoreo manual'}
            </span>
            <button type="button" onClick={refresh} disabled={busy}>{busy ? 'Consultando…' : '↻ Actualizar CONAPE ahora'}</button>
          </div>
        </header>

        <div className="master-conape-month-kpis">
          <div><b>{summary.total || 0}</b><span>movimientos del filtro</span></div>
          <div><b>{summary.linked || 0}</b><span>vinculados al Campus</span></div>
          <div><b>{summary.unlinked || 0}</b><span>por vincular</span></div>
          <div><b>{summary.newDisbursement || 0}</b><span>desembolsos reportados</span></div>
        </div>

        {message && <div className="master-conape-month-msg">{message}</div>}

        <div className="master-conape-month-table-wrap">
          <table className="master-conape-month-table">
            <thead><tr><th>Estudiante</th><th>Movimiento</th><th>Desembolso</th><th>Periodo</th><th>Campus</th><th>Detectado</th><th>Contacto</th></tr></thead>
            <tbody>
              {rows.map((row, index) => {
                const phone = phoneForWhatsApp(row.phone);
                const firstName = String(row.name || '').split(' ')[0];
                const reminder = `Hola ${firstName}, CONAPE actualizó el desembolso ${row.disbursement || ''} correspondiente a ${monthName} ${row.year || ''}. Te recordamos mantener tu pago puntual con la Academia Norteamericana. Muchas gracias.`;
                return (
                  <tr key={row.id || `${row.cedula}-${index}`} className={!row.linked ? 'has-alert' : ''}>
                    <td><strong>{row.name || 'Sin nombre'}</strong><small>{row.cedula}{row.code ? ` · ${row.code}` : ''}</small></td>
                    <td><span className="master-conape-movement-badge">{movementLabel(row.type)}</span></td>
                    <td><b>#{row.disbursement || '—'}</b><small>{row.eventDate || '—'}</small></td>
                    <td>{String(row.month || '').padStart(2, '0')}/{row.year || '—'}</td>
                    <td>{row.linked ? <span className="master-link-status linked">Vinculado</span> : <span className="master-link-status unlinked">Sin vínculo</span>}<small>{groupOf(row) || 'Sin grupo'}</small></td>
                    <td>{row.detectedAt || '—'}</td>
                    <td>{phone ? <a className="master-wa-action" href={`https://wa.me/${phone}?text=${encodeURIComponent(reminder)}`} target="_blank" rel="noreferrer">WA Recordar pago</a> : <span className="master-no-phone">Sin teléfono</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!rows.length && <Empty group={selectedGroup} />}
        </div>
      </section>
    );
  }

  MasterConapeMovementsTableCS21A78.__cs21a78GroupFilter = true;

  function install() {
    const current = window.MasterConapeMovementsTable;
    if (typeof current !== 'function') return false;
    if (current.__cs21a78GroupFilter === true) return true;
    MasterConapeMovementsTableCS21A78.__base = current;
    window.MasterConapeMovementsTable = MasterConapeMovementsTableCS21A78;
    try { MasterConapeMovementsTable = MasterConapeMovementsTableCS21A78; } catch (_) {}
    return true;
  }

  function installBurst() {
    [0, 40, 120, 300, 800].forEach(delay => window.setTimeout(install, delay));
  }

  window.addEventListener('an:lazy-module-loaded', installBurst);
  installBurst();
  const probe = window.setInterval(install, 250);
  window.setTimeout(() => window.clearInterval(probe), 30000);
  window.__AN_MASTER_COBRANZA_GROUP_FILTER_VERSION__ = VERSION;
})();
