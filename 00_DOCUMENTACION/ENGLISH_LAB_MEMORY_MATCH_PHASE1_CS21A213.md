# CS21A213 · Memory Match · Fase 1 QA

## Estado

Candidato local aislado sobre CS212 exacto (`16bdcf71a038d3929f7b56a76d780d05dfa5589b`). No se instaló Apps Script, no se creó deployment y no se modificaron `main` ni producción.

## Evidencia que motiva el cambio

- PROBE-5c.2 hizo decisorio N4 en LAB-6621/LAB-7351: 14 muestras solo, 15 pares equivalentes, mismo código `carta_no_encontrada`, factor de concurrencia 1.27.
- PROBE-5c.4/5c.5 confirmó que la interacción real seguía excediendo el objetivo: el par DISCOVER/SUBMIT podía llegar en orden inverso y cada request cargaba trabajo de snapshot completo.
- El factor 1.27 no justifica retirar `ScriptLock`; la Fase 1 conserva el lock y reduce trabajo dentro de la mutación.

## Cambio acotado

1. El navegador crea un `attempt_id` estable al abrir la primera carta.
2. DISCOVER_CARD y SUBMIT_PAIR usan ese mismo identificador; sus `action_id` HTTP permanecen distintos.
3. El backend acepta de forma idempotente ambos órdenes:
   - DISCOVER primero: SUBMIT continúa desde la revisión base guardada por ese intento.
   - SUBMIT primero: resuelve el par de forma atómica y el DISCOVER tardío queda como duplicado sin escritura.
4. Un ledger persistente y acotado de 32 intentos evita que un retry tardío vuelva a sumar respuesta, punto o transición.
5. Antes de insertar en Answers, el backend reconcilia el `attempt_id` ya persistido. Así, si Answers se guardó pero Rooms falló después, el retry completa el ledger sin crear otra respuesta.
6. La ruta rápida reutiliza el relay CS195 para jugador/estado y evita `_elive180BuildSnapshot_` en el camino aceptado.
7. Answers permanece persistente y dentro del `ScriptLock`; los eventos se escriben en lote persistente inmediatamente después de liberar el lock.
8. Si falta relay, jugador, contrato CS212 o coherencia suficiente, se delega intacto al backend CS212.

## Invariantes preservadas

- 15 s iniciales.
- Al menos 15 s desde FIRST_REVEALED para elegir la segunda carta; el deadline nunca disminuye.
- Mismatch visible 3 s y rotación al finalizar ese reveal.
- Match suma exactamente 1 punto y conserva al jugador con un turno nuevo.
- Tercera carta bloqueada mientras se resuelve la pareja.
- Conflictos legítimos de otra revisión/intención siguen devolviendo `state_conflict`.
- Sentence Order, Hangman, Quiz Time y Word Search permanecen en el ensamblado acumulativo.

## Controles automatizados

- Sintaxis de ensambladores, patch y Apps Script unificado.
- Dos órdenes de carrera, retries duplicados, ledger persistente, recuperación de escritura parcial, conflicto legítimo y mismatch 3 s.
- Exactamente una fila Answer, un punto y una transición por intento.
- Cero snapshots completos en la ruta rápida simulada.
- Navegador real: intento compartido, action IDs físicos distintos, segunda carta antes del ACK y tercera carta bloqueada.
- Regresiones CS212 de contrato 15/15/3 y migración de salas.

## Gate de despliegue

Este cambio no queda aprobado para producción por CI. Después de revisión humana y CI verde todavía requiere instalación manual del archivo completo CS213 en el deployment QA canónico, sala nueva con NATY/CHU y repetición autenticada del Paso 3. El objetivo de latencia solo puede declararse PASS con esa evidencia desplegada.
