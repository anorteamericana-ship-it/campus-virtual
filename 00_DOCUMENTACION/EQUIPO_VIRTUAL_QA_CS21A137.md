# Equipo virtual de revisión · CS21A137

## Propósito

Mantener una vigilancia técnica recurrente del Campus Virtual mientras se prepara la entrega de Estudiante, Docente y Superadmin.

## Integrantes

### Ingeniero QA

Skill: `skills/campus-qa-engineer/SKILL.md`

Ejecuta auditoría de archivos y pruebas con Chromium en un servidor local. Usa sesiones sintéticas y sustituye Apps Script por una respuesta de solo lectura para impedir escrituras accidentales.

### Auditor de lógica

Skill: `skills/campus-logic-auditor/SKILL.md`

Revisa contratos de rol, endpoints, fechas, concurrencia, wrappers que compiten, fallos silenciosos y discrepancias entre frontend y backend observado.

### Supervisor de entrega

Skill: `skills/campus-release-supervisor/SKILL.md`

Consolida y deduplica hallazgos, clasifica P0–P3 y emite APTO, APTO CON RESERVAS, BLOQUEADO o INDETERMINADO.

## Automatización

Workflow: `.github/workflows/virtual-campus-review-cs21a137.yml`

- Se ejecuta cada 6 horas sobre `main`.
- También puede iniciarse manualmente desde GitHub Actions.
- Se ejecuta en pull requests que modifican el Campus.
- Guarda informes JSON/Markdown y capturas durante 14 días.
- Mantiene un único issue abierto llamado `QA virtual · vigilancia continua del Campus`.
- No crea commits, no abre PR de corrección y no fusiona cambios.

## Cobertura sintética inicial

- Estudiante: dashboard y libros/audios, móvil y escritorio.
- Docente: grupos y materiales, móvil y escritorio.
- Superadmin: panel y banco, móvil y escritorio.
- Auditoría transversal: recursos locales, endpoints, versiones de caché, fechas UTC, sustituciones de `window.fetch`, sustituciones de `MaterialesView`, placeholders y fallos silenciosos.

## Límites

Este equipo no reemplaza QA autenticado. No demuestra:

- permisos reales de Drive;
- versión realmente desplegada de Apps Script;
- datos productivos;
- operaciones financieras, notas o asistencia reales;
- comportamiento desde dos dispositivos contra el backend real.

## Revisión desde móvil

En GitHub Mobile:

1. Abrir el repositorio.
2. Entrar a Actions para ver `Virtual Campus Review CS21A137`.
3. Abrir el issue `QA virtual · vigilancia continua del Campus` para leer el último veredicto.
4. Descargar el artefacto desde la web de GitHub cuando se requieran capturas o JSON completos.

## Política de seguridad

Cualquier corrección derivada de un hallazgo debe hacerse en una rama separada, con PR, CI y aprobación humana. El equipo virtual solo observa, prueba y reporta.
