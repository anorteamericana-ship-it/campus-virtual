from pathlib import Path

p = Path('services/conape-bridge/server_v2.mjs')
s = p.read_text(encoding='utf-8')
old = """        // Último respaldo únicamente: paginación legacy, después de otro RIR limpio.\n        await p.goto(prospectListResetUrl(sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });\n        await waitForApexDynamicAction(p);\n        pages = await readPagedProspects(p, rowsByCedula);"""
new = """        // Último respaldo únicamente: paginación legacy sobre la misma Friendly Home.\n        await openProspectListHome(p, sessionId);\n        pages = await readPagedProspects(p, rowsByCedula);"""
if new not in s:
    if old not in s:
        raise SystemExit('STOP: fallback baseline missing')
    s = s.replace(old, new, 1)
p.write_text(s, encoding='utf-8')

q = Path('scripts/qa_conape_bridge_v2.mjs')
qs = q.read_text(encoding='utf-8')
anchor = "  ['V4.3.2 permanece en Friendly Home cuando no hay filtros y solo usa RR si existen', listBlock.includes('async function openProspectListHome') && /if \\(ir_filters_before > 0\\)/.test(listBlock) && /await openProspectListHome\\(p, sessionId\\)/.test(listBlock)],"
newcheck = anchor + "\n  ['V4.3.2 fallbacks de lectura vuelven a Friendly Home y no a la URL RR', listBlock.includes('paginación legacy sobre la misma Friendly Home') && !/Último respaldo[\\s\\S]{0,240}prospectListResetUrl/.test(listBlock)],"
if newcheck not in qs:
    if anchor not in qs:
        raise SystemExit('STOP: QA anchor missing')
    qs = qs.replace(anchor, newcheck, 1)
q.write_text(qs, encoding='utf-8')
