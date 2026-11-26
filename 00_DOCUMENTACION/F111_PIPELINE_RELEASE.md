# F111 - Pipeline de integridad de releases (fase 1)

## Alcance y limites

Este workflow verifica el validador de integridad con archivos sinteticos. Se ejecuta en PR, push a main cuando cambian sus propios archivos, o manualmente. No publica, no usa secretos de Apps Script, no ejecuta codigo de candidatos, no cambia datos academicos y no concede aprobacion de produccion. El repositorio es publico: nunca subir snapshots privados, claves, tokens, contenido de evaluaciones, registros estudiantiles ni logs reales. La salida CI es publica y solo contiene pruebas sinteticas.

La validacion local separada lee los bytes de exportaciones exactas y un manifiesto privado `RELEASE_GATE.json` ya existente. Requiere version numerica y conteo esperado, y lista de cambios autorizados independiente del manifiesto. Falla ante archivos extra/faltantes, cambios de hash, rutas invalidas, duplicados, colisiones de mayusculas o cambios de appsscript.json. V1 no permite altas/bajas de archivos. No normaliza saltos de linea. No sustituye la comprobacion independiente del origen y version desplegada ni las pruebas funcionales. La lista permitida debe proceder de una revision humana, no calcularse a partir del diff que se intenta aprobar.

## Procedimiento de control

1. Mantener exportaciones y manifiestos privados fuera del repositorio publico. Verificar su procedencia con el procedimiento oficial autorizado; conservar versiones de reversión y una fuente unica de verdad.
2. Ejecutar `python -B scripts/f111_release_integrity.py --help` para consultar las entradas. La salida de cada verificacion se guarda localmente en un archivo nuevo fuera de los snapshots. Conservar reporte y manifiesto juntos. Una salida PASS_LOCAL_INTEGRITY solo confirma bytes locales contra el manifiesto y lista de cambios declarados; no es aprobacion ni certificacion funcional.
3. Ejecutar las pruebas especificas del cambio en entorno aislado. Conservar evidencia, riesgos, cambios autorizados y alcance.
4. La aprobacion humana de un release y el despliegue oficial quedan fuera de este workflow. No habilitar mecanismos de escritura ni incorporar credenciales a esta fase. Si una herramienta rechaza una operacion, mantener el bloqueo y no crear rutas alternativas para ejecutarla.
5. Despues de una publicacion oficial autorizada, registrar versiones reales, huellas verificadas, resultado funcional y plan de reversión segun LIVE_CHANGE_RUNBOOK.md. El readback no equivale a una prueba autenticada.

## Estado del candidato oral/quiz del 25-nov-2026

- CORE: baseline @512, 53 archivos exactos, un archivo modificado.
- QUIZ: baseline @510, 38 archivos exactos, un archivo modificado.
- Ambas verificaciones locales PASS_LOCAL_INTEGRITY. Reportes conservados en el directorio privado del candidato.
- No se ha efectuado ninguna publicacion de motores mediante este pipeline. Los 14 orales pendientes no se han escrito ni sincronizado. Ver el corte vigente y RELEASE_GATE.json privado.

## Fases futuras

La fase de publicacion no forma parte de esta entrega. Requiere un canal oficialmente permitido, autorizacion y revision de seguridad por separado; el CI de validacion no recibe credenciales ni permisos de escritura. Mantener la separacion entre pruebas, autorizacion, publicacion y lectura posterior.
