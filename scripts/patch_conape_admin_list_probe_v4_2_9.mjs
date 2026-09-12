import fs from 'node:fs';

function read(path){ return fs.readFileSync(path,'utf8'); }
function write(path, content){ fs.writeFileSync(path, content, 'utf8'); }
function replaceOnce(source, from, to, label){
  const first = source.indexOf(from);
  if(first < 0) throw new Error(`missing preimage: ${label}`);
  if(source.indexOf(from, first + from.length) >= 0) throw new Error(`duplicate preimage: ${label}`);
  return source.slice(0, first) + to + source.slice(first + from.length);
}

// ── Bridge runtime ────────────────────────────────────────────────────────────
const serverPath='services/conape-bridge/server_v2.mjs';
let server=read(serverPath);
server=replaceOnce(server,"const VERSION = 'V4.2.8';","const VERSION = 'V4.2.9';",'bridge version');
server=replaceOnce(server,
`  let irFiltersBefore = 0;\n  const rowsByCedula = new Map();`,
`  let irFiltersBefore = 0;\n  let rowsCsv = null;\n  let rowsHtmlAll = null;\n  let countsMatch = false;\n  const rowsByCedula = new Map();`,
'list counters');
server=replaceOnce(server,
`      const csvRows = new Map();\n      addProspectRows(csvRows, csv.rows);`,
`      const csvRows = new Map();\n      addProspectRows(csvRows, csv.rows);\n      rowsCsv = csvRows.size;\n      method = 'CSV_DOWNLOAD';\n      pages = 1;`,
'csv count');
server=replaceOnce(server,
`      const htmlRows = new Map();\n      addProspectRows(htmlRows, html.rows);\n      const csvKeys = [...csvRows.keys()].sort();\n      const htmlKeys = [...htmlRows.keys()].sort();\n      if (csvKeys.length !== htmlKeys.length || sha(csvKeys.join('|')) !== sha(htmlKeys.join('|'))) {\n        throw new AppError('CONAPE_LIST_COUNT_MISMATCH', 'CSV y Rows=All no devolvieron el mismo conjunto de prospectos.', 503, 'LIST');\n      }\n      for (const row of csvRows.values()) rowsByCedula.set(row.cedula, row);\n      method = 'CSV_DOWNLOAD';\n      pages = 1;\n      columnsOk = true;`,
`      const htmlRows = new Map();\n      addProspectRows(htmlRows, html.rows);\n      rowsHtmlAll = htmlRows.size;\n      columnsOk = true;\n      const csvKeys = [...csvRows.keys()].sort();\n      const htmlKeys = [...htmlRows.keys()].sort();\n      countsMatch = rowsCsv === rowsHtmlAll && sha(csvKeys.join('|')) === sha(htmlKeys.join('|'));\n      if (!countsMatch) {\n        const mismatch = new AppError('LIST_COUNT_MISMATCH', 'CSV y Rows=All no devolvieron el mismo conjunto de prospectos.', 503, 'LIST');\n        Object.assign(mismatch, { rows_csv:rowsCsv, rows_html_all:rowsHtmlAll, counts_match:false, columns_ok:true, method:'CSV_DOWNLOAD', ms:Date.now()-started, ir_filters_before:irFiltersBefore });\n        throw mismatch;\n      }\n      for (const row of csvRows.values()) rowsByCedula.set(row.cedula, row);`,
'csv/html count comparison');
server=replaceOnce(server,
`        if (!hasNext) {\n          addProspectRows(rowsByCedula, html.rows);\n          method = 'HTML_ROWS_ALL';\n          pages = 1;\n          columnsOk = true;\n        }`,
`        if (!hasNext) {\n          const normalizedHtmlRows = normalizeProspectRows(html.rows);\n          rowsHtmlAll = normalizedHtmlRows.length;\n          addProspectRows(rowsByCedula, normalizedHtmlRows);\n          method = 'HTML_ROWS_ALL';\n          pages = 1;\n          columnsOk = true;\n          countsMatch = false;\n        }`,
'rows all count');
server=replaceOnce(server,
`      ok:true, code:'PROSPECT_LIST_READY', rows:[...rowsByCedula.values()], row_count:rowsByCedula.size,\n      pages, method, columns_ok:columnsOk, ir_filters_before:irFiltersBefore, captured_at:nowIso(),`,
`      ok:true, code:'PROSPECT_LIST_READY', rows:[...rowsByCedula.values()], row_count:rowsByCedula.size,\n      pages, method, rows_csv:rowsCsv, rows_html_all:rowsHtmlAll, counts_match:countsMatch,\n      columns_ok:columnsOk, ms:Date.now()-started, ir_filters_before:irFiltersBefore, captured_at:nowIso(),`,
'list response safe counts');
server=replaceOnce(server,
`      event:'conape_list_dump', method, rows:rowsByCedula.size, columns_ok:columnsOk,\n      ms:Date.now()-started, ir_filters_before:irFiltersBefore, pii:false,`,
`      event:'conape_list_dump', method, rows:rowsByCedula.size, rows_csv:rowsCsv, rows_html_all:rowsHtmlAll, counts_match:countsMatch, columns_ok:columnsOk,\n      ms:Date.now()-started, ir_filters_before:irFiltersBefore, pii:false,`,
'list telemetry counts');
server=replaceOnce(server,
`      const result = await serial(() => listProspectsFromHome());\n      sendJson(res, 200, result, origin);`,
`      const result = await serial(() => listProspectsFromHome());\n      const summaryOnly = /^(1|true)$/i.test(txt(url.searchParams.get('summary')));\n      const payload = summaryOnly ? {\n        ok:true, code:result.code, method:result.method, rows_csv:result.rows_csv, rows_html_all:result.rows_html_all,\n        counts_match:result.counts_match === true, columns_ok:result.columns_ok === true,\n        ms:Number(result.ms || 0), ir_filters_before:Number(result.ir_filters_before || 0),\n      } : result;\n      sendJson(res, 200, payload, origin);`,
'summary-only list response');
server=replaceOnce(server,
`      ...(typeof error?.phone_update_available === 'boolean' ? { phone_update_available:error.phone_update_available } : {}),\n    }, origin);`,
`      ...(typeof error?.phone_update_available === 'boolean' ? { phone_update_available:error.phone_update_available } : {}),\n      ...(Number.isInteger(error?.rows_csv) ? { rows_csv:error.rows_csv } : {}),\n      ...(Number.isInteger(error?.rows_html_all) ? { rows_html_all:error.rows_html_all } : {}),\n      ...(typeof error?.counts_match === 'boolean' ? { counts_match:error.counts_match } : {}),\n      ...(typeof error?.columns_ok === 'boolean' ? { columns_ok:error.columns_ok } : {}),\n      ...(error?.method ? { method:txt(error.method) } : {}),\n      ...(Number.isFinite(Number(error?.ms)) ? { ms:Number(error.ms) } : {}),\n      ...(Number.isFinite(Number(error?.ir_filters_before)) ? { ir_filters_before:Number(error.ir_filters_before) } : {}),\n    }, origin);`,
'error safe count fields');
write(serverPath,server);

