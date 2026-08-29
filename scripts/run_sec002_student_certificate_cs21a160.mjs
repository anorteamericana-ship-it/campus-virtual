import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const sourcePath = 'scripts/apply_sec002_student_certificate_cs21a160.mjs';
const fixedPath = 'scripts/.apply_sec002_student_certificate_cs21a160.fixed.mjs';
let src = fs.readFileSync(sourcePath, 'utf8');

for (const expr of ['${row.nota}', '${row.asistencia_pct}']) {
  const count = src.split(expr).length - 1;
  if (count !== 2) throw new Error(`expected exactly 2 embedded-source occurrences of ${expr}, found ${count}`);
  src = src.split(expr).join('\\' + expr);
}

fs.writeFileSync(fixedPath, src);
await import(pathToFileURL(process.cwd() + '/' + fixedPath).href + `?v=${Date.now()}`);
