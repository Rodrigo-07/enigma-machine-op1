const { toChar, toIndex, mod } = require('./utils');

const ROTORES = {
  I:   { circuito: "EKMFLGDQVZNTOWYHXUSPAIBRCJ", catraquinha: 'Q' },
  II:  { circuito: "AJDKSIRUXBLHWTMCQGZNPYFVOE", catraquinha: 'E' },
  III: { circuito: "BDFHJLCPRTXVZNYEIWGAKMUSQO", catraquinha: 'V' },
  IV:  { circuito: "ESOVPZJAYQUIRHXLNFTGKDCMWB", catraquinha: 'J' },
  V:   { circuito: "VZBRGITYUPSDNHLXAWMJQOFECK", catraquinha: 'Z' },
};

class Rotor {
  constructor(tipo, posicao = 0) {
    const config = ROTORES[tipo];
    if (!config) throw new Error(`Rotor inválido: ${tipo}`);

    this.right = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";  // lado fixo
    this.left = config.circuito;                // fiação interna
    this.notch = config.catraquinha;
    this.position = mod(posicao, 26);
  }

  forward(input) {
    const i = typeof input === 'string' ? toIndex(input) : input;

    const stepped = mod(i + this.position, 26);
    const CharCircuito = this.left[stepped];
    const out = mod(toIndex(CharCircuito) - this.position, 26);

    return typeof input === 'string' ? toChar(out) : out;
  }

  backward(input) {
    const i = typeof input === 'string' ? toIndex(input) : input;

    const stepped = mod(i + this.position, 26);
    const char = this.right[stepped]; 
    const indexInLeft = this.left.indexOf(char);
    const out = mod(indexInLeft - this.position, 26);

    return typeof input === 'string' ? toChar(out) : out;
  }

  rotate() {
    this.position = mod(this.position + 1, 26);
  }

  rotate_to(pos) {
    this.position = mod(pos, 26);
  }

  reached_notch() {
    return toChar(this.position) === this.notch;
  }
}

module.exports = Rotor;
