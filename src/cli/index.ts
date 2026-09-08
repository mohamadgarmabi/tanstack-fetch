import { generateClient } from './generate'
import { loadSpec } from './load-spec'
import { helpText, parseArgs } from './parse-args'

const runCli = async (argv = process.argv.slice(2)) => {
  const args = parseArgs(argv)
  if (args.command === 'help') {
    console.log(helpText)
    return
  }
  const spec = await loadSpec(args.spec)
  await generateClient(spec, args.out)
  console.log(`ssrfetch: generated client in ${args.out}`)
}

runCli().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown CLI error'
  console.error(message)
  process.exitCode = 1
})
