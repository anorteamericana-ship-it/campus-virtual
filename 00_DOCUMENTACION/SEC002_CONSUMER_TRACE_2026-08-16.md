# SEC-002 · Traza de consumidores de documentos

**Fecha:** 2026-08-16  
**Base:** `main@67108928e953fbf044dbcd916dc34a5dd5f1e570`  
**Rama:** `fix/sec002-private-document-foundation`  
**Estado:** `E0/E1/E2 parcial · NO ACL CHANGE · NO DEPLOY`

## Propósito

Complementar el inventario de `ANYONE_WITH_LINK` con la otra mitad del contrato: qué pantalla consume hoy la URL directa, qué mecanismo de entrega debe reemplazarla y qué debe probarse antes de retirar permisos públicos.

Este documento **no autoriza migrar ACL productivos**. La secuencia obligatoria sigue siendo: consumidor identificado -> entrega autenticada -> QA -> cambio de ACL en copia/entorno QA -> verificación negativa -> migración de existentes -> producción con rollback.

## Resumen ejecutivo de consumidores

| Clase | Publicación actual | Consumidor confirmado | Dependencia pública actual | Reemplazo requerido |
|---|---|---|---|---|
| Certificado estudiantil | búsqueda/entrega termina en URL Drive pública | `src/student_modules.jsx` | `<a href={row.url}>` | descarga autenticada por código+nivel y Blob |
| Foto de perfil estudiante | `uploadFotoPerfilEstudiante` | `src/student_dashboard.jsx` | `<img src={FOTO_PERFIL_URL}>` | lectura autenticada del propio estudiante y ObjectURL |
| Cédula frente/dorso + título | `_guardarFotoProspecto` | `src/matriculas_admin.jsx` | imagen directa desde campos `FOTO_*` | lectura staff autorizada por expediente y ObjectURL |
| Matrícula firmada | flujo Ventas / alertas | `src/ventas_drawer.jsx`, correo/campus | `signedDoc.url`, alerta y WhatsApp | descarga autenticada; adjunto correo; alerta con referencia lógica; WhatsApp manual o grant corto futuro |
| Documento extra estudiante | `subirDocumentoExtra` | `src/ventas_drawer.jsx` | `doc.url`; además contrato DTO/UI roto | endpoint de listado+lectura privada por expediente; corregir DTO antes de ACL |
| Comprobante de pago | `_subirComprobanteADrive` | `src/solicitudes_pago.jsx` | `window.open`, `<img src>`, `<a href>` | evidencia autenticada por solicitud y Blob/ObjectURL |
| Proforma comercial | `_exportarHojaComoPDF` | `src/matriculas_admin.jsx` | descarga directa + URL incrustada en WhatsApp | descarga staff autenticada; WhatsApp por adjunto manual o grant temporal futuro |
| Documentos generados Ventas | `_ventasDoc*` | `DocsEstudianteVentas` | `window.open(r.url)` | entrega autenticada preservando scope de Ventas |
| Perfil/documentos docente | `_cs21a76PublicFile_` | `src/teacher_profile_cs21a76.jsx` | `<img src>` + `window.open(vista_url)` | lectura autenticada por identidad docente/staff y Blob/ObjectURL |
| Asset inscripción público | `uploadInscripcionAdminImage` | inscripción pública | publicación deliberada | **mantener público**, aislado de documentos sensibles |

## Certificado estudiantil

- Frontend: `src/student_modules.jsx`.
- `CertificadosView` recibe `row.url` desde `getMisCertificadosEstado`.
- El botón **Abrir Certificado** usa `href={row.url}` directamente.
- Consecuencia: privatizar el PDF sin reemplazar esta apertura rompe al estudiante aunque la consulta previa esté autenticada.
- Piloto preparado: `descargarMiCertificadoPrivado` devuelve PDF `<= 2 MiB` como base64 autenticado, sin Drive URL ni `file_id`.
- Contrato del piloto: sesión Campus obligatoria; `codigo+nivel`; estudiante limitado a su propio código; roles administrativos autorizados; PDF-only; rate limit 5/60s; digest SHA-256 en respuesta.
- El delta de 5 hunks reconstruye byte por byte el candidato de referencia y no introduce `ANYONE_WITH_LINK`.
- **Gate vigente:** probar primero el endpoint en Apps Script QA. Solo después se modifica `CertificadosView` para reconstruir Blob/ObjectURL y finalmente se prueba un certificado QA sin permiso `anyone`.

