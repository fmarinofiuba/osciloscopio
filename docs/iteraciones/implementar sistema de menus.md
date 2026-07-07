la clase DisplayRenderer debe modificarse para poder mostrar los menues cuando sea necesario

cuando se despliega el menu, los 5 botones fisicos laterales actuan sobre las 5 secciones de opciones del menu
la clase DisplayRenderer debe tener metodos para accionar virtualmente esas secciones del menues
es decir un metodo que luego conectado el boton 3d virtual pueda avisar que debe cambiar esa opcion de menu

los menues a implementar son 

- menu ch1 
- menu ch2 
- cursores 
- trigger 


aqui se detalla como se acciona o se enciende cada menu

Menú de Cursores: Se llega a él mediante el botón CURSORES
. Permite activar líneas de medición para Tensión o Tiempo
Menú de Disparo: Se activa con el botón MENÚ DISPARO
. Permite alternar entre los tipos de disparo por Flanco o por Vídeo y configurar sus parámetros específicos como fuente y acoplamiento
Menú de Canal (ch1/ch2): Se llega presionando los botones individuales de cada canal: CH 1 MENU, CH 2 MENU, etc.
. Aquí se ajusta el acoplamiento (CA/CC/GND), el límite de ancho de banda, la atenuación de la sonda y la inversión de la señal



Funcionamiento General del Sistema de Menús
Cuando se presiona un botón de menú en el panel frontal, el título del menú aparece en la esquina superior derecha 1, 3. Debajo de este, se muestran hasta cinco cuadros de menú que corresponden a los cinco botones biselados 1, 3. Existen cuatro tipos de cuadros de menú 1, 4:
●	Listas circulares: Ciclan entre varias opciones al presionar el botón 5.
●	Botones de acción: Ejecutan una acción inmediata (ej. "Almacenar") 5.
●	Botones de opción (Radio): Seleccionan un modo entre varios excluyentes 6.
●	Selección de página: Cambian por completo las opciones de los botones inferiores al alternar entre dos sub-menús principales 6, 7.


Aqui va el detalle de cada menu y que hace cada opcion

Menú de Cursores (Botón CURSORES)
Permite realizar mediciones manuales en pantalla 
●	Tipo: Tensión (líneas horizontales), Tiempo (líneas verticales) o Sin (desactivado) 
●	Fuente: Selecciona la señal a medir (CH1, CH2, Matem., etc.) 
●	Delta: Muestra la diferencia entre ambos cursores 
●	Cursor 1 / Cursor 2: Muestran la posición individual de cada cursor respecto a tierra o al disparo .

Menú de Disparo (Botón MENÚ DISPARO)
Alterna entre los tipos Flanco (Edge) y Vídeo 40, 41.
●	Pendiente: Subida o Bajada 
●	Fuente: CH1, CH2, CH3*, CH4*, Ext, Ext/5, Red Eléctrica 
●	Modo: Auto, Normal, Único 
●	Acoplamiento: CA, CC, Rechazo de ruido, Rechazo AF, Rechazo BF 43,
●	Sub-menú Vídeo:
●	Polaridad: Normal o Invertida 
●	Sincronismo: Campo o Línea 

Menú de Canal (Botones CH 1 MENU, CH 2 MENU, etc.)
Opciones individuales para cada canal de entrada .
●	Acoplamiento: CC, CA o GND (desconecta la señal interna) 
●	Limitar Ancho Banda: Activa un filtro de 20 MHz 
●	Volts/Div: Gruesa (pasos 1-2-5) o Fina (ajuste preciso) 
●	Sonda: Selecciona el factor de atenuación (1X, 10X, 100X, 1000X) 
●	Invertir: Invierte la polaridad de la señal en pantalla 

por ahora solo quiero que DisplayRenderer simule el funcionamiento del menu y guarde los estados necesarios en variables
Pero no quiero que las opciones tengan efecto en la simulacion del dispositivo y por ende en como se visualiza la señal en el display
solo quiero en esta etapa poder abrir cada menu, modificar sus opciones y ver que sea fiel al dispositivo realizar

Preguntame sobre cualquier duda que tengas
