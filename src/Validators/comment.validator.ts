import { z } from 'zod'
import { objectId } from './User/auth.validator'

const targetModel = z.enum(['Post', 'Comment'])

export const CreateCommentValidator = {
  body: z
    .strictObject({
      content: z.string().min(1).optional(),
      attachments: z.string().min(1).optional(),
      refId: objectId,
      onModel: targetModel,
    })
    .refine((value) => value.content !== undefined || value.attachments !== undefined, 'A comment must have content or an attachment'),
}

export const ListCommentsValidator = {
  params: z.strictObject({
    onModel: targetModel,
    refId: objectId,
  }),
}

export const UpdateCommentValidator = {
  params: z.strictObject({
    commentId: objectId,
  }),
  body: z.strictObject({
    content: z.string().min(1).optional(),
    attachments: z.string().min(1).optional(),
  }).refine((value) => Object.keys(value).length > 0, 'Nothing to update'),
}

export const DeleteCommentValidator = {
  params: z.strictObject({
    commentId: objectId,
  }),
}
