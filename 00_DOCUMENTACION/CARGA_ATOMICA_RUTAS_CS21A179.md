# CS21A179 · Carga atómica de rutas canónicas

Fecha: 5 de agosto de 2026

Base funcional: CS21A178 / PR apilado sobre #49

Alcance: frontend QA; Estudiante, Docente y Superadmin

Producción, `main`, Apps Script, hojas y Drive operativo: sin cambios

## Defecto confirmado

Al abrir **Mi Perfil** del docente aparecía primero una pantalla histórica de `student_modules.jsx` y después la pantalla canónica `teacher_profile_cs21a76.jsx`.

No era un estado de datos incompletos. Dos implementaciones competían por `window.PerfilView`:

1. `student_modules.jsx` publicaba la implementación base;
2. `teacher_profile_cs21a76.jsx` esperaba el evento `an:lazy-module-loaded`;
3. treinta milisegundos después envolvía el global con `PerfilViewCS21A76`;
4. `LazyModuleView` permitía renderizar la base inmediatamente al terminar `loadMany`;
5. un render posterior tomaba el global reemplazado y mostraba la vista correcta.

La misma autoridad incompleta afectaba otras rutas con instaladores tardíos: Perfil, English LAB, English LAB Live, Grupos de administración y Cronograma. Además, `LazyModuleView` podía conservar durante un render el estado de la ruta anterior cuando cambiaban sus propiedades.

## Corrección

### Montaje atómico común

`src/lazy_loader.jsx` ahora:

- identifica cada transición mediante una clave de ruta;
- muestra únicamente un estado neutro mientras carga;
- espera el contrato final de los componentes con instaladores canónicos;
- exige que la función final permanezca estable antes de comprometerla;
- fija la función resuelta en el estado de React y no vuelve a consultar un global mutable durante el render;
- expone `anLazyCampus.resolveRoute(files, component)` para rutas diferidas externas;
- emite `an:lazy-route-committed` únicamente cuando la autoridad final está lista.

Los contratos explícitos cubren:

- `PerfilView` → `__cs21a76TeacherProfile`;
- `AcademiaPlayView` y `EnglishLabLiveStudentView` → `__cs21a144AccessGate`;
- `AdminGruposView` → `__cs21a20AperturasWrapper`;
- `CronogramaGrupo` → `__a77`;
- `ICANViewNew` y `ClubICANDocenteView` → `__cs21a122`;
- `MaterialesView` / `StudentCourseView` → componente reutilizable canónico de libros.

### Retiro de la pantalla docente histórica

`src/student_modules.jsx` vuelve a ser exclusivamente estudiantil. Se retiraron:

- `Información profesional del docente`;
- `Documentos del docente`;
- botones históricos Curriculum / Aval INA;
- bifurcaciones `esTeacherPerfil`.

La única pantalla docente entregable queda en `teacher_profile_cs21a76.jsx`. Si su contrato no está listo, el cargador no cae hacia la vista estudiantil: mantiene un estado honesto y termina en error recuperable.

### Perfil estudiantil

El barrido descubrió una segunda regresión real: la ruta personalizada de Perfil cargaba `student_modules.jsx` sin cargar antes `solicitudes_unificadas.jsx`, aunque `PerfilContenido` usa `ReposicionStudentCardF92`.

Se corrigió la lista para cargar, en orden:

1. `panel_suspensiones.jsx`;
2. `solicitudes_pago.jsx`;
3. `solicitudes_unificadas.jsx`;
4. `student_modules.jsx`.

La ruta personalizada ahora consume `anLazyCampus.resolveRoute` y fija el componente resuelto, igual que el router principal.

## Caché

Se actualizaron las claves públicas de:

- `src/lazy_loader.jsx` → CS21A179;
- `src/student_menu_academic_cs21a120.jsx` → CS21A179;
- `src/student_modules.jsx` en todas las entradas de `F96_LAZY` → CS21A179.

## Evidencia ejecutada

### Prueba determinista de carrera

`scripts/test_atomic_lazy_routes_cs21a179.mjs` simula:

- publicación de una vista histórica;
- sustitución canónica 30 ms después;
- cambio inmediato de menú;
- reemplazo tardío del global después del compromiso.

Resultado: el componente histórico nunca se renderiza, la ruta anterior no reaparece y la función canónica queda fijada.

### Navegador sintético sin backend real

`scripts/test_atomic_route_loading_browser_cs21a179.mjs`:

- retrasa `student_modules.jsx` para ampliar la carrera observada;
- intercepta todas las llamadas a Apps Script y responde localmente;
- no usa credenciales reales ni ejecuta escrituras;
- recorre 52 opciones visibles: 15 Docente, 16 Estudiante y 21 Superadmin;
- confirma cero `pageerror`;
- comprueba que nunca aparece la pantalla docente histórica;
- valida Perfil canónico en 1440×900 y 390×844;
- comprueba que no existe desbordamiento horizontal material en móvil.

Resultado: **APTO sintéticamente**.

### Regresión existente

También pasan las pruebas estáticas y contractuales previas de rutas, materiales, libros, seguridad de entrega, runtime QA, Memory Match y superficie publicada.

## Límite de la evidencia

La prueba sintética demuestra el orden de carga, el componente montado y la navegación visible. No demuestra permisos reales de Drive, datos reales ni el backend desplegado. La aceptación humana debe ejecutarse en el paquete QA con cuentas controladas, sin tocar producción.

## Veredicto

**APTO CON RESERVAS PARA QA AUTENTICADA.**

No autoriza merge, producción ni cambios de Apps Script. El paquete debe llamarse candidato hasta que el usuario confirme visualmente que la vista histórica ya no aparece al alternar menús y recargar.
