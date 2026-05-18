import { Server as HttpServer } from "http";
import { Server, Socket } from 'socket.io';
import { consumeSocketRateLimit, socketAuthRateLimiter } from "../Middlewares";
import { ChatInitiation } from "../Modules/Chat/chat";
import { isOriginAllowed } from "../Utils/cors.utils";
import { verifyToken } from "../Utils";



export const connectedSockets = new Map<string, string[]>()
let io: Server | null = null


async function socketAuthentication(socket: Socket, next: Function) {
        const authKey = socket.handshake.address || socket.id
        const isAllowed = await consumeSocketRateLimit(socketAuthRateLimiter, authKey)
        if (!isAllowed) return next(new Error('Too many socket connection attempts, please try again later'))

        const authorization = socket.handshake.auth.authorization
        if (!authorization) return next(new Error('Authentication token is required'))

        const [Prefix, token] = authorization.split(' ')
        if (Prefix !== process.env.JWT_PREFIX || !token) return next(new Error('Invalid authentication token format'))

        let decodedData
        try {
            decodedData = verifyToken(token, process.env.JWT_ACCESS_SECRET as string)
        } catch {
            return next(new Error('Invalid or expired authentication token'))
        }

        if (!decodedData._id) return next(new Error('Invalid authentication token payload'))
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

    io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (isOriginAllowed(origin)) return callback(null, true)
                return callback(new Error('CORS origin is not allowed'))
            },
        },
    })
    io.use(socketAuthentication)
    io.on('connection', (socket: Socket) => {
        ChatInitiation(socket)
        socketDisconnection(socket)
    })

}


export const getIo = () => {
    return io
}






