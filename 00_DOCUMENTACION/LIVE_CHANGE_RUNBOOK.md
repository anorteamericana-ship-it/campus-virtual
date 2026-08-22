# CAMPUS VIRTUAL · Runbook de cambios en vivo

Objetivo: que una corrección ordinaria no obligue a redescubrir arquitectura, deployment, versión, comandos, permisos ni procedimiento de rollback.

## 0. Antes de tocar código

1. Leer `AGENTS.md`.
2. Leer `00_DOCUMENTACION/PRODUCTION_STATE.md`.
3. Consultar GitHub y confirmar el SHA actual de `main`.
4. Clasificar el cambio:
   - **LIVE HOTFIX**: frontend visible, texto, tildes, iconos, CSS, enlace, UX o lógica JS pequeña de navegador;
   - **RELEASE CONTROLADO**: Apps Script, Apollo, autenticación, OAuth/scopes, datos, pagos, CONAPE, seguridad, integraciones o lógica crítica;
   - **mixto**: contrato compartido frontend ↔ backend;
   - **datos/configuración**: Sheets/Drive/catálogos sin cambio de código.
5. Identificar el flujo exacto: `pantalla → archivo frontend → llamada → endpoint/helper → hoja/Drive`.
6. Trabajar en una rama pequeña. Nunca escribir directo en `main` si el ruleset lo impide.

## 1. LIVE HOTFIX · autorización permanente

Frase gatillo del usuario:

`LIVE HOTFIX: <corrección>`

Esa frase constituye autorización previa para que ChatGPT lleve un cambio **frontend pequeño y reversible** hasta la página pública sin volver a pedir autorización para cada paso de rama → PR → checks obligatorios → merge.

### Alcance autorizado

- HTML/JSX/JS/CSS que se entrega al navegador;
- texto, ortografía, tildes y mojibake;
- iconos/símbolos;
- enlaces;
- estilos/responsive;
- cache-bust;
- lógica JS pequeña y evidente que no cambie permisos ni datos;
- UX no crítica.

### Fuera de LIVE HOTFIX

Requiere **RELEASE CONTROLADO**:

- Apps Script / `Code.gs` / `Código.js`;
- Apollo/Sheets/Drive como fuente de datos;
- login/autenticación/sesiones;
- permisos OAuth o `oauthScopes`;
- pagos, CONAPE, matrículas, notas o datos reales;
- ACL/privacidad/seguridad;
- endpoints o contratos backend;
- cambios estructurales o de migración.

### Reglas del hotfix

1. partir del `main` vigente;
2. delta mínimo y reversible;
3. no crear copias/ZIPs/handoffs paralelos;
4. respetar protección de `main`; si exige PR/checks, usarlos automáticamente;
5. revisar la superficie pública después del merge;
6. escanear antes del merge por mojibake y sustituciones sospechosas: `?`, `??`, `�`, `Ã`, `Â`, tildes rotas y caracteres reemplazados;
7. cache-bust cuando el navegador pueda conservar un asset viejo;
8. si la corrección termina necesitando backend/datos/permisos, detener LIVE HOTFIX y reclasificar a RELEASE CONTROLADO.

### Lección PR #119

El Paso 5 llegó a producción con literales dañados como `Documentaci?n`, `Atr?s` y `??`. El navegador no era la causa: los caracteres estaban así en source. El hotfix corrigió la vista de forma inmediata y forzó cache-bust.

Deuda técnica: reparar luego los literales canónicos de `src/inscripcion.jsx` y retirar el parche runtime cuando se haga una limpieza frontend normal.

## 2. RELEASE CONTROLADO · Apps Script/backend

### Identidad productiva

Consultar `config/apps-script-production.json` y confirmar contra `clasp deployments` antes de cualquier escritura.

Producción es el **Deployment ID estable apuntando a una versión numérica inmutable**. El HEAD remoto de Apps Script no equivale necesariamente a producción.

### PowerShell / clasp en Windows

PowerShell puede bloquear `clasp.ps1` por ExecutionPolicy. Ruta que funcionó:

```powershell
$claspCmd = Join-Path $env:APPDATA "npm\clasp.cmd"
& $claspCmd status
& $claspCmd deployments
```

Para crear una versión inmutable:

```powershell
& $claspCmd version "DESCRIPCION DEL RELEASE"
```

No usar `clasp push --force`.
No usar `clasp push --watch` como mecanismo de release: deja el proceso escuchando cambios y agrega riesgo innecesario.

### Flujo obligatorio

