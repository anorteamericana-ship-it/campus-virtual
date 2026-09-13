import fs from 'node:fs';

const SOURCE = new URL('./server_v2.mjs', import.meta.url);
const TARGET = new URL('./server_runtime.mjs', import.meta.url);
let src = fs.readFileSync(SOURCE, 'utf8');

function replaceOnce(oldText, newText, label) {
  const first = src.indexOf(oldText);
  if (first < 0) throw new Error(`V4.4 anchor missing: ${label}`);
  if (src.indexOf(oldText, first + oldText.length) >= 0) throw new Error(`V4.4 anchor duplicated: ${label}`);
  src = src.slice(0, first) + newText + src.slice(first + oldText.length);
}

replaceOnce("const VERSION = 'V4.3.2';", "const VERSION = 'V4.4.0';", 'VERSION');

const listAnchor = 'async function listProspectsFromHome() {';
const helper = `function createIsolatedConapeSession() {
  const session = Object.create(ConapeSession);
  session.browser = null;
  session.context = null;
  session.page = null;
  session.state = 'DISCONNECTED';
  session.connectedAt = '';
  session.lastActivity = '';
  session.generation = 0;
  return session;
}

`;
replaceOnce(listAnchor, helper + 'async function listProspectsFromHome(session = ConapeSession) {', 'isolated list session');

{
  const start = src.indexOf('async function listProspectsFromHome(session = ConapeSession) {');
  const end = src.indexOf('\n\nconst SALES_STATUS_FIELDS', start);
  if (start < 0 || end < 0) throw new Error('V4.4 list function bounds missing');
  const before = src.slice(0, start);
  const block = src.slice(start, end).replaceAll('ConapeSession.', 'session.');
  const after = src.slice(end);
  src = before + block + after;
}

{
  const start = src.indexOf('async function listProspectStatusesForSales(body) {');
  const end = src.indexOf('\n\nfunction categoryStatus', start);
  if (start < 0 || end < 0) throw new Error('V4.4 sales status bounds missing');
  const replacement = `async function listProspectStatusesForSales(body) {
  const auth = await authorizeCampusSession(body?.token);
  const asesor = txt(body?.asesor || '');
  const dashboard = await campusCall({ fn:'getDashboardVentas', token:auth.token, asesor });
  if (!dashboard?.ok || !Array.isArray(dashboard?.prospectos)) {
    throw new AppError('CAMPUS_SALES_SCOPE_UNAVAILABLE', 'No se pudo resolver el alcance de Ventas.', 503, 'CAMPUS');
  }
  const allowedCedulas = new Set(dashboard.prospectos.map(campusCedula).filter(Boolean));

  const isolated = createIsolatedConapeSession();
  let list;
  try {
    list = await listProspectsFromHome(isolated);
  } catch (error) {
    console.log(JSON.stringify({
      event:'conape_mirror_sync_abort', version:VERSION,
      rows_csv:Number.isInteger(error?.rows_csv) ? error.rows_csv : null,
      rows_html_all:Number.isInteger(error?.rows_html_all) ? error.rows_html_all : null,
      counts_match:false, pii:false,
    }));
    throw error;
  } finally {
    await isolated.close().catch(() => {});
  }

  const rowsCsv = Number(list?.rows_csv);
  const rowsHtmlAll = Number(list?.rows_html_all);
  const validSnapshot = list?.method === 'CSV_DOWNLOAD'
    && list?.columns_ok === true
    && list?.counts_match === true
    && Number.isInteger(rowsCsv) && rowsCsv > 0
    && Number.isInteger(rowsHtmlAll) && rowsHtmlAll > 0
    && rowsCsv === rowsHtmlAll
    && Array.isArray(list?.rows) && list.rows.length > 0;

  if (!validSnapshot) {
    console.log(JSON.stringify({
      event:'conape_mirror_sync_abort', version:VERSION,
      rows_csv:Number.isInteger(rowsCsv) ? rowsCsv : null,
      rows_html_all:Number.isInteger(rowsHtmlAll) ? rowsHtmlAll : null,
      counts_match:false, pii:false,
    }));
    const error = new AppError('CONAPE_SNAPSHOT_ABORTED', 'La lectura completa de CONAPE no pasó el control de integridad.', 503, 'LIST');
    Object.assign(error, {
      rows_csv:Number.isInteger(rowsCsv) ? rowsCsv : null,
      rows_html_all:Number.isInteger(rowsHtmlAll) ? rowsHtmlAll : null,
      counts_match:false,
      columns_ok:list?.columns_ok === true,
      method:txt(list?.method || ''),
    });
    throw error;
  }

  const applied = await campusCall({
    fn:'conapeMirrorApplySnapshotV44',
    token:auth.token,
    method:list.method,
    columns_ok:true,
    counts_match:true,
    rows_csv:rowsCsv,
    rows_html_all:rowsHtmlAll,
    captured_at:list.captured_at || nowIso(),
    rows:list.rows,
  });
  if (!applied?.ok || applied?.written !== true) {
    const error = new AppError('CONAPE_MIRROR_WRITE_FAILED', 'El Campus no confirmó la actualización del espejo CONAPE.', 503, 'CAMPUS');
    error.rows_csv = rowsCsv;
    error.rows_html_all = rowsHtmlAll;
    error.counts_match = true;
    throw error;
  }

  const rows = list.rows
    .filter(row => allowedCedulas.has(digits(row?.cedula)))
    .map(salesStatusRow);
  return {
    ok:true,
    code:'PROSPECT_SALES_STATUS_READY',
    method:list.method,
    row_count:rows.length,
    columns_ok:true,
    counts_match:true,
    rows_csv:rowsCsv,
    rows_html_all:rowsHtmlAll,
    mirror_applied:true,
    movements:Number(applied.movements || 0),
    captured_at:list.captured_at || nowIso(),
    rows,
  };
}`;
  src = src.slice(0, start) + replacement + src.slice(end);
}

replaceOnce(
  "else if (action === 'prospects_sales_status') result = await serial(() => listProspectStatusesForSales(body));",
  "else if (action === 'prospects_sales_status') result = await listProspectStatusesForSales(body);",
  'sales status without shared queue'
);

fs.writeFileSync(TARGET, src, 'utf8');
console.log(JSON.stringify({ ok:true, source:'server_v2.mjs', target:'server_runtime.mjs', version:'V4.4.0' }));
