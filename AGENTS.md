# CAMPUS VIRTUAL · Reglas para agentes

Estas instrucciones aplican a todo el repositorio. Su objetivo es producir cambios y auditorías reproducibles, seguros y trazables sin redescubrir en cada sesión la arquitectura, el runtime o los errores ya resueltos.

## Fuente de verdad y línea base

- Empezar desde el `main` remoto vigente y registrar repositorio, rama, SHA, fecha y entorno.
- Leer índices, handoffs, matrices y contratos vigentes de `00_DOCUMENTACION/`, pero contrastarlos con código y runtime.
- Si dos documentos discrepan, registrar el conflicto de vigencia; no elegir uno en silencio.
- Tratar como estados distintos: guardado en Git, incluido en una rama, fusionado en `main`, publicado en GitHub Pages, presente en Apps Script y verificado en producción.
- No asumir que un backend guardado u observado coincide con el backend desplegado.
- No confiar en copias locales antiguas ni en recuerdos de conversaciones anteriores.
- Si chat/memoria contradice GitHub o runtime verificado, manda GitHub + runtime.

## Cambios en vivo

Antes de modificar o publicar cualquier parte de la plataforma viva:

- leer `00_DOCUMENTACION/PRODUCTION_STATE.md`;
- leer `00_DOCUMENTACION/LIVE_CHANGE_RUNBOOK.md`;
- consultar `config/apps-script-production.json` cuando el cambio toque Apps Script;
- confirmar el SHA vigente de `main` y trabajar en una rama pequeña;
- considerar como runtime de Apps Script únicamente el Deployment ID estable apuntando a una versión numérica verificada; el HEAD remoto no equivale necesariamente a producción;
- registrar una nueva versión productiva solo después de verificación remota y prueba funcional cuando aplique.

### LIVE HOTFIX

Si el usuario escribe `LIVE HOTFIX: ...`, seguir `skills/live-hotfix-campus/SKILL.md`.

Es una autorización permanente para correcciones **frontend pequeñas, reversibles y no críticas** hasta rama → PR → checks obligatorios → merge → verificación pública, sin pedir una segunda autorización durante ese mismo hotfix.

No cubre Apps Script, Apollo, autenticación, OAuth/scopes, datos, pagos, CONAPE, roles, seguridad, ACL ni contratos backend; esos cambios son **RELEASE CONTROLADO**.

## Seguridad de entrega

- Nunca modificar producción durante una auditoría.
- Nunca publicar, reemplazar ni recortar `Code.gs`/`Código.js` sin tarea explícita, respaldo verificable, entorno de prueba separado y plan de reversión.
- Nunca inventar estudiantes, pagos, matrículas, notas, grupos, tareas, estados, permisos ni respuestas de backend.
- No usar credenciales reales en pruebas locales ni ejecutar escrituras reales por conveniencia.
- Las operaciones financieras, académicas, de acceso o CONAPE solo se prueban con escritura en un entorno aislado y con autorización explícita.
- No declarar un flujo `funcional` si solo fue validado por lectura de código.
- Distinguir siempre: validación estática, prueba sintética, prueba autenticada, navegador real y verificación backend desplegado.
- No declarar `FULL_E2E=PASS` si quedó un paso real pendiente.
- Toda corrección ordinaria respeta rama, PR, CI y la autorización aplicable. `LIVE HOTFIX` sustituye la reautorización paso a paso solo dentro de su perímetro frontend.
- Los agentes en rol de **auditor** no deben corregir, hacer push, fusionar ni borrar como parte de la auditoría.

## Matriz maestra obligatoria para auditorías

Antes de revisar archivos línea por línea, construir una fila por superficie ejecutable:

`rol → menú visible → condición de visibilidad → ruta/hash → entrada/handler → componente → bundle/cargador → endpoint de lectura → endpoint de escritura → autorización backend → hoja/Drive/proveedor → evidencia`

Incluir, cuando existan: visitante, prospecto/free user, estudiante, docente, Ventas, admin y superadmin. Mantener admin y superadmin separados aunque compartan interfaz. Registrar también rutas profundas, opciones deshabilitadas, funciones demo y superficies por feature flag.

La revisión debe seguir esa matriz y sus dependencias. No declarar `cada línea revisada` salvo que exista medición trazable de cobertura; declarar archivos, contratos, rutas y escenarios cubiertos y ausentes.

## Niveles de evidencia

- `E0 ESTÁTICA`: lectura de código, configuración, historial o contratos.
- `E1 SINTÉTICA LOCAL`: ejecución local con datos ficticios o backend bloqueado/simulado.
- `E2 AUTENTICADA LECTURA`: sesión real sin mutaciones, con autorización del propietario.
- `E3 DESPLEGADA LECTURA`: frontend y backend publicados verificados de extremo a extremo sin escritura.
- `E4 ESCRITURA CONTROLADA`: mutación en entorno aislado, con datos de prueba, trazabilidad y reversión.

