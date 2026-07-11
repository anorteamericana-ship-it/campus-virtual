# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A52

## Estado

- Frontend guardado en `main`: CS21A52.
- Backend completo objetivo: CS21A46.
- Producción no verificada.

## CS21A52 — Recursos docentes / visor embebido restaurado

Ruta: Docente → Recursos Didácticos → Libros de texto.

- Componente vigente: `src/teacher_cs21a_order_fix.jsx`.
- SB, TB y WB conservan colores propios y selección visible.
- Solo SB muestra U01–U16.
- Fuente oficial: `APOLLO_G3_LIMPIO_21-04-26` → `DETALLE DEL PROGRAMA` → columna K `Páginas SB`.
- Regla: primera página de la unidad + 6 hojas iniciales del PDF.
- Inicio SB: `2, 8, 16, 22, 30, 36, 44, 50, 58, 64, 72, 78, 86, 92, 100, 106`.
- Destino PDF: `8, 14, 22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112`.
- CS21A51 dejó el visor vacío porque la dirección usada fue tratada como descarga.
- CS21A52 restaura el visor embebido de Google Drive y elimina esa dirección del `iframe`.
- Cambiar de unidad no debe descargar el libro.
- La apertura exacta de la página solicitada queda sujeta a prueba real del visor de Google Drive.
- Ejemplo crítico: Básico I, U09 solicita SB 58 / PDF 64.
- No aplicar el mapeo a TB o WB.
- Apps Script no se modificó.

## Seguimiento inmediato preservado

Columnas: `Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | WhatsApp`.

- Solo se muestran desembolsos académicos número `01`.
- Los números `02`, `03` y superiores quedan fuera del panel y no cierran el caso `01`.
- El código aparece primero y solo contiene el número.
- No existen columnas Desembolso ni Detectado.
- El resumen académico se lee desde `6-historial` y se muestra verticalmente.
- La tabla no usa scroll horizontal.
- WhatsApp ofrece `Mensaje`, `Alerta` y `Atención`.
- Un caso cerrado no envía cobro.

## Reglas preservadas

- La aplicación se decide con `7-morosidad` por cédula, año y periodo exactos.
- Pago de certificado y emisión del documento son estados distintos.
- Consulta individual debe reconstruir datos frescos después de una escritura.
- No se mueven pagos entre niveles o intentos.
- GitHub guardado no equivale a producción publicada.