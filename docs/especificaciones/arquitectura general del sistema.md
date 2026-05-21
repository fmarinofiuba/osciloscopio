# Arquitectura General del Sistema
## Lineamientos técnicos y organizacionales

---

# 1. Objetivo del documento

El objetivo de este documento es definir lineamientos generales para la organización arquitectónica del proyecto sin imponer una estructura rígida de implementación.

La intención es establecer:

- criterios de modularidad,
- separación conceptual de responsabilidades,
- organización general del proyecto,
- principios de desacoplamiento,
- estrategias de testing y desarrollo,

dejando libertad al programador respecto de:

- nombres concretos de clases,
- granularidad de módulos,
- patrones internos,
- estructura detallada de implementación.

---

# 2. Principios arquitectónicos generales

La arquitectura del proyecto deberá priorizar:

- modularidad,
- desacoplamiento,
- extensibilidad,
- simplicidad,
- reutilización,
- facilidad de testing,
- claridad organizacional.

La aplicación deberá evitar una fuerte dependencia entre:

- rendering,
- interacción,
- lógica,
- UI,
- configuración,
- ejercicios,
- routing de entradas (señales que alimentan al instrumento).

Una pieza clave de esta arquitectura es el **ownership explícito** sobre quién controla las señales de entrada en cada momento. El `InputSignalManager` modela ese ownership con dos modos: `free` (el usuario configura desde el panel Laboratorio) y `exercise` (el ejercicio activo dicta los valores temporalmente). El `ExerciseManager` adquiere y libera ese ownership.

---

# 3. Organización general del proyecto

La aplicación deberá organizarse separando conceptualmente:

- código fuente,
- assets,
- configuraciones,
- páginas de testing,
- estilos.

Ejemplo conceptual:

```text
src/
    código fuente principal

public/
    modelos 3D
    texturas
    sonidos
    configuraciones JSON

tests/
    páginas o escenas aisladas para pruebas y depuración

styles/
    hojas de estilo
```

---

# 4. Subsistemas conceptuales

Para esta iteración los subsistemas relevantes y su ownership son:

```text
SceneManager
    contiene Three.js, modelo 3D, InteractionSystem, DisplayRenderer

DisplayRenderer
    recibe una señal abstracta (interfaz `sample(t)`)
    no conoce su origen

InputSignalManager
    centraliza el estado de CH1 y CH2
    expone modos: 'free' | 'exercise'
    inyecta la señal activa de CH1 al DisplayRenderer
    en modo 'exercise' rechaza ediciones del usuario

ExerciseManager
    orquesta start / next / prev / end de los ejercicios
    en `start()` toma ownership del InputSignalManager
    en `end()` lo libera (restaurando snapshot de usuario)

AppContext (UI)
    estado global (workspaceMode, panelState, interactionMode, activeExercise, …)
    expone refs a SceneManager, InputSignalManager y ExerciseManager
```

Reglas de ownership:

- El panel Laboratorio sólo puede modificar señales cuando `signalManager.mode === 'free'`.
- El `ExerciseManager` es el único componente autorizado a llamar `acquireForExercise` / `releaseFromExercise`.
- El `DisplayRenderer` nunca crea ni guarda referencias a clases concretas de `Signal`; sólo recibe el objeto del `InputSignalManager`.