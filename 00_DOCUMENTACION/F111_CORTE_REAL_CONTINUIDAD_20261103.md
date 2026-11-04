# F111 — Corte comprobable, 19 casillas pendientes y continuidad
**Fecha de corte:** 03-nov-2026 (America/Costa_Rica), después de hotfix #717 y #718.
**CORTE INA 0826 ACTUALIZADO (03-nov, 22:31+ CR):** [contingencia INA 0826, nueve criterios de alistamiento (65,9%), 18 archivos, matriz P0 y continuidad](F111_CONTINGENCIA_INA_0826_CORTE_20261103.md). **Este 65,9% NO modifica 16/35 F111.** Los enlaces privados de estudiantes permanecen exclusivamente en el índice de Drive `CONTROL 0826`.

**Fuente única de seguimiento:** [issue F111 #499](https://github.com/anorteamericana-ship-it/campus-virtual/issues/499). **Documento de snapshot**, no autorización para ejecutar cambios de datos. Atribuir siempre fecha de evidencia a cada afirmación.
**Regla principal:** no sumar porcentajes de distintas bases; `MERGED`, `CI PASS`, `Pages PASS`, `origen HTTP PASS`, `E2 sesión autenticada` y `E4 escritura aislada` son estados distintos. Nadie debe reinterpretar un PASS sintético como aceptación académica.

## 1. Tablero con denominadores

| Indicador | Numerador / denominador | Resultado | Calidad del dato y limitaciones |
|---|---:|---:|---|
| Matriz F111 académica formal | 16/35 | **45,7%** | **Histórico último corte**, NO nueva auditoría completa tras #717/#718; faltan 19 hitos para certificación. |
| Faltantes de esa matriz | 19/35 | **54,3%** | Casillas NO cerradas; el inventario de 35 no equivale a todo el Campus. |
| Hotfixs solicitados en este corte | 2/2 | **100%** | PR #717 y #718 fusionadas a `main`, CI y recursos publicados/verificados; **no** equivale a dos hitos académicos aprobados. |
| Superficie contador asistencia | 3/3 contextos | **100% de integración/publicación de código** | Docente, admin/superadmin y estudiante. Requiere E2 en sesión real y contrato I CAN por origen; no equivale a **100% funcional**. |
| Prueba autenticada del contador | 0/3 contextos certificados | **0% E2 documentado** | No hay evidencia de sesión real en docente, admin y alumno que verifique estados amarillo/rojo; no significa que esté roto. |
| Validaciones PR #717 y #718 | 21/21 + 15/15 | **100% CI en los dos HEAD** | 36 ejecuciones de workflow (incluidas suites comunes), NO son 36 funcionalidades ni evidencia de Apps Script. |
| Bilingüismo: entradas principales docente/alumno | 0/23 rutas **íntegramente** certificadas EN/ES E2 | **0% certificación integral** | Inventario parcial de **9 estudiante +14 docente** (con alias); no incluye auditoría completa de todos los roles admin/ventas. |
| Traducción de textos total | sin inventario de cadenas/estados por pantalla | **N/D** | Estimación histórica gerencial **15–25% (~20%)** NO es métrica técnica reproducible; NO publicar 25% como avance certificado. |
| Cierre académico íntegro campus | sin catálogo total de flujos + aceptación E2/E4 | **N/D** | El 45,7% solo describe el subplan F111 de exámenes/seguimiento, no un % global de todo el sistema. |

**Entregas verificadas en el último corte de esta conversación:** #717 merge `a021db40b46a3e3d882e33c3e0b4810c7371b33c` — Pages run `41748674167`, 8 assets exactos bajo el dominio oficial; #718 merge `c539ed01751b0a7f2d7d7ba844b5c8a4ca4640c6` — Pages run `41749930481`, 4 assets exactos bajo el dominio oficial. El HTML oficial difiere de Pages en una única línea inyectada por Cloudflare Insights. La verificación es de bytes/HTTP, **no de render autenticado**. Fuente ampliada: comentarios finales de #499 `#issuecomment-6619445973` y `#issuecomment-6619505471`.

## 2. Desglose histórico 16/35: conservar estos denominadores
| Área | Cerrados | Total | Pendientes |
|---|---:|---:|---:|
| Historial oral | 2 | 4 | **2** |
| Reglas INA / SIN INA | 2 | 4 | **2** |
| Notas de orales | 2 | 4 | **2** |
| PDF y respaldos orales | 2 | 4 | **2** |
| Historial de escritos | 1 | 4 | **3** |
| Vistas previas | 3 | 5 | **2** |
| Progress Checks/quizzes | 2 | 5 | **3** |
| Unificación visual | 2 | 5 | **3** |
| **Total** | **16** | **35** | **19** |

### 2A. Lista ejecutable de 19 verificaciones de cierre
**Precisión metodológica:** los IDs siguientes son **IDs operativos NUEVOS de aceptación para las 19 casillas pendientes por área**. NO afirmar que reproducen literalmente las etiquetas de los 35 ítems originales sin cotejar esa matriz íntegra. Cada fila cerrará **una casilla solo** después de evidencia E2/E3/E4 correspondiente y confirmación con la matriz madre. No duplicar números por mejoras transversales.

| ID | Área | Falta concreta y dependencia | Prueba de aceptación / evidencia mínima |
|---|---|---|---|
| HO-3 | Historial oral | `oralSaveDraft` de borrador existente falla `sesion_oral_no_activa` en clase ya cerrada en CORE @487. | Backend privado permite **solo** modificar BORRADOR existente con token docente/grupo, mantiene ORAL_ID y cierre de sesión intactos; E2 2 alumnos, readback persistente, 0 cambios de nota/PDF oficiales. |
| HO-4 | Historial oral | Recuperación consistente en docente, incluida navegación entre alumnos, cambios sin guardar y PDFs existentes. | Reabrir dos borradores y un PDF final con alumno/grupo correctos; los datos no guardados NO se presentan como confirmados; E2 captura sin PII. |
| RI-3 | Reglas INA | Cierre APR/REP/certificado debe comprobar 85%, máximo 4 faltas curso y 2 I CAN, con falta de dato distinto de cero. | Casos frontera **28/32 vs 27/32** y **14/16 vs 13/16** INA; logs autorizados, previsualización y rechazo de cierre no elegible; no ejecutar escritura real de QA. |
| RI-4 | Reglas SIN INA | Fuente canónica `GRUPOS.PROGRAMA` por nivel/intento, asistencia ordinaria 70% separada de límites INA; confirmar 05-26 y 06-26 SIN INA en Apollo, proformas, total financiado y Campus. | E2 de grupo/no INA + intento/horas, 16/32 encuentros y prorrateo por horas; ningún rótulo INA ni proforma errónea. Probar sin cobrar ni alterar datos reales. |
| NO-3 | Notas orales | Grupo B1-LM69-C2-0526: último inventario **17 orales = 16 BORRADOR + 1 PDF_GENERADO**; 16 enfrentan nota oficial `o1=0` y hay 22 ceros en bitácora más amplia. | Conciliación alumno por alumno: fecha/motivo del 0, docente y autorización de dirección; listado de los 16 con decisión **mantener, rectificar o pendiente**; jamás borrar ceros masivamente. |
| NO-4 | Notas orales | Cierre definitivo autorizado, conversión rúbrica /25 → /15, preservación de nota 0 legítima, grupos e intentos. | Un caso controlado, única nota /15 y lectura idéntica en expediente/sesión, con bitácora; 16 casos solo tras NO-3. |
| PD-3 | PDF oral | Los **16 borradores** no son 16 PDFs oficiales; cerrar/generar archivo solo tras conciliación de nota. | Por cada cierre autorizado: PDF institucional único, respaldo y relación por ORAL_ID, estado SINCRONIZADA; sin archivo duplicado. |
| PD-4 | PDF oral | Acceso a PDF previamente emitido desde docente y estudiante, sin regenerarlo ni exponer carpeta. | Comparar mismo archivo/ID y SHA de descarga desde roles autorizados; 403 o denegación al ajeno; caso original 1/17 se usa para E2 sin modificarlo. |
| ES-2 | Escritos | Backend escrito privado #69 y frontend #522 siguen draft; INA L18/L32 5 puntos vs SIN INA 15, sin exponer banco/claves. | Reconciliar fuente real Apps Script y autorización; E1/E2 con cada programa y L18/L32, request privado y 0 fuga al hosting público. |
| ES-3 | Escritos | Cierre escrito doble envío/latencia, histórico, cero oficial y revisión posterior. | Una sola confirmación y readback idempotente; caída de red no produce doble cierre, no se convierte pendiente en cero. |
| ES-4 | Escritos | Historial y rúbrica estudiantil según procedencia verificada, intentos INA y SIN INA. | PRs relacionadas #495/#500 y backend conciliados, `REVISION_PONDERACION` si falta procedencia, casos históricos L18/L32 y notas 0 sin recálculo automático. |
| VP-4 | Vistas previas | Vista docente de oral, escrito y PC debe cargar banco correcto por nivel/lección y rol autorizado. | B1/B2/I1/I2 (o cobertura aplicable) en entorno aislado; bloquear banco sin auth, sin anticipar claves a alumno. |
| VP-5 | Vistas previas | Vista estudiante solo de evaluaciones habilitadas y resultados permitidos; errores y móvil. | E2 estudiante inscrito vs ajeno; antes de habilitar = no prueba/no claves, después = ruta propia, preview móvil y recuperación de error. |
| PC-3 | Quizzes | B1 PC02–PC08 con selección de grupo y apertura docente; #652 no integrada, backend R14 preparado pero no confirmado en QUIZ LIVE. | Docente autoriza lección/grupo; estudiante ve exclusivamente apertura legítima, guardar borrador, entregar, revisión; PC01 histórico no se toca. |
| PC-4 | Quizzes | Disponibilidad B2/I1/I2 (24 quizzes restantes), PDF/MP3 Cambridge y ACL de Drive. | 8/8 por nivel, banco/media autorizados, restricciones Cambridge remediadas antes de exponer; no confundir 32 esquemas en código con 32 abiertos en LIVE. |
| PC-5 | Quizzes | Ciclo completo del PC: activación, intento, revisión docente, comentario y devolución alumno; peso 0% formativo. | E2 de cada rol + casos duplicados/reintentos; resultados no alteran nota sumativa, publicación separada CORE/Quiz con readback y rollback. |
| VU-3 | Visual | Hotfix semáforo #717 tiene código/origen en 3 contextos, pero faltan datos I CAN de matriz admin y E2 real. | E2 docente, admin y alumno, grupo INA y SIN INA; P/A/sin registro separados, umbrales, horas verificadas, móvil, caso I CAN ausente neutro. |
| VU-4 | Visual/bilingüe | Traducción EN/ES parcial del docente/estudiante; **0/23** rutas íntegramente certificadas. | Inventariar textos y estados por 9 rutas alumno +14 docente; idioma EN/ES en menú, formularios, errores, vacío, móvil; PDF acreditado ES intacto. |
| VU-5 | Visual/calidad | Perfiles, nombres/fotografía/animación y flujos de exámenes móviles: falta E2; medición de login/performance real y accesibilidad. | Sesiones autorizadas, capturas antes/después, tiempos p50/p95 bajo red especificada, selector EN/ES y menú real, error de red, sin datos de prueba en expedientes. |

## 3. Bloqueadores transversales P0/P1 NO contados dentro de los 35
No inflar el porcentaje añadiendo/cerrando estas filas sin aprobar primero una ampliación del alcance.

| Prioridad | Hallazgo verificable y estado | Ruta y condición de salida |
|---|---|---|
| **P0** | Integridad APR: en auditoría F111, `actualizarEstatus` podía escribir APR **antes** de validar pagos/otras condiciones; cierre INA sin 85% o I CAN obligatorio. | Backend `prod/10_Estudiantes.js` y `prod/02_Auth_Sesiones_Usuarios.js`. Reparar prevalidación y transacción/rollback con E4 **aislado**, antes de cierres masivos o certificados. |
| **P0** | Cambridge Drive: último corte documentó **168/168 recursos con ACL pública heredada, 0/168 remediados**; **NO revalidado hoy**. #112 y #117 backend siguen draft. No enviar bancos o claves hasta ACL comprobada. | DRY_RUN con identidad y scopes, revisión y aprobación formal; auditoría de HTTP anónimo y accesos docentes, APPLY solo tras autorización específica y respaldo. |
| **P0** | R14 release desfasado: el paquete staging se generó contra **CORE @486**; último readback de #499 señala **CORE @487** por hotfix CONAPE, Quiz @477. PR frontend #690 **OPEN**, backend #120 **MERGED en GitHub, no equivale a Apps Script LIVE**. | Re-pin y comparar **33/33 CORE @487** y Quiz vigentes, reconciliar 71 archivos y rollback a @487 (no @486); E2 legítimo docente y alumno antes de cualquier despliegue. Volver a verificar versión numérica en Apps Script al empezar. |
| **P0** | Lectura global de solicitudes de suspensión potencialmente accesible a docente; #119 backend draft y sin despliegue. | Revisar GET/POST **y** función directa con auth real y grupo propio, sin filtrar solo en UI; no publicar solicitudes globales a docente. |
| **P1** | Grupo **05-26/06-26 nunca INA**, corrección aplicada o solicitada en hotfix financiero pero no consta conciliación E2 exhaustiva de proformas y todos los niveles. | Leer `APOLLO.G3/GRUPOS.PROGRAMA` por grupo/nivel y fichas/proformas/financiamiento sin escribir, demostrar etiqueta SIN INA y montos correctos; un solo ajuste auditado si persiste. |
| **P1** | El contador admin (#717) no dispone de registros I CAN en la matriz leída; SIN INA 16/32 sesiones puede no coincidir con horas elegibles para 70%. | Establecer contrato oficial de horas por lección y riel I CAN, luego E2, sin fabricar horas y sin auto-rechazar estudiantes. |
| **P1** | LOGIN/suspensión mejorados en #690 frontend pero PR OPEN; no confundir mejora de bytes JS o esperas estáticas con latencia real. | Validación E2 multigrupo, docente, móvil, sesión, permisos, medición real antes de merge + release coordinado. |

## 4. Estado de rutas críticas y PR vivas
- **Cerrar y no repetir**: frontend [#717](https://github.com/anorteamericana-ship-it/campus-virtual/pull/717) y [#718](https://github.com/anorteamericana-ship-it/campus-virtual/pull/718) MERGED, CI/Pages/readback HTTP PASS; quedan **solo E2 visual y contratos de datos específicos**. EN/ES menús #710–#716 ya tienen publicación parcial; no rehacer selector.
- **Frontend abierto/requiere conciliación**: [#690](https://github.com/anorteamericana-ship-it/campus-virtual/pull/690) candidato login + suspensión; [#685](https://github.com/anorteamericana-ship-it/campus-virtual/pull/685) implementación anterior separada; [#688](https://github.com/anorteamericana-ship-it/campus-virtual/pull/688) multigrupo; [#652](https://github.com/anorteamericana-ship-it/campus-virtual/pull/652) PC B1; [#522](https://github.com/anorteamericana-ship-it/campus-virtual/pull/522) escrito único; [#495](https://github.com/anorteamericana-ship-it/campus-virtual/pull/495)/[#500](https://github.com/anorteamericana-ship-it/campus-virtual/pull/500) nota escrita INA; [#511](https://github.com/anorteamericana-ship-it/campus-virtual/pull/511) banco oral privado. **OPEN/DRAFT no es LIVE.**
- **Backend** [#120](https://github.com/anorteamericana-ship-it/campus_backend/pull/120) MERGED, pero runtime R14 pendiente; [#119](https://github.com/anorteamericana-ship-it/campus_backend/pull/119), [#112](https://github.com/anorteamericana-ship-it/campus_backend/pull/112), [#117](https://github.com/anorteamericana-ship-it/campus_backend/pull/117), [#69](https://github.com/anorteamericana-ship-it/campus_backend/pull/69), [#55](https://github.com/anorteamericana-ship-it/campus_backend/pull/55), [#73](https://github.com/anorteamericana-ship-it/campus_backend/pull/73), [#65](https://github.com/anorteamericana-ship-it/campus_backend/pull/65) abiertos; no arrastrar #65 entero (delta histórico grande).
- **Diferencia documental:** al momento de esta auditoría, cabecera de `00_DOCUMENTACION/PRODUCTION_STATE.md` dice CORE @486, mientras corte más reciente en issue #499 dice CORE @487. Es **documento envejecido**, no autorización de rollback o release. Quiz @477 último observado. Confirmar numéricamente en GAS antes de cualquier acción.

## 5. Orden de ejecución sin repetir trabajo
1. **P0 seguridad/integridad antes de escribir:** actualizar lectura de CORE/Quiz versión efectiva; proteger APR/certificados y lecturas globales; preservar nota 0 y medios Cambridge. Ningún cambio masivo.
2. **E2 auténtico SOLO LECTURA** de hotfix #717 en tres roles + #718 en estudiante; anotar cada combinación programa/rol/riel y fuente, sin compartir PII ni tokens.
3. **Académico crítico R49:** NO-3 (16 conflictos cero) → procedimiento NO-4 → HO-3 (borradores históricos sin sesión activa) → E2 docente → un cierre autorizado + único PDF → resto individuales.
4. **Release R14:** reparar plan @486→@487 y componentes existentes, sin regresión financiera; E2 CORE/Quiz con sesiones legítimas; rollback verificado; solo entonces decidir una liberación controlada única de backend/frontend.
5. **Escritos y PC:** D2 escrita privada/nota 5 vs 15 + R9 PC02–PC08 con banco controlado; B2/I1/I2 después de resolver ACL Cambridge.
6. **UI e idiomas:** no inventar porcentaje de traducción; crear matriz de textos/estados 23 rutas, validar E2 por ruta, y luego prioridad por uso real. Reactivar perf con trazas de red de usuarios autorizados.

**Criterio de documentación:** por tarea capturar `fecha CR | repo/PR/commit | ruta y función | código | CI E1 | Pages | backend versión numérica | E2 rol/grupo | E4 aislado (si aplica) | resultado/defecto | rollback | próximo ID`. Solo marcar un hito cuando su aceptación sea visible en un sistema operativo auténtico y asignado en la matriz.

## 6. Prompt canónico para cambiar de chat
> CONTINUAMOS CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — F111. Leé PRIMERO el comentario más reciente de la issue #499 y `00_DOCUMENTACION/F111_CORTE_REAL_CONTINUIDAD_20261103.md`. Fuente principal `anorteamericana-ship-it/campus-virtual/main` y backend separado `anorteamericana-ship-it/campus_backend`. Matríz académica histórica **16/35 (45,7%), 19 pendientes NO recertificados**, 8 áreas desglosadas en el archivo. Hotfixs #717 (contador asistencia 3 roles) y #718 (perfil ES/EN/nombre blanco/A) **MERGED + Pages + HTTP SHA comprobados**, pero **0/3 E2 autenticado del contador**; NO reabrir su E1. R49 17 orales (16 borradores conflictivos con nota 0, 1 PDF), no modificar ceros; R14 FRONT #690 abierto, backend #120 mergeado pero NO deploy, CORE último readback @487 / Quiz @477, paquete @486 inválido hasta re-pin, #119 acceso docente global, Cambridge #112/#117 draft sin APPLY. Seguridad APR y asistencia INA antes de cierres. Bilingüe 0/23 rutas completas E2 (9 alumno+14 docente); estimación previa 15–25% **NO es certificado ni porcentaje global**. NO escribir pagos/notas/ausencias/Drive ni desplegar por cuenta del inventario. Primero comprobar fecha/HEAD/deploy con lectura y **seguir por primer ID abierto** (P0 integridad/seguridad y E2), actualizar #499 y PRODUCTION_STATE, reportar 4 columnas: código, CI, publicado, E2 con % y denominador. No repetir trabajo ni iniciar otra rama equivalente.

