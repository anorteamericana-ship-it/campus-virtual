// F98.4-Z6-CS21A113 · Vista DOM de Resumen Académico, solo lectura.
(function(){
  'use strict';
  const C=window.A113Core;
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const val=(o,...keys)=>{for(const k of keys)if(o&&o[k]!=null&&o[k]!=='')return o[k];return'';};
  const pct=n=>n==null?'—':`${Math.round(n)}%`;
  const pc01Target='B1-KJ18-C3-0826';
  const pc01Letter=p=>p>=90?'A':p>=87?'B+':p>=80?'B':p>=77?'C+':p>=70?'C':p>=60?'D':'F';
  const pc01Points=p=>(p/4).toLocaleString('es-CR',{maximumFractionDigits:2});
  // Solo lectura del intento PROPIO autorizada por el backend, independiente de notas INA.
  async function ownPc01(portal){
    const group=String(portal?.cod_grupo||portal?.estudiante?.GRUPO||portal?.grupo?.CODIGO_GRUPO||'').trim().toUpperCase();
    const token=window.getSessionToken?.();
    const url=String(window.F111_QZ_API_URL||'');
    if(group!==pc01Target||!token||!url)return null;
    try{
      const fn='qzProgressMyAttempt';
      const res=await fetch(url+'?fn='+encodeURIComponent(fn),{
        method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify({fn,token,cod_grupo:pc01Target,nivel:'B1',leccion:4})
      });
      const v=await res.json();
      if(!res.ok||v?.ok!==true||v.quiz_id!=='IC5_B1_WQ01'||Number(v.peso_oficial)!==0)return null;
      if(!['ENTREGADO','REVISADO'].includes(String(v.estado)))return null;
      return {estado:v.estado,nota:v.estado==='REVISADO'&&v.nota!=null&&
        Number.isFinite(Number(v.nota))&&Number(v.nota)>=0&&Number(v.nota)<=100?Number(v.nota):null,
        comentario:v.estado==='REVISADO'?String(v.comentario_docente||'').trim():'',
        entregado_at:String(v.entregado_at||'')};
    }catch(_){return null;}
  }
  function read(codigo){
    return Promise.allSettled([postStudentPortal('getPortalEstudianteCompleto',{codigo}),postStudentPortal('getMisNotasF921',{codigo}),postStudentPortal('getAsistenciaEstudiante',{codigo})])
      .then(async r=>{
        let portal=r[0].status==='fulfilled'&&r[0].value?.ok?r[0].value:null;
        const notes=r[1].status==='fulfilled'&&r[1].value?.ok?r[1].value:null;
        // Fuente oficial directa: si el portal compuesto conserva un snapshot
        // incompleto, integrar la asistencia del estudiante autenticado.
        const directa=r[2].status==='fulfilled'&&r[2].value?.ok?r[2].value:null;
        if(portal&&Array.isArray(directa?.asistencia)&&directa.asistencia.length){
          const previa=C.arr(portal.asistencia,['asistencia','items','registros']);
          portal={...portal,asistencia:{ok:true,asistencia:[...previa,...directa.asistencia]}};
        }
        // Consultar la fila ACTIVA del grupo; la primera/última fila de
        // GRUPOS puede corresponder a otro nivel o a un docente futuro.
        const grupo=String(portal?.cod_grupo||portal?.estudiante?.GRUPO||'').trim();
        let liveGroup=null;
        const [groupResult,quizResult]=await Promise.allSettled([
          portal&&grupo?postStudentPortal('getGrupoInfo',{cod_grupo:grupo}):Promise.resolve(null),
          portal?ownPc01(portal):Promise.resolve(null)
        ]);
        if(groupResult.status==='fulfilled'&&groupResult.value?.ok)liveGroup=groupResult.value;
        const quiz=quizResult.status==='fulfilled'?quizResult.value:null;
        return {portal,notes,liveGroup,quiz};
      });
  }
  function normalize(portal,notes,level,session,liveGroup,quiz){
    const niveles=portal?.niveles||{},est=portal?.estudiante||{},grupoObj=portal?.grupo||{};
    const evals=C.arr(notes,['evaluaciones']).length?C.arr(notes,['evaluaciones']):C.arr(portal?.evaluaciones,['evaluaciones']);
    const attendance=C.arr(portal?.asistencia,['asistencia','items','registros']),retro=C.arr(portal?.retroalimentacion,['retroalimentacion','items','registros']);
    const active=C.defaultLevel(niveles,notes,portal),levelEvals=evals.filter(r=>C.level(r)===level);
    const group=C.levelGroup(niveles,level)||C.group(levelEvals[0])||C.group(attendance.find(r=>C.level(r)===level))||String(portal?.cod_grupo||grupoObj.CODIGO_GRUPO||session?.grupo||'');
    const match=r=>{
      // Tras cambio de grupo, asistencia real puede traer NIVEL=B1 pero
      // grupo distinto del snapshot de acceso. Priorizar grupo actual.
      const g=C.group(r),n=C.level(r);
      if(g&&group&&C.up(g)!==C.up(group))return false;
      return n?n===level:(!!g&&!!group?C.up(g)===C.up(group):level===active);
    };
    const allAtt=attendance.filter(match),course=C.latest(allAtt.filter(r=>C.up(r?.riel)!=='ICAN'&&C.up(r?.tipo_leccion)!=='ICAN'),r=>'L'+C.lesson(r)),ican=C.latest(allAtt.filter(r=>C.up(r?.riel)==='ICAN'||C.up(r?.tipo_leccion)==='ICAN'),r=>'I'+C.lesson(r));
    const levelRetro=retro.filter(match),pcRows=C.latest(levelRetro.filter(r=>C.up(r?.tipo)==='PROGRESS_CHECK'),r=>'P'+C.lesson(r)),pcMap=new Map(pcRows.map(r=>[C.lesson(r),r]));
    const pc01=level==='B1'&&C.up(group)===pc01Target&&quiz&&['ENTREGADO','REVISADO'].includes(quiz.estado)?quiz:null;
    const levelProgram=val(niveles?.[level],'PROGRAMA','programa');
    // GRUPOS es fuente institucional; la sesión INA no debe quedar anulada por el fallback SIN_INA del portal.
    const program=C.up(grupoObj.PROGRAMA||grupoObj.programa||levelProgram||session?.programa||session?.PROGRAMA||portal?.programa||val(levelEvals.find(r=>r?.programa),'programa')).replace(/[\s-]+/g,'_');
    const isINA=['INA','CON_INA','CONINA'].includes(program)||levelEvals.some(r=>C.type(r)==='ICAN')||ican.length>0;
    const defs=C.DEFS.filter(d=>d[0]!=='ICAN'||isINA).map(d=>{const[key,title,lesson,kind]=d,row=levelEvals.find(r=>C.type(r)===key),max=key==='ICAN'?20:key==='SOCIAL'?10:(isINA&&kind==='written'?5:15),registered=C.registered(row),rawMax=C.num(row?.max??row?.peso_maximo,max)||max,raw=C.num(row?.nota??row?.puntos,0)||0,p=registered?Math.max(0,Math.min(100,C.num(row?.pct,null)??(raw/rawMax*100))):0;return{key,title,lesson,max,registered,pct:p,points:registered?Math.round((rawMax===max?raw:p*max/100)*100)/100:0};});
    const totalMax=defs.reduce((s,x)=>s+x.max,0)||100,total=Math.round(defs.reduce((s,x)=>s+x.points,0)*100)/100,official=C.final(niveles,level),grade=official??total;
    const cp=course.filter(r=>C.presence(r)==='p').length,ca=course.filter(r=>C.presence(r)==='a').length,ip=ican.filter(r=>C.presence(r)==='p').length;
    return{niveles,est,grupoObj,active,level,group,course,ican,levelRetro,pcMap,isINA,defs,totalMax,total,official,grade,cp,ca,cPct:course.length?cp/course.length*100:null,ip,iPct:ican.length?ip/ican.length*100:null,pcDone:C.PC.filter(n=>String(pcMap.get(n)?.comentario||'').trim()).length+
    (pc01?.estado==='REVISADO'&&pc01.comentario&&!String(pcMap.get(4)?.comentario||'').trim()?1:0),
    pc01,status:C.status(niveles,level),name:C.name(est.NOMBRE||session?.nombre),teacher:(level===active&&liveGroup?.teacherName)||(level===active&&liveGroup?.docente)||((level===active&&C.up(C.group(grupoObj))===C.up(group))?grupoObj.DOCENTE:'')||'Por confirmar',schedule:grupoObj.HORARIO||grupoObj.HORARIO_CURSO||portal?.horario||'Según cronograma'};
  }
  function matrix(rows,total,prefix){const m=new Map((rows||[]).map(r=>[C.lesson(r),r]));return `<div class="as113-matrix">${Array.from({length:total},(_,i)=>{const n=i+1,s=m.has(n)?C.presence(m.get(n)):'x';return `<div class="s-${s}"><span>${prefix}${String(n).padStart(2,'0')}</span><b>${s==='p'?'P':s==='a'?'A':'—'}</b></div>`}).join('')}</div>`;}
  function panel(title,sub,body,action=''){return `<section class="as113-panel"><header><div><h2>${esc(title)}</h2><p>${esc(sub)}</p></div>${action?`<button data-go="${action}">Abrir detalle</button>`:''}</header>${body}</section>`;}
  function render(node,d,codigo){
    const levelButtons=C.LEVELS.map(n=>`<button data-level="${n}" class="${n===d.level?'active':''}" style="--c:${C.COLORS[n]}"><strong>${n}</strong><span>${C.NAMES[n]}</span><small>${C.status(d.niveles,n)} · ${C.final(d.niveles,n)??'—'}</small></button>`).join('');
    const evalCards=d.defs.map(x=>`<article><small>${x.lesson?`Lección ${String(x.lesson).padStart(2,'0')}`:'Nivel'}</small><h3>${esc(x.title)}</h3><div><b>${x.registered?x.points:'—'}</b><span>/ ${x.max}</span></div><i><u style="width:${x.pct}%"></u></i><p>${x.registered?`${Math.round(x.pct)}% obtenido`:'Pendiente'}</p></article>`).join('');
    const pcs=C.PC.map((n,i)=>{
      const text=String(d.pcMap.get(n)?.comentario||'').trim();
      if(n===4&&d.pc01){
        const q=d.pc01,reviewed=q.estado==='REVISADO',score=q.nota;
        const label=reviewed?(score!=null?`${esc(pc01Points(score))}/25 · ${score}% · ${esc(pc01Letter(score))}`:'Revisado · resultado no disponible'):
          'Entregado · pendiente de revisión docente';
        return `<article class="${reviewed?'done':''}"><b>${i+1}</b><div><h3>Lección 04 · Quiz 1</h3><p><strong>${label}</strong> · Ponderación oficial 0%</p><p>${reviewed?esc(q.comentario||'Revisión registrada; comentario no disponible.'):'La prueba ya fue entregada; no necesitás enviarla otra vez.'}</p>${text&&reviewed&&text!==q.comentario?`<p>Seguimiento académico: ${esc(text)}</p>`:''}</div></article>`;
      }
      return `<article class="${text?'done':''}"><b>${i+1}</b><div><h3>Lección ${String(n).padStart(2,'0')}</h3><p>${esc(text||'Sin retroalimentación registrada.')}</p></div></article>`;
    }).join('');
    const quizRetro=d.pc01?.estado==='REVISADO'&&d.pc01.comentario?
      [{tipo:'QUIZ_PROGRESS',leccion:4,comentario:d.pc01.comentario,fecha:d.pc01.entregado_at}]:[];
    const feedback=C.latest([...d.levelRetro.filter(r=>String(r?.comentario||'').trim()),...quizRetro],r=>`${C.up(r?.tipo)}|${C.lesson(r)}`).sort((a,b)=>String(b?.fecha||'').localeCompare(String(a?.fecha||'')).slice(0,7).map(r=>`<article><b></b><div><small>${C.up(r?.tipo)==='QUIZ_PROGRESS'?'Quiz 1 · Revisado':C.up(r?.tipo)==='PROGRESS_CHECK'?'Progress Check':'Retroalimentación'} · L${String(C.lesson(r)||'—').padStart(2,'0')} · ${C.date(r?.fecha)}</small><p>${esc(r?.comentario)}</p></div></article>`).join('')||'<div class="as113-empty">○ <span>Todavía no hay comentarios registrados para este nivel.</span></div>';
    node.innerHTML=`<div class="as113-root" style="--as113-level:${C.COLORS[d.level]}"><header class="as113-header"><div><span>Expediente académico consolidado</span><h1>Resumen <em>Académico</em></h1><p>Notas, asistencia, Club I CAN, Progress Check y retroalimentación en una sola vista.</p></div><button data-refresh>↻ Actualizar</button></header><section class="as113-profile"><b>${esc(d.name.split(' ').slice(0,2).map(x=>x[0]).join(''))}</b><div><h2>${esc(d.name)}</h2><p>Código ${esc(codigo)} · Grupo ${esc(d.group||'—')}</p></div><div class="as113-meta"><span>Docente</span><strong>${esc(d.teacher)}</strong></div><div class="as113-meta"><span>Horario</span><strong>${esc(d.schedule)}</strong></div><div class="as113-meta"><span>Libro</span><strong>${esc(C.BOOKS[d.level])}</strong></div></section><nav class="as113-levels">${levelButtons}</nav><section class="as113-metrics"><article class="as113-grade"><div class="as113-ring" style="--p:${Math.max(0,Math.min(100,d.grade))*3.6}deg"><b>${d.grade}</b><span>de ${d.totalMax}</span></div><div><small>Resultado del nivel</small><h2>${d.status==='CA'?'En curso':d.status==='APR'?'Aprobado':esc(d.status)}</h2><p>${d.defs.filter(x=>x.registered).length}/${d.defs.length} componentes registrados</p></div></article><article class="as113-metric"><small>Asistencia</small><b>${pct(d.cPct)}</b><p>${d.cp} presentes · ${d.ca} ausentes</p></article><article class="as113-metric"><small>Club I CAN</small><b>${d.isINA?pct(d.iPct):'No aplica'}</b><p>${d.isINA?`${d.ican.length}/16 registradas`:'Programa sin I CAN'}</p></article><article class="as113-metric"><small>Progress Check</small><b>${d.isINA?`${d.pcDone}/8`:'No aplica'}</b><p>${d.isINA?'Seguimientos con comentario':'Programa sin este componente'}</p></article></section>${panel('Registro de evaluaciones','Puntajes calculados con el máximo oficial de cada componente.',`<div class="as113-evals">${evalCards}</div><footer><span>Suma de componentes <b>${d.total}/${d.totalMax}</b></span><span>Nota oficial <b>${d.official??'En construcción'}</b></span></footer>`,'evaluaciones')}<section class="as113-columns">${panel('Asistencia al programa','32 lecciones oficiales',matrix(d.course,32,'L'),'mi_curso')}${panel('Club I CAN',d.isINA?'16 sesiones complementarias':'No aplica para este nivel',d.isINA?matrix(d.ican,16,'I'):'<div class="as113-empty">○ <span>El programa registrado no exige Club I CAN.</span></div>',d.isINA?'ican':'')}</section><section class="as113-columns">${panel('Progress Check','8 momentos de seguimiento formativo',`<div class="as113-pc">${pcs}</div>`)}${panel('Retroalimentación reciente','Comentarios formativos del docente',`<div class="as113-feedback">${feedback}</div>`)}</section><section class="as113-bottom"><div><small>Consulta integral</small><h2>Todo el nivel, sin saltar entre pantallas</h2><p>Las vistas originales permanecen como detalle oficial.</p></div><div><button data-go="mi_curso">Mi curso</button><button data-go="evaluaciones">Evaluaciones</button>${d.isINA?'<button data-go="ican">Club I CAN</button>':''}</div></section></div>`;
  }
  function mount(node,options={}){let disposed=false,cache=null,level='';const session=window.getSesion?.()||{},codigo=String(session.codigo||session.rec_m||'');const showLoading=()=>node.innerHTML='<div class="as113-root as113-loading"><div></div><section></section><section></section></div>';const load=()=>{showLoading();return read(codigo).then(x=>{if(disposed)return;cache=x;if(!x.portal&&!x.notes)throw new Error('No fue posible cargar el expediente académico.');level=level||C.defaultLevel(x.portal?.niveles||{},x.notes,x.portal);render(node,normalize(x.portal,x.notes,level,session,x.liveGroup,x.quiz),codigo);});};node.addEventListener('click',e=>{const levelBtn=e.target.closest('[data-level]'),go=e.target.closest('[data-go]'),refresh=e.target.closest('[data-refresh]');if(levelBtn&&cache){level=levelBtn.dataset.level;render(node,normalize(cache.portal,cache.notes,level,session,cache.liveGroup,cache.quiz),codigo);}else if(go){const target=go.dataset.go;options.onNavigate?.(target,target==='mi_curso'?{tab:'cronograma'}:target==='evaluaciones'?{tab:'resultados'}:{});}else if(refresh)load();});load().catch(err=>{node.innerHTML=`<div class="as113-error"><h1>No se pudo cargar el Resumen Académico</h1><p>${esc(err.message)}</p><button data-refresh>Reintentar</button></div>`;});return()=>{disposed=true;node.replaceChildren();};}
  window.mountStudentAcademicSummaryCS21A113=mount;
})();
