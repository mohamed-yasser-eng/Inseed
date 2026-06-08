import { CommentModel, ReactModel } from '../../Db/Models'

export const collectCommentTreeIds = async (initialCommentIds: string[]) => {
  const allCommentIds = new Set(initialCommentIds)
  let queue = [...initialCommentIds]

  while (queue.length) {
    const childComments = await CommentModel.find({
      onModel: 'Comment',
      refId: { $in: queue },
    }).select('_id')

    const newIds = childComments
      .map((comment) => comment._id.toString())
      .filter((id) => !allCommentIds.has(id))

    newIds.forEach((id) => allCommentIds.add(id))
    queue = newIds
  }

  return Array.from(allCommentIds)
}

export const deleteCommentTree = async (initialCommentIds: string[]) => {
  const commentIds = await collectCommentTreeIds(initialCommentIds)
  if (!commentIds.length) return commentIds

  await ReactModel.deleteMany({ refId: { $in: commentIds }, onModel: 'Comment' })
  await CommentModel.deleteMany({ _id: { $in: commentIds } })

  return commentIds
}
