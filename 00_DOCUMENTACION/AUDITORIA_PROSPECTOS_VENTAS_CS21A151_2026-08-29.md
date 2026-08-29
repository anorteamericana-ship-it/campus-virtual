# AUDITORÍA PROSPECTOS / VENTAS · CS21A151

Fecha: 2026-08-29 · Costa Rica  
Repositorio: `anorteamericana-ship-it/campus-virtual`  
Base congelada: `main` `53df524d0a9eab867d3b307b3e633f366af92a63`  
Rama de trabajo: `feature/prospectos-ux-cleanup-cs21a151`

## Regla de alcance

Este corte es exclusivamente frontend, visual y reversible. No modifica Apps Script, Apollo, pagos, CONAPE, roles, seguridad, ACL ni contratos backend. Los hallazgos que pertenecen a PR #113, SEC-001/002/004 o English LAB quedan documentados pero fuera de este diff.

## Matriz mínima de superficie

| Rol / etapa | Menú / ruta | Entrada | Componente | Lecturas | Escrituras | Estado de evidencia |
|---|---|---|---|---|---|---|
| Prospecto / free student | `campus.html` → `dashboard` | `src/app.jsx` + `src/sidebar.jsx` | `FreeProspectPortal` | `freeUserMiPerfil` | `freeUserCrearSolicitud` | E0 revisado; E2/E3 pendiente |
| Prospecto / free student | `campus.html` → `academia_play` | sidebar / router Campus | English LAB free access | acceso de sesión + free access | según LAB | fuera del cambio funcional |
| Ventas | `ventas.html` | `VentasGate` → `VentasApp` | tabla + cards | `getDashboardVentas` | ninguna desde lista | E0 revisado |
| Ventas | `ventas.html` → drawer | `ProspectoDrawer` | detalle prospecto | `getProspectoDetalle` | notas, etapas, docs, pagos, etc. | E0 revisado; mutaciones no probadas aquí |
| Admin / superadmin en Ventas | `ventas.html` | `VentasApp` | `Ver como asesor` | `getDashboardVentas(scopeAsesor)` | depende del drawer | contrato de scope pendiente PR #113 |
| Admin / superadmin Campus | `campus.html` → prematrículas | sidebar | bandeja free user | `freeUserListarSolicitudes` | flujo administrativo | fuera de este corte |

## Hallazgos confirmados en la base

### PV-UX-001 · CSS inexistente cargado por Ventas
- Severidad: P3 localizado.
- Evidencia: E0.
- Archivo: `ventas.html`.
- Observado: referencia a `styles/design_system_05c.css`; el archivo no existe en `main`.
- Impacto: request 404, ruido de consola y contrato visual engañoso.
- Corrección CS21A151: se elimina únicamente esa referencia.

### PV-DATA-002 · número visible distinto al número usado por WhatsApp
- Severidad: P2.
- Evidencia: E0.
- Archivo: `src/ventas_parts.jsx`.
- Observado: `WaLink` prioriza `p.whatsapp || p.telefono`, pero el texto mostraba `p.telefono`.
- Impacto: asesor puede ver un número y abrir otro.
- Corrección CS21A151: el texto usa la misma prioridad `p.whatsapp || p.telefono`.

### PV-UX-003 · diagnóstico técnico visible al prospecto
- Severidad: P2.
- Evidencia: E0.
- Archivo: `src/prospect_free_student.jsx`.
- Observado: una respuesta HTML podía mostrar referencias a backend / Apps Script; errores backend podían llegar directamente a la UI.
- Corrección CS21A151: mensajes técnicos se filtran; el detalle queda en consola y el prospecto recibe copy no técnico.

### PV-UX-004 · menú de prematrícula dominado por opciones bloqueadas
- Severidad: P3 UX.
- Evidencia: E0.
- Archivo: `src/sidebar.jsx`.
- Observado: el usuario free veía `Mi curso`, `Materiales`, `Club I CAN`, `Pagos` y `Certificados` bloqueados, además de una entrada duplicada de contacto al mismo dashboard.
- Corrección CS21A151: la prematrícula conserva `Mi Campus` y `English LAB` solamente; las acciones de matrícula/contacto permanecen dentro del portal.

## Deuda encontrada pero deliberadamente NO corregida en este corte

### PV-AUTH-005 · Ventas mutaciones sin token automático
- `postVentas()` no inyecta el token de sesión.
- Ya existe corrección preparada en PR #113 REL-002.
- No duplicar ni reimplementar aquí.

### PV-SCOPE-006 · supervisor pierde `scopeAsesor` en superficies vecinas
- `VentasApp` calcula `scopeAsesor` para `getDashboardVentas`.
- `MiMatriculasMes` y `ProspectoDrawer` reciben todavía `usuario.nombre` en `main` base.
- PR #113 ya contiene el delta previsto.

### PV-QA-007 · comportamiento de prueba ligado a una cédula
- `ventas_drawer.jsx` contiene `previewMatriculaCR` y copy `Modo prueba controlado`.
- Debe salir del runtime normal o quedar detrás de un flag QA explícito.
- No se elimina sin verificar el flujo de pruebas que todavía lo consume.

### PV-DATA-008 · fallback productivo hacia `DEMO_GRUPOS`
- `useGruposVx()` usa `DEMO_GRUPOS` si la consulta real falla.
- Riesgo: un asesor puede recibir datos de ejemplo ante una falla de backend.
- Debe cambiar a error/estado vacío explícito en un corte independiente.

### PV-DATA-009 · asesores demo hardcodeados
- `ASESORES_V` contiene nombres demo y alimenta `Ver como asesor`.
- La lista debe provenir de backend/autorización real antes de considerar cerrada la superficie supervisora.

### PV-IDENT-010 · identificación de prospecto por heurística
- `sidebarEsUsuarioGratisF984Z6CS()` usa tipo explícito, pero también infiere free/prospecto por ausencia de código, grupo, matrícula y nivel.
- Una cuenta estudiantil incompleta podría clasificarse como prematrícula.
- Recomendación: claim backend explícito `account_stage` / equivalente.

## Guard CS21A151

`scripts/qa_prospectos_ventas_cs21a151.mjs` bloquea regresiones de este corte:
- no reintroducir el CSS inexistente;
- número visible = número priorizado para WhatsApp;
- no mostrar diagnósticos técnicos al prospecto;
- no reintroducir opciones bloqueadas en el menú free.

El guard además reporta como `WARN` la cédula QA, `DEMO_GRUPOS` y `postVentas()` sin token para mantener visibles los siguientes cortes sin mezclarlos con este PR.

## Pruebas todavía obligatorias antes de cualquier publicación

1. QA estática del guard CS21A151.
2. Checks generales del repositorio.
3. E2 autenticada read-only con una cuenta controlada de prospecto/free student.
4. 390 px y desktop: confirmar menú, portal, errores y navegación a English LAB.
5. Ventas: confirmar que el número mostrado coincide con el enlace WhatsApp.
6. E3 post-publicación solo si el usuario autoriza merge/release.

## Veredicto de este corte

`SOURCE CLEANUP IN PROGRESS · FRONTEND ONLY · NO PROD · E2/E3 PENDING`.