Una evidencia superior no se infiere de una inferior. Código presente no demuestra código publicado; un botón oculto no demuestra autorización backend; un mock correcto no demuestra el contrato desplegado.

## Formato único de hallazgo

Cada hallazgo debe incluir:

- ID estable y especialidad.
- Estado: `CONFIRMADO`, `HIPÓTESIS`, `BLOQUEADO` o `NO APLICA`.
- Severidad P0–P3 y justificación por impacto.
- Nivel de evidencia E0–E4 y confianza.
- SHA, entorno, rol, menú/ruta y precondiciones.
- Archivos, símbolos, endpoints y fuentes de datos implicados.
- Pasos reproducibles; esperado y observado.
- Impacto, alcance conocido y límites de la prueba.
- Prueba que confirmaría o descartaría el riesgo.
- Recomendación separada; no mezclar evidencia con una propuesta todavía no validada.

## Severidad

- P0: pérdida/corrupción de datos, acceso no autorizado material o producción inutilizable.
- P1: operación crítica incorrecta o bloqueada sin alternativa segura.
- P2: falla importante con alternativa, degradación relevante o riesgo de entrega.
- P3: defecto localizado, deuda técnica o mejora no bloqueante.

La severidad se asigna por impacto y alcance, no por cantidad de archivos ni complejidad de la solución.

## Secuencia de auditoría

1. Congelar línea base y resolver qué ref se audita.
2. Construir la matriz maestra y marcar vacíos de información.
3. Ejecutar auditorías especializadas sin cambios funcionales.
4. Deduplicar hallazgos y emitir veredicto de cobertura y entrega.
5. Crear un plan de corrección por PR pequeños, reversibles y verificables.
6. Volver a probar las superficies afectadas y sus contratos vecinos.
7. Solo entonces preparar candidatos de consolidación o retiro.

## Roles virtuales

- Ingeniero QA: `skills/campus-qa-engineer/SKILL.md`.
- Auditor de lógica y contratos: `skills/campus-logic-auditor/SKILL.md`.
- Auditor de seguridad y privacidad: `skills/campus-security-privacy-auditor/SKILL.md`.
- Auditor de accesibilidad: `skills/campus-accessibility-auditor/SKILL.md`.
- Auditor de rendimiento y observabilidad: `skills/campus-performance-observability-auditor/SKILL.md`.
- Auditor académico e IA: `skills/campus-academic-ai-auditor/SKILL.md`.
- Consolidador de código y ramas: `skills/campus-code-consolidator/SKILL.md`.
- Supervisor de entrega: `skills/campus-release-supervisor/SKILL.md`.
- LIVE HOTFIX: `skills/live-hotfix-campus/SKILL.md`.

## Reglas de consolidación y borrado

- No borrar archivos por nombre, edad, sufijo de versión o apariencia.
- Verificar referencias en `campus.html`, router, `F96_LAZY`, cargadores, imports, globals de `window`, selectores DOM, workflows, tests, Apps Script y documentación operativa.
- No borrar una rama por antigüedad o porque su PR esté cerrado. Demostrar primero si contiene commits únicos, cambios equivalentes, despliegues, PR abiertos o dependencias documentales.
- Toda propuesta de retiro debe enumerar objeto exacto, evidencia de reemplazo, riesgo, respaldo y validación posterior.
- El borrado material requiere aprobación separada del usuario sobre la lista exacta. Cerrar un PR histórico sin borrar su rama/commits es una limpieza administrativa distinta.

## Memoria operativa

Cuando un incidente revele una causa o procedimiento reutilizable, documentar sin secretos:

`síntoma → causa → prueba que lo distinguió → reparación → prevención`

en `LIVE_CHANGE_RUNBOOK.md`, `PRODUCTION_STATE.md`, la skill dueña y/o el Issue canónico. El objetivo es no redescubrir fallos ya resueltos en cada chat.

## Definición de auditoría completa

La auditoría está completa cuando:

- la matriz maestra cubre todas las superficies descubiertas y cada fila tiene estado;
- se informa qué se validó en E0, E1, E2, E3 y E4 y qué no pudo validarse;
- cada especialidad entregó resultados o justificó `NO APLICA`;
- todo hallazgo tiene evidencia reproducible o está marcado como hipótesis/bloqueado;
- se conciliaron duplicados y contradicciones entre informes;
- existe un backlog priorizado de correcciones, pruebas de regresión y candidatos de consolidación;
- el supervisor emite un veredicto sin presentar incertidumbre como éxito.

Una auditoría puede estar completa y, aun así, concluir `BLOQUEADO` o `INDETERMINADO`.

## Regla final

Un informe debe incluir evidencia reproducible: archivo/ruta, escenario, resultado esperado, resultado observado y alcance de la prueba. Sin evidencia, registrar como hipótesis y no como defecto confirmado.
