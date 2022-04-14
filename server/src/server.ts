import http from 'http'

import Koa from 'koa'
import KoaRouter from '@koa/router'
import koaCors from '@koa/cors'
import koaJson from 'koa-json'
import koaBodyParser from 'koa-bodyparser'
import koaHelmet from 'koa-helmet'

import ms from 'ms'

import { ApiError, AppContext, AppRouter, createDebug } from './lib/module.js'
import { GeneralRouter } from './general/general-router.js'
import { AuthRouter } from './auth/auth-router.js'
import { LinkRouter } from './links/links-router.js'
import { EntriesRouter } from './entries/entries-router.js'

const debug = createDebug('app:server')

/** A middleware to output requests when in debug mode */
function debugMiddleware(): Koa.Middleware {
  return async (ctx, next) => {
    const start = Date.now()
    await next()

    // Check for invalid ctx.body use
    if (ctx.body instanceof Promise) {
      console.error('A promise was set on ctx.body')
      console.error(
        'Request: %s %i %s',
        ctx.request.method,
        ctx.response.status,
        ctx.request.path
      )
      process.exit(1)
    }

    const dt = Date.now() - start
    debug(
      '%s %i %s %s',
      ctx.request.method,
      ctx.response.status,
      ctx.request.path,
      ms(dt)
    )
  }
}

function httpErrorHandler(isProduction: boolean): Koa.Middleware {
  return async (ctx, next) => {
    try {
      await next()
    } catch (error) {
      if (!(error instanceof ApiError)) {
        error = ApiError.internalServerError(error)
      }
      const apiError = error as ApiError

      ctx.status = apiError.status
      ctx.body = {
        error: apiError.message,
        codes: apiError.codes,
        stack: apiError.stack?.split('\n').map((l) => l.trim()),
      }
    }
  }
}

export function createServer(context: AppContext) {
  const router = new KoaRouter()

  const routers: AppRouter[] = [
    new GeneralRouter(context),
    new AuthRouter(context),
    new LinkRouter(context),
    new EntriesRouter(context),
  ]
  routers.forEach((r) => r.apply(router))

  const app = new Koa()
    .use(koaHelmet({ hsts: context.env.NODE_ENV !== 'development' }))
    .use(koaCors({ origin: context.env.CLIENT_URL }))
    .use(koaJson())
    .use(koaBodyParser())
    .use(debugMiddleware())
    .use(httpErrorHandler(context.env.NODE_ENV === 'production'))
    .use(router.routes())
    .use(router.allowedMethods())

  const server = http.createServer(app.callback())

  return { app, server, router }
}
