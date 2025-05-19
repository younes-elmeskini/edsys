import { Router } from 'express';
import ClientController from '../controllers/ClientController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/add',authenticate, ClientController.addClient);
router.get('/',authenticate, ClientController.getClient);
router.get('/stats',authenticate, ClientController.getStats);
router.put('/:clientId',authenticate, ClientController.updateClient);
router.delete('/:clientId',authenticate, ClientController.deleteClient);


export default router;