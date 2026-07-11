# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — ESTADO VIGENTE

**Versión integral:** F98.4-Z6-CS21A35  
**Backend canónico:** F98.4-Z6-CS21A34  
**Frontend activo:** F98.4-Z6-CS21A35  
**Corte documental:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · rama `main`

## 1. Cambio CS21A35

CS21A35 modifica únicamente el frontend de **Seguimiento inmediato** para distinguir visualmente los estudiantes que ya tienen una nota de seguimiento guardada.

- Sin texto en `DATOS.COMENTARIO_ADMIN`: botón `Detalle` beige.
- Con cualquier texto: botón violeta fuerte con `✓ REVISADO · CON SEGUIMIENTO`.
- El cambio aparece inmediatamente después de guardar.
- Si se elimina toda la nota, vuelve al estado beige.
- La señal persiste entre sesiones y equipos porque se deriva del valor real guardado.
- No altera aplicación CONAPE, morosidad, pagos, filas, orden ni clasificación.

Archivos frontend modificados:

- `src/admin_master_conape_movements_cs21a25.jsx` — contenido activo CS21A35.
- `campus.html` — cache-busting CS21A35.

## 2. Backend preservado CS21A34

CS21A34 abre directamente el archivo externo oficial de CONAPE:

- ID: `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`
- Nombre: `7-morosidad`
- Pestaña: `Hoja 1`
- Lectura directa con `SpreadsheetApp.openById(...)`, solo lectura.

El backend valida que el ID configurado coincida exactamente con el contrato oficial y que existan los encabezados requeridos.

## 3. Regla decisiva CONAPE

1. Tomar la cédula, mes y año del movimiento CONAPE.
2. Convertir el mes: 01–04=P1, 05–08=P2, 09–12=P3.
3. Buscar en la hoja externa por `estudiante_id + ano + periodo`.
4. `estado = NO` → aplicado.
5. `estado = SI` → pendiente.
6. Sin fila exacta → pendiente para revisión.
7. Si hay duplicidad conflictiva, `SI` prevalece.

`PAGOS`, `OTROS PAGOS` y `PAGOS_CAMPUS` quedan como contexto; `BDBANCARIO` no participa.

## 4. Verificación real

Archivo `7-morosidad`, pestaña `Hoja 1`:

- cédula `119760781`, fila 149: 2026 / periodo 2 / `NO`;
- cédula `119760781`, fila 297: 2026 / periodo 3 / `NO`.

Movimiento `09/2026` → periodo 3 → fila 297 → **Aplicado en sistema**.

## 5. Backend completo

- TXT: `Code_F98_4_Z6_CS21A34_SEGUIMIENTO_CONAPE_FUENTE_OFICIAL_COMPLETO.txt`
- ZIP: `Code_F98_4_Z6_CS21A34_SEGUIMIENTO_CONAPE_FUENTE_OFICIAL_COMPLETO.zip`
- Líneas: 49.939
- Tamaño TXT: 2.867.080 bytes
- SHA-256 TXT: `c4b4b3c18091e9413c0722d2c5ae0748b5c756927f9bf2f934c8d6dbe6c0dd35`
- Tamaño ZIP: 740.516 bytes
- SHA-256 ZIP: `1cb825af1d52adeaa48540cdf4720189d5b6cc3da8d0a5095bc505afeaa8257b`
- Sintaxis: `node --check` aprobada.

## 6. Estado de despliegue

Los cambios están guardados en GitHub, pero no se afirma que el frontend esté publicado en producción. CS21A34 también requiere instalación manual de `Code.gs` si aún no se ha desplegado.
