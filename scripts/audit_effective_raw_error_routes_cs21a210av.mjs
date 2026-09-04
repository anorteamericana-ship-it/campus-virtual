import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

function must(ok,msg){ if(!ok){ console.error('FAIL:',msg); process.exitCode=1; } else console.log('PASS:',msg); }
const read=p=>fs.readFileSync(p,'utf8');
const app=read('src/app.jsx');
const campus=read('campus.html');
const insHtml=read('inscripcion.html');
const ins=read('src/inscripcion.jsx');
const cron=read('src/cronograma.jsx');
const bank=read('src/importador_banco.jsx');

console.log('CS21A210AV EFFECTIVE RAW ERROR ROUTE AUDIT');

must(/src\/inscripcion\.jsx\?v=/.test(insHtml),'public inscripcion.html loads src/inscripcion.jsx');
const rawNeedles=[
  'setErr(e.message)',
  'setGroupsError(e.message)',
  'setGlobalError(e.message)',
  'setSubmitError(e.message)',
  "setErr(String(e&&e.message||'No se pudo abrir la foto.'))",
];
const rawCount=rawNeedles.filter(needle=>ins.includes(needle)).length;
must(rawCount===0 || rawCount===rawNeedles.length,'inscripcion is in a partial raw/safe migration state');
if(rawCount===rawNeedles.length){
  for(const needle of rawNeedles) must(ins.includes(needle),`inscripcion raw sink present: ${needle}`);
  must(ins.includes('{globalError && <div className="ins-main"><Alert type="error">{globalError}</Alert></div>}'),'globalError reaches visible Alert');
  must(ins.includes('error={groupsError}'),'groupsError reaches visible GroupStep');
  must(ins.includes('error={submitError}'),'submitError reaches visible ReviewStep');
  must(ins.includes('{err && <Alert type="error">{err}</Alert>}'),'cedula error reaches visible Alert');
  console.log('CLASSIFICATION|EFFECTIVE_VISIBLE|src/inscripcion.jsx|5');
  console.log('NEXT_ATOMIC_TARGET|src/inscripcion.jsx|public enrollment safe-error boundary');
} else {
  execFileSync('node',['scripts/qa_inscripcion_public_safe_errors_cs21a210ax.mjs'],{stdio:'inherit'});
  for(const needle of rawNeedles) must(!ins.includes(needle),`AX descendant keeps raw sink absent: ${needle}`);
  console.log('CLASSIFICATION|MIGRATED_SAFE|src/inscripcion.jsx|AX');
  console.log('NEXT_ATOMIC_TARGET|NONE_FROM_AV_SNAPSHOT|descendant fixes already classified');
}

must(/cronograma:\s*\['src\/cronograma\.jsx/.test(app),'cronograma route is effective in F96_LAZY');
must(cron.includes('.catch(e => setError(e.message))'),'cronograma scanner sink still present');
must(cron.includes("if (error || !data) return <div style={{padding:40,textAlign:'center',color:'var(--ink-3)'}}>No se pudo cargar el cronograma.</div>;"),'cronograma collapses error to generic visible copy');

must(/banco:\s*\['src\/importador_banco\.jsx[^\]]*src\/importador_banco_integridad_cs21a114\.jsx/.test(app),'bank route loads CS21A114 override after base importer');
must(bank.includes('caught.message'),'base bank scanner finding exists but is behind effective CS21A114 override');

const runtime = [campus,app,insHtml].join('\n');
for(const legacy of ['MATRIC~3.JSX','PANEL_~1.JSX','SOLICI~2.JSX','ADMIN_~4.JSX']){
  must(!runtime.includes(legacy),`${legacy} absent from primary runtime entrypoints checked`);
}

console.log('CLASSIFICATION|EFFECTIVE_NOT_RAW_VISIBLE|src/cronograma.jsx|1');
console.log('CLASSIFICATION|SHADOWED_BY_OVERRIDE|src/importador_banco.jsx|1');
console.log('CLASSIFICATION|NO_PRIMARY_RUNTIME_REF|legacy-shortname-aliases|4');
if(process.exitCode) process.exit(process.exitCode);
console.log('CS21A210AV PASS');
