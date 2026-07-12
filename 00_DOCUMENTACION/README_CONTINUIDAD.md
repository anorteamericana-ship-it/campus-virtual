# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral/frontend:** F98.4-Z6-CS21A62  
**Backend completo:** F98.4-Z6-CS21A60  
**Base preservada:** CS21A61 / CS21A60 / CS21A59 / CS21A58 / CS21A56 / CS21A46  
**Producción:** no verificada  
**Corte:** 12-jul-2026

## Cambio vigente CS21A62

El visor de libros incorpora un efecto de paso de hoja tipo libro físico.

Comportamiento:

1. `Siguiente` gira la hoja derecha hacia la izquierda.
2. `Anterior` gira la hoja izquierda hacia la derecha.
3. Al pulsar U01–U16 se calcula si el salto es hacia adelante o atrás y se usa el giro correspondiente.
4. La animación dura aproximadamente 680 ms.
5. Incluye perspectiva 3D, sombra, cara posterior tenue y oscurecimiento momentáneo del lomo.
6. La animación se monta fuera del árbol de React para que el cambio real de página no la corte ni interfiera con la navegación.
7. Si el dispositivo usa `prefers-reduced-motion`, las páginas cambian sin animación.

Archivo: `src/book_page_turn_cs21a62.js`.

Este cambio es exclusivamente frontend. El `Code.gs` CS21A60 se conserva sin modificaciones.

## Hotfix preservado CS21A61

Se corrigió el mensaje del superadmin:

`No se pudo cargar Recursos Didácticos.`

La causa era una carrera de carga: el panel administrativo se montaba antes de que el módulo diferido `syllabus_views.jsx` y la cadena `MaterialesView` CS21A59/CS21A60 estuvieran disponibles.

Nuevo comportamiento:

1. Al abrir Recursos Didácticos, CS21A61 verifica las dependencias.
2. Si faltan, usa `window.anLazyCampus` para cargar `src/syllabus_views.jsx?v=F98.4Z6G`.
3. Espera a que CS21A59 y CS21A60 terminen de instalar sus envoltorios.
4. Muestra `Preparando biblioteca…` durante el proceso.
5. Si ocurre un error real, muestra el detalle y permite `Reintentar`.
6. Solo después monta la pantalla original de libros o audios.

## Funcionalidad preservada CS21A60

Recursos Didácticos permite que el superadmin calibre el inicio oficial de U01–U16 para cada libro.

Flujo:

1. Entrar como superadmin.
2. Abrir `Recursos Didácticos → Libros de texto`.
3. Elegir nivel y tipo de libro.
4. Navegar hasta el pliego correcto.
5. Pulsar el botón pequeño `Actualizar` debajo de la unidad correspondiente.
6. El sistema guarda la hoja derecha visible. En un pliego 7–8, guarda 8.
7. Docentes y estudiantes reciben el nuevo inicio cuando vuelven a cargar el libro.

## Fuente de configuración

- Cada `book.json` guarda `unitStarts` de forma independiente.
- Hay 12 configuraciones posibles: cuatro niveles × SB/TB/WB.
- SB usa el mapa histórico como fallback mientras no exista calibración propia.
- TB/WB no inventan inicios; deben configurarse desde superadmin.
- Cada cambio conserva hasta 100 registros de auditoría en `unitStartHistory`.

## Permisos

- Superadmin: lectura, sincronización desde Drive y calibración U01–U16.
- Admin: lectura y sincronización desde Drive; sin calibración de unidades.
- Docente: lectura SB/TB/WB.
- Estudiante: lectura SB/WB del nivel activo.

El frontend oculta controles, pero la protección real está en backend.

## Backend preservado

Endpoint: `superadminBooksSetUnitStart`.

Validaciones:

- Rol exacto `superadmin`.
- Unidad entre U01 y U16.
- Hoja existente dentro del libro.
- Sin hojas duplicadas entre unidades.
- Orden ascendente coherente.
- Bloqueo contra escrituras simultáneas.
- Invalidación de caché limitada al libro abierto.

Integridad:

- Archivo canónico: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Tamaño: `2.915.832` bytes.
- SHA-256: `1ae938995f99407e2914f406346edcf7e64d2517c6dd0869db14b14730947a56`.
- Saltos de línea: `51.143`.
- Respaldo previo: `1kekb73zQj4Wy9KdhgaiiannLJhBH6tmy`.
- Copia de cierre: `1bTuQcVrHkdWUV3HqFBWLddLfRiayB33U`.

## Archivos frontend vigentes

- `src/admin_resources_superadmin_cs21a60.jsx`.
- `src/book_unit_starts_cs21a60.jsx`.
- `src/admin_resources_runtime_cs21a61.jsx`.
- `src/book_page_turn_cs21a62.js`.
- `campus.html`.

## Prueba inmediata

1. Publicar o esperar la actualización del frontend.
2. Hacer `Ctrl + F5` en `campus.html`.
3. Entrar como superadmin y abrir `Recursos Didácticos → Libros de texto`.
4. Pulsar `Siguiente`: debe girar la hoja derecha hacia la izquierda.
5. Pulsar `Anterior`: debe girar la hoja izquierda hacia la derecha.
6. Pulsar una unidad posterior y luego una anterior para validar ambos sentidos.
7. Repetir con un docente y un estudiante.
8. Confirmar que U01–U16, Actualizar desde Drive y la calibración continúan funcionando.

## Reglas preservadas

- Nunca mover pagos entre niveles o intentos.
- No tocar pagos, certificados, CONAPE, calendario ni hojas académicas.
- No crear automatizaciones nuevas de CONAPE.
- No declarar producción verificada sin ejecutar las pruebas anteriores.
