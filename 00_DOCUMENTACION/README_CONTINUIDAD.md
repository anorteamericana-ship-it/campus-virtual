# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — ESTADO VIGENTE

**Versión integral:** F98.4-Z6-CS21A40  
**Backend canónico:** F98.4-Z6-CS21A34  
**Frontend activo:** F98.4-Z6-CS21A40  
**Corte documental:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · rama `main`

## 1. Cambio CS21A40

CS21A40 modifica únicamente el texto generado por el botón **WA Pago** de Seguimiento inmediato.

### Archivos

- `src/admin_master_conape_movements_cs21a25.jsx`
- `campus.html`

Apps Script no cambia.

## 2. Corrección del emoticono

El carácter roto `�` se evita generando el emoticono mediante:

`String.fromCodePoint(0x1F389)`

El resultado esperado es `🎉`.

No se conserva un emoji literal dentro del texto fuente del mensaje.

## 3. Negritas reales de WhatsApp

WhatsApp usa un solo asterisco para negrita:

`*texto*`

No usar `**texto**`, porque puede mostrar los asteriscos en vez de aplicar formato.

Mensaje base vigente:

> *¡Buenas noticias, [Nombre]! 🎉*
>
> CONAPE nos ha informado que el *desembolso ya fue acreditado en su cuenta.*
>
> Le solicitamos realizar el pago a la Academia *a la mayor brevedad posible*, para mantener su expediente *al día* y evitar atrasos en el desembolso del rubro de sostenimiento.

Cuando existe monto confirmado:

> *Monto correspondiente a [nivel] ([bimestre/cuatrimestre]): ₡[monto].*

Para I2:

> *Monto correspondiente al último nivel, Intermedio II ([bimestre/cuatrimestre]): ₡[monto].*

## 4. Reglas preservadas

- Usa el nombre de pila.
- Consulta `getEstudiante` al pulsar WA.
- Si no existe monto confirmable, no inventa una cifra.
- La imagen se adjunta manualmente.
- No envía automáticamente.
- No escribe en hojas.
- Un movimiento aplicado muestra `No enviar`.

## 5. Vista compacta e identidad preservadas

- Nombre grande y código/cédula destacados.
- Sin scroll horizontal.
- Columna `Desembolso` eliminada.
- Columnas vigentes: Estudiante, Movimiento, Periodo/nivel, Campus, Detectado y WA.
- `WA Pago` permanece visible.

## 6. Funciones preservadas

- CS21A39: identidad legible.
- CS21A38: tabla compacta.
- CS21A36: aplicar pago dentro de Consulta individual.
- CS21A35: detalle persistente.
- CS21A34: lectura directa de `7-morosidad`.
- Nunca se trasladan pagos entre niveles o intentos.

## 7. Backend preservado CS21A34

No se modificó Apps Script. El backend completo vigente continúa siendo:

- TXT: `Code_F98_4_Z6_CS21A34_SEGUIMIENTO_CONAPE_FUENTE_OFICIAL_COMPLETO.txt`
- ZIP: `Code_F98_4_Z6_CS21A34_SEGUIMIENTO_CONAPE_FUENTE_OFICIAL_COMPLETO.zip`
- SHA-256 TXT: `c4b4b3c18091e9413c0722d2c5ae0748b5c756927f9bf2f934c8d6dbe6c0dd35`

## 8. QA obligatorio

1. Abrir `WA Pago` para un estudiante con nombre visible.
2. Confirmar que aparece `🎉` y no `�`.
3. Confirmar que WhatsApp aplica negrita y no muestra asteriscos dobles.
4. Probar un nivel normal con monto.
5. Probar I2 como último nivel.
6. Probar un estudiante sin monto confirmable.
7. Confirmar que un aplicado continúe mostrando `No enviar`.

## 9. Estado de despliegue

El código y la documentación están guardados en GitHub `main`. No existe evidencia suficiente para afirmar que CS21A40 esté publicado en producción.
