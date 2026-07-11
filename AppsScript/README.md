# Apps Script — backend completo de continuidad

## Versión canónica

`F98.4-Z6-CS21A56`

Base preservada: `F98.4-Z6-CS21A46`. Versión anterior preservada: `F98.4-Z6-CS21A55`.

El archivo productivo se reemplaza siempre completo. El backend grande se conserva en Drive y no se almacena dentro de GitHub.

## Ubicación canónica

- Carpeta de trabajo: `1XITxPmwGJRDqgplj0AjbhfbjzaoIvL-a`
- Archivo vigente `Code.gs`: `1j9ps9kzNg1cGioytJyy8ohAzrnOis9f3`
- Carpeta de respaldos: `1OHyjrubHJfeBOxx0kfYm0cWrM5xtyOZr`
- Manifiesto operativo de Drive: `README_BACKEND_ACTUAL.txt`

## Integridad CS21A56

- Tamaño: `2,889,401` bytes
- SHA-256: `eef075af1db53608b68f9a76ad0ea5ba4440c0a20bed8a545c62a99cab2d9a2c`
- Saltos de línea: `50,291`
- Sintaxis: validada mediante copia JavaScript y `node --check`.
- Producción: no verificada.

## Respaldo previo

Antes de CS21A56 se creó una copia completa de CS21A55:

- Archivo: `Code_F98_4_Z6_CS21A55_COMPLETO_ANTES_CS21A56_2026-07-11.gs`
- Drive ID: `1tkxE2BcaDEyIprmvzks9A1x_CF4punuM`

## Cambio CS21A56

- Conserva `teacherBooksOpenPdf` y `teacherBooksReadRange`.
- Elimina la caché de cinco minutos del ID resuelto de SB/TB/WB.
- Resuelve el archivo en vivo dentro de la carpeta oficial en cada apertura/refresco.
- B1/SB prioriza `1zVPOGcCca5Ti8M8LtCpEO65-bO0m2_oF` únicamente mientras permanezca dentro de `1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH`.
- Si el ID preferente desaparece, usa el PDF válido más reciente de la carpeta.
- Continúa excluyendo ORIGINAL, COPIA, COPY, BACKUP, RESPALDO, OLD y ANTIGUO.
- Entrega el primer bloque del PDF y rangos posteriores para `PDFDataRangeTransport`.
- Es un cambio de solo lectura.
- No modifica pagos, certificados, CONAPE, calendario, DATOS, ESTATUS, GRUPOS ni INTENTOS_ACADEMICOS.

## Frontend relacionado

F98.4-Z6-CS21A56 modifica:

- `src/teacher_cs21a_order_fix.jsx`
- `campus.html`

El frontend fuerza resolución nueva al entrar/cambiar nivel o tipo, actualiza el ID de respaldo B1/SB y añade `Actualizar desde Drive`. U01–U16 conserva el PDF abierto y solo cambia páginas.

## Forma obligatoria de trabajo

1. Leer el archivo canónico anterior desde Drive.
2. Verificar tamaño y hash.
3. Crear copia versionada en la carpeta de respaldos.
4. Modificar el archivo completo.
5. Reemplazar los bytes del mismo archivo canónico, conservando su ID.
6. Recalcular tamaño y SHA-256.
7. Entregar un único `Code.gs` completo.
8. No afirmar despliegue sin prueba real.

## Funciones preservadas

- Consulta individual fresca.
- Pago de certificado separado de emisión.
- Pagos con controles de integridad.
- Lectura directa de `7-morosidad`.
- Resumen desde `6-historial`.
- No mover pagos entre niveles o intentos.
- No crear automatizaciones nuevas de CONAPE.
