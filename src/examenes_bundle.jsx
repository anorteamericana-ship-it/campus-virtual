// CAMPUS_F95_1_20260621_EXAMENES_BUNDLE_UNICO
// Generado desde: examenes_css.jsx, examenes_appcss.jsx, examenes_data.jsx, examenes_render.jsx, examenes_modes.jsx, examenes_app.jsx


// ===== examenes_css.jsx =====

/* examenes_css.jsx — CSS del motor de examen (inyectado una sola vez).
   Todo el color temático sale de --lvl / --lvl-ink / --lvl-soft (nivel).
   Marca: Academia Norteamericana (navy). Atribución Cambridge en texto. */
window.EXAM_CSS = `
.ex-shell{ font-family:var(--f-sans); color:var(--ink); --exfs:14px; --secgap:38px; --letter:42px; border-radius:16px; overflow:hidden; box-shadow:var(--sh-2); }
.dens-compact{ --exfs:12.5px; --secgap:22px; --letter:30px; }

/* ── HEADER ── */
.exh{ display:flex; justify-content:space-between; align-items:flex-start; gap:24px; position:relative; }
.exh-rail{ display:none; }
.exh-brand{ display:flex; align-items:center; gap:10px; margin-bottom:16px; }
.exh-logo{ width:44px; height:44px; border-radius:999px; background:#fff; object-fit:cover; border:1px solid var(--line); box-shadow:0 4px 12px rgba(12,40,75,.10); }
.exh-org{ font-size:13px; font-weight:800; letter-spacing:0.02em; display:flex; flex-direction:column; line-height:1.35; }
.exh-org i{ font-style:normal; opacity:0.6; font-weight:500; }
.exh-kicker{ font-family:var(--f-mono); font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:var(--lvl); margin-bottom:8px; }
.exh-title{ font-size:34px; font-weight:700; letter-spacing:-0.02em; line-height:1.04; margin:0 0 6px; }
.exh-sub{ font-size:13px; opacity:0.72; }
.exh-official{ margin-top:9px; font-family:var(--f-mono); font-size:9.5px; letter-spacing:.12em; text-transform:uppercase; color:var(--ink-3); }
.exh-pond{ display:inline-block; margin-top:8px; font-size:12px; font-weight:600; color:var(--lvl-ink); background:var(--lvl-soft); padding:4px 12px; border-radius:999px; }
.exh-attr{ font-family:var(--f-mono); font-size:10.5px; opacity:0.55; margin-top:16px; }
.exh-side{ display:flex; flex-direction:column; align-items:flex-end; gap:8px; flex-shrink:0; }
.exh-lvlbadge{ background:var(--lvl); color:#fff; font-weight:800; font-size:13px; padding:5px 11px; border-radius:7px; }
.exh-points{ font-family:var(--f-mono); font-size:12px; opacity:0.85; }
.exh-opt{ font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px; white-space:nowrap; }
.opt-A{ background:var(--lvl-soft); color:var(--lvl-ink); }
.opt-B{ background:rgba(255,255,255,0.14); color:#fff; border:1px dashed rgba(255,255,255,0.5); }

/* premium header — claro/académico, color de nivel dominante */
.exh-premium .exh{ background:#fff; color:var(--ink); padding:30px 38px 26px; border-top:7px solid var(--lvl); border-bottom:1px solid var(--line); }
.exh-premium .exh-org{ color:var(--ink-2); }
.exh-premium .exh-logo{ background:#fff; }
.exh-premium .exh-kicker{ color:var(--lvl-ink); }
.exh-premium .exh-title{ color:var(--an-navy-ink); }
.exh-premium .exh-sub{ color:var(--ink-2); opacity:1; }
.exh-premium .exh-attr{ opacity:1; color:var(--ink-3); }
.exh-premium .exh-lvlbadge{ background:var(--lvl); }
.exh-premium .exh-points{ color:var(--ink-2); }
.exh-premium .opt-A{ background:var(--lvl-soft); color:var(--lvl-ink); }
.exh-premium .opt-B{ background:#FBECE9; color:#8E1A12; border:1px dashed #E89A91; }
.exh-premium .exb{ background:var(--bg); padding:30px 34px 38px; }
.exh-premium .exs{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:22px 24px; box-shadow:var(--sh-1); }
.exh-premium .exs-h{ border-bottom:1px solid var(--line); }
.exh-premium .exs-letter{ width:46px; height:46px; font-size:25px; background:var(--lvl-soft); color:var(--lvl-ink); border-radius:11px; display:flex; align-items:center; justify-content:center; }

/* compact header */
.exh-compact .exh{ background:#fff; color:var(--ink); padding:20px 24px; border-bottom:1px solid var(--line); border-left:5px solid var(--lvl); }
.exh-compact .exh-kicker{ color:var(--lvl-ink); }
.exh-compact .exh-title{ font-size:23px; color:var(--an-navy-ink); }
.exh-compact .exh-sub{ opacity:1; color:var(--ink-2); }
.exh-compact .exh-attr{ opacity:1; color:var(--ink-3); }
.exh-compact .exh-lvlbadge,.exh-compact .exh-points{ color:#fff; }
.exh-compact .exh-points{ color:var(--ink-2); }
.exh-compact .opt-B{ background:#FBECE9; color:#8E1A12; border:1px dashed #E89A91; }
.exh-compact .exb{ background:var(--surface-2); padding:20px 22px 26px; }
.exh-compact .exs{ background:#fff; border:1px solid var(--line); border-radius:11px; padding:16px 18px; }
.exh-compact .exs-letter{ font-size:24px; width:28px; }
.exh-compact .exs-h{ border-bottom:1px solid var(--line); padding-bottom:9px; margin-bottom:12px; }

/* sheet header */
.exh-sheet .exh{ background:#fff; color:var(--ink); padding:30px 44px 22px; border-top:4px solid var(--lvl); border-bottom:2px solid var(--an-navy-ink); }
.exh-sheet .exh-kicker{ color:var(--lvl-ink); }
.exh-sheet .exh-title{ font-size:30px; color:var(--an-navy-ink); }
.exh-sheet .exh-sub{ opacity:1; color:var(--ink-2); }
.exh-sheet .exh-attr{ opacity:1; color:var(--ink-3); }
.exh-sheet .exh-lvlbadge,.exh-sheet .exh-points{ color:#fff; }
.exh-sheet .exh-points{ color:var(--ink-2); }
.exh-sheet .opt-B{ background:#FBECE9; color:#8E1A12; border:1px dashed #E89A91; }
.exh-sheet .exb{ background:#fff; padding:26px 44px 40px; }
.exh-sheet .exs-h{ border-bottom:1.5px solid var(--an-navy-ink); }
.exh-sheet .exs-letter{ color:var(--lvl); }

/* ── META BAR ── */
.exm{ display:flex; align-items:center; gap:26px; padding:14px 34px; background:var(--surface-2); border-bottom:1px solid var(--line); }
.exh-sheet .exm{ padding-left:44px; padding-right:44px; }
.exm-f{ display:flex; flex-direction:column; gap:2px; }
.exm-l{ font-family:var(--f-mono); font-size:9px; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-3); }
.exm-v{ font-size:13px; font-weight:500; }
.exm-spacer{ flex:1; }
.exm-total{ font-family:var(--f-mono); font-size:14px; font-weight:600; background:var(--an-navy); color:#fff; padding:7px 16px; border-radius:8px; }

/* ── BODY / SECTIONS ── */
.exb{ display:flex; flex-direction:column; gap:var(--secgap); }
.exs-h{ display:flex; gap:16px; align-items:flex-start; padding-bottom:12px; margin-bottom:16px; }
.exs-letter{ font-size:var(--letter); line-height:1; font-weight:800; color:var(--lvl); flex-shrink:0; text-align:center; }
.exs-info{ flex:1; }
.exs-instr{ font-size:calc(var(--exfs) + 0.5px); font-weight:500; line-height:1.45; color:var(--ink); }
.exs-meta{ margin-top:5px; font-family:var(--f-mono); font-size:10px; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink-3); display:flex; gap:6px; align-items:center; }
.exs-pts{ color:var(--lvl-ink); font-weight:600; }
.exs-rev{ background:#FBF1D8; color:#7B5600; padding:1px 8px; border-radius:999px; letter-spacing:0.04em; }

/* listening */
.exs-listen{ margin-bottom:16px; }
.exl-row{ display:flex; align-items:center; gap:10px; margin-bottom:10px; }
.exl-tag{ font-family:var(--f-mono); font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:var(--lvl-ink); background:var(--lvl-soft); padding:4px 10px; border-radius:6px; font-weight:600; }
.exl-video{ position:relative; width:100%; max-width:520px; aspect-ratio:16/9; border-radius:11px; overflow:hidden; background:#000; box-shadow:var(--sh-1); }
.exl-video iframe{ position:absolute; inset:0; width:100%; height:100%; border:0; }
.exl-pending{ display:inline-flex; align-items:center; gap:8px; background:var(--bg-deep); color:var(--ink-2); font-size:12px; padding:9px 16px; border-radius:9px; border:1px dashed var(--line-2); }
.exl-script{ background:transparent; border:1px solid var(--line-2); color:var(--ink-2); padding:6px 12px; border-radius:8px; font-size:11.5px; cursor:pointer; }
.exl-script:hover{ border-color:var(--an-navy); color:var(--an-navy); }

/* questions */
.exq-grid{ display:grid; grid-template-columns:1fr 1fr; gap:22px; }
.exq-list{ display:flex; flex-direction:column; gap:18px; }
.exq-rows{ display:flex; flex-direction:column; gap:10px; }
.dens-compact .exq-grid{ gap:14px; }
.dens-compact .exq-list{ gap:12px; }
.exq-stem{ font-size:var(--exfs); line-height:1.5; margin-bottom:10px; font-weight:500; }
.exq-num{ font-family:var(--f-mono); font-size:11px; background:var(--an-navy); color:#fff; padding:1px 7px; border-radius:5px; margin-right:7px; }

/* options */
.exopts{ display:flex; flex-direction:column; gap:8px; }
.exopts-row{ flex-direction:row; flex-wrap:wrap; }
.exopts-row .exopt{ flex:1; min-width:130px; }
.exopt{ display:flex; align-items:center; gap:10px; padding:8px 12px; border:1px solid var(--line); border-radius:8px; background:#fff; font-size:calc(var(--exfs) - 0.5px); cursor:pointer; transition:border-color .15s, background .15s; user-select:none; }
.mode-student .exopt:hover{ border-color:var(--lvl); background:var(--lvl-soft); }
.mode-review .exopt,.mode-preview .exopt{ cursor:default; }
.exopt input{ display:none; }
.exbox{ width:18px; height:18px; border:2px solid var(--line-2); border-radius:5px; flex-shrink:0; display:flex; align-items:center; justify-content:center; transition:.15s; }
.exopt.chosen .exbox{ background:var(--an-navy); border-color:var(--an-navy); }
.exopt.chosen .exbox::after{ content:'✓'; color:#fff; font-size:11px; }
.exopt.chosen .exopt-t{ font-weight:600; }
.exopt.is-correct{ background:var(--lvl-soft); border-color:var(--lvl); }
.exopt.is-correct .exbox{ background:var(--lvl); border-color:var(--lvl); }
.exopt.is-correct .exbox::after{ content:'✓'; color:#fff; font-size:11px; }
.exopt.chosen-wrong{ background:#FCE6E4; border-color:var(--danger); }
.exopt.chosen-wrong .exbox{ background:var(--danger); border-color:var(--danger); }
.exopt.chosen-wrong .exbox::after{ content:'✕'; color:#fff; font-size:10px; }

/* inputs */
.exin{ border:none; border-bottom:2px solid var(--line-2); background:transparent; font-family:var(--f-sans); font-size:var(--exfs); padding:3px 4px; min-width:150px; outline:none; color:var(--an-navy-ink); }
.exin:focus{ border-bottom-color:var(--lvl); }
.exin:disabled{ color:var(--ink); -webkit-text-fill-color:var(--ink); opacity:1; cursor:default; }
.exin.in-ok{ border-bottom-color:var(--ok); }
.exin.in-bad{ border-bottom-color:var(--danger); }
.exin.in-rev{ border-bottom-color:var(--warn); }
.exfill{ font-family:var(--f-mono); font-size:calc(var(--exfs) - 1px); min-width:120px; color:var(--an-navy); }
.exkey{ font-family:var(--f-mono); font-size:11px; color:var(--ok); background:#E2F1E5; padding:1px 7px; border-radius:5px; margin-left:8px; white-space:nowrap; }
.exkey-inline{ margin-left:6px; }

/* error rows */
.exrow{ display:grid; grid-template-columns:30px 1fr 26px minmax(160px,0.9fr); gap:12px; align-items:center; padding:11px 14px; border:1px solid var(--line); border-radius:10px; background:#fff; font-size:var(--exfs); line-height:1.5; }
.exrow-2{ grid-template-columns:30px 1fr; }
.exrow-n{ font-family:var(--f-mono); font-size:11px; background:var(--an-navy); color:#fff; padding:2px 6px; border-radius:5px; text-align:center; align-self:start; }
.exrow-arrow{ color:var(--ink-3); text-align:center; }
.exrow-txt u{ text-decoration-color:var(--danger); text-underline-offset:2px; }
.exrow-ans{ display:flex; align-items:center; }
.exrow-rev{ grid-column:1 / -1; }

/* matching */
.exmatch{ display:grid; grid-template-columns:1fr 1fr; gap:26px; }
.exmatch-col{ display:flex; flex-direction:column; gap:9px; }
.exmatch-item{ display:flex; align-items:center; gap:10px; padding:9px 12px; border:1px solid var(--line); border-radius:9px; background:#fff; font-size:calc(var(--exfs) - 0.5px); }
.exmatch-n{ font-family:var(--f-mono); font-size:11px; background:var(--an-navy); color:#fff; padding:2px 6px; border-radius:5px; flex-shrink:0; }
.exmatch-l{ font-family:var(--f-mono); font-size:11px; background:var(--lvl); color:#fff; padding:2px 7px; border-radius:5px; flex-shrink:0; }
.exmatch-t{ flex:1; }
.exmatch-sel{ font-family:var(--f-mono); font-size:13px; border:1px solid var(--line-2); border-radius:6px; padding:4px 8px; background:var(--surface-2); cursor:pointer; }
.exmatch-key{ font-family:var(--f-mono); font-size:11px; color:var(--ok); }
.exmatch-item.m-ok{ border-color:var(--ok); background:#F1F8F2; }
.exmatch-item.m-bad{ border-color:var(--danger); background:#FCF1F0; }

/* reading + tf */
.expass{ background:var(--surface-2); border:1px solid var(--line); border-left:4px solid var(--lvl); border-radius:10px; padding:20px 24px; margin-bottom:16px; column-count:2; column-gap:28px; font-size:calc(var(--exfs) - 1px); line-height:1.7; }
.expass-title{ font-size:17px; font-weight:700; color:var(--an-navy-ink); margin:0 0 10px; column-span:all; }
.expass p{ margin:0 0 10px; break-inside:avoid; }
.extf{ display:flex; align-items:center; gap:14px; padding:10px 14px; border:1px solid var(--line); border-radius:9px; background:#fff; font-size:var(--exfs); flex-wrap:wrap; }
.extf-t{ flex:1; }
.extf-btns{ display:flex; gap:6px; }
.extf-b{ font-family:var(--f-mono); font-weight:600; padding:4px 14px; border:2px solid var(--line-2); border-radius:6px; background:transparent; cursor:pointer; color:var(--ink); }
.mode-student .extf-b:hover{ border-color:var(--lvl); }
.extf-b.sel-T{ background:var(--an-navy); border-color:var(--an-navy); color:#fff; }
.extf-b.sel-F{ background:var(--an-navy); border-color:var(--an-navy); color:#fff; }
.extf-b.tf-key{ background:var(--lvl); border-color:var(--lvl); color:#fff; }
.extf-b.tf-wrong{ background:var(--danger); border-color:var(--danger); color:#fff; }

/* paragraph */
.expara{ background:#fff; border:1px solid var(--line); border-radius:10px; padding:20px 24px; font-size:var(--exfs); line-height:2.5; }
.exfill-wrap{ white-space:nowrap; }
.exfill-n{ font-family:var(--f-mono); font-size:9px; color:var(--ink-3); vertical-align:super; margin-left:2px; }
.exchoice{ font-family:var(--f-sans); font-size:calc(var(--exfs) - 0.5px); border:1px solid var(--line-2); border-radius:6px; padding:3px 6px; background:var(--surface-2); color:var(--an-navy-ink); cursor:pointer; vertical-align:baseline; }
.exchoice:focus{ outline:2px solid var(--lvl); }
.exchoice:disabled{ opacity:1; cursor:default; }
.exchoice.ch-ok{ border-color:var(--ok); background:#F1F8F2; }
.exchoice.ch-bad{ border-color:var(--danger); background:#FCF1F0; }

/* word box (J) */
.exbox-words{ display:flex; flex-wrap:wrap; gap:18px; background:var(--surface-2); border:1px solid var(--line); border-radius:9px; padding:12px 18px; margin-bottom:14px; font-family:var(--f-mono); font-size:13px; color:var(--an-navy-ink); }

/* dialog */
.exdlg-a{ color:var(--ink-3); font-size:calc(var(--exfs) - 0.5px); margin-bottom:3px; }
.exdlg-b{ font-size:var(--exfs); line-height:1.9; }
.exrow-dlg{ align-items:start; }

/* transform (rewrite → passive) */
.extrans-ex{ display:flex; flex-wrap:wrap; align-items:center; gap:10px; background:var(--surface-2); border:1px solid var(--line); border-radius:9px; padding:10px 16px; margin-bottom:14px; font-size:calc(var(--exfs) - 0.5px); }
.extrans-exlbl{ font-family:var(--f-mono); font-size:10px; text-transform:uppercase; letter-spacing:.06em; background:var(--an-navy); color:#fff; padding:2px 8px; border-radius:5px; }
.extrans-exprompt{ color:var(--ink-3); }
.extrans-exarrow{ color:var(--ink-3); }
.extrans-exans{ font-weight:600; color:var(--an-navy-ink); }
.extrans{ display:grid; grid-template-columns:30px 1fr; gap:12px; align-items:start; padding:11px 14px; border:1px solid var(--line); border-radius:10px; background:#fff; }
.extrans-body{ display:flex; flex-direction:column; gap:7px; }
.extrans-prompt{ font-size:var(--exfs); color:var(--an-navy-ink); }
.extrans-in{ width:100%; font-family:inherit; font-size:var(--exfs); padding:7px 10px; border:1px solid var(--line-2); border-radius:7px; background:var(--surface-2); }
.extrans-in:focus{ outline:none; border-color:var(--lvl); background:#fff; }



/* table fill (charts) */
.extable-wrap{ background:#fff; border:1px solid var(--line); border-radius:10px; overflow:auto; }
.extable{ width:100%; border-collapse:collapse; font-size:var(--exfs); }
.extable th{ text-align:left; background:var(--surface-2); color:var(--an-navy-ink); padding:10px 14px; border-bottom:1px solid var(--line); }
.extable td{ padding:10px 14px; border-bottom:1px solid var(--line); vertical-align:top; }
.extable tr:last-child td{ border-bottom:none; }
.extable-fixed{ font-weight:700; color:var(--an-navy-ink); }
.extable-in{ min-width:180px; font-family:inherit; font-size:var(--exfs); padding:7px 10px; border:1px solid var(--line-2); border-radius:7px; background:var(--surface-2); }
.extable-in:focus{ outline:none; border-color:var(--lvl); background:#fff; }
.extable-rev{ min-width:360px; }
.ex-note{ margin-top:10px; padding:8px 10px; border:1px dashed var(--line-2); border-radius:8px; background:var(--surface-2); color:var(--ink-2); font-size:12px; }

/* short written answer */
.exshort{ display:grid; grid-template-columns:30px 1fr; gap:12px; align-items:start; padding:11px 14px; border:1px solid var(--line); border-radius:10px; background:#fff; }
.exshort-body{ display:flex; flex-direction:column; gap:7px; }
.exshort-prompt{ color:var(--ink-2); font-size:calc(var(--exfs) - 0.5px); }
.exshort-in{ width:100%; font-family:inherit; font-size:var(--exfs); padding:7px 10px; border:1px solid var(--line-2); border-radius:7px; background:var(--surface-2); }
.exshort-in:focus{ outline:none; border-color:var(--lvl); background:#fff; }

/* ── REVIEW (pregunta por pregunta) ── */
.exrev{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-top:10px; padding:8px 10px; background:var(--surface-2); border:1px dashed var(--line-2); border-radius:8px; }
.exrev-v{ font-size:11px; font-weight:700; padding:2px 9px; border-radius:999px; }
.rev-ok{ background:#E2F1E5; color:var(--ok); }
.rev-bad{ background:#FCE6E4; color:var(--danger); }
.rev-rev{ background:#FBF1D8; color:#7B5600; }
.rev-empty{ background:var(--bg-deep); color:var(--ink-3); }
.exrev-key{ font-size:11.5px; color:var(--ink-2); }
.exrev-key b{ font-family:var(--f-mono); color:var(--ok); }
.exrev-pts{ display:flex; gap:3px; margin-left:auto; }
.exrev-p{ min-width:30px; height:26px; border:1px solid var(--line-2); background:#fff; border-radius:6px; font-family:var(--f-mono); font-size:12px; cursor:pointer; }
.exrev-p.on{ background:var(--an-navy); color:#fff; border-color:var(--an-navy); }
.exrev-cbtn{ background:transparent; border:1px solid var(--line-2); border-radius:6px; padding:5px 9px; font-size:11px; cursor:pointer; color:var(--ink-2); }
.exrev-cbtn.has{ border-color:var(--lvl); color:var(--lvl-ink); background:var(--lvl-soft); }
.exrev-c{ width:100%; margin-top:0; border:1px solid var(--line-2); border-radius:6px; padding:7px 9px; font-family:var(--f-sans); font-size:12px; resize:vertical; min-height:46px; }
.exrev-line{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:8px 10px; border:1px solid var(--line); border-radius:8px; background:#fff; }
.exrev-line .exrev{ flex:1; margin-top:0; border:none; background:transparent; padding:0; }
.exrev-id{ font-family:var(--f-mono); font-size:11px; background:var(--an-navy); color:#fff; padding:2px 7px; border-radius:5px; }
.exrev-stud{ font-size:12px; color:var(--ink-2); }
.exrev-stud b{ font-family:var(--f-mono); }

.exarr{ display:grid; grid-template-columns:30px 1fr; gap:12px; align-items:start; padding:11px 14px; border:1px solid var(--line); border-radius:10px; background:#fff; }
.exarr-body{ display:flex; flex-direction:column; gap:7px; }
.exarr-prompt{ font-family:var(--f-mono); font-size:calc(var(--exfs) - 1px); color:var(--an-navy-ink); background:var(--surface-2); border:1px solid var(--line); border-radius:7px; padding:7px 9px; }
.exarr-in{ width:100%; font-family:inherit; font-size:var(--exfs); padding:7px 10px; border:1px solid var(--line-2); border-radius:7px; background:var(--surface-2); }
.exarr-in:focus{ outline:none; border-color:var(--lvl); background:#fff; }

@media (max-width: 760px){
  .exq-grid{ grid-template-columns:1fr; }
  .exmatch{ grid-template-columns:1fr; }
  .expass{ column-count:1; }
  .exrow{ grid-template-columns:26px 1fr; }
  .exrow-arrow,.exrow > .exrow-ans{ grid-column:2; }
}


.ex-footer{ display:flex; justify-content:space-between; gap:16px; padding:10px 34px; border-top:1px solid var(--line); background:#fff; color:var(--ink-3); font-family:var(--f-mono); font-size:8.5px; letter-spacing:.04em; }

/* ── IMPRESIÓN / PDF INSTITUCIONAL F92 ── */
@media print{
  @page{ size:A4; margin:10mm; }
  body{ background:#fff!important; }
  .ex-shell{ box-shadow:none!important; border-radius:0!important; overflow:visible!important; }
  .exh{ break-inside:avoid; }
  .exh-premium .exh,.exh-compact .exh,.exh-sheet .exh{ padding:14mm 12mm 8mm!important; border-top:5px solid var(--lvl)!important; }
  .exh-brand{ margin-bottom:10px!important; }
  .exh-logo{ width:48px!important; height:48px!important; }
  .exh-title{ font-size:25px!important; }
  .exm{ padding:8px 12mm!important; }
  .exb{ padding:9mm 12mm 14mm!important; background:#fff!important; }
  .exs{ box-shadow:none!important; break-inside:avoid; margin-bottom:8mm!important; }
  .exs-h{ break-after:avoid; }
  input,textarea,select{ border:1px solid #8E9AAA!important; background:#fff!important; }
}
`;


// ===== examenes_appcss.jsx =====

// CALGRUPO_F51_20260617_INDICE_MAESTRO_CAMPUS_UI_CSS
// CALGRUPO_F50_20260617_CIERRE_TECNICO_EXAMENES_UI_CSS
// CALGRUPO_F49_20260617_CHECKLIST_QA_FINAL_EXAMENES_UI_CSS
// CALGRUPO_F48_20260617_CENTRO_DIAGNOSTICO_EXAMENES_UI_CSS
/* examenes_appcss.jsx — CSS de la app (barra de control + modos) */
window.EXAM_APP_CSS = `
*{ box-sizing:border-box; }
body{ margin:0; background:var(--bg); font-family:var(--f-sans); color:var(--ink); }
.btn-primary{ background:var(--an-navy); color:#fff; border:none; padding:11px 22px; border-radius:10px; font-family:var(--f-sans); font-size:14px; font-weight:600; cursor:pointer; box-shadow:var(--sh-1); }
.btn-primary:hover{ background:var(--an-navy-ink); }
.btn-primary:disabled{ background:var(--line-2); color:var(--ink-3); cursor:not-allowed; box-shadow:none; }
.btn-ghost{ background:#fff; color:var(--ink-2); border:1px solid var(--line-2); padding:10px 18px; border-radius:10px; font-family:var(--f-sans); font-size:13px; font-weight:600; cursor:pointer; }
.btn-ghost:hover{ border-color:var(--an-navy); color:var(--an-navy); }
.btn-sm{ background:var(--an-navy); color:#fff; border:none; padding:7px 14px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; }
.btn-sm:hover{ background:var(--an-navy-ink); }

/* ── CONTROL BAR (PANEL DE AUDITORÍA) ── */
.cbar{ position:sticky; top:0; z-index:50; background:var(--an-navy); color:#fff; box-shadow:var(--sh-2); }
.cbar-banner{ display:flex; align-items:center; gap:8px; background:var(--an-red); color:#fff; font-size:11.5px; padding:6px 22px; letter-spacing:0.01em; }
.cbar-banner b{ font-weight:700; }
.cbar-eye{ font-size:13px; }
.cbar-row{ display:flex; align-items:center; gap:22px; flex-wrap:wrap; padding:12px 22px; }
.cbar-brand{ display:flex; align-items:center; gap:11px; padding-right:18px; border-right:1px solid rgba(255,255,255,0.18); }
.cbar-logo{ width:36px; height:36px; border-radius:9px; background:#fff; color:var(--an-navy); font-weight:800; font-size:14px; display:flex; align-items:center; justify-content:center; }
.cbar-t{ font-size:14px; font-weight:700; }
.cbar-s{ font-family:var(--f-mono); font-size:10px; opacity:0.6; }
.cbar-group{ display:flex; flex-direction:column; gap:5px; }
.cbar-group.dim{ opacity:0.4; }
.cbar-group > label{ font-family:var(--f-mono); font-size:9px; letter-spacing:0.1em; text-transform:uppercase; opacity:0.6; }
.seg{ display:flex; background:rgba(255,255,255,0.1); border-radius:8px; padding:3px; gap:2px; }
.seg button{ border:none; background:transparent; color:rgba(255,255,255,0.7); font-family:var(--f-sans); font-size:12px; font-weight:600; padding:6px 12px; border-radius:6px; cursor:pointer; }
.seg.seg-sm button{ padding:6px 11px; }
.seg button.on{ background:#fff; color:var(--an-navy); }
.lvlswatches{ display:flex; gap:6px; }
.lvlsw{ width:30px; height:30px; border-radius:7px; border:2px solid transparent; cursor:pointer; color:#fff; font-size:10px; font-weight:800; }
.lvlsw.on{ border-color:#fff; box-shadow:0 0 0 2px var(--an-navy); }
.tgl{ display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.1); border:none; color:#fff; padding:7px 12px; border-radius:8px; font-size:12px; font-weight:600; cursor:pointer; }
.tgl-dot{ width:9px; height:9px; border-radius:50%; background:rgba(255,255,255,0.4); }
.tgl.on .tgl-dot{ background:#5fd27a; }
.tgl:disabled{ cursor:not-allowed; }

.exmain{ max-width:1120px; margin:0 auto; padding:28px 22px 80px; }

/* ── ESTUDIANTE ── */
.stwrap{ display:flex; flex-direction:column; align-items:center; }
.sttake{ width:100%; }
.ascard{ background:#fff; border:1px solid var(--line); border-radius:18px; box-shadow:var(--sh-2); padding:36px 38px; max-width:620px; margin:30px auto; border-top:6px solid var(--lvl); }
.ascard-top{ display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }
.ascard-lvl{ font-family:var(--f-mono); font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:var(--lvl-ink); font-weight:700; }
.ascard-opt{ font-size:11px; font-weight:700; padding:4px 12px; border-radius:999px; }
.ascard-opt.opt-A{ background:var(--lvl-soft); color:var(--lvl-ink); }
.ascard-opt.opt-B{ background:#FBECE9; color:#8E1A12; border:1px dashed #E89A91; }
.ascard-title{ font-size:28px; font-weight:700; letter-spacing:-0.02em; margin:0 0 6px; color:var(--an-navy-ink); }
.ascard-sub{ font-size:14px; color:var(--ink-2); margin:0 0 14px; }
.ascard-pond{ display:inline-block; background:var(--lvl-soft); color:var(--lvl-ink); font-size:12.5px; font-weight:600; padding:7px 14px; border-radius:999px; margin-bottom:18px; }
.ascard-grid{ display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--line); border:1px solid var(--line); border-radius:12px; overflow:hidden; margin-bottom:20px; }
.ascard-grid > div{ background:#fff; padding:13px 16px; display:flex; flex-direction:column; gap:3px; }
.ascard-grid span{ font-family:var(--f-mono); font-size:9px; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-3); }
.ascard-grid b{ font-size:15px; font-weight:600; }
.ascard-note{ background:var(--surface-2); border:1px solid var(--line); border-radius:10px; padding:13px 16px; font-size:12.5px; color:var(--ink-2); line-height:1.55; }
.ascard-go{ width:100%; margin-top:20px; padding:14px; }
.ascard-attr{ font-family:var(--f-mono); font-size:10px; color:var(--ink-3); margin-top:16px; text-align:center; }

.sentcard{ text-align:center; }
.sent-check{ width:64px; height:64px; border-radius:50%; color:#fff; font-size:32px; display:flex; align-items:center; justify-content:center; margin:0 auto 18px; }
.sent-msg{ font-size:15px; color:var(--ink-2); line-height:1.6; max-width:440px; margin:0 auto 18px; }
.sent-state{ display:inline-flex; align-items:center; gap:9px; background:#E2EFF8; color:#0C447C; font-weight:700; font-size:14px; padding:9px 18px; border-radius:999px; margin-bottom:22px; }
.sent-dot{ width:9px; height:9px; border-radius:50%; background:#0C447C; animation:sentpulse 1.6s infinite; }
@keyframes sentpulse{ 0%,100%{ opacity:1; } 50%{ opacity:0.3; } }
.sent-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line); border:1px solid var(--line); border-radius:12px; overflow:hidden; margin-bottom:18px; }
.sent-grid > div{ background:#fff; padding:13px; display:flex; flex-direction:column; gap:3px; }
.sent-grid span{ font-family:var(--f-mono); font-size:9px; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-3); }
.sent-grid b{ font-size:13px; }
.sent-pending{ color:var(--warn); }

.stbar{ position:sticky; bottom:0; z-index:30; display:flex; align-items:center; gap:20px; background:#fff; border:1px solid var(--line); border-radius:14px; box-shadow:var(--sh-2); padding:14px 20px; margin-top:22px; width:100%; }
.stbar-prog{ flex:1; display:flex; flex-direction:column; gap:6px; }
.stbar-prog span{ font-size:11.5px; color:var(--ink-3); font-family:var(--f-mono); }
.stbar-track{ height:7px; background:var(--bg-deep); border-radius:999px; overflow:hidden; }
.stbar-fill{ height:100%; border-radius:999px; transition:width .3s; }
.stbar-actions{ display:flex; gap:10px; }

/* ── PROFESOR ── */
.tchwrap{ background:#fff; border:1px solid var(--line); border-radius:16px; box-shadow:var(--sh-1); overflow:hidden; }
.tch-head{ display:flex; justify-content:space-between; align-items:flex-end; padding:24px 26px 18px; }
.tch-kicker{ font-family:var(--f-mono); font-size:10px; letter-spacing:0.12em; text-transform:uppercase; color:var(--an-navy); margin-bottom:6px; }
.tch-title{ font-size:24px; font-weight:700; margin:0; color:var(--an-navy-ink); }
.tch-stats{ display:flex; gap:24px; }
.tch-stat{ display:flex; flex-direction:column; align-items:flex-end; }
.tch-stat b{ font-size:26px; font-weight:700; color:var(--an-navy); }
.tch-stat span{ font-family:var(--f-mono); font-size:10px; text-transform:uppercase; color:var(--ink-3); }
.tch-note{ margin:0 26px 16px; background:#FBF1D8; border:1px solid #EAD9A8; color:#7B5600; border-radius:10px; padding:11px 16px; font-size:12.5px; line-height:1.5; }
.tch-table{ width:100%; border-collapse:collapse; }
.tch-table th{ text-align:left; font-family:var(--f-mono); font-size:9.5px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-3); padding:10px 14px; border-bottom:1px solid var(--line); background:var(--surface-2); }
.tch-table td{ padding:14px; border-bottom:1px solid var(--line); font-size:13px; vertical-align:middle; }
.tch-table tr:last-child td{ border-bottom:none; }
.tch-table td b{ display:block; font-weight:600; }
.tch-code{ font-family:var(--f-mono); font-size:10.5px; color:var(--ink-3); }
.row-pend{ background:#FCF9F2; }
.mini-opt{ display:inline-flex; width:24px; height:24px; align-items:center; justify-content:center; border-radius:6px; font-weight:800; font-size:12px; }
.mini-opt.opt-A{ background:#E4F3E5; color:#1F6B25; }
.mini-opt.opt-B{ background:#FBECE9; color:#8E1A12; border:1px dashed #E89A91; }
.tch-pill{ font-size:11px; font-weight:700; padding:4px 11px; border-radius:999px; white-space:nowrap; }
.tch-stub{ font-family:var(--f-mono); font-size:10.5px; color:var(--ink-3); font-style:italic; }

/* revisión */
.tchrev{ display:grid; grid-template-columns:300px 1fr; gap:22px; align-items:start; }
.rev-side{ position:sticky; top:88px; display:flex; flex-direction:column; gap:12px; background:#fff; border:1px solid var(--line); border-radius:14px; box-shadow:var(--sh-1); padding:18px; }
.rev-back{ align-self:flex-start; background:transparent; border:none; color:var(--an-navy); font-weight:600; font-size:13px; cursor:pointer; padding:0; }
.rev-stud h3{ margin:0 0 10px; font-size:17px; color:var(--an-navy-ink); }
.rev-meta{ display:flex; justify-content:space-between; gap:8px; font-size:12px; padding:4px 0; border-bottom:1px dashed var(--line); }
.rev-meta span{ font-family:var(--f-mono); font-size:10px; text-transform:uppercase; color:var(--ink-3); }
.rev-prelim{ background:var(--surface-2); border:1px solid var(--line); border-radius:11px; padding:13px; }
.rev-prelim-h{ font-family:var(--f-mono); font-size:10px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-3); margin-bottom:9px; }
.rev-prelim-row{ display:flex; justify-content:space-between; font-size:12.5px; padding:3px 0; }
.rev-prelim-row b{ font-family:var(--f-mono); }
.rev-prelim-row.warn b{ color:var(--warn); }
.rev-note{ font-size:10.5px; color:var(--ink-3); line-height:1.5; margin-top:8px; font-style:italic; }
.rev-score{ text-align:center; background:var(--lvl-soft); border-radius:11px; padding:14px; }
.rev-score-num{ font-size:42px; font-weight:800; line-height:1; }
.rev-score-lbl{ font-family:var(--f-mono); font-size:10.5px; color:var(--ink-2); margin-top:4px; }
.rev-fb{ width:100%; border:1px solid var(--line-2); border-radius:9px; padding:9px 11px; font-family:var(--f-sans); font-size:12.5px; resize:vertical; min-height:64px; }
.btn-close{ background:var(--an-red); color:#fff; border:none; padding:13px; border-radius:10px; font-family:var(--f-sans); font-size:14px; font-weight:700; cursor:pointer; }
.btn-close:hover{ filter:brightness(0.94); }
.btn-close.done{ background:var(--ok); cursor:default; }
.btn-close:disabled{ cursor:not-allowed; }
.rev-closed{ background:#E4F3E5; border:1px solid #B6DDB8; color:#1F6B25; border-radius:9px; padding:11px; font-size:12px; line-height:1.5; text-align:center; }
.rev-main{ min-width:0; }

/* ── ADMIN ── */
.adwrap{ }
.ad-head{ display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:18px; }
.ad-kicker{ font-family:var(--f-mono); font-size:10px; letter-spacing:0.12em; text-transform:uppercase; color:var(--an-navy); margin-bottom:6px; }
.ad-title{ font-size:23px; font-weight:700; margin:0; color:var(--an-navy-ink); }
.ad-legend{ display:flex; gap:18px; }
.ad-leg{ display:flex; align-items:center; gap:7px; font-size:12px; color:var(--ink-2); }
.ad-leg i{ width:10px; height:10px; border-radius:3px; }
.dot-real{ background:var(--ok); }
.dot-pend{ background:var(--line-2); }
.ad-filters{ display:flex; gap:8px; margin-bottom:18px; }
.pmodel{ background:#fff; border:1px solid var(--line); border-radius:12px; margin-bottom:20px; overflow:hidden; box-shadow:var(--sh-1); }
.pmodel-h{ width:100%; display:flex; align-items:center; gap:12px; background:var(--surface-2); border:none; border-bottom:1px solid var(--line); padding:13px 18px; cursor:pointer; text-align:left; }
.pmodel-ttl{ font-weight:700; font-size:13.5px; color:var(--an-navy-ink); }
.pmodel-sub{ font-size:11.5px; color:var(--ink-3); }
.pmodel-chev{ margin-left:auto; color:var(--ink-3); font-size:13px; }
.pmodel-table{ width:100%; border-collapse:collapse; }
.pmodel-table th{ text-align:left; font-family:var(--f-mono); font-size:9.5px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-3); padding:9px 18px; border-bottom:1px solid var(--line); }
.pmodel-table th:not(:first-child),.pmodel-table td:not(:first-child){ text-align:center; width:120px; }
.pmodel-table td{ padding:9px 18px; border-bottom:1px solid var(--line); font-size:13px; }
.pmodel-table tr:last-child td{ border-bottom:none; }
.pmodel-table .pm-w{ background:var(--lvl-soft, #E4F3E5); }
.pmodel-table .pm-w td{ color:var(--an-navy-ink); }
.pmodel-table .pm-tot td{ font-weight:700; font-family:var(--f-mono); background:var(--bg-deep); }
.ad-f{ background:#fff; border:1px solid var(--line-2); color:var(--ink-2); padding:7px 16px; border-radius:999px; font-size:12.5px; font-weight:600; cursor:pointer; }
.ad-f.on{ background:var(--an-navy); color:#fff; border-color:var(--an-navy); }
.ad-grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; }
.adcard{ background:#fff; border:1px solid var(--line); border-radius:13px; padding:16px 17px; box-shadow:var(--sh-1); border-top:4px solid var(--lvl); }
.adcard.estado-pendiente{ border-top-color:var(--line-2); opacity:0.92; }
.adcard.estado-pendiente .adcard-id{ color:var(--ink-3); }
.adcard-top{ display:flex; align-items:center; gap:8px; margin-bottom:11px; }
.adcard-lvl{ background:var(--lvl); color:#fff; font-weight:800; font-size:12px; padding:3px 9px; border-radius:6px; }
.adcard-state{ margin-left:auto; font-family:var(--f-mono); font-size:9px; font-weight:700; letter-spacing:0.08em; padding:3px 8px; border-radius:5px; }
.adcard-state.real{ background:#E4F3E5; color:#1F6B25; }
.adcard-state.pendiente{ background:var(--bg-deep); color:var(--ink-3); }
.adcard-id{ font-family:var(--f-mono); font-size:12px; font-weight:600; color:var(--an-navy-ink); margin-bottom:3px; word-break:break-all; }
.adcard-name{ font-size:13px; color:var(--ink-2); margin-bottom:13px; }
.adcard-rows{ display:grid; grid-template-columns:1fr 1fr; gap:7px 14px; margin-bottom:14px; }
.adcard-rows > div{ display:flex; flex-direction:column; gap:1px; font-size:12px; }
.adcard-rows span{ font-family:var(--f-mono); font-size:8.5px; letter-spacing:0.06em; text-transform:uppercase; color:var(--ink-3); }
.adcard-foot{ display:flex; gap:9px; align-items:center; border-top:1px solid var(--line); padding-top:12px; }
.ad-meta-btn{ background:transparent; border:1px solid var(--line-2); color:var(--ink-2); padding:6px 12px; border-radius:8px; font-size:11.5px; cursor:pointer; }
.adcard-pendmsg{ font-family:var(--f-mono); font-size:10.5px; color:var(--ink-3); font-style:italic; }


.actbox{ background:#fff; border:1px solid var(--line); border-radius:14px; margin:0 0 22px; overflow:hidden; box-shadow:var(--sh-1); border-top:4px solid var(--lvl); }
.actbox-h{ width:100%; display:flex; align-items:center; gap:14px; background:#fff; border:none; border-bottom:1px solid var(--line); padding:16px 18px; cursor:pointer; text-align:left; }
.actbox-k{ font-family:var(--f-mono); font-size:9.5px; letter-spacing:0.12em; text-transform:uppercase; color:var(--lvl-ink); margin-bottom:5px; }
.actbox-t{ font-size:17px; font-weight:800; color:var(--an-navy-ink); letter-spacing:-0.02em; }
.actbox-s{ font-size:12px; color:var(--ink-3); margin-top:3px; }
.actbox-state{ margin-left:auto; white-space:nowrap; background:#FBF1D8; color:#7B5600; border:1px solid #EAD9A8; font-family:var(--f-mono); font-size:10px; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; padding:6px 10px; border-radius:999px; }
.actbox-body{ padding:18px; display:grid; grid-template-columns:1.15fr 0.85fr; gap:16px; align-items:start; }
.actform{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
.actform label{ display:flex; flex-direction:column; gap:5px; }
.actform label span{ font-family:var(--f-mono); font-size:9.5px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-3); }
.actform input,.actform select{ width:100%; border:1px solid var(--line-2); border-radius:9px; background:#fff; color:var(--an-navy-ink); font-family:var(--f-sans); font-size:12.5px; padding:9px 10px; outline:none; }
.actform input:focus,.actform select:focus{ border-color:var(--lvl); box-shadow:0 0 0 3px var(--lvl-soft); }
.actsummary{ background:var(--surface-2); border:1px solid var(--line); border-radius:12px; padding:14px; }
.actpick{ display:flex; align-items:center; gap:8px; margin-bottom:12px; }
.actpick b{ font-family:var(--f-mono); font-size:11.5px; color:var(--an-navy-ink); word-break:break-all; }
.actgrid{ display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--line); border:1px solid var(--line); border-radius:10px; overflow:hidden; margin-bottom:12px; }
.actgrid div{ background:#fff; padding:10px 11px; display:flex; flex-direction:column; gap:2px; }
.actgrid span{ font-family:var(--f-mono); font-size:8.5px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-3); }
.actgrid b{ font-size:12.5px; color:var(--an-navy-ink); }
.actwarns{ display:flex; flex-direction:column; gap:6px; font-size:11.8px; color:var(--ink-2); line-height:1.45; }
.actactions{ display:flex; flex-wrap:wrap; gap:8px; margin-top:13px; }
.btn-disabled{ background:var(--line-2)!important; color:var(--ink-3)!important; cursor:not-allowed!important; }
.actjson{ grid-column:1 / -1; margin:0; padding:14px 16px; background:#0d1b2e; color:#cfe2ff; border-radius:12px; font-family:var(--f-mono); font-size:11px; line-height:1.55; overflow:auto; max-height:330px; }


.specbox{ background:#fff; border:1px solid var(--line); border-radius:14px; margin:0 0 22px; overflow:hidden; box-shadow:var(--sh-1); border-top:4px solid var(--an-navy); }
.specbox-h{ width:100%; display:flex; align-items:center; gap:14px; background:var(--surface-2); border:none; border-bottom:1px solid var(--line); padding:16px 18px; cursor:pointer; text-align:left; }
.specbox-k{ font-family:var(--f-mono); font-size:9.5px; letter-spacing:0.12em; text-transform:uppercase; color:var(--an-navy); margin-bottom:5px; }
.specbox-t{ font-size:17px; font-weight:800; color:var(--an-navy-ink); letter-spacing:-0.02em; }
.specbox-s{ font-size:12px; color:var(--ink-3); margin-top:3px; }
.specbox-state{ margin-left:auto; white-space:nowrap; background:#E2EFF8; color:#0C447C; border:1px solid #C7DFF0; font-family:var(--f-mono); font-size:10px; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; padding:6px 10px; border-radius:999px; }
.specbox-body{ padding:18px; display:grid; grid-template-columns:1.05fr 0.95fr; gap:16px; align-items:start; }
.speccol{ background:#fff; border:1px solid var(--line); border-radius:12px; padding:14px; }
.speccol h3,.specflow h3{ margin:0 0 12px; color:var(--an-navy-ink); font-size:14px; }
.speclist{ display:flex; flex-direction:column; gap:7px; }
.specitem{ display:grid; grid-template-columns:150px 1fr; gap:10px; align-items:start; font-size:12px; line-height:1.45; border-bottom:1px solid var(--line); padding-bottom:7px; }
.specitem:last-child{ border-bottom:none; padding-bottom:0; }
.specitem code,.specwarn code{ font-family:var(--f-mono); font-size:10.5px; background:var(--bg-deep); color:var(--an-navy); padding:2px 6px; border-radius:5px; }
.specitem span{ color:var(--ink-2); }
.specrules{ margin:0; padding-left:18px; color:var(--ink-2); font-size:12.2px; line-height:1.65; }
.specflow{ grid-column:1 / -1; background:var(--surface-2); border:1px solid var(--line); border-radius:12px; padding:14px; }
.flowgrid{ display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:8px; }
.flowstep{ background:#fff; border:1px solid var(--line); border-radius:10px; padding:10px; min-height:86px; }
.flowstep b{ display:block; font-family:var(--f-mono); font-size:10px; color:var(--an-navy); margin-bottom:6px; }
.flowstep span{ font-size:11.5px; color:var(--ink-2); line-height:1.35; }
.specwarn{ grid-column:1 / -1; background:#FBF1D8; border:1px solid #EAD9A8; color:#7B5600; border-radius:11px; padding:12px 14px; font-size:12.5px; line-height:1.55; }
.specwarn b{ color:#654700; }


.opsbox{ background:#fff; border:1px solid var(--line); border-radius:14px; margin:0 0 22px; overflow:hidden; box-shadow:var(--sh-1); border-top:4px solid #6B4FA0; }
.opsbox-h{ width:100%; display:flex; align-items:center; gap:14px; background:#fff; border:none; border-bottom:1px solid var(--line); padding:16px 18px; cursor:pointer; text-align:left; }
.opsbox-k{ font-family:var(--f-mono); font-size:9.5px; letter-spacing:0.12em; text-transform:uppercase; color:#6B4FA0; margin-bottom:5px; }
.opsbox-t{ font-size:17px; font-weight:800; color:var(--an-navy-ink); letter-spacing:-0.02em; }
.opsbox-s{ font-size:12px; color:var(--ink-3); margin-top:3px; }
.opsbox-state{ margin-left:auto; white-space:nowrap; background:#EEE8F7; color:#5B3F91; border:1px solid #D9CDEE; font-family:var(--f-mono); font-size:10px; font-weight:800; letter-spacing:0.06em; text-transform:uppercase; padding:6px 10px; border-radius:999px; }
.opsbox-body{ padding:18px; display:flex; flex-direction:column; gap:14px; }
.ops-actions{ display:flex; flex-wrap:wrap; align-items:end; gap:9px; }
.ops-actions.tight{ margin-top:10px; }
.ops-actions label,.ops-reviewbox label{ display:flex; flex-direction:column; gap:5px; min-width:210px; }
.ops-actions label span,.ops-reviewbox label span{ font-family:var(--f-mono); font-size:9.5px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-3); }
.ops-actions input,.ops-actions select,.ops-filterline input,.ops-filterline select,.ops-reviewbox input,.ops-reviewbox textarea,.tch-realrow input{ border:1px solid var(--line-2); border-radius:9px; background:#fff; color:var(--an-navy-ink); font-family:var(--f-sans); font-size:12.5px; padding:9px 10px; outline:none; }
.ops-reviewbox textarea{ min-height:70px; resize:vertical; }
.ops-warning{ background:#FBF1D8; border:1px solid #EAD9A8; color:#7B5600; border-radius:10px; padding:10px 12px; font-size:12px; line-height:1.5; }
.ops-warning.small{ font-size:11.5px; margin-top:10px; }
.ops-grid{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.ops-card{ border:1px solid var(--line); border-radius:12px; overflow:hidden; background:#fff; }
.ops-card-h{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 14px; background:var(--surface-2); border-bottom:1px solid var(--line); }
.ops-card-h b{ color:var(--an-navy-ink); }
.ops-card-h span{ font-family:var(--f-mono); font-size:10.5px; color:var(--ink-3); }
.opstable-wrap{ overflow:auto; max-height:320px; }
.opstable{ width:100%; border-collapse:collapse; font-size:12px; }
.opstable th{ background:#fff; border-bottom:1px solid var(--line); color:var(--ink-3); font-family:var(--f-mono); font-size:9px; letter-spacing:0.08em; text-transform:uppercase; text-align:left; padding:10px 12px; }
.opstable td{ border-bottom:1px solid var(--line); padding:10px 12px; vertical-align:top; color:var(--ink-2); }
.opstable td b,.opstable td small{ display:block; }
.opstable td b{ color:var(--an-navy-ink); margin-bottom:3px; }
.opstable td small{ color:var(--ink-3); line-height:1.35; }
.opstable code{ font-family:var(--f-mono); font-size:10.5px; color:var(--an-navy); background:var(--surface-2); border:1px solid var(--line); padding:2px 5px; border-radius:5px; word-break:break-all; }
.opstable button{ border:1px solid var(--line-2); background:#fff; color:var(--an-navy); border-radius:7px; padding:5px 8px; font-size:11px; cursor:pointer; }
.actstatus.started{ background:#E2EFF8; border-color:#C7DFF0; color:#0C447C; }
.actstatus.submitted,.actstatus.pending{ background:#FBF1D8; border-color:#EAD9A8; color:#7B5600; }
.actstatus.reviewed,.actstatus.in_review{ background:#EEE8F7; border-color:#D9CDEE; color:#5B3F91; }
.actstatus.void{ background:#FBE6E3; border-color:#F1B8B1; color:#8E2B20; }

.ops-inbox{ border:1px solid var(--line); border-radius:12px; overflow:hidden; background:#fff; }
.ops-filterline{ display:flex; flex-wrap:wrap; align-items:end; gap:9px; padding:13px 14px; border-bottom:1px solid var(--line); background:#fff; }
.ops-filterline label{ display:flex; flex-direction:column; gap:5px; min-width:150px; }
.ops-filterline label span{ font-family:var(--f-mono); font-size:9.5px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-3); }
.ops-filterline label:first-child{ min-width:220px; }
.ops-filterline label:nth-child(4){ min-width:230px; }
.ops-filterline label:nth-child(5){ min-width:84px; }
.ops-kpis{ display:flex; flex-wrap:wrap; gap:8px; padding:11px 14px; background:var(--surface-2); border-bottom:1px solid var(--line); }
.ops-kpis span{ border:1px solid var(--line); background:#fff; border-radius:999px; padding:6px 9px; color:var(--ink-3); font-size:11.5px; }
.ops-kpis b{ color:var(--an-navy-ink); margin-right:4px; }
.inbox-wrap{ max-height:420px; }
.ops-row-actions{ display:flex; flex-wrap:wrap; gap:5px; }
.ops-row-actions button:disabled{ opacity:.45; cursor:not-allowed; }
.actstatus.submitted_without_review,.actstatus.closed_not_pushed{ background:#FBF1D8; border-color:#EAD9A8; color:#7B5600; }
.actstatus.pushed{ background:#E5F3EA; border-color:#BFE0C8; color:#1F6B3A; }
.actstatus.other{ background:var(--surface-2); border-color:var(--line); color:var(--ink-3); }

.ops-detail{ display:grid; grid-template-columns:1fr 380px; gap:14px; align-items:start; }
.ops-json,.ops-reviewbox{ border:1px solid var(--line); border-radius:12px; background:#fff; padding:14px; }
.ops-json h4,.ops-reviewbox h4{ margin:0 0 10px; color:var(--an-navy-ink); }
.ops-json pre{ margin:0; padding:12px; background:#0d1b2e; color:#cfe2ff; border-radius:10px; max-height:360px; overflow:auto; font-family:var(--f-mono); font-size:11px; line-height:1.5; }

.ops-checkline{ display:flex !important; flex-direction:row !important; align-items:center; gap:9px; min-width:0 !important; margin-top:8px; color:var(--an-navy-ink); font-size:12.5px; font-weight:700; }
.ops-checkline input{ width:auto !important; padding:0 !important; }
.ops-checkline span{ font-family:var(--f-sans) !important; font-size:12.5px !important; letter-spacing:0 !important; text-transform:none !important; color:var(--an-navy-ink) !important; }
.ops-json.compact{ margin-top:10px; }
.ops-json.compact pre{ max-height:220px; }
.ops-reviewbox p{ margin:0 0 10px; color:var(--ink-3); font-size:12.5px; }
.ops-mini{ display:flex; justify-content:space-between; gap:10px; padding:9px 10px; background:var(--surface-2); border:1px solid var(--line); border-radius:9px; margin-bottom:10px; }
.ops-mini b{ font-family:var(--f-mono); font-size:11px; color:var(--an-navy); }
.ops-mini span{ font-family:var(--f-mono); font-size:10px; color:var(--ink-3); }
.tch-note.compact{ margin-top:10px; font-size:11.7px; }
.tch-realbox{ background:#fff; border:1px solid var(--line); border-radius:12px; margin:12px 0 16px; overflow:hidden; }
.tch-realbox-h{ width:100%; display:flex; justify-content:space-between; align-items:center; gap:12px; background:var(--surface-2); border:none; padding:12px 14px; cursor:pointer; text-align:left; }
.tch-realbox-h b{ display:block; color:var(--an-navy-ink); font-size:13px; }
.tch-realbox-h span{ color:var(--ink-3); font-size:11.5px; }
.tch-realbox-b{ padding:13px; }
.tch-realrow{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
.tch-realrow input{ min-width:260px; }
.tch-real-list{ margin-top:10px; display:grid; gap:8px; }
.tch-real-item{ display:grid; grid-template-columns:160px 1fr 120px; gap:10px; align-items:center; border:1px solid var(--line); border-radius:9px; padding:9px 10px; font-size:12px; }
.tch-real-item b{ font-family:var(--f-mono); color:var(--an-navy); font-size:10.5px; }
.tch-real-item span{ color:var(--ink-2); }
.tch-real-item em{ color:var(--ink-3); font-style:normal; text-align:right; }

/* ── PREVIEW ── */
.pvwrap{ }
.pv-demo{ background:#FBF1D8; border:1px solid #EAD9A8; color:#7B5600; border-radius:10px; padding:11px 16px; margin-bottom:16px; font-size:12.5px; line-height:1.5; }
.pv-demo code{ font-family:var(--f-mono); font-size:11.5px; background:#fff; padding:1px 6px; border-radius:4px; }
.pv-empty{ background:#fff; border:1px dashed var(--line-2); border-radius:14px; padding:48px 24px; text-align:center; color:var(--ink-2); }
.pv-empty-ic{ font-size:34px; margin-bottom:10px; }
.pv-empty h3{ margin:0 0 6px; font-size:18px; color:var(--an-navy-ink); }
.pv-empty p{ margin:0 auto; max-width:420px; font-size:13px; line-height:1.6; }
.vid-id{ font-family:var(--f-mono); font-size:11px; color:var(--an-navy); background:var(--surface-2); padding:1px 6px; border-radius:4px; border:1px solid var(--line); }
.pv-banner{ display:flex; align-items:center; gap:12px; flex-wrap:wrap; background:var(--lvl-soft); border:1px solid var(--lvl); border-radius:11px; padding:11px 16px; margin-bottom:18px; font-family:var(--f-mono); font-size:12px; color:var(--lvl-ink); }
.pv-tag{ background:var(--lvl); color:#fff; font-size:10px; font-weight:700; padding:3px 9px; border-radius:5px; }
.pv-dim{ opacity:0.7; }

/* ── MODALES ── */
.exov{ position:fixed; inset:0; z-index:200; background:rgba(0,30,71,0.45); display:flex; align-items:center; justify-content:center; padding:24px; backdrop-filter:blur(2px); }
.exov-card{ background:#fff; border-radius:16px; box-shadow:var(--sh-3); max-width:560px; width:100%; max-height:84vh; display:flex; flex-direction:column; overflow:hidden; }
.meta-card{ max-width:620px; }
.exov-h{ display:flex; align-items:center; gap:12px; padding:18px 22px; border-bottom:1px solid var(--line); }
.exov-h h3{ margin:0; font-size:16px; color:var(--an-navy-ink); flex:1; }
.exov-tag{ background:#FBF1D8; color:#7B5600; font-size:10px; font-weight:700; padding:3px 9px; border-radius:5px; }
.exov-x{ background:transparent; border:none; font-size:18px; color:var(--ink-3); cursor:pointer; }
.exov-body{ padding:18px 22px; overflow:auto; }
.exov-line{ font-size:13.5px; line-height:1.7; margin:0 0 7px; }
.exov-line b{ font-family:var(--f-mono); font-size:11px; color:var(--an-navy); margin-right:6px; }
.exov-foot{ padding:13px 22px; border-top:1px solid var(--line); background:var(--surface-2); font-size:11.5px; color:var(--ink-3); }
.meta-json{ margin:0; padding:18px 22px; background:#0d1b2e; color:#cfe2ff; font-family:var(--f-mono); font-size:11.5px; line-height:1.6; overflow:auto; max-height:300px; }
.meta-report{ padding:16px 22px; font-size:12.5px; }
.meta-report b{ display:block; margin-bottom:8px; color:var(--an-navy-ink); }
.meta-report ul{ margin:0; padding-left:18px; line-height:1.65; color:var(--ink-2); }

@media (max-width: 860px){
  .tchrev{ grid-template-columns:1fr; }
  .rev-side{ position:static; }
  .actbox-body{ grid-template-columns:1fr; }
  .actform{ grid-template-columns:1fr; }
  .specbox-body{ grid-template-columns:1fr; }
  .ops-grid,.ops-detail{ grid-template-columns:1fr; }
  .tch-real-item{ grid-template-columns:1fr; }
  .ops-filterline label,.ops-filterline label:first-child,.ops-filterline label:nth-child(4),.ops-filterline label:nth-child(5){ min-width:100%; }
  .ops-row-actions{ display:grid; grid-template-columns:1fr; }
  .specitem{ grid-template-columns:1fr; gap:4px; }
  .flowgrid{ grid-template-columns:1fr 1fr; }
}

.actbox-body-live{ grid-template-columns:1.05fr 0.95fr; }
.actnotes{ display:flex; flex-direction:column; gap:5px; margin-top:12px; }
.actnotes span{ font-family:var(--f-mono); font-size:9.5px; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-3); }
.actnotes textarea{ width:100%; min-height:74px; resize:vertical; border:1px solid var(--line-2); border-radius:9px; background:#fff; color:var(--an-navy-ink); font-family:var(--f-sans); font-size:12.5px; padding:9px 10px; outline:none; }
.ex-okmsg,.ex-errmsg{ margin-top:12px; border-radius:10px; padding:10px 12px; font-size:12px; line-height:1.45; }
.ex-okmsg{ background:#E4F3E5; border:1px solid #BFE1C1; color:#1F6B25; }
.ex-errmsg{ background:#FBE6E3; border:1px solid #F1B8B1; color:#8E2B20; }
.actlist{ grid-column:1 / -1; background:#fff; border:1px solid var(--line); border-radius:12px; overflow:hidden; }
.actlist-h{ display:flex; justify-content:space-between; align-items:center; gap:12px; padding:13px 15px; border-bottom:1px solid var(--line); background:var(--surface-2); }
.actlist-h b{ color:var(--an-navy-ink); font-size:14px; }
.actlist-h span{ font-family:var(--f-mono); color:var(--ink-3); font-size:10.5px; }
.acttable-wrap{ overflow:auto; max-height:410px; }
.acttable{ width:100%; border-collapse:collapse; font-size:12px; }
.acttable th{ position:sticky; top:0; z-index:1; background:#fff; border-bottom:1px solid var(--line); color:var(--ink-3); font-family:var(--f-mono); font-size:9px; letter-spacing:0.08em; text-transform:uppercase; text-align:left; padding:10px 12px; }
.acttable td{ border-bottom:1px solid var(--line); padding:10px 12px; vertical-align:top; color:var(--ink-2); }
.acttable td b{ display:block; color:var(--an-navy-ink); font-size:12px; margin-bottom:3px; }
.acttable td small{ display:block; color:var(--ink-3); line-height:1.35; }
.acttable code{ font-family:var(--f-mono); font-size:10.5px; color:var(--an-navy); background:var(--surface-2); border:1px solid var(--line); padding:2px 5px; border-radius:5px; word-break:break-all; }
.actempty{ text-align:center!important; color:var(--ink-3)!important; padding:26px!important; font-style:italic; }
.actstatus{ display:inline-flex; border-radius:999px; padding:4px 8px; font-family:var(--f-mono); font-size:9.5px; font-weight:800; letter-spacing:0.05em; border:1px solid var(--line); background:var(--surface-2); color:var(--ink-2); }
.actstatus.open{ background:#E4F3E5; border-color:#BFE1C1; color:#1F6B25; }
.actstatus.scheduled{ background:#E2EFF8; border-color:#C7DFF0; color:#0C447C; }
.actstatus.closed{ background:#EAE3D5; border-color:#D7CBBE; color:#4A413A; }
.actstatus.cancelled{ background:#FBE6E3; border-color:#F1B8B1; color:#8E2B20; }
.actrow-actions{ display:flex; flex-wrap:wrap; gap:6px; min-width:155px; }
.actrow-actions button{ border:1px solid var(--line-2); background:#fff; color:var(--an-navy); border-radius:7px; padding:5px 8px; font-size:11px; cursor:pointer; }
.actrow-actions button:disabled{ opacity:.5; cursor:not-allowed; }


.public-payload-box{ margin:14px 0; border:1px solid #C7DFF0; background:#F3F8FC; border-radius:13px; padding:13px; }
.public-payload-head{ display:flex; justify-content:space-between; gap:10px; align-items:flex-start; margin-bottom:10px; }
.public-payload-head b{ color:var(--an-navy-ink); font-size:13px; }
.public-payload-head span{ color:var(--ink-3); font-size:11.5px; line-height:1.35; text-align:right; }
.ops-actions.compact{ margin:0; }
.public-payload-result{ margin-top:10px; background:#fff; border:1px solid var(--line); border-radius:10px; overflow:hidden; }
.public-payload-result>div{ display:flex; justify-content:space-between; gap:10px; padding:10px 12px; border-bottom:1px solid var(--line); }
.public-payload-result b{ color:var(--an-navy-ink); font-family:var(--f-mono); font-size:11px; }
.public-payload-result span{ color:var(--ink-3); font-size:11px; }
.public-payload-result pre{ margin:0; padding:10px 12px; max-height:150px; overflow:auto; background:#0d1b2e; color:#cfe2ff; font-family:var(--f-mono); font-size:10.5px; line-height:1.55; }



.ops-signalbox{ margin-top:14px; background:#fff; border:1px solid var(--line); border-radius:12px; overflow:hidden; }
.signal-filterline label:first-child{ min-width:210px; }
.signal-filterline label:nth-child(5){ min-width:230px; }
.signal-wrap{ max-height:440px; }
.signal-table pre{ margin:0; max-width:320px; max-height:86px; overflow:auto; white-space:pre-wrap; word-break:break-word; background:#0d1b2e; color:#cfe2ff; border-radius:8px; padding:8px; font-family:var(--f-mono); font-size:10px; line-height:1.45; }
.signal-table .actstatus.sig-critical{ background:#FBE6E3; border-color:#E89B91; color:#8E2B20; }
.signal-table .actstatus.sig-high{ background:#FBF1D8; border-color:#EAD9A8; color:#7B5600; }
.signal-table .actstatus.sig-medium{ background:#EEE8F7; border-color:#D9CDEE; color:#5B3F91; }
.signal-table .actstatus.sig-low{ background:#E2EFF8; border-color:#C7DFF0; color:#0C447C; }
.signal-kpis{ border-top:1px solid var(--line); }


.ops-auditbox{ margin-top:14px; background:#fff; border:1px solid var(--line); border-radius:12px; overflow:hidden; }
.audit-filterline label:first-child{ min-width:210px; }
.audit-filterline label:nth-child(4){ min-width:210px; }
.audit-wrap{ max-height:420px; }
.audit-table td{ vertical-align:top; }
.audit-table pre{ margin:0; max-width:420px; max-height:92px; overflow:auto; white-space:pre-wrap; word-break:break-word; background:#0d1b2e; color:#cfe2ff; border-radius:8px; padding:8px; font-family:var(--f-mono); font-size:10px; line-height:1.45; }
.audit-table code{ display:block; margin-top:4px; width:max-content; max-width:220px; overflow:hidden; text-overflow:ellipsis; }
.audit-kpis{ border-top:1px solid var(--line); }
.actstatus.attempt_draft_saved,.actstatus.attempt_submitted,.actstatus.attempt_started{ background:#E2EFF8; border-color:#C7DFF0; color:#0C447C; }
.actstatus.review_closed,.actstatus.review_draft_saved,.actstatus.review_draft_created,.actstatus.review_read{ background:#FBF1D8; border-color:#EAD9A8; color:#7B5600; }
.actstatus.review_pushed_to_notas{ background:#E4F3E5; border-color:#BFE1C1; color:#1F6B25; }
.actstatus.audit_trail_read{ background:#F2EBF7; border-color:#DACBE7; color:#56356F; }

/* F49 QA readiness checklist */
.ops-readiness{margin:16px 0;padding:14px;border:1px solid rgba(15,23,42,.12);border-radius:18px;background:rgba(255,251,235,.78)}
.readiness-kpis span{min-width:130px}
.readiness-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:12px}
.readiness-card{background:#fff;border:1px solid rgba(15,23,42,.10);border-radius:16px;padding:12px;min-height:132px;max-height:360px;overflow:auto}
.readiness-card h4{margin:0 0 10px;font-size:13px;color:#0f172a}
.readiness-wrap{margin-top:12px;max-height:390px;background:#fff;border:1px solid rgba(15,23,42,.10);border-radius:14px}
.readiness-table td{vertical-align:top}.readiness-table small{line-height:1.45}.actstatus.qa-fail{background:#fee2e2;border-color:#fecaca;color:#991b1b}.actstatus.qa-warn{background:#ffedd5;border-color:#fed7aa;color:#9a3412}.actstatus.qa-manual{background:#e0f2fe;border-color:#bae6fd;color:#075985}.actstatus.qa-pass{background:#dcfce7;border-color:#bbf7d0;color:#166534}.diag-line.manual b{color:#075985}
@media(max-width:900px){.readiness-grid{grid-template-columns:1fr}.readiness-kpis span{min-width:100%}}

/* F48 diagnostic center + F47 signals completion */
.ops-diagnostic,.ops-signals{margin:16px 0;padding:14px;border:1px solid rgba(15,23,42,.12);border-radius:18px;background:rgba(248,250,252,.92)}
.diagnostic-kpis span,.signal-kpis span{min-width:120px}
.diag-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:12px}
.diag-card{background:#fff;border:1px solid rgba(15,23,42,.10);border-radius:16px;padding:12px;min-height:120px;max-height:340px;overflow:auto}
.diag-card h4{margin:0 0 10px;font-size:13px;color:#0f172a}
.diag-line{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-top:1px solid rgba(15,23,42,.06);font-size:12px}
.diag-line:first-of-type{border-top:0}.diag-line b{color:#0f172a}.diag-line span{color:#64748b;text-align:right}.diag-line.ok b{color:#166534}.diag-line.warn b,.diag-line.medium b{color:#92400e}.diag-line.high b,.diag-line.critical b{color:#991b1b}.diag-line.low b{color:#0369a1}
.signal-table pre{max-width:360px;white-space:pre-wrap;margin:0;font-size:11px}.actstatus.critical{background:#fee2e2;color:#991b1b}.actstatus.high{background:#ffedd5;color:#9a3412}.actstatus.medium{background:#fef3c7;color:#92400e}.actstatus.low{background:#e0f2fe;color:#075985}
@media(max-width:900px){.diag-grid{grid-template-columns:1fr}.signal-table pre{max-width:220px}}


/* F51 master campus index */
.ops-master{ background:#fff; border:1px solid var(--line); border-radius:16px; padding:16px; box-shadow:var(--sh-1); margin:16px 0; }
.master-grid{ display:grid; grid-template-columns:2fr 1fr 1fr; gap:12px; margin-top:12px; }
.master-card{ border:1px solid var(--line); border-radius:14px; padding:12px; background:var(--surface-2); min-height:120px; }
.master-card h4{ margin:0 0 10px; font-size:13px; color:var(--an-navy-ink); }
.master-line{ display:grid; grid-template-columns:160px 1fr; gap:10px; padding:9px 0; border-top:1px solid var(--line); font-size:12px; }
.master-line:first-of-type{ border-top:0; }
.master-line b{ color:#0f172a; }
.master-line span{ color:#64748b; }
.master-kpis span{ min-width:130px; }
.master-wrap{ margin-top:12px; max-height:420px; }
.master-table th:nth-child(1), .master-table td:nth-child(1){ width:46px; text-align:center; }
@media(max-width:1000px){ .master-grid{ grid-template-columns:1fr; } .master-line{ grid-template-columns:1fr; } }

/* F50 technical closure */
.ops-closure{ background:#fff; border:1px solid var(--line); border-radius:16px; padding:16px; box-shadow:var(--sh-1); margin:16px 0; }
.closure-grid{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:12px; }
.closure-card{ border:1px solid var(--line); border-radius:14px; padding:12px; background:var(--surface-2); min-height:120px; }
.closure-card h4{ margin:0 0 10px; font-size:13px; color:var(--an-navy-ink); }
.closure-wrap{ margin-top:12px; max-height:360px; }
.closure-table th:nth-child(1), .closure-table td:nth-child(1){ width:46px; text-align:center; }
.closure-kpis span{ min-width:130px; }
@media(max-width:900px){ .closure-grid{ grid-template-columns:1fr; } }



/* F95.0 · bandeja docente clara y selector de grupos integrado */
.tch-head-explain{align-items:flex-start;gap:24px}
.tch-help{max-width:650px;margin:8px 0 0;color:var(--ink-3);font-size:12.5px;line-height:1.55}
.tch-groups-panel{padding:14px 16px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:#F8FAFE}
.tch-groups-label{font-family:var(--f-mono);font-size:9.5px;letter-spacing:.12em;color:var(--ink-3);font-weight:800;margin-bottom:8px}
.tch-groups-row{display:flex;align-items:stretch;gap:9px;flex-wrap:wrap}
.tch-group-card{min-width:220px;display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:10px 13px;border:1px solid var(--line);border-radius:11px;background:#fff;color:var(--an-navy-ink);font-family:var(--f-sans);cursor:pointer;text-align:left;transition:.15s ease}
.tch-group-card:hover{border-color:#8AA6C4;box-shadow:0 5px 16px rgba(0,38,82,.08)}
.tch-group-card.active{border:2px solid var(--an-navy);padding:9px 12px;background:#EEF4FB;box-shadow:0 6px 18px rgba(0,38,82,.10)}
.tch-group-card span{font-size:12.5px;font-weight:800}
.tch-group-card small{font-family:var(--f-mono);font-size:9.5px;color:var(--ink-3)}
.tch-refresh{margin-left:auto;align-self:center;padding:10px 15px;border:0;border-radius:10px;background:var(--an-navy);color:#fff;font-family:var(--f-sans);font-size:11.5px;font-weight:800;cursor:pointer}
.tch-refresh:disabled{opacity:.5;cursor:not-allowed}
.tch-group-empty{padding:11px 13px;border:1px dashed var(--line-2);border-radius:10px;color:var(--ink-3);font-size:12px}
.tch-table-wrap{overflow:auto}
.tch-empty-state{display:flex;flex-direction:column;align-items:center;gap:5px;padding:30px 18px;color:var(--ink-3);text-align:center}
.tch-empty-state b{color:var(--an-navy-ink);font-size:14px}
.tch-empty-state span{max-width:560px;font-size:12px;line-height:1.5}
@media(max-width:760px){.tch-head-explain{flex-direction:column}.tch-stats{width:100%;justify-content:flex-start}.tch-group-card{min-width:100%}.tch-refresh{width:100%;margin-left:0}.tch-table{min-width:780px}}


/* F95.0 · revisión docente real y accionable */
.tch-review-open{border:0;border-radius:9px;background:var(--an-navy);color:#fff;padding:8px 11px;font-family:var(--f-sans);font-size:10.5px;font-weight:800;white-space:nowrap;cursor:pointer}
.tch-review-open:hover{filter:brightness(1.08)}
.tch-pill.bucket-submitted_without_review{background:#FBF1D8;color:#7B5600;border-color:#EAD9A8}
.tch-pill.bucket-in_review{background:#E2EFF8;color:#0C447C;border-color:#C7DFF0}
.tch-pill.bucket-closed_not_pushed{background:#EEE8F7;color:#5B3F91;border-color:#D9CDEE}
.tch-review-loading,.tch-review-error{min-height:420px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:30px;text-align:center;color:var(--ink-2)}
.tch-review-loading .exam-boot-spinner{width:28px;height:28px;border:3px solid #DCE7F3;border-top-color:#003B7A;border-radius:50%;animation:examspin .8s linear infinite}
.tch-review-error{border:1px solid #F1B8B1;background:#FFF7F6;border-radius:14px;margin:18px;color:#8E2B20}
.tch-review-error b{font-size:17px}.tch-review-error span{max-width:620px;font-size:12.5px;line-height:1.5}.tch-review-error>div{display:flex;gap:8px}
.tchrev-live{align-items:start}
.rev-live-tag{display:inline-flex;width:max-content;padding:5px 9px;border-radius:999px;background:#E7F1FA;color:#0C4F86;font-family:var(--f-mono);font-size:9px;font-weight:900;letter-spacing:.1em;margin-bottom:10px}
.rev-field{display:flex;flex-direction:column;gap:5px;margin-top:10px}.rev-field>span{font-family:var(--f-mono);font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}
.rev-fb.compact{min-height:70px}
.rev-live-ok,.rev-live-err{margin-top:10px;padding:9px 10px;border-radius:9px;font-size:11.5px;line-height:1.45}
.rev-live-ok{background:#E4F3E5;border:1px solid #BFE1C1;color:#1F6B25}.rev-live-err{background:#FBE6E3;border:1px solid #F1B8B1;color:#8E2B20}
.exrev-p:disabled,.exrev-cbtn:disabled,.exrev-c:disabled{cursor:not-allowed;opacity:.65}
@media(max-width:760px){.tch-review-open{width:100%}.tchrev-live{display:block}.tchrev-live .rev-side{margin-bottom:14px}}

@media print{ .cbar,.cbar-banner,.admbar,.tch-head,.tch-realbox,.rev-side{display:none!important;} .app,.exam-app,.preview-wrap{padding:0!important;margin:0!important;background:#fff!important;} }
`;
(function(){
  if (!document.getElementById('exam-app-css')) {
    var s = document.createElement('style'); s.id='exam-app-css';
    s.textContent = window.EXAM_APP_CSS; document.head.appendChild(s);
  }
})();


// ===== examenes_data.jsx =====

/* global React */
// ──────────────────────────────────────────────────────────────────────────
// examenes_data.jsx — EXAM-MASTER-SKILL-001
// Catálogo maestro (16 entradas), tema por nivel, y contenido real oficial:
// I2/I1/B2/B1 Test 1/2 A/B completos.
// Las 16 entradas del catálogo tienen contenido real/oficial.
//
// REGLA DE NIVEL (el libro manda sobre el título escrito):
//   Interchange Intro → B1 · Básico I    · amarillo/dorado
//   Interchange 1     → B2 · Básico II    · rojo
//   Interchange 2     → I1 · Intermedio I · azul
//   Interchange 3     → I2 · Intermedio II· verde
// El material original dice por error "Intermediate I"; el campus lo corrige.
// Fuente de verdad del contenido: Word/PDF de Cambridge (no inventar).
// ──────────────────────────────────────────────────────────────────────────

// ── Tema oficial por nivel ────────────────────────────────────────────────
const NIVEL_TEMA = {
  B1: { code:'B1', nombre:'Básico I',     libro:'Interchange Intro', color:'#E5A823', ink:'#7B5600', soft:'#FBF1D8' },
  B2: { code:'B2', nombre:'Básico II',    libro:'Interchange 1',     color:'#E8372A', ink:'#8E1A12', soft:'#FCE6E4' },
  I1: { code:'I1', nombre:'Intermedio I', libro:'Interchange 2',     color:'#2B7FC1', ink:'#16456E', soft:'#E2EFF8' },
  I2: { code:'I2', nombre:'Intermedio II',libro:'Interchange 3',     color:'#4CAF50', ink:'#1F6B25', soft:'#E4F3E5' },
};

// ── Mapa maestro de videos de LISTENING (sección A/B del audio) ───────────
// Estos IDs son del listening (audio del examen), NO de la opción A/B del
// examen. Cada nivel/prueba tiene su par de videos.
const VIDEO_MAP = {
  B1: { TEST1:{A:'YZoVQWJ-lkw',B:'45NhwUcz8sg'}, TEST2:{A:'7BPAGYlToYw',B:'oijYCxt2-Tk'} },
  B2: { TEST1:{A:'gRMSX0ckpmY',B:'wFnfn3holPM'}, TEST2:{A:'7FB2NnFGkYU',B:'KX3kc8g5eDw'} },
  I1: { TEST1:{A:'P9CBuvBJNZY',B:'Pi19RYAKGig'}, TEST2:{A:'LnUHfDhr5EY',B:'k-l68iiTXDQ'} },
  I2: { TEST1:{A:'d3op5ALruSA',B:'ndVof6jog6k'}, TEST2:{A:'czJMUYioXDM',B:'cWXLwJw5xYc'} },
};

// ── Catálogo maestro: 4 niveles × (Test 1 L18 / Test 2 L32) × (A / B) = 16 ──
// id: NIVEL_WRITTEN_Lxx_TESTn_OPCION  (formato oficial del spec)
function buildCatalogo() {
  const niveles = ['B1','B2','I1','I2'];
  const tests = [
    { test:'TEST1', n:'Prueba 1', leccion:18, units:'Unidades 1–8',  unitsEn:'Units 1–8'  },
    { test:'TEST2', n:'Prueba 2', leccion:32, units:'Unidades 9–16', unitsEn:'Units 9–16' },
  ];
  const out = [];
  niveles.forEach(nv => {
    const t = NIVEL_TEMA[nv];
    tests.forEach(ts => {
      ['A','B'].forEach(op => {
        // Exámenes oficiales en esta ronda:
        // I2/I1/B2/B1 Opción A/B (Test 1/2).
        const esReal = (
          ((nv==='I2' || nv==='I1') && op==='A' && (ts.test==='TEST1' || ts.test==='TEST2')) ||
          (nv==='B2' && op==='A' && (ts.test==='TEST1' || ts.test==='TEST2')) ||
          (nv==='B1' && op==='A' && (ts.test==='TEST1' || ts.test==='TEST2')) ||
          (nv==='B1' && op==='B' && (ts.test==='TEST1' || ts.test==='TEST2')) ||
          (nv==='B2' && op==='B' && (ts.test==='TEST1' || ts.test==='TEST2')) ||
          (nv==='I1' && op==='B' && (ts.test==='TEST1' || ts.test==='TEST2')) ||
          (nv==='I2' && op==='B' && (ts.test==='TEST1' || ts.test==='TEST2'))
        );
        const libroCode = nv==='I2' ? 'ic5_l3' : nv==='I1' ? 'ic5_l2' : nv==='B2' ? 'ic5_l1' : 'ic5_intro';
        const pdfBase = libroCode + (ts.test==='TEST1' ? '_t1to8' : '_t9to16') + op.toLowerCase();
        const fuente = esReal
          ? `${pdfBase}.pdf · ${t.libro} (referencia interna)`
          : '—';
        out.push({
          id: `${nv}_WRITTEN_${ts.leccion === 18 ? 'L18' : 'L32'}_${ts.test}_${op}`,
          nivel: nv,
          nombre_nivel: t.nombre,
          libro: t.libro,
          test: ts.n,
          units: ts.units,           // nombre académico visible
          units_en: ts.unitsEn,      // referencia interna del material
          leccion: ts.leccion,
          tipo: 'escrita',
          opcion: op,                // Opción A/B del EXAMEN (reposición/anti-trampa)
          opcion_label: op === 'A' ? 'Opción A · Principal del grupo' : 'Opción B · Reposición / ausente',
          puntos_totales: esReal ? 50 : null,
          // Marcas oficiales: solo los exámenes con contenido real verificado.
          contenido_real: esReal,
          oficial: esReal,
          // La ponderación NO es fija: depende del plan del estudiante.
          //   CON INA: escrito = 5%   ·   SIN INA: escrito = 15%
          porcentaje: null,
          ponderacion_configurable: true,
          ponderacion_fuente: 'plan_academico',
          ponderacion_por_plan: { con_ina: 5, sin_ina: 15 },
          color_nivel: t.color,
          fuente_original: esReal ? fuente : '—',
          answer_key_fuente: esReal ? 'Incluida (separada del estudiante)' : 'Pendiente',
          audio_script_fuente: esReal ? `${pdfBase}_script.pdf` : 'Pendiente',
          // Videos del LISTENING (sección A/B del audio) — NO confundir con
          // la opción A/B del examen. Vienen del mapa maestro de videos.
          videos: op === 'B'
            ? { listening_A: VIDEO_MAP[nv][ts.test].B, listening_B: VIDEO_MAP[nv][ts.test].B }
            : { listening_A: VIDEO_MAP[nv][ts.test].A, listening_B: VIDEO_MAP[nv][ts.test].B },
          estado: esReal ? 'real' : 'pendiente',
        });
      });
    });
  });
  return out;
}
const CATALOGO = buildCatalogo();

// ──────────────────────────────────────────────────────────────────────────
// CONTENIDO REAL — I2_WRITTEN_L18_TEST1_A
// Transcrito 1:1 del PDF de Cambridge. Las claves (data-correct) viven aquí,
// NUNCA se exponen al estudiante en examen oficial.
//   needsReview: la corrección automática es preliminar; el sistema marca
//   estas preguntas como "requiere revisión docente".
// ──────────────────────────────────────────────────────────────────────────
const EXAM_I2_T1_A = {
  id: 'I2_WRITTEN_L18_TEST1_A',
  nivel: 'I2',
  contenido_real: true,
  oficial: true,
  // Nombre ACADÉMICO de la Academia (lo que ve el estudiante).
  titulo: 'Examen Escrito · Prueba 1',
  unidades: 'Unidades 1–8',
  leccion: 18,
  // Ponderación dinámica según plan académico (no fija).
  porcentaje: null,
  ponderacion_configurable: true,
  ponderacion_fuente: 'plan_academico',
  ponderacion_por_plan: { con_ina: 5, sin_ina: 15 },
  subtitulo: 'Unidades 1–8 · Lección 18',
  // Atribución del material: MÍNIMA y solo visible en admin/preview (showKey).
  atribucion: 'Material de referencia interno: Interchange 3 © Cambridge University Press',
  puntos_totales: 50,
  // Videos del LISTENING (sección A/B del audio) — del mapa maestro.
  videos: { listening_A: 'd3op5ALruSA', listening_B: 'ndVof6jog6k' },
  audioScript: {
    A: [
      ['', '[ teléfono suena ]'],
      ['KATE', 'Hello?'],
      ['ROB', 'Hi, Kate. This is Rob.'],
      ['KATE', 'Oh, hi, Rob. How are you?'],
      ['ROB', "I'm a little stressed out, actually. As I was packing my suitcase this morning, I realized all the things I still have to do to get ready for my business trip next week. I was wondering if you could do me a big favor."],
      ['KATE', 'Sure, Rob. What is it?'],
      ['ROB', "I need someone to take care of my apartment while I'm gone \u2013 you know, water the plants and feed my fish. Would you mind doing that?"],
      ['KATE', "You know, Rob, I'd be happy to, but I'm going to be out of town all next week on vacation. I won't get back until Friday."],
      ['ROB', "Oh, OK. I'll ask someone else, then. Thanks, anyway, Kate."],
      ['KATE', 'Oh, no problem. And I hope you find someone.'],
    ],
    B: [
      ['CHARLIE', "Hi, Sonia. I saw your roommate just now. She's really pretty. What's she like?"],
      ['SONIA', 'Well, Charlie, I like Grace most of the time. But not always.'],
      ['CHARLIE', 'What do you mean?'],
      ['SONIA', "Well, she's not very serious."],
      ['CHARLIE', "What's wrong with that?"],
      ['SONIA', 'Nothing, usually. I like to have fun, too. But sometimes I like to be serious and talk about things that are important to me, like global warming or politics.'],
      ['CHARLIE', "Can't you do that with Grace?"],
      ['SONIA', "I've tried, but when she thinks I'm getting too serious, she changes the subject."],
      ['CHARLIE', 'Well, I know what you mean. I like it when people can have fun with me and be serious with me, too.'],
      ['SONIA', 'Yeah, the perfect friend is someone who can talk to you about anything.'],
    ],
  },
  sections: [
    {
      letter:'A', points:2, per:'1 punto c/u', type:'listening-mc', listening:'A',
      instruction:'Listen to the phone conversation. Check (✓) the correct answers.',
      questions:[
        { id:'A1', stem:'In the morning, Rob was _____.', correct:'packing', opts:[
          ['cleaning','cleaning his apartment'],['feeding','feeding his fish'],['packing','packing his suitcase'] ] },
        { id:'A2', stem:'Next week, Kate is going to _____.', correct:'vacation', opts:[
          ['take',"take care of Rob's apartment"],['vacation','be out of town on vacation'],['trip','go on a trip with Rob'] ] },
      ],
    },
    {
      letter:'B', points:2, per:'1 punto c/u', type:'listening-mc', listening:'B',
      instruction:'Listen to the people talking. Check (✓) the correct answers.',
      questions:[
        { id:'B1', stem:'Grace is a person who _____.', correct:'fun', opts:[
          ['fun','likes to have fun'],['politics','talks about politics'],['serious','is too serious'] ] },
        { id:'B2', stem:'Sonia prefers it when people _____.', correct:'different', opts:[
          ['problems',"don't talk about their problems"],['different','can talk about different things'],['subject','keep changing the subject'] ] },
      ],
    },
    {
      letter:'C', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct word or phrase to complete each sentence.',
      questions:[
        { id:'C1', stem:"Keiko really wanted to go to Mike's party, so she _____ his invitation.", correct:'accepted',
          opts:[['turned','turned down'],['received','received'],['accepted','accepted']] },
        { id:'C2', stem:"Zach doesn't usually brag about his accomplishments. He tends to be pretty _____.", correct:'modest',
          opts:[['modest','modest'],['inflexible','inflexible'],['egotistical','egotistical']] },
        { id:'C3', stem:"Valeria thinks the climate is changing. She's concerned about _____.", correct:'global',
          opts:[['global','global warming'],['corruption','government corruption'],['violence','violence']] },
        { id:'C4', stem:"My TV remote isn't working right. The buttons keep _____.", correct:'sticking',
          opts:[['sticking','sticking'],['skipping','skipping'],['flickering','flickering']] },
        { id:'C5', stem:'I can\'t believe our team won the championship game. What a _____ for all the players on the team.', correct:'triumph',
          opts:[['disaster','disaster'],['coincidence','coincidence'],['triumph','triumph']] },
      ],
    },
    {
      letter:'D', points:6, per:'1 punto c/u', type:'error-correction', needsReview:true,
      instruction:'Circle the incorrect word in each sentence. Then write the correct word(s) on the blank.',
      questions:[
        { id:'D1', html:'I think <u>worked</u> with children would not be a lot of fun.', correct:'working' },
        { id:'D2', html:'A part-time tutor is not as well paid <u>than</u> a teacher.', correct:'as' },
        { id:'D3', html:"If you work as a tour guide, you're <u>expecting</u> to like travel.", correct:'expected' },
        { id:'D4', html:'Would you rather <u>meeting</u> a politician or a journalist?', correct:'meet' },
        { id:'D5', html:'A good way to keep a job is by <u>have</u> a good attitude.', correct:'having' },
        { id:'D6', html:'Melanie <u>has</u> worked as a server for two years before she became a chef.', correct:'had' },
      ],
    },
    {
      letter:'E', points:5, per:'1 punto c/u', type:'para-fill',
      instruction:'Complete the paragraph with the correct words.',
      blanks:[
        { id:'E1', hint:'fixed / fixing',      correct:'fixed' },
        { id:'E2', hint:'damage / damaged',    correct:'damaged' },
        { id:'E3', hint:'tear / torn',         correct:'torn' },
        { id:'E4', hint:'replacing / replaced',correct:'replacing' },
        { id:'E5', hint:'leak / leaking',      correct:'leak' },
      ],
      template:[
        'My old car has some problems that need to be ', {b:'E1'},
        '. First, one of the doors is ', {b:'E2'},
        ' where I had an accident last year. Inside, the seats are ', {b:'E3'},
        ' in several places and need ', {b:'E4'},
        '. Finally, there is a ', {b:'E5'},
        ' in one of the tires. With all these problems, I should probably just buy a new car!'
      ],
    },
    {
      letter:'F', points:6, per:'1 punto c/u', type:'matching',
      instruction:'Match the parts to make logical sentences.',
      left:[
        { n:1, text:'I like students _____' },
        { n:2, text:"I can't stand it _____" },
        { n:3, text:"I'd rather watch a DVD at someone's house _____" },
        { n:4, text:'The best way to meet new people _____' },
        { n:5, text:'Going out with friends is more interesting _____' },
        { n:6, text:'Jeremy is a person _____' },
      ],
      right:[
        { l:'a', text:'is to go to a lot of parties.' },
        { l:'b', text:"that I'd like to know better." },
        { l:'c', text:'who are excited about learning.' },
        { l:'d', text:'than staying at home.' },
        { l:'e', text:"when my friends don't answer my texts." },
        { l:'f', text:'than go out to the movies.' },
      ],
      answers:{ 1:'c', 2:'e', 3:'f', 4:'a', 5:'d', 6:'b' },
    },
    {
      letter:'G', points:5, per:'1 punto c/u', type:'reading-tf',
      instruction:'Read about the nuclear disaster at Fukushima. Then circle T (true) or F (false).',
      passageTitle:'Fukushima Nuclear Disaster',
      passage:[
        'Many people worry about the dangers that nuclear power plants pose for people and the environment. Nuclear power systems are designed to include many safety features, and almost all nuclear power plants work safely and efficiently. But natural disasters can happen.',
        "One of the world's most recent and serious nuclear disasters occurred at a power plant in Fukushima, Japan. On March 11, 2011, several nuclear reactors at the Fukushima plant were damaged by a massive 8.9-magnitude earthquake and a huge 33-foot-high tsunami. After the earthquake struck, the reactor's cooling system lost power. When the cooling system failed, pressure in the reactor kept on rising, and radiation inside the plant rose to 1,000 times its normal level. The destroyed reactors were flooded with seawater in an unsuccessful attempt to prevent a nuclear meltdown.",
        'Newspapers reported that approximately 160 people were exposed to radiation, and that three plant workers suffered from full radiation sickness. Over 200,000 people had to be evacuated from the area surrounding the site. Radiation from the nuclear plant even spread north and west toward the West Coast of the United States. It was detected by scientists in Sacramento, California, ten days later.',
        'Fifty Fukushima plant workers remained on-site at the nuclear reactor after 750 other workers were evacuated. The jobs of these remaining workers were to prevent fires, keep the nuclear core cool with seawater, and install new power lines. These brave workers were limited to working in blocks of 15 minutes in high-radiation areas. All the workers wore special suits and masks to keep them as safe as possible.',
      ],
      questions:[
        { id:'G1', text:'Most nuclear power plants work safely and efficiently.', correct:'T' },
        { id:'G2', text:'Only one reactor was damaged in the earthquake.', correct:'F' },
        { id:'G3', text:'Nuclear radiation does not usually travel very far.', correct:'F' },
        { id:'G4', text:'The Fukushima reactors avoided nuclear meltdown.', correct:'F' },
        { id:'G5', text:"The plant workers didn't work in high-radiation areas.", correct:'F' },
      ],
    },
    {
      letter:'H', points:4, per:'1 punto c/u', type:'verb-fill', needsReview:true,
      instruction:'Fill in the blank with the correct form of the verb.',
      questions:[
        { id:'H1', pre:'The streetlights', hint:'repair', post:'by city volunteers.', correct:['are repaired'] },
        { id:'H2', pre:'One way', hint:'reduce', post:'garbage is to recycle more.', correct:['to reduce'] },
        { id:'H3', pre:'Acid rain', hint:'cause', post:'by pollution from factories.', correct:['is caused'] },
        { id:'H4', pre:'We can protect ourselves from skin cancer by', hint:'limit', post:'our exposure to the sun.', correct:['limiting'] },
      ],
    },
    {
      letter:'I', points:5, per:'1 punto c/u', type:'para-verb', needsReview:true,
      instruction:'Complete the paragraph with the correct form of the verbs.',
      blanks:[
        { id:'I1', hint:'shop',    correct:['were shopping'] },
        { id:'I2', hint:'buy',     correct:['had bought'] },
        { id:'I3', hint:'get',     correct:['got'] },
        { id:'I4', hint:'catch',   correct:['caught','had caught'] },
        { id:'I5', hint:'program', correct:['was programming'] },
      ],
      template:[
        'A thief stole my car last week while my wife and I ', {b:'I1'},
        ' at a department store. I was very upset because I ', {b:'I2'},
        ' the car the day before. Luckily, we ', {b:'I3'},
        ' the car back right away because the police ', {b:'I4'},
        ' the thief while he ', {b:'I5'}, ' the GPS system in the car!'
      ],
    },
    {
      letter:'J', points:6, per:'1 punto c/u', type:'dialog-verb', needsReview:true,
      instruction:'Complete each response with the correct form of a verb from the box.',
      box:['adjust','break','listen','ask','leave','study'],
      questions:[
        { id:'J1', a:'Did you catch your plane last week?', b:"No, I didn't. When I got to the airport, the flight ____ just ____.", correct:['had left','had...left'] },
        { id:'J2', a:'The computer screen is very dark.', b:'Hmm. Maybe the brightness control needs ____.', correct:['to be adjusted','adjusting'] },
        { id:'J3', a:"What's the matter with the light?", b:'The switch is ____.', correct:['broken'] },
        { id:'J4', a:'Would you rather take a biology or an earth science course?', b:"I think I'd rather ____ earth science.", correct:['study'] },
        { id:'J5', a:'How can I learn vocabulary?', b:"By ____ people about words you don't understand.", correct:['asking'] },
        { id:'J6', a:'Would you like to be a music critic?', b:"Why not? I'd love ____ to great music played by amazing bands!", correct:['listening','to listen'] },
      ],
    },
    {
      letter:'K', points:4, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct word or phrase to complete each request.',
      questions:[
        { id:'K1', stem:'_____ you mind if I use your pen for a minute?', correct:'Do', opts:[['Can','Can'],['Do','Do'],['Should','Should']] },
        { id:'K2', stem:'Could you tell Isabella not _____ rude to the guests?', correct:'to be', opts:[['to be','to be'],['be','be'],['being','being']] },
        { id:'K3', stem:'Please ask Derek _____ we can do to help.', correct:'what', opts:[['if','if'],['what','what'],['whether','whether']] },
        { id:'K4', stem:'I wonder _____ you could take me home now.', correct:'if', opts:[['that','that'],['when','when'],['if','if']] },
      ],
    },
  ],
};


// ──────────────────────────────────────────────────────────────────────────
// CONTENIDO REAL — I2_WRITTEN_L18_TEST1_B  (Units 1–8 · Prueba 1 · Lección 18 · Opción B)
// Convertido 1:1 del PDF de Cambridge. Claves separadas del estudiante.
// needsReview = corrección preliminar; revisión docente.
// ──────────────────────────────────────────────────────────────────────────
const EXAM_I2_T1_B = {
  id: 'I2_WRITTEN_L18_TEST1_B',
  nivel: 'I2',
  contenido_real: true,
  oficial: true,
  titulo: 'Examen Escrito · Prueba 1',
  unidades: 'Unidades 1–8',
  leccion: 18,
  porcentaje: null,
  ponderacion_configurable: true,
  ponderacion_fuente: 'plan_academico',
  ponderacion_por_plan: { con_ina: 5, sin_ina: 15 },
  subtitulo: 'Unidades 1–8 · Lección 18',
  atribucion: 'Material de referencia interno: Interchange 3 © Cambridge University Press',
  puntos_totales: 50,
  videos: { listening_A: 'ndVof6jog6k', listening_B: 'ndVof6jog6k' },
  audioScript: {
    A: [
      ['', '[phone rings]'],
      ['GINA', 'Hello?'],
      ['NICK', "Hi, Gina. It's Nick."],
      ['GINA', "Hi, Nick. What's up?"],
      ['NICK', 'Nothing much, but I was wondering if I could ask you a favor.'],
      ['GINA', 'Sure. What is it?'],
      ['NICK', 'Well, remember I told you that my brother and sister-in-law are coming to visit us in two weeks?'],
      ['GINA', "Yeah. It'll be great to see Don and Julia. It's been over two years since I last saw them."],
      ['NICK', "Well, my wife and I were talking about it over breakfast this morning, and I realized we don't have anyplace for them to sleep. Would it be OK if they stayed with you for a couple of nights?"],
      ['GINA', "That would normally be fine, Nick, but we don't have any room now, either, since my daughter moved back in with us."],
      ['NICK', "Oh, I forgot about that. I guess I'll have to find them a hotel room in town. Thanks anyway, Gina."],
      ['GINA', 'Sorry, Nick.'],
    ],
    B: [
      ['STEVE', 'Hey, Kara, you and Stacy are really good friends, right? What kind of person is she?'],
      ['KARA', "Well, she's very loyal, Steve."],
      ['STEVE', 'What do you mean?'],
      ['KARA', "She's just someone who's always there when I need her. For example, a few years ago, I was sick and needed help around the house. She spent a whole weekend cleaning my bedroom, living room, and kitchen, including all my dirty dishes!"],
      ['STEVE', "Now that's friendship!"],
      ['KARA', "And then last year, she helped me with my boyfriend. We had an argument, and she agreed to talk to him about my feelings, even though she doesn't like him very much."],
      ['STEVE', "I really like it when someone will do something for you, even when they don't always enjoy it."],
      ['KARA', "Well, that's Stacy. She'd do anything for a friend."],
    ],
  },
  sections: [
    {
      letter:'A', points:2, per:'1 punto c/u', type:'listening-mc', listening:'A',
      instruction:'Listen to the phone conversation. Check (✓) the correct answers.',
      questions:[
        { id:'A1', stem:'Who is coming to visit in two weeks?', correct:'brother', opts:[
          ['brother', "Nick's brother"], ['cousin', "Nick's cousin"], ['daughter', "Gina's daughter"] ] },
        { id:'A2', stem:"Nick's guests are going to stay _____.", correct:'hotel', opts:[
          ['withhim', 'with him'], ['gina', 'with Gina'], ['hotel', 'in a hotel'] ] },
      ],
    },
    {
      letter:'B', points:2, per:'1 punto c/u', type:'listening-mc', listening:'B',
      instruction:'Listen to the people talking. Check (✓) the correct answers.',
      questions:[
        { id:'B1', stem:'Stacy is someone who _____.', correct:'helps', opts:[
          ['cleans', 'cleans a lot'], ['helps', 'helps her friends'], ['hurts', "hurts people’s feelings"] ] },
        { id:'B2', stem:'Steve likes it when people _____.', correct:'situation', opts:[
          ['sick', 'stay friends even when they get sick'], ['disagree', "won’t disagree no matter what you say to them"], ['situation', 'help you in any situation'] ] },
      ],
    },
    {
      letter:'C', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct word to complete each sentence.',
      questions:[
        { id:'C1', stem:'Carlos shouldn’t have called Ken a liar. He _____ Ken an apology.', correct:'owes', opts:[['declines','declines'],['receives','receives'],['owes','owes']] },
        { id:'C2', stem:'Mia doesn’t like sharing her office supplies with her co-workers. She’s a very _____ person.', correct:'stingy', opts:[['stingy','stingy'],['easygoing','easygoing'],['supportive','supportive']] },
        { id:'C3', stem:'Peter has noticed that there are fewer jobs available. He’s very worried about _____.', correct:'unemployment', opts:[['unemployment','unemployment'],['famine','famine'],['global','global warming']] },
        { id:'C4', stem:'There’s something wrong with my tablet computer. This fitness app keeps _____.', correct:'freezing', opts:[['freezing','freezing'],['jamming','jamming'],['skipping','skipping']] },
        { id:'C5', stem:'Should I use my savings to fix my car or pay my rent? What _____.', correct:'dilemma', opts:[['triumph','a triumph'],['coincidence','a coincidence'],['dilemma','a dilemma']] },
      ],
    },
    {
      letter:'D', points:6, per:'1 punto c/u', type:'error-correction', needsReview:true,
      instruction:'Circle the incorrect word in each sentence. Then write the correct word or words on the blank.',
      questions:[
        { id:'D1', html:'I’m interested in <u>hear</u> more about your trip to India.', correct:'hearing' },
        { id:'D2', html:'For me, improving my writing is harder <u>that</u> learning new words.', correct:'than' },
        { id:'D3', html:'If you want to park in the school parking lot, you’re supposed <u>getting</u> a parking permit.', correct:'to get' },
        { id:'D4', html:'Would you rather <u>driven</u> a small truck or a large car?', correct:'drive' },
        { id:'D5', html:'You can learn more about other people and cultures by <u>take</u> a world literature course.', correct:'taking' },
        { id:'D6', html:'I lived in Tokyo last year. Before that, I <u>have</u> lived in Los Angeles.', correct:'had' },
      ],
    },
    {
      letter:'E', points:4, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct word or phrase to complete each request.',
      questions:[
        { id:'E1', stem:'Is it _____ if I open the window?', correct:'OK', opts:[['OK','OK'],['mind','mind'],['please','please']] },
        { id:'E2', stem:'Could you ask Amelia _____ my plants?', correct:'to water', opts:[['water','water'],['to water','to water'],['watering','watering']] },
        { id:'E3', stem:'Can you tell Ben _____ we’ll be early?', correct:'that', opts:[['if','if'],['whether','whether'],['that','that']] },
        { id:'E4', stem:'I was wondering if I _____ talk to you for a few minutes?', correct:'could', opts:[['do','do'],['could','could'],['would','would']] },
      ],
    },
    {
      letter:'F', points:6, per:'1 punto c/u', type:'matching',
      instruction:'Match the parts to make logical sentences.',
      left:[
        { n:1, text:'I’d prefer a co-worker _____' },
        { n:2, text:'It makes me feel good _____' },
        { n:3, text:'I’d rather have my own business _____' },
        { n:4, text:'One way to get a job _____' },
        { n:5, text:'An accountant is better paid _____' },
        { n:6, text:'Finding a better job is something _____' },
      ],
      right:[
        { l:'a', text:'when my boss encourages me.' },
        { l:'b', text:'than a server.' },
        { l:'c', text:'I can depend on.' },
        { l:'d', text:'I’d like to think about doing.' },
        { l:'e', text:'is to search the Internet for job openings.' },
        { l:'f', text:'than work for a company.' },
      ],
      answers:{ 1:'c', 2:'a', 3:'f', 4:'e', 5:'b', 6:'d' },
    },
    {
      letter:'G', points:5, per:'1 punto c/u', type:'reading-tf',
      instruction:'Read about the British Petroleum oil disaster. Then circle T (true) or F (false).',
      passageTitle:'The British Petroleum Oil Disaster',
      passage:[
        'A large amount of pollution along seacoasts is caused by the mostly accidental spilling of petroleum from ships and from oil-drilling operations. It is estimated that one ton of oil is spilled for every million tons shipped. When an oil-drilling unit explodes in the ocean, spilling tons of crude oil that washes up on shore, it can mean environmental disaster.',
        'The worst oil spill in the U.S. occurred on April 20, 2010 when the oil-drilling unit Deepwater Horizon exploded in the Gulf of Mexico off the coasts of Louisiana, Alabama, Mississippi, and Florida. Within three months, the oil well released approximately 4.9 million barrels of oil, about 53,000 barrels a day. Natural water currents and weather conditions caused the spilled oil to spread out over 2,500 square miles (6,500 square kilometers), covering the fragile shorelines in the area. The Deepwater Horizon oil spill had a disastrous effect on the rich wildlife of the Gulf Coast. Many thousands of birds and sea animals, such as turtles, crabs, dolphins, and fish were killed.',
        'The first efforts to close the oil well using remotely operated underwater vehicles failed. Another idea to cover the oil well with a 125-ton dome also failed. Finally, on July 15, 2010, workers placed a cap on the well and secured it with mud and cement. One lesson of the Deepwater Horizon disaster and other recent oil spills: The best way to prevent such disasters is to change how oil companies drill for oil by using less risky methods.',
      ],
      questions:[
        { id:'G1', text:'Oil spills are usually accidental.', correct:'T' },
        { id:'G2', text:'The Deepwater Horizon spilled nearly 5 million barrels of oil into the sea.', correct:'T' },
        { id:'G3', text:'The oil spill had little effect on the wildlife in the Gulf Coast area.', correct:'F' },
        { id:'G4', text:'The first efforts to close the oil well were successful.', correct:'F' },
        { id:'G5', text:'Less-risky methods of drilling for oil would help to prevent oil-spill disasters.', correct:'T' },
      ],
    },
    {
      letter:'H', points:4, per:'1 punto c/u', type:'verb-fill', needsReview:true,
      instruction:'Fill in the blank with the correct form of the verb.',
      questions:[
        { id:'H1', pre:'Many species', hint:'endanger', post:'as a result of deforestation.', correct:['are endangered','are being endangered','have been endangered'] },
        { id:'H2', pre:'The best way', hint:'help', post:'victims of famine is to donate money to the World Food Program.', correct:['to help'] },
        { id:'H3', pre:'Fresh water in our city', hint:'deplete', post:'by people who don’t care about conservation.', correct:['is depleted','is being depleted','has been depleted'] },
        { id:'H4', pre:'We can do something about the trash problem by', hint:'recycle', post:'more of our waste.', correct:['recycling'] },
      ],
    },
    {
      letter:'I', points:5, per:'1 punto c/u', type:'para-verb', needsReview:true,
      instruction:'Complete the paragraph with the correct form of the verbs.',
      blanks:[
        { id:'I1', hint:'remember', correct:['remembered'] },
        { id:'I2', hint:'not get', correct:["hadn’t gotten","hadn't gotten",'had not gotten'] },
        { id:'I3', hint:'go', correct:['went'] },
        { id:'I4', hint:'buy', correct:['was buying'] },
        { id:'I5', hint:'get', correct:['got'] },
      ],
      template:[
        'I was shopping for curtains at the home improvement store yesterday when I ', {b:'I1'},
        ' about my husband’s birthday on Monday. I ', {b:'I2'},
        ' anything for him yet, so I ', {b:'I3'},
        ' to the power tool department. While I ', {b:'I4'},
        ' him a new tool, my husband came into the store. So, he ', {b:'I5'},
        ' his birthday present a few days early!'
      ],
    },
    {
      letter:'J', points:6, per:'1 punto c/u', type:'dialog-verb', needsReview:true,
      instruction:'Complete each response with the correct form of a verb from the box.',
      box:['get','replace','tear','listen','study','write'],
      questions:[
        { id:'J1', a:'I heard there was a fire in your building last night.', b:'Yes, I ____ just ____ out of the elevator when the alarm went off.', correct:['had gotten','had...gotten'] },
        { id:'J2', a:'What’s wrong with your microwave oven?', b:'They can’t fix it. It needs to be ____.', correct:['replaced'] },
        { id:'J3', a:'What’s wrong with the curtains?', b:'They’re ____.', correct:['torn'] },
        { id:'J4', a:'Would you rather take Spanish or Japanese?', b:'Actually, I’d rather ____ French.', correct:['study'] },
        { id:'J5', a:'How can I improve my accent?', b:'By ____ to how native speakers talk.', correct:['listening'] },
        { id:'J6', a:'Would you like to be a journalist?', b:'Sure. I’d love ____ for a newspaper.', correct:['writing','to write'] },
      ],
    },
    {
      letter:'K', points:5, per:'1 punto c/u', type:'para-choice',
      instruction:'Complete the paragraph with the correct words.',
      blanks:[
        { id:'K1', correct:'fixed', opts:[['fixing','fixing'],['fixed','fixed']] },
        { id:'K2', correct:'chip', opts:[['chip','chip'],['chipped','chipped']] },
        { id:'K3', correct:'torn', opts:[['tear','tear'],['torn','torn']] },
        { id:'K4', correct:'scratch', opts:[['scratch','scratch'],['scratched','scratched']] },
        { id:'K5', correct:'cleaning', opts:[['cleaned','cleaned'],['cleaning','cleaning']] },
      ],
      template:[
        'My apartment has several problems that need to be ', {b:'K1'},
        '. For one thing, there’s a big ', {b:'K2'},
        ' in the bathroom sink. Also, one of the curtains is ', {b:'K3'},
        ', and the cabinet has a ', {b:'K4'},
        ' on it. Finally, the whole place needs ', {b:'K5'},
        '. Hmm. Maybe it’s time to look for another place!'
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// CONTENIDO REAL — I2_WRITTEN_L32_TEST2_A  (Units 9–16 · Prueba 2 · Lección 32)
// Convertido 1:1 del Word/PDF original del campus (Test A). Claves separadas
// del estudiante. needsReview = corrección preliminar; revisión docente.
// ──────────────────────────────────────────────────────────────────────────
const EXAM_I2_T2_A = {
  id: 'I2_WRITTEN_L32_TEST2_A',
  nivel: 'I2',
  contenido_real: true,
  oficial: true,
  titulo: 'Examen Escrito · Prueba 2',
  unidades: 'Unidades 9–16',
  leccion: 32,
  porcentaje: null,
  ponderacion_configurable: true,
  ponderacion_fuente: 'plan_academico',
  ponderacion_por_plan: { con_ina: 5, sin_ina: 15 },
  subtitulo: 'Unidades 9–16 · Lección 32',
  atribucion: 'Material de referencia interno: Interchange 3 © Cambridge University Press',
  puntos_totales: 50,
  videos: { listening_A: 'czJMUYioXDM', listening_B: 'cWXLwJw5xYc' },
  audioScript: {
    A: [
      ['JACK', "You know, Ava, I've gained a lot of weight recently. I really wish I could learn to control my appetite."],
      ['AVA', 'Are you under a lot of stress, Jack? They say that people eat more when they feel stressed.'],
      ['JACK', "Well, that's not really my problem. I just like to eat, especially salty snacks."],
      ['AVA', 'Hmm. It might be a good idea to talk with a diet counselor or a nutritionist.'],
      ['JACK', "I've already tried that. I talked with someone who told me to eat more fruits and vegetables. The problem is, I don't like most fruits and vegetables."],
      ['AVA', 'Well, what about joining a weight-control group? I know someone who joined a group and found it very helpful. He said it was easier to lose weight when he could talk with other people who had the same problem.'],
      ['JACK', "Maybe I should try that. I know I can't change my eating habits by myself."],
    ],
    B: [
      ['ALICIA', "Hey, Alex. I wonder what happened to Aaron? He was supposed to meet us here at six, and it's already a quarter to seven."],
      ['ALEX', 'His car may have broken down again, Alicia. You know how his car is always breaking down.'],
      ['ALICIA', 'That was his old car. He got a new car last week, and his new car works fine.'],
      ['ALEX', "Oh. I didn't know that. Well, he might have just forgotten to come."],
      ['ALICIA', "That doesn't sound like Aaron, either. He never forgets anything."],
      ['ALEX', 'Well, I don\'t know, then. I saw Aaron yesterday, and the last thing I said to him was, "See you at Alicia\'s on Thursday." Uh, by the way, today is Thursday, isn\'t it?'],
      ['ALICIA', "No, Alex, it's Wednesday! You told Aaron to meet us here tomorrow. You told him the wrong day."],
      ['ALEX', "Uh-oh. Sorry, Alicia. I'd better text him and explain."],
    ],
  },
  sections: [
    {
      letter:'A', points:2, per:'1 punto c/u', type:'listening-mc', listening:'A',
      instruction:'Listen to the people talking. Check (✓) the correct answers.',
      questions:[
        { id:'A1', stem:'Jack _____.', correct:'eating', opts:[
          ['gained',"hasn't gained weight"],['eating','likes eating'],['snacks',"doesn't like salty snacks"] ] },
        { id:'A2', stem:'Ava thinks he should _____.', correct:'group', opts:[
          ['nutritionist','talk with another nutritionist'],['problem','tell her more about his problem'],['group','join a weight-control group'] ] },
      ],
    },
    {
      letter:'B', points:2, per:'1 punto c/u', type:'listening-mc', listening:'B',
      instruction:'Listen to the people talking. Check (✓) the correct answers.',
      questions:[
        { id:'B1', stem:'Aaron was supposed to _____.', correct:'meet', opts:[
          ['seven','come at seven o\u2019clock'],['meet','meet Alex and Alicia'],['car','get his car fixed'] ] },
        { id:'B2', stem:'Alex didn\u2019t know _____.', correct:'wednesday', opts:[
          ['oldcar',"Aaron's old car didn't work"],['six','they were meeting at six'],['wednesday','today was Wednesday'] ] },
      ],
    },
    {
      letter:'C', points:6, per:'1 punto c/u', type:'mc-inline',
      instruction:'Circle the correct word or phrase to complete each sentence.',
      questions:[
        { id:'C1', stem:'_____ the first MP3 players were introduced in the late 1990s, portable audio cassette players started going out of style.', correct:'assoon',
          opts:[['assoon','As soon as'],['until','Until']] },
        { id:'C2', stem:'UNICEF has been in existence _____ 1946.', correct:'since',
          opts:[['for','for'],['since','since']] },
        { id:'C3', stem:'_____ my grandfather was born, the Beatles stopped playing together.', correct:'before',
          opts:[['before','Before'],['during','During']] },
        { id:'C4', stem:'The first hybrid-electric vehicle was developed over 100 years _____.', correct:'ago',
          opts:[['since','since'],['ago','ago']] },
        { id:'C5', stem:'_____ 1989, East and West Berlin were separated by a wall.', correct:'until',
          opts:[['bythetime','By the time'],['until','Until']] },
        { id:'C6', stem:'The British built the first nuclear power station _____ 1953.', correct:'in',
          opts:[['in','in'],['since','since']] },
      ],
    },
    {
      letter:'D', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct word or phrase to complete each sentence.',
      questions:[
        { id:'D1', stem:"A few years ago, I was still very young and didn't know how to behave, but I've become more _____ since then.", correct:'sophisticated',
          opts:[['carefree','carefree'],['naive','naive'],['sophisticated','sophisticated']] },
        { id:'D2', stem:"Please close the window. I can't _____ all the noise on the street.", correct:'putup',
          opts:[['breakup','break up with'],['putup','put up with'],['comeup','come up with']] },
        { id:'D3', stem:"When things change, Leo isn't very adaptable. In fact, in new circumstances he's quite _____.", correct:'rigid',
          opts:[['rigid','rigid'],['cynical','cynical'],['upbeat','upbeat']] },
        { id:'D4', stem:'Brett didn\'t call his grandmother on her birthday. His _____ was that he was out of town and forgot.', correct:'excuse',
          opts:[['warning','warning'],['assumption','assumption'],['excuse','excuse']] },
        { id:'D5', stem:'The _____ results are in, and Maria Ramirez is the new mayor of the city.', correct:'election',
          opts:[['epidemic','epidemic'],['assassination','assassination'],['election','election']] },
      ],
    },
    {
      letter:'E', points:5, per:'1 punto c/u', type:'dialog-verb', needsReview:true,
      instruction:'Complete each suggestion with the correct form of the verb.',
      questions:[
        { id:'E1', a:"I haven't been getting to work on time lately.", b:'It might be a good idea ____ your home ten minutes earlier.', hint:'leave', correct:['to leave'] },
        { id:'E2', a:"I'd like to meet some new people.", b:'What about ____ at a community event?', hint:'volunteer', correct:['volunteering'] },
        { id:'E3', a:'Where can I get my nails ____?', b:"Why don't you paint them yourself?", hint:'paint', correct:['painted'] },
        { id:'E4', a:'I think my girlfriend wants to break up with me.', b:'One option is ____ to her.', hint:'talk', correct:['to talk'] },
        { id:'E5', a:"I'd like to have some people over for dinner, but I can't cook.", b:'You know, you can have the dinner ____ for you by a local restaurant.', hint:'make', correct:['made'] },
      ],
    },
    {
      letter:'F', points:5, per:'1 punto c/u', type:'matching',
      instruction:'Match the clauses to make logical sentences.',
      left:[
        { n:1, text:'For a new product to succeed _____' },
        { n:2, text:'After advertising your product, _____' },
        { n:3, text:'If Sam had been smarter, _____' },
        { n:4, text:'What do you hope _____' },
        { n:5, text:'Our product sold well _____' },
      ],
      right:[
        { l:'a', text:'he would have studied product design.' },
        { l:'b', text:"you'll have achieved in the advertising campaign?" },
        { l:'c', text:'because it filled a need in the market.' },
        { l:'d', text:"it has to catch people's attention." },
        { l:'e', text:'your sales will go up.' },
      ],
      answers:{ 1:'d', 2:'e', 3:'a', 4:'b', 5:'c' },
    },
    {
      letter:'G', points:5, per:'1 punto c/u', type:'error-correction', needsReview:true,
      instruction:'Circle the incorrect word in each sentence. Then write the correct word on the blank.',
      questions:[
        { id:'G1', html:'Museums are interesting to visit, <u>don\u2019t</u> they?', correct:'aren\u2019t', accepted:['aren\u2019t',"aren't"] },
        { id:'G2', html:'In order for the package to <u>arrived</u> on time, it needs to be shipped by Monday.', correct:'arrive' },
        { id:'G3', html:'I have <u>learn</u> a lot of new skills at college.', correct:'learned' },
        { id:'G4', html:'Movie stars have their clothing <u>pick</u> out by professional stylists.', correct:'picked' },
        { id:'G5', html:'A stunt person, <u>that</u> replaces an actor in dangerous scenes, earns good money.', correct:'who' },
      ],
    },
    {
      letter:'H', points:6, per:'1 punto c/u', type:'para-choice',
      instruction:'Choose the correct form of the verbs to complete the passage.',
      blanks:[
        { id:'H1', correct:'accomplished', opts:[['accomplished',"'ve accomplished"],['was',"was accomplished"]] },
        { id:'H2', correct:'traveled',     opts:[['traveled','traveled'],['have',"have traveled"]] },
        { id:'H3', correct:'been',         opts:[['being',"'m being"],['been',"'ve been"]] },
        { id:'H4', correct:'willget',      opts:[['get','get'],['willget',"will get"]] },
        { id:'H5', correct:'llstart',      opts:[['dstart',"'d start"],['llstart',"'ll start"]] },
        { id:'H6', correct:'havebought',   opts:[['havebought',"have bought"],['willhave',"will have bought"]] },
      ],
      template:[
        'I ', {b:'H1'}, ' a lot in the last few years. After I graduated from college, I ', {b:'H2'},
        ' around South America for a month. Since then, I ', {b:'H3'},
        ' able to get a job with a new technology company in the city. Now I\u2019m thinking about the future. Julia and I ', {b:'H4'},
        ' married next year, and then we ', {b:'H5'}, ' looking for a house. We\u2019d like to ', {b:'H6'},
        ' our own home before we start a family.'
      ],
    },
    {
      letter:'I', points:4, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct phrase to complete each response.',
      questions:[
        { id:'I1', stem:'A: Ugh. That meal wasn\u2019t very good. — B: Really? I thought it was great. I _____ eaten more if they had cooked it!', correct:'would',
          opts:[['should','should have'],['would','would have'],['must','must have']] },
        { id:'I2', stem:'A: Cassandra looks upset. — B: She _____ gotten some bad news.', correct:'must',
          opts:[['should','should have'],['must','must have'],['would','would have']] },
        { id:'I3', stem:'A: Why wasn\u2019t Roger at the meeting? — B: He _____ forgotten about it.', correct:'could',
          opts:[['should','should have'],['would','would have'],['could','could have']] },
        { id:'I4', stem:'A: I hope you don\u2019t mind, but I paid the bill for dinner. — B: Oh, you _____ done that, but I do appreciate your kindness!', correct:'shouldnt',
          opts:[['wouldnt',"wouldn't have"],['shouldnt',"shouldn't have"],['maynot',"may not have"]] },
      ],
    },
    {
      letter:'J', points:6, per:'1 punto c/u', type:'reading-tf',
      instruction:'Read about TOMS Shoes. Then circle T (true) or F (false).',
      passageTitle:'TOMS Shoes',
      passage:[
        'TOMS Shoes has become one of America\u2019s newest successful businesses. TOMS Shoes is a company that makes and sells simple, lightweight shoes that are similar to the alpargata-style shoe worn by Argentinean farmers. Located in Santa Monica, California, TOMS Shoes was started by entrepreneur Blake Mycoskie in 2006. What makes this shoe company unique is that for every pair of shoes sold, TOMS donates a pair to a person in need.',
        'While traveling through poor villages in Argentina in the mid-2000s, Mycoskie encountered numerous children without shoes. It was during that time that he had the idea to start a shoe company. Mycoskie returned to the United States, sold his online driver\u2019s education company, and used that money to start TOMS.',
        'Since Mycoskie started his one-for-one movement, his company has donated over 60 million pairs of shoes around the world. People ask Mycoskie why he chose to make and donate shoes. His response is that poor people without shoes to wear are at a greater risk to contract a soil-based disease like podoconiosis, which causes a person\u2019s feet and lower legs to swell. In addition, shoes prevent feet from getting cuts and sores, which are painful and dangerous if infected.',
        'The other reason Mycoskie chose to donate shoes is that shoes are often a required part of a child\u2019s school uniform. Children without shoes are not allowed to attend school because their uniform is incomplete. Mycoskie believes that children who don\u2019t have the opportunity to get an education also don\u2019t have the opportunity to realize their potential.',
      ],
      questions:[
        { id:'J1', text:'TOMS Shoes has been around for a very long time.', correct:'F' },
        { id:'J2', text:'For every pair of shoes sold, TOMS Shoes donates two pairs.', correct:'F' },
        { id:'J3', text:'Blake Mycoskie sold his car online and used that money to start his company.', correct:'F' },
        { id:'J4', text:'Blake Mycoskie says that shoes protect people from soil-based diseases.', correct:'T' },
        { id:'J5', text:'A required part of a child\u2019s school uniform is shoes.', correct:'T' },
        { id:'J6', text:'Blake Mycoskie believes that education allows people to realize their potential.', correct:'T' },
      ],
    },
    {
      letter:'K', points:4, per:'1 punto c/u', type:'verb-fill', needsReview:true,
      instruction:'Fill in the blank with the correct form of the verb.',
      questions:[
        { id:'K1', pre:'Many people in the world don\u2019t have a decent place to live. To help solve this problem, more low-cost housing needs', hint:'build', post:'.', correct:['to be built'] },
        { id:'K2', pre:'Disease is still a problem in some countries. More vaccines should', hint:'produce', post:'so that everyone can live a healthy life.', correct:['be produced'] },
        { id:'K3', pre:'Millions of stray animals are brought to animal shelters every year. A nationwide campaign should', hint:'undertake', post:'to encourage people to adopt these pets.', correct:['be undertaken'] },
        { id:'K4', pre:'We have a lot of street crime in our city. More police officers have', hint:'train', post:'to patrol the community on foot.', correct:['to be trained'] },
      ],
    },
  ],
};


// ──────────────────────────────────────────────────────────────────────────
// CONTENIDO REAL — I2_WRITTEN_L32_TEST2_B  (Units 9–16 · Prueba 2 · Lección 32 · Opción B)
// Interchange 3 → Intermedio II (I2 · verde). Convertido del PDF oficial:
//   ic5_l3_t9to16b.pdf · ic5_l3_t9to16b_key.pdf · ic5_l3_t9to16b_script.pdf
// Claves separadas del estudiante. needsReview = corrección preliminar.
// ──────────────────────────────────────────────────────────────────────────
const EXAM_I2_T2_B = {
  id: 'I2_WRITTEN_L32_TEST2_B',
  nivel: 'I2',
  contenido_real: true,
  oficial: true,
  titulo: 'Examen Escrito · Prueba 2',
  unidades: 'Unidades 9–16',
  leccion: 32,
  porcentaje: null,
  ponderacion_configurable: true,
  ponderacion_fuente: 'plan_academico',
  ponderacion_por_plan: { con_ina: 5, sin_ina: 15 },
  subtitulo: 'Unidades 9–16 · Lección 32',
  atribucion: 'Material de referencia interno: Interchange 3 © Cambridge University Press',
  puntos_totales: 50,
  videos: { listening_A: 'cWXLwJw5xYc', listening_B: 'cWXLwJw5xYc' },
  audioScript: {
    A: [
      ['CHRIS', 'You know, Natalie, I earned a lot last year. Now I have all this money in the bank, and I don’t know what to do with it. Do you have any ideas?'],
      ['NATALIE', 'Maybe you should just leave it in the bank for now. Are you going to buy anything soon, like a boat or a vacation home?'],
      ['CHRIS', 'Not really. I have everything I need right now.'],
      ['NATALIE', 'Then it might be a good idea to talk with someone in financial services. You might get some suggestions that way.'],
      ['CHRIS', 'I’ve already talked to my accountant. He said I should invest it so I can make more money. The trouble is, I don’t know anything about investments.'],
      ['NATALIE', 'Well, why don’t you join an investment club? You know, one of those clubs where people meet once a month, do research, and buy things together. I know someone who joined, and it helped him a lot. He said he learned a lot about investments from other people in the group.'],
      ['CHRIS', 'Hmm. That’s not a bad idea. Do you know where I can find out more about these clubs?'],
    ],
    B: [
      ['GRETA', 'Connor, I wonder what’s wrong with Melissa. She’s usually in such a good mood at work, but she’s been really depressed the last couple of days.'],
      ['CONNOR', 'You know, Greta, she may have broken up with her boyfriend – they’re always breaking up and then getting back together again.'],
      ['GRETA', 'That can’t be it. She hasn’t seen him for months.'],
      ['CONNOR', 'Oh, I didn’t know that. Maybe it’s this new project she’s working on. I know she’s had some problems with it.'],
      ['GRETA', 'I don’t think it could be that, either. We were talking about the project just yesterday, and she said it was going fine.'],
      ['CONNOR', 'Well, I don’t know, then. Maybe we should just ask her. You know, if something has happened to her family, or anything, maybe there’s something we could do to help.'],
      ['GRETA', 'You’re right, Connor. I’ll talk to her about it.'],
    ],
  },
  sections: [
    {
      letter:'A', points:2, per:'1 punto c/u', type:'listening-mc', listening:'A',
      instruction:'Listen to the people talking. Check (✓) the correct answers.',
      questions:[
        { id:'A1', stem:'Chris _____.', correct:'accountant', opts:[
          ['earn','didn’t earn much last year'],['house','needs to buy a vacation house soon'],['accountant','has talked to his accountant'] ] },
        { id:'A2', stem:'Natalie thinks Chris should _____.', correct:'club', opts:[
          ['boat','buy her a new boat'],['newaccountant','get a new accountant'],['club','join an investment club'] ] },
      ],
    },
    {
      letter:'B', points:2, per:'1 punto c/u', type:'listening-mc', listening:'B',
      instruction:'Listen to the people talking. Check (✓) the correct answers.',
      questions:[
        { id:'B1', stem:'Greta is worried about Melissa because Melissa _____.', correct:'depressed', opts:[
          ['work','isn’t coming to work'],['depressed','has been acting depressed'],['project','stopped working on her project'] ] },
        { id:'B2', stem:'Connor thinks that he and Greta should _____.', correct:'ask', opts:[
          ['boyfriend','talk to Melissa’s boyfriend'],['ask','ask Melissa what’s wrong'],['helpproject','help Melissa with her project'] ] },
      ],
    },
    {
      letter:'C', points:6, per:'1 punto c/u', type:'mc-inline',
      instruction:'Circle the correct word or phrase to complete each sentence.',
      questions:[
        { id:'C1', stem:'Typewriters have become obsolete _____ the invention of computers.', correct:'since', opts:[['before','before'],['since','since']] },
        { id:'C2', stem:'India has been an independent country _____ 60 years.', correct:'for', opts:[['for','for'],['at','at']] },
        { id:'C3', stem:'_____ Michael Jackson died in 2009, he had become famous around the world.', correct:'bythetime', opts:[['bythetime','By the time'],['after','After']] },
        { id:'C4', stem:'The U.S. TV show Friends lasted _____ ten years.', correct:'for', opts:[['for','for'],['since','since']] },
        { id:'C5', stem:'_____ the civil rights movement of the 1960s, voting rights were restricted for African-Americans in many U.S. states.', correct:'until', opts:[['until','Until'],['once','Once']] },
        { id:'C6', stem:'The Berlin Wall was built _____ 1961.', correct:'in', opts:[['in','in'],['from','from']] },
      ],
    },
    {
      letter:'D', points:5, per:'1 punto c/u', type:'dialog-verb', needsReview:true,
      instruction:'Complete each suggestion with the correct form of the verb.',
      questions:[
        { id:'D1', a:'I need to make some extra money.', b:'What about ____ a part-time job?', hint:'get', correct:['getting'] },
        { id:'D2', a:'I’m so disorganized. I need to learn how to organize my life.', b:'Have you thought about ____ a professional organizer?', hint:'hire', correct:['hiring'] },
        { id:'D3', a:'I want to buy a new sofa, but it’s too big to put in my car.', b:'You know, you can get it ____ by the store.', hint:'deliver', correct:['delivered'] },
        { id:'D4', a:'I’d like to improve my memory.', b:'It might be a good idea ____ a book on memory techniques.', hint:'read', correct:['to read'] },
        { id:'D5', a:'Now that I have a new job, I just don’t have time to walk my dog during the week.', b:'Why don’t you have him ____ by a dog-walking service Monday through Friday?', hint:'walk', correct:['walked'] },
      ],
    },
    {
      letter:'E', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct word to complete each sentence.',
      questions:[
        { id:'E1', stem:'When I go to Lydia for advice, she helps me focus on the practical issues. She’s very _____.', correct:'pragmatic', opts:[['ambitious','ambitious'],['pragmatic','pragmatic'],['naive','naive']] },
        { id:'E2', stem:'Richard is always arguing with his classmates. He doesn’t _____ them.', correct:'getalong', opts:[['getalong','get along with'],['keepup','keep up with'],['breakup','break up with']] },
        { id:'E3', stem:'Molly isn’t very compassionate. She seems uncaring and _____ about other people’s problems.', correct:'insensitive', opts:[['timid','timid'],['resourceful','resourceful'],['insensitive','insensitive']] },
        { id:'E4', stem:'The basketball players are on strike and won’t play unless the owners give in to their _____ for better health insurance.', correct:'demand', opts:[['demand','demand'],['suggestion','suggestion'],['prediction','prediction']] },
        { id:'E5', stem:'The first humans landed on the moon in 1969. It was a great _____.', correct:'achievement', opts:[['achievement','achievement'],['discovery','discovery'],['epidemic','epidemic']] },
      ],
    },
    {
      letter:'F', points:5, per:'1 punto c/u', type:'matching',
      instruction:'Match the clauses to make logical sentences.',
      left:[
        { n:1, text:'For a person to become successful, _____' },
        { n:2, text:'After I went to college, _____' },
        { n:3, text:'If I’d listened to my parents, _____' },
        { n:4, text:'I’ve been able to do well _____' },
        { n:5, text:'I didn’t accomplish much when I was younger _____' },
      ],
      right:[
        { l:'a', text:'I became more responsible.' },
        { l:'b', text:'because I didn’t want to work hard.' },
        { l:'c', text:'since I started working.' },
        { l:'d', text:'I would have gone to college.' },
        { l:'e', text:'it’s necessary to have a good attitude.' },
      ],
      answers:{ 1:'e', 2:'a', 3:'d', 4:'c', 5:'b' },
    },
    {
      letter:'G', points:5, per:'1 punto c/u', type:'error-correction', needsReview:true,
      instruction:'Circle the incorrect word in each sentence. Then write the correct word or words on the blank.',
      questions:[
        { id:'G1', html:'Elizabeth Taylor was from England, <u>didn’t</u> she?', correct:'wasn’t', accepted:["wasn’t", "wasn't"] },
        { id:'G2', html:'In order <u>climbing</u> Mount Everest, you need to be in top physical shape.', correct:'to climb' },
        { id:'G3', html:'By the time she’s 30, Anna would like to have <u>travel</u> the world.', correct:'traveled', accepted:['traveled','travelled'] },
        { id:'G4', html:'A lot of charities get their work <u>doing</u> by volunteers.', correct:'done' },
        { id:'G5', html:'Muhammad Ali, <u>that</u> was born Cassius Clay in 1942, was nicknamed “The Greatest” because of his superior boxing skills.', correct:'who' },
      ],
    },
    {
      letter:'H', points:6, per:'1 punto c/u', type:'para-choice',
      instruction:'Choose the correct form of the verbs to complete the passage.',
      blanks:[
        { id:'H1', correct:'managed', opts:[['managed','’ve managed'],['wasmanaged','was managed']] },
        { id:'H2', correct:'found', opts:[['found','found'],['havefound','have found']] },
        { id:'H3', correct:'been', opts:[['being','’m being'],['been','’ve been']] },
        { id:'H4', correct:'willmove', opts:[['move','move'],['willmove','will move']] },
        { id:'H5', correct:'llneed', opts:[['dneed','’d need'],['llneed','’ll need']] },
        { id:'H6', correct:'havehad', opts:[['havehad','have had'],['willhavehad','will have had']] },
      ],
      template:[
        'I ', {b:'H1'}, ' to achieve a lot recently. After I looked for a year or so, I ', {b:'H2'},
        ' a great new job. Since then, I ', {b:'H3'}, ' able to feel more confident at work. Also, after looking for several months, I ', {b:'H4'},
        ' into a wonderful apartment next weekend. The apartment is very large, so I ', {b:'H5'},
        ' to buy some new furniture. By the end of the summer, I’d like to ', {b:'H6'}, ' at least a few parties!'
      ],
    },
    {
      letter:'I', points:4, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct phrase to complete each response.',
      questions:[
        { id:'I1', stem:'A: I’m so hungry. B: You _____ eaten something before we left.', correct:'shouldhave', opts:[['wouldhave','would have'],['mighthave','might have'],['shouldhave','should have']] },
        { id:'I2', stem:'A: Tabitha seems happy. B: Hmm. She _____ done well on her test.', correct:'musthave', opts:[['musthave','must have'],['shouldhave','should have'],['willhave','will have']] },
        { id:'I3', stem:'A: Why wasn’t Derek in school? B: He _____ been sick.', correct:'mayhave', opts:[['mayhave','may have'],['wouldhave','would have'],['shouldhave','should have']] },
        { id:'I4', stem:'A: The coach was really angry with you. What happened? B: If I’d remembered to set my alarm clock, I _____ been late for practice.', correct:'wouldnthave', opts:[['mustnot','must not have'],['shouldnt','shouldn’t have'],['wouldnthave','wouldn’t have']] },
      ],
    },
    {
      letter:'J', points:6, per:'1 punto c/u', type:'reading-tf',
      instruction:'Read about Groupon. Then circle T (true) or F (false).',
      title:'Groupon',
      paragraphs:[
        'Groupon is one of today’s newest and most exciting successful businesses. Groupon offers discounted gift certificates that can be used at both local and national companies and has more than 35 million registered users.',
        'Groupon, a combination of the words group and coupon, was created by Andrew Mason from Pittsburgh, Pennsylvania, in 2008. Mason was originally working on the Point, a social-justice web-based project. Groupon was an afterthought project that Mason and his business associates hoped would pay the bills while they continued work on the Point.',
        'Groupon offers people in certain areas around the world the opportunity to buy products and services from local businesses at a big discount. A minimum number of buyers need to agree to purchase the deal. Groupon also makes sure that the business offering the product doesn’t lose money in the process.',
        'Mason feels that Groupon can be used as a tool for social change because it helps revitalize local economies.'
      ],
      questions:[
        { id:'J1', text:'In 2008, Groupon was not Andrew Mason’s main project.', correct:'T' },
        { id:'J2', text:'Groupon was created to make money.', correct:'T' },
        { id:'J3', text:'Groupon offers deals from restaurants that are far-away.', correct:'F' },
        { id:'J4', text:'A certain number of people have to agree to buy a gift certificate so the deal works.', correct:'T' },
        { id:'J5', text:'Businesses that participate in Groupon often lose money.', correct:'F' },
        { id:'J6', text:'Andrew Mason thinks Groupon has a negative effect on social change.', correct:'F' },
      ],
    },
    {
      letter:'K', points:4, per:'1 punto c/u', type:'verb-fill', needsReview:true,
      instruction:'Fill in the blank with the correct form of the verb.',
      questions:[
        { id:'K1', pre:'Hunger is a real problem in our community. People should not', hint:'force', post:'to suffer from hunger because of the high cost of food.', correct:['be forced'] },
        { id:'K2', pre:'Bullying is becoming a huge problem in schools. Teachers and students ought', hint:'require', post:'to take an anti-bullying seminar every year.', correct:['to be required'] },
        { id:'K3', pre:'Company outsourcing is taking jobs away from people in our country. Local companies should', hint:'fine', post:'for each job they move to a foreign country.', correct:['be fined'] },
        { id:'K4', pre:'Taxes on businesses and individuals are too high. Taxes have to', hint:'reduce', post:'in order to improve the economy.', correct:['be reduced'] },
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// CONTENIDO REAL — I1_WRITTEN_L18_TEST1_A  (Units 1–8 · Prueba 1 · Lección 18)
// Interchange 2 → Intermedio I (I1 · azul). Convertido 1:1 de:
//   ic5_l2_t1to8a.pdf · ic5_l2_t1to8a_key.pdf · ic5_l2_t1to8a_script.pdf
// Claves separadas del estudiante. needsReview = corrección preliminar.
// ──────────────────────────────────────────────────────────────────────────
const EXAM_I1_T1_A = {
  id: 'I1_WRITTEN_L18_TEST1_A',
  nivel: 'I1',
  contenido_real: true,
  oficial: true,
  titulo: 'Examen Escrito · Prueba 1',
  unidades: 'Unidades 1–8',
  leccion: 18,
  porcentaje: null,
  ponderacion_configurable: true,
  ponderacion_fuente: 'plan_academico',
  ponderacion_por_plan: { con_ina: 5, sin_ina: 15 },
  subtitulo: 'Unidades 1–8 · Lección 18',
  atribucion: 'Material de referencia interno: Interchange 2 © Cambridge University Press',
  puntos_totales: 50,
  videos: { listening_A: 'P9CBuvBJNZY', listening_B: 'Pi19RYAKGig' },
  audioScript: {
    A: [
      ['PAULO', "What's wrong, Georgia? You look upset."],
      ['GEORGIA', "I am upset, Paulo. I'm having problems at school."],
      ['PAULO', 'Really? What kind of problems?'],
      ['GEORGIA', "It's my English teacher. I wish I could be in another teacher's class. She's never satisfied with my work. I write something that I think is really good, and she still finds something wrong with it."],
      ['PAULO', 'Maybe you ought to talk to her about it.'],
      ['GEORGIA', "I have talked to her, but it doesn't seem to make any difference. I think I'm going to fail her class."],
    ],
    B: [
      ['DAVE', "Hi, Michelle. Are you going to Zoe's pool party tomorrow?"],
      ['MICHELLE', "Yes, I am. Do you know who's bringing the food? Maybe I can bring something, too."],
      ['DAVE', "No, that's OK. Zoe's taking care of all that. But could you tell me where I can get some chicken salad? That's her favorite."],
      ['MICHELLE', "I don't know where you can get it, but I can tell you how to make it – I make it all the time. First, cook some chicken. You can bake it, barbecue it, or broil it. Then cut the chicken into small pieces. After that, cut up onions and celery. Next, put the chicken, onions, and celery into a bowl. Then, add mayonnaise. It's really easy."],
    ],
  },
  sections: [
    {
      letter:'A', points:2, per:'1 punto c/u', type:'listening-mc', listening:'A',
      instruction:'Listen to Paulo and Georgia talking. Check (✓) the correct answers.',
      questions:[
        { id:'A1', stem:'Georgia wishes she _____.', correct:'teacher', opts:[
          ['betterjob','could do a better job'],['teacher','had another teacher'],['writer','could be a better writer'] ] },
        { id:'A2', stem:'Paulo thinks she should _____.', correct:'talk', opts:[
          ['write','write about it'],['change','change schools'],['talk','talk to her teacher'] ] },
      ],
    },
    {
      letter:'B', points:2, per:'1 punto c/u', type:'listening-mc', listening:'B',
      instruction:'Listen to Dave and Michelle talking. Check (✓) the correct answers.',
      questions:[
        { id:'B1', stem:'Michelle wants _____.', correct:'food', opts:[
          ['pool','to plan a pool party'],['food',"to know who's bringing the food"],['eat','to eat some chicken salad'] ] },
        { id:'B2', stem:'Michelle tells Dave to first _____.', correct:'cook', opts:[
          ['cutchicken','cut up the chicken'],['cutonions','cut up the onions and celery'],['cook','bake, barbecue, or broil the chicken'] ] },
      ],
    },
    {
      letter:'C', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct words to complete the conversation.',
      questions:[
        { id:'C1', stem:'Mr. Peterson: Dan, _____ you mind washing the dishes?', correct:'would',
          opts:[['should','should'],['could','could'],['would','would']] },
        { id:'C2', stem:"Dan: Can I do it later? I don't _____ to go to practice tonight.", correct:'have',
          opts:[['have','have'],['must','must'],['ought','ought']] },
        { id:'C3', stem:'Mr. Peterson: No. You _____ do it now. Our guests are arriving in an hour.', correct:'should',
          opts:[['needs','needs'],['should','should'],['would','would']] },
        { id:'C4', stem:'Dan: All right, but _____ you give me a few minutes to finish this video game?', correct:'could',
          opts:[['should','should'],['ought','ought'],['could','could']] },
        { id:'C5', stem:'Mr. Peterson: Well, OK, but _____ better start right after that.', correct:'youd',
          opts:[['youll',"you'll"],['youd',"you'd"],['youve',"you've"]] },
      ],
    },
    {
      letter:'D', points:6, per:'1 punto c/u', type:'matching',
      instruction:'Match the answers with the questions.',
      left:[
        { n:1, text:'Where are you going on vacation next year? _____' },
        { n:2, text:'Did you go camping last summer? _____' },
        { n:3, text:'Have you ever been to a national park? _____' },
        { n:4, text:'Could you please call the travel agency? _____' },
        { n:5, text:"Can you tell me when you're arriving? _____" },
        { n:6, text:'How long are you going to be away? _____' },
      ],
      right:[
        { l:'a', text:'In a few hours.' },
        { l:'b', text:'About two weeks.' },
        { l:'c', text:"Maybe I'll just stay home." },
        { l:'d', text:'No, we went to the beach.' },
        { l:'e', text:"No, I haven't." },
        { l:'f', text:"I'd be glad to." },
      ],
      answers:{ 1:'c', 2:'d', 3:'e', 4:'f', 5:'a', 6:'b' },
    },
    {
      letter:'E', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Read each conversation. Check (✓) the correct response.',
      questions:[
        { id:'E1', stem:'A: Would you mind waiting here, please?', correct:'notime',
          opts:[['cold',"Sorry. I'm cold."],['notime',"I'm sorry. I can't. I don't have time."],['agree','Yes, I agree. We are!']] },
        { id:'E2', stem:'A: What are you going to do Saturday?', correct:'nothing',
          opts:[['nothing',"I probably won't do anything."],['fun',"That doesn't sound like much fun."],['early',"It's too early."]] },
        { id:'E3', stem:"A: You'd better take a sweater with you.", correct:'thanks',
          opts:[['better','This one is better.'],['thanks','Thanks. I will.'],['should','Yes, you should.']] },
        { id:'E4', stem:'A: Do you know where the nearest bus stop is?', correct:'dont',
          opts:[['appreciate',"That's great. I really appreciate it."],['see','Sure. Would you like to see them?'],['dont',"No, I'm sorry. I don't."]] },
        { id:'E5', stem:'A: I wish I could take a vacation.', correct:'mean',
          opts:[['why',"That's too bad. Why not?"],['mean','I know what you mean.'],['either',"I don't like to, either."]] },
      ],
    },
    {
      letter:'F', points:5, per:'1 punto c/u', type:'para-fill',
      instruction:'Complete the paragraph with words from the box. One word will not be used.',
      box:['almost','enough','more','as','fewer','too'],
      blanks:[
        { id:'F1', hint:'recuadro', correct:'enough' },
        { id:'F2', hint:'recuadro', correct:'too' },
        { id:'F3', hint:'recuadro', correct:'as' },
        { id:'F4', hint:'recuadro', correct:'fewer' },
        { id:'F5', hint:'recuadro', correct:'more' },
      ],
      template:[
        "My city has some serious transportation problems. First, there aren't ", {b:'F1'},
        ' buses, and many of the buses are ', {b:'F2'},
        " crowded. There is a subway system, but the subways are busy, too – they're as crowded ", {b:'F3'},
        " the buses. Part of the problem is there's too little parking downtown. There should be either ", {b:'F4'},
        ' cars, or one or two ', {b:'F5'}, ' parking garages.'
      ],
    },
    {
      letter:'G', points:6, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct word or phrase to complete each sentence.',
      questions:[
        { id:'G1', stem:'The city passed a new bill to build several new bike _____.', correct:'lanes',
          opts:[['lanes','lanes'],['lights','lights'],['spaces','spaces']] },
        { id:'G2', stem:'Your boots are wet. _____ before you walk on my clean floor.', correct:'takeoff',
          opts:[['takeout','Take them out'],['turnoff','Turn them off'],['takeoff','Take them off']] },
        { id:'G3', stem:"Molly's new apartment is amazing. It's so bright and _____.", correct:'modern',
          opts:[['rundown','run-down'],['dingy','dingy'],['modern','modern']] },
        { id:'G4', stem:"When I travel, I don't usually bring a large suitcase. I use my _____ instead.", correct:'carryon',
          opts:[['firstaid','first-aid kit'],['carryon','carry-on bag'],['vaccination','vaccination']] },
        { id:'G5', stem:'I only _____ free apps onto my tablet.', correct:'download',
          opts:[['download','download'],['backup','back up'],['rundown','run down']] },
        { id:'G6', stem:'Could you _____ the TV, please?', correct:'turndown',
          opts:[['turndown','turn down'],['takeout','take out'],['putdown','put down']] },
      ],
    },
    {
      letter:'H', points:5, per:'1 punto c/u', type:'para-verb', needsReview:true,
      instruction:'Complete this conversation with the simple past or the present perfect of the verbs in parentheses.',
      blanks:[
        { id:'H1', hint:'try',      correct:['Have you ever tried'] },
        { id:'H2', hint:'not have', correct:["haven't had",'have not had'] },
        { id:'H3', hint:'drink',    correct:['did you drink'] },
        { id:'H4', hint:'make',     correct:['made'] },
        { id:'H5', hint:'get',      correct:['got'] },
      ],
      template:[
        'A: ', {b:'H1'}, ' the Indian drink chai?   B: Yes, but I ', {b:'H2'},
        ' any for a long time.   A: When ', {b:'H3'},
        ' it?   B: Last winter. I ', {b:'H4'},
        ' it for my roommate when the weather ', {b:'H5'}, ' really cold.'
      ],
    },
    {
      letter:'I', points:4, per:'1 punto c/u', type:'reading-tf',
      instruction:'Read about the Winter Carnival. Then circle T (true) or F (false).',
      passageTitle:"Quebec's Winter Carnival",
      passage:[
        "Quebec's Winter Carnival is a special celebration in Canada. This holiday started about 50 years ago and lasts for 17 days each year. It celebrates the sights and sounds of winter.",
        "The Winter Carnival has a special character called Bonhomme Carnaval. Bonhomme Carnaval looks like a snowman, but he is really a man in a snowman's costume. Bonhomme Carnaval is present at all of the carnival activities, and he plays an important role as the symbol of the celebration.",
        'There are many exciting activities at the Winter Carnival. For example, there are night parades. There is also a snow sculpture display. This display is like an outdoor museum, where artists show sculptures they have made out of snow. Finally, there are many sporting events such as ski races, canoe races, and even a "snow swim." The Winter Carnival has become very popular with tourists. Now almost a million people come to this northern city to visit the carnival each year.',
      ],
      questions:[
        { id:'I1', text:"Quebec's Winter Carnival started about 17 years ago.", correct:'F' },
        { id:'I2', text:'Bonhomme Carnaval is a man dressed as a snowman.', correct:'T' },
        { id:'I3', text:'The snow sculpture display takes place indoors.', correct:'F' },
        { id:'I4', text:'About a million tourists visit the carnival each year.', correct:'T' },
      ],
    },
    {
      letter:'J', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct word or phrase to complete each sentence.',
      questions:[
        { id:'J1', stem:'Remember _____ the new software tomorrow.', correct:'todownload',
          opts:[['download','download'],['downloading','downloading'],['todownload','to download']] },
        { id:'J2', stem:'Do you know how often _____ texts to your friends?', correct:'yousend',
          opts:[['doyousend','do you send'],['send','send'],['yousend','you send']] },
        { id:'J3', stem:'I wish I _____ get better cell-phone service here.', correct:'could',
          opts:[['will','will'],['could','could'],['can','can']] },
        { id:'J4', stem:'This file is used _____ business reports.', correct:'toprepare',
          opts:[['prepare','prepare'],['toprepare','to prepare'],['preparing','preparing']] },
        { id:'J5', stem:'_____ you receive a gift, make sure you write a thank-you note.', correct:'after',
          opts:[['before','Before'],['when','When'],['after','After']] },
      ],
    },
    {
      letter:'K', points:5, per:'1 punto c/u', type:'error-correction', needsReview:true,
      instruction:'Circle the incorrect word in each sentence. Then write the correct word or words on the blank.',
      questions:[
        { id:'K1', html:'Where <u>did</u> you born?', correct:'were' },
        { id:'K2', html:"As a teenager, I didn't like to take <u>away</u> the trash.", correct:'out' },
        { id:'K3', html:'Did you <u>used</u> to collect comic books when you were a child?', correct:'use' },
        { id:'K4', html:'July was the month <u>where</u> I visited my grandparents.', correct:'when' },
        { id:'K5', html:'Would you mind <u>open</u> the window?', correct:'opening' },
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// CONTENIDO REAL — I1_WRITTEN_L32_TEST2_A  (Units 9–16 · Prueba 2 · Lección 32)
// Interchange 2 → Intermedio I (I1 · azul). Convertido 1:1 de:
//   ic5_l2_t9to16a.pdf · ic5_l2_t9to16a_key.pdf · ic5_l2_t9to16a_script.pdf
// ──────────────────────────────────────────────────────────────────────────
const EXAM_I1_T2_A = {
  id: 'I1_WRITTEN_L32_TEST2_A',
  nivel: 'I1',
  contenido_real: true,
  oficial: true,
  titulo: 'Examen Escrito · Prueba 2',
  unidades: 'Unidades 9–16',
  leccion: 32,
  porcentaje: null,
  ponderacion_configurable: true,
  ponderacion_fuente: 'plan_academico',
  ponderacion_por_plan: { con_ina: 5, sin_ina: 15 },
  subtitulo: 'Unidades 9–16 · Lección 32',
  atribucion: 'Material de referencia interno: Interchange 2 © Cambridge University Press',
  puntos_totales: 50,
  videos: { listening_A: 'LnUHfDhr5EY', listening_B: 'k-l68iiTXDQ' },
  audioScript: {
    A: [
      ['CONNOR', 'Hi, Keiko. Have you been doing anything interesting lately?'],
      ['KEIKO', "Hmm. I've been working a lot, but that's not very interesting. Oh, I know. I saw The Format Code last weekend. That was amazing."],
      ['CONNOR', "I didn't know you liked thriller movies. What's it about?"],
      ['KEIKO', 'It\u2019s about some scientists that travel back in time to save the world from a huge disaster. One of the scientists falls in love with a disaster victim –'],
      ['CONNOR', "Oh, that's the movie that stars Chase Taylor, isn't it? And the director is the same guy who directed his last movie."],
      ['KEIKO', "Yes, I think so. It's really more of a love story than a thriller. That's probably why I liked it so much."],
    ],
    B: [
      ['AUSTIN', "Teresa, I've got a problem. Yesterday a friend asked me to give him one of my science projects. He wanted to copy it, put his name on it, and hand it in in another class. That way the teacher would think he put it together himself."],
      ['TERESA', 'What did you tell him?'],
      ['AUSTIN', "I was so surprised that I didn't know what to do. I said I'd think about it. What would you do if one of your friends wanted to use one of your projects like that?"],
      ['TERESA', "I'd tell him to forget about it."],
      ['AUSTIN', 'But you know, this is a really good friend. He has helped me a lot of times before.'],
      ['TERESA', "Well, I still wouldn't do it. If the teacher found out you gave him the project, it would be bad for you, too."],
      ['AUSTIN', "I guess you're right."],
    ],
  },
  sections: [
    {
      letter:'A', points:2, per:'1 punto c/u', type:'listening-mc', listening:'A',
      instruction:'Listen to Connor and Keiko talking. Check (✓) the correct answers.',
      questions:[
        { id:'A1', stem:'Keiko has been _____.', correct:'working', opts:[
          ['movie','making a movie'],['working','working'],['reading','reading thrillers'] ] },
        { id:'A2', stem:'Chase Taylor is _____.', correct:'actor', opts:[
          ['actor','an actor'],['scientist','a scientist'],['director','director'] ] },
      ],
    },
    {
      letter:'B', points:2, per:'1 punto c/u', type:'listening-mc', listening:'B',
      instruction:'Listen to Austin and Teresa talking. Check (✓) the correct answers.',
      questions:[
        { id:'B1', stem:"Austin's friend wanted Austin to _____.", correct:'give', opts:[
          ['puttogether','put together a science project for him'],['give','give him a science project'],['take','take the project to the teacher'] ] },
        { id:'B2', stem:'Teresa said she would _____.', correct:'refuse', opts:[
          ['think','think about it'],['givefriend','give the friend the project'],['refuse','refuse to help him'] ] },
      ],
    },
    {
      letter:'C', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct words to complete the conversation.',
      questions:[
        { id:'C1', stem:'A: This hiking trail is so beautiful. I really enjoy _____ my dogs here.', correct:'walking',
          opts:[['walk','walk'],['towalk','to walk'],['walking','walking']] },
        { id:'C2', stem:"B: So _____. Uh-oh. There's a sign.", correct:'doi',
          opts:[['ami','am I'],['doi','do I'],['cani','can I']] },
        { id:'C3', stem:'A: It _____ be new. What does it mean?', correct:'must',
          opts:[['must','must'],['should','should'],['will','will']] },
        { id:'C4', stem:'B: I think it means you _____ to walk dogs here.', correct:'arentallowed',
          opts:[['cant',"can't"],['arentallowed',"aren't allowed"],['donthave',"don't have"]] },
        { id:'C5', stem:'A: Oh, no. I guess we _____ gone to the park after all.', correct:'shouldhave',
          opts:[['wouldhave','would have'],['shouldhave','should have'],['musthave','must have']] },
      ],
    },
    {
      letter:'D', points:6, per:'1 punto c/u', type:'matching',
      instruction:'Match the clauses to make logical sentences.',
      left:[
        { n:1, text:'If I moved to the suburbs, _____' },
        { n:2, text:'If I get a high-paying job, _____' },
        { n:3, text:'If I pass the exam, _____' },
        { n:4, text:'If I found a million dollars, _____' },
        { n:5, text:'If my boyfriend wanted to break up with me, _____' },
        { n:6, text:'If I get a headache, _____' },
      ],
      right:[
        { l:'a', text:"I'd feel sad." },
        { l:'b', text:"I'll take some aspirin." },
        { l:'c', text:"I'd go straight to the police." },
        { l:'d', text:"I'll save more money." },
        { l:'e', text:"I'd have to learn how to drive." },
        { l:'f', text:"I won't have to go to summer school." },
      ],
      answers:{ 1:'e', 2:'d', 3:'f', 4:'c', 5:'a', 6:'b' },
    },
    {
      letter:'E', points:7, per:'1 punto c/u', type:'mc-inline',
      instruction:'Read each conversation. Check (✓) the correct response.',
      questions:[
        { id:'E1', stem:'A: What have you been doing recently?', correct:'job',
          opts:[['thanks','Great, thanks. And you?'],['job',"I've been looking for a job."],['icecream',"I've eaten ice cream."]] },
        { id:'E2', stem:"A: I can't stand hot weather.", correct:'dontmind',
          opts:[['neither','Neither am I.'],['soiam','Well, so I am.'],['dontmind',"Really? I don't mind."]] },
        { id:'E3', stem:"A: What would you do if you broke your friend's cell phone?", correct:'dunno',
          opts:[['givenaway','I would have given it away.'],['dunno',"I don't know. What would you do?"],['buy',"I'll probably buy another cell phone."]] },
        { id:'E4', stem:'A: What do you think that gesture means?', correct:'goodbye',
          opts:[['goodbye','It could mean "good-bye."'],['probably','Yes, it probably does.'],['thatswhat',"Oh, that's what it means!"]] },
        { id:'E5', stem:'A: What kinds of hobbies did you have as a child?', correct:'video',
          opts:[['reading',"I've been reading a lot recently."],['video','I used to play video games.'],['comic','I might collect comic books.']] },
        { id:'E6', stem:'A: What were you doing when I called last night?', correct:'shower',
          opts:[['watched','I watched some TV.'],['shower','I was taking a shower.'],['reading',"I'm reading a book."]] },
        { id:'E7', stem:'A: I told my boss a lie today.', correct:'wouldnt',
          opts:[['lesson','Well, you learned a lesson.'],['wouldnt',"I wouldn't have done that."],['thanks',"Thanks. I think I'll do that."]] },
      ],
    },
    {
      letter:'F', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct word or phrase to complete each sentence.',
      questions:[
        { id:'F1', stem:"I forgot my wallet. Could I _____ $10? I'll pay you back tomorrow.", correct:'borrow',
          opts:[['lend','lend'],['borrow','borrow'],['spend','spend']] },
        { id:'F2', stem:'We want to know what happened. Please _____ us the truth.', correct:'tell',
          opts:[['offer','offer'],['tell','tell'],['make','make']] },
        { id:'F3', stem:"If Emily says she'll do something, she usually does. She's a very _____ person.", correct:'reliable',
          opts:[['strict','strict'],['reliable','reliable'],['moody','moody']] },
        { id:'F4', stem:'I thought I had lost my ATM card when, _____, I found it in my pocket.', correct:'luckily',
          opts:[['luckily','luckily'],['unfortunately','unfortunately'],['sadly','sadly']] },
        { id:'F5', stem:'Jennifer did an _____ job on her report. That\u2019s why she got a raise.', correct:'outstanding',
          opts:[['outstanding','outstanding'],['absurd','absurd'],['odd','odd']] },
      ],
    },
    {
      letter:'G', points:6, per:'1 punto c/u', type:'para-verb', needsReview:true,
      instruction:'Complete this passage with the correct form of the verbs in parentheses.',
      blanks:[
        { id:'G1', hint:'have',     correct:['had'] },
        { id:'G2', hint:'drive',    correct:['driving'] },
        { id:'G3', hint:'hear',     correct:['heard'] },
        { id:'G4', hint:'work',     correct:["'ve been working",'have been working'] },
        { id:'G5', hint:'think',    correct:["'m thinking",'am thinking'] },
        { id:'G6', hint:'not need', correct:["won't need",'will not need'] },
      ],
      template:[
        'I wish I could find the perfect job. Two years ago, I ', {b:'G1'},
        ' a job at a hospital in another city. The job was great, but I hated ', {b:'G2'},
        ' there. While I was working at the hospital, I ', {b:'G3'},
        ' about this job near my home. I ', {b:'G4'},
        ' here for several months already, but now I ', {b:'G5'},
        " about changing jobs again because the salary isn't great. If I find a better-paying job near my home, I ", {b:'G6'},
        ' to look for another job for a long time!'
      ],
    },
    {
      letter:'H', points:5, per:'1 punto c/u', type:'reading-tf',
      instruction:'Read about Angkor Wat. Then circle T (true) or F (false).',
      passageTitle:'Angkor Wat',
      passage:[
        'Angkor Wat is a famous monument in Cambodia. At one time, Angkor Wat was the capital of the Khmer Empire. The main temple at Angkor Wat was built as a burial place for Suryavarman II. He was an important Khmer king who lived in the twelfth century. Suryavarman II was responsible for introducing some aspects of Hinduism to his people. The temple at Angkor Wat has five towers — one tall central tower and four smaller towers. The five towers symbolize the five peaks on Mount Meru where, according to Hindu belief, the gods live.',
        'Angkor Wat is famous for its beautiful stone carvings. It has the longest continuous bas-relief, or carved wall, in the world. The carvings show scenes from famous Hindu legends, tell the story of King Suryavarman\u2019s life, and show how the Khmer people lived at the time the temple was built.',
        'Although the temple was begun by Hindus, it was completed by Buddhist monks who lived there in the sixteenth century. As a result, Angkor Wat became an important destination for Buddhist pilgrims.',
      ],
      questions:[
        { id:'H1', text:'Angkor Wat was a famous city in Cambodia.', correct:'F' },
        { id:'H2', text:'Suryavarman II was a Hindu.', correct:'T' },
        { id:'H3', text:'There are five towers on Mount Meru.', correct:'F' },
        { id:'H4', text:'Angkor Wat was completed in the sixteenth century.', correct:'T' },
        { id:'H5', text:'Hindu monks lived in Angkor Wat after the Buddhists.', correct:'F' },
      ],
    },
    {
      letter:'I', points:7, per:'1 punto c/u', type:'error-correction', needsReview:true,
      instruction:'Circle the incorrect word in each sentence. Then write the correct word or words on the blank.',
      questions:[
        { id:'I1', html:'A few years ago, there <u>are</u> a lot of stores in our neighborhood.', correct:'were' },
        { id:'I2', html:'While I was texting my sister, my cell phone <u>dies</u>.', correct:'died' },
        { id:'I3', html:"I wouldn't want to live in this neighborhood <u>so</u> it's too noisy.", correct:'because' },
        { id:'I4', html:'Children have been <u>play</u> soccer on this field for years.', correct:'playing' },
        { id:'I5', html:'Los Angeles is the city <u>who</u> is next to the Pacific Ocean.', correct:'which', accepted:['which','that'] },
        { id:'I6', html:'Katherine finds mystery novels very <u>interested</u>.', correct:'interesting' },
        { id:'I7', html:'Gabe asked me <u>meeting</u> him at his new apartment.', correct:'to meet' },
      ],
    },
    {
      letter:'J', points:5, per:'1 punto c/u', type:'transform', needsReview:true,
      instruction:'Change these sentences into passive sentences. Do not use the words in parentheses in the passive sentences.',
      example:{ prompt:'(They) grow bananas in Central America.', answer:'Bananas are grown in Central America.' },
      questions:[
        { id:'J1', prompt:'Edison invented the telephone.', correct:['The telephone was invented by Edison.'] },
        { id:'J2', prompt:'(People) eat sushi in Japan.', correct:['Sushi is eaten in Japan.'] },
        { id:'J3', prompt:'William Shakespeare wrote Romeo and Juliet.', correct:['Romeo and Juliet was written by William Shakespeare.'] },
        { id:'J4', prompt:'A fire destroyed the hospital.', correct:['The hospital was destroyed by a fire.'] },
        { id:'J5', prompt:'(Someone) writes these stories for a newspaper.', correct:['These stories are written for a newspaper.'] },
      ],
    },
  ],
};




// ──────────────────────────────────────────────────────────────────────────
// CONTENIDO REAL — I1_WRITTEN_L32_TEST2_B  (Units 9–16 · Prueba 2 · Lección 32 · Opción B)
// Interchange 2 = Intermedio I / I1 / azul. Convertido desde PDF/key/script oficial.
// Claves separadas del estudiante; revisión docente antes de cierre.
// ──────────────────────────────────────────────────────────────────────────
const EXAM_I1_T2_B = {
  id: 'I1_WRITTEN_L32_TEST2_B',
  nivel: 'I1',
  contenido_real: true,
  oficial: true,
  titulo: 'Examen Escrito · Prueba 2',
  unidades: 'Unidades 9–16',
  leccion: 32,
  porcentaje: null,
  ponderacion_configurable: true,
  ponderacion_fuente: 'plan_academico',
  ponderacion_por_plan: { con_ina: 5, sin_ina: 15 },
  subtitulo: 'Unidades 9–16 · Lección 32',
  atribucion: 'Material de referencia interno: Interchange 2 © Cambridge University Press',
  puntos_totales: 50,
  videos: { listening_A: 'k-l68iiTXDQ', listening_B: 'k-l68iiTXDQ' },
  audioScript: {
    A: [
      ['VICTORIA', 'Hi, Jake. What have you been doing lately?'],
      ['JAKE', 'Oh, studying, mostly. But I’ve been doing some reading, too. For example, I just finished a novel by Dorian Morgan.'],
      ['VICTORIA', 'I didn’t know you liked mysteries. What was it about?'],
      ['JAKE', 'Well, it’s about a woman who wants to get rid of her husband, but of course she doesn’t want anyone to catch her. So she tells the police that he had an accident –'],
      ['VICTORIA', 'Isn’t that the book that they made into a movie recently? The one that stars Lydia White as the wife?'],
      ['JAKE', 'Yes, I think so. I haven’t seen the movie, but it’s a really exciting story. I enjoyed reading it a lot.'],
    ],
    B: [
      ['TARA', 'Jack, I need some advice. I’ve got this new boyfriend who is always late. As you know, I’m never late, and I don’t like it when other people are. When I told him that, he got angry. He said that I shouldn’t try to control other people and that he wasn’t going to change his behavior.'],
      ['JACK', 'What did you say then?'],
      ['TARA', 'Well, nothing, really. I didn’t know what to say. So what would you do if someone told you something like that?'],
      ['JACK', 'I’d probably not go out with that person anymore.'],
      ['TARA', 'Really?'],
      ['JACK', 'I wouldn’t want to be with someone who gets angry like that.'],
      ['TARA', 'You’re probably right.'],
    ],
  },
  sections: [
    {
      letter:'A', points:2, per:'1 punto c/u', type:'listening-mc', listening:'A',
      instruction:'Listen to Victoria and Jake talking. Check (✓) the correct answers.',
      questions:[
        { id:'A1', stem:'Jake has not been _____.', correct:'writing', opts:[
          ['studying','studying much'],['reading','reading a mystery'],['writing','writing a novel'] ] },
        { id:'A2', stem:'Lydia White is the name of _____.', correct:'actress', opts:[
          ['wife','Jake’s wife'],['writer','a mystery writer'],['actress','a movie actress'] ] },
      ],
    },
    {
      letter:'B', points:2, per:'1 punto c/u', type:'listening-mc', listening:'B',
      instruction:'Listen to Tara and Jack talking. Check (✓) the correct answers.',
      questions:[
        { id:'B1', stem:'Tara’s boyfriend told her that he _____.', correct:'wouldntchange', opts:[
          ['late','didn’t like to be on time'],['wouldntchange','wouldn’t change for her'],['control','couldn’t control her'] ] },
        { id:'B2', stem:'Jack thinks she should _____.', correct:'notgoout', opts:[
          ['ask','ask him to be on time'],['notgoout','not go out with him anymore'],['getangry','get angry'] ] },
      ],
    },
    {
      letter:'C', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct words to complete the conversation.',
      questions:[
        { id:'C1', stem:'A: This river is great. I really enjoy _____ here.', correct:'fishing', opts:[['fishing','fishing'],['fish','fish'],['tofish','to fish']] },
        { id:'C2', stem:'B: So _____. Uh-oh. Do you see that sign?', correct:'doi', opts:[['doi','do I'],['ami','am I'],['cani','can I']] },
        { id:'C3', stem:'A: Hmm. It _____ be new. What does it mean?', correct:'must', opts:[['will','will'],['must','must'],['can','can']] },
        { id:'C4', stem:'B: I think it means we _____ fish here.', correct:'cant', opts:[['cant','can’t'],['arentallowed','aren’t allowed'],['donthaveto','don’t have to']] },
        { id:'C5', stem:'A: Oh, no. I guess we _____ gone to the lake instead.', correct:'shouldhave', opts:[['musthave','must have'],['wouldhave','would have'],['shouldhave','should have']] },
      ],
    },
    {
      letter:'D', points:6, per:'1 punto c/u', type:'matching',
      instruction:'Match the clauses to make logical sentences.',
      left:[
        { n:1, text:'If you joined a gym, _____' },
        { n:2, text:'If you don’t get enough sleep, _____' },
        { n:3, text:'If you get home late tonight, _____' },
        { n:4, text:'If you paid more attention in class, _____' },
        { n:5, text:'If you took the bus, _____' },
        { n:6, text:'If you work hard, _____' },
      ],
      right:[
        { l:'a', text:'we’ll go to the mall tomorrow.' },
        { l:'b', text:'you’ll be successful.' },
        { l:'c', text:'you wouldn’t have to find a parking space.' },
        { l:'d', text:'you’d feel healthier.' },
        { l:'e', text:'you might get sick.' },
        { l:'f', text:'you’d get better grades.' },
      ],
      answers:{ 1:'d', 2:'e', 3:'a', 4:'f', 5:'c', 6:'b' },
    },
    {
      letter:'E', points:7, per:'1 punto c/u', type:'mc-inline',
      instruction:'Read each conversation. Check (✓) the correct response.',
      questions:[
        { id:'E1', stem:'A: Have you been watching the news lately?', correct:'watching', opts:[['watching','Yes, I have. I’ve been watching it every night.'],['great','Gee, that’s great.'],['usedto','Yes, I used to.']] },
        { id:'E2', stem:'A: I’m interested in collecting old comic books.', correct:'not', opts:[['neither','Neither am I.'],['not','Oh, I’m not.'],['dont','Well, I don’t.']] },
        { id:'E3', stem:'A: What would you do if you had an argument with a friend?', correct:'apologize', opts:[['looked','I’ve looked for a new friend.'],['apologize','I’d apologize.'],['called','I would have called.']] },
        { id:'E4', stem:'A: What does that gesture mean?', correct:'no', opts:[['no','It probably means “no.”'],['means','Oh, that’s what it means.'],['agree','Yes, I agree with you.']] },
        { id:'E5', stem:'A: What was this city like before?', correct:'pollution', opts:[['pollution','It used to have a lot of pollution.'],['buses','There are fewer buses.'],['noisier','It might be noisier.']] },
        { id:'E6', stem:'A: What were you doing when you got your lucky break?', correct:'acting', opts:[['model','I’ve gotten a job as a model.'],['restaurant','I’m working in a restaurant.'],['acting','I was taking acting lessons.']] },
        { id:'E7', stem:'A: Yesterday I ignored a phone call from my parents.', correct:'answered', opts:[['would','No, I don’t think I would.'],['answered','You should have answered.'],['call','Why did you call them?']] },
      ],
    },
    {
      letter:'F', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct word or phrase to complete each sentence.',
      questions:[
        { id:'F1', stem:'I know you’re lying. Please don’t _____ it.', correct:'deny', opts:[['refuse','refuse'],['disagree','disagree'],['deny','deny']] },
        { id:'F2', stem:'I was upset about the condition of my apartment, so I _____ a complaint to my landlord.', correct:'made', opts:[['gave','gave'],['made','made'],['told','told']] },
        { id:'F3', stem:'Scott always knows how to deal with difficult situations. He seems to be a very _____ person.', correct:'levelheaded', opts:[['levelheaded','level-headed'],['impatient','impatient'],['shorttempered','short-tempered']] },
        { id:'F4', stem:'I was on my way home from work when, _____ , I remembered that I forgot to turn off my computer.', correct:'suddenly', opts:[['suddenly','suddenly'],['sadly','sadly'],['unfortunately','unfortunately']] },
        { id:'F5', stem:'I can’t believe I locked myself out of my house. I feel so _____.', correct:'dumb', opts:[['marvelous','marvelous'],['disgusting','disgusting'],['dumb','dumb']] },
      ],
    },
    {
      letter:'G', points:6, per:'1 punto c/u', type:'para-verb', needsReview:true,
      instruction:'Complete this passage with the correct form of the verbs in parentheses.',
      blanks:[
        { id:'G1', hint:'rent', correct:['rented','was renting'] },
        { id:'G2', hint:'be', correct:'being' },
        { id:'G3', hint:'stay', correct:'was staying' },
        { id:'G4', hint:'live', correct:["'ve been living",'have been living'] },
        { id:'G5', hint:'think', correct:["'m thinking",'am thinking'] },
        { id:'G6', hint:'find', correct:'find' },
      ],
      template:['I wish I could find the perfect place to live. Several years ago, I ', {b:'G1'}, ' a house in the suburbs. The house was great, but I couldn’t stand ', {b:'G2'}, ' so far away from everything, including my job. Then while I ', {b:'G3'}, ' in that house, I heard about this apartment downtown. I ', {b:'G4'}, ' here for only a few months, but now I ', {b:'G5'}, ' about moving again because this apartment building is too noisy. If I ', {b:'G6'}, ' a quieter apartment near my job, I won’t move again for a long time!'],
    },
    {
      letter:'H', points:5, per:'1 punto c/u', type:'transform', needsReview:true,
      instruction:'Change these sentences into passive sentences. Do not use the words in parentheses in the passive sentences.',
      example:{ prompt:'(They) use the peso in Mexico.', answer:'The peso is used in Mexico.' },
      questions:[
        { id:'H1', prompt:'John Williams composed the music for Star Wars.', correct:['The music for Star Wars was composed by John Williams.'] },
        { id:'H2', prompt:'(We) serve Chinese food in this restaurant.', correct:['Chinese food is served in this restaurant.'] },
        { id:'H3', prompt:'Many music fans attended Lady Gaga concerts last year.', correct:['Lady Gaga concerts were attended by many music fans last year.'] },
        { id:'H4', prompt:'Sonia used a lot of computer paper.', correct:['A lot of computer paper was used by Sonia.'] },
        { id:'H5', prompt:'Do (people) grow rice in Korea?', correct:['Is rice grown in Korea?'] },
      ],
    },
    {
      letter:'I', points:5, per:'1 punto c/u', type:'reading-tf',
      instruction:'Read about the Taj Mahal. Then circle T (true) or F (false).',
      passageTitle:'The Taj Mahal',
      passage:[
        'The Taj Mahal is a famous landmark in Agra, in northern India. It was built by Shah Jahan, the fifth Mughal emperor of India, as the burial place for his wife, Mumtaz Mahal. Mumtaz Mahal died in 1631. Construction at the Taj Mahal started a year later, and it took 20,000 laborers over twenty years to complete the buildings and gardens.',
        'The main building at the Taj Mahal is the tomb where Mumtaz Mahal and Shah Jahan are buried. It is a square building constructed of white marble. There is a large dome on top of the building, which is surrounded by four minarets, or towers. Around the tomb is a large enclosed garden. The garden is divided into four parts and contains a long, rectangular reflecting pool. The design of the garden is a Muslim symbol for paradise, a place where everything is perfect.',
        'The Taj Mahal is considered one of the most beautiful monuments in the world. The tomb itself has a simple but beautiful shape, and the gardens create an ideal place from which to view it.',
      ],
      questions:[
        { id:'I1', text:'Shah Jahan built the Taj Mahal as a monument to his wife.', correct:'T' },
        { id:'I2', text:'Construction of the Taj Mahal started in 1632.', correct:'T' },
        { id:'I3', text:'The Taj Mahal was built by 20 laborers.', correct:'F' },
        { id:'I4', text:'A minaret is another name for a dome.', correct:'F' },
        { id:'I5', text:'The design of the garden is a Muslim symbol for beauty.', correct:'F' },
      ],
    },
    {
      letter:'J', points:7, per:'1 punto c/u', type:'error-correction', needsReview:true,
      instruction:'Circle the incorrect word in each sentence. Then write the correct word or words on the blank.',
      questions:[
        { id:'J1', html:'In a few years, the population of older people <u>are</u> get much larger.', correct:'will' },
        { id:'J2', html:'Arlene was walking down the street when someone <u>asks</u> her for directions.', correct:'asked' },
        { id:'J3', html:'Stacy doesn’t want to have children now <u>so</u> she’s still too young.', correct:'because' },
        { id:'J4', html:'Erica has been <u>ride</u> her bike to work recently.', correct:'riding' },
        { id:'J5', html:'My friend has a car <u>who</u> runs on alternative fuel.', correct:'which', accepted:['which','that'] },
        { id:'J6', html:'That was the most <u>disgusted</u> food I’ve ever eaten.', correct:'disgusting' },
        { id:'J7', html:'Mike asked me <u>taking</u> his elderly mother to the doctor.', correct:'to take' },
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// CONTENIDO REAL — I1_WRITTEN_L18_TEST1_B  (Units 1–8 · Prueba 1 · Lección 18 · Opción B)
// Interchange 2 = Intermedio I / I1 / azul. Convertido desde PDF/key/script oficial.
// Claves separadas del estudiante; revisión docente antes de cierre.
// ──────────────────────────────────────────────────────────────────────────
const EXAM_I1_T1_B = {
  id: 'I1_WRITTEN_L18_TEST1_B',
  nivel: 'I1',
  contenido_real: true,
  oficial: true,
  titulo: 'Examen Escrito · Prueba 1',
  unidades: 'Unidades 1–8',
  leccion: 18,
  porcentaje: null,
  ponderacion_configurable: true,
  ponderacion_fuente: 'plan_academico',
  ponderacion_por_plan: { con_ina: 5, sin_ina: 15 },
  subtitulo: 'Unidades 1–8 · Lección 18',
  atribucion: 'Material de referencia interno: Interchange 2 © Cambridge University Press',
  puntos_totales: 50,
  videos: { listening_A: 'Pi19RYAKGig', listening_B: 'Pi19RYAKGig' },
  audioScript: {
    A: [
      ['TOM', 'Is anything wrong, Samantha? You look really tired.'],
      ['SAMANTHA', 'I am tired, Tom. I’m not getting enough sleep.'],
      ['TOM', 'Oh, really? Why is that?'],
      ['SAMANTHA', 'It’s my neighbors. Their dogs bark all night long. I just wish they made them be quiet for a change!'],
      ['TOM', 'Maybe you’d better talk to them about it.'],
      ['SAMANTHA', 'I have talked to them, but they don’t pay any attention. I think maybe I’ll start looking for another apartment.'],
    ],
    B: [
      ['SADIE', 'Hi, Ian. Are you going to Grace’s surprise birthday party?'],
      ['IAN', 'Yes. Do you know who’s making the food? Maybe I can bring something, too.'],
      ['SADIE', 'No, that’s OK. We’re taking care of all that. But maybe you can tell me where I can get some good tacos. Grace loves Mexican food.'],
      ['IAN', 'You know, why don’t you make them yourself? I make them all the time. It’s really easy. First, cook some hamburger meat. Then cut up onions, tomatoes, and cheese. Next, fill the taco shell with the hamburger meat. After that, add the onions, tomatoes, and cheese. Then pour salsa over the tacos.'],
    ],
  },
  sections: [
    {
      letter:'A', points:2, per:'1 punto c/u', type:'listening-mc', listening:'A',
      instruction:'Listen to Tom and Samantha talking. Check (✓) the correct answers.',
      questions:[
        { id:'A1', stem:'Samantha wishes her neighbors’ dogs _____.', correct:'quieter', opts:[
          ['liked','liked her'],['slept','slept more'],['quieter','were quieter'] ] },
        { id:'A2', stem:'Tom thinks she should _____.', correct:'talk', opts:[
          ['change','change her apartment'],['noise','make more noise'],['talk','talk to them'] ] },
      ],
    },
    {
      letter:'B', points:2, per:'1 punto c/u', type:'listening-mc', listening:'B',
      instruction:'Listen to Sadie and Ian talking. Check (✓) the correct answers.',
      questions:[
        { id:'B1', stem:'Ian wants _____.', correct:'whofood', opts:[
          ['cake','to know how to make a birthday cake'],['sadie','Sadie to bring tacos to the party'],['whofood','to know who’s making the food'] ] },
        { id:'B2', stem:'Ian tells Sadie she first needs to _____.', correct:'cook', opts:[
          ['cook','cook the hamburger meat'],['salsa','put salsa over the tacos'],['cut','cut up onions, tomatoes, and cheese'] ] },
      ],
    },
    {
      letter:'C', points:6, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct word or phrase to complete each sentence.',
      questions:[
        { id:'C1', stem:'I couldn’t find a parking _____ on this street, so I had to park around the corner.', correct:'space', opts:[['space','space'],['station','station'],['jam','jam']] },
        { id:'C2', stem:'I left some clean clothes on your bed. Please _____.', correct:'putaway', opts:[['putdown','put them down'],['putaway','put them away'],['takeout','take them out']] },
        { id:'C3', stem:'Even though my neighborhood is old and _____, I still love it.', correct:'rundown', opts:[['rundown','run-down'],['convenient','convenient'],['modern','modern']] },
        { id:'C4', stem:'Do think it will be warm enough to wear _____ in California?', correct:'sandals', opts:[['cash','cash'],['boots','hiking boots'],['sandals','sandals']] },
        { id:'C5', stem:'I backed up the files you wanted on this flash _____.', correct:'drive', opts:[['slideshow','slideshow'],['drive','drive'],['file','file']] },
        { id:'C6', stem:'John forgot to _____ his jacket again.', correct:'hangup', opts:[['cleanup','clean up'],['throwout','throw out'],['hangup','hang up']] },
      ],
    },
    {
      letter:'D', points:5, per:'1 punto c/u', type:'para-verb', needsReview:true,
      instruction:'Complete this conversation with the simple past or the present perfect of the verbs in parentheses.',
      blanks:[
        { id:'D1', hint:'own', correct:['Have you ever owned'] },
        { id:'D2', hint:'have', correct:['had'] },
        { id:'D3', hint:'have', correct:["'ve never had",'have never had'] },
        { id:'D4', hint:'keep', correct:['keep'] },
        { id:'D5', hint:'give', correct:['gave'] },
      ],
      template:[
        'A: ', {b:'D1'}, ' a pet?  B: Yes. In fact, I ', {b:'D2'},
        ' a dog when I was a teenager.  A: You’re lucky! I ', {b:'D3'},
        ' a pet. What happened? Did you ', {b:'D4'},
        ' it after you moved out of your parents’ house?  B: No. I ', {b:'D5'}, ' it to my brother.'
      ],
    },
    {
      letter:'E', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Read each conversation. Check (✓) the correct response.',
      questions:[
        { id:'E1', stem:'A: Would you mind driving me to the mall?', correct:'sorry', opts:[['sure','Sure. I have some.'],['sorry','Sorry. I can’t today.'],['thanks','Thanks. I appreciate it.']] },
        { id:'E2', stem:'A: What are you going to do on vacation?', correct:'trip', opts:[['badidea','That doesn’t sound like a good idea.'],['howlong','You will? For how long?'],['trip','I guess I’ll take a trip.']] },
        { id:'E3', stem:'A: You should bring your ATM card.', correct:'right', opts:[['right','You’re right. I should.'],['did','Thanks. I already did.'],['wont','Don’t worry. I won’t.']] },
        { id:'E4', stem:'A: Do you know what time it is?', correct:'noon', opts:[['thanks','Oh. Thanks a lot.'],['noon','It’s noon.'],['atnoon','At noon.']] },
        { id:'E5', stem:'A: I wish I had a better job.', correct:'looking', opts:[['glad','That’s great. I’m glad you like it.'],['start','Oh, really? When do you start?'],['looking','Are you looking for another one?']] },
      ],
    },
    {
      letter:'F', points:5, per:'1 punto c/u', type:'para-fill',
      instruction:'Complete the paragraph with words from the box. One word will not be used.',
      box:['as','fewer','more','enough','less','too'],
      blanks:[
        { id:'F1', hint:'recuadro', correct:'too' },
        { id:'F2', hint:'recuadro', correct:'enough' },
        { id:'F3', hint:'recuadro', correct:'as' },
        { id:'F4', hint:'recuadro', correct:'fewer' },
        { id:'F5', hint:'recuadro', correct:'less' },
      ],
      template:[
        'There are a lot of things I don’t like about my new apartment. For one thing, it’s ', {b:'F1'},
        ' dark because there aren’t ', {b:'F2'},
        ' windows. Also, it isn’t as large ', {b:'F3'},
        ' my old apartment, and there are ', {b:'F4'},
        ' bedrooms. My last apartment had three bedrooms, and this one has only two. On the other hand, it costs a lot ', {b:'F5'},
        ' money. I used to pay $1,200 a month, and now I pay only $900.'
      ],
    },
    {
      letter:'G', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct words to complete the conversation.',
      questions:[
        { id:'G1', stem:'A: That was a delicious dinner, but what a mess! _____ better clean up.', correct:'wed', opts:[['well','We’ll'],['wed','We’d'],['weve','We’ve']] },
        { id:'G2', stem:'B: OK. Where _____ we start?', correct:'should', opts:[['should','should'],['would','would'],['need','need']] },
        { id:'G3', stem:'A: _____ you get a plate from the kitchen for the leftover chicken?', correct:'could', opts:[['could','Could'],['should','Should'],['must','Must']] },
        { id:'G4', stem:'B: Sure. You know, we don’t _____ to do all the dishes tonight.', correct:'have', opts:[['must','must'],['have','have'],['should','should']] },
        { id:'G5', stem:'A: You’re right. We can do them tomorrow. Well, _____ you mind turning off the lights? It’s time for bed!', correct:'would', opts:[['can','can'],['could','could'],['would','would']] },
      ],
    },
    {
      letter:'H', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct word or phrase to complete each sentence.',
      questions:[
        { id:'H1', stem:'Be sure _____ the car at the end of the street.', correct:'topark', opts:[['park','park'],['topark','to park'],['parking','parking']] },
        { id:'H2', stem:'Can you tell me what _____ ?', correct:'temperatureis', opts:[['ittemp','the temperature it is'],['temperature','the temperature'],['temperatureis','the temperature is']] },
        { id:'H3', stem:'I wish I _____ in a nicer neighborhood.', correct:'lived', opts:[['lived','lived'],['willlive','will live'],['live','live']] },
        { id:'H4', stem:'GPS technology is used for _____ directions in your car.', correct:'getting', opts:[['get','get'],['getting','getting'],['toget','to get']] },
        { id:'H5', stem:'_____ friends visit our apartment, we usually offer them tea or coffee.', correct:'when', opts:[['when','When'],['first','First'],['next','Next']] },
      ],
    },
    {
      letter:'I', points:5, per:'1 punto c/u', type:'error-correction', needsReview:true,
      instruction:'Circle the incorrect word in each sentence. Then write the correct word or words on the blank.',
      questions:[
        { id:'I1', html:'<u>Did</u> you born in China?', correct:'Were' },
        { id:'I2', html:'Please let the dog <u>down</u> through the back door.', correct:'out' },
        { id:'I3', html:'I <u>use</u> to drive to work, but now I take the bus.', correct:'used' },
        { id:'I4', html:'August and September are the months <u>where</u> kids usually go back to school.', correct:'when' },
        { id:'I5', html:'Would you mind <u>clean</u> up the table?', correct:'cleaning' },
      ],
    },
    {
      letter:'J', points:6, per:'1 punto c/u', type:'matching',
      instruction:'Match the answers with the questions.',
      left:[
        { n:1, text:'What are you going to have for lunch? _____' },
        { n:2, text:'How did you like your steak? _____' },
        { n:3, text:'Have you finished your meal? _____' },
        { n:4, text:'Could you please pass me the bread? _____' },
        { n:5, text:'Can you tell me where I can get some breakfast? _____' },
        { n:6, text:'When are you going to have dinner? _____' },
      ],
      right:[
        { l:'a', text:'Yes, I have, thank you.' },
        { l:'b', text:'Around six.' },
        { l:'c', text:'Of course. Here you are.' },
        { l:'d', text:'I think I’ll get some pizza.' },
        { l:'e', text:'It was delicious.' },
        { l:'f', text:'Sure. There is a coffee shop around the corner.' },
      ],
      answers:{ 1:'d', 2:'e', 3:'a', 4:'c', 5:'f', 6:'b' },
    },
    {
      letter:'K', points:4, per:'1 punto c/u', type:'reading-tf',
      instruction:'Read about Mardi Gras. Then circle T (true) or F (false).',
      passageTitle:'Mardi Gras in New Orleans',
      passage:[
        'Mardi Gras is a popular holiday in New Orleans, Louisiana. “Mardi Gras” is the name for a special day in the early part of the year, but the celebration of Mardi Gras lasts for weeks.',
        'People in New Orleans started to celebrate Mardi Gras in the 1700s. People went to dances or balls where they wore masks and special costumes, and they gathered together in the streets. In the 1800s, Mardi Gras became so popular that the government tried to limit the Mardi Gras season. But people continued to celebrate no matter what the government did.',
        'Like parties and balls, parades are an important part of Mardi Gras. There are over 60 Mardi Gras parades every year. People ride in the parades and throw things to the crowds in the streets. For example, they throw necklaces, false money, and clothes. The people in the crowds try to catch as many things as they can. Mardi Gras is a very exciting time.',
      ],
      questions:[
        { id:'K1', text:'People celebrate Mardi Gras for only one day.', correct:'F' },
        { id:'K2', text:'Mardi Gras in New Orleans began in the 1800s.', correct:'F' },
        { id:'K3', text:'In the 1800s, Mardi Gras was very popular.', correct:'T' },
        { id:'K4', text:'People throw things during the parades.', correct:'T' },
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// CONTENIDO REAL — B2_WRITTEN_L18_TEST1_A  (Units 1–8 · Prueba 1 · Lección 18)
// Interchange 1 = Básico II / B2 / rojo. Convertido desde PDF/key/script
// oficial. Claves separadas del estudiante; revisión docente antes de cierre.
// ──────────────────────────────────────────────────────────────────────────
const EXAM_B2_T1_A = {
  id: 'B2_WRITTEN_L18_TEST1_A',
  nivel: 'B2',
  contenido_real: true,
  oficial: true,
  titulo: 'Examen Escrito · Prueba 1',
  unidades: 'Unidades 1–8',
  leccion: 18,
  porcentaje: null,
  ponderacion_configurable: true,
  ponderacion_fuente: 'plan_academico',
  ponderacion_por_plan: { con_ina: 5, sin_ina: 15 },
  subtitulo: 'Unidades 1–8 · Lección 18',
  atribucion: 'Material de referencia interno: Interchange 1 © Cambridge University Press',
  puntos_totales: 50,
  videos: { listening_A: 'gRMSX0ckpmY', listening_B: 'wFnfn3holPM' },
  audioScript: {
    A: [
      ['ANGELA', 'Hi! I’m Angela. Do you come here often?'],
      ['JOHN', 'Yes, I do. I like to lift weights at least three days a week.'],
      ['ANGELA', 'Oh, really? Do you do any other kind of exercise?'],
      ['JOHN', 'Well, I go jogging a couple of mornings a week in a park near my house. What about you?'],
      ['ANGELA', 'Well, you know, I don’t really like jogging very much, but I need to do something. So I just come here to lift weights once or twice a week.'],
    ],
    B: [
      ['NORA', 'Ben, how are you? How was your vacation in Mexico?'],
      ['BEN', 'It was great. We had a wonderful time.'],
      ['NORA', 'Did you go to Mexico City and Acapulco?'],
      ['BEN', 'No, we didn’t. Everybody goes there, and we wanted to avoid the crowds. First, we spent a few days in Oaxaca. Then we flew to Puerto Escondido and spent some time on the beach.'],
      ['NORA', 'Did you enjoy that?'],
      ['BEN', 'Yes, I did. I got a little too much sun, but I enjoyed surfing and relaxing on the beach!'],
    ],
  },
  sections: [
    {
      letter:'A', points:2, per:'1 punto c/u', type:'listening-mc', listening:'A',
      instruction:'Listen to Angela and John talking. Check (✓) the correct answers.',
      questions:[
        { id:'A1', stem:'Angela and John are _____.', correct:'gym', opts:[
          ['gym','in a gym'],['park','in a park'],['johnhouse','at John’s house'] ] },
        { id:'A2', stem:'Angela doesn’t _____.', correct:'jogging', opts:[
          ['exercise','exercise'],['weights','lift weights'],['jogging','go jogging'] ] },
      ],
    },
    {
      letter:'B', points:2, per:'1 punto c/u', type:'listening-mc', listening:'B',
      instruction:'Listen to Nora and Ben talking. Check (✓) the correct answers.',
      questions:[
        { id:'B1', stem:'Ben didn’t go to _____.', correct:'acapulco', opts:[
          ['acapulco','Acapulco'],['oaxaca','Oaxaca'],['puerto','Puerto Escondido'] ] },
        { id:'B2', stem:'Ben enjoyed the trip because he _____.', correct:'surfing', opts:[
          ['sun','got a lot of sun'],['tourists','met a lot of tourists'],['surfing','went surfing'] ] },
      ],
    },
    {
      letter:'C', points:4, per:'1 punto c/u', type:'dialog-verb', needsReview:true,
      instruction:'Complete each conversation. Use the correct form of be or do.',
      questions:[
        { id:'C1', a:'Where are you from?', b:'I ____ from India.', correct:["’m", "I'm", 'am'] },
        { id:'C2', a:'What ____ you do?', b:'I’m a pilot.', correct:['do'] },
        { id:'C3', a:'____ you on vacation?', b:'Yes, I am.', correct:['Are'] },
        { id:'C4', a:'What ____ she play?', b:'She plays the guitar.', correct:['does'] },
      ],
    },
    {
      letter:'D', points:5, per:'1 punto c/u', type:'para-fill', needsReview:true,
      instruction:'Complete this story. Use the words from the box. One word will not be used.',
      box:['a little','many','nearly all','few','much','no one'],
      blanks:[
        { id:'D1', hint:'word box', correct:'many' },
        { id:'D2', hint:'word box', correct:'much' },
        { id:'D3', hint:'word box', correct:'a little' },
        { id:'D4', hint:'word box', correct:'no one' },
        { id:'D5', hint:'word box', correct:'nearly all' },
      ],
      template:[
        'I live in a nice neighborhood in a big city. There are ', {b:'D1'},
        ' nice stores and restaurants near my house. It’s busy during the day, but there isn’t ', {b:'D2'},
        ' traffic in the evening or at night. There is ', {b:'D3'},
        ' pollution, but ', {b:'D4'},
        ' thinks it’s going to be a big problem. There are many programs to help keep the city clean. I think that ', {b:'D5'},
        ' the people who live in my neighborhood like it.'
      ],
    },
    {
      letter:'E', points:4, per:'1 punto c/u', type:'reading-tf',
      instruction:'Read Brenda’s composition. Then circle T (true) or F (false).',
      passageTitle:'My Family',
      passage:[
        'There are five people in my family. I have an older brother, and he works as an engineer. He got married a little while ago and moved to Atlanta. My sister is several years younger than I am. She’s still in high school and lives at home with my parents. My mother didn’t work when I was a child, but now she’s teaching part-time.',
        'My father is a businessman. He works for a large international company and travels a lot for his job. In fact, he’s probably traveling somewhere right now. I left home a year ago to go to college, and I’m living in a different city. I go back home on vacation to visit my parents and my sister.',
        'I enjoy spending time with my family.',
      ],
      questions:[
        { id:'E1', text:'Brenda has one brother and one sister.', correct:'T' },
        { id:'E2', text:'Her brother lives in the same city as her parents.', correct:'F' },
        { id:'E3', text:'Her mother isn’t working now.', correct:'F' },
        { id:'E4', text:'Brenda is living with her family.', correct:'F' },
      ],
    },
    {
      letter:'F', points:6, per:'1 punto c/u', type:'para-verb', needsReview:true,
      instruction:'John is giving a guest a tour of his office. Complete the sentences. Use the simple present or the present continuous of the verbs given.',
      blanks:[
        { id:'F1', hint:'not have', correct:["doesn’t have", "does not have"] },
        { id:'F2', hint:'work', correct:['works'] },
        { id:'F3', hint:'design', correct:["’s designing", "is designing"] },
        { id:'F4', hint:'not come', correct:["don’t come", "do not come"] },
        { id:'F5', hint:'get', correct:["’re getting", "are getting"] },
        { id:'F6', hint:'eat', correct:['is eating'] },
      ],
      template:[
        'I’d like to introduce you to some of the people here. First, this is Ms. Cartwright, our receptionist. Hmm. She ', {b:'F1'},
        ' time to talk with us right now, so let’s come back later. . . . This is Joel. He ', {b:'F2'},
        ' here on Tuesdays and Thursdays. Right now he ', {b:'F3'},
        ' an office building for an important customer. . . . And over here are Bill and Bryan. Usually they ', {b:'F4'},
        ' to the office on Tuesdays, but today they ', {b:'F5'},
        ' ready for a meeting this afternoon. I guess everyone else ', {b:'F6'},
        ' lunch now. Come on, I’ll show you where the cafeteria is.'
      ],
    },
    {
      letter:'G', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct words to complete the sentences.',
      questions:[
        { id:'G1', stem:'Dana serves passengers on an airplane. She’s a _____.', correct:'flight', opts:[['flight','flight attendant'],['chef','chef'],['receptionist','receptionist']] },
        { id:'G2', stem:'Jonathan is my father’s brother. He’s my _____.', correct:'uncle', opts:[['grandfather','grandfather'],['cousin','cousin'],['uncle','uncle']] },
        { id:'G3', stem:'The party last night was fun. I _____ a good time.', correct:'had', opts:[['did','did'],['made','made'],['had','had']] },
        { id:'G4', stem:'Pat isn’t an actor, but he’s on a TV show. It’s a _____ about soccer.', correct:'reality', opts:[['soap','soap opera'],['science','science fiction show'],['reality','reality show']] },
        { id:'G5', stem:'Derek is very fit. He _____ every day.', correct:'weight', opts:[['weight','does weight training'],['piano','plays the piano'],['couch','sits on the couch']] },
      ],
    },
    {
      letter:'H', points:6, per:'1 punto c/u', type:'dialog-verb', needsReview:true,
      instruction:'Complete this conversation. Use the past tense of the verbs given.',
      questions:[
        { id:'H1', a:'What ____ you ____ last weekend?', b:'Nothing special.', hint:'do', correct:['did do', 'did . . . do', 'did ... do'] },
        { id:'H2', a:'What about you? ____ you on vacation?', b:'Yes, I ____.', hint:'be', correct:['Were'] },
        { id:'H3', a:'Yes, I ____.', b:'', hint:'be', correct:['was'] },
        { id:'H4', a:'I ____ to Puerto Rico with my cousins.', b:'', hint:'go', correct:['went'] },
        { id:'H5', a:'____ you ____ fun?', b:'Yes, I ____.', hint:'have', correct:['Did have', 'Did . . . have', 'Did ... have'] },
        { id:'H6', a:'Yes, I ____.', b:'I love to travel!', hint:'do', correct:['did'] },
      ],
    },
    {
      letter:'I', points:6, per:'1 punto c/u', type:'matching',
      instruction:'Match the answers with the questions.',
      left:[
        { n:1, text:'How often do you go to the movies?' },
        { n:2, text:'What’s playing at the movie theater this week?' },
        { n:3, text:'Are there any movie theaters in your neighborhood?' },
        { n:4, text:'I want to see a movie. Are you free tonight?' },
        { n:5, text:'Would you like to go to a movie on Saturday?' },
        { n:6, text:'Do you want to see the new Brad Pitt movie?' },
      ],
      right:[
        { l:'a', text:'Yes, I do. I like him a lot.' },
        { l:'b', text:'Yes, I would.' },
        { l:'c', text:'Sometimes twice a month.' },
        { l:'d', text:'No, I’m not.' },
        { l:'e', text:'A horror movie.' },
        { l:'f', text:'No, there aren’t.' },
      ],
      answers:{ 1:'c', 2:'e', 3:'f', 4:'d', 5:'b', 6:'a' },
    },
    {
      letter:'J', points:6, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct word or phrase to complete each conversation.',
      questions:[
        { id:'J1', stem:'A: I like those earrings. — B: Do you mean _____?', correct:'goldones', opts:[['thatgold','that gold'],['thosegold','those gold'],['goldones','the gold ones']] },
        { id:'J2', stem:'A: Can you go to dinner with me tomorrow? — B: No, I’m sorry. I work _____ Saturdays.', correct:'on', opts:[['in','in'],['on','on'],['at','at']] },
        { id:'J3', stem:'A: Which shirt do you prefer? — B: I prefer the blue one. It’s _____ the orange one.', correct:'nicerthan', opts:[['thenice','the nice'],['nicer','nicer'],['nicerthan','nicer than']] },
        { id:'J4', stem:'A: How _____ do you go out to dinner? — B: About once a month.', correct:'often', opts:[['long','long'],['well','well'],['often','often']] },
        { id:'J5', stem:'A: Would you like to take a walk? — B: Yes, _____.', correct:'love', opts:[['do','I do'],['like','I’d like'],['love','I’d love to']] },
        { id:'J6', stem:'A: I’m looking for a drugstore. — B: I think _____ one on Main Street.', correct:'theres', opts:[['its','it’s'],['thats','that’s'],['theres','there’s']] },
      ],
    },
    {
      letter:'K', points:4, per:'1 punto c/u', type:'arrange', needsReview:true,
      instruction:'Arrange these words to make sentences.',
      questions:[
        { id:'K1', prompt:'new / expensive / your / was / computer / very', correct:['Was your new computer very expensive?'] },
        { id:'K2', prompt:'ever / shop / hardly / I / department stores / in', correct:['I hardly ever shop in department stores.'] },
        { id:'K3', prompt:'than / jacket / warmer / my / is / one / that', correct:['My jacket is warmer than that one.'] },
        { id:'K4', prompt:'volleyball / are / how / good / you / at', correct:['How good are you at volleyball?'] },
      ],
    },
  ],
};





// ──────────────────────────────────────────────────────────────────────────
// CONTENIDO REAL — B2_WRITTEN_L18_TEST1_B  (Units 1–8 · Prueba 1 · Lección 18 · Opción B)
// Interchange 1 = Básico II / B2 / rojo. Convertido desde PDF/key/script oficial.
// Claves separadas del estudiante; revisión docente antes de cierre.
// ──────────────────────────────────────────────────────────────────────────
const EXAM_B2_T1_B = {
  id: 'B2_WRITTEN_L18_TEST1_B',
  nivel: 'B2',
  contenido_real: true,
  oficial: true,
  titulo: 'Examen Escrito · Prueba 1',
  unidades: 'Unidades 1–8',
  leccion: 18,
  porcentaje: null,
  ponderacion_configurable: true,
  ponderacion_fuente: 'plan_academico',
  ponderacion_por_plan: { con_ina: 5, sin_ina: 15 },
  subtitulo: 'Unidades 1–8 · Lección 18',
  atribucion: 'Material de referencia interno: Interchange 1 © Cambridge University Press',
  puntos_totales: 50,
  videos: { listening_A: 'wFnfn3holPM', listening_B: 'wFnfn3holPM' },
  audioScript: {
    A: [
      ['STEPHANIE', 'So, what’s your schedule like this semester, Robert?'],
      ['ROBERT', 'Well, I have classes three mornings a week. And I work at a gas station from eight until midnight.'],
      ['STEPHANIE', 'Oh, really? When do you study, then?'],
      ['ROBERT', 'I usually study in the afternoon – and, of course, on weekends. How about you, Stephanie? Do you have a good schedule?'],
      ['STEPHANIE', 'Yeah, it’s great. I only have classes two days a week. And I don’t have a job, so I have a lot of time to study.'],
    ],
    B: [
      ['JOHN', 'Hi, Andrea. How was your weekend?'],
      ['ANDREA', 'It was good. I had a great time Saturday night.'],
      ['JOHN', 'Did you go to a movie?'],
      ['ANDREA', 'No, I didn’t. I’m tired of movies. I almost always go to a movie on Saturday night. This weekend someone invited me to go dancing. We went to a couple of dance clubs and then to a restaurant for dinner.'],
      ['JOHN', 'Did you enjoy the dinner?'],
      ['ANDREA', 'Yes, I did. The food wasn’t great, but it was late and I was really hungry!'],
    ],
  },
  sections: [
    {
      letter:'A', points:2, per:'1 punto c/u', type:'listening-mc', listening:'A',
      instruction:'Listen to Stephanie and Robert talking. Check (✓) the correct answers.',
      questions:[
        { id:'A1', stem:'Robert works _____.', correct:'night', opts:[
          ['morning','in the morning'],['afternoon','in the afternoon'],['night','at night'] ] },
        { id:'A2', stem:'Stephanie doesn’t _____.', correct:'work', opts:[
          ['work','work'],['study','study'],['classes','have classes'] ] },
      ],
    },
    {
      letter:'B', points:2, per:'1 punto c/u', type:'listening-mc', listening:'B',
      instruction:'Listen to John and Andrea talking. Check (✓) the correct answers.',
      questions:[
        { id:'B1', stem:'On Saturday night, Andrea usually _____.', correct:'movie', opts:[
          ['home','stays home'],['dancing','goes dancing'],['movie','sees a movie'] ] },
        { id:'B2', stem:'Andrea enjoyed the dinner because _____.', correct:'hungry', opts:[
          ['late','she likes to eat late'],['hungry','she was hungry'],['food','the food was good'] ] },
      ],
    },
    {
      letter:'C', points:4, per:'1 punto c/u', type:'dialog-verb', needsReview:true,
      instruction:'Complete each conversation. Use the correct form of be or do.',
      questions:[
        { id:'C1', a:'What’s his name?', b:'His name ____ Paul.', correct:['is'] },
        { id:'C2', a:'What ____ you do?', b:'I’m a chef.', correct:['do'] },
        { id:'C3', a:'Are you from Brazil?', b:'No, we ____.', correct:["aren’t", "are not", "’re not"] },
        { id:'C4', a:'What kind of music ____ Vicky like?', b:'She likes reggae music.', correct:['does'] },
      ],
    },
    {
      letter:'D', points:5, per:'1 punto c/u', type:'para-fill', needsReview:true,
      instruction:'Complete this story. Use the words from the box. One word will not be used.',
      box:['a few','many','nearly all','a little','much','no one'],
      blanks:[
        { id:'D1', hint:'word box', correct:'much' },
        { id:'D2', hint:'word box', correct:'many' },
        { id:'D3', hint:'word box', correct:'nearly all' },
        { id:'D4', hint:'word box', correct:'a few' },
        { id:'D5', hint:'word box', correct:'a little' },
      ],
      template:[
        'I spent the summer at my cousin’s house in Royal Oak. It’s a great city. There isn’t ', {b:'D1'},
        ' crime, so I felt very safe. There are ', {b:'D2'},
        ' restaurants in Royal Oak, but ', {b:'D3'},
        ' of them are expensive, so we also ate home a lot. There are ', {b:'D4'},
        ' cheap ones, but they aren’t very good. There was only ', {b:'D5'},
        ' rain this summer. Most days were sunny and beautiful.'
      ],
    },
    {
      letter:'E', points:4, per:'1 punto c/u', type:'reading-tf',
      instruction:'Read Rod’s composition. Then circle T (true) or F (false).',
      passageTitle:'My Neighborhood',
      passage:[
        'My neighborhood is close to the downtown area of the city. I live in a house, but a lot of people around me live in apartments. There are a few office buildings in my neighborhood. There aren’t any shopping malls, but it’s still very convenient. There’s a good shopping area only a few streets away. There’s a bank, and there are several restaurants and a couple of movie theaters. There’s also a barber shop, so I don’t need to walk very far to get a haircut!',
        'My neighborhood is nice, but it’s changing. There’s more traffic, and it’s noisier than it was a few years ago. We still need better public transportation, and we also need more parks. I joined a community organization last year, and we’re working together to make our neighborhood a better place.',
      ],
      questions:[
        { id:'E1', text:'No one in Rod’s neighborhood lives in a house.', correct:'F' },
        { id:'E2', text:'There are some office buildings in his neighborhood.', correct:'T' },
        { id:'E3', text:'He can walk to get a haircut.', correct:'T' },
        { id:'E4', text:'He thinks public transportation is better than it was before.', correct:'F' },
      ],
    },
    {
      letter:'F', points:6, per:'1 punto c/u', type:'para-verb', needsReview:true,
      instruction:'Dan is introducing himself and his family. Complete the sentences. Use the simple present or the present continuous of the verbs given.',
      blanks:[
        { id:'F1', hint:'study', correct:["’m studying", "am studying"] },
        { id:'F2', hint:'have', correct:['have'] },
        { id:'F3', hint:'work', correct:['works'] },
        { id:'F4', hint:'not work', correct:["aren’t working", "are not working"] },
        { id:'F5', hint:'live', correct:['live'] },
        { id:'F6', hint:'take', correct:["’re taking", "are taking"] },
      ],
      template:[
        'My name is Dan, and I ', {b:'F1'}, ' English at a university now. ',
        'I ', {b:'F2'}, ' one sister, Laura. ',
        'She’s a server, and she ', {b:'F3'}, ' at a restaurant four days a week. ',
        'My parents ', {b:'F4'}, ' now. They’re in their seventies. ',
        'They ', {b:'F5'}, ' in Miami. ',
        'But, they ', {b:'F6'}, ' a vacation in Australia right now.'
      ],
    },
    {
      letter:'G', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct words to complete the sentences.',
      questions:[
        { id:'G1', stem:'Louisa answers the phone and greets visitors to the office. She’s a _____.', correct:'receptionist', opts:[['cashier','cashier'],['receptionist','receptionist'],['flight','flight attendant']] },
        { id:'G2', stem:'Carrie is my aunt’s daughter. She’s my _____.', correct:'cousin', opts:[['niece','niece'],['cousin','cousin'],['sister','sister']] },
        { id:'G3', stem:'I didn’t feel well yesterday, so I _____ the afternoon off.', correct:'took', opts:[['did','did'],['took','took'],['made','made']] },
        { id:'G4', stem:'I listen to music a lot. I especially enjoy _____.', correct:'pop', opts:[['soap','soap operas'],['pop','pop'],['action','action']] },
        { id:'G5', stem:'Maria does _____ every morning before breakfast.', correct:'yoga', opts:[['yoga','yoga'],['tennis','tennis'],['swimming','swimming']] },
      ],
    },
    {
      letter:'H', points:6, per:'1 punto c/u', type:'dialog-verb', needsReview:true,
      instruction:'Complete this conversation. Use the past tense of the verbs given.',
      questions:[
        { id:'H1', a:'____ you at home last night?', b:'I ____ at home until 8:00. Why?', hint:'be', correct:['Were'] },
        { id:'H2', a:'I ____ at home until 8:00. Why?', b:'', hint:'be', correct:['was'] },
        { id:'H3', a:'Well, I ____ around 8:30, but you ____.', b:'', hint:'call', correct:['called'] },
        { id:'H4', a:'Well, I called around 8:30, but you ____.', b:'', hint:'not answer', correct:["didn’t answer", "did not answer"] },
        { id:'H5', a:'Why ____ you ____?', b:'Oh, I just ____ to chat.', hint:'call', correct:['did call', 'did . . . call', 'did ... call'] },
        { id:'H6', a:'Oh, I just ____ to chat.', b:'', hint:'want', correct:['wanted'] },
      ],
    },
    {
      letter:'I', points:6, per:'1 punto c/u', type:'matching',
      instruction:'Match the answers with the questions.',
      left:[
        { n:1, text:'How often do you watch TV?' },
        { n:2, text:'What kinds of TV shows do you like?' },
        { n:3, text:'What are you watching now?' },
        { n:4, text:'Are there any good programs on TV tonight?' },
        { n:5, text:'Would you like to watch a football game with me?' },
        { n:6, text:'Do you like soap operas?' },
      ],
      right:[
        { l:'a', text:'Yes, I’d love to.' },
        { l:'b', text:'No, there aren’t.' },
        { l:'c', text:'Usually every day.' },
        { l:'d', text:'I love game shows.' },
        { l:'e', text:'I’m watching a talk show.' },
        { l:'f', text:'No, I don’t like them.' },
      ],
      answers:{ 1:'c', 2:'d', 3:'e', 4:'b', 5:'a', 6:'f' },
    },
    {
      letter:'J', points:6, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct word or phrase to complete each conversation.',
      questions:[
        { id:'J1', stem:'A: Which camera do you like? — B: I like _____.', correct:'smallone', opts:[['thissmall','this small'],['theone','the one'],['smallone','the small one']] },
        { id:'J2', stem:'A: When do you usually go to bed? — B: _____ midnight.', correct:'at', opts:[['in','In'],['at','At'],['on','On']] },
        { id:'J3', stem:'A: Is the ring expensive? — B: Yes, but it’s _____ the necklace.', correct:'cheaperthan', opts:[['thecheap','the cheap'],['cheaper','cheaper'],['cheaperthan','cheaper than']] },
        { id:'J4', stem:'A: How _____ are you at tennis? — B: I don’t play tennis.', correct:'good', opts:[['good','good'],['often','often'],['well','well']] },
        { id:'J5', stem:'A: _____ you like to go out to dinner tonight? — B: I’m sorry. I can’t.', correct:'would', opts:[['do','Do'],['would','Would'],['are','Are']] },
        { id:'J6', stem:'A: I need to mail this letter. — B: _____ a post office on Oak Street.', correct:'theres', opts:[['its','It’s'],['theres','There’s'],['thats','That’s']] },
      ],
    },
    {
      letter:'K', points:4, per:'1 punto c/u', type:'arrange', needsReview:true,
      instruction:'Arrange these words to make sentences.',
      questions:[
        { id:'K1', prompt:'in / last / Marcos / was / Peru / week', correct:['Was Marcos in Peru last week?'] },
        { id:'K2', prompt:'goes / on / vacation / never / Lynn / away / almost', correct:['Lynn almost never goes away on vacation.'] },
        { id:'K3', prompt:'than / cheaper / is / this sweater / one / that', correct:['This sweater is cheaper than that one.'] },
        { id:'K4', prompt:'often / do / go / grocery store / you / the / how / to', correct:['How often do you go to the grocery store?'] },
      ],
    },
  ],
};


// ──────────────────────────────────────────────────────────────────────────
// CONTENIDO REAL — B2_WRITTEN_L32_TEST2_A  (Units 9–16 · Prueba 2 · Lección 32)
// Transcrito desde el PDF oficial Interchange 1. Key y script separados del estudiante.
// ──────────────────────────────────────────────────────────────────────────
const EXAM_B2_T2_A = {
  id: 'B2_WRITTEN_L32_TEST2_A',
  nivel: 'B2',
  contenido_real: true,
  oficial: true,
  titulo: 'Examen Escrito · Prueba 2',
  unidades: 'Unidades 9–16',
  leccion: 32,
  porcentaje: null,
  ponderacion_configurable: true,
  ponderacion_fuente: 'plan_academico',
  ponderacion_por_plan: { con_ina: 5, sin_ina: 15 },
  subtitulo: 'Unidades 9–16 · Lección 32',
  atribucion: 'Material de referencia interno: Interchange 1 © Cambridge University Press',
  puntos_totales: 50,
  videos: { listening_A: '7FB2NnFGkYU', listening_B: 'KX3kc8g5eDw' },
  audioScript: {
    A: [
      ['WOMAN', 'I don’t know any of these people, Brandon. Do you?'],
      ['BRANDON', 'Well, yes, I know a few. Do you see the woman wearing glasses?'],
      ['WOMAN', 'The one standing next to the table?'],
      ['BRANDON', 'Yes, that’s Irina. I know her from work.'],
      ['WOMAN', 'What about that good-looking man with the dark mustache. Do you know him?'],
      ['BRANDON', 'Yes, I do. That’s Carlos. I’ve known him for a long time. We went to high school together. Would you like to meet him?'],
      ['WOMAN', 'Yes, I would.'],
    ],
    B: [
      ['MARIA', 'What are my plans for the future? Well, I just finished school, and I had to borrow a lot of money before I could graduate. So, first I’m going to get a job so that I can start to pay all that money back. Also, I’m still living with my roommate, and I’m tired of doing that. I want to find my own apartment. It can’t be too expensive, so I’ll probably have to get something small. But it will be great to have my own place!'],
    ],
  },
  sections: [
    {
      letter:'A', points:2, per:'1 punto c/u', type:'listening-mc', listening:'A',
      instruction:'Listen to the people talking. Check (✓) the correct answers.',
      questions:[
        { id:'A1', stem:'Brandon _____.', correct:'works', opts:[['doesnt','doesn’t know Irina'],['works','works with Irina'],['talking','is talking with Irina']] },
        { id:'A2', stem:'Carlos _____.', correct:'school', opts:[['works','works with Brandon'],['school','went to high school with Brandon'],['meet','wants to meet Irina']] },
      ],
    },
    {
      letter:'B', points:2, per:'1 punto c/u', type:'listening-mc', listening:'B',
      instruction:'Listen to Maria talking about her plans for the future. Check (✓) the correct answers.',
      questions:[
        { id:'B1', stem:'Maria plans to _____.', correct:'job', opts:[['graduate','graduate soon'],['borrow','borrow money'],['job','get a job']] },
        { id:'B2', stem:'She wants to _____.', correct:'ownapt', opts:[['roommate','find a new roommate'],['larger','look for a larger apartment'],['ownapt','have her own apartment']] },
      ],
    },
    {
      letter:'C', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct words to complete the sentences.',
      questions:[
        { id:'C1', stem:'A: _____ I take your order?', correct:'may', opts:[['may','May'],['will','Will'],['would','Would']] },
        { id:'C2', stem:'B: Yes. _____ have a hamburger with french fries, please.', correct:'ill', opts:[['id','I’d'],['ill','I’ll'],['im','I’m']] },
        { id:'C3', stem:'A: And what _____ you like to drink with that?', correct:'would', opts:[['would','would'],['will','will'],['can','can']] },
        { id:'C4', stem:'B: _____ I have a soda with a lot of ice?', correct:'could', opts:[['would','Would'],['could','Could'],['will','Will']] },
        { id:'C5', stem:'B: _____ like a large one, please.', correct:'id', opts:[['ill','I’ll'],['ive','I’ve'],['id','I’d']] },
      ],
    },
    {
      letter:'D', points:6, per:'1 punto c/u', type:'matching',
      instruction:'Match the answers with the questions.',
      left:[
        { n:1, text:'What time of year should I go to Miami?' },
        { n:2, text:'What’s Dubai like?' },
        { n:3, text:'What sights can I see in Egypt?' },
        { n:4, text:'What are you going to do in Seoul?' },
        { n:5, text:'Have you been to Peru?' },
        { n:6, text:'How should I get around in New York?' },
      ],
      right:[
        { l:'a', text:'You can visit the pyramids.' },
        { l:'b', text:'I’m going to go to the markets.' },
        { l:'c', text:'You should use the subway.' },
        { l:'d', text:'You should go in the winter.' },
        { l:'e', text:'It’s very busy.' },
        { l:'f', text:'Yes. I went last year.' },
      ],
      answers:{ 1:'d', 2:'e', 3:'a', 4:'b', 5:'f', 6:'c' },
    },
    {
      letter:'E', points:5, per:'1 punto c/u', type:'para-fill',
      instruction:'Kiko sent this email to her friend Jennifer. Complete the sentences with words from the box. One word will not be used.',
      box:['already','really','too','but','though','yet'],
      blanks:[
        { id:'E1', hint:'word box', correct:'but' },
        { id:'E2', hint:'word box', correct:'really' },
        { id:'E3', hint:'word box', correct:'already' },
        { id:'E4', hint:'word box', correct:'too' },
        { id:'E5', hint:'word box', correct:'though' },
      ],
      template:[
        'Dear Jennifer, Greetings from Tokyo! I’ve been to Japan before, ', {b:'E1'},
        ' this trip is ', {b:'E2'},
        ' special. I’m meeting my husband’s grandparents! I’ve ', {b:'E3'},
        ' met his parents. They came to Los Angeles last year. The weather has been good – not ', {b:'E4'},
        ' hot or cold. We had some rain yesterday, ', {b:'E5'},
        '. See you in a week! Love, Kiko'
      ],
    },
    {
      letter:'F', points:5, per:'1 punto c/u', type:'reading-tf',
      instruction:'Read about the Sahara Desert. Then circle T (true) or F (false).',
      passageTitle:'The Sahara Desert',
      passage:[
        'The Sahara Desert is in northern Africa. It is bordered by the Atlantic Ocean on the west and the Red Sea on the east. It is the largest hot desert in the world, but it is not the largest desert in the world. Antarctica is the world’s largest desert. The Sahara is about 9,000,000 square kilometers (3,500,000 square miles). It is much larger than Australia and just a little smaller than the United States.',
        'The Sahara is one of the driest places on earth. The average rainfall is less than 2.5 centimeters (1 inch) per year. However, some areas are even drier. The Libyan Desert is one of the six areas of the Sahara. In parts of the Libyan Desert, no rain falls for years at a time.',
        'Most of the Sahara is flat, but there are some very high mountains in the western and central parts. The highest mountain, Emi Koussi, is over 3,400 meters (11,000 feet) high.',
      ],
      questions:[
        { id:'F1', text:'The Sahara is the largest desert in the world.', correct:'F' },
        { id:'F2', text:'The Sahara is larger than Australia.', correct:'T' },
        { id:'F3', text:'In most areas of the Sahara, no rain falls.', correct:'F' },
        { id:'F4', text:'The Libyan Desert is drier than other parts of the Sahara.', correct:'T' },
        { id:'F5', text:'The highest mountains are in the eastern part of the Sahara.', correct:'F' },
      ],
    },
    {
      letter:'G', points:5, per:'1 punto c/u', type:'error-correction', needsReview:true,
      instruction:'Circle the incorrect word in each sentence. Then write the correct word on the blank.',
      questions:[
        { id:'G1', html:'Which country is the <u>large</u>: Brazil, Argentina, or Colombia?', correct:'largest' },
        { id:'G2', html:'How <u>long</u> is Paris from London?', correct:'far' },
        { id:'G3', html:'I hope to <u>visiting</u> Italy next year.', correct:'visit' },
        { id:'G4', html:'Is Mexico <u>most</u> expensive than Guatemala?', correct:'more' },
        { id:'G5', html:'Jenny is going to <u>taking</u> a trip to Costa Rica in the spring.', correct:'take' },
      ],
    },
    {
      letter:'H', points:6, per:'1 punto c/u', type:'mc-inline',
      instruction:'Read the first line of each conversation. Check (✓) the correct response.',
      questions:[
        { id:'H1', stem:'A: What does your boyfriend look like? — B: _____.', correct:'tall', opts:[['tall','He’s tall and handsome.'],['couch','He’s the man sitting on the couch.'],['blue','He’s the one in a blue T-shirt.']] },
        { id:'H2', stem:'A: I love Mexican food. — B: _____.', correct:'so', opts:[['either','I don’t either.'],['do','Really? I do.'],['so','So do I.']] },
        { id:'H3', stem:'A: What can I take for a headache? — B: _____.', correct:'why', opts:[['like','I’d like some pain medicine, please.'],['can','Can I have some pain medicine?'],['why','Why don’t you take some pain medicine?']] },
        { id:'H4', stem:'A: What are you doing tonight? — B: _____.', correct:'work', opts:[['sure','Sure. I’d love to.'],['work','I’m going to work late.'],['no','No, I’m not.']] },
        { id:'H5', stem:'A: I’m not in the mood for a movie. — B: _____.', correct:'neither', opts:[['love','I’d love to.'],['neither','Neither am I.'],['great','Great! Let’s go.']] },
        { id:'H6', stem:'A: Hey, you look really different! — B: _____.', correct:'glasses', opts:[['one','Yes, I got one last week.'],['glasses','I know. I got new glasses.'],['moved','I moved to a new apartment.']] },
      ],
    },
    {
      letter:'I', points:5, per:'1 punto c/u', type:'para-verb', needsReview:true,
      instruction:'Complete this conversation. Use the present perfect or the simple past of the verbs given.',
      blanks:[
        { id:'I1', hint:'visit', correct:['Have you ever visited', 'Have . . . visited', 'Have ... visited'] },
        { id:'I2', hint:'not have', correct:["haven’t", 'have not'] },
        { id:'I3', hint:'go', correct:['went'] },
        { id:'I4', hint:'like', correct:['Did you like', 'Did . . . like', 'Did ... like'] },
        { id:'I5', hint:'take', correct:["’s taken", 'has taken'] },
      ],
      template:[
        'A: ', {b:'I1'}, ' a space center? B: No, I ', {b:'I2'},
        '. What about you? A: I ', {b:'I3'},
        ' to the space center last summer in Texas. B: ', {b:'I4'},
        ' it? A: It was amazing. My sister ', {b:'I5'},
        ' her children to the space center many times. They love to learn about space.'
      ],
    },
    {
      letter:'J', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct word or phrase to complete each sentence.',
      questions:[
        { id:'J1', stem:'Tom isn’t blond. His hair is very _____.', correct:'dark', opts:[['straight','straight'],['dark','dark'],['short','short']] },
        { id:'J2', stem:'I went to the drugstore yesterday and bought a tube of _____.', correct:'toothpaste', opts:[['tissues','tissues'],['cough','cough drops'],['toothpaste','toothpaste']] },
        { id:'J3', stem:'Martin likes to go away on weekends. Last Saturday, he _____ his truck to the beach.', correct:'drove', opts:[['rode','rode'],['drove','drove'],['lost','lost']] },
        { id:'J4', stem:'I’d like to see some of our friends. Let’s invite Rick and Simone over to our house and have a _____.', correct:'barbecue', opts:[['musical','musical'],['barbecue','barbecue'],['festival','film festival']] },
        { id:'J5', stem:'I wanted to change how I look, so I _____.', correct:'beard', opts:[['credit','got a credit card'],['hobby','started a new hobby'],['beard','grew a beard']] },
      ],
    },
    {
      letter:'K', points:4, per:'1 punto c/u', type:'arrange', needsReview:true,
      instruction:'Arrange these words to make sentences.',
      questions:[
        { id:'K1', prompt:'to / idea / take / good / vitamins / it’s / a', correct:["It’s a good idea to take vitamins."] },
        { id:'K2', prompt:'Jim / please / ask / call / to / me', correct:['Please ask Jim to call me.'] },
        { id:'K3', prompt:'Diane / for / haven’t / I / years / two / seen', correct:["I haven’t seen Diane for two years."] },
        { id:'K4', prompt:'talking / phone / the / Barbara is / woman / the / on', correct:['Barbara is the woman talking on the phone.'] },
      ],
    },
  ],
};





// ──────────────────────────────────────────────────────────────────────────
// CONTENIDO REAL — B2_WRITTEN_L32_TEST2_B  (Units 9–16 · Prueba 2 · Lección 32)
// Transcrito desde el PDF oficial Interchange 1. Key y script separados del estudiante.
// ──────────────────────────────────────────────────────────────────────────
const EXAM_B2_T2_B = {
  id: 'B2_WRITTEN_L32_TEST2_B',
  nivel: 'B2',
  contenido_real: true,
  oficial: true,
  titulo: 'Examen Escrito · Prueba 2',
  unidades: 'Unidades 9–16',
  leccion: 32,
  porcentaje: null,
  ponderacion_configurable: true,
  ponderacion_fuente: 'plan_academico',
  ponderacion_por_plan: { con_ina: 5, sin_ina: 15 },
  subtitulo: 'Unidades 9–16 · Lección 32',
  atribucion: 'Material de referencia interno: Interchange 1 © Cambridge University Press',
  puntos_totales: 50,
  videos: { listening_A: 'KX3kc8g5eDw', listening_B: 'KX3kc8g5eDw' },
  audioScript: {
    A: [
      ['SERVER', 'Good afternoon. May I help you?'],
      ['ELIZABETH', 'Yes, please. I’m Elizabeth Mandel, and I’m meeting my husband here at the restaurant. His name is Jason. Has he arrived yet?'],
      ['SERVER', 'I’m not sure, Mrs. Mandel. What does he look like?'],
      ['ELIZABETH', 'Well, he’s tall, with dark hair and a beard.'],
      ['SERVER', 'I think I saw two men with beards. Does he wear glasses?'],
      ['ELIZABETH', 'No, he doesn’t.'],
      ['SERVER', 'Oh, I know. He’s the man sitting by the window in the next room. Follow me.'],
      ['ELIZABETH', 'OK. Thanks.'],
    ],
    B: [
      ['VICTOR', 'My plans for the future? I’m not really sure. You see, I just left this job that I had for almost ten years. I’m looking for a new job, but I don’t want to take just any job. I’d like to find something that I will really enjoy doing. I’ve always wanted to paint, but I never really had the time to try it. So, maybe I’ll go back to school and take a few art classes while I’m looking for the right job.'],
    ],
  },
  sections: [
    {
      letter:'A', points:2, per:'1 punto c/u', type:'listening-mc', listening:'A',
      instruction:'Listen to the people talking. Check (✓) the correct answers.',
      questions:[
        { id:'A1', stem:'Elizabeth is _____.', correct:'looking', opts:[['looking','looking for her husband'],['dinner','eating dinner'],['jason','talking with Jason']] },
        { id:'A2', stem:'Elizabeth’s husband has _____.', correct:'beard', opts:[['blond','blond hair'],['glasses','glasses'],['beard','a beard']] },
      ],
    },
    {
      letter:'B', points:2, per:'1 punto c/u', type:'listening-mc', listening:'B',
      instruction:'Listen to Victor talking about his plans for the future. Check (✓) the correct answers.',
      questions:[
        { id:'B1', stem:'Victor _____.', correct:'stopped', opts:[['tenyears','left his job 10 years ago'],['stopped','just stopped working'],['artist','had a job as an artist']] },
        { id:'B2', stem:'He wants to _____.', correct:'paint', opts:[['teacher','become an art teacher'],['work','start working right away'],['paint','learn how to paint']] },
      ],
    },
    {
      letter:'C', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct words to complete the conversation.',
      questions:[
        { id:'C1', stem:'A: _____ I help you?', correct:'may', opts:[['may','May'],['should','Should'],['will','Will']] },
        { id:'C2', stem:'B: Yes. _____ like some pain medicine, please.', correct:'id', opts:[['ill','I’ll'],['id','I’d'],['im','I’m']] },
        { id:'C3', stem:'A: _____ you like the large bottle or the small one?', correct:'would', opts:[['will','Will'],['can','Can'],['would','Would']] },
        { id:'C4', stem:'B: The large one, please. And _____ I have some cough drops, too? I have a terrible cough.', correct:'could', opts:[['would','would'],['could','could'],['will','will']] },
        { id:'C5', stem:'B: _____ have a small bag, please.', correct:'ill', opts:[['id','I’d'],['ill','I’ll'],['ive','I’ve']] },
      ],
    },
    {
      letter:'D', points:6, per:'1 punto c/u', type:'matching',
      instruction:'Match the answers with the questions.',
      left:[
        { n:1, text:'What should I do in Costa Rica?' },
        { n:2, text:'What’s Kyoto like?' },
        { n:3, text:'How should I get to Madagascar?' },
        { n:4, text:'Where are you going to go on vacation?' },
        { n:5, text:'Have you been to Montreal?' },
        { n:6, text:'What should visitors do in Chicago?' },
      ],
      right:[
        { l:'a', text:'They should try the pizza.' },
        { l:'b', text:'Yes, I have. I went in May.' },
        { l:'c', text:'It’s very beautiful.' },
        { l:'d', text:'You should fly there.' },
        { l:'e', text:'I’m going to go to Ecuador.' },
        { l:'f', text:'You should go to the beach.' },
      ],
      answers:{ 1:'f', 2:'c', 3:'d', 4:'e', 5:'b', 6:'a' },
    },
    {
      letter:'E', points:5, per:'1 punto c/u', type:'para-fill',
      instruction:'Billy sent this email to his friend Todd. Complete the sentences with words from the box. One word will not be used.',
      box:['and','ever','too','but','really','yet'],
      blanks:[
        { id:'E1', hint:'word box', correct:'yet' },
        { id:'E2', hint:'word box', correct:'and' },
        { id:'E3', hint:'word box', correct:'really' },
        { id:'E4', hint:'word box', correct:'but' },
        { id:'E5', hint:'word box', correct:'too' },
      ],
      template:['Hi Todd! Have you gotten my postcard from Marrakech ', {b:'E1'}, '? We spent a week there, and then we went north. Yesterday we went to a market in Fez, ', {b:'E2'}, ' today we’re going to visit a village in the desert. Morocco is ', {b:'E3'}, ' interesting. This trip has been great, ', {b:'E4'}, ' I need some rest. I hope I’m not ', {b:'E5'}, ' tired for the camel ride tomorrow! Your friend, Billy'],
    },
    {
      letter:'F', points:5, per:'1 punto c/u', type:'reading-tf',
      instruction:'Read about the Indian Ocean. Then circle T (true) or F (false).',
      passageTitle:'The Indian Ocean',
      passage:[
        'The Indian Ocean is one of the world’s great oceans, but it is smaller than the Atlantic Ocean and the Pacific Ocean. Africa is to the west of the Indian Ocean, Australia is to the east, Asia is to the north, and the Southern Ocean is to the south. On average, the Indian Ocean is about 4,000 meters (about 13,000 feet) deep. That means that it is deeper than the Atlantic Ocean, but it is not as deep as the Pacific Ocean. The deepest point in the Indian Ocean is near the southern coast of Java.',
        'There are many islands in the Indian Ocean. Madagascar is the largest. Other large islands are Sumatra, Java, and Sri Lanka. These islands have beautiful beaches and have become very popular with tourists.',
      ],
      questions:[
        { id:'F1', text:'The Atlantic Ocean is larger than the Indian Ocean.', correct:'T' },
        { id:'F2', text:'Africa is to the east of the Indian Ocean.', correct:'F' },
        { id:'F3', text:'The Indian Ocean is deeper than the Atlantic Ocean.', correct:'T' },
        { id:'F4', text:'The deepest part of the Indian Ocean is off the coast of Australia.', correct:'F' },
        { id:'F5', text:'Java is larger than Madagascar.', correct:'F' },
      ],
    },
    {
      letter:'G', points:5, per:'1 punto c/u', type:'error-correction', needsReview:true,
      instruction:'Circle the incorrect word in each sentence. Then write the correct word on the blank.',
      questions:[
        { id:'G1', html:'Which continent is the <u>larger</u>: Asia, North America, or Africa?', correct:'largest' },
        { id:'G2', html:'<u>Why</u> deep is the Pacific Ocean?', correct:'How' },
        { id:'G3', html:'I’d like to <u>climbing</u> Mount Everest some day.', correct:'climb' },
        { id:'G4', html:'The Nile River is <u>longest</u> than the Mississippi River.', correct:'longer' },
        { id:'G5', html:'I’m going to <u>visiting</u> Niagara Falls next year.', correct:'visit' },
      ],
    },
    {
      letter:'H', points:6, per:'1 punto c/u', type:'mc-inline',
      instruction:'Read the first line of each conversation. Check (✓) the correct response.',
      questions:[
        { id:'H1', stem:'A: What color is your brother’s hair? — B: _____.', correct:'dark', opts:[['length','It’s medium length.'],['dark','It’s dark brown.'],['curly','It’s very curly.']] },
        { id:'H2', stem:'A: I’m not crazy about American food. — B: _____.', correct:'not', opts:[['really','Really? Are you?'],['so','So am I.'],['not','I’m not either.']] },
        { id:'H3', stem:'A: Could I have something for insomnia? — B: _____.', correct:'tea', opts:[['thank','Thank you. I do.'],['take','OK, I’ll take it.'],['tea','Try this herbal tea.']] },
        { id:'H4', stem:'A: Are you doing anything tomorrow night? — B: _____.', correct:'movie', opts:[['come','Would you like to come?'],['movie','Yes, I’m going to see a movie.'],['thanks','All right. Thanks a lot.']] },
        { id:'H5', stem:'A: I really enjoy dancing. — B: _____.', correct:'so', opts:[['so','So do I.'],['why','Why not?'],['cant','I can’t either.']] },
        { id:'H6', stem:'A: You’ve really changed! — B: _____.', correct:'hairstyle', opts:[['right','That’s right. I do!'],['good','Pretty good, thanks.'],['hairstyle','I have a new hairstyle.']] },
      ],
    },
    {
      letter:'I', points:5, per:'1 punto c/u', type:'para-verb', needsReview:true,
      instruction:'Complete this conversation. Use the present perfect or the simple past of the verbs given.',
      blanks:[
        { id:'I1', hint:'try', correct:['Have you ever tried', 'Have . . . tried', 'Have ... tried'] },
        { id:'I2', hint:'eat', correct:["’ve eaten", 'have eaten'] },
        { id:'I3', hint:'order', correct:['ordered'] },
        { id:'I4', hint:'think', correct:['did you think', 'Did you think', 'did . . . think', 'Did . . . think', 'did ... think', 'Did ... think'] },
        { id:'I5', hint:'have', correct:["’ve had", 'have had'] },
      ],
      template:['A: ', {b:'I1'}, ' lamb curry? B: Yes. I ', {b:'I2'}, ' it many times. How about you? A: I ', {b:'I3'}, ' it for the first time last night. B: What ', {b:'I4'}, ' of it? A: It was spicy. I ', {b:'I5'}, ' a lot of spicy food before, but this was too spicy!'],
    },
    {
      letter:'J', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct word or phrase to complete each sentence.',
      questions:[
        { id:'J1', stem:'Betty is medium _____. She’s about 171 cm (5 feet 7) tall.', correct:'height', opts:[['looks','looks'],['hair','hair'],['height','height']] },
        { id:'J2', stem:'Kim went to a drugstore yesterday and bought a _____ of pain medicine.', correct:'bottle', opts:[['tube','tube'],['bottle','bottle'],['can','can']] },
        { id:'J3', stem:'Martin _____ a bike for the first time yesterday.', correct:'rode', opts:[['rode','rode'],['drove','drove'],['wore','wore']] },
        { id:'J4', stem:'I love live performances, so I bought tickets for a _____ this weekend.', correct:'rock', opts:[['picnic','picnic'],['beach','beach party'],['rock','rock concert']] },
        { id:'J5', stem:'I wanted to change my appearance, so I _____.', correct:'dyed', opts:[['sport','learned a new sport'],['dyed','dyed my hair'],['loan','got a bank loan']] },
      ],
    },
    {
      letter:'K', points:4, per:'1 punto c/u', type:'arrange', needsReview:true,
      instruction:'Arrange these words to make sentences.',
      questions:[
        { id:'K1', prompt:'to / important / regularly / it’s / exercise', correct:["It’s important to exercise regularly."] },
        { id:'K2', prompt:'come / please / George / tell / early / to', correct:['Please tell George to come early.'] },
        { id:'K3', prompt:'lived / long / for / in Japan / I’ve / time / a', correct:["I’ve lived in Japan for a long time."] },
        { id:'K4', prompt:'with / man / Joe is / the / beard / the', correct:['Joe is the man with the beard.'] },
      ],
    },
  ],
};

// ──────────────────────────────────────────────────────────────────────────
// CONTENIDO REAL — B1_WRITTEN_L18_TEST1_A  (Units 1–8 · Prueba 1 · Lección 18)
// Transcrito desde el PDF oficial Interchange Intro. Key y script separados del estudiante.
// Nota de fuente: el PDF del examen muestra “Mary” en la tabla D; la key oficial
// dice “Isabella / Isabella’s”. En el examen se conserva Mary y se acepta “Mary’s”
// como respuesta principal; “Isabella’s” queda aceptada para revisión/compatibilidad.
// ──────────────────────────────────────────────────────────────────────────
const EXAM_B1_T1_A = {
  id: 'B1_WRITTEN_L18_TEST1_A',
  nivel: 'B1',
  contenido_real: true,
  oficial: true,
  titulo: 'Examen Escrito · Prueba 1',
  unidades: 'Unidades 1–8',
  leccion: 18,
  porcentaje: null,
  ponderacion_configurable: true,
  ponderacion_fuente: 'plan_academico',
  ponderacion_por_plan: { con_ina: 5, sin_ina: 15 },
  subtitulo: 'Unidades 1–8 · Lección 18',
  atribucion: 'Material de referencia interno: Interchange Intro © Cambridge University Press',
  puntos_totales: 50,
  videos: { listening_A: 'YZoVQWJ-lkw', listening_B: '45NhwUcz8sg' },
  audioScript: {
    A: [
      ['VICTOR', 'Hi. I’m Victor.'],
      ['LUSIA', 'Hi, Victor. I’m Luisa.'],
      ['VICTOR', 'Luisa? How do you spell that?'],
      ['LUSIA', 'L-U-I-S-A.'],
      ['VICTOR', 'Oh. Are you Spanish?'],
      ['LUSIA', 'No, I’m American. But my parents are originally from Italy, so I have an Italian name.'],
      ['VICTOR', 'That’s interesting. I have a friend from Spain. Her name is Luisa, too.'],
    ],
    B: [
      ['ERICA', 'So, Michael, what’s your new apartment like?'],
      ['MICHAEL', 'It’s very nice, and it’s large!'],
      ['ERICA', 'How many bedrooms does it have?'],
      ['MICHAEL', 'It has two bedrooms. I use one as a bedroom, and the other is my office.'],
      ['ERICA', 'Does it have a nice kitchen?'],
      ['MICHAEL', 'Yes, it does. There’s a new stove and refrigerator. There’s no microwave oven, but I don’t need a microwave.'],
      ['ERICA', 'Does it have a view?'],
      ['MICHAEL', 'No, it’s on the first floor. But there’s a small yard.'],
    ],
  },
  sections: [
    {
      letter:'A', points:2, per:'1 punto c/u', type:'listening-mc', listening:'A',
      instruction:'Listen to the people talking. Check (✓) the correct answers.',
      questions:[
        { id:'A1', stem:'The woman spells her name _____.', correct:'luisa', opts:[['louisa','L-O-U-I-S-A'],['luisa','L-U-I-S-A'],['lusia','L-U-S-I-A']] },
        { id:'A2', stem:'Her name is _____.', correct:'italian', opts:[['spanish','Spanish'],['american','American'],['italian','Italian']] },
      ],
    },
    {
      letter:'B', points:2, per:'1 punto c/u', type:'listening-mc', listening:'B',
      instruction:'Listen to the people talking. Check (✓) the correct answers.',
      questions:[
        { id:'B1', stem:'There’s no _____ in the kitchen.', correct:'microwave', opts:[['stove','stove'],['microwave','microwave oven'],['refrigerator','refrigerator']] },
        { id:'B2', stem:'Michael’s apartment doesn’t have _____.', correct:'view', opts:[['view','a view'],['yard','a yard'],['kitchen','a nice kitchen']] },
      ],
    },
    {
      letter:'C', points:6, per:'1 punto c/u', type:'dialog-verb', needsReview:true,
      instruction:'Complete the conversation. Use the correct form of be.',
      questions:[
        { id:'C1', a:'Jack: Excuse me. ____ you Isabel?', b:'Isabel: Yes, I am.', hint:'be', correct:'Are' },
        { id:'C2', a:'Jack: Excuse me. Are you Isabel?', b:'Isabel: Yes, I ____ .', hint:'be', correct:'am' },
        { id:'C3', a:'Jack: ____ your family from Mexico?', b:'Isabel: No. We are from Brazil.', hint:'be', correct:'Is' },
        { id:'C4', a:'Jack: Is your family from Mexico?', b:'Isabel: No. We ____ from Brazil.', hint:'be', correct:'are', accepted:["'re", 'are'] },
        { id:'C5', a:'Jack: What ____ your first language, Isabel?', b:'Isabel: It is Portuguese.', hint:'be', correct:'is', accepted:["'s", 'is'] },
        { id:'C6', a:'Jack: What is your first language, Isabel?', b:'Isabel: It ____ Portuguese.', hint:'be', correct:'is', accepted:["'s", 'is'] },
      ],
    },
    {
      letter:'D', points:6, per:'1 punto c/u', type:'table-fill', needsReview:true,
      instruction:'Complete this chart.',
      headers:['Subjects','Possessives'],
      rows:[
        { id:'D1', left:'I', correct:'my' },
        { id:'D2', left:'you', correct:'your' },
        { id:'D0', left:'he', fixed:'his' },
        { id:'D3', left:'she', correct:'her' },
        { id:'D4', left:'we', correct:'our' },
        { id:'D5', left:'they', correct:'their' },
        { id:'D6', left:'Mary', correct:"Mary’s", accepted:["Mary's", 'Mary’s', "Isabella's", 'Isabella’s'] },
      ],
      note:'Nota interna: el PDF fuente muestra “Mary”; la key oficial impresa trae “Isabella / Isabella’s”.',
    },
    {
      letter:'E', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct words to complete the sentences.',
      questions:[
        { id:'E1', stem:'Robert is handsome. He’s very _____.', correct:'goodlooking', opts:[['friendly','friendly'],['goodlooking','good-looking'],['serious','serious']] },
        { id:'E2', stem:'Anne works in a store, and she handles money. She’s a _____.', correct:'cashier', opts:[['cashier','cashier'],['pilot','pilot'],['musician','musician']] },
        { id:'E3', stem:'Mia doesn’t like her job. It’s very _____.', correct:'boring', opts:[['interesting','interesting'],['exciting','exciting'],['boring','boring']] },
        { id:'E4', stem:'Mario is Celia’s father. Celia is Mario’s _____.', correct:'daughter', opts:[['wife','wife'],['daughter','daughter'],['sister','sister']] },
        { id:'E5', stem:'It’s 10:00 A.M., and Zachary is sleeping. He gets up late _____ Saturdays.', correct:'on', opts:[['at','at'],['on','on'],['in','in']] },
      ],
    },
    {
      letter:'F', points:6, per:'1 punto c/u', type:'para-fill',
      instruction:'Complete the conversation. Use the words in the box. (You will not use all the words).',
      box:["it’s", 'these', "they’re", 'your', 'there', 'they', 'where is', "you’re"],
      blanks:[
        { id:'F1', hint:'word box', correct:'where is' },
        { id:'F2', hint:'word box', correct:'there' },
        { id:'F3', hint:'word box', correct:"It’s", accepted:["It's", 'It’s'] },
        { id:'F4', hint:'word box', correct:'these' },
        { id:'F5', hint:'word box', correct:'they' },
        { id:'F6', hint:'word box', correct:'Your', accepted:['Your','your'] },
      ],
      template:[
        'Joey: Kate, ', {b:'F1'}, ' my cell phone? Kate: I don’t know, but ', {b:'F2'},
        ' is a cell phone on the dresser. Joey: Oh, good. ', {b:'F3'},
        ' my phone. And are ', {b:'F4'}, ' my glasses? Kate: No, ', {b:'F5'},
        ' aren’t. ', {b:'F6'}, ' glasses are in the kitchen. Joey: Great. Thanks.'
      ],
    },
    {
      letter:'G', points:3, per:'1 punto c/u', type:'para-choice',
      instruction:'Circle the correct words.',
      blanks:[
        { id:'G1', opts:[['and','and'],['but','but']], correct:'and' },
        { id:'G2', opts:[['so','so'],['but','but']], correct:'so' },
        { id:'G3', opts:[['so','so'],['but','but']], correct:'but' },
      ],
      template:[
        '1. It’s cold today, ', {b:'G1'}, ' it’s very windy. ',
        '2. It’s noon, ', {b:'G2'}, ' we’re eating lunch. ',
        '3. John is wearing shoes, ', {b:'G3'}, ' he isn’t wearing socks.'
      ],
    },
    {
      letter:'H', points:4, per:'1 punto c/u', type:'short-write', needsReview:true,
      instruction:'Write the missing questions.',
      questions:[
        { id:'H1', prompt:'B: I’m fine, thanks.', correct:['How are you?'] },
        { id:'H2', prompt:'B: I’m 28 years old.', correct:['How old are you?'] },
        { id:'H3', prompt:'B: I’m a salesperson.', correct:['What do you do?'] },
        { id:'H4', prompt:'B: I work in a shoe store.', correct:['Where do you work?'] },
      ],
    },
    {
      letter:'I', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct responses.',
      questions:[
        { id:'I1', stem:'A: Have a good evening! — B: _____.', correct:'goodnight', opts:[['nice','It’s nice to meet you.'],['notbad','Not bad, thanks.'],['goodnight','Thanks. Good night, Ashley.']] },
        { id:'I2', stem:'A: What’s Marta like? — B: _____.', correct:'nice', opts:[['mexico','She’s from Mexico.'],['nice','She’s very nice.'],['eighteen','She’s eighteen.']] },
        { id:'I3', stem:'A: I need a pen. — B: _____.', correct:'pen', opts:[['see','Let me see. Yes, it is.'],['noproblem','No problem. Thank you.'],['pen','There’s a pen on the desk.']] },
        { id:'I4', stem:'A: When do you study? — B: _____.', correct:'evening', opts:[['yes','Yes, a lot.'],['school','At school.'],['evening','In the evening.']] },
        { id:'I5', stem:'A: Where are my keys? — B: _____.', correct:'hat', opts:[['hat','They’re under your hat.'],['backpack','It’s on your backpack.'],['three','There are three.']] },
      ],
    },
    {
      letter:'J', points:6, per:'1 punto c/u', type:'dialog-verb', needsReview:true,
      instruction:'Complete these sentences. Use the present continuous of the verbs in the box.',
      box:['do','not work','watch','not have','rain','wear'],
      questions:[
        { id:'J1', a:'A: What are you doing right now?', b:'B: We ____ TV.', hint:'watch', correct:'are watching', accepted:["'re watching", 'are watching'] },
        { id:'J2', a:'It ____ , but I’m not wearing a raincoat.', b:'', hint:'rain', correct:'is raining', accepted:["'s raining", 'is raining'] },
        { id:'J3', a:'Betty and Jill aren’t hungry, so they ____ lunch right now.', b:'', hint:'not have', correct:'are not having', accepted:["aren’t having", "'re not having", 'are not having'] },
        { id:'J4', a:'A: What ____ Carol ____ ?', b:'B: She’s checking her messages.', hint:'do', correct:'is doing', accepted:["'s doing", 'is doing'] },
        { id:'J5', a:'A: ____ you ____ shorts?', b:'B: No, I’m not. It’s cold today.', hint:'wear', correct:'Are wearing', accepted:['Are wearing', 'are wearing'] },
        { id:'J6', a:'A: Is Joyce at work now?', b:'B: No, she ____ today. It’s Sunday.', hint:'not work', correct:'is not working', accepted:["isn’t working", "'s not working", 'is not working'] },
      ],
    },
    {
      letter:'K', points:5, per:'1 punto c/u', type:'dialog-verb', needsReview:true,
      instruction:'Complete these conversations. Use the correct form of the verb in parentheses.',
      questions:[
        { id:'K1', a:'A: Where do you live?', b:'B: I ____ in the suburbs with my family.', hint:'live', correct:'live' },
        { id:'K2', a:'A: ____ you ____ any children?', b:'B: Yes, we have two children.', hint:'have', correct:'Do have', accepted:['Do have', 'do have'] },
        { id:'K3', a:'A: Do you drive to work?', b:'B: No, I ____ . I take the bus.', hint:'not do', correct:"don’t", accepted:["don’t", "don't"] },
        { id:'K4', a:'A: ____ your wife ____ ?', b:'B: Yes, she works in a hospital.', hint:'work', correct:'Does work', accepted:['Does work', 'does work'] },
        { id:'K5', a:'A: What ____ she ____ ?', b:'B: She’s a nurse.', hint:'do', correct:'does do', accepted:['does do', 'Does do'] },
      ],
    },
  ],
};


// ──────────────────────────────────────────────────────────────────────────
// CONTENIDO REAL — B1_WRITTEN_L32_TEST2_A  (Units 9–16 · Prueba 2 · Lección 32)
// Fuente oficial: Interchange Intro · Units 9–16 Test A + key + audio script.
// ──────────────────────────────────────────────────────────────────────────
const EXAM_B1_T2_A = {
  id: 'B1_WRITTEN_L32_TEST2_A',
  nivel: 'B1',
  contenido_real: true,
  oficial: true,
  titulo: 'Examen Escrito · Prueba 2',
  unidades: 'Unidades 9–16',
  leccion: 32,
  porcentaje: null,
  ponderacion_configurable: true,
  ponderacion_fuente: 'plan_academico',
  ponderacion_por_plan: { con_ina: 5, sin_ina: 15 },
  subtitulo: 'Unidades 9–16 · Lección 32',
  atribucion: 'Material de referencia interno: Interchange Intro © Cambridge University Press',
  puntos_totales: 50,
  videos: { listening_A: '7BPAGYlToYw', listening_B: 'oijYCxt2-Tk' },
  fuente_original: 'ic5_intro_t9to16a.pdf · Interchange Intro (referencia interna)',
  answer_key_fuente: 'ic5_intro_t9to16a_key.pdf',
  audio_script_fuente: 'ic5_intro_t9to16a_script.pdf',
  audioScript: {
    A: [
      ['PETER', 'Can you cook, Jill?'],
      ['JILL', 'Yeah, but not very well. I can make breakfast, but I can’t make meals for lunch or dinner at all. What about you, Peter?'],
      ['PETER', 'I can cook really well. I usually make dinner for friends on weekends.'],
      ['JILL', 'Oh, really? Can I come?'],
      ['PETER', 'Sure. But not this weekend. I’m going to visit my parents.'],
      ['JILL', 'Are you going to cook for them?'],
      ['PETER', 'No, I’m not. My mom always cooks at home.'],
    ],
    B: [
      ['STEVEN', 'Were you born here in New York, Ms. Chen?'],
      ['MS. CHEN', 'No, I wasn’t. I was born in Taiwan, but I grew up here.'],
      ['STEVEN', 'Oh, really? When did you come to New York?'],
      ['MS. CHEN', 'In 1957.'],
      ['STEVEN', 'Did you go to college here, too?'],
      ['MS. CHEN', 'No, I didn’t. I went to college in California.'],
      ['STEVEN', 'How did you like it there?'],
      ['MS. CHEN', 'I liked it a lot. But I wanted to live in New York, so I came back after college.'],
    ],
  },
  sections: [
    {
      letter:'A', points:2, per:'1 punto c/u', type:'listening-mc', listening:'A',
      instruction:'Listen to the people talking. Check (✓) the correct answers.',
      questions:[
        { id:'A1', stem:'Jill can make _____.', correct:'breakfast', opts:[['breakfast','breakfast'],['lunch','lunch'],['dinner','dinner']] },
        { id:'A2', stem:'This weekend, Peter is going to _____.', correct:'parents', opts:[['jill','see Jill'],['parents','visit his parents'],['cook','cook dinner for his parents']] },
      ],
    },
    {
      letter:'B', points:2, per:'1 punto c/u', type:'listening-mc', listening:'B',
      instruction:'Listen to the people talking. Check (✓) the correct answers.',
      questions:[
        { id:'B1', stem:'Ms. Chen grew up in _____.', correct:'newyork', opts:[['taiwan','Taiwan'],['newyork','New York'],['california','California']] },
        { id:'B2', stem:'What did Ms. Chen do after college?', correct:'cameback', opts:[['stayed','She stayed in California.'],['taiwan','She went to Taiwan.'],['cameback','She came back to New York.']] },
      ],
    },
    {
      letter:'C', points:5, per:'1 punto c/u', type:'dialog-verb', needsReview:true,
      instruction:'Complete these conversations. Use the correct form of be going to.',
      questions:[
        { id:'C1', a:'____ you ____ stay home this weekend?', b:'Yes, I am. I need to study. What about you?', hint:'be going to', correct:'Are going to', accepted:['Are going to','are going to'] },
        { id:'C2', a:'I ____ go out to dinner with some friends.', b:'', hint:'be going to', correct:'am going to', accepted:["'m going to", 'am going to'] },
        { id:'C3', a:'Where ____ you ____ have dinner?', b:'', hint:'be going to', correct:'are going to', accepted:['are going to','Are going to'] },
        { id:'C4', a:'We ____ eat at a Korean restaurant.', b:'', hint:'be going to', correct:'are going to', accepted:["'re going to", 'are going to'] },
        { id:'C5', a:'How ____ you ____ get there?', b:'By bus.', hint:'be going to', correct:'are going to', accepted:['are going to','Are going to'] },
      ],
    },
    {
      letter:'D', points:7, per:'1 punto c/u', type:'para-verb', needsReview:true,
      instruction:'Complete the paragraph. Use the simple past of the verbs in parentheses.',
      blanks:[
        { id:'D1', hint:'be', correct:'was' },
        { id:'D2', hint:'not work', correct:'didn’t work', accepted:["didn't work", 'didn’t work'] },
        { id:'D3', hint:'watch', correct:'watched' },
        { id:'D4', hint:'visit', correct:'visited' },
        { id:'D5', hint:'invite', correct:'invited' },
        { id:'D6', hint:'eat', correct:'ate' },
        { id:'D7', hint:'have', correct:'had' },
      ],
      template:['Yesterday ', {b:'D1'}, ' a holiday, so I ', {b:'D2'}, '. In the morning, I ', {b:'D3'}, ' a soccer game on TV. In the afternoon, I ', {b:'D4'}, ' some friends. They ', {b:'D5'}, ' me for dinner, so I ', {b:'D6'}, ' dinner at their house. We ', {b:'D7'}, ' a nice time!'],
    },
    {
      letter:'E', points:6, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct responses.',
      questions:[
        { id:'E1', stem:'A: Do we have any eggs? — B: _____.', correct:'need', opts:[['dontlike','I don’t like it.'],['need','No. We need some.'],['delicious','That’s delicious.']] },
        { id:'E2', stem:'A: Who can fix a car? — B: _____.', correct:'olivia', opts:[['drive','He can drive.'],['olivia','Olivia can.'],['yesican','Yes, I can.']] },
        { id:'E3', stem:'A: What sports do you play? — B: _____.', correct:'sports', opts:[['saturdays','On Saturdays.'],['sports','Soccer and golf.'],['friends','With my friends.']] },
        { id:'E4', stem:'A: Do you eat salad for lunch? — B: _____.', correct:'sometimes', opts:[['good','It’s good for you.'],['sometimes','Sometimes I do.'],['no','No, it isn’t.']] },
        { id:'E5', stem:'A: What city were you born in? — B: _____.', correct:'la', opts:[['usa','I was born in the United States.'],['la','I was born in Los Angeles.'],['1980','I was born in 1980.']] },
        { id:'E6', stem:'A: Why did you become a chef? — B: _____.', correct:'love', opts:[['after','After college.'],['love','Because I love to cook.'],['twenty','I was twenty.']] },
      ],
    },
    {
      letter:'F', points:6, per:'1 punto c/u', type:'para-choice',
      instruction:'Circle the correct words in the phone conversations.',
      blanks:[
        { id:'F1', opts:[['do','Do'],['would','Would']], correct:'would' },
        { id:'F2', opts:[['ihave','I have'],['idlove','I’d love']], correct:'idlove' },
        { id:'F3', opts:[['doyougo','Do you go'],['areyougoing','Are you going to go']], correct:'areyougoing' },
        { id:'F4', opts:[['i','I'],['me','me']], correct:'me' },
        { id:'F5', opts:[['it','it'],['us','us']], correct:'us' },
        { id:'F6', opts:[['want','want'],['like','like']], correct:'want' },
      ],
      template:['1. A: Hi, Sarah. It’s Chuck. ', {b:'F1'}, ' you like to have dinner with me tomorrow? B: Sure. ', {b:'F2'}, ' to. 2. A: Hi, Angela. ', {b:'F3'}, ' to the movies tonight? B: Yes, I am. Please meet ', {b:'F4'}, ' at 7:00. 3. A: Hi. This is David and Doreen. Please leave ', {b:'F5'}, ' a message. B: Hi. It’s Arthur. Do you ', {b:'F6'}, ' to go to a baseball game on Saturday? Call me. Bye.'],
    },
    {
      letter:'G', points:6, per:'1 punto c/u', type:'para-fill', needsReview:true,
      instruction:'Complete the conversation. Use the simple present or the imperative form of the words in the box.',
      box:['drink','not feel','open','have','not go','take'],
      blanks:[
        { id:'G1', hint:'not feel', correct:'don’t feel', accepted:["don't feel", 'don’t feel'] },
        { id:'G2', hint:'have', correct:'have' },
        { id:'G3', hint:'open', correct:'open' },
        { id:'G4', hint:'take', correct:'Take', accepted:['Take','take'] },
        { id:'G5', hint:'drink', correct:'Drink', accepted:['Drink','drink'] },
        { id:'G6', hint:'not go', correct:'don’t go', accepted:["don't go", 'don’t go'] },
      ],
      template:['Dr. Hill: How are you today, Mr. James? Mr. James: I ', {b:'G1'}, ' well, Dr. Hill. Dr. Hill: What’s the matter, exactly? Mr. James: I ', {b:'G2'}, ' a sore throat and a fever. Dr. Hill: Hmm. OK, let’s take a look. Now, please ', {b:'G3'}, ' your mouth. (A few minutes later . . .) Dr. Hill: OK, Mr. James, you have the flu. Here are some pills. ', {b:'G4'}, ' one pill two times a day. ', {b:'G5'}, ' lots of water and juice. And ', {b:'G6'}, ' to work tomorrow. Mr. James: OK. Thank you.'],
    },
    {
      letter:'H', points:7, per:'1 punto c/u', type:'arrange', needsReview:true,
      instruction:'Unscramble the questions.',
      questions:[
        { id:'H1', prompt:'ever / you / have / for breakfast / soup / do', correct:'Do you ever have soup for breakfast?' },
        { id:'H2', prompt:'any / we / do / chicken / have', correct:'Do we have any chicken?' },
        { id:'H3', prompt:'born / where / you / were', correct:'Where were you born?' },
        { id:'H4', prompt:'you / how / were / in 2000 / old', correct:'How old were you in 2000?' },
        { id:'H5', prompt:'you / what / going / tomorrow / to do / are', correct:'What are you going to do tomorrow?' },
        { id:'H6', prompt:'anywhere / this weekend / you / go / did', correct:'Did you go anywhere this weekend?' },
        { id:'H7', prompt:'play / can / the / Maria / piano', correct:'Can Maria play the piano?' },
      ],
    },
    {
      letter:'I', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct words to complete the sentences.',
      questions:[
        { id:'I1', stem:'I love blueberries. They’re my favorite _____.', correct:'fruit', opts:[['vegetable','vegetable'],['fruit','fruit'],['grain','grain']] },
        { id:'I2', stem:'Susan is very musical. She can _____.', correct:'violin', opts:[['soccer','play soccer'],['violin','play the violin'],['horse','ride a horse']] },
        { id:'I3', stem:'Nick is nine years old, and he’s in the 4th grade. He’s still in _____.', correct:'elementary', opts:[['elementary','elementary school'],['middle','middle school'],['high','high school']] },
        { id:'I4', stem:'Toby isn’t in class right now. He’s _____ home.', correct:'at', opts:[['at','at'],['in','in'],['on','on']] },
        { id:'I5', stem:'You can buy a sweater in a _____.', correct:'department', opts:[['gas','gas station'],['department','department store'],['post','post office']] },
      ],
    },
    {
      letter:'J', points:4, per:'1 punto c/u', type:'matching',
      instruction:'Complete the conversation. Use the sentences in the box.',
      left:[
        { n:1, text:'A: Excuse me. Is there a bank near here? B: _____' },
        { n:2, text:'A: Oak Street. How do I get there? B: _____' },
        { n:3, text:'A: Turn right? B: _____' },
        { n:4, text:'A: Is it on the corner? B: _____' },
      ],
      right:[
        { l:'a', text:'Yes, there is. There’s a bank on Oak Street.' },
        { l:'b', text:'Walk up First Avenue and turn right on Oak Street.' },
        { l:'c', text:'That’s correct. Then go to the next corner.' },
        { l:'d', text:'Yes, it is. It’s on the corner of Second Avenue and Oak Street.' },
      ],
      answers:{ 1:'a', 2:'b', 3:'c', 4:'d' },
    },
  ],
};



// ──────────────────────────────────────────────────────────────────────────
// CONTENIDO REAL — B1_WRITTEN_L18_TEST1_B  (Units 1–8 · Prueba 1 · Lección 18 · Opción B)
// Fuente oficial: Interchange Intro · Units 1–8 Test B + key + audio script.
// ──────────────────────────────────────────────────────────────────────────
const EXAM_B1_T1_B = {
  id: 'B1_WRITTEN_L18_TEST1_B',
  nivel: 'B1',
  contenido_real: true,
  oficial: true,
  titulo: 'Examen Escrito · Prueba 1',
  unidades: 'Unidades 1–8',
  leccion: 18,
  porcentaje: null,
  ponderacion_configurable: true,
  ponderacion_fuente: 'plan_academico',
  ponderacion_por_plan: { con_ina: 5, sin_ina: 15 },
  subtitulo: 'Unidades 1–8 · Lección 18',
  atribucion: 'Material de referencia interno: Interchange Intro © Cambridge University Press',
  puntos_totales: 50,
  // Test B usa su video oficial; ambas secciones del listening pertenecen al mismo track de Test B.
  videos: { listening_A: '45NhwUcz8sg', listening_B: '45NhwUcz8sg' },
  audioScript: {
    A: [
      ['ROBERT', 'Hi. My name is Robert.'],
      ['CELIA', 'Hi, Robert. I’m Celia.'],
      ['ROBERT', 'Oh. Do you spell that S-E-L-I-A?'],
      ['CELIA', 'No, it’s C-E-L-I-A.'],
      ['ROBERT', 'Oh, really? Are you from Mexico?'],
      ['CELIA', 'No, I’m Canadian, but my parents are originally from Argentina.'],
      ['ROBERT', 'Oh, I see.'],
    ],
    B: [
      ['JONATHAN', 'What’s your new apartment like, Maria?'],
      ['MARIA', 'It isn’t very big, but it’s nice.'],
      ['JONATHAN', 'How many bedrooms does it have?'],
      ['MARIA', 'It only has one bedroom, but I don’t need two bedrooms.'],
      ['JONATHAN', 'Does it have a dining room?'],
      ['MARIA', 'There’s no dining room, but there’s a big table in the kitchen.'],
      ['JONATHAN', 'What’s the kitchen like?'],
      ['MARIA', 'It’s very nice. It has a new stove, a refrigerator, and a microwave oven.'],
      ['JONATHAN', 'It sounds great!'],
    ],
  },
  sections: [
    {
      letter:'A', points:2, per:'1 punto c/u', type:'listening-mc', listening:'A',
      instruction:'Listen to the people talking. Check (✓) the correct answers.',
      questions:[
        { id:'A1', stem:'The woman spells her name _____.', correct:'celia', opts:[['selia','S-E-L-I-A'],['celia','C-E-L-I-A'],['cecelia','C-E-C-E-L-I-A']] },
        { id:'A2', stem:'She’s from _____.', correct:'canada', opts:[['canada','Canada'],['mexico','Mexico'],['argentina','Argentina']] },
      ],
    },
    {
      letter:'B', points:2, per:'1 punto c/u', type:'listening-mc', listening:'B',
      instruction:'Listen to the people talking. Check (✓) the correct answers.',
      questions:[
        { id:'B1', stem:'There’s a table in the _____.', correct:'kitchen', opts:[['bedroom','bedroom'],['dining','dining room'],['kitchen','kitchen']] },
        { id:'B2', stem:'Maria’s apartment has _____.', correct:'nicekitchen', opts:[['twobedrooms','two bedrooms'],['diningroom','a dining room'],['nicekitchen','a nice kitchen']] },
      ],
    },
    {
      letter:'C', points:6, per:'1 punto c/u', type:'dialog-verb', needsReview:true,
      instruction:'Complete the conversation. Use the correct form of be.',
      questions:[
        { id:'C1', a:'Emma: Hi. ____ you Rafael?', b:'Rafael: Yes, I am.', hint:'be', correct:'Are' },
        { id:'C2', a:'Emma: Hi. Are you Rafael?', b:'Rafael: Yes, I ____ .', hint:'be', correct:'am' },
        { id:'C3', a:'Emma: Where ____ your family from, Rafael?', b:'Rafael: They are from El Salvador.', hint:'be', correct:'is', accepted:["'s", 'is'] },
        { id:'C4', a:'Rafael: They ____ from El Salvador.', b:'', hint:'be', correct:'are', accepted:["'re", 'are'] },
        { id:'C5', a:'Emma: ____ your first language Spanish?', b:'Rafael: No. It is English.', hint:'be', correct:'Is' },
        { id:'C6', a:'Rafael: No. It ____ English.', b:'', hint:'be', correct:'is', accepted:["'s", 'is'] },
      ],
    },
    {
      letter:'D', points:6, per:'1 punto c/u', type:'table-fill', needsReview:true,
      instruction:'Complete this chart.',
      headers:['Subjects','Possessives'],
      rows:[
        { id:'D1', left:'I', correct:'my' },
        { id:'D0', left:'you', fixed:'your' },
        { id:'D2', left:'he', correct:'his' },
        { id:'D3', left:'she', correct:'her' },
        { id:'D4', left:'we', correct:'our' },
        { id:'D5', left:'they', correct:'their' },
        { id:'D6', left:'John', correct:'John’s', accepted:["John's", 'John’s'] },
      ],
    },
    {
      letter:'E', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct answers to complete the sentences.',
      questions:[
        { id:'E1', stem:'Kate never laughs. She’s very _____.', correct:'serious', opts:[['tall','tall'],['pretty','pretty'],['serious','serious']] },
        { id:'E2', stem:'Kevin flies a plane. He’s a _____.', correct:'pilot', opts:[['cashier','cashier'],['waiter','waiter'],['pilot','pilot']] },
        { id:'E3', stem:'Daniel loves his job. It’s very _____.', correct:'exciting', opts:[['exciting','exciting'],['stressful','stressful'],['boring','boring']] },
        { id:'E4', stem:'Ray is Barbara’s son. Barbara is Ray’s _____.', correct:'mother', opts:[['sister','sister'],['wife','wife'],['mother','mother']] },
        { id:'E5', stem:'It’s 1:00 P.M., and Bill is going to work. He works _____ the afternoon.', correct:'in', opts:[['at','at'],['in','in'],['on','on']] },
      ],
    },
    {
      letter:'F', points:6, per:'1 punto c/u', type:'para-fill',
      instruction:'Complete the conversation. Use the words in the box. (You will not use all the words).',
      box:['it', "they’re", 'where are', 'your', 'there', 'this', 'where is', "you’re"],
      blanks:[
        { id:'F1', hint:'word box', correct:'where are' },
        { id:'F2', hint:'word box', correct:'there' },
        { id:'F3', hint:'word box', correct:"They’re", accepted:["They're", 'They’re'] },
        { id:'F4', hint:'word box', correct:'this' },
        { id:'F5', hint:'word box', correct:'it' },
        { id:'F6', hint:'word box', correct:'Your', accepted:['Your','your'] },
      ],
      template:[
        'Tom: Mom, ', {b:'F1'}, ' my books? Mrs. Davies: I don’t know, but ', {b:'F2'},
        ' are some books on the kitchen table. Tom: Oh, good. ', {b:'F3'},
        ' my books. And is ', {b:'F4'}, ' my lunch? Mrs. Davies: No, ', {b:'F5'},
        ' isn’t. ', {b:'F6'}, ' lunch is in the refrigerator. Tom: Oh, OK. Thanks, Mom.'
      ],
    },
    {
      letter:'G', points:3, per:'1 punto c/u', type:'para-choice',
      instruction:'Circle the correct words.',
      blanks:[
        { id:'G1', opts:[['and','and'],['but','but']], correct:'and' },
        { id:'G2', opts:[['but','but'],['so','so']], correct:'so' },
        { id:'G3', opts:[['so','so'],['but','but']], correct:'but' },
      ],
      template:[
        '1. It’s very sunny today, ', {b:'G1'}, ' it’s also hot. ',
        '2. Don’s hungry, ', {b:'G2'}, ' he’s eating dinner. ',
        '3. I’m wearing a jacket, ', {b:'G3'}, ' I’m not wearing a tie.'
      ],
    },
    {
      letter:'H', points:4, per:'1 punto c/u', type:'short-write', needsReview:true,
      instruction:'Write the missing questions.',
      questions:[
        { id:'H1', prompt:'B: Pretty good, thanks.', correct:['How are you?'] },
        { id:'H2', prompt:'B: I’m from Canada.', correct:['Where are you from?'] },
        { id:'H3', prompt:'B: I’m a doctor.', correct:['What do you do?'] },
        { id:'H4', prompt:'B: I work in a hospital.', correct:['Where do you work?'] },
      ],
    },
    {
      letter:'I', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct responses.',
      questions:[
        { id:'I1', stem:'A: See you later, Ethan. — B: _____.', correct:'bye', opts:[['howare','Great! How are you?'],['bye','Bye-bye.'],['thanks','Thanks. You, too.']] },
        { id:'I2', stem:'A: Who’s that? — B: _____.', correct:'classmate', opts:[['classmate','He’s my classmate.'],['smart','He’s very smart.'],['twenty','He’s twenty.']] },
        { id:'I3', stem:'A: I need a chair. — B: _____.', correct:'chair', opts:[['chair','There’s a chair in the hall.'],['kitchen','It goes in the kitchen.'],['next','Put it next to the table.']] },
        { id:'I4', stem:'A: What time do you have breakfast? — B: _____.', correct:'seven', opts:[['everyday','Every day.'],['seven','At seven o’clock.'],['work','I eat at work.']] },
        { id:'I5', stem:'A: Where are my shoes? — B: _____.', correct:'bed', opts:[['backpack','It’s behind your backpack.'],['black','They’re black.'],['bed','They’re under the bed.']] },
      ],
    },
    {
      letter:'J', points:6, per:'1 punto c/u', type:'dialog-verb', needsReview:true,
      instruction:'Complete these sentences. Use the present continuous of the verbs in the box.',
      box:['do','not wear','snow','have','play','take'],
      questions:[
        { id:'J1', a:'A: What are you doing, Mary?', b:'B: I ____ dinner.', hint:'have', correct:'am having', accepted:["'m having", 'am having'] },
        { id:'J2', a:'Arnold is wearing a tie, but he ____ a jacket.', b:'', hint:'not wear', correct:'is not wearing', accepted:["isn’t wearing", "'s not wearing", 'is not wearing'] },
        { id:'J3', a:'It’s Sunday, so Paul and Judy ____ a walk in the park.', b:'', hint:'take', correct:'are taking' },
        { id:'J4', a:'A: What are Emilio and Sandy doing?', b:'B: They ____ tennis.', hint:'play', correct:'are playing', accepted:["'re playing", 'are playing'] },
        { id:'J5', a:'A: What ____ Victor ____ ?', b:'B: He’s washing his car.', hint:'do', correct:'is doing', accepted:["'s doing", 'is doing'] },
        { id:'J6', a:'A: Is it cold outside?', b:'B: Yes, but it ____ . It’s sunny.', hint:'snow', correct:'is not snowing', accepted:["isn’t snowing", "'s not snowing", 'is not snowing'] },
      ],
    },
    {
      letter:'K', points:5, per:'1 punto c/u', type:'dialog-verb', needsReview:true,
      instruction:'Complete these conversations. Use the correct form of the verb in parentheses.',
      questions:[
        { id:'K1', a:'A: Where do you and Shannon live?', b:'B: We ____ in a large apartment downtown.', hint:'live', correct:'live' },
        { id:'K2', a:'A: ____ you ____ any brothers or sisters?', b:'B: Yes. I have one brother and one sister.', hint:'have', correct:'Do have', accepted:['Do have', 'do have'] },
        { id:'K3', a:'A: Does the apartment have a small kitchen?', b:'B: No, it ____ . The kitchen is large.', hint:'not do', correct:'doesn’t', accepted:["doesn’t", "doesn't"] },
        { id:'K4', a:'A: ____ you ____ ?', b:'B: Yes. I cook every day. I work in a restaurant.', hint:'cook', correct:'Do cook', accepted:['Do cook', 'do cook'] },
        { id:'K5', a:'A: What ____ you ____ , exactly?', b:'B: I’m a chef.', hint:'do', correct:'do do', accepted:['do do', 'Do do'] },
      ],
    },
  ],
};



// ──────────────────────────────────────────────────────────────────────────
// CONTENIDO REAL — B1_WRITTEN_L32_TEST2_B  (Units 9–16 · Prueba 2 · Lección 32 · Opción B)
// Fuente oficial: Interchange Intro · Units 9–16 Test B + key + audio script.
// ──────────────────────────────────────────────────────────────────────────
const EXAM_B1_T2_B = {
  id: 'B1_WRITTEN_L32_TEST2_B',
  nivel: 'B1',
  contenido_real: true,
  oficial: true,
  titulo: 'Examen Escrito · Prueba 2',
  unidades: 'Unidades 9–16',
  leccion: 32,
  porcentaje: null,
  ponderacion_configurable: true,
  ponderacion_fuente: 'plan_academico',
  ponderacion_por_plan: { con_ina: 5, sin_ina: 15 },
  subtitulo: 'Unidades 9–16 · Lección 32',
  atribucion: 'Material de referencia interno: Interchange Intro © Cambridge University Press',
  puntos_totales: 50,
  // Test B usa su video oficial; ambas secciones del listening pertenecen al mismo track de Test B.
  videos: { listening_A: 'oijYCxt2-Tk', listening_B: 'oijYCxt2-Tk' },
  fuente_original: 'ic5_intro_t9to16b.pdf · Interchange Intro (referencia interna)',
  answer_key_fuente: 'ic5_intro_t9to16b_key.pdf',
  audio_script_fuente: 'ic5_intro_t9to16b_script.pdf',
  audioScript: {
    A: [
      ['MATTHEW', 'Can you play tennis, Pat?'],
      ['PAT', 'Sure, Matthew. Can’t you?'],
      ['MATTHEW', 'Well, I can, but not very well. I need to practice.'],
      ['PAT', 'Do you want to play tennis with me this weekend? We can play at Jones Park near my house.'],
      ['MATTHEW', 'Thanks, I’d love to. Are you going to have time on Saturday?'],
      ['PAT', 'No, I’m busy then. But I’m free on Sunday.'],
      ['MATTHEW', 'That sounds good.'],
    ],
    B: [
      ['JACKIE', 'Did you grow up here in San Antonio, Phil?'],
      ['PHIL', 'Yes, I did, Jackie. But I wasn’t born here.'],
      ['JACKIE', 'Oh, really? Where were you born?'],
      ['PHIL', 'I was born in Los Angeles.'],
      ['JACKIE', 'Did you go to college here?'],
      ['PHIL', 'No, I went to college in Vancouver.'],
      ['JACKIE', 'That’s interesting. How did you like it in Vancouver?'],
      ['PHIL', 'I liked it a lot. But I wanted to be near my family. So after college, I came home to work in San Antonio.'],
    ],
  },
  sections: [
    {
      letter:'A', points:2, per:'1 punto c/u', type:'listening-mc', listening:'A',
      instruction:'Listen to the people talking. Check (✓) the correct answers.',
      questions:[
        { id:'A1', stem:'Matthew can’t _____.', correct:'playwell', opts:[['practice','practice tennis'],['playwell','play tennis very well'],['meet','meet Pat this weekend']] },
        { id:'A2', stem:'Pat can’t meet Matthew _____.', correct:'saturday', opts:[['weekend','this weekend'],['saturday','on Saturday'],['sunday','on Sunday']] },
      ],
    },
    {
      letter:'B', points:2, per:'1 punto c/u', type:'listening-mc', listening:'B',
      instruction:'Listen to the people talking. Check (✓) the correct answers.',
      questions:[
        { id:'B1', stem:'Phil was born in _____.', correct:'la', opts:[['sanantonio','San Antonio'],['la','Los Angeles'],['vancouver','Vancouver']] },
        { id:'B2', stem:'He went to Vancouver to _____.', correct:'college', opts:[['work','work'],['college','go to college'],['family','be near his family']] },
      ],
    },
    {
      letter:'C', points:5, per:'1 punto c/u', type:'dialog-verb', needsReview:true,
      instruction:'Complete the conversations. Use the correct form of be going to.',
      questions:[
        { id:'C1', a:'A: What ____ you ____ do for New Year’s Eve?', b:'B: I am not going to do anything special.', hint:'be going to', correct:'are going to', accepted:['are going to','Are going to'] },
        { id:'C2', a:'B: I ____ not ____ do anything special.', b:'', hint:'be going to', correct:'am going to', accepted:['am going to', "'m going to"] },
        { id:'C3', a:'A: Would you like to come to our house? We ____ have a party.', b:'', hint:'be going to', correct:'are going to', accepted:['are going to', "'re going to"] },
        { id:'C4', a:'B: Great! When ____ it ____ start?', b:'', hint:'be going to', correct:'is going to', accepted:['is going to', "'s going to"] },
        { id:'C5', a:'A: At 7:00. ____ you ____ come?', b:'B: Sure. Thanks!', hint:'be going to', correct:'Are going to', accepted:['Are going to','are going to'] },
      ],
    },
    {
      letter:'D', points:5, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct words to complete these sentences.',
      questions:[
        { id:'D1', stem:'My family eats a lot of grains. For example, we eat _____ two times a week.', correct:'pasta', opts:[['nuts','nuts'],['pasta','pasta'],['yogurt','yogurt']] },
        { id:'D2', stem:'This weekend, Alex is going to _____ chess.', correct:'play', opts:[['go','go'],['play','play'],['do','do']] },
        { id:'D3', stem:'Emily is 17, and she’s in 12th grade. It’s her last year of _____.', correct:'high', opts:[['elementary','elementary school'],['middle','middle school'],['high','high school']] },
        { id:'D4', stem:'Brenda isn’t working right now. She’s _____ vacation.', correct:'on', opts:[['at','at'],['on','on'],['in','in']] },
        { id:'D5', stem:'I went to the post office to get some _____.', correct:'stamps', opts:[['aspirin','aspirin'],['gasoline','gasoline'],['stamps','stamps']] },
      ],
    },
    {
      letter:'E', points:6, per:'1 punto c/u', type:'mc-inline',
      instruction:'Check (✓) the correct responses.',
      questions:[
        { id:'E1', stem:'A: What do you want for the picnic? — B: _____.', correct:'bread', opts:[['bread','Let’s take some bread and cheese.'],['delicious','That’s delicious.'],['never','I never eat sandwiches.']] },
        { id:'E2', stem:'A: You can cook very well. — B: _____.', correct:'thanks', opts:[['thanks','Oh. Thank you.'],['yescan','Yes, you can.'],['not','No, I’m not.']] },
        { id:'E3', stem:'A: Where do you go swimming? — B: _____.', correct:'beach', opts:[['summer','In the summer.'],['beach','At the beach.'],['sundays','On Sundays.']] },
        { id:'E4', stem:'A: Do you ever play volleyball? — B: _____.', correct:'sometimes', opts:[['yard','In my yard.'],['can','Yes, I can.'],['sometimes','Sometimes I do.']] },
        { id:'E5', stem:'A: Where were you born? — B: _____.', correct:'beijing', opts:[['1988','In 1988.'],['beijing','In Beijing.'],['nineteen','I’m nineteen.']] },
        { id:'E6', stem:'A: Why did you become an artist? — B: _____.', correct:'draw', opts:[['great','It was great.'],['draw','Because I like to draw.'],['ny','In New York.']] },
      ],
    },
    {
      letter:'F', points:6, per:'1 punto c/u', type:'para-choice',
      instruction:'Circle the correct words in the phone conversations.',
      blanks:[
        { id:'F1', opts:[['like','like'],['want','want']], correct:'like' },
        { id:'F2', opts:[['her','her'],['it','it']], correct:'her' },
        { id:'F3', opts:[['doyougo','Do you go'],['areyougoing','Are you going to go']], correct:'areyougoing' },
        { id:'F4', opts:[['i','I'],['me','me']], correct:'me' },
        { id:'F5', opts:[['him','him'],['me','me']], correct:'me' },
        { id:'F6', opts:[['like','like'],['want','want']], correct:'want' },
      ],
      template:['1. A: Hi. I’d ', {b:'F1'}, ' to speak to Paula, please. B: She isn’t here right now, but you can call ', {b:'F2'}, ' at work. 2. A: Hi, Mike. ', {b:'F3'}, ' to the beach tomorrow? B: I’m not sure. Call ', {b:'F4'}, ' tonight. 3. A: Hi. This is Dan. Please leave ', {b:'F5'}, ' a message after the beep. B: Hi, Dan. This is Wendy. Do you ', {b:'F6'}, ' to come to my house this weekend? Call me. Bye-bye.'],
    },
    {
      letter:'G', points:6, per:'1 punto c/u', type:'para-fill', needsReview:true,
      instruction:'Complete the conversation. Use the simple present or the imperative form of the words in the box.',
      box:['call','get','not stay up','feel','have','take'],
      blanks:[
        { id:'G1', hint:'feel', correct:'feel' },
        { id:'G2', hint:'have', correct:'have' },
        { id:'G3', hint:'take', correct:'Take', accepted:['Take','take'] },
        { id:'G4', hint:'get', correct:'Get', accepted:['Get','get'] },
        { id:'G5', hint:'not stay up', correct:'don’t stay up', accepted:["don't stay up", 'don’t stay up'] },
        { id:'G6', hint:'call', correct:'Call', accepted:['Call','call'] },
      ],
      template:['Ms. Thomas: I ', {b:'G1'}, ' awful, Dr. Jensen. Dr. Jensen: So, what’s wrong, exactly? Ms. Thomas: Well, I ', {b:'G2'}, ' a bad cough and a sore throat. Dr. Jensen: OK, let me look at you. (A few minutes later . . .) Dr. Jensen: Well, it’s just a bad cold. Here is some cough medicine. ', {b:'G3'}, ' it three times a day. ', {b:'G4'}, ' some rest, and ', {b:'G5'}, ' late. ', {b:'G6'}, ' me next week, and tell me how you feel. Ms. Thomas: All right. Thank you.'],
    },
    {
      letter:'H', points:7, per:'1 punto c/u', type:'arrange', needsReview:true,
      instruction:'Unscramble the questions.',
      questions:[
        { id:'H1', prompt:'you / have / breakfast / usually / do', correct:'Do you usually have breakfast?' },
        { id:'H2', prompt:'need / do / milk / any / we', correct:'Do we need any milk?' },
        { id:'H3', prompt:'you / were / this school / at / last year', correct:'Were you at this school last year?' },
        { id:'H4', prompt:'you / where / grow up / did', correct:'Where did you grow up?' },
        { id:'H5', prompt:'the party / time / what / to start / going / is', correct:'What time is the party going to start?' },
        { id:'H6', prompt:'get up / you / did / early / today', correct:'Did you get up early today?' },
        { id:'H7', prompt:'you / a horse / can / ride / well / very', correct:'Can you ride a horse very well?' },
      ],
    },
    {
      letter:'I', points:4, per:'1 punto c/u', type:'matching',
      instruction:'Complete the conversation. Use the sentences in the box.',
      left:[
        { n:1, text:'A: Excuse me. Is there a gas station near here? B: _____' },
        { n:2, text:'A: Third Street? How do I get there? B: _____' },
        { n:3, text:'A: Turn left on Main Street? B: _____' },
        { n:4, text:'A: Is it near the corner? B: _____' },
      ],
      right:[
        { l:'a', text:'Yes. There’s a gas station on Third Street.' },
        { l:'b', text:'Go down Second Street. Turn left on Main Street.' },
        { l:'c', text:'Yes. Then walk down Main Street and turn right on Third Street.' },
        { l:'d', text:'Yes, it is. You can’t miss it. It’s across from a movie theater.' },
      ],
      answers:{ 1:'a', 2:'b', 3:'c', 4:'d' },
    },
    {
      letter:'J', points:7, per:'1 punto c/u', type:'para-verb', needsReview:true,
      instruction:'Complete the paragraph. Use the simple past of the verbs in parentheses.',
      blanks:[
        { id:'J1', hint:'be', correct:'was' },
        { id:'J2', hint:'work', correct:'worked' },
        { id:'J3', hint:'exercise', correct:'exercised' },
        { id:'J4', hint:'go', correct:'went' },
        { id:'J5', hint:'not watch', correct:'didn’t watch', accepted:["didn't watch", 'didn’t watch'] },
        { id:'J6', hint:'feel', correct:'felt' },
        { id:'J7', hint:'listen', correct:'listened' },
      ],
      template:['Yesterday ', {b:'J1'}, ' Tuesday. I ', {b:'J2'}, ' at the office all day. After work, I ', {b:'J3'}, ' at the gym for an hour. Then I ', {b:'J4'}, ' home for dinner with my family. After dinner, I usually watch the news on TV, but I ', {b:'J5'}, ' TV last night because I ', {b:'J6'}, ' tired. I just ', {b:'J7'}, ' to some music.'],
    },
  ],
};

// Registro de exámenes con contenido real/oficial (lookup por id).
// Oficiales en esta ronda: las 16 entradas del catálogo (B1/B2/I1/I2 · Test 1/2 · Opción A/B).
const EXAMS = {
  'I2_WRITTEN_L18_TEST1_A': EXAM_I2_T1_A,
  'I2_WRITTEN_L18_TEST1_B': EXAM_I2_T1_B,
  'I2_WRITTEN_L32_TEST2_A': EXAM_I2_T2_A,
  'I2_WRITTEN_L32_TEST2_B': EXAM_I2_T2_B,
  'I1_WRITTEN_L18_TEST1_A': EXAM_I1_T1_A,
  'I1_WRITTEN_L18_TEST1_B': EXAM_I1_T1_B,
  'I1_WRITTEN_L32_TEST2_A': EXAM_I1_T2_A,
  'I1_WRITTEN_L32_TEST2_B': EXAM_I1_T2_B,
  'B2_WRITTEN_L18_TEST1_A': EXAM_B2_T1_A,
  'B2_WRITTEN_L18_TEST1_B': EXAM_B2_T1_B,
  'B2_WRITTEN_L32_TEST2_A': EXAM_B2_T2_A,
  'B2_WRITTEN_L32_TEST2_B': EXAM_B2_T2_B,
  'B1_WRITTEN_L18_TEST1_A': EXAM_B1_T1_A,
  'B1_WRITTEN_L32_TEST2_A': EXAM_B1_T2_A,
  'B1_WRITTEN_L18_TEST1_B': EXAM_B1_T1_B,
  'B1_WRITTEN_L32_TEST2_B': EXAM_B1_T2_B,
};

// ──────────────────────────────────────────────────────────────────────────
// SUBMISSION SIMULADA — para la bandeja del profesor.
// Respuestas de un estudiante ficticio (no se guarda nada real).
// Mezcla aciertos, errores y casos "cerca / variante" que el sistema NO puede
// calificar solo y debe marcar "requiere revisión".
// ──────────────────────────────────────────────────────────────────────────
const SUBMISSION_DEMO = {
  estudiante:'María Fernanda Quirós',
  codigo:'AN-2024-0418',
  cedula:'1-1789-0456',
  grupo:'I2-LM-0625',
  nivel:'I2',
  examen:'I2_WRITTEN_L18_TEST1_A',
  opcion:'A',
  enviado:'12 jun 2026 · 18:42',
  tiempo:'41 min',
  estado:'pendiente', // pendiente | en_revision | parcial | listo | cerrado
  respuestas:{
    A1:'packing', A2:'vacation',
    B1:'fun', B2:'subject',
    C1:'accepted', C2:'modest', C3:'global', C4:'skipping', C5:'triumph',
    D1:'working', D2:'than', D3:'expected', D4:'meet', D5:'having', D6:'had',
    E1:'fixed', E2:'damaged', E3:'torn', E4:'replaced', E5:'leak',
    F:{ 1:'c', 2:'e', 3:'a', 4:'a', 5:'d', 6:'b' },
    G1:'T', G2:'F', G3:'F', G4:'F', G5:'T',
    H1:'are repaired', H2:'reduce', H3:'is caused', H4:'limiting',
    I1:'were shopping', I2:'bought', I3:'got', I4:'caught', I5:'was programming',
    J1:'had left', J2:'adjusting', J3:'broken', J4:'study', J5:'asking', J6:'to listen',
    K1:'Do', K2:'to be', K3:'what', K4:'if',
  },
};



// Submission simulada para Intermedio II (I2 · Interchange 3 · Test 1 B)
const SUBMISSION_DEMO_I2_T1_B = {
  estudiante:'Gabriela Soto Castro',
  codigo:'AN-2024-0430',
  cedula:'1-1815-0671',
  grupo:'I2-LM-0625',
  nivel:'I2',
  examen:'I2_WRITTEN_L18_TEST1_B',
  opcion:'B',
  enviado:'reposición · simulado',
  tiempo:'45 min',
  estado:'pendiente',
  respuestas:{
    A1:'brother', A2:'hotel',
    B1:'helps', B2:'situation',
    C1:'owes', C2:'stingy', C3:'unemployment', C4:'freezing', C5:'dilemma',
    D1:'hearing', D2:'than', D3:'to get', D4:'drive', D5:'taking', D6:'had',
    E1:'OK', E2:'to water', E3:'that', E4:'could',
    F:{ 1:'c', 2:'a', 3:'f', 4:'e', 5:'b', 6:'d' },
    G1:'T', G2:'T', G3:'F', G4:'F', G5:'T',
    H1:'are endangered', H2:'to help', H3:'is depleted', H4:'recycling',
    I1:'remembered', I2:"hadn't gotten", I3:'went', I4:'was buying', I5:'got',
    J1:'had gotten', J2:'replaced', J3:'torn', J4:'study', J5:'listening', J6:'to write',
    K1:'fixed', K2:'chip', K3:'torn', K4:'scratch', K5:'cleaning',
  },
};

// Submission simulada para el examen Test 2 (Units 9–16).
const SUBMISSION_DEMO_T2 = {
  estudiante:'Diego Salas Mora',
  codigo:'AN-2024-0421',
  cedula:'1-1802-0733',
  grupo:'I2-LM-0625',
  nivel:'I2',
  examen:'I2_WRITTEN_L32_TEST2_A',
  opcion:'A',
  enviado:'13 jun 2026 · 19:05',
  tiempo:'44 min',
  estado:'pendiente',
  respuestas:{
    A1:'eating', A2:'group',
    B1:'meet', B2:'wednesday',
    C1:'assoon', C2:'since', C3:'during', C4:'ago', C5:'until', C6:'in',
    D1:'sophisticated', D2:'putup', D3:'rigid', D4:'excuse', D5:'election',
    E1:'to leave', E2:'volunteering', E3:'painted', E4:'to talk', E5:'make',
    F:{ 1:'d', 2:'e', 3:'a', 4:'c', 5:'c' },
    G1:'aren\u2019t', G2:'arrive', G3:'learned', G4:'picked', G5:'which',
    H1:'accomplished', H2:'traveled', H3:'been', H4:'willget', H5:'llstart', H6:'havebought',
    I1:'would', I2:'must', I3:'could', I4:'shouldnt',
    J1:'F', J2:'F', J3:'F', J4:'T', J5:'T', J6:'T',
    K1:'to be built', K2:'be produced', K3:'undertaken', K4:'to be trained',
  },
};

// Submission simulada para Intermedio II (I2 · Interchange 3 · Test 2 B)
const SUBMISSION_DEMO_I2_T2_B = {
  estudiante:'Allison Vega Rojas',
  codigo:'AN-2024-0390',
  cedula:'1-1798-0624',
  grupo:'I2-LM-0625',
  nivel:'I2',
  examen:'I2_WRITTEN_L32_TEST2_B',
  opcion:'B',
  enviado:'reposición · simulado',
  tiempo:'46 min',
  estado:'pendiente',
  respuestas:{
    A1:'accountant', A2:'club',
    B1:'depressed', B2:'ask',
    C1:'since', C2:'for', C3:'bythetime', C4:'for', C5:'until', C6:'in',
    D1:'getting', D2:'hiring', D3:'delivered', D4:'to read', D5:'walked',
    E1:'pragmatic', E2:'getalong', E3:'insensitive', E4:'demand', E5:'achievement',
    F:{ 1:'e', 2:'a', 3:'d', 4:'c', 5:'b' },
    G1:'wasn’t', G2:'to climb', G3:'traveled', G4:'done', G5:'who',
    H1:'managed', H2:'found', H3:'been', H4:'willmove', H5:'llneed', H6:'havehad',
    I1:'shouldhave', I2:'musthave', I3:'mayhave', I4:'wouldnthave',
    J1:'T', J2:'T', J3:'F', J4:'T', J5:'F', J6:'F',
    K1:'be forced', K2:'to be required', K3:'be fined', K4:'be reduced',
  },
};


// ── Submissions simuladas para Intermedio I (I1 · Interchange 2) ──────────
const SUBMISSION_DEMO_I1_T1 = {
  estudiante:'Valeria Jiménez Soto',
  codigo:'AN-2024-0512',
  cedula:'1-1855-0921',
  grupo:'I1-KJ-0625',
  nivel:'I1',
  examen:'I1_WRITTEN_L18_TEST1_A',
  opcion:'A',
  enviado:'13 jun 2026 · 17:58',
  tiempo:'39 min',
  estado:'pendiente',
  respuestas:{
    A1:'teacher', A2:'talk',
    B1:'food', B2:'cook',
    C1:'would', C2:'have', C3:'should', C4:'could', C5:'youd',
    D:{ 1:'c', 2:'d', 3:'e', 4:'f', 5:'a', 6:'b' },
    E1:'notime', E2:'nothing', E3:'thanks', E4:'dont', E5:'mean',
    F1:'enough', F2:'too', F3:'as', F4:'fewer', F5:'more',
    G1:'lanes', G2:'takeoff', G3:'modern', G4:'carryon', G5:'download', G6:'turndown',
    H1:'have you ever tried', H2:"haven't had", H3:'did you drink', H4:'maked', H5:'got',
    I1:'F', I2:'T', I3:'F', I4:'T',
    J1:'todownload', J2:'yousend', J3:'could', J4:'toprepare', J5:'after',
    K1:'were', K2:'out', K3:'use', K4:'when', K5:'opening',
  },
};

const SUBMISSION_DEMO_I1_T2 = {
  estudiante:'Andrés Mora Vargas',
  codigo:'AN-2024-0518',
  cedula:'1-1860-0344',
  grupo:'I1-KJ-0625',
  nivel:'I1',
  examen:'I1_WRITTEN_L32_TEST2_A',
  opcion:'A',
  enviado:'14 jun 2026 · 18:20',
  tiempo:'43 min',
  estado:'pendiente',
  respuestas:{
    A1:'working', A2:'actor',
    B1:'give', B2:'refuse',
    C1:'walking', C2:'doi', C3:'must', C4:'arentallowed', C5:'shouldhave',
    D:{ 1:'e', 2:'d', 3:'f', 4:'c', 5:'a', 6:'b' },
    E1:'job', E2:'dontmind', E3:'dunno', E4:'goodbye', E5:'video', E6:'shower', E7:'wouldnt',
    F1:'borrow', F2:'tell', F3:'reliable', F4:'luckily', F5:'outstanding',
    G1:'had', G2:'driving', G3:'heard', G4:'have been working', G5:"'m thinking", G6:"won't need",
    H1:'F', H2:'T', H3:'F', H4:'T', H5:'F',
    I1:'were', I2:'died', I3:'because', I4:'playing', I5:'which', I6:'interesting', I7:'to meet',
    J1:'The telephone was invented by Edison.', J2:'Sushi is eaten in Japan.', J3:'Romeo and Juliet was written by William Shakespeare.', J4:'The hospital was destroyed by a fire.', J5:'These stories are written for a newspaper.',
  },
};


// Submission simulada para Intermedio I (I1 · Interchange 2 · Test 1 B)
const SUBMISSION_DEMO_I1_T1_B = {
  estudiante:'Camila Rojas Méndez',
  codigo:'AN-2024-0522',
  cedula:'1-1871-0980',
  grupo:'I1-KJ-0625',
  nivel:'I1',
  examen:'I1_WRITTEN_L18_TEST1_B',
  opcion:'B',
  enviado:'reposición · simulado',
  tiempo:'42 min',
  estado:'pendiente',
  respuestas:{
    A1:'quieter', A2:'talk',
    B1:'whofood', B2:'cook',
    C1:'space', C2:'putaway', C3:'rundown', C4:'sandals', C5:'drive', C6:'hangup',
    D1:'Have you ever owned', D2:'had', D3:'have never had', D4:'keep', D5:'gave',
    E1:'sorry', E2:'trip', E3:'right', E4:'noon', E5:'looking',
    F1:'too', F2:'enough', F3:'as', F4:'fewer', F5:'less',
    G1:'wed', G2:'should', G3:'could', G4:'have', G5:'would',
    H1:'topark', H2:'temperatureis', H3:'lived', H4:'getting', H5:'when',
    I1:'Were', I2:'out', I3:'used', I4:'when', I5:'cleaning',
    J:{ 1:'d', 2:'e', 3:'a', 4:'c', 5:'f', 6:'b' },
    K1:'F', K2:'F', K3:'T', K4:'T',
  },
};


// Submission simulada para Intermedio I (I1 · Interchange 2 · Test 2 B)
const SUBMISSION_DEMO_I1_T2_B = {
  estudiante:'Sebastián Arias Brenes',
  codigo:'AN-2024-0529',
  cedula:'1-1883-0472',
  grupo:'I1-KJ-0625',
  nivel:'I1',
  examen:'I1_WRITTEN_L32_TEST2_B',
  opcion:'B',
  enviado:'reposición · simulado',
  tiempo:'45 min',
  estado:'pendiente',
  respuestas:{
    A1:'writing', A2:'actress',
    B1:'wouldntchange', B2:'notgoout',
    C1:'fishing', C2:'doi', C3:'must', C4:'cant', C5:'shouldhave',
    D:{ 1:'d', 2:'e', 3:'a', 4:'f', 5:'c', 6:'b' },
    E1:'watching', E2:'not', E3:'apologize', E4:'no', E5:'pollution', E6:'acting', E7:'answered',
    F1:'deny', F2:'made', F3:'levelheaded', F4:'suddenly', F5:'dumb',
    G1:'rented', G2:'being', G3:'was staying', G4:'have been living', G5:"I'm thinking", G6:'find',
    H1:'The music for Star Wars was composed by John Williams.', H2:'Chinese food is served in this restaurant.', H3:'Lady Gaga concerts were attended by many music fans last year.', H4:'A lot of computer paper was used by Sonia.', H5:'Is rice grown in Korea?',
    I1:'T', I2:'T', I3:'F', I4:'F', I5:'F',
    J1:'will', J2:'asked', J3:'because', J4:'riding', J5:'that', J6:'disgusting', J7:'to take',
  },
};








// Submission simulada para Básico II (B2 · Interchange 1 · Test 2 B)
const SUBMISSION_DEMO_B2_T2_B = {
  estudiante:'Nicolás Vargas León',
  codigo:'AN-2024-0618',
  cedula:'1-1942-0715',
  grupo:'B2-KJ-0625',
  nivel:'B2',
  examen:'B2_WRITTEN_L32_TEST2_B',
  opcion:'B',
  enviado:'reposición · simulado',
  tiempo:'41 min',
  estado:'pendiente',
  respuestas:{
    A1:'looking', A2:'beard',
    B1:'stopped', B2:'paint',
    C1:'may', C2:'id', C3:'would', C4:'could', C5:'ill',
    D:{ 1:'f', 2:'c', 3:'d', 4:'e', 5:'b', 6:'a' },
    E1:'yet', E2:'and', E3:'really', E4:'but', E5:'too',
    F1:'T', F2:'F', F3:'T', F4:'F', F5:'F',
    G1:'largest', G2:'How', G3:'climb', G4:'longer', G5:'visit',
    H1:'dark', H2:'not', H3:'tea', H4:'movie', H5:'so', H6:'hairstyle',
    I1:'Have you ever tried', I2:'have eaten', I3:'ordered', I4:'did you think', I5:'have had',
    J1:'height', J2:'bottle', J3:'rode', J4:'rock', J5:'dyed',
    K1:'It’s important to exercise regularly.', K2:'Please tell George to come early.', K3:'I’ve lived in Japan for a long time.', K4:'Joe is the man with the beard.',
  },
};

// Submission simulada para Básico II (B2 · Interchange 1 · Test 1 A)
const SUBMISSION_DEMO_B2_T1 = {
  estudiante:'Camila Rojas Pérez',
  codigo:'AN-2024-0601',
  cedula:'1-1902-0244',
  grupo:'B2-LM-0625',
  nivel:'B2',
  examen:'B2_WRITTEN_L18_TEST1_A',
  opcion:'A',
  enviado:'15 jun 2026 · 18:15',
  tiempo:'37 min',
  estado:'pendiente',
  respuestas:{
    A1:'gym', A2:'jogging',
    B1:'acapulco', B2:'surfing',
    C1:'am', C2:'do', C3:'Are', C4:'does',
    D1:'many', D2:'much', D3:'a little', D4:'no one', D5:'nearly all',
    E1:'T', E2:'F', E3:'F', E4:'F',
    F1:"doesn't have", F2:'works', F3:'is designing', F4:"don't come", F5:'are getting', F6:'is eating',
    G1:'flight', G2:'uncle', G3:'had', G4:'reality', G5:'weight',
    H1:'did do', H2:'Were', H3:'was', H4:'went', H5:'Did have', H6:'did',
    I:{ 1:'c', 2:'e', 3:'f', 4:'d', 5:'b', 6:'a' },
    J1:'goldones', J2:'on', J3:'nicerthan', J4:'often', J5:'love', J6:'theres',
    K1:'Was your new computer very expensive?', K2:'I hardly ever shop in department stores.', K3:'My jacket is warmer than that one.', K4:'How good are you at volleyball?',
  },
};





// Submission simulada para Básico II (B2 · Interchange 1 · Test 1 B)
const SUBMISSION_DEMO_B2_T1_B = {
  estudiante:'Mariana Solís Núñez',
  codigo:'AN-2024-0613',
  cedula:'1-1938-0275',
  grupo:'B2-LM-0625',
  nivel:'B2',
  examen:'B2_WRITTEN_L18_TEST1_B',
  opcion:'B',
  enviado:'reposición · simulado',
  tiempo:'38 min',
  estado:'pendiente',
  respuestas:{
    A1:'night', A2:'work',
    B1:'movie', B2:'hungry',
    C1:'is', C2:'do', C3:"aren’t", C4:'does',
    D1:'much', D2:'many', D3:'nearly all', D4:'a few', D5:'a little',
    E1:'F', E2:'T', E3:'T', E4:'F',
    F1:'am studying', F2:'have', F3:'works', F4:'are not working', F5:'live', F6:'are taking',
    G1:'receptionist', G2:'cousin', G3:'took', G4:'pop', G5:'yoga',
    H1:'Were', H2:'was', H3:'called', H4:"didn’t answer", H5:'did call', H6:'wanted',
    I:{ 1:'c', 2:'d', 3:'e', 4:'b', 5:'a', 6:'f' },
    J1:'smallone', J2:'at', J3:'cheaperthan', J4:'good', J5:'would', J6:'theres',
    K1:'Was Marcos in Peru last week?', K2:'Lynn almost never goes away on vacation.', K3:'This sweater is cheaper than that one.', K4:'How often do you go to the grocery store?',
  },
};


// Submission simulada para Básico II (B2 · Interchange 1 · Test 2 A)
const SUBMISSION_DEMO_B2_T2 = {
  estudiante:'Sebastián Castro Vega',
  codigo:'AN-2024-0608',
  cedula:'1-1910-0812',
  grupo:'B2-LM-0625',
  nivel:'B2',
  examen:'B2_WRITTEN_L32_TEST2_A',
  opcion:'A',
  enviado:'15 jun 2026 · 19:02',
  tiempo:'40 min',
  estado:'pendiente',
  respuestas:{
    A1:'works', A2:'school',
    B1:'job', B2:'ownapt',
    C1:'may', C2:'ill', C3:'would', C4:'could', C5:'id',
    D:{ 1:'d', 2:'e', 3:'a', 4:'b', 5:'f', 6:'c' },
    E1:'but', E2:'really', E3:'already', E4:'too', E5:'though',
    F1:'F', F2:'T', F3:'F', F4:'T', F5:'F',
    G1:'largest', G2:'far', G3:'visit', G4:'more', G5:'take',
    H1:'tall', H2:'so', H3:'why', H4:'work', H5:'neither', H6:'glasses',
    I1:'Have you ever visited', I2:"haven’t", I3:'went', I4:'Did you like', I5:'has taken',
    J1:'dark', J2:'toothpaste', J3:'drove', J4:'barbecue', J5:'beard',
    K1:'It’s a good idea to take vitamins.', K2:'Please ask Jim to call me.', K3:'I haven’t seen Diane for two years.', K4:'Barbara is the woman talking on the phone.',
  },
};



// Submission simulada para Básico I (B1 · Interchange Intro · Test 1 A)
const SUBMISSION_DEMO_B1_T1 = {
  estudiante:'Sofía Méndez Araya',
  codigo:'AN-2024-0701',
  cedula:'1-1922-0660',
  grupo:'B1-SA-0625',
  nivel:'B1',
  examen:'B1_WRITTEN_L18_TEST1_A',
  opcion:'A',
  enviado:'15 jun 2026 · 19:45',
  tiempo:'35 min',
  estado:'pendiente',
  respuestas:{
    A1:'luisa', A2:'italian',
    B1:'microwave', B2:'view',
    C1:'Are', C2:'am', C3:'Is', C4:'are', C5:'is', C6:'is',
    D1:'my', D2:'your', D3:'her', D4:'our', D5:'their', D6:"Mary's",
    E1:'goodlooking', E2:'cashier', E3:'boring', E4:'daughter', E5:'on',
    F1:'where is', F2:'there', F3:"It's", F4:'these', F5:'they', F6:'Your',
    G1:'and', G2:'so', G3:'but',
    H1:'How are you?', H2:'How old are you?', H3:'What do you do?', H4:'Where do you work?',
    I1:'goodnight', I2:'nice', I3:'pen', I4:'evening', I5:'hat',
    J1:'are watching', J2:'is raining', J3:"aren’t having", J4:'is doing', J5:'Are wearing', J6:'is not working',
    K1:'live', K2:'Do have', K3:"don’t", K4:'Does work', K5:'does do',
  },
};


const SUBMISSION_DEMO_B1_T2 = {
  estudiante:'Samuel Mora Castro',
  codigo:'AN-2024-0479',
  cedula:'1-0923-5510',
  grupo:'B1-KJ-0625',
  nivel:'B1',
  opcion:'A',
  examen:'B1_WRITTEN_L32_TEST2_A',
  enviado:'hoy 11:50 a.m.',
  tiempo:'33 min',
  estado:'pendiente',
  respuestas:{
    A1:'breakfast', A2:'parents', B1:'newyork', B2:'cameback',
    C1:'Are going to', C2:'am going to', C3:'are going to', C4:'are going to', C5:'are going to',
    D1:'was', D2:"didn't work", D3:'watched', D4:'visited', D5:'invited', D6:'ate', D7:'had',
    E1:'need', E2:'olivia', E3:'sports', E4:'sometimes', E5:'la', E6:'love',
    F1:'would', F2:'idlove', F3:'areyougoing', F4:'me', F5:'us', F6:'want',
    G1:"don't feel", G2:'have', G3:'open', G4:'Take', G5:'Drink', G6:"don't go",
    H1:'Do you ever have soup for breakfast?', H2:'Do we have any chicken?', H3:'Where were you born?', H4:'How old were you in 2000?', H5:'What are you going to do tomorrow?', H6:'Did you go anywhere this weekend?', H7:'Can Maria play the piano?',
    I1:'fruit', I2:'violin', I3:'elementary', I4:'at', I5:'department',
    J:{ 1:'a', 2:'b', 3:'c', 4:'d' },
  }
};



// Submission simulada para Básico I (B1 · Interchange Intro · Test 1 B)
const SUBMISSION_DEMO_B1_T1_B = {
  estudiante:'Daniela Vargas León',
  codigo:'AN-2024-0712',
  cedula:'1-1930-0521',
  grupo:'B1-SA-0625',
  nivel:'B1',
  examen:'B1_WRITTEN_L18_TEST1_B',
  opcion:'B',
  enviado:'reposición · simulado',
  tiempo:'36 min',
  estado:'pendiente',
  respuestas:{
    A1:'celia', A2:'canada',
    B1:'kitchen', B2:'nicekitchen',
    C1:'Are', C2:'am', C3:'is', C4:'are', C5:'Is', C6:'is',
    D1:'my', D2:'his', D3:'her', D4:'our', D5:'their', D6:"John's",
    E1:'serious', E2:'pilot', E3:'exciting', E4:'mother', E5:'in',
    F1:'where are', F2:'there', F3:"They're", F4:'this', F5:'it', F6:'Your',
    G1:'and', G2:'so', G3:'but',
    H1:'How are you?', H2:'Where are you from?', H3:'What do you do?', H4:'Where do you work?',
    I1:'bye', I2:'classmate', I3:'chair', I4:'seven', I5:'bed',
    J1:'am having', J2:'is not wearing', J3:'are taking', J4:'are playing', J5:'is doing', J6:'is not snowing',
    K1:'live', K2:'Do have', K3:"doesn't", K4:'Do cook', K5:'do do',
  },
};



// Submission simulada para Básico I (B1 · Interchange Intro · Test 2 B)
const SUBMISSION_DEMO_B1_T2_B = {
  estudiante:'Luis Diego Campos',
  codigo:'AN-2024-0718',
  cedula:'1-1950-0488',
  grupo:'B1-SA-0625',
  nivel:'B1',
  examen:'B1_WRITTEN_L32_TEST2_B',
  opcion:'B',
  enviado:'reposición · simulado',
  tiempo:'34 min',
  estado:'pendiente',
  respuestas:{
    A1:'playwell', A2:'saturday',
    B1:'la', B2:'college',
    C1:'are going to', C2:'am going to', C3:'are going to', C4:'is going to', C5:'Are going to',
    D1:'pasta', D2:'play', D3:'high', D4:'on', D5:'stamps',
    E1:'bread', E2:'thanks', E3:'beach', E4:'sometimes', E5:'beijing', E6:'draw',
    F1:'like', F2:'her', F3:'areyougoing', F4:'me', F5:'me', F6:'want',
    G1:'feel', G2:'have', G3:'Take', G4:'Get', G5:"don't stay up", G6:'Call',
    H1:'Do you usually have breakfast?', H2:'Do we need any milk?', H3:'Were you at this school last year?', H4:'Where did you grow up?', H5:'What time is the party going to start?', H6:'Did you get up early today?', H7:'Can you ride a horse very well?',
    I:{ 1:'a', 2:'b', 3:'c', 4:'d' },
    J1:'was', J2:'worked', J3:'exercised', J4:'went', J5:"didn't watch", J6:'felt', J7:'listened',
  },
};

Object.assign(window, {
  NIVEL_TEMA, CATALOGO, EXAM_I2_T1_A, EXAM_I2_T1_B, EXAM_I2_T2_A, EXAM_I2_T2_B, EXAM_I1_T1_A, EXAM_I1_T1_B, EXAM_I1_T2_A, EXAM_I1_T2_B, EXAM_B2_T1_A, EXAM_B2_T1_B, EXAM_B2_T2_A, EXAM_B2_T2_B, EXAM_B1_T1_A, EXAM_B1_T2_A, EXAM_B1_T1_B, EXAM_B1_T2_B, EXAMS,
  SUBMISSION_DEMO, SUBMISSION_DEMO_I2_T1_B, SUBMISSION_DEMO_T2, SUBMISSION_DEMO_I2_T2_B, SUBMISSION_DEMO_I1_T1, SUBMISSION_DEMO_I1_T1_B, SUBMISSION_DEMO_I1_T2, SUBMISSION_DEMO_I1_T2_B, SUBMISSION_DEMO_B2_T1, SUBMISSION_DEMO_B2_T1_B, SUBMISSION_DEMO_B2_T2, SUBMISSION_DEMO_B2_T2_B, SUBMISSION_DEMO_B1_T1, SUBMISSION_DEMO_B1_T2, SUBMISSION_DEMO_B1_T1_B, SUBMISSION_DEMO_B1_T2_B, VIDEO_MAP,
  PONDERACION_MODELO, ponderacionTexto,
});

// ── Modelo oficial de ponderación por plan (CON INA / SIN INA) ────────────
// Referencia para administración. La ponderación define cuánto pesa cada
// evaluación dentro del nivel; el plan del estudiante decide la columna.
function PONDERACION_MODELO() {
  return [
    { item:'Lección 9 · Oral',                con_ina:15, sin_ina:15 },
    { item:'Lección 17 · Oral',               con_ina:15, sin_ina:15 },
    { item:'Lección 18 · Escrito (Prueba 1)', con_ina:5,  sin_ina:15 },
    { item:'Lección 25 · Oral',               con_ina:15, sin_ina:15 },
    { item:'Lección 31 · Oral',               con_ina:15, sin_ina:15 },
    { item:'Lección 32 · Escrito (Prueba 2)', con_ina:5,  sin_ina:15 },
    { item:'Social Skill · Participación L1–32', con_ina:10, sin_ina:10 },
    { item:'Club I CAN · Asistencia L1–16',   con_ina:20, sin_ina:0 },
  ];
}

// Texto de ponderación según plan: 'ambos' | 'con_ina' | 'sin_ina'
function ponderacionTexto(pp, plan) {
  if (!pp) return '';
  if (plan === 'con_ina') return `Valor del examen: ${pp.con_ina}% de la nota final (CON INA)`;
  if (plan === 'sin_ina') return `Valor del examen: ${pp.sin_ina}% de la nota final (SIN INA)`;
  return `Valor según plan académico: ${pp.con_ina}% CON INA / ${pp.sin_ina}% SIN INA`;
}


// ===== examenes_render.jsx =====

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


// ===== examenes_modes.jsx =====

// CAMPUS_F95_0_20260621_BUNDLE_UNICO_BANDEJA_DOCENTE_ESCALABLE
// CALGRUPO_F51_20260617_INDICE_MAESTRO_CAMPUS_UI
// CALGRUPO_F50_20260617_CIERRE_TECNICO_EXAMENES_UI
// CALGRUPO_F49_20260617_CHECKLIST_QA_FINAL_EXAMENES_UI
// CALGRUPO_F48_20260617_CENTRO_DIAGNOSTICO_EXAMENES_UI
// CALGRUPO_F47_20260617_SENALES_ANTIFRAUDE_EXAMENES_UI
/* global React, NIVEL_TEMA, CATALOGO, EXAM_I2_T1_A, SUBMISSION_DEMO,
   ExamShell, examQuestions, evalQuestion, getMatchVal */
// ──────────────────────────────────────────────────────────────────────────
// examenes_modes.jsx — Estudiante / Profesor / Administrador + barra de
// CALGRUPO_F44_20260617_REVISION_OFICIAL_EXAMENES_MIS_NOTAS_UI
// CALGRUPO_F45_20260617_BANDEJA_REVISION_DOCENTE_ADMIN_UI
// CALGRUPO_F46_20260617_BITACORA_VISUAL_EXAMENES_UI
// control (auditoría). Maqueta interactiva, sin backend, sin guardar notas.
// ──────────────────────────────────────────────────────────────────────────
const { useState, useMemo, useCallback, useEffect } = React;

// Valor compacto del examen según plan (para la grilla).
function planValor(pp, plan) {
  if (!pp) return '—';
  if (plan === 'con_ina') return `${pp.con_ina}% (CON INA)`;
  if (plan === 'sin_ina') return `${pp.sin_ina}% (SIN INA)`;
  return `${pp.con_ina}% / ${pp.sin_ina}%`;
}

// El examen real, re-pintado según el nivel seleccionado para tema (auditoría).
function themedExam(nivel) {
  if (nivel === 'I2') return EXAM_I2_T1_A;
  // Auditar el color en otro nivel: mismo contenido, distinto tema (solo demo).
  return Object.assign({}, EXAM_I2_T1_A, { nivel });
}

// ════════════════════════════════════════════════════════════════════════
// MODAL guion de audio (solo profesor/admin/preview)
// ════════════════════════════════════════════════════════════════════════
function ScriptModal({ section, exam, onClose }) {
  if (!section) return null;
  const lines = exam.audioScript[section] || [];
  return (
    <div className="exov" onClick={onClose}>
      <div className="exov-card" onClick={e=>e.stopPropagation()}>
        <div className="exov-h">
          <h3>Guion de audio · Sección {section}</h3>
          <span className="exov-tag">solo docente</span>
          <button className="exov-x" onClick={onClose}>✕</button>
        </div>
        <div className="exov-body">
          {lines.map(([who, t], i) => (
            <p key={i} className="exov-line">{who && <b>{who}:</b>} {t}</p>
          ))}
        </div>
        <div className="exov-foot">El guion nunca es visible para el estudiante durante el examen oficial.</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ESTUDIANTE
// ════════════════════════════════════════════════════════════════════════
// Resuelve el examen real asignado (o null si no hay contenido).
function examIdDe(nivel, test, opcion) {
  const lec = test === 'TEST1' ? 'L18' : 'L32';
  return `${nivel}_WRITTEN_${lec}_${test}_${opcion}`;
}
function getExam(nivel, test, opcion) {
  return (window.EXAMS || {})[examIdDe(nivel, test, opcion)] || null;
}

// CALGRUPO_F43_20260617_EXAMENES_ESTUDIANTE_QA_AUTOSAVE_TIMER
function examParseLocalMs(v) {
  const s = String(v || '').trim();
  if (!s) return 0;
  const m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] || 0)).getTime();
  const t = Date.parse(s);
  return Number.isFinite(t) ? t : 0;
}
function examFormatClock(sec) {
  const n = Math.max(0, Number(sec) || 0);
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = n % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// CALGRUPO_F27_20260617_STUDENTMODE_INTENTO_REAL_BACKEND
function StudentMode({ shell, density, nivel='I2', test='TEST1', opcion, plan, examOverride, assignment, backend }) {
  // El sistema YA decidió qué examen le toca (no lo escoge). En F27 se
  // prefiere el payload público recibido desde Apps Script; si no existe,
  // se usa el banco local solo como respaldo visual controlado.
  const exam = examOverride || getExam(nivel, test, opcion);
  const tema = NIVEL_TEMA[nivel] || NIVEL_TEMA['I2'];
  const [stage, setStage] = useState((backend && backend.attemptId) ? 'taking' : 'lobby'); // lobby | taking | sent
  const [answers, setAnswers] = useState(backend && backend.initialAnswers ? backend.initialAnswers : {});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [dirty, setDirty] = useState(false);

  const timeLimitMin = Number((backend && backend.timeLimitMin) || (assignment && assignment.TIME_LIMIT_MIN) || 0) || 0;
  const limitSec = timeLimitMin > 0 ? timeLimitMin * 60 : 0;
  const startedAtText = (backend && backend.startedAt) || '';
  const startMs = useMemo(() => examParseLocalMs(startedAtText) || Date.now(), [startedAtText, backend && backend.attemptId]);
  const elapsedNow = useCallback(() => Math.max(0, Math.floor((Date.now() - startMs) / 1000)), [startMs]);
  const [timeLeftSec, setTimeLeftSec] = useState(() => limitSec ? Math.max(0, limitSec - elapsedNow()) : null);

  const answersRef = React.useRef(answers);
  const dirtyRef = React.useRef(false);
  const savingRef = React.useRef(false);
  const sendingRef = React.useRef(false);
  const lastSavedJsonRef = React.useRef(JSON.stringify(answers || {}));
  const autoSubmitRef = React.useRef(false);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { savingRef.current = saving; }, [saving]);
  useEffect(() => { sendingRef.current = sending; }, [sending]);

  const onAnswer = useCallback((id, v) => {
    setAnswers(a => {
      const next = Object.assign({}, a, { [id]: v });
      answersRef.current = next;
      return next;
    });
    dirtyRef.current = true;
    setDirty(true);
  }, []);

  useEffect(() => {
    if (backend && backend.attemptId && stage === 'lobby') setStage('taking');
  }, [backend && backend.attemptId]);

  useEffect(() => {
    if (stage !== 'taking' || !limitSec) return;
    setTimeLeftSec(Math.max(0, limitSec - elapsedNow()));
  }, [stage, limitSec, startMs]);

  const doSave = useCallback(async (source='manual') => {
    if (!(backend && typeof backend.onSave === 'function') || !(backend && backend.attemptId)) return null;
    if (savingRef.current || sendingRef.current) return null;
    const snapshot = JSON.stringify(answersRef.current || {});
    if (source === 'auto' && (!dirtyRef.current || snapshot === lastSavedJsonRef.current)) return { ok:true, skipped:true };
    setSaving(true);
    setSaveMsg(source === 'auto' ? 'Guardando automáticamente…' : 'Guardando…');
    try {
      const r = await backend.onSave(answersRef.current || {}, { source });
      if (r && r.ok && r.saved !== false && !r.deferred) {
        lastSavedJsonRef.current = snapshot;
        dirtyRef.current = false;
        setDirty(false);
        setSaveMsg(source === 'auto' ? 'Guardado automático correcto.' : 'Avance guardado correctamente.');
      } else if (r && r.ok && (r.deferred || r.saved === false)) {
        // El servidor estaba atendiendo otros estudiantes. Conservamos el
        // indicador de cambios pendientes y el próximo ciclo volverá a intentar.
        dirtyRef.current = true;
        setDirty(true);
        setSaveMsg(r.mensaje || 'Autoguardado pospuesto; se intentará nuevamente.');
      } else {
        setSaveMsg((r && (r.mensaje || r.error)) || 'No se pudo guardar.');
      }
      return r;
    } catch (e) {
      setSaveMsg('No se pudo guardar. Revise la conexión.');
      return { ok:false, error:'save_exception' };
    } finally {
      setSaving(false);
    }
  }, [backend && backend.attemptId, backend && backend.onSave]);

  const doSubmit = useCallback(async (auto=false) => {
    if (sendingRef.current) return null;
    if (backend && typeof backend.onSubmit === 'function') {
      setSending(true);
      setSaveMsg(auto ? 'Tiempo agotado. Enviando automáticamente…' : 'Enviando…');
      try {
        const elapsed = limitSec ? Math.min(limitSec, elapsedNow()) : elapsedNow();
        const r = await backend.onSubmit(answersRef.current || {}, { autoSubmit:auto, timeSpentSec:elapsed });
        if (!r || r.ok === false) {
          setSaveMsg((r && (r.mensaje || r.error)) || 'No se pudo enviar el examen.');
          autoSubmitRef.current = false;
          return r;
        }
        dirtyRef.current = false;
        setDirty(false);
        setStage('sent');
        return r;
      } catch (e) {
        setSaveMsg('No se pudo enviar. Revise la conexión.');
        autoSubmitRef.current = false;
        return { ok:false, error:'submit_exception' };
      } finally {
        setSending(false);
      }
    }
    setStage('sent');
    return { ok:true };
  }, [backend && backend.attemptId, backend && backend.onSubmit, limitSec, elapsedNow]);

  useEffect(() => {
    if (stage !== 'taking') return;
    const handler = (e) => {
      if (dirtyRef.current && !sendingRef.current) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
      return undefined;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'taking' || !(backend && backend.attemptId)) return;
    let cancelled = false;
    let timer = null;
    const schedule = () => {
      // F95.0: dispersa los autoguardados entre estudiantes para evitar que
      // todos escriban en la hoja durante el mismo segundo.
      const delay = 28000 + Math.floor(Math.random() * 9000);
      timer = window.setTimeout(async () => {
        if (cancelled) return;
        await doSave('auto');
        if (!cancelled) schedule();
      }, delay);
    };
    schedule();
    return () => { cancelled = true; if (timer) window.clearTimeout(timer); };
  }, [stage, backend && backend.attemptId, doSave]);

  useEffect(() => {
    if (stage !== 'taking' || !limitSec) return;
    const tick = () => {
      const left = Math.max(0, limitSec - elapsedNow());
      setTimeLeftSec(left);
      if (left <= 0 && !autoSubmitRef.current) {
        autoSubmitRef.current = true;
        doSubmit(true);
      }
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [stage, limitSec, elapsedNow, doSubmit]);

  useEffect(() => {
    if (stage !== 'taking' || !(backend && backend.attemptId) || !(backend && typeof backend.onHeartbeat === 'function')) return;
    let cancelled = false;
    const beat = async () => {
      if (sendingRef.current) return;
      try {
        const r = await backend.onHeartbeat();
        if (cancelled) return;
        if (!r || r.ok === false) {
          setSaveMsg((r && (r.mensaje || r.error)) || 'No se pudo validar el estado del intento.');
          return;
        }
        if (typeof r.remaining_sec === 'number') setTimeLeftSec(Math.max(0, r.remaining_sec));
        if (String(r.status || '').toUpperCase() === 'SUBMITTED') {
          dirtyRef.current = false;
          setDirty(false);
          setStage('sent');
          return;
        }
        if (r.should_auto_submit && !autoSubmitRef.current) {
          autoSubmitRef.current = true;
          doSubmit(true);
          return;
        }
        if (r.can_submit === false) setSaveMsg(r.mensaje || 'El intento ya no está disponible para envío.');
      } catch (e) {
        if (!cancelled) setSaveMsg('No se pudo validar el intento con el servidor.');
      }
    };
    beat();
    const t = window.setInterval(beat, 45000);
    return () => { cancelled = true; window.clearInterval(t); };
  }, [stage, backend && backend.attemptId, backend && backend.onHeartbeat, doSubmit]);

  // Sin contenido real — NUNCA carga otro examen.
  if (!exam) {
    return <div className="stwrap"><PendingCard tema={tema} opcion={opcion} /></div>;
  }

  const all = examQuestions(exam);
  const answered = all.filter(({ q, kind, section }) => {
    if (kind === 'match') return getMatchVal(answers, q.n, section.letter) != null;
    return answers[q.id] != null && String(answers[q.id]).trim() !== '';
  }).length;
  const pct = Math.round((answered / Math.max(1, all.length)) * 100);
  const lowTime = limitSec && Number(timeLeftSec) <= 60;

  const handleStart = async () => {
    setSaveMsg('');
    if (backend && typeof backend.onStart === 'function') {
      setSaving(true);
      try {
        const r = await backend.onStart();
        if (!r || r.ok === false) {
          setSaveMsg((r && (r.mensaje || r.error)) || 'No se pudo iniciar el intento.');
          return;
        }
        lastSavedJsonRef.current = JSON.stringify(answersRef.current || {});
        dirtyRef.current = false;
        setDirty(false);
        autoSubmitRef.current = false;
      } finally { setSaving(false); }
    }
    setStage('taking');
  };

  const handleSave = async () => { await doSave('manual'); };

  const handleSubmit = async () => {
    if (!window.confirm('¿Enviar examen ahora? Después de enviarlo no podrás editar tus respuestas.')) return;
    await doSubmit(false);
  };

  if (stage === 'lobby') {
    return <div className="stwrap">
      <AssignmentCard exam={exam} tema={tema} opcion={opcion} plan={plan} assignment={assignment} backend={backend} onStart={handleStart} starting={saving} />
      {saveMsg && <div style={{ maxWidth:680, margin:'12px auto 0', color:'#7A1E2C', fontSize:12.5, textAlign:'center' }}>{saveMsg}</div>}
    </div>;
  }

  if (stage === 'sent') {
    return <div className="stwrap"><SentCard exam={exam} tema={tema} opcion={opcion} plan={plan} attemptId={backend && backend.attemptId} /></div>;
  }

  const metaNombre = assignment && (assignment.NOMBRE || assignment.nombre) || (backend && backend.student && backend.student.nombre) || '';
  const metaGrupo = assignment && (assignment.COD_GRUPO || assignment.grupo) || (backend && backend.student && backend.student.grupo) || '';
  const metaFecha = assignment && assignment.FECHA || new Date().toLocaleDateString('es-CR');

  return (
    <div className="stwrap">
      <div className="sttake">
        <ExamShell exam={exam} answers={answers} onAnswer={onAnswer} mode="student" showKey={false}
                   shell={shell} density={density} plan={plan}
                   meta={{ nombre: metaNombre || 'Estudiante', fecha: metaFecha, grupo: metaGrupo || 'Grupo activo', opcion, scoreLabel:`${answered} / ${all.length} resp.` }} />
      </div>
      <div className="stbar">
        <div className="stbar-prog">
          <div className="stbar-track"><div className="stbar-fill" style={{ width:pct+'%', background:tema.color }} /></div>
          <span>{answered} de {all.length} respondidas · {pct}%</span>
          {limitSec > 0 && <span style={{ marginLeft:10, color:lowTime ? '#7A1E2C' : '#001E47', fontWeight:800 }}>Tiempo: {examFormatClock(timeLeftSec == null ? limitSec : timeLeftSec)}</span>}
          {dirty && <span style={{ marginLeft:10, color:'#7A4A00' }}>Cambios sin guardar</span>}
          {saveMsg && <span style={{ marginLeft:10, color: saveMsg.includes('correct') ? '#1F6B25' : '#7A1E2C' }}>{saveMsg}</span>}
        </div>
        <div className="stbar-actions">
          <button className="btn-ghost" onClick={handleSave} disabled={saving || sending || !(backend && backend.attemptId)}>
            {saving ? 'Guardando…' : 'Guardar avance'}
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={sending || saving || !(backend && backend.attemptId)}>
            {sending ? 'Enviando…' : 'Enviar examen'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignmentCard({ exam, tema, opcion, plan, assignment, backend, onStart, starting }) {
  const cron = assignment && (assignment.CRONOGRAMA || assignment.availability) || null;
  const liveLabel = cron && cron.dia ? `${cron.dia}${cron.turno ? ' · ' + cron.turno : ''}` : 'cronograma activo';
  const intentoTxt = backend && backend.attemptId ? `Intento activo: ${backend.attemptId}` : 'Se creará un intento oficial al iniciar.';
  return (
    <div className="ascard" style={{ '--lvl':tema.color, '--lvl-soft':tema.soft, '--lvl-ink':tema.ink }}>
      <div className="ascard-top">
        <span className="ascard-lvl">{tema.code} · {tema.nombre.toUpperCase()}</span>
        <span className={`ascard-opt opt-${opcion}`}>Opción {opcion} {opcion==='B' && '· reposición'}</span>
      </div>
      <h2 className="ascard-title">{exam.titulo}</h2>
      <p className="ascard-sub">{exam.subtitulo}</p>
      <div className="ascard-pond">{window.ponderacionTexto(exam.ponderacion_por_plan, plan)}</div>
      <div className="ascard-grid">
        <div><span>Unidades</span><b>{exam.unidades}</b></div>
        <div><span>Lección</span><b>{exam.leccion} · {liveLabel}</b></div>
        <div><span>Valor</span><b>{planValor(exam.ponderacion_por_plan, plan)}</b></div>
        <div><span>Puntos</span><b>{exam.puntos_totales}</b></div>
      </div>
      <div className="ascard-note">
        Este examen fue asignado automáticamente según tu grupo y el cronograma.
        No es posible escoger otro examen ni cambiar de opción. {intentoTxt}
      </div>
      <button className="btn-primary ascard-go" onClick={onStart} disabled={!!starting}>{starting ? 'Preparando intento…' : 'Iniciar examen'}</button>
    </div>
  );
}

// Opción B (o cualquier variante sin contenido): pendiente, no inicia.
function PendingCard({ tema, opcion }) {
  return (
    <div className="ascard pendcard" style={{ '--lvl':tema.color, '--lvl-soft':tema.soft, '--lvl-ink':tema.ink }}>
      <div className="ascard-top">
        <span className="ascard-lvl">{tema.code} · {tema.nombre.toUpperCase()}</span>
        <span className={`ascard-opt opt-${opcion}`}>Opción {opcion} {opcion==='B' && '· reposición'}</span>
      </div>
      <h2 className="ascard-title">Opción {opcion} pendiente de publicar</h2>
      <p className="ascard-sub">Esta variante se usará para reposición o casos autorizados por docente/administración.</p>
      <div className="ascard-note">
        El contenido de la Opción {opcion} aún no está disponible. No carga el examen de otra opción.
        Cuando esté publicado, el sistema lo asignará automáticamente según el cronograma.
      </div>
      <button className="btn-primary ascard-go" disabled>Examen pendiente</button>
    </div>
  );
}

function SentCard({ exam, tema, opcion, plan, attemptId }) {
  return (
    <div className="ascard sentcard" style={{ '--lvl':tema.color, '--lvl-soft':tema.soft, '--lvl-ink':tema.ink }}>
      <div className="sent-check" style={{ background:tema.color }}>✓</div>
      <h2 className="ascard-title">Examen enviado</h2>
      <p className="sent-msg">Tu examen fue enviado correctamente. La nota final estará disponible cuando el docente complete la revisión.</p>
      <div className="sent-state"><span className="sent-dot" />En revisión docente</div>
      <div className="sent-grid">
        <div><span>Examen</span><b>{exam.titulo}</b></div>
        <div><span>Opción</span><b>{opcion}</b></div>
        <div><span>Valor</span><b>{planValor(exam.ponderacion_por_plan, plan)}</b></div>
        <div><span>Nota</span><b className="sent-pending">Pendiente</b></div>
        {attemptId && <div><span>Intento</span><b>{attemptId}</b></div>}
      </div>
      <div className="ascard-note">No verás respuestas correctas ni una nota automática. La nota la confirma tu profesor.</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// PROFESOR — bandeja + revisión
// ════════════════════════════════════════════════════════════════════════
const ESTADOS = {
  pendiente:   { t:'Pendiente de revisión', c:'#C67100', bg:'#FBF1D8' },
  en_revision: { t:'En revisión',           c:'#0C447C', bg:'#E2EFF8' },
  parcial:     { t:'Corregido parcial',      c:'#6B4FA0', bg:'#EEE8F7' },
  listo:       { t:'Listo para cerrar',      c:'#1F6B25', bg:'#E4F3E5' },
  cerrado:     { t:'Cerrado',                c:'#4A413A', bg:'#EAE3D5' },
};

// Bandeja con entregas simuladas. Exámenes oficiales revisables:
// las 16 entradas del catálogo (B1/B2/I1/I2 · Test 1/2 · Opción A/B).
const INBOX = [
  Object.assign({}, SUBMISSION_DEMO),
  Object.assign({}, window.SUBMISSION_DEMO_I2_T1_B),
  Object.assign({}, SUBMISSION_DEMO_T2),
  Object.assign({}, window.SUBMISSION_DEMO_I2_T2_B),
  Object.assign({}, window.SUBMISSION_DEMO_I1_T1),
  Object.assign({}, window.SUBMISSION_DEMO_I1_T1_B),
  Object.assign({}, window.SUBMISSION_DEMO_I1_T2),
  Object.assign({}, window.SUBMISSION_DEMO_I1_T2_B),
  Object.assign({}, window.SUBMISSION_DEMO_B2_T1),
  Object.assign({}, window.SUBMISSION_DEMO_B2_T1_B),
  Object.assign({}, window.SUBMISSION_DEMO_B2_T2),
  Object.assign({}, window.SUBMISSION_DEMO_B2_T2_B),
  Object.assign({}, window.SUBMISSION_DEMO_B1_T1),
  Object.assign({}, window.SUBMISSION_DEMO_B1_T2),
  Object.assign({}, window.SUBMISSION_DEMO_B1_T1_B),
  Object.assign({}, window.SUBMISSION_DEMO_B1_T2_B),
];

// CALGRUPO_F64_20260618_DOCENTE_EXAMENES_ESCRITOS_SIN_DEMO
function examTeacherSessionGroups() {
  const ses = getExamParentSession() || {};
  const raw = [];
  if (ses.grupo) raw.push(ses.grupo);
  if (ses.grupoActivo) raw.push(ses.grupoActivo);
  if (ses.cod_grupo) raw.push(ses.cod_grupo);
  if (Array.isArray(ses.grupos)) {
    ses.grupos.forEach(g => raw.push(typeof g === 'string' ? g : (g && (g.grupo || g.cod_grupo || g.codigo || g.code))));
  }
  return [...new Set(raw.map(g => String(g || '').trim()).filter(Boolean))];
}

function examTeacherGroupLabelF88(code) {
  const raw=String(code||'').trim().toUpperCase();
  const cycle=(raw.split('-').filter(Boolean).pop()||'').trim();
  const m=raw.match(/-(LM|KJ|LJ|L4|SA|SAB|L|K|M|J|V|D)(\d{2})-/) || raw.match(/-(LM|KJ|LJ|L4|SA|SAB|L|K|M|J|V|D)(\d{2})/);
  const day=({LM:'Lunes y miércoles',KJ:'Martes y jueves',LJ:'Lunes y jueves',L4:'Lunes a jueves',SA:'Sábados',SAB:'Sábados',L:'Lunes',K:'Martes',M:'Miércoles',J:'Jueves',V:'Viernes',D:'Domingos'})[m?.[1]] || 'Grupo';
  const hours=({'69':'6pm a 9pm','94':'9am a 4pm','96':'9am a 12pm'})[m?.[2]] || '';
  return `${day}${hours?' de '+hours:''}${cycle?' - '+cycle:''}`;
}

function TeacherMode({ shell, density }) {
  return <TeacherWrittenLiveInbox />;
}

function examTeacherShortGroupF940(code) {
  const raw = String(code || '').trim().toUpperCase();
  const parts = raw.split('-').filter(Boolean);
  if (!parts.length) return 'Grupo';
  return `${parts[0] || 'Grupo'} · ${parts[parts.length - 1] || ''}`;
}

function examTeacherBucketLabelF940(row) {
  const bucket = String(row && row.bucket || '').toUpperCase();
  if (bucket === 'SUBMITTED_WITHOUT_REVIEW') return 'Pendiente de revisar';
  if (bucket === 'IN_REVIEW') return 'Revisión iniciada';
  if (bucket === 'CLOSED_NOT_PUSHED') return 'Lista · falta Mis Notas';
  if (bucket === 'PUSHED') return 'En Mis Notas';
  return String(row && row.REVIEW_STATUS || 'Pendiente');
}

function examTeacherActionLabelF940(row) {
  const bucket = String(row && row.bucket || '').toUpperCase();
  if (bucket === 'IN_REVIEW') return 'Continuar revisión';
  if (bucket === 'CLOSED_NOT_PUSHED') return 'Abrir y enviar nota';
  return 'Revisar examen';
}

function examTeacherDurationF940(sec) {
  const n = Math.max(0, Number(sec) || 0);
  if (!n) return '—';
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  return h ? `${h} h ${m} min` : `${m} min`;
}

function examTeacherAdjustmentsF940(raw) {
  const parsed = parseJsonMaybe(raw) || {};
  const marks = {};
  const comments = {};
  Object.keys(parsed.marks || {}).forEach(k => {
    const n = Number(parsed.marks[k]);
    if ([0, 0.5, 1].includes(n)) marks[k] = n;
  });
  Object.keys(parsed.comments || {}).forEach(k => { comments[k] = String(parsed.comments[k] || ''); });
  return { marks, comments };
}

function TeacherWrittenBackendReviewF940({ row, onBack, onDone }) {
  const attemptId = String(row && row.ATTEMPT_ID || '').trim();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [attempt, setAttempt] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [marks, setMarks] = useState({});
  const [comments, setComments] = useState({});
  const [openComment, setOpenComment] = useState(null);
  const [internalComments, setInternalComments] = useState('');
  const [studentFeedback, setStudentFeedback] = useState('');
  const [scriptSec, setScriptSec] = useState(null);

  const hydrateReview = useCallback((rev) => {
    const adj = examTeacherAdjustmentsF940(rev && rev.MANUAL_ADJUSTMENTS_JSON);
    setMarks(adj.marks);
    setComments(adj.comments);
    setInternalComments(String(rev && rev.COMMENTS || ''));
    setStudentFeedback(String(rev && rev.STUDENT_FEEDBACK || ''));
  }, []);

  const load = useCallback(async () => {
    if (!attemptId) { setLoading(false); setErr('La entrega no tiene ATTEMPT_ID.'); return; }
    setLoading(true); setErr(''); setMsg('');
    const attRes = await postExamBackend('examGetAttempt', { attempt_id:attemptId });
    if (!attRes || attRes.ok === false || !attRes.attempt) {
      setLoading(false);
      setErr((attRes && (attRes.mensaje || attRes.error)) || 'No se pudo abrir la entrega.');
      return;
    }
    setAttempt(attRes.attempt);

    let revRes = null;
    if (row && row.REVIEW_ID) {
      revRes = await postExamBackend('examGetReview', { review_id:row.REVIEW_ID, attempt_id:attemptId });
    } else {
      const createRes = await postExamBackend('examCreateReviewDraft', { attempt_id:attemptId });
      if (!createRes || createRes.ok === false) {
        setLoading(false);
        setErr((createRes && (createRes.mensaje || createRes.error)) || 'No se pudo preparar la revisión.');
        return;
      }
      revRes = await postExamBackend('examGetReview', { review_id:createRes.review_id || (createRes.review && createRes.review.REVIEW_ID), attempt_id:attemptId });
    }
    if (!revRes || revRes.ok === false || !revRes.review) {
      setLoading(false);
      setErr((revRes && (revRes.mensaje || revRes.error)) || 'No se pudo cargar la revisión.');
      return;
    }
    setReviewData(revRes.review);
    hydrateReview(revRes.review);
    setLoading(false);
  }, [attemptId, row && row.REVIEW_ID, hydrateReview]);

  useEffect(() => { load(); }, [load]);

  const exam = attempt ? ((window.EXAMS || {})[attempt.EXAM_ID] || null) : null;
  const answers = useMemo(() => {
    if (!attempt) return {};
    return parseJsonMaybe(attempt.ANSWERS_JSON) || {};
  }, [attempt && attempt.ANSWERS_JSON]);
  const all = useMemo(() => exam ? examQuestions(exam) : [], [exam]);
  const autoRows = useMemo(() => all.map(({ section, q, kind }) => {
    const value = kind === 'match' ? getMatchVal(answers, q.n, section.letter) : answers[q.id];
    return { id:kind === 'match' ? section.letter + q.n : q.id, ev:evalQuestion(section, q, value) };
  }), [all, answers]);
  const autoCorrect = autoRows.filter(x => x.ev.verdict === 'ok').length;
  const needManual = autoRows.filter(x => x.ev.verdict === 'review').length;
  const finalPoints = autoRows.reduce((sum, x) => {
    const mark = marks[x.id];
    return sum + (mark == null ? (x.ev.verdict === 'ok' ? 1 : 0) : Number(mark));
  }, 0);
  const calculated100 = all.length ? Math.round((finalPoints / all.length) * 100) : 0;
  const status = String(reviewData && reviewData.REVIEW_STATUS || '').toUpperCase();
  const closed = status === 'CLOSED' || String(reviewData && reviewData.LOCKED || '').toUpperCase() === 'SI';
  const pushed = String(reviewData && reviewData.PUSHED_TO_NOTAS || '').toUpperCase() === 'SI';
  const displayScore = closed && reviewData && reviewData.FINAL_SCORE_100 !== '' ? Number(reviewData.FINAL_SCORE_100) : calculated100;

  const setMark = (id, value) => { if (!closed) setMarks(m => Object.assign({}, m, { [id]:value })); };
  const setComment = (id, value) => { if (!closed) setComments(c => Object.assign({}, c, { [id]:value })); };
  const reviewApi = { marks, setMark, comments, setComment, openComment, setOpenComment:(id)=>{ if (!closed) setOpenComment(id); }, locked:closed };

  const payload = () => ({
    review_id: reviewData && reviewData.REVIEW_ID,
    final_score_100: calculated100,
    comments: internalComments,
    student_feedback: studentFeedback,
    manual_adjustments: { marks, comments, source:'teacher_written_review_f95' }
  });

  const refreshReview = async () => {
    const r = await postExamBackend('examGetReview', { review_id:reviewData && reviewData.REVIEW_ID, attempt_id:attemptId });
    if (r && r.ok && r.review) { setReviewData(r.review); hydrateReview(r.review); }
    return r;
  };

  const saveDraft = async () => {
    if (!reviewData || !reviewData.REVIEW_ID) return;
    setBusy('save'); setErr(''); setMsg('');
    const r = await postExamBackend('examSaveReviewDraft', payload());
    setBusy('');
    if (!r || r.ok === false) { setErr((r && (r.mensaje || r.error)) || 'No se pudo guardar la revisión.'); return; }
    await refreshReview();
    setMsg('Borrador guardado. Podés continuar revisando más tarde.');
    if (onDone) onDone(false);
  };

  const closeAndPush = async () => {
    if (!reviewData || !reviewData.REVIEW_ID || closed) return;
    const ok = window.confirm(`Se cerrará la revisión con nota ${calculated100}/100 y se enviará a Mis Notas. Después no podrá editarse. ¿Continuar?`);
    if (!ok) return;
    setBusy('close'); setErr(''); setMsg('');
    const r = await postExamBackend('examCloseReview', Object.assign(payload(), { push_to_notas:'SI' }), 35000);
    setBusy('');
    if (!r || r.ok === false) { setErr((r && (r.mensaje || r.error)) || 'No se pudo cerrar la revisión.'); return; }
    await refreshReview();
    setMsg(r.pushed_to_notas === 'SI' ? 'Revisión cerrada y nota enviada a Mis Notas.' : 'La revisión se cerró, pero Mis Notas no confirmó el envío. Usá “Enviar a Mis Notas”.');
    if (onDone) onDone(true);
  };

  const pushToNotas = async () => {
    if (!reviewData || !reviewData.REVIEW_ID || pushed) return;
    setBusy('push'); setErr(''); setMsg('');
    const r = await postExamBackend('examPushReviewToNotas', { review_id:reviewData.REVIEW_ID, source:'teacher_written_review_f95' }, 35000);
    setBusy('');
    if (!r || r.ok === false) { setErr((r && (r.mensaje || r.error)) || 'No se pudo enviar la nota.'); return; }
    await refreshReview();
    setMsg('Nota enviada a Mis Notas.');
    if (onDone) onDone(true);
  };

  if (loading) return <div className="tch-review-loading"><div className="exam-boot-spinner" /><b>Abriendo entrega y preparando revisión…</b></div>;
  if (err && !attempt) return <div className="tch-review-error"><b>No se pudo abrir la entrega.</b><span>{err}</span><div><button className="btn-sm" onClick={onBack}>Volver</button><button className="ad-meta-btn" onClick={load}>Reintentar</button></div></div>;
  if (!exam) return <div className="tch-review-error"><b>El examen de esta entrega no existe en el catálogo publicado.</b><span>{attempt && attempt.EXAM_ID || 'EXAM_ID no disponible'}</span><button className="btn-sm" onClick={onBack}>Volver</button></div>;

  const tema = NIVEL_TEMA[exam.nivel];
  return (
    <div className="tchrev tchrev-live" style={{ '--lvl':tema.color, '--lvl-soft':tema.soft, '--lvl-ink':tema.ink }}>
      <ScriptModal section={scriptSec} exam={exam} onClose={()=>setScriptSec(null)} />
      <aside className="rev-side">
        <button className="rev-back" onClick={onBack}>← Entregas del grupo</button>
        <div className="rev-live-tag">REVISIÓN OFICIAL</div>
        <div className="rev-stud">
          <h3>{attempt.NOMBRE || row.NOMBRE || 'Estudiante'}</h3>
          <div className="rev-meta"><span>Código</span>{attempt.CODIGO || '—'}</div>
          <div className="rev-meta"><span>Grupo</span>{examTeacherGroupLabelF88(attempt.COD_GRUPO || row.COD_GRUPO)}</div>
          <div className="rev-meta"><span>Examen</span>{attempt.EXAM_ID || '—'}</div>
          <div className="rev-meta"><span>Enviado</span>{normalizeBackendDate(attempt.SUBMITTED_AT) || '—'}</div>
          <div className="rev-meta"><span>Tiempo</span>{examTeacherDurationF940(attempt.TIME_SPENT_SEC)}</div>
        </div>

        <div className="rev-prelim">
          <div className="rev-prelim-h">Cálculo de la revisión</div>
          <div className="rev-prelim-row"><span>Auto correctas</span><b>{autoCorrect}/{all.length}</b></div>
          <div className="rev-prelim-row warn"><span>Revisión manual</span><b>{needManual}</b></div>
          <div className="rev-prelim-row"><span>Ajustes realizados</span><b>{Object.keys(marks).length}</b></div>
          <div className="rev-note">Revisá cada respuesta marcada en amarillo. La nota no llega a Mis Notas hasta cerrar.</div>
        </div>

        <div className="rev-score">
          <div className="rev-score-num" style={{ color:tema.ink }}>{displayScore}</div>
          <div className="rev-score-lbl">Nota actual · {closed ? 'cerrada' : `${finalPoints}/${all.length} pts`}</div>
        </div>

        <label className="rev-field"><span>Retroalimentación para el estudiante</span><textarea className="rev-fb" disabled={closed} placeholder="Qué hizo bien y qué debe corregir…" value={studentFeedback} onChange={e=>setStudentFeedback(e.target.value)} /></label>
        <label className="rev-field"><span>Observación interna</span><textarea className="rev-fb compact" disabled={closed} placeholder="Nota interna opcional…" value={internalComments} onChange={e=>setInternalComments(e.target.value)} /></label>

        {msg && <div className="rev-live-ok">✓ {msg}</div>}
        {err && <div className="rev-live-err">⚠ {err}</div>}
        {!closed && <button className="btn-ghost" disabled={!!busy} onClick={saveDraft}>{busy === 'save' ? 'Guardando…' : 'Guardar y continuar después'}</button>}
        {!closed && <button className="btn-close" disabled={!!busy} onClick={closeAndPush}>{busy === 'close' ? 'Cerrando…' : `Cerrar con ${calculated100}/100 y enviar`}</button>}
        {closed && !pushed && <button className="btn-close" disabled={!!busy} onClick={pushToNotas}>{busy === 'push' ? 'Enviando…' : 'Enviar a Mis Notas'}</button>}
        {closed && pushed && <div className="rev-closed">✓ Revisión cerrada y nota registrada en <b>Mis Notas</b>.</div>}
      </aside>

      <div className="rev-main">
        <ExamShell exam={exam} answers={answers} mode="review" showKey={true}
          shell="premium" density="compact" review={reviewApi}
          onOpenScript={setScriptSec}
          meta={{ nombre:attempt.NOMBRE || '', fecha:normalizeBackendDate(attempt.SUBMITTED_AT), grupo:attempt.COD_GRUPO || '', opcion:String(exam.opcion || '').toUpperCase(), scoreLabel:`${displayScore} / 100` }} />
      </div>
    </div>
  );
}

function TeacherWrittenLiveInbox() {
  const grupos = examTeacherSessionGroups();
  const [grupo, setGrupo] = useState(grupos[0] || '');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!grupos.length) return;
    if (!grupo || !grupos.includes(grupo)) setGrupo(grupos[0]);
  }, [grupos.join('|')]);

  const load = async (silent) => {
    const g = String(grupo || '').trim();
    if (!g) {
      setRows([]); setSummary(null); setMsg('');
      setErr('No se encontró un grupo docente asignado para consultar entregas.');
      return;
    }
    setLoading(true); setErr(''); if (!silent) setMsg('');
    const r = await postExamBackend('examReviewInbox', { cod_grupo:g, queue:'NEEDS_ACTION', limit:120 });
    setLoading(false);
    if (r && r.ok) {
      setRows(Array.isArray(r.rows) ? r.rows : []);
      setSummary(r.summary || null);
      if (!silent) setMsg(`Actualizado · ${r.total || 0} entrega(s) requieren atención.`);
    } else {
      setRows([]); setSummary(null);
      setErr((r && (r.mensaje || r.error)) || 'No se pudo consultar la bandeja de entregas.');
    }
  };

  useEffect(() => { setSelected(null); load(true); /* eslint-disable-next-line */ }, [grupo]);

  if (selected) return <TeacherWrittenBackendReviewF940 row={selected} onBack={()=>{ setSelected(null); load(true); }} onDone={()=>load(true)} />;

  const counts = summary || {};
  const pendingCount = Number(counts.needs_action != null ? counts.needs_action : rows.length) || 0;
  const pushedCount = Number(counts.pushed_to_notas || 0) || 0;

  return (
    <div className="tchwrap">
      <div className="tch-head tch-head-explain">
        <div>
          <div className="tch-kicker">ENTREGAS DEL ESTUDIANTE</div>
          <h2 className="tch-title">Exámenes escritos entregados</h2>
          <p className="tch-help">Esta sección no activa el examen. Sirve para <b>corregir lo que los estudiantes ya enviaron</b> y pasar la nota a Mis Notas. Si nadie ha presionado “Enviar examen”, no aparecerá ninguna persona.</p>
        </div>
        <div className="tch-stats">
          <div className="tch-stat"><b>{pendingCount}</b><span>requieren atención</span></div>
          <div className="tch-stat"><b>{pushedCount}</b><span>ya están en Mis Notas</span></div>
        </div>
      </div>

      <div className="tch-groups-panel">
        <div className="tch-groups-label">ELEGÍ EL GRUPO CON UNA TARJETA</div>
        <div className="tch-groups-row" role="tablist" aria-label="Grupos del docente">
          {grupos.length ? grupos.map(g => (
            <button key={g} type="button" role="tab" aria-selected={grupo===g}
              className={`tch-group-card${grupo===g?' active':''}`}
              onClick={()=>setGrupo(g)}>
              <span>{examTeacherGroupLabelF88(g)}</span>
              <small>{examTeacherShortGroupF940(g)}</small>
            </button>
          )) : <div className="tch-group-empty">Sin grupos asignados en la sesión.</div>}
          <button type="button" className="tch-refresh" disabled={loading || !grupo} onClick={()=>load(false)}>{loading ? 'Actualizando…' : 'Actualizar entregas'}</button>
        </div>
        {msg && <div className="ex-okmsg">✓ {msg}</div>}
        {err && <div className="ex-errmsg">⚠ {err}</div>}
      </div>

      <div className="tch-table-wrap">
        <table className="tch-table">
          <thead><tr><th>Estudiante</th><th>Examen</th><th>Enviado</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>
            {!rows.length && <tr><td colSpan="5"><div className="tch-empty-state"><b>No hay exámenes enviados que requieran atención.</b><span>Que el examen esté activo no significa que ya haya entregas. La lista cambia cuando el estudiante termina y presiona “Enviar examen”.</span></div></td></tr>}
            {rows.map((r, i) => (
              <tr key={r.ATTEMPT_ID || r.REVIEW_ID || i}>
                <td><b>{r.NOMBRE || r.CODIGO || '—'}</b><span className="tch-code">{r.CODIGO || r.COD_ESTUDIANTE || '—'}</span></td>
                <td><b>{r.NIVEL || '—'} · Lección {r.LECCION || (String(r.TEST_CODE||'').toUpperCase()==='TEST2'?32:18)}</b><span className="tch-code">{r.EXAM_ID || r.TEST_CODE || '—'}</span></td>
                <td>{normalizeBackendDate(r.SUBMITTED_AT || r.UPDATED_AT) || '—'}</td>
                <td><span className={`tch-pill bucket-${String(r.bucket||'').toLowerCase()}`}>{examTeacherBucketLabelF940(r)}</span></td>
                <td><button type="button" className="tch-review-open" onClick={()=>setSelected(r)}>{examTeacherActionLabelF940(r)}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeacherReview({ sub, shell, density, onBack }) {
  const exam = (window.EXAMS || {})[sub.examen] || EXAM_I2_T1_A;
  const tema = NIVEL_TEMA[exam.nivel];
  const answers = sub.respuestas;
  const all = examQuestions(exam);

  // Auto-grade preliminar
  const autoEval = useMemo(() => all.map(({ section, q, kind }) => {
    const val = kind==='match' ? getMatchVal(answers, q.n, section.letter) : answers[q.id];
    const ev = evalQuestion(section, q, val);
    return { id: kind==='match' ? section.letter+q.n : q.id, ev };
  }), []);
  const autoScore = autoEval.filter(x => x.ev.verdict==='ok').length;
  const needReview = autoEval.filter(x => x.ev.verdict==='review').length;

  const [marks, setMarks] = useState({});       // id -> 0 / 0.5 / 1 (override)
  const [comments, setComments] = useState({});
  const [openComment, setOpenComment] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [closed, setClosed] = useState(false);

  const setMark = (id, p) => setMarks(m => Object.assign({}, m, { [id]: p }));
  const setComment = (id, t) => setComments(c => Object.assign({}, c, { [id]: t }));

  // Nota actual = override si existe, si no auto (1 si ok, 0 resto)
  const finalScore = autoEval.reduce((sum, x) => {
    const m = marks[x.id];
    return sum + (m == null ? (x.ev.verdict==='ok' ? 1 : 0) : m);
  }, 0);
  const adjusted = Object.keys(marks).length;
  const note100 = Math.round((finalScore / all.length) * 100);

  const review = { marks, setMark, comments, setComment, openComment, setOpenComment };

  const [scriptSec, setScriptSec] = useState(null);

  return (
    <div className="tchrev" style={{ '--lvl':tema.color, '--lvl-soft':tema.soft, '--lvl-ink':tema.ink }}>
      <ScriptModal section={scriptSec} exam={exam} onClose={()=>setScriptSec(null)} />
      {/* sidebar de control */}
      <aside className="rev-side">
        <button className="rev-back" onClick={onBack}>← Bandeja</button>
        <div className="rev-stud">
          <h3>{sub.estudiante}</h3>
          <div className="rev-meta"><span>Código</span>{sub.codigo}</div>
          <div className="rev-meta"><span>Cédula</span>{sub.cedula}</div>
          <div className="rev-meta"><span>Grupo</span>{sub.grupo}</div>
          <div className="rev-meta"><span>Examen</span>{sub.examen}</div>
          <div className="rev-meta"><span>Opción</span><span className={`mini-opt opt-${sub.opcion}`}>{sub.opcion}</span></div>
          <div className="rev-meta"><span>Enviado</span>{sub.enviado}</div>
          <div className="rev-meta"><span>Tiempo</span>{sub.tiempo}</div>
        </div>

        <div className="rev-prelim">
          <div className="rev-prelim-h">Corrección preliminar</div>
          <div className="rev-prelim-row"><span>Auto correctas</span><b>{autoScore}/{all.length}</b></div>
          <div className="rev-prelim-row warn"><span>Requieren revisión</span><b>{needReview}</b></div>
          <div className="rev-prelim-row"><span>Ajustes docente</span><b>{adjusted}</b></div>
          <div className="rev-note">La nota automática es preliminar — nunca es nota final sin docente.</div>
        </div>

        <div className="rev-score">
          <div className="rev-score-num" style={{ color:tema.ink }}>{note100}</div>
          <div className="rev-score-lbl">Nota actual · {finalScore}/{all.length} pts</div>
        </div>

        <textarea className="rev-fb" placeholder="Retroalimentación final para el estudiante…" value={feedback} onChange={e=>setFeedback(e.target.value)} />

        <button className="btn-ghost" disabled title="Pendiente de backend">Guardar borrador · pendiente backend</button>
        <button className={`btn-close${closed?' done':''}`} disabled={closed} onClick={()=>setClosed(true)}>
          {closed ? '✓ Cierre local previsualizado' : 'Previsualizar cierre local'}
        </button>
        {closed && <div className="rev-closed">Nota <b>{note100}</b> previsualizada localmente. No se guardó, no se cerró en servidor y no se envió a <b>Mis Notas</b>.</div>}
      </aside>

      {/* examen con clave + corrección por pregunta */}
      <div className="rev-main">
        <ExamShell exam={exam} answers={answers} mode="review" showKey={true}
                   shell={shell} density={density} review={review}
                   onOpenScript={setScriptSec}
                   meta={{ nombre:sub.estudiante, fecha:sub.enviado, grupo:sub.grupo, opcion:sub.opcion, scoreLabel:`${note100} / 100` }} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ADMINISTRADOR — catálogo maestro
// ════════════════════════════════════════════════════════════════════════
// Modelo de ponderación por plan (referencia administrativa)
function PonderacionModelo() {
  const [open, setOpen] = useState(false);
  const rows = window.PONDERACION_MODELO();
  const totCon = rows.reduce((s,r)=>s+r.con_ina,0);
  const totSin = rows.reduce((s,r)=>s+r.sin_ina,0);
  return (
    <div className="pmodel">
      <button className="pmodel-h" onClick={()=>setOpen(o=>!o)}>
        <span className="pmodel-ttl">Modelo de ponderación por plan · CON INA / SIN INA</span>
        <span className="pmodel-sub">La ponderación no es fija — depende del plan del estudiante</span>
        <span className="pmodel-chev">{open?'▾':'▸'}</span>
      </button>
      {open && (
        <table className="pmodel-table">
          <thead><tr><th>Evaluación</th><th>CON INA</th><th>SIN INA</th></tr></thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i} className={/Escrito/.test(r.item)?'pm-w':''}>
                <td>{r.item}</td>
                <td><b>{r.con_ina}%</b></td>
                <td><b>{r.sin_ina===0?'—':r.sin_ina+'%'}</b></td>
              </tr>
            ))}
            <tr className="pm-tot"><td>Total</td><td>{totCon}%</td><td>{totSin}%</td></tr>
          </tbody>
        </table>
      )}
    </div>
  );
}



function testCodeFromLeccion(leccion) {
  return Number(leccion) === 18 ? 'TEST1' : 'TEST2';
}

function leccionFromTestCode(test) {
  return test === 'TEST2' ? 32 : 18;
}

function getExamParentSession() {
  try {
    if (!window.parent || window.parent === window) return null;
    if (typeof window.parent.getSesion !== 'function') return null;
    return window.parent.getSesion();
  } catch (_) {
    return null;
  }
}

function getExamParentToken() {
  try {
    if (window.parent && window.parent !== window && typeof window.parent.getSessionToken === 'function') {
      return window.parent.getSessionToken() || '';
    }
  } catch (_) {}
  const ses = getExamParentSession();
  return ses && typeof ses.token === 'string' ? ses.token : '';
}

function getExamAppsScriptUrl() {
  try {
    if (window.parent && window.parent !== window && window.parent.APPS_SCRIPT_URL) return window.parent.APPS_SCRIPT_URL;
  } catch (_) {}
  return window.APPS_SCRIPT_URL || '';
}

async function postExamBackend(fn, payload = {}, timeoutMs = 25000) {
  const url = getExamAppsScriptUrl();
  const token = getExamParentToken();
  if (!url) return { ok:false, error:'apps_script_url_no_disponible', mensaje:'No se encontró APPS_SCRIPT_URL desde el campus padre.' };
  if (!token) return { ok:false, error:'token_no_disponible', mensaje:'No se encontró el token de la sesión activa.' };
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = window.setTimeout(() => { try { if (controller) controller.abort(); } catch (_) {} }, timeoutMs);
  try {
    const res = await fetch(`${url}?fn=${encodeURIComponent(fn)}`, {
      method:'POST',
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body:JSON.stringify(Object.assign({ fn, token }, payload || {})),
      signal:controller ? controller.signal : undefined,
      cache:'no-store',
    });
    const raw = await res.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : {}; }
    catch (_) { return { ok:false, error:'respuesta_backend_no_json', mensaje:`Apps Script respondió en formato inválido (HTTP ${res.status}).` }; }
    if (!res.ok && data && data.ok !== false) return Object.assign({}, data, { ok:false, error:data.error || `http_${res.status}`, mensaje:data.mensaje || `Apps Script respondió con HTTP ${res.status}.` });
    return data;
  } catch (e) {
    if (e && e.name === 'AbortError') return { ok:false, error:'backend_timeout', mensaje:'La consulta tardó más de 25 segundos. Presioná Actualizar para reintentar.' };
    return { ok:false, error:'conexion', mensaje:e && e.message ? e.message : String(e) };
  } finally {
    window.clearTimeout(timer);
  }
}

function normalizeBackendDate(v) {
  return String(v || '').replace('T', ' ').trim();
}

function normalizeBackendPlan(v) {
  return String(v || '').toUpperCase().replace(/\s+/g, '_');
}

function normalizeBackendTipo(v) {
  return String(v || '').toUpperCase().replace(/\s+/g, '_');
}

function statusClass(st) {
  return String(st || 'DRAFT').toLowerCase();
}

function ActivationBackendPanel({ onPreview }) {
  const [open, setOpen] = useState(true);
  const [grupo, setGrupo] = useState('');
  const [nivel, setNivel] = useState('B1');
  const [test, setTest] = useState('TEST1');
  const [opcion, setOpcion] = useState('A');
  const [plan, setPlan] = useState('CON_INA');
  const [tipo, setTipo] = useState('ORDINARIO');
  const [abre, setAbre] = useState('');
  const [cierra, setCierra] = useState('');
  const [timeLimit, setTimeLimit] = useState(90);
  const [allowLate, setAllowLate] = useState('NO');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const session = getExamParentSession() || {};
  const isSuper = String(session.rol || '').toLowerCase() === 'superadmin';

  const leccion = leccionFromTestCode(test);
  const entry = CATALOGO.find(e => e.nivel === nivel && e.leccion === leccion && e.opcion === opcion) || null;
  const exam = entry && window.EXAMS ? window.EXAMS[entry.id] : null;
  const tema = NIVEL_TEMA[nivel];
  const valor = entry ? planValor(entry.ponderacion_por_plan, plan.toLowerCase()) : '—';

  const payload = () => ({
    cod_grupo: grupo.trim(),
    nivel,
    test_code: test,
    leccion,
    opcion,
    plan: normalizeBackendPlan(plan),
    tipo: normalizeBackendTipo(tipo),
    open_at: normalizeBackendDate(abre),
    close_at: normalizeBackendDate(cierra),
    time_limit_min: Number(timeLimit) || 90,
    allow_late: allowLate,
    max_attempts: 1,
    notes: notes.trim(),
  });

  const warnings = [];
  if (!grupo.trim()) warnings.push('Grupo requerido para guardar activación real.');
  if (!abre || !cierra) warnings.push('Apertura y cierre requeridos para operación real.');
  if (!exam) warnings.push('No hay contenido oficial para esta combinación.');
  if (opcion === 'B' && tipo === 'ORDINARIO') warnings.push('Opción B ordinaria debe usarse solo si administración lo autoriza.');

  const setResult = (r, okMsg) => {
    if (r && r.ok) {
      setErr('');
      setMsg(okMsg || r.mensaje || 'Operación realizada.');
    } else {
      setMsg('');
      const detail = r && (r.mensaje || r.error || (r.errores && r.errores.join(' · ')));
      setErr(detail || 'No se pudo completar la operación.');
    }
  };

  const loadRows = async () => {
    setLoading(true); setErr('');
    const r = await postExamBackend('examListActivations', {});
    setLoading(false);
    if (r && r.ok) { setRows(Array.isArray(r.rows) ? r.rows.reverse() : []); setMsg(`Activaciones cargadas: ${r.total || 0}`); }
    else setResult(r);
  };

  useEffect(() => { if (open) loadRows(); }, []);

  const setupSheets = async () => {
    setLoading(true);
    const r = await postExamBackend('examSetupSheets', {});
    setLoading(false);
    setResult(r, 'Hojas de exámenes verificadas/creadas.');
    if (r && r.ok) loadRows();
  };

  const createActivation = async (status) => {
    if (warnings.length) { setErr('No guardé: ' + warnings.join(' ')); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examCreateActivation', Object.assign(payload(), { status }));
    setLoading(false);
    setResult(r, `Activación ${status} creada correctamente.`);
    if (r && r.ok) loadRows();
  };

  const changeStatus = async (fn, id, label) => {
    if (!id) return;
    setLoading(true);
    const r = await postExamBackend(fn, { activation_id:id });
    setLoading(false);
    setResult(r, label);
    if (r && r.ok) loadRows();
  };

  return (
    <div className="actbox" style={{ '--lvl':tema.color, '--lvl-soft':tema.soft, '--lvl-ink':tema.ink }}>
      <button className="actbox-h" onClick={()=>setOpen(v=>!v)}>
        <div>
          <div className="actbox-k">ACTIVACIONES DE EXÁMENES · BACKEND V10F</div>
          <div className="actbox-t">Crear, listar, abrir y cerrar activaciones reales</div>
          <div className="actbox-s">Conecta con backend V10F en CAMPUS_OPERATIVO. No habilita estudiante y no envía notas.</div>
        </div>
        <span className="actbox-state">Backend conectado</span>
        <span className="pmodel-chev">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="actbox-body actbox-body-live">
          <div>
            <div className="actform">
              <label><span>Grupo</span><input value={grupo} onChange={e=>setGrupo(e.target.value)} placeholder="Ej. B1-LM6A9-C32026-001" /></label>
              <label><span>Nivel</span><select value={nivel} onChange={e=>setNivel(e.target.value)}>{Object.keys(NIVEL_TEMA).map(k=><option key={k} value={k}>{k} · {NIVEL_TEMA[k].nombre}</option>)}</select></label>
              <label><span>Prueba</span><select value={test} onChange={e=>setTest(e.target.value)}><option value="TEST1">Test 1 · Lección 18</option><option value="TEST2">Test 2 · Lección 32</option></select></label>
              <label><span>Opción</span><select value={opcion} onChange={e=>setOpcion(e.target.value)}><option value="A">A · ordinaria</option><option value="B">B · reposición/caso autorizado</option></select></label>
              <label><span>Plan</span><select value={plan} onChange={e=>setPlan(e.target.value)}><option value="CON_INA">CON INA · 5%</option><option value="SIN_INA">SIN INA · 15%</option></select></label>
              <label><span>Tipo</span><select value={tipo} onChange={e=>setTipo(e.target.value)}><option value="ORDINARIO">Ordinario</option><option value="REPOSICION">Reposición</option><option value="EXTRAORDINARIO">Extraordinario</option></select></label>
              <label><span>Apertura</span><input type="datetime-local" value={abre} onChange={e=>setAbre(e.target.value)} /></label>
              <label><span>Cierre</span><input type="datetime-local" value={cierra} onChange={e=>setCierra(e.target.value)} /></label>
              <label><span>Tiempo límite</span><input type="number" min="1" value={timeLimit} onChange={e=>setTimeLimit(e.target.value)} /></label>
              <label><span>Entrega tardía</span><select value={allowLate} onChange={e=>setAllowLate(e.target.value)}><option value="NO">NO</option><option value="SI">SI</option></select></label>
            </div>
            <label className="actnotes"><span>Notas internas</span><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Observación administrativa opcional" /></label>
          </div>

          <div className="actsummary">
            <div className="actpick">
              <span className="adcard-lvl">{tema.code}</span>
              <span className={`mini-opt opt-${opcion}`}>{opcion}</span>
              <b>{entry ? entry.id : 'SIN EXAMEN'}</b>
            </div>
            <div className="actgrid">
              <div><span>Contenido</span><b>{exam ? 'oficial' : 'no disponible'}</b></div>
              <div><span>Valor</span><b>{valor}</b></div>
              <div><span>Backend</span><b>V10F</b></div>
              <div><span>Estudiante</span><b>Cerrado</b></div>
            </div>
            <div className="actwarns">
              {warnings.map((w,i)=><div key={i}>⚠ {w}</div>)}
              <div>🔒 Esta conexión solo administra activaciones. No abre exámenes al estudiante.</div>
            </div>
            {msg && <div className="ex-okmsg">✓ {msg}</div>}
            {err && <div className="ex-errmsg">⚠ {err}</div>}
            <div className="actactions">
              <button className="btn-sm" disabled={!exam} onClick={()=>entry && onPreview(entry)}>Preview admin</button>
              <button className="btn-sm" disabled={loading} onClick={setupSheets}>Verificar hojas</button>
              <button className="btn-sm" disabled={loading || warnings.length>0} onClick={()=>createActivation('DRAFT')}>Guardar DRAFT</button>
              <button className="btn-sm" disabled={loading || warnings.length>0} onClick={()=>createActivation('SCHEDULED')}>Guardar SCHEDULED</button>
              <button className="ad-meta-btn" disabled={loading || warnings.length>0} onClick={()=>createActivation('OPEN')}>Crear y abrir OPEN</button>
              <button className="ad-meta-btn" disabled={loading} onClick={loadRows}>Refrescar lista</button>
            </div>
          </div>

          <div className="actlist">
            <div className="actlist-h">
              <b>Activaciones registradas</b>
              <span>{loading ? 'Cargando…' : `${rows.length} filas`}</span>
            </div>
            <div className="acttable-wrap">
              <table className="acttable">
                <thead><tr><th>Estado</th><th>Grupo</th><th>Examen</th><th>Ventana</th><th>Tipo</th><th>Acciones</th></tr></thead>
                <tbody>
                  {!rows.length && <tr><td colSpan="6" className="actempty">Sin activaciones registradas todavía.</td></tr>}
                  {rows.map((r,i)=>{
                    const id = r.ACTIVATION_ID || r.activation_id;
                    const st = r.STATUS || 'DRAFT';
                    return <tr key={id || i}>
                      <td><span className={`actstatus ${statusClass(st)}`}>{st}</span></td>
                      <td><b>{r.COD_GRUPO || '—'}</b><small>{r.NIVEL || '—'} · {r.PLAN || '—'}</small></td>
                      <td><code>{r.EXAM_ID || '—'}</code><small>{r.TEST_CODE || '—'} · Op. {r.OPCION || '—'}</small></td>
                      <td><small>{r.OPEN_AT || 'sin apertura'}</small><small>{r.CLOSE_AT || 'sin cierre'}</small></td>
                      <td>{r.TIPO || '—'}</td>
                      <td className="actrow-actions">
                        {st !== 'OPEN' && st !== 'CLOSED' && st !== 'CANCELLED' && <button onClick={()=>changeStatus('examOpenActivation', id, 'Activación abierta.')} disabled={loading}>Abrir</button>}
                        {st === 'OPEN' && <button onClick={()=>changeStatus('examCloseActivation', id, 'Activación cerrada.')} disabled={loading}>Cerrar</button>}
                        {isSuper && st !== 'CANCELLED' && <button onClick={()=>changeStatus('examCancelActivation', id, 'Activación cancelada.')} disabled={loading}>Cancelar</button>}
                      </td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function parseJsonMaybe(text) {
  if (!text) return null;
  if (typeof text === 'object') return text;
  try { return JSON.parse(String(text)); } catch (_) { return null; }
}

function compactDate(v) {
  return String(v || '—').replace('T', ' ').replace(/\.000Z$/, '');
}

function attemptStatusClass(st) {
  return String(st || 'STARTED').toLowerCase();
}

function BackendOperationsPanel() {
  const [open, setOpen] = useState(false);
  const [attempts, setAttempts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [attemptId, setAttemptId] = useState('');
  const [selected, setSelected] = useState(null);
  const [review, setReview] = useState(null);
  const [publicExamId, setPublicExamId] = useState('B1_WRITTEN_L18_TEST1_A');
  const [publicPlan, setPublicPlan] = useState('CON_INA');
  const [publicPayload, setPublicPayload] = useState(null);
  const [reviewDraft, setReviewDraft] = useState({ final_score_100:'', comments:'', student_feedback:'' });
  const [pushOnClose, setPushOnClose] = useState(false);
  const [pushForce, setPushForce] = useState(false);
  const [lastPushResult, setLastPushResult] = useState(null);
  const [inboxRows, setInboxRows] = useState([]);
  const [inboxSummary, setInboxSummary] = useState(null);
  const [inboxFilters, setInboxFilters] = useState({ cod_grupo:'', nivel:'', queue:'NEEDS_ACTION', search:'', limit:'50' });
  const [auditRows, setAuditRows] = useState([]);
  const [auditSummary, setAuditSummary] = useState(null);
  const [auditFilters, setAuditFilters] = useState({ cod_grupo:'', nivel:'', action:'', target_id:'', search:'', limit:'100' });
  const [signalRows, setSignalRows] = useState([]);
  const [signalSummary, setSignalSummary] = useState(null);
  const [signalFilters, setSignalFilters] = useState({ cod_grupo:'', nivel:'', severity:'', type:'', search:'', limit:'100' });
  const [diagResult, setDiagResult] = useState(null);
  const [diagSample, setDiagSample] = useState(false);
  const [qaReady, setQaReady] = useState(null);
  const [closure, setClosure] = useState(null);
  const [masterIndex, setMasterIndex] = useState(null);

  const setResult = (r, okMsg) => {
    if (r && r.ok) { setErr(''); setMsg(okMsg || r.mensaje || 'Operación realizada.'); }
    else { setMsg(''); setErr((r && (r.mensaje || r.error)) || 'No se pudo completar la operación.'); }
  };

  const loadAttempts = async () => {
    setLoading(true);
    const r = await postExamBackend('examListAttempts', {});
    setLoading(false);
    if (r && r.ok) { setAttempts(Array.isArray(r.rows) ? r.rows.reverse() : []); setMsg(`Intentos cargados: ${r.total || 0}`); setErr(''); }
    else setResult(r);
  };

  const loadReviews = async () => {
    setLoading(true);
    const r = await postExamBackend('examListReviews', {});
    setLoading(false);
    if (r && r.ok) { setReviews(Array.isArray(r.rows) ? r.rows.reverse() : []); setMsg(`Revisiones cargadas: ${r.total || 0}`); setErr(''); }
    else setResult(r);
  };

  const setInboxFilter = (key, value) => {
    setInboxFilters(f => Object.assign({}, f, { [key]: value }));
  };

  const loadInbox = async (patch) => {
    const next = Object.assign({}, inboxFilters, patch || {});
    setInboxFilters(next);
    setLoading(true);
    const payload = {
      cod_grupo: String(next.cod_grupo || '').trim(),
      nivel: next.nivel,
      queue: next.queue,
      search: String(next.search || '').trim(),
      limit: Number(next.limit) || 50
    };
    const r = await postExamBackend('examReviewInbox', payload);
    setLoading(false);
    if (r && r.ok) {
      setInboxRows(Array.isArray(r.rows) ? r.rows : []);
      setInboxSummary(r.summary || null);
      setErr('');
      setMsg(`Bandeja F45 cargada: ${r.total || 0} filas visibles · ${r.summary ? r.summary.needs_action : 0} requieren acción.`);
    } else {
      setInboxRows([]);
      setInboxSummary(null);
      setResult(r);
    }
  };



  const setAuditFilter = (key, value) => {
    setAuditFilters(f => Object.assign({}, f, { [key]: value }));
  };

  const loadAuditTrail = async (patch) => {
    const next = Object.assign({}, auditFilters, patch || {});
    setAuditFilters(next);
    setLoading(true);
    const payload = {
      cod_grupo: String(next.cod_grupo || '').trim(),
      nivel: next.nivel,
      action: String(next.action || '').trim(),
      target_id: String(next.target_id || '').trim(),
      search: String(next.search || '').trim(),
      limit: Number(next.limit) || 100
    };
    const r = await postExamBackend('examAuditTrail', payload);
    setLoading(false);
    if (r && r.ok) {
      setAuditRows(Array.isArray(r.rows) ? r.rows : []);
      setAuditSummary(r.summary || null);
      setErr('');
      setMsg(`Bitácora F46 cargada: ${r.total || 0} logs visibles · ${r.summary ? r.summary.errores : 0} alertas/error.`);
    } else {
      setAuditRows([]);
      setAuditSummary(null);
      setResult(r);
    }
  };


  const setSignalFilter = (key, value) => {
    setSignalFilters(f => Object.assign({}, f, { [key]: value }));
  };

  const loadIntegritySignals = async (patch) => {
    const next = Object.assign({}, signalFilters, patch || {});
    setSignalFilters(next);
    setLoading(true);
    const payload = {
      cod_grupo: String(next.cod_grupo || '').trim(),
      nivel: next.nivel,
      severity: next.severity,
      type: next.type,
      search: String(next.search || '').trim(),
      limit: Number(next.limit) || 100
    };
    const r = await postExamBackend('examIntegritySignals', payload);
    setLoading(false);
    if (r && r.ok) {
      setSignalRows(Array.isArray(r.rows) ? r.rows : []);
      setSignalSummary(r.summary || null);
      setErr('');
      setMsg(`Señales F47 cargadas: ${r.total || 0} visibles · ${r.summary ? ((r.summary.critical || 0) + (r.summary.high || 0)) : 0} altas/críticas.`);
    } else {
      setSignalRows([]);
      setSignalSummary(null);
      setResult(r);
    }
  };


  const loadDiagnosticCenter = async () => {
    setLoading(true);
    const r = await postExamBackend('examDiagnosticCenter', { include_sample: diagSample ? 'SI' : 'NO' });
    setLoading(false);
    if (r && r.ok) {
      setDiagResult(r);
      setErr('');
      const issues = Array.isArray(r.issues) ? r.issues.length : 0;
      const counts = r.counts || {};
      setMsg(`Diagnóstico F48 cargado: ${issues} alertas · ${counts.attempts || 0} intentos · ${counts.reviews || 0} revisiones.`);
    } else {
      setDiagResult(null);
      setResult(r);
    }
  };


  const loadQaReadiness = async () => {
    setLoading(true);
    const r = await postExamBackend('examQaReadiness', { limit: 300 });
    setLoading(false);
    if (r && r.ok) {
      setQaReady(r);
      setErr('');
      const c = r.status_counts || {};
      setMsg(`Checklist F49 cargado: ${r.decision || '—'} · ${c.FAIL || 0} bloqueos · ${c.WARN || 0} advertencias · ${c.MANUAL || 0} manuales.`);
    } else {
      setQaReady(null);
      setResult(r);
    }
  };


  const loadTechnicalClosure = async () => {
    setLoading(true);
    const r = await postExamBackend('examTechnicalClosure', { limit: 300 });
    setLoading(false);
    if (r && r.ok) {
      setClosure(r);
      setErr('');
      const c = r.readiness_counts || {};
      setMsg(`Cierre F50 cargado: ${r.release_decision || '—'} · ${c.FAIL || 0} bloqueos · ${c.WARN || 0} advertencias.`);
    } else {
      setClosure(null);
      setResult(r);
    }
  };



  const loadCampusMasterIndex = async () => {
    setLoading(true);
    const r = await postExamBackend('examCampusMasterIndex', { limit: 300 });
    setLoading(false);
    if (r && r.ok) {
      setMasterIndex(r);
      setErr('');
      setMsg(`Índice F51 cargado: ${r.decision || '—'} · ${(r.campus_areas || []).length} áreas · ${(r.visual_checklist || []).length} puntos visuales.`);
    } else {
      setMasterIndex(null);
      setResult(r);
    }
  };

  const openInboxReview = async (row) => {
    const id = row && row.ATTEMPT_ID;
    if (!id) return;
    setAttemptId(id);
    if (row.REVIEW_ID) await loadReview(id);
    else await createReview(id);
  };

  const pushReviewIdToNotas = async (reviewId, attemptIdValue) => {
    const rid = String(reviewId || '').trim();
    if (!rid) { setErr('No hay REVIEW_ID para enviar a Mis Notas.'); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examPushReviewToNotas', {
      review_id: rid,
      force: pushForce ? 'SI' : 'NO',
      source: 'admin_panel_f45_inbox'
    });
    setLoading(false);
    setLastPushResult(r || null);
    if (r && r.ok) {
      setErr('');
      setMsg(r.already_pushed ? 'Esta revisión ya estaba enviada a Mis Notas.' : 'Revisión enviada a Mis Notas desde bandeja F45.');
      if (attemptIdValue) await loadReview(attemptIdValue);
      await loadInbox();
      loadReviews();
    } else setResult(r);
  };

  const inspectAttempt = async (id) => {
    const target = String(id || attemptId || '').trim();
    if (!target) { setErr('Indicá ATTEMPT_ID para inspeccionar.'); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examGetAttempt', { attempt_id: target });
    setLoading(false);
    if (r && r.ok) { setSelected(r.attempt || null); setAttemptId(target); setErr(''); setMsg('Intento cargado para inspección admin.'); }
    else setResult(r);
  };

  const loadReview = async (id) => {
    const target = String(id || attemptId || '').trim();
    if (!target) { setErr('Indicá ATTEMPT_ID para cargar revisión.'); setMsg(''); return null; }
    setLoading(true);
    const r = await postExamBackend('examGetReview', { attempt_id: target });
    setLoading(false);
    if (r && r.ok) {
      setReview(r.review || null);
      setSelected(r.attempt || selected);
      setAttemptId(target);
      setReviewDraft({
        final_score_100: r.review && r.review.FINAL_SCORE_100 != null ? String(r.review.FINAL_SCORE_100) : '',
        comments: r.review && r.review.COMMENTS ? String(r.review.COMMENTS) : '',
        student_feedback: r.review && r.review.STUDENT_FEEDBACK ? String(r.review.STUDENT_FEEDBACK) : '',
      });
      setErr('');
      setMsg('Revisión cargada desde backend.');
      return r.review || null;
    }
    setResult(r);
    return null;
  };

  const createReview = async (id) => {
    const target = String(id || attemptId || '').trim();
    if (!target) { setErr('Indicá ATTEMPT_ID para crear revisión.'); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examCreateReviewDraft', { attempt_id: target });
    setLoading(false);
    if (r && r.ok) {
      setAttemptId(target);
      setErr('');
      setMsg(r.existing ? 'Revisión existente recuperada.' : 'Borrador de revisión creado.');
      if (r.review) setReview(r.review);
      else await loadReview(target);
      loadReviews();
    }
    else setResult(r);
  };

  const saveReview = async () => {
    const rid = review && review.REVIEW_ID;
    if (!rid) { setErr('Primero creá o cargá una revisión.'); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examSaveReviewDraft', {
      review_id: rid,
      final_score_100: reviewDraft.final_score_100,
      comments: reviewDraft.comments,
      student_feedback: reviewDraft.student_feedback,
      manual_adjustments_json: { source:'admin_panel_f45', note:'draft only' },
    });
    setLoading(false);
    if (r && r.ok) { setReview(r.review || review); setErr(''); setMsg('Borrador de revisión guardado en backend.'); loadReviews(); }
    else setResult(r);
  };

  const closeReview = async () => {
    const rid = review && review.REVIEW_ID;
    if (!rid) { setErr('Primero creá o cargá una revisión.'); setMsg(''); return; }
    if (reviewDraft.final_score_100 === '') { setErr('Para cerrar, indicá nota final 0–100.'); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examCloseReview', {
      review_id: rid,
      final_score_100: reviewDraft.final_score_100,
      comments: reviewDraft.comments,
      student_feedback: reviewDraft.student_feedback,
      push_to_notas: pushOnClose ? 'SI' : 'NO',
      force: pushForce ? 'SI' : 'NO',
      manual_adjustments_json: { source:'admin_panel_f45', note: pushOnClose ? 'closed and requested Mis Notas push' : 'closed without Mis Notas push' },
    });
    setLoading(false);
    if (r && r.ok) {
      setLastPushResult(r.notas || null);
      setErr('');
      setMsg(pushOnClose
        ? (r.pushed_to_notas === 'SI' ? 'Revisión cerrada y enviada a Mis Notas.' : 'Revisión cerrada, pero Mis Notas no confirmó sincronización. Revisá detalle.')
        : 'Revisión cerrada en backend. No se envió a Mis Notas porque no marcaste la opción.');
      await loadReview(attemptId || (review && review.ATTEMPT_ID));
      loadReviews();
    }
    else setResult(r);
  };

  const pushReviewToNotas = async () => {
    const rid = review && review.REVIEW_ID;
    if (!rid) { setErr('Primero cargá una revisión cerrada.'); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examPushReviewToNotas', {
      review_id: rid,
      force: pushForce ? 'SI' : 'NO',
      source: 'admin_panel_f45_push_button'
    });
    setLoading(false);
    setLastPushResult(r || null);
    if (r && r.ok) {
      setErr('');
      setMsg(r.already_pushed ? 'Esta revisión ya estaba enviada a Mis Notas.' : 'Revisión enviada a Mis Notas.');
      await loadReview(attemptId || (review && review.ATTEMPT_ID));
      loadReviews();
    } else setResult(r);
  };

  const loadPublicPayload = async () => {
    const target = String(publicExamId || '').trim();
    if (!target) { setErr('Indicá EXAM_ID para probar payload público.'); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examGetPublicExamPayload', { exam_id: target, plan: publicPlan });
    setLoading(false);
    if (r && r.ok) {
      setPublicPayload(r.public_exam || null);
      const raw = JSON.stringify(r.public_exam || {});
      const leaked = /correct|accepted|audioScript|answer_key|answers/i.test(raw);
      setErr(leaked ? 'Alerta: el payload contiene una palabra sensible. Revisar antes de habilitar estudiante.' : '');
      setMsg(leaked ? '' : 'Payload público V10G cargado sin keys evidentes.');
    } else setResult(r);
  };

  return (
    <div className="opsbox">
      <button className="opsbox-h" onClick={()=>setOpen(v=>!v)}>
        <div>
          <div className="opsbox-k">OPERACIÓN BACKEND · F51</div>
          <div className="opsbox-t">Bandeja + bitácora + diagnóstico + checklist + cierre + índice maestro</div>
          <div className="opsbox-s">Une intentos, revisiones, Mis Notas, auditoría, señales, diagnóstico, cierre técnico e inventario visual GitHub.</div>
        </div>
        <span className="opsbox-state">Monitoreo seguro</span>
        <span className="pmodel-chev">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="opsbox-body">
          <div className="ops-actions">
            <button className="btn-sm" disabled={loading} onClick={loadAttempts}>Listar intentos</button>
            <button className="btn-sm" disabled={loading} onClick={loadReviews}>Listar revisiones</button>
            <label><span>ATTEMPT_ID</span><input value={attemptId} onChange={e=>setAttemptId(e.target.value)} placeholder="ATT-..." /></label>
            <button className="btn-sm" disabled={loading} onClick={()=>inspectAttempt()}>Inspeccionar intento</button>
            <button className="ad-meta-btn" disabled={loading} onClick={()=>createReview()}>Crear/abrir revisión</button>
            <button className="btn-sm" disabled={loading} onClick={()=>loadReview()}>Cargar revisión</button>
          </div>
          <div className="ops-warning">
            <b>Regla de seguridad:</b> esta sección no publica exámenes ni crea intentos estudiantiles. Mis Notas solo se toca si la revisión está cerrada y marcás la sincronización explícitamente.
          </div>

          <div className="ops-master">
            <div className="ops-card-h"><b>Índice F51 · mapa maestro del campus</b><span>{masterIndex ? masterIndex.decision : 'sin cargar'}</span></div>
            <div className="ops-actions compact">
              <button className="ad-meta-btn" disabled={loading} onClick={loadCampusMasterIndex}>Cargar índice F51</button>
            </div>
            <div className="ops-warning small">Solo lectura. Sirve para revisar visualmente GitHub: áreas, páginas, archivos, orden de revisión y smoke backend posterior. No aprueba producción.</div>
            {masterIndex && <>
              <div className="ops-kpis master-kpis">
                <span><b>{masterIndex.campus_areas ? masterIndex.campus_areas.length : 0}</b> áreas</span>
                <span><b>{masterIndex.visual_checklist ? masterIndex.visual_checklist.length : 0}</b> checks visuales</span>
                <span><b>{masterIndex.backend_smoke_plan ? masterIndex.backend_smoke_plan.length : 0}</b> smoke backend</span>
                <span><b>{masterIndex.f48_summary && masterIndex.f48_summary.counts ? masterIndex.f48_summary.counts.attempts || 0 : 0}</b> intentos</span>
                <span><b>{masterIndex.f50_summary ? masterIndex.f50_summary.release_decision || '—' : '—'}</b> F50</span>
              </div>
              <div className="master-grid">
                <div className="master-card wide">
                  <h4>Áreas del campus</h4>
                  {(masterIndex.campus_areas || []).map((x,i)=><div className="master-line" key={i}>
                    <b>{x.area}</b><span>{(x.pages || []).join(', ')} · {x.visual_focus}</span>
                  </div>)}
                </div>
                <div className="master-card">
                  <h4>Orden GitHub</h4>
                  {(masterIndex.github_review_order || []).map((x,i)=><div className="diag-line low" key={i}><b>{i+1}</b><span>{x}</span></div>)}
                </div>
                <div className="master-card">
                  <h4>No confundir</h4>
                  {(masterIndex.do_not_confuse || []).map((x,i)=><div className="diag-line warn" key={i}><b>{i+1}</b><span>{x}</span></div>)}
                </div>
              </div>
              <div className="opstable-wrap master-wrap">
                <table className="opstable master-table">
                  <thead><tr><th>#</th><th>Página</th><th>Rol</th><th>Qué revisar visualmente</th><th>Riesgo</th></tr></thead>
                  <tbody>{(masterIndex.visual_checklist || []).map((x,i)=><tr key={x.order || i}>
                    <td><b>{x.order}</b></td><td>{x.page}</td><td>{x.role}</td><td><small>{x.check}</small></td><td><small>{x.risk}</small></td>
                  </tr>)}</tbody>
                </table>
              </div>
              <div className="ops-json compact"><h4>Respuesta F51 para copiar/pegar</h4><pre>{JSON.stringify({ version:masterIndex.version, decision:masterIndex.decision, areas:(masterIndex.campus_areas || []).length, visual_checks:(masterIndex.visual_checklist || []).length, backend_smoke_plan:masterIndex.backend_smoke_plan, do_not_confuse:masterIndex.do_not_confuse, f50_summary:masterIndex.f50_summary }, null, 2)}</pre></div>
            </>}
          </div>

          <div className="ops-closure">
            <div className="ops-card-h"><b>Cierre F50 · paquete técnico de exámenes</b><span>{closure ? closure.release_decision : 'sin cargar'}</span></div>
            <div className="ops-actions compact">
              <button className="ad-meta-btn" disabled={loading} onClick={loadTechnicalClosure}>Cargar cierre F50</button>
            </div>
            <div className="ops-warning small">Solo lectura. Resume release, endpoints, hojas, orden de QA, riesgos abiertos y rollback. No habilita estudiante ni toca Mis Notas.</div>
            {closure && <>
              <div className="ops-kpis closure-kpis">
                <span><b>{closure.release_decision || '—'}</b> decisión release</span>
                <span><b>{closure.readiness_counts ? closure.readiness_counts.FAIL : 0}</b> bloqueos</span>
                <span><b>{closure.readiness_counts ? closure.readiness_counts.WARN : 0}</b> advertencias</span>
                <span><b>{closure.endpoint_map ? closure.endpoint_map.length : 0}</b> endpoints</span>
                <span><b>{closure.sheet_map ? closure.sheet_map.length : 0}</b> hojas/mapas</span>
              </div>
              <div className="closure-grid">
                <div className="closure-card">
                  <h4>Riesgos abiertos</h4>
                  {(closure.open_risks || []).map((x,i)=><div className={`diag-line ${String(x.level || '').toLowerCase()}`} key={i}>
                    <b>{x.level || '—'}</b><span>{x.risk} · {x.mitigation}</span>
                  </div>)}
                </div>
                <div className="closure-card">
                  <h4>No tocar</h4>
                  {(closure.do_not_touch || []).map((x,i)=><div className="diag-line warn" key={i}>
                    <b>{i+1}</b><span>{x}</span>
                  </div>)}
                </div>
                <div className="closure-card">
                  <h4>Rollback</h4>
                  {(closure.rollback_plan || []).slice(0, 7).map((x,i)=><div className={`diag-line ${String(x.severity || '').toLowerCase()}`} key={i}>
                    <b>{x.order}</b><span>{x.action}</span>
                  </div>)}
                </div>
              </div>
              <div className="opstable-wrap closure-wrap">
                <table className="opstable closure-table">
                  <thead><tr><th>#</th><th>Fase</th><th>Prueba QA</th><th>Criterio de aprobación</th></tr></thead>
                  <tbody>{(closure.qa_order || []).map((x,i)=><tr key={x.order || i}>
                    <td><b>{x.order}</b></td><td>{x.phase}</td><td><small>{x.test}</small></td><td><small>{x.pass}</small></td>
                  </tr>)}</tbody>
                </table>
              </div>
              <div className="ops-json compact"><h4>Respuesta F50 para copiar/pegar</h4><pre>{JSON.stringify({ version:closure.version, release_decision:closure.release_decision, readiness_decision:closure.readiness_decision, readiness_counts:closure.readiness_counts, open_risks:closure.open_risks, do_not_touch:closure.do_not_touch }, null, 2)}</pre></div>
            </>}
          </div>

          <div className="ops-diagnostic">
            <div className="ops-card-h"><b>Diagnóstico F48 · centro de pruebas controladas</b><span>{diagResult ? 'cargado' : 'sin cargar'}</span></div>
            <div className="ops-actions compact">
              <label className="ops-checkline"><input type="checkbox" checked={diagSample} onChange={e=>setDiagSample(e.target.checked)} /> <span>Incluir muestra sanitizada de últimas filas</span></label>
              <button className="ad-meta-btn" disabled={loading} onClick={loadDiagnosticCenter}>Cargar diagnóstico F48</button>
            </div>
            <div className="ops-warning small">Solo lectura. No crea intentos, no abre activaciones, no cierra revisiones y no toca Mis Notas. La respuesta sirve para pegarla después y revisar el estado real del backend.</div>
            {diagResult && <>
              <div className="ops-kpis diagnostic-kpis">
                <span><b>{diagResult.issues ? diagResult.issues.length : 0}</b> alertas</span>
                <span><b>{diagResult.counts ? diagResult.counts.activations : 0}</b> activaciones</span>
                <span><b>{diagResult.counts ? diagResult.counts.attempts : 0}</b> intentos</span>
                <span><b>{diagResult.counts ? diagResult.counts.reviews : 0}</b> revisiones</span>
                <span><b>{diagResult.counts ? diagResult.counts.audit_logs : 0}</b> logs</span>
                <span><b>{diagResult.server_now || '—'}</b> servidor</span>
              </div>
              <div className="diag-grid">
                <div className="diag-card">
                  <h4>Hojas</h4>
                  {(diagResult.sheets || []).map(s=><div className={`diag-line ${s.status === 'OK' ? 'ok' : 'warn'}`} key={s.sheet}>
                    <b>{s.sheet}</b><span>{s.exists ? `${s.data_rows || 0} filas · ${s.header_ok ? 'headers OK' : 'faltan headers'}` : 'no existe'}</span>
                  </div>)}
                </div>
                <div className="diag-card">
                  <h4>Endpoints</h4>
                  {(diagResult.endpoints || []).map(e=><div className={`diag-line ${e.function_exists ? 'ok' : 'warn'}`} key={e.endpoint}>
                    <b>{e.endpoint}</b><span>{e.function_exists ? 'función existe' : 'no existe'}</span>
                  </div>)}
                </div>
                <div className="diag-card">
                  <h4>Alertas</h4>
                  {!(diagResult.issues || []).length && <div className="diag-line ok"><b>Sin alertas</b><span>La estructura básica está completa.</span></div>}
                  {(diagResult.issues || []).map((x,i)=><div className={`diag-line ${String(x.severity || '').toLowerCase()}`} key={i}>
                    <b>{x.code || 'ISSUE'}</b><span>{x.message || JSON.stringify(x)}</span>
                  </div>)}
                </div>
              </div>
              <div className="ops-json compact"><h4>Respuesta F48 para copiar/pegar</h4><pre>{JSON.stringify({ version:diagResult.version, server_now:diagResult.server_now, counts:diagResult.counts, issues:diagResult.issues, config:diagResult.config }, null, 2)}</pre></div>
            </>}
          </div>

          <div className="ops-readiness">
            <div className="ops-card-h"><b>Checklist F49 · preparación para QA manual final</b><span>{qaReady ? qaReady.decision : 'sin cargar'}</span></div>
            <div className="ops-actions compact">
              <button className="ad-meta-btn" disabled={loading} onClick={loadQaReadiness}>Cargar checklist F49</button>
            </div>
            <div className="ops-warning small">Solo lectura. No reemplaza la prueba real: ordena bloqueos, advertencias y pruebas manuales que no se deben saltar antes de producción.</div>
            {qaReady && <>
              <div className="ops-kpis readiness-kpis">
                <span><b>{qaReady.decision || '—'}</b> decisión</span>
                <span><b>{qaReady.status_counts ? qaReady.status_counts.FAIL : 0}</b> bloqueos</span>
                <span><b>{qaReady.status_counts ? qaReady.status_counts.WARN : 0}</b> advertencias</span>
                <span><b>{qaReady.status_counts ? qaReady.status_counts.MANUAL : 0}</b> manuales</span>
                <span><b>{qaReady.status_counts ? qaReady.status_counts.PASS : 0}</b> listos</span>
              </div>
              <div className="readiness-grid">
                <div className="readiness-card">
                  <h4>Bloqueos / advertencias</h4>
                  {!(qaReady.blockers || []).length && !(qaReady.warnings || []).length && <div className="diag-line ok"><b>Sin bloqueos</b><span>No hay FAIL/WARN estructurales en esta lectura.</span></div>}
                  {(qaReady.blockers || []).concat(qaReady.warnings || []).slice(0, 10).map((x,i)=><div className={`diag-line ${String(x.status || '').toLowerCase()}`} key={x.id || i}>
                    <b>{x.id}</b><span>{x.label} · {x.evidence}</span>
                  </div>)}
                </div>
                <div className="readiness-card">
                  <h4>Pruebas manuales obligatorias</h4>
                  {(qaReady.items || []).filter(x=>String(x.status || '').toUpperCase()==='MANUAL').slice(0, 10).map((x,i)=><div className="diag-line manual" key={x.id || i}>
                    <b>{x.id}</b><span>{x.next_action}</span>
                  </div>)}
                </div>
                <div className="readiness-card">
                  <h4>Payloads sugeridos</h4>
                  {(qaReady.manual_probes || []).slice(0, 7).map((p,i)=><div className="diag-line" key={p.fn || i}>
                    <b>{p.order}. {p.fn}</b><span>{p.expected}</span>
                  </div>)}
                </div>
              </div>
              <div className="opstable-wrap readiness-wrap">
                <table className="opstable readiness-table">
                  <thead><tr><th>Estado</th><th>Área</th><th>Control</th><th>Evidencia</th><th>Siguiente acción</th></tr></thead>
                  <tbody>
                    {(qaReady.items || []).map((x,i)=><tr key={x.id || i}>
                      <td><span className={`actstatus qa-${String(x.status || '').toLowerCase()}`}>{x.status || '—'}</span></td>
                      <td><b>{x.area || '—'}</b></td>
                      <td><b>{x.id || '—'}</b><small>{x.label || '—'}</small></td>
                      <td><small>{x.evidence || '—'}</small></td>
                      <td><small>{x.next_action || '—'}</small></td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
              <div className="ops-json compact"><h4>Respuesta F49 para copiar/pegar</h4><pre>{JSON.stringify({ version:qaReady.version, decision:qaReady.decision, status_counts:qaReady.status_counts, blockers:qaReady.blockers, warnings:qaReady.warnings, manual_probes:qaReady.manual_probes }, null, 2)}</pre></div>
            </>}
          </div>


          <div className="ops-inbox">
            <div className="ops-card-h"><b>Bandeja F45 · revisión docente/admin</b><span>{inboxRows.length} visibles</span></div>
            <div className="ops-filterline">
              <label><span>Grupo</span><input value={inboxFilters.cod_grupo} onChange={e=>setInboxFilter('cod_grupo', e.target.value)} placeholder="B1-LM6..." /></label>
              <label><span>Nivel</span><select value={inboxFilters.nivel} onChange={e=>setInboxFilter('nivel', e.target.value)}><option value="">Todos</option><option>B1</option><option>B2</option><option>I1</option><option>I2</option></select></label>
              <label><span>Cola</span><select value={inboxFilters.queue} onChange={e=>setInboxFilter('queue', e.target.value)}><option value="NEEDS_ACTION">Requieren acción</option><option value="PENDING">Sin revisión</option><option value="IN_REVIEW">En revisión</option><option value="CLOSED_NOT_PUSHED">Cerradas sin Mis Notas</option><option value="PUSHED">Enviadas a Mis Notas</option><option value="STARTED">Iniciadas/no enviadas</option><option value="ALL">Todas</option></select></label>
              <label><span>Buscar</span><input value={inboxFilters.search} onChange={e=>setInboxFilter('search', e.target.value)} placeholder="nombre, código, intento" /></label>
              <label><span>Límite</span><input value={inboxFilters.limit} onChange={e=>setInboxFilter('limit', e.target.value)} placeholder="50" /></label>
              <button className="ad-meta-btn" disabled={loading} onClick={()=>loadInbox()}>Cargar bandeja</button>
            </div>
            {inboxSummary && <div className="ops-kpis">
              <span><b>{inboxSummary.needs_action || 0}</b> requieren acción</span>
              <span><b>{inboxSummary.submitted_without_review || 0}</b> sin revisión</span>
              <span><b>{inboxSummary.in_review || 0}</b> en revisión</span>
              <span><b>{inboxSummary.closed_not_pushed || 0}</b> sin Mis Notas</span>
              <span><b>{inboxSummary.pushed_to_notas || 0}</b> sincronizadas</span>
              <span><b>{inboxSummary.started || 0}</b> iniciadas</span>
            </div>}
            <div className="opstable-wrap inbox-wrap">
              <table className="opstable">
                <thead><tr><th>Cola</th><th>Estudiante</th><th>Examen</th><th>Revisión</th><th>Mis Notas</th><th>Acciones</th></tr></thead>
                <tbody>
                  {!inboxRows.length && <tr><td colSpan="6" className="actempty">Cargá la bandeja para ver intentos/revisiones unificados.</td></tr>}
                  {inboxRows.map((r,i)=>{
                    const bucket = String(r.bucket || '').toLowerCase();
                    const att = r.ATTEMPT_ID || '';
                    const rev = r.REVIEW_ID || '';
                    return <tr key={(att || rev || i)}>
                      <td><span className={`actstatus ${bucket}`}>{r.bucket || '—'}</span><small>{r.ATTEMPT_STATUS || '—'}</small></td>
                      <td><b>{r.NOMBRE || '—'}</b><small>{r.CODIGO || '—'} · {r.COD_GRUPO || '—'}</small></td>
                      <td><code>{r.EXAM_ID || '—'}</code><small>{r.NIVEL || '—'} · {compactDate(r.SUBMITTED_AT || r.STARTED_AT)}</small></td>
                      <td><b>{r.REVIEW_STATUS || 'PENDING'}</b><small>{rev || 'sin REVIEW_ID'} · nota {r.FINAL_SCORE_100 || '—'}</small></td>
                      <td><b>{r.PUSHED_TO_NOTAS || 'NO'}</b><small>{compactDate(r.PUSHED_AT)}</small></td>
                      <td className="ops-row-actions">
                        <button disabled={loading} onClick={()=>inspectAttempt(att)}>Ver</button>
                        <button disabled={loading || !att} onClick={()=>openInboxReview(r)}>{rev ? 'Cargar rev.' : 'Crear rev.'}</button>
                        <button disabled={loading || !rev || String(r.REVIEW_STATUS || '').toUpperCase() !== 'CLOSED' || String(r.PUSHED_TO_NOTAS || '').toUpperCase() === 'SI'} onClick={()=>pushReviewIdToNotas(rev, att)}>Mis Notas</button>
                      </td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>



          <div className="ops-signals">
            <div className="ops-card-h"><b>Señales F47 · antifraude e inconsistencias</b><span>{signalRows.length} visibles</span></div>
            <div className="ops-filterline signal-filterline">
              <label><span>Grupo</span><input value={signalFilters.cod_grupo} onChange={e=>setSignalFilter('cod_grupo', e.target.value)} placeholder="opcional admin / obligatorio docente" /></label>
              <label><span>Nivel</span><select value={signalFilters.nivel} onChange={e=>setSignalFilter('nivel', e.target.value)}><option value="">Todos</option><option>B1</option><option>B2</option><option>I1</option><option>I2</option></select></label>
              <label><span>Severidad</span><select value={signalFilters.severity} onChange={e=>setSignalFilter('severity', e.target.value)}><option value="">Todas</option><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select></label>
              <label><span>Tipo</span><select value={signalFilters.type} onChange={e=>setSignalFilter('type', e.target.value)}><option value="">Todos</option><option>TIME_LIMIT</option><option>DUPLICATE_ATTEMPT</option><option>REVIEW</option><option>MIS_NOTAS</option><option>AUDIT</option><option>DATA</option></select></label>
              <label><span>Buscar</span><input value={signalFilters.search} onChange={e=>setSignalFilter('search', e.target.value)} placeholder="estudiante, intento, código" /></label>
              <label><span>Límite</span><input value={signalFilters.limit} onChange={e=>setSignalFilter('limit', e.target.value)} placeholder="100" /></label>
              <button className="ad-meta-btn" disabled={loading} onClick={()=>loadIntegritySignals()}>Cargar señales</button>
            </div>
            {signalSummary && <div className="ops-kpis signal-kpis">
              <span><b>{signalSummary.critical || 0}</b> críticas</span>
              <span><b>{signalSummary.high || 0}</b> altas</span>
              <span><b>{signalSummary.medium || 0}</b> medias</span>
              <span><b>{signalSummary.low || 0}</b> bajas</span>
              <span><b>{signalSummary.attempts_scanned || 0}</b> intentos escaneados</span>
              <span><b>{signalSummary.reviews_scanned || 0}</b> revisiones escaneadas</span>
            </div>}
            <div className="opstable-wrap signal-wrap">
              <table className="opstable signal-table">
                <thead><tr><th>Severidad</th><th>Señal</th><th>Contexto</th><th>Evidencia</th><th>Acción sugerida</th></tr></thead>
                <tbody>
                  {!signalRows.length && <tr><td colSpan="5" className="actempty">Cargá señales para priorizar revisión humana. No bloquea ni acusa estudiantes.</td></tr>}
                  {signalRows.map((s,i)=>{
                    const ctx = s.context || {};
                    return <tr key={(s.code || 'SIG') + i}>
                      <td><span className={`actstatus ${String(s.severity || '').toLowerCase()}`}>{s.severity || '—'}</span><small>{s.type || '—'}</small></td>
                      <td><b>{s.title || s.code || '—'}</b><small>{s.code || '—'}</small></td>
                      <td><b>{ctx.NOMBRE || ctx.CODIGO || '—'}</b><small>{ctx.COD_GRUPO || '—'} · {ctx.NIVEL || '—'} · {ctx.ATTEMPT_ID || ctx.REVIEW_ID || '—'}</small></td>
                      <td><pre>{JSON.stringify(s.evidence || {}, null, 2).slice(0, 600)}</pre></td>
                      <td>{s.recommendation || 'Revisión manual.'}</td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <div className="ops-warning small">Estas señales no son sanciones. Son banderas para revisar manualmente antes de cerrar notas.</div>
          </div>

          <div className="ops-auditbox">
            <div className="ops-card-h"><b>Bitácora F46 · auditoría de exámenes</b><span>{auditRows.length} logs visibles</span></div>
            <div className="ops-filterline audit-filterline">
              <label><span>Grupo</span><input value={auditFilters.cod_grupo} onChange={e=>setAuditFilter('cod_grupo', e.target.value)} placeholder="opcional admin / obligatorio docente" /></label>
              <label><span>Nivel</span><select value={auditFilters.nivel} onChange={e=>setAuditFilter('nivel', e.target.value)}><option value="">Todos</option><option>B1</option><option>B2</option><option>I1</option><option>I2</option></select></label>
              <label><span>Acción</span><select value={auditFilters.action} onChange={e=>setAuditFilter('action', e.target.value)}><option value="">Todas</option><option value="ATTEMPT">Intentos</option><option value="REVIEW">Revisión</option><option value="NOTAS">Mis Notas</option><option value="AUDIT">Lecturas auditoría</option><option value="ERROR">Errores</option></select></label>
              <label><span>Target / intento</span><input value={auditFilters.target_id} onChange={e=>setAuditFilter('target_id', e.target.value)} placeholder="ATT/REV/ACT/LOG" /></label>
              <label><span>Buscar</span><input value={auditFilters.search} onChange={e=>setAuditFilter('search', e.target.value)} placeholder="actor, estudiante, acción" /></label>
              <label><span>Límite</span><input value={auditFilters.limit} onChange={e=>setAuditFilter('limit', e.target.value)} placeholder="100" /></label>
              <button className="ad-meta-btn" disabled={loading} onClick={()=>loadAuditTrail()}>Cargar bitácora</button>
            </div>
            {auditSummary && <div className="ops-kpis audit-kpis">
              <span><b>{auditSummary.returned || 0}</b> devueltos</span>
              <span><b>{auditSummary.student_flow || 0}</b> estudiante</span>
              <span><b>{auditSummary.review_flow || 0}</b> revisión</span>
              <span><b>{auditSummary.notas_flow || 0}</b> Mis Notas</span>
              <span><b>{auditSummary.errores || 0}</b> errores</span>
              <span><b>{auditSummary.warnings || 0}</b> alertas</span>
            </div>}
            <div className="opstable-wrap audit-wrap">
              <table className="opstable audit-table">
                <thead><tr><th>Fecha</th><th>Acción</th><th>Actor</th><th>Contexto</th><th>Detalle</th></tr></thead>
                <tbody>
                  {!auditRows.length && <tr><td colSpan="5" className="actempty">Cargá la bitácora para ver eventos reales de intentos, revisiones y sincronización.</td></tr>}
                  {auditRows.map((r,i)=>{
                    const ctx = r.CONTEXT || {};
                    const detail = r.DETAIL || {};
                    const action = String(r.ACTION || '').toLowerCase();
                    return <tr key={r.LOG_ID || i}>
                      <td><small>{compactDate(r.TS)}</small><code>{r.LOG_ID || 'LOG'}</code></td>
                      <td><span className={`actstatus ${action}`}>{r.ACTION || '—'}</span><small>{r.TARGET_TYPE || '—'} · {r.TARGET_ID || '—'}</small></td>
                      <td><b>{r.ACTOR_ROLE || '—'}</b><small>{r.ACTOR_ID || '—'}</small></td>
                      <td><b>{ctx.NOMBRE || ctx.CODIGO || '—'}</b><small>{ctx.COD_GRUPO || '—'} · {ctx.NIVEL || '—'} · {ctx.ATTEMPT_ID || ctx.REVIEW_ID || ctx.ACTIVATION_ID || '—'}</small></td>
                      <td><pre>{JSON.stringify(detail, null, 2).slice(0, 900)}</pre></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <div className="ops-warning small">Esta bitácora es lectura operativa. No corrige datos; solo deja evidencia para la revisión manual final.</div>
          </div>

          <div className="public-payload-box">
            <div className="public-payload-head">
              <b>Payload público estudiante · V10G</b>
              <span>Prueba sanitizada sin correct, accepted, audioScript, scripts ni keys</span>
            </div>
            <div className="ops-actions compact">
              <label><span>EXAM_ID</span><input value={publicExamId} onChange={e=>setPublicExamId(e.target.value)} placeholder="B1_WRITTEN_L18_TEST1_A" /></label>
              <label><span>Plan</span><select value={publicPlan} onChange={e=>setPublicPlan(e.target.value)}><option value="CON_INA">CON INA · 5%</option><option value="SIN_INA">SIN INA · 15%</option></select></label>
              <button className="btn-sm" disabled={loading} onClick={loadPublicPayload}>Probar payload público</button>
            </div>
            {publicPayload && (
              <div className="public-payload-result">
                <div><b>{publicPayload.id || publicPayload.exam_id}</b><span>{publicPayload.sections ? publicPayload.sections.length : 0} secciones · peso {publicPayload.weight_percent}%</span></div>
                <pre>{JSON.stringify({ id: publicPayload.id || publicPayload.exam_id, nivel: publicPayload.nivel, sections: publicPayload.sections ? publicPayload.sections.length : 0, payload_scope: publicPayload.payload_scope, security_note: publicPayload.security_note }, null, 2)}</pre>
              </div>
            )}
          </div>

          {msg && <div className="ex-okmsg">✓ {msg}</div>}
          {err && <div className="ex-errmsg">⚠ {err}</div>}

          <div className="ops-grid">
            <div className="ops-card">
              <div className="ops-card-h"><b>Intentos</b><span>{attempts.length}</span></div>
              <div className="opstable-wrap">
                <table className="opstable">
                  <thead><tr><th>Estado</th><th>Estudiante</th><th>Examen</th><th>Enviado</th><th></th></tr></thead>
                  <tbody>
                    {!attempts.length && <tr><td colSpan="5" className="actempty">Sin intentos registrados.</td></tr>}
                    {attempts.slice(0, 12).map((r,i)=>{
                      const id = r.ATTEMPT_ID || '';
                      return <tr key={id || i}>
                        <td><span className={`actstatus ${attemptStatusClass(r.STATUS)}`}>{r.STATUS || '—'}</span></td>
                        <td><b>{r.NOMBRE || '—'}</b><small>{r.CODIGO || '—'} · {r.COD_GRUPO || '—'}</small></td>
                        <td><code>{r.EXAM_ID || '—'}</code><small>{r.NIVEL || '—'} · {r.WEIGHT_PERCENT || '—'}%</small></td>
                        <td><small>{compactDate(r.SUBMITTED_AT)}</small></td>
                        <td><button onClick={()=>inspectAttempt(id)} disabled={loading}>Ver</button></td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="ops-card">
              <div className="ops-card-h"><b>Revisiones</b><span>{reviews.length}</span></div>
              <div className="opstable-wrap">
                <table className="opstable">
                  <thead><tr><th>Estado</th><th>Intento</th><th>Nota</th><th>Locked</th></tr></thead>
                  <tbody>
                    {!reviews.length && <tr><td colSpan="4" className="actempty">Sin revisiones registradas.</td></tr>}
                    {reviews.slice(0, 12).map((r,i)=><tr key={r.REVIEW_ID || i}>
                      <td><span className={`actstatus ${attemptStatusClass(r.REVIEW_STATUS)}`}>{r.REVIEW_STATUS || '—'}</span></td>
                      <td><code>{r.ATTEMPT_ID || '—'}</code><small>{r.REVIEWER_ROLE || '—'} · {compactDate(r.REVIEWED_AT)}</small></td>
                      <td><b>{r.FINAL_SCORE_100 || '—'}</b><small>{r.WEIGHTED_SCORE || '—'} pond.</small></td>
                      <td>{r.LOCKED || 'NO'}</td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {(selected || review) && <div className="ops-detail">
            {selected && <div className="ops-json"><h4>Intento seleccionado</h4><pre>{JSON.stringify(Object.assign({}, selected, { ANSWERS_JSON: parseJsonMaybe(selected.ANSWERS_JSON) || selected.ANSWERS_JSON }), null, 2)}</pre></div>}
            <div className="ops-reviewbox">
              <h4>Revisión admin · preparación</h4>
              {review ? <div className="ops-mini"><b>{review.REVIEW_ID}</b><span>{review.REVIEW_STATUS}</span></div> : <p>No hay revisión cargada todavía.</p>}
              <label><span>Nota final 0–100</span><input type="number" min="0" max="100" value={reviewDraft.final_score_100} onChange={e=>setReviewDraft(d=>Object.assign({}, d, { final_score_100:e.target.value }))} /></label>
              <label><span>Comentarios internos</span><textarea value={reviewDraft.comments} onChange={e=>setReviewDraft(d=>Object.assign({}, d, { comments:e.target.value }))} /></label>
              <label><span>Feedback estudiante</span><textarea value={reviewDraft.student_feedback} onChange={e=>setReviewDraft(d=>Object.assign({}, d, { student_feedback:e.target.value }))} /></label>
              <label className="ops-checkline"><input type="checkbox" checked={pushOnClose} onChange={e=>setPushOnClose(e.target.checked)} /> <span>Enviar a Mis Notas al cerrar esta revisión</span></label>
              <label className="ops-checkline"><input type="checkbox" checked={pushForce} onChange={e=>setPushForce(e.target.checked)} /> <span>Forzar reenvío si ya fue sincronizada</span></label>
              <div className="ops-actions tight">
                <button className="btn-sm" disabled={loading || !review} onClick={saveReview}>Guardar borrador backend</button>
                <button className="ad-meta-btn" disabled={loading || !review} onClick={closeReview}>Cerrar revisión backend</button>
                <button className="btn-sm" disabled={loading || !review || String(review.REVIEW_STATUS || '').toUpperCase() !== 'CLOSED'} onClick={pushReviewToNotas}>Pasar a Mis Notas</button>
              </div>
              <div className="ops-warning small">El botón de Mis Notas usa examPushReviewToNotas. Si EXAM_PUSH_TO_NOTAS_ENABLED está en NO, backend debe rechazarlo.</div>
              {lastPushResult && <div className="ops-json compact"><h4>Resultado Mis Notas</h4><pre>{JSON.stringify(lastPushResult, null, 2)}</pre></div>}
            </div>
          </div>}
        </div>
      )}
    </div>
  );
}

function TeacherBackendReviewPanel() {
  const [open, setOpen] = useState(false);
  const [grupo, setGrupo] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const load = async () => {
    const g = grupo.trim();
    if (!g) { setErr('Indicá un grupo para consultar revisiones reales.'); setMsg(''); return; }
    setLoading(true);
    const r = await postExamBackend('examReviewInbox', { cod_grupo:g, queue:'NEEDS_ACTION', limit:80 });
    setLoading(false);
    if (r && r.ok) { setRows(Array.isArray(r.rows) ? r.rows : []); setErr(''); setMsg(`Pendientes reales encontrados: ${r.total || 0} · requieren acción ${r.summary ? r.summary.needs_action : 0}`); }
    else { setRows([]); setMsg(''); setErr((r && (r.mensaje || r.error)) || 'No se pudo consultar backend.'); }
  };
  return (
    <div className="tch-realbox">
      <button className="tch-realbox-h" onClick={()=>setOpen(v=>!v)}>
        <div><b>Backend real · F48</b><span>Bandeja y señales por grupo propio</span></div>
        <span>{open ? '▴' : '▾'}</span>
      </button>
      {open && <div className="tch-realbox-b">
        <div className="tch-realrow">
          <input value={grupo} onChange={e=>setGrupo(e.target.value)} placeholder="Código de grupo" />
          <button className="btn-sm" disabled={loading} onClick={load}>Consultar revisiones</button>
        </div>
        <div className="tch-note compact"><b>Solo lectura operativa.</b> Esta bandeja no cierra ni envía notas; sirve para ubicar qué falta revisar.</div>
        {msg && <div className="ex-okmsg">✓ {msg}</div>}
        {err && <div className="ex-errmsg">⚠ {err}</div>}
        <div className="tch-real-list">
          {!rows.length && <div className="actempty">Sin revisiones reales para mostrar.</div>}
          {rows.map((r,i)=><div className="tch-real-item" key={r.ATTEMPT_ID || r.REVIEW_ID || i}>
            <b>{r.ATTEMPT_ID || 'ATT'}</b>
            <span>{r.bucket || '—'} · {r.NOMBRE || '—'} · {r.COD_GRUPO || '—'}</span>
            <em>{r.REVIEW_STATUS || 'PENDING'} · nota {r.FINAL_SCORE_100 || '—'}</em>
          </div>)}
        </div>
      </div>}
    </div>
  );
}


function BackendContractSpecPanel() {
  const [open, setOpen] = useState(false);
  const requiredFields = [
    ['activation_id', 'ID único generado por backend; nunca por URL ni por estudiante.'],
    ['grupo_codigo', 'Código del grupo activo que recibirá el examen.'],
    ['nivel', 'B1/B2/I1/I2 tomado del grupo o del plan académico, no editable por estudiante.'],
    ['exam_id', 'Debe existir en CATALOGO y en EXAMS para activación real.'],
    ['opcion', 'A ordinaria o B reposición/caso autorizado.'],
    ['plan_academico', 'con_ina/sin_ina para resolver ponderación 5%/15%.'],
    ['tipo_activacion', 'ordinario/reposicion/extraordinario.'],
    ['apertura/cierre', 'Ventana válida; backend bloquea fuera de horario.'],
    ['created_by', 'Usuario admin/superadmin que creó la activación.'],
    ['estado', 'draft/scheduled/open/closed/cancelled.'],
  ];
  const validations = [
    'No aceptar nivel/test/opción enviados por estudiante como fuente de verdad.',
    'No publicar si exam_id no existe como contenido oficial real.',
    'No permitir Opción B para ordinario salvo autorización explícita.',
    'No crear más de un intento abierto por estudiante y activación.',
    'No enviar nota a Mis Notas hasta cierre docente confirmado.',
    'Registrar auditoría de creación, apertura, cierre, revisión y cambios manuales.',
  ];
  const lifecycle = [
    ['DRAFT', 'Admin prepara activación; no visible para estudiantes.'],
    ['SCHEDULED', 'Guardada con fechas futuras; todavía cerrada.'],
    ['OPEN', 'Backend entrega payload estudiante sin claves ni scripts.'],
    ['SUBMITTED', 'Estudiante envía intento; queda pendiente de revisión.'],
    ['REVIEWED', 'Docente revisa y pre-cierra calificación.'],
    ['CLOSED', 'Admin/docente autorizado cierra y sincroniza con Mis Notas.'],
  ];
  return (
    <div className="specbox">
      <button className="specbox-h" onClick={()=>setOpen(v=>!v)}>
        <div>
          <div className="specbox-k">ESPECIFICACIÓN BACKEND · V9</div>
          <div className="specbox-t">Contrato técnico pendiente antes de habilitar estudiantes</div>
          <div className="specbox-s">Define campos, estados y validaciones. No ejecuta acciones ni guarda datos.</div>
        </div>
        <span className="specbox-state">Diseño interno</span>
        <span className="pmodel-chev">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="specbox-body">
          <div className="speccol">
            <h3>Campos obligatorios</h3>
            <div className="speclist">
              {requiredFields.map(([k,v])=>(
                <div key={k} className="specitem"><code>{k}</code><span>{v}</span></div>
              ))}
            </div>
          </div>
          <div className="speccol">
            <h3>Validaciones mínimas</h3>
            <ul className="specrules">{validations.map((v,i)=><li key={i}>{v}</li>)}</ul>
          </div>
          <div className="specflow">
            <h3>Ciclo recomendado</h3>
            <div className="flowgrid">
              {lifecycle.map(([k,v])=>(
                <div key={k} className="flowstep"><b>{k}</b><span>{v}</span></div>
              ))}
            </div>
          </div>
          <div className="specwarn">
            <b>No habilitar estudiante real todavía.</b> El payload de estudiante debe venir del backend sin <code>correct</code>, sin <code>accepted</code>, sin <code>audioScript</code> y sin metadatos administrativos sensibles.
          </div>
        </div>
      )}
    </div>
  );
}

function AdminMode({ shell, density, onPreview }) {
  const [filtro, setFiltro] = useState('todos');
  const [sel, setSel] = useState(null);
  const list = CATALOGO.filter(e => filtro==='todos' ? true : filtro==='real' ? e.estado==='real' : e.opcion===filtro);
  const real = CATALOGO.filter(e=>e.estado==='real').length;

  return (
    <div className="adwrap">
      <div className="ad-head">
        <div>
          <div className="ad-kicker">CATÁLOGO MAESTRO DE EXÁMENES · WRITTEN</div>
          <h2 className="ad-title">16 entradas · 4 niveles × Test 1/2 × Opción A/B</h2>
        </div>
        <div className="ad-legend">
          <span className="ad-leg"><i className="dot-real" />{real} con contenido real</span>
          <span className="ad-leg"><i className="dot-pend" />{CATALOGO.length-real} pendientes</span>
        </div>
      </div>

      <div className="ad-filters">
        {[['todos','Todos'],['A','Opción A'],['B','Opción B'],['real','Solo reales']].map(([k,l])=>(
          <button key={k} className={`ad-f${filtro===k?' on':''}`} onClick={()=>setFiltro(k)}>{l}</button>
        ))}
      </div>

      <PonderacionModelo />

      <ActivationBackendPanel onPreview={onPreview} />

      <BackendOperationsPanel />

      <BackendContractSpecPanel />

      <div className="ad-grid">
        {list.map(e => {
          const t = NIVEL_TEMA[e.nivel];
          return (
            <div key={e.id} className={`adcard estado-${e.estado}`} style={{ '--lvl':t.color, '--lvl-soft':t.soft, '--lvl-ink':t.ink }}>
              <div className="adcard-top">
                <span className="adcard-lvl">{t.code}</span>
                <span className={`mini-opt opt-${e.opcion}`}>{e.opcion}</span>
                <span className={`adcard-state ${e.estado}`}>{e.estado==='real'?'REAL':'PENDIENTE'}</span>
              </div>
              <div className="adcard-id">{e.id}</div>
              <div className="adcard-name">{e.nombre_nivel} · {e.test}</div>
              <div className="adcard-rows">
                <div><span>Libro (interno)</span>{e.libro}</div>
                <div><span>Units</span>{e.units}</div>
                <div><span>Lección</span>{e.leccion}</div>
                <div><span>Valor (plan)</span>{e.ponderacion_por_plan.con_ina}% / {e.ponderacion_por_plan.sin_ina}%</div>
                <div><span>Listening A</span><code className="vid-id">{e.videos.listening_A}</code></div>
                <div><span>Listening B</span><code className="vid-id">{e.videos.listening_B}</code></div>
                <div><span>Opción examen</span>{e.opcion}</div>
                <div><span>Answer key</span>{e.estado==='real'?'incluida':'pendiente'}</div>
              </div>
              <div className="adcard-foot">
                {e.estado==='real'
                  ? <><button className="btn-sm" onClick={()=>onPreview(e)}>Preview / Admin →</button><button className="ad-meta-btn" onClick={()=>setSel(e)}>Metadatos</button></>
                  : <span className="adcard-pendmsg">Sin contenido — no inventar preguntas</span>}
              </div>
            </div>
          );
        })}
      </div>

      {sel && <MetaModal e={sel} onClose={()=>setSel(null)} />}
    </div>
  );
}

function MetaModal({ e, onClose }) {
  const t = NIVEL_TEMA[e.nivel];
  const exam = (window.EXAMS || {})[e.id] || null;
  const secs = exam ? exam.sections : [];
  const secLetters = secs.map(s => s.letter);
  const secRange = secLetters.length ? `${secLetters[0]}–${secLetters[secLetters.length-1]} (${secLetters.length})` : '—';
  const revSecs = secs.filter(s => s.needsReview).map(s => s.letter);
  const meta = {
    id_examen:e.id, nivel:e.nivel, nombre_nivel:e.nombre_nivel, libro:e.libro,
    test:e.test, units:e.units, leccion:e.leccion, tipo:e.tipo,
    opcion:e.opcion,  // Opción A/B del EXAMEN (reposición/anti-trampa)
    estado:e.estado, oficial:e.oficial, contenido_real:e.contenido_real,
    puntos_totales:e.puntos_totales, color_nivel:e.color_nivel,
    ponderacion_configurable:e.ponderacion_configurable,
    ponderacion_fuente:e.ponderacion_fuente,
    ponderacion_por_plan:e.ponderacion_por_plan,  // { con_ina, sin_ina }
    fuente_original:e.fuente_original, answer_key_fuente:e.answer_key_fuente,
    audio_script_fuente:e.audio_script_fuente,
    videos:e.videos,  // listening_A / listening_B (sección del audio)
  };
  return (
    <div className="exov" onClick={onClose}>
      <div className="exov-card meta-card" onClick={ev=>ev.stopPropagation()}>
        <div className="exov-h"><h3>Metadatos · {e.id}</h3><button className="exov-x" onClick={onClose}>✕</button></div>
        <pre className="meta-json">{JSON.stringify(meta, null, 2)}</pre>
        <div className="meta-report">
          <b>Reporte de conversión</b>
          <ul>
            <li>Fuente Word/PDF: {e.fuente_original}</li>
            <li>Nivel detectado en archivo: "Test A · Interchange 3" (título del documento)</li>
            <li>Nivel final usado: <b>{e.nombre_nivel} ({e.nivel})</b> — el libro {t.libro} manda sobre el título</li>
            <li>Test: {e.test} · {e.units} · Lección {e.leccion}</li>
            <li>Total de puntos: {e.puntos_totales} · Secciones: {secRange}</li>
            <li>Videos: listening_A <code className="vid-id">{e.videos.listening_A}</code> · listening_B <code className="vid-id">{e.videos.listening_B}</code></li>
            <li>Ponderación: {e.ponderacion_por_plan.con_ina}% CON INA / {e.ponderacion_por_plan.sin_ina}% SIN INA (configurable por plan)</li>
            <li>Dudas detectadas: {revSecs.length ? `secciones ${revSecs.join(', ')} marcadas "requiere revisión docente" (respuestas con variación)` : 'ninguna'}</li>
            <li>Contenido inventado: <b>ninguno</b> — transcripción 1:1 del original. Sin mezclar otros exámenes.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { StudentMode, TeacherMode, AdminMode, themedExam, getExam, examIdDe });


// ===== examenes_app.jsx =====

// CAMPUS_F95_1_20260621_PAYLOAD_PUBLICO_MATCHING_SEGURO
// CALGRUPO_F51_20260617_INDICE_MAESTRO_CAMPUS_APP
// CALGRUPO_F50_20260617_CIERRE_TECNICO_EXAMENES_APP
// CALGRUPO_F49_20260617_CHECKLIST_QA_FINAL_EXAMENES_APP
// CALGRUPO_F48_20260617_CENTRO_DIAGNOSTICO_EXAMENES_APP
/* global React, ReactDOM, NIVEL_TEMA, StudentMode, TeacherMode, AdminMode, ExamShell, EXAM_I2_T1_A, themedExam */
// examenes_app.jsx — shell + barra de control (auditoría / tweaks)
// F95.0: no destructurar hooks en el ámbito global. examenes_modes.jsx ya
// declara esos nombres y los scripts clásicos comparten el mismo entorno léxico.

const VIEWS = [
  { k:'student', t:'Estudiante' },
  { k:'teacher', t:'Profesor' },
  { k:'teacher_preview', t:'Modelo docente' },
  { k:'admin',   t:'Administrador' },
  { k:'preview', t:'Preview' },
];

const VIEW_TITLES = VIEWS.reduce((m, v) => Object.assign(m, { [v.k]: v.t }), {});

function normalizeRole(rol) {
  const r = String(rol || '').trim().toLowerCase();
  if (r === 'superadmin' || r === 'admin') return 'admin';
  if (r === 'teacher') return 'teacher';
  if (r === 'student') return 'student';
  return '';
}

function getCampusParentSession() {
  try {
    if (!window.parent || window.parent === window) return null;
    if (typeof window.parent.getSesion !== 'function') return null;
    return window.parent.getSesion();
  } catch (_) {
    return null;
  }
}

function readRequestedView() {
  try {
    const params = new URLSearchParams(window.location.search || '');
    const raw = String(params.get('view') || '').trim().toLowerCase();
    return VIEWS.some(v => v.k === raw) ? raw : '';
  } catch (_) {
    return '';
  }
}

function readTeacherPreviewParams() {
  try {
    const p = new URLSearchParams(window.location.search || '');
    return {
      nivel: normalizeExamNivel(p.get('nivel')) || 'B1',
      test: normalizeExamTest(p.get('test')) || 'TEST1',
      opcion: normalizeExamOpcion(p.get('opcion')) || 'A',
      plan: normalizeExamPlan(p.get('plan')) || 'con_ina',
      grupo: String(p.get('grupo') || '').trim(),
    };
  } catch (_) {
    return { nivel:'B1', test:'TEST1', opcion:'A', plan:'con_ina', grupo:'' };
  }
}

function normalizeExamNivel(v) {
  const n = String(v || '').trim().toUpperCase();
  return ['B1','B2','I1','I2'].includes(n) ? n : '';
}

function normalizeExamTest(v) {
  const t = String(v || '').trim().toUpperCase();
  if (t === 'TEST1' || t === 'T1' || t === 'L18' || t === '18') return 'TEST1';
  if (t === 'TEST2' || t === 'T2' || t === 'L32' || t === '32') return 'TEST2';
  return '';
}

function normalizeExamOpcion(v) {
  const o = String(v || '').trim().toUpperCase();
  return o === 'A' || o === 'B' ? o : '';
}

function normalizeExamPlan(v) {
  const p = String(v || '').trim().toLowerCase();
  if (p === 'con_ina' || p === 'con ina' || p === 'ina' || p === 'conina') return 'con_ina';
  if (p === 'sin_ina' || p === 'sin ina' || p === 'sinina') return 'sin_ina';
  return '';
}

function resolveStudentAssignment(session) {
  if (!session || typeof session !== 'object') return null;

  // V6: no examen fijo de prueba. El estudiante solo carga contenido si la
  // sesión trae una asignación explícita desde el campus/backend futuro.
  // No se leen nivel/test/opción desde query params para evitar selección manual.
  const src = session.examenAsignado || session.examen_asignado || session.examAssignment || null;
  if (!src || typeof src !== 'object') return null;

  const nivel = normalizeExamNivel(src.nivel || src.level);
  const test = normalizeExamTest(src.test || src.prueba || src.leccion);
  const opcion = normalizeExamOpcion(src.opcion || src.option || src.variante);
  const plan = normalizeExamPlan(src.plan || src.programa || session.programa) || normalizeExamPlan(session.programa);

  if (!nivel || !test || !opcion || !plan) return null;
  return {
    nivel,
    test,
    opcion,
    plan,
    grupo: session.grupoActivo || session.grupo || '',
    codigo: session.codigo || '',
    nombre: session.nombre || '',
  };
}

function buildInitialViewConfig() {
  const requested = readRequestedView();
  const framed = (() => {
    try { return !!window.parent && window.parent !== window; }
    catch (_) { return false; }
  })();

  if (!framed) {
    return {
      authorized: false,
      view: 'blocked',
      role: '',
      requested,
      allowedViews: [],
      controls: false,
      locked: true,
      reason: 'Este módulo solo puede abrirse desde el campus principal.',
    };
  }

  const session = getCampusParentSession();
  const role = normalizeRole(session && session.rol);
  if (!role) {
    return {
      authorized: false,
      view: 'blocked',
      role: '',
      requested,
      allowedViews: [],
      controls: false,
      locked: true,
      reason: 'No se pudo validar una sesión activa del campus.',
    };
  }

  const allowedViewsByRole = {
    admin:   ['admin', 'preview'],
    teacher: ['teacher', 'teacher_preview'],
    student: ['student'],
  };
  const defaultViewByRole = {
    admin: 'admin',
    teacher: 'teacher',
    student: 'student',
  };

  const allowedViews = allowedViewsByRole[role] || [];
  const fallbackView = defaultViewByRole[role] || '';
  const view = requested || fallbackView;

  if (!allowedViews.includes(view)) {
    return {
      authorized: false,
      view: 'blocked',
      role,
      requested: view,
      allowedViews,
      controls: false,
      locked: true,
      reason: `La vista ${VIEW_TITLES[view] || view || 'solicitada'} no está autorizada para este rol.`,
    };
  }

  return {
    authorized: true,
    view,
    role,
    requested: view,
    allowedViews,
    controls: role === 'admin',
    locked: role !== 'admin',
    reason: '',
    studentAssignment: role === 'student' ? resolveStudentAssignment(session) : null,
  };
}

const INITIAL_VIEW_CONFIG = buildInitialViewConfig();


// CALGRUPO_F27_20260617_EXAMENES_ESTUDIANTE_LIVE_BACKEND
// CALGRUPO_F43_20260617_EXAMENES_ESTUDIANTE_QA_AUTOSAVE_TIMER
function examParentApiUrl() {
  try {
    if (window.parent && window.parent !== window && window.parent.APPS_SCRIPT_URL) return window.parent.APPS_SCRIPT_URL;
  } catch (_) {}
  try { return window.APPS_SCRIPT_URL || ''; } catch (_) { return ''; }
}
function examParentToken() {
  try {
    if (window.parent && window.parent !== window && typeof window.parent.getSessionToken === 'function') return window.parent.getSessionToken() || '';
  } catch (_) {}
  try { return window.getSessionToken ? window.getSessionToken() : ''; } catch (_) { return ''; }
}
async function examPostLive(fn, payload = {}) {
  const url = examParentApiUrl();
  if (!url) return { ok:false, error:'apps_script_url_no_disponible', mensaje:'No se encontró la URL del backend del campus.' };
  const token = examParentToken();
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutMs = 25000;
  const timeoutId = setTimeout(() => {
    try { if (controller) controller.abort(); } catch (_) {}
  }, timeoutMs);
  try {
    const res = await fetch(`${url}?fn=${encodeURIComponent(fn)}`, {
      method: 'POST',
      headers: { 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ fn, token }, payload || {})),
      signal: controller ? controller.signal : undefined,
      cache: 'no-store',
    });
    const raw = await res.text();
    let data = null;
    try { data = raw ? JSON.parse(raw) : {}; }
    catch (_) {
      return {
        ok:false,
        error:'respuesta_backend_no_json',
        mensaje:`El backend respondió en un formato inválido (HTTP ${res.status}). Volvé a cargar el Campus; si continúa, revisá la implementación de Apps Script.`,
      };
    }
    if (!res.ok && data && data.ok !== false) {
      return Object.assign({}, data, {
        ok:false,
        error:data.error || `http_${res.status}`,
        mensaje:data.mensaje || `El backend respondió con HTTP ${res.status}.`,
      });
    }
    return data;
  } catch (err) {
    if (err && err.name === 'AbortError') {
      return {
        ok:false,
        error:'backend_timeout',
        mensaje:'El backend tardó más de 25 segundos en responder. No se dejó la pantalla congelada: presioná “Actualizar estado”.',
      };
    }
    return {
      ok:false,
      error:'backend_fetch_error',
      mensaje:String(err && err.message ? err.message : 'No se pudo conectar con Apps Script.'),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
function parseExamAnswersJson(v) {
  if (!v) return {};
  if (typeof v === 'object') return v;
  try { return JSON.parse(String(v || '{}')); } catch (_) { return {}; }
}
function activationToStudentConfig(activation) {
  const a = activation || {};
  const nivel = normalizeExamNivel(a.NIVEL || a.nivel);
  const test = normalizeExamTest(a.TEST_CODE || a.test_code || a.LECCION || a.leccion);
  const opcion = normalizeExamOpcion(a.OPCION || a.opcion);
  const plan = normalizeExamPlan(a.PLAN || a.plan) || 'con_ina';
  return { nivel, test, opcion, plan };
}
function StudentLiveLoading() {
  return (
    <div style={{ maxWidth:620, margin:'72px auto', padding:'30px 32px', borderRadius:18, background:'#fff', border:'1px solid #E2D8C8', boxShadow:'0 18px 60px rgba(0,0,0,0.10)', fontFamily:'Poppins, system-ui, sans-serif', textAlign:'center', color:'#001E47' }}>
      <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase', color:'#7A1E2C', marginBottom:12 }}>Consultando cronograma</div>
      <h2 style={{ margin:'0 0 8px', fontSize:26 }}>Buscando examen disponible…</h2>
      <p style={{ color:'#5A6472', fontSize:14 }}>El sistema valida tu grupo, la lección activa y la activación oficial.</p>
    </div>
  );
}
function StudentLiveStatusCard({ title, badge='Examen no disponible', children, tone='gold', onRefresh }) {
  const bg = tone === 'red' ? '#F7E8E9' : tone === 'blue' ? '#E2EFF8' : '#FFF5D6';
  const ink = tone === 'red' ? '#7A1E2C' : tone === 'blue' ? '#0C447C' : '#7A4A00';
  return (
    <div style={{ maxWidth:660, margin:'72px auto', padding:'30px 32px', borderRadius:18, background:'#fff', border:'1px solid #E2D8C8', boxShadow:'0 18px 60px rgba(0,0,0,0.10)', fontFamily:'Poppins, system-ui, sans-serif', textAlign:'center', color:'#001E47' }}>
      <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'5px 12px', borderRadius:999, background:bg, color:ink, fontSize:11, fontWeight:800, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:14 }}>{badge}</div>
      <h2 style={{ margin:'0 0 8px', fontSize:26, letterSpacing:'-0.03em' }}>{title}</h2>
      <div style={{ margin:'0 auto 18px', maxWidth:530, color:'#5A6472', fontSize:14, lineHeight:1.55 }}>{children}</div>
      {onRefresh && <button className="btn-primary" onClick={onRefresh}>Actualizar estado</button>}
    </div>
  );
}
function StudentLiveExamApp() {
  const [live, setLive] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [attemptId, setAttemptId] = React.useState('');
  const [publicExam, setPublicExam] = React.useState(null);
  const [currentAttempt, setCurrentAttempt] = React.useState(null);

  const load = React.useCallback(() => {
    setLoading(true); setError('');
    const ses = getCampusParentSession() || {};
    examPostLive('examGetStudentLivePanel', {
      cod_grupo_hint: ses.grupoActivo || ses.grupo || ses.cod_grupo || '',
      nivel_hint: ses.nivel_activo || ses.nivel || '',
      codigo_hint: ses.codigo || '',
      client_meta:{ source:'student_iframe_f95_runtime_group_resolution' }
    })
      .then(r => {
        if (!r || r.ok === false) {
          // CALGRUPO_F52_20260617_EXAMENES_BACKEND_DESFASADO_MSG
          // Compatibilidad: si el backend F27/F43+ aún no está instalado, intenta
          // el endpoint viejo. Si también falla, mostramos un mensaje accionable.
          const errTxt = String((r && (r.error || r.mensaje)) || '').toLowerCase();
          if (r && (errTxt.includes('desconocid') || errTxt.includes('no reconoc'))) {
            return examPostLive('examGetStudentAssignment', { client_meta:{ source:'student_iframe_f52_fallback_backend_desfasado' } });
          }
          throw r || { error:'respuesta_invalida' };
        }
        return r;
      })
      .then(r => {
        if (!r || r.ok === false) throw r || { error:'respuesta_invalida' };
        setLive(r);
        const a = r.current_attempt || null;
        setCurrentAttempt(a);
        setAttemptId(a && a.ATTEMPT_ID || '');
        setPublicExam(r.public_exam || null);
      })
      .catch(e => {
        const raw = (e && (e.mensaje || e.error)) || 'No se pudo consultar el backend de exámenes.';
        const txt = String(raw);
        if (/no reconoc|desconocid/i.test(txt)) {
          setError('El frontend ya está en F95.1, pero el Apps Script publicado no reconoce los endpoints de exámenes. Actualizá y desplegá el Apps Script v5.89.0 F95.0 en Apps Script; subir GitHub solo no basta para esta sección. Detalle: ' + txt);
        } else {
          setError(txt);
        }
      })
      .finally(() => setLoading(false));
  }, []);
  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    if (!(live && live.preparing)) return;
    const timer = window.setTimeout(load, 3500);
    return () => window.clearTimeout(timer);
  }, [live && live.preparing, load]);

  const activation = live && live.activation;
  const cfg = activationToStudentConfig(activation || {});
  const initialAnswers = parseExamAnswersJson(currentAttempt && (currentAttempt.ANSWERS_JSON || currentAttempt.answers_json));

  const startAttempt = async () => {
    const r = await examPostLive('examStartAttempt', { activation_id: activation && activation.ACTIVATION_ID, client_meta:{ source:'student_iframe_f43_start' }, user_agent: navigator.userAgent });
    if (r && r.ok) {
      setAttemptId(r.attempt_id || '');
      setPublicExam(r.public_exam || publicExam);
      setCurrentAttempt({ ATTEMPT_ID:r.attempt_id, STATUS:'STARTED', STARTED_AT:r.started_at || r.server_now || '', ANSWERS_JSON:'{}' });
    }
    return r;
  };
  const saveAttempt = async (answers, meta = {}) => {
    const source = meta && meta.source === 'auto' ? 'student_iframe_f95_auto_save' : 'student_iframe_f95_manual_save';
    return await examPostLive('examSaveAttemptDraft', { attempt_id: attemptId, answers, client_meta:{ source, answered:Object.keys(answers || {}).length } });
  };
  const submitAttempt = async (answers, meta = {}) => {
    const autoSubmit = !!(meta && meta.autoSubmit);
    const r = await examPostLive('examSubmitAttempt', {
      attempt_id: attemptId,
      answers,
      time_spent_sec: meta && meta.timeSpentSec != null ? meta.timeSpentSec : '',
      auto_submit: autoSubmit ? 'SI' : 'NO',
      client_meta:{ source:autoSubmit ? 'student_iframe_f43_auto_submit_timeout' : 'student_iframe_f43_submit', answered:Object.keys(answers || {}).length }
    });
    if (r && r.ok) setCurrentAttempt(Object.assign({}, currentAttempt || {}, { STATUS:'SUBMITTED', SUBMITTED_AT:r.server_now || '' }));
    return r;
  };
  const heartbeatAttempt = async () => {
    return await examPostLive('examHeartbeatAttempt', { attempt_id: attemptId, client_meta:{ source:'student_iframe_f43_heartbeat' } });
  };

  if (loading) return <StudentLiveLoading />;
  if (error) return <StudentLiveStatusCard title="No se pudo abrir exámenes" badge="Error de conexión" tone="red" onRefresh={load}>{error}</StudentLiveStatusCard>;
  if (live && live.enabled === false) return <StudentLiveStatusCard title="Exámenes aún deshabilitados" badge="Configuración pendiente" tone="blue" onRefresh={load}>{live.mensaje || 'El backend está instalado, pero la configuración STUDENT_EXAMS_ENABLED todavía no está activa.'}</StudentLiveStatusCard>;
  if (live && live.preparing) return <StudentLiveStatusCard title="Preparando tu examen" badge="Reintento automático" tone="blue" onRefresh={load}>{live.mensaje || 'La clase está abierta. El sistema está creando una única activación y volverá a consultar en unos segundos.'}</StudentLiveStatusCard>;
  if (!live || live.assigned !== true || !activation) {
    const msg = live && (live.mensaje || (live.availability && live.availability.mensaje));
    return <StudentLiveStatusCard title="No hay examen disponible" onRefresh={load}>{msg || 'No hay una sesión docente abierta de la lección 18 o 32 para tu matrícula activa.'}</StudentLiveStatusCard>;
  }
  const submitted = currentAttempt && String(currentAttempt.STATUS || '').toUpperCase() === 'SUBMITTED';
  if (submitted) return <StudentLiveStatusCard title="Examen ya enviado" badge="En revisión docente" tone="blue" onRefresh={load}>Tu intento fue recibido correctamente. La nota final aparecerá cuando el docente complete la revisión.</StudentLiveStatusCard>;

  return <StudentMode
    shell="premium" density="comfy"
    nivel={cfg.nivel} test={cfg.test} opcion={cfg.opcion} plan={cfg.plan}
    examOverride={publicExam}
    assignment={activation}
    backend={{ attemptId, initialAnswers, onStart:startAttempt, onSave:saveAttempt, onSubmit:submitAttempt, onHeartbeat:heartbeatAttempt, student: live.student || null, activation, timeLimitMin:Number(activation && activation.TIME_LIMIT_MIN || 0) || 0, startedAt:currentAttempt && currentAttempt.STARTED_AT || '' }}
  />;
}

function TeacherPreviewLiveApp() {
  const cfg = React.useMemo(() => readTeacherPreviewParams(), []);
  const [showKey, setShowKey] = React.useState(false);
  const [scriptSec, setScriptSec] = React.useState(null);
  const exam = window.getExam ? window.getExam(cfg.nivel, cfg.test, cfg.opcion) : null;
  const tema = NIVEL_TEMA[cfg.nivel] || NIVEL_TEMA.B1;
  if (!exam) return <StudentLiveStatusCard title="Modelo no disponible" badge="Revisar catálogo" tone="red">No existe contenido para {cfg.nivel} · {cfg.test} · Opción {cfg.opcion}.</StudentLiveStatusCard>;
  return (
    <div className="pvwrap" style={{paddingTop:0}}>
      <div style={{position:'sticky',top:0,zIndex:40,display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',padding:'12px 16px',background:'#fff',borderBottom:'1px solid #E2D8C8',boxShadow:'0 8px 20px rgba(0,30,71,.07)'}}>
        <div>
          <div style={{fontSize:10,fontWeight:900,letterSpacing:'.14em',color:'#7A1E2C'}}>MODELO DOCENTE · VISTA SEGURA</div>
          <div style={{fontSize:15,fontWeight:900,color:'#001E47',marginTop:2}}>{cfg.grupo || 'Grupo'} · {cfg.nivel} · {cfg.test==='TEST2'?'2.º examen escrito':'1.er examen escrito'} · Opción {cfg.opcion}</div>
          <div style={{fontSize:11.5,color:'#667085',marginTop:2}}>{showKey?'Las respuestas y guiones están visibles. No proyectés esta vista al estudiante.':'Así lo ve el estudiante, sin respuestas correctas ni guiones.'}</div>
        </div>
        <button type="button" onClick={()=>setShowKey(v=>!v)} style={{border:`1.5px solid ${showKey?'#7A1E2C':'#003B7A'}`,background:showKey?'#F7E8E9':'#E7F1FA',color:showKey?'#7A1E2C':'#003B7A',padding:'10px 14px',borderRadius:10,fontWeight:900,cursor:'pointer',fontFamily:'inherit'}}>{showKey?'OCULTAR RESPUESTAS':'VER RESPUESTAS'}</button>
      </div>
      <div className="pv-banner" style={{'--lvl':tema.color,'--lvl-soft':tema.soft,'--lvl-ink':tema.ink,marginTop:12}}>
        <span className="pv-tag">{showKey?'CLAVE DOCENTE':'VISTA ESTUDIANTE'}</span>
        <span>{exam.id}</span>
        <span className="pv-dim">· audio disponible · el guion aparece únicamente al mostrar respuestas</span>
      </div>
      <ExamShell exam={exam} answers={{}} mode="preview" showKey={showKey} shell="premium" density="comfy" plan={cfg.plan}
        onOpenScript={setScriptSec}
        meta={{nombre:'Modelo para el docente',fecha:'',grupo:cfg.grupo,opcion:cfg.opcion,scoreLabel:'solo lectura'}} />
      <PvScript section={scriptSec} exam={exam} onClose={()=>setScriptSec(null)} />
    </div>
  );
}

function App() {
  const [view, setViewRaw] = React.useState(INITIAL_VIEW_CONFIG.view);
  const [nivel, setNivel] = React.useState('I2');
  const [test, setTest] = React.useState('TEST1'); // TEST1 (L18) | TEST2 (L32)
  const [opcion, setOpcion] = React.useState('A');
  const [shell, setShell] = React.useState('premium');
  const [density, setDensity] = React.useState('comfy');
  const [previewKey, setPreviewKey] = React.useState(true);
  const [previewExam, setPreviewExam] = React.useState(null);
  const [plan, setPlan] = React.useState('ambos'); // ambos | con_ina | sin_ina

  const canEnter = (target) => INITIAL_VIEW_CONFIG.allowedViews.includes(target);
  const setView = (target) => {
    if (!canEnter(target)) return;
    setViewRaw(target);
  };
  const goPreview = (entry) => {
    if (!canEnter('preview')) return;
    setPreviewExam(entry);
    setViewRaw('preview');
  };

  if (!INITIAL_VIEW_CONFIG.authorized) {
    return <AccessBlockedView config={INITIAL_VIEW_CONFIG} />;
  }

  // F27: estudiante conectado a Apps Script. Ya no depende de una asignación
  // manual en sesión: lee cronograma + activación oficial + intento real.
  if (INITIAL_VIEW_CONFIG.role === 'student') {
    return (
      <div className="exapp">
        <main className="exmain">
          <StudentLiveExamApp />
        </main>
      </div>
    );
  }

  // Docente: vista operativa limpia, sin mensajes técnicos ni controles de administrador.
  if (INITIAL_VIEW_CONFIG.role === 'teacher') {
    return (
      <div className="exapp">
        <main className="exmain">
          {INITIAL_VIEW_CONFIG.view === 'teacher_preview'
            ? <TeacherPreviewLiveApp />
            : <TeacherMode shell="premium" density="comfy" />}
        </main>
      </div>
    );
  }

  return (
    <div className="exapp">
      {INITIAL_VIEW_CONFIG.controls && (
        <ControlBar {...{
          view, setView, allowedViews: INITIAL_VIEW_CONFIG.allowedViews,
          nivel, setNivel, test, setTest, opcion, setOpcion,
          shell, setShell, density, setDensity, previewKey, setPreviewKey, plan, setPlan
        }} />
      )}
      <main className="exmain">
        {view==='admin'   && <AdminMode shell={shell} density={density} onPreview={goPreview} />}
        {view==='preview' && <PreviewMode shell={shell} density={density} nivel={nivel} test={test} opcion={opcion} showKey={previewKey} entry={previewExam} plan={plan} />}
      </main>
    </div>
  );
}

function AccessBlockedView({ config }) {
  return (
    <div className="exapp">
      <main className="exmain">
        <div style={{
          maxWidth: 620, margin: '72px auto', padding: '30px 32px',
          borderRadius: 18, background: '#fff', border: '1px solid #E2D8C8',
          boxShadow: '0 18px 60px rgba(0,0,0,0.10)', fontFamily: 'Poppins, system-ui, sans-serif',
          textAlign: 'center', color: '#001E47',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px',
            borderRadius: 999, background: '#F7E8E9', color: '#7A1E2C', fontSize: 11,
            fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14,
          }}>Acceso restringido</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 26, letterSpacing: '-0.03em' }}>Panel de exámenes no disponible</h2>
          <p style={{ margin: '0 auto 18px', maxWidth: 500, color: '#5A6472', fontSize: 14, lineHeight: 1.55 }}>
            {config.reason || 'Esta vista no está autorizada para la sesión actual.'}
          </p>
          <div style={{
            display: 'grid', gap: 8, maxWidth: 430, margin: '0 auto', padding: 12,
            borderRadius: 14, background: '#F8F6F1', color: '#4A413A', fontSize: 12.5,
            textAlign: 'left',
          }}>
            <div><b>Vista solicitada:</b> {VIEW_TITLES[config.requested] || config.requested || 'ninguna'}</div>
            <div><b>Rol detectado:</b> {config.role || 'sin validar'}</div>
            <div><b>Regla:</b> abrir siempre desde el campus principal y según rol.</div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StudentNoAssignmentView() {
  return (
    <div style={{
      maxWidth: 640, margin: '72px auto', padding: '30px 32px',
      borderRadius: 18, background: '#fff', border: '1px solid #E2D8C8',
      boxShadow: '0 18px 60px rgba(0,0,0,0.10)', fontFamily: 'Poppins, system-ui, sans-serif',
      textAlign: 'center', color: '#001E47',
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px',
        borderRadius: 999, background: '#FFF5D6', color: '#7A4A00', fontSize: 11,
        fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14,
      }}>Examen no asignado</div>
      <h2 style={{ margin: '0 0 8px', fontSize: 26, letterSpacing: '-0.03em' }}>No hay examen disponible</h2>
      <p style={{ margin: '0 auto 18px', maxWidth: 520, color: '#5A6472', fontSize: 14, lineHeight: 1.55 }}>
        El estudiante no puede escoger exámenes manualmente. Para mostrar un examen real,
        el campus debe recibir una asignación oficial desde cronograma/backend.
      </p>
      <div style={{
        display: 'grid', gap: 8, maxWidth: 460, margin: '0 auto', padding: 12,
        borderRadius: 14, background: '#F8F6F1', color: '#4A413A', fontSize: 12.5,
        textAlign: 'left',
      }}>
        <div><b>Regla:</b> sin asignación explícita no se carga ningún examen.</div>
        <div><b>Estado:</b> pendiente de activación real con backend.</div>
        <div><b>Seguridad:</b> se eliminó la asignación fija de demostración.</div>
      </div>
    </div>
  );
}


function ControlBar({ view, setView, allowedViews, nivel, setNivel, test, setTest, opcion, setOpcion, shell, setShell, density, setDensity, previewKey, setPreviewKey, plan, setPlan }) {
  const showKeyToggle = view==='preview';
  return (
    <div className="cbar">
      <div className="cbar-banner">
        <span className="cbar-eye">●</span>
        Exámenes institucionales · <b>Academia Norteamericana</b>
        <button type="button" onClick={()=>window.print()} style={{marginLeft:'auto',border:'1px solid currentColor',background:'#fff',color:'#073B7A',borderRadius:8,padding:'6px 10px',fontWeight:800,cursor:'pointer'}}>Imprimir / Guardar PDF</button>
      </div>
      <div className="cbar-row">
      <div className="cbar-brand">
        <img className="cbar-logo" src="../assets/logo_circular.jpg" alt="Academia Norteamericana" />
        <div>
          <div className="cbar-t">Exámenes · Sistema maestro</div>
          <div className="cbar-s">Catálogo administrativo · EXAM-MASTER-001</div>
        </div>
      </div>

      <div className="cbar-group">
        <label>Vista</label>
        <div className="seg">
          {VIEWS.filter(v => allowedViews.includes(v.k)).map(v => (
            <button key={v.k} className={view===v.k?'on':''} onClick={()=>setView(v.k)}>{v.t}</button>
          ))}
        </div>
      </div>

      <div className="cbar-group">
        <label>Prueba (test)</label>
        <div className="seg seg-sm">
          {[["TEST1","Prueba 1"],["TEST2","Prueba 2"]].map(([k,l]) =>
            <button key={k} className={test===k?'on':''} onClick={()=>setTest(k)}>{l}</button>)}
        </div>
      </div>

      <div className="cbar-group">
        <label>Opción asignada (examen)</label>
        <div className="seg seg-sm">
          {['A','B'].map(o => <button key={o} className={opcion===o?'on':''} onClick={()=>setOpcion(o)}>{o}</button>)}
        </div>
      </div>

      <div className="cbar-group">
        <label>Plan académico</label>
        <div className="seg seg-sm">
          {[["ambos","Ambos"],["con_ina","CON INA"],["sin_ina","SIN INA"]].map(([k,l]) =>
            <button key={k} className={plan===k?'on':''} onClick={()=>setPlan(k)}>{l}</button>)}
        </div>
      </div>

      <div className="cbar-group">
        <label>Tema por nivel</label>
        <div className="lvlswatches">
          {Object.keys(NIVEL_TEMA).map(k => (
            <button key={k} className={`lvlsw${nivel===k?' on':''}`} title={NIVEL_TEMA[k].nombre}
                    style={{ background:NIVEL_TEMA[k].color }} onClick={()=>setNivel(k)}>{nivel===k?NIVEL_TEMA[k].code:''}</button>
          ))}
        </div>
      </div>

      <div className="cbar-group">
        <label>Formato</label>
        <div className="seg seg-sm">
          {[["premium","Premium"],["compact","Compacto"],["sheet","Hoja"]].map(([k,l]) =>
            <button key={k} className={shell===k?'on':''} onClick={()=>setShell(k)}>{l}</button>)}
        </div>
      </div>

      <div className="cbar-group">
        <label>Densidad</label>
        <div className="seg seg-sm">
          {[["comfy","Cómoda"],["compact","Compacta"]].map(([k,l]) =>
            <button key={k} className={density===k?'on':''} onClick={()=>setDensity(k)}>{l}</button>)}
        </div>
      </div>

      <div className={`cbar-group${showKeyToggle?'':' dim'}`}>
        <label>Clave / preliminar</label>
        <button className={`tgl${previewKey?' on':''}`} disabled={!showKeyToggle} onClick={()=>setPreviewKey(v=>!v)}>
          <span className="tgl-dot" />{previewKey?'Visible':'Oculta'}
        </button>
      </div>
      </div>
    </div>
  );
}

// Preview/admin: el examen con o sin clave, tema por nivel
function PreviewMode({ shell, density, nivel, test='TEST1', opcion, showKey, entry, plan }) {
  const [scriptSec, setScriptSec] = React.useState(null);
  // Si viene una entrada del catálogo, usa su nivel/test/opción; si no, los
  // controles de auditoría.
  const eNivel = entry ? entry.nivel : nivel;
  const eTest  = entry ? (entry.leccion === 18 ? 'TEST1' : 'TEST2') : test;
  const eOpcion = entry ? entry.opcion : opcion;
  const tema = NIVEL_TEMA[eNivel];
  const exam = window.getExam ? window.getExam(eNivel, eTest, eOpcion) : null;
  const esReal = !!exam;
  const esDemoTema = eNivel !== 'I2' && eNivel !== 'I1' && eNivel !== 'B2' && eNivel !== 'B1'; // tema visual de otro nivel
  const SAMPLES = {
    'I2_WRITTEN_L18_TEST1_A': window.SUBMISSION_DEMO,
    'I2_WRITTEN_L18_TEST1_B': window.SUBMISSION_DEMO_I2_T1_B,
    'I2_WRITTEN_L32_TEST2_A': window.SUBMISSION_DEMO_T2,
    'I2_WRITTEN_L32_TEST2_B': window.SUBMISSION_DEMO_I2_T2_B,
    'I1_WRITTEN_L18_TEST1_A': window.SUBMISSION_DEMO_I1_T1,
    'I1_WRITTEN_L18_TEST1_B': window.SUBMISSION_DEMO_I1_T1_B,
    'I1_WRITTEN_L32_TEST2_A': window.SUBMISSION_DEMO_I1_T2,
    'I1_WRITTEN_L32_TEST2_B': window.SUBMISSION_DEMO_I1_T2_B,
    'B2_WRITTEN_L18_TEST1_A': window.SUBMISSION_DEMO_B2_T1,
    'B2_WRITTEN_L18_TEST1_B': window.SUBMISSION_DEMO_B2_T1_B,
    'B2_WRITTEN_L32_TEST2_A': window.SUBMISSION_DEMO_B2_T2,
    'B2_WRITTEN_L32_TEST2_B': window.SUBMISSION_DEMO_B2_T2_B,
    'B1_WRITTEN_L18_TEST1_A': window.SUBMISSION_DEMO_B1_T1,
    'B1_WRITTEN_L32_TEST2_A': window.SUBMISSION_DEMO_B1_T2,
    'B1_WRITTEN_L18_TEST1_B': window.SUBMISSION_DEMO_B1_T1_B,
    'B1_WRITTEN_L32_TEST2_B': window.SUBMISSION_DEMO_B1_T2_B,
  };
  const sample = ((exam && SAMPLES[exam.id]) || window.SUBMISSION_DEMO).respuestas;
  const id = entry ? entry.id : window.examIdDe(eNivel, eTest, eOpcion);
  return (
    <div className="pvwrap">
      <div className="pv-banner" style={{ '--lvl':tema.color, '--lvl-soft':tema.soft, '--lvl-ink':tema.ink }}>
        <span className="pv-tag">PREVIEW / ADMIN</span>
        <span>{id}</span>
        <span className="pv-dim">· {esReal ? (showKey ? 'clave + corrección preliminar visibles' : 'clave oculta (vista estudiante)') : 'sin contenido real'}</span>
      </div>
      {!esReal && eOpcion === 'B' && (
        <div className="pv-demo">
          <b>Opción B pendiente de publicar.</b> Esta variante (reposición / casos autorizados)
          aún no tiene contenido. No se renderiza el examen de la Opción A bajo la etiqueta Opción B.
        </div>
      )}
      {!esReal && eOpcion === 'A' && esDemoTema && (
        <div className="pv-demo">
          <b>Solo demostración de tema visual.</b> No representa un examen real de {tema.nombre}.
          Los 16 exámenes escritos ya tienen contenido real: B1/B2/I1/I2 · Prueba 1/2 · Opción A/B.
        </div>
      )}
      {esReal
        ? <>
            <ExamShell exam={exam} answers={showKey ? sample : {}} mode="preview" showKey={showKey}
                       shell={shell} density={density} plan={plan}
                       onOpenScript={setScriptSec}
                       meta={{ nombre:'— muestra —', fecha:'preview', grupo:'I2-LM-0625', opcion:eOpcion, scoreLabel:`muestra` }} />
            <PvScript section={scriptSec} exam={exam} onClose={()=>setScriptSec(null)} />
          </>
        : <div className="pv-empty">
            <div className="pv-empty-ic">⌛</div>
            <h3>Sin contenido para mostrar</h3>
            <p>{eOpcion === 'B'
                ? 'La Opción B aún no está publicada. No se carga contenido de la Opción A.'
                : `Solo demostración visual del nivel ${tema.nombre}. No hay examen real para esta combinación.`}</p>
          </div>}
    </div>
  );
}
function PvScript({ section, exam, onClose }) {
  if (!section) return null;
  const lines = exam.audioScript[section] || [];
  return (
    <div className="exov" onClick={onClose}>
      <div className="exov-card" onClick={e=>e.stopPropagation()}>
        <div className="exov-h"><h3>Guion de audio · Sección {section}</h3><span className="exov-tag">solo docente</span><button className="exov-x" onClick={onClose}>✕</button></div>
        <div className="exov-body">{lines.map(([w,t],i)=><p key={i} className="exov-line">{w && <b>{w}:</b>} {t}</p>)}</div>
        <div className="exov-foot">El guion nunca es visible para el estudiante durante el examen oficial.</div>
      </div>
    </div>
  );
}

class ExamRuntimeBoundaryF950 extends React.Component {
  constructor(props) { super(props); this.state = { error:null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) {
    try { console.error('F95 exam runtime error', error); } catch (_) {}
  }
  render() {
    if (!this.state.error) return this.props.children;
    const msg = this.state.error && this.state.error.message ? this.state.error.message : String(this.state.error || 'Error desconocido');
    return <div className="exapp"><main className="exmain"><StudentLiveStatusCard title="El módulo de exámenes se detuvo" badge="Error visible" tone="red" onRefresh={()=>window.location.reload()}>Ya no se ocultará detrás de una pantalla en blanco. Detalle técnico: {msg}</StudentLiveStatusCard></main></div>;
  }
}

const EXAM_ROOT_F950 = document.getElementById('root');
ReactDOM.createRoot(EXAM_ROOT_F950).render(<ExamRuntimeBoundaryF950><App /></ExamRuntimeBoundaryF950>);
(function confirmExamMountF950(tries) {
  try {
    if (EXAM_ROOT_F950 && EXAM_ROOT_F950.querySelector('.exapp')) {
      window.__EXAMENES_BOOT_OK__ = true;
      EXAM_ROOT_F950.setAttribute('data-exam-boot', 'F95.1');
      return;
    }
  } catch (_) {}
  if (tries < 35) window.setTimeout(() => confirmExamMountF950(tries + 1), 100);
})(0);
