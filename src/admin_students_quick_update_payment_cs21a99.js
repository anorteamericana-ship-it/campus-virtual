// F98.4-Z6-CS21A99 · Vista financiera detallada.
(function(){'use strict';const N=window.ANQuickUpdate99,{h,num,money,quickUpdateSafeUserError,Steps,Summary,LineCard,ErrorBox}=N;
function PaymentView({s}){return h(React.Fragment,null,
 h(Steps,{step:s.step}),
 h('div',{className:'a99-ok'},quickUpdateSafeUserError(s.academic?.mensaje,'Expediente académico actualizado.','academic_success')),
 h(Summary,{items:[[s.model?.nivel_label||s.model?.nivel,s.model?.estatus||'CA'],['Grupo',s.model?.grupo||'—'],['Cuotas del contrato',String(s.model?.num_cuotas||'—')],['Deuda completa',money(s.model?.total_pendiente)]]}),
 h('div',{className:'a99-receipt-search'},h('input',{value:s.query,onChange:e=>s.setQuery(e.target.value),onKeyDown:e=>e.key==='Enter'&&s.receiptFind(),disabled:!!s.busy,placeholder:'Número exacto del comprobante'}),h('button',{className:'a99-btn primary',disabled:!!s.busy,onClick:s.receiptFind},s.busy==='receipt'?'Buscando…':'Buscar comprobante')),
 s.receipt&&h('div',{className:'a99-bank'},h('div',{className:'a99-bank-grid'},h('div',null,h('span',null,'Documento'),h('b',null,s.receipt.doc)),h('div',null,h('span',null,'Total comprobante'),h('b',null,money(s.receipt.credito))),h('div',null,h('span',null,'Aplicado antes'),h('b',null,money(s.receipt.aplicado))),h('div',null,h('span',null,'Saldo disponible'),h('b',null,money(s.receipt.saldo))))),
 h('div',{className:'a99-pay-grid'},s.items.map(item=>h(LineCard,{key:item.tipo,item,amount:num(s.selected[item.tipo]),onChange:s.amount,disabled:!!s.busy||!s.receipt}))),
 s.receipt&&h('div',{className:'a99-complete'},h('button',{type:'button',disabled:!!s.busy,onClick:()=>s.complete()},'Completar deuda con saldo')),
 s.receipt&&h('div',{className:'a99-total'},h('div',null,h('span',null,'Total comprobante'),h('b',null,money(s.receipt.credito))),h('div',null,h('span',null,'Aplicar ahora'),h('b',null,money(s.total))),h('div',null,h('span',null,'Saldo después'),h('b',null,money(s.after)))),
 h(ErrorBox,{text:s.error}),
 h('div',{className:'a99-actions'},h('button',{className:'a99-btn',disabled:!!s.busy,onClick:s.onClose},'Cerrar y pagar después'),h('button',{className:'a99-btn good',disabled:!!s.busy||!s.receipt||s.total<=.009,onClick:s.paymentApply},s.busy==='payment'?'Aplicando pago local…':`Aplicar ${money(s.total)} sin CONAPE`))
)}
N.PaymentView=PaymentView;})();
