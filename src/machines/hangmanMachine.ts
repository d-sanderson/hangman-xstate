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
  /** @xstate-layout N4IgpgJg5mDOIC5QGMD2BXAdgFzAJwFkBDZACwEtMwA6Sk7cgNzAGIBJAOTYBUBtABgC6iUAAdUscg1SYRIAB6IALPwBM1AKyr+ADgBsAdgMaDOjUo0AaEAE9EARg0BOav372AzLtV69qpX4AvoHWaFi4hCQUVNT0TKwEAIIA0gCiAOIAqqkAyjkCwkgg4pLSskWKCHoeGtQGHgZqHk56Ju5K1nYIOupOBq0ahr5qfarBoRg4+MRklDRxzCwcAPLcAEpsuWupSZyc6QVyJVLkMnKVpjrUHqo69n41-h6enQ46StduBk5KTg2+qg04xAYSmkVmMQWrAA6pwOKk1gBhAASbERyQ4ABE4QjDkVjmVzso1JptPojCYzBZXgh7LpNA1+u9+HodPwNJ5gaCIjNojQAO6UFjbHKpPhCI4SE5nCoOXzUJTfewGe6qW41DwdWyIVQtOrtfx0346FVAkIgyY8qJzagAGwkrBFYrxYilhNl3R0LnqSiUDQs1XZWq6XnUGhugyU5I8Oi8HmC5swqAgcDk3Om1qoktKp3KoEqAFo9DSi1zLRmITQ6MgGMxs9K8wodaZXEp7jo2YZ+M9HDTni5VM17vdu7pu2XwhW+bEa-F6+784hWupdV57D9foGDDT7O9XM0WU4WrHuzUJ2DeTbBY2CbmiQglKo+3TqE5+N8WtVDNolOerZW7Qdec7w9Ol3GoXU9CccM33Zdx7GfPQ6iHPQRy8NkPHjBMgA */
  createMachine<HangmanContext, any>({
    context: initialContext,
    schema: { context: {} as HangmanContext, events: {} as any },
    id: "hangmanMachine",
    initial: "inactive",
    predictableActionArguments: true,
    states: {
      inactive: {
        on: {
          INIT: {
            target: "active",
            actions: [ACTIONS.SETWORD],
          },
        },
      },
      active: {
        entry: assign({ hasWon: (ctx: HangmanContext, _) => handleHasWon(ctx) }),
        on: {
          MAKEGUESS: {
            target: 'active',
            actions: [ACTIONS.HANDLEGUESS],
          },
          NOTRIESREMAINING: {
            target: "lose",
          },
          CORRECT: {
            target: "win",
          },
        },
      },
      win: {
        on: {
          RESET: {
            target: "inactive",
            actions: assign({ ...initialContext }),
          },
        },
      },
      lose: {
        on: {
          RESET: {
            target: "inactive",
          },
        },
      },
    },
  }, {
    // TODO: fix TS Errors
    actions: {
      [ACTIONS.HANDLEGUESS]: assign({
        // @ts-ignore
        guessedLetters: handleGuess,
        // @ts-ignore
        triesRemaining: handleTries,
      }),
      // @ts-ignore
      [ACTIONS.SETWORD]: assign({ word: setWord }),
  }
})