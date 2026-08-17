# ADR · SEC-001 · Proveedor de identidad y frontera de autenticación

**Fecha:** 2026-08-16  
**Estado:** `PROVEEDOR PREFERIDO PARA POC · AUTH0 ESSENTIALS · NO DEPLOY · NO PROD`

## Contexto

El backend observado mezcla actualmente dos responsabilidades dentro de `iniciarSesion`:

1. verificar una contraseña legible desde hojas del Campus;
2. emitir la sesión Campus y aplicar rol/estado/grupos.

La segunda parte ya es separable: después de validar identidad, el backend normaliza el usuario/rol, crea un token de sesión Campus, guarda su representación hash y `validarSesion()` gobierna las operaciones posteriores.

Por tanto, SEC-001 **no requiere reescribir el modelo de autorización del Campus**. Requiere sacar la contraseña del almacenamiento y de la verificación del monolito.

## Evidencia del modelo real de identidad

La hoja `USUARIOS` usa campos separados:

- `usuario`
- `clave`
- `rol`
- `nombre`
- `grupo`
- `código`
- `activo`
- `CEDULA`
- `CORREO`

El identificador visible de acceso es `usuario`, no el correo.

Una inspección read-only y privacy-preserving del 2026-08-16 encontró:

- 18 cuentas activas en `USUARIOS`;
- solamente 1 de esas 18 filas contiene un valor de correo con `@`;
- `DATOS` también contiene columnas `email` y `clave`;
- 160 filas de `DATOS` contienen un valor email-like con `@` — esto **no significa 160 estudiantes totales**, solo 160 filas con correo aparente;
- `PROSPECTOS.CLAVE` es además una estación temporal del password elegido durante inscripción antes de activación.

No se copiaron direcciones ni contraseñas a la documentación.

## Decisión

### Proveedor preferido para PoC: Auth0 Essentials

Auth0 Essentials se selecciona como **target preferido para PoC**, no como despliegue autorizado todavía.

Razones verificadas contra documentación oficial vigente:

1. Auth0 Database Connections soporta `username` como identificador de login, además de email/teléfono.
2. Flexible Identifiers permite que `username` sea el identificador y no obliga a convertir la UX del Campus a email-first.
3. El almacén hospedado por Auth0 deja de almacenar passwords en claro en infraestructura del Campus.
4. Essentials incluye Pro MFA y entornos separados de desarrollo/producción.
5. Auth0 soporta TOTP/OTP como factor MFA independiente.
6. Auth0 ofrece protección de intentos repetidos y controles de password/diccionario/datos personales.
7. La política de password puede configurarse en nivel `Low`, que exige únicamente longitud configurable, evitando reglas arbitrarias de mayúscula+número+símbolo.
8. A 2026-08-16, Essentials aparece en **US$35/mes para hasta 500 MAU** en la página pública de precios.

### Por qué NO Auth0 Professional por defecto

Professional aparece en **US$240/mes para hasta 500 MAU** y añade, entre otras cosas, `Use your existing User Database for Logins` / Custom Database Connections.

Eso facilitaría migración automática/trickle desde el almacén viejo, pero pagar esa diferencia de forma permanente para resolver una transición finita no es la primera opción.

La estrategia preferida usa Essentials + migración transitoria controlada. Professional queda como fallback si el PoC demuestra que la migración propia segura resulta más costosa/riesgosa que el plan administrado.

## Alternativas evaluadas

### Google Identity Platform

Ventajas verificadas:

- email/password dentro del primer tier de 50.000 MAU a US$0;
- política de contraseñas administrada;
- protección de enumeración de email con respuestas uniformes;
- TOTP MFA;
- API REST/Admin maduras.

Razón para no elegirlo como target primario del PoC:

- su flujo de password se centra en email;
- MFA requiere email verificado;
- solo 1/18 cuentas activas de `USUARIOS` tiene email-like actualmente;
- preservar `usuario` obligaría a introducir un mapping/alias adicional o cambiar la UX y normalizar identidad antes de resolver el P1.

Se conserva como **fallback económico** si la Academia decide normalizar correos y aceptar login email-first o una capa de alias correctamente diseñada.

### Cloudflare Worker dedicado

