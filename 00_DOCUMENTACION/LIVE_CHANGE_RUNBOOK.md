# CAMPUS VIRTUAL · Runbook de cambios en vivo

Objetivo: que una corrección ordinaria no obligue a redescubrir arquitectura, deployment, versión ni procedimiento de rollback.

## 0. Antes de tocar código

1. Leer `AGENTS.md`.
2. Leer `00_DOCUMENTACION/PRODUCTION_STATE.md`.
3. Consultar GitHub y confirmar el SHA actual de `main`.
4. Clasificar el cambio:
   - **frontend**: HTML/JSX/JS/CSS que se entrega al navegador;
   - **backend Apps Script**: endpoint/helper/hoja/Drive;
   - **mixto**: contrato compartido entre frontend y backend;
   - **datos/configuración**: Sheets/Drive/catálogos sin cambio de código.
5. Identificar el flujo exacto: `pantalla → archivo frontend → llamada → endpoint/helper → hoja/Drive`.
6. Abrir una rama pequeña. Nunca trabajar directo en `main`.

## 1. Regla de alcance

Un hotfix debe declarar antes de editar:

- escenario observado;
- resultado esperado;
- archivos que se espera modificar;
- datos que **no** deben modificarse;
- evidencia mínima para aprobarlo;
- rollback previsto.

Si durante la ejecución aparecen archivos adicionales no previstos, el cambio se detiene y se revisa el alcance.

## 2. Frontend

Para un cambio exclusivamente visual o de lógica en navegador:

1. trabajar desde `main` vigente;
2. modificar solo el módulo dueño del comportamiento;
3. ejecutar las validaciones existentes del repositorio y las específicas del módulo;
4. comprobar consola, carga inicial, navegación y permisos del rol afectado;
5. preparar PR draft;
6. probar el candidato en QA/staging cuando exista;
7. solo después de aprobación humana, consolidar/publicar por el mecanismo productivo vigente.

No asumir que una validación sintética demuestra el comportamiento del backend desplegado.

## 3. Backend Apps Script

### Identidad productiva

La identidad se toma de `config/apps-script-production.json` y se confirma contra `clasp list-deployments` antes de cualquier escritura.

No se considera productivo el HEAD de Apps Script. Producción es el **Deployment ID estable apuntando a una versión numérica inmutable**.

### Flujo obligatorio

1. verificar sesión `clasp` y versión de CLI;
2. confirmar Script ID y Deployment ID exactos;
3. confirmar que la versión remota actual coincide con el estado registrado;
4. clonar y respaldar:
   - HEAD remoto actual;
   - versión realmente desplegada;
5. construir el candidato partiendo de la versión desplegada o de una fuente cuya paridad haya sido demostrada;
6. comparar candidato vs base y listar todos los archivos cambiados;
7. abortar si el alcance excede lo declarado;
8. validar UTF-8 y sintaxis antes de `push`;
9. hacer `push` solo del candidato verificado;
10. crear una nueva versión numérica;
11. actualizar el **mismo Deployment ID**;
12. clonar la nueva versión y verificarla remotamente;
13. restaurar HEAD remoto no publicado exactamente como estaba;
14. confirmar que restaurar HEAD no movió el deployment;
15. ejecutar prueba funcional real del flujo modificado;
16. actualizar `PRODUCTION_STATE.md` y `config/apps-script-production.json`.

### Rollback

Si algo falla después de iniciar el `push`:

- releer el deployment actual;
- si cambió, devolverlo a la versión anterior;
- restaurar HEAD desde el backup previo;
- volver a clonar ambos estados y verificar;
- no reintentar hasta comprender la causa.

## 4. Cambios mixtos: contratos frontend ↔ backend

Los valores compartidos no deben mantenerse como enums aislados sin una prueba de compatibilidad.

Ejemplo confirmado que motivó esta infraestructura:

- frontend guardaba `LAPTOP_360` / `LAPTOP_319`;
- backend reconocía únicamente aliases legacy `PREMIUM` / `BASICO`;
- la UI mostraba equipo válido pero el backend lo rechazaba.

Para todo cambio de enum/estado/tipo de producto/rol/ruta se debe revisar al menos:

- productor del valor;
- persistencia;
- lector frontend;
- lector backend;
- validadores;
- pruebas existentes;
- compatibilidad con valores históricos.

## 5. Evidencia mínima de cierre

Un cambio no se declara cerrado solo porque compiló o porque el código se ve correcto. Registrar:

- rama y commit;
- PR;
- archivos cambiados;
- pruebas estáticas;
- pruebas sintéticas;
- prueba autenticada, si aplica;
- versión backend desplegada, si aplica;
- prueba funcional real;
- rollback disponible;
- estado final de producción.

## 6. Cambios rápidos futuros

Cuando se solicite una modificación en vivo, la secuencia operativa debe ser:

`captura/requisito → mapa del flujo → rama → delta mínimo → validación → QA → aprobación → deploy controlado → prueba real → registro de estado`.

La meta es que Script IDs, deployments, versiones, archivos dueños y pasos de recuperación ya estén documentados y no se redescubran en cada corrección.
