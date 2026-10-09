# CAMPUS VIRTUAL · Estado de producción

Última verificación operativa de F103: **2026-10-09 14:05 -06:00**. Las secciones históricas del corte CONAPE V1 @436 permanecen como evidencia de esa fecha.

## Estado actual · F103 docente (2026-10-09)

- **Backend PROD:** deployment estable `AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ` en **@460**, misma URL. Rollback disponible **@459**; snapshot inmutable de @459 guardado fuera del repositorio.
- **Integridad:** `clasp pull --versionNumber 460` generó 32 archivos; comparación SHA-256 con candidato F103: **32/32 idénticos, 0 diferencias**. 30 JavaScript pasaron `node --check`; manifiesto JSON válido.
- **Alcance backend:** `guardarAsistenciaBorradorF100` acepta `modo=BORRADOR` para avances parciales mientras la sesión permanece abierta; control de revisión/lock y autorización docente. `getDocenteContactosF103` solo devuelve edad, teléfono y correo de alumnos pertenecientes al grupo autorizado; no entrega fecha de nacimiento.
- **Pruebas backend:** QA local F103 (autoguardado, conflictos de revisión, contactos, permisos) PASS; deployment @460 confirmado en `clasp deployments`, HTTP público 200 y POST anónimo de contactos devuelve `{ok:false,error:sesion_invalida}`.
- **Frontend PROD:** PR **#483** fusionado en main, commit `f1dee806471e2dafcb3163d6ce8310f09f559b99`; Pages **SUCCESS**. Dominio público sirve `src/app.jsx` con cache-bust F103 y `src/teacher_views.jsx` con llamada `getDocenteContactosF103`. Mis grupos muestra edad/teléfono/correo, y el panel usa autoguardado parcial con 900 ms de debounce.
- **Evidencia pendiente:** prueba autenticada del docente con grupo real y confirmación de recuperación de borrador al reabrir; ensayo de cierre solo con datos de prueba autorizados; observar error intermitente en navegador. No declarar `FULL_E2E` ni diagnóstico causal del fallo intermitente.

### Nota sobre el historial

El bloque siguiente documenta el **corte histórico @436 de CONAPE Prospectación V1 (2026-10-04)** y no debe confundirse con la versión productiva vigente @460.

## Apps Script PROD

- Script ID: `1kV4wKnD_OU5DPQSawScjPsUbo1MOg_rAHbtpYupSMPkqywIVSQwdV4y2`
- Deployment ID estable: `AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ`
- URL estable: `https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec`
- Version desplegada: **@436**
- Version estable anterior / rollback inmediato conocido-bueno: **@434**. La V1 no usa @435 como rollback operativo sin una verificación separada.
- Release actual: **CONAPE Prospectación V1 · importador CSV + estado actual + eventos persistentes + semáforo 7/14 + panel de Ventas**.
- Reconciliacion backend: **campus_backend/main = 4c5549150cf1fb2cb26cc49db077b2744cf0e6f1**; PR backend **#7** implementó V1 y PR **#8** preservó desembolsos de prospectos vistos por primera vez ya avanzados.
- Promocion backend: el Deployment ID estable fue verificado en **@436**. Readback inmutable: **28/28 archivos**, **26 JS**, **0 drift normalizado**, sintaxis PASS y SHA agregado **1c5c14878ac692d511ee8e6b02da25bcb2759f0bb1ba26285bb7da75276d585f**.
- Frontend vigente: PR **#405** publicó el panel CONAPE Prospectación V1; main productivo verificado: **b0d208730ebe7bd6b87826e458204ad1a6d04315**. Pages SUCCESS y el dominio real sirve ventas_conape_prospectacion_v1.jsx?v=CPV1-20261004.
- Verificacion HTTP/runtime V1: **PASS**. Root Apps Script HTTP **200**; getConapeProspectacionVentas, previsualizarConapeProspectacionCsv e importarConapeProspectacionCsv rechazan acceso anónimo con sesion_requerida.
- Verificación autenticada V1: **PASS para línea base y panel**. Superadmin previsualizó el CSV real de CONAPE con **59 registros**, baseline=true y **0 movimientos persistentes**; luego importó la línea base. CONAPE_PROSPECTACION_ACTUAL quedó con **59 filas** y CONAPE_PROSPECTACION_EVENTOS con **0 eventos**, evitando alertas históricas falsas. El panel filtrado por ASESOR_REF mostró correctamente **1** registro para Camila Solis.
- Límite de evidencia V1: todavía **no ha ocurrido un movimiento CONAPE real posterior a la línea base** para observar en PROD su persistencia y envejecimiento verde 0-6 / amarillo 7-13 / rojo 14+. Esa parte queda cubierta por QA sintético y código, pero no se declara E2E real hasta que ocurra un cambio externo. **FULL_E2E sigue false**.
- Excepción procedimental C2-R10: el `clasp push` normal devolvió `Skipping push`; se terminó usando `clasp push --force` desde la carpeta temporal aislada que contenía únicamente el candidato aprobado. El pull post-push dio **0 drift** contra ese candidato. **Esto no modifica la regla general de no usar `--force`; queda registrado como excepción histórica, no como procedimiento recomendado.**

