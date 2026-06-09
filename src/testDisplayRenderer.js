import { Pane } from 'tweakpane';
import { DisplayRenderer } from './display/DisplayRenderer.js';
import { SineSignal } from './signals/SineSignal.js';
import { SquareSignal } from './signals/SquareSignal.js';
import { RCSignal } from './signals/RCSignal.js';

// ── Pasos discretos de escala ──────────────────────────────────────────────────

const VOLTS_STEPS = [0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5];
const TIME_STEPS  = [
  5e-9, 1e-8, 2.5e-8, 5e-8, 1e-7, 2.5e-7, 5e-7,
  1e-6, 2.5e-6, 5e-6, 1e-5, 2.5e-5, 5e-5,
  1e-4, 2.5e-4, 5e-4, 1e-3, 2.5e-3, 5e-3, 1e-2,
  2.5e-2, 5e-2, 0.1, 0.25, 0.5, 1, 2.5, 5,
];

function clampIdx(idx, arr) { return Math.max(0, Math.min(arr.length - 1, idx)); }

// ── Estado de señales ─────────────────────────────────────────────────────────

// Parámetros de cada tipo de señal, separados por canal
const ch1Signal = {
  type: 'sine',
  sine:   { amplitude: 2.5, frequency: 1000, phase: 0, offset: 0 },
  square: { amplitude: 2.5, frequency: 1000, phase: 0, offset: 0, dutyCycle: 0.5 },
  rc:     { amplitude: 2.5, frequency: 1000, tau: 2e-4, offset: 0, dutyCycle: 0.5 },
};

const ch2Signal = {
  type: 'sine',
  sine:   { amplitude: 1.5, frequency: 500, phase: 0, offset: 0 },
  square: { amplitude: 1.5, frequency: 500, phase: 0, offset: 0, dutyCycle: 0.5 },
  rc:     { amplitude: 1.5, frequency: 500, tau: 2e-4, offset: 0, dutyCycle: 0.5 },
};

function buildSignal(ch) {
  const p = ch[ch.type];
  if (ch.type === 'sine')   return new SineSignal(p);
  if (ch.type === 'square') return new SquareSignal(p);
  if (ch.type === 'rc')     return new RCSignal(p);
}

// ── Renderer ───────────────────────────────────────────────────────────────────

let ch1VIdx = VOLTS_STEPS.indexOf(1);
let ch2VIdx = VOLTS_STEPS.indexOf(1);
let timIdx  = TIME_STEPS.findIndex(v => v >= 5e-4);
const posTrack = { ch1: 0, ch2: 0, _prevCh1: 0, _prevCh2: 0 };

const renderer = new DisplayRenderer({ width: 640, height: 512 });
renderer.signal1       = buildSignal(ch1Signal);
renderer.ch1VoltsPerDiv = VOLTS_STEPS[ch1VIdx];
renderer.ch2VoltsPerDiv = VOLTS_STEPS[ch2VIdx];
renderer.timePerDiv    = TIME_STEPS[timIdx];

const canvasHost = document.getElementById('canvas-host');
if (canvasHost) canvasHost.appendChild(renderer.canvas);

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL IZQUIERDO — parámetros de las señales
// ═══════════════════════════════════════════════════════════════════════════════

const paneSignals = new Pane({
  container: document.getElementById('tweakpane-signals'),
  title: 'Señales',
});

// ── CH1 ────────────────────────────────────────────────────────────────────────

const fCh1 = paneSignals.addFolder({ title: 'Canal CH1', expanded: true });

fCh1.addBinding(ch1Signal, 'type', {
  label: 'Tipo señal',
  options: { Senoidal: 'sine', Cuadrada: 'square', 'Circuito RC': 'rc' },
}).on('change', () => {
  updateCh1ParamVisibility();
  renderer.signal1 = buildSignal(ch1Signal);
});

// Parámetros comunes a Senoidal y Cuadrada
const ch1SineSquareParams = [
  fCh1.addBinding(ch1Signal.sine, 'amplitude', { min: 0.1, max: 10, step: 0.1, label: 'Amplitud (V)' })
    .on('change', () => { if (ch1Signal.type !== 'rc') renderer.signal1 = buildSignal(ch1Signal); }),
  fCh1.addBinding(ch1Signal.sine, 'frequency', { min: 1, max: 100000, step: 1, label: 'Frecuencia (Hz)' })
    .on('change', () => { if (ch1Signal.type !== 'rc') renderer.signal1 = buildSignal(ch1Signal); }),
  fCh1.addBinding(ch1Signal.sine, 'phase', { min: -Math.PI, max: Math.PI, step: 0.01, label: 'Fase (rad)' })
    .on('change', () => { if (ch1Signal.type !== 'rc') renderer.signal1 = buildSignal(ch1Signal); }),
  fCh1.addBinding(ch1Signal.sine, 'offset', { min: -5, max: 5, step: 0.1, label: 'Offset DC (V)' })
    .on('change', () => { if (ch1Signal.type !== 'rc') renderer.signal1 = buildSignal(ch1Signal); }),
];

