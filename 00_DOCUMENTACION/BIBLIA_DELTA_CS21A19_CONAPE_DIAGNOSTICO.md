# BIBLIA DELTA — F98.4-Z6-CS21A19

Proyecto: CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA  
Área: CONAPE, Diagnóstico interno, documentos docentes, consulta individual, calendario académico  
Tipo: delta de continuidad sobre la Biblia vigente del proyecto

## 1. Principio de continuidad

Esta Biblia Delta no reemplaza la Biblia maestra histórica. La complementa con las decisiones y reglas aprobadas durante la línea CS21A.

Desde este corte, cualquier asistente o desarrollador debe considerar que el proyecto está en una fase de producción sensible: pagos, certificados, CONAPE, grupos, calendario y diagnóstico interno deben tratarse como módulos críticos.

## 2. Regla Apps Script

Si se toca Apps Script, el usuario debe recibir siempre `Code.gs` completo. No entregar parches parciales para producción.

Motivo: el usuario trabaja por copy/paste completo y no programa directamente. Un parche parcial puede terminar pegado en lugar incorrecto o dejar funciones duplicadas.

## 3. CONAPE: comportamiento correcto

### 3.1 Cambio de grupo pendiente

Cuando un estudiante tiene cambio de grupo que requiere aprobación CONAPE:

- El estudiante sigue perteneciendo a su grupo original/real.
- No aparece en el grupo destino.
- No se recalculan futuros al grupo destino.
- No se duplican niveles.
- No se publica el traslado hasta aprobación CONAPE.
- Si n8n necesita salida consistente, se genera una vista CONAPE fusionada/congelada, no una vista académica cambiada.

### 3.2 Hojas CONAPE

Las hojas CONAPE deben mantenerse consistentes para n8n:

- 4-estudiantes debe tener la identidad correcta.
- 5-plan_estudios debe conservar cuatro materias consistentes.
- 6-historial debe reflejar historial válido.
- 7-morosidad debe tener filas necesarias para periodos con obligación o historial que n8n requiere.

### 3.3 CA proyectado

`CA_EN_NIVEL_PROYECTADO` no es crítico por sí solo.

En operación CONAPE, es normal que el estudiante tenga:

- Nivel anterior APR.
- Nivel siguiente CA.
- Morosidad NO.

Esto representa inscripción pagada o desembolso aplicado y permite que CONAPE procese el siguiente desembolso.

## 4. Diagnóstico interno

Diagnóstico interno se mantiene como módulo prioritario. No eliminarlo ni simplificarlo de forma destructiva.

Debe conservar como mínimo:

- Auditoría CONAPE de 7 hojas.
- Auditoría de DATOS como identidad maestra.
- Auditoría de ESTATUS como trayectoria académica.
- Preflight de n8n.
- Verificación por cédula.
- Verificación masiva local.
- Clasificación de severidades.
- Evidencia de diferencias y muestras.

### 4.1 Estado PROTEGIDO

Cuando la API externa devuelve 401 o 403, se muestra `PROTEGIDO`.

Esto significa:

- Las hojas sí pueden ser auditadas localmente.
- La base externa/API final no pudo verificarse.
- No debe afirmarse que n8n cargó correctamente.
- El diagnóstico debe devolver diferencias locales de todos modos.

### 4.2 Verificación masiva esperada

La verificación masiva debe devolver listas accionables, como:

- Cédulas en APOLLO/DATOS que faltan en 4-estudiantes.
- Cédulas en CONAPE que no existen en APOLLO/DATOS.
- Plan incompleto en 5-plan_estudios.
- Historial faltante en 6-historial.
- Morosidad faltante en 7-morosidad.
- Duplicados o llaves conflictivas.

## 5. Consulta individual

La ficha administrativa por estudiante debe separar:

- Pago/comprobante.
- Documento emitido.
- Estado académico.
- Estado financiero.

En Certificado:

- El bloque financiero debe decir `PAGO APLICADO` si existe comprobante aplicado.
- La emisión oficial se muestra en la columna Certificado.
- No mezclar `NO EMITIDO` con pago aplicado dentro del bloque de comprobantes.

## 6. Calendario académico

`getGruposActivos`, `getAdminDashboard` y `getRadiografiaGrupo` no deben ejecutar limpiezas pesadas ni escrituras automáticas.

La limpieza física de cambios pendientes CONAPE debe ser manual para evitar timeout.

## 7. Documentos docentes

El menú docente debe conservar:

- Información general del programa con visor interno.
- Syllabus.
- Plan de Estudio.
- Planeamiento por lección agrupado por nivel.
- Cronograma general.
- Biblioteca digital con visor interno.
- Libros de texto por nivel y tipo SB/TB/WB.

## 8. Academia Play / English LAB

Academia Play, English LAB y prácticas gamificadas son práctica pedagógica.

No generan notas oficiales, certificados, aprobación, ranking oficial ni premios oficiales hasta que el sistema sea definido formalmente.

## 9. Entrega siguiente recomendada

La siguiente entrega debería consolidar CS21A en una versión limpia:

- Quitar overrides temporales cuando ya estén validados.
- Integrar cambios directamente en archivos base.
- Mantener `00_DOCUMENTACION` actualizado.
- Mantener Code.gs completo y frontend con rutas claras.

Nombre sugerido: F98.4-Z6-CS21A20 — Consolidación CONAPE Diagnóstico + Documentos Docente.