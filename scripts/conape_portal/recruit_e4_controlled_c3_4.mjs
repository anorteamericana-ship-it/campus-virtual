import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import { allowedTarget, safeUrl } from './discover_recruit_form_c3_3.mjs';

const HOST = 'online.conape.go.cr';
const POLL_MS = 700;
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const NAV_RETRY_MS = 3000;
const MAX_NAV_ATTEMPTS = 5;
const LOOKUP_WAIT_MS = 12000;
const POST_WAIT_MS = 20000;

class E4Error extends Error {
  constructor(reason, message) {
    super(message);
    this.name = 'E4Error';
    this.reason = reason;
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const digits = value => String(value || '').replace(/\D/g, '');
const localPhone = value => {
  const d = digits(value);
  if (d.length === 11 && d.startsWith('506')) return d.slice(3);
  return d.slice(-8);
};
const cleanEmail = value => String(value || '').trim().toLowerCase().slice(0, 128);

function parseActivePort(raw) {
  const port = Number(String(raw || '').trim().split(/\r?\n/)[0]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new E4Error('DEVTOOLS_PORT_INVALID', 'DevToolsActivePort inválido.');
  return port;
}

function isProspectoPath(raw) {
  try {
    const u = raw.includes('://') ? new URL(raw) : null;
    const p = u ? u.pathname : String(raw || '');
    return decodeURIComponent(p).toLowerCase().includes('/prospecto');
  } catch {
    return String(raw || '').toLowerCase().includes('/prospecto');
  }
}

async function listTargets(port) {
  const r = await fetch(`http://127.0.0.1:${port}/json/list`, { signal:AbortSignal.timeout(3000) });
  if (!r.ok) return [];
  const data = await r.json();
  return Array.isArray(data) ? data : [];
}

function conapeTargets(targets) {
  return (targets || [])
    .filter(t => t?.type === 'page' && t?.webSocketDebuggerUrl && allowedTarget(t.url))
    .sort((a, b) => Number(isProspectoPath(b.url)) - Number(isProspectoPath(a.url)));
}

function safeBodyKeys(postData) {
  const raw = String(postData || '');
  if (!raw) return [];
  try {
    if (raw.trim().startsWith('{')) {
      const obj = JSON.parse(raw);
      return Object.keys(obj || {}).filter(k => /^[A-Za-z0-9_:\-]{1,80}$/.test(k)).sort();
    }
  } catch {}
  try {
    return [...new Set([...new URLSearchParams(raw).keys()].filter(k => /^[A-Za-z0-9_:\-]{1,80}$/.test(k)))].sort();
  } catch {
    return [];
  }
}

function safeRequestToken(postData) {
  const raw = String(postData || '');
  const token = value => {
    const v = String(value || '').trim();
    return /^[A-Z][A-Z0-9_:\-]{0,39}$/i.test(v) ? v.toUpperCase() : '';
  };
  try {
    if (raw.trim().startsWith('{')) {
      const obj = JSON.parse(raw);
      return token(obj?.p_request || obj?.request || '');
    }
  } catch {}
  try {
    const p = new URLSearchParams(raw);
    return token(p.get('p_request') || p.get('request') || '');
  } catch {
    return '';
  }
}

class CdpClient {
  constructor(ws) {
    this.ws = ws;
    this.socket = null;
    this.nextId = 1;
    this.pending = new Map();
    this.eventListeners = new Map();
  }
  async connect() {
    if (typeof globalThis.WebSocket !== 'function') throw new E4Error('WEBSOCKET_UNAVAILABLE', 'Se requiere Node 22 o superior.');
    await new Promise((resolve, reject) => {
      const socket = new WebSocket(this.ws);
      this.socket = socket;
      const timer = setTimeout(() => reject(new E4Error('CDP_CONNECT_TIMEOUT', 'Chrome DevTools no respondió.')), 10000);
      socket.addEventListener('open', () => { clearTimeout(timer); resolve(); });
      socket.addEventListener('error', () => { clearTimeout(timer); reject(new E4Error('CDP_CONNECT_FAILED', 'No se pudo conectar a Chrome DevTools.')); });
      socket.addEventListener('message', event => {
        let msg;
        try { msg = JSON.parse(String(event.data)); } catch { return; }
        if (msg.id) {
          const pending = this.pending.get(msg.id);
          if (!pending) return;
          this.pending.delete(msg.id);
          if (msg.error) pending.reject(new E4Error('CDP_PROTOCOL_ERROR', msg.error.message || 'Error CDP.'));
          else pending.resolve(msg.result || {});
          return;
        }
        if (msg.method) {
          for (const fn of this.eventListeners.get(msg.method) || []) {
            try { fn(msg.params || {}); } catch {}
          }
        }
      });
      socket.addEventListener('close', () => {
        for (const pending of this.pending.values()) pending.reject(new E4Error('CDP_CLOSED', 'Chrome cerró CDP.'));
        this.pending.clear();
      });
    });
  }
  on(method, fn) {
    const list = this.eventListeners.get(method) || [];
    list.push(fn);
    this.eventListeners.set(method, list);
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression, userGesture = false) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue:true, awaitPromise:true, userGesture:!!userGesture });
    if (r.exceptionDetails) throw new E4Error('CDP_EVALUATION_ERROR', 'No se pudo evaluar la página.');
    return r.result?.value;
  }
  close() { try { this.socket?.close(); } catch {} }
}

