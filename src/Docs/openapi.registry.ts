import { z } from 'zod'
import {
  objectId,
  SignUpValidator,
  ConfirmEmailValidator,
  SignInValidator,
  SignOutValidator,
  UpdateProfileValidator,
  RenewSignedUrlValidator,
  SendFriendShipRequestValidator,
  RespondToFriendShipRequestValidator,
  CreateGroupValidator,
  CreatePostValidator,
  UpdatePostValidator,
  CreateCommentValidator,
  UpdateCommentValidator,
  UpsertReactValidator,
} from '../Validators'

// Zod validators exposed as reusable OpenAPI component schemas, keyed by component id.
// The id becomes the `#/components/schemas/<id>` name and lets shared pieces (e.g. ObjectId)
// be referenced via $ref instead of being inlined on every request.
const requestSchemas = {
  ObjectId: objectId,

  SignUpBody: SignUpValidator.body,
  ConfirmEmailBody: ConfirmEmailValidator.body,
  SignInBody: SignInValidator.body,
  SignOutBody: SignOutValidator.body,

  UpdateProfileBody: UpdateProfileValidator.body,
  RenewSignedUrlBody: RenewSignedUrlValidator.body,
  SendFriendshipRequestBody: SendFriendShipRequestValidator.body,
  RespondToFriendshipRequestBody: RespondToFriendShipRequestValidator.body,
  CreateGroupBody: CreateGroupValidator.body,

  CreatePostBody: CreatePostValidator.body,
  UpdatePostBody: UpdatePostValidator.body,

  CreateCommentBody: CreateCommentValidator.body,
  UpdateCommentBody: UpdateCommentValidator.body,

  UpsertReactBody: UpsertReactValidator.body,
} as const

export const openApiSchemaRegistry = z.registry<{ id: string }>()

for (const [id, schema] of Object.entries(requestSchemas)) {
  openApiSchemaRegistry.add(schema as z.ZodType, { id })
}
