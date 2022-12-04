import { assign, createMachine } from "xstate";

interface HangmanContext {
  word: string
  guessedLetters: { correct: string, incorrect: string },
  triesRemaining: number
  hasWon: boolean
}

enum ACTIONS {
  SETWORD = 'SETWORD',
  HANDLEGUESS = 'HANDLEGUESS',
  RESET = 'RESET',
  CHECKHASWON = 'CHECKHASWON'
}

enum GUARDS {
  HASWON = "HASWON",
  HASLOST = "HASLOST",
}

const initialContext: HangmanContext = {
  word: '',
  guessedLetters: { correct: '', incorrect: '' },
  triesRemaining: 7,
  hasWon: false
}

const handleTries = (context: HangmanContext, event: { letter: string }) => {
  if (!context.word.includes(event.letter)) {
    return context.triesRemaining - 1
  }
  return context.triesRemaining
}

const handleGuess = (context: HangmanContext, event: { letter: string }) => {
  const { correct, incorrect } = context.guessedLetters
  const nextGuessedLetters = { correct, incorrect }

  // CORRECT GUESS
  if (context.word.includes(event.letter)
    && !context.guessedLetters.correct.includes(event.letter)) {
    nextGuessedLetters.correct = correct + event.letter
  }

  // INCORRECT GUESS
  if (!context.word.includes(event.letter)
    && !incorrect.includes(event.letter)) {
    nextGuessedLetters.incorrect = incorrect + event.letter
  }

  return nextGuessedLetters
}

const setWord = (_: HangmanContext, event: { word: string }) => event.word

const canSpellWord = (word: string, letters: string) => {
  // Convert the word and letters to lowercase for easy comparison
  const wordLower = word.toLowerCase();
  const lettersLower = letters.toLowerCase();

  // Loop through each letter in the word
  for (const letter of wordLower) {
    // If the current letter is not in the string of letters, return false
    if (!lettersLower.includes(letter)) {
      return false;
    }
  }
  // If all the letters in the word are in the string of letters, return true
  return true;
}

const handleHasWon = (ctx: HangmanContext) => canSpellWord(ctx.word, ctx.guessedLetters.correct)

export const hangmanMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5QAsCGA7KBbDBZVAxsgJbpgB0phALsQG5gDEAkgHLMAqA2gAwC6iUAAcA9rGK0R6QSAAeiAKwAWJeQCMADgDsChQE4AbErUAmBWoA0IAJ6INJ8nq0GFBjQadq1OpQF9fVmiYOOj4RKQUNPRMuACCANIAogDiAKqJAMoZvAJIIKLiktJ58ghKJla2CGpu5C5KToZqAMxa3lp6-oEY2HiEJGTkUQyMrADyHABKzJmTiXFsbMk5MgUSxFIypSY8qvpemloaGs08PJY2iCZaDkodmiY7mmd+ASBBvaH9EUMEtCMAdTGkwAImlMhlEiCVnk1kUtldduR9l5tMdTudKohmrU9GpjGo9M0TK0Ok4uu8eiEwgNIn9oowYcIxOtNiVEXs8aijiczhcqsSHHpyjpmsYFDcFBSPtTvoNhkwuGpcszChtiqBtkiUYd0XysQhHgZkTwjjUTEStEpdBppVS+uFBgB3UiMOaQ7j8VYs+HshAKVrkHjNPQ8UPGDS6O4G04KcghhTnJxaVo7W1vGUO2nkAA2YiY7sSnpV+R96oR-sDwdD4c0Ua0BrTjgMZ3sLm8xma-je6BEEDgMkzX0dYG9arZmsQAFoDAaZ0GzudlKbms1IyS7cEsz8qPSGGPWRq5IgDC5yDozuZ9GuJc0Daig14eCcLYn3PpN58aT8FQffZP-Q0ZFdCcJRmjUMM9BMdxZ0uQ0PHPDsrQ0HgPBTdNui3YdsxdI84XLP1jC0YC9CgngzEeJRgxja5HGJLQrRxSN9E6DN7Wwn481gUdYTLCdjzKbwSLIiiTCou84JJNRyAaI5UyUFwUNeTCvzlCgwHQVAACMc0gP8CIAhQgN0fRGIg0joKUGi9HPXYFOfCDdBqbtfCAA */
  createMachine<HangmanContext, any>({
  context: initialContext,
  schema: { context: {} as HangmanContext, events: {} as any },
  predictableActionArguments: true,
  id: "hangmanMachine",
  initial: "inactive",
  states: {
    inactive: {
      on: {
        INIT: {
          target: "active",
          actions: ACTIONS.SETWORD,
        },
      },
    },
    active: {
      always: [
        {
          target: "win",
          cond: GUARDS.HASWON,
        },
        {
          target: "lose",
          cond: GUARDS.HASLOST,
        },
      ],
      on: {
        MAKEGUESS: {
          target: "active",
          actions: ACTIONS.HANDLEGUESS,
          internal: false,
        },
        NOTRIESREMAINING: {
          target: "lose",
        },
        WORDGUESSED: {
          target: "win",
        },
      },
    },
    win: {
      on: {
        RESET: {
          target: "inactive",
          actions: "RESET",
        },
      },
    },
    lose: {
      on: {
        RESET: {
          target: "inactive",
          actions: "RESET",
        },
      },
    },
    enabled: {},
  },
}, {
  guards: {
    [GUARDS.HASLOST]: (ctx) => ctx.triesRemaining === 0,
    [GUARDS.HASWON]: handleHasWon,
  },
    actions: {
      [ACTIONS.SETWORD]: assign({ word: (context: HangmanContext, event) => setWord(context, event) }),
      [ACTIONS.HANDLEGUESS]: assign({
        guessedLetters: (context: HangmanContext, event) => handleGuess(context, event),
        triesRemaining: (context: HangmanContext, event) => handleTries(context, event),
      }),
      [ACTIONS.CHECKHASWON]: assign({ hasWon: (ctx: HangmanContext, _) => handleHasWon(ctx)}),
      [ACTIONS.RESET]: assign({ ...initialContext }),
  }
})