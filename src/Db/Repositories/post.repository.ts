import { FilterQuery, PaginateOptions } from "mongoose";
import { IPost } from "../../Common";
import { BaseRepository } from "./base.repository";
import { PostModel } from "../Models";



export class PostRepository extends BaseRepository<IPost> {
    constructor() {
        super(PostModel)
    }

    async countDocuments(){
        return await PostModel.countDocuments()
    }

    async postsPagination(filters?:FilterQuery<IPost>, options?:PaginateOptions) {
        return await PostModel.paginate(filters, options)
    }
}