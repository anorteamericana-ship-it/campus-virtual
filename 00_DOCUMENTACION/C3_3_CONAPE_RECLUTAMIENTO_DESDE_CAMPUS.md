# C3.3/C3.4 · Reclutar prospecto en CONAPE desde Ventas

**Tipo de cambio:** MIXTO / RELEASE CONTROLADO  
**Rama:** `feature/conape-reclutamiento-c3-3`  
**Estado:** formulario real + acción `CREATE` confirmados en **E2 AUTENTICADA LECTURA**. Harness de **E4 ESCRITURA CONTROLADA** preparado para una única creación autorizada. Sin merge ni PROD.

## Línea base

- repositorio: `anorteamericana-ship-it/campus-virtual`
- `main` observado durante C3.3/C3.4: `b025b270b8df633efe7d7682666645cf8dfe6030`
- portal: `online.conape.go.cr`
- app Oracle APEX observada: 302
- navegador E2/E4: Chromium temporal aislado + CDP loopback
- no se guardan credenciales, cookies, tokens, sesión ni PII en GitHub/evidencia.

## Regla canónica de negocio · 2026-09-09

El flujo correcto **NO** consiste en dividir o escribir el nombre completo del Campus.

El flujo real es:

`Cédula Campus -> CONAPE busca identidad -> comparar contactos -> completar/actualizar teléfono/correo -> Crear nuevo Prospecto`

Reglas:

1. El Campus inicia con la **cédula** del prospecto.
2. CONAPE busca y completa por esa cédula:
   - Primer Apellido;
   - Segundo Apellido;
   - Nombre;
   - y puede traer también correo/teléfono.
3. **Nombre y apellidos son propiedad de CONAPE y el Campus nunca los escribe ni modifica.**
4. El Campus compara los datos de contacto encontrados contra su prospecto.
5. Teléfono candidato: WhatsApp del Campus normalizado a 8 dígitos.
6. Correo candidato: correo vigente del Campus cuando deba completarse o actualizarse.
7. Si el dato de contacto ya coincide, se conserva.
8. Solo después del preflight se habilita **Crear nuevo Prospecto**.

Quedan anuladas las reglas anteriores de:

- separar el nombre del Campus en tres campos;
- pedir manualmente nombre/apellidos al vendedor;
- tratar un correo existente en CONAPE como inmutable;
- crear un `correo_campus_secundario` como solución automática.

## Objetivo de producto

El asesor debe poder hacerlo desde `ventas.html`:

`Prospecto -> Reclutar en CONAPE -> CONAPE busca por cédula -> comparación -> completar/actualizar contactos -> Enviar solicitud -> confirmación -> seguimiento`

El navegador del vendedor no debe recibir credenciales CONAPE ni sesión/cookies APEX.

## Formulario real confirmado E2

Ruta observada:

`/apex/r/conaweb/prospectación-reclutador/prospecto`

Título: `PROSPECTO`.

Formulario:

- `id = wwvFlowForm`
- `method = post`
- `path = /apex/wwv_flow.accept`

Campos visibles:

| Campo | Item APEX | Required | Max length | Propiedad operativa |
|---|---|---:|---:|---|
| Cédula del Prospecto | `P2_PRS_CEDULA` | sí | 255 | Campus inicia lookup |
| Primer Apellido | `P2_PRS_APELLIDO_1` | no | 30 | CONAPE · no escribir desde Campus |
| Segundo Apellido | `P2_PRS_APELLIDO_2` | no | 30 | CONAPE · no escribir desde Campus |
| Nombre | `P2_PRS_NOMBRE` | no | 30 | CONAPE · no escribir desde Campus |
| Teléfono Celular | `P2_PRS_CELULAR` | sí | 8 | contacto completables/actualizable |
| Correo Electrónico | `P2_PRS_EMAIL` | no | 128 | contacto completable/actualizable |

Botones observados:

- `Regresar`
- `Crear nuevo Prospecto`

En discovery se omitieron 33 hidden inputs; no se emitieron sus valores.

## Contrato de acción confirmado E2

La inspección autenticada del handler/dynamic action detectó:

- proceso servidor: `VALIDA_CEDULA`;
- APEX Dynamic Action;
- `NATIVE_SUBMIT_PAGE`;
- `attribute01 = CREATE`;
- `attribute02 = Y`.

Por tanto `CREATE` queda congelado como candidato de request real de creación con evidencia E2. La prueba que produjo esta evidencia no invocó el handler ni el botón:

- `handler_invoked = false`
- `button_clicked = false`
- `write_performed = false`.

