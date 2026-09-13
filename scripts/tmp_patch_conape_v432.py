from pathlib import Path


def replace_once(text, old, new, label):
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f'STOP: baseline missing: {label}')
    return text.replace(old, new, 1)

server_path = Path('services/conape-bridge/server_v2.mjs')
qa_path = Path('scripts/qa_conape_bridge_v2.mjs')
server = server_path.read_text(encoding='utf-8')
qa = qa_path.read_text(encoding='utf-8')

server = replace_once(server, "const VERSION = 'V4.3.1';", "const VERSION = 'V4.3.2';", 'version')

server = replace_once(
    server,
    "const PROSPECT_LIST_FIELDS = ['cedula','apellido_1','apellido_2','nombre','telefono','correo','estado','fecha_estado','fecha_registro','usuario_registro','aprobacion','formalizacion','ultimo_desembolso','proximo_desembolso'];",
    "const PROSPECT_LIST_FIELDS = ['cedula','apellido_1','apellido_2','nombre','telefono','celular','correo','estado','fecha_estado','fecha_registro','usuario_registro','aprobacion','formalizacion','ultimo_desembolso','proximo_desembolso'];",
    '15 fields',
)
server = replace_once(
    server,
    "  ['TELEFONO_CELULAR','telefono'],['TELEFONO','telefono'],['CORREO_ELECTRONICO','correo'],['CORREO','correo'],",
    "  ['TELEFONO','telefono'],['CELULAR','celular'],['TELEFONO_CELULAR','celular'],['CORREO_ELECTRONICO','correo'],['CORREO','correo'],",
    'csv aliases',
)
server = replace_once(
    server,
    "      ['TELEFONO_CELULAR','telefono'],['TELEFONO','telefono'],['CORREO_ELECTRONICO','correo'],['CORREO','correo'],",
    "      ['TELEFONO','telefono'],['CELULAR','celular'],['TELEFONO_CELULAR','celular'],['CORREO_ELECTRONICO','correo'],['CORREO','correo'],",
    'html aliases',
)
server = replace_once(
    server,
    "    const required = ['cedula','apellido_1','apellido_2','nombre','telefono','correo','estado','fecha_estado','fecha_registro','usuario_registro','aprobacion','formalizacion','ultimo_desembolso','proximo_desembolso'];",
    "    const required = ['cedula','apellido_1','apellido_2','nombre','telefono','celular','correo','estado','fecha_estado','fecha_registro','usuario_registro','aprobacion','formalizacion','ultimo_desembolso','proximo_desembolso'];",
    'html required',
)
server = server.replace('La lista CONAPE no expuso las 14 columnas esperadas.', 'La lista CONAPE no expuso las 15 columnas esperadas.')

old_reset = '''async function resetProspectListReport(p, sessionId) {
  await p.goto(urlWithSession(CONAPE_FRIENDLY_HOME, sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });
  await waitForApexDynamicAction(p);
  const ir_filters_before = await countIrFilters(p);
  await p.goto(prospectListResetUrl(sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });
  await waitForApexDynamicAction(p);
  await sleep(100);
  return ir_filters_before;
}'''
new_reset = '''async function openProspectListHome(p, sessionId) {
  await p.goto(urlWithSession(CONAPE_FRIENDLY_HOME, sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });
  await waitForApexDynamicAction(p);
  await sleep(100);
}

async function resetProspectListReport(p, sessionId) {
  // V4.3.2: V4.1 leía esta Friendly Home directamente. No salir de ella si
  // la sesión ya viene sin filtros; el gate real reportó ir_filters_before=0.
  await openProspectListHome(p, sessionId);
  const ir_filters_before = await countIrFilters(p);
  if (ir_filters_before > 0) {
    await p.goto(prospectListResetUrl(sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });
    await waitForApexDynamicAction(p);
    await sleep(100);
  }
  return ir_filters_before;
}'''
server = replace_once(server, old_reset, new_reset, 'friendly-home reset')

server = server.replace(
    "await p.goto(prospectListResetUrl(sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });\n      await waitForApexDynamicAction(p);",
    "await openProspectListHome(p, sessionId);",
)

# Safe schema telemetry only: column keys, no row values/PII.
old_html_fail = "if (!html.ok) throw new AppError('CONAPE_LIST_SCHEMA_NOT_READY', 'La lista CONAPE no expuso las 15 columnas esperadas.', 503, 'LIST');"
new_html_fail = "if (!html.ok) { console.log(JSON.stringify({ event:'conape_list_schema', reason:txt(html.reason || 'UNKNOWN'), missing:Array.isArray(html.missing)?html.missing:[], expected_columns:15, pii:false })); throw new AppError('CONAPE_LIST_SCHEMA_NOT_READY', 'La lista CONAPE no expuso las 15 columnas esperadas.', 503, 'LIST'); }"
server = server.replace(old_html_fail, new_html_fail)

qa = replace_once(
    qa,
    "const listFields = ['cedula','apellido_1','apellido_2','nombre','telefono','correo','estado','fecha_estado','fecha_registro','usuario_registro','aprobacion','formalizacion','ultimo_desembolso','proximo_desembolso'];",
    "const listFields = ['cedula','apellido_1','apellido_2','nombre','telefono','celular','correo','estado','fecha_estado','fecha_registro','usuario_registro','aprobacion','formalizacion','ultimo_desembolso','proximo_desembolso'];",
    'QA list fields',
)
anchor = "  ['V4.2.9 telemetría de lista conserva solo conteos y pii false', server.includes(\"event:'conape_list_dump'\") && ['rows_csv','rows_html_all','counts_match','columns_ok','ir_filters_before','pii:false'].every(v=>server.includes(v))],"
addition = anchor + "\n  ['V4.3.2 contrato de lista conserva 15 columnas incluyendo teléfono y celular separados', listFields.length === 15 && listFields.includes('telefono') && listFields.includes('celular') && server.includes(\"['TELEFONO','telefono'],['CELULAR','celular']\")],\n  ['V4.3.2 permanece en Friendly Home cuando no hay filtros y solo usa RR si existen', listBlock.includes('async function openProspectListHome') && /if \\(ir_filters_before > 0\\)/.test(listBlock) && /await openProspectListHome\\(p, sessionId\\)/.test(listBlock)],\n  ['V4.3.2 diagnóstico de schema es seguro y no registra filas', server.includes(\"event:'conape_list_schema'\") && server.includes('expected_columns:15') && server.includes('pii:false')],"
qa = replace_once(qa, anchor, addition, 'V4.3.2 QA checks')
qa = qa.replace('CONAPE Bridge V4.3.1 QA PASS', 'CONAPE Bridge V4.3.2 QA PASS')

server_path.write_text(server, encoding='utf-8')
qa_path.write_text(qa, encoding='utf-8')
