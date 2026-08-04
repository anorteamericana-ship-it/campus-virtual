# Revisión manual integral del Campus Virtual

Fecha prevista: 4 de agosto de 2026  
Zona horaria: America/Costa_Rica  
Repositorio: `anorteamericana-ship-it/campus-virtual`  
Base productiva observada al preparar esta guía: `67108928e953fbf044dbcd916dc34a5dd5f1e570` · CS21A142

## 1. Objetivo

Ejecutar una revisión reproducible, paso a paso y con evidencia, sin modificar producción accidentalmente. La sesión debe determinar qué está:

- aprobado;
- aprobado con reserva;
- bloqueado;
- pendiente de implementación.

Esta guía no autoriza fusiones ni despliegues productivos por sí sola.

## 2. Regla principal de seguridad

Durante toda la revisión:

- usar únicamente cuentas, hojas, archivos y URLs marcados como QA o staging;
- no introducir la URL productiva en el frontend QA;
- no usar estudiantes, docentes o pagos productivos para probar escrituras;
- no fusionar PR mientras una prueba crítica esté en estado `FAIL` o `BLOCKED`;
- detenerse inmediatamente si una petición QA apunta a una hoja o deployment productivo.

## 3. Condiciones de detención inmediata

Marcar `STOP` y no continuar si ocurre cualquiera de estas situaciones:

- la URL de Apps Script corresponde al deployment productivo;
- aparece un ID de hoja productiva en el proyecto QA;
- una cuenta histórica o productiva puede iniciar sesión en staging cuando debía estar bloqueada;
- una escritura de prueba aparece en una hoja productiva;
- no existe respaldo verificable de las hojas QA;
- el frontend cae silenciosamente a producción cuando la configuración QA es inválida;
- se detecta exposición de contraseña, token, cédula completa o dato bancario en GitHub o consola compartida.

## 4. Material que debe estar disponible

Antes de iniciar, confirmar:

- acceso al repositorio GitHub;
- acceso a la carpeta privada `QA_STAGING_CAMPUS_2026-07-19`;
- acceso a `QA_APOLLO_G3_STAGING_2026-07-19`;
- acceso a `QA_CAMPUS_OPERATIVO_STAGING_2026-07-19`;
- acceso al documento privado de credenciales QA;
- permiso para crear o administrar un proyecto Apps Script independiente;
- navegador con DevTools;
- carpeta local vacía para descargar el artefacto de staging;
- capturador de pantalla;
- una hoja o documento para registrar resultados.

## 5. Escala de resultados

Usar únicamente estas categorías:

- `PASS`: resultado correcto y demostrado.
- `FAIL`: resultado incorrecto y reproducible.
- `BLOCKED`: no pudo probarse por dependencia faltante.
- `N/A`: no aplica al escenario, con justificación.

No usar “parece funcionar” como resultado.

## 6. Evidencia mínima por prueba

Cada prueba debe registrar:

- código de prueba;
- fecha y hora;
- usuario QA;
- rol;
- navegador y dispositivo;
- URL utilizada, ocultando el identificador sensible si se comparte públicamente;
- dato inicial;
- acción ejecutada;
- resultado esperado;
- resultado observado;
- captura o video;
- filas o registros antes y después, cuando exista escritura;
- `PASS`, `FAIL`, `BLOCKED` o `N/A`;
- observación breve.

Formato sugerido:

| Código | Resultado | Evidencia | Observación |
|---|---|---|---|
| PRE-01 |  |  |  |

---

# PARTE A · Preparación y control de versiones

## A1. Confirmar `main`

1. Abrir GitHub.
2. Entrar al repositorio.
3. Abrir la rama `main`.
4. Copiar el SHA superior.
5. Compararlo con `67108928e953fbf044dbcd916dc34a5dd5f1e570`.
6. Si existe un commit posterior, detener la revisión y actualizar esta guía contra el nuevo `main`.

Resultado esperado: el SHA revisado queda registrado antes de probar cualquier rama.

Código: `PRE-01`.

## A2. Revisar PR abiertos y dependencias

