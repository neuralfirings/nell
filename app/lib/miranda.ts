import Anthropic from "@anthropic-ai/sdk";
import { RiTruckLine } from "react-icons/ri";
import { getUserInfo, sessionToUserInfo } from '@/app/lib/auth';
import { createSupabaseServerClient, createSuperbaseClient } from "@/app/supabase.server";
import { ActionFunctionArgs } from "@remix-run/node";
import { prependToFile } from "./utils.server";
import { decode } from "./decode";
import { sqidify } from "./utils.server";
import OpenAI from "openai";

const openai = new OpenAI();

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

export function testFS() {
  prependToFile("/logs/claude.log", "Hello World!")
}

export async function generateGPTReponse(prompt: string) {
  if (true) {
    const gptOutput = {
      "id": "chatcmpl-9WX1Ir5272P816jU3WiPSA15Z9jDP",
      "object": "chat.completion",
      "created": 1717540452,
      "model": "gpt-4o-2024-05-13",
      "choices": [
        {
          "index": 0,
          "message": {
            "role": "assistant",
            "content": "{\"wordChain\":[\"bad\",\"sad\",\"dad\",\"had\",\"ham\",\"jam\"],\"conceptExplanation\":\"This is a fake GPT response. Want a real one? Turn off the fake toggle in generateGPTReponse function.\"}"
          },
          "logprobs": null,
          "finish_reason": "stop"
        }
      ],
      "usage": {
        "prompt_tokens": 4091,
        "completion_tokens": 62,
        "total_tokens": 4153
      },
      "system_fingerprint": "fp_319be4768e"
    }
    return { error: null, data: JSON.parse(gptOutput.choices[0].message.content ?? '')}
  }


  const gptInput: any = {
    messages: [
      { 
        role: "system", 
        content: "You are an early literacy teacher who is expert in the science of reading. You write decodeable texts for children to learn to read that's aligned with the science of reading." 
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
          }
        ]
      }
    ],
    model: "gpt-4o",
  }
  
  const gptOutput = await openai.chat.completions.create(gptInput);

  console.log("GPT Input >> ", gptInput);
  console.log("GPT Output >> ", gptOutput);
  prependToFile("./logs/gpt.log", JSON.stringify({time: new Date(), input: gptInput, output: gptOutput}, null, 2)+'\n')

  return { error: null, data: JSON.parse(gptOutput.choices[0].message.content ?? '')}
}

export async function generateClaudeResponse(prompt: string) {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  
  const claudeInput: any = {
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
  }
  const claudeOutput = await anthropic.messages.create(claudeInput);

  console.log("Claude Input >> ", claudeInput);
  console.log("Claude Output >> ", claudeOutput);
  prependToFile("./logs/claude.log", JSON.stringify({time: new Date(), input: claudeInput, output: claudeOutput}, null, 2)+'\n')

  // TODO: Error handling!
  return { "error": null, "data": JSON.parse("{"+claudeOutput.content[0].text) }
}

// * Work Input Model
// * Miranda Input Examples
// * Miranda Prompt Generator
// * Work Output Model (child's progress)
// * Work UI
// * Curriculum

const WORD_CHAIN_EXAMPLES = [
  {
    "wordChain": ["cat", "bat", "hat", "hot", "hop", "pop"],
    "conceptExplanation": "Based on your progress, you need some help with short vowels. Let's focus on the short vowel sounds today, like /o/ and /a/."
  },
  {
    "wordChain": ["made", "make", "cake", "lake", "late", "mate"],
    "conceptExplanation": "Based on your progress, you are doing great with short vowels and consonant blends. However, you seem to struggle with long vowels with magic e. Let's pratice the long /a/ with magic e today."
  }
]
const PROMPT_LIST = {
  "createWordChainGame": `Your task is to create a Word Chain Game for this child, and return a JSON object. When creating a game, keep in mind the child's current literacy level, and create a game to challenge the child and help them learn new concepts. If they've mastered CVC words, they should progress to consonant blends. If they have show to struggle with CVC, given them more practice with CVC words. Here is a progression to follow: short vowels (CVC), consonant blends (CCVC, CVCC), digraphs, long vowels with magic e, r controlled vowels, long vowel teams, other vowel teams, diphthongs, silent letters, suffixes and prefixes, low frequency spelling.\n\nWord Chains games allow a child to focus on sounds without the distraction of graphemes, as each sound is represented by a counter. A single phoneme is changed and the child re-blends to make a new word. The word chain should contain no repeated words.\n\nHere are some examples showing the structure of JSON you should return. The content of the JSON object should be adapted to the child's level. \n\n${WORD_CHAIN_EXAMPLES.map((e) => { return '<example>\n' + JSON.stringify(e, null, 2) + '\n</example>\n\n' })}Return just the JSON object without any pre-amble. Return only the minified JSON object without any markdown tags.`,
  "progressReport": {
    "instructions": "Generate a progress report for the student. Format it like so.",
    "examples": "Here is an example of what you can do. %%studentProgress%%"
  }
}

