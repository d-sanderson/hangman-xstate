import { useMachine } from '@xstate/react';
import React from 'react'
import { hangmanMachine } from '../machines/hangmanMachine';

const HangmanUI = () => {
  const [state, send] = useMachine(hangmanMachine);

  const handleInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (/^[a-zA-Z0-9_]{1}$/.test(e.key)) {
      send('MAKEGUESS', { letter: e.key })
    }
  }

  return (
    <div>      <h1>{state.toStrings()}</h1>
      <pre>{JSON.stringify(state.context, null, 2)}</pre>
      {state.matches('active') &&
        <input
          onKeyDown={(e) => handleInput(e)}
        />
      }
      {state.can('RESET') &&
        <button onClick={() => {
          send('RESET')
        }}>reset</button>
      }</div>
  )
}

export default HangmanUI