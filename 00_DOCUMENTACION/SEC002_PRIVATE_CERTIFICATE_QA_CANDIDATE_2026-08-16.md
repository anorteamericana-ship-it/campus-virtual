# SEC-002 · Candidato QA de certificado privado

**Fecha:** 2026-08-16  
**Estado:** `CANDIDATO QA NO INSTALADO · NO ACL CHANGE · NO DEPLOY`

## Objetivo

Probar la primera sustitución concreta del contrato inseguro `sesión Campus -> URL pública de Drive` sin introducir todavía un gateway externo ni cambiar permisos productivos.

El piloto se limita a certificados PDF pequeños.

## Evidencia de tamaño

Una muestra de certificados reales observados en Drive está aproximadamente entre 0,54 MB y 0,78 MB. Un certificado reciente de ~0,78 MB tiene actualmente permiso `anyone -> reader`.

Por ese tamaño, una respuesta autenticada one-shot con base64 es suficientemente pequeña para merecer una prueba QA antes de desplegar infraestructura adicional.

Esto **no** implica usar base64 como solución general para documentos grandes.

## Hallazgo adicional: lectura con efecto destructivo

`getMisCertificadosEstado()` llama `buscarCertificadoExistente()`.

La implementación observada de `buscarCertificadoExistente()` selecciona el PDF más reciente y, si detecta otras copias, llama `_certF984TEliminarDuplicadosOficiales_`, que usa `file.setTrashed(true)`.

Consecuencia: una consulta de estado de certificados puede enviar archivos a la papelera como efecto colateral.

El candidato QA corrige esa frontera:

- la búsqueda elige la copia más reciente;
- reporta `duplicados_detectados`;
- fija `duplicados_eliminados:0`;
- no llama la rutina de papelera;
- la limpieza permanece disponible en flujos explícitos de generación/administración, no en lectura.

## Candidato backend completo

Base:

`BACKUP_PRE_SEC001_Code_2026-08-16.gs`

SHA-256 base:

`d24fc63c59e60ba92808d4d870f4eb95e35bb6f1c158a130229b187a66e35d37`

Candidato QA en Drive:

`SEC002_PRIVATE_CERT_QA_CANDIDATE_2026-08-16.gs`

Drive ID:

`1lnaoEAUjqz5M05LsYxVoNNk9RgfXLy8z`

Tamaño:

`2.977.488 bytes`

SHA-256 después de descargarlo nuevamente desde Drive:

`c06c20c66c85f88532dd43330401ebee72121570e704365c4905216e37b8dc5b`

El SHA descargado coincide con el candidato local previo a la subida.

El archivo completo pasa `node --check`.

## Endpoint del piloto

`descargarMiCertificadoPrivado`

Roles permitidos:

- `student`;
- `admin`;
- `superadmin`.

Teacher y Ventas quedan fuera de esta primera ruta.

Para rol student:

- `codigo` solicitado debe coincidir con `sesion.codigo`;
- esa validación existe en el mapa de propiedad POST;
- el endpoint vuelve a validar propiedad internamente como defensa en profundidad.

## Entrega

Flujo del piloto:

```text
POST autenticado
  -> rol + propiedad
  -> límite de frecuencia
  -> búsqueda read-only del certificado
  -> MIME PDF
  -> tamaño <= 2 MiB
  -> DriveApp.getFileById(...).getBlob().getBytes()
  -> SHA-256
  -> base64 en JSON
  -> navegador reconstruye Blob local
```

La respuesta exitosa no contiene:

- URL de Drive;
- `file_id`;
- permiso público;
- contenido de otro expediente.

Sí contiene:

- `nombre`;
- `mime_type=application/pdf`;
- `size_bytes`;
- `sha256`;
- `data_base64`;
- registro/nivel;
- contador restante del límite.

## Límites del piloto

- máximo `2 MiB` por certificado;
- solo `application/pdf`;
- 5 solicitudes por sujeto/ventana de 60 segundos mediante `CacheService` + `ScriptLock`;
- el rate limit de CacheService es una defensa operativa best-effort, no debe considerarse el único control antiabuso de una arquitectura general;
- no modifica ACL;
- no hace privado el certificado real todavía;
- no cambia `getMisCertificadosEstado()` para retirar su URL hasta que el endpoint se pruebe en Apps Script QA;
- no se usa para cédulas, fotos, comprobantes ni documentos grandes todavía.

## Pruebas offline ejecutadas

El candidato pasó:

1. búsqueda de certificado sin llamada a `_certF984TEliminarDuplicadosOficiales_`;
2. búsqueda sin `setTrashed`;
3. endpoint declarado en mapa POST;
4. endpoint incluido en guard de propiedad student;
5. endpoint incluido en dispatcher;
6. student propietario recibe payload privado;
7. respuesta no expone Drive URL ni `file_id`;
8. round-trip base64 exacto;
9. SHA-256 exacto;
10. student A no puede pedir certificado de student B;
11. el rechazo cross-student ocurre antes de buscar Drive;
12. PDF >2 MiB se rechaza antes de leer blob;
13. MIME no PDF se rechaza antes de leer blob;
14. primeras 5 descargas pasan el limitador del piloto;
15. sexta se rechaza antes de búsqueda Drive;
16. teacher es rechazado y no toca Drive.

Prueba reproducible versionada:

`scripts/qa_sec002_private_certificate_candidate.mjs`

## Validación con APIs oficiales

Apps Script `DriveApp.File` expone `getBlob()` y `getSize()`. Además, Google documenta que `getDownloadUrl()` sigue requiriendo que el usuario final tenga permiso sobre el archivo; por eso no sirve como reemplazo de la publicación `anyone` para estudiantes que no son viewers de Drive.

ContentService devuelve texto/JSON; por eso el piloto usa base64 dentro de JSON y no pretende ser un stream binario general.

## Gate antes de tocar frontend o ACL

1. instalar el candidato únicamente en el proyecto Apps Script QA correcto;
2. confirmar deployment QA exacto;
3. ejecutar prueba con un certificado QA privado, no productivo;
4. medir latencia y tamaño real de la respuesta;
5. abrir el PDF reconstruido en Chrome/Safari móvil y escritorio;
6. repetir con otro estudiante y exigir `no_autorizado`;
7. probar 2 MiB+ y MIME no PDF;
8. confirmar que consultar certificados no mueve duplicados a papelera;
9. solo entonces preparar el frontend para usar `descargarMiCertificadoPrivado`;
10. solo después de ese PASS retirar ACL público de una clase/copia QA.

## Estado de bloqueo actual

La integración disponible de Google Drive no tiene capacidad para editar/deployar el proyecto Apps Script como código fuente. El candidato puede respaldarse y verificarse como archivo, pero **no debe afirmarse que está instalado en Apps Script QA**.

No se modificó el `Code.gs` productivo ni el proyecto Apps Script QA.
