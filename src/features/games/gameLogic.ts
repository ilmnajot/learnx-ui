import { shuffled } from '../../components/ui'

export function tokenize(sentence: string): string[] {
  return sentence.trim().split(/\s+/)
}

/** Shuffles a sentence's words, guaranteeing the result isn't already correct when that's possible. */
export function scramble(sentence: string): string[] {
  const words = tokenize(sentence)
  if (new Set(words).size < 2) return words
  let result = shuffled(words)
  while (result.join(' ') === words.join(' ')) result = shuffled(words)
  return result
}

/** Compares ignoring case and end punctuation, because the structure is what the game practises. */
export function sameSentence(a: string, b: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim()
  return normalize(a) === normalize(b)
}
