const Rotor = require("./Rotor");
const Reflector = require("./Reflector");
const Plugboard = require("./Plugboard");

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

class Enigma {
    /**
     * @param {Reflector} reflector
     * @param {Rotor} r1
     * @param {Rotor} r2
     * @param {Rotor} r3
     * @param {Plugboard} plugboard
     */
    constructor(reflector, r1, r2, r3, plugboard) {
        this.ref = reflector;
        this.r1 = r1;
        this.r2 = r2;
        this.r3 = r3;
        this.pb = plugboard;

        this.charR3Forward = null;
        this.charR2Forward = null;
        this.charR1Forward = null;
        this.charReflect = null;
        this.charR1Backward = null;
        this.charR2Backward = null;
        this.charR3Backward = null;
        this.charPbForward = null;
        this.charPbBackward= null;
    }

 
    static fromConfig(config) {
        const reflector = new Reflector(config.reflector.type);

        const plugboard = new Plugboard(config.plugboardPairs || []);

        const rotors = (config.rotors || []).map((rConf) => {

            const ringChar = (rConf.ring || "A").toUpperCase();
            const rotor = new Rotor(rConf.type, ringChar);

            if (rConf.position && typeof rotor.rotate_to === "function") {
                const posIndex = ALPHABET.indexOf(rConf.position.toUpperCase());
            if (posIndex >= 0) {
                rotor.rotate_to(posIndex);
            }
            }

            return rotor;
    });

    const r1 = rotors[0] || null;
    const r2 = rotors[1] || null;
    const r3 = rotors[2] || null;

    return new Enigma(reflector, r1, r2, r3, plugboard);
  }

  set_rotors(rotors) {
    if (!Array.isArray(rotors) || rotors.length < 3) {
      throw new Error("É preciso ter pelo menos 3 rotores.");
    }

    this.r1 = rotors[0];
    this.r2 = rotors[1];
    this.r3 = rotors[2];
    this.r4 = rotors[3] ?? this.r4; // mantém o que já tinha se não passar 4º
  }

  encipher(charIndex) {
    console.log("Entrada:", ALPHABET[charIndex]);
    
    // Plugboard process (forward)
    if (this.pb) {
        charPbForward = this.pb.process(charIndex);
        this.charPbForward = charPbForward;
    }
    console.log("Forward pb", ALPHABET[charPbForward]);

    // Rotores forward da direita para a esquerda
    charR3Forward = this.r3.forward(charPbForward);
    this.charR3Forward = charR3Forward;
    console.log("R3 forward:", ALPHABET[charR3Forward]);
    charR2Forward = this.r2.forward(charR3);
    this.charR2Forward = charR2Forward;
    console.log("R2 forward:", ALPHABET[charR2Forward]);
    charR3Forward = this.r1.forward(charR2);
    this.charR1Forward = charR3Forward;
    console.log("R1 forward:", ALPHABET[charR3Forward]);

    // Reflector
    charReflect = this.ref.reflect(charR3Forward);
    this.charReflect = charReflect;
    console.log("Reflector:", ALPHABET[charReflect]);

    // Rotores backward da esquerda para a direita
    charR1Backward = this.r1.backward(charReflect);
    this.charR1Backward = charR1Backward;
    console.log("R1 backward:", ALPHABET[charR1Backward]);
    charR2Backward = this.r2.backward(charR1Backward);
    this.charR2Backward = charR2Backward;
    console.log("R2 backward:", ALPHABET[charR2Backward]);
    charR3Backward = this.r3.backward(charR2Backward);
    this.charR3Backward = charR3Backward;
    console.log("R3 backward:", ALPHABET[charR3Backward]);

    if (this.pb) {
        charPbBackward= this.pb.process(charR3Backward);
        this.charPbBackward = charPbBackward;
    }
    console.log("Backward pb:", ALPHABET[charPbBackward]);

    return ALPHABET[charPbBackward];
  }
}

module.exports = { Enigma };


// Exemplo
// const config = {
//     rotors: [
//       { type: "I",   ring: "A", position: "A" },
//       { type: "II",  ring: "A", position: "A" },
//       { type: "III", ring: "A", position: "A" },
//     ],
//     reflector: { type: "B" },
//     plugboardPairs: ["AB", "CD"],
//   };
  
//   const enigma = Enigma.fromConfig(config);
  
//   const entrada = "A";
//   const saida = enigma.encipher(entrada);
//   console.log(`Resultado: ${entrada} -> ${saida}`);