const ch1DutyBind = fCh1.addBinding(ch1Signal.square, 'dutyCycle', { min: 0.05, max: 0.95, step: 0.05, label: 'Ciclo trabajo' })
  .on('change', () => { if (ch1Signal.type === 'square') renderer.signal1 = buildSignal(ch1Signal); });

// Parámetros exclusivos de RC
const ch1RcParams = [
  fCh1.addBinding(ch1Signal.rc, 'amplitude', { min: 0.1, max: 10, step: 0.1, label: 'Amplitud entrada (V)' })
    .on('change', () => { if (ch1Signal.type === 'rc') renderer.signal1 = buildSignal(ch1Signal); }),
  fCh1.addBinding(ch1Signal.rc, 'frequency', { min: 1, max: 50000, step: 1, label: 'Frecuencia (Hz)' })
    .on('change', () => { if (ch1Signal.type === 'rc') renderer.signal1 = buildSignal(ch1Signal); }),
  fCh1.addBinding(ch1Signal.rc, 'dutyCycle', { min: 0.05, max: 0.95, step: 0.05, label: 'Ciclo trabajo' })
    .on('change', () => { if (ch1Signal.type === 'rc') renderer.signal1 = buildSignal(ch1Signal); }),
  fCh1.addBinding(ch1Signal.rc, 'offset', { min: -5, max: 5, step: 0.1, label: 'Offset DC (V)' })
    .on('change', () => { if (ch1Signal.type === 'rc') renderer.signal1 = buildSignal(ch1Signal); }),
];

// Proxy τ en µs para slider más cómodo
const ch1TauProxy = { tau_us: ch1Signal.rc.tau * 1e6 };
const ch1TauBind = fCh1.addBinding(ch1TauProxy, 'tau_us', { min: 0.01, max: 1000, step: 0.01, label: 'τ = RC (µs)' })
  .on('change', ({ value }) => {
    ch1Signal.rc.tau = value * 1e-6;
    if (ch1Signal.type === 'rc') renderer.signal1 = buildSignal(ch1Signal);
  });
ch1RcParams.push(ch1TauBind);

function updateCh1ParamVisibility() {
  const isRC = ch1Signal.type === 'rc';
  const isSquare = ch1Signal.type === 'square';
  ch1SineSquareParams.forEach(b => { b.hidden = isRC; });
  ch1DutyBind.hidden = !isSquare;
  ch1RcParams.forEach(b => { b.hidden = !isRC; });
}
updateCh1ParamVisibility();

// ── CH2 ────────────────────────────────────────────────────────────────────────

const fCh2 = paneSignals.addFolder({ title: 'Canal CH2', expanded: false });

let ch2Active = false;
fCh2.addButton({ title: 'CH2 ON / OFF' }).on('click', () => {
  ch2Active = !ch2Active;
  renderer.setChannelVisible(2, ch2Active);
  renderer.signal2 = ch2Active ? buildSignal(ch2Signal) : null;
});

fCh2.addBinding(ch2Signal, 'type', {
  label: 'Tipo señal',
  options: { Senoidal: 'sine', Cuadrada: 'square', 'Circuito RC': 'rc' },
}).on('change', () => {
  updateCh2ParamVisibility();
  if (ch2Active) renderer.signal2 = buildSignal(ch2Signal);
});

const ch2SineSquareParams = [
  fCh2.addBinding(ch2Signal.sine, 'amplitude', { min: 0.1, max: 10, step: 0.1, label: 'Amplitud (V)' })
    .on('change', () => { if (ch2Active && ch2Signal.type !== 'rc') renderer.signal2 = buildSignal(ch2Signal); }),
  fCh2.addBinding(ch2Signal.sine, 'frequency', { min: 1, max: 100000, step: 1, label: 'Frecuencia (Hz)' })
    .on('change', () => { if (ch2Active && ch2Signal.type !== 'rc') renderer.signal2 = buildSignal(ch2Signal); }),
  fCh2.addBinding(ch2Signal.sine, 'phase', { min: -Math.PI, max: Math.PI, step: 0.01, label: 'Fase (rad)' })
    .on('change', () => { if (ch2Active && ch2Signal.type !== 'rc') renderer.signal2 = buildSignal(ch2Signal); }),
  fCh2.addBinding(ch2Signal.sine, 'offset', { min: -5, max: 5, step: 0.1, label: 'Offset DC (V)' })
    .on('change', () => { if (ch2Active && ch2Signal.type !== 'rc') renderer.signal2 = buildSignal(ch2Signal); }),
];

