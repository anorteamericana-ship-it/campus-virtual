# Apps Script — backend canónico

## Versión vigente

`F98.4-Z6-CS21A32`

El archivo productivo se llama `Code.gs` y debe reemplazarse completo en Apps Script. No concatenar parches sobre una versión desconocida.

## Cambio CS21A32

Seguimiento inmediato CONAPE:

- enlaza movimiento con estudiante, periodo, nivel y grupo/intento;
- informa morosidad SI/NO/SIN FILA;
- marca **Aplicado en sistema** únicamente con pagos reales en `PAGOS`, `OTROS PAGOS` o `PAGOS_CAMPUS`;
- excluye `BDBANCARIO` de esa clasificación;
- no reutiliza pagos de otro intento;
- no escribe pagos, ESTATUS, GRUPOS ni 7-morosidad;
- ordena pendientes recientes arriba y conserva aplicados abajo.

## Drive institucional

Carpeta: `CAMPUS_VIRTUAL_BACKEND_CANONICO`

- TXT completo: ID `1FpHFcCSjrM_MHp0CUHjzmPvFABCAUwWV`.
- ZIP completo: ID `1rG_WuF3aAd4dESWi_s82N3QBL6OAOoEd`.

## Integridad del TXT completo

- Nombre: `Code_F98_4_Z6_CS21A32_SEGUIMIENTO_CONAPE_APLICADO_SISTEMA_COMPLETO.txt`
- Líneas: 49.925
- Tamaño: 2.865.858 bytes
- SHA-256: `956e71a003765b3c188f156ea24c8efa805162acbf00cedfd0134db1ada35a17`
- Validación: `node --check` aprobada.

## Integridad del ZIP

- Nombre: `Code_F98_4_Z6_CS21A32_SEGUIMIENTO_CONAPE_APLICADO_SISTEMA_COMPLETO.zip`
- Tamaño: 737.151 bytes
- SHA-256: `9be3db6c387cd58320bff742a5dc33ce0416ec3e421ca19cc56ac86b07770e44`

## Instalación

1. Abrir la copia TXT o descargar el ZIP desde Drive.
2. Confirmar SHA-256 en restauraciones críticas.
3. Reemplazar completamente `Code.gs`.
4. Guardar y crear una versión nueva.
5. Actualizar la implementación web.
6. Recargar el Campus con `Ctrl+F5`.
7. Probar intentos únicos, repetidos y pagos sin grupo.

## Estado de despliegue

La generación, validación, respaldo en Drive y documentación en GitHub no prueban que la implementación productiva haya sido actualizada. No afirmar despliegue sin evidencia.

## Regla de almacenamiento

- Mantener una sola referencia canónica vigente.
- No guardar fragmentos incompletos.
- No crear copias documentales versionadas redundantes.
- Git conserva historial; Drive conserva el TXT y ZIP completos vigentes.
