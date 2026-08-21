# BIBLIA DELTA ACTUAL — DOCUMENT SCANNER / PR #118

**Corte canónico:** 2026-08-20 21:33 Costa Rica  
**Repositorio:** `anorteamericana-ship-it/campus-virtual`  
**Rama de trabajo:** `feature/inscripcion-documentos-conape`  
**PR:** #118 · DRAFT · abierto · no mergeado  
**main vigente al corte:** `54f7c483bfef83d42911a4b25beb48769bf7d5dc`  
**head remoto PR #118 antes de este checkpoint documental:** `97b22afca25d35fda38fc289f52987c4162f54d4`  
**commit de este checkpoint documental:** `d9bb1288825e6ec23c37f96cdf37d06bf94ec4d8`

> **ÚNICO HANDOFF CANÓNICO DE ESTE CORTE.** No crear copias nuevas de handoffs/checkpoints para este trabajo. Si el estado cambia, actualizar este mismo archivo y el PR #118. Los scripts/QA/skill siguen siendo artefactos técnicos del módulo, no handoffs paralelos.

---

## 1. Reglas de trabajo

Aplican `AGENTS.md` y las reglas globales del repositorio:

- no usar PROD como laboratorio;
- cambios pequeños, reversibles y verificables;
- rama + PR + CI + revisión humana;
- lectura de código ≠ prueba funcional;
- distinguir validación estática, sintética, navegador, backend desplegado y runtime real;
- no merge ni deploy automático;
- no tocar Apps Script PROD durante QA.

**Regla adicional confirmada por el usuario:** Apps Script PROD no se usa para experimentos de autorización, pruebas ni mejoras. Para eso existe un proyecto QA pequeño y desechable.

---

## 2. Estado productivo confirmado

### Apps Script PROD

- Script ID: `1kV4wKnD_OU5DPQSawScjPsUbo1MOg_rAHbtpYupSMPkqywIVSQwdV4y2`
- Deployment estable: `AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ`
- **Versión productiva vigente: @417**
- `HTTP_FINAL=200` verificado después del rollback.
- HEAD Apps Script original restaurado.
- @418 queda histórica/no productiva y no debe reutilizarse como base sin una nueva revisión.

### Frontend

- PR #118 sigue **DRAFT**.
- No merge.
- No publicación del frontend de documentos.
- No declarar el scanner como integrado al producto todavía.

---

## 3. QA Apps Script desechable

Proyecto creado exclusivamente para CS21A144/Documentos:

- Nombre: `QA_CS21A144_DOCUMENTOS_CONAPE_20260820_1814`
- Script ID: `1tlNgSBabYYToK7EA1CYDSCF4lQUUAiJtRUmBECrg0Rd3OUP1i0ckm5p-`
- Carpeta local: `C:\Users\leodr\Documents\CampusVirtual\DisposableQA\QA_CS21A144_DOCUMENTOS_CONAPE_20260820_1814`

Resultados ya confirmados:

- `qaAutorizar`: ejecución completada.
- `qaSmokeSintetico`: PASS.
- PDF sintético: `application/pdf`, con bytes, privado, sin `ANYONE`.
- El generador posterior frente+dorso→PDF funciona en QA y se mantiene separado del trabajo de captura del prospecto.

**No volver a PROD para probar esto.**

---

## 4. Contrato funcional canónico del prospecto

Para **imágenes**:

`FOTO FUENTE TEMPORAL EN MEMORIA -> AJUSTE 4 ESQUINAS -> CORRECCIÓN DE PERSPECTIVA -> VISTA FINAL -> CONFIRMACIÓN -> SUBIR SOLO LA IMAGEN FINAL`

La foto fuente sirve únicamente para editar en el navegador. El objetivo operativo es **una sola imagen final por documento**, no `original + normalizada` como archivos permanentes duplicados.

### Identidad

- `cedula_frente.jpg`
- `cedula_dorso.jpg`

Luego, fuera del paso del prospecto:

`cedula_frente.jpg + cedula_dorso.jpg -> documento_identidad_solicitante.pdf`

El PDF es un artefacto interno para asesor/CONAPE. El prospecto no necesita generarlo, verlo ni manipularlo.

