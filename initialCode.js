import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, X, Settings } from 'lucide-react';

// --- CONSTANTES GLOBAIS ---
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const CONFIG_ROTORS = {
  I:   { wiring: "EKMFLGDQVZNTOWYHXUSPAIBRCJ", notch: 'Q' },
  II:  { wiring: "AJDKSIRUXBLHWTMCQGZNPYFVOE", notch: 'E' },
  III: { wiring: "BDFHJLCPRTXVZNYEIWGAKMUSQO", notch: 'V' },
  IV:  { wiring: "ESOVPZJAYQUIRHXLNFTGKDCMWB", notch: 'J' },
  V:   { wiring: "VZBRGITYUPSDNHLXAWMJQOFECK", notch: 'Z' },
};

const CONFIG_REFLECTORS = {
  B: { wiring: "YRUHQSLDPXNGOKMIEBFZCWVJAT" },
  C: { wiring: "FVPJIAOYEDRZXWGCTKUQSBNMHL" }
};

// --- CLASSES DE DOMÍNIO (POO) ---

/**
 * Representa um Rotor individual da máquina Enigma.
 * Encapsula a fiação, posição atual, anel e lógica de transformação.
 */
class Rotor {
  constructor(type, position = 0, ring = 0) {
    const config = CONFIG_ROTORS[type];
    this.type = type;
    this.wiring = config.wiring;
    this.notch = config.notch;
    this.position = position;
    this.ring = ring;
  }

  // Utilitário estático para módulo positivo
  static mod(n, m) {
    return ((n % m) + m) % m;
  }

  static toIndex(char) {
    return char ? char.charCodeAt(0) - 65 : 0;
  }

  static toChar(index) {
    return String.fromCharCode(index + 65);
  }

  setPosition(pos) {
    this.position = Rotor.mod(pos, 26);
  }

  step() {
    this.position = Rotor.mod(this.position + 1, 26);
  }

  isAtNotch() {
    return Rotor.toChar(this.position) === this.notch;
  }

  /**
   * Processa o sinal passando pelo rotor.
   * @param {number} inputIndex - Índice da letra de entrada (0-25)
   * @param {boolean} inverse - Se true, processa da esquerda para a direita (caminho de volta)
   */
  process(inputIndex, inverse = false) {
    const offset = Rotor.mod(this.position - this.ring, 26);
    const shiftedInput = Rotor.mod(inputIndex + offset, 26);
    
    let outputIndex;
    if (!inverse) {
      // Caminho de Ida (Direita -> Esquerda)
      const charAtWiring = this.wiring[shiftedInput];
      outputIndex = Rotor.mod(Rotor.toIndex(charAtWiring) - offset, 26);
    } else {
      // Caminho de Volta (Esquerda -> Direita)
      const inputChar = Rotor.toChar(shiftedInput);
      const wiringIndex = this.wiring.indexOf(inputChar);
      outputIndex = Rotor.mod(wiringIndex - offset, 26);
    }
    return outputIndex;
  }
}

/**
 * Representa o Refletor (Umkehrwalze).
 */
class Reflector {
  constructor(type) {
    this.type = type;
    this.wiring = CONFIG_REFLECTORS[type].wiring;
  }

  process(inputIndex) {
    const reflectedChar = this.wiring[inputIndex];
    return Rotor.toIndex(reflectedChar);
  }
}

/**
 * Representa o Painel de Conexões (Steckerbrett).
 */
class Plugboard {
  constructor(connections = {}) {
    this.connections = connections;
  }

  process(charIndex) {
    const char = Rotor.toChar(charIndex);
    if (this.connections[char]) {
      return Rotor.toIndex(this.connections[char]);
    }
    return charIndex;
  }
}

/**
 * Classe Principal: EnigmaCore
 * Orquestra os rotores, refletor e plugboard.
 * Gerencia a lógica de "stepping" (rotação) e o fluxo do sinal.
 */
class EnigmaCore {
  constructor(rotorTypes, reflectorType, rotorPositions, plugboardConnections) {
    // Instancia os componentes
    this.rotors = [
      new Rotor(rotorTypes[0], rotorPositions[0]), // Esquerda
      new Rotor(rotorTypes[1], rotorPositions[1]), // Meio
      new Rotor(rotorTypes[2], rotorPositions[2])  // Direita
    ];
    this.reflector = new Reflector(reflectorType);
    this.plugboard = new Plugboard(plugboardConnections);
    this.pathTrace = []; // Para armazenar o caminho visual
  }

  // Registra um passo no caminho do sinal para visualização
  addTrace(stepName, value, type) {
    this.pathTrace.push({ step: stepName, val: value, type });
  }

  /**
   * Executa a rotação mecânica dos rotores (mecanismo de double stepping).
   */
  rotate() {
    const [l, m, r] = this.rotors;
    
    let stepL = false;
    let stepM = false;
    let stepR = true; // O rotor da direita sempre tenta girar

    // Lógica de Double Stepping da Enigma M3/M4
    if (m.isAtNotch()) {
      stepM = true;
      stepL = true; // O rotor do meio empurra o da esquerda E gira a si mesmo
    } else if (r.isAtNotch()) {
      stepM = true; // O rotor da direita empurra o do meio
    }

    if (stepR) r.step();
    if (stepM) m.step();
    if (stepL) l.step();
  }

  /**
   * Criptografa um único caractere.
   */
  encryptChar(char) {
    this.pathTrace = []; // Limpa rastro anterior
    let signal = Rotor.toIndex(char);
    
    // 1. Rotação Mecânica (Acontece ANTES do contato elétrico)
    this.rotate();

    // Rastreamento Inicial
    this.addTrace('Teclado', Rotor.toChar(signal), 'input');

    // 2. Plugboard (Entrada)
    signal = this.plugboard.process(signal);
    this.addTrace('Plugboard', Rotor.toChar(signal), 'plug');

    // 3. Rotores (Ida: Direita -> Esquerda)
    // Itera inversamente pelo array de rotores (2 -> 1 -> 0)
    for (let i = 2; i >= 0; i--) {
      signal = this.rotors[i].process(signal, false);
      this.addTrace(`Rotor ${this.rotors[i].type}`, Rotor.toChar(signal), 'rotor');
    }

    // 4. Refletor
    signal = this.reflector.process(signal);
    this.addTrace(`Refletor ${this.reflector.type}`, Rotor.toChar(signal), 'reflector');

    // 5. Rotores (Volta: Esquerda -> Direita)
    // Itera normalmente (0 -> 1 -> 2)
    for (let i = 0; i < 3; i++) {
      signal = this.rotors[i].process(signal, true);
      this.addTrace(`Rotor ${this.rotors[i].type} (Inv)`, Rotor.toChar(signal), 'rotor');
    }

    // 6. Plugboard (Saída)
    signal = this.plugboard.process(signal);
    const outputChar = Rotor.toChar(signal);
    
    this.addTrace('Plugboard', outputChar, 'plug');
    this.addTrace('Luz', outputChar, 'output');

    return {
      char: outputChar,
      positions: this.rotors.map(r => r.position),
      path: this.pathTrace
    };
  }
}