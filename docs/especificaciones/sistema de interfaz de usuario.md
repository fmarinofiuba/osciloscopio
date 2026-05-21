# UI Overlay y Sistema de Interfaz de Usuario

## Osciloscopio Virtual 3D WebGL

---

# 1. Objetivo

El objetivo de este documento es definir la arquitectura conceptual, visual y funcional de la interfaz de usuario HTML superpuesta utilizada en la aplicación del osciloscopio virtual.

La UI deberá:

- complementar la interacción 3D,
- no obstruir innecesariamente el viewport,
- priorizar la manipulación directa del instrumento,
- permitir ejercicios guiados,
- mostrar documentación y ayuda,
- soportar distintos modos de interacción,
- mantener una experiencia visual limpia y espacial.

La UI no deberá sentirse como una aplicación web tradicional con paneles permanentes, sino como una capa contextual liviana sobre el entorno 3D.

---

# 2. Principios generales de diseño

La interfaz deberá priorizar:

- visibilidad clara del osciloscopio,
- mínima obstrucción del viewport,
- aparición contextual de información,
- simplicidad visual,
- transiciones suaves,
- separación entre modos de aplicación e interacción,
- consistencia entre desktop y touch.

La experiencia principal deberá centrarse en:

- interacción directa con el instrumento,
- configuración explícita de señales de entrada,
- exploración visual,
- manipulación espacial.

---

# 3. Arquitectura general de UI

La interfaz se dividirá en dos componentes principales:

## 1. Panel Workspace

Panel contextual lateral expandible ubicado sobre el borde derecho de la pantalla.

Responsable de:

- configuración de señales de entrada (Laboratorio),
- inspección educativa de controles (Explicar),
- ejercicios guiados,
- documentación,
- configuraciones generales.

A diferencia de la iteración anterior, el panel Workspace tiene contenido persistente: por defecto la aplicación arranca con el panel expandido en la sección Laboratorio.

---

## 2. Barra inferior

Barra horizontal inferior siempre visible.

Responsable de:

- accesos rápidos de cámara,
- reset de cámara y de osciloscopio,
- pantalla completa.

La barra inferior ya NO contiene el toggle "Explicar"; el modo Explicar ahora es una sección del menú principal.

---

# 4. Estados visuales del Panel Workspace

El panel tendrá tres estados conceptuales:

## Oculto

El panel no ocupa espacio visual. Solo permanece visible la barra inferior. Este estado se reserva para escenarios de pantalla completa extrema y no se utiliza durante la operación normal.

## Launcher compacto

Estado reducido cuando el usuario colapsa explícitamente el panel mediante el botón "✕" del header.

El panel se representa como un launcher flotante compacto en la esquina superior derecha, etiquetado:

```text
╭──────────────╮
│ ◎ Menú ▸     │
╰──────────────╯
```

Al hacer click sobre el launcher, el panel se expande nuevamente y aterriza por defecto en la sección **Laboratorio**.

## Workspace expandido

Estado completo del panel. Ocupará aproximadamente 30% a 35% del ancho de pantalla. Contendrá header (pestañas de modo), contenido central y footer contextual.

Ejemplo conceptual:

```text
╭───────────────────────────────────────────────╮
│ Laboratorio  Explicar  Ejercicios  Manual  ⚙  ✕│
├───────────────────────────────────────────────┤
│                                               │
│        contenido contextual del modo          │
│                                               │
├───────────────────────────────────────────────┤
│ (acciones contextuales — opcional)            │
╰───────────────────────────────────────────────╯
```

---

# 5. Apariencia visual del panel

El panel deberá ser semitransparente, moderno, minimalista y liviano visualmente. No deberá sentirse como una ventana rígida tradicional.

Características visuales:

- transparencia parcial,
- sombras suaves,
- bordes redondeados,
- transiciones animadas,
- slide in / slide out.

No se utilizará blur complejo en tiempo real como requerimiento obligatorio.

---

# 6. Launcher flotante

El launcher representa el estado colapsado del Workspace. No es un widget independiente.

Al hacer click se expande el panel completo y se navega automáticamente a la sección **Laboratorio**.