// ── Browser bridge client ─────────────────────────────────────────────────────
const clientPath='src/conape_bridge_client_c3_6.js';
let client=read(clientPath);
client=replaceOnce(client,
`  async function sessionStatus(){ return postBridge('/v1/session/status', {}); }`,
`  async function getBridge(path){\n    const base = bridgeBase();\n    if (!base) return { ok:false, error:'conape_bridge_not_configured' };\n    const token = window.getSessionToken ? window.getSessionToken() : '';\n    if (!token) return { ok:false, error:'campus_session_required' };\n    try {\n      const response = await fetch(base + path, {\n        method:'GET', mode:'cors', credentials:'omit',\n        headers:{ 'Authorization':'Bearer ' + token },\n        cache:'no-store',\n      });\n      const raw = await response.text();\n      let data;\n      try { data = JSON.parse(raw || '{}'); }\n      catch { return { ok:false, error:'conape_bridge_invalid_response' }; }\n      return data && typeof data === 'object' ? data : { ok:false, error:'conape_bridge_invalid_response' };\n    } catch (error) {\n      console.error('[CONAPE V3] Bridge no disponible.', error);\n      return { ok:false, error:'conape_bridge_unavailable' };\n    }\n  }\n\n  async function listProspects(options){\n    const summary = options?.summary === true ? '?summary=1' : '';\n    return getBridge('/v1/prospects/list' + summary);\n  }\n\n  async function sessionStatus(){ return postBridge('/v1/session/status', {}); }`,
'client GET list');
client=replaceOnce(client,
`    submit,\n    active:!!bridgeBase(),\n    version:'V3.0',`,
`    submit,\n    listProspects,\n    active:!!bridgeBase(),\n    version:'V3.1',`,
'client api list');
write(clientPath,client);

