/* global window */
(function conapeCompareUiC371(){
  'use strict';

  function text(v){ return String(v == null ? '' : v).trim(); }
  function digits(v){ return text(v).replace(/\D/g, ''); }
  function phoneDigits(v){
    const d=digits(v);
    if(d.length===11&&d.startsWith('506')) return d.slice(3);
    return d.slice(-8);
  }
  function email(v){ return text(v).toLowerCase(); }
  function key(v){
    return text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
  }
  function first(obj, keys){
    for(const k of keys){ const v=obj&&obj[k]; if(v!=null&&text(v)!=='') return v; }
    return '';
  }
  function cmp(a,b,normalizer=key){
    const av=normalizer(a), bv=normalizer(b);
    if(!av&&!bv) return 'vacio';
    if(!av||!bv) return 'falta';
    return av===bv?'igual':'diferente';
  }
  function contactDecision(campusValue, conapeValue, normalizer){
    const c=normalizer(campusValue), k=normalizer(conapeValue);
    if(!c) return { final:conapeValue||'', action:'Conservar CONAPE' };
    if(!k) return { final:campusValue, action:'Completar desde Campus' };
    if(c===k) return { final:conapeValue||campusValue, action:'Coincide' };
    return { final:campusValue, action:'Actualizar desde Campus' };
  }

  function campusIdentity(raw, conape){
    const full=text(first(raw,['nombre','NOMBRE','nombre_completo','NOMBRE_COMPLETO']));
    const a1=text(first(raw,['apellido_1','primer_apellido','APELLIDO_1','PRIMER_APELLIDO']));
    const a2=text(first(raw,['apellido_2','segundo_apellido','APELLIDO_2','SEGUNDO_APELLIDO']));
    const given=text(first(raw,['nombres','NOMBRES','nombre_persona','NOMBRE_PERSONA']));
    if(a1||a2||given) return { apellido_1:a1, apellido_2:a2, nombre:given||full, full };

    const expected=[conape.apellido_1,conape.apellido_2,conape.nombre].filter(Boolean).join(' ');
    if(full && expected && key(full)===key(expected)) {
      return { apellido_1:conape.apellido_1, apellido_2:conape.apellido_2, nombre:conape.nombre, full };
    }

    const parts=full.split(/\s+/).filter(Boolean);
    if(parts.length>=3){
      return { apellido_1:parts[0], apellido_2:parts[1], nombre:parts.slice(2).join(' '), full };
    }
    return { apellido_1:'', apellido_2:'', nombre:full, full };
  }

  function buildComparison(campusRaw, conapeRaw){
    const cRaw=campusRaw||{};
    const kRaw=conapeRaw||{};
    const conape={
      cedula:digits(first(kRaw,['cedula','CEDULA','P2_PRS_CEDULA'])),
      apellido_1:text(first(kRaw,['apellido_1','primer_apellido','APELLIDO_1','PRIMER_APELLIDO','P2_PRS_APELLIDO_1'])),
      apellido_2:text(first(kRaw,['apellido_2','segundo_apellido','APELLIDO_2','SEGUNDO_APELLIDO','P2_PRS_APELLIDO_2'])),
      nombre:text(first(kRaw,['nombre','NOMBRE','P2_PRS_NOMBRE'])),
      correo:email(first(kRaw,['correo','email','CORREO','EMAIL','correo_electronico','P2_PRS_EMAIL'])),
      telefono:phoneDigits(first(kRaw,['telefono','telefono_celular','TELEFONO','TELEFONO_CELULAR','P2_PRS_CELULAR'])),
    };
    const identity=campusIdentity(cRaw,conape);
    const campus={
      cedula:digits(first(cRaw,['cedula','CEDULA'])),
      apellido_1:identity.apellido_1,
      apellido_2:identity.apellido_2,
      nombre:identity.nombre,
      nombre_completo:identity.full,
      correo:email(first(cRaw,['correo','email','CORREO','EMAIL','correo_electronico','CORREO_ELECTRONICO'])),
      whatsapp:phoneDigits(first(cRaw,['whatsapp','WHATSAPP','telefono','TELEFONO','tel1','TEL1'])),
    };
    const phone=contactDecision(campus.whatsapp,conape.telefono,phoneDigits);
    const mail=contactDecision(campus.correo,conape.correo,email);
    const identityFound=!!(conape.apellido_1&&conape.nombre);
    return {
      campus, conape, identityFound,
      rows:[
        {key:'cedula',label:'Cédula',campus:campus.cedula,conape:conape.cedula,final:conape.cedula||campus.cedula,state:cmp(campus.cedula,conape.cedula,digits),rule:'Coincidencia por cédula'},
        {key:'apellido_1',label:'Primer Apellido',campus:campus.apellido_1,conape:conape.apellido_1,final:conape.apellido_1,state:cmp(campus.apellido_1,conape.apellido_1,key),rule:'Comparación Campus ↔ CONAPE · no se modifica identidad'},
        {key:'apellido_2',label:'Segundo Apellido',campus:campus.apellido_2,conape:conape.apellido_2,final:conape.apellido_2,state:cmp(campus.apellido_2,conape.apellido_2,key),rule:'Comparación Campus ↔ CONAPE · no se modifica identidad'},
        {key:'nombre',label:'Nombre',campus:campus.nombre,conape:conape.nombre,final:conape.nombre,state:cmp(campus.nombre,conape.nombre,key),rule:'Comparación Campus ↔ CONAPE · no se modifica identidad'},
        {key:'telefono',label:'Teléfono',campus:campus.whatsapp,conape:conape.telefono,final:phone.final,state:cmp(campus.whatsapp,conape.telefono,phoneDigits),rule:`${phone.action} · WhatsApp Campus normalizado a 8 dígitos`},
        {key:'correo',label:'Correo',campus:campus.correo,conape:conape.correo,final:mail.final,state:cmp(campus.correo,conape.correo,email),rule:mail.action},
      ],
      payload:{
        cedula:conape.cedula||campus.cedula,
        telefono:phone.final,
        correo:mail.final,
        update_telefono:!!campus.whatsapp&&phoneDigits(campus.whatsapp)!==phoneDigits(conape.telefono),
        update_correo:!!campus.correo&&email(campus.correo)!==email(conape.correo),
        identity_source:'CONAPE_CEDULA_LOOKUP',
      },
    };
  }

  // Namespace estable C3.7.1+ para evitar que Babel vuelva a publicar el helper legacy C3.3
  // después de cargar este script. El alias C33 se conserva por compatibilidad, pero los
  // consumidores nuevos deben preferir C371.
  window.conapeRecruitBuildComparisonC371=buildComparison;
  window.conapeRecruitBuildComparisonC33=buildComparison;
})();
