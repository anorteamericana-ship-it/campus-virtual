# F111 — R11-E7 · Estudiante, docente y notas INA (17-oct-2026)

**Estado actual:** navegador Chromium con frontend REAL en API localhost SIMULADA: **PASS**. `--live` contra el Apps Script QA EX04 @3 ya cargado: **PENDIENTE** hasta que operador QA ejecute con su archivo privado local (nunca enviarlo).

## Prueba que acaba de pasar

[GitHub Actions #39095957176](https://github.com/anorteamericana-ship-it/campus-virtual/actions/runs/39095957176):
```
PASS_R11_E7_VISUAL_MOCK_READONLY
e1=4, e2=3, ina_total=87
student=REVIEWED
teacher=CLOSED/PUSHED
requests=5; blocked_write=1
write_endpoints_invoked=false; production_accessed=false
live_backend=false
```

El script Playwright `scripts/qa_f111_r11_e7_live_readonly.mjs` abre el **HTML y paquete real de exámenes del frontend del Campus** desde `localhost` en Chromium. Verifica que el estudiante ficticio tenga examen ya entregado y sin opción de reiniciarlo, que el docente vea dos entregas ya cerradas, abra una revisión protegida, no pueda reenviar nota y que el endpoint de resumen devuelva L18=4/5, L32=3/5 y nota 87/100 INA.

## Seguridad de proxy QA (modo --live)

- Proxy escuchando únicamente `127.0.0.1`. Navegador usa un identificador efímero LOCAL, **nunca** los tokens QA auténticos, almacenados exclusivamente en memoria del proceso Node.
- `--live` lee `%TEMP%\F111_EX04_R10_TOKENS_LOCAL_PRIVATE.json` bajo Windows del operador y verifica Script ID QA y vencimiento. **No imprimir ni adjuntar el archivo**.
- Solo permite 5 funciones declaradas, **todas de lectura**: estudiante `examGetStudentLivePanel`, `getResumenNotasOficialesEstudiante`; docente `examReviewInbox`, `examGetAttempt`, `examGetReview`.
- Cualquier `examCloseReview`, `examPushReviewToNotas`, `examStartAttempt`, otra función o rol anónimo es rechazado EN LOCAL antes de conectar con Apps Script.
- Servidor remoto fijo en el **deployment QA @3 EX04 existente** y redirecciones estrictamente `script.googleusercontent.com` mediante GET sin token. No cambiar Apps Script, ningún `clasp`.
- **Sin capturas de pantalla**, para no crear artefactos con banco/guiones Cambridge del panel docente. La prueba comprueba DOM, no comparte contenido.
- `--mock` CI no consulta Google, y por tanto no demuestra `--live`.

## Instrucciones mínimas para QA live, después de revisar que las sesiones todavía estén vigentes

La ejecución la hace el operador desde un checkout de `campus-virtual`, en la rama `test/f111-r11-e7-frontend-live-readonly-20261017` (se apila sobre el PR #519, sin fusionarlo).

```powershell
git fetch origin test/f111-r11-e7-frontend-live-readonly-20261017
git switch --track origin/test/f111-r11-e7-frontend-live-readonly-20261017
npm install --no-save --ignore-scripts playwright@1.56.1
npx playwright install chromium
node .\scripts\qa_f111_r11_e7_live_readonly.mjs --live
```

Si la rama local E7 ya existe, usar `git switch test/f111-r11-e7-frontend-live-readonly-20261017` y `git pull --ff-only`; nunca repetir `git switch --track` si ya está creada.

**Dictamen esperado:** `PASS_R11_E7_VISUAL_QA_AUTH_READONLY`, notas 4/5, 3/5 y 87/100, 0 escrituras. Ante un error detener, no publicar ni reabrir intentos.

## Límites: no adelantar avance sin evidencia

- La pantalla visual de estudiante/docente que se ensaya es la del **Campus actual**; el resumen 87/100 es un endpoint API real o mock según el modo y **no una certificación de la pantalla Mis Notas del Campus publicado**. Esta conexión integral a Mis Notas debe verificarse independientemente.
- El QA @3 sigue siendo un adaptador de datos sintéticos, distinto de la integración curricular/programación del Campus PROD. Nunca fusionar los PR #519, #520, #64, #65 ni #66 sin autorización.
- Exámenes orales D3: existe `oralSaveDraft`, `oralCloseEvaluacion`, `oralGetEvaluacion`, `oralGetPanelDocente` con validaciones y lecciones 9,17,25,31, pero **faltan ensayos de escritura/cierre y nota oficial con estudiante ficticio en el mismo QA y validación de rúbrica completa**. Por ahora no mover D3 de 30%.
- Progress Check D5: requiere digitalización/aprobación de 32 quizzes por nivel, audio y gatillo por fecha; la evaluación de Progress Check es **comentario pedagógico**, no puntos adicionales a los 100% oficiales INA, y D5 se mantiene al 20% hasta QA verificable.
- Asistencia INA: límite mínimo 85%, ausencias y 16 sesiones I CAN continúan como puerta separada.

**No hacer deploy a producción ni publicar nuevas URL.**
