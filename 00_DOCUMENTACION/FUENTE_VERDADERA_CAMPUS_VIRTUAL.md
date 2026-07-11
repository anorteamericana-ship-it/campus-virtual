# FUENTE VERDADERA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

**Versión integral vigente:** F98.4-Z6-CS21A32  
**Backend canónico:** F98.4-Z6-CS21A32  
**Frontend activo:** línea F98.4-Z6-CS21A32  
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

El backend vigente es CS21A32 y debe instalarse siempre como `Code.gs` completo. La copia completa se conserva en la carpeta institucional `CAMPUS_VIRTUAL_BACKEND_CANONICO` en TXT y ZIP. GitHub guarda versión, nombre, tamaño, hashes, reglas e instrucciones, pero no una copia parcial presentada como completa.

SHA-256 esperado del TXT completo CS21A32:

`956e71a003765b3c188f156ea24c8efa805162acbf00cedfd0134db1ada35a17`

No confundir **respaldado** con **desplegado**. CS21A32 requiere reemplazo manual de `Code.gs`, guardado, creación de versión y actualización de la implementación web.

## Estado funcional consolidado

- Panel Maestro abre **Cobranza y cartera** como primera sección.
- Seguimiento inmediato enlaza movimientos CONAPE con estudiante, nivel, grupo/intento y estado de morosidad.
- **Aplicado en sistema** exige evidencia real en `PAGOS`, `OTROS PAGOS` o `PAGOS_CAMPUS` del mismo estudiante, nivel y grupo/intento.
- `BDBANCARIO` no participa en la clasificación de aplicado porque es fuente bancaria cruda.
- Los movimientos pendientes más recientes quedan arriba; los aplicados se conservan abajo, fuera de la cola principal.
- Un pago sin grupo no se atribuye cuando existen varios intentos del mismo nivel.
- `7-morosidad` informa Moroso / No moroso / Sin fila, pero no decide por sí sola que un desembolso fue aplicado.
- No se mueven pagos entre niveles ni intentos.
- Aplicar Pago excluye comprobantes agotados.
- Certificado I2 y Programa Completo pueden pagarse juntos.
- La deuda incluye certificado en todos los niveles activos; I2 agrega Programa Completo y TOEIC.
- `CA → APR` puede activar o crear el siguiente nivel de forma protegida.

## Fuentes críticas

- Identidad y trayectoria: `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS`.
- Pagos aplicados: `PAGOS`, `OTROS PAGOS`, `PAGOS_CAMPUS`, `PAGOS_OPERACIONES`.
- Banco crudo: `BDBANCARIO`, excluido del indicador “Aplicado en sistema” de CONAPE.
- CONAPE: archivos/hojas 1–7 protegidos y actualización manual.

## QA prioritario

1. Movimiento CONAPE con coincidencia exacta de estudiante, periodo, nivel y grupo, con pago aplicado.
2. Movimiento sin pago aplicado que permanece arriba como pendiente.
3. Repetición del mismo nivel: el pago del intento anterior no debe marcar el nuevo intento.
4. Pago sin grupo con varios intentos: debe quedar ambiguo, no aplicado.
5. Aplicados visibles únicamente en el bloque inferior.
6. Orden de pendientes por detección más reciente.
7. Morosidad SI/NO/SIN FILA visible sin alterar datos.
