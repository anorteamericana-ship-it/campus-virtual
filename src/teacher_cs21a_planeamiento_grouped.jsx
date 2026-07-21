// F98.4-Z6-CS21A140 · Planeamiento por lección con navegación 2 x 16
// Frontend-only: mantiene los PDFs vigentes y ordena niveles, lecciones y visor en una sola columna.
/* global React, getSesion, MaterialesView */
(function(){
  const VERSION = 'F98.4-Z6-CS21A140';
  const BLUE = 'var(--an-navy-ink,#001E47)';

  function session(){ try { return (typeof getSesion === 'function' ? getSesion() : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')) || {}; } catch(_) { return {}; } }
  function filePreview(id){ return 'https://drive.google.com/file/d/' + id + '/preview'; }
  function fileDownload(id){ return 'https://drive.google.com/uc?export=download&id=' + id; }
  function openDownload(doc){ window.open(doc.download || doc.preview, '_blank', 'noopener,noreferrer'); }
  function pad(n){ return String(n).padStart(2,'0'); }

  const LESSON_IDS = {
    B1: ['1_kyZ6h-5DpcM3CQGrQQVnDXv0nQDdmMC','1m40kUH88fP7IKAQ3R8aEPeCLT5qQq5Nr','1OFyvU27EXXrw1VOWENzLV9kgVEgRKaNl','1Av6lJXKDD2L4W6AOnseUMHE8ERA6iEnh','1XREwXwMFDtECJMgrGyZphkkVBxonJx1m','1NPvgFNPnr5iFAbsqrtW5qS5aUXin447b','1jUJniwC_taz4GsWzXEmla2HL-aXOJchN','1mQPlJf8tcCRVdoOEPdX7bg7l3VV54nF_','194St9CmIBLDbsTex39MnuGjOhe74MJWE','1uT28-3FRM65UXzMma7hxjMhqxEK057QW','13KF1skVcPupgflRmO5hV5r44tPkNYHjD','1OGIs2Aj11JLjD2WOAVmrJAwuChMCvc_p','1bgdTnSnfJcqrLB_eC2qNMnwnONsxBM2Z','1qILHXWvR_MM_6OtI8ILUkwC2LY-UdHGu','16PnqD7gq7gMTORoNnzWRXS9Z04XLZf2H','1n0atq2GkC_si3VxOpvIcLmIULfK-aAcQ','1aijyiG9S2lJcse8HkbJ0_mutd1NROYBE','1-SN2Zfb2EswL5j7M6Jj_o3dK-UZIvGN4','1F4yROiPIf2cN65XDVZ9qSmuD4W2JudZ4','1QvNhBQCrTkeR9xS_2qQjxUN9-so_dFnh','15PJ-7cZ_MdPJIWYfdTnzS08kD_fjuylD','1Zl_zPQulhEo_5UH8DxuNZ45KPeJALt9s','1PYTdw43_E9P8rB8KstxT4-7ncZZj4_TO','14JGYmFhBUXFuraeBRDWm89P-475GBvjz','18XBEKGcMfQse8NkH9syHwsTBONnqCrZp','1KsKkNYWC0cx5lGbAH5eiDwQPSqOsd5rs','1u071-mS7eKl9iPcIIPYoDHSfeQzU_RUA','1ykJ0Q1iQiSFtAnFadxA5UB7S8tH6r6l0','1x6fzjJKlnfcR5qPqcQIFlw764ceMv7A0','195ztGboN7NmA_g2Om7qx1mza0xJ_j21N','1wRml_9VNTcxT4yl6bpebvQ39VFyVA_8D','1bZnatGEQtHuqJ5KxnnMcjq19Pa2lweze'],
    B2: ['1sGW8AV6vR5PV7bQMrt6R0Hx7S8tltqKe','116Bdk1F-iGnRY59PWcxWVb2ERuUUBEZm','1YXGf7KCzITWY9AnnBs5BuXi1c1hSS_me','17UXy_95jYhD8Ay4MNo3x-AoMN4pvpiji','1-U3myP9gNtcwTufKZMatDrAfvS5Obz_h','12q_WcQYT6YLnj7VTgSgZXdxb8dUBSo9N','1H8NE250y1rkuxp83zvp7ZufaJuDl2d69','1wzjReF8OdZ0EVJAyjgAEtWA1XPX-zr14','1gpTjVIRImolOFF53ROwTk4rGAMQeNfg5','1R5UgFisBmCpXZpvLBvA7bIgMhVpMmiwk','1SKNtrmYlj4o_0QFhzE-3HqdrmPmy6KfT','1F3jamCJ79lLYu5f81KzLVVvlsasZloMA','1Krk6X-soi2t4c2IXhfkEXPnC6jgUxys4','19FVIDHT71WVzRPeZqOorT_09khP9fWC7','1j2unZsPyHjtqSbOVAzpe7DJvCTFnAD1b','1NXLrLZAr-57LJdUFRjItsNSVAz6YUWHu','1nGgWOr_Yij-E69JfVCtDwzXeT1864Tvr','1d0vt1PCEku_2k6tvoYdEwgV5pzcE-PNa','1GC9EHYs3aSlAB657bfg36DJA0wldcTLV','1Tq4zTyrzAaOdAsY7iNNnxWP5VIzjDCbJ','1XrkQeSUIMo4f_luiWVvQDtPccYIi4FMG','1-9pVBh2KANdtdglON1tfXamWxsJ0ALfA','1u4SDMHWjfyAKldE3yDvdkEsOPUG8KMkR','1KlaqeqOhsHnxcr9RGiZMAVwGxN88btL4','1oFNkSeYOqtQHt4T9GpmL95kSdSvnQusW','19T7QYGaC97h1xnSfm9kCWeFKYq12XhX3','1ac7ziXfpEkszoJtSwA2FH_0BagR7F4wn','1QIBqG-1fzUgmlQNGm58vwCD6Xl-04BQn','1UuCJZ1Zvdf2V0688NSjA3INYRsyF9pWP','16JF_Jj3VHu7uF36Kw5Fja1RDiH0rN_PO','1ayAWfqfncSUSX3SWqlIMkUR4jUr4IK2b','1tMmWalXqWCKZsQeodsRNjtX9lCbB7ROg'],
    I1: ['1OagVLcR4lqnJ467hCvsQGeqHvuQ8lY3b','1AnPVz-CcjIz35ntOt0mbGbGDnLhdxzwN','1wGU0WyFoLJDXLWmj1aXJ-Dw--nXnaZDB','15YP-kJdPs2mzUAcH6jt7pPdzqwTFAHZm','153FTSyyp-5PutdfUI6l0gXcb27kcx6_7','19KgU92VIM86AyJ5eyyn4Q0PGk3j2ZFqE','1vS9F7VrUTzGnMZqaDqQKnHTRkZFpee-l','12FaLu3IlxMsCCNeSg-9P1_9EwaA3fDuT','1SgJHcCvhIoiei8aC5FO89nh7_AXDH-Hm','1xioRMGnNB6p8fH0uYDyQQPpwgE5Vc9A5','1Fi4Ws2xdXpeum4xcRBrMBB-LpAwnbdR-','1eArSeupgzI4AopXZtnm4sJUTRrdUZz1L','1k7BeW6rbbhc9T-krhbQVQxKfQyvmQf5Y','1XQrdzQ1lLL9vk9muXrH7M92dPg9qdWAE','1n43BnIbd87FgQJutAuOkZ8uSvRP-XhiK','1i9Cb3pDY7-qOoHxScdqTnjfmbdarpi7s','1xTvQ8fFX4eAvkMpIIVmZcRce3ZBzzUcL','162fv3vv4oekBQwyxppB27GTF5sYZmnMU','1Jd1zJpNUkPeupxMao4dFT9t040EFnO10','15gOrHzaRGi1gljR9X5Quggy6e202eSmg','1kFGteTbTZUBq1ppiXUGuOQk1WeN6rbPk','17HvXEldonGA_VxbRkSCAbVId76JSJsKX','1_adwaKntTcYujNS6Bvcd2ksygQvmkWat','1uo6SRRFURvXGUVVVpwn1M1xdAH1sK1-L','1nAWWuV-bK7ufRZxdJoedg65QFYanIh51','1BQU6Dj3KlDuaCZHDX8--uT1G4LiDeBcK','1i6OBnXQXDwDMKZZzxeNLVyhqeZUZkXKS','1fgr6JWRGUWXUwmw-mgy7AZ6hS1jyFWiI','1-3UJmMpQBsi_iejUjPyXS0M5UiveDGiZ','1vDkiiPKUbha0eTCHxM_6NePwUJ6N-2No','1dWmY5gwZZxqHPw3-KhhmgkZKIVyiA9GU','1ZQeRcy3oX1rgriHFhmdVPQn7sFwzTXYJ'],
    I2: ['1nHeQkSO2qH82BlvRPR7XTJ2Du44IEoJV','1JhueKQ6AMSrhN0QsXjayrHAkkU8vvf8G','1xJr4NjxIJcgBAzdJenQpqi8v6mKt7BFM','1unk3XNzc-VgHvuXpcpTpFpNRPMpLrC7q','17hte0riuf2CwlC7agHzY2irpsot-w6P0','1vDcQfzJfPPINDgdi5dfasKFqSVv_3Z-9','1eC_cfRCl3yVAT-DHRCUs_tZUYFZypxQw','1fqJWwseAyhbs3ORw3KuImXebMMltpnFk','1iBegwOD3Wnuw7rvzcAM5ArfAkHAcOMFN','1pp6-LaMAEOjCa0O5s0_c1-agh8O4LqBi','19ZN49zVh1qdIfhnimNxEMTAI3FiJRtix','1Xa9YtX_BN8YIOqfc9aEeZpMEi_8ZQ0wg','1-pLwfAAJUJLzyWtgBok973IlyhcLtS5j','19o2Z-76IN2IxZ7Tjjy0BLZeoez3Qdkbb','1lxlL4Wif9ReaoNNWDeWbqq4mkhJO8stH','1ILGxmINzbWKPklOa1ORlx-VM7U3JNp6W','1TH0x3K0QiOD6m7hTTwwW95sWLN3Bn0Ku','1k3Avjd28avdiMqbypx_zVZM6pFBKw321','1A-ksTcLUw-8le2I7XofTOVzNVqgtyhvU','145DgZSfY9cypO0AC4cvTN1tFr4CK25Kx','1wTFUoZTk__b96dWu1ITtX7X5jKF9HjBV','1bE6Bi01FgVgVQQhxOskIjaX3rFcI7ZKB','1va6ul2hVv2Hdo5-nlUKbTo-J_CTpk9yV','1QLfwmYKVfqzbUu6p8xKwO0A8D_SWAz-N','1AvY5o5g8pZWOIgb-BbozldlNwg_odd3N','1KU9FsJXsMvwx6obfXWNwE6MsuoZmgG6f','16P1DrQqzGNdVWcyPGT3UDMDOMWSCgzuR','1gwyfkhAikYlRGAFeFRRR01wS2rM5oEX-','1deyPnfaAU-kPN1g2bmAJBDBXreFD1EBK','1yhH9sq3bKF0P0H-DcuF3SI_P0pN1MyLP','17buFHbaeRLKDl_VnqY7JTj8wnnyXIGjH','1pGBeJHTtCDOOIcFBWKq22RAey4Bbd7j4']
  };

  const LEVELS = [
    { code:'B1', name:'Básico I', color:'#F2C94C' },
    { code:'B2', name:'Básico II', color:'#DA291C' },
    { code:'I1', name:'Intermedio I', color:'#2F6BE0' },
    { code:'I2', name:'Intermedio II', color:'#2E7D32' },
  ];

  function lessonDoc(level, idx, id){
    const n = idx + 1;
    return {
      code: level.code + '-L' + pad(n),
      title: 'Lección ' + pad(n) + ' · ' + level.name,
      desc: 'Planeamiento por lección del nivel ' + level.name + '.',
      preview: filePreview(id),
      download: fileDownload(id),
    };
  }

  function Header(){
    return <div style={{ background:'linear-gradient(135deg,#fff 0%,#F8F4EE 100%)', border:'1px solid var(--line,#e5e0d8)', borderRadius:18, padding:'18px 20px', boxShadow:'var(--sh-1,0 6px 22px rgba(0,0,0,.06))', marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:950, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--an-granate,#7A1E2C)' }}>Planificación Académica</div>
      <div style={{ fontSize:31, fontWeight:950, lineHeight:1.08, color:BLUE, marginTop:4 }}>Planeamiento por lección</div>
      <div style={{ fontSize:13, color:'var(--ink-3,#6f6a63)', marginTop:7, maxWidth:900, lineHeight:1.5 }}>Seleccioná un nivel y una lección. El PDF elegido se mostrará debajo de la botonera.</div>
    </div>;
  }

  function LevelButton({ level, active, onClick }){
    return <button type="button" onClick={onClick} aria-pressed={active} title={level.code + ' · ' + level.name} className={active ? 'btn btn-primary' : 'btn'} style={{ minHeight:42, padding:'0 12px', borderRadius:10, border:active ? '2px solid ' + level.color : '1px solid #CCD6E2', background:active ? BLUE : '#fff', color:active ? '#fff' : BLUE, fontWeight:950, whiteSpace:'nowrap' }}>
      <span style={{ display:'inline-block', width:10, height:10, borderRadius:99, background:level.color, marginRight:8, flex:'0 0 auto', boxShadow:active ? '0 0 0 2px rgba(255,255,255,.45)' : 'none' }}></span>
      <span>{level.code} · {level.name}</span>
    </button>;
  }

  function LessonButton({ doc, active, onClick }){
    const number = doc.code.slice(-2);
    return <button type="button" onClick={onClick} aria-label={'Lección ' + number} aria-pressed={active} title={'Lección ' + number} style={{ minWidth:52, height:38, padding:'4px 3px', border:active ? '2px solid #F2C94C' : '1px solid #D7B34A', borderRadius:8, background:active ? '#0B4A8B' : '#FFF7D6', color:active ? '#fff' : '#674D00', boxShadow:active ? '0 4px 10px rgba(11,74,139,.24)' : 'none', fontFamily:'var(--f-mono,monospace)', fontWeight:950, fontSize:10.5, cursor:'pointer' }}>
      <span>L{number}</span>
    </button>;
  }

  function PlaneamientoGroupedView(){
    const [levelCode, setLevelCode] = React.useState('B1');
    const [lessonIndex, setLessonIndex] = React.useState(0);
    const level = LEVELS.find(x=>x.code===levelCode) || LEVELS[0];
    const docs = (LESSON_IDS[level.code] || []).map((id,i)=>lessonDoc(level,i,id));
    const doc = docs[lessonIndex] || docs[0];
    function chooseLevel(code){ setLevelCode(code); setLessonIndex(0); }
    return <section data-screen-label="Docente · CS21A140 · planeamiento" style={{ padding:18 }}>
      <Header />
      <div style={{ background:'#fff', border:'1px solid var(--line,#e5e0d8)', borderRadius:16, overflow:'hidden' }}>
        <div data-planeamiento-levels="top" style={{ padding:'11px 14px', borderBottom:'1px solid var(--line,#e5e0d8)', background:'var(--surface-2,#FAF8F4)', display:'flex', gap:7, flexWrap:'wrap', alignItems:'center' }}>
          {LEVELS.map(l=><LevelButton key={l.code} level={l} active={l.code===level.code} onClick={()=>chooseLevel(l.code)} />)}
        </div>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--line,#e5e0d8)' }}>
          <div style={{ fontSize:22, fontWeight:950, color:BLUE, lineHeight:1.15 }}>Planeamiento por lección · {level.name}</div>
          <div style={{ fontSize:12, color:'var(--ink-3,#6f6a63)', marginTop:4 }}>{docs.length} PDFs disponibles para este nivel.</div>
          <div data-planeamiento-lessons="2x16" style={{ overflowX:'auto', marginTop:12, paddingBottom:2 }}>
            <div data-lesson-grid="2x16" style={{ display:'grid', gridTemplateColumns:'repeat(16,minmax(52px,1fr))', gap:5, minWidth:907 }}>
              {docs.map((d,i)=><LessonButton key={d.code} doc={d} active={i===lessonIndex} onClick={()=>setLessonIndex(i)} />)}
            </div>
          </div>
        </div>
        {doc && <div data-planeamiento-pdf="selected">
          <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--line,#e5e0d8)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:20, fontWeight:950, color:BLUE }}>{doc.title}</div>
              <div style={{ fontSize:12, color:'var(--ink-3,#6f6a63)', marginTop:4 }}>{doc.desc}</div>
            </div>
            <button type="button" className="btn btn-primary" onClick={()=>openDownload(doc)} style={{ fontWeight:900 }}>Descargar PDF</button>
          </div>
          <iframe title={doc.title} src={doc.preview} style={{ width:'100%', height:'72vh', minHeight:520, border:0, display:'block', background:'#f7f4ef' }} allow="autoplay"></iframe>
        </div>}
      </div>
    </section>;
  }

  function getScreen(){ return sessionStorage.getItem('an_teacher_materiales_tab') || 'info'; }

  function install(){
    if (!window.MaterialesView || window.MaterialesView.__cs21a9) return;
    const Base = window.MaterialesView;
    const Wrapped = function MaterialesViewCS21A9(props){
      const u = session();
      if (!u || u.rol !== 'teacher') return <Base {...props}/>;
      const [screen, setScreen] = React.useState(getScreen());
      React.useEffect(()=>{
        const h = e => { if(e?.detail?.tab) setScreen(e.detail.tab); else setScreen(getScreen()); };
        window.addEventListener('an:teacher-material-tab', h);
        window.addEventListener('storage', h);
        return ()=>{ window.removeEventListener('an:teacher-material-tab', h); window.removeEventListener('storage', h); };
      }, []);
      if (screen === 'planeamiento') return <PlaneamientoGroupedView />;
      return <Base {...props}/>;
    };
    Wrapped.__cs21a9 = true;
    Wrapped.__base = Base;
    window.MaterialesView = Wrapped;
    try { MaterialesView = Wrapped; } catch(_) {}
  }

  window.addEventListener('an:lazy-module-loaded', install);
  setTimeout(install, 0);
  window.__AN_TEACHER_PLANEAMIENTO_GROUPED_VERSION__ = VERSION;
})();
