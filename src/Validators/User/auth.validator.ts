import { isValidObjectId } from 'mongoose'
import z from 'zod'
import { GenderEnum } from '../../Common'

export const SignUpValidator = {
  body: z
    .strictObject({
      firstName: z.string().min(3),
      lastName: z.string().min(3),
      email: z.string().email(),
      password: z.string().min(6),
      passwordConfirmation: z.string().min(6),
      gender: z.enum(GenderEnum),
      DOB: z.date().optional(),
      phoneNumber: z.string().min(11).max(11),
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
