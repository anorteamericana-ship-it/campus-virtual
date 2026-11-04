# F111 · Primer E2 autenticado read-only y bloqueos reales de staging
**Fecha:** 2026-11-04 (America/Costa_Rica)  
**Estado:** E2 staging BLOQUEADO; producción NO certificada. No ejecutar escrituras para forzar un PASS.

## Evidencia reproducible

- Run [41834476585](https://github.com/anorteamericana-ship-it/campus-virtual/actions/runs/41834476585), `Real QA Authenticated Readonly CS21A210BO`, main SHA `fa2384a650ea2efb3438c8ec7287f6aad2b5d3e9`.
- Artefacto `real-qa-auth-readonly-cs21a210bo-1` contiene `authenticated-report.json`, `authenticated-report.md` y capturas. Conservar solo las conclusiones anonimizadas en documentación pública.
- Conteo del runner: **19 comprobaciones**, P0 **0**, P1 **5**, P2 **0**, P3 **3**. Veredicto: **BLOQUEADO**.
- El job superó los filtros de secretos QA y verificó el marcador nativo `QA_STAGING_CS21A144`. El flujo usa `QA_EXECUTE_WRITES=NO`; no usa contraseñas de producción ni operaciones mutantes.
- Las tres cuentas QA iniciaron sesión a nivel de endpoint, **pero eso no prueba que sus pantallas montaran correctamente**.

## Hallazgos P1 del reporte, sin reinterpretaciones

| # | Área | Resultado exacto | Clasificación / acción |
|---|---|---|---|
| 1 | Student backend `getEstudiante` | HTTP 200, `qa_endpoint_not_allowlisted` | Política staging bloquea lectura; definir contrato de allowlist QA antes de cambiar backend. |
| 2 | Superadmin `getPagosCampus` | HTTP 200, `qa_write_blocked` | Tratar como bloqueo de seguridad deliberado; **NO** elevar permisos ni disparar una llamada mutante. |
| 3 | Student Books & Audio | Runner buscaba literal ES «Libros y Audios» con idioma EN inicial | Error del **selector de test**, no defecto del Campus demostrado; corregir por `data-nav-id=libros_audios_estudiante` y verificar rótulo `Books & Audio`. |
| 4 | Student Books & Audio | `validating=true`, `app_mounted=false` | Investigar bloqueo CampusGate/browser ↔ staging. No declarar navegada ni afirmar fallo de producción. |
| 5 | Teacher Materials mobile | `validating=true`, `app_mounted=false` | Igual: validar token QA, remapeo seguro de requests y carga; no alterar cuentas reales. |

Tres P3 de etiquetas diagnósticas aparecen en teacher/grupos y dos pantallas superadmin; su ausencia no certifica error funcional.

## Alcance de este cambio de QA

Se reemplaza **únicamente** el selector de texto obsoleto en `scripts/real_qa_authenticated_readonly_cs21a210bo.mjs` por `button[data-nav-id="libros_audios_estudiante"]`, comprobando por separado `Books & Audio` en EN. El contrato `scripts/qa_auth_e2_readonly_contract_cs21a210bo.mjs` exige el nuevo selector y rechaza el antiguo. **Se conservan** la prueba nativa de staging, la negación explícita de la URL de producción, el límite `QA_EXECUTE_WRITES=NO` y los cinco hallazgos originales. No se cambian endpoints ni permisos.

## Matriz de avance sin mezclar universos

- E2 staging ejecutado: **1 run / 1**; resultado **BLOQUEADO**, no PASS.
- Casos P1 diagnosticados: **5/5**; resueltos funcionalmente **0/5**, con **1/5 error del harness identificado y parcheado en código pendiente de CI**.
- Rutas bilingües íntegramente certificadas E2: **0/23**, sin cambios.
- Corte académico histórico F111: **16/35 (45,7%)**, sin cambios.
- Último E3 público previamente aprobado: **17/17 recursos**; independiente de esta prueba staging.

## Próximas puertas de salida

1. Pasar CI del contrato E2 y fusionar el cambio de selector; **no repetir exactamente el mismo E2 de staging mientras el backend bloquee los dos endpoints**.
2. Verificar el contrato del backend QA con responsable Apps Script y decidir si `getEstudiante` puede habilitarse de forma estrictamente read-only; `getPagosCampus` debe permanecer bloqueado hasta conocer su semántica.
3. Diagnosticar los dos estados `Validando tu sesión` en navegador QA sin leer ni publicar tokens.
4. Con navegador originario y estudiante autorizado, ejecutar E2 de **producción solo lectura**, EN/ES y móvil con evidencia sin PII.
5. Registrar hallazgos y commits en [issue #499](https://github.com/anorteamericana-ship-it/campus-virtual/issues/499); **no** subir el porcentaje 0/23 con controles sintéticos.

## Garantías
Sin editar Apps Script, datos financieros, notas, asistencia, matrículas, pagos, PDFs, control de acceso, token de sesión o bases de estudiantes. El checkout antiguo del equipo remoto permanece intacto.
