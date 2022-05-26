#!/usr/bin/env node

//
// The cli entrypoint
//

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { remindersCommand } from './commands/reminders-command.js'
import { serveCommand } from './commands/serve-command.js'

const cli = yargs(hideBin(process.argv))
  .help()
  .demandCommand(1, 'A command is required')
  .recommendCommands()

function errorHandler(error: any) {
  console.error('A fatal error occured')
  console.error(error)
  process.exit(1)
}

cli.command(
  'serve',
  'Run the http server',
  (yargs) => yargs.option('port', { type: 'number', default: 3000 }),
  (args) => serveCommand(args).catch(errorHandler)
)

cli.command(
  'reminders',
  'Process and send user reminders',
  (yargs) => yargs.option('dryRun', { type: 'boolean', default: false }),
  (args) => remindersCommand(args).catch(errorHandler)
)

cli.parse()
