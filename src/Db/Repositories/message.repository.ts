import { Model } from "mongoose";
import { IMessage } from "../../Common";
import { BaseRepository } from "./base.repository";





export class MessageRepository extends BaseRepository<IMessage> {
    constructor(model: Model<IMessage>) {
        super(model)
    }
}