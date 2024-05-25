import Anthropic from "@anthropic-ai/sdk";
import { RiTruckLine } from "react-icons/ri";
import { getUserInfo } from '@/app/lib/auth';
import { createSupabaseServerClient } from "@/app/supabase.server";
import { ActionFunctionArgs } from "@remix-run/node";
import { delay } from "./utils";
import { decode } from "./decode";
import { sqidify } from "./utils.server";

export async function loadGameSession( gameSessionId: number, copy: boolean, request: any) {
  const { supabaseClient } = createSupabaseServerClient(request)
  const { data: gameSession, error: gameSessionError } = await supabaseClient
    .from('game_sessions')
    .select('*')
    .eq('id', gameSessionId) // TODO: add security re: private/public/unlisted
    .single()

  if (!gameSession) {
    return null
  }
  else {
    return (gameSession)
  }
}

// squidified!
export async function getAllGames(  gameId: number, request: any) {
  const { supabaseClient } = createSupabaseServerClient(request)
  const { data: userInfo, error: userInfoError } = await getUserInfo(request)
  const { data: gameSessions, error: gameSessionsError} = await supabaseClient
    .from('game_sessions')
    .select('*')
    .or(`user_id.eq.${userInfo?.profileId},visibility.eq.public`)
    .eq('game_id', gameId)
    .order('created_at', { ascending: false })
  gameSessions?.forEach((game: any) => {
    game.id = sqidify(game.id);
    game.game_id = sqidify(game.game_id);
    game.user_id = sqidify(game.user_id);
  })
  return { data: gameSessions, error: gameSessionsError }
}

export async function getActiveGames( gameId: number, request: any) {
  const { supabaseClient } = createSupabaseServerClient(request)
  const { data: userInfo, error: userInfoError } = await getUserInfo(request)
  const { data: gameSessions, error: gameSessionsError} = await supabaseClient
    .from('game_sessions')
    .select('*')
    .eq('user_id', userInfo?.profileId)
    .eq('status', 'active')
    .eq('game_id', process.env.NELL_WORDCHAIN_ID)
    .order('created_at', { ascending: false })

  if (!gameSessions || gameSessions?.length == 0) {
    return ([])
  }
  else {
    return (gameSessions)
  }

}

export function generatePromptForReading(readerName: string, subjects: string, genre: string) {
  let prompt = ''
  prompt += `There is a student named ${readerName}. She reads at a first grade level.\n\n`
  prompt += `They are interested in ${subjects}.\n\n`
  prompt += `Write a ${genre} for ${readerName} to read.\n\n`

  prompt += `Explain why these sentences are good for ${readerName}, and what phonemic concepts or reading skills are utilized in these sentences.\n\n`
  prompt += `Return a JSON object like this:\n\n<example>\n{ "readingMaterials": ["I can read!", "Reading is fun."], "conceptExplanation": "These sentences helps practice XX"}\n</example>\n\n`
  prompt += `Do not use apostrophes, single quotes, or double quotes for now. Return only minified JSON object without any markdown tags.`

  return prompt
}


export async function generateClaudeResponse(prompt: string) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  
  const msg = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 4000,
    temperature: 0.5,
    system: "You are an early literacy teacher who is expert in the science of reading. You write decodeable texts for children to learn to read that's aligned with the science of reading.",
    messages: [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": prompt
          }
        ]
      },
      {
        "role": "assistant",
        "content": [
          {
            "type": "text",
            "text": "Here is the JSON requested:\n{"
          }
        ]
      }
    ]
  });

  console.log("Claude Output >> ", msg);

  // TODO: Error handling!
  return { "error": false, "data": JSON.parse("{"+msg.content[0].text) }
}

// * Work Input Model
// * Miranda Input Examples
// * Miranda Prompt Generator
// * Work Output Model (child's progress)
// * Work UI
// * Curriculum

type workInputExample = {
  wordChain: string[]
  conceptExplanation: string
}

let workInputExamples: workInputExample[] = [
  {
    "wordChain": ["cat", "bat", "hat", "hot", "hop", "pop"],
    "conceptExplanation": "These words help practice the short /o/ and /a/ sound."
  },
  {
    "wordChain": ["made", "make", "cake", "lake", "late", "mate"],
    "conceptExplanation": "These words help pratice the long /a/ with magic e."
  }
]

let progressReportExamples = [
  {
    "gameResults": {
    },
  }
]

// export type workInput = {
//   wordChain: string[]
//   conceptExplanation: string
// }

let studentProgress = [
  {
    "game": {
      "wordChain": ["cat", "bat", "hat", "hot", "hop", "pop"],
      "conceptExplanation": "These words help practice the short /o/ and /a/ sound.",
      "date": "2022-02-02",
    },
    "results": [
      {
        "ask": "decode",
        "stem": "cat",
        // "subtitute": "bat",
        "correct": true
      },
      {
        "ask": "encode",
        "stem": "bat",
        "subtitute": "hat",
        "correct": false
      }
    ]
  }
]

