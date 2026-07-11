# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — ESTADO VIGENTE

**Versión integral:** F98.4-Z6-CS21A34  
**Backend canónico:** F98.4-Z6-CS21A34  
**Frontend activo:** F98.4-Z6-CS21A33  
**Corte documental:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · rama `main`

## 1. Cambio CS21A34

CS21A34 corrige únicamente el origen de datos del indicador **Aplicado en sistema**. CS21A33 leía una pestaña local llamada `7-morosidad`; CS21A34 abre directamente el archivo externo oficial de CONAPE.

### Fuente exacta

- ID: `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`
- Nombre: `7-morosidad`
- Pestaña: `Hoja 1`
- Lectura: directa con `SpreadsheetApp.openById(...)`, solo lectura.

El backend valida además que el ID configurado coincida exactamente con el contrato oficial y que existan los encabezados requeridos.

## 2. Regla decisiva

1. Tomar la cédula, mes y año del movimiento CONAPE.
2. Convertir el mes: 01–04=P1, 05–08=P2, 09–12=P3.
3. Buscar en la hoja externa por `estudiante_id + ano + periodo`.
4. `estado = NO` → aplicado.
5. `estado = SI` → pendiente.
6. Sin fila exacta → pendiente para revisión.
7. Si hay duplicidad conflictiva, `SI` prevalece.

`PAGOS`, `OTROS PAGOS` y `PAGOS_CAMPUS` quedan como contexto; `BDBANCARIO` no participa.

## 3. Verificación real

Archivo `7-morosidad`, pestaña `Hoja 1`:

- cédula `119760781`, fila 149: 2026 / periodo 2 / `NO`;
- cédula `119760781`, fila 297: 2026 / periodo 3 / `NO`.

Movimiento `09/2026` → periodo 3 → fila 297 → **Aplicado en sistema**.

## 4. Archivos modificados

### Backend

- `Code.gs` completo CS21A34.

### Documentación

- `00_DOCUMENTACION/FUENTE_VERDADERA_CAMPUS_VIRTUAL.md`
- `00_DOCUMENTACION/README_CONTINUIDAD.md`
- `00_DOCUMENTACION/BIBLIA_DELTA_ACTUAL.md`
- `00_DOCUMENTACION/PROMPT_CONTINUIDAD.md`
- `00_DOCUMENTACION/MANIFIESTO_ACTUAL.json`
- `AppsScript/README.md`

### Frontend

No se modificó. Permanece CS21A33.

## 5. Backend completo

- TXT: `Code_F98_4_Z6_CS21A34_SEGUIMIENTO_CONAPE_FUENTE_OFICIAL_COMPLETO.txt`
- ZIP: `Code_F98_4_Z6_CS21A34_SEGUIMIENTO_CONAPE_FUENTE_OFICIAL_COMPLETO.zip`
- Líneas: 49.939
- Tamaño TXT: 2.867.080 bytes
- SHA-256 TXT: `c4b4b3c18091e9413c0722d2c5ae0748b5c756927f9bf2f934c8d6dbe6c0dd35`
- Tamaño ZIP: 740.516 bytes
- SHA-256 ZIP: `1cb825af1d52adeaa48540cdf4720189d5b6cc3da8d0a5095bc505afeaa8257b`
- Sintaxis: `node --check` aprobada.

## 6. Despliegue

No está confirmado en producción. Se requiere reemplazar todo `Code.gs`, guardar, crear versión, actualizar la implementación y validar el caso `119760781 / 09-2026 / P3 / NO`.
