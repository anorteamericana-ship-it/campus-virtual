# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A60

## Estado

- Frontend guardado en `main`: CS21A60.
- Backend completo canónico en Drive: CS21A60.
- Base preservada: CS21A59 / CS21A58 / CS21A56 / CS21A46.
- Producción no verificada.

## Cambio funcional

El superadmin puede establecer el arranque oficial de U01–U16 para cada libro desde la misma vista utilizada por docentes.

El flujo no modifica código en cada clic. Cambia el `book.json` del libro abierto:

- `unitStarts[0]` corresponde a U01.
- `unitStarts[15]` corresponde a U16.
- Cada nivel y tipo de libro conserva un arreglo independiente.
- Docentes y estudiantes reciben ese arreglo al cargar el manifiesto.

## Regla del pliego

El visor trabaja por pares en el orden de `pages[]`.

- 0+1, 2+3, 4+5, etc.
- Al pulsar `Actualizar`, se guarda la hoja derecha visible.
- Si el pliego muestra 7–8, U01 queda configurada con fuente 8.
- Al volver a abrir U01, el algoritmo encuentra la hoja 8 y reconstruye el mismo par 7–8.

## Interfaz

- Debajo de cada botón U01–U16 existe un botón pequeño `Actualizar` solo para superadmin.
- El libro inicia en U01 cuando hay configuración.
- El mensaje confirma nivel, tipo, unidad y hoja guardada.
- Docentes y estudiantes no ven botones de escritura.

## Separación por libro

No compartir el mapa entre SB, TB y WB.

Configuraciones independientes:

- B1/SB, B1/TB, B1/WB.
- B2/SB, B2/TB, B2/WB.
- I1/SB, I1/TB, I1/WB.
- I2/SB, I2/TB, I2/WB.

SB conserva valores históricos como fallback. TB/WB permanecen sin inicio hasta calibración, para no inventar páginas.

## Backend

Endpoint: `superadminBooksSetUnitStart`.

Controles:

- Sesión válida y rol exacto superadmin.
- Unidad entera 1–16.
- Página fuente entera y existente.
- Sin duplicados.
- Orden ascendente entre unidades.
- Bloqueo de escritura.
- Historial limitado a 100 cambios.
- Caché invalidada solo para el libro afectado.

`adminBooksRefreshOpenBook` reconstruye `pages[]` sin borrar `unitStarts` ni el historial.

## Archivos

- `src/admin_resources_superadmin_cs21a60.jsx`.
- `src/book_unit_starts_cs21a60.jsx`.
- `campus.html`.
- `Code.gs` canónico CS21A60.

## Integridad

- Tamaño backend: `2.915.832` bytes.
- SHA-256: `1ae938995f99407e2914f406346edcf7e64d2517c6dd0869db14b14730947a56`.
- Saltos de línea: `51.143`.
- Respaldo previo: `1kekb73zQj4Wy9KdhgaiiannLJhBH6tmy`.
- Copia de cierre: `1bTuQcVrHkdWUV3HqFBWLddLfRiayB33U`.

## Reglas preservadas

- No mover pagos entre niveles o intentos.
- No modificar pagos, certificados, CONAPE, calendario ni hojas académicas.
- No crear triggers nuevos de CONAPE.
- Guardar archivos no equivale a desplegar producción.
