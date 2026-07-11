# FUENTE VERDADERA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

**Versión integral vigente:** F98.4-Z6-CS21A42  
**Backend canónico:** F98.4-Z6-CS21A42  
**Frontend activo:** F98.4-Z6-CS21A42  
**Corte:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · `main`

Los documentos sin sufijo de versión dentro de `00_DOCUMENTACION` son los únicos canónicos. El historial anterior permanece en Git.

## 1. Backend canónico CS21A42

El único backend válido es el `Code.gs` completo respaldado como:

- TXT: `Code_F98_4_Z6_CS21A42_CONSULTA_CERTIFICADOS_REFRESH_REAL_COMPLETO.txt`
- ZIP: `Code_F98_4_Z6_CS21A42_CONSULTA_CERTIFICADOS_REFRESH_REAL_COMPLETO.zip`
- TXT Drive ID: `1FpHFcCSjrM_MHp0CUHjzmPvFABCAUwWV`
- ZIP Drive ID: `1rG_WuF3aAd4dESWi_s82N3QBL6OAOoEd`
- Tamaño TXT: 2.874.656 bytes
- SHA-256 TXT: `80a10e117c30bd563b810e5361c71b737df2229ca1eb87341fd1542036d26b3b`
- Tamaño ZIP: 738.733 bytes
- SHA-256 ZIP: `21be937d228f86c13881554adbae1568ba18b4455d81fc84851f4e08b7f8d7e9`
- Validación: `node --check` aprobada.

Respaldado o guardado no significa desplegado. Producción solo se confirma con evidencia de una nueva versión publicada en Apps Script.

## 2. Consulta individual: lectura rápida y coherente

CS21A42 incorpora:

- `getEstudianteFresh`: elimina el caché corto del estudiante, ejecuta una lectura real y vuelve a poblar el caché con la ficha vigente.
- `getConsultaIndividualFresh`: devuelve en una sola solicitud la ficha, asistencia, comentario administrativo e historial del mismo ciclo de lectura.
- `src/admin_students_fast_loader_cs21a42.js`: unifica las cuatro solicitudes del panel en una sola llamada, reduciendo viajes HTTP y evitando mezclar respuestas de momentos distintos.
- `src/admin_students_status_fresh_cs21a42.jsx`: después de cambiar ESTATUS, la ventana permanece abierta hasta reconstruir la ficha real; ya no depende de un `window.location.reload()` inmediato que pueda recuperar el caché anterior.

El caché individual también se invalida después de operaciones críticas como cambio de estatus, pago, certificado, TOEIC, cambio de grupo y reversión.

## 3. Certificado: pago y documento son estados diferentes

La Consulta individual debe presentar dos líneas independientes:

- **Pago:** `PAGADO` o `PENDIENTE ₡...`.
- **Documento:** `EMITIDO` o `POR EMITIR`.

Reglas:

- Un certificado pagado sin registro en `ESTATUS.REG_CERTIFICADOS` muestra: `Pago confirmado. Documento oficial pendiente de emisión.`
- Un registro oficial existente muestra `Documento: EMITIDO` y su número.
- Un saldo financiero real muestra `Pago: PENDIENTE`.
- Nunca se interpreta `POR EMITIR` como falta de pago.

El backend asigna pagos de certificado por nivel e intento usando `grupos_certificado_aplicados`; los demás rubros continúan usando `grupos_pago_aplicados`. La coincidencia exacta de grupo tiene prioridad. Solo cuando existe un único intento se permite una asignación segura al intento único. Nunca se mueve un pago entre niveles o intentos.

Archivo visual:

- `src/admin_students_certificate_integrity_cs21a42.jsx`

## 4. Caso de control 17110

La lectura viva de APOLLO confirma:

- B1: APR, certificado emitido.
- B2: APR, certificado pagado por ₡15.000, documento todavía no emitido.
- I1: CA.
- I2: PE.

Por tanto, B2 debe verse como:

- Estado académico: `APR`.
- Pago del certificado: `PAGADO`.
- Documento: `POR EMITIR`.

La captura que mostraba B2 en CA correspondía a una ficha anterior recuperada desde el caché corto.

## 5. Archivos frontend CS21A42

- `src/admin_students_fast_loader_cs21a42.js`
- `src/admin_students_status_fresh_cs21a42.jsx`
- `src/admin_students_certificate_integrity_cs21a42.jsx`
- `campus.html`

Se preservan:

- CS21A41: código grande y seleccionable en Seguimiento inmediato.
- CS21A40: mensaje WA con emoticono Unicode seguro y negritas reales.
- CS21A38: tabla CONAPE compacta sin scroll horizontal.
- CS21A36: aplicar pago dentro de Consulta individual.
- CS21A34: lectura directa de la fuente externa oficial `7-morosidad`.

## 6. Reglas críticas preservadas

- El frontend no escribe directamente en `PAGOS`, `OTROS PAGOS`, `DATOS`, `ESTATUS`, `GRUPOS` o `INTENTOS_ACADEMICOS`.
- Apps Script conserva la autoridad sobre deuda, intento, grupo, comprobantes, emisión y sincronización CONAPE.
- No se trasladan pagos entre niveles o intentos.
- La fuente oficial de morosidad continúa siendo `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`, pestaña `Hoja 1`.
- CONAPE continúa manual y sin triggers automáticos.

## 7. Estado de despliegue

CS21A42 está guardado en GitHub `main` y respaldado en Drive. No existe evidencia suficiente para afirmar que el frontend ni el backend CS21A42 estén publicados en producción.
