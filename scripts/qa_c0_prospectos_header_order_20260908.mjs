import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const must=(ok,msg)=>{if(!ok)throw new Error(`C0_HEADER_ORDER_FAIL: ${msg}`)};
const hash=p=>execFileSync('git',['hash-object',p],{encoding:'utf8'}).trim();

const patch='scripts/patch_apps_script_documentos_cs21a145.mjs';
const qa='scripts/qa_apps_script_documentos_cs21a145.mjs';
must(hash(patch)==='72ead6fab4715e880846a0f1eb608a083746dae4','historical patch blob drift');
must(hash(qa)==='4fcd1255add367624b0a1005677eb4bd8735b7a2','historical QA fixture blob drift');

const p=fs.readFileSync(patch,'utf8');
const q=fs.readFileSync(qa,'utf8');
const private6=['CED_FRENTE_FILE_ID','CED_DORSO_FILE_ID','DOC_IDENTIDAD_FILE_ID','TITULO_FILE_ID','DOC_IDENTIDAD_MODO','TITULO_MODO'];

must(p.includes("  'FOTO_CED_FRENTE','FOTO_CED_DORSO','FOTO_TITULO',\\n  'CED_FRENTE_FILE_ID','CED_DORSO_FILE_ID','DOC_IDENTIDAD_FILE_ID','TITULO_FILE_ID','DOC_IDENTIDAD_MODO','TITULO_MODO',"),'historical private block insertion contract changed');
must(q.includes("  'FOTO_CED_FRENTE','FOTO_CED_DORSO','FOTO_TITULO',\\n  'COMISION_PAGADA'"),'historical preimage adjacency changed');
for(const h of private6) must(p.includes(h),`private header missing ${h}`);

const removePrivate=(after)=>after.filter(x=>!private6.includes(x));
const before=['TIMESTAMP','CEDULA','NOMBRE','FOTO_CED_FRENTE','FOTO_CED_DORSO','FOTO_TITULO','COMISION_PAGADA'];
const after=['TIMESTAMP','CEDULA','NOMBRE','FOTO_CED_FRENTE','FOTO_CED_DORSO','FOTO_TITULO',...private6,'COMISION_PAGADA'];
must(JSON.stringify(removePrivate(after))===JSON.stringify(before),'synthetic algebraic preservation failed');
const wrong=[...before,...private6];
must(JSON.stringify(removePrivate(wrong))===JSON.stringify(before),'membership fixture sanity failed');
must(wrong.indexOf('CED_FRENTE_FILE_ID')!==after.indexOf('CED_FRENTE_FILE_ID'),'fixture must prove membership/count alone cannot establish position');

const doc=fs.readFileSync('00_DOCUMENTACION/C0_PROSPECTOS_HEADER_ORDER_2026-09-08.md','utf8');
for(const m of ['after - private6 === before','FOTO_TITULO → seis privadas → COMISION_PAGADA','62 runtime','C0=BLOQUEADO_HUMANO','E4=STOP']) must(doc.includes(m),`doc marker missing ${m}`);
console.log('C0 PROSPECTOS HEADER ORDER E0 PASS');
console.log('HISTORICAL_PRIVATE6_POSITION=AFTER_FOTO_TITULO_BEFORE_COMISION_PAGADA');
console.log('POST_MIGRATION_RULE=REMOVE_PRIVATE6_FROM_AFTER_EQUALS_BEFORE');
console.log('RUNTIME62=UNVERIFIED_IN_GITHUB');
console.log('C0=BLOQUEADO_HUMANO');
