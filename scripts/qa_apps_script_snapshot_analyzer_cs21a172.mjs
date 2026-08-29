import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { analyzeSnapshot, renderMarkdown } from './analyze_apps_script_snapshot_cs21a172.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cs21a172-'));
try {
  fs.writeFileSync(path.join(root, '01_Router.js'), [
    'function doPost(e) {',
    '  return routeBase(e);',
    '}',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(root, '95_English_LAB.js'), [
    'var cs95PreviousDoPost = doPost;',
    'doPost = function(e) {',
    '  return cs95PreviousDoPost(e);',
    '};',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(root, '99_QA_Staging_Guard.js'), [
    'var qaPreviousDoPost = doPost;',
    'doPost = function(e) {',
    '  return qaPreviousDoPost(e);',
    '};',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(root, 'appsscript.json'), JSON.stringify({ timeZone: 'America/Costa_Rica', runtimeVersion: 'V8' }, null, 2));

  const report = analyzeSnapshot(root, {
    projectId: 'QA_PROJECT_TEST',
    deploymentId: 'QA_DEPLOYMENT_TEST',
    deploymentVersion: 'HEAD',
    sourceProvenance: 'synthetic-fixture',
  });

  assert.equal(report.schema, 'apps_script_snapshot_analysis.cs21a172.v1');
  assert.equal(report.counts.files_total, 4);
  assert.equal(report.counts.source_candidates, 4);
  assert.equal(report.counts.doPost_definitions, 3);
  assert.equal(report.counts.doPost_alias_captures, 2);
  assert.equal(report.counts.appsscript_manifests, 1);
  assert.equal(report.order.effective_order_status, 'UNPROVEN');
  assert.equal(report.order.supplied_external_order, null);
  assert.match(report.order.effective_order_warning, /No se infiere orden efectivo/);
  assert.ok(report.manifest.every(item => /^[a-f0-9]{64}$/.test(item.sha256)));
  assert.deepEqual(report.doPost.definitions.map(item => item.file), [
    '01_Router.js',
    '95_English_LAB.js',
    '99_QA_Staging_Guard.js',
  ]);
  assert.ok(report.doPost.guard_candidates.some(item => item.file === '99_QA_Staging_Guard.js'));
  assert.deepEqual(report.doPost.aliases_of_previous_doPost.map(item => item.alias), ['cs95PreviousDoPost', 'qaPreviousDoPost']);

  const beforeHash = report.manifest.find(item => item.path === '95_English_LAB.js').sha256;
  fs.appendFileSync(path.join(root, '95_English_LAB.js'), '// one-byte-class change\n');
  const changed = analyzeSnapshot(root);
  const afterHash = changed.manifest.find(item => item.path === '95_English_LAB.js').sha256;
  assert.notEqual(beforeHash, afterHash, 'SHA-256 debe cambiar cuando cambia el snapshot');

  const order = ['01_Router.js', '95_English_LAB.js', '99_QA_Staging_Guard.js', 'appsscript.json'];
  const ordered = analyzeSnapshot(root, { effectiveOrder: order });
  assert.equal(ordered.order.effective_order_status, 'SUPPLIED_EXTERNAL_ORDER');
  assert.deepEqual(ordered.order.supplied_external_order, order);
  assert.deepEqual(ordered.doPost.definitions_in_supplied_order.map(item => item.file), [
    '01_Router.js',
    '95_English_LAB.js',
    '99_QA_Staging_Guard.js',
  ]);
  assert.match(ordered.order.effective_order_warning, /no demuestra por sí solo/);

  assert.throws(() => analyzeSnapshot(root, { effectiveOrder: ['MISSING.js'] }), /Archivo inexistente/);
  assert.throws(() => analyzeSnapshot(root, { effectiveOrder: ['01_Router.js', '01_Router.js'] }), /duplicados/);

  const markdown = renderMarkdown(ordered);
  assert.match(markdown, /Effective order: \*\*SUPPLIED_EXTERNAL_ORDER\*\*/);
  assert.match(markdown, /99_QA_Staging_Guard\.js/);
  assert.match(markdown, /SHA-256 manifest/);

  console.log('QA APPS SCRIPT SNAPSHOT ANALYZER CS21A172 PASS');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
