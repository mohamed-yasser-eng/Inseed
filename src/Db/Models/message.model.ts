import mongoose from "mongoose"
import { IMessage } from "../../Common"


const messageSchema = new mongoose.Schema<IMessage>({
    text:String,
    conversationId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Conversation",
        required:true
    },
    senderId:{  
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    attachments:[String]
})





export const MessageModel = mongoose.model<IMessage>('Message',messageSchema)





