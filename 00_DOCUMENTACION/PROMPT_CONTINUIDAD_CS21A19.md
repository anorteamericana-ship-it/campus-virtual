# PROMPT DE CONTINUIDAD — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA CS21A19

Copiar este prompt al iniciar un nuevo chat.

---

Estoy trabajando en el proyecto CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA, Costa Rica. Necesito que continúes desde el corte F98.4-Z6-CS21A19.

Reglas de trabajo obligatorias:

1. Responde en español directo.
2. No asumas que sé programar.
3. Si cambias Apps Script, entrégame siempre el Code.gs completo, no parches.
4. Si cambias frontend/GitHub, respeta rutas reales del repositorio y entrégame archivos listos o ZIP cuando lo pida.
5. No toques pagos, certificados, DATOS, ESTATUS, CONAPE ni calendario sin analizar impacto.
6. No maquilles auditorías; quiero errores reales y listas accionables.
7. Mantén 00_DOCUMENTACION como fuente verdadera del proyecto.

Estado vigente:

- Frontend: F98.4-Z6 con línea CS21A.
- Backend entregado más reciente: Code_F98_4_Z6_CS21A19_CONAPE_DIAGNOSTICO_MASIVO_COMPLETO.gs.
- GitHub repo: anorteamericana-ship-it/campus-virtual.
- Documentación actualizada en 00_DOCUMENTACION.

Cambios recientes importantes:

1. Menú docente reorganizado:
   - Principal: Mi Perfil, Información General del Programa.
   - Gestión Académica: Mis grupos, Asistencia, Calendario académico.
   - Planificación Académica: Syllabus, Plan de Estudio, Planeamiento por lección, Cronograma general.
   - Recursos Didácticos: Biblioteca digital, Libros de texto, Audios.
   - I CAN Conversation Club.
   - English LAB.
   - Evaluación y comunicación: Exámenes, Comunicados, Mis pendientes.

2. Documentos docentes:
   - Planeamiento por lección debe mostrar B1, B2, I1, I2 a la izquierda y los PDF de lecciones a la derecha.
   - Biblioteca digital abre PDFs dentro del Campus.
   - Libros de texto muestra niveles a la izquierda y botones SB, TB, WB junto a Descargar.

3. Consulta individual:
   - Pago de certificado y emisión del certificado son cosas diferentes.
   - Si hay comprobante en otros pagos, el bloque financiero debe decir PAGO APLICADO.
   - La columna Certificado indica si el documento oficial fue emitido.

4. CONAPE:
   - Si un estudiante tiene cambio de grupo pendiente de aprobación CONAPE, permanece en su grupo real/original.
   - No debe aparecer en el grupo destino.
   - No debe duplicarse en el nivel.
   - No se deben recalcular futuros al grupo destino hasta aprobación.
   - Para procesos externos se puede generar vista fusionada/congelada consistente, pero no traslado académico real.

5. Calendario académico:
   - No ejecutar limpiezas pesadas dentro de getGruposActivos, getAdminDashboard ni getRadiografiaGrupo.
   - Esas limpiezas causan timeout.

6. Diagnóstico interno:
   - Mantener auditoría de 7 hojas CONAPE.
   - Mantener preflight para integración externa.
   - Mantener verificación por cédula.
   - Agregar o mantener verificación masiva local APOLLO/DATOS/ESTATUS contra hojas CONAPE.
   - Si la API externa devuelve 401/403, mostrar PROTEGIDO y devolver diferencias locales de todos modos.
   - Debe listar cédulas faltantes, sobrantes, plan incompleto, historial faltante, morosidad faltante y diferencias reales.

7. CA proyectado:
   - CA_EN_NIVEL_PROYECTADO no debe ser crítico para CONAPE.
   - Es normal que el nivel anterior esté APR, el siguiente CA y morosidad NO cuando se gestiona desembolso anticipado.

Archivos documentales nuevos o relevantes:

- 00_DOCUMENTACION/README_CS21A19_CONTINUIDAD.md
- 00_DOCUMENTACION/BIBLIA_DELTA_CS21A19_CONAPE_DIAGNOSTICO.md
- 00_DOCUMENTACION/SKILL_CAMPUS_VIRTUAL_CS21A19.md
- 00_DOCUMENTACION/PROMPT_CONTINUIDAD_CS21A19.md

Objetivo del nuevo chat:

Continuar desde CS21A19, validar Diagnóstico interno, revisar CONAPE sin romper grupos reales, y consolidar una próxima entrega limpia CS21A20 si todo queda probado.

Antes de proponer código, revisa el contexto, identifica si toca frontend o Apps Script, y dime qué archivos cambiarías. Si Apps Script cambia, entrégame Code.gs completo.

---