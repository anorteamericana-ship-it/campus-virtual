# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — ESTADO VIGENTE

**Versión integral:** F98.4-Z6-CS21A43  
**Backend:** CS21A43  
**Frontend:** CS21A43  
**Corte:** 11-jul-2026

## Seguimiento inmediato

Orden oficial:

`Código | Estudiante | Resumen académico | Movimiento | Periodo / nivel | Campus | WA`

Cambios vigentes:

- código independiente, grande y seleccionable;
- eliminado el texto auxiliar de copiado;
- eliminada la columna Detectado;
- fecha corta integrada en Periodo/nivel;
- resumen de los cuatro niveles desde el archivo oficial 6-historial;
- tabla fija al 100 %, sin scroll horizontal;
- WA permanece visible.

## Backend

El Code.gs completo lee una sola vez 6-historial, forma un índice por cédula y entrega datos estructurados al frontend. La lectura es de solo consulta.

SHA-256 Code.gs: `8eefafd6f8054033273c4a4451e85a55ce66735ccfeb6b141f820c290471fcca`

## Pruebas obligatorias

1. Abrir Seguimiento inmediato.
2. Confirmar que la primera columna contiene solo códigos.
3. Confirmar que no existe la columna Detectado.
4. Validar la cédula 119960973: B1 20253C APR 100; B2 20261C APR 95; I1 20262C CA 70; I2 20263C PE.
5. Confirmar que WA permanece visible sin scroll horizontal.
6. Abrir Consulta desde una fila y comprobar que usa el código correcto.

Producción no se considera confirmada hasta completar estas pruebas en el sitio publicado.