No existen dropdowns, popups de navegación ni submenús flotantes desde el launcher. La navegación entre secciones solo existe dentro del workspace expandido.

---

# 7. Secciones del menú principal del Workspace

La navegación principal del Workspace representa cinco **modos de trabajo** mutuamente excluyentes:

```text
Laboratorio
Explicar
Ejercicios
Manual
Configuración
```

Seleccionar una sección expande el panel (si estaba colapsado) y reemplaza el contenido contextual.

Cambiar de sección sale automáticamente del modo Explicar (si estaba activo) y vuelve `interactionMode` a `interact`.

---

# 8. Laboratorio Mode

## Objetivo

Permitir al usuario configurar libremente las señales de entrada conectadas a los canales CH1 y CH2 del osciloscopio.

## Comportamiento por defecto

- Es la sección por defecto al iniciar la aplicación.
- El panel permanece expandido (no se colapsa automáticamente).
- El usuario interactúa simultáneamente con los controles 3D del instrumento y con los inputs del panel.

## Contenido del panel cuando no hay ejercicio activo

Dos secciones, una por canal:

- **Canal 1**
  - tipo de señal (Senoidal / Cuadrada),
  - amplitud (V),
  - frecuencia (Hz),
  - fase (°),
  - offset (V),
  - duty cycle (%) cuando el tipo es Cuadrada.
- **Canal 2**: misma estructura.

Cada parámetro se edita mediante un slider con un input numérico asociado. El tipo se selecciona con un par de pills.

Cada cambio impacta inmediatamente sobre el `InputSignalManager` y, en el caso de CH1, sobre el `DisplayRenderer`. En esta iteración CH2 se almacena pero **no llega todavía al renderer**.

## Comportamiento durante un ejercicio activo

Cuando `activeExercise != null`, el panel Laboratorio NO muestra controles editables. En su lugar muestra un mensaje informativo:

```text
Hay un ejercicio en curso.

Para modificar las señales de entrada,
debe finalizar o abandonar el ejercicio actual.
```

Junto a un botón `[ Volver al ejercicio ]` que navega a la sección Ejercicios.

---

# 9. Explicar Mode

## Naturaleza conceptual

Explicar es una **sección principal** del menú (no un toggle de la barra inferior). Cuando el usuario la selecciona, la aplicación entra en modo de inspección educativa.

## Funcionamiento

Mientras Explicar está activo:

- los controles 3D del osciloscopio NO ejecutan acciones reales,
- los controles 3D funcionan como elementos inspeccionables,
- al hacer click sobre una perilla o botón se despliega información contextual en el panel: nombre, descripción funcional, rangos o pasos, referencias relacionadas.

El tooltip flotante asociado al hover sobre un control 3D solo se muestra durante Explicar.

## Salida del modo

Al elegir cualquier otra sección del menú, la aplicación restaura `interactionMode = interact` automáticamente. No existe un botón explícito de "desactivar Explicar"; basta con cambiar de sección.

## Diferencia respecto del Laboratorio y el Manual

- **Laboratorio**: el usuario configura el instrumento, los controles ejecutan acciones reales.
- **Explicar**: el usuario inspecciona el instrumento, los controles no ejecutan acciones, sólo informan.
- **Manual**: navegación documental general, no asociada a un control específico.

---

# 10. Políticas de interacción

La interacción del usuario con el osciloscopio sigue una política `interactionMode` que se sincroniza automáticamente con la sección activa del menú:

| Sección activa | `interactionMode` |
|----------------|-------------------|
| Laboratorio    | `interact`        |
| Explicar       | `explicar`        |
| Ejercicios     | `interact`        |
| Manual         | `interact`        |
| Configuración  | `interact`        |

### interact

Modo normal. Los controles del osciloscopio responden normalmente (mover knobs, presionar botones, cambiar escalas).

### explicar

Modo inspectivo. Los controles NO ejecutan acciones reales; el sistema captura el click y emite el evento educativo al panel.

### disabled

Modo opcional reservado para bloquear toda la interacción 3D (no se utiliza activamente en esta iteración).

---

