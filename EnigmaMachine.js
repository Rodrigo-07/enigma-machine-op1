const Rotor = require("./Rotor");
const Reflector = require("./Reflector");
const Plugboard = require("./Plugboard");

class Enigma {
    // Parametros
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
  
    set_rotors(rotors) {
        if (!Array.isArray(rotors) || rotors.length < 3) {
            throw new Error("É preciso ter pelo menos 3 rotores.");
        }

        this.r1 = rotors[0];
        this.r2 = rotors[1];
        this.r3 = rotors[2];
    }

    encipher(ch) {
        console.log("Entrada:", ch);
        if (this.pb) ch = this.pb.forward(ch);

        console.log("Forward pb", ch);

        // ROtores forward da direita para a esquerda
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
        if (this.r4) ch = this.r4.backward(ch);
        console.log("R4 backward:", ch);

        if (this.pb) ch = this.pb.backward(ch);
        console.log("Backward pb:", ch);

        return ch;
    }
  }
  
  module.exports = { Enigma };
  