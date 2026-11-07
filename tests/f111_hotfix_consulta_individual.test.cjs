// HOTFIX Consulta individual: tests synthetic; no payment/CONAPE/Apps Script calls.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src','admin_students.jsx'),'utf8');
const start=source.indexOf('function agIndCotizarNivel(');
const end=source.indexOf('// F111: estado FINANCIERO',start);
assert.ok(start>0&&end>start,'found estimator');
const sandbox={};
vm.createContext(sandbox);
vm.runInContext(source.slice(start,end)+'\nthis.quote=agIndCotizarNivel;',sandbox);
const base={n_cuotas_periodo:4,precio_matricula:20000,precio_cuota:55900,
  precio_certificado:15000,precio_programa_completo:15000,
  precio_toeic_referencia:136730,precio_toeic:136730,
  toeic_aplica:false,proforma_toeic_confirmado:false,toeic_incluido_proforma:false};
const test=sandbox.quote({nivel:'I2'},base,'I2','CONAPE');
assert.equal(test.disponible,true);
assert.equal(test.subtotalCliente,273600);
assert.equal(test.toeicCliente,136730);
assert.equal(test.totalCliente,410330);
assert.equal(test.saldoCliente,410330);
assert.equal(test.total,273600,'financial total remains unchanged');
assert.equal(test.saldo,273600,'financial saldo remains unchanged');
const paid=sandbox.quote({nivel:'I2'},{...base,mat_pagada:20000,toeic_pagado:36730},'I2','CONAPE');
assert.equal(paid.saldoCliente,353600,'subtract already applied amounts');
const included=sandbox.quote({nivel:'I2'},{...base,toeic_aplica:true,
  toeic_incluido_proforma:true,proforma_toeic_confirmado:true,
  precio_toeic:130000},'I2','CONAPE');
assert.equal(included.toeicCliente,130000,'prefer confirmed TOEIC over reference');
const noToeic=sandbox.quote({nivel:'B1'},{...base,precio_programa_completo:0},'B1','SIN_INA');
assert.equal(noToeic.toeicCliente,0);
assert.equal(noToeic.saldoCliente,noToeic.saldo);
const babel=require(path.join(root,'vendor','babel.js'));
const jsxStart=source.indexOf('function AgIndCotizacionClienteHotfixF111(');
const jsxEnd=source.indexOf('function AdminEstudianteResumenIndividual(',jsxStart);
assert.ok(jsxStart>0&&jsxEnd>jsxStart);
const compiled=babel.transform(source.slice(jsxStart,jsxEnd),
 {presets:['react'],filename:'cotizacion-cliente.jsx'}).code;
new vm.Script(compiled);
// Parse the modified surrounding JSX, not historical runtime suites.
new vm.Script(babel.transform(source,{presets:['react'],filename:'admin_students.jsx'}).code);
assert.ok(source.includes('data-consulta-saldo-final="true"'));
assert.ok(source.includes("color:'#0756A8'"));
assert.ok(!source.includes('AgIndProformaLegacy,{codigo,referencia:cotizacion.toeicReferencia}'));
assert.ok(!source.includes('Cambio académico: {'));
assert.ok(!source.includes('Sin matrícula activa ni deuda exigible. Los precios proyectados'));
const app=fs.readFileSync(path.join(root,'src','app.jsx'),'utf8');
const html=fs.readFileSync(path.join(root,'campus.html'),'utf8');
assert.equal((app.match(/quote=F111CONSULTA410330/g)||[]).length,3);
assert.equal((html.match(/quote=F111CONSULTA410330/g)||[]).length,1);
console.log('F111_HOTFIX_CONSULTA_FOCAL_PASS 18 checks, calculations, JSX and cache-bust; prod writes 0');
