# Osciloscopio Virtual 3D WebGL

## Documento de especificación técnica y funcional (V1)

---

# 1\. Introducción

El presente documento describe la arquitectura, alcance funcional y lineamientos técnicos para el desarrollo de una aplicación web interactiva destinada a representar un osciloscopio virtual tridimensional.

La aplicación tendrá un enfoque educativo y permitirá al usuario interactuar con un modelo 3D de un osciloscopio mediante controles accionables, visualización dinámica del display y ejercicios guiados.

Esta primera versión del sistema estará enfocada principalmente en:

- infraestructura visual,
- arquitectura de interacción,
- sistema configurable de controles,
- rendering dinámico del display,
- framework de ejercicios,
- navegación y experiencia de usuario.

La simulación electrónica real del osciloscopio será considerada una etapa posterior y no forma parte del alcance actual.

---

# 2\. Objetivos de la aplicación

## Objetivos principales

- Representar un osciloscopio 3D interactivo en una aplicación web.
- Permitir interacción con controles físicos del instrumento.
- Mostrar un display visualmente convincente mediante rendering dinámico.
- Permitir ejercicios guiados y validación de respuestas.
- Diseñar una arquitectura extensible y configurable.
- Desacoplar lógica, rendering, interacción y contenido educativo.

## Objetivos secundarios

- Permitir futura expansión a nuevos ejercicios.
- Permitir futura expansión a nuevos instrumentos.
- Facilitar mantenimiento y extensibilidad mediante configuración externa.
- Soportar desktop y dispositivos táctiles.

---

# 3\. Alcance de la primera versión

La primera versión NO busca implementar una simulación electrónica físicamente correcta del osciloscopio.

La representación del display será visual y aproximada, enfocada en reproducir convincentemente el aspecto de un osciloscopio real sin implementar todavía:

- adquisición real,
- trigger físico real,
- FFT,
- sampling complejo,
- sincronización electrónica,
- simulación DSP.

El objetivo principal de esta etapa es validar:

- interacción,
- arquitectura,
- experiencia de usuario,
- flujo de ejercicios,
- framework de controles configurables.

---

# 4\. Stack tecnológico

## Tecnologías principales

- JavaScript ES6
- Vite
- Three.js
- HTML5
- CSS3
- React (para UI)

## Rendering

- WebGL mediante Three.js

## Modelo 3D

- GLTF cargado desde archivo externo

## Display

- Canvas2D dinámico utilizado como textura

## Arquitectura

- Orientada a objetos
- Componentes desacoplados
- Configuración externa mediante JSON

---

# 5\. Arquitectura general

La aplicación se dividirá conceptualmente en los siguientes módulos:

## Core

Responsable de:

- inicialización,
- ciclo principal,
- estados globales,
- comunicación entre módulos.

## SceneManager

Responsable de:

- escena,
- luces,
- carga de modelo GLTF,
- materiales.

## Interaction System

Responsable de:

- raycasting,
- hover,
- drag,
- pointer events,
- interacción táctil,
- selección de objetos.

## Oscilloscope System

Responsable de:

- estado del osciloscopio,
- controles,
- valores,
- sincronización visual,
- display.

## Display Renderer

Responsable de:

- renderizado de waveform,
- grilla,
- textos,
- overlays visuales,
- actualización de textura.

## UI Overlay

Responsable de:

- menú lateral,
- consignas,
- navegación,
- botones,
- validaciones,
- mensajes al usuario.

## Exercise System

Responsable de:

- carga de ejercicios,
- validaciones,
- progresión,
- respuestas.

## Configuration System

Responsable de:

- carga de archivos JSON,
- configuración de controles,
- configuración de ejercicios,
- señales,
- tooltips.

---

# 6\. Escena 3D

## Elementos de escena

La escena contendrá únicamente:

- osciloscopio,
- mesa,
- pared/fondo simple.

No se prioriza el fotorrealismo.

## Iluminación

Iluminación básica:

- luz ambiente,
- una o más luces direccionales,
- sombras.

No se utilizarán:

- HDRI,
- environment maps,
- postprocesado complejo.

---

# 7\. Modelo 3D

## Formato

- GLTF

## Requisitos del modelo

El modelo deberá incluir:

- meshes separadas para elementos interactivos,
- nombres únicos para cada objeto interactivo,
- pivots correctamente posicionados,
- materiales ya configurados.

## Elementos interactivos

Cada control físico deberá existir como objeto independiente:

- perillas,
- botones,
- switches.

---

# 8\. Sistema de interacción

## General

La interacción deberá funcionar tanto con:

- mouse,
- touch/pointer events.

No deberá existir lógica separada para touch y mouse.

## Raycasting

La detección de interacción se realizará mediante raycasting.

## Hover

Cuando el cursor pase sobre un control interactivo:

- el control marcara con un Outline (Outline Pass de EffectsComposer de Three.js, es una pasada 2D que marca outlines)
- podrá mostrarse un tooltip flotante (habra un retardo de msec para que aparezca).

