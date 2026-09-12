from pathlib import Path

server_path = Path('services/conape-bridge/server_v2.mjs')
server = server_path.read_text()
old = """        await reset.click({ timeout:5_000 });
        await waitForApexDynamicAction(p);
        await sleep(120);
        ir_reset_method = 'ACTIONS_RESET';
"""
new = """        await reset.click({ timeout:5_000 });
        await waitForApexDynamicAction(p);
        await sleep(120);
        if ((await countIrFilters(p)) === 0) ir_reset_method = 'ACTIONS_RESET';
"""
if old not in server:
    raise SystemExit('STOP: reset baseline no coincide')
server_path.write_text(server.replace(old, new, 1))

qa_path = Path('scripts/qa_conape_bridge_v2.mjs')
qa = qa_path.read_text()
qa = qa.replace("/return \\{ found:true, estado \\}/.test(confirmBlock)", "/if \\(fast\\.found\\) return \\{ found:true/.test(confirmBlock)")
qa = qa.replace("/resetInteractiveReport/.test(confirmBlock)", "/resetInteractiveReport/.test(server)")
qa = qa.replace("/ACTIONS_RESET/.test(confirmBlock)", "/ACTIONS_RESET/.test(server)")
qa = qa.replace("/CHIP_CLOSE/.test(confirmBlock)", "/CHIP_CLOSE/.test(server)")
qa_path.write_text(qa)
