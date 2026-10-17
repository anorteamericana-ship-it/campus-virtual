import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html=readFileSync(new URL('../modulos/examen_oral.html',import.meta.url),'utf8');
const scripts=[...html.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.ok(scripts.length>=1,'oral module includes JS');
for(const code of scripts){new Function(code);}
assert.ok(html.includes('let QB={};'),'no published bundled Cambridge bank');
assert.ok(!html.includes('const QB={'),'remove static Intro test bank');
assert.ok(html.includes("api('oralGetBancoPreguntasDocente'"),'fetch authenticated teacher bank');
assert.ok(html.includes('QB=bancoRes.banco'),'apply bank from backend');
assert.ok(html.includes('No fallback al banco de Intro'),'fail closed on missing bank');
assert.ok(html.includes('escF90(data.title)'),'escape question title');
assert.ok(html.includes('escF90(q)'),'escape question HTML');
assert.ok(html.includes('api(\'oralGetPanelDocente\''),'existing teacher panel stays');
console.log('PASS EX01 client E1: syntax, private API, no public bank, fail-closed, HTML escaping');
