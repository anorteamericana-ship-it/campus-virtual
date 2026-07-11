# SKILL OPERATIVA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

## Forma obligatoria de trabajo

- Responder en español directo para una persona que trabaja por copy/paste.
- Antes de modificar, indicar si afecta frontend, Apps Script o ambos y nombrar archivos exactos.
- Con acceso a GitHub, hacer los cambios directamente.
- Si Apps Script cambia, entregar un único `Code.gs` completo.
- Mantener `00_DOCUMENTACION` como fuente verdadera.
- Diferenciar guardado, respaldado, instalado y desplegado.
- No afirmar producción sin prueba real.

## Riesgo alto

Analizar antes de tocar pagos, certificados, `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS`, CONAPE o calendario. Nunca mover pagos entre niveles o intentos.

## Continuidad vigente

- Frontend: F98.4-Z6-CS21A54.
- Backend canónico: F98.4-Z6-CS21A46.
- Producción no verificada.

## Backend canónico obligatorio

- Carpeta Drive maestra: `1XITxPmwGJRDqgplj0AjbhfbjzaoIvL-a`.
- Archivo canónico: `Code.gs`.
- Drive file ID: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Tamaño validado: `2,879,996` bytes.
- SHA-256 validado: `6cd638901f75ff56c4bc5f100be0203de05f82aa01a8b1f838f2c95bc7433568`.
- Conteo: `50,122` saltos de línea y línea final vacía; algunos editores muestran `50,123`.
- Carpeta de respaldos: `00_BACKUPS_CODE_GS`, ID `1OHyjrubHJfeBOxx0kfYm0cWrM5xtyOZr`.
- Antes de modificar backend: crear copia versionada en esa carpeta.
- Después de modificar: reemplazar los bytes del mismo archivo canónico conservando el ID `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Registrar versión, tamaño, SHA-256 y fecha en `README_BACKEND_ACTUAL.txt`, ID `179pqbUFMPiOUN6Lo3YA_Ia51lKtqtP8u`.
- Nunca usar CS21A42 o un archivo más pequeño como base.
- Nunca borrar el canónico ni sus respaldos sin autorización expresa.
- Drive actualizado no significa Apps Script desplegado.

## Docente / Recursos Didácticos / Libros de texto

- Componente vigente: `src/teacher_cs21a_order_fix.jsx`.
- `campus.html` carga PDF.js antes del componente y actualiza cache-busting en cada cambio.
- No mostrar panel lateral interno de niveles ni lista embebida de carpeta Drive.
- Nivel, SB/TB/WB, unidades y acciones deben estar en controles horizontales superiores.
- El PDF debe ocupar todo el ancho disponible debajo de los controles.
- Visor: dos páginas enfrentadas mediante PDF.js, con navegación, zoom y pantalla completa.
- Mantener el PDF en caché de memoria; cambiar unidad solo cambia páginas.
- No usar Drive `/preview` como respaldo visual ni volver a la vista anterior.
- Si PDF.js falla, resolver la lectura mediante el backend canónico; no ocultar el error dejando un visor vacío.
- SB, TB y WB deben diferenciarse visualmente.
- U01–U16 pertenece únicamente a SB.
- Fuente: `APOLLO_G3_LIMPIO_21-04-26`, `DETALLE DEL PROGRAMA`, columna K.
- Regla: primera página de unidad + 6 hojas iniciales.
- Destinos: U01 8, U02 14, U03 22, U04 28, U05 36, U06 42, U07 50, U08 56, U09 64, U10 70, U11 78, U12 84, U13 92, U14 98, U15 106, U16 112.
- B1 U09 muestra PDF 64–65.
- Totales SB: B1 157, B2 188, I1 158, I2 161. No asumir un total común.
- B1 activo: `1pnR7RoJGkZnx08TlfrEgxEqVRnlrCwea`; no usar `13rMmy1ZLpto6SgjSyVyBd3MtivuU19j3`.
- Un archivo nuevo en Drive recibe un ID nuevo. Para actualizar sin código, preservar el ID canónico.
- No prometer resolución automática por carpeta sin endpoint backend inequívoco.

## Seguimiento inmediato

Columnas: `Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | WhatsApp`.

- Código primero, grande y seleccionable.
- Sin columnas Desembolso ni Detectado.
- Resumen desde `6-historial`, vertical.
- Sin scroll horizontal.
- WA visible.

## FECHA_ULT_DESEMBOLSO

- `01/MM/AAAA`: desembolso académico gestionable.
- `02`, `03` y superiores: solo auditoría.
- Un `02/03+` no cierra ni reemplaza el `01`.

## 7-morosidad

- Coincidencia exacta por cédula + año + periodo.
- `NO` = aplicado/cerrado.
- `SI` = pendiente.
- Sin fila = revisión.

## 6-historial

Solo lectura. Conservar todas las filas e intentos.

## WhatsApp

- Mensaje, Alerta y Atención.
- Monto solo si puede confirmarse.
- Cerrado = no enviar cobro.

## Consulta individual

- Usar lectura fresca.
- Después de una escritura, reconstruir antes de cerrar.
- Invalidar caché tras estatus, pagos, certificado, TOEIC, cambio de grupo o reversión.

## Pagos y certificados

- Aplicar pago usa el motor oficial; frontend no escribe hojas.
- Mantener bloqueo, `REQUEST_ID`, journal e idempotencia.
- Certificado pagado y documento emitido son independientes.

## Checklist de cierre

1. Confirmar base real de GitHub y backend canónico de Drive.
2. Crear respaldo versionado antes de tocar `Code.gs`.
3. Nombrar impacto y archivos.
4. Validar sintaxis.
5. Revisar cache-busting.
6. Actualizar Fuente, Readme, Biblia, Skill, Prompt, Manifiesto y AppsScript README.
7. Actualizar manifiesto Drive con versión, tamaño y hash.
8. No declarar despliegue sin prueba.