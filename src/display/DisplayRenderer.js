import { DivisionCoordinates } from './DivisionCoordinates.js';
import { StaticLayer } from './layers/StaticLayer.js';
import { DynamicLayer } from './layers/DynamicLayer.js';
import { MenuLayer } from './layers/MenuLayer.js';
import { OscilloscopeState } from './OscilloscopeState.js';
import { TriggerEngine } from './TriggerEngine.js';

const MARGINS = { top: 24, bottom: 28, left: 28, right: 36 };
const MENU_PANEL_WIDTH = 120;

// Tabla de posición horizontal máxima según timePerDiv (spec §1.3)
function _hposLimit(timePerDiv) {
  if (timePerDiv <= 10e-9)  return Math.max(4 * timePerDiv, 20e-3);
  if (timePerDiv < 0.25)    return Math.max(4 * timePerDiv, 50e-3);
  return Math.max(4 * timePerDiv, 50);
}

// ─── Definición de los cuatro menús del osciloscopio ──────────────────────────

const MENU_DEFINITIONS = {
  ch1: {
    title: 'CH1',
    items: [
      { key: 'coupling',  label: 'Acoplamiento',      type: 'radio', options: ['CC', 'CA', 'GND'] },
      { key: 'bwLimit',   label: 'Limitar\nAncho Banda', type: 'radio', options: ['NO', 'SI'] },
      { key: 'voltsGain', label: 'Voltios/Div',        type: 'radio', options: ['Gruesa', 'Fina'] },
      { key: 'probe',     label: 'Sonda',               type: 'cycle', options: ['1X', '10X', '100X', '1000X'] },
      { key: 'invert',    label: 'Invertir',            type: 'radio', options: ['NO', 'SI'] },
    ],
    defaultState: { coupling: 'CC', bwLimit: 'NO', voltsGain: 'Gruesa', probe: '1X', invert: 'NO' },
  },

  ch2: {
    title: 'CH2',
    items: [
      { key: 'coupling',  label: 'Acoplamiento',      type: 'radio', options: ['CC', 'CA', 'GND'] },
      { key: 'bwLimit',   label: 'Limitar\nAncho Banda', type: 'radio', options: ['NO', 'SI'] },
      { key: 'voltsGain', label: 'Voltios/Div',        type: 'radio', options: ['Gruesa', 'Fina'] },
      { key: 'probe',     label: 'Sonda',               type: 'cycle', options: ['1X', '10X', '100X', '1000X'] },
      { key: 'invert',    label: 'Invertir',            type: 'radio', options: ['NO', 'SI'] },
    ],
    defaultState: { coupling: 'CC', bwLimit: 'NO', voltsGain: 'Gruesa', probe: '1X', invert: 'NO' },
  },

  trigger: {
    title: 'Menú Disparo',
    items: [
      { key: 'type',     label: 'Tipo',         type: 'page',  labelA: 'Flanco', labelB: 'Vídeo' },
      { key: 'slope',    label: 'Pendiente',    type: 'radio', options: ['Subida', 'Bajada'] },
      { key: 'source',   label: 'Fuente',       type: 'cycle', options: ['CH1', 'CH2', 'Ext', 'Ext/5', 'Red'] },
      { key: 'mode',     label: 'Modo',         type: 'radio', options: ['Auto', 'Normal', 'Único'] },
      { key: 'coupling', label: 'Acoplamiento', type: 'cycle', options: ['CC', 'CA', 'Rec. Ruido', 'Rec. AF', 'Rec. BF'] },
    ],
    defaultState: { type: 'A', slope: 'Subida', source: 'CH1', mode: 'Auto', coupling: 'CC' },
  },

  cursors: {
    title: 'Cursores',
    items: [
      { key: 'type',    label: 'Tipo',     type: 'cycle',  options: ['Sin', 'Voltaje', 'Tiempo'] },
      { key: 'source',  label: 'Fuente',   type: 'cycle',  options: ['CH1', 'CH2'] },
      { key: 'delta',   label: 'Delta',    type: 'action' },
      { key: 'cursor1', label: 'Cursor 1', type: 'action' },
      { key: 'cursor2', label: 'Cursor 2', type: 'action' },
    ],
    defaultState: { type: 'Sin', source: 'CH1', delta: null, cursor1: null, cursor2: null },
  },
};

