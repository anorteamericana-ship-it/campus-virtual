# QA CS21A130 · Planeamiento estudiantil

Corrección del catálogo de PDFs de Planeamiento por lección para que la vista del estudiante use los documentos estudiantiles oficiales y no los documentos del docente.

## Carpetas fuente verificadas en Google Drive

- B1: `118O9a1OBGCvFGvAdTrn4lGyAVaG8-O44`
- B2: `1IEt6WOF_xSGVHaK8RObzF0mceI1BP2pw`
- I1: `169I-9wE9zZIt0D44CUP3CM4t2-_-OhUx`
- I2: `1Gw-AsqncJ7iPUAL17cQLqkvvgbYgJT3M`

Cada catálogo publica los archivos individuales `LECCIÓN 01.pdf` a `LECCIÓN 32.pdf`, ordenados por número. El PDF combinado de I2 (`Lección de la 1 a la 32.pdf`) se excluye de la botonera.

## Validaciones

- 32 IDs únicos por nivel.
- 128 IDs únicos en total.
- ninguna referencia coincide con los IDs del catálogo docente.
- el catálogo carga antes de la vista estudiantil.
- actualización de caché del guard a CS21A130.

No se modificó Apps Script ni la lógica de acceso acumulativo por nivel.
