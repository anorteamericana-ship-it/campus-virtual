# CS21A195R2 · Panel Maestro CONAPE · confirmación de actualización veraz

Fecha: 2026-08-29
Estado: DRAFT / source candidate / NO PROD
Base: PR #180 · `fix/admin-master-conape-safe-errors-cs21a194r2` · `6005b74db1a9e796e4943338ae3fa4a84fb8a5fd`

## Hallazgo demostrado
`refresh()` ejecutaba:

1. `actualizarPanelConapeAhora`;
2. `onRefresh`;
3. `refreshMora(false)`;
4. mensaje final de éxito `CONAPE y morosidad oficial actualizados.`

Pero `refreshMora(false)` capturaba internamente su excepción y no devolvía estado de fallo. Por tanto un fallo real de `getConapeMoraStates` podía mostrar primero un error y luego ser sobrescrito por el mensaje final de éxito conjunto.

Esto es una falsa confirmación de UI: no implica escritura corrupta, pero puede hacer creer al operador que la morosidad oficial fue verificada cuando no lo fue.

## Cambio
`refreshMora()` devuelve resultado explícito:
- `{ok:false,busy:true}` si ya existe una verificación en curso;
- `{ok:true,empty:true}` si no existen movimientos para verificar;
- `{ok:true}` tras verificación exitosa;
- `{ok:false}` tras fallo real.

`refresh()`:
- no publica éxito conjunto cuando `refreshMora(false)` devuelve fallo/busy;
- en lista vacía usa copy veraz: `CONAPE actualizado. No había registros para verificar morosidad.`;
- solo conserva `CONAPE y morosidad oficial actualizados.` cuando ambas fases terminan correctamente.

## No cambia
- endpoint `actualizarPanelConapeAhora`;
- endpoint `getConapeMoraStates`;
- payloads;
- cálculo de periodo/morosidad;
- `setMoraLive`;
- filtros/orden;
- seguimiento individual;
- Apps Script, Drive, ACL ni producción.

## Regresión requerida
- CS21A195R2;
- CS21A194R2 safe-error boundary;
- CS21A193 private PDFs;
- `git diff --check`.

**DRAFT · TRUTHFUL STATUS ONLY · NO BUSINESS RULE CHANGE · NO PROD · NO AUTO-MERGE**
