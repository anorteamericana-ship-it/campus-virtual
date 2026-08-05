# Auditoría integral y criterio de entrega CS21A178

Fecha de corte: 2026-08-05, zona horaria America/Costa_Rica

Repositorio: `anorteamericana-ship-it/campus-virtual`

Alcance: GitHub, ramas y PR apilados, documentación, workflows, artefactos QA, paquetes CS21A148–177, Drive QA y conversaciones relevantes.

Producción: no modificada.

## Veredicto ejecutivo

El trabajo acumulado hasta CS21A177 es un candidato técnico coherente, pero no una entrega funcional aceptada. Los contratos automáticos están aprobados y el paquete CS21A177 fue generado por CI; sin embargo, la evidencia viva del backend QA no contiene todavía una sala Memory Match con dos estudiantes ni un intento de tarjetas. Por lo tanto:

- CS21A177: **APTO CON RESERVAS para prueba autenticada**, no “terminado”.
- capacidad de 5, 10 o 25 estudiantes: **NO DETERMINADA**;
- producción y `main`: **fuera de alcance y sin cambios**;
- siguiente paquete: **CS21A178 CANDIDATO**, limitado a hacer determinista la carga del guard, corregir la portabilidad de la auditoría y entregar evidencia clasificada.

## Fuentes de verdad revisadas

1. `AGENTS.md` del repositorio y del proyecto local.
2. Todo el inventario vigente de `00_DOCUMENTACION`, con prioridad a handoff, Biblia, matriz por roles, staging CS21A148, revisión manual y documentos Memory Match CS21A173/174/177.
3. Workflows de integración, staging, Memory Match y paquetes CS21A148/173/174/176/177.
4. Historial Git desde `main` hasta CS21A177 y diffs de cada PR apilado.
5. Carpeta de Drive `QA_STAGING_CAMPUS_2026-07-19`, sus manifiestos, instaladores, backend modular, hojas QA y artefactos disponibles.
6. Conversaciones de continuidad, auditoría de juegos, limpieza del repositorio y antecedentes de entrega.

Las credenciales y la URL privada de QA fueron tratadas como datos sensibles: no se copian en este informe ni en el paquete.

## Estado GitHub exacto antes de CS21A178

`main` continúa en:

```text
67108928e953fbf044dbcd916dc34a5dd5f1e570
```

Cadena abierta y en borrador:

| PR | Cabeza | Base | Propósito | Estado auditado |
|---|---|---|---|---|
| #44 | `integration/cs21a158-manual-review-20260804` · `c7ed7e9` | `main` | Integración CS21A158–171 | abierto, borrador, fusionable |
| #45 | CS21A173 · `65d4d16` | rama de #44 | Motor Memory Match aislado | abierto, borrador, fusionable |
| #46 | `feature/cs21a174-memory-match-live-backend-2` · `222189a` | rama de #45 | Memory Match Live + CS21A175 | abierto, borrador, fusionable |
| #47 | CS21A176 · `ddf34f8` | rama de #46 | turnos compartidos + paquete backend/frontend | abierto, borrador, fusionable |
| #48 | `fix/cs21a177-memory-match-student-sync` · `61a014b` | rama de #47 | sincronización del estudiante + paquete | abierto, borrador, fusionable |

Ningún PR debe saltarse en la revisión. Ninguno fue fusionado durante esta auditoría.

## CI exacto de CS21A177

Para el commit `61a014b3e1103cc6513fac31471f3c7659f9f4f0`, GitHub registra siete ejecuciones de pull request aprobadas:

- CS21A158 validate manual-review candidate;
- QA staging frontend CS21A148;
- CS21A173 validate Memory Match engine;
- CS21A174 validate Memory Match Live contract;
- CS21A176 build final QA package;
- CS21A177 validate Memory Match student sync;
- CS21A177 build student sync QA package.

El paquete CS21A177 sí existe como artefacto de GitHub. La ausencia de aceptación autenticada no invalida esas pruebas; limita lo que se puede afirmar sobre el resultado real.

## Inventario funcional CS21A148–177

