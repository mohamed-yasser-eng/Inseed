import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import { IRequest } from "../../../Common";
import { FriendShipModel, UserModel } from "../../../Db/Models";
import { FriendShipRepository, PostRepository, UserRepository } from "../../../Db/Repositories";
import { BadRequestException, S3ClientServicce } from "../../../Utils";
import { pagination } from "../../../Utils/Pagination/pagination.utils";




class PostService {
    private postRepo = new PostRepository()
    private userRepo = new UserRepository(UserModel)
    private friendshipRepo = new FriendShipRepository(FriendShipModel)
    private s3ClientService = new S3ClientServicce()


    addPost = async (req: Request, res: Response, next: NextFunction) => {
        const { user: { _id } } = (req as IRequest).loggedInUser
        const { description, allowComments, tags } = req.body
        const files = req.files as Express.Multer.File[]

        if (!description && (files && !files.length)) throw new BadRequestException('Post must have either description or attachments')

        let uniqueTags: Types.ObjectId[] = []

        if (tags) {
            const users = await this.userRepo.findDocuments({ _id: { $in: tags } })
            if (users.length !== tags.length) throw new BadRequestException('One or more tags are invalid')

            const friends = await this.friendshipRepo.findDocuments({
                $or: [
                    { requestFromId: _id, requestToId: { $in: tags }, status: 'accepted' },
                    { requestFromId: { $in: tags }, requestToId: _id, status: 'accepted' }
                ]
            })

            if (friends.length !== tags.length) throw new BadRequestException('You can only tag your friends')

            uniqueTags = Array.from(new Set(tags))
        }

        let attachments: string[] = []
        if (files?.length) {
            const uploadData = await this.s3ClientService.uploadFilesOnS3(files, `${_id}/posts`)
            attachments = uploadData.map(({ key }) => key)
        }


        const newPost = await this.postRepo.createNewDocument({
            description,
            attachments,
            ownerId: _id,
            allowComments,
            tags: uniqueTags
        })


        res.status(201).json({ message: 'Post created successfully', post: newPost })


    }



    listHomePages = async (req: Request, res: Response, next: NextFunction) => {
        // const { user: { _id } } = (req as IRequest).loggedInUser
        const { page, limit } = req.query
        const { limit: currentLimit, skip } = pagination({ page: Number(page), limit: Number(limit) })
        const posts = await this.postRepo.postsPagination({}, {})
        res.status(200).json({ message: 'Posts fetched successfully', data: { posts } })
    }
}



export default new PostService()