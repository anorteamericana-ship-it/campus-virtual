# FUENTE VERDADERA — F98.4-Z6-CS21A68

Estado: frontend CS21A68 guardado en GitHub `main`; backend instalado continúa en CS21A64; backend completo candidato continúa en CS21A67; producción no verificada.

## Cambio vigente

`Recursos adicionales` deja de estar incrustado dentro del visor de libros.

Estructura lateral definitiva:

- Recursos Didácticos
  - Libros y Audios
  - Recursos adicionales

### Libros y Audios

Conserva sin cambios:

- SB/TB/WB según el rol.
- U01–U16 y propagación.
- Audios compactos.
- Anterior y Siguiente.
- Abrir/Descargar PDF.
- Zoom, pantalla completa y efecto de hojas.

El archivo `src/book_additional_resources_cs21a67.js` deja de cargarse, por lo que ya no aparece un botón junto a SB/TB/WB.

### Recursos adicionales

Nuevo archivo: `src/additional_resources_panel_cs21a68.jsx`.

El acceso se inserta inmediatamente debajo de `Libros y Audios`. Al abrirlo, el contenido principal cambia a una pantalla propia de Recursos adicionales.

Permisos:

- Docente: solo Diccionario Word by Word.
- Estudiante: recursos oficiales de su nivel activo.
- Admin y superadmin: recursos completos del nivel seleccionado, con selector B1/B2/I1/I2.
- Prematrículas sin matrícula académica: sin acceso a este panel.

El combo histórico de recursos dentro de la franja de audio permanece oculto para evitar duplicados.

## Backend

No cambia respecto a CS21A67.

El candidato `Code_F98_4_Z6_CS21A67_COMPLETO.gs` conserva el árbol de carpetas, archivos internos mediante `children`, validación por nivel y restricción docente al Diccionario.

El backend canónico instalado continúa en CS21A64 hasta reemplazar completamente `Code.gs` y publicar una nueva implementación.

## Archivos frontend vigentes

- `src/additional_resources_panel_cs21a68.jsx`
- `src/lazy_loader.jsx` CS21A67
- `src/resources_panel_cs21a65.jsx`
- `src/book_inline_audio_cs21a63.js`
- `src/book_unit_starts_cs21a60.jsx`
- `src/book_unit_propagation_cs21a64.js`
- `src/book_page_turn_cs21a62.js`
- `campus.html`

## Reglas preservadas

- No mover pagos entre niveles o intentos.
- No modificar pagos, certificados, CONAPE, calendario ni hojas académicas.
- No crear triggers nuevos de CONAPE.
- Guardado en GitHub no significa desplegado ni probado en producción.
