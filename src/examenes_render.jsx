/* global React, NIVEL_TEMA */
// ──────────────────────────────────────────────────────────────────────────
// examenes_render.jsx — Motor de formato visual UNIFORME del examen.
// Un solo renderer sirve a estudiante / profesor / preview. La identidad es
// Academia Norteamericana; el color sale del nivel; 3 estilos de shell y 2
// densidades para auditar. La clave (key) y la corrección preliminar SOLO se
// muestran cuando showKey=true (profesor / admin / preview), nunca al
// estudiante en examen oficial.
// ──────────────────────────────────────────────────────────────────────────

// ── Normalización + evaluación preliminar (NUNCA es nota final) ───────────
function exNorm(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/\u2019/g,"'").replace(/\s+/g,' ').replace(/[.…]+$/,'').trim();
}
// verdict: 'ok' (auto correcta) | 'bad' (auto incorrecta) | 'review' (requiere
// revisión docente) | 'empty' (sin responder)
function evalQuestion(section, q, val) {
  const has = val != null && String(val).trim() !== '';
  if (!has) return { verdict:'empty', key: exKeyText(section, q) };
  const key = exKeyText(section, q);
  const accepts = exAccepted(section, q).map(exNorm);
  const match = accepts.includes(exNorm(val));
  if (section.needsReview) {
    // Auto solo si coincide exacto con una respuesta aceptada; si no, el
    // sistema NO arriesga una nota: lo manda a revisión docente.
    return { verdict: match ? 'ok' : 'review', key };
  }
  return { verdict: match ? 'ok' : 'bad', key };
}
function exAccepted(section, q) {
  const base = Array.isArray(q.correct) ? q.correct : [q.correct];
  return q.accepted ? base.concat(q.accepted) : base;
}
function exKeyText(section, q) {
  if (Array.isArray(q.correct)) return q.correct.join(' / ');
  // mc: mostrar el texto de la opción correcta, no solo el value
  if (q.opts) { const o = q.opts.find(o => o[0] === q.correct); return o ? o[1] : q.correct; }
  return q.correct;
}

// Recorre todas las preguntas calificables del examen.
function examQuestions(exam) {
  const list = [];
  exam.sections.forEach(s => {
    if (s.type === 'matching') {
      // El payload público del estudiante elimina deliberadamente `answers`
      // porque contiene la clave correcta del matching. El renderer solo
      // necesita los identificadores para contar progreso; la clave puede
      // permanecer ausente hasta la revisión docente.
      const answerMap = s.answers && typeof s.answers === 'object' ? s.answers : {};
      (s.left || []).forEach(row => list.push({ section:s, q:{ id:s.letter+row.n, n:row.n, correct:answerMap[row.n] }, kind:'match' }));
    } else if (s.type === 'table-fill') {
      (s.rows||[]).filter(row => !row.fixed).forEach(row => list.push({ section:s, q:{ id:row.id, correct:row.correct, accepted:row.accepted }, kind:'q' }));
    } else if (s.type === 'para-fill' || s.type === 'para-verb' || s.type === 'para-choice') {
      s.blanks.forEach(b => list.push({ section:s, q:b, kind:'blank' }));
    } else {
      (s.questions||[]).forEach(q => list.push({ section:s, q, kind:'q' }));
    }
  });
  return list;
}
// Las respuestas de matching se guardan en un único bucket por sección: la
// clave es la LETRA de la sección (F en I2, D en I1, etc.), no siempre 'F'.
function getMatchVal(answers, n, letter) {
  const bucket = answers && answers[letter || 'F'];
  return bucket ? bucket[n] : undefined;
}

// ── Inyección única del CSS del examen ────────────────────────────────────
function ExamStyles() {
  React.useEffect(() => {
    if (document.getElementById('exam-css')) return;
    const s = document.createElement('style');
    s.id = 'exam-css';
    s.textContent = EXAM_CSS;
    document.head.appendChild(s);
  }, []);
  return null;
}