## Foto de perfil del estudiante

### Backend

`uploadFotoPerfilEstudiante` publica la imagen y persiste:

- `FOTO_PERFIL_URL` como URL de consumo web;
- `FOTO_PERFIL_DRIVE_URL` como enlace Drive;
- la respuesta de subida incluye `foto_url`.

La identidad/propiedad ya existe en el flujo de sesión del Campus, pero la imagen queda accesible fuera de sesión una vez conocida la URL.

### Consumidores verificados

El consumidor primario confirmado es `src/student_dashboard.jsx`:

- inicia desde `est.FOTO_PERFIL_URL || est.foto_perfil_url || est.FOTO_URL`;
- después de subir, toma `res.foto_url`;
- renderiza directamente `<img src={fotoUrl}>`.

Se revisaron además los shells principales `src/student_portal.jsx`, `src/student_experience.jsx`, `src/sidebar.jsx` y `src/admin_students.jsx`; no se encontró consumo de `FOTO_PERFIL_URL` en esos archivos.

### Migración

- endpoint privado que resuelva la foto desde el **sujeto autenticado**, no desde un `file_id` elegido por cliente;
- student: solo su propia foto;
- staff: solo si existe un caso de uso y permiso explícito;
- respuesta acotada a MIME de imagen permitido y tamaño máximo;
- frontend reconstruye ObjectURL y revoca el objeto al sustituir/desmontar;
- `FOTO_PERFIL_URL` deja de ser mecanismo de autorización/entrega; puede conservarse temporalmente solo como dato legado durante migración, sin depender de él para renderizar.

## Fotos de inscripción / identidad

### Backend

`_guardarFotoProspecto` guarda en `DOCUMENTOS_ESTUDIANTES/{CEDULA}/INSCRIPCION/` y publica:

- cédula frente -> `FOTO_CED_FRENTE`;
- cédula dorso -> `FOTO_CED_DORSO`;
- título/estudios -> `FOTO_TITULO`.

Estas imágenes son de **alta sensibilidad** y no deben ser world-readable.

### Consumidor confirmado

`src/matriculas_admin.jsx` muestra **Documentos adjuntos** y resuelve exactamente:

- `foto_ced_frente` / `FOTO_CED_FRENTE`;
- `foto_ced_dorso` / `FOTO_CED_DORSO`;
- `foto_titulo` / `FOTO_TITULO`.

El componente de foto construye candidatos de visualización Drive/lh3 a partir del origen persistido, por lo que el visor actual depende de que el archivo sea alcanzable sin una autorización Campus adicional.

### Migración

- endpoint staff-only por **expediente lógico + tipo de documento**;
- autorización server-side por rol/scope antes de tocar Drive;
- el cliente no envía un `file_id` arbitrario;
- respuesta imagen acotada y ObjectURL;
- eliminar después los campos públicos `FOTO_*` como mecanismo de entrega, conservando referencias internas si son necesarias para migración/compatibilidad.

## Perfil docente

- Frontend: `src/teacher_profile_cs21a76.jsx`.
- `getPerfilDocenteCS21A76` devuelve `foto.url`, `curriculum.vista_url` y `aval_ina.vista_url` derivados del file ID.
- La foto usa `<img src={photo}>`.
- Currículum/aval usan `window.open(document.vista_url, ...)`.
- Backend: `uploadFotoPerfilDocenteCS21A76` y `uploadDocumentoDocenteCS21A76` llaman `_cs21a76PublicFile_`, que publica `ANYONE_WITH_LINK`.
- Riesgo: quitar publicación rompe foto y botón Abrir.
- Migración requerida: endpoints autenticados que deriven el archivo desde la identidad docente de sesión o desde un scope staff permitido; el cliente no debe elegir un file ID arbitrario. Foto puede reconstruirse como ObjectURL; PDF puede abrirse desde Blob.

## Matrícula firmada · Ventas

- Frontend: `src/ventas_drawer.jsx`.
- Tras `subirMatriculaFirmadaVentasSeguro`, `signedDoc.url` se usa para:
  - botón **Ver firmado**;
  - texto de WhatsApp;
  - notificación por correo/campus a través del backend.
