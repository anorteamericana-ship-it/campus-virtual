# ARQUITECTURA — English LAB Live hasta CS20H

## Flujo docente

`EnglishLabLiveTeacherView` carga grupos y salas mediante Apps Script. El docente crea una sala y controla la ronda desde `RoomControl`.

Funciones principales de backend usadas:

- `englishLabLiveGetTeacherData`
- `englishLabLiveCreateRoom`
- `englishLabLiveGetRoomControl`
- `englishLabLiveStartRoom`
- `englishLabLiveLaunchQuestion`
- `englishLabLiveCloseRound`
- `englishLabLiveCloseRoom`

## Flujo estudiante

`EnglishLabLiveStudentView` permite ingresar por código `LAB-####`. CS20H mejora la pantalla de entrada y lee el código desde URL.

Funciones principales:

- `englishLabLiveJoinRoom`
- `englishLabLiveGetPlayerState`
- `englishLabLiveSubmitAnswer`

## Comunicación actual

Se usa polling ligero desde frontend. Esto es suficiente para piloto controlado. No debe tratarse como realtime pesado tipo WebSocket.

## Límite técnico actual

Apps Script funciona para piloto con pocos participantes. Si se busca uso masivo simultáneo, el siguiente rediseño debe mover realtime a Firebase, Supabase, WebSocket o backend dedicado.

## Seguridad de regla académica

Las tablas live no se cruzan con notas oficiales. El ranking es temporal y gamificado.
