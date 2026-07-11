# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — ESTADO VIGENTE

**Versión integral:** F98.4-Z6-CS21A41  
**Backend canónico:** F98.4-Z6-CS21A34  
**Frontend activo:** F98.4-Z6-CS21A41  
**Corte documental:** 10-jul-2026  
**Repositorio:** `anorteamericana-ship-it/campus-virtual` · rama `main`

## 1. Cambio CS21A41

CS21A41 modifica únicamente la presentación de la identidad del estudiante dentro de **Seguimiento inmediato**.

### Archivos

- `src/admin_master_conape_consulta_cs21a28.js`
- `styles/admin_master_conape_identity_cs21a39.css`
- `campus.html`

El componente funcional `src/admin_master_conape_movements_cs21a25.jsx` continúa en CS21A40 y conserva el mensaje WhatsApp vigente. Apps Script no cambia.

## 2. Código primero y más grande

Cada fila de Seguimiento inmediato presenta ahora este orden:

1. Código del estudiante.
2. Nombre completo.
3. Cédula y botón de seguimiento.

El código:

- aparece en un campo azul de solo lectura;
- usa tamaño de referencia de 19 px en escritorio;
- queda seleccionado completo al hacer clic;
- puede copiarse inmediatamente con `Ctrl + C`;
- conserva únicamente el valor del código, sin incluir la cédula.

En pantallas más estrechas reduce moderadamente su tamaño para mantener toda la fila visible.

## 3. Vista compacta preservada

La tabla continúa con seis columnas:

- Estudiante.
- Movimiento.
- Periodo / nivel.
- Campus.
- Detectado.
- WA.

La columna `Desembolso` continúa eliminada. No debe aparecer scroll horizontal y `WA Pago` debe permanecer visible.

## 4. Mensaje WA preservado

- Emoticono seguro `🎉` generado mediante Unicode.
- Negritas con un solo asterisco de WhatsApp.
- Nombre de pila.
- Monto pendiente confirmado por `getEstudiante`.
- Bimestre/cuatrimestre.
- I2 como último nivel.
- Sin monto confirmable, no inventa una cifra.
- Aplicados muestran `No enviar`.

## 5. Funciones preservadas

- CS21A40: mensaje WA elegante y seguro.
- CS21A39: identidad legible.
- CS21A38: tabla compacta.
- CS21A36: aplicar pago dentro de Consulta individual.
- CS21A35: detalle persistente.
- CS21A34: lectura directa de `7-morosidad`.
- Nunca se trasladan pagos entre niveles o intentos.

## 6. Backend preservado CS21A34

No se modificó Apps Script. El backend completo vigente continúa siendo:

- TXT: `Code_F98_4_Z6_CS21A34_SEGUIMIENTO_CONAPE_FUENTE_OFICIAL_COMPLETO.txt`
- ZIP: `Code_F98_4_Z6_CS21A34_SEGUIMIENTO_CONAPE_FUENTE_OFICIAL_COMPLETO.zip`
- SHA-256 TXT: `c4b4b3c18091e9413c0722d2c5ae0748b5c756927f9bf2f934c8d6dbe6c0dd35`

## 7. QA obligatorio

1. Abrir Seguimiento inmediato.
2. Confirmar que el código aparece antes que el nombre.
3. Hacer clic en el código y comprobar que queda seleccionado completo.
4. Copiar con `Ctrl + C` y pegar en Consulta individual para verificar el valor.
5. Confirmar que la cédula no forma parte del texto copiado.
6. Confirmar ausencia de scroll horizontal.
7. Confirmar que `WA Pago`, `Seguimiento`, `Revisado` y `Consulta` continúan funcionando.

## 8. Estado de despliegue

El código y la documentación están guardados en GitHub `main`. No existe evidencia suficiente para afirmar que CS21A41 esté publicado en producción.