let p = {
  "focusConcepts": ["short /o/ and /a/ sound", "digraphs like /sh/ and /ch/"],
  "workInputExamples": [
    {
      "wordChain": ["cat", "bat", "hat", "hot", "hop", "pop"],
      "conceptExplanation": "These words help practice the short /o/ and /a/ sound."
    },
    {
      "wordChain": ["made", "make", "cake", "lake", "late", "mate"],
      "conceptExplanation": "These words help pratice the long /a/ with magic e."
    }
  ]
}

let prompts = {
  "studentProgress": "This represents what the student has done so far. ask=decode means blah blah, ask=encode means blah blah. %%studentProgress%%",
  "workInput": {
    "instructions": `Word Chains games allow a child to focus on sounds without the distraction of graphemes, as each sound is represented by a counter. A single phoneme is changed and the child re-blends to make a new word.\n\nGenerate a word chain that practices these concepts: ${p.focusConcepts.join(", ")}.\n\n`,
    "requirements": ["thing one", "thing two"],
    "examples": `Here are some examples of what you can do. \n\n ${p.workInputExamples.map((e) => { return '<example>\n' + JSON.stringify(e, null, 2) + '\n</example>\n\n' })}`
  },
  "progressReport": {
    "instructions": "Generate a progress report for the student. Format it like so.",
    "examples": "Here is an example of what you can do. %%studentProgress%%"
  }
}

// <WordChainWork />: AI(workInputPrompt) --> UI(workInput)
// <WordChainProgressReport />: AI(progressReportPrompt) --> UI(progressReport)
// <WordChainWorkSetup />
const fake_game_data = {
  "wordChain": [
    {
        "word": "cat",
        "status": "new",
        "task": "decode"
    },
    {
        "word": "rat",
        "status": "new",
        "task": "decode"
    },
    {
        "word": "bat",
        "status": "new",
        "task": "decode"
    },
    {
        "word": "hat",
        "status": "new",
        "task": "decode"
    },
    {
        "word": "hot",
        "status": "new",
        "task": "decode"
    },
    {
      "word": "dot",
      "status": "new",
      "task": "decode"
    },
    {
      "word": "dog",
      "status": "new",
      "task": "decode"
    },
    {
      "word": "dug",
      "status": "new",
      "task": "decode"
    },
    {
      "word": "rug",
      "status": "new",
      "task": "decode"
    }
  ],
  "conceptExplanation": "These words practice the /a/ and /o/ sounds."
}
export async function newWordChainGameData(request: any, gameData: any | null = fake_game_data) {
  // await delay(1000)
  
  // fake_game_data = {
  //   "wordChain": [{"word":"dog","phonemes":["D","AO","G"],"decoded":[["d","D"],["o","AO"],["g","G"]],"task":"decode","status":"new"},{"word":"cat","phonemes":["K","AE","T"],"decoded":[["c","K"],["a","AE"],["t","T"]],"task":"decode","status":"new"},{"word":"run","phonemes":["R","AH","N"],"decoded":[["r","R"],["u","AH"],["n","N"]],"task":"decode","status":"new"},{"word":"jump","phonemes":["JH","AH","M","P"],"decoded":[["j","JH"],["u","AH"],["m","M"],["p","P"]],"task":"decode","status":"new"},{"word":"happy","phonemes":["HH","AE","P","IY"],"decoded":[["h","HH"],["a","AE"],["pp","P"],["y","IY"]],"task":"decode","status":"new"},{"word":"green","phonemes":["G","R","IY","N"],"decoded":[["g","G"],["r","R"],["ee","IY"],["n","N"]],"task":"decode","status":"new"},{"word":"funny","phonemes":["F","AH","N","IY"],"decoded":[["f","F"],["u","AH"],["nn","N"],["y","IY"]],"task":"decode","status":"new"},{"word":"play","phonemes":["P","L","EY"],"decoded":[["p","P"],["l","L"],["ay","EY"]],"task":"decode","status":"new"},{"word":"friend","phonemes":["F","R","EH","N","D"],"decoded":[["f","F"],["r","R"],["i","?"],["e","EH"],["n","N"],["d","D"]],"task":"decode","status":"new"},{"word":"sunshine","phonemes":["S","AH","N","SH","AY","N"],"decoded":[["s","S"],["u","AH"],["n","N"],["sh","SH"],["i","AY"],["n","N"],["e","*"]],"task":"decode","status":"new"}],
  //   "conceptExplanation": "These words get harder and harder"
  // }



  const words =gameData.wordChain.map((e: any) => e.word)
  const decodeDict = await decode(words, request)
  gameData.wordChain = gameData.wordChain.map((e: any) => { return {...e, "phonemes": decodeDict[e.word].phonemes, "decoded": decodeDict[e.word].decoded} }) 
  // console.log("decodeDict", decodeDict)


  // TODO: replace with real data

  return gameData
}

export async function saveWordChainGameData(request: any, game_session: any) {
  const { supabaseClient } = createSupabaseServerClient(request)
  const { error } = await supabaseClient
    .from('game_sessions')
    .update({game_data: game_session.game_data})
    .eq('id', game_session.id)
  if (error) return { success: false, error: error }
  return { success: true }
}