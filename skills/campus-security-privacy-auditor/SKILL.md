---
name: campus-security-privacy-auditor
description: >
  Audita seguridad y privacidad del Campus Virtual, incluyendo sesiones,
  autorización backend, aislamiento entre roles, PII académica y financiera,
  Drive, Apps Script, proveedores de audio/IA, secretos y dependencias.
  Usar para threat modeling y pruebas seguras; nunca para atacar producción.
---

# Auditor de seguridad y privacidad

## Objetivo

Identificar caminos realistas de acceso indebido, modificación, exposición o retención de datos y demostrar el riesgo con la mínima prueba segura posible.

## Límites de seguridad

- Empezar con análisis estático y entorno aislado.
- No realizar fuerza bruta, evasión de controles, exfiltración, descargas masivas ni escrituras destructivas.
- No reutilizar credenciales, tokens, audios o datos personales en fixtures o informes.
- En producción, limitarse a lectura autorizada y acciones ordinarias de la cuenta de prueba.
- Una prueba que acceda a datos de otra persona, cambie permisos o afecte pagos requiere entorno aislado y autorización específica.
- Detener la prueba al demostrar el control faltante; no ampliar el impacto.

## Modelo de amenazas

Antes de buscar vulnerabilidades, enumerar:

- activos: identidad, sesión, expediente, notas, asistencia, pagos, comprobantes, CONAPE, documentos, audio y contenido docente;
- actores: visitante, prospecto, estudiante, docente, admin, superadmin, proveedor y atacante sin sesión;
- fronteras: navegador, GitHub Pages, Apps Script, hojas, Drive, Cloudflare/Workers y servicios de IA;
- operaciones de lectura y escritura por rol;
- enlaces o identificadores que funcionen como capacidad;
- datos que salen del control institucional y sus reglas de retención.

Vincular cada amenaza con una fila de la matriz maestra.

## Revisión obligatoria

### Sesión y autenticación

- Origen, almacenamiento, expiración, rotación y cierre de tokens.
- Datos sensibles en `localStorage`, `sessionStorage`, URL, historial, logs o globals.
- Reautenticación para acciones sensibles y comportamiento con sesión expirada.
- Recuperación/login sin enumeración innecesaria de cuentas.

### Autorización

- Validación server-side en cada endpoint, no solo menú o botón.
- Vinculación entre sesión, rol y recurso solicitado para evitar IDOR.
- Separación admin/superadmin y pertenencia docente-grupo/estudiante.
- Restricción de Teacher Book, contenido futuro, archivos de Drive y funciones demo.
- Denegación por defecto ante rol, recurso o estado desconocido.

### Entradas y salidas

- HTML/JS/URL inyectables en mensajes, nombres, observaciones, archivos y contenido remoto.
- Uso de `innerHTML`, handlers construidos como texto, URLs arbitrarias y redirects.
- Fórmulas peligrosas al escribir en hojas o exportar CSV.
- Validación de archivo, MIME, tamaño y nombre cuando hay carga.
- Mensajes de error que filtren IDs, rutas, tokens, stack o configuración.

### Integración y despliegue

- Orígenes permitidos, CORS, CSP, framing, mixed content y recursos de terceros.
- Secretos, IDs privados o credenciales en código, historial, workflows y artifacts.
- Permisos de GitHub Actions y uso seguro de eventos, forks y secretos.
- Dependencias vendorizadas o remotas, integridad, versión y procedencia.
- Endpoints antiguos todavía publicados o rutas alternativas que evadan validación.

### Privacidad

- Minimización de PII en payloads, cachés, métricas, screenshots y logs.
- Acceso y enlaces de Drive con el alcance mínimo.
- Propósito, consentimiento, retención y borrado de audio/transcripciones.
- Transferencia a proveedores de IA y configuración de entrenamiento/retención verificable.
- Separación entre datos demo y expedientes reales.
- Trazabilidad de lecturas y cambios sensibles sin registrar contenido excesivo.

### Integridad de negocio

- Idempotencia y autorización de pagos, comprobantes, matrícula, notas, cierres y CONAPE.
- Validación del monto, moneda, estudiante, nivel y estado en backend.
- Protección contra replay, doble clic, respuesta tardía y actualización concurrente.
- Journal y reversión que no puedan ejecutarse fuera de permiso.

## Evidencia y clasificación

Para cada riesgo registrar activo, actor, precondición, frontera cruzada, control esperado, evidencia y máximo impacto demostrado de forma segura. Indicar si la explotación es confirmada o solo plausible.

CWE u OWASP pueden ayudar a nombrar la clase, pero no sustituyen pasos reproducibles ni justifican por sí solos la severidad.

## Salida

- Diagrama compacto de fronteras solo si aclara el flujo.
- Matriz `superficie → activo → operación → control backend → evidencia`.
- Hallazgos en el formato común.
- Exposiciones de datos clasificadas por tipo y ubicación, con valores redactados.
- Pruebas bloqueadas por seguridad y entorno aislado requerido.
- Controles de prevención, detección y recuperación recomendados por separado.

## Criterios de finalización

- Todas las escrituras y lecturas sensibles de la matriz tienen control evaluado.
- Se revisaron roles cruzados y acceso directo, no solo visibilidad de UI.
- Los proveedores externos y la retención de datos están identificados o marcados como desconocidos.
- Ningún informe contiene secretos o datos personales.
- No se modificó producción ni se amplificó una vulnerabilidad para obtener evidencia.
