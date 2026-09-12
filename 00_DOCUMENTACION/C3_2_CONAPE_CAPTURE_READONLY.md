# C3.2 · CONAPE Portal · captura autenticada read-only

**Rama:** `feature/conape-portal-parser-c3-1`
**PR:** #284 · DRAFT
**Base:** `main@b025b270b8df633efe7d7682666645cf8dfe6030`
**Estado:** SOURCE + QA; falta primera ejecución real del propietario para elevar a E2
**PROD / Apps Script / CONAPE writes:** NO

## Objetivo

Eliminar por completo el paso manual de copiar `Payload`, `Response`, HTML, cookies o identificadores de sesión desde DevTools.

Flujo C3.2:

`Chrome/Edge aislado -> sesión CONAPE iniciada por el propietario -> Chrome DevTools Protocol local -> DOM del Interactive Report -> parser C3.1 -> resumen seguro`

El capturador opera sobre la interfaz ya autenticada y reutiliza exactamente el parser C3.1. No implementa un segundo parser ni una ruta de datos alternativa.

## Seguridad y privacidad

El launcher de Windows:

- abre Chrome o Edge en un `user-data-dir` temporal exclusivo;
- usa modo incógnito;
- habilita Chrome DevTools únicamente en `127.0.0.1` y con puerto efímero asignado por el navegador;
- nunca recibe usuario o contraseña por línea de comandos;
- nunca escribe usuario, contraseña, cookies, `session`, `p_instance`, `p_request` ni tokens en GitHub;
- no persiste el HTML capturado;
- no imprime nombres, cédulas, teléfonos ni correos en la salida normal;
- al terminar intenta cerrar únicamente los procesos asociados al perfil temporal y borrar ese perfil.

El usuario inicia sesión directamente en la ventana oficial de CONAPE. La aplicación Campus Virtual no recibe las credenciales.

## Límite de host/app

El capturador solo admite páginas HTTPS cuyo hostname exacto sea:

`online.conape.go.cr`

y cuyo path sea APEX. Cuando existe `f?p=...`, la aplicación debe ser `302`.

Una pestaña de otro dominio, un hostname parecido o otra aplicación APEX se rechaza.

## Lectura y paginación

C3.2 toma el HTML del DOM renderizado y lo entrega a `parseConapeApexReport()`.

Para reportes paginados:

1. captura y parsea la página actual;
2. calcula un fingerprint de página;
3. busca el control `Siguiente/Next` dentro de la región APEX del reporte objetivo;
4. hace clic únicamente en ese control de paginación;
5. espera un fingerprint diferente;
6. repite hasta que `Siguiente` ya no esté habilitado.

La paginación cambia únicamente la vista del Interactive Report. No se ejecutan acciones de negocio, escrituras de datos ni endpoints del Campus.

Fail-closed:

- página repetida -> `PAGINATION_LOOP`;
- siguiente no cambia la página -> `PAGINATION_TIMEOUT`;
- total APEX cambia durante el recorrido -> `PAGINATION_TOTAL_CHANGED`;
- total APEX conocido no coincide con filas capturadas -> `PAGINATION_TOTAL_MISMATCH`;
- se alcanza el límite de páginas -> `MAX_PAGES_EXCEEDED`.

No se deduplican filas silenciosamente entre páginas.

## Salida normal

La ejecución CLI imprime únicamente:

- estado PASS/BLOCK;
- nivel de evidencia;
- URL sanitizada hasta app/página;
- cantidad de páginas;
- cantidad total de filas;
- fingerprint SHA-256 del dataset;
- conteo por `estado_key`;
- cantidad de warnings, fechas inválidas, identificaciones inválidas, duplicados y estados desconocidos.

No imprime el arreglo de registros.

## Ejecución en Windows

Desde el repo:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\conape_portal\run_conape_capture_windows.ps1
```

También se puede ejecutar `scripts\conape_portal\CONAPE_CAPTURE_C3_2.cmd` con doble clic.

La ventana aislada abre automáticamente:

`https://online.conape.go.cr/apex/f?p=302:1`

El único paso interactivo es iniciar sesión normalmente y dejar visible `Prospectación Reclutador`. No se copia contenido de DevTools.

## Evidencia

CI puede demostrar únicamente E1 para C3.2 porque GitHub Actions no posee una sesión CONAPE real.

C3.2 sube a **E2 AUTENTICADA LECTURA** solamente cuando el propietario ejecute el capturador localmente contra la sesión oficial y el resultado termine en `PASS`, sin mismatch de paginación y sin mutaciones.

Un PASS sintético de CI no se registrará como E2.

## Lo que C3.2 todavía no hace

- no guarda `CONAPE_PORTAL_ACTUAL`;
- no crea `CONAPE_PORTAL_EVENTOS`;
- no crea `CONAPE_PORTAL_RUNS`;
- no actualiza Ventas/Admin;
- no compara todavía contra estudiantes/prospectos del Campus;
- no programa polling;
- no hace login automático;
- no persiste cookies o sesiones para ejecuciones posteriores;
- no escribe en CONAPE ni en Apps Script/Sheets/Drive.

## Gate siguiente

Después del primer PASS E2 real, el siguiente corte debe resolver persistencia y reconciliación sin mezclar fuentes:

`captura E2 -> parser C3.1 -> snapshot actual -> eventos por process_hash/record_hash -> comparación Campus -> UI Ventas/Admin`

Antes de persistir, deben quedar confirmados:

1. cobertura total real del reporte/paginación;
2. catálogo real de estados y significado de `PASADA_A_BPM`;
3. regla de identidad cuando una cédula aparece más de una vez;
4. retención mínima necesaria de PII;
5. frecuencia de lectura y política de reintentos/bloqueos.
