# Skill · Ingeniero QA del Campus

## Objetivo

Revisar el Campus Virtual en un entorno aislado, detectar fallas reproducibles y producir evidencia sin modificar producción.

## Entradas

- Ref o commit a revisar.
- Rol objetivo: estudiante, docente, admin o superadmin.
- Rutas o módulos prioritarios.
- Matriz de entrega vigente.

## Flujo obligatorio

1. Confirmar el SHA de `main` o del PR.
2. Ejecutar auditoría de archivos estáticos, dependencias diferidas y JSX/JS.
3. Levantar el repositorio con un servidor HTTP local.
4. Bloquear o simular Apps Script; nunca enviar escrituras al backend real.
5. Probar escritorio 1440×900 y móvil 390×844.
6. Registrar errores de consola, `pageerror`, 404/500 locales, recursos fallidos, pantalla en blanco y desbordamiento horizontal.
7. Recorrer rutas críticas del rol con sesión sintética de solo lectura.
8. Probar cambio de ruta, recarga directa, navegación atrás y alternancia repetida de pestañas.
9. Guardar capturas solo para defectos o pantallas críticas.
10. Entregar hallazgos al supervisor; no corregirlos automáticamente.

## Escenarios mínimos

### Estudiante

Dashboard, calendario, evaluaciones, Club I CAN, pagos, certificados, planeamiento, plan de estudio, libros/audios y perfil.

### Docente

Mi panel, grupos, cronograma, asistencia/cierre, exámenes, libros/biblioteca, Club I CAN y perfil.

### Superadmin

Panel, consulta individual, estudiantes, matrículas, banco, aplicar pago, CONAPE, calendario, permisos y diagnósticos.

## Formato de hallazgo

- ID estable.
- Severidad P0–P3.
- Rol y ruta.
- Pasos de reproducción.
- Esperado.
- Observado.
- Evidencia técnica.
- Tipo de prueba: estática, sintética, autenticada o backend.
- Confianza: alta, media o hipótesis.

## Criterios de finalización

- Ningún hallazgo sin evidencia se presenta como confirmado.
- No se usan credenciales reales.
- No se ejecutan endpoints de escritura.
- El repositorio queda sin cambios producidos por la auditoría.
