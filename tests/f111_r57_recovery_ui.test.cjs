// F111 R57: only new superadmin recovery controls, synthetic JSX validation.
const fs=require('node:fs'),path=require('node:path'),
 assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'src','solicitudes_unificadas.jsx'),'utf8');
const babel=require(path.join(root,'vendor','babel.js'));
new vm.Script(babel.transform(src,{presets:['react'],filename:'solicitudes_unificadas.jsx'}).code);
const from=src.indexOf('function ReposicionesR57RecuperacionAdmin(');
const to=src.indexOf('function ReposicionesR57Admin(',from);
assert.ok(from>0&&to>from,'recuperacion UI aislada');
const ui=src.slice(from,to);
let count=0;
function check(condition,label){assert.ok(condition,label);count++;}
check(!ui.includes('React.useEffect'), 'nunca recuperar desde montaje');
check(ui.includes("f92Post('reposDiagnosticarRecuperacionEscritoR57',{reposicion_id:id})"),'diagnostico con ID exacto');
check(ui.includes("f92Post('reposRecuperarEscritoR57',{reposicion_id:id,confirmar:frase})"),'recuperacion con ID y confirmacion');
check(ui.includes("frase='RECUPERAR_ESCRITO_R57:'+id"),'frase ligada al ciclo');
check(ui.includes("disabled={busy||confirmar!==frase}"),'sin confirmacion no se habilita');
check(ui.includes("onClick={recuperar}"),'accion deliberada');
check(ui.includes("onClick={diagnosticar}"),'diagnostico por boton');
check(ui.includes("if(check.siguiente_paso!=='COMPLETA')"),'readback requerido');
check(ui.includes("setDiag(null);"),'error invalida diagnostico anterior');
check(ui.includes('data-r57-recuperacion-escrito="true"'),'marca UI');
check(src.includes("isSuper&&r.TIPO_EXAMEN==='ESCRITO'&&"),'solo superadmin y escrito');
check(src.includes('<ReposicionesR57RecuperacionAdmin reposicionId={r.REPOSICION_ID}/>'),'ciclo exacto');
check(!ui.includes('setInterval(')&&!ui.includes('setTimeout('),'sin automatizacion');
console.log('F111_R57_RECOVERY_UI_PASS checks='+count+' JSX_PARSE_PASS real_writes=0');
