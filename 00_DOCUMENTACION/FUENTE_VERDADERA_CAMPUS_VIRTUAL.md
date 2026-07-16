# FUENTE VERDADERA — F98.4-Z6-CS21A99

Estado: frontend CS21A99 guardado en GitHub `main`; backend integral CS21A99 generado y validado estáticamente; publicación de Apps Script y prueba de producción no verificadas.

## Fuente principal de continuidad

1. `INDICE_VIGENTE_CS21A99.md`
2. `ESTADO_CONSOLIDADO_F98_4_Z6_CS21A99.md`
3. `AUDITORIA_FLUJO_PUESTA_AL_DIA_CS21A99.md`
4. `HANDOFF_NUEVO_CHAT_CS21A99.md`
5. `README_CONTINUIDAD.md`

Los documentos anteriores se conservan como historial, pero no definen la versión vigente.

## Consulta individual · Poner al día

El frontend vigente reemplaza los parches superpuestos A28, A29 y A95 por módulos A99 plain JavaScript. Esos archivos anteriores ya no se cargan desde `campus.html`.

Flujo:

1. actualización académica local;
2. aplicación local del pago;
3. decisión final de sincronizar CONAPE una sola vez.

El pago inline A36 se conserva cargado como respaldo.

## Fuentes académicas

- `DATOS`: identidad y grupo base.
- `ESTATUS`: estado oficial por nivel.
- `INTENTOS_ACADEMICOS`: intento, grupo, precios y snapshot financiero.
- `GRUPOS`: nivel, fechas, periodo, modalidad y docente.

CS21A99 consolida los intentos por código, nivel, grupo y número para evitar dos registros activos equivalentes.

## Fuentes financieras

- `BDBANCARIO`: comprobante y saldo aplicado.
- `PAGOS`: cuotas.
- `OTROS PAGOS`: matrícula, certificado y demás rubros.
- `PAGOS_CAMPUS`: espejo operativo por rubro.
- `PAGOS_OPERACIONES`: journal, idempotencia y reversión.

El motor financiero existente permanece como fuente de escritura. A99 solo permite omitir CONAPE durante el pago local y actualizarlo una sola vez al final.

## CONAPE

Las hojas actualizadas por estudiante son:

- `4-estudiantes`;
- `5-plan_estudios`;
- `6-historial`;
- `7-morosidad`.

`1-sedes`, `2-carreras` y `3-materias` son catálogos de referencia y no deben reconstruirse por cada operación.

## Panel Maestro

Se preserva CS21A98:

- caché fragmentada;
- apertura stale-while-revalidate;
- semáforo colaborativo;
- lectura delta;
- filtro legible de grupos.

## MÁSCARA de Keylor · fuente protegida

La máscara mantiene perfiles demo de solo lectura generados desde backend. No crea filas en las hojas reales y no permite pagos, cambios académicos ni sincronización CONAPE.

La comparación del backend A98 contra A99 confirmó 69 funciones `_demoKeylor*` sin cambios.

## Archivos frontend A99

- `src/admin_students_quick_update_core_cs21a99.js`
- `src/admin_students_quick_update_components_cs21a99.js`
- `src/admin_students_quick_update_state_cs21a99.js`
- `src/admin_students_quick_update_academic_cs21a99.js`
- `src/admin_students_quick_update_payment_cs21a99.js`
- `src/admin_students_quick_update_conape_cs21a99.js`
- `src/admin_students_quick_update_modal_cs21a99.js`
- `src/admin_students_quick_update_install_cs21a99.js`

## Backend integral

Nombre de entrega:

`Code_F98_4_Z6_CS21A99_COMPLETO.gs`

No se debe combinar parcialmente con un backend anterior. Guardar un archivo en GitHub o Drive no equivale a publicarlo en Apps Script.
