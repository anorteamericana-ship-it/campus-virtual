# Skill · Document Scanner Academia

## Objetivo
Normalizar fotografías de documentos desde el navegador antes de enviarlas al backend, conservando siempre el archivo original sin modificaciones.

Aplica a:
- documento de identidad · frente;
- documento de identidad · dorso;
- título / último grado.

Los PDF se aceptan como archivos originales y **no se recortan, reescriben ni convierten**. Quedan sujetos a revisión del asesor.

## Regla de evidencia
`ORIGINAL INMUTABLE -> COPIA NORMALIZADA -> QA VISUAL -> USO OPERATIVO`

Nunca reemplazar, sobrescribir ni borrar el original para producir una versión más presentable.

## Flujo para imágenes
1. El estudiante elige `Tomar foto` o `Subir imagen`.
2. Si el navegador permite cámara guiada, mostrar marco del documento antes de capturar.
3. Guardar el archivo original en memoria sin recomprimirlo.
4. Analizar localmente en el navegador; la imagen no debe enviarse a servicios externos de IA/OCR.
5. Detectar los cuatro bordes del documento cuando sea posible.
6. Corregir orientación y perspectiva de manera conservadora.
7. Recortar solamente fondo externo evidente.
8. Evaluar calidad mínima: documento completo, nitidez, iluminación y resolución.
9. Mostrar una vista previa de la copia normalizada.
10. El estudiante confirma o repite la toma.
11. Enviar al backend tanto el original como la copia normalizada.

## Flujo para PDF
1. Aceptar un PDF cargado por el estudiante.
2. Conservarlo byte a byte como archivo original.
3. No ejecutar recorte, OCR, corrección de perspectiva, mejora generativa ni reconstrucción.
4. Marcarlo como `PDF_ORIGINAL_REQUIERE_REVISION_ASESOR`.
5. El asesor decide si es suficiente o si solicita nuevas fotografías/documentos.

## Documento de identidad
### Opción A · fotografías
- frente original;
- frente normalizado;
- dorso original;
- dorso normalizado;
- cuando ambas copias normalizadas pasan QA, el generador produce `documento_identidad_solicitante.pdf` de una sola página;
- el PDF generado usa **las copias normalizadas**, nunca modifica ni sustituye los originales.

### Opción B · PDF original
- un PDF puede sustituir la carga de frente+dorso para la inscripción;
- se conserva sin modificación;
- no se genera un segundo PDF automáticamente;
- queda a criterio del asesor aceptar el archivo o solicitar frente+dorso en imágenes.

## Título / último grado
### Si es imagen
- conservar `titulo_original`;
- generar `titulo_normalizado` con recorte, orientación y perspectiva conservadores;
- el original permanece disponible para auditoría/revisión.

### Si es PDF
- conservar `titulo_original.pdf` sin modificación;
- no convertir a imagen;
- revisión final a criterio del asesor.

## Nombres recomendados
- `cedula_frente_original.<ext>`
- `cedula_frente_normalizada.jpg`
- `cedula_dorso_original.<ext>`
- `cedula_dorso_normalizada.jpg`
- `documento_identidad_solicitante.pdf`
- `documento_identidad_original.pdf` cuando el estudiante aporta PDF
- `titulo_original.<ext>`
- `titulo_normalizado.jpg`
- `titulo_original.pdf` cuando el estudiante aporta PDF

## Tratamientos permitidos sobre copias derivadas
- rotación 90°/180°;
- corrección de perspectiva;
- recorte del fondo externo;
- reescalado conservador;
- mejora leve de iluminación/contraste para legibilidad;
- nitidez leve sin reconstruir texto.

## Prohibiciones
- no OCR para reconstruir texto;
- no IA generativa para rehacer documentos;
- no corregir nombres, números, firmas, fechas, códigos o fotografía;
- no borrar marcas que pertenecen al documento;
- no inventar zonas faltantes;
- no recortar bordes útiles del documento;
- no enviar documentos personales a servicios externos para procesarlos;
- no hacer público un original o una copia nueva por defecto.

## QA de calidad
Para aprobar una imagen normalizada:
- documento completo y cuatro esquinas visibles o inferidas con alta confianza;
- texto principal no borroso;
- sin reflejo que oculte datos esenciales;
- orientación legible;
- proporción preservada;
- resolución suficiente;
- recorte no elimina contenido útil.

Si la calidad es insuficiente, el sistema debe solicitar repetir la foto en vez de inventar o reconstruir contenido.

## UX recomendada
Mostrar al estudiante:
- guía antes de tomar la foto;
- vista previa `Original -> Ajustado`;
- estado de calidad;
- `Usar esta foto` o `Tomar otra`;
- para PDF: `PDF recibido · será revisado por un asesor`.

## Seguridad
- procesamiento de imágenes preferiblemente local en el navegador;
- originales y derivados privados por defecto;
- producción no se modifica durante QA;
- probar primero en un entorno desechable separado.
