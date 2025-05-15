import express from 'express';
import userRoutes from './routes/UserRoute';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/user', userRoutes);
app.get('/', (req, res) => {
    res.send('Hello World!');
  });

export default app;