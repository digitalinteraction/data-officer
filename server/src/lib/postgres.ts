import pg from 'pg'
import { createDebug } from './utils.js'

const debug = createDebug('app:lib:postgres')

export interface PostgresClient {
  release(): void
  sql<T>(strings: TemplateStringsArray, ...args: any[]): Promise<T[]>
}

/** A utility to turn a ES template string into a prepared sql query */
export function composeSql(strings: TemplateStringsArray, ...values: any[]) {
  const parts: string[] = []

  for (let i = 0; i < strings.length; i++) {
    parts.push(strings[i] as string)

    if (i < values.length) {
      parts.push(`$${i + 1}`)
    }
  }

  const output = { text: parts.join(''), values }

  debug(`SQL %o %O`, output.text.trim().replace(/\s+/g, ' '), output.values)

  return output
}

export interface PostgresServiceOptions {
  connectionString: string
}

export class PostgresService {
  private pool: pg.Pool

  constructor(private options: PostgresServiceOptions) {
    this.pool = new pg.Pool({ connectionString: options.connectionString })
  }

  async getClient(): Promise<PostgresClient> {
    const client = await this.pool.connect()

    return {
      release: () => client.release(),
      sql: (...args) => client.query(composeSql(...args)).then((r) => r.rows),
    }
  }

  async close() {
    await this.pool.end()
  }

  async checkHealth() {
    await this.run((c) => c.sql`SELECT 1;`)
  }

  async run<T>(block: (client: PostgresClient) => Promise<T>) {
    let client: PostgresClient | undefined

    try {
      client = await this.getClient()

      const result = await block(client)

      return result
    } finally {
      client?.release()
    }
  }
}
