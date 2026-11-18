// F111 AUDIO-PRIVATE-01 · E1 del reproductor ORIGINAL sin Apps Script/Drive.
// Ejecuta el decoder real y verifica que HTML/JS solo usen blob local de un
// intento propio. No copia ni reproduce contenidos Cambridge.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const src=fs.readFileSync('src/examenes_modes.jsx','utf8');
const render=fs.readFileSync('src/examenes_render.jsx','utf8');
const app=fs.readFileSync('src/examenes_app.jsx','utf8');
const bundle=fs.readFileSync('src/examenes_bundle.jsx','utf8');
const begin=src.indexOf('function examWrittenPrivateAudioBlobUrl(');
const end=src.indexOf('// CALGRUPO_F27_20260617_STUDENTMODE_INTENTO_REAL_BACKEND',begin);
assert(begin>0&&end>begin,'decoder de producción localizable');
const decoder=src.slice(begin,end);
assert(bundle.includes(decoder),'decoder fuente y bundle idénticos');
assert(src.includes('blobUrl = examWrittenPrivateAudioBlobUrl(r,id,expected)'));
assert(bundle.includes('blobUrl = examWrittenPrivateAudioBlobUrl(r,id,expected)'));
assert(src.includes("stage !== 'taking'")&&src.includes("backend.onGetPrivateAudio(id)"));
assert(src.includes('URL.revokeObjectURL(blobUrl)'),'blob se revoca al salir');
assert(src.includes('if (cancelled) { URL.revokeObjectURL(blobUrl); blobUrl=\'\'; return; }'),
 'blob se revoca si la petición finalizó después de abandonar');
assert(src.includes("privateAudioUrl={!timeExpired && privateAudio.status==='ready' ? privateAudio.url : ''}"),
 'al expirar el tiempo no se muestra el player');
assert(app.includes("examPostLive('examGetStudentWrittenPrivateAudio', { attempt_id:id })"));
assert(app.includes('onGetPrivateAudio:getWrittenPrivateAudio,'));
assert(bundle.includes('onGetPrivateAudio:getWrittenPrivateAudio,'));
assert(render.includes('data-f111-private-written-audio="true"'));
assert(render.includes('src={privateAudioUrl}'));
assert(render.includes('El mismo audio original incluye esta sección'));
assert(bundle.includes('data-f111-private-written-audio="true"'));
assert(render.includes("const id = !bAudioNoCertificado && exam.videos"));
let created=[],bytesReceived=[],revoked=[];
const ctx={
 atob:s=>Buffer.from(s,'base64').toString('binary'),
 Blob:class {constructor(bytes,options){bytesReceived.push({parts:bytes,options});}},
 Uint8Array,
 URL:{createObjectURL:()=>{const id='blob:qa-written-'+(created.length+1);created.push(id);return id;},
      revokeObjectURL:id=>revoked.push(id)}
};
vm.createContext(ctx);
const fn=vm.runInContext(decoder+';examWrittenPrivateAudioBlobUrl',ctx);
const MP3=[73,68,51,...Array(1997).fill(2)];
const token='QA-ATT-001',examId='B1_WRITTEN_L18_TEST1_A';
const base={ok:true,attempt_id:token,exam_id:examId,mime:'audio/mpeg',
 source:'original_private_verified_sha256',bytes:MP3.length,
 audio_base64:Buffer.from(MP3).toString('base64')};
const ok=fn(base,token,examId);
assert.equal(ok,'blob:qa-written-1');
assert.equal(bytesReceived.length,1);
assert.equal(bytesReceived[0].options.type,'audio/mpeg');
assert.deepEqual(Array.from(bytesReceived[0].parts[0]),MP3);
function reject(changes,expectedAttempt=token,expectedExam=examId){
 const n=created.length;
 assert.throws(()=>fn({...base,...changes},expectedAttempt,expectedExam));
 assert.equal(created.length,n,'payload incorrecto jamás crea blob');
}
reject({attempt_id:'ANOTHER'});
reject({exam_id:'B1_WRITTEN_L18_TEST1_B'});
reject({mime:'text/html'});
reject({source:'public_youtube'});
reject({ok:false});
reject({bytes:0});
reject({bytes:4*1024*1024+1});
reject({bytes:MP3.length+1});
reject({audio_base64:''});
reject({audio_base64:Buffer.from([0,1,2,...MP3.slice(3)]).toString('base64')});
assert.equal(revoked.length,0,'no se revoca antes de abandonar el intento');
console.log('F111_WRITTEN_PRIVATE_AUDIO_UI_E1_PASS: decoder real, titular/examen, MIME y encabezado MP3, blob local, life-cycle cleanup, fuente=bundle, 10 denegaciones, 0 llamadas externas');
