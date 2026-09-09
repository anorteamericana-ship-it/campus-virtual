# C3.1 · CONAPE Portal Discovery / Parser Read-Only

**Rama:** `feature/conape-portal-parser-c3-1`  
**Base:** `main@b025b270b8df633efe7d7682666645cf8dfe6030`  
**Nivel objetivo:** E1 SINTÉTICA LOCAL/CI  
**PROD / Apps Script / CONAPE writes:** NO

## Evidencia observada

En navegador autenticado del propietario se observó que el módulo `Prospectación Reclutador` usa Oracle APEX Interactive Report y actualiza el reporte mediante `wwv_flow.ajax`.

La carga visible incluyó conceptos APEX como `p_flow_id=302`, `p_flow_step_id=1`, `p_widget_name=worksheet` y `p_widget_action=QUICK_FILTER`. Esos identificadores de sesión/request NO se copian al fixture, al parser ni al output.

La respuesta observada es HTML del reporte, no JSON. Se vieron encabezados de negocio como Cédula, apellidos, nombre, teléfono, correo, Estado, Fecha de Estado, Fecha de Registro, Usuario que Registró, Aprobación, Formalización, Último Desembolso y Próximo Desembolso.

## Implementación C3.1

`parse_apex_report.mjs`:

- localiza una tabla que contenga las columnas requeridas;
- identifica columnas por encabezado, tolerando reordenamiento;
- decodifica entidades HTML y normaliza texto;
- conserva `cedula_raw` y crea `cedula` solo-dígitos;
- convierte explícitamente DD/MM/YYYY a YYYY-MM-DD;
- conserva `estado_raw` y deriva `estado_key` determinista;
- calcula SHA-256 de proceso y registro;
- detecta duplicados, fechas inválidas y estados desconocidos;
- bloquea columnas requeridas ausentes;
- diferencia reporte vacío válido de fuente/login/error APEX incorrecto.

## Fixtures

Los fixtures de `tests/fixtures/conape_portal/` son deliberadamente anonimizados. No contienen cédulas, correos, teléfonos, cookies, sesiones, tokens ni usuarios reales obtenidos del portal.

Cubren:

- reporte con varias filas;
- estado desconocido;
- identidad duplicada;
- columnas opcionales ausentes;
- columna requerida ausente;
- reporte vacío válido;
- columnas reordenadas.

## Gate C3.1

Debe pasar:

1. sintaxis Node;
2. `html_rows_detected === records_parsed` en reportes válidos;
3. normalización de identificación/fecha/estado;
4. hash de proceso estable ante cambio solo de contacto;
5. hash de registro sensible a ese cambio;
6. estado desconocido = warning, no inferencia;
7. duplicado = warning, no colapso silencioso;
8. columna requerida ausente = bloqueo;
9. columna opcional ausente = warning;
10. login/sesión/error no puede convertirse en reporte vacío;
11. output sin `session=`, `p_instance`, cookies, authorization ni `p_request`.

## Qué NO prueba

El fixture reproduce la estructura observada, pero no es una exportación completa del response real. Por tanto C3.1 no declara todavía equivalencia fila-a-fila con CONAPE ni captura automática autenticada.

Ese cierre corresponde a C3.2/E2: obtener el HTML con sesión controlada de solo lectura y someterlo al mismo parser sin cambiar su contrato.

## Siguiente corte

C3.2 debe resolver exclusivamente la adquisición segura del HTML: autenticación privada, sesión APEX efímera, obtención del Interactive Report completo y entrega del HTML a C3.1. La persistencia `CONAPE_PORTAL_ACTUAL/EVENTOS/RUNS` sigue posterior a la validación E2.
