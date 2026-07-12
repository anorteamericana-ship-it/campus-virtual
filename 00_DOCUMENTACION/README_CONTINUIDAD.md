# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral/frontend:** F98.4-Z6-CS21A58  
**Backend completo:** F98.4-Z6-CS21A58  
**Base preservada:** CS21A56 / CS21A46  
**Producción:** no verificada  
**Corte:** 12-jul-2026

## Cambio vigente

Ruta: Docente → Recursos Didácticos → Libros de texto / Biblioteca digital.

- El visor usa páginas WebP y ya no procesa el PDF en el navegador.
- Carga las dos hojas visibles y precarga las dos siguientes.
- Los pliegos se forman por el orden de `pages[]`, no por números consecutivos.
- Todo libro inicia con `pages[0]` y `pages[1]`.
- Si falta una página original, el orden visual continúa con la siguiente entrada.
- U01 brilla hasta que se selecciona una unidad.
- U01–U16 aparece únicamente en SB.
- Cambiar nivel o tipo vuelve al inicio.
- El mapa de unidades es provisional y requiere prueba visual.
- Abrir/Descargar conserva el PDF oficial.

## Drive

- Total corregido: 2.051 páginas WebP.
- B1: 492; B2: 528; I1: 514; I2: 517.
- Los tres `book.json` de B1 fueron uniformados sin cambiar imágenes ni orden.
- La carpeta de imágenes tiene acceso de lectura mediante enlace.

## Apps Script

- Endpoint nuevo: `teacherBooksOpenImageBook`.
- Docente/admin: SB, TB y WB.
- Estudiante: SB y WB; TB bloqueado.
- Cambio de solo lectura.
- Los endpoints PDF anteriores se conservan por compatibilidad.

## Archivos modificados

- `src/teacher_cs21a_order_fix.jsx`
- `campus.html`
- `Code.gs` completo
- documentación canónica
- catálogo general y tres `book.json` de B1

## Integridad backend

- Tamaño: 2.899.463 bytes.
- SHA-256: `d3505496b8e953d4fd0849a7a5af102760a452caa43d41bc9a7055006897ca87`.
- Producción no verificada.

## Pruebas

1. Instalar y desplegar el `Code.gs` CS21A58.
2. Publicar frontend y hacer Ctrl+F5.
3. Abrir B1 → SB y confirmar hojas 1–2.
4. Confirmar brillo de U01.
5. Probar U01–U16 en los cuatro niveles y reportar desfases.
6. Confirmar navegación por pares y descarga del PDF oficial.

## Reglas preservadas

- Solo desembolso académico 01 en seguimiento inmediato.
- 02/03+ no cierran el 01.
- Nunca mover pagos entre niveles o intentos.
