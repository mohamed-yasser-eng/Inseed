import { Request, Response } from 'express'
import { SignOptions } from 'jsonwebtoken'
import * as uuid from 'uuid'
import { IRequest, IUser, OtpTypesEnum, SignUpBodyType } from '../../../Common'
import { BlackListedTokenModel, UserModel } from '../../../Db/Models'
import { BlackListedTokenRepository, UserRepository } from '../../../Db/Repositories'
import { compareHash, encrypt, generateHash, generateToken, verifyToken } from '../../../Utils'
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '../../../Utils/Errors/exceptions.utils'
import { SuccessResponse } from '../../../Utils/Response/response-helper.utils'
import { localEventEmitter } from '../../../Utils/Services/email.utils'

class AuthService {
  private userRepository: UserRepository = new UserRepository(UserModel)
  private blackListedTokenRepository: BlackListedTokenRepository = new BlackListedTokenRepository(BlackListedTokenModel)

  private toAuthUserResponse(user: IUser) {
    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      gender: user.gender,
      DOB: user.DOB,
      profilePicture: user.profilePicture,
      coverPicture: user.coverPicture,
      provider: user.provider,
      role: user.role,
      isVerified: user.isVerified,
    }
  }

  private async blacklistToken(tokenId: string | undefined, expiresAt: Date) {
    if (!tokenId) throw new UnauthorizedException('Invalid token payload')

    await this.blackListedTokenRepository.updateDocumentById(
      { tokenId },
      { tokenId, expiresAt },
      { upsert: true, setDefaultsOnInsert: true },
    )
  }

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
      expiresAt: new Date(Date.now() + 600000), //otp expires in 10 minutes from now
      OTPType: OtpTypesEnum.EMAIL_VERIFICATION,
    }

    const newUser = await this.userRepository.createNewDocument({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      gender,
      DOB: DOB ? new Date(DOB) : undefined,
      phoneNumber: encryptedPhoneNumber,
      OTPS: [confirmationOtp],
    })

    return res.status(201).json(SuccessResponse('User registered successfully, please verify your email', 201, this.toAuthUserResponse(newUser)))
  }

  confirmEmail = async (req: Request, res: Response) => {
    const { email, otp } = req.body

    if (!email || !otp) throw new BadRequestException('Email and OTP are required')

    const user: IUser | null = await this.userRepository.findOneDocument({
      email,
    })

    if (!user) throw new NotFoundException('email doesnt exist in our records')

    if (user.isVerified) throw new BadRequestException('Email is already verified')

    const emailOtp = user.OTPS?.find((o) => o.OTPType === OtpTypesEnum.EMAIL_VERIFICATION)

    if (!emailOtp) {
      throw new BadRequestException('Verification OTP not found')
    }

    if (Date.now() > emailOtp.expiresAt.getTime()) {
      throw new BadRequestException('OTP has expired')
    }

    const isOtpValid = compareHash(otp, emailOtp.value)

    if (!isOtpValid) {
      throw new BadRequestException('Invalid OTP')
    }

    user.isVerified = true

    // remove used OTP
    user.OTPS = user.OTPS?.filter((o) => o.OTPType !== OtpTypesEnum.EMAIL_VERIFICATION)

    await user.save()

    return res.status(200).json(SuccessResponse('Email verified successfully', 200))
  }

  signIn = async (req: Request, res: Response) => {
    const { email, password } = req.body

    const user: IUser | null = await this.userRepository.findOneDocument({
      email,
    })
    if (!user) throw new UnauthorizedException('User not found, please signup first.')

    const isPasswordMatched = compareHash(password, user.password as string)
    if (!isPasswordMatched) throw new UnauthorizedException('Invalid credentials, please try again.')
    if (!user.isVerified) throw new UnauthorizedException('Please verify your email before signing in.')

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

    return res.status(200).json(SuccessResponse('User signed in successfully', 200, { accessToken, refreshToken }))
  }


  
  refreshToken = async (req: Request, res: Response) => {
    const { authorization } = req.headers
    if (!authorization) throw new UnauthorizedException('Refresh token is required')

    const [Prefix, token] = authorization.split(' ')
    if (Prefix !== process.env.JWT_PREFIX || !token) throw new UnauthorizedException('Invalid refresh token format')

    let decodedData
    try {
      decodedData = verifyToken(token, process.env.JWT_REFRESH_SECRET as string)
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }
    if (!decodedData._id) throw new UnauthorizedException('Invalid refresh token payload')

    const blackListedToken = await this.blackListedTokenRepository.findOneDocument({ tokenId: decodedData.jti })
    if (blackListedToken) throw new UnauthorizedException('User session expired, login again.')

    const user: IUser | null = await this.userRepository.findDocumentById(decodedData._id, '-password')
    if (!user) throw new NotFoundException('User not found, please signup first.')

    const accessToken = generateToken(
      {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        provider: user.provider,
        role: user.role,
      },
      process.env.JWT_ACCESS_SECRET as string,
      {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
        jwtid: uuid.v4(),
      },
    )

    return res.status(200).json(SuccessResponse('Access token refreshed successfully', 200, { accessToken }))
  }

  signOut = async (req: Request, res: Response) => {
    const {
      user,
      token: { jti, exp },
    } = (req as unknown as IRequest).loggedInUser
    const { refreshToken } = req.body

    let decodedRefreshToken
    try {
      decodedRefreshToken = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET as string)
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token')
    }

    if (decodedRefreshToken._id !== user._id.toString()) throw new UnauthorizedException('Refresh token does not belong to the current user')

    const accessTokenExpiresAt = exp ? new Date(exp * 1000) : new Date(Date.now() + 600000)
    const refreshTokenExpiresAt = decodedRefreshToken.exp ? new Date(decodedRefreshToken.exp * 1000) : new Date(Date.now() + 600000)

    await this.blacklistToken(jti, accessTokenExpiresAt)
    await this.blacklistToken(decodedRefreshToken.jti, refreshTokenExpiresAt)

    res.status(200).json(SuccessResponse('User signed out successfully', 200))
  }
}

export default new AuthService()
