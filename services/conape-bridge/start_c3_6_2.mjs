import fs from 'node:fs';

const sourceUrl = new URL('./server.mjs', import.meta.url);
const runtimeUrl = new URL('./server.runtime.c3_6_2.mjs', import.meta.url);
const source = fs.readFileSync(sourceUrl, 'utf8');

const needle = /  if \(!\(await login\.count\(\)\)\) throw new AppError\('CONAPE_LOGIN_BUTTON_NOT_FOUND'[^\n]*\n\n  await login\.click\(\);\n  const until = Date\.now\(\) \+ 30_000;\n  while \(Date\.now\(\) < until\) \{\n    await sleep\(600\);\n    if \(await recruitVisible\(p\)\) return;\n  \}\n  throw new AppError\('CONAPE_LOGIN_FAILED'[^\n]*;/;

const replacement = `  if (await login.count()) await login.click();
  else await pass.press('Enter');

  await sleep(1200);
  const until = Date.now() + 45_000;
  let homeRetried = false;
  while (Date.now() < until) {
    if (await recruitVisible(p) || await formReady(p)) return;

    const passwordVisible = await p.locator('input[type="password"]:visible').count().catch(() => 0);
    if (!passwordVisible && !homeRetried) {
      homeRetried = true;
      try {
        await p.goto(CONAPE_HOME, { waitUntil:'domcontentloaded', timeout:30_000 });
      } catch {}
      if (await recruitVisible(p) || await formReady(p)) return;
    }

    await sleep(600);
  }
  throw new AppError('CONAPE_LOGIN_FAILED', 'CONAPE no confirmó la sesión del bridge.', 503);`;

const patched = source.replace(needle, replacement);
if (patched === source) {
  throw new Error('C3.6.5 login redirect patch target not found; refusing to start');
}

fs.writeFileSync(runtimeUrl, patched, 'utf8');
await import(runtimeUrl.href + '?v=' + Date.now());
