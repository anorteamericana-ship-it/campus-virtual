# Skill · Document Scanner Academia

## Objetivo
Obtener desde el primer contacto **una sola imagen documental final, limpia y utilizable**, antes de enviarla al backend.

Aplica a:
- documento de identidad · frente;
- documento de identidad · dorso;
- título / certificado / último grado.

## Regla canónica CS21A147
`FOTO FUENTE EN MEMORIA -> AJUSTE DE 4 ESQUINAS -> VISTA FINAL -> CONFIRMACIÓN DEL PROSPECTO -> SUBIR SOLO LA IMAGEN FINAL`

La foto fuente sirve únicamente para editar dentro del navegador. No se sube ni se guarda como un segundo archivo cuando el prospecto confirma el resultado.

## Flujo para imágenes
1. El prospecto elige `Tomar foto` o `Subir imagen`.
2. El navegador conserva temporalmente la foto fuente solo en memoria.
3. El scanner intenta sugerir automáticamente las cuatro esquinas.
4. El prospecto entra al ajuste de cuatro esquinas y puede moverlas manualmente.
5. El recorte aplica corrección de perspectiva conservadora y un pequeño margen de seguridad exterior para no rasurar ningún borde físico del documento.
6. Se muestra **la fotografía final exacta que se enviará**.
7. Se evalúan nitidez, iluminación y resolución.
8. Si la calidad es insuficiente, no se permite confirmar; se pide otra foto o reajustar esquinas.
9. Si el prospecto pulsa `Subir esta foto`, se descarta la foto fuente del estado de la aplicación y se envía únicamente la imagen final.

## Documento de identidad
- resultado operativo: `cedula_frente.jpg` + `cedula_dorso.jpg`;
- ambas imágenes ya llegan recortadas, enderezadas y confirmadas por el prospecto;
- después, en backend/operación, se genera `documento_identidad_solicitante.pdf` uniendo frente + dorso;
- el prospecto **no necesita generar, ver ni manipular ese PDF** durante la inscripción;
- el PDF es un artefacto posterior para el asesor/CONAPE.

## Título / certificado
- el mismo ajuste de cuatro esquinas se aplica a la imagen del título/certificado;
- se conserva únicamente la imagen final confirmada;
- no se generan copias `original` + `normalizada` innecesarias.

## PDF aportado por el prospecto
Si más adelante se mantiene una ruta excepcional de PDF ya preparado:
- no recortar ni convertir;
- conservarlo tal cual;
- revisión del asesor;
- esta ruta es independiente del flujo fotográfico CS21A147 y no sustituye la necesidad de que la ruta de cámara produzca buenas imágenes.

## Tratamientos permitidos antes de confirmar
- rotación/orientación;
- corrección de perspectiva;
- recorte de fondo externo;
- reescalado conservador;
- mejora leve de iluminación/contraste;
- nitidez leve sin reconstruir texto;
- margen exterior de seguridad para conservar íntegro el borde físico.

## Prohibiciones
- no OCR para reconstruir texto;
- no IA generativa para rehacer documentos;
- no cambiar nombres, números, firmas, fechas, códigos o fotografía;
- no inventar zonas faltantes;
- no recortar ningún borde útil del documento;
- no enviar la foto fuente a servicios externos;
- no subir automáticamente la foto antes de que el prospecto revise el recorte final;
- no crear dos archivos de imagen cuando una sola imagen final es suficiente.

## QA de calidad
Para permitir `Subir esta foto`:
- las cuatro esquinas están correctamente delimitadas;
- el borde físico completo sigue visible;
- no hay datos cortados;
- orientación legible;
- nitidez suficiente;
- iluminación suficiente;
- resolución útil suficiente;
- proporción razonable del documento.

Si falla cualquiera de estos puntos, pedir reajuste o nueva toma.

## UX obligatoria
La pantalla debe seguir este orden:
1. `Tomar foto` / `Subir imagen`;
2. `Ajustá las 4 esquinas`;
3. `Ver recorte final`;
4. vista grande de **Fotografía final que se enviará**;
5. `Volver a ajustar esquinas` / `Tomar otra` / `Subir esta foto`.

No mostrar al prospecto conceptos internos como `copia normalizada`, `PDF CONAPE generado` o duplicados de archivo.

## Seguridad y despliegue
- procesamiento local en navegador;
- solo la imagen final confirmada cruza al backend;
- archivos backend privados por defecto;
- PROD no se usa como laboratorio;
- validar primero en QA desechable separado.
