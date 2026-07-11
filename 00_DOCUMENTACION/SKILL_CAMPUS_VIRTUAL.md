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
- Después de una escritura, la Consulta individual debe releer el expediente antes de habilitar otra edición.

## Reglas financieras vigentes

- B1/B2/I1: deuda completa = matrícula + cuotas + certificado.
- I2: deuda completa = matrícula + cuotas + certificado I2 + Programa Completo + TOEIC.
- El certificado es obligación financiera desde el nivel activo; la emisión documental sigue siendo independiente.
- `PE` y `SIN REGISTRO` no generan deuda.
- No mover pagos entre niveles o intentos.
- Un comprobante agotado no debe aparecer en el buscador.
- Certificado I2 y Programa Completo pueden pagarse juntos en una misma factura.
- TOEIC usa valor individual de `DATOS`; en ausencia, configuración del grupo/nivel.

## CONAPE

- Operación manual y protegida.
- Un cambio pendiente de aprobación no modifica el grupo académico real.
- Seguimiento inmediato muestra todos los periodos y desembolsos adelantados.
- `Detalle` usa `DATOS.COMENTARIO_ADMIN`.
- No crear ni administrar triggers automáticos.
- Estado `PROTEGIDO` significa que la API externa no pudo verificarse; no significa que las hojas estén correctas o incorrectas.
- El botón `WA Solicitar pago` prepara únicamente texto; la imagen se adjunta manualmente.
- El mensaje usa nombre de pila, nivel, bimestre/cuatrimestre y monto pendiente confirmado por `getEstudiante`.
- Si el monto no se confirma, no inventar una cifra.
- Si el movimiento está `Aplicado en sistema`, no ofrecer solicitud de pago; mostrar `Aplicado · no enviar cobro`.
- El botón WA no envía automáticamente ni escribe en hojas.

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
8. Si hubo backend, entregar Code.gs completo con nombre, versión y SHA-256.