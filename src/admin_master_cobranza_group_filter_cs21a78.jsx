// F98.4-Z6-CS21A78 · Panel Maestro Cobranza · filtro local por grupo
/* global React */
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A78';
  const NO_GROUP = '__SIN_GRUPO__';

  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  function groupOf(row) {
    return text(row && (row.group || row.grupo || row.COD_GRUPO || row.GRUPO));
  }

  function uniqueGroups(rows) {
    return Array.from(new Set((rows || []).map(groupOf).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'es', { numeric:true, sensitivity:'base' }));
  }

  function countGroup(rows, group) {
    if (group === NO_GROUP) return (rows || []).filter(row => !groupOf(row)).length;
    return (rows || []).filter(row => groupOf(row) === group).length;
  }

  function cloneDataWithRows(data, rows) {
    const base = data || {};
    const conape = { ...(base.conape || {}) };
    conape.movements = { ...(conape.movements || {}), rows };
    return { ...base, conape };
  }

  function FilterBar({ rows, selected, onChange }) {
    const groups = React.useMemo(() => uniqueGroups(rows), [rows]);
    const hasNoGroup = React.useMemo(() => (rows || []).some(row => !groupOf(row)), [rows]);
    const visibleCount = selected ? countGroup(rows, selected) : (rows || []).length;
    const selectedLabel = selected === NO_GROUP ? 'Sin grupo' : selected;

    return (
      <section
        className="master-card"
        data-cs21a78-group-filter="true"
        style={{
          marginBottom:10,
          padding:'12px 14px',
          display:'flex',
          alignItems:'center',
          justifyContent:'space-between',
          gap:14,
          flexWrap:'wrap',
          borderLeft:'4px solid #bf403b',
        }}
      >
        <div style={{ minWidth:220 }}>
          <span style={{ display:'block', fontSize:9, fontWeight:950, letterSpacing:'.12em', textTransform:'uppercase', color:'#bf403b' }}>
            Seguimiento inmediato
          </span>
          <strong style={{ display:'block', marginTop:3, color:'#16294f', fontSize:14 }}>
            Filtrar desembolsos por grupo
          </strong>
          <small style={{ display:'block', marginTop:3, color:'var(--ink-3)' }}>
            {selected ? `${visibleCount} registro${visibleCount === 1 ? '' : 's'} de ${selectedLabel}` : `${visibleCount} registros de todos los grupos`}
          </small>
        </div>

        <label style={{ display:'grid', gap:4, minWidth:270 }}>
          <span style={{ fontSize:9, fontWeight:900, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--ink-3)' }}>
            Grupo
          </span>
          <select
            value={selected}
            onChange={event => onChange(event.target.value)}
            aria-label="Filtrar Seguimiento inmediato por grupo"
            style={{
              width:'100%',
              height:38,
              border:'1px solid #D9D2C7',
              borderRadius:9,
              padding:'0 34px 0 11px',
              background:'#fff',
              color:'#263650',
              fontFamily:'inherit',
              fontSize:11,
              fontWeight:800,
              cursor:'pointer',
              outline:'none',
            }}
          >
            <option value="">Todos los grupos ({(rows || []).length})</option>
            {groups.map(group => (
              <option key={group} value={group}>{group} ({countGroup(rows, group)})</option>
            ))}
            {hasNoGroup && <option value={NO_GROUP}>Sin grupo ({countGroup(rows, NO_GROUP)})</option>}
          </select>
        </label>
      </section>
    );
  }

  function createWrappedComponent(Base) {
    function MasterConapeMovementsWithGroupFilterCS21A78(props) {
      const data = props && props.data ? props.data : {};
      const sourceRows = Array.isArray(data?.conape?.movements?.rows)
        ? data.conape.movements.rows
        : [];
      const [selectedGroup, setSelectedGroup] = React.useState('');
      const groups = React.useMemo(() => uniqueGroups(sourceRows), [sourceRows]);
      const hasNoGroup = React.useMemo(() => sourceRows.some(row => !groupOf(row)), [sourceRows]);

      React.useEffect(() => {
        if (!selectedGroup) return;
        if (selectedGroup === NO_GROUP && hasNoGroup) return;
        if (groups.includes(selectedGroup)) return;
        setSelectedGroup('');
      }, [selectedGroup, groups.join('|'), hasNoGroup]);

      const filteredRows = React.useMemo(() => {
        if (!selectedGroup) return sourceRows;
        if (selectedGroup === NO_GROUP) return sourceRows.filter(row => !groupOf(row));
        return sourceRows.filter(row => groupOf(row) === selectedGroup);
      }, [sourceRows, selectedGroup]);

      const filteredData = selectedGroup ? cloneDataWithRows(data, filteredRows) : data;

      return (
        <>
          <FilterBar rows={sourceRows} selected={selectedGroup} onChange={setSelectedGroup} />
          <Base key={selectedGroup || 'TODOS_LOS_GRUPOS'} {...props} data={filteredData} />
        </>
      );
    }

    MasterConapeMovementsWithGroupFilterCS21A78.__cs21a78GroupFilter = true;
    MasterConapeMovementsWithGroupFilterCS21A78.__base = Base;
    return MasterConapeMovementsWithGroupFilterCS21A78;
  }

  function install() {
    const current = window.MasterConapeMovementsTable;
    if (typeof current !== 'function') return false;
    if (current.__cs21a78GroupFilter === true) return true;
    const wrapped = createWrappedComponent(current);
    window.MasterConapeMovementsTable = wrapped;
    try { MasterConapeMovementsTable = wrapped; } catch (_) {}
    window.__AN_MASTER_COBRANZA_GROUP_FILTER_VERSION__ = VERSION;
    return true;
  }

  function installBurst() {
    [0, 30, 80, 180, 400, 900].forEach(delay => window.setTimeout(install, delay));
  }

  window.addEventListener('an:lazy-module-loaded', installBurst);
  installBurst();

  // Otros parches del Panel Maestro también se instalan de forma diferida.
  // La sonda conserva CS21A78 como la última envoltura sin reemplazar su contenido.
  const probe = window.setInterval(install, 250);
  window.setTimeout(() => window.clearInterval(probe), 30000);
})();
