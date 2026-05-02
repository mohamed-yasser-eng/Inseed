import cors from 'cors'
import 'dotenv/config'
import express, { NextFunction, Request, Response } from 'express'
import { Server, Socket } from 'socket.io'
import { connectDB } from './Db/db.connection'
import * as controllers from './Modules/controllers.index'
import { HttpException } from './Utils'
import { FailedResponse } from './Utils/Response/response-helper.utils'
import { ioInitializer } from './Gateways/socketIo.gateways'
import fs from 'fs'
import morgan from 'morgan'


const app = express()

app.use(cors())
app.use(express.json())

var accesLogStream = fs.createWriteStream('access.log') 

app.use(morgan('dev', { stream: accesLogStream }))




connectDB()

app.use('/api/auth', controllers.authController)
app.use('/api/users', controllers.profileController)
app.use('/api/posts', controllers.postController)
app.use('/api/comments', controllers.commentController)
app.use('/api/reacts', controllers.reactController)

app.use((err: HttpException | Error | null, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    if (err instanceof HttpException) {
      res.status(err.statusCode).json(FailedResponse(err.message, err.statusCode, err.error))
    } else {
      res.status(500).json(FailedResponse('Internal Server Error', 500, err))
    }
  }
})

const port: number | string = process.env.PORT as string
const myServer = app.listen(port, () => {
  console.log('Server is running on port ', process.env.PORT)
})


ioInitializer(myServer)


