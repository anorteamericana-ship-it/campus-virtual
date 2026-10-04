# CAMPUS VIRTUAL · Estado de producción

Última verificación operativa: **2026-10-04 08:45 -06:00**.

## Apps Script PROD

- Script ID: `1kV4wKnD_OU5DPQSawScjPsUbo1MOg_rAHbtpYupSMPkqywIVSQwdV4y2`
- Deployment ID estable: `AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ`
- URL estable: `https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec`
- Version desplegada: **@434**
- Version estable anterior / rollback inmediato: **@433**.
- Release actual: **C2-R14C · documentos privados de Ventas + ciclo de matrícula firmada + versionado Admin**.
- Reconciliacion backend: **campus_backend/main = faaa8e1893bcbacbf7b35cdaceb0746a3d5f5217**; PR backend #5 y #6 mergeados.
- Promocion backend: clasp push normal PASS, sin --force; readback remoto HEAD **27/27**, **25 JS**, **0 drift**, sintaxis PASS y SHA agregado **9fa8e16eb462ccec60768aaa01c89cc343943d569941227b300b3e36b638a1fb**. Se creó la versión inmutable **@434** y el mismo Deployment ID estable fue actualizado por la UI de Apps Script de @433 a **@434**.
- Frontend C2-R14/C2-R14C: PR **#400** publicó documentos privados de Ventas y ciclo de matrícula firmada; PR **#401** publicó en Admin Abrir última firmada + Subir nueva versión firmada; main productivo vigente: **a7e7995bcb4eda90dbea0e1ad81f83fb4189977e**. PR **#402** corrigió guards CI obsoletos sin cambiar runtime.
- Verificacion HTTP/runtime C2-R14C: **PASS**. clasp deployments confirma el Deployment ID estable en **@434**; root Apps Script HTTP **200**; descargarDocumentoProspectoPrivado, descargarMatriculaFirmadaPrivada, descargarDocumentoExtraPrivado y descargarComprobantePagoPrivado rechazan acceso anónimo con sesion_requerida.
- Verificación autenticada previa conservada: C2-R12/C2-R13 tuvo PASS real para Mi Perfil/dashboard, navegación, inventario de certificados, Programa Completo, documento adicional de Ventas y reapertura privada de matrícula firmada histórica.
- Límite de evidencia del corte @434/#401: la sesión autenticada del Campus expiró al recargar durante el QA post-release y cayó al login. Por eso **no marcar QA autenticado post-@434/#401 como PASS** y **no declarar FULL_BROWSER_E2E ni FULL_E2E**. La inscripción controlada completa indicada más abajo también sigue pendiente.
- Excepción procedimental C2-R10: el `clasp push` normal devolvió `Skipping push`; se terminó usando `clasp push --force` desde la carpeta temporal aislada que contenía únicamente el candidato aprobado. El pull post-push dio **0 drift** contra ese candidato. **Esto no modifica la regla general de no usar `--force`; queda registrado como excepción histórica, no como procedimiento recomendado.**

### Incidente OAuth histórico resuelto durante el release @419

Después del primer movimiento a @419, login y verificación de cédula devolvieron un error real de backend:

`No cuentas con el permiso para llamar a SpreadsheetApp.openById`

El rollback temporal a @417 reprodujo el mismo error, lo que descartó una regresión específica de @419. `appsscript.json` sí contenía el scope `https://www.googleapis.com/auth/spreadsheets`.

Causa operativa: faltaba/requería renovarse la autorización OAuth del usuario que despliega el Web App (`executeAs: USER_DEPLOYING`). Se ejecutó una función read-only segura desde el editor de Apps Script para forzar la pantalla de autorización y se aprobaron los scopes. Después de eso el Campus volvió a autenticar correctamente. El deployment volvió a @419 y el formulario público real avanzó hasta Paso 5.

Regla futura: si `SpreadsheetApp.openById` devuelve falta de permiso y el error persiste al volver de versión, revisar **OAuth del usuario desplegador** antes de cambiar código o datos.

## Frontend público

