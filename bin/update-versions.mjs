#!/usr/bin/env node

import fs from 'fs/promises'

async function main() {
  const { version } = JSON.parse(fs.readFile('package.json', 'utf8'))

  const files = [
    'client/package.json',
    'client/package-lock.json',
    'server/package.json',
    'server/package-lock.json',
  ]

  for (const file of files) {
    const input = await fs.readFile(file, 'utf8')
    const mutated = input.replace(
      /^  "version":\s+"(.+?)",$/m,
      `  "version": "${version}",`
    )

    await fs.writeFile(file, mutated)
  }
}

main()
