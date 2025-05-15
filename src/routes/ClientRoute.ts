import { Router } from 'express';
import ClientController from '../controllers/ClientController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/add', authenticate, ClientController.addClient);

export default router;