- Backend ya aplica sesión/rol/ownership en `_matFirmadaAuth_`, pero después publica el archivo y convierte la URL de almacenamiento en mecanismo de entrega.
- `_matFirmadaSendEmail_` ya adjunta `file.getBlob()` al correo; el enlace público es redundante para entrega por email y puede retirarse tras QA.
- `_matFirmadaAddCampusAlert_` guarda actualmente la URL pública en la alerta; debe guardar una referencia lógica y resolverla con sesión del estudiante, no exponer Drive URL.
- WhatsApp Web no puede adjuntar automáticamente un PDF privado local con el flujo actual. Cierre P1 seguro: descarga autenticada + adjunto manual; un grant temporal de gateway sería una mejora posterior, no requisito para mantener `anyone`.

## Documentos extra del estudiante · Ventas

### Backend

`subirDocumentoExtra`:

- guarda en `DOCUMENTOS_ESTUDIANTES/{CEDULA}/02_DOCUMENTOS`;
- crea el archivo;
- aplica `ANYONE_WITH_LINK`;
- responde con una URL de archivo.

`getProspectoDetalle` vuelve a enumerar `02_DOCUMENTOS` y arma `docs_extra` con objetos de forma aproximada:

```text
{ nombre, url, fecha }
```

La URL es `https://drive.google.com/file/d/<id>/view`.

### Frontend y defecto de contrato adicional

`src/ventas_data.jsx` preserva el objeto respuesta completo al normalizar `prospecto`, por lo que el wrapper **no** es quien pierde `docs_extra`.

La pérdida ocurre en `src/ventas_drawer.jsx`:

```text
setDetalle(d.prospecto || d)
```

Cuando existe `d.prospecto`, el drawer descarta los hermanos `d.docs_extra`, `d.notas` y `d.conape_eventos` del DTO.

Además existe una segunda incompatibilidad:

- backend enumera `{ nombre, url, fecha }`;
- UI de documentos espera principalmente `{ nombre_archivo, mime_type, url, fecha }`.

Después de una subida exitosa, el drawer inyecta un objeto local con `nombre_archivo` y un **data URI/base64** como `url`, por eso el documento puede parecer visible inmediatamente; tras recargar, la lista persistente no se reconstruye de forma equivalente.

### Implicación

SEC-002 no debe “privatizar” esta clase perpetuando un contrato defectuoso. Antes del ACL:

1. corregir DTO/listado de documentos extra;
2. conservar los hermanos de `getProspectoDetalle` o separar un endpoint específico;
3. devolver referencia lógica, no Drive URL;
4. lectura privada por expediente + rol/scope Ventas/admin;
5. QA de subida -> recarga -> listado -> apertura -> autorización negativa;
6. solo después retirar `anyone` de archivos existentes/nuevos.

Este defecto de persistencia/UI es adyacente a SEC-002 y debe registrarse como bug de contrato; no se mezcla silenciosamente con el piloto de certificado.

## Comprobantes financieros

### Backend

`_subirComprobanteADrive`:

- guarda bajo `DOCUMENTOS_FOLDER/SOLICITUDES_PAGO`;
- crea JPG/PNG/PDF;
- publica `ANYONE_WITH_LINK`;
- devuelve `https://lh3.googleusercontent.com/d/<fileId>`.

`reportarPago` usa ese helper, persiste la URL en `SOLICITUDES_PAGO.URL_COMPROBANTE` y la devuelve en la respuesta. La imagen/PDF es evidencia para revisión administrativa; no automatiza la aplicación del dinero.

### Consumidor administrativo

`src/solicitudes_pago.jsx` depende directamente de `sol.url_comprobante`:

- PDF: `window.open(url, '_blank', ...)`;
- imagen: `<img src={sol.url_comprobante}>`;
- modal: `<a href={sol.url_comprobante}>Abrir en pestaña nueva</a>`;
- la tabla decide si mostrar **Ver** por la existencia de esa URL.

### Migración

- endpoint `solicitud_id -> evidencia` autenticado;
- autorización administrativa/financiera según matriz vigente;
- no aceptar `file_id` arbitrario;
- imagen/PDF por base64/Blob para tamaños acotados o gateway de grant corto si excede límites prácticos;
- la hoja puede conservar un identificador interno, pero no debe requerir una URL world-readable;
- migrar filas existentes antes de retirar ACL, porque hoy `URL_COMPROBANTE` es el locator operativo.

## Proformas comerciales

### Backend

`_exportarHojaComoPDF`:

- guarda en `DOCUMENTOS_ESTUDIANTES/{CEDULA}/03_PROFORMAS`;
- reemplaza PDF del mismo nombre al regenerar;
- publica `ANYONE_WITH_LINK`;
- devuelve `https://drive.google.com/file/d/<id>/view`.

