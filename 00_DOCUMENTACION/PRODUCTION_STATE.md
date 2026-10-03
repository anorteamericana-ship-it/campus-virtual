# CAMPUS VIRTUAL · Estado de producción

Última verificación operativa: **2026-10-03 16:10 -06:00**.

## Apps Script PROD

- Script ID: `1kV4wKnD_OU5DPQSawScjPsUbo1MOg_rAHbtpYupSMPkqywIVSQwdV4y2`
- Deployment ID estable: `AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ`
- URL estable: `https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec`
- Version desplegada: **@432**
- Version estable anterior / rollback inmediato: **@431**.
- Release actual: **C2-R12 · Mi Perfil/saludo + inventario dinamico de certificados + Programa Completo/INA**.
- Reconciliacion backend: **campus_backend/main = f5cd1e8317c77a5c8306c739081bae8cc7496c30**, PR #3 mergeado.
- Promocion backend: clasp push normal PASS, sin --force; readback remoto 27/27, 25 JS, 0 drift y sintaxis PASS; el mismo Deployment ID estable apunta a **@432**.
- Frontend C2-R12: PR **#392** mergeado en ddc70655543da160a539faeae7e71740a00e2fe4; Pages y checks de main PASS; el sitio publico sirve los cache-busters C2-R12.
- Verificacion HTTP/runtime: **PASS** para root de Apps Script y rutas publicas comprobadas; las descargas privadas siguen rechazando sin sesion con sesion_requerida.
- Limite de evidencia: **falta repetir QA autenticado post-promocion en navegador para Mi Perfil, saludo y quinto certificado; no declarar FULL_BROWSER_E2E ni FULL_E2E todavia**.
- Excepción procedimental C2-R10: el `clasp push` normal devolvió `Skipping push`; se terminó usando `clasp push --force` desde la carpeta temporal aislada que contenía únicamente el candidato aprobado. El pull post-push dio **0 drift** contra ese candidato. **Esto no modifica la regla general de no usar `--force`; queda registrado como excepción histórica, no como procedimiento recomendado.**

### Incidente OAuth histórico resuelto durante el release @419

Después del primer movimiento a @419, login y verificación de cédula devolvieron un error real de backend:

`No cuentas con el permiso para llamar a SpreadsheetApp.openById`

El rollback temporal a @417 reprodujo el mismo error, lo que descartó una regresión específica de @419. `appsscript.json` sí contenía el scope `https://www.googleapis.com/auth/spreadsheets`.

Causa operativa: faltaba/requería renovarse la autorización OAuth del usuario que despliega el Web App (`executeAs: USER_DEPLOYING`). Se ejecutó una función read-only segura desde el editor de Apps Script para forzar la pantalla de autorización y se aprobaron los scopes. Después de eso el Campus volvió a autenticar correctamente. El deployment volvió a @419 y el formulario público real avanzó hasta Paso 5.

Regla futura: si `SpreadsheetApp.openById` devuelve falta de permiso y el error persiste al volver de versión, revisar **OAuth del usuario desplegador** antes de cambiar código o datos.

## Frontend público

- Rama productiva: `main`.
- Baseline de codigo frontend publicado para C2-R12: ddc70655543da160a539faeae7e71740a00e2fe4 (PR #392).
- Verificacion de publicacion C2-R12: GitHub Pages success, checks de main success, campus.html y login.html responden HTTP 200 y contienen los nuevos cache-busters. La verificacion funcional autenticada en navegador sigue pendiente.
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
