# Admin common docs · safe errors · 2026-08-30

## Base
- PR #200 · SEC-002 Admin certificados private source.
- Base exacta: `cdeca3c02ced5cfde5c633729e6a0d14dbc2396f`.

## Hallazgo
`generarDocumentoComun()` (Documento de Inscripción / Carta No Deuda CONAPE) guardaba `data.error || data.mensaje` directamente en estado y lo renderizaba al operador.

## Cambio
Únicamente la frontera de error visible:
- mensajes técnicos/códigos pasan por `adminStudentsSafeUserError`;
- el fallback visible es `No se pudo generar el documento. Intentá de nuevo.`;
- el endpoint `generarDocumento`, payload y resultado de negocio permanecen intactos.

## Límite deliberado
La entrega por `data.url` **NO se cambia en este corte**. Su migración privada necesita contrato/backend QA vigente y E2.

Evidencia Drive:
- dos documentos `INSCRIPCION_*` legacy inspeccionados están `anyone/reader` y viven bajo el árbol legacy público `DOCUMENTOS_ESTUDIANTES`;
- una Carta No Deuda histórica inspeccionada es owner-only;
- `generarDocumento()` histórico ya usa F89 `_f89StudentSubfolder_` para el destino de documentos académicos, por lo que no se puede afirmar sin E2 que nuevas inscripciones sigan naciendo públicas.

No se cambia Apps Script, Drive ACL, lógica documental, producción ni `main`.
