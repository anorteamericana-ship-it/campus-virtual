# CONTINUIDAD — F98.4-Z6-CS21A60

Estado vigente:

- Frontend CS21A60 guardado en GitHub `main`.
- Backend completo CS21A60 guardado en Drive.
- Producción no verificada.

## Objetivo del cambio vigente

Mantener un inicio U01–U16 configurable y persistente para cada libro, sin editar el frontend cada vez que una página de arranque resulte incorrecta.

## Archivos principales

- `src/admin_resources_superadmin_cs21a60.jsx`: permite que superadmin abra Recursos Didácticos.
- `src/book_unit_starts_cs21a60.jsx`: visor y botones pequeños de calibración.
- `campus.html`: carga los módulos CS21A60.
- `Code.gs` canónico: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.

## Comportamiento obligatorio

Superadmin:

- Abre Recursos Didácticos → Libros de texto.
- Selecciona nivel y SB/TB/WB.
- Navega hasta el pliego correcto.
- Pulsa `Actualizar` debajo de la unidad.
- Se guarda la hoja derecha visible.

Docente:

- Abre el mismo visor.
- Recibe los inicios guardados.
- No puede modificar unidades ni actualizar Drive.

Estudiante:

- Ve SB/WB de su nivel activo.
- Recibe los mismos inicios guardados.
- No ve controles administrativos.

Admin:

- Conserva sincronización del libro abierto desde Drive.
- No puede calibrar unidades.

## Fuente de verdad

Cada `book.json` conserva:

- `unitStarts`.
- `unitStartsVersion`.
- fecha y usuario de actualización.
- `unitStartHistory`.

No compartir el arreglo entre tipos de libro.

## Endpoint

`superadminBooksSetUnitStart`

Debe validar rol, unidad, existencia de página, duplicados, orden y concurrencia.

## Integridad backend

- Tamaño: `2.915.832` bytes.
- SHA-256: `1ae938995f99407e2914f406346edcf7e64d2517c6dd0869db14b14730947a56`.
- Saltos de línea: `51.143`.
- Respaldo previo: `1kekb73zQj4Wy9KdhgaiiannLJhBH6tmy`.
- Copia de cierre: `1bTuQcVrHkdWUV3HqFBWLddLfRiayB33U`.

## Siguiente acción obligatoria

1. Instalar el `Code.gs` completo CS21A60.
2. Crear nueva implementación de Apps Script.
3. Publicar frontend.
4. Hacer Ctrl+F5.
5. Ejecutar QA de U01 6→8 en B1/SB con superadmin, docente y estudiante.

Nunca afirmar despliegue ni funcionamiento productivo antes de esa prueba.

Nunca mover pagos entre niveles o intentos. No tocar pagos, certificados, CONAPE, calendario ni hojas académicas para este cambio.
