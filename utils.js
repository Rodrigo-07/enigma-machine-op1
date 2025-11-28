function  toIndex(char) {
    return char ? char.charCodeAt(0) - 65 : 0;
  }

function  toChar(index) {
    return String.fromCharCode(index + 65);
  }

function mod(n, m) {
    return ((n % m) + m) % m;
  }

module.exports = {
  toIndex,
  toChar,
  mod
};