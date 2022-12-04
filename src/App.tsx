
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

    if (canSpellWord(state.context.word, state.context.guessedLetters.correct)) {
      send('WINNERCHICKNDINNER')
    }
  }, [state?.context])

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
          onTouchStart={(e) => handleInput(e)}
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
