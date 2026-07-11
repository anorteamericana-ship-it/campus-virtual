# PROMPT DE CONTINUIDAD — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

Copiar desde la línea siguiente al iniciar otro chat.

---

Estoy trabajando en el proyecto **CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA**, Costa Rica. Continúa desde el corte **F98.4-Z6-CS21A32**.

## Forma obligatoria de trabajo

1. Respondeme en español directo y asumí que trabajo por copy/paste.
2. Antes de modificar, indicá impacto, archivos exactos y plan.
3. Si Apps Script cambia, entregá siempre el `Code.gs` completo.
4. Modificá solo archivos necesarios de `anorteamericana-ship-it/campus-virtual`, rama `main`.
5. No toqués pagos, certificados, `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS`, CONAPE o calendario sin análisis de impacto.
6. No movás pagos entre niveles o intentos.
7. No afirmés despliegue si solo fue generado, respaldado o guardado.
8. Actualizá `00_DOCUMENTACION` sin crear copias redundantes.

## Estado vigente

- Versión integral: **F98.4-Z6-CS21A32**.
- Backend: **CS21A32**.
- Frontend: **CS21A32**.
- Panel Maestro abre Cobranza y cartera de primero.
- Seguimiento inmediato clasifica movimientos CONAPE por estudiante, nivel, grupo/intento y morosidad.
- “Aplicado en sistema” usa únicamente `PAGOS`, `OTROS PAGOS` y `PAGOS_CAMPUS`.
- `BDBANCARIO` no participa en esa clasificación.
- Pendientes recientes quedan arriba; aplicados quedan abajo en bloque plegable.
- Un pago sin grupo no se atribuye si existen varios intentos del mismo nivel.
- `7-morosidad` informa SI/NO/SIN FILA, pero no demuestra aplicación.
- El backend completo está respaldado en Drive y documentado en `AppsScript/README.md`; no existe Code.gs completo en GitHub.
- No afirmar que CS21A32 está desplegado hasta comprobar reemplazo y actualización de la implementación web.

## Reglas financieras

- B1/B2/I1: Matrícula + Cuotas + Certificado.
- I2: Matrícula + Cuotas + Certificado I2 + Programa Completo + TOEIC.
- `PE` y `SIN REGISTRO` no generan deuda.
- Certificado I2 y Programa Completo pueden pagarse juntos.
- TOEIC usa `DATOS` y, si falta, `GRUPOS`.
- Comprobantes con saldo cero no aparecen.
- Nunca mover pagos entre niveles o intentos.

## Reglas académicas

- `DATOS` es identidad; `ESTATUS` es trayectoria.
- `CA → APR` puede activar o crear el siguiente nivel en una operación protegida.
- No copiar evaluaciones, notas ni certificado.
- No promover después de I2 o con resultado distinto de APR.
- Consulta individual relee después de una escritura.

## Archivos frontend activos recientes

- `campus.html`
- `src/admin_master_cobranza_first.js`
- `src/admin_master_conape_movements_cs21a25.jsx` — contenido CS21A32.
- `src/admin_master_cobranza_collapse_cs21a27.js`
- `src/admin_master_conape_consulta_cs21a28.js`
- `src/aplicar_pago_comprobante_guard_cs21a23.js`
- `src/admin_students_status_promotion_cs21a28.jsx`
- `src/admin_students_status_missing_next_cs21a29.jsx`

## Primera verificación al continuar

1. Leer documentos canónicos.
2. Confirmar si CS21A32 fue desplegado o sigue solo respaldado.
3. Probar un estudiante con intento único y pago aplicado.
4. Probar una repetición del mismo nivel para confirmar que no hereda pagos.
5. Probar un pago sin grupo con varios intentos: debe quedar ambiguo.

---