Cloudflare Paid puede ejecutar PBKDF2/Web Crypto y tiene rate limiting, pero implicaría que el proyecto opere directamente:

- KDF/costo/versionado;
- almacén de verificadores;
- secretos/pepper;
- anti-replay;
- MFA/TOTP;
- recovery;
- protección de abuso;
- rotación y respuesta a incidentes.

El plan Free mantiene un presupuesto CPU demasiado pequeño para usarlo como target serio de un KDF deliberadamente costoso. Paid lo vuelve técnicamente viable, pero sigue dejando a la Academia con más superficie criptográfica propia que un IdP administrado.

Por eso queda como **último fallback**, no target preferido.

## Arquitectura steady-state objetivo

### Browser -> Auth0

El navegador autentica directamente contra Auth0 Universal Login:

- identificador visible: `usuario`;
- password: manejado por Auth0;
- TOTP/MFA cuando corresponda;
- protección de abuso/lockout del IdP;
- la contraseña no viaja a Apps Script.

Universal Login debe usar branding de Academia Norteamericana y mantener una experiencia simple de `usuario` + contraseña.

### Auth0 -> Browser -> Apps Script

Tras autenticación exitosa:

1. Auth0 entrega tokens OIDC/OAuth al cliente;
2. el cliente envía al backend Campus únicamente la prueba de identidad necesaria;
3. Apps Script valida esa prueba mediante un mecanismo soportado y probado — para el PoC, se prefiere validación remota por endpoint OIDC/UserInfo antes que implementar criptografía JWT casera dentro del monolito;
4. Apps Script obtiene un identificador estable (`sub`) y/o `username` verificado por el IdP;
5. Apps Script localiza la cuenta Campus y **deriva localmente** rol, grupos, código, estado y permisos;
6. Apps Script emite el token de sesión Campus existente;
7. el resto del Campus continúa usando `validarSesion()` como hoy.

## Invariante de autorización

Auth0 **NO será fuente de verdad** para:

- rol Campus;
- grupos académicos;
- notas;
- pagos;
- estado de cuenta;
- CONAPE;
- scope de Ventas;
- autorización sobre documentos;
- permisos de docente/estudiante/admin.

Esos datos permanecen en el Campus. El IdP solo acredita identidad y, en roles definidos, segundo factor.

## MFA

Objetivo de cierre SEC-001:

- MFA obligatorio para cuentas de personal con acceso a datos/operaciones internas;
- TOTP como primer mecanismo porque evita costo/dependencia SMS;
- recovery codes y procedimiento de recuperación administrado;
- rollout por cohortes empezando por superadmin/admin/cobros/dirección/supervisión y extendiendo después a docentes/Ventas;
- ningún rol se obtiene desde una claim de Auth0 sin revalidarlo contra el Campus.

La lista exacta de roles MFA se congela después del PoC y de revisar impactos operativos.

## Política de contraseña objetivo

Conservar el contrato SEC-001:

- mínimo 15 caracteres;
- aceptar passphrases;
- máximo de UI actual 128;
- no exigir composición arbitraria;
- bloquear contraseñas comunes mediante el diccionario del proveedor;
- bloquear datos personales cuando no reduzca interoperabilidad;
- permitir pegado/password managers.

En Auth0 esto corresponde conceptualmente a:

- strength `Low` con longitud 15;
- Password dictionary ON;
- Block personal data ON después de QA de usernames reales;
- Password history opcional, no requisito para cerrar el P1.

## Migración sin Custom Database Connection

### Principio

**No exportar masivamente `USUARIOS.clave`, `DATOS.clave` ni `PROSPECTOS.CLAVE` a Auth0.**

La migración de una cuenta debe ocurrir de forma explícita y auditable.

### Estados propuestos

Cada identidad Campus tendrá un estado lógico:

- `LEGACY`
- `MIGRATION_PENDING`
- `MIGRATED`
- `RESET_REQUIRED`
- `LOCKED`

Y referencias mínimas:

- `AUTH_PROVIDER`
- `AUTH_SUB`
- `AUTH_MIGRATED_AT`
- `AUTH_MIGRATION_VERSION`

No guardar tokens Auth0 ni secretos MFA en Sheets.

### Puente temporal de migración

Para una cuenta legacy:

1. el usuario entra por una pantalla de migración claramente separada;
2. se aplican rate limit y anti-automation antes de verificar legado;
3. el usuario prueba su credencial legacy actual **una sola vez**;
4. si la prueba es válida, el flujo exige establecer una **nueva** passphrase >=15 para Auth0; no reutiliza silenciosamente la contraseña almacenada;
5. un backend autorizado crea la identidad Auth0 con `username` y la nueva contraseña;
6. se registra `AUTH_SUB` y estado `MIGRATED`;
7. se neutraliza/elimina la credencial legible de todas las ubicaciones legacy aplicables solo después de confirmar creación;
8. se emite la sesión Campus para completar la transición;
9. el siguiente login normal ocurre exclusivamente por Auth0;
10. el puente tiene fecha de retiro y no permanece como fallback indefinido.

### Rollback

No borrar la credencial legible antes de confirmar la identidad Auth0 y el mapping local.

Si falla la creación Auth0:

- no marcar `MIGRATED`;
- no borrar la credencial legacy;
- registrar evento técnico sin password;
- mantener la cuenta en `LEGACY`/`MIGRATION_PENDING` según el punto de fallo.

Una cuenta marcada `MIGRATED` **no debe volver a autenticar contra plaintext** aunque luego falle Auth0; el incidente se resuelve por recovery/reset.

## Nuevas altas

El diseño objetivo elimina `PROSPECTOS.CLAVE` como almacén temporal.

Para nuevas inscripciones:

1. la inscripción pública recopila datos de solicitud, no una contraseña que vaya a persistirse en Sheets;
2. cuando la cuenta puede activarse, se emite un flujo de establecimiento de acceso de un solo uso;
3. el usuario crea la contraseña directamente para el IdP mediante el backend/flujo seguro de provisioning;
4. el Campus almacena únicamente `AUTH_SUB`/estado de identidad, nunca la contraseña.

Esto requiere un cambio funcional posterior y no forma parte del commit de decisión arquitectónica.

## Recovery

El endpoint legacy `recuperarContrasena` no puede volver a revelar una clave.

Target:

- usuarios con correo verificado: recovery administrado por IdP cuando aplique;
- usuarios sin canal verificado: recuperación asistida por Academia con verificación de identidad y establecimiento de nueva contraseña, nunca lectura de la anterior;
- personal con MFA: recovery incluye procedimiento específico para pérdida de segundo factor.

## Gates del PoC

Antes de aceptar Auth0 Essentials como decisión de producción:

1. tenant DEV separado;
2. DB connection con `username` como identificador;
3. crear usuario QA sin depender de un email como identificador;
4. policy >=15 sin composición obligatoria + dictionary;
5. Universal Login branding mínimo;
6. login username/password positivo/negativo;
7. respuesta no enumera cuenta;
8. TOTP enroll/sign-in/recovery con cuenta staff QA;
9. prueba de bloqueo/rate/attack protection;
10. prueba OIDC -> Apps Script QA -> sesión Campus existente;
11. prueba de rol incorrecto/inactivo aunque Auth0 autentique;
12. migración de una cuenta ficticia LEGACY -> MIGRATED -> plaintext eliminado;
13. rollback antes de eliminación y recovery después de migración;
14. medir costo/MAU y límites reales del tenant;
15. confirmar que ninguna pantalla LAB/Memory/Speak depende del cambio.

## Criterio de cambio de proveedor

Se abandona Auth0 Essentials como target preferido si el PoC demuestra cualquiera de estos puntos:

- username-only/username-primary no funciona de forma compatible;
- MFA requerido exige datos que el Campus no puede mantener con calidad suficiente;
- la migración transitoria propia requiere una superficie pública demasiado riesgosa;
- límites/costos reales son incompatibles;
- integración OIDC con Apps Script obliga a debilitar verificación;
- recuperación operativa no es viable.

En ese caso se reevalúa Identity Platform con normalización de identidad o, como último recurso, un verificador dedicado.

## No autorización

Este ADR **no autoriza**:

- crear tenant productivo;
- copiar usuarios reales a un IdP;
- leer/exportar contraseñas en lote;
- modificar `main`;
- instalar Apps Script;
- eliminar columnas/credenciales reales;
- cambiar producción;
- tocar Memory Match, English LAB o Speak LAB.
