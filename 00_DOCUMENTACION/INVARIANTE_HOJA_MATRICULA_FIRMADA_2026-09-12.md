# INVARIANTE · Hoja de matrícula y PDF firmado

Fecha canónica: 2026-09-12  
Área: Ventas → Documentos del estudiante → Hoja de matrícula  
Estado: **REGLA OPERATIVA CANÓNICA · IMPLEMENTACIÓN BACKEND REQUIERE RELEASE CONTROLADO**

## Objetivo

Evitar documentos duplicados, ambigüedad sobre cuál matrícula es vigente y reemplazos accidentales de un PDF ya firmado.

La matrícula documental tiene un ciclo monotónico:

`SIN_DOCUMENTO → BORRADOR_GENERADO → FIRMADO_FINAL`

Nunca debe retroceder de `FIRMADO_FINAL` a un borrador ni crear otra versión firmada por una acción ordinaria de Ventas.

## Invariantes obligatorios

### 1. Hoja de matrícula no firmada: una sola

Para una misma matrícula lógica del estudiante, identificada como mínimo por `codigo + cedula + tipo HOJA_MATRICULA`, la operación de creación es **idempotente**.

- Primer clic en **Hoja de matrícula**: crea el PDF si no existe uno canónico.
- Una vez creado: el botón debe cambiar a **Ver Documento**.
- **Ver Documento** abre o descarga el MISMO `file_id`; no vuelve a llamar una ruta de creación.
- Clic doble, reintento, recarga de página, otra pestaña u otro navegador no deben producir un segundo PDF.
- El backend es la autoridad. El estado no puede depender solo de React/localStorage.
- La creación debe estar protegida contra concurrencia (lock/transacción equivalente): `buscar → crear si no existe → devolver canónico` dentro de la misma exclusión.

### 2. PDF firmado: prioridad absoluta y estado terminal

Una vez que existe una matrícula firmada válida para la matrícula lógica:

- el documento firmado pasa a ser la versión canónica y final;
- el botón principal debe ser **Ver Documento firmado** (o texto equivalente inequívoco);
- desaparece o queda bloqueada la acción de generar otra hoja no firmada;
- desaparece o queda bloqueada **Subir PDF firmado**;
- una segunda petición de subida NO crea ni reemplaza un archivo; debe devolver el documento firmado existente o un estado de negocio equivalente a `documento_firmado_final`;
- una petición posterior de generación tampoco crea un borrador nuevo;
- ninguna acción ordinaria debe sobrescribir, mandar a papelera o sustituir el firmado.

Cualquier sustitución excepcional de un firmado requerirá un flujo administrativo distinto, explícito, auditado y fuera de la acción normal de Ventas.

### 3. Persistencia y lectura de estado

El frontend debe recibir desde backend el estado documental canónico al abrir el expediente. Como mínimo:

- `estado_documental`: `SIN_DOCUMENTO | BORRADOR_GENERADO | FIRMADO_FINAL`;
- `file_id` canónico visible para el rol autorizado;
- `firmado: true|false`;
- nombre/metadata necesarios para mostrar y abrir, sin usar URL pública como autoridad.

Si ya existe un firmado, ese estado prevalece aunque todavía exista físicamente algún PDF no firmado histórico.

## Evidencia del incidente que originó esta regla

Caso observado: estudiante código `17195`, cédula `305760973`.

Drive contiene varias hojas de matrícula generadas para la misma matrícula lógica, con nombres timestamped distintos, y además un PDF firmado posterior. Esto demuestra que la UI/flujo actual permite repetir la generación y que no existe una unicidad material garantizada por el estado visible.

En `src/ventas_drawer.jsx` observado en `main@ecdf7cda2437ae5cef8753c1f0fa693e115da7be`:

- el botón **Hoja de matrícula** sigue llamando `generarDocumentoVentasSeguro(...)` en cada clic;
- después de éxito no cambia a **Ver Documento**;
- `signedDoc` vive en estado React local;
- aun después de `setSignedDoc(r)`, **Subir PDF firmado** continúa visible y habilitable;
- por tanto, recargar el drawer pierde ese estado y no garantiza prioridad del firmado.

El hotfix CS21A212 / PR #283 solo cambió la forma de abrir/descargar la hoja generada. **No implementó unicidad, idempotencia ni prioridad del firmado.**

## Riesgo conocido de backend

Una copia histórica de Apps Script inspeccionada contiene búsqueda previa de un PDF con nombre estable para `generarDocumentoVentas`, pero también contiene `subirMatriculaFirmadaVentas` creando un archivo timestamped sin guard de existencia previo. Esa copia NO se considera prueba del runtime PROD actual.

Además, los nombres timestamped observados realmente en Drive difieren del esquema estable de esa copia histórica, por lo que no se debe usar ese `Code.gs` para construir el release. La fuente productiva real debe obtenerse desde el deployment vigente siguiendo `LIVE_CHANGE_RUNBOOK.md`.

## Criterios de aceptación antes de declarar cerrado en PROD

1. **Generación simple**: SIN_DOCUMENTO → un PDF; UI cambia a Ver Documento.
2. **Doble clic rápido**: sigue existiendo un único `file_id` canónico.
3. **Dos navegadores simultáneos**: ambos reciben el mismo `file_id`; no aparecen dos archivos.
4. **Recarga/reapertura**: UI recupera BORRADOR_GENERADO y muestra Ver Documento sin regenerar.
5. **Primera subida firmada**: transición a FIRMADO_FINAL.
6. **Segunda subida firmada**: no se crea ni reemplaza archivo; se conserva el mismo firmado.
7. **Generar después de firmado**: no crea borrador y devuelve/indica firmado final.
8. **Otro dispositivo después de firmado**: muestra Ver Documento firmado y no muestra acciones de creación/subida.
9. **Integridad**: el `file_id` firmado previo y posterior a reintentos es idéntico.
10. **Regresión**: Carta de no deuda y otros documentos no cambian por este contrato.

No declarar `FULL_E2E=PASS` con solo revisión estática.

## Datos históricos / limpieza

No borrar automáticamente duplicados ya existentes. Primero implementar la regla, identificar el documento canónico y luego, si se desea depurar históricos, preparar inventario exacto y solicitar autorización separada antes de borrar o mandar archivos a papelera.

## Relación con otras correcciones

- PR #283 / CS21A212: descarga/apertura de Hoja de matrícula; no sustituye esta invariante.
- Issue #346: error de interpretación `MAR/JUE` → `MIÉRCOLES Y JUEVES`; es un defecto de contenido independiente.
- `AGENTS.md` y `LIVE_CHANGE_RUNBOOK.md`: cualquier cambio de Apps Script/matrícula es **RELEASE CONTROLADO** y debe partir del runtime desplegado verificado, no de una copia histórica.

## Regla para futuras modificaciones

Toda modificación de Ventas, matrícula, documentos, Drive o Apps Script que toque este flujo debe preservar explícitamente:

`UN BORRADOR CANÓNICO MÁXIMO + UN FIRMADO FINAL MÁXIMO + FIRMADO TIENE PRIORIDAD ABSOLUTA`.

Si un cambio no puede demostrar esas tres propiedades, se considera regresión y no debe publicarse.