// <WordChainWork />: AI(workInputPrompt) --> UI(workInput)
// <WordChainProgressReport />: AI(progressReportPrompt) --> UI(progressReport)
// <WordChainWorkSetup />
const fake_game_data = { "wordChain": [ { "word": "cat", "status": "new", "task": "decode" }, { "word": "rat", "status": "new", "task": "decode" }, { "word": "bat", "status": "new", "task": "decode" }, { "word": "hat", "status": "new", "task": "decode" }, { "word": "hot", "status": "new", "task": "decode" }, { "word": "dot", "status": "new", "task": "decode" }, { "word": "dog", "status": "new", "task": "decode" }, { "word": "dug", "status": "new", "task": "decode" }, { "word": "rug", "status": "new", "task": "decode" } ], "conceptExplanation": "These words practice the /a/ and /o/ sounds." }

function composeProgressPrompt(subject: any, progressData: any, game: string) {
  let prompt = `Here is some data which shows a child's ability engage in ${subject}.\n\n${JSON.stringify(progressData)}\n\n`
  
  const { tasks, assists } =  getUniqueTasksAndAssists(progressData)
  
  prompt += `For the task object, `
  tasks.forEach((task: any) => {
    if (task == "wordChainDecode") {
      prompt += `"wordChainDecode" means the child has been asked to read the word after hearing a similar word that has one phoneme different than this word. `
    }
    else if (task == "read") {
      prompt += `"read" means the child was asked to read the word.`
    }
  })
  prompt += `\n\n`

  prompt += `For the assist object, `
  assists.forEach((assist: any) => {
    if (assist == "heard_sound_out") {
      prompt += `"heard_sound_out" means the child heard the phonemes of the word as help. `
    }
  })

  return prompt
}

function getUniqueTasksAndAssists(data: any) {
  const tasks = new Set();
  const assists = new Set();

  data.forEach((item: any)=> {
    if (item.task) {
      tasks.add(item.task);
    }
    
    if (item.assists) {
      item.assists.forEach((assist: any) => {
        assists.add(assist);
      });
    }
  });

  return {
    tasks: Array.from(tasks),
    assists: Array.from(assists)
  };
}

export async function newWordChainGameData(request: any, gameData: any | null = null) {
  // generate AI if gameData = null
  console.log("newWordChainGameData", gameData)
  if (gameData == null) {
    // generate AI for gameData
    console.log("Miranda is feeling lucky!! She's gonna talk to Claude...")
    const { data: progressData, error: progressError } = await getProgress(request, "early_literacy")
    if (progressError) throw new Error(progressError.message)
    
    let prompt = ""
    prompt += composeProgressPrompt("early_literacy", progressData, "wordchain") + '\n\n'
    // console.log("prompt", prompt)"
    
    prompt += '\n\n' + PROMPT_LIST.createWordChainGame

    // console.log('prompt', prompt)
    const { data: claudeResponseData, error: claudeResponseError } = await generateGPTReponse(prompt) //generateClaudeResponse(prompt)
    console.log('Claud says', claudeResponseData, claudeResponseError)
    claudeResponseData.wordChain = claudeResponseData.wordChain.map((e: any) => { return {"word": e, "status": "new", "task": "decode"} })
    console.log('cleaned up game data', claudeResponseData)
    gameData = claudeResponseData
  }  

  // decode the words
  const words =gameData.wordChain.map((e: any) => e.word)
  const decodeDict = await decode(words, request)
  gameData.wordChain = gameData.wordChain.map((e: any) => { return {...e, "phonemes": decodeDict[e.word].phonemes, "decoded": decodeDict[e.word].decoded} }) 
  // console.log("decodeDict", decodeDict)

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

async function getProgress(request: any, subject: string) {
  const { supabaseClient } = createSupabaseServerClient(request)
  const {data: userInfo} = await getUserInfo(request)
  const { data: progressData, error: progressError } = await supabaseClient.from("progress")
    .select("timestamp, task, word, completed, assists")
    .eq('subject', subject)
    .eq('account_id', userInfo?.profileId)
    .order('timestamp', { ascending: false })
    .limit(100)
  progressData?.filter((item: any) => item.task != null && item.completed != null)
  return { data: progressData, error: progressError }
}