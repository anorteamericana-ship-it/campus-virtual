# CS21A145 · QA con imagen real

## Hallazgo 2026-08-20
Primera prueba manual con una cédula real fotografiada en mano, con fondo complejo:

- `Calidad: 45/100`
- `Bordes detectados: NO`
- `Repetir foto: SÍ`
- la salida mostrada era el fallback sin recorte, por lo que visualmente se parecía al original.

El comportamiento fue seguro porque **no aprobó** una imagen que no pudo segmentar, pero no cumplía aún el objetivo de normalizar fotografías reales comunes.

## Corrección v2
`src/document-scanner.js` pasa a `CS21A145-2` y agrega:

- detección multi-Canny con varias sensibilidades;
- dilatación + cierre morfológico para unir aristas interrumpidas;
- detección complementaria Otsu claro/oscuro;
- evaluación de múltiples epsilon de `approxPolyDP`;
- scoring por área, centralidad y proporción geométrica;
- proporción esperada ID-1 para documentos de identidad;
- lectura de vértices mediante `approx.data32S` en OpenCV.js;
- `detectionMethod` y `detectionScore` para trazabilidad;
- texto de fallback explícito: la imagen de salida todavía no está recortada.

## Gate
Repetir exactamente la misma fotografía real después de actualizar la rama. El cambio solo se acepta si:

1. detecta el documento completo sin cortar contenido útil;
2. corrige perspectiva/encuadre de forma conservadora;
3. no aprueba recortes geométricamente dudosos;
4. sigue sin OCR, IA externa ni salida de red;
5. PROD permanece intacto.
