import { assign, createMachine } from "xstate";
import { ACTIONS, GUARDS, HangmanContext, STATES } from "./hangmanMachine.types";
import { inspect } from '@xstate/inspect'

inspect({
  url: 'https://statecharts.io/inspect',
  iframe: false,
})
const initialContext: HangmanContext = {
  word: '',
  guessedLetters: { correct: '', incorrect: '' },
  triesRemaining: 7,
  error: null,
}

const url = 'https://random-word-api.herokuapp.com/word'
const fetchRandomWord = async (url: string) => {
  const data = await (await fetch(url)).json()
  return data[0]
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

  // CORRECT GUESS AND NOT ALREADY GUESSED
  if (context.word.includes(event.letter)
    && !correct.includes(event.letter)) {
    nextGuessedLetters.correct = correct + event.letter
  }

  // INCORRECT GUESS
  if (!context.word.includes(event.letter)
    && !incorrect.includes(event.letter)) {
    nextGuessedLetters.incorrect = incorrect + event.letter
  }

  return nextGuessedLetters
}

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
  /** @xstate-layout N4IgpgJg5mDOIC5QAsCGA7KBbDBZVAxsgJbpgB0phALsQG5gDEEA9mZenSwNYUzUAlDKywB1FgCcIAbQAMAXUSgADi1jFabJSAAeiAEwAWAIzlZ+gMyGLAVhsB2IzaMA2ADQgAnohsAOG+TGshb25jYuAJyREfoAvrEeaJg46PhEpBRUBLQMjGASEpLkygA2qNQAZpJY5PxC6CLiUnKKSCCq6pro2noIRqbmVrYOTq4e3gjG9hFmFhGyhi5BvsZ2UfGJGNh4hCTsNPRMuACCANIAogDiAKrnAMp3LdodGsRabb0uweQW+r6yvgixhiFlBEXGiEMERmANBU0cQ18LhsGxASW2qV2GXIB1yTzaLy6PUQgN8Zj+DiCsmCVnBXkQLn0AVkXz+QMsc1kxlR6JSaT2FFxTGkxlaKjUr3eoF6pPJ-nsVJpUIhCBshns5C+hj80PMJmM3ISaK2fKx7AA7qRGAJ7ucACr48WdN7dD6IILA8iLWT2BUGlyhQEq+xLTXGAMhfyGfWGzbJHbpdglNRMG13e2O9oSoluyZcmbe30G8OBukTYbkOz6WQOFwB5zUlFG3kJgXkCqoYglACuElTtodCme2ZdxIQUJc5BD4UM+ns2tsEQcKt8+nIEWnNgivkBAf0AfiRvQLAgcG0LcxibAw+dUt0iAAtO56Qgn2ZqR-Px+HDyTa3sVkOTXgSI53r0s7BhYpguL4oT2FYfzmFMv7xpebZCjekqutKDLzOuFiwYYSJTEs+jGCqLhQZqFhcv8URkdWFgoRi-LYpa2FZreHG9AaVGDFBrg2D6EEvr6ASrqCtZ2I2cTNn+aHYsmsDAU6WFjrxAwcsYgnCfoKp2MyPohsC847pEzGmle7adj2faYTmOEIJEsj4YRxHGWRKoMeQljItWwKLKuCyHrEQA */
  createMachine({
  context: initialContext,
  schema: { context: {} as HangmanContext, events: {} as any },
  predictableActionArguments: true,
  id: "hangmanMachine",
  initial: "inactive",
  states: {
    inactive: {
      invoke: {
        src: () => fetchRandomWord(url),
        id: "getRandomWord",
        onDone: [
          {
            target: "active",
            actions: ACTIONS.SETWORD,
            description: "word successfully retrieved and stored in context.",
          },
        ],
        onError: [
          {
            target: "failure",
            actions: ACTIONS.SETERROR,
            description: "api request failed, error is stored to context.",
          },
        ],
      },
    },
    active: {
      always: [
        {
          target: "win",
          cond: GUARDS.HASWON,
          description: "User has guessed the word.",
        },
        {
          target: "lose",
          cond: GUARDS.HASLOST,
          description: "User has no tries remaining.",
        },
      ],
      on: {
        MAKEGUESS: {
          cond: GUARDS.VALIDINPUT,
          actions: ACTIONS.HANDLEGUESS,
          description: "User makes a guess, input is validated.",
        },
      },
    },
    win: {
      on: {
        RESET: {
          target: "inactive",
          actions: ACTIONS.RESET,
        },
      },
    },
    lose: {
      on: {
        RESET: {
          target: "inactive",
          actions: ACTIONS.RESET,
        },
      },
    },
    failure: {
      on: {
        RESET: {
          target: "inactive",
          actions: ACTIONS.RESET,
        },
      },
    },
  },
}, {
    guards: {
      [GUARDS.HASLOST]: (ctx) => ctx.triesRemaining === 0,
      [GUARDS.HASWON]: handleHasWon,
      [GUARDS.VALIDINPUT]: (_, event) => /^[a-zA-Z]{1}$/.test(event.letter)
    },
    actions: {
      [ACTIONS.SETWORD]: assign({ word: (_, event) => event.data }),
      [ACTIONS.SETERROR]: assign({ error: (_, event) => event.data }),
      [ACTIONS.HANDLEGUESS]: assign({
        guessedLetters: (context: HangmanContext, event) => handleGuess(context, event),
        triesRemaining: (context: HangmanContext, event) => handleTries(context, event),
      }),
      [ACTIONS.RESET]: assign({ ...initialContext }),
    }
  })