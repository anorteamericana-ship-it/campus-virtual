# BIBLIA DELTA ACTUAL — F98.4-Z6-CS21A32

Esta Biblia Delta fija las reglas vigentes hasta el corte del 10-jul-2026. Pagos, certificados, trayectoria académica, CONAPE y calendario son módulos críticos.

## 1. Apps Script

- Toda modificación backend se entrega como `Code.gs` completo.
- Backend canónico vigente: CS21A32.
- No instalar fragmentos, overrides sueltos ni funciones duplicadas.
- Cada corte registra líneas, tamaño, SHA-256 y prueba de sintaxis.
- Respaldado no significa desplegado.

## 2. Seguimiento inmediato CONAPE

### 2.1 Identidad del movimiento

- La llave principal del desembolso es cédula + número de desembolso + periodo + año.
- Se conserva únicamente el movimiento más reciente de esa llave.
- Los pendientes se ordenan por detección más reciente.
- Los aplicados se mantienen al final, fuera de la cola principal, sin eliminarlos.

### 2.2 Enlace académico

- El movimiento se vincula con `DATOS`, `ESTATUS` y `GRUPOS`.
- El nivel se resuelve por estudiante + año + periodo.
- El grupo identifica el intento académico.
- Los intentos repetidos del mismo nivel se mantienen separados.
- Si no se resuelve un nivel, el movimiento queda pendiente de enlace.

### 2.3 Aplicado en sistema

- Solo puede mostrarse **Aplicado en sistema** si existe evidencia real en:
  - `PAGOS`
  - `OTROS PAGOS`
  - `PAGOS_CAMPUS`
- La evidencia debe coincidir con estudiante + nivel + grupo/intento.
- Un pago sin grupo se acepta únicamente si existe un solo intento del nivel.
- Con varios intentos, el pago sin grupo queda ambiguo y no se atribuye.
- `BDBANCARIO` está excluida porque contiene movimientos crudos del banco.
- Solicitudes de pago pendientes no son pagos aplicados.
- La marca significa que existe pago aplicado al nivel/intento; no reescribe ni consume el movimiento CONAPE.

### 2.4 Morosidad

- `7-morosidad` se enlaza por cédula + año + periodo.
- Estados visuales: Moroso, No moroso, Sin fila y Sin nivel enlazado.
- Morosidad `NO` no demuestra por sí sola que un desembolso fue aplicado.
- Morosidad `SI` no impide mostrar una aplicación parcial existente.
- Los duplicados de morosidad se advierten, no se corrigen automáticamente.

## 3. Finanzas vigentes

- B1, B2 e I1: Matrícula + Cuotas + Certificado.
- I2: Matrícula + Cuotas + Certificado I2 + Programa Completo + TOEIC.
- Certificado y emisión documental son conceptos separados.
- `PE` y `SIN REGISTRO` no generan deuda.
- No mover pagos entre niveles o intentos.
- Certificado I2 y Programa Completo pueden pagarse juntos.
- TOEIC usa valor individual de `DATOS` o respaldo de `GRUPOS`.

## 4. Trayectoria académica

- `DATOS` es identidad maestra; `ESTATUS` es trayectoria.
- `CA → APR` puede activar `PE → CA` o crear el siguiente nivel faltante como `CA` en una operación protegida.
- No copiar notas, evaluaciones ni certificado.
- No promover después de I2 ni con `REP` u otro estado.
- Consulta individual relee el expediente después de guardar.

## 5. Panel Maestro

- Cobranza y cartera es la primera sección y carga al abrir.
- Resumen institucional queda segundo.
- Seguimiento inmediato permanece visible aunque se oculten gráficos.
- Detalle usa `DATOS.COMENTARIO_ADMIN`.
- Consulta abre el expediente precargado.
- CONAPE se actualiza manualmente; no crear triggers.

## 6. Calendario y práctica pedagógica

- No ejecutar escrituras pesadas dentro de endpoints rápidos del calendario/dashboard.
- Academia Play y English LAB no afectan notas, aprobación, certificados ni pagos.

## 7. Regla de archivos

- Actualizar archivos activos cuando sea seguro.
- No crear documentación versionada redundante.
- El historial queda en Git.
