// F98.4-Z6-CS21A28 · Consulta individual: promoción CA→APR con activación opcional del siguiente nivel.
(function(){
  'use strict';

  const BUILD='F98.4-Z6-CS21A28';
  const NEXT={B1:'B2',B2:'I1',I1:'I2'};
  const LABEL={B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'};

  async function postStatus(fn,payload={},timeoutMs=45000){
    const token=window.getSessionToken?window.getSessionToken():'';
    const controller=typeof AbortController!=='undefined'?new AbortController():null;
    const timer=controller?setTimeout(()=>controller.abort(),timeoutMs):null;
    try{
      const res=await fetch(`${window.APPS_SCRIPT_URL}?fn=${encodeURIComponent(fn)}`,{
        method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify({fn,token,...payload}),cache:'no-store',redirect:'follow',
        signal:controller?controller.signal:undefined
      });
      const raw=await res.text();
      let data;
      try{data=JSON.parse(String(raw||'').trim());}catch(_){throw new Error('Apps Script devolvió una respuesta inválida.');}
      if(!res.ok||!data?.ok)throw new Error(data?.error||data?.mensaje||`No se pudo ejecutar ${fn}.`);
      return data;
    }catch(e){
      if(e?.name==='AbortError')throw new Error('El backend tardó demasiado en actualizar el expediente.');
      throw e;
    }finally{if(timer)clearTimeout(timer);}
  }

  function reloadConsulta(codigo){
    try{
      sessionStorage.setItem('an_consulta_prefill',JSON.stringify({codigo:String(codigo),origen:'actualizar_estatus_cs21a28',forceFresh:true}));
      localStorage.setItem('an_active','buscador');
      localStorage.setItem('an_active_admin','buscador');
    }catch(_){ }
    window.location.reload();
  }

  function ModalEstatusCS21A28({estudiante,nivel,onClose,onSuccess}){
    const actual=String(estudiante?.estatus||'CA').trim().toUpperCase();
    const codigo=String(estudiante?.codigo||estudiante?.rec_m||'').trim();
    const grupo=String(estudiante?.grupo||estudiante?.GRUPO||'').trim();
    const nivelActual=String(nivel||'').trim().toUpperCase();
    const siguienteNivel=NEXT[nivelActual]||'';

    const [nuevo,setNuevo]=React.useState(actual);
    const [loading,setLoading]=React.useState(false);
    const [error,setError]=React.useState('');
    const [checking,setChecking]=React.useState(false);
    const [nextInfo,setNextInfo]=React.useState(null);
    const [choice,setChoice]=React.useState('');
    const [conapeFallo,setConapeFallo]=React.useState(false);
    const [reintentando,setReintentando]=React.useState(false);
    const [reintentoMsg,setReintentoMsg]=React.useState('');
    const estados=['CA','APR','REP','CNV','RI','RJ','PE'];
    const promotionFlow=actual==='CA'&&nuevo==='APR';

    React.useEffect(()=>{
      let alive=true;
      setError('');setChoice('');setNextInfo(null);
      if(!promotionFlow||!siguienteNivel)return()=>{alive=false;};
      setChecking(true);
      postStatus('getEstudiante',{codigo},30000).then(ficha=>{
        if(!alive)return;
        const info=ficha?.niveles?.[siguienteNivel]||{};
        setNextInfo({
          nivel:siguienteNivel,
          estatus:String(info.estatus||'SIN REGISTRO').trim().toUpperCase(),
          grupo:String(info.grupo||'').trim(),
          periodo:String(info.periodo_corto||info.periodo_largo||'').trim()
        });
      }).catch(e=>{if(alive)setError('No se pudo verificar el siguiente nivel: '+(e?.message||e));})
        .finally(()=>{if(alive)setChecking(false);});
      return()=>{alive=false;};
    },[promotionFlow,siguienteNivel,codigo]);

    const preguntaActiva=promotionFlow&&!!siguienteNivel&&nextInfo?.estatus==='PE';

    async function guardar(){
      if(!nuevo||nuevo===actual){onClose?.();return;}
      if(preguntaActiva&&!choice){setError(`Indicá si también querés activar ${LABEL[siguienteNivel]||siguienteNivel}.`);return;}
      setLoading(true);setError('');setConapeFallo(false);setReintentoMsg('');
      try{
        const fn=promotionFlow?'actualizarEstatusPromocionSegura':'actualizarEstatus';
        const data=await postStatus(fn,{
          cod_estudiante:codigo,codigo,nivel:nivelActual,estatus:nuevo,
          nota:estudiante?.nota??null,grupo,
          activar_siguiente:preguntaActiva&&choice==='SI',
          siguiente_nivel:siguienteNivel,
          siguiente_grupo:nextInfo?.grupo||''
        },70000);
        if(data.conape_sync===false){setConapeFallo(true);setLoading(false);return;}
        try{onSuccess?.(data);}catch(_){ }
        setTimeout(()=>reloadConsulta(codigo),120);
      }catch(e){setError(e?.message||String(e));setLoading(false);}
    }

    async function reintentar(){
      setReintentando(true);setReintentoMsg('');
      try{
        const r=await postStatus('sincronizarCONAPE',{codigo},70000);
        setReintentoMsg(r?.ok?'✓ CONAPE sincronizado':'⚠ CONAPE continúa pendiente');
        if(r?.ok)setTimeout(()=>reloadConsulta(codigo),450);
      }catch(e){setReintentoMsg('⚠ '+(e?.message||e));}
      finally{setReintentando(false);}
    }

    return <div style={{position:'fixed',inset:0,zIndex:10000,background:'rgba(0,20,48,.52)',display:'flex',alignItems:'center',justifyContent:'center',padding:18}}>
      <div style={{width:'min(560px,96vw)',background:'white',borderRadius:16,boxShadow:'0 24px 70px rgba(0,0,0,.28)',overflow:'hidden'}}>
        <div style={{padding:'16px 19px',background:'#0D2B51',color:'white'}}>
          <div style={{fontSize:10,fontWeight:900,letterSpacing:'.12em',textTransform:'uppercase',opacity:.72}}>Consulta individual</div>
          <div style={{fontSize:20,fontWeight:900,marginTop:2}}>Cambiar estatus · {LABEL[nivelActual]||nivelActual}</div>
          <div style={{fontSize:11.5,opacity:.82,marginTop:4}}>{estudiante?.display||estudiante?.nombre||codigo} · actual <b>{actual}</b></div>
        </div>
        <div style={{padding:'18px 19px'}}>
          <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:14}}>{estados.map(s=><button key={s} type="button" onClick={()=>!conapeFallo&&setNuevo(s)} disabled={conapeFallo||loading} style={{padding:'7px 13px',borderRadius:8,border:`2px solid ${nuevo===s?'#002F6C':'#D7DDE5'}`,background:nuevo===s?'#002F6C':'white',color:nuevo===s?'white':'#26364D',fontWeight:900,cursor:'pointer'}}>{s}</button>)}</div>

          {promotionFlow&&siguienteNivel&&<div style={{marginBottom:14,padding:'13px 14px',borderRadius:12,border:'1px solid #C9D9F1',background:'#EEF4FF',color:'#173A67'}}>
            <div style={{fontWeight:950,fontSize:12}}>Promoción académica en una sola operación</div>
            {checking?<div style={{marginTop:7,fontSize:11}}>Verificando {LABEL[siguienteNivel]}…</div>:nextInfo?.estatus==='PE'?<>
              <div style={{marginTop:6,fontSize:11.5,lineHeight:1.5}}>Al aprobar {LABEL[nivelActual]}, ¿querés cambiar también <b>{LABEL[siguienteNivel]} de PE a CA</b>?</div>
              <div style={{fontSize:10.5,marginTop:4,color:'#526982'}}>{nextInfo.grupo||'Grupo pendiente'}{nextInfo.periodo?` · ${nextInfo.periodo}`:''}</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:8,marginTop:10}}>
                <button type="button" onClick={()=>setChoice('SI')} style={{padding:'10px',borderRadius:9,border:`2px solid ${choice==='SI'?'#2E7D32':'#B8D6BE'}`,background:choice==='SI'?'#E8F5E9':'white',color:'#205C28',fontWeight:900,cursor:'pointer'}}>Sí · activar {siguienteNivel}</button>
                <button type="button" onClick={()=>setChoice('NO')} style={{padding:'10px',borderRadius:9,border:`2px solid ${choice==='NO'?'#9A6200':'#E2D4A9'}`,background:choice==='NO'?'#FFF8E1':'white',color:'#7A4A00',fontWeight:900,cursor:'pointer'}}>No · dejar {siguienteNivel} en PE</button>
              </div>
            </>:<div style={{marginTop:7,fontSize:11.5,lineHeight:1.5}}>El siguiente nivel está en <b>{nextInfo?.estatus||'SIN REGISTRO'}</b>. Solo se ofrece activación automática cuando está en PE.</div>}
          </div>}

          {promotionFlow&&!siguienteNivel&&<div style={{marginBottom:14,padding:'11px 13px',borderRadius:10,background:'#F4F1EC',border:'1px solid #DED7CF',fontSize:11.5,color:'#665D54'}}>Intermedio II es el último nivel; no existe un nivel posterior para activar.</div>}
          {error&&<div style={{marginBottom:12,padding:'10px 12px',borderRadius:9,background:'#FFEBEE',border:'1px solid #F4B7B7',color:'#B42318',fontSize:11.5,fontWeight:750}}>⚠ {error}</div>}
          {conapeFallo&&<div style={{marginBottom:12,padding:'11px 13px',borderRadius:10,background:'#FFF8E1',border:'1px solid #E5C56D',color:'#7A4900',fontSize:11.5,lineHeight:1.45}}><b>Los estados se guardaron en APOLLO, pero CONAPE quedó pendiente.</b>{reintentoMsg&&<div style={{marginTop:6,fontWeight:900}}>{reintentoMsg}</div>}</div>}

          <div style={{display:'flex',justifyContent:'flex-end',gap:8,flexWrap:'wrap'}}>
            {conapeFallo?<>
              <button type="button" onClick={()=>reloadConsulta(codigo)} disabled={reintentando} style={{padding:'9px 13px',borderRadius:9,border:'1px solid #D7DDE5',background:'white',fontWeight:850,cursor:'pointer'}}>Cerrar y actualizar ficha</button>
              <button type="button" onClick={reintentar} disabled={reintentando} style={{padding:'9px 14px',borderRadius:9,border:'none',background:'#E59500',color:'white',fontWeight:900,cursor:'pointer'}}>{reintentando?'Sincronizando…':'↻ Reintentar CONAPE'}</button>
            </>:<>
              <button type="button" onClick={onClose} disabled={loading} style={{padding:'9px 13px',borderRadius:9,border:'1px solid #D7DDE5',background:'white',fontWeight:850,cursor:'pointer'}}>Cancelar</button>
              <button type="button" onClick={guardar} disabled={loading||checking||(preguntaActiva&&!choice)} style={{padding:'9px 15px',borderRadius:9,border:'none',background:'#002F6C',color:'white',fontWeight:900,cursor:loading?'wait':'pointer',opacity:(loading||checking||(preguntaActiva&&!choice))?.62:1}}>{loading?'Guardando y actualizando…':'Guardar cambio'}</button>
            </>}
          </div>
        </div>
      </div>
    </div>;
  }

  function apply(){
    if(typeof window.ModalEstatus!=='function')return false;
    window.ModalEstatus=ModalEstatusCS21A28;
    try{ModalEstatus=ModalEstatusCS21A28;}catch(_){ }
    window.__AN_STATUS_PROMOTION_BUILD__=BUILD;
    return true;
  }
  window.addEventListener('an:lazy-module-loaded',e=>{if(String(e?.detail?.src||'').includes('admin_students.jsx'))setTimeout(apply,0);});
  setTimeout(apply,0);
})();
