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

- máxima visibilidad del osciloscopio,
- mínima obstrucción del viewport,
- aparición contextual de información,
- simplicidad visual,
- transiciones suaves,
- separación entre modos de aplicación e interacción,
- consistencia entre desktop y touch.

La experiencia principal deberá centrarse en:

- interacción directa con el instrumento,
- exploración visual,
- manipulación espacial.

---

# 3. Arquitectura general de UI

La interfaz se dividirá en dos componentes principales:

## 1. Panel Workspace

Panel contextual expandible ubicado sobre el borde derecho de la pantalla.

Responsable de:

- ejercicios,
- documentación,
- ayuda contextual,
- configuraciones,
- contenido educativo.

---

## 2. Barra inferior

Barra horizontal inferior siempre visible.

Responsable de:

- acciones rápidas,
- toggles globales,
- accesos rápidos de navegación,
- controles de cámara,
- herramientas de interacción.

---

# 4. Filosofía general de funcionamiento

El panel contextual NO deberá permanecer abierto permanentemente.

El panel aparecerá únicamente cuando exista contenido relevante para mostrar.

Esto permite:

- maximizar el área útil 3D,
- mejorar la inmersión,
- evitar paneles vacíos,
- mantener el foco en el instrumento.

La aplicación debe sentirse principalmente como:

- un instrumento interactivo,
- un simulador,
- una experiencia espacial.

No debe sentirse como:

- una aplicación administrativa,
- una IDE,
- un dashboard,
- una web tradicional basada en paneles.

---

# 5. Estados visuales del Panel Workspace

El panel tendrá tres estados conceptuales.

---

## Oculto

El panel no ocupa espacio visual.

Solo permanece visible:

- la bottom toolbar.

Este estado puede utilizarse opcionalmente para modos pantalla completa extremos.

---

## Launcher compacto

Estado reducido utilizado normalmente durante Explorar Mode.

El panel se representa como un launcher flotante compacto.

Ejemplo conceptual:

```text
╭──────────────╮
│ Explorar ▸    │
╰──────────────╯
```

Este launcher:

- no despliega dropdowns,
- no abre menús contextuales flotantes,
- no utiliza navegación compleja.

Al hacer click:

- el workspace se expande completamente.

---

## Workspace expandido

Estado completo del panel.

Ocupará aproximadamente:

- 30% a 35% del ancho de pantalla.

Contendrá:

- header,
- contenido central,
- footer contextual.

Ejemplo conceptual:

```text
╭────────────────────────────────╮
│ Explorar Ejercicios Manual Configuración     │
├────────────────────────────────┤
│                                │
│        contextual content      │
│                                │
│                                │
├────────────────────────────────┤
│ Anterior      Siguiente             │
╰────────────────────────────────╯
```

---

# 6. Apariencia visual del panel

## Estilo visual

El panel deberá ser:

- semitransparente,
- moderno,
- minimalista,
- liviano visualmente.

No deberá sentirse como una ventana rígida tradicional.

---

## Características visuales

- transparencia parcial,
- sombras suaves,
- bordes redondeados,
- transiciones animadas,
- slide in / slide out,
- overlays suaves.

---

## Importante

No se utilizará blur complejo en tiempo real como requerimiento obligatorio debido a posibles costos de performance.

---

# 7. Launcher flotante

## Objetivo

Permitir acceder al workspace sin ocupar espacio permanente.

---

## Ubicación

Preferentemente:

- esquina superior derecha.

---

## Comportamiento

El launcher representa el estado colapsado del workspace.

NO es un widget independiente.

Al hacer click:

- el panel contextual completo se expande.

No existirán:

- dropdowns,
- popups de navegación,
- submenús flotantes,
- navegación tipo menú hamburguesa tradicional.

La navegación principal solo existirá dentro del workspace expandido.

---

# 8. Navegación principal del Workspace

La navegación principal NO deberá representar tabs tradicionales de contenido.

Representará modos globales de aplicación.

---

## Modos principales

### Explorar

Modo inmersivo de exploración e interacción libre.

---

### Ejercicios

Modo de ejercicios guiados.

---

### Manual

Modo de documentación y teoría.

---

### Configuración

Modo de configuración general.

---

# 9. Comportamiento especial de Explorar Mode

Explorar Mode es conceptualmente distinto de los demás modos.

Mientras:

- Ejercicios,
- Manual,
- Configuración

requieren contenido persistente y panel expandido,

Explorar prioriza:

- viewport 3D,
- inmersión,
- interacción directa.

---

## Regla principal

Cuando Explorar es seleccionado:

- el workspace se colapsa automáticamente,
- el sistema retorna al estado Launcher compacto.

Por lo tanto:

Explorar NO funciona realmente como una tab persistente.

Funciona más como:

```text
Volver al instrumento
```

aunque visualmente siga apareciendo como:

```text
Explorar
```

---

## Ejemplo de transición

### Estado inicial

```text
Workspace expandido + Ejercicios
```

---

### Usuario selecciona

```text
Explorar
```

---

### Resultado

```text
workspace collapses
→ compact launcher visible
→ viewport maximized
```

---

# 10. Explorar Mode

