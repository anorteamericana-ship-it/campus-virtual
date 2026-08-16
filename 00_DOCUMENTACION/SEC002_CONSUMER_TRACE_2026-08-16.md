# SEC-002 · Traza de consumidores de documentos

**Fecha:** 2026-08-16  
**Base:** `main@67108928e953fbf044dbcd916dc34a5dd5f1e570`  
**Rama:** `fix/sec002-private-document-foundation`  
**Estado:** `E0/E1 · NO ACL CHANGE · NO DEPLOY`

## Propósito

Complementar el inventario de `ANYONE_WITH_LINK` con la otra mitad del contrato: qué pantalla consume hoy la URL directa y qué debe cambiar antes de retirar permisos públicos.

No autoriza migrar ACL productivos.

## Certificado estudiantil

- Frontend: `src/student_modules.jsx`.
- `CertificadosView` recibe `row.url` desde `getMisCertificadosEstado`.
- El botón **Abrir Certificado** usa `href={row.url}` directamente.
- Consecuencia: privatizar el PDF sin reemplazar esta apertura rompe al estudiante aunque la consulta previa esté autenticada.
- Piloto preparado: `descargarMiCertificadoPrivado` devuelve PDF <=2 MiB como base64 autenticado, sin Drive URL/file_id.
- Siguiente gate: probar el endpoint en Apps Script QA y luego adaptar el frontend a Blob/ObjectURL antes de tocar ACL.

## Perfil docente

- Frontend: `src/teacher_profile_cs21a76.jsx`.
- `getPerfilDocenteCS21A76` devuelve `foto.url`, `curriculum.vista_url` y `aval_ina.vista_url` derivados del file ID.
- La foto usa `<img src={photo}>`.
- Currículum/aval usan `window.open(document.vista_url, ...)`.
- Backend: `uploadFotoPerfilDocenteCS21A76` y `uploadDocumentoDocenteCS21A76` llaman `_cs21a76PublicFile_`, que publica `ANYONE_WITH_LINK`.
- Riesgo: quitar publicación rompe foto y botón Abrir.
- Migración requerida: endpoints autenticados que deriven el archivo desde la identidad docente de sesión; el cliente no debe elegir un file ID arbitrario. Foto puede reconstruirse como ObjectURL; PDF puede abrirse desde Blob.

## Matrícula firmada · Ventas

- Frontend: `src/ventas_drawer.jsx`.
- Tras `subirMatriculaFirmadaVentasSeguro`, `signedDoc.url` se usa para:
  - botón **Ver firmado**;
  - texto de WhatsApp;
  - notificación por correo/campus a través del backend.
- Backend ya aplica sesión/rol/ownership en `_matFirmadaAuth_`, pero después publica el archivo y convierte la URL de almacenamiento en mecanismo de entrega.
- `_matFirmadaSendEmail_` ya adjunta `file.getBlob()` al correo; el enlace público es redundante para entrega por email y puede retirarse tras QA.
- `_matFirmadaAddCampusAlert_` guarda actualmente la URL pública en la alerta; debe guardar una referencia lógica/ID interno y resolverla con sesión del estudiante, no exponer Drive URL.
- WhatsApp web no puede adjuntar automáticamente el PDF local desde una URL privada usando el flujo actual. Cierre P1 seguro: descargar autenticadamente y requerir adjunto manual, o introducir después un grant temporal mediante gateway dedicado. No mantener `anyone` solo por comodidad del botón WhatsApp.

## Documentos de Ventas generados

- Backend: `_ventasDocBuscarExistente_` y `_ventasDocPublicarSiSePuede_` hacen públicos PDFs ya existentes/generados.
- Consumidor observado: `DocsEstudianteVentas` llama `generarDocumentoVentasSeguro` y hace `window.open(r.url, ...)`.
- Tipos visibles incluyen hoja/certificado de matrícula y carta de no deuda CONAPE; contienen contexto individual y no deben depender de ACL mundial.
- Migración: la autorización existente de Ventas debe preservarse, pero la respuesta debe entregar un documento privado o grant corto, nunca `file.getUrl()` como autorización.

## Foto de perfil estudiante

- Backend: `uploadFotoPerfilEstudiante` publica el archivo y persiste `FOTO_PERFIL_URL`/`FOTO_PERFIL_DRIVE_URL`.
- La identidad/propiedad ya está en el flujo de sesión del Campus, pero la imagen queda accesible fuera de sesión una vez conocida la URL.
- Antes de migrar ACL debe trazarse cada consumidor de `FOTO_PERFIL_URL` y reemplazarlo por lectura autenticada/Blob.

## Fotos de inscripción / identidad

- Backend: `_guardarFotoProspecto` guarda cédula frente, cédula dorso y título y los hace `ANYONE_WITH_LINK` para que el dashboard los muestre.
- Estos archivos son alta sensibilidad y no deben ser world-readable.
- El dashboard debe recibirlos solo mediante sesión staff autorizada; nunca mediante URL pública persistida.

## Comprobantes financieros

- Backend: `_subirComprobanteADrive` publica comprobantes y devuelve URL directa.
- Deben permanecer privados y entregarse únicamente a los roles/propietarios autorizados.
- Antes de cambiar ACL hay que trazar los consumidores de la URL en solicitudes/aplicación de pagos y reemplazar la apertura directa.

## Asset público permitido

- `uploadInscripcionAdminImage` publica imágenes de interfaz/mercadeo de la inscripción pública.
- Esta publicación es una **excepción deliberada**, no debe caer en una sustitución global de `ANYONE_WITH_LINK`.
- Debe permanecer aislada de carpetas con identidad, finanzas, documentos académicos o docentes.

## Restricciones técnicas verificadas

Apps Script `ContentService` entrega texto/JSON, no un stream binario PDF/JPEG general. Por eso el piloto pequeño usa base64 dentro de la respuesta autenticada y el navegador reconstruye un Blob. Esto no debe extrapolarse a documentos grandes sin medir tamaño/latencia.

## Orden seguro actualizado

1. Validar `descargarMiCertificadoPrivado` en Apps Script QA.
2. Adaptar `CertificadosView` en una rama/PR pequeño; conservar fallback solo en QA durante transición.
3. Hacer privada una copia QA de certificado y demostrar apertura sin permiso `anyone`.
4. Repetir el patrón con matrícula firmada, separando Campus/correo/WhatsApp.
5. Migrar fotos/documentos docentes y perfiles.
6. Migrar comprobantes/identidad/proformas.
7. Solo al final retirar `anyone` de la raíz que origine herencia y escanear residuos.

## Invariante

**Ningún documento sensible se vuelve privado antes de que su consumidor tenga una ruta autenticada equivalente, y ningún consumidor nuevo puede depender de una URL pública persistente de Drive.**