// ── Lazy admin route ──────────────────────────────────────────────────────────
const appPath='src/app.jsx';
let app=read(appPath);
app=replaceOnce(app,
`  admin_master: ['src/admin_master_charts.jsx?v=F98.4Z6CL','src/admin_master_dashboard.jsx?v=F98.4Z6CS21A94'],`,
`  admin_master: ['src/conape_bridge_config_c3_6.js?v=V4.2.9','src/conape_bridge_client_c3_6.js?v=V3.1.0','src/admin_master_charts.jsx?v=F98.4Z6CL','src/admin_master_dashboard.jsx?v=F98.4Z6CS21A94C'],`,
'admin lazy bridge dependencies');
write(appPath,app);

// ── Admin-only probe UI ───────────────────────────────────────────────────────
const dashboardPath='src/admin_master_dashboard.jsx';
let dashboard=read(dashboardPath);
const probe = `function MasterConapeRecruitmentProbe(){\n  const [state,setState]=React.useState({busy:false,error:'',data:null});\n  const run=async()=>{\n    setState({busy:true,error:'',data:null});\n    const api=window.CONAPE_PORTAL_BRIDGE_V3||window.CONAPE_PORTAL_BRIDGE_C37||window.CONAPE_PORTAL_BRIDGE_C36;\n    if(!api?.listProspects){setState({busy:false,error:'El lector CONAPE no está disponible en esta sesión.',data:null});return;}\n    const data=await api.listProspects({summary:true});\n    if(!data?.ok){\n      const mismatch=data?.code==='LIST_COUNT_MISMATCH';\n      setState({busy:false,error:mismatch?'Los conteos CSV y Rows=All no coinciden. No se debe avanzar al espejo.':'No se pudo completar la validación de la lista CONAPE.',data:data||null});\n      return;\n    }\n    setState({busy:false,error:'',data});\n  };\n  const d=state.data;\n  const value=v=>v==null?'No disponible':String(v);\n  return <section className=\"master-card master-conape-list-probe\" aria-live=\"polite\"><header><div><span>Reclutamiento CONAPE · lectura segura</span><h3>Validar lista completa antes del espejo</h3><p>Compara automáticamente el CSV de APEX contra el DOM con Rows=All. No muestra datos personales.</p></div><div className=\"master-actions\"><button type=\"button\" onClick={run} disabled={state.busy}>{state.busy?'Validando…':'Validar lista CONAPE'}</button></div></header>{state.error&&<div className=\"master-inline-warning\">{state.error}</div>}{d&&<div className=\"master-conape-month-kpis\"><div><b>{value(d.method)}</b><span>Método</span></div><div><b>{value(d.rows_csv)}</b><span>Filas CSV</span></div><div><b>{value(d.rows_html_all)}</b><span>Filas Rows=All</span></div><div><b>{d.counts_match===true?'Sí':'No'}</b><span>Conteos coinciden</span></div><div><b>{d.columns_ok===true?'Sí':'No'}</b><span>14 columnas válidas</span></div><div><b>{value(d.ms)} ms</b><span>Duración</span></div><div><b>{value(d.ir_filters_before)}</b><span>Filtros antes de RIR</span></div></div>}</section>;\n}\n\n`;
dashboard=replaceOnce(dashboard,'function AdminMasterDashboard({onNavigate}) {',probe+'function AdminMasterDashboard({onNavigate}) {','admin list probe component');
dashboard=replaceOnce(dashboard,
`    <main className="master-content"><div className="master-section-heading"><div><span>{selectedMeta.label}</span><h2>{section==='resumen'?'Visión ejecutiva de la academia':section==='ventas'?'Analítica comercial y matrículas':section==='academica'?'Control operativo académico en tiempo real':section==='estudiantes'?'Retención, asistencia y riesgo estudiantil':section==='seguimiento'?'Prioridades operativas, rescate y seguimiento humano por grupo':section==='cobranza'?'Cobros aplicados, cartera activa y morosidad':section==='conape'?'Financiamiento, desembolsos y vinculación institucional':section==='docentes'?'Carga, cumplimiento y salud operativa docente':section==='examenes'?'Aplicación, revisión y rendimiento académico':section==='alertas'?'Centro transversal de alertas y pendientes institucionales':section==='tendencias'?'Evolución multianual de la Academia':selectedMeta.label}</h2></div></div>{section==='resumen'?`,
`    <main className="master-content"><div className="master-section-heading"><div><span>{selectedMeta.label}</span><h2>{section==='resumen'?'Visión ejecutiva de la academia':section==='ventas'?'Analítica comercial y matrículas':section==='academica'?'Control operativo académico en tiempo real':section==='estudiantes'?'Retención, asistencia y riesgo estudiantil':section==='seguimiento'?'Prioridades operativas, rescate y seguimiento humano por grupo':section==='cobranza'?'Cobros aplicados, cartera activa y morosidad':section==='conape'?'Financiamiento, desembolsos y vinculación institucional':section==='docentes'?'Carga, cumplimiento y salud operativa docente':section==='examenes'?'Aplicación, revisión y rendimiento académico':section==='alertas'?'Centro transversal de alertas y pendientes institucionales':section==='tendencias'?'Evolución multianual de la Academia':selectedMeta.label}</h2></div></div>{section==='conape'&&<MasterConapeRecruitmentProbe/>}{section==='resumen'?`,
'admin probe render only conape section');
write(dashboardPath,dashboard);

