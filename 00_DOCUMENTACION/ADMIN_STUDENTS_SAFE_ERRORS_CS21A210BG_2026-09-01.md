# CS21A210BG · Admin Students · errores seguros efectivos

Base exacta: PR #258 / `ecaa2b58122e15043bde86a050fe9534d8d2618c`.
Preimagen exacta `src/admin_students.jsx`: blob `8ef1c14088d489267baa68cf76810d4291538be3`.
Candidato validado: blob `930be81710ed20708c54b6b94c53676a42ee9b8d`.

## Alcance funcional
Se sanea exclusivamente la frontera de presentación de cinco errores backend→UI demostrados por CS21A210BF:
1. resync individual CONAPE;
2. generación de documento común;
3. búsqueda de certificado;
4. regeneración de certificado existente;
5. generación de certificado nuevo.

Todos reutilizan `adminStudentsSafeUserError(...)`. No cambian endpoints, payloads, token/POST, semántica CONAPE, generación/búsqueda/regeneración documental, permisos ni flujos de éxito.

## Findings deliberadamente intactos
Los dos findings V3 de `setCertEstado` para preview/regeneración permanecen byte por byte como en la preimagen porque su única proyección de error ya pasa por `adminStudentsSafeUserError(certEstado.mensaje || certEstado.error, ...)`. Tocarlos para bajar el contador duplicaría sanitización y sería churn.

## QA esperado
- transformación determinista desde la preimagen exacta;
- comparación byte por byte con el candidato;
- parser JSX verde;
- cinco sinks viejos ausentes y cinco replacements seguros exactamente una vez;
- dos findings de certificados ya saneados al render preservados;
- V3: `23 findings / 12 archivos` y `FILE_COUNT|2|src/admin_students.jsx`;
- regresión CS21A210BD en modo descendant non-regression;
- diff hygiene contra #258.

## Contrato congelado
No se modifican backend, Apps Script, Drive ACL, `main`, PROD, endpoints, payloads, POST/token, permisos, reglas CONAPE, certificados ni documentos fuera de la capa de error presentada al usuario.

E0: cerrado. E1: source/QA. E2: **NO**.
`BACKEND CURRENT SNAPSHOT UNVERIFIED` vigente.