# 11. Ejercicios Mode

## Objetivo

Guiar al usuario mediante ejercicios secuenciales que configuran temporalmente las señales del osciloscopio.

## Funcionamiento general

El panel permanecerá expandido durante los ejercicios y funcionará como un wizard paso a paso.

Al iniciar un ejercicio el sistema invoca `ExerciseManager.start(id)`, que:

1. Lee la definición del ejercicio (incluyendo el bloque `ch1` y opcionalmente `ch2`).
2. Llama a `InputSignalManager.acquireForExercise(...)` capturando un snapshot de los valores del usuario y aplicando los del ejercicio.
3. Cambia el modo del manager a `exercise`, lo que bloquea ediciones desde el panel Laboratorio.

Durante el ejercicio el Laboratorio queda en modo solo-lectura, mostrando el mensaje informativo descrito anteriormente.

## Persistencia entre secciones

El ejercicio NO se cancela automáticamente cuando el usuario cambia de sección. Es válido y esperado:

```text
Ejercicios → Manual → Configuración → volver a Ejercicios
```

con el ejercicio permaneciendo exactamente en el mismo paso. Sólo finalizar o abandonar explícitamente termina el ejercicio.

## Finalización / abandono

`ExerciseManager.end()` libera el `InputSignalManager` (`releaseFromExercise()`), restaurando los valores que el usuario había configurado en modo `free`, y luego despacha `END_EXERCISE` al store.

## Layout interno del wizard

- **Header**: nombre del ejercicio, progreso, número de paso.
- **Área central**: contenido del paso actual (instrucción, teoría, input numérico, multiple choice, control target).
- **Footer**: navegación (Anterior / Siguiente / Finalizar / Salir).

## Arquitectura de ejercicios

Los ejercicios se definen en JSON. Cada ejercicio incluye:

- `id`, `title`, `subtitle`,
- `ch1`: objeto `{ type, amplitude, frequency, phase, offset, dutyCycle? }`,
- `ch2` (opcional): mismo formato,
- `steps`: lista de bloques (`instruction`, `theory`, `numeric_input`, `multiple_choice`, `control_target`, …).

---

# 12. Manual Mode

Mostrar documentación educativa general del osciloscopio. No depende de la selección de controles 3D.

## Diferencia respecto de Explicar

- **Explicar**: contextual, rápido, asociado a un control específico que el usuario clickea en el 3D.
- **Manual**: navegación documental, teoría, tutoriales, conceptos generales independientes del control activo.

Contenidos típicos: Trigger, Vertical Scale, Time Base, Sampling, Aliasing, Measurements, Acquisition Modes.

---

# 13. Configuración Mode

Permite configurar parámetros globales de la aplicación:

- idioma,
- tema visual,
- calidad gráfica,
- sensibilidad de drag,
- escala UI,
- volumen,
- restaurar configuración predeterminada.

---

# 14. Barra inferior

## Objetivo

Proveer herramientas rápidas permanentes sin necesidad de expandir el panel lateral. La barra es visible en todos los modos.

## Características visuales

Compacta, minimalista, semitransparente, poco intrusiva.

## Funciones

1. **Vistas rápidas de cámara**: accesos directos a vistas predefinidas (frontal, diagonal, display, general) y reset de cámara.
2. **Reset osciloscopio**: vuelve `interactionMode` a `interact`.
3. **Pantalla completa**: toggle de fullscreen del navegador.

> En la primera iteración existía en esta barra un toggle "Explicar". Fue eliminado: el modo Explicar pasó a ser una sección del menú principal.

---

# 15. Integración con cámara

La UI NO modificará directamente la cámara.

Cuando el Panel Workspace cambie de estado (`hidden`, `compact`, `expanded`), la UI notifica el nuevo estado al `CameraController`. El controlador es responsable de reencuadrar el instrumento, ajustar paneo y modificar zoom para preservar la visibilidad.

Esto mantiene desacoplados el sistema de UI, el sistema de cámara y la lógica de navegación espacial.

---

# 16. Flujo general de interacción

## Arranque

