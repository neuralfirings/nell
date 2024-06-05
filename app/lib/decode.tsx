import { levenshteinDistance } from '@/app/lib/utils';
// import { connectToDatabase } from "@/app/lib/mongodb"
import {TextPhonemeObject, graphemePhonemePair, decodedWord, graphemePhonemeObject} from '@/app/definitions'

import { createSupabaseServerClient } from '@/app/supabase.server'
import { LoaderFunctionArgs } from '@remix-run/node';
import { IsAny } from 'mongodb';

// tests
// digraph (ar), blends (st), silent e (a-e), ed (ed), unknown sound (women, ocean)
// ["cat", "dog", "bike", "stop", "motion", "ocean", "brakeman", "women", "stake", "catnap", "ox", "articulate"]
// ["motion", "brakeman", "women"]
// curious friend special courage

// input: ["cat"]

const DEBUG = false

// let db: any // MongoDB
let supabaseClient: any // Supabase
export async function decode(words: string[], request: any) {
  console.log("decode function", words, new Date().toLocaleTimeString())

  const { supabaseClient } = await createSupabaseServerClient(request)

  let txtPhObj: TextPhonemeObject = getPhonemes(words)

  let out: { [key: string]: decodedWord } = {}


  const {data: g2p} = await supabaseClient
    .from('g2p')
    .select('*')

  const decodePromises = Object.entries(txtPhObj).map(async ([word, phonemes]) => {
    let decodedWordArr: graphemePhonemePair[] = await decodeWord(word, phonemes, g2p);
    let decodedWordStr = JSON.stringify(decodedWordArr).replaceAll('"', '');
    return [word, decodedWordArr];
  });

  const results = await Promise.all(decodePromises);
  // console.log('restuls', results, new Date().toLocaleTimeString())

  results.forEach(([word, decodedWordArr]) => {
    out[word] = {
      word: word,
      phonemes: txtPhObj[word],
      decoded: decodedWordArr,
    };
  });

  return out;
}

// input: "cat", ["K", "AE", "T"]
// output: [["c","K"],["a","AE"],["t","T"]]
async function decodeWord(word: string, ph: string[], g2p: any): Promise<graphemePhonemePair[]> {
  let w = word.toLowerCase().trim()

  // ex phonemeExpanded (w = "car")
  // => [ [ "K", "K+AA", "K+AA+R", "AA", "AA+R", "R" ] ]
  let phonemeExpanded = []
  for (let i = 0; i < ph.length; i++) {
    let subset: string = "";
    for (let j = i; j < ph.length; j++) {
      subset += (j > i ? "+" : "") + ph[j];
      phonemeExpanded.push(subset);
    }
  }
  if (DEBUG) console.log("phonemeExpanded", phonemeExpanded)

  // Supabase (too many calls once you are decoding lots of words)
  // const {data: g2p} = await supabaseClient
  //   .from('g2p')
  //   .select('*')
  //   .or(phonemeExpanded.map((e) => `sounds.cs.["${e}"]`).join(","))
  
  // ex soundMap (w = "car")
  // => [ [ [ 'c', 'K' ] ], [ [ 'ar', 'AA+R' ], [ 'a' , 'AA' ] ], [ [ 'r', 'R' ] ] ]
  let soundMap = []
  for (let i = 0; i < g2p.length; i++) {
    let regex = new RegExp(g2p[i].regex)
    let text = g2p[i].text
    let sounds = g2p[i].sounds

    let soundsInWord = sounds.filter(item => phonemeExpanded.includes(item))

    if (regex.test(w) && soundsInWord.length > 0) {
      let indices = indexOfAll(w, regex)
      indices.map((i) => {
        if (soundMap[i] == undefined) soundMap[i] = []
        soundsInWord.map((s) => { soundMap[i].push([text, s]) })
      })
    }
  }

  // if sound pairing is empty, replace with "_" (silence) 
  // ex: car => [ [ 'c', '_' ], [ 'ar', 'AA+R' ] ]
  w.split("").map((e, i) => { soundMap[i] = soundMap[i] == undefined ? [[e, "_"]] : soundMap[i] }); 

  // generate combinations
  // ex: => [["c","K"],["a","AA"],["r","R"]], [["c","K"],["ar","AA+R"]]]
  let soundMapOptions = generateCombinations(soundMap)
  let soundMapOptionsBackup = JSON.parse(JSON.stringify(soundMapOptions))

  // handle magic e // BUG: overcome
  // b,a-e,k,e => b,a,k,(e)
  // console.log("soundMapOptions1", soundMapOptions[2])
  for (let i=0; i<soundMapOptions.length; i++) { // i: [["c","K"],["a-e","AY"],["k", "K"], ["e", "*"]]
    for (let j=0; j<soundMapOptions[i].length; j++) { // j: ["a-e","AY"]
      if (soundMapOptions[i][j][0].includes("-")) {
        soundMapOptions[i][j][0] = soundMapOptions[i][j][0].split("-")[0]
        soundMapOptions[i][j+2][1] = soundMapOptions[i][j+2][0] == "e" ? "*" : soundMapOptions[i][j+2][1] 
          // FIX LATER technically this invalidates the "e" without removing the consonant
      }
    }
    soundMapOptions[i] = soundMapOptions[i].filter(element => element !== undefined);
  }
  // console.log("soundMapOptions2", soundMapOptions[2])
  
  // handle digraphs
  // c+ar+r => c+ar
  for (let i=0; i<soundMapOptions.length; i++) { // i: [["c","K"],["ar","AA+R"],["r", "R"]]
    for (let j=0; j<soundMapOptions[i].length; j++) { // j: ["ar","AA+R"]
      if (soundMapOptions[i][j] != undefined) 
        for (let k=1; k<soundMapOptions[i][j][0].length; k++) { // k: "ar"
          soundMapOptions[i][j+k] = undefined
        }
    }
    soundMapOptions[i] = soundMapOptions[i].filter(element => element !== undefined);
  }

  // pick best option based on levenshtein distance 
  // ex: ["c","K"],["a","AA"],["r","R"]]
  let decodedMap: graphemePhonemePair[]
  let scores: number[] = []
  for (let i = 0; i < soundMapOptions.length; i++) {
    let compareWord = soundMapOptions[i].map((e) => e[0])
    let comparePhoneme = soundMapOptions[i].map((e) => e[1])
    let score = 0
    score += levenshteinDistance(w, compareWord.join(''))
    score += levenshteinDistance(ph, comparePhoneme)
    scores[i] = score
  }
  let winningIdx = scores.indexOf(Math.min(...scores))
  if (DEBUG) console.log("winning", winningIdx, soundMapOptionsBackup[winningIdx])
  decodedMap = soundMapOptions[scores.indexOf(Math.min(...scores))]

  // remove errors (w/O o/AH m/M e/AH n/N) => (w/O o/_ m/M e/AH n/N)
  // console.log("decodedMap", decodedMap)
  let diffIndices = findDiffIndices(ph, decodedMap.map((e) => e[1]))
  if (DEBUG) console.log("diffIndices", diffIndices)
  diffIndices.map((i) => { decodedMap[i] != undefined ? decodedMap[i][1] = "?" : ""})

  return decodedMap;
}

