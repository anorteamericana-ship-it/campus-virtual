# F98.4-Z6-CS21A79 — Calendario académico persistente

## Regla corregida

La opción **Superadmin/Admin → Calendario académico** utiliza `getGruposActivos({ alcance: 'COMPLETO' })` y debe conservar todos los códigos existentes en `GRUPOS`.

Ningún grupo puede desaparecer porque:

- el sistema calcule que ya debería estar en el siguiente nivel;
- su calendario haya terminado;
- no tenga estudiantes `CA` en ese momento;
- no tenga lecciones generadas;
- su categoría resulte `OTRO`;
- exista un nivel futuro o proyectado.

## Nivel mostrado

La selección del nivel prioriza estados reales de `GRUPOS.COMENTARIO`:

1. último nivel marcado `EN CURSO`;
2. si no existe, último nivel marcado `COMPLETADO` o `CERRADO`;
3. únicamente cuando no existe un estado operativo real se usan fechas y calendario como respaldo;
4. un nivel futuro nunca desplaza un nivel real ya registrado.

Por tanto, si un grupo permanece indefinidamente en B2, seguirá apareciendo en B2 hasta que la fuente oficial registre otro nivel operativo.

## Alcance

- Cambio únicamente en backend.
- Frontend preservado: ya solicita alcance `COMPLETO`.
- Nueva clave de caché para no reutilizar listas incompletas anteriores.
- No modifica `GRUPOS`, `ESTATUS`, `DATOS`, calendarios, estudiantes, pagos, certificados ni CONAPE.
- Solo cambia la lectura y selección de grupos del Calendario académico.

## Fuente canónica

- Drive `Code.gs`: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Respaldo previo: `Code_BACKUP_PRE_CS21A79_2026-07-13.gs`.
- Apps Script publicado: pendiente de crear nueva versión y verificar en producción.
