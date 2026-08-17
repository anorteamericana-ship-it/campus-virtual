# REL-001 · Reconciliación contrato English LAB

Fecha: 2026-08-16  
Tipo: auditoría estática / evidencia de integración  
Estado: **SOURCE RECONCILED · DEPLOYMENT NOT PROVEN**

## 1. Objetivo

Corregir el diagnóstico inicial que comparó el frontend renovado de English LAB contra un `Code.gs` canónico de julio y concluyó que faltaban 43 de 53 endpoints.

Ese conteo no puede usarse como lista de programación porque después del backend canónico se construyeron capas QA acumulativas de English LAB: acceso CS21A144, Memory Match CS21A174+ (read-only para ChatGPT), Sentence Order CS21A183, Hangman CS21A191, Quiz Time CS21A198, Word Search CS21A200 y router curricular CS21A201.

Este corte **no implementa endpoints, no modifica motores, no instala Apps Script y no toca Memory Match**. Solo reconcilia contratos y separa presencia en source de presencia en deployment.

## 2. Frontend observado

El manifiesto generado en la pila English LAB identifica:

- 53 nombres literales `englishLab*` en 230 archivos JS/JSX;
- 28 nombres clasificados por el extractor como `runtime-likely`;
- distribución: 1 acceso, 10 Hangman, 10 Live legado, 7 Memory Match, 8 Quiz Time, 9 Sentence Order y 8 Word Search.

Importante: `runtime-likely` es una heurística del extractor. Quiz Time y Word Search usan gateways/indirecciones y varios nombres quedan clasificados como `literal_reference` aunque sí tengan rutas backend. Por eso ni 53 ni 28 deben interpretarse por sí solos como número de endpoints que hay que escribir.

## 3. Backend canónico de julio

Fuente observada en Drive:

- archivo: `Code.gs`;
- Drive ID: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`;
- tamaño: 2,971,957 bytes;
- modificado: 2026-07-21T16:12:53.556Z;
- SHA-256 de la copia leída para esta auditoría: `d24fc63c59e60ba92808d4d870f4eb95e35bb6f1c158a130229b187a66e35d37`.

Ese archivo contiene las 10 rutas Live del contrato visible del frontend legado:

`CloseRoom`, `CloseRound`, `CreateRoom`, `GetPlayerState`, `GetRoomControl`, `GetTeacherData`, `JoinRoom`, `LaunchQuestion`, `StartRoom`, `SubmitAnswer`.

Por sí solo, este backend histórico sí parece muy incompleto frente al frontend moderno. El error fue detener la comparación aquí.

## 4. Capas acumuladas posteriores

### CS21A144 · acceso

`apps_script_patches/english_lab_access_cs21a144.gs` agrega `englishLabAccessStatus` y envuelve operaciones Live para derivar identidad estudiantil desde la sesión.

### Memory Match · referencia solamente

`apps_script_patches/english_lab_memory_match_live_cs21a174.gs` expone seis rutas específicas del juego: CreateRoom, StartRoom, GetPlayerState, SubmitPair, GetRoomControl y CloseRound.

No se observó una ruta independiente `englishLabMemoryMatchJoinRoom`; la entrada del jugador se apoya en `englishLabLiveJoinRoom`. Esta diferencia es de compatibilidad/alias, no evidencia de que haya que crear un séptimo endpoint Memory Match.

**Regla:** ChatGPT no modifica esta superficie. Issue #78 mantiene Memory Match bajo responsabilidad externa y read-only para ChatGPT.

### CS21A200 / CS21A201

Artefacto observado en Drive:

- `99_CS21A200_ENGLISH_LAB_UNIFIED_COMPLETO.gs`;
- Drive ID `1SsIcNpNGnhycZnLXnbFYYWZNQJ1Jr9Tw`;
- 311,614 bytes;
- creado 2026-08-11T16:46:00.268Z;
- SHA-256 `fb869d8915bb59ef772c0ac775a10d66291bfa78f5a3f8bc67f102c8a64e55a0`.

La inspección estática observa en esa capa las familias completas de Hangman (10), Sentence Order (9), Quiz Time (8), Word Search (8), seis rutas Memory Match y compatibilidad con Live genérico.

El ensamblador `scripts/assemble_apps_script_cs21a201_unified.mjs` declara CS21A201 como CS21A200 + router de fuente curricular y conserva los cinco motores acumulados.

## 5. Resultado corregido

Sobre la unión de las fuentes observadas:

- nombres literales frontend: **53**;
- nombres con endpoint/ruta explícita observable en source: **52**;
- nombre sin ruta independiente: **1** (`englishLabMemoryMatchJoinRoom`);
- nombres sin explicación/mapeo: **0**;
- `runtime-likely`: **28**;
- cobertura estática de esos 28: **28/28**.

Por tanto, **REL-001 no equivale a “programar 43 endpoints faltantes”**. Ese diagnóstico se basó en comparar una interfaz acumulada contra un backend base anterior a las capas English LAB posteriores.

## 6. Lo que este resultado NO demuestra

### No demuestra deployment QA

El source del proyecto QA y el web-app `/exec` son estados diferentes. Issue #78 documentó que el proyecto QA ya contenía CS21A201 mientras el deployment activo seguía fijado en una versión anterior y el frontend moderno recibía HTML.

Por eso el estado de deployment queda:

**UNKNOWN / NOT PROVEN**

Antes de declarar compatibilidad E3 hay que verificar la versión actualmente servida por el mismo `/exec` QA y ejecutar un smoke autenticado/read-only contra esa implementación. No crear otro deployment QA.

### No cierra Issue #80

Que `englishLabQuizTimeAnswer` exista no resuelve idempotencia. Issue #80 continúa abierto para `attempt_id`, deduplicación atómica y retries/concurrencia. Presencia de endpoint != corrección semántica.

### No cierra SEC-003

La presencia de rutas tampoco prueba que identidad, sesión, rol, sala y jugador estén ligados correctamente. SEC-003 sigue siendo un P1 separado.

### No autoriza tocar Memory Match

El mapeo de endpoints Memory Match es evidencia de integración. No es autorización para modificar su motor o crear aliases nuevos.

## 7. Decisión de ingeniería

1. Retirar el supuesto de “43 endpoints por construir”.
2. Mantener un manifest de source y un gate distinto para deployment.
3. No escribir endpoints duplicados sin una reproducción que pruebe ausencia real en la versión QA servida.
4. Tratar `englishLabMemoryMatchJoinRoom` como compatibilidad mediante Live Join salvo que el responsable de Memory Match cambie explícitamente el contrato.
5. Mantener Issue #80 y SEC-003 como blockers independientes.
6. Si se modifica backend QA por seguridad/integración, portar **deltas** sobre la fuente QA acumulada actual; nunca reemplazarla por un candidato completo construido desde el `Code.gs` de julio.

## 8. Evidencia reproducible

Ver `qa/rel001_english_lab_backend_source_manifest.json` para fuentes, hashes, familias y el estado de cobertura.

Este PR debe permanecer de auditoría/documentación: **NO MERGE automático · NO PROD · NO Apps Script install**.
