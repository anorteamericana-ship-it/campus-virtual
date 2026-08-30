# CS21A194 · SEC-002 · Certificados legados en árbol público

Fecha: 2026-08-29
Base exacta: PR #185 / `f6f238609f503d3502b2f4f67f61cceca7eafe1b`
Tipo: **CONTRACT / AUDIT ONLY**
Severidad: **P1 · OPEN BLOCKER**

## Hallazgo demostrado

Durante el barrido posterior a CS21A193 se revisaron certificados estudiantiles reales en Google Drive.

Evidencia obtenida mediante metadata de Drive:

- 3 certificados reales recientes muestreados: `anyone / reader`, `allowFileDiscovery:false`;
- la subcarpeta académica de nivel muestreada: `anyone / reader`;
- 4 carpetas de grupo distintas muestreadas: 4/4 `anyone / reader`;
- el muestreo de grupos incluye una carpeta creada en agosto de 2026, por lo que no se limita a grupos antiguos;
- la raíz legado `DOCUMENTOS_ESTUDIANTES`: `anyone / reader`.

Además, al inspeccionar un grupo reciente se observó en la ruta muestreada una subcarpeta académica con certificado; no se observó allí una matrícula firmada moderna. Este dato evita ampliar el hallazgo a clases documentales que no fueron demostradas dentro del árbol.

Por tanto, cualquier persona que obtenga uno de esos enlaces puede leer el certificado sin autenticarse en el Campus.

Esto no es una inferencia por nombre de archivo ni una suposición de permisos: se leyó `permissions(type, role, allowFileDiscovery)` de Drive.

## Contraste con flujo moderno

Se verificó también una matrícula firmada QA del flujo moderno. Su metadata muestra:

- `shared:false`;
- permiso owner-only;
- sin `anyone/reader`.

La arquitectura moderna privada existe y está separada del árbol legado público. El problema no debe generalizarse como “todo Drive es público”.

## Consumidores actuales que impiden retirar ACL a ciegas

En `src/admin_students.jsx` siguen presentes 3 aperturas directas de certificado mediante `data.url -> window.open`:

1. `buscarCertificadoExistente`;
2. `generarCertificado` al regenerar un certificado registrado;
3. `generarCertificado` al generar el PDF.

El backend acumulado histórico inspeccionado devuelve URL/file_id para estas rutas; no se demostró allí una entrega privada base64 equivalente a CS21A193.

En paralelo, el source estudiante ya contiene el candidato privado `descargarMiCertificadoPrivado` proveniente de CS21A160/#132, pero su runtime Apps Script moderno sigue sujeto al snapshot/gate de Issue #111.

## Por qué NO se retira `anyone/reader` ahora

Quitar la ACL del root legado antes de migrar los consumidores podría:

- romper la apertura de certificados para administración;
- romper rutas antiguas que todavía dependan del enlace;
- producir una falsa sensación de cierre sin E2 negativo/positivo;
- dejar otros consumidores no inventariados sin acceso.

No se modificó ninguna ACL en CS21A194.

## Orden obligatorio de migración

1. obtener snapshot modular fresco de Apps Script QA (#111);
2. confirmar/instalar descarga privada de certificado para estudiante;
3. definir/instalar lectura privada staff-scoped para admin/superadmin;
4. migrar las 3 aperturas admin de `data.url` a bytes autenticados + ObjectURL;
5. ejecutar E2 positivo/negativo por estudiante/admin/superadmin/anónimo;
6. inventariar exactamente carpetas/archivos de certificados bajo el árbol legado afectado por ACL heredada;
7. retirar `anyone/reader` solo cuando todos los consumidores requeridos estén verdes;
8. comprobar acceso anónimo denegado y acceso autenticado correcto después del cambio ACL.

## Gate de release

**BLOCK_UNTIL_PRIVATE_DELIVERY_AND_ACL_MIGRATION_E2**

No merge automático, no Apps Script write, no Drive ACL change, no PROD.
