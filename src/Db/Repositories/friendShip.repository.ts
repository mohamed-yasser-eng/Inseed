import { Model } from 'mongoose'
import { IFriendShip } from '../../Common'
import { BaseRepository } from './base.repository'

export class FriendShipRepository extends BaseRepository<IFriendShip> {
  constructor(model: Model<IFriendShip>) {
    super(model)
  }
}


