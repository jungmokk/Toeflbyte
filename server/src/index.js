import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/apiRoutes.js';
import mcpService from './services/mcpService.js';
import googlePlayService from './services/googlePlayService.js';
import { initCronJobs } from './services/cronService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());


// Initialize External Services
googlePlayService.init();
mcpService.init().catch(err => console.error("RAG Init Fail:", err));
initCronJobs();

// Routes
app.use('/api', apiRoutes);

// Health Check for Deployment (Render/AWS/Vercel)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.send('TOEFL Byte API Server is Running (Production Mode)');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} as ${process.env.NODE_ENV || 'development'}`);
});
