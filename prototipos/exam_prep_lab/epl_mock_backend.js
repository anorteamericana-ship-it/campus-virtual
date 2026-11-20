/* EXAM PREP LAB · backend SIMULADO para el prototipo (no es el Campus).
 * Ejecuta el mismo núcleo que irá en Apps Script (epl_server_core.js) con tablas guardadas en el navegador.
 * Las sesiones son ficticias: el token identifica al usuario en el "servidor" simulado; el navegador nunca
 * envía quién es en el payload. Usuarios, cédulas y códigos son inventados.
 */
(function (root) {
  'use strict';
  const EPL = root.EPL, EPLServer = root.EPLServer;
  const NS = root.EPL_PUBLIC_MODE === true ? 'epl_public_v1_' : 'epl_mock_v2_';
  const store = (() => { try { const ls = root.localStorage; ls.setItem(NS + 'probe', '1'); ls.removeItem(NS + 'probe'); return ls; } catch (_) { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; } })();
  const tables = {};
  const load = t => { if (!tables[t]) { try { tables[t] = JSON.parse(store.getItem(NS + t) || '[]'); } catch (_) { tables[t] = []; } } return tables[t]; };
  const persist = t => { try { store.setItem(NS + t, JSON.stringify(tables[t])); } catch (_) { /* almacenamiento lleno: el prototipo sigue en memoria */ } };
  const db = {
    read: t => load(t).map(r => Object.assign({}, r)),
    upsert(t, pk, row) { const a = load(t); const i = a.findIndex(r => String(r[pk]) === String(row[pk])); if (i >= 0) a[i] = Object.assign({}, row); else a.push(Object.assign({}, row)); persist(t); },
    append(t, row) { load(t).push(Object.assign({}, row)); persist(t); },
    lock: fn => fn()
  };
  /* Directorio ficticio que imita una búsqueda de solo lectura en DATOS/USUARIOS del Campus. */
  const DIRECTORY = [
    { codigo: '17901', nombre: 'Ana Demo Rojas', cedula_mask: '•••••••901', usuario: 'ana.demo', rol: 'student', estado_programa: 'APR (egresada, ficticio)' },
    { codigo: '16502', nombre: 'Bruno Demo Castro', cedula_mask: '•••••••502', usuario: null, rol: null, estado_programa: 'APR (egresado sin cuenta, ficticio)' },
    { codigo: '16610', nombre: 'Carla Demo Vega', cedula_mask: '•••••••610', usuario: 'carla.demo', rol: 'student', estado_programa: 'CA (grupo activo, ficticio)' },
    { codigo: '15877', nombre: 'Diego Demo Mora', cedula_mask: '•••••••877', usuario: null, rol: null, estado_programa: 'APR (egresado sin cuenta, ficticio)' }
  ];
  const STAFF = { 'leo.demo': { usuario: 'leo.demo', rol: 'superadmin', nombre: 'Leo Demo (superadmin)' }, 'profe.demo': { usuario: 'profe.demo', rol: 'teacher', nombre: 'Profe Demo (docente revisora)' }, 'admin.demo': { usuario: 'admin.demo', rol: 'admin', nombre: 'Admin Demo' } };
  const uuid = () => (root.crypto && root.crypto.randomUUID) ? root.crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  let clockOffset = 0;
  const deps = {
    now: () => Date.now() + clockOffset, uuid, sha256: EPL.sha256, forms: () => root.EPL_FORMS || {}, audio: () => root.EPL_AUDIO || null, pepper: 'demo-pepper',
    searchPeople: q => { q = String(q).toLowerCase(); return DIRECTORY.filter(p => [p.codigo, p.nombre, p.usuario].some(v => String(v || '').toLowerCase().includes(q))).map(p => Object.assign({ tiene_cuenta: !!p.usuario }, p)); },
    usernameExists: u => DIRECTORY.some(p => p.usuario === u) || !!STAFF[u],
    hashPassword: p => { const salt = uuid().slice(0, 8); return 'demo$' + salt + '$' + EPL.sha256(salt + '|' + p); },
    verifyPassword: (h, p) => { const [, salt, hex] = String(h).split('$'); return !!salt && EPL.sha256(salt + '|' + p) === hex; }
  };
  const core = EPLServer.create({ db, deps, config: { ENV: 'DEMO' } });

  function seed() {
    if (load('CERT_CANDIDATES').length) return;
    const forms = Object.keys(root.EPL_FORMS || {});
    const practice = forms.includes('B') ? ['B'] : forms.slice(0, 1); const sim = forms.includes('A') ? ['A'] : forms.slice(0, 1);
    db.upsert('CERT_CONFIG', 'KEY', { KEY: 'ENV', VALUE: 'DEMO' });
    db.upsert('CERT_CONFIG', 'KEY', { KEY: 'DEFAULT_PRACTICE_FORMS', VALUE: JSON.stringify(practice) });
    db.upsert('CERT_CONFIG', 'KEY', { KEY: 'DEFAULT_SIM_FORMS', VALUE: JSON.stringify(sim) });
    const leo = STAFF['leo.demo'];
    const r1 = core.handle(leo, 'adminRegister', { codigo: '17901', nombre: 'Ana Demo Rojas', cedula: '100000901', correo: 'ana.demo@example.com' });
    core.handle(leo, 'adminGrant', { candidate_id: r1.candidate.candidate_id, forms: practice, sim_forms: sim, motivo: 'Demostración' });
    const r2 = core.handle(leo, 'adminRegister', { codigo: '16502', nombre: 'Bruno Demo Castro', cedula: '100000502', correo: 'bruno.demo@example.com' });
    core.handle(leo, 'adminGrant', { candidate_id: r2.candidate.candidate_id, forms: practice, sim_forms: sim, motivo: 'Demostración: egresado sin cuenta' });
    const link = core.handle(leo, 'adminActivationLink', { candidate_id: r2.candidate.candidate_id });
    core.handle(null, 'activate', { token: link.token, usuario: 'bruno.demo', clave: 'Demo2026x' });
    core.handle(leo, 'adminAssign', { docente_usuario: 'profe.demo', candidate_id: r1.candidate.candidate_id });
    db.upsert('CERT_EDITORS', 'USUARIO', { USUARIO: 'profe.demo', ROL_EDITORIAL: 'REVISOR', ACTIVO: 'true' });
  }

  /* Sesiones simuladas: el "servidor" guarda token → identidad. */
  const sessions = (() => { try { return JSON.parse(store.getItem(NS + 'sessions') || '{}'); } catch (_) { return {}; } })();
  const saveSessions = () => { try { store.setItem(NS + 'sessions', JSON.stringify(sessions)); } catch (_) {} };
  function openSession(identity) { const token = uuid(); sessions[token] = identity; saveSessions(); return token; }
  const DEMO_LOGINS = [
    { id: 'ana', label: 'Ana Demo · estudiante con cuenta del Campus (egresada)', identity: { usuario: 'ana.demo', rol: 'student', codigo: '17901', nombre: 'Ana Demo Rojas' } },
    { id: 'bruno', label: 'Bruno Demo · egresado sin cuenta (cuenta exclusiva de preparación)', cert: { usuario: 'bruno.demo', clave: 'Demo2026x' } },
    { id: 'carla', label: 'Carla Demo · estudiante sin acceso a Exam Prep Lab', identity: { usuario: 'carla.demo', rol: 'student', codigo: '16610', nombre: 'Carla Demo Vega' } },
    { id: 'profe', label: 'Profe Demo · docente revisora (asignada a Ana)', identity: Object.assign({ codigo: '' }, STAFF['profe.demo']) },
    { id: 'leo', label: 'Leo Demo · superadmin', identity: Object.assign({ codigo: '' }, STAFF['leo.demo']) }
  ];
  let offline = false; const latency = () => 20 + Math.random() * 60;

  const Mock = {
    ready() { seed(); return true; },
    demoLogins: DEMO_LOGINS.map(x => ({ id: x.id, label: x.label })),
    loginDemo(id) { seed(); const x = DEMO_LOGINS.find(d => d.id === id); if (!x) return { ok: false, error: 'demo_inexistente' }; if (x.cert) return Mock.loginCert(x.cert.usuario, x.cert.clave); return { ok: true, token: openSession(x.identity), user: x.identity }; },
    // Invitados de QA pública, sin cédula, correo ni cuentas del Campus. Siempre formas A y B.
    loginPublicGuest(id, name) {
      if (root.EPL_PUBLIC_MODE !== true) return { ok: false, error: 'modo_incorrecto' };
      seed();
      const key = String(id || '').toLowerCase();
      const clean = String(name || '').trim().replace(/\s+/g, ' ');
      if (!/^[a-f0-9-]{32,36}$/.test(key) || clean.length < 2 || clean.length > 60) {
        return { ok: false, error: 'perfil_invalido', mensaje: 'Ingresá un nombre válido.' };
      }
      const codigo = 'QA-' + key.replace(/-/g, '').slice(0, 24).toUpperCase();
      let candidate = db.read('CERT_CANDIDATES').find(c => c.CODIGO === codigo);
      if (!candidate) {
        const made = core.handle(STAFF['leo.demo'], 'adminRegister', { nombre: clean, codigo });
        if (!made.ok) return made;
        candidate = db.read('CERT_CANDIDATES').find(c => c.CODIGO === codigo);
      }
      if (!candidate) return { ok: false, error: 'perfil_no_creado' };
      const access = db.read('CERT_PREP_ACCESS').find(a => a.CANDIDATE_ID === candidate.CANDIDATE_ID);
      if (!access || !String(access.FORMS).includes('A') || !String(access.FORMS).includes('B')) {
        const granted = core.handle(STAFF['leo.demo'], 'adminGrant', { candidate_id: candidate.CANDIDATE_ID, forms: ['A', 'B'], sim_forms: ['A', 'B'], motivo: 'Piloto de diagnóstico público' });
        if (!granted.ok) return granted;
      }
      const user = { usuario: 'public.' + key, rol: 'student', codigo, nombre: candidate.NOMBRE };
      return { ok: true, token: openSession(user), user, candidate_id: candidate.CANDIDATE_ID };
    },
    loginCert(usuario, clave) { seed(); const r = core.handle(null, 'verifyLogin', { usuario, clave }); if (!r.ok) return r; const id = { usuario: r.usuario, rol: r.rol, codigo: r.codigo, nombre: r.nombre }; return { ok: true, token: openSession(id), user: id }; },
    logout(token) { delete sessions[token]; saveSessions(); },
    whoami(token) { return sessions[token] || null; },
    call(token, action, payload) {
      return new Promise((resolve, reject) => setTimeout(() => {
        if (offline) return reject(new Error('sin_conexion'));
        const ctx = sessions[token] || null; // identidad del lado "servidor", no del payload
        resolve(JSON.parse(JSON.stringify(core.handle(ctx, action, payload || {}))));
      }, latency()));
    },
    callPublic(action, payload) { return Promise.resolve(core.handle(null, action, payload || {})); },
    setOffline(v) { offline = !!v; }, isOffline: () => offline,
    advanceClock(ms) { clockOffset += ms; }, serverNow: () => deps.now(),
    reset() { Object.keys(tables).forEach(k => delete tables[k]); Object.keys(store).filter ? 0 : 0; for (const t of Object.values(core.TABLES)) store.removeItem(NS + t); store.removeItem(NS + 'sessions'); Object.keys(sessions).forEach(k => delete sessions[k]); },
    core, db
  };
  root.EPLMock = Mock;
  if (typeof module !== 'undefined') module.exports = Mock;
})(typeof window !== 'undefined' ? window : globalThis);
