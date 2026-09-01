import fs from 'node:fs';
import crypto from 'node:crypto';

const APP='src/app.jsx';
const LAZY='src/lazy_loader.jsx';
const BASE='src/importador_banco.jsx';
const SAFE='src/importador_banco_integridad_cs21a114.jsx';
const AH='scripts/qa_importador_bcr_safe_errors_cs21a210ah.mjs';
const BASE_BLOB='933e70943993c970b3f73218c5f29e18f3519a6b';
const OLD="  banco: ['src/importador_banco.jsx?v=F96.5G'],";
const NEW="  banco: ['src/importador_banco.jsx?v=F96.5G','src/importador_banco_integridad_cs21a114.jsx?v=F98.4Z6CS21A114'],";

function sha(text){const b=Buffer.from(text,'utf8');return crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');}
function must(ok,msg){if(!ok)throw new Error(msg);}
const app=fs.readFileSync(APP,'utf8');
const lazy=fs.readFileSync(LAZY,'utf8');
const base=fs.readFileSync(BASE,'utf8');
const safe=fs.readFileSync(SAFE,'utf8');
const ah=fs.readFileSync(AH,'utf8');

must((app.split(NEW).length-1)===1,'AS route must load base + integrity exactly once.');
must(!app.includes(OLD),'Old banco route without integrity file remains.');
must(app.includes('<LazyRoute title="Importar Banco" component="ImportadorBancario" files={F96_LAZY.banco} />'),'Bank route component contract changed.');
must(!app.includes("banco: ['src/importador_banco.jsx?v=F96.5G','src/importador_banco_loader_cs21a114.js"),'Async loader must not be placed in route dependency list.');

// LazyModuleView loads dependencies sequentially, so SAFE executes before component resolution/render.
must(lazy.includes('for (const f of (files || [])) await loadOne(f);'),'Lazy loader is no longer sequential.');
must(lazy.includes("return 'src/importador_banco.jsx?v=F98.4Z6CS21A124';"),'Canonical base importer normalization changed.');
must(base.includes('function ImportadorBancario()'),'Base importer component contract missing.');
must(safe.includes('function ImportadorBancarioCS21A114()'),'Integrity importer component missing.');
must(safe.includes('window.ImportadorBancarioCS21A114 = ImportadorBancarioCS21A114;'),'Integrity implementation is not exposed.');
must(safe.includes('window.ImportadorBancario = window.ImportadorBancarioCS21A114;'),'Integrity implementation no longer overrides canonical component.');
must(safe.includes("if (typeof window.ImportadorBancario === 'function') bank114Install();"),'Integrity implementation no longer installs immediately after base load.');
must(safe.includes('function bank114SafeUserError('),'AH safe-error helper missing from effective importer.');
must(ah.includes("const FILE='src/importador_banco_integridad_cs21a114.jsx';"),'AH guard no longer targets integrity importer.');

// Preserve bank endpoints/auth/integrity semantics.
for(const invariant of [
  "const token = window.getSessionToken ? window.getSessionToken() : '';",
  "bank114Post('previsualizarExtractoBanco', { filas:movs })",
  "bank114Post('importarExtracto',{ filas })",
  "data?.error === 'conflictos_bancarios'",
  "const bank114New = m => m.estado === 'NUEVO';",
]) must(safe.includes(invariant),`CS21A114 invariant changed: ${invariant}`);

// AS changes app.jsx only: reversing one route line must recreate exact AP preimage.
const restored=app.replace(NEW,OLD);
must(sha(restored)===BASE_BLOB,`AS reversal does not reconstruct exact app preimage: ${sha(restored)} != ${BASE_BLOB}`);
console.log('QA IMPORTADOR BCR WIRING CS21A210AS PASS');
