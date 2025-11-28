// Utils
function toIndex(char) {
    return char ? char.charCodeAt(0) - 65 : 0;
}

function toChar(index) {
    return String.fromCharCode(index + 65);
}

function mod(n, m) {
    return ((n % m) + m) % m;
}

// Rotor configurations
const ROTORES = {
    I:   { circuito: "EKMFLGDQVZNTOWYHXUSPAIBRCJ", catraquinha: 'Q' },
    II:  { circuito: "AJDKSIRUXBLHWTMCQGZNPYFVOE", catraquinha: 'E' },
    III: { circuito: "BDFHJLCPRTXVZNYEIWGAKMUSQO", catraquinha: 'V' },
    IV:  { circuito: "ESOVPZJAYQUIRHXLNFTGKDCMWB", catraquinha: 'J' },
    V:   { circuito: "VZBRGITYUPSDNHLXAWMJQOFECK", catraquinha: 'Z' },
};

// Rotor Class
class Rotor {
    constructor(tipo, posicao = 0) {
        const config = ROTORES[tipo];
        if (!config) throw new Error(`Rotor inválido: ${tipo}`);

        this.tipo = tipo;
        this.right = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        this.left = config.circuito;
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

// Reflector Class
class Reflector {
    constructor(mappingString) {
        if (!mappingString || mappingString.length !== 26) {
            throw new Error("Reflector mapping must be 26 characters long");
        }
        this.left = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        this.right = mappingString.toUpperCase().split("");
    }

    reflect(value) {
        let index;
        if (typeof value === "number") {
            index = value;
        } else if (typeof value === "string" && value.length === 1) {
            index = toIndex(value);
        } else {
            throw new Error("Reflector.reflect() only accepts char or index.");
        }
        if (index < 0 || index > 25) {
            throw new Error("Index out of range for reflector.");
        }
        const reflectedChar = this.right[index];
        return toIndex(reflectedChar);
    }
}

// Plugboard Class
class Plugboard {
    constructor(connections = {}) {
        this.connections = connections;
    }

    getMappedChar(char) {
        return this.connections[char] || char;
    }

    process(charIndex) {
        const char = toChar(charIndex);
        const outChar = this.getMappedChar(char);
        return toIndex(outChar);
    }
}

// Enigma Machine Class
class Enigma {
    constructor(reflector, r1, r2, r3, plugboard) {
        this.ref = reflector;
        this.r1 = r1;
        this.r2 = r2;
        this.r3 = r3;
        this.pb = plugboard;
    }

    stepRotors() {
        // Double stepping mechanism
        if (this.r2.reached_notch()) {
            this.r2.rotate();
            this.r1.rotate();
        } else if (this.r3.reached_notch()) {
            this.r2.rotate();
        }
        this.r3.rotate();
    }

    encipher(charIndex) {
        // Step rotors before encryption
        this.stepRotors();

        // Plugboard forward
        let current = this.pb ? this.pb.process(charIndex) : charIndex;

        // Forward through rotors (right to left)
        current = this.r3.forward(current);
        current = this.r2.forward(current);
        current = this.r1.forward(current);

        // Reflector
        current = this.ref.reflect(current);

        // Backward through rotors (left to right)
        current = this.r1.backward(current);
        current = this.r2.backward(current);
        current = this.r3.backward(current);

        // Plugboard backward
        current = this.pb ? this.pb.process(current) : current;

        return current;
    }

    encipherLetter(letter) {
        const index = toIndex(letter.toUpperCase());
        const resultIndex = this.encipher(index);
        return toChar(resultIndex);
    }
}

export { Rotor, Reflector, Plugboard, Enigma, toChar, toIndex };