const FIND_RECRUIT = `(() => {
  const norm = v => String(v || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
  const visible = el => { const s=getComputedStyle(el); const r=el.getBoundingClientRect(); return s.display!=='none' && s.visibility!=='hidden' && r.width>0 && r.height>0; };
  const hit = Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')).filter(visible).find(el => norm([el.textContent||'',el.getAttribute('aria-label')||'',el.getAttribute('title')||'',el.value||''].join(' ')).includes('RECLUTAR PROSPECTOS'));
  if (!hit) return {found:false};
  hit.click();
  return {found:true};
})()`;

const FORM_READY = `(() => {
  const ids=['P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'];
  return {ready:ids.every(id=>!!document.getElementById(id)), title:String(document.title||''), path:location.pathname};
})()`;

function cedulaLookupExpression(cedula) {
  const safe = JSON.stringify(String(cedula || ''));
  return `(() => {
    const el=document.getElementById('P2_PRS_CEDULA');
    if(!el) return {ok:false};
    const value=${safe};
    const proto=Object.getPrototypeOf(el);
    const d=Object.getOwnPropertyDescriptor(proto,'value');
    if(d && d.set) d.set.call(el,value); else el.value=value;
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    el.focus();
    el.blur();
    return {ok:true};
  })()`;
}

const LOOKUP_STATE = `(() => {
  const value=id=>String(document.getElementById(id)?.value||'').trim();
  const meta=id=>{
    const el=document.getElementById(id);
    return {present:!!value(id), readonly:!!el?.readOnly, disabled:!!el?.disabled};
  };
  const visible = el => { try { const s=getComputedStyle(el); const r=el.getBoundingClientRect(); return s.display!=='none' && s.visibility!=='hidden' && r.width>0 && r.height>0; } catch { return false; } };
  const norm = v => String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
  const nodes=Array.from(document.querySelectorAll('[role="alert"],.t-Alert,.a-Alert,.t-Form-error,.apex-page-item-error,.t-Alert--danger,.t-Alert--warning')).filter(visible);
  const text=norm(nodes.map(n=>n.textContent||'').join(' '));
  const apellido1=meta('P2_PRS_APELLIDO_1');
  const apellido2=meta('P2_PRS_APELLIDO_2');
  const nombre=meta('P2_PRS_NOMBRE');
  const celular=meta('P2_PRS_CELULAR');
  const email=meta('P2_PRS_EMAIL');
  return {
    identity_ready:apellido1.present && nombre.present,
    apellido1,
    apellido2,
    nombre,
    celular,
    email,
    duplicate_warning:/YA EXIST|DUPLIC/.test(text) && /CEDULA|PROSPECT/.test(text),
    validation_warning:/ERROR|INVALID|OBLIGATOR|REQUERID/.test(text),
    visible_alerts:nodes.length
  };
})()`;

