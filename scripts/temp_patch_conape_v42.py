from pathlib import Path
import re

server_path = Path('services/conape-bridge/server_v2.mjs')
s = server_path.read_text(encoding='utf-8')

def rep(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f'MISSING:{label}')
    s = s.replace(old, new, 1)

def rex(pattern, repl, label, flags=re.S):
    global s
    s2, n = re.subn(pattern, repl, s, count=1, flags=flags)
    if n != 1:
        raise SystemExit(f'REPLACE_COUNT:{label}:{n}')
    s = s2

rep("const VERSION = 'V4.1.6';", "const VERSION = 'V4.2.0';", 'version')
rep("""      const ariaReadonly = String(el?.getAttribute?.('aria-readonly') || '').toLowerCase() === 'true';
      const readonly = !!el && (el.readOnly === true || el.disabled === true || el.hasAttribute?.('readonly') || ariaReadonly);
      return { id, present:!!el, readonly, disabled:!!el?.disabled };""",
    """      const ariaReadonly = String(el?.getAttribute?.('aria-readonly') || '').toLowerCase() === 'true';
      const ariaDisabled = String(el?.getAttribute?.('aria-disabled') || '').toLowerCase() === 'true';
      const readonly = !!el && (el.readOnly === true || el.hasAttribute?.('readonly') || ariaReadonly);
      const disabled = !!el && (el.disabled === true || ariaDisabled);
      const editable = !!el && !readonly && !disabled;
      return { id, present:!!el, readonly, disabled, editable };""", 'form-mode-fields')
rep("id:safeId(field?.id), present:field?.present === true, readonly:field?.readonly === true, disabled:field?.disabled === true,",
    "id:safeId(field?.id), present:field?.present === true, readonly:field?.readonly === true, disabled:field?.disabled === true, editable:field?.editable === true,", 'safe-form-fields')
rep("update_telefono:digits(conape.telefono).slice(-8) !== phone,", "update_telefono:true,", 'phone-always')

rex(r"async function writeContactField\(p, id, value\) \{.*?\n\}\n\nasync function fillContacts",
r'''async function readFieldEditability(p, id) {
  return p.evaluate(fieldId => {
    const el = document.getElementById(fieldId);
    if (!el) return { present:false, readonly:false, disabled:false, editable:false };
    const ariaReadonly = String(el.getAttribute('aria-readonly') || '').toLowerCase() === 'true';
    const ariaDisabled = String(el.getAttribute('aria-disabled') || '').toLowerCase() === 'true';
    const readonly = el.readOnly === true || el.hasAttribute('readonly') || ariaReadonly;
    const disabled = el.disabled === true || ariaDisabled;
    return { present:true, readonly, disabled, editable:!readonly && !disabled };
  }, id).catch(() => ({ present:false, readonly:false, disabled:false, editable:false }));
}

async function writeContactField(p, id, value) {
  const target = txt(value);
  const targetNorm = normalizeContactField(id, target);
  const locator = p.locator(`#${id}`).first();
  const editability = await readFieldEditability(p, id);
  let method = 'FILL';
  let attempted = false;
  let readback = await readContactFieldState(p, id);

  if (!editability.editable) {
    return {
      field:id, attempted:false, verified:false, method:'SKIP', skipped_reason:'READONLY',
      target_len:target.length, readback_len:String(readback.domValue || '').length,
      match:false, apex_readable:readback.apexReadable === true, editable:false,
    };
  }

  try {
    if (!(await locator.count())) throw new Error('FIELD_NOT_FOUND');
    attempted = true;
    await locator.fill('', { timeout:5_000 });
    await locator.fill(target, { timeout:5_000 });
    await locator.blur({ timeout:5_000 });
    await waitForApexDynamicAction(p);
    readback = await readContactFieldState(p, id);
  } catch {}

  let match = normalizeContactField(id, readback.domValue) === targetNorm && (!readback.apexReadable || normalizeContactField(id, readback.apexValue) === targetNorm);
  if (!match) {
    method = 'APEX_SETVALUE';
    const apexSet = await p.evaluate(({ fieldId, fieldValue }) => {
      try {
        const item = window.apex?.item?.(fieldId);
        if (!item || typeof item.setValue !== 'function') return false;
        item.setValue(fieldValue);
        return true;
      } catch { return false; }
    }, { fieldId:id, fieldValue:target }).catch(() => false);
    if (apexSet) {
      attempted = true;
      await locator.focus({ timeout:5_000 }).catch(() => {});
      await locator.blur({ timeout:5_000 }).catch(() => {});
      await waitForApexDynamicAction(p);
      readback = await readContactFieldState(p, id);
      match = normalizeContactField(id, readback.domValue) === targetNorm && (!readback.apexReadable || normalizeContactField(id, readback.apexValue) === targetNorm);
    }
  }

  const result = {
    field:id, attempted, verified:match, method, target_len:target.length,
    readback_len:String(readback.domValue || '').length, match,
    apex_readable:readback.apexReadable === true, editable:true,
  };
  if (!match) {
    const error = new AppError('CONTACT_WRITE_FAILED', 'CONAPE no confirmó la escritura del contacto.', 422, 'FILL');
    error.fill_telemetry = {
      attempted_fields:attempted ? [id] : [], verified_fields:[], methods:[method], skipped_fields:[],
      field_apex_readable:{ [id]:readback.apexReadable === true },
      fill_target_len:result.target_len, fill_readback_len:result.readback_len, fill_match:false,
    };
    throw error;
  }
  return result;
}

async function fillContacts''', 'write-contact')

