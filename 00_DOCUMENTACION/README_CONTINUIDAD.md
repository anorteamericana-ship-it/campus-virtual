# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión frontend:** F98.4-Z6-CS21A105  
**Backend integral vigente:** F98.4-Z6-CS21A103  
**Backend Apps Script publicado:** CS21A103 validado por el usuario  
**Corte:** 16-jul-2026

## Cambio vigente CS21A105

Se corrigió el borrado visual del semáforo del Panel Maestro.

### Diagnóstico

La lectura de morosidad A103 reconstruía periódicamente el arreglo de movimientos. El efecto anterior del semáforo volvía a inicializar todos los pasos desde `row.reviewStep`, que podía provenir de una fotografía anterior del dashboard. Además, el canal colaborativo aplicaba cualquier valor remoto recibido aunque acabara de confirmarse una escritura local.

La auditoría de `CONAPE_MOVIMIENTOS_LOG` demostró que los clics sí se guardaban. Algunos historiales contienen pasos repetidos porque el operador volvió a presionar después de que la pantalla apagó el punto. Esos registros no se eliminan.

### Regla vigente

1. el clic se refleja inmediatamente;
2. `setConapeRevisionSemaforo` confirma la escritura;
3. el valor confirmado se protege durante 18 segundos;
4. una fotografía anterior o un delta anterior no pueden reducirlo;
5. el canal colaborativo consulta deltas cada 4 segundos;
6. se hace reconciliación completa cada 20 segundos y al recuperar foco;
7. únicamente `CERRADO_REINICIADO` o `appliedInSystem=true` apagan el semáforo.

## Funciones preservadas

- Una ficha por estudiante A104.
- Columna Detectado ordenable.
- Morosidad oficial en vivo A103.
- Seguimiento exclusivo del desembolso académico 01.
- WhatsApp por movimiento y nivel.
- Contexto informativo 02/03.
- Poner al día A102.
- Journal, pagos y reversión.
- MÁSCARA de Keylor.

## Backend

No cambia. Continúa vigente:

`Code_F98_4_Z6_CS21A103_COMPLETO.gs`

No se requiere reemplazar Apps Script ni ejecutar un nuevo test backend para CS21A105.

## Prueba frontend

`tests/Test_CS21A105_review_guard.js`

Resultado esperado:

```json
{"ok":true,"tests":4,"guard_ms":18000}
```

## Publicación

1. esperar que GitHub Pages publique `main`;
2. recargar el Campus con `Ctrl + F5`;
3. abrir un movimiento académico 01 pendiente;
4. marcar revisión 1, 2, 3 o 4;
5. esperar al menos 25 segundos;
6. confirmar que el paso permanece;
7. comprobar desde la otra computadora que el cambio aparece mediante el canal colaborativo.

## Protección

La MÁSCARA de Keylor no fue modificada.

## Documentación vigente

Leer `README_F98_4_Z6_CS21A105.md` antes de continuar.
