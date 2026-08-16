# SPEAK LAB · PC8 · Calibración académica controlada

Fecha de corte: 2026-08-15

## Estado

QA / CALIBRACIÓN CONTROLADA. No producción. No audio estudiantil. No nota oficial. No thresholds pedagógicos.

PC8 se apila sobre el PronunciationEvaluator validado end-to-end en PR #100. El objetivo de este corte no es crear una nota, sino medir si las señales del proveedor son estables y suficientemente alineadas con revisión humana antes de diseñar feedback visible.

## Qué registra el dataset

Cada muestra usa únicamente:
- `sampleId`, `speakerId`, `reviewerId`, `cohortTag` y `phraseId` opacos;
- condición controlada: `good`, `intermediate` o `problematic`;
- número de repetición;
- confirmación `staffQaAuthorized=true`;
- evidencia del audio: SHA-256, bytes, duración y MIME;
- revisión humana 0–100 por las seis dimensiones contractuales;
- resultado SPEAK LAB ya reducido por el gateway.

No pertenecen al dataset ni al reporte:
- nombres, correos, cédulas o teléfonos;
- audio o rutas de audio;
- transcript;
- reference text / expected text;
- `PronScore`, `ProsodyScore` u otros campos crudos del proveedor;
- `officialGrade` o `finalGrade`.

## Qué calcula el harness

### Repetibilidad
Agrupa por speaker opaco + phrase ID + condición. Para cada dimensión disponible reporta `n`, media, mínimo, máximo, rango, desviación estándar y MAD. Con menos de 3 repeticiones declara `insufficient_data`; con 3 o más declara `descriptive_only`. Nunca declara PASS académico.

### Acuerdo humano ↔ proveedor
Solo compara dimensiones donde existen ambos valores. Reporta cantidad de pares, promedio humano, promedio proveedor, delta firmado medio y delta absoluto medio. Dimensiones que Azure todavía no mapea en SPEAK LAB permanecen sin comparación; no se infieren desde Prosody.

### Condiciones controladas
Resume `good`, `intermediate` y `problematic` para revisar si la señal se mueve en la dirección esperada. El harness no impone orden ni umbral; la interpretación queda para revisión académica.

### Cohortes opacas / revisión de posible sesgo
Agrupa por `cohortTag` opaco y compara deltas proveedor-humano. Esto sirve para inspección, no para atribuir nacionalidad, etnia, identidad o calidad de acento. Con pocos datos queda `insufficient_data`.

## Primer protocolo real recomendado

La primera sesión puede ser pequeña: una sola frase, un speaker staff autorizado y 3 condiciones × 3 repeticiones = 9 muestras. Esto sirve para revisar repetibilidad básica y separación direccional, pero NO permite concluir sesgo/acento.

Después se agregan otros speakers staff/QA autorizados y más frases. No hace falta empezar con decenas de estudiantes; estudiantes están fuera de alcance en PC8.

Para `good`, `intermediate` y `problematic`, la condición debe ser planificada por el equipo QA/docente. Una actuación deliberada de un mismo speaker es útil para sanity check, pero no sustituye muestras naturales de varios speakers en la calibración posterior.

## Revisión humana

La persona docente revisa la grabación sin mirar primero los scores del proveedor y asigna, cuando tenga evidencia suficiente, valores 0–100 a:
- intelligibility;
- segmentalAccuracy;
- wordStress;
- rhythm;
- fluency;
- intonation.

Una dimensión puede quedar `null` si el revisor no considera que tiene evidencia suficiente. El harness prefiere `null` antes que inventar precisión.

## Runner local

El dataset real vive fuera de Git. El runner genera el reporte dentro de `.speak-lab-calibration-local/`, carpeta ignorada por Git:

```powershell
node scripts/run_speak_lab_phase3_calibration_local.mjs C:\ruta\dataset.json
```

También se puede indicar una ruta explícita de salida:

```powershell
node scripts/run_speak_lab_phase3_calibration_local.mjs C:\ruta\dataset.json C:\ruta\report.json
```

El runner imprime solo conteos y ruta del reporte; no imprime audio, reference text, transcript ni identidades directas.

## Gate académico posterior

PC8 no establece thresholds. Antes de cualquier score visible hay que revisar:
1. repetibilidad por frase/condición;
2. acuerdo con revisión humana;
3. estabilidad entre speakers;
4. diferencias entre cohortes opacas;
5. errores sistemáticos por acento comprensible;
6. dimensiones que realmente puede sostener el proveedor;
7. wording pedagógico de issues;
8. privacidad/consentimiento antes de audio estudiantil.

Hasta entonces, cualquier reporte conserva:

```json
{
  "official": false,
  "calibrated": false,
  "thresholdsEstablished": false,
  "decision": "NO_AUTOMATIC_ACADEMIC_DECISION"
}
```

## Fuera de alcance

Producción, main, Apps Script, Apollo/CONAPE, Memory Match, PR #85/English LAB, notas INA/CONAPE, audio estudiantil y decisiones automáticas.
