# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A43

## 1. Seguimiento inmediato

Orden oficial:

`Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | Campus | WA`

- El código se muestra solo, sin etiquetas auxiliares.
- El nombre continúa destacado y la cédula queda debajo.
- Detectado no existe como columna; la fecha `dd/MM` acompaña al periodo.
- Toda la fila debe caber en el panel sin scroll horizontal.
- WA no puede quedar oculto.

## 2. Resumen académico

Fuente exclusiva: archivo externo oficial `6-historial`, ID `13rd_tMKkTS6CLqSJt1PWS7GNmLxAVrsqRAO395tynZI`.

Formato:

`NIVEL · AAAAPTIPO · ESTATUS NOTA`

Ejemplos:

- `BÁSICO I · 20253C · APR 100`
- `INTERMEDIO II · 20263C · PE`

Reglas:

- El código de materia determina el nivel.
- La nota solo se muestra si existe.
- Todas las filas de la cédula se conservan, incluso si hay intentos repetidos.
- La tabla no corrige, fusiona ni escribe 6-historial.
- La falta de filas se muestra como `Sin historial CONAPE`.

## 3. Coherencia técnica

- Apps Script lee 6-historial una vez por construcción del Panel Maestro.
- El frontend recibe `historySummary`; no consulta el spreadsheet por estudiante.
- Consulta individual está integrada en el componente principal.
- El parche DOM anterior deja de cargarse.
- El caché del Panel Maestro cambia a CS21A43.

## 4. Reglas preservadas

- 7-morosidad sigue definiendo aplicado o pendiente.
- El resumen académico no determina pagos.
- No se mueven pagos entre niveles o intentos.
- El frontend no escribe hojas financieras ni académicas.
- Code.gs se entrega completo.
- Respaldado no significa desplegado.
