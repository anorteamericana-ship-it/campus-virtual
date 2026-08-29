# CS21A168 · Release dependency matrix · 2026-08-29

## Propósito

Este documento evita confundir:

- código preparado;
- QA estática/sintética;
- lectura real;
- E2 autenticada;
- backend instalado en QA;
- merge a `main`;
- publicación frontend;
- deployment Apps Script;
- verificación productiva.

**No autoriza merge, deploy, ACL change, borrado ni PROD.**

## Fuente congelada de esta matriz

- `main`: `53df524d0a9eab867d3b307b3e633f366af92a63`
- Issue #111: gate de backend acumulado SEC-002/004.
- Issue #78 + PR #121: English LAB LIVE v2.
- PR #138: integración Prospectos/Ventas.

## Escala de evidencia

- **E0**: inspección/source estático.
- **E1**: prueba sintética/guard automatizado.
- **E2**: lectura/flujo autenticado real.
- **E3**: lectura sobre runtime/deployment real.
- **E4**: escritura controlada verificada.

Una fila con E1 verde no es equivalente a “lista para producción”.

---

## Matriz principal

| Bloque | PR/candidato | Evidencia alcanzada | Estado útil | Bloqueo antes de release |
|---|---|---:|---|---|
| Prospectos + Ventas integrado | **#138 / CS21A166** | E1 combinada verde; Real QA readonly revalidándose | Los cortes #123/#124/#125 + cadena #127→#131 conviven sin conflictos de source | E2 Sales real: asesor propio, cross-advisor deny, no activación por Sales, `scopeAsesor` consistente; SEC-002 backend para documentos |
| B1 Student Book | **#126 / CS21A154** | lectura real Apps Script + 12/12 Drive PASS en rerun previo | ID de B1 Student Book corregido | E2 visual del visor + cache-bust/publicación durante integración |
| SEC-002 Ventas docs | **#131 / CS21A159** | E1 verde | `docs_extra` + matrícula firmada consumen entrega privada en frontend | endpoints privados aún no portados al Apps Script QA modular vigente; ACL pública no se retira aún |
| SEC-002 certificado estudiante | **#132 / CS21A160** | E1 verde | no navega a `row.url`; Blob/ObjectURL + PDF/hash | `descargarMiCertificadoPrivado` backend QA + E2 propia/ajena + ACL QA |
| SEC-002 comprobante pago | **#133 / CS21A161** | E1 verde | no render/navega `url_comprobante`; Blob privado | `descargarComprobantePagoPrivado` backend QA + admin/superadmin E2 + ACL QA |
| SEC-002 matrícula firmada estudiante | **#134 / CS21A162** | E1 verde | estudiante tiene consumidor privado en Documentos y ayuda | `descargarMatriculaFirmadaPrivada` backend QA + E2 estudiante/Ventas propio-ajeno + ACL QA |
| SEC-004 Demo read-only global | **#135 / CS21A163** | E1 sintética verde | guard v3 provider/person-neutral, unknown/scope fail-closed | export modular QA fresco; adaptar identidad demo real; demostrar outermost `doPost`; E2/E4 cero side-effects |
| SEC-001 mínimo contraseña | **#136 / CS21A164** | E1 source verde | inscripción alinea mínimo visible 6 | validación server-side, common-password, rate limit/anti-enumeración; no es frontera de seguridad por sí sola |
| SEC-001 OIDC | **#137 / CS21A165** | E1 sintética verde | foundation provider-neutral e inerte; no cargada por login | proveedor DEV/QA, driver, snapshot Apps Script vigente, `AUTH_IDENTIDADES`, bridge, MFA/recovery, migración ficticia |
| English LAB LIVE v2 | **#121** + probe **CS21A167** | source E1–E10 verde; backend QA ya ejercitado; probe con `main` PASS | compatible con `main` actual; divergencia era solo hotfix Sales | E2 multiusuario real: join estudiante, submit real, scoring, ranking; no PROD |

---

## Gate común más importante: Apps Script QA modular vigente

Issue #111 sigue siendo el bloqueo transversal de SEC-002 y SEC-004.

Última evidencia canónica conocida del runtime QA:

