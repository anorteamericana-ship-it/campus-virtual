# Skill · LIVE HOTFIX · Campus Virtual

## Propósito
Resolver defectos pequeños de la página pública **rápido, trazable y sin volver a pedir autorización operativa paso a paso** cuando el usuario diga:

`LIVE HOTFIX: <corrección>`

La autorización aplica únicamente al frontend y está sujeta a las protecciones de GitHub.

## Autorización permanente

Con la frase `LIVE HOTFIX`, ChatGPT puede:

1. consultar `main` y la superficie publicada;
2. identificar el archivo dueño del defecto;
3. crear/reutilizar una rama mínima según exija GitHub;
4. aplicar el delta mínimo;
5. ejecutar/revisar gates pertinentes;
6. abrir PR si el ruleset lo exige;
7. mergear el PR cuando los checks requeridos lo permitan;
8. verificar la página pública;
9. registrar el resultado.

No se requiere una segunda autorización humana para rama → PR → checks → merge cuando el cambio permanece dentro de este alcance.

## Alcance permitido

- texto/ortografía/tildes;
- mojibake o caracteres sustituidos;
- iconos/símbolos;
- HTML/JSX/JS/CSS de navegador;
- enlaces;
- responsive/layout;
- accesibilidad visual simple;
- cache-bust;
- lógica JS pequeña que no modifique permisos, datos ni contratos backend;
- defectos UX evidentes de bajo riesgo.

## Fuera de alcance · RELEASE CONTROLADO

LIVE HOTFIX se detiene y reclasifica si aparece cualquiera de estos puntos:

- Apps Script / `Code.gs` / `Código.js`;
- Apollo/Sheets/Drive o datos reales;
- autenticación, sesiones, OAuth/scopes;
- roles/permisos;
- CONAPE, pagos, matrículas, notas;
- ACL/privacidad/seguridad;
- endpoint/helper backend;
- migración o cambio estructural;
- contrato frontend ↔ backend no trivial.

## Procedimiento

1. Leer `AGENTS.md` y `00_DOCUMENTACION/LIVE_CHANGE_RUNBOOK.md`.
2. Confirmar SHA actual de `main`.
3. Confirmar escenario observado y resultado esperado desde captura/reproducción.
4. Localizar source real; no asumir que el navegador es culpable.
5. Cambiar únicamente lo necesario.
6. Antes de publicar, escanear archivos afectados por:
   - `??`;
   - `�`;
   - `Ã` / `Â`;
   - `?` en medio de palabras españolas;
   - tildes/ñ sustituidas;
   - emojis/iconos dañados.
7. Verificar cache-bust si el asset ya estaba publicado.
8. Respetar `source-truth-guard` y otros checks obligatorios.
9. Verificar la superficie pública después del merge.
10. Si el source queda temporalmente parcheado en runtime, registrar la deuda de limpieza canónica.

## Lección canónica · PR #119

Síntoma visible:
- `Documentaci?n importante`;
- `Atr?s`;
- `?? Tomar foto`;
- `?? Subir archivo`;
- `? Rotar`.

Causa: los caracteres estaban dañados literalmente en source. No era una fuente de Chrome ni un problema del dispositivo.

Hotfix: PR #119, cache-bust + corrección visual inmediata, sin tocar Apps Script/backend/payload.

Prevención: todo release frontend debe ejecutar revisión de mojibake/caracteres sospechosos antes del merge.

## Calidad de evidencia

Un LIVE HOTFIX queda cerrado cuando existe, según aplique:
- diff/commit/PR;
- check obligatorio verde;
- página pública actualizada;
- captura o prueba visual posterior;
- ninguna modificación fuera del alcance declarado.

## Regla final

Velocidad no significa saltarse trazabilidad. LIVE HOTFIX elimina la fricción de pedir permiso repetido; **no elimina rama/PR/checks ni amplía privilegios al backend**.
