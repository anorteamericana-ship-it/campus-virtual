#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_EXTENSIONS = new Set(['.gs', '.js', '.html', '.json']);
const TEXT_LIMIT = 8 * 1024 * 1024;

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function lineInfo(text, index) {
  const prefix = text.slice(0, index);
  const line = prefix.split('\n').length;
  const lineStart = prefix.lastIndexOf('\n') + 1;
  const column = index - lineStart + 1;
  const lineEnd = text.indexOf('\n', index);
  const snippet = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd).trim().slice(0, 240);
  return { line, column, snippet };
}

function walkFiles(root) {
  const files = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name.startsWith('.DS_Store')) continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(absolute);
      else if (entry.isFile()) files.push(absolute);
    }
  }
  return files.sort((a, b) => toPosix(path.relative(root, a)).localeCompare(toPosix(path.relative(root, b))));
}

function scanDoPost(text) {
  const patterns = [
    { type: 'function_declaration', regex: /\bfunction\s+doPost\s*\(/g },
    { type: 'variable_assignment', regex: /\b(?:var|let|const)\s+doPost\s*=\s*/g },
    { type: 'direct_assignment', regex: /(^|[^\w$.])doPost\s*=\s*(?:function\b|\(?[^=\n]*\)?\s*=>)/gm, offsetGroup: 1 },
    { type: 'global_assignment', regex: /\b(?:globalThis|this|window)\.doPost\s*=\s*/g },
  ];
  const captures = [];
  const seen = new Set();
  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0;
    let match;
    while ((match = pattern.regex.exec(text))) {
      let index = match.index;
      if (pattern.offsetGroup && match[pattern.offsetGroup]) index += match[pattern.offsetGroup].length;
      const key = `${pattern.type}:${index}`;
      if (seen.has(key)) continue;
      seen.add(key);
      captures.push({ type: pattern.type, index, ...lineInfo(text, index) });
      if (match[0].length === 0) pattern.regex.lastIndex += 1;
    }
  }
  return captures.sort((a, b) => a.index - b.index);
}

function scanDoPostAliases(text) {
  const regex = /\b(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*doPost\b/g;
  const aliases = [];
  let match;
  while ((match = regex.exec(text))) {
    aliases.push({ alias: match[1], index: match.index, ...lineInfo(text, match.index) });
  }
  return aliases;
}

function normalizeExternalOrder(root, order) {
  if (!order) return null;
  const normalized = order.map(item => toPosix(String(item).trim())).filter(Boolean);
  const duplicates = normalized.filter((item, idx) => normalized.indexOf(item) !== idx);
  if (duplicates.length) throw new Error(`El orden externo contiene duplicados: ${[...new Set(duplicates)].join(', ')}`);
  for (const relative of normalized) {
    const absolute = path.resolve(root, relative);
    if (!absolute.startsWith(path.resolve(root) + path.sep) && absolute !== path.resolve(root)) {
      throw new Error(`Ruta fuera del snapshot en orden externo: ${relative}`);
    }
    if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
      throw new Error(`Archivo inexistente en orden externo: ${relative}`);
    }
  }
  return normalized;
}

export function analyzeSnapshot(snapshotDir, options = {}) {
  const root = path.resolve(snapshotDir);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    throw new Error(`Snapshot inválido o inexistente: ${root}`);
  }

  const allFiles = walkFiles(root);
  if (!allFiles.length) throw new Error('Snapshot vacío.');
  const externalOrder = normalizeExternalOrder(root, options.effectiveOrder || null);

  const manifest = [];
  const doPostDefinitions = [];
  const doPostAliases = [];
  const appsscriptManifests = [];

  for (const absolute of allFiles) {
    const relative = toPosix(path.relative(root, absolute));
    const buffer = fs.readFileSync(absolute);
    const ext = path.extname(relative).toLowerCase();
    const entry = {
      path: relative,
      bytes: buffer.length,
      sha256: sha256(buffer),
      extension: ext || null,
      source_candidate: SOURCE_EXTENSIONS.has(ext),
    };
    manifest.push(entry);

    if (!SOURCE_EXTENSIONS.has(ext) || buffer.length > TEXT_LIMIT) continue;
    const text = buffer.toString('utf8');
    if (path.basename(relative) === 'appsscript.json') {
      try {
        appsscriptManifests.push({ path: relative, valid_json: true, value: JSON.parse(text) });
      } catch (error) {
        appsscriptManifests.push({ path: relative, valid_json: false, error: String(error.message || error) });
      }
    }
    for (const item of scanDoPost(text)) doPostDefinitions.push({ file: relative, ...item });
    for (const item of scanDoPostAliases(text)) doPostAliases.push({ file: relative, ...item });
  }

  const lexicalFiles = manifest.map(item => item.path);
  const sourceFiles = manifest.filter(item => item.source_candidate).map(item => item.path);
  const suppliedOrderDefinitions = externalOrder
    ? doPostDefinitions.slice().sort((a, b) => {
        const ai = externalOrder.indexOf(a.file);
        const bi = externalOrder.indexOf(b.file);
        const av = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
        const bv = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
        return av - bv || a.index - b.index;
      })
    : null;

  const guardCandidates = doPostDefinitions
    .filter(item => /guard|staging|readonly|read_only|sec004/i.test(item.file))
    .map(item => ({ file: item.file, line: item.line, type: item.type }));

  return {
    schema: 'apps_script_snapshot_analysis.cs21a172.v1',
    generated_at: new Date().toISOString(),
    snapshot_root_name: path.basename(root),
    metadata: {
      project_id: options.projectId || null,
      deployment_id: options.deploymentId || null,
      deployment_version: options.deploymentVersion || null,
      source_provenance: options.sourceProvenance || null,
    },
    counts: {
      files_total: manifest.length,
      source_candidates: sourceFiles.length,
      doPost_definitions: doPostDefinitions.length,
      doPost_alias_captures: doPostAliases.length,
      appsscript_manifests: appsscriptManifests.length,
    },
    order: {
      lexical_file_order: lexicalFiles,
      effective_order_status: externalOrder ? 'SUPPLIED_EXTERNAL_ORDER' : 'UNPROVEN',
      effective_order_warning: externalOrder
        ? 'El orden fue suministrado externamente. El analizador valida rutas pero no demuestra por sí solo que sea el orden efectivo de Apps Script.'
        : 'No se infiere orden efectivo por nombre de archivo. Debe aportarse evidencia externa del orden/cadena real de wrappers antes de instalar SEC-002/SEC-004.',
      supplied_external_order: externalOrder,
    },
    manifest,
    appsscript_manifests: appsscriptManifests,
    doPost: {
      definitions: doPostDefinitions,
      aliases_of_previous_doPost: doPostAliases,
      definitions_in_supplied_order: suppliedOrderDefinitions,
      guard_candidates: guardCandidates,
    },
  };
}

