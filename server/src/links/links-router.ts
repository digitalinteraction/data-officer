import { AppContext, AppRouter, KoaRouter } from '../lib/module.js'
import { LinkRecord } from './link-record.js'

export class LinkRouter implements AppRouter {
  constructor(private context: AppContext) {}

  applyRoutes(router: KoaRouter): void {
    router.get('/l/:code', async (ctx) => {
      const client = await this.context.pg.getClient()

      try {
        // Find the corresponding link record
        const [link] = await client.sql<LinkRecord>`
          SELECT "id", "code", "url", "uses"::int
          FROM "links"
          WHERE "code" = ${ctx.params.code}
        `

        if (!link) {
          ctx.status = 404
          ctx.body = 'Short link not found'
          return
        }

        // Update the uses counter
        await client.sql`
          UPDATE "links"
          SET "uses" = ${link.uses + 1}
          WHERE id = ${link.id}
        `

        ctx.redirect(link.url)
      } finally {
        client.release()
      }
    })
  }
}
