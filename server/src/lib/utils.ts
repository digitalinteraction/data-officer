import KoaRouter from '@koa/router'
import { EnvRecord } from './structs'

export { default as createDebug } from 'debug'

function trimStack(error: Error) {
  error.stack = error.stack?.split('\n').slice(1).join('\n')
  return error
}

export class ApiError extends Error {
  static badRequest() {
    return trimStack(new this(400, ['general.badRequest']))
  }
  static unauthorized() {
    return trimStack(new this(401, ['general.unauthorized']))
  }
  static notFound() {
    return trimStack(new this(404, ['general.notFound']))
  }
  static internalServerError() {
    return trimStack(new this(500, ['general.internalServerError']))
  }
  static notImplemented() {
    return trimStack(new this(501, ['general.notImplemented']))
  }
  constructor(public status: number, public codes: string[]) {
    super(
      `There were error(s) with your request: ${codes
        .map((c) => `"${c}"`)
        .join('\n')}`
    )
    this.name = 'ApiError'
    Error.captureStackTrace(this, ApiError)
  }
}

export interface AppRouter {
  apply(router: KoaRouter): void
}

export interface AppContext {
  env: EnvRecord
  pkg: { name: string; version: string }
}
