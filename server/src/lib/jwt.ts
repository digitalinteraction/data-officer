import { IncomingHttpHeaders } from 'http'
import jwt from 'jsonwebtoken'
import { assert, type, object, array, string, number } from 'superstruct'

/** The roles an AppToken is allowed to have */
export const AppRoles = {
  admin: 'admin',
  user: 'user',
  login: 'login',
  verifySms: 'verify_sms',
}

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
    // Fail if the authorization header isn't in the form "bearer X"
    if (
      typeof headers.authorization !== 'string' ||
      !bearerRegex().test(headers.authorization)
    ) {
      return null
    }

    // Verify and parse the jwt payload
    const auth = headers.authorization.replace(bearerRegex(), '')
    const payload = this.verify(auth)
    if (!payload) return null

    // Fail if the token doesn't have a user or admin role
    if (
      !payload.app.roles.includes(AppRoles.user) &&
      !payload.app.roles.includes(AppRoles.admin)
    ) {
      return null
    }

    // If it got to hear the token is valid and returned
    return payload
  }
}