// Keys de menú ch1/ch2 que, si cambian con running=false, marcan accuracyUncertain
const ACCURACY_KEYS = new Set(['coupling', 'invert']);
// Keys de menú trigger que invalidan precisión
const TRIGGER_ACCURACY_KEYS = new Set(['slope', 'type']);

export class DisplayRenderer {
  constructor({ width = 640, height = 512, divisionsX = 10, divisionsY = 8 } = {}) {
    this._width = width;
    this._height = height;
    this._divisionsX = divisionsX;
    this._divisionsY = divisionsY;

    this._state = new OscilloscopeState();
    this._triggerEngine = new TriggerEngine();
    this._prevDriftOffset = 0;

    this._lineWidth = 1.5;
    this._showSubdivisions = true;
    this._powered = true;

    // ── Estado de menús ────────────────────────────────────────────────────
    this._activeMenu = null;
    this._menuState = {
      ch1:     { ...MENU_DEFINITIONS.ch1.defaultState },
      ch2:     { ...MENU_DEFINITIONS.ch2.defaultState },
      trigger: { ...MENU_DEFINITIONS.trigger.defaultState },
      cursors: { ...MENU_DEFINITIONS.cursors.defaultState },
    };
    this._menuDirty = true;

    this.canvas = document.createElement('canvas');
    this._staticCanvas  = document.createElement('canvas');
    this._dynamicCanvas = document.createElement('canvas');
    this._menuCanvas    = document.createElement('canvas');
    this._ctx = this.canvas.getContext('2d');

    this._staticLayer  = new StaticLayer(this._staticCanvas);
    this._dynamicLayer = new DynamicLayer(this._dynamicCanvas);
    this._menuLayer    = new MenuLayer(this._menuCanvas);

    this._staticDirty    = true;
    this._dynamicDirty   = true;
    this._compositeDirty = true;

    this._applySize();
  }

  _applySize() {
    for (const c of [this.canvas, this._staticCanvas, this._dynamicCanvas, this._menuCanvas]) {
      c.width  = this._width;
      c.height = this._height;
    }
    this._coords = new DivisionCoordinates({
      width:         this._width,
      height:        this._height,
      divisionsX:    this._divisionsX,
      divisionsY:    this._divisionsY,
      marginTop:     MARGINS.top,
      marginBottom:  MARGINS.bottom,
      marginLeft:    MARGINS.left,
      marginRight:   MARGINS.right + MENU_PANEL_WIDTH,
    });
  }

  resize(width, height) {
    if (width === this._width && height === this._height) return;
    this._width = width; this._height = height;
    this._applySize();
    this.invalidateAll();
  }

  invalidateStatic()    { this._staticDirty    = true; this._compositeDirty = true; }
  invalidateDynamic()   { this._dynamicDirty   = true; this._compositeDirty = true; }
  invalidateMenu()      { this._menuDirty      = true; this._compositeDirty = true; }
  invalidateAll()       { this._staticDirty = true; this._dynamicDirty = true; this._menuDirty = true; this._compositeDirty = true; }

  // ── Getters / setters de señales ──────────────────────────────────────────

  get signal()  { return this._state.signal1; }
  set signal(s) { this.signal1 = s; }

  get signal1() { return this._state.signal1; }
  set signal1(s) {
    this._state.signal1 = s;
    this.invalidateDynamic();
  }

  get signal2() { return this._state.signal2; }
  set signal2(s) {
    this._state.signal2 = s;
    this.invalidateDynamic();
  }

