# Apps Script — backend canónico

## Versión vigente

`F98.4-Z6-CS21A42`

El archivo productivo se llama `Code.gs` y debe reemplazarse completo.

## Correcciones CS21A42

### Consulta individual fresca

- Nuevo endpoint `getEstudianteFresh`.
- Nuevo endpoint agrupado `getConsultaIndividualFresh`.
- La lectura agrupada devuelve ficha, asistencia, comentario administrativo e historial.
- Después de escrituras críticas se invalida el caché corto individual.
- Se fuerza lectura real después de estatus, pago, certificado, TOEIC, cambio de grupo y reversión.

### Certificados por intento

- Certificado usa `grupos_certificado_aplicados`.
- Los demás rubros usan `grupos_pago_aplicados`.
- Coincidencia exacta de grupo primero.
- Si el nivel tiene un único intento, se permite asignación segura al intento único.
- Con varios intentos ambiguos, no se inventa una asignación.
- Nunca se mueve dinero entre niveles o intentos.

### Fuente `7-morosidad` preservada

La clasificación continúa leyendo directamente:

- ID: `1Q9QTNc2009M6PqbNW2_WjYBOlqCMhiBjrenun88L5yg`
- Archivo: `7-morosidad`
- Pestaña: `Hoja 1`

Regla: misma cédula + año + periodo cuatrimestral; `NO`=aplicado, `SI`=pendiente, sin fila=revisión. `BDBANCARIO` está excluida.

## Respaldo canónico en Drive

Carpeta: `CAMPUS_VIRTUAL_BACKEND_CANONICO`

- TXT ID: `1FpHFcCSjrM_MHp0CUHjzmPvFABCAUwWV`
- ZIP ID: `1rG_WuF3aAd4dESWi_s82N3QBL6OAOoEd`

### TXT

- Nombre: `Code_F98_4_Z6_CS21A42_CONSULTA_CERTIFICADOS_REFRESH_REAL_COMPLETO.txt`
- Líneas físicas: 50.069
- Tamaño: 2.874.656 bytes
- SHA-256: `80a10e117c30bd563b810e5361c71b737df2229ca1eb87341fd1542036d26b3b`
- Validación: `node --check` aprobada.

### ZIP

- Nombre: `Code_F98_4_Z6_CS21A42_CONSULTA_CERTIFICADOS_REFRESH_REAL_COMPLETO.zip`
- Tamaño: 738.733 bytes
- SHA-256: `21be937d228f86c13881554adbae1568ba18b4455d81fc84851f4e08b7f8d7e9`

## Casos de control

### Estudiante 17110

- B1 APR con certificado emitido.
- B2 APR con certificado pagado y documento por emitir.
- I1 CA.
- I2 PE.

### Morosidad CONAPE

Cédula `119760781`, año 2026, periodo 3, estado `NO`; movimiento 09/2026 debe quedar aplicado.

## Instalación

1. Descargar el TXT completo CS21A42.
2. Abrir Apps Script y seleccionar `Code.gs`.
3. Reemplazar absolutamente todo el contenido.
4. Guardar.
5. Abrir **Implementar → Administrar implementaciones**.
6. Editar la implementación web existente.
7. Seleccionar **Nueva versión** y publicar.
8. Publicar el frontend de GitHub.
9. Recargar el Campus con `Ctrl + F5` una sola vez.
10. Validar 17110 y un cambio de estatus sin recarga manual.

Respaldado no significa desplegado.
