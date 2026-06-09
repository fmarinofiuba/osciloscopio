# Especificación de Business Logic: Controles → DisplayRenderer

## Scope

Este documento cubre **únicamente** los controles y menús que se van a implementar:

- Botón **RUN/STOP**
- Botón **CURSOR** (abre menú cursores)
- **5 botones biselados** del panel lateral (actúan sobre el menú activo)
- Perillas y botones verticales: **CH1 MENU**, **CH2 MENU**, **VOLTS/DIV CH1**, **VOLTS/DIV CH2**, **POSITION CH1**, **POSITION CH2**
- Perillas horizontales: **SEC/DIV**, **HORIZONTAL POSITION**
- Controles de trigger: **TRIGGER MENU**, **LEVEL** (perilla de nivel)
- Menús: **CH1**, **CH2**, **Cursores**, **Trigger (Edge)**

No se implementan: AUTOSET, MEASURE, ACQUIRE, DISPLAY, SAVE/RECALL, UTILITY, HARDCOPY, Math, video trigger, window zone, dual time base, persistence, XY mode.

---

## 1. Estado interno completo del sistema

El `DisplayRenderer` es la "caja negra" del osciloscopio virtual. Todo estado observable en el display proviene de variables internas de esta clase. A continuación se define el estado completo que debe existir:

### 1.1 Estado de adquisición

| Variable | Tipo | Valores | Default |
|---|---|---|---|
| `running` | boolean | `true` / `false` | `true` |
| `accuracyUncertain` | boolean | `true` / `false` | `false` |

**Semántica de `running`:**
- `true` → la adquisición está activa, la waveform se actualiza en tiempo real.
- `false` → adquisición detenida (STOP). La waveform queda congelada en pantalla. Los controles verticales y horizontales siguen siendo operables sobre la imagen congelada.

**Semántica de `accuracyUncertain`:**
- Se pone en `true` cuando `running = false` y el usuario cambia un control que invalida la precisión del frame congelado (nivel de trigger, acoplamiento, escala vertical, tipo de trigger).
- Se pone en `false` cuando se reanuda la adquisición (`running` vuelve a `true`).
- Cuando es `true`, la waveform se dibuja como **línea quebrada / discontinua** (ver §6.3).
- Cambios que **sí** se permiten sin marcar incertidumbre: escala vertical, posición vertical, escala horizontal, posición horizontal. Estos controles pueden aplicarse sobre la imagen congelada manteniendo la precisión visual.
- Cambios que **sí** invalidan la precisión: nivel de trigger, acoplamiento, tipo de trigger, slope. El manual indica que modificar controles de trigger sobre una adquisición detenida produce una waveform de línea quebrada.

### 1.2 Estado vertical — por canal (CH1 y CH2)

| Variable | Tipo | Valores | Default CH1 | Default CH2 |
|---|---|---|---|---|
| `ch[n].visible` | boolean | `true` / `false` | `true` | `false` |
| `ch[n].voltsPerDiv` | number | ver tabla §2.1 | `1.0` | `1.0` |
| `ch[n].verticalPosition` | number | divisiones, rango ±10 | `0` | `0` |
| `ch[n].coupling` | string | `'DC'` / `'AC'` / `'GND'` | `'DC'` | `'DC'` |
| `ch[n].bwLimit` | boolean | `true` / `false` | `false` | `false` |
| `ch[n].voltsGain` | string | `'Gruesa'` / `'Fina'` | `'Gruesa'` | `'Gruesa'` |
| `ch[n].probe` | string | `'1X'` / `'10X'` / `'100X'` / `'1000X'` | `'1X'` | `'1X'` |
| `ch[n].invert` | boolean | `true` / `false` | `false` | `false` |

> **Nota sobre `voltsGain`:** En modo "Gruesa" la perilla VOLTS/DIV avanza en pasos 1-2-5 (estándar). En modo "Fina" permite ajuste continuo de paso pequeño. Para la simulación, implementar solo el comportamiento de la escala; el ajuste fino puede ser un multiplicador de resolución.

