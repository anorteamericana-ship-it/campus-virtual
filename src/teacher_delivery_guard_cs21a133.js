// F98.4-Z6-CS21A133 · Estabilización de Mis Grupos y Cronograma docente.
// - Usa la fecha de Costa Rica en el fallback del panel docente.
// - Evita solicitudes de inicio/cierre duplicadas mientras una operación idéntica sigue en curso.
// - No cambia endpoints, permisos ni datos académicos.
(function(){
  'use strict';

  var VERSION = 'F98.4-Z6-CS21A133';
  var singleFlight = new Map();

  function text(value){ return String(value == null ? '' : value).trim(); }
  function upper(value){ return text(value).toUpperCase(); }

  function costaRicaIso(date){
    var current = date instanceof Date ? date : new Date();
    try {
      var parts = new Intl.DateTimeFormat('en-US', {
        timeZone:'America/Costa_Rica', year:'numeric', month:'2-digit', day:'2-digit'
      }).formatToParts(current);
      var values = {};
      parts.forEach(function(part){ if (part.type !== 'literal') values[part.type] = part.value; });
      if (values.year && values.month && values.day) return values.year + '-' + values.month + '-' + values.day;
    } catch (_) {}
    return current.getFullYear() + '-' + String(current.getMonth()+1).padStart(2,'0') + '-' + String(current.getDate()).padStart(2,'0');
  }

  function lessonRail(row){
    var rail = text(row && (row.riel || row.RIEL)).toLowerCase();
    var type = upper(row && (row.tipo || row.TIPO));
    return rail === 'ican' || type === 'ICAN' ? 'ican' : 'curso';
  }

  function lessonSort(a,b){
    var da = text(a && a.fecha), db = text(b && b.fecha);
    if (da !== db) return da.localeCompare(db);
    var ra = lessonRail(a), rb = lessonRail(b);
    if (ra !== rb) return ra === 'curso' ? -1 : 1;
    return Number(a && a.leccion || 0) - Number(b && b.leccion || 0);
  }

  function normalizeFallbackToday(result){
    if (!result || result.ok !== true || !Array.isArray(result.lecciones)) return result;
    if (!(result.parcial === true || upper(result.version) === 'F80_FALLBACK')) return result;

    var today = costaRicaIso();
    var rows = result.lecciones
      .filter(function(row){
        return text(row && row.fecha).slice(0,10) === today && upper(row && row.estado) !== 'FERIADO';
      })
      .slice()
      .sort(lessonSort);
    var next = rows.find(function(row){ return upper(row && row.estado) !== 'CERRADA'; }) || rows[0] || null;
    if (result.leccion_hoy === next) return result;
    return Object.assign({}, result, { leccion_hoy:next });
  }

  function operationKey(fn,payload){
    payload = payload || {};
    return [
      fn,
      text(payload.cod_grupo || payload.codGrupo || payload.grupo),
      upper(payload.nivel),
      Number(payload.leccion || 0),
      text(payload.riel || 'curso').toLowerCase()
    ].join('|');
  }

  function isProtectedWrite(fn){
    return [
      'docenteIniciarSesionClaseF77',
      'docenteCerrarClaseConAsistenciaF87',
      'docenteFinalizarSesionClaseF77'
    ].indexOf(text(fn)) >= 0;
  }

  function install(){
    var patched = [];

    var panelBase = null;
    try { panelBase = typeof cargarPanelDocenteF80 === 'function' ? cargarPanelDocenteF80 : window.cargarPanelDocenteF80; } catch (_) { panelBase = window.cargarPanelDocenteF80; }
    if (typeof panelBase === 'function' && panelBase.__cs21a133 !== true) {
      var panelWrapped = function(){
        return Promise.resolve(panelBase.apply(this, arguments)).then(normalizeFallbackToday);
      };
      panelWrapped.__cs21a133 = true;
      panelWrapped.__base = panelBase;
      window.cargarPanelDocenteF80 = panelWrapped;
      try { cargarPanelDocenteF80 = panelWrapped; } catch (_) {}
      patched.push('cargarPanelDocenteF80');
    }

    var todayBase = null;
    try { todayBase = typeof tvIsToday === 'function' ? tvIsToday : window.tvIsToday; } catch (_) { todayBase = window.tvIsToday; }
    if (typeof todayBase === 'function' && todayBase.__cs21a133 !== true) {
      var todayWrapped = function(value){ return text(value).slice(0,10) === costaRicaIso(); };
      todayWrapped.__cs21a133 = true;
      todayWrapped.__base = todayBase;
      window.tvIsToday = todayWrapped;
      try { tvIsToday = todayWrapped; } catch (_) {}
      patched.push('tvIsToday');
    }

    var postBase = null;
    try { postBase = typeof postTeacher === 'function' ? postTeacher : window.postTeacher; } catch (_) { postBase = window.postTeacher; }
    if (typeof postBase === 'function' && postBase.__cs21a133 !== true) {
      var postWrapped = function(fn,payload,timeoutMs){
        if (!isProtectedWrite(fn)) return postBase.apply(this, arguments);
        var key = operationKey(fn,payload);
        if (singleFlight.has(key)) return singleFlight.get(key);
        var task = Promise.resolve().then(function(){ return postBase(fn,payload,timeoutMs); });
        singleFlight.set(key, task);
        task.finally(function(){ if (singleFlight.get(key) === task) singleFlight.delete(key); });
        return task;
      };
      postWrapped.__cs21a133 = true;
      postWrapped.__base = postBase;
      window.postTeacher = postWrapped;
      try { postTeacher = postWrapped; } catch (_) {}
      patched.push('postTeacher');
    }

    window.__AN_TEACHER_DELIVERY_GUARD_CS21A133 = {
      version:VERSION,
      today_costa_rica:costaRicaIso(),
      patched:patched,
      pending_writes:singleFlight.size
    };
    return patched.length > 0;
  }

  window.anTeacherDeliveryDebugCS21A133 = function(){
    return {
      version:VERSION,
      today_costa_rica:costaRicaIso(),
      panel_patched:!!(window.cargarPanelDocenteF80 && window.cargarPanelDocenteF80.__cs21a133),
      today_patched:!!(window.tvIsToday && window.tvIsToday.__cs21a133),
      post_patched:!!(window.postTeacher && window.postTeacher.__cs21a133),
      pending_writes:Array.from(singleFlight.keys())
    };
  };

  window.addEventListener('an:lazy-module-loaded', function(){ window.setTimeout(install,0); });
  window.addEventListener('an:session-changed', function(){ window.setTimeout(install,0); });
  install();
  var attempts = 0;
  var timer = window.setInterval(function(){
    install();
    attempts += 1;
    if (attempts > 120 || (window.cargarPanelDocenteF80 && window.cargarPanelDocenteF80.__cs21a133 && window.postTeacher && window.postTeacher.__cs21a133)) {
      window.clearInterval(timer);
    }
  },100);
})();
