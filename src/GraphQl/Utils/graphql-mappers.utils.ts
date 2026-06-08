import { Types } from 'mongoose'

import { CommentModel, MessageModel, ReactModel } from '../../Db/Models'

const publicUserFields = 'firstName lastName profilePicture coverPicture'
const privateUserFields = 'firstName lastName email gender DOB profilePicture coverPicture phoneNumber isVerified'

export const graphQLPublicUserPopulateFields = publicUserFields
export const graphQLPrivateUserPopulateFields = privateUserFields

export const toObjectId = (id: string) => new Types.ObjectId(id)

export const toDateString = (value: unknown) => (value instanceof Date ? value.toISOString() : value?.toString())

export const toGraphQLUser = (user: any, includePrivateFields = false) => {
  if (!user) return null

  const publicUser = {
    id: user._id?.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    profilePicture: user.profilePicture,
    coverPicture: user.coverPicture,
  }

  if (!includePrivateFields) return publicUser

  return {
    ...publicUser,
    email: user.email,
    gender: user.gender,
    DOB: toDateString(user.DOB),
    phoneNumber: user.phoneNumber,
    isVerified: user.isVerified,
  }
}

export const getReactSummary = async (refId: string, onModel: 'Post' | 'Comment') => {
  const reactCounts = await ReactModel.aggregate([
    { $match: { refId: toObjectId(refId), onModel } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $project: { _id: 0, type: '$_id', count: 1 } },
  ])

  const summary = {
    like: 0,
    love: 0,
    haha: 0,
    sad: 0,
    angry: 0,
    total: 0,
  }

  for (const reactCount of reactCounts) {
    if (reactCount.type in summary) {
      summary[reactCount.type as keyof typeof summary] = reactCount.count
      summary.total += reactCount.count
    }
  }

  return summary
}

export const getMyReact = async (currentUserId: string, refId: string, onModel: 'Post' | 'Comment') => {
  const react = await ReactModel.findOne({
    ownerId: currentUserId,
    refId,
    onModel,
  }).lean()

  return react?.type || null
}

type ReactSummary = {
  like: number
  love: number
  haha: number
  sad: number
  angry: number
  total: number
}

export type GraphQLPostMetrics = {
  commentsCount?: number
  reactsSummary?: ReactSummary
  myReact?: string | null
}

export const toGraphQLComment = async (comment: any, currentUserId: string) => {
  const commentId = comment._id.toString()

  return {
    id: commentId,
    content: comment.content,
    attachments: comment.attachments,
    owner: toGraphQLUser(comment.ownerId),
    refId: comment.refId?.toString(),
    onModel: comment.onModel,
    reactsSummary: await getReactSummary(commentId, 'Comment'),
    myReact: await getMyReact(currentUserId, commentId, 'Comment'),
    createdAt: toDateString(comment.createdAt),
  }
}

export const getPostComments = async (postId: string, currentUserId: string) => {
  const comments = await CommentModel.find({ refId: postId, onModel: 'Post' })
    .populate('ownerId', publicUserFields)
    .sort({ createdAt: -1 })
    .lean()

  return await Promise.all(comments.map((comment) => toGraphQLComment(comment, currentUserId)))
}

export const toGraphQLPost = async (post: any, currentUserId: string, includeComments = false, metrics?: GraphQLPostMetrics) => {
  const postId = post._id.toString()

  return {
    id: postId,
    description: post.description,
    attachments: post.attachments || [],
    owner: toGraphQLUser(post.ownerId),
    allowComments: post.allowComments,
    tags: (post.tags || []).map((tag: any) => toGraphQLUser(tag)).filter(Boolean),
    commentsCount: metrics?.commentsCount ?? await CommentModel.countDocuments({ refId: postId, onModel: 'Post' }),
    reactsSummary: metrics?.reactsSummary ?? await getReactSummary(postId, 'Post'),
    myReact: metrics?.myReact ?? await getMyReact(currentUserId, postId, 'Post'),
    comments: includeComments ? await getPostComments(postId, currentUserId) : [],
    createdAt: toDateString(post.createdAt),
  }
}

export const toGraphQLConversation = async (conversation: any) => {
  const lastMessage = await MessageModel.findOne({ conversationId: conversation._id })
    .populate('senderId', publicUserFields)
    .sort({ createdAt: -1 })
    .lean()

  const message = lastMessage as any

  return {
    id: conversation._id.toString(),
    type: conversation.type,
    name: conversation.name,
    members: (conversation.members || []).map((member: any) => toGraphQLUser(member)).filter(Boolean),
      lastMessage: message
        ? {
          id: message._id.toString(),
          text: message.text,
          sender: toGraphQLUser(message.senderId),
          createdAt: toDateString(message.createdAt),
        }
      : null,
    createdAt: toDateString(conversation.createdAt),
    updatedAt: toDateString(conversation.updatedAt),
  }
}
