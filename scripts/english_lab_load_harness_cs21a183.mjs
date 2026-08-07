#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {performance} from 'node:perf_hooks';

const args = process.argv.slice(2);
const has = flag => args.includes(flag);
const valueOf = (name, fallback='') => {
  const prefix = `--${name}=`;
  const found = args.find(arg => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
};

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a,b)=>a-b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function summarize(samples) {
  const latency = samples.map(item => item.ms).filter(Number.isFinite);
  const requests = samples.length;
  const networkErrors = samples.filter(item => item.kind === 'network').length;
  const httpErrors = samples.filter(item => item.kind === 'http').length;
  const apiErrors = samples.filter(item => item.kind === 'api').length;
  const ok = samples.filter(item => item.kind === 'ok').length;
  const errors = requests - ok;
  return {
    requests,
    ok,
    errors,
    error_rate:requests ? errors / requests : 0,
    network_errors:networkErrors,
    http_errors:httpErrors,
    api_errors:apiErrors,
    latency_ms:{
      min:latency.length ? Math.round(Math.min(...latency)) : 0,
      p50:Math.round(percentile(latency,50)),
      p95:Math.round(percentile(latency,95)),
      p99:Math.round(percentile(latency,99)),
      max:latency.length ? Math.round(Math.max(...latency)) : 0,
    },
  };
}

function productionAppsScriptUrl() {
  const runtime = fs.readFileSync('src/runtime_config.js','utf8');
  const match = runtime.match(/productionAppsScriptUrl\s*=\s*'([^']+)'/);
  if (!match) throw new Error('No se pudo determinar la URL productiva desde runtime_config.js.');
  return match[1];
}

function normalizeUrl(raw) {
  const parsed = new URL(String(raw || '').trim());
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'script.google.com') {
    throw new Error('LOAD_QA_URL_INVALID: se requiere https://script.google.com/...');
  }
  if (!/^\/macros\/s\/[^/]+\/(?:exec|dev)\/?$/.test(parsed.pathname)) {
    throw new Error('LOAD_QA_URL_INVALID: la ruta debe terminar en /exec o /dev.');
  }
  parsed.search = '';
  parsed.hash = '';
  return parsed.href.replace(/\/$/,'');
}

function assertQaUrl(raw) {
  const normalized = normalizeUrl(raw);
  if (normalized === productionAppsScriptUrl()) throw new Error('LOAD_QA_REFUSED_PRODUCTION_URL');
  return normalized;
}

function normalizeStudent(item, index) {
  return {
    label:String(item && item.label || `student-${index+1}`),
    token:String(item && (item.token || item.session_token || item.student_token) || '').trim(),
    codEstudiante:String(item && (item.cod_estudiante || item.student_code) || '').trim(),
    playerId:String(item && (item.player_id || item.cod_estudiante || item.student_code) || '').trim(),
  };
}

function loadConfig(configPath) {
  const raw = JSON.parse(fs.readFileSync(configPath,'utf8'));
  const baseUrl = assertQaUrl(raw.base_url || process.env.QA_BASE_URL || '');
  const roomCode = String(raw.room_code || process.env.QA_ROOM_CODE || '').trim().toUpperCase();
  const roomId = String(raw.room_id || raw.room_code || process.env.QA_ROOM_ID || roomCode).trim();
  if (!/^LAB-[A-Z0-9-]+$/.test(roomCode)) throw new Error('QA room_code inválido.');
  if (!roomId) throw new Error('QA room_id requerido para polling docente.');
  const students = Array.isArray(raw.students) ? raw.students.map(normalizeStudent).filter(item=>item.token) : [];
  if (!students.length) throw new Error('El archivo QA debe contener al menos un token de sesión estudiantil.');
  const teacher = raw.teacher && typeof raw.teacher === 'object' ? raw.teacher : {};
  const teacherToken = String(teacher.token || teacher.session_token || raw.teacher_token || '').trim();
  return {baseUrl,roomCode,roomId,teacherToken,students};
}

function studentPayload(client, config) {
  const fn = 'englishLabMemoryMatchGetPlayerState';
  return {
    fn,
    token:client.student.token,
    room_code:config.roomCode,
    player_id:client.student.playerId,
    cod_estudiante:client.student.codEstudiante,
  };
}

