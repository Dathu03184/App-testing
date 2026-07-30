require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);

// Configure CORS for local web dev and cross origin requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database connection hook
connectDB();

// Mount routes compatible with iOS client structure
app.use('/nuero_api', apiRoutes);

// Root server route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'NeuroPredict Backend Server',
    health: '/health',
    api_base: '/nuero_api'
  });
});

// General health check
app.get('/health', (req, res) => {
  let dbStatus = 'Local File JSON Fallback';
  if (global.isMySQL) dbStatus = 'MySQL (Shared iOS DB)';
  else if (global.isMongo) dbStatus = 'MongoDB';

  res.json({
    status: 'online',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Configure Socket.io server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Join patient room for scoped synchronization
  socket.on('join_patient', (patientId) => {
    socket.join(`patient_${patientId}`);
    console.log(`👤 Client joined room: patient_${patientId}`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Store io in express app context
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🏥 Health Check: http://172.25.87.126:${PORT}/health`);
  console.log(`📡 Base API URL: http://172.25.87.126:${PORT}/nuero_api`);
});
