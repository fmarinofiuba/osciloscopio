# DisplayRenderer
## Especificación funcional y técnica




El `DisplayRenderer` será el subsistema responsable de generar la imagen visual del display del osciloscopio. Su función será representar gráficamente el comportamiento observable del instrumento a partir del estado interno del sistema y de la señal actualmente conectada. El resultado final será una textura dinámica utilizada sobre el display del modelo 3D.

La implementación estará basada en Canvas2D y utilizará una resolución lógica fija independientemente del tamaño visual del modelo en pantalla. El objetivo de esta primera versión no será reproducir con precisión física el funcionamiento interno de un osciloscopio real, sino generar una representación visual suficientemente convincente y consistente desde el punto de vista del usuario.

El renderer deberá trabajar utilizando al menos dos capas de dibujo independientes. La primera será una capa estática que contendrá todos los elementos que cambian poco frecuentemente, mientras que la segunda será una capa dinámica que contendrá la forma de onda y todos los elementos visuales que cambian constantemente. Ambas capas deberán componerse posteriormente para generar la textura final utilizada en el display.

La capa estática deberá contener la grilla del osciloscopio, las subdivisiones, líneas centrales, referencias visuales y textos persistentes. Esta capa solamente deberá regenerarse cuando cambien parámetros que afecten la estructura visual del display, por ejemplo cambios de escala, resolución, configuración visual o tamaño del canvas.

La capa dinámica deberá contener la waveform y cualquier otro elemento temporal o dinámico. Esta capa podrá actualizarse frecuentemente y será la encargada de representar visualmente el comportamiento de la señal.

El sistema deberá utilizar un mecanismo de invalidación o “dirty flags” para evitar redibujos innecesarios. El renderer deberá poder determinar independientemente cuándo es necesario regenerar la capa estática, la capa dinámica o la composición final.

La estética visual del display será deliberadamente simple. La pantalla utilizará fondo blanco con líneas negras y un estilo técnico limpio. No será necesario implementar efectos de glow, blur, fósforo CRT, persistencia visual compleja, ruido electrónico realista ni postprocesado avanzado. La prioridad será claridad visual, simplicidad de implementación y eficiencia.

La pantalla deberá representar una grilla rectangular típica de osciloscopio compuesta por 10 divisiones horizontales y 8 divisiones verticales. Cada división principal podrá subdividirse en subdivisiones más pequeñas utilizando líneas más finas o punteadas. La línea vertical central y la línea horizontal central deberán diferenciarse visualmente del resto de la grilla para facilitar la lectura de la señal.

El renderer deberá trabajar conceptualmente utilizando divisiones del osciloscopio como sistema interno de coordenadas y no píxeles absolutos. Esto permitirá desacoplar el comportamiento lógico del tamaño físico del canvas y facilitará el manejo de escalas, offsets y mediciones. La conversión final a píxeles deberá ocurrir únicamente durante el proceso de dibujo.

La clase deberá mantener internamente al menos los siguientes estados visuales y funcionales:

- escala vertical (`volts/div`)
- escala horizontal (`time/div`)
- offset vertical
- offset horizontal
- nivel de trigger
- estado de sincronización del trigger
- velocidad de drift horizontal
- señal actualmente representada

La escala vertical deberá modificar cuánto espacio ocupa la señal sobre el eje vertical. Una escala más sensible deberá provocar que la señal se vea más grande ocupando más divisiones de la grilla, mientras que una escala menos sensible deberá reducir visualmente la amplitud representada.

La escala horizontal deberá controlar cuánto tiempo visible entra en pantalla. Valores pequeños de `time/div` deberán producir un zoom horizontal mostrando menos ciclos de la señal, mientras que valores mayores deberán mostrar más ciclos comprimidos horizontalmente.

El offset vertical deberá desplazar toda la waveform hacia arriba o hacia abajo sin alterar la forma de la señal. El offset horizontal deberá desplazar la waveform hacia izquierda o derecha simulando el corrimiento temporal de la visualización.

La waveform deberá representarse como una línea continua obtenida a partir de muestras temporales de la señal. La implementación concreta del algoritmo de dibujo queda abierta, pero visualmente deberá verse como una curva continua limpia y estable.

La señal utilizada en esta primera versión podrá ser una representación idealizada y libre de ruido. Por ejemplo, una señal senoidal perfectamente estable o una señal cuadrada ideal. El `DisplayRenderer` no deberá depender del mecanismo que genera la señal, sino únicamente recibir una representación abstracta de la misma a través de la interfaz `sample(t)`.

En la integración actual el `DisplayRenderer` recibe su señal de CH1 desde el `InputSignalManager` mediante el método `attachRenderer(displayRenderer)`. El manager mantiene viva la instancia de `Signal` y muta sus parámetros directamente cuando el usuario cambia amplitud, frecuencia, fase u offset; sólo reemplaza la referencia almacenada en el renderer cuando cambia el **tipo** de señal (Senoidal ↔ Cuadrada). El renderer no conoce ni la fuente ni el modo de ownership (`free` vs `exercise`) que gobierna esa señal. En esta iteración CH2 se modela en el `InputSignalManager` pero NO se conecta al renderer.

El sistema de trigger deberá implementarse de forma simplificada. No se buscará reproducir el comportamiento físico real del circuito de trigger del osciloscopio, sino únicamente generar una representación visual equivalente desde el punto de vista del usuario.

Cuando el nivel de trigger se encuentre dentro de un rango razonable respecto de la amplitud de la señal, la waveform deberá visualizarse estable y fija en pantalla. Cuando el trigger se encuentre fuera de rango o mal configurado, la señal deberá perder estabilidad visual y comenzar a desplazarse horizontalmente generando un efecto de drift o vibración. Este comportamiento no deberá lograrse alterando la señal física original sino modificando la sincronización visual del barrido o el offset temporal utilizado para dibujar la waveform.

El renderer deberá permitir que la waveform salga parcialmente fuera de los límites visibles del display cuando la amplitud o los offsets excedan el área visible. El resultado simplemente deberá recortarse visualmente sin generar errores ni comportamientos especiales.

El sistema deberá exponer o generar una textura dinámica (HTMLCanvasElement) compatible con CanvasTexture de  Three.js para ser utilizada sobre el material del display del modelo 3D. 

Durante el desarrollo deberá implementarse además una aplicación de testing independiente específicamente orientada a validar el funcionamiento del `DisplayRenderer`. Esta aplicación permitirá desarrollar y depurar el sistema sin necesidad de cargar el osciloscopio completo ni el resto de la aplicación principal.

La aplicación de testing deberá mostrar el canvas final renderizado junto con un panel de controles para modificar dinámicamente el estado interno del renderer y observar inmediatamente el resultado visual.

El panel de testing deberá permitir modificar al menos (se sugiere usar TweakPane.js)

- tipo de señal
- amplitud
- frecuencia
- escala vertical (`volts/div`)
- escala horizontal (`time/div`)
- offset vertical
- offset horizontal
- nivel de trigger
- velocidad de drift
- activación/desactivación de subdivisiones
- grosor de líneas
- resolución lógica del display

El tester deberá permitir validar visualmente que:

- las escalas funcionan correctamente
- los offsets desplazan la señal apropiadamente
- el trigger estabiliza o desestabiliza la imagen
- la waveform se representa correctamente
- la grilla mantiene proporciones correctas
- el sistema de redraw funciona eficientemente
- la textura se actualiza correctamente
- el display se mantiene visualmente consistente ante cambios de resolución

El objetivo del tester será permitir iterar rápidamente sobre el comportamiento visual del display antes de integrarlo con el resto del sistema del osciloscopio virtual.