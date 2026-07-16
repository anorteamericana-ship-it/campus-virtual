# Estado consolidado · F98.4-Z6-CS21A99

**Corte:** 16-jul-2026  
**Frontend:** guardado en `main`  
**Backend integral:** generado y validado estáticamente  
**Apps Script publicado:** no confirmado  
**Producción probada:** no confirmada

## Cambio vigente

CS21A99 sustituye el flujo fragmentado de actualización académica y pago por un asistente único dentro de Consulta individual.

### Flujo operativo

1. **Académico:** aprueba el nivel y activa el siguiente en la base local.
2. **Pago:** busca un comprobante exacto y aplica los rubros seleccionados localmente.
3. **CONAPE:** pregunta si se sincronizan las hojas 4–7 una sola vez.

## Visual financiero

La pantalla muestra matrícula, cuotas, certificado y rubros finales de I2 cuando corresponden. También muestra precio unitario, cantidad total y pendiente de cuotas, monto pendiente, total original del comprobante, aplicado previo, saldo disponible, total que se aplicará y saldo restante. Se conserva el botón `Completar deuda con saldo`.

## Backend A99

Endpoints nuevos:

- `prepararPuestaAlDia`;
- `aplicarPuestaAlDiaAcademica`;
- `aplicarPagoPuestaAlDia`;
- `sincronizarConapePuestaAlDia`;
- `diagnosticarIntentosDuplicadosCS21A99`.

Cambios internos:

- promoción local sin CONAPE;
- pago local con `sincronizar_conape:false`;
- una sola sincronización final opcional;
- coincidencia de intentos por código, nivel, grupo y número;
- consolidación de duplicados activos;
- actualización del journal financiero después de la decisión CONAPE.

## Compatibilidad preservada

- pago inline A36;
- reversión financiera integral;
- certificados;
- Panel Maestro CONAPE A98;
- semáforo colaborativo;
- filtro por grupos;
- calendario A88;
- MÁSCARA de Keylor.

## Protección Keylor

Se compararon las funciones `_demoKeylor*` de A98 y A99. Las 69 funciones identificadas permanecen sin cambios. Los perfiles demo continúan separados de los expedientes reales y bloqueados para operaciones administrativas reales.

## Publicación obligatoria

1. sustituir el `Code.gs` completo por A99;
2. guardar;
3. ejecutar `test_cs21a99_all` desde el archivo de prueba separado;
4. retirar el test;
5. crear una nueva versión del deployment existente;
6. conservar la misma URL pública;
7. recargar el Campus con `Ctrl + F5`;
8. probar con un caso controlado antes de procesar un grupo completo.
