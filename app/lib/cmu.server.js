import { createRequire } from 'module';
const require = createRequire(import.meta.url);

var CMUDict = require('cmudict').CMUDict;
var cmudict = new CMUDict();

export function getCMUPhonemeFor(word) {
  return cmudict.get(word);
}