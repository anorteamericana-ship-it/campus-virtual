import fs from 'node:fs';

const path = 'src/data.jsx';
let src = fs.readFileSync(path, 'utf8');

const before = `const _solpDemoForced = (() => {
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('demo') === '1' || q.get('preview')) return true;
    return localStorage.getItem('an_solp_demo') === '1';
  } catch (_) { return false; }
})();`;

const after = `const _solpDemoForced = (() => {
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('demo') === '1' || q.get('preview')) return true;

    const activeSession = typeof getSesion === 'function' ? getSesion() : null;
    if (activeSession) {
      if (localStorage.getItem('an_solp_demo') === '1') {
        console.warn('[SEC-004] Se ignoró an_solp_demo porque existe una sesión del Campus.');
      }
      return false;
    }

    return localStorage.getItem('an_solp_demo') === '1';
  } catch (_) { return false; }
})();`;

const count = src.split(before).length - 1;
if (count !== 1) throw new Error(`Preimagen _solpDemoForced inesperada: ${count}`);
src = src.replace(before, after);
fs.writeFileSync(path, src, 'utf8');
console.log('CS21A198 exact demo-isolation patch applied');
// rerun after guard alignment
