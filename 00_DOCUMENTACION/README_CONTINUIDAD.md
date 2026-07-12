# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral/frontend:** F98.4-Z6-CS21A63  
**Backend completo:** F98.4-Z6-CS21A60  
**Base preservada:** CS21A62 / CS21A61 / CS21A60 / CS21A59 / CS21A58 / CS21A56 / CS21A46  
**Producción:** no verificada  
**Corte:** 12-jul-2026

## Cambio vigente CS21A63 — audios junto al libro

Se recupera el reproductor oficial que ya existía en la Biblioteca del Programa y se integra de forma compacta en `Recursos Didácticos → Libros de texto`.

### Fuente y comportamiento

1. Consulta `getBibliotecaNivelEstudiante` para obtener el catálogo real del nivel seleccionado.
2. Lee `catalogo.audios_unidades`.
3. Filtra los nombres reales de archivo por `Unit 01` a `Unit 16`.
4. Solo muestra `.mp3` de la unidad activa.
5. Al elegir una pista solicita `getAudioPistaEstudiante`.
6. El backend entrega un Blob base64 temporal y el navegador crea una URL local para el reproductor.
7. Al cambiar nivel, SB/TB/WB o U01–U16 se detiene y libera la pista anterior.
8. El catálogo queda cacheado temporalmente por nivel para evitar consultas repetidas.

### Montaje visual

- Archivo: `src/book_inline_audio_cs21a63.js`.
- Ubicación: parte derecha de la misma franja donde aparecen B1, B2, I1 e I2.
- Elementos: etiqueta `♪ nivel · libro · unidad`, combo pequeño y reproductor pequeño.
- No modifica la estructura ni las posiciones internas del visor.
- No elimina SB/TB/WB, U01–U16, PDF, descarga, zoom, pantalla completa, calibración ni efecto de hojas.
- No elimina todavía la entrada separada `Audios`.
- Se monta para superadmin, admin y docente. Los estudiantes conservan su biblioteca existente.

El backend CS21A60 ya autorizaba estos endpoints para los roles del Campus; no se agregó ni modificó ningún endpoint.

## Cambio preservado CS21A62 — paso de hoja

- `Siguiente`: hoja derecha hacia la izquierda.
- `Anterior`: hoja izquierda hacia la derecha.
- U01–U16: dirección automática según el salto.
- Perspectiva 3D, sombra, cara posterior y respeto de `prefers-reduced-motion`.

Archivo: `src/book_page_turn_cs21a62.js`.

## Hotfix preservado CS21A61

Se corrigió la carrera de carga que mostraba `No se pudo cargar Recursos Didácticos.` antes de que `syllabus_views.jsx` y `MaterialesView` terminaran de inicializarse.

Archivo: `src/admin_resources_runtime_cs21a61.jsx`.

## Funcionalidad preservada CS21A60

El superadmin calibra el inicio oficial de U01–U16 para cada combinación B1/B2/I1/I2 × SB/TB/WB.

- Guarda la hoja derecha visible.
- Persiste en `book.json.unitStarts`.
- Docentes y estudiantes reciben el nuevo inicio al recargar.
- Solo superadmin puede escribir.
- Admin puede actualizar desde Drive sin alterar los inicios.

## Backend preservado

- Versión: F98.4-Z6-CS21A60.
- Archivo canónico: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Tamaño: `2.915.832` bytes.
- SHA-256: `1ae938995f99407e2914f406346edcf7e64d2517c6dd0869db14b14730947a56`.
- Saltos de línea: `51.143`.
- Endpoints de audio reutilizados: `getBibliotecaNivelEstudiante`, `getAudioPistaEstudiante`.

## Archivos frontend vigentes

- `src/admin_resources_superadmin_cs21a60.jsx`.
- `src/book_unit_starts_cs21a60.jsx`.
- `src/admin_resources_runtime_cs21a61.jsx`.
- `src/book_page_turn_cs21a62.js`.
- `src/book_inline_audio_cs21a63.js`.
- `campus.html`.

## Prueba inmediata CS21A63

1. Actualizar el frontend y hacer `Ctrl + F5`.
2. Entrar como superadmin.
3. Abrir `Recursos Didácticos → Libros de texto`.
4. Confirmar que B1/B2/I1/I2 permanecen en su lugar y el bloque de audio aparece a la derecha.
5. En B1/SB/U01, abrir el combo y confirmar que solo aparecen archivos `Unit 01`.
6. Elegir una pista y reproducirla.
7. Cambiar a U02: la pista anterior debe detenerse y la lista debe mostrar solo `Unit 02`.
8. Cambiar a B2: debe cargar el catálogo de Básico II.
9. Cambiar SB/TB/WB: el indicador debe actualizarse y la selección anterior debe limpiarse.
10. Verificar que Anterior, Siguiente, efecto de hojas, U01–U16 y controles administrativos continúan funcionando.
11. Repetir con admin y docente.

## Reglas preservadas

- Nunca mover pagos entre niveles o intentos.
- No tocar pagos, certificados, CONAPE, calendario ni hojas académicas.
- No crear automatizaciones nuevas de CONAPE.
- No declarar producción verificada sin ejecutar las pruebas anteriores.
