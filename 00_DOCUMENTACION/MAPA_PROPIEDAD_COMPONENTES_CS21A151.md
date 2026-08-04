# Mapa de propiedad de componentes · CS21A151

Fecha: 3 de agosto de 2026  
Base: `main` en `67108928e953fbf044dbcd916dc34a5dd5f1e570`

## Objetivo

Eliminar gradualmente el patrón de componentes globales redefinidos por varios archivos, sin borrar funciones vigentes ni alterar reglas académicas, financieras o de permisos.

## Principio de depuración

Cada componente crítico debe terminar con:

1. una implementación canónica;
2. un archivo propietario claramente identificado;
3. extensiones explícitas por propiedades o componentes hijos, no por sustitución repetida del global;
4. una sola publicación en `window`;
5. pruebas por rol y ruta;
6. auditoría que impida reintroducir wrappers silenciosos.

## Primera prioridad

`MaterialesView` será el primer componente consolidado porque actualmente intervienen una implementación base y múltiples módulos que capturan, sustituyen o vuelven a publicar el mismo global.

La consolidación se ejecutará en cambios separados:

1. inventario ejecutable de definiciones, publicaciones y wrappers;
2. clasificación de responsabilidades por archivo;
3. diseño del componente canónico y sus contratos;
4. migración de una responsabilidad a la vez;
5. eliminación de cada sustitución únicamente después de demostrar equivalencia;
6. actualización de `campus.html`, `F96_LAZY` y pruebas;
7. QA sintético y revisión manual autenticada.

## Componentes incluidos en el inventario inicial

- `Sidebar`;
- `MaterialesView`;
- `AdminMasterDashboard`;
- `AdminEstudiantesView`;
- `CalendarioGrupoOperativo`;
- `ImportadorBancario`;
- `AplicarPago`;
- `ClubICANDocenteView`;
- `ICANViewNew`;
- `GruposView`;
- `CronogramaDocenteSeguroF82`.

## Evidencia automática

El workflow `Component ownership CS21A151` ejecuta:

```text
node scripts/audit_component_ownership_cs21a151.mjs
```

Genera:

- `component-ownership.json`;
- `component-ownership.md`;
- orden de scripts directos de `campus.html`;
- pertenencia a bundles de `F96_LAZY`;
- declaraciones;
- publicaciones globales;
- capturas de base;
- marcadores de wrappers;
- hallazgos P1/P2.

## Límites

Este PR inicial no cambia la interfaz ni elimina archivos. Su función es convertir una deuda arquitectónica difusa en un mapa reproducible antes de la primera consolidación funcional.

No se tocará Apps Script, Drive, hojas, datos ni producción.
