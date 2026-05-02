import { Server as HttpServer } from "http";
import { Server, Socket } from 'socket.io';
import { ChatInitiation } from "../Modules/Chat/chat";
import { BadRequestException, verifyToken } from "../Utils";



export const connectedSockets = new Map<string, string[]>()
let io: Server | null = null


function socketAuthentication(socket: Socket, next: Function) {
        const token = socket.handshake.auth.authorization
        const decodedData = verifyToken(token, process.env.JWT_ACCESS_SECRET as string)
        socket.data = { userId: decodedData._id }

        const userTabs = connectedSockets.get(socket.data.userId)
        if (!userTabs) connectedSockets.set(socket.data.userId, [socket.id])
        else userTabs.push(socket.id)

        socket.emit('connected', { user: { _id: socket.data.userId, firstName: decodedData.firstName, lastName: decodedData.lastName } })
        next()

}


function socketDisconnection(socket: Socket) {
    socket.on('disconnect', () => {
        const userId = socket.data.userId
        let userTabs = connectedSockets.get(userId)
        if (userTabs && userTabs.length) {
            userTabs = userTabs.filter(tab => tab !== socket.id)
            if (!userTabs.length) connectedSockets.delete(userId)
        }
    })
}

export const ioInitializer = (server: HttpServer) => {

    io = new Server(server, { cors: { origin: '*' } })
    io.use(socketAuthentication)
    io.on('connection', (socket: Socket) => {
        console.log('Socket user connected: ', socket.data)
        ChatInitiation(socket)
        socketDisconnection(socket)
    })

}


export const getIo = () => {
    try {
        if (!io) throw new Error('Socket.io instance not initialized')
        return io
    } catch (error) {
        console.log(error);

    }

}






