'use strict';
// QA F111: usa la función ORIGINAL de la pantalla, sin red ni escritura.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','src','admin_students.jsx'),'utf8');
const start=src.indexOf('function agIndEstadoFinancieroPE(');
const end=src.indexOf('function AdminEstudianteResumenIndividual(',start);
assert.ok(start>-1&&end>start,'Función PE no localizada en la vista oficial');
const ctx={agIndUpper:x=>String(x||'').trim().toUpperCase(),agIndMoney:x=>'₡'+Number(x).toLocaleString('es-CR')};
vm.runInNewContext(src.slice(start,end)+'\nthis.evaluar=agIndEstadoFinancieroPE;',ctx,{timeout:2000});
const evalPE=(status,quote,pay)=>ctx.evaluar(status,quote,pay);
const i1Price={disponible:true,proformaVerificada:true,total:334200,saldo:334200};
const empty={mat_pagada:0,cuotas_pagadas:0,cert_pagado:0,programa_completo_pagado:0,toeic_pagado:0};
let checks=0;
function expect(status,q,p,label,detalle){
 const actual=evalPE(status,q,p);
 assert.equal(actual?.label,label,'etiqueta de '+checks);
 if(detalle!==undefined)assert.ok(actual?.detalle.includes(detalle),'detalle '+checks);
 checks++;
}
expect('PE',i1Price,empty,'SIN ANTICIPO','Sin obligación');
expect('PE',{...i1Price,saldo:0},{...empty,mat_pagada:20000,cuotas_pagadas:299200,cert_pagado:15000},'AL DÍA','Pago anticipado registrado');
expect('PE',{...i1Price,saldo:15000},{...empty,mat_pagada:20000,cuotas_pagadas:299200},'ANTICIPO PARCIAL','Saldo por anticipar');
expect('PE',{...i1Price,saldo:299200},{...empty,mat_pagada:20000,cert_pagado:15000},'ANTICIPO PARCIAL');
expect('PE',{...i1Price,saldo:334200},{...empty,mat_pagada:0},'SIN ANTICIPO');
expect('PE',{...i1Price,saldo:0},empty,'SIN ANTICIPO','Sin obligación'); // saldo 0 solo NO prueba pago
expect('PE',{...i1Price,saldo:0}, {...empty,cuotas_pagadas:299200},'ANTICIPO PARCIAL');
expect('PE',{...i1Price,saldo:0,proformaVerificada:false},{...empty,mat_pagada:20000,cuotas_pagadas:299200,cert_pagado:15000},'POR VERIFICAR');
expect('PE',{...i1Price,disponible:false},empty,'POR VERIFICAR');
expect('PE',{...i1Price,total:0,saldo:0},empty,'POR VERIFICAR');
expect('PE',{...i1Price,saldo:NaN},empty,'POR VERIFICAR');
expect('PE',{...i1Price,saldo:Infinity},empty,'POR VERIFICAR');
expect('PE',{...i1Price,saldo:0},{...empty,mat_pagada:-1,cuotas_pagadas:299200,cert_pagado:15000},'POR VERIFICAR');
expect('CA',i1Price,empty,undefined);
expect('APR',i1Price,empty,undefined);
expect('PE',{disponible:true,proformaVerificada:true,total:379000,saldo:0},{...empty,mat_pagada:20000,cuotas_pagadas:344000,cert_pagado:15000},'AL DÍA'); // 17198 B2
expect('PE',{disponible:true,proformaVerificada:true,total:349200,saldo:0},{...empty,mat_pagada:20000,cuotas_pagadas:299200,cert_pagado:15000,programa_completo_pagado:15000},'AL DÍA'); // I2 title
expect('PE',{disponible:true,proformaVerificada:false,total:349200,saldo:0},{...empty,mat_pagada:20000,cuotas_pagadas:299200,cert_pagado:15000,programa_completo_pagado:15000},'POR VERIFICAR'); // I2 proforma incompleta
assert.ok(src.includes('estadoFinancieroPE?.label||finLabel'),'vista usa estado calculado');
assert.ok(src.includes('estadoFinancieroPE?.detalle'),'vista muestra distinción al usuario');
assert.ok(src.includes('estadoFinancieroPE?.label===\'AL DÍA\''),'detalle expandido muestra anticipo');
assert.ok(src.includes('const estadoFinancieroPE=agIndEstadoFinancieroPE(estatus,cotizacion,pendienteNivel);'),'la fila calcula badge con pagos por nivel');
checks+=4;
console.log('F111_PE_FINANCE_BADGE_PASS cases='+checks+' backend_writes=0 actual_payments_touched=0');