function teacherPayload(config) {
  const fn = 'englishLabMemoryMatchGetRoomControl';
  return {fn,token:config.teacherToken,room_id:config.roomId};
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function postJson(baseUrl, fn, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), timeoutMs);
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}?fn=${encodeURIComponent(fn)}`, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify(body || {}),
      signal:controller.signal,
    });
    const ms = performance.now() - started;
    if (!response.ok) return {kind:'http',ms,status:response.status};
    let payload;
    try { payload = await response.json(); }
    catch (_) { return {kind:'api',ms,error:'invalid_json'}; }
    if (!payload || payload.ok !== true) return {kind:'api',ms,error:String(payload && (payload.error || payload.message) || 'api_not_ok')};
    return {kind:'ok',ms};
  } catch (error) {
    return {kind:'network',ms:performance.now()-started,error:String(error && error.message || error)};
  } finally {
    clearTimeout(timer);
  }
}

function clientPool(config, count, reuse) {
  if (!reuse && config.students.length < count) {
    throw new Error(`LOAD_QA_NEEDS_${count}_UNIQUE_STUDENTS: disponibles=${config.students.length}. Use --reuse-credentials solo para medir transporte/polling, no concurrencia de participantes únicos.`);
  }
  return Array.from({length:count},(_,index)=>({
    logical_id:`C${String(index+1).padStart(2,'0')}`,
    student:config.students[index % config.students.length],
  }));
}

async function runClient(client, config, durationMs, intervalMs, timeoutMs) {
  const samples = [];
  const deadline = performance.now() + durationMs;
  while (performance.now() < deadline) {
    const fn = 'englishLabMemoryMatchGetPlayerState';
    samples.push(await postJson(config.baseUrl,fn,studentPayload(client,config),timeoutMs));
    const remaining = deadline - performance.now();
    if (remaining <= 0) break;
    await sleep(Math.min(intervalMs, remaining));
  }
  return samples;
}

async function runTeacher(config, durationMs, intervalMs, timeoutMs) {
  if (!config.teacherToken) return [];
  const samples = [];
  const deadline = performance.now() + durationMs;
  while (performance.now() < deadline) {
    const fn = 'englishLabMemoryMatchGetRoomControl';
    samples.push(await postJson(config.baseUrl,fn,teacherPayload(config),timeoutMs));
    const remaining = deadline - performance.now();
    if (remaining <= 0) break;
    await sleep(Math.min(intervalMs, remaining));
  }
  return samples;
}

async function runPhase(config, clients, options) {
  const startedAt = new Date().toISOString();
  const clientTasks = clients.map(client => runClient(client,config,options.durationMs,options.intervalMs,options.timeoutMs));
  const teacherTask = runTeacher(config,options.durationMs,options.intervalMs,options.timeoutMs);
  const [clientResults, teacherSamples] = await Promise.all([Promise.all(clientTasks),teacherTask]);
  const studentSamples = clientResults.flat();
  const all = studentSamples.concat(teacherSamples);
  const stats = summarize(all);
  const verdict = stats.error_rate <= options.maxErrorRate && stats.latency_ms.p95 <= options.maxP95Ms ? 'PASS' : 'FAIL';
  return {
    phase_clients:clients.length,
    started_at:startedAt,
    finished_at:new Date().toISOString(),
    credential_mode:options.reuse ? 'REUSED_TRANSPORT_ONLY' : 'UNIQUE_STUDENTS',
    teacher_polling:teacherSamples.length > 0,
    duration_seconds:options.durationMs/1000,
    interval_ms:options.intervalMs,
    timeout_ms:options.timeoutMs,
    thresholds:{max_error_rate:options.maxErrorRate,max_p95_ms:options.maxP95Ms},
    stats,
    verdict,
  };
}

async function selfTest() {
  assert.deepEqual(summarize([
    {kind:'ok',ms:100},{kind:'ok',ms:200},{kind:'network',ms:300},{kind:'api',ms:400},
  ]), {
    requests:4,ok:2,errors:2,error_rate:0.5,network_errors:1,http_errors:0,api_errors:1,
    latency_ms:{min:100,p50:200,p95:400,p99:400,max:400},
  });
  const qa = assertQaUrl('https://script.google.com/macros/s/QA_TEST_CS21A183/exec?x=1');
  assert.equal(qa,'https://script.google.com/macros/s/QA_TEST_CS21A183/exec');
  assert.throws(()=>assertQaUrl(productionAppsScriptUrl()),/LOAD_QA_REFUSED_PRODUCTION_URL/);
  assert.throws(()=>assertQaUrl('https://example.com/api'),/LOAD_QA_URL_INVALID/);

  const config = {roomCode:'LAB-TEST',roomId:'ELIVE-TEST',teacherToken:'TEACHER-TOKEN'};
  const client = {student:{token:'STUDENT-TOKEN',playerId:'QA-STU-005',codEstudiante:'QA-STU-005'}};
  assert.deepEqual(studentPayload(client,config),{
    fn:'englishLabMemoryMatchGetPlayerState',
    token:'STUDENT-TOKEN',
    room_code:'LAB-TEST',
    player_id:'QA-STU-005',
    cod_estudiante:'QA-STU-005',
  });
  assert.deepEqual(teacherPayload(config),{
    fn:'englishLabMemoryMatchGetRoomControl',
    token:'TEACHER-TOKEN',
    room_id:'ELIVE-TEST',
  });

  console.log(JSON.stringify({
    ok:true,
    contract:'CS21A183_ENGLISH_LAB_LOAD_HARNESS',
    production_fail_closed:true,
    dry_run_default:true,
    phases:[2,5,10,25],
    unique_credentials_default:true,
    transport_reuse_requires_flag:true,
    exact_frontend_session_contract:true,
    student_payload:'fn+token+room_code+player_id+cod_estudiante',
    teacher_payload:'fn+token+room_id',
    write_endpoints:false,
  },null,2));
}

if (has('--self-test')) {
  await selfTest();
  process.exit(0);
}

const phases = valueOf('phases','2,5,10,25').split(',').map(Number).filter(value=>[2,5,10,25].includes(value));
if (!phases.length) throw new Error('Use --phases=2,5,10,25 o un subconjunto.');
const durationMs = Math.max(5000, Number(valueOf('duration-seconds','15')) * 1000);
const intervalMs = Math.max(500, Number(valueOf('interval-ms','1000')));
const timeoutMs = Math.max(1000, Number(valueOf('timeout-ms','8000')));
const maxErrorRate = Math.max(0, Number(valueOf('max-error-rate','0.02')));
const maxP95Ms = Math.max(250, Number(valueOf('max-p95-ms','3000')));
const reuse = has('--reuse-credentials');
const execute = has('--execute');
const configPath = path.resolve(valueOf('config','qa-load-secrets.json'));

if (!execute) {
  console.log(JSON.stringify({
    verdict:'DRY_RUN',
    message:'No se envió tráfico. Agregue --execute únicamente durante QA autenticada.',
    phases,
    duration_seconds:durationMs/1000,
    interval_ms:intervalMs,
    timeout_ms:timeoutMs,
    max_error_rate:maxErrorRate,
    max_p95_ms:maxP95Ms,
    credential_mode:reuse?'REUSED_TRANSPORT_ONLY':'UNIQUE_STUDENTS',
    config_path:configPath,
  },null,2));
  process.exit(0);
}

if (!fs.existsSync(configPath)) throw new Error(`Falta archivo local de credenciales QA: ${configPath}`);
const config = loadConfig(configPath);
const options = {durationMs,intervalMs,timeoutMs,maxErrorRate,maxP95Ms,reuse};
const results = [];
for (const phase of phases) {
  const clients = clientPool(config,phase,reuse);
  console.error(`[QA LOAD] fase ${phase} iniciando...`);
  const result = await runPhase(config,clients,options);
  results.push(result);
  console.error(`[QA LOAD] fase ${phase}: ${result.verdict} p95=${result.stats.latency_ms.p95}ms error_rate=${(result.stats.error_rate*100).toFixed(2)}%`);
  if (result.verdict !== 'PASS') break;
  await sleep(1500);
}

const overall = results.length === phases.length && results.every(item=>item.verdict==='PASS') ? 'PASS' : 'FAIL';
const report = {
  verdict:overall,
  tool:'CS21A183_ENGLISH_LAB_LOAD_HARNESS',
  safety:'QA_ONLY_READ_ENDPOINTS',
  room_code:config.roomCode,
  phases_requested:phases,
  phases_completed:results.map(item=>item.phase_clients),
  results,
};
const outputDir = path.resolve('qa-output/cs21a183-load');
fs.mkdirSync(outputDir,{recursive:true});
const outputFile = path.join(outputDir,`load-${Date.now()}.json`);
fs.writeFileSync(outputFile,JSON.stringify(report,null,2)+'\n','utf8');
console.log(JSON.stringify({...report,output_file:outputFile},null,2));
process.exit(overall === 'PASS' ? 0 : 1);