// ──────────────────────────────────────────────────────────────────────────
// ExamShell — render completo del examen
//   exam, answers, onAnswer(id,val), mode: 'student'|'review'|'preview',
//   showKey, shell:'premium'|'compact'|'sheet', density:'comfy'|'compact',
//   review: { marks, setMark, comments, setComment }  (solo mode==='review')
//   meta: { nombre, fecha, scoreLabel }
// ──────────────────────────────────────────────────────────────────────────
function ExamShell({ exam, answers={}, onAnswer, mode='student', showKey=false,
                     shell='premium', density='comfy', review, meta={}, plan='ambos', onOpenScript, onOpenVideo }) {
  const tema = NIVEL_TEMA[exam.nivel];
  const ro = mode !== 'student';
  const rootStyle = { '--lvl':tema.color, '--lvl-ink':tema.ink, '--lvl-soft':tema.soft };
  return (
    <div className={`ex-shell exh-${shell} dens-${density} mode-${mode}${showKey?' show-key':''}`} style={rootStyle}>
      <ExamStyles />
      {/* HEADER — academia (discreto) + color de nivel dominante */}
      <header className="exh">
        <div className="exh-main">
          <div className="exh-brand">
            <img className="exh-logo" src="../assets/logo_circular.jpg" alt="Academia Norteamericana" />
            <span className="exh-org">Academia Norteamericana <i>· Programa Inglés Conversacional</i></span>
          </div>
          <div className="exh-kicker">{tema.nombre.toUpperCase()}</div>
          <h1 className="exh-title">{exam.titulo}</h1>
          <div className="exh-sub">{exam.subtitulo}</div>
          <div className="exh-official">Documento oficial de evaluación · Campus Virtual</div>
          {exam.ponderacion_por_plan && (
            <div className="exh-pond">{window.ponderacionTexto(exam.ponderacion_por_plan, plan)}</div>
          )}
          {/* Atribución del material: mínima y SOLO en admin/preview/profesor. */}
          {showKey && <div className="exh-attr">{exam.atribucion}</div>}
        </div>
        <div className="exh-side">
          <span className="exh-lvlbadge">{tema.code}</span>
          <span className="exh-points">{exam.puntos_totales} pts</span>
          <span className={`exh-opt opt-${meta.opcion||'A'}`}>Opción {meta.opcion||'A'}</span>
        </div>
      </header>

      {/* META BAR */}
      <div className="exm">
        <div className="exm-f"><span className="exm-l">Estudiante</span><span className="exm-v">{meta.nombre || '—'}</span></div>
        <div className="exm-f"><span className="exm-l">Fecha</span><span className="exm-v">{meta.fecha || '—'}</span></div>
        <div className="exm-f"><span className="exm-l">Grupo</span><span className="exm-v">{meta.grupo || '—'}</span></div>
        <div className="exm-spacer" />
        <div className="exm-total">{meta.scoreLabel || `— / ${exam.puntos_totales}`}</div>
      </div>

      {/* BODY */}
      <div className="exb">
        {exam.sections.map(sec => (
          <Section key={sec.letter} sec={sec} exam={exam} answers={answers} onAnswer={onAnswer}
                   ro={ro} mode={mode} showKey={showKey} review={review}
                   onOpenScript={onOpenScript} onOpenVideo={onOpenVideo} />
        ))}
      </div>
      <footer className="ex-footer"><span>Academia Norteamericana · Programa Inglés Conversacional</span><span>Documento institucional · Campus Virtual</span></footer>
    </div>
  );
}

// ── Una sección ────────────────────────────────────────────────────────────
function Section({ sec, exam, answers, onAnswer, ro, mode, showKey, review, onOpenScript, onOpenVideo }) {
  return (
    <section className="exs">
      <div className="exs-h">
        <div className="exs-letter">{sec.letter}</div>
        <div className="exs-info">
          <div className="exs-instr">{sec.instruction}</div>
          <div className="exs-meta">
            <span className="exs-pts">{sec.points} {sec.points===1?'punto':'puntos'}</span>
            {sec.per && <span className="exs-per">· {sec.per}</span>}
            {sec.needsReview && showKey && <span className="exs-rev">requiere revisión</span>}
          </div>
        </div>
      </div>

      {/* Listening: video embebido del mapa maestro (sección A/B del audio,
          distinta de la opción A/B del examen). Guion solo si showKey. */}
      {sec.listening && (
        <ListeningMedia exam={exam} sec={sec} showKey={showKey} onOpenScript={onOpenScript} />
      )}

      <SectionBody sec={sec} answers={answers} onAnswer={onAnswer} ro={ro} mode={mode} showKey={showKey} review={review} />
    </section>
  );
}

