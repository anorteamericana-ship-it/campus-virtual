import fs from 'node:fs';
import vm from 'node:vm';

const data=fs.readFileSync('src/ventas_data.jsx','utf8');
const dash=fs.readFileSync('src/ventas_dashboard.jsx','utf8');
const table=fs.readFileSync('src/ventas_sortable_table_cs21a20.jsx','utf8');
const parts=fs.readFileSync('src/ventas_parts.jsx','utf8');
const panel=fs.readFileSync('src/ventas_conape_prospectacion_v1.jsx','utf8');
const html=fs.readFileSync('ventas.html','utf8');

let fail=0;
const check=(ok,msg)=>{if(ok) console.log('PASS '+msg); else {fail++;console.error('FAIL '+msg);}};

check(data.includes("label: 'CONAPE Aprobado para firma'"),'funnel keeps approved-for-signature state');
check(data.includes("label: 'CONAPE Formalizado'"),'funnel contains formalized state');
check(data.includes("label: 'CONAPE Depósito detectado'"),'funnel names detected deposit explicitly');
check(data.includes("String(p.conape_motor || '').toUpperCase() === 'PROSPECTACION_V2'"),'student status honors backend V2 authority');
check(data.includes("prioridadConape === 'ALTA'"),'priority uses V2 high-priority alert');
check(data.includes("return prospecto;\n  if (String(prospecto.financiamiento"),'legacy bridge merge stops before mutating V2');
check(dash.includes("const conapeV2 = data.conape_motor_version === 'PROSPECTACION_V2'"),'dashboard detects backend V2');
check(dash.includes("if (!conapeV2 && bridge"),'legacy bridge is disabled for V2');
check(table.includes('<th>CONAPE</th>'),'desktop table has CONAPE column');
check(table.includes('p?.conape_estado'),'desktop CONAPE column reads derived state');
check(table.includes('p?.conape_accion'),'desktop action reads derived seller action');
check(table.includes("state.toUpperCase()==='SIN REGISTRO CONAPE'"),'recruit button is limited to missing CONAPE record under V2');
check(parts.includes('CONAPE · {p.conape_estado}'),'mobile card exposes derived CONAPE state');
check(panel.includes('Código último depósito'),'Prospectación panel labels disbursement as code');
for (const f of ['ventas_data.jsx','ventas_parts.jsx','ventas_sortable_table_cs21a20.jsx','ventas_conape_prospectacion_v1.jsx','ventas_dashboard.jsx']) {
  check(html.includes('src/'+f+'?v=CONAPE-V2-SALES-20261004'),f+' cache-bust is V2');
}

// JSX parse/transform with the exact Babel bundle shipped by the site.
const sandbox={window:{},self:{},console,setTimeout,clearTimeout};
sandbox.window=sandbox;
sandbox.self=sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('vendor/babel.js','utf8'),sandbox,{filename:'vendor/babel.js'});
for (const f of ['src/ventas_data.jsx','src/ventas_parts.jsx','src/ventas_sortable_table_cs21a20.jsx','src/ventas_conape_prospectacion_v1.jsx','src/ventas_dashboard.jsx']) {
  try {
    sandbox.Babel.transform(fs.readFileSync(f,'utf8'),{presets:['react'],plugins:['transform-block-scoping']});
    console.log('PASS Babel '+f);
  } catch (e) {
    fail++;
    console.error('FAIL Babel '+f+' :: '+e.message);
  }
}

if(fail) process.exit(1);
console.log('QA_CONAPE_SALES_V2_UI=PASS');
