# English LAB · entrada canónica y recuperación de acceso CS21A193

Fecha del incidente autenticado: 2026-08-10

Sala observada: `LAB-4632`

Estado: **candidato QA frontend; QA autenticada pendiente**

## Resultado que bloqueó CS21A192

La prueba real no llegó al juego:

- Naty vio `English LAB Live no cargó el adaptador autoritativo CS21A192` al intentar abrir la entrada por código.
- Chu vio `English LAB no disponible` con `signal is aborted without reason` durante la comprobación de acceso.
- El docente conservó la sala creada con 0 participantes. No estaba esperando respuestas del juego: ninguno de los estudiantes había completado el ingreso.

Esto es un **FAIL autenticado de entrada**. Los 17 checks sintéticos de CS21A192 y el verificador Apps Script `CS21A192-MM-CONSISTENCY-2` no cubrían el recorrido real `campus.html → English LAB → Ingresar con código` y no sustituyen esta evidencia.

## Causa técnica confirmada y límite del diagnóstico

CS21A192 mantenía más de un dueño de carga para English LAB Live:

1. `src/app.jsx` declaraba una lista lazy histórica.
2. `src/english_lab_free_access_cs21a66.js` solicitaba directamente otra URL de `english_lab_live.jsx` con un epoch diferente.
3. Los guards de producto, estudiante, Memory Match clásico y sincronización autoritativa envolvían `loadOne`/`loadMany` en momentos distintos.
4. Las mismas dependencias podían solicitarse mediante URLs versionadas diferentes. El loader las consideraba recursos distintos y podía reinstalar adaptadores en otro orden.
5. El guard CS21A192 comprobaba la compatibilidad inmediatamente después de esa composición y mostraba el error visto por Naty cuando el componente global no terminaba apuntando al adaptador autoritativo.

En el caso de Chu está confirmado el defecto de clasificación y recuperación del frontend: el timeout de `AbortController` se publicaba con el texto nativo del navegador y se convertía en una pantalla de “no disponible”, equivalente visualmente a una denegación. Además, un estado no confirmado podía permanecer almacenado como si fuera concluyente. La captura por sí sola no permite decidir si el aborto original nació en la red, la latencia o el endpoint de acceso; CS21A193 corrige la respuesta del cliente ante cualquiera de esos fallos sin autorizar acceso localmente.

## Corrección CS21A193

### Un solo dueño y un solo manifiesto

`src/english_lab_live_canonical_loader_cs21a193.js` se instala inmediatamente después de `lazy_loader.jsx`, antes de cualquier guard de English LAB. Captura el loader base y publica un manifiesto inmutable de 12 dependencias, todas con `?v=CS21A193`:

1. runtime del juego;
2. motor Memory Match;
3. descubrimiento compartido;
4. guard de sincronización Live;
5. adaptador base Memory Match;
6. registro de juegos;
7. motor Ahorcado;
8. vista Live de Ahorcado;
9. motor Memory Match clásico;
10. adaptador clásico;
11. adaptador autoritativo CS21A192;
12. vistas English LAB Live.

El orden obligatorio de `campus.html` es:

```text
lazy_loader
canonical_loader_cs21a193
product_guard
classic_sync_guard
timeout_style_guard
authoritative_sync_guard
student_dependency_guard
app
```

Los guards históricos conservan sus comprobaciones, pero delegan la carga al dueño canónico cuando CS21A193 existe. `src/app.jsx` usa exactamente el manifiesto publicado y la entrada libre solicita la vista por la API canónica; ya no introduce otra URL de Live.

El cargador base entrega el control al dueño canónico de forma síncrona inmediatamente después de publicar `window.anLazyCampus`. Esto cierra la carrera entre los scripts normales y la compilación `text/babel`: una ruta docente inmediata ya no puede adelantarse al siguiente intervalo de instalación.

El paquete escribe `index.html` como alias byte por byte de `campus.html`. Así tanto la entrada explícita al Campus como la raíz del servidor cargan el mismo orden CS21A193. La evidencia automática heredada de candidatos anteriores se elimina del paquete; la evidencia nueva queda separada como artefacto de CI.

### Fallo transitorio honesto

`src/english_lab_free_access_cs21a66.js` distingue tres resultados:

- acceso permitido y confirmado;
- denegación concluyente informada por el backend;
- comprobación transitoria no confirmada por timeout, aborto, red o respuesta incompleta.

Solo los dos primeros pueden almacenarse como respuesta concluyente. El tercero muestra un mensaje recuperable, conserva `Verificar de nuevo` y no se guarda como denegación. El backend sigue siendo la única autoridad para permitir o negar el acceso.

Cada comprobación también queda ligada a la firma de la sesión y a una generación de solicitud. Si cambia el usuario mientras una respuesta anterior sigue en vuelo, esa respuesta se descarta y no puede autorizar ni sobrescribir el estado de la sesión nueva.

## Alcance y límites

