import fs from 'node:fs';

const sourceUrl = new URL('./server.mjs', import.meta.url);
const runtimeUrl = new URL('./server.runtime.c3_6_2.mjs', import.meta.url);
const source = fs.readFileSync(sourceUrl, 'utf8');

const needle = /  if \(!\(await login\.count\(\)\)\) throw new AppError\('CONAPE_LOGIN_BUTTON_NOT_FOUND'[^\n]*\n\n  await login\.click\(\);/;
const replacement = "  if (await login.count()) await login.click();\n  else await pass.press('Enter');";

const patched = source.replace(needle, replacement);
if (patched === source) {
  throw new Error('C3.6.2 login patch target not found; refusing to start');
}

fs.writeFileSync(runtimeUrl, patched, 'utf8');
await import(runtimeUrl.href + '?v=' + Date.now());
