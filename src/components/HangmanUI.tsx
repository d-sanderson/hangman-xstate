import { useMachine } from '@xstate/react';
import React, { useEffect, useRef } from 'react'
import { hangmanMachine } from '../machines/hangmanMachine';
import { ACTIONS } from '../machines/hangmanMachine.types';
import SplineScene from './SplineScene';


const HangmanUI = () => {
  const [state, send, service] = useMachine(hangmanMachine, { devTools: true })
  const active = state.matches('active')
  const handleInput = (e: React.KeyboardEvent<HTMLInputElement>) => send('MAKEGUESS', { letter: e.key })
  return (
    <div>
      <SplineScene state={state} service={service} />
      {active &&
        <input
          onKeyDown={(e) => handleInput(e)}
        />
      }
      <h1>{state.toStrings()}</h1>
      {state.matches('lose') &&
        <p>the correct word was <strong>{state.context.word}</strong>.</p>
      }
      {state.can(ACTIONS.RESET) &&
        <button onClick={() => {
          send(ACTIONS.RESET)
        }}>reset</button>
      }
      <h1>{state.context.word
        .split('')
        .map(el => state.context.guessedLetters.correct.includes(el) ? ` ${el} ` : ' _ ')
        .join('')}
      </h1>
    </div>
  )
}

export default HangmanUI