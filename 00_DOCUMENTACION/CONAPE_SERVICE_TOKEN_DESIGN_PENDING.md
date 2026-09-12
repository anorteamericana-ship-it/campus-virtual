# CONAPE service token · diseño diferido

Estado: **PENDIENTE / NO IMPLEMENTAR EN ESTE CAMBIO**.

Arquitectura acordada para la sincronización automática futura:

- identidad técnica propia: `CONAPE_SYNC_SERVICE`;
- token emitido por el propio Campus;
- vida corta;
- scope mínimo `conape:prospects:read`;
- validación por el Campus mediante el mecanismo de autenticación existente;
- verificación explícita del scope también en el bridge;
- el bridge debe rechazar explícitamente este token en `/v1/recruit/execute` y en cualquier ruta de escritura, aunque el token sea válido para lectura.

Este documento solo fija restricciones de diseño. No agrega emisión, validación, triggers ni rutas nuevas.
