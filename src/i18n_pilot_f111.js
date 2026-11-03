/* F111 · i18n pilot: role-aware, opt-in, no DOM rewriting.
   Activate only with campus.html?i18n=preview. Production default remains ES.
   No persistent data, no Apps Script changes, no translated identifiers. */
(function (root) {
  'use strict';
  const params = new URLSearchParams(root.location.search);
  const preview = params.get('i18n') === 'preview';
  const KEY = 'an_i18n_pilot_lang';
  const STAMP = 'an_i18n_pilot_login';
  const DICTIONARY = Object.freeze({
    'Menú':'Menu', 'Gestión':'Management', 'Prematrícula':'Pre-enrollment',
    'Mi Campus':'My Campus', 'Mi curso':'My Course',
    'Evaluaciones':'Assessments', 'Exámenes':'Exams',
    'Club I CAN':'Club I CAN', 'Pagos y estado de cuenta':'Payments & Account Statement',
    'Certificados':'Certificates', 'Documentos y ayuda':'Documents & Help',
    'Mi Perfil':'My Profile', 'Mis Grupos':'My Groups', 'Mis grupos':'My Groups',
    'Biblioteca del Programa':'Program Library',
    'Cronograma Inglés Conversacional':'Conversational English Schedule',
    'Comunicados':'Announcements', 'Mis pendientes':'My To-Dos',
    'Docente':'Teacher', 'Estudiante':'Student',
    'Administración':'Administration', 'Sin sesión':'Not signed in',
    'Bloqueado':'Locked', 'Se desbloquea al activar matrícula':'Unlocks after enrollment',
    'Pronto':'Soon', 'Piloto':'Pilot', 'Nuevo':'New', 'Gratis':'Free',
    'Asistencia':'Attendance', 'Presente':'Present', 'Ausente':'Absent',
    'Curso':'Course', 'Cronograma':'Schedule', 'Materiales':'Materials',
    'Próximas y activas':'Upcoming & Active',
    'Resultados':'Results', 'Notas y retroalimentación':'Grades & Feedback',
    'Nivel':'Level', 'Grupo':'Group', 'Lección':'Lesson',
    'Básico I':'Basic I', 'Básico II':'Basic II',
    'Intermedio I':'Intermediate I', 'Intermedio II':'Intermediate II',
    'Mi cuenta':'My Account', 'Cerrar sesión':'Log out',
    'Mi Panel':'My Dashboard', 'Recursos adicionales':'Additional Resources',
    'Libros y Audios':'Books & Audio', 'Calendario académico':'Academic Calendar',
    'Planeamiento por lección':'Lesson Plan',
    'Información General del Programa':'Program Information'
  });
  function session() {
    try {
      const value = JSON.parse(root.sessionStorage.getItem('an_usuario') || 'null');
      return value && typeof value === 'object' ? value : null;
    } catch (_) { return null; }
  }
  function role() {
    const value = String(session()?.rol || '').toLowerCase();
    return value === 'student' || value === 'teacher' ? value : 'other';
  }
  function clearPreviousLoginChoice() {
    try {
      const stamp = root.sessionStorage.getItem('an_login_recent_at');
      if (stamp && stamp !== root.sessionStorage.getItem(STAMP)) {
        root.sessionStorage.removeItem(KEY);
        root.sessionStorage.setItem(STAMP, stamp);
      }
    } catch (_) {}
  }
  function getLang() {
    if (!preview || root.AN_I18N_FORCE_ES || role() === 'other') return 'es';
    clearPreviousLoginChoice();
    try { return root.sessionStorage.getItem(KEY) === 'es' ? 'es' : 'en'; }
    catch (_) { return 'en'; }
  }
  function t(value) {
    if (getLang() !== 'en' || typeof value !== 'string') return value;
    return Object.prototype.hasOwnProperty.call(DICTIONARY, value)
      ? DICTIONARY[value] : value;
  }
  function setLang(next) {
    if (!preview || (next !== 'en' && next !== 'es') || role() === 'other') return false;
    try { root.sessionStorage.setItem(KEY, next); } catch (_) { return false; }
    root.location.reload();
    return true;
  }
  function level(value) {
    const codes = { B1:'Basic I', B2:'Basic II', I1:'Intermediate I', I2:'Intermediate II' };
    return getLang() === 'en' ? (codes[String(value)] || t(value)) : value;
  }
  const api = Object.freeze({ preview, role, getLang, setLang, t, level });
  root.AN_I18N = api;
  root.document.documentElement.lang = getLang();
  if (getLang() === 'en') root.document.title = 'My Campus · Academia Norteamericana';
})(window);
