import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const sourcePath = 'scripts/apply_sec002_ventas_private_delivery_cs21a159.mjs';
const fixedPath = 'scripts/.apply_sec002_ventas_private_delivery_cs21a159.fixed.mjs';
let src = fs.readFileSync(sourcePath, 'utf8');

const oldGeneric = "data = replaceOne(data, `    email,\\n    preview_test,\\n  });`, `    email,\\n  });`, 'remove signed upload preview payload');";
const newGeneric = `{
  const before = \`    email,\\n    preview_test,\\n  });\`;
  const after = \`    email,\\n  });\`;
  const count = data.split(before).length - 1;
  if (count !== 2) throw new Error(\`remove signed preview payloads: expected 2 matches, found \${count}\`);
  data = data.split(before).join(after);
}`;
const oldSpecific = "data = replaceOne(data, `    file_id,\\n    email,\\n    preview_test,\\n  });`, `    file_id,\\n    email,\\n  });`, 'remove signed notify preview payload');";

if ((src.split(oldGeneric).length - 1) !== 1) throw new Error('generic preview payload fixer preimage missing');
if ((src.split(oldSpecific).length - 1) !== 1) throw new Error('specific preview payload fixer preimage missing');
src = src.replace(oldGeneric, newGeneric).replace(oldSpecific, '');
fs.writeFileSync(fixedPath, src);
await import(pathToFileURL(process.cwd() + '/' + fixedPath).href + `?v=${Date.now()}`);
