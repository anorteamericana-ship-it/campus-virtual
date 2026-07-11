# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A33

Esta Biblia Delta complementa la Biblia histórica y fija las reglas aprobadas hasta el corte del 10-jul-2026.

## 1. Apps Script

- Toda modificación de backend se entrega como `Code.gs` completo.
- Backend canónico vigente: CS21A33.
- No instalar fragmentos u overrides sueltos.
- No afirmar despliegue cuando solo existe respaldo o commit.

## 2. Seguimiento inmediato CONAPE

### 2.1 Conversión de periodo

`PERIODO_MES` de CONAPE se convierte así para consultar `7-morosidad`:

- 01, 02, 03, 04 → periodo 1.
- 05, 06, 07, 08 → periodo 2.
- 09, 10, 11, 12 → periodo 3.

### 2.2 Llave y clasificación

La búsqueda se realiza por:

`CEDULA + PERIODO_ANIO + PERIODO_CUATRIMESTRAL`

- Fila exacta con `ESTADO = NO` → **Aplicado en sistema**.
- Fila exacta con `ESTADO = SI` → pendiente.
- Sin fila exacta → pendiente para revisión.
- Si existen filas duplicadas conflictivas y alguna marca `SI`, prevalece la condición conservadora `SI` y se alerta la duplicidad.

### 2.3 Fuentes

- `7-morosidad` decide la clasificación.
- `PAGOS`, `OTROS PAGOS` y `PAGOS_CAMPUS` son complementarias.
- `BDBANCARIO` está excluida.
- La función es solo de lectura; no escribe ni corrige morosidad.

### 2.4 Orden visual

- Pendientes primero.
- Dentro de pendientes, detección más reciente primero.
- Aplicados fuera de la cola principal, en bloque inferior plegable.

## 3. Caso patrón

Cédula `119760781`, movimiento `09/2026`:

- septiembre → periodo 3;
- `7-morosidad`: año 2026, periodo 3, estado NO;
- resultado: **Aplicado en sistema**.

## 4. Reglas críticas preservadas

- No mover pagos entre niveles o intentos.
- No modificar `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS` o `7-morosidad` desde este cruce.
- No crear triggers automáticos para CONAPE.
- No presentar solicitudes pendientes como pagos aplicados.
- Pago de certificado y emisión documental siguen siendo conceptos separados.
- B1/B2/I1: Matrícula + Cuotas + Certificado.
- I2: Matrícula + Cuotas + Certificado I2 + Programa Completo + TOEIC.
