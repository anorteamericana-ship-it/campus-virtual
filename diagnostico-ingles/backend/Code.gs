/** Academia Norteamericana — Diagnostic QA inbound, separado de Apollo/F111.
 * Acceso anónimo SOLO para registrar observaciones y resúmenes agregados.
 * No existe ningún método público para leer nombres, observaciones ni claves.
 */
const APP = 'AN-ENGLISH-DIAGNOSTIC-QA-1';
const DB_KEY = 'AN_PUBLIC_QA_SHEET_ID';
const TABS = {
  PARTICIPANTES:['PARTICIPANT_ID','NOMBRE','CREADO','ULTIMA_VISITA','PREGUNTAS_UNICAS','TOTAL','DIAGNOSTICO_OK','DIAGNOSTICO_TOTAL'],
  OBSERVACIONES:['EVENT_ID','FECHA','PARTICIPANT_ID','NOMBRE','FORMA','PARTE','PREGUNTA_ID','CATEGORIA','COMENTARIO','INTENTO_ID','ESTADO_REVISION'],
};
const TYPES = ['audio','respuesta','texto','imagen','traduccion','usabilidad','otro'];
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
function clean_(v,n){return String(v == null ? '' : v).normalize('NFC').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n);}
function safeCell_(v,n){let s=clean_(v,n);return /^[=+\-@]/.test(s) ? "'"+s : s;}
function isId_(id){return /^[a-f0-9-]{32,36}$/i.test(id);}
function obtainDb_(){
  const props=PropertiesService.getScriptProperties();
  let id=props.getProperty(DB_KEY);
  if(!id){
    const lock=LockService.getScriptLock();lock.waitLock(25000);
    try{
      id=props.getProperty(DB_KEY);
      if(!id){
        const ss=SpreadsheetApp.create('ACADEMIA NORTEAMERICANA - DIAGNOSTICO INGLES - QA');
        const defaultSheet=ss.getSheets()[0];
        defaultSheet.setName('PARTICIPANTES');
        const issue=ss.insertSheet('OBSERVACIONES');
        for(const [tab,cols] of Object.entries(TABS)){
          const sh=ss.getSheetByName(tab);
          sh.getRange(1,1,1,cols.length).setValues([cols]);
          sh.setFrozenRows(1);
          sh.getRange(1,1,1,cols.length).setFontWeight('bold').setBackground('#12314c').setFontColor('#ffffff');
        }
        id=ss.getId();
        props.setProperty(DB_KEY,id);
      }
    }finally{lock.releaseLock();}
  }
  return SpreadsheetApp.openById(id);
}
function findPerson_(sheet,id){
 const last=sheet.getLastRow();if(last<2)return 0;
 const finder=sheet.getRange(2,1,last-1,1).createTextFinder(id).matchEntireCell(true).findNext();
 return finder?finder.getRow():0;
}
function updatePerson_(db,p,now){
 const sheet=db.getSheetByName('PARTICIPANTES');
 const row=findPerson_(sheet,p.participant_id);
 const name=safeCell_(p.name,60);
 const vals=row?sheet.getRange(row,1,1,8).getValues()[0]:[p.participant_id,name,now,now,0,400,'',''];
 vals[1]=name||vals[1];vals[3]=now;
 if(p.coverage&&Number.isFinite(Number(p.coverage.seen_total))){
   vals[4]=Math.min(400,Math.max(0,Math.round(Number(p.coverage.seen_total))));
   vals[5]=400;
 }
 if(p.diagnostic&&Number.isFinite(Number(p.diagnostic.n))){
   vals[6]=Math.min(25,Math.max(0,Math.round(Number(p.diagnostic.ok))));
   vals[7]=Math.min(25,Math.max(0,Math.round(Number(p.diagnostic.n))));
 }
 if(row)sheet.getRange(row,1,1,8).setValues([vals]);else sheet.appendRow(vals);
}
// Ejecutar UNA vez desde el editor con la cuenta propietaria después de conceder
// únicamente el permiso de Hojas de Cálculo. Nunca exponer este método por doPost.
function setupQaDatabase(){
 const db=obtainDb_();
 console.log('QA DATABASE READY: '+db.getName());
 return {ok:true,ready:true};
}
function doGet(e){
 return json_({ok:true,service:APP,status:'online',version:1,
   storage_ready:!!PropertiesService.getScriptProperties().getProperty(DB_KEY)});
}
function doPost(e){
 let data;
 try {data=JSON.parse(String(e&&e.postData&&e.postData.contents||''));}
 catch(_){return json_({ok:false,error:'json_invalido'});}
 const event=clean_(data.event,15);
 const id=clean_(data.participant_id,40);
 if(!isId_(id)||!['profile','progress','issue'].includes(event))return json_({ok:false,error:'datos_incorrectos'});
 const name=clean_(data.name,60);
 if(name.length<2||name.length>60||!(/^[\p{L}\p{M} .'-]+$/u.test(name)))return json_({ok:false,error:'nombre_invalido'});
 const throttle=CacheService.getScriptCache();
 const rateKey='rate_'+id.slice(0,35);const prev=Number(throttle.get(rateKey)||0);
 if(prev>=30)return json_({ok:false,error:'limite_temporal'});
 throttle.put(rateKey,String(prev+1),60);
 const now=new Date().toISOString();
 const sid=PropertiesService.getScriptProperties().getProperty(DB_KEY);
 if(!sid)return json_({ok:false,error:'servicio_no_inicializado'});
 const lock=LockService.getScriptLock();
 try {
   lock.waitLock(20000);
   const db=SpreadsheetApp.openById(sid);
   updatePerson_(db,{participant_id:id,name,coverage:data.coverage,diagnostic:data.diagnostic},now);
   if(event==='issue'){
     const eventId=clean_(data.event_id,40);
     if(!isId_(eventId))return json_({ok:false,error:'evento_invalido'});
     const item=clean_(data.item_id,60);
     const cat=clean_(data.category,25);
     const form=clean_(data.form,1);
     const part=Number(data.part);
     if(!/^[AB]-[\w-]+$/.test(item)||!TYPES.includes(cat)||!['A','B'].includes(form)||!Number.isInteger(part)||part<1||part>7) {
       return json_({ok:false,error:'reporte_invalido'});
     }
     const sheet=db.getSheetByName('OBSERVACIONES');
     // Idempotencia frente a reintentos offline (deduplicación últimos 500).
     const last=sheet.getLastRow(); if(last>1){
       const count=Math.min(500,last-1);
       const hit=sheet.getRange(last-count+1,1,count,1).createTextFinder(eventId).matchEntireCell(true).findNext();
       if(hit)return json_({ok:true,duplicate:true});
     }
     sheet.appendRow([eventId,now,id,safeCell_(name,60),form,part,item,cat,safeCell_(data.comment,600),safeCell_(data.attempt_id,80),'PENDIENTE']);
   }
   return json_({ok:true,received:event});
 }catch(err){
   console.error('EPL QA inbound failed: '+String(err&&err.message||err));
   return json_({ok:false,error:'error_de_almacenamiento'});
 }finally{try{lock.releaseLock();}catch(_){}}
}
