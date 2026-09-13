from pathlib import Path

p = Path('scripts/qa_conape_bridge_v2.mjs')
qa = p.read_text(encoding='utf-8')
anchor = "const listTelemetryMatches = server.match(/event:'conape_list_dump'/g) || [];"
bad = """const salesStatusStart = server.indexOf('async function listProspectStatusesForSales');
const salesStatusEnd = server.indexOf('function categoryStatus', salesStatusStart);
const salesStatusBlock = salesStatusStart >= 0 && salesStatusEnd > salesStatusStart ? server.slice(salesStatusStart, salesStatusEnd) : '';"""
good = """const salesStatusStart = server.indexOf('const SALES_STATUS_FIELDS');
const salesStatusEnd = server.indexOf('function categoryStatus', salesStatusStart);
const salesStatusBlock = salesStatusStart >= 0 && salesStatusEnd > salesStatusStart ? server.slice(salesStatusStart, salesStatusEnd) : '';"""
qa = qa.replace(bad + '\n', '').replace(bad, '')
if good not in qa:
    if anchor not in qa:
        raise SystemExit('STOP: list telemetry anchor missing')
    qa = qa.replace(anchor, anchor + '\n' + good, 1)
p.write_text(qa, encoding='utf-8')