| Corte | Resultado que ya existe | Estado que debe conservarse |
|---|---|---|
| CS21A148 | constructor del frontend real de QA, `qa-setup`, almacenamiento temporal de `/exec`, rechazo del deployment productivo, servidor local | base canónica de todos los paquetes; no duplicar |
| CS21A149–157 | limpieza respaldada, propiedad canónica de componentes y rutas de Recursos | evidencia histórica; no reintroducir archivos retirados |
| CS21A158–171 | integración manual, sincronización de rutas docentes, acceso English LAB y mora exigible | PR #44; revisión apilada obligatoria |
| CS21A173 | runtime liviano, motor Memory Match, schema, fixture y preview en Chromium | motor puro; sin backend ni banco incrustado |
| CS21A174 | patch backend QA, adaptador Live, estilos diferidos y contrato frontend/backend | base Live; requiere backend QA independiente |
| CS21A175 | normalización U1/U01 y arranque más rápido | incorporado en #46 |
| CS21A176 | motor de turnos, estado compartido, equipos, timeout, preview multivista, actualización QA única y paquete puerto 4174 | backend QA instalado y verificado; no reinstalar para CS21A178 |
| CS21A177 | guard de sincronización, ascenso inmediato del join, coalescencia de lecturas, métricas y paquete puerto 4175 | contratos verdes; aceptación autenticada pendiente |

## Backend y datos QA existentes

La arquitectura correcta es:

```text
frontend local del paquete
        ↓
deployment Apps Script QA independiente
        ↓
QA_APOLLO_G3 + QA_CAMPUS_OPERATIVO + ENGLISH_LAB_GAME_DB
```

Estado verificado:

- proyecto Apps Script QA modular independiente presente;
- backend CS21A176 instalado y verificado previamente con `ok:true`;
- normalización U1 → U01 aprobada;
- seis pares B1/U01 presentes;
- reglas Individual y Equipos presentes;
- política de timeout: avanzar turno, no cerrar la ronda;
- frontend no debe volver a servir el `index` monolítico histórico de Apps Script;
- CS21A178 no requiere cambio de Apps Script.

La base `ENGLISH_LAB_GAME_DB_CS21A173` define a Sheets como configuración/contenido, no como capa de estado realtime. El objetivo documental de latencia menor a 1,5 s no equivale a una medición lograda bajo carga.

## Evidencia viva encontrada en Drive

Las hojas operativas QA muestran:

- salas Memory Match creadas, en vivo y cerradas;
- únicamente un jugador por cada sala Memory Match observada;
- cero respuestas Memory Match registradas;
- una sala de equipos con 76 eventos `LIVE_TURN_TIMEOUT`;
- ninguna evidencia de dos estudiantes simultáneos en una misma sala.

Conclusión: el backend y los paquetes existen, pero el criterio de aceptación de CS21A177 no fue ejecutado completamente.

## Paquetes encontrados

Drive contiene el paquete `CAMPUS_QA_CS21A176_TURNOS_MEMORY_MATCH_FINAL.zip`. No se localizó un archivo CS21A177 persistido en Drive; CS21A177 quedó como artefacto de GitHub y referencia opaca del chat.

Problemas históricos que no deben repetirse:

- manifiesto que incluía `.nojekyll` después de retirarlo;
- `VERSION.txt` que confundía SHA de cabeza y SHA de merge de prueba;
- URL QA copiada dentro de un instructivo;
- paquete llamado `FINAL` antes de la aceptación autenticada;
- entrega por `chatgpt-content-reference` sin enlace persistente visible;
- instrucciones al usuario sin informe de estado, matriz de evidencia y límites.

## Qué estuvo mal en la entrega CS21A177

El ZIP de CI y su hash no eran el problema principal. La entrega conversacional afirmó “CS21A177 terminado” cuando el propio paquete decía que la prueba autenticada de dos estudiantes seguía pendiente. También omitió el contexto de los PR apilados, la evidencia viva de Drive, la distinción entre pruebas automáticas y QA real y el enlace persistente de Drive.

La forma correcta era:

1. informar que CI estaba aprobado;
2. declarar CS21A177 como candidato, no como aceptación final;
3. indicar que Apps Script CS21A176 ya estaba instalado y no debía tocarse;
4. entregar un único ZIP persistente con hash y manifiesto verificado;
5. incluir una matriz `APROBADO / PENDIENTE / NO INICIADO`;
6. solicitar solo la prueba faltante de dos estudiantes;
7. esperar evidencia antes de hablar de 5, 10 o 25 clientes.

