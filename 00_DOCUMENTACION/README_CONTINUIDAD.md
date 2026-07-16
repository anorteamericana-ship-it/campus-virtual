# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral:** F98.4-Z6-CS21A100  
**Frontend vigente en GitHub:** F98.4-Z6-CS21A100  
**Backend integral entregado:** F98.4-Z6-CS21A100  
**Backend Apps Script publicado:** no verificado  
**Producción:** no verificada  
**Corte:** 16-jul-2026

## Cambio vigente CS21A100

Consulta individual conserva el asistente administrativo `Poner al día` de CS21A99 y corrige su cierre final.

### Flujo final

1. aprobación local del nivel actual;
2. activación local del siguiente nivel;
3. aplicación local del comprobante;
4. decisión final CONAPE;
5. sincronización externa como máximo una vez;
6. recarga automática del mismo estudiante hasta confirmar APR/CA;
7. cierre del modal y refresco de la ficha visible.

## Guardia contra repetición

El backend consulta `PAGOS_OPERACIONES` antes de sincronizar. Cuando la operación ya tiene `CONAPE_SYNC=OK`, devuelve una respuesta idempotente y no vuelve a ejecutar `sincronizarCONAPE_estudiante`.

Los clics concurrentes se serializan con `LockService` y el frontend utiliza un `request_id` estable para el cierre.

## Caso real auditado

Estudiante 17048 · COREA ROJAS JHOSELYNE SUSANA:

- un solo intento I2 activo;
- una sola operación de pago por ₡425.930;
- cinco recibos;
- una sola estructura vigente en los archivos CONAPE externos;
- no se requirió reparación de datos.

El problema observado correspondía al remonte del modal, no a pagos o intentos duplicados.

## Backend

Usar únicamente:

`Code_F98_4_Z6_CS21A100_COMPLETO.gs`

Test de solo lectura:

`Test_CS21A100.gs` → `test_cs21a100_all`

## Reglas preservadas

- No mover pagos entre niveles o intentos.
- Conservar idempotencia, journal y reversión.
- Mantener un solo intento activo por nivel, grupo y número.
- No sincronizar CONAPE durante la promoción local.
- No sincronizar CONAPE durante el pago local.
- No repetir CONAPE al refrescar la ficha.
- No declarar producción verificada sin despliegue y prueba.

## MÁSCARA de Keylor · PROTEGIDA

La vista demo y sus perfiles de solo lectura permanecen sin cambios. La comparación A99→A100 confirmó 69 funciones `_demoKeylor*` preservadas.

## Prueba obligatoria

1. copiar el backend integral A100 al proyecto Apps Script;
2. agregar temporalmente `Test_CS21A100.gs`;
3. ejecutar `test_cs21a100_all`;
4. retirar el archivo de prueba;
5. actualizar el deployment existente;
6. recargar el Campus con `Ctrl + F5`;
7. probar un estudiante controlado;
8. confirmar que después de CONAPE regresa automáticamente a la ficha actualizada;
9. comprobar que un segundo intento de cierre responde idempotente;
10. confirmar que la MÁSCARA de Keylor continúa en modo de solo lectura.

## Documentación vigente

Leer `INDICE_VIGENTE_CS21A100.md` antes de continuar el desarrollo.
