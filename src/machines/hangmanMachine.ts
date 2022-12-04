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
  /** @xstate-layout N4IgpgJg5mDOIC5QAsCGA7KBbDBZVAxsgJbpgB0phALsQG5gDEEA9mZenSwNYUzUAlDKywB1FgCcIAbQAMAXUSgADi1jFabJSAAeiAEwAWAIzlZ+gMyGLATkM2LsgOzGArPoA0IAJ6JXFp3IADicnfX1XewtjfSDXAF94rzRMHHR8IlIKKgJaBkYwCQlJcmUAG1RqADNJLHJ+IXQRcSk5RSQQVXVNdG09BCNTcytbKOc3Tx9EYycbM1tZADZDOMWAxctE5IxsPEISdhp6JlwAQQBpAFEAcQBVS4BlB7btLo1iLQ7+w1nyC1dFkFjCEgotjP9-F5fAhDItAq4bEFEU4wTYHPpjFsQCldul9llyEd8i8Om8en1EGtTHZZhsbKFZACoX4NmYbG5ZrJDEsbBssTi0hkDhQiUxpMZ2io1O9PqB+lTyDTefp6U5GYtmTCgoZyGtXEELHCVi4nBZ+TtBfj2AB3UiMASPS4AFRJUu6H16X0QTns5FmdjijIsVhCmsB+kVjKC+kWYNcPqM5tSe0y7DKaiYDoeztdnWl5K9CB9c39K1cQZDTk1FiMZjhTkixlkMy5hiTuKFBKqqGIZQArhJM46XQpXvmPRSEAEI7NrE4gdEYvoUZro4qUQDbDGAezFokkiB0CwIHBtAKU8Kx+7ZbpEABaDVTBB31yKtFo2NN2MrWQ2duW1NsnQUUrxlT05UQQxJmhRZ3HXMFlnCSIIicf8LwJEDSXHG9vhsV92ViGJTV-IJo01AEgl1ONzCbNUgjQvFAPIW1wLza9WP6UFTENfRzCWX8fQ2MN6XIYwYgsbUAl5WCGM7NMM1AgsIIQLi-g2PjFgE2FoMgmwI1kBYa2MbluWMhID3PRjhXIbtewHMBFInQt7HwmIgWXRxETIp9jF5ch7DnRF9VkUF6X3eIgA */
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