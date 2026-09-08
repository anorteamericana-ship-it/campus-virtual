# C4 · semántica de escritura de notas antes de E4 · auditoría E0/E1

Base exacta: PR #279 / `24067c41445e5aacee9fe33a230c653efd4cfdf8`.

## Hallazgo nuevo
C4 no puede tratar `registrarNotaEstatus` como sinónimo de “la escritura canónica de notas” ni usar una única UI como proxy de todas las superficies.

La ruta `docente_operativo` carga `teacher_views.jsx` y luego `docente_operativo.jsx`. En el panel operativo actual, `registrarNota(est)` escribe por `registrarNotaComponenteOficial`, no por `registrarNotaEstatus`. Su payload envía `codigo/cod_estudiante`, `grupo/cod_grupo`, `nivel`, `componente/tipo_eval`, `nota_100`, `comentario` y `registrado_por`; la UI limita la entrada a 0–100 y el backend responde `puntos/max_puntos`.

En paralelo, `teacher_views.jsx` conserva una superficie que llama `registrarNotaEstatus` en lote mediante `Promise.allSettled(estudiantesConNota.map(...))`. Ese patrón permite éxito parcial entre estudiantes; por tanto no es apropiado para el primer E4 ni para demostrar rollback atómico.

`admin_students.jsx` añade una tercera semántica: intenta primero `registrarNotaComponenteOficial` y solo ante endpoint no reconocido cae a `registrarNotaEstatus`. El fallback transforma la nota y envía `nota: puntosCalc`; no debe asumirse que `nota_100` y `nota` tienen la misma escala o significado.

## Implicación
El primer E4 de C4 debe probar **un solo handler y un solo estudiante sintético**. Si el objetivo explícito es `registrarNotaEstatus`, debe invocarse directamente con el contrato legacy congelado del source rehearsal efectivo; no debe pasar por `DocenteOperativoView`, por el fallback admin ni por el batch docente.

Antes del POST deben congelarse:
1. última definición/wrapper efectivo de `registrarNotaEstatus` en el rehearsal;
2. campos requeridos, escala de `nota`, normalización de `tipo_eval` y tratamiento de `leccion`;
3. destino físico exacto (hoja/rango/clave lógica) y si hace append, upsert o reemplazo;
4. cualquier recalculo/side effect sobre ESTATUS, promedio, certificado u otra hoja;
5. snapshot del único estudiante sintético en todas esas superficies.

## PASS / STOP / rollback
PASS requiere que una única escritura produzca exactamente una mutación lógica esperada, sin filas duplicadas ni cambios fuera del inventario, y que una lectura posterior reconcilie la misma nota/tipo/nivel/grupo. El rollback debe restaurar el snapshot byte/lógicamente equivalente en cada superficie tocada y una segunda lectura debe confirmar ausencia del fixture.

STOP si el source rehearsal no permite distinguir append vs upsert, si la escala de `nota` no queda inequívoca, si aparecen side effects no inventariados, si el batch/fallback introduce más de un handler, o si una respuesta incierta obliga a “reintentar para ver”.

El guard histórico CS21A138 solo prueba prefijo QA en estudiante/grupo antes de delegar; no demuestra semántica de nota, idempotencia, unicidad ni rollback del handler efectivo.

C0-SCHEMA62 continúa `BLOQUEADO_HUMANO`; C4 continúa `E4 STOP` hasta cerrar C0 y congelar source rehearsal efectivo.

No modifica runtime, backend, Apps Script, Sheets/Drive, Properties ni ACL. E2/E3/E4: NO.
