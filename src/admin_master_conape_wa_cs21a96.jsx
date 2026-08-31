// F98.4-Z6-CS21A96 · WhatsApp del seguimiento CONAPE
(function(){
'use strict';
const N=window.ANMasterConape96;if(!N)throw Error('CS21A96 core no cargado');
const {WA_TEMPLATES,clean,phone,levelId,periodKind,post,masterConapeSafeUserError,pendingAmount,waText}=N;
function WaButton({row,finance}){
 const[busy,setBusy]=React.useState(false),[template,setTemplate]=React.useState(1),wa=phone(row?.phone),code=clean(row?.code),nivel=levelId(row),current=WA_TEMPLATES.find(x=>x.id===template)||WA_TEMPLATES[0];
 if(row?.appliedInSystem)return <div className="master-wa-closed" title="Ya aplicado; no enviar cobro">Cerrado</div>;
 if(!wa)return <div className="master-wa-closed">Sin teléfono</div>;
 function cycle(delta){setTemplate(v=>{const i=WA_TEMPLATES.findIndex(x=>x.id===v);return WA_TEMPLATES[(i+delta+WA_TEMPLATES.length)%WA_TEMPLATES.length].id})}
 async function open(){if(busy)return;setBusy(true);const popup=window.open('','_blank');try{let ficha=null;if(code&&nivel)try{ficha=await post('getEstudiante',{codigo:code})}catch(_){}const amount=pendingAmount(ficha,nivel,finance),kind=periodKind(ficha?.pendientes?.por_nivel?.[nivel]?.tipo_periodo||finance?.periodType||row?.periodType),url=`https://wa.me/${wa}?text=${encodeURIComponent(waText(row,amount,kind,template))}`;if(popup)popup.location.href=url;else window.open(url,'_blank','noopener,noreferrer')}catch(e){try{popup?.close()}catch(_){}alert(masterConapeSafeUserError(e?.message||String(e),'No se pudo preparar WhatsApp. Intentá de nuevo.','preparar_whatsapp'))}finally{setBusy(false)}}
 return <div className="master-wa-panel"><div className="master-wa-picker"><button type="button" onClick={()=>cycle(-1)}>‹</button><span title={`Plantilla ${current.id}: ${current.label}`}><b>{current.id}</b> · {current.label}</span><button type="button" onClick={()=>cycle(1)}>›</button></div><button type="button" className="master-wa-action" onClick={open} disabled={busy}>{busy?'Preparando…':'WA · Enviar'}</button></div>;
}
N.WaButton=WaButton;
})();
