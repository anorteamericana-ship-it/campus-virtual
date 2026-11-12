/* Póster de contexto: fotograma con la ciudad visible, no un acercamiento al cartel. */
import { createRequire } from 'node:module';
import { fileURLToPath,pathToFileURL } from 'node:url';
import path from 'node:path';import fs from 'node:fs';
const here=path.dirname(fileURLToPath(import.meta.url));
const {chromium}=createRequire(import.meta.url)('playwright');
const b=await chromium.launch({channel:'chrome'});
const c=await b.newContext({viewport:{width:1280,height:720}});
try{
 for(const [scene,stem,time] of [['cafe','guaria_cafe',3.7],['gifts','guaria_gifts',3.7]]){
  const p=await c.newPage();
  await p.goto(pathToFileURL(path.join(here,'guaria_scene.html')).href+'?scene='+scene);
  const data=await p.evaluate(t=>{window.draw(t);return document.querySelector('#c').toDataURL('image/jpeg',.85).split(',')[1]},time);
  const dest=path.join(here,'..','media',stem+'_poster.jpg');
  fs.writeFileSync(dest,Buffer.from(data,'base64'));
  console.log(scene,'poster',dest,fs.statSync(dest).size);
  await p.close();
 }
}finally{await b.close()}