Confirmar los siguientes estados:

- PR #27: continuidad documental CS21A143;
- PR #29: English LAB CS21A144;
- PR #30: limpieza histórica CS21A145;
- PR #32: configuración por ambiente CS21A146;
- PR #33: retiro demo del sílabus CS21A147, dependiente de #32;
- PR #34: artefacto frontend QA CS21A148, dependiente de #32 y #33;
- PR #35: segunda limpieza CS21A149, dependiente de #30;
- PR #36: QA de navegación CS21A150.

Resultado esperado:

- ninguna rama apilada se fusiona antes de su base;
- ningún PR bloqueado se marca listo;
- no existen dos PR activos con el mismo código CS21A.

Código: `PRE-02`.

## A3. Revisar CI

Para cada PR que vaya a revisarse:

1. Abrir la pestaña Checks.
2. Confirmar que el workflow corresponde al SHA actual del head.
3. No aceptar como válido un workflow perteneciente a un commit anterior.
4. Abrir el resumen del supervisor.
5. Descargar la evidencia cuando exista.
6. Registrar P0, P1, P2 y P3.

Resultado esperado:

- P0 = 0;
- P1 = 0 antes de fusionar;
- P2 corregido o aceptado por escrito;
- evidencia asociada al SHA exacto.

Código: `PRE-03`.

---

# PARTE B · Proyecto Apps Script QA independiente

## B1. Crear o abrir el proyecto QA

1. Abrir Apps Script.
2. Crear un proyecto nuevo o confirmar que el proyecto abierto es exclusivamente QA.
3. Nombrarlo de forma inequívoca, por ejemplo `CAMPUS_VIRTUAL_QA_STAGING`.
4. Confirmar que no sea el proyecto productivo.
5. Registrar su Project ID en documentación privada.

Código: `ENV-01`.

## B2. Instalar el backend QA endurecido

1. Abrir en Drive `Code_QA_STAGING_CS21A144_COMPLETO.gs`.
2. Confirmar el SHA-256 documentado:
   `6cd10faee95a76210e9702bdf1082e7e261edb9cd0e0f4c42ca146d20ff312fa`.
3. Copiar el contenido únicamente al proyecto QA.
4. No modificar el backend productivo.
5. Guardar.
6. Ejecutar comprobación de sintaxis.

Código: `ENV-02`.

## B3. Configurar propiedades QA

En Script Properties crear:

- `QA_STAGING_MASTER_ID` con el ID de `QA_APOLLO_G3_STAGING_2026-07-19`;
- `QA_STAGING_OPERATIVO_ID` con el ID de `QA_CAMPUS_OPERATIVO_STAGING_2026-07-19`.

Verificar tres veces que ninguno corresponda a producción.

Código: `ENV-03`.

## B4. Confirmar bloqueo de identidades no QA

Antes de desplegar, revisar que el backend QA:

- acepte identidades `QA-` o `QA_`;
- acepte grupos QA terminados según el convenio de staging;
- rechace identidades históricas no QA;
- bloquee pagos, banco, notas, exámenes, asistencia, cierres y cambios administrativos no requeridos para la prueba de LAB, salvo que se habiliten expresamente en otra fase controlada.

Código: `ENV-04`.

## B5. Crear deployment QA

1. Implementar como aplicación web.
2. Registrar versión y descripción.
3. Configurar quién ejecuta la aplicación según el contrato QA.
4. Configurar acceso únicamente en el alcance necesario.
5. Copiar la URL `/exec`.
6. Guardarla en un documento privado.
7. No pegarla en GitHub.

Código: `ENV-05`.

## B6. Prueba de aislamiento

1. Ejecutar una lectura QA.
2. Confirmar en las hojas QA que no hubo acceso productivo.
3. Intentar una identidad histórica no QA.
4. Confirmar rechazo.
5. Intentar una operación administrativa bloqueada.
6. Confirmar rechazo.

Código: `ENV-06`.

Criterio de aprobación de Parte B: `ENV-01` a `ENV-06` en PASS.

---

# PARTE C · Configuración frontend por ambiente

