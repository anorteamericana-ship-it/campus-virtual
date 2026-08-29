import fs from 'node:fs';

const path = 'src/teacher_views.jsx';
let s = fs.readFileSync(path, 'utf8');

function replaceOnce(oldText, newText, label) {
  const count = s.split(oldText).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exact preimage once, found ${count}`);
  s = s.replace(oldText, newText);
}

replaceOnce(
`      if (!r?.ok) throw new Error(r?.error || 'No se pudo iniciar sesión.');
      onStarted && onStarted(r.sesion || r);
    } catch(e){ alert(e.message || String(e)); }`,
`      if (!r?.ok) throw new Error(r?.error || 'No se pudo iniciar sesión.');
      onStarted && onStarted(r.sesion || r);
    } catch(e){ alert(teacherSessionSafeUserError(e?.message || String(e), 'No se pudo iniciar la clase. Intentá de nuevo.', 'iniciar_clase_hoy')); }`,
'class-card start error');

replaceOnce(
`      if (!r?.ok) throw new Error(r?.error || 'No se pudo finalizar sesión.');
      onClosed && onClosed(r.sesion || r);
    } catch(e){ alert(e.message || String(e)); }`,
`      if (!r?.ok) throw new Error(r?.error || 'No se pudo finalizar sesión.');
      onClosed && onClosed(r.sesion || r);
    } catch(e){ alert(teacherSessionSafeUserError(e?.message || String(e), 'No se pudo cerrar la clase. Intentá de nuevo.', 'cerrar_clase_hoy')); }`,
'class-card close error');

replaceOnce(
`      if(!r?.ok)throw new Error(r?.mensaje||r?.error||'No se pudo iniciar la clase.');
      setSesion(r.sesion||r); setSessionCheck('ok'); window.dispatchEvent(new CustomEvent('an:teacher-session-changed')); onChanged&&onChanged();
    }catch(e){alert(e.message||String(e));}finally{setBusy('');}`,
`      if(!r?.ok)throw new Error(r?.mensaje||r?.error||'No se pudo iniciar la clase.');
      setSesion(r.sesion||r); setSessionCheck('ok'); window.dispatchEvent(new CustomEvent('an:teacher-session-changed')); onChanged&&onChanged();
    }catch(e){alert(teacherSessionSafeUserError(e?.message||String(e),'No se pudo iniciar la clase. Intentá de nuevo.','iniciar_clase_drawer'));}finally{setBusy('');}`,
'drawer start error');

replaceOnce(
`      if (toast) toast(\`${'${ok}'} calificación${'${ok!==1?\'es\':\'\'}'} guardada${'${ok!==1?\'s\':\'\'}'}\`);
    } catch(e) {
      setErrGlobal('Error de conexión: ' + e.message);
    } finally {`,
`      if (toast) toast(\`${'${ok}'} calificación${'${ok!==1?\'es\':\'\'}'} guardada${'${ok!==1?\'s\':\'\'}'}\`);
    } catch(e) {
      setErrGlobal(teacherSessionSafeUserError(e?.message || String(e), 'No se pudieron guardar las calificaciones. Intentá de nuevo.', 'guardar_calificaciones'));
    } finally {`,
'grade-save error');

replaceOnce(
`      if (!data.ok) {
        setErrGlobal(data.error || 'Error al registrar asistencia');
        return;
      }`,
`      if (!data.ok) {
        setErrGlobal(teacherSessionSafeUserError(data?.error, 'No se pudo registrar la asistencia. Intentá de nuevo.', 'registrar_asistencia_respuesta'));
        return;
      }`,
'attendance backend response');

replaceOnce(
`      if (toast) toast(\`Asistencia registrada · ${'${counts.present + counts.late}'} presentes\`);
    } catch(e) {
      setErrGlobal('Error de conexión: ' + e.message);
    } finally {`,
`      if (toast) toast(\`Asistencia registrada · ${'${counts.present + counts.late}'} presentes\`);
    } catch(e) {
      setErrGlobal(teacherSessionSafeUserError(e?.message || String(e), 'No se pudo registrar la asistencia. Intentá de nuevo.', 'registrar_asistencia_excepcion'));
    } finally {`,
'attendance exception');

fs.writeFileSync(path, s, 'utf8');
console.log('CS21A187 exact patch applied');
