# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — ESTADO VIGENTE

**Versión integral:** F98.4-Z6-CS21A38  
**Backend canónico:** F98.4-Z6-CS21A34  
**Frontend activo:** F98.4-Z6-CS21A38  
**Corte documental:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · rama `main`

## 1. Cambio CS21A38

CS21A38 modifica únicamente el frontend de **Seguimiento inmediato** para eliminar el scroll horizontal y compactar cada estudiante.

### Archivos

- `src/admin_master_conape_movements_cs21a25.jsx`
- `campus.html`

### Tabla compacta

La tabla pasa de siete a seis columnas:

- Estudiante.
- Movimiento.
- Periodo / nivel.
- Campus.
- Detectado.
- WA.

La columna `Desembolso` fue eliminada completamente.

La tabla ahora:

- usa el ancho total disponible del panel;
- no fuerza `min-width`;
- oculta el desbordamiento horizontal;
- distribuye las seis columnas con `table-layout: fixed`;
- acorta nombres, grupos y fechas solo visualmente, conservando el valor completo en tooltip;
- reduce el alto de cada fila.

## 2. Botones compactos

El botón grande de detalle fue sustituido por:

- `✎ Seguimiento` cuando no hay nota;
- `✓ Revisado` cuando existe `DATOS.COMENTARIO_ADMIN`.

El contenido completo continúa abriéndose en el mismo modal y sigue persistiendo entre sesiones.

El botón de WhatsApp pasa de `WA Solicitar pago` a `WA Pago`, ocupa el ancho de su propia columna y no debe quedar oculto al extremo derecho.

En movimientos ya aplicados se muestra `No enviar`.

## 3. Texto WA preservado

El botón continúa preparando solo texto; la imagen se adjunta manualmente.

Texto base:

> ¡Buenas noticias [Nombre]! 🥳
>
> CONAPE nos ha informado que el desembolso ya fue acreditado en su cuenta.
>
> Le solicitamos realizar el pago a la Academia a la mayor brevedad posible, para mantener su expediente al día y evitar atrasos en el desembolso del rubro de sostenimiento.

Al pulsar WA se consulta `getEstudiante`, se identifica bimestre/cuatrimestre y se agrega el monto pendiente real del nivel. I2 se identifica como último nivel. Si no puede confirmarse una cifra, no se inventa.

## 4. Funciones preservadas

- CS21A36: aplicar pago dentro de Consulta individual.
- CS21A35: detalle persistente de seguimiento.
- CS21A34: lectura directa del archivo externo oficial `7-morosidad`.
- Estado `NO` = aplicado; `SI` = pendiente; sin fila exacta = revisión.
- Nunca se trasladan pagos entre niveles o intentos.

## 5. Backend preservado CS21A34

No se modificó Apps Script. El backend completo vigente continúa siendo:

- TXT: `Code_F98_4_Z6_CS21A34_SEGUIMIENTO_CONAPE_FUENTE_OFICIAL_COMPLETO.txt`
- ZIP: `Code_F98_4_Z6_CS21A34_SEGUIMIENTO_CONAPE_FUENTE_OFICIAL_COMPLETO.zip`
- SHA-256 TXT: `c4b4b3c18091e9413c0722d2c5ae0748b5c756927f9bf2f934c8d6dbe6c0dd35`

## 6. QA obligatorio

1. Abrir Seguimiento inmediato en el ancho normal del Panel Maestro.
2. Confirmar que no aparece barra horizontal.
3. Confirmar que `Desembolso` ya no existe.
4. Verificar nombre, cédula/código, movimiento, periodo/nivel, Campus, detectado y WA en la misma vista.
5. Verificar que `✎ Seguimiento` y `✓ Revisado` no ensanchan la fila.
6. Confirmar que `WA Pago` siempre es visible.
7. Abrir una nota larga y confirmar que el contenido completo sigue en el modal.
8. Probar un movimiento aplicado y confirmar `No enviar`.

## 7. Estado de despliegue

El código y la documentación están guardados en GitHub `main`. No existe evidencia suficiente para afirmar que CS21A38 esté publicado en producción.
