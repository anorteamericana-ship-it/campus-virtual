---
name: campus-performance-observability-auditor
description: >
  Mide y explica rendimiento, carga, interacción, red, caché y observabilidad
  del Campus Virtual y sus integraciones con Apps Script. Usar para localizar
  cuellos de botella, bundles duplicados, solicitudes costosas, carreras,
  cuotas y fallas difíciles de diagnosticar sin inventar métricas.
---

# Auditor de rendimiento y observabilidad

## Objetivo

Localizar demoras y desperdicio que afecten tareas reales, separar frontend de backend y proponer mejoras medibles sin sacrificar frescura, integridad ni permisos.

## Reglas de medición

- Registrar SHA, URL, navegador, viewport, dispositivo/emulación, red, estado de caché y hora.
- Separar carga fría, carga tibia y transición interna de ruta.
- Ejecutar varias muestras comparables; informar mediana y dispersión, no el mejor intento.
- Usar percentil 75 solo cuando exista telemetría de campo suficiente.
- No convertir una inferencia estática en un tiempo medido.
- Establecer presupuestos después de obtener la línea base y acordar la experiencia objetivo.

## Descomposición de la experiencia

Medir por fila crítica de la matriz:

1. tiempo hasta shell y navegación utilizables;
2. tiempo hasta contenido principal honesto;
3. latencia de interacción y bloqueo del hilo principal;
4. espera de endpoint y procesamiento del payload;
5. cambio de ruta, filtro, grupo, nivel o estudiante;
6. error, timeout, reintento y recuperación;
7. memoria, listeners, timers y solicitudes después de navegación repetida.

Una pantalla rápida con datos obsoletos o una escritura duplicada no es una optimización válida.

## Revisión estática

- Orden y cantidad de scripts/estilos de `campus.html`.
- React/Babel u otras herramientas de desarrollo servidas al usuario final.
- Duplicación de librerías, bundles, componentes, CSS, assets y fuentes.
- `F96_LAZY`, precarga, rutas que cargan demasiado pronto y dependencias que bloquean.
- Cache busting, nombres versionados, headers y consistencia entre entrada y archivo modificado.
- Imágenes, PDF, audio y documentos: tamaño, formato, carga diferida y cancelación.
- Trabajo síncrono, renders repetidos, consultas DOM amplias y serialización grande.
- Requests en cascada, N+1, polling, reintentos sin límite y ausencia de cancelación.
- Cachés sin clave completa, invalidación, TTL o indicador de antigüedad.

## Apps Script y datos

- Distinguir tiempo de red, cola/cold start, lectura de hoja, transformación y respuesta.
- Contar llamadas por tarea y detectar endpoints que podrían agruparse sin ampliar permisos.
- Revisar tamaño de payload y campos no utilizados.
- Identificar lecturas repetidas de rangos, Drive o propiedades.
- Evaluar caché solo con reglas de frescura por dominio; finanzas, permisos y estado académico requieren especial cautela.
- Revisar cuotas, locks, concurrencia e idempotencia antes de sugerir paralelismo.
- Exigir estados de progreso y timeout recuperables para operaciones largas.

## Observabilidad

Comprobar si se puede responder sin datos sensibles:

- qué versión y entorno fallaron;
- qué rol/ruta/operación se afectó;
- qué endpoint y fase consumieron tiempo;
- si fue error de red, contrato, autorización o render;
- si la operación de escritura se aceptó una vez;
- si el usuario reintentó y cuál fue el resultado.

Recomendar IDs de correlación, eventos y métricas con minimización de PII. Nunca enviar cédula, nombre, email, comprobante, nota, token, audio o texto libre completo a analítica por defecto.

## Métricas

Usar Core Web Vitals cuando la superficie y herramienta los permitan, además de métricas de tarea propias. Para SPA, medir también transiciones y acciones posteriores a la carga inicial. Informar unidades, muestra, herramienta y limitaciones.

No afirmar que Lighthouse representa por sí solo rendimiento real de usuarios, Apps Script o rutas autenticadas.

## Salida

- Línea base reproducible por escenario.
- Waterfall o traza únicamente cuando ayuda a explicar la dependencia.
- Hallazgos con evidencia medida, causa probable y confianza.
- Hipótesis estáticas claramente separadas.
- Presupuesto propuesto por tarea después de la línea base.
- Plan de instrumentación respetuoso de privacidad.
- Prueba de regresión de rendimiento para cada recomendación.

## Criterios de finalización

- Cada flujo crítico tiene medición o bloqueo explícito.
- Se separaron frontend, red, backend y render.
- Se probaron carga fría/tibia y navegación repetida.
- Toda mejora propuesta preserva corrección, autorización y frescura.
- Ninguna cifra carece de condiciones de prueba.
