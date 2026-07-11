# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral/frontend:** F98.4-Z6-CS21A54  
**Backend completo canónico:** CS21A46  
**Producción:** no verificada  
**Corte:** 11-jul-2026

## Cambio vigente CS21A54

Ruta: Docente → Recursos Didácticos → Libros de texto / Biblioteca digital.

- Se elimina el panel lateral interno de niveles.
- Nivel, SB/TB/WB, unidades y acciones quedan arriba en controles horizontales.
- El visor PDF.js de dos páginas ocupa todo el ancho disponible debajo.
- Se agrega botón `Pantalla completa`.
- No existe retorno automático a la vista anterior de carpeta Drive.
- Si PDF.js no puede leer Drive, aparece un error controlado con `Abrir en Drive` y `Descargar PDF`; no se monta el panel anterior.
- El PDF queda en caché de memoria y U01–U16 solo cambia las páginas renderizadas.
- U01–U16 pertenece únicamente a SB.
- Fuente pedagógica: `APOLLO_G3_LIMPIO_21-04-26` → `DETALLE DEL PROGRAMA` → columna K `Páginas SB`.
- Inicio SB: `2, 8, 16, 22, 30, 36, 44, 50, 58, 64, 72, 78, 86, 92, 100, 106`.
- Destino PDF +6: `8, 14, 22, 28, 36, 42, 50, 56, 64, 70, 78, 84, 92, 98, 106, 112`.
- B1 U09 debe mostrar PDF 64–65.

## Fuente de libros

- B1 SB activo: `Interchange 5th intro-SB.pdf`, ID `1pnR7RoJGkZnx08TlfrEgxEqVRnlrCwea`.
- El ID `13rMmy1ZLpto6SgjSyVyBd3MtivuU19j3` corresponde al archivo `ORIGINAL` y está excluido.
- Totales SB: B1 157, B2 188, I1 158, I2 161.
- Subir otro PDF crea otro ID; para actualizar sin código debe preservarse el ID del archivo canónico.
- La resolución automática por carpeta requiere cambio backend y sigue pendiente.

Archivos funcionales modificados:

- `src/teacher_cs21a_order_fix.jsx`
- `campus.html`
- documentación canónica

## Backend canónico localizado y verificado

- Carpeta maestra Drive: `1XITxPmwGJRDqgplj0AjbhfbjzaoIvL-a`.
- Archivo canónico: `Code.gs`.
- Drive file ID: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`.
- Versión: `F98.4-Z6-CS21A46`.
- Tamaño exacto: `2,879,996` bytes.
- SHA-256 verificado: `6cd638901f75ff56c4bc5f100be0203de05f82aa01a8b1f838f2c95bc7433568`.
- Conteo físico: `50,122` saltos de línea y línea final vacía; algunos editores muestran `50,123`.
- Carpeta de respaldos: `00_BACKUPS_CODE_GS`, ID `1OHyjrubHJfeBOxx0kfYm0cWrM5xtyOZr`.
- Respaldo inicial: `Code_F98_4_Z6_CS21A46_COMPLETO_2026-07-11.gs`, ID `1sJJ9umm5tGoMGibIoQiIECGYFZ91ErCT`.
- Manifiesto Drive: `README_BACKEND_ACTUAL.txt`, ID `179pqbUFMPiOUN6Lo3YA_Ia51lKtqtP8u`.
- Regla futura: antes de modificar, crear copia versionada; después, reemplazar el contenido del mismo `Code.gs` canónico preservando su ID.
- Nunca usar CS21A42 ni otro archivo de menor tamaño/hash como base.
- Drive actualizado no significa Apps Script desplegado.

Apps Script no fue modificado en esta verificación.

## Seguimiento inmediato preservado

Orden: `Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | WhatsApp`.

- Solo desembolsos académicos `01`.
- `02`, `03` y superiores no aparecen ni cierran el `01`.
- Resumen vertical desde `6-historial`.
- Sin scroll horizontal.
- WA visible con `Mensaje`, `Alerta` y `Atención`.

## Pruebas obligatorias

1. Confirmar que no aparece ningún panel lateral interno ni lista antigua de Drive.
2. Confirmar que el PDF ocupa todo el ancho de la zona de contenido.
3. Confirmar dos páginas enfrentadas y pantalla completa.
4. Confirmar B1 → SB → U09 = PDF 64–65.
5. Confirmar que cambiar unidad no recarga el documento completo.
6. Resolver `Failed to fetch` mediante el backend canónico CS21A46, sin degradar reglas CONAPE.
7. Confirmar reglas CONAPE `01` y estudiante `17110`.