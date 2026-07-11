# FUENTE VERDADERA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

**Versión integral vigente:** F98.4-Z6-CS21A43  
**Backend canónico:** F98.4-Z6-CS21A43  
**Frontend activo:** F98.4-Z6-CS21A43  
**Corte:** 11-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · `main`

## 1. Cambio CS21A43

Seguimiento inmediato se reorganiza para mostrar toda la información útil sin scroll horizontal:

1. Código del estudiante en la primera columna, solo el número y seleccionable.
2. Estudiante con nombre, cédula, seguimiento y acceso a Consulta individual.
3. Resumen académico leído directamente del archivo externo oficial `6-historial`.
4. Movimiento y estado exacto de `7-morosidad`.
5. Periodo/nivel con fecha detectada abreviada en la misma columna.
6. Campus y botón WA siempre visibles.

La columna independiente `Detectado` desaparece y el texto `CLIC + CTRL C` queda eliminado.

## 2. Fuente académica oficial

- Archivo: `6-historial`
- Spreadsheet ID: `13rd_tMKkTS6CLqSJt1PWS7GNmLxAVrsqRAO395tynZI`
- Pestaña: `Hoja 1`
- Lectura: directa y de solo lectura.

Cada fila se transforma sin alterar la fuente. Ejemplo:

- `ING-IN-B1-01`, 2025, periodo 3, tipo C, APR, 100 → `BÁSICO I · 20253C · APR 100`
- `ING-IN-I2-04`, 2026, periodo 3, tipo C, PE → `INTERMEDIO II · 20263C · PE`

Se conservan todas las filas e intentos existentes. No se deduplican por conveniencia ni se cambian notas o estatus.

## 3. Backend canónico

Archivo productivo completo: `Code.gs`.

- Nombre de entrega: `Code_F98_4_Z6_CS21A43_SEGUIMIENTO_HISTORIAL_COMPLETO.gs`
- Tamaño: 2,877,888 bytes
- SHA-256: `8eefafd6f8054033273c4a4451e85a55ce66735ccfeb6b141f820c290471fcca`
- Validación: `node --check` aprobada.

CS21A43 agrega el índice `_cs21a43HistoryIndex_()` y adjunta `historySummary` a cada movimiento del Panel Maestro. También usa una nueva llave de caché `MASTER_DASH_CS21A43_V1` para impedir que el navegador reciba la estructura anterior.

## 4. Archivos frontend

- `src/admin_master_conape_movements_cs21a25.jsx`
- `styles/admin_master_conape_identity_cs21a39.css`
- `campus.html`

El acceso a Consulta individual se integra dentro del componente principal. `campus.html` deja de cargar el antiguo parche DOM `admin_master_conape_consulta_cs21a28.js`.

## 5. Reglas preservadas

- La fuente oficial de aplicación continúa siendo `7-morosidad`.
- `NO` = aplicado; `SI` = pendiente; sin fila exacta = revisión.
- El resumen académico es informativo y no modifica `6-historial`.
- El frontend no escribe directamente en pagos, DATOS, ESTATUS, GRUPOS, intentos ni CONAPE.
- No se mueve dinero entre niveles o intentos.
- WhatsApp, detalle persistente y Consulta individual permanecen activos.

## 6. Estado de despliegue

Código preparado para entrega. Guardado o respaldado no significa publicado en producción. La publicación debe verificarse después de reemplazar `Code.gs`, crear una nueva implementación y desplegar el frontend.
