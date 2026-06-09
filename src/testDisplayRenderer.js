import { Pane } from 'tweakpane';
import { DisplayRenderer } from './display/DisplayRenderer.js';
import { SineSignal } from './signals/SineSignal.js';
import { SquareSignal } from './signals/SquareSignal.js';

// Default parameters for the testbench
const params = {
  signalType: 'sine',
  amplitude: 2.5,
  frequency: 1000,
  phase: 0,
  offset: 0,
  dutyCycle: 0.5,
  
  voltsPerDiv: 1.0,
  timePerDiv: 5e-4,
  verticalOffset: 0.0,
  horizontalOffset: 0.0,
  
  triggerLevel: 0.0,
  driftSpeed: 2.0,
  
  showSubdivisions: true,
  lineWidth: 1.8,
  
  width: 640,
  height: 512,
};

// Function to construct signal based on user parameter selections
function buildSignal() {
  if (params.signalType === 'sine') {
    return new SineSignal({
      amplitude: params.amplitude,
      frequency: params.frequency,
      phase: params.phase,
      offset: params.offset,
    });
  } else {
    return new SquareSignal({
      amplitude: params.amplitude,
      frequency: params.frequency,
      phase: params.phase,
      offset: params.offset,
      dutyCycle: params.dutyCycle,
    });
  }
}

// Instantiate DisplayRenderer
const renderer = new DisplayRenderer({ 
  width: params.width, 
  height: params.height 
});

// Apply initial signal and configs
renderer.signal = buildSignal();
renderer.voltsPerDiv = params.voltsPerDiv;
renderer.timePerDiv = params.timePerDiv;
renderer.verticalOffset = params.verticalOffset;
renderer.horizontalOffset = params.horizontalOffset;
renderer.triggerLevel = params.triggerLevel;
renderer.driftSpeed = params.driftSpeed;
renderer.showSubdivisions = params.showSubdivisions;
renderer.lineWidth = params.lineWidth;

// Append the canvas to our DOM container
const canvasHost = document.getElementById('canvas-host');
if (canvasHost) {
  canvasHost.appendChild(renderer.canvas);
}

// Setup Tweakpane
const pane = new Pane({
  container: document.getElementById('tweakpane-host'),
  title: 'Parámetros del Display',
});

// Folder: Señal de Entrada
const fSignal = pane.addFolder({ title: 'Señal de Entrada' });

fSignal.addBinding(params, 'signalType', {
  options: {
    'Senoidal': 'sine',
    'Cuadrada': 'square',
  },
  label: 'Tipo',
}).on('change', () => {
  renderer.signal = buildSignal();
  // Toggle visibility of dutyCycle for square signal
  if (dutyCycleBinding) {
    dutyCycleBinding.hidden = params.signalType !== 'square';
  }
});

fSignal.addBinding(params, 'amplitude', {
  min: 0.1,
  max: 10.0,
  step: 0.1,
  label: 'Amplitud (V)',
}).on('change', () => {
  renderer.signal = buildSignal();
});

fSignal.addBinding(params, 'frequency', {
  min: 10,
  max: 20000,
  step: 10,
  label: 'Frecuencia (Hz)',
}).on('change', () => {
  renderer.signal = buildSignal();
});

fSignal.addBinding(params, 'phase', {
  min: -Math.PI,
  max: Math.PI,
  step: 0.1,
  label: 'Fase (rad)',
}).on('change', () => {
  renderer.signal = buildSignal();
});

fSignal.addBinding(params, 'offset', {
  min: -5.0,
  max: 5.0,
  step: 0.1,
  label: 'Offset Señal (V)',
}).on('change', () => {
  renderer.signal = buildSignal();
});

const dutyCycleBinding = fSignal.addBinding(params, 'dutyCycle', {
  min: 0.05,
  max: 0.95,
  step: 0.05,
  label: 'Ciclo Trabajo',
});
dutyCycleBinding.hidden = params.signalType !== 'square';
dutyCycleBinding.on('change', () => {
  renderer.signal = buildSignal();
});

// Folder: Escalas del Osciloscopio
const fScales = pane.addFolder({ title: 'Escalas' });

