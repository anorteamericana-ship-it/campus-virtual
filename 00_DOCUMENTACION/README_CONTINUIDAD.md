# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral:** F98.4-Z6-CS21A51  
**Frontend GitHub:** CS21A51  
**Backend completo objetivo:** CS21A46  
**Producción:** no verificada  
**Corte:** 11-jul-2026

## Cambio vigente CS21A51

Docente → Recursos Didácticos → Libros de texto:

- SB, TB y WB mantienen botones visibles, con colores y estados activos diferenciados.
- Student Book muestra una botonera U01–U16.
- Cada unidad usa la primera página indicada en `APOLLO_G3_LIMPIO_21-04-26`, pestaña `DETALLE DEL PROGRAMA`, columna K `Páginas SB`.
- El visor suma 6 páginas a la numeración académica por las hojas iniciales adicionales del PDF.
- Inicio SB: `U01 2 | U02 8 | U03 16 | U04 22 | U05 30 | U06 36 | U07 44 | U08 50 | U09 58 | U10 64 | U11 72 | U12 78 | U13 86 | U14 92 | U15 100 | U16 106`.
- Destino PDF: `U01 8 | U02 14 | U03 22 | U04 28 | U05 36 | U06 42 | U07 50 | U08 56 | U09 64 | U10 70 | U11 78 | U12 84 | U13 92 | U14 98 | U15 106 | U16 112`.
- CS21A50 cambiaba el hash del visor Google Drive, pero `Drive /preview` ignoraba `#page` y seguía abriendo la portada.
- CS21A51 abre SB mediante la URL directa del PDF y el visor nativo del navegador, que recibe la página PDF real.
- La botonera no se aplica a TB ni WB porque la fuente solo define páginas para SB.

Archivos modificados:

- `src/teacher_cs21a_order_fix.jsx`
- `campus.html`
- documentación canónica.

Apps Script no cambió.

## Continuidad anterior preservada

- CS21A46 quedó originalmente solo como ZIP y no está almacenado en GitHub.
- CS21A49 consolidó el componente, estilos y reglas de Seguimiento inmediato CONAPE.

## Seguimiento inmediato

Orden:

`Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | WhatsApp`

- Solo desembolsos académicos `01`.
- `02`, `03` y superiores quedan en auditoría y no cierran el `01`.
- Código primero, grande y seleccionable.
- Datos de vínculo y grupo dentro de Estudiante.
- Sin columnas Desembolso ni Detectado.
- Resumen desde `6-historial`, un nivel debajo del otro.
- Sin scroll horizontal.
- WA visible con `1 Mensaje`, `2 Alerta`, `3 Atención`.
- Cerrados quedan en bloque inferior y no envían cobro.

## Backend requerido

CS21A46 interpreta `FECHA_ULT_DESEMBOLSO` como número/mes/año y conserva solo `01` en el panel.

- Tamaño declarado: 2,879,996 bytes.
- SHA-256 declarado: `6cd638901f75ff56c4bc5f100be0203de05f82aa01a8b1f838f2c95bc7433568`.
- Despliegue no verificado.

## Pruebas obligatorias

1. Docente → Libros de texto → Básico I → SB → U09 debe mostrar el contenido de la página SB 58, ubicada en la página PDF 64.
2. Confirmar U01 en contenido SB 2 / PDF 8 y U16 en contenido SB 106 / PDF 112.
3. Confirmar los 16 saltos en B1, B2, I1 e I2.
4. Confirmar que TB y WB no muestran una navegación de páginas SB.
5. Solo movimientos CONAPE `01/MM/AAAA`.
6. Un `02/03+` no aparece ni cierra el `01`.
7. Cédula `119960973`: cuatro niveles verticales.
8. Estudiante `17110`: lectura fresca y certificado pagado separado de documento por emitir.
