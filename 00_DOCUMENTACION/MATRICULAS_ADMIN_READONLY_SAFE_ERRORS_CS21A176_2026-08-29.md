# CS21A176 · Matrículas Admin · ficha solo lectura + errores seguros · 2026-08-29

## Base

- PR base: #147
- head exacto de base: `aedfaaeff288b0eb50c65760f11b366544b64033`
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Hallazgo funcional

`MatProspectoModal` permitía a admin/superadmin editar campos generales y mostraba el botón **Guardar cambios**, pero el handler no persistía ningún dato: únicamente mostraba `Próximamente: guardado completo de campos.`.

No se encontró en el repo un endpoint contractual de actualización general de prospecto que permita conectar esa UI de forma segura sin inventar backend ni autorización.

El riesgo era doble:

1. el personal podía creer que había guardado cambios que en realidad se perdían al cerrar/recargar;
2. crear una escritura nueva desde frontend sin contrato backend podía introducir problemas de rol, scope y auditoría.

## Corrección fail-closed

Hasta que exista persistencia real y verificada:

- los datos generales de la ficha quedan **solo lectura** para todos los roles;
- desaparecen el estado local de edición, el handler y el botón `Guardar cambios`;
- admin/superadmin reciben una indicación discreta de que los datos generales son de solo lectura en esa vista;
- Ventas conserva `Guardar nota`, porque esa acción sí usa el endpoint existente `agregarNotaProspecto`;
- no se crea ningún endpoint nuevo ni se cambia Apps Script.

## Errores técnicos visibles

El mismo archivo contenía varias rutas que podían propagar directamente al usuario:

- `d.error` al cargar prospectos/fichas;
- `r.error` al guardar notas o consultar CONAPE;
- `e.message` en catches de carga, notas, CONAPE y generación de matrícula.

CS21A176 agrega `matSafeUserError()` y deja el detalle técnico en consola. La interfaz usa mensajes de recuperación estables o conserva únicamente mensajes de negocio legibles.

## Regresión protegida

El guard también exige que se preserve CS21A175:

- WhatsApp de proformas continúa como adjunto manual;
- no vuelve el texto que incrustaba la URL pública de la proforma.

## Alcance

Funcional:

- `src/matriculas_admin.jsx`

Más:

- QA permanente;
- workflow;
- esta documentación.

No cambia:

- Apps Script;
- datos;
- roles/scope backend;
- ACL/Drive;
- producción;
- flujo real de `Guardar nota`;
- generación de proformas salvo la protección ya heredada de CS21A175.

## Estado

**SOURCE/QA ONLY · FAIL-CLOSED · NO PROD · NO APPS SCRIPT · NO AUTO-MERGE.**
