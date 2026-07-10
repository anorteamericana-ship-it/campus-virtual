/* F98.4-Z6-CS21A20F · Tabla de leads ordenable y buscador por teléfono.
   Mantiene el orden de prioridad recibido hasta que el usuario selecciona una columna. */
(function(){
  const COLS = [
    { key:'cedula', label:'Cédula' },
    { key:'nombre', label:'Nombre' },
    { key:'telefono', label:'Teléfono' },
    { key:'grupo', label:'Grupo' },
    { key:'programa', label:'Programa' },
    { key:'financiamiento', label:'Financiam.' },
    { key:'etapa', label:'Etapa' },
    { key:'estado', label:'Estado' },
    { key:'dias', label:'Días' },
  ];

  const collator = new Intl.Collator('es', { sensitivity:'base', numeric:true, ignorePunctuation:true });
  const text = value => String(value == null ? '' : value).trim();
  const digits = value => text(value).replace(/\D/g, '');

  function sortValue(p, key){
    if(key === 'cedula') return digits(p.cedula) || text(p.cedula);
    if(key === 'nombre') return text(p.nombre);
    if(key === 'telefono') return digits(p.telefono || p.whatsapp);
    if(key === 'grupo') return text(p.grupo_tentativo);
    if(key === 'programa') return text(window.progLabel(p.programa));
    if(key === 'financiamiento') return text((window.FIN_MAP?.[p.financiamiento] || {}).label || p.financiamiento);
    if(key === 'etapa') return text((window.ETAPA_MAP?.[p.etapa] || {}).label || p.etapa);
    if(key === 'estado') return text(window.calcularEstadoEstudianteVentas(p)?.estado);
    if(key === 'dias') {
      const n = window.diasDesde(p.fecha_registro);
      return Number.isFinite(Number(n)) ? Number(n) : null;
    }
    return '';
  }

  function compareRows(a, b, key, dir){
    const av = sortValue(a.p, key);
    const bv = sortValue(b.p, key);
    let result = 0;

    if(key === 'dias'){
      const aNull = av == null;
      const bNull = bv == null;
      if(aNull && bNull) result = 0;
      else if(aNull) return 1;
      else if(bNull) return -1;
      else result = av - bv;
    } else {
      const aEmpty = !text(av);
      const bEmpty = !text(bv);
      if(aEmpty && bEmpty) result = 0;
      else if(aEmpty) return 1;
      else if(bEmpty) return -1;
      else result = collator.compare(text(av), text(bv));
    }

    if(result === 0) result = a.i - b.i;
    return dir === 'desc' ? -result : result;
  }

  function SortHeader({ col, sort, onSort }){
    const active = sort.key === col.key;
    const direction = active ? sort.dir : '';
    const ariaSort = !active ? 'none' : direction === 'asc' ? 'ascending' : 'descending';
    return (
      <th aria-sort={ariaSort}>
        <button
          type="button"
          className={`vx-sort-head${active ? ' active' : ''}`}
          onClick={() => onSort(col.key)}
          title={`Ordenar por ${col.label}`}
        >
          <span>{col.label}</span>
          <span className="vx-sort-icon" aria-hidden="true">{active ? (direction === 'asc' ? '▲' : '▼') : '↕'}</span>
        </button>
      </th>
    );
  }

  function SortableProspectoTable({ lista, onOpen }){
    const [sort, setSort] = React.useState({ key:'', dir:'asc' });

    const rows = React.useMemo(() => {
      const base = (Array.isArray(lista) ? lista : []).map((p, i) => ({ p, i }));
      if(!sort.key) return base.map(x => x.p);
      return base.sort((a, b) => compareRows(a, b, sort.key, sort.dir)).map(x => x.p);
    }, [lista, sort]);

    const onSort = key => {
      setSort(prev => prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir:'asc' });
    };

    return (
      <div className="vx-tablecard">
        <div className="vx-table-scroll">
          <table className="vx-table">
            <colgroup>
              <col style={{ width:'8.5%' }} />
              <col style={{ width:'19%' }} />
              <col style={{ width:'10.5%' }} />
              <col style={{ width:'12.5%' }} />
              <col style={{ width:'11%' }} />
              <col style={{ width:'9%' }} />
              <col style={{ width:'13%' }} />
              <col style={{ width:'10.5%' }} />
              <col style={{ width:'4%' }} />
              <col style={{ width:'7%' }} />
            </colgroup>
            <thead>
              <tr>
                {COLS.map(col => <SortHeader key={col.key} col={col} sort={sort} onSort={onSort} />)}
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => {
                const dias = window.diasDesde(p.fecha_registro);
                const prio = window.calcularPrioridadProspecto(p);
                const est = window.calcularEstadoEstudianteVentas(p);
                return (
                  <tr key={p.cedula || p.id || i} className={prio.nivel === 'rojo' ? 'vx-row-rojo' : ''} onClick={() => onOpen(p)}>
                    <td className="vx-td-ced" title={text(p.cedula)}>{p.cedula}</td>
                    <td className="vx-td-name" title={text(p.nombre)}>{p.nombre}</td>
                    <td title={text(window.fmtTelV(p.telefono))}>
                      <span className="vx-tel">
                        <window.WaLink tel={p.whatsapp || p.telefono} className="vx-wa-mini"><window.Vico d={window.VI.wa} size={15} fill="currentColor" /></window.WaLink>
                        {window.fmtTelV(p.telefono)}
                      </span>
                    </td>
                    <td className="vx-td-grupo" title={text(p.grupo_tentativo || '—')}>{p.grupo_tentativo || '—'}</td>
                    <td className="vx-td-prog" title={text(window.progLabel(p.programa))}>{window.progLabel(p.programa)}</td>
                    <td><window.FinBadge financiamiento={p.financiamiento} /></td>
                    <td><window.EtapaBadge etapa={p.etapa} /></td>
                    <td><window.EstadoBadge est={est} /></td>
                    <td className="vx-td-dias">{dias != null ? <><b>{dias}</b> d</> : '—'}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="vx-rowacts">
                        <button className="vx-iconbtn ver" onClick={() => onOpen(p)}><window.Vico d={window.VI.eye} size={13} /> Ver</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function FilterBarTelefono({ filtro, setFiltro, resultCount }) {
    const upd = (key, value) => setFiltro(prev => ({ ...prev, [key]: value }));
    const limpiar = () => setFiltro({ etapa:'', fin:'', q:'' });
    const activos = filtro.etapa || filtro.fin || filtro.q;

    return (
      <div className="vx-filters">
        <div className="vx-field">
          <span className="vx-field-lbl">Financiamiento</span>
          <select className="vx-select" value={filtro.fin} onChange={e => upd('fin', e.target.value)}>
            <option value="">Todos</option>
            <option value="CONAPE">CONAPE</option>
            <option value="BECA">Beca 25%</option>
            <option value="PROPIO">Pago propio</option>
          </select>
        </div>
        <div className="vx-field vx-search">
          <span className="vx-field-lbl">Buscar</span>
          <div className="vx-search-box">
            <window.Vico d={window.VI.search} size={15} />
            <input
              type="search"
              inputMode="search"
              placeholder="Nombre, cédula o teléfono…"
              aria-label="Buscar por nombre, cédula o teléfono"
              value={filtro.q}
              onChange={e => upd('q', e.target.value)}
            />
          </div>
        </div>
        {activos ? <button className="vx-clear" onClick={limpiar}>Limpiar filtros</button> : null}
        <div className="vx-result-count">{resultCount} prospecto{resultCount === 1 ? '' : 's'}</div>
      </div>
    );
  }

  window.FilterBar = FilterBarTelefono;
  window.ProspectoTable = SortableProspectoTable;
})();