- Rama productiva: `main`.
- Frontend productivo publicado/verificado por Pages: **a7e7995bcb4eda90dbea0e1ad81f83fb4189977e** (main, merge de PR #401 sobre PR #402).
- PR **#395**: Mi Perfil quedó exclusivamente en `#dashboard`; `#perfil` y `#perfil_estudiante` resuelven a dashboard; el estado azul del menú se sincroniza con la ruta visible y contempla clic repetido + Atrás/Adelante.
- PR **#396**: elimina la interferencia residual de `additional_resources_panel_cs21a68.jsx` sobre el sidebar estudiantil; «Recursos adicionales» conserva correctamente el estado azul.
- PR **#398**: C2-R13 corrigió la reapertura privada de matrícula firmada histórica en Ventas; tuvo QA autenticado real PASS antes de este corte.
- PR **#400**: C2-R14 conectó Cédula frente, Cédula dorso y Título a entrega privada y aplicó el ciclo de firma de una sola carga para Ventas.
- PR **#401**: C2-R14C agrega a Admin apertura de la última matrícula firmada y carga de nuevas versiones conservando históricos; no duplica el generador de matrícula.
- PR **#402**: mantenimiento de CI/guards descendant-safe; **sin cambio de runtime**.
- Verificación de publicación: GitHub Pages **SUCCESS** sobre a7e7995b; el dominio real sirve src/app.jsx con cache-bust F98.4Z6C2R14C1 y src/admin_students.jsx HTTP 200 con controles de matrícula firmada, endpoint privado, versionado y generador canónico. QA autenticado post-release pendiente por sesión expirada.
- PR **#394** queda supersedido por #395; no usar su ruta estudiantil `PerfilView` como referencia funcional.
- PR #118: mergeado; scanner/documentos CONAPE publicados.
- PR #119: mergeado; hotfix visual de tildes/símbolos del Paso 5 + cache-bust.
- PR #115: mergeado después; cambia únicamente documentación/configuración/skills de operación y auditoría, **sin modificar el comportamiento del frontend público**.
- La página pública de inscripción fue abierta en incógnito y alcanzó Paso 5.

No usar un SHA de documentación posterior como prueba de una nueva validación funcional del navegador. Registrar por separado el `main` vigente y el último commit de comportamiento realmente probado cuando difieran.

### Limitación que permanece abierta

Todavía falta una **inscripción controlada completa desde el formulario visual real en PROD**, con envío de frente + dorso + título y verificación posterior de que los tres archivos y `documento_identidad_solicitante.pdf` quedaron privados. Hasta esa prueba no declarar `FULL_BROWSER_E2E=PASS`.

## English LAB · estado de producto

- Memory Match: **FROZEN_DEFERRED_NON_BLOCKING**.
- Memory Match volvió a responsabilidad técnica de ChatGPT, pero no forma parte del camino crítico del cierre actual y no debe reabrirse por iniciativa del agente.
- Los PR #81, #82 y #83 son históricos/evidencia; no son requisitos del release.
- Cierre vigente: Sentence Order + Hangman + Quiz Time + Word Search + shell/routing/mobile.
- Quiz Time: frontend `MITIGATED_CLIENT_SIDE`; Issue #80 mantiene pendiente la idempotencia backend/`attempt_id`.
- El Issue #78 vigente es la fuente canónica para el próximo chat de English LAB.

## GitHub como fuente de verdad

Para cambios de código del Campus, **GitHub es la fuente de verdad de desarrollo**. Drive puede conservar respaldos y artefactos operativos, pero no decide qué código está vigente.

Para Apps Script productivo, la fuente de verdad de runtime es el **Deployment ID estable + versión numérica desplegada**, verificados mediante sesión `clasp` autenticada y/o verificación funcional. El HEAD remoto de Apps Script puede contener cambios no publicados y no equivale a producción por sí solo.

## Regla de actualización

Actualizar este documento y `config/apps-script-production.json` cuando exista evidencia suficiente de:

1. deployment remoto verificado;
2. versión numérica inmutable conocida;
3. el mismo Deployment ID apuntando a esa versión;
4. prueba funcional correspondiente cuando el cambio afecte un flujo real.

## Accesos operativos útiles

Editor Apps Script PROD:
`https://script.google.com/home/projects/1kV4wKnD_OU5DPQSawScjPsUbo1MOg_rAHbtpYupSMPkqywIVSQwdV4y2/edit`

No depender de una URL `/deployments`: devolvió 404 en este proyecto. Usar desde el editor:
`Implementar → Administrar implementaciones`.

## Prohibiciones

- No hacer `clasp push --force`.
- No usar `clasp push --watch` para una liberación ordinaria.
- No desplegar un `Code.gs`/`Código.js` completo viejo sobre una fuente acumulada nueva para cambiar una sola función.
- No usar copias locales antiguas para preparar producción.
- No crear otro Deployment ID para una corrección ordinaria si el existente puede moverse de forma controlada.
- No guardar contraseñas, tokens, cookies ni credenciales en este archivo o en el JSON de configuración.
