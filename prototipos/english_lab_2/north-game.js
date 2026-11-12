/* Misma mecánica de juego: intro visual simplificada y persistencia aislada para revisión. */
(function(){
'use strict';
var P=window.NORTH_PAGE||{};
var root=document.getElementById('lab2-root');
var overlay=document.getElementById('gp-game-intro');
var film=document.getElementById('gp-game-video');
var skip=document.getElementById('gp-game-skip');
var audio=document.getElementById('gp-game-sound');
var nameCard=document.getElementById('gp-name-stage');
var nameInput=document.getElementById('gp-name');
var begin=document.getElementById('gp-begin');
var status=document.getElementById('gp-game-status');
var score=window.NBIntroAudio;
var finished=false,ready=false;
if(!window.React||!window.ReactDOM||!window.LAB2||!LAB2.mount||!window.NB){
 overlay.hidden=true;document.body.classList.remove('nb-locked');
 root.innerHTML='<p class="l2-boot">La aventura no cargó. Actualizá la página y volvé a intentar.</p>';return;
}
var initial=LAB2.store.load(P.key).player;
if(!initial&&P.prevKey)initial=LAB2.store.load(P.prevKey).player;
nameInput.value=initial&&initial.name||'';
function sync(){begin.disabled=!LAB2.cleanName(nameInput.value)}
nameInput.addEventListener('input',sync);sync();
function reveal(){
 if(finished)return;finished=true;
 try{film.pause()}catch(_){}
 if(score)score.stop();
 overlay.classList.add('is-name');
 nameCard.hidden=false;
 nameInput.focus();
}
function startVideo(){
 if(ready||finished)return;ready=true;
 var reduce=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 var saveData=navigator.connection&&navigator.connection.saveData;
 if(new URLSearchParams(location.search).get('intro')==='skip'||reduce||saveData){reveal();return}
 film.src=window.innerWidth<700?P.small:P.video;
 var p;try{p=film.play()}catch(_){reveal();return}
 if(p&&p.catch)p.catch(function(){status.textContent='No se pudo reproducir el video.';reveal()});
}
skip.addEventListener('click',reveal);
film.addEventListener('ended',reveal);
film.addEventListener('error',reveal);
film.addEventListener('timeupdate',function(){
 if(!finished&&Number.isFinite(film.duration)&&film.duration>0&&film.currentTime>=film.duration-.2)reveal();
});
audio.addEventListener('click',function(){
 if(!score||!score.prime())return;
 score.start({scene:P.scene,offset:film.currentTime});
 audio.setAttribute('aria-label','Sonido activado');
 audio.textContent='♫';
});
document.addEventListener('keydown',function(e){
 if(e.key==='Escape'&&!overlay.hidden&&!finished)reveal();
});
document.addEventListener('visibilitychange',function(){
 if(document.hidden&&!finished){reveal();}
});
document.getElementById('gp-name-form').addEventListener('submit',function(e){
 e.preventDefault();
 var name=LAB2.cleanName(nameInput.value);
 if(!name)return;
 if(score)score.stop();
 NB.audio.start();
 var current=LAB2.store.load(P.key);
 LAB2.store.save(P.key,Object.assign({},current,{player:{name:name}}));
 overlay.hidden=true;document.body.classList.remove('nb-locked');
 document.getElementById('nb-sound').hidden=false;
 if(NB.audio.renderControls)NB.audio.renderControls();
 LAB2.mount(root,{preview:false,usuario:{codigo:P.code},startEpisode:LAB2_CONTENT.weeklyId,autoPlay:true});
 window.scrollTo({top:0,behavior:'instant'});
});
startVideo();
})();
