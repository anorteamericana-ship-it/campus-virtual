// F98.4-A_20260622_MENU_ESTUDIANTE_CONSOLIDADO
/* global React, useUsuario, useEstudiante, CronogramaGrupo, MaterialesView,
   NotasView, SolicitudesEstudianteView, InfoProgramaView, ContactoAdmin,
   EmptyState, ErrorState */

const STUDENT_TAB_STYLE_F984 = {
  display:'flex', gap:6, flexWrap:'wrap', padding:5, marginBottom:18,
  border:'1px solid var(--line)', borderRadius:14, background:'var(--surface)'
};

function StudentTabButtonF984({ active, children, onClick }) {
  return (
    <button type="button" className={`student-tab-button ${active ? 'btn btn-primary active' : 'btn btn-ghost'}`}
      onClick={onClick} aria-pressed={active}
      style={{ flex:'1 1 170px', justifyContent:'center', minHeight:40 }}>
      {children}
    </button>
  );
}

function StudentSectionHeaderF984({ kicker, title, sub }) {
  return (
    <div className="student-section-header" style={{ marginBottom:20 }}>
      {kicker ? <div className="student-section-kicker" style={{ fontSize:10.5, fontWeight:900, letterSpacing:'.15em', textTransform:'uppercase', color:'var(--an-granate)' }}>{kicker}</div> : null}
      <h1 className="student-section-title" style={{ fontFamily:'var(--f-serif)', fontSize:'clamp(30px,4vw,42px)', margin:'4px 0 5px', color:'var(--an-navy-ink)', fontWeight:500, letterSpacing:'-.03em' }}>{title}</h1>
      {sub && <p className="student-section-subtitle" style={{ margin:0, color:'var(--ink-3)', fontSize:13, lineHeight:1.55, maxWidth:760 }}>{sub}</p>}
    </div>
  );
}

function StudentComingSoonF984({ title, body, items = [] }) {
  return (
    <section className="card" style={{ padding:'22px 24px', border:'1px dashed var(--line-2)', background:'linear-gradient(135deg,#fff,var(--bg-deep))' }}>
      <div style={{ display:'inline-flex', padding:'4px 9px', borderRadius:999, background:'color-mix(in srgb,var(--an-gold) 15%,white)', color:'#7A4E00', fontSize:10, fontWeight:900, letterSpacing:'.12em', textTransform:'uppercase' }}>Próximamente</div>
      <h2 style={{ fontFamily:'var(--f-serif)', color:'var(--an-navy-ink)', margin:'10px 0 6px', fontSize:24 }}>{title}</h2>
      <p style={{ margin:'0 0 12px', color:'var(--ink-2)', fontSize:13, lineHeight:1.55 }}>{body}</p>
      {items.length > 0 && <ul style={{ margin:'0 0 0 18px', padding:0, color:'var(--ink-3)', fontSize:12.5, lineHeight:1.65 }}>
        {items.map(x => <li key={x}>{x}</li>)}
      </ul>}
    </section>
  );
}

