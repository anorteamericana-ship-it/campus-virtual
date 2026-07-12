# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral/frontend:** F98.4-Z6-CS21A64  
**Backend completo:** F98.4-Z6-CS21A64  
**Base preservada:** CS21A63 / CS21A62 / CS21A61 / CS21A60 / CS21A59 / CS21A58 / CS21A56 / CS21A46  
**Producción:** no verificada  
**Corte:** 12-jul-2026

## Cambio vigente CS21A64

El superadmin puede guardar una unidad de forma individual o recalcular todas las unidades siguientes usando una separación fija medida en clics de `Siguiente`.

Flujo:

1. Navegar hasta la hoja correcta.
2. Pulsar `Actualizar` debajo de U01–U15.
3. El sistema pregunta si se desea recalcular las unidades posteriores.
4. `Cancelar` guarda únicamente la unidad actual.
5. `Aceptar` solicita el número de clics de `Siguiente` entre unidades.
6. Cada clic representa dos posiciones de página del visor.
7. La operación se calcula hasta U16.
8. Todas las unidades se validan antes de realizar una única escritura.

Ejemplos oficiales:

- U01=27 + 4 clics → U02=35, U03=43.
- U01=27 + 3 clics → U02=33, U03=39.
- Desde U05 solo se recalcula U05–U16.
- U16 se guarda individualmente.

Protecciones:

- Usa el orden real de páginas del manifiesto.
- Rechaza hojas inexistentes, duplicadas o fuera de orden.
- Si la secuencia no cabe hasta U16, no escribe nada.
- Solo superadmin puede ejecutar la propagación.
- Conserva máximo 100 registros en `unitStartHistory`.
- Invalida únicamente la caché del libro seleccionado.

Frontend: `src/book_unit_propagation_cs21a64.js`.

Backend: el endpoint `superadminBooksSetUnitStart` conserva el modo individual y añade los parámetros opcionales `propagate_following` y `clicks_between_units`.

## Cambios preservados

- CS21A63: audio compacto sincronizado por nivel, libro y unidad.
- CS21A62: animación 3D de paso de hoja.
- CS21A61: carga estable de Recursos Didácticos.
- CS21A60: calibración persistente U01–U16 en `book.json.unitStarts`.

## Backend canónico

- Archivo: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Tamaño: `2.923.949` bytes.
- SHA-256: `d5217ceb90a4716c9161284a81c242a238649ed034bb97a36657716c6593feda`.
- Saltos de línea: `51.362`.
- Respaldo anterior: `1-AbtbfF3tH04eOl33w7mD2k_L7hPhCG1`.
- Copia de cierre: `1GOKIBd7Z6zabkj8ElQHIIbTQ_Y9wa4DL`.

## Archivos frontend vigentes

- `src/admin_resources_superadmin_cs21a60.jsx`.
- `src/book_unit_starts_cs21a60.jsx`.
- `src/admin_resources_runtime_cs21a61.jsx`.
- `src/book_page_turn_cs21a62.js`.
- `src/book_inline_audio_cs21a63.js`.
- `src/book_unit_propagation_cs21a64.js`.
- `campus.html`.

## Prueba inmediata CS21A64

1. Instalar el `Code.gs` completo CS21A64 y crear una nueva implementación.
2. Actualizar el frontend y hacer `Ctrl + F5`.
3. Entrar como superadmin.
4. Abrir B1/SB y navegar hasta la hoja 27.
5. Pulsar `Actualizar` debajo de U01.
6. Elegir recalcular y escribir `4`.
7. Confirmar U01=27, U02=35 y U03=43.
8. Repetir con `3` y confirmar U02=33 y U03=39.
9. Elegir `Cancelar` en la primera pregunta y confirmar que solo cambia la unidad seleccionada.
10. Probar desde una unidad intermedia y confirmar que las anteriores no cambian.
11. Confirmar que libros, audios, efecto de hojas, PDF, zoom y permisos siguen funcionando.

## Reglas preservadas

- Nunca mover pagos entre niveles o intentos.
- No tocar pagos, certificados, CONAPE, calendario ni hojas académicas.
- No crear automatizaciones nuevas de CONAPE.
- No declarar producción verificada sin ejecutar las pruebas anteriores.
