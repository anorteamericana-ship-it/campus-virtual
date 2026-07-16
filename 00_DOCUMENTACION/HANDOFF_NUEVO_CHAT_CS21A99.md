# Handoff para nuevo chat · F98.4-Z6-CS21A99

## Base de trabajo

La versión vigente es **F98.4-Z6-CS21A99**. No continuar desde A98 ni volver a cargar los parches A28, A29 o A95 en `campus.html`.

## Objetivo entregado

Consulta individual incorpora un asistente `Poner al día`:

1. `CA → APR` y siguiente nivel a `CA`, sin CONAPE;
2. pago local con desglose de precios, cuotas y comprobante;
3. decisión explícita de sincronizar CONAPE una sola vez.

## Frontend vigente

- `admin_students_quick_update_core_cs21a99.js`
- `admin_students_quick_update_components_cs21a99.js`
- `admin_students_quick_update_state_cs21a99.js`
- `admin_students_quick_update_academic_cs21a99.js`
- `admin_students_quick_update_payment_cs21a99.js`
- `admin_students_quick_update_conape_cs21a99.js`
- `admin_students_quick_update_modal_cs21a99.js`
- `admin_students_quick_update_install_cs21a99.js`

El módulo A36 continúa cargado como respaldo de pago por intento.

## Backend vigente

Usar únicamente el archivo integral:

`Code_F98_4_Z6_CS21A99_COMPLETO.gs`

No pegar solo las funciones nuevas sobre un backend anterior.

## Prueba

Agregar temporalmente `Test_CS21A99.gs` y ejecutar:

`test_cs21a99_all`

Después retirar el archivo de prueba.

## Reglas no negociables

- No modificar la MÁSCARA de Keylor.
- No mover pagos entre niveles o intentos.
- No eliminar reversión, journal o idempotencia.
- No volver a sincronizar CONAPE dentro de la promoción ni dos veces dentro del pago.
- Mantener un solo intento activo por código, nivel, grupo y número.
- No declarar producción verificada sin desplegar y probar.

## Estado de publicación

Frontend y documentación: guardados en GitHub.  
Backend: generado y validado estáticamente.  
Deployment Apps Script: pendiente de confirmación.  
Prueba visual de producción: pendiente.
