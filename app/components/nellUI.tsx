import { useState } from "react";
import { Button, Group, Flex, UnstyledButton, Box} from "@mantine/core";
import { useSwipeable } from "react-swipeable";
import { decodedWord, graphemePhonemePair } from '@/app/definitions'
import { PHONEME_AUDIO_LENGTH, SLOW_SOUND_OUT, FAST_SOUND_OUT, MEDIUM_SOUND_OUT } from "@/app/lib/configs";
import { getNonMatchIndexes, getUniqueWord } from "@/app/lib/utils";

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

export function NellWordDisplay({keyProp, word, decoded, status, onHelpActionRef, callBackPhonemeClick}: 
  {
    keyProp: number, 
    word: string,  
    decoded: graphemePhonemePair[] | null, 
    status: string | null, 
    onHelpActionRef: (key: number, helpActionRef: (sp: number) => void) => void ,
    callBackPhonemeClick?: () => void | null
  }
) {
  const [activeGrapheme, setActiveGrapheme] = useState<number | null>(null);

  // decoded => decoded with cap
  let wIdx = 0
  let punctuationIndices = getNonMatchIndexes(word)
  let decodedWithCap = []
  if (decoded != null) {
    for (let w=0, d=0; w<word.length; null) {
      if (punctuationIndices.includes(w)) {
        decodedWithCap.push([word[w], ""])
        w++
      } 
      else {
        decodedWithCap.push([
          word.slice(w, w+decoded[d][0].length),
          decoded[d][1]
        ])
        w += decoded[d][0].length
        d++
      }
    }
  }

  // click a phoneme
  const handlePhonemeClick = (phoneme: string) => () => {
    const audio = new Audio(`/audio/phonemes/${phoneme}.mp3`);
    audio.playbackRate = PHONEME_AUDIO_LENGTH / MEDIUM_SOUND_OUT
    audio.play()

    if (typeof callBackPhonemeClick === 'function')
      callBackPhonemeClick()
  }

  // sound out the word
  const soundOut = (speed: number) =>  {
    // console.log("soundOut", speed)
    let delay = 0;
    decodedWithCap?.forEach((pair, index) => {
      if (pair[1] != "*" && pair[1] != "_" && pair[1] != "?" && pair[1] != "") {
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
    const justWord = getUniqueWord(word)
    console.log("handleSayWordClick", justWord, `https://fdyaqvgimrebqczodjqq.supabase.co/storage/v1/object/public/nell/words/${justWord}.mp3`)
    const audio = new Audio(`https://fdyaqvgimrebqczodjqq.supabase.co/storage/v1/object/public/nell/words/${justWord}.mp3`);
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

  function ignorePhoneme(phoneme: string) {
    return phoneme === "*" || phoneme === "_" || phoneme === "?" || phoneme === ""
  }
  return (
    <>    
      <Flex direction="column" gap="sm" 
        px={30} // extra padding for swiping 
        mx={-20} // scoots over to counteract the extra padding
        // style={{border: "solid 1px"}}
        {...swipeHandlers} 
      >
        <Group {...swipeHandlers} gap={5}>
          {decodedWithCap?.map((pair, index) => (
            ignorePhoneme(pair[1]) ?
              <UnstyledButton
                size="xl" 
                key={index}
                c="gray.6"
                style={{ fontSize: 64, height: 80, lineHeight: "80px" }} 
                px={5}
                disabled
              >
                {pair[0]}
              </UnstyledButton>
            :
              <Button
                variant="light"
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
        <Box bg={statusToColor(status)} style={{height: 15, borderRadius: 5}}></Box>
        {/* Underline => sound out word */}
        {/* <Button onClick={() => handleSayWordClick(word)}
          color={statusToColor(status)} //"gray.3"
          style={{
            height: 15,
          }}
        >            
        </Button> */}
      </Flex>
    </>
  )
}
