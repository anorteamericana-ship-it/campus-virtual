/**
 * Campus Virtual · Academia Norteamericana
 * Apps Script v4.14 — fix getUsuario (BUG A)
 * ───────────────────────────────────────────────────────────────────────
 *
 * BUG A
 *   En la hoja USUARIOS la columna `codigo` (REC_M) puede venir vacía si
 *   `activarEstudiante()` nunca corrió para esa cuenta. Antes devolvíamos
 *   `codigo: ''`, lo que rompía el flujo en login.jsx → StudentDashboard:
 *   useEstudiante('') no llamaba al endpoint y la pantalla quedaba en
 *   "No hay sesión activa".
 *
 * FIX
 *   Si `USUARIOS.codigo` está vacío y el rol es estudiante, buscamos la
 *   fila de la hoja DATOS por cédula (el `usuario` que escribió la persona
 *   ES su cédula) y devolvemos el REC_M encontrado.
 *
 * SOLO ESTA FUNCIÓN ESTÁ EN ESTE ARCHIVO. Pegar tal cual sobre la versión
 * de `getUsuario` que está en producción.
 *
 * Caso de prueba que motivó el fix:
 *   Usuario: 114930546  ·  Contraseña: 17065
 *   Esperado: { ok:true, rol:'student', codigo:'17065', grupo:'B1-LJ69-B6-0325' }
 */
function getUsuario(e) {
  var ss = SpreadsheetApp.openById(SHEET_ID); // SHEET_ID definido en el .gs principal
  var usuario = String((e.parameter.usuario || '')).trim().toLowerCase();
  var clave   = String(e.parameter.clave || '').trim();

  if (!usuario || !clave) {
    return _json({ ok: false, error: 'credenciales_invalidas' });
  }

  // ── 1. Buscar en USUARIOS ────────────────────────────────────────────
  var hUsr  = ss.getSheetByName('USUARIOS');
  var vals  = hUsr.getDataRange().getValues();
  var head  = vals.shift().map(function (h) { return String(h).trim().toLowerCase(); });
  var iU    = head.indexOf('usuario');
  var iC    = head.indexOf('clave');
  var iRol  = head.indexOf('rol');
  var iNom  = head.indexOf('nombre');
  var iGr   = head.indexOf('grupo');
  var iCod  = head.indexOf('codigo');     // REC_M
  var iAct  = head.indexOf('activo');
  var iProg = head.indexOf('programa');
  var iGrs  = head.indexOf('grupos');     // multi-grupo (docentes / admins)

  var fila = null;
  for (var r = 0; r < vals.length; r++) {
    var u = String(vals[r][iU] || '').trim().toLowerCase();
    if (u && u === usuario) { fila = vals[r]; break; }
  }
  if (!fila) return _json({ ok: false, error: 'credenciales_invalidas' });

  // Clave (soporta hash o texto plano legado — sin cambios respecto a v4.14)
  var claveOk = _checkClave(clave, fila[iC]);
  if (!claveOk) return _json({ ok: false, error: 'credenciales_invalidas' });

  // Activo
  if (iAct !== -1) {
    var activo = String(fila[iAct] || '').toLowerCase();
    if (activo === 'false' || activo === '0' || activo === 'no' || activo === 'inactivo') {
      return _json({ ok: false, error: 'usuario_inactivo' });
    }
  }

  var rol    = String(fila[iRol]  || '').trim().toLowerCase() || 'student';
  var nombre = String(fila[iNom]  || '').trim();
  var grupo  = iGr  !== -1 ? String(fila[iGr]  || '').trim() : '';
  var codigo = iCod !== -1 ? String(fila[iCod] || '').trim() : '';
  var prog   = iProg!== -1 ? String(fila[iProg]|| '').trim() : 'SIN_INA';

  // ── 2. BUG A FIX ────────────────────────────────────────────────────
  //    Si es estudiante y no tiene REC_M en USUARIOS, buscar en DATOS
  //    por cédula y devolver el primero que coincida.
  if (rol === 'student' && !codigo) {
    try {
      var hDatos = ss.getSheetByName('DATOS');
      if (hDatos) {
        var dVals = hDatos.getDataRange().getValues();
        var dHead = dVals.shift().map(function (h) { return String(h).trim().toUpperCase(); });
        var jCed  = dHead.indexOf('CEDULA');
        if (jCed === -1) jCed = dHead.indexOf('NUM_CEDULA');
        var jRec  = dHead.indexOf('REC_M');
        var jGr2  = dHead.indexOf('GRUPO');
        var jProg2= dHead.indexOf('PROGRAMA');

        if (jCed !== -1 && jRec !== -1) {
          for (var k = 0; k < dVals.length; k++) {
            var ced = String(dVals[k][jCed] || '').replace(/\D/g, '');
            if (ced && ced === usuario.replace(/\D/g, '')) {
              codigo = String(dVals[k][jRec] || '').trim();
              if (!grupo && jGr2 !== -1) grupo = String(dVals[k][jGr2] || '').trim();
              if ((!prog || prog === 'SIN_INA') && jProg2 !== -1) {
                prog = String(dVals[k][jProg2] || '').trim() || prog;
              }
              break;
            }
          }
        }
      }
    } catch (err) {
      // No bloqueamos el login si DATOS falla — solo loggeamos.
      Logger.log('getUsuario fallback DATOS: ' + err);
    }
  }

  // ── 3. Multi-grupo (docentes / admins con varios grupos) ────────────
  if (iGrs !== -1 && fila[iGrs]) {
    try {
      var grupos = JSON.parse(fila[iGrs]);
      if (Array.isArray(grupos) && grupos.length > 1) {
        return _json({
          ok: true, multiGrupo: true,
          rol: rol, nombre: nombre, usuario: usuario,
          grupos: grupos,
        });
      }
    } catch (err) { /* ignorar — formato libre */ }
  }

  // ── 4. Respuesta normal ─────────────────────────────────────────────
  return _json({
    ok:       true,
    rol:      rol,
    nombre:   nombre,
    usuario:  usuario,   // ← lo devolvemos para que login.jsx pueda guardar `cedula`
    grupo:    grupo,
    codigo:   codigo,    // ← ahora puede venir resuelto vía DATOS
    programa: prog,
  });
}
