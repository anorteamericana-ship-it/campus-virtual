# CS21A184 · SEC-002 · perfil docente activo + gate privado

Fecha: 2026-08-29  
Estado: **SOURCE/QA ONLY · PRIVACIDAD RUNTIME PENDIENTE · NO PROD**

## Base

- PR #155 / `fix/student-private-doc-safe-errors-cs21a183`
- base exacta: `52fe37c9692b72a604787e6f2608bc662c4cb3c7`
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Clasificación demostrada

La deuda histórica de foto de perfil / CV / INA **sí corresponde a una superficie activa actual**.

`campus.html` carga directamente:

- `src/teacher_profile_cs21a76.jsx`

La pantalla usa autenticación de sesión y llama:

- `getPerfilDocenteCS21A76`
- `guardarPerfilDocenteCS21A76`
- `uploadFotoPerfilDocenteCS21A76`
- `uploadDocumentoDocenteCS21A76`

## Tres clases personales activas

1. **Foto docente**
   - backend actual entrega `data.foto.url`;
   - frontend la usa directamente como `img src`.

2. **Currículum**
   - backend actual entrega `data.curriculum.vista_url`;
   - frontend abre la URL con `window.open`.

3. **Aval INA**
   - backend actual entrega `data.aval_ina.vista_url`;
   - frontend abre la URL con `window.open`.

Por tanto, estas clases **no pueden declararse privadas hoy** solo porque la pantalla requiera login. El transporte de lectura sigue dependiendo de URL entregada al navegador.

## Por qué este corte NO elimina esas URLs

El repo actual no contiene la implementación Apps Script de las funciones CS21A76 y el PR histórico #110 tampoco implementó esta etapa. El último backend QA demostrado es modular y requiere snapshot fresco según Issue #111.

Inventar ahora nombres de endpoints o shapes privados sería repetir el problema que estamos evitando.

El contrato `security/sec002_teacher_profile_private_contract_v1.json` deja expresamente:

- `endpoint_names_resolved=false`;
- foto/CV/INA con `private_read_required=true`;
- autorización mínima ligada a la identidad canónica del docente;
- contenido privado + metadatos de integridad, no URL pública compartible;
- ACL pública solo se retira en QA después de E2 privada positiva/negativa por clase.

## Cambio funcional permitido ahora

`src/teacher_profile_cs21a76.jsx` recibe únicamente **copy de error seguro**:

- carga del perfil;
- guardar perfil;
- subir fotografía;
- subir CV/INA.

Los mensajes humanos pueden conservarse. Diagnósticos técnicos, códigos internos, backend/endpoints, red, token/sesión, HTML/JSON, MIME/base64/hash/integridad y similares quedan en consola y la UI recibe fallback estable.

## Invariantes

CS21A184 no cambia:

- rutas Apps Script existentes;
- payloads;
- token;
- edición del perfil;
- upload de foto;
- upload de CV/INA;
- URLs de lectura actuales;
- Drive ACL;
- Apps Script;
- datos;
- PROD.

Las URLs directas permanecen **a propósito como blocker explícito** hasta que exista backend privado verificable.

## Exclusión

`src/teacher_cs21a_docs_viewer.jsx` contiene material institucional/planeamientos por lección con Drive IDs. No es la misma clase de datos personales de foto/CV/INA y no se reclassifica automáticamente por este corte; requiere auditoría de acceso propia.

## Gate runtime

1. ejecutar CS21A178 y congelar el Apps Script QA modular actual;
2. ubicar las funciones CS21A76 reales y sus helpers/routers;
3. determinar desde source real el endpoint privado y shape mínimo por foto/PDF;
4. portar read privado con ownership canónico;
5. validar MIME/tamaño/firma PDF/SHA según clase;
6. E2 docente dueño + negativas de identidad/archivo ajeno;
7. revisar cualquier acceso staff existente antes de conservarlo;
8. retirar ACL pública solo en QA y repetir E2;
9. PROD solo mediante release separado autorizado.

**Dictamen: SUPERFICIE ACTIVA CONFIRMADA · ERRORES UI SANITIZABLES YA · PRIVACIDAD DE FOTO/CV/INA BLOQUEADA HONESTAMENTE POR BACKEND SNAPSHOT.**
