# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — ESTADO VIGENTE

**Versión integral:** F98.4-Z6-CS21A33  
**Backend canónico:** F98.4-Z6-CS21A33  
**Frontend activo:** F98.4-Z6-CS21A33  
**Corte documental:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · rama `main`

## 1. Cambio CS21A33

CS21A33 corrige la clasificación de **Aplicado en sistema** dentro de Seguimiento inmediato CONAPE.

### Regla decisiva

1. Tomar la cédula del movimiento CONAPE.
2. Tomar `PERIODO_ANIO`.
3. Convertir `PERIODO_MES` al periodo de `7-morosidad`:
   - 01–04 = periodo 1;
   - 05–08 = periodo 2;
   - 09–12 = periodo 3.
4. Buscar la fila exacta en `7-morosidad` por cédula + año + periodo.
5. Estado `NO` = **Aplicado en sistema**.
6. Estado `SI` = pendiente.
7. Sin fila exacta = pendiente para revisión.

### Fuentes

- Fuente decisiva: `7-morosidad`.
- Fuentes complementarias: `PAGOS`, `OTROS PAGOS`, `PAGOS_CAMPUS`.
- Fuente excluida: `BDBANCARIO`.

Los pagos complementarios pueden mostrarse como contexto, pero no cambian el resultado derivado de `7-morosidad`.

## 2. Ejemplo validado

- Cédula: `119760781`.
- Código: `17170`.
- Movimiento CONAPE: `09/2026`.
- Conversión: septiembre → periodo `3`.
- `7-morosidad`: año `2026`, periodo `3`, estado `NO`.
- Resultado esperado: **Aplicado en sistema** y movimiento fuera de la cola principal.

## 3. Comportamiento visual

- Pendientes recientes arriba.
- Aplicados en el bloque inferior plegable.
- La columna Movimiento muestra la referencia exacta: año, periodo y estado de `7-morosidad`.
- Estado `NO` se muestra como aplicado.
- Estado `SI` se muestra como pendiente.
- Sin fila exacta se muestra como pendiente de revisión.

## 4. Archivos activos modificados

- `campus.html`
- `src/admin_master_conape_movements_cs21a25.jsx` — contenido activo CS21A33.

## 5. Backend completo

- TXT: `Code_F98_4_Z6_CS21A33_SEGUIMIENTO_CONAPE_7_MOROSIDAD_COMPLETO.txt`
- ZIP: `Code_F98_4_Z6_CS21A33_SEGUIMIENTO_CONAPE_7_MOROSIDAD_COMPLETO.zip`
- Líneas TXT: 49.935
- Tamaño TXT: 2.866.369 bytes
- SHA-256 TXT: `65e82291e2609120437a5fbfcdc0ea95793bdb0b41403362d99d0f65c5b69aa3`
- Tamaño ZIP: 739.779 bytes
- SHA-256 ZIP: `3c5bdf8793baf4231106c599f42aa76650434211981bddced83ab9e2f0e36c75`
- Sintaxis del backend: `node --check` aprobada.

## 6. Estado preservado

- Cobranza y cartera sigue cargando primero por CS21A31.
- Seguimiento inmediato sigue visible con gráficos ocultos.
- Detalle y Consulta se conservan.
- CONAPE continúa manual y sin triggers.
- No se modifica `7-morosidad` desde el panel.
- No se mueven pagos entre niveles o intentos.

## 7. Despliegue

GitHub y Drive confirman código guardado y respaldo íntegro. Eso no confirma producción.

1. Abrir el TXT completo CS21A33.
2. Reemplazar completamente `Code.gs`.
3. Guardar y crear versión.
4. Actualizar la implementación web.
5. Recargar el Campus con `Ctrl+F5`.
6. Validar el caso `119760781 / 09-2026 / periodo 3 / NO`.