Esta parte valida el PR #32 antes de considerarlo fusionable.

## C1. URL QA válida

1. Levantar el frontend de la rama del PR #32 o el artefacto correspondiente.
2. Declarar intención QA.
3. Introducir la URL `/exec` QA.
4. Abrir login, campus, ventas e inscripción.
5. Revisar Network.
6. Confirmar que las solicitudes se dirijan al deployment QA.

Código: `CFG-01`.

## C2. Rechazo de URL productiva en modo QA

1. Solicitar ambiente QA.
2. Introducir deliberadamente la URL productiva.
3. Confirmar que el runtime quede inválido.
4. Confirmar que no se envíe ninguna petición productiva.
5. Confirmar mensaje claro de configuración inválida.

Código: `CFG-02`.

## C3. Rechazo de URL arbitraria

1. Introducir una URL que no sea `script.google.com/macros/s/.../exec|dev`.
2. Confirmar bloqueo.
3. Confirmar que no exista fallback a producción.

Código: `CFG-03`.

## C4. Producción predeterminada sin intención QA

Esta prueba debe realizarse sin escrituras:

1. Abrir la entrada normal sin override QA.
2. Confirmar que la configuración se identifica como producción.
3. No ejecutar cambios de datos.
4. Registrar únicamente metadatos y carga inicial.

Código: `CFG-04`.

Criterio de aprobación de Parte C: CFG-01 a CFG-03 en PASS; CFG-04 solo lectura.

---

# PARTE D · Construcción y arranque del frontend QA

Esta parte valida el PR #34 después de #32 y #33.

## D1. Descargar el artefacto correcto

1. Abrir el workflow `QA staging frontend CS21A148` del SHA actual.
2. Descargar el ZIP.
3. Registrar nombre, tamaño y SHA-256.
4. Compararlo con la evidencia del workflow.
5. Descomprimir en una carpeta vacía.

Código: `PKG-01`.

## D2. Verificar contenido

Confirmar:

- existe `qa-setup.html`;
- existe `qa-bootstrap.js`;
- existe el servidor/lanzador documentado;
- `index.html` deriva del `campus.html` vigente;
- no están los archivos históricos excluidos;
- no hay credenciales ni URL QA persistida.

Código: `PKG-02`.

## D3. Iniciar staging

1. Ejecutar `INICIAR_QA_STAGING.cmd` o el comando documentado.
2. Abrir `qa-setup.html`.
3. Introducir únicamente el `/exec` QA.
4. Abrir el Campus.
5. Revisar Network.
6. Confirmar cero solicitudes al deployment productivo.

Código: `PKG-03`.

## D4. Configuración inválida

1. Cerrar la sesión del navegador o limpiar sessionStorage.
2. Abrir staging sin URL QA.
3. Confirmar fallo cerrado.
4. Introducir URL inválida.
5. Confirmar fallo cerrado.

Código: `PKG-04`.

---

# PARTE E · Login y sesiones

Ejecutar en escritorio y móvil.

## E1. Credenciales inválidas

- usuario inexistente;
- contraseña incorrecta;
- cuenta histórica no QA.

Resultado esperado: rechazo sin revelar si la cuenta existe ni detalles internos.

Código: `AUTH-01`.

## E2. Estudiante QA válido

1. Iniciar sesión.
2. Confirmar nombre, código, grupo, nivel y rol.
3. Recargar.
4. Cerrar y reabrir pestaña.
5. Cerrar sesión.
6. Intentar usar la sesión anterior.

Código: `AUTH-02`.

## E3. Docente QA válido

Repetir el flujo anterior y confirmar que solo vea grupos asignados.

Código: `AUTH-03`.

## E4. Superadmin QA válido

Repetir el flujo anterior y confirmar permisos esperados, sin usar datos productivos.

Código: `AUTH-04`.

## E5. Sesión vencida

1. Usar una sesión QA vencida o invalidarla de forma controlada.
2. Recargar una ruta interna.
3. Confirmar retorno seguro a login.
4. Confirmar que no quede contenido sensible visible.

