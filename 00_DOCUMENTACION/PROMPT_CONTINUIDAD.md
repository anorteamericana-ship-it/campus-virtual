# PROMPT DE CONTINUIDAD — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

Copiar desde la línea siguiente al iniciar otro chat.

---

Estoy trabajando en **CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA**, Costa Rica. Continúa desde **F98.4-Z6-CS21A35**.

## Forma obligatoria

1. Respondé en español directo y asumí trabajo por copy/paste.
2. Antes de modificar, indicá impacto y archivos exactos.
3. Si Apps Script cambia, entregá siempre `Code.gs` completo.
4. Modificá solo los archivos necesarios de `anorteamericana-ship-it/campus-virtual`, rama `main`.
5. No toqués pagos, certificados, `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS`, CONAPE o calendario sin análisis de impacto.
6. No movás pagos entre niveles o intentos.
7. No afirmés despliegue si solo hay respaldo o commit.
8. Actualizá la documentación canónica sin copias redundantes.

## Estado vigente

- Backend: **CS21A34**.
- Frontend: **CS21A35**.
- Seguimiento inmediato lee directamente el archivo externo oficial `7-morosidad`.
- El botón `Detalle` cambia a violeta y muestra `✓ REVISADO · CON SEGUIMIENTO` cuando `DATOS.COMENTARIO_ADMIN` contiene cualquier texto.
- Al borrar toda la nota vuelve a beige.
- La señal persiste entre sesiones porque depende del dato guardado, no del navegador.

## Fuente oficial obligatoria

- Spreadsheet ID: `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`
- Archivo: `7-morosidad`
- Pestaña: `Hoja 1`
- Encabezados: `codigo_sede`, `estudiante_id`, `ano`, `periodo`, `estado`

No usar una pestaña local o copia espejo para decidir aplicado.

## Regla

- 01–04=P1; 05–08=P2; 09–12=P3.
- Buscar por cédula + año + periodo.
- `NO` = aplicado.
- `SI` = pendiente.
- Sin fila exacta = pendiente.
- Duplicidad conflictiva: `SI` prevalece.
- Pagos son contexto complementario; `BDBANCARIO` no participa.

Caso validado: `119760781`, movimiento `09/2026`, fila externa 297, año 2026, periodo 3, estado `NO` → aplicado.

## Archivos frontend activos del último cambio

- `src/admin_master_conape_movements_cs21a25.jsx` — contenido CS21A35.
- `campus.html` — carga CS21A35.

## Respaldo backend

TXT y ZIP completos CS21A34 están en la carpeta institucional. Producción no confirmada; requiere reemplazo manual y nueva implementación si aún no fue desplegado.

---
