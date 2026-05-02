import mongoose from 'mongoose'
import { IBlackListedToken } from '../../Common'

const blackListedTokensModel = new mongoose.Schema<IBlackListedToken>({
  tokenId: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
})

export const BlackListedTokenModel = mongoose.model<IBlackListedToken>('BlackListedTokens', blackListedTokensModel)

export default BlackListedTokenModel