### CONAPE Prospectación V1 · evidencia de corte @436

- Fuente operativa: reporte Oracle APEX de Prospectación Reclutador con Academia Norteamericana + Plataforma de Servicios + Rows=All.
- CSV real observado: **59 prospectos, 14 columnas**, codificación Windows-1252. El importador valida por encabezado y tipo; no depende de posición.
- Estado actual persistente: CONAPE_PROSPECTACION_ACTUAL, **59 filas** después de la línea base del 2026-10-04 14:45:15 -06:00.
- Eventos persistentes: CONAPE_PROSPECTACION_EVENTOS, **0 filas** inmediatamente después de la línea base; esto es intencional para no convertir historia previa en alertas nuevas.
- Semáforo contractual: **NUEVO 0-6 días, PENDIENTE 7-13 días, VENCIDO 14+ días**, basado en DETECTADO_EN, no en cantidad de refresh.
- Alcance Ventas: getConapeProspectacionVentas filtra rol ventas por PROSPECTOS.ASESOR_REF; admin/superadmin puede usar scope de asesor.
- Separación de dominios: Estado CONAPE externo se muestra separado de ETAPA del Campus; V1 no sobreescribe ETAPA automáticamente.
- El WS viejo GetEstudiantesFinanciados se conserva como segunda fuente; V1 no lo reemplaza ni lo modifica.
- Reclutar Prospectos / automatización APEX **no forma parte de V1**.

### Incidente OAuth histórico resuelto durante el release @419

Después del primer movimiento a @419, login y verificación de cédula devolvieron un error real de backend:

`No cuentas con el permiso para llamar a SpreadsheetApp.openById`

El rollback temporal a @417 reprodujo el mismo error, lo que descartó una regresión específica de @419. `appsscript.json` sí contenía el scope `https://www.googleapis.com/auth/spreadsheets`.

Causa operativa: faltaba/requería renovarse la autorización OAuth del usuario que despliega el Web App (`executeAs: USER_DEPLOYING`). Se ejecutó una función read-only segura desde el editor de Apps Script para forzar la pantalla de autorización y se aprobaron los scopes. Después de eso el Campus volvió a autenticar correctamente. El deployment volvió a @419 y el formulario público real avanzó hasta Paso 5.

Regla futura: si `SpreadsheetApp.openById` devuelve falta de permiso y el error persiste al volver de versión, revisar **OAuth del usuario desplegador** antes de cambiar código o datos.

## Frontend público

- Rama productiva: `main`.
- Frontend productivo publicado/verificado por Pages: **b0d208730ebe7bd6b87826e458204ad1a6d04315** (main, merge de PR #405).
- PR **#395**: Mi Perfil quedó exclusivamente en `#dashboard`; `#perfil` y `#perfil_estudiante` resuelven a dashboard; el estado azul del menú se sincroniza con la ruta visible y contempla clic repetido + Atrás/Adelante.
- PR **#396**: elimina la interferencia residual de `additional_resources_panel_cs21a68.jsx` sobre el sidebar estudiantil; «Recursos adicionales» conserva correctamente el estado azul.
- PR **#398**: C2-R13 corrigió la reapertura privada de matrícula firmada histórica en Ventas; tuvo QA autenticado real PASS antes de este corte.
- PR **#400**: C2-R14 conectó Cédula frente, Cédula dorso y Título a entrega privada y aplicó el ciclo de firma de una sola carga para Ventas.
- PR **#401**: C2-R14C agrega a Admin apertura de la última matrícula firmada y carga de nuevas versiones conservando históricos; no duplica el generador de matrícula.
- PR **#402**: mantenimiento de CI/guards descendant-safe; **sin cambio de runtime**.
- PR **#405**: CONAPE Prospectación V1 en Ventas: panel persistente, estado actual, semáforo 7/14 y carga CSV restringida a admin/superadmin.
- Verificación de publicación V1: GitHub Pages **SUCCESS** sobre b0d20873; el dominio real sirve ventas.html con la referencia CPV1 y src/ventas_conape_prospectacion_v1.jsx HTTP 200 con build CONAPE_PROSPECTACION_V1_UI_20261004.
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
