# CS21A210P · Prematrículas compartidas · errores seguros

Fecha: 31-ago-2026

## Base exacta
- PR #231 / `fix/diagnostico-interno-superadmin-safe-errors-cs21a210o`
- commit: `82224853c7deb82e82de40b36ff04c8aa6c2f41d`
- preimágenes:
  - `src/free_user_admin.jsx`: `581ec28b4b94a91b37432106aecefb0d75dc1df9`
  - `src/ventas_prematriculas.jsx`: `71dbb7a7fc556248b88e40dd42a6b8bcf94d1961`

## Hallazgo
CS21A210N detectó `setError(e.message)` en ambas superficies de Prematrículas:
- Campus Admin: `FreeUserRequestsAdminView`;
- Ventas/Admisiones: `PrematriculasVentasWidget`.

Ambas usan los mismos contratos `freeUserListarSolicitudes` y `freeUserResolverSolicitud`, muestran datos personales del prospecto y registran seguimiento operativo.

## Contradicción de política de acceso — NO resuelta por este corte
`MATRIZ_ENTREGA_ROLES_CS21A131.md` ubica Prematrículas bajo Superadmin, pero el source vigente contiene una superficie específica de Ventas/Admisiones que usa los mismos endpoints y describe explícitamente ese flujo como operativo para asesores.

Por esa contradicción este corte **NO cambia sidebar, router ni roles**. Restringir acceso por inferencia podría romper una operación vigente legítima. La autorización backend de `freeUserListarSolicitudes` / `freeUserResolverSolicitud` tampoco está demostrada por el source versionado y debe reconciliarse con la política real antes de release.

## Corrección source-side
- `freeAdminSafeUserError()` en la superficie Campus Admin;
- `ventasPrematSafeUserError()` en la superficie Ventas;
- detalle técnico permanece console-only;
- carga fallida muestra `No se pudieron cargar las prematrículas.`;
- actualización fallida muestra `No se pudo actualizar la prematrícula.`.

## Contratos preservados
En ambas superficies:
- POST con token;
- `freeUserListarSolicitudes`;
- `freeUserResolverSolicitud`;
- estados `PENDIENTE`, `EN_GESTION`, `RESPONDIDA`, `CONVERTIDA`, `CERRADA`, `DESCARTADA`;
- payload de resolución con `estado`, `respuesta`, `nota`, `responsable`;
- WhatsApp y copia de ficha;
- no crea matrícula oficial, código, grupo, pagos, notas ni certificados;
- sin cambios de Apps Script, ACL, main o PROD.

## Evidencia bootstrap
Run `33444280492`: **SUCCESS completo**.
- ancestry y preimágenes exactas: PASS;
- patch: PASS;
- guard CS21A210P: PASS;
- regresión CS21A210O: PASS;
- Ventas Integration CS21A166: PASS;
- `git diff --check`: PASS.

Source temporal validado: `2296f1861e2938bcff99a0edd6eef6861ac29b39`.
Blobs funcionales validados:
- `src/free_user_admin.jsx`: `57435a79a52e9319757b6f3ab18357679153837c`
- `src/ventas_prematriculas.jsx`: `26f9101577b6c654a216cea8a0d3438e6f5ec4c1`

La rama final se reconstruye directamente sobre #231 como un único commit con 5 rutas: 2 funcionales + guard + workflow + documentación. Los artefactos bootstrap quedan fuera del candidato final.

## Estado
- E0: sí.
- E1 source/QA: bootstrap sí; falta QA final/PR para checkpoint canónico.
- E2 autenticado/runtime: NO.
- política de acceso Prematrículas: pendiente de reconciliación.
- autorización backend de endpoints: NO verificada.
- PROD/main: NO tocados.

**SOURCE/QA ONLY · ACCESS POLICY UNRESOLVED · BACKEND AUTH UNVERIFIED · NO PROD · NO AUTO-MERGE**
