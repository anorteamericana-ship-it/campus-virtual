# SEC-002 · Documentos privados y entrega autenticada

**Fecha:** 2026-08-16  
**Base Git:** `main@67108928e953fbf044dbcd916dc34a5dd5f1e570`  
**Rama:** `fix/sec002-private-document-foundation`  
**Estado:** `EN PROGRESO · NO CAMBIO DE ACL · NO DEPLOY`

## 1. Decisión de seguridad

Los documentos personales, académicos y financieros del Campus deben permanecer privados en almacenamiento. Un enlace público de Drive no puede seguir funcionando como mecanismo de autorización.

La excepción debe ser explícita y limitada a assets que realmente son públicos, por ejemplo imágenes de interfaz/mercadeo de la inscripción pública.

El contrato queda versionado en:

`security/sec002_document_acl_contract.json`

## 2. Evidencia del backend canónico observado

Se auditó la copia respaldada del `Code.gs` canónico observada el 2026-08-16.

La búsqueda exacta de `DriveApp.Access.ANYONE_WITH_LINK` produce **13 ocurrencias de código**.

Clasificación por función:

| Función | Clase | ¿Puede ser pública? |
|---|---|---:|
| `_subirComprobanteADrive` | comprobante financiero | No |
| `uploadFotoPerfilEstudiante` | foto de perfil/pasaporte estudiante | No |
| `_exportarHojaComoPDF` | proforma/documento comercial con datos | No por defecto |
| `_guardarFotoProspecto` | identidad/título del prospecto | No |
| `subirDocumentoExtra` | documento adicional estudiante | No |
| `_matFirmadaFindLatestFile_` | matrícula firmada | No |
| `subirMatriculaFirmadaVentas` | matrícula firmada | No |
| `notificarMatriculaFirmadaVentas` | matrícula firmada | No |
| `_ventasDocPublicarSiSePuede_` | documento estudiantil generado para Ventas | No |
| `_ventasDocBuscarExistente_` | documento estudiantil generado para Ventas · 2 ocurrencias | No |
| `uploadInscripcionAdminImage` | asset de inscripción pública | **Sí, excepción explícita** |
| `_cs21a76PublicFile_` | CV/aval/documentación docente | No |

Resultado del inventario: **12 ocurrencias sensibles/no justificadas como públicas + 1 excepción pública deliberada**.

El auditor reproducible queda en:

`scripts/audit_sec002_drive_public_sharing.mjs`

Uso sobre una copia local del backend:

```text
node scripts/audit_sec002_drive_public_sharing.mjs --backend=/ruta/Code.gs
node scripts/audit_sec002_drive_public_sharing.mjs --backend=/ruta/Code.gs --enforce
```

El primer comando inventaría; `--enforce` debe fallar mientras exista una publicación sensible.

## 3. Evidencia de permisos reales en Drive

No se asumió que las llamadas de código demostraran por sí solas el estado actual de Drive.

Se consultaron permisos reales y se confirmó:

- `CAMPUS_VIRTUAL_DESIGN`, raíz operativa general, se observa privada/owner-only;
- `DOCUMENTOS_ESTUDIANTES`, raíz oficial de documentos estudiantiles, tiene actualmente un permiso `anyone -> reader`;
- una carpeta de grupo descendiente también expone `anyone -> reader`;
- un PDF de matrícula dentro de un subdirectorio de nivel también aparece `anyone -> reader`;
- una matrícula firmada encontrada en la misma superficie documental tiene permiso `anyone -> reader`.

Esto demuestra que SEC-002 no es únicamente una hipótesis estática del código: existe una exposición efectiva en la jerarquía documental observada.

## 4. Por qué no se retiró hoy el permiso de la raíz

Drive propaga permisos de carpetas a descendientes. Retirar `anyone` de `DOCUMENTOS_ESTUDIANTES` es necesario, pero hacerlo antes de sustituir el mecanismo de entrega puede romper funciones legítimas del Campus.

La dependencia se confirmó en la ruta de certificados:

1. `CertificadosView` llama `getMisCertificadosEstado` autenticado con token Campus.
2. El backend localiza el PDF dentro de `DOCUMENTOS_ESTUDIANTES`.
3. `buscarCertificadoExistente` devuelve `url` desde `file.getUrl()`.
4. El frontend usa `row.url` directamente como `href` de **Abrir Certificado**.

