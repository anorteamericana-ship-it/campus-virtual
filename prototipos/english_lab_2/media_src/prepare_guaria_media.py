"""Render reproducible de clips Ciudad Guaria sin modificar videos originales."""
from pathlib import Path
here = Path(__file__).resolve().parent
src = (here / "corner_cup_scene.html").read_text(encoding="utf-8")
replaces = [
 ("Video 001 \"Bienvenido a The Corner Cup\"", 'Video Ciudad Guaria "Bienvenido a Café La Esquina"'),
 ("name: 'THE CORNER CUP', nameSize: 30", "name: 'CAFÉ LA ESQUINA', nameSize: 24"),
 ("name: 'HARBOR GIFTS', nameSize: 32", "name: 'DETALLES DE LA PLAZA', nameSize: 21"),
 ("credit: ['PORT HAZEL', 'FRIDAY", "credit: ['CIUDAD GUARIA', 'FRIDAY"),
 ("credit: ['PORT HAZEL', 'SATURDAY", "credit: ['CIUDAD GUARIA', 'SATURDAY"),
 ("brick: '#3b2531', trim: '#2a1a25'", "brick: '#002F6C', trim: '#001E47'"),
 ("awn: ['#be1e2d', '#f5ead3'], door: ['#7a1722', '#9c1e2b']", "awn: ['#DA291C', '#F3EEE6'], door: ['#002F6C', '#0c477d']"),
 ("brick: '#27464f', trim: '#183038'", "brick: '#1c536b', trim: '#002F6C'"),
 ("awn: ['#1f7a6d', '#f5ead3'], door: ['#14504a', '#1f7a6d']", "awn: ['#DA291C', '#F3EEE6'], door: ['#002F6C', '#155779']"),
 ("var palette = ['#3c4a82', '#4a4478', '#3a5388', '#54466f', '#35508a'];",
  "var palette = ['#325f82', '#537f75', '#3c618a', '#90796c', '#487c81'];"),
 ("g.strokeStyle = '#be1e2d'; g.lineWidth = 1.6;", "g.strokeStyle = '#DA291C'; g.lineWidth = 1.6;"),
 ("text(SC.sign[1], 0, 7, 15.5, '#be1e2d'", "text(SC.sign[1], 0, 7, 15.5, '#DA291C'"),
 ("g.fillStyle = '#7c86ad'; g.fillRect(-400, GROUND, 5200, 44); g.fillStyle = '#a3acce';",
  "g.fillStyle = '#b8b5a1'; g.fillRect(-400, GROUND, 5200, 44); g.fillStyle = '#e4d8bc';"),
 ("g.fillStyle = '#39436f'; g.fillRect(-400, GROUND + 44, 5200, 260);",
  "g.fillStyle = '#39475d'; g.fillRect(-400, GROUND + 44, 5200, 260);"),
 ("k = 1 - ease(t / 0.5); if (k > 0) { g.fillStyle = 'rgba(13,21,49,' + k + ')';",
  "k = 1 - ease(t / 0.5); if (k > 0) { g.fillStyle = 'rgba(0,47,108,' + k + ')';"),
 ("k = ease((t - 9.05) / 0.85); if (k > 0) { g.fillStyle = 'rgba(13,21,49,' + k + ')';",
  "k = ease((t - 9.05) / 0.85); if (k > 0) { g.fillStyle = 'rgba(0,47,108,' + k + ')';")
]
for old, new in replaces:
    if old not in src: raise RuntimeError("Source changed: " + old)
    src = src.replace(old,new)
anchor="    glow(SC.sun[0] - cam.x * 0.02, SC.sun[1], 300,"
mountains="""    /* Montañas del Valle Central: paisaje local por encima de la ciudad. */
    g.fillStyle = '#6a918e'; g.beginPath();
    g.moveTo(-80,490);g.lineTo(70,405);g.lineTo(195,432);
    g.lineTo(370,340);g.lineTo(495,408);g.lineTo(680,330);
    g.lineTo(840,420);g.lineTo(1010,355);g.lineTo(1180,429);
    g.lineTo(1380,377);g.lineTo(1380,600);g.lineTo(-80,600);
    g.closePath();g.fill();
    g.fillStyle = 'rgba(65,112,95,.65)';g.beginPath();
    g.moveTo(-40,515);g.lineTo(160,472);g.lineTo(350,486);
    g.lineTo(540,449);g.lineTo(725,499);g.lineTo(950,463);
    g.lineTo(1170,493);g.lineTo(1340,453);
    g.lineTo(1340,610);g.lineTo(-40,610);g.closePath();g.fill();
"""
if anchor not in src: raise RuntimeError("Mountain anchor missing")
src=src.replace(anchor,mountains+anchor)
out=here/"guaria_scene.html"
out.write_text(src,encoding="utf-8")
render=(here/"render_video_001.mjs").read_text(encoding="utf-8")
for old,new in [
 ("corner_cup_scene.html","guaria_scene.html"),
 ("{ cafe: 'corner_cup', gifts: 'harbor_gifts' }","{ cafe: 'guaria_cafe', gifts: 'guaria_gifts' }")
]:
    if old not in render: raise RuntimeError("Renderer anchor missing "+old)
    render=render.replace(old,new)
(here/"render_guaria.mjs").write_text(render,encoding="utf-8")
print("GUARIA_SOURCE_READY",out.stat().st_size)
