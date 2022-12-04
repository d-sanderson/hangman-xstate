
import './App.css'
import { useMachine } from '@xstate/react';
import { useEffect, useState } from 'react';
// @ts-ignore
import { hangmanMachine } from './machines/hangmanMachine.js';


function App() {

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

  //  WIN STATE 
  useEffect(() => {
    if (state?.context.hasWon) {
      send('CORRECT')
    }
  }, [state?.context.hasWon])

  const handleInput = (e) => {
    if (/^[a-zA-Z0-9_]{1}$/.test(e.key)) {
      send('MAKEGUESS', { letter: e.key })
    }
  }
  return (
    <main className="App">
      <h1>{state.toStrings()}</h1>
      <h1>{JSON.stringify(state.context)}</h1>
      {state.matches('active') &&
        <input
          onKeyDown={(e) => handleInput(e)}
        />
      }
      {state.matches('lose') &&
        <button onClick={() => {
          send('RESET')
        }}>reset</button>
      }
      {state.matches('win') &&
        <button onClick={() => {
          send('RESET')
        }}>reset</button>
      }
    </main>
  )
}

export default App
