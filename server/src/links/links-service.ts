import { PostgresClient } from '../lib/module.js'
import { LinkRecord } from './link-record.js'

export interface LinksServiceOptions {}

const alphabet = 'abcdefghijklmnopqrstuvqxyzABCDEFGHIJKLMNOPQRSTUVQXYZ123456789'

function randomCode(length: number) {
  let output = ''
  for (let i = 0; i < length; i++) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return output
}

function uniqueRandomCode(length: number, previous: Set<string>) {
  for (let i = 0; i < 50; i++) {
    const code = randomCode(length)
    if (previous.has(code)) continue
    return code
  }
  throw new Error('Failed to randomly generate a unique code')
}

export class LinksService {
  constructor(private options: LinksServiceOptions) {}

  async createLink(url: string, client: PostgresClient) {
    const links = await client.sql<{ code: string }>`
      SELECT "code" FROM "links"
    `

    const code = uniqueRandomCode(6, new Set(links.map((l) => l.code)))

    const link = await client.sql<LinkRecord>`
      INSERT INTO "links" ("code", "url")
      VALUES ${code} ${url}
      RETURNING "id", "code", "url", "uses"
    `

    return link
  }
}
