# Changelog · F98.4-Z6-CS21A100

- Corrige el bucle al finalizar la actualización CONAPE.
- Impide clics concurrentes del mismo cierre en el frontend.
- Añade `request_id` estable al paso CONAPE.
- Recarga automáticamente el mismo estudiante hasta confirmar el estado académico actualizado.
- Cierra el modal antes de notificar `onSuccess`, evitando que el padre lo remonte desde el inicio.
- Añade guardia backend por `OPERACION_ID` y `CONAPE_SYNC=OK`.
- Serializa sincronizaciones concurrentes mediante `LockService`.
- Mantiene pagos, reversión, intentos y MÁSCARA de Keylor sin cambios.
