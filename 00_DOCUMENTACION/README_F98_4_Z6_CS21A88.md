# F98.4-Z6-CS21A88 — Calendario académico Superadmin profesional

## Objetivo

Reemplazar la vista global recargada y ambigua por una cuadrícula académica simple:

- una fila por grupo;
- columnas por día;
- una ficha compacta por lección;
- filtros de estado;
- vista Semana y Mes;
- navegación al grupo desde una lección.

## Contrato de datos

### GRUPOS

Fuente maestra para:

- existencia del grupo;
- nivel operativo seleccionado por el backend;
- estado administrativo de la fila: En curso, Proyectado o Completado;
- días y horario;
- docente.

### CALENDARIO_LECCIONES

Fuente maestra para:

- fechas de clases;
- número de lección;
- tipo de lección;
- estado de la lección.

### ESTATUS / mora

No forman parte del contrato mínimo para dibujar la cuadrícula. Los conteos financieros y académicos no se repiten dentro de cada lección.

## Regla de integridad visual

CS21A88 no modifica fuentes.

Cuando GRUPOS indica En curso pero el calendario seleccionado no contiene clases actuales ni futuras, la vista muestra:

`REVISAR`

Esto evita dos errores:

1. mostrar como activo un ciclo ya agotado;
2. promover automáticamente al siguiente nivel solo porque exista una fecha proyectada.

La corrección del estado real debe hacerse en la fuente académica correspondiente.

## Inventario auditado

El backend vigente devuelve 12 grupos únicos:

- 9 marcados En curso en GRUPOS;
- 2 proyectados;
- 1 completado.

La capa visual CS21A88 vuelve a validar la línea temporal. Con el escenario auditado del 14-jul-2026, cuatro grupos marcados En curso requieren revisión porque no presentan clases actuales o futuras en el ciclo seleccionado:

- B1-KJ94-B6-0425
- B1-LM94-B3-0626
- B1-LJ69-B1-0226
- B1-LJ69-B2-0426

No se modifican automáticamente.

## Cambios visuales

Se eliminan del cuerpo de la cuadrícula:

- total repetido de estudiantes en cada lección;
- mora repetida en cada lección;
- código del grupo repetido en cada ficha;
- estadísticas redundantes.

Se mantienen:

- código completo del grupo;
- nivel;
- estado visual;
- horario;
- docente;
- lecciones por fecha;
- vista Semana y Mes;
- botón Ver estudiantes del grupo.

## Arquitectura

El backend de calendario CS21A80 permanece dentro del Code.gs integral CS21A86.

El frontend global anterior A80/A87 deja de cargarse. CS21A88 es la única capa visual del calendario académico global.

CronogramaGrupo continúa cargando el módulo histórico diferido, pero al terminar la carga el evento `an:lazy-module-loaded` instala el componente CS21A88 en `window.TodosLosGruposView`, que es la referencia que CronogramaGrupo resuelve al renderizar la vista global.

## QA

Pruebas ejecutadas antes de la entrega:

### Backend

20/20 aprobadas:

- 12 grupos fuente;
- 12 grupos devueltos;
- nivel completado correcto;
- nivel de sábado correcto;
- horarios 9am–4pm y 6pm–9pm correctos;
- aperturas preservadas;
- una fecha proyectada no promueve automáticamente el nivel.

### Frontend

16/16 aprobadas en la lógica de la vista:

- inventario de 12 filas;
- clasificación ACTIVO / REVISAR / APERTURA / CERRADO;
- orden por número;
- deduplicación;
- L4 y LJ;
- marcadores de aperturas;
- semana iniciando lunes;
- reinstalación después de la carga diferida.

### Autoprueba de runtime

`window.__AN_CALENDAR88_SELFTEST__`

Debe devolver `ok: true`. Comprueba que todas las dependencias esenciales de Semana, Mes, filtros, navegación y componente final estén disponibles antes de instalar la vista.

## Alcance

CS21A88 es frontend-only.

No modifica:

- Code.gs;
- Rebeca;
- hojas de cálculo;
- matrícula;
- estados académicos;
- mora;
- calendario de lecciones.
