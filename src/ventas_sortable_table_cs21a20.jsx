/* F98.4-Z6-CS21A20H · Tabla de leads ordenable + tracking/reclutamiento CONAPE por fila. */
(function(){
  const COLS=[
    {key:'cedula',label:'Cédula'},{key:'nombre',label:'Nombre'},{key:'telefono',label:'Teléfono'},
    {key:'grupo',label:'Grupo'},{key:'programa',label:'Programa'},{key:'financiamiento',label:'Financiam.'},
    {key:'etapa',label:'Etapa'},{key:'estado',label:'Estado'},{key:'dias',label:'Días'}
  ];
  const collator=new Intl.Collator('es',{sensitivity:'base',numeric:true,ignorePunctuation:true});
  const text=v=>String(v==null?'':v).trim();
  const digits=v=>text(v).replace(/\D/g,'');
  const etapaVisible=p=>text(p?.estado_conape_raw||p?.estado_conape||p?.etapa||'');
  const finCode=p=>text(p?.financiamiento).toUpperCase();
  const fmtTrackingDate=v=>{
    const raw=text(v);if(!raw)return'';
    const iso=raw.match(/^(\d{4})-(\d{2})-(\d{2})/);return iso?`${iso[3]}/${iso[2]}/${iso[1]}`:raw;
  };
  function trackingTitle(record){
    if(!record)return'';
    const parts=[];
    if(record.estado_raw)parts.push(`Estado: ${record.estado_raw}`);
    if(record.fecha_estado_raw||record.fecha_estado)parts.push(`Fecha de estado: ${record.fecha_estado_raw||fmtTrackingDate(record.fecha_estado)}`);
    if(record.fecha_registro_raw||record.fecha_registro)parts.push(`Fecha de registro: ${record.fecha_registro_raw||fmtTrackingDate(record.fecha_registro)}`);
    if(record.usuario_registro)parts.push(`Usuario que registró: ${record.usuario_registro}`);
    if(record.fecha_aprobacion_raw||record.fecha_aprobacion)parts.push(`Aprobación: ${record.fecha_aprobacion_raw||fmtTrackingDate(record.fecha_aprobacion)}`);
    if(record.fecha_formalizacion_raw||record.fecha_formalizacion)parts.push(`Formalización: ${record.fecha_formalizacion_raw||fmtTrackingDate(record.fecha_formalizacion)}`);
    if(record.ultimo_desembolso_raw||record.ultimo_desembolso)parts.push(`Último desembolso: ${record.ultimo_desembolso_raw||fmtTrackingDate(record.ultimo_desembolso)}`);
    if(record.proximo_desembolso_raw||record.proximo_desembolso)parts.push(`Próximo desembolso: ${record.proximo_desembolso_raw||fmtTrackingDate(record.proximo_desembolso)}`);
    return parts.join('\n');
  }
  function sortValue(p,key){
    if(key==='cedula')return digits(p.cedula)||text(p.cedula);
    if(key==='nombre')return text(p.nombre);
    if(key==='telefono')return digits(p.telefono||p.whatsapp);
    if(key==='grupo')return text(p.grupo_tentativo);
    if(key==='programa')return text(window.progLabel(p.programa));
    if(key==='financiamiento')return text((window.FIN_MAP?.[p.financiamiento]||{}).label||p.financiamiento);
    if(key==='etapa'){const raw=etapaVisible(p);return text((window.ETAPA_MAP?.[raw]||{}).label||raw);}
    if(key==='estado')return text(window.calcularEstadoEstudianteVentas(p)?.estado);
    if(key==='dias'){const n=window.diasDesde(p.fecha_registro);return Number.isFinite(Number(n))?Number(n):null;}
    return '';
  }
  function compareRows(a,b,key,dir){
    const av=sortValue(a.p,key),bv=sortValue(b.p,key);let result=0;
    if(key==='dias'){
      const an=av==null,bn=bv==null;if(an&&bn)result=0;else if(an)return 1;else if(bn)return-1;else result=av-bv;
    }else{
      const ae=!text(av),be=!text(bv);if(ae&&be)result=0;else if(ae)return 1;else if(be)return-1;else result=collator.compare(text(av),text(bv));
    }
    if(result===0)result=a.i-b.i;return dir==='desc'?-result:result;
  }
  function SortHeader({col,sort,onSort}){
    const active=sort.key===col.key,direction=active?sort.dir:'',ariaSort=!active?'none':direction==='asc'?'ascending':'descending';
    return <th aria-sort={ariaSort}><button type="button" className={`vx-sort-head${active?' active':''}`} onClick={()=>onSort(col.key)} title={`Ordenar por ${col.label}`}><span>{col.label}</span><span className="vx-sort-icon" aria-hidden="true">{active?(direction==='asc'?'▲':'▼'):'↕'}</span></button></th>;
  }
  function SortableProspectoTable({lista,onOpen,onChanged,onToast}){
    const [sort,setSort]=React.useState({key:'',dir:'asc'});
    const [conapeEtapas,setConapeEtapas]=React.useState({});
    const [trackingRows,setTrackingRows]=React.useState({});
    const [trackingState,setTrackingState]=React.useState('idle');
    const [trackingMeta,setTrackingMeta]=React.useState({missing:0,ambiguous:0});
    const trackingKey=React.useMemo(()=>{
      const ids=(Array.isArray(lista)?lista:[]).filter(p=>finCode(p)==='CONAPE').map(p=>digits(p.cedula)).filter(Boolean);
      return Array.from(new Set(ids)).sort().join(',');
    },[lista]);
    React.useEffect(()=>{
      let cancelled=false;
      const ids=trackingKey?trackingKey.split(','):[];
      const api=window.CONAPE_PORTAL_BRIDGE_C38||window.CONAPE_PORTAL_BRIDGE_C37;
      if(!ids.length||!api||typeof api.tracking!=='function'){
        setTrackingRows({});setTrackingState(ids.length?'unavailable':'idle');setTrackingMeta({missing:0,ambiguous:0});return()=>{cancelled=true;};
      }
      (async()=>{
        setTrackingState('loading');
        const next={};let missing=0,ambiguous=0;
        try{
          for(let i=0;i<ids.length;i+=100){
            if(cancelled)return;
            const response=await api.tracking(ids.slice(i,i+100));
            if(!response||response.ok!==true)throw new Error(text(response?.error)||'tracking_unavailable');
            for(const record of (Array.isArray(response.records)?response.records:[])){
              const id=digits(record?.cedula);if(id)next[id]=record;
            }
            missing+=Array.isArray(response.missing)?response.missing.length:Number(response.metrics?.missing||0);
            ambiguous+=Array.isArray(response.ambiguous)?response.ambiguous.length:Number(response.metrics?.ambiguous||0);
          }
          if(cancelled)return;
          setTrackingRows(next);setTrackingMeta({missing,ambiguous});setTrackingState('ready');
        }catch(_error){
          if(cancelled)return;
          setTrackingRows({});setTrackingMeta({missing:0,ambiguous:0});setTrackingState('error');
        }
      })();
      return()=>{cancelled=true;};
    },[trackingKey]);
    const rows=React.useMemo(()=>{
      const base=(Array.isArray(lista)?lista:[]).map((p,i)=>{
        const rec=trackingRows[digits(p.cedula)];
        return {p:rec&&rec.estado_raw?{...p,estado_conape_raw:rec.estado_raw}:p,i};
      });
      if(!sort.key)return base.map(x=>x.p);return base.sort((a,b)=>compareRows(a,b,sort.key,sort.dir)).map(x=>x.p);
    },[lista,sort,trackingRows]);
    const onSort=key=>setSort(prev=>prev.key===key?{key,dir:prev.dir==='asc'?'desc':'asc'}:{key,dir:'asc'});
    const handleConapeChanged=change=>{
      const ced=digits(change?.cedula),estado=text(change?.estado_conape_raw||change?.estado_conape);
      if(ced&&estado)setConapeEtapas(prev=>({...prev,[ced]:estado}));
      if(typeof onChanged==='function')onChanged(change);
    };
    const trackingLabel=trackingState==='loading'?'Actualizando CONAPE…':trackingState==='error'?'Seguimiento CONAPE no disponible':trackingState==='ready'&&trackingMeta.ambiguous?`${trackingMeta.ambiguous} registro${trackingMeta.ambiguous===1?'':'s'} CONAPE ambiguo${trackingMeta.ambiguous===1?'':'s'}`:'';
    return <div className="vx-tablecard">
      {trackingLabel?<div className="vx-result-count" role={trackingState==='error'?'status':undefined}>{trackingLabel}</div>:null}
      <div className="vx-table-scroll"><table className="vx-table">
      <colgroup><col style={{width:'7.5%'}}/><col style={{width:'16.5%'}}/><col style={{width:'9%'}}/><col style={{width:'10%'}}/><col style={{width:'8.5%'}}/><col style={{width:'8%'}}/><col style={{width:'11%'}}/><col style={{width:'9%'}}/><col style={{width:'4.5%'}}/><col style={{width:'9%'}}/><col style={{width:'6%'}}/></colgroup>
      <thead><tr>{COLS.map(col=><SortHeader key={col.key} col={col} sort={sort} onSort={onSort}/>)}<th>CONAPE</th><th>Acción</th></tr></thead>
      <tbody>{rows.map((p,i)=>{const dias=window.diasDesde(p.fecha_registro),prio=window.calcularPrioridadProspecto(p),est=window.calcularEstadoEstudianteVentas(p),ced=digits(p.cedula),track=trackingRows[ced],etapa=text(track?.estado_raw||conapeEtapas[ced]||etapaVisible(p)),fechaEstado=text(track?.fecha_estado_raw||fmtTrackingDate(track?.fecha_estado));return <tr key={p.cedula||p.id||i} className={prio.nivel==='rojo'?'vx-row-rojo':''} onClick={()=>onOpen(p)}>
        <td className="vx-td-ced" title={text(p.cedula)}>{p.cedula}</td><td className="vx-td-name" title={text(p.nombre)}>{p.nombre}</td>
        <td title={text(window.fmtTelV(p.telefono))}><span className="vx-tel"><window.WaLink tel={p.whatsapp||p.telefono} className="vx-wa-mini"><window.Vico d={window.VI.wa} size={15} fill="currentColor"/></window.WaLink>{window.fmtTelV(p.telefono)}</span></td>
        <td className="vx-td-grupo" title={text(p.grupo_tentativo||'—')}>{p.grupo_tentativo||'—'}</td><td className="vx-td-prog" title={text(window.progLabel(p.programa))}>{window.progLabel(p.programa)}</td><td><window.FinBadge financiamiento={p.financiamiento}/></td>
        <td title={etapa}><window.EtapaBadge etapa={etapa}/></td><td><window.EstadoBadge est={est}/></td><td className="vx-td-dias">{dias!=null?<><b>{dias}</b> d</>:'—'}</td>
        <td onClick={e=>e.stopPropagation()} title={trackingTitle(track)}>
          {track?<div className="vx-conape-track"><strong>{track.estado_raw||'CONAPE'}</strong>{fechaEstado?<small style={{display:'block'}}>{fechaEstado}</small>:null}</div>:null}
          {window.ConapeRecruitRowButtonC35?<window.ConapeRecruitRowButtonC35 prospecto={p} onChanged={handleConapeChanged} onToast={onToast}/>:null}
        </td>
        <td onClick={e=>e.stopPropagation()}><div className="vx-rowacts"><button className="vx-iconbtn ver" onClick={()=>onOpen(p)}><window.Vico d={window.VI.eye} size={13}/> Ver</button></div></td>
      </tr>;})}</tbody>
    </table></div></div>;
  }
  function FilterBarTelefono({filtro,setFiltro,resultCount}){
    const upd=(key,value)=>setFiltro(prev=>({...prev,[key]:value})),limpiar=()=>setFiltro({etapa:'',fin:'',q:''}),activos=filtro.etapa||filtro.fin||filtro.q;
    return <div className="vx-filters"><div className="vx-field"><span className="vx-field-lbl">Financiamiento</span><select className="vx-select" value={filtro.fin} onChange={e=>upd('fin',e.target.value)}><option value="">Todos</option><option value="CONAPE">CONAPE</option><option value="BECA">Beca 25%</option><option value="PROPIO">Pago propio</option></select></div><div className="vx-field vx-search"><span className="vx-field-lbl">Buscar</span><div className="vx-search-box"><window.Vico d={window.VI.search} size={15}/><input type="search" inputMode="search" placeholder="Nombre, cédula o teléfono…" aria-label="Buscar por nombre, cédula o teléfono" value={filtro.q} onChange={e=>upd('q',e.target.value)}/></div></div>{activos?<button className="vx-clear" onClick={limpiar}>Limpiar filtros</button>:null}<div className="vx-result-count">{resultCount} prospecto{resultCount===1?'':'s'}</div></div>;
  }
  window.FilterBar=FilterBarTelefono;window.ProspectoTable=SortableProspectoTable;
})();