# QA CS21A127 · Recursos del estudiante

Fecha: 2026-07-18
Repositorio: `anorteamericana-ship-it/campus-virtual`
Base revisada: `main` en `70be710f4c71fc93167459a155a708a9a1c8cfb5`

## Alcance

Revisión de código y composición visual de la experiencia estudiantil en escritorio y móvil para:

- Recursos Didácticos → Libros y Audios.
- Calendario académico.
- ubicación independiente de Tareas.
- acceso acumulativo B1, B2, I1 e I2.

No se modificó Apps Script ni se asumió que endpoints pendientes estén desplegados.

## Hallazgos confirmados

1. El visor compartido limita el modo estudiante a `SB` y `WB`; `TB` no aparece como opción estudiantil.
2. El proxy estudiantil contiene únicamente identificadores de `SB` y `WB`.
3. Los audios se presentan por unidad y cada pista solicita el archivo autorizado al seleccionar reproducción.
4. El fallback de acceso habilita de forma acumulativa los niveles con estado `CA`, `APR` o `CNV` y no agrega niveles futuros.
5. Calendario académico activa Cronograma y elimina las pestañas heredadas.
6. Tareas se inserta inmediatamente después de Evaluaciones y mantiene un placeholder sin tareas ficticias.

## Defecto visual encontrado

En móvil, el visor conservaba un ancho mínimo de `680px`. En una pantalla cercana a `390px`, esto dejaba visible la página izquierda y solo una franja de la página derecha, por lo que el libro no se percibía completo como un pliego abierto.

## Ajustes CS21A127

- El pliego visual pasa a caber dentro del ancho disponible en móvil, manteniendo las dos páginas y reduciendo el lomo central.
- Se compacta el margen del escenario del libro en pantallas pequeñas.
- Los botones se identifican como `Abrir PDF` y `Descargar PDF`.
- Los enlaces conservan apertura en pestaña nueva con `noopener noreferrer` y etiquetas accesibles.
- El workflow valida JSX, JavaScript y contratos básicos: SB/WB sin TB en el proxy, orden de Tareas, limpieza del calendario, fallback acumulativo y regla responsive del libro.

## Límites de esta validación

La validación visual se realizó con una composición local basada en el DOM y CSS vigentes. Desde este entorno no se completó un inicio de sesión real contra producción ni se verificaron de extremo a extremo los permisos de Google Drive, la descarga efectiva de cada PDF o la respuesta binaria de cada audio. Esas verificaciones requieren una sesión estudiantil real y el Apps Script publicado; no deben darse por confirmadas solo por existir el frontend.
