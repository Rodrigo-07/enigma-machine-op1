const { toChar, toIndex } = require("./utils");

class Reflector {
    constructor(mappingString) {
        if (!mappingString || mappingString.length !== 26) {
            throw new Error("Reflector mapping must be 26 characters long");
        }

        this.left = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        this.right = mappingString.toUpperCase().split("");
    }
    /**
     * @param {string|number} value 
     * @returns {number} 
     */
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

module.exports = Reflector;
