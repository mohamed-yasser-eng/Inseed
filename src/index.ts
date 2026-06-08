import 'dotenv/config'
import './Config/env.config'
import cors from 'cors'
import helmet from 'helmet'
import multer from 'multer'
import morgan from 'morgan'
import express, { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import { Server, Socket } from 'socket.io'



import { connectDB } from './Db/db.connection'
import * as controllers from './Modules/controllers.index'
import { HttpException } from './Utils'
import { FailedResponse } from './Utils/Response/response-helper.utils'
import { ioInitializer } from './Gateways/socketIo.gateways'
import { graphQLHandler } from './GraphQl/index.graphql'
import { isOriginAllowed } from './Utils'
import { cleanupUploadedFiles, graphQLRateLimitMiddleware, rateLimitMiddleware } from './Middlewares'
import { redis } from './Config/redis.config'
import { SuccessResponse } from './Utils/Response/response-helper.utils'


const app = express()

app.use(helmet())

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) return callback(null, true)
      return callback(new Error('CORS origin is not allowed'))
    },
  }),
)
app.use(express.json({ limit: '1mb' }))

app.use(rateLimitMiddleware)

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.get('/health', (_req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  const redisStatus = redis.status

  res.status(200).json(
    SuccessResponse('Health check completed', 200, {
      server: 'ok',
      mongo: mongoStatus,
      redis: redisStatus,
      uptime: process.uptime(),
    }),
  )
})

app.all('/graphql', graphQLRateLimitMiddleware, graphQLHandler)

app.use('/api/auth', controllers.authController)
app.use('/api/users', controllers.profileController)
app.use('/api/posts', controllers.postController)
app.use('/api/comments', controllers.commentController)
app.use('/api/reacts', controllers.reactController)

app.use(async (err: HttpException | Error | null, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    await cleanupUploadedFiles(req)

    if (err instanceof multer.MulterError) {
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file is too large' : err.message
      res.status(status).json(FailedResponse(message, status))
    } else if (err instanceof HttpException) {
      res.status(err.statusCode).json(FailedResponse(err.message, err.statusCode, err.error))
    } else {
      res.status(500).json(FailedResponse('Internal Server Error', 500))
    }
  }
})

connectDB()

const port: number | string = process.env.PORT as string
const myServer = app.listen(port, () => {
  console.log('Server is running on port ', process.env.PORT)
})

ioInitializer(myServer)
