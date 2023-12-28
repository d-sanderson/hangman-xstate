import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react'
import { hangmanMachine } from '../machines/hangmanMachine';
import { ACTIONS } from '../machines/hangmanMachine.types';
import SplineScene from './SplineScene';


const HangmanUI = () => {
  const [state, send, service] = useMachine(hangmanMachine, { devTools: true })

  useEffect(() => {
    const handleInput = (e: KeyboardEvent) => {
      send('MAKEGUESS', { letter: e.key })
    }
    // Add the event listener when the component mounts
    window.addEventListener('keydown', e => handleInput(e));

    // Remove the event listener when the component unmounts to avoid memory leaks
    return () => {
      window.removeEventListener('keydown', e => handleInput(e));
    };
  }, []);

  
  return (
    <div>
      <h1>{state.toStrings()}</h1>
      <SplineScene state={state} service={service} />
      {state.matches('lose') &&
        <p>the correct word was <strong>{state.context.word}</strong>.</p>
      }
      {state.can(ACTIONS.RESET) &&
        <button onClick={() => {
          send(ACTIONS.RESET)
        }}>reset</button>
      }
      <h1 className="wrong">{state.context.guessedLetters.incorrect}</h1>
      {!state.matches('lose') &&
        <h1>{state.context.word
          .split('')
          .map(el => state.context.guessedLetters.correct.includes(el) ? ` ${el} ` : ' _ ')
          .join('')}
        </h1>}
    </div>
  )
}

export default HangmanUI
