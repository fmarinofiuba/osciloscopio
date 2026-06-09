const SUBDIVISIONS_PER_DIV = 5;

export class StaticLayer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw({ coords, voltsPerDiv, timePerDiv, showSubdivisions, menuPanelWidth = 0 }) {
    const ctx = this.ctx;
    const { width, height, gridLeft, gridTop, gridWidth, gridHeight, divisionsX, divisionsY, pxPerDivX, pxPerDivY, centerX, centerY } = coords;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#000000';

    if (showSubdivisions) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;

      // Dashed horizontal division lines (skip center axis and borders)
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      for (let j = 1; j < divisionsY; j++) {
        if (j === divisionsY / 2) continue; // skip center axis
        const y = gridTop + j * pxPerDivY + 0.5;
        ctx.moveTo(gridLeft, y);
        ctx.lineTo(gridLeft + gridWidth, y);
      }
      // Dashed vertical division lines (skip center axis and borders)
      for (let i = 1; i < divisionsX; i++) {
        if (i === divisionsX / 2) continue; // skip center axis
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

    // Ticks horizontales: eje central + bordes superior e inferior
    for (let i = 0; i <= divisionsX * SUBDIVISIONS_PER_DIV; i++) {
      const x = gridLeft + i * subX;
      // eje central
      ctx.moveTo(x + 0.5, centerY - tickLen);
      ctx.lineTo(x + 0.5, centerY + tickLen);
      // borde superior
      ctx.moveTo(x + 0.5, gridTop);
      ctx.lineTo(x + 0.5, gridTop + tickLen);
      // borde inferior
      ctx.moveTo(x + 0.5, gridTop + gridHeight);
      ctx.lineTo(x + 0.5, gridTop + gridHeight - tickLen);
    }

    // Ticks verticales: eje central + bordes izquierdo y derecho
    for (let j = 0; j <= divisionsY * SUBDIVISIONS_PER_DIV; j++) {
      const y = gridTop + j * subY;
      // eje central
      ctx.moveTo(centerX - tickLen, y + 0.5);
      ctx.lineTo(centerX + tickLen, y + 0.5);
      // borde izquierdo
      ctx.moveTo(gridLeft, y + 0.5);
      ctx.lineTo(gridLeft + tickLen, y + 0.5);
      // borde derecho
      ctx.moveTo(gridLeft + gridWidth, y + 0.5);
      ctx.lineTo(gridLeft + gridWidth - tickLen, y + 0.5);
    }
    ctx.stroke();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(gridLeft + 0.5, gridTop + 0.5, gridWidth, gridHeight);

    ctx.fillStyle = '#000000';
    ctx.font = '16px ui-monospace, "Courier New", monospace';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    const labelY = height - 6;
    ctx.fillText(`CH1 ${formatVoltage(voltsPerDiv)}`, gridLeft, labelY);
    ctx.fillText(`M ${formatTime(timePerDiv)}`, gridLeft + gridWidth * 0.45, labelY);
  }
}

function formatVoltage(v) {
  const abs = Math.abs(v);
  if (abs >= 1) return `${trimNum(v)}V`;
  if (abs >= 1e-3) return `${trimNum(v * 1e3)}mV`;
  return `${trimNum(v * 1e6)}uV`;
}

function formatTime(s) {
  const abs = Math.abs(s);
  if (abs >= 1) return `${trimNum(s)}s`;
  if (abs >= 1e-3) return `${trimNum(s * 1e3)}ms`;
  if (abs >= 1e-6) return `${trimNum(s * 1e6)}us`;
  return `${trimNum(s * 1e9)}ns`;
}

function trimNum(n) {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toString();
}