Código: `AUTH-05`.

---

# PARTE F · Estudiante

Ejecutar con una cuenta QA controlada.

## F1. Navegación básica

Abrir y alternar dos veces:

- Mi Campus;
- Mi curso;
- Evaluaciones;
- Pagos y estado de cuenta;
- Certificados;
- Documentos y ayuda;
- Club I CAN, si corresponde;
- English LAB;
- English LAB Live.

Después:

- recargar cada superficie crítica;
- usar Atrás cuando exista historial;
- comprobar móvil;
- comprobar que no aparezcan menús administrativos.

Código: `STU-01`.

## F2. Cronograma

Confirmar:

- 32 lecciones del nivel;
- fechas correctas;
- feriados y suspensiones;
- nivel activo;
- ausencia de materiales y tareas dentro del calendario si la regla vigente los separa;
- zona horaria Costa Rica.

Código: `STU-02`.

## F3. Libros y audios

Confirmar:

- acceso según nivel;
- SB, TB y WB según contrato;
- U01 a U16;
- apertura de PDF;
- descarga cuando esté autorizada;
- audio correcto;
- permisos reales de Drive;
- mensaje claro si falta permiso.

Código: `STU-03`.

## F4. Evaluaciones y resumen

Confirmar:

- evaluaciones del nivel;
- notas reales del expediente QA;
- nota mínima y estado;
- progreso de lecciones;
- asistencia;
- ausencia de datos demo.

Código: `STU-04`.

## F5. Restricción por estado

Probar estudiantes QA con:

- nivel `CA`;
- nivel futuro `PE`;
- cuenta pendiente;
- sin matrícula activa.

Confirmar que cada uno vea solo lo permitido.

Código: `STU-05`.

---

# PARTE G · English LAB

Validar el PR #29 únicamente contra staging.

## G1. QA-STU-001

Condición esperada: B1 `CA`, cuenta al día.

1. Iniciar sesión.
2. Abrir English LAB.
3. Confirmar autorización.
4. Entrar a una sala `LAB-####` válida.
5. Responder.
6. Confirmar ranking.

Código: `LAB-01`.

## G2. QA-STU-002

Condición esperada: B1 `CA`, cuenta pendiente.

Resultado esperado: acceso denegado con explicación segura.

Código: `LAB-02`.

## G3. QA-STU-003

Condición esperada: sin matrícula activa.

Resultado esperado: acceso denegado.

Código: `LAB-03`.

## G4. QA-STU-004

Condición esperada: cuenta al día y grupo distinto.

Resultado esperado: puede entrar a la misma sala que QA-STU-001.

Código: `LAB-04`.

## G5. Manipulación de identidad

1. Abrir DevTools.
2. Intentar modificar `player_id`.
3. Intentar modificar `player_name`.
4. Enviar respuesta.
5. Confirmar que backend conserve identidad de sesión.

Código: `LAB-05`.

## G6. Concurrencia

1. Abrir dos pestañas con la misma cuenta.
2. Enviar la misma respuesta casi simultáneamente.
3. Confirmar que no se duplique puntaje.
4. Repetir con dos estudiantes en sala mixta.

Código: `LAB-06`.

---

# PARTE H · Docente

## H1. Menú y grupos

Confirmar:

- Mi Perfil;
- Mis Grupos;
- Biblioteca del Programa;
- Exámenes;
- Cronograma Inglés Conversacional;
- Club I CAN;
- Comunicados;
- Mis pendientes.

Alternar dos veces, recargar y probar móvil.

Código: `TEA-01`.

## H2. Grupo asignado

1. Abrir un grupo QA.
2. Confirmar estudiantes correctos.
3. Confirmar horario y nivel.
4. Cambiar a otro grupo QA si existe.
5. Confirmar que no aparezcan grupos ajenos.

Código: `TEA-02`.

## H3. Fecha Costa Rica

Ejecutar cerca o después de las 6:00 p. m. de Costa Rica si es posible.

1. Abrir Mis Grupos.
2. Confirmar la lección de hoy.
3. Comparar con cronograma QA.
4. Confirmar que no se seleccione el día UTC siguiente.