### Título / certificado / último grado

Mismo flujo de cuatro esquinas y confirmación. Resultado: una sola imagen final utilizable.

### PDF aportado por prospecto

Ruta excepcional posible: passthrough sin recorte/conversión y revisión del asesor. No es el flujo fotográfico principal.

### Decisión todavía abierta: foto fuente

No cambiar esta política todavía. La auditoría externa planteó tres opciones: no conservarla nunca, conservarla siempre, o conservarla temporalmente hasta revisión. Esto es una decisión de privacidad/trazabilidad/operación y debe resolverse aparte; no introducir copias permanentes accidentalmente durante la integración.

---

## 5. Evolución del scanner

- CS21A145: scanner local, detección/normalización inicial y QA estática/sintética.
- CS21A146: fallback manual de cuatro esquinas.
- CS21A147: contrato correcto de una sola imagen final; prospecto confirma antes de subir.
- CS21A148: ruta manual nativa de homografía para evitar depender de OpenCV durante el recorte manual.

La prueba visual real con la cédula problemática confirmó que el editor manual de cuatro esquinas y la vista final son el producto UX que se quiere conservar.

---

## 6. Estado LOCAL que NO se debe perder

El PowerShell del usuario quedó abierto en:

`C:\Users\leodr\Documents\CampusVirtual\RepoQA\campus-virtual-cs21a145-20260820_185914`

La auditoría independiente se hizo sobre:

- HEAD local `97b22af...`;
- **más 2 archivos con cambios locales CS21A148 sin commit**;
- el laboratorio generado `qa/document-scanner-local.html` aparece untracked y no es fuente canónica de producto.

### Regla crítica al reanudar

**NO ejecutar `git reset --hard`, `git pull` ni limpiar el working tree antes de inspeccionar y preservar el delta local CS21A148.**

Primeras comprobaciones del siguiente chat:

```powershell
git status --short
git rev-parse HEAD
git branch --show-current
git diff -- src/document-scanner.js scripts/write_document_scanner_lab_cs21a147.mjs
git diff --check
```

Después de verificar que el delta local coincide con CS21A148 y pasa QA, guardarlo de forma controlada en **la misma rama/PR**, evitando crear otra rama o otra copia de handoff salvo que exista una razón técnica real.

---

## 7. Auditoría independiente CS21A148 — conclusiones aceptadas como base de trabajo

La auditoría externa revisó el ZIP exacto del estado local, ejecutó verificación numérica de la homografía y no modificó nada.

### Confirmado como sólido

- `homographyDestToSource`: planteamiento correcto.
- `solve8`: eliminación gaussiana con pivoteo parcial correcta para el caso normal.
- mapeo destino→fuente: correcto.
- interpolación bilineal: correcta.
- margen aplicado en **espacio fuente antes de la homografía**: correcto; la objeción previa sobre margen en destino queda retirada.
- no agregar librería EXIF al flujo actual.
- conservar la disciplina de QA local y runner reversible.

### Bloqueadores pre-producción detectados

> La auditoría externa los llamó P0/P1. Para el repositorio, tratarlos como **blockers antes de producción**; no confundirlos con un incidente P0 productivo porque este scanner todavía no está publicado.

1. **El scanner aún no está integrado realmente en el producto.** El Paso 5 de `inscripcion.jsx` sigue en el flujo anterior; el laboratorio no equivale a integración.
2. **OpenCV todavía existe en rutas alcanzables** (`processFile` / `normalizeImage` / `detectCorners`) y `loadScript` carece de timeout. La ruta final debe dejar de depender de OpenCV.
3. **Orientación:** la heurística `orderQuad` + autorrotación puede dejar la cédula 180° invertida para un rango grande de rotaciones. Agregar control manual `Rotar 90°` y eliminar la autorrotación silenciosa.
4. **Geometría inválida:** impedir cruces de puntos y detectar cuadriláteros casi degenerados antes de procesar.
5. **Robustez del muestreo:** guardia para denominador/coordenadas no finitas; nunca producir regiones negras silenciosas.
6. **Calidad:** umbrales actuales no están calibrados con corpus real. Advertir antes que bloquear mientras no exista calibración confiable.
7. **localStorage:** migrar de denylist a allowlist explícita antes de integrar documentos nuevos.
8. **API del scanner:** no facilitar `source/original` en el resultado final que consume producto; el contrato debe exponer la imagen final confirmada.

