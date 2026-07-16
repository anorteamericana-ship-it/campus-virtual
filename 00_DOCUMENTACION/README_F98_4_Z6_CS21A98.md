# README técnico · F98.4-Z6-CS21A98

## Objetivo

Permitir que dos operadoras trabajen sobre el mismo seguimiento CONAPE y vean los cambios del semáforo sin recargar el Panel Maestro, reduciendo además el tiempo percibido de apertura.

## Pruebas incluidas

El archivo separado `Test_CS21A98.gs` contiene:

- roundtrip de caché fragmentada;
- verificación de encabezados REVISION_*;
- lectura delta sin escrituras;
- contratos de endpoints y funciones preservadas.

Función principal: `test_cs21a98_all`.

## Despliegue

1. Reemplazar todo `Code.gs` por `Code_F98_4_Z6_CS21A98_COMPLETO.gs`.
2. Guardar.
3. Opcionalmente agregar `Test_CS21A98.gs`, ejecutar `test_cs21a98_all` y retirarlo.
4. Crear una nueva versión del deployment existente sin cambiar su URL.
5. Recargar el Campus con Ctrl+F5.
6. Abrir dos sesiones Superadmin y marcar una revisión en una; la otra debe reflejarla sin recargar en aproximadamente 4 segundos.

## Límites

La sincronización colaborativa se pausa cuando la pestaña está oculta y consulta inmediatamente al volver. La sincronización externa completa de CONAPE permanece cada 30 minutos.