- CS21A193 cambia únicamente frontend, pruebas, empaquetado y documentación.
- El backend permanece exactamente en `CS21A192-MM-CONSISTENCY-2`.
- **No se debe modificar Apps Script, crear otra versión del deployment ni cambiar la URL `/exec`.**
- `main`, producción y el deployment productivo quedan fuera de alcance.
- Las pruebas sintéticas verifican composición, recuperación y regresiones; el estado seguirá siendo candidato hasta repetir la entrada autenticada con docente, Chu y Naty.

## Archivos de implementación

- `campus.html`
- `src/lazy_loader.jsx`
- `src/english_lab_live_canonical_loader_cs21a193.js`
- `src/app.jsx`
- `src/english_lab_free_access_cs21a66.js`
- `src/english_lab_games/english_lab_hangman_live_cs21a191.jsx`
- `src/english_lab_live_product_guard_cs21a187.js`
- `src/english_lab_live_classic_sync_guard_cs21a189.js`
- `src/english_lab_live_timeout_style_guard_cs21a190.js`
- `src/english_lab_live_authoritative_sync_guard_cs21a192.js`
- `src/english_lab_live_student_dependency_guard_cs21a184.js`

Archivos de reconstrucción y entrega:

- `scripts/audit_qa_staging_frontend_cs21a148.mjs`: evalúa F96 usando el manifiesto CS21A193 sin duplicarlo en `app.jsx`.
- `scripts/build_qa_package_cs21a180.mjs`: normaliza únicamente el artefacto intermedio CS21A180 a su lista histórica para mantener reconstruible la cadena acumulada.
- `scripts/patch_qa_package_cs21a193.mjs`: parte del paquete CS21A192 REV2 verificado, elimina artefactos de entrega/evidencia heredados, copia el frontend corregido y construye el manifiesto completo.
- `.github/workflows/cs21a193-english-lab-live-entry.yml`: reconstruye 148→193, sirve el paquete exacto, ejecuta la cobertura y publica carpeta, ZIP, hash y evidencia separada.

## Cobertura automática obligatoria

- `scripts/test_english_lab_canonical_loader_browser_cs21a193.mjs`: reproduce la mezcla legacy, fuerza el orden canónico-antes-del-lazy con temporizadores retenidos y luego exige un solo manifiesto/epoch, un solo dueño autoritativo, cero errores de página y las vistas Live publicadas en el harness canónico.
- `scripts/test_english_lab_package_entry_browser_cs21a193.mjs`: abre el `campus.html` exacto servido, navega el menú como estudiante móvil y docente de escritorio y valida las dos rutas reales hasta English LAB Live.
- `scripts/test_english_lab_access_transient_retry_cs21a193.mjs`: fuerza un timeout transitorio, comprueba el mensaje recuperable, reintenta, exige acceso posterior sin caché negativa y rechaza una respuesta tardía perteneciente a otra sesión.
- `scripts/test_english_lab_access_cs21a144.js`: conserva las reglas de acceso y añade los contratos de recuperación CS21A193.
- `scripts/test_english_lab_student_live_dependencies_cs21a184.mjs`: conserva la entrada estudiantil histórica y exige que delegue en el dueño canónico cuando está presente.
- Regresiones CS21A192 de sincronización, deadline, recuperación de polling y cierre terminal.
- Regresiones CS21A191 de Ahorcado y CS21A189/190 de Memory Match clásico.
- Reconstrucción completa del paquete 148 → 183 → 187 → 189 → 190 → 191 finalize → 192 REV2 → 193.
- Servicio del paquete exacto en `127.0.0.1:4193`, comprobación de rutas, orden, epochs y manifiesto SHA-256 completo.

Estas pruebas no acceden a sesiones reales ni certifican el deployment QA.

## Aceptación autenticada mínima

Usar una sala nueva B1/U01, 6 parejas, Individual:

| ID | Escenario | PASS obligatorio |
|---|---|---|
| EL193-01 | Naty abre English LAB y pulsa `Ingresar con código`. | Llega a la entrada Live; no aparece el error del adaptador CS21A192. |
| EL193-02 | Chu sufre un fallo transitorio durante la comprobación. | Ve un mensaje de conexión/tiempo recuperable y `Verificar de nuevo`; no una denegación financiera. |
| EL193-03 | Chu reintenta con backend disponible. | Llega a la entrada Live; el fallo anterior no queda cacheado. |
| EL193-04 | Chu y Naty ingresan el código antes de iniciar. | El control docente muestra exactamente 2 participantes. |
| EL193-05 | El docente inicia Memory Match. | Los tres cargan el tablero y coinciden en turno, jugador, reloj, cartas y parejas. |
| EL193-06 | Entrada desktop y móvil. | 1440×900 y 390×844 son utilizables, sin pantalla en blanco, error de consola ni desborde horizontal. |
| EL193-07 | Regresión Ahorcado. | La selección, entrada y ronda Live de Ahorcado conservan el contrato CS21A191. |

## Veredicto de entrega

El artefacto puede llamarse **candidato QA** únicamente cuando CI reconstruya y verifique el paquete exacto. Solo un PASS de `EL193-01` a `EL193-07` permite cerrar el bloqueo funcional. No autoriza merge ni producción automáticamente.