export function renderMarkdown(report) {
  const lines = [
    '# Apps Script snapshot analysis · CS21A172',
    '',
    `- Generated: ${report.generated_at}`,
    `- Files: ${report.counts.files_total}`,
    `- Source candidates: ${report.counts.source_candidates}`,
    `- doPost definitions/reassignments: ${report.counts.doPost_definitions}`,
    `- Captures of previous doPost aliases: ${report.counts.doPost_alias_captures}`,
    `- Effective order: **${report.order.effective_order_status}**`,
    '',
    `> ${report.order.effective_order_warning}`,
    '',
    '## Metadata',
    '',
    `- Project ID: ${report.metadata.project_id || 'UNSET'}`,
    `- Deployment ID: ${report.metadata.deployment_id || 'UNSET'}`,
    `- Deployment version: ${report.metadata.deployment_version || 'UNSET'}`,
    `- Provenance: ${report.metadata.source_provenance || 'UNSET'}`,
    '',
    '## doPost inventory',
    '',
  ];
  if (!report.doPost.definitions.length) lines.push('- No doPost definition/reassignment detected.');
  for (const item of report.doPost.definitions) {
    lines.push(`- \`${item.file}:${item.line}\` · ${item.type} · \`${item.snippet.replace(/`/g, '\\`')}\``);
  }
  lines.push('', '## SHA-256 manifest', '');
  for (const item of report.manifest) lines.push(`- \`${item.sha256}\`  \`${item.path}\`  (${item.bytes} bytes)`);
  lines.push('');
  return lines.join('\n');
}

function parseArgs(argv) {
  const args = [...argv];
  const snapshotDir = args.shift();
  if (!snapshotDir) throw new Error('Uso: node scripts/analyze_apps_script_snapshot_cs21a172.mjs <snapshot-dir> [--out DIR] [--project-id ID] [--deployment-id ID] [--version N] [--provenance TEXT] [--order-file FILE]');
  const options = { outDir: 'qa-output-apps-script-snapshot' };
  while (args.length) {
    const flag = args.shift();
    const value = args.shift();
    if (!value) throw new Error(`Falta valor para ${flag}`);
    if (flag === '--out') options.outDir = value;
    else if (flag === '--project-id') options.projectId = value;
    else if (flag === '--deployment-id') options.deploymentId = value;
    else if (flag === '--version') options.deploymentVersion = value;
    else if (flag === '--provenance') options.sourceProvenance = value;
    else if (flag === '--order-file') {
      options.effectiveOrder = fs.readFileSync(value, 'utf8').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    } else throw new Error(`Flag desconocido: ${flag}`);
  }
  return { snapshotDir, options };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const { snapshotDir, options } = parseArgs(process.argv.slice(2));
    const report = analyzeSnapshot(snapshotDir, options);
    const outDir = path.resolve(options.outDir);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'snapshot-analysis.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(outDir, 'snapshot-analysis.md'), renderMarkdown(report));
    console.log(`CS21A172 SNAPSHOT ANALYZED: files=${report.counts.files_total}; doPost=${report.counts.doPost_definitions}; order=${report.order.effective_order_status}`);
  } catch (error) {
    console.error(`CS21A172 SNAPSHOT ANALYZER BLOCKED: ${error.message || error}`);
    process.exit(1);
  }
}
