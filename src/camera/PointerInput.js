// Abstracción de eventos pointer/wheel unificada para mouse y touch.
// Emite acciones lógicas (rotate / pan / zoom) hacia los callbacks.
// El consumidor decide si ignorar los eventos (por ejemplo durante transiciones).

export class PointerInput {
  constructor(domElement, handlers = {}) {
    this.dom = domElement;
    this.handlers = handlers;
    this.enabled = true;

    this._activePointers = new Map(); // pointerId -> { x, y, button, type }
    this._lastPinchDist = null;
    this._lastTwoFingerCenter = null;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onWheel = this._onWheel.bind(this);
    this._onContextMenu = (e) => e.preventDefault();

    this.dom.addEventListener('pointerdown', this._onPointerDown);
    this.dom.addEventListener('pointermove', this._onPointerMove);
    this.dom.addEventListener('pointerup', this._onPointerUp);
    this.dom.addEventListener('pointercancel', this._onPointerUp);
    this.dom.addEventListener('pointerleave', this._onPointerUp);
    this.dom.addEventListener('wheel', this._onWheel, { passive: false });
    this.dom.addEventListener('contextmenu', this._onContextMenu);
    this.dom.style.touchAction = 'none';
  }

  setEnabled(v) {
    this.enabled = v;
    if (!v) {
      this._activePointers.clear();
      this._lastPinchDist = null;
      this._lastTwoFingerCenter = null;
    }
  }

  dispose() {
    this.dom.removeEventListener('pointerdown', this._onPointerDown);
    this.dom.removeEventListener('pointermove', this._onPointerMove);
    this.dom.removeEventListener('pointerup', this._onPointerUp);
    this.dom.removeEventListener('pointercancel', this._onPointerUp);
    this.dom.removeEventListener('pointerleave', this._onPointerUp);
    this.dom.removeEventListener('wheel', this._onWheel);
    this.dom.removeEventListener('contextmenu', this._onContextMenu);
  }

  _onPointerDown(e) {
    if (!this.enabled) return;
    this.dom.setPointerCapture?.(e.pointerId);
    this._activePointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      button: e.button,
      type: e.pointerType,
    });
    if (this._activePointers.size === 2) {
      const [a, b] = [...this._activePointers.values()];
      this._lastPinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      this._lastTwoFingerCenter = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
  }

  _onPointerMove(e) {
    if (!this.enabled) return;
    const prev = this._activePointers.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    prev.x = e.clientX;
    prev.y = e.clientY;

    if (this._activePointers.size === 1) {
      // Mouse: izq → rotate, der → pan.
      // Touch: single → rotate.
      if (prev.type === 'mouse' && prev.button === 2) {
        this.handlers.onPan?.(dx, dy);
      } else {
        this.handlers.onRotate?.(dx, dy);
      }
    } else if (this._activePointers.size === 2) {
      const [a, b] = [...this._activePointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (this._lastPinchDist != null) {
        const dz = this._lastPinchDist - dist; // pinch in → zoom in (radius decrece)
        if (dz !== 0) this.handlers.onZoom?.(dz);
      }
      if (this._lastTwoFingerCenter) {
        const pdx = center.x - this._lastTwoFingerCenter.x;
        const pdy = center.y - this._lastTwoFingerCenter.y;
        if (pdx !== 0 || pdy !== 0) this.handlers.onPan?.(pdx, pdy);
      }
      this._lastPinchDist = dist;
      this._lastTwoFingerCenter = center;
    }
  }

  _onPointerUp(e) {
    this._activePointers.delete(e.pointerId);
    if (this._activePointers.size < 2) {
      this._lastPinchDist = null;
      this._lastTwoFingerCenter = null;
    }
  }

  _onWheel(e) {
    if (!this.enabled) return;
    e.preventDefault();
    this.handlers.onZoom?.(e.deltaY);
  }
}
