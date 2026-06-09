import { Signal } from './Signal.js';

/**
 * Respuesta de un circuito RC a una onda cuadrada periódica.
 *
 * El circuito RC integrador tiene la forma:
 *   - Entrada: onda cuadrada que alterna entre +amplitude y -amplitude
 *   - Salida:  tensión en el capacitor (exponencial de carga/descarga)
 *
 * En cada semiciclo la tensión sigue: V(t) = Vfinal + (Vinicial - Vfinal)·e^(-t/tau)
 * La señal es periódica y se calcula encontrando la tensión inicial de régimen
 * permanente por simetría.
 *
 * Parámetros:
 *   amplitude  — amplitud de la onda cuadrada de entrada (V), señal va de -amp a +amp
 *   frequency  — frecuencia de la onda cuadrada (Hz)
 *   tau        — constante de tiempo del circuito RC (segundos, tau = R·C)
 *   offset     — desplazamiento DC de la señal de entrada (V)
 *   dutyCycle  — ciclo de trabajo (0-1), fracción del período que la entrada está HIGH
 */
export class RCSignal extends Signal {
  constructor({ amplitude = 2.5, frequency = 1000, tau = 2e-4, offset = 0, dutyCycle = 0.5 } = {}) {
    super();
    this.amplitude = amplitude;
    this.frequency = frequency;
    this.tau       = tau;
    this.offset    = offset;
    this.dutyCycle = dutyCycle;
  }

  sample(t) {
    const period   = 1 / this.frequency;
    const tHigh    = period * this.dutyCycle;
    const tLow     = period * (1 - this.dutyCycle);
    const vHigh    = this.offset + this.amplitude;
    const vLow     = this.offset - this.amplitude;
    const tau      = this.tau;

    // Tensión inicial de régimen permanente por simetría.
    // Al inicio del semiciclo HIGH: Vc0_hi
    // Al inicio del semiciclo LOW:  Vc0_lo
    // Resolvemos el sistema de ecuaciones de estado estacionario:
    //   Vc0_lo = vHigh + (Vc0_hi - vHigh) * e^(-tHigh/tau)
    //   Vc0_hi = vLow  + (Vc0_lo - vLow)  * e^(-tLow/tau)
    const eH = Math.exp(-tHigh / tau);
    const eL = Math.exp(-tLow  / tau);
    // Vc0_lo = vHigh + (Vc0_hi - vHigh)*eH
    // Vc0_hi = vLow  + (Vc0_lo - vLow)*eL
    //        = vLow  + (vHigh + (Vc0_hi - vHigh)*eH - vLow)*eL
    // Vc0_hi*(1 - eH*eL) = vLow*(1-eL) + vHigh*(eL - eH*eL) + vHigh*eH*eL - vHigh*eH*eL ...
    // Simplificando:
    //   Vc0_hi = (vLow*(1-eL) + vHigh*eL*(1-eH)) / (1 - eH*eL)
    const denom = 1 - eH * eL;
    let vc0Hi, vc0Lo;
    if (Math.abs(denom) < 1e-15) {
      // tau → ∞: capacitor no carga, tensión es constante (media de la entrada)
      vc0Hi = (vHigh * tHigh + vLow * tLow) / period;
      vc0Lo = vc0Hi;
    } else {
      vc0Hi = (vLow * (1 - eL) + vHigh * eL * (1 - eH)) / denom;
      vc0Lo = vHigh + (vc0Hi - vHigh) * eH;
    }

    // Normalizar t al rango [0, period)
    const tMod = ((t % period) + period) % period;

    if (tMod < tHigh) {
      // Semiciclo HIGH: capacitor cargando hacia vHigh
      return vHigh + (vc0Hi - vHigh) * Math.exp(-tMod / tau);
    } else {
      // Semiciclo LOW: capacitor descargando hacia vLow
      return vLow + (vc0Lo - vLow) * Math.exp(-(tMod - tHigh) / tau);
    }
  }

  get amplitudeRange() {
    // El rango real es un subconjunto de [vLow, vHigh], pero usamos el extremo
    // de la entrada para que el nivel de trigger sea manejable
    const vHigh = this.offset + this.amplitude;
    const vLow  = this.offset - this.amplitude;
    return [vLow, vHigh];
  }
}