## Objetivo

Permitir manipulación libre del osciloscopio.

El viewport 3D deberá ser prioritario.

---

## Características

En este modo:

- el panel normalmente permanecerá colapsado,
- el usuario podrá interactuar directamente con el instrumento,
- la UI visible será mínima.

---

## Estado normal esperado

- Launcher compacto visible,
- Barra inferior visible,
- panel contextual oculto.

---

## Expansión temporal del panel

Incluso durante Explorar Mode el panel podrá expandirse temporalmente cuando exista contenido contextual.

Ejemplos:

- Modo Explicar activo,
- ayuda contextual,
- overlays,
- contenido asociado a controles.

---

# 11. Interaction Policies

La interacción del usuario con el osciloscopio dependerá de una política activa de interacción.

Esto es independiente del Workspace Mode.

---

## Políticas de interacción

### Interact

Modo normal.

Los controles del osciloscopio responden normalmente.

Ejemplos:

- mover knobs,
- presionar botones,
- cambiar escalas.

---

### Explicar

Modo educativo/contextual.

Los controles NO ejecutan acciones reales.

Al seleccionar un control:

- se despliega información contextual,
- el panel se expande automáticamente,
- se muestra descripción y ayuda asociada.

---

### Disabled

Modo opcional para bloquear interacción.

---

# 12. Modo Explicar

## Naturaleza conceptual

Explicar NO es un Workspace Mode.

NO aparece dentro de la navegación principal.

Es una herramienta transversal activada desde la Barra inferior.

---

## Funcionamiento

Cuando Explicar está activo:

- el raycasting continúa funcionando,
- los controles no modifican estados reales,
- se muestra información contextual del control seleccionado,
- los tooltips flotantes sobre los controles se muestran al hacer hover.

Cuando Explicar está inactivo:

- los tooltips flotantes NO se muestran (la interacción es directa y silenciosa).

---

## Ejemplo

Usuario selecciona:

```text
VOLTS/DIV CH1
```

El panel se expande automáticamente mostrando:

- nombre,
- descripción,
- funcionamiento,
- ejemplos,
- imágenes opcionales,
- links relacionados al Manual.

---

# 13. Ejercicios Mode

## Objetivo

Guiar al usuario mediante ejercicios secuenciales.

---

## Funcionamiento general

El panel permanecerá expandido durante los ejercicios.

La interfaz funcionará como un wizard o asistente paso a paso.

---

# 14. Layout de ejercicios

## Header

Mostrará:

- nombre del ejercicio,
- progreso,
- número de paso.

Ejemplo:

```text
Measuring a sine wave
Step 2 / 5
```

---

## Área central

Podrá contener:

- consignas,
- teoría,
- imágenes,
- inputs,
- hints,
- validaciones,
- instrucciones.

---

## Footer

Botones contextuales.

Ejemplo:

```text
[ Anterior ] [ Pista ] [ Validar ] [ Siguiente ]
```

---

# 15. Arquitectura de ejercicios

Los ejercicios NO deberán implementarse como páginas HTML arbitrarias.

Deberán construirse mediante bloques reutilizables configurados por JSON.

---

## Tipos posibles de bloques

```text
instruction
numeric_input
multiple_choice
interactive_validation
control_target
theory_block
image_block
```

---

# 16. Manual Mode

## Objetivo

Mostrar documentación educativa general.

No depende de la selección de controles.

---

## Diferencia respecto de Explicar

### Explicar

- contextual,
- rápido,
- asociado a un control específico.

---

### Manual

- navegación documental,
- teoría,
- tutoriales,
- conceptos generales.

---

# 17. Contenido del Manual

Ejemplos:

- Trigger
- Vertical Scale
- Time Base
- Sampling
- Aliasing
- Measurements
- Acquisition Modes

---

# 18. Configuración Mode

## Objetivo

Permitir configuración global de la aplicación.

---

## Posibles configuraciones

- idioma,
- calidad gráfica,
- sensibilidad de drag,
- volumen,
- tema visual,
- escala UI,
- accesibilidad,
- restaurar configuración.

---

# 19. Barra inferior

## Objetivo

Proveer herramientas rápidas permanentes sin necesidad de expandir el panel lateral.

La toolbar será visible en todos los modos.

---

# 20. Ubicación

Parte inferior de la pantalla.

Ancho completo horizontal.

---

# 21. Características visuales de la toolbar

La toolbar deberá ser:

- compacta,
- minimalista,
- semitransparente,
- poco intrusiva.

---

# 22. Funciones de la toolbar

## 1. Vistas rápidas de cámara

Accesos directos para mover rápidamente la cámara a vistas predefinidas.

Ejemplos:

- vista frontal,
- zoom sobre display,
- zoom sobre controles,
- vista general.

---

## 2. Toggle Explicar

Permite activar/desactivar Modo Explicar.

Ejemplo:

```text
[ Explicar ]
```

---

## 3. Controles rápidos adicionales

Opcionalmente:

- reset cámara,
- reset osciloscopio,
- screenshots,
- overlays,
- pantalla completa.

---

# 23. Integración con cámara

La UI NO modificará directamente la cámara.

