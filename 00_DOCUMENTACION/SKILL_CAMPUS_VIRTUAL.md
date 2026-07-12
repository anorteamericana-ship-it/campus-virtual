# SKILL OPERATIVA — CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA

## Forma obligatoria de trabajo

- Responder en español directo para una persona que trabaja por copy/paste.
- Antes de modificar, indicar si afecta frontend, Apps Script o ambos y nombrar archivos exactos.
- Con acceso a GitHub, hacer los cambios directamente.
- Si Apps Script cambia, entregar un único `Code.gs` completo.
- Mantener `00_DOCUMENTACION` como fuente verdadera.
- Diferenciar guardado, respaldado, instalado y desplegado.
- No afirmar producción sin prueba real.

## Riesgo alto

Analizar antes de tocar pagos, certificados, `DATOS`, `ESTATUS`, `GRUPOS`, `INTENTOS_ACADEMICOS`, CONAPE o calendario. Nunca mover pagos entre niveles o intentos.

## Continuidad vigente

- Frontend: F98.4-Z6-CS21A58.
- Backend completo: F98.4-Z6-CS21A58.
- Base preservada: CS21A56 / CS21A46.
- Producción no verificada.
- Backend completo y respaldos en Drive; frontend, manifiesto y documentación en GitHub.

## Regla para Code.gs

1. Leer siempre el archivo canónico indicado en `AppsScript/README.md`.
2. Crear respaldo antes de modificar.
3. Trabajar sobre la versión vigente, nunca sobre un respaldo antiguo.
4. Entregar `Code.gs` completo.
5. Recalcular tamaño, saltos de línea y SHA-256.
6. Actualizar el manifiesto operativo de Drive y la documentación canónica.
7. No asumir despliegue después de guardar en Drive.

## Visor de libros por imágenes

- Componente: `src/teacher_cs21a_order_fix.jsx` CS21A58.
- Endpoint: `teacherBooksOpenImageBook`.
- No usar PDF.js en esta pantalla.
- Cargar únicamente las dos hojas visibles.
- Precargar solo las dos hojas del siguiente pliego.
- El orden se toma de `book.json.pages[]`.
- Nunca calcular la página siguiente a partir del número del nombre del archivo.
- Emparejar por posiciones: `0+1`, `2+3`, `4+5`.
- Si falta un número original, continuar por orden del arreglo.
- Si el total es impar, mostrar hoja vacía al final.
- Abrir cualquier libro en el primer pliego.
- Al cambiar nivel o tipo, volver al primer pliego.
- Mantener anterior, siguiente, zoom, pantalla completa y `Actualizar desde Drive`.
- Mantener el PDF oficial solo para Abrir/Descargar.
- No mostrar panel lateral interno ni la lista antigua de Drive.

## Unidades

- U01–U16 aparece únicamente en SB.
- U01 brilla mientras no exista selección.
- El mapa es provisional por nivel y se ajusta con QA visual.
- La búsqueda usa `source_page` y después forma el pliego por posición del arreglo.
- No aplicar el mapa SB a TB o WB.

## Acceso

- Docente/admin: SB, TB y WB.
- Estudiante: SB y WB.
- TB debe permanecer fuera de la vista estudiantil.
- La integración estudiantil se realiza después de cerrar QA docente.

## Drive

- Raíz de imágenes: `1nw_kPwqWDWdnP-5M3E9B57Q0nmyUCdDK`.
- Catálogo general: `1UTeCZQpLoEsdJkm3_kQRqni19uuZBTuO`.
- Total vigente: 2.051 páginas WebP.
- Los tres `book.json` de B1 ya están uniformados.
- No volver a subir PDF duplicados ni `build-stamp.json` como contenido del Campus.

## Seguimiento inmediato

- Columnas: `Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | WhatsApp`.
- Solo desembolso académico 01.
- 02/03+ no cierran el 01.
- Sin scroll horizontal.
- WhatsApp visible.

## Consulta individual, pagos y certificados

- Usar lectura fresca después de una escritura.
- Aplicar pago usa el motor oficial; frontend no escribe hojas.
- Mantener bloqueo, `REQUEST_ID`, journal e idempotencia.
- Certificado pagado y documento emitido son independientes.

## Checklist de cierre

1. Confirmar base real de GitHub y `Code.gs` canónico de Drive.
2. Nombrar impacto y archivos.
3. Validar sintaxis.
4. Revisar cache-busting.
5. Actualizar Fuente, Readme, Biblia, Skill, Prompt, Manifiesto y AppsScript README.
6. Crear respaldo previo y copia de cierre.
7. Entregar solo los archivos modificados.
8. No declarar despliegue sin prueba.
