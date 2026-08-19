# CAMPUS VIRTUAL · Estado de producción

Última verificación autenticada: **2026-08-19 10:14 -06:00**.

## Apps Script PROD

- Script ID: `1kV4wKnD_OU5DPQSawScjPsUbo1MOg_rAHbtpYupSMPkqywIVSQwdV4y2`
- Deployment ID estable: `AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ`
- Versión desplegada: **@417**
- Versión anterior: @416
- Último cambio: compatibilidad de proformas `LAPTOP_319` / `LAPTOP_360`
- Evidencia funcional: generación real de proforma de equipo `LAPTOP_360` por ₡360.000 completada correctamente.

La copia machine-readable vive en `config/apps-script-production.json`.

## GitHub

- Rama productiva del repositorio: `main`
- SHA de `main` verificado al crear esta infraestructura: `67108928e953fbf044dbcd916dc34a5dd5f1e570`
- `main` y la versión desplegada de Apps Script no deben asumirse equivalentes sin evidencia.

## Regla de fuente de verdad

Para cambios de código del Campus, **GitHub es la fuente de verdad de desarrollo**. Drive puede conservar copias de respaldo y artefactos operativos, pero no debe usarse para decidir qué código es el vigente.

Para Apps Script productivo, la fuente de verdad de runtime es el **Deployment ID estable + versión numérica desplegada**, verificados mediante una sesión `clasp` autenticada. El HEAD remoto de Apps Script puede contener cambios no publicados y por eso nunca se considera producción por sí solo.

## Regla de actualización

Actualizar este documento y `config/apps-script-production.json` solamente cuando se cumplan las cuatro condiciones:

1. el deployment remoto fue verificado;
2. existe una versión numérica inmutable nueva;
3. el mismo Deployment ID apunta a esa versión;
4. la prueba funcional correspondiente fue ejecutada cuando el cambio afecta un flujo real.

## Prohibiciones

- No hacer `clasp push --force` desde HEAD remoto sin comparar primero contra la versión realmente desplegada.
- No desplegar un `Code.gs`/`Código.js` completo solo para cambiar una función sin compuertas de alcance.
- No usar copias locales antiguas para preparar producción.
- No modificar el Deployment ID productivo para una corrección ordinaria.
- No guardar contraseñas, tokens, cookies ni credenciales en este archivo o en el JSON de configuración.
