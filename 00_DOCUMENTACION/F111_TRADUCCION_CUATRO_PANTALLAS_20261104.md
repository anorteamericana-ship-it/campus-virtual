# F111 · Traducción visible de cuatro pantallas estudiantiles — 04-nov-2026

**Alcance:** Assessments, Books & Audio, Payments & Account Statement y My Certificates. Seguimiento: issue #499. No equivale a E2 autenticada.

## Cambios
1. Assessments: rótulos, exámenes, lecciones, estados y fechas en EN/ES; getMisNotasF921 y sus valores siguen intactos.
2. Books & Audio: B1/B2/I1/I2, SB/WB, visor visual, botones PDF y mensajes; el componente compartido solo traduce cuando studentMode es verdadero.
3. Payments: saldos contractuales, advertencia legal, conceptos, recibos y movimientos. Sin modificar montos, fechas, comprobantes ni exigibilidad.
4. Certificates: títulos, estados visibles, asistencia, nota, morosidad, pago y número oficial. CA/PE/INA, expediente y PDF permanecen intactos.

## Evidencia y controles
- Traducción exacta por diccionario, alternativa ES original y ningún reemplazo DOM general.
- Caché actualizada únicamente en scripts necesarios para las cuatro pestañas.
- Nueva prueba E1 scripts/qa_f111_student_four_tabs_en_e1.mjs en el workflow i18n.
- D1 conserva comparación exacta, descontando solo la clave de versión autorizada.
- Sin cambios en Apps Script, pagos, notas, asistencia, permisos, PDFs, grupos, certificados ni secretos.

## Estado de cierre
- Integración y CI: pendientes de verificación final.
- GitHub Pages y paridad HTTP posterior a integración: pendientes de verificación.
- E2 autenticado estudiante y móvil: pendiente; no declarar aprobado por E1/HTTP.
- No publicar ante una falla crítica. Registrar SHA, CI y riesgos en issue #499.