El token Campus protege la consulta que descubre el enlace, pero una vez obtenido, el acceso al archivo depende del ACL de Drive. Si el archivo se vuelve privado sin otra capa de entrega, un estudiante que no tenga identidad Google autorizada perderá el acceso aunque su sesión Campus sea válida.

Por eso **no se modificó ningún permiso real en esta fase**.

## 5. Nueva frontera de entrega

El contrato objetivo es:

```text
sesión Campus válida
  -> solicitud de documento lógico
  -> autorización server-side (usuario/rol/propiedad/clase)
  -> grant corto ligado a sujeto + documento
  -> gateway de documentos
  -> stream binario desde almacenamiento privado
```

El enlace de almacenamiento deja de ser autorización.

Requisitos mínimos del grant:

- un solo sujeto;
- un solo documento;
- vida máxima 120 s;
- firma u opacidad equivalente;
- rate limit;
- anti-replay para documentos de alta sensibilidad;
- logs sin contenido ni PII innecesaria.

El gateway debe poder leer el almacenamiento mediante una identidad de servicio autorizada y devolver el archivo sin volver público el origen.

## 6. Proveedor todavía no decidido

No se eligió Cloudflare, Google Cloud ni una migración a R2 en esta fase.

Razones:

- reutilizar el Worker de Speak LAB mezclaría dominios de seguridad sin necesidad;
- mover todos los documentos a otro almacenamiento sería una migración de datos grande;
- Apps Script Web App no es una buena frontera de streaming binario general y su contrato de salida web está orientado a HTML/texto;
- el almacenamiento actual ya contiene una estructura operativa importante que no debe desmontarse sin medir dependencias.

Primero se define el protocolo y se prueba una clase en QA. Después se elige la implementación con evidencia de costo, permisos, latencia y operación.

## 7. Orden de migración propuesto

### SEC-002A · Inventario

- completar clases/callers de las 13 publicaciones;
- inventariar raíces con ACL público;
- contar archivos sensibles efectivos sin publicar nombres/PII en Git;
- separar permisos explícitos de heredados.

### SEC-002B · Gateway QA

Empezar por **certificado estudiantil**, porque su consumidor ya está claramente trazado y es read-only:

- token Campus;
- autorización del estudiante sobre su propio certificado;
- grant corto;
- archivo privado;
- descarga desde navegador sin cuenta Google;
- negativo: otro estudiante no puede obtenerlo;
- expiración y replay.

### SEC-002C · Migración por clase

Después de PASS de certificados:

1. certificados;
2. matrículas firmadas;
3. cédula/título/fotos;
4. documentos extra;
5. comprobantes financieros;
6. proformas de Ventas;
7. CV/aval/documentos docentes.

Cada clase debe tener rollback antes de retirar su publicación.

### SEC-002D · Raíz

Solo cuando ningún consumidor dependa del ACL público:

- retirar `anyone` en `DOCUMENTOS_ESTUDIANTES` desde el padre que origina la herencia;
- recorrer descendientes y eliminar publicaciones explícitas residuales;
- ejecutar reporte final de exposición;
- bloquear en backend la creación de nuevas publicaciones sensibles.

## 8. Gate de cierre

SEC-002 no se cierra hasta demostrar:

- raíz `DOCUMENTOS_ESTUDIANTES` privada;
- cero archivos sensibles `anyone` en un escaneo real;
- uploads nuevos privados;
- certificado del estudiante descargable mediante sesión Campus sin ACL público;
- pruebas negativas de propiedad/rol/grant expirado;
- documentos de Ventas, docentes y financieros migrados;
- `INSCRIPCION_PUBLICA` aislada como única clase pública aprobada o lista equivalente explícita;
- rollback probado antes de migrar permisos productivos.

## 9. Límites de esta rama

No modifica:

- ACL reales de Drive;
- `Code.gs` productivo;
- deployment Apps Script;
- Memory Match / PR #83;
- English LAB / PR #85;
- Speak LAB / PR #104;
- Ventas productivo;
- datos de estudiantes.