### Mejoras UX de alto valor

- lupa 3× mientras se mueve una esquina;
- botón `Rotar 90°`;
- `Reiniciar esquinas`;
- impedir cruces/quad no convexo;
- validación de posible borde cortado;
- teclado + `aria-label` + `aria-live`;
- conservar los textos `FOTOGRAFÍA FINAL QUE SE ENVIARÁ` y `ESTA ES LA ÚNICA IMAGEN QUE SE SUBIRÁ`.

### Rendimiento

La auditoría recomienda WebGL1 + fallback nativo, pero **NO migrar todavía por intuición**. Primero medir la línea base del CS21A148 actual.

Métricas mínimas:

- tiempo hasta editor;
- tiempo de recorte;
- long tasks;
- memoria aproximada;
- tamaño/resolución JPG final;
- desktop con CPU throttle 6×;
- al menos un Android económico real y un iPhone/Safari antes de producción.

WebGL solo entra si la línea base demuestra que compra una mejora real suficiente.

---

## 8. MI ORDEN PARA CONTINUAR

### CS21A149 · corrección + medición del laboratorio

**No integrar aún al formulario productivo.** Primero cerrar el scanner como componente aislado.

Orden:

1. preservar y verificar el delta local CS21A148;
2. crear prueba reproducible 90° / 180° y confirmar/corregir orientación;
3. eliminar autorrotación silenciosa y agregar `Rotar 90°`;
4. agregar `Reiniciar esquinas`;
5. impedir cruces de puntos y quads degenerados;
6. guardias contra denominadores/coordenadas no finitas;
7. agregar lupa 3×;
8. eliminar OpenCV de toda ruta alcanzable del flujo final;
9. agregar instrumentación de benchmark;
10. probar la misma cédula problemática, dorso y título/certificado;
11. ejecutar QA matemática real además de QA de strings;
12. `git diff --check` + validaciones del módulo;
13. guardar el corte en la **misma rama/PR #118**.

### CS21A150 · integración real en `inscripcion.jsx`

Solo después de CS21A149 verde:

1. componente real `DocumentCapture` o equivalente en Paso 5;
2. mantener `Tomar foto` + `Subir archivo`;
3. editor de 4 esquinas automático al seleccionar imagen;
4. vista final + confirmación;
5. subir una sola imagen final por documento;
6. allowlist de borrador/localStorage;
7. ruta PDF passthrough si se conserva;
8. unificar límites de tamaño;
9. QA browser desktop 1440×900 y mobile 390×844;
10. no publicar hasta backend compatible + CI + revisión humana.

### Después

- volver al backend PDF frente+dorso;
- validar layout profesional y privacidad;
- preparar release Apps Script final con scopes/autorización predecibles;
- frontend solo después de compatibilidad backend;
- runtime final de inscripción pública;
- recién entonces declarar producción verificada.

---

## 9. Qué NO hacer al reanudar

- no tocar PROD @417;
- no mover deployment;
- no usar @418;
- no mergear PR #118;
- no crear otra colección de ZIPs/handoffs/checkpoints si este archivo puede actualizarse;
- no empezar por WebGL;
- no empezar por el PDF;
- no integrar `inscripcion.jsx` antes de cerrar CS21A149;
- no perder los cambios locales CS21A148 con reset/pull/clean;
- no declarar funcional algo probado solo por lectura o strings.

---

## 10. Fuente de verdad para el siguiente chat

En este orden:

1. `AGENTS.md`.
2. **Este archivo: `00_DOCUMENTACION/BIBLIA_DELTA_ACTUAL.md`.**
3. PR #118 y sus comentarios recientes.
4. Estado real de `main` y la rama.
5. Working tree local CS21A148 antes de tocarlo.
6. `skills/document-scanner-academia/SKILL.md`.
7. Auditoría independiente CS21A148 como evidencia de apoyo, no como reemplazo del código real.

Si existe contradicción entre recuerdos/chat y GitHub/working tree, manda GitHub + working tree verificado.