function contactFillExpression({ celular, email, setPhone, setEmail }) {
  const safe = JSON.stringify({ celular, email, setPhone:!!setPhone, setEmail:!!setEmail }).replace(/</g, '\\u003c');
  return `(() => {
    const data=${safe};
    const setValue=(id,value)=>{
      const el=document.getElementById(id); if(!el) return false;
      const proto=Object.getPrototypeOf(el); const d=Object.getOwnPropertyDescriptor(proto,'value');
      if(d && d.set) d.set.call(el,value); else el.value=value;
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
      el.focus(); el.blur();
      return true;
    };
    let changed=0;
    if(data.setPhone){ if(!setValue('P2_PRS_CELULAR',data.celular)) return {ok:false,changed}; changed+=1; }
    if(data.setEmail){ if(!setValue('P2_PRS_EMAIL',data.email)) return {ok:false,changed}; changed+=1; }
    return {ok:true,changed};
  })()`;
}

const VALIDATION_STATE = `(() => {
  const visible = el => { try { const s=getComputedStyle(el); const r=el.getBoundingClientRect(); return s.display!=='none' && s.visibility!=='hidden' && r.width>0 && r.height>0; } catch { return false; } };
  const norm = v => String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
  const nodes=Array.from(document.querySelectorAll('[role="alert"],.t-Alert,.a-Alert,.t-Form-error,.apex-page-item-error,.t-Alert--danger,.t-Alert--warning')).filter(visible);
  const text=norm(nodes.map(n=>n.textContent||'').join(' '));
  const duplicate=/YA EXIST|DUPLIC/.test(text) && /CEDULA|PROSPECT/.test(text);
  const error=/ERROR|INVALID|OBLIGATOR|REQUERID/.test(text);
  const phone=String(document.getElementById('P2_PRS_CELULAR')?.value||'').replace(/\D/g,'');
  const identity=[
    String(document.getElementById('P2_PRS_APELLIDO_1')?.value||'').trim(),
    String(document.getElementById('P2_PRS_NOMBRE')?.value||'').trim()
  ];
  return {duplicate_warning:duplicate, validation_warning:error, visible_alerts:nodes.length, phone_ready:phone.length===8, identity_ready:identity.every(Boolean)};
})()`;

const CLICK_CREATE = `(() => {
  const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
  const visible=el=>{const s=getComputedStyle(el);const r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
  const hit=Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')).filter(visible).find(el=>norm([el.textContent||'',el.getAttribute('aria-label')||'',el.getAttribute('title')||'',el.value||''].join(' ')).includes('CREAR NUEVO PROSPECTO'));
  if(!hit) return {clicked:false};
  hit.click();
  return {clicked:true};
})()`;

const OUTCOME_STATE = `(() => {
  const visible = el => { try { const s=getComputedStyle(el); const r=el.getBoundingClientRect(); return s.display!=='none' && s.visibility!=='hidden' && r.width>0 && r.height>0; } catch { return false; } };
  const norm = v => String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
  const nodes=Array.from(document.querySelectorAll('[role="alert"],.t-Alert,.a-Alert,.t-Body-alert,.t-Form-error,.apex-page-item-error')).filter(visible);
  const text=norm(nodes.map(n=>n.textContent||'').join(' '));
  return {
    title:String(document.title||''),
    path:location.pathname,
    success_message:/CREAD|REGISTRAD|GUARDAD|CORRECTAMENTE|EXITOS/.test(text) && !/ERROR|INVALID/.test(text),
    duplicate_message:/YA EXIST|DUPLIC/.test(text),
    error_message:/ERROR|INVALID|OBLIGATOR|REQUERID/.test(text),
    visible_alerts:nodes.length
  };
})()`;

async function inspectOne(target, expression, userGesture = false) {
  const client = new CdpClient(target.webSocketDebuggerUrl);
  try {
    await client.connect();
    await client.send('Runtime.enable');
    await client.send('Page.enable');
    return await client.eval(expression, userGesture);
  } finally {
    client.close();
  }
}

async function promptCedula(rl) {
  console.log('\nPASO 1 · CONAPE busca la persona por cédula. Nombre y apellidos NO serán escritos por este script.');
  const cedula = digits(await rl.question('Cédula: '));
  if (!cedula || cedula.length < 8) throw new E4Error('INPUT_CEDULA_INVALID', 'Cédula inválida.');
  return cedula;
}

