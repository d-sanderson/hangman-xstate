import Spline from '@splinetool/react-spline';
import { useMachine } from '@xstate/react';
import React, { useEffect, useRef } from 'react'
import { hangmanMachine } from '../machines/hangmanMachine';
import { ACTIONS } from '../machines/hangmanMachine.types';
const HangmanUI = () => {
  const [state, send] = useMachine(hangmanMachine, { devTools: true })
  const active = state.matches('active')
  const handleInput = (e: React.KeyboardEvent<HTMLInputElement>) => send('MAKEGUESS', { letter: e.key })


  // initialize Refs
  const post = useRef()
  const head = useRef()
  const torso = useRef()
  const leftArm = useRef()
  const rightArm = useRef()
  const leftLeg = useRef()
  const rightLeg = useRef()

  // @ts-ignore
  function onLoad(spline) {
    const postObj = spline.findObjectById('8b383c81-04af-4020-adb7-1536919524df')
    const headObj = spline.findObjectById('197824f6-116e-4719-a466-fbfdd4fe138e')
    const torsoObj = spline.findObjectById('8571f3da-57da-4c40-8229-a43b95595db1')
    const leftArmObj = spline.findObjectById('b2d1f84c-6f60-42ac-beb9-dc5f5d5e90dc')
    const rightArmObj = spline.findObjectById('24dfd042-2286-454b-8b7b-93af446c12c6')
    const leftLegObj = spline.findObjectById('61a2dbe9-090e-4084-a0a5-5e9d0fc5bd91')
    const rightLegObj = spline.findObjectById('d1016e3c-4ebd-4163-9434-e4752d97f080')
    // save objects to refs for later use
    post.current = postObj
    head.current = headObj
    torso.current = torsoObj
    leftArm.current = leftArmObj
    rightArm.current = rightArmObj
    leftLeg.current = leftLegObj
    rightLeg.current = rightLegObj
  }

  useEffect(() => {
    switch (state.context.triesRemaining) {
      case 7:
        // @ts-ignore
        post?.current?.emitEventReverse('mouseDown')
        // @ts-ignore
        head?.current?.emitEventReverse('mouseDown')
        // @ts-ignore
        torso?.current?.emitEventReverse('mouseDown')
        // @ts-ignore
        leftArm?.current?.emitEventReverse('mouseDown')
        // @ts-ignore
        rightArm?.current?.emitEventReverse('mouseDown')
        // @ts-ignore
        leftLeg?.current?.emitEventReverse('mouseDown')
        // @ts-ignore
        rightLeg?.current?.emitEventReverse('mouseDown')
      case 6:
        // @ts-ignore
        post?.current?.emitEvent('mouseDown')
        break;
      case 5:
        // @ts-ignore
        head?.current?.emitEvent('mouseDown')
        break;
      case 4:
        // @ts-ignore
        torso?.current.emitEvent('mouseDown')
        break;
      case 3:
        // @ts-ignore
        leftArm.current.emitEvent('mouseDown')
        break;
      case 2:
        // @ts-ignore
        rightArm.current.emitEvent('mouseDown')
        break;
      case 1:
        // @ts-ignore
        leftLeg.current.emitEvent('mouseDown')
        break;
      case 0:
        // @ts-ignore
        rightLeg.current.emitEvent('mouseDown')
        break;
    }
  }, [state.context.triesRemaining])

  return (
    <div>
      <div className="preferably-square">
        <Spline scene="https://prod.spline.design/wKAJmeCkipY2gbK2/scene.splinecode" onLoad={onLoad} />
      </div>
      {active &&
        <input
          onKeyDown={(e) => handleInput(e)}
        />
      }
      <h1>{state.toStrings()}</h1>
      {state.can(ACTIONS.RESET) &&
        <button onClick={() => {
          send(ACTIONS.RESET)
        }}>reset</button>
      }
      <pre>{JSON.stringify(state.context, null, 2)}</pre>
    </div>
  )
}

export default HangmanUI