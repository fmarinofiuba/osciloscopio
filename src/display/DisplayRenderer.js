import { DivisionCoordinates } from './DivisionCoordinates.js';
import { StaticLayer } from './layers/StaticLayer.js';
import { DynamicLayer } from './layers/DynamicLayer.js';
import { MenuLayer } from './layers/MenuLayer.js';

const MARGINS = { top: 24, bottom: 28, left: 28, right: 36 };
const MENU_PANEL_WIDTH = 120;

// ─── Definición de los cuatro menús del osciloscopio ──────────────────────────

const MENU_DEFINITIONS = {
  ch1: {
    title: 'CH1',
    items: [
      { key: 'coupling',   label: 'Acoplamiento', type: 'radio',  options: ['CC', 'CA', 'GND'] },
      { key: 'bwLimit',    label: 'Limitar\nAncho Banda', type: 'radio',  options: ['NO', 'SI'] },
      { key: 'voltsGain',  label: 'Voltios/Div',  type: 'radio',  options: ['Gruesa', 'Fina'] },
      { key: 'probe',      label: 'Sonda',         type: 'cycle',  options: ['1X', '10X', '100X', '1000X'] },
      { key: 'invert',     label: 'Invertir',      type: 'radio',  options: ['NO', 'SI'] },
    ],
    defaultState: {
      coupling: 'CC',
      bwLimit:  'NO',
      voltsGain: 'Gruesa',
      probe:    '1X',
      invert:   'NO',
    },
  },

  ch2: {
    title: 'CH2',
    items: [
      { key: 'coupling',   label: 'Acoplamiento', type: 'radio',  options: ['CC', 'CA', 'GND'] },
      { key: 'bwLimit',    label: 'Limitar\nAncho Banda', type: 'radio',  options: ['NO', 'SI'] },
      { key: 'voltsGain',  label: 'Voltios/Div',  type: 'radio',  options: ['Gruesa', 'Fina'] },
      { key: 'probe',      label: 'Sonda',         type: 'cycle',  options: ['1X', '10X', '100X', '1000X'] },
      { key: 'invert',     label: 'Invertir',      type: 'radio',  options: ['NO', 'SI'] },
    ],
    defaultState: {
      coupling: 'CC',
      bwLimit:  'NO',
      voltsGain: 'Gruesa',
      probe:    '1X',
      invert:   'NO',
    },
  },

  trigger: {
    title: 'Menú Disparo',
    items: [
      { key: 'type',      label: 'Tipo',        type: 'page',  labelA: 'Flanco', labelB: 'Vídeo' },
      { key: 'slope',     label: 'Pendiente',   type: 'radio', options: ['Subida', 'Bajada'] },
      { key: 'source',    label: 'Fuente',      type: 'cycle', options: ['CH1', 'CH2', 'Ext', 'Ext/5', 'Red'] },
      { key: 'mode',      label: 'Modo',        type: 'radio', options: ['Auto', 'Normal', 'Único'] },
      { key: 'coupling',  label: 'Acoplamiento',type: 'cycle', options: ['CC', 'CA', 'Rec. Ruido', 'Rec. AF', 'Rec. BF'] },
    ],
    defaultState: {
      type:     'A',
      slope:    'Subida',
      source:   'CH1',
      mode:     'Auto',
      coupling: 'CC',
    },
  },

  cursors: {
    title: 'Cursores',
    items: [
      { key: 'type',    label: 'Tipo',    type: 'cycle', options: ['Sin', 'Voltaje', 'Tiempo'] },
      { key: 'source',  label: 'Fuente',  type: 'cycle', options: ['CH1', 'CH2'] },
      { key: 'delta',   label: 'Delta',   type: 'action' },
      { key: 'cursor1', label: 'Cursor 1', type: 'action' },
      { key: 'cursor2', label: 'Cursor 2', type: 'action' },
    ],
    defaultState: {
      type:    'Sin',
      source:  'CH1',
      delta:   null,
      cursor1: null,
      cursor2: null,
    },
  },
};

