# Reglas de interacción para pasos técnicos

Estas reglas aplican a instrucciones operativas del proyecto cuando el usuario debe ejecutar comandos, descargar artefactos, abrir herramientas o devolver evidencia.

## 1. Descarga explícita al inicio

Toda instrucción técnica debe indicar antes del detalle largo una de estas dos formas:

```text
DESCARGA: NO — no descargue ningún archivo en este paso.
```

O, cuando el archivo sea realmente necesario:

```text
DESCARGA: SÍ — descargue este archivo antes de continuar.
ARCHIVO OBLIGATORIO: <nombre exacto>
GUARDAR EN: <ruta exacta>
```

No generar ni enlazar archivos “por si acaso”. Si el usuario ya tiene el archivo o carpeta requerida, no pedir una descarga duplicada.

## 2. Orden obligatorio de una instrucción operativa

Usar este orden para que la acción no quede enterrada entre evidencia y explicación:

1. `ESTADO` — qué quedó demostrado y qué todavía no.
2. `DESCARGA` — `SÍ` o `NO` de forma explícita.
3. `ACCIÓN TUYA AHORA` — una acción o bloque claramente delimitado.
4. `QUÉ ME PEGÁS DE VUELTA` — salida exacta necesaria para el siguiente gate.
5. `DETALLE TÉCNICO` — fundamentos, riesgos, hashes y explicación adicional.

## 3. Archivos descargables

- Crear un archivo descargable solamente cuando su existencia sea necesaria para ejecutar o conservar el paso.
- Si se crea un archivo obligatorio, indicar nombre exacto, enlace y ubicación esperada antes de cualquier bloque técnico extenso.
- Si el paso puede ejecutarse con un bloque de texto o con archivos que ya existen en la PC/Drive del usuario, preferir no crear otro artefacto.
- Nunca dar por hecho que un archivo fue descargado solo porque se enlazó previamente.

## 4. Gates y evidencia

- No declarar `PASS` si la salida requerida no fue observada.
- Un `STOP` debe distinguir si ocurrió antes o después de una posible mutación.
- Cuando un paso implique Apps Script, datos, pagos, CONAPE o información académica, distinguir con claridad lectura, preparación, instalación temporal y escritura controlada.
- Las escrituras controladas deben ejecutarse únicamente en el entorno aislado autorizado y con verificación posterior.

## 5. Seguridad documental

Este repositorio es público. No registrar aquí secretos, credenciales, identificadores internos innecesarios, datos personales, enlaces privados ni detalles de infraestructura que no deban publicarse.

El checkpoint técnico detallado puede vivir en un recurso privado autorizado; la documentación pública debe conservar reglas, decisiones y procedimientos sin exponer información interna.
