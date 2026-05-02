import { Model } from "mongoose";
import { IComment } from "../../Common";
import { BaseRepository } from "./base.repository";



export class CommentRepository extends BaseRepository<IComment> {
    constructor(model:Model<IComment>) {
        super(model)
    }
}



