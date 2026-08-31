# CS21A195 · SEC-002 · documentos generados de Ventas

Fecha: 2026-08-31

## Base
- PR #210 / `security/admin-private-certificate-delivery-cs21a194`
- base exacta: `c2cfcf7a20335bac19dea2ae82f751374e71fc1d`
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Consumidor activo
`DocsEstudianteVentas` genera dos documentos al estudiante matriculado mediante `generarDocumentoVentasSeguro`:

- `CERTIFICADO` → hoja de matrícula;
- `MATRICULA_2` → carta de no deuda CONAPE.

El wrapper usa `generarDocumentoVentas` y el frontend vigente abre `r.url` directamente.

## Backend histórico
El código preservado describe `generarDocumentoVentas` como wrapper seguro de Ventas: deriva el asesor desde el token y exige prospecto propio/finalizado antes de delegar la generación. Su contrato observado sigue orientado a URL. No se encontró un contrato de bytes privados equivalente a `descargarMiCertificadoPrivado`.

Por ello este corte **no inventa un endpoint ni rompe los botones actuales**.

## Evidencia Drive
El backend histórico nombra:
- `CERTIFICADO` como `INSCRIPCION_<codigo>_<cedula>.pdf`;
- `MATRICULA_2` como `CARTA_NO_DEUDA_<codigo>_<cedula>.pdf`.

Se inspeccionaron 3 PDFs reales `INSCRIPCION_*`; los 3 reportaron `anyone / reader`, discovery false. Public-by-link queda demostrado para esa muestra.

Para `CARTA_NO_DEUDA_*` no se localizó una muestra con el prefijo exacto del generador. Un documento legacy de no deuda inspeccionado estaba owner-only, por lo que **no se extrapola** su ACL a la clase generada actual.

## Estado deliberado
`r.url -> window.open` se conserva temporalmente como **blocker explícito**, no como diseño aprobado. Retirarlo ahora sin backend privado rompería una función comercial activa.

## Próximo paso backend
Después del snapshot modular QA fresco de Issue #111:

1. inspeccionar la implementación efectiva de `generarDocumentoVentas`;
2. preservar autorización por token + cartera/ownership;
3. definir la mínima entrega privada (extensión del endpoint o endpoint compañero, nombre aún no resuelto);
4. devolver PDF autenticado sin requerir URL pública, con MIME/tamaño/integridad;
5. migrar frontend a Blob/ObjectURL;
6. E2 positiva de asesor propietario;
7. E2 negativa cruzando asesores/roles;
8. retirar ACL únicamente en copias QA y repetir E2.

## Regla
**NO retirar `ANYONE_WITH_LINK` primero. NO ampliar permisos. NO instalar Code.gs histórico completo.**

## Estado
**CONTRACT ONLY · P1 PUBLIC-BY-LINK DEMONSTRATED FOR INSCRIPCION 3/3 SAMPLES · CARTA ACL UNPROVEN · BACKEND PRIVATE DELIVERY PENDING · NO PROD**
