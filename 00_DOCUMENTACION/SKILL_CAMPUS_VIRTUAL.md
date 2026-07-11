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

- Frontend: F98.4-Z6-CS21A56.
- Backend completo: F98.4-Z6-CS21A56.
- Base backend preservada: CS21A46.
- Producción no verificada.
- El archivo canónico y sus respaldos se mantienen en Drive; GitHub conserva frontend, manifiesto y documentación.

## Regla para Code.gs

1. Leer siempre el archivo canónico indicado en `AppsScript/README.md`.
2. Crear copia en `00_BACKUPS_CODE_GS` antes de modificar.
3. Trabajar sobre la versión vigente, nunca sobre un respaldo anterior encontrado por nombre.
4. Entregar el `Code.gs` completo.
5. Recalcular tamaño y SHA-256.
6. Actualizar toda la documentación canónica.
7. No asumir despliegue después de actualizar Drive.

## Docente / Recursos Didácticos / Libros de texto

- Componente vigente: `src/teacher_cs21a_order_fix.jsx`.
- `campus.html` carga PDF.js antes del componente y actualiza cache-busting.
- La lectura se realiza mediante `teacherBooksOpenPdf` y `teacherBooksReadRange`.
- Usar `PDFDataRangeTransport`; no enviar el PDF completo en base64.
- Mantener el documento abierto al cambiar U01–U16.
- No mantener en caché de Apps Script el ID resuelto de SB/TB/WB: un archivo reemplazado debe detectarse al volver a abrir o actualizar.
- El frontend debe forzar resolución nueva al entrar/cambiar nivel o tipo.
- Mantener botón `Actualizar desde Drive`.
- El backend resuelve dentro de las carpetas oficiales y descarta ORIGINAL, COPIA, BACKUP, RESPALDO, OLD y ANTIGUO.
- B1/SB activo: `1zVPOGcCca5Ti8M8LtCpEO65-bO0m2_oF` dentro de `1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH`.
- Un ID preferente solo puede usarse si el archivo sigue dentro de la carpeta oficial; de lo contrario usar el PDF válido más reciente.
- Mantener controles horizontales y PDF a todo el ancho.
- Visor de dos páginas con anterior/siguiente, zoom y pantalla completa.
- No mostrar panel lateral interno ni volver a la lista antigua de Drive.
- U01–U16 pertenece únicamente a Student Book.
- Fuente: `APOLLO_G3_LIMPIO_21-04-26`, `DETALLE DEL PROGRAMA`, columna K.
- Regla: primera página SB + 6 hojas iniciales del PDF.
- Destinos: U01 8, U02 14, U03 22, U04 28, U05 36, U06 42, U07 50, U08 56, U09 64, U10 70, U11 78, U12 84, U13 92, U14 98, U15 106, U16 112.
- B1 U09 muestra PDF 64–65.
- No aplicar el mapeo SB a TB o WB.

## Seguimiento inmediato

- Columnas: `Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | WhatsApp`.
- Código primero, grande y seleccionable.
- Sin columnas Desembolso ni Detectado.
- Resumen vertical desde `6-historial`.
- Sin scroll horizontal.
- WhatsApp visible.

## FECHA_ULT_DESEMBOLSO

- `01/MM/AAAA`: desembolso académico gestionable.
- `02`, `03` y superiores: solo auditoría.
- Un `02/03+` no cierra ni reemplaza el `01`.

## 7-morosidad

- Coincidencia exacta por cédula + año + periodo.
- `NO` = aplicado/cerrado.
- `SI` = pendiente.
- Sin fila = revisión.

## Consulta individual, pagos y certificados

- Usar lectura fresca después de una escritura.
- Aplicar pago usa el motor oficial; frontend no escribe hojas.
- Mantener bloqueo, `REQUEST_ID`, journal e idempotencia.
- Certificado pagado y documento emitido son independientes.

## Checklist de cierre

1. Confirmar base real de GitHub y `Code.gs` canónico de Drive.
2. Nombrar impacto y archivos.
3. Validar sintaxis.
4. Revisar cache-busting.
5. Actualizar Fuente, Readme, Biblia, Skill, Prompt, Manifiesto y AppsScript README.
6. Crear respaldo previo y registrar integridad del backend.
7. Entregar solo los archivos solicitados.
8. No declarar despliegue sin prueba.