> **Nota sobre `coupling`:**
> - `DC`: la señal pasa tal cual (incluyendo componente continua).
> - `AC`: se bloquea la componente DC. En la simulación: restar el valor medio de la señal antes de renderizar.
> - `GND`: desconecta la señal. Se muestra una línea horizontal en el nivel de referencia de tierra del canal.

> **Nota sobre `invert`:** Si `true`, la señal se multiplica por -1 antes de renderizar.

### 1.3 Estado horizontal

| Variable | Tipo | Valores | Default |
|---|---|---|---|
| `timePerDiv` | number | ver tabla §2.2 | `1e-3` (1ms) |
| `horizontalPosition` | number | segundos (no divisiones) | `0` |

**Semántica de `horizontalPosition`:** Desplaza el punto de referencia del trigger respecto al centro de la pantalla. Se mide en **segundos** (tiempo real, no divisiones), de forma que el readout "Pos: Xms" sea directo.

**Rango de `horizontalPosition` según `timePerDiv`** (conforme especificaciones del manual, p. 93):

| Rango de `timePerDiv` | Rango de `horizontalPosition` |
|---|---|
| 5 ns/div a 10 ns/div | ±(4 div × timePerDiv) a ±20 ms |
| 25 ns/div a 100 ms/div | ±(4 div × timePerDiv) a ±50 ms |
| 250 ms/div a 5 s/div | ±(4 div × timePerDiv) a **±50 s** |

> **Corrección respecto a versión anterior:** El límite a escalas lentas (≥250 ms/div) es ±50 **segundos**, no ±50 ms. El documento anterior tenía este valor incorrecto.

### 1.4 Estado de trigger

| Variable | Tipo | Valores | Default |
|---|---|---|---|
| `trigger.source` | string | `'CH1'` / `'CH2'` / `'Ext'` / `'Ext/5'` / `'Red'` | `'CH1'` |
| `trigger.type` | string | `'Edge'` / `'Video'` | `'Edge'` |
| `trigger.slope` | string | `'Subida'` / `'Bajada'` | `'Subida'` |
| `trigger.mode` | string | `'Auto'` / `'Normal'` / `'Único'` | `'Auto'` |
| `trigger.coupling` | string | `'CC'` / `'CA'` / `'Rec. Ruido'` / `'Rec. AF'` / `'Rec. BF'` | `'CC'` |
| `trigger.level` | number | voltios, rango ±8 div × voltsPerDiv | `0` |

### 1.5 Estado de cursores

| Variable | Tipo | Valores | Default |
|---|---|---|---|
| `cursors.type` | string | `'Sin'` / `'Voltaje'` / `'Tiempo'` | `'Sin'` |
| `cursors.source` | string | `'CH1'` / `'CH2'` | `'CH1'` |
| `cursors.cursor1Pos` | number | posición en divisiones desde el centro | `-1` |
| `cursors.cursor2Pos` | number | posición en divisiones desde el centro | `+1` |

**Semántica:**
- `'Sin'` → los cursores no se dibujan.
- `'Voltaje'` → dos líneas horizontales. Posición en divisiones verticales desde el centro de la grilla.
- `'Tiempo'` → dos líneas verticales. Posición en divisiones horizontales desde el centro de la grilla.

Los cursores se mueven con las **perillas POSITION de CH1 y CH2** cuando el menú de cursores está activo (ver §4.2).

**Referencias de medición de los cursores** (conforme al manual):
- **Cursores de Voltaje:** el valor mostrado es la posición del cursor respecto a **tierra (GND)** del canal fuente, no respecto al centro de la pantalla. Se calcula como: `cursorPos × voltsPerDiv - ch[source].verticalPosition × voltsPerDiv`.
- **Cursores de Tiempo:** el valor mostrado es el tiempo respecto al **punto de trigger**, no al centro físico de la pantalla. Se calcula como: `cursorPos × timePerDiv - horizontalPosition`.

