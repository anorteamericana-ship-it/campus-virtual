# C3.3 · Reclutar prospecto en CONAPE desde Ventas

**Tipo de cambio:** MIXTO / RELEASE CONTROLADO  
**Base:** `feature/conape-portal-parser-c3-1@696af9f7c971e963b04c5fddc0d122852cb10cbc`  
**Rama:** `feature/conape-reclutamiento-c3-3`  
**Estado:** SOURCE + E1 + **E2 AUTENTICADA LECTURA del formulario real Reclutar**. Envío real sigue bloqueado hasta congelar el contrato de submit/confirmación y ejecutar E4 controlada.

## Línea base registrada

- repositorio: `anorteamericana-ship-it/campus-virtual`
- `main` vigente durante C3.3: `b025b270b8df633efe7d7682666645cf8dfe6030`
- rama C3.3: `feature/conape-reclutamiento-c3-3`
- entorno E2: Oracle APEX real `online.conape.go.cr`, sesión autenticada por el propietario, perfil Chromium temporal aislado, sin escritura.

## Objetivo de negocio

El asesor no debe entrar al portal CONAPE para reclutar un prospecto.

Flujo objetivo dentro de `ventas.html`:

`prospecto Campus -> Reclutar en CONAPE -> consulta/preflight CONAPE -> comparación -> completar faltantes -> Enviar solicitud -> confirmación -> seguimiento CONAPE`

## Botón Campus

Se agrega **Reclutar en CONAPE** al contexto del drawer del prospecto cuando:

- `FINANCIAMIENTO = CONAPE`;
- no está `CANCELADO`;
- no está `ACTIVO/MATRICULADO`.

C3.3 envuelve el `ProspectoDrawer` existente sin modificar su archivo grande ni duplicar sus acciones.

## Primera vista / comparación

La primera vista del Campus compara:

| Dato | Regla |
|---|---|
| Cédula | solo dígitos, sin espacios ni guiones |
| Nombre | comparar Campus vs CONAPE; para el submit real CONAPE separa `Primer Apellido`, `Segundo Apellido` y `Nombre` |
| Correo | si CONAPE ya tiene correo, se conserva y no se intenta sobrescribir |
| Correo Campus | si difiere del correo CONAPE, se conserva como contacto alterno del Campus |
| Teléfono | usar el WhatsApp del prospecto del Campus, normalizado a 8 dígitos |

No se mezclan silenciosamente dos correos: quedan identificados como `correo CONAPE` y `correo Campus secundario`.

## Contrato real descubierto en E2 · 2026-09-09/10 Costa Rica

La prueba autenticada read-only abrió el botón real **RECLUTAR PROSPECTOS** y llegó a la página APEX:

`/apex/r/conaweb/prospectación-reclutador/prospecto`

Título observado: `PROSPECTO`.

Contexto descubierto: `top/document`.

Formulario observado:

- `id = wwvFlowForm`
- `method = post`
- `path = /apex/wwv_flow.accept`

Campos visibles reales:

| Label CONAPE | Item APEX | Required | Editable | Max length |
|---|---|---:|---:|---:|
| Cédula del Prospecto | `P2_PRS_CEDULA` | sí | sí | 255 |
| Primer Apellido | `P2_PRS_APELLIDO_1` | no | sí | 30 |
| Segundo Apellido | `P2_PRS_APELLIDO_2` | no | sí | 30 |
| Nombre | `P2_PRS_NOMBRE` | no | sí | 30 |
| Teléfono Celular | `P2_PRS_CELULAR` | sí | sí | 8 |
| Correo Electrónico | `P2_PRS_EMAIL` | no | sí | 128 |

Botones visibles en la página:

- `Regresar`
- `Crear nuevo Prospecto`

El discovery omitió 33 inputs hidden y **no leyó sus valores**. `write_performed=false`.

### Consecuencias para el Campus

1. El teléfono a enviar debe quedar en exactamente 8 dígitos; coincide con la regla de usar el WhatsApp normalizado.
2. El correo es editable en la vista de creación de un nuevo prospecto; aun así, por regla de negocio, si un registro CONAPE existente ya trae correo, el Campus no lo sobrescribe silenciosamente.
3. CONAPE no usa un único campo `nombre_completo` para crear: exige tres piezas distintas de nombre. El Campus debe mostrar/confirmar `Primer Apellido`, `Segundo Apellido` y `Nombre` antes del submit si no dispone de esos datos estructurados de forma confiable.
4. No se debe adivinar la separación del nombre completo sin una confirmación visible del asesor o una fuente estructurada confiable.

## Contrato frontend reservado

Lectura/preflight:

`fn = conapePortalRecruitPreview`

Entrada mínima:

```json
{ "cedula": "111111111" }
```

Respuesta objetivo:

```json
{
  "ok": true,
  "found": true,
  "prospecto": {
    "cedula": "111111111",
    "apellido_1": "...",
    "apellido_2": "...",
    "nombre": "...",
    "correo": "...",
    "telefono": "..."
  },
  "source_version": "...",
  "can_submit": true
}
```

Escritura:

`fn = conapePortalRecruitSubmit`

Payload objetivo ya alineado al formulario real:

```json
{
  "cedula": "111111111",
  "prospecto": {
    "P2_PRS_CEDULA": "111111111",
    "P2_PRS_APELLIDO_1": "...",
    "P2_PRS_APELLIDO_2": "...",
    "P2_PRS_NOMBRE": "...",
    "P2_PRS_CELULAR": "88881234",
    "P2_PRS_EMAIL": "correo@ejemplo.com"
  },
  "source_version": "..."
}
```

