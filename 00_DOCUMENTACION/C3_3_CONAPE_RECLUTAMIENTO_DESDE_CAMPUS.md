# C3.3 · Reclutar prospecto en CONAPE desde Ventas

**Tipo de cambio:** MIXTO / RELEASE CONTROLADO
**Base:** `feature/conape-portal-parser-c3-1@696af9f7c971e963b04c5fddc0d122852cb10cbc`
**Rama:** `feature/conape-reclutamiento-c3-3`
**Estado:** SOURCE + E1; envío real bloqueado hasta descubrir contrato exacto del formulario CONAPE y probar escritura en entorno/control E4.

## Objetivo de negocio

El asesor no debe entrar al portal CONAPE para reclutar un prospecto.

Flujo objetivo dentro de `ventas.html`:

`prospecto Campus -> Reclutar en CONAPE -> consulta/preflight CONAPE -> comparación -> completar faltantes -> Enviar solicitud -> confirmación -> seguimiento CONAPE`

## Botón

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
| Nombre | mostrar Campus vs CONAPE y comparar de forma normalizada |
| Correo | si CONAPE ya tiene correo, se conserva y no se intenta sobrescribir |
| Correo Campus | si difiere del correo CONAPE, se conserva como contacto alterno del Campus |
| Teléfono | usar el WhatsApp del prospecto del Campus, normalizado a 8 dígitos |

No se mezclan silenciosamente dos correos: quedan identificados como `correo CONAPE` y `correo Campus secundario`.

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

## Discovery automático del botón Reclutar

Antes de programar el transporte de escritura se agrega una prueba E2 read-only:

`scripts/conape_portal/discover_recruit_form_c3_3.mjs`

Launcher Windows:

`scripts/conape_portal/run_conape_recruit_discovery_windows.ps1`

El script:

1. abre CONAPE en perfil temporal aislado;
2. el propietario inicia sesión directamente;
3. detecta el botón visible `Reclutar`;
4. lo abre;
5. **NO presiona Enviar/Guardar**;
6. inventaría solo metadatos de campos visibles: label, id/name, tipo, required, readonly, maxlength, pattern y opciones de selects;
7. omite valores actuales, inputs hidden, cookies y tokens;
8. elimina el perfil temporal al terminar.

Esto permite construir el bridge contra el formulario real, no contra una suposición.

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

## Gate de escritura

La escritura CONAPE no se prueba en producción por conveniencia. Según `AGENTS.md`, una operación CONAPE requiere **E4 ESCRITURA CONTROLADA** en un escenario autorizado/aislado con trazabilidad.

Antes de E4 deben estar confirmados:

- campos exactos del formulario Reclutar;
- cuáles son obligatorios;
- correo editable vs bloqueado;
- regla real del teléfono;
- selector/acción APEX que ejecuta el submit;
- respuesta de éxito/fallo/duplicado;
- idempotencia o detección de reenvío;
- reversión o procedimiento de limpieza del prospecto de prueba.

## No hacer

- no hardcodear `p_instance`, `PLUGIN`, session ni CSRF;
- no poner usuario/contraseña CONAPE en frontend, GitHub o Apps Script Properties visibles al vendedor;
- no llamar `wwv_flow.ajax` directamente desde `ventas.html`;
- no cambiar etapa interna a `CONAPE_SOLICITUD` antes de recibir confirmación real del reclutamiento;
- no declarar éxito por HTTP 200 si la respuesta APEX indica validación/duplicado/error.
