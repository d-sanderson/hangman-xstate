import { useMachine } from '@xstate/react';
import React from 'react'
import { hangmanMachine } from '../machines/hangmanMachine';
import { ACTIONS, STATES } from '../machines/hangmanMachine.types';

const HangmanUI = () => {
  const [state, send] = useMachine(hangmanMachine, { devTools: true })
  const active = state.matches('active')
  const handleInput = (e: React.KeyboardEvent<HTMLInputElement>) => send('MAKEGUESS', { letter: e.key })

  return (
    <div>
      <h1>{state.toStrings()}</h1>
      <pre>{JSON.stringify(state.context, null, 2)}</pre>
      {active &&
        <input
          onKeyDown={(e) => handleInput(e)}
        />
      }
      {state.can(ACTIONS.RESET) &&
        <button onClick={() => {
          send(ACTIONS.RESET)
        }}>reset</button>
      }</div>
  )
}

export default HangmanUI