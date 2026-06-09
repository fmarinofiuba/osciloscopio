const FONT = 'ui-monospace, "Courier New", monospace';

export class DynamicLayer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  /**
   * @param {{
   *   coords: DivisionCoordinates,
   *   state: OscilloscopeState,
   *   driftOffset: number,
   *   triggerStatus: string,
   *   lineWidth: number,
   * }} params
   */
  draw({ coords, state, driftOffset, triggerStatus, lineWidth }) {
    const ctx = this.ctx;
    const { width, height } = coords;
    ctx.clearRect(0, 0, width, height);

    this.#drawHeader(ctx, coords, state, triggerStatus);

    if (!state.scanMode) {
      this.#drawTriggerArrow(ctx, coords, state.trigger.level, state.ch[1].voltsPerDiv);
    }

    this.#drawFooter(ctx, coords, state, triggerStatus);

    const wfArgs = { coords, driftOffset, lineWidth, accuracyUncertain: state.accuracyUncertain, divisionsX: coords.divisionsX, timePerDiv: state.timePerDiv };

    // CH1
    if (state.ch[1].visible) {
      this.#drawGroundArrow(ctx, coords, 1, state.ch[1]);
      this.#drawWaveform(ctx, { ...wfArgs, ch: state.ch[1], signal: state.signal1 });
    }

    // CH2
    if (state.ch[2].visible) {
      this.#drawGroundArrow(ctx, coords, 2, state.ch[2]);
      this.#drawWaveform(ctx, { ...wfArgs, ch: state.ch[2], signal: state.signal2 });
    }

    // Cursores
    this.#drawCursors(ctx, coords, state);
  }

  // ── Waveform ─────────────────────────────────────────────────────────────

  #drawWaveform(ctx, { coords, ch, signal, driftOffset, lineWidth, accuracyUncertain, divisionsX, timePerDiv }) {
    const { gridLeft, gridTop, gridWidth, gridHeight, pxPerDivX, pxPerDivY, centerX, centerY } = coords;
    const { voltsPerDiv, verticalPosition, coupling, invert } = ch;

    // Función que devuelve la muestra en tiempo t, aplicando coupling e invert
    let sampleFn;
    if (coupling === 'GND') {
      sampleFn = () => 0;
    } else if (coupling === 'CA' && signal) {
      // Estimar DC offset: promedio de 64 samples en el span visible
      const span = divisionsX * timePerDiv;
      let sum = 0;
      const N = 64;
      for (let i = 0; i < N; i++) {
        sum += signal.sample(-span / 2 + (i / N) * span);
      }
      const dcOffset = sum / N;
      sampleFn = (t) => signal.sample(t) - dcOffset;
    } else if (signal) {
      sampleFn = (t) => signal.sample(t);
    } else {
      return; // sin señal y no es GND: nada que dibujar
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(gridLeft, gridTop, gridWidth, gridHeight);
    ctx.clip();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth   = lineWidth;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';
    if (accuracyUncertain) ctx.setLineDash([4, 4]);

    ctx.beginPath();
    const steps = Math.max(2, Math.floor(gridWidth));
    for (let i = 0; i <= steps; i++) {
      const px   = gridLeft + (i / steps) * gridWidth;
      const divX = (px - centerX) / pxPerDivX;
      const t    = (divX - driftOffset) * timePerDiv;
      let v      = sampleFn(t);
      if (invert === 'SI') v = -v;
      const divY = v / voltsPerDiv + verticalPosition;
      const py   = centerY - divY * pxPerDivY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    if (accuracyUncertain) ctx.setLineDash([]);
    ctx.restore();
  }

  // ── Marcador de tierra ────────────────────────────────────────────────────

  #drawGroundArrow(ctx, coords, n, ch) {
    const { gridLeft, gridTop, gridHeight, pxPerDivY, centerY } = coords;
    const py = centerY - ch.verticalPosition * pxPerDivY;
    if (py < gridTop || py > gridTop + gridHeight) return;
    ctx.fillStyle   = '#000000';
    ctx.font        = `16px ${FONT}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign   = 'right';
    ctx.fillText(`${n}▶`, gridLeft - 2, py);
  }

  // ── Flecha de nivel de trigger (ítem 5) ────────────────────────────────────

  #drawTriggerArrow(ctx, coords, triggerLevel, voltsPerDiv) {
    const { gridLeft, gridWidth, gridTop, gridHeight, pxPerDivY, centerY } = coords;
    const divY = triggerLevel / voltsPerDiv;
    const py   = centerY - divY * pxPerDivY;
    if (py < gridTop || py > gridTop + gridHeight) return;
    const x = gridLeft + gridWidth + 4;
    ctx.fillStyle    = '#000000';
    ctx.font         = `16px ${FONT}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'left';
    ctx.fillText('◀', x, py);
  }

  // ── Cursores ──────────────────────────────────────────────────────────────

  #drawCursors(ctx, coords, state) {
    const { cursors } = state;
    if (cursors.type === 'Sin') return;

    const { gridLeft, gridTop, gridWidth, gridHeight, pxPerDivX, pxPerDivY, centerX, centerY } = coords;

    ctx.save();
    ctx.strokeStyle = '#666666';
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 4]);

    if (cursors.type === 'Voltaje') {
      for (const pos of [cursors.cursor1Pos, cursors.cursor2Pos]) {
        const py = centerY - pos * pxPerDivY;
        if (py < gridTop || py > gridTop + gridHeight) continue;
        ctx.beginPath();
        ctx.moveTo(gridLeft, py);
        ctx.lineTo(gridLeft + gridWidth, py);
        ctx.stroke();
      }
    } else if (cursors.type === 'Tiempo') {
      for (const pos of [cursors.cursor1Pos, cursors.cursor2Pos]) {
        const px = centerX + pos * pxPerDivX;
        if (px < gridLeft || px > gridLeft + gridWidth) continue;
        ctx.beginPath();
        ctx.moveTo(px, gridTop);
        ctx.lineTo(px, gridTop + gridHeight);
        ctx.stroke();
      }
    }

    ctx.setLineDash([]);
    ctx.restore();
  }

  // ── Header (ítems 1, 2, 3, 4) ─────────────────────────────────────────────

  #drawHeader(ctx, coords, state, triggerStatus) {
    const { gridLeft, gridTop, gridWidth, pxPerDivX, centerX } = coords;
    const y = gridTop - 5;

    // Ítem 1 — "Tek"
    ctx.fillStyle    = '#000000';
    ctx.font         = `bold 16px ${FONT}`;
    ctx.textBaseline = 'bottom';
    ctx.textAlign    = 'left';
    ctx.fillText('Tek', gridLeft, y);

    // Ítem 2 — ícono de trigger status
    const iconX = gridLeft + 48;
    _drawTriggerStatusIcon(ctx, iconX, y - 14, 14, triggerStatus);
    ctx.fillStyle    = '#000000';
    ctx.font         = `16px ${FONT}`;
    ctx.textBaseline = 'bottom';
    ctx.textAlign    = 'left';
    ctx.fillText(_triggerStatusLabel(triggerStatus), iconX + 18, y);

    // Ítems 3 y 4 — triángulo de posición horizontal y readout "Pos: Xms"
    if (!state.scanMode) {
      const hPos    = state.horizontalPosition;
      const tpd     = state.timePerDiv;
      const trigX   = centerX + (hPos / tpd) * pxPerDivX;
      const clampedX = Math.max(gridLeft, Math.min(gridLeft + gridWidth, trigX));

      // Triángulo ▽ en borde superior
      ctx.fillStyle = '#000000';
      ctx.font      = `12px ${FONT}`;
      ctx.textBaseline = 'top';
      ctx.textAlign    = 'center';
      ctx.fillText('▽', clampedX, gridTop);

      // Readout "Pos: Xms"
      if (hPos !== 0) {
        ctx.font         = `12px ${FONT}`;
        ctx.textBaseline = 'bottom';
        ctx.textAlign    = 'right';
        ctx.fillText(`Pos:${_fmtT(hPos)}`, gridLeft + gridWidth, y);
      }
    }
  }

  // ── Footer (ítems 6, 7, 8) ────────────────────────────────────────────────

  #drawFooter(ctx, coords, state, triggerStatus) {
    if (state.scanMode) return;
    const { gridLeft, gridWidth, height } = coords;
    const y = height - 6;

    const source    = state.trigger.source;
    const slope     = state.trigger.slope;
    const slopeIcon = slope === 'Bajada' ? '\\' : '/';
    const levelText = _fmtV(state.trigger.level);

    ctx.fillStyle    = '#000000';
    ctx.font         = `16px ${FONT}`;
    ctx.textBaseline = 'bottom';
    ctx.textAlign    = 'right';
    ctx.fillText(`${source} ${slopeIcon} ${levelText}`, gridLeft + gridWidth, y);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function _drawTriggerStatusIcon(ctx, x, y, size, status) {
  ctx.save();
  if (status === 'triggered') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size - 2}px ${FONT}`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('T', x + size / 2, y + size / 2);
  } else if (status === 'stop') {
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth   = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    const letter = { armed: '', ready: 'R', auto: 'A' }[status] ?? '';
    if (letter) {
      ctx.fillStyle    = '#000000';
      ctx.font         = `bold ${size - 2}px ${FONT}`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, x + size / 2, y + size / 2);
    }
  }
  ctx.restore();
}

function _triggerStatusLabel(status) {
  return { armed: 'Armed', ready: 'Ready', triggered: "Trig'd", auto: 'Auto', stop: 'Stop' }[status] ?? '';
}

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

function _r(n) { return (Math.round(n * 100) / 100).toString(); }
