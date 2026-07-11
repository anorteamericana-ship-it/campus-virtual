# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — ESTADO VIGENTE

**Versión integral de continuidad:** F98.4-Z6-CS21A30  
**Corte documental:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual`  
**Rama productiva:** `main`

Este documento es el resumen operativo vigente. Sustituye los README de continuidad versionados anteriores. No constituye una segunda copia de la Biblia: señala la fuente verdadera, el backend canónico, los archivos frontend activos y las reglas que no deben romperse.

## 1. Fuente verdadera

- Fuente documental: `00_DOCUMENTACION/FUENTE_VERDADERA_CAMPUS_VIRTUAL.md`.
- Biblia delta vigente: `00_DOCUMENTACION/BIBLIA_DELTA_ACTUAL.md`.
- Prompt para otro chat: `00_DOCUMENTACION/PROMPT_CONTINUIDAD.md`.
- Guía de trabajo: `00_DOCUMENTACION/SKILL_CAMPUS_VIRTUAL.md`.
- Manifiesto técnico: `00_DOCUMENTACION/MANIFIESTO_ACTUAL.json`.
- Backend canónico: archivo exacto reconstruible desde `AppsScript/archivo_canonico/`, documentado en `AppsScript/README.md`.

## 2. Estado de versiones

- Backend vigente: **F98.4-Z6-CS21A30**.
- Frontend vigente: línea **F98.4-Z6-CS21A29**, con controles visuales CS21A27B y navegación CS21A28.
- El frontend no necesitó un cambio CS21A30; CS21A30 corrige el motor financiero del Apps Script.
- Si Apps Script cambia, se entrega y conserva siempre el `Code.gs` completo. Los parches se usan solo como explicación técnica, nunca como reemplazo de producción.

## 3. Cambios consolidados CS21A20–CS21A30

### Consulta individual y progresión académica

- El botón **Consulta** del Panel Maestro abre Consulta individual con el estudiante precargado.
- Después de una escritura académica, la ficha se vuelve a leer; no debe quedar editable con estado anterior.
- Al cambiar `CA → APR`, el sistema revisa el siguiente nivel:
  - `PE → CA`, si el usuario confirma.
  - Si está `SIN REGISTRO`, puede crear la fila oficial en `ESTATUS` y dejarla en `CA`.
- La promoción es una operación protegida: nivel actual y siguiente se validan y escriben como una sola unidad.
- La creación faltante usa la misma cohorte únicamente si `GRUPOS` tiene configurada una fila real para el nivel siguiente.
- No se copian notas, evaluaciones ni certificado al nivel creado.
- No aplica para `REP`, otros estados o después de I2.

### Finanzas y comprobantes

- Un comprobante bancario con saldo `₡0` no aparece ni puede seleccionarse en Aplicar Pago.
- El buscador y el guardado final leen la misma fuente histórica de monto aplicado, incluida la columna J de `BDBANCARIO` cuando el encabezado está vacío.
- Certificado I2 y Programa Completo pueden pagarse juntos en una misma operación.
- La validación revisa todos los rubros incluidos en la factura actual, sin depender del orden del payload.
- La deuda completa de B1, B2 e I1 es: **Matrícula + Cuotas + Certificado**.
- La deuda completa de I2 es: **Matrícula + Cuotas + Certificado I2 + Programa Completo + TOEIC**.
- El certificado forma parte de la deuda desde que el nivel está registrado y activo, no solamente después de `APR`.
- `PE` y `SIN REGISTRO` no generan deuda.
- Los pagos aplicados no se mueven automáticamente entre niveles ni intentos.

### Intermedio II

- Certificado I2: `₡15.000`.
- Programa Completo: `₡15.000`.
- TOEIC: valor individual de `DATOS`; si no existe, valor configurado para la cohorte/nivel en `GRUPOS`.
- Una omisión o exoneración solo se respeta cuando está registrada explícitamente; no se inventa automáticamente.

### Panel Maestro · CONAPE

- Seguimiento inmediato muestra todos los periodos, no solo el mes actual.
- Identifica desembolsos adelantados cuando el periodo financiado es posterior al mes de detección.
- Orden: Estudiante, Movimiento, Desembolso, Periodo, Campus, Detectado, Contacto.
- La fecha de desembolso se formatea en español de Costa Rica; no muestra objetos JavaScript crudos.
- `Detalle` lee y edita `DATOS.COMENTARIO_ADMIN`.
- El botón `Consulta` abre el expediente individual ya cargado.
- Los gráficos financieros se pueden ocultar desde el título; **Seguimiento inmediato permanece siempre visible**.

## 4. Archivos frontend recientes activos

- `campus.html`
- `src/aplicar_pago_comprobante_guard_cs21a23.js`
- `src/admin_master_conape_movements_cs21a25.jsx` — comportamiento visual CS21A26.
- `src/admin_master_cobranza_collapse_cs21a27.js` — versión activa CS21A27B.
- `src/admin_master_conape_consulta_cs21a28.js`
- `src/admin_students_status_promotion_cs21a28.jsx`
- `src/admin_students_status_missing_next_cs21a29.jsx`

Los archivos anteriores se cargan desde `campus.html`. No crear otra copia con sufijo nuevo para un cambio menor si el archivo activo puede actualizarse de forma segura.

## 5. Datos y hojas críticas

- `DATOS`: identidad maestra, precios individuales y `COMENTARIO_ADMIN`.
- `ESTATUS`: trayectoria académica por estudiante, grupo y nivel.
- `GRUPOS`: periodos, fechas, docentes y precios por cohorte/nivel.
- `BDBANCARIO`: créditos bancarios y monto aplicado histórico.
- `PAGOS`, `OTROS PAGOS`, `PAGOS_CAMPUS`, `PAGOS_OPERACIONES`: evidencia y aplicación financiera.
- `INTENTOS_ACADEMICOS`: snapshots académicos y financieros por intento.
- Hojas CONAPE 1–7: integración protegida y de ejecución manual.

## 6. Restricciones críticas

- No alterar datos, pagos, certificados, `DATOS`, `ESTATUS`, CONAPE o calendario sin análisis de impacto.
- No mover pagos entre niveles para “cuadrar” una ficha.
- No reutilizar comprobantes sin saldo.
- No publicar un traslado CONAPE pendiente como cambio académico definitivo.
- No ejecutar limpiezas pesadas dentro de endpoints de lectura del calendario o dashboard.
- No crear triggers automáticos para CONAPE.
- No mezclar Academia Play o English LAB con notas oficiales, aprobación, certificados o pagos.
- No afirmar que algo está desplegado si solo fue generado o guardado en GitHub.

## 7. Instalación del backend

1. Reconstruir el `Code.gs` canónico CS21A30 con `python AppsScript/RECONSTRUIR_CODE_GS.py`.
2. Validar su SHA-256 contra el manifiesto.
3. Reemplazar completamente el `Code.gs` en Apps Script.
4. Guardar.
5. Crear una versión nueva de la aplicación web.
6. Actualizar la implementación productiva.
7. Recargar el Campus con `Ctrl+F5`.

## 8. QA prioritario de continuidad

1. Estudiante con `CA → APR` y siguiente nivel en `PE`.
2. Estudiante con `CA → APR` y siguiente nivel `SIN REGISTRO`.
3. Nivel activo `CA` con certificado pendiente incluido en la deuda.
4. I2 con certificado, Programa Completo y TOEIC pendientes.
5. Comprobante agotado fuera del buscador.
6. Factura que paga Certificado I2 y Programa Completo juntos.
7. Movimiento CONAPE adelantado con Detalle y Consulta.
8. Seguimiento inmediato visible con gráficos ocultos.
