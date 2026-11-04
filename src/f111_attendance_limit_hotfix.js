/* F111 Attendance limits · UI-only, three roles.
   INA: 4 ordinary absences and 2 I CAN absences. SIN INA: 70% attendance rule
   shown as reference, not misrepresented as the INA absence cap.
   Never infer absences from missing records, future sessions or absent backend data. */
(function(root){
  'use strict';
  const VERSION='F111ATTENDLIMIT20261103A';
  const maxINA={course:4,ican:2};
  const tone={
    good:{label:'¡Excelente! Asistencia impecable',bg:'#ECF8EF',border:'#BFE4C9',fg:'#226940',dot:'#3EAF70'},
    safe:{label:'Vas muy bien · dentro del límite',bg:'#EBF6EF',border:'#C8E9D2',fg:'#277548',dot:'#5ABA78'},
    near:{label:'Atención · próximo al límite',bg:'#FFF6E4',border:'#F2D69A',fg:'#966006',dot:'#D99B25'},
    at:{label:'Límite alcanzado · seguimiento',bg:'#FFF0D7',border:'#E8C178',fg:'#875402',dot:'#C98510'},
    over:{label:'Límite superado · seguimiento urgente',bg:'#FBE5E8',border:'#F2BAC3',fg:'#9B203A',dot:'#A72242'},
    unknown:{label:'Datos de asistencia por verificar',bg:'#F2F5FA',border:'#D6DEEB',fg:'#586B85',dot:'#98A6BA'},
    other:{label:'Seguimiento según asistencia mínima',bg:'#F2F5FA',border:'#D6DEEB',fg:'#475F7C',dot:'#7C92B0'}
  };
  const str=x=>String(x==null?'':x).trim();
  const upper=x=>str(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[\s-]+/g,'_');
  const programKind=raw=>{
    const p=upper(raw);
    if(p==='INA'||p==='CON_INA')return 'INA';
    if(['SIN_INA','NO_INA','PROPIO','REGULAR','ACADEMIA'].includes(p))return 'SIN_INA';
    return 'UNKNOWN';
  };
  function present(row){
    if(!row||typeof row!=='object')return null;
    if(row.p===true||row.present===true||row.presente===true)return true;
    if(row.p===false||row.present===false||row.presente===false)return false;
    const label=upper(row.asistencia??row.estado??row.ESTADO??row.presente??row.PRESENTE);
    if(['P','PRESENTE','TRUE','SI','1'].includes(label))return true;
    if(['A','AUSENTE','FALSE','NO','0'].includes(label))return false;
    return null;
  }
  function rail(row){
    const raw=upper(row?.r||row?.rail||row?.riel||row?.RIEL||row?.kind||row?.tipo||row?.TIPO||row?.l?.riel||row?.l?.tipo);
    return raw==='ICAN'||raw==='I_CAN'||raw==='CLUB_ICAN'?'ican':'course';
  }
  function duration(row){
    const src=[row,row?.l||{},row?.lesson||{}];
    for(const x of src){
      for(const field of ['duracion_horas','horas_duracion','horas_reales','horas_clase','duracionHoras','horas']){
        const v=x?.[field];
        if(v===undefined||v===null||v==='')continue;
        if(typeof v==='number'&&Number.isFinite(v)&&v>0&&v<=12)return v;
        if(/^\d{1,2}:\d{2}$/.test(str(v))){const [h,m]=str(v).split(':').map(Number);if(h+m/60>0&&h+m/60<=12&&m<60)return h+m/60;}
      }
    }
    return null;
  }
  function normalize(rows){
    const byKey=new Map();
    (Array.isArray(rows)?rows:[]).forEach((row,i)=>{
      if(!row||typeof row!=='object')return;
      const kind=rail(row),n=Number(row.leccion??row.leccion_num??row.l?.leccion??0);
      const code=str(row.key||row.k||(n>0?String(n):'')||row.fecha||row.date||('idx_'+i));
      const key=kind+':'+code;
      const value={kind,p:present(row),hours:duration(row)};
      const prev=byKey.get(key);
      // Prefer an actual P/A result over an incomplete duplicate record.
      if(!prev||prev.p===null&&value.p!==null)byKey.set(key,value);
    });
    return [...byKey.values()];
  }
  function summarize({rows,program}={}){
    const kind=programKind(program),list=normalize(rows),known=list.filter(x=>x.p!==null);
    const by={course:{absent:0,present:0,recorded:0,events:0,hours:0,hoursKnown:true},
              ican:{absent:0,present:0,recorded:0,events:0,hours:0,hoursKnown:true}};
    list.forEach(x=>{
      const b=by[x.kind];b.events++;
      if(x.p===null)return;
      b.recorded++;
      if(x.p===true){b.present++;return;}
      b.absent++;
      if(x.hours===null)b.hoursKnown=false;else b.hours+=x.hours;
    });
    const available=known.length>0;
    // SIN INA requires >=70% attendance. Derive an absence cap only when the
    // official scheduled course has an entire known 16- or 32-lesson rail.
    // Do not use the count of completed rows as a fake full-course denominator.
    const fullCourse=[16,32].includes(by.course.events)?by.course.events:null;
    const maxNonINA=fullCourse===null?null:fullCourse-Math.ceil(fullCourse*.70);
    const limits=kind==='INA'?maxINA:{course:kind==='SIN_INA'?maxNonINA:null,ican:null};
    let status=available?'other':'unknown';
    if(kind==='INA'&&available){
      const {course,ican}=by;
      const used=[course.absent,ican.absent];
      if(used.some((n,i)=>n>[limits.course,limits.ican][i]))status='over';
      else if(used.some((n,i)=>n===[limits.course,limits.ican][i]))status='at';
      else if(used.some((n,i)=>n>=[limits.course-1,limits.ican-1][i]))status='near';
      else if(course.absent+ican.absent===0)status='good';
      else status='safe';
    }
    if(kind==='SIN_INA'&&available&&maxNonINA!==null){
      const n=by.course.absent,max=maxNonINA;
      if(n>max)status='over';
      else if(n===max)status='at';
      else if(n===max-1)status='near';
      else if(n===0)status='good';
      else status='safe';
    }
    // No success banner if the entire course has no attendance records.
    return{kind,by,limits,status,available,known:known.length,sourceRows:list.length};
  }
  const h=(tag,props,...children)=>root.React.createElement(tag,props,...children);
  const readableHours=b=>b.absent===0?'0 h':b.hoursKnown?Number(b.hours.toFixed(2)).toLocaleString('es-CR')+' h':'horas por confirmar';
  function Rail({name,stats,limit,kind}){
    if(!stats.events&&!stats.recorded)return h('span',{className:'f111-al-muted'},name+': sin registros verificables');
    const dots=limit!=null?Array.from({length:limit},(_,i)=>{
      const missed=i<stats.absent;
      const color=kind==='ican'?'#6E438D':'#265893';
      return h('i',{key:i,className:'f111-al-dot '+(missed?'used':'empty'),
        style:missed?{'--al-dot':color}:{'--al-dot':color},
        'aria-hidden':true});
    }):[];
    return h('span',{className:'f111-al-rail'},
      h('b',null,name),
      limit!=null?h('span',{className:'f111-al-dots'},...dots):null,
      h('small',null,stats.absent+' '+(limit!=null?'de '+limit:'faltas registradas')+
        (limit!=null?' · ':' · ')+readableHours(stats)),
      limit!=null&&stats.absent>limit?h('strong',{className:'f111-al-overcount'},'+'+(stats.absent-limit)):null);
  }
  function Panel({rows,program,compact=false,label='Estado de asistencia'}){
    const s=summarize({rows,program}),c=tone[s.status],hasIcan=s.by.ican.events>0;
    return h('span',{className:'f111-al '+(compact?'f111-al-compact ':'')+'f111-al-'+s.status,
      'data-f111-att-limit':s.kind,role:'group','aria-label':label},
      h('span',{className:'f111-al-top'},
        h('span',{className:'f111-al-title'},'AUSENCIAS · SEGUIMIENTO'),
        h('span',{className:'f111-al-program'},s.kind==='INA'?'INA · 4 lecciones / 2 I CAN':
          s.kind==='SIN_INA'?'SIN INA · asistencia mínima 70%':'Programa por confirmar')),
      h('span',{className:'f111-al-rails'},
        h(Rail,{name:'Lecciones',stats:s.by.course,limit:s.limits.course,kind:'course'}),
        s.kind==='INA'?h(Rail,{name:'I CAN',stats:s.by.ican,limit:s.limits.ican,kind:'ican'}):
          hasIcan?h(Rail,{name:'I CAN',stats:s.by.ican,limit:null,kind:'ican'}):null),
      h('span',{className:'f111-al-state',style:{background:c.bg,color:c.fg,borderColor:c.border}},
        h('span',{className:'f111-al-status-dot',style:{background:c.dot},'aria-hidden':true}),
        (s.kind==='INA'||s.kind==='SIN_INA'&&s.limits.course!==null)?c.label:s.available?
          s.kind==='SIN_INA'?'Asistencia mínima 70% · calendario por confirmar':'Programa sin regla de límite verificada':
          'Sin registro suficiente · no se asume ausencia'),
      !s.by.ican.events&&s.kind==='INA'?h('span',{className:'f111-al-smallnote'},'I CAN: aún sin registros en esta consulta'):null
    );
  }
  root.F111AttendanceLimit={VERSION,present,rail,duration,normalize,programKind,summarize,Panel};
})(window);
