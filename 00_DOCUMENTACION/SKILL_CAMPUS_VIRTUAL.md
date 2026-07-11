# GUÍA OPERATIVA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

## Identidad

Proyecto: CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA.  
País: Costa Rica.  
Modalidad: inglés conversacional virtual sincrónico.  
Niveles: Básico I, Básico II, Intermedio I, Intermedio II.

## Forma obligatoria de trabajo

- Responder en español directo y explicar para una persona que trabaja por copy/paste.
- Antes de cambiar código, indicar si el impacto es frontend, Apps Script o ambos, y nombrar los archivos.
- Si Apps Script cambia, entregar siempre el `Code.gs` completo. Nunca usar un parche como entrega productiva.
- Si frontend cambia, modificar únicamente los archivos necesarios y respetar rutas reales del repositorio.
- Verificar sintaxis y diferenciar claramente: generado, guardado en GitHub, instalado y desplegado.
- Mantener actualizados `00_DOCUMENTACION` y el manifiesto.

## Módulos de alto riesgo

Requieren análisis antes de escribir:

- Pagos y comprobantes.
- Certificados.
- `DATOS`.
- `ESTATUS`.
- `GRUPOS`.
- `INTENTOS_ACADEMICOS`.
- CONAPE.
- Calendario académico.

## Reglas académicas vigentes

- `DATOS` es identidad maestra.
- `ESTATUS` es trayectoria académica por grupo y nivel.
- Al aprobar `CA → APR`, se puede activar el siguiente nivel `PE → CA` en la misma operación.
- Si el nivel siguiente no existe, puede crearse en `ESTATUS` como `CA` solo si la cohorte tiene ese nivel configurado en `GRUPOS`.
- No copiar notas, evaluaciones ni certificado al crear el siguiente nivel.
- No promocionar después de I2 ni cuando el resultado sea `REP` u otro estado.
- Después de una escritura, Consulta individual debe usar `getEstudianteFresh` antes de cerrar la ventana o habilitar otra edición.
- Una recarga total del navegador no sustituye una lectura fresca del backend.

## Consulta individual y rendimiento

- La lectura inicial debe usar `getConsultaIndividualFresh` para devolver ficha, asistencia, comentario e historial en un solo ciclo.
- Las solicitudes antiguas simultáneas deben compartir una sola promesa mediante `admin_students_fast_loader_cs21a42.js`.
- No acelerar la pantalla devolviendo datos vacíos ni respuestas parciales.
- Si falla la reconstrucción posterior a una escritura, mantener la ventana abierta y mostrar el error.
- Invalidar el caché individual después de estatus, pagos, certificado, TOEIC, cambio de grupo o reversión.

## Reglas financieras vigentes

- B1/B2/I1: deuda completa = matrícula + cuotas + certificado.
- I2: deuda completa = matrícula + cuotas + certificado I2 + Programa Completo + TOEIC.
- `PE` y `SIN REGISTRO` no generan deuda.
- No mover pagos entre niveles o intentos.
- Un comprobante agotado no debe aparecer en el buscador.
- Certificado I2 y Programa Completo pueden pagarse juntos en una misma factura.
- TOEIC usa valor individual de `DATOS`; en ausencia, configuración del grupo/nivel.

## Certificados

- El pago financiero y la emisión documental son estados independientes.
- Mostrar `Pago: PAGADO/PENDIENTE` y `Documento: EMITIDO/POR EMITIR` en líneas separadas.
- Pago completo sin registro oficial significa `Pago confirmado. Documento oficial pendiente de emisión.`
- No interpretar `POR EMITIR` como deuda.
- Los pagos de certificado usan `grupos_certificado_aplicados` para asignación por intento.
- Los demás rubros usan `grupos_pago_aplicados`.
- Coincidencia exacta de grupo primero; único intento como fallback seguro; múltiples intentos ambiguos requieren revisión.
- Nunca mover pagos entre niveles o intentos.

## CONAPE

- Operación manual y protegida.
- Un cambio pendiente de aprobación no modifica el grupo académico real.
- Seguimiento inmediato muestra todos los periodos y desembolsos adelantados.
- `Detalle` usa `DATOS.COMENTARIO_ADMIN`.
- No crear ni administrar triggers automáticos.
- Estado `PROTEGIDO` significa que la API externa no pudo verificarse; no significa que las hojas estén correctas o incorrectas.
- La tabla debe caber completa en escritorio sin scroll horizontal.
- No mostrar columna independiente `Desembolso`.
- Columnas: Estudiante, Movimiento, Periodo/nivel, Campus, Detectado y WA.
- El código del estudiante aparece primero y puede seleccionarse para copiar.
- `Seguimiento`, `Revisado` y `WA Pago` permanecen compactos.
- El mensaje WA prepara solo texto; la imagen se adjunta manualmente.
- Si el movimiento está aplicado, mostrar `No enviar`.

## Calendario

- No ejecutar escrituras o limpiezas pesadas dentro de `getGruposActivos`, `getAdminDashboard` o `getRadiografiaGrupo`.
- Mantener respuestas rápidas y consistentes.

## English LAB y Academia Play

Son práctica pedagógica. No afectan notas oficiales, aprobación, certificados, pagos ni cierre académico.

## Checklist de cada entrega

1. Confirmar la base exacta de trabajo.
2. Identificar archivos y hojas afectadas.
3. Analizar impacto y riesgo de duplicación.
4. Implementar la mínima modificación necesaria.
5. Validar sintaxis y casos críticos.
6. Actualizar documentación y manifiesto.
7. Entregar solo archivos modificados, excepto cuando el usuario pida compilado completo.
8. Si hubo backend, entregar `Code.gs` completo con nombre, versión y SHA-256.
9. En CS21A42, probar 17110, cambio de estatus sin Ctrl+R y estados separados del certificado.
