# CS21A210BI · Raw user error scanner V4

Base exacta: PR #260 / `848b5ada270137732662851bf14b7549bdbe42bc`.

## Problema demostrado
V3 usa una búsqueda por `\bsetX(`. Esa frontera léxica también coincide dentro de métodos miembro: `sessionStorage.setItem(...)` entra como si `setItem(...)` fuera un setter React/UI bare. CS21A210BH demostró ese falso positivo en `src/english_lab_free_access_cs21a66.js`.

Modificar V3 sería incorrecto porque múltiples cortes históricos lo congelan por blob (`1f8c3ba22af2745eb153473c1e321cb61f430819`).

## Cambio E0/E1
Se agrega V4 como scanner nuevo y se deja V3 byte por byte intacto. V4 conserva el inventario de setters/toasts/dispatch bare, pero descarta coincidencias cuyo identificador está precedido inmediatamente por `.` o por un carácter de identificador. Así `sessionStorage.setItem(...)` y `obj.setError(...)` no se clasifican como setters UI bare.

El guard BI exige:
- blob V3 histórico intacto;
- V4 reduce al menos un finding respecto a V3;
- `src/english_lab_free_access_cs21a66.js` desaparece del inventario V4 por el falso positivo `setItem`;
- los residuos bare conocidos de `admin_students`, `cronograma` y exámenes siguen presentes;
- fixture sintética separa llamadas bare de member methods.

## Límite importante
V4 solo mejora precisión léxica. No convierte sus findings en bugs ni resuelve data-flow indirecto. En particular, BH sigue demostrando una fuga visible real `state.message -> AccessMessage` en English LAB Gratis aunque V4 ya no marque el falso `sessionStorage.setItem`.

0 rutas funcionales modificadas. No backend, Apps Script, Drive ACL, main, PROD ni E2.