// ── Media de listening: iframe de YouTube o fallback ──────────────────────
function ListeningMedia({ exam, sec, showKey, onOpenScript }) {
  const id = exam.videos ? exam.videos['listening_' + sec.listening] : null;
  return (
    <div className="exs-listen">
      <div className="exl-row">
        <span className="exl-tag">Listening · Sección {sec.listening}</span>
        {showKey && <button className="exl-script" onClick={()=>onOpenScript && onOpenScript(sec.listening)}>Ver guion (docente)</button>}
      </div>
      {id
        ? <div className="exl-video">
            <iframe src={`https://www.youtube.com/embed/${id}`} title={`Listening Sección ${sec.listening}`}
                    frameBorder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen></iframe>
          </div>
        : <span className="exl-pending">♪ Audio pendiente de publicar</span>}
    </div>
  );
}

// ── Cuerpo por tipo ──────────────────────────────────────────────────────
function SectionBody({ sec, answers, onAnswer, ro, mode, showKey, review }) {
  switch (sec.type) {
    case 'listening-mc':
    case 'mc-inline':
      return <div className={sec.type==='mc-inline'?'exq-list':'exq-grid'}>
        {sec.questions.map(q => <MCQ key={q.id} sec={sec} q={q} answers={answers} onAnswer={onAnswer} ro={ro} mode={mode} showKey={showKey} review={review} inline={sec.type==='mc-inline'} />)}
      </div>;
    case 'error-correction':
      return <div className="exq-rows">{sec.questions.map(q => <ErrQ key={q.id} sec={sec} q={q} answers={answers} onAnswer={onAnswer} ro={ro} mode={mode} showKey={showKey} review={review} />)}</div>;
    case 'para-fill':
    case 'para-verb':
      return <ParaFill sec={sec} answers={answers} onAnswer={onAnswer} ro={ro} mode={mode} showKey={showKey} review={review} />;
    case 'para-choice':
      return <ParaChoice sec={sec} answers={answers} onAnswer={onAnswer} ro={ro} mode={mode} showKey={showKey} review={review} />;
    case 'matching':
      return <Matching sec={sec} answers={answers} onAnswer={onAnswer} ro={ro} mode={mode} showKey={showKey} review={review} />;
    case 'table-fill':
      return <TableFill sec={sec} answers={answers} onAnswer={onAnswer} ro={ro} mode={mode} showKey={showKey} review={review} />;
    case 'short-write':
      return <ShortWrite sec={sec} answers={answers} onAnswer={onAnswer} ro={ro} mode={mode} showKey={showKey} review={review} />;
    case 'reading-tf':
      return <ReadingTF sec={sec} answers={answers} onAnswer={onAnswer} ro={ro} mode={mode} showKey={showKey} review={review} />;
    case 'verb-fill':
      return <div className="exq-rows">{sec.questions.map(q => <VerbFill key={q.id} sec={sec} q={q} answers={answers} onAnswer={onAnswer} ro={ro} mode={mode} showKey={showKey} review={review} />)}</div>;
    case 'transform':
      return <Transform sec={sec} answers={answers} onAnswer={onAnswer} ro={ro} mode={mode} showKey={showKey} review={review} />;
    case 'arrange':
      return <Arrange sec={sec} answers={answers} onAnswer={onAnswer} ro={ro} mode={mode} showKey={showKey} review={review} />;
    case 'dialog-verb':
      return <div>
        {sec.box && <div className="exbox-words">{sec.box.map(w => <span key={w}>{w}</span>)}</div>}
        <div className="exq-rows">{sec.questions.map(q => <DialogVerb key={q.id} sec={sec} q={q} answers={answers} onAnswer={onAnswer} ro={ro} mode={mode} showKey={showKey} review={review} />)}</div>
      </div>;
    default: return null;
  }
}

