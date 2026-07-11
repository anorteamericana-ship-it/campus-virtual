# FUENTE VERDADERA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

**Versión integral vigente:** F98.4-Z6-CS21A30  
**Backend canónico:** F98.4-Z6-CS21A30  
**Frontend activo:** línea F98.4-Z6-CS21A29  
**Corte:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · `main`

Este archivo es la entrada única de continuidad. Los documentos sin sufijo de versión dentro de `00_DOCUMENTACION` son los únicos canónicos; los cortes anteriores se conservan en el historial de Git, no como copias activas.

## Documentos canónicos

- `README_CONTINUIDAD.md` — estado operativo completo.
- `BIBLIA_DELTA_ACTUAL.md` — reglas aprobadas.
- `SKILL_CAMPUS_VIRTUAL.md` — forma de trabajo y checklist.
- `PROMPT_CONTINUIDAD.md` — texto para iniciar otro chat.
- `MANIFIESTO_ACTUAL.json` — versión, archivos y hashes.
- `../AppsScript/README.md` — ubicación e integridad del backend.

## Backend

El backend vigente es CS21A30 y debe instalarse siempre como `Code.gs` completo. La copia exacta fue guardada en el Drive institucional en formatos TXT y ZIP. GitHub conserva su versión, nombre, tamaño, hash, reglas e instrucciones en `AppsScript/README.md` y `MANIFIESTO_ACTUAL.json`.

El conector disponible bloqueó la carga directa del archivo de 2,8 MB y también sus formas comprimidas. Por transparencia, no existe en `main` una copia parcial presentada como completa; los fragmentos fallidos fueron retirados.

SHA-256 esperado del TXT completo CS21A30:

`007f26c35e5c42015c40a238fbc9523eacf7444a45323853427111f96adc83cc`

No confundir “respaldado” con “publicado en Apps Script”. La implementación web debe actualizarse manualmente después de reemplazar el código.

## Estado funcional consolidado

- Aplicar Pago excluye comprobantes agotados desde el buscador.
- Certificado I2 y Programa Completo pueden pagarse juntos.
- La deuda incluye certificado en todos los niveles activos.
- I2 incluye Certificado I2, Programa Completo y TOEIC.
- Panel Maestro muestra CONAPE de todos los periodos y desembolsos adelantados.
- Detalle administrativo es editable desde Seguimiento inmediato.
- Consulta se abre precargada desde CONAPE.
- Los gráficos financieros son colapsables sin ocultar Seguimiento inmediato.
- `CA → APR` puede activar `PE → CA` o crear el siguiente nivel faltante como `CA` en una sola operación.
- Consulta individual se actualiza después de guardar para evitar edición sobre estados atrasados.

## Fuentes de datos críticas

- APOLLO: `DATOS`, `ESTATUS`, `GRUPOS`, `BDBANCARIO`, `PAGOS`, `OTROS PAGOS`, `PAGOS_CAMPUS`.
- Campus operativo: `PLAN_ESTUDIANTE_NIVELES`, `PAGOS_CAMPUS`, `PAGOS_OPERACIONES`, `INTENTOS_ACADEMICOS` y hojas auxiliares.
- CONAPE: siete archivos/hojas originales protegidos, sin triggers automáticos.

## Regla pedagógica

Academia Play y English LAB son práctica. No guardan notas oficiales ni afectan evaluaciones, aprobación, certificados o pagos.

## Próximo trabajo recomendado

QA real de CS21A30 antes de agregar más reglas:

1. Validar deuda completa en B1/B2/I1 activos.
2. Validar I2 con cinco rubros.
3. Validar creación del siguiente nivel faltante.
4. Confirmar que la nueva Consulta se carga después de una escritura.
5. Revisar que no existan duplicados de archivos frontend activos.
