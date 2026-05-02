import { Request, Response } from 'express'
import { FilterQuery } from 'mongoose'
import { ChatTypeEnum, FriendShipStatusEnum, IFriendShip, IRequest } from '../../../Common'
import { ConversationModel, FriendShipModel, UserModel } from '../../../Db/Models'
import { ConversationRepository, FriendShipRepository, UserRepository } from '../../../Db/Repositories'
import { BadRequestException, S3ClientServicce } from '../../../Utils'
import { SuccessResponse } from '../../../Utils/Response/response-helper.utils'

export class ProfileService {
  private s3Client = new S3ClientServicce()
  private userRepository = new UserRepository(UserModel)
  private friendShipRepository = new FriendShipRepository(FriendShipModel)
  private conversationRepo = new ConversationRepository(ConversationModel)

  uploadProfilePicture = async (req: Request, res: Response) => {
    const file = req.file
    const { user } = (req as unknown as IRequest).loggedInUser

    if (!file) throw new BadRequestException('No file uploaded')

    const { key, url } = await this.s3Client.uploadFileOnS3(file, `${user._id}/profile`)

    user.profilePicture = key
    await user.save()

    res.json(
      SuccessResponse('Profile picture uploaded successfully', 200, {
        key,
        url,
      }),
    )
  }

  renewSignedUrl = async (req: Request, res: Response) => {
    const { user } = (req as unknown as IRequest).loggedInUser
    const { key, keyType }: { key: string; keyType: 'profilePicture' | 'coverPicture' } = req.body

    if (user[keyType] !== key) throw new BadRequestException('Invalid key')

    const url = await this.s3Client.getFileWithSignedUrl(key)

    res.json(SuccessResponse('Signed URL renewed successfully', 200, { key, url }))
  }

  deletAccount = async (req: Request, res: Response) => {
    const { user } = (req as unknown as IRequest).loggedInUser
    const deletedDocument = await this.userRepository.deleteByIdDocument(user._id)
    if (!deletedDocument) throw new BadRequestException('User not found')

    const deleteResponse = await this.s3Client.deleteFileFromS3(deletedDocument?.profilePicture as string)
    res.json(SuccessResponse('Account deleted successfully', 200, deleteResponse))
  }

  updateProfile = async (req: Request, res: Response) => { }

  sendFriendShipRequest = async (req: Request, res: Response) => {
    const {
      user: { _id },
    } = (req as unknown as IRequest).loggedInUser
    const { requestToId } = req.body

    const user = await this.userRepository.findDocumentById(requestToId)
    if (!user) throw new BadRequestException('User not found')

    await this.friendShipRepository.createNewDocument({
      requestFromId: _id,
      requestToId,
    })

    res.json(SuccessResponse('Friendship request sent successfully', 200))
  }

  listRequests = async (req: Request, res: Response) => {
    const {
      user: { _id }
    } = (req as unknown as IRequest).loggedInUser
    const { status } = req.query

    const filters: FilterQuery<IFriendShip> = {
      status: status ? status : FriendShipStatusEnum.PENDING,
    }
    if (filters.status == FriendShipStatusEnum.ACCEPTED) filters.$or = [{ requestFromId: _id }, { requestToId: _id }]
    else filters.requestToId = _id

    const requests = await this.friendShipRepository.findDocuments(filters, undefined, {
      populate: [
        {
          path: 'requestFromId',
          select: 'firstName lastName profilePicture',
        },
        {
          path: 'requestToId',
          select: 'firstName lastName profilePicture',
        },
      ],
    })

    const groups = await this.conversationRepo.findDocuments({ type: 'group', members: { $in: _id } })

    res.json(SuccessResponse('Friendship requests fetched successfully', 200, { requests, groups }))
  }

  respondToFriendShipRequest = async (req: Request, res: Response) => {
    const {
      user: { _id },
    } = (req as IRequest).loggedInUser
    const { friendRequestId, response } = req.body

    const friendRequest = await this.friendShipRepository.findOneDocument({
      _id: friendRequestId,
      requestToId: _id,
      status: FriendShipStatusEnum.PENDING,
    })
    if (!friendRequest) throw new BadRequestException('Friendship request not found')

    friendRequest.status = response
    await friendRequest.save()

    res.json(SuccessResponse<IFriendShip>('Friendship request responded successfully', 200, friendRequest))
  }


  createGroup = async (req: Request, res: Response) => {
    const { user: { _id } } = (req as IRequest).loggedInUser
    const { name, memberIds } = req.body

    const members = await this.userRepository.findDocuments({ _id: { $in: memberIds } })
    if (members.length !== memberIds.length) throw new BadRequestException('One or more users not found')

    const friendship = await this.friendShipRepository.findDocuments({
      $or: [
        { requestFromId: _id, requestToId: { $in: memberIds } },
        { requestFromId: { $in: memberIds }, requestToId: _id }
      ],
      status: FriendShipStatusEnum.ACCEPTED
    })
    if (friendship.length !== memberIds.length) throw new BadRequestException('You can only create group with your friends')

    const group = await this.conversationRepo.createNewDocument({
      type: ChatTypeEnum.GROUP,
      name,
      members: [_id, ...memberIds],
    })


    res.json(SuccessResponse('Group created successfully', 200, group))
  }

}

export default new ProfileService()
