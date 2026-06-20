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


@media print{ .cbar,.cbar-banner,.admbar,.tch-head,.tch-realbox,.rev-side{display:none!important;} .app,.exam-app,.preview-wrap{padding:0!important;margin:0!important;background:#fff!important;} }
`;
(function(){
  if (!document.getElementById('exam-app-css')) {
    var s = document.createElement('style'); s.id='exam-app-css';
    s.textContent = window.EXAM_APP_CSS; document.head.appendChild(s);
  }
})();
