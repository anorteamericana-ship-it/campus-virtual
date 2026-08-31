# CS21A210N · Reauditoría de errores visibles sobre punta actual

Fecha: 31-ago-2026

## Base exacta
- PR #230 / `fix/permisos-roles-superadmin-safe-copy-cs21a210m`
- head: `02ddcae16429436f7bbf5ab8f8181f91f8ab6322`

## Objetivo
Reejecutar el scanner V2 de sinks directos de errores técnicos visibles después de los cortes H–M. El conteo histórico previo ya no se considera vigente.

## Herramienta
Se reutiliza **sin cambios** el scanner auditado CS21A210G:
- `scripts/audit_raw_user_error_surface_cs21a210g.mjs`
- blob exacto `798dfa604929dd9700554cdc5919054a6eca1626`

Detecta sinks directos de `message/error` hacia `setError`, `setErr`, `setMsg`, `alert`, toast y equivalentes, ignorando helpers seguros reconocidos y códigos ya mapeados.

## Alcance
Este branch agrega únicamente:
- scanner histórico validado;
- workflow de reauditoría actual;
- esta documentación.

No modifica `src/`, backend, Apps Script, ACL, main ni PROD.

El workflow usa `--fail-on-findings` a propósito: un rojo del paso scanner significa **hallazgos pendientes**, no regresión funcional. Las regresiones M/L y `diff --check` corren con `if: always()` para separar ambas señales.

## Evidencia esperada
El log de Actions será la nueva fuente para:
- conteo actual de sinks directos;
- archivo/línea/tipo;
- selección del siguiente corte funcional compacto.

**AUDIT ONLY · NO FUNCTIONAL CHANGE · NO PROD · NO MERGE**