rex(r"async function fillContacts\(p, plan\) \{.*?\n\}\n\nasync function assertPreCreateFields",
r'''async function fillContacts(p, plan) {
  const results = [];
  try {
    results.push(await writeContactField(p, 'P2_PRS_CELULAR', plan.telefono));
    if (plan.update_correo) results.push(await writeContactField(p, 'P2_PRS_EMAIL', plan.correo));
  } catch (error) {
    const prior = results;
    const failure = error?.fill_telemetry || {};
    error.fill_telemetry = {
      attempted_fields:[...prior.filter(r => r.attempted).map(r => r.field), ...(failure.attempted_fields || [])],
      verified_fields:[...prior.filter(r => r.verified).map(r => r.field), ...(failure.verified_fields || [])],
      methods:[...prior.map(r => r.method), ...(failure.methods || [])],
      skipped_fields:[...prior.filter(r => r.skipped_reason).map(r => ({ field:r.field, reason:r.skipped_reason })), ...(failure.skipped_fields || [])],
      field_apex_readable:{ ...Object.fromEntries(prior.map(r => [r.field, r.apex_readable === true])), ...(failure.field_apex_readable || {}) },
      fill_target_len:failure.fill_target_len ?? prior.at(-1)?.target_len ?? null,
      fill_readback_len:failure.fill_readback_len ?? prior.at(-1)?.readback_len ?? null,
      fill_match:failure.fill_match ?? prior.at(-1)?.match ?? null,
    };
    throw error;
  }
  const state = await readFormState(p);
  const last = results.at(-1) || null;
  return {
    state,
    telemetry:{
      attempted_fields:results.filter(r => r.attempted).map(r => r.field),
      verified_fields:results.filter(r => r.verified).map(r => r.field),
      methods:results.map(r => r.method),
      skipped_fields:results.filter(r => r.skipped_reason).map(r => ({ field:r.field, reason:r.skipped_reason })),
      field_apex_readable:Object.fromEntries(results.map(r => [r.field, r.apex_readable === true])),
      fill_target_len:last?.target_len ?? null,
      fill_readback_len:last?.readback_len ?? null,
      fill_match:last?.match ?? null,
    },
  };
}

async function assertPreCreateFields''', 'fill-contacts')

insert_before = "async function clickCreateOnce(p) {"
if insert_before not in s:
    raise SystemExit('MISSING:clickCreateOnce')
