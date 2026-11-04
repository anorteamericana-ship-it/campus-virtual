# F111 — Última pasada de menús EN/ES · estudiante y docente

**Corte:** 04-nov-2026 · Academia Norteamericana. **Fuente de seguimiento:** issue #499. No equivale a certificación E2 con cuentas reales.

## Alcance verificado en código

| Superficie | Revisión y corrección | Estado |
|---|---|---|
| Barra lateral estudiante | 5 secciones, todos los enlaces y rótulos traducidos mediante AN_I18N.t; Tareas y enlace autónomo I CAN siguen ocultos, I CAN académico intacto | E1 pendiente hasta CI |
| Pestañas estudiante | Mi curso; evaluaciones (upcoming, results, make-up); documentos (programa, avisos, ayuda) | Se corrigieron 3 pestañas documentales |
| Barra lateral docente | 5 secciones de navegación, 21 rótulos observados en origen; EN default, ES opcional | E1 pendiente hasta CI |
| Pie de menú docente | Sustituido rótulo visible 'Docente · CS21A4' por Teacher en EN; Logout bilingüe | Código cambiado |
| Planificación y recursos docente | Cabeceras, descripciones, niveles, botones de acceso y resumen de asistencia | Ahora pasan por traducción exacta |
| Mis Grupos y seguimiento | Upcoming/History, categorías de pendientes, acciones de seguimiento y filtro de asistencia | Ahora pasan por traducción exacta |
| Material docente institucional | Títulos y descripciones de la UI traducidos; contenido PDF oficial sin cambios | Respeta documento original |
| Menú administrativo | Sin traducción EN; fuera del piloto (solo estudiante/docente) | Intencional |

## Control reproducible
- `scripts/qa_f111_final_bilingual_menus_e1.mjs`: extrae los rótulos de ambos menús directamente de los componentes, prueba traducciones EN/ES, submenús, badges, pestañas y versiones de caché; sin red ni escrituras.
- Workflow `F111 i18n Preview Safe E1` exige esta prueba junto a las E1 históricas. D1 conserva su comparador de motor y solo normaliza la nueva versión de caché en la comparación.
- Cache token: `F111MENUSENFINAL20261104A` en 12 rutas diferidas y 3 cargas HTML.
- No se editaron Apps Script, datos estudiantiles, pagos, calificaciones, asistencias, permisos, exámenes o contenido fuente de PDFs.

## Criterio de cierre y límites
1. Código fusionado + CI verde confirma cobertura de **etiquetas de navegación inventariadas**, no todas las frases generadas por cada proceso docente.
2. Verificar el dominio público después del despliegue. Un HTTP 200 o QA sintético nunca certifica el menú con rol real.
3. E2 auténtica todavía pendiente: cambiar EN↔ES, abrir las rutas, comparar estudiante/docente, escritorio y 390 px, sin exponer información privada.
4. Los mensajes de errores devueltos por el backend, comentarios académicos, PDFs oficiales y textos originales de usuarios no deben traducirse automáticamente.
5. Si una pantalla operativa docente todavía muestra una cadena no cubierta, registrarla como pendiente. No declarar 100% del Campus bilingüe sin evidencia visual autenticada.

## Evidencia final
- PR, SHA y GitHub Actions: agregar en issue #499 tras el merge.
- Versión de producción y paridad HTTP: confirmar posterior al deploy.
- E2 auténtica por rol: todavía sin evidencia en este corte.