"""Genera el audio de Listening del Exam Prep Lab, una vez, fuera del navegador.

Motor: Kokoro-82M (Apache-2.0) con kokoro-onnx, local. Sin servicio en línea, sin costo, sin datos personales.
Son VOCES SINTÉTICAS: nadie las ha escuchado todavía (revisión auditiva humana pendiente).

Uso:
  pip install kokoro-onnx soundfile
  KOKORO_DIR=/ruta/a/modelos python3 media_src/make_audio.py A [B]
  (kokoro-v1.0.onnx y voices-v1.0.bin: github.com/thewh1teagle/kokoro-onnx, releases)

Entradas: forms/form_<x>.json. Salidas: audio/<X>/*.mp3, audio/common/dir-P*.mp3 y audio_manifest.js.
Cada clip guarda `text_sha`: huella de lo que se pidió decir (voz, idioma, velocidad, texto, pausas).
qa_media.mjs la recalcula desde el banco: si alguien cambia un texto sin regenerar el audio, la prueba falla.
"""
import hashlib, json, os, subprocess, sys, tempfile, time
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

root = Path(__file__).resolve().parent.parent
SR = 24000
SPEED = {'NARR': 0.95}
DEFAULT_SPEED = 0.94
LINE_GAP = 0.45
QUESTION_GAP = 8.0
# Instrucciones originales de la Academia (no son las de ETS).
DIRECTIONS = {
    'P1': 'Part One. In this part, you will see a photograph and hear four statements about it. The statements are not printed. Choose the statement that best describes what you see in the photograph.',
    'P2': 'Part Two. In this part, you will hear a question or a statement, followed by three responses. They are spoken only once and are not printed. Choose the best response.',
    'P3': 'Part Three. In this part, you will hear conversations between two or more people. After each conversation, answer the three questions about it. The conversations are spoken only once.',
    'P4': 'Part Four. In this part, you will hear short talks by a single speaker. After each talk, answer the three questions about it. The talks are spoken only once.',
}
NARR_VOICE = {'engine': 'kokoro', 'voice': 'am_adam', 'lang': 'en-us'}
HEADER = '/* Generado por media_src/make_audio.py. No editar a mano. Voces sintéticas Kokoro-82M (Apache-2.0). Revisión auditiva humana: PENDIENTE. */\nwindow.EPL_AUDIO = '


def segments_for(bank, key):
    """Lista canónica de segmentos de un clip. Debe coincidir con segmentsFor() de qa_media.mjs."""
    by_item = {i['item_id']: i for i in bank['items']}
    groups = {g['passage_group_id']: g for g in bank['groups']}
    if key in groups:
        g = groups[key]
        segs = [{'gap': 0.5}, {'v': 'NARR', 't': g['intro']}, {'gap': 0.4}] + g['script'] + [{'mark': 'questions_at'}]
        for iid in g['item_ids']:
            segs += [{'v': 'NARR', 't': by_item[iid]['stem']}, {'gap': QUESTION_GAP}]
        return segs
    return [{'gap': 0.5}] + by_item[key]['script']


def canon(seg, voices):
    if 'mark' in seg:
        return 'M|' + seg['mark']
    if 'gap' in seg:
        return 'G|%.2f' % seg['gap']
    v = voices[seg['v']]
    return 'S|%s|%s|%.2f|%s' % (v['voice'], v['lang'], SPEED.get(seg['v'], DEFAULT_SPEED), seg.get('say', seg['t']))


def text_sha(segs, voices):
    return hashlib.sha256('\n'.join(canon(s, voices) for s in segs).encode('utf-8')).hexdigest()


