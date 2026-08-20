# Skill · Documento de identidad CONAPE

## Objetivo
Convertir las dos imágenes originales del documento de identidad del solicitante (frente y dorso) en **un PDF adicional de una sola página**, sin reemplazar ni eliminar los JPG/imágenes originales.

## Contrato
- Entradas obligatorias: imagen del frente + imagen del dorso.
- Las imágenes originales se conservan como documentos independientes del expediente.
- Salida adicional: `documento_identidad_solicitante.pdf`, una página, frente arriba y dorso abajo.
- El PDF existe para facilitar el requisito de CONAPE de entregar ambas caras en un solo archivo.
- En este flujo no se usa un PDF manual como sustituto de las imágenes.

## Tratamiento permitido
1. Corregir orientación.
2. Recortar únicamente fondo evidente alrededor del documento.
3. Corregir perspectiva de forma conservadora si la foto está inclinada.
4. Mantener toda la superficie útil de la identificación visible; nunca cortar bordes, números, foto, firma, códigos o texto.
5. Mejorar escala/encuadre para lectura sin alterar contenido.
6. Componer una página A4 vertical con márgenes cómodos, frente arriba y dorso abajo, centrados y sin superposición.

## Prohibiciones
- No OCR para reconstruir o reemplazar texto del documento.
- No inventar ni corregir nombres, números, fechas o datos.
- No borrar marcas o elementos que formen parte de la imagen original.
- No usar servicios externos de reconocimiento facial/documental.
- No sustituir las imágenes originales por el PDF.

## QA obligatoria
- Frente y dorso presentes.
- Ningún dato visible queda recortado.
- PDF de exactamente una página.
- Frente arriba, dorso abajo.
- Orientación legible y proporción preservada.
- PDF nuevo privado por defecto; no heredar enlaces públicos de las imágenes legacy.

## Resultado
Guardar las dos imágenes originales y, adicionalmente, el PDF combinado requerido por CONAPE.