// ── Review affordance (pregunta por pregunta) ─────────────────────────────
function ReviewBar({ id, section, q, val, review }) {
  const ev = q.correct !== undefined || q.opts ? evalQuestion(section, q, val) : { verdict:'empty', key:'' };
  const verdictMeta = {
    ok:    { t:'Auto: correcta',  c:'rev-ok'   },
    bad:   { t:'Auto: incorrecta',c:'rev-bad'  },
    review:{ t:'Requiere revisión',c:'rev-rev' },
    empty: { t:'Sin responder',   c:'rev-empty'},
  }[ev.verdict];
  const mark = review.marks[id];
  const auto = ev.verdict === 'ok' ? 1 : 0;
  const cur = mark == null ? auto : mark;
  const open = review.openComment === id;
  return (
    <div className="exrev">
      <span className={`exrev-v ${verdictMeta.c}`}>{verdictMeta.t}</span>
      <span className="exrev-key">Clave: <b>{ev.key || '—'}</b></span>
      <div className="exrev-pts">
        {[0, 0.5, 1].map(p => (
          <button key={p} disabled={!!review.locked} className={`exrev-p${cur===p?' on':''}`} onClick={()=>review.setMark(id, p)}>{p}</button>
        ))}
      </div>
      <button disabled={!!review.locked} className={`exrev-cbtn${review.comments[id]?' has':''}`} onClick={()=>review.setOpenComment(open?null:id)}>
        {review.comments[id] ? '✎ comentario' : '+ comentario'}
      </button>
      {open && (
        <textarea className="exrev-c" disabled={!!review.locked} autoFocus placeholder="Comentario para el estudiante…"
          value={review.comments[id]||''} onChange={e=>review.setComment(id, e.target.value)} />
      )}
    </div>
  );
}

// ── Multiple choice (listening + inline) ──────────────────────────────────
function MCQ({ sec, q, answers, onAnswer, ro, mode, showKey, review, inline }) {
  const val = answers[q.id];
  return (
    <div className="exq">
      <div className="exq-stem"><span className="exq-num">{q.id.replace(/^[A-Z]/,'')}</span>{q.stem}</div>
      <div className={`exopts${inline?' exopts-row':''}`}>
        {q.opts.map(([v, label]) => {
          const chosen = val === v;
          const isKey = q.correct === v;
          let cls = 'exopt';
          if (chosen) cls += ' chosen';
          if (showKey && isKey) cls += ' is-correct';
          if (showKey && chosen && !isKey) cls += ' chosen-wrong';
          return (
            <label key={v} className={cls}>
              <input type="radio" name={q.id} value={v} checked={!!chosen} disabled={ro}
                     onChange={()=>onAnswer && onAnswer(q.id, v)} />
              <span className="exbox" />
              <span className="exopt-t">{label}</span>
            </label>
          );
        })}
      </div>
      {mode==='review' && <ReviewBar id={q.id} section={sec} q={q} val={val} review={review} />}
    </div>
  );
}

// ── Error correction ──────────────────────────────────────────────────────
function ErrQ({ sec, q, answers, onAnswer, ro, mode, showKey, review }) {
  const val = answers[q.id] || '';
  return (
    <div className="exrow">
      <span className="exrow-n">{q.id.replace(/^[A-Z]/,'')}</span>
      <span className="exrow-txt" dangerouslySetInnerHTML={{ __html: q.html }} />
      <span className="exrow-arrow">→</span>
      <span className="exrow-ans">
        <input className={exInCls(sec,q,val,showKey)} value={val} disabled={ro}
               placeholder="palabra correcta…" onChange={e=>onAnswer && onAnswer(q.id, e.target.value)} />
        {showKey && <span className="exkey">{q.correct}</span>}
      </span>
      {mode==='review' && <div className="exrow-rev"><ReviewBar id={q.id} section={sec} q={q} val={val} review={review} /></div>}
    </div>
  );
}

// ── Paragraph fill (word choice / verb form) ──────────────────────────────
function ParaFill({ sec, answers, onAnswer, ro, mode, showKey, review }) {
  const byId = {}; sec.blanks.forEach(b => byId[b.id] = b);
  return (
    <div>
      {sec.box && <div className="exbox-words">{sec.box.map(w => <span key={w}>{w}</span>)}</div>}
      <div className="expara">
        {sec.template.map((node, i) => {
          if (typeof node === 'string') return <span key={i}>{node}</span>;
          const b = byId[node.b]; const val = answers[b.id] || '';
          return (
            <span key={i} className="exfill-wrap">
              <input className={`exfill ${exInCls(sec,b,val,showKey)}`} value={val} disabled={ro}
                     placeholder={`(${b.hint})`} title={b.hint} onChange={e=>onAnswer && onAnswer(b.id, e.target.value)} />
              <span className="exfill-n">{b.id.replace(/^[A-Z]/,'')}</span>
              {showKey && <span className="exkey exkey-inline">{exKeyText(sec,b)}</span>}
            </span>
          );
        })}
      </div>
      {mode==='review' && <div className="exq-rows" style={{marginTop:14}}>
        {sec.blanks.map(b => <div key={b.id} className="exrev-line"><span className="exrev-id">{b.id}</span><span className="exrev-stud">Resp.: <b>{answers[b.id]||'—'}</b></span><ReviewBar id={b.id} section={sec} q={b} val={answers[b.id]} review={review} /></div>)}
      </div>}
    </div>
  );
}