fScales.addBinding(params, 'voltsPerDiv', {
  min: 0.1,
  max: 5.0,
  step: 0.1,
  label: 'Voltios / Div',
}).on('change', () => {
  renderer.voltsPerDiv = params.voltsPerDiv;
});

fScales.addBinding(params, 'timePerDiv', {
  min: 5e-5,
  max: 5e-2,
  step: 1e-5,
  label: 'Tiempo / Div (s)',
}).on('change', () => {
  renderer.timePerDiv = params.timePerDiv;
});

// Folder: Offset & Trigger
const fTrigger = pane.addFolder({ title: 'Offset & Acoplamiento' });

fTrigger.addBinding(params, 'verticalOffset', {
  min: -5.0,
  max: 5.0,
  step: 0.1,
  label: 'Offset Vert. (div)',
}).on('change', () => {
  renderer.verticalOffset = params.verticalOffset;
});

fTrigger.addBinding(params, 'horizontalOffset', {
  min: -5.0,
  max: 5.0,
  step: 0.1,
  label: 'Offset Horiz. (div)',
}).on('change', () => {
  renderer.horizontalOffset = params.horizontalOffset;
});

fTrigger.addBinding(params, 'triggerLevel', {
  min: -5.0,
  max: 5.0,
  step: 0.1,
  label: 'Nivel Trigger (V)',
}).on('change', () => {
  renderer.triggerLevel = params.triggerLevel;
});

fTrigger.addBinding(params, 'driftSpeed', {
  min: 0.0,
  max: 10.0,
  step: 0.2,
  label: 'Velocidad Drift',
}).on('change', () => {
  renderer.driftSpeed = params.driftSpeed;
});

// Folder: Apariencia
const fAppearance = pane.addFolder({ title: 'Apariencia' });

fAppearance.addBinding(params, 'showSubdivisions', {
  label: 'Subdivisiones',
}).on('change', () => {
  renderer.showSubdivisions = params.showSubdivisions;
});

fAppearance.addBinding(params, 'lineWidth', {
  min: 0.5,
  max: 5.0,
  step: 0.1,
  label: 'Grosor Línea',
}).on('change', () => {
  renderer.lineWidth = params.lineWidth;
});

// Folder: Resolución Lógica
const fResolution = pane.addFolder({ title: 'Tamaño Lógico' });

fResolution.addBinding(params, 'width', {
  min: 320,
  max: 1280,
  step: 20,
  label: 'Ancho (px)',
}).on('change', () => {
  renderer.resize(params.width, params.height);
});

fResolution.addBinding(params, 'height', {
  min: 240,
  max: 1024,
  step: 20,
  label: 'Alto (px)',
}).on('change', () => {
  renderer.resize(params.width, params.height);
});

// Folder: Sistema de Menús (simulación de botones frontales)
const fMenus = pane.addFolder({ title: 'Menús del Osciloscopio' });

fMenus.addButton({ title: 'CH 1 MENU' }).on('click', () => renderer.openMenu('ch1'));
fMenus.addButton({ title: 'CH 2 MENU' }).on('click', () => renderer.openMenu('ch2'));
fMenus.addButton({ title: 'MENÚ DISPARO' }).on('click', () => renderer.openMenu('trigger'));
fMenus.addButton({ title: 'CURSORES' }).on('click', () => renderer.openMenu('cursors'));
fMenus.addButton({ title: 'Cerrar menú' }).on('click', () => renderer.closeMenu());

const fBevel = pane.addFolder({ title: 'Botones Biselados (F1–F5)' });
fBevel.addButton({ title: 'F1 (superior)' }).on('click', () => renderer.pressBevelButton(0));
fBevel.addButton({ title: 'F2' }).on('click', () => renderer.pressBevelButton(1));
fBevel.addButton({ title: 'F3' }).on('click', () => renderer.pressBevelButton(2));
fBevel.addButton({ title: 'F4' }).on('click', () => renderer.pressBevelButton(3));
fBevel.addButton({ title: 'F5 (inferior)' }).on('click', () => renderer.pressBevelButton(4));


// Animation loop
function loop(time) {
  const seconds = time / 1000;
  renderer.render(seconds);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
