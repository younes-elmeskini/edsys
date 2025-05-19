import { Router } from 'express';
import UserController from '../controllers/UserController';
import { authenticate } from '../middlewares/auth';



const router = Router();

router.post('/login', UserController.login);
router.post('/create', UserController.createUser);
router.post('/logout', UserController.logout);
router.post('/forgotpassword', UserController.forgetPassword);
router.post('/resetpassword', UserController.resetPassword);
// GET 
router.get('/users',authenticate, UserController.getUser);
router.get('/me',authenticate, UserController.userData);



export default router;