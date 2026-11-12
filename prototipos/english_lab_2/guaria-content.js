/* Solo visualización del candidato; los IDs académicos y respuestas se conservan. */
(function(){
'use strict';
var map=[
 ['Port Hazel','Ciudad Guaria'],
 ['The Corner Cup','Café La Esquina'],
 ['Harbor Gifts','Detalles de la Plaza'],
 ['Hazel Street Hostel','Hostal de la Plaza'],
 ['una ciudad donde nadie habla español','una ciudad costarricense donde cada misión se resuelve en inglés'],
 ['Nadie habla español','La misión se resuelve en inglés']
];
function replaceText(s){return map.reduce(function(v,p){return v.split(p[0]).join(p[1]);},s);}
function visit(o){
 if(!o||typeof o!=='object')return;
 Object.keys(o).forEach(function(k){
   if(k==='id'||k==='episode'||k==='weeklyId'||k==='key'||k==='skill'||k==='version')return;
   if(typeof o[k]==='string')o[k]=replaceText(o[k]);
   else if(typeof o[k]==='object')visit(o[k]);
 });
}
if(window.LAB2_CONTENT)visit(window.LAB2_CONTENT);
})();
