/* C3.7.3 · runtime compatibility shim
   The C3.7 bridge uses AbortSignal.timeout(30000) only for Campus Apps Script
   validation. Real production evidence showed that exact 30s ceiling aborting
   /v1/recruit/submit before the CONAPE CREATE phase. Keep the C3.7 implementation
   intact and widen only that timeout while the backend latency is addressed.
*/
const configured = Number(process.env.CAMPUS_REQUEST_TIMEOUT_MS || 70000);
const campusTimeoutMs = Number.isFinite(configured) ? Math.max(30000, configured) : 70000;
const nativeTimeout = AbortSignal.timeout.bind(AbortSignal);

AbortSignal.timeout = function campusAwareTimeout(ms) {
  return nativeTimeout(Number(ms) === 30000 ? campusTimeoutMs : ms);
};

console.log(JSON.stringify({
  event:'bridge_runtime_patch',
  version:'C3.7.3',
  campus_timeout_ms:campusTimeoutMs,
  pii:false,
}));

await import('./server_c3_7.mjs');
