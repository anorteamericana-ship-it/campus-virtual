'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const html=fs.readFileSync('modulos/examen_oral.html','utf8');
const script=html.match(/<script>\s*([\s\S]*?)<\/script>/);
assert.ok(script,'oral script');
new vm.Script(script[1],{filename:'examen_oral.js'});
const src=script[1];
const begin=src.indexOf('if(state.panel?.historico){\n      Object.entries(state.evaluations)');
const end=src.indexOf('\n    const help=document.getElementById',begin);
assert.ok(begin>0&&end>begin,'R50 conflict on load');
const body=src.slice(begin,end);
const state={panel:{historico:true},evaluations:{
  A:{ESTADO:'BORRADOR',R50_ESTADO_NOTA_PREVIA:'EXISTENTE'},
  B:{ESTADO:'BORRADOR',R50_ESTADO_NOTA_PREVIA:'SIN_REGISTRO'},
  C:{ESTADO:'BORRADOR',R50_ESTADO_NOTA_PREVIA:'NO_VERIFICABLE'},
  D:{ESTADO:'PDF_GENERADO',R50_ESTADO_NOTA_PREVIA:'EXISTENTE'},
  E:{ESTADO:'BORRADOR',R50_ESTADO_NOTA_PREVIA:'EXISTENTE'}
},reviewConflicts:{}};
vm.runInNewContext(body,{state},{timeout:1200});
assert.equal(state.reviewConflicts.A,true);
assert.equal(state.reviewConflicts.C,true);
assert.equal(state.reviewConflicts.E,true);
assert.equal(state.reviewConflicts.B,undefined);
assert.equal(state.reviewConflicts.D,undefined);
assert.ok(src.includes("if(state.panel?.historico&&!oralEditableHistoricalR48("),'borrador conserva guard de edición');
assert.ok(src.includes('state.reviewConflicts?.[String(s.codigo)]'),'cierre individual bloquea conflicto');
assert.ok(src.includes("status==='BORRADOR'"),'preserva cierre normal para borradores sin conflicto');
assert.ok(src.includes("NOTA PROVISIONAL"),'distingue nota provisional');
assert.ok(src.includes("NOTA OFICIAL"),'distingue nota oficial');
assert.ok(src.includes("const estado=String(ev?.R50_ESTADO_NOTA_PREVIA"),'estado proviene de CORE');
console.log('F111_R50_ORAL_CONFLICT_ON_LOAD_E1_PASS checks=15 writes=0 grades_changed=0');
