import fs from 'node:fs';

const src=fs.readFileSync('src/admin_students.jsx','utf8');
function must(ok,label){if(!ok)throw new Error('CAMBIO_ACADEMICO_FRONTEND FAIL: '+label);}
function count(s){return src.split(s).length-1;}

must(src.includes('function AkCambioAcademicoWizard'),'wizard exists');
must(src.includes('function AgCambioPaymentStateStrip'),'payment state strip exists');
must(src.includes('function AgCambioCompareCard'),'before/after comparator exists');

for(const label of [
  'Desembolso CONAPE detectado',
  'Movimiento bancario identificado',
  'Pago aplicado en el Campus',
  'CONAPE sincronizado'
]) must(src.includes(label),'four-state label: '+label);

for(const label of [
  "['Grupo', d.grupo || '—']",
  "['Modalidad', d.modalidad || '—']",
  "['Tipo de periodo', d.tipo_periodo || '—']",
  "['Periodo', d.periodo_corto || '—']",
  "['Cuota individual', d.cuota != null ? agIndMoney(d.cuota) : '—']",
  "['Cantidad de cuotas', d.cantidad_cuotas != null ? String(d.cantidad_cuotas) : '—']",
  "['Total contractual', d.total_contractual != null ? agIndMoney(d.total_contractual) : '—']",
  "['Número de intento', d.numero_intento != null ? String(d.numero_intento) : '—']"
]) must(src.includes(label),'comparator row: '+label);

must(src.includes("filter(x => !x.solo_variante)"),'solo_variante hidden from academic cards');
must(src.includes("const target = variante?.candidatos_key || codigo;"),'default candidate key follows backend');
must(src.includes("const casoEfectivo = varianteInfo?.candidatos_key || tipoCaso;"),'selected candidate key follows backend');
must(src.includes("variante_pago:variantePago"),'simulation sends variante_pago');
must(src.includes("variante_pago:simulacion?.variante_pago || variantePago"),'execution sends backend simulation variante_pago');
must(count('expected_intento_id:')>=2,'expected_intento_id sent in simulation and execution');
must(src.includes('confirmacion_individual:String(codigo)'),'individual confirmation preserved');

const variantChange=src.slice(src.indexOf('function cambiarVariante'),src.indexOf('async function simular'));
must(variantChange.includes("setGrupoDestino('')"),'variant change invalidates destination');
must(variantChange.includes('setSimulacion(null)'),'variant change invalidates simulation');
must(variantChange.includes("setConfirmacion('')"),'variant change invalidates confirmation');

const simGate=(src.match(/const puedeSimular = ([^;]+);/)||[])[1]||'';
must(simGate.length>0,'simulation gate found');
must(!/actividad/i.test(simGate),'activity does not block simulation');

for(const token of [
  'pagos_historicos_no_aplican',
  'precioLista.matricula',
  'precioLista.cuota',
  'precioLista.certificado',
  'precioLista.total',
  'descuento.matricula_pct',
  'descuento.cuota_pct',
  'descuento.certificado_pct',
  'fin.total_nivel_a_pagar',
  'fin.diferencia_contra_pagado'
]) must(src.includes(token),'variant B field rendered: '+token);

must(src.includes('Advertencias del backend'),'backend warnings rendered');
must(src.includes('resultado.mensaje'),'backend result message rendered');
must(src.includes('resultado.resultado'),'backend result object rendered');
must(src.includes('resultado.ya_aplicado'),'backend ya_aplicado rendered');

must(!src.includes('El nuevo plan no se actualizará todavía en CONAPE.'),'stale generic CONAPE copy removed');
must(src.includes('La pantalla no asumirá que un desembolso equivale a pago'),'disbursement/payment distinction explicit');

console.log('CAMBIO_ACADEMICO_FRONTEND_SOURCE_GUARD=PASS');
console.log('ACADEMIC_CASES_HIDE_SOLO_VARIANTE=PASS');
console.log('PAYMENT_VARIANTS_ABC_BACKEND_DRIVEN=PASS');
console.log('COMPARE_BEFORE_AFTER=PASS');
console.log('ACTIVITY_NON_BLOCKING=PASS');
console.log('CONAPE_BANK_CAMPUS_4_STATES=PASS');
console.log('VARIANT_B_FINANCIAL_DETAIL=PASS');
console.log('EXECUTION_INDIVIDUAL_CONFIRMATION=PASS');
