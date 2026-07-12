# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral/frontend:** F98.4-Z6-CS21A70  
**Backend fuente canónica en Drive:** F98.4-Z6-CS21A70  
**Backend Apps Script publicado:** no verificado  
**Base preservada:** CS21A69 / CS21A68 / CS21A67 / CS21A66 / CS21A65 / CS21A64  
**Producción:** no verificada  
**Corte:** 12-jul-2026

## Cambio vigente CS21A70 — Panel Maestro CONAPE

Se mejora la tabla `Seguimiento inmediato · Desembolsos académicos 01` del Panel Maestro del superadmin.

### Buscador

Busca sobre las filas ya cargadas por:

- Código del estudiante.
- Cédula.
- Número telefónico.
- Nombre completo.

La búsqueda ignora mayúsculas, tildes, espacios y formatos del teléfono.

### Orden y filtros

Las seis columnas se pueden ordenar desde el encabezado:

- Código.
- Estudiante.
- Resumen académico.
- Movimiento.
- Periodo / nivel.
- WhatsApp.

También se agregan filtros por:

- Movimiento.
- Nivel, incluido `Sin nivel enlazado`.
- Estado del resumen académico.
- Periodo.
- Estado de WhatsApp: disponible, sin teléfono o cerrado.

### Movimiento

- Se elimina la etiqueta visual `Sin fila`.
- La ausencia de fila en `7-morosidad` no se presenta como problema académico.
- Cuando corresponde, se muestra `Desembolso adelantado` como detalle visible.
- `Mora SI` y `Mora NO` siguen apareciendo únicamente cuando existe una fila oficial que lo confirma.

### Periodo / nivel

La primera línea muestra el desembolso académico principal 01 completo y la fecha en que fue detectado:

`01/09/2026 - D-10/07`

Si posteriormente aparece otro desembolso del mismo estudiante y periodo, se muestra debajo en menor tamaño:

`02/09/2026 · D-12/07`

Regla preservada:

- Solo 01 crea y cierra seguimiento académico.
- 02, 03 y superiores son contexto visual.
- 02+ no aplican pagos, no cierran el 01, no cambian morosidad y no alteran estados académicos.

## Backend CS21A70

Se modifica únicamente `_conapeAxAugmentMaster_` para adjuntar a cada fila 01 el arreglo `periodMovements` del mismo `cedula + mes + año`.

Cada elemento contextual contiene:

- Número de desembolso.
- Código de dos dígitos.
- Mes y año del periodo.
- Fecha y orden de detección.
- Tipo de movimiento.
- Indicador de desembolso adelantado.

Integridad:

- Archivo: `Code_F98_4_Z6_CS21A70_COMPLETO.gs`
- Tamaño: `2.938.302` bytes
- Saltos de línea: `51.714`
- SHA-256: `278cd64101c99abc6ecfc0e30ea4f6560fd3555c8c923756f7947d2e0ad26c28`
- Sintaxis: validada con `node --check`.
- Archivo canónico de Drive: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Respaldo previo: `1LbyMht5DGmF9icVR8iUW96q85sAEI6T0`.
- Copia de cierre: `1NoOW-dV-izB353Hkxtke9--XG5ZveauO`.

La copia descargada desde Drive coincide byte por byte con el archivo local CS21A70.

## Frontend CS21A70

Archivo modificado:

- `src/admin_master_conape_movements_cs21a25.jsx`.

Su nombre histórico se conserva porque `campus.html` ya lo carga. El contenido vigente declara `BUILD = F98.4-Z6-CS21A70`.

Validación:

- JSX analizado sin errores mediante Tree-sitter JavaScript/JSX.
- No se modifica `campus.html`.
- No se modifica la visual de libros, audios ni Recursos adicionales.

## Cambio preservado CS21A69

Se mantiene la selección azul única del menú lateral para estudiante, docente, admin y superadmin.

## Prueba inmediata

1. Copiar el `Code.gs` completo CS21A70 en Apps Script y publicar una nueva versión.
2. Actualizar el frontend y hacer `Ctrl + F5`.
3. Abrir `Panel Maestro → CONAPE`.
4. Buscar un estudiante por nombre, código, cédula y teléfono.
5. Ordenar desde cada uno de los seis encabezados.
6. Probar los filtros de movimiento, nivel, estado académico, periodo y WhatsApp.
7. Confirmar que ninguna fila muestre `Sin fila`.
8. Confirmar que un caso adelantado muestre `Desembolso adelantado`.
9. Confirmar el formato principal `01/MM/AAAA - D-DD/MM`.
10. Usar un periodo que tenga 02 o superior y confirmar que aparece debajo en pequeño.
11. Confirmar que 02+ no modifica el estado pendiente/cerrado del 01.

## Reglas preservadas

- Nunca mover pagos entre niveles o intentos.
- No modificar `CONAPE_SYNC`, `CONAPE_MOVIMIENTOS_LOG`, DATOS, ESTATUS ni `7-morosidad` desde esta pantalla.
- No crear automatizaciones ni triggers nuevos de CONAPE.
- No declarar producción verificada sin realizar la prueba anterior.
