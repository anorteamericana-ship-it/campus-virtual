// F111 R57: release boundary for the NEW written PDF UI only.
// No student data and no repetition of oral/grade/PDF R51 E1 suites.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const modes=read('src/examenes_modes.jsx'),bundle=read('src/examenes_bundle.jsx');
const index=read('modulos/examenes.html'),app=read('src/app.jsx');
const begin=modes.indexOf('function TeacherWrittenBackendReviewF940(');
const end=modes.indexOf('\nfunction ',begin+10);
assert(begin>=0&&end>begin,'official teacher written review must exist');
const view=modes.slice(begin,end);
let n=0;
function gate(check,label){assert.ok(check,label);console.log('PASS '+(++n)+' '+label);}
gate(view.includes("postExamBackend('reposConsultarPdfEscritoR57'"),'server-authenticated read endpoint');
gate(view.includes("postExamBackend('reposGenerarPdfEscritoR57'"),'server-authorized PDF generation');
gate(view.includes("incluir_pdf_base64:'SI'"),'server-authorized binary download');
gate(view.includes('closed && pushed && pdfState'),'cannot offer PDF before official grade');
gate(view.includes('pdfState.existe ? ('),'download only existing official archive');
gate(view.includes('pdfState.requiere_preparacion ? ('),'missing official archive schema never creates silently');
gate(view.includes('busy'), 'in-flight mutations disable duplicate actions');
gate(view.includes('window.URL.revokeObjectURL(url)'), 'releases browser blob URL');
gate(!view.includes('pdf_url')&&!view.includes('backup_url'),'does not expose Drive archive URLs as direct frontend links');
gate(!view.includes('setShare')&&!view.includes('DriveApp'),'never modifies document ACL client-side');
gate(bundle.includes(view),'effective bundle carries the identical written teacher component');
gate(/F111R57WRITTENPDF20261109B/.test(index)&&/F111R57WRITTENPDF20261109B/.test(app),'parent frame and module use the same cache version');
gate(index.includes('examenes_bundle.jsx'),'student/teacher get effective served bundle');
gate(!/F111_R57_ALLOW_WRITTEN_PDF\s*=\s*SI/.test(view),'frontend cannot bypass server feature gate');
console.log('F111_R57_WRITTEN_PDF_UI_SOURCE_GATE '+n+'/'+n+' PASS, prod_writes=0');
