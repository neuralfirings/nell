import { json, redirect, ActionFunction, ActionFunctionArgs, LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { useActionData, useLoaderData, Form, useNavigation, useSubmit, useFetcher, useSearchParams} from '@remix-run/react'
import { Container, Paper, Button, Alert, Title, Text, Anchor, Space, Code, Group, UnstyledButton, ActionIcon } from '@mantine/core'
import { LoadingScreen } from '@/app/components/utils';
import { desqidify } from '@/app/lib/utils.server';
import { createSupabaseServerClient } from '@/app/supabase.server';
import { NellWordDisplay } from '@/app/components/nellUI';
import { useEffect, useRef, useState } from 'react';
import { PHONEME_AUDIO_LENGTH, SLOW_SOUND_OUT, FAST_SOUND_OUT, MEDIUM_SOUND_OUT } from "@/app/lib/configs";
import { getUniqueWord, getUniqueWords } from '@/app/lib/utils';
import { FaArrowRight, FaCheck, FaCheckDouble, FaInfo, FaX } from 'react-icons/fa6';
import { FaInfoCircle, FaSave, FaUndo } from 'react-icons/fa';

export const action: ActionFunction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  console.log(Object.fromEntries(formData))

  // do stuff
  return null
}

export const loader: LoaderFunction = async  ({ request, params }: LoaderFunctionArgs) => {
  const sqid = params.sqid as string
  const id = desqidify(sqid)
  const { supabaseClient } = createSupabaseServerClient(request)
  const { data, error } = await supabaseClient
    .from('game_sessions')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return json({error: error.message})
  
  const currentPageIndex = data.progress.pages.findIndex((p: any) => p.status === "new" || p.status === "in progress") // TODO: un-hardcode this
  // console.log("cpi", currentPageIndex)
  
  const currentPage = {
    text: data.progress.pages[currentPageIndex]
  }

  // #region download audio
  const dict = data.game_data.dict
  // if (typeof process === "undefined") {
    const url = new URL(request.url);
    const origin = url.origin;
    const allWords = Object.keys(dict) // data.game_data.wordChain.map((link: any) => link.word)
    // console.log("download words", allWords)
    const formData = new FormData();
    formData.append('text', allWords.join(" "))
    fetch(origin+'/api/tts', { method: 'POST', body: formData})
      .then(response => {
        if (!response.ok) { throw new Error('Network response was not ok'); }
        return response.json();
      })
      .then((data: any) => { console.log('TTS response data:', data); })
      .catch(error => { console.error('Error:', error); });
  // }
  // #endregion
 
  return json({ currentPageIndex, currentPage, gameData: data, sqid: sqid })
}

