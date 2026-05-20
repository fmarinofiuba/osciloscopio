# Segunda iteración — modificaciones de UI y sistema de señales

## Objetivo general

Esta iteración modifica el comportamiento previamente implementado del panel lateral y agrega un sistema centralizado de gestión de señales de entrada para el osciloscopio.

Los cambios tienen como objetivo:

- convertir el modo "Explorar" en un verdadero modo de laboratorio configurable,
- centralizar el estado de señales conectadas a los canales,
- permitir que los ejercicios tomen control temporal del instrumento,
- simplificar la lógica de ownership de señales,
- mejorar coherencia conceptual y UX.

---

# 1. Cambios de nomenclatura en UI

## Cambio de nombre del launcher colapsado

El botón flotante que actualmente se denomina:

```text
Workspace
```

deberá renombrarse a:

```text
Menú
```

---

## Cambio de nombre de la sección "Explorar"

La sección actualmente llamada:

```text
Explorar
```

deberá pasar a llamarse:

```text
Laboratorio
```

---

# 2. Cambio conceptual del modo Laboratorio

Anteriormente:

```text
Explorar = modo inmersivo con panel colapsado
```

Nueva definición:

```text
Laboratorio = configuración libre del osciloscopio
```

Por lo tanto:

- el panel YA NO deberá colapsarse automáticamente al entrar en Laboratorio,
- el panel tendrá contenido persistente y funcional,
- el usuario podrá configurar señales conectadas al instrumento.

---

# 3. Nueva UI del modo Laboratorio

Cuando NO exista un ejercicio activo, el panel Laboratorio deberá mostrar:

## Canal 1

- tipo de señal,
- amplitud,
- frecuencia,
- fase,
- offset,
- parámetros específicos de la señal.

## Canal 2

Misma estructura que Canal 1.

---

# Señales actualmente soportadas

- señal senoidal,
- señal cuadrada.

---

# 4. InputSignalManager

Se deberá crear un sistema centralizado llamado:

```text
InputSignalManager
```

Responsable de representar el estado actual de las entradas conectadas al osciloscopio.

---

# Responsabilidades

```text
- señal conectada a CH1
- señal conectada a CH2
- modo actual de ownership
- bloqueo/desbloqueo del laboratorio
```

---

# Modos

```text
free
exercise
```

## free

Modo libre controlado por el usuario.

## exercise

Modo controlado exclusivamente por un ejercicio activo.

---

# 5. Relación con ExerciseManager

Cuando el usuario selecciona un ejercicio:

```text
Ejercicios → click sobre ejercicio
```

el ExerciseManager deberá:

- iniciar la secuencia,
- configurar señales,
- tomar ownership del InputSignalManager,
- cambiar el modo a `exercise`.

---

# Persistencia del ejercicio

El ejercicio NO deberá cancelarse automáticamente si el usuario cambia de sección.

Ejemplo válido:

```text
Ejercicios
↓
Manual
↓
Configuración
↓
volver a Ejercicios
```

El ejercicio deberá permanecer exactamente en el mismo estado y etapa.

---

# Estado relevante

La lógica deberá depender de:

```text
activeExercise != null
```

y no simplemente del workspace visible.

---

# 6. Laboratorio durante ejercicio activo

Cuando exista un ejercicio activo:

```text
activeExercise != null
```

la sección Laboratorio NO deberá mostrar controles editables.

En su lugar deberá mostrarse un mensaje informativo.

Ejemplo:

```text
Hay un ejercicio en curso.

Para modificar las señales de entrada,
debe finalizar o abandonar el ejercicio actual.
```

Opcionalmente:

```text
[ Volver al ejercicio ]
```

---

# 7. Finalización del ejercicio

Cuando el usuario:

- finaliza,
- o abandona el ejercicio,

el ExerciseManager deberá:

```text
- liberar ownership del InputSignalManager
- restaurar modo free
```

A partir de ese momento:

- Laboratorio vuelve a ser editable,
- el usuario recupera control manual de señales.

---

# 8. Persistencia de señales

Las señales configuradas por el ejercicio podrán permanecer conectadas al salir del ejercicio.

No es necesario restaurar automáticamente configuraciones anteriores.

---

# 9. Objetivo arquitectónico

La nueva arquitectura busca separar claramente:

```text
- osciloscopio
- señales
- routing de entradas
- ejercicios
- UI
```

y establecer ownership explícito sobre quién controla las señales en cada momento.
