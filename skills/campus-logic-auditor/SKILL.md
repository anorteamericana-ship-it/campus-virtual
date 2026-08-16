---
name: campus-logic-auditor
description: >
  Traza contratos, permisos, datos, estados y concurrencia del Campus Virtual
  desde cada rol y menú hasta componentes, endpoints y fuentes oficiales.
  Usar para detectar fallas de lógica, autorización, idempotencia, fechas,
  fallbacks, globals superpuestos y discrepancias frontend-backend.
---

# Auditor de lógica y contratos

## Objetivo

Encontrar contradicciones de negocio y fallas de control que una prueba visual puede ocultar, manteniendo separadas la implementación guardada, la observada y la desplegada.

## Entradas mínimas

- SHA de frontend.
- Documentos de fuente de verdad y matriz de entrega.
- Backend observado con hash o versión, si existe.
- Información verificable del backend desplegado, si existe.
- Reglas oficiales del dominio y excepciones conocidas.

Un documento histórico orienta la búsqueda, pero no prueba que el código o despliegue actual lo cumpla.

## Construcción de la matriz maestra

Para cada superficie derivada del código, completar:

| Campo | Pregunta |
|---|---|
| Rol y condición | ¿Quién puede verla y bajo qué estado de sesión, matrícula o feature flag? |
| Ruta y entrada | ¿Qué menú, hash, handler o enlace profundo la activa? |
| Implementación | ¿Qué componente, bundle, wrapper, parche DOM y orden de carga la sostienen? |
| Lecturas | ¿Qué endpoint consulta, con qué parámetros y forma de respuesta? |
| Escrituras | ¿Qué endpoint muta, cuál es su clave idempotente y qué confirma el éxito? |
| Autorización | ¿Dónde se valida el rol y la pertenencia del recurso en backend? |
| Datos | ¿Qué hoja, rango, Drive, propiedad o proveedor es fuente oficial? |
| Estados | ¿Qué transiciones son válidas y cuáles deben rechazarse? |
| Evidencia | ¿Qué nivel E0–E4 respalda cada afirmación? |

No dejar “ninguno” sin verificar: distinguir una superficie realmente local de un endpoint todavía no localizado.

## Método obligatorio

1. Fijar SHA, versión documental y backend observado.
2. Escribir invariantes antes de estudiar el camino feliz.
3. Buscar todas las definiciones, asignaciones, wrappers y lectores del símbolo.
4. Trazar entrada → validación → lectura → transformación → render → escritura → confirmación.
5. Revisar orden de carga en `campus.html`, router, `F96_LAZY` y globals de `window`.
6. Comparar los contratos frontend/backend por nombre, parámetros, tipos, nulos, errores y semántica.
7. Modelar dobles clics, dos pestañas, reintentos, timeouts, respuestas fuera de orden y recarga.
8. Verificar fallbacks: autorización falla cerrada; datos faltantes se muestran como desconocidos, no como éxito.
9. Separar defecto demostrado de riesgo estático y de ausencia de evidencia desplegada.
10. Proponer la prueba mínima que confirme cada hipótesis; no corregir en esta fase.

## Invariantes críticas

- Un estudiante no recibe contenido futuro, de otro nivel ni material exclusivo de docente.
- Un docente solo lee y modifica grupos y estudiantes autorizados.
- Admin y superadmin conservan permisos distintos aun si comparten componentes.
- Una lección, examen, asistencia o nota cerrada no cambia sin permiso, validación y trazabilidad.
- Existe como máximo el número permitido de intentos académicos activos según la clave oficial.
- Un pago, comprobante, matrícula, reversión o sincronización CONAPE no se aplica dos veces.
- El frontend nunca sustituye autorización, recibos, saldos o estados oficiales del backend.
- Una respuesta tardía no reemplaza una selección o ruta más reciente.
- Un error o dato ausente no se convierte en cero, aprobado, al día o permitido.
- La lógica de “hoy” usa `America/Costa_Rica` y no depende accidentalmente de UTC o parsing ambiguo.
- La caché no presenta datos financieros, académicos o de permisos como actuales cuando son obsoletos.
- MÁSCARA/demo permanece aislada, de solo lectura y sin filas reales.

## Riesgos específicos a buscar

- Endpoints llamados por frontend y ausentes en el backend observado.
- Endpoints presentes pero no despachados, o con parámetros renombrados.
- Autorización basada solo en UI, rol enviado por el cliente o identificador no vinculado a sesión.
- `catch` vacíos, promesas flotantes, spinners sin cierre y éxitos optimistas irreversibles.
- Estado derivado de texto visible, orden de arrays, índices de hoja o valores por defecto inseguros.
- Definiciones globales tardías que sustituyen implementaciones anteriores.
- Parches que dependen de selectores, etiquetas u orden DOM frágiles.
- Archivos modificados sin invalidación del punto de entrada o de la caché.
- Lectura y escritura sobre fuentes distintas sin reconciliación explícita.
- Fechas inclusivas/exclusivas, cambio de día y comparaciones de cadenas.
- Normalización inconsistente de cédula, grupo, nivel, periodo, monto o comprobante.

## Salida

- Matriz maestra versionada.
- Invariantes por dominio y su estado: preservada, violada, desconocida o no aplicable.
- Diagramas o trazas solo cuando aclaren un flujo no lineal.
- Hallazgos con archivos, símbolos, endpoint, fuente, escenario y evidencia.
- Lista de contratos no verificables y prueba requerida.
- Mapa de definiciones superpuestas y candidatos para el consolidador, sin recomendar borrado todavía.

## Criterios de finalización

- Cada menú/ruta descubierta está trazado hasta su fuente o marcado como incompleto.
- Cada escritura sensible tiene autorización, idempotencia, confirmación y reversión evaluadas.
- Las discrepancias documentales y de despliegue están explícitas.
- No se presenta análisis estático como comportamiento productivo confirmado.
