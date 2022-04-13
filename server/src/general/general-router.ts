import { AppContext, AppRouter, KoaRouter } from '../lib/utils.js'

export class GeneralRouter implements AppRouter {
  constructor(private context: AppContext) {}

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
