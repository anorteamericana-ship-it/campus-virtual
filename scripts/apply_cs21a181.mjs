#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function write(rel, value) { fs.writeFileSync(path.join(root, rel), value, 'utf8'); }
function replaceOnce(source, from, to, label) {
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: se esperaba 1 coincidencia y se encontraron ${count}`);
  return source.replace(from, to);
}

const frontendPath = 'src/english_lab_live.jsx';
let frontend = read(frontendPath);
frontend = replaceOnce(frontend,
  "const VERSION = 'F98.4-Z6-CS21A180';",
  "const VERSION = 'F98.4-Z6-CS21A181';",
  'version frontend');

const loadingHelpers = String.raw`
  function LoadingState({label='Cargando…', compact=false}){
    return <div role="status" aria-live="polite" aria-busy="true" style={{display:'flex',alignItems:'center',gap:compact?9:12,padding:compact?'9px 11px':'14px 16px',border:'1px solid #B7D5FF',borderRadius:compact?13:17,background:'#F7FAFF',color:'#073B7A',boxShadow:compact?'none':'0 8px 20px rgba(15,23,42,.05)'}}>
      <span aria-hidden="true" style={{width:compact?18:24,height:compact?18:24,borderRadius:'50%',border:'3px solid #D9E8FF',borderTopColor:'#073B7A',animation:'eliveSpin181 .75s linear infinite',flex:'0 0 auto'}}></span>
      <div style={{minWidth:0}}>
        <div style={{fontSize:compact?12:13,fontWeight:900,color:'#001E47'}}>{label}</div>
        {!compact && <div style={{height:4,borderRadius:999,overflow:'hidden',background:'#D9E8FF',marginTop:7,width:'min(260px,52vw)'}}><span style={{display:'block',height:'100%',width:'42%',borderRadius:999,background:'#073B7A',animation:'eliveLoad181 1.15s ease-in-out infinite'}}></span></div>}
      </div>
      <style>{'@keyframes eliveSpin181{to{transform:rotate(360deg)}}@keyframes eliveLoad181{0%{transform:translateX(-120%)}100%{transform:translateX(340%)}}'}</style>
    </div>;
  }
  function LoadingInline({label}){
    return <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8}}><span aria-hidden="true" style={{width:15,height:15,borderRadius:'50%',border:'2px solid currentColor',borderRightColor:'transparent',animation:'eliveSpin181 .75s linear infinite'}}></span>{label}</span>;
  }
  function parseMemoryPairDraft(value){
    const pairs=[];
    const invalid=[];
    const seen=new Set();
    String(value||'').split(/\r?\n/).forEach((raw,index)=>{
      const line=String(raw||'').trim();
      if(!line) return;
      const parts=line.split(/\s*(?:=|→|\|)\s*/);
      const left=String(parts.shift()||'').trim();
      const right=String(parts.join(' = ')||'').trim();
      const key=left.toUpperCase();
      if(!left || !right || seen.has(key)){ invalid.push(index+1); return; }
      seen.add(key);
      pairs.push({left,right});
    });
    return {pairs,invalid};
  }
  function formatMemoryPairs(pairs){
    return (Array.isArray(pairs)?pairs:[]).map(pair=>String(pair.left||pair.PAIR_LEFT||'').trim()+' = '+String(pair.right||pair.PAIR_RIGHT||'').trim()).join('\n');
  }
  function MemoryPairEditor({value,onChange,pairCount,disabled}){
    const parsed=parseMemoryPairDraft(value);
    const complete=parsed.invalid.length===0 && parsed.pairs.length===Number(pairCount||0);
    return <div className="card" style={{padding:18,borderRadius:18,background:'#FFF',border:'1px solid #B7D5FF',boxShadow:'0 10px 24px rgba(15,23,42,.06)'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',flexWrap:'wrap'}}>
        <div><div style={{fontSize:11,fontWeight:950,letterSpacing:'.13em',color:'#7A1E2C',textTransform:'uppercase'}}>Palabras sugeridas</div><div style={{fontSize:20,fontWeight:950,color:'#001E47',marginTop:3}}>Revisá las parejas antes de compartir la sala</div></div>
        <span style={{fontSize:11,fontWeight:950,borderRadius:999,padding:'6px 10px',background:complete?'#EAF8EF':'#FFF7E6',border:'1px solid '+(complete?'#BDE8CD':'#FFD88A'),color:complete?'#145C38':'#7A4B00'}}>{parsed.pairs.length}/{pairCount} parejas</span>
      </div>
      <div style={{fontSize:12.5,color:'#667085',lineHeight:1.5,marginTop:8}}>Una pareja por línea, con el formato <b>palabra = significado</b>. Podés sustituir las sugerencias por vocabulario propio; no se aceptan palabras sin su pareja.</div>
      <textarea value={value} disabled={disabled} onChange={event=>onChange(event.target.value)} rows={Math.max(6,Math.min(12,Number(pairCount||6)))} spellCheck="false" style={{width:'100%',resize:'vertical',marginTop:12,border:'1px solid #D0D5DD',borderRadius:14,padding:'12px 13px',fontFamily:'var(--f-mono,monospace)',fontSize:13,lineHeight:1.5,color:'#001E47',background:disabled?'#F3F4F6':'#F8FAFC',boxSizing:'border-box'}} />
      {parsed.invalid.length>0 && <div style={{marginTop:9,fontSize:12,color:'#8B1F1F',fontWeight:850}}>Revisá las líneas {parsed.invalid.join(', ')}: falta palabra, significado o hay una palabra repetida.</div>}
      {!parsed.invalid.length && parsed.pairs.length!==Number(pairCount||0) && <div style={{marginTop:9,fontSize:12,color:'#7A4B00',fontWeight:850}}>La sala requiere exactamente {pairCount} parejas.</div>}
    </div>;
  }
`;
frontend = replaceOnce(frontend,
  '  function roomPublicCode(room){',
  loadingHelpers + '\n  function roomPublicCode(room){',
  'helpers UX');

frontend = replaceOnce(frontend,
  "    const [projector,setProjector]=React.useState(false);",
  "    const [projector,setProjector]=React.useState(false);\n    const [pairDraft,setPairDraft]=React.useState('');\n    const pairDraftLoaded=React.useRef(false);",
  'estado editor');

frontend = replaceOnce(frontend,
  "    const memoryPackage = data?.room_package || null;",
  "    const memoryPackage = data?.room_package || null;\n    const suggestedPairs = Array.isArray(data?.suggested_pairs) ? data.suggested_pairs : [];\n    const expectedPairCount = Math.max(3, Number(data?.pair_count || data?.settings?.pair_count || suggestedPairs.length || 6) || 6);\n    const pairDraftState = parseMemoryPairDraft(pairDraft);\n    React.useEffect(()=>{\n      if(memoryMatch && status==='CREATED' && !pairDraftLoaded.current && suggestedPairs.length){\n        setPairDraft(formatMemoryPairs(suggestedPairs));\n        pairDraftLoaded.current=true;\n      }\n    },[memoryMatch,status,suggestedPairs.length]);",
  'datos sugeridos');

frontend = replaceOnce(frontend,
  "    const canOpen = status !== 'CLOSED';",
  "    async function startMemoryMatch(){\n      const parsed=parseMemoryPairDraft(pairDraft);\n      if(parsed.invalid.length){ setError('Revisá las líneas inválidas de las parejas.'); return; }\n      if(parsed.pairs.length!==expectedPairCount){ setError('La sala requiere exactamente '+expectedPairCount+' parejas.'); return; }\n      await action('englishLabMemoryMatchStartRoom',{custom_pairs:parsed.pairs});\n    }\n    const canOpen = status !== 'CLOSED';",
  'inicio validado');

frontend = replaceOnce(frontend,
  "          {loading ? <Alert>Cargando control de ronda…</Alert> : memoryMatch && memoryPackage && typeof MemoryMatchLiveRoundCS21A174 === 'function' ?",
  "          {loading ? <LoadingState label=\"Cargando control de ronda…\" /> : memoryMatch && memoryPackage && typeof MemoryMatchLiveRoundCS21A174 === 'function' ?",
  'loading control');
frontend = replaceOnce(frontend,
  ": memoryMatch ? <Alert tone=\"warn\">Memory Match esta listo. Inicie la sala para cargar el tablero compartido.</Alert> :",
  ": memoryMatch ? <Alert tone=\"info\">Revisá las parejas sugeridas arriba. Cuando estén listas, iniciá Memory Match para cargar el tablero compartido.</Alert> :",
  'mensaje preinicio');
frontend = replaceOnce(frontend,
  "      <ShareRoomPanel room={room}/>",
  "      {memoryMatch && status==='CREATED' && <MemoryPairEditor value={pairDraft} onChange={setPairDraft} pairCount={expectedPairCount} disabled={busy}/>}\n      <ShareRoomPanel room={room}/>",
  'editor antes de compartir');
frontend = replaceOnce(frontend,
  "{canStart && <button className=\"btn btn-primary\" type=\"button\" disabled={busy} onClick={()=>action(memoryMatch?'englishLabMemoryMatchStartRoom':'englishLabLiveStartRoom')}>{memoryMatch?'Iniciar Memory Match':'Iniciar sala'}</button>}",
  "{canStart && <button className=\"btn btn-primary\" type=\"button\" disabled={busy || (memoryMatch && (pairDraftState.invalid.length>0 || pairDraftState.pairs.length!==expectedPairCount))} onClick={memoryMatch?startMemoryMatch:()=>action('englishLabLiveStartRoom')}>{busy?<LoadingInline label={memoryMatch?'Iniciando…':'Iniciando…'} />:(memoryMatch?'Iniciar Memory Match':'Iniciar sala')}</button>}",
  'boton inicio');

frontend = replaceOnce(frontend,
  "    const isMemoryMatch=!!(window.EnglishLabMemoryMatchLiveCS21A174 && window.EnglishLabMemoryMatchLiveCS21A174.isMemoryMatchRoom(room));",
  "    const isMemoryMatch=!!(state?.memory_match || (window.EnglishLabMemoryMatchLiveCS21A174 && window.EnglishLabMemoryMatchLiveCS21A174.isMemoryMatchRoom(room)));",
  'senal memory estudiante');
frontend = replaceOnce(frontend,
  "<button className=\"btn btn-primary\" type=\"button\" disabled={busy} onClick={joinRoom} style={{height:48,fontSize:15,fontWeight:950}}>{busy?'Entrando…':'Entrar a sala'}</button>",
  "<button className=\"btn btn-primary\" type=\"button\" disabled={busy} onClick={joinRoom} style={{height:48,fontSize:15,fontWeight:950}}>{busy?<LoadingInline label=\"Entrando…\" />:'Entrar a sala'}</button>",
  'loading ingreso');
frontend = replaceOnce(frontend,
  "      {error && <div style={{marginBottom:12}}><Alert tone=\"err\">{error}</Alert></div>}",
  "      {error && <div style={{marginBottom:12}}><Alert tone=\"err\">{error}</Alert></div>}\n      {loading && <div style={{marginBottom:12}}><LoadingState label=\"Actualizando la sala…\" compact={true}/></div>}",
  'loading estudiante');
frontend = replaceOnce(frontend,
  "{loading ? <Alert>Cargando grupos del docente…</Alert> : error ?",
  "{loading ? <LoadingState label=\"Cargando grupos del docente…\" /> : error ?",
  'loading grupos');
frontend = replaceOnce(frontend,
  "{loading ? <Alert>Cargando salas…</Alert> : recent.length ?",
  "{loading ? <LoadingState label=\"Cargando salas recientes…\" /> : recent.length ?",
  'loading salas');
frontend = frontend.replaceAll("{busy?'Creando…':'Crear sala live'}", "{busy?<LoadingInline label=\"Creando sala…\" />:'Crear sala live'}");
write(frontendPath, frontend);

const backendPath = 'apps_script_patches/97_ACTUALIZACION_QA.gs';
let backend = read(backendPath);
backend = replaceOnce(backend, "var ELIVE180_VERSION = 'CS21A180';", "var ELIVE180_VERSION = 'CS21A181';", 'version backend');
backend = replaceOnce(backend,
  "var ELIVE180_UPDATE_OBJECTIVE = 'Creacion alineada por encabezado y estado rapido de Memory Match';",
  "var ELIVE180_UPDATE_OBJECTIVE = 'Carga visible, sugerencias editables y parejas personalizadas seguras en Memory Match';",
  'objetivo backend');

const customPairHelpers = String.raw`
function _elive181CustomPairs_(value) {
  var raw = value;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); }
    catch (_) {
      raw = raw.split(/\r?\n/).map(function (line) {
        var parts = String(line || '').split(/\s*(?:=|→|\|)\s*/);
        return {left:_elive176Text_(parts.shift()),right:_elive176Text_(parts.join(' = '))};
      });
    }
  }
  if (!Array.isArray(raw)) return [];
  var seen = {};
  return raw.map(function (pair) {
    var left = _elive176Text_(pair && (pair.left || pair.word || pair.PAIR_LEFT));
    var right = _elive176Text_(pair && (pair.right || pair.meaning || pair.PAIR_RIGHT));
    var key = _elive176Upper_(left);
    if (!left || !right || seen[key]) return null;
    seen[key] = true;
    return {left:left,right:right};
  }).filter(function (pair) { return !!pair; }).slice(0, 12);
}
function _elive181CardsFromPairs_(room, pairs) {
  var cards = [];
  pairs.forEach(function (pair, index) {
    var pairId = 'CUSTOM-' + (index + 1);
    cards.push({card_id:pairId + '-L',pair_id:pairId,face_type:'TEXT',label:pair.left,media_id:''});
    cards.push({card_id:pairId + '-R',pair_id:pairId,face_type:'TEXT',label:pair.right,media_id:''});
  });
  return _elmm174Shuffle_(cards, room.ROOM_CODE + '|CUSTOM-CARDS');
}
function _elive181SuggestedPairs_(room, settings) {
  var count = Math.max(3, Math.min(12, Number(settings.pair_count || 6) || 6));
  var level = _elive176Upper_(room.NIVEL || settings.level || 'B1');
  var unit = _elive176NormalizeUnit_(settings.unit || room.UNIT || 'MIX');
  return _elmm174Shuffle_(_elive176PairRows_(level, unit), room.ROOM_CODE + '|SUGGESTIONS|' + unit + '|' + level).slice(0, count).map(function (row) {
    return {left:_elive176Text_(row.PAIR_LEFT || row.STEM),right:_elive176Text_(row.PAIR_RIGHT)};
  });
}
`;
backend = replaceOnce(backend,
  'function _elive176Cards_(room, pairCount) {',
  customPairHelpers + '\nfunction _elive176Cards_(room, pairCount) {',
  'helpers parejas backend');
backend = replaceOnce(backend,
  "  var count = Math.max(3, Math.min(12, Number(pairCount || settings.pair_count || 6) || 6));\n  var rows =",
  "  var count = Math.max(3, Math.min(12, Number(pairCount || settings.pair_count || 6) || 6));\n  var customPairs = _elive181CustomPairs_(settings.custom_pairs);\n  if (customPairs.length) {\n    if (customPairs.length !== count) throw new Error('La sala requiere exactamente ' + count + ' parejas personalizadas.');\n    return _elive181CardsFromPairs_(room, customPairs);\n  }\n  var rows =",
  'uso parejas personalizadas');
backend = replaceOnce(backend,
  "  settings.unit = _elive176NormalizeUnit_(settings.unit || 'MIX');\n  var cards = _elive176Cards_(room, settings.pair_count);",
  "  settings.unit = _elive176NormalizeUnit_(settings.unit || 'MIX');\n  var rawCustomPairs = body.custom_pairs || body.customPairs || '';\n  var requestedPairs = _elive181CustomPairs_(rawCustomPairs);\n  if (rawCustomPairs && !requestedPairs.length) return {ok:false,error:'parejas_personalizadas_invalidas',mensaje:'Use una pareja por línea: palabra = significado.'};\n  if (requestedPairs.length) {\n    var expectedPairs = Math.max(3, Math.min(12, Number(settings.pair_count || 6) || 6));\n    if (requestedPairs.length !== expectedPairs) return {ok:false,error:'cantidad_parejas_invalida',mensaje:'La sala requiere exactamente ' + expectedPairs + ' parejas.'};\n    settings.custom_pairs = requestedPairs;\n  }\n  var cards = _elive176Cards_(room, settings.pair_count);",
  'captura parejas inicio');
backend = replaceOnce(backend,
  "  var room = _elive180MaybeAdvanceTurn_(found) || found.row;\n  return _elive180ResponseCopy_(_elive180Snapshot_(room));\n}",
  "  var room = _elive180MaybeAdvanceTurn_(found) || found.row;\n  var response = _elive180ResponseCopy_(_elive180Snapshot_(room));\n  var settings = _elive176Json_(room.SETTINGS_JSON, {});\n  response.settings = settings;\n  response.pair_count = Math.max(3, Math.min(12, Number(settings.pair_count || 6) || 6));\n  if (_elive176Upper_(room.STATUS) === 'CREATED') response.suggested_pairs = _elive181SuggestedPairs_(room, settings);\n  return response;\n}",
  'sugerencias control');
backend = replaceOnce(backend,
  "last_seen_ttl_seconds:ELIVE180_LAST_SEEN_TTL_SECONDS};",
  "last_seen_ttl_seconds:ELIVE180_LAST_SEEN_TTL_SECONDS,custom_pairs_supported:true,suggested_pairs_editable:true};",
  'verificacion CS181');
backend = backend.replaceAll('CS21A180 no supero la verificacion de estado rapido y encabezados.', 'CS21A181 no supero la verificacion de UX, parejas y estado rapido.');
write(backendPath, backend);

const appPath = 'src/app.jsx';
let app = read(appPath);
app = replaceOnce(app,
  "'src/english_lab_live.jsx?v=F98.4Z6CS21A180'",
  "'src/english_lab_live.jsx?v=F98.4Z6CS21A181'",
  'cache English LAB');
write(appPath, app);

const oldTestPath = 'scripts/test_english_lab_fast_state_cs21a180.mjs';
let oldTest = read(oldTestPath);
oldTest = oldTest.replace("ELIVE180_VERSION = 'CS21A180'", "ELIVE180_VERSION = 'CS21A181'");
oldTest = oldTest.replace('version CS21A180 presente', 'version CS21A181 presente');
oldTest = oldTest.replace(': memoryMatch ? <Alert tone="warn">Memory Match esta listo.', ': memoryMatch ? <Alert tone="info">Revisá las parejas sugeridas arriba.');
write(oldTestPath, oldTest);

const changedLabels=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(full);
    else if(/\.(?:js|jsx|html)$/.test(entry.name)){
      const original=fs.readFileSync(full,'utf8');
      const updated=original.replaceAll('Acceso financiero','Acceso').replaceAll('acceso financiero','acceso');
      if(updated!==original){ fs.writeFileSync(full,updated,'utf8'); changedLabels.push(path.relative(root,full)); }
    }
  }
}
walk(path.join(root,'src'));

console.log(JSON.stringify({ok:true,version:'CS21A181',financial_labels_removed_from:changedLabels,files:[frontendPath,backendPath,appPath,oldTestPath]}));
