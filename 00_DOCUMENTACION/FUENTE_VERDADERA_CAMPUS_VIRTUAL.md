# FUENTE VERDADERA — F98.4-Z6-CS21A67

Estado: frontend CS21A67 guardado en GitHub `main`; backend instalado continúa en CS21A64; backend completo candidato CS21A67 generado y validado; producción no verificada.

## Cambio vigente

### Carga de Libros y Audios

`src/lazy_loader.jsx` espera a que `MaterialesView.__cs21a60UnitStarts` esté activo antes de renderizar las rutas de materiales. La biblioteca histórica de carpetas y PDFs ya no debe aparecer antes del visor actual.

### 1.3.2 Recursos adicionales

Nuevo archivo: `src/book_additional_resources_cs21a67.js`.

Se agrega el botón `1.3.2 RECURSOS ADICIONALES` junto a SB/TB/WB, sin modificar la estructura del visor.

- Docente: solo Diccionario Word by Word.
- Estudiante: recursos oficiales de su nivel.
- Admin y superadmin: recursos completos del nivel seleccionado.

El combo anterior de recursos queda oculto para evitar duplicados. Los audios compactos permanecen sin cambios.

## Backend candidato CS21A67

Preserva CS21A66 y añade un árbol seguro de carpetas y archivos para Recursos adicionales. Las carpetas internas se devuelven en `children` hasta cuatro niveles de profundidad. Para una sesión docente, `getBibliotecaNivelEstudiante` devuelve únicamente el Diccionario. Estudiantes conservan las validaciones de nivel y estado académico; admin y superadmin conservan el árbol completo.

Fuentes oficiales:

- B1: `1m5OkZtGrWytYunJdUyAUipf2s4QmSOo1`
- B2: `1n0JPcUcBAgho8kC6ofT9NuTw6fLVMITp`
- I1: `1nkuuggEea6sF476-J-IC6KMKzUuFwAm5`
- I2: `1npQrQgYbxMWA1KIpCjB94osOXWsOMdGb`

Integridad del backend candidato:

- Archivo: `Code_F98_4_Z6_CS21A67_COMPLETO.gs`
- Tamaño: `2.936.329` bytes
- Líneas: `51.687`
- SHA-256: `456aa5674a02c6f1c48c040dc073289bdb6f98ce96fe136b685259f98665b63b`
- Sintaxis validada con `node --check`.

## Preservado

- Visual actual del libro.
- SB/TB/WB según rol.
- U01–U16 y propagación.
- Audios, PDF, zoom, pantalla completa y efecto de hojas.
- CS21A66: autorización de English LAB Gratis.
- Pagos, certificados, CONAPE, calendario y hojas académicas sin cambios.

Guardado no significa instalado, desplegado ni probado en producción.
