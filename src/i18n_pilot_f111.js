/* F111 · i18n pilot: role-aware, opt-in, no DOM rewriting.
   Visible on every authenticated Campus screen; academic roles default EN at each login. ES remains selectable.
   No persistent data, no Apps Script changes, no translated identifiers. */
(function (root) {
  'use strict';
  const params = new URLSearchParams(root.location.search);
  const requestedPreview = params.get('i18n') === 'preview';
  const available = true; // A language selector is always visible after Campus login.
  const KEY = 'an_i18n_pilot_lang';
  const STAMP = 'an_i18n_pilot_login';
  const INTENT = 'an_i18n_pilot_intent';
  // Capture the request before any login guard removes the URL query.
  if (requestedPreview) {
    try { root.sessionStorage.setItem(INTENT, 'en'); } catch (_) {}
  }
  const DICTIONARY = Object.freeze({
    'Menú':'Menu', 'Gestión':'Management', 'Prematrícula':'Pre-enrollment',
    'Principal':'Home', 'Gestión Académica':'Academic Management',
    'Planificación Académica':'Academic Planning', 'Recursos Didácticos':'Learning Resources',
    'Evaluación y comunicación':'Assessments & Communication',
    'Resumen Académico':'Academic Summary', 'Plan de Estudio':'Study Plan',
    'Planeamiento didáctico':'Lesson Planning', 'Cronograma del módulo':'Module Schedule',
    'Cronograma general':'General Schedule', 'Biblioteca digital':'Digital Library',
    'Libros de texto':'Textbooks', 'Audios':'Audio',
    'Hola,':'Hello,', 'Accesos rápidos':'Quick Access', 'Entradas principales':'Main Shortcuts',
    'Mi Campus':'My Campus', 'Mi curso':'My Course',
    'Evaluaciones':'Assessments', 'Exámenes':'Exams',
    'Club I CAN':'Club I CAN', 'Pagos y estado de cuenta':'Payments & Account Statement',
    'Certificados':'Certificates', 'Documentos y ayuda':'Documents & Help',
    'Mi Perfil':'My Profile', 'Mi Perfil profesional':'My Professional Profile',
    'Mis Grupos':'My Groups', 'Mis grupos':'My Groups',
    'MI CUENTA':'MY ACCOUNT', 'Perfil docente':'Teacher Profile',
    'Tu identidad profesional dentro de Academia Norteamericana.':'Your professional identity at Academia Norteamericana.',
    'Docente activo':'Active Teacher', 'Docente inactivo':'Inactive Teacher',
    'Docente de Inglés Conversacional':'Conversational English Teacher',
    'Correo':'Email', 'Teléfono':'Phone', 'Cédula':'ID Number', 'Usuario':'Username',
    'Ocultar':'Hide', 'Mostrar':'Show', 'Cambiar foto':'Change photo', 'Subir foto':'Upload photo',
    'Subiendo…':'Uploading…', 'No registrado':'Not registered',
    'PERFIL PROFESIONAL':'PROFESSIONAL PROFILE', 'Presentación':'Introduction',
    'Editar':'Edit', 'Cancelar':'Cancel', 'Titular profesional':'Professional Title',
    'Especialidad':'Specialization', 'Experiencia':'Experience', 'Presentación breve':'Short Bio',
    'Guardar perfil':'Save Profile', 'Guardando…':'Saving…',
    'EXPEDIENTE PROFESIONAL':'PROFESSIONAL RECORD', 'Documentos':'Documents',
    'Guardado institucional':'Institutional Storage', 'Currículum':'Résumé',
    'Trayectoria y formación profesional':'Professional background and education',
    'Aval INA':'INA Endorsement', 'Respaldo documental del docente':'Teacher supporting documents',
    'Expediente institucional completo':'Complete Institutional Record',
    'Abrir carpeta de atestados':'Open Credentials Folder',
    'Antes de empezar tu programa':'Before You Begin Your Program',
    'MATERIAL OBLIGATORIO':'REQUIRED MATERIAL',
    'Reglamento estudiantil':'Student Regulations',
    'Reglamento de netiqueta':'Netiquette Guidelines',
    'Video de bienvenida al Programa':'Program Welcome Video',
    'Guía — Uso de Zoom y Google Meet':'Zoom and Google Meet Guide',
    'Guía — Contingencias técnicas':'Technical Contingencies Guide',
    'Datos personales':'Personal Information', 'Datos del programa':'Program Details',
    'ACTUALIZAR DATOS':'UPDATE INFORMATION', 'DATOS DEL PROGRAMA':'PROGRAM DETAILS',
    'Nombre completo':'Full Name', 'Correo electrónico actual':'Current Email',
    'Teléfono actual':'Current Phone', 'Editar contacto':'Edit Contact',
    'Guardar cambios':'Save Changes', 'Código':'Student Code', 'Programa':'Program',
    'Avance del nivel':'Level Progress', 'Pendiente':'Pending',
    'Estudiante':'Student', 'Estudiante activo':'Active Student',
    'Información del programa':'Program Information',
    'Disponible':'Available', 'Documento PDF':'PDF Document',
    'Todavía no hay un PDF cargado.':'No PDF has been uploaded yet.',
    'Abrir':'Open', 'Cargando…':'Loading…', 'Reemplazar PDF':'Replace PDF',
    'Cargar PDF':'Upload PDF', 'Reintentar':'Try Again',
    'Preparando tu perfil profesional…':'Preparing your professional profile…',
    'No pudimos cargar tu perfil.':'We could not load your profile.',
    'Mi':'My', 'Perfil':'Profile',
    'Perfil por completar':'Complete Your Profile',
    'Agregá una presentación breve para que tu perfil refleje tu experiencia y estilo profesional.':'Add a short bio that reflects your experience and professional approach.',
    'Ej. Inglés conversacional':'e.g. Conversational English',
    'Ej. 6 años de experiencia':'e.g. Six years of experience',
    'Una presentación profesional breve, clara y humana.':'A short, clear and personal professional bio.',
    'Título profesional, TOEIC, constancias de experiencia, colegiatura, certificados, declaraciones y autorización INA, según los documentos disponibles.':
      'Professional degree, TOEIC, experience records, professional membership, certificates, declarations and INA authorization, where available.',
    'Carpeta privada de la Academia. Para abrirla necesitás permiso de Google Drive; no se publica para estudiantes.':
      'Private Academy folder. Google Drive permission is required; this folder is not shared with students.',
    'Información General del Programa':'Program Information',
    'Seleccioná un recurso para verlo dentro del Campus y descargarlo desde esta misma pantalla.':
      'Select a resource to view it in Campus and download it from this page.',
    'Descargar':'Download',
    'Derechos, deberes y conducta académica.':'Rights, responsibilities and academic conduct.',
    'Normas de comportamiento en sesiones virtuales (Zoom).':'Conduct guidelines for virtual sessions (Zoom).',
    'Video institucional de bienvenida al programa.':'Institutional welcome video for the program.',
    'Herramienta principal y contingencia.':'Primary and backup meeting tools.',
    'Qué hacer ante fallas de audio, video, internet o plataforma.':'What to do when audio, video, internet or the platform fails.',
    'Reglamento de netiqueta':'Netiquette Guidelines',
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
    if (root.AN_I18N_FORCE_ES || role() === 'other') return 'es';
    clearPreviousLoginChoice();
    try {
      const choice = root.sessionStorage.getItem(KEY);
      if (choice === 'en' || choice === 'es') return choice;
      if (root.sessionStorage.getItem(INTENT) === 'en') {
        root.sessionStorage.removeItem(INTENT);
        root.sessionStorage.setItem(KEY, 'en');
        return 'en';
      }
    } catch (_) {}
    return 'en'; // Teacher/student always enter in English; a current-session ES choice remains available.
  }
  function t(value) {
    if (getLang() !== 'en' || typeof value !== 'string') return value;
    return Object.prototype.hasOwnProperty.call(DICTIONARY, value)
      ? DICTIONARY[value] : value;
  }
  function setLang(next) {
    if ((next !== 'en' && next !== 'es') || role() === 'other') return false;
    try { root.sessionStorage.setItem(KEY, next); root.sessionStorage.removeItem(INTENT); }
    catch (_) { return false; }
    root.location.reload();
    return true;
  }
  function level(value) {
    const codes = { B1:'Basic I', B2:'Basic II', I1:'Intermediate I', I2:'Intermediate II' };
    return getLang() === 'en' ? (codes[String(value)] || t(value)) : value;
  }
  const api = Object.freeze({ available, requestedPreview, role, getLang, setLang, t, level });
  root.AN_I18N = api;
  root.document.documentElement.lang = getLang();
  if (getLang() === 'en') root.document.title = 'My Campus · Academia Norteamericana';
})(window);
