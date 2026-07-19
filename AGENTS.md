# CAMPUS VIRTUAL · Reglas para agentes

Estas instrucciones aplican a todo el repositorio.

## Fuente de verdad

- Trabajar siempre desde la rama `main` vigente.
- Leer los handoffs y matrices actuales de `00_DOCUMENTACION/` antes de concluir que un archivo está obsoleto.
- No confiar en copias locales antiguas ni en recuerdos de conversaciones anteriores.

## Seguridad de entrega

- Nunca hacer cambios directos en producción durante una auditoría.
- Nunca publicar, reemplazar ni recortar `Code.gs` sin una tarea explícita y un entorno de prueba separado.
- Nunca inventar estudiantes, pagos, matrículas, notas, grupos, tareas, estados o permisos.
- No declarar un flujo “funcional” si solo fue validado por lectura de código.
- Distinguir siempre: validación estática, prueba sintética, prueba autenticada y verificación backend desplegado.

## Forma de trabajo

- Preferir cambios pequeños, reversibles y verificables.
- No borrar archivos solo por nombre, edad o apariencia. Verificar referencias en `campus.html`, `F96_LAZY`, imports, workflows y globals de `window`.
- Ejecutar las validaciones existentes y las específicas del módulo modificado.
- Toda corrección debe pasar por rama, pull request, CI y revisión humana.
- Los agentes de auditoría no deben crear commits de corrección, hacer push ni fusionar PR automáticamente.

## Roles virtuales

- Ingeniero QA: seguir `skills/campus-qa-engineer/SKILL.md`.
- Auditor de lógica: seguir `skills/campus-logic-auditor/SKILL.md`.
- Supervisor de entrega: seguir `skills/campus-release-supervisor/SKILL.md`.

## Severidad

- P0: pérdida/corrupción de datos, acceso no autorizado o producción inutilizable.
- P1: operación crítica incorrecta sin alternativa segura.
- P2: falla importante con alternativa, degradación o riesgo de entrega.
- P3: defecto visual, deuda técnica o mejora no bloqueante.

## Regla final

Un informe debe incluir evidencia reproducible: archivo/ruta, escenario, resultado esperado, resultado observado y alcance de la prueba. Sin evidencia, registrar como hipótesis y no como defecto confirmado.
