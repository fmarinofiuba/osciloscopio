const FONT = 'ui-monospace, "Courier New", monospace';

export class DynamicLayer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw({
    coords,
    signal,
    voltsPerDiv,
    timePerDiv,
    verticalOffset,
    horizontalOffset,
    triggerLevel,
    triggerStatus,
    triggerMenuState,
    lineWidth,
  }) {
    const ctx = this.ctx;
    const { width, height } = coords;

    ctx.clearRect(0, 0, width, height);

    this.#drawHeader(ctx, coords, triggerStatus);
    this.#drawTriggerArrow(ctx, coords, triggerLevel, voltsPerDiv);
    this.#drawGroundArrow(ctx, coords, verticalOffset);
    this.#drawFooter(ctx, coords, triggerLevel, triggerMenuState);

    if (signal) {
      this.#drawWaveform(ctx, {
        coords, signal, voltsPerDiv, timePerDiv, verticalOffset, horizontalOffset, lineWidth,
      });
    }
  }

  #drawWaveform(ctx, { coords, signal, voltsPerDiv, timePerDiv, verticalOffset, horizontalOffset, lineWidth }) {
    const { gridLeft, gridTop, gridWidth, gridHeight, pxPerDivX, pxPerDivY, centerX, centerY } = coords;

    ctx.save();
    ctx.beginPath();
    ctx.rect(gridLeft, gridTop, gridWidth, gridHeight);
    ctx.clip();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    const steps = Math.max(2, Math.floor(gridWidth));
    for (let i = 0; i <= steps; i++) {
      const px = gridLeft + (i / steps) * gridWidth;
      const divX = (px - centerX) / pxPerDivX;
      const t = (divX - horizontalOffset) * timePerDiv;
      const v = signal.sample(t);
      const divY = v / voltsPerDiv + verticalOffset;
      const py = centerY - divY * pxPerDivY;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Item 5: marcador de nivel de trigger en borde derecho de la grilla
  #drawTriggerArrow(ctx, coords, triggerLevel, voltsPerDiv) {
    const { gridLeft, gridWidth, gridTop, gridHeight, pxPerDivY, centerY } = coords;
    const divY = triggerLevel / voltsPerDiv;
    const py = centerY - divY * pxPerDivY;
    if (py < gridTop || py > gridTop + gridHeight) return;
    const x = gridLeft + gridWidth + 4;
    ctx.fillStyle = '#000000';
    ctx.font = `16px ${FONT}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText('◀', x, py);
  }

  // Item 13: marcador de referencia de tierra del canal
  #drawGroundArrow(ctx, coords, verticalOffset) {
    const { gridLeft, gridTop, gridHeight, pxPerDivY, centerY } = coords;
    const py = centerY - verticalOffset * pxPerDivY;
    if (py < gridTop || py > gridTop + gridHeight) return;
    ctx.fillStyle = '#000000';
    ctx.font = `16px ${FONT}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.fillText('1▶', gridLeft - 2, py);
  }

  // Items 1+2: header — "Tek" + ícono de trigger status
  #drawHeader(ctx, coords, triggerStatus) {
    const { gridLeft, gridTop } = coords;
    const y = gridTop - 5;

    ctx.fillStyle = '#000000';
    ctx.font = `bold 16px ${FONT}`;
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    ctx.fillText('Tek', gridLeft, y);

    // Ícono de trigger status con recuadro (~80px a la derecha de "Tek")
    const iconX = gridLeft + 80;
    _drawTriggerStatusIcon(ctx, iconX, y - 14, 14, triggerStatus);

    // Etiqueta de texto junto al ícono
    const label = _triggerStatusLabel(triggerStatus);
    ctx.fillStyle = '#000000';
    ctx.font = `16px ${FONT}`;
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    ctx.fillText(label, iconX + 18, y);
  }

  // Items 6, 7, 8: footer derecho — source + tipo de flanco + nivel de trigger
  #drawFooter(ctx, coords, triggerLevel, triggerMenuState) {
    const { gridLeft, gridWidth, height } = coords;
    const y = height - 6;
    const source = triggerMenuState?.source ?? 'CH1';
    const slope = triggerMenuState?.slope ?? 'Subida';
    const slopeIcon = slope === 'Bajada' ? '\\' : '/';
    const levelText = _formatVoltage(triggerLevel);

    ctx.fillStyle = '#000000';
    ctx.font = `16px ${FONT}`;
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'right';
    ctx.fillText(`${source} ${slopeIcon} ${levelText}`, gridLeft + gridWidth, y);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _drawTriggerStatusIcon(ctx, x, y, size, status) {
  ctx.save();
  if (status === 'triggered') {
    // Recuadro negro relleno, "T" blanca
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size - 2}px ui-monospace, "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('T', x + size / 2, y + size / 2);
  } else if (status === 'stop') {
    // Círculo negro relleno
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Recuadro con borde y letra interior
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
    const letter = { armed: '', ready: 'R', auto: 'A' }[status] ?? '';
    if (letter) {
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${size - 2}px ui-monospace, "Courier New", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, x + size / 2, y + size / 2);
    }
  }
  ctx.restore();
}

function _triggerStatusLabel(status) {
  return {
    armed:     'Armed',
    ready:     'Ready',
    triggered: "Trig'd",
    auto:      'Auto',
    stop:      'Stop',
  }[status] ?? '';
}

function _formatVoltage(v) {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1) return `${sign}${_trim(abs)}V`;
  if (abs >= 1e-3) return `${sign}${_trim(abs * 1e3)}mV`;
  return `${sign}${_trim(abs * 1e6)}uV`;
}

function _trim(n) {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? r.toString() : r.toString();
}
