import fs from 'node:fs';

const data = fs.readFileSync('src/admin_master_conape_data_cs21a96.jsx', 'utf8');
const view = fs.readFileSync('src/admin_master_conape_view_cs21a96.jsx', 'utf8');
const core = fs.readFileSync('src/admin_master_conape_review_core_cs21a96.jsx', 'utf8');

function check(condition, message) {
  if (!condition) {
    console.error(`FAIL CS21A196: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

check(data.includes('Morosidad verificada con el registro oficial.'), 'refresh message uses final R2 operational copy');
check(view.includes('No quedan desembolsos académicos 01 pendientes según el registro oficial de morosidad.'), 'empty state uses operational copy');
check(!data.includes('Morosidad verificada directamente en 7-morosidad oficial.'), 'internal sheet name removed from refresh message');
check(!view.includes('pendientes según 7-morosidad.'), 'internal sheet name removed from empty state');

check(data.includes("post('getConapeMoraStates',{items})"), 'mora endpoint remains unchanged');
check(data.includes('moraSourceSheet:live.sourceSheet||row.moraSourceSheet'), 'internal source metadata remains available to logic');
check(data.includes('masterConapeSafeUserError'), 'CS21A195 safe-error boundary remains');
check(/function\s+masterConapeSafeUserError\s*\(\s*raw\s*,\s*fallback\s*,\s*context(?:\s*=\s*['"]{2})?\s*\)/.test(core), 'CS21A195 helper remains');

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A196 ADMIN MASTER CONAPE USER COPY: PASS');
console.log('VISIBLE_7_MOROSIDAD=REMOVED');
console.log('MORA_LOGIC=UNCHANGED');
