# Juegos fase 1 · English LAB (Academia Play)

Rama `juegos_fase1` desde `main` `a9b556f1`. Solo frontend (`src/academia_play.jsx`, `styles/academia_play.css` y cache-bust en `src/app.jsx` y `campus.html`). No toca Apps Script, hojas ni backend. Sin deploy.

## Qué cambia

1. **Opciones mezcladas.** `APChoiceRunner` arma un mazo por intento con Fisher-Yates (`apShuffle`) y recalcula el índice correcto por posición original (`apShuffleChoiceQuestion`). El mazo se fija al montar el runner y se rehace en "Repetir juego" o al volver a entrar; los re-render no lo cambian (`apUseAttemptDeck`). Es el único runner con `options/correct`.
2. **Fichas de ordenar mezcladas.** `APOrderRunner` usa el mismo mecanismo (`apShuffleOrderQuestion`). Si la mezcla deja las fichas en el orden de la respuesta y hay al menos 2 fichas distintas, se vuelve a mezclar y, como último recurso, se rotan. Cada ficha conserva una clave por posición original, así que las repetidas ("the … the") funcionan.
3. **Pareo.** Se elimina el cálculo fijo de 58 px y el `preserveAspectRatio="none"`. Cada línea se mide con refs + `getBoundingClientRect` contra el propio SVG (del borde derecho del botón en inglés al borde izquierdo de su pareja). Se recalcula con `ResizeObserver` (tablero y botones), `resize`, scroll, carga de fuentes y fin de transiciones. Ambas columnas se mezclan por intento; nunca quedan todas las parejas alineadas fila a fila.
4. **Pasada visual móvil (360 px).** Toques ≥ 44 px, contraste AA (incluye fichas ilegibles del intento incorrecto en Sentence Order), ✓/✗ además del color, animaciones cortas al acertar (se apagan con `prefers-reduced-motion`), resumen sin recortar el nombre del juego, etiqueta real "Ordená la oración" (antes decía "TRADUCÍ").

## Cómo correr

```bash
node scripts/qa_juegos_fase1_unitarias.mjs      # mezcla, fichas, pareo y reporte del banco (sin navegador)
node scripts/qa_juegos_fase1_ui.mjs             # Playwright: capturas 360 px y escritorio, 100 intentos, fichas, pareo en 2+ renglones
node scripts/qa_juegos_fase1_banco_reporte.mjs  # reporte del banco (solo lectura)
```

La prueba de interfaz sirve el repo con un servidor local y monta `qa/juegos_fase1/harness.html`, que carga `src/academia_play.jsx` igual que `src/lazy_loader.jsx`. No hay backend: la URL de Apps Script apunta a una ruta local inexistente y cualquier request a `script.google.com` se aborta y se cuenta (resultado: 0). Workflow: `.github/workflows/qa-juegos-fase1.yml`. Las capturas no se versionan: quedan en la carpeta de salida y, en CI, en el artifact `qa-juegos-fase1-<número de ejecución>`.

## Resultados (E1 sintética local, Chrome, Windows)

- Unitarias: todo OK. 45 preguntas × 100 intentos: la correcta aparece en A, B, C y D en todas. 10 frases de ordenar × 100 intentos (incluye fichas repetidas, fuente ya ordenada y "Costa Rica" como una ficha): nunca en el orden de la respuesta y siempre las mismas fichas.
- Interfaz: **254/254 PASS** (`informe_ui.md`). Vocabulary Sprint real, 100 entradas desde el catálogo: A 28 · B 26 · C 19 · D 27. Banco con todas las correctas en A, 100 intentos con "Repetir juego": las 5 preguntas en las 4 posiciones. Ordenar con banco (4 frases × 20 intentos): nunca resuelta al mostrarse, orden estable dentro del intento y distinto al repetir; con fichas repetidas la respuesta se arma y marca correcta.
- Pareo con textos de 1 a 6 renglones: todas las líneas dentro de ±1.5 px de los bordes reales, también después de redimensionar y hacer scroll.
- Misma suite sobre `main` (antes): 160/213 en capturas; líneas del pareo desalineadas, fichas invisibles en orden incorrecto, botones de 34–41 px, título del resumen recortado. Las capturas del "antes" están en el commit `114a9195` de la rama. La prueba de ordenar sobre ese commit falla: una frase aparece resuelta en los 20 intentos y el orden nunca cambia.

## Reporte del banco

- **Banco local** (`reporte_banco_local.md`): 40 preguntas de opción múltiple, **39 con la correcta en A (98%)** y 1 en B. Ninguna tiene nivel/unidad estructurados (solo texto libre en la tarjeta del juego). Sin preguntas de menos de 4 opciones ni opciones repetidas.
- **Banco de las hojas: pendiente de datos.** Las 4 bases pedagógicas (B1 `1mabas6…`, B2 `1u_xSwy…`, I1 `1vtR9Yn…`, I2 `1vuubVK…`) son privadas y el conector de Drive solo devuelve 3 filas de muestra por pestaña. `ACADEMIA_PLAY_BANK` vive dentro de APOLLO, que tiene datos personales en otras pestañas, así que no se descargó. Hipótesis (E0, muestra de I2):
  - `PLAY_ITEMS` genera la opción A con el significado correcto y B–D con distractores: las 3 filas de muestra tienen `CORRECT_OPTION = A`, igual que las de `CONTENT_LISTENING` y `CONTENT_READING`.
  - `CONTENT_PHRASES` trae `WORDS_TO_ORDER` ya en el orden correcto y `DISTRACTOR_PHRASE_1` igual a la frase objetivo (posibles fichas resueltas y opciones repetidas).
  - Los distractores de vocabulario se repiten en toda la unidad: si una palabra de la unidad es uno de ellos, su pregunta tendría la opción correcta duplicada.

Para cerrarlo: en cada base abrir la pestaña `PLAY_ITEMS` → Archivo → Descargar → CSV (solo la hoja actual), guardar en `anorteam\temporal\juegos_fase1\banco\` y correr:

```bash
node scripts/qa_juegos_fase1_banco_reporte.mjs --csv B1.csv --csv B2.csv --csv I1.csv --csv I2.csv --out reporte_banco_hojas.md --json reporte_banco_hojas.json
```

Para el banco productivo, lo mismo con la pestaña `ACADEMIA_PLAY_BANK` de APOLLO (el CSV exporta solo esa pestaña).

## Fuera de alcance, para fase 2

- `apCorrectIndex` trata una letra vacía o inválida como A, y `apFlowFromBankGame` descarta sin aviso las preguntas con menos de 4 opciones. El reporte lista ambos casos.
- La franja de pregunta muestra "Pregunta X de N" en grande y la consigna en pequeño; el temporizador es fijo (20 s / 12 s). No se tocaron.
