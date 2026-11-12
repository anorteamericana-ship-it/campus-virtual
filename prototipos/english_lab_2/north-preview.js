/* Vista de Dirección: un solo CTA inicia el tráiler con sonido; después continúa el juego. */
(function(){
'use strict';
var play=document.getElementById('gp-play-story');
var modal=document.getElementById('gp-trailer');
var film=document.getElementById('gp-trailer-video');
var skip=document.getElementById('gp-trailer-skip');
var hero=document.getElementById('gp-hero-video');
var status=document.getElementById('gp-trailer-status');
var soundtrack=window.NBIntroAudio;
var started=false, finished=false, wantAudio=false;
function finish(){
 if(finished)return;finished=true;
 if(soundtrack)soundtrack.stop();
 try{film.pause()}catch(_){}
 window.location.assign('north-001.html?intro=skip');
}
function begin(){
 if(started)return;started=true;
 wantAudio=!!(soundtrack&&soundtrack.prime());
 modal.hidden=false;
 document.body.style.overflow='hidden';
 try{hero.pause()}catch(_){}
 film.src=window.innerWidth<700?'media/corner_cup_intro_480.mp4':'media/corner_cup_intro.mp4';
 film.currentTime=0;
 var p;try{p=film.play()}catch(_){finish();return}
 if(p&&p.catch)p.catch(function(){
   status.textContent='No se pudo reproducir el tráiler. Entrando a la historia…';
   finish();
 });
 skip.focus();
}
film.addEventListener('playing',function(){
 if(!finished&&wantAudio&&soundtrack)soundtrack.start({scene:'cafe',offset:film.currentTime});
});
film.addEventListener('ended',finish);
film.addEventListener('error',finish);
skip.addEventListener('click',finish);
play.addEventListener('click',begin);
document.addEventListener('keydown',function(e){if(!modal.hidden&&e.key==='Escape'){e.preventDefault();finish();}});
document.addEventListener('visibilitychange',function(){
 if(document.hidden&&started&&!finished){
  if(soundtrack)soundtrack.stop();
  try{film.pause()}catch(_){}
 }
});
window.addEventListener('pagehide',function(){if(soundtrack)soundtrack.stop();});
})();
