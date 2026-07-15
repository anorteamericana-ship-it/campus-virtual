# SKILL OPERATIVA VIGENTE · CS21A90

## Base

- Baseline: `F98.4-Z6-CS21A90-CONSOLIDADO`.
- Frontend: GitHub `main`.
- Calendario global: `CS21A88`.
- Backend validado en Apps Script: `CS21A90`.
- Próxima entrega: `CS21A91`.
- Verificar deployment antes de afirmar que A90 está publicado.

## Leer primero

1. `README.md`.
2. `00_DOCUMENTACION/ESTADO_CONSOLIDADO_F98_4_Z6_CS21A90.md`.
3. `00_DOCUMENTACION/FUENTES_DE_VERDAD_Y_CONTRATOS.md`.
4. `00_DOCUMENTACION/ROADMAP_VISUAL_PRIORIZADO.md`.
5. README histórico del módulo.
6. Archivos actuales del módulo en GitHub `main`.

## Método obligatorio

1. Identificar fuente de verdad.
2. Abrir código actual.
3. Auditar dependencias, wrappers y lazy loading.
4. Preservar flujos existentes.
5. Corregir causa raíz; no apilar parches.
6. Probar antes de entregar.
7. Separar siempre: guardado, probado, desplegado y validado visualmente.

## Frontend

- Fuente oficial: GitHub `main`.
- Revisar si las referencias son locales o globales antes de envolver funciones.
- Separar dominios académico, financiero y comercial.
- No meter datos secundarios dentro de una vista operativa simple.

## Backend

- Partir del Code.gs integral vigente.
- Revisar la cadena de `doPost` antes de agregar endpoints.
- Comparar funciones preservadas.
- Probar en Apps Script antes del deployment.
- Probar externamente después del deployment cuando el flujo dependa del Web App público.

## QA temporal

El usuario usa un único archivo de test por ronda:

1. borrar el test anterior;
2. pegar solo el test actual;
3. ejecutar una función principal;
4. copiar JSON completo;
5. borrar el test al terminar.

## Calendario

- `GRUPOS`: grupo, nivel operativo, estado fuente, horario y docente.
- `CALENDARIO_LECCIONES`: fechas y eventos.
- A88 puede mostrar `REVISAR` sin modificar las fuentes.
- Nunca ocultar un grupo solo porque no tenga eventos en la semana visible.

## Rebeca

Endpoints:

- `agentGetCommercialConfig`.
- `agentResolveContactContext`.

CS21A90 agrega contexto comercial seguro y siguiente mejor acción para prospectos.

En ambigüedad de identidad o roles, no asumir identidad ni activar venta automática.

## Reglas comerciales

- `PROSPECTOS` no equivale a matrícula confirmada.
- La venta directa suele ser más rápida que forzar CONAPE.
- No empujar financiamiento cuando no corresponde al caso.

## Reglas preservadas de libros

- `unitStarts` es la fuente de inicios U01–U16.
- Configuración independiente por nivel y SB/TB/WB.
- Solo Superadmin calibra unidades.
- Preservar `unitStartHistory`.
- Invalidar solo la caché del libro modificado.

## Riesgo alto

Antes de tocar pagos, certificados, `DATOS`, `ESTATUS`, `GRUPOS`, CONAPE o calendario, auditar impacto y fuente de verdad.

## Visual

Seguir `ROADMAP_VISUAL_PRIORIZADO.md`.

Orden: Calendario A88 → sistema visual común → Admin/Superadmin → Docentes → Estudiantes → Ventas → Responsive/rendimiento.