  // ── Adquisición ───────────────────────────────────────────────────────────

  get running() { return this._state.running; }
  set running(v) {
    if (v === this._state.running) return;
    this._state.running = v;
    if (v) {
      this._state.accuracyUncertain = false;
      this._triggerEngine.resetSingle();
    }
    this.invalidateDynamic();
  }

  toggleRunning() { this.running = !this._state.running; }

  // ── Escala vertical ───────────────────────────────────────────────────────

  get voltsPerDiv()  { return this._state.ch[1].voltsPerDiv; }
  set voltsPerDiv(v) { this.ch1VoltsPerDiv = v; }

  get ch1VoltsPerDiv() { return this._state.ch[1].voltsPerDiv; }
  set ch1VoltsPerDiv(v) {
    if (v === this._state.ch[1].voltsPerDiv) return;
    this._state.ch[1].voltsPerDiv = v;
    this.invalidateStatic(); this.invalidateDynamic();
  }

  get ch2VoltsPerDiv() { return this._state.ch[2].voltsPerDiv; }
  set ch2VoltsPerDiv(v) {
    if (v === this._state.ch[2].voltsPerDiv) return;
    this._state.ch[2].voltsPerDiv = v;
    this.invalidateStatic(); this.invalidateDynamic();
  }

  /**
   * Mueve la posición vertical de un canal o el cursor correspondiente
   * si el menú de cursores está abierto y hay cursores activos.
   * @param {1|2} ch
   * @param {number} delta — divisiones
   */
  adjustVerticalPosition(ch, delta) {
    if (this._activeMenu === 'cursors' && this._state.cursors.type !== 'Sin') {
      const key = ch === 1 ? 'cursor1Pos' : 'cursor2Pos';
      this._state.cursors[key] += delta;
      this.invalidateDynamic(); this.invalidateMenu();
    } else {
      this._state.ch[ch].verticalPosition += delta;
      this.invalidateDynamic();
    }
  }

  get verticalOffset()  { return this._state.ch[1].verticalPosition; }
  set verticalOffset(v) {
    if (v === this._state.ch[1].verticalPosition) return;
    this._state.ch[1].verticalPosition = v;
    this.invalidateDynamic();
  }

  // ── Escala y posición horizontal ──────────────────────────────────────────

  get timePerDiv() { return this._state.timePerDiv; }
  set timePerDiv(v) {
    if (v === this._state.timePerDiv) return;
    this._state.timePerDiv = v;
    this.invalidateStatic(); this.invalidateDynamic();
  }

  get horizontalPosition() { return this._state.horizontalPosition; }
  set horizontalPosition(v) {
    const limit = _hposLimit(this._state.timePerDiv);
    const clamped = Math.max(-limit, Math.min(limit, v));
    if (clamped === this._state.horizontalPosition) return;
    this._state.horizontalPosition = clamped;
    this.invalidateDynamic();
  }

  get horizontalOffset()  { return this._state.horizontalPosition; }
  set horizontalOffset(v) { this.horizontalPosition = v; }

  // ── Trigger ───────────────────────────────────────────────────────────────

  get triggerLevel() { return this._state.trigger.level; }
  set triggerLevel(v) {
    if (v === this._state.trigger.level) return;
    this._state.trigger.level = v;
    if (!this._state.running) this._state.accuracyUncertain = true;
    this.invalidateDynamic();
  }

  // ── Drift (para testbench) ────────────────────────────────────────────────

  get driftSpeed() { return this._state.driftSpeed; }
  set driftSpeed(v) { this._state.driftSpeed = v; }

  // ── Apariencia ────────────────────────────────────────────────────────────

  get lineWidth() { return this._lineWidth; }
  set lineWidth(v) { if (v !== this._lineWidth) { this._lineWidth = v; this.invalidateDynamic(); } }

