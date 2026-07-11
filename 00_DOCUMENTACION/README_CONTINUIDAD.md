# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — ESTADO VIGENTE

**Versión integral:** F98.4-Z6-CS21A39  
**Backend canónico:** F98.4-Z6-CS21A34  
**Frontend activo:** F98.4-Z6-CS21A39  
**Corte documental:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · rama `main`

## 1. Cambio CS21A39

CS21A39 modifica únicamente la presentación de la identidad del estudiante dentro de **Seguimiento inmediato**.

### Archivos

- `styles/admin_master_conape_identity_cs21a39.css`
- `campus.html`

El componente funcional `src/admin_master_conape_movements_cs21a25.jsx` permanece en CS21A38 y no cambia su lógica.

### Identidad más visible

- Nombre del estudiante: 13.5 px, peso fuerte y color azul institucional.
- Cédula y código: 10.2 px, peso fuerte, fondo azul claro y borde visible.
- Primera columna: 31% del ancho total.
- En pantallas hasta 1180 px el tamaño se reduce moderadamente para conservar toda la fila.
- El nombre completo permanece disponible en el tooltip cuando el ancho obliga a usar elipsis.

## 2. Vista compacta preservada

La tabla continúa con seis columnas:

- Estudiante.
- Movimiento.
- Periodo / nivel.
- Campus.
- Detectado.
- WA.

La columna `Desembolso` continúa eliminada.

La tabla mantiene:

- ancho total del panel;
- `table-layout: fixed`;
- ausencia de `min-width` forzado;
- ausencia de scroll horizontal;
- filas compactas;
- columna WA siempre visible.

## 3. Botones compactos

- `✎ Seguimiento` cuando no hay nota.
- `✓ Revisado` cuando existe `DATOS.COMENTARIO_ADMIN`.
- `WA Pago` para preparar el mensaje.
- `No enviar` en movimientos ya aplicados.

## 4. Texto WA preservado

El botón continúa preparando solo texto; la imagen se adjunta manualmente.

Al pulsar WA se consulta `getEstudiante`, se identifica bimestre/cuatrimestre y se agrega el monto pendiente real del nivel. I2 se identifica como último nivel. Si no puede confirmarse una cifra, no se inventa.

## 5. Funciones preservadas

- CS21A38: tabla compacta sin scroll horizontal.
- CS21A37: texto WA dinámico.
- CS21A36: aplicar pago dentro de Consulta individual.
- CS21A35: detalle persistente de seguimiento.
- CS21A34: lectura directa del archivo externo oficial `7-morosidad`.
- Estado `NO` = aplicado; `SI` = pendiente; sin fila exacta = revisión.
- Nunca se trasladan pagos entre niveles o intentos.

## 6. Backend preservado CS21A34

No se modificó Apps Script. El backend completo vigente continúa siendo:

- TXT: `Code_F98_4_Z6_CS21A34_SEGUIMIENTO_CONAPE_FUENTE_OFICIAL_COMPLETO.txt`
- ZIP: `Code_F98_4_Z6_CS21A34_SEGUIMIENTO_CONAPE_FUENTE_OFICIAL_COMPLETO.zip`
- SHA-256 TXT: `c4b4b3c18091e9413c0722d2c5ae0748b5c756927f9bf2f934c8d6dbe6c0dd35`

## 7. QA obligatorio

1. Abrir Seguimiento inmediato en el ancho normal del Panel Maestro.
2. Confirmar que el nombre sea legible sin acercar la pantalla.
3. Confirmar que cédula y código se vean completos en la línea azul clara.
4. Verificar que no aparezca scroll horizontal.
5. Confirmar que `WA Pago` continúe visible.
6. Revisar una pantalla cercana a 1180 px y confirmar que la fila siga completa.
7. Confirmar que detalle, estado CONAPE y WhatsApp no hayan cambiado de comportamiento.

## 8. Estado de despliegue

El código y la documentación están guardados en GitHub `main`. No existe evidencia suficiente para afirmar que CS21A39 esté publicado en producción.