// ── Cache bust root app ───────────────────────────────────────────────────────
const campusPath='campus.html';
let campus=read(campusPath);
campus=replaceOnce(campus,'src/app.jsx?v=F98.4Z6CS21A142','src/app.jsx?v=F98.4Z6CS21A143','campus app cache bust');
write(campusPath,campus);

// ── Existing bridge QA ────────────────────────────────────────────────────────
const qaPath='scripts/qa_conape_bridge_v2.mjs';
let qa=read(qaPath);
qa=qa.replace(/CONAPE_LIST_COUNT_MISMATCH/g,'LIST_COUNT_MISMATCH');
const insertBefore = `  ['Docker contiene solo server_v2 + self-test, sin patcher runtime',`;
const qaChecks = `  ['V4.2.9 expone conteos CSV y Rows=All y falla cerrado en mismatch', ['rows_csv','rows_html_all','counts_match'].every(v=>server.includes(v)) && /LIST_COUNT_MISMATCH/.test(server) && /Object\.assign\(mismatch/.test(server)],\n  ['V4.2.9 summary=1 no devuelve filas con PII al navegador', /summaryOnly/.test(server) && /url\.searchParams\.get\('summary'\)/.test(server) && /const payload = summaryOnly \? \{/.test(server)],\n  ['V4.2.9 telemetría de lista conserva solo conteos y pii false', /event:'conape_list_dump'/.test(server) && ['rows_csv','rows_html_all','counts_match','columns_ok','ir_filters_before','pii:false'].every(v=>server.includes(v))],\n`;
if(!qa.includes(insertBefore)) throw new Error('missing QA insertion point');
qa=qa.replace(insertBefore,qaChecks+insertBefore);
write(qaPath,qa);