helper = r'''async function collectPreActionTelemetry(p) {
  return p.evaluate(() => {
    const safe = value => /^[A-Za-z][A-Za-z0-9_:\-.]{0,79}$/.test(String(value || '')) ? String(value) : '';
    const controls = Array.from(document.querySelectorAll('input[id^="P2_PRS_"],select[id^="P2_PRS_"],textarea[id^="P2_PRS_"]'));
    const precreate_apex_values = {};
    const precreate_dom_values = {};
    const field_editable = {};
    for (const el of controls) {
      const id = safe(el.id);
      if (!id) continue;
      const ariaReadonly = String(el.getAttribute('aria-readonly') || '').toLowerCase() === 'true';
      const ariaDisabled = String(el.getAttribute('aria-disabled') || '').toLowerCase() === 'true';
      const readonly = el.readOnly === true || el.hasAttribute('readonly') || ariaReadonly;
      const disabled = el.disabled === true || ariaDisabled;
      field_editable[id] = !readonly && !disabled;
      precreate_dom_values[id] = String(el.value ?? '').trim() !== '';
      let apexValue = '';
      try {
        const item = window.apex?.item?.(id);
        if (item && typeof item.getValue === 'function') apexValue = String(item.getValue() ?? '');
      } catch {}
      precreate_apex_values[id] = apexValue.trim() !== '';
    }
    return { precreate_apex_values, precreate_dom_values, field_editable };
  }).catch(() => ({ precreate_apex_values:{}, precreate_dom_values:{}, field_editable:{} }));
}

'''
s = s.replace(insert_before, helper + insert_before, 1)

rex(r"async function clickCreateOnce\(p\) \{.*?\n\}\n\nasync function countIrFilters",
r'''async function clickFinalAction(p, formMode) {
  await assertPreCreateFields(p);
  const page_item_ids = await collectPageItemIds(p);
  const before = await readFormState(p);
  const preaction = await collectPreActionTelemetry(p);
  const actionRequests = [];
  const onRequest = req => {
    try {
      const u = new URL(req.url());
      if (req.method() !== 'POST' || !u.pathname.endsWith('/apex/wwv_flow.accept')) return;
      const raw = String(req.postData() || '');
      actionRequests.push({ body_keys:safeBodyKeys(raw), request_token:safeRequestToken(raw), status:null });
    } catch {}
  };
  const onResponse = response => {
    try {
      const req = response.request();
      const u = new URL(req.url());
      if (req.method() !== 'POST' || !u.pathname.endsWith('/apex/wwv_flow.accept')) return;
      const hit = actionRequests.find(item => item.status == null);
      if (hit) hit.status = response.status();
    } catch {}
  };
  p.on('request', onRequest);
  p.on('response', onResponse);
  try {
    const mode = txt(formMode);
    const label = mode === 'CREATE' ? /CREAR NUEVO PROSPECTO/i : (mode === 'UPDATE' ? /APLICAR CAMBIOS/i : null);
    if (!label) throw new AppError('FORM_MODE_UNKNOWN', 'CONAPE no expuso una acción reconocible para este prospecto.', 409, 'LOOKUP');
    if (!(await clickVisibleByLabel(p, label))) throw new AppError('FINAL_ACTION_BUTTON_NOT_FOUND', 'CONAPE no mostró el botón final esperado.', 409, 'ACTION');
    const until = Date.now() + 10_000;
    let state = await readFormState(p);
    while (Date.now() < until) {
      if (actionRequests.length && (actionRequests[0].status != null || state.categories.length || state.success_signal || state.form_reset)) break;
      await sleep(250);
      state = await readFormState(p);
    }
    return {
      actionCount:actionRequests.length,
      createCount:mode === 'CREATE' ? actionRequests.length : 0,
      updateCount:mode === 'UPDATE' ? actionRequests.length : 0,
      final_action:mode,
      outcome:state,
      request:actionRequests[0] || null,
      page_item_ids,
      alerts_before:before.categories || [],
      ...preaction,
    };
  } finally {
    p.off('request', onRequest);
    p.off('response', onResponse);
  }
}

async function countIrFilters''', 'final-action')

