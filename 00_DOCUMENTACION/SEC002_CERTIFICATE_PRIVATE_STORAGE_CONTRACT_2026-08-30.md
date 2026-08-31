# SEC-002 · Contrato de almacenamiento privado de certificados

Fecha: 2026-08-30 · Costa Rica

## Propósito

Congelar el diseño backend necesario para cerrar el P1 de certificados **antes** de tocar Apps Script o Drive.

Este corte no cambia runtime. Su objetivo es evitar un port ambiguo cuando se recupere el snapshot modular QA vigente de Issue #111.

## Evidencia demostrada

### Árbol legacy público

- `DOCUMENTOS_ESTUDIANTES` real está compartido como `anyone / reader`, discovery off.
- carpetas de grupo/nivel inspeccionadas heredan la misma política.
- certificados reales B1 y B2 creados recientemente, incluso el 14-ago-2026, están `anyone / reader`.
- la fuente histórica resuelve el destino con `_certF983DDestinoTitulos_()` sobre `DOCUMENTOS_ESTUDIANTES_FOLDER_ID`.
- `generarPdfCertificado` declara ese árbol como destino oficial y no usa expediente individual.

### Árbol moderno privado

- `EXPEDIENTES_ESTUDIANTILES` real está owner-only.
- F89 define el patrón de expediente individual por cédula.
- documentos CONAPE reales ya viven de forma privada bajo `cédula/05_TRAMITES_ACADEMICOS/CONAPE`.
- F89 documenta `06_DOCUMENTOS_ACADEMICOS/{NIVEL}` como ruta académica del expediente moderno.

## Contrato objetivo

### Generación

`generarCertificado` conserva sus reglas de negocio, consecutivos e idempotencia, pero el PDF nuevo debe guardarse en:

`EXPEDIENTES_ESTUDIANTILES/<CEDULA>/06_DOCUMENTOS_ACADEMICOS/<NIVEL>`

Requisitos:

- sin `anyone`;
- sin permiso de dominio;
- sin `setSharing` público;
- regeneración conserva el registro existente;
- no borrar/mover la copia legacy durante la primera etapa.

### Búsqueda

1. buscar primero en el expediente privado;
2. si no existe, buscar en legacy como compatibilidad histórica;
3. la lectura legacy debe ser estrictamente read-only;
4. no borrar duplicados, mover archivos ni cambiar ACL durante una consulta;
5. los duplicados se reportan, no se corrigen como efecto colateral de lectura.

### Entrega

Se reutiliza el contrato `descargarMiCertificadoPrivado` ya diseñado históricamente:

- student/admin/superadmin;
- ownership estricto para student;
- PDF únicamente;
- 2 MiB;
- SHA-256;
- respuesta autenticada base64;
- ninguna URL pública como respuesta de la ruta privada.

### Migración legacy

Orden obligatorio:

1. copiar a destino privado;
2. verificar tamaño y SHA-256;
3. preservar nombre y registro oficial;
4. no borrar origen en primera pasada;
5. E2 propia/ajena/admin;
6. probar certificado nuevo privado;
7. recién entonces retirar ACL pública en una copia/árbol QA controlado;
8. repetir E2;
9. producción en release separado y autorizado.

## Gate runtime

No implementar contra backups monolíticos. Primero:

- snapshot modular Apps Script QA vigente;
- análisis #144/#150;
- port mínimo sobre orden efectivo demostrado;
- E2.

## Estado

**CONTRACT ONLY · RUNTIME PENDING #111 · ACL UNCHANGED · NO PROD · NO AUTO-MERGE**
