export interface HangmanContext {
  word: string
  guessedLetters: { correct: string, incorrect: string },
  triesRemaining: number
  error: string | null
}

export enum STATES {
  INACTIVE = 'INACTIVE',
  ACTIVE = 'ACTIVE',
  WIN = 'WIN',
  LOSE = 'LOSE',
  FAILURE = 'FAILURE',
}

export enum ACTIONS {
  SETWORD = 'SETWORD',
  SETERROR = 'SETERROR',
  HANDLEGUESS = 'HANDLEGUESS',
  RESET = 'RESET',
}

export enum GUARDS {
  HASWON = "HASWON",
  HASLOST = "HASLOST",
}