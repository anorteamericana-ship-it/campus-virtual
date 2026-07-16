# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión frontend:** F98.4-Z6-CS21A104  
**Backend integral vigente:** F98.4-Z6-CS21A103  
**Backend Apps Script publicado:** CS21A103 validado por el usuario  
**Corte:** 16-jul-2026

## Cambio vigente CS21A104

El Panel Maestro agrupa los desembolsos académicos 01 por estudiante dentro de cada sección.

### Presentación

- una sola ficha para código, nombre, vínculo, grupo, consulta y seguimiento;
- cada movimiento conserva su `MOVIMIENTO_ID` y su estado independiente;
- el movimiento se muestra en el mismo renglón del nivel académico correspondiente;
- `Periodo / nivel`, `Detectado` y `WhatsApp` comparten la alineación del resumen académico;
- los movimientos 02/03 permanecen como contexto dentro del periodo correspondiente.

### Columna Detectado

`D-10/7` dejó de formar parte del texto de Periodo. Ahora tiene una columna propia llamada **Detectado**.

Puede ordenarse:

- desde el encabezado Detectado;
- `Detectado más reciente`;
- `Detectado más antiguo`.

El orden agrupa por estudiante usando el movimiento detectado que aparezca primero según el sentido seleccionado.

## Conteos

La cabecera diferencia:

- estudiantes visibles;
- movimientos académicos 01 visibles.

En cerrados, el resumen indica cantidad de estudiantes y cantidad de movimientos. Dos periodos de un mismo estudiante ya no se cuentan como dos estudiantes.

## Caso visual de referencia

Para 17186:

- una ficha de estudiante;
- B1 alineado con `01/05/2026` y su fecha detectada;
- B2 alineado con `01/09/2026` y su fecha detectada;
- ambos movimientos continúan cerrados e independientes;
- un solo bloque común de identidad y seguimiento cerrado.

## Funciones preservadas

- Morosidad oficial en vivo A103.
- Seguimiento exclusivo del desembolso 01.
- Semáforo por movimiento.
- WhatsApp por movimiento y nivel.
- Contexto informativo 02/03.
- Poner al día A102.
- Journal, pagos y reversión.
- MÁSCARA de Keylor.

## Backend

No cambia. Continúa vigente:

`Code_F98_4_Z6_CS21A103_COMPLETO.gs`

No se requiere reemplazar Apps Script ni ejecutar un nuevo test backend para CS21A104.

## Publicación

1. esperar que GitHub Pages publique `main`;
2. recargar el Campus con `Ctrl + F5`;
3. buscar 17186;
4. confirmar una sola ficha con dos movimientos alineados;
5. pulsar Detectado y comprobar el cambio de orden;
6. verificar que el semáforo y WhatsApp siguen actuando sobre el movimiento correcto.

## Protección

La MÁSCARA de Keylor no fue modificada.

## Documentación vigente

Leer `INDICE_VIGENTE_CS21A104.md` antes de continuar.