> **Corrección respecto a versión anterior:** La versión anterior indicaba que los cursores se miden "desde el centro de la pantalla". Esto es incorrecto: voltaje se mide desde GND del canal, tiempo se mide desde el trigger.

### 1.6 Estado del trigger status (calculado)

El `triggerStatus` no es una variable editable por el usuario sino **calculada en cada frame** según el ciclo interno de adquisición. El instrumento real sigue un flujo de buffer con tres fases:

1. **Armed / Preparado** → el osciloscopio está llenando el buffer de predisparo (datos antes del trigger). En este estado se ignoran todos los eventos de trigger hasta que se llena la memoria de predisparo.
2. **Ready / Listo** → el buffer de predisparo está lleno. El instrumento está activamente esperando la condición de trigger para capturar los datos de postdisparo.
3. **Triggered / Disparado** → se detectó el trigger. Se capturan los datos de postdisparo y se muestra el resultado.

> **Corrección respecto a versión anterior:** La versión anterior asociaba `'armed'` con "sin señal" y `'ready'` con "modo Normal sin trigger". Ambas definiciones eran incorrectas. `Armed` y `Ready` son fases del ciclo de buffer interno que ocurren **siempre** en modo Normal y Single, independientemente de si hay señal o no. En la simulación estas fases son tan rápidas que pueden modelarse de forma simplificada (ver tabla siguiente).

**Modelo simplificado para la simulación:**

| Condición | `triggerStatus` mostrado |
|---|---|
| `running = false` | `'stop'` |
| Modo `Scan` activo (ver §5.4) | `'auto'` (sin ícono de trigger) |
| `running = true` y trigger detectado en señal | `'triggered'` |
| `running = true` y `trigger.mode = 'Auto'` y sin trigger válido | `'auto'` |
| `running = true` y `trigger.mode = 'Normal'` esperando trigger | `'ready'` |
| `running = true` y `trigger.mode = 'Único'` esperando el disparo | `'armed'` |

> **Nota de implementación:** En la simulación, la fase `'armed'` (buffer de predisparo) es instantánea porque no modelamos latencia de buffer real. Se muestra `'armed'` solo durante el breve instante inicial de un Single, o puede omitirse para simplificar.

---

## 2. Tablas de valores discretos

### 2.1 Escala vertical VOLTS/DIV (modo Gruesa, secuencia 1-2-5)

`2mV, 5mV, 10mV, 20mV, 50mV, 100mV, 200mV, 500mV, 1V, 2V, 5V`

La perilla gira en pasos discretos. Al llegar al extremo no continúa (tope).

### 2.2 Escala horizontal SEC/DIV

`5ns, 10ns, 25ns, 50ns, 100ns, 250ns, 500ns, 1µs, 2.5µs, 5µs, 10µs, 25µs, 50µs, 100µs, 250µs, 500µs, 1ms, 2.5ms, 5ms, 10ms, 25ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s`

Secuencia 1-2.5-5. La perilla gira en pasos discretos. Al llegar al extremo no continúa (tope).

> **Umbral de Scan Mode:** Cuando `timePerDiv ≥ 100ms` y `trigger.mode = 'Auto'`, el instrumento entra automáticamente en Scan Mode (ver §5.4).

---

## 3. Controles: inputs → variables de estado

### 3.1 Botón RUN/STOP

**Acción:** Alterna `running` entre `true` y `false`.

**Efectos en display:**
- Cuando pasa a `false`: la waveform se congela. `triggerStatus` → `'stop'`. `accuracyUncertain` → `false` (la captura actual es precisa en el momento de detener).
- Cuando pasa a `true`: la adquisición se reanuda. `accuracyUncertain` → `false`.

**No afecta:** los menús abiertos, la escala, el nivel de trigger, ni ninguna otra variable.

### 3.2 Botón CH1 MENU

**Acción:** Abre/cierra el menú CH1 (toggle). Si el menú CH2 estaba abierto, lo cierra primero.

**Efecto adicional (segundo press con menú ya abierto):** En el real, presionar dos veces el botón CH1 MENU cuando el menú ya está visible apaga el canal (`ch1.visible = false`) y cierra el menú. Este comportamiento es opcional para la implementación inicial.

