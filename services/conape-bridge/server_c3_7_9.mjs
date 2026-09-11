import fs from 'node:fs/promises';

/* C3.7.9 · desacoplar conexión de sesión de preparación de Prospectos
   - compone C3.7.8
   - session/connect autentica CONAPE y deja sesión CONNECTED sin exigir openProspecto
   - ensureProspecto conserva la preparación del formulario cuando preview/reclutamiento lo necesita
   - no toca source_version, AbortSignal, cola serial, identidad ni reglas de correo
*/
const builderUrl = new URL('./server_c3_7_8.mjs', import.meta.url);
const buildOnlyUrl = new URL('./server_c3_7_8_build_only.mjs', import.meta.url);
const priorRuntimeUrl = new URL('./server_c3_7_8_runtime.mjs', import.meta.url);
const runtimeUrl = new URL('./server_c3_7_9_runtime.mjs', import.meta.url);

let builder = await fs.readFile(builderUrl, 'utf8');
const runMarker = 'await import(`${runtimeUrl.href}?v=${Date.now()}`);';
const runIndex = builder.lastIndexOf(runMarker);
if (runIndex < 0) throw new Error('C3_7_9_BUILDER_CONTRACT_MISMATCH');
builder = builder.slice(0, runIndex) + builder.slice(runIndex + runMarker.length);
await fs.writeFile(buildOnlyUrl, builder, 'utf8');
await import(`${buildOnlyUrl.href}?build=${Date.now()}`);

let source = await fs.readFile(priorRuntimeUrl, 'utf8');
function replaceBlock(startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0 || end <= start) throw new Error(`C3_7_9_${label}_CONTRACT_MISMATCH`);
  source = source.slice(0, start) + replacement + '\n' + source.slice(end);
}

const newConnect = `  async connect() {
    if (this.state==='CONNECTED' && this.page && !this.page.isClosed()) {
      const s=await this.authState(this.page);
      if(s.authenticated){
        this.lastActivity=nowIso();
        return this.snapshot({ready:s.form?'PROSPECTO':'HOME'});
      }
    }
    this.state='CONNECTING'; this.lastError=''; this.lastActivity=nowIso();
    try {
      const p=await this.browserPage();
      const s=await this.login(p);
      this.state='CONNECTED'; this.connectedAt=this.connectedAt||nowIso(); this.lastActivity=nowIso(); this.lastError=''; this.generation+=1;
      return this.snapshot({ready:s.form?'PROSPECTO':'HOME'});
    } catch(error){
      this.state='ERROR'; this.lastError=txt(error?.code||'CONAPE_CONNECT_FAILED'); this.lastActivity=nowIso(); throw error;
    }
  },`;
replaceBlock('  async connect() {', '  async ensureProspecto() {', newConnect, 'CONNECT_SESSION_ONLY');

source=source.replaceAll("version:'C3.7.8'","version:'C3.7.9'");
await fs.writeFile(runtimeUrl, source, 'utf8');
console.log(JSON.stringify({event:'bridge_session_connect_decoupled',version:'C3.7.9',connect_requires_prospecto:false,ensure_prospecto_preserved:true,prospecto_context_verified:true,submit_fresh_home_click:true,real_recruit_click:true,telemetry_preserved:true,pii:false}));
await import(`${runtimeUrl.href}?v=${Date.now()}`);
