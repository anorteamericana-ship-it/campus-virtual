"""Candidato independiente. NO sustituye aventura-001/002 ni el progreso del piloto publicado."""
from pathlib import Path
import json
p=Path(__file__).resolve().parent
src=(p/'nb_cine.js').read_text(encoding='utf-8')
for old,new in [
 ('Port Hazel','Ciudad Guaria'),
 ('The Corner Cup','Café La Esquina'),
 ('Harbor Gifts','Detalles de la Plaza'),
 ("'#be1e2d'","'#DA291C'"),
 ("'#1d2d6b'","'#002F6C'")
]:
 src=src.replace(old,new)
anchor="  document.addEventListener('click', function (e) {\n    var b = e.target.closest && e.target.closest('#nb-sound button');"
if anchor not in src:raise RuntimeError('sound control anchor missing')
src=src.replace(anchor,"  NB.audio.renderControls = renderControls;\n"+anchor)
(p/'guaria_cine.js').write_text(src,encoding='utf-8')
for n in (1,2):
    is2=n==2
    title='Un recuerdo de Ciudad Guaria' if is2 else 'Mi primera entrevista en inglés'
    place='Detalles de la Plaza' if is2 else 'Café La Esquina'
    poster='guaria_gifts_poster.jpg' if is2 else 'guaria_cafe_poster.jpg'
    media='guaria_gifts_intro' if is2 else 'guaria_cafe_intro'
    tag='002' if is2 else '001'
    key='GP002REVIEW' if is2 else 'GP001REVIEW'
    code='GP002_REVIEW' if is2 else 'GP001_REVIEW'
    intro=json.dumps(dict(video='media/'+media+'.mp4',small='media/'+media+'_480.mp4',key=key,code=code,
         title=title,episode=tag,prevKey='GP001REVIEW' if is2 else '',
         scene='gifts' if is2 else 'cafe'),ensure_ascii=False)
    cont='aventura_002_content.js' if is2 else 'reto_001_content.js"></script>\n<script src="aventura_001_content.js'
    config=( """(function(){
var drink='coffee';
try{drink=(JSON.parse(localStorage.getItem('nb_flags_gpr001'))||{}).drink||'coffee'}catch(_){}
window.NB_CONFIG={id:'gpr002',flags:{gift:'postcard'},fixed:{drink:drink},lastScene:'ADV002-S3',souvenir:'postcard',next:'tu próximo capítulo en Ciudad Guaria'};
})();""" if is2 else
"""window.NB_CONFIG={id:'gpr001',flags:{drink:'coffee'},lastScene:'ADV001-S3',souvenir:'cup',next:'comprar un recuerdo en Detalles de la Plaza',nextHref:'guaria-002.html'};""")
    html='''<!doctype html>
<html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#002F6C">
<link rel="icon" href="../../assets/academy_a.svg" type="image/svg+xml">
<title>Northbound · __TITLE__</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link href="lab2.css" rel="stylesheet"><link href="nb_cine.css" rel="stylesheet"><link href="guaria-game.css" rel="stylesheet">
</head>
<body class="l2-standalone nb-page nb-locked gp-game-page">
<div id="gp-game-intro" class="gp-game-intro">
  <video id="gp-game-video" muted playsinline preload="none" poster="media/__POSTER__" aria-label="Introducción animada de Ciudad Guaria y __PLACE__"></video>
  <header class="gp-game-overlay-brand"><img src="../../assets/academy_a.svg" alt="" width="43" height="35"><span>ACADEMIA NORTEAMERICANA <b>NORTHBOUND</b></span></header>
  <button type="button" id="gp-game-sound" class="gp-game-sound" aria-label="Activar audio del tráiler" title="Activar sonido">♪</button>
  <button type="button" id="gp-game-skip" class="gp-game-skip">Saltar tráiler <span aria-hidden="true">→</span></button>
  <section class="gp-name-stage" id="gp-name-stage" hidden>
    <span class="gp-game-eyebrow">CIUDAD GUARIA · AVENTURA __TAG__</span>
    <h1>__TITLE__</h1>
    <p>__NAME_DESC__</p>
    <form id="gp-name-form">
      <label for="gp-name">¿Cómo te llamás?</label>
      <div class="gp-name-fields"><input id="gp-name" type="text" maxlength="14" autocomplete="given-name" placeholder="Tu primer nombre">
      <button type="submit" id="gp-begin" disabled>Empezar aventura <span aria-hidden="true">→</span></button></div>
    </form>
  </section>
  <p id="gp-game-status" role="status" aria-live="polite" class="gp-game-status"></p>
</div>
<header class="gp-game-nav"><a href="presentacion-guaria.html"><img src="../../assets/academy_a.svg" alt="" width="34" height="28"><span>ACADEMIA NORTEAMERICANA</span></a><span>NORTHBOUND / CIUDAD GUARIA</span></header>
<div id="lab2-root" aria-label="Juego Northbound Ciudad Guaria"></div>
<noscript><p class="l2-boot">Necesitás JavaScript para jugar.</p></noscript>
<div class="nb-sound" id="nb-sound" role="group" aria-label="Controles de sonido" hidden></div>
<div class="nb-souvenir" id="nb-souvenir" hidden></div>
<footer class="gp-game-footer">Northbound English Lab · Vista previa de diseño. Las respuestas se guardan solo en este navegador; no registran notas oficiales.</footer>
<script src="../../vendor/react.js"></script><script src="../../vendor/react-dom.js"></script>
<script src="lab2_content.js"></script><script src="__CONTENT__"></script><script src="guaria-content.js"></script>
<script src="lab2_core.js"></script><script src="lab2_steps.js"></script><script src="lab2_app.js"></script>
<script>__NB_CONFIG__
window.GUARIA_PAGE=__PAGE_CONFIG__;</script>
<script src="nb_intro_audio.js"></script><script src="guaria_cine.js"></script><script src="guaria-game.js"></script>
</body></html>'''
    desc=('Visitá una tienda y encontrá tu recuerdo. Cada conversación cambia un pequeño detalle de tu historia.' if is2 else
          'Entrá a Café La Esquina, conocé a Ms. Rivera y presentate en inglés. Tus respuestas cambian la conversación.')
    html=(html.replace('__TITLE__',title).replace('__POSTER__',poster)
       .replace('__PLACE__',place).replace('__TAG__',tag).replace('__NAME_DESC__',desc)
       .replace('__CONTENT__',cont).replace('__NB_CONFIG__',config)
       .replace('__PAGE_CONFIG__',intro))
    # Un escape innecesario del atributo src de contenido original no puede filtrarse al HTML final.
    if '</script>' not in html or 'Port Hazel' in html or 'The Corner Cup' in html:raise RuntimeError("Incoherent generated HTML")
    (p/('guaria-002.html' if is2 else 'guaria-001.html')).write_text(html,encoding='utf-8')
    print('GENERATED',tag,len(html))
