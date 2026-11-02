// F111 hotfix: reversal button must actually be loaded by campus.html.
// Pure static regression; NO live payment or account writes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('campus.html','utf8');
const inline=fs.readFileSync('src/admin_students_inline_payment_cs21a36.jsx','utf8');
const reversal=fs.readFileSync('src/admin_students_status_fresh_cs21a42.jsx','utf8');
const names=[
  'src/admin_students_inline_payment_cs21a36.jsx',
  'src/admin_students_status_fresh_cs21a42.jsx',
  'src/admin_students_certificate_integrity_cs21a42.jsx',
];
let checks=0;
for(const name of names){assert.equal(html.split('src="'+name+'?').length-1,1,'script loaded once: '+name);checks++;}
const starts=names.map(n=>html.indexOf('src="'+n+'?'));
assert.ok(starts[0]<starts[1]&&starts[1]<starts[2],'reversal loads after inline payment');checks++;
assert.match(html,/type="text\/babel" data-plugins="transform-block-scoping" src="src\/admin_students_status_fresh_cs21a42\.jsx\?/);checks++;
assert.ok(inline.includes('window.__AN_INLINE_PAYMENT_BUILD__=BUILD;'));checks++;
assert.ok(reversal.includes("if(installed||!window.__AN_INLINE_PAYMENT_BUILD__)return false;"));checks++;
assert.ok(reversal.includes("if(!allowed)return null;"));checks++;
assert.ok(reversal.includes("postRev('getOperacionesPagoReversibles'"));checks++;
assert.ok(reversal.includes("postRev('revertirPagoOperacion'"));checks++;
assert.ok(reversal.includes("codigo_esperado:codigo"));checks++;
assert.ok(reversal.includes("window.confirm("));checks++;
assert.ok(!html.includes('REVERSION_FORCED')&&!reversal.includes('deleteRow('),'no bypass payment reversals');checks++;
console.log(JSON.stringify({ok:true,mode:'FRONTEND_ONLY',checks,backend_deploys:0,payment_writes:0}));
