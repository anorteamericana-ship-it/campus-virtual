# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A54

## Estado

- Frontend guardado en `main`: CS21A54.
- Backend completo objetivo: CS21A46.
- Producción no verificada.

## CS21A54 — Recursos docentes / PDF extendido

Ruta: Docente → Recursos Didácticos → Libros de texto / Biblioteca digital.

- Componente vigente: `src/teacher_cs21a_order_fix.jsx`.
- `campus.html` carga PDF.js 3.11.174 antes del componente.
- Se elimina el panel lateral interno de niveles y cualquier lista antigua de carpeta Drive en estas rutas.
- Los niveles quedan en botones horizontales superiores.
- SB/TB/WB, unidades y acciones quedan arriba; el PDF se extiende debajo a todo el ancho disponible.
- PDF.js renderiza dos páginas enfrentadas con anterior/siguiente, zoom y pantalla completa.
- El documento se conserva en memoria mediante `Map`; cambiar de unidad no vuelve a descargar el PDF.
- No existe respaldo visual con `/preview` ni retorno a la vista anterior.
- Si Drive bloquea la lectura, se muestra un error controlado con accesos externos.
- Solo SB presenta U01–U16.

## Páginas y Apollo G3

Fuente: `APOLLO_G3_LIMPIO_21-04-26` → `DETALLE DEL PROGRAMA` → columna K `Páginas SB`.

- Primera página SB: `2, 8, 16, 22, 30, 36, 44, 50, 58, 64, 72, 78, 86, 92, 100, 106`.
- Página PDF: `8, 14, 22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112`.
- Regla: página SB + 6 hojas iniciales.
- B1 U09 abre PDF 64–65.
- No aplicar este mapeo a TB o WB.

## Fuentes Drive

B1 usa `Interchange 5th intro-SB.pdf`, ID `1pnR7RoJGkZnx08TlfrEgxEqVRnlrCwea`. El archivo `ORIGINAL`, ID `13rMmy1ZLpto6SgjSyVyBd3MtivuU19j3`, no es fuente activa.

Carpetas oficiales:

- B1: `1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH`.
- B2: `1BpIzdHI1hd5ucmzOfYo9WnIc4yAtE2SJ`.
- I1: `1h3MWODA07lGzUDepOtJV8JvxzqvLncAX`.
- I2: `1Nco9Iwcz3P9ARMLP39HKo2AXTZJ4H3FP`.

Totales SB: B1 157, B2 188, I1 158, I2 161. No fijar un total común.

Los IDs siguen explícitos en frontend. Reemplazar contenido conservando el ID actualiza el visor; subir otro archivo exige actualizar el ID o crear resolución dinámica en backend.

## Seguimiento inmediato preservado

Columnas: `Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | WhatsApp`.

- Solo desembolsos académicos `01`.
- `02/03+` quedan fuera y no cierran el `01`.
- Resumen vertical desde `6-historial`.
- Sin scroll horizontal.
- WhatsApp: `Mensaje`, `Alerta`, `Atención`.

## Reglas preservadas

- Aplicación por `7-morosidad`: cédula + año + periodo exactos.
- Certificado pagado y documento emitido son estados distintos.
- Consulta individual reconstruye datos frescos después de escribir.
- Nunca mover pagos entre niveles o intentos.
- GitHub guardado no equivale a producción publicada.
