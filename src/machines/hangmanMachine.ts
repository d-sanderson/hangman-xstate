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
  /** @xstate-layout N4IgpgJg5mDOIC5QAsCGA7KBbDBZVAxsgJbpgB0phALsQG5gDEEA9mZenSwNYUzUAlDKywB1FgCcIAbQAMAXUSgADi1jFabJSAAeiAEwAWAIzlZ+gMyHrAVgDsADgc2bshwBoQAT0Q2Ld8gc7O2M7AE5DMLDjG31jAF94zzRMHHR8IlIKKgJaBkYwCQlJcmUAG1RqADNJLHJ+IXQRcSk5RSQQVXVNdG09BCNTcytbR2dXD29EULCzCzDZADYbJyNrRf1E5IxsPEISdhp6JlwAQQBpAFEAcQBVS4BlB7btLo1iLQ7+w3DyCxtFsE7P9LM5ZDZPD4EIZAeQbGEHBFDHFFosYgkkiAUrt0vssuQjvkXh03j0+ohFlFyHErEE7IYHIDlpDfBszNF7LJzLFFtYtlidmkMgcKISmNJjO0VGp3p9QP1KbMaQzggymRCptCHIZyIt-g59DZkcZEWFgvzsUK8ewAO6kRgCR6XAAqxOl3Q+vS+iAcoTMy1kxnmjIBNmMLIQiwN5AWK30+gcFjc4TCFsFe0y7DKaiYjoeLrdnRlZO9CF9ASWriDCOWy3DmosRn9wVkYTiJjslkMadSGZF5CqqGIZQArhJc07XQpXsXPeSEP59ORwsjGSaolGNVDo2ba8YEcilpZEpj0CwIHBtJa+1kZx65bpEABaRYRp82GNRDdopa8qMOHscWFfEcjyMA71lL15UQZEI2WJdd2MfcDX8BxzEAq1M1FXJjggktoIQWJZiNFweUMf5Wy3VkHF1NEYWMQE4giRYMJvW1SDwudSzbGiNjsFxDQ3fjX01SkAiQ0EkP8VEflY3EsPIbNYHAklZwffoeN1fR+NieEwkBAEI0iJdZHmcFZEMcwGMbOTgPYQdhzHFT3Ug+ciLhQxSP0XkKLCKiEH3RZyEicj7E7X1jFbOwT3iIA */
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
          },
        ],
        onError: [
          {
            target: "failure",
            actions: ACTIONS.SETERROR,
          },
        ],
      },
    },
    active: {
      always: [
        {
          target: "win",
          cond: GUARDS.HASWON,
          description: "User has guessed the word",
        },
        {
          target: "lose",
          cond: GUARDS.HASLOST,
          description: "No tries remaining",
        },
      ],
      on: {
        MAKEGUESS: {
          cond: GUARDS.VALIDINPUT,
          actions: ACTIONS.HANDLEGUESS,
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