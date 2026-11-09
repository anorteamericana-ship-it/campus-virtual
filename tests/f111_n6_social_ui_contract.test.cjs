// N6: parse only the changed UI and assert the loader/route contract.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const babel=require(path.join(root,'vendor','babel.js'));
const social=fs.readFileSync(path.join(root,'src','social_skill_docente_f111.jsx'),'utf8');
assert.equal(typeof babel.transform,'function');
const compiled=babel.transform(social,{presets:['react'],filename:'social_skill_docente_f111.jsx'}).code;
new vm.Script(compiled,{filename:'social_skill_docente_f111.compiled.js'});
const view=fs.readFileSync(path.join(root,'src','vista_docente.jsx'),'utf8');
const app=fs.readFileSync(path.join(root,'src','app.jsx'),'utf8');
assert.ok(view.includes("React.createElement(window.SocialSkillDocenteF111, {calendario, pendientes})"));
assert.equal((app.match(/social_skill_docente_f111\.jsx\?v=/g)||[]).length,7);
assert.ok(social.includes('socialSkillConsultarF111'));
assert.ok(social.includes('socialSkillGuardarBorradorF111'));
assert.ok(social.includes('socialSkillPublicarF111'));
assert.ok(social.includes('borrador_event_id'));
assert.ok(social.includes('dirty||!registro.esquema_preparado'));
console.log('F111_N6_SOCIAL_UI_PARSE_ROUTE_PASS checks=8; historical_UI_QA_not_run');
