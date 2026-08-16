import fs from 'node:fs';

const sourcePath = 'src/inscripcion.jsx';
const source = fs.readFileSync(sourcePath, 'utf8');
const failures = [];

const weakLiteralPatterns = [
  /clave\s+m[ií]nima\s+de\s+4\s+caracteres/i,
  /form\.clave\)\.length\s*<\s*4\b/,
  /form\.clave\.length\s*<\s*4\b/
];

for (const pattern of weakLiteralPatterns) {
  if (pattern.test(source)) {
    failures.push(`weak password rule still present: ${pattern}`);
  }
}

const numericLengthChecks = [...source.matchAll(/(?:clean\(form\.clave\)|form\.clave)\.length\s*<\s*(\d+)/g)]
  .map(match => Number(match[1]));

if (!numericLengthChecks.length) {
  failures.push('no explicit enrollment password minimum-length check found');
} else if (Math.max(...numericLengthChecks) < 15) {
  failures.push(`enrollment password minimum remains below 15: ${numericLengthChecks.join(', ')}`);
}

const passwordInputWindow = source.match(/<TextInput\s+type="password"[\s\S]{0,500}?\/>/i)?.[0] || '';
if (!passwordInputWindow) {
  failures.push('enrollment password input not found');
} else {
  const directMin = passwordInputWindow.match(/minLength=\{?(\d+)\}?/i);
  if (!directMin || Number(directMin[1]) < 15) {
    failures.push('password input does not declare a browser minimum length of at least 15');
  }
  if (!/autoComplete="new-password"/i.test(passwordInputWindow)) {
    failures.push('password input must preserve autocomplete=new-password for password-manager compatibility');
  }
}

if (failures.length) {
  console.error('SEC-001 PASSWORD POLICY: FAIL');
  for (const item of failures) console.error(`- ${item}`);
  process.exit(1);
}

console.log('SEC-001 PASSWORD POLICY: PASS');
console.log('- enrollment minimum length >= 15');
console.log('- browser input minimum length >= 15');
console.log('- password-manager autocomplete preserved');
