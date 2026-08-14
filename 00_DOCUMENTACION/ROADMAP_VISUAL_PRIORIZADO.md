# Roadmap visual priorizado

Base: **F98.4-Z6-CS21A90-CONSOLIDADO**. Próxima versión nueva: **CS21A91**.

## Método obligatorio por pantalla

Antes de diseñar:

1. identificar usuario y tarea principal;
2. identificar fuente de verdad;
3. separar información imprescindible de información secundaria;
4. preservar rutas, permisos y reglas existentes;
5. evitar apilar parches;
6. probar antes de entregar;
7. declarar por separado código, QA, deployment y validación visual.

## Fase 0 · Aceptar la base actual

### Calendario académico CS21A88

Pendiente: validación visual final del usuario.

Comprobar:

- filtros `Todos / En curso / Revisar / Aperturas / Completados`;
- una fila por grupo;
- Semana y Mes;
- fichas compactas;
- panel lateral de lección;
- botón `Ver estudiantes del grupo`;
- responsive en laptop/escritorio.

No volver a meter mora o conteos financieros dentro de cada ficha de lección.

### Rebeca CS21A90

- verificar si A90 ya fue publicado;
- si falta, actualizar el deployment existente sin cambiar la URL;
- ejecutar una llamada HMAC externa real desde el agente.

## Fase 1 · Sistema visual común

Auditar y normalizar:

- encabezados de página;
- tarjetas;
- pestañas;
- filtros;
- tablas;
- badges;
- botones;
- modales y paneles laterales;
- estados vacíos;
- loaders;
- errores y confirmaciones.

Revisar primero `styles/tokens.css`, `styles/campus.css` y los estilos unificados de estudiante, docente y admin. Evitar colores, radios y espaciados inventados por módulo.

## Fase 2 · Superadmin y administración

Prioridad alta.

### Panel Maestro

- jerarquía de información;
- navegación entre áreas;
- filtros consistentes;
- acciones rápidas;
- reducción de duplicados.

### Consulta individual

- ficha técnica clara;
- separar académico y financiero;
- historial accesible sin invadir la vista principal;
- comentarios y alertas visibles cuando corresponda;
- preservar reglas de certificados y continuidad.

### Cobranza y cartera

Preservar CS21A78. Mejorar jerarquía de filtros, siguiente acción, comentarios y WhatsApp sin perder contexto.

### Calendario académico

Después de aceptar CS21A88: densidad, responsive, accesibilidad de estados y navegación grupo → estudiantes → expediente.

### Libros y Audios

Preservar acceso directo Superadmin, páginas/unidades, audio inline y navegación de libro. Unificar visualmente con el resto del Campus.

### English LAB admin

Preservar dashboard y ficha por estudiante. Mejorar filtros, progreso, estados vacíos y navegación.

## Fase 3 · Docentes

### Agenda docente

- próxima clase;
- semana legible;
- grupos propios;
- pendientes accionables.

### Perfil docente CS21A76

- jerarquía de ficha;
- documentos;
- estados de revisión;
- claridad de campos editables.

### Asistencia y seguimiento CS21A77

- lectura rápida;
- progreso por grupo;
- alertas sin saturación;
- tablet/móvil.

### Detalle de lección CS21A73

Separar claramente: impartir clase, material, planeamiento y cierre.

## Fase 4 · Estudiantes

### Mi Campus

Priorizar: próxima clase, nivel, progreso, evaluaciones, pagos relevantes y accesos rápidos.

### Actualizar datos

Reglas vigentes:

- ficha técnica;
- solo correo y teléfono editables;
- permitir dato adicional;
- elegir principal;
- no borrar el anterior.

### Mi curso

Mejorar cronograma, materiales, lección actual y navegación libro/audio.

### Evaluaciones

Preservar:

- disponibilidad en la lección correspondiente;
- 90 minutos;
- advertencia por respuestas vacías;
- un solo envío;
- sin correcciones posteriores;
- resumen después del envío.

### Certificados

Mostrar estado real y requisitos; nunca marcar como disponible sin aprobación real.

## Fase 5 · Ventas y Rebeca

Después del deployment A90:

- validar llamada externa;
- usar siguiente mejor acción;
- registrar familias de roles de `MULTIPLE_ROLES` sin PII;
- priorizar venta directa cuando sea más simple;
- no tratar `PROSPECTOS` como matrículas confirmadas.

## Fase 6 · Responsive, accesibilidad y rendimiento

Probar escritorio, laptop 1366x768, tablet y móvil cuando aplique.

Revisar:

- contraste;
- foco de teclado;
- estados que no dependan solo del color;
- áreas mínimas de interacción;
- lazy loading;
- scripts duplicados;
- wrappers obsoletos;
- llamadas repetidas.

## Formato de entrega

Toda mejora debe indicar:

- problema observado;
- fuente de verdad;
- archivos modificados;
- funciones preservadas;
- pruebas ejecutadas;
- resultado esperado;
- deployment realizado o pendiente;
- validación visual realizada o pendiente.