## Tooltips

Los tooltips:

- serán sprites/texturas dinámicas en Three.js que se generarán al iniciar la aplicación (se puede crear un atlas y usar UVs para mapear la celda especifica)
- mostrarán información cargada desde JSON,
- podrán incluir: nombre, descripción, valor actual.

---

# 9\. Controles interactivos

## Tipos de controles

La arquitectura deberá soportar:

- KnobControl
- ButtonControl
- ToggleControl (es un boton que puede quedar retenido)

## Objetivo arquitectónico

La lógica deberá ser genérica y configurable. No se deberán hardcodear controles específicos.
En el JSON se definiran cuales son los controles interativos y cual es su objeto 3D en la escena

## Configuración por JSON

Ejemplo conceptual:

```
{
  "objectName": "VOLTS_DIV_CH1",
  "type": "knob",
  "stepCount": 12,
  "currentStep": 3,
  "rotationAxis": "z",
  "values": [
    "1mV",
    "2mV",
    "5mV",
    "10mV"
  ],
  "tooltip": {
    "title": "Escala Vertical",
    "description": "Controla la amplitud vertical."
  }
}
```

---

# 10\. Interacción de perillas

## Funcionamiento

Las perillas funcionarán mediante:

1. pointerdown
2. drag horizontal
3. conversión deltaX → rotación

## Características

- snapping/steps discretos,

## Indicador visual

Mientras se interactúa:

- se mostrará un sprite dinámico, indicando el valor actual de la perilla.

---

# 11\. Interacción de botones

Los botones:

- responderán a click/touch,
- cambiarán instantáneamente de estado,
- podrán reproducir sonido,
- podrán permanecer presionados o retornar automáticamente.

---

# 12\. Cámara y navegación

## Tipos de cámara

La aplicación tendrá 2 modos: modo libre, modo enfocado/guiado.
Cuando el modo guiado esta activado la camara transicionará de la vista actual a la vista objetivo en un delta del tiempo predefinido
Habra una lista de vistas preseteadas. una vista es una posicion de origin y target de destino. La animación se ejecutara con easing. Duante la transición el usuario no podra orbitar, panear o rotar la camara. Una vez que llegue a destino esta libre nuevamente
La clase que controla la camara proveera metodos para ejecutar esas transiciones a vistas. Luego en la UI de definirá donde y como colocar controles para eso

## Características

- controlador propio,
- easing/transiciones suaves,
- restricciones angulares,
- restricciones del target: el punto objetivo de la camara debera estar restringido a moverse dentro de un area rectangular del plano del piso XZ centrado en el osciloscopio
  Cuando el usuario haga drag con boton derecho se ejecutará dicho panning hasta llegar al limite de posicion del target

## Encuadre automático

La cámara deberá mantener el osciloscopio visible en el área izquierda de la pantalla cuando el panel UI esté abierto. Para ello el controlador transicionara a las nuevas posiciones en un cierto tiempo para acomodar el encuadre ante la apertura o cierre de la UI. ejemplo si cuando la UI esta cerrada el osciloscopio ocupa toda la pantalla y al abrir la UI el 33% derecho se tapa con el menu, el controlador de camara debera mantener la dirección de vista pero hacer zoom put y panear para que el bounding box del osciloscopio este dentro del 66% izquierdo del area libre. Habra un metodo especial que haga ese reencuadre automatico.
Una vez terminada la transicion, el usuario siempre podra cambiar el encuadre haciendo paneos, rotaciones y zoom

---

# 13\. UI HTML superpuesta

## Características

La UI será:

- HTML/CSS superpuesta,
- independiente del rendering WebGL,
- parcialmente transparente,
- contextual,
- expandible/colapsable,
- diseñada para minimizar la obstrucción del viewport 3D.

La interfaz no deberá comportarse como una aplicación web tradicional con paneles permanentes, sino como una capa liviana contextual sobre la escena 3D.

---

## Arquitectura general

La UI estará compuesta por dos elementos principales:

### Workspace Panel

Panel contextual expandible ubicado sobre el borde derecho de la pantalla.

Responsable de:

- ejercicios,
- documentación,
- ayuda contextual,
- configuraciones,
- contenido educativo.

El panel normalmente permanecerá colapsado durante el modo de exploración libre y solo se expandirá cuando exista contenido relevante para mostrar.

Cuando el panel esté colapsado se mostrará únicamente un launcher compacto flotante en la esquina superior derecha.

---

### Barra inferior

Barra horizontal inferior siempre visible.

Responsable de:

- accesos rápidos de cámara,
- herramientas globales,
- toggles de interacción,
- acciones rápidas de navegación.

Ejemplos:

- vista frontal,
- zoom sobre display,
- reset de cámara,
- activar/desactivar modo Explicar.

---

## Workspace Modes

La navegación principal del workspace representará modos globales de aplicación.

### Explorar

Modo libre de interacción con el osciloscopio.

Prioriza el viewport 3D y mantiene el panel contextual colapsado.