  get showSubdivisions() { return this._showSubdivisions; }
  set showSubdivisions(v) { if (v !== this._showSubdivisions) { this._showSubdivisions = v; this.invalidateStatic(); } }

  get powered() { return this._powered; }
  set powered(v) {
    if (v === this._powered) return;
    this._powered = v;
    this.invalidateAll();
  }

  // ── Dimensiones ───────────────────────────────────────────────────────────

  get width()        { return this._width; }
  get height()       { return this._height; }
  get menuPanelWidth() { return MENU_PANEL_WIDTH; }
  get menuPanelX()   { return this._width - MENU_PANEL_WIDTH; }
  get activeMenu()   { return this._activeMenu; }

  // ── Estado interno expuesto (para testbench) ──────────────────────────────

  get state() { return this._state; }

  // ── API de menús ──────────────────────────────────────────────────────────

  openMenu(menuName) {
    this._activeMenu = this._activeMenu === menuName ? null : menuName;
    this.invalidateMenu();
  }

  closeMenu() {
    if (this._activeMenu !== null) { this._activeMenu = null; this.invalidateMenu(); }
  }

  pressBevelButton(n) {
    if (!this._activeMenu) return;
    const def = MENU_DEFINITIONS[this._activeMenu];
    if (!def || n < 0 || n >= def.items.length) return;

    const item  = def.items[n];
    const state = this._menuState[this._activeMenu];
    const prev  = state[item.key];

    if (item.type === 'cycle' || item.type === 'radio') {
      const opts = item.options;
      state[item.key] = opts[(opts.indexOf(prev) + 1) % opts.length];
    } else if (item.type === 'page') {
      state[item.key] = prev === 'A' ? 'B' : 'A';
    }

    if (this._activeMenu === 'trigger' && item.key === 'mode' && state[item.key] !== prev) {
      this._triggerEngine.resetSingle();
    }

    // Marcar accuracyUncertain si es necesario
    if (!this._state.running) {
      if ((this._activeMenu === 'ch1' || this._activeMenu === 'ch2') && ACCURACY_KEYS.has(item.key)) {
        this._state.accuracyUncertain = true;
      }
      if (this._activeMenu === 'trigger' && TRIGGER_ACCURACY_KEYS.has(item.key)) {
        this._state.accuracyUncertain = true;
      }
    }

    this.invalidateMenu();
    this.invalidateDynamic();
    if (this._activeMenu === 'ch1' || this._activeMenu === 'ch2') this.invalidateStatic();
  }

  getMenuState(menuName) {
    return { ...this._menuState[menuName] };
  }

  // ── Cursor positions (movidas desde adjustVerticalPosition) ───────────────

  setCursorPos(cursorN, pos) {
    const key = cursorN === 1 ? 'cursor1Pos' : 'cursor2Pos';
    this._state.cursors[key] = pos;
    this.invalidateDynamic(); this.invalidateMenu();
  }

  // ── Visibilidad de canales ────────────────────────────────────────────────

