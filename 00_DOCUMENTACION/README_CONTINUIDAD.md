# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral/frontend:** F98.4-Z6-CS21A65  
**Backend canónico:** F98.4-Z6-CS21A64  
**Base preservada:** CS21A64 / CS21A63 / CS21A62 / CS21A61 / CS21A60 / CS21A59 / CS21A58 / CS21A56 / CS21A46  
**Producción:** no verificada  
**Corte:** 12-jul-2026

## Cambio vigente CS21A65

Recursos Didácticos queda consolidado como un único módulo `Libros y Audios`.

### Resultado por rol

1. Superadmin
   - Una sola sección Recursos Didácticos.
   - SB/TB/WB, audios y recursos adicionales.
   - Puede calibrar U01–U16 y actualizar imágenes desde Drive.

2. Admin
   - Una sola sección Recursos Didácticos.
   - SB/TB/WB, audios y recursos adicionales.
   - No ve botones de edición o actualización.

3. Docente
   - Un solo acceso Libros y Audios.
   - SB/TB/WB y audios por unidad.
   - No ve controles administrativos.
   - Recursos adicionales muestra únicamente el Diccionario.

4. Estudiante
   - Sección Recursos Didácticos → Libros y Audios.
   - Abre directamente el visor, sin iniciar en Cronograma.
   - SB y WB del nivel activo; TB no aparece.
   - Audios y recursos adicionales oficiales del nivel.
   - No ve controles administrativos.

### Limpieza aplicada

- Se elimina la repetición de Recursos Didácticos producida por envoltorios sucesivos.
- La entrada separada Audios deja de mostrarse.
- Libros de texto pasa a Libros y Audios.
- Los nombres visibles eliminan prefijos técnicos y número de página.
- Ejemplo: `IC5_L0_Unit 01 Pg 002 Ex 01 Conversation Pt A.mp3` → `Unit 01 Ex 01 Conversation Pt A.mp3`.
- Los archivos reales de Drive no se renombran.

### Recursos adicionales

Se reutiliza `catalogo.recursos` del nivel seleccionado. No se inventan enlaces ni materiales.

- Estudiante: todos los recursos oficiales de su nivel.
- Docente: únicamente el Diccionario.

## Archivos frontend

- `src/resources_panel_cs21a65.jsx`.
- `src/book_inline_audio_cs21a63.js` con contenido vigente CS21A65.
- `campus.html`.

Se preservan:

- `src/book_unit_starts_cs21a60.jsx`.
- `src/admin_resources_runtime_cs21a61.jsx`.
- `src/book_page_turn_cs21a62.js`.
- `src/book_unit_propagation_cs21a64.js`.

## Backend

El backend canónico continúa en CS21A64:

- Archivo: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Tamaño: `2.923.949` bytes.
- SHA-256: `d5217ceb90a4716c9161284a81c242a238649ed034bb97a36657716c6593feda`.
- Respaldo previo adicional: `1AzAJIIsJvyU_CiHPbYEs3PwKMBF8_xxt`.

El frontend ya oculta las operaciones a todos excepto superadmin. Para reforzar también el endpoint se preparó un `Code.gs` completo CS21A65 que cambia únicamente la autorización de `adminBooksRefreshOpenBook` a rol exacto `superadmin`. Sigue pendiente instalarlo y publicar una nueva implementación.

## Prueba inmediata

1. Actualizar el frontend y hacer Ctrl+F5.
2. Cerrar sesión y volver a entrar como superadmin.
3. Confirmar una sola sección Recursos Didácticos y un solo botón Libros y Audios.
4. Confirmar que no existe una entrada separada Audios.
5. Probar B1/SB/U01 y revisar el nombre limpio de una pista.
6. Entrar como docente: SB/TB/WB, audio, Diccionario y ningún botón Actualizar.
7. Entrar como estudiante: SB/WB, audio, recursos del nivel, sin TB y sin controles administrativos.
8. Confirmar que efecto de hojas, PDF, zoom, pantalla completa y propagación U01–U16 siguen funcionando.

## Reglas preservadas

- Nunca mover pagos entre niveles o intentos.
- No tocar pagos, certificados, CONAPE, calendario ni hojas académicas.
- No crear automatizaciones nuevas de CONAPE.
- No declarar producción verificada sin ejecutar las pruebas anteriores.
