import mongoose, { Types } from "mongoose"
import { ChatTypeEnum, IConversation } from "../../Common"


const ConversationSchema = new mongoose.Schema<IConversation>({
    type: {
        type: String,
        default: ChatTypeEnum.DIRECT,
        enum: ChatTypeEnum
    },
    name: String,
    members: [{ type: Types.ObjectId, ref: "User" }],
})


export const ConversationModel = mongoose.model<IConversation>('Conversation', ConversationSchema)


