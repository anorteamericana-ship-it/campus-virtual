// F98.4-Z6-CS21A104 · Historial académico agrupado por estudiante y movimiento.
(function(){
'use strict';
const N=window.ANMasterConape96;if(!N)throw Error('CS21A96 core no cargado');
const {LEVEL,LEVEL_ORDER,TONE,clean,levelId,levelText}=N;

function MovementBadge({row}){
 const applied=!!row?.appliedInSystem;
 const tone=row?.moraState==='SI'?['Mora SI','#FDECEC','#A12828','#E8B1B1']:row?.moraState==='NO'?['Mora NO','#EAF6ED','#246B35','#B8D9C0']:null;
 const label=clean(row?.movementBadgeLabel)||(applied?'Académico 01 aplicado':'Académico 01 pendiente');
 return <div className="master-conape-movement-stack"><span className="master-conape-movement-badge" data-applied={applied?'true':'false'} title="Solo el desembolso académico 01 requiere seguimiento de la Academia">{applied?'✓ ':''}{label}</span>{tone&&<span className="master-conape-mora-badge" style={{background:tone[1],color:tone[2],borderColor:tone[3]}}>{tone[0]}</span>}</div>;
}

function historyRows(items,row,movements){
 const map=new Map();
 (Array.isArray(items)?items:[]).forEach((item,index)=>{
  const level=clean(item?.level).toUpperCase()||`ROW_${index}`;
  if(!map.has(level))map.set(level,item);
 });
 (Array.isArray(movements)?movements:[]).forEach(movement=>{
  const level=levelId(movement);
  if(level&&!map.has(level))map.set(level,{level,levelLabel:levelText(movement),periodCode:'—',status:clean(movement?.academicStatus||'SIN_REGISTRO').toUpperCase(),sourceRow:`MOV_${movement?.id||level}`});
 });
 if(!map.size&&row){
  const level=levelId(row)||'SIN_NIVEL';
  map.set(level,{level,levelLabel:levelText(row),periodCode:'—',status:clean(row?.academicStatus||'SIN_REGISTRO').toUpperCase(),sourceRow:'FALLBACK'});
 }
 return Array.from(map.values()).sort((a,b)=>(LEVEL_ORDER[clean(a?.level).toUpperCase()]||99)-(LEVEL_ORDER[clean(b?.level).toUpperCase()]||99));
}

function movementRowsForLevel(movements,level){
 return (Array.isArray(movements)?movements:[]).filter(row=>levelId(row)===level).slice().sort((a,b)=>(Number(a?.year)||0)-(Number(b?.year)||0)||(Number(a?.month)||0)-(Number(b?.month)||0)||(Number(a?.detectedSort)||0)-(Number(b?.detectedSort)||0));
}

function AcademicHistoryLine({history,movements}){
 const status=clean(history?.status||'SIN_REGISTRO').toUpperCase();
 const tone=TONE[status]||['#F2F0EC','#69635B','#D8D1C7'];
 const hasNote=clean(history?.note)!=='';
 const linked=Array.isArray(movements)?movements:[];
 return <div className="master-conape-history-item" data-has-alert={linked.length?'true':'false'}><span className="master-conape-history-level">{clean(history?.levelLabel||LEVEL[clean(history?.level).toUpperCase()]||history?.matter||'Nivel').toUpperCase()}</span><span className="master-conape-history-period">{history?.periodCode||`${history?.year||''}${history?.period||''}${history?.periodType||''}`||'—'}</span><span className="master-conape-history-status" style={{background:tone[0],color:tone[1],borderColor:tone[2]}}>{status}{hasNote?` ${history.note}`:''}</span>{linked.length>0&&<div className="master-conape-history-alert">{linked.map((row,index)=><MovementBadge key={row?.id||index} row={row}/>)}</div>}</div>;
}

function AcademicHistory({items,row,movements}){
 const linked=Array.isArray(movements)&&movements.length?movements:[row].filter(Boolean);
 const rows=historyRows(items,row,linked);
 return <div className="master-conape-history-grid">{rows.map((history,index)=>{const level=clean(history?.level).toUpperCase();return <AcademicHistoryLine key={`${history?.sourceRow||index}-${level}`} history={history} movements={movementRowsForLevel(linked,level)}/>})}</div>;
}

Object.assign(N,{MovementBadge,historyRows,movementRowsForLevel,AcademicHistoryLine,AcademicHistory});
})();