const ch2DutyBind = fCh2.addBinding(ch2Signal.square, 'dutyCycle', { min: 0.05, max: 0.95, step: 0.05, label: 'Ciclo trabajo' })
  .on('change', () => { if (ch2Active && ch2Signal.type === 'square') renderer.signal2 = buildSignal(ch2Signal); });

const ch2RcParams = [
  fCh2.addBinding(ch2Signal.rc, 'amplitude', { min: 0.1, max: 10, step: 0.1, label: 'Amplitud entrada (V)' })
    .on('change', () => { if (ch2Active && ch2Signal.type === 'rc') renderer.signal2 = buildSignal(ch2Signal); }),
  fCh2.addBinding(ch2Signal.rc, 'frequency', { min: 1, max: 50000, step: 1, label: 'Frecuencia (Hz)' })
    .on('change', () => { if (ch2Active && ch2Signal.type === 'rc') renderer.signal2 = buildSignal(ch2Signal); }),
  fCh2.addBinding(ch2Signal.rc, 'dutyCycle', { min: 0.05, max: 0.95, step: 0.05, label: 'Ciclo trabajo' })
    .on('change', () => { if (ch2Active && ch2Signal.type === 'rc') renderer.signal2 = buildSignal(ch2Signal); }),
  fCh2.addBinding(ch2Signal.rc, 'offset', { min: -5, max: 5, step: 0.1, label: 'Offset DC (V)' })
    .on('change', () => { if (ch2Active && ch2Signal.type === 'rc') renderer.signal2 = buildSignal(ch2Signal); }),
];

const ch2TauProxy = { tau_us: ch2Signal.rc.tau * 1e6 };
const ch2TauBind = fCh2.addBinding(ch2TauProxy, 'tau_us', { min: 1, max: 100000, step: 1, label: 'τ = RC (µs)' })
  .on('change', ({ value }) => {
    ch2Signal.rc.tau = value * 1e-6;
    if (ch2Active && ch2Signal.type === 'rc') renderer.signal2 = buildSignal(ch2Signal);
  });
ch2RcParams.push(ch2TauBind);

function updateCh2ParamVisibility() {
  const isRC = ch2Signal.type === 'rc';
  const isSquare = ch2Signal.type === 'square';
  ch2SineSquareParams.forEach(b => { b.hidden = isRC; });
  ch2DutyBind.hidden = !isSquare;
  ch2RcParams.forEach(b => { b.hidden = !isRC; });
}
updateCh2ParamVisibility();

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL DERECHO — controles del osciloscopio
// ═══════════════════════════════════════════════════════════════════════════════

const pane = new Pane({
  container: document.getElementById('tweakpane-host'),
  title: 'Osciloscopio',
});

// ── Adquisición ────────────────────────────────────────────────────────────────

const fCtrl = pane.addFolder({ title: 'Adquisición', expanded: true });
fCtrl.addButton({ title: '▶ RUN / ■ STOP' }).on('click', () => renderer.toggleRunning());

// ── Vertical ───────────────────────────────────────────────────────────────────

const fVert = pane.addFolder({ title: 'Vertical', expanded: true });

fVert.addButton({ title: 'CH1 VOLTS/DIV ▲' }).on('click', () => {
  ch1VIdx = clampIdx(ch1VIdx + 1, VOLTS_STEPS);
  renderer.ch1VoltsPerDiv = VOLTS_STEPS[ch1VIdx];
});
fVert.addButton({ title: 'CH1 VOLTS/DIV ▼' }).on('click', () => {
  ch1VIdx = clampIdx(ch1VIdx - 1, VOLTS_STEPS);
  renderer.ch1VoltsPerDiv = VOLTS_STEPS[ch1VIdx];
});
fVert.addButton({ title: 'CH2 VOLTS/DIV ▲' }).on('click', () => {
  ch2VIdx = clampIdx(ch2VIdx + 1, VOLTS_STEPS);
  renderer.ch2VoltsPerDiv = VOLTS_STEPS[ch2VIdx];
});
fVert.addButton({ title: 'CH2 VOLTS/DIV ▼' }).on('click', () => {
  ch2VIdx = clampIdx(ch2VIdx - 1, VOLTS_STEPS);
  renderer.ch2VoltsPerDiv = VOLTS_STEPS[ch2VIdx];
});

