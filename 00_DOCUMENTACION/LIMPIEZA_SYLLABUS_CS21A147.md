# CS21A147 · Limpieza del sílabus canónico

## Objetivo

Retirar del archivo vigente `src/syllabus.jsx` los datos demostrativos que podían aparecer cuando una vista reutilizaba los globals históricos del prototipo.

## Datos retirados

- `DEMO_GROUP`;
- `DEMO_SUSPENSIONS`;
- grupo `G0001-2026`;
- identidad demostrativa Santiago;
- docente demostrativo Ricardo Arias;
- fechas y suspensiones fabricadas para simular un grupo en curso.

## Código conservado

No se elimina el sílabus institucional ni su lógica. Permanecen:

- `PRIORITY_BLOCK`;
- `SYLLABUS_BASICO_I`;
- `SYLLABUS_BY_LEVEL`;
- `ICAN_SLOTS_AFTER`;
- `buildGroupSchedule`;
- `parseScheduleDays`;
- helpers de formato de fechas.

## Evidencia previa

La búsqueda del repositorio localizó `DEMO_GROUP` y `DEMO_SUSPENSIONS` únicamente dentro de `src/syllabus.jsx`. No aparecían en `campus.html`, `F96_LAZY`, otros módulos, workflows ni pruebas.

## Validación

`scripts/test_syllabus_no_demo_cs21a147.mjs` comprueba que:

1. no reaparezcan los nombres, grupo o identidades demostrativas;
2. los contratos canónicos continúen publicados en `window`;
3. existan los cuatro niveles;
4. Básico I conserve 32 lecciones y 16 espacios I CAN;
5. `buildGroupSchedule` siga construyendo las 32 lecciones para un grupo recibido como dato.

## Alcance y seguridad

- Cambio exclusivo de frontend.
- No modifica Apps Script.
- No modifica hojas, Drive ni datos.
- No crea valores sustitutos ni fallbacks ficticios.
- Rama basada en el head validado de CS21A146.
- Debe mantenerse como PR apilado hasta resolver primero el PR #32.