// ── Dedicated UI contract QA ─────────────────────────────────────────────────
const uiQa=`import fs from 'node:fs';\nconst read=p=>fs.readFileSync(p,'utf8');\nconst client=read('src/conape_bridge_client_c3_6.js');\nconst app=read('src/app.jsx');\nconst dashboard=read('src/admin_master_dashboard.jsx');\nconst campus=read('campus.html');\nconst server=read('services/conape-bridge/server_v2.mjs');\nfunction must(ok,msg){if(!ok){console.error('FAIL:',msg);process.exitCode=1}else console.log('PASS:',msg)}\nconst probeStart=dashboard.indexOf('function MasterConapeRecruitmentProbe');\nconst probeEnd=dashboard.indexOf('function AdminMasterDashboard',probeStart);\nconst probe=probeStart>=0&&probeEnd>probeStart?dashboard.slice(probeStart,probeEnd):'';\nconst summaryStart=server.indexOf('const payload = summaryOnly ? {');\nconst summaryEnd=server.indexOf('} : result;',summaryStart);\nconst summaryBlock=summaryStart>=0&&summaryEnd>summaryStart?server.slice(summaryStart,summaryEnd):'';\nmust(/async function getBridge/.test(client)&&/method:'GET'/.test(client)&&/Authorization':'Bearer '/.test(client),'cliente usa GET con token Campus en Authorization');\nmust(/listProspects/.test(client)&&/\/v1\/prospects\/list/.test(client)&&/summary=1/.test(client),'cliente expone listProspects summary-only');\nmust(app.includes("src/conape_bridge_config_c3_6.js?v=V4.2.9")&&app.includes("src/conape_bridge_client_c3_6.js?v=V3.1.0")&&app.indexOf('conape_bridge_client_c3_6.js')<app.indexOf('admin_master_dashboard.jsx'),'Panel Maestro carga config/cliente antes del dashboard');\nmust(dashboard.includes("section==='conape'&&<MasterConapeRecruitmentProbe/>")&&probe.length>0,'botón se monta solo dentro de sección CONAPE del Panel Maestro admin');\nmust(['method','rows_csv','rows_html_all','counts_match','columns_ok','ms','ir_filters_before'].every(v=>probe.includes(v)),'UI muestra exclusivamente telemetría de contraste requerida');\nmust(!/cedula|apellido|nombre|correo|telefono|rows\s*\[|\.rows\b/i.test(probe),'probe no renderiza PII ni filas del listado');\nmust(summaryBlock.length>0&&!/\brows\s*:/.test(summaryBlock)&&['rows_csv','rows_html_all','counts_match','columns_ok','ms','ir_filters_before'].every(v=>summaryBlock.includes(v)),'summary=1 omite array rows y devuelve solo metadatos seguros');\nmust(server.includes("new AppError('LIST_COUNT_MISMATCH'")&&server.includes('rows_csv:rowsCsv')&&server.includes('rows_html_all:rowsHtmlAll'),'mismatch devuelve ambos conteos sin PII');\nmust(campus.includes('src/app.jsx?v=F98.4Z6CS21A143'),'campus fuerza cache-bust del router admin');\n`;
write('scripts/qa_conape_admin_list_probe_v4_2_9.mjs',uiQa);

// ── Extend existing CONAPE workflow to cover admin surface ───────────────────
const workflowPath='.github/workflows/qa-conape-live-c3-6.yml';
let workflow=read(workflowPath);
workflow=replaceOnce(workflow,
`      - 'src/conape_bridge_config_c3_6.js'\n      - 'src/conape_session_ui_c3_7.js'`,
`      - 'src/conape_bridge_config_c3_6.js'\n      - 'src/app.jsx'\n      - 'src/admin_master_dashboard.jsx'\n      - 'campus.html'\n      - 'src/conape_session_ui_c3_7.js'`,
'workflow admin paths');
workflow=replaceOnce(workflow,
`      - 'scripts/qa_conape_bridge_v2.mjs'\n      - '.github/workflows/qa-conape-live-c3-6.yml'`,
`      - 'scripts/qa_conape_bridge_v2.mjs'\n      - 'scripts/qa_conape_admin_list_probe_v4_2_9.mjs'\n      - '.github/workflows/qa-conape-live-c3-6.yml'`,
'workflow qa path');
workflow=replaceOnce(workflow,
`      - name: Bridge V2 contract gate\n        run: node scripts/qa_conape_bridge_v2.mjs\n      - name: Diff hygiene`,
`      - name: Bridge V2 contract gate\n        run: node scripts/qa_conape_bridge_v2.mjs\n      - name: Admin list probe contract gate\n        run: node scripts/qa_conape_admin_list_probe_v4_2_9.mjs\n      - name: Diff hygiene`,
'workflow ui gate');
write(workflowPath,workflow);

console.log('PATCH_CONAPE_ADMIN_LIST_PROBE_V4_2_9_OK');
