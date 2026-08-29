# CS21A181 · SEC-002 · cadena privada estudiante/admin

Fecha: 2026-08-29  
Estado: **SOURCE/QA ONLY · BACKEND PENDIENTE · ACL SIN CAMBIOS · NO PROD**

## Base

- candidato superior observado: PR #152 / `integration/security-p1-source-tooling-cs21a180`
- head base exacto al crear este corte: `0a316ca7cf2a62a12e8a3540570527e367a8e37e`
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Hallazgo que motivó el corte

El barrido del head #152 demostró que tres consumidores privados ya existentes como PRs separados no estaban integrados en la pila actual:

1. `src/student_modules.jsx` todavía tenía `href={row.url}` para **Abrir Certificado**.
2. `src/solicitudes_pago.jsx` todavía obtenía `sol.url_comprobante` y podía hacer `window.open(url, ...)` para PDF.
3. `src/student_experience.jsx` todavía no contenía el consumidor privado de matrícula firmada del estudiante.

Por tanto, no era correcto afirmar que #152 contuviera CS21A160–162.

## Rescate elegido

No se reimplementan esas funciones. Se integra exactamente el head acumulativo de PR #134:

- #132 · CS21A160 · certificado privado estudiante;
- #133 · CS21A161 · comprobante privado admin/superadmin;
- #134 · CS21A162 · matrícula firmada privada estudiante.

#134 ya tiene como ancestros #132 y #133, y su cadena parte de #131, que sí está incluida en los candidatos modernos de Ventas.

## Resultado esperado en source

### Certificado estudiante

- `descargarMiCertificadoPrivado` por POST autenticado;
- PDF validado por MIME/tamaño/firma/hash;
- Blob/ObjectURL temporal;
- `row.url` puede conservarse únicamente como señal legacy de disponibilidad, no como destino navegable.

### Comprobante de pago admin

- `descargarComprobantePagoPrivado(id)`;
- `tiene_comprobante` como shape real de disponibilidad;
- JPG/PNG/PDF mediante Blob/ObjectURL;
- `url_comprobante` permitido únicamente para `data:` local de demo;
- ninguna navegación a URL remota del comprobante.

### Matrícula firmada estudiante

- `descargarMatriculaFirmadaPrivada` con token de sesión;
- PDF validado por MIME/tamaño/firma/hash;
- ObjectURL temporal dentro de `Documentos y ayuda`.

## Lo que este corte NO resuelve

Los tres consumidores dependen todavía de backend privado sobre el Apps Script QA modular vigente. Antes de declarar runtime:

1. ejecutar CS21A178 y congelar el snapshot QA real;
2. portar endpoints mínimos sobre esa fuente exacta;
3. revalidar routers y wrappers `doPost`;
4. E2 positiva/negativa por rol y ownership;
5. validar MIME/tamaño/SHA-256;
6. retirar ACL pública **solo en QA por clase** después de E2 privado exitoso;
7. repetir E2 con ACL retirada;
8. producción únicamente en release separado autorizado.

## Deuda observada para el siguiente corte

El source histórico de CS21A161 todavía muestra errores de backend/red directamente en `SolicitudesPagoView` (`r.error`, `res.error`, `e.message`). Eso se auditará y corregirá aparte después de integrar esta cadena, para no mezclar privacidad documental con copy/diagnóstico.

## Regla

**No se modifica Apps Script, Drive ACL, datos ni PROD en CS21A181.**
