# Fuentes de verdad y contratos del Campus Virtual

Este documento evita que una pantalla, un parche o un chat nuevo invente datos que ya tienen una fuente oficial.

## 1. Principio general

Cada dato debe tener una sola fuente principal.

El frontend puede:

- presentar;
- ordenar;
- filtrar;
- comparar;
- advertir inconsistencias.

El frontend no debe:

- promover niveles por inferencia;
- cerrar grupos por fechas solamente;
- inventar cupos restantes;
- reconstruir estados financieros;
- duplicar datos maestros sin necesidad.

## 2. Fuente de verdad por dominio

### Código frontend

Fuente oficial:

- repositorio `anorteamericana-ship-it/campus-virtual`;
- rama `main`.

Antes de editar una pantalla, abrir sus archivos actuales desde GitHub. No trabajar desde un ZIP antiguo si la rama `main` tiene cambios posteriores.

### Backend Apps Script

Base validada actual:

`F98.4-Z6-CS21A90`

Estado:

- presente en el editor de Apps Script;
- batería real aprobada;
- deployment público de A90 por verificar.

No asumir que un archivo histórico de Drive llamado `Code.gs` contiene la misma versión que el editor.

### APOLLO · hoja `GRUPOS`

Fuente maestra para:

- código de grupo;
- programa;
- nivel de cada fila;
- periodo;
- fecha de inicio;
- modalidad;
- días;
- horarios;
- docente;
- estado fuente mediante `COMENTARIO`;
- disponibilidad para inscripción;
- precios del grupo;
- configuración I CAN.

Regla del calendario:

- `GRUPOS` determina existencia y estado administrativo de la fila;
- el calendario no puede eliminar un grupo porque no tenga eventos en la semana visible.

### `CALENDARIO_LECCIONES`

Fuente maestra para:

- fechas de clases;
- número de lección;
- tipo de lección;
- estado de la clase;
- horario efectivo cuando exista;
- reprogramaciones.

No debe decidir por sí sola la existencia del grupo ni promover el nivel operativo.

### `ESTATUS`

Fuente maestra para:

- estado académico por estudiante + grupo + nivel;
- `CA`, `APR`, `REP`, `CNV`, `PE`, `RJ`, `RI` y demás estados usados por el sistema;
- registro de certificado cuando corresponda.

Para `ACTIVE_STUDENT`, el Contact Context exige coincidencia exacta con:

- grupo del estudiante;
- nivel operativo actual del grupo;
- fila de `ESTATUS` del mismo grupo;
- fila del mismo nivel;
- estado final `CA`.

Una fila de `ESTATUS` sin grupo no activa automáticamente al estudiante.

### `DATOS`

Fuente principal de identidad estudiantil histórica/operativa.

Contiene datos personales y teléfonos.

No exponer por endpoints de Rebeca:

- cédula;
- correo;
- teléfono completo;
- dirección;
- fecha de nacimiento;
- claves.

### `USUARIOS`

Fuente de cuentas y roles internos.

Puede contener teléfonos de personal. Un mismo teléfono puede producir `MULTIPLE_ROLES`.

No asumir identidad única cuando el número coincide con más de una familia de rol.

### `DOCENTES`

Directorio docente.

Actualmente la prueba real puede quedar omitida cuando no existen teléfonos docentes válidos.

### `PROSPECTOS`

Fuente comercial de solicitudes/prospectos.

Es una solicitud o seguimiento comercial; no equivale automáticamente a matrícula confirmada.

Campos comerciales usados por Rebeca V5 Ultra:

- `TIMESTAMP`;
- `PROGRAMA`;
- `MODALIDAD`;
- `FINANCIAMIENTO`;
- `BECA`;
- `BECA_ESTADO`;
- `GRUPO_TENTATIVO`;
- `ASESOR_REF`;
- `CONOCIMIENTOS_PREVIOS`;
- `ESTADO_CUENTA`;
- `ETAPA`.

Campos que no deben salir en el objeto público de Rebeca:

- cédula;
- correo;
- teléfono completo;
- dirección;
- fecha de nacimiento;
- clave;
- notas libres;
- documentos.

### `CONFIG_BECAS`

Fuente maestra de becas visibles y activas.

No inventar elegibilidad cuando no exista una regla estructurada.

Cuando una condición no puede determinarse de forma confiable, usar `NEEDS_REVIEW` o `null` según el contrato.

### Mora / cobranza

La mora es un dominio financiero y no debe incrustarse en cada ficha de una agenda académica.

Puede consultarse en paneles de cobranza o seguimiento, pero no debe decidir por sí sola el estado académico del grupo.

## 3. Contrato del Calendario académico

### Entrada mínima

De `GRUPOS`:

- código;
- nivel operativo;
- estado fuente;
- días;
- horario;
- docente.

De `CALENDARIO_LECCIONES`:

- fecha;
- lección;
- tipo;
- estado.

### Salida visual

- una fila por grupo;
- una columna por día en Semana;
- fichas compactas por lección;
- filtros claros;
- Mes como vista complementaria.

### Estado visual `REVISAR`

Si `GRUPOS` dice En curso pero el ciclo seleccionado no tiene clases actuales ni futuras:

- mostrar `REVISAR`;
- no cambiar la hoja;
- no promover nivel;
- no marcar completado automáticamente.

## 4. Contrato de `agentGetCommercialConfig`

Acción POST:

`agentGetCommercialConfig`

Debe:

- usar HMAC;
- ser de solo lectura;
- devolver solo grupos disponibles para inscripción;
- leer precios reales;
- leer becas reales;
- usar caché corta;
- no exponer secretos;
- no interpretar capacidad como cupos restantes.

## 5. Contrato de `agentResolveContactContext`

Acción POST:

`agentResolveContactContext`

Debe:

- normalizar E.164;
- ligar la firma HMAC al teléfono;
- detectar repetición de nonce;
- resolver identidades con seguridad;
- devolver `MULTIPLE_IDENTITIES` o `MULTIPLE_ROLES` cuando corresponda;
- no vender automáticamente a una identidad ambigua;
- conservar privacidad;
- usar caché por teléfono.

Para un `PROSPECT`, CS21A90 puede devolver un objeto `prospect` seguro con contexto comercial y siguiente mejor acción.

## 6. Seguridad

Nunca documentar o subir al repositorio:

- `CAMPUS_REBECA_SERVICE_SECRET`;
- contraseñas reales;
- tokens de sesión;
- cookies;
- archivos privados con secretos.

Las propiedades no secretas de Rebeca pueden configurarse en Script Properties.

El secreto debe vivir únicamente en:

- Script Properties;
- entorno seguro del bot.

## 7. Reglas de edición

Antes de modificar código:

1. identificar archivo fuente actual;
2. leer dependencias y wrappers existentes;
3. revisar si el símbolo es local/léxico o global;
4. evitar parches a `window` cuando la referencia real es local;
5. preferir corregir la fuente o instalar una única capa final;
6. no mezclar dominios visuales sin necesidad;
7. probar con datos reales cuando sea seguro;
8. declarar qué quedó pendiente de validación visual o deployment.

## 8. Reglas de QA

Para pruebas de Apps Script:

- usar un único archivo temporal de pruebas;
- una función principal visible por ronda;
- capturar JSON completo;
- borrar el test al terminar;
- no acumular funciones de QA antiguas.

Para frontend:

- probar lógica pura cuando sea posible;
- comprobar orden de carga;
- comprobar lazy loader;
- comprobar estado vacío, error y carga;
- validar visualmente en navegador antes de declarar aceptación final.