export class DisplayRenderer {
  constructor({ width = 640, height = 512, divisionsX = 10, divisionsY = 8 } = {}) {
    this._width = width;
    this._height = height;
    this._divisionsX = divisionsX;
    this._divisionsY = divisionsY;

    this._voltsPerDiv = 1;
    this._timePerDiv = 1e-3;
    this._verticalOffset = 0;
    this._horizontalOffset = 0;
    this._triggerLevel = 0;
    this._driftSpeed = 2;
    this._signal = null;
    this._lineWidth = 1.5;
    this._showSubdivisions = true;

    this._driftOffset = 0;
    this._lastDriftTime = null;

    // ── Estado de menús ─────────────────────────────────────────────────────
    this._activeMenu = null;       // clave del menú activo ('ch1'|'ch2'|'trigger'|'cursors'|null)
    this._menuState = {
      ch1:     { ...MENU_DEFINITIONS.ch1.defaultState },
      ch2:     { ...MENU_DEFINITIONS.ch2.defaultState },
      trigger: { ...MENU_DEFINITIONS.trigger.defaultState },
      cursors: { ...MENU_DEFINITIONS.cursors.defaultState },
    };
    this._menuDirty = true;

    this.canvas = document.createElement('canvas');
    this._staticCanvas = document.createElement('canvas');
    this._dynamicCanvas = document.createElement('canvas');
    this._menuCanvas = document.createElement('canvas');
    this._ctx = this.canvas.getContext('2d');

    this._staticLayer = new StaticLayer(this._staticCanvas);
    this._dynamicLayer = new DynamicLayer(this._dynamicCanvas);
    this._menuLayer = new MenuLayer(this._menuCanvas);

    this._staticDirty = true;
    this._dynamicDirty = true;
    this._compositeDirty = true;

    this._applySize();
  }

  _applySize() {
    this.canvas.width = this._width;
    this.canvas.height = this._height;
    this._staticCanvas.width = this._width;
    this._staticCanvas.height = this._height;
    this._dynamicCanvas.width = this._width;
    this._dynamicCanvas.height = this._height;
    this._menuCanvas.width = this._width;
    this._menuCanvas.height = this._height;
    this._coords = new DivisionCoordinates({
      width: this._width,
      height: this._height,
      divisionsX: this._divisionsX,
      divisionsY: this._divisionsY,
      marginTop: MARGINS.top,
      marginBottom: MARGINS.bottom,
      marginLeft: MARGINS.left,
      marginRight: MARGINS.right + MENU_PANEL_WIDTH,
    });
  }

  resize(width, height) {
    if (width === this._width && height === this._height) return;
    this._width = width;
    this._height = height;
    this._applySize();
    this.invalidateAll();
  }

  invalidateStatic() { this._staticDirty = true; this._compositeDirty = true; }
  invalidateDynamic() { this._dynamicDirty = true; this._compositeDirty = true; }
  invalidateMenu() { this._menuDirty = true; this._compositeDirty = true; }
  invalidateAll() { this._staticDirty = true; this._dynamicDirty = true; this._menuDirty = true; this._compositeDirty = true; }

  get voltsPerDiv() { return this._voltsPerDiv; }
  set voltsPerDiv(v) { if (v !== this._voltsPerDiv) { this._voltsPerDiv = v; this.invalidateStatic(); this.invalidateDynamic(); } }

  get timePerDiv() { return this._timePerDiv; }
  set timePerDiv(v) { if (v !== this._timePerDiv) { this._timePerDiv = v; this.invalidateStatic(); this.invalidateDynamic(); } }

  get verticalOffset() { return this._verticalOffset; }
  set verticalOffset(v) { if (v !== this._verticalOffset) { this._verticalOffset = v; this.invalidateDynamic(); } }

  get horizontalOffset() { return this._horizontalOffset; }
  set horizontalOffset(v) { if (v !== this._horizontalOffset) { this._horizontalOffset = v; this.invalidateDynamic(); } }

  get triggerLevel() { return this._triggerLevel; }
  set triggerLevel(v) { if (v !== this._triggerLevel) { this._triggerLevel = v; this.invalidateDynamic(); } }

  get driftSpeed() { return this._driftSpeed; }
  set driftSpeed(v) { this._driftSpeed = v; }

  get signal() { return this._signal; }
  set signal(s) { this._signal = s; this.invalidateDynamic(); }

  get lineWidth() { return this._lineWidth; }
  set lineWidth(v) { if (v !== this._lineWidth) { this._lineWidth = v; this.invalidateDynamic(); } }

  get showSubdivisions() { return this._showSubdivisions; }
  set showSubdivisions(v) { if (v !== this._showSubdivisions) { this._showSubdivisions = v; this.invalidateStatic(); } }

  get width() { return this._width; }
  get height() { return this._height; }
  get menuPanelWidth() { return MENU_PANEL_WIDTH; }
  get menuPanelX() { return this._width - MENU_PANEL_WIDTH; }
  get activeMenu() { return this._activeMenu; }

  // ── API pública de menús ───────────────────────────────────────────────────

  /**
   * Abre el menú indicado. Si ya está abierto, lo cierra (toggle).
   * @param {'ch1'|'ch2'|'trigger'|'cursors'} menuName
   */
  openMenu(menuName) {
    if (this._activeMenu === menuName) {
      this._activeMenu = null;
    } else {
      this._activeMenu = menuName;
    }
    this.invalidateMenu();
  }

  /** Cierra el menú activo. */
  closeMenu() {
    if (this._activeMenu !== null) {
      this._activeMenu = null;
      this.invalidateMenu();
    }
  }

