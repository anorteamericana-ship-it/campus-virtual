/**
 * F111 R57 selective release guard: only new B5+PDF integration.
 * Does not rerun oral, R51 PDF, F90 grade, or production student data suites.
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parseF96LazyMap} from './lib/parse_f96_lazy_map.mjs';
const base='949eeab724bf84a4d9db2363278d19e5d01f43f0';
const read=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
const app=read('src/app.jsx'),f92=read('src/solicitudes_unificadas.jsx'),
 modes=read('src/examenes_modes.jsx'),bundle=read('src/examenes_bundle.jsx'),
 html=read('modulos/examenes.html');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
let passed=0;
function check(ok, label){assert.ok(ok,label);console.log('PASS '+(++passed)+' '+label);}
const diff=execFileSync('git',['diff','--name-only',base,'--','src','modulos'],{encoding:'utf8'})
 .trim().split(/\r?\n/).filter(Boolean).sort();
const expected=['modulos/examenes.html','src/app.jsx','src/examenes_bundle.jsx',
 'src/examenes_modes.jsx','src/solicitudes_unificadas.jsx'].sort();
check(JSON.stringify(diff)===JSON.stringify(expected),'ONLY five functional files changed versus financial main');
for(const target of ['src/admin_students.jsx','src/aplicar_pago.jsx','src/solicitudes_pago.jsx',
 'src/vista_docente.jsx','src/teacher_views.jsx','src/student_modules.jsx',
 'src/student_experience.jsx','src/sidebar.jsx','src/cronograma_grupo.jsx','campus.html']){
 const before=execFileSync('git',['show',base+':'+target],{encoding:'utf8',maxBuffer:30e6}).replace(/\r\n/g,'\n');
 check(read(target)===before,'untouched '+target);
}
check(sha(modes)==='0321e49e09f221e7a27d3020717d65a0f95cf7dd7a623a4e917d229e7a5b3c7b',
 'written review source pinned exact SHA');
check(bundle.includes(modes),'served exam bundle includes pinned official PDF UI source');
const m=parseF96LazyMap(app);
check(Object.keys(m).length===33,'33 original lazy route keys preserved');
check(Object.values(m).flat().length===68,'68 original lazy asset refs preserved');
check(new Set(Object.values(m).flat().map(x=>x.split(/[?#]/)[0])).size===41,
 '41 original lazy source files preserved');
const version='F111R57B5PDF20261109C';
const assets=Object.values(m).flat().filter(x=>x.startsWith('src/solicitudes_unificadas.jsx?'));
check(assets.length===3&&assets.every(x=>x.startsWith('src/solicitudes_unificadas.jsx?v='+version))&&
 assets.filter(x=>x.endsWith('&deep=F111STUDENTDEEPTABS20261104A')).length===1,
 'student/admin B5 loaders are versioned and preserve bilingual deep-link cache scope');
check(app.includes('component="ReposicionesR57Docente"')&&
 app.includes("files={['src/solicitudes_unificadas.jsx?v="+version+"']}"),
 'teacher Exámenes explicitly lazy-loads B5 before rendering');
check(f92.includes('Object.assign(window,{ReposicionesR57Estudiante,ReposicionesR57Admin,ReposicionesR57Docente});'),
 'teacher target published as actual window component');
check(f92.includes("f92Post('reposCrearSolicitudR57'")&&
 f92.includes('data-r57-student-requests="true"'),
 'student uses authenticated B5 create endpoint');
check(f92.includes("f92Post('reposInvitarSolicitudR57'")&&
 f92.includes('data-r57-teacher-invitations="true"'),
 'teacher uses authenticated invitation endpoint');
check(f92.includes("f92Post('reposResolverSolicitudR57'")&&
 f92.includes("const isSuper=String(ses?.rol||'').toLowerCase()==='superadmin'"),
 'only superadmin UI has SI/NO decisions');
check(f92.includes("if(cyclesResult.status!=='fulfilled')")&&
 f92.includes('setEnabled(false);setPartial(false);'),
 'student fails closed without verified B5 cycle history');
const area=f92.split('// F111 R57 B5 — superficies nuevas')[1]?.split('function ReposicionStudentCardF92(')[0]||'';
check(area.length>13000&&!/f92Post\('(reposEnviarSolicitudF92|reposResolverSolicitudF92|CONFIRMAR_PAGO)/.test(area),
 'new B5 surfaces contain no historical paid flow');
check(!area.includes("String(e?.message||'sin_detalle')")&&
 area.includes('R57:recovery:diagnose')&&area.includes('R57:recovery:execute'),
 'admin recovery never exposes raw backend error details');
check(f92.includes("const legacyRows=rows.filter(r=>String(r.SOURCE||'')!=='F111_R57_B5')")&&
 app.includes("const visible=rows.filter(r=>String(r.SOURCE||'')!=='F111_R57_B5'"),
 'legacy F91/F92 lists exclude duplicate R57 records');
check(f92.includes('<ReposicionesR57Admin />')&&f92.includes('<ReposicionesR57Estudiante />'),
 'superadmin and student mount their true B5 components');
check(modes.includes("postExamBackend('reposGenerarPdfEscritoR57'")&&
 modes.includes("postExamBackend('reposConsultarPdfEscritoR57'")&&
 modes.includes('closed && pushed && pdfState'),
 'written PDF is still bound to officially closed, pushed attempt');
check(app.includes('F111R57WRITTENPDF20261109B')&&html.includes('F111R57WRITTENPDF20261109B'),
 'parent and iframe share PDF bundle cache version');
check(!app.includes('src/social_skill_docente_f111.jsx'),
 'unrelated Social Skill not loaded in selective branch');
check(f92.includes('data-r57-admin-requests="unavailable"')&&
 f92.includes('Reintentar consulta')&&f92.includes('Bandeja R57 no disponible'),
 'admin inbox remains visible with safe retry when the R57 read fails');
check(f92.includes("if(!Array.isArray(r.rows))throw new Error('r57_formato_listado_invalido')")&&
 f92.includes('setRows([]);setEnabled(false);'),
 'invalid R57 list cannot display stale admin decisions');
check(f92.includes('Actualizar bandeja R57')&&
 f92.includes('disabled={loading||!!busy}'),
 'manual read-only refresh blocks concurrent R57 decisions');
check(f92.includes('data-r57-legacy-history="true"')&&
 f92.includes('HISTORIAL · SISTEMA ANTERIOR (F92)')&&
 f92.includes('No hay reposiciones en el sistema anterior.'),
 'legacy F92 records are clearly separated from R57 and have truthful empty state');
check(!f92.includes('if(loading)return <div className="card">Cargando solicitudes de examen…</div>')&&
 f92.includes('Cargando historial anterior…'),
 'R57 admin inbox mounts independently of legacy F92 loading');
console.log('F111_R57_B5_PDF_SELECTIVE '+passed+'/'+passed+
 ' PASS; finance_writes=0; production_writes=0; release=NOT_AUTHORIZED');
