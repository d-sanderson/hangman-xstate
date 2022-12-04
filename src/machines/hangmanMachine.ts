import { assign, createMachine } from "xstate";

  interface HangmanContext {
    word: string
    guessedLetters: { correct: string, incorrect: string },
    triesRemaining: number
    hasWon: boolean
  }

  const initialContext: HangmanContext = { word: '', guessedLetters: { correct: '', incorrect: '' }, triesRemaining: 7, hasWon: false }

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
      nextGuessedLetters.correct = context.guessedLetters.correct + event.letter
    }

    // INCORRECTGUESS
    if (!context.word.includes(event.letter)
      && !context.guessedLetters.incorrect.includes(event.letter)) {
      nextGuessedLetters.incorrect = context.guessedLetters.incorrect + event.letter
    }
    return nextGuessedLetters
  }
  const setWord = (_: HangmanContext, event: { word: string }) => event.word

  export const hangmanMachine = 
/** @xstate-layout N4IgpgJg5mDOIC5QGMD2BXAdgFzAJwFkBDZACwEtMwA6Sk7cgNzAGIBJAOTYBUBtABgC6iUAAdUscg1SYRIAB6IALPwBM1AKyr+ADgBsGgOw6lGpQEYANCACeicxoCc1fv3MBmNTvdLvenQC+AdZoWLiEJBRU1PRMrAQAggDSAKIA4gCqKQDK2QLCSCDiktKyhYoIeu4a1Ibuhvzu2vx6qqrujtZ2CDrqjoYGVYaqDY5qGkEhGDj4xGSUNLHMLBwA8twASmw5GymJnJxp+XLFUuQychXGOtRNOuaO5vyG5nWdtvYmt66GA1pqSnc9UmIFCMwi82iS1YAHVOBwUhsAMIACTYSKSHAAIvDEcdCqdSpdlGpNNp9EYTGYrB8EE8bhp6oYtC8lKo2SCweE5lEaAB3SgsXbZFJ8IQnCRnC7lex6PTUJSGR4DfhKAzmHS-LqIVSOeUNDw6e6qAwmvSc6bcyILagAGwkrGFovxYklRJlPR0zjqSl95l1T3MrW1CE86kZqg0GgcOn4ZmehiCwRAmFQEDgci5s2tVAlJXOZVAFQAtHoQ8Wao4q1W9PwxnpXp4HBawtnITQ6MgGMw81LCwodcYXBZ-P13LG2qoQ+4HtR2o81dG3EaW+CeTbob33UXEKa544w9UHMMp7SNUoXB0Wv7z45equre3qAL+4SC8SEGzp09qGMld44wbOp9AfNteTtB0t3fD0njcfc9EcMw70jB4NG-fUOg1HwNQ0FpEyTIA */
createMachine({
  context: initialContext,
  schema: { context: {} as HangmanContext },
  id: "counterMachine",
  initial: "inactive",
  states: {
    inactive: {
      // @ts-ignore
      on: {
        INIT: {
          target: "active",
          // @ts-ignore
          actions: assign({ word: setWord }),
        },
      },
    },
    active: {
      // @ts-ignore
      on: {
        MAKEGUESS: {
          actions: assign({
            // @ts-ignore
            guessedLetters: handleGuess,
            // @ts-ignore
            triesRemaining: handleTries,
          }),
        },
        NOTRIESREMAINING: {
          target: "lose",
        },
        WINNERCHICKNDINNER: {
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
          actions: assign({ ...initialContext }),
        },
      },
    },
  },
});