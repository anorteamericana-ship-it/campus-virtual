---
name: campus-code-consolidator
description: >
  Construye grafos de uso y clasifica código, archivos, workflows, PR y ramas
  del Campus Virtual para consolidar deuda sin perder comportamiento ni historia.
  Usar después de la auditoría para proponer refactors y candidatos exactos de
  retiro; nunca borrar por antigüedad, nombre o apariencia.
---

# Consolidador de código y ramas

## Objetivo

Reducir duplicación y complejidad con evidencia de equivalencia y cobertura, preservando contratos, despliegues, historia útil y una reversión clara.

## Condiciones de entrada

No iniciar retiros hasta disponer de:

- SHA auditado y matriz maestra;
- hallazgos críticos estabilizados o explícitamente bloqueados;
- inventario de puntos de entrada y backend;
- resultados de pruebas relevantes;
- acceso de solo lectura a PR, ramas, workflows y despliegues.

Durante la auditoría se pueden identificar candidatos, pero no borrarlos ni combinarlos.

## Grafo de uso del código

Trazar referencias desde:

- HTML de entrada, scripts y estilos;
- router, sidebars, menús inyectados y rutas profundas;
- `F96_LAZY`, loaders, imports y bundles;
- asignaciones y lecturas de globals de `window`;
- registros, callbacks, eventos y selectores DOM;
- endpoints frontend, dispatcher Apps Script y helpers;
- tests, scripts, workflows y pasos de publicación;
- documentos operativos que ejecutan o entregan un artefacto.

Las búsquedas textuales son señales, no prueba de ausencia. Considerar nombres construidos, carga dinámica y reemplazos por orden de ejecución.

## Clasificación de archivos y símbolos

- `CANÓNICO_ACTIVO`: implementación usada y fuente actual.
- `COMPATIBILIDAD`: wrapper o alias requerido por contrato vigente.
- `SUPERPUESTO`: definición reemplazada en el orden de carga, con posible efecto lateral.
- `GENERADO_VENDOR`: artefacto generado o tercero; se gestiona por su fuente.
- `CANDIDATO_A_FUSIÓN`: lógica equivalente con diferencias que deben resolverse.
- `CANDIDATO_A_RETIRO`: sin referencia conocida y con reemplazo probado.
- `INDETERMINADO`: carga o dependencia dinámica todavía no explicada.

No usar número de versión, tamaño o edad como clasificación automática.

## Prueba de equivalencia

Antes de proponer reemplazo o retiro:

1. documentar contratos públicos y efectos laterales;
2. comparar rutas, parámetros, valores por defecto, errores y permisos;
3. comprobar orden de carga y consumidores indirectos;
4. ejecutar pruebas existentes y añadir la regresión necesaria en la fase de corrección;
5. recorrer las filas afectadas de la matriz;
6. verificar caché, build, Pages y backend cuando aplique;
7. definir reversión y ref que conserva la versión anterior.

“Se parece” o “la versión nueva tiene mayor sufijo” no demuestra equivalencia.

## Workflows

Inventariar nombre, trigger, permisos, secretos, rutas, artifacts, entorno y último uso. Distinguir:

- validación vigente;
- despliegue vigente;
- job histórico reproducible;
- duplicado parcial;
- workflow roto pero todavía referenciado;
- candidato a archivo o retiro.

Consolidar permisos y triggers requiere revisar eventos de PR/fork y acceso a secretos. Un workflow deshabilitado puede seguir documentando un procedimiento de recuperación.

## Ramas y PR

Para cada rama calcular o registrar:

- head SHA, merge-base y distancia contra la base;
- PR asociado, estado, reviews y checks;
- commits únicos y cambios equivalentes mediante comparación de parche;
- archivos sensibles y migraciones;
- workflow o despliegue asociado;
- última actividad y responsable, solo como contexto;
- rama/tag/commit que preservaría la recuperación.

Clasificar según el supervisor. Una rama fusionada por squash puede no ser ancestro; comprobar equivalencia de contenido. Una rama con PR cerrado puede contener trabajo no preservado.

## Plan de consolidación

Preparar lotes pequeños por causa:

1. inventario y pruebas de caracterización;
2. elección explícita de implementación canónica;
3. migración de consumidores;
4. eliminación de compatibilidad solo después de observar que no tiene lectores;
5. limpieza de assets, documentos o workflows en PR separado;
6. nueva auditoría de rutas y despliegue.

No mezclar lógica financiera/académica con una limpieza masiva. No optimizar por cantidad de archivos eliminados.

## Manifiestos de salida

### Código

`objeto → clasificación → referencias → reemplazo → contratos → pruebas → riesgo → reversión → decisión pendiente`

### Rama/PR

`rama → head → base → PR → commits únicos → equivalencia → deploy/workflow → respaldo → disposición → aprobación`

### Workflow

`archivo → triggers → permisos → secretos → consumidor → solapamiento → disposición`

## Puerta de borrado

Un objeto solo puede llegar a `CANDIDATO_A_RETIRO` cuando:

- su identidad exacta está resuelta;
- no conserva comportamiento o historia única necesaria;
- el reemplazo canónico está fusionado y probado;
- no sostiene despliegue, workflow, ruta o recuperación;
- existe respaldo identificable;
- se definió validación posterior;
- el usuario aprobó expresamente la lista exacta.

El agente entrega el manifiesto y se detiene. El borrado es una tarea separada.

## Criterios de finalización

- Todo candidato tiene grafo de referencias y evidencia de reemplazo.
- Lo indeterminado permanece conservado.
- Los lotes propuestos son reversibles y tienen pruebas.
- Ramas, PR, workflows y código se tratan como inventarios relacionados, no como listas aisladas.
- No se ejecutó ningún borrado o fusión automática.
