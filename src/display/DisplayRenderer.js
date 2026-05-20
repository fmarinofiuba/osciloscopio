import { DivisionCoordinates } from './DivisionCoordinates.js';
import { StaticLayer } from './layers/StaticLayer.js';
import { DynamicLayer } from './layers/DynamicLayer.js';

const MARGINS = { top: 24, bottom: 28, left: 28, right: 36 };

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

    this.canvas = document.createElement('canvas');
    this._staticCanvas = document.createElement('canvas');
    this._dynamicCanvas = document.createElement('canvas');
    this._ctx = this.canvas.getContext('2d');

    this._staticLayer = new StaticLayer(this._staticCanvas);
    this._dynamicLayer = new DynamicLayer(this._dynamicCanvas);

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
    this._coords = new DivisionCoordinates({
      width: this._width,
      height: this._height,
      divisionsX: this._divisionsX,
      divisionsY: this._divisionsY,
      marginTop: MARGINS.top,
      marginBottom: MARGINS.bottom,
      marginLeft: MARGINS.left,
      marginRight: MARGINS.right,
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
  invalidateAll() { this._staticDirty = true; this._dynamicDirty = true; this._compositeDirty = true; }

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
      });
      this._staticDirty = false;
    }

    if (this._dynamicDirty) {
      this._dynamicLayer.draw({
        coords: this._coords,
        signal: this._signal,
        voltsPerDiv: this._voltsPerDiv,
        timePerDiv: this._timePerDiv,
        verticalOffset: this._verticalOffset,
        horizontalOffset: this._horizontalOffset + this._driftOffset,
        triggerLevel: this._triggerLevel,
        triggered: this._isTriggered(),
        lineWidth: this._lineWidth,
      });
      this._dynamicDirty = false;
    }

    if (this._compositeDirty) {
      this._ctx.clearRect(0, 0, this._width, this._height);
      this._ctx.drawImage(this._staticCanvas, 0, 0);
      this._ctx.drawImage(this._dynamicCanvas, 0, 0);
      this._compositeDirty = false;
    }
  }
}
