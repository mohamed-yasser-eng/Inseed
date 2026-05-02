import { NextFunction, Request, Response } from 'express'
import { JwtPayload } from 'jsonwebtoken'

import { IRequest, IUser } from '../Common'
import { BlackListedTokenModel, UserModel } from '../Db/Models'
import { BlackListedTokenRepository, UserRepository } from '../Db/Repositories'
import { verifyToken } from '../Utils'
import { BadRequestException } from '../Utils/Errors/exceptions.utils'

const userRepository = new UserRepository(UserModel)
const blackListedTokenRepository = new BlackListedTokenRepository(BlackListedTokenModel)

export const authentication = async (req: Request, res: Response, next: NextFunction) => {
  const { authorization: accessToken } = req.headers
  if (!accessToken) throw next(new BadRequestException('pleaseeeee login fisrt'))

  const [Prefix, token] = accessToken.split(' ')
  if (Prefix !== process.env.JWT_PREFIX) return res.status(401).json({ message: 'Invalid access token format' })

  const decodedData = verifyToken(token)
  if (!decodedData._id) return res.status(401).json({ message: 'Invalid payload in access token' })

  const blackListedToken = await blackListedTokenRepository.findOneDocument({ tokenId: decodedData.jti })
  if (blackListedToken) return res.status(401).json({ message: 'user session expired, login again.' })

  const user: IUser | null = await userRepository.findDocumentById(decodedData._id, '-password')
  if (!user) return res.status(404).json({ message: 'User not found, please signup first.' })
    ; (req as unknown as IRequest).loggedInUser = { user, token: decodedData as JwtPayload }
  return next()
}
