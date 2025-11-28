# enigma-machine-op1

Este repositório contém uma implementação em JavaScript (Node.js) de uma máquina Enigma simplificada, com suporte a rotores, refletor e plugboard. É útil para estudo histórico/educacional sobre como a Enigma funcionava e para experimentos com cifra de substituição rotativa.

**Arquivos principais**
- `EnigmaMachine.js`: implementação da máquina Enigma (montagem, configuração e fluxo de cifragem).
- `Rotor.js`: implementação dos rotores, fiação, rotação e notch.
- `reflector.js`: implementa o refletor (tipos B/C suportados via configuração).
- `plugboard.js`: implementa a troca via plugboard (pares de letras).
- `utils.js`: utilitários de conversão entre letra/índice e operações mod.
- `main.js`: exemplo de uso e runner para cifrar/decifrar uma mensagem.

**Pré-requisitos**
- Node.js (v12+ recomendado). Verifique com `node -v`.

**Como rodar**
1. Abra um terminal na pasta do projeto (onde está `main.js`).
2. Execute:

```
node main.js
```

O `main.js` cria uma instância da Enigma via `Enigma.fromConfig(...)`, cifra a mensagem `HELLO WORLD`, e tenta decifrá-la novamente usando a mesma configuração (mostra saída no console).

**Configuração rápida**
- A configuração padrão usada em `main.js`:

```js
const config = {
	rotors: [
		{ type: "I",   ring: "A", position: "A" },
		{ type: "II",  ring: "A", position: "A" },
		{ type: "III", ring: "A", position: "A" },
	],
	reflector: { type: "B" },
	plugboardPairs: ["AB", "CD"],
};
```

- `rotors`: array com até 3 rotores (tipos suportados: `I`, `II`, `III`, `IV`, `V`).
- `ring`: posição da anilha (A–Z). Atualmente passado ao construtor do rotor.
- `position`: posição inicial do rotor (A–Z). `Enigma.fromConfig` chama `rotate_to` para ajustar.
- `reflector.type`: `B` (padrão) ou `C`.
- `plugboardPairs`: array de pares de letras (ex: `"AB"`) que o plugboard deve trocar.

**Exemplo de uso (API)**
- Criar uma Enigma a partir da configuração:

```js
const { Enigma } = require('./EnigmaMachine');
const enigma = Enigma.fromConfig(config);
const cipher = enigma.encipherString('HELLO WORLD');
```

- Para decifrar, crie uma nova instância com a mesma configuração e posições iniciais, então chame `encipherString` com o texto cifrado.

**Notas importantes**
- A implementação faz a rotação dos rotores antes de cifrar cada caractere (com notches e dupla-rotação aproximada implementadas).
- Espaços são preservados; caracteres que não estiverem em A–Z são ignorados.
- O projeto é educacional — não use para necessidades reais de segurança.
