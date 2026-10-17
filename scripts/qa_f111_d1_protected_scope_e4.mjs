// F111 PR-D1 E4: strict allowlist based on pinned immutable main source.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
const BASE='de49c25fa3de9f6a606a3d8d48832ebc296971cc';
const read=n=>fs.readFileSync('src/'+n,'utf8');
const golden=n=>execFileSync('git',['show',BASE+':src/'+n],{encoding:'utf8',maxBuffer:25*1024*1024});
const sha=s=>execFileSync('git',['hash-object','--stdin'],{input:s,encoding:'utf8'}).trim();
const hash={
 'examenes_modes.jsx':'1514d8e4e28b983c2c662d45fa509270dbf373f7',
 'examenes_app.jsx':'33a2b36a391ead8d04291eeb713b839e37e21d73',
 'examenes_appcss.jsx':'4f29e3c5b5290d6d97c54e95f48122b09d560452'
};
for(const [n,h] of Object.entries(hash))assert.equal(sha(golden(n)),h,'Pinned baseline mismatch '+n);
for(const n of ['examenes_css.jsx','examenes_data.jsx','examenes_render.jsx'])
 assert.equal(read(n),golden(n),'Protected engine or bank mutated: '+n);
const modes=read('examenes_modes.jsx'),prior=golden('examenes_modes.jsx');
const mStart=modes.indexOf('const F111_PC_SCHEDULE_D1'),mEnd=modes.indexOf('function MetaModal(',mStart);
const pStart=prior.indexOf('function AdminMode('),pEnd=prior.indexOf('function MetaModal(',pStart);
assert(mStart>1000&&mEnd>mStart&&pStart>1000&&pEnd>pStart);
assert.equal(modes.slice(0,mStart).trimEnd(),prior.slice(0,pStart).trimEnd(),'Teacher, backend admin operations or safe helpers changed');
const metaOld='Nivel detectado en archivo: "Test A · Interchange 3" (título del documento)';
const metaNew='Libro correspondiente al nivel: {e.libro} (el libro validado manda sobre el título de origen)';
assert.equal(modes.slice(mEnd).replace(metaNew,metaOld),prior.slice(pEnd),'Protected MetaModal tail changed');
assert.equal((modes.match(/function AdminMode\(/g)||[]).length,1,'AdminMode duplicated');
for(const check of ['<ActivationBackendPanel onPreview={onPreview} />','<BackendOperationsPanel />','<BackendContractSpecPanel />','function F111UpcomingActivationsD1('])
 assert(modes.includes(check),'Admin contract disappeared: '+check);
const adminOnly=modes.slice(mStart,mEnd);
assert(!/\bexam(?:CloseReview|PushReviewToNotas|SubmitAttempt|SaveAttemptDraft)\b/.test(adminOnly),'Unauthorized grade or student write from admin catalog');

let expected=golden('examenes_app.jsx');
const change=(old,next,description)=>{
 assert.equal(expected.split(old).length-1,1,'Unique baseline anchor: '+description);
 expected=expected.replace(old,next);
};
change('const [previewKey, setPreviewKey] = React.useState(true);','const [previewKey, setPreviewKey] = React.useState(false);','key hidden');
change("const [plan, setPlan] = React.useState('ambos'); // ambos | con_ina | sin_ina","const [plan, setPlan] = React.useState('con_ina'); // valor de preview; la ponderación real la define el servidor",'preview plan');
change("const goPreview = (entry) => {\n    if (!canEnter('preview')) return;\n    setPreviewExam(entry);\n    setViewRaw('preview');\n  };","const goPreview = (entry, showKey = false) => {\n    if (!canEnter('preview')) return;\n    setPreviewKey(!!showKey);\n    setPreviewExam(entry);\n    setViewRaw('preview');\n  };",'preview route');
// PR-D2 E1: reconstrucción exacta del delta estudiantil permitido, sin tocar roles, motor ni notas.
change('function StudentLiveExamApp() {', "// F111 PR-D2 E1 · contrato estricto para el payload oficial del estudiante.\n// No revela claves; el servidor mantiene la autorización, asignación y calificación.\nconst F111_EX04_FORBIDDEN_PUBLIC_KEYS = new Set([\n  'correct','accepted','answer','answers','answerkey','answerkeys','key',\n  'audioscript','transcript','solution','solutions','markscheme',\n  'privatekey','secret','gradingkey','teacherkey','correctanswer'\n]);\nfunction f111ExamPublicContractSafe(publicExam, activation) {\n  if (!publicExam || typeof publicExam !== 'object' || Array.isArray(publicExam)) return false;\n  const id = String(activation && activation.EXAM_ID || '').trim().toUpperCase();\n  const payloadId = String(publicExam.exam_id || publicExam.id || '').trim().toUpperCase();\n  if (!id || !payloadId || payloadId !== id) return false;\n  if (publicExam.id && publicExam.exam_id && String(publicExam.id).trim().toUpperCase() !== String(publicExam.exam_id).trim().toUpperCase()) return false;\n  if (publicExam.payload_scope !== 'student_public_no_keys' || publicExam.public_payload_version !== 'V10H') return false;\n  if (!Array.isArray(publicExam.sections) || !publicExam.sections.length) return false;\n  const visited = new WeakSet();\n  const scan = value => {\n    if (!value || typeof value !== 'object') return true;\n    if (visited.has(value)) return false;\n    visited.add(value);\n    if (Array.isArray(value)) return value.every(scan);\n    return Object.keys(value).every(k => {\n      const normalized = k.toLowerCase().replace(/[\\s_-]/g, '');\n      return !F111_EX04_FORBIDDEN_PUBLIC_KEYS.has(normalized) && scan(value[k]);\n    });\n  };\n  return scan(publicExam);\n}\n\n" + 'function StudentLiveExamApp() {', 'D2 backend payload validator');
change('  return <StudentMode\n', "  if (!f111ExamPublicContractSafe(publicExam, activation)) {\n    return <StudentLiveStatusCard title=\"Contenido de examen no disponible\" badge=\"Protección de examen\" tone=\"red\" onRefresh={load}>\n      El servidor no entregó un cuestionario oficial seguro para esta activación. No se mostrará ningún banco de respaldo ni se iniciará el intento. Contactá a la Academia.\n    </StudentLiveStatusCard>;\n  }\n" + '  return <StudentMode\n', 'D2 student fail closed');
const app=read('examenes_app.jsx');
const start='function ControlBar(',end='// Preview/admin:';
const a=app.indexOf(start),b=app.indexOf(end,a),c=expected.indexOf(start),d=expected.indexOf(end,c);
assert(a>0&&b>a&&c>0&&d>c);
assert.equal(app.slice(0,a),expected.slice(0,c),'Protected auth, student runtime or app config changed');
assert.equal(app.slice(b),expected.slice(d),'Protected preview, React mount or app changed');
assert.match(app.slice(a,b),/Mostrar respuestas \(personal autorizado\)/);

const css=read('examenes_appcss.jsx'),cssOld=golden('examenes_appcss.jsx');
const first='*{ box-sizing:border-box; }';
const delimiter='\n'+String.fromCharCode(96)+';\n(function(){';
const oldStyles=cssOld.slice(cssOld.indexOf(first),cssOld.indexOf(delimiter));
assert(css.includes(oldStyles),'Original shared/student/teacher stylesheet changed');
assert(css.includes('F111 PR-D1 E4')&&css.includes('F111 PR-D1 · Propuesta C'),'D1 scoped CSS missing');
const names=['examenes_css.jsx','examenes_appcss.jsx','examenes_data.jsx','examenes_render.jsx','examenes_modes.jsx','examenes_app.jsx'];
const bundle=read('examenes_bundle.jsx');
const prefix=bundle.slice(0,bundle.indexOf('// ===== '+names[0]+' ====='));
assert(prefix.includes('Generado desde:'));
assert.equal(bundle,prefix+names.map(n=>'// ===== '+n+' =====\n\n'+read(n)+'\n').join(''),'Effective bundle drift');
console.log('F111 E4 + D2 E1 STRICT SCOPE PASS: immutable student/teacher, backend operations, engine, question banks, original styles and 6/6 effective bundle.');
