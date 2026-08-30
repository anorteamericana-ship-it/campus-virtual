import fs from 'node:fs';

function replaceOne(path,oldText,newText,label){let src=fs.readFileSync(path,'utf8');const count=src.split(oldText).length-1;if(count!==1)throw new Error(`${label}: expected 1 preimage, found ${count}`);src=src.replace(oldText,newText);fs.writeFileSync(path,src);console.log(`${label}: replaced 1`)}
replaceOne('src/admin_master_conape_data_cs21a96.jsx','Morosidad verificada directamente en 7-morosidad oficial.','Morosidad verificada con el registro oficial.','verification copy');
replaceOne('src/admin_master_conape_view_cs21a96.jsx','No quedan desembolsos académicos 01 pendientes según 7-morosidad.','No quedan desembolsos académicos 01 pendientes según el registro oficial.','empty-state copy');
console.log('CS21A195 exact copy patch applied');
