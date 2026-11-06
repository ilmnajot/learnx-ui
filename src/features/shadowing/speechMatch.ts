/** Compares what a learner said with the target sentence, word by word. Runs in the browser, so it costs nothing. */

const CONTRACTIONS: Record<string, string[]> = {
  "i'm": ['i', 'am'],
  "you're": ['you', 'are'],
  "we're": ['we', 'are'],
  "they're": ['they', 'are'],
  "it's": ['it', 'is'],
  "that's": ['that', 'is'],
  "here's": ['here', 'is'],
  "there's": ['there', 'is'],
  "i've": ['i', 'have'],
  "we've": ['we', 'have'],
  "i'll": ['i', 'will'],
  "we'll": ['we', 'will'],
  "it'll": ['it', 'will'],
  "you'll": ['you', 'will'],
  "i'd": ['i', 'would'],
  "isn't": ['is', 'not'],
  "aren't": ['are', 'not'],
  "wasn't": ['was', 'not'],
  "don't": ['do', 'not'],
  "doesn't": ['does', 'not'],
  "didn't": ['did', 'not'],
  "haven't": ['have', 'not'],
  "won't": ['will', 'not'],
  "can't": ['can', 'not'],
  cannot: ['can', 'not'],
}

export const PASS_PERCENT = 80

function clean(word: string): string {
  return word.toLowerCase().replace(/[’`]/g, "'").replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '')
}

function tokens(word: string): string[] {
  const cleaned = clean(word)
  if (!cleaned) return []
  return CONTRACTIONS[cleaned] ?? [cleaned]
}

function splitWords(sentence: string): string[] {
  return sentence.trim().split(/\s+/).filter(Boolean)
}

/** Longest common subsequence: words must be in order, but extra or skipped words don't break the rest. */
function matchedTargetIndexes(target: string[], heard: string[]): Set<number> {
  const lengths = Array.from({ length: target.length + 1 }, () => new Array<number>(heard.length + 1).fill(0))
  for (let i = target.length - 1; i >= 0; i--) {
    for (let j = heard.length - 1; j >= 0; j--) {
      const row = lengths[i] as number[]
      const next = lengths[i + 1] as number[]
      row[j] = target[i] === heard[j]
        ? (next[j + 1] as number) + 1
        : Math.max(next[j] as number, row[j + 1] as number)
    }
  }
  const matched = new Set<number>()
  let i = 0
  let j = 0
  while (i < target.length && j < heard.length) {
    if (target[i] === heard[j]) {
      matched.add(i)
      i++
      j++
    } else if ((lengths[i + 1]?.[j] as number) >= (lengths[i]?.[j + 1] as number)) {
      i++
    } else {
      j++
    }
  }
  return matched
}

export interface WordResult {
  word: string
  matched: boolean
}

export interface SpeechMatch {
  words: WordResult[]
  percent: number
  passed: boolean
}

export function compareSpeech(target: string, heard: string): SpeechMatch {
  const displayWords = splitWords(target)
  const targetTokens: string[] = []
  const owners: number[] = []
  displayWords.forEach((word, index) => {
    for (const token of tokens(word)) {
      targetTokens.push(token)
      owners.push(index)
    }
  })
  const heardTokens = splitWords(heard).flatMap(tokens)
  const matched = matchedTargetIndexes(targetTokens, heardTokens)

  const words = displayWords.map((word, index) => {
    const own = owners.flatMap((owner, tokenIndex) => (owner === index ? [tokenIndex] : []))
    return { word, matched: own.length > 0 && own.every((tokenIndex) => matched.has(tokenIndex)) }
  })
  const percent = targetTokens.length === 0 ? 0 : Math.round((matched.size / targetTokens.length) * 100)
  return { words, percent, passed: percent >= PASS_PERCENT }
}