Cuando el usuario vuelve a este modo desde otro workspace, el panel se colapsa automáticamente.

---

### Ejercicios

Modo guiado mediante consignas y pasos secuenciales.

El panel permanece expandido mostrando:

- consignas,
- teoría,
- pasos,
- validaciones,
- respuestas,
- hints.

---

### Manual

Modo de documentación y teoría general del osciloscopio.

Contendrá explicaciones conceptuales y tutoriales.

---

### Configuración

Permite configurar parámetros generales de la aplicación.

---

## Modo Explicar

El modo Explicar NO forma parte de los Workspace Modes.

Es una herramienta transversal activada desde la barra inferior.

Cuando el modo Explicar está activo:

- los controles del osciloscopio no ejecutan acciones reales,
- al hacer click sobre un control se despliega información contextual sobre dicho control,
- el panel contextual se expande automáticamente para mostrar la explicación correspondiente.

La explicación podrá incluir:

- texto,
- imágenes,
- ejemplos,
- links relacionados al manual.

---

## Layout interno del Workspace Panel

### Header

Área superior utilizada para:

- navegación entre modos,
- título del contenido actual,
- estado general del workspace.

---

### Área central

Contenido contextual HTML.

Puede contener:

- consignas,
- textos,
- validaciones,
- pasos,
- respuestas,
- imágenes,
- documentación.

---

### Footer

Área reservada para acciones contextuales.

Ejemplos:

- siguiente,
- anterior,
- validar,
- reiniciar,
- pista.

---

## Integración con cámara

La UI no controlará directamente la cámara.

Cuando el panel contextual cambie de estado (expandido/colapsado), la UI notificará al `CameraController`, el cual será responsable de:

- reencuadrar el instrumento,
- ajustar zoom y paneo,
- preservar la visibilidad del osciloscopio.

# 14\. Display del osciloscopio

## Arquitectura

El display será:

- un Canvas2D dinámico,
- utilizado como textura en Three.js (CanvasTexture)

## Contenido

El display deberá representar:

- grilla,
- waveform,
- indicadores,
- textos básicos.

## Estética visual

- fondo blanco letras y lineas negras
- representación simple,
- píxeles encendidos/apagados,
- sin efectos complejos de glow.

## Actualización

El display sólo deberá redibujarse cuando cambie el estado.

No deberá renderizar continuamente si no hay cambios.

---

# 15\. Sistema de ejercicios

## Objetivo

Los ejercicios deberán ser completamente configurables mediante JSON.

No deberán estar hardcodeados.

## Funcionalidades

- selección de ejercicio,
- pasos,
- consignas,
- validaciones,
- respuestas,
- feedback.

## Validaciones

Las validaciones podrán basarse en:

- estado de controles,
- valores seleccionados,
- respuestas ingresadas por el usuario.

## Ejercicios iniciales

Se incluirán inicialmente:

- señal senoidal,

---

# 16\. Formato conceptual de ejercicios

Ejemplo conceptual:

```
{
  "id": "exercise_sinewave",
  "title": "Medición de señal senoidal",
  "signal": "sine_1khz",
  "steps": [
    {
      "instruction": "Medir el período de la señal.",
      "validation": {
        "type": "control_state",
        "expected": {
          "TIME_DIV": "1ms"
        }
      }
    },
    {
      "instruction": "Ingresar frecuencia medida.",
      "validation": {
        "type": "numeric_input",
        "expectedValue": 1000,
        "tolerance": 50
      }
    }
  ]
}
```

---

1. Sonido

La aplicación podrá incluir sonidos simples para:

- clicks,
- switches,
- botones,
- perillas.

No se utilizará WebAudio avanzado en esta etapa.

---

# 19\. Performance

## Objetivos

Priorizar:

- simplicidad,
- estabilidad,
- fluidez,
- eficiencia.

## Estrategias

- evitar postprocesado complejo,
- evitar renders innecesarios,
- actualizar display sólo cuando haya cambios,
- geometría optimizada,
- materiales simples.

---

# 20\. Compatibilidad

## Plataformas objetivo

- desktop,
- tablets táctiles.

## Navegadores

Aplicación orientada a navegadores modernos compatibles con WebGL.

---

# 21\. Extensiones futuras

Fuera del alcance actual pero contempladas arquitectónicamente:

- simulación electrónica real,
- múltiples canales,
- FFT,
- trigger avanzado,
- nuevos instrumentos,
- WebXR,
- persistencia de usuario,
- backend,
- multiidioma,
- exportación/importación de ejercicios.

---

# 22\. Conclusión

La presente especificación define una primera versión enfocada en:

- interacción,
- arquitectura,
- extensibilidad,
- experiencia visual,
- framework educativo configurable.

La arquitectura propuesta busca desacoplar completamente:

- rendering,
- interacción,
- lógica,
- contenido,
- simulación.

Esto permitirá evolucionar progresivamente el proyecto hacia versiones futuras más complejas sin necesidad de rediseñar la estructura principal del sistema.