Código: `TEA-03`.

## H4. Clase y asistencia

Solo si el backend QA habilita expresamente estas escrituras:

1. Capturar estado inicial.
2. Iniciar una clase.
3. Pulsar dos veces rápidamente.
4. Confirmar una sola sesión.
5. Intentar abrir una segunda clase.
6. Confirmar rechazo.
7. Registrar asistencia completa.
8. Cerrar.
9. Confirmar estado final en hoja QA.

Código: `TEA-04`.

## H5. Materiales y libro contextual

1. Abrir Biblioteca del Programa.
2. Probar B1, B2, I1 e I2 según disponibilidad.
3. Probar SB, TB y WB.
4. Probar U01 a U16.
5. Desde detalle de lección, usar Ver en Libro.
6. Confirmar nivel, libro y unidad correctos.
7. Cambiar manualmente de unidad.
8. Confirmar que no se repita el salto contextual.

Código: `TEA-05`.

---

# PARTE I · Superadmin

## I1. Navegación

Alternar dos veces:

- Panel Maestro;
- Consulta individual;
- Calendario académico;
- Supervisión;
- Grupos;
- Estudiantes;
- Matrículas;
- Exámenes;
- Auditoría académica;
- Prematrículas;
- Solicitudes;
- CONAPE y Cobranza;
- Importar banco;
- Aplicar pago;
- Reportes;
- Diagnóstico interno;
- Permisos y roles.

Confirmar que opciones “Pronto” no parezcan funcionales.

Código: `ADM-01`.

## I2. Estudiantes y proyección

1. Abrir expediente QA en `CA`.
2. Abrir la proyección de siguiente nivel.
3. En otra pestaña cambiar el estado origen de forma controlada, si QA lo permite.
4. Volver y confirmar.
5. Resultado esperado: conflicto; no proyectar desde estado obsoleto.

Código: `ADM-02`.

## I3. Último desembolso CONAPE

1. Abrir un expediente QA con desembolso.
2. Cambiar o agregar un desembolso en la fuente QA.
3. Refrescar la ficha o ejecutar la acción prevista.
4. Confirmar que la fecha mostrada no quede obsoleta.

Código: `ADM-03`.

## I4. Sincronización CONAPE parcial

Simular o producir en QA una respuesta con `conape_sync === false`.

Resultado esperado:

- no mostrar éxito total;
- informar fallo parcial;
- conservar trazabilidad;
- permitir reintento seguro.

Código: `ADM-04`.

## I5. Banco y pagos

Solo en QA:

1. importar un movimiento único;
2. reimportar el mismo movimiento;
3. confirmar que no se duplique;
4. aplicar a estudiante QA;
5. confirmar asiento y saldo;
6. intentar aplicar dos veces;
7. confirmar idempotencia o bloqueo.

Código: `ADM-05`.

## I6. Certificado

Probar expediente QA:

- APR;
- nota igual o mayor a 70;
- morosidad NO.

Luego probar condiciones inválidas.

Confirmar consecutivo único y registro de emisión.

Código: `ADM-06`.

---

# PARTE J · Club I CAN

El backend observado no confirma todos los endpoints requeridos. Esta sección puede quedar `BLOCKED` hasta implementarlos.

## J1. Consulta estudiante

Confirmar si funciona mediante fallback `getICANEstudiante`.

Código: `ICAN-01`.

## J2. Reserva

Probar:

- reservar una sesión;
- reservar una segunda cuando no está permitido;
- último cupo con dos estudiantes simultáneos;
- cancelación;
- nueva reserva después de cancelar;
- recarga y persistencia.

Código: `ICAN-02`.

## J3. Docente

Confirmar:

- lista de inscritos;
- grupo y sesión;
- estado de reserva;
- asistencia;
- actualización después de cancelación.

Código: `ICAN-03`.

Si faltan `reservarICANSesionEstudiante`, `cancelarReservaICANEstudiante` o `getICANDocenteReservas`, marcar BLOCKED y no presentar I CAN como completo.

