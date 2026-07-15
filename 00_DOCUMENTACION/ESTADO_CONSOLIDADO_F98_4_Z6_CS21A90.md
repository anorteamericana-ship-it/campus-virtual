# Estado consolidado · F98.4-Z6-CS21A90-CONSOLIDADO

Corte de continuidad: **14-jul-2026**.

## 1. Base oficial de trabajo

La base consolidada del proyecto combina dos líneas vigentes:

- **Frontend en GitHub `main`**: incluye las mejoras acumuladas del Campus y el Calendario académico profesional `CS21A88`.
- **Backend integral en Apps Script**: `F98.4-Z6-CS21A90 · Rebeca V5 Ultra · tests reales corregidos`.

La próxima entrega nueva debe usar **CS21A91**.

## 2. Estado de despliegue

### Frontend

El frontend vigente está en la rama `main` del repositorio:

`anorteamericana-ship-it/campus-virtual`

### Backend Apps Script

El código `CS21A90` fue pegado en el editor de Apps Script y pasó la batería real completa.

**No se confirmó todavía en esta conversación que CS21A90 haya sido publicado como nueva versión del Web App.**

Por lo tanto, el próximo chat debe distinguir:

- editor de Apps Script: CS21A90 validado;
- deployment público: versión vigente por verificar antes de afirmar que CS21A90 está en producción.

Web App estable usado por el Campus:

`https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec`

Configuración conocida del deployment existente:

- Ejecutar como: propietario del proyecto.
- Usuarios con acceso: Cualquiera.

No guardar ni documentar el secreto HMAC.

## 3. Backend integral vigente: CS21A90

CS21A90 preserva todas las funciones de la línea anterior y consolida:

### Calendario backend CS21A80

- inventario persistente de grupos;
- lectura de `GRUPOS` como inventario maestro;
- nivel operativo elegido por estado fuente;
- horarios leídos como display values para evitar el desfase histórico de fechas 1899;
- deduplicación de estudiantes CA por estudiante + grupo + nivel;
- selección segura del ciclo de `CALENDARIO_LECCIONES`;
- `getFechasGrupo` sin normalizaciones que escriban durante una lectura.

### API comercial Rebeca CS21A81

Endpoint:

`agentGetCommercialConfig`

Incluye:

- grupos disponibles para inscripción;
- precios;
- horarios;
- programa;
- becas visibles;
- caché;
- autenticación HMAC.

No interpreta capacidad como cupos restantes. Cuando no existe una fuente confiable de cupos restantes, debe devolver `remainingSeats: null`.

### Contact Context endurecido

Endpoint:

`agentResolveContactContext`

Puede clasificar de forma segura:

- `ACTIVE_STUDENT`;
- estudiante conocido no activo;
- docente o personal interno;
- prospecto;
- desconocido;
- múltiples roles;
- múltiples identidades.

Conserva:

- E.164;
- HMAC ligado al teléfono;
- protección replay;
- caché individual por teléfono;
- teléfonos compartidos;
- guardianes/tutores sin fusión automática;
- merge seguro de prospecto histórico convertido;
- privacidad de cédula, correo, teléfono completo, dirección, claves, documentos y notas libres.

### Rebeca V5 Ultra · seguimiento comercial

Para un `PROSPECT` puede devolver un objeto público seguro `prospect` con:

- formulario recibido;
- etapa comercial;
- grupo tentativo seleccionado;
- programa;
- modalidad;
- financiamiento;
- beca y estado de beca;
- estado comercial de cuenta;
- conocimientos previos;
- asesor asignado;
- siguiente mejor acción.

Rutas comerciales modeladas:

- `LEAD`;
- `CONAPE_SOLICITUD`;
- `CONAPE_DOCUMENTOS`;
- `CONAPE_APROBADO`;
- `CONAPE_DESEMBOLSO`;
- `PAGO_ACADEMIA`;
- `ACTIVO`;
- `CANCELADO`.

CS21A90 corrige las pruebas reales que en A89 llamaban a un helper inexistente y conserva la proyección pública del objeto `prospect`.

## 4. QA real de CS21A90

Batería ejecutada en Apps Script real:

### Configuración HMAC

- configuración: aprobada;
- service ID: configurado;
- secreto: configurado;
- propiedades requeridas faltantes: 0.

### `agentGetCommercialConfig`

- 8 pruebas;
- 8 con `ok: true`;
- 0 fallos.

Incluye:

