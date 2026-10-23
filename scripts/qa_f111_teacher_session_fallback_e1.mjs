// F111 Mis grupos: contrato de fallback de sesión, sin servidor ni datos personales.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const s=fs.readFileSync(new URL('../src/teacher_views.jsx',import.meta.url),'utf8');
const a=s.indexOf('function tvSessionGroups('),b=s.indexOf('function tvNowMinutes()',a);
assert.ok(a>0&&b>a,'definición de grupos de sesión estable');
const vmContext={
 tvGroupCode(g){return String(typeof g==='string'?g:g?.code||g?.cod_grupo||'').trim()},
};
vm.createContext(vmContext);
vm.runInContext(s.slice(a,b),vmContext);
const group='B1-KJ18-C3-0826';
assert.equal(vmContext.tvSessionGroups({nombre:'DOCENTE QA'},group).length,1);
assert.equal(vmContext.tvSessionGroups({nombre:'DOCENTE QA'},group)[0].code,group);
assert.equal(vmContext.tvSessionGroups({grupo:group},'')[0].code,group);
assert.equal(vmContext.tvSessionGroups({grupos:[group,group]},group).length,1,'deduplicado');
assert.equal(vmContext.tvSessionGroups({},'').length,0,'no inventa grupo');
assert.ok(s.includes('React.useState(() => tvSessionGroups(usuario, grupoActivo))'),'grupos visibles desde la sesión antes del fetch');
assert.ok(s.includes("gruposMeta.length ? 12000 : 30000"),'timeout de lista acotado cuando hay grupo en sesión');
assert.ok(s.includes("if (!gruposMeta.length) setErrorGroups("),'fallo de lista no elimina grupo vinculado');
assert.ok(s.includes("loading:(loadingGroups && !gruposMeta.length) || loadingPanel"),'listado lento no bloquea panel autenticado');
assert.ok(s.includes("useTeacherSession(activeSession?.COD_GRUPO || activeSession?.cod_grupo || '')"),'la sesión activa permite recuperar el código del grupo');
assert.ok(s.includes('setGruposMeta(prev => prev.length ? prev : tvSessionGroups(usuario, grupoActivo))'),'llegada tardía de sesión no deja lista vacía');
assert.ok(s.includes("setGruposMeta(grupos);"),'respuesta real del servidor reemplaza el fallback');
assert.ok(s.includes("const r = await postTeacher('getDocenteGrupoPanelF80'")||s.includes("postTeacher('getDocenteGrupoPanelF80'"),'el panel sigue exigiendo validación del backend');
assert.ok(s.includes("if (!r?.ok) throw new Error("),'panel rechaza respuesta no autorizada');
assert.ok(s.includes('const [reloadGroupsTick, setReloadGroupsTick] = React.useState(0);'),'reintento real de lista');
console.log('PASS F111 Mis grupos E1: sesión exhibe grupo, sin listado inventado, sin eludir servidor, reintento real');
