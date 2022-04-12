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

const bearerRegex = () => /^bearer\s+/i

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

export class JwtService {
  constructor(private options: JwtServiceOptions) {}

  sign<T extends object>(payload: T, expiresIn: string | undefined): string {
    return jwt.sign(payload, this.options.secretKey, {
      issuer: this.options.issuer,
      expiresIn,
    })
  }

  verify<T extends object>(token: string, struct: Struct<T>): T | null {
    try {
      const payload = jwt.verify(token, this.options.secretKey)
      assert(payload, struct)
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
    return this.verify(auth, AppTokenStruct)
  }
}
