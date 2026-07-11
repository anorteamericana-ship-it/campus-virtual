# FUENTE VERDADERA — F98.4-Z6-CS21A56

Estado canónico: frontend CS21A56 guardado en GitHub; backend completo CS21A56 guardado en el archivo canónico de Drive; producción no verificada.

## Componentes vigentes

- `src/teacher_cs21a_order_fix.jsx`
- `campus.html`
- `Code.gs` completo de Drive

## Cambio CS21A56 — Drive live sin ID obsoleto

- Corrige la selección persistente del PDF anterior en Docente → Recursos Didácticos → Libros de texto.
- La carpeta oficial de Básico I continúa siendo `1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH`.
- Student Book activo de Básico I: `Interchange 5th intro-SB.pdf`, ID `1zVPOGcCca5Ti8M8LtCpEO65-bO0m2_oF`.
- El backend ya no conserva en caché durante cinco minutos el ID resuelto de SB/TB/WB.
- B1/SB prioriza el ID canónico anterior únicamente mientras siga dentro de la carpeta oficial; si desaparece, usa el PDF válido más reciente de la carpeta.
- El frontend fuerza una resolución nueva al entrar o cambiar nivel/tipo y ofrece `Actualizar desde Drive`.
- Cambiar U01–U16 solo cambia las páginas renderizadas; no vuelve a descargar el libro completo.
- U09 mantiene destino PDF 64–65, equivalente a SB 58 con el desfase +6.
- Es un cambio de solo lectura: no modifica pagos, certificados, CONAPE, calendario ni hojas académicas.

## Integridad

La identidad completa del backend, su tamaño, hash, respaldo previo y ubicación están registrados en `AppsScript/README.md` y `MANIFIESTO_ACTUAL.json`.

## Reglas preservadas

- Solo desembolso académico `01` en Seguimiento inmediato.
- `02/03+` no cierran el `01`.
- Resumen vertical desde `6-historial`.
- Nunca mover pagos entre niveles o intentos.
- Guardado no significa desplegado.
