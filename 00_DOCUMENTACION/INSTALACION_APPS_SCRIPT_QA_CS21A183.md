# Instalación segura de CS21A183 en Apps Script QA

Fecha: 2026-08-06  
Destino exclusivo: proyecto Apps Script de staging English LAB  
Producción: prohibido

## Por qué se instala en un solo archivo

Apps Script carga todos los archivos del proyecto en el mismo espacio global. CS21A183 extiende funciones ya creadas por CS21A180 y CS21A181, por lo que el orden importa.

Para no depender del orden de dos archivos nuevos, **99 y 99B se pegan dentro de un único archivo Apps Script**, en este orden exacto:

1. contenido completo de `99_ACTUALIZACION_QA_CS21A183.gs`;
2. inmediatamente debajo, contenido completo de `99B_VALIDACION_CURRICULAR_CS21A183.gs`.

Los archivos separados del repositorio son las fuentes auditables. No se crean como dos archivos separados dentro de Apps Script QA.

## Prerrequisitos obligatorios

El proyecto QA debe conservar:

1. backend staging CS21A144;
2. actualización reutilizable CS21A176/180 en `97_ACTUALIZACION_QA.gs`;
3. UX Memory Match CS21A181 en `98_ACTUALIZACION_QA_CS21A181.gs`;
4. propiedades QA apuntando exclusivamente a:
   - Apollo QA: `1dud749W7dJaYkD7l2C3-CKmbrCx5mG_pahTOYrHLsvE`;
   - Campus Operativo QA: `1aPYBZOs8zxF2n9cDOeKazhSXHRfhqyLs8pDM0axt8U0`.

No continuar si el proyecto o las propiedades apuntan a producción.

## Procedimiento

1. Abrir únicamente el proyecto Apps Script QA de English LAB.
2. Confirmar visualmente que no es el proyecto productivo.
3. Crear **un solo archivo** con el nombre:

   `99_CS21A183_SENTENCE_ORDER_COMPLETO`

4. Abrir `apps_script_patches/99_ACTUALIZACION_QA_CS21A183.gs` en el PR #54.
5. Copiar su contenido completo y pegarlo al inicio del archivo nuevo.
6. Dejar dos líneas en blanco.
7. Abrir `apps_script_patches/99B_VALIDACION_CURRICULAR_CS21A183.gs`.
8. Copiar su contenido completo y pegarlo inmediatamente después de 99.
9. Confirmar que el archivo comienza con:

   `// CS21A183 · CAPA ADITIVA QA PARA ENGLISH LAB LIVE`

10. Confirmar que más abajo aparece:

   `// CS21A183 · GUARDIA CURRICULAR ADITIVA QA`

11. En el orden de archivos del editor, colocar `99_CS21A183_SENTENCE_ORDER_COMPLETO` después de `98_ACTUALIZACION_QA_CS21A181`.
12. Guardar.
13. No crear otro archivo 99B separado.
14. No modificar `doPost` manualmente.
15. No actualizar todavía el deployment productivo.

## Verificación previa al deployment

Ejecutar desde el editor:

`verificarActualizacionQA()`

Resultado requerido:

- `ok=true`;
- `version=CS21A183`;
- `previous_version=CS21A181`;
- `sentence_order_live_supported=true`;
- `curriculum_guard=true`;
- `curriculum_units=64`;
- `active_gram_02_items=320`;
- `five_items_per_unit=true`;
- `curriculum_rows_complete=true`;
- `curriculum_source_required=true`;
- `curriculum_acknowledgement_required=true`;
- `duplicate_response_preserves_state=true`;
- `sentence_count_limits=3-5`.

Cualquier valor distinto bloquea el deployment.

## Deployment QA

Solo después de obtener el resultado requerido:

1. abrir `Implementar`;
2. administrar implementaciones;
3. editar únicamente la aplicación web QA existente;
4. crear una versión nueva;
5. conservar acceso y ejecutor actuales de QA;
6. implementar;
7. conservar la misma URL `/exec` QA;
8. no copiar la URL en GitHub, documentación, mensajes o capturas;
9. no tocar la implementación productiva.

## Smoke test inmediato

Usar el frontend QA con la URL `/exec` privada y probar:

1. docente QA abre English LAB Live;
2. aparece `Ordena la oración`;
3. seleccionar B1-U01;
4. cargar sugerencias;
5. confirmar que aparece el tema de presentaciones y saludos;
6. confirmar el tema;
7. crear sala con 3 oraciones;
8. entrar con dos estudiantes QA;
9. enviar una respuesta correcta y una incorrecta;
10. repetir el envío de una ya procesada y confirmar que la pantalla conserva tablero y ranking;
11. cambiar a I2-U15 y confirmar tema de reglas, leyes y opiniones;
12. verificar que cambiar de unidad invalida las sugerencias anteriores.

## Evidencia mínima

Registrar sin credenciales ni tokens:

- fecha;
- versión de Apps Script;
- resultado completo de `verificarActualizacionQA()`;
- código de una sala B1-U01;
- código de una sala I2-U15;
- estudiante QA 1: correcto/incorrecto;
- estudiante QA 2: correcto/incorrecto;
- resultado de reintento duplicado;
- prueba móvil a 390 px;
- resultado final PASS / FAIL / BLOCKED.

## Estado actual

- Preflight de Apollo principal: PASS.
- Preflight de Apollo QA staging: PASS.
- Instalación Apps Script QA: pendiente.
- Deployment QA: pendiente.
- GitHub Actions: bloqueado; no crea runs ni check runs.
- Producción: intacta.