export default function Page() {
  const actionData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  const currentPageWords = loaderData.currentPage.text.text.split(" ")
  const dict = loaderData.gameData.game_data.dict
  const currentPageIndex = loaderData.currentPageIndex

  useEffect(() => {
    const url = new URL(window.location.href);
    const refreshParam = url.searchParams.get("refresh");
    if (refreshParam == "clean") {
      console.log("so fresh and so clean clean")
      url.searchParams.delete("refresh");
      window.history.replaceState({}, document.title, url.toString());
      window.location.reload();
    }
  })

 
  const submit = useSubmit()
  // console.log(dict["sam"].decoded)
  // console.log("p", loaderData.gameData.progress)

  const states = loaderData.states
  const [progress, setProgress] = useState(loaderData.gameData.progress) //loaderData.gameData.progress)
  const [currWordStatus, setCurrWordStatus] = useState("") 
  const [wordStatuses, setWordStatuses] = useState(progress.pages[currentPageIndex].wordStatuses || Array(currentPageWords.length).fill("")) //(word.status);
  const [currWordIndex, setCurrWordIndex] = useState(wordStatuses.findIndex((status: string) => status == "") || 0);


  const handlePhonemeHelped = (i: number) => {
    if (i == currWordIndex && currWordStatus != "couldNotRead") {
      setCurrWordStatus("readWithHelp")
    }
    // TODO: handle when phoneme is clicked on another word
  }

  // #region helpButton
  // Making the Help button call its component's soundOut function, speed will start slow and eventually reveal word
  const helpActionRefs = useRef<{ [key: number]: (sp: number) => void }>({});
  const [helpSpeed, setHelpSpeed] = useState(SLOW_SOUND_OUT);
  if (currWordIndex == -1) {
    setCurrWordIndex(wordStatuses.length)
  } 
  const handleHelpClick = (i: number) => {
    helpActionRefs.current[i](helpSpeed);
    setHelpSpeed(helpSpeed == SLOW_SOUND_OUT ? MEDIUM_SOUND_OUT : helpSpeed == MEDIUM_SOUND_OUT ? FAST_SOUND_OUT : FAST_SOUND_OUT-1)
    if (helpSpeed < FAST_SOUND_OUT) {
      setCurrWordStatus("couldNotRead")
    }
    else {
      setCurrWordStatus("readWithHelp")
    }
  }
  const saveHelpActionRef = (key: number, helpActionRef: (sp: number) => void) => {
    helpActionRefs.current[key] = helpActionRef;
  };
  // #endregion

  function handleNextWord(status: string | null) {
    console.log("next word", status)
    const t = JSON.parse(JSON.stringify(progress))
    if (t.pages[currentPageIndex].status === "new") {
      t.pages[currentPageIndex].status = "in progress"
    }

    // define local var wordStatus
    let wordStatus = ""
    if (status == null) {
      wordStatus = helpSpeed < FAST_SOUND_OUT 
        ? "couldNotRead" 
        : helpSpeed == SLOW_SOUND_OUT && (currWordStatus == "" || currWordStatus == "new")
          ? "read"
          : "readWithHelp"
    }
    else {
      wordStatus = status
    }

    // add assists to progress
    if (wordStatus == "readWithHelp") {
      if (t.pages[currentPageIndex].assists["heard_sound_out"] == undefined)
        t.pages[currentPageIndex].assists["heard_sound_out"] = []
      t.pages[currentPageIndex].assists["heard_sound_out"].push(getUniqueWord(currentPageWords[currWordIndex]))        
    }
    else if (wordStatus == "couldNotRead") {
      if (t.pages[currentPageIndex].assists["heard_word"] == undefined)
        t.pages[currentPageIndex].assists["heard_word"] = []
      t.pages[currentPageIndex].assists["heard_word"].push(getUniqueWord(currentPageWords[currWordIndex]))    
    }
    setProgress(t)

    // set word status to read if not already done
    if (currWordStatus == "") {
      setCurrWordStatus("read")
    }
    setWordStatuses(wordStatuses.map((status: any, index: any) => index == currWordIndex ? wordStatus : status))
    setCurrWordIndex(currWordIndex + 1)
    setHelpSpeed(SLOW_SOUND_OUT)
    setCurrWordStatus("")
    // console.log("wordStatuses", wordStatuses) 
  }
  function handleUndoCurrWord() {
    if (currWordIndex > 0) {
      setHelpSpeed(SLOW_SOUND_OUT)
      setCurrWordStatus("")
      setWordStatuses(wordStatuses.map((status: any, index: number) => index == currWordIndex-1 ? "" : status))
      const t = JSON.parse(JSON.stringify(progress))
      for (let k in t.pages[currentPageIndex].assists) {
        t.pages[currentPageIndex].assists[k].pop(getUniqueWord(currentPageWords[currWordIndex-1]))
      }

      setProgress(t)
      setCurrWordIndex(currWordIndex - 1)
    }
  }
  function handleSaveProgress() {
    // console.log("fake save", progress, wordStatuses, currWordIndex, currentPageWords)
    
    // if last word is done, page status should change
    // console.log("currWordIndex", currWordIndex, currentPageWords.length)
    const t = JSON.parse(JSON.stringify(progress))
    if (currWordIndex == currentPageWords.length) {
      console.log("page done")
      t.pages[currentPageIndex].status = "done"
      // setProgress(t)
      // console.log("post set progress", progress.pages[0])
    }
    // save progress by calling /save action
    const formData = new FormData();
    // console.log("post post set progress", progress.pages[0])
    formData.append("progress", JSON.stringify(t))
    formData.append("wordStatuses", JSON.stringify(wordStatuses))
    formData.append("currPageIndex", currentPageIndex)
    console.log("formData", Object.fromEntries(formData))
    submit(formData, {
      method: "post", 
      action: `/g/stories/${loaderData.sqid}/save`
    })
  }

  // useEffect(() => {
  //   if (fetcher.data) {
  //     console.log("fetched", fetcher.data)
  //   }
  // }, [fetcher.data])

  return (
    <Container style={{width: "100%"}}>
      {navigation.state === 'submitting' && (<LoadingScreen />)}
      <Group justify="space-between">
        <div>
          Page {currentPageIndex+1} of {loaderData.gameData.progress.pages.length}
        </div>
        <ActionIcon radius="xl" onClick={handleSaveProgress} variant="light"><FaSave /></ActionIcon>
      </Group>
      <Paper withBorder shadow="sm" p="md" my="sm" radius="md" >
        <Group justify="center">
          {currentPageWords.map((word: string, index: number) => (
            <NellWordDisplay  
              key={index}
              keyProp={index}
              word={word} 
              decoded={dict[getUniqueWords(word.toLowerCase())[0]].decoded} 
              status={wordStatuses[index]}
              monticolors={false}
              onHelpActionRef={saveHelpActionRef}
              callBackPhonemeClick={() => handlePhonemeHelped(index)}
            />
          ))}
        </Group>
        <Group justify="center">
          <Button my="md" onClick={() => handleHelpClick(currWordIndex)}><FaInfoCircle />&nbsp;Hint</Button>
        </Group>
        <Group justify="right">
          <ActionIcon radius="xl" size="md" variant="subtle" color="gray.3" onClick={() => handleNextWord("couldNotRead")}><FaX /></ActionIcon>
          <ActionIcon radius="xl" size="md" variant="subtle" color="gray.3" onClick={() => handleNextWord("readWithHelp")}><FaCheck /></ActionIcon>
          <ActionIcon radius="xl" size="md" variant="subtle" color="gray.3" onClick={() => handleNextWord("read")}><FaCheckDouble /></ActionIcon>
          <ActionIcon radius="xl" size="md" variant="subtle" color="gray.3" onClick={handleUndoCurrWord}><FaUndo /></ActionIcon>
          <ActionIcon radius="xl" size="md" variant="subtle" color="gray.3" onClick={() => handleNextWord(null)}><FaArrowRight /></ActionIcon>
          {/* <UnstyledButton onClick={() => handleNextWord(null)}>Next</UnstyledButton> */}
          {/* <UnstyledButton onClick={handleUndoCurrWord}>Undo</UnstyledButton> */}
          {/* <UnstyledButton onClick={handleSaveProgress}>Save</UnstyledButton> */}
          {/* <UnstyledButton onClick={() => console.log(currWordIndex, currWordStatus, wordStatuses)}>Get Word Status</UnstyledButton> */}
        </Group>
      </Paper>
      {/* <Code block>
        {JSON.stringify({actionData, loaderData}, null, 2)}
      </Code> */}
    </Container>
  )
}

function data(value: any) {
  throw new Error('Function not implemented.');
}
