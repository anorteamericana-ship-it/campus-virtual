import fs from 'node:fs';

const serverPath = 'services/conape-bridge/server_v2.mjs';
const qaPath = 'scripts/qa_conape_bridge_v2.mjs';
let server = fs.readFileSync(serverPath, 'utf8');
let qa = fs.readFileSync(qaPath, 'utf8');

function replaceOnce(source, from, to, label) {
  const first = source.indexOf(from);
  if (first < 0) throw new Error(`missing preimage: ${label}`);
  if (source.indexOf(from, first + from.length) >= 0) throw new Error(`duplicate preimage: ${label}`);
  return source.slice(0, first) + to + source.slice(first + from.length);
}

server = replaceOnce(server, "const VERSION = 'V4.2.7';", "const VERSION = 'V4.2.8';", 'version');

const blockStart = server.indexOf('async function readProspectListPage(p) {');
const blockEnd = server.indexOf('function categoryStatus(code) {', blockStart);
if (blockStart < 0 || blockEnd <= blockStart) throw new Error('list reader block markers missing');

const newBlock = String.raw`const PROSPECT_LIST_FIELDS = ['cedula','apellido_1','apellido_2','nombre','telefono','correo','estado','fecha_estado','fecha_registro','usuario_registro','aprobacion','formalizacion','ultimo_desembolso','proximo_desembolso'];
const PROSPECT_LIST_HEADER_ALIASES = new Map([
  ['CEDULA','cedula'],['PRIMER_APELLIDO','apellido_1'],['SEGUNDO_APELLIDO','apellido_2'],['NOMBRE','nombre'],
  ['TELEFONO_CELULAR','telefono'],['TELEFONO','telefono'],['CORREO_ELECTRONICO','correo'],['CORREO','correo'],
  ['ESTADO','estado'],['FECHA_DE_ESTADO','fecha_estado'],['FECHA_ESTADO','fecha_estado'],['FECHA_DE_REGISTRO','fecha_registro'],['FECHA_REGISTRO','fecha_registro'],
  ['USUARIO_QUE_REGISTRO','usuario_registro'],['USUARIO_REGISTRO','usuario_registro'],['APROBACION','aprobacion'],['FORMALIZACION','formalizacion'],
  ['ULTIMO_DESEMBOLSO','ultimo_desembolso'],['PROXIMO_DESEMBOLSO','proximo_desembolso'],
]);

function normalizeProspectListHeader(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');
}

function normalizeProspectRows(rows) {
  return (Array.isArray(rows) ? rows : []).map(row => ({
    ...Object.fromEntries(PROSPECT_LIST_FIELDS.map(key => [key, txt(row?.[key] || '')])),
    cedula:digits(row?.cedula),
  })).filter(row => !!row.cedula);
}

function addProspectRows(rowsByCedula, rows) {
  for (const row of normalizeProspectRows(rows)) {
    const previous = rowsByCedula.get(row.cedula);
    if (previous && JSON.stringify(previous) !== JSON.stringify(row)) {
      throw new AppError('CONAPE_LIST_DUPLICATE_CEDULA', 'CONAPE devolvió una cédula duplicada con datos distintos.', 409, 'LIST');
    }
    rowsByCedula.set(row.cedula, row);
  }
}

function detectCsvDelimiter(line) {
  const counts = new Map([[',',0],[';',0],['\t',0]]);
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { i += 1; continue; }
      quoted = !quoted;
      continue;
    }
    if (!quoted && counts.has(ch)) counts.set(ch, counts.get(ch) + 1);
  }
  return [...counts.entries()].sort((a,b) => b[1] - a[1])[0]?.[0] || ',';
}

function parseCsvRecords(raw) {
  let source = String(raw || '').replace(/^\uFEFF/, '');
  let delimiter = '';
  const sepMatch = source.match(/^sep=(,|;|\t)\r?\n/i);
  if (sepMatch) {
    delimiter = sepMatch[1];
    source = source.slice(sepMatch[0].length);
  }
  if (!delimiter) delimiter = detectCsvDelimiter(source.split(/\r?\n/, 1)[0] || '');
  const records = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"') {
        if (source[i + 1] === '"') { field += '"'; i += 1; }
        else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === delimiter) { row.push(field); field = ''; continue; }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && source[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      if (row.some(value => String(value || '').trim() !== '')) records.push(row);
      row = [];
      continue;
    }
    field += ch;
  }
  row.push(field);
  if (row.some(value => String(value || '').trim() !== '')) records.push(row);
  return records;
}

function parseProspectCsv(raw) {
  const records = parseCsvRecords(raw);
  if (!records.length) return { ok:false, reason:'CSV_EMPTY', columns_ok:false, rows:[] };
  const headers = records.shift().map(header => PROSPECT_LIST_HEADER_ALIASES.get(normalizeProspectListHeader(header)) || null);
  const missing = PROSPECT_LIST_FIELDS.filter(key => !headers.includes(key));
  if (missing.length) return { ok:false, reason:'REQUIRED_COLUMN_MISSING', columns_ok:false, rows:[] };
  const rows = [];
  for (const cells of records) {
    const row = Object.fromEntries(PROSPECT_LIST_FIELDS.map(key => [key,'']));
    for (let i = 0; i < headers.length; i += 1) {
      const key = headers[i];
      if (key) row[key] = txt(cells[i] || '');
    }
    if (Object.values(row).some(Boolean)) rows.push(row);
  }
  return { ok:true, reason:'', columns_ok:true, rows };
}

async function readDownloadUtf8(download) {
  const stream = await download.createReadStream();
  if (!stream) throw new Error('DOWNLOAD_STREAM_UNAVAILABLE');
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > 16 * 1024 * 1024) throw new Error('DOWNLOAD_TOO_LARGE');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function downloadProspectCsv(p) {
  const actions = p.getByRole('button', { name:/actions|acciones/i }).first();
  if (!(await actions.count())) return { ok:false, reason:'ACTIONS_NOT_FOUND', columns_ok:false, rows:[] };
  let download = null;
  try {
    await actions.click({ timeout:5_000 });
    await sleep(120);
    const downloadItem = p.getByRole('menuitem', { name:/download|descargar/i }).first();
    if (!(await downloadItem.count())) return { ok:false, reason:'DOWNLOAD_NOT_FOUND', columns_ok:false, rows:[] };
    const direct = p.waitForEvent('download', { timeout:2_000 }).catch(() => null);
    await downloadItem.click({ timeout:5_000 });
    download = await direct;
    if (!download) {
      await sleep(150);
      let csv = p.getByRole('link', { name:/^CSV$/i }).first();
      if (!(await csv.count())) csv = p.getByRole('button', { name:/^CSV$/i }).first();
      if (!(await csv.count())) csv = p.locator('a,button,[role="button"]').filter({ hasText:/^\s*CSV\s*$/i }).first();
      if (!(await csv.count())) return { ok:false, reason:'CSV_CONTROL_NOT_FOUND', columns_ok:false, rows:[] };
      const pending = p.waitForEvent('download', { timeout:7_000 }).catch(() => null);
      await csv.click({ timeout:5_000 });
      download = await pending;
    }
    if (!download) return { ok:false, reason:'CSV_DOWNLOAD_NOT_OBSERVED', columns_ok:false, rows:[] };
    const raw = await readDownloadUtf8(download);
    return parseProspectCsv(raw);
  } catch {
    return { ok:false, reason:'CSV_DOWNLOAD_FAILED', columns_ok:false, rows:[] };
  } finally {
    try { await download?.delete(); } catch {}
  }
}

async function readProspectListPage(p) {
  return p.evaluate(() => {
    const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');
    const text = v => String(v || '').replace(/\s+/g,' ').trim();
    const aliases = new Map([
      ['CEDULA','cedula'],['PRIMER_APELLIDO','apellido_1'],['SEGUNDO_APELLIDO','apellido_2'],['NOMBRE','nombre'],
      ['TELEFONO_CELULAR','telefono'],['TELEFONO','telefono'],['CORREO_ELECTRONICO','correo'],['CORREO','correo'],
      ['ESTADO','estado'],['FECHA_DE_ESTADO','fecha_estado'],['FECHA_ESTADO','fecha_estado'],['FECHA_DE_REGISTRO','fecha_registro'],['FECHA_REGISTRO','fecha_registro'],
      ['USUARIO_QUE_REGISTRO','usuario_registro'],['USUARIO_REGISTRO','usuario_registro'],['APROBACION','aprobacion'],['FORMALIZACION','formalizacion'],
      ['ULTIMO_DESEMBOLSO','ultimo_desembolso'],['PROXIMO_DESEMBOLSO','proximo_desembolso'],
    ]);
    const required = ['cedula','apellido_1','apellido_2','nombre','telefono','correo','estado','fecha_estado','fecha_registro','usuario_registro','aprobacion','formalizacion','ultimo_desembolso','proximo_desembolso'];
    let best = null;
    for (const table of Array.from(document.querySelectorAll('table'))) {
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => aliases.get(norm(th.textContent)) || null);
      const score = required.filter(key => headers.includes(key)).length;
      if (!best || score > best.score) best = { table, headers, score };
    }
    if (!best || best.score < 2) return { ok:false, reason:'REPORT_NOT_FOUND', missing:required, rows:[] };
    const missing = required.filter(key => !best.headers.includes(key));
    if (missing.length) return { ok:false, reason:'REQUIRED_COLUMN_MISSING', missing, rows:[] };
    const rows = [];
    for (const tr of Array.from(best.table.querySelectorAll('tbody tr'))) {
      const cells = Array.from(tr.querySelectorAll('td'));
      if (!cells.length || (cells.length === 1 && cells[0].hasAttribute('colspan'))) continue;
      const row = Object.fromEntries(required.map(key => [key,'']));
      for (let i = 0; i < best.headers.length; i += 1) {
        const key = best.headers[i];
        if (key && cells[i]) row[key] = text(cells[i].textContent);
      }
      if (Object.values(row).some(Boolean)) rows.push(row);
    }
    return { ok:true, missing:[], rows };
  }).catch(() => ({ ok:false, reason:'REPORT_READ_FAILED', missing:[], rows:[] }));
}

async function setProspectRowsAll(p) {
  const selectCandidate = await p.locator('select').evaluateAll(nodes => {
    const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
    const visible = el => { try { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; } catch { return false; } };
    for (let i = 0; i < nodes.length; i += 1) {
      const el = nodes[i];
      if (!visible(el)) continue;
      const context = norm([el.getAttribute('aria-label'),el.getAttribute('title'),el.name,el.id,el.parentElement?.textContent].filter(Boolean).join(' '));
      if (!/(ROWS|FILAS|PAGINA|PAGE)/.test(context)) continue;
      const option = Array.from(el.options || []).find(o => /^(ALL|TODAS|TODOS)$/.test(norm(o.textContent || '')) || String(o.value || '').trim() === '-1');
      if (option) return { index:i, value:option.value };
    }
    return null;
  }).catch(() => null);
  if (selectCandidate) {
    try {
      await p.locator('select').nth(selectCandidate.index).selectOption(selectCandidate.value);
      await waitForApexDynamicAction(p);
      await sleep(150);
      return true;
    } catch {}
  }

  const actions = p.getByRole('button', { name:/actions|acciones/i }).first();
  if (!(await actions.count())) return false;
  try {
    await actions.click({ timeout:5_000 });
    await sleep(120);
    const rowsMenu = p.getByRole('menuitem', { name:/rows per page|filas por p[aá]gina|filas/i }).first();
    if (!(await rowsMenu.count())) return false;
    await rowsMenu.click({ timeout:5_000 });
    await sleep(120);
    const menuItems = p.locator('[role="menuitem"]:visible,.a-Menu-content .a-Menu-label:visible');
    const index = await menuItems.evaluateAll(nodes => {
      const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
      return nodes.findIndex(node => /^(ALL|TODAS|TODOS)$/.test(norm(node.textContent || '')));
    }).catch(() => -1);
    if (index < 0) return false;
    await menuItems.nth(index).click({ timeout:5_000 });
    await waitForApexDynamicAction(p);
    await sleep(150);
    return true;
  } catch {
    return false;
  }
}

async function maximizeProspectRows(p) {
  const candidate = await p.locator('select').evaluateAll(nodes => {
    const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
    const visible = el => { try { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; } catch { return false; } };
    for (let i = 0; i < nodes.length; i += 1) {
      const el = nodes[i];
      if (!visible(el)) continue;
      const context = norm([el.getAttribute('aria-label'),el.getAttribute('title'),el.name,el.id,el.parentElement?.textContent].filter(Boolean).join(' '));
      if (!/(ROWS|FILAS|PAGINA|PAGE)/.test(context)) continue;
      const options = Array.from(el.options || []).map(o => ({ value:o.value, n:Number(String(o.textContent || o.value).replace(/[^0-9]/g,'')) })).filter(o => Number.isFinite(o.n) && o.n > 0);
      if (!options.length) continue;
      options.sort((a,b) => b.n-a.n);
      return { index:i, value:options[0].value };
    }
    return null;
  }).catch(() => null);
  if (candidate) {
    await p.locator('select').nth(candidate.index).selectOption(candidate.value).catch(() => {});
    await waitForApexDynamicAction(p);
    await sleep(150);
    return true;
  }
  return false;
}

async function prospectNextPageIndex(p) {
  const controls = p.locator('a,button');
  return controls.evaluateAll(nodes => {
    const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
    const visible = el => { try { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; } catch { return false; } };
    const reportRegion = el => el.closest('.a-IRR,.a-IRR-region,.t-Region');
    const hasProspectTable = region => Array.from((region || document).querySelectorAll('table')).some(table => {
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => norm(th.textContent));
      return headers.some(h => h.includes('CEDULA')) && headers.some(h => h === 'ESTADO');
    });
    return nodes.findIndex(el => {
      if (!visible(el) || el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
      const region = reportRegion(el);
      if (!region || !hasProspectTable(region)) return false;
      const label = norm([el.textContent,el.getAttribute('aria-label'),el.getAttribute('title')].filter(Boolean).join(' '));
      return el.classList.contains('a-IRR-pagination-next') || /^(NEXT|SIGUIENTE|PROXIMA|PROXIMO)$/.test(label) || /NEXT PAGE|PAGINA SIGUIENTE/.test(label);
    });
  }).catch(() => -1);
}

async function clickProspectNextPage(p) {
  const index = await prospectNextPageIndex(p);
  if (index < 0) return false;
  await p.locator('a,button').nth(index).click({ timeout:10_000 });
  return true;
}

async function readPagedProspects(p, rowsByCedula) {
  await maximizeProspectRows(p);
  let pages = 0;
  const pageFingerprints = new Set();
  for (let guard = 0; guard < 100; guard += 1) {
    const snapshot = await readProspectListPage(p);
    if (!snapshot.ok) throw new AppError('CONAPE_LIST_SCHEMA_NOT_READY', 'La lista CONAPE no expuso las 14 columnas esperadas.', 503, 'LIST');
    const normalizedRows = normalizeProspectRows(snapshot.rows);
    const fingerprint = sha(normalizedRows.map(row => row.cedula).join('|'));
    if (pageFingerprints.has(fingerprint)) break;
    pageFingerprints.add(fingerprint);
    pages += 1;
    addProspectRows(rowsByCedula, normalizedRows);
    const moved = await clickProspectNextPage(p);
    if (!moved) break;
    const until = Date.now() + 10_000;
    let changed = false;
    while (Date.now() < until) {
      await sleep(250);
      const next = await readProspectListPage(p);
      if (!next.ok) continue;
      const nextFingerprint = sha(normalizeProspectRows(next.rows).map(row => row.cedula).join('|'));
      if (nextFingerprint !== fingerprint) { changed = true; break; }
    }
    if (!changed) throw new AppError('CONAPE_LIST_PAGINATION_STALLED', 'La paginación de CONAPE no avanzó.', 503, 'LIST');
  }
  return pages;
}

async function resetProspectListReport(p, sessionId) {
  await p.goto(urlWithSession(CONAPE_FRIENDLY_HOME, sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });
  await waitForApexDynamicAction(p);
  const ir_filters_before = await countIrFilters(p);
  await p.goto(confirmationResetUrl(sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });
  await waitForApexDynamicAction(p);
  await sleep(100);
  return ir_filters_before;
}

async function listProspectsFromHome() {
  const started = Date.now();
  let pages = 0;
  let method = 'HTML_PAGED';
  let columnsOk = false;
  let irFiltersBefore = 0;
  const rowsByCedula = new Map();
  try {
    const p = await ConapeSession.browserPage();
    await ConapeSession.login(p);
    const sessionId = await readApexSession(p);
    if (!sessionId) throw new AppError('CONAPE_APEX_SESSION_MISSING', 'CONAPE no expuso una sesión válida.', 409, 'LIST');

    irFiltersBefore = await resetProspectListReport(p, sessionId);
    const csv = await downloadProspectCsv(p);
    if (csv.ok && csv.columns_ok) {
      const csvRows = new Map();
      addProspectRows(csvRows, csv.rows);

      // Verificación de integridad contra la misma pantalla en Rows=All.
      await p.goto(confirmationResetUrl(sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });
      await waitForApexDynamicAction(p);
      if (!(await setProspectRowsAll(p))) throw new AppError('CONAPE_LIST_ROWS_ALL_UNAVAILABLE', 'CONAPE no permitió verificar Rows=All.', 503, 'LIST');
      const html = await readProspectListPage(p);
      if (!html.ok) throw new AppError('CONAPE_LIST_SCHEMA_NOT_READY', 'La lista CONAPE no expuso las 14 columnas esperadas.', 503, 'LIST');
      if ((await prospectNextPageIndex(p)) >= 0) throw new AppError('CONAPE_LIST_ROWS_ALL_INCOMPLETE', 'Rows=All todavía expuso paginación.', 503, 'LIST');
      const htmlRows = new Map();
      addProspectRows(htmlRows, html.rows);
      const csvKeys = [...csvRows.keys()].sort();
      const htmlKeys = [...htmlRows.keys()].sort();
      if (csvKeys.length !== htmlKeys.length || sha(csvKeys.join('|')) !== sha(htmlKeys.join('|'))) {
        throw new AppError('CONAPE_LIST_COUNT_MISMATCH', 'CSV y Rows=All no devolvieron el mismo conjunto de prospectos.', 503, 'LIST');
      }
      for (const row of csvRows.values()) rowsByCedula.set(row.cedula, row);
      method = 'CSV_DOWNLOAD';
      pages = 1;
      columnsOk = true;
    } else {
      // El menú de descarga no es requisito para continuidad: Rows=All es el respaldo preferido.
      await p.goto(confirmationResetUrl(sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });
      await waitForApexDynamicAction(p);
      const rowsAll = await setProspectRowsAll(p);
      if (rowsAll) {
        const html = await readProspectListPage(p);
        if (!html.ok) throw new AppError('CONAPE_LIST_SCHEMA_NOT_READY', 'La lista CONAPE no expuso las 14 columnas esperadas.', 503, 'LIST');
        const hasNext = (await prospectNextPageIndex(p)) >= 0;
        if (!hasNext) {
          addProspectRows(rowsByCedula, html.rows);
          method = 'HTML_ROWS_ALL';
          pages = 1;
          columnsOk = true;
        }
      }
      if (!columnsOk) {
        // Último respaldo únicamente: paginación legacy, después de otro RIR limpio.
        await p.goto(confirmationResetUrl(sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });
        await waitForApexDynamicAction(p);
        pages = await readPagedProspects(p, rowsByCedula);
        method = 'HTML_PAGED';
        columnsOk = true;
      }
    }

    ConapeSession.state = 'CONNECTED';
    ConapeSession.lastActivity = nowIso();
    return {
      ok:true, code:'PROSPECT_LIST_READY', rows:[...rowsByCedula.values()], row_count:rowsByCedula.size,
      pages, method, columns_ok:columnsOk, ir_filters_before:irFiltersBefore, captured_at:nowIso(),
    };
  } finally {
    console.log(JSON.stringify({
      event:'conape_list_dump', method, rows:rowsByCedula.size, columns_ok:columnsOk,
      ms:Date.now()-started, ir_filters_before:irFiltersBefore, pii:false,
    }));
  }
}
`;

