# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral/frontend:** F98.4-Z6-CS21A68  
**Backend canónico instalado:** F98.4-Z6-CS21A64  
**Backend candidato completo:** F98.4-Z6-CS21A67  
**Base preservada:** CS21A67 / CS21A66 / CS21A65 / CS21A64 / CS21A63 / CS21A62 / CS21A61 / CS21A60  
**Producción:** no verificada  
**Corte:** 12-jul-2026

## Cambio vigente CS21A68

`Recursos adicionales` deja de estar dentro del visor de libros y pasa a ser una pantalla independiente dentro de la sección lateral `Recursos Didácticos`.

Estructura final:

- Recursos Didácticos
  - Libros y Audios
  - Recursos adicionales

### Navegación

- `Libros y Audios` abre el visor actual con SB/TB/WB, unidades y audios.
- `Recursos adicionales` reutiliza la misma ruta de materiales, pero cambia el contenido principal a un panel exclusivo de recursos.
- Al volver a `Libros y Audios`, el visor reaparece sin perder su estructura.
- El botón incrustado junto a SB/TB/WB de CS21A67 deja de cargarse.
- El combo antiguo de recursos dentro de la franja de audios permanece oculto para evitar duplicados.

### Permisos

- Docente: únicamente Diccionario Word by Word.
- Estudiante: recursos oficiales de su nivel activo.
- Admin y superadmin: recursos completos del nivel seleccionado, con selector B1/B2/I1/I2.
- Usuarios de prematrícula sin matrícula académica no reciben este acceso.

### Archivos frontend

- Nuevo: `src/additional_resources_panel_cs21a68.jsx`.
- Modificado: `campus.html`.
- Deja de cargarse: `src/book_additional_resources_cs21a67.js`.
- Se preserva: `src/lazy_loader.jsx` CS21A67 para impedir el parpadeo de la biblioteca anterior.

## Backend

No cambia respecto a CS21A67.

El candidato completo `Code_F98_4_Z6_CS21A67_COMPLETO.gs` sigue aportando:

- Árbol seguro de carpetas y archivos de Recursos adicionales.
- Carpetas internas mediante `children`.
- Docente limitado al Diccionario también desde backend.
- Estudiante limitado a su nivel académico.
- Admin y superadmin con árbol completo.

El backend canónico instalado continúa en CS21A64 hasta reemplazar completamente `Code.gs` y publicar una nueva implementación.

## Prueba inmediata

1. Actualizar el frontend y hacer `Ctrl + F5`.
2. Entrar como docente.
3. Confirmar una sola sección `Recursos Didácticos`.
4. Confirmar dos opciones consecutivas: `Libros y Audios` y debajo `Recursos adicionales`.
5. Abrir `Libros y Audios`: no debe aparecer ningún botón de Recursos adicionales dentro del visor.
6. Abrir `Recursos adicionales`: debe reemplazar el visor por una pantalla propia y mostrar solo el Diccionario.
7. Volver a `Libros y Audios`: debe regresar el libro actual.
8. Entrar como estudiante: Recursos adicionales debe mostrar únicamente la carpeta de su nivel.
9. Confirmar que el estudiante sigue sin TB y el docente conserva SB/TB/WB.
10. Confirmar audios, PDF, zoom, pantalla completa, paso de hoja y U01–U16.

## Reglas preservadas

- Nunca mover pagos entre niveles o intentos.
- No tocar pagos, certificados, CONAPE, calendario ni hojas académicas.
- No crear automatizaciones nuevas de CONAPE.
- No declarar producción verificada sin ejecutar las pruebas anteriores.
