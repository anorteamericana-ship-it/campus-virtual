// F111: verifica SOLO la visualización compacta con datos ficticios.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src','admin_students.jsx'),'utf8');
const from=source.indexOf('function agIndNivelLiquidadoParaConsulta(');
const to=source.indexOf('// HOTFIX F111: tarjeta comercial',from);
assert.ok(from>0 && to>from);
const sandbox={};vm.createContext(sandbox);
vm.runInContext(source.slice(from,to)+'\nthis.isPaid=agIndNivelLiquidadoParaConsulta;',sandbox);
const f=sandbox.isPaid;
assert.equal(f({disponible:true,saldo:0},'AL DÍA','APR'),true);
assert.equal(f({disponible:true,saldo:0},'AL DÍA','CA'),true);
assert.equal(f({disponible:true,saldo:0},'POR VERIFICAR','APR'),true);
assert.equal(f({disponible:true,saldo:0},'AL DÍA','PE'),true);
assert.equal(f({disponible:true,saldo:74800},'AL DÍA','CA'),false);
assert.equal(f({disponible:true,saldo:273600},'POR VERIFICAR','PE'),false);
assert.equal(f({disponible:true,saldo:null},'AL DÍA','APR'),false);
assert.equal(f({disponible:false,saldo:0},'AL DÍA','APR'),false);
const quote=source.slice(source.indexOf('function AgIndCotizacionClienteHotfixF111('),
 source.indexOf('function AdminEstudianteResumenIndividual('));
const component=source.slice(source.indexOf('function AdminEstudianteResumenIndividual('),
 source.indexOf('function AgIndMetric(',source.indexOf('function AdminEstudianteResumenIndividual(')));
assert.ok(component.includes('cotizacion.disponible&&!nivelLiquidado&&<AgIndCotizacionClienteHotfixF111'));
assert.ok(component.includes('!vistaCompartir&&finIntentos.length>0'),
  'Comprobantes aplicados visibles aun cuando el nivel este liquidado');
assert.ok(component.includes('!vistaCompartir&&pagosConvalidados'),
  'Detalle de pagos convalidados restaurado tambien al estar al dia');
assert.ok(component.includes('vistaCompartir?gridColsCompartir:gridCols'));
assert.ok(component.includes('setNivelAbierto(nivelSugeridoCaptura)'));
assert.ok(component.includes('↪ desde {agIndGrupoCorto(trasladoDesde)}'));
assert.ok(component.includes('periodoLargo&&'));
assert.ok(!component.includes("fontFamily:'var(--f-mono,monospace)'}}>{grupo}"));
assert.ok(component.includes('!vistaCompartir&&<><span>Nota</span><span>Asistencia</span></>'));
const banner=component.slice(component.indexOf('return <div style={{padding:'),
 component.indexOf('<div style={{overflowX:',component.indexOf('return <div style={{padding:')));
assert.ok(!banner.includes('{cedula}'));
assert.ok(!banner.includes('{telefono}'));
assert.ok(!banner.includes('{correo}'));
assert.ok(banner.includes('{nombre}'));
assert.ok(banner.includes('{grupoActual}'));
assert.ok(quote.includes("fontSize:'clamp(22px,2.4vw,29px)'"));
const babel=require(path.join(root,'vendor','babel.js'));
new vm.Script(babel.transform(source,{presets:['react'],filename:'admin_students.jsx'}).code);
const app=fs.readFileSync(path.join(root,'src','app.jsx'),'utf8');
const html=fs.readFileSync(path.join(root,'campus.html'),'utf8');
assert.equal((app.match(/compact=F111COMPACT1107/g)||[]).length,3);
assert.equal((html.match(/compact=F111COMPACT1107/g)||[]).length,1);
assert.equal((app.match(/aplicados=F111APLICADOS1107/g)||[]).length,3);
assert.equal((html.match(/aplicados=F111APLICADOS1107/g)||[]).length,1);
console.log('F111_HOTFIX_CONSULTA_COMPACTA_PASS · 22 controles focalizados; 0 escrituras');
