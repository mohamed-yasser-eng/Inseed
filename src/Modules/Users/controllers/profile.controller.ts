import { Router } from 'express'
import { authentication, Multer } from '../../../Middlewares'
import profileService from '../services/profile.service'

const profileController = Router()

//update profile
profileController.put('/update-profile', authentication, profileService.updateProfile)

//delete profile
profileController.delete('/delete-account', authentication, profileService.deletAccount)

//get profile data
// profileController.get("/profile-data",authentication,profileService.getProfileData)

//upload profile picture
profileController.post('/profile-picture', authentication, Multer().single('profilePicture'), profileService.uploadProfilePicture)

//renew signed url
profileController.post('/renew-signed-url', authentication, profileService.renewSignedUrl)

//upload cover picture
// profileController.post("/cover-picture",authentication,Multer().single("coverPicture"),profileService.uploadCoverPicture)

// list all users
// profileController.get("/users",authentication,profileService.listUsers)

// send friendship request
profileController.post('/send-friendship-request', authentication, profileService.sendFriendShipRequest)

//list friendship requests
profileController.get('/list-friendship-requests', authentication, profileService.listRequests)

//respond to friendship request
profileController.patch('/respond-to-friendship-request', authentication, profileService.respondToFriendShipRequest)


profileController.post('/create-group', authentication, profileService.createGroup)

export { profileController }
