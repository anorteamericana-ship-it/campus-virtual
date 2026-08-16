# CAMPUS VIRTUAL · Reglas para agentes

Estas instrucciones aplican a todo el repositorio. Su objetivo es producir una auditoría completa, reproducible y segura antes de corregir, consolidar o borrar código.

## Fuente de verdad y línea base

- Empezar desde el `main` remoto vigente y registrar repositorio, rama, SHA, fecha y entorno.
- Leer los índices, handoffs, matrices y contratos vigentes de `00_DOCUMENTACION/`, pero contrastarlos con el código. Si dos documentos discrepan, registrar el conflicto de vigencia; no elegir uno en silencio.
- Tratar como estados distintos: guardado en Git, incluido en una rama, fusionado en `main`, publicado en GitHub Pages, presente en Apps Script y verificado en producción.
- No asumir que un backend guardado u observado coincide con el backend desplegado.
- No confiar en copias locales antiguas ni en recuerdos de conversaciones anteriores.

## Seguridad de entrega

- Nunca modificar producción durante una auditoría.
- Nunca publicar, reemplazar ni recortar `Code.gs` sin tarea explícita, respaldo verificable, implementación de prueba separada y plan de reversión.
- Nunca inventar estudiantes, pagos, matrículas, notas, grupos, tareas, estados, permisos ni respuestas de backend.
- No usar credenciales reales en pruebas locales ni ejecutar escrituras reales por conveniencia.
- Las operaciones financieras, académicas, de acceso o CONAPE solo se prueban con escritura en un entorno aislado y con autorización explícita.
- Toda corrección pasa por rama, pull request, CI y revisión humana. Los agentes de auditoría no deben corregir, hacer push, fusionar ni borrar ramas como parte de la auditoría.

## Matriz maestra obligatoria

Antes de revisar archivos línea por línea, construir una fila por superficie ejecutable:

`rol → menú visible → condición de visibilidad → ruta/hash → entrada/handler → componente → bundle/cargador → endpoint de lectura → endpoint de escritura → autorización backend → hoja/Drive/proveedor → evidencia`

Incluir, cuando existan: visitante, prospecto/free user, estudiante, docente, admin y superadmin. Mantener admin y superadmin separados aunque compartan interfaz. Registrar también rutas profundas, opciones deshabilitadas, funciones demo y superficies que solo aparecen por feature flag.

La revisión de código debe seguir esa matriz y sus dependencias. No declarar “cada línea revisada” salvo que exista una medición trazable de cobertura; declarar en cambio archivos, contratos, rutas y escenarios cubiertos y ausentes.

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

## Secuencia de trabajo

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

## Reglas de consolidación y borrado

- No borrar archivos por nombre, edad, sufijo de versión o apariencia.
- Verificar referencias en `campus.html`, router, `F96_LAZY`, cargadores, imports, globals de `window`, selectores DOM, workflows, tests, Apps Script y documentación operativa.
- No borrar una rama por antigüedad o porque su PR esté cerrado. Demostrar primero si contiene commits únicos, cambios equivalentes, despliegues, PR abiertos o dependencias documentales.
- Toda propuesta de retiro debe enumerar el objeto exacto, evidencia de reemplazo, riesgo, respaldo y validación posterior.
- El borrado material requiere una aprobación separada del usuario sobre la lista exacta. La auditoría solo produce candidatos.

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
