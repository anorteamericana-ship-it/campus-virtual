// F98.4-Z6-CS21A42 · Certificado: separar pago financiero de emisión documental.
(function(){
'use strict';
const BUILD='F98.4-Z6-CS21A42';
let OriginalIntento=null;
function num(v){const n=Number(v||0);return Number.isFinite(n)?n:0;}
function norm(v){return String(v==null?'':v).trim();}
function money(v){try{return new Intl.NumberFormat('es-CR',{style:'currency',currency:'CRC',maximumFractionDigits:0}).format(num(v));}catch(_){return '₡'+Math.round(num(v)).toLocaleString('es-CR');}}
function findCertificateCard(root){return Array.from(root?.querySelectorAll?.('div')||[]).find(card=>{const header=card.firstElementChild,label=header?.firstElementChild;return header?.tagName==='DIV'&&label?.tagName==='SPAN'&&String(label.textContent||'').trim().toUpperCase()==='CERTIFICADO';})||null;}
function directRow(card,label){return Array.from(card?.children||[]).find(row=>{const first=row?.firstElementChild;return row?.tagName==='DIV'&&first?.tagName==='SPAN'&&String(first.textContent||'').trim()===label;})||null;}
function setText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
function setColor(el,color){if(el&&el.style.color!==color)el.style.color=color;}
function enhanceCertificate(root,props){
  const card=findCertificateCard(root);if(!card)return;
  const rubro=props?.intento?.rubros?.CERTIFICADO||{},applied=num(rubro.aplicado),expected=num(rubro.esperado||props?.intento?.esperado?.CERTIFICADO),debt=num(rubro.deuda_exigible),issued=!!norm(props?.certificadoRegistro);
  const paid=(debt<=0.005&&(applied>0.005||expected<=0.005))||(expected>0.005&&applied+0.005>=expected),payColor=paid?'#2E7D32':'#C62828',docColor=issued?'#2E7D32':'#9A6200';
  const oldDocument=directRow(card,'Documento'),paymentRow=directRow(card,'Pago')||oldDocument;
  if(paymentRow){setText(paymentRow.firstElementChild,'Pago');setText(paymentRow.lastElementChild,paid?'PAGADO':`PENDIENTE ${money(debt)}`);setColor(paymentRow.lastElementChild,payColor);}
  let documentRow=directRow(card,'Documento');
  if(!documentRow||documentRow===paymentRow){documentRow=document.createElement('div');documentRow.className='an42-cert-document-row';documentRow.style.cssText='display:flex;justify-content:space-between;align-items:baseline;gap:7px;margin-top:2px';const label=document.createElement('span');label.textContent='Documento';label.style.cssText='font-size:8.5px;color:#81776F';const value=document.createElement('b');value.style.cssText='font-size:9.5px';documentRow.append(label,value);if(paymentRow?.nextSibling)card.insertBefore(documentRow,paymentRow.nextSibling);else card.appendChild(documentRow);}
  setText(documentRow.lastElementChild,issued?'EMITIDO':'POR EMITIR');setColor(documentRow.lastElementChild,docColor);
  let message=card.querySelector('.an42-cert-message');
  if(!message){message=Array.from(card.children).find(x=>/Pago cubierto|Saldo financiero|Registro oficial|Falta aplicar comprobante/i.test(String(x.textContent||'')))||document.createElement('div');message.classList.add('an42-cert-message');if(!message.parentNode){if(documentRow.nextSibling)card.insertBefore(message,documentRow.nextSibling);else card.appendChild(message);}}
  message.style.cssText=`margin-top:3px;font-size:8px;font-weight:800;line-height:1.35;color:${issued?'#2E7D32':paid?'#8A5A00':'#B42318'}`;
  setText(message,issued?`Registro oficial: ${norm(props.certificadoRegistro)}`:paid?'Pago confirmado. Documento oficial pendiente de emisión.':`Pago pendiente: ${money(debt)}. Documento todavía no emitido.`);
  card.dataset.certificatePaid=paid?'true':'false';card.dataset.certificateIssued=issued?'true':'false';
  if(paid&&!issued){card.style.borderColor='#E4C76C';card.style.background='#FFFDF5';}else if(issued){card.style.borderColor='#BFE4C3';card.style.background='#F7FCF8';}
}
function AgIndIntentoFinancieroCS21A42(props){
  const ref=React.useRef(null);
  React.useEffect(()=>{let pending=false;const run=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;enhanceCertificate(ref.current,props);});};run();const observer=new MutationObserver(run);if(ref.current)observer.observe(ref.current,{childList:true,subtree:true,characterData:true});return()=>observer.disconnect();},[props?.intento,props?.certificadoRegistro,props?.nivel]);
  return <div ref={ref} data-cs21a42-certificate-integrity="true"><OriginalIntento {...props}/></div>;
}
function apply(){let current;try{current=window.AgIndIntentoFinanciero||AgIndIntentoFinanciero;}catch(_){current=window.AgIndIntentoFinanciero;}if(typeof current!=='function')return false;if(window.__AN_CERTIFICATE_INTEGRITY_BUILD__===BUILD)return true;OriginalIntento=current;window.AgIndIntentoFinanciero=AgIndIntentoFinancieroCS21A42;try{AgIndIntentoFinanciero=AgIndIntentoFinancieroCS21A42;}catch(_){}window.__AN_CERTIFICATE_INTEGRITY_BUILD__=BUILD;return true;}
window.addEventListener('an:lazy-module-loaded',e=>{if(String(e?.detail?.src||'').includes('admin_students.jsx'))setTimeout(apply,20);});setTimeout(apply,20);
})();
