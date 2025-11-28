const { Enigma } = require("./EnigmaMachine");

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const config = {
    rotors: [
      { type: "I",   ring: "A", position: "A" },
      { type: "II",  ring: "A", position: "A" },
      { type: "III", ring: "A", position: "A" },
    ],
    reflector: { type: "B" },
    plugboardPairs: ["AB", "CD"],
  };

const enigma1 = Enigma.fromConfig(config);
const mensagemOriginal = "HELLO WORLD";
const mensagemCifrada = enigma1.encipherString(mensagemOriginal);
console.log(`\nMensagem Original: ${mensagemOriginal}`);
console.log(`Mensagem Cifrada:  ${mensagemCifrada}`);

console.log("\n=== DECIFRANDO MENSAGEM ===");
const enigma2 = Enigma.fromConfig(config);
const mensagemDecifrada = enigma2.encipherString(mensagemCifrada);
console.log(`\nMensagem Cifrada:   ${mensagemCifrada}`);
console.log(`Mensagem Decifrada: ${mensagemDecifrada}`);

console.log(`\nVerificação: ${mensagemOriginal.replace(/\s/g, '')} === ${mensagemDecifrada.replace(/\s/g, '')} ? ${mensagemOriginal.replace(/\s/g, '') === mensagemDecifrada.replace(/\s/g, '')}`);