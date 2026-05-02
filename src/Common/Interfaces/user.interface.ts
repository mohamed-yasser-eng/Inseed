import { Request } from 'express'
import { JwtPayload } from 'jsonwebtoken'
import { Document, Types } from 'mongoose'
import { ChatTypeEnum, FriendShipStatusEnum, GenderEnum, OtpTypesEnum, ProviderEnum, RoleEnum } from '../Enums/user.enum'

interface IOTP {
  value: string
  expiresAt: number
  OTPType: OtpTypesEnum
}

interface IUser extends Document {
  firstName: String
  lastName: String
  email: String
  password: String
  role: RoleEnum
  gender: GenderEnum
  DOB?: Date
  profilePicture?: String
  coverPicture?: String
  provider: ProviderEnum
  googleId?: String
  phoneNumber?: String
  isVerified?: Boolean
  OTPS?: IOTP[]
}

interface IEmailArgument {
  to: string
  cc?: string
  subject: string
  content: string
  attachments?: []
}

interface IRequest extends Request {
  loggedInUser: { user: IUser; token: JwtPayload }
}

interface IBlackListedToken extends Document {
  tokenId: string
  expiresAt: Date
}

interface IFriendShip extends Document {
  requestFromId: Types.ObjectId
  requestToId: Types.ObjectId
  status: FriendShipStatusEnum
}

interface IMessage extends Document {
  text: String
  conversationId: Types.ObjectId
  senderId: Types.ObjectId
  attachments?: String[]
}

interface IConversation extends Document {
  type: ChatTypeEnum
  name?: String
  members: Types.ObjectId[]
}

interface IPost extends Document {
  description: String
  attachments: String[]
  ownerId: Types.ObjectId
  allowComments: Boolean
  tags: Types.ObjectId[]
}



interface IComment extends Document {
  content: String
  attachments: String
  ownerId: Types.ObjectId
  refId: Types.ObjectId
  onModel: string
}

export { IBlackListedToken, IComment, IConversation, IEmailArgument, IFriendShip, IMessage, IPost, IRequest, IUser }

