import { Router } from 'express';
import ClientController from '../controllers/ClientController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/add', ClientController.addClient);
router.put('/:clientId', ClientController.updateClient);
router.get('/', ClientController.getClient);


export default router;