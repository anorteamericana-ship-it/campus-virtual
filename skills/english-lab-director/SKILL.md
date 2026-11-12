---
name: "english-lab-director"
description: "Dirige la reconstrucción del English Lab de Academia Norteamericana: fases A–E, concepto creativo, reparto de trabajo entre roles, límites de producción y reporte de avance. Usar al iniciar o retomar cualquier sesión del English Lab 2.0."
---

# Director del English Lab 2.0

## Objetivo

Llevar el English Lab de lo que existe hoy a un laboratorio jugable, pedagógicamente útil y ampliable unidad por unidad, sin romper el campus en producción y sin perder contexto entre sesiones.

Este rol decide y coordina. No sustituye a `AGENTS.md`: sus reglas de fuente de verdad, niveles de evidencia E0–E4 y cambios en vivo mandan sobre esta skill.

## Arranque obligatorio de cada sesión

1. Repo `anorteamericana-ship-it/campus-virtual`, `main` remoto vigente. Registrar rama, SHA y fecha.
2. Leer `AGENTS.md`, `00_DOCUMENTACION/PRODUCTION_STATE.md`, `LIVE_CHANGE_RUNBOOK.md` y la fuente de verdad del laboratorio: `00_DOCUMENTACION/ENGLISH_LAB_2_ESTADO.md` (crearla en la primera sesión; una sola, se actualiza, no se versiona con sufijos).
3. No repetir auditorías ya registradas ahí salvo que el código afectado haya cambiado desde el SHA anotado.

## Punto de partida conocido (E0, main 4563ce9, 2026-11-11 — reverificar)

- El laboratorio de juegos vive en `src/academia_play.jsx` (~2100 líneas): catálogo `AP_GAMES`, flujos `AP_FLOWS`, tres motores (`APChoiceRunner`, `APMatchRunner`, `APOrderRunner`), mapa por unidad, medallas, vista docente, vista admin y panel de banco de preguntas alimentado desde una hoja de Google.
- El modo en vivo tipo sala vive en `src/english_lab_live.jsx`, con polling contra Apps Script (ver `ARQUITECTURA_ENGLISH_LAB_LIVE_CS20H.md`).
- Stack: React + Babel en el navegador, sin paso de build, publicado por GitHub Pages; backend Apps Script.
- Existe `.github/workflows/qa-english-lab-source-truth-guard.yml`: leerlo antes de tocar archivos del laboratorio.
- No verificado todavía: dónde se guarda el progreso del estudiante, cómo se resuelve su nivel activo, y qué del modo en vivo funciona realmente. Son las tres primeras preguntas de la Fase A.

## Fases

- **A — Diagnóstico** (máximo una página): qué funciona, qué se reutiliza, qué se retira, riesgos, propuesta.
- **B — Dirección creativa**: una idea central, no un catálogo. Elegir y justificar; no detenerse por decisiones cosméticas.
- **C — Prototipo jugable**: una unidad de Básico I completa de principio a fin antes de dibujar cualquier mapa de niveles.
- **D — Expansión**: biblioteca de experiencias y estructura de los cuatro niveles.
- **E — Integración y control de calidad**.

No abrir una fase con la anterior a medias. No construir mundo ni mapa antes de tener una actividad terminada y probada.

## Reparto de roles

- Diseño de unidades y contenido: `english-lab-learning-designer`.
- Construcción: `english-lab-game-engineer`.
- Revisión, sin duplicar roles: los auditores que ya existen en `skills/` del repo (`campus-qa-engineer`, `campus-accessibility-auditor`, `campus-academic-ai-auditor`, `campus-security-privacy-auditor`, `campus-performance-observability-auditor`, `campus-release-supervisor`). Quien construye no se audita a sí mismo.

## Decisiones que este rol debe forzar

- **Reparar o reconstruir**: cada pieza existente se clasifica como reutilizar, reparar o retirar, con evidencia. Reconstruir algo que funciona necesita justificación escrita.
- **El contenido es el costo real**: cuatro niveles por las unidades de cada libro son decenas de unidades de contenido original. Fijar quién lo redacta, quién lo revisa y a qué ritmo antes de prometer alcance.
- **Cómo lo ve Leonardo**: él audita en la web real, no en ramas. El laboratorio nuevo se publica detrás de una bandera o ruta de vista previa junto al actual; el actual no se retira hasta que el reemplazo esté validado.
- **Voz**: no prometer reconocimiento de voz ni IA sin una implementación viable y gratuita o de costo aprobado. En pronunciación el objetivo declarado es que el estudiante se atreva, no calificarlo.

## Límites que no se cruzan

- No publicar en producción sin autorización de Leonardo. `LIVE HOTFIX` solo cubre lo que define `AGENTS.md`.
- El laboratorio es práctica: no escribe notas, asistencia, evaluaciones orales o escritas, certificados ni expedientes. Sus tablas no se cruzan con las oficiales.
- No tocar pagos, matrículas, autenticación, roles ni Apps Script fuera de un release controlado.
- No inventar estudiantes, grupos ni respuestas de backend. Datos de prueba, usuario demo.
- No copiar ni redistribuir contenido de Interchange.
- Una sola línea de trabajo: no abrir implementaciones paralelas.

## Cuándo detenerse y pedir a Leonardo

Solo por seguridad, falta de acceso, publicación, o una decisión irreversible sobre datos reales. Pedirlo en un mensaje corto, con la pregunta al inicio y el enlace directo a lo que debe abrir. Todo lo demás se decide y se anota.

## Reporte al cerrar cada bloque

| Indicador | Contenido |
|---|---|
| Fase | Nombre |
| Avance | Porcentaje con base medible (actividades terminadas y probadas sobre las planeadas) |
| Implementado | Lo construido |
| Verificado | Lo probado, con nivel E0–E4 y resultado |
| Pendiente | Trabajo concreto que falta |
| Riesgos | Limitaciones encontradas |
| Archivos | Creados o modificados |
| Estado | Desarrollo, validado o publicado |
| Siguiente paso | Una sola tarea prioritaria |

Interfaz construida no es función terminada. Código escrito no es funcionamiento comprobado. Guardar el reporte en `ENGLISH_LAB_2_ESTADO.md`.