- auth;
- grupos reales;
- becas reales;
- encabezados;
- caché;
- privacidad;
- delegación de acciones;
- firma inválida.

### `agentResolveContactContext`

- 30 resultados;
- 30 con `ok: true`;
- 0 fallos;
- 0 excepciones;
- 2 `skipped:true` por falta de casos reales aplicables.

Casos omitidos aceptables:

- directorio docente sin teléfonos válidos;
- no existe actualmente un prospecto real con código ya presente en `DATOS` para el caso exacto de convertido.

Pruebas especialmente importantes aprobadas:

- `real_dopost` con `ACTIVE_STUDENT`;
- `real_response_privacy`;
- `real_sources` con 6 fuentes;
- `real_prospect_context`;
- `prospect_context_privacy`;
- `public_prospect_projection`;
- `prospect_journey_matrix` 9/9;
- `prospect_headers_real` 11/11;
- `real_prospect_dopost` con `contactType: PROSPECT`.

El caso real de prospecto resolvió:

- etapa: `LEAD`;
- siguiente acción: `CONTINUE_CONAPE_APPLICATION`.

## 5. Calendario académico frontend vigente: CS21A88

`CS21A88` es frontend-only.

Objetivo:

- una fila por grupo;
- columnas por día;
- fichas compactas por lección;
- filtros de estado;
- Semana y Mes;
- navegación a estudiantes del grupo.

Contrato:

### `GRUPOS`

Aporta:

- existencia del grupo;
- nivel operativo;
- estado fuente;
- días;
- horario;
- docente.

### `CALENDARIO_LECCIONES`

Aporta:

- fecha;
- número de lección;
- tipo;
- estado de clase.

### Regla `REVISAR`

Si `GRUPOS` dice En curso pero el ciclo seleccionado no tiene clases actuales ni futuras, la vista muestra `REVISAR`.

No modifica automáticamente la fuente.

QA de CS21A88:

- backend de calendario: 20/20;
- lógica frontend: 16/16;
- autoprueba runtime: `window.__AN_CALENDAR88_SELFTEST__`.

Estado de aceptación:

- implementado en GitHub;
- pruebas lógicas aprobadas;
- la revisión visual final del usuario sobre esta nueva presentación quedó pendiente al cambiar temporalmente de tema hacia Rebeca.

## 6. Mejoras recientes preservadas del frontend

La base actual también preserva, entre otras:

- `CS21A76`: perfil profesional docente y archivos;
- `CS21A77`: asistencia y seguimiento académico docente;
- `CS21A78`: filtro por grupo en Seguimiento inmediato de Cobranza y cartera;
- `CS21A75`: acceso directo de Superadmin a Libros y Audios;
- `CS21A73`: detalle de lección docente y acceso al planeamiento/libro;
- `CS21A72`: perfiles demo de estudiantes para QA visual.

No reconstruir estas funciones desde versiones antiguas.

## 7. Estado de fuentes canónicas

### Frontend

Fuente de verdad: GitHub `main`.

### Backend

Fuente de verdad operativa actual: código presente en el editor de Apps Script, versión CS21A90 validada.

El archivo histórico de Drive llamado `Code.gs` no debe asumirse como actualizado automáticamente. En iteraciones anteriores quedó rezagado frente al editor de Apps Script. Verificar antes de usarlo como base.

### Hojas

Las hojas reales siguen siendo fuente de verdad de datos. No duplicar datos académicos en frontend.

## 8. Regla de pruebas manuales

El usuario prefiere un único archivo temporal de QA en Apps Script.

Flujo correcto:

1. borrar el contenido del archivo de pruebas anterior;
2. pegar únicamente el test de la ronda actual;
3. ejecutar una sola función visible;
4. copiar el JSON completo;
5. borrar el test cuando termine la ronda.

No acumular decenas de funciones de pruebas antiguas en el selector.

## 9. Pendientes inmediatos

1. Verificar si CS21A90 ya fue publicado en el deployment existente. Si no, publicar una nueva versión manteniendo la misma URL.
2. Hacer una llamada HMAC externa real desde el agente Rebeca después del deployment.
3. Retomar la validación visual del Calendario académico CS21A88.
4. Continuar la mejora visual integral del Campus usando el roadmap consolidado.

## 10. Regla de continuidad

No asumir que “guardado”, “probado” y “desplegado” significan lo mismo.

Toda entrega debe declarar por separado:

- código modificado;
- pruebas ejecutadas;
- entorno de las pruebas;
- deployment realizado o pendiente;
- validación visual realizada o pendiente.
