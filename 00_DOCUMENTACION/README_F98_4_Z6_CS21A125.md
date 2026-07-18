# F98.4-Z6-CS21A125 — Acceso académico acumulativo

## Regla

El nivel más alto del estudiante que tenga estado `CA`, `APR` o `CNV` habilita ese nivel y todos los anteriores:

- B1 habilita B1.
- B2 habilita B1 y B2.
- I1 habilita B1, B2 e I1.
- I2 habilita los cuatro niveles.

Los estados `PE`, `REP`, `RI`, `RJ` y otros no habilitan niveles futuros.

## Alcance

La regla se aplica a Planeamiento por lección, Plan de Estudio, Libros y Audios, Recursos adicionales, material por lección y contenido por nivel de English LAB.

Syllabus general, Cronograma general, Información General del Programa, Mi Perfil, Pagos y Certificados permanecen como contenidos generales.

## Frontend

- `src/student_content_access_cs21a125.jsx`
- `styles/student_content_access_cs21a125.css`
- cargador desde `src/student_menu_academic_guard_cs21a120.js`

Las pantallas muestran únicamente botones de niveles autorizados y abren inicialmente el nivel máximo alcanzado.

## Backend

El archivo completo preparado para Apps Script es `Code_F98_4_Z6_CS21A125_COMPLETO.gs`. El resolvedor lee `ESTATUS` por código, no depende de que el código del grupo contenga el nivel. La máscara demo de Keylor utiliza su historial aislado y no crea filas falsas en APOLLO.

English LAB filtra el banco curricular en el servidor y rechaza la apertura o el guardado de juegos pertenecientes a niveles futuros.

## Pruebas mínimas

- B2 `CA` con B1 ausente o `PE`: debe habilitar B1 y B2.
- I1 `CA`: debe habilitar B1, B2 e I1.
- I2 `PE`: no debe habilitar I2.
- Mariana `AN0626-01`: debe habilitar B1, B2 e I1.
- Grupo demo 0726: debe habilitar únicamente B1.
