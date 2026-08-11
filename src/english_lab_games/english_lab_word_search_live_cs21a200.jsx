/* global React */
// CS21A200 · Word Search Live · cliente QA autoritativo.
(function installEnglishLabWordSearchLiveCS21A200(global){
  'use strict';
  if(!global||global.EnglishLabWordSearchLiveCS21A200)return;

  const VERSION='CS21A200';
  const GAME_ID='WORD_SEARCH';
  const GameAPI=global.EnglishLabWordSearchGameCS21A199;
  const Registry=global.EnglishLabGameRegistryCS21A191||null;
  if(!GameAPI||typeof GameAPI.WordSearchGameCS21A199!=='function')throw new Error('Falta Word Search R2 antes de CS21A200.');
  const Game=GameAPI.WordSearchGameCS21A199;
  const ENDPOINTS=Object.freeze({teacherData:'englishLabWordSearchTeacherData',create:'englishLabWordSearchCreateRoom',start:'englishLabWordSearchStartRoom',control:'englishLabWordSearchGetRoomControl',join:'englishLabWordSearchJoinRoom',state:'englishLabWordSearchGetPlayerState',claim:'englishLabWordSearchClaimWord',closeRoom:'englishLabWordSearchCloseRoom'});

  if(Registry&&!Registry.has(GAME_ID))Registry.register({id:GAME_ID,label:'Word Search',category:'Vocabulary & spelling',version:VERSION,endpoints:{suggestions:ENDPOINTS.teacherData,create:ENDPOINTS.create,start:ENDPOINTS.start,control:ENDPOINTS.control,join:ENDPOINTS.join,state:ENDPOINTS.state,action:ENDPOINTS.claim,closeRoom:ENDPOINTS.closeRoom},capabilities:{individual:true,teams:false,projector:true,serverAuthoritative:true,curriculum:true}});

  function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
  function upper(v){return clean(v).toUpperCase();}
  function publicCode(v){return upper(v).replace(/[^A-Z0-9-]/g,'').slice(0,12);}
  function sessionToken(){try{return typeof global.getSessionToken==='function'?(global.getSessionToken()||''):'';}catch(_){return'';}}
  function sessionUser(props){if(props?.usuario)return props.usuario;try{return typeof global.getSesion==='function'?(global.getSesion()||{}):JSON.parse(global.sessionStorage.getItem('an_usuario')||'{}');}catch(_){return{};}}
  function userCode(props){const u=sessionUser(props);return clean(u.codigo||u.CODIGO||u.cod_estudiante||u.COD_ESTUDIANTE||u.cedula||u.CEDULA);}
  function userName(props){const u=sessionUser(props);return clean(u.nombre||u.nombre_completo||u.NOMBRE||u.name||userCode(props)||'Estudiante');}
  function roomCodeOf(response){return publicCode(response?.room?.room_code||response?.room?.ROOM_CODE||response?.room_code);}
  function stateOf(response){const raw=response?.word_search_state||{};return {...raw,server_now:response?.server_now||raw.server_now};}
  function puzzleOf(response){return response?.public_puzzle||stateOf(response).public_puzzle||null;}

  async function post(fn,payload={},timeoutMs=30000){
    const endpoint=global.APPS_SCRIPT_URL;if(!endpoint)throw new Error('No está configurada la URL QA de Apps Script.');
    const controller=typeof AbortController!=='undefined'?new AbortController():null;const timer=controller?setTimeout(()=>controller.abort(),timeoutMs):null;
    try{
      const response=await global.fetch(`${endpoint}?fn=${encodeURIComponent(fn)}`,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({fn,token:sessionToken(),...payload}),signal:controller?controller.signal:undefined});
      const text=await response.text();let data=null;try{data=text?JSON.parse(text):null;}catch(_){throw new Error('Word Search recibió una respuesta inválida del backend.');}
      if(!response.ok||!data)throw new Error((data&&(data.mensaje||data.error))||`HTTP ${response.status}`);
      if(data.ok===false){const error=new Error(data.mensaje||data.message||data.error||'La acción no fue aceptada.');error.data=data;throw error;}
      return data;
    }catch(error){if(error?.name==='AbortError')throw new Error('Word Search tardó demasiado en responder.');throw error;}finally{if(timer)clearTimeout(timer);}
  }

  function useSerialPoll(load,delay){const ref=React.useRef(load);ref.current=load;React.useEffect(()=>{let stopped=false,timer=null;const tick=async()=>{try{await ref.current();}catch(_){}if(stopped)return;timer=setTimeout(tick,Math.max(600,Number(typeof delay==='function'?delay():delay)||1200));};timer=setTimeout(tick,250);return()=>{stopped=true;if(timer)clearTimeout(timer);};},[delay]);}
  function initials(name){const parts=clean(name).split(/\s+/).filter(Boolean);return parts.length?((parts[0][0]||'')+(parts.length>1?(parts.at(-1)[0]||''):'' )).toUpperCase():'AN';}
  function Ranking({rows=[]}){return <div className="ws200-live-ranking"><strong>Ranking en vivo</strong>{(rows||[]).slice(0,8).map((row,index)=><div key={row.cod_estudiante||index}><span>{initials(row.nombre||row.cod_estudiante)}</span><b>{row.nombre||row.cod_estudiante}</b><small>{Number(row.words||0)} palabras · {Number(row.points||0)} pt</small></div>)}</div>;}
  function LiveHeader({response,teacher=false}){const state=stateOf(response);return <div className="ws200-live-head"><div><span>{teacher?'Vista docente':'Sala Live'}</span><strong>{roomCodeOf(response)||'WORD SEARCH'}</strong></div><div><span>{Number(response?.online_players?.length||0)} en línea</span><span>{Number(response?.claim_count||0)}/10 encontradas</span><span>{upper(state.phase||'WAITING')}</span></div></div>;}

  function TeacherRoom({initial,onExit}){
    const [response,setResponse]=React.useState(initial||null),[busy,setBusy]=React.useState(false),[error,setError]=React.useState('');
    const code=roomCodeOf(response||initial);
    const load=React.useCallback(async()=>{if(!code)return;try{setResponse(await post(ENDPOINTS.control,{room_code:code},25000));setError('');}catch(e){setError(e.message||String(e));}},[code]);
    useSerialPoll(load,React.useCallback(()=>upper(stateOf(response).phase)==='OPEN'?800:1400,[response]));
    async function start(){setBusy(true);setError('');try{setResponse(await post(ENDPOINTS.start,{room_code:code},30000));}catch(e){setError(e.message||String(e));}finally{setBusy(false);}}
    async function close(){setBusy(true);try{await post(ENDPOINTS.closeRoom,{room_code:code},30000);onExit?.();}catch(e){setError(e.message||String(e));}finally{setBusy(false);}}
    const state=stateOf(response),puzzle=puzzleOf(response),waiting=upper(response?.room?.status||response?.room?.STATUS)==='CREATED'||!puzzle;
    return <div className="ws200-live-shell"><LiveHeader response={response} teacher/>{error&&<div className="ws200-live-error">{error}</div>}{waiting?<div className="ws200-live-wait"><h3>Word Search listo</h3><p>Esperá a que entren los estudiantes. El puzzle todavía no se muestra antes de iniciar.</p><b>{Number(response?.online_players?.length||0)} participantes en línea</b><button disabled={busy||!response?.online_players?.length} onClick={start}>{busy?'Iniciando…':'Iniciar Word Search'}</button></div>:<><Game publicPuzzle={puzzle} authoritativeState={state} roundId={state.round_id} readOnly title="What's your name?"/><Ranking rows={response?.leaderboard||[]}/></>}<div className="ws200-live-actions"><button type="button" onClick={load}>Actualizar</button><button type="button" disabled={busy} onClick={close}>Cerrar sala</button></div></div>;
  }

  function StudentSession({initial,props,onExit}){
    const [response,setResponse]=React.useState(initial||null),[error,setError]=React.useState('');const inFlight=React.useRef(false);
    const code=roomCodeOf(response||initial),playerId=clean(response?.player?.cod_estudiante||response?.player?.player_id||userCode(props));
    const load=React.useCallback(async()=>{if(inFlight.current||!code||!playerId)return;inFlight.current=true;try{setResponse(await post(ENDPOINTS.state,{room_code:code,player_id:playerId},25000));setError('');}catch(e){setError(e.message||String(e));}finally{inFlight.current=false;}},[code,playerId]);
    useSerialPoll(load,900);
    const claim=React.useCallback(async(action)=>{try{const next=await post(ENDPOINTS.claim,{room_code:code,player_id:playerId,...action},30000);setResponse(next);setError('');return next;}catch(e){const data=e?.data;if(data?.room_state)setResponse(data.room_state);if(data?.retryable){setError('El servidor está ocupado. Reintentá la misma jugada.');throw e;}if(data){setError(data.mensaje||data.error||e.message);return {ok:false,error:data.error||e.message,mensaje:data.mensaje||e.message};}setError(e.message||String(e));throw e;}},[code,playerId]);
    const state=stateOf(response),puzzle=puzzleOf(response),waiting=!puzzle||upper(state.phase)==='WAITING';
    return <div className="ws200-live-shell"><LiveHeader response={response}/>{error&&<div className="ws200-live-error">{error}</div>}{waiting?<div className="ws200-live-wait"><h3>Entraste a Word Search</h3><p>Esperando que el docente inicie la ronda.</p></div>:<><Game publicPuzzle={puzzle} authoritativeState={state} roundId={state.round_id} readOnly={response?.can_claim!==true} onClaim={claim} title="What's your name?"/><Ranking rows={response?.leaderboard||[]}/></>}<div className="ws200-live-actions"><button type="button" onClick={load}>Actualizar</button><button type="button" onClick={()=>onExit?.()}>Salir</button></div></div>;
  }

  const api=Object.freeze({VERSION,GAME_ID,ENDPOINTS,post,teacherData:()=>post(ENDPOINTS.teacherData,{},30000),createRoom:payload=>post(ENDPOINTS.create,payload,30000),joinRoom:(roomCode,props)=>post(ENDPOINTS.join,{room_code:publicCode(roomCode),player_id:userCode(props),player_name:userName(props)},30000),TeacherRoom,StudentSession});
  global.EnglishLabWordSearchLiveCS21A200=api;
})(window);
