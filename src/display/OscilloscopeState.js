export class OscilloscopeState {
  constructor() {
    this.running = true;
    this.accuracyUncertain = false;

    this.ch = {
      1: { visible: true,  voltsPerDiv: 1.0, verticalPosition: 0, coupling: 'CC', bwLimit: 'NO', voltsGain: 'Gruesa', probe: '1X', invert: 'NO' },
      2: { visible: false, voltsPerDiv: 1.0, verticalPosition: 0, coupling: 'CC', bwLimit: 'NO', voltsGain: 'Gruesa', probe: '1X', invert: 'NO' },
    };

    this.timePerDiv = 1e-3;
    this.horizontalPosition = 0;

    this.trigger = { source: 'CH1', type: 'A', slope: 'Subida', mode: 'Auto', coupling: 'CC', level: 0 };

    this.cursors = { type: 'Sin', source: 'CH1', cursor1Pos: -1, cursor2Pos: 1 };

    this.signal1 = null;
    this.signal2 = null;

    this.driftSpeed = 2;
  }

  get scanMode() {
    return this.timePerDiv >= 0.1 && this.trigger.mode === 'Auto';
  }

  syncFromMenuState(menuState) {
    const MENU_CH_KEYS = ['coupling', 'bwLimit', 'voltsGain', 'probe', 'invert'];
    for (const [n, key] of [[1, 'ch1'], [2, 'ch2']]) {
      const src = menuState[key];
      for (const k of MENU_CH_KEYS) {
        if (k in src) this.ch[n][k] = src[k];
      }
    }
    const t = menuState.trigger;
    for (const k of ['source', 'type', 'slope', 'mode', 'coupling']) {
      if (k in t) this.trigger[k] = t[k];
    }
    // Cursor type y source vienen del menú cursors
    const c = menuState.cursors;
    this.cursors.type   = c.type;
    this.cursors.source = c.source;
  }

  static probeFactorOf(probeStr) {
    return parseInt(probeStr) || 1;
  }
}
