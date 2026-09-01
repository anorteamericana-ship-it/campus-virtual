# CS21A210BF · Admin Students · auditoría de frontera de errores

Base exacta: PR #256 / `ddd243a73e74c109420fc8a3e9a82e7c2bf31349`.

## Objetivo
Resolver por data-flow los 7 findings V3 de `src/admin_students.jsx` antes de cualquier cambio funcional.

## Ownership efectivo
`src/app.jsx` carga `src/admin_students.jsx` en la ruta `admin_students`; el archivo es runtime primario para esta superficie. Blob congelado: `8ef1c14088d489267baa68cf76810d4291538be3`.

## Clasificación
### EFFECTIVE_VISIBLE · 5 fronteras
1. `setResyncEst(... error:r.error)` — `r.error` llega al `title` visible del botón Sync CONAPE. La excepción de transporte ya se sanea en `resincronizarEstudianteIndividual`, pero una respuesta backend `{ok:false,error:...}` retorna sin sanear.
2. `generarDocumentoComun` — `data.error || data.mensaje` llega a `res[tipo].error` y se imprime como `❌ {r.error}`.
3. `buscarCertificado` — `data.mensaje || data.error` llega a `certResult.error`, impreso directamente.
4. `regenerarCertificadoMismoRegistro` — error backend llega a `certResult.error`, impreso directamente.
5. `generarCertificadoNuevo` — error backend llega a `certResult.error`, impreso directamente.

### ALREADY_SANITIZED_AT_RENDER · 2 findings
Los dos `setCertEstado` de preview/regeneración almacenan temporalmente `preview.error || preview.mensaje`, pero la única proyección de error del toast pasa por:
`adminStudentsSafeUserError(certEstado.mensaje || certEstado.error, ...)`.
Por tanto, corregir esos setters solo para reducir V3 sería churn y duplicaría sanitización.

## Decisión
El siguiente corte funcional permitido debe sanear exclusivamente las 5 fronteras EFFECTIVE_VISIBLE, reutilizando `adminStudentsSafeUserError`, con preimagen exacta y sin tocar los dos setters ya protegidos al render.

No cambia endpoints, POST/token, CONAPE, generación/búsqueda/regeneración de certificados, permisos, Drive ACL, backend, Apps Script, `main` ni PROD.

E0: cerrado para clasificación. E1: audit/source guard. E2: NO. `BACKEND CURRENT SNAPSHOT UNVERIFIED` vigente.
