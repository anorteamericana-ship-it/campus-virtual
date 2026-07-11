# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A49

## Estado

- Frontend guardado en `main`: CS21A49.
- Backend completo objetivo: CS21A46.
- Producción no verificada.

## Seguimiento inmediato

Columnas: `Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | WhatsApp`.

Reglas vigentes:

- Solo se muestran desembolsos académicos número `01`.
- Los números `02`, `03` y superiores quedan fuera del panel y no cierran el caso `01`.
- El código aparece primero y solo contiene el número.
- No existen columnas Desembolso ni Detectado.
- El resumen académico se lee desde `6-historial` y muestra un nivel debajo del otro.
- La tabla no usa scroll horizontal.
- WhatsApp ofrece `Mensaje`, `Alerta` y `Atención`.
- Un caso cerrado no envía cobro.

## Reglas preservadas

- La aplicación se decide con `7-morosidad` por cédula, año y periodo exactos.
- Pago de certificado y emisión del documento son estados distintos.
- Consulta individual debe reconstruir datos frescos después de una escritura.
- No se mueven pagos entre niveles o intentos.
- GitHub guardado no equivale a producción publicada.
