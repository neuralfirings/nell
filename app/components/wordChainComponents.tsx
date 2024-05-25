// <WordChainWork />: AI(workInputPrompt) --> UI(workInput)
// <WordChainProgressReport />: AI(progressReportPrompt) --> UI(progressReport)
// <WordChainWorkSetup />

import { useEffect, useRef, useState } from "react";
import { Form } from "@remix-run/react";
import { Anchor, Button, Group, Code, Title, Paper, Space, Alert, Text, Flex, Modal, Center, Box, Stack } from "@mantine/core";
import { FaCheck, FaCheckDouble } from "react-icons/fa6";
import { FaInfoCircle, FaUndo } from "react-icons/fa";

import { NellWordDisplay } from "@/app/components/nellUI";
import { playAudio } from "@/app/lib/utils";
import { PHONEME_AUDIO_LENGTH, SLOW_SOUND_OUT, FAST_SOUND_OUT, MEDIUM_SOUND_OUT } from "@/app/lib/configs";



export function NewWordChainGameButton({text, variant="white"}: {text: string, variant: string}) {
  return (
    <>
      <Form method="post" action="/g/wordchain/new">
        <Button variant={variant} type="submit">{text}</Button>
      </Form>
    </>
  )
}

// TODO: activeGames type
export function WordChainGameUI({data}: {data: any}) {
  console.log("WordChainGameUI Render", data)
  const maxWordIdx = data.game_data.wordChain.length - 1
  const [wordIdx, setWordIdx] = useState(1)
  const word =  data.game_data.wordChain[wordIdx] 
  const [wordStatus, setWordStatus] = useState(word.status);
  const [gameEnded, setGameEnded] = useState(false);
  const [newGame, setNewGame] = useState(true);

  // handleWordTransition(wordIdx, wordIdx + 1, true);

  // #region download audio
  const allWords = data.game_data.wordChain.map((link: any) => link.word)
  console.log("all words in game", allWords)
  const formData = new FormData();
  formData.append('text', allWords.join(" "))
  fetch('/api/tts', { method: 'POST', body: formData})
    .then(response => {
      if (!response.ok) { throw new Error('Network response was not ok'); }
      return response.json();
    })
    // .then(data => { console.log('Response data:', data); })
    .then(data)
    .catch(error => { console.error('Error:', error); });
  // #endregion

  // #region enable audio for ios
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(true);
  useEffect(() => {
    const newAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(newAudioContext);

    // Check if audio autoplay is supported
    const promise = newAudioContext.resume();
    if (promise !== undefined) {
      promise.then(() => {
        setIsAudioEnabled(true);
    }).catch((error) => {
        console.log('Audio autoplay is not supported:', error);
      });
    } else {
      setIsAudioEnabled(true);
    }

    // Check if the user is on an iOS device
    const isIOSDevice = () => {
      return (
        ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) ||
        (navigator.userAgent.includes('Mac') && 'ontouchend' in document)
      );
    };

    setIsIOS(isIOSDevice());
    // console.log("isIOS", isIOS)
  }, []);

  const requestAudioPermission = async () => {
    if (!audioContext) return;

    try {
      await audioContext.resume();
      setIsAudioEnabled(true);
      setIsModalOpen(false);
    } catch (error) {
      console.log('User did not grant audio permission:', error);
    }
  };
  // #endregion

  // #region helpButton
  // Making the Help button call its component's soundOut function, speed will start slow and eventually reveal word
  const helpActionRefs = useRef<{ [key: number]: (sp: number) => void }>({});
  const [helpSpeed, setHelpSpeed] = useState(SLOW_SOUND_OUT);
  const handleHelpCLick = () => {
    console.log("HelpClick", wordIdx, helpActionRefs)
    helpActionRefs.current[wordIdx](helpSpeed);
    setHelpSpeed(helpSpeed == SLOW_SOUND_OUT ? MEDIUM_SOUND_OUT : helpSpeed == MEDIUM_SOUND_OUT ? FAST_SOUND_OUT : FAST_SOUND_OUT-1)
    if (helpSpeed < FAST_SOUND_OUT) {
      setWordStatus("couldNotRead")
    }
    else {
      setWordStatus("readWithHelp")
    }
  }
  const saveHelpActionRef = (key: number, helpActionRef: (sp: number) => void) => {
    helpActionRefs.current[key] = helpActionRef;
  };
  // #endregion

  // set the word status, if last word then save, if not then move to next word
  const setWordStatusWrapper = async (status: string) => {
    data.game_data.wordChain[wordIdx].status = status
    setWordStatus(status);
    if (wordIdx == maxWordIdx) {
      // save to db
      console.log("Game Over")
      setGameEnded(true)
      // saveWordChainGameData(request, data) 
    }
    else {
      handleWordTransition(wordIdx, wordIdx+1, true)
    }
  }

  async function handleWordTransition(idx1: number, idx2: number, resetHelpState: boolean) {
    // const idx1 = wordIdx
    // const idx2 = wordIdx+1
    setWordIdx(idx1)
    await playAudio(`/audio/instructions/wc_wordis.mp3`)
    await playAudio(`/audio/words/${data.game_data.wordChain[idx1].word}.mp3`)
    await playAudio(`/audio/instructions/wc_ifchange.mp3`)
    const phDiff = detectPhonemeDiff(data.game_data.wordChain[idx1].decoded, data.game_data.wordChain[idx2].decoded)[0] // assume one for now
    await playAudio(`/audio/phonemes/${phDiff[0][1]}.mp3`, PHONEME_AUDIO_LENGTH / FAST_SOUND_OUT)
    await playAudio(`/audio/instructions/wc_to.mp3`)
    setWordIdx(idx2)
    if (resetHelpState) {
      setWordStatus(data.game_data.wordChain[wordIdx+1].status)   
      setHelpSpeed(SLOW_SOUND_OUT)
    }
    await playAudio(`/audio/phonemes/${phDiff[1][1]}.mp3`, PHONEME_AUDIO_LENGTH / FAST_SOUND_OUT)
    await playAudio(`/audio/instructions/wc_whatnow.mp3`)
  }

  function detectPhonemeDiff(ph1: string[][], ph2: string[][]) {
    let diff = []
    for (let i = 0; i < Math.min(ph2.length, ph1.length); i++) {
      if (ph1[i][1] != ph2[i][1]) {
        diff.push([ph1[i], ph2[i]])
      }
    }
    return diff
  }

  return (
    <>
      <Box style={{ display: 'flex', flexDirection: 'column', minHeight: '70vh' }}>
        <Paper withBorder shadow="md" p={30} mt="sm" radius="md" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

            {newGame && (
              <>
                <Stack justify="center" align="center" h={300}>
                  <Title>Word Chain Game</Title>
                  <Alert color="blue">
                    {data.game_data.conceptExplanation}
                  </Alert>
                  {/* <p>Some instructions on how it's played</p> */}
                  <p>{data.game_data.wordChain.map(e => e.word).join(" -> ")}</p>
                  <Button size="xl" onClick={() =>{ 
                    setNewGame(false)
                    requestAudioPermission(); 
                    handleWordTransition(wordIdx-1, wordIdx, false)
                  }}>
                    Start Game
                  </Button>
                </Stack>
              </>
            )}
            {!newGame && (
              <>
                <Stack justify="center">
                  <NellWordDisplay  
                    keyProp={wordIdx}
                    word={word.word} 
                    decoded={word.decoded} 
                    status={wordStatus}
                    onHelpActionRef={saveHelpActionRef}
                  />
                  <Group justify="center" >
                    <Button onClick={handleHelpCLick} disabled={wordIdx == 0}>Hint</Button>
                    <Button variant="transparent" onClick={() => handleWordTransition(wordIdx-1, wordIdx, false)} disabled={wordIdx == 0}>
                      <FaInfoCircle />
                    </Button>
                  </Group>
                </Stack>
              </>
            )}
        </Paper>
        <Space mt="md" />
        {false && isIOS && !isAudioEnabled && (
          <Modal
            removeScrollProps={{ allowPinchZoom: true }}
            opened={isModalOpen}
            onClose={() => requestAudioPermission()}
            title="How this works"
          >
            <div style={{ height: "80vh" }} >
              <Text>Lorem ipsum. Some graphics on how this works and the UI.</Text>
              <Space mt="md" />
              <Button onClick={requestAudioPermission}>Start Playing</Button>
            </div>          
          </Modal>
        )}
        {!gameEnded && !newGame && (
          <Group justify="right">
            <Anchor c="blue.2" onClick={() => setWordStatus("unread")}><FaUndo /></Anchor>
            {(wordStatus == "new" || wordStatus == "unread" || wordStatus == "read" ) && (
              <Anchor c="blue.2" variant="outline" onClick={() => setWordStatusWrapper("read")}><FaCheckDouble /></Anchor>
            )}
            {(wordStatus == "readWithHelp" || wordStatus == "couldNotRead") && (
              <Anchor c="blue.2" variant="outline" onClick={() => setWordStatusWrapper(wordStatus)}><FaCheck /></Anchor>
            )}
          </Group>
        )}
        {gameEnded && (
          <Group justify="center">
            <Form method="post" action="/g/wordchain/save">
              <input type="hidden" name="gameData" value={JSON.stringify(data.game_data)} />
              <input type="hidden" name="id" value={data.id} />
              <input type="hidden" name="status" value="completed" />
              <Button type="submit">Save Game</Button>
            </Form>
          </Group>
        )}
        <Space mt="sm" />
      </Box>
    </>
  )
}

export function WordChainProgressReport() {
  return (
    <>
      WordChainProgressReport UI Placeholder
    </>
  )
}

export function WordChainWorkSetup() {
  return (
    <>
      WordChainWorkSetup UI Placeholder
    </>
  )
}