Lo usan la proforma de programa y la proforma opcional de equipo.

### Consumidor

`src/matriculas_admin.jsx`:

- carga URL existente desde campos de proforma;
- al generar toma `r.url_programa` / `r.url_equipo`;
- renderiza **Descargar** con `<a href={url} target="_blank">`;
- construye texto de WhatsApp que incluye `Podés verla aquí: ${url}`.

### Implicación

La publicación pública no solo sostiene la descarga del administrador: hoy también funciona como canal de entrega al prospecto por WhatsApp.

Cierre P1 seguro:

- descarga autenticada para staff;
- quitar dependencia del enlace público persistente;
- para WhatsApp, descargar y adjuntar manualmente el PDF privado en la transición;
- un grant corto específico para destinatario/documento puede estudiarse después si realmente aporta valor y tiene expiración/replay/telemetría;
- no mantener `anyone` indefinidamente por conveniencia comercial.

## Documentos de Ventas generados

- Backend: `_ventasDocBuscarExistente_` y `_ventasDocPublicarSiSePuede_` hacen públicos PDFs ya existentes/generados.
- Consumidor observado: `DocsEstudianteVentas` llama `generarDocumentoVentasSeguro` y hace `window.open(r.url, ...)`.
- Tipos visibles incluyen hoja/certificado de matrícula y carta de no deuda CONAPE; contienen contexto individual y no deben depender de ACL mundial.
- Migración: la autorización existente de Ventas debe preservarse, pero la respuesta debe entregar un documento privado o grant corto, nunca `file.getUrl()` como autorización.

## Asset público permitido

- `uploadInscripcionAdminImage` publica imágenes de interfaz/mercadeo de la inscripción pública.
- Esta publicación es una **excepción deliberada**, no debe caer en una sustitución global de `ANYONE_WITH_LINK`.
- Debe permanecer aislada de carpetas con identidad, finanzas, documentos académicos o docentes.

## Restricciones técnicas verificadas

Apps Script `ContentService` entrega texto/JSON, no un stream binario PDF/JPEG general. Por eso el piloto pequeño usa base64 dentro de la respuesta autenticada y el navegador reconstruye un Blob. Esto no debe extrapolarse a documentos grandes sin medir tamaño/latencia.

La existencia de un campo `url`, `file_url`, `foto_url`, `vista_url` o equivalente **no puede seguir interpretándose como autorización**. En la arquitectura objetivo, el locator persistente debe ser interno/lógico y el backend debe decidir si el sujeto autenticado puede leer el objeto.

## Orden seguro actualizado

1. Validar `descargarMiCertificadoPrivado` en Apps Script QA.
2. Adaptar `CertificadosView` en una rama/PR pequeño **solo después del PASS backend**.
3. Hacer privada una copia QA de certificado y demostrar apertura sin permiso `anyone`.
4. Repetir el patrón con matrícula firmada, separando Campus/correo/WhatsApp.
5. Corregir contrato de `docs_extra` antes de privatizar esa clase.
6. Migrar cédula/título y foto de perfil con endpoints de imagen autenticados.
7. Migrar comprobantes financieros preservando el flujo administrativo.
8. Migrar proformas separando descarga staff de distribución por WhatsApp.
9. Migrar documentos/perfil docente y documentos generados de Ventas.
10. Inventariar y migrar objetos existentes por clase.
11. Solo al final retirar `anyone` de la raíz que origine herencia y escanear residuos.
12. Confirmar que `uploadInscripcionAdminImage` sigue funcionando dentro de un subtree público deliberadamente aislado.

## Evidencia mínima por clase antes de quitar ACL

- consumidor nuevo usa sesión Campus;
- autorización negativa prueba rol/ownership/scope incorrecto;
- no se acepta `file_id` arbitrario como autoridad;
- tipo MIME y tamaño están acotados;
- lectura no crea, borra, trasha ni cambia permisos;
- navegador móvil + escritorio abre/renderiza correctamente;
- archivo/copia QA funciona con permiso `anyone` retirado;
- existe rollback documentado;
- existentes tienen estrategia de migración, no solo nuevos uploads.

## Invariante

**Ningún documento sensible se vuelve privado antes de que su consumidor tenga una ruta autenticada equivalente, y ningún consumidor nuevo puede depender de una URL pública persistente de Drive.**
