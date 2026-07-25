# Skill operativa vigente · Campus Virtual · CS21A143

## Objetivo

Continuar, auditar o corregir el Campus Virtual desde el estado real de GitHub, sin trabajar sobre recuerdos, documentos históricos o deployments no comprobados.

## Baseline

- Repositorio: `anorteamericana-ship-it/campus-virtual`.
- Rama productiva: `main`.
- Commit de referencia al 2026-07-25: `67108928e953fbf044dbcd916dc34a5dd5f1e570`.
- Último cambio funcional identificado: CS21A142.
- CS21A143 es una consolidación documental; no cambia frontend ni backend.

## Leer primero

1. `AGENTS.md`.
2. `00_DOCUMENTACION/HANDOFF_CHAT_CS21A143_2026-07-25.md`.
3. `00_DOCUMENTACION/BIBLIA_OPERATIVA_CS21A143.md`.
4. `00_DOCUMENTACION/MATRIZ_ENTREGA_ROLES_CS21A131.md`.
5. `00_DOCUMENTACION/EQUIPO_VIRTUAL_QA_CS21A137.md`.
6. `00_DOCUMENTACION/QA_REAL_STAGING_CS21A138.md`.
7. `00_DOCUMENTACION/BACKEND_OBSERVADO_CS21A131.json`.
8. Los archivos actuales del módulo en `main`.

Los documentos CS21A60, CS21A90, CS21A99, CS21A106 y CS21A107 se conservan como historial y no prevalecen sobre `main`.

## Flujo obligatorio

### 1. Verificar el punto de partida

- Consultar GitHub.
- Confirmar el SHA actual de `main`.
- Identificar commits posteriores al handoff.
- No editar si el baseline cambió sin releer los archivos afectados.

### 2. Definir el tipo de trabajo

Separar claramente:

- documentación;
- auditoría lógica;
- QA sintético;
- QA autenticado;
- corrección frontend;
- corrección backend;
- despliegue;
- verificación productiva.

No mezclar auditoría y corrección en la misma fase.

### 3. Construir invariantes

Antes de leer implementación, escribir qué debe ser cierto para el rol y flujo.

Invariantes mínimas:

- estudiante sin contenido futuro ni `TB`;
- docente limitado a grupos autorizados;
- superadmin validado también en backend;
- pagos, notas y asistencia no se duplican;
- fechas usan `America/Costa_Rica`;
- respuestas tardías no sobrescriben selecciones nuevas;
- errores de red dejan estado honesto y recuperable;
- un archivo modificado actualiza su versión de caché en todos los puntos de carga.

### 4. Trazar el contrato completo

Mapear:

`rol → menú → ruta → componente → archivo cargador → endpoint → helper → hoja/Drive/propiedad`

Buscar todas las definiciones, wrappers y sustituciones del componente o global.

Revisar siempre:

- `campus.html`;
- `src/app.jsx`;
- `src/lazy_loader.jsx`;
- `F96_LAZY` / `anLazyCampus`;
- imports;
- workflows;
- propiedades de `window`;
- instaladores tardíos y MutationObserver;
- versiones `?v=`.

### 5. Clasificar la evidencia

Etiquetar cada afirmación como:

- estática;
- sintética;
- navegador autenticado;
- backend observado;
- backend desplegado;
- escritura confirmada;
- producción verificada.

No usar “funciona” o “desplegado” fuera de su categoría real.

### 6. Aplicar skills de revisión

En este orden:

1. `skills/campus-logic-auditor/SKILL.md`.
2. `skills/campus-qa-engineer/SKILL.md`.
3. `skills/campus-release-supervisor/SKILL.md`.

Durante auditoría, no preparar ni publicar correcciones.

### 7. Probar sin escribir producción

Cobertura mínima sintética:

- escritorio 1440×900;
- móvil 390×844;
- consola y `pageerror`;
- 404/500;
- pantallas vacías;
- overflow horizontal;
- navegación Atrás;
- recarga directa;
- alternancia repetida de rutas;
- sesión sintética de solo lectura;
- Apps Script bloqueado o simulado.

### 8. Corregir solo fallos reproducidos

Para una corrección:

- crear rama `agent/<alcance-corto>`;
- modificar solo archivos necesarios;
- no apilar otro wrapper si puede corregirse la autoridad real;
- preservar funciones existentes;
- actualizar caché;
- ejecutar validaciones específicas;
- abrir PR pequeño;
- esperar CI;
- revisar comentarios automáticos;
- no fusionar automáticamente.

## Reglas por rol

### Estudiante

- Calendario académico: solo Cronograma.
- Tareas: debajo de Evaluaciones y placeholder honesto.
- Libros: `SB` y `WB`; nunca `TB`.
- Acceso acumulativo únicamente con `CA`, `APR`, `CNV`.
- Planeamiento: PDFs estudiantiles.
- No prometer reservas Club I CAN sin endpoints backend.

### Docente

- Libros: `SB`, `TB`, `WB`.
- Preservar U01–U16.
- Planeamiento: 32 lecciones, dos filas de 16.
- `Ver en Libro`: nivel/lección explícitos, unidad correcta y liberación posterior.
- Probar doble clic, dos pestañas y dos dispositivos.
- No declarar iniciar/cerrar/asistencia/notas como operativos sin persistencia comprobada.

### Superadmin

No presentar como terminados:

- Finanzas;
- Docentes;
- Horas docentes;
- Club I CAN administrativo;
- Configuración.

Tratar pagos, banco, matrículas, notas, CONAPE y permisos como flujos críticos.

## Backend

Referencia observada: `BACKEND_OBSERVADO_CS21A131.json`.

- No asumir que coincide con el deployment.
- No reemplazar ni recortar `Code.gs` sin solicitud expresa.
- No probar escrituras reales fuera del staging autorizado.
- No exponer IDs, secretos, usuarios o contraseñas en commits, issues, logs o capturas.

## Staging

El backend aislado de CS21A138 todavía requiere creación y deployment manual.

Hasta que exista `QA_STAGING_APPS_SCRIPT_URL` válida:

- no afirmar QA autenticado completo;
- no habilitar `execute_writes`;
- mantener pagos, notas, asistencia y cierres fuera de producción.

## Workflows que deben revisarse

- `.github/workflows/audit-delivery-cs21a131.yml`.
- `.github/workflows/real-qa-staging-cs21a138.yml`.
- `.github/workflows/validate-cs21a120.yml`.
- `.github/workflows/validate-cs21a122.yml`.
- `.github/workflows/validate-teacher-books-cs21a134.yml`.
- `.github/workflows/virtual-campus-review-cs21a137.yml`.

Comprobar sus filtros `paths`; un workflow no ejecutado no equivale a un workflow aprobado.

## Formato de entrega

Entregar siempre:

1. commit y fecha;
2. alcance exacto;
3. diferencias frente al handoff;
4. hallazgos con evidencia;
5. archivos modificados;
6. validaciones ejecutadas;
7. PR y estado de CI;
8. comentarios automáticos pendientes;
9. limitaciones;
10. veredicto del supervisor;
11. siguiente tarea pequeña recomendada.

## Veredictos

- `APTO`: sin P0/P1 y sin regresiones P2 críticas.
- `APTO CON RESERVAS`: riesgos P2 conocidos y documentados.
- `BLOQUEADO`: P0/P1 confirmado o regresión crítica.
- `INDETERMINADO`: la evidencia disponible no demuestra el flujo.

Una prueba sintética nunca demuestra permisos reales de Drive, deployment de Apps Script, datos productivos ni concurrencia backend.