// input: [['a'], ['b', 'c'], ['d']]
// output: [['a', 'b', 'd'], ['a', 'c', 'd']]
function generateCombinations(input: string[][]): string[][] {
  // console.log("generateCombo", input)
  const output: string[][] = [];

  function backtrack(combination: string[], index: number): void {
    if (index === input.length) {
      output.push(combination);
      return;
    }

    for (let i = 0; i < input[index].length; i++) {
      backtrack([...combination, input[index][i]], index + 1);
    }
  }

  backtrack([], 0);
  return output;
}

// Lost of Test Cases
// ['K', 'AE', 'T'], ['K', 'AE', 'T'] => []
// ['K', 'AE', 'T'], ['K', 'X', 'T'] => [1]
// ['K', 'AE', 'T'], ['K',' X',  'AE', 'T'] => [1]
// ['K', 'AE', 'T'], ['K', 'X', 'X'] => [1, 2]
// ['K', 'AE', 'T'], ['K', 'AE', 'T', 'X'] => [3]
// ['K', 'AE', 'T'], ['K', 'T'] => []
// ['K', 'AE', 'T'], ['K','AE', 'AE', 'T'] => [2]
// ['AA', 'R', 'T'], ['AA+R','T'] => []
// ['AA', 'R', 'T'], ['AA+R','X'] => [1]
function findDiffIndices(ref: string[], compare: string[]): number[] {
  if (DEBUG) console.log("findDiffIndices", ref, compare)
  let compareExploded = compare.map(element => element.split('+')).flat()
  let diffIndices = [];

  for (let i = 0, rIdx=0, cIdx=0; i<100 && cIdx<compareExploded.length ; i++, cIdx++, rIdx++) {
    if (ref[rIdx] != compareExploded[cIdx]) {
      diffIndices.push(cIdx)
      if (compareExploded[cIdx] == "*") { // ignore silent e
        rIdx--
        diffIndices.pop()
      }
      else if (compareExploded[cIdx+1] == ref[rIdx]) { // [a, b, c] vs. [x, a, b, c]
        rIdx--
      }
      else if (compareExploded[cIdx] == ref[rIdx+1]) { // [a, b, c] vs. [b, c]
        cIdx--
        diffIndices.pop()
      }
    }
  }

  // c = ["AA", "K+S"]
  // compare = ["AA", "K", "S"]
  // map = [0, 1, 1]
  let map = []
  for (let i=0; i<compare.length; i++) {
    for (let j=0; j<compare[i].split("+").length; j++) {
      map.push(i)
    }
  }
  diffIndices.map((e, i) => { diffIndices[i] = map[e] })
  
  return diffIndices;
}

// input: indexOfAll("catnap", /a/)
// output: [1, 4]
function indexOfAll(str: string, regex: RegExp): number[] {
  let indexes: number[] = []
  let match: RegExpExecArray | null;
  if (!regex.global) { // make global
    regex = new RegExp(regex.source, "g");
  }
  while ((match = regex.exec(str)) !== null) {
    indexes.push(match.index);
  }
  
  return indexes
}

import { getCMUPhonemeFor } from '@/app/lib/cmu.server.js'

// input: ["cat"]
// output: {"cat": ["K", "AE", "T"]}
function getPhonemes(words: string[]): TextPhonemeObject {
  let output = {}
	for (let i=0; i<words.length; i++) {
		let w = ""
		if (words[i].word != undefined)
			w = words[i].word
		else
			w = words[i]
    w = w.toLowerCase()
    if (getCMUPhonemeFor(w) != undefined) {
      let CMUNYL = getCMUPhonemeFor(w)
				.replaceAll("0", "")
				.replaceAll("1", "")
				.replaceAll("2", "")
			CMUNYL = " " + CMUNYL + " "
			output[w] = CMUNYL.trim().split(" ")
		}
    else {
      output[w]= ['']
    }
	} 
  return output
}
