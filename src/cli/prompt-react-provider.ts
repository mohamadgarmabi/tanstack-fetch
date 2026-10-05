import { createInterface } from 'node:readline/promises'

/** Interactive prompt for React scaffold. Default: no FetchProvider. */
const promptReactProvider = async (): Promise<boolean> => {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return false
  }

  const readline = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = await readline.question(
      'Use FetchProvider for React? [y/N] (default: no — pass { client: api } instead): ',
    )
    const normalized = answer.trim().toLowerCase()
    return normalized === 'y' || normalized === 'yes'
  } finally {
    readline.close()
  }
}

export { promptReactProvider }
