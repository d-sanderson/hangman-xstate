import { assign, createMachine } from "xstate";

interface HangmanContext {
  word: string
  guessedLetters: { correct: string, incorrect: string },
  triesRemaining: number
  hasWon: boolean
  error: string | null
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
  hasWon: false,
  error: null,
}

const fetchRandomWord = async () => {
  const data = await (await fetch('https://random-word-api.herokuapp.com/word')).json()
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
  /** @xstate-layout N4IgpgJg5mDOIC5QAsCGA7KBbDBZVAxsgJbpgB0phALsQG5gDEEA9mZenSwNYUzUAlDKywB1FgCcIAbQAMAXUSgADi1jFabJSAAeiAKwBmAOzlZhgJwBGAGzmbxgEz6ALDYA0IAJ6IAHI-ILYxt9O2MXKwsbBwBfGM80TBx0fCJSCioCWgZGMAkJSXJlABtUagAzSSxyfiF0EXEpOUUkEFV1TXRtPQQLfQtyS31fKONZWV9DV08fBEjZQYcrcNCXcasXOISMbDxCEnYaeiZcAEEAaQBRAHEAVUuAZQfm7XaNYi1WnpdHGcRbAZrQw2RwmCyyKyGYH6LYgRK7FL7dLkI45AByAHkACoCACSjwElzOuLRJOuL1ab063UQjlkLnI-SsG3GLmC1lkHm8tOMhnIjkcxkm-hc+lk+iFsPhyVSBwoqKYogxAgAIndHg9LiqKSo1O9PqAenSGUyWfT2VZOX8EMCBtFBTZLKKooYXIYpTsZUjDlljowdW09dSvrT6YzrGa2TYOVzZoZQeRo5DfKExoKNh6kns0j7skxpFYWrqOh8uiGEMbw8y1uak1buRXBfzQmLosZIu3HJt4nDPdm5eQAO6kRiEzVYgNU0s0hBGUzmax2YFOVyxxCGTnkDbAn6ggXR3yZhGy5HFNRMMeXCcKV5B6fludmSy2ewrtzWukDMa+YwSrs2UUQSPL0cwocpUGIYoAFcJAvR4r0nO8DV0f4JgCExgl8S12wsSZrQsBkNzccFDEmekISsOIe3QFgIDgbRpX7dJbxLZCegAWjXBBOLMcYIWMYJPxsXxzGApj2EyPMWP1MtDUQYxwUGJwo0haN6V8a1sLMKx-EcCxHAceN0zExFQJRX0GGk4M5NnXxGX0foRIM9TZAUlwPzGcg3BsbCgktAighMk92GHWTA1YsLvmWeyLAsDdXFcZkuPjOzhJZVxJl5YIYR7RjTIHM9YDAKz7xsiJTAc2L4tFCJbA-eN+TcfQdLGWxowsILvTAiDoNgkq2P+OkrDMXwUzGkEBMiTTnC3XklzbFxwWGKiYiAA */
  createMachine<HangmanContext, any>({
  context: initialContext,
  schema: { context: {} as HangmanContext, events: {} as any },
  predictableActionArguments: true,
  id: "hangmanMachine",
  initial: "inactive",
  states: {
    inactive: {
      invoke: {
        src: () => fetchRandomWord(),
        id: "getRandomWord",
        onDone: [
          {
            target: "active",
            actions: assign({ word: (ctx, event) => event.data }),
          },
        ],
        onError: [
          {
            target: "failure",
            actions: assign({ error: (context, event) => event.data }),
          },
        ],
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
    failure: {
      on: {
        RESET: {
          target: "inactive",
          actions: "RESET",
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
      [ACTIONS.SETWORD]: assign({ word: (context: HangmanContext, event) => setWord(context, event) }),
      [ACTIONS.HANDLEGUESS]: assign({
        guessedLetters: (context: HangmanContext, event) => handleGuess(context, event),
        triesRemaining: (context: HangmanContext, event) => handleTries(context, event),
      }),
      [ACTIONS.CHECKHASWON]: assign({ hasWon: (ctx: HangmanContext, _) => handleHasWon(ctx)}),
      [ACTIONS.RESET]: assign({ ...initialContext }),
  }
})