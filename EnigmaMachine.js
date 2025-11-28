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
     * @param {Rotor} r4
     * @param {Plugboard} plugboard
     */
    constructor(reflector, r1, r2, r3, r4, plugboard) {
        this.ref = reflector;
        this.r1 = r1;
        this.r2 = r2;
        this.r3 = r3;
        this.r4 = r4;
        this.pb = plugboard;
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

  encipher(ch) {
    console.log("Entrada:", ch);
    if (this.pb) ch = this.pb.forward(ch);

    console.log("Forward pb", ch);

    // Rotores forward da direita para a esquerda
    ch = this.r3.forward(ch);
    console.log("R3 forward:", ch);
    ch = this.r2.forward(ch);
    console.log("R2 forward:", ch);
    ch = this.r1.forward(ch);
    console.log("R1 forward:", ch);

    // Reflector
    ch = this.ref.reflect(ch);
    console.log("Reflector:", ch);

    // Rotores backward da esquerda para a direita
    ch = this.r1.backward(ch);
    console.log("R1 backward:", ch);
    ch = this.r2.backward(ch);
    console.log("R2 backward:", ch);
    ch = this.r3.backward(ch);
    console.log("R3 backward:", ch);

    if (this.pb) ch = this.pb.backward(ch);
    console.log("Backward pb:", ch);

    return ch;
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