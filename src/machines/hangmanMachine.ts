import { assign, createMachine } from "xstate";
import { ACTIONS, GUARDS, HangmanContext, STATES } from "./hangmanMachine.types";

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
  /** @xstate-layout N4IgpgJg5mDOIC5QAsCGA7KBbDBZVAxsgJbpgB0phALsQG5gDEEA9mZenSwNYUzUAlDKywB1FgCcIAbQAMAXUSgADi1jFabJSAAeiAEwAWAIzlZ+gMwmLNgJwB2e7YBsAGhABPRAFYL98gAcjsbOAd7O9sYW+rYAvrHuaJg46PhEpBRUBLQMjGASEpLkygA2qNQAZpJY5PxC6CLiUnKKSCCq6pro2noIRqbmVlF2ji7uXgjGTmYWtrL2hhbehrb6+t7e8YkY2HiEJOw09Ey4AIIA0gCiAOIAqpcAyg8t2h0axFptvYbTSxGyziMziWARC40Qhgi5G8tgCthBFmctm8sg2WxASV2qX2GXIR1yLzaby6PUQwNMth+YRMsimyPs4IQ4X0ZlsIVk83mkXs6MxKTSBwo+KY0mMrRUanen1AvXJ5Ep9mpxlpTm8DM8EIChnIwO8cMMPwiax5CQxO35OPYAHdSIwBI9LgAVQkSzofbpfRALFnObzK4wBPzI8IWRmhFlzPUAuHOCIrXnmvbpdglNRMe0PJ0u9qSkmehDenV+2mB1UhxnRbUA+yhGyx5yGWQBBPJJOC8gVVDEEoAVwk6YdzoUr1z7tJCER3h1hij82RFmMbNDGoQAQjNfClOMi3MLnipvQLAgcG0fLbGRHbulukQAFo3Cv72YObI-AFA75hoYW1iBbisjkYCXlKHoyhC+hht467OMqVihNuFg-hayZCtkxzAXmYEICsU5svoSL2L4+ghGqjLhAEOowQaXKEfYtJIee1qkBhY75gEMHkIii6WIGqLIsYYYOOQxjGP0FhhO+tLOAx2IoeQqawEBRKjtevTsaYXGrOJFh8X6jIrCyr5suYTaNoizammesntp23Z9kprogeOOHyqJBFESR6oTIuzjkCsiyGEYYShC4cT7kAA */
  createMachine<HangmanContext, any>({
    context: initialContext,
    schema: { context: {} as HangmanContext, events: {} as any },
    predictableActionArguments: true,
    id: "hangmanMachine",
    initial: STATES.INACTIVE,
    states: {
      [STATES.INACTIVE]: {
        invoke: {
          src: () => fetchRandomWord(url),
          id: "getRandomWord",
          onDone: [
            {
              target: STATES.ACTIVE,
              actions: ACTIONS.SETWORD,
            },
          ],
          onError: [
            {
              target: STATES.FAILURE,
              actions: ACTIONS.SETERROR,
            },
          ],
        },
      },
      [STATES.ACTIVE]: {
        always: [
          {
            target: STATES.WIN,
            cond: GUARDS.HASWON,
            description: "User has guessed the word",
          },
          {
            target: STATES.LOSE,
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
      [STATES.WIN]: {
        on: {
          RESET: {
            target: [STATES.INACTIVE],
            actions: ACTIONS.RESET,
          },
        },
      },
      [STATES.LOSE]: {
        on: {
          RESET: {
            target: [STATES.INACTIVE],
            actions: ACTIONS.RESET,
          },
        },
      },
      [STATES.FAILURE]: {
        on: {
          RESET: {
            target: [STATES.INACTIVE],
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