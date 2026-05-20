# CameraController
## Especificación funcional y técnica

La aplicación deberá poseer un sistema de cámara propio responsable de controlar la navegación del usuario dentro de la escena 3D. Este sistema deberá permitir tanto navegación libre como transiciones automáticas hacia vistas predefinidas. El objetivo principal será proporcionar una experiencia de exploración cómoda, controlada y consistente alrededor del osciloscopio virtual.

La cámara utilizará un esquema basado en `origin` y `target`. El usuario observará la escena desde una posición determinada mientras la cámara apunta hacia un punto objetivo configurable. El controlador será responsable de administrar tanto la posición de la cámara como el movimiento del target.

El sistema deberá implementar dos modos generales de operación: modo libre y modo guiado. En el modo libre el usuario podrá controlar manualmente la cámara mediante rotación orbital, paneo y zoom. En el modo guiado el sistema ejecutará automáticamente transiciones suaves hacia vistas predefinidas.

Las vistas predefinidas estarán compuestas al menos por:

- posición de cámara (`origin`)
- posición objetivo (`target`)
- duración de transición
- parámetros de easing

El controlador deberá exponer métodos para ejecutar transiciones hacia estas vistas. La forma concreta de integración con la UI queda abierta, pero el sistema deberá permitir que otras partes de la aplicación soliciten dichas transiciones programáticamente.

Durante una transición automática el usuario no deberá poder controlar manualmente la cámara. Los controles de rotación, paneo y zoom permanecerán temporalmente bloqueados hasta finalizar la animación. Una vez alcanzada la vista destino, el usuario recuperará inmediatamente el control manual completo.

Las transiciones deberán utilizar interpolación suave con easing y evitar movimientos bruscos o instantáneos. El objetivo no será una simulación física de inercia sino una navegación clara y cómoda visualmente.

El controlador deberá implementar restricciones angulares para evitar que el usuario pueda observar la escena desde posiciones inválidas o incómodas. Particularmente deberá impedirse que la cámara pueda colocarse por debajo del plano del piso o detrás del osciloscopio en ángulos extremos.

El sistema deberá soportar paneo horizontal mediante desplazamiento del target sobre el plano XZ. El target no podrá moverse libremente por toda la escena sino únicamente dentro de un área rectangular predefinida centrada en el osciloscopio. Esta restricción deberá mantenerse tanto durante interacción manual como durante movimientos programáticos.

Cuando el usuario realice drag con el botón derecho del mouse o gesto equivalente táctil, el sistema deberá desplazar el target respetando dichos límites. Si el usuario intenta continuar el movimiento más allá de los límites permitidos, el target deberá detenerse exactamente sobre el borde permitido sin overshoot.

El sistema deberá permitir zoom controlando la distancia entre `origin` y `target`. También deberán existir límites mínimos y máximos de zoom para evitar acercamientos o alejamientos excesivos.

Uno de los comportamientos más importantes del controlador será el reencuadre automático ante apertura o cierre de la interfaz lateral HTML. Cuando la UI se encuentre visible ocupando aproximadamente el 33% derecho de la pantalla, la cámara deberá reencuadrar automáticamente el osciloscopio para mantenerlo completamente visible dentro del área libre restante.

Este reencuadre no deberá simplemente trasladar horizontalmente la cámara. El sistema deberá calcular automáticamente un nuevo encuadre manteniendo la dirección general de visión mientras ajusta paneo y distancia para garantizar que el bounding box completo del osciloscopio permanezca contenido dentro del área izquierda visible de la pantalla.

El controlador deberá proveer un método específico para ejecutar este reencuadre automático. La transición también deberá realizarse utilizando easing suave y bloqueo temporal de controles mientras dure la animación.

Una vez finalizado el reencuadre, el usuario deberá recuperar nuevamente el control libre de la cámara y poder continuar orbitando, paneando o haciendo zoom manualmente.

El sistema deberá diseñarse para funcionar tanto con mouse como con pantallas táctiles. Las acciones de rotación, paneo y zoom deberán abstraerse de manera que posteriormente puedan mapearse fácilmente a interacción touch sin modificar la lógica central del controlador.

Durante el desarrollo deberá implementarse además una aplicación de testing independiente específicamente orientada a validar el comportamiento del `CameraController`.

La escena de testing deberá contener un objeto simple representando al osciloscopio. Este objeto podrá implementarse mediante una caja rectangular de dimensiones aproximadas `2 x 1 x 1`. La caja deberá utilizar un material translúcido con aproximadamente 50% de opacidad para permitir observar referencias internas y facilitar la percepción espacial.

La escena deberá contener además:

- grid helper
- axis helper global
- axis helper ubicado en el target de cámara
- representación wireframe del área límite de movimiento del target
- plano de piso simple

El wireframe de límites deberá representar exactamente el área rectangular válida dentro de la cual el target puede desplazarse. Esto permitirá verificar visualmente que las restricciones de paneo funcionan correctamente.

El axis helper ubicado en el target deberá actualizarse dinámicamente mostrando en todo momento la posición real del punto objetivo de la cámara.

La aplicación de testing deberá incluir un panel lateral de control utilizando Tweakpane o herramienta equivalente. Desde este panel deberá ser posible activar distintas vistas predefinidas para probar las transiciones automáticas.

Como mínimo deberán existir las siguientes vistas:

- vista frontal general
- vista lateral
- vista diagonal
- vista cercana a la pantalla

Cada vista deberá ejecutar automáticamente una transición suave hacia la posición correspondiente.

El tester deberá permitir además modificar dinámicamente:

- duración de transición
- tipo de easing
- límites angulares
- límites del target
- velocidad de zoom
- distancia mínima y máxima
- activación/desactivación temporal de restricciones

El objetivo del tester será validar visualmente:

- suavidad de transiciones
- interpolación correcta
- restricciones angulares
- restricciones de paneo
- comportamiento de zoom
- funcionamiento del reencuadre automático
- estabilidad del target
- bloqueo de controles durante animaciones
- comportamiento consistente entre vistas

La aplicación de testing deberá permitir iterar y ajustar el comportamiento completo del controlador de cámara antes de integrarlo con el resto del simulador del osciloscopio.