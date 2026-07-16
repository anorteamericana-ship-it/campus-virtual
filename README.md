# Campus Virtual · Academia Norteamericana

## Estado consolidado actual

Base vigente de continuidad: **F98.4-Z6-CS21A107**.

### Versiones vigentes

- **Frontend global:** rama `main`.
- **Consulta individual · Poner al día:** `F98.4-Z6-CS21A102`.
- **Panel Maestro CONAPE:** `F98.4-Z6-CS21A107`.
- **Backend integral vigente:** `F98.4-Z6-CS21A103`.
- **Tabla agrupada y columna Detectado:** `F98.4-Z6-CS21A104`.
- **Semáforo estable:** `F98.4-Z6-CS21A105`.
- **Enlace académico de movimientos:** `F98.4-Z6-CS21A106`.
- **Montaje final estable del panel completo:** `F98.4-Z6-CS21A107`.
- **MÁSCARA de Keylor:** protegida y sin cambios.

## Leer primero

1. `00_DOCUMENTACION/README_F98_4_Z6_CS21A107.md`
2. `00_DOCUMENTACION/README_F98_4_Z6_CS21A106.md`
3. `00_DOCUMENTACION/VALIDACION_CS21A106.md`
4. `00_DOCUMENTACION/README_F98_4_Z6_CS21A105.md`
5. `00_DOCUMENTACION/FUENTES_DE_VERDAD_Y_CONTRATOS.md`

## Cambio principal CS21A107

El Panel Maestro ya no depende de que un único reemplazo ocurra en el momento exacto de la carga diferida.

A107 restaura y protege:

- buscador de estudiante;
- filtros y combo de grupos;
- cuadrícula académica agrupada;
- columna Detectado;
- semáforo colaborativo;
- desembolsos académicos 01 cerrados;
- enlace por `6-historial` para movimientos futuros.

La tabla básica histórica permanece únicamente como respaldo interno. El instalador A107 reintenta y verifica que el componente activo sea el panel completo. La envoltura histórica A78 fue retirada para que no compita por el mismo componente.

CS21A107 es una corrección frontend. No modifica Apps Script, pagos, expedientes, hojas CONAPE ni la MÁSCARA de Keylor.

## Regla principal

Antes de modificar cualquier pantalla o endpoint:

1. identificar la fuente de verdad;
2. auditar el flujo real existente;
3. preservar funciones y rutas vigentes;
4. eliminar código sustituido en lugar de ocultarlo;
5. ejecutar pruebas antes de entregar;
6. distinguir entre guardado, validado, publicado y probado en producción;
7. no modificar la MÁSCARA de Keylor salvo autorización expresa.

## Próxima numeración

La próxima entrega funcional debe usar **F98.4-Z6-CS21A108**.
