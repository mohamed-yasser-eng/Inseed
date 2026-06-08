import { Types } from 'mongoose'
import { CommentModel, PostModel, ReactModel } from '../../Db/Models'
import { GraphQLContext, requireGraphQLUser } from '../context'
import { GraphQLPostMetrics, graphQLPublicUserPopulateFields, toGraphQLPost } from '../Utils'

const emptyReactSummary = () => ({
  like: 0,
  love: 0,
  haha: 0,
  sad: 0,
  angry: 0,
  total: 0,
})

const normalizeFeedPagination = (args: { page?: number; limit?: number }) => {
  const page = Math.max(1, Number(args.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(args.limit) || 10))
  const skip = (page - 1) * limit

  return { limit, skip }
}

class PostResolvers {
  feed = async (_parent: unknown, args: { page?: number; limit?: number }, context: GraphQLContext) => {
    const currentUserId = requireGraphQLUser(context)
    const { limit, skip } = normalizeFeedPagination(args)
    const posts = await PostModel.find({})
      .populate('ownerId', graphQLPublicUserPopulateFields)
      .populate('tags', graphQLPublicUserPopulateFields)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const postIds = posts.map((post) => post._id)

    const [commentCounts, reactCounts, myReacts] = await Promise.all([
      CommentModel.aggregate([
        { $match: { refId: { $in: postIds }, onModel: 'Post' } },
        { $group: { _id: '$refId', count: { $sum: 1 } } },
      ]),
      ReactModel.aggregate([
        { $match: { refId: { $in: postIds }, onModel: 'Post' } },
        { $group: { _id: { refId: '$refId', type: '$type' }, count: { $sum: 1 } } },
      ]),
      ReactModel.find({
        ownerId: new Types.ObjectId(currentUserId),
        refId: { $in: postIds },
        onModel: 'Post',
      }).lean(),
    ])

    const metricsByPostId = new Map<string, GraphQLPostMetrics>()
    for (const post of posts) metricsByPostId.set(post._id.toString(), { commentsCount: 0, reactsSummary: emptyReactSummary(), myReact: null })

    for (const commentCount of commentCounts) {
      const metrics = metricsByPostId.get(commentCount._id.toString())
      if (metrics) metrics.commentsCount = commentCount.count
    }

    for (const reactCount of reactCounts) {
      const metrics = metricsByPostId.get(reactCount._id.refId.toString())
      if (!metrics?.reactsSummary) continue

      const type = reactCount._id.type as keyof ReturnType<typeof emptyReactSummary>
      if (type in metrics.reactsSummary && type !== 'total') {
        metrics.reactsSummary[type] = reactCount.count
        metrics.reactsSummary.total += reactCount.count
      }
    }

    for (const react of myReacts) {
      const metrics = metricsByPostId.get(react.refId.toString())
      if (metrics) metrics.myReact = react.type
    }

    return await Promise.all(posts.map((post) => toGraphQLPost(post, currentUserId, false, metricsByPostId.get(post._id.toString()))))
  }

  postDetails = async (_parent: unknown, args: { postId: string }, context: GraphQLContext) => {
    const currentUserId = requireGraphQLUser(context)
    const post = await PostModel.findById(args.postId)
      .populate('ownerId', graphQLPublicUserPopulateFields)
      .populate('tags', graphQLPublicUserPopulateFields)
      .lean()

    if (!post) return null

    return await toGraphQLPost(post, currentUserId, true)
  }
}

export default PostResolvers
