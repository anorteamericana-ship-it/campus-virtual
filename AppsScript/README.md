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

## Cambio backend CS21A56

- Conserva `teacherBooksOpenPdf` y `teacherBooksReadRange`.
- Resuelve el archivo en vivo dentro de la carpeta oficial.
- B1/SB prioriza `1zVPOGcCca5Ti8M8LtCpEO65-bO0m2_oF` mientras permanezca dentro de `1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH`.
- Continúa excluyendo ORIGINAL, COPIA, COPY, BACKUP, RESPALDO, OLD y ANTIGUO.
- Es un cambio de solo lectura.
- No modifica pagos, certificados, CONAPE, calendario, DATOS, ESTATUS, GRUPOS ni INTENTOS_ACADEMICOS.

## Frontend relacionado

F98.4-Z6-CS21A57 modifica únicamente:

- `src/teacher_cs21a_order_fix.jsx`
- `campus.html`

CS21A57 no cambia Apps Script. Corrige el armado de pliegos:

- todo libro inicia en PDF 1;
- portada sola a la derecha;
- siguientes pliegos 2–3, 4–5, 6–7;
- U01 brilla hasta la primera selección;
- desfases reales: B1 `+5`, B2 `+20`, I1 `+6`, I2 `+8`;
- B1 U01 muestra pliego 6–7.

## Forma obligatoria de trabajo

1. Leer el archivo canónico anterior desde Drive.
2. Verificar tamaño y hash.
3. Crear copia versionada en la carpeta de respaldos antes de modificar backend.
4. Reemplazar los bytes del mismo archivo canónico conservando su ID.
5. Recalcular tamaño y SHA-256.
6. Entregar un único `Code.gs` completo cuando cambie Apps Script.
7. No afirmar despliegue sin prueba real.

## Funciones preservadas

- Consulta individual fresca.
- Pago de certificado separado de emisión.
- Pagos con controles de integridad.
- Lectura directa de `7-morosidad`.
- Resumen desde `6-historial`.
- No mover pagos entre niveles o intentos.
- No crear automatizaciones nuevas de CONAPE.