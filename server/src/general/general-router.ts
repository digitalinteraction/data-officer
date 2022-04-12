import KoaRouter from '@koa/router'
import { AppContext, AppRouter } from '../lib/utils.js'

export class GeneralRouter implements AppRouter {
  constructor(public context: AppContext) {}

  apply(router: KoaRouter) {
    router.get('general.index', '/', (ctx) => {
      ctx.body = {
        msg: 'ok',
        pkg: {
          name: this.context.pkg.name,
          version: this.context.pkg.version,
        },
      }
    })
  }
}
