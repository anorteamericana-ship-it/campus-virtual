# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A34

Esta Biblia Delta fija las reglas aprobadas hasta el corte del 10-jul-2026.

## 1. Apps Script

- Toda modificación de backend se entrega como `Code.gs` completo.
- Backend canónico: CS21A34.
- Frontend activo: CS21A33.
- No instalar fragmentos ni afirmar despliegue sin evidencia.

## 2. Fuente oficial de morosidad CONAPE

El único origen válido para clasificar Seguimiento inmediato es:

- Spreadsheet ID `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`.
- Archivo `7-morosidad`.
- Pestaña `Hoja 1`.

La lectura debe abrir directamente ese archivo externo. Una pestaña local, réplica, caché o copia con el mismo nombre no puede decidir la clasificación.

## 3. Llave y clasificación

`CEDULA + PERIODO_ANIO + PERIODO_CUATRIMESTRAL`

Conversión:

- 01–04 → P1.
- 05–08 → P2.
- 09–12 → P3.

Resultado:

- fila exacta con `ESTADO = NO` → **Aplicado en sistema**;
- fila exacta con `ESTADO = SI` → pendiente;
- sin fila exacta → pendiente para revisión;
- duplicidad conflictiva → prevalece `SI` y se alerta.

La lectura es de solo lectura. No modifica el archivo externo.

## 4. Fuentes complementarias

- `PAGOS`, `OTROS PAGOS` y `PAGOS_CAMPUS` son contexto complementario.
- `BDBANCARIO` está excluida.
- Ninguna evidencia complementaria reemplaza el estado oficial de `7-morosidad`.

## 5. Caso patrón verificado

Cédula `119760781`, movimiento `09/2026`:

- septiembre → P3;
- hoja externa oficial, fila 297 → año 2026, periodo 3, estado `NO`;
- resultado → **Aplicado en sistema**.

La fila de periodo 2, aunque también sea `NO`, no se usa para un movimiento de septiembre.

## 6. Reglas críticas preservadas

- No mover pagos entre niveles o intentos.
- No modificar `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS` ni la hoja externa desde este cruce.
- No crear triggers automáticos para CONAPE.
- Pendientes recientes arriba; aplicados fuera de la cola principal.
