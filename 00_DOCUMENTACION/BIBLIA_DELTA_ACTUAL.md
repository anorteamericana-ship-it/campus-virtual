# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A53

## Estado

- Frontend guardado en `main`: CS21A53.
- Backend completo objetivo: CS21A46.
- Producción no verificada.

## CS21A53 — Recursos docentes / visor de libro abierto

Ruta: Docente → Recursos Didácticos → Libros de texto / Biblioteca digital.

- Componente vigente: `src/teacher_cs21a_order_fix.jsx`.
- `campus.html` carga PDF.js 3.11.174 antes del componente.
- Un único componente intercepta Libros y Biblioteca; la lista embebida de carpetas del visor anterior no se renderiza en esas rutas.
- Se eliminó el `MutationObserver` global del parche anterior.
- PDF.js renderiza dos páginas enfrentadas con navegación anterior/siguiente y zoom.
- La carga del documento se conserva en memoria mediante un `Map`; cambiar de unidad no crea una nueva descarga del PDF.
- Si Drive bloquea la lectura directa por origen o autenticación, el sistema usa `/preview` como respaldo visible.
- SB, TB y WB tienen colores propios.
- Solo SB presenta U01–U16.

## Páginas y Apollo G3

Fuente: `APOLLO_G3_LIMPIO_21-04-26` → `DETALLE DEL PROGRAMA` → columna K `Páginas SB`.

- Primera página SB por unidad: `2, 8, 16, 22, 30, 36, 44, 50, 58, 64, 72, 78, 86, 92, 100, 106`.
- Página PDF equivalente: `8, 14, 22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112`.
- Regla: página SB + 6 hojas iniciales.
- Ejemplo: B1 U09 abre el pliego PDF 64–65.
- No aplicar ese mapeo a TB o WB.

## Fuentes Drive

Básico I utiliza el archivo actual `Interchange 5th intro-SB.pdf`, ID `1pnR7RoJGkZnx08TlfrEgxEqVRnlrCwea`. El archivo `Interchange 5th intro-SB ORIGINAL.pdf`, ID `13rMmy1ZLpto6SgjSyVyBd3MtivuU19j3`, no es la fuente activa.

Carpetas docentes oficiales:

- B1: `1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH`.
- B2: `1BpIzdHI1hd5ucmzOfYo9WnIc4yAtE2SJ`.
- I1: `1h3MWODA07lGzUDepOtJV8JvxzqvLncAX`.
- I2: `1Nco9Iwcz3P9ARMLP39HKo2AXTZJ4H3FP`.

Totales SB comprobados: B1 157, B2 188, I1 158, I2 161 páginas. No fijar un total común.

Los IDs permanecen explícitos en frontend porque no se modificó Apps Script. Reemplazar el contenido del archivo conservando su ID actualiza el visor; subir un archivo separado requiere actualizar el ID o implementar una resolución dinámica de carpeta en backend.

## Seguimiento inmediato preservado

Columnas: `Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | WhatsApp`.

- Solo desembolsos académicos `01`.
- `02/03+` quedan fuera del panel y no cierran el `01`.
- Resumen vertical desde `6-historial`.
- Sin scroll horizontal.
- WhatsApp ofrece `Mensaje`, `Alerta` y `Atención`.

## Reglas preservadas

- Aplicación por `7-morosidad`: cédula + año + periodo exactos.
- Pago de certificado y emisión del documento son estados distintos.
- Consulta individual reconstruye datos frescos después de una escritura.
- Nunca mover pagos entre niveles o intentos.
- GitHub guardado no equivale a producción publicada.
