# English LAB · Renovación de shell · CS21A215

Fecha: 2026-08-14  
Estado: **DRAFT / QA · NO MERGE · NO PROD**

## Objetivo

Unificar la experiencia visible de English LAB sin reescribir motores ni perder el banco curricular existente.

CS21A215 introduce tres entradas visibles:

1. **Practicar & Competir** — reutiliza la práctica curricular existente por nivel/unidad/juego.
2. **Jugar en equipos** — organiza los motores grupales actuales y reserva las próximas dinámicas.
3. **Clase en vivo** — reutiliza el shell de clase existente para docente/estudiante.

## Marca

El producto visible se llama únicamente **English LAB**.

Los identificadores técnicos históricos como `AcademiaPlayView`, `academia_play`, `academiaPlayBankCatalog` y `ACADEMIA_PLAY_BANK` se conservan temporalmente como aliases/contratos internos para no romper rutas, banco curricular ni Apps Script. No son marca visible y su migración técnica deberá hacerse en otro corte, con compatibilidad explícita.

## Práctica curricular preservada

Se reutiliza `src/academia_play.jsx` sin reescribir sus motores. Continúan presentes:

- 5 juegos gratuitos;
- 12 templates por unidad;
- B1/B2/I1/I2;
- 16 unidades por nivel;
- `GAME_ID`, `UNIT_ID`, `PLAY_ITEM_ID`;
- `academiaPlayBankCatalog`;
- adaptadores `MATCH`, `ORDER` y `choice`;
- progreso formativo separado de nota oficial.

La evidencia externa auditada de QA Apollo sigue siendo 3.840 actividades: 4 niveles × 16 unidades × 12 juegos × 5 ítems.

## Equipos

CS21A215 organiza, sin reescribir scoring:

- Hangman · motor existente;
- Quiz Time · motor existente;
- Taboo · próximo;
- Categories Battle · próximo;
- Vocabulary Bingo · próximo;
- Conversation Cards · próximo.

Las tarjetas marcadas `Próximamente` no se presentan como implementadas.

## Clase en vivo

Se conserva `EnglishLabUnifiedShellCS21A205` y sus cinco motores en código:

- Memory Match;
- Sentence Order;
- Hangman;
- Quiz Time;
- Word Search.

El hub renovado no ofrece Memory Match compartido como entrada de usuario. Su código se preserva intacto y continúa read-only para ChatGPT según Issue #78. La nueva superficie empieza la clase en Hangman/otro motor no-Memory.

## Arquitectura

`english_lab_live_canonical_loader_cs21a193.js` continúa siendo el owner canónico del stack. CS21A215 añade al final del manifest:

1. práctica curricular existente;
2. estilo del hub CS215;
3. wrapper del hub CS215.

El wrapper captura las vistas de clase existentes y las reutiliza. No crea endpoints, no hace `fetch`, no cambia Apps Script, no modifica timers, sincronización ni código específico de Memory Match.

## Branding guard

El gate CS215 impide que vuelva a aparecer el texto visible histórico de dos palabras en las superficies actuales revisadas. Se permiten identificadores técnicos legacy sin espacio por compatibilidad.

## Archivos de producto del corte

- `src/english_lab_hub_cs21a215.jsx`
- `src/english_lab_hub_style_cs21a215.js`
- `src/english_lab_live_canonical_loader_cs21a193.js`
- `src/english_lab_games/english_lab_unified_shell_cs21a205.jsx` — solo copy visible bajo la marca English LAB.

## QA

Gates del corte:

- no-loss CS21A214;
- renewal shell CS21A215;
- source truth CS21A202;
- scope guard que bloquea cambios Memory/Apps Script/fuera de perímetro.

Pendiente después de CI:

- browser smoke del hub real;
- 390 px;
- estudiante matriculado;
- docente;
- prospecto gratis sigue entrando a práctica English LAB;
- no deployment ni producción en este corte.

## Higiene de CI cruzado

En el head `3a34b7423023fd28334d3dca5178b1e4802e6d42` se auditaron diez checks rojos de cortes anteriores. Ocho compartían un único supuesto congelado: el manifiesto canónico debía contener exactamente las 12 dependencias de CS21A193, aunque la arquitectura acumulativa vigente contiene 28 entradas versionadas. Los otros dos aplicaban los guardas de alcance exclusivos de CS21A207/CS21A208 al diff completo de CS21A215.

La corrección conserva cobertura funcional:

- las 12 rutas base CS21A193 siguen siendo obligatorias, únicas y ordenadas;
- las extensiones posteriores del manifiesto se permiten sólo con epoch `CS21A*` explícito y sin rutas duplicadas;
- el contrato CS205 valida que su shell y sus cinco juegos siguen presentes aunque el loader tenga una versión posterior;
- CS207/CS208 ejecutan sus regresiones funcionales en cortes posteriores, pero sus guardas de perímetro sólo bloquean sus ramas originales;
- el constructor exacto del candidato CS21A193 sólo corre en su rama histórica o por ejecución manual, para no generar un artefacto rotulado CS21A193 desde fuentes CS21A215.
- el preflight autenticado acepta tanto el contrato QA anidado histórico como el contrato plano desplegado (`qa_staging`, `qa_ids_ok`, `qa_properties_configured`, `qa_marker`) y puede ejecutarse con `--preflight-only`, sin sesiones ni escrituras.

No se agregó `continue-on-error`, no se modificó producto para satisfacer literales históricos y no se tocó Apps Script.
