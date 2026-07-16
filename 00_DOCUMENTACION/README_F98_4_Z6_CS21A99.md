# F98.4-Z6-CS21A99 · Poner al día

## Propósito

Unificar la promoción académica, el pago local y la decisión final de CONAPE en una sola ventana administrativa.

## Flujo

### 1. Académico

- muestra nivel, nota, grupo y siguiente nivel;
- cambia `CA → APR`;
- activa o crea el siguiente nivel en `CA`;
- no espera CONAPE.

### 2. Pago

- busca el número exacto del comprobante;
- muestra crédito total, aplicado previo, saldo disponible y saldo posterior;
- muestra matrícula, cuotas, certificado y rubros finales aplicables;
- presenta precio unitario y cantidad de cuotas;
- permite ajustar cantidades;
- conserva `Completar deuda con saldo`;
- guarda localmente mediante el motor financiero vigente.

### 3. CONAPE

- `Actualizar CONAPE ahora` ejecuta una sola sincronización;
- `Dejar CONAPE pendiente` conserva el estado y el pago local.

## Seguridad

- sesión administrativa obligatoria;
- nota mínima 70;
- idempotencia académica y financiera;
- validación de saldo bancario;
- journal y reversión preservados;
- consolidación de intentos duplicados.

## Limpieza

`campus.html` dejó de cargar A28, A29 y A95. Los archivos históricos continúan en el repositorio hasta completar la regresión. A36 permanece como respaldo de pago por intento.

## MÁSCARA de Keylor

No fue modificada. Las 69 funciones demo comparadas permanecen iguales a A98 y separadas de los expedientes reales.

## Publicación

1. reemplazar el `Code.gs` completo por A99;
2. ejecutar `test_cs21a99_all` desde `Test_CS21A99.gs`;
3. retirar el test;
4. actualizar el deployment existente;
5. recargar con `Ctrl + F5`;
6. probar primero con un caso controlado.
