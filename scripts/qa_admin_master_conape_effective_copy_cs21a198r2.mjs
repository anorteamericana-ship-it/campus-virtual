import fs from 'node:fs';

const files = [
  'src/admin_master_conape_data_cs21a96.jsx',
  'src/admin_master_conape_view_cs21a96.jsx',
  'src/admin_master_conape_multisort_cs21a109.jsx',
  'src/admin_master_conape_panel_cs21a96.jsx',
];
const text = Object.fromEntries(files.map(path => [path, fs.readFileSync(path, 'utf8')]));
const all = files.map(path => text[path]).join('\n');

if (all.includes('No quedan desembolsos académicos 01 pendientes según 7-morosidad.')) {
  throw new Error('CS21A198R2 effective runtime still contains visible 7-morosidad empty-state copy.');
}
if (!text['src/admin_master_conape_view_cs21a96.jsx'].includes('No quedan desembolsos académicos 01 pendientes según el registro oficial.')) {
  throw new Error('CS21A198R2 base PanelView clean copy missing.');
}
if (!text['src/admin_master_conape_multisort_cs21a109.jsx'].includes('No quedan desembolsos académicos 01 pendientes según el registro oficial.')) {
  throw new Error('CS21A198R2 multisort effective PanelView clean copy missing.');
}
if (!text['src/admin_master_conape_data_cs21a96.jsx'].includes('Morosidad verificada con el registro oficial.')) {
  throw new Error('CS21A198R2 verification copy regressed.');
}
if (!text['src/admin_master_conape_panel_cs21a96.jsx'].includes('const{clean,levelId,injectStyles,useConapePanelData:baseUseConapePanelData,useConapeReview,PanelView')) {
  throw new Error('CS21A198R2 panel composition contract changed unexpectedly.');
}

console.log('CS21A198R2 ADMIN MASTER CONAPE EFFECTIVE COPY: PASS');
console.log('BASE_PANELVIEW=CLEAN');
console.log('MULTISORT_PANELVIEW=CLEAN');
console.log('VISIBLE_7_MOROSIDAD_RUNTIME_COPY=NO');
console.log('LOAD_COMPOSITION=PRESERVED');
