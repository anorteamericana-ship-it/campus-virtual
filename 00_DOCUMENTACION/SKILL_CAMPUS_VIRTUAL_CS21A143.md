# Skill operativa · Campus Virtual · CS21A143

## 1. Objetivo

Guiar cualquier revisión, corrección o entrega del Campus Virtual desde el estado real de GitHub, sin confundir código guardado con backend desplegado ni ejecutar escrituras no autorizadas.

## 2. Baseline inicial

Antes de trabajar:

1. consultar GitHub;
2. identificar el SHA actual de `main`;
3. comparar con `67108928e953fbf044dbcd916dc34a5dd5f1e570`;
4. registrar commits posteriores si existen;
5. leer `AGENTS.md`;
6. leer el handoff y la biblia CS21A143;
7. abrir los archivos vigentes del módulo.

Nunca continuar únicamente desde una descripción de chat o una copia local antigua.

## 3. Jerarquía de autoridad

1. `main` vigente.
2. `campus.html`.
3. `src/app.jsx` y `F96_LAZY`.
4. cargadores, imports, eventos, workflows y globals de `window`.
5. backend desplegado verificado.
6. backend observado con limitaciones declaradas.
7. documentación CS21A143.
8. documentación histórica.

## 4. Flujo obligatorio por tarea

### Fase A · Orientación

- confirmar repo, rama y SHA;
- revisar `git diff` o comparación de refs;
- definir un alcance pequeño;
- identificar si la tarea es documental, frontend, backend o QA;
- listar explícitamente lo que no se tocará.

### Fase B · Auditoría de lógica

Aplicar `skills/campus-logic-auditor/SKILL.md` antes de corregir.

Construir el mapa:

`rol → menú → ruta → componente → punto de carga → endpoint → helper → hoja/Drive`

Revisar:

- aislamiento por rol;
- estados académicos;
- acceso acumulativo;
- fechas `America/Costa_Rica`;
- doble clic, dos pestañas y respuestas tardías;
- idempotencia;
- wrappers históricos;
- endpoints ausentes;
- caché y versiones;
- errores silenciosos.

Separar siempre:

- defecto confirmado;
- hipótesis;
- deuda conocida;
- limitación de prueba.

No preparar la corrección durante la fase de auditoría si el alcance solicitado es solo auditoría.

### Fase C · QA aislado

Aplicar `skills/campus-qa-engineer/SKILL.md`.

Cobertura mínima:

- servidor HTTP local;
- backend real bloqueado o sustituido;
- escritorio 1440×900;
- móvil 390×844;
- consola y `pageerror`;
- 404/500 locales;
- pantalla vacía;
- desbordamiento horizontal;
- navegación Atrás;
- recarga directa;
- cambio repetido de menús;
- sesión sintética de solo lectura.

No usar credenciales reales durante QA sintético.

### Fase D · Corrección

Solo después de reproducir o demostrar el defecto:

- crear rama `agent/<descripcion>` desde `main` actualizado;
- corregir causa raíz;
- no apilar otro wrapper si puede repararse la autoridad real;
- actualizar todos los puntos de carga y versiones de caché;
- agregar prueba que cubra el caso límite;
- mantener el diff pequeño y reversible.

### Fase E · Validación

Ejecutar las validaciones del módulo y cualquier prueba nueva.

Según el alcance, revisar:

- `node --check` para JavaScript;
- parseo Babel para JSX;
- scripts de pruebas del repositorio;
- auditoría de superficie;
- QA virtual;
- staging de solo lectura;
- escritura controlada únicamente en staging.

No afirmar que un flujo funciona solo porque compila.

### Fase F · PR y CI

- hacer push únicamente a la rama;
- abrir PR contra `main`;
- describir causa, cambio, impacto y validación;
- esperar checks aplicables;
- revisar comentarios automáticos;
- responder o corregir cada comentario accionable;
- no fusionar automáticamente durante una auditoría.

Un workflow que no se activa por filtros de ruta no cuenta como validación ejecutada. Debe reportarse como “no aplicable/no disparado”, no como aprobado.

### Fase G · Supervisor

Aplicar `skills/campus-release-supervisor/SKILL.md`.

El informe debe incluir:

- commit y fecha;
- veredicto;
- P0/P1/P2/P3;
- hallazgos confirmados;
- hipótesis;
- cobertura ejecutada;
- cobertura ausente;
- pruebas manuales requeridas;
- siguiente tarea recomendada.

## 5. Reglas por dominio

### Estudiante

- SB y WB; nunca TB.
- `CA`, `APR`, `CNV` habilitan contenido.
- acceso acumulativo sin niveles futuros.
- Tareas no debe inventar registros.
- Planeamiento usa PDFs estudiantiles.

### Docente

- solo grupos autorizados;
- SB, TB y WB;
- U01–U16;
- proteger doble envío;
- probar cierre, asistencia y notas con persistencia;
- `Ver en Libro` debe liberar la solicitud contextual después del salto.

### Superadmin

- validar autorización también en backend;
- no tratar módulos `Próximamente` como terminados;
- pagos, banco, matrícula, CONAPE y estados requieren idempotencia y trazabilidad;
- no operar sobre una fila visual desactualizada sin lectura fresca suficiente.

### Backend

No modificar ni publicar `Code.gs` sin:

- solicitud expresa;
- copia de seguridad;
- hash y tamaño;
- mapa de endpoints y dependencias;
- Apps Script independiente de staging;
- propiedades apuntando a copias QA;
- pruebas de permisos y hojas;
- prueba controlada;
- plan de reversión.

## 6. Riesgos prioritarios CS21A143

Antes del piloto, revisar explícitamente:

1. refresco del último desembolso dentro de la misma vista;
2. revalidación del nivel origen antes de proyectar `PE`;
3. tratamiento de `conape_sync === false` como éxito parcial;
4. liberación real de la solicitud de `Ver en Libro`;
5. versiones distintas de cronogramas en `F96_LAZY`;
6. endpoints Club I CAN ausentes en backend observado;
7. fechas potencialmente basadas en UTC;
8. múltiples sustituciones de `MaterialesView`.

## 7. Staging y escrituras

El staging CS21A138 es el único destino aceptable para pruebas controladas de:

- pago;
- reenvío idempotente;
- nota;
- asistencia;
- lectura posterior de persistencia.

Condiciones obligatorias:

- URL diferente de producción;
- marcador de staging presente;
- hojas QA verificadas;
- usuarios y grupos con prefijos/sufijos QA;
- `execute_writes` desactivado por defecto;
- activación expresa para la ejecución concreta.

## 8. Formato mínimo de hallazgo

- ID estable.
- Severidad.
- Rol y ruta.
- Invariante.
- Archivos.
- Pasos de reproducción.
- Esperado.
- Observado.
- Evidencia.
- Tipo de prueba.
- Confianza.
- Alcance y limitaciones.
- Prueba propuesta.

## 9. Formato mínimo de entrega

Toda entrega debe indicar:

- SHA base real;
- diferencias frente al handoff;
- alcance exacto;
- archivos modificados;
- validaciones ejecutadas;
- checks no disparados;
- PR;
- estado de CI;
- comentarios automáticos;
- límites pendientes;
- veredicto del supervisor.

## 10. Regla final

No optimizar por velocidad sacrificando trazabilidad. En este repositorio, una corrección rápida que ignore wrappers, caché, concurrencia o backend puede crear una regresión más difícil de detectar que el defecto original.
