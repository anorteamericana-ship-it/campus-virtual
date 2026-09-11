# CONAPE Tracking V2 · contrato read-only

Baseline: `main` en `67f8ad61d89cebba38204145d41165f4ca61e43c`; recruiter V2 se mantiene intacto.

## Objetivo
Agregar lectura de seguimiento desde la tabla Home CONAPE hacia Ventas sin ampliar el alcance de datos accesibles por el usuario del Campus.

## Endpoint
`POST /v1/tracking/query`

Entrada:
- `token`: sesión Campus.
- `cedulas`: lista explícita de identificaciones visibles por el cliente, máximo 100 por solicitud.

El bridge NO acepta una operación de listado global. Cada identificación solicitada debe ser reautorizada server-side contra Campus antes de poder aparecer en la respuesta. Una identificación no autorizada se omite sin consultar ni devolver su fila CONAPE.

## Autorización de alcance
La sesión Campus se valida exactamente una vez por request de tracking, reutilizando las guardas V2 de rol/read-only/rate limit. Después, cada cédula normalizada se revalida individualmente mediante `getProspectoDetalle` con el mismo token. Solo se autoriza cuando la cédula devuelta coincide exactamente y el financiamiento sigue siendo `CONAPE`.

No se debe llamar `validarSesion` una vez por cédula: además de ser redundante, eso consumiría el rate limit V2 antes de alcanzar el máximo contractual de 100 identidades. Las consultas individuales de detalle deben ejecutarse con concurrencia acotada; una falla real del backend Campus se propaga fail-closed y no se interpreta como "sin acceso".

## Fuente
La tabla Home CONAPE autenticada es fuente de verdad. No se infieren estados ni fechas.

Headers reconocidos, con aliases normalizados:
- Cédula / Identificación.
- Estado.
- Fecha de estado.
- Fecha de registro.
- Usuario que registró.
- Aprobación / Fecha de aprobación.
- Formalización / Fecha de formalización.
- Último desembolso / Fecha último desembolso.
- Próximo desembolso / Fecha próximo desembolso.

El reporte puede contener nombre, apellidos, teléfono y correo, pero el parser de tracking no los incorpora al record de proceso y el endpoint NO debe devolverlos. Reclutamiento y tracking tienen contratos distintos.

## Respuesta permitida
Por cada identificación autorizada y no ambigua:
- `cedula`.
- `estado_raw`.
- `fecha_estado` y `fecha_estado_raw`.
- `fecha_registro` y `fecha_registro_raw`.
- `usuario_registro`.
- `fecha_aprobacion` y raw.
- `fecha_formalizacion` y raw.
- `ultimo_desembolso` y raw.
- `proximo_desembolso` y raw.
- `captured_at`.

Estados observados incluyen `REGISTRO`, `CONFIRMADO` y `CREÓ CUENTA`. Son ejemplos observados, no un enum cerrado. Todo estado nuevo se entrega como `estado_raw`; nunca se inventa un mapeo.

## Fechas
Solo normalizar formatos estrictamente reconocidos (`dd/mm/yyyy`, `dd/mm/yyyy HH:mm[:ss]`, ISO simple). Ante formato desconocido conservar `*_raw` y dejar el valor normalizado en `null`. Nunca fabricar una fecha.

## Guardas
- Roles: reutilizar la autorización de sesión V2.
- Financiamiento: cada prospecto autorizado debe seguir siendo CONAPE.
- Límite: máximo 100 identificaciones por llamada.
- Identidades inválidas o duplicadas en el request no amplían el alcance.
- Duplicados en Home para una misma identificación solicitada: resultado `ambiguous`; no escoger una fila por heurística.
- Ausente en Home: `missing`; no convertirlo en un estado inventado.
- Sesión CONAPE vencida/login: fail closed.
- CORS/rate limit: reutilizar V2.

## Privacidad y observabilidad
Logs permitidos: acción, resultado, latencia, cantidades agregadas y `pii:false`.
Logs prohibidos: identificaciones, nombres, apellidos, teléfonos, correos, usuario_registro, HTML, tokens, cookies y valores del reporte.

Métricas permitidas: requested_count, authorized_count, returned_count, missing_count, ambiguous_count, invalid_date_count y parse_duration_ms. No incluir listas de cédulas en logs ni métricas.

## No negociables
- Campus nunca escribe nombre ni apellidos.
- Tracking es read-only: no ejecuta CREATE ni setters de APEX.
- Campus nunca reemplaza un correo existente en CONAPE.
- El navegador nunca recibe filas fuera de las identificaciones reautorizadas server-side.

## Secuencia de implementación
1. Parser aislado con fixtures sintéticos. **Implementado E1 en #321.**
2. Autorización de lista contra Campus, una sesión + detalle por identidad. **Implementado como módulo E1 en #321.**
3. Lectura Home autenticada en `server_v2.mjs`.
4. Filtro server-side antes de serializar respuesta.
5. QA que demuestre que una fila no autorizada presente en el HTML nunca llega a response. **Cubierto E1 por módulos; falta gate del router HTTP.**
6. Solo después conectar el cliente Ventas.
