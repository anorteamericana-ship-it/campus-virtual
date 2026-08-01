# HANDOFF CS21A146

Rama: `refactor/cs21a146-runtime-config`

Base confirmada: `67108928e953fbf044dbcd916dc34a5dd5f1e570`

Objetivo: centralizar la selección del backend de Apps Script para producción, QA y staging sin modificar el backend ni los datos.

Estado esperado antes de fusionar:

1. PR en borrador.
2. CI de runtime config en verde.
3. Revisión humana del wrapper transitorio de `fetch`.
4. Prueba manual con un despliegue QA válido.
5. No fusionar junto con PR #30 ni PR #29.

Riesgo conocido: varios módulos todavía contienen la URL productiva en constantes locales. El wrapper de `fetch` mantiene compatibilidad temporal; su eliminación requiere migrar esos módulos en cambios posteriores y pequeños.
