# Skill · Documento de identidad CONAPE

## Objetivo
Preparar el documento de identidad requerido por CONAPE sin destruir evidencia original.

Este agente ya **no recorta ni corrige fotografías**. Esa responsabilidad pertenece a `skills/document-scanner-academia/SKILL.md` y debe ocurrir antes.

## Contrato
Existen dos rutas válidas.

### Ruta A · frente + dorso en imágenes
Entradas:
- frente original;
- frente normalizado y aprobado por QA;
- dorso original;
- dorso normalizado y aprobado por QA.

Salida adicional:
- `documento_identidad_solicitante.pdf`;
- exactamente una página;
- frente normalizado arriba;
- dorso normalizado abajo;
- centrados, proporción preservada y sin superposición.

Los archivos originales y las copias normalizadas se conservan por separado. El PDF no sustituye ninguno de ellos.

### Ruta B · PDF aportado por el estudiante
Entrada:
- `documento_identidad_original.pdf`.

Reglas:
- conservar byte a byte;
- no recortar;
- no convertir;
- no OCR;
- no generar un segundo PDF automáticamente;
- marcar para revisión del asesor;
- el asesor decide si se acepta o si solicita nuevas imágenes.

## Alcance del generador
El generador de PDF debe limitarse a **componer** las dos imágenes normalizadas. No debe realizar detección de bordes, recorte, corrección de perspectiva ni mejora de imagen.

## Prohibiciones
- no OCR para reconstruir o reemplazar texto;
- no inventar ni corregir nombres, números, fechas o datos;
- no borrar marcas o elementos del documento;
- no usar IA generativa para reconstruir documentos;
- no alterar PDFs aportados por el estudiante;
- no sustituir originales por derivados;
- no publicar archivos nuevos con `ANYONE_WITH_LINK`.

## QA obligatoria · ruta imágenes
- frente y dorso normalizados presentes;
- ambos fueron aprobados por el scanner documental;
- PDF de exactamente una página;
- frente arriba y dorso abajo;
- orientación legible;
- proporción preservada;
- PDF privado por defecto.

## QA obligatoria · ruta PDF
- MIME `application/pdf`;
- archivo guardado sin transformación;
- privado por defecto;
- estado visible para revisión del asesor.

## Resultado
- con imágenes: conservar originales + normalizados y generar el PDF combinado;
- con PDF: conservar el PDF original sin modificación y delegar aceptación final al asesor.
