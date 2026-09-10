# C3.5 · CONAPE Private Bridge · contrato posterior a E4

## Estado

La E4 controlada de C3.4 confirmó una creación real con `POST /apex/wwv_flow.accept`, `p_request=CREATE`, señal visible de éxito, cero mensaje de duplicado/error, identidad obtenida por cédula y una sola escritura.

C3.5 ya no descubre el formulario: implementa el puente entre Campus y el portal.

## Arquitectura

`ventas.html -> Apps Script Campus autenticado -> bridge privado -> Oracle APEX`

El navegador del vendedor nunca recibe:

- usuario/contraseña CONAPE;
- cookies APEX;
- `p_instance`;
- CSRF/session tokens;
- hidden item values.

## Endpoint Campus: conapePortalRecruitPreview

Entrada del navegador:

```json
{ "fn":"conapePortalRecruitPreview", "token":"<campus>", "cedula":"123456789" }
```

Backend Campus debe validar primero:

1. sesión Campus válida;
2. rol `ventas|admin|superadmin`;
3. para rol ventas, que el prospecto pertenezca al asesor autenticado;
4. financiamiento CONAPE;
5. cédula normalizada.

Luego llama al bridge privado.

### Bridge `POST /v1/recruit/preview`

Entrada mínima:

```json
{ "cedula":"123456789" }
```

El bridge:

1. obtiene/renueva sesión APEX autorizada fuera del frontend;
2. abre Reclutar Prospectos;
3. coloca solo la cédula;
4. espera el lookup de CONAPE;
5. lee Primer Apellido, Segundo Apellido y Nombre únicamente como resultado CONAPE;
6. lee teléfono/correo actuales;
7. detecta duplicado/advertencias;
8. crea un `source_version` opaco con TTL corto y guarda server-side el snapshot correspondiente;
9. responde sin cookies/session/hidden values.

Respuesta objetivo:

```json
{
  "ok":true,
  "found":true,
  "prospecto":{
    "cedula":"123456789",
    "apellido_1":"...",
    "apellido_2":"...",
    "nombre":"...",
    "telefono":"88881234",
    "correo":"correo@ejemplo.com"
  },
  "source_version":"opaque-random-token",
  "source_expires_at":"2026-09-10T03:00:00.000Z",
  "can_submit":true
}
```

`source_version` debe ser aleatorio/opaco; no debe ser un hash reversible o adivinable de la cédula.

## Endpoint Campus: conapePortalRecruitSubmit

Entrada del navegador:

```json
{
  "fn":"conapePortalRecruitSubmit",
  "token":"<campus>",
  "cedula":"123456789",
  "source_version":"opaque-random-token",
  "prospecto":{
    "cedula":"123456789",
    "telefono":"88881234",
    "correo":"correo@ejemplo.com",
    "update_telefono":true,
    "update_correo":false,
    "identity_source":"CONAPE_CEDULA_LOOKUP"
  }
}
```

Prohibido aceptar del Campus:

- `nombre` / `P2_PRS_NOMBRE`;
- `apellido_1` / `P2_PRS_APELLIDO_1`;
- `apellido_2` / `P2_PRS_APELLIDO_2`.

### Bridge `POST /v1/recruit/submit`

Antes de escribir:

1. valida `source_version` existente, vigente y no consumido;
2. vuelve a comprobar que la cédula coincide con el snapshot;
3. reacquire/valida la sesión APEX;
4. vuelve a consultar la cédula y confirma que la identidad continúa siendo la de CONAPE;
5. bloquea si aparece duplicado o advertencia incompatible;
6. aplica únicamente teléfono/correo autorizados;
7. ejecuta `CREATE` una vez;
8. consume el `source_version` aunque el resultado quede incierto para evitar reintento ciego.

Éxito confirmado únicamente cuando coinciden:

- request `CREATE` observado;
- exactamente una escritura;
- señal de éxito del portal;
- sin señal de duplicado;
- sin señal de error;
- identidad no modificada por Campus.

HTTP 200 por sí solo no es éxito.

## Respuestas del bridge

Códigos mínimos:

- `CREATED`
- `DUPLICATE`
- `PORTAL_ERROR`
- `SOURCE_VERSION_REQUIRED`
- `SOURCE_VERSION_EXPIRED`
- `SOURCE_VERSION_USED`
- `CEDULA_MISMATCH`
- `IDENTITY_FIELDS_FORBIDDEN`
- `IDENTITY_LOOKUP_FAILED`
- `CONTACT_VALIDATION_FAILED`
- `SESSION_UNAVAILABLE`
- `WRITE_RESULT_UNCERTAIN`

Ante `WRITE_RESULT_UNCERTAIN`, Campus no reintenta automáticamente y no cambia la etapa a reclutado.

## Seguridad del bridge

El bridge es privado y solo acepta llamadas del backend Campus autenticado servidor-a-servidor. La credencial entre Campus y bridge se almacena fuera del repositorio.

Variables/nombres reservados para configuración, sin valores en Git:

- `CONAPE_PORTAL_BRIDGE_URL`
- `CONAPE_PORTAL_BRIDGE_SECRET`
- `CONAPE_PORTAL_USERNAME`
- `CONAPE_PORTAL_PASSWORD`

No reutilizar `CONAPE_SYNC` para esta integración.

Logs permitidos:

- request id aleatorio;
- acción preview/submit;
- código de resultado;
- timestamps/duración;
- `source_version_present=true|false`.

Logs prohibidos:

- cédula;
- nombre/apellidos;
- teléfono/correo;
- password;
- cookies;
- tokens/session;
- hidden values;
- HTML bruto.

## Estado del source

Se agregó `scripts/conape_portal/recruit_bridge_contract_c3_5.mjs` con validaciones puras del contrato y clasificación de resultado. No hace red ni contiene credenciales.

QA sintética: `scripts/qa_conape_recruit_bridge_c3_5.mjs`.

## Gate de implementación

Para conectar el bridge a Apps Script no se debe reconstruir el backend desde el `Code.gs` histórico del repositorio. La fuente de Apps Script debe tomarse del export QA vivo/modular vigente y seguir el release controlado del proyecto.

Primero se integra `preview` read-only en QA. Luego `submit` permanece fail-closed hasta validar el bridge autenticado. El paso final antes de PROD es una E4 desde el botón real del Campus, no otra prueba manual del formulario.
