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
  message: '',
}

const url = 'https://random-word-api.herokuapp.com/word'
const fetchRandomWord = async (url: string) => {
  const data = await (await fetch(url)).json()
  return data[0]
}

const handleTries = (context: HangmanContext, event: { letter: string }) => {
  if (!context.word.includes(event.letter) && !context.guessedLetters.incorrect.includes(event.letter)) {
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
  /** @xstate-layout N4IgpgJg5mDOIC5QAsCGA7KBbDBZVAxsgJbpgB0phALsQG5gDEEA9mZenSwNYUzUAlDKywB1FgCcIAbQAMAXUSgADi1jFabJSAAeiAEwAWAIzlZ+gMyGArBYAc+4wHYL5pwBoQAT0TW7s8jtrQwA2AE47VxCLELtDAF94zzRMHHR8IlIKKgJaBkYwCQlJcmUAG1RqADNJLHJ+IXQRcSk5RSQQVXVNdG09BCNTcytbB2dXfQ9vRGcncmDjcMNDC2c7ENkLROSMbDxCEnYaeiZcAEEAaQBRAHEAVSuAZUe27S6NYi0O-o2Lcgt9HZjIZ9PpNoNDJ4fAhDGE-rJ-E4woY4iEbOFtiAUnt0gcsuRjvlXh13j0+og7BEzICnEZzEE0SEoYgQsY7GZrGFbPowkjDE5zJjsWkMocKISmNJjO0VGoPl9QP1Kez6bTDPTrIzmQhggFfi42TFZKytkksbsRXj2AB3UiMARPK4AFWJsu6n163xmsmMYXIoVkYSD1nGQaZ0wQTms+kCISMDkBQJCwSFFv2mXYZTUTAdj2drs6crJXoQxh9foDQa5obC4ehVj9wS5ISccdBYNNO1S6bF5CqqGIZQArhIc46XQo3kWPeSYbXyK3NTE4TzAxZtUD-Ui2bIQwi7E5KYkzegWBA4NphT2slP3QrdIgALR1p-WchVj+fiIhVPd3EZ7J0AlW95U9RVEBBbU1XIHcNn8TkLC5X8cVFfFgJJad7x+MIAjhOw4lkUI0TCYxrG1OM3zjVsBRbQio2Qy0APIW0wMLO9WP6YxjFWakLGsOiDwNOwoNiMwW3sCxJIsJwnGWBjr0zbMQOLcDS24oZLH4-lBNWYSIybMxd0mYieX0TV5P-Xt+0HEcwGUmcS3CXD7AIojYVI7UwQrOIgl9BEfTiY94iAA */
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
