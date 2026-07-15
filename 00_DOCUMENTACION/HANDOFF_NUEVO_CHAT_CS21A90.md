# Handoff para nuevo chat · CS21A90

Usar este texto al iniciar el siguiente chat del proyecto:

Continuamos el proyecto **CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA** sobre la base **F98.4-Z6-CS21A90-CONSOLIDADO**.

Antes de modificar código, consulta en GitHub:

1. `README.md`
2. `00_DOCUMENTACION/ESTADO_CONSOLIDADO_F98_4_Z6_CS21A90.md`
3. `00_DOCUMENTACION/FUENTES_DE_VERDAD_Y_CONTRATOS.md`
4. `00_DOCUMENTACION/SKILL_CAMPUS_VIRTUAL_CS21A90.md`
5. `00_DOCUMENTACION/ROADMAP_VISUAL_PRIORIZADO.md`
6. El README histórico y los archivos actuales del módulo que vayamos a tocar.

Estado actual:

- Frontend oficial: GitHub `main`.
- Calendario académico global: `CS21A88`.
- Backend integral validado en Apps Script: `CS21A90`.
- Próxima entrega nueva: `CS21A91`.
- Verifica el deployment antes de afirmar que A90 está publicado.
- No uses un `Code.gs` histórico como base sin comprobar su versión.

Forma de trabajo:

- Responde en español directo.
- El usuario trabaja principalmente por copy/paste y espera implementación concreta.
- Preserva lo que ya funciona.
- Identifica la fuente de verdad antes de cambiar lógica o diseño.
- Evita apilar parches sobre el mismo componente.
- Revisa referencias locales/globales y lazy loading.
- Separa dominios académico, financiero y comercial.
- Prueba antes de entregar.
- Distingue entre guardado, probado, desplegado y validado visualmente.

QA Apps Script:

- un solo archivo temporal por ronda;
- borrar el test anterior;
- pegar solo el test actual;
- ejecutar una función principal;
- copiar el JSON completo;
- borrar el test al terminar.

Calendario:

- `GRUPOS` manda en existencia, nivel operativo, estado fuente, horario y docente;
- `CALENDARIO_LECCIONES` manda en fechas y eventos;
- CS21A88 puede mostrar `REVISAR` sin modificar fuentes;
- la validación visual final de A88 quedó pendiente.

Rebeca:

- endpoints: `agentGetCommercialConfig` y `agentResolveContactContext`;
- CS21A90 pasó 8/8 pruebas comerciales;
- Contact Context/V5 Ultra devolvió 30/30 resultados con `ok:true`;
- pasaron `real_dopost` de estudiante y prospecto;
- pasaron privacidad y matriz comercial;
- un prospecto puede recibir etapa comercial y siguiente mejor acción segura.

Reglas comerciales:

- `PROSPECTOS` no equivale a matrícula confirmada;
- la venta directa suele ser más rápida que forzar CONAPE;
- en `MULTIPLE_ROLES` o `MULTIPLE_IDENTITIES`, no asumir identidad ni activar venta automática.

Prioridad visual:

1. validar Calendario A88;
2. sistema visual común;
3. Superadmin/Admin;
4. Docentes;
5. Estudiantes;
6. Ventas/Rebeca;
7. Responsive, accesibilidad y rendimiento.

Para cada mejora: audita el archivo actual, declara la fuente de verdad y el flujo a preservar, implementa, prueba y entrega empezando por **CS21A91**.
