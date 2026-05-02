import z from 'zod'
import { SignUpValidator } from '../../Validators'

export type SignUpBodyType = z.infer<typeof SignUpValidator.body>
