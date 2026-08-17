# SEC-001 · Decisión de producto sobre longitud de contraseña

**Fecha:** 2026-08-17  
**Estado:** `DECISIÓN DE PRODUCTO · SOURCE ONLY · NO DEPLOY`

## Decisión

El mínimo de contraseña visible del Campus se fija en **6 caracteres** y el máximo de UI permanece en **128**.

No se exigirán combinaciones arbitrarias de mayúsculas, números o símbolos. Se permiten frases, pegado y gestores de contraseñas.

## Riesgo aceptado y compensaciones obligatorias

El mínimo de 6 caracteres es más débil que la guía NIST vigente para contraseñas centralmente verificadas. Por tanto, esta decisión solo es aceptable dentro del diseño SEC-001 si se mantienen como requisitos de cierre:

- verificación de contraseña fuera de Sheets/Apps Script mediante IdP/verificador administrado;
- bloqueo de contraseñas comunes/comprometidas;
- rate limiting y protección contra enumeración/intentos repetidos;
- MFA para personal;
- eliminación de contraseñas legibles y fallbacks `CODIGO` / `an####`;
- recovery que nunca revele la contraseña anterior.

## No cambia

Esta decisión no autoriza producción, no instala Apps Script, no migra cuentas reales y no modifica Memory Match, English LAB ni Speak LAB.