  setChannelVisible(ch, visible) {
    this._state.ch[ch].visible = visible;
    this.invalidateStatic(); this.invalidateDynamic();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  render(now = performance.now() / 1000) {
    if (!this._powered) {
      this._ctx.clearRect(0, 0, this._width, this._height);
      this._ctx.fillStyle = '#FFFFFF';
      this._ctx.fillRect(0, 0, this._width, this._height);
      this._compositeDirty = false;
      return;
    }
    // 1. Sincronizar menuState → OscilloscopeState
    this._state.syncFromMenuState(this._menuState);

    // 2. Motor de trigger
    const { driftOffset, triggerStatus } =
      this._triggerEngine.update(now, this._state, this._divisionsX);

    if (driftOffset !== this._prevDriftOffset) {
      this._prevDriftOffset = driftOffset;
      this.invalidateDynamic();
    }

    // 3. Capas
    if (this._staticDirty) {
      this._staticLayer.draw({
        coords:           this._coords,
        state:            this._state,
        showSubdivisions: this._showSubdivisions,
        menuPanelWidth:   MENU_PANEL_WIDTH,
      });
      this._staticDirty = false;
    }

    if (this._dynamicDirty) {
      this._dynamicLayer.draw({
        coords:        this._coords,
        state:         this._state,
        driftOffset,
        triggerStatus,
        lineWidth:     this._lineWidth,
      });
      this._dynamicDirty = false;
    }

    if (this._menuDirty) {
      const def             = this._activeMenu ? MENU_DEFINITIONS[this._activeMenu] : null;
      const menuState       = this._activeMenu ? this._menuState[this._activeMenu] : null;
      const actionOverrides = this._calcCursorOverrides();
      this._menuLayer.draw({
        width:          this._width,
        height:         this._height,
        panelX:         this._width - MENU_PANEL_WIDTH,
        panelWidth:     MENU_PANEL_WIDTH,
        activeMenu:     this._activeMenu,
        menuDef:        def,
        menuState,
        actionOverrides,
      });
      this._menuDirty = false;
    }

    if (this._compositeDirty) {
      this._ctx.clearRect(0, 0, this._width, this._height);
      this._ctx.drawImage(this._staticCanvas,  0, 0);
      this._ctx.drawImage(this._dynamicCanvas, 0, 0);
      this._ctx.drawImage(this._menuCanvas,    0, 0);
      this._compositeDirty = false;
    }
  }

  // ── Helpers privados ──────────────────────────────────────────────────────

  _calcCursorOverrides() {
    const { cursors, ch, timePerDiv, horizontalPosition } = this._state;
    if (cursors.type === 'Sin') return {};

    const srcCh = cursors.source === 'CH2' ? ch[2] : ch[1];
    const { cursor1Pos, cursor2Pos } = cursors;

    if (cursors.type === 'Voltaje') {
      const v1 = (cursor1Pos - srcCh.verticalPosition) * srcCh.voltsPerDiv;
      const v2 = (cursor2Pos - srcCh.verticalPosition) * srcCh.voltsPerDiv;
      return {
        cursor1: _fmtV(v1),
        cursor2: _fmtV(v2),
        delta:   _fmtV(Math.abs(v1 - v2)),
      };
    }

    if (cursors.type === 'Tiempo') {
      const t1 = cursor1Pos * timePerDiv - horizontalPosition;
      const t2 = cursor2Pos * timePerDiv - horizontalPosition;
      const dt = Math.abs(t1 - t2);
      return {
        cursor1: _fmtT(t1),
        cursor2: _fmtT(t2),
        delta:   dt > 0 ? `${_fmtT(dt)}/${_fmtHz(1 / dt)}` : '—',
      };
    }

    return {};
  }
}

// ── Formatters compartidos ─────────────────────────────────────────────────────

function _fmtV(v) {
  const a = Math.abs(v), s = v < 0 ? '-' : '';
  if (a >= 1)    return `${s}${_r(a)}V`;
  if (a >= 1e-3) return `${s}${_r(a * 1e3)}mV`;
  return `${s}${_r(a * 1e6)}uV`;
}

function _fmtT(s) {
  const a = Math.abs(s), sg = s < 0 ? '-' : '';
  if (a >= 1)    return `${sg}${_r(a)}s`;
  if (a >= 1e-3) return `${sg}${_r(a * 1e3)}ms`;
  if (a >= 1e-6) return `${sg}${_r(a * 1e6)}us`;
  return `${sg}${_r(a * 1e9)}ns`;
}

function _fmtHz(f) {
  if (f >= 1e6) return `${_r(f / 1e6)}MHz`;
  if (f >= 1e3) return `${_r(f / 1e3)}kHz`;
  return `${_r(f)}Hz`;
}

function _r(n) {
  const x = Math.round(n * 100) / 100;
  return x.toString();
}