async function promptContacts(rl, lookup) {
  console.log('\nPASO 2 · Complete o actualice únicamente teléfono/correo. Enter conserva el dato que ya tenga CONAPE.');
  const phonePrompt = lookup.celular?.present
    ? 'Nuevo WhatsApp/teléfono (Enter = conservar CONAPE): '
    : 'WhatsApp/teléfono (obligatorio porque CONAPE no lo encontró): ';
  const phoneRaw = String(await rl.question(phonePrompt)).trim();
  const celular = phoneRaw ? localPhone(phoneRaw) : '';
  if (phoneRaw && celular.length !== 8) throw new E4Error('INPUT_PHONE_INVALID', 'El teléfono debe quedar en 8 dígitos.');
  if (!lookup.celular?.present && celular.length !== 8) throw new E4Error('INPUT_PHONE_REQUIRED', 'CONAPE no tiene teléfono; debe completar un WhatsApp/teléfono de 8 dígitos.');

  const emailPrompt = lookup.email?.present
    ? 'Nuevo correo (Enter = conservar CONAPE): '
    : 'Correo (Enter = dejar vacío si corresponde): ';
  const emailRaw = String(await rl.question(emailPrompt)).trim();
  const email = emailRaw ? cleanEmail(emailRaw) : '';
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new E4Error('INPUT_EMAIL_INVALID', 'Correo inválido.');

  return {
    celular,
    email,
    setPhone:!!phoneRaw,
    setEmail:!!emailRaw
  };
}

