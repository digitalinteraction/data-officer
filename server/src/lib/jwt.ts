import { IncomingHttpHeaders } from 'http'
import jwt from 'jsonwebtoken'
import {
  assert,
  type,
  Struct,
  object,
  array,
  string,
  number,
} from 'superstruct'

export interface AppToken {
  sub: number
  app: {
    roles: string[]
  }
}

export const bearerRegex = () => /^bearer\s+/i

export interface JwtServiceOptions {
  secretKey: string | Buffer | { key: string | Buffer; passphrase: string }
  issuer: string
}

export const AppTokenStruct = type({
  sub: number(),
  app: object({
    roles: array(string()),
  }),
})

export interface JwtSignOptions {
  expiresIn?: string | number
}

export class JwtService {
  constructor(private options: JwtServiceOptions) {}

  sign(payload: AppToken, options: JwtSignOptions = {}): string {
    return jwt.sign(payload, this.options.secretKey, {
      ...options,
      issuer: this.options.issuer,
    })
  }

  verify(token: string): AppToken | null {
    try {
      const payload = jwt.verify(token, this.options.secretKey)
      assert(payload, AppTokenStruct)
      return payload
    } catch (error) {
      return null
    }
  }

  getRequestAuth(headers: IncomingHttpHeaders): AppToken | null {
    if (
      typeof headers.authorization !== 'string' ||
      !bearerRegex().test(headers.authorization)
    ) {
      return null
    }
    const auth = headers.authorization.replace(bearerRegex(), '')
    const payload = this.verify(auth)
    if (!payload) return null
    if (
      !payload.app.roles.includes('user') &&
      !payload.app.roles.includes('admin')
    ) {
      return null
    }
    return payload
  }
}
