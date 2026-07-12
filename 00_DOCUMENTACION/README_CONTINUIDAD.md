# CAMPUS VIRTUAL ACADEMIA NORTEAMERICANA — CONTINUIDAD VIGENTE

**Versión integral/frontend:** F98.4-Z6-CS21A67  
**Backend canónico instalado:** F98.4-Z6-CS21A64  
**Backend candidato completo:** F98.4-Z6-CS21A67  
**Base preservada:** CS21A66 / CS21A65 / CS21A64 / CS21A63 / CS21A62 / CS21A61 / CS21A60  
**Producción:** no verificada  
**Corte:** 12-jul-2026

## Cambio vigente CS21A67

### 1. Libros y Audios sin parpadeo de la biblioteca anterior

El cargador diferido ya no renderiza temporalmente el `MaterialesView` histórico de carpetas y PDFs. Para las rutas `MaterialesView` y `StudentCourseView`, espera a que el envoltorio vigente `__cs21a60UnitStarts` esté instalado antes del primer render.

Resultado esperado:

- Al abrir `Recursos Didácticos → Libros y Audios`, aparece la pantalla de carga normal.
- La biblioteca antigua no llega a mostrarse.
- El primer contenido visible es directamente el visor actual de libro abierto.

Archivo modificado: `src/lazy_loader.jsx`.

### 2. Botón 1.3.2 Recursos adicionales

Se agrega un botón compacto dentro de la franja de SB/TB/WB:

`1.3.2 RECURSOS ADICIONALES`

El botón abre un panel flotante y no cambia la posición, altura ni estructura del visor del libro.

Comportamiento por rol:

- **Docente:** únicamente `Diccionario Word by Word`.
- **Estudiante:** todos los recursos oficiales de su nivel.
- **Admin y superadmin:** árbol completo de recursos del nivel seleccionado.

El combo anterior de recursos queda oculto para evitar duplicados; los audios permanecen en su combo y reproductor compactos.

Archivo nuevo: `src/book_additional_resources_cs21a67.js`.

### 3. Carpetas oficiales por nivel

Se preservan las cuatro fuentes configuradas en Drive:

- B1: `1m5OkZtGrWytYunJdUyAUipf2s4QmSOo1`
- B2: `1n0JPcUcBAgho8kC6ofT9NuTw6fLVMITp`
- I1: `1nkuuggEea6sF476-J-IC6KMKzUuFwAm5`
- I2: `1npQrQgYbxMWA1KIpCjB94osOXWsOMdGb`

Cada nivel contiene materiales como Uso de Recursos Digitales, Manual de Enlaces, 50 Frases, la carpeta `English pronunciation made simple` y `WORD BY WORD DICTIONARY.pdf`.

## Backend candidato CS21A67

Preserva completamente CS21A66 y añade:

- Árbol recursivo seguro de `RECURSOS ADICIONALES`, hasta cuatro niveles de profundidad.
- Los archivos internos de carpetas, incluida pronunciación, se devuelven dentro de `children`.
- Se mantienen los filtros contra `__MACOSX`, archivos `._`, keys, answers y scripts.
- Cuando la sesión real es docente, `getBibliotecaNivelEstudiante` devuelve únicamente el Diccionario.
- Admin y superadmin conservan el árbol completo.
- Estudiantes reciben únicamente la carpeta oficial de su nivel y siguen sujetos a sus validaciones académicas.
- Nueva clave de caché `F984E_BIB_CS21A67_<NIVEL>` para no reutilizar catálogos antiguos.

Integridad:

- Archivo: `Code_F98_4_Z6_CS21A67_COMPLETO.gs`
- Tamaño: `2.936.329` bytes
- Saltos de línea: `51.687`
- SHA-256: `456aa5674a02c6f1c48c040dc073289bdb6f98ce96fe136b685259f98665b63b`
- Sintaxis: validada con `node --check`

El backend canónico de Drive continúa en CS21A64 hasta reemplazar completamente `Code.gs` y publicar una nueva implementación.

## Cambios preservados

- CS21A66: English LAB Gratis solo con `PROSPECTOS.INICIO_GRATUITO_AUTORIZADO`.
- CS21A65: Recursos Didácticos unificado como `Libros y Audios`, sin duplicados.
- Docente: SB/TB/WB y audios; sin controles administrativos.
- Estudiante: SB/WB, audios y recursos del nivel; sin TB.
- Superadmin: único rol con calibración U01–U16 y actualización desde Drive.
- CS21A64: propagación opcional de inicios de unidad.
- CS21A62: efecto de paso de hoja.

## Prueba inmediata

1. Instalar el `Code.gs` completo CS21A67 y publicar una nueva implementación.
2. Actualizar frontend y hacer `Ctrl + F5`.
3. Entrar como docente y abrir `Libros y Audios`.
4. Confirmar que la biblioteca antigua no aparece ni por un instante.
5. Confirmar el botón `1.3.2 RECURSOS ADICIONALES` junto a SB/TB/WB.
6. Abrirlo y verificar que el docente solo ve `Diccionario Word by Word`.
7. Entrar como estudiante de B1 y confirmar SB/WB, sin TB.
8. Abrir Recursos adicionales y verificar los materiales oficiales de B1, incluida la carpeta de pronunciación y sus archivos internos.
9. Cambiar de nivel en docente/admin y confirmar que el panel actualiza la carpeta correspondiente.
10. Confirmar que audios, PDF, zoom, pantalla completa, efecto de hojas y U01–U16 continúan funcionando.

## Reglas preservadas

- Nunca mover pagos entre niveles o intentos.
- No tocar pagos, certificados, CONAPE, calendario ni hojas académicas.
- No crear automatizaciones nuevas de CONAPE.
- No declarar producción verificada sin ejecutar las pruebas anteriores.