## Contratos Campus reservados

### Preview

`fn = conapePortalRecruitPreview`

Entrada:

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
    "telefono": "...",
    "correo": "..."
  },
  "source_version": "...",
  "can_submit": true
}
```

La identidad de esa respuesta viene de CONAPE. El frontend solo la presenta.

### Submit

`fn = conapePortalRecruitSubmit`

Payload Campus objetivo:

```json
{
  "cedula": "111111111",
  "source_version": "...",
  "prospecto": {
    "cedula": "111111111",
    "telefono": "88881234",
    "correo": "correo@ejemplo.com",
    "update_telefono": true,
    "update_correo": false,
    "identity_source": "CONAPE_CEDULA_LOOKUP"
  }
}
```

**No contiene nombre ni apellidos.** El bridge debe obtenerlos por cédula dentro de la sesión CONAPE y conservarlos tal como los devolvió el portal.

La UI falla cerrado mientras `can_submit !== true`.

## C3.4 · E4 controlada

Archivos:

- `scripts/conape_portal/recruit_e4_controlled_c3_4.mjs`
- `scripts/conape_portal/run_conape_recruit_e4_controlled_windows.ps1`

La corrida E4 está diseñada para:

1. abrir CONAPE en perfil temporal;
2. iniciar sesión manualmente por el propietario;
3. abrir `Reclutar Prospectos`;
4. pedir **solo cédula**;
5. colocar únicamente `P2_PRS_CEDULA` y disparar sus eventos normales;
6. esperar a que CONAPE complete identidad;
7. bloquear si CONAPE no devuelve al menos primer apellido + nombre;
8. pedir únicamente teléfono/correo cuando haya que completar o actualizar;
9. escribir solo `P2_PRS_CELULAR` y/o `P2_PRS_EMAIL`;
10. mostrar precheck sin PII;
11. exigir confirmación literal `CREAR`;
12. presionar `Crear nuevo Prospecto` una sola vez;
13. capturar solo metadatos seguros del request/resultado;
14. no reintentar automáticamente si no se puede confirmar el éxito.

Invariantes E4:

- `identity_source = CONAPE_CEDULA_LOOKUP`
- `identity_fields_modified = false`
- `write_count <= 1`
- `pii_emitted = false`
- `cookies_emitted = false`
- `hidden_values_emitted = false`.

Si aparece `CREATE_NOT_CONFIRMED`, no repetir con la misma cédula hasta verificar si CONAPE ya creó el prospecto.

## Frontend Ventas alineado

`src/ventas_conape_reclutar_c3_3.jsx` ahora presenta:

- cédula;
- Primer Apellido CONAPE;
- Segundo Apellido CONAPE;
- Nombre CONAPE;
- teléfono Campus vs CONAPE;
- correo Campus vs CONAPE;
- acción de contacto: conservar / completar / actualizar.

El payload frontend no envía nombre ni apellidos.

## Arquitectura final

`Ventas browser -> Apps Script Campus autenticado -> bridge privado CONAPE -> Oracle APEX`

El bridge privado deberá:

- autenticar fuera del frontend y fuera del repo;
- resolver sesión/tokens APEX dinámicamente;
- buscar primero por cédula;
- recuperar identidad de CONAPE;
- comparar/actualizar solo contactos permitidos;
- evitar duplicados y reintentos ciegos;
- usar `CREATE` únicamente tras preflight reciente;
- verificar resultado real, no solo HTTP 200;
- registrar auditoría sin secretos ni PII innecesaria.

## Gate inmediato

El siguiente gate no es otro discovery. Es una única **E4 controlada** con prospecto real autorizado que aún no esté reclutado.

Si E4 confirma el request/resultado, el siguiente trabajo es implementar y desplegar de forma controlada:

- `conapePortalRecruitPreview`
- `conapePortalRecruitSubmit`
- bridge privado
- verificación E3/E4 del flujo desde Ventas.

## No hacer

- no escribir `P2_PRS_APELLIDO_1`, `P2_PRS_APELLIDO_2` ni `P2_PRS_NOMBRE` desde el Campus;
- no inferir nombre/apellidos desde un nombre completo;
- no hardcodear `p_instance`, sesión, CSRF, cookies o tokens;
- no guardar credenciales CONAPE en frontend/GitHub;
- no llamar infraestructura APEX directamente desde `ventas.html`;
- no marcar reclutamiento como exitoso por HTTP 200 solamente;
- no reintentar `CREATE` automáticamente tras un resultado incierto;
- no fusionar/publicar C3.4 antes de completar el release controlado correspondiente.
