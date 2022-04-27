import fs from 'fs'
import KoaRouter from '@koa/router'
import { Server as SocketIoServer } from 'socket.io'

import { mask, Struct, validate } from 'superstruct'
import type { JwtService } from './jwt.js'
import type { PostgresService } from './postgres.js'
import type { EmailService } from './sendgrid.js'
import type { SmsService } from './sms.js'
import type { LinksService } from '../links/links-service.js'
import { AppConfigStruct, EnvRecord, EnvRecordStruct } from './structs.js'

export { KoaRouter, SocketIoServer }
export { default as createDebug } from 'debug'

function trimStack(error: Error) {
  error.stack = error.stack?.split('\n').slice(1).join('\n')
  return error
}

/** A http-response error for easy `throw`-ing */
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
  static internalServerError(error?: unknown) {
    console.error('InternalServerError', error)
    return trimStack(new this(500, ['general.internalServerError']))
  }
  static notImplemented() {
    return trimStack(new this(501, ['general.notImplemented']))
  }
  constructor(public status: number, public codes: string[]) {
    super(`There were error(s) with your request: ${codes.join(', ')}`)
    this.name = 'ApiError'
    Error.captureStackTrace(this, ApiError)
  }
}

/** Something that provides http routes */
export interface AppRouter {
  applyRoutes(router: KoaRouter): void
}

/** Something that provides socket.io messages */
export interface AppBroker {
  applyIo(io: SocketIoServer): void
}

/** Shared context for `AppRouter` and `AppBroker` implementors */
export interface AppContext {
  env: EnvRecord
  pkg: { name: string; version: string }
  pg: PostgresService
  jwt: JwtService
  email: EmailService
  sms: SmsService
  links: LinksService
}

/** Validate a value agains a struct or throw a ApiError */
export function validateStruct<T>(value: unknown, struct: Struct<T>): T {
  const result = validate(value, struct)
  if (result[0]) throw ApiError.badRequest()
  return result[1]
}

/** Synchronously load and validate the app-config.json */
export function getAppConfig() {
  try {
    return mask(
      JSON.parse(fs.readFileSync('app-config.json', 'utf8')),
      AppConfigStruct
    )
  } catch (error) {
    console.error('Failed to load app-config.json:')
    console.error(error)
    process.exit(1)
  }
}

/** Synchronously load and validate the **root** package.json */
export function getPackageJson() {
  const { name, version } = JSON.parse(
    fs.readFileSync('./package.json', 'utf8')
  )
  return { name, version }
}

/** Synchronously load and validate process.env */
export function getEnvRecord() {
  try {
    return mask(process.env, EnvRecordStruct)
  } catch (error) {
    console.error('Failed to load environment variables:')
    console.error(error)
    process.exit(1)
  }
}
