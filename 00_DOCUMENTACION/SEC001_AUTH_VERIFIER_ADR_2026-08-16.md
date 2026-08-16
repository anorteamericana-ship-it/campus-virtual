# ADR · SEC-001 · Frontera del verificador de contraseña

**Fecha:** 2026-08-16  
**Estado:** `DECISIÓN PARCIAL · PROVEEDOR NO ELEGIDO · NO DEPLOY`

## Contexto

El backend observado mezcla actualmente dos responsabilidades dentro de `iniciarSesion`:

1. verificar la contraseña;
2. emitir la sesión Campus.

La segunda parte ya tiene una arquitectura separable: después de validar credenciales, el backend normaliza el usuario/rol, crea un token de sesión, guarda su representación hash y `validarSesion()` gobierna las operaciones posteriores.

Por tanto, no es necesario reescribir todo el modelo de permisos para corregir SEC-001.

## Decisión parcial

Separar **verificación de contraseña** de **autorización y sesión Campus**.

La frontera queda especificada en:

`security/sec001_auth_verifier_protocol.json`

El verificador futuro debe acreditar la identidad con una afirmación firmada, corta y anti-replay. Apps Script continuará derivando rol, grupos, estado de cuenta y permisos desde sus fuentes de verdad y solo después emitirá el token de sesión Campus.

El proveedor/runtime de verificación todavía no se elige.

## Por qué no implementar un hash rápido en Apps Script

Apps Script ofrece primitivas de digest y HMAC, pero la documentación revisada no expone una función KDF de contraseña tipo PBKDF2/Argon2 como primitiva nativa.

La política de SEC-001 exige un verificador con sal y costo adaptable. Construir una sustitución con SHA-256/HMAC rápido únicamente para dejar de ver texto claro no cumple el objetivo de resistencia a ataque offline.

Implementar PBKDF2 manualmente mediante cientos de miles de HMAC en JavaScript/Apps Script también introduciría complejidad, latencia y riesgo operativo dentro de un backend monolítico ya sensible.

## Prototipo E1

Se midió localmente, fuera de producción, PBKDF2-HMAC-SHA256 con:

- 600.000 iteraciones;
- sal aleatoria de 16 bytes;
- salida de 32 bytes.

Resultado de dos derivaciones en el runtime local de prueba:

- ~128 ms;
- ~116 ms.

Esta medición **no representa Cloudflare, Apps Script ni producción**. Solo demuestra que la operación es deliberadamente costosa y que no debe asumirse compatible con límites CPU muy pequeños sin prueba real.

## Candidatos

### A. Proveedor de identidad administrado

Preferible si puede cumplir simultáneamente:

- identificador de acceso compatible con el flujo de cédula/usuario;
- recuperación y reset operables para estudiantes/docentes/personal;
- MFA para personal;
- migración trazable;
- costo aceptable;
- separación QA/producción;
- API/SDK que no obligue a exponer secretos en navegador.

No se elegirá un proveedor solo por reputación si obliga a deformar el modelo de identidad o duplicar PII innecesariamente.

### B. Verificador dedicado

Un runtime separado es técnicamente viable si ofrece:

- KDF mediante implementación nativa/optimizada;
- secreto separado del almacén de verificadores;
- rate limiting antes de la KDF;
- almacenamiento aislado;
- logs sin usuario crudo, contraseña o hash;
- afirmación firmada de vida corta;
- rollback y separación QA/producción.

Cloudflare Workers es un candidato, no una decisión. Su Web Crypto declara PBKDF2 y comparación segura; sin embargo, el plan Free tiene un presupuesto CPU pequeño y debe medirse con el costo real del verificador. La línea Speak LAB no autoriza reutilizar el mismo Worker ni acoplar ambos dominios.

## Privacidad del identificador

Si se usa un almacén externo, no es necesario persistir la cédula cruda como clave primaria. El almacén puede usar un identificador derivado con clave secreta a partir del usuario normalizado y conservar únicamente los datos mínimos del verificador.

La afirmación al Campus puede transportar el identificador normalizado que el propio usuario suministró, firmado y con TTL corto; no debe transportar roles, grupos, notas, pagos ni estado académico.

## Migración

No se recomienda exportar en lote las contraseñas legibles actuales hacia un servicio nuevo.

Orden preferido:

1. crear el nuevo verificador QA;
2. crear flujo de establecimiento/reset de contraseña;
3. migrar cuentas mediante reset verificado;
4. si operativamente se requiere una transición de login, hacerla de un solo uso, auditada y con fecha de retiro;
5. borrar/neutralizar credenciales legibles solo cuando exista evidencia de cuenta migrada o reset requerido;
6. eliminar por completo el fallback legacy.

## Decisiones todavía abiertas

- proveedor administrado vs verificador dedicado;
- costo/runtime del KDF en QA;
- mecanismo de recovery;
- MFA del personal;
- estrategia exacta de migración por cohortes;
- rotación del secreto que firma afirmaciones;
- duración y almacenamiento anti-replay de `jti`.

Ninguna de estas decisiones se resolverá modificando producción para “probar”.
