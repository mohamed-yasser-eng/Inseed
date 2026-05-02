import { Socket } from "socket.io";
import { ChatService } from "./Services/chat.services";





export class ChatEvents {
    private chatService: ChatService = new ChatService()

    constructor(private socket: Socket) { }



    sendPrivateMessageEvent() {
        this.socket.on('send-private-message', (data) => {
            console.log('data from send private message event :', data);
            this.chatService.sendPrivateMessage(this.socket, data)
        })
    }


    getConversationMessagesEvent() {
        this.socket.on('get-chat-history', (data) => {
            this.chatService.getConversationMessages(this.socket, data)
        })
    }

    sendgroupMessageEvent() {
        this.socket.on('send-group-message', (data) => {
            this.chatService.sendGroupMessage(this.socket, data)
        })
    }

    getGroupHistoryEvent() {
        this.socket.on('get-group-chat', (data) => {
            this.chatService.getGroupHistory(this.socket, data)
        })
    }
}

