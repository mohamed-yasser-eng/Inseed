import { isValidObjectId } from 'mongoose'
import z from 'zod'
import { GenderEnum } from '../../Common'

const objectId = z.string().refine((value) => isValidObjectId(value), 'invalid object id').meta({ description: 'MongoDB ObjectId (24-character hex string)' })

export const SignUpValidator = {
  body: z
    .strictObject({
      firstName: z.string().min(3),
      lastName: z.string().min(3),
      email: z.email(),
      password: z.string().min(6),
      passwordConfirmation: z.string().min(6),
      gender: z.enum(GenderEnum),
      DOB: z.iso.date().optional(),
      phoneNumber: z.string().regex(/^\d{11}$/, 'phone number must be exactly 11 digits'),
      userId: z.string().optional(),
    })
    .superRefine((val, cxt) => {
      if (val.password !== val.passwordConfirmation) {
        cxt.addIssue({
          code: z.ZodIssueCode.custom,
          message: `passwords do not matchh`,
          path: ['passwordConfirmation'],
        })
      }

      if (val.userId && !isValidObjectId(val.userId)) {
        cxt.addIssue({
          code: z.ZodIssueCode.custom,
          message: `invalid user id`,
          path: ['userId'],
        })
      }
    }),
}

export const ConfirmEmailValidator = {
  body: z.strictObject({
    email: z.email(),
    otp: z.string().length(6),
  }),
}

export const SignInValidator = {
  body: z.strictObject({
    email: z.email(),
    password: z.string().min(6),
  }),
}

export const RefreshTokenValidator = {
  headers: z.object({
    authorization: z.string().min(1),
  }).passthrough(),
}

export const SignOutValidator = {
  body: z.strictObject({
    refreshToken: z.string().min(1),
  }),
}

export { objectId }
