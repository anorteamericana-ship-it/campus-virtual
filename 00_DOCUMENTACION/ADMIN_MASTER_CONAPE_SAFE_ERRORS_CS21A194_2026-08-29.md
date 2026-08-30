# CS21A194 · Panel Maestro CONAPE · errores seguros

Fecha: 2026-08-29

## Superficie activa

`campus.html` carga directamente los módulos `admin_master_conape_*` que componen el Panel Maestro CONAPE.

## Hallazgo

El transporte común `post()` mantiene diagnósticos útiles para desarrollo, pero varias capas convertían esos detalles técnicos en UI del operador:

- verificación de morosidad → `msg`;
- actualización manual del panel → `msg`;
- carga de comentario/seguimiento → `editor.error`;
- guardado de comentario/seguimiento → `editor.error`;
- guardado del semáforo de revisión → `msg`;
- preparación de WhatsApp → `alert` con `e.message`;
- carga global del Panel Maestro → `state.error`.

`PanelView` renderiza `msg` y `DetailModal` renderiza `editor.error`, por lo que la propagación era visible.

## Cambio

Se agrega `safeUserError(raw, fallback, context)` en el core del Panel Maestro y se reutiliza en las fronteras UI.

El helper:

- preserva mensajes humanos de negocio;
- filtra códigos y detalles de Apps Script/backend/HTTP/red/token/JSON/excepciones/endpoints;
- deja el detalle técnico en `console.warn`;
- devuelve un fallback operacional estable al usuario.

## No cambia

- `post()` ni su protocolo;
- token (permanece en body JSON POST);
- endpoints;
- filtros;
- morosidad;
- semáforo de revisión;
- detalle interno del estudiante;
- mensajes WhatsApp;
- periodicidad de polling;
- reglas CONAPE;
- Apps Script;
- Drive;
- producción.

## Fuera de alcance deliberado

Copy técnico no-error como `7-morosidad`, nombres de builds o fuentes internas se revisará en un corte copy-only separado.
