import { JwtPayload } from 'jsonwebtoken'

import { BlackListedTokenModel, UserModel } from '../Db/Models'
import { verifyToken } from '../Utils'

export type GraphQLContext = Record<PropertyKey, unknown> & {
  userId?: string
}

type GraphQLHeaders = {
  [key: string]: unknown
  get?: (key: string) => string | null
  authorization?: string | string[]
}

export const createGraphQLContext = async (headers: GraphQLHeaders): Promise<GraphQLContext> => {
  const rawAccessToken = headers.get ? headers.get('authorization') : headers.authorization
  const accessToken = Array.isArray(rawAccessToken) ? rawAccessToken[0] : rawAccessToken
  if (!accessToken) return {}

  const [prefix, token] = accessToken.split(' ')
  if (prefix !== process.env.JWT_PREFIX || !token) return {}

  let decodedData: JwtPayload
  try {
    decodedData = verifyToken(token)
  } catch {
    return {}
  }

  if (!decodedData._id) return {}

  const blackListedToken = await BlackListedTokenModel.findOne({ tokenId: decodedData.jti })
  if (blackListedToken) return {}

  const user = await UserModel.findById(decodedData._id).select('_id').lean()
  if (!user) return {}

  return { userId: user._id.toString() }
}

export const requireGraphQLUser = (context: GraphQLContext): string => {
  if (!context.userId) throw new Error('Unauthorized')
  return context.userId
}
