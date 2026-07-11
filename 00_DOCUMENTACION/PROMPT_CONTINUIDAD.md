# PROMPT DE CONTINUIDAD — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

Copiar desde la línea siguiente al iniciar otro chat.

---

Estoy trabajando en el proyecto **CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA**, Costa Rica. Continúa desde el corte **F98.4-Z6-CS21A30**.

## Forma obligatoria de trabajo

1. Respondeme en español directo y asumí que trabajo por copy/paste, no que programo.
2. Antes de modificar, indicá si el cambio afecta frontend, Apps Script o ambos, y nombrá los archivos exactos.
3. Si Apps Script cambia, entregame siempre el **Code.gs completo**. Nunca me des un parche como entrega de producción.
4. Si frontend cambia, modificá únicamente los archivos necesarios del repositorio `anorteamericana-ship-it/campus-virtual`, rama `main`.
5. No toqués pagos, certificados, `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS`, CONAPE o calendario sin analizar el impacto.
6. No movás pagos entre niveles o intentos para cuadrar resultados.
7. No afirmés que algo está desplegado si únicamente fue generado o guardado en GitHub.
8. Actualizá siempre `00_DOCUMENTACION` y evitá crear copias versionadas redundantes.

## Fuentes verdaderas

- `00_DOCUMENTACION/FUENTE_VERDADERA_CAMPUS_VIRTUAL.md`
- `00_DOCUMENTACION/README_CONTINUIDAD.md`
- `00_DOCUMENTACION/BIBLIA_DELTA_ACTUAL.md`
- `00_DOCUMENTACION/SKILL_CAMPUS_VIRTUAL.md`
- `00_DOCUMENTACION/PROMPT_CONTINUIDAD.md`
- `00_DOCUMENTACION/MANIFIESTO_ACTUAL.json`
- Backend canónico documentado en `AppsScript/README.md`.

## Estado vigente

- Backend: **F98.4-Z6-CS21A30**.
- Frontend: línea **CS21A29**, con controles CS21A27B y navegación CS21A28.
- Último motor financiero: certificado incluido siempre en la deuda del nivel activo.

## Reglas académicas vigentes

- `DATOS` es identidad maestra y `ESTATUS` es trayectoria académica.
- Al cambiar `CA → APR`, preguntá si también se activa el siguiente nivel:
  - Si está `PE`, cambiar `PE → CA` cuando se confirme.
  - Si está `SIN REGISTRO`, crear la fila oficial en `ESTATUS` y dejarla en `CA` cuando se confirme.
- La promoción y creación deben ocurrir en una sola operación protegida.
- Solo usar la misma cohorte si `GRUPOS` tiene una fila real para el siguiente nivel.
- No copiar evaluaciones, notas ni certificado al nivel nuevo.
- No promover después de I2 ni cuando el resultado sea `REP` u otro estado.
- Después de guardar, Consulta individual debe releer el expediente antes de permitir otra edición.

## Reglas financieras vigentes

- B1/B2/I1: deuda completa = **Matrícula + Cuotas + Certificado**.
- I2: deuda completa = **Matrícula + Cuotas + Certificado I2 + Programa Completo + TOEIC**.
- El certificado se cobra desde que el nivel está activo; la emisión documental es independiente.
- `PE` y `SIN REGISTRO` no generan deuda.
- Certificado I2 y Programa Completo pueden pagarse juntos en la misma factura.
- TOEIC usa el monto individual de `DATOS`; si falta, el monto del grupo/nivel en `GRUPOS`.
- Un comprobante bancario con saldo `₡0` no aparece en Buscar comprobante bancario.
- Buscador y guardado final deben calcular el mismo saldo disponible, incluida la columna J histórica de `BDBANCARIO`.

## Panel Maestro · Cobranza y CONAPE

- Seguimiento inmediato muestra todos los periodos y desembolsos adelantados.
- Orden: Estudiante, Movimiento, Desembolso, Periodo, Campus, Detectado, Contacto.
- Las fechas no deben mostrar objetos JavaScript crudos.
- `Detalle` lee/escribe `DATOS.COMENTARIO_ADMIN`.
- Debajo de Vinculado existe `Consulta`, que abre el expediente ya cargado.
- Los gráficos financieros pueden ocultarse, pero Seguimiento inmediato queda siempre visible.

## Archivos frontend recientes activos

- `campus.html`
- `src/aplicar_pago_comprobante_guard_cs21a23.js`
- `src/admin_master_conape_movements_cs21a25.jsx`
- `src/admin_master_cobranza_collapse_cs21a27.js`
- `src/admin_master_conape_consulta_cs21a28.js`
- `src/admin_students_status_promotion_cs21a28.jsx`
- `src/admin_students_status_missing_next_cs21a29.jsx`

## Restricciones CONAPE y calendario

- CONAPE se actualiza manualmente; no crear triggers.
- Un cambio pendiente de aprobación no mueve al estudiante de su grupo real.
- No ejecutar limpiezas pesadas dentro de `getGruposActivos`, `getAdminDashboard` o `getRadiografiaGrupo`.
- `PROTEGIDO` significa que la API externa no pudo verificarse; no maquillar el diagnóstico.

## Primera tarea al iniciar

1. Leé los documentos canónicos.
2. Verificá el `campus.html` y los archivos activos antes de proponer cambios.
3. Confirmá si el Code.gs CS21A30 está desplegado o solamente almacenado.
4. Para cualquier nueva solicitud, explicá impacto, archivos y plan antes de escribir.

---