## Brechas técnicas detectadas para CS21A178

### 1. Orden de carga no determinista

CS21A177 hacía que el adaptador solicitara el guard de sincronización de forma asíncrona. La lista canónica diferida cargaba el adaptador y luego la vista, pero no cargaba explícitamente el guard antes de ambos. En una carga lenta podía existir una ventana donde el estudiante hiciera `join` antes de que el guard envolviera `fetch`.

Corrección: incluir el guard directamente en `F96_LAZY.english_lab_live`, antes del adaptador y de `src/english_lab_live.jsx`, y alinear las claves de caché en CS21A178.

### 2. Auditoría no portable

`audit_cleanup_candidates_cs21a149.mjs` calculaba hashes sobre bytes del checkout. En Linux/LF pasaba; en Windows con `core.autocrlf=true` producía falsos negativos CRLF. El blob Git sí conserva el hash esperado.

Corrección: normalizar CRLF a LF antes de calcular hashes de esos archivos de texto. La regla histórica se mantiene intacta.

### 3. Falta de prueba integrada de la vista real

CS21A177 probaba el guard en una VM y el tablero/turnos en previews, pero no hacía que dos navegadores cargaran el componente real `EnglishLabLiveStudentView`, ejecutaran el `join` y demostraran que no aparecía `Enviar respuesta`.

Corrección: preview QA que reutiliza los componentes reales y prueba Playwright con:

- estudiante 1 en 1440×900;
- estudiante 2 en 390×844;
- tablero visible en ambos;
- ausencia de pregunta genérica;
- `join_upgrade:true` en métricas;
- jugador 2 en `Esperando turno`.

Esta evidencia es sintética y no sustituye Apps Script QA real.

La revisión visual de esas capturas detectó además un `0` suelto cuando no existían filas de ranking. La condición de renderizado se convirtió explícitamente a booleana para que React no imprima el valor numérico cero.

## Contrato del paquete CS21A178

Nombre:

```text
CAMPUS_QA_CS21A178_CANDIDATO_DOS_ESTUDIANTES.zip
```

Contenido obligatorio:

- frontend QA completo generado desde CS21A148;
- `ABRIR_CAMPUS_QA_CS21A178.cmd`, puerto 4176;
- `LEEME_PRIMERO_CS21A178.txt`;
- `ESTADO_VALIDACION_CS21A178.txt`;
- `REGISTRO_PRUEBA_AUTENTICADA_CS21A178.txt`;
- `INFORME_AUDITORIA_CS21A178.md`;
- `VERSION.txt` con SHA de cabeza y SHA de prueba separados;
- `SHA256SUMS.txt` verificado;
- guard CS21A177, adaptador Live, motor Memory Match, turnos y vista CS21A178;
- preview QA integrado de dos estudiantes.

No debe contener:

- URL privada de QA en los instructivos;
- credenciales;
- backend Apps Script duplicado;
- archivo `.nojekyll` fuera de manifiesto;
- rótulo `FINAL`;
- afirmación de capacidad no medida.

## Flujo correcto de entrega

1. partir exactamente de la cabeza de PR #48;
2. crear una rama pequeña apilada sobre #48;
3. modificar solo carga, prueba, auditoría, documentación y empaquetado;
4. ejecutar contratos estáticos, integración, navegador, construcción y verificación SHA;
5. abrir PR borrador contra la rama de #48;
6. esperar CI del commit exacto;
7. descargar o reproducir el artefacto y verificarlo fuera del directorio de construcción;
8. guardar un ZIP persistente en la carpeta QA de Drive;
9. entregar enlace visible, SHA-256 externo, PR, commit y matriz de evidencia;
10. ejecutar dos estudiantes autenticados;
11. solo con PASS avanzar a 5, 10 y 25.

## Criterio de cierre

CS21A178 puede declararse **APTO CON RESERVAS PARA QA** si CI y el paquete pasan. Solo podrá declararse **APTO autenticado para dos estudiantes** después de una sala nueva con dos cuentas reales, tablero visible en ambas, rotación y sincronización comprobadas. No autoriza merge, producción ni prueba masiva.
