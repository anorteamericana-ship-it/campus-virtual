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

- Frontend: F98.4-Z6-CS21A57.
- Backend completo: F98.4-Z6-CS21A56.
- Base backend preservada: CS21A46.
- Producción no verificada.
- El backend canónico y sus respaldos se mantienen en Drive; GitHub conserva frontend, manifiesto y documentación.

## Regla para Code.gs

1. Leer siempre el archivo canónico indicado en `AppsScript/README.md`.
2. Crear copia en `00_BACKUPS_CODE_GS` antes de modificar.
3. Trabajar sobre la versión vigente, nunca sobre un respaldo anterior.
4. Entregar el `Code.gs` completo cuando haya cambio backend.
5. Recalcular tamaño y SHA-256.
6. No asumir despliegue después de actualizar Drive.

## Docente / Recursos Didácticos / Libros de texto

- Componente vigente: `src/teacher_cs21a_order_fix.jsx` CS21A57.
- Backend lector vigente: CS21A56 con `teacherBooksOpenPdf` y `teacherBooksReadRange`.
- `campus.html` carga PDF.js antes del componente y actualiza cache-busting.
- Todo libro inicia en PDF 1.
- La portada debe mostrarse sola a la derecha; no emparejar PDF 1 con PDF 2.
- Secuencia de pliegos: portada; 2–3; 4–5; 6–7; etc.
- El botón U01 debe brillar mientras no exista una unidad seleccionada.
- Cambiar nivel o SB/TB/WB vuelve a la portada y reactiva la invitación U01.
- U01–U16 pertenece únicamente a Student Book.
- Fuente impresa: Apollo G3 → `DETALLE DEL PROGRAMA` → columna K.
- Inicios SB: `2, 8, 16, 22, 30, 36, 44, 50, 58, 64, 72, 78, 86, 92, 100, 106`.
- No asumir un desfase PDF común:
  - B1 `+5`.
  - B2 `+20`.
  - I1 `+6`.
  - I2 `+8`.
- B1 U01 apunta a PDF 7 y se muestra en pliego 6–7.
- No aplicar el mapeo SB a TB o WB.
- Mantener `Actualizar desde Drive`.
- Mantener PDF a todo el ancho, dos páginas, navegación, zoom y pantalla completa.
- No mostrar panel lateral interno ni volver a la lista antigua de Drive.
- B1/SB activo: `1zVPOGcCca5Ti8M8LtCpEO65-bO0m2_oF` dentro de `1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH`.

## Seguimiento inmediato

- Columnas: `Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | WhatsApp`.
- Solo desembolso académico `01`.
- `02/03+` no cierran el `01`.
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
6. Entregar solo los archivos modificados.
7. No declarar despliegue sin prueba.