# QA de publicación · F98.4-Z6-CS21A99

## Antes de desplegar

1. Copiar el backend integral A99.
2. Agregar temporalmente `Test_CS21A99.gs`.
3. Ejecutar `test_cs21a99_all`.
4. Confirmar todos los bloques en `ok:true`.
5. Retirar el archivo de prueba.

## Caso controlado B1 → B2

1. Abrir un estudiante B1 en `CA` con nota igual o superior a 70.
2. Abrir Cambiar estatus.
3. Seleccionar `APR`.
4. Confirmar el resumen B1 `CA → APR` y B2 `→ CA`.
5. Ejecutar el paso académico.
6. Confirmar B1 `APR` y B2 `CA`.
7. Confirmar un solo intento B2 activo.

## Pago

1. Pegar un comprobante exacto.
2. Confirmar crédito total, aplicado previo y saldo disponible.
3. Confirmar precio unitario y número de cuotas.
4. Usar `Completar deuda con saldo`.
5. Revisar total a aplicar y saldo posterior.
6. Confirmar el pago local.
7. Verificar recibos en `PAGOS`, `OTROS PAGOS`, `PAGOS_CAMPUS` y `PAGOS_OPERACIONES`.
8. Confirmar el monto aplicado en `BDBANCARIO`.

## CONAPE

### Caso pendiente

Elegir `Dejar CONAPE pendiente` y confirmar que el estado académico y el pago local permanecen guardados.

### Caso actualizado

En otro estudiante elegir `Actualizar CONAPE ahora` y confirmar una sola sincronización de las hojas 4–7.

## Regresión

- pago inline A36;
- reversión integral;
- certificados;
- cambio de grupo;
- Panel Maestro y semáforo;
- filtro de grupos;
- calendario;
- estudiante real;
- docente real;
- perfil demo de Keylor en modo de solo lectura.

## Criterio de aprobación

No procesar un grupo completo hasta que el caso controlado termine sin duplicar intentos, sin doble sincronización y con las cuatro fuentes financieras coherentes.