```text
Laboratorio (expandido)
+ Barra inferior
+ Viewport 3D
+ CH1 conectado al DisplayRenderer
```

## Usuario colapsa con "✕"

```text
Panel → CompactLauncher ("Menú")
```

## Usuario hace click en el launcher

```text
Panel se expande en Laboratorio
```

## Usuario inicia un ejercicio

```text
Ejercicios → click sobre ejercicio
→ ExerciseManager.start(id)
→ InputSignalManager.acquireForExercise(...)
→ Laboratorio queda solo-lectura
```

## Usuario finaliza el ejercicio

```text
Finalizar / Salir
→ ExerciseManager.end()
→ InputSignalManager.releaseFromExercise()
→ Laboratorio recupera valores previos
```

---

# 17. Transiciones

Las transiciones de panel y de paneles internos deberán utilizar easing, interpolaciones suaves y animaciones temporizadas. No deberán existir cambios abruptos de layout.

---

# 18. Responsividad

La arquitectura deberá soportar desktop, pantallas táctiles y tablets.

---

# 19. Objetivo final de experiencia

La aplicación deberá sentirse más cercana a un instrumento interactivo, un simulador educativo y una experiencia espacial, y menos a una aplicación web tradicional, un dashboard o una interfaz basada en paneles permanentes.

---

# 20. Implementación de la UI con React

## Objetivo

La interfaz HTML superpuesta se implementa en React 19. El objetivo principal es facilitar manejo de estados complejos, renderizado condicional, composición modular y desacople entre lógica visual y lógica de interacción.

## Organización

```text
/src
  /ui
    /components       (WorkspacePanel, PanelHeader, PanelContent, PanelFooter,
                       BottomToolbar, CompactLauncher, Tooltip3D)
    /workspace        (LaboratorioMode, EjerciciosMode, ManualMode, ConfiguracionMode)
    /explicar         (ControlExplanation)
    /exercises        (ExerciseWizard, blocks/*)
    /manual           (ManualSection)
    /settings         (SettingsPage)

  /state
    AppContext.jsx    (reducer + refs: sceneRef, signalManagerRef, exerciseManagerRef)

  /signals
    Signal.js, SineSignal.js, SquareSignal.js, InputSignalManager.js

  /exercises
    ExerciseManager.js

  /data
    controls.json, exercises.json, manual.json
```

## Estado global

`AppContext` mantiene mediante `useReducer`:

```text
workspaceMode    : 'laboratorio' | 'explicar' | 'ejercicios' | 'manual' | 'configuracion'
panelState       : 'hidden' | 'compact' | 'expanded'
interactionMode  : 'interact' | 'explicar' | 'disabled'
selectedControl  : id | null
activeExercise   : id | null
exerciseStep     : number
cameraPreset     : key | null
```

`SET_WORKSPACE_MODE` sincroniza automáticamente `interactionMode` (`explicar` o `interact`) y mantiene el panel expandido.

Además del estado, el provider expone tres refs:

- `sceneRef` → `SceneManager`
- `signalManagerRef` → `InputSignalManager`
- `exerciseManagerRef` → `ExerciseManager`

`signalManagerRef` y `exerciseManagerRef` se instancian una sola vez en `App.jsx`. El `signalManager` se enlaza al `DisplayRenderer` mediante `attachRenderer(scene.getDisplayRenderer())` apenas la escena está lista.

## Renderizado condicional

```text
si panelState='expanded' → renderizar WorkspacePanel completo
si panelState='compact'  → renderizar CompactLauncher
workspaceMode='laboratorio'   → LaboratorioMode
workspaceMode='explicar'      → ControlExplanation
workspaceMode='ejercicios'    → EjerciciosMode (lista o ExerciseWizard)
workspaceMode='manual'        → ManualMode
workspaceMode='configuracion' → ConfiguracionMode
```

---

# 21. Objetivo arquitectónico

La implementación prioriza:

- modularidad,
- separación clara entre instrumento, señales, routing de entradas, ejercicios, UI e inspección,
- ownership explícito sobre quién controla las señales en cada momento (`free` vs `exercise`),
- reutilización de componentes,
- mantenimiento simple a largo plazo.