---

# PARTE K · Navegación automática CS21A150

Revisar el PR #36.

1. Confirmar que el título sea CS21A150.
2. Confirmar que solo modifique `scripts/virtual_review_browser.mjs`.
3. Abrir el workflow del head actual.
4. Confirmar:
   - selectores visibles;
   - menú móvil abierto antes de navegación;
   - nombres vigentes;
   - recarga directa;
   - deduplicación;
   - recursos externos separados;
   - Atrás no clasificado como fallo cuando no existe historial.
5. Descargar artefacto.
6. Revisar las seis capturas.
7. Registrar veredicto del supervisor.

Código: `AUTO-01`.

Criterio mínimo: P0 = 0 y P1 = 0.

---

# PARTE L · Limpieza histórica

## L1. PR #30

1. Verificar respaldo y hashes.
2. Confirmar que los seis archivos no se cargan.
3. Confirmar que sus reemplazos canónicos existen.
4. Confirmar eliminación del CSS inexistente en ventas.
5. Ejecutar CI actual.

Código: `CLN-01`.

## L2. PR #35

Solo después de #30:

1. rebase sobre `main` actualizado;
2. verificar respaldo y hashes;
3. confirmar ausencia de cinco archivos;
4. confirmar que `calendar88_selftest.js` se conserva;
5. ejecutar CI completo.

Código: `CLN-02`.

---

# PARTE M · Cierre de la revisión

## M1. Clasificar hallazgos

- P0: pérdida de datos, acceso indebido, producción afectada o seguridad crítica.
- P1: función crítica rota, login roto o escritura inconsistente.
- P2: defecto importante con workaround o deuda relevante.
- P3: mejora, diagnóstico o inconsistencia menor.

Código: `CLS-01`.

## M2. Decisión por PR

Para cada PR registrar:

| PR | SHA revisado | CI | Manual | Decisión | Motivo |
|---:|---|---|---|---|---|
| 27 |  |  |  |  |  |
| 29 |  |  |  |  |  |
| 30 |  |  |  |  |  |
| 32 |  |  |  |  |  |
| 33 |  |  |  |  |  |
| 34 |  |  |  |  |  |
| 35 |  |  |  |  |  |
| 36 |  |  |  |  |  |

Decisiones permitidas:

- listo para revisión;
- listo para fusionar;
- requiere cambios;
- bloqueado por staging;
- cerrar como duplicado.

Código: `CLS-02`.

## M3. Criterio de piloto

No autorizar piloto hasta que se cumpla todo:

- staging aislado operativo;
- backend QA identificado;
- P0 = 0;
- P1 = 0;
- login real de estudiante, docente y superadmin;
- permisos Drive probados;
- escrituras críticas probadas en QA;
- English LAB validado;
- I CAN completo o formalmente excluido del piloto;
- backup disponible;
- rollback documentado;
- soporte asignado;
- evidencia archivada.

Código: `CLS-03`.

## M4. Informe final

El informe debe incluir:

1. SHA de `main`;
2. PR y SHA de cada rama;
3. ambiente utilizado;
4. versión del backend QA;
5. pruebas PASS, FAIL y BLOCKED;
6. P0, P1, P2 y P3;
7. riesgos aceptados;
8. cambios requeridos;
9. orden recomendado de fusión;
10. decisión de piloto.

Código: `CLS-04`.

---

# Resumen de la sesión manual

| Bloque | Estado |
|---|---|
| Preparación GitHub |  |
| Apps Script QA |  |
| Runtime config |  |
| Artefacto staging |  |
| Login y sesiones |  |
| Estudiante |  |
| English LAB |  |
| Docente |  |
| Superadmin |  |
| Club I CAN |  |
| QA automático |  |
| Limpieza histórica |  |
| Criterio de piloto |  |

## Resultado general

- [ ] APTO
- [ ] APTO CON RESERVAS
- [ ] BLOQUEADO
- [ ] INDETERMINADO

Responsable de la revisión: __________________________  
Fecha y hora de cierre: ______________________________  
Firma o aprobación: __________________________________
