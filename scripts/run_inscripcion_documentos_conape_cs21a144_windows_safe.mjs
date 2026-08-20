import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const productFiles = [
  path.join(root, 'src', 'inscripcion.jsx'),
  path.join(root, 'styles', 'inscripcion.css'),
  path.join(root, 'inscripcion.html'),
];

const originals = new Map();
for (const file of productFiles) {
  const bytes = fs.readFileSync(file);
  originals.set(file, bytes);
  const text = bytes.toString('utf8').replace(/\r\n/g, '\n');
  fs.writeFileSync(file, text, 'utf8');
}

try {
  const applicator = pathToFileURL(path.join(here, 'apply_inscripcion_documentos_conape_cs21a144.mjs')).href;
  await import(`${applicator}?run=${Date.now()}`);
  console.log('PASS compatibilidad Windows: CRLF normalizado solo durante la aplicación.');
} catch (error) {
  for (const [file, bytes] of originals.entries()) fs.writeFileSync(file, bytes);
  console.error('ROLLBACK local: archivos de producto restaurados byte a byte tras fallo del aplicador.');
  throw error;
}
