import { PostModel } from '../../Db/Models'
import { GraphQLContext, requireGraphQLUser } from '../context'
import { graphQLUserPopulateFields, toGraphQLPost } from '../Utils'

class PostResolvers {
  feed = async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    const currentUserId = requireGraphQLUser(context)
    const posts = await PostModel.find({})
      .populate('ownerId', graphQLUserPopulateFields)
      .populate('tags', graphQLUserPopulateFields)
      .sort({ createdAt: -1 })
      .lean()

    return await Promise.all(posts.map((post) => toGraphQLPost(post, currentUserId)))
  }

  postDetails = async (_parent: unknown, args: { postId: string }, context: GraphQLContext) => {
    const currentUserId = requireGraphQLUser(context)
    const post = await PostModel.findById(args.postId)
      .populate('ownerId', graphQLUserPopulateFields)
      .populate('tags', graphQLUserPopulateFields)
      .lean()

    if (!post) return null

    return await toGraphQLPost(post, currentUserId, true)
  }
}

export default PostResolvers
