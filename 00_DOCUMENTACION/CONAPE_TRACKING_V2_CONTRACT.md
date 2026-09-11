# CONAPE Tracking V2 · contrato read-only

Baseline: `main` en `67f8ad61d89cebba38204145d41165f4ca61e43c`; recruiter V2 se mantiene intacto.

## Objetivo
Agregar lectura de seguimiento desde la tabla Home CONAPE hacia Ventas sin ampliar el alcance de datos accesibles por el usuario del Campus.

## Endpoint
`POST /v1/tracking/query`

Entrada:
- `token`: sesión Campus.
- `cedulas`: lista explícita de identificaciones visibles por el cliente, máximo 100 por solicitud.

El bridge NO acepta una operación de listado global. Cada identificación solicitada debe ser reautorizada server-side contra Campus antes de poder aparecer en la respuesta. Una identificación no autorizada se omite o se reporta como no autorizada sin consultar ni devolver su fila CONAPE.

## Fuente
La tabla Home CONAPE autenticada es fuente de verdad. No se infieren estados ni fechas.

Headers reconocidos, con aliases normalizados:
- Cédula.
- Estado.
- Fecha de estado.
- Fecha de registro.
- Usuario que registró.
- Aprobación.
- Formalización.
- Último desembolso.
- Próximo desembolso.

El reporte puede contener nombre, apellidos, teléfono y correo, pero el endpoint de tracking NO debe devolverlos. Reclutamiento y tracking tienen contratos distintos.

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
- Duplicados en Home para una misma identificación solicitada: resultado `ambiguous`; no escoger una fila por heurística.
- Ausente en Home: `missing`; no convertirlo en un estado inventado.
- Sesión CONAPE vencida/login: fail closed.
- CORS/rate limit: reutilizar V2.

## Privacidad y observabilidad
Logs permitidos: acción, resultado, latencia, cantidades agregadas y `pii:false`.
Logs prohibidos: identificaciones, nombres, apellidos, teléfonos, correos, usuario_registro, HTML, tokens, cookies y valores del reporte.

Métricas permitidas: requested_count, authorized_count, returned_count, missing_count, ambiguous_count, invalid_date_count y parse_duration_ms.

## No negociables
- Campus nunca escribe nombre ni apellidos.
- Tracking es read-only: no ejecuta CREATE ni setters de APEX.
- Campus nunca reemplaza un correo existente en CONAPE.
- El navegador nunca recibe filas fuera de las identificaciones reautorizadas server-side.

## Secuencia de implementación
1. Parser aislado con fixtures sintéticos.
2. Autorización de lista contra Campus.
3. Lectura Home autenticada.
4. Filtro server-side antes de serializar respuesta.
5. QA que demuestre que una fila no autorizada presente en el HTML nunca llega a response.
6. Solo después conectar el cliente Ventas.
