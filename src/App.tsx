
import './App.css'
import { useMachine } from '@xstate/react';
import { CountContext, counterMachine } from './machines/counterMachine';
import { useEffect, useState } from 'react';
import { assign, createMachine } from 'xstate';


function App() {
  interface HangmanContext {
    word: string
    guessedLetters: { correct: string, incorrect: string },
    triesRemaining: number
  }

  const initialContext: HangmanContext = { word: '', guessedLetters: { correct: '', incorrect: '' }, triesRemaining: 1 }

  const handleTries = (context, event) => {
    if (!context.word.includes(event.letter)) {
      return context.triesRemaining - 1
    }
    return context.triesRemaining
  }
  const handleGuess = (context, event) => {
    const { correct, incorrect } = context.guessedLetters
    const nextGuessedLetters = { correct, incorrect }

    // CORRECT GUESS
    if (context.word.includes(event.letter) && !context.guessedLetters.correct.includes(event.letter)) {
      nextGuessedLetters.correct = context.guessedLetters.correct + event.letter
    }

    // INCORRECTGUESS
    if (!context.word.includes(event.letter) && !context.guessedLetters.incorrect.includes(event.letter)) {
      nextGuessedLetters.incorrect = context.guessedLetters.incorrect + event.letter
    }
    return nextGuessedLetters
  }
  const setWord = (_, event) => event.word

  const hangmanMachine = createMachine({
    context: initialContext,
    schema: { context: {} as HangmanContext },
    id: "counterMachine",
    initial: "inactive",
    states: {
      inactive: {
        on: {
          INIT: {
            target: 'active',
            actions: assign({ word: setWord })
          }
        }
      },
      active: {
        on: {
          MAKEGUESS: {
            // target: 'active',
            actions: assign({ guessedLetters: handleGuess, triesRemaining: handleTries })
          },
          NOTRIESREMAINING: {
            target: 'lose'
          }
        }
      },
      win: {
      },
      lose: {
        on: {
          RESET: { 
            target: 'inactive',
            actions: assign({ ...initialContext})
          }
        }
      }
    },
  });
  const [state, send] = useMachine(hangmanMachine);


  const getRandomWord = async () => {
    const data = await (await fetch('https://random-word-api.herokuapp.com/word')).json()
    setRetrievedWord(data[0])

  }

  const [retrievedWord, setRetrievedWord] = useState();

  // Load Word 
  useEffect(() => {
    getRandomWord()
  }, [state])

  // Initialize to machine to active when word has been retrieved
  useEffect(() => {
    if (retrievedWord && state.matches('inactive')) {
      send('INIT', { word: retrievedWord })
    }
  }, [retrievedWord])

  // Lose State
  useEffect(() => {
    if (state.context.triesRemaining === 0) {
      send('NOTRIESREMAINING')
    }

  }, [state?.context.triesRemaining])


  return (
    <main className="App">
      <h1>{state.toStrings()}</h1>
      <h1>{JSON.stringify(state.context)}</h1>
      <button onClick={() => {
        send('MAKEGUESS', { letter: 'p' })
      }}>test</button>
      {state.matches('win') || state.matches('lose') && 
      <button onClick={() => {
        send('RESET')
      }}>reset</button>}
    </main>
  )
}

export default App