async function run({ profileDir, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  if (!profileDir) throw new E4Error('PROFILE_REQUIRED', 'Use --profile <perfil-temporal>.');
  const portFile = path.join(profileDir, 'DevToolsActivePort');
  if (!fs.existsSync(portFile)) throw new E4Error('DEVTOOLS_PORT_FILE_MISSING', 'No existe DevToolsActivePort.');
  const port = parseActivePort(fs.readFileSync(portFile, 'utf8'));
  const until = Date.now() + timeoutMs;
  let announced = false;
  let clickAttempts = 0;
  let lastClickAt = 0;

  while (Date.now() < until) {
    const targets = conapeTargets(await listTargets(port));
    if (!targets.length) {
      if (!announced) { console.log('C3.4 E4: inicie sesión y deje visible Reclutar Prospectos.'); announced = true; }
      await sleep(POLL_MS);
      continue;
    }

    const prospect = targets.find(t => isProspectoPath(t.url));
    if (prospect) {
      const ready = await inspectOne(prospect, FORM_READY).catch(() => null);
      if (ready?.ready) {
        const rl = readline.createInterface({ input, output });
        try {
          const cedula = await promptCedula(rl);
          const lookupStart = await inspectOne(prospect, cedulaLookupExpression(cedula));
          if (!lookupStart?.ok) throw new E4Error('CEDULA_LOOKUP_START_FAILED', 'No se pudo iniciar la búsqueda por cédula en CONAPE.');

          let lookup = null;
          const lookupUntil = Date.now() + LOOKUP_WAIT_MS;
          while (Date.now() < lookupUntil) {
            await sleep(POLL_MS);
            lookup = await inspectOne(prospect, LOOKUP_STATE).catch(() => null);
            if (lookup?.duplicate_warning || lookup?.validation_warning || lookup?.identity_ready) break;
          }
          if (!lookup) throw new E4Error('CEDULA_LOOKUP_NO_RESPONSE', 'CONAPE no devolvió estado para la cédula.');
          if (lookup.duplicate_warning || lookup.validation_warning) {
            console.log('\nC3.4 E4 LOOKUP');
            console.log(JSON.stringify({
              identity_found:!!lookup.identity_ready,
              phone_present:!!lookup.celular?.present,
              email_present:!!lookup.email?.present,
              duplicate_warning_detected:!!lookup.duplicate_warning,
              validation_warning_detected:!!lookup.validation_warning,
              identity_fields_modified:false,
              write_performed:false
            }, null, 2));
            throw new E4Error('CEDULA_LOOKUP_BLOCK', 'CONAPE mostró una advertencia durante la búsqueda por cédula. No se hará CREATE.');
          }
          if (!lookup.identity_ready) {
            throw new E4Error('CEDULA_IDENTITY_NOT_FOUND', 'CONAPE no completó nombre y primer apellido para esta cédula. El script no los inventará ni los escribirá.');
          }

          console.log('\nC3.4 E4 LOOKUP: PASS');
          console.log(JSON.stringify({
            identity_found:true,
            primer_apellido_found:!!lookup.apellido1?.present,
            segundo_apellido_found:!!lookup.apellido2?.present,
            nombre_found:!!lookup.nombre?.present,
            phone_present:!!lookup.celular?.present,
            email_present:!!lookup.email?.present,
            identity_readonly_or_disabled:{
              primer_apellido:!!(lookup.apellido1?.readonly || lookup.apellido1?.disabled),
              segundo_apellido:!!(lookup.apellido2?.readonly || lookup.apellido2?.disabled),
              nombre:!!(lookup.nombre?.readonly || lookup.nombre?.disabled)
            },
            identity_fields_modified:false,
            write_performed:false,
            pii_emitted:false
          }, null, 2));

          const contacts = await promptContacts(rl, lookup);
          const contactResult = await inspectOne(prospect, contactFillExpression(contacts));
          if (!contactResult?.ok) throw new E4Error('CONTACT_FILL_FAILED', 'No se pudieron preparar teléfono/correo.');
          await sleep(1400);

          const validation = await inspectOne(prospect, VALIDATION_STATE).catch(() => ({ duplicate_warning:false, validation_warning:false, visible_alerts:0, phone_ready:false, identity_ready:false }));
          console.log('\nC3.4 E4 PRECHECK');
          console.log(JSON.stringify({
            target:safeUrl(prospect.url),
            request_candidate:'CREATE',
            cedula_lookup_completed:true,
            identity_from_conape:true,
            identity_fields_modified:false,
            contact_fields_modified:contactResult.changed || 0,
            phone_ready:!!validation.phone_ready,
            duplicate_warning_detected:!!validation.duplicate_warning,
            validation_warning_detected:!!validation.validation_warning,
            visible_alerts:validation.visible_alerts || 0,
            write_performed:false
          }, null, 2));

          if (!validation.identity_ready) throw new E4Error('IDENTITY_LOST_BEFORE_CREATE', 'CONAPE dejó de mostrar la identidad. No se hará CREATE.');
          if (!validation.phone_ready) throw new E4Error('PHONE_NOT_READY', 'El teléfono final no quedó en 8 dígitos. No se hará CREATE.');
          if (validation.duplicate_warning || validation.validation_warning) {
            throw new E4Error('FORM_VALIDATION_BLOCK', 'CONAPE muestra una advertencia/validación. No se hará CREATE.');
          }

          console.log('\nRevise visualmente: nombre y apellidos deben ser los traídos por CONAPE; el script nunca los modificó.');
          const ack = String(await rl.question('Para ejecutar UNA creación real escriba exactamente CREAR: ')).trim().toUpperCase();
          if (ack !== 'CREAR') throw new E4Error('E4_NOT_AUTHORIZED_AT_RUNTIME', 'No se recibió confirmación CREAR; no hubo escritura.');

          const networkClient = new CdpClient(prospect.webSocketDebuggerUrl);
          const signatures = [];
          const statusById = new Map();
          try {
            await networkClient.connect();
            await networkClient.send('Runtime.enable');
            await networkClient.send('Page.enable');
            await networkClient.send('Network.enable');
            networkClient.on('Network.requestWillBeSent', params => {
              try {
                const req = params.request || {};
                const u = new URL(req.url);
                if (u.hostname.toLowerCase() !== HOST) return;
                const method = String(req.method || 'GET').toUpperCase();
                const bodyKeys = safeBodyKeys(req.postData || '');
                const requestToken = safeRequestToken(req.postData || '');
                signatures.push({ requestId:params.requestId, method, path:u.pathname, body_keys:bodyKeys, request_token:requestToken });
              } catch {}
            });
            networkClient.on('Network.responseReceived', params => {
              const response = params.response || {};
              try {
                const u = new URL(response.url);
                if (u.hostname.toLowerCase() === HOST) statusById.set(params.requestId, Number(response.status || 0));
              } catch {}
            });

            const clicked = await networkClient.eval(CLICK_CREATE, true);
            if (!clicked?.clicked) throw new E4Error('CREATE_CLICK_FAILED', 'No se pudo activar Crear nuevo Prospecto.');
            const postUntil = Date.now() + POST_WAIT_MS;
            let outcome = null;
            while (Date.now() < postUntil) {
              await sleep(700);
              try {
                outcome = await networkClient.eval(OUTCOME_STATE);
                if (outcome?.success_message || outcome?.duplicate_message || outcome?.error_message || !isProspectoPath(outcome?.path || '')) break;
              } catch {
                break;
              }
            }

            const safeRequests = signatures
              .map(s => ({ method:s.method, path:s.path, body_keys:s.body_keys, request_token:s.request_token, status:statusById.get(s.requestId) || null }))
              .filter(s => s.method === 'POST' || s.request_token || s.body_keys.some(k => /^P2_PRS_|^p_request$/i.test(k)))
              .slice(-12);
            const createObserved = safeRequests.some(s => s.request_token === 'CREATE' || s.body_keys.some(k => /^P2_PRS_CEDULA$/i.test(k)));
            const successSignal = !!outcome && (outcome.success_message === true || (!isProspectoPath(outcome.path || '') && !outcome.error_message));

            console.log('\nC3.4 E4 RESULT');
            console.log(JSON.stringify({
              target_before:safeUrl(prospect.url),
              create_request_observed:createObserved,
              request_contract:safeRequests,
              outcome:{
                title:outcome?.title || '',
                path:outcome?.path || '',
                success_message:!!outcome?.success_message,
                duplicate_message:!!outcome?.duplicate_message,
                error_message:!!outcome?.error_message,
                visible_alerts:outcome?.visible_alerts || 0
              },
              identity_source:'CONAPE_CEDULA_LOOKUP',
              identity_fields_modified:false,
              success_signal:successSignal,
              write_performed:true,
              write_count:1,
              pii_emitted:false,
              cookies_emitted:false,
              hidden_values_emitted:false
            }, null, 2));
            if (!successSignal) throw new E4Error('CREATE_NOT_CONFIRMED', 'Se ejecutó una creación, pero CONAPE no entregó una señal de éxito suficiente. NO reintente: primero verifique si la cédula ya quedó registrada.');
            return;
          } finally {
            networkClient.close();
          }
        } finally {
          rl.close();
        }
      }
    }

    if (!prospect && Date.now() - lastClickAt >= NAV_RETRY_MS) {
      if (clickAttempts >= MAX_NAV_ATTEMPTS) throw new E4Error('RECRUIT_NAVIGATION_NOT_OBSERVED', 'No se observó PROSPECTO. No hubo escritura.');
      for (const target of targets) {
        try {
          const result = await inspectOne(target, FIND_RECRUIT, true);
          if (result?.found) {
            clickAttempts += 1;
            lastClickAt = Date.now();
            console.log(clickAttempts === 1
              ? 'C3.4 E4: Reclutar detectado; abriendo PROSPECTO. Aún no hay escritura.'
              : `C3.4 E4: reintento seguro de navegación ${clickAttempts}/${MAX_NAV_ATTEMPTS}.`);
            break;
          }
        } catch {}
      }
    }
    await sleep(POLL_MS);
  }
  throw new E4Error('E4_TIMEOUT', 'La prueba controlada agotó el tiempo sin completar el flujo.');
}

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--profile' && argv[i + 1]) { out.profileDir = path.resolve(argv[++i]); continue; }
    if (argv[i] === '--timeout-ms' && argv[i + 1]) { out.timeoutMs = Number(argv[++i]); continue; }
    throw new E4Error('CLI_ARGUMENT_INVALID', `Argumento inválido: ${argv[i]}`);
  }
  return out;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    await run(args(process.argv.slice(2)));
  } catch (error) {
    console.error(`\nC3.4 E4: BLOCK / ${error?.reason || 'UNEXPECTED_ERROR'}`);
    console.error(error?.message || String(error));
    process.exitCode = 1;
  }
}

export { safeBodyKeys, safeRequestToken, cedulaLookupExpression, contactFillExpression };