### 3.3 Botón CH2 MENU

Idéntico a CH1 MENU pero para CH2.

### 3.4 Botón TRIGGER MENU

**Acción:** Abre/cierra el menú de Trigger (toggle).

### 3.5 Botón CURSOR

**Acción:** Abre/cierra el menú de Cursores (toggle).

### 3.6 Perilla VOLTS/DIV CH1

**Modo normal:**
- Giro derecho → avanza un paso en la tabla de VOLTS/DIV (señal más pequeña, menos sensible).
- Giro izquierdo → retrocede un paso (señal más grande, más sensible).
- Actualiza `ch1.voltsPerDiv`.
- Invalida capa dinámica y estática.
- Si `running = false`: **no** marca `accuracyUncertain` (escala visual permitida sobre imagen congelada).

**Efecto en display:**
- La waveform de CH1 se escala visualmente.
- El readout de la fila inferior (item 11) se actualiza: `CH1 Xv`.
- El marcador de tierra del canal 1 permanece en su posición vertical absoluta en divisiones; si la escala cambia, el marcador se mueve relativamente respecto al centro en píxeles.

### 3.7 Perilla VOLTS/DIV CH2

Igual que CH1 pero para `ch2.voltsPerDiv` y label `CH2`.

### 3.8 Perilla POSITION CH1 (vertical)

**Modo normal (menú cursores no abierto):**
- Mueve `ch1.verticalPosition` en pasos continuos (resolución ~0.1 div por evento de giro).
- La waveform del canal 1 sube o baja.
- El marcador de tierra del canal 1 (ítem 13) se mueve con la waveform.
- Si `running = false`: no marca `accuracyUncertain`.

**Modo cursores activo** (menú cursores abierto y `cursors.type ≠ 'Sin'`):
- En lugar de mover la waveform, mueve **cursor 1** (`cursors.cursor1Pos`).
- La waveform y su marcador de tierra no se mueven.

### 3.9 Perilla POSITION CH2 (vertical)

Igual que CH1 pero para `ch2.verticalPosition` / **cursor 2** (`cursors.cursor2Pos`).

### 3.10 Perilla SEC/DIV

- Giro derecho → avanza un paso en tabla SEC/DIV (zoom out, más tiempo visible).
- Giro izquierdo → retrocede un paso (zoom in).
- Actualiza `timePerDiv`.
- Invalida capas estática y dinámica.
- Si `running = false`: no marca `accuracyUncertain`.
- Evaluar si la nueva escala activa o desactiva Scan Mode (ver §5.4).

**Efecto en display:**
- La waveform se comprime o expande horizontalmente.
- El readout `M Xms` (item 10) se actualiza.

### 3.11 Perilla HORIZONTAL POSITION

- Giro → mueve `horizontalPosition` en pasos continuos (resolución ~0.02 × timePerDiv por evento).
- Respeta los límites de rango de la tabla §1.3 según el `timePerDiv` actual.
- Actualiza el offset horizontal del dibujo de la waveform.
- El marcador de posición del trigger (item 3, triángulo ▽ en borde superior) se desplaza proporcionalmente.
- El readout `Pos: Xms` (item 4) se actualiza directamente con el valor de `horizontalPosition` formateado.
- Si `running = false`: no marca `accuracyUncertain`.

### 3.12 Perilla TRIGGER LEVEL

- Giro → mueve `trigger.level` en pasos continuos (resolución ~0.1 × voltsPerDiv por evento).
- Actualiza el marcador de nivel de trigger (ítem 5, flecha ◀ en borde derecho de la grilla).
- Actualiza el readout del nivel numérico (ítem 6) en la fila inferior.
- Recalcula si el trigger está activo → `triggerStatus` puede cambiar entre frames.
- Si `running = false`: marca `accuracyUncertain = true` (cambiar el nivel de trigger sobre una adquisición detenida invalida el display).

### 3.13 Botones biselados laterales (0–4)