1. verificar sesión `clasp` y CLI;
2. confirmar Script ID y Deployment ID exactos;
3. confirmar versión remota actual;
4. respaldar HEAD remoto y versión realmente desplegada;
5. construir candidato desde la versión desplegada o una fuente con paridad demostrada;
6. comparar hashes/diff/manifest y listar archivos cambiados;
7. abortar si el alcance excede lo declarado;
8. validar UTF-8, sintaxis y `appsscript.json` antes de `push`;
9. hacer `push` únicamente del candidato exacto verificado;
10. crear una nueva versión numérica;
11. editar **el mismo Deployment ID** y apuntarlo a la nueva versión;
12. verificar HTTP/runtime;
13. ejecutar una prueba funcional real del flujo modificado;
14. actualizar `PRODUCTION_STATE.md` y `config/apps-script-production.json`.

### Mover el deployment

No depender de una URL directa `/deployments`; devolvió 404.

Usar:

`Apps Script editor → Implementar → Administrar implementaciones → deployment existente → Editar → versión nueva → Implementar`

No crear otro deployment para una liberación ordinaria si el ID estable puede conservarse.

### Probe HTTP conocido

```powershell
$prodUrl = "https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec"
$r = Invoke-WebRequest -Uri $prodUrl -Method Get -UseBasicParsing
Write-Host "HTTP:" $r.StatusCode
Write-Host "FINAL URL:" $r.BaseResponse.ResponseUri.AbsoluteUri
```

Esperado: `HTTP: 200`.

La respuesta inicial `302 Found` hacia `script.googleusercontent.com` es comportamiento normal de Apps Script Web Apps. No diagnosticarla como fallo por sí sola.

## 3. Fallo común crítico · OAuth/scopes Apps Script

Síntoma real observado:

`No cuentas con el permiso para llamar a SpreadsheetApp.openById`

Puede aparecer como un falso “cédula o contraseña incorrectos” si el frontend oculta el error del backend.

### Diagnóstico correcto

1. mirar **Response** de la llamada `/exec`; no confiar solo en el mensaje visible de login;
2. confirmar en Apps Script → Ejecuciones qué versión ejecutó `doPost`;
3. revisar `appsscript.json` y confirmar scope requerido, por ejemplo:
   `https://www.googleapis.com/auth/spreadsheets`;
4. si volver a una versión anterior reproduce exactamente el mismo error, sospechar autorización OAuth del **usuario desplegador**, no regresión de código;
5. ejecutar desde el editor una función **read-only segura** que use el servicio requerido para forzar `Revisar permisos`;
6. autorizar con la misma cuenta que despliega el Web App;
7. volver a probar login/lectura real antes de mover código.

Regla: un rollback de versión **no revierte** el estado de autorización OAuth del proyecto/cuenta.

## 4. Cambios mixtos frontend ↔ backend

Los valores compartidos no deben mantenerse como enums aislados sin una prueba de compatibilidad.

Ejemplo histórico:
- frontend guardaba `LAPTOP_360` / `LAPTOP_319`;
- backend reconocía aliases legacy `PREMIUM` / `BASICO`;
- la UI mostraba equipo válido pero el backend lo rechazaba.

Para todo enum/estado/tipo/rol/ruta revisar:
- productor;
- persistencia;
- lector frontend;
- lector backend;
- validadores;
- pruebas;
- compatibilidad histórica.

## 5. Fuente de verdad / controladores

Orden para orientarse en una sesión nueva:

1. GitHub `main` vigente;
2. `AGENTS.md`;
3. `00_DOCUMENTACION/PRODUCTION_STATE.md`;
4. este `LIVE_CHANGE_RUNBOOK.md`;
5. `config/apps-script-production.json` si toca backend;
6. Issue/PR canónico del módulo;
7. working tree local solo después de inspeccionarlo.

No usar un ZIP viejo, una copia de Drive o memoria de chat como fuente de verdad si contradice GitHub/runtime verificado.

## 6. Evidencia mínima de cierre

Registrar:
- rama/commit/PR;
- archivos cambiados;
- pruebas estáticas/sintéticas;
- prueba autenticada cuando aplique;
- versión Apps Script desplegada cuando aplique;
- prueba funcional real;
- rollback;
- estado final de producción;
- limitaciones todavía no probadas.

No declarar `FULL_E2E=PASS` si solo se llegó a un paso intermedio o si la prueba fue exclusivamente sintética/PowerShell.

## 7. Regla de memoria operativa

Cuando aparezca un fallo nuevo que requiera más de una sesión para diagnosticar:

1. registrar **síntoma → causa → prueba que lo distinguió → reparación → prevención** en este runbook o en la skill dueña;
2. no guardar credenciales/tokens;
3. actualizar `PRODUCTION_STATE.md` si cambió runtime;
4. actualizar el Issue/PR canónico si cambia el estado del módulo.

La meta es que la siguiente IA no “redescubra” Script IDs, deployments, comandos ni fallos que ya pagamos una vez.
