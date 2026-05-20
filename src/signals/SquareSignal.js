import { Signal } from './Signal.js';

export class SquareSignal extends Signal {
  constructor({ amplitude = 1, frequency = 1000, dutyCycle = 0.5, phase = 0, offset = 0 } = {}) {
    super();
    this.amplitude = amplitude;
    this.frequency = frequency;
    this.dutyCycle = dutyCycle;
    this.phase = phase;
    this.offset = offset;
  }

  sample(t) {
    const period = 1 / this.frequency;
    const phaseShift = this.phase / (2 * Math.PI) * period;
    const local = ((t + phaseShift) % period + period) % period;
    const high = local < period * this.dutyCycle;
    return this.offset + (high ? this.amplitude : -this.amplitude);
  }

  get amplitudeRange() {
    return [this.offset - this.amplitude, this.offset + this.amplitude];
  }
}
