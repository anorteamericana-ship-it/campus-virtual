/* EXAM PREP LAB · adaptador hacia Apps Script (fn=certprepapi).
 * El navegador solo envía {token, action, payload}. Identidad, permisos, claves y relojes los decide el servidor.
 * Lo usan el Campus (src/exam_prep_lab.jsx, con la sesión del Campus) y la página propia en modo apps-script
 * (cuentas solo de preparación, con token "cp1." guardado en sessionStorage, nunca en localStorage). */
(function (root) {
  'use strict';
  const CERT_KEY = 'epl_cert_session_v1';
  const url = () => root.APPS_SCRIPT_URL || '';
  async function post(body) {
    if (!url()) return { ok: false, error: 'sin_backend', mensaje: 'No está configurada la dirección del servidor.' };
    let r;
    try {
      r = await fetch(url() + '?fn=certprepapi', { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ fn: 'certprepapi' }, body)), cache: 'no-store' });
    } catch (e) { throw new Error('sin_conexion'); } // la interfaz encola respuestas cuando no hay conexión
    const text = await r.text();
    try { return JSON.parse(text); } catch (_) { return { ok: false, error: 'respuesta_invalida', mensaje: 'Respuesta inválida del servidor.' }; }
  }
  function certSession() { try { return JSON.parse(root.sessionStorage.getItem(CERT_KEY) || 'null'); } catch (_) { return null; } }
  function setCertSession(s) { try { if (s) root.sessionStorage.setItem(CERT_KEY, JSON.stringify(s)); else root.sessionStorage.removeItem(CERT_KEY); } catch (_) {} }
  const Adapter = {
    api(getToken) {
      return { call: (action, payload) => post({ token: getToken() || '', action, payload: payload || {} }), callPublic: (action, payload) => post({ action, payload: payload || {} }) };
    },
    async login(usuario, clave) {
      const r = await post({ action: 'login', payload: { usuario, clave } });
      if (r && r.ok) setCertSession({ token: r.token, user: r.user, expira: r.expira });
      return r;
    },
    async logout() { const s = certSession(); setCertSession(null); if (s && s.token) { try { await post({ token: s.token, action: 'logout' }); } catch (_) {} } },
    certSession,
    certToken() { const s = certSession(); return s && s.expira && Date.parse(s.expira) > Date.now() ? s.token : ''; }
  };
  root.EPLAppsScript = Adapter;
})(typeof window !== 'undefined' ? window : globalThis);
