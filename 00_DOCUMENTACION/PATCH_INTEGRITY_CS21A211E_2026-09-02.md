# CS21A211E · integridad del patch y sintaxis del guard · 2026-09-02

## Línea base

- Repositorio: `anorteamericana-ship-it/campus-virtual`.
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`.
- PR: #268 / `fix/qa-containment-cs21a211`.
- Snapshot fuente: `QA_HEAD_20260901_215804Z`.
- Fuente: 71 archivos / 4,677,234 bytes / aggregate SHA-256 `3e384ac34930e6a936a3f930db8819bd80124ef59f522ac1b5b11fee8f881ec6`.
- Evidencia de este checkpoint: E0 + E1 local/CI. No Apps Script remoto.

## Defecto detectado antes del push

La primera versión del patch completo declaraba para `99_QA_Staging_Guard.js`:

`@@ -1,109 +1,208 @@`

pero el hunk contenía realmente **209 líneas nuevas**. La última línea era el cierre del wrapper global:

```js
};
```

Al aplicar el patch, GNU `patch` consumía únicamente las 208 líneas declaradas y dejaba fuera ese cierre. Resultado reconstruido:

- `99_QA_Staging_Guard.js`: 10,397 bytes;
- `node --check`: `SyntaxError: Unexpected end of input`;
- aggregate candidato malformado: `9cba15a77a10315d1841aee1e4b86afb6d62bcfeca921e509434a7b746c17840`.

Ese candidato **queda superseded y nunca fue enviado a Apps Script**.

## Corrección

El metadata correcto del hunk es:

`@@ -1,109 +1,209 @@`

No se cambió la política funcional del guard; se corrigió la cardinalidad del hunk para que la última línea `};` forme parte del archivo aplicado.

## Reproducción completa sobre el snapshot exacto

Se extrajo nuevamente `QA_HEAD_20260901_215804Z`, se aplicó el patch corregido y se ejecutó sintaxis sobre los siete JS modificados.

Resultado:

- `patch --dry-run`: PASS sobre los 8 archivos declarados;
- aplicación real del patch: PASS;
- `node --check 01_Router.js`: PASS;
- `node --check 02_Auth_Sesiones_Usuarios.js`: PASS;
- `node --check 10_Estudiantes.js`: PASS;
- `node --check 41_CONAPE_Auditoria_Finanzas.js`: PASS;
- `node --check 46_English_LAB_Accesos_Demo_Docentes.js`: PASS;
- `node --check 98_Instalacion_QA_CS21A144.js`: PASS;
- `node --check 99_QA_Staging_Guard.js`: PASS.

Candidato corregido:

- 71 archivos;
- 4,688,555 bytes;
- aggregate SHA-256 `6c1c79c04994f2c10a5c4feee03c275e1664a003497a1febb0ca0add8a960bc1`.

Guard corregido:

- 10,400 bytes;
- SHA-256 `fd48510ff0601854afc27d0c5dbf5fb450e3a73518282f4efab89f6cf9ac9a5a`.

Patch LF versionado en GitHub:

`20aebc28ecc42b550f6d1b03a02314674d130d6825faa40c4685bfea5d423768`

Patch mixed-line-ending de referencia aplicado al snapshot CRLF original:

`a98a42c7ce07ab87f5e3198fb26ec59125e032c9e716435bad631fe4db8c7a53`

La diferencia LF/mixed corresponde al lado removido CRLF del guard; ambos representan el mismo cambio lógico.

## CI endurecido

El contrato `scripts/qa_qa_containment_candidate_cs21a211.mjs` ahora:

1. valida las cardinalidades declaradas de **todos los hunks** del patch;
2. fija source aggregate, candidate aggregate y patch SHA esperados;
3. reconstruye `99_QA_Staging_Guard.js` desde su full-file replacement;
4. exige 10,400 bytes + SHA-256 `fd48510...`;
5. ejecuta `node --check` sobre el guard reconstruido;
6. conserva los checks de self-route, 13 aliases, denylist PROD, 11 properties, default-deny y allowlist CS21A211C.

Check canónico del HEAD de corrección `80fa786815a317712ad3e3c929b4015c20943194`:

- `QA Containment Candidate CS21A211` · run `33669762856`: SUCCESS;
- salida: `CS21A211_QA_CONTAINMENT_CONTRACT=PASS files=8 parts=11 hunks=41 aliases=13`;
- salida: `GUARD_RECONSTRUCTED_SYNTAX=PASS bytes=10400 sha256=fd48510ff0601854afc27d0c5dbf5fb450e3a73518282f4efab89f6cf9ac9a5a`;
- `English LAB Source Truth Guard` · run `33669762842`: SUCCESS.

## Nota de frontera Drive

CS21A211 aísla **destinos escribibles** usados por documentos/CONAPE mediante las 11 `QA_STAGING_*`. El snapshot todavía contiene IDs de activos oficiales de solo lectura (por ejemplo, libros/audios y `PLANTILLA_IDS`) que no forman parte de esta frontera de escritura. Los endpoints mutantes que podrían producir/copiar documentos permanecen default-deny en este candidato.

Para una futura E4 documental estrictamente aislada habrá que provisionar plantillas QA/sintéticas y hacer property-driven también esos IDs de fuente. No es requisito de E2 de lectura actual y no autoriza copiar PII/padrón PROD.

## Veredicto

**PATCH CORREGIDO Y REPRODUCIDO · 71/71 · 7/7 JS SYNTAX PASS · CI CAPAZ DE DETECTAR EL OFF-BY-ONE · NO APPS SCRIPT PUSH · NO PROD · NO MERGE.**
