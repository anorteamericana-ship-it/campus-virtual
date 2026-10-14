// F111 · Test de render React sintético de la grilla docente, sin servicios externos.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Babel=require('../vendor/babel.js');
const src=fs.readFileSync('src/teacher_views.jsx','utf8');
const start=src.indexOf('function tvRosterCommentPreviewF111(');
const end=src.indexOf('\nfunction ',src.indexOf('function RosterAcademicoF79(',start)+10);
assert(start>=0&&end>start,'Helper and roster component must be available');

function render({view='readable',present=true,comment='Great attitude! Every lesson brings new opportunities!'}={}){
  let hook=0;
  const stateCalls=[];
  const React={
    Fragment:'fragment',
    createElement:(type,props,...children)=>({type,props:props||{},children}),
    useMemo:fn=>fn(),
    useCallback:fn=>fn,
    useEffect:()=>{},
    useRef:value=>({current:value}),
    useState:init=>{
      const n=hook++;
      return [n===2?view:init,(value)=>stateCalls.push({hook:n,value})];
    }
  };
  const ctx={
    React,
    tvTodayIsoCostaRicaF98:()=> '2026-10-14',
    tvSearchNormalizeF98:value=>String(value||'').normalize('NFD').toUpperCase().replace(/[^A-Z0-9]+/g,' ').trim(),
    tvUpper:v=>String(v||'').trim().toUpperCase(),
    tvGroupCode:()=> 'B1-KJ18-C3-0826',
    tvIsIcanEventF96:()=>false,
    tvIsProgressCheckF96:()=>false,
    tvLessonSortF97:(a,b)=>a.leccion-b.leccion,
    tvLessonKeyF97:l=>String(l.leccion),
    tvLessonRielF97:()=> 'curso',
    tvEvalLabelF86:()=> '',
    tvSelectContactTextF104:()=>{},
    NotaDetalleDrawerF79:()=>null,
    window:{},sessionStorage:{getItem:()=>null,setItem:()=>{}},
    requestAnimationFrame:()=>{},
    console
  };
  vm.createContext(ctx);
  vm.runInContext(Babel.transform(src.slice(start,end),{presets:['react'],plugins:['transform-block-scoping']}).code,ctx);
  const props={
    roster:[{code:'QA001',name:'Estudiante Sintético'}],contactos:{},
    lecciones:[{leccion:1,fecha:'2026-10-08',tipo:'CURSO',estado:'CERRADA'}],
    asistenciaDetalle:{'1':{'QA001':{presente:present}}},
    comentariosDetalle:{'1':{'QA001':comment}},
    asistenciaGrupo:{},notasGrupo:{},meta:{codigo:'B1-KJ18-C3-0826',programa:'INA'},
    programa:'INA',activeSession:null,activeSessionReady:true
  };
  const root=ctx.RosterAcademicoF79(props);
  const flatten=value=>value==null?[]:Array.isArray(value)?value.flatMap(flatten):
    typeof value==='object'&&value.type!==undefined?[value,...(value.children||[]).flatMap(flatten)]:[];
  return {nodes:flatten(root),stateCalls};
}
const sample='Great attitude! Every lesson brings new opportunities!';
const detailed=render();
const noteButton=detailed.nodes.find(n=>n.type==='button'&&n.props.title===sample);
assert(noteButton,'Readable view must render actual text inside accessible button');
assert(noteButton.props['aria-label']?.includes('Great attitude!'),'Full comment accessible to screen reader');
assert(detailed.nodes.some(n=>n.type==='span'&&n.children.includes(sample)),'Exact comment text visible in grid');
assert(detailed.nodes.some(n=>n.type==='div'&&n.children.includes('Presente')),'Presence unchanged');
noteButton.props.onClick({stopPropagation:()=>{}});
assert(detailed.stateCalls.some(x=>x.hook===4&&x.value?.leccion===1),'Click opens existing lesson detail without closing it');

const compact=render({view:'compact'});
assert(!compact.nodes.some(n=>n.type==='button'&&n.props.title===sample),
  'Compact view must not render wide comment card');
assert(compact.nodes.some(n=>n.type==='div'&&n.children.includes('💬 Comentario')),'Compact retains comment indicator');
const absent=render({present:false});
assert(absent.nodes.some(n=>n.type==='div'&&n.children.includes('Ausente')),'Absence state unchanged');
const missing=render({comment:''});
assert(!missing.nodes.some(n=>n.type==='button'&&n.props.title===sample),'Empty comments do not create false previews');

console.log('F111_TEACHER_ROSTER_RENDER_E1_PASS: real preview, accessible detail, compact mode, P/A, empty');