Cuando el Panel Workspace cambie de estado:

- hidden,
- compact,
- expanded,

la UI notificará el nuevo estado al `CameraController`.

El `CameraController` será responsable de:

- reencuadrar el instrumento,
- ajustar paneo,
- modificar zoom,
- preservar visibilidad,
- restaurar framing anterior.

Esto mantiene desacoplados:

- sistema de UI,
- sistema de cámara,
- lógica de navegación espacial.

---

# 24. Flujo general de interacción

## Estado normal esperado

```text
Explorar Mode
+
Launcher compacto
+
Barra inferior
+
Viewport 3D dominante
```

---

## Usuario toca launcher

```text
expand workspace
```

---

## Workspace expandido

Usuario puede seleccionar:

- Ejercicios,
- Manual,
- Configuración.

---

## Usuario vuelve a Explorar

```text
collapse workspace
→ return to immersive mode
```

---

# 25. Transiciones

Las transiciones deberán utilizar:

- easing,
- interpolaciones suaves,
- animaciones temporizadas.

No deberán existir cambios abruptos de layout.

---

# 26. Responsividad

La arquitectura deberá soportar:

- desktop,
- pantallas táctiles,
- tablets.

---

# 27. Objetivo final de experiencia

La aplicación deberá sentirse más cercana a:

- un instrumento interactivo,
- un simulador educativo,
- una experiencia espacial,

y menos a:

- una aplicación web tradicional,
- un dashboard,
- una interfaz basada en paneles permanentes.

# 28. Implementación de la UI con React

## Objetivo

La interfaz HTML superpuesta deberá implementarse utilizando React.

El objetivo principal es facilitar:

- manejo de estados complejos,
- renderizado condicional,
- composición modular de UI,
- reutilización de componentes,
- mantenimiento futuro,
- desacople entre lógica visual y lógica de interacción.

La UI deberá estar completamente basada en estados declarativos.

---

# Arquitectura general de UI

La interfaz deberá organizarse en componentes reutilizables e independientes.

Ejemplos:

```text
WorkspacePanel
BottomToolbar
ExerciseStep
ControlExplanation
ManualSection
SettingsPage
```

Cada componente deberá responsabilizarse únicamente de:

- rendering,
- comportamiento visual,
- interacción UI,
- manejo local de estado.

---

# Estado global de UI

La aplicación deberá mantener un estado global para controlar:

```text
workspaceMode
interactionMode
panelState
selectedControl
activeExercise
exerciseStep
toolbarState
cameraPreset
```

La UI deberá reaccionar automáticamente a cambios en estos estados.

Ejemplos:

- si `panelState = expanded`, el panel se renderiza expandido,
- si `workspaceMode = explorar`, el workspace se colapsa,
- si `interactionMode = explicar`, los controles muestran ayuda contextual.

---

# Organización recomendada

Ejemplo conceptual:

```text
/src

  /ui
    /components
    /workspace
    /toolbar
    /manual
    /exercises
    /settings

  /state
    AppContext.jsx

  /data
    controls.json
    exercises.json
```

---

# Workspace Panel

El Workspace Panel deberá implementarse como un componente desacoplado y controlado completamente por estado.

Ejemplo conceptual:

```text
panelState:
- hidden
- compact
- expanded
```

La transición entre estados deberá producir:

- cambios automáticos de layout,
- aparición/desaparición de contenido,
- animaciones suaves,
- renderizado condicional.

---

# Navegación entre modos

La navegación principal del workspace deberá renderizar dinámicamente:

```text
Explorar
Ejercicios
Manual
Configuración
```

La UI deberá cambiar automáticamente el contenido contextual dependiendo del `workspaceMode` activo.

---

# Modo Explicar

El modo Explicar deberá funcionar como una política global de interacción.

Cuando esté activo:

- los controles no ejecutarán acciones reales,
- la UI mostrará información contextual del control seleccionado,
- el Workspace Panel podrá expandirse automáticamente.

---

# Ejercicios basados en componentes

Los ejercicios NO deberán implementarse como páginas HTML arbitrarias.

Se recomienda modelarlos mediante bloques reutilizables configurados por JSON.

Ejemplo conceptual:

```json
{
  "type": "numeric_input"
}
```

que internamente renderice:

```text
<NumericInputStep />
```

---

# Renderizado condicional

La UI deberá construirse principalmente mediante renderizado condicional basado en estado.

Ejemplos conceptuales:

```text
si panel expandido → renderizar WorkspacePanel
```

```text
si Explicar activo → renderizar explicación contextual
```

```text
si modo ejercicios → renderizar wizard de ejercicio
```

---

# Animaciones y transiciones

Las transiciones UI deberán implementarse mediante:

- animaciones CSS,
- transiciones React,
- interpolaciones suaves.

Especialmente para:

- slide in/out,
- expand/collapse,
- overlays,
- aparición contextual de contenido.

---

# Objetivo arquitectónico

La implementación deberá priorizar:

- modularidad,
- claridad estructural,
- separación de responsabilidades,
- crecimiento progresivo del sistema,
- reutilización de componentes,
- mantenimiento simple a largo plazo.
