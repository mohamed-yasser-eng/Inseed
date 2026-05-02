import mongoose from 'mongoose'
import { GenderEnum, IUser, OtpTypesEnum, ProviderEnum, RoleEnum } from '../../Common'

const userSchema = new mongoose.Schema<IUser>({
  firstName: {
    type: String,
    required: true,
    minLength: [3, 'First name must be at least 3 characters long'],
    maxLength: [20, 'First name must be at most 20 characters long'],
  },
  lastName: {
    type: String,
    required: true,
    minLength: [3, 'Last name must be at least 3 characters long'],
    maxLength: [20, 'Last name must be at most 20 characters long'],
  },
  email: {
    type: String,
    required: true,
    index: {
      unique: true,
      name: 'idx_email_unique',
    },
  },
  password: {
    type: String,
    required: true,
    minLength: [6, 'Password must be at least 6 characters long'],
  },
  role: {
    type: String,
    enum: RoleEnum,
    default: RoleEnum.USER,
  },
  gender: {
    type: String,
    enum: GenderEnum,
    default: GenderEnum.OTHER,
  },
  DOB: Date,
  profilePicture: String,
  coverPicture: String,
  provider: {
    type: String,
    enum: ProviderEnum,
    default: ProviderEnum.LOCAL,
  },
  googleId: String,
  phoneNumber: String,
  isVerified: Boolean,
  OTPS: [
    {
      value: { type: String, required: true },
      expiredAt: { type: Date, default: Date.now() + 600000 }, //otp expires in 10 minutes from now
      OTPType: { type: String, enum: OtpTypesEnum, required: true },
    },
  ],
})

const UserModel = mongoose.model<IUser>('User', userSchema)
export { UserModel }
