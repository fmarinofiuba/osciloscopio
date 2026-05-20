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
    triggered,
    lineWidth,
  }) {
    const ctx = this.ctx;
    const { width, height, gridLeft, gridTop, gridWidth, gridHeight, divisionsX, centerX, centerY } = coords;

    ctx.clearRect(0, 0, width, height);

    this.#drawTriggerArrow(ctx, coords, triggerLevel, voltsPerDiv);
    this.#drawGroundArrow(ctx, coords, verticalOffset);
    this.#drawTriggerStatus(ctx, coords, triggered);

    if (signal) {
      this.#drawWaveform(ctx, {
        coords, signal, voltsPerDiv, timePerDiv, verticalOffset, horizontalOffset, lineWidth,
      });
    }
  }

  #drawWaveform(ctx, { coords, signal, voltsPerDiv, timePerDiv, verticalOffset, horizontalOffset, lineWidth }) {
    const { gridLeft, gridTop, gridWidth, gridHeight, pxPerDivX, pxPerDivY, centerX, centerY, divisionsX } = coords;

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

  #drawTriggerArrow(ctx, coords, triggerLevel, voltsPerDiv) {
    const { gridLeft, gridWidth, gridTop, gridHeight, pxPerDivY, centerY } = coords;
    const divY = triggerLevel / voltsPerDiv;
    const py = centerY - divY * pxPerDivY;
    if (py < gridTop || py > gridTop + gridHeight) return;
    const x = gridLeft + gridWidth + 4;
    ctx.fillStyle = '#000000';
    ctx.font = '10px ui-monospace, "Courier New", monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText('T◀', x, py);
  }

  #drawGroundArrow(ctx, coords, verticalOffset) {
    const { gridLeft, gridTop, gridHeight, pxPerDivY, centerY } = coords;
    const py = centerY - verticalOffset * pxPerDivY;
    if (py < gridTop || py > gridTop + gridHeight) return;
    ctx.fillStyle = '#000000';
    ctx.font = '10px ui-monospace, "Courier New", monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.fillText('1▶', gridLeft - 2, py);
  }

  #drawTriggerStatus(ctx, coords, triggered) {
    const { gridLeft, gridTop } = coords;
    ctx.fillStyle = '#000000';
    ctx.font = '11px ui-monospace, "Courier New", monospace';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    ctx.fillText(triggered ? "Trig'd" : '', gridLeft + 80, gridTop - 4);
    ctx.fillText('Tek', gridLeft, gridTop - 4);
  }
}
