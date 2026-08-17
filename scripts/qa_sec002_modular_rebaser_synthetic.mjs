import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const helper = path.resolve('scripts/apply_sec002_modular_exact.mjs');
const endpoints = `
function descargarMiCertificadoPrivado() {}
function descargarDocumentoExtraPrivado() {}
function descargarComprobantePagoPrivado() {}
function descargarMatriculaFirmadaPrivada() {}
`;

function write(p,s){ fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,s,'utf8'); }
function runCase({duplicate=false}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'sec002-mod-rebase-'));
  const repo = path.join(root,'repo');
  const apps = path.join(root,'apps');
  const report = path.join(root,'report.json');
  fs.mkdirSync(path.join(repo,'qa'),{recursive:true});
  fs.mkdirSync(apps,{recursive:true});

  write(path.join(apps,'01_Router.js'), `alpha\nrouter-old\nomega\nrouter-second-old\n${endpoints}`);
  write(path.join(apps,'14_Notas_Cierre_Certificados.js'), `cert-a\ncert-old\ncert-z\n`);
  write(path.join(apps,'20_Inscripcion_Ventas_Matricula.js'), duplicate ? 'dupe-old\n' : 'ventas-stable\n');
  write(path.join(apps,'21_Pagos_Banco_CONAPE.js'), duplicate ? 'dupe-old\n' : 'pagos-stable\n');

  const p1 = duplicate
    ? `--- Code.gs\n+++ Code.gs.x\n@@ -1 +1 @@\n-dupe-old\n+dupe-new\n`
    : `--- Code.gs\n+++ Code.gs.x\n@@ -1,3 +1,3 @@\n alpha\n-router-old\n+router-new\n omega\n@@ -1,3 +1,3 @@\n cert-a\n-cert-old\n+cert-new\n cert-z\n`;
  const p2 = `--- Code.gs\n+++ Code.gs.y\n@@ -3,3 +3,3 @@\n omega\n-router-second-old\n+router-second-new\n function descargarMiCertificadoPrivado() {}\n`;
  write(path.join(repo,'qa','p1.patch'),p1);
  if (!duplicate) write(path.join(repo,'qa','p2.patch'),p2);
  const manifest = duplicate
    ? {ordered_deltas:[{order:1,path:'qa/p1.patch',expected_hunks:1}]}
    : {ordered_deltas:[{order:1,path:'qa/p1.patch',expected_hunks:2},{order:2,path:'qa/p2.patch',expected_hunks:1}]};
  write(path.join(repo,'qa','sec002_private_delivery_bundle_manifest.json'),JSON.stringify(manifest));

  const proc = spawnSync(process.execPath,[helper,'--apps-dir',apps,'--repo-root',repo,'--report',report],{encoding:'utf8'});
  return {root,repo,apps,report,proc,json:JSON.parse(fs.readFileSync(report,'utf8'))};
}

const ok = runCase({duplicate:false});
if (ok.proc.status !== 0) throw new Error(`positive case failed: ${ok.proc.stdout}\n${ok.proc.stderr}`);
if (!ok.json.ok || ok.json.applied_hunks !== 3) throw new Error('positive report did not confirm 3 hunks');
const changed = [...ok.json.changed_files].sort();
if (changed.join('|') !== ['01_Router.js','14_Notas_Cierre_Certificados.js'].join('|')) throw new Error(`unexpected changed files: ${changed}`);
if (!fs.readFileSync(path.join(ok.apps,'01_Router.js'),'utf8').includes('router-new')) throw new Error('router change missing');
if (!fs.readFileSync(path.join(ok.apps,'14_Notas_Cierre_Certificados.js'),'utf8').includes('cert-new')) throw new Error('certificate change missing');
console.log('PASS modular rebaser positive exact multi-file case');

const neg = runCase({duplicate:true});
if (neg.proc.status !== 2) throw new Error(`duplicate case should stop with 2, got ${neg.proc.status}`);
if (neg.json.ok || neg.json.failures?.[0]?.exact_match_count !== 2) throw new Error('duplicate preimage did not fail closed');
if (fs.readFileSync(path.join(neg.apps,'20_Inscripcion_Ventas_Matricula.js'),'utf8').includes('dupe-new')) throw new Error('negative case mutated source');
console.log('PASS modular rebaser duplicate preimage fails closed without write');
console.log('SEC002 MODULAR REBASER SYNTHETIC QA: PASS');