server = server.slice(0, blockStart) + newBlock + '\n\n' + server.slice(blockEnd);

qa = replaceOnce(
  qa,
  "  ['prospects/list reutiliza Home con sesión APEX, maximiza Rows y pagina', /CONAPE_FRIENDLY_HOME/.test(listBlock) && /urlWithSession/.test(listBlock) && /maximizeProspectRows/.test(listBlock) && /clickProspectNextPage/.test(listBlock)],",
  "  ['prospects/list limpia RIR y prioriza CSV -> Rows=All -> paginado', /confirmationResetUrl/.test(listBlock) && /resetProspectListReport/.test(listBlock) && /downloadProspectCsv/.test(listBlock) && /setProspectRowsAll/.test(listBlock) && /readPagedProspects/.test(listBlock) && listBlock.indexOf(\"method = 'CSV_DOWNLOAD'\") < listBlock.indexOf(\"method = 'HTML_ROWS_ALL'\") && listBlock.indexOf(\"method = 'HTML_ROWS_ALL'\") < listBlock.indexOf(\"method = 'HTML_PAGED'\")],\n  ['prospects/list CSV queda solo en memoria y se elimina al terminar', /waitForEvent\\('download'/.test(listBlock) && /download\\.createReadStream\\(\\)/.test(listBlock) && /download\\?\\.delete\\(\\)/.test(listBlock) && !/saveAs|savePath|writeFile.*csv/i.test(listBlock)],\n  ['prospects/list valida CSV contra 14 columnas y Rows=All antes de aceptarlo', /PROSPECT_LIST_FIELDS/.test(listBlock) && /PROSPECT_LIST_HEADER_ALIASES/.test(listBlock) && /CONAPE_LIST_COUNT_MISMATCH/.test(listBlock) && /CONAPE_LIST_ROWS_ALL_INCOMPLETE/.test(listBlock)],\n  ['prospects/list nunca usa Save Report', !/SAVE REPORT|SAVE_REPORT|guardar informe|guardar reporte/i.test(listBlock)],",
  'list order QA',
);

qa = replaceOnce(
  qa,
  "  ['prospects/list telemetría tiene solo métricas agregadas', listTelemetryMatches.length === 1 && /console\\.log\\(JSON\\.stringify\\(\\{ event:'conape_list_dump', rows:rowsByCedula\\.size, pages, ms:Date\\.now\\(\\)-started, pii:false \\}\\)\\)/.test(listBlock)],",
  "  ['prospects/list telemetría solo expone método, conteos, esquema, tiempo y filtros', listTelemetryMatches.length === 1 && ['method','rows:rowsByCedula.size','columns_ok:columnsOk','ms:Date.now()-started','ir_filters_before:irFiltersBefore','pii:false'].every(v => listBlock.includes(v)) && !/console\\.log.*(?:cedula|nombre|correo|telefono)/i.test(listBlock)],",
  'list telemetry QA',
);

qa = replaceOnce(qa, 'CONAPE Bridge V4.2.7 QA PASS', 'CONAPE Bridge V4.2.8 QA PASS', 'qa version');

fs.writeFileSync(serverPath, server, 'utf8');
fs.writeFileSync(qaPath, qa, 'utf8');
console.log('PATCH_CONAPE_LIST_V4_2_8_OK');
