---
name: campus-accessibility-auditor
description: >
  Audita el Campus Virtual contra WCAG 2.2 nivel AA y la ejecución real de
  tareas con teclado, lector de pantalla, zoom, reflow, contraste y medios.
  Usar para accesibilidad de menús, SPA, formularios, tablas, diálogos,
  evaluaciones, libros y audio; combina pruebas automáticas y manuales.
---

# Auditor de accesibilidad

## Objetivo

Determinar si cada rol puede completar sus tareas críticas sin depender de visión, ratón, color, audio perfecto o una disposición fija de pantalla.

## Norma y alcance

Usar WCAG 2.2 AA como objetivo verificable. Señalar criterios AAA solo como mejora opcional. Evaluar la experiencia completa y sus estados de carga, vacío, error, validación y éxito; una pantalla estática sin errores automáticos no demuestra accesibilidad.

## Método

1. Tomar la matriz maestra y priorizar autenticación, navegación, aprendizaje, evaluación, asistencia, pagos y administración.
2. Ejecutar un escaneo automático por plantilla/ruta para localizar patrones.
3. Recorrer manualmente cada tarea crítica solo con teclado.
4. Verificar nombre, rol, valor, estado y orden de lectura con el árbol de accesibilidad o lector disponible.
5. Probar 200 % de zoom y reflow a 320 CSS px donde aplique.
6. Revisar contraste, estados de foco, movimiento, tacto y medios.
7. Repetir en los estados dinámicos y en móvil.
8. Registrar el criterio aplicable, impacto funcional y alcance; no inflar una ocurrencia aislada a toda la plataforma.

## Comprobaciones por superficie

### Navegación SPA

- Salto al contenido, landmarks, título y encabezado principal coherentes.
- Orden de tabulación predecible y foco visible.
- Ruta activa comunicada sin depender solo de color.
- Al cambiar de ruta, foco colocado de forma útil y nombre de página anunciado.
- Sidebars y menús móviles abribles, recorribles y cerrables con teclado.
- Enlaces profundos, atrás/adelante y recarga conservan contexto comprensible.

### Diálogos y overlays

- Nombre accesible, descripción cuando aporta contexto y semántica modal correcta.
- Foco inicial deliberado, confinamiento mientras está abierto y retorno al disparador.
- Cierre con teclado cuando sea seguro.
- Confirmaciones y errores anunciados; el fondo no queda operable por accidente.

### Formularios y acciones

- Etiquetas programáticas, instrucciones y agrupaciones.
- Requerido, formato y error vinculados al control afectado.
- Error identificado con texto y foco manejado; no solo borde o color.
- Autocompletado apropiado para datos personales cuando aplique.
- Prevención o confirmación de errores en operaciones académicas y financieras.
- Botones con nombres estables durante carga y sin doble activación.

### Contenido complejo

- Tablas con encabezados y relaciones comprensibles.
- Gráficos con resumen o datos equivalentes.
- Tarjetas y elementos personalizados con semántica y estado.
- PDFs y documentos evaluados como parte del flujo, no asumidos accesibles por abrirse.
- Evaluaciones con tiempo, progreso, instrucciones y alternativas que no penalicen el uso de tecnología de apoyo.

### Visual, táctil y movimiento

- Contraste de texto, componentes, foco y estados.
- Reflow sin pérdida ni scroll bidimensional salvo excepciones justificadas.
- Texto ampliado sin corte, solapamiento ni controles inaccesibles.
- Objetivos táctiles conforme a WCAG 2.2 AA o con excepción documentada.
- Orientación no restringida sin necesidad.
- Respeto de `prefers-reduced-motion`; sin flashes peligrosos ni animación indispensable.

### Audio y aprendizaje

- Controles de audio operables y etiquetados por teclado/lector.
- Sin autoplay inesperado; volumen y pausa disponibles cuando corresponda.
- Alternativa textual o adaptación según el propósito pedagógico.
- La transcripción no se presenta como equivalente automático de pronunciación.
- El feedback no depende solo de color, forma de onda o sonido.

## Severidad orientativa

- P1 si una tarea crítica queda imposible para un grupo de usuarios y no hay alternativa segura.
- P2 si existe barrera importante, repetida o alternativa claramente degradada.
- P3 para incumplimiento localizado que no bloquea la tarea.

Asignar severidad por impacto y frecuencia, no por el número del criterio WCAG.

## Salida

- Cobertura por rol, ruta, tarea, estado y tecnología de apoyo.
- Resultados automáticos separados de verificaciones manuales.
- Hallazgos con criterio WCAG, elemento, pasos, esperado, observado y evidencia.
- Patrones compartidos que permitan corregir la causa raíz.
- Pruebas que requieren dispositivo o usuario especializado y permanecen bloqueadas.
- Recomendaciones de regresión accesible para cada componente base.

## Criterios de finalización

- Todas las tareas críticas tienen prueba manual o bloqueo explícito.
- Se evaluaron estados dinámicos, foco y navegación, no solo contraste.
- Los falsos positivos automáticos fueron verificados.
- No se declara conformidad WCAG total a partir de una muestra incompleta.
