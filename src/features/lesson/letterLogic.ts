import type { Letter } from '../../api/types'
import { shuffled, speak } from '../../components/ui'

/** "Hear" plays a sound and asks for the letter; "see" shows a shape and asks for its sound. */
export interface Round {
  kind: 'hear' | 'see'
  answer: Letter
  shown?: string
  options: Letter[]
}

const OPTION_COUNT = 4

/** A native recording when there is one, otherwise the device's Arabic voice. */
export function playLetter(letter: Letter): void {
  if (letter.audioUrl) {
    void new Audio(letter.audioUrl).play().catch(() => speak(letter.say, 0.7, 'ar-SA'))
    return
  }
  speak(letter.say, 0.7, 'ar-SA')
}

/** Wrong answers come first from the letters learners confuse with this one, then from the rest. */
export function optionsFor(answer: Letter, all: Letter[]): Letter[] {
  const others = all.filter((l) => l.glyph !== answer.glyph)
  const similar = shuffled(others.filter((l) => answer.similar.includes(l.glyph)))
  const rest = shuffled(others.filter((l) => !answer.similar.includes(l.glyph)))
  return shuffled([answer, ...[...similar, ...rest].slice(0, OPTION_COUNT - 1)])
}

/**
 * Two listening rounds and three reading rounds, one for each position in a word. The second listening round uses
 * a look-alike or sound-alike letter the learner has already met, so they practise telling the two apart.
 */
export function buildRounds(letter: Letter, all: Letter[]): Round[] {
  const index = all.findIndex((l) => l.glyph === letter.glyph)
  const learned = index > 0 ? all.slice(0, index) : []
  const contrast = learned.find((l) => letter.similar.includes(l.glyph)) ?? learned.at(-1) ?? letter
  return [
    { kind: 'hear', answer: letter, options: optionsFor(letter, all) },
    { kind: 'hear', answer: contrast, options: optionsFor(contrast, all) },
    { kind: 'see', answer: letter, shown: letter.initialForm, options: optionsFor(letter, all) },
    { kind: 'see', answer: letter, shown: letter.medialForm, options: optionsFor(letter, all) },
    { kind: 'see', answer: letter, shown: letter.finalForm, options: optionsFor(letter, all) },
  ]
}
