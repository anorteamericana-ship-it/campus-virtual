# CS21A210AX · Inscripción pública · errores seguros

Fecha: 2026-09-01

## Base congelada
- PR base: #249 `CS21A210AV · auditoría de rutas efectivas de errores crudos`
- head base exacto: `186e2e76fada311ee9bfe9cfc620cdaaa3edc927`
- preimagen `src/inscripcion.jsx`: blob `310d7b6e888836baca1bd0da0ccc0730c23ca9c3`
- entrypoint efectivo: `inscripcion.html` carga directamente `src/inscripcion.jsx?v=F98.4Z6IP5A-HOTFIX1`.

## Hallazgo efectivo
AV dejó 57 sinks directos / 13 archivos en el scanner V3 y confirmó que cinco de esos sinks pertenecían a la superficie pública efectiva de inscripción:
1. error al abrir/procesar foto documental;
2. verificación de identificación;
3. carga de grupos disponibles;
4. carga inicial de información de inscripción;
5. envío de `crearInscripcionPublica`.

Los cuatro últimos mostraban `e.message` directamente; el documental saltaba el normalizador `captureErrorMessage` ya existente.

## Corte AX
AX no altera endpoints, payloads ni reglas de negocio. Solo cambia la frontera de presentación:
- captura documental vuelve a `captureErrorMessage`;
- los otros cuatro cruces usan `inscripcionSafeUserError`, que conserva el detalle crudo solo en `console.warn` y entrega una copia estable/contextual a UI.

Contratos de red/payload congelados y verificados por guard:
- `verificarCedulaInscripcion`;
- `buscarEnPadron`;
- `getGruposDisponibles`;
- `crearInscripcionPublica`;
- `origen_web: INSCRIPCION_PUBLICA_IP5A`;
- `generar_pdf_identidad_conape: true`;
- `version_frontend: INS_VERSION`.

Nota: `getGruposInscripcion` es únicamente la etiqueta interna de contexto usada por AX en `console.warn`; el endpoint efectivo conservado es `getGruposDisponibles`.

## Evidencia QA
Bootstrap temporal: `bootstrap/inscripcion-public-safe-errors-cs21a210ax`.

Primer run `33475780543`: fallo seguro de mecánica del patcher (`helper anchor count`) después de validar base/preimagen y antes de producir source candidato. No se relajó ninguna aserción funcional.

Run corregido `33475951848`: **SUCCESS completo**:
- preimagen exacta;
- patch exacto;
- parse JSX;
- cinco sinks antiguos ausentes;
- scanner V3 reproducible baja de **57→52 findings** y **13→12 archivos**;
- `src/inscripcion.jsx` desaparece del resultado V3;
- regresiones AT y AS verdes;
- `git diff --check`;
- scope funcional limitado a `src/inscripcion.jsx`.

El source candidato validado quedó como blob `78a94f6f3b8420027f69ce6d2e545a682ed99da3`.

El guard final `qa_inscripcion_public_safe_errors_cs21a210ax.mjs` toma directamente la preimagen congelada del head #249, verifica su blob y reaplica determinísticamente el patch AX; el resultado debe coincidir byte por byte con el source candidato.

## Límites
- E0: sí.
- E1 source/QA: sí cuando push + matriz PR final estén verdes.
- E2 autenticado/runtime: **NO**.
- `BACKEND CURRENT SNAPSHOT UNVERIFIED`: vigente.
- main: no tocado.
- PROD: no tocado.
- Apps Script/backend: no tocado.
- Drive ACL: no tocado.
- ramas: no borradas.

AX supersede únicamente el hallazgo efectivo de inscripción documentado por AV. El resto de findings AV/V3 continúa abierto y debe seguir tratándose por ruta efectiva, no por reducción mecánica del contador.