rep("let fillTelemetry = { attempted_fields:[], verified_fields:[], methods:[], fill_target_len:null, fill_readback_len:null, fill_match:null };",
    "let fillTelemetry = { attempted_fields:[], verified_fields:[], methods:[], skipped_fields:[], field_apex_readable:{}, fill_target_len:null, fill_readback_len:null, fill_match:null };\n  let preActionTelemetry = { precreate_apex_values:{}, precreate_dom_values:{}, field_editable:{} };\n  let finalActionName = '';", 'execute-vars')
rep("    enforceRecruitFormMode(modeInfo, comparison, plan);\n    assertIdentityMatch(comparison);",
    "    if (formMode === 'UNKNOWN') enforceRecruitFormMode(modeInfo, comparison, plan);\n    assertIdentityMatch(comparison);", 'execute-mode-gate')
rep("""    created = await clickCreateOnce(p);
    timing.create = Date.now() - t;
    if (created.createCount !== 1) throw new AppError('WRITE_RESULT_UNCERTAIN', 'No se observó una única solicitud CREATE. No repita el envío.', 409, 'AFTER_CREATE');""",
    """    created = await clickFinalAction(p, formMode);
    timing.create = Date.now() - t;
    finalActionName = created.final_action;
    preActionTelemetry = {
      precreate_apex_values:created.precreate_apex_values || {},
      precreate_dom_values:created.precreate_dom_values || {},
      field_editable:created.field_editable || {},
    };
    if (created.actionCount !== 1) throw new AppError('WRITE_RESULT_UNCERTAIN', 'No se observó una única solicitud final. No repita el envío.', 409, 'AFTER_ACTION');""", 'execute-action')
rep("if (categories.includes('YA_REGISTRADO'))", "if (formMode === 'CREATE' && categories.includes('YA_REGISTRADO'))", 'duplicate-create-only')
rep("""    if (confirmation.found) {
      finalCode = 'CREATED';
      finalStage = 'CONFIRMED';
      return { ok:true, confirmed:true, code:'CREATED', stage:'CONFIRMED', form_mode:formMode, confirmation_found:true, confirmation_estado:upper(confirmation.estado), estado_conape_raw:confirmation.estado, confirmation_method:confirmation.confirmation_method, confirmation_form_mode:confirmation.form_mode, comparison, timing:{ ...timing, total:Date.now()-started } };
    }""",
    """    if (confirmation.found) {
      finalCode = formMode === 'UPDATE' ? 'UPDATED' : 'CREATED';
      finalStage = 'CONFIRMED';
      return { ok:true, confirmed:true, code:finalCode, stage:'CONFIRMED', form_mode:formMode, final_action:finalActionName, confirmation_found:true, confirmation_estado:upper(confirmation.estado), estado_conape_raw:confirmation.estado, confirmation_method:confirmation.confirmation_method, confirmation_form_mode:confirmation.form_mode, comparison, timing:{ ...timing, action:timing.create, total:Date.now()-started } };
    }""", 'execute-success')
rep("""      create_body_keys:created?.request?.body_keys || [], page_item_ids:created?.page_item_ids || [], apex_http_status:Number(created?.request?.status || 0) || null,
      create_count:Number(created?.createCount || 0), confirmation_found:!!confirmation?.found, confirmation_estado:upper(confirmation?.estado || ''),""",
    """      create_body_keys:created?.request?.body_keys || [], page_item_ids:created?.page_item_ids || [], apex_http_status:Number(created?.request?.status || 0) || null,
      final_action:txt(finalActionName || created?.final_action || ''), action_count:Number(created?.actionCount || 0), create_count:Number(created?.createCount || 0), update_count:Number(created?.updateCount || 0),
      precreate_apex_values:preActionTelemetry.precreate_apex_values || {}, precreate_dom_values:preActionTelemetry.precreate_dom_values || {}, field_editable:preActionTelemetry.field_editable || {},
      confirmation_found:!!confirmation?.found, confirmation_estado:upper(confirmation?.estado || ''),""", 'telemetry-action')
