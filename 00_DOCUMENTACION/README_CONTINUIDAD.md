# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral/frontend:** F98.4-Z6-CS21A60  
**Backend completo:** F98.4-Z6-CS21A60  
**Base preservada:** CS21A59 / CS21A58 / CS21A56 / CS21A46  
**Producción:** no verificada  
**Corte:** 12-jul-2026

## Cambio vigente

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

## Backend

Endpoint nuevo: `superadminBooksSetUnitStart`.

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

## Archivos frontend

- `src/admin_resources_superadmin_cs21a60.jsx`.
- `src/book_unit_starts_cs21a60.jsx`.
- `campus.html`.

## Pruebas obligatorias

1. Instalar el `Code.gs` completo CS21A60.
2. Crear una nueva implementación de Apps Script.
3. Publicar el frontend y hacer Ctrl+F5.
4. Entrar como superadmin y confirmar que aparece Recursos Didácticos.
5. Abrir B1/SB y comprobar el valor actual de U01.
6. Navegar hasta el pliego que contiene 7–8 y pulsar `Actualizar` bajo U01.
7. Recargar y comprobar que U01 abre nuevamente 7–8 y reporta fuente 8.
8. Entrar como docente y verificar el mismo inicio sin botones pequeños.
9. Entrar como estudiante B1 y verificar el mismo inicio en SB.
10. Probar al menos una unidad de TB y WB y validar que no se mezclen configuraciones.

## Reglas preservadas

- Nunca mover pagos entre niveles o intentos.
- No tocar pagos, certificados, CONAPE, calendario ni hojas académicas.
- No crear automatizaciones nuevas de CONAPE.
- No declarar producción verificada sin ejecutar las pruebas anteriores.
