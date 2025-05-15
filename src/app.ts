import express from 'express';
import userRoutes from './routes/UserRoute';
import clientRoutes from './routes/ClientRoute';
import cookieParser from 'cookie-parser';

const app = express();

// Middleware
app.use(express.json());

app.use(cookieParser());

// Routes
app.use('/user', userRoutes);

app.use('/client', clientRoutes);

export default app;