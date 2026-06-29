// F98.4-Z6-AI · Gráficos SVG del Panel Maestro sincronizado
/* global React */

function MasterFmtNumber(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(n);
}
function MasterFmtMoney(value) {
  const n = Number(value || 0);
  if (Math.abs(n) >= 1000000) return '₡' + (n / 1000000).toFixed(1) + ' M';
  if (Math.abs(n) >= 1000) return '₡' + Math.round(n / 1000) + ' mil';
  return '₡' + new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(n);
}
function MasterClamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function MasterSparkline({ values = [], tone = '#16294f' }) {
  const safe = (Array.isArray(values) ? values : []).map(Number).map(n => Number.isFinite(n) ? n : 0);
  const w = 108, h = 34, pad = 3;
  if (!safe.length) return <span className="master-spark-empty">—</span>;
  const min = Math.min(...safe), max = Math.max(...safe), range = max - min || 1;
  const pts = safe.map((v, i) => {
    const x = pad + (i * (w - pad * 2) / Math.max(1, safe.length - 1));
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');
  return <svg className="master-spark" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Tendencia">
    <polyline points={pts} fill="none" stroke={tone} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={pts.split(' ').slice(-1)[0].split(',')[0]} cy={pts.split(' ').slice(-1)[0].split(',')[1]} r="2.8" fill={tone} />
  </svg>;
}

function MasterBarLineChart({ primary = [], compare = [], labels = [], primaryLabel = '', compareLabel = '', formatValue = MasterFmtNumber }) {
  const p = labels.map((_, i) => Number(primary[i] || 0));
  const c = labels.map((_, i) => Number(compare[i] || 0));
  const max = Math.max(1, ...p, ...c);
  const width = 900, height = 330, left = 54, right = 24, top = 28, bottom = 46;
  const innerW = width-left-right, innerH = height-top-bottom;
  const step = innerW / Math.max(1, labels.length);
  const barW = Math.min(34, step * .5);
  const y = v => top + innerH - (Number(v||0)/max)*innerH;
  const linePts = c.map((v,i)=>`${left + step*i + step/2},${y(v)}`).join(' ');
  const ticks = [0,.25,.5,.75,1].map(r => ({ v:max*r, y:top+innerH-innerH*r }));
  return <div className="master-chart-wrap">
    <div className="master-chart-legend">
      <span><i className="master-legend-bar" />{primaryLabel}</span>
      <span><i className="master-legend-line" />{compareLabel}</span>
    </div>
    <svg className="master-barline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${primaryLabel} comparado con ${compareLabel}`}>
      {ticks.map((t,i)=><g key={i}>
        <line x1={left} x2={width-right} y1={t.y} y2={t.y} stroke="#e7e1d7" strokeWidth="1" />
        <text x={left-10} y={t.y+4} textAnchor="end" fontSize="11" fill="#7b8494">{formatValue(t.v)}</text>
      </g>)}
      {p.map((v,i)=>{
        const x=left+step*i+(step-barW)/2, yy=y(v), hh=top+innerH-yy;
        return <g key={i} className="master-bar-group">
          <rect x={x} y={yy} width={barW} height={Math.max(1,hh)} rx="6" fill="url(#masterBarGradient)" />
          <title>{labels[i]}: {formatValue(v)}</title>
          <text x={left+step*i+step/2} y={height-18} textAnchor="middle" fontSize="11" fill="#667085">{labels[i]}</text>
        </g>;
      })}
      <defs><linearGradient id="masterBarGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#24477f"/><stop offset="100%" stopColor="#16294f"/></linearGradient></defs>
      {c.some(v=>v>0) && <>
        <polyline points={linePts} fill="none" stroke="#c49a40" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {c.map((v,i)=><circle key={i} cx={left+step*i+step/2} cy={y(v)} r="4" fill="#f5ead0" stroke="#b8893b" strokeWidth="2"><title>{labels[i]}: {formatValue(v)}</title></circle>)}
      </>}
    </svg>
  </div>;
}

function MasterDonut({ items = [], centerValue = '', centerLabel = '' }) {
  const total = items.reduce((s,x)=>s+Number(x.value||0),0) || 1;
  let acc = 0;
  const stops = items.map(x => {
    const start = (acc/total)*100; acc += Number(x.value||0); const end=(acc/total)*100;
    return `${x.color} ${start}% ${end}%`;
  }).join(', ');
  return <div className="master-donut-block">
    <div className="master-donut" style={{background:`conic-gradient(${stops || '#ddd 0 100%'})`}}>
      <div><strong>{centerValue}</strong><span>{centerLabel}</span></div>
    </div>
    <div className="master-donut-legend">{items.map(x=><div key={x.label}><i style={{background:x.color}}/><span>{x.label}</span><strong>{MasterFmtNumber(x.value)}</strong></div>)}</div>
  </div>;
}

function MasterFunnel({ items = [] }) {
  const max = Math.max(1, ...items.map(x=>Number(x.value||0)));
  return <div className="master-funnel">{items.map((x,i)=>{
    const width = 42 + (Number(x.value||0)/max)*58;
    return <div key={x.label} className="master-funnel-row">
      <div className="master-funnel-label"><span>{x.label}</span><strong>{MasterFmtNumber(x.value)}</strong></div>
      <div className="master-funnel-track"><span style={{width:`${width}%`, background:x.color || '#16294f'}} /></div>
      {i<items.length-1 && <small>{Number(x.value||0)>0 ? Math.round((Number(items[i+1]?.value||0)/Number(x.value||1))*100) : 0}% continúa</small>}
    </div>;
  })}</div>;
}

function MasterHorizontalRanking({ items = [], valueLabel = 'matrículas', formatValue = MasterFmtNumber }) {
  const max = Math.max(1, ...items.map(x=>Number(x.value||0)));
  return <div className="master-ranking">{items.map((x,i)=><div key={x.name} className="master-ranking-row">
    <span className="master-rank-num">{i+1}</span>
    <div className="master-rank-copy"><div><strong>{x.name}</strong><span>{formatValue(x.value)} {valueLabel}</span></div><div className="master-rank-track"><span style={{width:`${(Number(x.value||0)/max)*100}%`}} /></div></div>
  </div>)}</div>;
}

function MasterHeatmap({ rows = [], labels = [], rowLabel = 'Asesor', valueSuffix = '' }) {
  const max = Math.max(1, ...rows.flatMap(r=>r.values||[]).map(Number));
  return <div className="master-heatmap-scroll"><div className="master-heatmap" style={{gridTemplateColumns:`minmax(150px,1.3fr) repeat(${labels.length}, minmax(38px,1fr))`}}>
    <div className="master-heat-corner">{rowLabel}</div>{labels.map(l=><div key={l} className="master-heat-head">{l}</div>)}
    {rows.map(r=><React.Fragment key={r.name}><div className="master-heat-name">{r.name}</div>{labels.map((_,i)=>{const v=Number((r.values||[])[i]||0);const alpha=.08+(v/max)*.78;return <div key={i} className="master-heat-cell" style={{background:`rgba(22,41,79,${alpha})`,color:alpha>.48?'#fff':'#26334a'}} title={`${r.name}: ${v}${valueSuffix}`}>{v}</div>})}</React.Fragment>)}
  </div></div>;
}


function MasterRadar({ items = [], valueLabel = '%' }) {
  const safe = (items || []).filter(x => x && x.label).map(x => ({...x, value: MasterClamp(Number(x.value || 0), 0, Number(x.max || 100) || 100)}));
  const n = Math.max(3, safe.length || 3), size = 360, cx = 180, cy = 180, radius = 118;
  const pt = (i, ratio) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i / n);
    return [cx + Math.cos(angle) * radius * ratio, cy + Math.sin(angle) * radius * ratio];
  };
  const rings = [.25,.5,.75,1];
  const polygon = safe.map((x,i)=>{const p=pt(i, x.value/(Number(x.max||100)||100));return `${p[0]},${p[1]}`;}).join(' ');
  return <div className="master-radar-wrap">
    <svg className="master-radar" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Comparativo por componente">
      {rings.map(r=><polygon key={r} points={Array.from({length:n},(_,i)=>pt(i,r).join(',')).join(' ')} fill="none" stroke="#ded7ca" strokeWidth="1" />)}
      {Array.from({length:n},(_,i)=>{const p=pt(i,1);return <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="#e6e0d5" strokeWidth="1"/>})}
      {safe.length>0&&<polygon points={polygon} fill="rgba(22,41,79,.2)" stroke="#16294f" strokeWidth="3" strokeLinejoin="round"/>}
      {safe.map((x,i)=>{const p=pt(i,x.value/(Number(x.max||100)||100)),l=pt(i,1.22);return <g key={x.label}><circle cx={p[0]} cy={p[1]} r="5" fill={x.color||'#c49a40'} stroke="#fff" strokeWidth="2"><title>{x.label}: {MasterFmtNumber(x.value)}{valueLabel}</title></circle><text x={l[0]} y={l[1]} textAnchor={Math.abs(l[0]-cx)<10?'middle':l[0]>cx?'start':'end'} dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#526078">{x.label}</text></g>})}
    </svg>
    <div className="master-radar-legend">{safe.map(x=><div key={x.label}><i style={{background:x.color||'#c49a40'}}/><span>{x.label}</span><strong>{MasterFmtNumber(x.value)}{valueLabel}</strong></div>)}</div>
  </div>;
}


function MasterMultiLineChart({ series = [], labels = [], formatValue = MasterFmtNumber, valueSuffix = '' }) {
  const clean = (series || []).filter(s => s && Array.isArray(s.values));
  const width = 900, height = 340, left = 58, right = 28, top = 32, bottom = 48;
  const innerW = width-left-right, innerH = height-top-bottom;
  const count = Math.max(1, labels.length), step = count > 1 ? innerW/(count-1) : innerW;
  const vals = clean.flatMap(s => s.values.map(v => Number(v||0))).filter(Number.isFinite);
  const max = Math.max(1, ...vals), min = Math.min(0, ...vals);
  const range = max-min || 1;
  const y = v => top + innerH - ((Number(v||0)-min)/range)*innerH;
  const x = i => left + (count===1 ? innerW/2 : step*i);
  const ticks = [0,.25,.5,.75,1].map(r=>({v:min+range*r,y:top+innerH-innerH*r}));
  return <div className="master-multiline-wrap">
    <div className="master-multiline-legend">{clean.map(s=><span key={s.label}><i style={{background:s.color||'#16294f'}}/>{s.label}</span>)}</div>
    <svg className="master-multiline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Tendencia multianual">
      {ticks.map((t,i)=><g key={i}><line x1={left} x2={width-right} y1={t.y} y2={t.y} stroke="#e7e1d7" strokeWidth="1"/><text x={left-10} y={t.y+4} textAnchor="end" fontSize="11" fill="#7b8494">{formatValue(t.v)}{valueSuffix}</text></g>)}
      {labels.map((l,i)=><text key={l} x={x(i)} y={height-18} textAnchor="middle" fontSize="11" fill="#667085">{l}</text>)}
      {clean.map((serie,si)=>{
        const points=labels.map((_,i)=>`${x(i)},${y(serie.values[i]||0)}`).join(' ');
        return <g key={serie.label}><polyline points={points} fill="none" stroke={serie.color||'#16294f'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>{labels.map((l,i)=><circle key={i} cx={x(i)} cy={y(serie.values[i]||0)} r="4" fill="#fff" stroke={serie.color||'#16294f'} strokeWidth="2"><title>{serie.label} · {l}: {formatValue(serie.values[i]||0)}{valueSuffix}</title></circle>)}</g>;
      })}
    </svg>
  </div>;
}

Object.assign(window, { MasterFmtNumber, MasterFmtMoney, MasterSparkline, MasterBarLineChart, MasterDonut, MasterFunnel, MasterHorizontalRanking, MasterHeatmap, MasterRadar, MasterMultiLineChart });
