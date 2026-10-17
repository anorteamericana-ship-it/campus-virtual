// F111 · Hotfix Campus real: centro único superadmin, sin cambios académicos.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const base='ffd25fc9253e295d0412cf799e51631f37ee6431';
const source=fs.readFileSync('src/app.jsx','utf8');
const baseline=execFileSync('git',['show',base+':src/app.jsx'],{encoding:'utf8',maxBuffer:24*1024*1024});
const anchor="  const superadmin=String(ses?.rol||'').toLowerCase()==='superadmin';\n  const oralSrc=";
const inject="  const superadmin=String(ses?.rol||'').toLowerCase()==='superadmin';\n  // F111 D1 LIVE HOTFIX · El Centro C es la ÚNICA pantalla de Exámenes del\n  // superadmin: no duplicar tabs/encabezado y no montar el reporte de reposiciones.\n  // Este último conserva su componente y sus datos fuera de esta vista.\n  if (superadmin) {\n    return <ExamenesIframePanel\n      hideHeader\n      view=\"admin\"\n      screenLabel=\"Superadmin · Centro de exámenes\"\n      iframeTitle=\"Centro de exámenes · Escritos, Orales y Progress Check\"\n    />;\n  }\n  const oralSrc=";
assert.equal(baseline.split(anchor).length-1,1,'Anchor exacto una vez');
assert.equal(source,baseline.replace(anchor,inject),'Cambios fuera del gate no autorizados');
const adminStart=source.indexOf('function ExamenesAdminPanel()');
const adminEnd=source.indexOf('const APP_ORAL_DEFS_F927',adminStart);
assert(adminStart>=0&&adminEnd>adminStart,'Componente admin original conservado');
const admin=source.slice(adminStart,adminEnd);
assert(admin.indexOf('if (superadmin)')<admin.indexOf('return <section data-screen-label="Admin · Exámenes"'),'Centro nuevo antes de wrapper antiguo');
assert(admin.indexOf('if (superadmin)')<admin.indexOf('<ReposicionesPanelF91 role="admin" />'),'Superadmin no monta reposiciones');
assert.match(admin,/return <ExamenesIframePanel\s+hideHeader\s+view="admin"/,'Centro directo y sin cabecera duplicada');
assert.match(admin,/<ReposicionesPanelF91 role="admin" \/>/,'Ruta histórica conservada para admin regular');
assert.match(source,/examenes:\s+<ExamenesAdminPanel \/>/,'Ruta del sidebar preservada');
assert(source.includes('modulos/examenes.html?view='),'Iframe apunta a módulo real');
const protectedPaths=['src/examenes_bundle.jsx','src/examenes_modes.jsx','src/examenes_app.jsx','src/examenes_data.jsx','src/sidebar.jsx'];
for(const path of protectedPaths){
 const old=execFileSync('git',['show',base+':'+path],{encoding:'utf8',maxBuffer:30*1024*1024});
 assert.equal(fs.readFileSync(path,'utf8'),old,'Motor o navegación alterados: '+path);
}
console.log('F111 SINGLE-CENTER PASS: único Centro C superadmin, no reposiciones en su vista, admin legacy intacto, 5 archivos protegidos idénticos.');
