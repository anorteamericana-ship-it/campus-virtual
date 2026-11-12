"""Genera las voces de los personajes como archivos de audio, una vez, fuera del navegador.

Motor: Kokoro-82M (licencia Apache-2.0) con kokoro-onnx, ejecutado localmente. Sin servicio en línea y sin costo.
Entrada: las líneas en inglés del contenido de las aventuras (say, then, react, phrase) y las 26 letras.
Salida: media/voice/*.mp3 y voice_manifest.js (clave "personaje|texto" -> archivo).

Uso:
  pip install kokoro-onnx soundfile
  # descargar kokoro-v1.0.onnx y voices-v1.0.bin de github.com/thewh1teagle/kokoro-onnx (releases) a KOKORO_DIR
  KOKORO_DIR=/ruta python3 media_src/make_voices.py

Las líneas con el nombre del estudiante se graban sin el nombre ("Thank you, {name}." -> "Thank you.");
si el nombre es parte esencial de la frase no se graba y el juego usa la voz del dispositivo.
"""
import json, os, re, subprocess, sys, tempfile
from pathlib import Path

here = Path(__file__).resolve().parent
root = here.parent
out = root / 'media' / 'voice'
VOICES = {'rivera': 'af_heart', 'sam': 'am_michael', 'okafor': 'am_onyx', 'model': 'af_sarah', 'letter': 'af_heart'}
SPEED = {'rivera': 0.92, 'sam': 0.96, 'okafor': 0.9, 'model': 0.88, 'letter': 0.85}
FLAGS = {'drink': ['coffee', 'tea', 'water'], 'gift': ['mug', 'postcard', 'keychain']}
EPISODES = [['lab2_content.js', 'reto_001_content.js', 'aventura_001_content.js'], ['lab2_content.js', 'aventura_002_content.js']]

def lines_of(files):
    js = "global.window={};" + ''.join(f"require({json.dumps(str(root / f))});" for f in files) + """
      const out=[]; const e=window.LAB2_CONTENT.episodes[0];
      for (const sc of e.scenes) for (const s of sc.steps) {
        if (s.who && s.say) out.push([s.who, s.say]);
        if (s.who && s.then) out.push([s.who, s.then]);
        for (const o of (s.options||[])) { if (o.react) out.push([s.who, o.react]); if (o.then) out.push([s.who, o.then]); }
        if (s.phrase) out.push(['model', s.phrase]);
      }
      console.log(JSON.stringify(out));"""
    return json.loads(subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True).stdout)

def key_text(tpl):
    """Misma regla que LAB2.voice.keyFor en lab2_core.js."""
    t = re.sub(r',\s*\{name\}', '', tpl)
    if '{name}' in t:
        return None
    return t

def norm(t):
    return re.sub(r'\s+', ' ', t.replace('’', "'").lower()).strip()

def expand(t):
    res = [t]
    for flag, values in FLAGS.items():
        tok = '{' + flag + '}'
        res = [r.replace(tok, v) for r in res for v in (values if tok in r else [''])]
    return res

def main():
    kdir = Path(os.environ.get('KOKORO_DIR', '.'))
    import soundfile as sf
    from kokoro_onnx import Kokoro
    k = Kokoro(str(kdir / 'kokoro-v1.0.onnx'), str(kdir / 'voices-v1.0.bin'))
    jobs, skipped = {}, []
    for files in EPISODES:
        for who, tpl in lines_of(files):
            if who not in VOICES:
                continue
            t = key_text(tpl)
            if t is None:
                skipped.append(tpl); continue
            for text in expand(t):
                jobs.setdefault(who + '|' + norm(text), (who, text))
    for ch in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
        jobs['letter|' + ch.lower()] = ('letter', ch + '.')
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob('*.mp3'):
        old.unlink()
    manifest, total = {}, 0.0
    with tempfile.TemporaryDirectory() as tmp:
        for i, (key, (who, text)) in enumerate(sorted(jobs.items())):
            name = ('l_' + key[-1]) if who == 'letter' else f'{who[0]}{i:03d}'
            samples, sr = k.create(text, voice=VOICES[who], speed=SPEED[who], lang='en-us')
            wav = Path(tmp) / (name + '.wav'); sf.write(wav, samples, sr)
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(wav), '-af',
                            'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-18:TP=-1.5:LRA=11,apad=pad_dur=0.12',
                            '-ac', '1', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '48k', str(out / (name + '.mp3'))], check=True)
            manifest[key] = name + '.mp3'; total += len(samples) / sr
    js = ('/* Generado por media_src/make_voices.py. No editar a mano.\n * Voces sintetizadas con Kokoro-82M (Apache-2.0). No son grabaciones de personas. */\n'
          'window.LAB2_VOICE = ' + json.dumps({'base': 'media/voice/', 'files': manifest}, ensure_ascii=False, indent=0) + ';\n')
    (root / 'voice_manifest.js').write_text(js, encoding='utf-8')
    size = sum(f.stat().st_size for f in out.glob('*.mp3'))
    print(f'{len(manifest)} clips, {total:.0f} s de audio, {size/1024:.0f} KB; sin grabar por llevar el nombre: {len(skipped)}')
    for s in skipped: print('  -', s)

if __name__ == '__main__':
    sys.exit(main())
