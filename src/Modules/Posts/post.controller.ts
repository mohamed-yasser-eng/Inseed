import { Router } from 'express'
import { authentication, Multer } from '../../Middlewares'
import postService from './services/post.service'
const postController = Router()

// add post 
postController.post('/add-post',authentication ,Multer().array('files',3),postService.addPost) 

//update post 


//delete post 



//get home posts
postController.get('/home', authentication, postService.listHomePages)

// get user posts


//social-app {{accessToken}}



export { postController }
