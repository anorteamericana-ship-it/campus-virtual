# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — ESTADO VIGENTE

**Versión integral:** F98.4-Z6-CS21A42  
**Backend canónico:** F98.4-Z6-CS21A42  
**Frontend activo:** F98.4-Z6-CS21A42  
**Corte documental:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · rama `main`

## 1. Cambio CS21A42

CS21A42 corrige la consistencia de **Consulta individual** en tres frentes:

1. Reduce la carga inicial de cuatro solicitudes a una lectura agrupada.
2. Después de cambiar ESTATUS, no cierra la ventana hasta obtener la ficha real posterior a la escritura.
3. Separa claramente el pago del certificado de la emisión del documento.

## 2. Archivos frontend

- `src/admin_students_fast_loader_cs21a42.js`
- `src/admin_students_status_fresh_cs21a42.jsx`
- `src/admin_students_certificate_integrity_cs21a42.jsx`
- `campus.html`

El flujo de pago CS21A36, el panel CONAPE CS21A41 y el mensaje WA CS21A40 permanecen preservados.

## 3. Backend completo

CS21A42 modifica Apps Script. La entrega válida es el `Code.gs` completo:

- TXT: `Code_F98_4_Z6_CS21A42_CONSULTA_CERTIFICADOS_REFRESH_REAL_COMPLETO.txt`
- ZIP: `Code_F98_4_Z6_CS21A42_CONSULTA_CERTIFICADOS_REFRESH_REAL_COMPLETO.zip`
- SHA-256 TXT: `80a10e117c30bd563b810e5361c71b737df2229ca1eb87341fd1542036d26b3b`
- SHA-256 ZIP: `21be937d228f86c13881554adbae1568ba18b4455d81fc84851f4e08b7f8d7e9`
- TXT: 2.874.656 bytes.
- ZIP: 738.733 bytes.
- Sintaxis backend: aprobada con `node --check`.

## 4. Carga de Consulta individual

Nuevo endpoint:

- `getConsultaIndividualFresh`

Entrega en una sola respuesta:

- ficha académica y financiera;
- asistencia;
- comentario administrativo;
- historial de cambios.

El módulo `admin_students_fast_loader_cs21a42.js` comparte una sola promesa entre las cuatro solicitudes que la interfaz antigua iniciaba en paralelo. Así la pantalla recibe un conjunto coherente y reduce el costo de red.

## 5. Cambio de estatus

Nuevo endpoint de control:

- `getEstudianteFresh`

Después de guardar:

1. Se invalida el caché corto del estudiante.
2. Se fuerza `SpreadsheetApp.flush()`.
3. Se reconstruye la ficha desde las fuentes vigentes.
4. Solo entonces se cierra la ventana y se actualiza el panel.

Si la reconstrucción falla, la ventana permanece abierta y muestra el error. No se presenta una ficha vacía ni se obliga al usuario a usar `Ctrl+R`.

## 6. Certificados

La tarjeta de certificado separa:

- **Pago financiero**: PAGADO / PENDIENTE.
- **Documento oficial**: EMITIDO / POR EMITIR.

Un certificado pagado sin registro oficial no se muestra como deuda. El mensaje correcto es:

> Pago confirmado. Documento oficial pendiente de emisión.

La asignación de pagos del certificado usa `grupos_certificado_aplicados`. Otros rubros usan `grupos_pago_aplicados`. La coincidencia exacta de grupo tiene prioridad y nunca se mueve un pago entre niveles o intentos.

## 7. Caso de QA obligatorio: estudiante 17110

Resultado esperado:

- B1: APR y certificado emitido.
- B2: APR.
- B2 certificado: Pago PAGADO · Documento POR EMITIR.
- I1: CA.
- I2: PE.

Pruebas:

1. Abrir Consulta individual del código 17110.
2. Confirmar que B2 ya no aparece CA por una ficha vieja.
3. Expandir B2 y verificar las dos líneas del certificado.
4. Cambiar un estatus de prueba y confirmar que la ventana muestra `Reconstruyendo ficha real…`.
5. Confirmar que la vista se actualiza sin `Ctrl+R`.
6. Aplicar un pago controlado y verificar que el panel se refresque con el saldo real.

## 8. Estado de despliegue

Código guardado en GitHub `main` y backend respaldado en Drive. Producción no está confirmada.
