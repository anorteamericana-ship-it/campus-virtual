import fs from 'node:fs';

const path = 'services/conape-bridge/server_v2.mjs';
let source = fs.readFileSync(path, 'utf8');

const importMarker = "import { chromium } from 'playwright';\n";
const publisherImport = "import { buildConapeV44DryRunSummary } from './conape_v44_publisher.mjs';\n";
if (!source.includes(importMarker)) throw new Error('V44_PATCH_IMPORT_MARKER_MISSING');
if (!source.includes(publisherImport)) source = source.replace(importMarker, importMarker + publisherImport);

const oldVersion = "const VERSION = 'V4.3.3';";
const newVersion = "const VERSION = 'V4.4.0-PUBLISHER-DRYRUN';";
if (!source.includes(newVersion)) {
  if (!source.includes(oldVersion)) throw new Error('V44_PATCH_VERSION_MARKER_MISSING');
  source = source.replace(oldVersion, newVersion);
}

const listRouteMarker = "    if (req.method === 'GET' && url.pathname === '/v1/prospects/list') {\n";
const previewRouteNeedle = "url.pathname === '/v1/prospects/v44-publisher-preview'";
const previewRoute = `    if (req.method === 'GET' && url.pathname === '/v1/prospects/v44-publisher-preview') {\n      action = 'v44_publisher_preview';\n      const auth = await authorizeCampusSession(campusTokenFromRequest(req));\n      const previewRole = roleOf(auth.session);\n      if (!['ADMIN','ADMINISTRADOR','SUPERADMIN','SUPER ADMIN'].includes(previewRole)) {\n        throw new AppError('CAMPUS_ROLE_FORBIDDEN', 'Rol no autorizado para preparar el publisher V4.4.', 403, 'CAMPUS');\n      }\n      const result = await serial(() => listProspectsFromHome());\n      const payload = buildConapeV44DryRunSummary(result, process.env);\n      console.log(JSON.stringify({ rid, action, result:payload.code, method:payload.method, rows_csv:payload.rows_csv, rows_html_all:payload.rows_html_all, counts_match:payload.counts_match, columns_ok:payload.columns_ok, apply_enabled:false, ms:Date.now()-started, pii:false }));\n      sendJson(res, 200, payload, origin);\n      return;\n    }\n`;
if (!source.includes(previewRouteNeedle)) {
  if (!source.includes(listRouteMarker)) throw new Error('V44_PATCH_LIST_ROUTE_MARKER_MISSING');
  source = source.replace(listRouteMarker, previewRoute + listRouteMarker);
}

if (!source.includes(publisherImport) || !source.includes(newVersion) || !source.includes(previewRouteNeedle)) {
  throw new Error('V44_PATCH_POSTCONDITION_FAILED');
}
if (/agentConapeMirrorApplySnapshotV44/.test(source) && /fetch\s*\([^)]*CAMPUS_URL/.test(source.slice(source.indexOf(previewRouteNeedle) - 500, source.indexOf(previewRouteNeedle) + 3000))) {
  throw new Error('V44_PATCH_APPLY_TRANSPORT_FORBIDDEN');
}

fs.writeFileSync(path, source, 'utf8');
console.log('CONAPE V4.4 server publisher dry-run patch: PASS');
