import { Pane } from 'tweakpane';
import { DisplayRenderer } from '../../src/display/DisplayRenderer.js';
import { SineSignal } from '../../src/signals/SineSignal.js';
import { SquareSignal } from '../../src/signals/SquareSignal.js';
import { ThreePreview } from './ThreePreview.js';

const params = {
  signalType: 'sine',
  amplitude: 2,
  frequency: 1000,
  voltsPerDiv: 0.5,
  timePerDiv: 5e-4,
  verticalOffset: 0,
  horizontalOffset: 0,
  triggerLevel: 0,
  driftSpeed: 2,
  showSubdivisions: true,
  lineWidth: 1.5,
  width: 640,
  height: 512,
};

const renderer = new DisplayRenderer({ width: params.width, height: params.height });

function buildSignal() {
  const Ctor = params.signalType === 'square' ? SquareSignal : SineSignal;
  return new Ctor({ amplitude: params.amplitude, frequency: params.frequency });
}
renderer.signal = buildSignal();

const canvasHost = document.getElementById('canvas-host');
canvasHost.appendChild(renderer.canvas);

const threeHost = document.getElementById('three-host');
const preview = new ThreePreview(threeHost, renderer.canvas);

const pane = new Pane({ container: document.getElementById('tweakpane-host'), title: 'DisplayRenderer' });

const fSignal = pane.addFolder({ title: 'Señal' });
fSignal.addBinding(params, 'signalType', { options: { Senoidal: 'sine', Cuadrada: 'square' } })
  .on('change', () => { renderer.signal = buildSignal(); });
fSignal.addBinding(params, 'amplitude', { min: 0.01, max: 10, step: 0.01 })
  .on('change', () => { renderer.signal = buildSignal(); });
fSignal.addBinding(params, 'frequency', { min: 1, max: 100000, step: 1 })
  .on('change', () => { renderer.signal = buildSignal(); });

const fScale = pane.addFolder({ title: 'Escalas' });
fScale.addBinding(params, 'voltsPerDiv', { min: 0.001, max: 10, step: 0.001 })
  .on('change', () => { renderer.voltsPerDiv = params.voltsPerDiv; });
fScale.addBinding(params, 'timePerDiv', { min: 1e-7, max: 1, step: 1e-7 })
  .on('change', () => { renderer.timePerDiv = params.timePerDiv; });

const fOffsets = pane.addFolder({ title: 'Offsets' });
fOffsets.addBinding(params, 'verticalOffset', { min: -4, max: 4, step: 0.01 })
  .on('change', () => { renderer.verticalOffset = params.verticalOffset; });
fOffsets.addBinding(params, 'horizontalOffset', { min: -5, max: 5, step: 0.01 })
  .on('change', () => { renderer.horizontalOffset = params.horizontalOffset; });

const fTrigger = pane.addFolder({ title: 'Trigger' });
fTrigger.addBinding(params, 'triggerLevel', { min: -5, max: 5, step: 0.01 })
  .on('change', () => { renderer.triggerLevel = params.triggerLevel; });
fTrigger.addBinding(params, 'driftSpeed', { min: 0, max: 20, step: 0.1 })
  .on('change', () => { renderer.driftSpeed = params.driftSpeed; });

const fVisual = pane.addFolder({ title: 'Visual' });
fVisual.addBinding(params, 'showSubdivisions')
  .on('change', () => { renderer.showSubdivisions = params.showSubdivisions; });
fVisual.addBinding(params, 'lineWidth', { min: 0.5, max: 4, step: 0.1 })
  .on('change', () => { renderer.lineWidth = params.lineWidth; });

const fRes = pane.addFolder({ title: 'Resolución lógica' });
fRes.addBinding(params, 'width', { min: 200, max: 1600, step: 16 })
  .on('change', () => { renderer.resize(params.width, params.height); preview.rebuildPlane(renderer.canvas); });
fRes.addBinding(params, 'height', { min: 160, max: 1280, step: 16 })
  .on('change', () => { renderer.resize(params.width, params.height); preview.rebuildPlane(renderer.canvas); });

function loop() {
  const now = performance.now() / 1000;
  renderer.render(now);
  preview.render();
  requestAnimationFrame(loop);
}
loop();
