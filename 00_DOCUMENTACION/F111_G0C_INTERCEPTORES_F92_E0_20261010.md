# F111 G0-C · Interceptores POST antes del despacho central

**Corte E0:** 10-oct-2026. Backend base `campus_backend/main` @ `ef817145`. Este documento inspecciona la **última** declaración `function doPost(e)` en `prod/01_Router.js` (~4771-4795), que intercepta funciones seleccionadas antes de llamar a `doPost_F91_FINAL(e)`.

Se identificaron **19 selectores literales** interceptados (contados en el código), pero eso no implica 19 fallas de seguridad. La autorización suele estar en el handler o en un helper delegado y debe probarse por rol y propiedad en E2 aislado.

| Selector POST | Handler | Guardia interna observada o pendiente | Efectos / advertencia |
|---|---|---|---|
| reposmiestadof92 | reposMiEstadoF92 | `_reposF92_studentAuth_` token student+código sesión | Setup, sincronización, `_reposF91_set_`: **lectura con escritura** |
| getmisnotasf921 | getMisNotasF921 | `_reposF92_studentAuth_` | Lectura académica, depende de helpers |
| reposenviarsolicitudf92 | reposEnviarSolicitudF92 | `_reposF92_studentAuth_` | Escritura de solicitud |
| reposlistarsolicitudesf92 | reposListarSolicitudesF92 | `_reposF92_adminAuth_` | Setup/sincronización de estados; **no declarar read-only** |
| reposresolversolicitudf92 | reposResolverSolicitudF92 | `_reposF92_adminAuth_` | Escritura de resolución |
| reposcoordinaroralf926 | reposCoordinarOralF926 | `_reposF91_auth_` | Actualiza coordinación oral; revisar conjunto real de roles |
| completarprogresscheckcerradof98z6k | completarProgressCheckCerradoF98Z6K | `_f77_authTeacher_` + `_f77_canGroup_` | Registra PC de clase cerrada; `prod/02_Auth_Sesiones_Usuarios.js` 2628+ |
| getmiperfiladmin | getMiPerfilAdmin | `_esAdminOSuperadmin_` valida token admin/superadmin | Lee fila propia USUARIOS; 02_Auth 3063+ |
| getaperturasadmin | getAperturasAdmin | `_ap20Autorizar_` | Lee GRUPOS; `prod/45_CONAPE_Cambios_Academicos.js` 814+ |
| actualizaraperturaadmin | actualizarAperturaAdmin | `_ap20Autorizar_` | Escritura y recálculo GRUPOS; archivo 45 línea 940+ |
| getgruposencursoadmin | getGruposEnCursoAdmin | `_ap20Autorizar_` | Lee GRUPOS; archivo 45 línea 574+ |
| actualizargrupoencursoadmin | actualizarGrupoEnCursoAdmin | `_ap20Autorizar_` | Escritura; archivo 45 línea 641+ |
| getsuperadminmasterdashboard | getSuperAdminMasterDashboard | **GUARDIA NO VERIFICADA EN ESTE CORTE** | Localizar función efectiva, fuentes y roles |
| actualizarpanelconapeahora | actualizarPanelConapeAhora | `_conapeAxAuth_` | Llama `sincronizarCONAPE`, **escritura potencial**; archivo 41 línea 1161+ |
| auditarmorosidadconapemanual | auditarMorosidadConapeManual | Delega a `_conapeBdStudentAudit_` / `_conapeBdGlobalAudit_`; validar auth transitiva | No confundir su retorno solo_lectura con un chequeo de auth en el wrapper |
| aplicarcorreccionmorosidadconapemanual | aplicarCorreccionMorosidadConapeManual | `_esSuperadmin_` + `_conapeAxAuth_` | Escribe morosidad con lock; archivo 41 línea 1792+ |
| estadomonitoreoconapeax | estadoMonitoreoConapeAX | `_conapeAxAuth_` | Consulta configuración de monitoreo |
| instalarmonitoreoconapeax | instalarMonitoreoConapeAX | `_conapeAxAuth_` | En main responde bloqueado, monitoreo deshabilitado; no asumir instalación efectiva |
| desinstalarmonitoreoconapeax | desinstalarMonitoreoConapeAX | `_conapeAxAuth_` | En main responde bloqueado, sin cambio automático de triggers |

## Riesgos y decisiones de auditoría

1. **Prioridad alta (efectos no esperados):** `reposMiEstadoF92`, `reposListarSolicitudesF92`, `actualizarPanelConapeAhora` y escrituras identificadas no pueden tratarse como consultas E2 sin efectos. Probar solo en E4 aislado cuando pueda cambiar Sheets/CONAPE.
2. **Prioridad alta (cadena de auth):** faltan pruebas por rol/propiedad para 19 rutas directas; existen defensas internas en los handlers examinados, de modo que **NO se ha demostrado bypass de autenticación**.
3. **Prioridad media:** `getSuperAdminMasterDashboard` permanece por localizar/verificar en el conjunto completo de archivos backend. No atribuirle seguridad ni inseguridad sin leer su definición efectiva.
4. **Prioridad media:** auditar funciones `_conapeBdStudentAudit_` / `_conapeBdGlobalAudit_` y `_conapeAxAuth_` para confirmar límites de consulta según actor y datos. Sin realizar nuevas funciones CONAPE.
5. **Cierre pendiente:** reconstruir el orden completo de `doPost`, duplicaciones y wrappers alternativos (REBECA/ELV2/GET) y ejecutar E1 mocks + E2 autenticado en staging seguro.

**Este documento es E0 de código MAIN.** Ningún método se llamó con sesión, no hay confirmación del deployment vivo ni prueba E2/E4. G0 permanece EN CURSO.