def main(forms):
    kdir = Path(os.environ.get('KOKORO_DIR', '.'))
    k = Kokoro(str(kdir / 'kokoro-v1.0.onnx'), str(kdir / 'voices-v1.0.bin'))
    available = set(np.load(str(kdir / 'voices-v1.0.bin')).files)
    man_path = root / 'audio_manifest.js'
    manifest = {'engine': 'kokoro-82M v1.0 (kokoro-onnx), local', 'human_review': 'PENDIENTE', 'clips': {}}
    if man_path.exists():
        txt = man_path.read_text()
        manifest = json.loads(txt[txt.index('{'):txt.rindex('}') + 1])

    def save():
        man_path.write_text(HEADER + json.dumps(manifest, indent=1, ensure_ascii=False) + ';\n')

    def render(segs, voices):
        parts, marks, t, speech, words = [], {}, 0.0, 0.0, 0
        for seg in segs:
            if 'mark' in seg:
                marks[seg['mark']] = round(t, 2)
                continue
            if 'gap' in seg:
                a = np.zeros(int(SR * seg['gap']), dtype=np.float32)
            else:
                v = voices[seg['v']]
                assert v['voice'] in available, 'voz inexistente: ' + v['voice']
                s, rate = k.create(seg.get('say', seg['t']), voice=v['voice'], speed=SPEED.get(seg['v'], DEFAULT_SPEED), lang=v['lang'])
                assert rate == SR
                s = s.astype(np.float32)
                speech += len(s) / SR
                words += len(seg['t'].split())
                a = np.concatenate([s, np.zeros(int(SR * LINE_GAP), dtype=np.float32)])
            parts.append(a)
            t += len(a) / SR
        return np.concatenate(parts), marks, round(speech, 2), words

    def write(key, rel, segs, voices, form):
        audio, marks, speech, words = render(segs, voices)
        dest = root / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(suffix='.wav') as tmp:
            sf.write(tmp.name, audio, SR)
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp.name, '-ac', '1', '-ar', str(SR), '-b:a', '48k', str(dest)], check=True)
        data = dest.read_bytes()
        manifest['clips'][key] = dict({'form': form, 'file': rel, 'seconds': round(len(audio) / SR, 2), 'speech_seconds': speech, 'words': words,
                                       'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'text_sha': text_sha(segs, voices)}, **marks)
        save()

    voices_common = {'NARR': NARR_VOICE}
    for p, text in DIRECTIONS.items():
        key = 'DIR-' + p
        segs = [{'gap': 0.4}, {'v': 'NARR', 't': text}, {'gap': 1.0}]
        if manifest['clips'].get(key, {}).get('text_sha') != text_sha(segs, voices_common) or not (root / f'audio/common/dir-{p}.mp3').exists():
            write(key, f'audio/common/dir-{p}.mp3', segs, voices_common, 'COMMON')

    for form in forms:
        bank = json.loads((root / f'forms/form_{form.lower()}.json').read_text())
        voices = bank['voices']
        rel_of = {i['item_id']: i['audio_asset'] for i in bank['items'] if i['part'] in (1, 2)}
        rel_of.update({g['passage_group_id']: g['audio_asset'] for g in bank['groups'] if g['part'] in (3, 4)})
        keys = list(rel_of)
        for old in [c for c, m in manifest['clips'].items() if m.get('form') == form and c not in rel_of]:
            manifest['clips'].pop(old)
        t0 = time.time()
        for n, key in enumerate(keys, 1):
            segs = segments_for(bank, key)
            if manifest['clips'].get(key, {}).get('text_sha') == text_sha(segs, voices) and (root / rel_of[key]).exists():
                continue
            write(key, rel_of[key], segs, voices, form)
            print(f'{form} {n}/{len(keys)} {key} {manifest["clips"][key]["seconds"]} s ({time.time() - t0:.0f} s)', flush=True)
        total = sum(m['seconds'] for m in manifest['clips'].values() if m.get('form') == form)
        print(f'Forma {form}: {len(keys)} clips, {total / 60:.1f} min', flush=True)
    save()


if __name__ == '__main__':
    main([f.upper() for f in sys.argv[1:]] or ['A'])
