# Skill · Documento de identidad CONAPE

## Objetivo

Convertir dos imágenes del documento de identidad del solicitante (frente y dorso) en **un solo PDF de una página**, legible y listo para el requisito documental de CONAPE.

## Entrada mínima

- imagen original del frente;
- imagen original del dorso;
- cédula o identificador solo para nombrar el archivo, cuando el usuario lo proporcione.

No trabajar desde capturas de pantalla si existen los archivos originales. Pedir los originales cuando el recorte o la legibilidad puedan verse afectados.

## Privacidad

- Tratar las imágenes como documentos personales sensibles.
- No enviarlas a servicios externos de OCR, edición o IA para completar este flujo.
- No inferir, transcribir ni exponer datos personales que no sean necesarios para producir el PDF.
- No alterar nombres, números, fechas, fotografía, firmas, códigos o contenido del documento.
- El procesamiento debe limitarse a geometría, recorte, perspectiva, orientación, contraste moderado y composición.

## Flujo

1. Confirmar que existen frente y dorso y que son legibles.
2. Detectar el rectángulo del documento en cada imagen.
3. Recortar el fondo sobrante sin cortar ningún borde del documento.
4. Corregir perspectiva únicamente cuando las cuatro esquinas estén identificadas con confianza suficiente.
5. Corregir orientación si la imagen está claramente girada.
6. Evitar filtros agresivos. La imagen final debe seguir representando fielmente el original.
7. Crear una página A4 vertical, fondo blanco.
8. Colocar el frente centrado en la mitad superior y el dorso centrado en la mitad inferior, conservando proporción.
9. Mantener separación suficiente entre ambas caras; no superponerlas ni estirarlas.
10. Exportar **un único PDF**.
11. Renderizar el PDF final para verificación visual.

## Regla de recorte

El agente puede hacer recorte automático cuando detecte con claridad un documento rectangular. Si la detección es ambigua, debe preferir un recorte conservador o pedir confirmación; nunca recortar texto o bordes para "mejorar" la apariencia.

## Salida

Nombre recomendado:

`ID_<CEDULA>.pdf`

Si la cédula no está disponible:

`DOCUMENTO_IDENTIDAD_SOLICITANTE.pdf`

## QA obligatoria

Antes de entregar:

- exactamente 1 página;
- aparecen frente y dorso;
- ninguna cara está cortada;
- texto/fotografía/códigos conservan legibilidad equivalente al original;
- orientación correcta;
- sin elementos añadidos, marcas, anotaciones o datos inventados;
- archivo abre correctamente como PDF.

## Uso en Campus

Para `inscripcion.html`, el flujo preferido es:

- si el solicitante ya tiene un PDF con ambas caras, subirlo directamente;
- si carga/toma dos imágenes, generar automáticamente el PDF único;
- conservar las imágenes originales solo mientras sigan siendo necesarias para compatibilidad con el Campus;
- el PDF combinado nuevo debe almacenarse privado por defecto y entregarse mediante una ruta autorizada cuando se integre a la sección Documentos.
