# FUENTE VERDADERA — F98.4-Z6-CS21A64

Estado canónico: frontend CS21A64 guardado en GitHub `main`; backend completo CS21A64 guardado en el archivo canónico de Drive; producción no verificada.

## Cambio CS21A64 — propagación opcional por clics de Siguiente

Al pulsar el botón pequeño `Actualizar` debajo de U01–U15, el superadmin recibe una pregunta antes de guardar:

- `Cancelar` en la primera pregunta guarda únicamente la unidad seleccionada.
- `Aceptar` solicita cuántos clics del botón `Siguiente` deben separar cada unidad posterior.
- Cada clic equivale a dos posiciones de página del visor.
- Ejemplo: U01=27 con 4 clics produce U02=35, U03=43 y continúa hasta U16.
- Ejemplo: U01=27 con 3 clics produce U02=33, U03=39 y continúa hasta U16.
- Si se inicia desde U05, U01–U04 permanecen intactas y se recalcula U05–U16.
- U16 conserva el guardado individual porque no tiene una unidad posterior.

La propagación usa el orden real de `book.json.pages`, no una suma ciega. El backend calcula todas las unidades, valida existencia, duplicados y orden ascendente, y solo entonces escribe una vez el `book.json`. Si alguna unidad excede las hojas disponibles, no se guarda ningún cambio.

Frontend nuevo: `src/book_unit_propagation_cs21a64.js`.

Backend:

- El endpoint preservado `superadminBooksSetUnitStart` acepta opcionalmente `propagate_following=true` y `clicks_between_units`.
- Sin esos campos mantiene exactamente el guardado individual CS21A60.
- Solo `superadmin` puede usar la operación.
- Cada unidad modificada queda registrada en `unitStartHistory`, con máximo de 100 entradas.
- Se invalida únicamente la caché del libro abierto.

## Cambio preservado CS21A63 — audios compactos

- Usa `getBibliotecaNivelEstudiante` y `getAudioPistaEstudiante`.
- Filtra las pistas `.mp3` por el nombre real `Unit 01` a `Unit 16`.
- Se monta al lado de B1/B2/I1/I2 con combo y reproductor pequeños.
- No cambia la estructura ni las posiciones del visor.

Archivo: `src/book_inline_audio_cs21a63.js`.

## Cambios preservados CS21A62 / CS21A61 / CS21A60

- CS21A62: efecto 3D de paso de hoja en Anterior, Siguiente y U01–U16.
- CS21A61: carga estable de Recursos Didácticos y botón Reintentar.
- CS21A60: `book.json.unitStarts`, calibración independiente B1/B2/I1/I2 × SB/TB/WB y permisos por rol.

## Frontend vigente

- `src/teacher_cs21a_order_fix.jsx`.
- `src/admin_resources_cs21a59.jsx`.
- `src/admin_resources_superadmin_cs21a60.jsx`.
- `src/book_unit_starts_cs21a60.jsx`.
- `src/admin_resources_runtime_cs21a61.jsx`.
- `src/book_page_turn_cs21a62.js`.
- `src/book_inline_audio_cs21a63.js`.
- `src/book_unit_propagation_cs21a64.js`.
- `campus.html`.

## Backend canónico CS21A64

- Archivo Drive: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Tamaño: `2.923.949` bytes.
- Saltos de línea: `51.362`.
- SHA-256: `d5217ceb90a4716c9161284a81c242a238649ed034bb97a36657716c6593feda`.
- Respaldo previo: `1-AbtbfF3tH04eOl33w7mD2k_L7hPhCG1`.
- Copia de cierre: `1GOKIBd7Z6zabkj8ElQHIIbTQ_Y9wa4DL`.

## Reglas preservadas

- No mover pagos entre niveles o intentos.
- No modificar pagos, certificados, CONAPE, calendario ni hojas académicas.
- No crear triggers nuevos de CONAPE.
- Guardado no significa instalado, desplegado ni probado en producción.
