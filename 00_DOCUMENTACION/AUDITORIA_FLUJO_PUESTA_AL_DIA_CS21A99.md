# Auditoría del flujo Poner al día · CS21A99

## Alcance

Se reconstruyó el flujo real de promoción académica, creación de intentos, aplicación de pagos y sincronización CONAPE antes de modificar el sistema.

Fuentes revisadas:

- frontend de Consulta individual;
- endpoints de promoción y pago;
- `ESTATUS`;
- `INTENTOS_ACADEMICOS`;
- `PAGOS_OPERACIONES`;
- `PAGOS`, `OTROS PAGOS`, `PAGOS_CAMPUS` y `BDBANCARIO`;
- sincronización de las hojas CONAPE 4–7.

## Hallazgos

### 1. Lecturas completas repetidas

El flujo anterior consultaba la ficha antes de promover, volvía a reconstruirla después del guardado y la cargaba nuevamente al abrir el pago. El comprobante podía consultarse hasta tres veces dentro de la misma operación.

### 2. Sincronización CONAPE en pasos intermedios

La promoción ejecutaba CONAPE antes de abrir el pago. El motor financiero también sincronizaba y su wrapper podía hacerlo nuevamente. Una puesta al día podía intentar hasta tres sincronizaciones externas.

### 3. Intentos académicos duplicados

La promoción creaba un intento `PROMOCION_*` con identificador nuevo. La reconstrucción posterior derivaba otro identificador desde `ESTATUS`; al no coincidir por ID, la migración automática creaba un segundo intento activo.

Casos de referencia auditados:

- 17178 · B2;
- 17186 · B2.

### 4. Motor financiero válido pero sobrecargado

Se preservaron:

- idempotencia por `REQUEST_ID`;
- hash del payload;
- validación del saldo bancario;
- escritura en las fuentes financieras oficiales;
- journal de `PAGOS_OPERACIONES`;
- reversión integral.

La optimización consiste en separar el pago local de la sincronización CONAPE, no en reemplazar el motor.

## Diseño aplicado

### Paso 1 · Académico local

- `CA → APR` con nota igual o superior a 70.
- Siguiente nivel `PE → CA`, o creación segura cuando no existe.
- Consolidación de un solo intento activo por código, nivel, grupo y número de intento.
- Sin sincronización CONAPE.

### Paso 2 · Pago local

- búsqueda exacta del comprobante;
- detalle del total original, aplicado previo, saldo disponible y saldo posterior;
- precio unitario de cada rubro;
- cantidad contractual y cantidad pendiente de cuotas;
- controles de cantidad;
- botón `Completar deuda con saldo`;
- aplicación local con `sincronizar_conape:false`.

### Paso 3 · Decisión CONAPE

- `Actualizar CONAPE ahora`: una sincronización explícita;
- `Dejar CONAPE pendiente`: conserva expediente y pago local sin revertirlos.

## Limpieza de frontend

Dejaron de cargarse desde `campus.html`:

- `admin_students_status_promotion_cs21a28.jsx`;
- `admin_students_status_missing_next_cs21a29.jsx`;
- `admin_students_status_fresh_cs21a42.jsx`.

Los archivos permanecen temporalmente como historial técnico. El pago inline A36 sigue cargado como respaldo.

## Zona protegida

La MÁSCARA de Keylor no forma parte del flujo modificado. Las funciones `_demoKeylor*`, perfiles demo y bloqueos `demo/read_only` se compararon contra A98. No se perdió ni modificó ninguna de las 69 funciones identificadas.

## Riesgos que requieren prueba en Apps Script

- concurrencia real de dos operadores;
- tiempos efectivos del motor financiero;
- comportamiento de una modificación de plan CONAPE bloqueada;
- actualización visual de la radiografía después de cerrar el asistente;
- confirmación de un único intento activo tras promover estudiantes reales.
