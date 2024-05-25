// ex: {"car": ["K", "AA", "R"]}
export type TextPhonemeObject = {
  [key: string]: string[];
}

// ex: ["c","K"],["a","AA"],["r","R"]
export type graphemePhonemePair = {
  [0]: string;
  [1]: string;
}

// ex: {"word": "car", "phonemes": ["K", "AA", "R"], "decoded": [["c","K"],["a","AA"],["r","R"]]}
export type decodedWord = {
  word: string,
  phonemes: string[],
  decoded: graphemePhonemePair[]
}

// db: g2p
export type graphemePhonemeObject = {
  text: string,
  regex: string,
  sounds: string[],
  example: string,
  blend: boolean
}