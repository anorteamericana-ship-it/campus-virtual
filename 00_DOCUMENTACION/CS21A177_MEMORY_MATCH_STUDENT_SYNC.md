# CS21A177 · Sincronización del estudiante Memory Match

## Evidencia que originó el corte

En QA autenticada, el docente mostraba `Memory Match · U01`, turnos y tablero, mientras el estudiante de la misma sala conservaba la tarjeta histórica `Pregunta 1 / Elegí una opción / Enviar respuesta`. La misma prueba mostró latencia visible con un solo participante.

## Causa reproducida

La vista estudiantil decide si debe usar Memory Match mediante `EnglishLabMemoryMatchLiveCS21A174.isMemoryMatchRoom(room)`. La respuesta histórica del ingreso podía incluir `game_label: Memory Match` sin publicar `game_id` o `game_code`. La detección CS21A176 aceptaba únicamente el código técnico y dejaba al estudiante en el componente antiguo.

Además, los refrescos cada cuatro segundos podían iniciar lecturas idénticas mientras la anterior seguía pendiente.

## Corrección acotada

- reconocer Memory Match por bandera explícita, código técnico o etiqueta normalizada;
- no capturar otros juegos;
- cargar un guard separado que solo intercepta endpoints `englishLab*`;
- devolver el estado especializado de Memory Match inmediatamente después del ingreso, sin esperar el siguiente polling;
- compartir lecturas idénticas simultáneas de estado/control;
- dejar intactos los `fetch` ajenos a English LAB;
- registrar endpoint, duración, estado y si la lectura fue compartida;
- no modificar Apps Script, Sheets, preguntas, producción ni `main`.

## Límite

Este corte reduce solicitudes duplicadas y corrige la pantalla incorrecta. No convierte Apps Script y Sheets en infraestructura de tiempo real. La capacidad con 5, 10 y 25 participantes debe medirse después de la nueva QA autenticada.

## Criterio de aceptación

1. Al ingresar a una sala cuyo único identificador visible sea `game_label: Memory Match`, el estudiante recibe `room_package` inmediatamente.
2. La interfaz antigua no debe ser la respuesta final de ingreso.
3. Dos lecturas idénticas simultáneas generan una sola llamada subyacente.
4. Un `fetch` ajeno a English LAB pasa sin clonarse ni reconstruirse.
5. Los contratos CS21A174 y CS21A176 continúan aprobados.
