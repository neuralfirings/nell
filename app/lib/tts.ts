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
  console.log("needWords", needWords)

  // Create an array of promises for each word download
  const downloadPromises = needWords.map(async (word) => {
    word = word.toLowerCase();
    let filepath = WORDS_DIR + word + ".mp3";
    console.log("about to call downloadGC", word, filepath)
    await downloadGC(word, filepath, function (err: any) {
      console.log('in downloadGC callback')
      if (err) {
        console.log("downloadGC Error", err);
        throw err; // Throw the error to reject the promise
      }
      console.log("downloadGC success", word, filepath)
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
  console.log('in downloadGC 1', text)
  try {
    const [response] = await clientTTS.synthesizeSpeech({
      input: {text: text},
      voice: {languageCode: 'en-US', ssmlGender: 'FEMALE', name: 'en-US-Standard-C'}, 
      audioConfig: {audioEncoding: 'MP3'},
    });
    console.log('in downloadGC 2', text)
  }
  catch (err) {
    console.error('Error in downloadGC', err)
  }

  //local storage
  // const writeFile = util.promisify(fs.writeFile);
  // await writeFile(outputFile, response.audioContent, 'binary');
  // console.log(`Audio content written to file: ${outputFile}`);

  // supabase
  console.log('in downloadGC 3', text)
  const audioContent = response.audioContent as Uint8Array;
  const audioBuffer = new Uint8Array(audioContent);
  console.log('in downloadGC 4', text)
  const { supAdmin } = createSuperbaseClient();
  const { data, error } = await supAdmin.storage
    .from('nell')
    .upload(outputFile.replace("./public/audio/", ""), audioBuffer);
  console.log("supabase upload", data, error)

  // callback
	cb()
}

// check if words exists in audio folder
async function checkIfFileExists(words: string[], dir: string) {
	// let haveWords = fs.readdirSync(dir)
	// let needWords = []
	// for (let i = 0; i < words.length; i++) {
	// 	words[i] = words[i].toLowerCase()
	// 	if (!haveWords.includes(words[i] + ".mp3")) {
	// 		needWords.push(words[i])
	// 	}
	// }

	// return needWords

  // supabase
  console.log("checkIfFileExists", words, dir)
  const { supAdmin } = createSuperbaseClient();
  const existingFiles: string[] = [];
  const directory = dir.replace("./public/audio/", "")
  const { data, error } = await supAdmin
    .storage
    .from("nell")
    .list(directory);
  if (error) { throw new Error(error.message); }
  // console.log("supabase list", data, error)
  const existingWords = data.map((file: any) => file.name.replace(".mp3", ""));
  const needWords = words.filter(word => !existingWords.includes(word));
  // console.log("existing > words > need", existingWords, words, needWords)
  return needWords
}

// async function downloadWords(words, callback) {
// 	for (let i = 0; i < words.length; i++) {
// 		words[i] = words[i].toLowerCase()
// 		let filepath = WORDS_DIR + words[i] + ".mp3"
// 		let url = VOICERSS_URL + words[i]
// 		// await download(url, filepath, function(err) { // voicer
// 		await downloadGC(words[i], filepath, function(err) { // google
// 			if (err) {
// 				console.log(err)
// 				res.send(err)
// 			}
// 			else {
// 				console.log('downloaded > ', filepath)
// 				if (i == words.length-1)
// 					callback()
// 			}
// 		});
// 	}
//   console.log(getDateTime(), "end downloading words")
// }

// async function download(url, dest, cb) {
// 	return new Promise((resolve, reject) => {
// 		var file = fs.createWriteStream(dest);
// 		var request = https.get(url, function(response) {
// 			response.pipe(file);
// 			file.on('finish', function() {
// 				file.close(cb);  // close() is async, call cb after close completes.
// 				resolve('success')
// 			});
// 		}).on('error', function(err) { // Handle errors
// 			fs.unlink(dest); // Delete the file async. (But we don't check the result)
// 			if (cb) cb(err.message);
// 			reject(err.message);
// 		});
// 	});
// };


// export async function downloadWords(words: string[]) {
// 	let needWords = checkIfWordExists(words)
// 	if (needWords.length == 0) 
// 		return {"data": 'no need to download'}

// 	// download words
// 	for (let i = 0; i < needWords.length; i++) {
// 		needWords[i] = needWords[i].toLowerCase()
// 		let filepath = WORDS_DIR + words[i] + ".mp3"
// 		// await download(url, filepath, function(err) { // voicer
// 		await downloadGC(words[i], filepath, function(err) { // google
// 			if (err) {
// 				console.log("downloadGC Error", err)
// 				return { error: err }
// 			}
// 			else {
// 				console.log('downloaded > ', filepath)
// 				if (i == words.length-1)
// 					return {"data": "downloaded " + needWords.join(", ")}
// 			}
// 		});
// 	}
//   console.log(getDateTime(), "end downloading words")
// }