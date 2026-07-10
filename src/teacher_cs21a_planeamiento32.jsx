// F98.4-Z6-CS21A6 · Planeamiento didáctico por 32 lecciones
// Frontend-only: reemplaza únicamente la vista Planeamiento didáctico con los 32 PDFs por nivel.
/* global React, getSesion, MaterialesView */
(function(){
  const VERSION = 'F98.4-Z6-CS21A6';
  const BLUE = 'var(--an-navy-ink,#001E47)';
  function session(){ try { return (typeof getSesion === 'function' ? getSesion() : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')) || {}; } catch(_) { return {}; } }
  function filePreview(id){ return 'https://drive.google.com/file/d/' + id + '/preview'; }
  function fileDownload(id){ return 'https://drive.google.com/uc?export=download&id=' + id; }
  function openDownload(doc){ window.open(fileDownload(doc.id), '_blank', 'noopener,noreferrer'); }
  function doc(n,id){ return { n, code:'L' + String(n).padStart(2,'0'), title:'Lección ' + String(n).padStart(2,'0'), desc:'Planeamiento didáctico de la lección ' + String(n).padStart(2,'0') + '.', id }; }

  const LEVELS = [
    { key:'b1', code:'B1', name:'Básico I', color:'#F2C94C', docs:[
      doc(1,'1_kyZ6h-5DpcM3CQGrQQVnDXv0nQDdmMC'),doc(2,'1m40kUH88fP7IKAQ3R8aEPeCLT5qQq5Nr'),doc(3,'1OFyvU27EXXrw1VOWENzLV9kgVEgRKaNl'),doc(4,'1Av6lJXKDD2L4W6AOnseUMHE8ERA6iEnh'),doc(5,'1XREwXwMFDtECJMgrGyZphkkVBxonJx1m'),doc(6,'1NPvgFNPnr5iFAbsqrtW5qS5aUXin447b'),doc(7,'1jUJniwC_taz4GsWzXEmla2HL-aXOJchN'),doc(8,'1mQPlJf8tcCRVdoOEPdX7bg7l3VV54nF_'),doc(9,'194St9CmIBLDbsTex39MnuGjOhe74MJWE'),doc(10,'1uT28-3FRM65UXzMma7hxjMhqxEK057QW'),doc(11,'13KF1skVcPupgflRmO5hV5r44tPkNYHjD'),doc(12,'1OGIs2Aj11JLjD2WOAVmrJAwuChMCvc_p'),doc(13,'1bgdTnSnfJcqrLB_eC2qNMnwnONsxBM2Z'),doc(14,'1qILHXWvR_MM_6OtI8ILUkwC2LY-UdHGu'),doc(15,'16PnqD7gq7gMTORoNnzWRXS9Z04XLZf2H'),doc(16,'1n0atq2GkC_si3VxOpvIcLmIULfK-aAcQ'),doc(17,'1aijyiG9S2lJcse8HkbJ0_mutd1NROYBE'),doc(18,'1-SN2Zfb2EswL5j7M6Jj_o3dK-UZIvGN4'),doc(19,'1F4yROiPIf2cN65XDVZ9qSmuD4W2JudZ4'),doc(20,'1QvNhBQCrTkeR9xS_2qQjxUN9-so_dFnh'),doc(21,'15PJ-7cZ_MdPJIWYfdTnzS08kD_fjuylD'),doc(22,'1Zl_zPQulhEo_5UH8DxuNZ45KPeJALt9s'),doc(23,'1PYTdw43_E9P8rB8KstxT4-7ncZZj4_TO'),doc(24,'14JGYmFhBUXFuraeBRDWm89P-475GBvjz'),doc(25,'18XBEKGcMfQse8NkH9syHwsTBONnqCrZp'),doc(26,'1KsKkNYWC0cx5lGbAH5eiDwQPSqOsd5rs'),doc(27,'1u071-mS7eKl9iPcIIPYoDHSfeQzU_RUA'),doc(28,'1ykJ0Q1iQiSFtAnFadxA5UB7S8tH6r6l0'),doc(29,'1x6fzjJKlnfcR5qPqcQIFlw764ceMv7A0'),doc(30,'195ztGboN7NmA_g2Om7qx1mza0xJ_j21N'),doc(31,'1wRml_9VNTcxT4yl6bpebvQ39VFyVA_8D'),doc(32,'1bZnatGEQtHuqJ5KxnnMcjq19Pa2lweze')
    ]},
    { key:'b2', code:'B2', name:'Básico II', color:'#DA291C', docs:[
      doc(1,'1sGW8AV6vR5PV7bQMrt6R0Hx7S8tltqKe'),doc(2,'116Bdk1F-iGnRY59PWcxWVb2ERuUUBEZm'),doc(3,'1YXGf7KCzITWY9AnnBs5BuXi1c1hSS_me'),doc(4,'17UXy_95jYhD8Ay4MNo3x-AoMN4pvpiji'),doc(5,'1-U3myP9gNtcwTufKZMatDrAfvS5Obz_h'),doc(6,'12q_WcQYT6YLnj7VTgSgZXdxb8dUBSo9N'),doc(7,'1H8NE250y1rkuxp83zvp7ZufaJuDl2d69'),doc(8,'1wzjReF8OdZ0EVJAyjgAEtWA1XPX-zr14'),doc(9,'1gpTjVIRImolOFF53ROwTk4rGAMQeNfg5'),doc(10,'1R5UgFisBmCpXZpvLBvA7bIgMhVpMmiwk'),doc(11,'1SKNtrmYlj4o_0QFhzE-3HqdrmPmy6KfT'),doc(12,'1F3jamCJ79lLYu5f81KzLVVvlsasZloMA'),doc(13,'1Krk6X-soi2t4c2IXhfkEXPnC6jgUxys4'),doc(14,'19FVIDHT71WVzRPeZqOorT_09khP9fWC7'),doc(15,'1j2unZsPyHjtqSbOVAzpe7DJvCTFnAD1b'),doc(16,'1NXLrLZAr-57LJdUFRjItsNSVAz6YUWHu'),doc(17,'1nGgWOr_Yij-E69JfVCtDwzXeT1864Tvr'),doc(18,'1d0vt1PCEku_2k6tvoYdEwgV5pzcE-PNa'),doc(19,'1GC9EHYs3aSlAB657bfg36DJA0wldcTLV'),doc(20,'1Tq4zTyrzAaOdAsY7iNNnxWP5VIzjDCbJ'),doc(21,'1XrkQeSUIMo4f_luiWVvQDtPccYIi4FMG'),doc(22,'1-9pVBh2KANdtdglON1tfXamWxsJ0ALfA'),doc(23,'1u4SDMHWjfyAKldE3yDvdkEsOPUG8KMkR'),doc(24,'1KlaqeqOhsHnxcr9RGiZMAVwGxN88btL4'),doc(25,'1oFNkSeYOqtQHt4T9GpmL95kSdSvnQusW'),doc(26,'19T7QYGaC97h1xnSfm9kCWeFKYq12XhX3'),doc(27,'1ac7ziXfpEkszoJtSwA2FH_0BagR7F4wn'),doc(28,'1QIBqG-1fzUgmlQNGm58vwCD6Xl-04BQn'),doc(29,'1UuCJZ1Zvdf2V0688NSjA3INYRsyF9pWP'),doc(30,'16JF_Jj3VHu7uF36Kw5Fja1RDiH0rN_PO'),doc(31,'1ayAWfqfncSUSX3SWqlIMkUR4jUr4IK2b'),doc(32,'1tMmWalXqWCKZsQeodsRNjtX9lCbB7ROg')
    ]},
    { key:'i1', code:'I1', name:'Intermedio I', color:'#2F6BE0', docs:[
      doc(1,'1OagVLcR4lqnJ467hCvsQGeqHvuQ8lY3b'),doc(2,'1AnPVz-CcjIz35ntOt0mbGbGDnLhdxzwN'),doc(3,'1wGU0WyFoLJDXLWmj1aXJ-Dw--nXnaZDB'),doc(4,'15YP-kJdPs2mzUAcH6jt7pPdzqwTFAHZm'),doc(5,'153FTSyyp-5PutdfUI6l0gXcb27kcx6_7'),doc(6,'19KgU92VIM86AyJ5eyyn4Q0PGk3j2ZFqE'),doc(7,'1vS9F7VrUTzGnMZqaDqQKnHTRkZFpee-l'),doc(8,'12FaLu3IlxMsCCNeSg-9P1_9EwaA3fDuT'),doc(9,'1SgJHcCvhIoiei8aC5FO89nh7_AXDH-Hm'),doc(10,'1xioRMGnNB6p8fH0uYDyQQPpwgE5Vc9A5'),doc(11,'1Fi4Ws2xdXpeum4xcRBrMBB-LpAwnbdR-'),doc(12,'1eArSeupgzI4AopXZtnm4sJUTRrdUZz1L'),doc(13,'1k7BeW6rbbhc9T-krhbQVQxKfQyvmQf5Y'),doc(14,'1XQrdzQ1lLL9vk9muXrH7M92dPg9qdWAE'),doc(15,'1n43BnIbd87FgQJutAuOkZ8uSvRP-XhiK'),doc(16,'1i9Cb3pDY7-qOoHxScdqTnjfmbdarpi7s'),doc(17,'1xTvQ8fFX4eAvkMpIIVmZcRce3ZBzzUcL'),doc(18,'162fv3vv4oekBQwyxppB27GTF5sYZmnMU'),doc(19,'1Jd1zJpNUkPeupxMao4dFT9t040EFnO10'),doc(20,'15gOrHzaRGi1gljR9X5Quggy6e202eSmg'),doc(21,'1kFGteTbTZUBq1ppiXUGuOQk1WeN6rbPk'),doc(22,'17HvXEldonGA_VxbRkSCAbVId76JSJsKX'),doc(23,'1_adwaKntTcYujNS6Bvcd2ksygQvmkWat'),doc(24,'1uo6SRRFURvXGUVVVpwn1M1xdAH1sK1-L'),doc(25,'1nAWWuV-bK7ufRZxdJoedg65QFYanIh51'),doc(26,'1BQU6Dj3KlDuaCZHDX8--uT1G4LiDeBcK'),doc(27,'1i6OBnXQXDwDMKZZzxeNLVyhqeZUZkXKS'),doc(28,'1fgr6JWRGUWXUwmw-mgy7AZ6hS1jyFWiI'),doc(29,'1-3UJmMpQBsi_iejUjPyXS0M5UiveDGiZ'),doc(30,'1vDkiiPKUbha0eTCHxM_6NePwUJ6N-2No'),doc(31,'1dWmY5gwZZxqHPw3-KhhmgkZKIVyiA9GU'),doc(32,'1ZQeRcy3oX1rgriHFhmdVPQn7sFwzTXYJ')
    ]},
    { key:'i2', code:'I2', name:'Intermedio II', color:'#2E7D32', docs:[
      doc(1,'1nHeQkSO2qH82BlvRPR7XTJ2Du44IEoJV'),doc(2,'1JhueKQ6AMSrhN0QsXjayrHAkkU8vvf8G'),doc(3,'1xJr4NjxIJcgBAzdJenQpqi8v6mKt7BFM'),doc(4,'1unk3XNzc-VgHvuXpcpTpFpNRPMpLrC7q'),doc(5,'17hte0riuf2CwlC7agHzY2irpsot-w6P0'),doc(6,'1vDcQfzJfPPINDgdi5dfasKFqSVv_3Z-9'),doc(7,'1eC_cfRCl3yVAT-DHRCUs_tZUYFZypxQw'),doc(8,'1fqJWwseAyhbs3ORw3KuImXebMMltpnFk'),doc(9,'1iBegwOD3Wnuw7rvzcAM5ArfAkHAcOMFN'),doc(10,'1pp6-LaMAEOjCa0O5s0_c1-agh8O4LqBi'),doc(11,'19ZN49zVh1qdIfhnimNxEMTAI3FiJRtix'),doc(12,'1Xa9YtX_BN8YIOqfc9aEeZpMEi_8ZQ0wg'),doc(13,'1-pLwfAAJUJLzyWtgBok973IlyhcLtS5j'),doc(14,'19o2Z-76IN2IxZ7Tjjy0BLZeoez3Qdkbb'),doc(15,'1lxlL4Wif9ReaoNNWDeWbqq4mkhJO8stH'),doc(16,'1ILGxmINzbWKPklOa1ORlx-VM7U3JNp6W'),doc(17,'1TH0x3K0QiOD6m7hTTwwW95sWLN3Bn0Ku'),doc(18,'1k3Avjd28avdiMqbypx_zVZM6pFBKw321'),doc(19,'1A-ksTcLUw-8le2I7XofTOVzNVqgtyhvU'),doc(20,'145DgZSfY9cypO0AC4cvTN1tFr4CK25Kx'),doc(21,'1wTFUoZTk__b96dWu1ITtX7X5jKF9HjBV'),doc(22,'1bE6Bi01FgVgVQQhxOskIjaX3rFcI7ZKB'),doc(23,'1va6ul2hVv2Hdo5-nlUKbTo-J_CTpk9yV'),doc(24,'1QLfwmYKVfqzbUu6p8xKwO0A8D_SWAz-N'),doc(25,'1AvY5o5g8pZWOIgb-BbozldlNwg_odd3N'),doc(26,'1KU9FsJXsMvwx6obfXWNwE6MsuoZmgG6f'),doc(27,'16P1DrQqzGNdVWcyPGT3UDMDOMWSCgzuR'),doc(28,'1gwyfkhAikYlRGAFeFRRR01wS2rM5oEX-'),doc(29,'1deyPnfaAU-kPN1g2bmAJBDBXreFD1EBK'),doc(30,'1yhH9sq3bKF0P0H-DcuF3SI_P0pN1MyLP'),doc(31,'17buFHbaeRLKDl_VnqY7JTj8wnnyXIGjH'),doc(32,'1pGBeJHTtCDOOIcFBWKq22RAey4Bbd7j4')
    ]},
  ];

  function defaultLevelKey(){
    const u = session();
    const raw = String(u.grupoActivo || u.grupo || (Array.isArray(u.grupos) ? u.grupos[0] : '') || '').toUpperCase();
    if (raw.includes('B2')) return 'b2';
    if (raw.includes('I1')) return 'i1';
    if (raw.includes('I2')) return 'i2';
    return 'b1';
  }

  function Header(){ return <div style={{ background:'linear-gradient(135deg,#fff 0%,#F8F4EE 100%)', border:'1px solid var(--line,#e5e0d8)', borderRadius:18, padding:'18px 20px', boxShadow:'var(--sh-1,0 6px 22px rgba(0,0,0,.06))', marginBottom:14 }}>
    <div style={{ fontSize:11, fontWeight:950, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--an-granate,#7A1E2C)' }}>Planificación Académica</div>
    <div style={{ fontSize:31, fontWeight:950, lineHeight:1.08, color:BLUE, marginTop:4 }}>Planeamiento didáctico</div>
    <div style={{ fontSize:13, color:'var(--ink-3,#6f6a63)', marginTop:7, maxWidth:900, lineHeight:1.5 }}>Planeamiento oficial por lección. Cada nivel muestra sus 32 PDFs, separados del Cronograma del módulo.</div>
  </div>; }

  function Planeamiento32View(){
    const [levelKey,setLevelKey] = React.useState(defaultLevelKey);
    const [lesson,setLesson] = React.useState(1);
    const level = LEVELS.find(l=>l.key===levelKey) || LEVELS[0];
    const selected = level.docs.find(d=>d.n===lesson) || level.docs[0];
    React.useEffect(()=>setLesson(1), [levelKey]);
    return <section data-screen-label="Docente · CS21A6 · planeamiento 32" style={{ padding:18 }}>
      <Header/>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:12 }}>{LEVELS.map(l=><button key={l.key} type="button" className={l.key===levelKey?'btn btn-primary':'btn'} onClick={()=>setLevelKey(l.key)} style={{ fontSize:12, fontWeight:900 }}><span style={{ display:'inline-block', width:9, height:9, borderRadius:99, background:l.color, marginRight:6 }}></span>{l.name}</button>)}</div>
      <div style={{ display:'grid', gridTemplateColumns:'minmax(230px,330px) 1fr', gap:14, alignItems:'start' }}>
        <div style={{ background:'#fff', border:'1px solid var(--line,#e5e0d8)', borderRadius:16, padding:12 }}>
          <div style={{ fontSize:18, fontWeight:950, color:BLUE, margin:'2px 4px 10px' }}>{level.name} · 32 lecciones</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:7 }}>{level.docs.map(d=><button key={d.code} type="button" className={d.n===selected.n?'btn btn-primary':'btn'} onClick={()=>setLesson(d.n)} style={{ fontSize:12, fontWeight:850, justifyContent:'flex-start' }}>{d.title}</button>)}</div>
        </div>
        <div style={{ background:'#fff', border:'1px solid var(--line,#e5e0d8)', borderRadius:16, overflow:'hidden', minHeight:590 }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--line,#e5e0d8)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <div><div style={{ fontSize:23, fontWeight:950, color:BLUE, lineHeight:1.15 }}>{level.name} · {selected.title}</div><div style={{ fontSize:12, color:'var(--ink-3,#6f6a63)', marginTop:4 }}>{selected.desc}</div></div>
            <button type="button" className="btn btn-primary" onClick={()=>openDownload(selected)} style={{ fontWeight:900 }}>Descargar PDF</button>
          </div>
          <iframe title={level.name + ' ' + selected.title} src={filePreview(selected.id)} style={{ width:'100%', height:'72vh', minHeight:520, border:0, display:'block', background:'#f7f4ef' }} allow="autoplay"></iframe>
        </div>
      </div>
    </section>;
  }

  function install(){
    if (!window.MaterialesView || window.MaterialesView.__cs21a6) return;
    const Base = window.MaterialesView;
    const Wrapped = function MaterialesViewCS21A6(props){
      const u = session();
      const screen = sessionStorage.getItem('an_teacher_materiales_tab') || 'info';
      if (!u || u.rol !== 'teacher' || screen !== 'planeamiento') return <Base {...props}/>;
      return <Planeamiento32View {...props}/>;
    };
    Wrapped.__cs21a6 = true;
    Wrapped.__base = Base;
    window.MaterialesView = Wrapped;
    try { MaterialesView = Wrapped; } catch(_) {}
  }
  window.addEventListener('an:lazy-module-loaded', install);
  setTimeout(install, 0);
})();