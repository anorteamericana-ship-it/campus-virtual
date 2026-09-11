/* CONAPE Tracking V2 · orquestación read-only. Sin logging ni escrituras. */
import { parseConapeTrackingHome } from './conape_tracking_parser_v2.mjs';
import { authorizeTrackingIdentities, publicTrackingMetrics } from './conape_tracking_backend_v2.mjs';
import { filterAuthorizedTracking } from './conape_tracking_contract_v2.mjs';

function routeError(code, message, status = 503) {
  return Object.assign(new Error(message), { code, status, stage:'TRACKING_READ' });
}

export async function trackingQueryV2({
  body,
  authorizeSession,
  campusCall,
  extractCedula,
  extractFinancing,
  readHomeHtml,
  capturedAt = null,
}) {
  if (typeof authorizeSession !== 'function' || typeof campusCall !== 'function' || typeof readHomeHtml !== 'function') {
    throw new TypeError('Tracking route dependencies required.');
  }

  const authorization = await authorizeTrackingIdentities({
    token:body?.token,
    cedulas:body?.cedulas,
    authorizeSession,
    getProspectoDetalle:(token, cedula) => campusCall({ fn:'getProspectoDetalle', token, cedula }),
    extractCedula,
    extractFinancing,
  });

  if (!authorization.authorizedCedulas.length) {
    return {
      ok:true,
      records:[],
      metrics:publicTrackingMetrics({ authorization:authorization.metrics }),
    };
  }

  const html = await readHomeHtml();
  const parsed = parseConapeTrackingHome(html, { capturedAt:capturedAt || new Date().toISOString() });
  if (!parsed?.ok) {
    const reason = String(parsed?.error?.reason || parsed?.error?.code || 'TRACKING_PARSE_FAILED').replace(/[^A-Z0-9_]/gi, '_').slice(0, 64);
    throw routeError('TRACKING_SOURCE_UNAVAILABLE', `Tracking CONAPE no disponible (${reason}).`, 503);
  }

  const filtered = filterAuthorizedTracking(parsed.records, authorization.authorizedCedulas);
  return {
    ok:true,
    records:filtered.records,
    metrics:publicTrackingMetrics({
      authorization:authorization.metrics,
      parser:parsed.metrics,
      filtered:filtered.metrics,
    }),
  };
}
