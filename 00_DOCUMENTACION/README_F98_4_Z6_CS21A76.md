# F98.4-Z6-CS21A76 — Perfil profesional docente

## Alcance

CS21A76 reemplaza la vista provisional de `Mi Perfil` para el rol docente por una ficha profesional conectada a datos y documentos reales.

No agrega calendarios, grupos, asistencia ni módulos académicos repetidos.

## Frontend

Archivos:

- `campus.html`
- `src/teacher_profile_cs21a76.jsx`

Incluye:

- Portada institucional Academia Norteamericana.
- Fotografía grande tipo perfil con carga y reemplazo.
- Nombre, estado, correo, teléfono, cédula y usuario.
- Presentación profesional editable: titular, especialidad, experiencia y texto breve.
- Tarjeta real de Currículum PDF.
- Tarjeta real de Aval INA PDF.
- Estados `Disponible` y `Pendiente`.
- Apertura y reemplazo de documentos.

## Backend

Fuente canónica:

- Drive `AppsScript/Code.gs`
- ID `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`
- Versión agregada: `F98.4-Z6-CS21A76`

Endpoints protegidos:

- `getPerfilDocenteCS21A76`
- `guardarPerfilDocenteCS21A76`
- `uploadFotoPerfilDocenteCS21A76`
- `uploadDocumentoDocenteCS21A76`

Los endpoints exigen sesión válida y rol `teacher`, `admin` o `superadmin`. Un docente solo opera sobre su propia identidad de sesión.

## Drive

Raíz creada dentro de `CAMPUS_VIRTUAL_DESIGN`:

- `DOCUMENTOS_DOCENTES`
- ID `1GN1g-vB6Pr71vi_kXQE4NeoZr8KVxTPO`

Estructura automática por docente:

```text
DOCUMENTOS_DOCENTES/
  DOCENTE__USUARIO__NOMBRE/
    01_PERFIL/
      PERFIL_DOCENTE.json
      DATOS_DOCENTE.txt
      FOTO_PERFIL_*.jpg
    02_CURRICULUM/
      CURRICULUM_*.pdf
    03_AVAL_INA/
      AVAL_INA_*.pdf
    99_HISTORIAL/
```

Los archivos anteriores se mueven a historial cuando se reemplaza una foto o un PDF.

La estructura inicial de Keylor fue creada con el identificador `DOCENTE__KEYLOR__KEYLOR_LEIVA_MIRANDA`.

## Datos preservados

CS21A76 no escribe ni modifica:

- `DATOS`
- `ESTATUS`
- `PAGOS`
- `CERTIFICADOS`
- CONAPE
- Calendario académico
- Expedientes estudiantiles

## Respaldo

Antes de actualizar el backend canónico se guardó:

- `Code_BACKUP_PRE_CS21A76_2026-07-12.gs`
- Drive ID `1AZixLJjDppHEkYOMhIWTt56P7O_oSs0w`

## Publicación

Guardar `Code.gs` en Drive no publica Apps Script. Para activar los endpoints hay que copiar el archivo completo al proyecto Apps Script, guardar, crear una nueva versión del despliegue y publicar.

GitHub Pages debe terminar de publicar `campus.html` y `teacher_profile_cs21a76.jsx` antes de realizar QA.
