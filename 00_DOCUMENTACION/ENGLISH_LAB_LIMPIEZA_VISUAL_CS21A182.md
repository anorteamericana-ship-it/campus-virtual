# English LAB · auditoría y limpieza visual CS21A182

Fecha: 2026-08-06  
Rama: `fix/cs21a182-english-lab-visual-cleanup`  
Base: CS21A181 (`0a55111c15024ef432e0dc65828176c534e3c75d`)

## Objetivo

Reducir ruido visual y textos técnicos en English LAB sin cambiar juegos, endpoints, permisos, acceso financiero ni datos académicos.

## Hallazgos

### Docente

- La vista de creación mostraba una alerta con el código interno `CS20H` y el estado diagnóstico del banco.
- El panel `Banco pedagógico` exponía cobertura, faltantes, alertas y fuentes; es información de QA, no una decisión diaria del docente.
- La explicación de que la actividad no afecta notas aparecía repetida en encabezados y tarjetas.
- La vista previa `Mensaje listo` duplicaba el código, el enlace y los botones de copiado.

### Estudiante

- El encabezado decía `Pantalla del estudiante`, texto que no ayuda a realizar la actividad.
- Los estados de espera y respuesta eran más largos de lo necesario.
- El mensaje de pregunta actualizada podía interpretarse como un bloqueo individual.

### Catálogo individual

- `No genera nota oficial` aparecía repetido en introducciones, instrucciones y mapa de progreso.
- El acceso restringido usaba lenguaje de piloto y backend que no corresponde a una pantalla final.

## Implementación

Se agrega `src/english_lab_visual_cleanup_cs21a182.js` como capa aditiva cargada después de CS21A181.

La capa:

- actúa únicamente cuando detecta rutas o contenedores de English LAB;
- reemplaza textos exactos por instrucciones breves orientadas a la acción;
- oculta el panel interno `Banco pedagógico` de la vista docente;
- oculta la vista previa redundante `Mensaje listo` sin retirar los botones de copiar;
- conserva el código de sala, enlace, controles y salas recientes;
- aplica ajustes móviles y limita párrafos secundarios extensos;
- observa renders diferidos para limpiar vistas que aparecen después de una solicitud;
- expone `window.__ENGLISH_LAB_VISUAL_CLEANUP_CS21A182__.getLastAudit()` para evidencia QA.

## Fuera de alcance

- No modifica `src/english_lab_live.jsx` ni su motor CS21A180.
- No modifica `src/academia_play.jsx` ni el banco de juegos.
- No intercepta `fetch`.
- No modifica Apps Script.
- No altera permisos, pagos, notas, certificados ni estados académicos.
- No agrega juegos nuevos todavía.

## QA visual requerida

### Docente

1. Abrir English LAB Live.
2. Confirmar que no aparece `CS20H`, versión interna ni `Banco pedagógico`.
3. Confirmar que crear sala, copiar código, copiar mensaje y copiar enlace siguen visibles.
4. Confirmar que salas recientes siguen disponibles.
5. Abrir una sala y comprobar controles, lista de participantes y resultados.

### Estudiante

1. Entrar sin código y revisar la pantalla inicial.
2. Entrar a una sala activa.
3. Confirmar estados breves de espera, respuesta recibida y actualización.
4. Confirmar que cambiar sala y actualizar siguen funcionando.

### Catálogo individual

1. Abrir English LAB.
2. Confirmar que el mapa de progreso no repite `No genera nota oficial`.
3. Abrir un juego del banco y confirmar instrucciones breves.
4. Revisar acceso restringido con un perfil no habilitado.

### Móvil

Repetir las tres vistas a 390 px de ancho. Botones y tarjetas deben permanecer utilizables sin desbordamiento horizontal.

## Criterio de aceptación

CS21A182 se considera aprobado cuando:

- no se muestran códigos internos o diagnósticos del banco al docente;
- no se pierde ningún control funcional;
- no aparecen cambios fuera de English LAB;
- CS21A181 mantiene indicador de carga y parejas editables;
- CS21A180 mantiene turnos y sincronización;
- QA autenticada completa pasa en docente y estudiante.
