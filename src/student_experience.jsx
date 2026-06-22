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
    <button type="button" className={active ? 'btn btn-primary' : 'btn btn-ghost'}
      onClick={onClick} aria-pressed={active}
      style={{ flex:'1 1 170px', justifyContent:'center', minHeight:40 }}>
      {children}
    </button>
  );
}

function StudentSectionHeaderF984({ kicker, title, sub }) {
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:10.5, fontWeight:900, letterSpacing:'.15em', textTransform:'uppercase', color:'var(--an-granate)' }}>{kicker}</div>
      <h1 style={{ fontFamily:'var(--f-serif)', fontSize:'clamp(30px,4vw,42px)', margin:'4px 0 5px', color:'var(--an-navy-ink)', fontWeight:500, letterSpacing:'-.03em' }}>{title}</h1>
      {sub && <p style={{ margin:0, color:'var(--ink-3)', fontSize:13, lineHeight:1.55, maxWidth:760 }}>{sub}</p>}
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
    <div data-screen-label="Estudiante · Mi curso" style={{ padding:'28px 32px 60px', maxWidth:1280, margin:'0 auto' }}>
      <StudentSectionHeaderF984 kicker="Aprendizaje" title="Mi curso" sub="Cronograma, materiales y tareas reunidos en un solo lugar, sin perder las funciones existentes." />
      <div style={STUDENT_TAB_STYLE_F984} role="tablist" aria-label="Secciones de Mi curso">
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
    <div data-screen-label="Estudiante · Evaluaciones" style={{ padding:'28px 32px 60px', maxWidth:1280, margin:'0 auto' }}>
      <StudentSectionHeaderF984 kicker="Aprendizaje" title="Evaluaciones" sub="Exámenes, resultados y reposiciones en un flujo único. Las reposiciones no se mezclan con matrícula ni cuotas." />
      <div style={STUDENT_TAB_STYLE_F984} role="tablist" aria-label="Secciones de Evaluaciones">
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

function StudentDocumentsHelpView({ initialTab='programa', onTabChange }) {
  const allowed = ['programa','avisos','ayuda'];
  const normalized = allowed.includes(initialTab) ? initialTab : 'programa';
  const [tab, setTab] = React.useState(normalized);
  React.useEffect(() => setTab(normalized), [normalized]);
  const choose = (next) => { setTab(next); if (onTabChange) onTabChange(next); };
  return (
    <div data-screen-label="Estudiante · Documentos y ayuda" style={{ padding:'28px 32px 60px', maxWidth:1280, margin:'0 auto' }}>
      <StudentSectionHeaderF984 kicker="Gestión" title="Documentos y ayuda" sub="Información institucional, avisos y contactos reales configurados para tu perfil." />
      <div style={STUDENT_TAB_STYLE_F984} role="tablist" aria-label="Secciones de Documentos y ayuda">
        <StudentTabButtonF984 active={tab==='programa'} onClick={()=>choose('programa')}>Programa y documentos</StudentTabButtonF984>
        <StudentTabButtonF984 active={tab==='avisos'} onClick={()=>choose('avisos')}>Avisos</StudentTabButtonF984>
        <StudentTabButtonF984 active={tab==='ayuda'} onClick={()=>choose('ayuda')}>Ayuda y contactos</StudentTabButtonF984>
      </div>
      <div role="tabpanel">
        {tab==='programa' && (typeof window.InfoProgramaView === 'function'
          ? <window.InfoProgramaView />
          : <EmptyState icon="📖" title="Documentos no disponibles" subtitle="No fue posible cargar la información del programa." />)}
        {tab==='avisos' && <StudentNoticesF984 />}
        {tab==='ayuda' && <StudentHelpContactsF984 />}
      </div>
    </div>
  );
}

Object.assign(window, { StudentCourseView, StudentEvaluationsView, StudentDocumentsHelpView });
