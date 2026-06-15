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
.exh-logo{ width:34px; height:34px; border-radius:8px; background:var(--lvl); color:#fff; font-weight:800; font-size:13px; display:flex; align-items:center; justify-content:center; }
.exh-org{ font-size:12px; font-weight:600; letter-spacing:0.03em; }
.exh-org i{ font-style:normal; opacity:0.6; font-weight:500; }
.exh-kicker{ font-family:var(--f-mono); font-size:11px; letter-spacing:0.12em; text-transform:uppercase; color:var(--lvl); margin-bottom:8px; }
.exh-title{ font-size:34px; font-weight:700; letter-spacing:-0.02em; line-height:1.04; margin:0 0 6px; }
.exh-sub{ font-size:13px; opacity:0.72; }
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
.exh-premium .exh-logo{ background:var(--lvl); }
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
`;
