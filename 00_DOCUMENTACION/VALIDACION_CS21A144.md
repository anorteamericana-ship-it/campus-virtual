# CS21A144 · English LAB para estudiantes al día y salas mixtas

## Base

- Repositorio: `anorteamericana-ship-it/campus-virtual`
- Rama base: `main`
- SHA base: `67108928e953fbf044dbcd916dc34a5dd5f1e570`

## Regla aprobada

1. Un estudiante puede abrir English LAB únicamente cuando el backend confirma:
   - sesión válida de estudiante;
   - matrícula académica activa (`CA`, `APR` o `CNV`);
   - ausencia de mora exigible en los niveles registrados.
2. Una vez autorizado, el estudiante entra a una sala mediante el código `LAB-####`.
3. La sala no se restringe por grupo del estudiante. Un mismo código puede reunir estudiantes de grupos diferentes y del Club I CAN.
4. La identidad del jugador se toma de la sesión autenticada. El backend ignora nombre, cédula o código enviados por el navegador.
5. Prematrícula o una autorización histórica de acceso gratuito ya no sustituyen la condición de estudiante matriculado y al día.

## Archivos

- `src/english_lab_free_access_cs21a66.js`
  - reemplaza el guard histórico por el contrato CS21A144;
  - verifica acceso al abrir English LAB, no en cada carga del Campus;
  - agrega el ingreso por código dentro de English LAB;
  - protege también la pantalla Live y oculta los campos editables de identidad.
- `campus.html`
  - actualiza la versión de caché del guard.
- `apps_script_patches/english_lab_access_cs21a144.gs`
  - parche append-only para staging/entrega backend autorizada;
  - no reemplaza `Code.gs` ni se despliega automáticamente.
- `scripts/test_english_lab_access_cs21a144.js`
  - valida estáticamente el contrato frontend/backend.

## Validación ejecutada

```bash
node --check src/english_lab_free_access_cs21a66.js
cp apps_script_patches/english_lab_access_cs21a144.gs /tmp/english_lab_access_cs21a144.js
node --check /tmp/english_lab_access_cs21a144.js
node scripts/test_english_lab_access_cs21a144.js
```

Resultado local: 16 comprobaciones aprobadas.

## Límites

- La prueba es estática; no demuestra el Apps Script desplegado.
- El parche backend debe anexarse primero en un entorno aislado y publicarse como nueva versión de staging.
- La definición “al día” usa la fuente financiera canónica actual: `mora_calculada`, `moroso`, `mora_exigible`/`deuda_exigible` y `estado_financiero`.
- Falta QA autenticado con, como mínimo:
  - estudiante activo al día;
  - estudiante activo con mora;
  - estudiante sin matrícula activa;
  - dos estudiantes de grupos distintos entrando a la misma sala;
  - varios participantes de Club I CAN entrando con el mismo código.