La UI **no habilita Enviar solicitud** mientras `can_submit !== true`.

El backend/bridge todavía no está implementado/desplegado. El frontend falla cerrado y lo comunica como integración pendiente; nunca simula éxito real.

## Regla del correo

1. Si CONAPE no tiene correo y el formulario permite escribirlo: usar correo Campus.
2. Si CONAPE ya tiene correo: conservar correo CONAPE sin modificarlo.
3. Si el correo Campus difiere: mantenerlo en el Campus como contacto alterno.
4. Nunca presentar un cambio de correo en CONAPE como hecho si el portal no lo confirmó.

## Regla del teléfono

Para reclutamiento nuevo, el teléfono candidato es el campo WhatsApp del prospecto Campus:

- quitar `+506` cuando venga incluido;
- quitar espacios, guiones, paréntesis y otros separadores;
- conservar los últimos 8 dígitos;
- no inventar teléfono si no existe.

## Regla de nombres

CONAPE crea el prospecto con tres campos separados:

- `P2_PRS_APELLIDO_1`
- `P2_PRS_APELLIDO_2`
- `P2_PRS_NOMBRE`

Si el Campus solo dispone de `NOMBRE` completo, la primera versión operativa debe presentar una separación sugerida únicamente como borrador editable y exigir confirmación del vendedor antes de `Enviar solicitud`. No se debe persistir ni enviar una separación inferida como si fuera dato confirmado.

## Discovery automático del botón Reclutar

`scripts/conape_portal/discover_recruit_form_c3_3.mjs`

Launcher Windows:

`scripts/conape_portal/run_conape_recruit_discovery_windows.ps1`

El script:

1. abre CONAPE en perfil temporal aislado;
2. el propietario inicia sesión directamente;
3. detecta el botón visible `Reclutar`;
4. lo abre;
5. **NO presiona Crear nuevo Prospecto / Enviar / Guardar**;
6. inventaría solo metadatos de campos visibles: label, id/name, tipo, required, readonly, maxlength, pattern y opciones de selects;
7. omite valores actuales, inputs hidden, cookies y tokens;
8. elimina el perfil temporal al terminar.

### Hallazgo operativo del primer intento

El primer E2 produjo un falso positivo porque el discovery aceptó los cuatro controles preexistentes de `PROSPECTACIÓN RECLUTADOR` como si fueran el formulario. Se corrigió con baseline estructural + `pickChangedContext()`: ahora solo acepta un contexto nuevo/cambiado, incluyendo navegación top, dialogs e iframes same-origin. La segunda ejecución autenticada llegó correctamente a la página `PROSPECTO` y congeló los seis items APEX anteriores.

## Arquitectura final prevista

`Ventas browser -> Apps Script Campus autenticado -> CONAPE bridge privado -> Oracle APEX`

El navegador del vendedor nunca recibe credenciales CONAPE ni cookies APEX.

El bridge privado tendrá que:

- autenticar con credencial autorizada guardada fuera del repo;
- resolver sesión/tokens APEX dinámicamente;
- ejecutar primero consulta por cédula;
- rechazar duplicados/ambigüedad;
- respetar campos locked/read-only del formulario;
- enviar únicamente después de preflight reciente (`source_version`);
- devolver confirmación verificable;
- registrar auditoría sin password/cookies/tokens.

## Gate siguiente

El contrato de **campos** ya está confirmado E2. Falta congelar el contrato de **submit** sin ejecutar todavía una escritura real:

- identificador/request exacto detrás de `Crear nuevo Prospecto`;
- proceso APEX que se dispara;
- forma de detectar validación/duplicado;
- evidencia de éxito que no dependa únicamente de HTTP 200;
- estrategia de idempotencia/reintento;
- procedimiento de reversión para una futura E4 controlada.

Solo después se implementa el bridge `preview + submit` y se habilita una prueba E4 con prospecto de prueba autorizado.

## Gate de escritura

Según `AGENTS.md`, una operación CONAPE requiere **E4 ESCRITURA CONTROLADA** en un escenario autorizado/aislado con trazabilidad.

Antes de E4 deben estar confirmados:

- campos exactos del formulario Reclutar: **CONFIRMADO E2**;
- cuáles son obligatorios: **CONFIRMADO E2**;
- correo editable en creación: **CONFIRMADO E2**;
- teléfono max 8: **CONFIRMADO E2**;
- selector/acción APEX que ejecuta el submit: **PENDIENTE**;
- respuesta de éxito/fallo/duplicado: **PENDIENTE**;
- idempotencia o detección de reenvío: **PENDIENTE**;
- reversión o procedimiento de limpieza del prospecto de prueba: **PENDIENTE**.

## No hacer

- no hardcodear `p_instance`, `PLUGIN`, session ni CSRF;
- no poner usuario/contraseña CONAPE en frontend, GitHub o Apps Script Properties visibles al vendedor;
- no llamar `wwv_flow.ajax` directamente desde `ventas.html`;
- no cambiar etapa interna a `CONAPE_SOLICITUD` antes de recibir confirmación real del reclutamiento;
- no declarar éxito por HTTP 200 si la respuesta APEX indica validación/duplicado/error;
- no inferir silenciosamente apellidos/nombres desde un nombre completo y enviarlos como confirmados.
