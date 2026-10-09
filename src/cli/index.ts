import { runDoctor } from './doctor'
import { generateClient } from './generate'
import { loadSpec } from './load-spec'
import { runMigrate } from './migrate'
import { helpText, parseArgs } from './parse-args'

const runCli = async (argv = process.argv.slice(2)) => {
  const args = parseArgs(argv)
  if (args.command === 'help') {
    console.log(helpText)
    return
  }
  if (args.command === 'doctor') {
    await runDoctor(args)
    return
  }
  if (args.command === 'migrate') {
    await runMigrate(args)
    return
  }
  const spec = await loadSpec(args.spec)
  await generateClient(spec, args.out)
  console.log(`tanstack-fetch: generated client in ${args.out}`)
}

runCli().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown CLI error'
  console.error(message)
  process.exitCode = 1
})
