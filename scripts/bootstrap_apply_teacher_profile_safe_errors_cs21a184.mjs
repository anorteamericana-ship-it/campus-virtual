import fs from 'node:fs';

const path = 'src/teacher_profile_cs21a76.jsx';
let s = fs.readFileSync(path, 'utf8');

function replaceOnce(oldText, newText, label) {
  const n = s.split(oldText).length - 1;
  if (n !== 1) throw new Error(`${label}: expected exact preimage once, found ${n}`);
  s = s.replace(oldText, newText);
}

const anchor = `  const SCRIPT_URL = window.APPS_SCRIPT_URL;`;
const helper = `  const SCRIPT_URL = window.APPS_SCRIPT_URL;

  function tp76SafeUserError(raw, fallback, context = '') {
    const msg = String(raw == null ? '' : raw).trim();
    if (!msg) return fallback;
    const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);
    const technicalText = /apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|sesion_requerida|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|sha-?256|\\bmime\\b|base64|file_id|respuesta_vacia|integridad_|sec004_|demo_read_only|policy_unbound/i.test(msg);
    if (technicalCode || technicalText) {
      console.warn('[TeacherProfile] Detalle técnico oculto al docente.', { context, error: msg });
      return fallback;
    }
    return msg;
  }`;
replaceOnce(anchor, helper, 'insert safe helper');

replaceOnce(
  `        setState(previous => ({ ...previous, loading: false, error: error?.message || String(error) }));`,
  `        setState(previous => ({ ...previous, loading: false, error: tp76SafeUserError(error?.message || String(error), 'No pudimos cargar tu perfil. Intentá de nuevo.', 'cargar_perfil') }));`,
  'load safe error'
);

replaceOnce(
  `      } catch (error) {
        setNotice(error?.message || String(error));
      } finally {
        setBusy('');
      }
    };

    const uploadPhoto`,
  `      } catch (error) {
        setNotice(tp76SafeUserError(error?.message || String(error), 'No se pudo guardar el perfil. Intentá de nuevo.', 'guardar_perfil'));
      } finally {
        setBusy('');
      }
    };

    const uploadPhoto`,
  'save-profile safe error'
);

replaceOnce(
  `      } catch (error) {
        setNotice(error?.message || String(error));
      } finally {
        setBusy('');
      }
    };

    const uploadDocument`,
  `      } catch (error) {
        setNotice(tp76SafeUserError(error?.message || String(error), 'No se pudo actualizar la fotografía.', 'subir_foto'));
      } finally {
        setBusy('');
      }
    };

    const uploadDocument`,
  'photo safe error'
);

replaceOnce(
  `      } catch (error) {
        setNotice(error?.message || String(error));
      } finally {
        setBusy('');
      }
    };

    if (state.loading && !state.data)`,
  `      } catch (error) {
        setNotice(tp76SafeUserError(error?.message || String(error), 'No se pudo actualizar el documento.', ` + "`subir_documento:${type}`" + `));
      } finally {
        setBusy('');
      }
    };

    if (state.loading && !state.data)`,
  'document safe error'
);

fs.writeFileSync(path, s, 'utf8');
console.log('CS21A184 EXACT PATCH APPLIED');