function StudentCourseView({ initialTab='cronograma', onTabChange, onNavigate, initialLesson=null }) {
  const allowed = ['cronograma','materiales','tareas'];
  const normalized = allowed.includes(initialTab) ? initialTab : 'cronograma';
  const [tab, setTab] = React.useState(normalized);
  React.useEffect(() => setTab(normalized), [normalized]);
  const choose = (next) => { setTab(next); if (onTabChange) onTabChange(next); };

  return (
    <div className="student-page student-page-course" data-screen-label="Estudiante · Mi curso" style={{ padding:'28px 32px 60px', maxWidth:1280, margin:'0 auto' }}>
      <StudentSectionHeaderF984 title="Mi curso" />
      <div className="student-tabs" style={STUDENT_TAB_STYLE_F984} role="tablist" aria-label="Secciones de Mi curso">
        <StudentTabButtonF984 active={tab==='cronograma'} onClick={()=>choose('cronograma')}>Cronograma</StudentTabButtonF984>
        <StudentTabButtonF984 active={tab==='materiales'} onClick={()=>choose('materiales')}>Materiales</StudentTabButtonF984>
        <StudentTabButtonF984 active={tab==='tareas'} onClick={()=>choose('tareas')}>Tareas</StudentTabButtonF984>
      </div>
      <div role="tabpanel">
        {tab==='cronograma' && (typeof window.CronogramaGrupo === 'function'
          ? <window.CronogramaGrupo rol="student" onNavigate={onNavigate} />
          : <EmptyState icon="🗓️" title="Cronograma no disponible" subtitle="No fue posible cargar la pantalla de cronograma." />)}
        {tab==='materiales' && (typeof window.MaterialesView === 'function'
          ? <window.MaterialesView initialLesson={initialLesson} onNavigate={onNavigate} />
          : <EmptyState icon="📚" title="Materiales no disponibles" subtitle="No fue posible cargar la biblioteca del curso." />)}
        {tab==='tareas' && <StudentComingSoonF984
          title="Tareas · Próximamente"
          body="Este espacio queda reservado dentro de Mi curso. No se muestran tareas ficticias mientras no exista el flujo completo de publicación, entrega y revisión."
          items={['Grupo, nivel y lección vinculados','Fecha de publicación y fecha límite','Instrucciones y archivos adjuntos','Entrega del estudiante','Revisión docente y retroalimentación','Estados: pendiente, entregada, atrasada y revisada']}
        />}
      </div>
    </div>
  );
}

function StudentEvaluationsView({ initialTab='proximas', onTabChange, onNavigate, renderUpcoming }) {
  const allowed = ['proximas','resultados','reposiciones'];
  const normalized = allowed.includes(initialTab) ? initialTab : 'proximas';
  const [tab, setTab] = React.useState(normalized);
  React.useEffect(() => setTab(normalized), [normalized]);
  const choose = (next) => { setTab(next); if (onTabChange) onTabChange(next); };

  return (
    <div className="student-page student-page-evaluations" data-screen-label="Estudiante · Evaluaciones" style={{ padding:'28px 32px 60px', maxWidth:1280, margin:'0 auto' }}>
      <StudentSectionHeaderF984 title="Evaluaciones" />
      <div className="student-tabs" style={STUDENT_TAB_STYLE_F984} role="tablist" aria-label="Secciones de Evaluaciones">
        <StudentTabButtonF984 active={tab==='proximas'} onClick={()=>choose('proximas')}>Próximas y activas</StudentTabButtonF984>
        <StudentTabButtonF984 active={tab==='resultados'} onClick={()=>choose('resultados')}>Resultados</StudentTabButtonF984>
        <StudentTabButtonF984 active={tab==='reposiciones'} onClick={()=>choose('reposiciones')}>Reposiciones</StudentTabButtonF984>
      </div>
      <div role="tabpanel">
        {tab==='proximas' && (typeof renderUpcoming === 'function' ? renderUpcoming() : <EmptyState icon="📝" title="Exámenes no disponibles" subtitle="No fue posible cargar el panel de exámenes." />)}
        {tab==='resultados' && (typeof window.NotasView === 'function'
          ? <window.NotasView onNavigate={onNavigate} />
          : <EmptyState icon="📊" title="Resultados no disponibles" subtitle="No fue posible cargar Mis Notas." />)}
        {tab==='reposiciones' && (typeof window.SolicitudesEstudianteView === 'function'
          ? <window.SolicitudesEstudianteView onNavigate={onNavigate} embedded />
          : <EmptyState icon="🧾" title="Reposiciones no disponibles" subtitle="No fue posible cargar las solicitudes de reposición." />)}
      </div>
    </div>
  );
}

function StudentNoticesF984() {
  return <StudentComingSoonF984
    title="Avisos · Próximamente"
    body="Este módulo será un tablón institucional, no un chat redundante con WhatsApp. No se muestran comunicados ficticios."
    items={['Avisos académicos y cambios de horario','Exámenes y suspensiones','Material nuevo','Recordatorios administrativos','Comunicados institucionales','Confirmación de lectura']}
  />;
}

