import { Router } from 'express'
import AuthService from '../services/auth.service'
import { authentication, validationMiddleware } from '../../../Middlewares'
import { SignUpValidator } from '../../../Validators'
const authController = Router()

authController.post('/signup', validationMiddleware(SignUpValidator), AuthService.signUp)

authController.post('/confirmEmail', AuthService.confirmEmail)

authController.post('/signin', AuthService.signIn)

authController.post('/signout', authentication, AuthService.signOut)

export { authController }
