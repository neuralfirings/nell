import fs from 'fs'
import textToSpeech from '@google-cloud/text-to-speech';
import { getDateTime } from '@/app/lib/utils'
import util from 'util'
import { createSupabaseServerClient, createSuperbaseClient } from '../supabase.server';

const WORDS_DIR = "./public/audio/words/"
const INSTRUCTIONS_DIR = "./public/audio/instructions/"

type instructionsTTSRequest = {
  name: string,
  instruction: string
}

export async function downloadInstructions(instructions: instructionsTTSRequest[]): Promise<{ status?: string, description?: string, error?: any }> {
  console.log('instructions', instructions)
  const names = instructions.map(e => e.name);
  let needInstructions = await checkIfFileExists(names, INSTRUCTIONS_DIR);
  console.log("needInstructions", needInstructions)
  if (needInstructions.length === 0) {
    return { status: 'no need to download' };
  }
  
  const downloadPromises = instructions.map(async (instruction) => {
    if (needInstructions.includes(instruction.name)) {
      let filepath = INSTRUCTIONS_DIR + instruction.name + ".mp3";
      await downloadGC(instruction.instruction, filepath, function (err: any) {
        if (err) {
          console.log("downloadGC Error", err);
          throw err; // Throw the error to reject the promise
        }
      });
    }
  });

  try {
    await Promise.all(downloadPromises);
    return { status: 'success', description: `downloaded ${needInstructions.join(", ")}` };
  }
  catch (err) {
    console.log("Error downloading instructions:", err);
    return { error: err };
  }
}

export async function downloadWords(words: string[]): Promise<{ status?: string, description?: string, error?: any }>{
  let needWords = await checkIfFileExists(Array.from(new Set(words)), WORDS_DIR);
  if (needWords.length === 0) {
    return { status: 'no need to download' };
  }
  console.log("need to download", needWords)

  // Create an array of promises for each word download
  const downloadPromises = needWords.map(async (word) => {
    word = word.toLowerCase();
    let filepath = WORDS_DIR + word + ".mp3";
    await downloadGC(word, filepath, function (err: any) {
      if (err) {
        throw err; // Throw the error to reject the promise
      }
    });
  });

  try {
    await Promise.all(downloadPromises);
    return { status: 'success', description: `downloaded ${needWords.join(", ")}` };
  } 
	catch (err) {
    console.log("Error downloading words:", err);
    return { error: err };
  }
}

const clientTTS = new textToSpeech.TextToSpeechClient();
async function downloadGC(text: string, outputFile: any , cb: any) {
  const [response] = await clientTTS.synthesizeSpeech({
    input: {text: text},
    voice: {languageCode: 'en-US', ssmlGender: 'FEMALE', name: 'en-US-Standard-C'}, 
    audioConfig: {audioEncoding: 'MP3'},
  });

  // supabase
  const audioContent = response.audioContent as Uint8Array;
  const audioBuffer = new Uint8Array(audioContent);
  const { supAdmin } = createSuperbaseClient();
  const { data, error } = await supAdmin.storage
    .from('nell')
    .upload(outputFile.replace("./public/audio/", ""), audioBuffer);
  
  // callback
	cb()
}

// check if words exists in audio folder
async function checkIfFileExists(words: string[], dir: string) {
  const { supAdmin } = createSuperbaseClient();
  const existingFiles: string[] = [];
  const directory = dir.replace("./public/audio/", "")
  const { data, error } = await supAdmin
    .storage
    .from("nell")
    .list(directory);
  if (error) { throw new Error(error.message); }
  const existingWords = data.map((file: any) => file.name.replace(".mp3", ""));
  const needWords = words.filter(word => !existingWords.includes(word));
  return needWords
}