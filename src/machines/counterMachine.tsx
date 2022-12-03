import { assign, createMachine } from 'xstate'

export type CountContext =  {
  count: number
}
const increment = (context: CountContext) => context.count + 1;
const decrement = (context: CountContext) => context.count - 1;

const isNotMax = (context: CountContext) => context.count < 10;
const isNotMin = (context: CountContext) => context.count > 0;

export const counterMachine = 
/** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOiwBdcA3MAYgEkA5AYQG0AGAXUVAAcB7WLkr98PEAA9EAdnYkALAFZ2igEyKAbAEZZADmlb5AGhABPRDoCcJdgGZL7aatvzpSpwF8PJtFjyFSCmo6ABEAUTYucQEhETEkSUR5VRNzBF1VEktpDU1FJwMtLXZdL28QfH4IOHFfHAJiaMFhXFFxKQQAWg1UxG6bdkGh4aHpLx8MeoCyTEoaJtjW+NAOjVssy1UtS1t2eQ0NHdstHrNEVV05Yq183UsNaUvbZ7KPIA */
createMachine({
  context: { count: 0 },
  schema: { context: {} as CountContext },
  id: "counterMachine",
  initial: "active",
  states: {
    active: {
      on: {
        INC: {
          cond: isNotMax,
          actions: assign({ count: increment }),
        },
        DEC: {
          cond: isNotMin,
          actions: assign({ count: decrement }),
        },
      },
    },
  },
});