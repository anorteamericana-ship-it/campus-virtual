# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — ESTADO VIGENTE

**Versión integral:** F98.4-Z6-CS21A32  
**Backend canónico:** F98.4-Z6-CS21A32  
**Frontend activo:** F98.4-Z6-CS21A32  
**Corte documental:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · rama `main`

## 1. Fuentes verdaderas

- `00_DOCUMENTACION/FUENTE_VERDADERA_CAMPUS_VIRTUAL.md`
- `00_DOCUMENTACION/BIBLIA_DELTA_ACTUAL.md`
- `00_DOCUMENTACION/SKILL_CAMPUS_VIRTUAL.md`
- `00_DOCUMENTACION/PROMPT_CONTINUIDAD.md`
- `00_DOCUMENTACION/MANIFIESTO_ACTUAL.json`
- `AppsScript/README.md`

## 2. Cambio CS21A32

CS21A32 modifica backend y frontend únicamente para el **Seguimiento inmediato CONAPE**.

### Backend

- Cruza cada movimiento con `DATOS`, `ESTATUS`, `GRUPOS` y `7-morosidad`.
- Resuelve el nivel mediante la llave estudiante + año + periodo y conserva el grupo/intento real.
- Marca **Aplicado en sistema** solo con evidencia en `PAGOS`, `OTROS PAGOS` o `PAGOS_CAMPUS` del mismo estudiante, nivel y grupo/intento.
- `BDBANCARIO` queda expresamente excluida de esa decisión.
- Un pago sin grupo solo se acepta cuando existe un único intento del nivel; con varios intentos queda ambiguo y no se atribuye.
- No mueve pagos, no escribe morosidad y no cambia estados académicos.
- Cambia la caché del Panel Maestro a `MASTER_DASH_CS21A32_V1`.

### Frontend

- Los pendientes se muestran primero, ordenados por detección más reciente.
- Los aplicados se colocan al final en un bloque plegable “fuera del seguimiento principal”.
- La columna Movimiento muestra **✓ Aplicado en sistema** cuando corresponde.
- Se muestran nivel, estatus académico, grupo, monto aplicado, fuentes y Moroso / No moroso / Sin fila.
- La columna mantiene el movimiento CONAPE original como contexto.

## 3. Reglas de clasificación

1. Debe existir estudiante vinculado.
2. Debe resolverse nivel y grupo/intento para el periodo CONAPE.
3. Debe existir pago real aplicado en el mismo nivel y grupo/intento.
4. Las fuentes válidas son `PAGOS`, `OTROS PAGOS` y `PAGOS_CAMPUS`.
5. `BDBANCARIO`, solicitudes pendientes o una fila `NO` de morosidad no bastan para marcar aplicado.
6. `7-morosidad` es contexto de seguimiento, no evidencia de aplicación.
7. Nunca se reutiliza evidencia de otro intento.

## 4. Estado anterior preservado

- Cobranza y cartera sigue cargando de primero por `src/admin_master_cobranza_first.js` CS21A31.
- Seguimiento inmediato sigue visible aunque los gráficos financieros estén ocultos.
- Detalle sigue leyendo/escribiendo `DATOS.COMENTARIO_ADMIN`.
- Consulta sigue abriendo el expediente precargado.
- CONAPE sigue siendo manual y sin triggers automáticos.
- Las reglas académicas y financieras de CS21A30 se preservan.

## 5. Archivos frontend activos recientes

- `campus.html`
- `src/admin_master_cobranza_first.js`
- `src/admin_master_conape_movements_cs21a25.jsx` — contenido activo CS21A32.
- `src/admin_master_cobranza_collapse_cs21a27.js`
- `src/admin_master_conape_consulta_cs21a28.js`
- `src/aplicar_pago_comprobante_guard_cs21a23.js`
- `src/admin_students_status_promotion_cs21a28.jsx`
- `src/admin_students_status_missing_next_cs21a29.jsx`

## 6. Backend completo

- TXT: `Code_F98_4_Z6_CS21A32_SEGUIMIENTO_CONAPE_APLICADO_SISTEMA_COMPLETO.txt`
- ZIP: `Code_F98_4_Z6_CS21A32_SEGUIMIENTO_CONAPE_APLICADO_SISTEMA_COMPLETO.zip`
- Líneas: 49.925
- Tamaño TXT: 2.865.858 bytes
- SHA-256 TXT: `956e71a003765b3c188f156ea24c8efa805162acbf00cedfd0134db1ada35a17`
- Tamaño ZIP: 737.151 bytes
- SHA-256 ZIP: `9be3db6c387cd58320bff742a5dc33ce0416ec3e421ca19cc56ac86b07770e44`
- Sintaxis: `node --check` aprobada.

## 7. Estado de despliegue

GitHub y Drive confirman código guardado y respaldo íntegro. Eso no confirma producción. Para desplegar:

1. Abrir el TXT completo.
2. Reemplazar todo `Code.gs`.
3. Guardar y crear versión.
4. Actualizar la implementación web.
5. Recargar el Campus con `Ctrl+F5`.
6. Ejecutar QA con casos de intento único, repetición y pago ambiguo.

## 8. Restricciones críticas

- No mover pagos entre niveles o intentos.
- No usar `BDBANCARIO` para inferir aplicación CONAPE.
- No convertir `NO` en morosidad en evidencia de pago.
- No modificar 7-morosidad desde este panel.
- No afirmar despliegue sin evidencia de la implementación web.
