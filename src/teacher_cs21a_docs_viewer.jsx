// F98.4-Z6-CS21A6 · Visor interno y descarga de documentos docentes
// Frontend-only: Planeamiento didáctico ahora muestra 32 PDFs por nivel.
/* global React, getSesion, MaterialesView */
(function(){
  const VERSION = 'F98.4-Z6-CS21A6';
  const BLUE = 'var(--an-navy-ink,#001E47)';

  function session(){ try { return (typeof getSesion === 'function' ? getSesion() : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')) || {}; } catch(_) { return {}; } }
  function filePreview(id){ return 'https://drive.google.com/file/d/' + id + '/preview'; }
  function fileDownload(id){ return 'https://drive.google.com/uc?export=download&id=' + id; }
  function fileUserDownload(id){ return 'https://drive.usercontent.google.com/download?id=' + id + '&authuser=0&acrobatPromotionSource=gdrive_chrome-list'; }
  function folderPreview(id){ return 'https://drive.google.com/embeddedfolderview?id=' + id + '#list'; }
  function folderOpen(id){ return 'https://drive.google.com/drive/folders/' + id; }
  function openDownload(doc){ window.open(doc.download || doc.url || doc.preview, '_blank', 'noopener,noreferrer'); }

  function fileDoc(code, title, desc, id){ return { code, title, desc, kind:'file', preview:filePreview(id), download:fileDownload(id), url:filePreview(id) }; }
  function pdfDoc(code, title, desc, id){ return { code, title, desc, kind:'file', preview:filePreview(id), download:fileUserDownload(id), url:filePreview(id) }; }
  function folderDoc(code, title, desc, id){ return { code, title, desc, kind:'folder', preview:folderPreview(id), download:folderOpen(id), url:folderOpen(id) }; }
  function lessonDocs(levelCode, levelName, ids){ return ids.map((id, idx) => { const n = idx + 1; const nn = String(n).padStart(2,'0'); return fileDoc(levelCode + '-L' + nn, levelName + ' · Lección ' + nn, 'Planeamiento didáctico oficial de ' + levelName + ', lección ' + nn + '.', id); }); }

  const INFO_DOCS = [
    fileDoc('1.1', 'Reglamento estudiantil', 'Derechos, deberes y conducta académica.', '1K_yZjUpiPF6MtXgapeFq7J314qqPQ-Ei'),
    fileDoc('1.2', 'Reglamento de netiqueta', 'Normas de comportamiento en sesiones virtuales (Zoom).', '1X4NP2QJ-xMGBxLukRo-nSuKXf9zCcBll'),
    folderDoc('1.3', 'Video de bienvenida al Programa', 'Video institucional de bienvenida al programa.', '1UdRasbHeqzos7dzt-5VxjIE-Z6gjsrp8'),
    fileDoc('1.4', 'Guía — Uso de Zoom y Google Meet', 'Herramienta principal y contingencia.', '1zMbXdVpyBhci3skWFUthwmOfjdrv8Fed'),
    folderDoc('1.5', 'Guía — Contingencias', 'Qué hacer ante fallas de audio, video, internet o plataforma.', '1QK3-mstC3ITvstKOCA1ccHzsR-CdKaZb'),
  ];

  const LESSON_IDS = {
    B1: ['1_kyZ6h-5DpcM3CQGrQQVnDXv0nQDdmMC','1m40kUH88fP7IKAQ3R8aEPeCLT5qQq5Nr','1OFyvU27EXXrw1VOWENzLV9kgVEgRKaNl','1Av6lJXKDD2L4W6AOnseUMHE8ERA6iEnh','1XREwXwMFDtECJMgrGyZphkkVBxonJx1m','1NPvgFNPnr5iFAbsqrtW5qS5aUXin447b','1jUJniwC_taz4GsWzXEmla2HL-aXOJchN','1mQPlJf8tcCRVdoOEPdX7bg7l3VV54nF_','194St9CmIBLDbsTex39MnuGjOhe74MJWE','1uT28-3FRM65UXzMma7hxjMhqxEK057QW','13KF1skVcPupgflRmO5hV5r44tPkNYHjD','1OGIs2Aj11JLjD2WOAVmrJAwuChMCvc_p','1bgdTnSnfJcqrLB_eC2qNMnwnONsxBM2Z','1qILHXWvR_MM_6OtI8ILUkwC2LY-UdHGu','16PnqD7gq7gMTORoNnzWRXS9Z04XLZf2H','1n0atq2GkC_si3VxOpvIcLmIULfK-aAcQ','1aijyiG9S2lJcse8HkbJ0_mutd1NROYBE','1-SN2Zfb2EswL5j7M6Jj_o3dK-UZIvGN4','1F4yROiPIf2cN65XDVZ9qSmuD4W2JudZ4','1QvNhBQCrTkeR9xS_2qQjxUN9-so_dFnh','15PJ-7cZ_MdPJIWYfdTnzS08kD_fjuylD','1Zl_zPQulhEo_5UH8DxuNZ45KPeJALt9s','1PYTdw43_E9P8rB8KstxT4-7ncZZj4_TO','14JGYmFhBUXFuraeBRDWm89P-475GBvjz','18XBEKGcMfQse8NkH9syHwsTBONnqCrZp','1KsKkNYWC0cx5lGbAH5eiDwQPSqOsd5rs','1u071-mS7eKl9iPcIIPYoDHSfeQzU_RUA','1ykJ0Q1iQiSFtAnFadxA5UB7S8tH6r6l0','1x6fzjJKlnfcR5qPqcQIFlw764ceMv7A0','195ztGboN7NmA_g2Om7qx1mza0xJ_j21N','1wRml_9VNTcxT4yl6bpebvQ39VFyVA_8D','1bZnatGEQtHuqJ5KxnnMcjq19Pa2lweze'],
    B2: ['1sGW8AV6vR5PV7bQMrt6R0Hx7S8tltqKe','116Bdk1F-iGnRY59PWcxWVb2ERuUUBEZm','1YXGf7KCzITWY9AnnBs5BuXi1c1hSS_me','17UXy_95jYhD8Ay4MNo3x-AoMN4pvpiji','1-U3myP9gNtcwTufKZMatDrAfvS5Obz_h','12q_WcQYT6YLnj7VTgSgZXdxb8dUBSo9N','1H8NE250y1rkuxp83zvp7ZufaJuDl2d69','1wzjReF8OdZ0EVJAyjgAEtWA1XPX-zr14','1gpTjVIRImolOFF53ROwTk4rGAMQeNfg5','1R5UgFisBmCpXZpvLBvA7bIgMhVpMmiwk','1SKNtrmYlj4o_0QFhzE-3HqdrmPmy6KfT','1F3jamCJ79lLYu5f81KzLVVvlsasZloMA','1Krk6X-soi2t4c2IXhfkEXPnC6jgUxys4','19FVIDHT71WVzRPeZqOorT_09khP9fWC7','1j2unZsPyHjtqSbOVAzpe7DJvCTFnAD1b','1NXLrLZAr-57LJdUFRjItsNSVAz6YUWHu','1nGgWOr_Yij-E69JfVCtDwzXeT1864Tvr','1d0vt1PCEku_2k6tvoYdEwgV5pzcE-PNa','1GC9EHYs3aSlAB657bfg36DJA0wldcTLV','1Tq4zTyrzAaOdAsY7iNNnxWP5VIzjDCbJ','1XrkQeSUIMo4f_luiWVvQDtPccYIi4FMG','1-9pVBh2KANdtdglON1tfXamWxsJ0ALfA','1u4SDMHWjfyAKldE3yDvdkEsOPUG8KMkR','1KlaqeqOhsHnxcr9RGiZMAVwGxN88btL4','1oFNkSeYOqtQHt4T9GpmL95kSdSvnQusW','19T7QYGaC97h1xnSfm9kCWeFKYq12XhX3','1ac7ziXfpEkszoJtSwA2FH_0BagR7F4wn','1QIBqG-1fzUgmlQNGm58vwCD6Xl-04BQn','1UuCJZ1Zvdf2V0688NSjA3INYRsyF9pWP','16JF_Jj3VHu7uF36Kw5Fja1RDiH0rN_PO','1ayAWfqfncSUSX3SWqlIMkUR4jUr4IK2b','1tMmWalXqWCKZsQeodsRNjtX9lCbB7ROg'],
    I1: ['1OagVLcR4lqnJ467hCvsQGeqHvuQ8lY3b','1AnPVz-CcjIz35ntOt0mbGbGDnLhdxzwN','1wGU0WyFoLJDXLWmj1aXJ-Dw--nXnaZDB','15YP-kJdPs2mzUAcH6jt7pPdzqwTFAHZm','153FTSyyp-5PutdfUI6l0gXcb27kcx6_7','19KgU92VIM86AyJ5eyyn4Q0PGk3j2ZFqE','1vS9F7VrUTzGnMZqaDqQKnHTRkZFpee-l','12FaLu3IlxMsCCNeSg-9P1_9EwaA3fDuT','1SgJHcCvhIoiei8aC5FO89nh7_AXDH-Hm','1xioRMGnNB6p8fH0uYDyQQPpwgE5Vc9A5','1Fi4Ws2xdXpeum4xcRBrMBB-LpAwnbdR-','1eArSeupgzI4AopXZtnm4sJUTRrdUZz1L','1k7BeW6rbbhc9T-krhbQVQxKfQyvmQf5Y','1XQrdzQ1lLL9vk9muXrH7M92dPg9qdWAE','1n43BnIbd87FgQJutAuOkZ8uSvRP-XhiK','1i9Cb3pDY7-qOoHxScdqTnjfmbdarpi7s','1xTvQ8fFX4eAvkMpIIVmZcRce3ZBzzUcL','162fv3vv4oekBQwyxppB27GTF5sYZmnMU','1Jd1zJpNUkPeupxMao4dFT9t040EFnO10','15gOrHzaRGi1gljR9X5Quggy6e202eSmg','1kFGteTbTZUBq1ppiXUGuOQk1WeN6rbPk','17HvXEldonGA_VxbRkSCAbVId76JSJsKX','1_adwaKntTcYujNS6Bvcd2ksygQvmkWat','1uo6SRRFURvXGUVVVpwn1M1xdAH1sK1-L','1nAWWuV-bK7ufRZxdJoedg65QFYanIh51','1BQU6Dj3KlDuaCZHDX8--uT1G4LiDeBcK','1i6OBnXQXDwDMKZZzxeNLVyhqeZUZkXKS','1fgr6JWRGUWXUwmw-mgy7AZ6hS1jyFWiI','1-3UJmMpQBsi_iejUjPyXS0M5UiveDGiZ','1vDkiiPKUbha0eTCHxM_6NePwUJ6N-2No','1dWmY5gwZZxqHPw3-KhhmgkZKIVyiA9GU','1ZQeRcy3oX1rgriHFhmdVPQn7sFwzTXYJ'],
    I2: ['1nHeQkSO2qH82BlvRPR7XTJ2Du44IEoJV','1JhueKQ6AMSrhN0QsXjayrHAkkU8vvf8G','1xJr4NjxIJcgBAzdJenQpqi8v6mKt7BFM','1unk3XNzc-VgHvuXpcpTpFpNRPMpLrC7q','17hte0riuf2CwlC7agHzY2irpsot-w6P0','1vDcQfzJfPPINDgdi5dfasKFqSVv_3Z-9','1eC_cfRCl3yVAT-DHRCUs_tZUYFZypxQw','1fqJWwseAyhbs3ORw3KuImXebMMltpnFk','1iBegwOD3Wnuw7rvzcAM5ArfAkHAcOMFN','1pp6-LaMAEOjCa0O5s0_c1-agh8O4LqBi','19ZN49zVh1qdIfhnimNxEMTAI3FiJRtix','1Xa9YtX_BN8YIOqfc9aEeZpMEi_8ZQ0wg','1-pLwfAAJUJLzyWtgBok973IlyhcLtS5j','19o2Z-76IN2IxZ7Tjjy0BLZeoez3Qdkbb','1lxlL4Wif9ReaoNNWDeWbqq4mkhJO8stH','1ILGxmINzbWKPklOa1ORlx-VM7U3JNp6W','1TH0x3K0QiOD6m7hTTwwW95sWLN3Bn0Ku','1k3Avjd28avdiMqbypx_zVZM6pFBKw321','1A-ksTcLUw-8le2I7XofTOVzNVqgtyhvU','145DgZSfY9cypO0AC4cvTN1tFr4CK25Kx','1wTFUoZTk__b96dWu1ITtX7X5jKF9HjBV','1bE6Bi01FgVgVQQhxOskIjaX3rFcI7ZKB','1va6ul2hVv2Hdo5-nlUKbTo-J_CTpk9yV','1QLfwmYKVfqzbUu6p8xKwO0A8D_SWAz-N','1AvY5o5g8pZWOIgb-BbozldlNwg_odd3N','1KU9FsJXsMvwx6obfXWNwE6MsuoZmgG6f','16P1DrQqzGNdVWcyPGT3UDMDOMWSCgzuR','1gwyfkhAikYlRGAFeFRRR01wS2rM5oEX-','1deyPnfaAU-kPN1g2bmAJBDBXreFD1EBK','1yhH9sq3bKF0P0H-DcuF3SI_P0pN1MyLP','17buFHbaeRLKDl_VnqY7JTj8wnnyXIGjH','1pGBeJHTtCDOOIcFBWKq22RAey4Bbd7j4']
  };

  const PLAN_DOCS = {
    syllabus: [fileDoc('SYL', 'Syllabus · Programa Inglés Conversacional', 'Plan de estudio oficial del programa.', '1E_44EdPQOEL-DQpvzr59HLs1c8o4WR5F')],
    planeamiento: [
      ...lessonDocs('B1', 'Básico I', LESSON_IDS.B1),
      ...lessonDocs('B2', 'Básico II', LESSON_IDS.B2),
      ...lessonDocs('I1', 'Intermedio I', LESSON_IDS.I1),
      ...lessonDocs('I2', 'Intermedio II', LESSON_IDS.I2),
    ],
    cronograma_modulo: [
      fileDoc('B1', 'Cronograma del módulo · Básico I', 'Datos y cronograma institucional del módulo Básico I.', '1yTq26DzSwAwajHqH_I8RfN2Z-DHoM_Jl'),
      fileDoc('B2', 'Cronograma del módulo · Básico II', 'Datos y cronograma institucional del módulo Básico II.', '1DbJ2-1SGEjxCMccQA2l8YuANehWm8qC9'),
      fileDoc('I1', 'Cronograma del módulo · Intermedio I', 'Datos y cronograma institucional del módulo Intermedio I.', '1110cof4beNl_ME7HMOgDmHCx0N_Ux-kc'),
      fileDoc('I2', 'Cronograma del módulo · Intermedio II', 'Datos y cronograma institucional del módulo Intermedio II.', '1CajioftRWZyrDXX5XmKOswIIYNB_A7ln'),
    ],
    cronograma_general: [pdfDoc('GEN', 'Cronograma general del programa', 'Cronograma general descargable del programa.', '1cIx_oJCUN1uNE1xHij3dsm_1H49nMXZ9')],
    biblioteca: [folderDoc('TB', 'Biblioteca digital', 'Teacher Book del nivel correspondiente.', '1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH')],
    libros: [folderDoc('SB/WB', 'Libros de texto', 'Student Book y Workbook.', '1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH')],
    audios: [folderDoc('AUD', 'Audios', 'Audios por unidad.', '1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH')],
  };

  const TITLES = {
    info: ['Principal', 'Información General del Programa', 'Seleccioná un recurso para verlo dentro del Campus y descargarlo desde esta misma pantalla.'],
    syllabus: ['Planificación Académica', 'Syllabus', 'Syllabus oficial del programa con visor interno y descarga.'],
    planeamiento: ['Planificación Académica', 'Planeamiento didáctico', '128 planeamientos oficiales: 32 PDFs por nivel, separados del Cronograma del módulo.'],
    cronograma_modulo: ['Planificación Académica', 'Cronograma del módulo', 'Cronogramas institucionales por módulo con visor interno y descarga.'],
    cronograma_general: ['Planificación Académica', 'Cronograma general', 'Cronograma general del programa con botón de descarga.'],
    biblioteca: ['Recursos Didácticos', 'Biblioteca digital', 'Recursos del nivel correspondiente.'],
    libros: ['Recursos Didácticos', 'Libros de texto', 'Student Book y Workbook.'],
    audios: ['Recursos Didácticos', 'Audios', 'Audios por unidad.'],
  };

  function Header({ data }){
    return <div style={{ background:'linear-gradient(135deg,#fff 0%,#F8F4EE 100%)', border:'1px solid var(--line,#e5e0d8)', borderRadius:18, padding:'18px 20px', boxShadow:'var(--sh-1,0 6px 22px rgba(0,0,0,.06))', marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:950, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--an-granate,#7A1E2C)' }}>{data[0]}</div>
      <div style={{ fontSize:31, fontWeight:950, lineHeight:1.08, color:BLUE, marginTop:4 }}>{data[1]}</div>
      <div style={{ fontSize:13, color:'var(--ink-3,#6f6a63)', marginTop:7, maxWidth:860, lineHeight:1.5 }}>{data[2]}</div>
    </div>;
  }

  function DocButton({ doc, selected, onClick }){
    return <button type="button" onClick={onClick} className={selected ? 'btn btn-primary' : 'btn'} style={{ textAlign:'left', justifyContent:'flex-start', padding:'10px 11px', height:'auto', whiteSpace:'normal' }}>
      <span style={{ fontFamily:'var(--f-mono,monospace)', fontSize:10, fontWeight:950, marginRight:8 }}>{doc.code}</span>
      <span style={{ fontWeight:900 }}>{doc.title}</span>
    </button>;
  }

  function DocumentViewer({ docs }){
    const [selected, setSelected] = React.useState(0);
    React.useEffect(()=>setSelected(0), [JSON.stringify((docs||[]).map(d=>d.title))]);
    const list = docs || [];
    const doc = list[selected] || list[0];
    if (!doc) return <div style={{ padding:18, background:'#fff', border:'1px solid var(--line)', borderRadius:16 }}>No hay documento configurado para esta sección.</div>;
    return <div style={{ display:'grid', gridTemplateColumns:'minmax(250px,340px) 1fr', gap:14, alignItems:'start' }}>
      <div style={{ background:'#fff', border:'1px solid var(--line,#e5e0d8)', borderRadius:16, padding:12, display:'grid', gap:8, maxHeight:'78vh', overflowY:'auto' }}>
        {list.map((d,i)=><DocButton key={d.code + d.title} doc={d} selected={i===selected} onClick={()=>setSelected(i)} />)}
      </div>
      <div style={{ background:'#fff', border:'1px solid var(--line,#e5e0d8)', borderRadius:16, overflow:'hidden', minHeight:590 }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--line,#e5e0d8)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:22, fontWeight:950, color:BLUE, lineHeight:1.15 }}>{doc.title}</div>
            <div style={{ fontSize:12, color:'var(--ink-3,#6f6a63)', marginTop:4 }}>{doc.desc}</div>
          </div>
          <button type="button" className="btn btn-primary" onClick={()=>openDownload(doc)} style={{ fontWeight:900 }}>Descargar</button>
        </div>
        <iframe title={doc.title} src={doc.preview} style={{ width:'100%', height:'72vh', minHeight:520, border:0, display:'block', background:'#f7f4ef' }} allow="autoplay"></iframe>
      </div>
    </div>;
  }

  function AsistenciaPassthrough({ props }){
    return <div style={{ padding:18, background:'#fff', border:'1px solid var(--line)', borderRadius:16 }}>
      <div style={{ fontSize:22, fontWeight:950, color:BLUE }}>Asistencia</div>
      <div style={{ fontSize:13, color:'var(--ink-3)', marginTop:6 }}>Esta sección se mantiene desde Gestión Académica. La edición sigue en Mis grupos.</div>
      <div style={{ marginTop:12, display:'flex', gap:8, flexWrap:'wrap' }}>
        <button className="btn btn-primary" onClick={()=>props?.onNavigate && props.onNavigate('grupos')}>Ir a Mis grupos</button>
        <button className="btn" onClick={()=>props?.onNavigate && props.onNavigate('cronograma_grupo')}>Ver calendario académico</button>
      </div>
    </div>;
  }

  function TeacherDocsHubCS21A6(props){
    const [screen,setScreen] = React.useState(()=>sessionStorage.getItem('an_teacher_materiales_tab') || 'info');
    React.useEffect(()=>{ const h=e=>{ if(e?.detail?.tab) setScreen(e.detail.tab); }; window.addEventListener('an:teacher-material-tab', h); return()=>window.removeEventListener('an:teacher-material-tab', h); }, []);
    if (screen === 'asistencia') return <section style={{ padding:18 }}><Header data={['Gestión Académica','Asistencia','Resumen y accesos de asistencia.']} /><AsistenciaPassthrough props={props}/></section>;
    const title = TITLES[screen] || TITLES.info;
    const docs = screen === 'info' ? INFO_DOCS : (PLAN_DOCS[screen] || []);
    return <section data-screen-label={'Docente · CS21A6 · ' + screen} style={{ padding:18 }}>
      <Header data={title}/>
      <DocumentViewer docs={docs}/>
    </section>;
  }

  function install(){
    if (!window.MaterialesView || window.MaterialesView.__cs21a6) return;
    const Base = window.MaterialesView;
    const Wrapped = function MaterialesViewCS21A6(props){
      const u = session();
      if (!u || u.rol !== 'teacher') return <Base {...props}/>;
      return <TeacherDocsHubCS21A6 {...props}/>;
    };
    Wrapped.__cs21a6 = true;
    Wrapped.__base = Base;
    window.MaterialesView = Wrapped;
    try { MaterialesView = Wrapped; } catch(_) {}
  }

  window.addEventListener('an:lazy-module-loaded', install);
  setTimeout(install, 0);
})();