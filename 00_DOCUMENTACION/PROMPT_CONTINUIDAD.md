# PROMPT DE CONTINUIDAD — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

Copiar desde la línea siguiente al iniciar otro chat.

---

Estoy trabajando en CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA, Costa Rica. Continúa desde F98.4-Z6-CS21A42.

## Forma obligatoria

1. Responder en español directo y asumir trabajo por copy/paste.
2. Antes de modificar, indicar impacto y archivos exactos.
3. Si Apps Script cambia, entregar siempre `Code.gs` completo.
4. Modificar solo los archivos necesarios de `anorteamericana-ship-it/campus-virtual`, rama `main`.
5. No tocar pagos, certificados, `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS`, CONAPE o calendario sin análisis de impacto.
6. No mover pagos entre niveles o intentos.
7. No afirmar despliegue si solo existe respaldo o commit.
8. Actualizar la documentación canónica sin copias redundantes.

## Estado vigente

- Backend canónico: **CS21A42**.
- Frontend integral: **CS21A42**.
- Backend completo: `Code_F98_4_Z6_CS21A42_CONSULTA_CERTIFICADOS_REFRESH_REAL_COMPLETO.txt`.
- SHA-256 TXT: `80a10e117c30bd563b810e5361c71b737df2229ca1eb87341fd1542036d26b3b`.
- Producción no confirmada.

## Consulta individual CS21A42

- `getConsultaIndividualFresh` agrupa ficha, asistencia, comentario e historial en una sola solicitud.
- `src/admin_students_fast_loader_cs21a42.js` comparte esa lectura entre las cuatro solicitudes antiguas.
- `getEstudianteFresh` invalida el caché individual y reconstruye la ficha real.
- Cambio de estatus no cierra la ventana hasta confirmar la lectura fresca posterior a la escritura.
- Si la lectura falla, la ventana permanece abierta; no se muestra una ficha vacía.
- El caché se invalida después de estatus, pagos, certificados, TOEIC, cambios de grupo y reversión.

## Certificados

Mostrar dos estados separados:

- Pago: PAGADO / PENDIENTE.
- Documento: EMITIDO / POR EMITIR.

Un certificado pagado sin `REG_CERTIFICADOS` debe mostrar `Pago confirmado. Documento oficial pendiente de emisión.`

Asignación por intento:

- Certificado usa `grupos_certificado_aplicados`.
- Otros rubros usan `grupos_pago_aplicados`.
- Coincidencia exacta de grupo primero.
- Un único intento permite asignación segura al intento único.
- Nunca mover pagos entre niveles o intentos.

Caso de control 17110:

- B1 APR con certificado emitido.
- B2 APR; certificado pagado; documento por emitir.
- I1 CA.
- I2 PE.

## Archivos frontend CS21A42

- `src/admin_students_fast_loader_cs21a42.js`
- `src/admin_students_status_fresh_cs21a42.jsx`
- `src/admin_students_certificate_integrity_cs21a42.jsx`
- `campus.html`

## Funciones preservadas

- CS21A41: código grande seleccionable en Seguimiento inmediato.
- CS21A40: mensaje WA seguro.
- CS21A38: tabla CONAPE compacta.
- CS21A36: pago dentro de Consulta individual.
- CS21A34: fuente externa oficial `7-morosidad`.

## Estado de despliegue

CS21A42 está guardado en GitHub `main` y respaldado en Drive, pero no se ha confirmado como publicado. Después de instalar el `Code.gs` completo y publicar frontend, probar 17110 y un cambio de estatus sin usar Ctrl+R.

---