**Cuando un menú está activo:** El botón `n` actúa sobre el item `n` del menú activo (ya implementado en `pressBevelButton(n)`).

- Si el cambio afecta acoplamiento o trigger y `running = false` → marcar `accuracyUncertain = true`.

**Cuando ningún menú está activo:** Los botones no hacen nada.

---

## 4. Lógica de menús

### 4.1 Menú CH1 / CH2

Cada opción del menú tiene efecto visual **inmediato** al cambiarse:

| Key | Efecto en display | Invalida si STOP |
|---|---|---|
| `coupling` | `'GND'` → waveform = línea horizontal en tierra. `'AC'` → resta media de la señal. `'DC'` → señal directa. | **Sí** → `accuracyUncertain = true` |
| `bwLimit` | Sin efecto real en la simulación. Puede mostrar "20MHz" junto al valor. | No |
| `voltsGain` | Cambia resolución de la perilla VOLTS/DIV. | No |
| `probe` | Afecta solo el readout: `voltsPerDiv × probeFactor`. La waveform no cambia. | No |
| `invert` | Multiplica la señal por −1 antes de renderizar. El marcador de tierra no se mueve. | **Sí** → `accuracyUncertain = true` |

**Nota sobre `probe`:** El factor de sonda no cambia `voltsPerDiv` internamente sino que afecta el **readout** del display (ej. `CH1 10V` con sonda 10X a 1V/div).

### 4.2 Menú Cursores

**Activación de cursores:** Al cambiar `cursors.type` a algo distinto de `'Sin'`, los cursores aparecen en pantalla.

**Movimiento de cursores:**
- Mientras el menú de cursores esté activo y `cursors.type ≠ 'Sin'`:
  - Perilla POSITION CH1 → mueve `cursors.cursor1Pos`.
  - Perilla POSITION CH2 → mueve `cursors.cursor2Pos`.
- Al cerrar el menú de cursores, los cursores permanecen visibles pero ya no son movibles por las perillas (las perillas vuelven a mover las waveforms).

**Cursores de Voltaje** (`cursors.type = 'Voltaje'`):
- Se dibujan dos líneas horizontales que cruzan todo el ancho de la grilla.
- `cursor1Pos` y `cursor2Pos` en divisiones verticales desde el centro de la grilla.
- Readout en el menú lateral (valores respecto a **GND del canal fuente**):
  - `Cursor 1`: `cursor1Pos × voltsPerDiv - ch[source].verticalPosition × voltsPerDiv`
  - `Cursor 2`: igual para cursor 2.
  - `Delta`: diferencia = `(cursor1Pos - cursor2Pos) × voltsPerDiv`

**Cursores de Tiempo** (`cursors.type = 'Tiempo'`):
- Se dibujan dos líneas verticales.
- `cursor1Pos` y `cursor2Pos` en divisiones horizontales desde el centro de la grilla.
- Readout en el menú lateral (valores respecto al **punto de trigger**):
  - `Cursor 1`: `cursor1Pos × timePerDiv - horizontalPosition`
  - `Cursor 2`: igual.
  - `Delta`: `|cursor1Pos - cursor2Pos| × timePerDiv`. También mostrar `1/Delta` en Hz.

### 4.3 Menú Trigger (Edge)

| Key | Efecto | Invalida si STOP |
|---|---|---|
| `type` (page) | Sub-página A = `'Edge'`. Sub-página B = `'Video'` (no implementar aún). | **Sí** |
| `slope` | `'Subida'` → flanco ascendente. `'Bajada'` → flanco descendente. Afecta `_findTriggerTime()`. | **Sí** |
| `source` | Señal usada para detectar el trigger. | No |
| `mode` | Ver §5. Evaluar si activa Scan Mode. | No |
| `coupling` | Visual en menú; sin efecto real en la simulación. | No |

---

## 5. Lógica de trigger

### 5.1 Modo Auto (`trigger.mode = 'Auto'`)

