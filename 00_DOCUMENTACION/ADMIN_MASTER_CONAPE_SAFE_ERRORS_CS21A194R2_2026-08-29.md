# CS21A194R2 · Panel Maestro CONAPE · errores seguros

Fecha: 2026-08-29
Estado: DRAFT / source candidate / NO PROD
Base: PR #179 · `security/admin-academic-private-pdf-cs21a193` · `65c35c589bb550cc513bae56ee386119c87f196c`

## Hallazgo
El Panel Maestro CONAPE carga de forma permanente desde `campus.html`. Su transporte compartido `post()` conserva diagnósticos técnicos útiles, pero `useConapePanelData()` propagaba algunos `error.message` directamente a estados visibles:

- mensaje al verificar morosidad;
- mensaje al actualizar CONAPE;
- error al cargar seguimiento individual;
- error al guardar seguimiento individual.

`PanelView` renderiza `msg` y `DetailModal` renderiza `editor.error`, por lo que esos detalles podían llegar al operador.

## Cambio
Se agrega `masterConapeSafeUserError(raw, fallback, context)` al núcleo compartido y se aplica únicamente antes de escribir en estados visibles.

Se filtran códigos y diagnósticos de implementación como Apps Script/backend/endpoints, HTTP/status, HTML/JSON, token/auth, excepciones JavaScript, errores de red y códigos tipo máquina. El detalle técnico queda en `console.warn`.

## Preservado deliberadamente
- `post()` conserva sus throws técnicos internos;
- endpoints y payloads no cambian;
- consultas de morosidad no cambian;
- actualización CONAPE no cambia;
- editor de seguimiento no cambia su persistencia;
- mensajes de éxito y mensajes humanos de negocio permanecen;
- PR #179 permanece intacto;
- no hay Apps Script, Drive ACL ni producción.

## Hallazgo separado
`refresh()` llama `refreshMora(false)`, pero `refreshMora` captura internamente su error. Por eso un fallo de verificación de morosidad puede ser seguido por el mensaje final de éxito de `refresh()`. Esto se clasifica como posible falsa confirmación lógica y queda expresamente fuera de CS21A194R2 para un corte separado y trazable.

## Evidencia requerida
- guard CS21A194R2;
- regresión CS21A193;
- regresión CS21A192;
- `git diff --check`.

**DRAFT · UI ERROR BOUNDARY ONLY · NO BUSINESS LOGIC CHANGE · NO PROD · NO AUTO-MERGE**
