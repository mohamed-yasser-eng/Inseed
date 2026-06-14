import { z } from 'zod'
import { objectId } from './User/auth.validator'

const stringArrayFromBody = z.preprocess((value) => {
  if (value === undefined) return undefined
  return Array.isArray(value) ? value : [value]
}, z.array(objectId).optional())

export const CreatePostValidator = {
  body: z.object({
    description: z.string().min(1).optional(),
    allowComments: z.stringbool().optional(),
    tags: stringArrayFromBody,
  }).strict(),
}

export const UpdatePostValidator = {
  params: z.strictObject({
    postId: objectId,
  }),
  body: z.object({
    description: z.string().min(1).optional(),
    allowComments: z.stringbool().optional(),
    tags: stringArrayFromBody,
    removeAttachments: z.preprocess((value) => {
      if (value === undefined) return undefined
      return Array.isArray(value) ? value : [value]
    }, z.array(z.string().min(1)).optional()),
  }).strict(),
}

export const PostIdParamsValidator = {
  params: z.strictObject({
    postId: objectId,
  }),
}

export const ListHomePostsValidator = {
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }).strict(),
}

export const UserPostsParamsValidator = {
  params: z.strictObject({
    userId: objectId,
  }),
  query: ListHomePostsValidator.query,
}
