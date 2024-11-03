import { Router } from 'express'
import { registerUser } from '../controllers/user.controller.js'
const router = Router()

router.route("/register").post(registerUser) //here we are passing the post request

export default router