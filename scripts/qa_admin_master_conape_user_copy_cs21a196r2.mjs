import fs from 'node:fs';

const data=fs.readFileSync('src/admin_master_conape_data_cs21a96.jsx','utf8');
const view=fs.readFileSync('src/admin_master_conape_view_cs21a96.jsx','utf8');
const all=data+'\n'+view;

const required=[
  'Morosidad verificada con el registro oficial.',
  'No quedan desembolsos académicos 01 pendientes según el registro oficial.',
  "const moraResult=await refreshMora(false);if(!moraResult?.ok)return;",
  'masterConapeSafeUserError',
];
for(const needle of required){if(!all.includes(needle))throw new Error(`CS21A196R2 missing: ${needle}`)}

const forbidden=[
  'Morosidad verificada directamente en 7-morosidad oficial.',
  'No quedan desembolsos académicos 01 pendientes según 7-morosidad.',
];
for(const needle of forbidden){if(all.includes(needle))throw new Error(`CS21A196R2 visible internal source remains: ${needle}`)}

if(!data.includes("post('getConapeMoraStates',{items})"))throw new Error('CS21A196R2 changed morosidad source unexpectedly.');

console.log('CS21A196R2 ADMIN MASTER CONAPE USER COPY: PASS');
console.log('VISIBLE_7_MOROSIDAD_REFERENCES=NO_FOR_GUARDED_COPY');
console.log('MORA_SOURCE_AND_ENDPOINT=UNCHANGED');
console.log('CS21A195R2_TRUTHFUL_REFRESH=PRESERVED');
