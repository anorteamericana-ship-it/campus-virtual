# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD CS21A19

Corte de continuidad: F98.4-Z6-CS21A19  
Fecha de cierre documental: 2026-07-10  
Repositorio: anorteamericana-ship-it/campus-virtual

Este documento actualiza la continuidad operativa después de los ajustes de menú docente, documentos académicos, consulta individual financiera, CONAPE, calendario académico y diagnóstico interno.

## Estado vigente de trabajo

- Frontend vigente: F98.4-Z6 con extensiones CS21A.
- Backend vigente entregado al usuario: `Code_F98_4_Z6_CS21A19_CONAPE_DIAGNOSTICO_MASIVO_COMPLETO.gs`.
- Regla de entrega: si Apps Script cambia, entregar siempre `Code.gs` completo, no parches.
- `00_DOCUMENTACION` se conserva como fuente verdadera documental del proyecto.

## Entregas recientes integradas

### Menú docente y documentos

Se reorganizó el menú docente de forma institucional:

1. Principal
   - Mi Perfil
   - Información General del Programa
2. Gestión Académica
   - Mis grupos
   - Asistencia
   - Calendario académico
3. Planificación Académica
   - Syllabus
   - Plan de Estudio
   - Planeamiento por lección
   - Cronograma general
4. Recursos Didácticos
   - Biblioteca digital
   - Libros de texto
   - Audios
5. I CAN Conversation Club
6. English LAB
7. Evaluación y comunicación
   - Exámenes
   - Comunicados
   - Mis pendientes

`Planeamiento por lección` muestra niveles B1, B2, I1 e I2 en la columna izquierda y las 32 lecciones PDF del nivel seleccionado a la derecha.

`Plan de Estudio` se separó de Planeamiento por lección.

`Biblioteca digital` abre libros PDF internamente en el Campus, con visor y descarga.

`Libros de texto` muestra niveles B1, B2, I1 e I2; abre SB por defecto y permite cambiar entre SB, TB y WB desde botones al lado de Descargar.

### Consulta individual financiera

Se corrigió la contradicción visual del certificado:

- Pago de certificado y emisión del certificado son conceptos separados.
- El bloque financiero indica `PAGO APLICADO` cuando existe comprobante.
- La emisión documental se controla por la columna Certificado.
- No debe decir `PAGADO · NO EMITIDO` dentro del bloque financiero porque confunde comprobante con emisión.

### CONAPE y cambios de grupo

Regla vigente:

- Un estudiante con cambio de grupo pendiente de aprobación CONAPE permanece en su grupo real/original.
- No debe aparecer en el grupo destino hasta aprobación.
- No debe duplicarse en el nivel ni arrastrar futuros a otro grupo.
- CONAPE puede recibir una proyección fusionada/congelada consistente para n8n, sin publicar el traslado académico antes de aprobación.
- Las hojas 5-plan_estudios y 7-morosidad deben quedar consistentes para n8n.

Casos que originaron la corrección:

- 17078 · MONGE SALAS STEVEN JOSHUA · B2 · 2026/2.
- 17088 · VALERIO LOPEZ GABRIEL · I1 · 2026/4.

### Calendario académico

Se eliminó la limpieza pesada automática dentro de `getGruposActivos`, `getAdminDashboard` y `getRadiografiaGrupo` porque causaba timeout en Calendario académico.

La limpieza o congelamiento físico se ejecuta manualmente desde Apps Script cuando sea necesario.

### Diagnóstico interno

Se mantiene y amplía Diagnóstico interno como herramienta central de auditoría.

Debe conservar:

- Auditoría CONAPE de las 7 hojas.
- Preflight para n8n.
- Verificación por cédula.
- Estado `PROTEGIDO` cuando la API externa devuelve 401/403.
- Comparación local APOLLO/DATOS/ESTATUS contra hojas CONAPE.
- Listas de diferencias: faltantes, sobrantes, plan incompleto, historial faltante, morosidad faltante y diferencias reales.

Importante:

- `PROTEGIDO` no significa que las hojas estén malas.
- Significa que la API/base externa no permite verificar destino final sin credenciales de solo lectura.
- Aunque la API externa esté protegida, el diagnóstico debe devolver diferencias locales útiles.

### Regla CA en nivel proyectado

`CA_EN_NIVEL_PROYECTADO` no debe ser crítico para CONAPE.

Para CONAPE es normal que:

- Nivel anterior esté APR.
- Siguiente nivel/cuatrimestre esté CA.
- Morosidad esté NO.

Esto permite reflejar que el dinero ya fue usado para inscripción y habilitar el siguiente desembolso.

## Restricciones críticas

- No modificar DATOS ni ESTATUS desde usuario gratuito.
- No usar parches de Apps Script para producción; entregar Code.gs completo.
- No crear triggers automáticos para CONAPE.
- No ejecutar limpieza pesada dentro de endpoints de calendario o dashboard.
- No publicar cambios de grupo CONAPE hasta aprobación.
- No maquillar auditorías: el diagnóstico debe mostrar diferencias reales y clasificar correctamente.
- No mezclar Academia Play, English LAB o práctica gamificada con notas oficiales.
- No crear premios, rankings ni insignias oficiales sin definición formal.

## Próximo foco recomendado

1. Probar CS21A19 en Apps Script publicado.
2. Ejecutar Diagnóstico interno completo.
3. Validar grupos afectados por cambio CONAPE pendiente.
4. Confirmar que Calendario académico ya no hace timeout.
5. Consolidar una entrega limpia posterior, idealmente CS21A20, sin acumulación de overrides visuales cuando ya esté validado.