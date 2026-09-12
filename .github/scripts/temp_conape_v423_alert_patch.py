from pathlib import Path

server_path = Path('services/conape-bridge/server_v2.mjs')
qa_path = Path('scripts/qa_conape_bridge_v2.mjs')
server = server_path.read_text(encoding='utf-8')
qa = qa_path.read_text(encoding='utf-8')

assert "const VERSION = 'V4.2.2';" in server
server = server.replace("const VERSION = 'V4.2.2';", "const VERSION = 'V4.2.3';", 1)

old_text = """    const text = norm(alerts.map(n => n.textContent || '').join(' '));
    const categories = [];"""
new_text = """    const alertRawText = alerts.map(n => n.textContent || '').join(' ');
    const text = norm(alertRawText);
    const alertTextSanitized = String(alertRawText || '')
      .replace(/\\S*@\\S*/g, '[MAIL]')
      .replace(/\\d{5,}/g, '[NUM]')
      .replace(/\\s+/g, ' ')
      .trim()
      .slice(0,200);
    const categories = [];"""
assert old_text in server
server = server.replace(old_text, new_text, 1)

old_return = """      telefono:val('P2_PRS_CELULAR'), correo:val('P2_PRS_EMAIL'), categories,
      alert_dom_ids:alertDomIds, apex_error_item_ids:apexErrorItemIds,"""
new_return = """      telefono:val('P2_PRS_CELULAR'), correo:val('P2_PRS_EMAIL'), categories,
      alert_dom_ids:alertDomIds, apex_error_item_ids:apexErrorItemIds, alert_text_sanitized:alertTextSanitized,"""
assert old_return in server
server = server.replace(old_return, new_return, 1)

old_telemetry = """      alerts_before:created?.alerts_before || [], visible_alerts:created?.outcome?.categories || [], alert_dom_ids:created?.outcome?.alert_dom_ids || [], apex_error_item_ids:created?.outcome?.apex_error_item_ids || [],
      final_action:txt(finalActionName || created?.final_action || ''),"""
new_telemetry = """      alerts_before:created?.alerts_before || [], visible_alerts:created?.outcome?.categories || [], alert_dom_ids:created?.outcome?.alert_dom_ids || [], apex_error_item_ids:created?.outcome?.apex_error_item_ids || [], alert_text_sanitized:created?.outcome?.alert_text_sanitized || '',
      final_action:txt(finalActionName || created?.final_action || ''),"""
assert old_telemetry in server
server = server.replace(old_telemetry, new_telemetry, 1)

old_qa = """  ['arrays de alertas no emiten texto libre de CONAPE', !/(textContent|innerText|innerHTML|outerHTML|alert_text|alert_message|message\\s*:)/.test(executeTelemetryBlock) && /safeToken/.test(formStateBlock) && /\\.slice\\(0,40\\)/.test(formStateBlock)],"""
new_qa = """  ['arrays de alertas conservan categorías/IDs sin texto DOM crudo', !/(textContent|innerText|innerHTML|outerHTML|alert_message|message\\s*:)/.test(executeTelemetryBlock) && /safeToken/.test(formStateBlock) && /\\.slice\\(0,40\\)/.test(formStateBlock)],
  ['V4.2.3 emite alert_text_sanitized con redacción dura y máximo 200 caracteres', executeTelemetryBlock.includes(\"alert_text_sanitized:created?.outcome?.alert_text_sanitized || ''\") && formStateBlock.includes(\".replace(/\\\\S*@\\\\S*/g, '[MAIL]')\") && formStateBlock.includes(\".replace(/\\\\d{5,}/g, '[NUM]')\") && formStateBlock.includes('.slice(0,200)') && !/(textContent|innerText|innerHTML|outerHTML)/.test(executeTelemetryBlock)],"""
assert old_qa in qa
qa = qa.replace(old_qa, new_qa, 1)

server_path.write_text(server, encoding='utf-8')
qa_path.write_text(qa, encoding='utf-8')

checks = {
    'version': "const VERSION = 'V4.2.3';" in server,
    'raw_alert_local_only': "const alertRawText = alerts.map(n => n.textContent || '').join(' ');" in server,
    'mail_redaction': ".replace(/\\S*@\\S*/g, '[MAIL]')" in server,
    'num_redaction': ".replace(/\\d{5,}/g, '[NUM]')" in server,
    'space_normalize': ".replace(/\\s+/g, ' ')" in server,
    'max_200': ".slice(0,200);" in server,
    'state_field': 'alert_text_sanitized:alertTextSanitized' in server,
    'telemetry_field': "alert_text_sanitized:created?.outcome?.alert_text_sanitized || ''" in server,
    'qa_field': 'V4.2.3 emite alert_text_sanitized' in qa,
}
failed = [k for k, v in checks.items() if not v]
if failed:
    raise SystemExit('V4.2.3 patch checks failed: ' + ', '.join(failed))
print('CONAPE V4.2.3 sanitized alert patch PASS')
