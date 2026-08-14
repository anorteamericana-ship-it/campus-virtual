// CS21A215 · Estilo aislado del hub único English LAB.
(function installEnglishLabHubStyleCS21A215(global){
  'use strict';
  if(!global || !global.document) return;
  const ID='el215-style';
  if(global.document.getElementById(ID)) return;
  const style=global.document.createElement('style');
  style.id=ID;
  style.textContent=`
    .el215-shell{--el215-navy:var(--an-navy,#06366E);--el215-red:var(--an-granate,#8B1E2D);--el215-line:var(--line,#E5DECF);--el215-ink:var(--ink,#162033);--el215-muted:var(--ink-3,#6D7A8C);padding:clamp(14px,2.4vw,28px);color:var(--el215-ink)}
    .el215-shell *{box-sizing:border-box}
    .el215-hero{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(250px,.7fr);gap:18px;align-items:stretch;margin-bottom:18px}
    .el215-hero-main,.el215-status,.el215-mode-card,.el215-panel{background:#fff;border:1px solid var(--el215-line);border-radius:22px;box-shadow:0 14px 34px rgba(10,42,82,.08)}
    .el215-hero-main{padding:clamp(22px,4vw,38px)}
    .el215-kicker{display:inline-flex;align-items:center;gap:8px;font-size:10px;font-weight:950;letter-spacing:.15em;text-transform:uppercase;color:var(--el215-red)}
    .el215-hero h1{margin:10px 0 8px;color:var(--el215-navy);font-size:clamp(30px,4.5vw,54px);line-height:.98;letter-spacing:-.05em}
    .el215-hero p{margin:0;max-width:760px;color:var(--ink-2,#4C5C72);line-height:1.6}
    .el215-status{padding:20px;display:flex;flex-direction:column;justify-content:center;gap:7px}
    .el215-status span{font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:var(--el215-muted)}
    .el215-status strong{font-size:22px;color:var(--el215-navy)}
    .el215-status small{color:var(--el215-muted);line-height:1.45}
    .el215-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
    .el215-mode-card{border:1px solid var(--el215-line);padding:20px;text-align:left;cursor:pointer;min-height:255px;display:flex;flex-direction:column;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
    .el215-mode-card:hover{transform:translateY(-3px);box-shadow:0 22px 48px rgba(10,42,82,.14);border-color:color-mix(in srgb,var(--el215-navy) 25%,var(--el215-line))}
    .el215-mode-card:focus-visible,.el215-back:focus-visible,.el215-mini-card button:focus-visible{outline:3px solid color-mix(in srgb,var(--el215-red) 55%,white);outline-offset:3px}
    .el215-icon{font-size:34px;line-height:1}
    .el215-mode-card small{margin-top:14px;font-size:10px;font-weight:950;letter-spacing:.13em;text-transform:uppercase;color:var(--el215-red)}
    .el215-mode-card strong{margin-top:7px;font-size:24px;color:var(--el215-navy);letter-spacing:-.025em}
    .el215-mode-card p{margin:9px 0 0;color:var(--ink-2,#4C5C72);line-height:1.52}
    .el215-mode-card em{margin-top:auto;padding-top:18px;font-style:normal;font-weight:900;color:var(--el215-navy)}
    .el215-notice{margin-top:14px;padding:12px 14px;border-radius:14px;background:#FFF4D6;color:#7C5400;font-size:12px;line-height:1.5}
    .el215-subhead{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:16px;flex-wrap:wrap}
    .el215-subhead-copy small{display:block;font-size:10px;font-weight:950;letter-spacing:.14em;text-transform:uppercase;color:var(--el215-red)}
    .el215-subhead-copy h2{margin:5px 0 0;color:var(--el215-navy);font-size:clamp(24px,3vw,36px);letter-spacing:-.035em}
    .el215-back{border:1px solid var(--el215-line);background:#fff;color:var(--el215-navy);border-radius:999px;min-height:40px;padding:0 15px;font-weight:900;cursor:pointer}
    .el215-panel{padding:18px}
    .el215-mini-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
    .el215-mini-card{border:1px solid var(--el215-line);border-radius:18px;padding:16px;background:#fff;display:flex;flex-direction:column;gap:8px;min-height:185px}
    .el215-mini-card strong{color:var(--el215-navy);font-size:19px}
    .el215-mini-card p{margin:0;color:var(--ink-2,#4C5C72);line-height:1.45;font-size:13px}
    .el215-mini-card button{margin-top:auto;border:0;border-radius:999px;min-height:38px;padding:0 14px;background:var(--el215-navy);color:#fff;font-weight:900;cursor:pointer}
    .el215-mini-card.is-soon{background:var(--surface-2,#F8F5EE)}
    .el215-mini-card.is-soon button{background:#E9E4DA;color:#71685B;cursor:default}
    .el215-live-wrap .el205-game-grid button:first-child{display:none!important}
    .el215-live-wrap .el205-head h1{font-size:clamp(25px,3vw,38px)}
    @media(max-width:900px){.el215-hero{grid-template-columns:1fr}.el215-grid,.el215-mini-grid{grid-template-columns:1fr 1fr}}
    @media(max-width:620px){.el215-shell{padding:12px}.el215-grid,.el215-mini-grid{grid-template-columns:1fr}.el215-mode-card{min-height:205px}.el215-hero-main{padding:22px}.el215-status{padding:16px}}
  `;
  (global.document.head||global.document.documentElement).appendChild(style);
  global.EnglishLabHubStyleCS21A215=Object.freeze({version:'CS21A215',styleId:ID});
})(window);
