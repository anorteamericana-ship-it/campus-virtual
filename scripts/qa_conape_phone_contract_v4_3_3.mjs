import fs from 'node:fs';
import vm from 'node:vm';

const server = fs.readFileSync('services/conape-bridge/server_v2.mjs', 'utf8');

function extract(re, label) {
  const match = server.match(re);
  if (!match) throw new Error(`MISSING_SOURCE_BLOCK: ${label}`);
  return match[0];
}

const source = [
  extract(/const PROSPECT_LIST_FIELDS = \[[^\n]+\];/, 'PROSPECT_LIST_FIELDS'),
  extract(/const PROSPECT_LIST_HEADER_ALIASES = new Map\(\[[\s\S]*?\n\]\);/, 'PROSPECT_LIST_HEADER_ALIASES'),
  extract(/const PROSPECT_LIST_PHONE_FIELDS = \[[^\n]+\];/, 'PROSPECT_LIST_PHONE_FIELDS'),
  extract(/const PROSPECT_LIST_REQUIRED_FIELDS = [^\n]+;/, 'PROSPECT_LIST_REQUIRED_FIELDS'),
  extract(/function normalizeProspectListHeader\(value\) \{[\s\S]*?\n\}/, 'normalizeProspectListHeader'),
  extract(/function prospectListMissingFields\(headers\) \{[\s\S]*?\n\}/, 'prospectListMissingFields'),
  extract(/function detectCsvDelimiter\(line\) \{[\s\S]*?\n\}/, 'detectCsvDelimiter'),
  extract(/function parseCsvRecords\(raw\) \{[\s\S]*?\n\}/, 'parseCsvRecords'),
  extract(/function parseProspectCsv\(raw\) \{[\s\S]*?\n\}/, 'parseProspectCsv'),
].join('\n\n');

const sandbox = {
  txt: value => String(value ?? '').trim(),
  console,
};
vm.createContext(sandbox);
vm.runInContext(`${source}\nthis.__parseProspectCsv = parseProspectCsv;\nthis.__missing = prospectListMissingFields;`, sandbox);

const parse = sandbox.__parseProspectCsv;
const missing = sandbox.__missing;

const baseHeaders = [
  'Cédula','Primer Apellido','Segundo Apellido','Nombre','Correo Electrónico','Estado',
  'Fecha de Estado','Fecha de Registro','Usuario que Registró','Aprobación','Formalización',
  'Último Desembolso','Próximo Desembolso',
];
const baseValues = [
  '101010101','UNO','DOS','NOMBRE','mail@example.invalid','REGISTRADO',
  '01/09/2026','01/09/2026','USR','','','01/09/2026','02/09/2026',
];

function csvWith(phoneHeaders, phoneValues) {
  const headers = [...baseHeaders.slice(0, 4), ...phoneHeaders, ...baseHeaders.slice(4)];
  const values = [...baseValues.slice(0, 4), ...phoneValues, ...baseValues.slice(4)];
  return `${headers.join(';')}\n${values.join(';')}\n`;
}

function assert(name, condition) {
  if (!condition) {
    console.error(`FAIL: ${name}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${name}`);
  }
}

const combined = parse(csvWith(['Teléfono Celular'], ['88887777']));
assert('Teléfono Celular solo pasa columns_ok', combined.ok === true && combined.columns_ok === true);
assert('Teléfono Celular solo conserva celular y deja telefono vacío', combined.rows?.[0]?.celular === '88887777' && combined.rows?.[0]?.telefono === '');

const phoneOnly = parse(csvWith(['Teléfono'], ['22223333']));
assert('Teléfono solo pasa columns_ok', phoneOnly.ok === true && phoneOnly.columns_ok === true);
assert('Teléfono solo conserva telefono y deja celular vacío', phoneOnly.rows?.[0]?.telefono === '22223333' && phoneOnly.rows?.[0]?.celular === '');

const mobileOnly = parse(csvWith(['Celular'], ['88887777']));
assert('Celular solo pasa columns_ok', mobileOnly.ok === true && mobileOnly.columns_ok === true);

const both = parse(csvWith(['Teléfono','Celular'], ['22223333','88887777']));
assert('Teléfono + Celular pasa columns_ok', both.ok === true && both.columns_ok === true);
assert('Teléfono + Celular conserva ambos sin colapsar', both.rows?.[0]?.telefono === '22223333' && both.rows?.[0]?.celular === '88887777');

const neither = parse(csvWith([], []));
assert('Sin ninguna columna telefónica falla cerrado', neither.ok === false && neither.reason === 'REQUIRED_COLUMN_MISSING');
assert('Diagnóstico sin teléfono usa marcador no PII', missing(['cedula','apellido_1','apellido_2','nombre','correo','estado','fecha_estado','fecha_registro','usuario_registro','aprobacion','formalizacion','ultimo_desembolso','proximo_desembolso']).includes('telefono_o_celular'));

assert('Browser reader recibe contrato de campos compartido', server.includes("{ fields:PROSPECT_LIST_FIELDS, required:PROSPECT_LIST_REQUIRED_FIELDS, phoneFields:PROSPECT_LIST_PHONE_FIELDS }"));
assert('Browser reader acepta telefono o celular', server.includes("if (!phoneFields.some(key => best.headers.includes(key))) missing.push('telefono_o_celular');"));
assert('Alias combinado sigue mapeando únicamente a celular', server.includes("['TELEFONO_CELULAR','celular']"));

if (process.exitCode) process.exit(process.exitCode);
console.log('CONAPE phone contract V4.3.3 QA PASS');