// ── Paragraph choice (inline word-choice select) ──────────────────────────
function ParaChoice({ sec, answers, onAnswer, ro, mode, showKey, review }) {
  const byId = {}; sec.blanks.forEach(b => byId[b.id] = b);
  return (
    <div>
      <div className="expara">
        {sec.template.map((node, i) => {
          if (typeof node === 'string') return <span key={i}>{node}</span>;
          const b = byId[node.b]; const val = answers[b.id] || '';
          let cls = 'exchoice';
          if (showKey && val) cls += (val === b.correct ? ' ch-ok' : ' ch-bad');
          return (
            <span key={i} className="exfill-wrap">
              <select className={cls} value={val} disabled={ro} onChange={e=>onAnswer && onAnswer(b.id, e.target.value)}>
                <option value="">— elegir —</option>
                {b.opts.map(([v,label]) => <option key={v} value={v}>{label}</option>)}
              </select>
              <span className="exfill-n">{b.id.replace(/^[A-Z]/,'')}</span>
              {showKey && <span className="exkey exkey-inline">{exKeyText(sec,b)}</span>}
            </span>
          );
        })}
      </div>
      {mode==='review' && <div className="exq-rows" style={{marginTop:14}}>
        {sec.blanks.map(b => <div key={b.id} className="exrev-line"><span className="exrev-id">{b.id}</span><span className="exrev-stud">Resp.: <b>{answers[b.id]||'—'}</b></span><ReviewBar id={b.id} section={sec} q={b} val={answers[b.id]} review={review} /></div>)}
      </div>}
    </div>
  );
}

// ── Matching ──────────────────────────────────────────────────────────────
function Matching({ sec, answers, onAnswer, ro, mode, showKey, review }) {
  // En la vista estudiante la clave `sec.answers` no viaja desde Apps Script.
  // Nunca debe ser requisito para dibujar ni responder el ejercicio.
  const answerMap = sec.answers && typeof sec.answers === 'object' ? sec.answers : {};
  const setMatch = (n, v) => {
    const F = Object.assign({}, answers[sec.letter] || {}); F[n] = v; onAnswer && onAnswer(sec.letter, F);
  };
  return (
    <div>
      <div className="exmatch">
        <div className="exmatch-col">
          {sec.left.map(row => {
            const val = getMatchVal(answers, row.n, sec.letter) || '';
            const correct = answerMap[row.n];
            let cls = 'exmatch-item';
            if (showKey && val && val===correct) cls += ' m-ok';
            if (showKey && val && val!==correct) cls += ' m-bad';
            return (
              <div key={row.n} className={cls}>
                <span className="exmatch-n">{row.n}</span>
                <span className="exmatch-t">{row.text}</span>
                <select className="exmatch-sel" value={val} disabled={ro} onChange={e=>setMatch(row.n, e.target.value)}>
                  <option value="">—</option>
                  {sec.right.map(r => <option key={r.l} value={r.l}>{r.l}</option>)}
                </select>
                {showKey && correct && <span className="exmatch-key">{correct}</span>}
              </div>
            );
          })}
        </div>
        <div className="exmatch-col">
          {sec.right.map(r => (
            <div key={r.l} className="exmatch-item exmatch-r">
              <span className="exmatch-l">{r.l}</span>
              <span className="exmatch-t">{r.text}</span>
            </div>
          ))}
        </div>
      </div>
      {mode==='review' && <div className="exq-rows" style={{marginTop:14}}>
        {sec.left.map(row => { const val=getMatchVal(answers,row.n,sec.letter); const q={ id:sec.letter+row.n, correct:answerMap[row.n] };
          return <div key={row.n} className="exrev-line"><span className="exrev-id">{sec.letter}{row.n}</span><span className="exrev-stud">Resp.: <b>{val||'—'}</b></span><ReviewBar id={sec.letter+row.n} section={sec} q={q} val={val} review={review} /></div>; })}
      </div>}
    </div>
  );
}


