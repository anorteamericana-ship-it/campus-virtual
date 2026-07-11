# PROMPT DE CONTINUIDAD — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

Copiar desde la línea siguiente al iniciar otro chat.

---

Estoy trabajando en el proyecto **CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA**, Costa Rica. Continúa desde el corte **F98.4-Z6-CS21A33**.

## Forma obligatoria de trabajo

1. Respondeme en español directo y asumí que trabajo por copy/paste.
2. Antes de modificar, indicá impacto y archivos exactos.
3. Si Apps Script cambia, entregá siempre el `Code.gs` completo.
4. Modificá únicamente los archivos necesarios de `anorteamericana-ship-it/campus-virtual`, rama `main`.
5. No toqués pagos, certificados, `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS`, `7-morosidad`, CONAPE o calendario sin análisis de impacto.
6. No movás pagos entre niveles o intentos.
7. No afirmés despliegue si solo fue respaldado o guardado en GitHub.
8. Actualizá la documentación canónica sin crear copias redundantes.

## Estado vigente

- Backend: **CS21A33**.
- Frontend: **CS21A33**.
- Cobranza y cartera abre primero.
- Seguimiento inmediato ordena pendientes recientes arriba y aplicados abajo.

## Regla decisiva CS21A33

Para clasificar un movimiento CONAPE:

- Convertir el mes a periodo de `7-morosidad`:
  - 01–04 = P1;
  - 05–08 = P2;
  - 09–12 = P3.
- Buscar por cédula + año + periodo.
- Estado `NO` = **Aplicado en sistema**.
- Estado `SI` = pendiente.
- Sin fila exacta = pendiente para revisión.
- `PAGOS`, `OTROS PAGOS` y `PAGOS_CAMPUS` son contexto complementario.
- `BDBANCARIO` no participa.

Caso aprobado: cédula `119760781`, CONAPE `09/2026`, `7-morosidad` año `2026`, periodo `3`, estado `NO` → **Aplicado en sistema**.

## Archivos recientes activos

- `campus.html`
- `src/admin_master_conape_movements_cs21a25.jsx`
- `src/admin_master_cobranza_first.js`
- `src/admin_master_cobranza_collapse_cs21a27.js`
- `src/admin_master_conape_consulta_cs21a28.js`
- `src/aplicar_pago_comprobante_guard_cs21a23.js`
- `src/admin_students_status_promotion_cs21a28.jsx`
- `src/admin_students_status_missing_next_cs21a29.jsx`

## Respaldo backend

- TXT y ZIP completos CS21A33 en la carpeta institucional `CAMPUS_VIRTUAL_BACKEND_CANONICO`.
- El Code.gs completo no se conserva dentro de GitHub.
- Estado de producción no confirmado; requiere reemplazo manual y nueva implementación.

---