- Si se detecta un cruce válido de `trigger.level` en la dirección `trigger.slope` → el display se estabiliza (`triggerStatus = 'triggered'`).
- Si **no** se detecta trigger en el intervalo de un barrido → el osciloscopio se fuerza a disparar de todas formas y la waveform "rueda" (`triggerStatus = 'auto'`). Este es el comportamiento ya implementado con `_driftOffset`.
- Si `timePerDiv ≥ 100ms` → entra en **Scan Mode** (ver §5.4), ignorando la lógica de trigger normal.

### 5.2 Modo Normal (`trigger.mode = 'Normal'`)

- Solo se adquiere cuando hay un trigger válido.
- Si no hay trigger, la pantalla **no se actualiza** (la última waveform capturada permanece congelada).
- `triggerStatus = 'ready'` mientras espera un trigger.
- `triggerStatus = 'triggered'` cuando captura y muestra el resultado.
- No entra en Scan Mode.

> **Diferencia con Auto:** En Auto, sin trigger, la waveform rueda. En Normal, sin trigger, la waveform se congela en la última adquisición válida.

### 5.3 Modo Único / Single (`trigger.mode = 'Único'`)

- Captura **un solo** barrido después del próximo trigger válido.
- Mientras espera: `triggerStatus = 'armed'`.
- Al detectar trigger: `triggerStatus = 'triggered'`, captura el barrido.
- Después de capturar: pasa automáticamente a `running = false`, `triggerStatus = 'stop'`.
- No entra en Scan Mode.

### 5.4 Modo Scan (`trigger.mode = 'Auto'` y `timePerDiv ≥ 100ms`)

El instrumento entra **automáticamente** en Scan Mode cuando se cumplen ambas condiciones. No es un modo que el usuario seleccione explícitamente.

**Comportamiento:**
- La waveform se actualiza de **izquierda a derecha** de forma continua, como una cinta que avanza.
- No hay punto de trigger definido; la señal se dibuja en tiempo real desde el borde izquierdo.
- El marcador de posición horizontal (ítem 3) **no se muestra**.
- El readout `Pos: Xms` (ítem 4) **no se muestra**.
- El marcador de nivel de trigger (ítem 5, flecha ◀) **no se muestra**.
- `triggerStatus = 'auto'` en todo momento.

**Implementación simplificada:** Puede modelarse como un offset horizontal que avanza linealmente con el tiempo (sin sincronización de trigger), con la waveform recortada al área de la grilla.

**Salida del Scan Mode:** Automática cuando `timePerDiv` vuelve a ser < 100ms, o cuando `trigger.mode` cambia a Normal o Único.

### 5.5 Detección de flanco

La función `_findTriggerTime()` ya implementa detección de flanco ascendente. Para flanco descendente, se invierte la condición:

- Ascendente (`trigger.slope = 'Subida'`): `prev < triggerLevel && cur >= triggerLevel`
- Descendente (`trigger.slope = 'Bajada'`): `prev > triggerLevel && cur <= triggerLevel`

La función debe leer `trigger.slope` del estado del menú trigger.

### 5.6 Fuente del trigger

Si `trigger.source = 'CH2'`, usar la señal de CH2 para la detección. Si CH2 no tiene señal asignada, tratar como sin trigger (comportamiento Auto: drift).

---

## 6. Lo que se muestra en el display (output)

### 6.1 Fila superior (header)

| Posición | Contenido | Fuente | Implementado |
|---|---|---|---|
| Izquierda | `"Tek"` | Fijo | ✅ |
| Centro-izquierda | Ícono de trigger status + label | `triggerStatus` calculado | ✅ |
| Centro (ítem 3) | Triángulo ▽ de posición del trigger | `horizontalPosition` | ❌ |
| Centro-derecha (ítem 4) | `"Pos: Xms"` | `horizontalPosition` formateado | ❌ |

> Ítems 3 y 4 se **ocultan** cuando Scan Mode está activo.

### 6.2 Fila inferior (footer)