  /**
   * Simula la pulsación del botón biselado n (0-4) del panel lateral.
   * En listas circulares avanza al siguiente valor.
   * En radio selecciona la siguiente opción.
   * En page alterna entre sub-página A y B.
   * En action no hace nada (por ahora).
   * @param {number} n  Índice del botón (0 = primero arriba, 4 = último abajo)
   */
  pressBevelButton(n) {
    if (!this._activeMenu) return;
    const def = MENU_DEFINITIONS[this._activeMenu];
    if (!def || n < 0 || n >= def.items.length) return;

    const item = def.items[n];
    const state = this._menuState[this._activeMenu];
    const current = state[item.key];

    if (item.type === 'cycle' || item.type === 'radio') {
      const opts = item.options;
      const idx = opts.indexOf(current);
      state[item.key] = opts[(idx + 1) % opts.length];
    } else if (item.type === 'page') {
      state[item.key] = current === 'A' ? 'B' : 'A';
    }
    // 'action' no altera estado por ahora

    this.invalidateMenu();
  }

  /**
   * Devuelve el estado actual de un menú dado.
   * @param {'ch1'|'ch2'|'trigger'|'cursors'} menuName
   * @returns {object}
   */
  getMenuState(menuName) {
    return { ...this._menuState[menuName] };
  }

  _isTriggered() {
    if (!this._signal) return false;
    const [lo, hi] = this._signal.amplitudeRange;
    return this._triggerLevel >= lo && this._triggerLevel <= hi;
  }

  _findTriggerTime() {
    const signal = this._signal;
    if (!signal) return 0;
    const visibleSpan = this._divisionsX * this._timePerDiv;
    const samples = 256;
    const dt = visibleSpan / samples;
    let prev = signal.sample(-visibleSpan / 2);
    for (let i = 1; i <= samples; i++) {
      const t = -visibleSpan / 2 + i * dt;
      const cur = signal.sample(t);
      if (prev < this._triggerLevel && cur >= this._triggerLevel) {
        const frac = (this._triggerLevel - prev) / (cur - prev || 1);
        return t - dt + frac * dt;
      }
      prev = cur;
    }
    return 0;
  }

  render(now = performance.now() / 1000) {
    if (this._signal) {
      const triggered = this._isTriggered();
      if (triggered) {
        const tTrig = this._findTriggerTime();
        const newDriftOffset = -tTrig / this._timePerDiv;
        if (newDriftOffset !== this._driftOffset) {
          this._driftOffset = newDriftOffset;
          this.invalidateDynamic();
        }
        this._lastDriftTime = now;
      } else {
        const dt = this._lastDriftTime == null ? 0 : (now - this._lastDriftTime);
        this._lastDriftTime = now;
        const jitter = (Math.random() - 0.5) * 0.3;
        this._driftOffset += this._driftSpeed * dt + jitter * dt;
        this.invalidateDynamic();
      }
    }

    if (this._staticDirty) {
      this._staticLayer.draw({
        coords: this._coords,
        voltsPerDiv: this._voltsPerDiv,
        timePerDiv: this._timePerDiv,
        showSubdivisions: this._showSubdivisions,
        menuPanelWidth: MENU_PANEL_WIDTH,
      });
      this._staticDirty = false;
    }

    if (this._dynamicDirty) {
      const triggered = this._isTriggered();
      const triggerStatus = triggered ? 'triggered' : (this._signal ? 'auto' : 'armed');
      this._dynamicLayer.draw({
        coords: this._coords,
        signal: this._signal,
        voltsPerDiv: this._voltsPerDiv,
        timePerDiv: this._timePerDiv,
        verticalOffset: this._verticalOffset,
        horizontalOffset: this._horizontalOffset + this._driftOffset,
        triggerLevel: this._triggerLevel,
        triggerStatus,
        triggerMenuState: this._menuState.trigger,
        lineWidth: this._lineWidth,
      });
      this._dynamicDirty = false;
    }

    if (this._menuDirty) {
      const def = this._activeMenu ? MENU_DEFINITIONS[this._activeMenu] : null;
      const state = this._activeMenu ? this._menuState[this._activeMenu] : null;
      this._menuLayer.draw({
        width: this._width,
        height: this._height,
        panelX: this._width - MENU_PANEL_WIDTH,
        panelWidth: MENU_PANEL_WIDTH,
        activeMenu: this._activeMenu,
        menuDef: def,
        menuState: state,
      });
      this._menuDirty = false;
    }

    if (this._compositeDirty) {
      this._ctx.clearRect(0, 0, this._width, this._height);
      this._ctx.drawImage(this._staticCanvas, 0, 0);
      this._ctx.drawImage(this._dynamicCanvas, 0, 0);
      this._ctx.drawImage(this._menuCanvas, 0, 0);
      this._compositeDirty = false;
    }
  }
}
