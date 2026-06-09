const SUBDIVISIONS_PER_DIV = 5;

export class StaticLayer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  /**
   * @param {{
   *   coords: DivisionCoordinates,
   *   state: OscilloscopeState,
   *   showSubdivisions: boolean,
   *   menuPanelWidth: number,
   * }} params
   */
  draw({ coords, state, showSubdivisions, menuPanelWidth = 0 }) {
    const ctx = this.ctx;
    const { width, height, gridLeft, gridTop, gridWidth, gridHeight,
            divisionsX, divisionsY, pxPerDivX, pxPerDivY, centerX, centerY } = coords;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    if (showSubdivisions) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth   = 1;

      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      for (let j = 1; j < divisionsY; j++) {
        if (j === divisionsY / 2) continue;
        const y = gridTop + j * pxPerDivY + 0.5;
        ctx.moveTo(gridLeft, y);
        ctx.lineTo(gridLeft + gridWidth, y);
      }
      for (let i = 1; i < divisionsX; i++) {
        if (i === divisionsX / 2) continue;
        const x = gridLeft + i * pxPerDivX + 0.5;
        ctx.moveTo(x, gridTop);
        ctx.lineTo(x, gridTop + gridHeight);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const tickLen = 3;
    ctx.beginPath();
    const subX = pxPerDivX / SUBDIVISIONS_PER_DIV;
    const subY = pxPerDivY / SUBDIVISIONS_PER_DIV;

    for (let i = 0; i <= divisionsX * SUBDIVISIONS_PER_DIV; i++) {
      const x = gridLeft + i * subX;
      ctx.moveTo(x + 0.5, centerY - tickLen); ctx.lineTo(x + 0.5, centerY + tickLen);
      ctx.moveTo(x + 0.5, gridTop);           ctx.lineTo(x + 0.5, gridTop + tickLen);
      ctx.moveTo(x + 0.5, gridTop + gridHeight); ctx.lineTo(x + 0.5, gridTop + gridHeight - tickLen);
    }

    for (let j = 0; j <= divisionsY * SUBDIVISIONS_PER_DIV; j++) {
      const y = gridTop + j * subY;
      ctx.moveTo(centerX - tickLen, y + 0.5); ctx.lineTo(centerX + tickLen, y + 0.5);
      ctx.moveTo(gridLeft, y + 0.5);          ctx.lineTo(gridLeft + tickLen, y + 0.5);
      ctx.moveTo(gridLeft + gridWidth, y + 0.5); ctx.lineTo(gridLeft + gridWidth - tickLen, y + 0.5);
    }
    ctx.stroke();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth   = 1;
    ctx.strokeRect(gridLeft + 0.5, gridTop + 0.5, gridWidth, gridHeight);

    // Footer labels
    ctx.fillStyle    = '#000000';
    ctx.font         = '16px ui-monospace, "Courier New", monospace';
    ctx.textBaseline = 'bottom';
    ctx.textAlign    = 'left';
    const labelY = height - 6;

    const ch1  = state.ch[1];
    const pf1  = _probeFactor(ch1.probe);
    ctx.fillText(`CH1 ${formatVoltage(ch1.voltsPerDiv * pf1)}`, gridLeft, labelY);

    if (state.ch[2].visible) {
      const ch2 = state.ch[2];
      const pf2 = _probeFactor(ch2.probe);
      const ch1LabelW = ctx.measureText(`CH1 ${formatVoltage(ch1.voltsPerDiv * pf1)}`).width;
      ctx.fillText(`  CH2 ${formatVoltage(ch2.voltsPerDiv * pf2)}`, gridLeft + ch1LabelW, labelY);
    }

    ctx.textAlign = 'center';
    ctx.fillText(`M ${formatTime(state.timePerDiv)}`, gridLeft + gridWidth * 0.5, labelY);
  }
}

function _probeFactor(probeStr) {
  return parseInt(probeStr) || 1;
}

function formatVoltage(v) {
  const abs = Math.abs(v);
  if (abs >= 1)    return `${trimNum(v)}V`;
  if (abs >= 1e-3) return `${trimNum(v * 1e3)}mV`;
  return `${trimNum(v * 1e6)}uV`;
}

function formatTime(s) {
  const abs = Math.abs(s);
  if (abs >= 1)    return `${trimNum(s)}s`;
  if (abs >= 1e-3) return `${trimNum(s * 1e3)}ms`;
  if (abs >= 1e-6) return `${trimNum(s * 1e6)}us`;
  return `${trimNum(s * 1e9)}ns`;
}

function trimNum(n) {
  return (Math.round(n * 100) / 100).toString();
}
