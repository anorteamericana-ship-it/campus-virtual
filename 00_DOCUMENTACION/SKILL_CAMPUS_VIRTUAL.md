# SKILL OPERATIVA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

## Forma obligatoria de trabajo

- Trabajar sobre F98.4-Z6-CS21A60.
- Responder en español directo para una persona que trabaja por copy/paste.
- Antes de modificar, indicar si afecta frontend, Apps Script o ambos.
- Con acceso a GitHub y Drive, aplicar los cambios directamente.
- Si Apps Script cambia, conservar y entregar un único `Code.gs` completo.
- Mantener `00_DOCUMENTACION` como fuente verdadera.
- Diferenciar guardado, respaldado, instalado, publicado y desplegado.
- No afirmar producción sin prueba real.

## Continuidad vigente

- Frontend: F98.4-Z6-CS21A60 en GitHub `main`.
- Backend completo: F98.4-Z6-CS21A60 en Drive.
- Producción no verificada.

## Inicios U01–U16

- Fuente única: `unitStarts` dentro del `book.json` de cada libro.
- Alcance independiente: B1/B2/I1/I2 × SB/TB/WB.
- Nunca volver a usar un solo mapa compartido por nivel para los tres tipos de libro.
- Solo superadmin puede guardar cambios.
- El botón pequeño `Actualizar` aparece debajo de cada unidad únicamente para superadmin.
- Se guarda la hoja derecha del pliego visible; 7–8 guarda 8.
- La hoja guardada debe existir en `pages[]`.
- No permitir una misma hoja en dos unidades.
- No permitir que una unidad quede antes de la anterior o después de la siguiente.
- Conservar auditoría en `unitStartHistory`.
- Invalidar solo la caché del libro modificado.

## Permisos del visor

- Superadmin: SB/TB/WB, sincronización y calibración.
- Admin: SB/TB/WB y sincronización; sin calibración.
- Docente: SB/TB/WB, solo lectura.
- Estudiante: SB/WB de su nivel activo, solo lectura.

## Endpoints

- Lectura: `teacherBooksOpenImageBook`.
- Sincronización de imágenes: `adminBooksRefreshOpenBook`.
- Calibración de unidades: `superadminBooksSetUnitStart`.

## Integridad backend CS21A60

- Archivo: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Tamaño: `2.915.832` bytes.
- SHA-256: `1ae938995f99407e2914f406346edcf7e64d2517c6dd0869db14b14730947a56`.
- Saltos de línea: `51.143`.
- Respaldo previo: `1kekb73zQj4Wy9KdhgaiiannLJhBH6tmy`.
- Copia de cierre: `1bTuQcVrHkdWUV3HqFBWLddLfRiayB33U`.

## Riesgo alto

Antes de tocar pagos, certificados, `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS`, CONAPE o calendario, analizar el impacto. Nunca mover pagos entre niveles o intentos.

## Reglas preservadas

- Solo desembolso académico 01 en seguimiento inmediato.
- 02/03+ no cierran el 01.
- No crear triggers nuevos de CONAPE.
- No procesar ni modificar PDF desde el sincronizador de imágenes.
