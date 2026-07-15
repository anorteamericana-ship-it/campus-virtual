# Campus Virtual · Academia Norteamericana

## Estado consolidado actual

Base de continuidad del proyecto: **F98.4-Z6-CS21A90-CONSOLIDADO**.

Este repositorio contiene el frontend del Campus Virtual y la documentación operativa para continuar el proyecto sin reconstruir el contexto desde cero.

### Versiones vigentes

- **Frontend global:** rama `main`.
- **Calendario académico Superadmin:** `F98.4-Z6-CS21A88`.
- **Backend integral validado en el editor de Apps Script:** `F98.4-Z6-CS21A90`.
- **API comercial Rebeca:** módulo interno `CS21A81`, preservado dentro de CS21A90.
- **Contact Context + seguimiento comercial Rebeca V5 Ultra:** `CS21A90`.
- **Deployment público de CS21A90:** no confirmado todavía; no asumir que está publicado hasta verificar la implementación vigente.

## Leer primero

1. `00_DOCUMENTACION/ESTADO_CONSOLIDADO_F98_4_Z6_CS21A90.md`
2. `00_DOCUMENTACION/FUENTES_DE_VERDAD_Y_CONTRATOS.md`
3. `skills/campus-virtual/SKILL.md`
4. `00_DOCUMENTACION/ROADMAP_VISUAL_PRIORIZADO.md`
5. `00_DOCUMENTACION/PROMPT_TRASPASO_NUEVO_CHAT.md`

## Regla principal

Antes de modificar cualquier pantalla o endpoint:

1. identificar la fuente de verdad;
2. auditar el flujo real que ya existe;
3. preservar funciones y rutas vigentes;
4. evitar apilar parches sobre parches;
5. ejecutar pruebas antes de entregar;
6. distinguir siempre entre **código guardado**, **código validado** y **código desplegado**.

## Próxima numeración

La próxima entrega nueva debe usar **F98.4-Z6-CS21A91** para evitar nuevas colisiones entre versiones frontend y backend.
