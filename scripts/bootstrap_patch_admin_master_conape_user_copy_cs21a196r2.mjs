import fs from 'node:fs';

function patch(path, label, from, to){
  let src=fs.readFileSync(path,'utf8');
  const count=src.split(from).length-1;
  if(count!==1)throw new Error(`${label}: expected exactly 1 preimage, found ${count}`);
  src=src.replace(from,to);
  fs.writeFileSync(path,src);
  console.log(`${label}: replaced 1`);
}

patch(
  'src/admin_master_conape_data_cs21a96.jsx',
  'verification copy',
  'Morosidad verificada directamente en 7-morosidad oficial.',
  'Morosidad verificada con el registro oficial.'
);
patch(
  'src/admin_master_conape_view_cs21a96.jsx',
  'empty-state copy',
  'No quedan desembolsos académicos 01 pendientes según 7-morosidad.',
  'No quedan desembolsos académicos 01 pendientes según el registro oficial.'
);

console.log('CS21A196R2 exact copy patch applied');
