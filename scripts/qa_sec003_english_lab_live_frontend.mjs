import fs from 'node:fs';

const source = fs.readFileSync('src/english_lab_live.jsx', 'utf8');
const failures = [];
const expect = (ok, message) => { if (!ok) failures.push(message); };

expect(!/opcional\s+para\s+demo/i.test(source), 'Live still advertises student code as optional for demo');
expect(!/setPlayerName\s*\(/.test(source), 'Live still lets the browser edit player name');
expect(!/setStudentCode\s*\(/.test(source), 'Live still lets the browser edit student code');
expect(/const\s+playerName\s*=\s*liveStudentName\(u\)/.test(source), 'player name is not derived from the Campus session');
expect(/const\s+studentCode\s*=\s*liveStudentCode\(u\)/.test(source), 'student code is not derived from the Campus session');
expect(/if\(!clean\(studentCode\)\)/.test(source), 'join does not fail closed when enrolled student code is absent');
expect(/<input\s+value=\{playerName\}\s+readOnly/.test(source), 'player identity field is not read-only');
expect(/<input\s+value=\{studentCode\}\s+readOnly/.test(source), 'student code field is not read-only');

const codeHelper = source.match(/function\s+liveStudentCode\(usuario\)\{[\s\S]*?\n\s*\}/)?.[0] || '';
expect(!!codeHelper, 'liveStudentCode helper not found');
expect(!/cedula|identificacion/i.test(codeHelper), 'Live student code still falls back to cédula/identification instead of enrolled Campus codigo');
expect(/u\.codigo|u\.CODIGO|u\.cod_estudiante|u\.COD_ESTUDIANTE/.test(codeHelper), 'Live student code no longer reads enrolled Campus codigo');

// Player UI may know the answer only after backend reveal. This source still
// reads question.correct to render the closed-round reveal, so the security
// boundary must remain server-side and is tested separately against Code.gs.
expect(/const\s+correctValue\s*=\s*clean\(question\.correct\)/.test(source), 'closed-round reveal contract unexpectedly changed');

if (failures.length) {
  console.error('SEC003 ENGLISH LAB LIVE FRONTEND: FAIL');
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}
console.log('SEC003 ENGLISH LAB LIVE FRONTEND: PASS');
console.log('- player name/code are session-derived and read-only');
console.log('- Live requires enrolled Campus codigo; no cédula/demo fallback');
console.log('- closed-round reveal renderer preserved');
