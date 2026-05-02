import jwt, { JwtPayload, Secret, SignOptions, VerifyOptions } from 'jsonwebtoken'

export const generateToken = (
  payload: string | Buffer | object,
  secretOrPrivateKey: Secret = process.env.JWT_ACCESS_SECRET as string,
  options?: SignOptions,
): string => { return jwt.sign(payload, secretOrPrivateKey, options) }

export const verifyToken = (
  token: string,
  secretOrPublicKey: Secret = process.env.JWT_ACCESS_SECRET as string,
  options?: VerifyOptions,
): JwtPayload => { return jwt.verify(token, secretOrPublicKey, options) as JwtPayload }
