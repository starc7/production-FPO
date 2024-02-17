import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import morgan from 'morgan';
import authRoutes from './routes/authRoute.js';
import productRoute from './routes/productRoute.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import ExpressFormidable from 'express-formidable';


const app = express();
dotenv.config();
connectDB()

//ES MODULE
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, './client/build')))

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/product', productRoute);

const PORT = process.env.PORT || 8080;

app.use('*', function(req, res) {
    res.sendFile(path.join(__dirname, './client/build/index.html'))
})

app.listen(PORT, () => {
    console.log(`Backend is listening to the ${PORT}`)
});