| Posición | Contenido | Fuente | Implementado |
|---|---|---|---|
| Izquierda | `"CH1 Xv"` (ítem 11) | `ch1.voltsPerDiv × probeFactor` | ✅ (sin probeFactor) |
| Junto a CH1 | `"CH2 Xv"` si CH2 visible | `ch2.voltsPerDiv × probeFactor` | ❌ |
| Centro | `"M Xms"` (ítem 10) | `timePerDiv` | ✅ |
| Derecha | `"CH1 / Xv"` (ítems 6, 7, 8) | `trigger.source`, `trigger.slope`, `trigger.level` | ✅ |

> Ítems 6, 7, 8 se **ocultan** cuando Scan Mode está activo.

### 6.3 Área de grilla

| Elemento | Condición de visibilidad | Fuente | Implementado |
|---|---|---|---|
| Waveform CH1 (línea continua) | `ch1.visible && coupling ≠ 'GND' && !accuracyUncertain` | señal + `invert`, `verticalPosition`, `voltsPerDiv` | ✅ (sin coupling/invert) |
| Waveform CH1 (línea quebrada) | `ch1.visible && accuracyUncertain` | misma señal congelada, estilo dash | ❌ |
| Línea GND CH1 (`1▶`) | `ch1.visible` | `ch1.verticalPosition` | ✅ |
| Waveform CH2 | `ch2.visible && coupling ≠ 'GND'` | ídem CH1 para CH2 | ❌ |
| Línea GND CH2 (`2▶`) | `ch2.visible` | `ch2.verticalPosition` | ❌ |
| Flecha nivel trigger (`◀`) | `!scanMode` | `trigger.level`, `ch1.voltsPerDiv` | ✅ |
| Triángulo posición trigger (ítem 3) | `!scanMode` | `horizontalPosition`, borde superior | ❌ |
| Línea cursor 1 | `cursors.type ≠ 'Sin'` | `cursors.cursor1Pos` | ❌ |
| Línea cursor 2 | `cursors.type ≠ 'Sin'` | `cursors.cursor2Pos` | ❌ |

**Renderizado de línea quebrada** (`accuracyUncertain = true`):
- Usar `ctx.setLineDash([4, 4])` antes de dibujar la waveform.
- Aplicar solo a la waveform; los marcadores de tierra y trigger se siguen dibujando normalmente.
- Resetear `ctx.setLineDash([])` después.

### 6.4 Menú lateral

El menú lateral muestra los items del menú activo con el estado actual de cada variable.

Para el menú de cursores, los valores de `Delta`, `Cursor 1`, `Cursor 2` se calculan dinámicamente en `DisplayRenderer` y se pasan al `MenuLayer` como valores pre-formateados (strings), sobreescribiendo el `'—'` del type `'action'`.

---

## 7. Estado actual de implementación y gaps

### 7.1 Ya implementado ✅

- `DisplayRenderer`: estructura multicapa (Static, Dynamic, Menu), dirty flags, resize.
- Sistema de menús: apertura/cierre con toggle, 4 menús definidos, estados guardados, `pressBevelButton(n)`.
- `MenuLayer`: renderizado de slots con etiqueta + caja de valor, borde inferior, tipografía escalada.
- `StaticLayer`: grilla, subdivisiones, tick marks en 4 bordes y ejes centrales, labels CH1/M en footer.
- `DynamicLayer`: waveform con clipping, marcador de tierra CH1 (ítem 13), flecha de nivel de trigger (ítem 5), header con "Tek" + ícono de trigger status, footer con source/slope/level del trigger.
- Trigger mode Auto: detección de flanco ascendente, drift cuando no hay trigger.
- `triggerStatus` calculado y pasado a DynamicLayer.

### 7.2 Falta implementar — gaps priorizados

#### Grupo A — Conectar menú con lógica de render (bajo esfuerzo, alto impacto)

