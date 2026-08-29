from pathlib import Path


def replace_exact(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 preimage, found {count}')
    return text.replace(old, new, 1)


path = Path('src/ventas_drawer.jsx')
text = path.read_text(encoding='utf-8')

text = replace_exact(
    text,
    "const technicalText = /apps?\\s*script|backend|endpoint|stack|exception|trace|<html|\\bjson\\b|\\btoken\\b|sesion_requerida|unauthorized|forbidden|internal server|status\\s*\\d{3}|sha-?256|\\bmime\\b|base64|file_id|respuesta_vacia|integridad_|sec004_|demo_read_only|policy_unbound/i.test(msg);",
    "const technicalText = /apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|sesion_requerida|unauthorized|forbidden|internal server|status\\s*\\d{3}|sha-?256|\\bmime\\b|base64|file_id|respuesta_vacia|integridad_|sec004_|demo_read_only|policy_unbound/i.test(msg);",
    'browser technical errors',
)

text = replace_exact(
    text,
    """function GrupoSelect({ programa, demo, value, onChange }) {
  const grupos = useGruposVx(programa, demo);
  if (!grupos) return <div className=\"vx-sk\" style={{ height: 40, borderRadius: 8 }} />;""",
    """function GrupoSelect({ programa, demo, value, onChange }) {
  const grupos = useGruposVx(programa, demo);
  vUseEffect(() => {
    if (!Array.isArray(grupos) || !value) return;
    if (!grupos.some(g => g.codigo === value)) onChange('');
  }, [grupos, value, onChange]);
  if (!grupos) return <div className=\"vx-sk\" style={{ height: 40, borderRadius: 8 }} />;""",
    'clear stale group selection',
)

path.write_text(text, encoding='utf-8')
