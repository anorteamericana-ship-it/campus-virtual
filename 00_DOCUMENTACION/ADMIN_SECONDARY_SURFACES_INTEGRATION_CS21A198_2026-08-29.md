# CS21A198 · Integración de superficies admin secundarias

Fecha: 2026-08-29
Base canónica: PR #175 · `fix/admin-master-dashboard-safe-errors-cs21a196` · `cf92c89cc0521634c6ab672f3bcc4fc77afe24ab`

## Motivo

Durante la auditoría se detectó una pila paralela #167→#171. La parte de entrega privada y Panel Maestro quedó superada por la cadena canónica #172→#175, pero tres PRs paralelos contienen cambios funcionales únicos y útiles en archivos distintos:

- #168 · Supervisión Admin · `src/panel_admin_supervision.jsx`;
- #170 · Suspensiones/Reprogramaciones · `src/panel_suspensiones.jsx`;
- #171 · Aperturas Admin · `src/aperturas_admin_cs21a20.jsx`.

#169 no se integra: su cambio en `admin_master_dashboard.jsx` está reemplazado por #175.

## Estrategia

CS21A198 parte de #175 y aplica **solo el diff funcional exacto** de #168, #170 y #171 por SHA fijado.

No fusiona sus ramas completas y por tanto no arrastra:
- la variante privada #167;
- el dashboard duplicado #169;
- documentación/workflows históricos innecesarios.

## Cambios rescatados

### Supervisión Admin
- errores backend/red quedan en consola;
- UI muestra copy estable;
- lectura de docentes atrasados y cierre de lección quedan intactos.

### Suspensiones/Reprogramaciones
- `psuSafeUserError` separa diagnóstico de copy visible;
- aprobar/rechazar usan `try/catch/finally`;
- `resolviendo` siempre se libera ante excepción;
- payloads y reglas del calendario no cambian.

### Aperturas Admin
- `apSafeUserError` sanea carga y guardado;
- persistencia real `actualizarAperturaAdmin` permanece intacta;
- fechas, precios, confirmación y recálculo permanecen sin cambios.

## Evidencia exigida

El bootstrap ejecuta:
1. verificación de head exacto de las tres ramas fuente;
2. `git diff` exacto de cada PR limitado a su archivo funcional;
3. `git apply --check` antes de aplicar;
4. guards originales de #168/#170/#171 extraídos de sus SHAs exactos;
5. guard integrado CS21A198;
6. regresiones canónicas #172/#173/#174/#175;
7. `git diff --check`;
8. autoeliminación del bootstrap.

## No cambia

Apps Script, Drive ACL, producción, lógica CONAPE, cálculos de Cobranza, endpoints, pagos ni reglas académicas.

**DRAFT · INTEGRACIÓN DE DELTAS FUNCIONALES ÚNICOS · NO PROD · NO AUTO-MERGE**
