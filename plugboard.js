const { toChar, toIndex } = require('./utils');

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

module.exports = Plugboard;