import { useState } from "react";
import { Button, Group, Flex} from "@mantine/core";
import { useSwipeable } from "react-swipeable";
import { decodedWord, graphemePhonemePair } from '@/app/definitions'
import { PHONEME_AUDIO_LENGTH, SLOW_SOUND_OUT, FAST_SOUND_OUT, MEDIUM_SOUND_OUT } from "@/app/lib/configs";

// ex: "I am a cat"
export function NellTextDisplay({text, decoded}: {text: string,  decoded: {[key: string]: decodedWord} | null}) {
  let words = text.split(" ")
  words.map((word, i) => {  
    console.log("word", word, i, decoded?.[word]) // Added null check for decoded object
  })

  return (
    words.map((word, i) => {
      // <NellWordDisplay word={word} decoded={decoded[word]} />
    })
  )
}

export function NellWordDisplay({keyProp, word, decoded, status, onHelpActionRef}: 
  {keyProp: number, word: string,  decoded: graphemePhonemePair[] | null, status: string | null, onHelpActionRef: (key: number, helpActionRef: (sp: number) => void) => void }
) {
  const [activeGrapheme, setActiveGrapheme] = useState<number | null>(null);

  // click a phoneme
  const handlePhonemeClick = (phoneme: string) => () => {
    const audio = new Audio(`/audio/phonemes/${phoneme}.mp3`);
    audio.playbackRate = PHONEME_AUDIO_LENGTH / MEDIUM_SOUND_OUT
    audio.play()
  }

  // sound out the word
  const soundOut = (speed: number) =>  {
    console.log("soundOut", speed)
    let delay = 0;
    decoded?.forEach((pair, index) => {
      if (pair[1] != "*" && pair[1] != "_" && pair[1] != "?") {
        // await playAudio(`/audio/phonemes/${pair[1]}.mp3`, Math.min(MEDIUM_SOUND_OUT, PHONEME_AUDIO_LENGTH / speed))
        setTimeout(() => {
          setActiveGrapheme(index);
          const audio = new Audio(`/audio/phonemes/${pair[1]}.mp3`);
          audio.playbackRate = Math.min(MEDIUM_SOUND_OUT, 1500 / speed)
          audio.play();
          audio.onended = () => {
            setActiveGrapheme(null);
          };
        }, delay);
        delay += speed*.8; // Adjust the delay between each sound (in milliseconds)
      }
    });
  }

  // say the word
  const handleSayWordClick = (word: string) => {
    console.log("handleSayWordClick", word)
    const audio = new Audio(`/audio/words/${word}.mp3`);
    // audio.playbackRate = 1500 / 800
    audio.play()
  }

  // swipey swipe
  const swipeHandlers = useSwipeable({
    onSwiped: (eventData) => {
      const { velocity } = eventData;
      console.log("swipe velocity", velocity)
      const msPerPhoneme = Math.min(SLOW_SOUND_OUT, ((1-Math.min(1,velocity)) * 1500)+400)
      console.log(msPerPhoneme)
      if (msPerPhoneme < 600) {
        console.log('say?', word)
        handleSayWordClick(word)
      }
      else {
        soundOut(Math.max(600, msPerPhoneme))
      }

      // if (Math.abs(velocity) > swipeThreshold) {
      //   soundOut(600)
      // } else {
      //   soundOut(1500)
      // }
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  onHelpActionRef(keyProp, (sp) => {
    if (sp >= 600) 
      soundOut(sp)
    else
      handleSayWordClick(word)
  })

  const statusToColor = (status: string | null) => {
    switch (status) {
      case "read":
        return "teal.4"
      case "readWithHelp":
        return "teal.2"
      case "couldNotRead":
        return "red.2"
      case "unread":
        return "gray.3"
      default:
        return "gray.3"
    }
  }

  const vowels = ["a", "e", "i", "o", "u", "ee", "oa", "oi", "oo", "ou", "ow", "oy", "ea", "ie", "ai", "ay", "ey", "ea", "ie", "igh", "y", "er", "ir", "ur", "or", "ar", "aw", "au", "al", "oo", "ew", "ue", "ui", "eu", "oi", "oy", "ow", "ou", "air", "ear", "ure", "oor", "are", "eer", "ier"]

  return (
    <>    
      <Flex direction="column" gap="sm" 
        px={30} // extra padding for swiping 
        mx={-20} // scoots over to counteract the extra padding
        // style={{border: "solid 1px"}}
        {...swipeHandlers} 
      >
        <Group {...swipeHandlers} gap={5}>
          {decoded?.map((pair, index) => (
            <Button
              variant='light'
              size="xl" 
              key={index}
              color={vowels.includes(pair[0]) ? "blue" : "red"}
              style={{ 
                fontSize: 64, height: 80, border: "none",
                boxShadow: activeGrapheme === index ? "0 0 10px rgba(0,0,0,0.3)" : "none",
              }} 
              onClick={handlePhonemeClick(pair[1])}
              px={5}
            >
              {pair[0]}
            </Button>
          ))}
        </Group>
        {/* <Button onClick={handleSoundOutClick(decoded)}>Help</Button> */}
        <Button onClick={() => handleSayWordClick(word)}
          color="gray.3"
          style={{
            height: 15,
          }}
        >            
        </Button>

        {/* <Button onClick={() => {soundOut(600)}}>Sound Out</Button> */}
      </Flex>
    </>
  )
}
