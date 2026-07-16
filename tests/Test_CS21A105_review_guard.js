'use strict';
const GUARD=18000;
const step=v=>Math.max(0,Math.min(4,Math.floor(Number(v)||0)));
function mergeSnapshot(rows,local,now){const next={};for(const row of rows){if(row.closed){next[row.id]=0;delete local[row.id];continue}const saved=local[row.id],fresh=saved&&now-saved.at<GUARD;next[row.id]=fresh?step(saved.step):step(row.server)}return next}
function mergeRemote(current,row,remote,local,now){if(remote.closed||row.closed){delete local[row.id];return 0}const saved=local[row.id],guarded=saved&&now-saved.at<GUARD;if(guarded&&step(remote.step)!==step(saved.step))return current;return step(remote.step)}
const now=Date.now(),local={MOV:{step:3,at:now,confirmed:true}};
let state=mergeSnapshot([{id:'MOV',server:0,closed:false}],local,now+2000);if(state.MOV!==3)throw Error('La fotografía vieja borró el valor local');
state.MOV=mergeRemote(state.MOV,{id:'MOV',closed:false},{step:0,closed:false},local,now+4000);if(state.MOV!==3)throw Error('El delta viejo borró el valor local');
state.MOV=mergeRemote(state.MOV,{id:'MOV',closed:false},{step:3,closed:false},local,now+5000);if(state.MOV!==3)throw Error('No aceptó la confirmación del servidor');
state.MOV=mergeRemote(state.MOV,{id:'MOV',closed:true},{step:0,closed:true},local,now+6000);if(state.MOV!==0)throw Error('No reinició al cerrar el ciclo');
console.log(JSON.stringify({ok:true,tests:4,guard_ms:GUARD}));