- Script ID QA canónico documentado en Issue #111;
- proyecto **modular**, observado con **37 archivos** el 21-ago-2026;
- múltiples wrappers `doPost`;
- `99_QA_Staging_Guard.js` como capa observada posterior, pero el nombre por sí solo no prueba orden efectivo.

En la sesión del 29-ago se buscaron exports/backups recientes en Drive. Los artefactos hallados CS21A144/CS21A146 son anteriores al snapshot de 37 archivos. **No se deben usar como fuente de instalación.**

### Para desbloquear backend

1. exportar/fijar el HEAD Apps Script QA completo actual;
2. registrar manifest + SHA por archivo;
3. enumerar todas las reasignaciones `doPost` y orden efectivo;
4. portar únicamente deltas mínimos SEC-002/004 contra esa fuente exacta;
5. diff explícito;
6. instalar/versionar solo el deployment QA existente;
7. runtime positiva/negativa;
8. no tocar PROD.

---

## Orden recomendado de cierre de evidencia

### A. Sin escrituras productivas

1. cerrar Real QA readonly de #138 y clasificar cualquier P1 reproducible;
2. ejecutar E2 Sales con cuenta QA real/controlada;
3. ejecutar E2 multiusuario real de English LAB v2;
4. E2 visual B1 Student Book.

### B. Backend QA controlado

5. obtener snapshot modular QA fresco;
6. portar SEC-002 endpoints mínimos;
7. E2 privada positiva/negativa por clase documental;
8. retirar ACL pública **solo en QA** por clase, una vez que su consumidor privado pase;
9. repetir E2 tras ACL.

### C. Seguridad transversal

10. portar SEC-004 al snapshot vigente y demostrar cero side-effects demo;
11. validar mínimo de contraseña también server-side + rate limit;
12. configurar un IdP OIDC DEV/QA y probar identidades ficticias antes de cuentas reales.

### D. Release

13. construir candidato de integración final desde `main` vigente;
14. volver a ejecutar matriz completa de QA;
15. requerir autorización explícita del usuario para merge/publicación;
16. publicar frontend y/o versionar Apps Script como estados separados;
17. verificar producción después de cada cambio autorizado.

---

## Dependencias de integración importantes

### Ventas

#138 demostró que pueden coexistir:

- #123 y #124 en `ventas.html`;
- #125 y #127 en `ventas_dashboard.jsx`;
- #129/#130/#131 en `ventas_drawer.jsx` / `ventas_data.jsx`;
- token, `scopeAsesor`, asesores reales, demo isolation, teléfono/WhatsApp y consumidores privados.

Los PR individuales se mantienen por trazabilidad hasta decidir la consolidación; no cerrarlos solo por existir #138.

### SEC-002

No retirar `ANYONE_WITH_LINK` antes de que el consumidor privado de **esa misma clase** haya pasado runtime QA. El orden obligatorio es consumidor + endpoint + E2 → ACL QA → E2 otra vez.

### English LAB

El probe CS21A167 fusionó `main` sobre una copia del head de #121 y pasó toda la suite. #121 original no fue modificado. El único bloqueo serio restante es E2 real multiusuario, no la divergencia de tres commits.

---

## Limpieza / borrados

No mezclar housekeeping con release.

Únicos candidatos actualmente documentados como `MERGED_EQUIVALENT / deletion-ready`:

- `src/MATRIC~3.JSX`
- `src/PANEL_~1.JSX`

**No borrar sin aprobación separada y exacta del usuario para esos nombres.**

`src/conape_pending_audit_guard.jsx` no entra: conserva referencia viva en `campus.html`.

---

## Dictamen al crear esta matriz

**NO APTO PARA RELEASE GLOBAL TODAVÍA.**

Razón: existe una base de source moderna mucho más ordenada y varios guards verdes, pero faltan evidencias runtime decisivas en tres frentes:

1. E2 Sales;
2. E2 multiusuario English LAB v2;
3. backend privado SEC-002 sobre el Apps Script QA modular vigente.

SEC-004 y SEC-001 son foundations seguras/inertes, no cambios de runtime terminados.

Producción permanece fuera de alcance hasta autorización explícita y cierre de gates correspondientes.
