import { Request, Response } from 'express'
import { SignOptions } from 'jsonwebtoken'
import * as uuid from 'uuid'
import { IRequest, IUser, OtpTypesEnum, SignUpBodyType } from '../../../Common'
import { BlackListedTokenModel, UserModel } from '../../../Db/Models'
import { BlackListedTokenRepository, UserRepository } from '../../../Db/Repositories'
import { compareHash, encrypt, generateHash, generateToken } from '../../../Utils'
import { ConflictException } from '../../../Utils/Errors/exceptions.utils'
import { SuccessResponse } from '../../../Utils/Response/response-helper.utils'
import { localEventEmitter } from '../../../Utils/Services/email.utils'

class AuthService {
  private userRepository: UserRepository = new UserRepository(UserModel)
  private blackListedTokenRepository: BlackListedTokenRepository = new BlackListedTokenRepository(BlackListedTokenModel)

  signUp = async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, gender, phoneNumber, DOB }: SignUpBodyType = req.body

    const isEmailExist = await this.userRepository.findOneDocument({ email }, 'email')
    if (isEmailExist) throw new ConflictException('Email already exists, please try with another email.', { invalidEmail: email })

    //encrypt phone number

    const encryptedPhoneNumber = encrypt(phoneNumber as string)

    //hash password
    const hashedPassword = generateHash(password as string)

    //send otp
    const OTP = Math.floor(100000 + Math.random() * 900000).toString()
    localEventEmitter.emit('sendEmail', {
      to: email as string,
      subject: 'Verify your email with the OTP',
      content: `Your OTP is ${OTP}.`,
    })

    const confirmationOtp = {
      value: generateHash(OTP),
      expiresAt: Date.now() + 600000, //otp expires in 10 minutes from now
      OTPType: OtpTypesEnum.EMAIL_VERIFICATION,
    }

    const newUser = await this.userRepository.createNewDocument({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      gender,
      DOB,
      phoneNumber: encryptedPhoneNumber,
      OTPS: [confirmationOtp],
    })

    return res.status(201).json(SuccessResponse<IUser>('User registered successfully, please verify your email', 201, newUser))
  }

  confirmEmail = async (req: Request, res: Response) => {
    const { email, otp } = req.body

    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' })

    const user: IUser | null = await this.userRepository.findOneDocument({
      email,
    })

    if (!user) return res.status(404).json({ message: 'email doesnt exist in our records' })

    if (user.isVerified) return res.status(400).json({ message: 'Email is already verified' })

    const emailOtp = user.OTPS?.find((o) => o.OTPType === OtpTypesEnum.EMAIL_VERIFICATION)

    if (!emailOtp) {
      return res.status(400).json({ message: 'Verification OTP not found' })
    }

    if (Date.now() > emailOtp.expiresAt) {
      return res.status(400).json({
        message: 'OTP has expired',
      })
    }

    const isOtpValid = compareHash(otp, emailOtp.value)

    if (!isOtpValid) {
      return res.status(400).json({
        message: 'Invalid OTP',
      })
    }

    user.isVerified = true

    // remove used OTP
    user.OTPS = user.OTPS?.filter((o) => o.OTPType !== OtpTypesEnum.EMAIL_VERIFICATION)

    await user.save()

    return res.status(200).json({
      message: 'Email verified successfully',
    })
  }

  signIn = async (req: Request, res: Response) => {
    const { email, password } = req.body

    const user: IUser | null = await this.userRepository.findOneDocument({
      email,
    })
    if (!user) return res.status(401).json({ message: 'User not found, please signup first.' })

    const isPasswordMatched = compareHash(password, user.password as string)
    if (!isPasswordMatched) return res.status(401).json({ message: 'Invalid credentials, please try again.' })

    const accessToken = generateToken(
      {
        _id: user._id,
        email: user.email,
        firstName:user.firstName,
        lastName:user.lastName,
        provider: user.provider,
        role: user.role,
      },
      process.env.JWT_ACCESS_SECRET as string,
      {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
        jwtid: uuid.v4(),
      },
    )

    const refreshToken = generateToken(
      {
        _id: user._id,
        email: user.email,
        provider: user.provider,
        role: user.role,
      },
      process.env.JWT_REFRESH_SECRET as string,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
        jwtid: uuid.v4(),
      },
    )

    return res.status(200).json({
      message: 'User signed in successfully',
      data: { accessToken, refreshToken },
    })
  }

  signOut = async (req: Request, res: Response) => {
    const {
      token: { jti, exp },
    } = (req as unknown as IRequest).loggedInUser
    const blackListedToken = await this.blackListedTokenRepository.createNewDocument({
      tokenId: jti,
      expiresAt: new Date(exp || Date.now() + 600000),
    })
    res.status(200).json({
      message: 'User signed out successfully',
      data: { blackListedToken },
    })
  }
}

export default new AuthService()
