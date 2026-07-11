# SKILL OPERATIVA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

## Forma obligatoria de trabajo

- Responder en español directo para una persona que trabaja por copy/paste.
- Antes de modificar, indicar si afecta frontend, Apps Script o ambos y nombrar archivos exactos.
- Con acceso a GitHub, hacer los cambios directamente; no enviar al usuario a buscar y reemplazar código manualmente.
- Si Apps Script cambia, entregar un único `Code.gs` completo.
- Mantener `00_DOCUMENTACION` como fuente verdadera sin copias redundantes.
- Diferenciar preparado, guardado, respaldado, instalado y desplegado.
- No afirmar producción sin prueba real.

## Riesgo alto

Analizar antes de tocar pagos, certificados, `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS`, CONAPE o calendario. Nunca mover pagos entre niveles o intentos.

## Continuidad vigente

- Versión integral/frontend: F98.4-Z6-CS21A53.
- Backend completo objetivo: F98.4-Z6-CS21A46.
- Producción no verificada.
- El backend grande no está guardado en GitHub; `AppsScript/README.md` conserva su identidad declarada.

## Docente / Recursos Didácticos / Libros de texto

- Componente vigente: `src/teacher_cs21a_order_fix.jsx`.
- `campus.html` debe cargar PDF.js antes del componente y actualizar cache-busting en cada cambio.
- Libros y Biblioteca deben quedar bajo un único componente; no renderizar la carpeta embebida anterior por debajo o antes del visor nuevo.
- No usar un `MutationObserver` global para reinstalar la pantalla.
- Visor principal: dos páginas enfrentadas mediante PDF.js.
- Conservar el PDF en caché de memoria; cambiar de unidad solo cambia páginas.
- Mantener respaldo con Drive `/preview` cuando la lectura directa falle.
- SB, TB y WB deben diferenciarse visualmente.
- U01–U16 pertenece únicamente a Student Book.
- Fuente pedagógica: `APOLLO_G3_LIMPIO_21-04-26`, pestaña `DETALLE DEL PROGRAMA`, columna K `Páginas SB`.
- Usar primera página de la unidad + 6 hojas iniciales.
- Destinos PDF: U01 8, U02 14, U03 22, U04 28, U05 36, U06 42, U07 50, U08 56, U09 64, U10 70, U11 78, U12 84, U13 92, U14 98, U15 106, U16 112.
- B1 U09 muestra el pliego PDF 64–65.
- Totales reales SB: B1 157, B2 188, I1 158, I2 161. No asumir un total común.
- B1 SB activo: `1pnR7RoJGkZnx08TlfrEgxEqVRnlrCwea`; no usar el archivo `ORIGINAL` `13rMmy1ZLpto6SgjSyVyBd3MtivuU19j3`.
- Un archivo nuevo en Drive recibe un ID nuevo. Para actualizaciones sin código, reemplazar/versionar el archivo canónico preservando su ID.
- No prometer resolución automática por carpeta mientras no exista un endpoint backend que seleccione de forma inequívoca SB/TB/WB.

## Seguimiento inmediato

Columnas: `Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | WhatsApp`.

- Código primero, grande, solo número y seleccionable.
- Estudiante incluye nombre, cédula, seguimiento/revisado, Consulta, vínculo y grupo.
- Sin columnas Desembolso ni Detectado.
- Resumen académico desde `6-historial`, estrictamente vertical.
- Tabla completa sin scroll horizontal.
- WA siempre visible.

## FECHA_ULT_DESEMBOLSO

Se interpreta como `NUM_DESEMBOLSO/PERIODO_MES/PERIODO_ANIO`.

- `01/MM/AAAA`: desembolso académico gestionable.
- `02`, `03` y superiores: solo auditoría.
- Mostrar únicamente `01` en Seguimiento inmediato.
- Un `02/03+` no cierra ni reemplaza el `01`.

## 7-morosidad

Fuente externa oficial, pestaña `Hoja 1`.

- Meses 01–04 → periodo 1.
- Meses 05–08 → periodo 2.
- Meses 09–12 → periodo 3.
- Coincidencia exacta por cédula + año + periodo.
- `NO` = aplicado/cerrado.
- `SI` = pendiente.
- Sin fila = revisión.

## 6-historial

Solo lectura. Conservar todas las filas e intentos; no fusionar ni corregir desde el panel.

## WhatsApp

- Selector: Mensaje, Alerta y Atención.
- Abrir texto precargado; imagen manual.
- Negrita real usa `*texto*`.
- Monto solo si puede confirmarse.
- Cerrado = no enviar cobro.

## Consulta individual

- Usar lectura fresca para ficha, asistencia, comentario e historial.
- Después de una escritura, reconstruir antes de cerrar la ventana.
- No devolver datos vacíos para aparentar rapidez.
- Invalidar caché tras estatus, pagos, certificado, TOEIC, cambio de grupo o reversión.

## Pagos y certificados

- B1/B2/I1: matrícula + cuotas + certificado.
- I2: matrícula + cuotas + certificado + Programa Completo + TOEIC cuando corresponda.
- Aplicar pago dentro de Consulta individual usa el motor oficial; el frontend no escribe hojas.
- Mantener bloqueo, `REQUEST_ID`, journal e idempotencia.
- Certificado pagado y documento emitido son estados independientes.

## Checklist de cierre

1. Confirmar base real de GitHub.
2. Nombrar impacto y archivos.
3. Implementar y validar sintaxis.
4. Revisar cache-busting.
5. Actualizar Fuente verdadera, Readme, Biblia, Skill, Prompt, Manifiesto y AppsScript README.
6. Registrar integridad del backend completo cuando cambie.
7. Entregar solo los archivos solicitados.
8. No declarar despliegue sin prueba.
