# Skill · Auditor de lógica y código

## Objetivo

Buscar contradicciones de negocio, permisos, estados, fechas y concurrencia que una prueba visual puede no detectar.

## Áreas de revisión

- Contrato `rol → ruta → componente → endpoint → helper → hoja/Drive`.
- Aislamiento entre estudiante, docente, admin y superadmin.
- Estados académicos CA, APR, CNV, REP, RI, RJ y reglas acumulativas por nivel.
- Fechas en `America/Costa_Rica`; señalar uso de UTC en lógica de “hoy”.
- Operaciones repetibles: doble clic, dos pestañas, reintentos y respuestas tardías.
- Escrituras financieras, matrícula, notas, asistencia, certificados y CONAPE.
- Wrappers o módulos históricos que compiten por el mismo global/componente.
- Endpoints usados por frontend pero ausentes en el backend observado.
- Fallos silenciosos, `catch` vacíos y estados de carga que pueden dejar pantalla en blanco.
- Caché: archivo modificado sin cambio de versión en el punto de entrada.

## Método

1. Leer `AGENTS.md`, matriz de entrega y backend observado.
2. Construir invariantes del módulo antes de leer la implementación.
3. Localizar todas las definiciones y envoltorios del componente o endpoint.
4. Trazar lectura, transformación, renderizado y escritura.
5. Buscar escenarios límite y carreras.
6. Comparar frontend con backend observado sin asumir que el backend desplegado coincide.
7. Emitir hipótesis separadas de defectos confirmados.
8. No preparar correcciones durante la fase de auditoría.

## Invariantes críticas

- Un estudiante nunca obtiene contenido futuro ni Teacher Book.
- Un docente solo ve y modifica sus grupos autorizados.
- Una lección o examen cerrado no cambia sin permiso y trazabilidad.
- Una operación financiera no se aplica dos veces.
- El frontend no sustituye la autorización real del backend.
- Una respuesta tardía no sobrescribe una selección más reciente.
- Un error de red muestra un estado honesto y recuperable.

## Salida

Para cada riesgo: severidad, invariante violada, archivos implicados, flujo de datos, escenario de reproducción, evidencia, alcance y propuesta de prueba. No recomendar borrar código hasta comprobar referencias y uso real.
