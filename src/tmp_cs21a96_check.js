// F98.4-Z6-CS21A96 · Indicador del movimiento CONAPE
(function(){
'use strict';
const N=window.ANMasterConape96;if(!N)throw Error('CS21A96 core no cargado');
function MovementBadge({row}){
 const applied=!!row.appliedInSystem;
 const tone=row.moraState==='SI'?['Mora SI','#FDECEC','#A12828','#E8B1B1']:row.moraState==='NO'?['Mora NO','#EAF6ED','#246B35','#B8D9C0']:null;
 return <div className="master-conape-movement-stack"><span className="master-conape-movement-badge" data-applied={applied?'true':'false'}>{applied?'✓ Aplicado':'Nuevo desembolso'}</span>{tone&&<span className="master-conape-mora-badge" style={{background:tone[1],color:tone[2],borderColor:tone[3]}}>{tone[0]}</span>}</div>;
}
N.MovementBadge=MovementBadge;
})();
