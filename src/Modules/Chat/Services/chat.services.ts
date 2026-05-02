import { Socket } from "socket.io";
import { ChatTypeEnum } from "../../../Common";
import { ConversationModel, MessageModel } from "../../../Db/Models";
import { ConversationRepository, MessageRepository } from "../../../Db/Repositories";
import { getIo } from "../../../Gateways/socketIo.gateways";
import { BadRequestException } from "../../../Utils";




export class ChatService {

    private conversationRepo = new ConversationRepository(ConversationModel)
    private messageRepo = new MessageRepository(MessageModel)

    async joinPrivateChat(socket: Socket, targetUserId: string) {

        // console.log('join private called ')

        let conversation = await this.conversationRepo.findOneDocument({ type: ChatTypeEnum.DIRECT, members: { $all: [socket.data.userId, targetUserId] } })

        // console.log('search for conversation result', conversation);

        // console.log("conversation doesnt exist? :", !conversation);

        if (!conversation) {
            console.log('creating new conversation');
            conversation = await this.conversationRepo.createNewDocument({ type: ChatTypeEnum.DIRECT, members: [socket.data.userId, targetUserId] })
        }
        socket.join(conversation._id.toString())
        return conversation
    }


    async sendPrivateMessage(socket: Socket, data: any) {
        const { text, targetUserId } = data as { text: string, targetUserId: string }
        const conversation = await this.joinPrivateChat(socket, targetUserId)

        // console.log('socket data from send private message:', socket.data.userId, 'targeted user id:', targetUserId);

        // create message 
        const message = await this.messageRepo.createNewDocument({ text, conversationId: conversation._id, senderId: socket.data.userId })

        // emit message to the room
        getIo()?.to(conversation._id.toString()).emit('message-sent', message)

    }

    async getConversationMessages(socket: Socket, targetUserId: string) {
        const conversation = await this.joinPrivateChat(socket, targetUserId)
        // console.log('conversation id got from join :', conversation._id);
        const messages = await this.messageRepo.findDocuments({ conversationId: conversation._id })
        // console.log('messages log ', messages);
        socket.emit('chat-history', messages)
    }

    async joinGroupChat(socket: Socket, targetGroupId: string) {
        let conversation = await this.conversationRepo.findOneDocument({ _id: targetGroupId, type: ChatTypeEnum.GROUP })
        if (!conversation) throw new BadRequestException('Group ID doesnt exist')
        socket.join(conversation._id.toString())
        return conversation

    }


    async sendGroupMessage(socket: Socket, data: any) {
        const { text, targetGroupId } = data as { text: string, targetGroupId: string }
        const conversation = await this.joinGroupChat(socket, targetGroupId)

        const message= await this.messageRepo.createNewDocument({ text, conversationId: conversation._id, senderId: socket.data.userId })

        getIo()?.to(conversation._id.toString()).emit('message-sent', message)
    }



    async getGroupHistory(socket: Socket, targetGroupId: string) {
        const messages = await this.messageRepo.findDocuments({ conversationId: targetGroupId })
        socket.emit('group-chat-history', messages)
    }





}


