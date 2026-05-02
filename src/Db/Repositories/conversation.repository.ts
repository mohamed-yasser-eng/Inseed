import { Model } from "mongoose";
import { IConversation } from "../../Common";
import { BaseRepository } from "./base.repository";



export class ConversationRepository extends BaseRepository<IConversation> {
    constructor(model: Model<IConversation>) {
        super(model)
    }
}