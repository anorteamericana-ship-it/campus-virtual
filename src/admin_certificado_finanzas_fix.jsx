// F98.4-Z6-CS21A12 · Certificado financiero sin contradicción visual
// Frontend-only: separa pago de certificado vs emisión del documento en Consulta individual.
/* global React */
(function(){
  const VERSION = 'F98.4-Z6-CS21A12';

  function money(n){
    const v = Number(n || 0);
    try { return '₡' + Math.round(v).toLocaleString('es-CR'); }
    catch(_) { return '₡' + Math.round(v); }
  }
  function norm(v){ return String(v == null ? '' : v).trim(); }
  function rubroLabel(tipo){
    return ({MATRICULA:'Matrícula',CUOTA:'Cuotas',CERTIFICADO:'Certificado',PROGRAMA_COMPLETO:'Programa completo',TOEIC:'TOEIC'}[tipo] || tipo);
  }

  function PatchedAgIndRubroIntento({ tipo, rubro, color, certificadoRegistro }){
    const r = rubro || {};
    const comps = Array.isArray(r.comprobantes) ? r.comprobantes : [];
    const deuda = Number(r.deuda_exigible || 0);
    const saldo = Number(r.saldo_contractual || 0);
    const aplicado = Number(r.aplicado || 0);
    const alDia = deuda <= 0.005;
    const esCertificado = tipo === 'CERTIFICADO';
    const registroCert = norm(certificadoRegistro);
    const certEmitido = !!registroCert;
    const certPagado = esCertificado && !certEmitido && (alDia || aplicado > 0 || comps.length > 0);

    const estadoLabel = esCertificado
      ? (certEmitido ? 'EMITIDO' : (certPagado ? 'PAGADO · NO EMITIDO' : 'PAGO PENDIENTE'))
      : (alDia ? 'AL DÍA' : money(deuda));
    const estadoColor = esCertificado
      ? (certEmitido ? '#2E7D32' : (certPagado ? '#1565C0' : '#B42318'))
      : (alDia ? '#2E7D32' : '#C62828');

    return <div style={{padding:'8px 9px',borderRadius:9,border:'1px solid #E2DDD6',background:'white',minWidth:0}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:6,alignItems:'center'}}>
        <span style={{fontSize:8.5,fontWeight:950,letterSpacing:'.07em',textTransform:'uppercase',color:'#756D65'}}>{rubroLabel(tipo)}</span>
        <span style={{width:18,height:3,borderRadius:999,background:color}} />
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:7,marginTop:5}}>
        <span style={{fontSize:8.5,color:'#81776F'}}>Aplicado</span>
        <b style={{fontSize:10.5,fontFamily:'var(--f-mono,monospace)',color:'#14213D'}}>{money(aplicado)}</b>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:7,marginTop:2}}>
        <span style={{fontSize:8.5,color:'#81776F'}}>{esCertificado ? 'Estado' : 'Pendiente'}</span>
        <b style={{fontSize:9.5,color:estadoColor,textAlign:'right'}}>{estadoLabel}</b>
      </div>
      {esCertificado && !certEmitido && <div style={{marginTop:2,fontSize:7.8,color:certPagado?'#244A7C':'#B42318'}}>
        {certPagado ? 'Pago cubierto; falta emitir el documento oficial.' : `Saldo financiero: ${money(deuda)}. Documento aún no emitido.`}
      </div>}
      {esCertificado && certEmitido && <div style={{marginTop:2,fontSize:7.8,color:'#2E7D32'}}>Registro oficial: {registroCert}</div>}
      {!esCertificado && alDia && saldo > 0.005 && <div style={{marginTop:2,fontSize:7.8,color:'#8A6D3B'}}>Saldo contractual futuro: {money(saldo)}</div>}
      <div style={{marginTop:6,paddingTop:5,borderTop:'1px dashed #E6E0D9'}}>
        {comps.length ? comps.map((c,i)=><div key={c.id || i} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:5,fontSize:7.8,color:'#5D6673',marginTop:i?3:0}}>
          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.fecha || 'Sin fecha'} · Rec. {c.recibo || '—'}{c.documento ? ` · Doc. ${c.documento}` : ''}</span>
          <b style={{fontFamily:'var(--f-mono,monospace)',color:'#25364F'}}>{money(c.monto)}</b>
        </div>) : <div style={{fontSize:7.8,color:'#9A9087'}}>Sin comprobante aplicado en este intento.</div>}
      </div>
    </div>;
  }

  function install(){
    try {
      if (typeof React === 'undefined') return;
      window.AgIndRubroIntento = PatchedAgIndRubroIntento;
      try { AgIndRubroIntento = PatchedAgIndRubroIntento; } catch(_) {}
      window.__AN_CERT_FINANZAS_FIX_VERSION__ = VERSION;
    } catch(_) {}
  }

  install();
  window.addEventListener('an:lazy-module-loaded', () => setTimeout(install, 30));
  setTimeout(install, 250);
  setTimeout(install, 1000);
})();