// ── Table fill (chart: subject → possessive, etc.) ───────────────────────
function TableFill({ sec, answers, onAnswer, ro, mode, showKey, review }) {
  return (
    <div>
      <div className="extable-wrap">
        <table className="extable">
          <thead><tr>{sec.headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {sec.rows.map(row => {
              const val = answers[row.id] || '';
              const q = { id: row.id, correct: row.correct, accepted: row.accepted };
              return (
                <tr key={row.id}>
                  <td>{row.left}</td>
                  <td>
                    {row.fixed
                      ? <span className="extable-fixed">{row.fixed}</span>
                      : <input className={'extable-in ' + exInCls(sec, q, val, showKey)} value={val} disabled={ro}
                               placeholder="respuesta…" onChange={e=>onAnswer && onAnswer(row.id, e.target.value)} />}
                    {showKey && !row.fixed && <span className="exkey exkey-inline">{exKeyText(sec,q)}</span>}
                  </td>
                  {mode==='review' && !row.fixed && <td className="extable-rev"><ReviewBar id={row.id} section={sec} q={q} val={val} review={review} /></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sec.note && showKey && <div className="ex-note">{sec.note}</div>}
    </div>
  );
}

// ── Short written answer (questions/prompts) ─────────────────────────────
function ShortWrite({ sec, answers, onAnswer, ro, mode, showKey, review }) {
  return (
    <div className="exq-rows">
      {sec.questions.map(q => {
        const val = answers[q.id] || '';
        return (
          <div key={q.id} className="exshort">
            <span className="exrow-n">{q.id.replace(/^[A-Z]/,'')}</span>
            <div className="exshort-body">
              {q.prompt && <div className="exshort-prompt" dangerouslySetInnerHTML={{ __html:q.prompt }} />}
              <input className={'exshort-in ' + exInCls(sec, q, val, showKey)} value={val} disabled={ro}
                     placeholder={q.placeholder || 'Escribe la respuesta…'} onChange={e=>onAnswer && onAnswer(q.id, e.target.value)} />
              {showKey && <span className="exkey exkey-inline">{exKeyText(sec,q)}</span>}
              {mode==='review' && <ReviewBar id={q.id} section={sec} q={q} val={val} review={review} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Reading + True/False ──────────────────────────────────────────────────
function ReadingTF({ sec, answers, onAnswer, ro, mode, showKey, review }) {
  return (
    <div>
      <article className="expass">
        <h3 className="expass-title">{sec.passageTitle}</h3>
        {sec.passage.map((p, i) => <p key={i}>{p}</p>)}
      </article>
      <div className="exq-rows">
        {sec.questions.map(q => {
          const val = answers[q.id];
          return (
            <div key={q.id} className="extf">
              <span className="exrow-n">{q.id.replace(/^[A-Z]/,'')}</span>
              <span className="extf-t">{q.text}</span>
              <div className="extf-btns">
                {['T','F'].map(v => {
                  const chosen = val===v; const isKey = q.correct===v;
                  let cls='extf-b';
                  if (chosen) cls += ' sel-'+v;
                  if (showKey && isKey) cls += ' tf-key';
                  if (showKey && chosen && !isKey) cls += ' tf-wrong';
                  return <button key={v} className={cls} disabled={ro} onClick={()=>onAnswer && onAnswer(q.id, v)}>{v}</button>;
                })}
              </div>
              {mode==='review' && <div className="exrow-rev"><ReviewBar id={q.id} section={sec} q={q} val={val} review={review} /></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Verb fill (single line) ───────────────────────────────────────────────
function VerbFill({ sec, q, answers, onAnswer, ro, mode, showKey, review }) {
  const val = answers[q.id] || '';
  return (
    <div className="exrow exrow-2">
      <span className="exrow-n">{q.id.replace(/^[A-Z]/,'')}</span>
      <span className="exrow-txt">
        {q.pre}{' '}
        <input className={`exfill ${exInCls(sec,q,val,showKey)}`} value={val} disabled={ro}
               placeholder={`(${q.hint})`} title={q.hint} onChange={e=>onAnswer && onAnswer(q.id, e.target.value)} />
        {' '}{q.post}
        {showKey && <span className="exkey exkey-inline">{exKeyText(sec,q)}</span>}
      </span>
      {mode==='review' && <div className="exrow-rev"><ReviewBar id={q.id} section={sec} q={q} val={val} review={review} /></div>}
    </div>
  );
}

// ── Dialog verb (A/B response) ────────────────────────────────────────────
function DialogVerb({ sec, q, answers, onAnswer, ro, mode, showKey, review }) {
  const val = answers[q.id] || '';
  const ph = q.hint ? `(${q.hint})` : 'forma verbal…';
  // Renderiza una línea que puede contener uno o varios ____ (la respuesta es
  // única, q.id); el blank puede estar en la línea A o en la B.
  const renderLine = (text) => {
    const parts = text.split('____');
    return parts.map((p, i) => (
      <React.Fragment key={i}>
        {p}
        {i < parts.length - 1 && (
          <input className={'exfill ' + exInCls(sec, q, val, showKey)} value={val} disabled={ro}
                 placeholder={ph} title={q.hint || ''} onChange={e => onAnswer && onAnswer(q.id, e.target.value)} />
        )}
      </React.Fragment>
    ));
  };
  return (
    <div className="exrow exrow-2 exrow-dlg">
      <span className="exrow-n">{q.id.replace(/^[A-Z]/,'')}</span>
      <div className="exdlg">
        <div className="exdlg-a"><b>A:</b> {renderLine(q.a)}</div>
        <div className="exdlg-b">
          <b>B:</b> {renderLine(q.b)}
          {showKey && <span className="exkey exkey-inline">{exKeyText(sec, q)}</span>}
        </div>
      </div>
      {mode==='review' && <div className="exrow-rev"><ReviewBar id={q.id} section={sec} q={q} val={val} review={review} /></div>}
    </div>
  );
}

// ── Transform (rewrite the sentence — e.g. active → passive) ──────────────
function Transform({ sec, answers, onAnswer, ro, mode, showKey, review }) {
  return (
    <div>
      {sec.example && (
        <div className="extrans-ex">
          <span className="extrans-exlbl">Ejemplo</span>
          <span className="extrans-exprompt">{sec.example.prompt}</span>
          <span className="extrans-exarrow">→</span>
          <span className="extrans-exans">{sec.example.answer}</span>
        </div>
      )}
      <div className="exq-rows">
        {sec.questions.map(q => {
          const val = answers[q.id] || '';
          return (
            <div key={q.id} className="extrans">
              <span className="exrow-n">{q.id.replace(/^[A-Z]/,'')}</span>
              <div className="extrans-body">
                <div className="extrans-prompt">{q.prompt}</div>
                <input className={`extrans-in ${exInCls(sec,q,val,showKey)}`} value={val} disabled={ro}
                       placeholder="Escribe la oración en voz pasiva…" onChange={e=>onAnswer && onAnswer(q.id, e.target.value)} />
                {showKey && <span className="exkey exkey-inline">{exKeyText(sec,q)}</span>}
                {mode==='review' && <ReviewBar id={q.id} section={sec} q={q} val={val} review={review} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ── Arrange words (write the sentence in correct order) ──────────────────
function Arrange({ sec, answers, onAnswer, ro, mode, showKey, review }) {
  return (
    <div className="exq-rows">
      {sec.questions.map(q => {
        const val = answers[q.id] || '';
        return (
          <div key={q.id} className="exarr">
            <span className="exrow-n">{q.id.replace(/^[A-Z]/,'')}</span>
            <div className="exarr-body">
              <div className="exarr-prompt">{q.prompt}</div>
              <input className={`exarr-in ${exInCls(sec,q,val,showKey)}`} value={val} disabled={ro}
                     placeholder="Ordena las palabras y escribe la oración…"
                     onChange={e=>onAnswer && onAnswer(q.id, e.target.value)} />
              {showKey && <span className="exkey exkey-inline">{exKeyText(sec,q)}</span>}
              {mode==='review' && <ReviewBar id={q.id} section={sec} q={q} val={val} review={review} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// input visual class in review/key mode
function exInCls(section, q, val, showKey) {
  if (!showKey || !val) return 'exin';
  const ev = evalQuestion(section, q, val);
  if (ev.verdict==='ok') return 'exin in-ok';
  if (ev.verdict==='bad') return 'exin in-bad';
  if (ev.verdict==='review') return 'exin in-rev';
  return 'exin';
}

Object.assign(window, {
  ExamShell, evalQuestion, examQuestions, getMatchVal, exNorm, exKeyText,
});
