import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const psPath = 'scripts/export_apps_script_qa_snapshot_cs21a178.ps1';
const analyzerPath = 'scripts/apps_script_qa_snapshot_manifest_cs21a178.mjs';
const ps = fs.readFileSync(psPath, 'utf8');
const analyzer = fs.readFileSync(analyzerPath, 'utf8');
const failures = [];
const check = (ok, msg) => ok ? console.log(`PASS: ${msg}`) : failures.push(msg);

const QA_SCRIPT_ID = '1GMHihGwnX_-sIS101rRlUoYpAH2HSKyms8lx6L9z7bjb_45YDn-ph6WD';
check(ps.includes(`$QaScriptId = '${QA_SCRIPT_ID}'`), 'exporter apunta al Script ID QA canónico');
check(ps.includes("@('clone-script',$QaScriptId)"), 'exporter usa clone-script read-only');
check(ps.includes("@('show-authorized-user','--json')"), 'exporter solo verifica sesión clasp');
check(!/Invoke-Clasp[^\n]*@\(['\"](?:push|deploy|create-deployment|update-deployment|undeploy)/i.test(ps), 'exporter no invoca escritura/deploy clasp');
check(!/Invoke-Clasp[^\n]*@\(['\"]login['\"]/i.test(ps), 'exporter no inicia login automáticamente');
check(ps.includes("credentials_persisted_in_snapshot = $false"), 'snapshot declara no persistir credenciales');
check(ps.includes("remote_write_performed = $false"), 'snapshot declara cero escritura remota');
check(ps.includes("$MinimumSourceFiles = 37"), 'gate mínimo evita paquetes modulares viejos/recortados');
check(ps.includes("Remove-Item -LiteralPath $WorkRoot -Recurse -Force"), 'solo limpia workdir temporal generado por el propio script');
check(analyzer.includes("'01_Router.js'"), 'baseline exige 01_Router');
check(analyzer.includes("'44_English_LAB_Live_Base.js'"), 'baseline exige English LAB base');
check(analyzer.includes("'95_English_LAB_CS21A144_Al_Dia.js'"), 'baseline exige wrapper CS21A144');
check(analyzer.includes("'99_QA_Staging_Guard.js'"), 'baseline exige QA staging guard');
check(analyzer.includes('do_post_inventory'), 'manifest inventaría doPost');
check(analyzer.includes('aggregate_sha256'), 'manifest produce hash agregado reproducible');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cs21a178-'));
try {
  const source = path.join(tmp, 'source');
  fs.mkdirSync(source, { recursive: true });
  const required = [
    '01_Router.js',
    '44_English_LAB_Live_Base.js',
    '95_English_LAB_CS21A144_Al_Dia.js',
    '99_QA_Staging_Guard.js',
  ];
  required.forEach((name, i) => {
    const body = i === 0
      ? `function doPost(e) { return {ok:true}; }\n// ${name}\n`
      : i === 2
        ? `var _prevDoPost = doPost;\ndoPost = function(e) { return _prevDoPost(e); };\n// ${name}\n`
        : `// ${name}\nfunction helper_${i}() { return true; }\n`;
    fs.writeFileSync(path.join(source, name), body, 'utf8');
  });
  for (let i = 0; i < 33; i++) {
    fs.writeFileSync(path.join(source, `${String(i + 2).padStart(2, '0')}_Synthetic_${i}.js`), `// synthetic ${i}\n`, 'utf8');
  }
  const output = path.join(tmp, 'manifest.json');
  const run = spawnSync(process.execPath, [
    analyzerPath,
    '--source-dir', source,
    '--output', output,
    '--script-id', QA_SCRIPT_ID,
    '--min-files', '37',
    '--expect-baseline',
  ], { encoding: 'utf8' });
  check(run.status === 0, `analyzer sintético pasa (${run.stderr || run.stdout})`);
  if (run.status === 0 && fs.existsSync(output)) {
    const m = JSON.parse(fs.readFileSync(output, 'utf8'));
    check(m.source_file_count === 37, 'manifest cuenta exactamente las 37 fuentes sintéticas');
    check(m.script_id === QA_SCRIPT_ID, 'manifest conserva Script ID');
    check(m.baseline.missing_required_basenames.length === 0, 'baseline sintético completo');
    check(m.do_post_inventory.some(x => x.path === '01_Router.js' && x.direct_definition_lines.length === 1), 'detecta doPost base');
    check(m.do_post_inventory.some(x => x.path === '95_English_LAB_CS21A144_Al_Dia.js' && x.assignment_definition_lines.length === 1), 'detecta wrapper doPost por asignación');
    check(/^[a-f0-9]{64}$/.test(m.aggregate_sha256), 'aggregate SHA-256 válido');
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

if (failures.length) {
  console.error('QA APPS SCRIPT QA READONLY SNAPSHOT CS21A178 FAIL');
  failures.forEach(x => console.error('-', x));
  process.exit(1);
}
console.log('QA APPS SCRIPT QA READONLY SNAPSHOT CS21A178 PASS');