function StudentHelpContactsF984() {
  const usr = typeof useUsuario === 'function' ? useUsuario() : null;
  const codigo = usr?.codigo || '';
  const { data, loading, error, reload } = typeof useEstudiante === 'function'
    ? useEstudiante(codigo)
    : { data:null, loading:false, error:'No se pudo cargar la ficha.', reload:()=>{} };
  if (loading && !data) return <div className="card" style={{ padding:24 }}>Cargando contactos configurados…</div>;
  if (error && !data) return <ErrorState message={error} onRetry={reload} />;
  const est = data?.estudiante || {};
  const contactos = data?.contactos_campus || {};
  const cards = [
    ['Área académica','academico',contactos.contacto_academico || data?.contacto_academico],
    ['Administración','administracion',contactos.contacto_administracion || data?.contacto_administracion],
    ['Cobros','cobros',contactos.contacto_cobros || data?.contacto_cobros],
    ['Soporte técnico','soporte',contactos.contacto_soporte || data?.contacto_soporte],
  ].filter(([, , c]) => c && (c.whatsappUrl || c.telefono || c.numero || c.nombre));

  return (
    <div>
      {cards.length === 0 ? (
        <EmptyState icon="☎️" title="Contactos pendientes de configuración" subtitle="No hay contactos institucionales publicados para tu perfil. No se muestran teléfonos o correos inventados." />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))', gap:14 }}>
          {cards.map(([label,tipo]) => (
            <div key={tipo} className="card" style={{ padding:20 }}>
              <div style={{ fontSize:10, fontWeight:900, letterSpacing:'.13em', color:'var(--an-granate)', textTransform:'uppercase' }}>{label}</div>
              <div style={{ marginTop:10 }}>
                {typeof window.ContactoAdmin === 'function'
                  ? <window.ContactoAdmin est={est} usr={usr} tipo={tipo} label={`Contactar ${label.toLowerCase()}`} hideWhenPending />
                  : <span style={{ color:'var(--ink-3)', fontSize:12 }}>Contacto no disponible.</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="card" style={{ marginTop:16, padding:'16px 18px', fontSize:12.5, color:'var(--ink-2)', lineHeight:1.55 }}>
        Para reportar una falla del campus, enviá una captura e indicá tu nombre, código, grupo, pantalla y hora del error. No compartás contraseñas ni códigos de acceso a exámenes.
      </div>
    </div>
  );
}

async function _studentPrivateSignedPdfF984() {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  if (!token) return { ok:false, error:'sesion_requerida' };
  const url = window.APPS_SCRIPT_URL;
  if (!url) return { ok:false, error:'backend_no_configurado' };
  const res = await fetch(`${url}?fn=descargarMatriculaFirmadaPrivada`, {
    method:'POST',
    headers:{ 'Content-Type':'text/plain;charset=utf-8' },
    body:JSON.stringify({ fn:'descargarMatriculaFirmadaPrivada', token }),
  });
  const r = await res.json();
  if (!r?.ok) return r || { ok:false, error:'respuesta_vacia' };
  if (String(r.mime_type || '').toLowerCase() !== 'application/pdf') return { ok:false, error:'matricula_firmada_mime_invalido' };
  const base64 = String(r.data_base64 || '').replace(/\s+/g, '');
  if (!base64) return { ok:false, error:'matricula_firmada_sin_contenido' };
  let binary;
  try { binary = window.atob(base64); }
  catch (_) { return { ok:false, error:'matricula_firmada_base64_invalido' }; }
  const bytes = new Uint8Array(binary.length);
  for (let i=0; i<binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const expectedSize = Number(r.size_bytes || 0);
  if (!bytes.length || bytes.length > 9 * 1024 * 1024 || (expectedSize > 0 && expectedSize !== bytes.length)) return { ok:false, error:'matricula_firmada_incompleta_o_grande' };
  if (!(bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45)) return { ok:false, error:'contenido_pdf_firmado_invalido' };
  const expectedHash = String(r.sha256 || '').trim().toLowerCase();
  if (expectedHash && window.crypto?.subtle) {
    const digest = await window.crypto.subtle.digest('SHA-256', bytes);
    const digestHex = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (digestHex !== expectedHash) return { ok:false, error:'integridad_matricula_firmada_invalida' };
  }
  return { ok:true, nombre:String(r.nombre || 'matricula_firmada.pdf'), blob:new Blob([bytes], { type:'application/pdf' }) };
}

function StudentSignedEnrollmentPrivateF984() {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const abrir = async () => {
    if (busy) return;
    setBusy(true); setError('');
    const preview = window.open('', '_blank');
    if (preview) {
      try {
        preview.opener = null;
        preview.document.title = 'Verificando matrícula firmada…';
        preview.document.body.innerHTML = '<p style="font-family:system-ui;padding:24px">Verificando matrícula firmada…</p>';
      } catch (_) {}
    }
    try {
      const r = await _studentPrivateSignedPdfF984();
      if (!r?.ok || !r.blob) throw new Error(r?.mensaje || r?.error || 'No hay una matrícula firmada disponible todavía.');
      const objectUrl = URL.createObjectURL(r.blob);
      if (preview && !preview.closed) preview.location.replace(objectUrl);
      else {
        const a = document.createElement('a');
        a.href = objectUrl; a.download = r.nombre || 'matricula_firmada.pdf';
        document.body.appendChild(a); a.click(); a.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
    } catch (e) {
      try { if (preview && !preview.closed) preview.close(); } catch (_) {}
      setError(e?.message || 'No se pudo abrir la matrícula firmada.');
    } finally { setBusy(false); }
  };
  return (
    <section className="card" style={{ marginTop:16, padding:'18px 20px' }}>
      <div style={{ fontSize:10.5, fontWeight:900, letterSpacing:'.13em', textTransform:'uppercase', color:'var(--an-granate)' }}>Documento privado</div>
      <h2 style={{ fontFamily:'var(--f-serif)', color:'var(--an-navy-ink)', margin:'7px 0 6px', fontSize:22 }}>Matrícula firmada</h2>
      <p style={{ margin:'0 0 12px', color:'var(--ink-3)', fontSize:12.5, lineHeight:1.55 }}>Cuando Admisiones adjunte tu PDF firmado, podés abrir aquí la versión más reciente de tu propio expediente.</p>
      <button type="button" className="btn btn-primary" disabled={busy} onClick={abrir}>{busy ? 'Verificando…' : 'Abrir matrícula firmada'}</button>
      {error ? <div role="alert" style={{ marginTop:9, color:'var(--danger)', fontSize:12 }}>{error}</div> : null}
    </section>
  );
}

function StudentDocumentsHelpView({ initialTab='programa', onTabChange }) {
  const allowed = ['programa','avisos','ayuda'];
  const normalized = allowed.includes(initialTab) ? initialTab : 'programa';
  const [tab, setTab] = React.useState(normalized);
  React.useEffect(() => setTab(normalized), [normalized]);
  const choose = (next) => { setTab(next); if (onTabChange) onTabChange(next); };
  return (
    <div className="student-page student-page-documents" data-screen-label="Estudiante · Documentos y ayuda" style={{ padding:'28px 32px 60px', maxWidth:1280, margin:'0 auto' }}>
      <StudentSectionHeaderF984 kicker="Gestión" title="Documentos y ayuda" sub="Información institucional, avisos y contactos reales configurados para tu perfil." />
      <div className="student-tabs" style={STUDENT_TAB_STYLE_F984} role="tablist" aria-label="Secciones de Documentos y ayuda">
        <StudentTabButtonF984 active={tab==='programa'} onClick={()=>choose('programa')}>Programa y documentos</StudentTabButtonF984>
        <StudentTabButtonF984 active={tab==='avisos'} onClick={()=>choose('avisos')}>Avisos</StudentTabButtonF984>
        <StudentTabButtonF984 active={tab==='ayuda'} onClick={()=>choose('ayuda')}>Ayuda y contactos</StudentTabButtonF984>
      </div>
      <div role="tabpanel">
        {tab==='programa' && <>
          {typeof window.InfoProgramaView === 'function'
            ? <window.InfoProgramaView />
            : <EmptyState icon="📖" title="Documentos no disponibles" subtitle="No fue posible cargar la información del programa." />}
          <StudentSignedEnrollmentPrivateF984 />
        </>}
        {tab==='avisos' && <StudentNoticesF984 />}
        {tab==='ayuda' && <StudentHelpContactsF984 />}
      </div>
    </div>
  );
}

Object.assign(window, { StudentCourseView, StudentEvaluationsView, StudentDocumentsHelpView });
