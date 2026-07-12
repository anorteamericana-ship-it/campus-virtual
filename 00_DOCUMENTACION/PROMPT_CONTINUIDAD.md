# CONTINUIDAD — F98.4-Z6-CS21A59

Estado vigente:

- Frontend CS21A59 en GitHub.
- Backend completo CS21A59 en Drive.
- Producción no verificada.

## Archivos principales

- `src/teacher_cs21a_order_fix.jsx`: visor WebP CS21A58.
- `src/admin_resources_cs21a59.jsx`: menú y panel admin, además de permisos.
- `campus.html`: carga CS21A59.
- `Code.gs` canónico: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.

## Comportamiento obligatorio

Admin/Superadmin:

- Menú `Recursos Didácticos`.
- Subopciones `Libros de texto` y `Audios`.
- Misma vista visual del docente.
- Botón `Actualizar desde Drive` visible en Libros.

Docente:

- Mantiene Libros y Audios.
- No debe ver `Actualizar desde Drive`.

## Sincronización

- Endpoint: `adminBooksRefreshOpenBook`.
- Solo admin/superadmin.
- Actualiza únicamente el nivel y tipo abiertos.
- Reconstruye `pages[]` usando los nombres WebP actuales.
- Orden natural por número del nombre.
- No toca los otros once libros.
- No copia, mueve, renombra ni elimina imágenes.
- No modifica el PDF.

## Prueba inmediata

1. Instalar el `Code.gs` completo CS21A59.
2. Crear una nueva implementación.
3. Publicar frontend y hacer Ctrl+F5.
4. Entrar como admin.
5. Abrir Recursos Didácticos → Libros de texto → B1 → SB.
6. Cambiar el nombre de una imagen en Drive.
7. Pulsar `Actualizar desde Drive`.
8. Confirmar que solo cambia B1/SB.
9. Entrar como docente y confirmar que el botón no aparece.
10. Probar Audios en ambos roles.

## Integridad backend

- Tamaño: `2.906.208` bytes.
- SHA-256: `a3a4b2423c274833deb2f2d4d30859a85e7b1676779b371c395d244f4ab6773d`.
- Respaldo previo: `1yHzOKu0o1kx5SIxI2w2bqW-pxvsMx0Ls`.
- Copia de cierre: `1hT1VgtNcA3eRmw6-_HaWv0s95743PUq8`.

Nunca mover pagos entre niveles o intentos. No tocar pagos, certificados, CONAPE, calendario ni hojas académicas para este módulo.