fVert.addBinding(posTrack, 'ch1', { min: -5, max: 5, step: 0.1, label: 'POS CH1 (div)' })
  .on('change', ({ value }) => {
    const delta = value - posTrack._prevCh1;
    posTrack._prevCh1 = value;
    renderer.adjustVerticalPosition(1, delta);
  });
fVert.addBinding(posTrack, 'ch2', { min: -5, max: 5, step: 0.1, label: 'POS CH2 (div)' })
  .on('change', ({ value }) => {
    const delta = value - posTrack._prevCh2;
    posTrack._prevCh2 = value;
    renderer.adjustVerticalPosition(2, delta);
  });

// ── Horizontal ─────────────────────────────────────────────────────────────────

const fHoriz = pane.addFolder({ title: 'Horizontal', expanded: true });

fHoriz.addButton({ title: 'SEC/DIV ▲ (más lento)' }).on('click', () => {
  timIdx = clampIdx(timIdx + 1, TIME_STEPS);
  renderer.timePerDiv = TIME_STEPS[timIdx];
});
fHoriz.addButton({ title: 'SEC/DIV ▼ (más rápido)' }).on('click', () => {
  timIdx = clampIdx(timIdx - 1, TIME_STEPS);
  renderer.timePerDiv = TIME_STEPS[timIdx];
});

const hPosParams = { pos: 0 };
fHoriz.addBinding(hPosParams, 'pos', { min: -0.1, max: 0.1, step: 0.001, label: 'H. Pos (s)' })
  .on('change', () => { renderer.horizontalPosition = hPosParams.pos; });

// ── Trigger ────────────────────────────────────────────────────────────────────

const fTrig = pane.addFolder({ title: 'Trigger', expanded: true });

const trigLevelParams = { level: 0 };
fTrig.addBinding(trigLevelParams, 'level', { min: -5, max: 5, step: 0.05, label: 'Nivel (V)' })
  .on('change', () => { renderer.triggerLevel = trigLevelParams.level; });

const driftParams = { speed: 2 };
fTrig.addBinding(driftParams, 'speed', { min: 0, max: 10, step: 0.1, label: 'Drift (sin trigger)' })
  .on('change', () => { renderer.driftSpeed = driftParams.speed; });

// ── Menús del osciloscopio ─────────────────────────────────────────────────────

const fMenus = pane.addFolder({ title: 'Menús', expanded: true });
fMenus.addButton({ title: 'CH 1 MENU' }).on('click', () => renderer.openMenu('ch1'));
fMenus.addButton({ title: 'CH 2 MENU' }).on('click', () => renderer.openMenu('ch2'));
fMenus.addButton({ title: 'MENÚ DISPARO' }).on('click', () => renderer.openMenu('trigger'));
fMenus.addButton({ title: 'CURSORES' }).on('click', () => renderer.openMenu('cursors'));
fMenus.addButton({ title: 'Cerrar menú' }).on('click', () => renderer.closeMenu());

// ── Botones biselados F1–F5 ────────────────────────────────────────────────────

const fBevel = pane.addFolder({ title: 'Botones Biselados (F1–F5)', expanded: true });
fBevel.addButton({ title: 'F1 (superior)' }).on('click', () => renderer.pressBevelButton(0));
fBevel.addButton({ title: 'F2' }).on('click', () => renderer.pressBevelButton(1));
fBevel.addButton({ title: 'F3' }).on('click', () => renderer.pressBevelButton(2));
fBevel.addButton({ title: 'F4' }).on('click', () => renderer.pressBevelButton(3));
fBevel.addButton({ title: 'F5 (inferior)' }).on('click', () => renderer.pressBevelButton(4));

// ── Apariencia ─────────────────────────────────────────────────────────────────

const fApp = pane.addFolder({ title: 'Apariencia', expanded: false });
const appParams = { showSubdivisions: true, lineWidth: 1.8, width: 640, height: 512 };

fApp.addBinding(appParams, 'showSubdivisions', { label: 'Subdivisiones' })
  .on('change', () => { renderer.showSubdivisions = appParams.showSubdivisions; });
fApp.addBinding(appParams, 'lineWidth', { min: 0.5, max: 5, step: 0.1, label: 'Grosor línea' })
  .on('change', () => { renderer.lineWidth = appParams.lineWidth; });
fApp.addBinding(appParams, 'width', { min: 320, max: 1280, step: 20, label: 'Ancho (px)' })
  .on('change', () => { renderer.resize(appParams.width, appParams.height); });
fApp.addBinding(appParams, 'height', { min: 240, max: 1024, step: 20, label: 'Alto (px)' })
  .on('change', () => { renderer.resize(appParams.width, appParams.height); });

// ── Loop de animación ──────────────────────────────────────────────────────────

function loop(time) {
  renderer.render(time / 1000);
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
