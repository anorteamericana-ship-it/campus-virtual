# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión frontend:** F98.4-Z6-CS21A103  
**Backend integral vigente:** F98.4-Z6-CS21A103  
**Backend Apps Script publicado:** no verificado  
**Corte:** 16-jul-2026

## Cambio vigente CS21A103

El Panel Maestro verifica `Mora SI/NO` directamente en el archivo externo oficial `7-morosidad` sin reconstruir todo el dashboard.

### Lectura en vivo

- al abrir Seguimiento inmediato;
- cada 20 segundos con la pestaña visible;
- al recuperar foco;
- después de `Actualizar CONAPE ahora`.

La respuesta actualiza solamente:

- `moraState`;
- condición pendiente/cerrado del desembolso académico 01;
- reinicio visual del semáforo cuando el estado es `NO`.

## Caché

Las correcciones manuales de morosidad invalidan ahora:

- `MASTER_DASH_CS21A98_FRESH`;
- `MASTER_DASH_CS21A98_STALE`.

`campus.html` también fuerza las versiones correctas A101, A102 y A103. Esto evita que el navegador vuelva a servir el modal antiguo o etiquetas anteriores del Panel Maestro.

## Caso auditado

Se confirmó un caso donde la pantalla mostraba `Mora SI`, aunque la fuente oficial tenía `NO` para los periodos vigentes. No se repararon datos porque la base ya estaba correcta; se corrigió la lectura y la invalidación de caché.

## Funciones preservadas

- Poner al día en tres pasos.
- Montaje robusto A102.
- Seguimiento solo para desembolso 01.
- Movimientos 02/03 informativos.
- Pago local separado de CONAPE.
- Cierre CONAPE idempotente.
- Journal y reversión.
- MÁSCARA de Keylor.

## Backend

Usar únicamente:

`Code_F98_4_Z6_CS21A103_COMPLETO.gs`

Test de solo lectura:

`Test_CS21A103.gs` → `test_cs21a103_all`

## Publicación

1. reemplazar Code.gs por A103;
2. agregar temporalmente el test;
3. ejecutar `test_cs21a103_all`;
4. retirar el test;
5. actualizar el deployment existente;
6. recargar el Campus con `Ctrl + F5`;
7. abrir Seguimiento inmediato;
8. comprobar que una fila oficial `NO` aparece como aplicada/cerrada y no como `Mora SI`.

## Protección

La MÁSCARA de Keylor conserva las 69 funciones `_demoKeylor*` sin cambios.

## Documentación vigente

Leer `INDICE_VIGENTE_CS21A103.md` antes de continuar.
