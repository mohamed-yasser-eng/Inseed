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

        if (socket.data.userId === targetUserId) throw new BadRequestException('You cannot start a direct chat with yourself')

        const directMembers = [socket.data.userId, targetUserId].sort()
        const directKey = directMembers.join(':')

        let conversation = await this.conversationRepo.findOneDocument({ type: ChatTypeEnum.DIRECT, directKey })

        if (!conversation) {
            conversation = await this.conversationRepo.createNewDocument({ type: ChatTypeEnum.DIRECT, members: directMembers, directKey })
        }
        socket.join(conversation._id.toString())
        return conversation
    }


    async sendPrivateMessage(socket: Socket, data: any) {
        const { text, targetUserId } = data as { text: string, targetUserId: string }
        const conversation = await this.joinPrivateChat(socket, targetUserId)

        // create message 
        const message = await this.messageRepo.createNewDocument({ text, conversationId: conversation._id, senderId: socket.data.userId })

        // emit message to the room
        getIo()?.to(conversation._id.toString()).emit('message-sent', message)

    }

    async getConversationMessages(socket: Socket, targetUserId: string) {
        const conversation = await this.joinPrivateChat(socket, targetUserId)
        const messages = await this.messageRepo.findDocuments({ conversationId: conversation._id })
        socket.emit('chat-history', messages)
    }

    async joinGroupChat(socket: Socket, targetGroupId: string) {
        let conversation = await this.conversationRepo.findOneDocument({
            _id: targetGroupId,
            type: ChatTypeEnum.GROUP,
            members: socket.data.userId,
        })
        if (!conversation) throw new BadRequestException('Group not found or you are not a member')
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
        await this.joinGroupChat(socket, targetGroupId)
        const messages = await this.messageRepo.findDocuments({ conversationId: targetGroupId })
        socket.emit('group-chat-history', messages)
    }





}


