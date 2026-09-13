# Deployment checklist · CONAPE_MIRROR_SERVICE

Bloqueado hasta completar todos los puntos:

- [ ] Cuenta institucional técnica dedicada creada/verificada.
- [ ] Cuenta técnica tiene acceso de edición a CAMPUS_OPERATIVO.
- [ ] Proyecto standalone creado bajo esa identidad.
- [ ] `Code.gs` y `appsscript.json` cargados sin modificación.
- [ ] Script Property `CONAPE_MIRROR_HMAC_SECRET` configurada.
- [ ] Web App desplegada como USER_DEPLOYING.
- [ ] Acceso del Web App configurado para que Railway pueda invocarlo.
- [ ] Script ID y Deployment ID registrados en runbook.
- [ ] Railway recibe `CONAPE_MIRROR_SERVICE_URL` y `CONAPE_MIRROR_HMAC_SECRET`.
- [ ] Llamada HMAC directa `read_mirror` pasa.
- [ ] Snapshot válido de staging pasa.
- [ ] Snapshot inválido no escribe ninguna de las dos hojas.
- [ ] QA negativo confirma que ninguna otra hoja puede escribirse.
- [ ] Degradación limpia del bridge verificada con servicio inaccesible.
- [ ] Solo después de todo lo anterior se autoriza merge de #360.
