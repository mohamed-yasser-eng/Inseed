import { Model } from 'mongoose'
import { IBlackListedToken } from '../../Common'
import { BaseRepository } from './base.repository'

export class BlackListedTokenRepository extends BaseRepository<IBlackListedToken> {
  constructor(protected _blackListedTokensModel: Model<IBlackListedToken>) {
    super(_blackListedTokensModel)
  }
}
