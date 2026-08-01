## Objetivo

Centralizar la selección del backend de Apps Script para que producción siga siendo el valor predeterminado y QA/staging pueda declarar un despliegue alterno antes de cargar el frontend.

## Cambios

- añade `src/runtime_config.js`;
- carga esa configuración antes del código funcional en `campus.html`, `login.html`, `ventas.html` e `inscripcion.html`;
- retira la URL productiva inline de tres entradas;
- valida que el override use `script.google.com/macros/s/.../exec|dev`;
- mantiene compatibilidad temporal con módulos que todavía conservan la URL productiva en constantes locales;
- añade pruebas y workflow dedicado;
- documenta uso, alcance y riesgos.

## Seguridad

- producción permanece como default;
- no cambia backend, hojas, Drive ni datos;
- no despliega Apps Script;
- no persiste el URL QA;
- no acepta dominios arbitrarios;
- el wrapper transitorio solo reescribe solicitudes dirigidas exactamente al despliegue productivo conocido.

## Fuera de alcance

- migración de las 15 constantes históricas restantes;
- `modulos/examen_oral.html`;
- limpieza de datos demo;
- PR #29 y PR #30.

## Validación requerida

- CI completo en verde;
- prueba manual con despliegue QA;
- revisión humana antes de fusionar.
