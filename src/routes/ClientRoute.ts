import { Router } from 'express';
import ClientController from '../controllers/ClientController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/add', ClientController.addClient);
router.get('/', ClientController.getClient);
router.get('/stats', ClientController.getStats);
router.put('/:clientId', ClientController.updateClient);
router.delete('/:clientId', ClientController.deleteClient);


export default router;