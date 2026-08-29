import fs from 'node:fs';

const runner = fs.readFileSync('scripts/real_qa_english_lab_multiuser_cs21a171.mjs', 'utf8');
const workflow = fs.readFileSync('.github/workflows/qa-english-lab-multiuser-cs21a171.yml', 'utf8');
const shell = fs.readFileSync('src/english_lab_live_v2.jsx', 'utf8');
const failures = [];
const check = (ok, message) => ok ? console.log(`PASS: ${message}`) : failures.push(message);

check(runner.includes("const API_VERSION = 'english_lab_live.v2';"), 'runner usa api_version v2 exacta');
check(runner.includes("if (stagingUrl === prodMatch[1]) throw new Error('BLOQUEADO: la URL English LAB QA coincide con producción.')"), 'runner bloquea URL productiva');
check(runner.includes("const STAGING_MARKER = 'QA_STAGING_CS21A138';"), 'runner exige marcador QA canónico');
check(runner.includes('qa.writes_guarded === true'), 'runner exige writes_guarded=true');
check(runner.includes("const CONFIRMATION = 'CS21A171_STAGING_ONLY';"), 'runner exige confirmación separada');
check(runner.includes("teacherRole === 'teacher'"), 'runner exige rol docente real');
check(runner.includes("studentRole === 'student'"), 'runner exige rol estudiante real');
check(runner.includes("'participant_count_teacher_is_one'"), 'runner comprueba participant_count docente');
check(runner.includes("'participant_count_student_is_one'"), 'runner comprueba participant_count estudiante');
check(runner.includes("assertNoSentenceAnswerLeak(studentState.game, 'student_open')"), 'runner comprueba anti-leak antes de responder');
check(runner.includes("assertNoSentenceAnswerLeak(studentState.game, 'student_after_submit_before_reveal')"), 'runner comprueba anti-leak después de submit y antes de reveal');
check(runner.includes("'same_request_replayed'"), 'runner comprueba idempotencia de submitAttempt');
check(runner.includes("'answer_available_only_after_reveal'"), 'runner exige respuesta solo tras reveal');
check(runner.includes("'viewer_result_available_after_reveal'"), 'runner verifica resultado privado del estudiante');
check(runner.includes("'leaderboard_contains_single_student'"), 'runner verifica ranking real');
check(runner.includes("'revision_matches_final'"), 'runner compara revisión docente/estudiante final');
check(runner.includes("reason: 'QA_CS21A171_CLEANUP'"), 'runner intenta limpiar sala si el flujo falla');
check(!runner.includes('console.log(teacherToken'), 'runner no imprime token docente');
check(!runner.includes('console.log(studentToken'), 'runner no imprime token estudiante');
check(!runner.includes('console.log(roomCode'), 'runner no imprime código de sala');

check(shell.includes("const API_VERSION = 'english_lab_live.v2';"), 'shell y runner comparten api_version exacta');
check(shell.includes("const MUTATING = new Set(['createRoom','joinRoom','startRoom','prepareRound','openRound','lockRound','revealRound','submitAttempt','closeRound','closeRoom']);"), 'harness cubre contrato mutante del shell vigente');

check(workflow.includes("branches:\n      - 'qa/english-lab-multiuser-e2-cs21a171'"), 'push de QA está limitado a la rama CS21A171');
check(workflow.includes("contains(github.event.head_commit.message, '[RUN_ELV2_E2_CS21A171]')"), 'E2 por push exige marcador explícito');
check(workflow.includes("github.event_name == 'workflow_dispatch' && inputs.authenticated == true"), 'dispatch E2 exige authenticated=true');
check(workflow.includes('needs: contract'), 'E2 depende del guard contractual');
check(workflow.includes('QA_ENGLISH_LAB_APPS_SCRIPT_URL: ${{ secrets.QA_STAGING_APPS_SCRIPT_URL }}'), 'runner reutiliza URL staging QA canónica');
check(workflow.includes('QA_LAB_TEACHER_USER: ${{ secrets.QA_TEACHER_USER }}'), 'runner reutiliza usuario docente QA canónico');
check(workflow.includes('QA_LAB_TEACHER_PASS: ${{ secrets.QA_TEACHER_PASS }}'), 'runner reutiliza password docente QA canónico');
check(workflow.includes('QA_LAB_STUDENT_USER: ${{ secrets.QA_STUDENT_USER }}'), 'runner reutiliza usuario estudiante QA canónico');
check(workflow.includes('QA_LAB_STUDENT_PASS: ${{ secrets.QA_STUDENT_PASS }}'), 'runner reutiliza password estudiante QA canónico');
check(workflow.includes('QA_LAB_GROUP_CODE: ${{ secrets.QA_GROUP_CODE }}'), 'runner reutiliza grupo QA canónico');
check(workflow.includes('QA_ENGLISH_LAB_WRITE_CONFIRMATION: CS21A171_STAGING_ONLY'), 'confirmación se genera únicamente dentro del job E2 ya gated');
check(workflow.includes('Refuse incomplete English LAB QA secret set'), 'workflow falla cerrado con secretos incompletos');
check(!workflow.includes("pull_request' &&"), 'job E2 no se habilita por evento pull_request');

if (failures.length) {
  console.error('QA ENGLISH LAB MULTIUSER CONTRACT CS21A171 FAIL');
  failures.forEach(item => console.error('-', item));
  process.exit(1);
}
console.log('QA ENGLISH LAB MULTIUSER CONTRACT CS21A171 PASS');
