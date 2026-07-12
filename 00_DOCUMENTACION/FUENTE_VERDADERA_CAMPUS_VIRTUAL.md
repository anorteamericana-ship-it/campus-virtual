# FUENTE VERDADERA — F98.4-Z6-CS21A70

Estado: frontend CS21A70 guardado en GitHub `main`; `Code.gs` canónico de Drive actualizado a CS21A70; publicación de Apps Script y prueba de producción no verificadas.

## Panel Maestro · CONAPE

Archivo frontend vigente:

- `src/admin_master_conape_movements_cs21a25.jsx`

Aunque conserva el nombre histórico CS21A25, su contenido vigente declara:

`F98.4-Z6-CS21A70`

### Búsqueda

La tabla permite buscar por:

- Código.
- Cédula.
- Teléfono.
- Nombre del estudiante.

### Orden y filtros

Las columnas Código, Estudiante, Resumen académico, Movimiento, Periodo / nivel y WhatsApp son ordenables.

Filtros disponibles:

- Movimiento.
- Nivel.
- Estado académico.
- Periodo.
- Estado de WhatsApp.

### Movimiento

- La etiqueta `Sin fila` se elimina de la presentación.
- Solo se muestran `Mora SI` o `Mora NO` cuando `7-morosidad` contiene una fila oficial.
- La condición `Desembolso adelantado` queda visible como detalle cuando el periodo es posterior al mes de detección.

### Periodo / nivel

Formato principal:

`01/09/2026 - D-10/07`

Contexto adicional del mismo periodo:

`02/09/2026 · D-12/07`

El primer bloque de `FECHA_ULT_DESEMBOLSO` continúa interpretándose como número de desembolso y no como día del mes.

Regla de negocio:

- Solo 01 participa en el seguimiento académico.
- 02, 03 y posteriores se muestran solo como referencia.
- 02+ no aplican pagos, no cierran el 01 y no cambian morosidad ni estado académico.

## Backend canónico CS21A70

Archivo de Drive:

- ID: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`
- Nombre: `Code.gs`
- Tamaño: `2.938.302` bytes
- Saltos de línea: `51.714`
- SHA-256: `278cd64101c99abc6ecfc0e30ea4f6560fd3555c8c923756f7947d2e0ad26c28`

Respaldo previo:

- `1LbyMht5DGmF9icVR8iUW96q85sAEI6T0`

Copia de cierre:

- `1NoOW-dV-izB353Hkxtke9--XG5ZveauO`

El archivo descargado nuevamente desde Drive coincide byte por byte con el archivo local.

Cambio backend limitado a:

- Adjuntar `periodMovements` a cada movimiento académico 01.
- Agrupar por cédula, mes y año.
- Conservar número, periodo, fecha de detección, tipo y condición adelantada de 02+.
- Mantener las filas principales limitadas a 01.

## Preservado

- CS21A69: selección azul única del menú lateral.
- CS21A68: Recursos adicionales como panel independiente.
- CS21A67: árbol de Recursos adicionales y carga sin parpadeo.
- CS21A66: English LAB Gratis con autorización real.
- Visual y funcionamiento de Libros y Audios.
- Pagos, certificados, calendario, DATOS, ESTATUS y hojas externas CONAPE sin escrituras nuevas.
- Modo manual de actualización CONAPE y ausencia de triggers nuevos.

Guardado en GitHub y Drive no significa publicado ni probado en producción.
