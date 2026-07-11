# FUENTE VERDADERA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

**Versión integral vigente:** F98.4-Z6-CS21A33  
**Backend canónico:** F98.4-Z6-CS21A33  
**Frontend activo:** línea F98.4-Z6-CS21A33  
**Corte:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · `main`

Este archivo es la entrada única de continuidad. Los documentos sin sufijo de versión dentro de `00_DOCUMENTACION` son los únicos canónicos; los cortes anteriores quedan en el historial de Git.

## Documentos canónicos

- `README_CONTINUIDAD.md`
- `BIBLIA_DELTA_ACTUAL.md`
- `SKILL_CAMPUS_VIRTUAL.md`
- `PROMPT_CONTINUIDAD.md`
- `MANIFIESTO_ACTUAL.json`
- `../AppsScript/README.md`

## Backend

El backend vigente es CS21A33 y debe instalarse siempre como `Code.gs` completo. La copia completa se conserva en la carpeta institucional `CAMPUS_VIRTUAL_BACKEND_CANONICO` en TXT y ZIP. GitHub guarda versión, nombre, tamaño, hashes, reglas e instrucciones, pero no una copia parcial presentada como completa.

SHA-256 esperado del TXT completo CS21A33:

`65e82291e2609120437a5fbfcdc0ea95793bdb0b41403362d99d0f65c5b69aa3`

No confundir **respaldado** con **desplegado**. CS21A33 requiere reemplazo manual de `Code.gs`, guardado, creación de versión y actualización de la implementación web.

## Regla vigente de Seguimiento inmediato CONAPE

- El periodo CONAPE mensual se convierte al periodo de `7-morosidad`:
  - meses 01–04 → periodo 1;
  - meses 05–08 → periodo 2;
  - meses 09–12 → periodo 3.
- La llave exacta es **cédula + año CONAPE + periodo cuatrimestral**.
- `7-morosidad.ESTADO = NO` significa **Aplicado en sistema**.
- `7-morosidad.ESTADO = SI` permanece pendiente.
- Sin fila exacta permanece pendiente para revisión.
- `PAGOS`, `OTROS PAGOS` y `PAGOS_CAMPUS` son evidencia complementaria, no deciden la clasificación.
- `BDBANCARIO` queda excluida porque es una fuente bancaria cruda.
- Los pendientes más recientes aparecen arriba; los aplicados quedan abajo, fuera de la cola principal.
- No se escriben cambios en `7-morosidad` ni se mueven pagos entre niveles o intentos.

## Caso patrón aprobado

Movimiento CONAPE: cédula `119760781`, periodo `09/2026`.  
Conversión: septiembre corresponde al periodo `3`.  
Fila exacta en `7-morosidad`: cédula `119760781`, año `2026`, periodo `3`, estado `NO`.  
Resultado: **Aplicado en sistema**.

## Estado funcional preservado

- Panel Maestro abre **Cobranza y cartera** como primera sección.
- Seguimiento inmediato permanece visible aunque se oculten los gráficos.
- Detalle sigue leyendo/escribiendo `DATOS.COMENTARIO_ADMIN`.
- Consulta sigue abriendo el expediente precargado.
- CONAPE sigue siendo manual y sin triggers automáticos.
- Las reglas académicas y financieras de CS21A30 se preservan.
