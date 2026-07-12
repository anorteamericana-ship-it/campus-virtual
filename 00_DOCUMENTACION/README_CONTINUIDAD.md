# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral/frontend:** F98.4-Z6-CS21A59  
**Backend completo:** F98.4-Z6-CS21A59  
**Base preservada:** CS21A58 / CS21A56 / CS21A46  
**Producción:** no verificada  
**Corte:** 12-jul-2026

## Cambio vigente

Ruta nueva en Admin/Superadmin:

`Recursos Didácticos → Libros de texto / Audios`

- La vista administrativa reutiliza la misma interfaz del docente.
- Libros mantiene B1, B2, I1, I2; SB, TB, WB; U01–U16; navegación, zoom y pantalla completa.
- Audios usa las carpetas oficiales de cada nivel.
- Solo admin/superadmin ve `Actualizar desde Drive`.
- El docente conserva los mismos recursos, pero sin ese botón.

## Actualizar desde Drive

- Actúa únicamente sobre el libro visible en ese momento.
- Recibe nivel y tipo abiertos, por ejemplo `B1 · SB`.
- Reconstruye solo el `book.json` correspondiente.
- Ordena las imágenes por el número actual de sus nombres WebP.
- No modifica los otros once libros.
- No copia, mueve, renombra ni elimina imágenes.
- No altera el PDF original.
- Después de actualizar, el libro vuelve a cargarse desde el inicio.

## Backend

Endpoint nuevo: `adminBooksRefreshOpenBook`.

- Requiere admin o superadmin.
- Usa bloqueo para evitar dos sincronizaciones simultáneas.
- Detecta nombres duplicados.
- Invalida únicamente la caché del libro abierto.
- Conserva `teacherBooksOpenImageBook` y los endpoints PDF anteriores.

Integridad:

- Tamaño: `2.906.208` bytes.
- SHA-256: `a3a4b2423c274833deb2f2d4d30859a85e7b1676779b371c395d244f4ab6773d`.
- Saltos de línea: `50.867`.
- Archivo canónico Drive: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Respaldo previo: `1yHzOKu0o1kx5SIxI2w2bqW-pxvsMx0Ls`.
- Copia de cierre: `1hT1VgtNcA3eRmw6-_HaWv0s95743PUq8`.

## Archivos frontend

- `src/teacher_cs21a_order_fix.jsx` permanece como visor CS21A58.
- `src/admin_resources_cs21a59.jsx` añade menú, panel admin y permisos.
- `campus.html` carga CS21A59.

## Pruebas obligatorias

1. Instalar y desplegar el `Code.gs` CS21A59.
2. Publicar frontend y hacer Ctrl+F5.
3. Entrar como admin y abrir Recursos Didácticos → Libros de texto.
4. Abrir B1 → SB.
5. Cambiar un nombre WebP en Drive.
6. Pulsar `Actualizar desde Drive`.
7. Confirmar que cambia únicamente B1/SB.
8. Entrar como docente y confirmar que el botón no aparece.
9. Abrir Audios en admin y docente.

## Reglas preservadas

- Solo desembolso académico 01 en seguimiento inmediato.
- 02/03+ no cierran el 01.
- Nunca mover pagos entre niveles o intentos.
- Producción no se considera verificada hasta probarla.
