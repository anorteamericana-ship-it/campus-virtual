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

## CS21A211I · convención de finales de línea y round trip

El snapshot `QA_HEAD_20260901_215804Z` conserva finales de línea mixtos: 36 archivos CRLF y 35 LF. En particular, el preimage `99_QA_Staging_Guard.js` tiene 109 líneas CRLF y 4,953 bytes. La identidad certificada del guard candidato CS21A211I es deliberadamente **LF**, 296 líneas / 13,062 bytes / SHA-256 `a39441e9e99981583e4f98d0994f5ac0b80f244e2febbb7e3d5895550fe310fe`.

Convención canónica:

1. el aggregate fuente `3e384ac3...` se verifica sobre el snapshot bruto antes de cualquier conversión;
2. no se normalizan globalmente los 71 archivos;
3. el full-file replacement del guard se reconstruye desde las líneas `+` de los fragmentos LF y se escribe UTF-8 sin BOM con LF; por eso el guard no se entrega a `git apply` contra su preimage CRLF;
4. para una aplicación manual del patch combinado sobre un `clasp clone-script` fresco, se debe verificar primero el aggregate fuente y luego normalizar **solo** `99_QA_Staging_Guard.js` CRLF→LF antes de intentar aplicar el full-file hunk; la vía soportada sigue siendo reconstruir el guard desde el patch en vez de depender de matching CRLF/LF;
5. los fragmentos `patches/apps-script/CS21A211/*.patch` se marcan `-text` en `.gitattributes`: Git no debe modificar sus bytes. CI exige adicionalmente ausencia de `\r` para que el formato canónico de los patches siga siendo LF.

### Round trip clasp v3.3.0

`clasp` no implementa una conversión EOL propia: `push()` lee el archivo local como bytes→string y entrega ese `source` a `projects.updateContent`; `pull()/clone-script` toma `File.source` devuelto por Apps Script y lo escribe directamente con `fs.writeFile`. La evidencia histórica de clasp también muestra que fuentes enviadas desde Windows y macOS pueden permanecer distintas únicamente por CRLF/LF en remoto; por tanto no existe una normalización universal a CRLF durante transporte.

Consecuencia para CS21A211I: después de empujar el guard LF, un `clone-script` de verificación debe devolver el guard todavía en **13,062 bytes / `a39441e9...`**. El hipotético 13,358 bytes (296 CRLF) no es la identidad esperada. Si el remoto devolviera CRLF, se registra como `REMOTE_EOL_DRIFT`; puede calcularse además un hash LF-normalizado para diagnosticar que el contenido lógico coincide, pero el gate byte-a-byte no lo acepta silenciosamente.

### Paridad GET sin segunda copia del Router

`01_Router.js` completo no está versionado en este repositorio, así que GitHub Actions no puede comparar honestamente el Router real con el guard sin importar otra copia del snapshot o credenciales Apps Script. No se agrega esa segunda fuente de verdad.

El control queda en dos niveles:

- CI estático: valida el script de paridad, la lista certificada de 9 GET, la identidad contractual del Router y que el patch `01_Router.js.patch` no modifique la allowlist GET;
- release/runtime: `scripts/qa_get_route_parity_cs21a211i.mjs <candidate-root>` compara **el `01_Router.js` real reconstruido/clonado** con `_qa144AllowedGetFn_` y falla ante cualquier divergencia. El mismo check se ejecuta sobre la verificación remota cuando exista un candidato instalado.

Esto evita introducir un fixture adicional de `01_Router.js` únicamente para satisfacer CI.

## Veredicto

**PATCH CORREGIDO Y REPRODUCIDO · CS21A211I EOL CONTRACT DOCUMENTADO · PATCH BLOBS BYTE-PRESERVED · CLASP ROUND-TRIP DEFINIDO · NO APPS SCRIPT PUSH · NO PROD · NO MERGE.**
