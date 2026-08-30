import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const must = (ok, label) => { if (!ok) throw new Error(`CS21A200A FAIL: ${label}`); };

const students = read('src/admin_students.jsx');
const master = read('src/admin_master_dashboard.jsx');
const cData = read('src/admin_master_conape_data_cs21a96.jsx');
const cCore = read('src/admin_master_conape_review_core_cs21a96.jsx');
const cView = read('src/admin_master_conape_view_cs21a96.jsx');
const cWa = read('src/admin_master_conape_wa_cs21a96.jsx');
const cReview = read('src/admin_master_conape_review_state_cs21a96.jsx');
const cMulti = read('src/admin_master_conape_multisort_cs21a109.jsx');
const supervision = read('src/panel_admin_supervision.jsx');
const suspensiones = read('src/panel_suspensiones.jsx');
const aperturas = read('src/aperturas_admin_cs21a20.jsx');
const inlineFinance = read('src/admin_students_inline_payment_cs21a36.jsx');

// SEC-002 strong line from #185 -> #188 must remain authoritative.
must(students.includes('function abrirPdfPrivadoAdmin('), 'strong private admin PDF helper preserved');
must(students.includes('include_base64:true'), 'admin academic PDFs request private bytes');
must(!students.includes('include_base64:false'), 'target admin academic PDF calls do not force URL delivery');
must(!students.includes("if(existingUrl){window.open(existingUrl,'_blank','noopener,noreferrer');return;}"), 'no direct existing-url short circuit');
must(!students.includes("if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url, '_blank', 'noopener,noreferrer'); return; }"), 'no direct transfer Drive navigation');
for (const p of [
  'security/sec002_legacy_certificate_tree_contract_cs21a194.json',
  'security/sec002_identity_legacy_contract_cs21a174.json',
  'security/sec002_proforma_public_acl_contract_cs21a196.json',
]) must(fs.existsSync(p), `SEC-002 blocker contract preserved: ${p}`);

// Global dashboard / Cobranza.
must(master.includes("function masterSafeUserError(raw,fallback,context='')"), 'global dashboard safe-error boundary');
must(master.includes('function MasterCobranza({data,year,compareYear,filters,onRefresh})'), 'Cobranza component preserved');
must(master.includes('return (data.collections?.rows||[]).filter'), 'Cobranza official source preserved');

// Panel Maestro CONAPE R2 final state.
must(cCore.includes('function masterConapeSafeUserError(raw,fallback,context)'), 'Panel Maestro CONAPE safe helper');
must(cData.includes('const moraResult=await refreshMora(false);if(!moraResult?.ok)return;'), 'truthful morosidad refresh');
must(cData.includes('Morosidad verificada con el registro oficial.'), 'clean morosidad copy');
must(cView.includes('No quedan desembolsos académicos 01 pendientes según el registro oficial.'), 'base PanelView clean copy');
must(cMulti.includes('No quedan desembolsos académicos 01 pendientes según el registro oficial.'), 'effective multisort PanelView clean copy');
must(cWa.includes("masterConapeSafeUserError(e?.message||String(e),'No se pudo preparar WhatsApp. Intentá de nuevo.','preparar_whatsapp')"), 'WhatsApp action safe error');
must(cReview.includes("masterConapeSafeUserError(error?.message||String(error),'No se pudo guardar la revisión. Intentá de nuevo.','guardar_revision')"), 'review action safe error');

// Secondary admin surfaces.
must(supervision.includes('No pudimos cargar la supervisión de docentes. Intentá de nuevo.'), 'supervision safe copy');
must(suspensiones.includes("function psuSafeUserError(raw, fallback, context = '')"), 'suspensiones safe-error boundary');
must(aperturas.includes("function apSafeUserError(raw, fallback, context = '')"), 'aperturas safe-error boundary');
must(aperturas.includes("apPost('actualizarAperturaAdmin'"), 'aperturas real persistence preserved');

// Inline finance.
must(inlineFinance.includes("function inlineFinanceSafeUserError(raw, fallback, context = '')"), 'inline finance safe-error boundary');
must(inlineFinance.includes("postInline('aplicarPago'"), 'inline payment endpoint preserved');
must(inlineFinance.includes('request_id:requestIdRef.current'), 'inline payment idempotency preserved');

console.log('CS21A200A ADMIN SECURITY CONSOLIDATED: PASS');
console.log('SEC002_STRONG_LINE=PRESERVED');
console.log('MASTER_CONAPE_R2=INTEGRATED');
console.log('SECONDARY_ADMIN_SURFACES=INTEGRATED');
console.log('INLINE_FINANCE=INTEGRATED');
console.log('APPS_SCRIPT_WRITE=NO');
console.log('DRIVE_ACL_CHANGE=NO');
