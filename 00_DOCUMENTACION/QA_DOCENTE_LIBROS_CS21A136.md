# QA Docente · Controles superiores de libros · CS21A136

Fecha: 18 de julio de 2026

## Solicitud atendida

El foco visual se mueve a los controles principales del visor:

- B1 · Básico I
- B2 · Básico II
- I1 · Intermedio I
- I2 · Intermedio II
- SB
- TB
- WB
- Abrir PDF
- Descargar PDF

La navegación por unidad queda deliberadamente simple.

## Cambios visuales

### Niveles

- Cuatro botones con ancho equilibrado.
- Color identificador propio por nivel.
- Estado activo azul institucional con profundidad y aro del color del nivel.
- Hover con elevación y sombra.

### Tipos de libro

- SB azul, TB granate y WB verde.
- Estado activo sólido.
- Botones de 48 px de alto y separación uniforme.

### Acciones PDF

- Abrir PDF como acción secundaria clara.
- Descargar PDF como acción principal azul institucional.
- Iconos integrados sin cambiar las etiquetas visibles.
- Imágenes Drive se conserva cuando el visor antiguo todavía la ofrece, pero queda visualmente secundaria.

## Navegación U01–U16

- Se oculta por completo el encabezado añadido en CS21A135.
- Se elimina visualmente el texto “Los inicios se cargan desde la configuración central del libro”.
- Cada botón muestra únicamente U01, U02, … U16.
- La página continúa almacenada en atributos internos para conservar el salto correcto, pero no se imprime en el botón.
- Se oculta la scrollbar horizontal añadida.
- Los botones se reducen a 38 px de alto y se distribuyen en una sola línea.
- Superadmin conserva el botón Actualizar debajo de cada unidad cuando corresponde.

## Alcance técnico

- Frontend únicamente.
- No se modifica Apps Script.
- No se escribe en Drive.
- No se cambian los 12 mapas de saltos.
- No se alteran permisos de docente, admin, superadmin o estudiante.
- El estudiante continúa sin acceso a TB.

## Prueba manual requerida

1. Abrir Libros de texto como docente.
2. Cambiar B1, B2, I1 e I2.
3. Cambiar SB, TB y WB.
4. Confirmar que el nivel y tipo activos se distinguen claramente.
5. Confirmar que Abrir PDF y Descargar PDF mantienen su función.
6. Confirmar que U01–U16 solo muestran la etiqueta de unidad.
7. Confirmar que no aparece el texto de configuración central.
8. Confirmar que no aparece una scrollbar debajo de U01–U16.
9. Probar U01, U08 y U16 para verificar que los saltos siguen funcionando.
