import { Signal } from './Signal.js';

export class SineSignal extends Signal {
  constructor({ amplitude = 1, frequency = 1000, phase = 0, offset = 0 } = {}) {
    super();
    this.amplitude = amplitude;
    this.frequency = frequency;
    this.phase = phase;
    this.offset = offset;
  }

  sample(t) {
    return this.offset + this.amplitude * Math.sin(2 * Math.PI * this.frequency * t + this.phase);
  }

  get amplitudeRange() {
    return [this.offset - this.amplitude, this.offset + this.amplitude];
  }
}
