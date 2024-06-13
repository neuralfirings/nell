export function getSupaWordUrl() {
  return process.env.SUPABASE_WORD_URL
}

// "don't give up!" => ["don't", "give", "up"]
// will include: -, '
export function getUniqueWords(text: string) {
  const arr = text.toLowerCase().match(/[\w'-]+/g);
  return [...new Set(arr)];
}

export function getUniqueWord(text: string) {
  return getUniqueWords(text)[0];
}

// "hello!" => [0, 6, 7]
// returns indices of punctuations (excl - and ')
export function getNonMatchIndexes(word: string) {
  const regex = /[\w'-]+/g;
  const matches = [...word.matchAll(regex)];
  const indexes = [];
  let lastIndex = 0;

  for (const match of matches) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      indexes.push(...Array.from({ length: matchIndex - lastIndex }, (_, i) => lastIndex + i));
    }
    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < word.length) {
    indexes.push(...Array.from({ length: word.length - lastIndex }, (_, i) => lastIndex + i));
  }

  return indexes;
}

export function levenshteinDistance(str1: string | any[], str2: string | any[]) {
  // console.log("levenshteinDistance", str1, str2)
  str2 = typeof(str2) == "object" ? str2.map(element => element.split('+')).flat() : str2
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  // Fill the base cases
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // Calculate the Levenshtein distance
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

export async function delay(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms));
  return { "delay": "done", "ms": ms}
  // return "ok"
}



export function getDateTime() {
	return new Date().toLocaleDateString('en-US', {timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true})
}


export function playAudio(audioFile: string | undefined, playbackRate: number = 1, playToNextRatio = 1): Promise<void> {
  return new Promise<void>((resolve) => {
    const audio = new Audio(audioFile);
    audio.playbackRate = playbackRate
    audio.play();
    if (playToNextRatio == 1) {
      audio.onended = () => {
        resolve();
      };
    }
    else {
      console.log("overlap")
      audio.addEventListener('timeupdate', function onTimeUpdate() {
        const timeLeft = audio.duration - audio.currentTime;
        if (timeLeft <= 0.2) { // Check if 200ms or less remaining
          audio.removeEventListener('timeupdate', onTimeUpdate);
          setTimeout(() => {
            resolve();
          }, (timeLeft - 0.2) * 1000); // Resolve after the remaining time minus 200ms
        }
      }); 
    }
  });
}