# English LAB · UX de espera y parejas editables CS21A181

Fecha: 2026-08-06  
Alcance: QA aislado  
Base: CS21A180 / PR #51  
Producción y `main`: sin cambios

## Problemas atendidos

1. El estudiante veía el rótulo `Acceso financiero`, aunque el mensaje debía hablar únicamente de acceso a English LAB.
2. Varias operaciones mostraban texto de espera sin una señal visual clara; el usuario podía interpretar que la pantalla estaba congelada y recargar repetidamente.
3. Los perfiles QA rápidos fueron creados con estado académico activo, pero no tenían los movimientos financieros que el escenario controlado `AL_DIA` exige.
4. El docente recibía las parejas Memory Match únicamente después de iniciar; no podía revisar dificultad, sustituir vocabulario ni corregir una sugerencia.

## Diseño aplicado

### Capa aditiva

CS21A181 no reescribe `src/english_lab_live.jsx` ni el motor CS21A180. Instala una capa acotada desde `src/runtime_config.js` que:

- intercepta únicamente llamadas cuyo `fn` pertenece a English LAB;
- muestra un único indicador visual reutilizable con spinner y barra animada;
- espera 260 ms antes de mostrarlo para evitar parpadeos durante polling rápido;
- elimina `Acceso financiero` de las respuestas y del DOM de pantallas English LAB;
- envuelve la vista docente oficial cuando el módulo lazy la publica.

### Parejas sugeridas y editables

Antes de iniciar una sala Memory Match, el docente recibe las parejas sugeridas por el banco real para nivel, unidad y cantidad seleccionada.

Formato de edición:

```text
palabra = significado
```

Reglas:

- una pareja por línea;
- exactamente la cantidad configurada para la sala;
- no se permiten palabras vacías, significados vacíos ni palabras repetidas;
- el botón de inicio conserva el endpoint existente, pero la capa añade `custom_pairs` al payload;
- Apps Script vuelve a validar la lista y construye las tarjetas desde esas parejas;
- si el docente no modifica nada, se usan las sugerencias mostradas.

Una palabra sola no es suficiente para Memory Match porque no define la tarjeta que debe emparejarse.

## Corrección de perfiles QA

Los códigos `QA-STU-005` a `QA-STU-008` recibieron en la copia QA los mismos movimientos definidos para el escenario `AL_DIA`:

- matrícula B1: CRC 20.000;
- cuotas B1: CRC 344.000.

No se añadieron excepciones por nombre o código al backend.

## Archivos

- `src/english_lab_ux_cs21a181.js`
- `src/runtime_config.js`
- `apps_script_patches/98_ACTUALIZACION_QA_CS21A181.gs`
- `scripts/test_english_lab_ux_words_cs21a181.mjs`
- `.github/workflows/cs21a181-english-lab-ux.yml`

## Instalación QA

1. Mantener `97_ACTUALIZACION_QA.gs` de CS21A180 sin modificaciones.
2. Crear un archivo Apps Script nuevo llamado `98_ACTUALIZACION_QA_CS21A181.gs`.
3. Copiar el contenido del archivo homónimo incluido en el paquete/repositorio.
4. Ejecutar `verificarActualizacionQA()`.
5. Confirmar:

```text
ok=true
version=CS21A181
previous_version=CS21A180
header_aligned=true
generic_questions_in_memory_state=0
custom_pairs_supported=true
suggested_pairs_editable=true
```

6. Actualizar el mismo deployment QA y conservar la URL `/exec`.

## Prueba autenticada

1. Ingresar como `Profe`.
2. Crear una sala nueva Memory Match, B1, Unidad 1, seis parejas, Individual.
3. Confirmar que aparece `Palabras sugeridas` antes de compartir/iniciar.
4. Sustituir al menos una pareja usando `palabra = significado`.
5. Confirmar que una línea incompleta o una cantidad distinta impide el inicio y explica el error.
6. Restaurar o completar seis parejas e iniciar.
7. Entrar con `Naty` y `leo` y confirmar acceso.
8. Confirmar que durante accesos, creación, entrada, inicio y respuestas lentas aparece el mismo indicador visual.
9. Confirmar que no aparece el rótulo `Acceso financiero`.
10. Verificar que el tablero contiene la pareja modificada y mantiene turnos y sincronización CS21A180.

## Criterio de liberación

CS21A181 sigue siendo candidato QA. No autoriza fusión ni producción hasta completar la prueba autenticada con docente y dos estudiantes.
