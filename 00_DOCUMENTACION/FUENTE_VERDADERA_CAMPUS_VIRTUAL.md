# FUENTE VERDADERA — F98.4-Z6-CS21A61

Estado canónico: frontend CS21A61 guardado en GitHub `main`; backend completo CS21A60 preservado en el archivo canónico de Drive; producción no verificada.

## Hotfix CS21A61 — arranque estable de Recursos Didácticos

Síntoma confirmado en superadmin: `No se pudo cargar Recursos Didácticos.`

Causa real:

- `AdminResourcesMirror` se renderizaba antes de que el módulo diferido `src/syllabus_views.jsx` estuviera cargado.
- En ese instante `window.__AN_CS21A59_TEACHER_MATERIALS_BASE__` todavía no existía y CS21A59 mostraba un error definitivo.
- No era un error del libro, del manifiesto WebP ni del backend CS21A60.

Corrección:

- `src/admin_resources_runtime_cs21a61.jsx` envuelve la capa administrativa CS21A59.
- Cuando Recursos Didácticos se abre, carga explícitamente `src/syllabus_views.jsx?v=F98.4Z6G` mediante `window.anLazyCampus`.
- Espera a que CS21A59 y CS21A60 terminen de encadenar `MaterialesView`.
- Mientras carga muestra `Preparando biblioteca…`.
- Si la dependencia falla, muestra el motivo real y un botón `Reintentar`.
- Evita que CS21A59 vuelva a envolver el hotfix y restablezca el error prematuro.

Este cambio es exclusivamente frontend. No requiere modificar ni volver a copiar `Code.gs`.

## Cambio preservado CS21A60 — inicios U01–U16 persistentes

- Cada libro conserva su propio arreglo `unitStarts` dentro de su `book.json`.
- La configuración es independiente por nivel y tipo: B1/B2/I1/I2 × SB/TB/WB.
- Solo `superadmin` puede modificar un inicio.
- El superadmin navega al pliego correcto y usa el botón pequeño `Actualizar` debajo de U01–U16.
- Se guarda la hoja derecha visible del pliego. Ejemplo: si se observan las hojas 7–8, se guarda 8.
- Docentes, administradores y estudiantes reciben el mapa actualizado en la siguiente carga.
- Al abrir un libro, el visor se posiciona en U01 cuando existe configuración.
- SB conserva temporalmente el mapa anterior como fallback hasta que el libro sea calibrado.
- TB y WB quedan sin inicio inventado hasta que el superadmin los configure.

## Accesos

- Superadmin: ve Recursos Didácticos, puede navegar y guardar U01–U16.
- Admin: ve Recursos Didácticos y puede actualizar el listado de imágenes desde Drive; no puede cambiar unidades.
- Docente: consulta SB/TB/WB sin controles administrativos.
- Estudiante: consulta SB/WB de su nivel activo; no ve controles de actualización.

## Validaciones backend preservadas

Endpoint: `superadminBooksSetUnitStart`.

- Requiere rol exacto `superadmin` en backend.
- Verifica que la hoja exista en el `book.json` abierto.
- Rechaza una misma hoja asignada a dos unidades.
- Rechaza un orden incoherente respecto a las unidades anterior y siguiente.
- Usa bloqueo para evitar escrituras simultáneas.
- Registra historial de cambios dentro del manifiesto.
- Invalida únicamente la caché del libro modificado.

`adminBooksRefreshOpenBook` se conserva y no elimina `unitStarts`.

## Frontend vigente

- `src/teacher_cs21a_order_fix.jsx`: base visual preservada CS21A58.
- `src/admin_resources_cs21a59.jsx`: panel administrativo preservado.
- `src/admin_resources_superadmin_cs21a60.jsx`: acceso real de superadmin al panel.
- `src/book_unit_starts_cs21a60.jsx`: visor compartido y calibración U01–U16.
- `src/admin_resources_runtime_cs21a61.jsx`: carga diferida estable del panel.
- `campus.html`: carga CS21A61 después de CS21A60.

## Backend canónico preservado

- Versión: F98.4-Z6-CS21A60.
- Archivo Drive: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Tamaño: `2.915.832` bytes.
- Saltos de línea: `51.143`.
- SHA-256: `1ae938995f99407e2914f406346edcf7e64d2517c6dd0869db14b14730947a56`.
- Respaldo previo CS21A59: `1kekb73zQj4Wy9KdhgaiiannLJhBH6tmy`.
- Copia de cierre CS21A60: `1bTuQcVrHkdWUV3HqFBWLddLfRiayB33U`.

## Reglas preservadas

- No mover pagos entre niveles o intentos.
- No modificar pagos, certificados, CONAPE, calendario ni hojas académicas.
- No crear triggers nuevos de CONAPE.
- Guardado no significa desplegado ni probado en producción.
