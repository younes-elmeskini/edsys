import { Router } from 'express';
import UserController from '../controllers/UserController';



const router = Router();
router.post('/adduser', UserController.createUser);
// router.post('/adduser', (req, res, next) => UserController.createUser(req, res, next));
router.post('/login', UserController.login);
// GET /users
router.post('/logout', UserController.logout);
router.get('/users', UserController.getUser);


export default router;