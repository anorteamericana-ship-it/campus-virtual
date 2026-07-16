# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral:** F98.4-Z6-CS21A101  
**Frontend vigente en GitHub:** F98.4-Z6-CS21A101  
**Backend integral entregado:** F98.4-Z6-CS21A101  
**Backend Apps Script publicado:** no verificado  
**Producción:** no verificada  
**Corte:** 16-jul-2026

## Cambio vigente CS21A101

`Seguimiento inmediato` gestiona exclusivamente el primer desembolso de cada periodo:

- `01`: desembolso académico; seguimiento, semáforo, WhatsApp y cierre de la Academia.
- `02`: sostenimiento; visible como información, sin seguimiento.
- `03`: equipo electrónico; visible como información, sin seguimiento.
- `04+`: informativo mientras no exista una definición expresa distinta.

Los movimientos informativos permanecen en la cronología del periodo y conservan su fecha de detección, pero no crean fila independiente ni aparecen como `Nuevo desembolso`.

## Protección backend

- `setConapeRevisionSemaforo` rechaza movimientos cuyo `NUM_DESEMBOLSO` no sea 1.
- `getConapeRevisionSemaforos` y `getConapeRevisionChanges` excluyen 02/03 del canal colaborativo.
- La fotografía del Panel Maestro marca cada contexto como académico o informativo.
- No se reescribe `CONAPE_MOVIMIENTOS_LOG` ni ninguno de los siete archivos CONAPE.

## Caso real auditado

Estudiante 17187 · AMPIE ARRIETA MELISSA MARIA:

- D1 `01/07/2026`: movimiento académico gestionable; conserva revisión 1.
- D2 `02/07/2026`: sostenimiento informativo; sin revisión guardada.

No fue necesario reparar datos.

## Funciones preservadas de CS21A100

- Flujo `Poner al día` en tres pasos.
- Pago local separado de CONAPE.
- Cierre CONAPE idempotente.
- Recarga del mismo estudiante después de la actualización.
- Journal, reversión y guardias contra duplicados.

## Backend

Usar únicamente:

`Code_F98_4_Z6_CS21A101_COMPLETO.gs`

Test de solo lectura:

`Test_CS21A101.gs` → `test_cs21a101_all`

## MÁSCARA de Keylor · PROTEGIDA

La comparación A100→A101 conserva las 69 funciones `_demoKeylor*`. No se modifican perfiles demo, pagos, certificados ni CONAPE desde esas cuentas.

## Publicación y prueba

1. copiar el backend integral A101 al proyecto Apps Script;
2. agregar temporalmente `Test_CS21A101.gs`;
3. ejecutar `test_cs21a101_all`;
4. retirar el test;
5. actualizar el deployment existente;
6. recargar el Campus con `Ctrl + F5`;
7. revisar 17187;
8. confirmar que 01 mantiene el semáforo;
9. confirmar que 02 aparece como `Sostenimiento · solo informativo` y no como pendiente nuevo;
10. confirmar que la MÁSCARA de Keylor continúa en modo de solo lectura.

## Documentación vigente

Leer `INDICE_VIGENTE_CS21A101.md` antes de continuar el desarrollo.
