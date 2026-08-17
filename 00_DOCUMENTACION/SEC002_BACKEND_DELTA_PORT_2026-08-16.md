# SEC-002 · Port seguro del piloto privado de certificados

Fecha: 2026-08-16
Estado: **DELTA EXTRAÍDO Y VERIFICADO · NO INSTALADO · ACL SIN CAMBIOS**

## 1. Motivo

El candidato `SEC002_PRIVATE_CERT_QA_CANDIDATE_2026-08-16.gs` fue construido desde el `Code.gs` canónico observado de julio. El proyecto Apps Script QA actual contiene capas posteriores, incluido English LAB acumulado.

Por tanto, el candidato completo de 2,97 MB se conserva como referencia y prueba, pero **no debe reemplazar el backend QA actual**.

La unidad portable es el delta SEC-002 sobre el `Code.gs` vigente.

## 2. Base y candidato

Base canónica observada:

- SHA-256 `d24fc63c59e60ba92808d4d870f4eb95e35bb6f1c158a130229b187a66e35d37`.

Candidato Drive:

- `SEC002_PRIVATE_CERT_QA_CANDIDATE_2026-08-16.gs`;
- Drive ID `1lnaoEAUjqz5M05LsYxVoNNk9RgfXLy8z`;
- tamaño 2.977.488 bytes;
- SHA-256 `c06c20c66c85f88532dd43330401ebee72121570e704365c4905216e37b8dc5b`.

## 3. Delta portable

Artefacto:

`qa/sec002_private_certificate_delta.patch`

Resultado:

- **5 hunks**;
- +147 / -7;
- aplicado sobre la base exacta reconstruye byte por byte el candidato Drive;
- SHA resultante `c06c20c66c85f88532dd43330401ebee72121570e704365c4905216e37b8dc5b`;
- `cmp` exact match;
- sintaxis JavaScript PASS sobre una copia `.js` del archivo descargado.

## 4. Qué cambia

### Autorización

Registra `descargarMiCertificadoPrivado` en:

- mapa central de roles POST: student/admin/superadmin;
- mapa de propiedad por código para student;
- dispatcher POST.

El dispatcher canónico ejecuta `_an4406AutorizarPost_`, y cuando la autorización es válida inyecta `body._auth_session = auth.sesion` antes de llamar rutas protegidas. El endpoint vuelve a exigir esa sesión y revalida propiedad para student.

### Lectura de certificado no destructiva

`buscarCertificadoExistente()` ya no llama `_certF984TEliminarDuplicadosOficiales_()` durante una consulta.

En caso de duplicados:

- selecciona el más reciente;
- informa `duplicados_detectados`;
- devuelve `duplicados_eliminados:0`;
- no manda archivos a papelera.

La limpieza de duplicados debe quedar como operación administrativa explícita, no como efecto colateral de lectura.

### Entrega privada piloto

`descargarMiCertificadoPrivado()`:

- acepta únicamente PDF;
- máximo 2 MiB en este piloto;
- 5 descargas/minuto por sujeto mediante CacheService + LockService;
- falla cerrado si el rate limiter no puede validarse;
- student solo puede solicitar su propio código;
- devuelve SHA-256 + base64 dentro de la respuesta autenticada;
- el payload exitoso no expone `url`, `folder_url`, `search_url` ni `file_id`.

No agrega ningún `ANYONE_WITH_LINK` ni `setSharing()`.

## 5. Lo que NO hace este delta

- no cambia permisos ACL de archivos existentes;
- no privatiza todavía certificados QA/productivos;
- no adapta por sí solo `CertificadosView`;
- no migra fotos, matrículas firmadas, comprobantes, CV/aval ni documentos de Ventas;
- no es un gateway general para archivos grandes;
- no toca English LAB, Speak LAB o Memory Match.

## 6. Gate correcto de instalación QA

1. exportar/respaldar el `Code.gs` actual del proyecto QA;
2. confirmar que las 5 preimágenes todavía coinciden;
3. si alguna difiere, detenerse y reconciliar; no forzar el patch;
4. portar únicamente los 5 hunks al `Code.gs` actual;
5. conservar las capas `.gs` acumuladas existentes;
6. ejecutar `scripts/qa_sec002_private_certificate_candidate.mjs` sobre el backend reconstruido;
7. ejecutar `scripts/qa_sec002_private_certificate_delta_portable.mjs`;
8. adaptar el frontend de certificados a la nueva entrega autenticada;
9. en una **copia QA** de un certificado, retirar `anyone` y demostrar que la descarga autenticada sigue funcionando;
10. comprobar que un estudiante no puede descargar el certificado de otro;
11. comprobar rate limit, PDF >2 MiB y MIME inválido;
12. comprobar que consultar certificado duplicado no manda nada a papelera;
13. solo después considerar la migración ACL de esa clase documental.

## 7. Cierre SEC-002

Este piloto no cierra SEC-002 completo. El P1 requiere migrar todas las clases sensibles identificadas, sus consumidores y los archivos ya existentes, terminando con un escaneo de permisos que pruebe exposición sensible cero.

**NO PROD · NO ACL MASS CHANGE · NO BACKEND WHOLESALE REPLACEMENT.**
