export class Signal {
  sample(_t) {
    throw new Error('Signal.sample(t) must be implemented by subclass');
  }

  get amplitudeRange() {
    return [-1, 1];
  }
}
