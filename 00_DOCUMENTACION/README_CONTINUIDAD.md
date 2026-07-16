# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral:** F98.4-Z6-CS21A99  
**Frontend vigente en GitHub:** F98.4-Z6-CS21A99  
**Backend integral entregado:** F98.4-Z6-CS21A99  
**Backend Apps Script publicado:** no verificado  
**Producción:** no verificada  
**Corte:** 16-jul-2026

## Cambio vigente CS21A99

Consulta individual incorpora el asistente administrativo `Poner al día`.

### Flujo

1. aprobación local del nivel actual;
2. activación local del siguiente nivel;
3. aplicación local del comprobante con detalle de cuotas y saldos;
4. decisión final de actualizar CONAPE una sola vez o dejarlo pendiente.

El paso financiero muestra:

- precio unitario;
- cantidad de cuotas contractuales y pendientes;
- total del comprobante;
- aplicado previo;
- saldo disponible;
- monto seleccionado;
- saldo restante;
- botón `Completar deuda con saldo`.

## Limpieza vigente

Ya no se cargan desde `campus.html`:

- A28 · promoción anterior;
- A29 · creación anterior del siguiente nivel;
- A95 · reconstrucción fresca y sincronización obligatoria.

Los archivos permanecen como historial técnico. El pago inline A36 sigue cargado como respaldo.

## Backend

Usar únicamente:

`Code_F98_4_Z6_CS21A99_COMPLETO.gs`

Endpoints nuevos:

- `prepararPuestaAlDia`;
- `aplicarPuestaAlDiaAcademica`;
- `aplicarPagoPuestaAlDia`;
- `sincronizarConapePuestaAlDia`;
- `diagnosticarIntentosDuplicadosCS21A99`.

## Reglas preservadas

- No mover pagos entre niveles o intentos.
- Conservar idempotencia, journal y reversión.
- Mantener un solo intento activo por nivel, grupo y número.
- No sincronizar CONAPE durante la promoción local.
- No sincronizar CONAPE dos veces durante el pago.
- No declarar producción verificada sin despliegue y prueba.

## MÁSCARA de Keylor · PROTEGIDA

La vista demo y sus perfiles de solo lectura permanecen sin cambios. La comparación A98→A99 confirmó 69 funciones `_demoKeylor*` preservadas. No se modifican expedientes, pagos, certificados ni CONAPE desde cuentas demo.

## Prueba obligatoria

1. copiar el backend integral A99 al proyecto Apps Script;
2. agregar temporalmente `Test_CS21A99.gs`;
3. ejecutar `test_cs21a99_all`;
4. retirar el archivo de prueba;
5. actualizar el deployment existente;
6. recargar el Campus con `Ctrl + F5`;
7. probar un estudiante controlado;
8. confirmar pago local, un solo intento activo y decisión final CONAPE;
9. probar reversión;
10. confirmar que la MÁSCARA de Keylor continúa en modo de solo lectura.

## Documentación vigente

Leer `INDICE_VIGENTE_CS21A99.md` antes de continuar el desarrollo.