rep("""      fill_attempted_fields:fillTelemetry.attempted_fields || [], fill_verified_fields:fillTelemetry.verified_fields || [], fill_methods:fillTelemetry.methods || [],
      fill_target_len:fillTelemetry.fill_target_len ?? null, fill_readback_len:fillTelemetry.fill_readback_len ?? null, fill_match:fillTelemetry.fill_match ?? null,""",
    """      fill_attempted_fields:fillTelemetry.attempted_fields || [], fill_verified_fields:fillTelemetry.verified_fields || [], fill_methods:fillTelemetry.methods || [],
      skipped_fields:fillTelemetry.skipped_fields || [], field_apex_readable:fillTelemetry.field_apex_readable || {},
      fill_target_len:fillTelemetry.fill_target_len ?? null, fill_readback_len:fillTelemetry.fill_readback_len ?? null, fill_match:fillTelemetry.fill_match ?? null,""", 'telemetry-fill')
server_path.write_text(s, encoding='utf-8')

ui_path = Path('src/ventas_conape_reclutar_row_c3_5.jsx')
u = ui_path.read_text(encoding='utf-8')

def urep(old, new, label):
    global u
    if old not in u:
        raise SystemExit(f'UI_MISSING:{label}')
    u = u.replace(old, new, 1)

urep("if (estadoConape || codigo || estadoVentas === 'MATRICULADO') return false;", "if (codigo || estadoVentas === 'MATRICULADO') return false;", 'visible-update')
marker = "  function liveBridge(){"
if marker not in u:
    raise SystemExit('UI_MISSING:liveBridge')
u = u.replace(marker, "  function actionLabel(p){\n    const estadoConape = text(p?.estado_conape_raw || p?.estado_conape);\n    return estadoConape ? 'Actualizar datos' : 'Registrar en CONAPE';\n  }\n\n" + marker, 1)
urep("setPhase('Aplicando contactos y enviando CREATE')", "setPhase('Aplicando contactos y enviando acción final')", 'phase')
urep("if (!r || !r.ok || code !== 'CREATED') {", "if (!r || !r.ok || !['CREATED','UPDATED'].includes(code)) {", 'result-codes')
urep("""          setState('done');
          setPhase('Confirmado');
          onToast && onToast({ tipo:'ok', msg:estadoConape ? `Prospecto reclutado · CONAPE: ${estadoConape}` : 'Prospecto reclutado en CONAPE.' });""",
     """          setState('done');
          setPhase(code === 'UPDATED' ? 'Actualizado' : 'Confirmado');
          onToast && onToast({ tipo:'ok', msg:code === 'UPDATED' ? 'Datos actualizados en CONAPE.' : (estadoConape ? `Prospecto reclutado · CONAPE: ${estadoConape}` : 'Prospecto reclutado en CONAPE.') });""", 'done-toast')
urep("""              <div className=\"vx-c33-title\">Reclutar en CONAPE</div>
              <div className=\"vx-c33-sub\">Una sola ejecución: valida Campus, consulta CONAPE, verifica identidad, aplica contactos y crea.</div>""",
     """              <div className=\"vx-c33-title\">CONAPE</div>
              <div className=\"vx-c33-sub\">Una sola ejecución: consulta, aplica contactos editables y registra o actualiza según el formulario de CONAPE.</div>""", 'title')
urep("{state === 'done' ? <div className=\"vx-c33-banner\">CONAPE confirmó el reclutamiento.</div> : null}", "{state === 'done' ? <div className=\"vx-c33-banner\">{technical(result?.code, '') === 'UPDATED' ? 'CONAPE confirmó la actualización.' : 'CONAPE confirmó el reclutamiento.'}</div> : null}", 'done-banner')
urep("<button type=\"button\" className=\"vx-c35-rowbtn\" onClick={e => { e.stopPropagation(); setOpen(true); }}>Reclutar en CONAPE</button>", "<button type=\"button\" className=\"vx-c35-rowbtn\" onClick={e => { e.stopPropagation(); setOpen(true); }}>{actionLabel(prospecto)}</button>", 'button-label')
ui_path.write_text(u, encoding='utf-8')