| # | Gap | Dónde | Qué hacer |
|---|---|---|---|
| 1 | `trigger.slope` no conectado | `_findTriggerTime()` en `DisplayRenderer` | Leer `this._menuState.trigger.slope` y cambiar la condición de detección de flanco |
| 2 | `ch[n].invert` no conectado | `DynamicLayer#drawWaveform` | Multiplicar `v` por −1 si `invert = true` |
| 3 | `ch[n].coupling = 'GND'` no conectado | `DynamicLayer#drawWaveform` | Si `coupling = 'GND'`, usar señal `() => 0` (línea horizontal en tierra) |
| 4 | `ch[n].coupling = 'AC'` no conectado | `DynamicLayer#drawWaveform` | Restar la media estimada de la señal visible antes de renderizar |
| 5 | `ch[n].probe` no afecta readout | `StaticLayer` | Multiplicar `voltsPerDiv × probeFactor` solo para el label, no internamente |

#### Grupo B — Nuevas variables de estado en DisplayRenderer

| # | Gap | Dónde | Qué hacer |
|---|---|---|---|
| 6 | `running` no existe | `DisplayRenderer` | Agregar `_running`, getter/setter, lógica en `render()` |
| 7 | `accuracyUncertain` no existe | `DisplayRenderer` | Agregar variable, setearla en los lugares correctos |
| 8 | `trigger.mode` Normal y Único no implementados | `render()` | Congelar si no hay trigger (Normal); capturar uno y detener (Único) |
| 9 | Scan Mode no implementado | `render()` | Detectar condición, cambiar comportamiento del offset horizontal |

#### Grupo C — Elementos visuales faltantes en DynamicLayer

| # | Gap | Dónde | Qué hacer |
|---|---|---|---|
| 10 | Waveform CH2 no se dibuja | `DynamicLayer` | Agregar `#drawWaveform` para CH2 con su propio state |
| 11 | Marcador tierra CH2 (`2▶`) no existe | `DynamicLayer` | Agregar `#drawGroundArrow` para CH2 |
| 12 | Label `"CH2 Xv"` no existe en footer | `StaticLayer` o `DynamicLayer` | Agregar si `ch2.visible` |
| 13 | Cursores no se dibujan | `DynamicLayer` | Agregar `#drawCursors` con líneas h/v según `cursors.type` |
| 14 | Waveform en línea quebrada cuando `accuracyUncertain` | `DynamicLayer` | Aplicar `setLineDash` cuando el flag es `true` |
| 15 | Ítem 3 (triángulo posición trigger) no existe | `DynamicLayer#drawHeader` | Dibujar triángulo ▽ proporcional a `horizontalPosition` |
| 16 | Ítem 4 (`"Pos: Xms"`) no existe | `DynamicLayer#drawHeader` | Agregar readout junto al triángulo |

#### Grupo D — MenuLayer / valores dinámicos en cursores

| # | Gap | Dónde | Qué hacer |
|---|---|---|---|
| 17 | Valores calculados de cursores no se muestran | `MenuLayer` + `DisplayRenderer` | Calcular Delta, Cursor1, Cursor2 en `DisplayRenderer` y pasarlos al `MenuLayer` como override de los slots `'action'` |

---

## 8. Orden de implementación sugerido

1. **Grupo A — gaps 1–5** — conectar el estado de menú con el renderizado. Cambios pequeños y aislados, todos dentro de archivos existentes.

2. **Gap 6 (`running`)** — agregar RUN/STOP. Simple, alto impacto visual inmediato.

3. **Gap 7 (`accuracyUncertain`) + Gap 14 (línea quebrada)** — van juntos. Agregar el flag y usarlo en el dibujo.

4. **Gap 8 (`trigger.mode` Normal/Único)** — requiere modificar el loop de `render()`.

5. **Gap 9 (Scan Mode)** — requiere detectar la condición y cambiar el comportamiento del offset horizontal y la visibilidad de los ítems 3, 4, 5.

6. **Gaps 10–12 (CH2)** — agregar señal CH2, su waveform y sus marcadores. Requiere coordinar `InputSignalManager` con el renderer para CH2.

7. **Gaps 13 + 17 (Cursores)** — dibujar las líneas de cursores y mostrar los valores calculados en el menú.

8. **Gaps 15–16 (ítems 3 y 4)** — triángulo de posición horizontal y readout `Pos: Xms`.
